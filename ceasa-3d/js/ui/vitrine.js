'use strict';
/* VITRINE
 * Foto 3D de cada produto (thumbnail), catálogo exposto e o Beto levando o cliente até a bancada.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== Beto, o vendedor (molde em ../shared/vendedor.js) ========== */
const PKEY=new Map(Object.entries(P).map(([k,p])=>[p,k]));
/* foto 3D de cada produto (caixa real com a fruta), renderizada com o próprio three.js */
const TS=320, thumbRT=new THREE.WebGLRenderTarget(TS,TS,{samples:4}); thumbRT.texture.colorSpace=THREE.SRGBColorSpace;
const thumbScene=new THREE.Scene(); thumbScene.environment=scene.environment;
thumbScene.add(new THREE.HemisphereLight('#ffffff','#8d8a82',1.5));
{ const k=new THREE.DirectionalLight('#fff3e0',2.6); k.position.set(2,3.5,3); thumbScene.add(k); const r=new THREE.DirectionalLight('#a98bff',1.2); r.position.set(-3,2,-3); thumbScene.add(r); }
const thumbCam=new THREE.PerspectiveCamera(30,1,.05,20), thumbCache={};
function fotoOf(id){
  if(thumbCache[id]) return thumbCache[id];
  const p=P[id], pk=PACK[p.pack], [cw,ch,cd]=pk.dims, g=new THREE.Group();
  const shellMat=pk.bag.mat.clone(); if(p.pack==='P') shellMat.color.set(p.pcol||'#1f5fa8');
  g.add(new THREE.Mesh(pk.bag.geo,shellMat));
  if(!p.empty){
    const kind=Array.isArray(p.fruit)?p.fruit[0]:p.fruit, F=getF(kind), pal=F.parts[0].pal||['#a52a22'];
    const fh=ch*.72, fill=new THREE.Mesh(new THREE.BoxGeometry(cw-.03,fh,cd-.03),new THREE.MeshStandardMaterial({color:new THREE.Color(pal[0]).multiplyScalar(.55),roughness:.7})); fill.position.y=fh/2; g.add(fill);
    const sx=cw-.03, sz=cd-.03, wx=F.w||2*F.r*.98, wz=F.d||2*F.r*.98, cols=Math.max(1,Math.floor(sx/wx)), rows=Math.max(1,Math.floor(sz/wz)), layers=F.lay==='tray'?2:2;
    for(let l=0;l<layers;l++) for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
      if(l&&rnd()<.25) continue;
      const fg=new THREE.Group(); F.parts.forEach(pt=>{ const m=pt.mat.clone(); if(pt.pal) m.color.set(pt.pal[(rnd()*pt.pal.length)|0]).multiplyScalar(R(.9,1.08)); fg.add(new THREE.Mesh(pt.geo,m)); });
      fg.position.set((i-(cols-1)/2)*wx+(l?wx*.25:0),fh+(F.h||F.r*1.5)*(l+.55)*(F.lay==='tray'||F.lay==='bunch'?1:.9),(j-(rows-1)/2)*wz);
      fg.rotation.set(F.lay==='rand'?R(0,6):0,R(0,6.28),F.lay==='rand'?R(0,6):F.lay==='lying'?Math.PI/2:0); g.add(fg);
    }
  }
  g.rotation.y=-.5; thumbScene.add(g); g.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(g), c=box.getCenter(V3(0,0,0)), rad=box.getSize(V3(0,0,0)).length()/2;
  thumbCam.position.set(c.x+rad*.55*1.8,c.y+rad*1.1,c.z+rad*1.9); thumbCam.lookAt(c);
  const prevT=renderer.getRenderTarget(), prevA=renderer.getClearAlpha(), prevC=renderer.getClearColor(new THREE.Color());
  renderer.setRenderTarget(thumbRT); renderer.setClearColor(0x000000,0); renderer.clear(); renderer.render(thumbScene,thumbCam);
  const buf=new Uint8Array(TS*TS*4); renderer.readRenderTargetPixels(thumbRT,0,0,TS,TS,buf);
  renderer.setRenderTarget(prevT); renderer.setClearColor(prevC,prevA);
  const cv=document.createElement('canvas'); cv.width=cv.height=TS; const cx=cv.getContext('2d'), img=cx.createImageData(TS,TS);
  for(let y=0;y<TS;y++) img.data.set(buf.subarray((TS-1-y)*TS*4,(TS-y)*TS*4),y*TS*4);
  cx.putImageData(img,0,0); thumbScene.remove(g);
  return thumbCache[id]=cv.toDataURL();
}
const EXPOSTOS=new Set(pickMeshes.map(m=>PKEY.get(m.userData.p)));
const BOX_BY_ID=new Map(Object.entries(BOXES).flatMap(([box,data])=>data.ids.map(id=>[id,+box])));
const CATALOGO=Object.entries(P).filter(([id])=>EXPOSTOS.has(id)).map(([id,p])=>({id,box:BOX_BY_ID.get(id)||0,cor:p.box,tag:KB[id].tag,nome:p.name,variante:p.var,preco:p.price,estoque:p.stock??null,ativo:p.active!==false,kg:p.kg,origem:p.org,embalagem:PACKNAME[p.pack],aliases:KB[id].al,grupo:KB[id].g,cat:KB[id].cat,shelf:KB[id].shelf,tip:KB[id].tip,pair:KB[id].pair,seg:KB[id].seg}));
// Beto leva o cliente até a bancada: ele anda pelo corredor, a câmera vai atrás e no fim para olhando pro pallet
function showPallet(id,api,done){
  const m=pickMeshes.find(x=>x.userData.p===P[id]); if(!m){ done&&done(); return; }
  const s=Math.abs(m.position.x)>3.8?Math.sign(m.position.x):0;
  const tx=s?s*2.3:m.position.x, tz=s?m.position.z:m.position.z+3.2;
  const ty=s?-s*Math.PI/2:0;
  const arrive=()=>{ follow=null; let d=ty-yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); camAnim={t:0,dur:1.1,fx:camera.position.x,fz:camera.position.z,tx,tz,fy:yaw,ty:yaw+d,fp:pitch,tp:-.32}; flashM=m; flashT=8; setTimeout(()=>done&&done(),1200); };
  const bp=api&&api.pos&&api.pos();
  if(!bp){ arrive(); return; }
  const stop=s?[s*3.0,m.position.z+s*1.35]:[m.position.x+1.3,m.position.z+1.9];
  const path=[[0,bp.z],[0,stop[1]],stop];
  follow={api}; flashM=null;
  api.walkTo(path,arrive);
}
