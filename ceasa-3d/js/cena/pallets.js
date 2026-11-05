'use strict';
/* PALLETS
 * Pallet com caixas e fruta por cima, plaquinha de preço e a área de mira de cada produto.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== pallet + caixas + fruta ========== */
const pickMeshes=[];
function fruitTop(PM,p,kind,cx,cz,yTop,sx,sz,display){
  const F=getF(kind); F.used=true;
  F.bagParts=F.bagParts||F.parts.map(pt=>mkBag(pt.geo,pt.mat,{color:!!pt.pal,shadow:false}));
  const put=(pos,q,sc=1)=>{ F.parts.forEach((pt,i)=>{ const B=F.bagParts[i]; B.m.push(compose(PM,pos,q,V3(sc,sc,sc))); if(pt.pal) B.c.push(_c.set(pt.pal[(rnd()*pt.pal.length)|0]).multiplyScalar(R(.88,1.08)).clone()); }); };
  const lay=F.lay;
  const qOf=()=> lay==='up'?qE(R(-.25,.25),R(0,6.28),R(-.25,.25)) : lay==='lying'?qE(0,R(0,6.28),Math.PI/2+R(-.2,.2)) : lay==='bunch'?qE(R(-.1,.1),Math.round(rnd())*Math.PI/2+R(-.15,.15),R(-.08,.08)) : lay==='tray'?qY(R(-.04,.04)) : qE(R(0,6.28),R(0,6.28),R(0,6.28));
  if(lay==='bunch'||lay==='tray'||lay==='lying'&&F.w){
    const w=F.w,d=F.d, cols=Math.max(1,Math.floor((sx-.02)/w)), rows=Math.max(1,Math.floor((sz-.02)/d)), layers=lay==='tray'?(display?2:1):2;
    for(let l=0;l<layers;l++) for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
      if(l>0&&display&&rnd()<.25) continue;
      const x=cx+(i-(cols-1)/2)*w+R(-.012,.012)+(l%2?.02:0), z=cz+(j-(rows-1)/2)*d+R(-.012,.012);
      const y=yTop+(F.h||.055)*(l+.55)+(lay==='bunch'?l*.01:0);
      put(V3(x,y,z),qOf());
    }
    return;
  }
  const r=F.r, step=2*r*.98, cols=Math.max(1,Math.floor((sx-.03)/step)), rows=Math.max(1,Math.floor((sz-.03)/step));
  const layers=display?2:1;
  for(let l=0;l<layers;l++){ const c2=l?cols-1:cols, r2=l?rows-1:rows; for(let i=0;i<c2;i++) for(let j=0;j<r2;j++){
    if(l&&rnd()<.2) continue;
    const x=cx+(i-(c2-1)/2)*step+R(-.1,.1)*r, z=cz+(j-(r2-1)/2)*step+R(-.1,.1)*r;
    const edge=Math.max(Math.abs(i-(c2-1)/2)/Math.max(1,(c2-1)/2),Math.abs(j-(r2-1)/2)/Math.max(1,(r2-1)/2));
    const y=yTop+r*(.75+l*1.25)+R(0,.12)*r - (l?0:edge*.0) + (display?(1-edge)*r*.4:0);
    put(V3(x,y,z),qOf(),R(.93,1.06));
  } }
}
function pallet({x,z,ry,y0=0,p,layers=2,display=false,wrap=false,tall=null}){
  const PM=new THREE.Matrix4().compose(V3(x,y0,z),qY(ry),ONE);
  palletBag.m.push(PM.clone()); palletBag.c.push(colorOf('#ffffff',R(.75,1.05)));
  const pk=PACK[p.pack], [cw,ch,cd]=pk.dims, [nx,nz]=pk.grid;
  let y=PALLET_H;
  const fruitFor=()=>Array.isArray(p.fruit)?p.fruit[(rnd()*p.fruit.length)|0]:p.fruit;
  for(let l=0;l<layers;l++){ const top=l===layers-1;
    for(let i=0;i<nx;i++) for(let j=0;j<nz;j++){
      const pos=V3((i-(nx-1)/2)*cw+R(-.012,.012),y,(j-(nz-1)/2)*cd+R(-.012,.012));
      const q=qY(R(-.025,.025));
      pk.bag.m.push(compose(PM,pos,q)); pk.bag.c.push(pk.colors(p));
      if(p.empty) continue;
      const kind=fruitFor(), F=getF(kind), baseCol=F.parts[0].pal?F.parts[0].pal[0]:'#a52a22';
      const fh=top?ch*.7:ch*.97;
      fillBag.m.push(compose(PM,V3(pos.x,y+fh/2,pos.z),q,V3(cw-.03,fh,cd-.03)));
      fillBag.c.push(colorOf(baseCol,.55));
      if(top&&(display||p.pack==='BIN'||rnd()<.9)) fruitTop(PM,p,kind,pos.x,pos.z,y+fh,cw-.03,cd-.03,display||p.pack==='BIN');
    }
    y+=ch;
  }
  if(wrap&&!p.empty){ const m=new THREE.Mesh(new THREE.BoxGeometry(1.24,y-PALLET_H-.1,1.04),stretchMat); m.position.set(x,y0+PALLET_H+(y-PALLET_H-.1)/2,z); m.rotation.y=ry; scene.add(m); }
  return {top:y};
}
const handFont='700 "Segoe Print","Comic Sans MS",cursive';
function boardTex(p){ return ctex(512,256,(g,w,h)=>{
  g.fillStyle='#f5f3ea'; g.fillRect(0,0,w,h); g.strokeStyle='#d8d4c6'; g.lineWidth=6; g.strokeRect(3,3,w-6,h-6);
  g.fillStyle=p.box; g.fillRect(0,0,w,26);
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#b3171d'; g.font=`${handFont.replace('700','800')}`.replace('"Segoe Print"','"Segoe Print"');
  g.font='800 70px "Segoe Print","Comic Sans MS",cursive'; g.fillText(p.name.toUpperCase(),w/2,84);
  g.font='700 38px "Segoe Print","Comic Sans MS",cursive'; g.fillStyle='#1d3f9a'; g.fillText(p.var,w/2,134);
  g.fillStyle='#111'; if(TABELA){ g.font='800 56px "Segoe UI",system-ui'; g.fillText('R$ '+p.price.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2}),w/2,190); } else { g.font='800 40px "Segoe UI",system-ui'; g.fillStyle='#1d3f9a'; g.fillText('valor: consulte',w/2,188); }
  g.fillStyle='#555'; g.font='700 26px "Segoe UI"'; g.fillText(p.kg?`cx ${String(p.kg).replace('.',',')} kg`:'unidade',w/2,232);
}); }
function placeDisplay(p,x,z,s,layers=2){
  pallet({x,z,ry:Math.PI/2,p,layers,display:true});
  const topY=PALLET_H+layers*PACK[p.pack].dims[1];
  const pickH=topY+(p.pack==='BIN'?.45:.22);
  const pm=new THREE.Mesh(new THREE.BoxGeometry(1.0,pickH,1.22),new THREE.MeshBasicMaterial({visible:false}));
  pm.position.set(x,pickH/2,z); pm.userData={p,h:pickH}; scene.add(pm); pickMeshes.push(pm);
  // plaquinha de preço no espeto
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(.5,.25),new THREE.MeshBasicMaterial({map:boardTex(p),side:THREE.DoubleSide}));
  const sx=x-s*.56; sg.position.set(sx,topY+.28,z); sg.rotation.set(0,s>0?-Math.PI/2:Math.PI/2,0); sg.rotateX(-.22); scene.add(sg);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.34,5),M({color:'#7a5a3a'})); st.position.set(sx,topY+.1,z); scene.add(st);
  col(x-.55,x+.55,z-.65,z+.65);
}
