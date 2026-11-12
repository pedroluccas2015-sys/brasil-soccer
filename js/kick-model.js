'use strict';
(() => {
 const B=window.BSS,ground=[];
 B.KickModel=Object.freeze({
  chargeTime:.85,
  power(seconds){return B.clamp(seconds/this.chargeTime,.08,1);},
  // Solve against the same drag, gravity and bounce integration as the match.
  travel(time,lift){
   // A lofted delivery stays airborne until its intended receiver. Ground drag
   // includes the initial bounce; cache its unit response once for every pass.
   if(lift>0)return (1-Math.exp(-.13*time))/.13;
   if(!ground.length){const ball={x:0,y:0,z:1,vx:10000,vy:0,vz:0,spin:0};ground.push(0);for(let i=1;i<=541;i++){B.Physics.ball(ball,1/120);ground.push(ball.x/10000);}}
   const at=B.clamp(time*120,0,540),i=Math.floor(at);return B.lerp(ground[i],ground[i+1],at-i);
  },
  delivery(distance,power,loft){
   power=B.clamp(power,0,1);
   const desired=loft?310+power*230:365+power*280;
   let lo=.12,hi=loft?3:4.5;
   for(let i=0;i<14;i++){
    const t=(lo+hi)/2,lift=loft?175*t/2:0;
    if(desired*this.travel(t,lift)<Math.max(8,distance-12))lo=t;else hi=t;
   }
   const time=(lo+hi)/2,lift=loft?175*time/2:0;
   return {time,lift,speed:B.clamp((distance-12)/this.travel(time,lift),120,loft?540:645)};
  },
  shotSpeed(power){return 430+B.clamp(power,0,1)*300;}
 });
})();
