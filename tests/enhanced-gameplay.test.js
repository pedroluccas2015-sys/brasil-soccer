'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const storage=new Map();global.window=global;global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
for(const f of ['data/bundle.js',...['engine','formations','physics','kick-model','data-loader','player','ball','team','ai','penalty','free-kick','match','competition','renderer','cinematics'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));
const B=BSS,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();
function setup(distance=200){
 const m=new B.Match(d.teams[0],d.teams[1],{seed:17,cutscenes:false}),p=m.teams[0].players[9],q=m.teams[0].players[10];m.state='play';m.restart=null;
 m.teams[0].players.forEach((r,i)=>{r.x=70;r.y=50+i*25;});m.teams[1].players.forEach((r,i)=>{r.x=B.FIELD.w-30;r.y=30+i*65;});
 Object.assign(p,{x:300,y:B.FIELD.cy,vx:0,vy:0,facing:{x:1,y:0}});Object.assign(q,{x:300+distance,y:B.FIELD.cy,vx:0,vy:0});m.ball.reset(p.x+10,p.y);m.ball.owner=p;m.controlled=p;return {m,p,q};
}
test('mesma carga: chute é mais veloz que cruzamento e passe, com força progressiva',()=>{
 for(const distance of [120,220,400]){let previous=[0,0,0];for(const power of [.08,.35,.65,1]){
  const speeds=['pass','long','shoot'].map(type=>{const {m,p,q}=setup(distance);if(type==='shoot')m.shoot(p,power,{x:1,y:0});else m.pass(p,type,power,{x:1,y:0},q);return Math.hypot(m.ball.vx,m.ball.vy);});
  assert.ok(speeds[2]>speeds[1]&&speeds[2]>speeds[0]);speeds.forEach((s,i)=>assert.ok(s>=previous[i]-.01));previous=speeds;
 }}
});
test('passe e cruzamento chegam ao companheiro, com altura controlável e sem teletransporte',()=>{
 for(const type of ['pass','long'])for(const distance of (type==='pass'?[100,180,280]:[100,220,340]))for(const hz of [30,60,120]){
  const {m,p,q}=setup(distance);m.pass(p,type,.65,{x:1,y:0},q);let closest=Infinity,atHeight=999;
  for(let i=0;i<hz*4;i++){const x=m.ball.x;m.ball.update(1/hz);assert.ok(Math.abs(m.ball.x-x)<15);const gap=B.dist(m.ball,q);if(gap<closest){closest=gap;atHeight=m.ball.z;}}
  assert.ok(closest<13,`${type} ${distance} ${hz}: distância ${closest}`);assert.ok(atHeight<18,`${type} ${distance}: altura ${atHeight}`);
 }
});
test('assistência respeita direção, evita impedidos e apresenta o receptor',()=>{
 const {m,p,q}=setup(180),off=m.teams[0].players[8];off.x=B.FIELD.w-5;off.y=p.y;
 assert.equal(m.passTarget(p,'pass',.4,{x:1,y:0}),q);assert.notEqual(m.passTarget(p,'long',1,{x:1,y:0}),off);
 q.x=p.x-150;assert.equal(m.passTarget(p,'pass',.4,{x:1,y:0}),undefined);assert.equal(m.passTarget(p,'pass',.4,{x:-1,y:0}),q);
});
test('segurar carrega, soltar executa uma vez em teclado, gamepad ou toque',()=>{
 for(const action of ['pass','shoot','long']){const {m,p}=setup(180),i={axis:{x:1,y:0},state:{[action]:true},pressed:{[action]:true},released:{}};
  m.handleActions(i,1/60);assert.equal(m.ball.owner,p);i.pressed={};for(let n=0;n<29;n++)m.handleActions(i,1/60);
  assert.ok(Math.abs(m.charges[action]-.5)<.0001);i.state={};i.released={[action]:true};m.handleActions(i,1/60);const speed=Math.hypot(m.ball.vx,m.ball.vy);assert.ok(speed>100);assert.equal(m.charges[action],undefined);
  i.released={};m.handleActions(i,1/60);assert.equal(Math.hypot(m.ball.vx,m.ball.vy),speed);
 }
});
test('receptor controlado avança automaticamente e direção manual assume o movimento',()=>{
 const {m,p,q}=setup(200);m.pass(p,'pass',.5,{x:1,y:0},q);m.ball.pass.destination.y=q.y+90;const before=q.y;
 const input={axis:{x:0,y:0},state:{},pressed:{},released:{}};m.update(1/60,input);assert.ok(q.y>before);input.axis={x:0,y:-1};for(let n=0;n<15;n++)m.update(1/60,input);assert.ok(q.vy<0);
});
test('todas as copas de pênaltis têm um jogo por confronto em cada fase',()=>{
 for(const def of new B.CompetitionManager().definitions('cup')){const m=new B.CompetitionManager();m.create('penalty-cup',def.teams[0],null,def.id,{seed:98});let n=0;
  while(!m.current.complete&&n++<80){if(m.current.phase==='knockout'){assert.equal(m.current.rounds.length,1);assert.ok(m.current.ties.every(t=>t.legs===1&&!t.advantage));}m.completeRound();}
  assert.ok(m.current.complete);assert.ok(m.current.history.every(h=>h.games.every(g=>!g.leg||g.leg===1)));
 }
});
test('save antigo de pênaltis conserva primeira disputa sem contar duas vezes',()=>{
 const m=new B.CompetitionManager();m.create('penalty-cup','flamengo',null,'libertadores',{seed:4});const c=m.current;
 c.penaltyOnly=false;m.knockout('final','Final antiga',[['flamengo','palmeiras']],2);c.penaltyOnly=true;m.record('flamengo','palmeiras',[0,0],{scores:[5,3],winner:0});assert.equal(c.round,1);
 const restored=new B.CompetitionManager();assert.equal(restored.current.complete,true);assert.equal(restored.current.champion,'flamengo');assert.equal(restored.current.history.length,1);assert.equal(restored.current.totalTable.find(r=>r.id==='flamengo').j,1);
});
test('replay interpola snapshots e nunca altera a partida ou os snapshots',()=>{
 const {m}=setup();m.cinema=new B.Cinematics(m);m.cinema.capture();m.ball.x+=100;m.cinema.capture();const json=JSON.stringify(m.cinema.frames.map(f=>[f.ball.x,f.players.map(p=>p.x)]));const frame=m.cinema.replayFrame(m.cinema.frames,.05/1.5);assert.equal(frame.ball.x,m.ball.x-50);assert.equal(JSON.stringify(m.cinema.frames.map(f=>[f.ball.x,f.players.map(p=>p.x)])),json);
});
test('208 escudos têm arquivo local e procedência; arte não depende de rede',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/crest-sources.json'),'utf8'));assert.equal(Object.keys(manifest.crests).length,208);assert.equal(manifest.missing.length,0);
 for(const t of d.raw.teams){assert.ok(t.crest,t.id);assert.ok(fs.existsSync(path.join(__dirname,'..',t.crest)),t.id);assert.ok(manifest.crests[t.id].source.startsWith('https://'));}
});
