/* NewVendedor — molde de vendedor virtual das lojas NEW.
 * Cada loja chama NewVendedor.create(config). Entrega: avatar 3D + chat + cérebro de venda
 * (regras, funciona offline). Opcional: config.llm = {endpoint} pluga um modelo de verdade.
 *
 * config = {
 *   id, nome, cargo, loja, cor,
 *   catalogo:[{id,nome,variante,preco,kg,embalagem,aliases[],grupo,cat,shelf,tip,pair[],seg:{segId:'texto'}}],
 *   categorias:[{id,rotulo,emoji,palavras[],itens[]}],
 *   segmentos:[{id,rotulo,emoji,palavras[],intro}],
 *   bundles:{segId:[[itemId,qtd],...]},
 *   regras:{min,freteGratis,frete,entrega,pagamento},
 *   unidade:(item,q)=>'caixa'|'caixas'...,
 *   ganchos:{carrinho()->[{id,q}], adicionar(id,q), remover(id), mostrar(id), fechar(), total()},
 *   avatar:{skin,shirt,pants,cap,apron,apronText},
 *   three:{THREE,scene,pos:[x,y,z],pickMeshes,col(x0,x1,z0,z1)}   // opcional: avatar 3D
 *   llm:{endpoint,headers}   // opcional
 * }
 */
