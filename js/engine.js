'use strict';
window.BSS = window.BSS || {};
(() => {
 const B = window.BSS;
 B.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
 B.lerp = (a,b,t) => a+(b-a)*t;
 B.dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
 B.norm = (x,y) => {const n=Math.hypot(x,y); return n ? {x:x/n,y:y/n} : {x:0,y:0};};
 B.hash = s => {let h=2166136261; for(const c of s) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0;};
 B.rng = seed => () => {seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
 B.FIELD = {w:1050,h:680,goalTop:281,goalBottom:399,goalHeight:40};
 B.safeStorage = {get(key,fallback=null){try{const v=localStorage.getItem('bss26:'+key);return v ? JSON.parse(v) : fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem('bss26:'+key,JSON.stringify(value));return true;}catch{return false;}}};
 B.GameEngine = class {
  constructor(update,render){this.update=update;this.render=render;this.acc=0;this.last=0;this.fps=60;this.running=false;}
  start(){if(this.running)return;this.running=true;const frame=t=>{if(!this.running)return;const delta=this.last ? Math.min((t-this.last)/1000,.1):0;this.last=t;this.fps=B.lerp(this.fps,1/Math.max(delta,.001),.03);this.acc+=delta;while(this.acc>=1/60){this.update(1/60);this.acc-=1/60;}this.render(this.acc*60);requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 };
})();
