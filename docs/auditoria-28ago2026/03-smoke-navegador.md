# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 21/09/2026, 12:43:42.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 12 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 11 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 11 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 67 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 118 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 168 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `plantonista` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-21 |
| `plantonista` | `hospedagem` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-21 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `supervisao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-21 |
| `gestao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `hospedagem` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `acerto` | 3 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkout-corpo` | 3 | transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | _(carga + entrada)_ | 52 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-21 |
| `diretoria` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-21 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `painel-amanda` | 3 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `ficha` | 3 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `pessoas` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `turminha:seg` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:checkout-corpo` | 2 | set daycare/dashboard-auto/2026-09-24 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:foto` | 4 | set daycare/dashboard-auto/2026-09-25 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-26 |

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
| `painelmeu` | Meu Dashboard | 1393 | 1791 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1272 | 434 | 324 | 0 | 3 | ok |
| `checkout` | Check-out 5 | 1470 | 1101 | 1088 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1267 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1430 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1451 | 1803 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1368 | 3512 | 3966 | 0 | 2 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1280 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1720 | 332 | 303 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1454 | 2768 | 2037 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1322 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1493 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1394 | 7235 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1426 | 1892 | 2140 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1383 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1342 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1316 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1800 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1346 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1376 | 1854 | 3474 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1274 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1289 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1612 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1425 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1484 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1355 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1387 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1340 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1265 | 653 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1284 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1313 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1683 | 523 | 477 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1514 | 2766 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1298 | 6606 | 3873 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1365 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1319 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1393 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1382 | 7286 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1518 | 1892 | 2140 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1487 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1376 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1313 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1824 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1343 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1353 | 1562 | 1513 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1381 | 1854 | 3474 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1312 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1333 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1405 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1614 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1596 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1412 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1472 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1505 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1474 | 18981 | 14560 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1453 | 6131 | 5621 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1367 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1547 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 2444 | 3708 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1695 | 1287 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1281 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1995 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1765 | 2770 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1751 | 6610 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1724 | 7758 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1344 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1280 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1326 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1389 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1396 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1532 | 3881 | 4319 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1430 | 1892 | 2140 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1298 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1432 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1300 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1339 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1942 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1355 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1376 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1398 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1300 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1295 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1418 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1586 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1617 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1327 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1427 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1374 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1427 | 18981 | 14560 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1280 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1337 | 6131 | 5621 | 0 | 3 | ok |
| `pessoas` | Time | 1316 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1278 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1426 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda · hoje 44 | 2195 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1538 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1580 | 5342 | 3824 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1500 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1504 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1547 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1625 | 7367 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1592 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1537 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1579 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1633 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1579 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1777 | 4504 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1542 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1527 | 3788 | 3574 | 0 | 3 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1566 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1546 | 2470 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1551 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1798 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1539 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1483 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1577 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1658 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9316 | 1512 | 1768 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9815 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9509 | 2776 | 2037 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9318 | 6616 | 3873 | 0 | 3 | ok |
| `paineloperacao` | Dashboard da Márcia | 9317 | 7764 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9362 | 6671 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9279 | 451 | 505 | 0 | 1 | ok |
| `linhadotempo` | Linha do tempo do dia | 9317 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9355 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2526 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1422 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1505 | 3881 | 4319 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1311 | 1892 | 2140 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1272 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1490 | 10185 | 9234 | 0 | 3 | ok |
| `checkin` | Check-in | 1334 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1273 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1758 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1306 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1467 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1456 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1311 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1346 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1352 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1535 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1469 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1328 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1318 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1482 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1393 | 18981 | 14560 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1286 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1302 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1363 | 1104 | 1676 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1330 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1364 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1683 | 5615 | 4111 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1547 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1504 | 5342 | 3824 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1564 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1521 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1522 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1578 | 7367 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1557 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1593 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1564 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1454 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1426 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1719 | 4505 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1678 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1662 | 3789 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1582 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1556 | 2471 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1650 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2006 | 4151 | 4559 | 0 | 4 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1438 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1495 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1527 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1656 | 3579 | 3262 | 0 | 0 | ok |

