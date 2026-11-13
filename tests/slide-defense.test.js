'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','kick-model','data-loader','player','ball','team','ai','penalty','free-kick','match','renderer','cinematics'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
const B=BSS,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();
const make=(opts={})=>new B.Match(d.teams[0],d.teams[1],{seed:91,cutscenes:false,...opts});
const defend=(side,wing=false)=>{const m=make({human:side}),t=m.teams[side],carrier=m.teams[1-side].players[9];
 m.state='play';carrier.x=t.dir>0?340:B.FIELD.w-340;carrier.y=wing?65:B.FIELD.cy;carrier.decision=999;m.ball.reset(carrier.x,carrier.y);m.ball.owner=carrier;return {m,t,carrier};};
test('carrinho: pé estendido precede a cabeça nas oito direções e depois levanta',()=>{
 const p=make().controlled;for(let i=0;i<8;i++){p.slideDirection={x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)};
  const pose=B.Player.slidePose(p,.4);assert.ok(pose.joints.foot[0]-pose.joints.head[0]>20);assert.ok(pose.joints.head[2]<10);assert.ok(Math.abs(Math.hypot(pose.direction.x,pose.direction.y)-1)<.001);
  assert.equal(B.Player.slidePose(p,1).joints.head[2],22);
 }
});
test('carrinho: recuperação freia sem virar para o comando contrário',()=>{
 const m=make(),p=m.controlled;m.state='play';m.ball.reset(50,50);p.facing={x:1,y:0};m.tackle(p,true);
 while(p.animTime>B.SLIDE.recovery)p.move(-1,0,false,1/120);
 const x=p.x;p.move(-1,0,true,1/120);assert.equal(p.x,x);assert.equal(p.facing.x,1);
 for(let i=0;i<30;i++)p.move(-1,0,false,1/120);assert.equal(p.slideDirection,null);assert.equal(p.facing.x,-1);
});
test('grama: carrinho emite fragmentos limitados sem consumir aleatoriedade da partida',()=>{
 const a=make(),b=make();a.state='play';a.ball.reset(30,30);const p=a.controlled;a.tackle(p,true);assert.equal(a.turf.length,6);assert.equal(a.random(),b.random());
 const bits=a.turf.map(bit=>({...bit}));p.move(1,0,false,.1);a.slideGrass();assert.ok(a.turf.length>bits.length);assert.ok(a.turf.every(bit=>bit.life>.4&&bit.vz>0));
 for(let i=0;i<100;i++)a.emitTurf(p,6);assert.equal(a.turf.length,144);
 a.state='half';a.update(1);assert.equal(a.turf.length,0);
});
test('replay: partículas e direção do carrinho são cópias independentes',()=>{
 const m=make(),p=m.controlled;m.state='play';m.ball.reset(30,30);p.facing={x:1,y:0};m.tackle(p,true);m.cinema=new B.Cinematics(m);m.cinema.capture();
 const a=m.cinema.frames[0];m.turf[0].age=.2;p.slideDirection.x=-1;assert.equal(a.turf[0].age,0);assert.equal(a.players.find(q=>q.id===p.id).slideDirection.x,1);
 m.cinema.capture();const frame=m.cinema.replayFrame(m.cinema.frames,.05/.75*.5);assert.equal(frame.turf[0].age,.1);assert.equal(a.turf[0].age,0);
});
test('defesa: papéis distintos e jogador manual preservado nas duas equipes',()=>{
 for(const side of [0,1]){const {m,t}=defend(side),p=m.controlled,plan=m.ai.plan(t,0),before={x:p.x,y:p.y};
  assert.notEqual(plan.chaser,p);assert.notEqual(plan.cover,p);assert.notEqual(plan.chaser,plan.cover);assert.ok(!plan.targets.has(p)&&!plan.marks.has(p));
  assert.equal(new Set(plan.marks.values()).size,plan.marks.size);m.ai.update(1/60);assert.equal(p.x,before.x);assert.equal(p.y,before.y);
 }
});
test('defesa: bloco compacto protege centro e separa corredores contra ataque pela ponta',()=>{
 for(const side of [0,1]){const {m,t}=defend(side,true),plan=m.ai.plan(t,0),depth=x=>t.dir>0?x:B.FIELD.w-x;
  const targets=[...plan.targets].filter(([p])=>p.role==='DF').map(([,v])=>v);assert.ok(targets.length>=2);
  assert.ok(Math.max(...targets.map(p=>depth(p.x)))-Math.min(...targets.map(p=>depth(p.x)))<150);
  assert.ok(targets.some(p=>Math.abs(p.y-B.FIELD.cy)<160));
  for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++)assert.ok(B.dist(targets[i],targets[j])>=36);
 }
});
test('defesa: cobertura fica atrás da pressão para proteger caminho ao gol',()=>{
 for(const side of [0,1]){const {m,t,carrier}=defend(side);const plan=m.ai.plan(t,0),moves=new Map();m.ai.moveTo=(p,x,y)=>moves.set(p,{x,y});m.ai.update(1/60);
  const cover=moves.get(plan.cover);assert.equal(plan.cover.state,'COVER');assert.ok((cover.x-carrier.x)*t.dir< -50);assert.ok(Math.abs(cover.y-B.FIELD.cy)<50);
 }
});
test('defesa: zagueiro acompanha corredor perigoso atrás da linha sem abandonar gol',()=>{
 for(const side of [0,1]){const {m,t}=defend(side),runner=m.teams[1-side].players[10];runner.x=t.dir>0?70:B.FIELD.w-70;runner.y=B.FIELD.cy+60;
  const plan=m.ai.plan(t,0),entry=[...plan.marks].find(([,q])=>q===runner);assert.ok(entry);const [p]=entry,target=plan.targets.get(p);assert.ok(target);assert.ok((target.x-runner.x)*t.dir<=0);
 }
});
test('defesa: posse, expulsão e troca de jogador atualizam plano sem esperar reação',()=>{
 const {m,t}=defend(0);let plan=m.ai.plan(t,0);m.ball.owner=t.players[8];let next=m.ai.plan(t,.001);assert.notEqual(next,plan);
 plan=next;m.controlled=t.players[7];next=m.ai.plan(t,.001);assert.notEqual(next,plan);assert.ok(!next.targets.has(m.controlled));
 plan=next;m.teams[1].players[2].red=true;next=m.ai.plan(t,.001);assert.notEqual(next,plan);assert.ok(![...next.marks.values()].some(p=>p.red));
});
test('defesa: pressão manual recebe contenção e segundo marcador só quando solicitado',()=>{
 const {m,t,carrier}=defend(0),p=m.controlled;p.x=carrier.x-45;p.y=carrier.y;let plan=m.ai.plan(t,0);m.ai.update(1/60);assert.equal(plan.chaser.state,'CONTAIN');assert.equal(plan.cover.state,'COVER');
 m.secondPress=true;plan=m.ai.plan(t,.001);m.ai.update(1/60);assert.equal(plan.cover.state,'SECOND_PRESS');assert.equal(plan.chaser.state,'CONTAIN');
});
