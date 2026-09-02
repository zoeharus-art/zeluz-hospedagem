# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 02/09/2026, 08:09:23.
> Servidor: servidor já no ar na porta 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).

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
| `monitor` | Felipe (`monitor`) | 3 | 0 | 14 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 14 |
| `recepcao` | Giullian Gomes (`consultora`) | 15 | 0 | 14 |
| `vet` | Suellen (`vet`) | 2 | 0 | 14 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 21 |
| `gestao` | Márcia · Gestora (`gestao`) | 52 | 0 | 28 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 52 | 0 | 29 |

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
| `monitor` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `monitor` | `agenda` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `plantonista` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `vet` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-02 |
| `supervisao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `supervisao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `supervisao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-02 · update daycare/checkin-corpo/2026-09-01 · update daycare/checkout-corpo/2026-09-01 · set daycare/limpeza-fotos/2026-09-02 |
| `supervisao` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-02 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `gestao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `gestao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-02 |
| `gestao` | `cuidadovet` | 4 | update daycare/checkin-corpo/2026-09-01 · update daycare/checkout-corpo/2026-09-01 · set daycare/limpeza-fotos/2026-09-02 · push daycare/auditoria/2026-09-02 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-02 |
| `gestao` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-01 · update daycare/checkout-corpo/2026-09-01 · set daycare/limpeza-fotos/2026-09-02 · push daycare/auditoria/2026-09-02 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-03 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-04 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-05 |
| `diretoria` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-02 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `diretoria` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-02 · update daycare/checkin-corpo/2026-09-01 · update daycare/checkout-corpo/2026-09-01 · set daycare/limpeza-fotos/2026-09-02 |
| `diretoria` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-01 · update daycare/checkout-corpo/2026-09-01 · set daycare/limpeza-fotos/2026-09-02 · push daycare/auditoria/2026-09-02 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-02 |
| `diretoria` | `atividade:almoco2` | 2 | set daycare/dashboard-auto/2026-09-02 · push daycare/auditoria/2026-09-02 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-03 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-04 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-05 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 3 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1306 | 1521 | 1273 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1300 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1332 | 59 | 339 | 0 | 1 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1330 | 1533 | 1212 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1328 | 3320 | 3311 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 15 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1409 | 1584 | 1785 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1308 | 213 | 271 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1390 | 7687 | 6242 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1371 | 1773 | 2058 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1302 | 437 | 411 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1320 | 6969 | 6688 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1327 | 1482 | 3826 | 0 | 1 | ok |
| `reposicao` | Reposições 3 | 1367 | 1378 | 1113 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1284 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1373 | 7341 | 4965 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1282 | 3487 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1351 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1297 | 2244 | 1669 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1304 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1294 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1285 | 670 | 804 | 0 | 0 | ok |
| `peso` | Peso | 1292 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1325 | 1584 | 1785 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1339 | 307 | 333 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1417 | 561 | 600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1346 | 670 | 804 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1495 | 7687 | 6242 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1338 | 1773 | 2058 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1446 | 9225 | 8378 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1311 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1306 | 851 | 878 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1339 | 9032 | 8758 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1447 | 3690 | 4192 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1317 | 1482 | 3826 | 0 | 1 | ok |
| `reposicao` | Reposições 3 | 1355 | 1378 | 1113 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1322 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1409 | 7341 | 4965 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1323 | 3487 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1337 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1385 | 3437 | 2786 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1356 | 3618 | 3431 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1314 | 2244 | 1669 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1278 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1331 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1369 | 12044 | 8079 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1314 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1570 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 52 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1264 | 1584 | 1785 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1391 | 358 | 349 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1355 | 561 | 600 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1311 | 670 | 804 | 0 | 4 | ok |
| `hospedagem` | Plantão da noite | 1571 | 3593 | 4384 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1382 | 7687 | 6242 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1773 | 2058 | 0 | 0 | ok |
| `checkout` | Check-out | 1302 | 877 | 983 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1417 | 9225 | 8378 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1344 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1313 | 851 | 878 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1308 | 9032 | 8758 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1360 | 3690 | 4192 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1359 | 1482 | 3826 | 0 | 1 | ok |
| `reposicao` | Reposições 3 | 1342 | 1378 | 1113 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1332 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1459 | 7341 | 4965 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1294 | 3487 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1364 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1420 | 3437 | 2786 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1304 | 3618 | 3431 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1321 | 2244 | 1669 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1305 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1396 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1301 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1276 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1329 | 12044 | 8079 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1378 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 43 | 1437 | 5097 | 3560 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1342 | 5077 | 3458 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1317 | 5477 | 3912 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1360 | 4567 | 3241 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1371 | 6040 | 4265 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1434 | 584 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1436 | 7599 | 5350 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1523 | 688 | 581 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1390 | 2747 | 3450 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1392 | 560 | 526 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1433 | 596 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1431 | 6040 | 4265 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1397 | 4565 | 3733 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1376 | 1694 | 1751 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1502 | 3909 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1411 | 1605 | 1734 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1378 | 2690 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1337 | 581 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1298 | 4398 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1365 | 581 | 526 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1312 | 614 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1341 | 2741 | 3450 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1395 | 3763 | 3363 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 52 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1275 | 1584 | 1785 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1411 | 358 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1351 | 561 | 600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1360 | 670 | 804 | 0 | 6 | ok |
| `hospedagem` | Plantão da noite | 1647 | 3593 | 4384 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1392 | 7687 | 6242 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1773 | 2058 | 0 | 0 | ok |
| `checkout` | Check-out | 1350 | 877 | 983 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1464 | 9225 | 8378 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1313 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1293 | 851 | 878 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1323 | 9032 | 8758 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1385 | 3690 | 4192 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1316 | 1482 | 3826 | 0 | 1 | ok |
| `reposicao` | Reposições 3 | 1363 | 1378 | 1113 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1343 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1449 | 7341 | 4965 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1317 | 3487 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1315 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1416 | 3437 | 2786 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1367 | 3618 | 3431 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1312 | 2244 | 1669 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1310 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1436 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1300 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1362 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1708 | 12044 | 8079 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1304 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1433 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 43 | 1454 | 5097 | 3560 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1304 | 5077 | 3458 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1361 | 5477 | 3912 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1376 | 4567 | 3241 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1377 | 4548 | 3241 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1400 | 584 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1425 | 7599 | 5350 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1480 | 688 | 581 | 0 | 2 | ok |
| `atividade:livre` | Atividade livre | 1324 | 2747 | 3450 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1318 | 560 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1371 | 596 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1388 | 6040 | 4265 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1392 | 4566 | 3733 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1413 | 1692 | 1751 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1456 | 3910 | 3601 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1380 | 1605 | 1734 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1355 | 2691 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1402 | 581 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1386 | 4398 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1579 | 581 | 526 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1434 | 614 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1314 | 2741 | 3450 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1387 | 3763 | 3363 | 0 | 1 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-02T11:06:13.204Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-02T11:07:02.727Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-02T11:08:29.152Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

