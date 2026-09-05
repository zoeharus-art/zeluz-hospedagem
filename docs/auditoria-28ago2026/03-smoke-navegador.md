# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 05/09/2026, 00:49:18.
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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 7 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 27 |
| `recepcao` | Giullian Gomes (`consultora`) | 16 | 0 | 31 |
| `vet` | Suellen (`vet`) | 2 | 0 | 27 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 38 |
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 45 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 42 |

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
| `monitor` | _(carga + entrada)_ | 7 | set auaulandia/med-vigia/2026-09-05 |
| `plantonista` | _(carga + entrada)_ | 27 | remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX · remove auaulandia/med-tg-fila/-P0USqvsz5hk51T-ReUm |
| `recepcao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX |
| `recepcao` | `ficha` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `recepcao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `vet` | _(carga + entrada)_ | 26 | remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX · remove auaulandia/med-tg-fila/-P0USqvsz5hk51T-ReUm |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX |
| `supervisao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `supervisao` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | `gestdia` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `supervisao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `gestao` | _(carga + entrada)_ | 26 | remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX · remove auaulandia/med-tg-fila/-P0USqvsz5hk51T-ReUm |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `ficha` | 1 | update daycare/checkin-corpo/2026-09-04 |
| `gestao` | `checkin` | 3 | update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `checkout` | 1 | update daycare/checkin-corpo/2026-09-04 |
| `gestao` | `checkoutconf` | 3 | update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `diretoria` | _(carga + entrada)_ | 23 | remove auaulandia/med-tg-fila/-P0USqR6Uz4RyqxHZEqA · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0USqciF0iQnZ6hK7xX · remove auaulandia/med-tg-fila/-P0USqvsz5hk51T-ReUm |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `checkout` | 2 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 |
| `diretoria` | `checkoutconf` | 2 | set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |

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
| `painelmeu` | Meu Painel | 1375 | 1531 | 1295 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1333 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1297 | 1516 | 1212 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1323 | 5189 | 4836 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 16 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1314 | 1492 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1365 | 239 | 287 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1630 | 9318 | 8441 | 0 | 1 | ok |
| `checkin` | Check-in | 1356 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1526 | 8637 | 6829 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1358 | 3028 | 3179 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1316 | 8217 | 7963 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1295 | 3497 | 6458 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1328 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1352 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1465 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1363 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1292 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1297 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1337 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1285 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1299 | 979 | 969 | 0 | 0 | ok |
| `peso` | Peso | 1285 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1335 | 1492 | 1733 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1352 | 442 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1553 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1519 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1384 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1450 | 8637 | 6829 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1496 | 979 | 969 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1333 | 3028 | 3179 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1383 | 759 | 632 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1442 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1412 | 11374 | 16288 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1516 | 3497 | 6458 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1402 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1484 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1513 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1892 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1306 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1522 | 1409 | 1174 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1408 | 472 | 465 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 2319 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1497 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1307 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1891 | 6005 | 3913 | 0 | 0 | ok (tem "carregando" na tela) |
| `agenda` | Agenda em breve | 1338 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1431 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1292 | 1437 | 1695 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1389 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1595 | 9318 | 8441 | 0 | 1 | ok |
| `checkin` | Check-in | 1479 | 414 | 376 | 0 | 3 | ok |
| `conferencia` | Conferência do check-in 2 | 1514 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1463 | 8637 | 6829 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1367 | 886 | 954 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 2119 | 6300 | 6236 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1365 | 3028 | 3179 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1411 | 1328 | 1056 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1328 | 759 | 632 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1310 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1483 | 11374 | 16288 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1402 | 3497 | 6458 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1385 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1323 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1427 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1314 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1360 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1453 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1317 | 4105 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1421 | 4563 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1509 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1332 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1415 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1344 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1344 | 1036 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1347 | 10129 | 6576 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1330 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1442 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1741 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1459 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1330 | 5194 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1418 | 4365 | 3140 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1495 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1379 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1459 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1418 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1385 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1396 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1359 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1391 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1329 | 4370 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1387 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1499 | 3679 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1378 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1401 | 2450 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1397 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1352 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1590 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1678 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1465 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1441 | 3659 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1289 | 1492 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1575 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1485 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1628 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1551 | 434 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 2220 | 8637 | 6829 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1683 | 979 | 969 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 2238 | 6208 | 6126 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1453 | 3028 | 3179 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1372 | 1328 | 1056 | 0 | 2 | ok |
| `checkoutconf` | Check-out com o tutor | 1712 | 759 | 632 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1354 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1598 | 11374 | 16288 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1778 | 3497 | 6458 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1409 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1471 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1544 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1358 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1366 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1401 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1338 | 4111 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 2408 | 4563 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1711 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1341 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1450 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1304 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1312 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1380 | 10129 | 6576 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1339 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1416 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1605 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1384 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1410 | 5194 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1425 | 4365 | 3140 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1347 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1394 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1459 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1508 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1371 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1400 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1346 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1493 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1515 | 4371 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1565 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1561 | 3680 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1428 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1446 | 2451 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1478 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1366 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1607 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1439 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1463 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1450 | 3659 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-05T03:44:09.826Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T03:45:14.767Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T03:46:14.289Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T03:47:14.525Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T03:48:03.531Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T03:49:03.544Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

