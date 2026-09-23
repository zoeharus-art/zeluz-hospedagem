# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 23/09/2026, 13:27:09.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-23-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 13 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 10 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 13 |
| `vet` | Suellen (`vet`) | 2 | 0 | 11 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 74 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 120 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 121 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-23 |
| `monitor` | `checkout` | 3 | transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `plantonista` | _(carga + entrada)_ | 10 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-23 |
| `recepcao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `vacinas` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `vet` | _(carga + entrada)_ | 10 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-23 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-23 |
| `supervisao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-23 |
| `supervisao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `supervisao` | `painel-amanda` | 3 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `checkoutconf` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `inicio` | 3 | transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `turminha:seg` | 3 | transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:almoco2` | 1 | update daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:checkin-corpo` | 2 | set daycare/dashboard-auto/2026-09-25 · transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:jogos` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `diretoria` | `inicio` | 1 | transaction daycare/turma/2026-09-23 |
| `diretoria` | `mesa` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 2 | set daycare/dashboard-auto/2026-09-23 · push daycare/auditoria/2026-09-23 |
| `diretoria` | `turminha:seg` | 3 | transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:almoco2` | 1 | update daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-23 · set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:foto` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1267 | 1798 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1252 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1274 | 806 | 1088 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1265 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1285 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1457 | 2478 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1250 | 1810 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1261 | 2519 | 2596 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1263 | 1769 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1443 | 316 | 303 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1362 | 3164 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1274 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1351 | 6450 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1286 | 1169 | 1369 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1356 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1270 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1253 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1574 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1313 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1357 | 2231 | 3837 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1252 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1255 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1509 | 24799 | 14879 | 0 | 1 | ok |
| `vencimentos` | Vence amanhã (44) | 1741 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1352 | 6942 | 4704 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1296 | 4613 | 3811 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1249 | 641 | 684 | 0 | 1 | ok |
| `peso` | Peso | 1245 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9281 | 1769 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9474 | 524 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9401 | 3162 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9277 | 6903 | 3985 | 0 | 3 | ok |
| `eahist` | Enriquecimento Ambiental | 9286 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9543 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2517 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1309 | 6484 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1280 | 1169 | 1369 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1333 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1287 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 619 | 607 | 0 | 1 | ok |
| `recepcao` | Pendências com o tutor | 1867 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1296 | 641 | 684 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1328 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1406 | 2231 | 3837 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1267 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1265 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1276 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1579 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2404 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1320 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1576 | 6942 | 4704 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1300 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1362 | 22787 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1260 | 6645 | 6137 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1263 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1308 | 2243 | 1870 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1732 | 3996 | 3811 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1384 | 1433 | 1729 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1254 | 1769 | 2016 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1905 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1395 | 3166 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1471 | 6907 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1368 | 8290 | 4511 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1382 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1279 | 524 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1313 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1342 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1377 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1506 | 2347 | 2696 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1319 | 1169 | 1369 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1303 | 711 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1383 | 17185 | 10586 | 0 | 1 | ok |
| `checkin` | Check-in | 1319 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1565 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1322 | 641 | 684 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1328 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1375 | 2521 | 4176 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1268 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1297 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1299 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1576 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2290 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1520 | 6942 | 4704 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1328 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1356 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1263 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1261 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1277 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1362 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1691 | 5016 | 3782 | 0 | 3 | ok |
| `turminha:ter` | Terça 46 | 1544 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1457 | 6345 | 4470 | 0 | 0 | ok |
| `turminha:qui` | Quinta 44 | 1453 | 5070 | 3808 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1440 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1380 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1538 | 7302 | 5259 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1518 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1490 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1517 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1455 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1450 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1695 | 4466 | 3765 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1521 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1511 | 3791 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1437 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1439 | 2477 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1445 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1948 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1534 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1446 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1435 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1540 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1251 | 1769 | 2016 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1775 | 644 | 494 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1374 | 3172 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1431 | 6913 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1266 | 8296 | 4511 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1266 | 6899 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1263 | 524 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1265 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1340 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1477 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1499 | 2348 | 2696 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1313 | 1170 | 1369 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1283 | 711 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1512 | 17185 | 10586 | 0 | 1 | ok |
| `checkin` | Check-in | 1326 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1590 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1368 | 641 | 684 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1443 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1551 | 2521 | 4176 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1296 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1308 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1333 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1617 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2328 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1338 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1422 | 6942 | 4704 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1421 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1348 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1278 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1294 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1294 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1265 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1309 | 2243 | 1870 | 0 | 2 | ok |
| `turminha:seg` | Segunda 44 | 1636 | 5016 | 3782 | 0 | 3 | ok |
| `turminha:ter` | Terça 46 | 1511 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1445 | 6345 | 4470 | 0 | 0 | ok |
| `turminha:qui` | Quinta 44 | 1428 | 5070 | 3808 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1576 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1519 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1475 | 7302 | 5259 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1502 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1477 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1505 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1402 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1386 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1488 | 4467 | 3765 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1448 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1682 | 3792 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1647 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1593 | 2478 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1523 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1969 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1540 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1437 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1461 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1491 | 3579 | 3262 | 0 | 0 | ok |

