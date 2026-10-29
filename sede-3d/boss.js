/* RAVI CHEFE da Sede: bom dia, meta, plano do dia, fila de tarefas com aprovação e "Pausar tudo".
   Arquivo SEPARADO de propósito (não depende do resto da Sede; só usa window.__SEDE.brain e window.__SEDE.setModal).
   Estado compartilhado: Ativos/sede-3d/data/estado.json (via server.mjs). O executor (Claude) lê e escreve o MESMO arquivo.
   Regras: tarefa que PUBLICA ou ENVIA nasce "pendente" e só roda depois do OK do chefe; "pausa:true" congela o executor. */
(function(){
const S=window.__SEDE; if(!S||!S.brain) { console.warn('boss.js: window.__SEDE ausente'); return; }
const KEY='nexBoss';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const uid=p=>p+Math.random().toString(36).slice(2,8);
const DONOS={ravi:'Ravi',prospeccao:'Prospecção',conteudo:'Conteúdo',vendas:'Vendas',criacao:'Criação'};
const TIPOS={ler:'ler/pesquisar',preparar:'preparar (rascunho)',publicar:'publicar',enviar:'enviar mensagem'};
const CANAIS={email:'e-mail',instagram:'Instagram',whatsapp:'WhatsApp'};
let B={v:0,tarefas:[],pausa:false,meta:null,log:[],alvo:null,reunioes:[]};
try{ const m=JSON.parse(localStorage.getItem(KEY)||'null'); if(m&&Array.isArray(m.tarefas)) B=Object.assign(B,m); }catch(e){}
let pushT=null, panelOpen=false;
const toast=t=>{ let e=$('bpToast'); if(!e){ e=document.createElement('div'); e.id='bpToast'; e.style.cssText='position:fixed;top:84px;left:50%;transform:translateX(-50%);z-index:30;padding:9px 16px;border-radius:99px;background:rgba(28,20,48,.96);border:1px solid rgba(255,255,255,.18);color:#fff;font:600 13.5px "Segoe UI",system-ui;opacity:0;transition:.25s;pointer-events:none'; document.body.appendChild(e); } e.textContent=t; e.style.opacity=1; clearTimeout(e._t); e._t=setTimeout(()=>e.style.opacity=0,2600); };
const save=()=>{ B.v=Date.now(); try{ localStorage.setItem(KEY,JSON.stringify(B)); }catch(e){} clearTimeout(pushT); pushT=setTimeout(push,350); };
const OK=()=>{ try{ return localStorage.getItem('nexOwnerKey')||''; }catch(e){ return ''; } };
async function push(){ try{ await fetch('/api/sede/estado',{method:'PUT',headers:{'Content-Type':'application/json','x-owner-key':OK()},body:JSON.stringify(B)}); }catch(e){} }
async function pull(first){ try{ const r=await fetch('/api/sede/estado',{cache:'no-store',headers:{'x-owner-key':OK()}}); if(!r.ok) return; const j=await r.json(); if(!j||!Array.isArray(j.tarefas)){ if(first&&(B.tarefas.length||B.meta)) push(); return; }
    if((j.v||0)>(B.v||0)){ B=Object.assign(B,j); try{ localStorage.setItem(KEY,JSON.stringify(B)); }catch(e){} hud(); if(panelOpen) render(); } else if((j.v||0)<(B.v||0)) push(); }catch(e){} }
const logEv=txt=>{ B.log.push({t:Date.now(),txt}); if(B.log.length>200) B.log.shift(); };
const ago=t=>{ const m=Math.round((Date.now()-t)/60000); return m<1?'agora há pouco':m<60?'há '+m+' min':m<1440?'há '+Math.round(m/60)+' h':'há '+Math.round(m/1440)+' d'; };
const pend=()=>B.tarefas.filter(t=>t.status==='pendente'), fila=()=>B.tarefas.filter(t=>t.status==='aprovada');
const hoje0=()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); };
const reunioesHoje=()=>(B.reunioes||[]).filter(r=>r.t>=hoje0()).length;
function addTarefa(t){ const tipo=t.tipo||'preparar', auto=(tipo==='ler'||tipo==='preparar'); const x={id:uid('T'),titulo:t.titulo,detalhe:t.detalhe||'',dono:t.dono||'ravi',tipo,status:auto?'aprovada':'pendente',criadoEm:Date.now(),feitoEm:null,resultado:''}; B.tarefas.push(x); logEv('Tarefa criada: '+x.titulo+(auto?'':' (aguarda seu OK)')); save(); hud(); return x; }
function decidir(id,ok){ const x=B.tarefas.find(q=>q.id===id); if(!x) return; x.status=ok?'aprovada':'recusada'; logEv((ok?'Você aprovou: ':'Você recusou: ')+x.titulo); save(); hud(); }
function setPausa(on){ B.pausa=!!on; logEv(on?'PAUSA geral ligada pelo chefe':'Operação retomada pelo chefe'); save(); hud(); }
function plano(){ const a=B.alvo; if(!a) return null; const dia=new Date().toLocaleDateString('pt-BR'); return [
  {titulo:'Garimpar empresas novas de "'+a.nicho+'" em '+a.cidade,detalhe:'Google Maps pelo Chrome, ritmo humano. Priorizar quem NÃO tem site e tem muitas avaliações. Salvar a lista em data/leads-*.txt.',dono:'prospeccao',tipo:'ler'},
  {titulo:'Preparar abordagens dos 10 leads mais quentes ('+(CANAIS[a.canal]||a.canal)+')',detalhe:'Texto curto e humano, personalizado. Deixar como rascunho.',dono:'vendas',tipo:'preparar'},
  {titulo:'Enviar o lote de 10 abordagens ('+(CANAIS[a.canal]||a.canal)+')',detalhe:'Só depois do OK do chefe. Sem disparo em massa.',dono:'vendas',tipo:'enviar'},
  {titulo:'Ver respostas e atualizar quem respondeu',detalhe:'Marcar quem respondeu, quem pediu análise e quem descartou.',dono:'vendas',tipo:'ler'},
  {titulo:'Escrever 3 ideias de post/Reels do dia com legenda',detalhe:'Tom NEX (preto e laranja) para atrair empreendedores de '+a.nicho+'.',dono:'conteudo',tipo:'preparar'},
  {titulo:'Relatório do dia '+dia,detalhe:'Números do funil, o que funcionou, o que ajustar amanhã.',dono:'ravi',tipo:'preparar'}].map(addTarefa); }
