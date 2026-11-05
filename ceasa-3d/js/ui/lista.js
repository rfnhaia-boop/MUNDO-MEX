'use strict';
/* LISTA DE COMPRAS
 * Painel "Comprar pela lista", sincronização com o ERP e rascunho salvo.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== central de compras por lista ========== */
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cartQty=id=>{ const p=P[id], i=p&&cart.get(p.name+p.var); return i?i.q:0; };
function setProductQty(id,q){
  const p=P[id]; if(!p) return;
  const item=CATALOGO.find(x=>x.id===id);
  if(q>0&&item&&(!item.ativo||item.estoque===0)){ toast('Produto temporariamente indisponível'); return; }
  const key=p.name+p.var, next=Math.max(0,Math.min(99,q|0));
  for(let n=order.length-1;n>=0;n--) if(order[n]===key) order.splice(n,1);
  if(next){ cart.set(key,{p,q:next}); for(let n=0;n<next;n++) order.push(key); }
  else cart.delete(key);
  renderCart();
}
function filteredCatalog(){
  const q=norm(catalogQuery);
  return CATALOGO.filter(it=>(catalogBox==='all'||it.box===+catalogBox)&&(!q||norm([it.nome,it.variante,it.origem,it.embalagem,...(it.aliases||[])].join(' ')).includes(q)));
}
function renderCatalog(){
  const filters=$('catalog-filters');
  filters.innerHTML=`<button class="catalog-filter ${catalogBox==='all'?'on':''}" data-box="all" type="button">Todos</button>`+Object.entries(BOXES).map(([n,b])=>`<button class="catalog-filter ${String(catalogBox)===n?'on':''}" data-box="${n}" type="button">Box ${n.padStart(2,'0')} · ${b.nome}</button>`).join('');
  filters.querySelectorAll('[data-box]').forEach(b=>b.onclick=()=>{ catalogBox=b.dataset.box; renderCatalog(); });
  const rows=filteredCatalog(), results=$('catalog-results');
  results.innerHTML=rows.length?`<div class="catalog-result-head"><span>Produto</span><span>Local</span><span>Encontrar</span><span>Quantidade</span></div>`+rows.map(it=>{
    const q=cartQty(it.id), box=BOXES[it.box];
    const stock=it.estoque===null?'estoque confirmado no fechamento':it.estoque>0?`${it.estoque} disponíveis`:'indisponível';
    return `<div class="catalog-row">
      <div class="catalog-product"><b>${it.nome} ${it.variante}</b><small>${it.embalagem}${it.kg?' · '+it.kg.toLocaleString('pt-BR')+' kg':''} · ${it.origem}${TABELA?' · '+brl(it.preco):' · cotação do dia'} · ${stock}</small></div>
      <div class="catalog-box"><b>Box ${String(it.box).padStart(2,'0')}</b>${box?box.nome:''}</div>
      <button class="catalog-locate" data-locate="${it.id}" type="button">Ir ao box</button>
      <div class="catalog-qty"><button data-qty="${it.id}" data-d="-1" type="button" aria-label="Remover uma caixa" ${q?'':'disabled'}>−</button><span>${q}</span><button data-qty="${it.id}" data-d="1" type="button" aria-label="Adicionar uma caixa" ${(!it.ativo||it.estoque===0)?'disabled':''}>+</button></div>
    </div>`;
  }).join(''):`<div class="catalog-empty"><b>Nenhum produto encontrado.</b><br>Limpe a busca ou escolha outro box.</div>`;
  results.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>setProductQty(b.dataset.qty,cartQty(b.dataset.qty)+(+b.dataset.d)));
  results.querySelectorAll('[data-locate]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.locate, box=BOX_BY_ID.get(id); closeCatalog(false); showPallet(id,null,()=>toast(`Você chegou ao Box ${String(box).padStart(2,'0')}`));
  });
  $('catalog-summary').innerHTML=cart.size?`<b>${qtyTot()} ${qtyTot()===1?'volume':'volumes'}</b> na lista · aproximadamente ${Math.round(totalKg())} kg`:'Nenhum produto selecionado';
  $('catalog-checkout').disabled=!cart.size;
}
function openCatalog(){
  if(modalOn||chatOn||tourOn) return;
  catalogOn=true; try{ document.exitPointerLock(); }catch(e){}
  const panel=$('catalog-panel'); panel.classList.add('on'); panel.setAttribute('aria-hidden','false'); renderCatalog();
  requestAnimationFrame(()=>$('catalog-search').focus());
}
function closeCatalog(restore=true){
  catalogOn=false; const panel=$('catalog-panel'); panel.classList.remove('on'); panel.setAttribute('aria-hidden','true');
  if(restore&&!free&&!locked) overlay.style.display='flex';
}
$('catalog-open').onclick=openCatalog;
$('catalog-close').onclick=()=>closeCatalog();
$('catalog-continue').onclick=()=>closeCatalog();
$('catalog-checkout').onclick=()=>{ closeCatalog(false); openCheckout(); };
$('catalog-search').oninput=e=>{ catalogQuery=e.target.value; renderCatalog(); };
$('catalog-panel').addEventListener('mousedown',e=>e.stopPropagation());
$('catalog-panel').addEventListener('mouseup',e=>e.stopPropagation());
async function syncERP(){
  const erp=window.CEASA_ERP, status=$('catalog-status');
  if(!erp||!erp.connected){ status.dataset.state='local'; status.textContent='Catálogo local · aguardando conexão com o ERP'; return; }
  status.dataset.state='sync'; status.textContent='Sincronizando catálogo e estoque com o ERP…';
  try{
    const products=await erp.catalogo();
    let updated=0;
    for(const row of products||[]){
      const id=norm(row.sku), item=CATALOGO.find(x=>norm(x.id)===id);
      if(!item) continue;
      item.estoque=Number.isFinite(+row.estoque)?+row.estoque:item.estoque;
      item.ativo=row.ativo!==false;
      if(Number.isFinite(+row.preco)&&+row.preco>0){ item.preco=+row.preco; P[item.id].price=+row.preco; P[item.id].perKg=P[item.id].kg?P[item.id].price/P[item.id].kg:0; }
      updated++;
    }
    status.dataset.state='online'; status.textContent=`ERP conectado · ${updated} produtos sincronizados`;
    if(catalogOn) renderCatalog(); renderCart();
    window.dispatchEvent(new CustomEvent('ceasa:catalog-synced',{detail:{updated,total:products.length}}));
  }catch(error){
    status.dataset.state='error'; status.textContent='ERP indisponível · usando o catálogo local com confirmação no fechamento';
    window.dispatchEvent(new CustomEvent('ceasa:erp-error',{detail:{stage:'catalogo',message:error.message,status:error.status||0}}));
  }
}
renderCart();   // primeira renderização da lista (vinha do carrinho.js)
try{
  const draft=JSON.parse(localStorage.getItem('ceasa_lista_rascunho')||'[]');
  for(const row of draft) if(P[row.id]&&row.q>0){ const p=P[row.id], key=p.name+p.var, q=Math.min(99,row.q|0); cart.set(key,{p,q}); for(let n=0;n<q;n++) order.push(key); }
  if(draft.length) renderCart();
}catch(e){}
syncERP();
