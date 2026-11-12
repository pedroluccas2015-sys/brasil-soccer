'use strict';
window.BSS = window.BSS || {};
(() => {
 const B = window.BSS;
 B.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
 B.lerp = (a,b,t) => a+(b-a)*t;
 B.dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
 B.norm = (x,y) => {const n=Math.hypot(x,y); return n ? {x:x/n,y:y/n} : {x:0,y:0};};
 B.hash = s => {let h=2166136261; for(const c of s) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0;};
 B.rng = seed => () => {seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
 B.FIELD = Object.freeze({w:1470,h:952,cx:735,cy:476,goalTop:417,goalBottom:535,goalHeight:40});
 B.clubRating=(id,data=window.BSS_DATA?.competitions)=>data?.clubRatings?.clubs?.[id]||{strength:20,stars:1,status:'unranked',cbf:null,conmebol:null};
 B.safeStorage = {get(key,fallback=null){try{const v=localStorage.getItem('bss26:'+key);return v ? JSON.parse(v) : fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem('bss26:'+key,JSON.stringify(value));return true;}catch{return false;}}};
 B.GameEngine = class {
  constructor(update,render){this.update=update;this.render=render;this.acc=0;this.last=0;this.fps=60;this.running=false;}
  start(){if(this.running)return;this.running=true;const frame=t=>{if(!this.running)return;const delta=this.last ? Math.min((t-this.last)/1000,.1):0;this.last=t;this.fps=B.lerp(this.fps,1/Math.max(delta,.001),.03);this.acc+=delta;while(this.acc>=1/60){this.update(1/60);this.acc-=1/60;}this.render(this.acc*60);requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 };
})();

window.BSS.clubCode=function(team){const normalized=String(team.name||team.shortName||'CLU').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/^(?:(?:AA|AD|AC|CA|CD|CE|CF|CS|EC|FC|SC|CLUB|CLUBE|CLUBES|ASSOCIACAO|ATLETICA)\s+)+/,'').replace(/[^A-Z]/g,'');return (normalized+'CLU').slice(0,3);};

// Markings use the match's metre scale and the actual goalposts, in every view.
window.BSS.PITCH=Object.freeze({goalAreaDepth:55,penaltyDepth:165,penaltySpot:110,arcRadius:91.5,cornerRadius:10,keeperClearance:45,
 goalAreaHalfWidth:(window.BSS.FIELD.goalBottom-window.BSS.FIELD.goalTop)/2+55,
 penaltyHalfWidth:(window.BSS.FIELD.goalBottom-window.BSS.FIELD.goalTop)/2+165});
window.BSS.pitchMarkings=function(goalX,dir,centerY=window.BSS.FIELD.cy,halfGoal=(window.BSS.FIELD.goalBottom-window.BSS.FIELD.goalTop)/2,height=window.BSS.FIELD.h){
 const P=window.BSS.PITCH,lines=[],boxes=[{depth:P.penaltyDepth,half:halfGoal+P.penaltyDepth},{depth:P.goalAreaDepth,half:halfGoal+P.goalAreaDepth}];
 for(const box of boxes){const front=goalX-dir*box.depth,lo=centerY-box.half,hi=centerY+box.half;lines.push([{x:goalX,y:lo},{x:front,y:lo},{x:front,y:hi},{x:goalX,y:hi}]);}
 const angle=Math.acos((P.penaltyDepth-P.penaltySpot)/P.arcRadius),arc=[];
 for(let i=0;i<=40;i++){const a=-angle+i/40*2*angle;arc.push({x:goalX-dir*(P.penaltySpot+P.arcRadius*Math.cos(a)),y:centerY+P.arcRadius*Math.sin(a)});}lines.push(arc);
 for(const side of [0,1]){const corner=[];for(let i=0;i<=18;i++){const a=i/18*Math.PI/2;corner.push({x:goalX-dir*P.cornerRadius*Math.cos(a),y:side?height-P.cornerRadius*Math.sin(a):P.cornerRadius*Math.sin(a)});}lines.push(corner);}
 return {boxes,lines,spot:{x:goalX-dir*P.penaltySpot,y:centerY}};
};