function queueProspect(nicho,cidade,canal){ B.alvo={nicho,cidade,canal:canal||'whatsapp'}; addTarefa({titulo:'Garimpar "'+nicho+'" em '+cidade+' no Google Maps',detalhe:'Pelo Chrome, ritmo humano. Priorizar sem site e com muitas avaliações.',dono:'prospeccao',tipo:'ler'}); return {t:'Entrou na fila do time: **garimpar "'+nicho+'" em '+cidade+'** pelo Google Maps. O executor (Claude) pega na próxima sessão e te devolvo o resultado. Quer que eu monte o plano do dia inteiro?',c:['Montar o plano do dia','Tarefas esperando OK']}; }
const saud=()=>{ const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };
function resumo(){ const p=pend(), f=fila(), M=B.meta; let t=saud()+', chefe!\n';
  if(B.pausa) t+='⏸ **Estou pausado**: nada roda até você me liberar.\n';
  t+=M?'Meta: **'+M.reunioesDia+' reuniões por dia**. Hoje: **'+reunioesHoje()+'** marcada(s).\n':'Ainda não temos meta. Diga, por exemplo, "minha meta é 3 reuniões por dia".\n';
  t+='Tarefas: **'+p.length+' esperando seu OK**, '+f.length+' na fila do time.';
  if(p.length) t+='\nPreciso de você: '+p.slice(0,3).map(x=>'"'+x.titulo+'"').join('; ')+'.'; return t; }

