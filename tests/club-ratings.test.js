'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const storage=new Map();global.window=global;global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
for(const file of ['data/bundle.js',...['engine','formations','physics','kick-model','data-loader','player','ball','team','ai','penalty','free-kick','match','competition','ui','competition-ui','club-selection'].map(s=>'js/'+s+'.js')])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
const B=BSS,data=new B.DataManager();data.raw=BSS_DATA;data.hydrate();const ratings=BSS_DATA.competitions.clubRatings;
function manager(penaltyOnly=false,seed=31){const m=new B.CompetitionManager();m.current={rngState:seed,phase:'groups',penaltyOnly};return m;}
function sample(home,away,penalties=false,n=10000){const m=manager(penalties),out={home:0,draw:0,away:0,goals:[0,0]};for(let i=0;i<n;i++){const g={home,away};m.simulate(g);out[g.result[0]===g.result[1]?'draw':g.result[0]>g.result[1]?'home':'away']++;out.goals[0]+=g.result[0];out.goals[1]+=g.result[1];}return out;}
test('208 clubes têm de 1 a 5 estrelas; todos os ausentes são exatamente 1',()=>{
 assert.equal(Object.keys(ratings.clubs).length,208);assert.deepEqual([...new Set(Object.values(ratings.clubs).map(r=>r.stars))].sort(),[1,2,3,4,5]);
 for(const team of data.teams){const r=team.clubRating;assert.ok(Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=5);assert.ok(r.strength>=20&&r.strength<=100);if(!r.cbf&&!r.conmebol?.position){assert.equal(r.stars,1,team.name);assert.equal(r.strength,20,team.name);}}
 assert.equal(B.clubRating('clube-nao-cadastrado').stars,1);
});
test('ranking mantém pontos, posições empatadas e identidades dos homônimos',()=>{
 assert.equal(B.clubRating('flamengo').cbf.points,16314);assert.equal(B.clubRating('corinthians').cbf.position,2);assert.equal(B.clubRating('palmeiras').conmebol.points,9828.6);
 assert.equal(B.clubRating('tm-60741').cbf.position,80);assert.equal(B.clubRating('tm-36012').cbf.position,80);
 assert.equal(B.clubRating('tm-9030').conmebol,null);assert.equal(B.clubRating('tm-17964').conmebol,null);assert.equal(B.clubRating('tm-87817').cbf.federation,'PI');assert.equal(B.clubRating('tm-87817').conmebol,null);assert.equal(B.clubRating('tm-32934').cbf.federation,'ES');assert.equal(B.clubRating('tm-32934').conmebol,null);
 assert.equal(B.clubRating('tm-115027').stars,1);assert.equal(B.clubRating('tm-12179').stars,1);assert.equal(B.clubRating('tm-1444').conmebol.position,9);
});
test('atletas não têm overall, inclusive após importação; a nota pertence ao clube',()=>{
 for(const team of data.teams)for(const player of team.players)assert.equal(Object.hasOwn(player,'overall'),false);
 assert.equal(Object.hasOwn(data.player({...data.teams[0].players[0],overall:99},'flamengo',0),'overall'),false);
 const html=B.UI.prototype.rosterRows(data.teams[0].players.slice(0,11),[],false);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('overall'));
 const ui=Object.create(B.UI.prototype);ui.app={data};assert.ok(ui.clubCard('flamengo').includes('5 de 5 estrelas'));assert.ok(ui.clubCard('tm-115027').includes('1 de 5 estrelas'));assert.ok(ui.clubCard('tm-115027').includes('Sem posição no ranking'));
});
test('em partidas jogáveis a força coletiva afeta técnica e IA, inclusive suplentes',()=>{
 const strong=data.get('flamengo'),weak=data.get('tm-115027'),m=new B.Match(strong,weak,{seed:18,difficulty:1,cutscenes:false});
 assert.equal(m.teams[0].rating.stars,5);assert.equal(m.teams[1].rating.stars,1);
 const average=(t,key)=>t.players.slice(1).reduce((n,p)=>n+p.attributes[key],0)/10;assert.ok(average(m.teams[0],'passing')>average(m.teams[1],'passing')+15);
 const record={name:'Atleta de teste',position:'MF',overall:99};const a=data.player(record,strong.id,0),b=data.player(record,weak.id,0);assert.ok(a.attributes.control>b.attributes.control+15);
 const sameSide={...m.teams[1],side:0,rating:m.teams[0].rating};assert.ok(m.ai.profile(sameSide).reaction<m.ai.profile({...sameSide,rating:m.teams[1].rating}).reaction);
});
test('força altera probabilidades de placar e preserva zebras nos dois mandos',()=>{
 const n=10000,a=sample('flamengo','tm-115027',false,n),b=sample('tm-115027','flamengo',false,n);
 assert.ok(a.home/n>.9);assert.ok(b.away/n>.85);assert.ok(a.away>0&&a.away/n<.07);assert.ok(b.home>0&&b.home/n<.1);
 const equal=sample('flamengo','flamengo',false,n);assert.ok(equal.home/n<.55&&equal.away/n>.2&&equal.draw/n>.15);
 console.log('Futebol: favorito em casa',a.home/n,'favorito fora',b.away/n,'zebra fora',a.away/n);
});
test('pênaltis e desempates pesam a força sem eliminar a incerteza',()=>{
 const n=10000,p=sample('flamengo','tm-115027',true,n);assert.equal(p.draw,0);assert.ok(p.home/n>.65&&p.home/n<.95);assert.ok(p.away/n>.05);
 const equal=sample('flamengo','flamengo',true,n);assert.ok(equal.home/n>.47&&equal.home/n<.53);
 const m=manager();m.current.phase='knockout';m.current.ties=[{id:'final',legs:1}];let wins=0;for(let i=0;i<n;i++){const g={home:'flamengo',away:'tm-115027',tie:'final',leg:1,result:[0,0]};m.resolveGame(g,true);assert.ok(g.decidingPenalties[0]!==g.decidingPenalties[1]);if(g.winner==='flamengo')wins++;}assert.ok(wins/n>.65);
 console.log('Pênaltis: favorito',p.home/n,'zebra',p.away/n);
});
test('500 Copas do Brasil favorecem os clubes fortes em vez de tratar todos como iguais',()=>{
 let top=0,low=0;for(let seed=1;seed<=500;seed++){const m=new B.CompetitionManager();m.create('cup','flamengo',data.teams,'copa-brasil',{seed,ephemeral:true});let count=0;while(!m.current.complete&&count++<30)m.completeRound();assert.ok(m.current.complete);const stars=B.clubRating(m.current.champion).stars;if(stars===5)top++;if(stars<=2)low++;}
 assert.ok(top>225,`cinco estrelas: ${top}/500`);assert.ok(low<10,`até duas estrelas: ${low}/500`);console.log('Copas: campeões 5 estrelas',top,'campeões até 2 estrelas',low);
});
test('save/load mantém a reprodução dos resultados com o novo modelo',()=>{
 const a=new B.CompetitionManager();a.create('cup','flamengo',data.teams,'copa-brasil',{seed:49});a.completeRound();const b=new B.CompetitionManager();a.completeRound();b.completeRound();assert.deepEqual(a.current,b.current);
});
