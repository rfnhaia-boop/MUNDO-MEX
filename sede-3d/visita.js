/* VISITA NEW: o visitante entra na Sede como personagem. O Ravi o recebe na recepção, leva pelo andar da NEX,
   entra com ele numa sala de reunião, senta à mesa e conduz o diagnóstico. No fim envia o lead (/api/tour/lead).
   Só roda com ?visita=1 (e opcionais ?ref=<criativo> ?teste=1 ?rapido=1). Não mexe em nada quando o parâmetro não existe.
   Modo visitante: esconde tudo o que é interno (menu, fila do chefe, Mesa) e NÃO libera a exploração livre da Sede. */
(function(){
const Q=new URLSearchParams(location.search); if(Q.get('visita')!=='1') return;
const S=window.__SEDE; if(!S||!S.THREE){ console.warn('visita.js: ganchos ausentes'); return; }
window.__VISITA=true; document.body.classList.add('visita');
const T=S.THREE, TESTE=Q.get('teste')==='1', REF=Q.get('ref')||'direto', FAST=Q.get('rapido')==='1', ENDPOINT=window.TOUR_ENDPOINT||'/api/tour/lead';
const sleep=ms=>new Promise(r=>setTimeout(r,FAST?Math.min(ms,60):ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const R=S.MGRS[0], G=S.FL[0];
const PRAVI='../shared/personagens/ravi-rosto-em-pe.png';


/* ---------- Ravi fotográfico (Google Flow): sprite recortado que sempre olha pra câmera ---------- */
const TL=new T.TextureLoader();
function ravi2d(agent, file, h, ratio, y0){
  y0=y0||0;
  const t=TL.load(file); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8;
  const m=new T.Mesh(new T.PlaneGeometry(h*ratio,h), new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.35,toneMapped:false}));
  m.position.y=y0+h/2; m.userData.ravi2d=true;
  const sh=new T.Mesh(new T.CircleGeometry(h*ratio*.42,24), new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false}));
  sh.rotation.x=-Math.PI/2; sh.position.y=.012; sh.userData.ravi2d=true;
  agent.children.forEach(c=>{ if(!c.userData||!c.userData.shop) c.visible=false; });
  agent.add(m); if(!y0) agent.add(sh);
  S.ANIM.push(()=>{ if(!agent.visible&&agent.parent&&false) return; const wp=new T.Vector3(); agent.getWorldPosition(wp); const c=S.camera.position; m.rotation.y=Math.atan2(c.x-wp.x,c.z-wp.z)-agent.rotation.y; });
  return m; }
(async()=>{ const G3=await window.__GUIA3D.make(R.a); if(!G3) return ravi2d(R.a, PRAVI, 1.82, 0.339); window.__GUIA3D.esconderCorpoAntigo(R.a,G3.root);
  S.ANIM.push(()=>G3.play(R.waveT>0?'wave':R.walking?'walk':R.talking?'talk':'idle')); })();

