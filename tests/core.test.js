'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const storage=new Map();global.window=global;global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const root=path.resolve(__dirname,'..');
for(const f of ['data/bundle.js',...['engine','formations','physics','data-loader','player','ball','team','ai','penalty','match','competition'].map(n=>'js/'+n+'.js')])vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const d=new BSS.DataManager();d.raw=BSS_DATA;d.hydrate();const B=BSS,make=(opts={})=>new B.Match(d.teams[0],d.teams[1],{seed:26,...opts});
const pkInput=(x=0,y=0,pressed={},state={})=>({axis:{x,y},pressed,state,released:{}});
test('bola: giro acompanha deslocamento, repouso não gira e impacto amortece',()=>{
 const b=new B.Ball();b.update(1/60);assert.equal(b.roll,0);b.vx=300;b.vz=65;
 b.update(1/60);assert.ok(b.roll>0);assert.ok(b.trail.length>0);let bounce=false;
 for(let i=0;i<180;i++){b.update(1/60);if(b.impactKind==='bounce')bounce=true;}assert.ok(bounce);
 for(let i=0;i<600;i++)b.update(1/60);const angle=b.roll;b.update(1/60);assert.equal(b.roll,angle);assert.equal(b.trail.length,0);
});
test('gol normal: bola continua, bate na rede e repousa sem duplicar placar',()=>{
 const m=make();m.state='play';Object.assign(m.ball,{x:1052,px:1047,y:340,py:340,z:14,pz:14,vx:350,vz:5});m.boundaries();
 assert.equal(m.state,'goal');const x=m.ball.x;for(let i=0;i<30;i++)m.update(1/60);
 assert.notEqual(m.ball.x,x);assert.equal(m.teams[0].score,1);assert.ok(m.ball.net);assert.ok(m.ball.x>=1050&&m.ball.x<=1073);
 const b=new B.Ball();b.reset(-2,340);b.vx=-400;b.vz=55;b.enterNet(0);for(let i=0;i<240;i++)b.update(1/60);assert.ok(b.x>=-23&&b.x<=-1);assert.equal(b.z,0);
});
test('PK: gol e espalmada mantêm a bola física durante o resultado',()=>{
 for(const save of [false,true]){const m=make({human:1});m.setupPenalty(0,false);const p=m.penalty;p.aim=.88;p.height=.88;m.kickPenalty(.6);
  for(let i=0;i<100&&p.phase!=='result';i++){if(save&&p.phase==='flight'&&p.time>.05&&!p.dive)p.startDive(1,.88);m.update(1/60,pkInput());}
  assert.equal(p.goal,!save);const {x,y,z}=m.ball;for(let i=0;i<15;i++)m.update(1/60,pkInput());assert.ok(Math.hypot(m.ball.x-x,m.ball.y-y,m.ball.z-z)>2);assert.equal(m.teams[0].score,save?0:1);if(save)assert.ok(m.ball.vx<0);else assert.ok(m.ball.net);
 }
});
test('PK: três botões disparam imediatamente com velocidades distintas',()=>{
 const durations=[];
 for(const action of ['pass','shoot','long']){const m=make({mode:'penalties'});m.update(1/60,pkInput(1,-1,{[action]:true}));assert.equal(m.penalty.phase,'runup');assert.equal(m.penalty.aim,.88);assert.equal(m.penalty.height,.88);durations.push(m.penalty.duration);for(let i=0;i<90&&m.penalty.phase!=='result';i++)m.update(1/60,pkInput());assert.equal(m.penalties.kicks[0].length,1);assert.equal(m.teams[0].stats.shots,1);m.penaltyResult(true,'duplicado');assert.equal(m.penalties.kicks[0].length,1);}
 assert.ok(durations[0]>durations[1]&&durations[1]>durations[2]);
});
test('PK: finta não chuta; direção sozinha não faz o goleiro saltar',()=>{
 const m=make({mode:'penalties'});m.update(.1,pkInput(-1,0,{}, {context:true}));assert.ok(m.penalty.fake>0);assert.equal(m.penalty.phase,'aim');assert.equal(m.teams[0].stats.shots,0);
 m.setupPenalty(1,true);m.update(.1,pkInput(1,-1));assert.equal(m.penalty.dive,null);m.update(.1,pkInput(1,-1,{shoot:true}));assert.equal(m.penalty.dive.x,1);assert.equal(m.penalty.dive.height,.88);m.update(.1,pkInput(-1,1,{shoot:true}));assert.equal(m.penalty.dive.x,1);
});
test('PK: defender exige acertar canto, altura e momento',()=>{
 const attempt=(x,height,early=false)=>{const m=make({human:1});m.setupPenalty(0,false);const p=m.penalty;p.aim=.88;p.height=.88;m.kickPenalty(.6);if(early)p.startDive(x,height);for(let i=0;i<100&&p.phase!=='result';i++){if(!early&&p.phase==='flight'&&p.time>.05&&!p.dive)p.startDive(x,height);m.update(1/60,pkInput());}return p.goal;};
 assert.equal(attempt(1,.88),false);assert.equal(attempt(-1,.88),true);assert.equal(attempt(1,.08),true);assert.equal(attempt(1,.88,true),true);
});
test('PK: faltas nos dois tempos usam o mesmo motor e preservam relógio e lados',()=>{
 for(const period of [1,2])for(const side of [0,1])for(const goal of [false,true]){
  const m=make();if(period===2)m.resumeHalf();m.state='play';m.clock=period===1?1300:4000;const clock=m.clock,dirs=m.teams.map(t=>t.dir),def=m.teams[1-side],offender=def.players[1],victim=m.teams[side].players[9],gx=def.dir>0?0:1050;
  offender.x=gx===0?105:925;offender.y=340;offender.vx=100;victim.x=offender.x+18;victim.y=340;victim.facing={x:1,y:0};m.ball.reset(700,500);m.tackle(offender,true);
  assert.equal(m.state,'penalty');assert.ok(m.penalty instanceof B.Penalty);assert.equal(m.penalty.side,side);m.update(.5,pkInput());assert.equal(m.clock,clock);m.penaltyResult(goal,'teste');m.resolvePenalty();assert.equal(m.teams[side].score,goal?1:0);assert.deepEqual(m.teams.map(t=>t.dir),dirs);assert.equal(m.restart.team,1-side);assert.equal(m.restart.type,goal?'SAÍDA DE BOLA':'TIRO DE META');assert.equal(m.penalties,null);
 }
});
test('PK: morte súbita só decide após igual número de cobranças',()=>{
 const m=make({mode:'penalties'});for(let i=0;i<10;i++){m.penaltyResult(true,'gol');m.resolvePenalty();}assert.equal(m.finished,false);m.penaltyResult(true,'gol');m.resolvePenalty();assert.equal(m.finished,false);m.penaltyResult(false,'defesa');m.resolvePenalty();assert.equal(m.finished,true);assert.equal(m.penalties.winner,0);assert.deepEqual(m.teams.map(t=>t.score),[0,0]);
});
test('PK: disputa automática termina e física funciona em 30, 60 e 120 Hz',()=>{
 for(const hz of [30,60,120]){const m=make({mode:'penalties',autoplay:true});for(let i=0;i<hz*240&&!m.finished;i++)m.update(1/hz);assert.equal(m.finished,true);assert.ok([0,1].includes(m.penalties.winner));assert.ok(Number.isFinite(m.ball.z));}
});
test('20 clubes e elencos reais suficientes, atributos limitados',()=>{assert.equal(d.teams.length,20);for(const t of d.teams){assert.ok(t.players.length>=18);assert.equal(new Set(t.players.map(p=>p.name)).size,t.players.length);assert.equal(t.players[0].position,'GK');for(const p of t.players)for(const a of Object.values(p.attributes))assert.ok(a>=1&&a<=99);}});
test('calendário: 38 rodadas, 380 partidas, 19 mandos por clube',()=>{const ids=d.teams.map(t=>t.id),s=B.CompetitionManager.schedule(ids);assert.equal(s.length,38);assert.equal(s.flat().length,380);for(const r of s)assert.equal(new Set(r.flatMap(g=>[g.home,g.away])).size,20);for(const id of ids)assert.equal(s.flat().filter(g=>g.home===id).length,19);assert.equal(new Set(s.flat().map(g=>g.home+'-'+g.away)).size,380);});
test('pontuação, desempates e campeonato completo',()=>{const c=new B.CompetitionManager();c.create('league','flamengo',d.teams);const first=c.fixture();assert.ok(c.record(first.home,first.away,[2,1]));assert.equal(c.current.round,1);const row=c.current.table.find(t=>t.id===first.home);assert.equal(row.p,3);assert.equal(row.gp,2);while(!c.current.complete)c.completeRound();for(const row of c.current.table)assert.equal(row.j,38);const rank=c.standings();assert.equal(rank[0].id,c.current.champion);const loaded=new B.CompetitionManager();assert.equal(loaded.current.champion,c.current.champion);});
test('copa conclui quartas, semifinal e final com vencedor',()=>{const c=new B.CompetitionManager();c.create('cup','flamengo',d.teams);for(let i=0;i<3;i++)c.completeRound();assert.equal(c.current.complete,true);assert.ok(c.current.champion);assert.equal(c.current.history.flatMap(h=>h.games).length,7);});
test('física independente: atrito, parábola, quique e repouso',()=>{const b=new B.Ball();b.vx=300;b.vz=100;for(let i=0;i<30;i++)b.update(1/60);assert.ok(b.x>525);assert.ok(b.z>0);assert.ok(b.vx<300);let bounce=false;for(let i=0;i<600;i++){const v=b.vz;b.update(1/60);if(v<0&&b.vz>0)bounce=true;assert.ok(b.z>=0);}assert.ok(bounce);assert.equal(b.z,0);assert.ok(Math.abs(b.vx)<1);});
test('colisões separam jogadores sobrepostos',()=>{const a={x:0,y:0,radius:7},b={x:0,y:0,radius:7};for(let i=0;i<10;i++)B.Physics.players([a,b]);assert.ok(B.dist(a,b)>13);});
test('impedimento considera bola, meio-campo e penúltimo defensor',()=>{const defenders=[{x:1020},{x:900},{x:850}],ball={x:830};const line=B.Physics.offsideLine(defenders,1);assert.equal(line,900);assert.ok(B.Physics.isOffside({x:940},ball,line,1));assert.ok(!B.Physics.isOffside({x:899},ball,line,1));assert.ok(!B.Physics.isOffside({x:940},{x:960},line,1));assert.ok(!B.Physics.isOffside({x:450},{x:400},430,1));assert.ok(B.Physics.isOffside({x:100},{x:200},150,-1));});
test('gol, trave, lateral, escanteio e tiro de meta',()=>{let m=make();m.state='play';Object.assign(m.ball,{px:1048,x:1055,py:340,y:340,z:0,pz:0,lastTouch:m.teams[0].players[9]});m.boundaries();assert.equal(m.teams[0].score,1);assert.equal(m.state,'goal');m=make();m.state='play';Object.assign(m.ball,{px:1048,x:1055,py:281,y:281,z:0,pz:0,vx:200});m.boundaries();assert.ok(m.ball.vx<0);assert.equal(m.teams[0].score,0);m=make();m.state='play';Object.assign(m.ball,{x:500,y:-3,lastTouch:m.teams[0].players[9]});m.boundaries();assert.equal(m.restart.type,'LATERAL');assert.equal(m.restart.team,1);m.state='play';Object.assign(m.ball,{x:1055,px:1048,y:100,py:100,lastTouch:m.teams[1].players[3]});m.boundaries();assert.equal(m.restart.type,'ESCANTEIO');m.state='play';Object.assign(m.ball,{x:1055,px:1048,y:100,py:100,lastTouch:m.teams[0].players[3]});m.boundaries();assert.equal(m.restart.type,'TIRO DE META');});
test('cronômetro, intervalo e fim de jogo',()=>{const m=make();m.state='play';m.clock=2759;m.advanceClock(1);assert.equal(m.state,'half');m.resumeHalf();assert.equal(m.period,2);assert.equal(m.clock,2700);assert.equal(m.teams[0].dir,-1);m.state='play';m.clock=5459;m.advanceClock(1);assert.equal(m.finished,true);});
test('carrinho sem bola gera falta e cartão; cinco substituições',()=>{const m=make(),p=m.teams[0].players[1],q=m.teams[1].players[1];m.state='play';p.x=500;p.y=300;p.vx=120;q.x=520;q.y=300;q.facing={x:1,y:0};m.ball.x=600;m.ball.y=500;m.tackle(p,true);assert.equal(m.teams[0].stats.fouls,1);assert.equal(m.restart.type,'FALTA');assert.ok(p.yellow);for(let i=0;i<5;i++)assert.ok(m.teams[0].substitute(2,0));assert.equal(m.teams[0].substitute(2,0),false);});
test('elenco selecionado aplicado ao visitante controlado',()=>{const lineup=[...d.teams[1].players];[lineup[9],lineup[10]]=[lineup[10],lineup[9]];const m=make({human:1,lineup,formation:'3-5-2'});assert.equal(m.teams[1].players[9].name,lineup[9].name);assert.equal(m.teams[1].formation,'3-5-2');assert.equal(m.teams[0].players[0].team.data.id,'flamengo');});
test('pênaltis encerram assim que a vantagem é inalcançável',()=>{const m=make({mode:'penalties'});for(let i=0;i<6&&!m.finished;i++){m.penaltyResult(m.penalty.side===0,'test');m.resolvePenalty();}assert.equal(m.finished,true);assert.equal(m.penalties.winner,0);assert.deepEqual(m.penalties.scores,[3,0]);});
test('importação validada e save/load de elenco',()=>{assert.throws(()=>d.importRoster({team:'Flamengo',season:2026,players:[]}),/11 a 60/);const players=d.teams[0].players.map(p=>({name:p.name,position:p.position,shirtNumber:p.shirtNumber}));d.importRoster({team:'Flamengo',season:2026,players});assert.equal(B.safeStorage.get('rosters').flamengo.players.length,players.length);assert.equal(B.safeStorage.get('ausente',42),42);});
test('partidas completas de IA sem NaN ou bloqueio',()=>{for(const seed of [1,26,99]){const m=make({seed,autoplay:true,duration:120});for(let tick=0;tick<40000&&!m.finished;tick++){if(m.state==='half')m.resumeHalf();m.update(1/60);if(tick%600===0)for(const p of [...m.players,m.ball]){assert.ok(Number.isFinite(p.x));assert.ok(Number.isFinite(p.y));}}assert.equal(m.finished,true);console.log('Simulação',seed,m.teams.map(t=>({score:t.score,shots:t.stats.shots,passes:t.stats.passes})));}});
