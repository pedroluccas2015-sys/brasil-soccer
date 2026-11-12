'use strict';
window.BSS.SLIDE=Object.freeze({duration:.60,recovery:.18});
window.BSS.Player=class {
 static kickPose(progress){const B=window.BSS,t=B.clamp(progress,0,1),keys=[{t:0,u:-4,z:0,knee:-2,lean:1,arm:0},{t:.30,u:-8,z:5,knee:-4,lean:-1,arm:2},{t:.48,u:10,z:1,knee:5,lean:-2,arm:3},{t:.72,u:15,z:11,knee:8,lean:2,arm:2},{t:1,u:2,z:0,knee:0,lean:0,arm:0}];let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;const a=keys[i],b=keys[i+1],mix=(t-a.t)/(b.t-a.t),pose={};for(const k of ['u','z','knee','lean','arm'])pose[k]=B.lerp(a[k],b[k],mix);return pose;}
 static slidePose(p,progress=1-p.animTime/window.BSS.SLIDE.duration){
  const B=window.BSS,n=B.norm((p.slideDirection||p.facing).x,(p.slideDirection||p.facing).y),t=B.clamp(progress,0,1);
  // Longitudinal coordinates keep the extended boot in front in every direction.
  const standing={head:[0,0,22],shoulder:[-1,0,14],hip:[0,0,8],knee:[2,-2,4],foot:[3,-2,0],backKnee:[-1,2,4],backFoot:[-2,2,0],hand:[-1,-5,9],backHand:[-1,5,9]};
  const sliding={head:[-10,0,8],shoulder:[-6,0,5],hip:[0,0,2],knee:[7,-2,2],foot:[14,-2,1],backKnee:[1,5,3],backFoot:[6,7,1],hand:[-8,-6,1],backHand:[-7,6,1]};
  const blend=t<.16?t/.16:t<.70?1:1-(t-.70)/.30,joints={};
  for(const key of Object.keys(standing))joints[key]=standing[key].map((v,i)=>B.lerp(v,sliding[key][i],B.clamp(blend,0,1)));
  return {direction:n,joints,progress:t};
 }
 constructor(data,team,index){Object.assign(this,data);this.team=team;this.index=index;this.radius=7;this.x=window.BSS.FIELD.cx;this.y=window.BSS.FIELD.cy;this.px=this.x;this.py=this.y;this.vx=0;this.vy=0;this.facing={x:team.dir,y:0};this.energy=1;this.state='FORMATION';this.anim='idle';this.animTime=0;this.touchDelay=0;this.decision=0;this.actionCooldown=0;this.yellow=0;this.red=false;this.runTime=0;this.dash=0;this.heldTime=0;this.role=index===0?'GK':'MF';}
 move(dx,dy,sprint,dt){
  const B=window.BSS,F=B.FIELD;this.px=this.x;this.py=this.y;if(this.red)return;
  const moving=Math.hypot(dx,dy)>.08,n=B.norm(dx,dy),slidePose=this.anim==='slide'&&this.animTime>0,
  sliding=slidePose&&this.animTime>B.SLIDE.recovery,recovering=slidePose&&!sliding,fallen=this.anim==='fall'&&this.animTime>0;
  const running=moving&&sprint&&this.energy>.08&&!fallen;
  let speed=(70+this.attributes.pace*.43)*(running?1.38:1);
  this.energy=B.clamp(this.energy+dt*(running?-(.023+(100-this.attributes.stamina)*.00018):.014),0,1);
  speed*=.78+.22*this.energy;if(this.dash>0)speed*=1.25;
  // Slides commit to their launch direction. Fallen players cannot drift.
  let target=moving?n:{x:0,y:0};
  if(sliding){target=this.slideDirection||this.facing;speed*=1.5;}
  if(fallen||recovering){this.vx=this.vy=0;speed=0;}
  const reversing=moving&&this.vx*n.x+this.vy*n.y<0;
  const accel=!moving&&!sliding?19:reversing?18:9+this.attributes.acceleration*.075;
  const blend=1-Math.exp(-dt*accel),vx=target.x*speed,vy=target.y*speed;
  // Exact integration of the velocity response keeps travel consistent across tick rates.
  this.x=B.clamp(this.x+vx*dt+(this.vx-vx)*blend/accel,3,F.w-3);
  this.y=B.clamp(this.y+vy*dt+(this.vy-vy)*blend/accel,3,F.h-3);
  this.vx=B.lerp(this.vx,vx,blend);this.vy=B.lerp(this.vy,vy,blend);
  if(moving&&!slidePose&&!fallen)this.facing=n;
  this.runTime+=Math.hypot(this.x-this.px,this.y-this.py)*.14;
  this.animTime=Math.max(0,this.animTime-dt);
  if(!this.animTime){this.anim=Math.hypot(this.vx,this.vy)>8?(running?'sprint':'run'):'idle';this.slideDirection=null;}
  this.touchDelay=Math.max(0,this.touchDelay-dt);this.actionCooldown=Math.max(0,this.actionCooldown-dt);this.decision-=dt;this.dash=Math.max(0,this.dash-dt);this.runAfterPass=Math.max(0,(this.runAfterPass||0)-dt);
 }
};
