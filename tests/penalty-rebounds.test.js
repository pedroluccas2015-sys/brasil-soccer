'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
const root=path.resolve(__dirname,'..');
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const B=BSS,F=B.FIELD,data=new B.DataManager();data.raw=BSS_DATA;data.hydrate();
const input={axis:{x:0,y:0},state:{},pressed:{},released:{}};
function create(side=0,period=1,shootout=false){
 const m=new B.Match(data.teams[0],data.teams[1],{seed:26,human:1-side,mode:shootout?'penalties':'quick',duration:240});
 if(period===2){m.resumeHalf();m.clock=3700;}
 if(shootout)m.setupPenalty(side,true);else m.setupPenalty(side,false);
 return {m,p:m.penalty};
}
function playUntilOutcome(m,p,{power=.6,aim=.88,height=.88,dive=false,hz=60}={}){
 m.random=()=>.5; // deterministic trajectory, not a predestined shot outcome
 p.aim=aim;p.height=height;m.kickPenalty(power);
 for(let i=0;i<Math.ceil(hz*4)&&m.state==='penalty'&&p.phase!=='result';i++){
  if(dive&&p.phase==='flight'&&p.time>.05&&!p.dive)p.startDive(Math.sign(aim),height);
  m.update(1/hz,input);
 }
 return m;
}

test('pênalti da partida: espalmada volta ao campo e jogadores podem disputar rebote',()=>{
 const {m,p}=create(0);
 const clock=m.clock,dirs=m.teams.map(t=>t.dir);
 playUntilOutcome(m,p,{dive:true});
 assert.equal(m.state,'play');assert.equal(p.phase,'rebound');assert.equal(m.penalty,null);
 assert.equal(m.teams[0].score,0);assert.equal(m.teams[1].score,0);
 assert.equal(m.restart?.type,undefined);assert.equal(m.stoppages,0);
 assert.equal(m.ball.owner,null);assert.equal(m.ball.lastTouch,p.keeper);
 assert.ok(m.ball.vx<0);assert.ok(m.ball.x>F.w-100);assert.ok(m.ball.y>=0&&m.ball.y<=F.h);
 assert.deepEqual(m.teams.map(t=>t.dir),dirs);
 assert.equal(m.clock,clock);m.update(1/60,input);assert.ok(m.clock>clock);
 // The ordinary collision/acquisition logic still operates on the live rebound.
 m.ball.lock=0;Object.assign(m.ball,{z:0,vz:0,vx:5,vy:0});
 Object.assign(p.taker,{x:m.ball.x+5,y:m.ball.y,touchDelay:0});m.touchBall(1/60);
 assert.equal(m.ball.owner,p.taker);
});

test('pênalti da partida: defesa segura dá posse ao goleiro e não tiro de meta',()=>{
 const {m,p}=create(0);
 playUntilOutcome(m,p,{power:.25,aim:0,height:.45});
 assert.equal(p.caught,true);assert.equal(m.state,'play');assert.equal(m.restart?.type,undefined);
 assert.equal(m.ball.owner,p.keeper);assert.equal(m.ball.lastTouch,p.keeper);
 assert.equal(m.ball.net,null);assert.ok(m.ball.x>F.w-40);
 // Let the normal keeper AI distribute the ball instead of forcing a goal kick.
 for(let i=0;i<160&&m.ball.owner===p.keeper;i++)m.update(1/60,input);
 assert.notEqual(m.ball.owner,p.keeper);
});

test('rebotes preservados nos dois lados do campo, nos dois tempos e em 30/60/120 Hz',()=>{
 for(const period of [1,2])for(const side of [0,1])for(const hz of [30,60,120]){
  const {m,p}=create(side,period);const clock=m.clock,dirs=m.teams.map(t=>t.dir);
  playUntilOutcome(m,p,{dive:true,hz});
  assert.equal(m.state,'play',`side ${side}, period ${period}, hz ${hz}`);
  const dir=m.teams[side].dir,goalX=dir>0?F.w:0;
  assert.ok(Math.abs(m.ball.x-goalX)<45);
  assert.ok(m.ball.vx*dir<0,'bounce moves away from goal');
  assert.equal(m.ball.lastTouch,p.keeper);
  assert.deepEqual(m.teams.map(t=>t.dir),dirs);assert.equal(m.clock,clock);
  for(let i=0;i<hz*2&&m.state==='play';i++){
   m.update(1/hz,input);
   assert.ok(Number.isFinite(m.ball.x)&&Number.isFinite(m.ball.y));
  }
 }
});

test('desvio do goleiro que cruza a linha de fundo gera escanteio, não tiro de meta',()=>{
 const {m,p}=create(0);playUntilOutcome(m,p,{dive:true});
 Object.assign(m.ball,{px:F.w-3,x:F.w+3,y:F.cy+160,py:F.cy+160,z:0,pz:0,lastTouch:p.keeper});
 m.boundaries();assert.equal(m.restart.type,'ESCANTEIO');assert.equal(m.restart.team,0);
 assert.equal(m.teams[0].stats.corners,1);assert.ok(m.freeKick?.corner);
});

test('bola na trave durante partida volta fisicamente ao jogo',()=>{
 for(const side of [0,1]){
  const {m,p}=create(side);playUntilOutcome(m,p,{aim:0,height:1,power:.6});
  assert.equal(m.state,'play');assert.equal(m.penalty,null);assert.equal(p.phase,'rebound');
  assert.equal(m.ball.lastTouch,p.taker);assert.ok(m.ball.vx*m.teams[side].dir<0);
 }
});

test('pênalti chutado para fora ainda gera tiro de meta e gol gera saída de bola',()=>{
 const miss=create();playUntilOutcome(miss.m,miss.p,{aim:1.6,height:.45});
 assert.equal(miss.p.phase,'result');
 for(let i=0;i<120&&miss.m.state==='penalty';i++)miss.m.update(1/60,input);
 assert.equal(miss.m.restart?.type,'TIRO DE META');
 const goal=create();playUntilOutcome(goal.m,goal.p,{aim:.6,height:.45,power:.6});
 assert.equal(goal.p.phase,'result');assert.equal(goal.p.goal,true);
 for(let i=0;i<120&&goal.m.state==='penalty';i++)goal.m.update(1/60,input);
 assert.equal(goal.m.teams[0].score,1);assert.equal(goal.m.restart?.type,'SAÍDA DE BOLA');
});

test('disputa por pênaltis mantém cobrança encerrada sem rebote',()=>{
 const {m,p}=create(0,1,true);playUntilOutcome(m,p,{dive:true});
 assert.equal(p.phase,'result');assert.equal(p.goal,false);assert.equal(m.state,'penalty');
 assert.equal(m.penalties.kicks[0].length,1);assert.equal(m.penalties.kicks[0][0],false);
});
