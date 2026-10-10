'use strict';
(() => {
 const B=window.BSS,copy=x=>JSON.parse(JSON.stringify(x));
 const row=id=>({id,p:0,j:0,v:0,e:0,d:0,gp:0,gc:0,red:0,yellow:0});
 const pair=(home,away)=>({home,away,result:null});
 B.CompetitionManager=class {
  constructor(data=window.BSS_DATA?.competitions){this.data=data;this.current=B.safeStorage.get('competition-v2');if(this.current?.version!==2)this.current=null;}
  definitions(kind){return this.data.definitions.filter(d=>!kind||d.kind===kind);}
  definition(id){return this.data.definitions.find(d=>d.id===id);}
  static schedule(ids,double=true){const ring=[...ids],rounds=[];if(ring.length%2)ring.push(null);for(let r=0;r<ring.length-1;r++){const games=[];for(let i=0;i<ring.length/2;i++){let a=ring[i],b=ring[ring.length-1-i];if(r%2)[a,b]=[b,a];if(a&&b)games.push(pair(a,b));}rounds.push(games);ring.splice(1,0,ring.pop());}return double?[...rounds,...rounds.map(r=>r.map(g=>pair(g.away,g.home)))]:rounds;}
  random(){const c=this.current;c.rngState=(Math.imul(c.rngState,1664525)+1013904223)>>>0;return c.rngState/4294967296;}
  shuffle(ids){const a=[...ids];for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  create(type,team,teams,competitionId,options={}){
   const def=this.definition(competitionId||(type==='league'?'serie-a':'copa-brasil'));if(!def)throw Error('Competição não encontrada.');
   if(![...def.teams,...def.lateEntrants||[]].includes(team))throw Error('Clube não participa desta competição.');
   this.current={version:2,id:def.id,type:def.kind,format:def.format,name:def.name,team,penaltyOnly:type==='penalty-cup'||!!options.penaltyOnly,round:0,complete:false,history:[],stages:[],rngState:options.seed??Date.now()>>>0,totalTable:[...new Set([...def.teams,...def.lateEntrants||[]])].map(row),promoted:[],relegated:[],qualified:{},rounds:[],seedOrder:[]};this.current.seedOrder=this.shuffle(this.data.definitions.flatMap(x=>x.teams).filter((v,i,a)=>a.indexOf(v)===i));
   if(def.format==='cdb')this.knockout('cdb-3','Terceira fase',def.initialPairs,1);
   else this.groupStage('groups',def.groups?'Fase de grupos':'Primeira fase',def.groups||[def.teams],def.format!=='c');
   if(!options.ephemeral)this.save();return this.current;
  }
  archiveStage(){const c=this.current;if(c.stage)c.stages.push({id:c.stage,name:c.stageName,groups:copy(c.groups||[]),table:copy(c.table||[]),rounds:copy(c.rounds)});}
  groupStage(stage,name,groups,double=true){const c=this.current;this.archiveStage();c.stage=stage;c.stageName=name;c.phase='groups';c.groups=copy(groups);c.table=groups.flat().map(row);c.round=0;const schedules=groups.map(g=>B.CompetitionManager.schedule(g,double));c.rounds=schedules[0].map((_,i)=>schedules.flatMap((s,k)=>s[i].map(g=>({...g,group:k}))));if(c.format==='c'&&stage==='groups')this.balanceMandates(groups[0].slice(0,10));}
  balanceMandates(extra){const c=this.current,desired=new Set(extra),ids=c.groups[0],games=c.rounds.flat(),counts=Object.fromEntries(ids.map(id=>[id,games.filter(g=>g.home===id).length]));for(let guard=0;guard<100;guard++){const over=ids.find(id=>counts[id]>(desired.has(id)?10:9)),under=ids.find(id=>counts[id]<(desired.has(id)?10:9));if(!over||!under)break;const paths=[[over,[]]],seen=new Set([over]);let route;while(paths.length){const [at,edges]=paths.shift();if(at===under){route=edges;break;}for(const g of games.filter(g=>g.home===at&&!seen.has(g.away))){seen.add(g.away);paths.push([g.away,[...edges,g]]);}}if(!route)throw Error('Calendário inválido');for(const g of route){counts[g.home]--;counts[g.away]++;[g.home,g.away]=[g.away,g.home];}}}
  knockout(stage,name,pairs,legs=2,opts={}){const c=this.current;this.archiveStage();c.stage=stage;c.stageName=name;c.phase='knockout';c.groups=[];c.table=[];c.round=0;c.ties=pairs.map(([a,b],i)=>({id:stage+'-'+i,a,b,legs,advantage:opts.advantage?b:null,purpose:opts.purposes?.[i]||'advance'}));c.rounds=[c.ties.map(t=>({...pair(t.a,t.b),tie:t.id,leg:1}))];if(legs===2)c.rounds.push(c.ties.map(t=>({...pair(t.b,t.a),tie:t.id,leg:2})));c.extraTime=!!opts.extraTime;}
  static points(r,gf,ga){r.j++;r.gp+=gf;r.gc+=ga;if(gf>ga){r.v++;r.p+=3;}else if(gf===ga){r.e++;r.p++;}else r.d++;}
  rank(rows,games=[],continental=false,h2h=true){
   const c=this.current,base=(a,b)=>b.p-a.p||(!continental?b.v-a.v:0)||(b.gp-b.gc)-(a.gp-a.gc)||b.gp-a.gp;
   const mini=ids=>{let rs=ids.map(row);for(const g of games.filter(g=>g.result&&ids.includes(g.home)&&ids.includes(g.away))){B.CompetitionManager.points(rs.find(r=>r.id===g.home),...g.result);B.CompetitionManager.points(rs.find(r=>r.id===g.away),...g.result.slice().reverse());}return Object.fromEntries(rs.map(r=>[r.id,r]));};
   return [...rows].sort((a,b)=>{let diff=b.p-a.p;if(diff)return diff;if(continental){let peers=rows.filter(t=>t.p===a.p).map(t=>t.id),m=mini(peers);diff=m[b.id].p-m[a.id].p||(m[b.id].gp-m[b.id].gc)-(m[a.id].gp-m[a.id].gc)||m[b.id].gp-m[a.id].gp;if(diff)return diff;diff=(b.gp-b.gc)-(a.gp-a.gc)||b.gp-a.gp;}else{diff=base(a,b);if(!diff&&h2h&&rows.filter(t=>!base(a,t)).length===2){let m=mini([a.id,b.id]);diff=m[b.id].gp-m[a.id].gp;}}return diff||a.red-b.red||a.yellow-b.yellow||c.seedOrder.indexOf(a.id)-c.seedOrder.indexOf(b.id);});
  }
  standings(group){const c=this.current,rows=group==null?c.table:c.table.filter(r=>c.groups[group]?.includes(r.id));return this.rank(rows,c.rounds.flat(),['lib','sud'].includes(c.format),!(c.format==='c'&&c.stage==='groups'));}
  totalRank(ids){return this.rank(this.current.totalTable.filter(r=>ids.includes(r.id)),[],false,false).map(r=>r.id);}
  fixture(){const c=this.current;if(!c||c.complete)return null;return c.rounds[c.round]?.find(g=>(!g.result||g.needsTiebreak)&&(g.home===c.team||g.away===c.team))||null;}
  matchOptions(g){const c=this.current;if(g.needsTiebreak)return {mode:'penalties',competition:true,tieBreakOnly:true};if(c.penaltyOnly)return {mode:'penalties',competition:true};const tie=c.ties?.find(t=>t.id===g.tie),first=tie?.legs===2&&g.leg===2?c.rounds[0].find(x=>x.tie===g.tie):null;return {mode:c.phase==='groups'?'league':'cup',competition:true,matchRules:{decisive:!!tie&&g.leg===tie.legs,carry:first?[first.result[1],first.result[0]]:[0,0],advantage:tie?.advantage||null,extraTime:c.extraTime}};}
  record(home,away,score,pens,cards){const c=this.current;if(!c||c.complete)return false;const g=c.rounds[c.round]?.find(x=>x.home===home&&x.away===away);if(!g)return false;
   if(g.needsTiebreak){if(pens?.winner==null)return false;g.decidingPenalties=copy(pens.scores);g.winner=pens.winner===0?home:away;g.needsTiebreak=false;this.completeRound();return true;}
   if(g.result)return false;if(c.penaltyOnly&&pens?.winner==null)return false;
   g.result=[...(c.penaltyOnly?pens.scores:score)];g.cards=cards||[{yellow:0,red:0},{yellow:0,red:0}];if(pens)g.penalties=[...pens.scores];
   if(!c.penaltyOnly&&pens?.winner!=null)g.winner=pens.winner===0?home:away;
   this.resolveGame(g,false);if(g.needsTiebreak){this.save();return true;}this.completeRound();return true;
  }
  aggregate(g){const c=this.current,t=c.ties?.find(t=>t.id===g.tie);if(!t)return g.result;const first=t.legs===2?c.rounds[0].find(x=>x.tie===g.tie):null;return t.legs===2&&g.leg===2?[g.result[0]+first.result[1],g.result[1]+first.result[0]]:[...g.result];}
  resolveGame(g,simulated){const c=this.current;if(c.phase==='groups')return;const t=c.ties.find(t=>t.id===g.tie);if(g.leg!==t.legs)return;let [a,b]=this.aggregate(g);if(a!==b)g.winner=a>b?g.home:g.away;else if(t.advantage)g.winner=t.advantage;else if(!g.winner){if(simulated){g.winner=this.random()<.5?g.home:g.away;g.decidingPenalties=g.winner===g.home?[5,4]:[4,5];}else g.needsTiebreak=true;}}
  simulate(g){const c=this.current;g.result=c.penaltyOnly?[3+Math.floor(this.random()*3),3+Math.floor(this.random()*3)]:[Math.floor(this.random()*4),Math.floor(this.random()*4)];if(c.penaltyOnly&&g.result[0]===g.result[1])g.result[this.random()<.5?0:1]++;if(c.penaltyOnly)g.penalties=[...g.result];g.cards=c.penaltyOnly?[{yellow:0,red:0},{yellow:0,red:0}]:[{yellow:Math.floor(this.random()*4),red:this.random()<.05?1:0},{yellow:Math.floor(this.random()*4),red:this.random()<.05?1:0}];this.resolveGame(g,true);}
  completeRound(){const c=this.current;if(!c||c.complete)return false;const games=c.rounds[c.round];if(games.some(g=>g.needsTiebreak))return false;for(const g of games){if(!g.result)this.simulate(g);for(const [i,id] of [g.home,g.away].entries()){let total=c.totalTable.find(r=>r.id===id);if(!total){total=row(id);c.totalTable.push(total);}const targets=[total,...(c.phase==='groups'?[c.table.find(r=>r.id===id)]:[])];for(const r of targets){B.CompetitionManager.points(r,g.result[i],g.result[1-i]);r.red+=g.cards?.[i]?.red||0;r.yellow+=g.cards?.[i]?.yellow||0;}}}c.history.push({stage:c.stage,label:c.stageName,round:c.round,games:copy(games)});c.round++;if(c.round>=c.rounds.length)this.advanceStage();this.save();return true;}
  orderedPairs(ids){return Array.from({length:ids.length/2},(_,i)=>[ids[2*i],ids[2*i+1]]);}
  homeByPerformance(pairs){const c=this.current,order=c.format==='c'?[...c.totalTable].sort((a,b)=>b.p-a.p||b.v-a.v||(b.gp-b.gc)-(a.gp-a.gc)||c.seedOrder.indexOf(a.id)-c.seedOrder.indexOf(b.id)).map(r=>r.id):this.totalRank(pairs.flat());return pairs.map(([a,b])=>order.indexOf(a)<order.indexOf(b)?[b,a]:[a,b]);}
  winners(){const c=this.current;return c.ties.map(t=>c.rounds.at(-1).find(g=>g.tie===t.id).winner);}
  finish(champion){const c=this.current;c.complete=true;c.champion=champion;this.archiveStage();}
  simulateGroups(id){const def=this.definition(id),shadow=new B.CompetitionManager(this.data);shadow.create('cup',def.teams[0],null,id,{seed:Math.floor(this.random()*2**32),penaltyOnly:this.current.penaltyOnly,ephemeral:true});const sc=shadow.current;for(const games of sc.rounds)for(const g of games){shadow.simulate(g);for(const [i,tid] of [g.home,g.away].entries()){const rr=sc.table.find(r=>r.id===tid);B.CompetitionManager.points(rr,g.result[i],g.result[1-i]);rr.red+=g.cards[i].red;rr.yellow+=g.cards[i].yellow;}}return {ranks:sc.groups.map((_,i)=>shadow.standings(i)),rounds:copy(sc.rounds),table:copy(sc.table)};}
  startSudPlayoff(sudRanks,libThirds){const c=this.current;c.sudLeaders=this.rank(sudRanks.map(r=>r[0]),[],true,false).map(r=>r.id);const seconds=this.rank(sudRanks.map(r=>r[1]),[],true,false),thirds=this.rank(libThirds,[],true,false);c.continentalSeed=[...c.sudLeaders,...seconds.map(r=>r.id),...thirds.map(r=>r.id)];this.knockout('sud-playoff','Playoffs da Sul-Americana',seconds.map((r,i)=>[thirds[7-i].id,r.id]),2);}
  advanceStage(){const c=this.current,f=c.format;
   if(c.phase==='groups'){
    const ranks=c.groups.map((_,i)=>this.standings(i)),ids=ranks[0].map(r=>r.id);
    if(f==='a'){c.relegated=ids.slice(-4);c.qualified={libertadoresGroups:ids.slice(0,4),libertadoresPreliminary:ids.slice(4,5),sudamericana:ids.slice(5,11)};c.qualificationPending=true;this.finish(ids[0]);return;}
    if(f==='b'){c.champion=ids[0];c.promoted=ids.slice(0,2);c.relegated=ids.slice(-4);this.knockout('b-playoff','Playoffs de acesso à Série A',[[ids[5],ids[2]],[ids[4],ids[3]]],2,{advantage:true});return;}
    if(f==='c'){if(c.stage==='groups'){c.relegated=ids.slice(-2);this.groupStage('quadrangular','Quadrangulares de acesso',[[0,3,4,7],[1,2,5,6]].map(pos=>pos.map(i=>ids[i])));return;}c.promoted=ranks.flatMap(r=>r.slice(0,2).map(t=>t.id));this.knockout('final','Final da Série C',this.homeByPerformance([[ranks[0][0].id,ranks[1][0].id]]),2);return;}
    if(f==='d'){const pairs=[];for(let i=0;i<16;i+=2){let a=ranks[i].map(r=>r.id),b=ranks[i+1].map(r=>r.id);pairs.push([b[3],a[0]],[a[2],b[1]],[a[3],b[0]],[b[2],a[1]]);}this.knockout('d-64','Segunda fase · 64 clubes',pairs,2);return;}
    if(f==='lib'){c.transferred=ranks.map(r=>r[2].id);if(c.transferred.includes(c.team)){const shadow=this.simulateGroups('sul-americana');c.shadowGroups={competition:'Sul-Americana',...shadow};c.format='sud';c.name='Sul-Americana 2026 · via Libertadores';this.startSudPlayoff(shadow.ranks,ranks.map(r=>r[2]));return;}const first=this.rank(ranks.map(r=>r[0]),[],true,false).map(r=>r.id),second=this.rank(ranks.map(r=>r[1]),[],true,false).map(r=>r.id);c.continentalSeed=[...first,...second];const drawn=this.shuffle(second);this.knockout('r16','Oitavas de final',this.shuffle(first).map((id,i)=>[drawn[i],id]),2);return;}
    if(f==='sud'){const shadow=this.simulateGroups('libertadores');c.shadowGroups={competition:'Libertadores',...shadow};this.startSudPlayoff(ranks,shadow.ranks.map(r=>r[2]));return;}
   }
   const winners=this.winners(),stage=c.stage;
   if(stage==='b-playoff'){c.promoted.push(...winners);this.finish(c.champion);return;}
   if(stage==='cdb-3'){this.knockout('cdb-4','Quarta fase',this.orderedPairs(winners),1);return;}
   if(stage==='cdb-4'){const ids=[...winners,...this.definition(c.id).lateEntrants],ranking=this.data.cbfRanking||[];ids.sort((a,b)=>(ranking.indexOf(a)<0?999:ranking.indexOf(a))-(ranking.indexOf(b)<0?999:ranking.indexOf(b)));const a=this.shuffle(ids.slice(0,16)),b=this.shuffle(ids.slice(16));this.knockout('r32','Quinta fase · 32 clubes',a.map((id,i)=>this.random()<.5?[id,b[i]]:[b[i],id]),2);return;}
   if(stage==='sud-playoff'){const draw=this.shuffle(winners);this.knockout('r16','Oitavas de final',this.shuffle(c.sudLeaders).map((id,i)=>[draw[i],id]),2);return;}
   if(stage==='d-64'||stage==='d-32'){if(stage==='d-64')c.qualified.serieD2027=[...winners];const p=[];for(let j=0;j<winners.length;j+=8)for(const [a,b] of [[0,5],[1,4],[2,7],[3,6]])p.push([winners[j+a],winners[j+b]]);this.knockout(stage==='d-64'?'d-32':'d-16',stage==='d-64'?'Terceira fase · 32 clubes':'Oitavas de final',this.homeByPerformance(p),2);return;}
   if(stage==='d-16'){const r=this.totalRank(winners);this.knockout('d-8','Quartas de final',[[r[7],r[0]],[r[4],r[3]],[r[6],r[1]],[r[5],r[2]]],2);return;}
   if(stage==='d-8'){c.promoted=[...winners];const losers=c.ties.map((t,i)=>t.a===winners[i]?t.b:t.a),r=this.totalRank(losers);this.knockout('d-semi','Semifinais e playoffs de acesso',[...this.homeByPerformance(this.orderedPairs(winners)),[r[3],r[0]],[r[2],r[1]]],2,{purposes:['advance','advance','promotion','promotion']});return;}
   if(stage==='d-semi'){c.promoted.push(...winners.slice(2));this.knockout('final','Final da Série D',this.homeByPerformance([[winners[0],winners[1]]]),2);return;}
   if(winners.length===1){c.runnerUp=c.ties[0].a===winners[0]?c.ties[0].b:c.ties[0].a;this.finish(winners[0]);return;}
   const next=winners.length===2?'final':winners.length===4?'semi':winners.length===8?'r8':'r16',names={final:'Final',semi:'Semifinais',r8:'Quartas de final',r16:'Oitavas de final'};
   let pairs=this.orderedPairs(winners);if(f==='cdb'&&['r16','r8'].includes(next))pairs=this.orderedPairs(this.shuffle(winners));if(f==='cdb'&&next==='semi')pairs=pairs.map(p=>this.random()<.5?p:p.slice().reverse());if(['lib','sud'].includes(f))pairs=pairs.map(([a,b])=>c.continentalSeed.indexOf(a)<c.continentalSeed.indexOf(b)?[b,a]:[a,b]);
   this.knockout(next,names[next],pairs,next==='final'&&['lib','sud','cdb'].includes(f)?1:2,{extraTime:next==='final'&&['lib','sud'].includes(f)});
  }
  updateQualification(results){
   const c=this.current;if(c.format!=='a'||!c.complete)throw Error('Conclua a Série A primeiro.');
   const {cupChampion:cc,cupRunnerUp:cr,libChampion:lc,sudChampion:sc}=results;
   if(!cc||!cr||!lc||!sc)throw Error('Informe os quatro resultados para calcular a redistribuição.');
   if(cc===cr||lc===sc)throw Error('Campeão e vice devem ser diferentes; os campeões continentais também.');
   const domestic=[...this.definition('copa-brasil').teams,...this.definition('copa-brasil').lateEntrants];
   if(!domestic.includes(cc)||!domestic.includes(cr))throw Error('Finalistas precisam participar da Copa do Brasil.');
   const lib=this.definition('libertadores').teams,sud=this.definition('sul-americana').teams;
   if(!lib.includes(lc)||![...lib,...sud].includes(sc))throw Error('Campeões precisam participar das respectivas copas.');
   const promoted=results.promotedB||[];
   if(promoted.length!==4||new Set(promoted).size!==4||promoted.some(id=>!this.definition('serie-b').teams.includes(id)))throw Error('Informe os quatro promovidos da Série B, sem repetir clubes.');
   const ranking=this.standings().map(r=>r.id).filter(id=>!c.relegated.includes(id)),eligible=new Set([...ranking,...promoted]),direct=new Set([lc,sc].filter(id=>eligible.has(id))),pre=new Set();let duplicateDirect=0,duplicatePre=0;
   const add=(id,kind)=>{if(kind==='direct'){if(direct.has(id))duplicateDirect++;else{direct.add(id);if(pre.delete(id))duplicatePre++;}}else if(direct.has(id)||pre.has(id))duplicatePre++;else pre.add(id);};
   ranking.slice(0,4).forEach(id=>add(id,'direct'));add(ranking[4],'pre');
   if(direct.has(cc)||!eligible.has(cc)){if(eligible.has(cr))add(cr,'direct');else duplicateDirect++;duplicatePre++;}else{add(cc,'direct');if(eligible.has(cr))add(cr,'pre');else duplicatePre++;}
   const next=()=>ranking.find(id=>!direct.has(id)&&!pre.has(id));
   while(duplicateDirect-->0){const id=ranking.find(id=>!direct.has(id));if(id){direct.add(id);if(pre.delete(id))duplicatePre++;}}while(duplicatePre-->0){const id=next();if(id)pre.add(id);}
   c.qualified={libertadoresGroups:[...direct],libertadoresPreliminary:[...pre],sudamericana:ranking.filter(id=>!direct.has(id)&&!pre.has(id)).slice(0,6)};c.cupResults=results;c.qualificationPending=false;this.save();
  }
  save(){return B.safeStorage.set('competition-v2',this.current);}
 };
})();
