'use strict';
(() => {
 const B=window.BSS;
 B.CompetitionManager=class {
  constructor(){this.current=B.safeStorage.get('competition');if(this.current?.version!==1)this.current=null;}
  static schedule(ids){const ring=[...ids],rounds=[];if(ring.length%2)ring.push(null);for(let r=0;r<ring.length-1;r++){const pairs=[];for(let i=0;i<ring.length/2;i++){let a=ring[i],b=ring[ring.length-1-i];if(r%2)[a,b]=[b,a];if(a&&b)pairs.push({home:a,away:b,result:null});}rounds.push(pairs);ring.splice(1,0,ring.pop());}return [...rounds,...rounds.map(round=>round.map(g=>({home:g.away,away:g.home,result:null})))];}
  create(type,team,teams){const ids=teams.map(t=>t.id);this.current={version:1,type,team,round:0,complete:false,history:[],table:ids.map(id=>({id,p:0,j:0,v:0,e:0,d:0,gp:0,gc:0})),rounds:type==='league'?B.CompetitionManager.schedule(ids):[[team,...ids.filter(id=>id!==team).slice(0,7)].reduce((a,id,i,all)=>{if(i%2===0)a.push({home:id,away:all[i+1],result:null});return a;},[])]};this.save();return this.current;}
  standings(){return [...this.current.table].sort((a,b)=>b.p-a.p||b.v-a.v||(b.gp-b.gc)-(a.gp-a.gc)||b.gp-a.gp||a.id.localeCompare(b.id));}
  fixture(){const c=this.current;if(!c||c.complete)return null;return c.rounds[c.round].find(g=>!g.result&&(g.home===c.team||g.away===c.team))||null;}
  static points(row,gf,ga){row.j++;row.gp+=gf;row.gc+=ga;if(gf>ga){row.v++;row.p+=3;}else if(gf===ga){row.e++;row.p++;}else row.d++;}
  record(home,away,score,pens){const c=this.current,round=c.rounds[c.round],fixture=round.find(g=>g.home===home&&g.away===away);if(!fixture||fixture.result)return false;fixture.result=[...score];fixture.winner=score[0]===score[1]?(pens?.winner===0?home:away):(score[0]>score[1]?home:away);if(pens)fixture.penalties=[...pens.scores];this.completeRound();return true;}
  completeRound(){const c=this.current,round=c.rounds[c.round],random=B.rng(2026+c.round);for(const g of round){if(!g.result){g.result=[Math.floor(random()*4),Math.floor(random()*4)];g.winner=g.result[0]===g.result[1]?(random()<.5?g.home:g.away):g.result[0]>g.result[1]?g.home:g.away;}if(c.type==='league'){B.CompetitionManager.points(c.table.find(t=>t.id===g.home),g.result[0],g.result[1]);B.CompetitionManager.points(c.table.find(t=>t.id===g.away),g.result[1],g.result[0]);}}c.history.push({round:c.round,games:JSON.parse(JSON.stringify(round))});c.round++;if(c.type==='cup'){const winners=round.map(g=>g.winner);if(winners.length===1){c.complete=true;c.champion=winners[0];}else c.rounds.push(winners.reduce((a,id,i)=>{if(i%2===0)a.push({home:id,away:winners[i+1],result:null});return a;},[]));}else if(c.round>=38){c.complete=true;c.champion=this.standings()[0].id;}this.save();}
  save(){return B.safeStorage.set('competition',this.current);}
 };
})();
