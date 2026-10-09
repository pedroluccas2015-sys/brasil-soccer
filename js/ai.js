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
  profile(team){return B.MATCH_DIFFICULTIES[team.side===this.m.human?1:B.clamp(Math.round(this.m.difficulty)||0,0,3)];}
  intercept(p,profile){const b=this.m.ball,t=B.clamp(B.dist(p,b)/150,0,profile.anticipation);return {x:B.clamp(b.x+b.vx*t,8,(F.w-8)),y:B.clamp(b.y+b.vy*t,8,(F.h-8))};}
  plan(team,dt){
   const m=this.m,b=m.ball,cfg=this.profile(team);let plan=this.plans.get(team);
   if(plan&&(plan.time-=dt)>0&&!plan.chaser?.red)return plan;
   const out=team.players.filter(p=>!p.red&&p.role!=='GK');
   const candidates=out.filter(p=>p!==m.controlled||m.autoplay).sort((a,c)=>B.dist(a,this.intercept(a,cfg))-B.dist(c,this.intercept(c,cfg)));
   const rivals=m.teams[1-team.side].players.filter(p=>!p.red&&p.role!=='GK');
   const marks=new Map(),free=new Set(out.filter(p=>p!==candidates[0]));
   const ownGoal={x:team.dir>0?0:(F.w),y:(F.cy)};
   for(const opponent of [...rivals].sort((a,c)=>B.dist(a,ownGoal)-B.dist(c,ownGoal))){
    const defender=[...free].sort((a,c)=>B.dist(a,opponent)-B.dist(c,opponent))[0];
    if(defender){marks.set(defender,opponent);free.delete(defender);}
   }
   plan={time:cfg.reaction,chaser:candidates[0],cover:candidates[1],marks};this.plans.set(team,plan);return plan;
  }
  bestPass(p){
   const m=this.m,team=p.team,cfg=this.profile(team),opps=m.teams[1-team.side].players.filter(q=>!q.red);
   const line=B.Physics.offsideLine(opps,team.dir);
   return team.players.filter(q=>q!==p&&!q.red&&q.role!=='GK'&&B.dist(q,p)>35&&B.dist(q,p)<cfg.vision&&!B.Physics.isOffside(q,m.ball,line,team.dir)).map(q=>{
    const distance=B.dist(q,p),space=Math.min(...opps.map(o=>B.dist(o,q)));
    const blocked=opps.some(o=>B.Physics.lineDistance(o,p,q)<18&&B.dist(o,p)>18);
    const score=(q.x-p.x)*team.dir*.35+Math.min(space,85)-(blocked?105:0)-Math.abs(distance-150)*.12;
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
    const cfg=this.profile(team),plan=this.plan(team,dt),own=b.owner?.team===team,dir=team.dir;
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
       if(goalDist<225&&Math.abs(p.y-(F.cy))<125&&(goalDist<145||!pass||pass.score<75)){
        p.state='SHOOT';const corner=keeper&&keeper.y>=(F.cy)?-.7:.7;m.shoot(p,.4+m.random()*.35,{x:dir,y:corner});
       }else if(pass&&!pass.blocked&&(pressure||p.heldTime>1.8||pass.score>100)){
        p.state='PASS';m.pass(p,pass.distance>245?'long':'pass',.45,{x:pass.player.x-p.x,y:pass.player.y-p.y},pass.player);p.heldTime=0;
       }
      }
     }else if(b.pass?.target===p){
      p.state='RECEIVE';const target=this.intercept(p,cfg);tx=target.x;ty=target.y;sprint=near>50;
     }else if(p===plan.chaser&&!own){
      p.state=b.owner?'PRESS':'CHASE';const target=this.intercept(p,cfg);tx=target.x;ty=target.y;sprint=near>30;
      if(b.owner&&b.owner.team!==team&&near<23&&p.actionCooldown===0){
       const toward=B.norm(b.x-p.x,b.y-p.y),facing=p.facing.x*toward.x+p.facing.y*toward.y;
       if(facing>.25&&m.random()<1-Math.exp(-dt*cfg.tackle))m.tackle(p,false);
      }
     }else if(m.secondPress&&team.side===m.human&&!own&&p===plan.cover){
      // Hold LANÇAR / 2º DEF to send a second nearby outfield defender.
      p.state='SECOND_PRESS';const target=this.intercept(p,cfg);
      tx=target.x;ty=target.y;sprint=near>24;
      if(b.owner&&b.owner.team!==team&&near<23&&p.actionCooldown===0&&
        m.random()<1-Math.exp(-dt*cfg.tackle*.65))m.tackle(p,false);
     }else if(p===plan.cover&&!own&&(team.tactics.pressure==='Alta'||cfg.mark>.6)){
      p.state='COVER';tx=b.x-dir*55;ty=b.y+(p.home.y>(F.cy)?48:-48);
     }else{
      const mental=team.tactics.mentality==='Ofensiva'?55:team.tactics.mentality==='Defensiva'?-55:0;
      const lineShift=team.tactics.line==='Alta'?65:team.tactics.line==='Baixa'?-65:0;
      tx=p.home.x+(b.x-(F.cx))*.42+dir*((own?42:-40)+mental+(p.role==='DF'?lineShift:0));ty=p.home.y+(b.y-(F.cy))*.28;
      if(own){
       p.state=p.role==='FW'?'RUN_FORWARD':'SUPPORT';ty=(F.cy)+(ty-(F.cy))*1.15;
       if(team.tactics.attack==='Contra-ataque'&&p.role==='FW')tx+=dir*80;
       if(team.tactics.attack==='Posse')tx-=dir*25;
       const limit=dir>0?Math.max((F.cx),line,b.x)-8:Math.min((F.cx),line,b.x)+8;
       tx=dir>0?Math.min(tx,limit):Math.max(tx,limit);
       if(b.owner&&B.dist(p,b.owner)<45)ty+=p.home.y>(F.cy)?40:-40;
      }else{
       p.state='MARK';const opponent=plan.marks.get(p);
       if(opponent){tx=B.lerp(tx,opponent.x-dir*22,cfg.mark);ty=B.lerp(ty,opponent.y,cfg.mark);}
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
   if(b.owner===p){p.state='CATCH';p.heldTime+=dt;p.move(0,0,false,dt);if(p.heldTime>(t.side===m.human&&!m.autoplay?2.2:1.1)){const pass=this.bestPass(p);p.state=pass&&!pass.blocked?'THROW':'KICK';m.pass(p,p.state==='THROW'?'pass':'long',.75,{x:dir,y:0},pass?.player);p.heldTime=0;}return;}
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
    if(b.z<22&&speed<235+p.attributes.goalkeeping){b.owner=p;b.lastTouch=p;b.vx*=.12;b.vy*=.12;b.z=0;b.vz=0;p.state='CATCH';p.anim='catch';p.animTime=.45;b.impact('save');p.heldTime=0;b.pass=null;if(t.side===m.human&&!m.autoplay)m.setControlled(p);}
    else{b.vx=dir*(90+m.random()*110);b.vy=(b.y>p.y?1:-1)*(110+m.random()*160);b.vz=30;b.owner=null;b.lastTouch=p;b.pass=null;b.lock=.3;p.state='PARRY';p.anim='dive';p.animTime=.6;b.spin=(b.vy>0?1:-1)*2;b.impact('save');}
    m.sound.play('save');
   }
  }
 };
})();
