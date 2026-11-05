'use strict';
/* PISO
 * Concreto em foto + decal com faixas, números dos boxes e sujeira.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== chão com marcações, sujeira e manchas (um canvas só, não repete) ========== */
const FW=36, FD=52, FCX=0, FCZ=-5, FPX=2304, FPZ=3328;
const gx = x=>(x+FW/2)/FW*FPX, gz = z=>(z-(FCZ-FD/2))/FD*FPZ;
/* piso de concreto em FOTO (gerada no Google Flow), repetido; as marcações e a sujeira continuam no decal por cima */
const floorBase = new THREE.TextureLoader().load('assets/piso-concreto.jpg');
floorBase.colorSpace = THREE.SRGBColorSpace; floorBase.wrapS = floorBase.wrapT = THREE.RepeatWrapping; floorBase.repeat.set(6,9); floorBase.anisotropy = 8;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(FW,FD), M({map:floorBase,roughness:.55,metalness:.02,envMapIntensity:.5}));
floor.rotation.x=-Math.PI/2; floor.position.set(FCX,0,FCZ); floor.receiveShadow=true; scene.add(floor);

const floorDecal = ctex(FPX,FPZ,(g,w,h)=>{
  g.clearRect(0,0,w,h);
  // manchas largas de umidade/óleo
  for(let i=0;i<70;i++){ const x=rnd()*w,y=rnd()*h,r=40+rnd()*170; const gr=g.createRadialGradient(x,y,0,x,y,r); const a=.06+rnd()*.16; gr.addColorStop(0,`rgba(30,28,24,${a})`); gr.addColorStop(1,'rgba(30,28,24,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,r,r*R(.4,1),rnd()*3,0,7); g.fill(); }
  // corredor central: pneus de carrinho e desgaste
  for(let i=0;i<260;i++){ const x=gx(R(-3,3)), y=rnd()*h; g.strokeStyle=`rgba(25,22,20,${.04+rnd()*.07})`; g.lineWidth=2+rnd()*6; g.beginPath(); g.moveTo(x,y); g.lineTo(x+R(-30,30),y+R(80,400)); g.stroke(); }
  // restos de fruta, folhas e papelão
  const bits=['#5f8f2e','#7ab03a','#e7a21f','#d4521e','#9a2f2a','#b88c58','#e6d36a'];
  for(let i=0;i<900;i++){ const x=rnd()<.6?gx(R(-17,17)):gx(R(-3.6,3.6)), y=rnd()*h; g.fillStyle=bits[(rnd()*bits.length)|0]; g.globalAlpha=.25+rnd()*.4; g.beginPath(); g.ellipse(x,y,2+rnd()*6,1.5+rnd()*4,rnd()*6,0,7); g.fill(); }
  g.globalAlpha=1;
  // faixas amarelas do corredor
  g.fillStyle='#e8b923'; for(const x of [-3.6,3.6]) g.fillRect(gx(x)-9,gz(-30),18,gz(11)-gz(-30));
  // linhas de divisão dos boxes e números pintados
  const zc=[6,-2,-10,-18]; g.strokeStyle='#ecece6'; g.lineWidth=8; g.globalAlpha=.9;
  for(const s of [-1,1]){ for(const zb of [10,2,-6,-14,-22]){ g.beginPath(); g.moveTo(gx(s*3.6),gz(zb)); g.lineTo(gx(s*16.4),gz(zb)); g.stroke(); } }
  g.globalAlpha=1; g.fillStyle='rgba(236,236,230,.88)'; g.font='800 120px "Segoe UI",system-ui'; g.textAlign='center'; g.textBaseline='middle';
  [-1,1].forEach((s,si)=>zc.forEach((z,i)=>{ g.save(); g.translate(gx(s*4.15),gz(z)); g.rotate(s>0?-Math.PI/2:Math.PI/2); g.fillText(String(si*4+i+1).padStart(2,'0'),0,0); g.restore(); }));
  // área de doca: faixas diagonais amarelo/preto
  g.save(); g.beginPath(); g.rect(gx(-3.6),gz(11.2),gx(3.6)-gx(-3.6),30); g.clip();
  for(let i=-10;i<80;i++){ g.fillStyle=i%2?'#e8b923':'#222'; g.beginPath(); g.moveTo(gx(-3.6)+i*30,gz(11.2)); g.lineTo(gx(-3.6)+i*30+30,gz(11.2)); g.lineTo(gx(-3.6)+i*30,gz(11.2)+30); g.lineTo(gx(-3.6)+i*30-30,gz(11.2)+30); g.fill(); }
  g.restore();
  g.fillStyle='rgba(236,236,230,.9)'; g.font='800 56px "Segoe UI"'; g.save(); g.translate(gx(0),gz(13.4)); g.fillText('RECEBIMENTO · NEW CEASA',0,0); g.restore();
  g.save(); g.translate(gx(0),gz(-26)); g.font='800 64px "Segoe UI"'; g.fillText('↑  PEDESTRES  ↑',0,0); g.restore();
});
const decal = new THREE.Mesh(new THREE.PlaneGeometry(FW,FD), new THREE.MeshStandardMaterial({map:floorDecal,transparent:true,roughness:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
decal.rotation.x=-Math.PI/2; decal.position.set(FCX,.004,FCZ); decal.receiveShadow=true; scene.add(decal);
