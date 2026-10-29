# Protocolo do executor (Claude) — fila do chefe

Estado compartilhado: `Ativos/sede-3d/data/estado.json` (a Sede lê e grava por `/api/sede/estado`, servidor `sede-3d/server.mjs`).
Quando o Rafael abrir uma sessão e disser "executa a fila", o executor faz **exatamente isto**:

1. **Ler** `data/estado.json`. Se `pausa === true`: **não fazer nada** e avisar "estou pausado".
2. Executar **só** tarefas com `status === "aprovada"`. Tarefas `pendente` esperam o OK do Rafael. `recusada` nunca roda.
3. Tipos:
   - `ler`: pesquisar/coletar (ex.: Google Maps pelo Chrome, ritmo humano). Salvar o resultado em `data/` e resumir.
   - `preparar`: escrever rascunho (abordagens, legendas, roteiros, relatório). Salvar em `data/rascunhos/`. **Não enviar nem publicar.**
   - `publicar` / `enviar`: só depois de `aprovada`; mostrar o texto final ao Rafael antes do envio e respeitar ritmo humano. Nunca disparo em massa.
4. Ao terminar cada tarefa: `status: "feita"`, `feitoEm: Date.now()`, `resultado: "<1 frase>"`, e acrescentar em `log` `{t: Date.now(), txt: "Executor (Claude): ..."}`.
5. **Sempre** atualizar `v` com `Date.now()` ao gravar (a Sede só aceita o arquivo se `v` for maior que o dela).
6. Nunca digitar senha, dados de cartão nem fazer pagamento. Se aparecer captcha, bloqueio ou pedido de login: parar e avisar.
7. Conferir `pausa` de novo antes de cada tarefa (o Rafael pode ter pausado no meio).

Campos de uma tarefa: `{id, titulo, detalhe, dono, tipo, status, criadoEm, feitoEm, resultado}`.
Estados: `pendente` → `aprovada` → `feita` (ou `recusada`).

## Leads do Tour NEW (página `Ativos/tour/index.html`)
- Cada pessoa que termina o tour vira um lead em `data/leads-tour.json` e **duas tarefas** na fila:
  1. `Preparar a Análise Estratégica de <empresa>` (preparar, já aprovada): o detalhe traz o resumo do diagnóstico.
  2. `Confirmar reunião com <nome> ...` (enviar, **pendente**): só enviar a mensagem de confirmação depois do OK do Rafael.
- Tarefas com prefixo `[TESTE]` vieram do modo `?teste=1`: não são pessoas reais, não enviar nada.
- O campo `ref` do lead diz qual criativo trouxe a pessoa (`?ref=`).
