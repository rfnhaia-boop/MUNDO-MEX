'use strict';
/* BETO (vendedor virtual)
 * Configuração do vendedor desta loja: persona, categorias, segmentos, combos e ganchos com o carrinho. O cérebro e o chat ficam em ../shared/vendedor.js.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
const mkVend=window.NewVendedor?NewVendedor.create:()=>({frame(){},tip(){},open(){},isOpen:()=>false}); // sem o molde a loja segue funcionando
const vend=mkVend({
  id:'ceasa-beto',nome:'Beto',cargo:'Consultor de hortifrúti',loja:'NEW CEASA',cor:'#8b5cf6',
  catalogo:CATALOGO,
  categorias:[
    {id:'banana',rotulo:'Bananas',emoji:'🍌',palavras:['bananas','banana'],itens:['banprata','bannanica','banmaca']},
    {id:'citrus',rotulo:'Citrus',emoji:'🍊',palavras:['citrus','citricos','cítricos','citrica'],itens:['laranja','limao','tanger']},
    {id:'maca',rotulo:'Maçã e pera',emoji:'🍎',palavras:['maca e pera','macas'],itens:['gala','fuji','pera']},
    {id:'finas',rotulo:'Uvas e finas',emoji:'🍇',palavras:['uvas e finas','finas','frutas finas','vermelhas'],itens:['uva','morango','kiwi','pessego','goiaba']},
    {id:'tropical',rotulo:'Tropicais, melão e melancia',emoji:'🥭',palavras:['tropicais','tropical','melao e mamao','melancia'],itens:['manga','abacaxi','maracuja','mamao','coco','melancia','melao']},
    {id:'legume',rotulo:'Legumes',emoji:'🍅',palavras:['legumes','legume','tomate e pimentao'],itens:['tomate','pimentao','abobrinha','berinjela']},
    {id:'raiz',rotulo:'Raízes e temperos',emoji:'🥔',palavras:['raizes','raiz','tuberculos','temperos','batata e cebola'],itens:['batata','cebola','cenoura','alho']},
    {id:'folha',rotulo:'Verduras e folhas',emoji:'🥬',palavras:['verduras','verdura','folhas','folhosas','hortalicas','hortaliças'],itens:['alface','repolho','couve','cheiroverde']},
    {id:'caixaria',rotulo:'Caixaria',emoji:'📦',palavras:['caixaria','caixas vazias','embalagens'],itens:['kcx','pcx','ccx','xepa']},
  ],
  segmentos:[
    {id:'restaurante',destaques:['laranja','limao','mamao','melao','banprata'],rotulo:'Restaurante',emoji:'🍽️',palavras:['restaurante','self service','self-service','marmitaria','marmita','buffet de almoco','almoco','hotel','pousada'],intro:'Restaurante é comigo! O que mais sai é suco, sobremesa e tempero, e o segredo é fruta no ponto certo.'},
    {id:'mercado',destaques:['banprata','laranja','gala','mamao','manga'],rotulo:'Mercado / sacolão',emoji:'🛒',palavras:['mercado','mercadinho','sacolao','hortifruti','quitanda','feira','varejo','revenda','revender'],intro:'Mercado e sacolão é meu forte. Giro rápido, fruta bonita na bancada e pouca perda.'},
    {id:'suco',destaques:['laranja','limao','maracuja','abacaxi','morango'],rotulo:'Suco / lanchonete',emoji:'🥤',palavras:['suco','sucos','lanchonete','padaria','acai','cafeteria','vitamina'],intro:'Suco e lanchonete! Aí a fruta rende por litro. Eu te ajudo a montar sem sobrar nem faltar.'},
    {id:'evento',destaques:['uva','melao','morango','kiwi','abacaxi'],rotulo:'Evento / buffet',emoji:'🎉',palavras:['evento','eventos','buffet','festa','casamento','formatura'],intro:'Evento é diferente: tem que ter variedade e fruta bonita. Eu te ajudo a fechar a lista.'},
    {id:'casa',destaques:['banprata','laranja','gala'],rotulo:'Casa / outro',emoji:'🏠',palavras:['casa','pessoal','particular','familia','consumo proprio','pra mim'],intro:'Aqui é atacado, a gente vende por caixa. Mas dá pra dividir com vizinho ou levar as que rendem mais.'},
  ],
  bundles:{
    restaurante:[['tomate',2],['cebola',2],['batata',2],['alface',2],['cenoura',1],['laranja',2],['limao',1],['mamao',1]],
    mercado:[['banprata',3],['laranja',3],['tomate',3],['batata',3],['cebola',2],['alface',2],['gala',2],['mamao',1]],
    suco:[['laranja',4],['limao',1],['maracuja',1],['abacaxi',2],['morango',1]],
    evento:[['uva',2],['melao',1],['morango',1],['kiwi',1],['abacaxi',1],['gala',1]],
    casa:[['banprata',1],['laranja',1],['gala',1]],
  },
  // voz neural do Beto (Gemini, voz Charon): frases gravadas + geração no servidor (/api/voz, precisa de GEMINI_API_KEY); sem isso usa a voz do navegador
  voz:{index:'assets/voz/index.json',endpoint:'/api/voz'},
  llm:{endpoint:'/api/vendedor/llm'},   // cérebro de IA do Beto (Groq no servidor); se falhar, o molde volta pras regras
  modoPreco:PRICE_MODE, dono:DONO,
  regras:{min:TABELA?MIN_ORDER:0,freteGratis:TABELA?FREE_ABOVE:0,frete:DELIVERY_FEE,
    entrega:ENTREGA_TXT,
    entregaWa:`Pra combinar certinho o dia e a sua região, chama o ${DONO} no WhatsApp.`,
    pagamento:`Valor e forma de pagamento o ${DONO} combina com você no WhatsApp: PIX, boleto ou prazo pra cliente cadastrado.`},
  unidade:(it,q)=>it.embalagem.startsWith('Palox')?(q>1?'paloxes':'palox'):it.preco<40&&!it.kg?(q>1?'unidades':'unidade'):(q>1?'caixas':'caixa'),
  ganchos:{
    carrinho:()=>[...cart.values()].map(i=>({id:PKEY.get(i.p),q:i.q})),
    adicionar:(id,q)=>{ add(P[id],q); if(telao) telao.mostra(id); }, destaque:ids=>{ if(telao) telao.foco(ids); },
    remover:id=>{ const k=P[id].name+P[id].var; cart.delete(k); for(let n=order.length-1;n>=0;n--) if(order[n]===k) order.splice(n,1); renderCart(); },
    whatsapp:extra=>openWA(extra), foto:fotoOf, midia:id=>{ if(telao) telao.mostra(id); const b=BOX_BY_ID.get(id); if(b) abreTotem({num:b,nome:BOXES[b].nome,cor:TOTEM_COR[b],ids:BOXES[b].ids},id); }, mostrar:(id,api,done)=>{ if(telao) telao.mostra(id); return showPallet(id,api,done); }, fechar:()=>openCheckout(), total:()=>total(),
  },
  avatar:{shirt:'#8b5cf6',cap:'#2a1f3d',apronText:'NEW',sprite:{idle:'assets/beto-idle.png',walk:'assets/beto-walk.png'},spriteH:1.82,portrait:'assets/beto-face.png'},
  three:{THREE,scene,pos:[2.1,0,13.8],pickMeshes,col},
  onOpen:()=>{ chatOn=true; try{ document.exitPointerLock(); }catch(e){} },
  onClose:()=>{ chatOn=false; if(!free&&!locked) overlay.style.display='flex'; },
});
