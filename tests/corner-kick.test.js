'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
const B=BSS,F=B.FIELD,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();
const make=(opts={})=>new B.Match(d.teams[0],d.teams[1],{seed:36,...opts});
const input=(pressed={},axis={x:0,y:0},state={})=>({pressed,axis,state,released:{}});
const corner=(side=0,upper=true,opts={})=>{const m=make(opts),t=m.teams[side];m.setRestart('ESCANTEIO',side,t.dir>0?F.w-6:6,upper?6:F.h-6);return m;};
test('escanteios: cinco atacantes e cinco defensores na área, ambos lados, tempos e bandeirinhas',()=>{
 for(const human of [0,1])for(const half of [1,2])for(const side of [0,1])for(const upper of [true,false]){
  const m=make({human});if(half===2)m.resumeHalf();const dir=m.teams[side].dir;
  m.setRestart('ESCANTEIO',side,dir>0?F.w-6:6,upper?6:F.h-6);
  assert.equal(m.state,'freeKick');const f=m.freeKick;assert.equal(f.corner,true);assert.equal(f.wall.length,0);
  assert.equal(f.cornerAttackers.length,5);assert.equal(f.cornerDefenders.length,5);assert.equal(f.cornerPositions.size,10);
  assert.equal(new Set([...f.cornerAttackers,...f.cornerDefenders]).size,10);
  for(const p of f.cornerPositions.keys()){
   assert.ok(!p.red&&p.role!=='GK'&&p!==f.taker);
   assert.ok(Math.abs(p.x-f.goal.x)<=165&&Math.abs(p.y-F.cy)<200);
  }
  assert.ok(!f.cornerPositions.has(f.keeper));assert.equal(m.ball.owner,null);
  assert.equal(m.restart.exempt,true);
 }
});
test('escanteios: jogador tem mira, força, efeito, corrida e cobrança sem contar chute direto',()=>{
 const m=corner(),f=m.freeKick,clock=m.clock;assert.equal(m.controlled,f.taker);
 m.update(.6,input());m.update(.1,input({shoot:true},{x:.8,y:-.3},{shoot:true}));assert.equal(f.phase,'power');
 assert.ok(f.aim>0&&f.height>.55);assert.equal(m.clock,clock);
 for(const phase of ['curve','runup']){m.update(.01,input());m.update(.01,input({shoot:true}));assert.equal(f.phase,phase);}
 for(let i=0;i<30&&m.state==='freeKick';i++)m.update(1/60,input());
 assert.equal(f.phase,'flight');assert.equal(m.state,'play');assert.equal(m.restart,null);
 assert.equal(m.teams[0].stats.shots,0);assert.equal(m.teams[0].stats.passes,1);
 assert.ok(m.controlled!==f.taker&&f.cornerAttackers.includes(m.controlled));
 assert.equal(m.pendingOffside.length,0);assert.ok(m.ball.pass);
});
test('escanteios: efeito desvia a bola e variação de força e mira altera zona do cruzamento',()=>{
 const f=corner().freeKick;
 f.power=.25;const a=f.cornerTarget();const fast=f.trajectory();f.power=.85;const b=f.cornerTarget();
 assert.notEqual(a.x,b.x);assert.ok(Math.hypot(fast.vx,fast.vy)<Math.hypot(f.trajectory().vx,f.trajectory().vy));
 f.aim=1;assert.ok(f.cornerTarget().y>b.y);f.aim=-1;assert.ok(f.cornerTarget().y<b.y);
 const bend=curve=>{const m=corner(),f=m.freeKick;f.curve=curve;f.launch(m);for(let i=0;i<18;i++){m.ball.update(1/60);f.afterBall(m,1/60);}return m.ball.x;};
 assert.ok(Math.abs(bend(.85)-bend(-.85))>1);
});
test('escanteios: passe curto normal e impedimento isento para o cruzamento',()=>{
 const m=corner(),f=m.freeKick;m.update(.7,input());m.update(.02,input({pass:true}));
 assert.equal(m.freeKick,null);assert.equal(m.state,'play');assert.ok(m.ball.pass);assert.equal(m.ball.pass.target,f.cornerOutlet);assert.equal(m.teams[0].stats.shots,0);
 const m2=corner();m2.freeKick.launch(m2);assert.deepEqual(m2.pendingOffside,[]);
});
test('escanteios: cabeceio do atacante, corte da defesa e bola disputável',()=>{
 for(const defend of [false,true]){
  const m=corner(0,true,{autoplay:true}),f=m.freeKick;f.aim=0;f.launch(m);
  const p=defend?f.cornerDefenders[0]:f.cornerAttackers[0],b=m.ball;
  Object.assign(b,{x:p.x,y:p.y,px:p.x-4,py:p.y,pz:19,z:19,lock:0,lastTouch:f.taker,owner:null});
  f.flightTime=.8;assert.ok(f.cornerHeader(m));assert.equal(m.freeKick,null);
  assert.equal(b.lastTouch,p);assert.equal(m.state,'play');
  if(defend){assert.equal(b.shot,null);assert.ok(b.vx*p.team.dir>0);}else{assert.equal(b.shot.team,0);assert.equal(m.teams[0].stats.shots,1);}
 }
});
test('escanteios: CPU percorre três etapas e partidas seguem nas quatro dificuldades',()=>{
 for(const difficulty of [0,1,2,3])for(const side of [0,1]){
  const m=corner(side,true,{human:1-side,difficulty});const f=m.freeKick,phases=new Set();
  for(let i=0;i<260&&m.state==='freeKick';i++){phases.add(f.phase);m.update(1/60);}
  assert.deepEqual([...phases],['aim','power','curve','runup']);assert.equal(m.state,'play');
  assert.equal(m.teams[side].stats.passes,1);assert.ok(Number.isFinite(m.ball.x));
  for(let i=0;i<150&&m.state==='play';i++)m.update(1/60);
  assert.ok(m.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});
test('escanteios reais após desvio e expulsões não geram bloqueios',()=>{
 const m=make();m.state='play';const def=m.teams[1];m.ball.lastTouch=def.players[2];
 Object.assign(m.ball,{px:F.w-3,x:F.w+3,py:100,y:100,pz:0,z:0});m.boundaries();
 assert.equal(m.state,'freeKick');assert.ok(m.freeKick.corner);assert.equal(m.teams[0].stats.corners,1);
 const other=corner();other.teams[0].players[6].red=true;other.teams[1].players[7].red=true;
 other.setRestart('ESCANTEIO',0,F.w-6,F.h-6);
 assert.equal(other.freeKick.cornerAttackers.length,5);assert.equal(other.freeKick.cornerDefenders.length,5);
});
