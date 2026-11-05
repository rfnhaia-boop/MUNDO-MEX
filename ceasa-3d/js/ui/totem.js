/* TOTEM DO BOX (NEW CEASA): tela em pé na entrada de cada box.
 * Cliente: vê foto/vídeo REAL da fruta com a data (e lote/origem, se o dono informou), disponibilidade e aviso do dia; adiciona na lista ou chama o Beto.
 * Dono (PIN): conversa com o Beto (ele anota preço/chegada/falta e PROPÕE, o dono confirma), sobe foto/vídeo, marca estoque.
 * A frase "foto de X dias atrás" sai SEMPRE do registro (data que o dono informou); sem foto real o totem diz que a imagem é ilustrativa. */
(function(){
'use strict';
const TOTEM_SRC=(document.currentScript&&document.currentScript.src)||location.href;
let cfg=null, el=null, S={box:null,ids:[],cur:null,estado:null,midia:[],tab:'ver',dono:null,hist:[],prop:null,busy:false,sel:0};
const API=()=>cfg.api||'/api/ceasa';
const $=(s,r=el)=>r.querySelector(s);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pt=iso=>{ const [y,m,d]=String(iso).slice(0,10).split('-'); return d+'/'+m; };
function idade(iso){ const d=Math.floor((Date.now()-Date.parse(String(iso).slice(0,10)+'T12:00:00Z'))/864e5);
  if(d<=0) return {t:'hoje',velha:false,d:0}; if(d===1) return {t:'ontem',velha:false,d:1}; if(d<14) return {t:'há '+d+' dias',velha:d>2,d};
  if(d<28) return {t:'há '+Math.floor(d/7)+(Math.floor(d/7)===1?' semana':' semanas'),velha:true,d}; return {t:'há mais de um mês',velha:true,d}; }
const nomeDe=id=>{ const p=cfg.catalogo.find(x=>x.id===id); return p?p.name+(p.var?' '+p.var:''):id; };
const midiasDe=id=>S.midia.filter(m=>m.produto===id);
const getTok=()=>{ try{ return sessionStorage.getItem('ceasa_dono_tok')||''; }catch(e){ return ''; } };
const setTok=t=>{ try{ t?sessionStorage.setItem('ceasa_dono_tok',t):sessionStorage.removeItem('ceasa_dono_tok'); }catch(e){} };
async function api(path,opt={}){ const h=Object.assign({},opt.headers||{}); const t=getTok(); if(t) h['x-dono-token']=t;
  const r=await fetch(API()+path,Object.assign({},opt,{headers:h})); let b=null; try{ b=await r.json(); }catch(e){} if(r.status===401&&t&&path.startsWith('/dono/')){ setTok(''); S.dono=false; } if(!r.ok) throw Object.assign(new Error((b&&b.erro)||('erro '+r.status)),{status:r.status}); return b; }

// estilos em totem.css (carregado por <link> abaixo)


function montaEl(){ if(el) return; if(!document.querySelector('link[data-totem-css]')){ const st=document.createElement('link'); st.rel='stylesheet'; st.href=new URL('../../css/totem.css',TOTEM_SRC).href; st.dataset.totemCss=''; document.head.appendChild(st); } el=document.createElement('div'); el.id='totem'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Totem do box'); document.body.appendChild(el);
  el.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.stopPropagation(); close(); } }); addEventListener('keydown',e=>{ if(el.classList.contains('on')&&e.code==='Escape') close(); },true); }

function selo(m){ const a=idade(m.fotografadoEm), partes=[`<b>${m.tipo==='video'?'🎥 Vídeo':'📸 Foto'} de ${esc(pt(m.fotografadoEm))}</b> · ${esc(a.t)}`];
  if(m.lote) partes.push('Lote <b>'+esc(m.lote)+'</b>'); if(m.origem) partes.push(esc(m.origem)); partes.push('enviada pelo dono');
  const post=String(m.postadoEm||'').slice(0,10); if(post&&post!==String(m.fotografadoEm).slice(0,10)) partes.push('registrada em '+esc(pt(post)));
  return `<div class="selo${a.velha?' velha':''}">${partes.join(' · ')}${a.velha?`<div class="av">⚠ Foto ${a.d>=14?'antiga':'com mais de 2 dias'}: pergunte ao Beto se chegou lote novo.</div>`:''}</div>`; }

