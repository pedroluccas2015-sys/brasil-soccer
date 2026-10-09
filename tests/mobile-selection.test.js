'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
const root=path.join(__dirname,'..');
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])
 vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const B=BSS,manager=new B.DataManager();manager.raw=BSS_DATA;manager.hydrate();
const match=()=>{const m=new B.Match(manager.teams[0],manager.teams[1],{seed:26,human:0});m.state='play';m.restart=null;m.ball.owner=null;return m;};

test('mobile: seleção automática acompanha atleta de linha mais próximo da bola',()=>{
 const m=match(),field=m.teams[0].players.filter(p=>p.role!=='GK');
 const far=field[0],close=field[1];m.controlled=far;
 m.ball.reset(600,400);far.x=100;far.y=100;close.x=602;close.y=401;
 field.slice(2).forEach((p,i)=>{p.x=120+i*10;p.y=50;});
 m.autoSelectPlayer(.16);assert.equal(m.controlled,far,'aguarda fração de segundo');
 m.autoSelectPlayer(.16);assert.equal(m.controlled,close);
 m.ball.owner=far;m.autoSelectPlayer(1/60);assert.equal(m.controlled,far,'dá prioridade imediata ao dono da bola');
});

test('mobile: troca manual respeita tempo de estabilidade, sem incluir goleiro',()=>{
 const m=match(),field=m.teams[0].players.filter(p=>p.role!=='GK');
 const [near,other]=field;m.ball.reset(500,400);
 field.forEach((p,i)=>{p.x=100-i*10;p.y=100;});
 near.x=501;near.y=400;other.x=550;other.y=400;m.controlled=near;
 m.switchPlayer();assert.equal(m.controlled,other);assert.equal(m.selectLock,.9);
 for(let i=0;i<30;i++)m.autoSelectPlayer(1/60);
 assert.equal(m.controlled,other,'não desfaz imediatamente a escolha manual');
 for(let i=0;i<40;i++)m.autoSelectPlayer(1/60);
 assert.equal(m.controlled,near,'retorna ao mais próximo depois do intervalo');
 assert.notEqual(m.controlled.role,'GK');
});

test('mobile: goleiro nunca é selecionado na bola solta; só ao agarrá-la',()=>{
 const m=match(),keeper=m.teams[0].players[0],outfield=m.teams[0].players[1];
 m.ball.reset(keeper.x,keeper.y);m.controlled=outfield;
 m.autoSelectPlayer(.5);assert.notEqual(m.controlled,keeper);
 m.ball.owner=keeper;m.autoSelectPlayer(1/60);assert.equal(m.controlled,keeper);
 m.ball.owner=null;m.autoSelectPlayer(1/60);assert.notEqual(m.controlled.role,'GK');
});

test('mobile: goleiro faz movimento automático mesmo com posse; distribui em seguida',()=>{
 const m=match(),keeper=m.teams[0].players[0];
 m.ball.reset(keeper.x,keeper.y);m.ball.owner=keeper;m.controlled=keeper;
 let updates=0;const previous=m.ai.keeper.bind(m.ai);
 m.ai.keeper=(p,dt)=>{if(p===keeper)updates++;previous(p,dt);};
 for(let i=0;i<150;i++)m.ai.update(1/60);
 assert.ok(updates>=130,'IA continua atuando quando cursor está no goleiro');
 assert.notEqual(m.ball.owner,keeper,'IA faz a reposição depois da defesa');
 m.autoSelectPlayer(1/60);assert.notEqual(m.controlled.role,'GK');
});

test('mobile: lançamento segurado sem posse chama segundo defensor',()=>{
 const m=match(),team=m.teams[0],opp=m.teams[1].players[9];
 m.ball.reset(opp.x,opp.y);m.ball.owner=opp;
 m.controlled=team.players[9];m.secondPress=true;
 const plan=m.ai.plan(team,1/60);assert.ok(plan.cover);
 m.ai.update(1/60);
 assert.equal(plan.cover.state,'SECOND_PRESS');
});
