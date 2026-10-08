'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 B.Physics={
  ball(b,dt){b.px=b.x;b.py=b.y;b.pz=b.z;const vx=b.vx;b.vx+=-b.vy*b.spin*dt;b.vy+=vx*b.spin*dt;b.spin*=Math.exp(-dt*1.5);b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
   if(b.pz>0||b.vz!==0){b.z-=87.5*dt*dt;b.vz-=175*dt;if(b.z<0){b.z=0;if(Math.abs(b.vz)>12)b.impact?.('bounce',Math.abs(b.vz)/100);b.vz=-b.vz*.46;if(b.vz<8)b.vz=0;b.vx*=.86;b.vy*=.86;}}else{b.z=0;b.vz=0;}
   const drag=Math.exp(-(b.z>.1?.13:1.05)*dt);b.vx*=drag;b.vy*=drag;if(Math.hypot(b.vx,b.vy)<1){b.vx=0;b.vy=0;}
  },
  players(players){for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j];if(a.red||b.red)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=a.radius+b.radius;if(d<r){if(d<.01){dx=1;dy=0;d=1;}const push=(r-d)*.34;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}}},
  offsideLine(defenders,dir){const xs=defenders.filter(p=>!p.red).map(p=>p.x).sort((a,b)=>dir*(b-a));return xs[Math.min(1,xs.length-1)]??(dir>0?(F.w):0);},
  isOffside(p,ball,line,dir){return dir*(p.x-(F.cx))>0&&dir*(p.x-ball.x)>2&&dir*(p.x-line)>2;},
  lineDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y;const t=B.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
 };
})();
