'use strict';
window.BSS.Ball=class {
 constructor(){this.radius=3;this.reset(525,340);}
 reset(x,y){Object.assign(this,{x,y,px:x,py:y,z:0,pz:0,vx:0,vy:0,vz:0,spin:0,lastTouch:null,owner:null,lock:0,pass:null,shot:null,roll:0,impactTime:0,impactKind:'',trail:[],trailClock:0,net:null});}
 impact(kind,strength=1){this.impactKind=kind;this.impactTime=.18;this.impactStrength=Math.min(1,strength);}
 animate(dt){
  const distance=Math.hypot(this.x-this.px,this.y-this.py,this.z-this.pz);
  this.roll=(this.roll+distance/this.radius*.55)%(Math.PI*2);
  this.impactTime=Math.max(0,this.impactTime-dt);this.trailClock+=dt;
  this.trail=this.trail.filter(p=>(p.age+=dt)<.1);
  if(this.trailClock>=1/60){this.trailClock=0;if(Math.hypot(this.vx,this.vy,this.vz)>120)this.trail.push({x:this.x,y:this.y,z:this.z,age:0});}
 }
 enterNet(line){this.owner=null;this.net={line,dir:line===0?-1:1,age:0,ripple:0};}
 update(dt){
  if(this.owner?.role==='GK'){
   this.px=this.x;this.py=this.y;this.pz=this.z;this.x=this.owner.x+this.owner.facing.x*5;this.y=this.owner.y;this.z=12;this.vx=this.vy=this.vz=0;this.lock=Math.max(0,this.lock-dt);this.animate(dt);return;
  }
  this.lock=Math.max(0,this.lock-dt);window.BSS.Physics.ball(this,dt);
  if(this.net){
   const n=this.net;n.age+=dt;n.ripple=Math.max(0,n.ripple-dt*2.8);
   const depth=(this.x-n.line)*n.dir;
   if(depth>23){this.x=n.line+n.dir*23;this.vx=-this.vx*.22;this.vy*=.5;this.vz*=.45;n.ripple=1;this.impact('net');}
   if(depth<1){this.x=n.line+n.dir;this.vx=Math.abs(this.vx)*n.dir*.2;}
   if(this.y<285||this.y>395){this.y=window.BSS.clamp(this.y,285,395);this.vy*=-.25;n.ripple=.7;}
   if(this.z>38){this.z=38;this.vz=-Math.abs(this.vz)*.3;n.ripple=.7;}
   const drag=Math.exp(-dt*2.2);this.vx*=drag;this.vy*=drag;
  }
  this.animate(dt);
 }
 kick(p,dx,dy,speed,lift=0,spin=0){const n=window.BSS.norm(dx,dy);this.owner=null;this.net=null;this.trail=[];this.lastTouch=p;this.x=p.x+n.x*12;this.y=p.y+n.y*12;this.z=Math.max(this.z,1);this.vx=n.x*speed;this.vy=n.y*speed;this.vz=lift;this.spin=spin;this.impact('kick',speed/500);this.lock=.23;p.touchDelay=.27;p.anim=lift>30?'long':'kick';p.animTime=.28;}
};
