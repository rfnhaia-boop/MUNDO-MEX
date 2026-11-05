'use strict';
/* CONFIG DA LOJA
 * O que muda de uma loja para outra: modo de preço, dono, WhatsApp e texto de entrega.
 * Script clássico carregado em ordem pelo js/boot.mjs: as constantes ficam visíveis para os arquivos seguintes. */
// Modo de preço: 'oculto' (padrão) = sem valores na loja, o pedido vai pro WhatsApp e o dono passa o valor/cotação do dia.
// 'tabela' = mostra preços e fecha com pagamento demo. Troque na URL com ?preco=tabela
const PRICE_MODE = new URLSearchParams(location.search).get('preco')==='tabela' ? 'tabela' : 'oculto';
const TABELA = PRICE_MODE==='tabela';
const DONO = 'Matheus';          // quem recebe o pedido
const WHATSAPP = '';             // número do dono com DDI+DDD (ex: 5511999999999). Vazio = o cliente escolhe o contato.
const ENTREGA_TXT = 'A entrega leva de 2 a 3 dias úteis, dependendo da região.';
