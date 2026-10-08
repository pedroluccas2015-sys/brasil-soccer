'use strict';
window.BSS.Camera=class {
 constructor(){this.x=525;this.y=340;this.zoom=.61;}
  update(m,dt){const B=window.BSS,b=m.ball,p=m.controlled;let x=b.x+B.clamp(b.vx*.2,-65,65),y=b.y+B.clamp(b.vy*.13,-30,30),zoom=.61;if(p){const distance=B.dist(p,b),weight=distance>250?.46:.15;x=B.lerp(x,p.x,weight);y=B.lerp(y,p.y,weight);zoom=B.clamp(Math.min(335/(Math.abs(p.x-b.x)+180),245/(Math.abs(p.y-b.y)+170)),.34,.61);}this.zoom=B.lerp(this.zoom,zoom,1-Math.exp(-dt*3));this.x=B.lerp(this.x,B.clamp(x,235,815),1-Math.exp(-dt*4));this.y=B.lerp(this.y,B.clamp(y,130,550),1-Math.exp(-dt*3));}
 project(x,y,z=0){return {x:Math.round(192+(x-this.x)*this.zoom+(y-this.y)*.09),y:Math.round(125+(y-this.y)*this.zoom*.67-z*this.zoom)};}
};
