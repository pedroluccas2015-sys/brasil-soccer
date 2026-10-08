'use strict';
window.BSS.Camera=class {
 constructor(){const F=window.BSS.FIELD;this.x=F.cx;this.y=F.cy;this.zoom=.50;}
 update(m,dt){
  const B=window.BSS,F=B.FIELD,b=m.ball,p=m.controlled;
  let x=b.x+B.clamp(b.vx*.2,-65,65),y=b.y+B.clamp(b.vy*.13,-30,30),zoom=.50;
  if(p){const distance=B.dist(p,b),weight=distance>250?.35:.12;x=B.lerp(x,p.x,weight);y=B.lerp(y,p.y,weight);zoom=B.clamp(Math.min(335/(Math.abs(p.x-b.x)+215),245/(Math.abs(p.y-b.y)+200)),.32,.50);}
  this.zoom=B.lerp(this.zoom,zoom,1-Math.exp(-dt*3));
  this.x=B.lerp(this.x,B.clamp(x,270,F.w-270),1-Math.exp(-dt*4));
  this.y=B.lerp(this.y,B.clamp(y,160,F.h-160),1-Math.exp(-dt*3));
 }
 project(x,y,z=0){return {x:Math.round(192+(x-this.x)*this.zoom+(y-this.y)*.09),y:Math.round(125+(y-this.y)*this.zoom*.67-z*this.zoom)};}
};
