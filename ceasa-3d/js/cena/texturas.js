'use strict';
/* TEXTURAS
 * Madeira, papelão, palox e ruído, desenhadas em canvas.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== texturas ========== */
const noiseBump = ctex(128,128,(g,w,h)=>{ g.fillStyle='#808080'; g.fillRect(0,0,w,h); for(let i=0;i<1800;i++){ const v=100+rnd()*90|0; g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(rnd()*w,rnd()*h,2,2); } });
const woodTex = (base='#b98650')=>ctex(512,256,(g,w,h)=>{
  g.fillStyle=base; g.fillRect(0,0,w,h);
  for(let i=0;i<170;i++){ g.strokeStyle=`rgba(${50+rnd()*40|0},${25+rnd()*20|0},8,${.05+rnd()*.14})`; g.lineWidth=.5+rnd()*2; g.beginPath(); const y=rnd()*h; g.moveTo(0,y); g.bezierCurveTo(w*.3,y+R(-3,3),w*.6,y+R(-3,3),w,y+R(-4,4)); g.stroke(); }
  for(let i=0;i<5;i++){ g.fillStyle='rgba(30,15,5,.28)'; g.beginPath(); g.ellipse(rnd()*w,rnd()*h,3+rnd()*6,2+rnd()*3,0,0,7); g.fill(); }
});
const kraftTex = ctex(512,512,(g,w,h)=>{
  g.fillStyle='#b88c58'; g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){ g.fillStyle=`rgba(${rnd()<.5?60:255},${rnd()<.5?40:230},${rnd()<.5?20:190},${rnd()*.06})`; g.fillRect(rnd()*w,rnd()*h,3,2); }
  g.fillStyle='#2f8f3d'; g.fillRect(0,h*.46,w,h*.17);
  g.fillStyle='#fff'; g.font='800 54px "Segoe UI",system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('FRUTAS SELECIONADAS',w/2,h*.545);
  g.fillStyle='rgba(30,20,10,.75)'; g.font='700 28px "Segoe UI",system-ui'; g.fillText('NEW · CLASSE 1 · MANUSEIE COM CUIDADO',w/2,h*.72);
  g.font='700 40px "Segoe UI"'; g.fillText('▲  ☂  ⬆',w/2,h*.85);
  g.fillStyle='rgba(40,25,10,.8)'; for(const x of [.2,.8]){ g.beginPath(); g.roundRect(w*x-46,h*.1,92,26,13); g.fill(); }
  g.fillStyle='rgba(210,190,150,.55)'; g.fillRect(0,0,w,14);
});
const paloxTex = ctex(512,512,(g,w,h)=>{
  g.fillStyle='#a87b49'; g.fillRect(0,0,w,h);
  for(let i=0;i<1200;i++){ g.fillStyle=`rgba(${rnd()<.5?50:255},${rnd()<.5?30:220},10,${rnd()*.07})`; g.fillRect(rnd()*w,rnd()*h,4,2); }
  g.fillStyle='#fff'; g.font='800 70px "Segoe UI",system-ui'; g.textAlign='center'; g.fillText('PALOX',w/2,h*.45);
  g.font='700 34px "Segoe UI"'; g.fillStyle='rgba(30,20,10,.8)'; g.fillText('NEW · HORTIFRÚTI',w/2,h*.6);
});
