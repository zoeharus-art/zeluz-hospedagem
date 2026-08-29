# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 29/08/2026, 20:41:17.
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
| `plantonista` | Plantonista (`plantonista`) | 1 | 0 | 0 |
| `recepcao` | Giullian Gomes (`consultora`) | 13 | 0 | 3 |
| `vet` | Suellen (`vet`) | 2 | 0 | 0 |
| `supervisao` | Amanda Silva (`supervisor`) | 23 | 0 | 3 |
| `gestao` | Márcia · Gestora (`gestao`) | 49 | 0 | 3 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 49 | 0 | 3 |

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
| `monitor` | `checkout` | 2 | transaction daycare/cobranca-almoco2/2026-08-29 · transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `monitor` | `atividade:checkin-corpo` | 2 | update daycare/chamada/2026-08-29 · push daycare/auditoria/2026-08-29 |
| `recepcao` | `hospedes` | 2 | transaction daycare/cobranca-almoco2/2026-08-29 · transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `supervisao` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-08-29 |
| `supervisao` | `conferencia` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `gestao` | `inicio` | 2 | transaction daycare/cobranca-almoco2/2026-08-29 · transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `diretoria` | `conferencia` | 2 | transaction daycare/cobranca-almoco2/2026-08-29 · transaction daycare/avisos-telegram-atraso/2026-08-29 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-29 |

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
| `conferencia` | Conferência do check-in | 1322 | 378 | 469 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1279 | 2695 | 3012 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1298 | 988 | 937 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1267 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1395 | 6206 | 4484 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1307 | 553 | 534 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1332 | 4756 | 3517 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1294 | 1355 | 1533 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Plantonista**, papel `plantonista`. 1 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `hospedagem` | Plantão da noite | 1278 | 3195 | 3263 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 13 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1308 | 2145 | 2266 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1336 | 8386 | 6986 | 0 | 2 | ok |
| `checkin` | Check-in 1 | 1301 | 450 | 411 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1315 | 5799 | 5758 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1292 | 1119 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1323 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1291 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1363 | 3624 | 2552 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1279 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1331 | 505 | 537 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1301 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 488 | 542 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1300 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1260 | 737 | 759 | 0 | 0 | ok |
| `peso` | Peso | 1263 | 505 | 537 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1319 | 2145 | 2266 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1548 | 378 | 469 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1301 | 737 | 759 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1374 | 8386 | 6986 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1402 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1370 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1298 | 471 | 320 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1301 | 7816 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1329 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1308 | 1119 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1349 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1281 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1403 | 3624 | 2552 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1310 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1344 | 505 | 537 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1448 | 3659 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1311 | 1638 | 1831 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1364 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1309 | 488 | 542 | 0 | 0 | ok |
| `config` | Configurações | 1324 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1391 | 21268 | 14593 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1335 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1801 | 17086 | 25387 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1287 | 2145 | 2266 | 0 | 2 | ok |
| `conferencia` | Conferência do check-in | 1348 | 378 | 469 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1630 | 737 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1637 | 4258 | 5610 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1430 | 8386 | 6986 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1353 | 988 | 937 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1433 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1312 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1306 | 471 | 320 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1356 | 7816 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1405 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1350 | 1119 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1407 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1304 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1379 | 3624 | 2552 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1278 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1318 | 505 | 537 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1394 | 3659 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1336 | 1638 | 1831 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1328 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1308 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1312 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1299 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1352 | 21268 | 14593 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1307 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1638 | 17086 | 25387 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1932 | 5710 | 4172 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1382 | 5151 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1292 | 5223 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1419 | 4535 | 3214 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1440 | 6112 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1418 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1421 | 7303 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1458 | 687 | 581 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1337 | 2721 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1391 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1380 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1487 | 6112 | 4215 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1401 | 4599 | 3733 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1369 | 1669 | 1730 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1407 | 3912 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1419 | 1606 | 1713 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1372 | 2682 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1373 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1381 | 3826 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1380 | 580 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1390 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1351 | 2715 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1387 | 3767 | 3390 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1314 | 2145 | 2266 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1436 | 378 | 469 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1828 | 737 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1779 | 4258 | 5610 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1462 | 8386 | 6986 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1398 | 988 | 937 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1445 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1302 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1315 | 471 | 320 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1302 | 7816 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1372 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1337 | 1119 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1330 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1290 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1399 | 3624 | 2552 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1300 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1289 | 505 | 537 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1390 | 3659 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1306 | 1638 | 1831 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1312 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1289 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1360 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1287 | 972 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1371 | 21268 | 14593 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1335 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1665 | 17086 | 25387 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1749 | 5710 | 4172 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1476 | 5151 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1372 | 5223 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1384 | 4535 | 3214 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1372 | 6112 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1395 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1403 | 7303 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1477 | 687 | 581 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1378 | 2721 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1432 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1389 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1404 | 6112 | 4215 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1390 | 4600 | 3733 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1379 | 1669 | 1730 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1402 | 3913 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1377 | 1606 | 1713 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1374 | 2683 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1376 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1365 | 3826 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1373 | 580 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1333 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1362 | 2715 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1372 | 3767 | 3390 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-08-29T23:37:55.146Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-29T23:38:39.294Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-29T23:40:02.358Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

