'use strict';
(() => {
 const B=window.BSS;
 B.DisplaySettings=class {
  constructor(){
   this.immersive=false;
   // Enabled by default even when touch detection fails (hybrid devices,
   // embedded browsers and some WebViews misreport maxTouchPoints).
   this.controlsVisible=B.safeStorage.get('virtualControls',true)!==false;
   document.body.classList.toggle('show-touch-controls',this.controlsVisible);
   this.sync=()=>{
    document.body.classList.toggle('fullscreen-mode',!!document.fullscreenElement||this.immersive);
    this.refreshButtons();
   };
   document.addEventListener('fullscreenchange',this.sync);
   document.addEventListener('webkitfullscreenchange',this.sync);
   document.addEventListener('fullscreenerror',()=>this.refreshButtons());
  }
  toolbar(){return `<div class="menu-toolbar" role="group" aria-label="Exibição do jogo"><button id="fullscreen-toggle" type="button" aria-label="Ativar ou desativar tela cheia">⛶ TELA CHEIA</button><button id="controls-toggle" type="button" aria-label="Mostrar ou ocultar controles na tela">🎮 CONTROLES: ON</button></div>`;}
  bind(el){
   const fs=el.querySelector('#fullscreen-toggle'),controls=el.querySelector('#controls-toggle');
   if(fs)fs.addEventListener('click',()=>this.toggleFullscreen());
   if(controls)controls.addEventListener('click',()=>this.toggleControls());
   this.refreshButtons();
  }
  refreshButtons(){
   const fs=document.getElementById('fullscreen-toggle'),controls=document.getElementById('controls-toggle');
   const active=!!document.fullscreenElement||this.immersive;
   if(fs){fs.textContent=active?'⛶ SAIR DA TELA CHEIA':'⛶ TELA CHEIA';fs.setAttribute('aria-pressed',String(active));}
   if(controls){controls.textContent=`🎮 CONTROLES: ${this.controlsVisible?'ON':'OFF'}`;controls.setAttribute('aria-pressed',String(this.controlsVisible));}
  }
  toggleControls(){
   this.controlsVisible=!this.controlsVisible;
   document.body.classList.toggle('show-touch-controls',this.controlsVisible);
   B.safeStorage.set('virtualControls',this.controlsVisible);
   if(!this.controlsVisible)B.app?.touch?.reset();
   this.refreshButtons();
  }
  async toggleFullscreen(){
   if(document.fullscreenElement){
    try{await document.exitFullscreen();}catch{}
    this.immersive=false;this.sync();return;
   }
   if(this.immersive){this.immersive=false;this.sync();return;}
   try{
    if(!document.documentElement.requestFullscreen)throw new Error('Fullscreen API unavailable');
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
    // Browser-supported only. No cropping or forced stretch if rotation is blocked.
    if(screen.orientation?.lock){try{await screen.orientation.lock('landscape');}catch{}}
   }catch{
    // iOS Safari often blocks document-level fullscreen: use a safe viewport
    // filling layout instead, while keeping the game canvas 16:9.
    this.immersive=true;
   }
   this.sync();
  }
 };
})();
