'use strict';
window.BSS.Team=class {
 constructor(data,side,formation,lineup,tactics){const B=window.BSS;this.data=data;this.side=side;this.dir=side===0?1:-1;this.formation=formation||data.formation;this.tactics={...B.DEFAULT_TACTICS,...tactics};const records=lineup||data.players;this.players=records.slice(0,11).map((p,i)=>new B.Player(p,this,i));this.bench=records.slice(11).map(p=>({...p}));this.subs=0;this.score=0;this.stats={possession:0,shots:0,onTarget:0,passes:0,completed:0,fouls:0,corners:0,offsides:0};this.kit=data.kit.home;this.position();}
 position(){const B=window.BSS;this.players.forEach((p,i)=>{const pos=B.FORMATIONS[this.formation][i];p.role=pos.role;p.home={x:(this.dir>0?pos.x:1-pos.x)*1050,y:pos.y*680};p.x=p.home.x;p.y=p.home.y;p.px=p.x;p.py=p.y;p.vx=p.vy=0;p.facing={x:this.dir,y:0};});}
 substitute(index,benchIndex){if(this.subs>=5)return false;const old=this.players[index],record=this.bench[benchIndex];if(!old||!record||old.red)return false;const p=new window.BSS.Player(record,this,index);Object.assign(p,{x:old.x,y:old.y,px:old.x,py:old.y,home:old.home,role:old.role});this.players[index]=p;this.bench.splice(benchIndex,1);this.subs++;return p;}
};