/* ---------- visual do modo visitante + diálogo ---------- */
const st=document.createElement('style'); st.textContent=`
body.visita #nav,body.visita #dpad,body.visita #boss,body.visita #help,body.visita #floor,body.visita #back,body.visita #title,body.visita #cross,body.visita #ic,body.visita #lift,body.visita #mg,body.visita #mesa,body.visita #bp,body.visita #toast{display:none!important}
#vd{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(680px,calc(100vw - 20px));z-index:20;display:none;flex-direction:column;gap:10px;padding:14px 16px 16px;color:#f5f3fa;font:15px/1.5 "Segoe UI",system-ui,sans-serif;background:linear-gradient(180deg,rgba(38,26,17,.94),rgba(14,12,18,.96));backdrop-filter:blur(22px) saturate(1.4);border:1px solid rgba(255,255,255,.13);border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 90px -34px #ff7a1a}
#vd.on{display:flex;animation:vdin .3s cubic-bezier(.2,.9,.3,1.1)} @keyframes vdin{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
#vd .top{display:flex;align-items:center;gap:10px} #vd .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:linear-gradient(145deg,#ffb066,#ff7a1a);border:2px solid #17121a;flex:none} #vd .nm b{display:block;font-size:15.5px} #vd .nm small{opacity:.65;font-size:12px} #vd .sp{flex:1} #vd .top button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:99px;height:30px;padding:0 12px;cursor:pointer;font:600 12.5px "Segoe UI",system-ui} #vd .top button.off{opacity:.45}
#vd .vt{min-height:48px;font-size:16.5px;line-height:1.55} #vd .vt b{color:#ffb066}
#vd .vo{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))} #vd .vo button{padding:11px 14px;border-radius:15px;border:1px solid rgba(255,122,26,.55);background:rgba(255,122,26,.1);color:#ffe3cc;font:600 14.5px/1.3 "Segoe UI",system-ui;cursor:pointer;text-align:left;animation:vb .3s ease both} @keyframes vb{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}} #vd .vo button:hover,#vd .vo button.sel{background:#ff7a1a;color:#1a0d05} #vd .vo button.pri{background:linear-gradient(135deg,#ff7a1a,#d9540a);color:#fff;border-color:transparent}
#vd form{display:flex;gap:8px} #vd input{flex:1;min-width:0;padding:12px 16px;border-radius:99px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;font:16px "Segoe UI",system-ui;outline:none} #vd input:focus{border-color:#ff7a1a} #vd form button{border:0;border-radius:99px;padding:0 20px;background:#ff7a1a;color:#16120e;font-weight:800;cursor:pointer}
#vtest{position:fixed;top:12px;right:12px;z-index:21;background:#ef4444;color:#fff;font:800 11px "Segoe UI",system-ui;letter-spacing:.08em;padding:5px 10px;border-radius:99px}
#vend{position:fixed;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(10,6,4,.82);backdrop-filter:blur(8px);padding:16px;color:#fff;font-family:"Segoe UI",system-ui,sans-serif} #vend.on{display:flex} #vend .c{max-width:460px;text-align:center;padding:30px 28px;border-radius:24px;background:linear-gradient(180deg,rgba(38,26,17,.95),rgba(14,12,18,.97));border:1px solid rgba(255,255,255,.14)} #vend h2{font-size:24px;margin-bottom:8px} #vend p{opacity:.8;line-height:1.55;margin:6px 0} #vend a,#vend button{display:inline-block;margin:10px 5px 0;padding:12px 20px;border-radius:99px;border:1px solid #ff7a1a;background:rgba(255,122,26,.12);color:#ffe3cc;font:700 14px "Segoe UI",system-ui;cursor:pointer;text-decoration:none} #vend .pri{background:#ff7a1a;color:#1a0d05}`;
document.head.appendChild(st);
const VD=document.createElement('div'); VD.id='vd'; VD.innerHTML='<div class="top"><div class="av">🧑‍🚀</div><div class="nm"><b>Ravi</b><small>NEX · reunião</small></div><div class="sp"></div><button id="vv">🔊 Voz</button></div><div class="vt" id="vt"></div><div class="vo" id="vo"></div><form id="vf" style="display:none"><input id="vi" autocomplete="off"><button>OK</button></form>';
document.body.appendChild(VD); for(const ev of ['mousedown','mouseup','click','keydown','keyup']) VD.addEventListener(ev,e=>e.stopPropagation());
const $v=id=>document.getElementById(id), VT=$v('vt'), VO=$v('vo'), VF=$v('vf'), VI=$v('vi');
if(TESTE){ const b=document.createElement('div'); b.id='vtest'; b.textContent='MODO TESTE'; document.body.appendChild(b); }

