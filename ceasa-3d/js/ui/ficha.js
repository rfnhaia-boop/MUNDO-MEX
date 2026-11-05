'use strict';
/* FICHA DO PRODUTO
 * Cartão que aparece ao apontar para uma caixa.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
/* ========== ficha do produto ========== */
const pc=$('pc'); let shown=null;
function showCard(p){
  if(shown!==p){ shown=p;
    pc.style.setProperty('--pc',p.box);
    $('pcbrand').textContent = p.empty?'Caixaria · embalagem vazia':'Frutas · '+PACKNAME[p.pack];
    $('pcname').innerHTML = p.name+'<small>'+p.var+'</small>';
    $('pcprice').innerHTML = !TABELA? `<b>Valor no WhatsApp</b> <small>cotação do dia com o ${DONO}</small>` : p.kg? `<b>${brl(p.price)}</b> <small>por caixa · ≈ ${brl(p.perKg)}/kg</small>` : `<b>${brl(p.price)}</b> <small>cada</small>`;
    $('pcchips').innerHTML = [p.kg?`<span class="hl">${String(p.kg).replace('.',',')} kg${p.pack==='BIN'?' · palox':''}</span>`:'',`<span>${PACKNAME[p.pack]}</span>`,`<span>${p.org}</span>`].join('');
    $('pcdesc').textContent = p.note;
  }
  pc.classList.add('on');
}
const hideCard=()=>{ pc.classList.remove('on'); };
