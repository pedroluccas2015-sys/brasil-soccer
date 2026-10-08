'use strict';
module.exports=async(page,assert)=>{
 const result=await page.evaluate(()=>{
  const m=BSS.app.match,p=m.teams[0].players[9],r=new BSS.Renderer(document.createElement('canvas'));
  p.anim='run';p.runTime=2;
  const directions=Array.from({length:8},(_,i)=>{p.facing={x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)};return r.sprite(p).toDataURL();});
  p.facing={x:1,y:0};const frames=Array.from({length:8},(_,i)=>{p.runTime=i;return r.sprite(p).toDataURL();});
  const actions=['receive','kick','long','header','bicycle','slide','fall','dive'].map(anim=>{p.anim=anim;p.animTime=.3;const first=r.sprite(p).toDataURL();p.animTime=.08;return {anim,changes:first!==r.sprite(p).toDataURL()};});
  const kit=p.team.kit;p.anim='idle';const before=r.sprite(p).toDataURL();p.team.kit={...kit,socksColor:'#ff00ff'};const after=r.sprite(p).toDataURL();p.team.kit=kit;
  return {directions:new Set(directions).size,frames:new Set(frames).size,actions,socks:before!==after};
 });
 assert.equal(result.directions,8);assert.ok(result.frames>=6);assert.ok(result.socks);
 for(const a of result.actions.filter(a=>['kick','long','header','bicycle','slide','fall'].includes(a.anim)))assert.ok(a.changes,a.anim+' should animate');
 console.log('Match visuals PASS: oito direções, ciclo de corrida, ações e cache de meias.');
};