(function(){
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pick=a=>a[(Math.random()*a.length)|0];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NUM={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,doze:12,quinze:15,vinte:20};

const CSS=`
.vbtn{position:fixed;right:16px;bottom:92px;z-index:6;display:flex;align-items:center;gap:11px;padding:8px 18px 8px 8px;border:1px solid rgba(255,255,255,.18);border-radius:99px;background:linear-gradient(135deg,rgba(40,30,70,.88),rgba(18,16,28,.9));backdrop-filter:blur(16px);color:#fff;font:600 14px "Segoe UI",system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 40px rgba(0,0,0,.45),0 0 0 0 var(--vc);transition:transform .15s,box-shadow .2s}
.vbtn:hover{transform:translateY(-2px);box-shadow:0 16px 44px rgba(0,0,0,.5),0 0 30px -6px var(--vc)}
.vbtn .vpic{width:42px;height:42px;border-radius:50%;background:var(--vc) var(--vp) center 18%/cover;border:2px solid rgba(255,255,255,.85);position:relative;flex:none}
.vbtn .vpic::after{content:'';position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:#37d67a;border:2px solid #15131f}
.vbtn small{display:block;font-weight:500;opacity:.62;font-size:11px;margin-top:1px}
.vtip{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);padding:10px 18px;border-radius:14px;background:rgba(18,18,24,.82);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.16);color:#fff;font:14px "Segoe UI",system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .15s;z-index:6}
.vtip.on{opacity:1} .vtip b{color:var(--vc)}

.vchat{position:fixed;left:16px;top:64px;bottom:16px;width:min(420px,calc(100vw - 32px));display:none;flex-direction:column;z-index:7;color:#f5f3fa;font:14.5px/1.45 "Segoe UI",system-ui,sans-serif;background:linear-gradient(180deg,rgba(30,24,50,.93),rgba(14,12,22,.95) 40%);backdrop-filter:blur(26px) saturate(1.5);border:1px solid rgba(255,255,255,.12);border-radius:28px;box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 80px -30px var(--vc),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}
.vchat.on{display:flex;animation:vopen .28s cubic-bezier(.2,.9,.3,1.1)}
@keyframes vopen{from{opacity:0;transform:translateX(-18px) scale(.98)}to{opacity:1;transform:none}}
.vh{position:relative;display:flex;align-items:center;gap:13px;padding:16px 16px 14px 18px;border-bottom:1px solid rgba(255,255,255,.08);background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--vc) 38%,transparent),transparent 62%)}
.vh .av{position:relative;flex:none;width:56px;height:56px;border-radius:50%;padding:2px;background:conic-gradient(from 200deg,var(--vc),#f5d0fe,var(--vc))}
.vh .av i{display:block;width:100%;height:100%;border-radius:50%;background:#2a2140 var(--vp) center 16%/cover;border:2px solid #17121f}
.vh .av::after{content:'';position:absolute;right:1px;bottom:1px;width:13px;height:13px;border-radius:50%;background:#37d67a;border:2.5px solid #17121f}
.vh .who b{display:block;font-size:17px;font-weight:700;letter-spacing:-.01em}
.vh .who small{display:flex;align-items:center;gap:7px;opacity:.72;font-size:12.5px;margin-top:2px}
.vbars{display:none;align-items:flex-end;gap:2px;height:12px} .vbars i{width:3px;background:var(--vc);border-radius:2px;animation:vbar 0.9s ease-in-out infinite} .vbars i:nth-child(2){animation-delay:.15s} .vbars i:nth-child(3){animation-delay:.3s} .vbars i:nth-child(4){animation-delay:.45s}
@keyframes vbar{0%,100%{height:3px}50%{height:12px}}
.vchat[data-st=speak] .vbars,.vchat[data-st=listen] .vbars{display:flex} .vchat[data-st=listen] .vbars i{background:#ff6b6b}
.vh .sp{flex:1}
.vh button{border:0;background:rgba(255,255,255,.09);color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;transition:background .15s} .vh button:hover{background:rgba(255,255,255,.2)}
.vh button.off{opacity:.45} .vh button.live{background:#e5484d}

.vm{flex:1;overflow:auto;padding:18px 14px 8px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth}
.vm::-webkit-scrollbar{width:6px} .vm::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:6px}
.vrow{display:flex;gap:9px;align-items:flex-end;animation:vin .26s ease} .vrow.me{justify-content:flex-end}
.vav{flex:none;width:30px;height:30px;border-radius:50%;background:#2a2140 var(--vp) center 16%/cover;border:1.5px solid rgba(255,255,255,.35);align-self:flex-start}
.vcol{display:flex;flex-direction:column;gap:3px;max-width:86%;min-width:0} .vrow.me .vcol{align-items:flex-end}
.vcol small{font-size:10.5px;opacity:.4;padding:0 6px}
.vb{padding:11px 14px;border-radius:19px;white-space:pre-wrap;word-wrap:break-word}
.vb.bot{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.07);border-top-left-radius:6px}
.vb.me{background:linear-gradient(135deg,var(--vc),color-mix(in srgb,var(--vc) 55%,#3a1d9a));color:#fff;border-top-right-radius:6px;box-shadow:0 6px 20px -8px var(--vc)}
.vb b{font-weight:700;color:#fff}
.vb.dots{display:flex;gap:5px;padding:14px 16px} .vb.dots i{width:7px;height:7px;border-radius:50%;background:#fff;opacity:.5;animation:vd 1s infinite} .vb.dots i:nth-child(2){animation-delay:.15s} .vb.dots i:nth-child(3){animation-delay:.3s}
@keyframes vd{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes vin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.vcard{display:grid;grid-template-columns:104px 1fr;margin-top:3px;background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;box-shadow:0 10px 30px -14px rgba(0,0,0,.6)}
.vimg{position:relative;display:grid;place-items:center;background:radial-gradient(circle at 50% 55%,color-mix(in srgb,var(--cc,var(--vc)) 45%,transparent),transparent 72%),rgba(0,0,0,.22);min-height:104px}
.vimg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 8px rgba(0,0,0,.45));animation:vin .4s ease} .vimg.ld::after{content:'';width:26px;height:26px;border-radius:50%;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;animation:vspin .8s linear infinite;position:absolute}
@keyframes vspin{to{transform:rotate(360deg)}}
.vbody{padding:11px 13px 12px;display:flex;flex-direction:column;gap:2px;min-width:0}
.vbody b{font-size:15.5px;line-height:1.2} .vbody small{opacity:.6;font-size:12px}
.vp{font-size:21px;font-weight:800;letter-spacing:-.02em;margin-top:5px} .vp em{font-style:normal;font-size:11.5px;font-weight:500;opacity:.6;display:block;letter-spacing:0;margin-top:-1px}
.va{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.va button,.vmini{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;border-radius:11px;padding:7px 10px;font:600 12px "Segoe UI",system-ui,sans-serif;cursor:pointer;transition:all .15s}
.va button:first-child{background:var(--vc);border-color:transparent} .va button:hover,.vmini:hover{filter:brightness(1.18);transform:translateY(-1px)}
.vtag{position:absolute;left:6px;top:6px;z-index:2;padding:3px 8px;border-radius:99px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);font:700 10.5px "Segoe UI",system-ui,sans-serif;color:#fff}
.vqty{position:absolute;right:6px;top:6px;z-index:2;padding:3px 9px;border-radius:99px;background:var(--vc);font:800 12px "Segoe UI",system-ui,sans-serif;color:#fff}
.vp.sm{font-size:14px;font-weight:700;letter-spacing:0;line-height:1.2}
.vgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:3px}
.vmini{display:flex;flex-direction:column;align-items:stretch;text-align:left;padding:0;overflow:hidden;border-radius:16px}
.vmini .vimg{min-height:84px;height:84px;display:block} .vmini span{padding:7px 10px 9px;font-size:12.5px;line-height:1.25} .vmini span b{display:block;font-size:13px} .vmini span em{font-style:normal;opacity:.7}

.vc{display:flex;flex-wrap:wrap;gap:7px;padding:2px 14px 10px}
.vc button{border:1px solid color-mix(in srgb,var(--vc) 65%,transparent);background:color-mix(in srgb,var(--vc) 10%,transparent);color:#fff;border-radius:99px;padding:7px 13px;font:600 12.5px "Segoe UI",system-ui,sans-serif;cursor:pointer;transition:all .15s} .vc button:hover{background:var(--vc);transform:translateY(-1px)}
.vcartbar{display:none;align-items:center;gap:10px;margin:0 12px 8px;padding:9px 10px 9px 14px;border-radius:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--vc) 30%,transparent),rgba(255,255,255,.05));border:1px solid color-mix(in srgb,var(--vc) 50%,transparent);font-size:13px}
.vcartbar span{flex:1;line-height:1.25} .vcartbar b{display:block;font-size:15px} .vcartbar small{opacity:.65}
.vcartbar button{border:0;border-radius:11px;background:#fff;color:#1a1230;padding:9px 13px;font:800 12.5px "Segoe UI",system-ui,sans-serif;cursor:pointer} .vcartbar button:hover{filter:brightness(.92)}
.vf{display:flex;gap:8px;padding:10px 12px 14px;border-top:1px solid rgba(255,255,255,.08);align-items:center}
.vf input{flex:1;min-width:0;padding:12px 16px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:14.5px "Segoe UI",system-ui,sans-serif;outline:none;transition:border-color .15s,box-shadow .15s} .vf input:focus{border-color:var(--vc);box-shadow:0 0 0 3px color-mix(in srgb,var(--vc) 25%,transparent)}
.vf button{border:0;border-radius:50%;width:42px;height:42px;background:var(--vc);color:#fff;font-size:17px;cursor:pointer;flex:none;display:grid;place-items:center} .vf button:hover{filter:brightness(1.12)}
.vf .vmic{background:rgba(255,255,255,.12)} .vf .vmic.on{background:#e5484d;animation:vp 1s infinite}
@keyframes vp{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,.6)}50%{box-shadow:0 0 0 9px rgba(229,72,77,0)}}
@media(max-width:620px){.vchat{left:8px;right:8px;width:auto;top:auto;height:76vh;bottom:8px}}
`;

/* ================= avatar 3D ================= */
function buildAvatar(T,o,nome,cargo){
  o=Object.assign({skin:'#c48a62',shirt:'#7c4dff',pants:'#33415c',cap:'#231a38',apron:'#15111f',apronText:'NEW',hair:'#1c120c'},o||{});
  const g=new T.Group();
  const M=(c,r=.7,m=0,ex)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m,envMapIntensity:.6},ex||{}));
  const add=(geo,mat,x,y,z,p=g)=>{ const m=new T.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; p.add(m); return m; };
  const ell=(rx,ry,rz,ws=18,hs=12)=>{ const q=new T.SphereGeometry(1,ws,hs); q.scale(rx,ry,rz); return q; };
  const tx=(w,h,fn,rep)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; if(rep){ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); } return t; };
  const rn=(a,b)=>a+Math.random()*(b-a);
  const shade=(hex,k)=>'#'+new T.Color(hex).multiplyScalar(k).getHexString();

  /* ---------- texturas ---------- */
  const skinC=o.skin;
  const faceTex=tx(1024,512,(c,w,h)=>{
    const gr=c.createLinearGradient(0,0,0,h); gr.addColorStop(0,shade(skinC,1.04)); gr.addColorStop(.6,skinC); gr.addColorStop(1,shade(skinC,.86)); c.fillStyle=gr; c.fillRect(0,0,w,h);
    const cx=w*.25; // centro do rosto (frente da esfera)
    // sombras suaves (têmporas, laterais do nariz, queixo)
    const soft=(x,y,rx,ry,col,a)=>{ const r=c.createRadialGradient(x,y,0,x,y,Math.max(rx,ry)); r.addColorStop(0,col.replace('A',a)); r.addColorStop(1,col.replace('A',0)); c.save(); c.translate(x,y); c.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry)); c.translate(-x,-y); c.fillStyle=r; c.beginPath(); c.arc(x,y,Math.max(rx,ry),0,7); c.fill(); c.restore(); };
    soft(cx-95,h*.6,70,60,'rgba(210,100,90,A)',.34); soft(cx+95,h*.6,70,60,'rgba(210,100,90,A)',.34); // bochechas
    soft(cx-130,h*.43,40,70,'rgba(70,35,20,A)',.22); soft(cx+130,h*.43,40,70,'rgba(70,35,20,A)',.22);
    soft(cx,h*.82,90,40,'rgba(60,30,18,A)',.25);
    // barba por fazer
    for(let i=0;i<2600;i++){ const a=rn(-1.3,1.3), x=cx+Math.sin(a)*rn(40,150), y=h*rn(.62,.9); if(y<h*.7&&Math.abs(x-cx)<35) continue; c.fillStyle=`rgba(25,15,10,${rn(.04,.16)})`; c.fillRect(x,y,1.6,1.6); }
    // nariz
    soft(cx,h*.585,16,40,'rgba(255,235,215,A)',.22);
    c.fillStyle='rgba(60,25,15,.35)'; c.beginPath(); c.ellipse(cx-13,h*.595,7,4.5,.2,0,7); c.fill(); c.beginPath(); c.ellipse(cx+13,h*.595,7,4.5,-.2,0,7); c.fill();
    c.strokeStyle='rgba(80,40,25,.3)'; c.lineWidth=3; c.beginPath(); c.moveTo(cx-17,h*.52); c.quadraticCurveTo(cx-24,h*.58,cx-17,h*.605); c.stroke(); c.beginPath(); c.moveTo(cx+17,h*.52); c.quadraticCurveTo(cx+24,h*.58,cx+17,h*.605); c.stroke();
    // olhos
    const eye=(ex,ey,dir)=>{
      c.save(); c.translate(ex,ey); c.scale(1.32,1.32); c.translate(-ex,-ey);
      c.fillStyle='rgba(60,30,20,.28)'; c.beginPath(); c.ellipse(ex,ey-6,32,17,0,0,7); c.fill();                  // pálpebra/sombra
      c.fillStyle='#f3ede6'; c.beginPath(); c.ellipse(ex,ey,25,12.5,0,0,7); c.fill();                            // esclera
      const ir=c.createRadialGradient(ex+dir*1,ey,1,ex+dir*1,ey,11); ir.addColorStop(0,'#2a1608'); ir.addColorStop(.55,'#5a3418'); ir.addColorStop(1,'#2b180b'); c.fillStyle=ir; c.beginPath(); c.arc(ex+dir*1,ey,11,0,7); c.fill();
      c.fillStyle='#050302'; c.beginPath(); c.arc(ex+dir*1,ey,4.6,0,7); c.fill();
      c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(ex+dir*1-4,ey-4,2.8,0,7); c.fill();
      c.save(); c.beginPath(); c.ellipse(ex,ey,25,12.5,0,0,7); c.clip(); c.fillStyle='rgba(80,40,25,.5)'; c.fillRect(ex-30,ey-14,60,9); c.restore();
      c.strokeStyle='#1a0e08'; c.lineWidth=3.2; c.beginPath(); c.moveTo(ex-26,ey+1); c.quadraticCurveTo(ex,ey-17,ex+26,ey+1); c.stroke();                    // cílios superiores
      c.strokeStyle='rgba(60,30,20,.4)'; c.lineWidth=1.6; c.beginPath(); c.moveTo(ex-22,ey+6); c.quadraticCurveTo(ex,ey+15,ex+22,ey+6); c.stroke();    // pálpebra inferior
      // sobrancelha
      c.strokeStyle='#1c120c'; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.moveTo(ex-dir*-30,ey-34+dir*-3); c.quadraticCurveTo(ex,ey-45,ex+dir*30,ey-32); c.stroke();
      c.lineWidth=3; c.globalAlpha=.6; c.beginPath(); c.moveTo(ex-dir*-30,ey-31+dir*-3); c.quadraticCurveTo(ex,ey-42,ex+dir*30,ey-29); c.stroke(); c.globalAlpha=1; c.restore();
    };
    eye(cx-70,h*.485,-1); eye(cx+70,h*.485,1);
    // boca
    const my=h*.725; c.save(); c.translate(cx,my); c.scale(1.5,1.5); c.translate(-cx,-my);
    c.fillStyle='#8f4742'; c.beginPath(); c.moveTo(cx-34,my); c.quadraticCurveTo(cx-16,my-15,cx,my-8); c.quadraticCurveTo(cx+16,my-15,cx+34,my); c.quadraticCurveTo(cx,my+4,cx-34,my); c.fill();
    c.fillStyle='#a85a52'; c.beginPath(); c.moveTo(cx-34,my); c.quadraticCurveTo(cx,my+4,cx+34,my); c.quadraticCurveTo(cx+18,my+24,cx,my+24); c.quadraticCurveTo(cx-18,my+24,cx-34,my); c.fill();
    c.strokeStyle='rgba(60,20,18,.8)'; c.lineWidth=2.6; c.beginPath(); c.moveTo(cx-35,my); c.quadraticCurveTo(cx,my+6,cx+35,my); c.stroke();
    c.fillStyle='rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(cx,my+14,13,4,0,0,7); c.fill();
    c.strokeStyle='rgba(70,35,20,.25)'; c.lineWidth=2.4; c.beginPath(); c.moveTo(cx-52,my-8); c.quadraticCurveTo(cx-60,my+10,cx-48,my+28); c.stroke(); c.beginPath(); c.moveTo(cx+52,my-8); c.quadraticCurveTo(cx+60,my+10,cx+48,my+28); c.stroke(); c.restore();
  });
  const poloTex=tx(512,512,(c,w,h)=>{ c.fillStyle=o.shirt; c.fillRect(0,0,w,h); for(let i=0;i<9000;i++){ c.fillStyle=`rgba(${rnd255()},${rnd255()},${rnd255()},.05)`; c.fillRect(rn(0,w),rn(0,h),2,2); }
    c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(w/2-3,h*.08,6,h*.2); c.fillStyle='rgba(255,255,255,.9)'; for(const y of [.14,.22]){ c.beginPath(); c.arc(w/2,h*y,5,0,7); c.fill(); }
    c.fillStyle='rgba(255,255,255,.85)'; c.font='800 36px "Segoe UI",system-ui'; c.textAlign='center'; c.fillText(o.apronText,w/2+88,h*.2); });
  function rnd255(){ return (Math.random()*255)|0; }
  const denim=tx(128,128,(c,w,h)=>{ c.fillStyle=o.pants; c.fillRect(0,0,w,h); for(let i=0;i<w;i+=3){ c.fillStyle=`rgba(255,255,255,${rn(.02,.07)})`; c.fillRect(i,0,1,h); } for(let i=0;i<500;i++){ c.fillStyle=`rgba(0,0,0,${rn(.03,.1)})`; c.fillRect(rn(0,w),rn(0,h),2,2); } },[2,3]);
  const hairTex=tx(256,256,(c,w,h)=>{ c.fillStyle=o.hair; c.fillRect(0,0,w,h); for(let i=0;i<700;i++){ c.strokeStyle=`rgba(${(60+Math.random()*50)|0},${(40+Math.random()*30)|0},25,${rn(.1,.35)})`; c.lineWidth=1; c.beginPath(); const x=rn(0,w); c.moveTo(x,0); c.lineTo(x+rn(-8,8),h); c.stroke(); } });
  const capTex=tx(512,256,(c,w,h)=>{ c.fillStyle=o.cap; c.fillRect(0,0,w,h); c.strokeStyle='rgba(255,255,255,.1)'; c.lineWidth=2; for(let i=0;i<=8;i++){ c.beginPath(); c.moveTo(i*w/8,0); c.lineTo(i*w/8,h); c.stroke(); } for(let i=0;i<4000;i++){ c.fillStyle=`rgba(255,255,255,${rn(.01,.05)})`; c.fillRect(rn(0,w),rn(0,h),1.5,1.5); }
    c.fillStyle='#8b5cf6'; c.font='800 64px "Segoe UI",system-ui'; c.textAlign='center'; c.fillText(o.apronText,w*.25,h*.62); });
  const apronTex=tx(256,420,(c,w,h)=>{ c.fillStyle=o.apron; c.fillRect(0,0,w,h); for(let i=0;i<2000;i++){ c.fillStyle=`rgba(255,255,255,${rn(.01,.05)})`; c.fillRect(rn(0,w),rn(0,h),2,1); }
    c.fillStyle='#8b5cf6'; c.fillRect(0,0,w,8); c.fillStyle='#fff'; c.font='800 74px "Segoe UI",system-ui'; c.textAlign='center'; c.fillText(o.apronText,w/2,150); c.fillStyle='rgba(255,255,255,.6)'; c.font='700 22px "Segoe UI"'; c.fillText(cargo.toUpperCase().slice(0,20),w/2,190);
    c.fillStyle='rgba(255,255,255,.1)'; c.beginPath(); c.roundRect(40,265,w-80,110,10); c.fill(); c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=2; c.stroke(); });

  /* ---------- pernas, sapatos ---------- */
  const legs=[-1,1].map(s=>{ const lg=new T.Group(); lg.position.set(s*.092,.93,0); g.add(lg);
    add(new T.CylinderGeometry(.086,.058,.86,16),M(o.pants,.85,0,{map:denim}),0,-.43,0,lg);
    add(new T.CylinderGeometry(.062,.06,.05,16),M(shade(o.pants,.8),.9),0,-.84,0,lg);
    const shoe=add(ell(.062,.048,.135,16,10),M('#efeff4',.55),0,-.885,.045,lg); shoe.scale.y=1;
    add(new T.BoxGeometry(.118,.022,.27),M('#23232b',.8),0,-.915,.045,lg);
    add(ell(.05,.03,.06,12,8),M('#d9d9e2',.6),0,-.86,.1,lg);
    return lg; });
  add(new T.CylinderGeometry(.183,.183,.04,28,1,true),M('#2a1c12',.6,.1,{side:T.DoubleSide}),0,.935,0).scale.z=.74;
  add(new T.BoxGeometry(.04,.032,.012),M('#c9b27a',.3,.8),0,.935,.136);

  /* ---------- tronco (polo) ---------- */
  const profile=[[.0001,.88],[.17,.9],[.178,.98],[.168,1.08],[.172,1.2],[.188,1.34],[.19,1.42],[.12,1.49],[.06,1.5]].map(p=>new T.Vector2(p[0],p[1]));
  const torso=add(new T.LatheGeometry(profile,36),M('#fff',.85,0,{map:poloTex}),0,0,0); torso.scale.z=.72; torso.rotation.y=Math.PI;
  add(new T.TorusGeometry(.066,.016,8,20),M(shade(o.shirt,1.25),.8),0,1.495,0).rotation.x=Math.PI/2;
  const apron=add(new T.CylinderGeometry(.204,.196,.58,28,1,true,-Math.PI*.4,Math.PI*.8),M('#fff',.85,0,{map:apronTex,side:T.DoubleSide}),0,1.1,0); apron.scale.z=.76;
    add(new T.CylinderGeometry(.056,.062,.1,14),M(shade(skinC,.92),.7),0,1.52,0);

  /* ---------- braços ---------- */
  const arm=s=>{ const A=new T.Group(); A.position.set(s*.222,1.41,0); g.add(A);
    add(new T.SphereGeometry(.066,14,10),M(o.shirt,.85,0,{map:poloTex}),0,0,0,A);
    add(new T.CylinderGeometry(.062,.058,.17,14),M(o.shirt,.85,0,{map:poloTex}),0,-.1,0,A);
    add(new T.CylinderGeometry(.049,.042,.17,12),M(skinC,.6),0,-.22,0,A);
    add(new T.SphereGeometry(.043,10,8),M(skinC,.6),0,-.31,0,A);
    const F=new T.Group(); F.position.set(0,-.31,0); A.add(F);
    add(new T.CylinderGeometry(.042,.034,.26,12),M(skinC,.6),0,-.14,0,F);
    add(ell(.032,.05,.022,12,8),M(skinC,.6),0,-.31,0,F);
    add(ell(.026,.03,.018,10,7),M(skinC,.6),s*-.035,-.3,.015,F).rotation.z=s*.5;
    return [A,F]; };
  const [rArm,rFore]=arm(1), [lArm,lFore]=arm(-1);
  lArm.rotation.x=-.5; lFore.rotation.x=-1.25;
  const pad=add(new T.BoxGeometry(.21,.016,.29),M('#101014',.35,.4),0,-.31,.11,lFore); pad.rotation.x=.25;
  const scr=new T.Mesh(new T.PlaneGeometry(.19,.27),new T.MeshBasicMaterial({map:tx(128,180,(c,w,h)=>{ const gg=c.createLinearGradient(0,0,0,h); gg.addColorStop(0,'#8b5cf6'); gg.addColorStop(1,'#ff9f43'); c.fillStyle=gg; c.fillRect(0,0,w,h); c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<5;i++) c.fillRect(14,20+i*30,w-28-(i%2)*30,12); })})); scr.rotation.x=-Math.PI/2; scr.position.set(0,.009,0); pad.add(scr);

  /* ---------- cabeça ---------- */
  const head=new T.Group(); head.position.set(0,1.645,0); g.add(head);
  const hg=new T.SphereGeometry(1,40,28); { const p=hg.attributes.position; for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); if(y<0){ const t=-y; x*=1-.3*t*t; z*=1-.12*t*t; } p.setXYZ(i,x*.098,y*.122,z*.108); } hg.computeVertexNormals(); }
  add(hg,M('#fff',.55,0,{map:faceTex}),0,0,0,head);
  for(const s of [-1,1]){ add(ell(.012,.03,.021,10,8),M(shade(skinC,.95),.6),s*.097,-.008,-.004,head); }
  const hair=add(new T.SphereGeometry(1,32,20,Math.PI/2+1.3,Math.PI*2-2.6,0,Math.PI*.62),M('#fff',.9,0,{map:hairTex,side:T.DoubleSide}),0,.012,-.006,head); hair.scale.set(.104,.13,.115);
  const cap=add(new T.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI*.47),M('#fff',.8,0,{map:capTex}),0,.05,-.004,head); cap.scale.set(.108,.122,.121); cap.rotation.x=-.06;
  const brim=add(new T.SphereGeometry(1,24,8,0,Math.PI*2,0,Math.PI/2),M(o.cap,.7),0,.062,.078,head); brim.scale.set(.1,.012,.135); brim.rotation.x=.2;

  /* ---------- etiqueta e balão (sprites) ---------- */
  const spr=(w,h,sc)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false})); s.scale.set(sc,sc*h/w,1); return {s,c,t}; };
  const tag=spr(512,128,.9); const tg=tag.c.getContext('2d'); tg.fillStyle='rgba(18,18,24,.85)'; tg.beginPath(); tg.roundRect(8,20,496,88,44); tg.fill(); tg.fillStyle='#8b5cf6'; tg.beginPath(); tg.arc(54,64,26,0,7); tg.fill(); tg.fillStyle='#fff'; tg.font='700 40px "Segoe UI"'; tg.textAlign='left'; tg.textBaseline='middle'; tg.fillText(nome,98,50); tg.fillStyle='rgba(255,255,255,.65)'; tg.font='600 24px "Segoe UI"'; tg.fillText(cargo,98,86); tag.t.needsUpdate=true; tag.s.position.set(0,2.1,0); g.add(tag.s);
  const bub=spr(512,160,1.3); bub.s.position.set(0,2.58,0); bub.s.visible=false; g.add(bub.s);
  let bubTxt=''; const setBubble=t=>{ if(t===bubTxt) return; bubTxt=t; bub.s.visible=!!t; if(!t) return; const c=bub.c.getContext('2d'); c.clearRect(0,0,512,160); c.fillStyle='#fff'; c.beginPath(); c.roundRect(6,6,500,110,30); c.fill(); c.beginPath(); c.moveTo(236,114); c.lineTo(256,150); c.lineTo(276,114); c.fill(); c.fillStyle='#17131f'; c.font='700 36px "Segoe UI",system-ui'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(t,256,62); bub.t.needsUpdate=true; };
  g.traverse(m=>{ if(m.isMesh) m.receiveShadow=false; });

  /* ---------- animação ---------- */
  let talking=0, hold=false, t0=Math.random()*10, path=[], speed=2.5, onArr=null, phase=0, walking=false; const heading={x:0,z:1};
  const update=(dt,time,cam)=>{
    const dx=cam.x-g.position.x, dz=cam.z-g.position.z, dist=Math.hypot(dx,dz);
    walking=false;
    if(path.length){
      const p=path[0], ex=p[0]-g.position.x, ez=p[1]-g.position.z, d=Math.hypot(ex,ez), stp=speed*dt; walking=true;
      if(d>.01){ const a=Math.atan2(ex,ez); let da=a-g.rotation.y; da=Math.atan2(Math.sin(da),Math.cos(da)); g.rotation.y+=da*Math.min(1,dt*8); heading.x=ex/d; heading.z=ez/d; }
      if(d<=stp){ g.position.x=p[0]; g.position.z=p[1]; path.shift(); if(!path.length){ walking=false; const cb=onArr; onArr=null; if(cb) cb(); } }
      else { g.position.x+=ex/d*stp; g.position.z+=ez/d*stp; }
    } else if(dist<12){ const a=Math.atan2(dx,dz); let d=a-g.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); g.rotation.y+=d*Math.min(1,dt*3.2); }
    phase+=walking?dt*speed*3.6:0;
    legs[0].rotation.x=walking?Math.sin(phase)*.65:legs[0].rotation.x*.8; legs[1].rotation.x=walking?-Math.sin(phase)*.65:legs[1].rotation.x*.8;
    g.position.y=walking?Math.abs(Math.sin(phase))*.035:0;
    const tt=time+t0; torso.scale.y=1+Math.sin(tt*1.6)*.012; head.rotation.y=Math.sin(tt*.7)*.12; const sp=talking>0||hold; head.rotation.x=Math.sin(tt*.9)*.03+(sp?Math.sin(tt*7)*.04:0);
    const k=sp?1:0, e=Math.min(1,dt*8);
    const rx=walking?-Math.sin(phase)*.5-.1:(-.2+(k?-.55-Math.sin(tt*5.5)*.3:Math.sin(tt*1.1)*.04));
    rArm.rotation.x+=(rx-rArm.rotation.x)*e; rArm.rotation.z+=((-.08-(k&&!walking?.35+Math.sin(tt*4)*.1:0))-rArm.rotation.z)*e; rFore.rotation.x+=(((k&&!walking?-1.0+Math.sin(tt*6)*.25:-.12))-rFore.rotation.x)*e;
    if(talking>0) talking-=dt;
    return dist;
  };
  return {group:g,update,setBubble,heading,talk:s=>{ talking=Math.max(talking,s); },hold:v=>{ hold=v; },walk:(pts,sp,cb)=>{ path=pts.map(p=>[p[0],p[1]]); speed=sp||2.5; onArr=cb||null; if(!path.length&&cb) cb(); },isWalking:()=>path.length>0};
}

