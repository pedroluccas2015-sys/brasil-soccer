'use strict';
(() => {
 const B=window.BSS;
 B.KEY_PRESETS={classic:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',pass:'KeyZ',shoot:'KeyX',long:'KeyC',sprint:'KeyA',switch:'KeyS',context:'KeyD',pause:'Escape'},wasd:{up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',pass:'KeyJ',shoot:'KeyK',long:'KeyL',sprint:'ShiftLeft',switch:'KeyQ',context:'KeyE',pause:'Escape'}};
 B.InputManager=class {
  constructor(){this.keys={};this.downQueue=new Set();this.upQueue=new Set();this.bindings={...B.KEY_PRESETS.classic,...B.safeStorage.get('controls',{})};this.prev={};this.state={};this.pressed={};this.released={};this.hold={};this.rebind=null;this.lastTap={};this.dash=false;this.gamepadName='';this.enabled=false;this.virtual={};this.touchDownQueue=new Set();this.touchUpQueue=new Set();
   addEventListener('keydown',e=>{if(this.rebind){e.preventDefault();const f=this.rebind;this.rebind=null;f(e.code);return;}if(e.repeat)return;if(this.enabled&&Object.values(this.bindings).includes(e.code))e.preventDefault();this.keys[e.code]=true;this.downQueue.add(e.code);const now=performance.now();if(['up','down','left','right'].some(a=>this.bindings[a]===e.code)){if(now-(this.lastTap[e.code]||0)<260)this.dash=true;this.lastTap[e.code]=now;}if(e.code==='F2'){e.preventDefault();if(B.app)B.app.debug=!B.app.debug;}});
   addEventListener('keyup',e=>{this.keys[e.code]=false;this.upQueue.add(e.code);});addEventListener('blur',()=>{this.clear();if(this.onBlur)this.onBlur();});
  }
  setVirtual(action,down){
   if(!Object.hasOwn(this.bindings,action))return;
   if(!!this.virtual[action]===!!down)return;
   this.virtual[action]=!!down;
   (down?this.touchDownQueue:this.touchUpQueue).add(action);
  }
  clearVirtual(){this.virtual={};this.touchDownQueue.clear();this.touchUpQueue.clear();}
  clear(){this.clearVirtual();this.keys={};this.prev={};this.state={};this.pressed={};this.released={};this.hold={};this.downQueue.clear();this.upQueue.clear();}
  poll(dt){let pad=null;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);}catch{}this.gamepadName=pad?.id||'';const pk=B.app?.match?.state==='penalty';this.padBlock??=new Set();if(this.penaltyMode!==undefined&&this.penaltyMode!==pk)for(const n of [0,1,2,3])if(pad?.buttons[n]?.pressed)this.padBlock.add(n);this.penaltyMode=pk;for(const n of this.padBlock)if(!pad?.buttons[n]?.pressed)this.padBlock.delete(n);const pm={pass:pk?2:0,shoot:pk?0:2,long:1,sprint:5,switch:4,context:3,pause:9};for(const [a,key] of Object.entries(this.bindings)){let down=!!this.keys[key]||!!this.virtual[a];if(pad&&pm[a]!==undefined)down ||= !!pad.buttons[pm[a]]?.pressed&&!this.padBlock.has(pm[a]);this.state[a]=down;this.pressed[a]=down&&!this.prev[a]||this.downQueue.has(key)||this.touchDownQueue.has(a);this.released[a]=!down&&!!this.prev[a]||this.upQueue.has(key)||this.touchUpQueue.has(a);if(down)this.hold[a]=(this.hold[a]||0)+dt;else if(!this.released[a])this.hold[a]=0;this.prev[a]=down;}this.downQueue.clear();this.upQueue.clear();this.touchDownQueue.clear();this.touchUpQueue.clear();
   let x=(this.state.right?1:0)-(this.state.left?1:0),y=(this.state.down?1:0)-(this.state.up?1:0);if(pad){x+=(Math.abs(pad.axes[0])>.18?pad.axes[0]:0)+(pad.buttons[15]?.pressed?1:0)-(pad.buttons[14]?.pressed?1:0);y+=(Math.abs(pad.axes[1])>.18?pad.axes[1]:0)+(pad.buttons[13]?.pressed?1:0)-(pad.buttons[12]?.pressed?1:0);}this.axis=B.norm(x,y);return this;
  }
  bind(action,key){const other=Object.keys(this.bindings).find(a=>this.bindings[a]===key);if(other)this.bindings[other]=this.bindings[action];this.bindings[action]=key;B.safeStorage.set('controls',this.bindings);}
 };
})();
