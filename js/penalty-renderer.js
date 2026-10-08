'use strict';
(() => {
 const B=window.BSS,R=B.Renderer.prototype;
 R.penaltyPoint=function(x,y,z=0){const depth=(x-940)/110;return {x:192+(y-340)*(1.15+.55*depth),y:83+depth*78-z*1.7};};
 R.penaltyPerson=function(player,x,y,scale,rear=false,lean=0,arms=0){
  const g=this.ctx,kit=player.role==='GK'?player.team.data.kit.goalkeeper:player.team.kit;
  const skin=['#edbc8c','#ca8b5e','#935c3d','#603d2f'][B.hash(player.id)%4];
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale*(rear&&arms<0?.7:1));g.rotate(lean);
  this.rect(-7,-11,5,10,kit.socksColor);this.rect(3,-11,5,10,kit.socksColor);
  this.rect(-9,-2,7,3,'#17252a');this.rect(3,-2,8,3,'#17252a');
  this.rect(-8,-17,17,8,kit.shortsColor);this.rect(-9,-31,19,16,kit.shirtBaseColor);
  if(kit.pattern==='STRIPES_HORIZONTAL'){this.rect(-9,-27,19,3,kit.shirtSecondaryColor);this.rect(-9,-21,19,3,kit.shirtSecondaryColor);}
  else if(kit.pattern==='STRIPES_VERTICAL'){this.rect(-5,-31,3,16,kit.shirtSecondaryColor);this.rect(3,-31,3,16,kit.shirtSecondaryColor);}
  else this.rect(-9,-30,19,3,kit.shirtSecondaryColor);
  const ay=-27-arms*8;
  this.rect(-14,ay,5,12,kit.shirtBaseColor);this.rect(10,ay,5,12,kit.shirtBaseColor);
  this.rect(-15,ay+10,6,5,player.role==='GK'?'#e7e8ce':skin);this.rect(10,ay+10,6,5,player.role==='GK'?'#e7e8ce':skin);
  this.rect(-5,-41,11,11,skin);this.rect(-6,-42,12,4,'#24282c');
  if(rear){this.rect(-6,-39,12,5,'#24282c');this.text(String(player.shirtNumber||1),0,-20,'#fff3d1',7,'center');}
  else{this.rect(-3,-36,2,2,'#17252a');this.rect(3,-36,2,2,'#17252a');}
  g.restore();
 };
 R.penaltyScene=function(m){
  const p=m.penalty,g=this.ctx,shooting=p.side===m.human;
  this.rect(-48,-15,480,270,'#1c543d');
  for(let i=0;i<9;i++)this.rect(-48,38+i*20,480,20,i%2?'#32874b':'#2d7e46');
  this.poly([{x:91,y:46},{x:293,y:46},{x:370,y:205},{x:14,y:205}],null,'#b2cf8e');
  this.poly([{x:130,y:44},{x:254,y:44},{x:301,y:163},{x:83,y:163}],null,'#b2cf8e');
  g.strokeStyle='#b2cf8e';g.beginPath();g.ellipse(192,49,46,10,0,0,Math.PI);g.stroke();
  this.rect(190,82,4,2,'#e8e7c2');
  // Fixed camera behind the net, as in PK mode, shared by every penalty.
  const kicker=this.penaltyPoint(p.taker.x,p.taker.y);
  this.penaltyPerson(p.taker,kicker.x+(p.fake>0?p.fakeDirection*3:0),kicker.y,.65,false,p.fake>0?p.fakeDirection*.14:0,p.fake>0?1:0);
  const keeper=this.penaltyPoint(1038,340+p.keeperOffset),d=p.dive;
  const recovery=p.phase==='result'?B.clamp((p.time-.65)/.8,0,1):0;const lift=d?Math.sin(Math.min(1,d.time/.7)*Math.PI)*(d.height>.5?16:5):0;
  this.rect(keeper.x-15,keeper.y,30,3,'#1d563d');
  this.penaltyPerson(p.keeper,keeper.x,keeper.y-lift,1,true,d?d.x*Math.min(1,d.time/.25)*1.1*(1-recovery):0,d?((d.height<.2&&d.x===0)?-1:1+d.height*1.8)*(1-recovery):0);
  const b=m.ball;this.drawLiveBall(b,this.penaltyPoint.bind(this),6+B.clamp((b.x-940)/110,0,1)*4);
  // Transparent net is drawn last; the ball and keeper remain legible through it.
  const top=92,bottom=163,left=91,right=293;
  g.lineWidth=1;g.strokeStyle='#d7e5c04d';g.beginPath();
  for(let i=0;i<=16;i++){const x=left+(right-left)*i/16,wave=(b.net?.ripple||0)*Math.sin(i*.9-p.elapsed*25)*4;g.moveTo(x,top);g.quadraticCurveTo(x+wave,143,71+242*i/16,191);}
  for(let i=0;i<=11;i++){const t=i/11;g.moveTo(B.lerp(left,71,t),B.lerp(top,191,t));g.lineTo(B.lerp(right,313,t),B.lerp(top,191,t));}g.stroke();
  g.strokeStyle='#f1ebcf';g.lineWidth=3;g.beginPath();g.moveTo(left,bottom);g.lineTo(left,top);g.lineTo(right,top);g.lineTo(right,bottom);g.stroke();g.lineWidth=1;
  this.poly([{x:left,y:top},{x:71,y:120},{x:71,y:191},{x:left,y:bottom}],null,'#bccfab');
  this.poly([{x:right,y:top},{x:313,y:120},{x:313,y:191},{x:right,y:bottom}],null,'#bccfab');
  this.rect(-48,-15,480,52,'#10262b');
  for(let side=0;side<2;side++){
   const x=side?255:12,t=m.teams[side];this.rect(x,8,4,20,t.data.primaryColor);
   this.text(t.data.shortName,x+10,18,'#eeecd0',10);
   const score=p.shootout?m.penalties.scores[side]:t.score;this.text(String(score),x+104,20,'#efda69',15,'right');
   if(p.shootout){const kicks=m.penalties.kicks[side],start=Math.max(0,kicks.length-4);for(let i=0;i<5;i++){const v=kicks[start+i];this.rect(x+11+i*14,26,9,4,v===true?'#e9d465':v===false?'#e17a64':'#536e64');}}
  }
  this.text(p.shootout?'PÊNALTIS':`${m.minute}'  PÊNALTI`,192,15,'#b7cc9d',8,'center');
  this.text(shooting?'SUA COBRANÇA':'SUA DEFESA',192,29,'#f1dc76',7,'center');
  const name=shooting?p.taker.name:p.keeper.name;this.text(name.toUpperCase(),192,202,'#f2eed0',8,'center');
  this.rect(-48,209,480,46,'#10262b');
  const bindings=B.app?.input.bindings||B.KEY_PRESETS?.classic||{pass:'KeyZ',shoot:'KeyX',long:'KeyC',context:'KeyD'};
  const key=a=>B.app?.input.gamepadName?({pass:'X/□',shoot:'A/×',long:'B/○',context:'Y/△'}[a]):bindings[a].replace('Key','').replace('Digit','').replace('Arrow','');
  if(shooting){this.text(`${key('pass')} FRACO   ${key('shoot')} MÉDIO   ${key('long')} FORTE`,192,220,'#f0e4b5',8,'center');this.text(`DIREÇÃO + BOTÃO · ${key('context')} + DIREÇÃO: FINTA · ESC PAUSA`,192,233,'#9fbba3',6,'center');}
  else{this.text(`DIREÇÃO + ${key('shoot')} OU ${key('long')} PARA DEFENDER`,192,220,'#f0e4b5',8,'center');this.text('CIMA: SALTAR · BAIXO: ABAIXAR · ESC PAUSA',192,233,'#9fbba3',6,'center');}
  if(p.phase==='result'){this.rect(108,56,168,26,'#10262bee');this.text(p.resultText||'',192,74,p.goal?'#f1df70':'#e9e6cf',14,'center');}
 };
})();
