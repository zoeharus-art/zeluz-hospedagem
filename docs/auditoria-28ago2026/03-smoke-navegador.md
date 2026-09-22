# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 22/09/2026, 05:04:31.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-06.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 5 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 4 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 3 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 54 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 141 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 143 |

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
| `monitor` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `plantonista` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-22 · push daycare/auditoria/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:chamada` | 1 | update daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-22 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `pessoas` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1361 | 1815 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1304 | 559 | 560 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1343 | 1281 | 1376 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1274 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1294 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1506 | 2569 | 1538 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1261 | 1827 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1281 | 2859 | 3216 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1320 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1910 | 385 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1486 | 3190 | 2094 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1292 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1344 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1413 | 6715 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1360 | 1215 | 1450 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1390 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1325 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1288 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1756 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1319 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1349 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1266 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1255 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1577 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 1943 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1354 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1413 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1333 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1267 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1268 | 487 | 484 | 0 | 1 | ok |
| `peso` | Peso | 1281 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9329 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9424 | 514 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9342 | 3188 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9293 | 6844 | 3962 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9288 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9345 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2255 | 559 | 560 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1332 | 6749 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1318 | 1215 | 1450 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1413 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1305 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1326 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1826 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1313 | 487 | 484 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1343 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1279 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1301 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1287 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1585 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2339 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1324 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1646 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1364 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1423 | 22395 | 16630 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1303 | 6394 | 5940 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1298 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1388 | 2243 | 1870 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1910 | 4156 | 3691 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1583 | 1485 | 1694 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9262 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9980 | 546 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9529 | 3192 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9308 | 6848 | 3962 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9379 | 8206 | 4377 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9375 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9276 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9307 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2284 | 559 | 560 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1333 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1442 | 2692 | 3052 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1315 | 1215 | 1450 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1269 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1335 | 14642 | 9883 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1310 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1662 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1301 | 487 | 484 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1298 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1337 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1267 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1282 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1458 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 1975 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1288 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1415 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1315 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1429 | 22395 | 16630 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1283 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1296 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1286 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1354 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1504 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1521 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1503 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1425 | 4970 | 3468 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1430 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1460 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1534 | 7192 | 5274 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1547 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1505 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1468 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1449 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1450 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1510 | 4391 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1447 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1547 | 3716 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1472 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1407 | 2460 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1449 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1819 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1459 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1431 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1464 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1488 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9255 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9566 | 546 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9367 | 3196 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9271 | 6852 | 3962 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9291 | 8210 | 4377 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9283 | 6858 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9360 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9272 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9289 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2263 | 559 | 560 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1347 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1444 | 2692 | 3052 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1286 | 1215 | 1450 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1284 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1392 | 14642 | 9883 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1279 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1274 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1595 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1289 | 487 | 484 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1264 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1301 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1266 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1245 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1470 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2048 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1290 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1475 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1325 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1382 | 22395 | 16630 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1280 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1301 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1302 | 1104 | 1676 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1310 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1489 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1481 | 6125 | 4139 | 0 | 1 | ok |
| `turminha:qua` | Quarta 47 | 1494 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1399 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1415 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1432 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1453 | 7192 | 5274 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1466 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1438 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1452 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1441 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1405 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1510 | 4392 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1443 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1501 | 3717 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1466 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1460 | 2461 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1459 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1747 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1423 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1410 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1454 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1452 | 3579 | 3262 | 0 | 0 | ok |

