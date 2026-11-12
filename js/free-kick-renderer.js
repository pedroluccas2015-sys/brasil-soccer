'use strict';
(() => {
 const B=window.BSS,F=B.FIELD,R=B.Renderer.prototype;
 B.SetPieceCamera=class {
  constructor(f){this.goalX=f.goal.x;this.dir=f.dir;this.goalY=70;const ballDepth=Math.max(6,this.dir*(this.goalX-f.origin.x));this.maxDepth=f.corner?420:Math.max(360,ballDepth+90);this.distance=this.maxDepth+480;
   const lateral=Math.max(224,Math.abs(f.origin.y-F.cy)+28),atBall=1-ballDepth/this.distance;this.base=Math.min(f.corner?.43:.78,205*atBall/lateral);
   const focusDepth=f.corner?300:Math.max(155,ballDepth+24),scale=this.base/(1-focusDepth/this.distance);this.vertical=(178-this.goalY)/(focusDepth*scale);
  }
  project(x,y,z=0){const depth=this.dir*(this.goalX-x),scale=this.base/Math.max(.18,1-depth/this.distance);return {x:192+(y-F.cy)*this.dir*scale,y:this.goalY+depth*scale*this.vertical-z*scale,scale,depth};}
  facing(n){return {x:n.y*this.dir,y:-n.x*this.dir};}
  visible(x,y){const depth=this.dir*(this.goalX-x);return depth>=-35&&depth<=this.maxDepth&&y>=-35&&y<=F.h+35;}
 };
 R.freeKickCamera=function(f){return new B.SetPieceCamera(f);};
 R.freeKickScene=function(m){
  const f=m.freeKick,g=this.ctx,view=this.freeKickCamera(f),project=view.project.bind(view),gx=f.goal.x,dir=f.dir;
  const stroke=(points,color='#dde4c2',width=1)=>{if(points.length<2)return;g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();g.lineWidth=1;};
  const line=(a,b,color='#dde4c2')=>stroke([a,b],color),ground=(depth,y,z=0)=>project(gx-dir*depth,y,z);
  this.rect(-48,-15,480,270,'#1a3031');this.rect(-48,15,480,29,'#344746');
  for(let i=0;i<96;i++)this.rect(-48+i*5,22+i%3*5,2,3,['#c4c393','#799893','#ddbb81'][i%3]);
  this.poly([ground(-35,0),ground(-35,F.h),ground(view.maxDepth,F.h),ground(view.maxDepth,0)],'#2d7347');
  for(let depth=0,i=0;depth<view.maxDepth;depth+=35,i++)this.poly([ground(depth,0),ground(depth,F.h),ground(Math.min(depth+35,view.maxDepth),F.h),ground(Math.min(depth+35,view.maxDepth),0)],i%2?'#39884e':'#337e48');
  // Goal line stays horizontal, centered on the posts, even at either corner flag.
  line(ground(0,0),ground(0,F.h));line(ground(0,0),ground(view.maxDepth,0));line(ground(0,F.h),ground(view.maxDepth,F.h));
  const markings=B.pitchMarkings(gx,dir);for(const points of markings.lines)stroke(points.map(q=>project(q.x,q.y)));
  const spot=project(markings.spot.x,markings.spot.y);g.fillStyle='#ecedcf';g.beginPath();g.ellipse(spot.x,spot.y,Math.max(1,view.base*2),Math.max(.7,view.base),0,0,Math.PI*2);g.fill();
  // A proper net cage is behind the goal line; the playing area is in front of it.
  const left=F.goalTop,right=F.goalBottom,h=F.goalHeight,a=ground(0,left,h),b=ground(0,right,h),c=ground(0,right),d=ground(0,left),e=ground(-27,left,h),j=ground(-27,right,h),k=ground(-27,right),l=ground(-27,left);
  this.poly([a,b,j,e],'#d6e1cc1a');this.poly([e,j,k,l],'#d6e1cc12');this.poly([a,e,l,d],'#d6e1cc12');this.poly([b,j,k,c],'#d6e1cc12');
  for(let i=0;i<=10;i++){const y=B.lerp(left,right,i/10);stroke([ground(0,y,h),ground(-27,y,h),ground(-27,y)],'#cbd9be65');}
  for(let i=0;i<=5;i++){const z=h*i/5;line(ground(-27,left,z),ground(-27,right,z),'#cbd9be65');line(ground(0,left,z),ground(-27,left,z),'#cbd9be65');line(ground(0,right,z),ground(-27,right,z),'#cbd9be65');}
  for(const y of [0,F.h]){const flag=ground(0,y);this.rect(flag.x,flag.y-12,1,12,'#ece7c7');this.rect(flag.x+1,flag.y-12,5,3,'#e8d35a');}
  for(const bit of m.turf||[])if(view.visible(bit.x,bit.y))this.turf(bit,project,project(bit.x,bit.y).scale);
  const figures=m.players.filter(p=>!p.red&&view.visible(p.x,p.y)).map(p=>({p,...project(p.x,p.y)})).filter(v=>v.x>-80&&v.x<465).sort((a,b)=>a.depth-b.depth);
  for(const v of figures){const p=v.p,jump=f.wall.includes(p)?f.jump():0,point=project(p.x,p.y,jump),scale=B.clamp(v.scale,.25,1.7);
   g.fillStyle='#173e3970';g.beginPath();g.ellipse(point.x,point.y,7*scale,2.5*scale,0,0,Math.PI*2);g.fill();
   const facing=view.facing(p.facing),slideDirection=p.slideDirection?view.facing(p.slideDirection):null,sprite=this.sprite({...p,facing,slideDirection}),modelScale=scale*(sprite.modelScale??1);
   g.drawImage(sprite,Math.round(point.x-(sprite.anchorX??14)*modelScale),Math.round(point.y-(sprite.anchorY??27)*modelScale),Math.round(sprite.width*modelScale),Math.round(sprite.height*modelScale));
  }
  if(['aim','power','curve'].includes(f.phase)){
   const shot=f.trajectory(),o=f.origin,ghost={x:o.x,y:o.y,z:1,...shot};for(let i=0;i<15;i++){B.Physics.ball(ghost,.025);ghost.z-=(shot.gravity-175)*.5*.025*.025;ghost.vz-=(shot.gravity-175)*.025;if(i%2===0){const pt=project(ghost.x,ghost.y,ghost.z);this.rect(pt.x-1,pt.y-1,2,2,'#efdc8f');}}
   const aim=f.corner||f.deliveryMode==='cross'?project(f.cornerTarget().x,f.cornerTarget().y,9+f.height*25):project(gx,F.cy+f.aim*65*dir,3+f.height*38);g.strokeStyle='#fff0a1';g.lineWidth=1;g.beginPath();g.arc(aim.x,aim.y,5,0,Math.PI*2);g.stroke();line({x:aim.x-8,y:aim.y},{x:aim.x+8,y:aim.y},'#fff0a1');line({x:aim.x,y:aim.y-8},{x:aim.x,y:aim.y+8},'#fff0a1');
  }
  const ball=m.ball,bp=project(ball.x,ball.y,ball.z),shadow=project(ball.x,ball.y),size=B.clamp(bp.scale*6,3,12);g.fillStyle='#183a3870';g.beginPath();g.ellipse(shadow.x,shadow.y,size*.55,size*.2,0,0,Math.PI*2);g.fill();g.drawImage(this.ballFrame(ball.roll),Math.round(bp.x-size/2),Math.round(bp.y-size),Math.round(size),Math.round(size));
  stroke([d,a,b,c],'#fff2d5',2);
  this.rect(-36,-7,456,22,'#10272aee');this.text(f.corner?'ESCANTEIO':f.deliveryMode==='cross'?'FALTA · CRUZAR':'FALTA DIRETA',-27,7,'#f2dd83',9);this.text(m.teams[0].data.shortName+' '+m.teams[0].score+' : '+m.teams[1].score+' '+m.teams[1].data.shortName,192,7,'#f2efd8',8,'center');this.text(f.corner?'5 x 5 NA ÁREA':Math.round(f.distance/10)+' m  |  ESC',409,7,'#cad9b8',7,'right');
  const compact=this.canvas.getBoundingClientRect().height<500,start=compact?84:-20,gap=compact?74:145,width=compact?62:129;
  this.rect(compact?76:-30,196,compact?232:444,52,'#10272af5');
  const labels=['1 MIRA','2 FORÇA '+Math.round(f.power*100)+'%','3 EFEITO'],active=['aim','power','curve'].indexOf(f.phase);
  labels.forEach((label,i)=>{const x=start+i*gap;this.text(label,x,208,i===active?'#ffe47e':'#a9bdb3',compact?6:7);this.rect(x,215,width,4,'#345449');});
  this.rect(start+(B.clamp(f.aim,-1,1)+1)*(width-4)/2,214,4,6,'#ede4a8');
  this.rect(start+gap,215,width*f.power,4,f.power>.85?'#ed9b66':'#edda76');
  this.rect(start+gap*2+(f.curve+1)*(width-4)/2,214,4,6,'#a3d8d2');
  const cpu=f.side!==m.human||m.autoplay;
  const help=f.phase==='flight'?'BOLA EM JOGO — DISPUTE O REBOTE':f.phase==='runup'?'COBRANÇA...':cpu?'ADVERSÁRIO PREPARANDO A COBRANÇA':f.phase==='aim'?'DIREÇÃO: MIRA · CHUTE: DIRETO · C: CRUZAR · PASSE: CURTA':f.phase==='power'?'CHUTE: TRAVA A FORÇA NO MOMENTO CERTO':'CHUTE: TRAVA O EFEITO E COBRA';
  if(compact&&!cpu&&active>=0){
   this.text(active===0?'DIRECIONAL: MIRA / ALTURA':active===1?'CHUTE: TRAVA A FORÇA':'CHUTE: TRAVA O EFEITO',192,231,'#e5ebd1',6,'center');
   this.text(active===0?'CHUTE: CONFIRMA · PASSE: CURTA':active===1?'CONFIRME NO MOMENTO CERTO':'E EXECUTA A COBRANÇA',192,242,'#e5ebd1',6,'center');
  }else this.text(help,192,237,'#e5ebd1',compact?5:6,'center');
 };
})();