function viewHTML(id){
  const ms=midiasDe(id), m=ms[Math.min(S.sel,ms.length-1)];
  if(!m){ const il=cfg.ilustra&&cfg.ilustra(id);
    return `<div class="view ilu">${il?`<img alt="Imagem ilustrativa de ${esc(nomeDe(id))}" src="${esc(il)}">`:'<div style="opacity:.6">sem imagem</div>'}<span class="badge ilu">Ilustrativa</span></div>
    <div class="selo velha"><b>Ainda não temos foto real de ${esc(nomeDe(id))}.</b> A imagem acima é só ilustrativa, não é do lote que está no box. O dono renova as fotos pelo totem.</div>`; }
  const url=API()+'/arquivo/'+m.arquivo;
  const media=m.tipo==='video'?`<video src="${esc(url)}" controls playsinline preload="metadata" aria-label="Vídeo de ${esc(nomeDe(id))}"></video>`:`<img alt="Foto real de ${esc(nomeDe(id))}" src="${esc(url)}">`;
  const th=ms.length>1?`<div class="thumbs">${ms.slice(0,8).map((x,i)=>`<button data-i="${i}" class="${i===S.sel?'on':''}" aria-label="Foto ${i+1}">${x.tipo==='video'?'<span>▶</span>':`<img alt="" src="${esc(API()+'/arquivo/'+x.arquivo)}">`}</button>`).join('')}</div>`:'';
  if(m.demo) return `<div class="view">${media}<span class="badge ilu">Demonstração</span></div><div class="selo velha"><b>Imagem de demonstração.</b> Não é foto do lote que está no box: serve só para mostrar como o totem fica. O dono envia as fotos reais pelo modo dono.</div>${th}`;
  return `<div class="view">${media}<span class="badge real">Real</span></div>${selo(m)}${th}`; }

function estHTML(id){ const p=(S.estado&&S.estado.produtos&&S.estado.produtos[id])||{}, t=[];
  if(p.disponivel===false) t.push('<span class="tag no">Em falta hoje</span>'); else if(p.disponivel===true) t.push('<span class="tag ok">Disponível</span>');
  if(p.chegouEm){ const a=idade(p.chegouEm); t.push(`<span class="tag ok">Chegou ${esc(a.t)}</span>`); } if(p.nota) t.push(`<span class="tag">${esc(p.nota)}</span>`);
  return t.length?`<div class="est">${t.join('')}</div>`:''; }

const grupoAtual=()=>S.grupos&&(S.grupos.find(g=>g.ids.includes(S.cur))||S.grupos[0]);
function chipsHTML(){
  const gr=S.grupos?`<div class="chips gr">${S.grupos.map(g=>`<button class="chip${g===grupoAtual()?' on':''}" style="--tc:${esc(g.cor||'#8b5cf6')}" data-g="${g.num}">Box ${String(g.num).padStart(2,'0')} · ${esc(g.nome)}</button>`).join('')}</div>`:'';
  const lista=S.grupos?grupoAtual().ids.filter(id=>S.ids.includes(id)):S.ids;
  return gr+`<div class="chips">${lista.map(id=>{ const p=(S.estado&&S.estado.produtos&&S.estado.produtos[id])||{}, f=midiasDe(id)[0], novo=p.chegouEm&&idade(p.chegouEm).d<=2;
  return `<button class="chip${id===S.cur?' on':''}" data-id="${esc(id)}">${esc(nomeDe(id))}${p.disponivel===false?' <i>⛔</i>':novo?' <i>🆕</i>':''}${f?' <i>📷</i>':''}</button>`; }).join('')}</div>`; }

function render(){
  if(!el) return; el.style.setProperty('--tc',(S.grupos?grupoAtual().cor:S.box.cor)||'#8b5cf6');
  const head=`<div class="th"><div><div class="tbox">${S.grupos?'Totem · Entrada':'Totem · Box '+String(S.box.num).padStart(2,'0')}</div><div class="tnome">${esc(S.grupos?'Pavilhão completo':S.box.nome)}</div></div><button class="tx" aria-label="Fechar totem">✕</button></div>`;
  let body='', foot='';
  if(S.tab==='ver'){
    const av=S.estado&&S.estado.aviso?`<div class="aviso">📢 ${esc(S.estado.aviso)}</div>`:'';
    const p=(S.estado&&S.estado.produtos&&S.estado.produtos[S.cur])||{};
    body=av+chipsHTML()+viewHTML(S.cur)+estHTML(S.cur)+`<div class="btns"><button class="btn pri" data-a="add" ${p.disponivel===false?'disabled':''}>${p.disponivel===false?'Em falta hoje':'Adicionar à lista'}</button><button class="btn" data-a="beto">Falar com o Beto</button></div>`;
    foot=`<div class="tf"><span>Fotos reais, com data informada pelo dono</span><button data-a="dono">${S.dono?'Modo dono':'Sou o dono'}</button></div>`;
  } else { body=donoHTML(); foot=`<div class="tf"><span>Modo dono · só você vê isto</span><span><button data-a="voltar">← Voltar ao totem</button> · <button data-a="sair">Sair</button></span></div>`; }
  el.innerHTML=head+`<div class="tb">${body}</div>`+foot; liga(); }