/* ---------- voz ---------- */
let tts=true; const SS=window.speechSynthesis; let voz=null;
function pick(){ if(!SS) return; const vs=SS.getVoices().filter(v=>/^pt/i.test(v.lang)); voz=vs.find(v=>/daniel|antonio|masculin/i.test(v.name))||vs.find(v=>/google/i.test(v.name))||vs[0]||null; } if(SS){ pick(); SS.onvoiceschanged=pick; }
function speak(t){ return new Promise(res=>{ if(!tts||!SS||FAST){ res(); return; } let n=0, fin=false; const done=()=>{ if(!fin){ fin=true; res(); } }; try{ SS.cancel(); const parts=t.replace(/\*\*/g,'').match(/[^.!?:]+[.!?:]?/g)||[t]; n=parts.length; for(const p of parts){ const u=new SpeechSynthesisUtterance(p.trim()); if(voz) u.voice=voz; u.lang='pt-BR'; u.rate=1.06; u.pitch=1.05; u.onend=u.onerror=()=>{ if(--n<=0) done(); }; SS.speak(u); } }catch(e){ done(); } setTimeout(done,Math.max(2500,t.length*85)); }); }
$v('vv').onclick=()=>{ tts=!tts; $v('vv').classList.toggle('off',!tts); if(!tts&&SS) SS.cancel(); };

/* ---------- diálogo ---------- */
let seated=null, talk=false;
async function say(t){ VD.classList.add('on'); VO.innerHTML=''; VF.style.display='none'; talk=true; R.talking=true; const sp=speak(t), w=fmt(t).split(' '); for(let i=1;i<=w.length;i++){ VT.innerHTML=w.slice(0,i).join(' '); await sleep(tts&&!FAST?290:110); } VT.innerHTML=w.join(' '); if(tts&&!FAST) await Promise.race([sp,sleep(500+t.length*55)]); talk=false; R.talking=false; }
function choose(opts,multi){ VO.innerHTML=''; VF.style.display='none'; return new Promise(res=>{ const sel=new Set(); const ok=document.createElement('button'); ok.className='pri'; ok.textContent='Continuar ▸'; ok.style.display='none'; opts.forEach((o,i)=>{ const b=document.createElement('button'); b.textContent=o; b.style.animationDelay=(i*60)+'ms'; b.onclick=()=>{ if(!multi){ VO.innerHTML=''; res(o); return; } sel.has(o)?sel.delete(o):sel.add(o); b.classList.toggle('sel'); ok.style.display=sel.size?'block':'none'; }; VO.appendChild(b); }); if(multi){ ok.onclick=()=>{ const v=[...sel]; VO.innerHTML=''; res(v); }; VO.appendChild(ok); } }); }
function ask(ph,type,valid){ VO.innerHTML=''; VF.style.display='flex'; VI.type=type||'text'; VI.placeholder=ph; VI.value=''; setTimeout(()=>VI.focus(),60); return new Promise(res=>{ VF.onsubmit=e=>{ e.preventDefault(); const v=VI.value.trim(); if(!v) return; if(valid&&!valid(v)){ VI.style.borderColor='#ef4444'; return; } VI.style.borderColor=''; VF.style.display='none'; res(v); }; }); }

/* ---------- a sala de reunião (andar da NEX) ---------- */
const BOARD={visitante:'',empresa:'',ramo:'',cidade:'',tamanho:'',dores:'',presenca:'',momento:'',pacote:''};
const bc=document.createElement('canvas'); bc.width=1280; bc.height=620; const bx=bc.getContext('2d'), bt=new T.CanvasTexture(bc); bt.colorSpace=T.SRGBColorSpace; bt.anisotropy=4;
function drawBoard(){ const w=1280,h=620; bx.fillStyle='#0f0a06'; bx.fillRect(0,0,w,h); bx.fillStyle='#ff7a1a'; bx.fillRect(0,0,w,10); bx.textAlign='left';
  bx.font='800 44px "Segoe UI",system-ui'; bx.fillStyle='#fff'; bx.fillText('REUNIÃO · NEX',40,80); bx.font='500 24px "Segoe UI",system-ui'; bx.fillStyle='rgba(255,255,255,.55)'; bx.fillText('quadro ao vivo: o que o Ravi anota enquanto vocês conversam',42,116);
  const rows=[['Visitante','visitante'],['Empresa','empresa'],['Ramo','ramo'],['Cidade','cidade'],['Tamanho','tamanho'],['Maior dor','dores'],['Já tem','presenca'],['Momento','momento'],['Pacote indicado','pacote']];
  rows.forEach(([lab,k],i)=>{ const col=i%2, rw=Math.floor(i/2), x=40+col*620, y=170+rw*88, v=BOARD[k]; bx.fillStyle=v?'rgba(255,122,26,.14)':'rgba(255,255,255,.05)'; bx.beginPath(); bx.roundRect(x,y,590,74,14); bx.fill(); bx.font='600 20px "Segoe UI",system-ui'; bx.fillStyle=v?'#ffb066':'rgba(255,255,255,.4)'; bx.fillText(lab.toUpperCase(),x+20,y+28); bx.font='700 28px "Segoe UI",system-ui'; bx.fillStyle=v?'#fff':'rgba(255,255,255,.25)'; let txt=v||'—'; while(bx.measureText(txt).width>540&&txt.length>6) txt=txt.slice(0,-2); bx.fillText(txt+(txt!==(v||'—')?'…':''),x+20,y+60); if(v){ bx.fillStyle='#4ade80'; bx.font='800 26px "Segoe UI"'; bx.textAlign='right'; bx.fillText('✓',x+570,y+60); bx.textAlign='left'; } });
  bt.needsUpdate=true; }
