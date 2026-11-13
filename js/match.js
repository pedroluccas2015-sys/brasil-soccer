'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 B.Match=class {
  constructor(home,away,options={},sound={play(){}}){this.options=options;this.mode=options.mode||'quick';this.human=options.human??0;this.difficulty=options.difficulty??1;this.duration=options.duration||240;this.random=B.rng(options.seed??Date.now());this.sound=sound;this.teams=[home,away].map((data,side)=>new B.Team(data,side,side===this.human?options.formation:undefined,side===this.human?options.lineup:undefined,side===this.human?options.tactics:undefined));
   const color=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const a=color(home.kit.home.shirtBaseColor),b=color(away.kit.home.shirtBaseColor);if(Math.hypot(...a.map((v,i)=>v-b[i]))<130||home.id===away.id)this.teams[1].kit=away.kit.away;
   this.ball=new B.Ball();this.ai=new B.AIController(this);this.controlled=this.teams[this.human].players[9];this.state='restart';this.timer=0;this.clock=0;this.period=1;this.added=60;this.stoppages=0;this.elapsed=0;this.banner='';this.bannerTime=0;this.events=[];this.turf=[];this.pendingOffside=[];this.offsideLine=0;this.charges={};this.advantage=null;this.lastScorer=null;this.autoplay=!!options.autoplay;this.finished=false;this.penalties=null;this.kickoff(0);
   if(this.mode==='penalties')this.startShootout();
  }
  get players(){return this.teams.flatMap(t=>t.players);}
  get minute(){return Math.floor(this.clock/60);}
  message(text,time=2){this.banner=text;this.bannerTime=time;}
  event(type,data={}){this.events.push({type,minute:this.minute,...data});if(this.onEvent)this.onEvent(type,data);}
  kickoff(side){this.setPieceShape=null;this.setPieceContest=null;this.clearanceRequest=null;this.restartMotion=null;this.periodExtension=null;this.endingPeriod=null;this.turf=[];this.freeKick=null;this.ai.plans.clear();for(const t of this.teams)t.position();this.ball.reset((F.cx),(F.cy));this.pendingOffside=[];const team=this.teams[side],p=team.players.filter(p=>!p.red&&p.role!=='GK').at(-1);for(const t of this.teams)for(const q of t.players){q.x=t.dir>0?Math.min(q.x,(F.cx-13)):Math.max(q.x,(F.cx+13));if(t!==team&&B.dist(q,this.ball)<95)q.x-=t.dir*100;}p.x=F.cx+team.dir*9;p.y=F.cy;p.facing={x:-team.dir,y:0};const outlet=team.players.filter(q=>q!==p&&!q.red&&q.role==='MF')[0]||team.players.find(q=>q!==p&&!q.red&&q.role!=='GK');if(outlet){outlet.x=F.cx-team.dir*100;outlet.y=F.cy+55;}this.restart={type:'SAÍDA DE BOLA',team:side,taker:p,x:(F.cx),y:(F.cy),exempt:true};this.state='restart';this.timer=1;this.ball.owner=p;this.ball.lastTouch=p;if(side===this.human)this.controlled=p;this.sound.play('whistle');this.message('SAÍDA DE BOLA',1.2);}
  update(dt,input){if(this.finished)return;this.elapsed+=dt;this.turf=this.turf.filter(bit=>(bit.age+=dt)<bit.life);this.bannerTime=Math.max(0,this.bannerTime-dt);if(this.state==='half'||this.state==='finished')return;
   if(this.state==='goal'){this.ball.update(dt);this.timer-=dt;for(const p of this.teams[1-this.nextKickoff].players){p.anim='celebrate';p.runTime+=dt*10;}if(this.timer<=0)this.completeGoal();return;}
   if(this.state==='penalty'){this.updatePenalty(dt,input);return;}
   if(this.state==='freeKick'){this.freeKick.update(this,dt,input);return;}
   if(this.state==='restart'){if(this.restartMotion){this.updateRestartMotion(dt);return;}this.poseRestart();this.timer-=dt;const r=this.restart;if(this.timer<=0){if(r.team!==this.human||this.autoplay||this.timer< -7){if(r.type==='ESCANTEIO')this.pass(r.taker,'long',.7,{x:this.teams[r.team].dir,y:r.y<(F.cy)?1:-1});else if(r.type==='FALTA'&&Math.abs(r.x-(this.teams[r.team].dir>0?(F.w):0))<270)this.shoot(r.taker,.65,{x:this.teams[r.team].dir,y:0});else this.pass(r.taker,r.type==='TIRO DE META'?'long':'pass',.45,{x:this.teams[r.team].dir,y:0});}else if(input){this.handleActions(input,dt,true);}}return;}
   this.advanceClock(dt);if(this.state!=='play')return;
   this.protectKeeper();
   if(input&&!this.autoplay){if(input.pressed.switch)this.switchPlayer();const p=this.controlled;if(p&& !p.red){if(input.dash){p.dash=.25;input.dash=false;}const receiving=this.ball.pass?.target===p&&!this.ball.owner&&Math.hypot(input.axis.x,input.axis.y)<.1;const move=receiving?this.receiverTarget(p):input.axis;p.move(receiving?move.x-p.x:move.x,receiving?move.y-p.y:move.y,input.state.sprint||receiving&&B.dist(p,move)>45,dt);p.state=receiving?'RECEIVE':'USER';this.handleActions(input,dt);}}
   if(this.state!=='play')return;this.secondPress=!!input?.state.long&&this.ball.owner?.team.side!==this.human;this.ai.update(dt);if(this.state!=='play')return;this.protectKeeper();this.enforceSetPieceShape();B.Physics.players(this.players);this.protectKeeper();this.enforceSetPieceShape();this.slideGrass();
   const ball=this.ball,owner=ball.owner;if(owner&&!owner.red){if(B.dist(owner,ball)>27||ball.z>18){ball.owner=null;}else{owner.team.stats.possession+=dt;this.dribble(owner,dt);}}
   this.guideShortPass(dt);ball.update(dt);this.interceptGuidedPass();if(ball.pass?.expires<this.elapsed)ball.pass=null;this.freeKick?.afterBall(this,dt);this.touchBall(dt);this.boundaries();this.checkLastAttack();if(this.state!=='play')return;
   if(this.advantage){this.advantage.time-=dt;if(ball.owner&&ball.owner.team.side!==this.advantage.team){const a=this.advantage;this.advantage=null;this.setRestart('FALTA',a.team,a.x,a.y);}else if(this.advantage.time<=0)this.advantage=null;}
   if(!this.autoplay)this.autoSelectPlayer(dt);if(this.controlled?.red)this.switchPlayer();
  }
  emitTurf(p,count){
   const n=p.slideDirection||p.facing;
   for(let i=0;i<count;i++){
    const id=p.id+':'+p.slideCount+':'+p.slideGrassSerial++,random=B.rng(B.hash(id)),side=(random()-.5)*2;
    this.turf.push({id,x:p.x+n.x*7-n.y*side*5,y:p.y+n.y*7+n.x*side*5,
     vx:-n.x*(16+random()*26)-n.y*side*35,vy:-n.y*(16+random()*26)+n.x*side*35,
     vz:32+random()*34,age:0,life:.42+random()*.26,size:1+random()*1.4,spin:random()*6.28,soil:random()<.25});
   }
   if(this.turf.length>144)this.turf.splice(0,this.turf.length-144);
  }
  slideGrass(){
   for(const p of this.players){
    if(p.red||p.anim!=='slide'||p.animTime<=B.SLIDE.recovery)continue;
    p.slideGrassDistance=(p.slideGrassDistance||0)+Math.hypot(p.x-p.px,p.y-p.py);
    while(p.slideGrassDistance>=7.5){p.slideGrassDistance-=7.5;this.emitTurf(p,2);}
   }
  }
  protectedKeeper(){const p=this.ball.owner;return this.state==='play'&&p?.role==='GK'&&!p.red?p:null;}
  protectKeeper(){const keeper=this.protectedKeeper();if(!keeper)return;const radius=B.PITCH.keeperClearance;
   for(const p of this.players){if(p===keeper||p.red)continue;const dx=p.x-keeper.x,dy=p.y-keeper.y,d=Math.hypot(dx,dy);if(d>=radius)continue;
    const angle=d>.01?Math.atan2(dy,dx):Math.atan2(p.home.y-keeper.y,p.team.dir),candidates=[];
    for(let i=0;i<32;i++){const a=angle+i*Math.PI/16,x=keeper.x+Math.cos(a)*(radius+.05),y=keeper.y+Math.sin(a)*(radius+.05);if(x>=3&&x<=F.w-3&&y>=3&&y<=F.h-3)candidates.push({x,y});}
    const spot=candidates.sort((a,b)=>B.dist(p,a)-B.dist(p,b))[0];if(!spot)continue;p.x=spot.x;p.y=spot.y;
    const n=B.norm(p.x-keeper.x,p.y-keeper.y),inward=p.vx*n.x+p.vy*n.y;if(inward<0){p.vx-=n.x*inward;p.vy-=n.y*inward;}
    if(p.anim==='slide'||p.anim==='tackle'){p.anim='idle';p.animTime=0;p.slideDirection=null;}
   }
  }
  dribble(p,dt){
   if(p.role==='GK')return;
   const b=this.ball,speed=Math.hypot(p.vx,p.vy),stride=Math.sin(p.runTime*.9),f=p.facing;
   const reach=8+Math.min(speed/35,5)+(speed>20?(stride+1)*1.5:0);
   const lateral=speed>20?Math.cos(p.runTime*.9)*1.6:0;
   const tx=p.x+f.x*reach-f.y*lateral,ty=p.y+f.y*reach+f.x*lateral;
   // Foot-sized touches, with a longer exposed touch while sprinting.
   const response=1-Math.exp(-dt*(18+p.attributes.control*.08));
   b.vx=B.lerp(b.vx,p.vx+(tx-b.x)*12,response);
   b.vy=B.lerp(b.vy,p.vy+(ty-b.y)*12,response);b.lastTouch=p;const tap=Math.floor(p.runTime*.9/Math.PI);if(speed>25&&p.lastBallTap!==tap){p.lastBallTap=tap;b.impact('touch',.22);}
  }
  advanceClock(dt){if(this.mode==='training')return;this.clock+=dt*5400/this.duration;if(this.endingPeriod===this.period||this.periodExtension)return;
   const base=this.period===1?2700:this.period===2?5400:this.period===3?6300:7200;if(this.clock<base+this.added)return;
   const b=this.ball,side=b.owner?.team.side??b.pass?.from.team.side??b.shot?.team??b.lastTouch?.team.side,team=this.teams[side];
   if(this.state==='play'&&team&&b.x>=0&&b.x<=F.w&&b.y>=0&&b.y<=F.h&&team.dir*(b.x-F.cx)>0){this.periodExtension={team:side,dir:team.dir,period:this.period};this.message('ÚLTIMO ATAQUE',1.8);return;}
   this.endPeriod();
  }
  checkLastAttack(){const attack=this.periodExtension;if(!attack||this.state!=='play')return;if(attack.dir*(this.ball.x-F.cx)<=0)this.endPeriod();}
  endPeriod(){if(this.endingPeriod===this.period)return;this.endingPeriod=this.period;this.periodExtension=null;this.restartMotion=null;this.clearanceRequest=null;
   if(this.period===1||this.period===3){this.state='half';this.message('INTERVALO',99);this.sound.play('whistle');this.event('half');}
   else if(this.period===2&&this.options.matchRules)this.finishCompetitionRegulation();
   else if(this.period===2&&this.mode==='cup'&&this.teams[0].score===this.teams[1].score){this.state='half';this.message('PRORROGAÇÃO',99);this.sound.play('whistle');this.event('half');}
   else if(this.period===4&&this.teams[0].score===this.teams[1].score)this.startShootout();else this.finish();
  }
  completeGoal(){if(this.state!=='goal')return;if(this.periodExtension)this.endPeriod();else this.kickoff(this.nextKickoff);}
  finishCompetitionRegulation(){const r=this.options.matchRules,a=this.teams[0].score+(r.carry?.[0]||0),b=this.teams[1].score+(r.carry?.[1]||0);if(!r.decisive||a!==b||r.advantage){this.finish();return;}if(r.extraTime){this.state='half';this.message('PRORROGAÇÃO',99);this.sound.play('whistle');this.event('half');}else this.startShootout();}
  resumeHalf(){this.periodExtension=null;this.endingPeriod=null;this.period++;this.clock=this.period===2?2700:this.period===3?5400:6300;this.added=this.period>2?30:60;this.teams.forEach(t=>{t.dir*=-1;t.players.forEach(p=>p.energy=Math.min(1,p.energy+.2));});this.kickoff(this.period%2?0:1);}
  finish(){if(this.finished)return;this.finished=true;this.state='finished';this.sound.play('whistle');this.event('finished');}
  switchPlayer(){const list=this.teams[this.human].players.filter(p=>!p.red&&p.role!=='GK').sort((a,b)=>B.dist(a,this.ball)-B.dist(b,this.ball));if(list.length)this.controlled=list[0]===this.controlled&&list[1]?list[1]:list[0];this.selectLock=.9;this.selectTime=0;}
  autoSelectPlayer(dt){
   const b=this.ball,team=this.teams[this.human];this.selectLock=Math.max(0,(this.selectLock||0)-dt);
   if(b.owner?.team===team){this.controlled=b.owner;this.selectTime=0;return;}
   if(b.pass?.target?.team===team&&!b.pass.target.red)return;
   const nearest=team.players.filter(p=>!p.red&&p.role!=='GK').sort((a,c)=>B.dist(a,b)-B.dist(c,b))[0];
   if(!nearest)return;if(this.controlled?.role==='GK'||this.controlled?.red){this.controlled=nearest;return;}
   if(this.selectLock>0||nearest===this.controlled){this.selectTime=0;return;}
   if(B.dist(this.controlled,b)-B.dist(nearest,b)>35){this.selectTime=(this.selectTime||0)+dt;if(this.selectTime>.25){this.controlled=nearest;this.selectTime=0;}}else this.selectTime=0;
  }
  handleActions(i,dt,restart=false){const p=this.controlled;if(!p)return;const keeper=this.protectedKeeper();if(keeper&&keeper!==p){this.charges={};this.kickPreview=null;return;}const b=this.ball;if(!restart&&b.owner!==p&&this.isSetPieceDefender(p)&&!i.pressed.pass&&(i.pressed.shoot||i.pressed.context)){this.contestBall(p);this.charges={};this.kickPreview=null;return;}const has=b.owner===p||B.dist(p,b)<20&&b.z<40,aim=i.axis;this.kickPreview=null;if(!restart&&!b.owner&&b.z>8&&B.dist(p,b)<65&&(i.pressed.shoot||i.pressed.context)){const technique=i.pressed.context&&b.z>14&&p.facing.x*p.team.dir<-.2?'bicycle':b.z>=19?'header':'volley';this.bufferedShot={player:p,power:.6,aim:{...aim},context:!!i.pressed.context,expires:this.elapsed+.65};p.anim=technique;p.animTime=technique==='bicycle'?.72:technique==='header'?.52:.58;this.charges={};return;}
   for(const action of ['pass','shoot','long']){if(i.pressed[action]){if(!has&&!restart){if(action==='pass')this.tackle(p,true);if(action==='shoot')this.tackle(p,false);}this.charges[action]=0;}
    if(i.state[action]&&this.charges[action]!==undefined)this.charges[action]=Math.min(B.KickModel.chargeTime,this.charges[action]+dt);
    if(i.state[action]&&has&&action!=='shoot')this.kickPreview={target:this.passTarget(p,action,B.KickModel.power(this.charges[action]||0),aim)};
    if(i.released[action]&&this.charges[action]!==undefined){const power=B.KickModel.power(this.charges[action]);delete this.charges[action];if(has||restart){if(action==='shoot')this.shoot(p,power,aim);else this.pass(p,action,power,aim);}else if(action==='shoot'){this.bufferedShot={player:p,power,aim:{...aim},expires:this.elapsed+.35};}}}
   if(restart&&this.restart?.type==='SAÍDA DE BOLA'&&i.pressed.context){this.pass(p,'pass',.4,{x:-p.team.dir,y:0});return;}
   if(i.pressed.context&&has){if(b.z>8)this.shoot(p,.55,aim,true);else{p.dash=.2;b.vx+=p.facing.y*100;b.vy-=p.facing.x*100;b.owner=null;b.lock=.1;p.touchDelay=.1;p.anim='dribble';p.animTime=.25;}}else if(i.pressed.context&&!has)this.tackle(p,false);
  }
  createSetPieceShape(side,taker){
   const attack=this.teams[side],defend=this.teams[1-side],rank=p=>p.role==='DF'?0:p.role==='MF'?1:2;
   const backs=attack.players.filter(p=>!p.red&&p.role!=='GK'&&p!==taker).sort((a,b)=>rank(a)-rank(b)||a.index-b.index).slice(0,5);
   const counters=defend.players.filter(p=>!p.red&&p.role!=='GK').sort((a,b)=>rank(b)-rank(a)||a.index-b.index).slice(0,4),holds=new Map();
   const place=(p,x,y,half)=>{p.x=x;p.y=y;p.px=x;p.py=y;p.vx=p.vy=0;holds.set(p,{x,y,half});};
   backs.forEach((p,i)=>place(p,F.cx-attack.dir*(180+(i%2)*110),F.cy+(i-2)*112,-1));
   counters.forEach((p,i)=>place(p,F.cx+defend.dir*(110+(i%2)*90),F.cy+(i-1.5)*130,1));
   this.setPieceShape={team:side,taker,backs:new Set(backs),counters:new Set(counters),holds,expires:Infinity};this.ai.plans.clear();return this.setPieceShape;
  }
  enforceSetPieceShape(){
   const shape=this.setPieceShape;if(!shape)return;
   if(this.elapsed>shape.expires||this.state==='play'&&this.ball.lastTouch&&this.ball.lastTouch!==shape.taker){this.setPieceShape=null;return;}
   for(const [p,spot] of shape.holds){if(p.red)continue;const depth=p.team.dir*(p.x-F.cx);if(depth*spot.half<35){p.x=F.cx+p.team.dir*spot.half*35;p.vx=0;}}
  }
  kickoffReceiver(p){return p.team.players.filter(q=>q!==p&&!q.red&&p.team.dir*(q.x-F.cx)<-25).sort((a,b)=>(a.role==='GK'?500:0)+B.dist(a,p)-((b.role==='GK'?500:0)+B.dist(b,p)))[0];}
  guideShortPass(dt){
   const b=this.ball,pass=b.pass;if(!pass?.magnet||b.owner||b.z>6)return;
   const q=pass.target;if(!q||q.red||q.team!==pass.from.team||b.lastTouch!==pass.from){b.pass=null;return;}
   pass.age=(pass.age||0)+dt;if(pass.age>3){b.pass=null;return;}
   const target={x:B.clamp(q.x+q.vx*.045,8,F.w-8),y:B.clamp(q.y+q.vy*.045,8,F.h-8)},distance=B.dist(b,target),n=B.norm(target.x-b.x,target.y-b.y),speed=Math.min(Math.max(260,pass.speed),Math.max(90,distance/Math.max(dt,.001)));
   const blend=1-Math.exp(-dt*24);b.vx=B.lerp(b.vx,n.x*speed,blend);b.vy=B.lerp(b.vy,n.y*speed,blend);b.spin=0;pass.destination=target;pass.expires=this.elapsed+1;
  }
  interceptGuidedPass(){
   const b=this.ball,pass=b.pass;if(!pass?.magnet||b.owner||b.z>10)return;const dx=b.x-b.px,dy=b.y-b.py,len=dx*dx+dy*dy;
   const hits=this.players.filter(p=>!p.red&&p!==pass.from&&p.role!=='GK'&&(p===pass.target||p.team!==pass.from.team)).map(p=>{const t=B.clamp(((p.x-b.px)*dx+(p.y-b.py)*dy)/(len||1),0,1),x=b.px+dx*t,y=b.py+dy*t,slide=p.anim==='slide'&&p.animTime>B.SLIDE.recovery,reach=slide?24:12;return {p,t,x,y,slide,d:Math.hypot(p.x-x,p.y-y),reach};}).filter(h=>h.d<h.reach).sort((a,c)=>a.t-c.t||a.d-c.d);
   const hit=hits[0];if(!hit)return;const {p}=hit;if(p===pass.target&&b.lock>.07)return;
   b.x=hit.x;b.y=hit.y;b.pass=null;b.shot=null;
   if(this.pendingOffside.includes(p)){p.team.stats.offsides++;this.pendingOffside=[];this.setRestart('IMPEDIMENTO',1-p.team.side,p.x,p.y);return;}
   if(hit.slide){const n=p.slideDirection||p.facing;b.kick(p,n.x,n.y,220,6);b.lock=.16;this.sound.play('kick');}
   else{if(p.team===pass.from.team)p.team.stats.completed++;b.owner=p;b.lastTouch=p;b.z=b.vz=0;b.vx=p.vx;b.vy=p.vy;p.anim='receive';p.animTime=.16;p.heldTime=0;this.pendingOffside=[];if(p.team.side===this.human)this.controlled=p;}
  }
  prepareRestartKick(p,type,power,axis,preferred=null){
   const r=this.restart;if(this.restartExecuting||this.state!=='restart'||!r||r.taker!==p||!['LATERAL','FALTA'].includes(r.type)||r.type==='FALTA'&&B.FreeKick.eligible(p.team,r.x)||this.timer>0)return false;
   if(this.restartMotion)return true;
   let aim=Math.hypot(axis.x,axis.y)>.1?B.norm(axis.x,axis.y):{...p.facing};
   if(r.type==='LATERAL'){const inward=r.y<F.cy?1:-1;aim=B.norm(aim.x,inward*Math.max(.35,Math.abs(aim.y)));}
   this.restartMotion={kind:r.type,taker:p,elapsed:0,contact:r.type==='LATERAL'?.46:.48,duration:r.type==='LATERAL'?.64:.72,aim,intent:{type:r.type==='LATERAL'?'pass':type,power,preferred}};
   this.charges={};this.kickPreview=null;this.poseRestart();return true;
  }
  poseRestart(){
   const r=this.restart;if(!r)return;const p=r.taker,a=this.restartMotion,b=this.ball;
   if(r.type==='LATERAL'){
    const inward=r.y<F.cy?1:-1,progress=a?Math.min(.72,a.elapsed/a.contact*.72):.12,pose=B.Player.throwPose(progress);
    p.x=r.x;p.y=r.y;p.facing=a?a.aim:{x:0,y:inward};p.anim='throwin';p.animTime=.64*(1-progress);
    b.x=p.x+p.facing.x*pose.u;b.y=p.y+p.facing.y*pose.u;b.z=pose.z;b.owner=p;
   }else if(a){const progress=Math.min(1,a.elapsed/a.contact),distance=B.lerp(28,12,progress);p.x=r.x-a.aim.x*distance;p.y=r.y-a.aim.y*distance;p.facing=a.aim;p.anim='setpiece';p.animTime=.46*(1-progress*.48);b.x=r.x;b.y=r.y;b.z=0;}
   p.vx=p.vy=0;b.px=b.x;b.py=b.y;b.pz=b.z;
  }
  updateRestartMotion(dt){
   const a=this.restartMotion;if(!a)return;const r=this.restart,p=a.taker,b=this.ball;a.elapsed+=dt;this.poseRestart();if(a.elapsed<a.contact)return;
   const lateral=a.kind==='LATERAL';p.x=lateral?r.x:r.x-a.aim.x*12;p.y=lateral?B.clamp(r.y,1,F.h-1):r.y-a.aim.y*12;b.z=0;
   this.restartMotion=null;this.restartExecuting=true;
   try{if(a.intent.type==='shoot')this.shoot(p,a.intent.power,a.aim);else this.pass(p,a.intent.type,a.intent.power,a.aim,a.intent.preferred);}finally{this.restartExecuting=false;}
   if(lateral){
    const target=b.pass?.destination||{x:p.x+a.aim.x*180,y:B.clamp(p.y+a.aim.y*180,8,F.h-8)},distance=Math.hypot(target.x-p.x,target.y-p.y),flight=Math.max(.68,distance/(235+a.intent.power*95)),travel=(1-Math.exp(-.13*flight))/.13,n=B.norm(target.x-p.x,target.y-p.y);
    b.x=p.x+n.x*8;b.y=p.y+n.y*8;b.z=28;b.px=b.x;b.py=b.y;b.pz=b.z;b.vx=n.x*Math.max(0,distance-8)/travel;b.vy=n.y*Math.max(0,distance-8)/travel;b.vz=175*flight/2-27/flight;b.lock=.18;
    if(b.pass){b.pass.time=flight;b.pass.expires=this.elapsed+flight+1.4;}p.anim='throwin';p.animTime=.64*.28;
   }else{p.anim='setpiece';p.animTime=.46*.52;}
  }
  readyKick(p){const keeper=this.protectedKeeper();if(keeper&&keeper!==p)return false;if(this.state==='restart'){if(this.restart.taker!==p||this.timer>0)return false;this.exemptPass=this.restart.exempt;if(this.setPieceShape)this.setPieceShape.expires=this.elapsed+7;this.state='play';this.restart=null;this.charges={};}return true;}
  snapshotOffside(p){const defenders=this.teams[1-p.team.side].players;this.offsideLine=B.Physics.offsideLine(defenders,p.team.dir);this.pendingOffside=this.exemptPass?[]:p.team.players.filter(q=>q!==p&&!q.red&&B.Physics.isOffside(q,this.ball,this.offsideLine,p.team.dir));this.exemptPass=false;}
  passTarget(p,type,power,axis,preferred=null){
   const long=type==='long',b=this.ball,dir=p.team.dir,directed=Math.hypot(axis.x,axis.y)>.1,aim=directed?B.norm(axis.x,axis.y):p.facing,opps=this.teams[1-p.team.side].players.filter(q=>!q.red),line=B.Physics.offsideLine(opps,dir);
   const desired=long?160+power*400:65+power*270;
   const choices=p.team.players.filter(q=>q!==p&&!q.red&&B.dist(q,p)>25&&B.dist(q,p)<(long?330+power*520:200+power*300)&&(this.exemptPass||!B.Physics.isOffside(q,b,line,dir))).map(q=>{
    const n=B.norm(q.x-p.x,q.y-p.y),distance=B.dist(q,p),alignment=n.x*aim.x+n.y*aim.y,mark=Math.min(100,...opps.map(o=>B.dist(o,q))),blocked=opps.some(o=>B.Physics.lineDistance(o,p,q)<18&&B.dist(o,p)>20);
    const goalDistance=Math.abs(q.x-(dir>0?F.w:0)),cross=long&&Math.abs(p.y-F.cy)>F.h*.23;
    return {q,alignment,score:alignment*(directed?280:120)-Math.abs(distance-desired)*.45+mark*.6-(blocked&&!long?155:0)+(cross&&goalDistance<260&&Math.abs(q.y-F.cy)<160?90:0)-(q.role==='GK'?75:0)};
   }).filter(c=>!directed||c.alignment>(long?.12:.32)).sort((a,c)=>c.score-a.score);
   return preferred&&choices.some(c=>c.q===preferred)?preferred:choices[0]?.q;
  }
  receiverTarget(p){const b=this.ball,pass=b.pass;if(pass?.target===p&&pass.magnet)return {x:p.x,y:p.y};if(pass?.target===p&&pass.destination)return pass.destination;return this.ai.intercept(p,this.ai.profile(p.team));}
  pass(p,type,power,axis,preferred=null){const kickoff=this.state==='restart'&&this.restart?.type==='SAÍDA DE BOLA';if(kickoff){if(this.restart.taker!==p||this.timer>0)return;type='pass';axis={x:-p.team.dir,y:0};preferred=this.kickoffReceiver(p);power=.4;}if(this.prepareRestartKick(p,type,power,axis,preferred))return;if(!this.readyKick(p))return;power=B.clamp(power,0,1);const long=type==='long',b=this.ball,F=B.FIELD,aim=Math.hypot(axis.x,axis.y)>.1?B.norm(axis.x,axis.y):p.facing,target=this.passTarget(p,type,power,axis,preferred);
   let tx=target?.x??p.x+aim.x*(long?180+power*360:65+power*270),ty=target?.y??p.y+aim.y*(long?180+power*360:65+power*270),delivery;
   for(let i=0;i<3;i++){delivery=B.KickModel.delivery(Math.hypot(tx-p.x,ty-p.y),power,long);if(target){const lead=Math.min(.42,delivery.time*.55);tx=target.x+target.vx*lead;ty=target.y+target.vy*lead;}}
   const attr=long?p.attributes.longPassing:p.attributes.passing,pressure=this.teams[1-p.team.side].players.filter(o=>!o.red&&B.dist(o,p)<35).length,error=((100-attr)*.035+pressure*.8)*(p.team.side===this.human?.45:this.ai.profile(p.team).precision);
   tx=B.clamp(tx+(this.random()-.5)*error,8,F.w-8);ty=B.clamp(ty+(this.random()-.5)*error,8,F.h-8);delivery=B.KickModel.delivery(Math.hypot(tx-p.x,ty-p.y),power,long);this.snapshotOffside(p);
   b.kick(p,tx-p.x,ty-p.y,delivery.speed,delivery.lift);b.lock=Math.min(.13,delivery.time*.30);p.anim=long?'long':'pass';p.animTime=long?.38:.3;p.runAfterPass=2.2;b.pass={from:p,target,destination:{x:tx,y:ty},time:delivery.time,expires:this.elapsed+delivery.time+1.4,magnet:!long&&!!target,cross:long,speed:delivery.speed,age:0};b.shot=null;p.team.stats.passes++;this.sound.play(long?'kick':'pass');if(target&&p.team.side===this.human)this.controlled=target;
  }
  shoot(p,power,axis,context=false){if(this.state==='restart'&&this.restart?.type==='SAÍDA DE BOLA'){this.pass(p,'pass',.4,{x:-p.team.dir,y:0});return;}if(this.prepareRestartKick(p,'shoot',power,axis))return;if(!this.readyKick(p))return;const b=this.ball,dir=p.team.dir,gx=dir>0?(F.w+10):-10;const horizontal=Math.abs(axis.y)>.1?axis.y:((p.y>(F.cy))?-.2:.2);let gy=(F.cy)+horizontal*52;const pressure=this.teams[1-p.team.side].players.filter(o=>!o.red&&B.dist(o,p)<35).length,body=p.facing.x*dir<-.2?15:0,precision=p.team.side===this.human?1:this.ai.profile(p.team).precision,attribute=b.z>17?p.attributes.heading:p.attributes.shooting;const error=((100-attribute)*.55+pressure*5+body+(power>.9?20:0))*precision;gy+=(this.random()-.5)*error;this.snapshotOffside(p);const height=b.z;const bicycle=context&&height>14&&p.facing.x*dir<-.2,header=height>=19&&!bicycle,volley=height>5;const lift=header?12:volley?30:power<.28?2:18+power*36;
   b.kick(p,gx-p.x,gy-p.y,B.KickModel.shotSpeed(power),lift,horizontal*.15);p.anim=bicycle?'bicycle':header?'header':volley?'volley':context?'placed':'kick';p.animTime=(bicycle?.72:header?.52:volley?.58:.4)*(volley?.52:1);p.team.stats.shots++;const target=Math.abs(gy-(F.cy))<59;if(target)p.team.stats.onTarget++;b.shot={team:p.team.side,onTarget:target,technique:p.anim,playerId:p.id};b.pass=null;this.sound.play('kick');
  }
  touchBall(dt){const b=this.ball;if(this.protectedKeeper()||b.lock>0)return;const near=this.players.filter(p=>!p.red&&p!==b.owner&&p.touchDelay===0&&B.dist(p,b)<(b.z>0?12:13)).sort((a,c)=>B.dist(a,b)-B.dist(c,b));for(const p of near){if(p.role==='GK')continue;if(b.z>32)continue;
    if(this.pendingOffside.includes(p)){p.team.stats.offsides++;this.pendingOffside=[];this.message('IMPEDIMENTO',2);this.setRestart('IMPEDIMENTO',1-p.team.side,p.x,p.y);return;}
    if(b.owner&&b.owner.team===p.team)continue;
    if(this.clearanceRequest?.player===p&&this.clearanceRequest.expires>=this.elapsed&&this.isSetPieceDefender(p)){if(this.contestBall(p,true))return;}
    if(this.bufferedShot?.player===p&&this.bufferedShot.expires>=this.elapsed){const s=this.bufferedShot;this.bufferedShot=null;this.shoot(p,s.power,s.aim,s.context);return;}
    if(b.z>14){if(p!==this.controlled||this.autoplay){if(Math.abs(p.x-(p.team.dir>0?(F.w):0))<250)this.shoot(p,.55,{x:p.team.dir,y:0},true);}return;}
    const speed=Math.hypot(b.vx-p.vx,b.vy-p.vy),control=p.attributes.control,pressure=this.teams[1-p.team.side].players.some(o=>!o.red&&B.dist(o,p)<24);const assisted=b.pass?.target===p&&b.pass.from.team===p.team,limit=135+control*2-(pressure?40:0)+(assisted?160+control*.4:0);
    if(speed>limit){const n=B.norm(b.x-p.x,b.y-p.y);b.vx=b.vx*.4+n.x*60;b.vy=b.vy*.4+n.y*60;b.vz=Math.max(8,b.vz*.3);b.owner=null;b.lastTouch=p;b.lock=.16;p.touchDelay=.2;this.pendingOffside=[];b.pass=null;return;}
    if(b.owner&&this.random()>dt*3)return;
    if(b.pass){if(b.pass.from.team===p.team&&b.pass.from!==p)p.team.stats.completed++;b.pass=null;}
    p.anim='receive';p.animTime=.16;b.owner=p;b.lastTouch=p;b.vx*=.38;b.vy*=.38;b.z=0;b.vz=0;p.heldTime=0;this.pendingOffside=[];b.shot=null;if(p.team.side===this.human&&p.role!=='GK')this.controlled=p;return;
   }
  }
  isSetPieceDefender(p){const duel=this.setPieceContest;if(!duel||this.elapsed>duel.expires||p.team.side===duel.team||p.role==='GK'||p.red)return false;const goalX=duel.dir>0?F.w:0;return Math.abs(p.x-goalX)<B.PITCH.penaltyDepth+120&&Math.abs(p.y-F.cy)<B.PITCH.penaltyHalfWidth+100;}
  contestBall(p,buffered=false){
   if(!this.isSetPieceDefender(p)||this.protectedKeeper()||p.actionCooldown>0&&!buffered)return false;const b=this.ball,near=B.dist(p,b),reachable=near<34&&b.z<38;
   p.anim=b.z>13?'header':'tackle';p.animTime=.26;p.actionCooldown=.28;
   if(!reachable){this.clearanceRequest={player:p,expires:this.elapsed+.45};return false;}
   const dir=p.team.dir,aim=B.norm(dir,Math.abs(p.y-F.cy)>130?(p.y>F.cy?.2:-.2):0),header=b.z>13;
   this.snapshotOffside(p);b.kick(p,aim.x,aim.y,header?380:465,header?13:24);p.anim=header?'header':'volley';p.animTime=.34;b.pass=null;b.shot=null;b.lock=.15;this.pendingOffside=[];this.clearanceRequest=null;this.sound.play('kick');return true;
  }
  tackle(p,slide){const keeper=this.protectedKeeper();if(keeper&&keeper!==p&&B.dist(p,keeper)<B.PITCH.keeperClearance+30)return;if(p.actionCooldown>0||this.state!=='play')return;if(!slide&&this.isSetPieceDefender(p)){this.contestBall(p);return;}if(!slide){
    const b=this.ball,n=B.norm(b.x-p.x,b.y-p.y),facing=p.facing.x*n.x+p.facing.y*n.y;p.actionCooldown=.3;p.anim='tackle';p.animTime=.22;
    if(B.dist(p,b)<26+p.attributes.tackling*.035&&b.z<14&&facing>-.3&&b.owner?.team!==p.team){b.owner=p;b.lastTouch=p;b.pass=null;b.shot=null;b.z=b.vz=0;b.vx=p.vx;b.vy=p.vy;b.lock=.09;p.heldTime=0;this.pendingOffside=[];if(p.team.side===this.human)this.controlled=p;this.sound.play('kick');}return;
   }
   p.actionCooldown=slide?1.1:.55;p.anim=slide?'slide':'tackle';p.animTime=slide?B.SLIDE.duration:.22;if(slide){p.slideDirection={...p.facing};p.slideCount=(p.slideCount||0)+1;p.slideGrassDistance=0;p.slideGrassSerial=0;this.emitTurf(p,6);}const b=this.ball,opponent=this.teams[1-p.team.side].players.filter(q=>!q.red&&q.role!=='GK'&&B.dist(q,p)<(slide?30:23)).sort((a,c)=>B.dist(a,p)-B.dist(c,p))[0],ballFirst=B.dist(p,b)<(slide?19:14)+p.attributes.tackling*.06&&b.z<10;
   if(ballFirst){b.owner=null;b.lastTouch=p;b.vx=p.facing.x*(slide?180:100);b.vy=p.facing.y*(slide?180:100);b.lock=.16;p.touchDelay=.15;this.pendingOffside=[];b.pass=null;this.sound.play('kick');}
   if(opponent&&!ballFirst){const n=B.norm(opponent.x-p.x,opponent.y-p.y),behind=n.x*opponent.facing.x+n.y*opponent.facing.y>.5,severity=(slide?1:0)+(behind?.7:0)+Math.hypot(p.vx,p.vy)/180;if(slide||this.random()<.32){opponent.anim='fall';opponent.animTime=.7;p.team.stats.fouls++;this.ai.onFoul(p);if(severity>2.35||p.team.stats.fouls%4===0){p.team.cardTotals??={yellow:0,red:0};p.team.cardTotals.yellow++;p.yellow++;if(p.yellow>=2||severity>3.0){p.red=true;p.team.cardTotals.red++;}}if(p.red&&this.ball.owner===p)this.ball.owner=null;this.event('foul',{player:p.name,red:p.red,yellow:p.yellow});this.added=Math.min(240,this.added+15);
     const goalX=p.team.dir>0?0:(F.w),pen=Math.abs(opponent.x-goalX)<165&&Math.abs(opponent.y-F.cy)<B.PITCH.penaltyHalfWidth;
     if(!pen&&b.owner?.team===opponent.team&&B.dist(b,opponent)>20){this.advantage={team:opponent.team.side,x:opponent.x,y:opponent.y,time:2};this.message('VANTAGEM',1);}else if(pen){this.message('PÊNALTI!',2);this.setupPenalty(opponent.team.side,false);}else this.setRestart('FALTA',opponent.team.side,opponent.x,opponent.y);
    }}
  }
  boundaries(){if(this.state!=='play')return;const b=this.ball;
   // Swept goal-line intersection prevents a fast ball skipping posts or goals.
   if(b.x<0||b.x>(F.w)){const side=b.x<0?0:1,line=side?(F.w):0,ratio=B.clamp((line-b.px)/(b.x-b.px||1),0,1),y=B.lerp(b.py,b.y,ratio),z=B.lerp(b.pz,b.z,ratio),attack=this.teams.find(t=>t.dir===(side?1:-1));
    if((Math.abs(y-F.goalTop)<6||Math.abs(y-F.goalBottom)<6)&&z<F.goalHeight+4||Math.abs(z-F.goalHeight)<4&&y>F.goalTop&&y<F.goalBottom){b.x=side?(F.w-4):4;b.vx*=-.72;b.vz=Math.abs(b.vz)*.35;b.owner=null;b.lock=.15;b.impact('post');this.sound.play('post');this.message('NA TRAVE!',1);return;}
    if(y>F.goalTop&&y<F.goalBottom&&z<F.goalHeight){b.enterNet(line,F);attack.score++;this.lastScorer=b.lastTouch;this.nextKickoff=1-attack.side;this.state='goal';this.timer=2.6;this.sound.play('goal');this.message('GOOOOOL!',2.6);this.lastGoalTechnique=b.shot?.technique||'';this.event('goal',{team:attack.side,player:b.lastTouch?.name||'',technique:this.lastGoalTechnique,ownGoal:b.lastTouch?.team!==attack});this.added=Math.min(240,this.added+15);return;}
    const defending=1-attack.side;if(b.lastTouch?.team.side===defending){attack.stats.corners++;this.setRestart('ESCANTEIO',attack.side,line===0?6:(F.w-6),y<(F.cy)?6:(F.h-6));}else this.setRestart('TIRO DE META',defending,side?(F.w-53):53,B.clamp(y,F.cy-40,F.cy+40));
   }else if(b.y<0||b.y>(F.h)){this.setRestart('LATERAL',1-(b.lastTouch?.team.side??0),B.clamp(b.x,12,(F.w-12)),b.y<0?5:(F.h-5));}
  }
  setRestart(type,side,x,y){if(this.periodExtension&&['LATERAL','ESCANTEIO','TIRO DE META'].includes(type)){this.endPeriod();return;}this.setPieceContest=null;this.clearanceRequest=null;this.restartMotion=null;this.freeKick=null;this.ai.plans.clear();this.sound.play('whistle');this.stoppages++;this.added=Math.min(240,this.added+3);this.pendingOffside=[];this.advantage=null;this.charges={};this.ball.reset(x,y);const t=this.teams[side];let candidates=t.players.filter(p=>!p.red&&p.role!=='GK');if(type==='TIRO DE META')candidates=t.players.filter(p=>p.role==='GK'&&!p.red);const p=candidates.sort((a,b)=>B.dist(a,{x,y})-B.dist(b,{x,y}))[0];for(const q of this.players)if(q!==p&&B.dist(q,{x,y})<65){q.x=B.clamp(x-q.team.dir*70,12,(F.w-12));q.y=B.clamp(y+(q.index%2?65:-65),15,(F.h-15));}p.x=B.clamp(x-t.dir*9,4,(F.w-4));p.y=y;p.vx=p.vy=0;p.facing={x:t.dir,y:0};p.touchDelay=0;this.ball.owner=p;this.ball.lastTouch=p;this.restart={type,team:side,taker:p,x,y,exempt:['LATERAL','ESCANTEIO','TIRO DE META'].includes(type)};this.timer=.8;this.state='restart';this.createSetPieceShape(side,p);this.poseRestart();if(side===this.human)this.controlled=p;this.message(type,1.8);this.event('restart',{kind:type});if(type==='ESCANTEIO'||type==='FALTA'&&B.FreeKick.eligible(t,x)){this.freeKick=new B.FreeKick(this,this.restart);this.state='freeKick';}}
  resumePenaltyPlay(p,outcome){
   // Penalties inside a match are live after a parry, a post hit or a clean catch.
   // The penalty mini-scene uses goal x=1050 and center y=340: convert the ball
   // and the two featured players back to the regular pitch before resuming AI.
   if(p.shootout||this.state!=='penalty')return;
   const b=this.ball,attacking=this.teams[p.side],defending=this.teams[1-p.side];
   const dir=attacking.dir,goalX=dir>0?F.w:0;
   const put=(player,depth,lateral)=>{
    player.x=B.clamp(goalX-dir*depth,8,F.w-8);
    player.y=B.clamp(F.cy+lateral,12,F.h-12);
    player.px=player.x;player.py=player.y;player.vx=0;player.vy=0;
    player.facing={x:player.team.dir,y:0};
   };
   put(p.taker,135,0);
   put(p.keeper,17,p.keeperOffset);
   // Place nearby outfield players at the edge of the area so both sides can
   // chase the same *physical* rebound rather than teleporting to a restart.
   const edge={x:goalX-dir*180,y:F.cy};
   const spots=[{d:172,y:-82},{d:180,y:70},{d:200,y:-142},{d:218,y:138}];
   for(const team of [attacking,defending]){
    const runners=team.players.filter(q=>!q.red&&q.role!=='GK'&&q!==p.taker)
     .sort((a,c)=>B.dist(a,edge)-B.dist(c,edge)).slice(0,4);
    runners.forEach((q,i)=>put(q,spots[i].d+(team===defending?10:0),spots[i].y+(team===defending?15:0)));
   }
   if(outcome==='caught'){
    b.reset(p.keeper.x,p.keeper.y);b.owner=p.keeper;b.lastTouch=p.keeper;
    p.keeper.heldTime=0;p.keeper.anim='catch';p.keeper.animTime=.4;
    b.lock=.2;
   }else{
    const oldX=b.x,oldY=b.y;
    b.x=B.clamp(goalX+dir*(oldX-1050),5,F.w-5);
    b.y=B.clamp(F.cy+oldY-340,8,F.h-8);
    b.px=b.x;b.py=b.y;b.pz=b.z;
    b.vx*=dir;b.owner=null;b.lastTouch=outcome==='parry'?p.keeper:p.taker;
    b.net=null;b.pass=null;b.shot=null;b.lock=.22;
   }
   p.goal=false;p.phase='rebound';p.resolved=true;
   this.penalty=null;this.state='play';this.restart=null;this.freeKick=null;
   this.pendingOffside=[];this.advantage=null;this.bufferedShot=null;this.charges={};
   this.ai.plans.clear();
   const selectable=this.teams[this.human].players.filter(q=>!q.red&&q.role!=='GK');
   this.controlled=selectable.sort((a,c)=>B.dist(a,b)-B.dist(c,b))[0]||p.keeper;
   this.message(outcome==='caught'?'GOLEIRO SEGUROU!':outcome==='post'?'NA TRAVE!':'ESPALMOU! SEGUE O JOGO!',1.3);
  }
  startShootout(){this.penalties={scores:[0,0],kicks:[[],[]],turn:0,winner:null};this.setupPenalty(0,true);}
  setupPenalty(side,shootout){
   this.state='penalty';this.pendingOffside=[];this.advantage=null;this.charges={};
   this.penalty=new B.Penalty(this,side,shootout);
   this.controlled=side===this.human?this.penalty.taker:this.penalty.keeper;
   this.sound.play('whistle');
  }
  updatePenalty(dt,input){this.penalty.update(this,dt,input);}
  kickPenalty(power){this.penalty.kick(this,power);}
  penaltyResult(goal,text){const p=this.penalty;if(p.phase==='result')return;p.phase='result';p.time=0;p.goal=goal;p.resultText=text;this.message(text,1.6);this.sound.play(goal?'goal':'whistle');if(p.shootout){this.penalties.kicks[p.side].push(goal);if(goal)this.penalties.scores[p.side]++;}else if(goal){this.teams[p.side].score++;this.lastScorer=p.taker;this.event('goal',{team:p.side,player:p.taker.name});}}
  resolvePenalty(){const p=this.penalty;if(p.resolved)return;p.resolved=true;if(!p.shootout){this.teams.forEach((t,i)=>{t.dir=p.oldDirs[i];t.position();});if(p.goal){if(this.periodExtension){this.penalty=null;this.endPeriod();}else this.kickoff(1-p.side);}else{const defending=this.teams[1-p.side];this.setRestart('TIRO DE META',defending.side,defending.dir>0?53:(F.w-53),(F.cy));}return;}const s=this.penalties,[a,b]=s.scores,[ka,kb]=s.kicks.map(x=>x.length);let winner=null;if(ka<=5&&kb<=5){if(a>b+Math.max(0,5-kb))winner=0;if(b>a+Math.max(0,5-ka))winner=1;}if(ka>=5&&ka===kb&&a!==b)winner=a>b?0:1;if(winner!==null){s.winner=winner;this.finish();}else{this.setupPenalty(1-p.side,true);}}
 };
})();
