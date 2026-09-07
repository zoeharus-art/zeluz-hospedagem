# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 07/09/2026, 18:48:17.
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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 2 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 3 |
| `recepcao` | Giullian Gomes (`consultora`) | 17 | 0 | 8 |
| `vet` | Suellen (`vet`) | 2 | 0 | 4 |
| `supervisao` | Amanda Silva (`supervisor`) | 26 | 0 | 10 |
| `gestao` | Márcia · Gestora (`gestao`) | 54 | 0 | 16 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 54 | 0 | 17 |

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
| `monitor` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `plantonista` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `recepcao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `recepcao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `vet` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `gestao` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | `turminha:qua` | 2 | set daycare/dashboard-auto/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `gestao` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `diretoria` | `turminha:ter` | 2 | set daycare/dashboard-auto/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-12 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1245 | 1520 | 1273 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1260 | 1523 | 1212 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1270 | 3332 | 3833 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 17 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1303 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1270 | 239 | 287 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1336 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1292 | 2160 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1277 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1340 | 7361 | 5813 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1289 | 2311 | 2340 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1290 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1267 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1279 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1287 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1320 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1274 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1255 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1259 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1260 | 649 | 715 | 0 | 0 | ok |
| `peso` | Peso | 1276 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 26 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1308 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1286 | 317 | 333 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1369 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1360 | 2158 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1318 | 434 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1464 | 7361 | 5813 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1286 | 688 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1585 | 2311 | 2340 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1304 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1271 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1390 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1277 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1288 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1291 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1315 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1260 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1285 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1301 | 1023 | 881 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1268 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1271 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1265 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1303 | 17578 | 10460 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1273 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1305 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 54 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1242 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1271 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1318 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1311 | 2162 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1275 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1289 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1338 | 7361 | 5813 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1281 | 688 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1326 | 4342 | 5580 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1275 | 2311 | 2340 | 0 | 0 | ok |
| `checkout` | Check-out | 1268 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1245 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1274 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1317 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1274 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1274 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1275 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1294 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1253 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1257 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1290 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1253 | 4334 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1303 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1282 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1263 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1273 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1257 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1286 | 17578 | 10460 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1335 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1296 | 5316 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1353 | 4910 | 3442 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1286 | 4957 | 3851 | 0 | 2 | ok |
| `turminha:qui` | Quinta 37 | 1451 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1424 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1344 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1438 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1335 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1345 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1482 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1305 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1377 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1356 | 4043 | 2629 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1402 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1512 | 3370 | 2497 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1309 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1330 | 2448 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1293 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1318 | 4220 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1503 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1421 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1274 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1287 | 3665 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 54 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1258 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1258 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1333 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1293 | 2168 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1272 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1286 | 434 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1393 | 7361 | 5813 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1268 | 688 | 715 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1338 | 4342 | 5580 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1286 | 2311 | 2340 | 0 | 0 | ok |
| `checkout` | Check-out | 1257 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1255 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1278 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1409 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1299 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1287 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1286 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1323 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1270 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1265 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1255 | 4340 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1338 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1274 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1270 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1259 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1507 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1315 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1339 | 17578 | 10460 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1311 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1391 | 4839 | 3840 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1283 | 4910 | 3442 | 0 | 2 | ok |
| `turminha:qua` | Quarta 45 | 1286 | 4957 | 3851 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1303 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1320 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1277 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1325 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1302 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1746 | 2522 | 3356 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1380 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1316 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1301 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1300 | 4044 | 2629 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1267 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1278 | 3371 | 2497 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1292 | 1371 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1281 | 2449 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1290 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1274 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1287 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1275 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1305 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1304 | 3665 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-07T21:44:37.233Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-07T21:45:20.316Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-07T21:46:04.857Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-07T21:47:26.792Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

