'use strict';
(() => {
 const B=window.BSS,UI=B.UI.prototype;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const show=UI.show,selection=UI.selection,competitionSelection=UI.competitionSelection;
 UI.show=function(html){this.el.classList.remove('club-selection');show.call(this,html);this.bindCrests();};
 UI.crest=function(t,small=false){return `<span class="crest-badge ${small?'crest-small':''}" style="--club-primary:${esc(t.primaryColor)};--club-secondary:${esc(t.secondaryColor)}"><span class="crest-fallback" aria-hidden="true">${esc(t.shortName)}</span>${t.crest?`<img src="${esc(t.crest)}" alt="Escudo de ${esc(t.name)}" loading="lazy" decoding="async">`:''}</span>`;};
 UI.bindCrests=function(){this.el.querySelectorAll('.crest-badge img').forEach(img=>{img.addEventListener('error',()=>{img.hidden=true;img.parentElement.classList.add('crest-unavailable');},{once:true});});};
 UI.clubCard=function(id){const t=this.app.data.get(id);return `<div class="club-card broadcast-club">${this.crest(t)}<div><span class="club-kicker">${esc(t.shortName)} / TEMPORADA 2026</span><h3>${esc(t.name)}</h3><p>${esc(t.city||'Futebol sul-americano')}${t.stadium?' · '+esc(t.stadium):''}</p><p>${t.players.length} atletas · ${esc(t.formation)}</p><span class="club-rating">${'★'.repeat(Math.max(1,Math.min(5,Math.round(t.players.slice(0,11).reduce((n,p)=>n+p.overall,0)/11/18))))}</span></div></div>`;};
 UI.selection=function(){selection.call(this);this.enhanceClubSelection();};
 UI.competitionSelection=function(){competitionSelection.call(this);this.enhanceClubSelection();};
 UI.enhanceClubSelection=function(){
  const root=this.el;if(root.classList.contains('club-selection')||!root.querySelector('#home-team'))return;
  root.classList.add('club-selection');this.clubLeagues??={};
  const competition=root.querySelector('#competition-id');
  if(competition){
   const rail=document.createElement('nav');rail.className='league-rail competition-rail';rail.setAttribute('aria-label','Selecionar competição');
   for(const option of competition.options){const b=document.createElement('button');b.type='button';b.textContent=option.text.replace(/ 2026$/,'');b.setAttribute('aria-pressed',String(option.selected));b.onclick=()=>{competition.value=option.value;competition.onchange({target:competition});};rail.append(b);}
   competition.before(rail);
  }
  for(const id of ['home-team','away-team']){
   const select=root.querySelector('#'+id);if(!select)continue;
   const host=document.createElement('div');host.className='club-browser';select.before(host);
   const grid=document.createElement('div');grid.className='crest-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label',id==='home-team'?'Escolher seu clube':'Escolher adversário');
   const defs=this.app.competition.definitions().filter(d=>d.id!=='copa-brasil');
   const groups=[...defs.map(d=>({id:d.id,name:d.name.replace('Brasileirão ','').replace(' 2026',''),ids:d.teams})),{id:'all',name:'Todos os clubes',ids:this.app.data.teams.map(t=>t.id)}];
   let group=this.clubLeagues[id]||groups.find(g=>g.ids.includes(select.value))?.id||'all';
   const rail=document.createElement('nav');rail.className='league-rail';rail.setAttribute('aria-label','Selecionar liga');
   const oldChange=select.onchange;
   const paint=()=>{
    const ids=competition?Array.from(select.options).filter(o=>!o.hidden).map(o=>o.value):groups.find(g=>g.id===group).ids;
    grid.innerHTML=ids.map(tid=>this.app.data.get(tid)).filter(Boolean).map(t=>`<button type="button" class="crest-choice" data-club="${esc(t.id)}" aria-pressed="${t.id===select.value}" aria-label="${esc(t.name)}" title="${esc(t.name)}">${this.crest(t,true)}<span>${esc(t.shortName)}</span></button>`).join('');
    grid.querySelectorAll('[data-club]').forEach(b=>{b.onclick=()=>{this.app.audio.start();this.app.audio.play('menu');select.value=b.dataset.club;select.onchange({target:select});};b.onkeydown=e=>{const buttons=[...grid.querySelectorAll('button')],index=buttons.indexOf(b),columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length,delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns}[e.key];if(delta){e.preventDefault();buttons[B.clamp(index+delta,0,buttons.length-1)]?.focus();}};});
    rail.querySelectorAll('[data-league]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.league===group)));this.bindCrests();
   };
   select.onchange=e=>{oldChange?.(e);if(!competition&&!groups.find(g=>g.id===group).ids.includes(select.value)){group=groups.find(g=>g.ids.includes(select.value))?.id||'all';this.clubLeagues[id]=group;}if(root.contains(grid))paint();this.bindCrests();};
   const search=competition&&root.querySelector('#club-search');if(search){const oldSearch=search.oninput;search.oninput=e=>{oldSearch?.(e);paint();};}
   if(!competition){for(const g of groups){const b=document.createElement('button');b.type='button';b.textContent=g.name;b.dataset.league=g.id;b.onclick=()=>{group=g.id;this.clubLeagues[id]=group;if(!g.ids.includes(select.value)){select.value=g.ids[0];select.onchange({target:select});}paint();};rail.append(b);}host.append(rail);}
   host.append(grid);paint();
   const hint=document.createElement('p');hint.className='selection-hint';hint.textContent='ESCOLHA O ESCUDO · SETAS PARA NAVEGAR · ENTER PARA CONFIRMAR';host.after(hint);
  }
  this.bindCrests();
 };
})();
