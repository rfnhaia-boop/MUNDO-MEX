/* 4º ANDAR · CLIENTES: área só de cliente (recepção, lounge, salas de projeto, estação de criação com PC).
   Módulo à parte: usa os ganchos de window.__SEDE e só desenha em FL[3]. Telas aqui são genéricas (nenhum dado real). */
(function(){
const S=window.__SEDE; if(!S||!S.THREE||!S.FL||!S.FL[3]){ console.warn('cliente.js: ganchos ausentes'); return; }
const T=S.THREE, G=S.FL[3], M=S.M, box=S.box, dk=S.dark, LED=S.LED[3], F=3;
const wood=M({color:'#b98a58',roughness:.55}), sofa=M({color:'#243b3a',roughness:.85}), teal=new T.MeshBasicMaterial({color:'#2dd4bf',toneMapped:false});
const glass=()=>new T.MeshPhysicalMaterial({color:'#e6fffb',transparent:true,opacity:.14,roughness:.02,depthWrite:false,envMapIntensity:1.3});
const tex=(w,h,fn)=>S.BM(S.ctex(w,h,fn));
const plane=(w,h,mat,x,y,z,ry)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h),mat); m.position.set(x,y,z); m.rotation.y=ry||0; G.add(m); return m; };
const font=(c,px,wt)=>{ c.font=(wt||700)+' '+px+'px "Segoe UI",system-ui'; };

/* luz própria do andar (os outros já têm a deles) */
const pl=new T.PointLight('#e8fffb',60,22,2); pl.position.set(0,S.FL[3].position.y+3.9,2); S.scene.add(pl);
const rug=new T.Mesh(new T.PlaneGeometry(14,8.4),new T.MeshBasicMaterial({color:'#2dd4bf',transparent:true,opacity:.08,depthWrite:false})); rug.rotation.x=-Math.PI/2; rug.position.set(-9.6,.013,-1); G.add(rug);

/* ---- faixa de título na parede do fundo ---- */
plane(13,2.4,tex(1300,240,(c,w,h)=>{ c.fillStyle='#07100f'; c.fillRect(0,0,w,h); c.fillStyle='#2dd4bf'; c.fillRect(0,0,w,10); c.textAlign='left'; font(c,86,800); c.fillStyle='#fff'; c.fillText('ÁREA DO CLIENTE',50,130); font(c,34,500); c.fillStyle='rgba(255,255,255,.6)'; c.fillText('aqui o seu projeto acontece, com a equipe de agentes da NEX',54,190); }),0,3.3,-13.6,0);

/* ---- lounge de espera (esquerda) ---- */
const sofaAt=(x,z,ry,w)=>{ const g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry; G.add(g); box(g,w,.42,.95,sofa,0,.3,0); box(g,w,.5,.22,sofa,0,.78,-.4); box(g,.22,.62,.95,sofa,-w/2+.11,.55,0); box(g,.22,.62,.95,sofa,w/2-.11,.55,0); box(g,w,.04,.06,LED,0,.08,.45); };
sofaAt(-12.5,-3.6,0,3.4); sofaAt(-14.6,-0.6,Math.PI/2,3.0); sofaAt(-12.5,2.2,Math.PI,3.4);
box(G,1.5,.06,1.5,wood,-12.4,.4,-.7); for(const [dx,dz] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]]) box(G,.06,.38,.06,dk,-12.4+dx,.19,-.7+dz); box(G,.6,.02,.6,LED,-12.4,.44,-.7);
S.addCol(F,-12.5,-3.6,3.4,1); S.addCol(F,-14.6,-.6,1,3.0); S.addCol(F,-12.5,2.2,3.4,1); S.addCol(F,-12.4,-.7,1.5,1.5);
for(const [x,z] of [[-15.1,-5.4],[-15.1,3.8]]){ const p=new T.Group(); p.position.set(x,0,z); G.add(p); box(p,.5,.5,.5,S.white,0,.25,0); for(let i=0;i<6;i++){ const l=new T.Mesh(new T.IcosahedronGeometry(.16+(i%3)*.05,1),M({color:['#2f6b3a','#3a7d44','#295c34'][i%3],roughness:.9,flatShading:true})); l.position.set(((i*37)%10-5)/25,.65+(i%3)*.18,((i*53)%10-5)/25); p.add(l); } }

