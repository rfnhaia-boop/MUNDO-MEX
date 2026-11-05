'use strict';
/* TELÃO DA ENTRADA
 * Tela grande que mostra a fruta de que o Beto está falando (foto real quando existe, ilustrativa quando não).
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ===== TELÃO DA ENTRADA: em pé, sobre dois pés, logo atrás do lugar onde o Beto espera o cliente (Beto em x=2,1 z=13,8).
   Mostra a fruta de que o Beto está falando, com foto/vídeo REAL quando o dono enviou (data, lote, origem) e, enquanto não há foto real,
   a imagem ILUSTRATIVA da caixa com origem e características. Ninguém precisa andar pelos 8 boxes. ===== */
let telao=null;
(function(){
  const W=1280,H=720, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  const snap=document.createElement('canvas'); snap.width=W; snap.height=H; const sg=snap.getContext('2d');
  const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
  // posição: atrás e à direita do Beto, virado para quem entra (câmera inicial em 0,16.5)
  const SX=3.2, SZ=11.0, ROT=-0.53, SW=3.0, SH=SW*H/W, CY=2.1, grp=new THREE.Group(); grp.position.set(SX,0,SZ); grp.rotation.y=ROT; scene.add(grp);
  const body=M({color:'#15121d',metalness:.5,roughness:.35}), led=M({color:'#8b5cf6',emissive:'#8b5cf6',emissiveIntensity:1});
  addBox(grp,SW+.24,SH+.24,.14,body,0,CY,-.03);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(SW,SH),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); scr.position.set(0,CY,.05); grp.add(scr);
  addBox(grp,SW+.24,.05,.16,led,0,CY+SH/2+.14,-.03); addBox(grp,SW+.24,.05,.16,led,0,CY-SH/2-.14,-.03);
  for(const dx of [-SW/2+.35,SW/2-.35]){ addBox(grp,.14,CY-SH/2-.12,.14,body,dx,(CY-SH/2-.12)/2,-.05); addBox(grp,.55,.06,.55,metalDark,dx,.03,-.05); }   // os dois pés
  const pm=new THREE.Mesh(new THREE.BoxGeometry(SW+.3,SH+.3,.7),new THREE.MeshBasicMaterial({visible:false})); pm.position.set(0,CY,0); pm.userData={telao:true,h:SH}; grp.add(pm);
  { const c=Math.cos(ROT), s=Math.sin(ROT), hw=SW/2; for(const k of [-1,-.33,.33,1]){ const x=SX+k*hw*c, z=SZ-k*hw*s; col(x-.3,x+.3,z-.3,z+.3); } }   // colisão ao longo da tela inclinada
  const luz=new THREE.PointLight('#c4b5fd',.7,6,2); luz.position.set(0,CY,1.2); grp.add(luz);

  let slides=[], fslides=[], lista=slides, idx=0, hold=7, fade=1, focoAte=0, estado=null, vid=null; const imgs={}, nomeP=id=>P[id].name+' '+P[id].var;
  const dias=iso=>Math.floor((Date.now()-Date.parse(String(iso).slice(0,10)+'T12:00:00Z'))/864e5);
  const quando=iso=>{ const d=dias(iso); return d<=0?'hoje':d===1?'ontem':d<14?'há '+d+' dias':d<28?'há '+Math.floor(d/7)+' semanas':'há mais de um mês'; };
  const dm=iso=>{ const [,m,d]=String(iso).slice(0,10).split('-'); return d+'/'+m; };
  const reais=()=>{ const melhor={}; for(const m of ((estado&&estado.midia)||[])){ if(m.demo||!P[m.produto]) continue; const a=melhor[m.produto]; if(!a||String(m.fotografadoEm)>String(a.fotografadoEm)) melhor[m.produto]=m; } return melhor; };
  const sl=(id,mr)=>({id,m:(mr||reais())[id]||null});
  function monta(){
    const mr=reais(), ordem=Object.values(BOXES).flatMap(b=>b.ids).filter(id=>P[id]&&!P[id].empty);
    const comReal=Object.values(mr).sort((a,b)=>String(b.fotografadoEm).localeCompare(String(a.fotografadoEm))).map(m=>sl(m.produto,mr));
    slides=[...comReal,...ordem.filter(id=>!mr[id]).map(id=>sl(id,mr))];   // fotos reais primeiro; os demais com a imagem ilustrativa
    if(lista!==fslides) lista=slides; idx=Math.min(idx,lista.length-1);
  }
  function carrega(s){ if(!s.m||s.m.tipo!=='foto') return null; const k=s.m.arquivo; if(!imgs[k]){ const im=new Image(); im.onload=()=>{ imgs[k].ok=true; if(lista[idx]&&lista[idx].m&&lista[idx].m.arquivo===k) compoe(true); }; im.src='/api/ceasa/arquivo/'+k; imgs[k]={im,ok:false}; } return imgs[k]; }
  function video(s){ if(!s.m||s.m.tipo!=='video') return null; if(!vid||vid.dataset.k!==s.m.arquivo){ if(vid){ vid.pause(); vid.removeAttribute('src'); vid.load(); } vid=document.createElement('video'); vid.dataset.k=s.m.arquivo; vid.muted=true; vid.loop=true; vid.playsInline=true; vid.src='/api/ceasa/arquivo/'+s.m.arquivo; vid.play().catch(()=>{}); } return vid; }
  const cover=(src,w,h)=>{ const k=Math.max(W/w,H/h), iw=w*k, ih=h*k; g.drawImage(src,(W-iw)/2,(H-ih)/2,iw,ih); };
  function quebra(txt,x,y,maxW,lh,maxL){ const ps=String(txt||'').split(' '); let ln='',n=0; for(const w of ps){ const t=ln?ln+' '+w:w; if(g.measureText(t).width>maxW&&ln){ g.fillText(ln,x,y+n*lh); n++; ln=w; if(n>=maxL) return; } else ln=t; } if(ln&&n<maxL) g.fillText(ln,x,y+n*lh); }
  function img(key,url){ if(!imgs[key]){ const im=new Image(); im.onload=()=>{ imgs[key].ok=true; compoe(true); }; im.src=url; imgs[key]={im,ok:false}; } return imgs[key]; }
  function etiquetas(s,cor,foco){
    g.textBaseline='middle'; g.textAlign='left';
    const bn=BOX_BY_ID.get(s.id), rot='BOX '+String(bn||0).padStart(2,'0')+' · '+(BOXES[bn]?BOXES[bn].nome.toUpperCase():''); g.font='800 30px "Segoe UI",system-ui'; const tw=g.measureText(rot).width;
    g.fillStyle='rgba(12,10,20,.72)'; g.beginPath(); g.roundRect(44,34,tw+44,58,29); g.fill(); g.fillStyle=cor; g.beginPath(); g.arc(70,63,8,0,7); g.fill(); g.fillStyle='#fff'; g.fillText(rot,92,64);
    const m=s.m, real=!!m, tag=real?(m.tipo==='video'?'VÍDEO REAL':'FOTO REAL'):'ILUSTRATIVA', tc=real?'#4ade80':'#fbbf24';
    g.font='800 26px "Segoe UI",system-ui'; const bw=g.measureText(tag).width+40; g.fillStyle='rgba(12,10,20,.78)'; g.beginPath(); g.roundRect(W-44-bw,34,bw,52,26); g.fill(); g.strokeStyle=tc; g.lineWidth=2.5; g.stroke(); g.fillStyle=tc; g.textAlign='center'; g.fillText(tag,W-44-bw/2,61); g.textAlign='left';
    const n=lista.length; if(n>1&&n<=24){ const dw=Math.min(18,300/n); for(let i=0;i<n;i++){ g.fillStyle=i===idx?'#fff':'rgba(255,255,255,.3)'; g.beginPath(); g.roundRect(W-52-(n-i)*(dw+6),H-44,dw,8,4); g.fill(); } }
    g.textAlign='right'; g.font='700 24px "Segoe UI",system-ui'; g.fillStyle=foco?cor:'rgba(255,255,255,.75)'; g.fillText(foco?'● o Beto está mostrando':'E · ver todas as fotos',W-48,H-76); g.textAlign='left';
    const pe=estado&&estado.produtos&&estado.produtos[s.id];
    if(pe&&pe.disponivel===false){ g.fillStyle='#f87171'; g.font='800 30px "Segoe UI",system-ui'; g.fillText('EM FALTA HOJE',52,H-46); } else if(pe&&pe.chegouEm&&dias(pe.chegouEm)<=2){ g.fillStyle='#4ade80'; g.font='800 30px "Segoe UI",system-ui'; g.fillText('CHEGOU '+quando(pe.chegouEm).toUpperCase(),52,H-46); }
    if(estado&&estado.aviso){ g.fillStyle='rgba(250,204,21,.94)'; g.beginPath(); g.roundRect(44,H-312,Math.min(W-88,50+estado.aviso.length*15),50,25); g.fill(); g.fillStyle='#2a2000'; g.font='800 26px "Segoe UI",system-ui'; g.fillText('📢 '+estado.aviso,66,H-287); }
  }
  function paint(s){
    const p=P[s.id], bn=BOX_BY_ID.get(s.id), cor=TOTEM_COR[bn]||'#8b5cf6', m=s.m, foco=lista===fslides&&Date.now()<focoAte; g.globalAlpha=1;
    g.fillStyle='#0b0912'; g.fillRect(0,0,W,H);
    if(m){   // foto/vídeo REAL em tela cheia
      let ok=false; if(m.tipo==='foto'){ const r=carrega(s); if(r&&r.ok){ cover(r.im,r.im.naturalWidth,r.im.naturalHeight); ok=true; } } else { const v=video(s); if(v&&v.readyState>=2){ cover(v,v.videoWidth,v.videoHeight); ok=true; } }
      const sh=g.createLinearGradient(0,H*.45,0,H); sh.addColorStop(0,'rgba(8,6,14,0)'); sh.addColorStop(1,'rgba(8,6,14,.94)'); g.fillStyle=sh; g.fillRect(0,H*.45,W,H*.55);
      const st=g.createLinearGradient(0,0,0,H*.2); st.addColorStop(0,'rgba(8,6,14,.7)'); st.addColorStop(1,'rgba(8,6,14,0)'); g.fillStyle=st; g.fillRect(0,0,W,H*.2);
      g.fillStyle=cor; g.fillRect(0,0,12,H); g.textBaseline='middle'; g.textAlign='left';
      g.fillStyle='#fff'; g.font='800 78px "Segoe UI",system-ui'; g.fillText(nomeP(s.id),52,H-176);
      g.font='600 32px "Segoe UI",system-ui'; g.fillStyle='rgba(255,255,255,.92)';
      g.fillText(`${m.tipo==='video'?'Vídeo':'Foto'} de ${dm(m.fotografadoEm)} · ${quando(m.fotografadoEm)}${m.lote?' · Lote '+m.lote:''}${m.origem?' · '+m.origem:''}`,52,H-108);
      if(dias(m.fotografadoEm)>2){ g.fillStyle='#fdba74'; g.font='700 28px "Segoe UI",system-ui'; g.fillText('⚠ foto com mais de 2 dias',52,H-70); }
    } else {   // sem foto real ainda: a caixa em destaque + o que se sabe do produto
      const gr=g.createRadialGradient(W*.72,H*.5,40,W*.72,H*.5,W*.6); gr.addColorStop(0,cor+'77'); gr.addColorStop(.6,cor+'1f'); gr.addColorStop(1,'#0b0912'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      g.fillStyle=cor; g.fillRect(0,0,12,H);
      let u=null; try{ u=fotoOf(s.id); }catch(e){} const r=u&&img('il'+s.id,u); if(r&&r.ok){ const sz=H*.98; g.save(); g.shadowColor='rgba(0,0,0,.55)'; g.shadowBlur=40; g.drawImage(r.im,W*.72-sz/2,H*.5-sz/2+10,sz,sz); g.restore(); }
      g.textBaseline='middle'; g.textAlign='left'; g.fillStyle='#fff'; g.font='800 84px "Segoe UI",system-ui'; g.fillText(P[s.id].name,52,215); g.fillStyle=cor; g.font='800 52px "Segoe UI",system-ui'; g.fillText(P[s.id].var,52,285);
      g.font='700 30px "Segoe UI",system-ui'; let x=52; for(const c of [p.kg?String(p.kg).replace('.',',')+' kg':null,PACKNAME[p.pack],p.org].filter(Boolean)){ const w=g.measureText(c).width+34; if(x+w>W*.58) break; g.fillStyle='rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(x,330,w,50,25); g.fill(); g.fillStyle='#fff'; g.fillText(c,x+17,356); x+=w+10; }
      g.fillStyle='rgba(255,255,255,.82)'; g.font='500 32px "Segoe UI",system-ui'; quebra(p.note,52,432,W*.5,44,4);
      g.fillStyle='rgba(255,255,255,.55)'; g.font='600 26px "Segoe UI",system-ui'; g.fillText('Ainda sem foto real: imagem ilustrativa da caixa.',52,H-110);
    }
    etiquetas(s,cor,foco);
  }
  function compoe(sem){ const s=lista[idx]; if(!s) return; if(fade<1&&!sem){ g.globalAlpha=1; g.drawImage(snap,0,0); g.globalAlpha=fade; paint(s); g.globalAlpha=1; } else paint(s); tex.needsUpdate=true; }
  function vai(i,seg){ sg.drawImage(cv,0,0); idx=(i+lista.length)%lista.length; fade=0; hold=seg||7; compoe(); }
  async function recarrega(){ try{ const r=await fetch('/api/ceasa/estado',{cache:'no-store'}); if(r.ok){ estado=await r.json(); const atual=lista[idx]&&lista[idx].id; monta(); const j=lista.findIndex(s=>s.id===atual); if(j>=0) idx=j; compoe(true); } }catch(e){} }
  monta(); compoe(true); recarrega(); setInterval(recarrega,60000);
  telao={
    pick:pm,
    update(dt){
      if(lista===fslides&&Date.now()>focoAte){ lista=slides; idx=0; vai(0); }   // acabou o destaque da conversa: volta a passar o pavilhão
      if(!lista.length) return; if(fade<1){ fade=Math.min(1,fade+dt/.6); compoe(); }
      const s=lista[idx]; if(s&&s.m&&s.m.tipo==='video'){ if(vid&&vid.readyState>=2) compoe(true); } else if(lista.length>1&&!(window.NewTotem&&NewTotem.isOpen())){ hold-=dt; if(hold<=0) vai(idx+1); }
    },
    // o Beto está falando de um ou mais produtos: o telão mostra eles (por ~35 s), depois volta ao normal
    foco(ids){ const mr=reais(), vis=[...new Set((Array.isArray(ids)?ids:[ids]).filter(id=>P[id]&&!P[id].empty))].slice(0,6); if(!vis.length) return;
      fslides=vis.map(id=>sl(id,mr)); lista=fslides; focoAte=Date.now()+35000; vai(0,fslides.length>1?7:35); },
    mostra(id){ this.foco([id]); },
    atualId(){ return lista[idx]&&lista[idx].id; },
  };
})();
