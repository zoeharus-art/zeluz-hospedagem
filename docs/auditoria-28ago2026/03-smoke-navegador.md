# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 28/08/2026, 17:57:10.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).

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
| `monitor` | Felipe (`monitor`) | 9 | 0 | 4 |
| `plantonista` | Plantonista (`plantonista`) | 1 | 0 | 2 |
| `recepcao` | Giullian Gomes (`consultora`) | 13 | 0 | 2 |
| `vet` | Suellen (`vet`) | 2 | 0 | 2 |
| `supervisao` | Amanda Silva (`supervisor`) | 23 | 0 | 2 |
| `gestao` | Márcia · Gestora (`gestao`) | 49 | 0 | 4 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 49 | 0 | 9 |

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
| `monitor` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `monitor` | `atividade:checkin-corpo` | 2 | update daycare/chamada/2026-08-28 · push daycare/auditoria/2026-08-28 |
| `plantonista` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `recepcao` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `vet` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `supervisao` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `gestao` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `gestao` | `atividade:checkin-corpo` | 2 | update daycare/chamada/2026-08-28 · push daycare/auditoria/2026-08-28 |
| `diretoria` | _(carga + entrada)_ | 2 | update auaulandia/cadastro/charlotte__sabrina · update auaulandia/cadastro/lana__ |
| `diretoria` | `atividade:aulinha` | 2 | set daycare/dashboard-auto/2026-08-28 · push daycare/auditoria/2026-08-28 |
| `diretoria` | `atividade:checkin-corpo` | 2 | update daycare/chamada/2026-08-28 · push daycare/auditoria/2026-08-28 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-08-29 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-08-30 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-08-31 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 9 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `conferencia` | Conferência do check-in | 1297 | 380 | 469 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1286 | 3056 | 3051 | 0 | 0 | ok |
| `checkout` | Check-out | 1295 | 781 | 671 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1274 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1251 | 59 | 339 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1423 | 8478 | 6021 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1294 | 1229 | 1219 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1290 | 4762 | 4122 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1257 | 1547 | 1824 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Plantonista**, papel `plantonista`. 1 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `hospedagem` | Plantão da noite | 1266 | 3184 | 3252 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 13 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1283 | 2144 | 2306 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1313 | 8108 | 6776 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1272 | 450 | 411 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1284 | 5090 | 5039 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1288 | 1070 | 2798 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1283 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 1942 | 3607 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1319 | 4792 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1248 | 5161 | 6844 | 0 | 0 | ok |
| `peso` | Peso | 1280 | 704 | 674 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1269 | 2383 | 1770 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1272 | 488 | 542 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1263 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1258 | 759 | 804 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 704 | 674 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1345 | 2144 | 2306 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1286 | 380 | 469 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1275 | 759 | 804 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1352 | 8550 | 7018 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1349 | 9128 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1268 | 529 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 557 | 550 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1270 | 7079 | 7067 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 3 | 1303 | 3326 | 3822 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1266 | 1070 | 2798 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1269 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1276 | 1942 | 3607 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1330 | 4792 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1269 | 5161 | 6844 | 0 | 0 | ok |
| `peso` | Peso | 1272 | 704 | 674 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1316 | 3660 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1256 | 1303 | 1512 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1268 | 2383 | 1770 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1258 | 488 | 542 | 0 | 0 | ok |
| `config` | Configurações | 1261 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1304 | 44614 | 26817 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1284 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1288 | 2659 | 2127 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1252 | 2144 | 2306 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1303 | 380 | 469 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1277 | 759 | 804 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1342 | 4086 | 4553 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1361 | 8550 | 7018 | 0 | 0 | ok |
| `checkout` | Check-out | 1270 | 781 | 671 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1367 | 9128 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1294 | 529 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 557 | 550 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1285 | 7079 | 7067 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 3 | 1326 | 3326 | 3822 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1290 | 1070 | 2798 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1296 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1274 | 2232 | 3946 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1318 | 4792 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1258 | 5161 | 6844 | 0 | 0 | ok |
| `peso` | Peso | 1257 | 704 | 674 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1334 | 3660 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1257 | 1303 | 1512 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1271 | 2383 | 1770 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1276 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1257 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1319 | 44614 | 26817 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1272 | 2659 | 2127 | 0 | 0 | ok |
| `turminha:seg` | Segunda 43 | 1320 | 4732 | 3562 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1293 | 4885 | 3490 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1285 | 4885 | 3892 | 0 | 0 | ok |
| `turminha:qui` | Quinta 36 | 1271 | 4412 | 3250 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 52 | 1285 | 6155 | 4884 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1292 | 618 | 753 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1335 | 8705 | 6122 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1301 | 1456 | 1320 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1290 | 3027 | 3908 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1291 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1289 | 630 | 753 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1318 | 6155 | 4884 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1332 | 4989 | 4223 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1284 | 1774 | 1925 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1288 | 3988 | 4012 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1292 | 1748 | 1926 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1289 | 3262 | 2087 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1290 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1293 | 2479 | 3439 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1284 | 615 | 753 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1302 | 648 | 753 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1287 | 3021 | 3908 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1302 | 2407 | 2310 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1247 | 2144 | 2306 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1287 | 380 | 469 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1285 | 759 | 804 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1346 | 4086 | 4553 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1328 | 8550 | 7018 | 0 | 0 | ok |
| `checkout` | Check-out | 1275 | 781 | 671 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1320 | 9128 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1272 | 529 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1255 | 557 | 550 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1286 | 7079 | 7067 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 3 | 1323 | 3326 | 3822 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1286 | 1070 | 2798 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1270 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1257 | 2232 | 3946 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1321 | 4792 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1258 | 5161 | 6844 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 704 | 674 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1335 | 3660 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 1303 | 1512 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1276 | 2383 | 1770 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1269 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1271 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1259 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1293 | 44614 | 26817 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1284 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1289 | 2659 | 2127 | 0 | 0 | ok |
| `turminha:seg` | Segunda 43 | 1348 | 4732 | 3562 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1269 | 4885 | 3490 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1276 | 4885 | 3892 | 0 | 0 | ok |
| `turminha:qui` | Quinta 36 | 1299 | 4412 | 3250 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 52 | 1273 | 6155 | 4884 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1271 | 618 | 753 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1341 | 8705 | 6122 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1299 | 1456 | 1320 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1285 | 3027 | 3908 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1291 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1287 | 630 | 753 | 0 | 2 | ok |
| `atividade:chamada` | Chamada | 1299 | 6155 | 4884 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1289 | 4990 | 4223 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1331 | 1774 | 1925 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1299 | 3989 | 4012 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1305 | 1748 | 1926 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1279 | 3263 | 2087 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1274 | 580 | 526 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1271 | 2479 | 3439 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1288 | 615 | 753 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1286 | 648 | 753 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1274 | 3021 | 3908 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1303 | 2407 | 2310 | 0 | 1 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-08-28T20:54:33.235Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-28T20:55:13.325Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-28T20:56:28.037Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

