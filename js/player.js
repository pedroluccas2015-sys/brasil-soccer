'use strict';
window.BSS.Player=class {
 constructor(data,team,index){Object.assign(this,data);this.team=team;this.index=index;this.radius=7;this.x=window.BSS.FIELD.cx;this.y=window.BSS.FIELD.cy;this.px=this.x;this.py=this.y;this.vx=0;this.vy=0;this.facing={x:team.dir,y:0};this.energy=1;this.state='FORMATION';this.anim='idle';this.animTime=0;this.touchDelay=0;this.decision=0;this.actionCooldown=0;this.yellow=0;this.red=false;this.runTime=0;this.dash=0;this.heldTime=0;this.role=index===0?'GK':'MF';}
 move(dx,dy,sprint,dt){
  const B=window.BSS,F=B.FIELD;this.px=this.x;this.py=this.y;if(this.red)return;
  const moving=Math.hypot(dx,dy)>.08,n=B.norm(dx,dy),sliding=this.anim==='slide'&&this.animTime>0,fallen=this.anim==='fall'&&this.animTime>0;
  const running=moving&&sprint&&this.energy>.08&&!fallen;
  let speed=(70+this.attributes.pace*.43)*(running?1.38:1);
  this.energy=B.clamp(this.energy+dt*(running?-(.023+(100-this.attributes.stamina)*.00018):.014),0,1);
  speed*=.78+.22*this.energy;if(this.dash>0)speed*=1.25;
  // Slides commit to their launch direction. Fallen players cannot drift.
  let target=moving?n:{x:0,y:0};
  if(sliding){target=this.slideDirection||this.facing;speed*=1.5;}
  if(fallen){this.vx=this.vy=0;speed=0;}
  const reversing=moving&&this.vx*n.x+this.vy*n.y<0;
  const accel=!moving&&!sliding?19:reversing?18:9+this.attributes.acceleration*.075;
  const blend=1-Math.exp(-dt*accel),vx=target.x*speed,vy=target.y*speed;
  // Exact integration of the velocity response keeps travel consistent across tick rates.
  this.x=B.clamp(this.x+vx*dt+(this.vx-vx)*blend/accel,3,F.w-3);
  this.y=B.clamp(this.y+vy*dt+(this.vy-vy)*blend/accel,3,F.h-3);
  this.vx=B.lerp(this.vx,vx,blend);this.vy=B.lerp(this.vy,vy,blend);
  if(moving&&!sliding&&!fallen)this.facing=n;
  this.runTime+=Math.hypot(this.x-this.px,this.y-this.py)*.14;
  this.animTime=Math.max(0,this.animTime-dt);
  if(!this.animTime){this.anim=Math.hypot(this.vx,this.vy)>8?(running?'sprint':'run'):'idle';this.slideDirection=null;}
  this.touchDelay=Math.max(0,this.touchDelay-dt);this.actionCooldown=Math.max(0,this.actionCooldown-dt);this.decision-=dt;this.dash=Math.max(0,this.dash-dt);
 }
};
