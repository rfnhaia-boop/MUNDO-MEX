'use strict';
/* CARRINHO
 * Lista por caixa, rascunho no navegador, adicionar e tirar.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== carrinho por caixa ========== */
const cart=new Map(), order=[]; let modalOn=false, catalogOn=false, catalogQuery='', catalogBox='all', toastT=0;
const total=()=>[...cart.values()].reduce((s,i)=>s+i.p.price*i.q,0);
const totalKg=()=>[...cart.values()].reduce((s,i)=>s+i.p.kg*i.q,0);
const qtyTot=()=>[...cart.values()].reduce((s,i)=>s+i.q,0);
const unitLbl=(p,q)=>p.pack==='BIN'?(q>1?'paloxes':'palox'):p.empty?(q>1?'unidades':'unidade'):(q>1?'caixas':'caixa');
function toast(t){ const el=$('toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('on'),1600); }
function saveDraft(){
  try{
    const rows=[...cart.values()].map(i=>({id:Object.keys(P).find(k=>P[k]===i.p),q:i.q})).filter(i=>i.id);
    localStorage.setItem('ceasa_lista_rascunho',JSON.stringify(rows));
  }catch(e){}
}
function renderCart(){
  const el=$('cart'), items=[...cart.values()];
  el.innerHTML='<h3>Minha lista</h3>'+(items.length?items.map(i=>`<div class="row"><span>${i.q}× ${i.p.name} ${i.p.var}</span>${TABELA?`<span>${brl(i.p.price*i.q)}</span>`:''}</div>`).join('')+(TABELA?`<div class="tot"><span>Total</span><span>${brl(total())}</span></div><div class="sub">${qtyTot()} vol. · ${Math.round(totalKg())} kg</div><button class="cfin" id="cfin">Revisar pedido <kbd>F</kbd></button>`:`<div class="tot"><span>${qtyTot()} volumes</span><span>≈ ${Math.round(totalKg())} kg</span></div><div class="sub">Cotação confirmada pelo ${DONO}</div><button class="cfin" id="cfin">Revisar pedido <kbd>F</kbd></button>`):'<div class="empty">Sua lista ainda está vazia</div>')+'<button class="clist" id="clist" type="button">Escolher produtos pela lista</button>';
  const b=$('cfin'); if(b) b.onclick=openCheckout;
  $('clist').onclick=openCatalog;
  saveDraft();
  if(typeof renderCatalog==='function' && catalogOn) renderCatalog();
}
function add(p,q=1){ const i=cart.get(p.name+p.var)||{p,q:0}; i.q+=q; cart.set(p.name+p.var,i); for(let k=0;k<q;k++) order.push(p.name+p.var); renderCart(); toast(`+1 ${unitLbl(p,1)} · ${p.name} ${p.var}`); }
function removeLast(){ const id=order.pop(); if(!id) return; const i=cart.get(id); if(--i.q<=0) cart.delete(id); renderCart(); toast('Item removido'); }
// a primeira renderização da lista acontece no fim de js/ui/lista.js (ela usa openCatalog/openCheckout, definidos depois)
