'use strict';
/* BASE
 * Aviso de file://, formato de moeda, $(id), botão de voltar pra Rua e utilidades (sorteio com semente, vetores, texturas em canvas, material padrão).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
// aberto por duplo clique (file://), o navegador não grava a permissão do microfone: sugere o atalho com localhost
if(location.protocol==='file:'){ const p=document.createElement('p'); p.style.cssText='font-size:12.5px;opacity:.85;background:rgba(139,92,246,.18);border:1px solid rgba(139,92,246,.4);border-radius:12px;padding:9px 12px;margin-top:12px'; p.innerHTML='🎤 Pra voz funcionar sem pedir permissão toda hora, abra pelo atalho <b>abrir-lojas.bat</b> (pasta Ativos).'; document.querySelector('#overlay .box').appendChild(p); }

const brl = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const $ = id => document.getElementById(id);

const FROM_RUA = /[?&]rua=1/.test(location.search), RUA_URL = '../mundo/index.html';
if(FROM_RUA){
  const a=document.createElement('a'); a.id='voltar'; a.className='glass'; a.href=RUA_URL; a.innerHTML='← Voltar pra rua <kbd>V</kbd>';
  for(const ev of ['mousedown','mouseup']) a.addEventListener(ev,e=>e.stopPropagation());
  document.body.appendChild(a);
}

/* ========== utilidades ========== */
const rnd = (()=>{ let a=20261029; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
const R = (a,b)=>a+(b-a)*rnd();
const V3 = (x,y,z)=>new THREE.Vector3(x,y,z);
const ONE = V3(1,1,1);
const qY = a=>new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),a);
const qE = (x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z));
function ctex(w,h,fn,rep){
  const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); }
  return t;
}
const M = o => new THREE.MeshStandardMaterial(Object.assign({roughness:.6,metalness:0,envMapIntensity:.55},o));
const lathe = (pts,seg=14)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
const ell = (rx,ry,rz,ws=6,hs=4)=>{ const g=new THREE.SphereGeometry(1,ws,hs); g.scale(rx,ry,rz); return g; };
