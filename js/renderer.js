'use strict';
(() => {
 const B=window.BSS,F=B.FIELD;
 B.ACTOR_HEADS=Object.freeze({"front":["....OOOOOO....","..OOHHHHHHOO..",".OHHLLHHHHHHO.",".OHLLLLHHHHHO.","OHHHHSSSSHHHHO","OHSSUUUSSSSSHO","OSSWPSSWPSSSSO","OSSWPSSWPSSSSO",".OSSSSnSSSSSO.",".OSSSSmSSSSSO.","..OSSSSSSSSO..","...OOSSSSOO...",".....OOOO....."],"side":[".....OOOOO.....","...OOHHHHHOO...","..OHLLLLHHHHO..",".OHLLLHHHHHHHO.",".OHHHHHHHSSSHO.","OHHHHHSSSUUSSO.","OHHHSSSSSSWWPO.",".OHHSSSSSSWWPOO",".OHSSSSSSSSSSnO","..OSSSSSSSSSSO.","...OSSSSmSSSO..","....OOSSSSOO...","......OOOO....."],"back":["....OOOOOO....","..OOHHHHHHOO..",".OHHLLLHHHHHO.",".OHLLLLHHHHHO.","OHHHHHHHHHHHHO","OHHHHHHHHHHHHO","OHHHHHHHHHHHHO",".OHHHHHHHHHHO.",".OHHHHHHHHHHO.","..OHHHHHHHHO..","...OHHTTHHO...","....OTTTOO....",".....OOO......"]});
 B.Renderer=class {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;this.camera=new B.Camera();this.t=0;this.sprites=new Map();this.crowdSeed=B.rng(2026);this.crowd=Array.from({length:500},()=>({x:this.crowdSeed()*(F.w+150)-75,y:this.crowdSeed()*75,c:Math.floor(this.crowdSeed()*7)}));}
  rect(x,y,w,h,c){this.ctx.fillStyle=c;this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  art(name){this.artwork??=new Map();if(!this.artwork.has(name)&&typeof Image!=='undefined'){const img=new Image();img.src=`assets/ui/${name}.svg`;this.artwork.set(name,img);}return this.artwork.get(name);}
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
  field(m){this.activeBall=m.ball;const g=this.ctx;this.rect(-48,-15,480,270,'#1d3531');this.worldRect(-120,-180,(F.w+240),(F.h+360),'#1b3237');
   const stadium=m.options.stadium||'day',night=stadium==='night',colors=night?['#bba261','#7c5359','#a8afae','#47847a','#879e62','#a48067','#606380']:['#d5c096','#9d4b42','#b8cbbb','#578176','#dfc651','#b27861','#6399a5'];
   this.worldRect(-75,-120,(F.w+150),82,night?'#27303b':'#444949');this.worldRect(-75,(F.h+40),(F.w+150),82,night?'#27303b':'#444949');for(const c of this.crowd){for(const side of [-1,1]){const p=this.camera.project(c.x,side<0?-45-c.y:(F.h+47)+c.y);const bounce=Math.sin(this.t*3+c.x)>.9?1:0;this.rect(p.x,p.y-bounce,2,3,colors[c.c]);this.rect(p.x,p.y-bounce-1,1,1,'#e4c49b');}}
   for(let row=0;row<3;row++){this.line(-80,-50-row*25,(F.w+80),-50-row*25,'#152c30');this.line(-80,(F.h+50)+row*25,(F.w+80),(F.h+50)+row*25,'#152c30');}
   this.worldRect(-55,-30,(F.w+110),20,'#e2d99b');this.worldRect(-55,(F.h+13),(F.w+110),20,'#e2d99b');for(let x=-30;x<(F.w+50);x+=155){const a=this.camera.project(x,-15),b=this.camera.project(x,(F.h+27));this.text(x%310?'JOGA BONITO':'SUPER SOCCER',a.x,a.y,'#243a32',6);this.text('BRASIL 2026',b.x,b.y,'#243a32',6);}
   this.worldRect(-35,-8,(F.w+70),(F.h+16),night?'#23623f':'#31824d');for(let i=0;i<14;i++)this.worldRect(i*F.w/14,0,F.w/14,F.h,i%2?(night?'#2b7348':'#398d52'):(night?'#286b43':'#32834b'));
   const line='#acd093';this.worldRect(0,0,(F.w),(F.h),null,line);this.line((F.cx),0,(F.cx),(F.h),line);this.ellipse(F.cx,F.cy,B.PITCH.arcRadius,B.PITCH.arcRadius,line);this.ellipse((F.cx),(F.cy),2,2,line,true);
   for(const x of [0,F.w]){const markings=B.pitchMarkings(x,x===0?-1:1),project=this.camera.project.bind(this.camera);g.strokeStyle=line;g.lineWidth=1;for(const points of markings.lines){g.beginPath();points.forEach((q,i)=>{const pt=project(q.x,q.y);i?g.lineTo(pt.x,pt.y):g.moveTo(pt.x,pt.y);});g.stroke();}this.ellipse(markings.spot.x,markings.spot.y,2,2,line,true);}
   for(const x of [0,(F.w)])for(const y of [0,(F.h)]){const p=this.camera.project(x,y);this.rect(p.x,p.y-8,1,8,'#eeeecc');this.rect(p.x+1,p.y-8,4,3,'#e8d54c');}
   // Sideline assets share world coordinates with the expanded pitch.
   for(const [side,x] of [[0,F.cx-175],[1,F.cx+85]]){this.worldRect(x,F.h+40,90,23,'#172a3c','#64818b');for(let i=0;i<5;i++){const q=this.camera.project(x+10+i*16,F.h+57);this.rect(q.x-2,q.y-5,4,5,m.teams[side].data.primaryColor);this.rect(q.x-1,q.y-8,3,3,'#d2a078');}}
   for(const x of [35,F.w-35]){const p=this.camera.project(x,-95);this.rect(p.x,p.y-50,2,50,'#9baeb4');this.rect(p.x-13,p.y-53,28,5,'#e1f0d6');if(night){g.save();g.globalAlpha=.1;this.poly([{x:p.x-12,y:p.y-48},{x:p.x+14,y:p.y-48},{x:p.x+75,y:p.y+85},{x:p.x-75,y:p.y+85}],'#f4f1c5');g.restore();}}
   this.goal(0);this.goal((F.w));
  }
  goal(x){const d=x===0?-1:1,p=this.camera.project.bind(this.camera),g=this.ctx;const net=this.activeBall?.net,ripple=net?.line===x?net.ripple*Math.sin(net.age*30)*5:0;const a=p(x,(F.goalTop),40),b=p(x,(F.goalBottom),40),c=p(x+d*(27+ripple),(F.goalBottom),0),e=p(x+d*(27+ripple),(F.goalTop),0);this.poly([a,b,c,e],'#d1dbc529','#bfcdb4');for(let i=0;i<=6;i++){const t=i/6;g.strokeStyle='#c3d1b48a';g.beginPath();g.moveTo(B.lerp(a.x,b.x,t),B.lerp(a.y,b.y,t));g.lineTo(B.lerp(e.x,c.x,t),B.lerp(e.y,c.y,t));g.stroke();}for(let i=1;i<4;i++){const t=i/4;g.beginPath();g.moveTo(B.lerp(a.x,e.x,t),B.lerp(a.y,e.y,t));g.lineTo(B.lerp(b.x,c.x,t),B.lerp(b.y,c.y,t));g.stroke();}const a0=p(x,(F.goalTop)),b0=p(x,(F.goalBottom));g.strokeStyle='#f1f1d5';g.lineWidth=2;g.beginPath();g.moveTo(a0.x,a0.y);g.lineTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b0.x,b0.y);g.stroke();g.lineWidth=1;}
  slideSprite(p){
   const kit=p.role==='GK'?p.team.data.kit.goalkeeper:p.team.kit,progress=B.clamp(1-p.animTime/B.SLIDE.duration,0,1),phase=Math.min(11,Math.floor(progress*12)),n=p.slideDirection||p.facing;
   const direction=(Math.round(Math.atan2(n.y,n.x)/(Math.PI/4))+8)%8,skin=['#eec58f','#c99260','#9c6945','#684731'][B.hash(p.id)%4],hair=['#302c23','#52321e','#2a2923','#a47b35','#704d28'][B.hash(p.id+':hair')%5],style=B.hash(p.id+':shape')%5;
   const key=['slide-video',hair,style,kit.shirtBaseColor,kit.shirtSecondaryColor,kit.shortsColor,kit.socksColor,kit.pattern,skin,direction,phase].join('|');
   if(this.sprites.has(key))return this.sprites.get(key);
   const c=document.createElement('canvas');c.width=48;c.height=48;c.anchorX=24;c.anchorY=34;c.modelScale=.84;
   const g=c.getContext('2d'),pose=B.Player.slidePose({...p,slideDirection:{x:Math.cos(direction*Math.PI/4),y:Math.sin(direction*Math.PI/4)}},(phase+.5)/12),j={};
   for(const [key,[u,v,z]] of Object.entries(pose.joints))j[key]={x:24+u*pose.direction.x-v*pose.direction.y,y:34+(u*pose.direction.y+v*pose.direction.x)*.67-z};
   const dot=(p,size,color)=>{g.fillStyle=color;g.fillRect(Math.round(p.x-size/2),Math.round(p.y-size/2),size,size);};
   const limb=(a,b,size,color)=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=steps;i++)dot({x:B.lerp(a.x,b.x,i/steps),y:B.lerp(a.y,b.y,i/steps)},size,color);};
   limb(j.shoulder,j.backHand,3,skin);limb(j.hip,j.backKnee,4,kit.shortsColor);limb(j.backKnee,j.backFoot,3,kit.socksColor);dot(j.backFoot,4,'#14222b');
   limb(j.hip,j.knee,4,kit.shortsColor);limb(j.knee,j.foot,3,kit.socksColor);limb(j.foot,{x:j.foot.x+pose.direction.x*2,y:j.foot.y+pose.direction.y},3,'#101c25');
   limb(j.shoulder,j.hip,7,kit.shirtBaseColor);limb(j.shoulder,{x:B.lerp(j.shoulder.x,j.hip.x,.45),y:B.lerp(j.shoulder.y,j.hip.y,.45)},2,kit.shirtSecondaryColor);
   dot(j.hip,5,kit.shortsColor);limb({x:j.shoulder.x-1,y:j.shoulder.y-1},{x:j.hip.x-1,y:j.hip.y-1},1,this.shade(kit.shirtBaseColor,20));limb(j.shoulder,j.hand,2,skin);this.actorHead(g,j.head,direction,skin,hair,style);dot({x:j.foot.x,y:j.foot.y-1},1,'#d1d9ca');
   if(this.sprites.size>=4096)this.sprites.delete(this.sprites.keys().next().value);this.sprites.set(key,c);return c;
  }
  turf(bit,project=(x,y,z)=>this.camera.project(x,y,z),scale=B.clamp(this.camera.zoom/.61,.7,1)){
   const t=bit.age,z=Math.max(0,bit.vz*t-90*t*t),pt=project(bit.x+bit.vx*t,bit.y+bit.vy*t,z),g=this.ctx;
   g.save();g.globalAlpha=B.clamp((bit.life-t)/.18,0,1);g.translate(Math.round(pt.x),Math.round(pt.y));g.rotate(bit.spin+t*7);
   const size=bit.size*scale;
   g.fillStyle=bit.soil?'#765530':'#b4ce68';g.fillRect(-size/2,-size,size,bit.soil?size:size*2.5);
   if(!bit.soil){g.fillStyle='#4e954b';g.fillRect(0,0,size,size);}g.restore();
  }
  shade(color,amount){const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));return '#'+rgb.map(v=>B.clamp(Math.round(v+amount),0,255).toString(16).padStart(2,'0')).join('');}
  actorHead(g,head,direction,skin,hair,style=0){
   const masks=B.ACTOR_HEADS,back=direction>=5&&direction<=7,side=direction===0||direction===4,rows=back?masks.back:side?masks.side:masks.front,width=Math.max(...rows.map(r=>r.length)),left=Math.round(head.x-width/2),top=Math.round(head.y-7),mirror=direction===3||direction===4||direction===5;
   const palette={O:'#20231e',H:hair,L:this.shade(hair,24),S:skin,T:this.shade(skin,-25),U:this.shade(skin,16),W:'#f7f2df',P:'#28352c',n:this.shade(skin,-35),m:'#78442e'};
   for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){let code=rows[y][x];if(code==='.'||code===' ')continue;if(style===2&&['H','L'].includes(code)&&y<5)code='S';if(style===4&&code==='L')code='H';if(!palette[code])continue;g.fillStyle=palette[code];g.fillRect(left+(mirror?width-1-x:x),top+y,1,1);}
   if(style===3){g.fillStyle=palette.O;for(const dx of [-4,-1,2,5])g.fillRect(Math.round(head.x+dx),top,2,1);}
  }
  sprite(p){
   if(p.anim==='slide'&&p.animTime>0)return this.slideSprite(p);
   const kit=p.role==='GK'?p.team.data.kit.goalkeeper:p.team.kit,running=['run','sprint'].includes(p.anim),direction=(Math.round(Math.atan2(p.facing.y,p.facing.x)/(Math.PI/4))+8)%8;
   const durations={fall:.7,dive:.6,receive:.16,dribble:.25,tackle:.22,catch:.45,long:.38,setpiece:.46,throwin:.64,header:.52,volley:.58,bicycle:.72},duration=durations[p.anim]||.42;
   const phase=running?Math.floor(p.runTime*1.25)%16:p.anim==='celebrate'?Math.floor(p.runTime)%8:p.animTime>0?Math.min(11,Math.floor(B.clamp(1-p.animTime/duration,0,1)*12)):0;
   const skin=['#eec58f','#c99260','#9c6945','#684731'][B.hash(p.id)%4],hair=['#302c23','#52321e','#2a2923','#a47b35','#704d28'][B.hash(p.id+':hair')%5],style=B.hash(p.id+':shape')%5,aerial=['header','volley','bicycle','dive','fall'].includes(p.anim);
   const key=['cup-video',...Object.values(kit),skin,hair,style,p.anim,phase,direction].join('|');if(this.sprites.has(key))return this.sprites.get(key);
   const c=document.createElement('canvas');c.width=aerial?56:40;c.height=aerial?60:44;c.anchorX=aerial?28:20;c.anchorY=aerial?48:40;c.modelScale=.84;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   const n={x:Math.cos(direction*Math.PI/4),y:Math.sin(direction*Math.PI/4)},t=phase/11,cycle=phase/16*Math.PI*2,stride=running?Math.sin(cycle)*(p.anim==='sprint'?4.8:3.7):0,bob=running?Math.abs(Math.sin(cycle))*1:0;
   const kicking=['kick','pass','long','placed','tackle','setpiece'].includes(p.anim),kick=kicking?B.Player.kickPose(t):null;
   const pose=aerial?B.Player.aerialPose(p.anim,t).joints:{head:[(kick?.lean||0)+(running?1:0),0,26],shoulder:[(kick?.lean||0)+(running?1.2:0),0,18],hip:[0,0,10],knee:[stride*.5+(kick?.knee||0)*.7,-2.5,5+(kick?.z||0)*.35],foot:[stride+(kick?.u||0),-2.5,(kick?.z||0)],backKnee:[-stride*.5,2.5,5],backFoot:[-stride,2.5,Math.max(0,stride)*.35],hand:[-stride*.65,-6.5,12+Math.max(0,-stride)*.35],backHand:[stride*.65,6.5,12+Math.max(0,stride)*.35]};
   if(aerial)pose.head[2]-=2;
   const holding=['catch','hold'].includes(p.anim);if(holding){pose.hand=[5,-3,18];pose.backHand=[5,3,18];}
   if(p.anim==='throwin'){const q=B.Player.throwPose(t);pose.hand=[q.u,-2,q.z+3];pose.backHand=[q.u,2,q.z+3];}
   if(p.anim==='celebrate'){pose.hand=[0,-7,31+(phase%2)];pose.backHand=[0,7,31+(phase%2)];}
   if(['point','flag'].includes(p.anim))pose.hand=[12,-4,20];if(p.anim==='whistle')pose.hand=[5,-3,25];if(p.anim==='watch'){pose.hand=[5,-2,19];pose.backHand=[6,2,19];}
   const point=([u,v,z])=>({x:Math.round(c.anchorX+u*n.x-v*n.y),y:Math.round(c.anchorY+(u*n.y+v*n.x)*.45-z-bob)}),j=Object.fromEntries(Object.entries(pose).map(([k,v])=>[k,point(v)]));
   const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));},line=(a,b,width,color)=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=steps;i++)rect(B.lerp(a.x,b.x,i/steps)-width/2,B.lerp(a.y,b.y,i/steps)-width/2,width,width,color);};
   const limb=(a,b,width,color)=>{line(a,b,width+1,'#24291f');line(a,b,width,color);};
   const arm=(hand,sign)=>{const shoulder=point([pose.shoulder[0],sign*4.5,pose.shoulder[2]-1]),elbow={x:B.lerp(shoulder.x,hand.x,.55),y:B.lerp(shoulder.y,hand.y,.55)-1};limb(shoulder,elbow,2.5,kit.shirtBaseColor);limb(elbow,hand,2,p.role==='GK'?'#eee3bd':skin);rect(hand.x-1,hand.y-1,2,2,p.role==='GK'?'#eee3bd':skin);};
   // Rasterize the shirt between its joints: square line caps must not cover the shorts and legs.
   const garment=(a,b,width,color,pattern=false)=>{if(Math.hypot(b.x-a.x,b.y-a.y)<.5)b={x:a.x,y:a.y+2};const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    const raster=(w,fill,border)=>{const minX=Math.floor(Math.min(a.x,b.x)-w-1),maxX=Math.ceil(Math.max(a.x,b.x)+w+1),minY=Math.floor(Math.min(a.y,b.y)-w-1),maxY=Math.ceil(Math.max(a.y,b.y)+w+1);
     for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const u=((x-a.x)*dx+(y-a.y)*dy)/len,v=(x-a.x)*nx+(y-a.y)*ny;if(u<-(border?1:0)||u>len+(border?1:0)||Math.abs(v)>w/2)continue;let shade=fill;
      if(pattern&&!border){const row=Math.round(u),col=Math.round(v+w/2),sec=kit.shirtSecondaryColor;if(kit.pattern==='STRIPES_HORIZONTAL'&&row%3===1||kit.pattern==='STRIPES_VERTICAL'&&col%4<2||kit.pattern==='SASH'&&Math.abs(col-row*.65-1)<1||kit.pattern==='HALVES'&&v>0)shade=sec;else if(v<-w/2+1)shade=this.shade(fill,18);else if(v>w/2-1)shade=this.shade(fill,-20);}
      rect(x,y,1,1,shade);}};
    raster(width+2,'#24291f',true);raster(width,color,false);};
   arm(j.backHand,1);
   for(const [knee,foot] of [[j.backKnee,j.backFoot],[j.knee,j.foot]]){limb(j.hip,knee,2,skin);limb(knee,foot,2,kit.socksColor);const ankle={x:B.lerp(knee.x,foot.x,.75),y:B.lerp(knee.y,foot.y,.75)};line(ankle,foot,2,kit.socksColor);limb(foot,{x:foot.x+n.x*2,y:foot.y+n.y},2,'#252b25');rect(foot.x+(n.x<0?-2:0),foot.y-1,2,1,'#f5efdc');}
   const bodyWidth=6+2*Math.abs(n.y);garment(j.shoulder,j.hip,bodyWidth,kit.shirtBaseColor,true);garment(j.hip,point([pose.hip[0],0,pose.hip[2]-2]),bodyWidth+.5,kit.shortsColor);
   const back=direction>=5&&direction<=7;if(back){rect(j.shoulder.x-1,j.shoulder.y+2,2,3,'#f4eed9');}else{rect(j.shoulder.x+1,j.shoulder.y+2,1,1,'#f2d378');}rect(j.shoulder.x-2,j.shoulder.y-2,4,3,skin);
   arm(j.hand,-1);this.actorHead(g,j.head,direction,skin,hair,style);
   if(p.anim==='flag'){const hand=j.hand;line(hand,{x:hand.x,y:hand.y-10},1,'#e6d8a0');rect(hand.x+1,hand.y-11,6,4,'#ffbe31');rect(hand.x+1,hand.y-11,3,2,'#ef742c');rect(hand.x+4,hand.y-9,3,2,'#ef742c');}
   if(p.anim==='whistle')rect(j.hand.x,j.hand.y,2,1,'#d3e5e2');if(p.anim==='watch')rect(j.hand.x-1,j.hand.y-1,2,2,'#27392d');
   if(this.sprites.size>=4096)this.sprites.delete(this.sprites.keys().next().value);this.sprites.set(key,c);return c;
  }
  officialPerson(x,y,gesture='idle',scale=1,time=0,card=null){
   const kit={shirtBaseColor:'#f3cc46',shirtSecondaryColor:'#242d33',shortsColor:'#253036',socksColor:'#202f34',pattern:'SOLID'},p={id:'official',role:'RF',team:{kit},facing:{x:0,y:1},anim:gesture,animTime:0,runTime:time*8};
   const sprite=this.sprite(p);this.ctx.drawImage(sprite,Math.round(x-sprite.anchorX*scale),Math.round(y-sprite.anchorY*scale),Math.round(sprite.width*scale),Math.round(sprite.height*scale));
   if(card)this.rect(x-12*scale,y-37*scale,4*scale,6*scale,card==='red'?'#ff5242':'#ffe264');
   if(gesture==='whistle')for(let i=0;i<3;i++)this.rect(x+(9+i*3)*scale,y-(26-i*2)*scale,scale*1.5,scale*.6,'#f6e5ad');
  }
  player(p,selected,m){if(p.red)return;const g=this.ctx,pt=this.camera.project(p.x,p.y),scale=(p.y<F.cy-140?.8:p.y>F.cy+140?1:.9)*B.clamp(this.camera.zoom/.61,.7,1);this.ellipse(p.x,p.y,9,4,'#102c3277',true);if(selected){this.ellipse(p.x,p.y,12,6,'#eede56');this.poly([{x:pt.x-3,y:pt.y-24},{x:pt.x+3,y:pt.y-24},{x:pt.x,y:pt.y-20}],'#f0e55a');}const sprite=this.sprite(p),modelScale=scale*(sprite.modelScale??1);g.drawImage(sprite,Math.round(pt.x-(sprite.anchorX??14)*modelScale),Math.round(pt.y-(sprite.anchorY??27)*modelScale),Math.round(sprite.width*modelScale),Math.round(sprite.height*modelScale));if(p.yellow){this.rect(pt.x+6,pt.y-21,2,3,'#f0e55a');}if(selected&&m.state==='play'){this.rect(pt.x-6,pt.y+4,12,2,'#173c30');this.rect(pt.x-6,pt.y+4,12*p.energy,2,'#e8db63');}}
  official(x,y,flag=false){const p=this.camera.project(x,y);this.officialPerson(p.x,p.y,flag?'flag':'idle',.62,this.t);}
  render(m,dt,debug=false,fps=60,menu=false){this.fit(menu);if(!menu&&m.state==='penalty'){this.penaltyScene(m);return;}if(!menu&&m.freeKick&&(m.state==='freeKick'||m.state==='play'&&!m.freeKick.corner&&m.freeKick.deliveryMode!=='cross'&&m.freeKick.phase==='flight')){this.freeKickScene(m);return;}this.t+=dt;this.camera.update(m,dt);if(menu){this.camera.x=760+Math.sin(this.t*.09)*80;this.camera.y=300;this.camera.zoom=.55;}this.field(m);
   this.official(B.clamp(m.ball.x-80,130,(F.w-130)),B.clamp(m.ball.y+90,80,F.h-80));this.official(B.clamp(m.ball.x,20,(F.w-20)),-7,true);this.official(B.clamp((F.w)-m.ball.x,20,(F.w-20)),(F.h+8),true);
   const list=m.players.filter(p=>!p.red).map(p=>({y:p.y,fn:()=>this.player(p,!menu&&p===m.controlled,m)}));for(const bit of m.turf||[])list.push({y:bit.y+bit.vy*bit.age,fn:()=>this.turf(bit)});list.push({y:m.ball.y+m.ball.z*.5,fn:()=>this.ball(m.ball)});list.sort((a,b)=>a.y-b.y).forEach(o=>o.fn());
   if(debug)this.debug(m,fps);if(!menu)this.hud(m);if(m.state==='goal'){this.rect(83,38,218,43,'#102126ed');this.text('GOOOOOL!',192,55,'#f0e55a',18,'center');this.text((m.lastScorer?.name||'GOL').toUpperCase(),192,67,'#f4f1d9',7,'center');this.text(`${m.minute}'  ·  ${m.teams[1-m.nextKickoff].data.name.toUpperCase()}`,192,77,'#a9cf91',6,'center');}
  }
  hud(m){const a=m.teams[0],b=m.teams[1],mins=String(Math.floor(m.clock/60)).padStart(2,'0'),sec=String(Math.floor(m.clock%60)).padStart(2,'0');this.rect(9,8,174,21,'#0f2326ee');this.rect(9,8,3,21,a.data.primaryColor);this.text(a.data.shortName,20,22,'#eeeccf',10);this.rect(49,10,46,17,'#ece4a9');this.text(`${a.score} : ${b.score}`,72,22,'#19342e',11,'center');this.text(b.data.shortName,102,22,'#eeeccf',10);this.text(m.mode==='training'?'TREINO':`${mins}:${sec}`,173,21,'#c3db9d',8,'right');
   const base=m.period===1?45:m.period===2?90:m.period===3?105:120;if(m.minute>=base&&m.state!=='penalty')this.text(`+${Math.ceil(m.added/60)}`,194,21,'#f0e55a',8);this.rect(344,8,31,16,'#102628cc');this.text('ESC',359,19,'#d4dcc2',7,'center');
   const p=m.controlled;if(p){this.rect(9,217,145,16,'#0e2324ee');this.rect(9,217,3,16,'#f0e55a');this.text(`${p.shirtNumber??p.index+1} ${(p.name||'').toUpperCase().slice(0,22)}`,18,228,'#edebd1',7);this.rect(159,223,38,4,'#17332a');this.rect(159,223,38*p.energy,4,'#d9d15d');}
   // The radar preserves spatial awareness beyond the scrolling camera.
   this.rect(282,180,92,53,'#102c28cc');this.ctx.strokeStyle='#719b75';this.ctx.strokeRect(284,182,88,49);this.rect(328,182,1,49,'#527950');for(const q of m.players.filter(p=>!p.red))this.rect(285+q.x/(F.w)*85,183+q.y/(F.h)*46,2,2,q.team.side===m.human?'#f0e55a':'#edf4de');this.rect(285+m.ball.x/(F.w)*85,183+m.ball.y/(F.h)*46,2,2,'#ee9c53');
   if(m.periodExtension&&m.bannerTime<=0){this.rect(113,37,158,15,'#102526de');this.text('ÚLTIMO ATAQUE',192,47,'#f0e55a',7,'center');}
   if(m.bannerTime>0&&m.state!=='goal'){this.rect(45,37,294,15,'#102526de');this.text(m.banner,192,47,'#f0e55a',6,'center');}
   if(m.state==='restart'&&m.restart.team===m.human&&!m.restartMotion){this.text('DIREÇÃO + Z / X / C PARA COBRAR',192,203,'#e3e8c4',7,'center');}
   const charge=Math.max(0,...Object.values(m.charges));if(charge){const action=Object.keys(m.charges).sort((a,b)=>m.charges[b]-m.charges[a])[0],power=B.KickModel.power(charge);this.rect(133,195,118,19,'#102824ed');this.text(({pass:'PASSE',shoot:'CHUTE',long:'CRUZAMENTO'})[action]+' '+Math.round(power*100)+'%',192,202,'#eef5c8',6,'center');this.rect(143,207,98,5,'#102824');this.rect(144,208,power*96,3,power>.94?'#ef9b54':'#f0e55a');}
   const receiver=m.kickPreview?.target;if(receiver&&!receiver.red){this.ellipse(receiver.x,receiver.y,15,8,'#81e9ef');const point=this.camera.project(receiver.x,receiver.y);this.text('PASSE',point.x,point.y-27,'#a7f3ef',5,'center');}
  }
  debug(m,fps){this.line(m.offsideLine,0,m.offsideLine,(F.h),'#f26565');for(const p of m.players){this.ellipse(p.x,p.y,7,7,'#e6d964');const v=this.camera.project(p.x,p.y);this.text(p.state,v.x,v.y-28,'#fff',5,'center');this.line(p.home.x-5,p.home.y,p.home.x+5,p.home.y,'#51b9db');}if(m.controlled)for(const p of m.controlled.team.players)this.line(m.controlled.x,m.controlled.y,p.x,p.y,'#b5d58444');this.text(`FPS ${Math.round(fps)} BALL ${m.ball.x.toFixed(0)},${m.ball.y.toFixed(0)},${m.ball.z.toFixed(0)}`,8,174,'#fff',7);}
 };
})();
