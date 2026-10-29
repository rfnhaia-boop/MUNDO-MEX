/* NewPerf — desempenho automático pros mundos 3D da NEW.
   Uso: <script src="../shared/perf.js"></script> antes do módulo, e no fim do módulo: if(window.NewPerf) NewPerf.attach(renderer,scene);
   O que faz: desliga sombras (o maior custo), começa em resolução 1x e ajusta sozinho conforme os quadros por segundo,
   e no modo leve (PC fraco) apaga as luzes pontuais. Voltar ao visual completo: abra com ?hq=1. Forçar o leve: ?lite=1. */
(function(){
  const q=new URLSearchParams(location.search), HQ=q.get('hq')==='1', LITE0=q.get('lite')==='1';
  const PRS=[1.5,1,.85,.7,.55];
  let renderer=null, scene=null, level=HQ?0:(LITE0?3:1), lite=false, acc=0, n=0, good=0, last=0;
  function note(t){ try{ let e=document.getElementById('perfnote'); if(!e){ e=document.createElement('div'); e.id='perfnote'; e.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99;padding:8px 16px;border-radius:99px;background:rgba(20,14,34,.92);color:#e9e1ff;font:600 12.5px "Segoe UI",system-ui,sans-serif;border:1px solid rgba(255,255,255,.18);transition:opacity .4s;pointer-events:none'; document.body.appendChild(e); } e.textContent=t; e.style.opacity=1; clearTimeout(e._t); e._t=setTimeout(()=>{ e.style.opacity=0; },3200); }catch(_){} }
  function applyPR(){ if(!renderer) return; const s={w:0,h:0,set(w,h){ this.w=w; this.h=h; }}; renderer.getSize(s); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,PRS[level])); renderer.setSize(s.w,s.h,false); }
  function goLite(){ if(lite||!scene) return; lite=true; scene.traverse(o=>{ if(o.isPointLight||o.isSpotLight) o.visible=false; if(o.isHemisphereLight||o.isAmbientLight) o.intensity*=1.3; }); note('Modo leve ligado para rodar mais fluido'); }
  function loop(t){ requestAnimationFrame(loop); const dt=t-last; last=t; if(dt>500||dt<=0) return; acc+=dt; n++;
    if(acc>=1200){ const fps=n/(acc/1000); acc=0; n=0;
      if(fps<40&&level<PRS.length-1){ level++; applyPR(); good=0; if(level>=3) goLite(); }
      else if(fps>57&&level>1&&!lite){ if(++good>=6){ level--; applyPR(); good=0; } } else good=0; } }
  window.NewPerf={ attach(r,s){ renderer=r; scene=s; if(!HQ){ try{ renderer.shadowMap.enabled=false; scene.traverse(o=>{ if(o.isLight&&o.castShadow) o.castShadow=false; if(o.material){ for(const m of [].concat(o.material)) m.needsUpdate=true; } }); }catch(e){} }
      applyPR(); if(level>=3) goLite(); requestAnimationFrame(loop); },
    get level(){ return level; }, get lite(){ return lite; } };
})();