function buildRoom(){
  const M=S.M, box=S.box, wood=M({color:'#b98a58',roughness:.55}), glass=()=>new T.MeshPhysicalMaterial({color:'#efe6ff',transparent:true,opacity:.14,roughness:.02,depthWrite:false,envMapIntensity:1.3}), dk=S.dark;
  const rug=new T.Mesh(new T.PlaneGeometry(6.4,7),new T.MeshBasicMaterial({color:'#ff7a1a',transparent:true,opacity:.14,depthWrite:false})); rug.rotation.x=-Math.PI/2; rug.position.set(-11.8,.013,4.25); G.add(rug);
  box(G,6.7,3.6,.14,wood,-11.8,1.8,.5); const scr=new T.Mesh(new T.PlaneGeometry(5.6,2.7),new T.MeshBasicMaterial({map:bt,toneMapped:false})); scr.position.set(-11.8,2.1,.6); G.add(scr); box(G,5.75,2.85,.06,dk,-11.8,2.1,.56); box(G,5.75,.05,.08,S.LED[0],-11.8,.62,.6);
  for(const [x,z,w,d,h] of [[-11.8,8,6.6,.05,3.1],[-8.6,2.0,.05,2.8,3.1],[-8.6,6.8,.05,2.4,3.1]]){ const g=new T.Mesh(new T.BoxGeometry(w,h,d),glass()); g.position.set(x,1.65,z); G.add(g); box(G,w+.04,.06,d+.04,dk,x,3.2,z); box(G,w+.04,.06,d+.04,dk,x,.1,z); }
  box(G,.08,3.2,.08,dk,-8.6,1.6,3.4); box(G,.08,3.2,.08,dk,-8.6,1.6,5.6); box(G,.08,.1,2.3,dk,-8.6,3.2,4.5);
  const sg=S.ctex(512,100,(c,w,h)=>{ c.fillStyle='rgba(16,12,28,.92)'; c.beginPath(); c.roundRect(2,2,w-4,h-4,18); c.fill(); c.fillStyle='#ff7a1a'; c.fillRect(20,h-14,w-40,5); c.font='800 38px "Segoe UI",system-ui'; c.fillStyle='#fff'; c.textAlign='center'; c.fillText('SALA DE REUNIÃO',w/2,h*.55); });
  const sgm=new T.Mesh(new T.PlaneGeometry(2.1,.42),S.BM(sg)); sgm.position.set(-8.5,3.5,4.5); sgm.rotation.y=Math.PI/2; G.add(sgm);
  box(G,3.4,.07,1.15,wood,-12,.76,4.5); for(const [lx,lz] of [[-13.5,4.1],[-13.5,4.9],[-10.5,4.1],[-10.5,4.9]]) box(G,.07,.74,.07,dk,lx,.37,lz); box(G,.5,.02,.4,S.LED[0],-12,.8,4.5);
  const chair=(x,z,ry)=>{ const c=new T.Group(); c.position.set(x,0,z); c.rotation.y=ry; G.add(c); box(c,.5,.07,.5,dk,0,.46,0); box(c,.5,.6,.07,dk,0,.78,-.25); box(c,.06,.42,.06,dk,0,.22,0); box(c,.5,.04,.5,dk,0,.03,0); };
  chair(-12,3.3,0); chair(-12,5.75,Math.PI);
  for(const [x,z] of [[-14.5,1.4],[-14.5,7.5]]){ const p=new T.Group(); p.position.set(x,0,z); G.add(p); box(p,.5,.5,.5,S.white,0,.25,0); for(let i=0;i<6;i++){ const l=new T.Mesh(new T.IcosahedronGeometry(.16+(i%3)*.05,1),M({color:['#2f6b3a','#3a7d44','#295c34'][i%3],roughness:.9,flatShading:true})); l.position.set(((i*37)%10-5)/25,.65+(i%3)*.18,((i*53)%10-5)/25); p.add(l); } }
  S.addCol(0,-11.8,.5,6.7,.3); S.addCol(0,-11.8,8,6.7,.3); S.addCol(0,-8.6,2.0,.3,2.8); S.addCol(0,-8.6,6.8,.3,2.4); S.addCol(0,-12,4.5,3.6,1.5);
  seated=S.agent('#17171d',true); seated.position.set(-12,0,3.25);
  (async()=>{ const G3=await window.__GUIA3D.make(seated,{inicial:'sit'}); if(!G3) return ravi2d(seated,'../shared/personagens/ravi-rosto-sentado.png',0.8,1.056,0.74); window.__GUIA3D.esconderCorpoAntigo(seated,G3.root); S.ANIM.push(()=>G3.play(talk?'sit_talk':'sit')); })(); seated.rotation.y=0; seated.visible=false; G.add(seated);
  const u=seated.userData; S.ANIM.push(t=>{ if(!seated.visible) return; if(talk){ u.arms[1].rotation.x=-1.0+Math.sin(t*4.5)*.28; u.arms[1].rotation.z=.3+Math.sin(t*3)*.15; u.arms[0].rotation.x=-1.05+Math.sin(t*2.2)*.08; u.head.rotation.x=Math.sin(t*5)*.03; } else { u.arms[1].rotation.x=-1.1; u.arms[1].rotation.z=.05; u.arms[0].rotation.x=-1.1; u.head.rotation.x=0; } u.head.rotation.y=Math.sin(t*.7)*.12; });
  drawBoard(); }