/* ---------- respostas do Ravi (entram ANTES do cérebro dele) ---------- */
async function bossReply(q){ const n=norm(q);
  const mm=q.match(/meta.*?(\d+)\s*(?:reuni|fechament|call)/i)||q.match(/(\d+)\s*(?:reuni|fechament).*por dia/i); if(mm){ B.meta={reunioesDia:+mm[1],criadoEm:Date.now(),dias:7}; logEv('Meta definida: '+mm[1]+' reuniões por dia por 7 dias'); save(); hud(); return {t:'Meta anotada: **'+mm[1]+' reuniões por dia**, por uma semana. Quer que eu monte o plano de hoje com o time?',c:['Montar o plano do dia','Tarefas esperando OK']}; }
  const pr=q.match(/(?:prospect\w*|garimp\w*|busc\w*|procur\w*|ach\w*)\s+(?:por\s+|os\s+|as\s+)?(.+?)\s+(?:em|na|no|de)\s+([^,.;]+?)(?:\s+(?:por|via|pelo|pela)\s+(e-?mail|instagram|whats\w*|zap))?\s*$/i); if(pr){ const cn=norm(pr[3]||''); return queueProspect(pr[1].trim(),pr[2].trim(),/mail/.test(cn)?'email':/insta/.test(cn)?'instagram':'whatsapp'); }
  if(/montar o plano|plano do dia|estrategia|o que (voces|vcs) vao fazer/.test(n)){ const r=plano(); if(!r) return {t:'Pra montar o plano eu preciso de um alvo. Diga "prospectar [nicho] em [cidade]" e eu crio a tarefa e o plano em seguida.'}; openPanel(); return {t:'Plano do dia montado com **'+r.length+' tarefas**. As de ler e preparar entram na fila; **enviar** espera o seu OK. Abri a lista.'}; }
  if(/\b(pausar|pausa|pare|para tudo|congela)\b/.test(n)){ setPausa(true); return {t:'⏸ Pausei **tudo**. O executor não faz mais nada até você mandar retomar.',c:['Retomar tudo']}; }
  if(/\b(retomar|retoma|libera)\b/.test(n)&&B.pausa){ setPausa(false); return {t:'▶ Retomado. O time volta a trabalhar na fila.'}; }
  if(/aprov\w*\s+tudo/.test(n)){ const p=pend(); p.forEach(x=>decidir(x.id,true)); return {t:p.length?'Aprovei **'+p.length+'** tarefa(s).':'Não havia nada pendente.'}; }
  if(/tarefas|fila|pendenc|esperando (meu )?ok|aprovar/.test(n)){ const p=pend(); openPanel(); return {t:p.length?'**'+p.length+' tarefa(s) esperando seu OK**:\n'+p.map(x=>'• '+x.titulo).join('\n')+'\n\nAbri a lista pra você aprovar ou recusar.':'Nada esperando seu OK. '+fila().length+' na fila do time.'}; }
  if(/(mand|envi)\w*\s+(as |o )?(mensagens?|abordagens?|lote)/.test(n)){ addTarefa({titulo:'Enviar lote de abordagens',detalhe:'Pedido do chefe. Ritmo humano.',dono:'vendas',tipo:'enviar'}); return {t:'Criei a tarefa **enviar lote de abordagens**: ela está **esperando seu OK** (envio nunca sai sem aprovação).',c:['Tarefas esperando OK']}; }
  if(/(prepar|escrev|cri)\w*\s+.*(post|reels|video|legenda|roteiro)/.test(n)){ addTarefa({titulo:q.trim().slice(0,90),detalhe:'Pedido do chefe. Rascunho.',dono:'conteudo',tipo:'preparar'}); return {t:'Entrou na fila do **Conteúdo** como rascunho. Publicar só com o seu OK.',c:['Tarefas esperando OK']}; }
  if(/marc(ou|amos|ei)\s+(uma\s+)?reuni/.test(n)){ (B.reunioes=B.reunioes||[]).push({t:Date.now(),com:(q.match(/com\s+(.+)$/i)||[])[1]||''}); logEv('Reunião marcada'+((q.match(/com\s+(.+)$/i)||[])[1]?' com '+q.match(/com\s+(.+)$/i)[1]:'')); save(); hud(); return {t:'Registrei! Hoje: **'+reunioesHoje()+'** reunião(ões)'+(B.meta?' de '+B.meta.reunioesDia+' da meta.':'.')}; }
  if(/^(bom dia|boa tarde|boa noite)\b|como (esta|ta|estao) a operacao|^operacao|resumo do dia|status geral/.test(n)) return {t:resumo()};
  return null; }
const b0=S.brain[0], g0=b0.greet.bind(b0), r0=b0.reply.bind(b0), c0=b0.chips.bind(b0);
b0.greet=()=>resumo()+'\n\n'+g0();
b0.chips=()=>['Tarefas esperando OK','Montar o plano do dia','Pausar tudo'].concat(c0().slice(0,2));
b0.reply=async q=>{ const r=await bossReply(q); return r||r0(q); };

