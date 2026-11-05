'use strict';
/* EMBALAGENS
 * Instâncias (InstancedMesh), caixas K/plástica/papelão/palox, pallet e o miolo de fruta das caixas.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== sistema de instâncias ========== */
const bags = [];
const mkBag = (geo,mat,{shadow=true,color=false}={})=>{ const b={geo,mat,m:[],c:[],shadow,color}; bags.push(b); return b; };
const _tmp=new THREE.Matrix4(), _c=new THREE.Color();
const compose=(PM,pos,q,sc=ONE)=>{ _tmp.compose(pos,q,sc); return PM.clone().multiply(_tmp); };
function finalizeBags(){
  for(const b of bags){ const n=b.m.length; if(!n) continue;
    const im=new THREE.InstancedMesh(b.geo,b.mat,n); im.castShadow=b.shadow; im.receiveShadow=true;
    b.m.forEach((m,i)=>im.setMatrixAt(i,m));
    if(b.color) b.c.forEach((c,i)=>im.setColorAt(i,c));
    scene.add(im);
  }
}
const colorOf=(hex,k=1)=>new THREE.Color(hex).multiplyScalar(k);

/* ========== embalagens ========== */
const woodMat = M({map:woodTex('#caa070'),roughness:.82,envMapIntensity:.3});
const plasticMat = M({color:'#ffffff',roughness:.42,envMapIntensity:.6});
const kraftMat = M({map:kraftTex,roughness:.92,side:THREE.DoubleSide,envMapIntensity:.25});
const paloxMat = M({map:paloxTex,roughness:.92,side:THREE.DoubleSide,envMapIntensity:.25});
// massa de fruta dentro da caixa: bolinhas sombreadas (luz em cima, borda escura) em tons de cinza; a cor da fruta vem do instance color. Antes era um bloco liso.
const fruitMassTex = ctex(256,256,(g,w,h)=>{
  g.fillStyle='#4a4a4a'; g.fillRect(0,0,w,h);
  for(let k=0;k<2;k++) for(let i=0;i<(k?70:46);i++){ const r=(k?13:19)+rnd()*7, x=rnd()*w, y=rnd()*h, v=k?150:190+rnd()*50|0;
    for(const [ox,oy] of [[0,0],[-w,0],[w,0],[0,-h],[0,h]]){ const gr=g.createRadialGradient(x+ox-r*.3,y+oy-r*.35,r*.1,x+ox,y+oy,r);
      gr.addColorStop(0,`rgb(${v},${v},${v})`); gr.addColorStop(.7,`rgb(${v*.62|0},${v*.62|0},${v*.62|0})`); gr.addColorStop(1,'rgb(28,28,28)');
      g.fillStyle=gr; g.beginPath(); g.arc(x+ox,y+oy,r,0,7); g.fill(); } }
},[2,2]);
const fillMat = M({color:'#ffffff',map:fruitMassTex,bumpMap:fruitMassTex,bumpScale:2.2,roughness:.62,envMapIntensity:.35});
const palletMat = M({map:woodTex('#c79a63'),roughness:.88,envMapIntensity:.25});

function kCrateGeo(w,h,d){ const g=[]; const b=(W,H,D,x,y,z)=>{ const q=new THREE.BoxGeometry(W,H,D); q.translate(x,y,z); g.push(q); };
  for(let i=0;i<4;i++) b(w,.014,d*.22,0,.007,(i-1.5)*d*.26);
  for(const s of [-1,1]){ for(let i=0;i<3;i++){ b(.014,h*.2,d,s*(w/2-.007),.04+h*.12+i*h*.3,0); b(w,h*.2,.014,0,.04+h*.12+i*h*.3,s*(d/2-.007)); } }
  for(const sx of [-1,1]) for(const sz of [-1,1]) b(.03,h,.03,sx*(w/2-.015),h/2,sz*(d/2-.015));
  return mergeGeometries(g); }
function pCrateGeo(w,h,d){ const g=[]; const b=(W,H,D,x,y,z)=>{ const q=new THREE.BoxGeometry(W,H,D); q.translate(x,y,z); g.push(q); };
  b(w,.012,d,0,.006,0); b(w,.03,d,0,h-.015,0);
  for(const s of [-1,1]){ b(.012,.03,d,s*(w/2-.006),.02,0); b(w,.03,.012,0,.02,s*(d/2-.006)); b(.012,.03,d,s*(w/2-.006),h-.015,0);
    for(let i=0;i<Math.round(d/.07);i++) b(.012,h-.05,.014,s*(w/2-.006),h/2,-d/2+.035+i*(d-.07)/(Math.round(d/.07)-1));
    for(let i=0;i<Math.round(w/.07);i++) b(.014,h-.05,.012,-w/2+.035+i*(w-.07)/(Math.round(w/.07)-1),h/2,s*(d/2-.006)); }
  return mergeGeometries(g); }
function boxOpenGeo(w,h,d,t=.007){ const g=[]; const b=(W,H,D,x,y,z)=>{ const q=new THREE.BoxGeometry(W,H,D); q.translate(x,y,z); g.push(q); };
  b(w,t,d,0,t/2,0); for(const s of [-1,1]){ b(t,h,d,s*(w/2-t/2),h/2,0); b(w,h,t,0,h/2,s*(d/2-t/2)); } return mergeGeometries(g); }
const PACK = {
  K:  {dims:[.4,.34,.5], grid:[3,2], bag:mkBag(kCrateGeo(.4,.34,.5),woodMat,{color:true}), colors:()=>colorOf(['#caa070','#b98650','#d8b27a','#a9784a','#c49463'][(rnd()*5)|0],R(1.1,1.4))},
  P:  {dims:[.6,.28,.5], grid:[2,2], bag:mkBag(pCrateGeo(.6,.28,.5),plasticMat,{color:true}), colors:(p)=>colorOf(p.pcol||'#1f5fa8',R(.8,1.05))},
  C:  {dims:[.4,.26,.5], grid:[3,2], bag:mkBag(boxOpenGeo(.4,.26,.5),kraftMat,{color:true}), colors:()=>colorOf('#ffffff',R(.82,1.05))},
  BIN:{dims:[1.1,.78,.9],grid:[1,1], bag:mkBag(boxOpenGeo(1.1,.78,.9,.012),paloxMat,{color:true}), colors:()=>colorOf('#ffffff',R(.88,1))},
};
const fillBag = mkBag(new THREE.BoxGeometry(1,1,1),fillMat,{color:true,shadow:false});
// pallets
const palletGeo=(()=>{ const g=[]; const b=(W,H,D,x,y,z)=>{ const q=new THREE.BoxGeometry(W,H,D); q.translate(x,y,z); g.push(q); };
  for(let i=0;i<7;i++) b(1.2,.022,.1,0,.133,-.45+i*.15);
  for(let i=0;i<3;i++) b(1.2,.022,.1,0,.011,-.45+i*.45);
  for(const x of [-.5,0,.5]) for(const z of [-.45,0,.45]) b(.1,.1,.1,x,.072,z);
  return mergeGeometries(g); })();
const palletBag = mkBag(palletGeo,palletMat,{color:true});
const PALLET_H=.144;
const stretchMat=new THREE.MeshStandardMaterial({color:'#e9f2f5',transparent:true,opacity:.1,roughness:.05,metalness:0,depthWrite:false});