/* ---------- câmera ---------- */
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
let followOn=false, cv=null;
(function loop(){ requestAnimationFrame(loop); if(!followOn||!cv) return; const a=R.a.position, ry=R.a.rotation.y, tx=a.x-Math.sin(ry)*2.7, tz=a.z-Math.cos(ry)*2.7; cv.x+=(tx-cv.x)*.07; cv.z+=(tz-cv.z)*.07; const ty=Math.atan2(-(a.x-cv.x),-(a.z-cv.z)); cv.yaw+=wrap(ty-cv.yaw)*.09; S.setView(cv.x,cv.z,cv.yaw,-.06,1.7); })();
function startFollow(){ const v=S.view; cv={x:v.x,z:v.z,yaw:v.yaw}; followOn=true; }
function view(cx,cz,lx,lz,dur,eye,pit){ followOn=false; const v0=S.view, y1=Math.atan2(-(lx-cx),-(lz-cz)), t0=performance.now(), d=FAST?120:(dur||1500), e1=eye==null?1.65:eye, p1=pit==null?-.04:pit; return new Promise(res=>{ (function step(){ const k=Math.min(1,(performance.now()-t0)/d), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; S.setView(v0.x+(cx-v0.x)*e,v0.z+(cz-v0.z)*e,v0.yaw+wrap(y1-v0.yaw)*e,v0.pitch+(p1-v0.pitch)*e,v0.eye+(e1-v0.eye)*e); if(k<1) requestAnimationFrame(step); else res(); })(); }); }
function walk(x,z,sp){ R.faceCam=false; return new Promise(res=>S.mgrWalk(R,x,z,(sp||1.9)*(FAST?5:1),res)); }

