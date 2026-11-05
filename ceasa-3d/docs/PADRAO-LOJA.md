# Padrão de loja 3D da Rua NEW — guia do programador

A NEW CEASA é a **loja modelo**. As próximas lojas da Rua NEW devem nascer copiando esta estrutura.
Este guia explica o que cada parte faz, o que mudar para uma loja nova e as regras que não podem ser quebradas.

---

## 1. Rodar localmente

```bash
cd Ativos
node sede-3d/server.mjs
```

Abra `http://localhost:8099/ceasa-3d/` (vindo da rua: `index.html?rua=1`).

- O servidor da Sede (`sede-3d/server.mjs`, porta 8099) serve os arquivos estáticos **e** as rotas `/api/*` que a loja usa (Beto com IA, voz, totem, telão, modo dono).
- `abrir-lojas.bat` sobe só um servidor estático (python, porta 8000): a loja abre, mas **sem IA, sem voz neural, sem fotos e sem modo dono** (tudo cai no modo offline).
- Microfone só funciona em `localhost` ou `https`.

Variáveis de ambiente do servidor:

| Variável | Para quê | Sem ela |
|---|---|---|
| `GROQ_API_KEY` | cérebro de IA do Beto (cliente e dono) | o Beto responde por regras |
| `GROQ_VENDEDOR_MODEL` / `GROQ_MODEL` | troca o modelo (padrão `openai/gpt-oss-120b`) | usa o padrão |
| `GEMINI_API_KEY` | voz neural do Beto (`/api/voz`) | usa a voz do navegador |
| `CEASA_DONO_PIN` | PIN do dono (alternativa ao PIN gravado) | usa o PIN de `data/ceasa/dono.json` |
| `CEASA_DIR` | pasta dos dados da CEASA | `sede-3d/data/ceasa/` |

Nunca commitar `sede-3d/data/` (tem PIN em hash, fotos e custos).

---

## 2. Estrutura

```
ceasa-3d/
  index.html              só a casca: HTML do HUD + carregamento
  loja/                   ← O QUE MUDA DE UMA LOJA PARA OUTRA
    config.js             modo de preço, dono, WhatsApp, texto de entrega
    catalogo.js           produtos (P), embalagens (PACKNAME), conhecimento do Beto (KB), boxes (BOXES)
    montagem.js           onde fica cada banca/box, caixaria e xepa
    beto.js               persona e regras do vendedor (categorias, segmentos, combos, ganchos)
  css/
    tokens.css            cores, vidro, raios, sombras (Liquid Glass) — troque --acc para outra marca
    loja.css              HUD, entrada, ficha, minha lista, lista de compras, checkout
    totem.css             painel do totem
  js/
    boot.mjs              carrega o three.js e depois os scripts abaixo, EM ORDEM
    nucleo/  base.js      utilidades, sorteio com semente, $(id), voltar pra rua
             estado.js    flags compartilhadas (chatOn, locked, yaw, pitch, camAnim, follow…)
             cena.js      renderer, cena, câmera, luzes, colisores
    cena/    texturas, piso, ceu, galpao, frutas, embalagens, pallets, bancas, props
    ui/      ficha, carrinho, checkout, vitrine, lista, telao, totem-ligacao, totem
    tour.js  controles.js  loop.js
  erp-adapter.js          ponte opcional com o ERP (catálogo, estoque, pedidos)
  assets/                 fotos (piso, banners, panorama da rua, Beto), voz gravada
  docs/PADRAO-LOJA.md     este guia
shared/
  vendedor.js + .css      o Beto: avatar, chat, voz, cérebro (usado por qualquer loja)
  music.js  perf.js       música ambiente e ajuste automático de desempenho
sede-3d/
  server.mjs              servidor + rota /api/vendedor/llm (IA do vendedor) e /api/voz
  ceasa-dono.mjs          modo dono, mídia real, estoque (rotas /api/ceasa/*)
  ceasa-demo.mjs          põe/tira imagens de demonstração
  testes/ceasa/           testes do modo dono
```

---

## 3. Regras que não podem ser quebradas

1. **A ordem de carregamento importa.** Os arquivos são *scripts clássicos* carregados um a um pelo `js/boot.mjs`. Cada um usa o que os anteriores definiram (as constantes de topo ficam visíveis para os seguintes). Não há passo de build.
2. **A cena é sorteada com semente** (`rnd()` em `js/nucleo/base.js`). Mudar a ordem dos arquivos ou das chamadas que sorteiam (texturas, pallets, frutas) **muda a cena inteira**. Para conferir que nada mudou: no console, `__dbg.info()` deve dar os mesmos `tris`, `pick` e `bags` antes e depois.
3. **Função chamada no topo de um arquivo precisa estar definida antes.** Exemplo real: a primeira renderização da lista (`renderCart()`) fica no fim de `js/ui/lista.js`, porque usa `openCatalog`/`openCheckout`, definidos depois do carrinho.
4. **Nada de cor solta no CSS.** Use os tokens de `css/tokens.css`. Estilo inline no JS só para valores dinâmicos (ex.: `--pc` com a cor do produto).
5. **Foto real é sagrada.** O totem e o telão só dizem "foto real / postada há X dias / lote" com dado gravado pelo dono. Sem foto real → selo **Ilustrativa**. Imagem de demonstração → selo **Demonstração** e o Beto nunca a trata como real.
6. **O custo do dono nunca sai na rota pública.** `/api/ceasa/estado` não inclui `custoCaixa` (há teste para isso).
7. **O Beto não grava nada sozinho no modo dono:** ele *propõe*, o dono confirma (`/dono/beto` → `/dono/aplicar`).