function donoHTML(){
  if(!S.dono) return `<h3 style="margin:0 0 8px">Entrar como dono</h3><p style="margin:0 0 10px;color:#bdb4d6">Digite o PIN para conversar com o Beto, enviar fotos e atualizar o estoque.</p><label for="tpin">PIN</label><input id="tpin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN do dono"><div class="msg" id="tmsg"></div><div class="btns"><button class="btn pri" data-a="login">Entrar</button></div>`;
  const sub=S.sub||'beto';
  const abas=`<div class="tabs"><button class="tab${sub==='beto'?' on':''}" data-s="beto">💬 Beto</button><button class="tab${sub==='fotos'?' on':''}" data-s="fotos">📷 Fotos</button><button class="tab${sub==='estoque'?' on':''}" data-s="estoque">📦 Estoque</button></div>`;
  const faltam=S.ids.filter(id=>{ const f=midiasDe(id).find(x=>!x.demo); return !f||idade(f.fotografadoEm).d>2; });
  if(sub==='beto'){
    const msgs=S.hist.length?S.hist:[{role:'bot',content:'Fala, Matheus! Me conta o que chegou, o preço ou o que faltou que eu anoto.'+(faltam.length?`\nAliás: ${faltam.slice(0,4).map(nomeDe).join(', ')}${faltam.length>4?'…':''} ${faltam.length>1?'estão':'está'} sem foto de hoje ou de ontem.`:'')}];
    const prop=S.prop&&S.prop.length?`<div class="prop"><b>Posso anotar assim?</b><ul>${S.prop.map(p=>`<li>${esc(descProp(p))}</li>`).join('')}</ul><div class="btns"><button class="btn pri" data-a="aplicar">Confirmar</button><button class="btn" data-a="descartar">Descartar</button></div></div>`:'';
    return abas+`<div class="chat">${msgs.map(m=>`<div class="m ${m.role==='user'?'d':'b'}">${esc(m.content)}</div>`).join('')}${S.busy?'<div class="m b">…</div>':''}</div>${prop}<div class="quick">${['Chegou banana prata hoje','Acabou o limão','Aviso: entrega amanhã cedo'].map(q=>`<button data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div><div class="row"><input id="tdin" placeholder="Fale com o Beto… ex: comprei laranja a 62 a caixa" maxlength="500"><button class="btn pri" style="flex:0 0 84px" data-a="enviar">Enviar</button></div><div class="msg" id="tmsg"></div>`;
  }
  if(sub==='fotos'){
    const hoje=new Date().toISOString().slice(0,10), lista=midiasDe(S.cur);
    return abas+(faltam.length?`<div class="aviso">📷 Sem foto recente: ${faltam.map(nomeDe).join(', ')}</div>`:'')+`<label for="tprod">Produto</label><select id="tprod">${S.ids.map(id=>`<option value="${esc(id)}"${id===S.cur?' selected':''}>${esc(nomeDe(id))}</option>`).join('')}</select>
    <label for="tfile">Foto ou vídeo (mp4)</label><input id="tfile" type="file" accept="image/jpeg,image/png,image/webp,video/mp4" capture="environment">
    <div class="row"><div><label for="tlote">Lote (opcional)</label><input id="tlote" maxlength="40" placeholder="ex: L-0412"></div><div><label for="tdata">Data da foto</label><input id="tdata" type="date" value="${hoje}" max="${hoje}"></div></div>
    <label for="torig">Origem (opcional)</label><input id="torig" maxlength="60" placeholder="ex: Bom Jesus da Lapa · BA">
    <div class="msg" id="tmsg"></div><div class="btns"><button class="btn pri" data-a="subir">Enviar foto</button></div>
    <div class="lst"><b>Já enviadas de ${esc(nomeDe(S.cur))}</b>${lista.length?lista.map(m=>`<div class="it">${m.tipo==='video'?'<span style="font-size:24px">🎥</span>':`<img alt="" src="${esc(API()+'/arquivo/'+m.arquivo)}">`}<div class="g">${esc(pt(m.fotografadoEm))} · ${esc(idade(m.fotografadoEm).t)}${m.lote?' · '+esc(m.lote):''}</div><button class="del" data-del="${esc(m.id)}">Apagar</button></div>`).join(''):'<div style="opacity:.6;margin-top:6px">Nenhuma ainda.</div>'}</div>`;
  }
  return abas+`<div class="lst">${S.ids.map(id=>{ const p=(S.estadoDono&&S.estadoDono.produtos&&S.estadoDono.produtos[id])||{};
    return `<div class="it"><div class="g"><b>${esc(nomeDe(id))}</b><br><span style="opacity:.7">${p.disponivel===false?'Em falta':p.disponivel===true?'Disponível':'sem marcação'}${p.precoCaixa?' · venda R$ '+esc(p.precoCaixa):''}${p.custoCaixa?' · custo R$ '+esc(p.custoCaixa):''}${p.chegouEm?' · chegou '+esc(pt(p.chegouEm)):''}</span></div><button class="del" style="border-color:rgba(134,239,172,.5);color:#86efac" data-ch="${esc(id)}">Chegou hoje</button><button class="del" data-fa="${esc(id)}">${p.disponivel===false?'Voltou':'Em falta'}</button></div>`; }).join('')}<p style="opacity:.65;font-size:12px;margin-top:10px">O custo é privado: os clientes nunca veem. Para anotar preços e custos é mais rápido falar com o Beto.</p></div>`;
}
const descProp=p=>({preco:`${nomeDe(p.id)}: preço de venda R$ ${p.valor}`,custo:`${nomeDe(p.id)}: você pagou R$ ${p.valor} (privado)`,disponivel:`${nomeDe(p.id)}: ${p.valor?'disponível':'em falta'}`,chegada:`${nomeDe(p.id)}: chegou hoje`,nota:`${nomeDe(p.id)}: nota "${p.texto}"`,aviso:`Aviso do dia: "${p.texto}"`}[p.tipo]||p.tipo);

function liga(){
  $('.tx').onclick=close;
  el.querySelectorAll('.chip[data-id]').forEach(b=>b.onclick=()=>{ S.cur=b.dataset.id; S.sel=0; render(); });
  el.querySelectorAll('.chip[data-g]').forEach(b=>b.onclick=()=>{ const g=S.grupos.find(x=>String(x.num)===b.dataset.g); if(g){ S.cur=g.ids.find(id=>S.ids.includes(id))||S.cur; S.sel=0; render(); } });
  el.querySelectorAll('.thumbs button').forEach(b=>b.onclick=()=>{ S.sel=+b.dataset.i; render(); });
  el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{ S.sub=b.dataset.s; if(S.sub==='estoque') carregaDono(); render(); });
  el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ const i=$('#tdin'); if(i){ i.value=b.dataset.q; i.focus(); } });
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ if(!confirm('Apagar esta foto?')) return; try{ await api('/dono/midia/'+b.dataset.del,{method:'DELETE'}); await recarrega(); render(); }catch(e){ msg(e.message); } });
  el.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>marca([{tipo:'chegada',id:b.dataset.ch}]));
  el.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>{ const p=(S.estadoDono&&S.estadoDono.produtos&&S.estadoDono.produtos[b.dataset.fa])||{}; marca([{tipo:'disponivel',id:b.dataset.fa,valor:p.disponivel===false}]); });
  const ps=$('#tprod'); if(ps) ps.onchange=()=>{ S.cur=ps.value; S.sel=0; render(); };
  const tp=$('#tpin'); if(tp){ tp.focus(); tp.onkeydown=e=>{ if(e.key==='Enter') acao('login'); }; }
  const td=$('#tdin'); if(td){ td.focus(); td.onkeydown=e=>{ if(e.key==='Enter') acao('enviar'); }; const c=$('.chat'); if(c) c.lastElementChild&&c.lastElementChild.scrollIntoView({block:'end'}); }
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>acao(b.dataset.a));
}
const msg=(t,ok)=>{ const m=$('#tmsg'); if(m){ m.textContent=t||''; m.className='msg'+(ok?' ok':''); } };
async function recarrega(){ try{ const e=await api('/estado'); S.estado=e; S.midia=e.midia||[]; }catch(e){} }
async function carregaDono(){ try{ S.estadoDono=await api('/dono/estado'); render(); }catch(e){} }
async function marca(props){ try{ await api('/dono/aplicar',{method:'POST',body:JSON.stringify({propostas:props})}); await recarrega(); await carregaDono(); }catch(e){ msg(e.message); } }

async function acao(a){
  if(a==='add'){ cfg.onAdd&&cfg.onAdd(S.cur); const b=$('[data-a="add"]'); if(b){ b.textContent='✓ Adicionado'; setTimeout(()=>{ try{ render(); }catch(e){} },900); } return; }
  if(a==='beto'){ close(); cfg.onChat&&cfg.onChat(); return; }
  if(a==='dono'){ S.tab='dono'; if(S.dono) carregaDono(); render(); return; }
  if(a==='voltar'){ S.tab='ver'; render(); return; }
  if(a==='sair'){ setTok(''); S.dono=false; S.tab='ver'; S.hist=[]; S.prop=null; render(); return; }
  if(a==='login'){ const pin=($('#tpin')||{}).value||''; if(!pin) return msg('Digite o PIN.'); msg('Entrando…');
    try{ const r=await api('/dono/login',{method:'POST',body:JSON.stringify({pin})}); setTok(r.token); S.dono=true; S.sub='beto'; render(); carregaDono(); }catch(e){ msg(e.message); } return; }
  if(a==='enviar'){ const i=$('#tdin'); const t=i&&i.value.trim(); if(!t||S.busy) return; S.hist.push({role:'user',content:t}); S.busy=true; S.prop=null; render();
    try{ const r=await api('/dono/beto',{method:'POST',body:JSON.stringify({mensagem:t,historico:S.hist.slice(-10),catalogo:cfg.catalogo.map(p=>({id:p.id,nome:p.name,variante:p.var}))})});
      S.hist.push({role:'bot',content:r.reply||'Não entendi, pode repetir?'}); S.prop=r.propostas||[]; }
    catch(e){ S.hist.push({role:'bot',content:e.status===501?'Meu cérebro de IA está desligado no servidor (falta a chave). Enquanto isso use as abas Fotos e Estoque.':'Travei aqui: '+e.message}); }
    S.busy=false; render(); return; }
  if(a==='aplicar'){ try{ const r=await api('/dono/aplicar',{method:'POST',body:JSON.stringify({propostas:S.prop})}); S.hist.push({role:'bot',content:'Anotado ✓ '+(r.feitas||[]).join(' · ')}); S.prop=null; await recarrega(); await carregaDono(); }catch(e){ S.hist.push({role:'bot',content:'Não consegui gravar: '+e.message}); } render(); return; }
  if(a==='descartar'){ S.prop=null; S.hist.push({role:'bot',content:'Beleza, não anotei nada. O que corrijo?'}); render(); return; }
  if(a==='subir'){ const f=($('#tfile')||{}).files&&$('#tfile').files[0]; if(!f) return msg('Escolha a foto ou o vídeo.'); if(f.size>40*1024*1024) return msg('Arquivo maior que 40 MB.');
    msg('Enviando…',true); const b=$('[data-a="subir"]'); if(b) b.disabled=true;
    try{ const h={'x-produto':$('#tprod').value,'x-lote':encodeURIComponent($('#tlote').value||''),'x-origem':encodeURIComponent($('#torig').value||''),'x-fotografado-em':$('#tdata').value||''};
      const r=await api('/dono/midia',{method:'POST',headers:h,body:f}); S.cur=r.midia.produto; S.sel=0; await recarrega(); render(); msg('Enviada ✓ já aparece pros clientes.',true); }
    catch(e){ msg(e.message); if(b) b.disabled=false; } return; }
}

async function open(box){ montaEl(); S.box=box; S.grupos=box.grupos||null; S.ids=box.ids.filter(id=>cfg.catalogo.some(p=>p.id===id)); S.cur=box.atual&&S.ids.includes(box.atual)?box.atual:S.ids[0]; S.sel=0; S.tab='ver'; S.sub='beto'; S.prop=null; S.dono=!!getTok();
  cfg.lock&&cfg.lock(true); el.classList.add('on'); render(); await recarrega(); if(S.dono){ api('/dono/status').then(r=>{ if(!r.logado){ setTok(''); S.dono=false; } render(); }).catch(()=>{}); } render(); const x=$('.tx'); if(x) x.focus(); }
function close(){ if(!el||!el.classList.contains('on')) return; el.classList.remove('on'); el.querySelectorAll('video').forEach(v=>v.pause()); cfg.lock&&cfg.lock(false); }
window.NewTotem={ init:c=>{ cfg=Object.assign({api:'/api/ceasa',catalogo:[]},c); }, open, close, isOpen:()=>!!el&&el.classList.contains('on') };
})();
