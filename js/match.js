'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 B.Match=class {
  constructor(home,away,options={},sound={play(){}}){this.options=options;this.mode=options.mode||'quick';this.human=options.human??0;this.difficulty=options.difficulty??1;this.duration=options.duration||240;this.random=B.rng(options.seed??Date.now());this.sound=sound;this.teams=[home,away].map((data,side)=>new B.Team(data,side,side===this.human?options.formation:undefined,side===this.human?options.lineup:undefined,side===this.human?options.tactics:undefined));
   const color=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const a=color(home.kit.home.shirtBaseColor),b=color(away.kit.home.shirtBaseColor);if(Math.hypot(...a.map((v,i)=>v-b[i]))<130||home.id===away.id)this.teams[1].kit=away.kit.away;
   this.ball=new B.Ball();this.ai=new B.AIController(this);this.controlled=this.teams[this.human].players[9];this.state='restart';this.timer=0;this.clock=0;this.period=1;this.added=60;this.stoppages=0;this.elapsed=0;this.banner='';this.bannerTime=0;this.events=[];this.pendingOffside=[];this.offsideLine=0;this.charges={};this.advantage=null;this.lastScorer=null;this.autoplay=!!options.autoplay;this.finished=false;this.penalties=null;this.kickoff(0);
   if(this.mode==='penalties')this.startShootout();
  }
  get players(){return this.teams.flatMap(t=>t.players);}
  get minute(){return Math.floor(this.clock/60);}
  message(text,time=2){this.banner=text;this.bannerTime=time;}
  event(type,data={}){this.events.push({type,minute:this.minute,...data});if(this.onEvent)this.onEvent(type,data);}
  kickoff(side){this.freeKick=null;this.ai.plans.clear();for(const t of this.teams)t.position();this.ball.reset((F.cx),(F.cy));this.pendingOffside=[];const team=this.teams[side],p=team.players.filter(p=>!p.red&&p.role!=='GK').at(-1);for(const t of this.teams)for(const q of t.players){q.x=t.dir>0?Math.min(q.x,(F.cx-13)):Math.max(q.x,(F.cx+13));if(t!==team&&B.dist(q,this.ball)<95)q.x-=t.dir*100;}p.x=(F.cx)-team.dir*10;p.y=(F.cy);this.restart={type:'SAÍDA DE BOLA',team:side,taker:p,x:(F.cx),y:(F.cy),exempt:true};this.state='restart';this.timer=1;this.ball.owner=p;this.ball.lastTouch=p;if(side===this.human)this.controlled=p;this.sound.play('whistle');this.message('SAÍDA DE BOLA',1.2);}
  update(dt,input){if(this.finished)return;this.elapsed+=dt;this.bannerTime=Math.max(0,this.bannerTime-dt);if(this.state==='half'||this.state==='finished')return;
   if(this.state==='goal'){this.ball.update(dt);this.timer-=dt;for(const p of this.teams[1-this.nextKickoff].players){p.anim='celebrate';p.runTime+=dt*10;}if(this.timer<=0)this.kickoff(this.nextKickoff);return;}
   if(this.state==='penalty'){this.updatePenalty(dt,input);return;}
   if(this.state==='freeKick'){this.freeKick.update(this,dt,input);return;}
   if(this.state==='restart'){this.timer-=dt;const r=this.restart;if(this.timer<=0){if(r.team!==this.human||this.autoplay||this.timer< -7){if(r.type==='ESCANTEIO')this.pass(r.taker,'long',.7,{x:this.teams[r.team].dir,y:r.y<(F.cy)?1:-1});else if(r.type==='FALTA'&&Math.abs(r.x-(this.teams[r.team].dir>0?(F.w):0))<270)this.shoot(r.taker,.65,{x:this.teams[r.team].dir,y:0});else this.pass(r.taker,r.type==='TIRO DE META'?'long':'pass',.45,{x:this.teams[r.team].dir,y:0});}else if(input){this.handleActions(input,dt,true);}}return;}
   this.advanceClock(dt);if(this.state!=='play')return;
   if(input&&!this.autoplay){if(input.pressed.switch)this.switchPlayer();const p=this.controlled;if(p&& !p.red){if(input.dash){p.dash=.25;input.dash=false;}p.move(input.axis.x,input.axis.y,input.state.sprint,dt);p.state='USER';this.handleActions(input,dt);}}
   if(this.state!=='play')return;this.ai.update(dt);if(this.state!=='play')return;B.Physics.players(this.players);
   const ball=this.ball,owner=ball.owner;if(owner&&!owner.red){if(B.dist(owner,ball)>27||ball.z>18){ball.owner=null;}else{owner.team.stats.possession+=dt;this.dribble(owner,dt);}}
   ball.update(dt);this.freeKick?.afterBall(this,dt);this.touchBall(dt);this.boundaries();
   if(this.advantage){this.advantage.time-=dt;if(ball.owner&&ball.owner.team.side!==this.advantage.team){const a=this.advantage;this.advantage=null;this.setRestart('FALTA',a.team,a.x,a.y);}else if(this.advantage.time<=0)this.advantage=null;}
   if(this.controlled?.red)this.switchPlayer();
  }
  dribble(p,dt){
   if(p.role==='GK')return;
   const b=this.ball,speed=Math.hypot(p.vx,p.vy),stride=Math.sin(p.runTime*Math.PI),f=p.facing;
   const reach=8+Math.min(speed/35,5)+(speed>20?(stride+1)*1.5:0);
   const lateral=speed>20?Math.cos(p.runTime*Math.PI)*1.3:0;
   const tx=p.x+f.x*reach-f.y*lateral,ty=p.y+f.y*reach+f.x*lateral;
   // Foot-sized touches, with a longer exposed touch while sprinting.
   const response=1-Math.exp(-dt*(18+p.attributes.control*.08));
   b.vx=B.lerp(b.vx,p.vx+(tx-b.x)*12,response);
   b.vy=B.lerp(b.vy,p.vy+(ty-b.y)*12,response);b.lastTouch=p;
  }
  advanceClock(dt){if(this.mode==='training')return;this.clock+=dt*5400/this.duration;const base=this.period===1?2700:this.period===2?5400:this.period===3?6300:7200;if(this.clock>=base+this.added){if(this.period===1||this.period===3){this.state='half';this.message('INTERVALO',99);this.sound.play('whistle');this.event('half');}else if(this.period===2&&this.mode==='cup'&&this.teams[0].score===this.teams[1].score){this.state='half';this.message('PRORROGAÇÃO',99);this.sound.play('whistle');this.event('half');}else if(this.period===4&&this.teams[0].score===this.teams[1].score){this.startShootout();}else this.finish();}}
  resumeHalf(){this.period++;this.clock=this.period===2?2700:this.period===3?5400:6300;this.added=this.period>2?30:60;this.teams.forEach(t=>{t.dir*=-1;t.players.forEach(p=>p.energy=Math.min(1,p.energy+.2));});this.kickoff(this.period%2?0:1);}
  finish(){if(this.finished)return;this.finished=true;this.state='finished';this.sound.play('whistle');this.event('finished');}
  switchPlayer(){const list=this.teams[this.human].players.filter(p=>!p.red&&p.role!=='GK').sort((a,b)=>B.dist(a,this.ball)-B.dist(b,this.ball));if(list.length)this.controlled=list[0]===this.controlled&&list[1]?list[1]:list[0];}
  handleActions(i,dt,restart=false){const p=this.controlled;if(!p)return;const b=this.ball,has=b.owner===p||B.dist(p,b)<20&&b.z<40,aim=i.axis;
   for(const action of ['pass','shoot','long']){if(i.pressed[action]){if(!has&&!restart){if(action==='pass')this.tackle(p,true);if(action==='shoot')this.tackle(p,false);}this.charges[action]=0;}
    if(i.state[action]&&this.charges[action]!==undefined)this.charges[action]+=dt;
    if(i.released[action]&&this.charges[action]!==undefined){const power=B.clamp(this.charges[action]/.85,.1,1);delete this.charges[action];if(has||restart){if(action==='shoot')this.shoot(p,power,aim);else this.pass(p,action,power,aim);}else if(action==='shoot'){this.bufferedShot={player:p,power,aim:{...aim},expires:this.elapsed+.35};}}}
   if(i.pressed.context&&has){if(b.z>8)this.shoot(p,.55,aim,true);else{p.dash=.2;b.vx+=p.facing.y*100;b.vy-=p.facing.x*100;b.owner=null;b.lock=.1;p.touchDelay=.1;p.anim='dribble';p.animTime=.25;}}else if(i.pressed.context&&!has)this.tackle(p,false);
  }
  readyKick(p){if(this.state==='restart'){if(this.restart.taker!==p||this.timer>0)return false;this.exemptPass=this.restart.exempt;this.state='play';this.restart=null;this.charges={};}return true;}
  snapshotOffside(p){const defenders=this.teams[1-p.team.side].players;this.offsideLine=B.Physics.offsideLine(defenders,p.team.dir);this.pendingOffside=this.exemptPass?[]:p.team.players.filter(q=>q!==p&&!q.red&&B.Physics.isOffside(q,this.ball,this.offsideLine,p.team.dir));this.exemptPass=false;}
  pass(p,type,power,axis,preferred=null){if(!this.readyKick(p))return;const long=type==='long',b=this.ball,dir=p.team.dir,aim=Math.hypot(axis.x,axis.y)>.1?B.norm(axis.x,axis.y):{x:dir,y:0},opps=this.teams[1-p.team.side].players.filter(q=>!q.red);
   const choices=p.team.players.filter(q=>q!==p&&!q.red&&B.dist(q,p)>25).map(q=>{const n=B.norm(q.x-p.x,q.y-p.y),d=B.dist(q,p),mark=Math.min(...opps.map(o=>B.dist(o,q))),blocked=opps.some(o=>B.Physics.lineDistance(o,p,q)<13&&B.dist(o,p)>20);const score=(n.x*aim.x+n.y*aim.y)*190-Math.abs(d-(long?300:150))*.35+Math.min(mark,60)*.5-(blocked?55:0);return {q,score};}).sort((a,c)=>c.score-a.score);
   const target=preferred&&choices.some(c=>c.q===preferred)?preferred:choices[0]?.q;let tx=target?target.x+target.vx*.35:p.x+aim.x*180,ty=target?target.y+target.vy*.35:p.y+aim.y*180;
   const pressure=opps.filter(o=>B.dist(o,p)<45).length,attr=long?p.attributes.longPassing:p.attributes.passing,precision=p.team.side===this.human?1:this.ai.profile(p.team).precision,error=((100-attr)*.13+pressure*4+Math.hypot(p.vx,p.vy)*.035)*precision;tx+=(this.random()-.5)*error;ty+=(this.random()-.5)*error;const distance=Math.hypot(tx-p.x,ty-p.y);this.snapshotOffside(p);
   const speed=long?B.clamp(distance*.78+130+power*50,240,520):B.clamp(distance*1.15+80+power*80,170,600);b.kick(p,tx-p.x,ty-p.y,speed,long?Math.min(170,65+distance*.16):0);b.pass={from:p,target};b.shot=null;p.team.stats.passes++;this.sound.play(long?'kick':'pass');if(target&&p.team.side===this.human)this.controlled=target;
  }
  shoot(p,power,axis,context=false){if(!this.readyKick(p))return;const b=this.ball,dir=p.team.dir,gx=dir>0?(F.w+10):-10;const horizontal=Math.abs(axis.y)>.1?axis.y:((p.y>(F.cy))?-.2:.2);let gy=(F.cy)+horizontal*52;const pressure=this.teams[1-p.team.side].players.filter(o=>!o.red&&B.dist(o,p)<35).length,body=p.facing.x*dir<-.2?15:0,precision=p.team.side===this.human?1:this.ai.profile(p.team).precision,attribute=b.z>17?p.attributes.heading:p.attributes.shooting;const error=((100-attribute)*.55+pressure*5+body+(power>.9?20:0))*precision;gy+=(this.random()-.5)*error;this.snapshotOffside(p);const height=b.z;const bicycle=context&&height>17&&p.facing.x*dir<-.2,header=height>17&&!bicycle,volley=height>5;const lift=header?12:volley?30:power<.28?2:18+power*36;
   b.kick(p,gx-p.x,gy-p.y,310+power*240,lift,horizontal*.15);p.anim=bicycle?'bicycle':header?'header':volley?'volley':context?'placed':'kick';p.animTime=.4;p.team.stats.shots++;const target=Math.abs(gy-(F.cy))<59;if(target)p.team.stats.onTarget++;b.shot={team:p.team.side,onTarget:target};b.pass=null;this.sound.play('kick');
  }
  touchBall(dt){const b=this.ball;if(b.lock>0)return;const near=this.players.filter(p=>!p.red&&p!==b.owner&&p.touchDelay===0&&B.dist(p,b)<(b.z>0?12:13)).sort((a,c)=>B.dist(a,b)-B.dist(c,b));for(const p of near){if(p.role==='GK')continue;if(b.z>32)continue;
    if(this.pendingOffside.includes(p)){p.team.stats.offsides++;this.pendingOffside=[];this.message('IMPEDIMENTO',2);this.setRestart('IMPEDIMENTO',1-p.team.side,p.x,p.y);return;}
    if(b.owner&&b.owner.team===p.team)continue;
    if(this.bufferedShot?.player===p&&this.bufferedShot.expires>=this.elapsed){const s=this.bufferedShot;this.bufferedShot=null;this.shoot(p,s.power,s.aim);return;}
    if(b.z>14){if(p!==this.controlled||this.autoplay){if(Math.abs(p.x-(p.team.dir>0?(F.w):0))<250)this.shoot(p,.55,{x:p.team.dir,y:0},true);}return;}
    const speed=Math.hypot(b.vx-p.vx,b.vy-p.vy),control=p.attributes.control,pressure=this.teams[1-p.team.side].players.some(o=>!o.red&&B.dist(o,p)<24);const limit=135+control*2-(pressure?40:0);
    if(speed>limit){const n=B.norm(b.x-p.x,b.y-p.y);b.vx=b.vx*.4+n.x*60;b.vy=b.vy*.4+n.y*60;b.vz=Math.max(8,b.vz*.3);b.owner=null;b.lastTouch=p;b.lock=.16;p.touchDelay=.2;this.pendingOffside=[];b.pass=null;return;}
    if(b.owner&&this.random()>dt*3)return;
    if(b.pass){if(b.pass.from.team===p.team&&b.pass.from!==p)p.team.stats.completed++;b.pass=null;}
    p.anim='receive';p.animTime=.16;b.owner=p;b.lastTouch=p;b.vx*=.38;b.vy*=.38;b.z=0;b.vz=0;p.heldTime=0;this.pendingOffside=[];b.shot=null;if(p.team.side===this.human&&p.role!=='GK')this.controlled=p;return;
   }
  }
  tackle(p,slide){if(p.actionCooldown>0||this.state!=='play')return;p.actionCooldown=slide?1.1:.55;p.anim=slide?'slide':'tackle';p.animTime=slide?.42:.22;if(slide)p.slideDirection={...p.facing};const b=this.ball,opponent=this.teams[1-p.team.side].players.filter(q=>!q.red&&q.role!=='GK'&&B.dist(q,p)<(slide?30:23)).sort((a,c)=>B.dist(a,p)-B.dist(c,p))[0],ballFirst=B.dist(p,b)<(slide?19:14)+p.attributes.tackling*.06&&b.z<10;
   if(ballFirst){b.owner=null;b.lastTouch=p;b.vx=p.facing.x*(slide?180:100);b.vy=p.facing.y*(slide?180:100);b.lock=.16;p.touchDelay=.15;this.pendingOffside=[];b.pass=null;this.sound.play('kick');}
   if(opponent&&!ballFirst){const n=B.norm(opponent.x-p.x,opponent.y-p.y),behind=n.x*opponent.facing.x+n.y*opponent.facing.y>.5,severity=(slide?1:0)+(behind?.7:0)+Math.hypot(p.vx,p.vy)/180;if(slide||this.random()<.32){opponent.anim='fall';opponent.animTime=.7;p.team.stats.fouls++;this.ai.onFoul(p);if(severity>1.4){p.yellow++;if(p.yellow>=2||severity>2.4)p.red=true;}if(p.red&&this.ball.owner===p)this.ball.owner=null;this.event('foul',{player:p.name,red:p.red,yellow:p.yellow});this.added=Math.min(240,this.added+15);
     const goalX=p.team.dir>0?0:(F.w),pen=Math.abs(opponent.x-goalX)<165&&Math.abs(opponent.y-(F.cy))<200;
     if(!pen&&b.owner?.team===opponent.team&&B.dist(b,opponent)>20){this.advantage={team:opponent.team.side,x:opponent.x,y:opponent.y,time:2};this.message('VANTAGEM',1);}else if(pen){this.message('PÊNALTI!',2);this.setupPenalty(opponent.team.side,false);}else this.setRestart('FALTA',opponent.team.side,opponent.x,opponent.y);
    }}
  }
  boundaries(){if(this.state!=='play')return;const b=this.ball;
   // Swept goal-line intersection prevents a fast ball skipping posts or goals.
   if(b.x<0||b.x>(F.w)){const side=b.x<0?0:1,line=side?(F.w):0,ratio=B.clamp((line-b.px)/(b.x-b.px||1),0,1),y=B.lerp(b.py,b.y,ratio),z=B.lerp(b.pz,b.z,ratio),attack=this.teams.find(t=>t.dir===(side?1:-1));
    if((Math.abs(y-F.goalTop)<6||Math.abs(y-F.goalBottom)<6)&&z<F.goalHeight+4||Math.abs(z-F.goalHeight)<4&&y>F.goalTop&&y<F.goalBottom){b.x=side?(F.w-4):4;b.vx*=-.72;b.vz=Math.abs(b.vz)*.35;b.owner=null;b.lock=.15;b.impact('post');this.sound.play('post');this.message('NA TRAVE!',1);return;}
    if(y>F.goalTop&&y<F.goalBottom&&z<F.goalHeight){b.enterNet(line,F);attack.score++;this.lastScorer=b.lastTouch;this.nextKickoff=1-attack.side;this.state='goal';this.timer=2.6;this.sound.play('goal');this.message('GOOOOOL!',2.6);this.event('goal',{team:attack.side,player:b.lastTouch?.name||'',ownGoal:b.lastTouch?.team!==attack});this.added=Math.min(240,this.added+15);return;}
    const defending=1-attack.side;if(b.lastTouch?.team.side===defending){attack.stats.corners++;this.setRestart('ESCANTEIO',attack.side,line===0?6:(F.w-6),y<(F.cy)?6:(F.h-6));}else this.setRestart('TIRO DE META',defending,side?(F.w-53):53,B.clamp(y,F.cy-40,F.cy+40));
   }else if(b.y<0||b.y>(F.h)){this.setRestart('LATERAL',1-(b.lastTouch?.team.side??0),B.clamp(b.x,12,(F.w-12)),b.y<0?5:(F.h-5));}
  }
  setRestart(type,side,x,y){this.freeKick=null;this.ai.plans.clear();this.sound.play('whistle');this.stoppages++;this.added=Math.min(240,this.added+3);this.pendingOffside=[];this.advantage=null;this.charges={};this.ball.reset(x,y);const t=this.teams[side];let candidates=t.players.filter(p=>!p.red&&p.role!=='GK');if(type==='TIRO DE META')candidates=t.players.filter(p=>p.role==='GK'&&!p.red);const p=candidates.sort((a,b)=>B.dist(a,{x,y})-B.dist(b,{x,y}))[0];for(const q of this.players)if(q!==p&&B.dist(q,{x,y})<65){q.x=B.clamp(x-q.team.dir*70,12,(F.w-12));q.y=B.clamp(y+(q.index%2?65:-65),15,(F.h-15));}p.x=B.clamp(x-t.dir*9,4,(F.w-4));p.y=y;p.vx=p.vy=0;p.facing={x:t.dir,y:0};p.touchDelay=0;this.ball.owner=p;this.ball.lastTouch=p;this.restart={type,team:side,taker:p,x,y,exempt:['LATERAL','ESCANTEIO','TIRO DE META'].includes(type)};this.timer=.8;this.state='restart';if(side===this.human)this.controlled=p;this.message(type,1.8);this.event('restart',{kind:type});if(type==='ESCANTEIO'||type==='FALTA'&&B.FreeKick.eligible(t,x)){this.freeKick=new B.FreeKick(this,this.restart);this.state='freeKick';}}
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
  resolvePenalty(){const p=this.penalty;if(p.resolved)return;p.resolved=true;if(!p.shootout){this.teams.forEach((t,i)=>{t.dir=p.oldDirs[i];t.position();});if(p.goal)this.kickoff(1-p.side);else{const defending=this.teams[1-p.side];this.setRestart('TIRO DE META',defending.side,defending.dir>0?53:(F.w-53),(F.cy));}return;}const s=this.penalties,[a,b]=s.scores,[ka,kb]=s.kicks.map(x=>x.length);let winner=null;if(ka<=5&&kb<=5){if(a>b+Math.max(0,5-kb))winner=0;if(b>a+Math.max(0,5-ka))winner=1;}if(ka>=5&&ka===kb&&a!==b)winner=a>b?0:1;if(winner!==null){s.winner=winner;this.finish();}else{this.setupPenalty(1-p.side,true);}}
 };
})();