---

## 4. Criar uma loja nova a partir da CEASA

1. Copie a pasta `ceasa-3d/` para `nova-loja-3d/`.
2. Troque `loja/config.js` (dono, WhatsApp com DDI+DDD, texto de entrega, modo de preço).
3. Troque `loja/catalogo.js`:
   - `P`: um item por produto (`name`, `var`, `fruit` = modelo 3D em `js/cena/frutas.js`, `pack` = K/P/C/BIN, `kg`, `price`, `org`, `note`, `box` = cor).
   - `KB`: o que o Beto sabe de cada produto (apelidos, durabilidade, dica, combina com, texto por segmento).
   - `BOXES`: nome e produtos de cada box.
4. Troque `loja/montagem.js` (quais bancas existem, onde e com quais produtos).
5. Troque `loja/beto.js` (nome, cargo, cor, categorias, segmentos, combos). O avatar em foto fica em `assets/beto-*.png`.
6. Troque `--acc` em `css/tokens.css` (cor da marca). O resto do visual acompanha.
7. Modelos 3D novos (outro tipo de produto): `js/cena/frutas.js` (`FDEF`) e embalagens em `js/cena/embalagens.js`.
8. Rode `__dbg.info()` e confira o console sem erros.

---

## 5. Peças principais

### 5.1 Beto (vendedor virtual) — `shared/vendedor.js`

`NewVendedor.create(config)` entrega avatar, chat (visual Liquid Glass), voz, microfone e cérebro. Campos principais de `config` (ver `loja/beto.js`):

- `id, nome, cargo, loja, cor, catalogo, categorias, segmentos, bundles, regras, modoPreco, dono`
- `avatar: { sprite:{idle,walk}, spriteH, portrait }` · `three: { THREE, scene, pos, pickMeshes, col }`
- `voz: { index, endpoint }` (frases gravadas + `/api/voz`) · `llm: { endpoint:'/api/vendedor/llm' }`
- `ganchos`: `carrinho()`, `adicionar(id,q)`, `remover(id)`, `mostrar(id,api,done)` (leva até a bancada), `fechar()`, `whatsapp()`, `foto(id)` (thumbnail), `midia(id)` (abre o totem), `destaque(ids)` (telão acompanha), `total()`

**IA:** `POST /api/vendedor/llm` recebe `{sistema, mensagem, historico, carrinho, total, catalogo}` e devolve `{reply, chips[], actions[]}`. Ações válidas: `add {id,qty}`, `show {id}`, `midia {id}`, `checkout`. O servidor só aceita ids do catálogo, limita 20 mensagens/min por IP e injeta o resumo de mídia/estoque reais. Se a rota falhar, o Beto volta para as regras.

Na tela, cada ação vira uma linha "✓ Adicionei 3× Tomate…". O microfone tem dock com onda ao vivo, texto parcial e botão Parar. Se o navegador bloquear, aparece um cartão com os passos para liberar.

### 5.2 Totem — `js/ui/totem.js` + `css/totem.css`

- Um totem 3D por box (`totem3D` em `js/cena/bancas.js`). Apontar e apertar **E** abre o painel.
- `NewTotem.init({api, catalogo, ilustra(id), onAdd(id), onChat(), lock(on)})` (em `js/ui/totem-ligacao.js`).
- `NewTotem.open({num, nome, cor, ids, atual, grupos})`. Com `grupos`, vira o totem da entrada (pavilhão completo).
- Cliente: foto/vídeo com selo, data, lote, origem, disponibilidade, aviso do dia. Botões "Adicionar à lista" e "Falar com o Beto".
- Dono (link "Sou o dono", PIN): abas **Beto** (conversa → propostas → confirmar), **Fotos** (enviar/apagar) e **Estoque** (chegou hoje / em falta).

### 5.3 Telão — `js/ui/telao.js`

- Tela 16:9 desenhada em canvas, **em pé sobre dois pés, logo atrás do lugar onde o Beto espera o cliente** (decisão do Rafael), virada para quem entra. As constantes `SX, SZ, ROT, SW, CY` ficam no topo do arquivo.
- Passa os produtos sozinho: fotos reais primeiro, depois a caixa 3D ilustrativa com origem e descrição.
- `telao.foco(ids)`: o Beto está falando desses produtos, então o telão mostra eles por ~35 s. `telao.mostra(id)` faz o mesmo para um produto. `telao.atualId()` devolve o produto em tela.
- A mira vem de longe (raio de 26 m, separado da mira comum de 7 m).

