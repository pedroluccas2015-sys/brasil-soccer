'use strict';
(() => {
 const B=window.BSS;
 B.AIController=class {
  constructor(match){this.m=match;}
  update(dt){const m=this.m,b=m.ball;for(const team of m.teams){const list=team.players.filter(p=>!p.red&&p.role!=='GK').sort((a,c)=>B.dist(a,b)-B.dist(c,b)),chaser=list[0],second=list[1],own=b.owner?.team===team;
   for(const p of team.players){if(p.red||p===m.controlled&&!m.autoplay)continue;if(p.role==='GK'){this.keeper(p,dt);continue;}let tx=p.home.x,ty=p.home.y,sprint=false;const near=B.dist(p,b),dir=team.dir,difficulty=team.side===m.human?2:m.difficulty;
    if(b.owner===p){p.state='DRIBBLE';const gx=dir>0?1050:0,goalDist=Math.abs(gx-p.x);p.heldTime+=dt;tx=gx;ty=B.lerp(p.y,340,.65);sprint=goalDist>240;
     const pressure=m.teams[1-team.side].players.some(o=>!o.red&&B.dist(o,p)<38);if(p.decision<=0&&p.touchDelay===0){p.decision=[1.2,.8,.48,.3][difficulty];if(goalDist<235&&Math.abs(p.y-340)<190){p.state='SHOOT';m.shoot(p,.4+m.random()*.45,{x:dir,y:0});}else if(pressure||p.heldTime>2.2||m.random()<.14){p.state='PASS';m.pass(p,m.random()<.18?'long':'pass',.4,{x:dir,y:0});p.heldTime=0;}}
    }else if(p===chaser&&(!own||near<65)){p.state=b.owner?'PRESS':'CHASE';tx=b.x+b.vx*.13;ty=b.y+b.vy*.13;sprint=near>40;if(b.owner&&b.owner.team!==team&&near<20&&p.actionCooldown===0&&m.random()<dt*[.35,.7,1.2,1.7][difficulty])m.tackle(p,false);}
    else if(p===second&&!own&&team.tactics.pressure==='Alta'){p.state='INTERCEPT';tx=b.x+dir*35;ty=b.y+(p.y>b.y?38:-38);}
    else if(b.pass?.target===p){p.state='RECEIVE';tx=b.x+b.vx*.25;ty=b.y+b.vy*.25;}
    else{const phase=own?1:-1,mental=team.tactics.mentality==='Ofensiva'?55:team.tactics.mentality==='Defensiva'?-55:0;const line=team.tactics.line==='Alta'?65:team.tactics.line==='Baixa'?-65:0;tx=p.home.x+(b.x-525)*.4+dir*(phase*38+mental+(p.role==='DF'?line:0));ty=p.home.y+(b.y-340)*.3;if(own){p.state=p.role==='FW'?'RUN_FORWARD':'SUPPORT';ty=340+(ty-340)*1.12;if(team.tactics.attack==='Contra-ataque'&&p.role==='FW')tx+=dir*90;if(team.tactics.attack==='Posse')tx-=dir*25;}else{p.state='MARK';ty=340+(ty-340)*.83;const opp=m.teams[1-team.side].players.filter(o=>o.role!=='GK'&&!o.red).sort((a,c)=>B.dist(a,p)-B.dist(c,p))[0];if(opp&&B.dist(opp,p)<90){tx=B.lerp(tx,opp.x-dir*15,.5);ty=B.lerp(ty,opp.y,.5);}}tx=B.clamp(tx,50,1000);ty=B.clamp(ty,30,650);}
    if(m.mode==='training'&&team.side!==m.human){tx=p.home.x;ty=p.home.y;p.state='FORMATION';}p.move(tx-p.x,ty-p.y,sprint,dt);
   }
  }}
  keeper(p,dt){const m=this.m,b=m.ball,t=p.team,dir=t.dir,gx=dir>0?18:1032,near=B.dist(p,b),danger=Math.abs(b.x-gx)<235;
   if(b.owner===p){p.state='CATCH';p.heldTime+=dt;p.move(0,0,false,dt);if(p.heldTime>1.1){p.state=m.random()<.5?'THROW':'KICK';m.pass(p,p.state==='THROW'?'pass':'long',.75,{x:dir,y:0});p.heldTime=0;}return;}
   let tx=gx+dir*B.clamp((dir>0?b.x:1050-b.x)*.055,0,35),ty=B.clamp(340+(b.y-340)*.27,286,394);p.state=danger?'TRACK_BALL':'POSITION';
   if(danger&&!b.owner&&b.z<24&&Math.abs(b.x-gx)<100&&Math.abs(b.y-340)<140){p.state='COME_OUT';tx=b.x;ty=b.y;}
   const incoming=b.vx*dir< -60&&Math.abs(b.x-gx)<155;if(incoming){const arrival=(p.x-b.x)/(b.vx||1),future=b.y+b.vy*Math.max(0,arrival);ty=B.clamp(future,263,417);p.state='DIVE';if(near<40){p.anim='dive';p.animTime=.45;}}
   p.move(tx-p.x,ty-p.y,danger,dt);
   if(near<(p.state==='DIVE'?15+p.attributes.reflexes*.11:15)&&b.z<38&&b.lock<.08&&Math.abs(p.x-gx)<175&&Math.abs(p.y-340)<200){if(b.shot&&b.shot.team!==t.side){b.shot=null;}const speed=Math.hypot(b.vx,b.vy);if(b.z<22&&speed<235+p.attributes.goalkeeping){b.owner=p;b.lastTouch=p;b.vx*=.12;b.vy*=.12;b.z=0;b.vz=0;p.state='CATCH';p.anim='catch';p.animTime=.45;b.impact('save');p.heldTime=0;b.pass=null;}else{b.vx=dir*(90+m.random()*110);b.vy=(b.y>p.y?1:-1)*(110+m.random()*160);b.vz=30;b.owner=null;b.lastTouch=p;b.pass=null;b.lock=.3;p.state='PARRY';p.anim='dive';p.animTime=.6;b.spin=(b.vy>0?1:-1)*2;b.impact('save');}m.sound.play('save');}
  }
 };
})();
