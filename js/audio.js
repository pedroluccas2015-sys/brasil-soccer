'use strict';
window.BSS.AudioManager=class {
 constructor(){this.enabled=window.BSS.safeStorage.get('audio-enabled',true)!==false;this.ctx=null;this.musicTime=0;this.note=0;this.volume=.2;this.menuBuffers=new Map();this.menuVoices=new Set();this.lastMenuMove=-Infinity;}
 start(){try{if(!this.ctx||this.ctx.state==='closed'){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.menuBuffers.clear();this.menuVoices.clear();this.lastMenuMove=-Infinity;}this.ctx.resume()?.catch?.(()=>{});this.prepareMenuBuffers();}catch{} }
 setEnabled(enabled){this.enabled=!!enabled;window.BSS.safeStorage.set('audio-enabled',this.enabled);if(!this.enabled)for(const voice of this.menuVoices){try{voice.stop();}catch{}}this.refreshToggle();}
 refreshToggle(){const button=document.getElementById('sound-toggle');if(button){button.textContent=this.enabled?'SOM ON':'SOM OFF';button.setAttribute('aria-pressed',String(this.enabled));}}
 prepareMenuBuffers(){
  const samples=window.BSS.MENU_SAMPLES;if(!this.ctx||!samples||this.menuBuffers.size)return;
  for(const [name,encoded] of Object.entries(samples.samples)){const bytes=atob(encoded),count=bytes.length/2,buffer=this.ctx.createBuffer(1,count,samples.sampleRate),channel=buffer.getChannelData(0);for(let i=0;i<count;i++){let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);if(value>=32768)value-=65536;channel[i]=value/32768;}this.menuBuffers.set(name,buffer);}
 }
 menuSound(name='confirm'){
  if(!this.enabled||!this.ctx)return;const now=this.ctx.currentTime;if(name==='move'&&now-this.lastMenuMove<.055)return;if(name==='move')this.lastMenuMove=now;
  const buffer=this.menuBuffers.get(name)||this.menuBuffers.get('confirm');
  if(!buffer){if(name==='back'){this.tone(640,.08,'triangle',.4);this.tone(360,.1,'sine',.3,.035);}else{this.tone(880,.075,'triangle',.3);this.tone(1320,.055,'sine',.2,.018);}return;}
  if(this.menuVoices.size>=4){const oldest=this.menuVoices.values().next().value;this.menuVoices.delete(oldest);try{oldest.stop();}catch{}}
  const voice=this.ctx.createBufferSource(),gain=this.ctx.createGain();voice.buffer=buffer;gain.gain.value=this.volume*(name==='move'?.65:1);voice.connect(gain);gain.connect(this.ctx.destination);this.menuVoices.add(voice);voice.onended=()=>{this.menuVoices.delete(voice);voice.disconnect();gain.disconnect();};voice.start();
 }
 tone(freq,duration,type='square',volume=.13,delay=0){if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume*this.volume,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration+.01);}
 noise(duration,vol){if(!this.enabled||!this.ctx)return;const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*duration,this.ctx.sampleRate),a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,.7);const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1700;s.buffer=buffer;g.gain.value=vol*this.volume;s.connect(filter);filter.connect(g);g.connect(this.ctx.destination);s.start();}
 play(name){if(name==='menu'||name.startsWith('menu-')){this.menuSound(name==='menu'?'confirm':name.slice(5));return;}if(name==='whistle'){this.tone(2200,.22,'sine',.28);this.tone(2550,.22,'sine',.12,.06);}else if(name==='goal'){this.noise(2,.8);[523,659,784,1046].forEach((f,i)=>this.tone(f,.3,'square',.17,i*.12));}else if(name==='post'){this.tone(330,.35,'triangle',.6);}else if(name==='save'){this.noise(.16,.3);}else if(name==='kick'){this.tone(95,.09,'triangle',.8);this.noise(.05,.3);}else this.tone(150,.05,'triangle',.35);}
 update(dt,menu){if(!this.enabled)return;this.musicTime-=dt;if(this.musicTime<=0){this.musicTime=menu?.22:2.8;if(menu){const melody=[64,67,71,67,62,66,69,74,64,71,69,67,62,66,64,59];const n=melody[this.note++%melody.length];this.tone(440*Math.pow(2,(n-69)/12),.16,'square',.065);if(this.note%2===0)this.tone(110*Math.pow(2,([0,0,5,7][Math.floor(this.note/4)%4])/12),.19,'triangle',.12);}else this.noise(.8,.08);}}
};
