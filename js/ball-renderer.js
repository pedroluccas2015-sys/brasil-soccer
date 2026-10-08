'use strict';
(() => {
 const B=window.BSS,R=B.Renderer.prototype;
 // Original pixel sphere: dark panels rotate over a shaded spherical surface.
 // Frames are cached; rotation advances in the simulation, never while paused.
 R.ballFrame=function(roll){
  this.ballFrames??=new Map();const frame=Math.floor(roll/(Math.PI*2)*32)%32;
  if(this.ballFrames.has(frame))return this.ballFrames.get(frame);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=15;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(15,15),phi=(1+Math.sqrt(5))/2,panels=[];
  for(const a of [-1,1])for(const b of [-phi,phi])for(const v of [[0,a,b],[a,b,0],[b,0,a]]){const n=Math.hypot(...v);panels.push(v.map(c=>c/n));}
  const angle=frame/32*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),tilt=.55,ct=Math.cos(tilt),st=Math.sin(tilt);
  for(let y=0;y<15;y++)for(let x=0;x<15;x++){
   const nx=(x-7)/7.2,ny=(y-7)/7.2,d=nx*nx+ny*ny;if(d>1)continue;
   const nz=Math.sqrt(1-d),rx=nx*ct-ny*st,ry=nx*st+ny*ct,py=ry*c-nz*s,pz=ry*s+nz*c;
   const patch=Math.max(...panels.map(v=>v[0]*rx+v[1]*py+v[2]*pz));
   const color=d>.91?[32,46,45]:patch>.91?[31,43,43]:patch>.893?[134,146,135]:[251,246,223];
   const light=.7+nz*.27-nx*.08-ny*.1,i=(y*15+x)*4;
   for(let k=0;k<3;k++)data.data[i+k]=Math.min(255,color[k]*light);data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);this.ballFrames.set(frame,canvas);return canvas;
 };
 R.drawLiveBall=function(b,project,size){
  const g=this.ctx,pt=project(b.x,b.y,b.z),shadow=project(b.x,b.y,0),height=B.clamp(b.z/55,0,1);
  g.save();g.fillStyle=`rgba(8,32,28,${.43-height*.24})`;g.beginPath();g.ellipse(shadow.x,shadow.y+1,size*(.5+height*.25),size*.18,0,0,Math.PI*2);g.fill();
  for(const trail of b.trail||[]){const p=project(trail.x,trail.y,trail.z);g.globalAlpha=Math.max(0,.18*(1-trail.age/.1));g.drawImage(this.ballFrame(b.roll-trail.age*14+Math.PI*4),Math.round(p.x-size/2),Math.round(p.y-size*.8),size,size);}
  g.globalAlpha=1;
  const squash=b.impactTime>0?Math.sin(b.impactTime/.18*Math.PI)*.22*(b.impactStrength||1):0;
  const w=size*(1+squash),h=size*(1-squash);
  g.drawImage(this.ballFrame(b.roll||0),Math.round(pt.x-w/2),Math.round(pt.y-h*.8),Math.round(w),Math.round(h));
  if(b.impactTime>.07&&['save','post','net'].includes(b.impactKind)){
   g.globalAlpha=b.impactTime/.18;g.strokeStyle='#f7e9ae';g.lineWidth=1;
   for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,r=size*.85;g.beginPath();g.moveTo(pt.x+Math.cos(a)*r,pt.y-size*.3+Math.sin(a)*r);g.lineTo(pt.x+Math.cos(a)*(r+3),pt.y-size*.3+Math.sin(a)*(r+3));g.stroke();}
  }
  g.restore();
 };
 R.ball=function(b){this.drawLiveBall(b,this.camera.project.bind(this.camera),Math.max(5,Math.round(8*this.camera.zoom)));};
})();
