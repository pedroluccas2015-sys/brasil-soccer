'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
const B=BSS,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();const make=(o={})=>new B.Match(d.teams[0],d.teams[1],{seed:26,...o});
const input=(pressed={},axis={x:0,y:0},state={})=>({pressed,axis,state,released:{}});
const special=(o={})=>{const m=make(o);m.setRestart('FALTA',0,820,340);return m;};
test('faltas: limite exato do último quarto, ambos os times e dois tempos',()=>{
 for(const half of [1,2])for(const side of [0,1])for(const delta of [-.01,0,.01]){
  const m=make();if(half===2)m.resumeHalf();const dir=m.teams[side].dir,x=525+dir*(262.5+delta);m.setRestart('FALTA',side,x,50);
  assert.equal(m.state,delta<0?'restart':'freeKick');assert.equal(!!m.freeKick,delta>=0);
 }
 for(const type of ['LATERAL','ESCANTEIO','IMPEDIMENTO','TIRO DE META']){const m=make();m.setRestart(type,0,900,60);assert.equal(m.state,'restart');assert.equal(m.freeKick,null);}
});
test('faltas: fora da faixa mantém cobrança normal por passe',()=>{
 for(const x of [100,525,700,787.49]){const m=make();m.setRestart('FALTA',0,x,340);m.timer=0;m.pass(m.restart.taker,'pass',.5,{x:1,y:0});assert.equal(m.state,'play');assert.ok(m.ball.pass);}
});
test('faltas: falta real ativa o mecanismo; grande área continua sendo pênalti',()=>{
 for(const x of [800,910]){const m=make(),p=m.teams[1].players[1],q=m.teams[0].players[9];m.state='play';p.x=x;p.y=340;q.x=x+18;q.y=340;m.ball.reset(200,100);m.tackle(p,true);assert.equal(m.state,x===800?'freeKick':'penalty');}
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
 const m=make();m.teams[1].players[1].red=true;m.setRestart('FALTA',0,820,340);const f=m.freeKick;
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
  else{Object.assign(b,{px:1048,x:1054,py:outcome==='goal'?340:450,y:outcome==='goal'?340:450,pz:10,z:10});m.boundaries();assert.equal(m.state,outcome==='goal'?'goal':'restart');assert.equal(m.teams[0].score,outcome==='goal'?1:0);}
 }
});
test('faltas: CPU cobra nos quatro níveis e nos dois sentidos, sem travar em 30/60/120 Hz',()=>{
 for(const hz of [30,60,120])for(const difficulty of [0,1,2,3])for(const side of [0,1]){
  const m=make({autoplay:true,difficulty});m.setRestart('FALTA',side,side?230:820,340);
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
