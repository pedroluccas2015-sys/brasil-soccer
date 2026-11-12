'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 // Normal-match profiles only; player attributes and penalty difficulty stay unchanged.
 B.MATCH_DIFFICULTIES=Object.freeze([
  {reaction:.65,decision:1.05,anticipation:.10,press:24,mark:.18,tackle:.45,precision:1.65,vision:170,keeper:.22},
  {reaction:.38,decision:.72,anticipation:.25,press:38,mark:.40,tackle:.8,precision:1.2,vision:240,keeper:.32},
  {reaction:.22,decision:.46,anticipation:.42,press:52,mark:.65,tackle:1.15,precision:.88,vision:320,keeper:.43},
  {reaction:.13,decision:.30,anticipation:.58,press:65,mark:.82,tackle:1.5,precision:.68,vision:400,keeper:.55}
 ].map(Object.freeze));
 B.AIController=class {
  constructor(match){this.m=match;this.plans=new Map();this.nextRiskAt=[6,6];this.riskyRandom=B.rng(B.hash('foul:'+String(match.options.seed??Date.now())));}
  profile(team){const base=B.MATCH_DIFFICULTIES[team.side===this.m.human?1:B.clamp(Math.round(this.m.difficulty)||0,0,3)],strength=B.clamp((team.rating?.strength??60)/100,.2,1);return {...base,reaction:base.reaction*B.lerp(1.28,.82,strength),decision:base.decision*B.lerp(1.2,.88,strength),precision:base.precision*B.lerp(1.4,.75,strength),vision:base.vision*B.lerp(.82,1.1,strength)};}
  intercept(p,profile){const b=this.m.ball,t=B.clamp(B.dist(p,b)/150,0,profile.anticipation);return {x:B.clamp(b.x+b.vx*t,8,(F.w-8)),y:B.clamp(b.y+b.vy*t,8,(F.h-8))};}
  defensiveShape(team,p){
   const b=this.m.ball,dir=team.dir,depth=x=>dir>0?x:F.w-x,ballDepth=depth(b.x);
   const lineShift=team.tactics.line==='Alta'?48:team.tactics.line==='Baixa'?-42:0;
   const mental=team.tactics.mentality==='Defensiva'?-22:team.tactics.mentality==='Ofensiva'?22:0;
   let back=B.clamp(ballDepth-190+lineShift+mental,58,F.cx-90);
   if(ballDepth<165)back=B.clamp(ballDepth-38,24,100);
   const row=p.role==='DF'?back:p.role==='MF'?Math.min(back+148,ballDepth+70):Math.min(back+290,ballDepth+210);
   const width=p.role==='MF'?.78:.68,center=F.cy+(b.y-F.cy)*.35;
   return {x:dir>0?row:F.w-row,y:B.clamp(center+(p.home.y-F.cy)*width,38,F.h-38),back,depth:row};
  }
  plan(team,dt){
   const m=this.m,b=m.ball,cfg=this.profile(team),out=team.players.filter(p=>!p.red&&p.role!=='GK');let plan=this.plans.get(team);
   const control=m.autoplay?null:m.controlled,owner=b.owner||b.pass?.from||null;
   const signature=out.map(p=>p.id).join('|')+'/'+m.teams[1-team.side].players.filter(p=>!p.red).map(p=>p.id).join('|'),second=!!m.secondPress&&team.side===m.human;
   if(plan&&(plan.time-=dt)>0&&plan.owner===owner&&plan.control===control&&plan.signature===signature&&plan.second===second&&!plan.chaser?.red)return plan;
   const depth=x=>team.dir>0?x:F.w-x,ownGoal={x:team.dir>0?0:F.w,y:F.cy},ballDepth=depth(b.x);
   const shapes=new Map(out.map(p=>[p,this.defensiveShape(team,p)]));
   const cost=p=>B.dist(p,this.intercept(p,cfg))+(p.role==='DF'&&ballDepth>350?70:0)+Math.abs(p.home.y-b.y)*.07;
   const candidates=out.filter(p=>p!==control).sort((a,c)=>cost(a)-cost(c));
   const chaser=candidates[0],cover=candidates.slice(1).sort((a,c)=>{
    const value=p=>B.dist(p,{x:b.x-team.dir*75,y:B.lerp(b.y,F.cy,.3)})+(p.role==='FW'?95:0);
    return value(a)-value(c);
   })[0];
   const manualPress=control?.team===team&&B.dist(control,b)<100&&b.owner?.team!==team;
   const marks=new Map(),targets=new Map(),free=new Set(candidates.filter(p=>p!==chaser&&p!==cover));
   const rivals=m.teams[1-team.side].players.filter(p=>!p.red&&p.role!=='GK'&&p!==b.owner&&depth(p.x)<ballDepth+210);
   const danger=p=>B.dist(p,ownGoal)+Math.abs(p.y-F.cy)*.25;
   for(const opponent of rivals.sort((a,c)=>danger(a)-danger(c))){
    const rank=p=>{const shape=shapes.get(p);return B.dist(shape,opponent)+B.dist(p,opponent)*.22+(p.role==='DF'&&depth(opponent.x)>shape.back+160?190:0);};
    const defender=[...free].sort((a,c)=>rank(a)-rank(c))[0];
    if(defender){marks.set(defender,opponent);free.delete(defender);}
   }
   for(const p of candidates){
    if(p===chaser||p===cover)continue;
    const shape=shapes.get(p),opponent=marks.get(p);let tx=shape.x,ty=shape.y;
    if(opponent){
     const closeToGoal=depth(opponent.x)<260,blend=closeToGoal?.88:.38+cfg.mark*.38;
     const markDepth=Math.max(16,depth(opponent.x)-22);
     tx=B.lerp(tx,team.dir>0?markDepth:F.w-markDepth,blend);
     ty=B.lerp(ty,B.lerp(opponent.y,b.y,.10),blend);
     // Track runners behind the line without following distant opponents out of it.
     if(p.role==='DF'){let d=B.clamp(depth(tx),Math.max(16,Math.min(shape.back,markDepth)-26),shape.back+95);if(closeToGoal&&depth(opponent.x)<shape.back)d=Math.min(d,markDepth);tx=team.dir>0?d:F.w-d;}
    }
    targets.set(p,{x:B.clamp(tx,16,F.w-16),y:B.clamp(ty,24,F.h-24)});
   }
   // Keep teammates in separate lanes when two assignments converge.
   const entries=[...targets];for(let pass=0;pass<2;pass++)for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
    const a=entries[i][1],c=entries[j][1];if(B.dist(a,c)>=42)continue;
    const sign=a.y===c.y?(entries[i][0].home.y<=entries[j][0].home.y?-1:1):Math.sign(a.y-c.y),gap=(42-Math.abs(a.y-c.y))*.5;
    a.y=B.clamp(a.y+sign*gap,24,F.h-24);c.y=B.clamp(c.y-sign*gap,24,F.h-24);
   }
   plan={time:cfg.reaction,owner,control,signature,second,chaser,cover,marks,targets,manualPress};this.plans.set(team,plan);return plan;
  }
  bestPass(p){
   const m=this.m,team=p.team,cfg=this.profile(team),opps=m.teams[1-team.side].players.filter(q=>!q.red);
   const line=B.Physics.offsideLine(opps,team.dir);
   return team.players.filter(q=>q!==p&&!q.red&&q.role!=='GK'&&B.dist(q,p)>35&&B.dist(q,p)<cfg.vision&&!B.Physics.isOffside(q,m.ball,line,team.dir)).map(q=>{
    const distance=B.dist(q,p),space=Math.min(...opps.map(o=>B.dist(o,q)));
    const blocked=opps.some(o=>B.Physics.lineDistance(o,p,q)<18&&B.dist(o,p)>18);
    const score=(q.x-p.x)*team.dir*.55+Math.min(space,85)-(blocked?105:0)-Math.abs(distance-190)*.12;
    return {player:q,score,blocked,distance};
   }).sort((a,c)=>c.score-a.score)[0];
  }
  moveTo(p,tx,ty,sprint,dt){
   const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
   // Hysteresis lets a player settle instead of circling a formation target.
   if(p.arrived?d<10:d<5){p.arrived=true;p.move(0,0,false,dt);}
   else{p.arrived=false;p.move(dx,dy,sprint&&d>24,dt);}
  }
  update(dt){
   const m=this.m,b=m.ball;
   for(const team of m.teams){
    const cfg=this.profile(team),plan=this.plan(team,dt),own=b.owner?.team===team||!b.owner&&b.pass?.from.team===team,dir=team.dir;
    const rivals=m.teams[1-team.side].players.filter(p=>!p.red),line=B.Physics.offsideLine(rivals,dir);
    for(const p of team.players){
     if(m.state!=='play')return;
     if(p.red||p===m.controlled&&!m.autoplay&&p.role!=='GK'||m.freeKick?.holdsWall(p))continue;
     const corner=m.freeKick;
     if(corner?.corner&&corner.phase==='flight'&&corner.flightTime<1.55&&corner.cornerPositions?.has(p)){
      const spot=corner.cornerPositions.get(p),target=corner.cornerTarget();
      p.state='BOX_RUN';this.moveTo(p,B.lerp(spot.x,target.x,.13),B.lerp(spot.y,target.y,.16),false,dt);
      continue;
     }
     if(p.role==='GK'){this.keeper(p,dt);continue;}
     let tx=p.home.x,ty=p.home.y,sprint=false;const near=B.dist(p,b);
     if(b.owner===p){
      p.state='DRIBBLE';p.heldTime+=dt;const gx=dir>0?(F.w):0,goalDist=Math.abs(gx-p.x);
      const closest=[...rivals].sort((a,c)=>B.dist(a,p)-B.dist(c,p))[0],pressure=closest&&B.dist(closest,p)<cfg.press+12;
      tx=p.x+dir*110;ty=B.lerp(p.y,(F.cy),.32);sprint=goalDist>220&&!pressure;
      if(closest&&B.dist(closest,p)<75&&dir*(closest.x-p.x)>0)ty+=p.y>closest.y?65:-65;
      if(p.decision<=0&&p.touchDelay===0){
       p.decision=cfg.decision;const pass=this.bestPass(p),keeper=rivals.find(q=>q.role==='GK');
       if(goalDist<310&&Math.abs(p.y-(F.cy))<175&&(goalDist<210||!pass||pass.score<105)){
        p.state='SHOOT';const corner=keeper&&keeper.y>=(F.cy)?-.7:.7;m.shoot(p,.4+m.random()*.35,{x:dir,y:corner});
       }else if(pass&&!pass.blocked&&p.heldTime>.3&&(pressure||p.heldTime>1.8||pass.score>130)){
        p.state='PASS';m.pass(p,pass.distance>245?'long':'pass',.45,{x:pass.player.x-p.x,y:pass.player.y-p.y},pass.player);p.heldTime=0;
       }
      }
     }else if(b.pass?.target===p){
      p.state='RECEIVE';const target=m.receiverTarget(p);tx=target.x;ty=target.y;sprint=near>50;
     }else if(p===plan.chaser&&!own){
      p.state=b.owner?(plan.manualPress?'CONTAIN':'PRESS'):'CHASE';const target=this.intercept(p,cfg);
      const goalSide=B.norm((dir>0?0:F.w)-b.x,F.cy-b.y),standOff=p.state==='CONTAIN'?48:b.owner?10:0;
      tx=target.x+goalSide.x*standOff;ty=target.y+goalSide.y*standOff;sprint=near>55;
      if(b.owner&&b.owner.team!==team&&near<23&&p.actionCooldown===0){
       const toward=B.norm(b.x-p.x,b.y-p.y),facing=p.facing.x*toward.x+p.facing.y*toward.y;
       if(facing>.25&&m.random()<1-Math.exp(-dt*cfg.tackle))m.tackle(p,false);
      }
     }else if(p===plan.cover&&!own){
      p.state=plan.second?'SECOND_PRESS':'COVER';const d=dir>0?b.x:F.w-b.x,coverDepth=B.clamp(d-(p.state==='SECOND_PRESS'?15:78),18,F.w-18);
      tx=dir>0?coverDepth:F.w-coverDepth;ty=B.lerp(b.y,F.cy,p.state==='SECOND_PRESS'?.04:.32);sprint=p.state==='SECOND_PRESS'||B.dist(p,{x:tx,y:ty})>100;
     }else{
      const mental=team.tactics.mentality==='Ofensiva'?55:team.tactics.mentality==='Defensiva'?-55:0;
      const lineShift=team.tactics.line==='Alta'?65:team.tactics.line==='Baixa'?-65:0;
      tx=p.home.x+(b.x-(F.cx))*.42+dir*((own?42:-40)+mental+(p.role==='DF'?lineShift:0));ty=p.home.y+(b.y-(F.cy))*.28;
      if(own){
       p.state=p.role==='FW'?'RUN_FORWARD':'SUPPORT';ty=(F.cy)+(ty-(F.cy))*1.15;
       if(team.tactics.attack==='Contra-ataque'&&p.role==='FW')tx+=dir*80;
       if(p.runAfterPass>0){tx+=dir*95;ty+=(p.home.y>F.cy?1:-1)*35;p.state='GIVE_AND_GO';sprint=true;}
       if(team.tactics.attack==='Posse')tx-=dir*25;
       const limit=dir>0?Math.max((F.cx),line,b.x)-8:Math.min((F.cx),line,b.x)+8;
       tx=dir>0?Math.min(tx,limit):Math.max(tx,limit);
       if(b.owner&&B.dist(p,b.owner)<45)ty+=p.home.y>(F.cy)?40:-40;
      }else{
       p.state=plan.marks.has(p)?'MARK':'BLOCK';const target=plan.targets.get(p)||this.defensiveShape(team,p);
       tx=target.x;ty=target.y;sprint=B.dist(p,target)>100;
      }
     }
     if(b.owner&&b.owner.team!==team&&near<41&&p.actionCooldown===0&&
        (p===plan.chaser||near<29))this.tryRiskyTackle(p,b.owner,near,dt);
     if(m.state!=='play')return;
     if(m.mode==='training'&&team.side!==m.human){tx=p.home.x;ty=p.home.y;p.state='FORMATION';}
     this.moveTo(p,B.clamp(tx,12,(F.w-12)),B.clamp(ty,12,(F.h-12)),sprint,dt);
    }
   }
  }
  tryRiskyTackle(p,carrier,ballDistance,dt){
   const m=this.m,b=m.ball;
   if(!carrier||carrier.role==='GK'||b.z>=10||m.mode==='training'||(!m.autoplay&&p.team.side===m.human))return;
   const toward=B.norm(carrier.x-p.x,carrier.y-p.y);
   const facing=p.facing.x*toward.x+p.facing.y*toward.y;
   // A slightly late challenge can occasionally cause contact (or a penalty in the box).
   // Unlike the normal tackle, this is intentionally shared across nearby defenders.
   if(m.elapsed<this.nextRiskAt[p.team.side]||facing<.1)return;
   const gap=B.dist(p,carrier),cleanReach=14+p.attributes.tackling*.06;
   if(gap>30||gap<10||ballDistance<=cleanReach+1||ballDistance>40)return;
   const goalX=p.team.dir>0?0:F.w,goalDistance=Math.abs(goalX-carrier.x);
   const attacking=carrier.vx*carrier.team.dir>35;
   if(!attacking&&goalDistance>F.w*.37)return;
   const dangerous=goalDistance<F.w*.36,insideBox=goalDistance<165&&Math.abs(carrier.y-F.cy)<200;
   const rate=(dangerous?.75:.48)*(insideBox?1.15:1)*(m.difficulty===0?.55:1);
   const slideReach=19+p.attributes.tackling*.06;
   const fromBehind=toward.x*carrier.facing.x+toward.y*carrier.facing.y>.5;
   const tooFastFromBehind=fromBehind&&Math.hypot(p.vx,p.vy)>95;
   // Beyond standing-tackle reach, only an actual sliding challenge can contact the carrier.
   if(gap>=23&&(tooFastFromBehind||ballDistance<=slideReach+1))return;
   if(this.riskyRandom()>=1-Math.exp(-dt*rate))return;
   // Slides are uncommon, and never reckless high-speed tackles from behind.
   const slide=gap>=23||ballDistance>slideReach+1&&!tooFastFromBehind&&this.riskyRandom()<.30;
   this.nextRiskAt[p.team.side]=m.elapsed+12;
   m.tackle(p,slide);
  }
  onFoul(p){
   // The next risky challenge must be spaced out, even after a legal advantage.
   this.nextRiskAt[p.team.side]=Math.max(this.nextRiskAt[p.team.side],this.m.elapsed+20);
  }
  keeper(p,dt){
   const m=this.m,b=m.ball,t=p.team,cfg=this.profile(t),dir=t.dir,gx=dir>0?18:(F.w-18),danger=Math.abs(b.x-gx)<235;
   if(b.owner===p){p.state='CATCH';p.heldTime+=dt;p.move(0,0,false,dt);if(p.heldTime>1.1){const pass=this.bestPass(p);p.state=pass&&!pass.blocked?'THROW':'KICK';m.pass(p,p.state==='THROW'?'pass':'long',.75,{x:dir,y:0},pass?.player);p.heldTime=0;}return;}
   let tx=gx+dir*B.clamp(Math.abs(b.x-gx)*.055,0,35),ty=B.clamp((F.cy)+(b.y-(F.cy))*.27,(F.cy-54),(F.cy+54));p.state=danger?'TRACK_BALL':'POSITION';
   const incoming=!b.owner&&b.vx*dir< -60&&Math.abs(b.x-gx)<220;
   if(danger&&!b.owner&&!incoming&&b.z<24&&Math.abs(b.x-gx)<100&&Math.abs(b.y-(F.cy))<140){p.state='COME_OUT';tx=b.x;ty=b.y;}
   if(incoming){
    p.keeperReaction=(p.keeperReaction??0)+dt;
    if(p.keeperReaction>=cfg.reaction*.45){const arrival=B.clamp((p.x-b.x)/(b.vx||1),0,cfg.keeper);ty=B.clamp(b.y+b.vy*arrival,(F.cy-77),(F.cy+77));p.state='DIVE';if(B.dist(p,b)<40){p.anim='dive';p.animTime=.45;}}
   }else p.keeperReaction=0;
   this.moveTo(p,tx,ty,danger,dt);const near=B.dist(p,b);
   if(b.owner&&b.owner.team===t)return;
   if(near<(p.state==='DIVE'?15+p.attributes.reflexes*.11:15)&&b.z<38&&b.lock<.08&&Math.abs(p.x-gx)<175&&Math.abs(p.y-(F.cy))<200){
    b.shot=null;const speed=Math.hypot(b.vx,b.vy);
    if(b.z<22&&speed<235+p.attributes.goalkeeping){b.owner=p;b.lastTouch=p;b.vx*=.12;b.vy*=.12;b.z=0;b.vz=0;p.state='CATCH';p.anim='catch';p.animTime=.45;b.impact('save');p.heldTime=0;b.pass=null;}
    else{b.vx=dir*(90+m.random()*110);b.vy=(b.y>p.y?1:-1)*(110+m.random()*160);b.vz=30;b.owner=null;b.lastTouch=p;b.pass=null;b.lock=.3;p.state='PARRY';p.anim='dive';p.animTime=.6;b.spin=(b.vy>0?1:-1)*2;b.impact('save');}
    m.sound.play('save');
   }
  }
 };
})();
