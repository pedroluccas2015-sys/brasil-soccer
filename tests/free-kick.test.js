'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
const B=BSS,F=B.FIELD,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();const make=(o={})=>new B.Match(d.teams[0],d.teams[1],{seed:26,...o});
const input=(pressed={},axis={x:0,y:0},state={})=>({pressed,axis,state,released:{}});
const special=(o={})=>{const m=make(o);m.setRestart('FALTA',0,F.w-230,F.cy);return m;};
test('faltas: limite do campo de ataque, ambos os times, controle humano e dois tempos',()=>{
 for(const human of [0,1])for(const half of [1,2])for(const side of [0,1])for(const delta of [-.01,0,.01]){
  const m=make({human});if(half===2)m.resumeHalf();const dir=m.teams[side].dir,x=F.cx+dir*delta;m.setRestart('FALTA',side,x,50);
  assert.equal(m.state,delta<0?'restart':'freeKick');assert.equal(!!m.freeKick,delta>=0);
 }
 for(const type of ['LATERAL','ESCANTEIO','IMPEDIMENTO','TIRO DE META']){const m=make();m.setRestart(type,0,900,60);assert.equal(m.state,'restart');assert.equal(m.freeKick,null);}
});
test('faltas: fora da faixa mantém cobrança normal por passe',()=>{
 for(const x of [100,F.cx-1,F.cx-100,F.cx-.01]){const m=make();m.setRestart('FALTA',0,x,340);m.timer=0;m.pass(m.restart.taker,'pass',.5,{x:1,y:0});assert.equal(m.state,'play');assert.ok(m.ball.pass);}
});
test('faltas: falta real ativa o mecanismo; grande área continua sendo pênalti',()=>{
 for(const x of [F.w-250,F.w-140]){const m=make(),p=m.teams[1].players[1],q=m.teams[0].players[9];m.state='play';p.x=x;p.y=F.cy;q.x=x+18;q.y=F.cy;m.ball.reset(200,100);m.tackle(p,true);assert.equal(m.state,x===F.w-250?'freeKick':'penalty');}
});
test('faltas: três confirmações, sem repetir por botão segurado e relógio congelado na preparação',()=>{
 const m=special(),f=m.freeKick,clock=m.clock;m.update(.6,input());m.update(.1,input({shoot:true},{x:.5,y:-.5},{shoot:true}));assert.equal(f.phase,'power');
 for(let i=0;i<60;i++)m.update(1/60,input({},undefined,{shoot:true}));assert.equal(f.phase,'power');assert.equal(m.clock,clock);
 for(const phase of ['curve','runup']){m.update(.01,input());m.update(.01,input({shoot:true}));assert.equal(f.phase,phase);}
 for(let i=0;i<30&&m.state==='freeKick';i++)m.update(1/60,input());assert.equal(m.state,'play');assert.equal(f.phase,'flight');assert.equal(m.teams[0].stats.shots,1);assert.ok(m.ball.vx>0);assert.equal(m.restart,null);
});
test('faltas: passe curto sai do modo especial sem registrar chute',()=>{
 const m=special();m.update(.6,input());m.update(.01,input({pass:true}));assert.equal(m.state,'play');assert.equal(m.freeKick,null);assert.ok(m.ball.pass);assert.equal(m.teams[0].stats.shots,0);
});
test('faltas: barreira tem atletas distintos, elegíveis e afastados da bola',()=>{
 const m=make();m.teams[1].players[1].red=true;m.setRestart('FALTA',0,F.w-230,F.cy);const f=m.freeKick;
 assert.equal(f.wall.length,3);assert.equal(new Set(f.wall).size,3);assert.ok(f.wall.every(p=>!p.red&&p.role!=='GK'&&B.dist(p,f.origin)>=91.49));assert.equal(m.ball.owner,null);
});
test('faltas: efeito curva a trajetória em sentidos opostos e força altera velocidade',()=>{
 const end=curve=>{const m=special(),f=m.freeKick;f.wall=[];f.curve=curve;f.launch(m);for(let i=0;i<20;i++){m.ball.update(1/60);f.afterBall(m,1/60);}return m.ball.y;};assert.ok(end(-.7)<end(0));assert.ok(end(.7)>end(0));
 const f=special().freeKick;f.power=.2;const slow=Math.hypot(f.trajectory().vx,f.trajectory().vy);f.power=.9;assert.ok(Math.hypot(f.trajectory().vx,f.trajectory().vy)>slow);
});
test('faltas: colisão varrida bloqueia chute rasteiro e permite bola acima da barreira',()=>{
 for(const high of [false,true]){const m=special(),f=m.freeKick;f.launch(m);f.dipping=false;const p=f.wall[0],b=m.ball;Object.assign(b,{px:p.x-20,py:p.y,x:p.x+20,y:p.y,pz:high?60:1,z:high?60:1,vx:450,vy:0});f.afterBall(m,1/30);assert.equal(m.freeKick===null,!high);if(!high){assert.ok(b.vx<0);assert.equal(b.lastTouch,p);assert.equal(m.state,'play');}}
});
test('faltas: gols, defesas e bolas para fora usam regras da partida normal',()=>{
 for(const outcome of ['goal','out','save']){const m=special(),f=m.freeKick;f.launch(m);const b=m.ball;
  if(outcome==='save'){b.owner=f.keeper;f.afterBall(m,1/60);assert.equal(m.freeKick,null);assert.equal(m.state,'play');}
  else{Object.assign(b,{px:F.w-2,x:F.w+4,py:outcome==='goal'?F.cy:F.cy+110,y:outcome==='goal'?F.cy:F.cy+110,pz:10,z:10});m.boundaries();assert.equal(m.state,outcome==='goal'?'goal':'restart');assert.equal(m.teams[0].score,outcome==='goal'?1:0);}
 }
});
test('faltas: CPU cobra nos quatro níveis e nos dois sentidos, sem travar em 30/60/120 Hz',()=>{
 for(const hz of [30,60,120])for(const difficulty of [0,1,2,3])for(const side of [0,1]){
  const m=make({autoplay:true,difficulty});m.setRestart('FALTA',side,side?230:F.w-230,F.cy);
  for(let i=0;i<hz*8;i++)m.update(1/hz);
  assert.notEqual(m.state,'freeKick');assert.ok(m.teams[side].stats.shots>=1);assert.ok(Number.isFinite(m.ball.x)&&Number.isFinite(m.ball.y)&&Number.isFinite(m.ball.z));
 }
});

