# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 24/09/2026, 15:17:08.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-24-06.

## O banco de mentira — a prova de que o teste não gasta a cota do Firebase

Desde 08/set/2026 o app em teste fala com o **emulador local** (porta 9000), carregado com o retrato
do backup da VPS. Antes, cada rodada abria 7 sessões novas no banco real e visitava todas as telas —
dezenas de MB por rodada, várias rodadas por dia: eram os "robôs" dos 695 MB de 08/set (teto: 360 MB/dia).

| Prova | Resultado |
|---|---|
| Modo | **emulador local** (padrão) |
| Conexões do navegador ao Firebase real | 0 — **nenhuma** |
| Bytes recebidos do Firebase real | 0 (0.00 MB) |

## Por que este teste existe

O `tests/harness.js` prova a lógica do app em caixa de areia — mas ele nunca abre a tela.
Um bug de **tela que abre vazia** passou quatro vezes por ele (a última corrigida no commit `d86a3dc`),
porque nenhuma prova de lógica enxerga um `<section>` em branco. Este teste entra com a senha de cada
papel, clica em cada item do menu e olha se apareceu alguma coisa.

## O guarda de escrita — a prova de que nada foi gravado

O app conversa com o Firebase **real**. Antes de o app carregar, um guarda embrulha
`set`, `update`, `push`, `remove`, `transaction`, `onDisconnect` e o `fetch`/`XHR` para o banco:
cada tentativa é anotada em `window.__ESCRITAS__` e **não é executada**.

| Prova | Resultado |
|---|---|
| Guarda ativo antes do app rodar | **sim** |
| Gravação forçada de mentira | `daycare/_smoke` com `set(1)` |
| A tentativa foi capturada | **sim** — método `set` |
| O nó existe no banco depois | **não** (leitura de volta veio vazia) |

Além disso, o teste **só navega**: clica em item de menu (`a[data-v]`), em categoria e em
sub-cabeçalho (`data-acc-toggle`) e nas abas do Day Care (`data-a`/`data-d`).
Nenhum botão de salvar, confirmar, avisar ou enviar foi tocado.

## Como saber que este teste não é teatro

Um teste que só dá "tudo certo" não vale nada enquanto ninguém provar que ele sabe reprovar.
Em 28/ago/2026 o teste foi rodado contra uma cópia do app com **dois defeitos plantados de propósito**:
a tela de Relatórios esvaziada e um `R$ NaN` na tela do Ritmo do Time.
Ele reprovou as duas, com captura de tela, e saiu com código 1:

```
gestao › ritmo       tela vazia — só 25 caracteres · texto quebrado na tela: NaN
gestao › relatorios  tela vazia — só 0 caracteres
```

Para repetir: suba um servidor que sirva o repositório trocando o `index.html` pela versão
com defeito e rode `SMOKE_BASE=http://127.0.0.1:8799 node tests/smoke-navegador.js`.

### O que conta como falha

| Regra | Reprova quando |
|---|---|
| Tela vazia | o `<section>` tem 40 caracteres de texto ou menos |
| Tela que não abriu | o item foi clicado e o `<section>` não ficou `active`, ou ficou invisível |
| Presa no carregando | o único texto da tela é "carregando" |
| Texto quebrado | aparece `undefined`, `NaN` ou `[object Object]` na tela |
| Erro de JavaScript | qualquer `pageerror` ou `console.error` que não seja ruído do laboratório |
| Menu travado | não deu para clicar no item (algo cobrindo, item inerte) |

Cada tela espera a rede aquietar (teto de 8000 ms) e só então mais 1200 ms — nunca um tempo fixo curto.

## Resumo

| Papel | Entrou como | Telas visitadas | Falhas | Escritas tentadas |
|---|---|---:|---:|---:|
| `monitor` | Felipe (`monitor`) | 6 | 0 | 11 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 8 |
| `recepcao` | Giullian Gomes (`consultora`) | 23 | 0 | 11 |
| `vet` | Suellen (`vet`) | 2 | 0 | 9 |
| `supervisao` | Amanda Silva (`supervisor`) | 31 | 0 | 65 |
| `gestao` | Márcia · Gestora (`gestao`) | 58 | 0 | 115 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 59 | 0 | 115 |

### O nome do papel e o que o app grava

Em alguns casos o nome que a gente usa não é a palavra que o app guarda em `body[data-role]`:

- **`recepcao`** entra como `consultora` — cadastro do banco (daycare/config/monitores).
- **`supervisao`** entra como `supervisor` — cadastro do banco (daycare/config/monitores).
- **`diretoria`** entra como `gestao` — senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria).

