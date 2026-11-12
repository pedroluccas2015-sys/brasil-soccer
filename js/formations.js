'use strict';
(() => {
 const B=window.BSS;
 B.FORMATIONS={};
 for(const [name,rows] of Object.entries({'4-4-2':[4,4,2],'4-3-3':[4,3,3],'4-2-3-1':[4,2,3,1],'4-1-4-1':[4,1,4,1],'3-5-2':[3,5,2],'3-4-3':[3,4,3],'5-3-2':[5,3,2]})){
  const points=[{x:.055,y:.5,role:'GK'}];rows.forEach((n,row)=>{for(let i=0;i<n;i++)points.push({x:.23+row*(.49/(rows.length-1)),y:(i+1)/(n+1),role:row===0?'DF':row===rows.length-1?'FW':'MF'});});B.FORMATIONS[name]=points;
 }
 B.Lineup={
  supports(p,role){return p.position===role||p.positions?.includes(role);},
  slots(formation){const points=B.FORMATIONS[formation];return points.map((p,i)=>{const row=points.filter(q=>q.x===p.x),at=row.indexOf(p),edge=at===0||at===row.length-1;let code=p.role==='GK'?'GK':p.role==='DF'?(row.length>=4&&edge?(at===0?'LB':'RB'):'CB'):p.role==='FW'?(row.length===3&&edge?(at===0?'LW':'RW'):'ST'):row.length>=4&&edge?(at===0?'LM':'RM'):p.x<.4?'DM':p.x>.5?'AM':'CM';return {...p,code};});},
  assign(records,formation){
   const slots=this.slots(formation),n=slots.length,m=records.length;if(m<n)return null;
   const compatible=(p,s)=>this.supports(p,s.role),cost=(p,s,index)=>{if(!compatible(p,s))return 10000+index;const codes=[p.positionCode,...(p.alternatePositionCodes||[])],specific=!p.positionCode||p.positionCode===p.position?8:p.positionCode===s.code?0:codes.includes(s.code)?8:['LM','RM'].includes(s.code)&&p.positionCode==='AM'?6:s.code==='CM'&&p.positionCode==='DM'?4:18;return (p.position===s.role?0:40)+specific+index*.08;};
   // Rectangular minimum-cost assignment: each athlete can occupy only one suitable slot.
   const u=Array(n+1).fill(0),v=Array(m+1).fill(0),matched=Array(m+1).fill(0),way=Array(m+1).fill(0);
   for(let i=1;i<=n;i++){matched[0]=i;let j0=0;const min=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);
    do{used[j0]=true;const i0=matched[j0];let delta=Infinity,j1=0;for(let j=1;j<=m;j++)if(!used[j]){const c=cost(records[j-1],slots[i0-1],j-1)-u[i0]-v[j];if(c<min[j]){min[j]=c;way[j]=j0;}if(min[j]<delta){delta=min[j];j1=j;}}
     for(let j=0;j<=m;j++){if(used[j]){u[matched[j]]+=delta;v[j]-=delta;}else min[j]-=delta;}j0=j1;
    }while(matched[j0]!==0);
    do{const j1=way[j0];matched[j0]=matched[j1];j0=j1;}while(j0);
   }
   const first=Array(n);for(let j=1;j<=m;j++)if(matched[j])first[matched[j]-1]=records[j-1];
   return {formation,players:[...first,...records.filter(p=>!first.includes(p))],valid:first.every((p,i)=>compatible(p,slots[i])),cost:-v[0]};
  },
  select(records,requested='4-4-2'){
   if(!B.FORMATIONS[requested])requested='4-4-2';const exact=this.assign(records,requested);if(exact?.valid)return exact;
   const wanted=this.slots(requested),difference=name=>{const slots=this.slots(name);return ['DF','MF','FW'].reduce((sum,role)=>sum+Math.abs(slots.filter(p=>p.role===role).length-wanted.filter(p=>p.role===role).length),0);};
   const alternatives=Object.keys(B.FORMATIONS).filter(name=>name!==requested).sort((a,b)=>difference(a)-difference(b));
   for(const name of alternatives){const result=this.assign(records,name);if(result?.valid)return result;}
   // Sparse imported squads keep their recorded positions instead of inventing midfielders.
   const field=records.filter(p=>p.position!=='GK').slice(0,10),counts=['DF','MF','FW'].map(role=>field.filter(p=>p.position===role).length),name=counts.join('-');
   if(!B.FORMATIONS[name]){const points=[{x:.055,y:.5,role:'GK'}];counts.forEach((count,row)=>{for(let i=0;i<count;i++)points.push({x:[.23,.475,.72][row],y:(i+1)/(count+1),role:['DF','MF','FW'][row]});});B.FORMATIONS[name]=points;}
   return this.assign(records,name)||exact;
  }
 };
 B.DEFAULT_TACTICS={mentality:'Equilibrada',pressure:'Média',line:'Média',attack:'Equilibrado'};
})();