### 5.4 Modo dono e mídia — `sede-3d/ceasa-dono.mjs`

| Rota | Quem | O quê |
|---|---|---|
| `GET /api/ceasa/estado` | público | aviso, disponibilidade, chegada, preço de venda, mídias (sem custo) |
| `GET /api/ceasa/arquivo/:arquivo` | público | foto/vídeo (com Range para vídeo) |
| `GET /api/ceasa/dono/status` | público | `{temPin, logado}` |
| `POST /api/ceasa/dono/definir-pin` | **só local** | grava o PIN (scrypt). Não funciona atrás de proxy |
| `POST /api/ceasa/dono/login` | público | `{pin}` → token de 12 h. 5 erros em 10 min bloqueiam o IP |
| `POST /api/ceasa/dono/midia` | dono | corpo = arquivo; cabeçalhos `x-produto`, `x-fotografado-em` (AAAA-MM-DD), `x-lote`, `x-origem`, `x-nota`. Tipo validado pelos bytes; até 40 MB |
| `DELETE /api/ceasa/dono/midia/:id` | dono | apaga registro e arquivo |
| `GET /api/ceasa/dono/estado` | dono | estado completo (com custo) |
| `POST /api/ceasa/dono/beto` | dono | conversa com o Beto-funcionário → `{reply, propostas[]}` |
| `POST /api/ceasa/dono/aplicar` | dono | grava propostas confirmadas (`preco`, `custo`, `disponivel`, `chegada`, `nota`, `aviso`) |

O token vai no cabeçalho `x-dono-token`. A data de postagem é sempre do servidor.

Para definir o PIN no computador do servidor:

```bash
curl -X POST localhost:8099/api/ceasa/dono/definir-pin -d "{\"pin\":\"SEU-PIN\"}"
```

Imagens de demonstração (para mostrar como fica): `node sede-3d/ceasa-demo.mjs`. Para tirar: `node sede-3d/ceasa-demo.mjs --limpar`.

### 5.5 ERP — `erp-adapter.js`

Opcional. Configure `window.CEASA_ERP_CONFIG` antes do script (baseUrl, paths). Com ERP conectado, a lista de compras sincroniza preço, estoque e ativo por SKU. Sem ERP, usa o catálogo local. Nunca colocar segredo no navegador: autenticação por sessão HttpOnly no ERP.

---

## 6. Depuração

No console do navegador (os nomes de topo são globais, dá para inspecionar direto: `chatOn`, `cart`, `hov`, `P`, `BOXES`…):

- `__dbg.info()`: draw calls, triângulos, áreas de mira, instâncias.
- `__dbg.go(x, z, yaw, pitch)`: teleporta a câmera.
- `__dbg.add('laranja', 2)`: põe na lista. `__dbg.open()`: abre o checkout.
- `__dbg.pick()`: o que está no centro da tela (útil para achar objeto estranho na cena).
- `?preco=tabela`: mostra preços. `?hq=1`: visual completo, com sombras. `?lite=1`: modo leve.

---

## 7. Testes

```bash
cd sede-3d
node --test testes/ceasa/dono.test.mjs
```

Os 10 testes cobrem login, bloqueio por tentativas, PIN só local, upload, arquivo falso, data futura, custo privado, propostas inválidas, resumo honesto para o Beto, apagar mídia e imagens de demonstração.

Checklist manual a cada mudança na loja:
1. Console sem erro.
2. `__dbg.info()` igual ao de antes, se a mudança não era na cena.
3. Apontar numa caixa → ficha → **E** põe na lista.
4. Lista de compras, checkout (até "Enviar"), chat com o Beto, totem de um box, telão, tour (iniciar e pular).

---

## 8. Pendências conhecidas (05/11/2026)

- **PIN do dono** não definido. O login é por PIN simples. A regra da casa é login integrado ao Cofre: decidir se o modo dono entra no Cofre.
- **Fotos reais**: nenhuma ainda. Só o dono (Matheus) envia.
- **Celular**: funciona, mas a loja foi pensada para computador (WASD/mouse). No celular o HUD fica apertado.
- **Peso da cena**: na vista da entrada, `__dbg.info()` dá cerca de 2,25 milhões de triângulos (o número varia com o ângulo; de perto de uma banca, cerca de 0,95 milhão). Os paloxes com fruta em cima aumentaram o número. O `shared/perf.js` desliga as sombras e baixa a resolução sozinho em PC fraco.
- **Deploy**: nada no ar ainda. Para a VPS, o servidor precisa das mesmas variáveis de ambiente e de HTTPS (microfone).
- Os scripts clássicos com nomes globais foram escolhidos para não reescrever o código na refatoração. Migrar para ES modules de verdade é um passo futuro possível. Nesse caso, o estado de `js/nucleo/estado.js` vira um objeto exportado.
