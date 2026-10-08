'use strict';
(() => {
 const B=window.BSS,R=B.Renderer.prototype;
 R.freeKickScene=function(m){
  const f=m.freeKick,g=this.ctx,o=f.origin,fw=f.forward,rt=f.right;
  const project=(x,y,z=0)=>{
   const dx=x-o.x,dy=y-o.y,depth=dx*fw.x+dy*fw.y,lateral=dx*rt.x+dy*rt.y;
   const scale=1.8/(1+Math.max(-40,depth)/175);
   return {x:192+lateral*scale,y:181-depth/(Math.max(-40,depth)+175)*170-z*scale,scale,depth};
  };
  const line=(a,b,color='#d5dfb2')=>{g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();};
  this.rect(-48,-15,480,270,'#163032');this.rect(-48,10,480,35,'#334941');
  for(let i=0;i<96;i++)this.rect(-48+i*5,19+i%3*5,2,3,['#b9c08b','#7d9990','#e4bf82'][i%3]);
  this.rect(-48,43,480,212,'#367e4a');
  for(let depth=0;depth<600;depth+=45){const a=project(o.x+fw.x*depth-rt.x*600,o.y+fw.y*depth-rt.y*600),b=project(o.x+fw.x*(depth+22)-rt.x*600,o.y+fw.y*(depth+22)-rt.y*600),c=project(o.x+fw.x*(depth+22)+rt.x*600,o.y+fw.y*(depth+22)+rt.y*600),d=project(o.x+fw.x*depth+rt.x*600,o.y+fw.y*depth+rt.y*600);this.poly([a,b,c,d],'#39874e');}
  const gx=f.goal.x,dir=f.dir;
  line(project(gx,0),project(gx,680));
  for(const y of [140,540])line(project(gx,y),project(gx-dir*165,y));line(project(gx-dir*165,140),project(gx-dir*165,540));
  for(const y of [245,435])line(project(gx,y),project(gx-dir*55,y));line(project(gx-dir*55,245),project(gx-dir*55,435));
  const a=project(gx,281,40),b=project(gx,399,40),c=project(gx,399),d=project(gx,281),back1=project(gx+dir*23,281),back2=project(gx+dir*23,399);
  this.poly([a,b,back2,back1],'#ccdcca25');
  for(let i=0;i<=8;i++){const t=i/8;line({x:B.lerp(a.x,b.x,t),y:B.lerp(a.y,b.y,t)},{x:B.lerp(back1.x,back2.x,t),y:B.lerp(back1.y,back2.y,t)},'#b6c6a670');}
  for(let i=1;i<=4;i++){const t=i/4;line({x:B.lerp(a.x,back1.x,t),y:B.lerp(a.y,back1.y,t)},{x:B.lerp(b.x,back2.x,t),y:B.lerp(b.y,back2.y,t)},'#b6c6a670');}
  g.lineWidth=2;line(a,b,'#fff3cf');line(a,d,'#fff3cf');line(b,c,'#fff3cf');
  const figures=m.players.map(p=>({p,...project(p.x,p.y)})).filter(v=>!v.p.red&&v.depth>-35&&v.x>-80&&v.x<465).sort((a,b)=>b.depth-a.depth);
  for(const v of figures){
   const p=v.p,jump=f.wall.includes(p)?f.jump():0,scale=B.clamp(v.scale*.72,.6,1.5),point=project(p.x,p.y,jump);
   g.fillStyle='#173e3970';g.beginPath();g.ellipse(v.x,v.y,7*scale,2*scale,0,0,Math.PI*2);g.fill();
   // Convert world facing to the behind-the-ball camera without mutating the player.
   const facing={x:p.facing.x*rt.x+p.facing.y*rt.y,y:-(p.facing.x*fw.x+p.facing.y*fw.y)};
   g.drawImage(this.sprite({...p,facing}),Math.round(point.x-14*scale),Math.round(point.y-27*scale),Math.round(28*scale),Math.round(30*scale));
  }
  if(['aim','power','curve'].includes(f.phase)){
   // Short initial trajectory conveys bend without promising an automatic goal.
   const shot=f.trajectory(),ghost={x:o.x,y:o.y,z:1,...shot};
   for(let i=0;i<15;i++){B.Physics.ball(ghost,.025);ghost.z-=237.5*.025*.025;ghost.vz-=475*.025;if(i%2===0){const pt=project(ghost.x,ghost.y,ghost.z);this.rect(pt.x-1,pt.y-1,2,2,'#e8d97d');}}
   const aim=project(gx,340+f.aim*65*dir,3+f.height*29);g.strokeStyle='#fff0a1';g.lineWidth=1;g.beginPath();g.arc(aim.x,aim.y,5,0,Math.PI*2);g.stroke();line({x:aim.x-8,y:aim.y},{x:aim.x+8,y:aim.y},'#fff0a1');line({x:aim.x,y:aim.y-8},{x:aim.x,y:aim.y+8},'#fff0a1');
  }
  const ball=m.ball,bp=project(ball.x,ball.y,ball.z),ground=project(ball.x,ball.y),size=B.clamp(bp.scale*6,4,14);
  g.fillStyle='#183a3870';g.beginPath();g.ellipse(ground.x,ground.y,size*.55,size*.2,0,0,Math.PI*2);g.fill();g.drawImage(this.ballFrame(ball.roll),Math.round(bp.x-size/2),Math.round(bp.y-size),Math.round(size),Math.round(size));
  this.rect(-36,-7,456,22,'#10272aee');this.text('FALTA DIRETA',-27,7,'#f2dd83',9);this.text(m.teams[0].data.shortName+' '+m.teams[0].score+' : '+m.teams[1].score+' '+m.teams[1].data.shortName,192,7,'#f2efd8',8,'center');this.text(Math.round(f.distance/10)+' m  |  ESC',409,7,'#cad9b8',7,'right');
  const compact=this.canvas.getBoundingClientRect().height<500,start=compact?84:-20,gap=compact?74:145,width=compact?62:129;
  this.rect(compact?76:-30,196,compact?232:444,52,'#10272af5');
  const labels=['1 MIRA','2 FORÇA '+Math.round(f.power*100)+'%','3 EFEITO'],active=['aim','power','curve'].indexOf(f.phase);
  labels.forEach((label,i)=>{const x=start+i*gap;this.text(label,x,208,i===active?'#ffe47e':'#a9bdb3',compact?6:7);this.rect(x,215,width,4,'#345449');});
  this.rect(start+(B.clamp(f.aim,-1,1)+1)*(width-4)/2,214,4,6,'#ede4a8');
  this.rect(start+gap,215,width*f.power,4,f.power>.85?'#ed9b66':'#edda76');
  this.rect(start+gap*2+(f.curve+1)*(width-4)/2,214,4,6,'#a3d8d2');
  const cpu=f.side!==m.human||m.autoplay;
  const help=f.phase==='flight'?'BOLA EM JOGO — DISPUTE O REBOTE':f.phase==='runup'?'COBRANÇA...':cpu?'ADVERSÁRIO PREPARANDO A COBRANÇA':f.phase==='aim'?'DIRECIONAL: MIRA / ALTURA · CHUTE: CONFIRMA · PASSE: CURTA':f.phase==='power'?'CHUTE: TRAVA A FORÇA NO MOMENTO CERTO':'CHUTE: TRAVA O EFEITO E COBRA';
  if(compact&&!cpu&&active>=0){
   this.text(active===0?'DIRECIONAL: MIRA / ALTURA':active===1?'CHUTE: TRAVA A FORÇA':'CHUTE: TRAVA O EFEITO',192,231,'#e5ebd1',6,'center');
   this.text(active===0?'CHUTE: CONFIRMA · PASSE: CURTA':active===1?'CONFIRME NO MOMENTO CERTO':'E EXECUTA A COBRANÇA',192,242,'#e5ebd1',6,'center');
  }else this.text(help,192,237,'#e5ebd1',compact?5:6,'center');
 };
})();
