# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 08/09/2026, 12:46:49.
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
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 6 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 9 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 8 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 9 |

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
| `monitor` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `plantonista` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `recepcao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-08 |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `diretoria` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |

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
| `painelmeu` | Meu Painel | 1264 | 1803 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1260 | 1815 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1318 | 3453 | 3348 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1373 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1310 | 395 | 287 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1397 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1419 | 2150 | 1712 | 0 | 0 | ok |
| `checkin` | Check-in | 1274 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1351 | 7089 | 5571 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1304 | 1450 | 1714 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1274 | 9894 | 9039 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1272 | 2921 | 2056 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1288 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1287 | 2344 | 3552 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1353 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1256 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1258 | 545 | 423 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1276 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1298 | 652 | 715 | 0 | 0 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1308 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1319 | 381 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1344 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1336 | 2148 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1268 | 3382 | 1924 | 0 | 0 | ok |
| `checkin` | Check-in | 1284 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1304 | 434 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1358 | 7089 | 5571 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1272 | 652 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1305 | 1450 | 1714 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1258 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1269 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1393 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1297 | 2921 | 2056 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1294 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1287 | 2344 | 3552 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1362 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1271 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1284 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1303 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1260 | 545 | 423 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1256 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1269 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1270 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1270 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1329 | 28153 | 16633 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1293 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1480 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1264 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1325 | 453 | 349 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1360 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1305 | 2152 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1273 | 3386 | 1924 | 0 | 0 | ok |
| `checkin` | Check-in | 1279 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1319 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1509 | 7089 | 5571 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1302 | 652 | 715 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1410 | 3649 | 4558 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1320 | 1450 | 1714 | 0 | 0 | ok |
| `checkout` | Check-out | 1287 | 910 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1269 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1267 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1339 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1297 | 2921 | 2056 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1287 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 2634 | 3891 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1323 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1281 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1306 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1360 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1279 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1282 | 4308 | 2652 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1325 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1282 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1271 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1267 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1349 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1262 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1289 | 28804 | 17035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1277 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1373 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1364 | 4932 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1303 | 5191 | 4071 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1397 | 5073 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 39 | 1286 | 4328 | 3528 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1383 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1362 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1420 | 7701 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1361 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1398 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1395 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1396 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1492 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1372 | 4504 | 3582 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1449 | 1513 | 1569 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1465 | 3930 | 3468 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1373 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1328 | 2475 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1302 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1349 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1301 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1299 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1339 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1354 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1256 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1299 | 453 | 349 | 0 | 0 | ok |
| `painel-diretoria` | Painel da Diretoria | 1284 | 3673 | 2098 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1355 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1299 | 2159 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1284 | 3503 | 1978 | 0 | 0 | ok |
| `checkin` | Check-in | 1272 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1279 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1363 | 7089 | 5571 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1286 | 652 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1366 | 3649 | 4558 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1450 | 1714 | 0 | 0 | ok |
| `checkout` | Check-out | 1303 | 910 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1242 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1263 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1351 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 3157 | 2198 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1273 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1290 | 2634 | 3891 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1381 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1279 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1270 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1302 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1273 | 4314 | 2652 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1329 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1278 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1274 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1276 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1259 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1289 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1295 | 29173 | 17254 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1337 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1356 | 4932 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1284 | 5191 | 4071 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1287 | 5073 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 39 | 1291 | 4328 | 3528 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1315 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1335 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1382 | 7701 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1300 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1305 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1333 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1289 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1298 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1273 | 4505 | 3582 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1303 | 1513 | 1569 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1398 | 3931 | 3468 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1301 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1277 | 2476 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1269 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1275 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1301 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1266 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1274 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1375 | 3668 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-08T15:42:55.812Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T15:43:41.211Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T15:44:27.932Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T15:45:55.642Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

