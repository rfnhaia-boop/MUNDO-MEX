'use strict';
/* CHECKOUT
 * Fechamento do pedido: sem preço vai pro WhatsApp do dono; em modo tabela, pagamento demo.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== checkout ==========
   Modo 'oculto' (padrão): monta o pedido SEM valores e abre o WhatsApp do dono; ele responde com valor e prazo.
   Modo 'tabela': mostra preços e fecha com pagamento demo.
   Pra ligar no ERP: window.onCeasaOrder = async pedido => {...}  (ou escute o evento 'ceasa:order') */
const MIN_ORDER=150, FREE_ABOVE=1200, DELIVERY_FEE=60;
const fee=()=>total()>=FREE_ABOVE?0:DELIVERY_FEE;
const WINDOWS={madrugada:'Madrugada (3h–6h)',manha:'Manhã (6h–10h)',tarde:'Tarde (13h–17h)'};
const PAY={pix:{n:'PIX',s:'Aprovação na hora'},fat:{n:'Faturado 7 dias',s:'Cliente com cadastro'},boleto:{n:'Boleto',s:'Vence em 3 dias'}};
let step=1, form={nome:'',empresa:'',doc:'',tel:'',end:'',bairro:'',cidade:'Jundiaí',janela:'manha',obs:''}, pay='pix', placed=null, busy=false;
const STEPS=TABELA?['Pedido','Entrega','Pagamento','Pronto']:['Pedido','Seus dados','Enviar','Pronto'];
const kgS=p=>p.kg?String(p.kg).replace('.',',')+' kg':'';
function waText(extra){
  if(!cart.size) return 'Olá! Vim pelo NEW CEASA e queria falar sobre frutas.'+(extra==='entrega'?' Queria combinar a entrega.':'');
  const L=['*Pedido NEW CEASA*'];
  if(form.nome||form.empresa) L.push(`Cliente: ${form.nome}${form.empresa?' · '+form.empresa:''}${form.doc?' · '+form.doc:''}`);
  if(form.tel) L.push('WhatsApp: '+form.tel);
  L.push('','Itens:'); for(const i of cart.values()){ const box=BOX_BY_ID.get(PKEY.get(i.p)); L.push(`• ${i.q} ${unitLbl(i.p,i.q)} · ${i.p.name} ${i.p.var} · Box ${String(box||0).padStart(2,'0')} (${PACKNAME[i.p.pack]}${i.p.kg?', '+kgS(i.p):''})${TABELA?' — '+brl(i.p.price*i.q):''}`); }
  L.push('',`≈ ${Math.round(totalKg())} kg no total${TABELA?' · '+brl(total()+fee()):''}`);
  if(form.end) L.push(`Entrega: ${form.end}, ${form.bairro} · ${form.cidade}`);
  if(form.obs) L.push('Obs: '+form.obs);
  L.push('',extra==='lista'?'Estou olhando com calma, depois confirmo.':'Pode me passar o valor e o prazo de entrega? Obrigado!');
  return L.join('\n');
}
const waUrl=t=>(WHATSAPP?`https://wa.me/${WHATSAPP}?text=`:'https://api.whatsapp.com/send?text=')+encodeURIComponent(t);
function salvaUltima(){ try{ localStorage.setItem('ceasa_ultima',JSON.stringify([...cart.values()].map(i=>({id:PKEY.get(i.p),q:i.q})))); }catch(e){} }
/* GANCHO DO ERP: quando o ERP do cliente estiver plugado, defina window.CEASA_ERP = { ultimaCompra:async()=>[{id,q}], estoque:async()=>({id:qtd}) }.
   Sem ele, usa a última compra salva neste navegador. */
