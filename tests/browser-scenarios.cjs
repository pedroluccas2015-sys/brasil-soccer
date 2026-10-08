'use strict';
module.exports=async function(page,assert){
 // Deterministic fixtures exercise rare rules through the same running browser engine.
 const rules=await page.evaluate(()=>{
  const B=BSS,app=B.app,result={};app.paused=true;
  const make=()=>new B.Match(app.data.teams[0],app.data.teams[1],{seed:314});
  let m=make();m.state='play';const p=m.teams[0].players[9];p.x=960;p.y=370;p.facing={x:1,y:0};m.teams[1].players[0].y=270;m.ball.reset(p.x+10,p.y);m.ball.owner=p;m.shoot(p,.8,{x:1,y:0});for(let i=0;i<120&&m.state==='play';i++){m.ball.update(1/60);m.boundaries();}result.shotGoal=m.teams[0].score===1;
  m=make();m.state='play';const g=m.teams[1].players[0];g.x=1034;g.y=340;m.ball.reset(1028,340);m.ball.vx=220;m.ai.keeper(g,1/60);result.keeper=m.ball.owner===g||g.state==='PARRY';
  for(const [type,x,y] of [['LATERAL',500,5],['ESCANTEIO',1044,5],['TIRO DE META',53,340],['FALTA',780,320]]){m=make();m.setRestart(type,0,x,y);m.timer=0;m.pass(m.restart.taker,type==='ESCANTEIO'?'long':'pass',.6,{x:1,y:.2});result[type]=m.state==='play'&&Math.hypot(m.ball.vx,m.ball.vy)>100;}
  m=make();m.state='play';const offender=m.teams[0].players[1],victim=m.teams[1].players[9];offender.x=105;offender.y=340;offender.vx=100;victim.x=123;victim.y=340;victim.facing={x:1,y:0};m.ball.reset(700,500);m.tackle(offender,true);result.penaltyFoul=m.state==='penalty';
  m=make();m.state='play';const receiver=m.teams[0].players[10];receiver.x=980;receiver.y=340;m.pendingOffside=[receiver];m.ball.reset(980,340);m.touchBall(1/60);result.offside=m.restart?.type==='IMPEDIMENTO';
  const c=new B.CompetitionManager();c.create('cup','flamengo',app.data.teams);while(!c.current.complete)c.completeRound();result.cup=c.current.round===3&&!!c.current.champion;
  return result;
 });for(const [rule,passed] of Object.entries(rules))assert.equal(passed,true,rule);
 // Simulated Gamepad API: validate mappings without claiming a physical-controller test.
 const pad=await page.evaluate(()=>{const input=BSS.app.input,original=navigator.getGamepads;BSS.app.match.state="play";const buttons=Array.from({length:16},()=>({pressed:false,value:0}));buttons[5].pressed=true;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{id:'Test standard pad',mapping:'standard',axes:[1,0],buttons}]});input.clear();input.poll(1/60);buttons[0].pressed=true;input.poll(1/60);const first=input.pressed.pass&&input.state.sprint&&input.axis.x===1;buttons[0].pressed=false;input.poll(1/60);const released=input.released.pass;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:original});input.clear();return first&&released;});assert.ok(pad);
 console.log('Browser scenarios PASS:',Object.keys(rules).join(', '),'e Gamepad API simulada.');
};