/* ---- 3 salas de projeto (fundo) ---- */
const nomes=['SALA DO PROJETO · 1','SALA DO PROJETO · 2','SALA DO PROJETO · 3'];
[-10,0,10].forEach((cx,i)=>{
  const z0=-12.6, z1=-7;
  for(const [x,z,w,d] of [[cx,z1,6.2,.05],[cx-3.1,(z0+z1)/2,.05,z1-z0],[cx+3.1,(z0+z1)/2,.05,z1-z0]]){ const g=new T.Mesh(new T.BoxGeometry(w,3.1,d),glass()); g.position.set(x,1.65,z); G.add(g); box(G,w+.04,.06,d+.04,dk,x,3.2,z); box(G,w+.04,.06,d+.04,dk,x,.1,z); }
  box(G,.08,3.2,.08,dk,cx-.9,1.6,z1); box(G,.08,3.2,.08,dk,cx+.9,1.6,z1); /* vão da porta */
  plane(2.2,.42,tex(512,100,(c,w,h)=>{ c.fillStyle='rgba(7,16,15,.92)'; c.beginPath(); c.roundRect(2,2,w-4,h-4,18); c.fill(); c.fillStyle='#2dd4bf'; c.fillRect(20,h-14,w-40,5); font(c,34,800); c.fillStyle='#fff'; c.textAlign='center'; c.fillText(nomes[i],w/2,h*.55); }),cx,3.55,z1+.05,0);
  box(G,3.2,.07,1.2,wood,cx,.76,-10.6); for(const [dx,dz] of [[-1.5,-.5],[1.5,-.5],[-1.5,.5],[1.5,.5]]) box(G,.07,.74,.07,dk,cx+dx,.37,-10.6+dz); box(G,.5,.02,.4,LED,cx,.8,-10.6);
  plane(3.4,1.9,tex(1024,570,(c,w,h)=>{ c.fillStyle='#07100f'; c.fillRect(0,0,w,h); c.fillStyle='#2dd4bf'; c.fillRect(0,0,w,8); c.textAlign='left'; font(c,44,800); c.fillStyle='#fff'; c.fillText('PROJETO DO CLIENTE',36,86); font(c,26,500); c.fillStyle='rgba(255,255,255,.55)'; c.fillText('etapas, entregas e próximos passos aparecem aqui',38,126); ['Briefing','Criação','Revisão','No ar'].forEach((e,k)=>{ const y=180+k*84; c.fillStyle=k<1?'rgba(45,212,191,.2)':'rgba(255,255,255,.06)'; c.beginPath(); c.roundRect(36,y,w-72,64,14); c.fill(); font(c,28,700); c.fillStyle=k<1?'#5eead4':'rgba(255,255,255,.4)'; c.fillText((k+1)+'. '+e,60,y+42); c.textAlign='right'; c.fillText(k<1?'feito':'em breve',w-60,y+42); c.textAlign='left'; }); }),cx,2.0,-12.7,0);
  S.addCol(F,cx-3.1,(z0+z1)/2,.3,z1-z0); S.addCol(F,cx+3.1,(z0+z1)/2,.3,z1-z0); S.addCol(F,cx,-12.8,6.2,.3); S.addCol(F,cx,-10.6,3.2,1.3);
  S.addCol(F,cx-2,z1,2.2,.3); S.addCol(F,cx+2,z1,2.2,.3);
});

/* ---- estação de criação com PC (direita) ---- */
plane(3.6,.5,tex(720,100,(c,w,h)=>{ c.fillStyle='rgba(7,16,15,.92)'; c.beginPath(); c.roundRect(2,2,w-4,h-4,18); c.fill(); c.fillStyle='#2dd4bf'; c.fillRect(20,h-14,w-40,5); font(c,40,800); c.fillStyle='#fff'; c.textAlign='center'; c.fillText('ESTAÇÃO DE CRIAÇÃO',w/2,h*.58); }),10.4,3.5,-5.2,0);
const pcC=document.createElement('canvas'); pcC.width=1024; pcC.height=640; const pcx=pcC.getContext('2d'), pcT=new T.CanvasTexture(pcC); pcT.colorSpace=T.SRGBColorSpace; pcT.anisotropy=4; const pcScreen=new T.MeshBasicMaterial({map:pcT,toneMapped:false});
function drawPC(o){ o=o||{}; const c=pcx,w=1024,h=640; c.fillStyle='#0b1514'; c.fillRect(0,0,w,h); c.fillStyle='#2dd4bf'; c.fillRect(0,0,w,8); c.textAlign='left';
  if(o.plano){ font(c,36,800); c.fillStyle='#fff'; c.fillText('SEU PLANO · '+o.plano,34,76); font(c,22,500); c.fillStyle='rgba(255,255,255,.55)'; c.fillText(o.empresa||'',36,112); (o.itens||[]).slice(0,6).forEach((t,k)=>{ const y=142+k*70; c.fillStyle='rgba(45,212,191,.14)'; c.beginPath(); c.roundRect(34,y,w-68,58,14); c.fill(); font(c,25,700); c.fillStyle='#5eead4'; c.fillText('✓',56,y+39); font(c,25,600); c.fillStyle='#fff'; c.fillText(t,92,y+39); }); font(c,20,500); c.fillStyle='rgba(255,255,255,.4)'; c.fillText('Análise Estratégica gratuita antes de qualquer compromisso',36,h-30); }
  else { font(c,34,800); c.fillStyle='#fff'; c.fillText('Chat com a IA',34,70); font(c,22,500); c.fillStyle='rgba(255,255,255,.5)'; c.fillText('o Ravi te acompanha e a gente cria junto',36,106);
    c.fillStyle='rgba(255,255,255,.06)'; c.beginPath(); c.roundRect(34,140,w-68,90,16); c.fill(); font(c,26,600); c.fillStyle='#d7f9f4'; c.fillText(o.user||'Quero criar o Instagram da minha empresa',56,196);
    c.fillStyle='rgba(45,212,191,.16)'; c.beginPath(); c.roundRect(34,260,w-68,170,16); c.fill(); font(c,24,500); c.fillStyle='#fff'; c.fillText('Bora! Me conta o que a empresa vende,',56,310); c.fillText('o tom que você quer e eu monto os primeiros posts.',56,348); c.fillStyle='#5eead4'; font(c,22,700); c.fillText('em breve: conectado de verdade',56,400);
    c.fillStyle='rgba(255,255,255,.08)'; c.beginPath(); c.roundRect(34,h-100,w-68,64,32); c.fill(); font(c,22,500); c.fillStyle='rgba(255,255,255,.35)'; c.fillText('Escreva aqui...',64,h-60); }
  pcT.needsUpdate=true; }
