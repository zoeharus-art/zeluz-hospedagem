# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 04/09/2026, 17:33:03.
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
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 13 |
| `recepcao` | Giullian Gomes (`consultora`) | 16 | 0 | 20 |
| `vet` | Suellen (`vet`) | 2 | 0 | 14 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 22 |
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 22 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 23 |

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
| `monitor` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `monitor` | `agenda` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `plantonista` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `vet` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `supervisao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `gestao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `diretoria` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |

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
| `painelmeu` | Meu Painel | 1279 | 1539 | 1295 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1249 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1241 | 59 | 339 | 0 | 1 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1284 | 1551 | 1234 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1293 | 4128 | 4087 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 16 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1295 | 1490 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1295 | 395 | 287 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1320 | 8145 | 6596 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1326 | 2613 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1400 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1299 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1305 | 8217 | 7963 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 4122 | 8015 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1295 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1275 | 2436 | 3834 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1355 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1283 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1283 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1280 | 3865 | 2743 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1259 | 805 | 759 | 0 | 0 | ok |
| `peso` | Peso | 1285 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1325 | 1490 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1378 | 457 | 333 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1368 | 293 | 252 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1310 | 805 | 759 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1378 | 8145 | 6596 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1292 | 2613 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1380 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1297 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1295 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1285 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1391 | 11553 | 16526 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1328 | 4122 | 8015 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1307 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1283 | 2436 | 3834 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1344 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1288 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1270 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1316 | 1696 | 1394 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1282 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1295 | 3865 | 2743 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1278 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1290 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1300 | 103707 | 47683 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1292 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1364 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1490 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1305 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1344 | 293 | 252 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1316 | 805 | 759 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1437 | 5235 | 6276 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1387 | 8145 | 6596 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1300 | 2613 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out | 1310 | 1094 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1397 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1277 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1281 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1295 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1432 | 11553 | 16526 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1300 | 4122 | 8015 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1293 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 2726 | 4173 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1367 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1268 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1280 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1330 | 1696 | 1394 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1263 | 4220 | 2775 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1728 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1286 | 3865 | 2743 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1281 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1303 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1278 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1288 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1328 | 103707 | 47683 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1319 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1364 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1474 | 4601 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1329 | 4579 | 3393 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1337 | 4695 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1344 | 4187 | 3120 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1355 | 6083 | 4813 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1306 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1513 | 8958 | 6337 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1389 | 1588 | 1591 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1316 | 2937 | 3854 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1375 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1310 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1374 | 6083 | 4813 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1420 | 5120 | 3865 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1365 | 1887 | 1887 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1439 | 4235 | 3690 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1315 | 1544 | 1888 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1344 | 2439 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1326 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1347 | 2704 | 3268 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1307 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1346 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1371 | 2931 | 3854 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1382 | 2377 | 2214 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1259 | 1490 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1342 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1339 | 293 | 252 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1302 | 805 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1418 | 5235 | 6276 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1390 | 8145 | 6596 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1290 | 2613 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out | 1281 | 1094 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1366 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1288 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1282 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1281 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1386 | 11553 | 16526 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1294 | 4122 | 8015 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1300 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1284 | 2726 | 4173 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1345 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1276 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1283 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 1696 | 1394 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1270 | 4226 | 2775 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1714 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1294 | 3865 | 2743 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1292 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1286 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1269 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1281 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1298 | 103760 | 47719 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1317 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1383 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1467 | 4601 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1332 | 4579 | 3393 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1292 | 4695 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1359 | 4187 | 3120 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1316 | 6083 | 4813 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1360 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1467 | 8958 | 6337 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1378 | 1588 | 1591 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1396 | 2937 | 3854 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1386 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1376 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1380 | 6083 | 4813 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1346 | 5121 | 3865 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1319 | 1887 | 1887 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1484 | 4227 | 3675 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1349 | 1544 | 1888 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1292 | 2440 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1347 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1306 | 2704 | 3268 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1308 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1373 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1305 | 2931 | 3854 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1365 | 2377 | 2214 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-04T20:29:16.006Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T20:30:00.854Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T20:30:45.741Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T20:32:10.272Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

