'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
global.window=global;const store=new Map(),elements=new Map(),bodyClasses=new Set();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
global.document={getElementById:id=>elements.get(id),body:{classList:{add:n=>bodyClasses.add(n)}}};
class FakeContext{
 constructor(){this.currentTime=10;this.sampleRate=44100;this.destination={};this.buffers=[];this.sources=[];this.oscillators=[];this.resumes=0;}
 resume(){this.resumes++;return Promise.resolve();}
 createBuffer(channels,length,rate){const data=new Float32Array(length),buffer={length,sampleRate:rate,duration:length/rate,getChannelData:()=>data};this.buffers.push(buffer);return buffer;}
 createBufferSource(){const s={buffer:null,connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};this.sources.push(s);return s;}
 createGain(){return {gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createOscillator(){const o={frequency:{value:0},connect(){},start(){},stop(){}};this.oscillators.push(o);return o;}
}
global.AudioContext=FakeContext;
for(const file of ['engine','menu-sounds','audio','ui'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'));
const B=BSS;
test('recortes são distintos, têm PCM válido e conferem com os hashes da referência',()=>{
 const samples=B.MENU_SAMPLES;assert.equal(samples.source,'https://www.youtube.com/watch?v=KxBt3xwYJXs');assert.equal(samples.sampleRate,22050);assert.deepEqual(Object.keys(samples.samples).sort(),['back','confirm','move']);
 const hashes=new Set();for(const [name,value] of Object.entries(samples.samples)){const bytes=Buffer.from(value,'base64'),hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,samples.segments[name].sha256);assert.equal(bytes.length%2,0);assert.ok(bytes.length/samples.sampleRate/2>.1&&bytes.length/samples.sampleRate/2<1);assert.equal(bytes.readInt16LE(0),0);assert.equal(bytes.readInt16LE(bytes.length-2),0);hashes.add(hash);}assert.equal(hashes.size,3);
});
test('primeiro gesto prepara os três buffers uma vez e toca o recorte correto',()=>{
 store.clear();const a=new B.AudioManager();assert.equal(a.enabled,true);assert.equal(a.ctx,null);a.start();const ctx=a.ctx;assert.equal(ctx.buffers.length,3);a.play('menu-confirm');assert.equal(ctx.sources.at(-1).buffer,a.menuBuffers.get('confirm'));assert.ok(ctx.sources.at(-1).started);a.start();assert.equal(ctx.buffers.length,3);a.play('menu-back');assert.equal(ctx.sources.at(-1).buffer,a.menuBuffers.get('back'));assert.equal(ctx.oscillators.length,0);
 for(const b of a.menuBuffers.values()){assert.ok([...b.getChannelData(0)].some(x=>Math.abs(x)>.1));assert.ok([...b.getChannelData(0)].every(x=>Number.isFinite(x)&&Math.abs(x)<.86));}
});
test('mute interrompe vozes, impede novos sons e persiste entre sessões',()=>{
 store.clear();const button={textContent:'',setAttribute(k,v){this[k]=v;}};elements.set('sound-toggle',button);const a=new B.AudioManager();a.start();a.play('menu-confirm');const source=a.ctx.sources.at(-1);a.setEnabled(false);assert.equal(source.stopped,true);const count=a.ctx.sources.length;a.play('menu-back');assert.equal(a.ctx.sources.length,count);assert.equal(button.textContent,'SOM OFF');assert.equal(new B.AudioManager().enabled,false);a.setEnabled(true);assert.equal(button.textContent,'SOM ON');a.play('menu-back');assert.equal(a.ctx.sources.length,count+1);
});
test('navegação rápida é limitada sem bloquear confirmação ou volta',()=>{
 store.clear();const a=new B.AudioManager();a.start();a.play('menu-move');a.play('menu-move');assert.equal(a.ctx.sources.length,1);a.play('menu-confirm');a.play('menu-back');assert.equal(a.ctx.sources.length,3);a.ctx.currentTime+=.1;a.play('menu-move');assert.equal(a.ctx.sources.length,4);a.play('menu-confirm');assert.equal(a.menuVoices.size,4);assert.equal(a.ctx.sources[0].stopped,true);
});
test('modos confirmam e voltar cancela; seletores nativos têm um evento por mudança',()=>{
 const calls=[],root={listeners:new Map(),addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(fn);}};
 const ui=Object.create(B.UI.prototype);ui.el=root;ui.app={audio:{start(){},play:n=>calls.push(n)},display:{toolbar:()=>'',bind(){}},input:{}};
 for(const id of ['mode-quick','back','exit-confirm'])elements.set(id,{});ui.click('mode-quick',()=>{});ui.click('back',()=>{});ui.click('exit-confirm',()=>{});elements.get('mode-quick').onclick();elements.get('back').onclick();elements.get('exit-confirm').onclick();assert.deepEqual(calls,['menu-confirm','menu-back','menu-back']);
 for(let i=0;i<6;i++)ui.show('');assert.equal(root.listeners.get('change').length,1);calls.length=0;for(const id of ['home-team','away-team','competition-id','difficulty'])root.listeners.get('change')[0]({target:{id}});assert.deepEqual(calls,['menu-confirm','menu-confirm','menu-confirm']);
});
test('sem AudioContext não bloqueia navegação, e amostras ausentes têm fallback',()=>{
 const Context=global.AudioContext;global.AudioContext=undefined;const a=new B.AudioManager();assert.doesNotThrow(()=>{a.start();a.play('menu-confirm');});global.AudioContext=Context;const samples=B.MENU_SAMPLES;B.MENU_SAMPLES=null;const b=new B.AudioManager();b.start();assert.doesNotThrow(()=>b.play('menu-back'));assert.ok(b.ctx.oscillators.length>0);B.MENU_SAMPLES=samples;
});
test('falha no dispositivo não bloqueia voltar e contexto encerrado é recriado',()=>{
 let returned=false;const ui=Object.create(B.UI.prototype);ui.app={audio:{start(){},play(){throw new Error('Dispositivo indisponível');}}};elements.set('back',{});ui.click('back',()=>returned=true);assert.doesNotThrow(()=>elements.get('back').onclick());assert.equal(returned,true);
 store.clear();const a=new B.AudioManager();a.start();const old=a.ctx;a.lastMenuMove=100;old.state='closed';a.start();assert.notEqual(a.ctx,old);assert.equal(a.ctx.buffers.length,3);a.play('menu-back');assert.ok(a.ctx.sources.at(-1).started);a.play('menu-move');assert.equal(a.ctx.sources.at(-1).buffer,a.menuBuffers.get('move'));
});
