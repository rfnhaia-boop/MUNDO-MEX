'use strict';
/* BANCAS (BOXES) E TOTENS
 * Banner, pilhas, balcão de cada box e o totem 3D na entrada do box.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== boxes (bancas) ========== */
const metalDark=M({color:'#2b2f36',metalness:.6,roughness:.45});
function bannerTex(num,name,color){ return ctex(1024,200,(g,w,h)=>{ g.fillStyle='#14111c'; g.fillRect(0,0,w,h); g.fillStyle=color; g.fillRect(0,0,28,h); g.fillRect(w-28,0,28,h); g.fillStyle='#fff'; g.font='800 120px "Segoe UI",system-ui'; g.textAlign='left'; g.textBaseline='middle'; g.fillText('BOX '+String(num).padStart(2,'0'),56,h/2+4); g.fillStyle=color; g.fillRect(430,28,6,h-56); g.fillStyle='#fff'; g.font='800 72px "Segoe UI"'; g.textAlign='left'; g.fillText(name,470,h/2+4); }); }
const BANNER_FOTO={1:'assets/boxes/box-01-bananas.webp',2:'assets/boxes/box-02-citrus.webp',3:'assets/boxes/box-03-maca-pera.webp',4:'assets/boxes/box-04-uvas-finas.webp',5:'assets/boxes/box-05-tropicais.webp',6:'assets/boxes/box-06-melancia-legumes.webp',7:'assets/boxes/box-07-raizes.webp',8:'assets/boxes/box-08-verduras.webp'};   // banners dos boxes (arte pronta, 2:1), um por banca
function stall({s,zc,num,name,color,items,xx=null}){
  // placas e banner
  const bnMat=new THREE.MeshBasicMaterial({map:bannerTex(num,name,color),side:THREE.DoubleSide});
  const bn=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.1),bnMat);
  bn.position.set(s*4.3,4.35,zc); bn.rotation.y=s>0?-Math.PI/2:Math.PI/2; scene.add(bn);
  if(BANNER_FOTO[num]) new THREE.TextureLoader().load(BANNER_FOTO[num],t=>{ t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; const h=5.6*t.image.height/t.image.width; bnMat.map=t; bnMat.toneMapped=false; bnMat.needsUpdate=true; bn.geometry.dispose(); bn.geometry=new THREE.PlaneGeometry(5.6,h); bn.position.y=3.75+h/2; });
  for(const dz of [-2.5,2.5]){ const c=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.5,6),metalDark); c.position.set(s*4.3,5.6,zc+dz); scene.add(c); }
  const denso=items.length>3, passo=denso?1.6:2.6;
  items.forEach((p,i)=>{
    const z=zc+(i-(items.length-1)/2)*passo;
    placeDisplay(p,s*4.95,z,s,2);
    // pilhas de fundo (mesmo produto, mais alto); bancas densas levam menos pilhas pra não pesar
    (denso?[[6.55,3],[8.2,4]]:[[6.55,3],[8.2,4],[9.85,5]]).forEach(([dx,n],k)=>{
      if(k>0&&rnd()<.18) return;
      pallet({x:s*dx,z:z+R(-.04,.04),ry:Math.PI/2+R(-.04,.04),p,layers:p.pack==='BIN'?(k===0?2:1):n+(rnd()<.3?1:0),wrap:p.pack!=='BIN'&&rnd()<.45});
      col(s*dx-.55,s*dx+.55,z-.65,z+.65);
    });
  });
  // balcão do box (balança, caderno, cadeira)
  const g=new THREE.Group(); g.position.set(s*13.9,0,zc+.2); g.rotation.y=s>0?-Math.PI/2:Math.PI/2; scene.add(g);
  addBox(g,2.1,.92,.75,M({map:woodTex('#8a6a45'),roughness:.75}),0,.46,0);
  addBox(g,2.2,.05,.85,M({color:'#d9d3c4',roughness:.6}),0,.945,0);
  addBox(g,.5,.07,.4,M({color:'#cfd3d8',metalness:.6,roughness:.35}),-.55,1.0,0);
  addBox(g,.16,.14,.1,M({color:'#1d1f26'}),-.55,1.12,-.12);
  addBox(g,.34,.015,.24,M({color:'#f5f0dc'}),.4,.985,.04);
  const ch=addBox(g,.42,.04,.4,M({color:'#2a5a9a'}),.2,.46,1.0); addBox(g,.42,.4,.04,M({color:'#2a5a9a'}),.2,.7,1.2); for(const [dx,dz] of [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]]) addBox(g,.03,.44,.03,metalDark,.2+dx,.22,1.0+dz);
  col(s*13.9-1.2,s*13.9+1.2,zc-.7,zc+1.9);
  totem3D({s,zc,num,name,color,items});
}
/* ===== totem do box: tela em pé na entrada do box; apontar + E abre o painel (totem.js) ===== */
const TOTEM_COR={};
function totem3D({s,zc,num,name,color,items}){
  TOTEM_COR[num]=color; const x=s*3.0, z=zc+1.5, g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=s>0?-Math.PI/2:Math.PI/2; scene.add(g);
  const body=M({color:'#17141f',metalness:.55,roughness:.32}), acc=M({color:color,emissive:color,emissiveIntensity:.9,roughness:.4});
  addBox(g,.62,.06,.5,metalDark,0,.03,0);                       // base
  addBox(g,.46,1.5,.12,body,0,.81,0);                           // corpo
  addBox(g,.5,.05,.16,body,0,1.58,0);                           // topo
  addBox(g,.5,.035,.17,acc,0,1.62,0);                           // faixa de luz na cor do box
  addBox(g,.05,.9,.05,metalDark,0,.5,-.22);                     // apoio traseiro
  const tex=ctex(512,1024,(c,w,h)=>{
    const gr=c.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#1b1530'); gr.addColorStop(1,'#0b0912'); c.fillStyle=gr; c.fillRect(0,0,w,h);
    c.fillStyle=color; c.fillRect(0,0,w,22);
    c.textAlign='center'; c.fillStyle='#ffffff'; c.font='800 120px "Segoe UI",system-ui'; c.fillText('BOX',w/2,190); c.fillStyle=color; c.font='800 330px "Segoe UI",system-ui'; c.fillText(String(num).padStart(2,'0'),w/2,520);
    c.fillStyle='#fff'; c.font='800 52px "Segoe UI",system-ui'; const words=name.split(' '); let ln='',y=610; for(const wd of words){ if((ln+' '+wd).length>14&&ln){ c.fillText(ln.trim(),w/2,y); y+=58; ln=wd; } else ln+=' '+wd; } c.fillText(ln.trim(),w/2,y);
    c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.roundRect(46,820,w-92,120,26); c.fill(); c.fillStyle='#fff'; c.font='700 40px "Segoe UI",system-ui'; c.fillText('📷 fotos reais · estoque',w/2,872); c.fillStyle='#c4b5fd'; c.font='700 34px "Segoe UI",system-ui'; c.fillText('aponte e aperte  E',w/2,918);
  });
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.4,.8),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); scr.position.set(0,.98,.064); g.add(scr);
  const gl=new THREE.PointLight(color,.55,3.2,2); gl.position.set(0,1.2,.5); g.add(gl);
  const ids=items.map(p=>Object.keys(P).find(k=>P[k]===p)).filter(Boolean);
  const pm=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),new THREE.MeshBasicMaterial({visible:false})); pm.position.set(x,.9,z); pm.userData={totem:{num,nome:name,cor:color,ids},h:1.8}; scene.add(pm); pickMeshes.push(pm);
  col(x-.4,x+.4,z-.4,z+.4);
}
