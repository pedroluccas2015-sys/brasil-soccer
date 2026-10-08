'use strict';
(() => {
 const B=window.BSS;
 // PK controls follow the original manual, pp. 11 and 28. Timing and art are original.
 B.Penalty=class {
  constructor(match,side,shootout){
   const team=match.teams[side],opponent=match.teams[1-side];
   this.side=side;this.shootout=shootout;
   this.oldDirs=match.teams.map(t=>t.dir);
   const eligible=team.players.filter(p=>!p.red&&p.role!=='GK');
   const ordered=side===match.human?(match.options.penaltyOrder||[]).map(id=>eligible.find(p=>p.id===id)).filter(Boolean):[];
   const takers=ordered.length?ordered:eligible;
   this.taker=shootout?takers[match.penalties.kicks[side].length%takers.length]:[...eligible].sort((a,b)=>b.attributes.shooting-a.attributes.shooting)[0];
   this.keeper=opponent.players.find(p=>!p.red&&p.role==='GK')||opponent.players.find(p=>!p.red);
   this.phase='aim';this.time=0;this.elapsed=0;this.aim=0;this.height=.45;this.power=0;
   this.fake=0;this.fakeDirection=0;this.fakeCooldown=0;this.dive=null;this.keeperOffset=0;this.keeperHeight=15;
   this.cpuWait=1.3+match.random()*1.2;this.cpuFake=match.random()<.45;this.cpuFaked=false;
   this.cpuAim=match.random()<.15?0:(match.random()<.5?-1:1);
   this.cpuHeight=[.08,.45,.88][Math.floor(match.random()*3)];
   this.guess={x:match.random()<.16?0:(match.random()<.5?-1:1),y:[.08,.45,.88][Math.floor(match.random()*3)]};
   for(const p of match.players){p.vx=p.vy=0;p.anim='idle';p.animTime=0;}
   this.taker.x=920;this.taker.y=340;this.taker.facing={x:1,y:0};
   this.keeper.x=1038;this.keeper.y=340;this.keeper.facing={x:-1,y:0};
   match.ball.reset(940,340);match.ball.lastTouch=this.taker;
  }
  direction(axis){this.aim=Math.abs(axis.x)>.2?Math.sign(axis.x)*.88:0;this.height=axis.y<-.2?.88:axis.y>.2?.08:.45;}
  feint(match,axis){
   if(this.phase!=='aim'||this.fakeCooldown>0||(!axis.x&&!axis.y))return;
   this.fake=.32;this.fakeCooldown=.55;this.fakeDirection=Math.sign(axis.x)||1;
   // A feint supplies misleading information, not a guaranteed successful deception.
   if((this.side===match.human||match.autoplay)&&match.random()<.52){
    this.guess={x:Math.sign(axis.x),y:axis.y<0?.88:axis.y>0?.08:.45};
    if(match.random()<.4)this.startDive(this.guess.x,this.guess.y);
   }
  }
  startDive(x,height){
   if(this.dive||this.phase==='result')return;
   this.dive={x:Math.sign(x),height,time:0};
  }
  kick(match,power){
   if(this.phase!=='aim')return;
   this.power=power;this.phase='runup';this.time=0;this.fake=0;
   const precision=(100-this.taker.attributes.shooting)/100;
   this.targetY=this.aim*57+(match.random()-.5)*(2+precision*power*14);
   this.targetZ=this.height*40+(match.random()-.5)*(1+precision*power*8);
   this.duration=power<.4?.72:power<.8?.55:.41;
   this.taker.team.stats.shots++;
   if(Math.abs(this.targetY)<59&&this.targetZ<40)this.taker.team.stats.onTarget++;
  }
  update(match,dt,input){
   this.time+=dt;this.elapsed+=dt;this.fake=Math.max(0,this.fake-dt);this.fakeCooldown=Math.max(0,this.fakeCooldown-dt);
   const humanShot=this.side===match.human&&!match.autoplay;
   const humanKeeper=this.side!==match.human&&!match.autoplay;
   const axis=input?.axis||{x:0,y:0},pressed=input?.pressed||{};
   if(this.phase==='result'){
    const b=match.ball;
    if(this.dive)this.dive.time+=dt;
    if(this.caught){b.px=b.x;b.py=b.y;b.pz=b.z;b.x=1038;b.y=340+this.keeperOffset;b.z=Math.max(5,this.keeperHeight);b.vx=b.vy=b.vz=0;b.animate(dt);}
    else b.update(dt);
    if(this.time>1.6)match.resolvePenalty();return;
   }
   if(humanKeeper&&(pressed.shoot||pressed.long))this.startDive(axis.x,axis.y<-.2?.88:axis.y>.2?.08:.45);
   if(this.dive){
    this.dive.time+=dt;const d=this.dive,reach=B.clamp(d.time/.27,0,1),fall=B.clamp((d.time-.55)/.3,0,1);
    this.keeperOffset=d.x*49*reach;this.keeperHeight=B.lerp(15,d.height*40,reach)*(1-fall);
    if(d.time>.9){this.dive=null;this.keeperOffset=0;this.keeperHeight=15;}
   }
   this.keeper.y=340+this.keeperOffset;
   if(this.phase==='aim'){
    if(humanShot){
     if(input?.state.context)this.feint(match,axis);else this.direction(axis);
     if(pressed.long)this.kick(match,1);else if(pressed.shoot)this.kick(match,.6);else if(pressed.pass)this.kick(match,.25);
    }else{
     if(this.cpuFake&&!this.cpuFaked&&this.time>this.cpuWait-.65){this.feint(match,{x:-this.cpuAim||1,y:0});this.cpuFaked=true;}
     if(this.time>this.cpuWait){this.aim=this.cpuAim*.88;this.height=this.cpuHeight;this.kick(match,[.25,.6,1][Math.floor(match.random()*3)]);}
    }
    if(this.elapsed>12)this.kick(match,.6);
    return;
   }
   if(this.phase==='runup'){
    this.taker.x=B.lerp(920,931,B.clamp(this.time/.34,0,1));this.taker.anim='run';this.taker.runTime+=dt*12;
    if(this.time>=.34){
     this.phase='flight';this.time=0;this.taker.anim='kick';
     const b=match.ball,T=this.duration,drag=.13,travel=(1-Math.exp(-drag*T))/drag;
     b.vx=115/travel;b.vy=this.targetY/travel;b.vz=Math.max(0,this.targetZ)/T+87.5*T;
     b.owner=null;b.spin=0;b.impact('kick',this.power);match.sound.play('kick');
    }
    return;
   }
   if(this.phase==='flight'){
    if(!humanKeeper&&!this.dive&&this.time>.09){
     this.startDive(this.guess.x,this.guess.y);
    }
    const b=match.ball,prevX=b.x;b.update(dt);
    // Swept keeper-plane test: fast shots cannot tunnel past the collision check.
    if(prevX<1038&&b.x>=1038){
     const r=(1038-prevX)/(b.x-prevX),y=B.lerp(b.py,b.y,r)-340,z=B.lerp(b.pz,b.z,r);
     const active=this.dive&&this.dive.time>=.09&&this.dive.time<.73;
     const saved=active?Math.abs(y-this.keeperOffset)<18&&Math.abs(z-this.keeperHeight)<13:!this.dive&&Math.abs(y)<10&&z<24;
     if(saved){
      b.x=1038;b.y=340+y;b.z=z;b.impact('save');
      this.caught=this.power<.4&&Math.abs(y)<18;
      if(this.caught)b.vx=b.vy=b.vz=0;
      else {b.vx=-Math.abs(b.vx)*.42;b.vy=(y<0?-1:1)*(75+this.power*65);b.vz=30+this.power*25;b.spin=(y<0?-1:1)*2;}
      match.sound.play('save');match.penaltyResult(false,this.caught?'SEGUROU!':'ESPALMOU!');return;
     }
    }
    if(b.x>=1050){
     const r=B.clamp((1050-b.px)/(b.x-b.px||1),0,1),y=B.lerp(b.py,b.y,r)-340,z=B.lerp(b.pz,b.z,r);
     const post=Math.abs(Math.abs(y)-59)<2.2&&z<42||Math.abs(z-40)<2&&Math.abs(y)<61;
     const goal=!post&&Math.abs(y)<59&&z<40;
     if(post){b.x=1048;b.vx=-Math.abs(b.vx)*.65;b.vy*=.6;b.vz=Math.abs(b.vz)*.5+15;b.impact('post');match.sound.play('post');}
     if(goal)b.enterNet(1050);
     match.penaltyResult(goal,goal?'GOOOL!':post?'NA TRAVE!':'PARA FORA!');
    }
   }
  }
 };
})();