/* ---------- roteiro ---------- */
const SEG={'Mercado / Alimentação':'o seu mercado','Moda e acessórios':'a sua loja de moda','Pet shop':'o seu pet shop','Clínica / Saúde':'a sua clínica','Escritório / Serviços':'o seu escritório','Atacado / B2B':'o seu negócio B2B','Outro ramo':'o seu negócio'};
const PK={START:'a base: marca, Instagram inicial, site, Google Business e o painel NEX',GROWTH:'tudo do START mais estratégia de conteúdo, landing pages, relatórios e a IA da empresa',SCALE:'tudo do GROWTH mais automações, IA personalizada, dashboards e integrações'};
const D={nome:'',empresa:'',ramo:'',cidade:'',tamanho:'',dores:[],presenca:[],momento:'',pacote:'',horario:'',whatsapp:'',consentimento:false};
async function run(){
  S.setModal(true); S.setView(0,10.9,0,-.03,1.65); R.faceCam=true; R.waveT=2.4;
  await sleep(900);
  await say('Oi! Seja bem-vindo à **NEW**. Eu sou o **Ravi**, da NEX. Vou te mostrar o escritório e depois a gente senta numa sala pra eu entender o seu negócio. Leva uns 5 minutos.');
  await say('Antes: vou te fazer algumas perguntas sobre a sua empresa. Uso os dados só pra equipe da NEX falar com você, e você pode pedir pra apagar quando quiser. Tudo bem?');
  const c=await choose(['Tudo bem, vamos','Prefiro só conhecer o escritório']); D.consentimento=c==='Tudo bem, vamos';
  await say(D.consentimento?'Perfeito! Como posso te chamar?':'Sem problema. Como posso te chamar?'); D.nome=await ask('Seu nome','text'); BOARD.visitante=D.nome;
  await say('Prazer, **'+D.nome+'**! Qual o nome da sua empresa?'); D.empresa=await ask('Nome da empresa','text'); BOARD.empresa=D.empresa;
  await say('E o que a **'+D.empresa+'** faz?'); D.ramo=await choose(Object.keys(SEG)); BOARD.ramo=D.ramo; const de=SEG[D.ramo];
  await say('Então vem comigo, **'+D.nome+'**. Vou te mostrar o andar da NEX.');
  VD.classList.remove('on'); startFollow(); await walk(4.4,-4.6,2.1); R.faceCam=true; await view(1.4,-2.2,14,-6.8,1600);
  await say('Aqui é a **prospecção**. Esse time encontra empresas como a sua, abre a conversa e leva até uma análise gratuita. Parte disso já funciona e parte ainda está em montagem, porque estamos colocando os agentes de IA pra trabalhar de verdade.');
  VD.classList.remove('on'); startFollow(); await walk(-4.4,-4.6,2.1); R.faceCam=true; await view(-1.4,-2.2,-14,-6.8,1600);
  await say('E aqui é a **criação**: site, Instagram, Google, o painel. É onde as entregas dos clientes da NEX acontecem.');
  await say('Agora vamos pra sala de reunião. É ali, à esquerda.');
  VD.classList.remove('on'); startFollow(); await walk(-9.7,4.5,2.1); followOn=false;
  // senta: o Ravi vira o modelo sentado e a câmera vai pra cadeira do visitante
  R.path=[]; R.a.position.set(60,0,60); seated.visible=true; await view(-12,5.7,-12,3.2,1500,1.22,0.02);
  drawBoard();
  await say('Pode sentar, **'+D.nome+'**. Aqui a gente conversa com calma. Vou ir anotando no quadro atrás de mim.');
  if(!D.consentimento){ await say('Como você preferiu só conhecer, a gente fica por aqui. Se quiser conversar sobre '+de+', é só entrar de novo e aceitar o diagnóstico. Obrigado pela visita!'); return fim(false); }
  await say('Em que cidade vocês estão?'); D.cidade=await ask('Cidade','text'); BOARD.cidade=D.cidade; drawBoard();
  await say('Quantas pessoas trabalham aí?'); D.tamanho=await choose(['Só eu','2 a 5','6 a 20','Mais de 20']); BOARD.tamanho=D.tamanho; drawBoard();
  await say('O que mais pesa hoje? Pode marcar mais de uma.'); D.dores=await choose(['Ser encontrado no Google','Converter mais clientes','Instagram parado','Organizar estoque e operação','Atender mais rápido no WhatsApp'],true); BOARD.dores=D.dores.join(', '); drawBoard();
  await say('E o que vocês já têm hoje?'); D.presenca=await choose(['Site','Instagram','Google Meu Negócio','Nada disso ainda'],true); BOARD.presenca=D.presenca.join(', '); drawBoard();
  await say('Em que momento a empresa está?'); D.momento=await choose(['Estou começando a me organizar online','Tenho presença, mas não vira cliente','Já vendo bem e quero escalar']); BOARD.momento=D.momento; drawBoard();
  D.pacote=D.momento.startsWith('Estou')?'START':D.momento.startsWith('Tenho')?'GROWTH':'SCALE'; BOARD.pacote=D.pacote; drawBoard();
  await say('Obrigado, **'+D.nome+'**. Pelo que você me contou, pra '+de+' faz mais sentido o **'+D.pacote+'**: '+PK[D.pacote]+'. Mas antes de falar de preço, a gente começa pela **Análise Estratégica gratuita**: eu olho Google, Instagram, site e comunicação da **'+D.empresa+'**, sem compromisso.');
  { const v=await choose(['Quero ver na prática','Prefiro só agendar']); if(v==='Quero ver na prática') await cenaPlano(de); }
  await say('Quer marcar uma conversa de 15 minutos com a equipe pra apresentar essa análise? Qual horário é melhor?');
  const dia=await choose(['Hoje','Amanhã','Esta semana']); const per=await choose(['Manhã','Tarde','Noite']); D.horario=dia+' · '+per;
  await say('Pra onde a equipe te chama? Me passa o seu **WhatsApp** com DDD.'); D.whatsapp=await ask('(11) 90000-0000','tel',v=>v.replace(/\D/g,'').length>=10);
  await say('Anotando tudo...'); const ok=await enviar();
  await say(ok?'Pronto, **'+D.nome+'**! Anotei tudo. A equipe da NEX te chama no WhatsApp **'+D.whatsapp+'** ('+D.horario.toLowerCase()+'). Foi um prazer receber você na NEW!':'Anotei aqui no seu aparelho, mas não consegui falar com a equipe agora. Pode tentar de novo em instantes?');
  fim(ok); }

