# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 07/09/2026, 21:11:31.
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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 3 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 5 |
| `recepcao` | Giullian Gomes (`consultora`) | 17 | 0 | 8 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 9 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 17 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 56 | 0 | 17 |

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
| `monitor` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `plantonista` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `plantonista` | `hospedagem` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `recepcao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `recepcao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-07 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-07 |
| `gestao` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `gestao` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `diretoria` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `diretoria` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-07 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-11 |
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
| `painelmeu` | Meu Painel | 1272 | 1520 | 1273 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1442 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1477 | 1523 | 1212 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1436 | 3332 | 3833 | 0 | 1 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 17 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1275 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1295 | 239 | 287 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1413 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1356 | 2160 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1311 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1406 | 7361 | 5813 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1381 | 2279 | 2453 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1514 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1342 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1309 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1331 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1480 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1315 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1334 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1377 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1327 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1416 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1333 | 688 | 715 | 0 | 1 | ok |
| `peso` | Peso | 1522 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1375 | 1348 | 1697 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1330 | 317 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1441 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1446 | 2158 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1348 | 2849 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1331 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1423 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1671 | 7361 | 5813 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1457 | 688 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1625 | 2279 | 2453 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1433 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1355 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1519 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1337 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1387 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1390 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1477 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1373 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1293 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1377 | 1023 | 881 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1277 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1333 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1337 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1475 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1484 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1355 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1424 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1392 | 453 | 349 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1456 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1364 | 2162 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1300 | 2853 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1813 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1713 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 2052 | 7361 | 5813 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1283 | 688 | 715 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1420 | 4365 | 5580 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1314 | 2279 | 2453 | 0 | 0 | ok |
| `checkout` | Check-out | 1316 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1266 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1299 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1473 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1576 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1411 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1551 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1392 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1280 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1269 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1326 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1279 | 4337 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1336 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1348 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1277 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1312 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1281 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1281 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1366 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1441 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1874 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 2168 | 4839 | 3840 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1620 | 4910 | 3442 | 0 | 1 | ok |
| `turminha:qua` | Quarta 45 | 1520 | 4957 | 3851 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1401 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1359 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1329 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1358 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1390 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1304 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1299 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1382 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1364 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1314 | 4025 | 2629 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1326 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1367 | 3379 | 2497 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1300 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1331 | 2448 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1280 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1281 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1280 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1299 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1293 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1333 | 3665 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1281 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1510 | 453 | 349 | 0 | 1 | ok |
| `painel-diretoria` | Painel da Diretoria | 1371 | 3662 | 2098 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1451 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1309 | 2168 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1304 | 2859 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1293 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1319 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1385 | 7361 | 5813 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1305 | 688 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1485 | 4365 | 5580 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1368 | 2279 | 2453 | 0 | 0 | ok |
| `checkout` | Check-out | 1285 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1295 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1414 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1379 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1312 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1340 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1359 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1573 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1451 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1630 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1277 | 4295 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1899 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1291 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1287 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1284 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1295 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1313 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1344 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1289 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1374 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1566 | 4839 | 3840 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1485 | 4910 | 3442 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1703 | 4957 | 3851 | 0 | 1 | ok |
| `turminha:qui` | Quinta 37 | 1568 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1407 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1405 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1465 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1403 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1399 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1374 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1367 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1392 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1366 | 4026 | 2629 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1356 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1405 | 3380 | 2497 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1327 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1344 | 2449 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1343 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1372 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1397 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1424 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1471 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1673 | 3665 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-08T00:07:12.762Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T00:08:04.541Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T00:08:57.324Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T00:09:57.366Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T00:10:31.361Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

