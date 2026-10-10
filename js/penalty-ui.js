'use strict';
(() => {
 const B=window.BSS,esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 B.UI.prototype.penaltySetup=function(){
  const s=this.setup,roster=this.app.data.get(s.human===1?s.away:s.home).players,keepers=roster.filter(p=>p.position==='GK'),field=roster.filter(p=>p.position!=='GK');
  if(!s.penaltyOrder||s.penaltyOrder.some(id=>!field.some(p=>p.id===id)))s.penaltyOrder=[...field].sort((a,b)=>b.attributes.shooting-a.attributes.shooting).slice(0,9).map(p=>p.id);
  if(!keepers.some(p=>p.id===s.penaltyKeeper))s.penaltyKeeper=keepers[0].id;
  const options=(list,id)=>list.map(p=>`<option value="${esc(p.id)}" ${p.id===id?'selected':''}>${esc(p.name)}</option>`).join('');
  this.show(`${this.head('DUELO NA MARCA DA CAL','Goleiro & cobradores')}<p class="sub">Escolha o goleiro e a ordem dos nove cobradores. Os cinco primeiros iniciam a disputa; se houver empate, as cobranças continuam alternadas.</p><div class="panel"><label for="penalty-keeper">SEU GOLEIRO</label><select id="penalty-keeper">${options(keepers,s.penaltyKeeper)}</select></div><div class="settings-grid">${s.penaltyOrder.map((id,i)=>`<div><label for="penalty-order-${i}">${i+1}º COBRADOR</label><select id="penalty-order-${i}" data-penalty-order="${i}">${options(field,id)}</select></div>`).join('')}</div><p class="notice">Segure a direção e aperte: Passe = fraco · Chute = médio · Lançamento = forte. Contextual + direção faz a finta. Defenda com direção + Chute ou Lançamento.</p><div class="button-row"><button id="start" class="primary">COMEÇAR A DISPUTA →</button></div>`);
  this.click('back',()=>s.competition?this.competition():this.selection());
  document.getElementById('penalty-keeper').onchange=e=>s.penaltyKeeper=e.target.value;
  this.el.querySelectorAll('[data-penalty-order]').forEach(el=>el.onchange=()=>{const i=+el.dataset.penaltyOrder,j=s.penaltyOrder.indexOf(el.value),old=s.penaltyOrder[i];s.penaltyOrder[i]=el.value;if(j>=0&&j!==i)s.penaltyOrder[j]=old;this.penaltySetup();});
  this.click('start',()=>{const chosen=s.penaltyOrder.map(id=>field.find(p=>p.id===id));s.lineup=[keepers.find(p=>p.id===s.penaltyKeeper),...chosen,...field.filter(p=>!s.penaltyOrder.includes(p.id)),...keepers.filter(p=>p.id!==s.penaltyKeeper)];this.app.start(s.home,s.away,{...s});});
 };
})();
