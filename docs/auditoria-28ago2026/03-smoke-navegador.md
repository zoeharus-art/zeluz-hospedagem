# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 04/09/2026, 13:45:16.
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
| `recepcao` | Giullian Gomes (`consultora`) | 16 | 0 | 19 |
| `vet` | Suellen (`vet`) | 2 | 0 | 15 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 22 |
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 26 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 22 |

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
| `plantonista` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `alergia` | 5 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva · transaction daycare/urgencias-enviadas/2026-09-04/entrevista-ella__yerkes%20pereira%20e%20silva |
| `vet` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `vet` | `peso` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | _(carga + entrada)_ | 14 | transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ · transaction auaulandia/med-tg-fila/-P0StKqnJepTVlmbmuyA |
| `supervisao` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `supervisao` | `alergia` | 5 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva · transaction daycare/urgencias-enviadas/2026-09-04/entrevista-ella__yerkes%20pereira%20e%20silva |
| `gestao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `alergia` | 5 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva · transaction daycare/urgencias-enviadas/2026-09-04/entrevista-ella__yerkes%20pereira%20e%20silva |
| `gestao` | `atividade:almoco` | 2 | set daycare/dashboard-auto/2026-09-04 · push daycare/auditoria/2026-09-04 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-05 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-07 |
| `diretoria` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o · transaction auaulandia/med-tg-fila/-P0S8GuT569m9ZQAD8Zq · transaction auaulandia/med-tg-fila/-P0SSw0_T4pzZWjX-2jQ |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `alergia` | 5 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva · transaction daycare/urgencias-enviadas/2026-09-04/entrevista-ella__yerkes%20pereira%20e%20silva |

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
| `painelmeu` | Meu Painel | 1280 | 1539 | 1295 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1253 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1254 | 59 | 339 | 0 | 1 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1269 | 1551 | 1234 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1259 | 4128 | 4087 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 16 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1518 | 1840 | 1899 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1585 | 324 | 287 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1477 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1342 | 2524 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1438 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1295 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1315 | 8217 | 7963 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1280 | 3729 | 5013 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1298 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1266 | 2296 | 3698 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1327 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1263 | 3442 | 5062 | 0 | 5 | ok |
| `peso` | Peso | 1282 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1268 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1282 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1280 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1357 | 805 | 759 | 0 | 0 | ok |
| `peso` | Peso | 1316 | 190 | 366 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1301 | 1840 | 1899 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1332 | 442 | 333 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in 2 | 1392 | 440 | 509 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1325 | 805 | 759 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1399 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1323 | 2524 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1405 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1300 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1345 | 822 | 622 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1313 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1413 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1317 | 3729 | 5013 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1304 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1283 | 2296 | 3698 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1358 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1284 | 3442 | 5062 | 0 | 5 | ok |
| `peso` | Peso | 1319 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1351 | 2136 | 1760 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1250 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1278 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1280 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1283 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1298 | 84499 | 38038 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1303 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1347 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1296 | 1840 | 1899 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1367 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1433 | 440 | 509 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1334 | 805 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1506 | 5116 | 6276 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1449 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1304 | 2524 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1298 | 1111 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1405 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1303 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1283 | 822 | 622 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1273 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1403 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1293 | 3977 | 5155 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1334 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1308 | 2586 | 4037 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1391 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1273 | 3442 | 5062 | 0 | 5 | ok |
| `peso` | Peso | 1274 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1360 | 2136 | 1760 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1290 | 3841 | 2693 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1803 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1291 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1280 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1281 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1266 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1288 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1347 | 84987 | 38387 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1297 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1407 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1386 | 4848 | 3918 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1283 | 4831 | 3494 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1309 | 4950 | 3931 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1320 | 4467 | 3276 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1324 | 6383 | 4914 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1376 | 593 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1335 | 9133 | 6343 | 0 | 2 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1322 | 1420 | 1279 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1285 | 3174 | 3955 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1276 | 569 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1287 | 605 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1287 | 6383 | 4914 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1297 | 5078 | 3739 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1272 | 2124 | 1988 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1501 | 4472 | 3611 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1406 | 1781 | 1989 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1361 | 2676 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1396 | 590 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1429 | 858 | 827 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1467 | 590 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1389 | 623 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1371 | 3168 | 3955 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1390 | 795 | 765 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1283 | 1840 | 1899 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1347 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1348 | 440 | 509 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1293 | 805 | 759 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1417 | 5116 | 6276 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1414 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1296 | 2524 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1296 | 1111 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1421 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1292 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1306 | 822 | 622 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1266 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1370 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1282 | 4929 | 5723 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1285 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1265 | 2586 | 4037 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1334 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1299 | 3442 | 5062 | 0 | 5 | ok |
| `peso` | Peso | 1278 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1337 | 2136 | 1760 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1271 | 3850 | 2693 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1564 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1278 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1357 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1368 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1297 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1338 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1327 | 85237 | 38497 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1316 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1428 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1587 | 4848 | 3918 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1378 | 4831 | 3494 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1410 | 4950 | 3931 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1520 | 4467 | 3276 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1380 | 6383 | 4914 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1413 | 593 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1467 | 9133 | 6343 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1538 | 1420 | 1279 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1397 | 3174 | 3955 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1444 | 569 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1370 | 605 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1436 | 6383 | 4914 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1372 | 5079 | 3739 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1348 | 2124 | 1988 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1528 | 4473 | 3611 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1398 | 1781 | 1989 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1342 | 2677 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1371 | 590 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1305 | 858 | 827 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1313 | 590 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1389 | 623 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1448 | 3168 | 3955 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1453 | 795 | 765 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-04T16:40:24.009Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T16:42:05.897Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T16:42:54.560Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T16:44:20.434Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

