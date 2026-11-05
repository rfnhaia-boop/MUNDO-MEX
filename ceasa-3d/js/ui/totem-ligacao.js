'use strict';
/* LIGAÇÃO COM O TOTEM
 * Dica de mira e a ponte entre a cena e js/ui/totem.js (painel do totem).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== controles ========== */
const totemTip=document.createElement('div'); totemTip.className='mira-dica';   // estilo em css/loja.css document.body.appendChild(totemTip);
if(window.NewTotem) NewTotem.init({
  api:'/api/ceasa', catalogo:Object.entries(P).filter(([id,p])=>EXPOSTOS.has(id)&&!p.empty).map(([id,p])=>({id,name:p.name,var:p.var})),
  ilustra:id=>{ try{ return fotoOf(id); }catch(e){ return null; } },
  onAdd:id=>add(P[id],1), onChat:()=>vend.open(),
  lock:on=>{ if(on){ chatOn=true; try{ document.exitPointerLock(); }catch(e){} } else { chatOn=false; if(!free&&!locked) overlay.style.display='flex'; } },
});
