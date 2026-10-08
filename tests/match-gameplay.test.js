'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
const B=BSS,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();
const make=(opts={})=>new B.Match(d.teams[0],d.teams[1],{seed:42,...opts});

test('movimento: diagonal não dá velocidade extra e distância independe de Hz',()=>{
 const travel=(hz,x,y)=>{const p=make().controlled;p.x=p.y=300;for(let i=0;i<hz;i++)p.move(x,y,false,1/hz);return Math.hypot(p.x-300,p.y-300);};
 const base=travel(60,1,0);for(const hz of [30,60,120]){assert.ok(Math.abs(travel(hz,1,0)-base)<.01);assert.ok(Math.abs(travel(hz,1,1)-base)<.01);}
});
test('movimento: reversão rápida, frenagem e queda sem deslizamento',()=>{
 const p=make().controlled;for(let i=0;i<30;i++)p.move(1,0,false,1/60);
 for(let i=0;i<6;i++)p.move(-1,0,false,1/60);assert.ok(p.vx<0);
 const x=p.x;for(let i=0;i<30;i++)p.move(0,0,false,1/60);assert.ok(Math.abs(p.x-x)<7);assert.ok(Math.abs(p.vx)<.1);
 p.vx=120;p.anim='fall';p.animTime=.7;const before=p.x;p.move(1,0,true,1/60);assert.equal(p.x,before);
});
test('carrinho mantém direção de lançamento mesmo com comando contrário',()=>{
 const m=make(),p=m.controlled;m.state='play';m.ball.reset(100,100);p.facing={x:1,y:0};m.tackle(p,true);const x=p.x;
 p.move(-1,0,false,1/60);assert.ok(p.x>x);assert.equal(p.facing.x,1);assert.equal(p.anim,'slide');
});
test('condução: bola acompanha corrida e mudança de direção sem teletransporte',()=>{
 for(const hz of [30,60,120]){const m=make(),p=m.controlled,b=m.ball;p.x=300;p.y=340;b.reset(311,340);b.owner=p;
  for(let i=0;i<hz*3;i++){p.move(i<hz*2?1:0,i<hz*2?0:1,true,1/hz);m.dribble(p,1/hz);const x=b.x,y=b.y;b.update(1/hz);assert.ok(B.dist(p,b)<27);assert.ok(Math.hypot(b.x-x,b.y-y)<9);}
 }
});
test('IA: reação e antecipação aumentam sem alterar velocidade dos atletas',()=>{
 const m=make(),t=m.teams[1],p=t.players[9];p.x=600;p.y=340;m.ball.reset(450,340);m.ball.vx=180;
 let prev=Infinity,anticipation=-Infinity;const pace=p.attributes.pace;
 for(let difficulty=0;difficulty<4;difficulty++){m.difficulty=difficulty;const cfg=m.ai.profile(t),target=m.ai.intercept(p,cfg);assert.ok(cfg.reaction<prev);assert.ok(target.x>anticipation);assert.equal(p.attributes.pace,pace);prev=cfg.reaction;anticipation=target.x;}
});
test('IA: plano mantém marcações distintas e não coloca o usuário como perseguidor automático',()=>{
 const m=make(),team=m.teams[0],plan=m.ai.plan(team,1/60);
 assert.notEqual(plan.chaser,m.controlled);assert.equal(new Set(plan.marks.values()).size,plan.marks.size);
 assert.equal(m.ai.plan(team,.01),plan);m.ai.plan(team,1);assert.notEqual(m.ai.plans.get(team),plan);
});
test('IA: evita passe impedido e prefere corredor desmarcado',()=>{
 const m=make({difficulty:3}),t=m.teams[1],p=t.players[9],safe=t.players[8],off=t.players[10];
 t.players.forEach(q=>q.red=true);[p,safe,off].forEach(q=>q.red=false);p.x=500;p.y=340;safe.x=410;safe.y=430;off.x=90;off.y=340;
 m.teams[0].players.forEach((q,i)=>{q.x=i?200:40;q.y=100+i*8;});m.ball.reset(p.x,p.y);m.ball.owner=p;
 assert.equal(m.ai.bestPass(p).player,safe);m.state='play';m.pass(p,'pass',.4,{x:-1,y:1},safe);assert.equal(m.ball.pass.target,safe);
});
test('IA: recebedor tem prioridade sobre perseguição da bola',()=>{
 const m=make({autoplay:true}),p=m.teams[1].players[9];m.state='play';m.ball.reset(p.x+50,p.y);m.ball.pass={target:p,from:m.teams[1].players[8]};m.ai.update(1/60);assert.equal(p.state,'RECEIVE');
});
test('IA: goleiro não toma a bola de um companheiro e possui reação por dificuldade',()=>{
 for(const difficulty of [0,3]){const m=make({difficulty}),p=m.teams[1].players[0],mate=m.teams[1].players[1];mate.x=p.x;mate.y=p.y;m.ball.reset(p.x,p.y);m.ball.owner=mate;m.ai.keeper(p,1/60);assert.equal(m.ball.owner,mate);}
 const diveAt=difficulty=>{const m=make({difficulty}),p=m.teams[1].players[0];m.ball.reset(910,350);m.ball.vx=250;for(let i=1;i<40;i++){m.ai.keeper(p,1/60);if(p.state==='DIVE')return i;}return 40;};assert.ok(diveAt(3)<diveAt(0));
});
test('quatro dificuldades completam partidas, com ataques e coordenadas finitas',()=>{
 for(let difficulty=0;difficulty<4;difficulty++){
  const m=make({difficulty,autoplay:true,duration:120});
  for(let i=0;i<30000&&!m.finished;i++){if(m.state==='half')m.resumeHalf();m.update(1/60);if(i%600===0)for(const p of [...m.players,m.ball])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
  assert.ok(m.finished);assert.ok(m.teams.reduce((n,t)=>n+t.stats.shots,0)>0);assert.ok(m.teams.every(t=>t.stats.passes>0));
 }
});
