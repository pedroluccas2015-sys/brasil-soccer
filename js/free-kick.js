'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 B.FreeKick=class {
  static eligible(team,x){return team.dir*(x-F.cx)>=0;}
  constructor(m,restart){
   this.side=restart.team;this.corner=restart.type==='ESCANTEIO';this.origin={x:restart.x,y:restart.y};this.dir=m.teams[this.side].dir;
   this.goal={x:this.dir>0?(F.w):0,y:(F.cy)};this.forward=B.norm(this.goal.x-this.origin.x,this.goal.y-this.origin.y);
   this.right={x:-this.forward.y,y:this.forward.x};this.distance=B.dist(this.origin,this.goal);
   this.phase='aim';this.time=0;this.elapsed=0;this.armed=false;this.aim=0;this.height=.55;this.power=.55;this.curve=0;this.flightTime=0;
   const team=m.teams[this.side],opponents=m.teams[1-this.side];
   this.taker=team.players.filter(p=>!p.red&&p.role!=='GK').sort((a,b)=>this.corner?(b.attributes.longPassing+b.attributes.passing)-(a.attributes.longPassing+a.attributes.passing):(b.attributes.shooting+b.attributes.control)-(a.attributes.shooting+a.attributes.control))[0]||restart.taker;
   restart.taker=this.taker;this.keeper=opponents.players.find(p=>!p.red&&p.role==='GK');
   this.wall=this.corner?[]:opponents.players.filter(p=>!p.red&&p.role!=='GK').sort((a,b)=>B.dist(a,this.origin)-B.dist(b,this.origin)).slice(0,this.distance<200?4:3);
   // Match coordinates use 10 world units per metre; keep the wall 9.15 m away.
   const wallDistance=Math.min(91.5,this.distance*.65),center={x:this.origin.x+this.forward.x*wallDistance,y:this.origin.y+this.forward.y*wallDistance};
   for(const p of m.players){p.vx=p.vy=0;p.anim='idle';p.animTime=0;if(!this.corner&&p!==this.taker&&p!==this.keeper&&!this.wall.includes(p)&&B.dist(p,this.origin)<95){p.x=B.clamp(this.origin.x-this.forward.x*100+this.right.x*(p.index%2?40:-40),8,(F.w-8));p.y=B.clamp(this.origin.y-this.forward.y*100+this.right.y*(p.index%2?40:-40),8,(F.h-8));}}
   this.wall.forEach((p,i)=>{const spread=(i-(this.wall.length-1)/2)*15;p.x=B.clamp(center.x+this.right.x*spread,8,(F.w-8));p.y=B.clamp(center.y+this.right.y*spread,8,(F.h-8));p.facing={x:-this.forward.x,y:-this.forward.y};});
   if(this.corner)this.organizeCorner(m);
   this.taker.x=B.clamp(this.origin.x-this.forward.x*24-this.right.x*14,3,(F.w-3));this.taker.y=B.clamp(this.origin.y-this.forward.y*24-this.right.y*14,3,(F.h-3));this.taker.facing={...this.forward};
   if(this.keeper){this.keeper.x=this.goal.x-this.dir*14;this.keeper.y=(F.cy);this.keeper.keeperReaction=0;}
   m.ball.reset(this.origin.x,this.origin.y);m.ball.lastTouch=this.taker;m.controlled=this.side===m.human?this.taker:m.controlled;
   m.charges={};m.bufferedShot=null;m.message(this.corner?'ESCANTEIO':'FALTA DIRETA',1.6);
   const cfg=m.ai.profile(team),error=cfg.precision;
   this.cpu=this.corner?{aim:B.clamp((m.random()-.5)*1.2*error,-1.1,1.1),height:B.clamp(.50+(m.random()-.5)*.22*error,.18,.85),power:B.clamp(.55+(m.random()-.5)*.23*error,.3,.85),curve:(m.random()-.5)*.28}: {aim:(m.random()<.5?-1:1)*(.55+m.random()*.18)+(m.random()-.5)*.16*error,height:B.clamp(.76+(m.random()-.5)*.18*error,.2,.95),power:B.clamp(.45+(this.distance-200)/1200+(m.random()-.5)*.12*error,.3,.95),curve:0};
   if(!this.corner)this.cpu.curve=-this.cpu.aim*.16;
  }
  organizeCorner(m){
   const attack=m.teams[this.side],defend=m.teams[1-this.side],g=this.goal.x,dir=this.dir;
   const ranking=(a,b)=>b.attributes.heading-a.attributes.heading;
   const attackers=attack.players.filter(p=>!p.red&&p.role!=='GK'&&p!==this.taker).sort(ranking).slice(0,5);
   const defenders=defend.players.filter(p=>!p.red&&p.role!=='GK').sort(ranking).slice(0,5);
   // Exactly five on each side of the contest (if eligible), with the keeper separate.
   const spots=[{d:65,y:-72},{d:102,y:-33},{d:82,y:25},{d:141,y:70},{d:115,y:2}];
   this.cornerPositions=new Map();this.cornerAttackers=attackers;this.cornerDefenders=defenders;
   const place=(p,x,y)=>{p.x=B.clamp(x,10,F.w-10);p.y=B.clamp(y,15,F.h-15);p.vx=p.vy=0;p.facing={x:p.team.dir,y:0};p.px=p.x;p.py=p.y;};
   attackers.forEach((p,i)=>{const s=spots[i];place(p,g-dir*s.d,F.cy+s.y);this.cornerPositions.set(p,{x:p.x,y:p.y});});
   defenders.forEach((p,i)=>{const s=spots[i];place(p,g-dir*(s.d-13),F.cy+s.y+(i%2?9:-9));this.cornerPositions.set(p,{x:p.x,y:p.y});});
   // The remaining field players stay outside the penalty area for rebounds and counterattacks.
   for(const [side,selected] of [[attack,attackers],[defend,defenders]]){
    const spare=side.players.filter(p=>!p.red&&p.role!=='GK'&&p!==this.taker&&!selected.includes(p));
    spare.forEach((p,i)=>{
     if(side===attack&&i===0){
      // One short-pass option stays by the corner, without reducing the five in the box.
      place(p,this.origin.x-dir*75,this.origin.y+(this.origin.y<F.cy?60:-60));this.cornerOutlet=p;
     }else place(p,g-dir*(220+(i%3)*55),F.cy+(i%2?-1:1)*(135+Math.floor(i/2)*37));
    });
   }
  }
  cornerTarget(){return {x:this.goal.x-this.dir*(58+this.power*95),y:B.clamp(F.cy+this.aim*93,F.cy-122,F.cy+122)};}
  jump(){return this.phase==='flight'?Math.sin(B.clamp((this.flightTime-.04)/.58,0,1)*Math.PI)*9:0;}
  holdsWall(p){return this.phase==='flight'&&this.flightTime<.68&&this.wall.includes(p);}
  update(m,dt,input){
   this.elapsed+=dt;this.time+=dt;
   if(this.phase==='runup'){
    const t=B.clamp(this.time/.42,0,1);this.taker.x=B.clamp(this.origin.x-this.forward.x*(24-15*t)-this.right.x*14*(1-t),3,(F.w-3));this.taker.y=B.clamp(this.origin.y-this.forward.y*(24-15*t)-this.right.y*14*(1-t),3,(F.h-3));this.taker.anim='run';this.taker.runTime+=dt*12;
    if(t===1)this.launch(m);return;
   }
   const cpu=this.side!==m.human||m.autoplay;
   if(cpu){if(this.time>.8){if(this.phase==='aim'){this.aim=this.cpu.aim;this.height=this.cpu.height;}if(this.phase==='power')this.power=this.cpu.power;if(this.phase==='curve')this.curve=this.cpu.curve;this.confirm(m);}return;}
   const axis=input?.axis||{x:0,y:0};
   if(this.phase==='aim'){this.aim=B.clamp(this.aim+axis.x*dt*.8,-1.25,1.25);this.height=B.clamp(this.height-axis.y*dt*.6,0,1);}
   if(this.phase==='power')this.power=.12+.88*(.5-.5*Math.cos(this.time*3.8));
   if(this.phase==='curve')this.curve=Math.sin(this.time*3.2);
   if(input?.released?.shoot||!input?.state?.shoot&&!input?.pressed?.shoot)this.armed=true;
   if(this.elapsed<.5||!this.armed)return;
   if(this.phase==='aim'&&input?.pressed?.pass){this.shortPass(m,axis);return;}
   if(input?.pressed?.shoot){this.armed=false;this.confirm(m);}
  }
  confirm(m){
   if(this.phase==='aim')this.phase='power';else if(this.phase==='power')this.phase='curve';else if(this.phase==='curve')this.phase='runup';else return;
   this.time=0;m.sound.play('pass');
  }
  shortPass(m,axis){
   m.freeKick=null;m.state='restart';m.timer=0;
   this.taker.x=this.origin.x-this.dir*9;this.taker.y=this.origin.y;m.ball.owner=this.taker;
   m.pass(this.taker,'pass',.4,Math.hypot(axis.x,axis.y)>.1?axis:this.corner?this.forward:{x:this.dir,y:0},this.corner?this.cornerOutlet:null);
  }
  trajectory(){
   if(this.corner){
    // Unlike a direct free kick, a corner arcs to the crowded box, not into the net.
    const target=this.cornerTarget(),distance=B.dist(target,this.origin),n=B.norm(target.x-this.origin.x,target.y-this.origin.y);
    const speed=275+this.power*160,flight=-Math.log(Math.max(.05,1-.13*distance/speed))/.13;
    const gravity=180+this.height*25,targetHeight=9+this.height*25;
    return {vx:n.x*speed,vy:n.y*speed,vz:(targetHeight-1)/flight+.5*gravity*flight,spin:this.curve*.85,gravity,flight};
   }
   // Aim is screen-relative for either attacking direction. Spin bends the real ball.
   const targetY=(F.cy)+this.aim*65*this.dir,n=B.norm(this.goal.x-this.origin.x,targetY-this.origin.y);
   const speed=230+this.power*280+Math.max(0,this.distance-260)*.22*this.power;
   const flight=-Math.log(Math.max(.05,1-.13*this.distance/speed))/.13;
   const gravity=B.clamp(8*(48+this.height*10)/(flight*flight),175,650);
   const targetHeight=3+this.height*38,lift=.5*gravity*flight+targetHeight/Math.max(.15,flight);
   return {vx:n.x*speed,vy:n.y*speed,vz:lift,spin:this.curve*.95,gravity,flight};
  }
  launch(m){
   if(this.phase==='flight')return;
   const shot=this.trajectory(),p=this.taker,b=m.ball;this.extraGravity=shot.gravity-175;this.flightDuration=Math.max(1.8,shot.flight+.7);
   m.exemptPass=this.corner;m.snapshotOffside(p);
   b.owner=null;b.net=null;b.trail=[];b.x=b.px=this.origin.x;b.y=b.py=this.origin.y;b.z=b.pz=1;
   Object.assign(b,{vx:shot.vx,vy:shot.vy,vz:shot.vz,spin:shot.spin},{lock:.18,lastTouch:p,pass:this.corner?{from:p,target:null}:null,shot:this.corner?null:{team:this.side,onTarget:Math.abs(this.aim)<.9}});b.impact('kick',this.power);
   p.touchDelay=.35;p.anim='kick';p.animTime=.4;
   if(this.corner)p.team.stats.passes++;else{p.team.stats.shots++;if(b.shot.onTarget)p.team.stats.onTarget++;}
   this.phase='flight';this.flightTime=0;this.dipping=true;m.state='play';m.restart=null;m.charges={};m.ai.plans.clear();m.sound.play('kick');m.bannerTime=0;
   if(this.corner&&this.side===m.human&&!m.autoplay&&this.cornerAttackers.length){
    m.controlled=[...this.cornerAttackers].sort((a,b)=>B.dist(a,this.cornerTarget())-B.dist(b,this.cornerTarget()))[0];
   }
  }
  cornerHeader(m){
   if(!this.corner||this.flightTime<.42)return false;
   const b=m.ball;
   if(b.owner||b.lastTouch!==this.taker||b.lock>.06||b.z<9||b.z>37)return false;
   const challengers=[...this.cornerAttackers,...this.cornerDefenders].filter(p=>!p.red&&B.dist(p,b)<p.radius+b.radius+13)
    .sort((a,c)=>B.dist(a,b)-a.attributes.heading*.065-(B.dist(c,b)-c.attributes.heading*.065));
   const p=challengers[0];if(!p)return false;
   const defender=p.team.side!==this.side;
   // The first real touch decides the contest. The ball remains physical afterwards.
   if(defender){
    const dir=p.team.dir,clear=B.norm(dir*240,(p.y<F.cy?-1:1)*140);
    b.kick(p,clear.x,clear.y,235,14);b.pass=null;b.shot=null;m.sound.play('kick');
   }else{
    // Headed attempts use the existing shot model and can be defended or miss.
    m.shoot(p,.38+Math.min(.28,p.attributes.heading/320),{x:p.team.dir,y:B.clamp((F.cy-p.y)/120,-.8,.8)},true);
   }
   p.anim='header';p.animTime=.38;m.freeKick=null;
   return true;
  }
  afterBall(m,dt){
   if(this.phase!=='flight')return;
   this.flightTime+=dt;const b=m.ball;
   // Extra topspin dip belongs only to this free kick, until its first bounce/touch.
   if(this.dipping&&b.lastTouch===this.taker&&!b.owner&&(this.corner?b.pass?.from===this.taker:b.shot)){
    b.z-=this.extraGravity*.5*dt*dt;b.vz-=this.extraGravity*dt;
    if(b.z<=0){b.z=0;b.vz=Math.abs(b.vz)*.35;b.impact('bounce');this.dipping=false;}
   }else this.dipping=false;
   if(this.corner){if(this.cornerHeader(m))return;}
   if(!this.corner&&!b.owner&&this.flightTime<.68){
    const dx=b.x-b.px,dy=b.y-b.py,len=dx*dx+dy*dy;
    for(const p of this.wall){
     if(p.red)continue;
     const t=B.clamp(((p.x-b.px)*dx+(p.y-b.py)*dy)/(len||1),0,1),x=b.px+dx*t,y=b.py+dy*t,z=B.lerp(b.pz,b.z,t),jump=this.jump();
     if(Math.hypot(p.x-x,p.y-y)<p.radius+b.radius&&z<26+jump&&z+b.radius>=jump){
      b.x=x-this.forward.x*3;b.y=y-this.forward.y*3;b.vx=-b.vx*.28;b.vy=-b.vy*.28;b.vz=24;b.spin=0;b.lastTouch=p;b.owner=null;b.shot=null;b.lock=.15;b.impact('save');p.anim='receive';p.animTime=.2;m.message('NA BARREIRA!',1);m.freeKick=null;return;
     }
    }
   }
   if(this.flightTime>this.flightDuration||b.owner||m.state!=='play')m.freeKick=null;
  }
 };
})();