async function ultimaCompra(){ let l=[]; try{ if(window.CEASA_ERP&&CEASA_ERP.ultimaCompra) l=await CEASA_ERP.ultimaCompra(); else l=JSON.parse(localStorage.getItem('ceasa_ultima')||'[]'); }catch(e){} l=(l||[]).filter(i=>P[i.id]);
  if(!l.length){ vend.abrirCom('Ainda não tenho nenhuma compra sua guardada por aqui. Bora montar a primeira? Me diz o que você precisa, ou aponta pra uma caixa e aperta **E**.',[{label:'🔎 Mostrar o que tem',send:'o que vocês têm hoje?'}]); return; }
  l.forEach(i=>add(P[i.id],i.q)); vend.abrirCom('Puxei a sua **última compra** pro pedido: '+l.map(i=>i.q+'x '+P[i.id].name).join(', ')+'. Quer ajustar alguma coisa ou já fecho?',[{label:'✅ Fechar pedido',send:'fechar pedido'},{label:'✏️ Ajustar',send:'quero ajustar o pedido'}]); }
function openWA(extra){ salvaUltima(); window.open(waUrl(waText(extra)),'_blank'); }
function openCheckout(){ if(!cart.size){ toast('Sua lista está vazia'); return; } if(catalogOn) closeCatalog(false); modalOn=true; step=1; placed=null; try{ document.exitPointerLock(); }catch(e){} $('modal').classList.add('on'); renderCO(); }
function closeCO(){ modalOn=false; $('modal').classList.remove('on'); if(!free&&!locked) overlay.style.display='flex'; }
$('coclose').onclick=closeCO;
function sideHtml(){
  const rows=[...cart.values()].map(i=>`<div class="sr"><span>${i.q}× ${i.p.name} ${i.p.var}</span>${TABELA?`<span>${brl(i.p.price*i.q)}</span>`:''}</div>`).join('');
  if(!TABELA) return `<h4>Resumo</h4>`+rows+`<div class="sr tot"><span>${qtyTot()} volumes</span><span>≈ ${Math.round(totalKg())} kg</span></div><span class="sfree">📲 O ${DONO} responde no WhatsApp com <b>valor</b> e <b>prazo de entrega</b>.</span><span class="sfree">🚚 ${ENTREGA_TXT}</span>`;
  const f=fee(), t=total()+f;
  return `<h4>Resumo</h4>`+rows+
   `<div class="sr"><span>Mercadoria</span><span>${brl(total())}</span></div><div class="sr"><span>Entrega (${Math.round(totalKg())} kg)</span><span>${f?brl(f):'grátis'}</span></div><div class="sr tot"><span>Total</span><span>${brl(t)}</span></div>`+
   (total()>=FREE_ABOVE?`<span class="sfree ok">✓ Frete grátis</span>`:`<span class="sfree">Faltam ${brl(FREE_ABOVE-total())} pra frete grátis</span>`);
}
function renderCO(){
  $('costeps').innerHTML=STEPS.map((s,i)=>`<div class="cos ${i+1===step?'on':i+1<step?'done':''}"><b>${i+1<step?'✓':i+1}</b><span>${s}</span></div>`).join('<i></i>');
  const main=$('comain'), side=$('coside'), grid=$('cogrid'); grid.classList.toggle('one',step===4);
  side.style.display=step===4?'none':'block'; if(step!==4) side.innerHTML=sideHtml();
  const bloqueio=TABELA&&total()<MIN_ORDER;
  if(step===1){
    main.innerHTML=`<h2>Seu pedido</h2>`+[...cart.entries()].map(([k,i])=>`<div class="ci"><div><b>${i.p.name} ${i.p.var}</b><small>${PACKNAME[i.p.pack]}${i.p.kg?' · '+kgS(i.p):''}${TABELA?' · '+brl(i.p.price):''}</small></div><div class="qty"><button data-k="${k}" data-d="-1">−</button><span>${i.q}</span><button data-k="${k}" data-d="1">+</button></div>${TABELA?`<b>${brl(i.p.price*i.q)}</b>`:'<span></span>'}</div>`).join('')+
      `<div class="coact"><button class="btn ghost" id="cvolta">Continuar vendo</button><button class="btn" id="cnext" ${bloqueio?'disabled':''}>${bloqueio?'Pedido mínimo '+brl(MIN_ORDER):'Continuar'}</button></div>`;
    main.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ const i=cart.get(b.dataset.k), d=+b.dataset.d; i.q=Math.max(0,Math.min(99,i.q+d)); if(!i.q){ cart.delete(b.dataset.k); for(let n=order.length-1;n>=0;n--) if(order[n]===b.dataset.k) order.splice(n,1); } renderCart(); if(!cart.size){ closeCO(); return; } renderCO(); });
    $('cvolta').onclick=closeCO; $('cnext').onclick=()=>{ step=2; renderCO(); };
  } else if(step===2){
    main.innerHTML=`<h2>${TABELA?'Entrega':'Seus dados'}</h2><div class="fg">
      <label class="w2">Nome de quem recebe<input data-f="nome" value="${form.nome}" placeholder="Nome completo"></label>
      <label>Empresa<input data-f="empresa" value="${form.empresa}" placeholder="Restaurante, mercado..."></label>
      <label>CNPJ / CPF<input data-f="doc" value="${form.doc}" placeholder="00.000.000/0001-00"></label>
      <label>WhatsApp<input data-f="tel" value="${form.tel}" placeholder="(11) 90000-0000" inputmode="tel"></label>
      ${TABELA?`<label>Janela de entrega<select data-f="janela">${Object.entries(WINDOWS).map(([k,v])=>`<option value="${k}" ${form.janela===k?'selected':''}>${v}</option>`).join('')}</select></label>`:`<label>Cidade<input data-f="cidade" value="${form.cidade}"></label>`}
      <label class="w2">Endereço de entrega<input data-f="end" value="${form.end}" placeholder="Rua, número"></label>
      <label>Bairro<input data-f="bairro" value="${form.bairro}"></label>
      ${TABELA?`<label>Cidade<input data-f="cidade" value="${form.cidade}"></label>`:`<label>Frequência<input data-f="obs" value="${form.obs}" placeholder="Ex: compro toda semana"></label>`}</div>
      <div class="coact"><button class="btn ghost" id="cback">Voltar</button><button class="btn" id="cnext">Continuar</button></div>`;
    main.querySelectorAll('[data-f]').forEach(i=>i.oninput=()=>{ form[i.dataset.f]=i.value; i.classList.remove('bad'); });
    $('cback').onclick=()=>{ step=1; renderCO(); };
    $('cnext').onclick=()=>{ let ok=true; for(const k of ['nome','tel','end','bairro','cidade']){ const el=main.querySelector(`[data-f="${k}"]`); if(el&&!form[k].trim()){ el.classList.add('bad'); ok=false; } } if(ok){ step=3; renderCO(); } else toast('Preencha os campos em vermelho'); };
  } else if(step===3){
    if(TABELA){
      main.innerHTML=`<h2>Pagamento</h2><div class="opts">${Object.entries(PAY).map(([k,v])=>`<button class="opt ${pay===k?'on':''}" data-p="${k}"><b>${v.n}</b><small>${v.s}</small></button>`).join('')}</div>
        <div class="demo">DEMO · nenhum pagamento real é processado.</div>
        <div class="coact"><button class="btn ghost" id="cback">Voltar</button><button class="btn" id="cnext" ${busy?'disabled':''}>${busy?'Enviando...':'Confirmar pedido · '+brl(total()+fee())}</button></div>`;
      main.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ pay=b.dataset.p; renderCO(); });
    } else {
      main.innerHTML=`<h2>Enviar pro ${DONO}</h2>
        <div class="info"><b>${form.nome}${form.empresa?' · '+form.empresa:''}</b><br>${form.end}, ${form.bairro} · ${form.cidade}<br>${form.tel}${form.obs?'<br>'+form.obs:''}</div>
        <div class="info" style="margin-top:10px">📲 Ao enviar, abre o <b>WhatsApp</b> com o pedido pronto. O ${DONO} confere o estoque e te responde com o <b>valor</b> (cotação do dia, com condição pra volume) e o <b>prazo</b>.<br>🚚 ${ENTREGA_TXT}<br>💳 Nada é cobrado agora. Pagamento combinado no WhatsApp.</div>
        <div class="coact"><button class="btn ghost" id="cback">Voltar</button><button class="btn" id="cnext" ${busy?'disabled':''}>${busy?'Abrindo...':'📲 Enviar pelo WhatsApp'}</button></div>`;
    }
    $('cback').onclick=()=>{ step=2; renderCO(); }; $('cnext').onclick=finishOrder;
  } else {
    main.innerHTML=TABELA?`<div class="done"><div class="check">✓</div><h2>Pedido ${placed.id} recebido!</h2><p style="opacity:.8">Entrega: ${WINDOWS[placed.cliente.janela]} · ${placed.cliente.cidade}</p>
      <div class="info"><b>${placed.itens.length} produto(s) · ${Math.round(placed.kg)} kg</b><br>Total ${brl(placed.total)} · ${PAY[placed.pagamento].n}<br>${placed.cliente.nome}${placed.cliente.empresa?' · '+placed.cliente.empresa:''}<br>${placed.cliente.end}, ${placed.cliente.bairro}</div>
      <div class="coact"><button class="btn" id="cfim">Voltar pro pavilhão</button></div><div class="demo">DEMO · pedido simulado.</div></div>`
    :`<div class="done"><div class="check">📲</div><h2>Pedido ${placed.id} pronto!</h2><p style="opacity:.85">Mandei pro WhatsApp do ${DONO}. Ele te responde com valor e prazo de entrega.</p>
      <div class="info"><b>${placed.itens.length} produto(s) · ≈ ${Math.round(placed.kg)} kg</b><br>${placed.cliente.nome}${placed.cliente.empresa?' · '+placed.cliente.empresa:''}<br>${placed.cliente.end}, ${placed.cliente.bairro}<br>🚚 ${ENTREGA_TXT}</div>
      <div class="coact"><button class="btn ghost" id="cwa">Abrir o WhatsApp de novo</button><button class="btn" id="cfim">Voltar pro pavilhão</button></div></div>`;
    $('cfim').onclick=closeCO; if($('cwa')) $('cwa').onclick=()=>window.open(waUrl(placed.whatsappTexto),'_blank');
  }
}
async function finishOrder(){
  if(busy) return; busy=true; renderCO();
  const texto=waText();
  const win=TABELA?null:window.open('about:blank','_blank'); // abre já no clique (evita bloqueio de pop-up)
  const pedido={ id:'CE'+Date.now().toString(36).toUpperCase().slice(-6), criadoEm:new Date().toISOString(), modo:PRICE_MODE, cliente:{...form}, pagamento:TABELA?pay:null,
    itens:[...cart.values()].map(i=>({produto:i.p.name+' '+i.p.var,box:BOX_BY_ID.get(PKEY.get(i.p))||null,embalagem:PACKNAME[i.p.pack],kgPorCaixa:i.p.kg,qtd:i.q,...(TABELA?{precoCaixa:i.p.price,subtotal:i.p.price*i.q}:{})})),
    kg:totalKg(), ...(TABELA?{mercadoria:total(),frete:fee(),total:total()+fee()}:{}), whatsappTexto:texto };
  try{ if(typeof window.onCeasaOrder==='function') await window.onCeasaOrder(pedido); window.dispatchEvent(new CustomEvent('ceasa:order',{detail:pedido})); }catch(e){ if(win) win.close(); busy=false; toast('Falha ao enviar o pedido'); renderCO(); return; }
  if(win){ win.location.href=waUrl(texto); }
  await new Promise(r=>setTimeout(r,500));
  placed=pedido; busy=false; cart.clear(); order.length=0; renderCart(); step=4; renderCO();
}
