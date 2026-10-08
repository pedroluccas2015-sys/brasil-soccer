'use strict';
module.exports=async function(page,assert){
 for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>BSS.app.ui.home());await page.waitForTimeout(60);
  for(const mode of ['quick','penalties']){
   await page.evaluate(mode=>{const a=BSS.app;a.start(a.data.teams[0].id,a.data.teams[1].id,{mode});},mode);await page.waitForTimeout(60);
   const size=await page.evaluate(()=>{const c=document.getElementById('game'),s=c.parentElement,r=c.getBoundingClientRect();return {w:r.width,h:r.height,sw:s.clientWidth,sh:s.clientHeight,native:[c.width,c.height]};});
   assert.deepEqual(size.native,[480,270]);assert.ok(Math.abs(size.w/size.h-16/9)<.001);
   assert.ok(size.sw-size.w<3&&size.sh-size.h<3,`${width}: canvas deve preencher a área`);
   assert.ok(Math.abs(size.w-Math.min(width,height*16/9))<2,'partida ocupa o maior retângulo 16:9 da tela');
   if(width===1366&&mode==='quick')await page.screenshot({path:'tests/layout-16x9.png'});
   await page.keyboard.press('Escape');await page.waitForSelector('#resume');await page.click('#resume');
  }
 }
 await page.setViewportSize({width:1366,height:1000});
 console.log('Layout PASS: 16:9, área preenchida, partida ocupando a tela e pausa em quatro tamanhos.');
};
