'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function setup(){
 const listeners=new Map();
 class FakeElement{
  constructor(attrs={}){
   this.listeners=new Map();this.attrs=attrs;this.classes=new Set();this.dataset={};
   this.classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name),contains:name=>this.classes.has(name),toggle:(name,value)=>value?this.classes.add(name):this.classes.delete(name)};
  }
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(fn);}
  dispatch(name,extra={}){const evt={pointerId:99,clientX:0,clientY:0,preventDefault(){},...extra};for(const fn of this.listeners.get(name)||[])fn(evt);}
  setPointerCapture(){}
  setAttribute(name,value){this.attrs[name]=value;}
  getBoundingClientRect(){return {left:0,top:0,width:150,height:150};}
 }
 const actions=['pass','shoot','long','sprint','switch','context','pause'];
 const buttons=actions.map(action=>{const b=new FakeElement();b.dataset.touchAction=action;return b;});
 const arrows=Object.fromEntries(['up','down','left','right'].map(d=>[d,new FakeElement()]));
 const pad=new FakeElement();pad.querySelector=s=>arrows[s.match(/"(\w+)"/)[1]];
 const root=new FakeElement();root.querySelector=s=>s==='#touch-dpad'?pad:null;
 root.querySelectorAll=s=>s==='[data-touch-action]'?buttons:[...buttons,...Object.values(arrows)].filter(a=>a.classes.has('is-pressed'));
 const body=new FakeElement();body.classList.add('playing');
 const document={body,hidden:false, getElementById:()=>root,addEventListener(){}};
 const ctx={document,window:null, navigator:{maxTouchPoints:5,getGamepads:()=>[]},performance:{now:()=>1000},matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(name,fn){listeners.set(name,fn)},console,Set,Map,Object,Math};
 ctx.window=ctx;ctx.BSS={safeStorage:{get:()=>({}),set:()=>true},norm:(x,y)=>{const len=Math.hypot(x,y)||1;return {x:x/len,y:y/len};}};
 vm.createContext(ctx);
 for(const name of ['input','touch-controls'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,`../js/${name}.js`),'utf8'),ctx);
 const input=new ctx.BSS.InputManager();
 const touch=new ctx.BSS.TouchControls(input);
 return {input,touch,pad,buttons:Object.fromEntries(actions.map((a,i)=>[a,buttons[i]])),arrows,root,body,ctx};
}

test('mobile: 11 comandos equivalentes ao teclado e acionamento multitoque',()=>{
 const {input,pad,buttons}=setup();
 pad.dispatch('pointerdown',{pointerId:1,clientX:136,clientY:75});
 input.poll(1/60);assert.equal(input.state.right,true);assert.equal(input.axis.x,1);
 buttons.sprint.dispatch('pointerdown',{pointerId:2});
 buttons.shoot.dispatch('pointerdown',{pointerId:3});
 input.poll(1/60);assert.equal(input.state.right,true);assert.equal(input.state.sprint,true);assert.equal(input.state.shoot,true);assert.equal(input.pressed.shoot,true);
 input.poll(1/60);assert.ok(input.hold.shoot>0);
 buttons.shoot.dispatch('pointerup',{pointerId:3});input.poll(1/60);
 assert.equal(input.released.shoot,true);assert.equal(input.state.sprint,true);assert.equal(input.state.right,true);
 buttons.sprint.dispatch('pointerup',{pointerId:2});pad.dispatch('pointerup',{pointerId:1});input.poll(1/60);
 assert.equal(input.state.right,false);assert.equal(input.state.sprint,false);
});

test('mobile: diagonais, troca de direção e arrasto pelo direcional',()=>{
 const {input,pad}=setup();
 pad.dispatch('pointerdown',{pointerId:1,clientX:120,clientY:30});input.poll(1/60);
 assert.ok(input.axis.x>.65&&input.axis.y<-.65);
 pad.dispatch('pointermove',{pointerId:1,clientX:75,clientY:120});input.poll(1/60);
 assert.equal(input.axis.x,0);assert.equal(input.axis.y,1);
 pad.dispatch('pointercancel',{pointerId:1});input.poll(1/60);
 assert.equal(input.axis.y,0);
});

test('mobile: toque rápido entre frames produz pressionamento e soltura',()=>{
 const {input,buttons}=setup();
 buttons.pass.dispatch('pointerdown',{pointerId:9});buttons.pass.dispatch('pointerup',{pointerId:9});
 input.poll(1/60);
 assert.equal(input.state.pass,false);assert.equal(input.pressed.pass,true);assert.equal(input.released.pass,true);
 input.poll(1/60);assert.equal(input.pressed.pass,false);assert.equal(input.released.pass,false);
});

test('mobile: pausa, remapeamento teclado, limpeza e pênaltis',()=>{
 const {input,touch,buttons,pad,body}=setup();
 input.bind('shoot','KeyU');buttons.shoot.dispatch('pointerdown',{pointerId:2});
 buttons.context.dispatch('pointerdown',{pointerId:3});
 pad.dispatch('pointerdown',{pointerId:4,clientX:135,clientY:20});
 input.poll(1/60);
 assert.equal(input.state.shoot,true);assert.equal(input.state.context,true);
 assert.ok(input.axis.x>0&&input.axis.y<0);
 buttons.pause.dispatch('pointerdown',{pointerId:5});input.poll(1/60);
 assert.equal(input.pressed.pause,true);
 body.classList.add('ui-open');touch.reset();input.poll(1/60);
 for(const name of Object.keys(input.bindings))assert.equal(input.state[name],false,name);
 buttons.pass.dispatch('pointerdown',{pointerId:6});input.poll(1/60);assert.equal(input.state.pass,false);
});
