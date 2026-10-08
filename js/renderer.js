'use strict';
(() => {
 const B=window.BSS;
 B.Renderer=class {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;this.camera=new B.Camera();this.t=0;this.sprites=new Map();this.crowdSeed=B.rng(2026);this.crowd=Array.from({length:500},()=>({x:this.crowdSeed()*1200-75,y:this.crowdSeed()*75,c:Math.floor(this.crowdSeed()*7)}));}
  rect(x,y,w,h,c){this.ctx.fillStyle=c;this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  fit(menu){
   const host=this.canvas.parentElement,w=host.clientWidth,h=host.clientHeight,key=`${w}:${h}`;
   if(key===this.fitKey)return;this.fitKey=key;
   const scale=Math.min(w/480,h/270);
   Object.assign(this.canvas.style,{width:480*scale+'px',height:270*scale+'px',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});
   // Keep the original scene centered; the wider viewport reveals more field.
   this.ctx.setTransform(1,0,0,1,48,15);
  }
  text(s,x,y,c='#f4f1d9',size=8,align='left'){const g=this.ctx;g.font=`bold ${size}px monospace`;g.textAlign=align;g.fillStyle='#0b1b20';g.fillText(s,Math.round(x)+1,Math.round(y)+1);g.fillStyle=c;g.fillText(s,Math.round(x),Math.round(y));}
  poly(points,color,stroke){const g=this.ctx;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
  worldRect(x,y,w,h,color,stroke){const p=this.camera.project.bind(this.camera);this.poly([p(x,y),p(x+w,y),p(x+w,y+h),p(x,y+h)],color,stroke);}
  line(x1,y1,x2,y2,color='#b4d295'){const a=this.camera.project(x1,y1),b=this.camera.project(x2,y2),g=this.ctx;g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}
  ellipse(x,y,rx,ry,c,fill=false){const p=this.camera.project(x,y),g=this.ctx;g.beginPath();g.ellipse(p.x,p.y,rx*this.camera.zoom,ry*this.camera.zoom*.67,0,0,Math.PI*2);if(fill){g.fillStyle=c;g.fill();}else{g.strokeStyle=c;g.lineWidth=1;g.stroke();}}
  field(m){this.activeBall=m.ball;const g=this.ctx;this.rect(-48,-15,480,270,'#1d3531');this.worldRect(-120,-180,1290,1040,'#1b3237');
   const stadium=m.options.stadium||'day',night=stadium==='night',colors=night?['#bba261','#7c5359','#a8afae','#47847a','#879e62','#a48067','#606380']:['#d5c096','#9d4b42','#b8cbbb','#578176','#dfc651','#b27861','#6399a5'];
   this.worldRect(-75,-120,1200,82,night?'#27303b':'#444949');this.worldRect(-75,720,1200,82,night?'#27303b':'#444949');for(const c of this.crowd){for(const side of [-1,1]){const p=this.camera.project(c.x,side<0?-45-c.y:727+c.y);const bounce=Math.sin(this.t*3+c.x)>.9?1:0;this.rect(p.x,p.y-bounce,2,3,colors[c.c]);this.rect(p.x,p.y-bounce-1,1,1,'#e4c49b');}}
   for(let row=0;row<3;row++){this.line(-80,-50-row*25,1130,-50-row*25,'#152c30');this.line(-80,730+row*25,1130,730+row*25,'#152c30');}
   this.worldRect(-55,-30,1160,20,'#e2d99b');this.worldRect(-55,693,1160,20,'#e2d99b');for(let x=-30;x<1100;x+=155){const a=this.camera.project(x,-15),b=this.camera.project(x,707);this.text(x%310?'JOGA BONITO':'SUPER SOCCER',a.x,a.y,'#243a32',6);this.text('BRASIL 2026',b.x,b.y,'#243a32',6);}
   this.worldRect(-35,-8,1120,696,night?'#23623f':'#31824d');for(let i=0;i<14;i++)this.worldRect(i*75,0,75,680,i%2?(night?'#2b7348':'#398d52'):(night?'#286b43':'#32834b'));
   const line='#acd093';this.worldRect(0,0,1050,680,null,line);this.line(525,0,525,680,line);this.ellipse(525,340,91,91,line);this.ellipse(525,340,2,2,line,true);
   for(const x of [0,1050]){const d=x===0?1:-1;this.worldRect(x,138,d*165,404,null,line);this.worldRect(x,248,d*55,184,null,line);this.ellipse(x+d*110,340,2,2,line,true);const g=this.ctx,p=this.camera.project.bind(this.camera);g.strokeStyle=line;g.beginPath();for(let k=0;k<=24;k++){const angle=-.95+k/24*1.9,pt=p(x+d*(110+Math.cos(angle)*91),340+Math.sin(angle)*91);if(k===0)g.moveTo(pt.x,pt.y);else g.lineTo(pt.x,pt.y);}g.stroke();}
   for(const x of [0,1050])for(const y of [0,680]){const p=this.camera.project(x,y);this.rect(p.x,p.y-8,1,8,'#eeeecc');this.rect(p.x+1,p.y-8,4,3,'#e8d54c');}
   this.goal(0);this.goal(1050);
  }
  goal(x){const d=x===0?-1:1,p=this.camera.project.bind(this.camera),g=this.ctx;const net=this.activeBall?.net,ripple=net?.line===x?net.ripple*Math.sin(net.age*30)*5:0;const a=p(x,281,40),b=p(x,399,40),c=p(x+d*(27+ripple),399,0),e=p(x+d*(27+ripple),281,0);this.poly([a,b,c,e],'#d1dbc529','#bfcdb4');for(let i=0;i<=6;i++){const t=i/6;g.strokeStyle='#c3d1b48a';g.beginPath();g.moveTo(B.lerp(a.x,b.x,t),B.lerp(a.y,b.y,t));g.lineTo(B.lerp(e.x,c.x,t),B.lerp(e.y,c.y,t));g.stroke();}for(let i=1;i<4;i++){const t=i/4;g.beginPath();g.moveTo(B.lerp(a.x,e.x,t),B.lerp(a.y,e.y,t));g.lineTo(B.lerp(b.x,c.x,t),B.lerp(b.y,c.y,t));g.stroke();}const a0=p(x,281),b0=p(x,399);g.strokeStyle='#f1f1d5';g.lineWidth=2;g.beginPath();g.moveTo(a0.x,a0.y);g.lineTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b0.x,b0.y);g.stroke();g.lineWidth=1;}
  sprite(p){
   const kit=p.role==='GK'?p.team.data.kit.goalkeeper:p.team.kit;
   const running=['run','sprint'].includes(p.anim),action=p.animTime>0;
   const duration={fall:.7,dive:.6,receive:.16,dribble:.25,tackle:.22,catch:.45,long:.28}[p.anim]||.42;
   const phase=running?Math.floor(p.runTime)%8:action?Math.min(3,Math.floor(Math.max(0,1-p.animTime/duration)*4)):0;
   const direction=(Math.round(Math.atan2(p.facing.y,p.facing.x)/(Math.PI/4))+8)%8;
   const skin=['#edbc8c','#ca8b5e','#935c3d','#603d2f'][B.hash(p.id)%4];
   const key=[kit.shirtBaseColor,kit.shirtSecondaryColor,kit.shortsColor,kit.socksColor,kit.pattern,skin,p.anim,phase,direction].join('|');
   if(this.sprites.has(key))return this.sprites.get(key);
   const c=document.createElement('canvas');c.width=28;c.height=30;
   const g=c.getContext('2d'),r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);};
   const dir=p.facing.x<0?-1:1,back=direction>=5&&direction<=7,front=direction>=1&&direction<=3;
   const stride=running?[0,1,3,2,0,-1,-3,-2][phase]:0;
   const kick=['kick','long','volley','placed','tackle'].includes(p.anim),slide=['slide','fall','dive'].includes(p.anim);
   const jump=p.anim==='header'?[1,4,5,2][phase]:p.anim==='bicycle'?[1,3,4,1][phase]:0;
   g.save();g.translate(4,4-jump);
   if(slide){g.translate(10,17);g.rotate(dir*(p.anim==='dive'?1.2:.9+phase*.08));g.translate(-10,-17);}
   if(p.anim==='bicycle'){g.translate(10,15);g.rotate(dir*[-.3,-1.2,-2,-.6][phase]);g.translate(-10,-15);}
   if(running){g.translate(dir*(p.anim==='sprint'?1:0),phase%4===1?-1:0);}
   if(p.anim==='receive')g.translate(0,1);
   const headTurn=[1,1,0,-1,-1,-1,0,1][direction];
   g.save();g.translate(headTurn,0);
   r(7,2,6,2,'#182427');r(6,4,7,5,skin);r(back?6:dir>0?6:11,4,2,3,'#332a25');
   if(back)r(6,4,7,3,'#332a25');else if(front){r(7,5,1,1,'#182427');r(11,5,1,1,'#182427');}else r(dir>0?12:6,5,1,1,'#182427');
   g.restore();r(7,9,6,7,kit.shirtBaseColor);
   const sec=kit.shirtSecondaryColor;
   if(kit.pattern==='STRIPES_HORIZONTAL'){r(7,10,6,2,sec);r(7,14,6,1,sec);}
   else if(kit.pattern==='STRIPES_VERTICAL'){r(8,9,1,7,sec);r(11,9,1,7,sec);}
   else if(kit.pattern==='SASH'){r(11,9,2,2,sec);r(9,11,2,2,sec);r(7,13,2,2,sec);}
   else if(kit.pattern==='HALVES')r(10,9,3,7,sec);else r(7,9,6,1,sec);
   if(back)r(9,11,2,3,'#eee9d1');
   const raised=['celebrate','catch','header','dive'].includes(p.anim),arm=running?Math.sign(stride)*2:0;
   r(5,raised?7:10+arm,2,4,kit.shirtBaseColor);r(13,raised?7:10-arm,2,4,kit.shirtBaseColor);
   r(5,raised?5:14+arm,2,3,p.role==='GK'?'#eee9d1':skin);r(13,raised?5:14-arm,2,3,p.role==='GK'?'#eee9d1':skin);
   r(7,16,6,3,kit.shortsColor);
   const step=direction===2||direction===6?Math.sign(stride):stride;
   const extension=kick?[-2,1,5,2][phase]*dir:p.anim==='dribble'?dir*3:0;
   r(7-step,19,2,3,kit.socksColor);r(11+step+extension,19-(kick&&phase===2?2:0),2,3,kit.socksColor);
   r(6-step,22,3,1,'#14222b');r(11+step+extension,22-(kick&&phase===2?2:0),3,1,'#14222b');
   g.restore();if(this.sprites.size>=4096)this.sprites.delete(this.sprites.keys().next().value);this.sprites.set(key,c);return c;
  }
  player(p,selected,m){if(p.red)return;const g=this.ctx,pt=this.camera.project(p.x,p.y),scale=p.y<200?.8:p.y>480?1: .9;this.ellipse(p.x,p.y,9,4,'#102c3277',true);if(selected){this.ellipse(p.x,p.y,12,6,'#eede56');this.poly([{x:pt.x-3,y:pt.y-24},{x:pt.x+3,y:pt.y-24},{x:pt.x,y:pt.y-20}],'#f0e55a');}g.drawImage(this.sprite(p),Math.round(pt.x-14*scale),Math.round(pt.y-27*scale),Math.round(28*scale),Math.round(30*scale));if(p.yellow){this.rect(pt.x+6,pt.y-21,2,3,'#f0e55a');}if(selected&&m.state==='play'){this.rect(pt.x-6,pt.y+4,12,2,'#173c30');this.rect(pt.x-6,pt.y+4,12*p.energy,2,'#e8db63');}}
  official(x,y,flag=false){const p=this.camera.project(x,y);this.rect(p.x-2,p.y-14,4,4,'#d4a779');this.rect(p.x-3,p.y-10,6,6,'#e3c753');this.rect(p.x-2,p.y-4,4,3,'#11282a');this.rect(p.x-3,p.y-1,2,2,'#142728');this.rect(p.x+1,p.y-1,2,2,'#142728');if(flag){this.rect(p.x+5,p.y-10,1,9,'#e9d8a0');this.rect(p.x+6,p.y-10,4,3,'#e7a744');}}
  render(m,dt,debug=false,fps=60,menu=false){this.fit(menu);if(!menu&&m.state==='penalty'){this.penaltyScene(m);return;}if(!menu&&m.freeKick&&(m.state==='freeKick'||m.state==='play'&&m.freeKick.phase==='flight')){this.freeKickScene(m);return;}this.t+=dt;this.camera.update(m,dt);if(menu){this.camera.x=760+Math.sin(this.t*.09)*80;this.camera.y=300;this.camera.zoom=.55;}this.field(m);
   this.official(B.clamp(m.ball.x-80,130,920),B.clamp(m.ball.y+90,80,600));this.official(B.clamp(m.ball.x,20,1030),-7,true);this.official(B.clamp(1050-m.ball.x,20,1030),688,true);
   const list=m.players.filter(p=>!p.red).map(p=>({y:p.y,fn:()=>this.player(p,!menu&&p===m.controlled,m)}));list.push({y:m.ball.y+m.ball.z*.5,fn:()=>this.ball(m.ball)});list.sort((a,b)=>a.y-b.y).forEach(o=>o.fn());
   if(debug)this.debug(m,fps);if(!menu)this.hud(m);if(m.state==='goal'){this.rect(83,38,218,43,'#102126ed');this.text('GOOOOOL!',192,55,'#f0e55a',18,'center');this.text((m.lastScorer?.name||'GOL').toUpperCase(),192,67,'#f4f1d9',7,'center');this.text(`${m.minute}'  ·  ${m.teams[1-m.nextKickoff].data.name.toUpperCase()}`,192,77,'#a9cf91',6,'center');}
  }
  hud(m){const a=m.teams[0],b=m.teams[1],mins=String(Math.floor(m.clock/60)).padStart(2,'0'),sec=String(Math.floor(m.clock%60)).padStart(2,'0');this.rect(9,8,174,21,'#0f2326ee');this.rect(9,8,3,21,a.data.primaryColor);this.text(a.data.shortName,20,22,'#eeeccf',10);this.rect(49,10,46,17,'#ece4a9');this.text(`${a.score} : ${b.score}`,72,22,'#19342e',11,'center');this.text(b.data.shortName,102,22,'#eeeccf',10);this.text(m.mode==='training'?'TREINO':`${mins}:${sec}`,173,21,'#c3db9d',8,'right');
   const base=m.period===1?45:m.period===2?90:m.period===3?105:120;if(m.minute>=base&&m.state!=='penalty')this.text(`+${Math.ceil(m.added/60)}`,194,21,'#f0e55a',8);this.rect(344,8,31,16,'#102628cc');this.text('ESC',359,19,'#d4dcc2',7,'center');
   const p=m.controlled;if(p){this.rect(9,217,145,16,'#0e2324ee');this.rect(9,217,3,16,'#f0e55a');this.text(`${p.shirtNumber??p.index+1} ${(p.name||'').toUpperCase().slice(0,22)}`,18,228,'#edebd1',7);this.rect(159,223,38,4,'#17332a');this.rect(159,223,38*p.energy,4,'#d9d15d');}
   // The radar preserves spatial awareness beyond the scrolling camera.
   this.rect(282,180,92,53,'#102c28cc');this.ctx.strokeStyle='#719b75';this.ctx.strokeRect(284,182,88,49);this.rect(328,182,1,49,'#527950');for(const q of m.players.filter(p=>!p.red))this.rect(285+q.x/1050*85,183+q.y/680*46,2,2,q.team.side===m.human?'#f0e55a':'#edf4de');this.rect(285+m.ball.x/1050*85,183+m.ball.y/680*46,2,2,'#ee9c53');
   if(m.bannerTime>0&&m.state!=='goal'){this.rect(45,37,294,15,'#102526de');this.text(m.banner,192,47,'#f0e55a',6,'center');}
   if(m.state==='restart'&&m.restart.team===m.human){this.text('DIREÇÃO + Z / X / C PARA COBRAR',192,203,'#e3e8c4',7,'center');}
   const charge=Math.max(0,...Object.values(m.charges));if(charge){this.rect(143,207,98,5,'#102824');this.rect(144,208,B.clamp(charge/.85,0,1)*96,3,charge>.8?'#ef9b54':'#f0e55a');}
  }
  debug(m,fps){this.line(m.offsideLine,0,m.offsideLine,680,'#f26565');for(const p of m.players){this.ellipse(p.x,p.y,7,7,'#e6d964');const v=this.camera.project(p.x,p.y);this.text(p.state,v.x,v.y-28,'#fff',5,'center');this.line(p.home.x-5,p.home.y,p.home.x+5,p.home.y,'#51b9db');}if(m.controlled)for(const p of m.controlled.team.players)this.line(m.controlled.x,m.controlled.y,p.x,p.y,'#b5d58444');this.text(`FPS ${Math.round(fps)} BALL ${m.ball.x.toFixed(0)},${m.ball.y.toFixed(0)},${m.ball.z.toFixed(0)}`,8,174,'#fff',7);}
 };
})();
