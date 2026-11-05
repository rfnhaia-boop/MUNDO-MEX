'use strict';
/* GALPÃO
 * Estrutura, telhado, colunas, luminárias, paredes fechadas e painéis de anúncio.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== galpão: estrutura, telhado, colunas, luminárias ========== */
const steel = M({color:'#4d6590',metalness:.3,roughness:.5,envMapIntensity:.6,emissive:'#2a3b5c',emissiveIntensity:.5});
const steelYellow = M({color:'#e0b020',metalness:.2,roughness:.55});
const concreteWall = M({color:'#cfcac0',roughness:.9,envMapIntensity:.25});
{
  // paredes baixas laterais (alvenaria) + parede do fundo
  for(const s of [-1,1]){
    const w=new THREE.Mesh(new THREE.BoxGeometry(.35,1.25,52),concreteWall); w.position.set(s*17,.625,-5); w.castShadow=w.receiveShadow=true; scene.add(w);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(.37,.22,52),M({color:'#8b5cf6',roughness:.6})); stripe.position.set(s*17,1.05,-5); scene.add(stripe);
  }
  const back=new THREE.Mesh(new THREE.BoxGeometry(34.7,ROOM.h+2.6,.4),M({color:'#e6e2d9',roughness:.92,envMapIntensity:.25})); back.position.set(0,(ROOM.h+2.6)/2,-31.2); back.receiveShadow=true; scene.add(back);
  const bandTex=ctex(2048,256,(g,w,h)=>{ g.fillStyle='#17131f'; g.fillRect(0,0,w,h); g.fillStyle='#8b5cf6'; g.fillRect(0,0,w,10); g.fillRect(0,h-10,w,10); g.fillStyle='#fff'; g.font='800 150px "Segoe UI",system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.textAlign='left'; const wN=g.measureText('NEW ').width, wC=g.measureText('CEASA').width, x0=w/2-(wN+wC)/2-330; g.fillText('NEW',x0,h/2+6); g.fillStyle='#c4b5fd'; g.fillText('CEASA',x0+wN,h/2+6); g.textAlign='center'; g.fillStyle='rgba(255,255,255,.7)'; g.font='700 42px "Segoe UI"'; g.fillText('HORTIFRÚTI COMPLETO · ATACADO',w/2+590,h/2+6); });
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(20,2.5),new THREE.MeshBasicMaterial({map:bandTex})); sign.position.set(0,6.6,-30.95); scene.add(sign);
  // colunas (borda do corredor e perímetro), base zebrada
  const colGeo=new THREE.BoxGeometry(.3,ROOM.h,.3), baseGeo=new THREE.BoxGeometry(.34,1.1,.34);
  const colPos=[]; for(const z of [18,10,2,-6,-14,-22,-30]) for(const x of [-17,-3.6,3.6,17]) { if(z===-30&&Math.abs(x)<5) continue; colPos.push([x,z]); }
  colPos.forEach(([x,z])=>{ const c=new THREE.Mesh(colGeo,steel); c.position.set(x,ROOM.h/2,z); c.castShadow=true; scene.add(c); const b=new THREE.Mesh(baseGeo,steelYellow); b.position.set(x,.55,z); scene.add(b); if(Math.abs(x)<10) col(x-.3,x+.3,z-.3,z+.3); });
  // tesouras do telhado (uma geometria só)
  const beams=[]; const beam=(x1,y1,x2,y2,z,t=.14)=>{ const L=Math.hypot(x2-x1,y2-y1); const g=new THREE.BoxGeometry(L,t,t); g.rotateZ(Math.atan2(y2-y1,x2-x1)); g.translate((x1+x2)/2,(y1+y2)/2,z); beams.push(g); };
  const EY=ROOM.h, RY=ROOM.h+2.6;
  for(let z=-30;z<=18;z+=6){ beam(-17,EY,17,EY,z,.2); beam(-17,EY,0,RY,z,.2); beam(0,RY,17,EY,z,.2); beam(0,EY,0,RY,z,.16);
    for(const x of [-8.5,8.5]) beam(x,EY,x*(8.5/8.5)*0+ (x<0?-4.25:4.25),(EY+RY)/2+.15,z,.12); beam(-8.5,EY,0,RY,z,.1); beam(8.5,EY,0,RY,z,.1); beam(-8.5,EY+.05,-4.25,EY+(RY-EY)*.5,z,.1); beam(8.5,EY+.05,4.25,EY+(RY-EY)*.5,z,.1); }
  for(const x of [-12,-6,0,6,12]){ const y=EY+(RY-EY)*(1-Math.abs(x)/17); const g=new THREE.BoxGeometry(.12,.12,48); g.translate(x,y,-6); beams.push(g); }
  const truss=new THREE.Mesh(mergeGeometries(beams),steel); truss.castShadow=true; scene.add(truss);
  // telhado: duas águas em chapa + faixas translúcidas
  const roofTex=ctex(256,256,(g,w,h)=>{ g.fillStyle='#b9bec4'; g.fillRect(0,0,w,h); for(let i=0;i<16;i++){ g.fillStyle=i%2?'rgba(255,255,255,.35)':'rgba(0,0,0,.2)'; g.fillRect(i*16,0,8,h); } },[10,6]);
  const roofMat=M({map:roofTex,metalness:.2,roughness:.6,side:THREE.DoubleSide,envMapIntensity:.4,emissive:'#a9afb8',emissiveMap:roofTex,emissiveIntensity:.55});
  const a=Math.atan2(RY-EY,17), L=Math.hypot(17,RY-EY);
  for(const s of [-1,1]){
    const gp=new THREE.Group(); gp.position.set(s*8.5,(EY+RY)/2,-5); gp.rotation.z=-s*a; scene.add(gp);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(L,52),roofMat); m.rotation.x=-Math.PI/2; gp.add(m);
    for(let z=-27;z<=21;z+=12){ const sk=new THREE.Mesh(new THREE.PlaneGeometry(L*.62,3.2),new THREE.MeshBasicMaterial({color:'#e9f4ff',side:THREE.DoubleSide,fog:false})); sk.rotation.x=-Math.PI/2; sk.position.set(0,-.03,z+5); gp.add(sk); }
  }
  // luminárias industriais penduradas
  const lampG=new THREE.CylinderGeometry(.5,.12,.32,14,1,true), lampM=new THREE.MeshBasicMaterial({color:'#fff6d8',side:THREE.DoubleSide});
  const bulbG=new THREE.SphereGeometry(.14,8,6);
  for(const x of [-10,-5,0,5,10]) for(let z=-27;z<=18;z+=6){ const l=new THREE.Mesh(lampG,M({color:'#2a2f38',metalness:.6,side:THREE.DoubleSide})); l.position.set(x,6.0,z); scene.add(l); const b=new THREE.Mesh(bulbG,lampM); b.position.set(x,5.86,z); scene.add(b); const c=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,1,4),steel); c.position.set(x,6.7,z); scene.add(c); }
  // feixes de sol (falsos) entrando pelas faixas translúcidas
  const shaftTex=ctex(64,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(255,240,200,.0)'); gr.addColorStop(.25,'rgba(255,240,200,.55)'); gr.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); const gh=g.createLinearGradient(0,0,w,0); gh.addColorStop(0,'rgba(0,0,0,1)'); gh.addColorStop(.5,'rgba(0,0,0,0)'); gh.addColorStop(1,'rgba(0,0,0,1)'); g.globalCompositeOperation='destination-out'; g.fillStyle=gh; g.fillRect(0,0,w,h); });
  const dir=SUN_TGT.clone().sub(SUN_POS).normalize();
  const shMat=new THREE.MeshBasicMaterial({map:shaftTex,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  for(const s of [-1,1]) for(let z=-22;z<=21;z+=12){
    const top=V3(s*8.5-s*1.2,ROOM.h+1.4,z), t=top.y/(-dir.y), len=t, mid=top.clone().addScaledVector(dir,len/2);
    for(const rot of [0,Math.PI/2]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(2.4,len),shMat); p.position.copy(mid); p.quaternion.setFromUnitVectors(V3(0,1,0),dir.clone().negate()); p.rotateY(rot); p.renderOrder=3; scene.add(p); }
  }
}

/* ========== galpão FECHADO: paredes laterais, fundo e frente (só a abertura da frente), com banners da loja ========== */
{
  const EY=ROOM.h, RY=ROOM.h+2.6;
  const wallTex=ctex(512,512,(g,w,h)=>{ g.fillStyle='#e6e2d9'; g.fillRect(0,0,w,h); for(let x=0;x<w;x+=128){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(x,0,3,h); } for(let i=0;i<500;i++){ g.fillStyle=`rgba(90,80,70,${rnd()*.05})`; g.fillRect(rnd()*w,rnd()*h,2+rnd()*12,1); } const gr=g.createLinearGradient(0,h*.72,0,h); gr.addColorStop(0,'rgba(60,50,40,0)'); gr.addColorStop(1,'rgba(60,50,40,.2)'); g.fillStyle=gr; g.fillRect(0,h*.72,w,h*.28); },[8,2]);
  const wallMat=M({map:wallTex,roughness:.92,envMapIntensity:.25});
  // laterais em altura total
  for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.BoxGeometry(.4,EY,52),wallMat); w.position.set(s*17.35,EY/2,-5); w.receiveShadow=true; scene.add(w); }
  // empena da frente: parede até o telhado com um portão largo no meio (única abertura pra rua)
  const OW=15, OH=5.8, tex2=wallTex.clone(); tex2.repeat.set(.25,.25); tex2.needsUpdate=true;
  const sh=new THREE.Shape(); sh.moveTo(-17.55,0); sh.lineTo(-OW/2,0); sh.lineTo(-OW/2,OH); sh.lineTo(OW/2,OH); sh.lineTo(OW/2,0); sh.lineTo(17.55,0); sh.lineTo(17.55,EY); sh.lineTo(0,RY); sh.lineTo(-17.55,EY); sh.closePath();
  const front=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.4,bevelEnabled:false}),M({map:tex2,roughness:.92,envMapIntensity:.25})); front.position.z=21.1; scene.add(front);
  // faixa roxa na base das paredes (fecha com o piso e dá identidade)
  const band=M({color:'#8b5cf6',roughness:.6});
  for(const s of [-1,1]){ const b=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,52),band); b.position.set(s*17.12,1.45,-5); scene.add(b); }
  /* PAINÉIS DAS PAREDES: artes prontas (2:1) em assets/paineis/. Para trocar, substitua o arquivo ou mude o mapa abaixo. */
  const SRGB=THREE.SRGBColorSpace, TLp=new THREE.TextureLoader();
  const arte=nome=>{ const t=TLp.load('assets/paineis/'+nome+'.webp'); t.colorSpace=SRGB; t.anisotropy=8; return t; };
  const B={ erp:arte('erp-proximo-destino'), caixa:arte('venda-ao-caixa'), gestao:arte('gestao-abastece'), estoque:arte('estoque-controle'), pedido:arte('pedido-organizado'),
    nota:arte('nota-fiscal'), entrega:arte('pedido-entrega'), zap:arte('whatsapp'), trop:arte('tropicais'), uvas:arte('uvas-finas'),
    flow:arte('new-flow-erp'), beto:arte('fale-com-beto') };
  const PW=6.6, PH=3.3;   // proporção 2:1 das artes
  const panel=(tex,x,y,z,ry,pw,ph)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); m.position.set(x,y,z); m.rotation.y=ry; scene.add(m);
    const fr=new THREE.Mesh(new THREE.PlaneGeometry(pw+.28,ph+.28),new THREE.MeshBasicMaterial({color:'#17131f'})); fr.position.copy(m.position); fr.rotation.y=ry; fr.translateZ(-.02); scene.add(fr); };
  // paredes laterais: 6 painéis por lado, entre as colunas (z do fundo para a entrada). As artes de fruta ficam do lado do box da mesma fruta.
  const zs=[-26,-18,-10,-2,6,14];
  const esq=[B.nota,B.uvas,B.entrega,B.pedido,B.erp,B.zap], dir=[B.zap,B.gestao,B.estoque,B.caixa,B.trop,B.beto];   // "Fale com o Beto" do lado do Beto e do telão
  zs.forEach((z,i)=>{ if(esq[i]) panel(esq[i],-17.14,4.0,z,Math.PI/2,PW,PH); if(dir[i]) panel(dir[i],17.14,4.0,z,-Math.PI/2,PW,PH); });
  // fundo: quatro painéis dos lados do mural
  panel(B.trop,-13.7,4.95,-30.93,0,5.8,2.9); panel(B.uvas,13.7,4.95,-30.93,0,5.8,2.9);
  panel(B.entrega,-13.7,1.85,-30.93,0,5.8,2.9); panel(B.erp,13.7,1.85,-30.93,0,5.8,2.9);
  // frente (por dentro): painéis dos dois lados do portão + faixa da marca em cima
  panel(B.gestao,-12.3,3.2,21.08,Math.PI,PW,PH); panel(B.zap,12.3,3.2,21.08,Math.PI,PW,PH);
  const faixaTex=(()=>{ const cv=document.createElement('canvas'); cv.width=2048; cv.height=190; const g=cv.getContext('2d'), t=new THREE.CanvasTexture(cv); t.colorSpace=SRGB; t.anisotropy=8;
    const gr=g.createLinearGradient(0,0,2048,0); gr.addColorStop(0,'#1a0f33'); gr.addColorStop(.5,'#3b1a7a'); gr.addColorStop(1,'#1a0f33'); g.fillStyle=gr; g.fillRect(0,0,2048,190);
    g.fillStyle='#8b5cf6'; g.fillRect(0,0,2048,8); g.fillRect(0,182,2048,8);
    g.textBaseline='middle'; g.textAlign='left'; g.font='800 112px "Segoe UI",system-ui'; const wN=g.measureText('NEW ').width; g.fillStyle='#fff'; g.fillText('NEW',70,100); g.fillStyle='#c4b5fd'; g.fillText('CEASA',70+wN,100);
    g.fillStyle='rgba(255,255,255,.92)'; g.font='700 50px "Segoe UI",system-ui'; g.textAlign='right'; g.fillText('HORTIFRÚTI COMPLETO NO ATACADO',1980,70); g.fillStyle='#c4b5fd'; g.font='600 38px "Segoe UI",system-ui'; g.fillText('Peça por caixa · fale com o Beto',1980,128);
    t.needsUpdate=true; return t; })();
  panel(faixaTex,0,6.5,21.08,Math.PI,15,1.4);
  // parede do fundo: acabamento (a caixa lisa de antes) + NEW Flow no centro, de frente pra quem entra (fim do corredor)
  const bw=new THREE.Mesh(new THREE.PlaneGeometry(34,10.1),wallMat); bw.position.set(0,5.05,-30.99); scene.add(bw);
  panel(B.flow,0,4.15,-30.9,0,5.6,2.8);
}
