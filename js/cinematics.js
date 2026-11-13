'use strict';
// Presentation owns its timeline. Replays render snapshots and never step physics.
(() => {
 const B=window.BSS;
 B.Cinematics=class {
  constructor(match){this.m=match;this.queue=[];this.frames=[];this.sample=0;this.goals=new Map();this.trailing=[false,false];this.rng=B.rng((match.options.seed??Date.now())+971);this.enabled=match.options.cutscenes!==false&&!match.autoplay&&match.mode!=='training';if(this.enabled){this.add('intro',3.4,{penalties:match.mode==='penalties'});if(match.mode!=='penalties')this.add('toss',18,{stage:0,choice:0});}}
  get active(){return this.queue[0];}
  add(type,duration,data={},done){if(this.enabled)this.queue.push({type,duration,data,done,time:0});}
  capture(){const m=this.m,teams=m.teams.map(t=>({...t,stats:{...t.stats},players:[]})),map=new Map();m.players.forEach(p=>{const q={...p,facing:{...p.facing},slideDirection:p.slideDirection?{...p.slideDirection}:null,team:teams[p.team.side]};map.set(p,q);q.team.players.push(q);});const ball={...m.ball,net:m.ball.net?{...m.ball.net}:null,trail:m.ball.trail.map(p=>({...p})),owner:map.get(m.ball.owner),lastTouch:map.get(m.ball.lastTouch)};const f={...m,cinema:null,turf:(m.turf||[]).map(bit=>({...bit})),teams,players:teams.flatMap(t=>t.players),minute:m.minute,ball,controlled:map.get(m.controlled),lastScorer:map.get(m.lastScorer),freeKick:null,bannerTime:0,charges:{},restart:m.restart?{...m.restart,taker:map.get(m.restart.taker)}:null};if(m.penalty)f.penalty={...m.penalty,taker:map.get(m.penalty.taker),keeper:map.get(m.penalty.keeper),dive:m.penalty.dive?{...m.penalty.dive}:null};if(m.penalties)f.penalties={...m.penalties,scores:[...m.penalties.scores],kicks:m.penalties.kicks.map(k=>[...k])};this.frames.push(f);if(this.frames.length>140)this.frames.shift();}
  record(dt){if(!this.enabled)return;this.sample+=dt;if(this.sample>=.05){this.sample%=.05;this.capture();}for(let i=0;i<2;i++)if(this.m.teams[i].score<this.m.teams[1-i].score)this.trailing[i]=true;}
  replay(label){if(this.frames.length<2)return;const frames=this.frames.slice();this.add('replay',Math.min(9,frames.length*.05/.75),{frames,label});}
  replayFrame(frames,seconds){
   const at=Math.min(frames.length-1,seconds*.75/.05),a=frames[Math.floor(at)],b=frames[Math.min(frames.length-1,Math.floor(at)+1)],t=at%1;
   const mix=(p,q)=>({...p,x:B.lerp(p.x,q.x,t),y:B.lerp(p.y,q.y,t),z:B.lerp(p.z||0,q.z||0,t),runTime:B.lerp(p.runTime||0,q.runTime||0,t)});
   const players=a.players.map((p,i)=>mix(p,b.players[i]||p)),controlled=players.find(p=>p.id===a.controlled?.id);
   const nextTurf=new Map((b.turf||[]).map(bit=>[bit.id,bit]));
   const turf=(a.turf||[]).map(bit=>({...bit,age:B.lerp(bit.age,nextTurf.get(bit.id)?.age??bit.age,t)}));
   return {...a,players,controlled,turf,ball:mix(a.ball,b.ball)};
  }
  goal(data){const m=this.m,side=data.team,p=m.lastScorer,own=data.ownGoal||p?.team.side!==side;const key=side+':'+p?.id,count=own?0:(this.goals.get(key)||0)+1;if(!own)this.goals.set(key,count);this.capture();this.replay('REPLAY DO GOL');this.add('goal',3.6,{side,player:p,own,technique:data.technique});if(this.trailing[side]&&m.teams[side].score>m.teams[1-side].score){this.trailing[side]=false;this.add('comeback',3.4,{side,player:p});}if(count===3)this.add('hat',4,{side,player:p});for(let i=0;i<2;i++)if(m.teams[i].score<m.teams[1-i].score)this.trailing[i]=true;this.frames=[];}
  referee(penalty){this.add('referee',2.7,{penalty,card:this.card});this.card=null;if(penalty)this.replay('REPLAY DA INFRAÇÃO');this.frames=[];}
  substitution(old,fresh){this.add('sub',3.8,{side:fresh.team.side,old,player:fresh});this.frames=[];}
  next(){const s=this.queue.shift();this.m.charges={};this.m.kickPreview=null;this.m.bufferedShot=null;s?.done?.();}
  update(dt,input){const s=this.active;if(!s)return;const a=input?.pressed||{};s.time+=dt;
   if(s.type==='toss'){const d=s.data;if(d.stage===0){if(a.left||a.right)d.choice=1-d.choice;if(a.pass||a.shoot||a.long||s.time>8){d.result=this.rng()<.5?0:1;d.winner=d.result===d.choice?this.m.human:1-this.m.human;d.stage=1;s.time=0;}}else if(d.stage===1&&s.time>2.5){d.stage=2;s.time=0;d.choice=0;}else if(d.stage===2){if(a.left||a.right)d.choice=1-d.choice;if((d.winner===this.m.human&&(a.pass||a.shoot||a.long))||s.time>(d.winner===this.m.human?8:2)){const side=d.choice===0?d.winner:1-d.winner;this.m.openingSide=side;if(d.choice===1)this.m.teams.forEach(t=>t.dir*=-1);this.m.kickoff(side);this.next();}}return;}
   if(s.time>=s.duration||s.time>.4&&(a.pass||a.shoot||a.long))this.next();
  }
 };
 const M=B.Match.prototype,update=M.update,event=M.event,restart=M.setRestart,penalty=M.setupPenalty,finish=M.finish,resolve=M.resolvePenalty,resumeHalf=M.resumeHalf;
 M.update=function(dt,input){if(this.cinema?.active){this.cinema.update(dt,input);return;}this.cinema?.record(dt);update.call(this,dt,input);};
 M.event=function(type,data={}){if(this.cinema?.enabled){if(type==='half'&&!this.cinema.halfPending){this.cinema.halfPending=true;this.cinema.add('end-whistle',2.6,{half:true,period:this.period},()=>{this.cinema.halfPending=false;event.call(this,type,data);});return;}if(type==='foul')this.cinema.card=data.red?'red':data.yellow?'yellow':null;if(type==='goal'){if(this.state==='penalty')this.cinema.penaltyGoal=data;else{this.cinema.goal(data);const last=this.cinema.queue.at(-1);if(last)last.done=()=>this.completeGoal();}}}return event.call(this,type,data);};
 M.setRestart=function(type,...args){restart.call(this,type,...args);if(type==='FALTA')this.cinema?.referee(false);};
 M.setupPenalty=function(side,shootout){if(!shootout)this.cinema?.referee(true);return penalty.call(this,side,shootout);};
 M.resolvePenalty=function(){if(this.cinema?.enabled&&this.cinema.penaltyGoal){const data=this.cinema.penaltyGoal;this.cinema.penaltyGoal=null;this.cinema.goal(data);this.cinema.queue.at(-1).done=()=>resolve.call(this);return;}return resolve.call(this);};
 M.finish=function(){if(this.finished||this.cinema?.ending)return;if(this.cinema?.enabled){this.cinema.ending=true;this.state='ending';const [a,b]=this.teams;const side=this.penalties?.winner??(a.score===b.score?null:a.score>b.score?0:1);this.sound.play('whistle');this.cinema.add('end-whistle',2.6,{side,half:false,period:this.period});this.cinema.add('final',5.5,{side},()=>finish.call(this));}else finish.call(this);};
 M.resumeHalf=function(){resumeHalf.call(this);if(this.openingSide!==undefined)this.kickoff(this.period%2?this.openingSide:1-this.openingSide);};
 const shootout=M.startShootout;M.startShootout=function(){if(this.cinema?.enabled&&this.endingPeriod===this.period){this.state='half';this.cinema.add('end-whistle',2.6,{half:false,period:this.period},()=>shootout.call(this));}else shootout.call(this);};
 const R=B.Renderer.prototype,render=R.render;
 R.render=function(m,dt,...args){const s=m.cinema?.active;document.body.classList.toggle('cinematic-active',!!s);if(!s){render.call(this,m,dt,...args);return;}this.fit(false);const g=this.ctx;g.save();g.setTransform(1,0,0,1,48,15);g.imageSmoothingEnabled=false;
  if(s.type==='replay'){const f=m.cinema.replayFrame(s.data.frames,s.time);render.call(this,f,dt,false,60,false);this.rect(-48,-15,480,25,'#071923');this.text(s.data.label+'  •  0.75x',192,2,'#ffe380',9,'center');this.rect(-48,209,480,46,'#071923');this.rect(-32,237,448,2,'#395755');this.rect(-32,237,448*Math.min(1,s.time/s.duration),2,'#ffe380');this.text('PASSE / CHUTE: PULAR',192,250,'#d7e7df',7,'center');}
  else this.cutscene(m,s);g.restore();
 };
 R.cutscene=function(m,s){const t=s.time,d=s.data,g=this.ctx;
  this.rect(-48,-15,480,270,'#0a1829');this.rect(-48,39,480,88,'#20394c');for(let row=0;row<6;row++)for(let x=-40;x<432;x+=9){const y=47+row*12+(Math.sin(t*5+x+row)>0?1:0);this.rect(x,y,4,5,['#d5b47b','#739e9a','#cb6f60','#e5d9b3'][(x+40+row)%4]);}this.rect(-48,116,480,12,'#dae3c3');this.text('B R A S I L   S U P E R   S O C C E R',192,125,'#243d42',7,'center');for(let i=0;i<6;i++)this.rect(-48,128+i*17,480,17,i%2?'#328252':'#2b764c');this.rect(-48,206,480,2,'#c5d4a4');
  const actor=(p,x,y,pose='idle',scale=3)=>{if(!p)return;this.rect(x-19,y-3,38,5,'#163e38');const jump=pose==='celebrate'?Math.max(0,Math.sin(t*8+p.index*.6))*9:0;const sprite=this.sprite({...p,anim:pose,animTime:0,runTime:t*9+p.index*.5,facing:{x:pose==='run'?1:0,y:1}}),size=scale*30/sprite.height;g.drawImage(sprite,Math.round(x-(sprite.anchorX??14)*size),Math.round(y-(sprite.anchorY??28)*size-jump),Math.round(sprite.width*size),Math.round(sprite.height*size));};
  const ref=gesture=>this.officialPerson(192,214,gesture,3.0,t,d.card);
  let title='',sub='',hint='PASSE / CHUTE: PULAR';const side=d.side??0,team=m.teams[side];
  if(s.type==='intro'){
   title=d.penalties?'HORA DA DECISÃO':'ENTRADA EM CAMPO';sub=m.teams[0].data.name+'  ×  '+m.teams[1].data.name;
   for(let i=0;i<6;i++)for(let side=0;side<2;side++)actor(m.teams[side].players[i+1],60+i*52,202+side*25-Math.max(0,1-t/2)*75,'run',2.2);
   for(let side=0;side<2;side++){this.rect(side?247:44,53,93,32,m.teams[side].data.primaryColor);this.text(m.teams[side].data.shortName,side?293:90,75,'#fff9da',17,'center');}
   this.text(d.penalties?'UMA DISPUTA. UMA VAGA.':'11 CONTRA 11 · O CAMPO É SEU',192,104,'#e5edcd',8,'center');
  }
  if(s.type==='toss'){title='CARA OU COROA';actor(m.teams[0].players[1],105,211);actor(m.teams[1].players[1],283,211);ref('toss');if(d.stage===0){sub='ESCOLHA: '+(d.choice===0?'[ CARA ]   COROA':'CARA   [ COROA ]');hint='DIREÇÃO: ESCOLHER  •  PASSE / CHUTE: CONFIRMAR';}else if(d.stage===1){const y=99-Math.sin(Math.min(1,t/2.5)*Math.PI)*52,w=Math.max(2,Math.abs(Math.cos(t*16))*17);this.rect(192-w/2,y,w,18,'#f3cb55');this.rect(192-w/2+2,y+3,Math.max(1,w-4),12,'#fff0a6');sub=t<1.8?'A MOEDA ESTÁ NO AR...':(d.result===0?'CARA':'COROA')+'!';hint='SORTEIO DOS CAPITÃES';}else{title=m.teams[d.winner].data.shortName+' VENCEU O SORTEIO';sub=d.choice===0?'[ SAÍDA DE BOLA ]  TROCAR LADO':'SAÍDA DE BOLA  [ TROCAR LADO ]';hint=d.winner===m.human?'DIREÇÃO + PASSE / CHUTE: CONFIRMAR':'O ADVERSÁRIO ESTÁ ESCOLHENDO...';}}
  if(s.type==='end-whistle'){title=d.half?(d.period===1?'FIM DO PRIMEIRO TEMPO':'INTERVALO DA PRORROGAÇÃO'):'FIM DE JOGO';sub=t<.7?'O ÁRBITRO CONFERE O RELÓGIO':d.half?'AS EQUIPES VÃO PARA O INTERVALO':'APITO FINAL';ref(t<.7?'watch':t<1.85?'whistle':'point');actor(m.teams[0].players[3],92-Math.max(0,t-1.7)*15,217,t>1.7?'run':'idle',2.4);actor(m.teams[1].players[3],294+Math.max(0,t-1.7)*15,217,t>1.7?'run':'idle',2.4);}
  if(s.type==='referee'){title=d.penalty?'PÊNALTI!':'FALTA!';sub=d.card==='red'?'CARTÃO VERMELHO':d.card==='yellow'?'CARTÃO AMARELO':d.penalty?'O ÁRBITRO APONTA PARA A MARCA':'APITO DO ÁRBITRO';ref(t<1?'whistle':'point');actor(m.teams[0].players[2],95,217);actor(m.teams[1].players[2],285,217);}
  if(['goal','comeback','hat'].includes(s.type)){title=s.type==='hat'?'HAT-TRICK!':s.type==='comeback'?'É A VIRADA!':d.own?'GOL CONTRA!':({header:'GOL DE CABEÇA!',volley:'GOL DE VOLEIO!',bicycle:'GOL DE BICICLETA!'})[d.technique]||'GOOOOOL!';sub=s.type==='hat'?'TRÊS GOLS DE '+d.player.name:d.own?team.data.name:(d.player?.name||team.data.name);actor(team.players[4],125-Math.max(0,1-t)*80,218,'celebrate',2.7);actor(team.players[7],260+Math.max(0,1-t)*80,218,'celebrate',2.7);actor(d.own?team.players[9]:d.player,192,216,'celebrate',3.6);if(s.type==='hat')for(let i=0;i<3;i++)g.drawImage(this.ballFrame(t+i),160+i*25,193,17,17);if(s.type==='comeback'){this.rect(111,70,162,25,'#10263a');this.text(m.teams.map(t=>t.score).join('  :  '),192,89,'#ffe480',20,'center');}}
  if(s.type==='sub'){title='SUBSTITUIÇÃO';sub='SAI '+d.old.name+'  •  ENTRA '+d.player.name;const walk=Math.min(1,t/2.6);actor(d.old,145-walk*150,218,'run');actor(d.player,340-walk*95,218,'run');ref('toss');this.rect(151,75,83,29,'#071a25');this.text(String(d.old.shirtNumber??d.old.index+1),169,96,'#ff8277',16,'center');this.text(String(d.player.shirtNumber??d.player.index+1),213,96,'#97edaa',16,'center');}
  if(s.type==='final'){title='FIM DE JOGO';sub=d.side===null?'EMPATE • GRANDE PARTIDA!':team.data.name+' VENCEU!';for(let i=0;i<7;i++)actor((d.side===null?m.teams[i%2]:team).players[i+1],28+i*55,209+(i%2)*8,d.side===null?'idle':'celebrate',2.4);if(d.side!==null)for(let i=0;i<50;i++)this.rect(-40+(i*47)%470,42+(i*19+t*(22+i%7))%163,3,5,['#f2da77','#df6c71','#91c7dd'][i%3]);this.rect(132,68,120,25,'#10263a');this.text(m.teams.map(t=>t.score).join(' : '),192,87,'#ffe480',19,'center');}
  if(['goal','comeback','hat','final'].includes(s.type)){
   for(let i=0;i<28;i++){const x=-35+(i*73+t*(i%2?4:-4)+480)%475,y=38+(i*31+t*(23+i%9))%176;this.rect(x,y,2+(i%2),3,['#f9db72','#9fe4ef',team.data.primaryColor][i%3]);}
   if(s.type==='final'&&d.side!==null&&m.options.competition){const trophy=this.art('trophy');if(trophy?.complete&&trophy.naturalWidth)g.drawImage(trophy,173,104+Math.sin(t*2)*2,38,45);}
  }
  for(let i=0;i<3;i++)if(Math.sin(t*4+i*5)>.98){this.rect(35+i*137,59+i*13,6,1,'#fff');this.rect(37+i*137,57+i*13,1,5,'#fff');}
  this.rect(-48,-15,480,48,'#091a2c');this.rect(-48,30,480,3,'#ddbb66');this.text(title,192,16,'#ffe6a0',19,'center');this.rect(-48,221,480,34,'#091a2c');this.text(sub.toUpperCase().slice(0,66),192,234,'#fff0c9',sub.length>48?6:8,'center');this.text(hint,192,248,'#95b8bd',6,'center');
  const fade=Math.max(0,1-t/.24,(t-s.duration+.22)/.22);if(fade){g.fillStyle=`rgba(3,10,18,${Math.min(1,fade)})`;g.fillRect(-48,-15,480,270);}
 };
})();