/* retrato do vendedor: renderiza o próprio avatar 3D (rosto e ombros) pra usar no chat */
function portrait(T,o,nome,cargo){
  try{
    const r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); r.setPixelRatio(1); r.setSize(240,240); r.outputColorSpace=T.SRGBColorSpace;
    const sc=new T.Scene(); sc.add(new T.HemisphereLight('#ffffff','#8c7aa8',1.7));
    const k=new T.DirectionalLight('#fff0dc',2.4); k.position.set(1.6,2.6,3); sc.add(k);
    const rim=new T.DirectionalLight('#a98bff',1.6); rim.position.set(-2.2,2.2,-1.5); sc.add(rim);
    const av=buildAvatar(T,o,nome,cargo); av.group.traverse(c=>{ if(c.isSprite) c.visible=false; }); sc.add(av.group);
    av.group.rotation.y=-.28; const cam=new T.PerspectiveCamera(21,1,.1,10); cam.position.set(0,1.65,1.62); cam.lookAt(0,1.57,0);
    r.render(sc,cam); const url=r.domElement.toDataURL('image/png'); r.dispose(); return url;
  }catch(e){ return null; }
}

/* ================= criação ================= */
function create(cfg){
  const cor=cfg.cor||'#8b5cf6', R=cfg.regras||{}, G=cfg.ganchos, cat=cfg.catalogo, byId=Object.fromEntries(cat.map(i=>[i.id,i]));
  const st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
  const root=document.createElement('div'); root.style.setProperty('--vc',cor);
  root.innerHTML=`<button class="vbtn" id="vbtn" style="--vc:${cor}"><i class="vpic"></i><span>Falar com ${esc(cfg.nome)}<small>${esc(cfg.cargo)}</small></span></button>
  <div class="vtip" id="vtip" style="--vc:${cor}"><b>E</b> ou clique · falar com ${esc(cfg.nome)}</div>
  <div class="vchat" id="vchat" style="--vc:${cor}"><div class="vh"><div class="av"><i></i></div><div class="who"><b>${esc(cfg.nome)}</b><small><span id="vst">${esc(cfg.cargo)} · online</span><span class="vbars"><i></i><i></i><i></i><i></i></span></small></div><div class="sp"></div><button id="vsnd" title="Voz do ${esc(cfg.nome)}">🔊</button><button id="vconv" title="Conversar por voz (microfone)">🎙️</button><button id="vx" title="Fechar (Esc)">✕</button></div><div class="vm" id="vm"></div><div class="vc" id="vc"></div><div class="vcartbar" id="vbar"></div><form class="vf" id="vf"><input id="vin" autocomplete="off" placeholder="Escreva ou fale... ex: 5 caixas de laranja"><button type="button" class="vmic" id="vmic" title="Falar">🎤</button><button title="Enviar">➤</button></form></div>`;
  document.body.appendChild(root);
  if(cfg.three){ const url=portrait(cfg.three.THREE,cfg.avatar,cfg.nome,cfg.cargo); if(url) root.style.setProperty('--vp',`url(${url})`); }
  const $=id=>root.querySelector('#'+id), vm=$('vm'), vc=$('vc'), chat=$('vchat'), inp=$('vin');

  // ---------- estado ----------
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const S={seg:null,size:null,need:null,asked:{biz:false,vol:false},pending:null,last:null,greeted:false,hist:[],open:false,voz:!!window.speechSynthesis,conv:!!SR};
  const unit=(it,q=1)=>cfg.unidade?cfg.unidade(it,q):(q>1?'caixas':'caixa');
  const cartItems=()=>G.carrinho(), cartTotal=()=>G.total();
  const inCart=id=>cartItems().some(c=>c.id===id&&c.q>0);
  const money=brl;

  // ---------- reconhecimento ----------
  const nomeUnico=it=>cat.filter(o=>norm(o.nome)===norm(it.nome)).length===1;
  const idx=cat.map(it=>({it,al:[...(it.aliases||[]),it.nome+' '+(it.variante||''),...(nomeUnico(it)?[it.nome]:[])].map(norm)}));
  const SIZEL={pequeno:'pequeno',medio:'médio',grande:'grande'};
  const grupos={}; cat.forEach(it=>{ if(it.grupo){ (grupos[norm(it.grupo)]=grupos[norm(it.grupo)]||[]).push(it); } });
  const has=(t,a)=>new RegExp('(^|[^a-z0-9])'+a+'([^a-z0-9]|$)').exec(t);
  function mentions(t){
    const out=[], used=new Set();
    for(const {it,al} of idx) for(const a of al){ const m=has(t,a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')); if(m){ out.push({it,i:m.index+m[1].length,len:a.length}); used.add(it.grupo); break; } }
    const spec=out.filter(o=>true);
    const gm=[];
    for(const [g,items] of Object.entries(grupos)){ const m=has(t,g); if(m&&!items.some(it=>out.some(o=>o.it===it))) gm.push({group:g,items,i:m.index}); }
    return {items:spec.sort((a,b)=>a.i-b.i),groups:gm};
  }
  function qtyNear(t,i,len){
    const before=t.slice(Math.max(0,i-28),i), after=t.slice(i+len,i+len+22);
    let m=/(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|doze|quinze|vinte)\s*(?:caixas?|cx|paloxes?|palox|unidades?|un)?\s*(?:de\s+|do\s+|da\s+)?\s*$/.exec(before);
    if(m) return Math.max(1,Math.min(99,NUM[m[1]]||+m[1]));
    m=/^\s*[:x-]?\s*(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(caixas?|cx|paloxes?|palox|unidades?|un)/.exec(after);
    if(m) return Math.max(1,Math.min(99,NUM[m[1]]||+m[1]));
    return 1;
  }
  const findSeg=t=>(cfg.segmentos||[]).find(s=>s.palavras.some(p=>has(t,norm(p))));
  const findCat=t=>(cfg.categorias||[]).find(c=>c.palavras.some(p=>has(t,norm(p))));
  const findSize=t=>/(pequen|miudo|comecando|comeco|pouc|1 a 5)/.test(t)?'pequeno':/(grande|bastante|muit|alto volume|movimentad|atacad|16 ou mais)/.test(t)?'grande':/(medio|media|normal|razoavel|6 a 15)/.test(t)?'medio':null;

  // ---------- saída ----------
  let chips=[];
  function bubble(html,who='bot'){
    const row=document.createElement('div'); row.className='vrow '+who; if(who==='bot') row.innerHTML='<i class="vav"></i>';
    const col=document.createElement('div'); col.className='vcol'; const b=document.createElement('div'); b.className='vb '+who; b.innerHTML=html; col.appendChild(b);
    const tm=document.createElement('small'); tm.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); col.appendChild(tm);
    row.appendChild(col); vm.appendChild(row); vm.scrollTop=vm.scrollHeight; return col;
  }
  const photo=(el,it)=>{ el.classList.add('ld'); Promise.resolve(G.foto?G.foto(it.id):null).then(u=>{ el.classList.remove('ld'); if(u){ const im=new Image(); im.src=u; im.alt=''; el.appendChild(im); vm.scrollTop=vm.scrollHeight; } }).catch(()=>el.classList.remove('ld')); };
  function cardEl(it){
    const el=document.createElement('div'); el.className='vcard'; if(it.cor) el.style.setProperty('--cc',it.cor);
    const preco=PRICES?`<div class="vp">${money(it.preco)}<em>${it.kg?`por ${unit(it,1)} · ≈ ${money(it.preco/it.kg)}/kg`:'cada'}</em></div>`:`<div class="vp sm">Valor no WhatsApp<em>cotação do dia com o ${esc(DONO)}</em></div>`;
    el.innerHTML=`<div class="vimg">${it.tag?`<span class="vtag">${TAGL[it.tag]}</span>`:''}</div><div class="vbody"><b>${esc(line(it))}</b><small>${esc(it.embalagem)}${it.kg?' · '+kgTxt(it):''}</small>${preco}<div class="va"><button data-a="add">➕ Colocar</button><button data-a="go">🚶 Me leva lá</button></div></div>`;
    photo(el.querySelector('.vimg'),it);
    el.querySelector('[data-a=add]').onclick=()=>user(`1 caixa de ${norm(line(it))}`);
    el.querySelector('[data-a=go]').onclick=()=>user(`me leva ate ${norm(line(it))}`);
    return el;
  }
  function gridEl(items,qty){
    const g=document.createElement('div'); g.className='vgrid';
    items.forEach((it,i)=>{ const b=document.createElement('button'); b.className='vmini'; if(it.cor) b.style.setProperty('--cc',it.cor);
      const sub=PRICES?`${money(it.preco)}${it.kg?' / '+unit(it,1):''}`:`${it.kg?kgTxt(it)+' · ':''}${esc(it.embalagem.replace(/^Caixa (de )?/,'cx '))}`;
      b.innerHTML=`<div class="vimg">${it.tag?`<span class="vtag">${TAGL[it.tag]}</span>`:''}${qty&&qty[i]?`<span class="vqty">× ${qty[i]}</span>`:''}</div><span><b>${esc(line(it))}</b><em>${sub}</em></span>`;
      photo(b.querySelector('.vimg'),it); b.onclick=()=>user('me fala da '+norm(line(it))); g.appendChild(b); });
    return g;
  }
  const setStatus=s=>{ chat.dataset.st=s; $('vst').textContent=s==='speak'?`${cfg.nome} está falando…`:s==='listen'?'Ouvindo você…':s==='walk'?`${cfg.nome} está te levando…`:`${cfg.cargo} · online`; };
  function refreshBar(){
    const items=cartItems(), bar=$('vbar'); if(!items.length){ bar.style.display='none'; return; }
    const n=items.reduce((x,i)=>x+i.q,0), kg=items.reduce((x,i)=>x+(byId[i.id].kg||0)*i.q,0); bar.style.display='flex';
    bar.innerHTML=PRICES?`<span><b>${money(cartTotal())}</b><small>${n} ${n>1?'volumes':'volume'} no pedido</small></span><button>Fechar pedido →</button>`
      :`<span><b>${n} ${n>1?'volumes':'volume'} · ≈ ${Math.round(kg)} kg</b><small>valor o ${esc(DONO)} passa no WhatsApp</small></span><button>Enviar 📲</button>`;
    bar.querySelector('button').onclick=()=>user('fechar pedido');
  }
  setInterval(()=>{ if(S.open) refreshBar(); },600);
  function setChips(list){ chips=list||[]; vc.innerHTML=''; chips.forEach(c=>{ const b=document.createElement('button'); b.textContent=c.label||c; b.onclick=()=>{ if(c.act) c.act(); else user(c.send||c.label||c); }; vc.appendChild(b); }); vm.scrollTop=vm.scrollHeight; }
  const bold=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  // ---------- voz: o Beto fala (TTS) e escuta (reconhecimento) ----------
  const clean=t=>t.replace(/\*\*/g,'').replace(/R\$\s?(\d{1,3}(?:\.\d{3})*),(\d{2})/g,(m,a,b)=>a.replace(/\./g,'')+(b==='00'?' reais':' reais e '+b+' centavos')).replace(/[\u{1F300}-\u{1FAFF}☀-➿️•]/gu,'').replace(/≈/g,'cerca de ').replace(/\/kg/g,' o quilo').replace(/\s*\n\s*/g,'. ').replace(/\.\s*\./g,'.').replace(/\s+/g,' ').trim();
  let voice=null; const pickVoice=()=>{ if(!window.speechSynthesis) return; const vs=speechSynthesis.getVoices().filter(v=>/pt[-_]BR/i.test(v.lang)); voice=vs.find(v=>/antonio|daniel|ricardo|male|masc/i.test(v.name))||vs.find(v=>/natural|online/i.test(v.name))||vs[0]||null; };
  if(window.speechSynthesis){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
  let stopCur=null;
  function stopSpeak(){ if(stopCur) stopCur(); try{ window.speechSynthesis&&speechSynthesis.cancel(); }catch(e){} }
  function speak(text){ return new Promise(res=>{
    if(!S.voz||!window.speechSynthesis){ res(); return; }
    const parts=clean(text).split(/(?<=[.!?])\s+/).filter(Boolean); let i=0, done=false;
    const fin=()=>{ if(done) return; done=true; clearTimeout(tm0); avatar&&avatar.hold(false); speaking=false; deafUntil=Date.now()+900; res(); };
    const next=()=>{ if(done) return; if(i>=parts.length){ fin(); return; } const u=new SpeechSynthesisUtterance(parts[i++]); u.lang='pt-BR'; if(voice) u.voice=voice; u.rate=1.04; u.pitch=.9; u.onend=next; u.onerror=fin; speechSynthesis.speak(u); };
    const tm0=setTimeout(fin,4000+text.length*95);
    stopCur=fin; speaking=true; avatar&&avatar.hold(true); try{ speechSynthesis.cancel(); }catch(e){} next();
  }); }
  let rec=null, listening=false, wantMic=false, micErr=0, speaking=false, deafUntil=0, keepAlive=false, keepTimer=0;
  const deaf=()=>!S.open||speaking||Date.now()<deafUntil||(avatar&&avatar.isWalking());
  const micUI=on=>{ $('vmic').classList.toggle('on',on); if(on&&chat.dataset.st!=='speak'&&chat.dataset.st!=='walk') setStatus('listen'); else if(!on&&chat.dataset.st==='listen') setStatus('idle'); inp.placeholder=on?'Ouvindo... pode falar':'Escreva ou fale... ex: 5 caixas de laranja'; };
  let micOK=false, micWarned=false;
  function micFail(code){
    S.conv=false; $('vconv').classList.add('off'); stopListen();
    if(micWarned) return; micWarned=true;
    const seg=window.isSecureContext;
    let msg='Não consegui usar o microfone.';
    if(!seg) msg+='\n\nO navegador só libera microfone em página segura. Abra pelo atalho **abrir-lojas.bat** (endereço http://localhost:8099) em vez de dar duplo clique no arquivo.';
    else if(code==='not-allowed'||code==='service-not-allowed'||code==='NotAllowedError') msg+='\n\nA permissão foi negada. Clique no cadeado ao lado do endereço, libere o **Microfone** e aperte 🎤 de novo.';
    else if(code==='audio-capture'||code==='NotFoundError') msg+='\n\nNenhum microfone encontrado. Confira se ele está conectado e escolhido no Windows.';
    else if(code==='network') msg+='\n\nO reconhecimento de voz do Chrome precisa de internet.';
    else msg+=` (erro: ${code||'desconhecido'}).`;
    msg+='\n\nEnquanto isso, pode digitar aqui embaixo que eu respondo normal. 🙂';
    bubble(bold(msg));
  }
  async function ensureMic(){
    if(micOK) return true;
    if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ micFail('insecure'); return false; }
    try{ const st=await navigator.mediaDevices.getUserMedia({audio:true}); st.getTracks().forEach(t=>t.stop()); micOK=true; return true; }
    catch(e){ micFail(e.name); return false; }
  }
  // O reconhecimento fica ABERTO durante a conversa (continuous): abre uma vez só, então o navegador não pede
  // permissão a cada fala. Enquanto o Beto fala ou anda, o que o microfone ouve é descartado (evita eco).
  async function listen(){
    wantMic=true;
    if(!SR||listening||(!S.open&&!keepAlive)) return;
    if(!(await ensureMic())) return;
    if(listening||(!S.open&&!keepAlive)||!wantMic) return;
    try{ rec=new SR(); }catch(e){ return; }
    rec.lang='pt-BR'; rec.interimResults=true; rec.continuous=true; rec.maxAlternatives=1;
    rec.onstart=()=>{ listening=true; micUI(true); };
    rec.onresult=e=>{
      if(deaf()) return; let interim='', fin='';
      for(let i=e.resultIndex;i<e.results.length;i++){ const r=e.results[i]; if(r.isFinal) fin+=r[0].transcript; else interim+=r[0].transcript; }
      micErr=0; if(interim) inp.value=interim;
      if(fin.trim()){ inp.value=''; user(fin.trim()); }
    };
    rec.onerror=e=>{ if(e.error!=='no-speech'&&e.error!=='aborted') micFail(e.error); micErr++; };
    rec.onend=()=>{ listening=false; micUI(false); if(wantMic&&S.conv&&(S.open||keepAlive)&&micErr<4) setTimeout(listen,300); };
    try{ rec.start(); }catch(e){ listening=false; }
  }
  function stopListen(){ wantMic=false; try{ rec&&rec.abort(); }catch(e){} listening=false; micUI(false); }
  let queue=Promise.resolve(), pending=0;
  function say(text,ch,opt){ // fila: "digitando...", balão (+cards), fala; no fim, se for conversa por voz, escuta
    pending++; opt=opt||{};
    queue=queue.then(()=>new Promise(res=>{
      const d=document.createElement('div'); d.className='vrow bot'; d.innerHTML='<i class="vav"></i><div class="vcol"><div class="vb bot dots"><i></i><i></i><i></i></div></div>'; vm.appendChild(d); vm.scrollTop=vm.scrollHeight; vc.innerHTML='';
      avatar&&avatar.talk(.6);
      setTimeout(async()=>{
        d.remove(); const col=bubble(bold(text)); S.hist.push({role:'assistant',content:text});
        if(opt.card) col.insertBefore(cardEl(opt.card),col.lastChild); if(opt.grid) col.insertBefore(gridEl(opt.grid,opt.qty),col.lastChild);
        vm.scrollTop=vm.scrollHeight; setChips(ch); refreshBar();
        if(!S.voz) avatar&&avatar.talk(1+text.length/40);
        setStatus('speak'); await speak(text); setStatus(avatar&&avatar.isWalking()?'walk':listening?'listen':'idle');
        pending--; if(!pending&&S.conv&&S.open&&!(avatar&&avatar.isWalking())) listen(); res();
      },S.voz?220:380+Math.min(900,text.length*6));
    }));
    return queue;
  }
  const PRICES=cfg.modoPreco==='tabela', DONO=cfg.dono||'o responsável';
  const TAGL={novidade:'⭐ Novidade',oferta:'🏷️ Em oferta',safra:'🌱 Safra'};
  const kgTxt=it=>it.kg?String(it.kg).replace('.',',')+' kg':'';
  const byTag=t=>cat.filter(i=>i.tag===t);
  const wa=ex=>{ if(G.whatsapp) G.whatsapp(ex); };
  const baseChips=()=>{
    const c=[]; if(cartItems().length) c.push({label:PRICES?'✅ Fechar pedido':'📲 Enviar pro WhatsApp',send:'fechar pedido'});
    c.push({label:'🔎 Ver o que tem',send:'o que vocês tem'}); c.push({label:'🚚 Entrega',send:'como funciona a entrega'});
    if(!cartItems().length) c.push({label:'⭐ Novidades',send:'novidades'}); return c;
  };
  const segChips=()=>(cfg.segmentos||[]).map(s=>({label:s.emoji+' '+s.rotulo,send:s.rotulo}));
  const catChips=()=>(cfg.categorias||[]).map(c=>({label:c.emoji+' '+c.rotulo,send:c.rotulo}));
  const needChips=()=>[{label:'⭐ Novidades',send:'novidades'},{label:'🏷️ Ofertas e mais em conta',send:'ofertas'},{label:'🔁 Reposição (o que eu sempre levo)',send:'reposicao'},{label:'🔎 Ver tudo',send:'o que vocês tem'}];
  const volChips=()=>[{label:'1 a 5 caixas',send:'poucas caixas'},{label:'6 a 15 caixas',send:'umas medias'},{label:'16 ou mais',send:'muitas caixas'},{label:'🧺 Monta uma sugestão',send:'monta uma sugestao'}];

  // ---------- conteúdo ----------
  const line=it=>`${it.nome} ${it.variante||''}`.trim();
  const priceLine=it=>PRICES?(it.kg?`${money(it.preco)} a ${unit(it,1)} de ${kgTxt(it)} (≈ ${money(it.preco/it.kg)}/kg)`:`${money(it.preco)} cada`):(it.kg?`${it.embalagem} de ${kgTxt(it)}`:it.embalagem);
  const cartStats=()=>{ const its=cartItems(); return {n:its.reduce((s,i)=>s+i.q,0),kg:its.reduce((s,i)=>s+(byId[i.id].kg||0)*i.q,0)}; };
  const valorMsg=()=>`Os valores mudam com a cotação do dia, então o ${DONO} passa certinho no WhatsApp quando você enviar o pedido. E se for volume, ele faz condição.`;
  function explain(it){
    const seg=S.seg&&it.seg&&it.seg[S.seg.id];
    let t=`${it.tip||''}`;
    if(it.shelf) t+=`\n⏱ ${it.shelf}`;
    if(seg) t+=`\n🎯 Pra ${S.seg.rotulo.toLowerCase()}: ${seg}`;
    if(PRICES) t+=`\n💰 ${priceLine(it)}`;
    S.last=it; return t;
  }
  function compare(a,b){
    let t=`**${line(a)}** x **${line(b)}**\n• ${line(a)}: ${priceLine(a)}${a.tip?'. '+a.tip:''}\n• ${line(b)}: ${priceLine(b)}${b.tip?'. '+b.tip:''}`;
    if(a.kg&&b.kg){ const c=a.preco/a.kg<b.preco/b.kg?a:b; t+=PRICES?`\n👉 Por kg, ${line(c)} sai mais em conta.`:`\n👉 Em média a ${line(c)} sai mais em conta por kg.`; }
    return t;
  }
  function bundleFor(segId,size){
    const base=(cfg.bundles||{})[segId]||[]; // quantidades base = movimento médio
    return base.map(([id,q])=>({it:byId[id],q:size==='pequeno'?Math.max(1,Math.ceil(q/2)):size==='grande'?q*2:q})).filter(x=>x.it);
  }
  const sum=list=>list.reduce((s,x)=>s+x.it.preco*x.q,0), kgOf=list=>list.reduce((s,x)=>s+(x.it.kg||0)*x.q,0);

  // ---------- jogadas de venda ----------
  const askBiz=()=>{ S.asked.biz=true; return say('E me conta, qual é o seu negócio? Assim eu te indico o que mais gira pra você.',segChips().concat([{label:'🤷 Só olhando',send:'o que vocês tem'}])); };
  async function showTag(tag){
    const items=byTag(tag); S.need=tag;
    if(!items.length) return say('Hoje não tenho nada destacado nisso. Quer ver o catálogo todo?',needChips());
    await say(tag==='novidade'?'Chegou coisa boa e tem fruta de safra. Dá uma olhada:':`Essas são as que costumam ter melhor condição agora. ${PRICES?'':`O ${DONO} fecha o valor certinho no WhatsApp.`}`,null,{grid:items});
    return S.seg?say('Alguma dessas combina com o seu negócio? Me fala quantas caixas que eu vou anotando.',baseChips()):askBiz();
  }
  async function onSeg(seg){
    S.seg=seg; S.asked.biz=true;
    await say(seg.intro||`Boa! Pra ${seg.rotulo.toLowerCase()} eu sei bem o que gira.`,null,{grid:(seg.destaques||[]).map(id=>byId[id]).filter(Boolean)});
    if(cartItems().length) return say('Quer completar o pedido com mais alguma coisa, ou já posso mandar?',baseChips());
    S.asked.vol=true; return say('Mais ou menos quantas caixas por semana você costuma levar?',volChips());
  }
  function suggest(){
    if(!S.seg) return askBiz();
    const list=bundleFor(S.seg.id,S.size||'medio'); if(!list.length) return say('Me fala o que você quer levar que eu anoto.',baseChips());
    S.pending={type:'bundle',list};
    const tot=PRICES?`\nTotal ${money(sum(list))} (≈ ${Math.round(kgOf(list))} kg).`:`\nDá ≈ ${Math.round(kgOf(list))} kg no total.`;
    return say(`Pra ${S.seg.rotulo.toLowerCase()} nesse volume, eu começaria com isso. Dá pra trocar qualquer item:${tot}\nPosso colocar no seu pedido?`,[{label:'✅ Colocar essa sugestão',send:'sim, pode colocar'},{label:'✏️ Eu escolho',send:'quero escolher'},{label:'💬 Explica cada um',send:'explica essas frutas'}],{grid:list.map(x=>x.it),qty:list.map(x=>x.q)});
  }
  function afterAdd(it,q){
    const {n,kg}=cartStats(), parts=[`${q} ${unit(it,q)} de **${line(it)}** anotada${q>1?'s':''}. Já são ${n} ${n>1?'volumes':'volume'} (≈ ${Math.round(kg)} kg).`];
    if(PRICES){ const tot=cartTotal(); if(tot<(R.min||0)) parts.push(`O mínimo é ${money(R.min)}, faltam ${money(R.min-tot)}.`); else if(R.freteGratis&&tot<R.freteGratis) parts.push(`Faltam ${money(R.freteGratis-tot)} pro frete grátis.`); }
    const pair=(it.pair||[]).map(id=>byId[id]).find(p=>p&&!inCart(p.id)), ch=[];
    if(pair){ parts.push(`Quem leva ${it.nome.toLowerCase()} costuma levar ${line(pair).toLowerCase()} junto. Quer 1 ${unit(pair,1)}?`); ch.push({label:`➕ 1 ${unit(pair,1)} de ${pair.nome.toLowerCase()}`,send:`1 caixa de ${norm(line(pair))}`}); }
    ch.push({label:PRICES?'✅ Fechar pedido':'📲 Enviar pro WhatsApp',send:'fechar pedido'},{label:'🔎 Ver mais',send:'o que vocês tem'});
    return {text:parts.join('\n'),ch};
  }
  async function doAdd(it,q){
    G.adicionar(it.id,q); S.last=it;
    const a=afterAdd(it,q);
    await say(`${pick(['Fechou','Beleza','Anotado','Boa'])}! `+a.text,a.ch,{grid:[it],qty:[q]});
    if(!S.asked.biz&&cartItems().length){ return askBiz(); }
  }
  function showCat(c){
    const items=c.itens.map(id=>byId[id]).filter(Boolean); S.last=null;
    return say(`${c.emoji} **${c.rotulo}**: ${items.length} opções. Toca na que quiser que eu explique.`,[{label:'↩ Outras categorias',send:'o que vocês tem'},...baseChips().slice(0,1)],{grid:items});
  }
  function runPending(p){
    if(p.type==='bundle'){ p.list.forEach(x=>G.adicionar(x.it.id,x.q)); const {n,kg}=cartStats(); return say(`Pronto, coloquei no pedido: ${n} volumes, ≈ ${Math.round(kg)} kg. Quer ajustar alguma coisa ou posso mandar pro ${DONO}?`,[{label:PRICES?'✅ Fechar pedido':'📲 Enviar pro WhatsApp',send:'fechar pedido'},{label:'✏️ Ajustar',send:'quero ajustar'},{label:'🔎 Ver mais frutas',send:'o que vocês tem'}]); }
    if(p.type==='add') return doAdd(p.it,p.q);
    if(p.type==='checkout'){ say(PRICES?'Show! Te levo pro fechamento. 🤝':`Show! Vou abrir o envio pro ${DONO}. Confere seus dados que ele te responde com valor e prazo. 🤝`); setTimeout(()=>G.fechar(),900); return queue; }
  }

  // ---------- cérebro ----------
  async function think(raw){
    const t=norm(raw), m=mentions(t);
    if(cfg.llm&&cfg.llm.endpoint){ try{ const r=await askLLM(raw); if(r){ (r.actions||[]).forEach(a=>{ if(a.type==='add') G.adicionar(a.id,a.qty||1); if(a.type==='show') G.mostrar(a.id); if(a.type==='checkout') G.fechar(); }); return say(r.reply,(r.chips||baseChips()).map(c=>({label:c,send:c}))); } }catch(e){} }
    const YES=/^(sim|s|pode|isso|claro|bora|fechou|beleza|ok|manda|coloca|quero|positivo|uhum|aham)\b|pode (colocar|sim|ser|mandar)|coloca tudo|colocar tudo|sim,? (pode|coloca)/;
    const NO=/^(nao|n|deixa|nao precisa|agora nao|melhor nao|depois)\b/;
    if(S.pending){ if(YES.test(t)){ const p=S.pending; S.pending=null; return runPending(p); } if(NO.test(t)){ S.pending=null; return say('De boa. Me fala o que você prefere levar e eu ajusto.',baseChips()); } }

    // fechar / enviar
    if(/(fechar|finalizar|concluir|fecha o pedido|e isso|so isso|era isso|pode fechar|bora fechar|checkout|pagar|enviar (o )?pedido|mandar (o )?pedido)/.test(t)&&!m.items.length){
      if(!cartItems().length) return say('Seu pedido ainda tá vazio. Bora montar? Me fala o que você veio procurar.',needChips());
      const tot=cartTotal(); if(PRICES&&tot<(R.min||0)) return say(`Faltam ${money(R.min-tot)} pro pedido mínimo de ${money(R.min)}. Quer completar com alguma coisa?`,baseChips());
      S.pending={type:'checkout'};
      return say(PRICES?`Pedido de ${money(tot)}. Posso levar pro fechamento?`:`Beleza! Eu mando seu pedido pro ${DONO} no WhatsApp e ele te responde com valor e prazo de entrega. Quer mandar agora ou ainda quer ver mais alguma coisa?`,[{label:'📲 Mandar agora',send:'sim'},{label:'➕ Quero ver mais',send:'o que vocês tem'}]);
    }
    // remover
    if(/(tira|tirar|remove|remover|retira|cancela|sem a |sem o )/.test(t)&&m.items.length){ const it=m.items[0].it; G.remover(it.id); return say(`Tirei ${line(it)} do pedido.`,baseChips()); }
    // WhatsApp / falar com gente
    if(/(whats|zap|falar com (o|a|um)|atendente|humano|matheus|responsavel|dono)/.test(t)) return say(`Claro! Chama o ${DONO} direto no WhatsApp.${cartItems().length?' Já mando seu pedido junto pra ele não perguntar de novo.':''}`,[{label:'📲 Abrir WhatsApp',act:()=>wa()},...baseChips().slice(0,1)]);
    // vou pensar
    if(/(vou pensar|depois eu|mais tarde|volto|vou ver|deixa eu ver|preciso ver)/.test(t)) return say(`Sem pressa! Se quiser, eu te mando a lista no WhatsApp pra você olhar com calma, e o ${DONO} te passa os valores quando você quiser.`,[{label:'📲 Mandar lista no WhatsApp',act:()=>wa('lista')},{label:'🔎 Ver mais um pouco',send:'o que vocês tem'}]);
    // levar até a bancada
    if(/\b(mostra|mostrar|me mostra|ver|ve|vem|onde fica|me leva|leva la|ate la|quero ver|na bancada|bora la)\b/.test(t)&&(m.items.length||S.last)&&!/(preco|quanto)/.test(t)){ const it=(m.items[0]&&m.items[0].it)||S.last; await say(`Vem comigo! Vou te levar na bancada de ${line(it).toLowerCase()}.`); await new Promise(r=>G.mostrar(it.id,api,r)); return say(`Chegamos! Olha o ponto dessa fruta. ${it.tip||''}`,[{label:`➕ Colocar 1 ${unit(it,1)}`,send:`1 caixa de ${norm(line(it))}`},{label:'🔎 Ver outras',send:'o que vocês tem'}]); }
    // perguntas sobre produto
    const ask=/(quanto|preco|valor|custa|como e|como sao|me fala|fala (da|do|das|dos)|explica|conta|diferenca|qual (a |o )?(melhor|diferenca)|melhor|recomenda|indica|serve|rende|dura|validade|durabilidade|vale a pena|e bom|\?)/.test(t);
    if(ask&&m.items.length>=2&&/(diferenca|melhor|x|ou |versus|compar)/.test(t)) return say(compare(m.items[0].it,m.items[1].it),[{label:`➕ ${line(m.items[0].it)}`,send:'1 caixa de '+norm(line(m.items[0].it))},{label:`➕ ${line(m.items[1].it)}`,send:'1 caixa de '+norm(line(m.items[1].it))}]);
    if(ask&&(m.items.length||m.groups.length)&&!/(quero|manda|coloca|adiciona|leva)\s+\d/.test(t)){
      if(m.items.length){ const it=m.items[0].it, askPrice=/(quanto|preco|valor|custa)/.test(t); return say(explain(it)+(!PRICES&&askPrice?`\n💬 ${valorMsg()}`:''),(it.pair||[]).slice(0,1).map(id=>byId[id]).filter(Boolean).map(p=>({label:'⚖️ Comparar com '+line(p),send:`diferenca entre ${norm(line(it))} e ${norm(line(p))}`})).concat([{label:'🔎 Ver outras',send:'o que vocês tem'}]),{card:it}); }
      const g=m.groups[0]; return say(`Dessa tenho **${g.items.length} opções**. Qual combina mais com você?`,null,{grid:g.items});
    }
    // adicionar
    if(m.items.length){ for(const x of m.items){ await doAdd(x.it,qtyNear(t,x.i,x.len)); } return queue; }
    if(m.groups.length){ const g=m.groups[0]; return say(`${g.items[0].nome}: tenho ${g.items.length} tipos. Qual você prefere?`,null,{grid:g.items}); }
    // entrega / pagamento / mínimo / valores
    if(/(entrega|entregam|frete|horario|quando chega|retirar|retirada|prazo de entrega)/.test(t)) return say(`🚚 ${R.entrega||'Entregamos na região.'}${R.entregaWa?'\n'+R.entregaWa:''}${PRICES&&R.frete!=null?`\nFrete ${money(R.frete)}${R.freteGratis?`, grátis a partir de ${money(R.freteGratis)}`:''}.`:''}`,[{label:'📲 Chamar no WhatsApp',act:()=>wa('entrega')},...baseChips().slice(0,2)]);
    if(/(pagamento|pagar|pix|boleto|faturado|fiado|cartao|prazo)/.test(t)) return say(`💳 ${R.pagamento||'Forma de pagamento a combinar.'}`,[{label:'📲 Falar no WhatsApp',act:()=>wa()},...baseChips().slice(0,2)]);
    if(/(minimo|pedido minimo)/.test(t)) return say(PRICES?`O pedido mínimo é ${money(R.min)}.`:`O ${DONO} confirma o pedido mínimo no WhatsApp junto com o valor. Normalmente a gente trabalha com caixa fechada.`,baseChips());
    if(/(quanto|preco|precos|valor|tabela|custa|cotacao)/.test(t)&&!PRICES) return say(valorMsg()+'\nQuer que eu já vá anotando o que você precisa?',[{label:'🔎 Ver o que tem',send:'o que vocês tem'},{label:'⭐ Novidades',send:'novidades'}]);
    if(/(caro|desconto|abaixo|negociar|melhor preco|menos)/.test(t)){
      const alt=S.last&&cat.filter(i=>i!==S.last&&i.cat&&i.cat===S.last.cat&&i.kg&&S.last.kg&&i.preco/i.kg<S.last.preco/S.last.kg).sort((a,b)=>a.preco/a.kg-b.preco/b.kg)[0];
      let tx=PRICES?'Entendo. O preço da caixa acompanha a cotação do dia.':`Entendo. ${valorMsg()}`;
      if(alt) tx+=`\nSe o foco é custo, olha a **${line(alt)}**: costuma sair mais em conta. ${alt.tip||''}`;
      return say(tx,[...(alt?[{label:`Ver ${line(alt)}`,send:'me fala da '+norm(line(alt))}]:[]),{label:'🏷️ Ver ofertas',send:'ofertas'},{label:'📲 Falar no WhatsApp',act:()=>wa()}]);
    }
    // o que veio procurar
    if(/(novidade|novo|nova|lancamento|chegou|safra|de epoca|temporada)/.test(t)) return showTag('novidade');
    if(/(oferta|promo|barato|baratinho|mais em conta|economi|bom preco|em conta)/.test(t)) return showTag('oferta');
    if(/(reposi|de sempre|de costume|sempre levo|sempre compro|pedido de sempre|repetir)/.test(t)){ S.need='reposicao'; return say('Beleza! Me fala o que você costuma levar e quantas caixas que eu vou anotando. Por exemplo: "10 caixas de laranja e 5 de banana prata".',baseChips()); }
    // negócio, volume, sugestão
    const seg=findSeg(t), size=findSize(t);
    if(seg) return onSeg(seg);
    if(size&&(S.asked.vol||S.seg)){ S.size=size; return suggest(); }
    if(/(monta|montar|monte|sugest|sugere|me ajuda|nao sei|kit|pedido pra mim)/.test(t)) return suggest();
    if(/(ajustar|trocar|mudar|alterar|escolho|escolher)/.test(t)) return say('Beleza, você manda. Me fala o que quer tirar ou levar, tipo "tira o limão" ou "mais 2 caixas de manga". Ou toca numa categoria:',catChips());
    const c=findCat(t); if(c) return showCat(c);
    if(/(o que (voces|vcs|tem|voce)|opcoes|catalogo|lista|cardapio|que frutas|tudo que|ver tudo)/.test(t)) return say('Aqui no pavilhão eu trabalho com:\n'+(cfg.categorias||[]).map(c=>`${c.emoji} ${c.rotulo}`).join('\n')+'\nQual você quer ver?',catChips());
    if(/(obrigad|valeu|vlw|tmj)/.test(t)) return say('Tmj! Qualquer coisa é só chamar. 🤝',baseChips());
    if(/^(oi|ola|e ai|eai|opa|bom dia|boa tarde|boa noite|salve|fala)/.test(t)) return say(`Fala, chefe! Sou o ${cfg.nome}. O que você veio procurar hoje?`,needChips());
    return say(pick(['Não peguei essa direito. Me fala o nome da fruta, ou o que você veio procurar, que eu te ajudo.','Hmm, deixa eu entender melhor: você quer ver novidades, algo mais em conta, ou repor o que sempre leva?']),needChips());
  }

  async function askLLM(raw){
    const L=cfg.llm, body={sistema:systemPrompt(),mensagem:raw,historico:S.hist.slice(-12),carrinho:cartItems(),total:cartTotal(),catalogo:cat.map(({id,nome,variante,preco,kg,embalagem})=>({id,nome,variante,preco,kg,embalagem}))};
    const r=await fetch(L.endpoint,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},L.headers||{}),body:JSON.stringify(body)}); if(!r.ok) throw 0; return r.json();
  }
  function systemPrompt(){ return `Você é ${cfg.nome}, ${cfg.cargo} da ${cfg.loja}, atendendo pelo dono ${DONO}. Fale português do Brasil, direto, camarada e profissional, sem pressionar. Comece perguntando o que o cliente veio procurar (novidades, ofertas, reposição) e qual é o negócio dele; só depois sugira. Mostre produtos do catálogo (use actions show). ${PRICES?'Use só preços do catálogo.':'NUNCA fale valores: diga que o '+DONO+' passa o valor no WhatsApp conforme a cotação do dia.'} Entrega: ${R.entrega||''} ${R.entregaWa||''} Não force o fechamento; se o cliente hesitar, ofereça mandar a lista no WhatsApp. Responda JSON {reply, chips[], actions:[{type:'add',id,qty}|{type:'show',id}|{type:'checkout'}]}.`; }

  // ---------- UI ----------
  function user(text){ text=(text||'').trim(); if(!text) return; stopSpeak(); bubble(esc(text),'me'); S.hist.push({role:'user',content:text}); vc.innerHTML=''; inp.value=''; think(text).catch(e=>{ console.error(e); say('Opa, travei aqui. Tenta de novo?',baseChips()); }); }
  $('vf').onsubmit=e=>{ e.preventDefault(); user(inp.value); };
  function open(){
    if(S.open) return; S.open=true; clearTimeout(keepTimer); keepAlive=false; chat.classList.add('on'); $('vbtn').style.display='none'; $('vtip').classList.remove('on');
    cfg.onOpen&&cfg.onOpen();
    if(!S.greeted){ S.greeted=true; say(`Fala, chefe! Eu sou o **${cfg.nome}**, cuido das frutas aqui do ${cfg.loja}. 🍊
O que você veio procurar hoje?`,needChips()); }
    else if(S.conv&&!listening) listen();
    setTimeout(()=>inp.focus(),50);
  }
  function close(){ if(!S.open) return; S.open=false; stopSpeak(); if(listening){ keepAlive=true; clearTimeout(keepTimer); keepTimer=setTimeout(()=>{ keepAlive=false; stopListen(); },120000); } else stopListen(); chat.classList.remove('on'); $('vbtn').style.display='flex'; inp.blur(); cfg.onClose&&cfg.onClose(); }
  $('vbtn').onclick=open; $('vx').onclick=close;
  $('vsnd').onclick=()=>{ S.voz=!S.voz; $('vsnd').textContent=S.voz?'🔊':'🔇'; if(!S.voz) stopSpeak(); };
  $('vconv').onclick=()=>{ if(!SR){ bubble('Esse navegador não tem reconhecimento de voz. Use o Chrome ou o Edge.'); return; } S.conv=!S.conv; micErr=0; $('vconv').classList.toggle('off',!S.conv); if(S.conv) listen(); else stopListen(); };
  $('vmic').onclick=()=>{ if(!SR){ bubble('Esse navegador não tem reconhecimento de voz. Use o Chrome ou o Edge.'); return; } if(listening){ S.conv=false; $('vconv').classList.add('off'); stopListen(); } else { stopSpeak(); micErr=0; listen(); } };
  if(!SR) $('vconv').classList.add('off'); if(!S.voz) $('vsnd').textContent='🔇';
  for(const ev of ['mousedown','mouseup','click','keyup']) chat.addEventListener(ev,e=>e.stopPropagation());
  chat.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.code==='Escape') close(); });
  $('vbtn').addEventListener('mousedown',e=>e.stopPropagation()); $('vbtn').addEventListener('mouseup',e=>e.stopPropagation());

  // ---------- avatar 3D ----------
  let avatar=null, pickMesh=null, tm=0, nearGreeted=false;
  if(cfg.three){
    const {THREE:T,scene,pos,pickMeshes,col}=cfg.three;
    avatar=buildAvatar(T,cfg.avatar,cfg.nome,cfg.cargo);
    avatar.group.position.set(pos[0],pos[1]||0,pos[2]); scene.add(avatar.group);
    pickMesh=new T.Mesh(new T.BoxGeometry(.9,2.1,.9),new T.MeshBasicMaterial({visible:false})); pickMesh.position.set(pos[0],1.05,pos[2]); pickMesh.userData={vendor:true}; scene.add(pickMesh); if(pickMeshes) pickMeshes.push(pickMesh);
    if(col) col(pos[0]-.45,pos[0]+.45,pos[2]-.45,pos[2]+.45);
  }
  function frame(dt,camPos){
    if(!avatar) return null; tm+=dt;
    const d=avatar.update(dt,tm,camPos); if(pickMesh) pickMesh.position.set(avatar.group.position.x,1.05,avatar.group.position.z);
    if(!S.open){ if(d<6.5&&!nearGreeted){ nearGreeted=true; avatar.talk(2.2); } if(d>10) nearGreeted=false; avatar.setBubble(d<6.5?(S.greeted?'Posso ajudar em mais algo?':'👋 E aí, chefe! Posso ajudar?'):''); }
    else avatar.setBubble('');
    return d;
  }
  const api={open,close,isOpen:()=>S.open,frame,pickMesh,tip:on=>$('vtip').classList.toggle('on',!!on&&!S.open),say,systemPrompt,state:S,
    walkTo:(pts,cb)=>{ setStatus('walk'); if(avatar) avatar.walk(pts,2.6,()=>{ setStatus('idle'); cb&&cb(); }); else cb&&cb(); },
    pos:()=>avatar?avatar.group.position:null, heading:()=>avatar?avatar.heading:{x:0,z:1}, walking:()=>!!(avatar&&avatar.isWalking())};
  return api;
}
window.NewVendedor={create};
})();
