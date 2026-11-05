'use strict';
/* CÉU E ENTORNO
 * Cúpula do céu, panorama da Rua NEW visto pelo portão (recortado na parede) e chão externo.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== céu e chão externo ========== */
{
  const sky = ctex(2048,1024,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h*.56); gr.addColorStop(0,'#5f9fe0'); gr.addColorStop(.7,'#cfe3f4'); gr.addColorStop(1,'#efeadf'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<28;i++){ g.beginPath(); g.ellipse(rnd()*w,60+rnd()*200,70+rnd()*110,12+rnd()*12,0,0,7); g.fill(); }
    g.fillStyle='#b5bec8'; for(let i=0;i<70;i++){ const bw=30+rnd()*70,bh=20+rnd()*70; g.fillRect(i*30+rnd()*10,h*.56-bh,bw,bh); }
    g.fillStyle='#6d8d63'; for(let i=0;i<60;i++){ g.beginPath(); g.arc(i*36+rnd()*10,h*.56-6,26+rnd()*14,Math.PI,0); g.fill(); }
    g.fillStyle='#4d5056'; g.fillRect(0,h*.56,w,h*.44);
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(180,32,16), new THREE.MeshBasicMaterial({map:sky,side:THREE.BackSide,fog:false}));
  dome.position.y=-4; scene.add(dome);
  /* o galpão é fechado: pelo portão da frente se vê a RUA NEW de verdade (panorama tirado da própria Rua NEW, em 3 fotos) */
  renderer.localClippingEnabled=true; const PANO_CLIP=new THREE.Plane(new THREE.Vector3(0,0,1),-21.6);
  { const TL=new THREE.TextureLoader(), D=14, HF=74.79*Math.PI/180, W=2*D*Math.tan(HF/2), Hh=2*D*Math.tan(32.5*Math.PI/180), G=[0,1.65,21.3];
    [['l',HF],['c',0],['r',-HF]].forEach(([n,a])=>{ const t=TL.load('assets/pano-'+n+'.jpg'); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(W,Hh),new THREE.MeshBasicMaterial({map:t,fog:false,toneMapped:false}));
      m.position.set(G[0]+D*Math.sin(a),G[1],G[2]+D*Math.cos(a)); m.rotation.y=Math.PI+a;
      m.material.clippingPlanes=[PANO_CLIP];   // as fotos laterais do panorama avançavam pra dentro do galpão (retângulo preto/roxo na esquina da frente): só vale o que está fora da parede
      scene.add(m); });
    // calçada clara na frente do portão (mesma cor da calçada da Rua NEW), pro chão não "quebrar" onde a foto começa
    const cal=new THREE.Mesh(new THREE.PlaneGeometry(120,22),new THREE.MeshBasicMaterial({color:'#bdb6d3'})); cal.rotation.x=-Math.PI/2; cal.position.set(0,.01,32); scene.add(cal); }
  const asph = ctex(256,256,(g,w,h)=>{ g.fillStyle='#55585e'; g.fillRect(0,0,w,h); for(let i=0;i<3000;i++){ const v=70+rnd()*50|0; g.fillStyle=`rgba(${v},${v},${v+4},.5)`; g.fillRect(rnd()*w,rnd()*h,2,2); } },[60,60]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500,500), M({map:asph,roughness:.95}));
  ground.rotation.x=-Math.PI/2; ground.position.y=-.02; ground.receiveShadow=true; scene.add(ground);
}
