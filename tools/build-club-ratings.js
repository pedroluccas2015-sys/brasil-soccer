'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const teams=read('data/teams.json'),competitions=read('data/competitions.json'),crests=read('data/crest-sources.json').crests,cbf=read('data/rankings/cbf-2026.json'),con=read('data/rankings/conmebol-2026.json');
const countries={brazil:'Brasil',argentina:'Argentina',bolivia:'Bolivia',chile:'Chile',colombia:'Colombia',ecuador:'Ecuador',paraguay:'Paraguay',peru:'Perú',uruguay:'Uruguay',venezuela:'Venezuela'};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\b(aa|ad|ae|ca|cd|ce|cs|ec|fc|sc|fr|ac|cf|cfc|rc|esporte|clube|futebol|club|football|associacao|atletico|sport|de|do|da|e|esportiva|desportiva|sporting|clubes|esportivo|sociedade|recreativo)\b/g,' ').replace(/\s+/g,' ').trim();
const aliases={
 'tm-25229':{cbf:['Atlético','BA']},'tm-38023':{cbf:['Capital','DF']},'tm-60520':{cbf:['Operário','MT']},'tm-27837':{cbf:['Atlético','CE']},'tm-87817':{cbf:['Fluminense','PI']},'tm-87822':{cbf:['GAS','RR']},'tm-80647':{cbf:['Sãojoseense','PR']},'tm-22782':{cbf:['Nacional','AM']},'tm-32386':{cbf:['Operário','MS']},'tm-30489':{cbf:['Rio Branco','ES']},'tm-23778':{cbf:['Imperatriz','MA']},'tm-28199':{cbf:['União','MT']},'tm-32934':{cbf:['Vitória','ES']},
 'tm-45193':{conmebol:'Puerto Cabello'},'tm-17428':{conmebol:'Juventud de Las Piedras'},'tm-1775':{conmebol:'San Lorenzo'}
};
// Explicit identities prevent Botafogo-SP/PB, Fluminense-PI and Vitória-ES
// inheriting the continental history of homonymous first-division clubs.
const conBrazil={palmeiras:'Palmeiras',flamengo:'Flamengo','atletico-mg':'Atlético Mineiro','sao-paulo':'São Paulo',fluminense:'Fluminense',athletico:'Athletico Paranaense',internacional:'Internacional',gremio:'Grêmio',botafogo:'Botafogo',corinthians:'Corinthians',santos:'Santos',cruzeiro:'Cruzeiro','tm-10870':'Fortaleza EC',bragantino:'Red Bull Bragantino',vasco:'Vasco da Gama',bahia:'Bahia','tm-15172':'Atlético Goianiense','tm-2029':'Ceará','tm-2863':'América Mineiro','tm-28022':'Cuiabá','tm-3197':'Goiás',chapecoense:'Chapecoense',vitoria:'Vitória','tm-1755':'Guarani FC','tm-8718':'Sport','tm-1134':'Ponte Preta',coritiba:'Coritiba','tm-7178':'Criciúma','tm-6347':'Paysandu','tm-10492':'Juventude','tm-2646':'Náutico','tm-1785':'Santa Cruz','tm-2035':'Avaí','tm-4064':'Figueirense','tm-10247':'Portuguesa','tm-3330':'Joinville',mirassol:'Mirassol'};
const direct=Object.fromEntries(competitions.cbfRanking.map((id,i)=>[id,cbf.entries[i]]));
const clubs={},unmatched=[];
for(const team of teams){
 const asset=crests[team.id]?.upstream||'logos/brazil/Castanhal.svg',country=countries[asset.split('/')[1]],names=[team.name,asset.split('/').at(-1).replace('.svg','').replace(/_/g,' '),aliases[team.id]?.conmebol].filter(Boolean).map(normalize).filter(Boolean);
 const find=rows=>{const exact=rows.filter(r=>names.includes(normalize(r.name)));return exact.length===1?exact[0]:null;};
 const domestic=country==='Brasil'?(direct[team.id]||(aliases[team.id]?.cbf?cbf.entries.find(r=>r.name===aliases[team.id].cbf[0]&&r.federation===aliases[team.id].cbf[1]):find(cbf.entries))):null,continental=country==='Brasil'?con.entries.find(r=>r.country===country&&r.name===conBrazil[team.id]):find(con.entries.filter(r=>r.country===country));
 const normalized=(points,max)=>20+80*Math.sqrt(Math.max(0,points)/max);
 const cbfStrength=domestic?normalized(domestic.points,16314):null,conStrength=continental?.points>0?normalized(continental.points,9828.6):null;
 const strength=Math.round((cbfStrength!=null?(conStrength!=null?cbfStrength*.75+conStrength*.25:cbfStrength):conStrength??20)*100)/100;
 clubs[team.id]={strength,stars:Math.min(5,1+Math.floor(Math.max(0,strength-20)/16)),country,cbf:domestic?{position:domestic.position,points:domestic.points,name:domestic.name,federation:domestic.federation}:null,conmebol:continental?{position:continental.position,points:continental.points,name:continental.name}:null,status:domestic||continental?.position?'ranked':'unranked'};
 if(!domestic&&country==='Brasil'||!continental&&country!=='Brasil')unmatched.push({id:team.id,name:team.name,country,asset});
}
competitions.clubRatings={version:1,edition:2026,checkedAt:'2026-11-12',sources:{cbf:cbf.source,conmebol:con.source},method:'CBF e CONMEBOL normalizados: 20 + 80 * sqrt(pontos/líder). Brasileiros: 75% CBF + 25% CONMEBOL quando ambos disponíveis; estrangeiros: CONMEBOL. Ausência de ranking: força 20, sem posição oficial. Estrelas em faixas de 16 pontos.',clubs};
fs.writeFileSync(path.join(root,'data/competitions.json'),JSON.stringify(competitions,null,2)+'\n');
console.log(JSON.stringify({distribution:Object.values(clubs).reduce((a,r)=>(a[r.stars]=(a[r.stars]||0)+1,a),{}),unmatched},null,2));
