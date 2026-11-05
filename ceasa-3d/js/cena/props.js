'use strict';
/* OBJETOS
 * Caminhão, carrinho de carga, balança e caçamba da xepa.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== caminhão na doca ========== */
function truck(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const white=M({color:'#e9ecef',roughness:.55,metalness:.1}), dark=M({color:'#1a1c20',roughness:.6}), floorW=M({map:woodTex('#a7885b'),roughness:.85});
  const BW=2.5,BH=2.5,BL=7.2,FY=1.2; // caixa de carga: rabeta aberta em -z
  addBox(g,BW+.1,.28,BL+3,dark,0,.9,BL/2+.3);       // chassi
  addBox(g,BW,.06,BL,floorW,0,FY,BL/2);             // assoalho
  for(const s of [-1,1]) addBox(g,.06,BH,BL,white,s*(BW/2),FY+BH/2,BL/2);
  addBox(g,BW,BH,.06,white,0,FY+BH/2,BL);           // parede frontal
  addBox(g,BW+.1,.07,BL+.1,white,0,FY+BH+.03,BL/2); // teto
  addBox(g,.04,.18,BL,M({color:'#8b5cf6',roughness:.5}),BW/2+.035,FY+BH*.55,BL/2);
  addBox(g,.04,.18,BL,M({color:'#8b5cf6',roughness:.5}),-BW/2-.035,FY+BH*.55,BL/2);
  for(const s of [-1,1]){ const lg=new THREE.Mesh(new THREE.PlaneGeometry(4.6,.8),new THREE.MeshBasicMaterial({map:ctex(1024,180,(c,w,h)=>{ c.fillStyle='rgba(0,0,0,0)'; c.clearRect(0,0,w,h); c.fillStyle='#14111c'; c.font='800 104px "Segoe UI",system-ui'; c.textAlign='left'; c.textBaseline='middle'; c.fillText('NEW',20,h/2); c.fillStyle='#8b5cf6'; c.fillText('HORTIFRÚTI',250,h/2); }),transparent:true})); lg.position.set(s*(BW/2+.07),FY+BH*.78,BL/2-.2); lg.rotation.y=s>0?Math.PI/2:-Math.PI/2; g.add(lg); }
  // cabine
  addBox(g,BW,1.5,1.9,white,0,FY+.55,BL+1.05);
  addBox(g,BW-.1,.9,.06,M({color:'#2b3b4a',roughness:.1,metalness:.5,envMapIntensity:1.2}),0,FY+1.1,BL+2.03);
  addBox(g,BW,.5,.8,white,0,FY-.05,BL+2.1);
  addBox(g,BW+.05,.18,.12,metalDark,0,FY-.28,BL+2.55);
  for(const s of [-1,1]){ const hl=new THREE.Mesh(new THREE.BoxGeometry(.3,.14,.04),new THREE.MeshBasicMaterial({color:'#fff6d0'})); hl.position.set(s*.85,FY-.05,BL+2.52); g.add(hl); }
  // rodas
  const wg=new THREE.CylinderGeometry(.5,.5,.32,20), wm=M({color:'#1a1a1a',roughness:.8}), hub=new THREE.CylinderGeometry(.22,.22,.34,12), hm=M({color:'#b8bdc4',metalness:.7,roughness:.4});
  for(const zz of [1.2,BL-1.3,BL+1.4]) for(const s of [-1,1]){ const w=new THREE.Mesh(wg,wm); w.rotation.z=Math.PI/2; w.position.set(s*(BW/2),.5,zz); w.castShadow=true; g.add(w); const h=new THREE.Mesh(hub,hm); h.rotation.z=Math.PI/2; h.position.set(s*(BW/2),.5,zz); g.add(h); }
  // porta traseira aberta
  const door=new THREE.Group(); door.position.set(BW/2,FY+BH/2,0); door.rotation.y=-1.75; g.add(door); addBox(door,1.3,BH,.05,white,-.65,0,0);
  col(x-BW/2-.4,x+BW/2+.4,z+.2,z+BL+2.8);
  // carga lá dentro e descarregando
  const PM=[[ -.55,1.2],[.6,1.2],[-.55,3.0],[.6,3.0],[-.55,4.8],[.6,4.8]];
  const loads=[P.laranja,P.banprata,P.laranja,P.gala,P.laranja,P.banprata];
  PM.forEach(([dx,dz],i)=>pallet({x:x+dx,z:z+dz,ry:Math.PI/2*(i%2?1:0)+.02,y0:FY+.03,p:loads[i],layers:4,wrap:true}));
}

/* ========== paleteira, carrinho de madeira, balança ========== */
function handCart(x,z,ry,p){ // carrinho de carregador: plataforma de madeira, 2 rodas grandes, alça
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
  const wd=M({map:woodTex('#9c7448'),roughness:.8});
  addBox(g,1.1,.08,1.9,wd,0,.5,0);
  for(const dz of [-.8,0,.8]) addBox(g,1.1,.08,.1,wd,0,.43,dz);
  const wh=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.07,18),M({color:'#222',roughness:.8})); for(const s of [-1,1]){ const w=wh.clone(); w.rotation.z=Math.PI/2; w.position.set(s*.58,.38,.35); w.castShadow=true; g.add(w); }
  for(const s of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.0,6),metalDark); h.rotation.x=Math.PI/2-.35; h.position.set(s*.45,.95,-1.25); g.add(h); }
  addBox(g,1.0,.03,.03,metalDark,0,1.28,-1.45);
  col(x-1.0,x+1.0,z-1.2,z+1.2);
  return g;
}
function platformScale(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  addBox(g,1.4,.12,1.4,M({color:'#5a6068',metalness:.5,roughness:.45}),0,.06,0);
  addBox(g,1.3,.03,1.3,M({color:'#9aa2ab',metalness:.7,roughness:.35}),0,.135,0);
  addBox(g,.05,1.05,.05,metalDark,.75,.55,-.6);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.34,.18),new THREE.MeshBasicMaterial({map:ctex(256,128,(c,w,h)=>{ c.fillStyle='#10151a'; c.fillRect(0,0,w,h); c.fillStyle='#9cff9c'; c.font='700 62px monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('384.5 kg',w/2,h/2); })}));
  scr.position.set(.75,1.15,-.54); scr.rotation.set(-.2,0,0); g.add(scr);
  col(x-.8,x+.8,z-.8,z+.8);
}
function binXepa(x,z){ // caçamba de resíduos / xepa
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  addBox(g,2.2,1.1,1.3,M({color:'#2f6f3c',roughness:.6,metalness:.3}),0,.55,0);
  const heap=[]; for(let i=0;i<40;i++){ const kinds=['laranja','banprata','gala','mamao','manga','tanger']; const k=kinds[(rnd()*kinds.length)|0]; const F=getF(k); const PMx=new THREE.Matrix4().makeTranslation(x,0,z); F.bagParts=F.bagParts||F.parts.map(pt=>mkBag(pt.geo,pt.mat,{color:!!pt.pal,shadow:false})); F.parts.forEach((pt,pi)=>{ const B=F.bagParts[pi]; B.m.push(compose(PMx,V3(R(-.9,.9),1.12+R(0,.14),R(-.5,.5)),qE(R(0,6.28),R(0,6.28),R(0,6.28)),V3(1,1,1))); if(pt.pal) B.c.push(_c.set(pt.pal[(rnd()*pt.pal.length)|0]).multiplyScalar(R(.5,.8)).clone()); }); }
  col(x-1.2,x+1.2,z-.8,z+.8);
}
