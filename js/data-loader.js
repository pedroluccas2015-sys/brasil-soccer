'use strict';
(() => {
 const B=window.BSS;
 B.DataManager=class {
  constructor(){this.teams=[];this.sources=[];}
  async load(){let data=window.BSS_DATA;if(location.protocol!=='file:'){try{const [teams,players,competitions]=await Promise.all(['teams','players','competitions'].map(async name=>{const r=await fetch(`data/${name}.json?v=rosters-16bit-1`);if(!r.ok)throw Error('Dados indisponíveis');return r.json();}));data={teams,players,competitions};}catch{this.offlineFallback=true;}}if(!data)throw Error('Dados locais não encontrados. Execute node tools/build-data.js.');this.raw=data;this.hydrate();}
  hydrate(){const imported=B.safeStorage.get('rosters',{}),byTeam=new Map();for(const p of this.raw.players){if(!byTeam.has(p.teamId))byTeam.set(p.teamId,[]);byTeam.get(p.teamId).push(p);}this.teams=this.raw.teams.map(t=>{const list=imported[t.id]?.players||byTeam.get(t.id)||[];if(list.length<11)throw Error(`Elenco insuficiente: ${t.name}`);const selected=B.Lineup.select(list.map((p,i)=>this.player(p,t.id,i)),t.formation);return {...t,shortName:B.clubCode(t),formation:selected.formation,clubRating:B.clubRating(t.id,this.raw.competitions),players:selected.players,source:imported[t.id]?.source||t.source};});}
  player(p,teamId,i){
   const names=['pace','acceleration','shooting','passing','longPassing','dribbling','control','tackling','strength','stamina','heading','goalkeeping','reflexes','positioning'],random=B.rng(B.hash(p.name+teamId)),role=p.position||'MF',profiles={GK:[52,55,25,62,70,40,65,40,77,66,46,83,83,80],DF:[68,66,45,65,61,55,64,80,80,76,78,15,50,77],MF:[73,73,65,80,78,77,79,65,66,80,60,12,60,75],FW:[82,81,82,69,62,82,79,39,72,73,76,10,66,78]};
   const base=profiles[role]||profiles.MF,club=B.clubRating(teamId,this.raw?.competitions),attributes={};
   names.forEach((n,k)=>{const weight=['pace','acceleration','stamina','strength'].includes(n)?.1:.32;attributes[n]=B.clamp(Math.round((p.attributes?.[n]??base[k]+random()*12-6)+(club.strength-60)*weight),1,99);});
   const roles={GK:'GK',SW:'DF',CB:'DF',LB:'DF',RB:'DF',DM:'MF',CM:'MF',RM:'MF',LM:'MF',AM:'MF',LW:'FW',RW:'FW',SS:'FW',ST:'FW'},positions=[...new Set([role,...(p.alternatePositionCodes||[]).map(code=>roles[code]).filter(Boolean)])];
   const {overall,...record}=p;return {...record,positions,id:p.id||`${teamId}-${i}`,shirtNumber:p.shirtNumber??null,gameNumber:p.shirtNumber??i+1,attributes};
  }
  arrange(list,formation='4-4-2'){return B.Lineup.select(list,formation).players;}
  get(id){return this.teams.find(t=>t.id===id);}
  importRoster(payload){const t=this.teams.find(t=>t.id===payload.team||t.name.toLowerCase()===String(payload.team).toLowerCase());if(!t)throw Error('Clube não encontrado. Use nome ou id de teams.json.');if(payload.season!==2026)throw Error('A temporada deve ser 2026.');if(!Array.isArray(payload.players)||payload.players.length<11||payload.players.length>60)throw Error('O elenco deve ter de 11 a 60 atletas.');const seen=new Set();for(const p of payload.players){if(typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw Error('Nome inválido.');if(seen.has(p.name.toLowerCase()))throw Error('Atleta duplicado.');seen.add(p.name.toLowerCase());if(!['GK','DF','MF','FW'].includes(p.position))throw Error('Posições: GK, DF, MF ou FW.');if(p.shirtNumber!=null&&(!Number.isInteger(p.shirtNumber)||p.shirtNumber<1||p.shirtNumber>99))throw Error('Número deve ser null ou 1 a 99.');}if(!payload.players.some(p=>p.position==='GK'))throw Error('Inclua um goleiro.');const all=B.safeStorage.get('rosters',{});all[t.id]={players:payload.players,source:payload.source||'Importação do usuário',importedAt:new Date().toISOString()};if(!B.safeStorage.set('rosters',all))throw Error('O navegador não permitiu salvar o elenco.');this.hydrate();return t.name;}
 };
})();
