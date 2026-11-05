'use strict';
/* CONTROLES
 * Entrada no pavilhão, mira, teclado e mouse.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
window.__ceasa={ver:(x,z,y,p)=>{ camera.position.set(x,1.7,z); yaw=y; pitch=p; },info:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles}),pos:()=>[camera.position.x,camera.position.z,yaw]};
const keys={}, overlay=$('overlay');
function enterFree(){ free=true; locked=true; overlay.style.display='none'; }
function enter(){
  free=false;
  try{ const p=renderer.domElement.requestPointerLock(); if(p&&p.catch) p.catch(()=>{ if(!locked) enterFree(); }); }catch(e){ enterFree(); return; }
  setTimeout(()=>{ if(!locked) enterFree(); },500);
}
overlay.addEventListener('click',enter);
overlay.addEventListener('click',()=>{ let vistou=false; try{ vistou=!!localStorage.getItem('ceasa_tour'); }catch(e){} if(!vistou&&!tourOn) setTimeout(runTour,1400); });
document.addEventListener('pointerlockchange',()=>{ if(free) return; locked=document.pointerLockElement===renderer.domElement; overlay.style.display=(locked||modalOn||catalogOn||chatOn)?'none':'flex'; });
document.addEventListener('mousemove',e=>{
  const onUi=e.target.closest&&e.target.closest('#cart,#pc,#catalog-panel,#catalog-open');
  mx=onUi?0:e.clientX/innerWidth*2-1; my=onUi?0:e.clientY/innerHeight*2-1;
  if(!locked||modalOn||catalogOn||chatOn||tourOn) return;
  if(free){ if(!(e.buttons&1)) return; drag+=Math.abs(e.movementX)+Math.abs(e.movementY); }
  yaw-=e.movementX*.0022; pitch=Math.max(-1.35,Math.min(1.35,pitch-e.movementY*.0022));
});
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(modalOn){ if(e.code==='Escape') closeCO(); return; }
  if(catalogOn){ if(e.code==='Escape') closeCatalog(); return; }
  if(e.code==='KeyL'&&!chatOn&&!tourOn){ openCatalog(); return; }
  if(FROM_RUA&&e.code==='KeyV'){ location.href=RUA_URL; return; }
  if(free&&e.code==='Escape'){ free=false; locked=false; overlay.style.display='flex'; }
  if(!locked) return;
  if(chatOn) return;
  if(e.code==='KeyE') act();
  if(e.code==='KeyQ') removeLast();
  if(e.code==='KeyF') openCheckout();
});
const act=()=>{ if(!hov||chatOn||modalOn||catalogOn) return; if(hov.userData.vendor) vend.open(); else if(hov.userData.totem) abreTotem(hov.userData.totem); else if(hov.userData.telao) abreTelao(); else add(hov.userData.p,1); };
function abreTelao(){ if(!window.NewTotem) return; const grupos=Object.entries(BOXES).map(([n,b])=>({num:+n,nome:b.nome,ids:b.ids,cor:TOTEM_COR[n]||'#8b5cf6'}));
  NewTotem.open({num:0,nome:'Pavilhão completo',cor:'#8b5cf6',ids:grupos.flatMap(g=>g.ids),grupos,atual:telao&&telao.atualId()}); }
function abreTotem(t,atual){ if(!window.NewTotem) return; NewTotem.open({num:t.num,nome:t.nome,cor:t.cor,ids:t.ids,atual}); }
addEventListener('mousedown',e=>{ if(e.target.closest&&e.target.closest('#cart,#pc,#modal,#catalog-panel,#catalog-open,#voltar')) return; if(free) drag=0; else if(locked) act(); });
addEventListener('mouseup',e=>{ if(free&&locked&&drag<6&&!(e.target.closest&&e.target.closest('#cart,#pc,#modal,#catalog-panel,#catalog-open,#voltar'))) act(); });
addEventListener('keyup',e=>keys[e.code]=false);
const hit=(x,z)=>{ const r=.32; return x<ROOM.x0+r||x>ROOM.x1-r||z<ROOM.z0+r||z>ROOM.z1-r||colliders.some(c=>x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r); };
