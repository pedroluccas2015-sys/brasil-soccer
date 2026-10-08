'use strict';
(() => {
 const B=window.BSS;
 B.FORMATIONS={};
 for(const [name,rows] of Object.entries({'4-4-2':[4,4,2],'4-3-3':[4,3,3],'4-2-3-1':[4,2,3,1],'4-1-4-1':[4,1,4,1],'3-5-2':[3,5,2],'3-4-3':[3,4,3],'5-3-2':[5,3,2]})){
  const points=[{x:.055,y:.5,role:'GK'}];rows.forEach((n,row)=>{for(let i=0;i<n;i++)points.push({x:.23+row*(.49/(rows.length-1)),y:(i+1)/(n+1),role:row===0?'DF':row===rows.length-1?'FW':'MF'});});B.FORMATIONS[name]=points;
 }
 B.DEFAULT_TACTICS={mentality:'Equilibrada',pressure:'Média',line:'Média',attack:'Equilibrado'};
})();
