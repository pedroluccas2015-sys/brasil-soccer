'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=Object.fromEntries(['teams','players','competitions'].map(name=>[name,JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'))]));
fs.writeFileSync(path.join(root,'data/bundle.js'),'// Generated from editable JSON. Run node tools/build-data.js after edits.\nwindow.BSS_DATA = '+JSON.stringify(data)+';\n');
console.log(`Bundle offline: ${data.teams.length} clubes, ${data.players.length} atletas.`);
