'use strict';
(() => {
 const B=window.BSS;
 const DIRECTIONS=['up','down','left','right'];
 B.TouchControls=class {
  constructor(input){
   this.input=input;
   this.root=document.getElementById('touch-controls');
   this.pad=this.root.querySelector('#touch-dpad');
   this.lastTap={};
   this.padPointer=null;
   this.padActions=new Set();
   this.actionPointers=new Map();
   this.currentActions=new Map();
   const coarse=()=>matchMedia('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0;
   const refresh=()=>document.body.classList.toggle('touch-capable',coarse());
   refresh();
   try{matchMedia('(any-pointer: coarse)').addEventListener('change',refresh);}catch{}
   this.pad.addEventListener('pointerdown',e=>{
    if(this.padPointer!==null||!this.available())return;
    e.preventDefault();this.padPointer=e.pointerId;
    this.pad.setPointerCapture(e.pointerId);
    this.movePad(e);
   });
   this.pad.addEventListener('pointermove',e=>{
    if(e.pointerId===this.padPointer){e.preventDefault();this.movePad(e);}
   });
   const endPad=e=>{
    if(e.pointerId!==this.padPointer)return;
    e.preventDefault();this.padPointer=null;this.setPadDirections(new Set());
   };
   for(const event of ['pointerup','pointercancel','lostpointercapture'])this.pad.addEventListener(event,endPad);
   for(const button of this.root.querySelectorAll('[data-touch-action]')){
    const action=button.dataset.touchAction;
    button.addEventListener('pointerdown',e=>{
     if(!this.available())return;
     e.preventDefault();
     if(this.actionPointers.has(e.pointerId))return;
     button.setPointerCapture(e.pointerId);
     this.actionPointers.set(e.pointerId,{button,action});
     this.activate(action,e.pointerId,button);
    });
    const end=e=>{
     const held=this.actionPointers.get(e.pointerId);
     if(!held||held.button!==button)return;
     e.preventDefault();this.actionPointers.delete(e.pointerId);
     this.deactivate(held.action,e.pointerId,button);
    };
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,end);
    button.addEventListener('contextmenu',e=>e.preventDefault());
   }
   this.root.addEventListener('contextmenu',e=>e.preventDefault());
   addEventListener('blur',()=>this.reset());
   document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
  }
  available(){return !!document.body.classList.contains('playing')&&!document.body.classList.contains('ui-open');}
  activate(action,pointerId,button){
   if(!this.currentActions.has(action))this.currentActions.set(action,new Set());
   this.currentActions.get(action).add(pointerId);
   this.input.setVirtual(action,true);
   button?.classList.add('is-pressed');button?.setAttribute('aria-pressed','true');
  }
  deactivate(action,pointerId,button){
   const pointers=this.currentActions.get(action);
   pointers?.delete(pointerId);
   if(!pointers?.size){this.currentActions.delete(action);this.input.setVirtual(action,false);}
   button?.classList.remove('is-pressed');button?.setAttribute('aria-pressed','false');
  }
  movePad(e){
   const r=this.pad.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);
   // A dead zone in the middle avoids accidental movement; outer diagonals work.
   const active=new Set();
   if(Math.hypot(x,y)>.27){
    if(y<-.24)active.add('up');else if(y>.24)active.add('down');
    if(x<-.24)active.add('left');else if(x>.24)active.add('right');
   }
   this.setPadDirections(active);
  }
  setPadDirections(next){
   for(const action of this.padActions)if(!next.has(action))this.deactivate(action,'dpad',this.pad.querySelector(`[data-dir="${action}"]`));
   const now=performance.now();
   for(const action of next)if(!this.padActions.has(action)){
    // Same double-tap dash as keyboard, in addition to the CORRER button.
    if(now-(this.lastTap[action]||0)<260)this.input.dash=true;
    this.lastTap[action]=now;
    this.activate(action,'dpad',this.pad.querySelector(`[data-dir="${action}"]`));
   }
   this.padActions=next;
  }
  reset(){
   this.padPointer=null;
   this.padActions.clear();this.actionPointers.clear();this.currentActions.clear();
   for(const button of this.root.querySelectorAll('.is-pressed')){button.classList.remove('is-pressed');button.setAttribute('aria-pressed','false');}
   this.input.clearVirtual();
  }
 };
})();
