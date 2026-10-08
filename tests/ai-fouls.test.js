'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
global.window=global;global.localStorage={getItem:()=>null,setItem(){}};
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','free-kick','match'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const B=BSS,d=new B.DataManager();d.raw=BSS_DATA;d.hydrate();
function scenario({x=870,side=1,autoplay=false}={}){
 const m=new B.Match(d.teams[0],d.teams[1],{seed:75,difficulty:1,autoplay});
 m.state='play';m.elapsed=45;
 const defender=m.teams[side].players[2],carrier=m.teams[1-side].players[9];
 for(const p of m.players){p.x=p.team.dir>0?75:1100;p.y=90;p.vx=0;p.vy=0;}
 m.controlled=carrier;
 carrier.x=x;carrier.y=B.FIELD.cy;carrier.vx=130*carrier.team.dir;carrier.vy=0;carrier.facing={x:carrier.team.dir,y:0};
 defender.x=x-carrier.team.dir*20;defender.y=B.FIELD.cy;
 defender.vx=130*carrier.team.dir;defender.vy=0;defender.facing={x:carrier.team.dir,y:0};defender.actionCooldown=0;
 m.ball.reset(x+carrier.team.dir*8,B.FIELD.cy);m.ball.owner=carrier;m.ball.lastTouch=carrier;
 m.ai.riskyRandom=()=>0;
 m.random=()=>0;
 return {m,defender,carrier,ballDistance:B.dist(m.ball,defender)};
}
test('CPU erra desarme e marca falta real fora da área, com cobrança normal',()=>{
 const {m,defender,carrier,ballDistance}=scenario();
 m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,1);
 assert.equal(m.events.filter(e=>e.type==='foul').length,1);
 assert.equal(m.state,'freeKick');
 assert.equal(m.restart.team,0);
 assert.ok(m.ai.nextRiskAt[1]>=m.elapsed+20);
});
test('CPU comete pênalti de jogo por desarme atrasado dentro da área',()=>{
 const {m,defender,carrier,ballDistance}=scenario({x:1150});
 m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,1);
 assert.equal(m.state,'penalty');
 assert.equal(m.penalty.side,0);
 assert.equal(m.penalty.shootout,false);
});
test('pênalti também é marcado após troca de lado',()=>{
 const {m,defender,carrier}=scenario({x:105});
 m.teams.forEach(t=>t.dir*=-1);
 carrier.vx=-130;carrier.facing={x:-1,y:0};carrier.x=105;
 defender.x=125;defender.vx=-130;defender.facing={x:-1,y:0};
 m.ball.reset(97,B.FIELD.cy);m.ball.owner=carrier;
 m.ai.tryRiskyTackle(defender,carrier,B.dist(m.ball,defender),1/60);
 assert.equal(m.state,'penalty');assert.equal(m.penalty.side,0);
});
test('faltas táticas dependem de uma disputa real, rolagem e intervalo',()=>{
 const {m,defender,carrier,ballDistance}=scenario();
 m.ai.riskyRandom=()=>.99999;
 m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,0);
 m.ai.riskyRandom=()=>0;
 carrier.vx=0;carrier.x=630;
 m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,0);
 carrier.x=870;carrier.vx=130;
 m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,1);
 m.state='play';m.ai.tryRiskyTackle(defender,carrier,ballDistance,1/60);
 assert.equal(m.teams[1].stats.fouls,1,'cooldown evita série de interrupções');
});
test('desarmes arriscados automáticos não afetam os companheiros do usuário',()=>{
 const {m,carrier,defender}=scenario({side:0});
 m.ai.tryRiskyTackle(defender,carrier,B.dist(defender,m.ball),1/60);
 assert.equal(m.teams[0].stats.fouls,0);
});
test('decisão da CPU realmente chama o desarme e provoca pênalti durante update',()=>{
 const {m,defender}=scenario({x:1150});
 m.ai.update(1/60);
 assert.equal(m.state,'penalty');
 assert.equal(m.teams[1].stats.fouls,1);
 assert.ok(defender.actionCooldown>0);
});