test('faltas: toque rápido após pausa confirma uma vez e botão já segurado não confirma',()=>{
 const m=special(),f=m.freeKick;m.update(.6,input({shoot:true},undefined,{shoot:true}));assert.equal(f.phase,'aim');
 const tap=input({shoot:true});tap.released.shoot=true;m.update(1/60,tap);assert.equal(f.phase,'power');
 m.update(1/60,input({},undefined,{shoot:true}));assert.equal(f.phase,'power');m.update(1/60,tap);assert.equal(f.phase,'curve');
});
test('faltas: arco natural supera a barreira e cai no gol; trajetória baixa é bloqueada',()=>{
 for(const hz of [30,60,120])for(const high of [false,true]){
  const m=special(),f=m.freeKick;f.height=high?.55:0;f.aim=0;f.curve=0;f.launch(m);
  // Isolate ball/wall integration: no goalkeeper, scripted teleport or automatic scoring.
  for(let i=0;i<hz*2&&m.state==='play';i++){m.ball.update(1/hz);m.freeKick?.afterBall(m,1/hz);m.boundaries();}
  assert.equal(m.teams[0].score,high?1:0);if(!high)assert.equal(m.banner,'NA BARREIRA!');
 }
});

test('faltas: a mesma mira, força e curva produzem o mesmo chute para usuário e CPU',()=>{
 for(const side of [0,1]){const samples=[];
  for(const human of [0,1]){const m=make({human});m.setRestart('FALTA',side,F.cx+m.teams[side].dir*35,F.cy);const f=m.freeKick;f.aim=.4;f.power=.7;f.height=.6;f.curve=-.2;f.launch(m);samples.push([m.ball.x,m.ball.y,m.ball.vx,m.ball.vy,m.ball.vz,m.ball.spin]);}
  assert.deepEqual(samples[0],samples[1]);
 }
});
test('faltas: cobranças próximas ao meio-campo completam o voo sem encerrar a física cedo',()=>{
 for(const side of [0,1])for(const hz of [30,60,120]){
  const m=make({autoplay:true});m.setRestart('FALTA',side,F.cx+m.teams[side].dir,F.cy);const f=m.freeKick;f.wall=[];f.aim=0;f.power=.8;f.height=.55;f.curve=0;f.launch(m);
  assert.ok(f.flightDuration>=f.trajectory().flight);
  for(let i=0;i<hz*5&&m.state==='play';i++){m.ball.update(1/hz);m.freeKick?.afterBall(m,1/hz);m.boundaries();}
  assert.equal(m.teams[side].score,1);assert.ok(Number.isFinite(m.ball.z));
 }
});
test('faltas: CPU percorre as três etapas também no início do campo de ataque',()=>{
 for(const human of [0,1])for(const half of [1,2]){
  const m=make({human}),side=1-human;if(half===2)m.resumeHalf();m.setRestart('FALTA',side,F.cx+m.teams[side].dir*2,F.cy);const phases=new Set();
  for(let i=0;i<240&&m.state==='freeKick';i++){phases.add(m.freeKick.phase);m.update(1/60);}
  assert.deepEqual([...phases],['aim','power','curve','runup']);assert.equal(m.teams[side].stats.shots,1);assert.equal(m.state,'play');
 }
});

test('faltas reais: usuário e máquina seguem a mesma regra em ataque e defesa nos dois tempos',()=>{
 for(const human of [0,1])for(const half of [1,2])for(const side of [0,1])for(const attacking of [false,true]){
  const m=make({human});if(half===2)m.resumeHalf();m.state='play';const dir=m.teams[side].dir,victim=m.teams[side].players[9],offender=m.teams[1-side].players[1];
  victim.x=F.cx+dir*(attacking?75:-75);victim.y=F.cy;victim.facing={x:dir,y:0};offender.x=victim.x-dir*18;offender.y=F.cy;offender.vx=offender.vy=0;m.ball.reset(F.cx,F.h-70);
  m.tackle(offender,true);assert.equal(m.state,attacking?'freeKick':'restart');assert.equal(m.restart.team,side);assert.equal(m.teams[1-side].stats.fouls,1);
 }
});