drawPC(); S.cliente={drawPC};
[[6.5,-1.2],[10.4,-1.2],[14.0,-1.2]].forEach(([x,z],i)=>{
  box(G,2.6,.07,1.2,wood,x,.76,z); for(const [dx,dz] of [[-1.2,-.5],[1.2,-.5],[-1.2,.5],[1.2,.5]]) box(G,.07,.74,.07,dk,x+dx,.37,z+dz);
  box(G,1.3,.8,.06,dk,x,1.25,z-.35); box(G,.06,.34,.06,dk,x,.95,z-.35); const sc=plane(1.2,.72,i===1?pcScreen:tex(512,320,(c,w,h)=>{ c.fillStyle='#0b1514'; c.fillRect(0,0,w,h); c.fillStyle='#2dd4bf'; c.fillRect(0,0,w,5); font(c,26,700); c.fillStyle='rgba(255,255,255,.5)'; c.textAlign='center'; c.fillText('posto livre',w/2,h/2); }),x,1.25,z-.31,0);
  const ch=new T.Group(); ch.position.set(x,0,z+1.0); ch.rotation.y=Math.PI; G.add(ch); box(ch,.5,.07,.5,dk,0,.46,0); box(ch,.5,.6,.07,dk,0,.78,-.25); box(ch,.06,.42,.06,dk,0,.22,0); box(ch,.5,.04,.5,dk,0,.03,0);
  S.addCol(F,x,z,2.6,1.2);
});


/* ---- o "cara do PC": agente de capacete (Flow) em pé ao lado do computador, sempre olhando pra câmera ---- */
{ const t=new T.TextureLoader().load('../shared/personagens/ravi-em-pe.png'); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8;
  const g=new T.Group(); g.position.set(12.9,0,-0.35); G.add(g);
  const pic=new T.Mesh(new T.PlaneGeometry(1.82*.341,1.82),new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.35,toneMapped:false})); pic.position.y=.91; g.add(pic);
  const sh=new T.Mesh(new T.CircleGeometry(.26,24),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.012; g.add(sh);
  const wp=new T.Vector3();
  S.ANIM.push(()=>{ g.getWorldPosition(wp); const c=S.camera.position; pic.rotation.y=Math.atan2(c.x-wp.x,c.z-wp.z); });
  S.addCol(F,12.9,-0.35,.6,.5); }

/* ---- recepção do cliente (frente) ---- */
box(G,4.6,1.05,.9,wood,0,.52,8.4); box(G,4.7,.06,1.0,LED,0,1.07,8.4); box(G,4.4,.03,.06,LED,0,.1,8.88); S.addCol(F,0,8.4,4.7,1);
plane(3.4,.7,tex(680,140,(c,w,h)=>{ c.fillStyle='#07100f'; c.fillRect(0,0,w,h); c.fillStyle='#2dd4bf'; c.fillRect(0,h-8,w,8); font(c,54,800); c.fillStyle='#fff'; c.textAlign='center'; c.fillText('ATENDIMENTO',w/2,h*.62); }),0,1.8,8.0,Math.PI);

/* ---- anfitriã do andar (agente) ---- */
const host=S.agent('#0f766e',false); host.position.set(0,0,7.5); host.rotation.y=0; G.add(host);
console.log('cliente.js: 4º andar montado');
})();
