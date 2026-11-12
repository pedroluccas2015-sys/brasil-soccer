'use strict';
window.BSS.Team=class {
 constructor(data,side,formation,lineup,tactics){const B=window.BSS;this.data=data;this.rating=data.clubRating||B.clubRating(data.id);this.side=side;this.dir=side===0?1:-1;const selected=B.Lineup.select(lineup?lineup.slice(0,11):data.players,formation||data.formation);if(lineup)selected.players.push(...lineup.slice(11));this.formation=selected.formation;this.tactics={...B.DEFAULT_TACTICS,...tactics};const records=selected.players;const count=B.FORMATIONS[this.formation].length;this.players=records.slice(0,count).map((p,i)=>new B.Player(p,this,i));this.bench=records.slice(count).map(p=>({...p}));this.subs=0;this.score=0;this.stats={possession:0,shots:0,onTarget:0,passes:0,completed:0,fouls:0,corners:0,offsides:0};this.kit=data.kit.home;this.position();}
 position(){const B=window.BSS;this.players.forEach((p,i)=>{const pos=B.FORMATIONS[this.formation][i];p.role=pos.role;p.home={x:(this.dir>0?pos.x:1-pos.x)*B.FIELD.w,y:(this.dir>0?pos.y:1-pos.y)*B.FIELD.h};p.x=p.home.x;p.y=p.home.y;p.px=p.x;p.py=p.y;p.vx=p.vy=0;p.facing={x:this.dir,y:0};p.anim='idle';p.animTime=0;p.slideDirection=null;});}
 setFormation(formation){const selected=window.BSS.Lineup.assign(this.players,formation);if(!selected?.valid)return false;this.formation=formation;this.players=selected.players;this.applyShape();return true;}
 applyShape(){const B=window.BSS;this.players.forEach((p,i)=>{const pos=B.FORMATIONS[this.formation][i];p.index=i;p.role=pos.role;p.home={x:(this.dir>0?pos.x:1-pos.x)*B.FIELD.w,y:(this.dir>0?pos.y:1-pos.y)*B.FIELD.h};});}
 substitute(index,benchIndex){this.substitutionError='';if(this.subs>=5){this.substitutionError='Limite de cinco substituições atingido.';return false;}const B=window.BSS,old=this.players[index],record=this.bench[benchIndex];if(!old||!record||old.red)return false;
  if((old.role==='GK')!==(record.position==='GK')){this.substitutionError='Troque goleiro por goleiro.';return false;}
  const fresh=new B.Player(record,this,index),candidate=[...this.players];Object.assign(fresh,{x:old.x,y:old.y,px:old.x,py:old.y,home:old.home,role:old.role});candidate[index]=fresh;
  const selected=B.Lineup.select(candidate,this.formation);if(!selected?.valid){this.substitutionError='Não há atletas suficientes nas posições deste esquema.';return false;}
  this.players=selected.players;this.formation=selected.formation;this.applyShape();this.bench.splice(benchIndex,1);this.subs++;return fresh;
 }
};