## Falhas encontradas — nenhuma

Nenhuma tela abriu vazia, presa no "carregando", com texto quebrado ou com erro de JavaScript.

## Telas que tentam GRAVAR só de abrir

Informação, não falha: são gravações que aconteceriam no banco real só por alguém abrir a tela.
Todas foram barradas pelo guarda.

| Papel | Tela | Tentativas | Caminhos |
|---|---|---:|---|
| `monitor` | _(carga + entrada)_ | 7 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `monitor` | `checkout` | 3 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 |
| `plantonista` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · push daycare/auditoria/2026-09-24 |
| `recepcao` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `recepcao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `vet` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `supervisao` | `mesa` | 3 | transaction daycare/turma/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `supervisao` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `supervisao` | `hoje` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `supervisao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `gestao` | `inicio` | 3 | transaction daycare/turma/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `turminha:qua` | 2 | transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:escova` | 1 | update daycare/dashboard-auto/2026-09-27 |
| `gestao` | `atividade:musicoterapia` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `diretoria` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `diretoria` | `inicio` | 3 | transaction daycare/turma/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `ficha` | 43 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `turminha:ter` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `diretoria` | `atividade:musicoterapia` | 1 | transaction daycare/falta-automatica/2026-09-24 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 6 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1245 | 1803 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1241 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1426 | 928 | 1088 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1254 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1366 | 2454 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1247 | 1815 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1243 | 2465 | 2585 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1292 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1507 | 252 | 303 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1373 | 3157 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1274 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1306 | 6546 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1286 | 821 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1317 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1273 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1586 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1304 | 1518 | 1463 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1318 | 2217 | 831 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1309 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1253 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1258 | 321 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1404 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1632 | 53046 | 51347 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1288 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1343 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1289 | 4613 | 3811 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1261 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1237 | 626 | 660 | 0 | 1 | ok |
| `peso` | Peso | 1253 | 321 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 31 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1273 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1419 | 460 | 348 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1361 | 3155 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1248 | 6882 | 3985 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1259 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1290 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1336 | 6563 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1279 | 821 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1319 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1258 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1584 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1278 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1259 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1323 | 2217 | 831 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1283 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1261 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1360 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1554 | 53046 | 51347 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1292 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1351 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1288 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1316 | 24367 | 17968 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1252 | 6900 | 6456 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1261 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1301 | 2523 | 2041 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1598 | 3978 | 3435 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1378 | 1266 | 1516 | 0 | 1 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1281 | 1767 | 2016 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1608 | 643 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1349 | 3159 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1266 | 6887 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1271 | 8533 | 4730 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1404 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1258 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1287 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1274 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1334 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1352 | 1948 | 2491 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1269 | 821 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1263 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1324 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1266 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1261 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1600 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1259 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1323 | 2217 | 831 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1280 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1256 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1259 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1243 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1395 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1617 | 53046 | 51347 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1297 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1328 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1282 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1306 | 24367 | 17968 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1256 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1276 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1247 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1296 | 2523 | 2041 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1578 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1395 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1533 | 5342 | 3824 | 0 | 2 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1487 | 5404 | 3834 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1496 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1411 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1500 | 7567 | 5392 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1459 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1476 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1469 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1373 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1401 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1477 | 4772 | 3862 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1404 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1496 | 4087 | 3671 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1445 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1404 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1410 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1690 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1376 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1368 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1452 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1508 | 3579 | 3264 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 59 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1266 | 1767 | 2016 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1630 | 643 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1366 | 3165 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1272 | 6892 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1262 | 8541 | 4730 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1416 | 6899 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1269 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1258 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1301 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1284 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1311 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1349 | 1948 | 2491 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1280 | 821 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1266 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1344 | 17185 | 10586 | 0 | 43 | ok |
| `checkin` | Check-in | 1266 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1251 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1542 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1268 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1257 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1338 | 2217 | 831 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1291 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1244 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1270 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1263 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1408 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1595 | 53046 | 51347 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1289 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1355 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1289 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1316 | 24367 | 17968 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1249 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1258 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1300 | 2523 | 2041 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1442 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1454 | 5461 | 3809 | 0 | 2 | ok |
| `turminha:qua` | Quarta 47 | 1464 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1507 | 5404 | 3834 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1420 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1355 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1381 | 7567 | 5392 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1452 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1423 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1431 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1360 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1387 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1508 | 4773 | 3862 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1397 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1584 | 4088 | 3671 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1430 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1350 | 2454 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1377 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1615 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1372 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1358 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1458 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1456 | 3579 | 3264 | 0 | 0 | ok |

