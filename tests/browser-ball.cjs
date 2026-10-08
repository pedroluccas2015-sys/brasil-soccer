'use strict';
module.exports=async function(page,assert){
 const result=await page.evaluate(()=>{
  const F=BSS.FIELD,app=BSS.app,r=app.renderer;app.paused=true;
  const atlas=document.createElement('canvas');atlas.width=960;atlas.height=570;const g=atlas.getContext('2d');g.fillStyle='#11282b';g.fillRect(0,0,960,570);
  const capture=(m,i,title)=>{r.render(m,1/60);g.drawImage(r.canvas,(i%2)*480,Math.floor(i/2)*285+15);g.fillStyle='#efe8c4';g.font='11px monospace';g.fillText(title,(i%2)*480+8,Math.floor(i/2)*285+12);};
  let m=new BSS.Match(app.data.teams[0],app.data.teams[1],{human:1,seed:26});m.setupPenalty(0,false);m.penalty.aim=.88;m.penalty.height=.88;m.kickPenalty(.6);
  for(let i=0;i<40;i++)m.update(1/60);capture(m,0,'TRAJETORIA / GIRO');
  while(m.penalty.phase!=='result')m.update(1/60);for(let i=0;i<7;i++)m.update(1/60);capture(m,1,'GOL / IMPACTO NA REDE');
  m=new BSS.Match(app.data.teams[0],app.data.teams[1],{human:1,seed:26});m.setupPenalty(0,false);m.penalty.aim=.88;m.penalty.height=.88;m.kickPenalty(.6);
  for(let i=0;i<100&&m.penalty.phase!=='result';i++){if(m.penalty.phase==='flight'&&m.penalty.time>.05&&!m.penalty.dive)m.penalty.startDive(1,.88);m.update(1/60);}
  for(let i=0;i<8;i++)m.update(1/60);capture(m,2,'DEFESA / ESPALMADA');
  m=new BSS.Match(app.data.teams[0],app.data.teams[1],{seed:26});m.state='play';Object.assign(m.ball,{x:F.w+2,px:F.w-3,y:F.cy,py:F.cy,z:14,pz:14,vx:350,vz:5});m.boundaries();for(let i=0;i<8;i++)m.update(1/60);r.camera.x=F.w-40;r.camera.y=F.cy;capture(m,3,'PARTIDA / BOLA NA REDE');
  return {image:atlas.toDataURL('image/png'),distinct:r.ballFrame(0).toDataURL()!==r.ballFrame(1).toDataURL(),cached:r.ballFrame(0)===r.ballFrame(0)};
 });
 assert.ok(result.distinct);assert.ok(result.cached);
 require('node:fs').writeFileSync('tests/ball-animation.png',Buffer.from(result.image.split(',')[1],'base64'));
 console.log('Ball visuals PASS: giro em frames distintos, cache e cenas de voo/rede/defesa/partida.');
};
