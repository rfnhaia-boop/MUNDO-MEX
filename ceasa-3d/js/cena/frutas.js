'use strict';
/* FRUTAS
 * Geometria de cada fruta/legume (criada sob demanda).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== fruta: geometrias ========== */
function appleGeo(R_,wTop,dimple,hf=.95){
  const Pt=[]; for(let i=0;i<=10;i++){ const a=i/10*Math.PI; let y=R_*(1-Math.cos(a))*hf - dimple*R_*Math.exp(-Math.pow((Math.PI-a)/.4,2)); Pt.push([Math.max(.0001,Math.sin(a)*R_*(1+wTop*(a/Math.PI-.5))),y]); }
  return lathe(Pt,12);
}
function centerAll(list){ const b=new THREE.Box3(); list.forEach(g=>{ g.computeBoundingBox(); b.union(g.boundingBox); }); const c=b.getCenter(V3(0,0,0)); list.forEach(g=>g.translate(-c.x,-c.y,-c.z)); }
const fm = (o={})=>M(Object.assign({color:'#ffffff',roughness:.45,envMapIntensity:.7},o));
const stripeTex=ctex(256,128,(g,w,h)=>{ g.fillStyle='#4f9a45'; g.fillRect(0,0,w,h); g.fillStyle='#1d5a24'; for(let i=0;i<12;i++){ const x=i*w/12; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+14,h*.3,x-10,h*.7,x,h); g.lineTo(x+11,h); g.bezierCurveTo(x+3,h*.7,x+19,h*.3,x+11,0); g.fill(); } });
const netTex=ctex(256,128,(g,w,h)=>{ g.fillStyle='#e9cb55'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(110,80,20,.5)'; g.lineWidth=1.3; for(let i=0;i<46;i++){ g.beginPath(); g.moveTo(rnd()*w,0); g.bezierCurveTo(rnd()*w,h*.3,rnd()*w,h*.7,rnd()*w,h); g.stroke(); } for(let i=0;i<30;i++){ g.beginPath(); g.moveTo(0,rnd()*h); g.bezierCurveTo(w*.3,rnd()*h,w*.7,rnd()*h,w,rnd()*h); g.stroke(); } });
const pineTex=ctex(256,256,(g,w,h)=>{ g.fillStyle='#d9a232'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(90,50,10,.6)'; g.lineWidth=2.5; for(let i=-16;i<32;i++){ g.beginPath(); g.moveTo(i*16,0); g.lineTo(i*16+h,h); g.stroke(); g.beginPath(); g.moveTo(i*16+h,0); g.lineTo(i*16,h); g.stroke(); } g.fillStyle='rgba(90,40,5,.6)'; for(let i=0;i<24;i++) for(let j=0;j<16;j++){ g.beginPath(); g.arc(i*11+(j%2)*5.5,j*16+8,2,0,7); g.fill(); } });
const trayTex=ctex(256,160,(g,w,h)=>{ g.fillStyle='#a52a22'; g.fillRect(0,0,w,h); for(let i=0;i<150;i++){ const x=rnd()*w,y=rnd()*h,r=14+rnd()*6; g.fillStyle=['#d83a2b','#c92e24','#e24a37','#b42219'][(rnd()*4)|0]; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.fillStyle='rgba(255,230,150,.7)'; for(let k=0;k<4;k++) g.fillRect(x+R(-r*.5,r*.5),y+R(-r*.5,r*.5),1.6,2.4); g.fillStyle='#4b8f2f'; g.beginPath(); g.arc(x,y-r*.7,3.5,0,7); g.fill(); } });
const FD_ = {}; // definições (lazy)
const FDEF = {
  laranja:()=>({parts:[{geo:ell(.04,.038,.04),mat:fm({bumpMap:noiseBump,bumpScale:1.8,roughness:.55}),pal:['#f08a14','#f39a1f','#ec7f0c','#f4a52a']}],r:.04,lay:'rand'}),
  limao:()=>{ const Pt=[]; for(let i=0;i<=12;i++){ const a=i/12*Math.PI; Pt.push([Math.max(.0001,Math.pow(Math.sin(a),.8)*.03),.042*(1-Math.cos(a))]); } const g=lathe(Pt,12); centerAll([g]); return {parts:[{geo:g,mat:fm({bumpMap:noiseBump,bumpScale:1.2,roughness:.5}),pal:['#7fae2a','#6e9c25','#9ab937','#86b52e']}],r:.03,lay:'rand'}; },
  tanger:()=>({parts:[{geo:ell(.042,.032,.042),mat:fm({bumpMap:noiseBump,bumpScale:1.5,roughness:.5}),pal:['#f2791a','#ee6f12','#f48a22']}],r:.042,lay:'up'}),
  gala:()=>{ const a=appleGeo(.04,.14,.3); centerAll([a]); return {parts:[{geo:a,mat:fm({roughness:.32,envMapIntensity:.9}),pal:['#b3202a','#c42a2a','#a31d25','#d1402e','#cf5a35']}],r:.04,lay:'up'}; },
  fuji:()=>{ const a=appleGeo(.042,.14,.3); centerAll([a]); return {parts:[{geo:a,mat:fm({roughness:.32,envMapIntensity:.9}),pal:['#c96a5a','#d98a6a','#b8453c','#dba87a','#c5574a']}],r:.042,lay:'up'}; },
  pera:()=>{ const a=lathe([[.0001,0],[.016,.002],[.03,.014],[.036,.03],[.031,.05],[.021,.07],[.016,.088],[.016,.098],[.009,.108],[.0001,.11]],12); centerAll([a]); return {parts:[{geo:a,mat:fm({roughness:.5}),pal:['#a9c250','#b6c85a','#9db548','#c4cd66']}],r:.036,lay:'lying'}; },
  uva:()=>{ const gs=[]; for(let i=0;i<24;i++){ const f=i/24, sp=.034*(1-f)+.008, a=rnd()*6.28; const s=new THREE.SphereGeometry(.0135,6,4); s.translate(Math.cos(a)*sp*R(.4,1),-f*.11,Math.sin(a)*sp*R(.4,1)); gs.push(s); } const b=mergeGeometries(gs); centerAll([b]); return {parts:[{geo:b,mat:fm({roughness:.3,envMapIntensity:.9}),pal:['#bdcb6a','#c9d67c','#b3c35e']}],r:.075,lay:'lying',w:.13,d:.085}; },
  melancia:()=>({parts:[{geo:ell(.17,.125,.125,12,8),mat:fm({map:stripeTex,roughness:.4}),pal:['#ffffff','#e6efe0','#f3f8ee']}],r:.15,lay:'rand'}),
  melao:()=>({parts:[{geo:ell(.095,.085,.095,9,6),mat:fm({map:netTex,roughness:.55}),pal:['#ffffff','#f5ecd0','#efe0a6']}],r:.09,lay:'rand'}),
  mamao:()=>({parts:[{geo:ell(.055,.055,.115,8,5),mat:fm({roughness:.4}),pal:['#f0a03a','#e89030','#cfc24a','#f4b24a']}],r:.058,lay:'lying',w:.23,d:.12}),
  manga:()=>({parts:[{geo:ell(.052,.045,.04,8,5),mat:fm({roughness:.4}),pal:['#c9423a','#d4543e','#e0a23a','#b8c04a','#cf6a3a']}],r:.048,lay:'rand'}),
  abacaxi:()=>{ const b=ell(.058,.095,.058,8,6); const cs=[]; for(let i=0;i<12;i++){ const c=new THREE.ConeGeometry(.009,.09,4); c.translate(0,.045,0); c.rotateZ(R(-.5,.5)); c.rotateY(i*.52); c.translate(0,.085,0); cs.push(c); } const crown=mergeGeometries(cs); return {parts:[{geo:b,mat:fm({map:pineTex,roughness:.5}),pal:['#ffffff','#f3e6c0','#e8d9a0']},{geo:crown,mat:fm({color:'#3f7d2c',roughness:.6})}],r:.065,lay:'up',h:.21}; },
  maracuja:()=>({parts:[{geo:ell(.034,.036,.034,6,5),mat:fm({bumpMap:noiseBump,bumpScale:2.5,roughness:.5}),pal:['#e6c42b','#dcb82a','#e9cf3e','#cfae22']}],r:.034,lay:'rand'}),
  coco:()=>({parts:[{geo:ell(.085,.11,.085,8,6),mat:fm({roughness:.7,bumpMap:noiseBump,bumpScale:1}),pal:['#6fa23a','#5f9230','#7aae44','#8fb454']}],r:.09,lay:'rand'}),
  pessego:()=>({parts:[{geo:ell(.037,.036,.037,8,5),mat:fm({roughness:.7,bumpMap:noiseBump,bumpScale:1}),pal:['#e8895a','#ef9c6a','#e9a979','#dd7a52']}],r:.038,lay:'rand'}),
  goiaba:()=>({parts:[{geo:ell(.04,.045,.04,8,5),mat:fm({roughness:.55,bumpMap:noiseBump,bumpScale:1.3}),pal:['#b6c24a','#c2cc58','#d4cf6a','#a5b83e']}],r:.042,lay:'rand'}),
  kiwi:()=>({parts:[{geo:ell(.03,.026,.026,6,5),mat:fm({roughness:.85,bumpMap:noiseBump,bumpScale:2}),pal:['#8a6a42','#7d5f3a','#957347']}],r:.028,lay:'rand'}),
  morango:()=>({parts:[{geo:new THREE.BoxGeometry(.19,.045,.13),mat:new THREE.MeshStandardMaterial({color:'#f2f6f4',transparent:true,opacity:.35,roughness:.1}),pal:null},{geo:(()=>{ const p=new THREE.PlaneGeometry(.185,.125); p.rotateX(-Math.PI/2); p.translate(0,.021,0); return p; })(),mat:fm({map:trayTex,roughness:.4})}],r:.1,lay:'tray',w:.2,d:.14,h:.045}),
};

FDEF.tomate=()=>({parts:[{geo:ell(.036,.032,.036,8,5),mat:fm({roughness:.35,envMapIntensity:.9}),pal:['#d33a2c','#c92e24','#dc4a33','#c0281f']}],r:.036,lay:'rand'});
FDEF.batata=()=>({parts:[{geo:ell(.048,.032,.036,7,5),mat:fm({roughness:.9,bumpMap:noiseBump,bumpScale:1.5}),pal:['#b89a6a','#a98a5a','#c4a674','#b08f5c']}],r:.04,lay:'rand'});
FDEF.cebola=()=>({parts:[{geo:ell(.046,.04,.046,8,5),mat:fm({roughness:.6}),pal:['#c98a3a','#d49a45','#b9772e','#d8a24e']}],r:.045,lay:'rand'});
FDEF.cenoura=()=>{ const g=new THREE.ConeGeometry(.016,.17,7); g.rotateZ(Math.PI/2); return {parts:[{geo:g,mat:fm({roughness:.55}),pal:['#e9791a','#f08a2a','#dd6e12']}],r:.02,lay:'lying',w:.17,d:.04}; };
FDEF.pimentao=()=>({parts:[{geo:ell(.04,.05,.04,8,6),mat:fm({roughness:.3,envMapIntensity:.9}),pal:['#3a8a2c','#2f7d27','#c9302c','#e8c02a','#d33a2c']}],r:.045,lay:'rand'});
FDEF.abobrinha=()=>{ const g=new THREE.CylinderGeometry(.021,.026,.2,8); g.rotateZ(Math.PI/2); return {parts:[{geo:g,mat:fm({roughness:.45}),pal:['#3f7a30','#4b8a38','#356a29']}],r:.026,lay:'lying',w:.2,d:.055}; };
FDEF.berinjela=()=>{ const g=new THREE.CylinderGeometry(.022,.036,.17,8); g.rotateZ(Math.PI/2); return {parts:[{geo:g,mat:fm({roughness:.25,envMapIntensity:1}),pal:['#3a1f4a','#2f173f','#43265a']}],r:.036,lay:'lying',w:.17,d:.075}; };
FDEF.alho=()=>({parts:[{geo:ell(.03,.026,.03,7,5),mat:fm({roughness:.7}),pal:['#efe8d8','#e6dcc6','#f3eee2']}],r:.03,lay:'rand'});
FDEF.alface=()=>{ const gs=[]; for(let i=0;i<7;i++){ const g=new THREE.SphereGeometry(.05,7,5); g.scale(1.1,.55,1.1); g.translate(R(-.04,.04),R(0,.06),R(-.04,.04)); gs.push(g); } const b=mergeGeometries(gs); centerAll([b]); return {parts:[{geo:b,mat:fm({roughness:.7}),pal:['#7fb93f','#6aa832','#90c64a','#5f9c2e']}],r:.085,lay:'rand'}; };
FDEF.repolho=()=>({parts:[{geo:ell(.1,.085,.1,8,6),mat:fm({roughness:.6}),pal:['#a9cf6a','#b9dc7e','#9bc45c']}],r:.1,lay:'rand'});
FDEF.couve=()=>{ const gs=[]; for(let i=0;i<6;i++){ const g=new THREE.SphereGeometry(.05,6,4); g.scale(2.6,.25,1.1); g.rotateY(i*.5); g.translate(R(-.03,.03),i*.012,R(-.03,.03)); gs.push(g); } const b=mergeGeometries(gs); centerAll([b]); return {parts:[{geo:b,mat:fm({roughness:.7,side:THREE.DoubleSide}),pal:['#2f7a2a','#3a8a30','#27702a']}],r:.1,lay:'lying',w:.3,d:.2}; };
FDEF.cheiroverde=()=>{ const gs=[]; for(let i=0;i<9;i++){ const g=new THREE.CylinderGeometry(.006,.008,.28,5); g.rotateZ(Math.PI/2+R(-.12,.12)); g.translate(0,R(0,.03),R(-.03,.03)); gs.push(g); } const b=mergeGeometries(gs); centerAll([b]); return {parts:[{geo:b,mat:fm({roughness:.7}),pal:['#3c8a2c','#4a9a34','#2f7a28']}],r:.05,lay:'lying',w:.3,d:.1}; };
function bananaDef(sc,pal,tipCol){ return ()=>{ const bodies=[],tips=[];
  for(let i=0;i<5;i++){ const curve=new THREE.CatmullRomCurve3([V3(-.09,.01,0),V3(-.045,-.025,0),V3(.02,-.035,0),V3(.075,-.01,0),V3(.1,.04,0)]); const t=new THREE.TubeGeometry(curve,8,.0165,6,false); const tip=new THREE.SphereGeometry(.011,8,6); tip.translate(.1,.04,0); const st=new THREE.CylinderGeometry(.008,.011,.025,8); st.translate(-.092,.018,0); for(const g of [t,tip,st]){ g.translate(0,i*.003,(i-2)*.034); g.rotateY((i-2)*.07); } bodies.push(t); tips.push(tip,st); }
  const b=mergeGeometries(bodies), t=mergeGeometries(tips); b.scale(sc,sc,sc); t.scale(sc,sc,sc); centerAll([b,t]);
  return {parts:[{geo:b,mat:fm({roughness:.45}),pal},{geo:t,mat:fm({color:tipCol,roughness:.8})}],r:.1*sc,lay:'bunch',w:.2*sc,d:.17*sc,h:.07}; }; }
FDEF.banprata=bananaDef(1,['#f2cd2e','#efc427','#d9c030','#f5d543'],'#5a4a22');
FDEF.bannanica=bananaDef(1.08,['#e9c628','#c8c336','#d6c42a','#b9c23a'],'#4d4a22');
FDEF.banmaca=bananaDef(.78,['#f5d94a','#f2d23e','#e9cb36'],'#6a5a2a');
const getF = k=>FD_[k]||(FD_[k]=Object.assign({kind:k,bag:null},FDEF[k]()));