/* ---------- painel (arquivo próprio, não depende da Mesa) ---------- */
const css=document.createElement('style'); css.textContent=`#bp{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(10,6,4,.72);backdrop-filter:blur(6px);padding:14px} #bp.on{display:flex}
#bp .pn{width:min(900px,100%);height:min(720px,100%);display:flex;flex-direction:column;border-radius:22px;background:linear-gradient(180deg,#1d120a,#110b07);border:1px solid rgba(255,160,80,.25);box-shadow:0 30px 90px rgba(0,0,0,.6);color:#fff3e8;overflow:hidden;font:14px/1.5 "Segoe UI",system-ui}
#bp header{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1)} #bp h2{font-size:18px;font-weight:800;flex:1} #bp h2 span{color:#ffb066} #bp .x{border:0;background:rgba(255,255,255,.1);color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer}
#bp .bd{flex:1;overflow:auto;padding:16px 18px} #bp .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px} #bp .sp{flex:1}
#bp button.b{padding:8px 13px;border-radius:12px;border:1px solid rgba(255,160,80,.5);background:rgba(255,122,26,.14);color:#ffe3cc;font:600 12.5px "Segoe UI",system-ui;cursor:pointer} #bp button.b.pri{background:#ff7a1a;border-color:#ff7a1a;color:#1a0d05} #bp button.b:hover{background:rgba(255,122,26,.4)}
#bp .card{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 13px;background:rgba(255,255,255,.04);margin-bottom:8px} #bp .tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(255,122,26,.22);color:#ffc89a} #bp .good{background:rgba(74,222,128,.2);color:#9af0b8}
#bp h3{font-size:14px;margin:14px 0 6px} #bp .note{font-size:12.5px;opacity:.7;line-height:1.5} #bp input,#bp select{width:100%;padding:9px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff3e8;font:13.5px "Segoe UI",system-ui;outline:none} #bp label{display:block;font-size:12px;font-weight:600;opacity:.8;margin:8px 0 3px} #bp .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#boss{position:fixed;left:16px;top:122px;z-index:4;display:none;gap:6px;flex-wrap:wrap;max-width:300px} #boss button{border:1px solid rgba(255,255,255,.2);background:rgba(28,22,44,.82);backdrop-filter:blur(12px);color:#f3efff;border-radius:99px;padding:7px 13px;font:700 12.5px "Segoe UI",system-ui;cursor:pointer} #boss button:hover{background:rgba(139,92,246,.55)} #boss button.stop{border-color:#ef4444;color:#fecaca} #boss button.go{background:#ef4444;border-color:#ef4444;color:#fff} #boss button.ok{border-color:#ff7a1a;color:#ffd2ad}`; document.head.appendChild(css);
const P=document.createElement('div'); P.id='bp'; P.innerHTML='<div class="pn"><header><h2>Fila do <span>time</span> · Ravi chefe</h2><button class="x" id="bpX">✕</button></header><div class="bd" id="bpB"></div></div>'; document.body.appendChild(P);
for(const ev of ['mousedown','mouseup','click','keydown','keyup']) P.addEventListener(ev,e=>{ if(ev==='keydown'&&e.code==='Escape'){ closePanel(); } e.stopPropagation(); });
const X=document.createElement('div'); X.id='boss'; X.innerHTML='<button id="bPause"></button><button id="bPend" class="ok"></button><button id="bOpen">📋 Fila</button>'; document.body.appendChild(X);
for(const ev of ['mousedown','mouseup']) X.addEventListener(ev,e=>e.stopPropagation());
function hud(){ const pb=$('bPause'), pe=$('bPend'), n=pend().length; if(!pb) return; pb.textContent=B.pausa?'▶ Retomar tudo':'⏸ Pausar tudo'; pb.className=B.pausa?'go':'stop'; pe.style.display=n?'inline-block':'none'; pe.textContent='📥 '+n+' esperando OK'; }
function openPanel(){ if(panelOpen) { render(); return; } panelOpen=true; S.setModal(true); P.classList.add('on'); render(); }
function closePanel(){ if(!panelOpen) return; panelOpen=false; P.classList.remove('on'); S.setModal(false); }
$('bpX').onclick=closePanel; $('bPause').onclick=()=>{ setPausa(!B.pausa); if(panelOpen) render(); }; $('bPend').onclick=openPanel; $('bOpen').onclick=openPanel;
function row(x,btns){ return '<div class="card"><div class="bar" style="margin:0"><b>'+esc(x.titulo)+'</b><span class="tag">'+esc(DONOS[x.dono]||x.dono)+'</span><span class="tag '+(x.tipo==='enviar'||x.tipo==='publicar'?'':'good')+'">'+esc(TIPOS[x.tipo]||x.tipo)+'</span><span class="sp"></span>'+(btns||'')+'</div>'+(x.detalhe?'<div class="note">'+esc(x.detalhe)+'</div>':'')+(x.resultado?'<div class="note" style="opacity:.9">Resultado: '+esc(x.resultado)+'</div>':'')+'</div>'; }
function render(){ const p=pend(), f=fila(), done=B.tarefas.filter(t=>t.status==='feita').slice(-8).reverse(), rec=B.log.slice(-10).reverse(), M=B.meta, Bd=$('bpB');
  Bd.innerHTML='<div class="bar"><b>Operação</b><span class="tag '+(B.pausa?'':'good')+'">'+(B.pausa?'⏸ PAUSADO':'▶ rodando')+'</span><span class="sp"></span><button class="b '+(B.pausa?'pri':'')+'" id="pPause">'+(B.pausa?'Retomar tudo':'⏸ Pausar tudo')+'</button><button class="b" id="pPlan">Montar o plano do dia</button></div>'
  +'<div class="card"><b>Meta</b><div class="note" style="opacity:.9;font-size:13.5px">'+(M?M.reunioesDia+' reuniões por dia · hoje '+reunioesHoje()+' marcada(s)':'Sem meta. Diga ao Ravi: "minha meta é 3 reuniões por dia".')+'</div><div class="bar" style="margin:8px 0 0"><button class="b sm" id="pReu">+ Reunião marcada hoje</button></div></div>'
  +'<h3>Esperando o seu OK ('+p.length+')</h3>'+(p.length?p.map(x=>row(x,'<button class="b pri" data-ok="'+x.id+'">Aprovar</button> <button class="b" data-no="'+x.id+'">Recusar</button>')).join(''):'<div class="note">Nada esperando você.</div>')
  +'<h3>Na fila do time ('+f.length+')</h3>'+(f.length?f.map(x=>row(x,'<button class="b" data-fim="'+x.id+'">Marcar feita</button>')).join(''):'<div class="note">Fila vazia.</div>')
  +'<h3>Feitas recentemente</h3>'+(done.length?done.map(x=>row(x,'')).join(''):'<div class="note">Ainda nada.</div>')
  +'<h3>Registro</h3><div class="note" style="opacity:.8;line-height:1.7">'+(rec.length?rec.map(e=>esc(ago(e.t))+': '+esc(e.txt)).join('<br>'):'Sem registros.')+'</div>'
  +'<div class="card" style="margin-top:12px"><b>Nova tarefa</b><div class="grid2"><div><label>O que fazer</label><input id="nT" placeholder="Ex.: preparar 5 posts sobre automação"></div><div><label>Time</label><select id="nD">'+Object.entries(DONOS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div><div><label>Tipo</label><select id="nK">'+Object.entries(TIPOS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div><div><label>&nbsp;</label><button class="b pri" id="nOk">Criar tarefa</button></div></div><div class="note">Ler e preparar entram direto na fila. Publicar e enviar esperam o seu OK.</div></div>';
  $('pPause').onclick=()=>{ setPausa(!B.pausa); render(); }; $('pPlan').onclick=()=>{ const r=plano(); if(!r){ toast('Diga ao Ravi um nicho: "prospectar advogados em Jundiaí"'); return; } toast(r.length+' tarefas criadas'); render(); };
  $('pReu').onclick=()=>{ (B.reunioes=B.reunioes||[]).push({t:Date.now()}); logEv('Reunião marcada'); save(); hud(); render(); };
  Bd.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{ decidir(b.dataset.ok,true); render(); }); Bd.querySelectorAll('[data-no]').forEach(b=>b.onclick=()=>{ decidir(b.dataset.no,false); render(); });
  Bd.querySelectorAll('[data-fim]').forEach(b=>b.onclick=()=>{ const x=B.tarefas.find(q=>q.id===b.dataset.fim); x.status='feita'; x.feitoEm=Date.now(); logEv('Feita: '+x.titulo); save(); hud(); render(); });
  $('nOk').onclick=()=>{ const t=$('nT').value.trim(); if(!t){ toast('Diga o que fazer'); return; } addTarefa({titulo:t,dono:$('nD').value,tipo:$('nK').value}); render(); }; }
setInterval(()=>{ X.style.display=(S.entered&&!S.leaving&&!panelOpen)?'flex':'none'; },400);
hud(); pull(true); setInterval(()=>pull(false),5000);
window.__boss={open:openPanel,estado:()=>B};
})();