/* ---------- cena do plano: sobe pro andar do cliente, o Ravi explica o plano e coloca a pessoa no PC ---------- */
const PLANO={START:['Marca e identidade','Instagram inicial','Site profissional','Google Meu Negócio','Painel NEX'],GROWTH:['Tudo do START','Estratégia de conteúdo','Landing pages','Relatórios mensais','IA da empresa'],SCALE:['Tudo do GROWTH','Automações','IA personalizada','Dashboards','Integrações']};
let R3=null;
function ravi3(){ if(R3) return R3; const a=S.agent('#17171d',false); a.position.set(0,0,8.2); S.FL[3].add(a); R3={cfg:{f:3,nome:'Ravi',papel:'NEX'},a,path:[],speed:1.8,walking:false,talking:false,waveT:0,phase:0,faceCam:false,onArrive:null,yaw:Math.PI,iv:null}; S.MGRS.push(R3);
  (async()=>{ const G3=await window.__GUIA3D.make(a); if(!G3) return ravi2d(a, PRAVI, 1.82, 0.339); window.__GUIA3D.esconderCorpoAntigo(a,G3.root); S.ANIM.push(()=>G3.play(R3.waveT>0?'wave':R3.walking?'walk':R3.talking?'talk':'idle')); })();
  return R3; }
function fade(on){ let f=document.getElementById('vfade'); if(!f){ f=document.createElement('div'); f.id='vfade'; f.style.cssText='position:fixed;inset:0;background:#05080a;z-index:19;opacity:0;pointer-events:none;transition:opacity .6s;display:grid;place-items:center;color:#5eead4;font:700 18px "Segoe UI",system-ui;letter-spacing:.12em'; document.body.appendChild(f); } f.textContent=on?'SUBINDO · 4º ANDAR · CLIENTES':''; f.style.opacity=on?1:0; return sleep(700); }
async function cenaPlano(de){
  await say('Beleza! Vem comigo, vou te levar ao **andar dos clientes**. É lá que o seu projeto vai acontecer.');
  VD.classList.remove('on'); await fade(true); await sleep(900);
  R.path=[]; R.a.position.set(60,0,60); seated.visible=false; S.setFloor(3); const r=ravi3(); r.a.position.set(1.6,0,6.6); r.a.rotation.y=Math.PI; r.yaw=Math.PI;
  S.setView(0,10.2,0,-.05,1.65); await fade(false); r.faceCam=true; r.waveT=2.2; await sleep(900);
  await say('Aqui é o **andar do cliente**. Só quem é cliente entra aqui. Tem a recepção, o espaço de espera e uma sala pra cada projeto.');
  VD.classList.remove('on'); await view(0,6.2,0,-2,1700);
  await say('Olha esse plano que eu preparei pra **'+D.empresa+'**: o **'+D.pacote+'**. Vem, vou te mostrar no computador.');
  VD.classList.remove('on'); S.cliente.drawPC({plano:D.pacote,empresa:D.empresa,itens:PLANO[D.pacote]});
  r.faceCam=false; await new Promise(res=>S.mgrWalk(r,8.5,-.9,(FAST?9:2.2),res)); r.yaw=Math.PI/2;
  await view(11.4,1.5,9.7,-1.4,1700,1.6,-.14);
  await say('Aquele ali é o **agente do computador**. É ele que trabalha com você aqui na estação: você pede, ele faz.');
  await say('Esse é o seu plano na tela. Repara que a gente sempre **começa pela análise gratuita**: eu olho Google, Instagram e site da empresa antes de você decidir qualquer coisa.');
  await say('E depois que fechar, é aqui que a gente trabalha junto: você escreve o que precisa e a IA já começa a montar. Por exemplo, o Instagram da **'+D.empresa+'**.');
  S.cliente.drawPC({user:'Quero criar o Instagram da '+D.empresa});
  await say('Hoje essa parte ainda está em montagem. Quando ficar pronta, você já entra e faz, sem esperar. Vamos marcar a conversa com a equipe?'); }
async function enviar(){ const body=Object.assign({id:'TR'+Math.random().toString(36).slice(2,8),ref:REF,teste:TESTE,origem:'visita3d',criadoEm:new Date().toISOString(),mobile:/Mobi|Android/i.test(navigator.userAgent)},D);
  try{ localStorage.setItem('tourUltimoLead',JSON.stringify(body)); }catch(e){}
  try{ const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.ok; }catch(e){ return false; } }
function fim(ok){ VD.classList.remove('on'); const E=document.createElement('div'); E.id='vend'; E.className='on'; E.innerHTML='<div class="c"><h2>'+(ok?'Obrigado pela visita!':'Até a próxima!')+'</h2><p>'+(ok?'A equipe da NEX vai te chamar no WhatsApp pra marcar a sua conversa.':'Quando quiser, é só voltar e conversar com o Ravi.')+'</p><a class="pri" href="../mundo/index.html?lite=1">Conhecer a Rua NEW em 3D</a><button onclick="location.reload()">Voltar ao início</button></div>'; document.body.appendChild(E); }

/* ---------- início: troca o texto da tela de entrada e espera o clique ---------- */
const box=document.querySelector('#overlay .box'); if(box) box.innerHTML='<h1>VISITA <span>NEW</span></h1><p>Entre na NEW e converse com o <b>Ravi</b>: ele te recebe, mostra o escritório e senta com você numa sala de reunião.</p><p style="font-size:12.5px;opacity:.6">Leva uns 5 minutos. Ative o som para ouvir o Ravi.</p><span class="go">Entrar na NEW</span>';
buildRoom();
const wait=setInterval(()=>{ if(S.entered){ clearInterval(wait); run().catch(e=>console.error('visita',e)); } },200);
window.__visita={D,BOARD};
})();
