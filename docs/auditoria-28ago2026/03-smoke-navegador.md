# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 19/09/2026, 11:17:22.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-19 e versão carimbada 2026-09-19-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 31 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 29 |
| `recepcao` | Giullian Gomes (`consultora`) | 20 | 0 | 30 |
| `vet` | Suellen (`vet`) | 2 | 0 | 30 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 84 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 135 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 56 | 0 | 135 |

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
| `monitor` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `plantonista` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `recepcao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `recepcao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `vet` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `supervisao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `gestao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:seg` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `turminha:sex` | 2 | set daycare/dashboard-auto/2026-09-19 · push daycare/auditoria/2026-09-19 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `diretoria` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `atividade:agility` | 2 | set daycare/dashboard-auto/2026-09-19 · push daycare/auditoria/2026-09-19 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-24 |

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
| `painelmeu` | Meu Dashboard | 1289 | 1800 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1331 | 435 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 2 | 1579 | 1077 | 1012 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1249 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1428 | 2455 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1462 | 1812 | 1476 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1314 | 3817 | 3971 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 20 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1296 | 1506 | 1806 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1748 | 278 | 241 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1550 | 2512 | 1809 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1302 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1912 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1400 | 7622 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1429 | 2084 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1382 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1259 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1639 | 27857 | 42309 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1336 | 1276 | 1251 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1376 | 1739 | 3311 | 0 | 0 | ok |
| `peso` | Peso | 1270 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1444 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1325 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1317 | 4767 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1281 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1302 | 719 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1297 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1280 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1580 | 294 | 316 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1531 | 2510 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1317 | 6318 | 3890 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1273 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1402 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1340 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1446 | 7741 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1360 | 2084 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1407 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1311 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1268 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1732 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1306 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1389 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1431 | 1739 | 3311 | 0 | 0 | ok |
| `peso` | Peso | 1284 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1316 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1488 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1318 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1392 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1418 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1325 | 14663 | 11049 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1267 | 5135 | 4948 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1338 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1983 | 3641 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1552 | 1303 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1298 | 1506 | 1806 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1812 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1575 | 2514 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1733 | 6322 | 3890 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1385 | 7370 | 3972 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1433 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1284 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1351 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1317 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1319 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1417 | 4363 | 4819 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1316 | 2084 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1308 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1365 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1353 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1269 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1613 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1320 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1338 | 2029 | 3650 | 0 | 0 | ok |
| `peso` | Peso | 1322 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1579 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1712 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1389 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1367 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1365 | 14663 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1361 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1619 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1473 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1290 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1388 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1783 | 5684 | 4097 | 0 | 2 | ok |
| `turminha:ter` | Terça 46 | 1579 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1446 | 5323 | 3719 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1446 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1485 | 4969 | 3468 | 0 | 2 | ok |
| `atividade:agility` | Agility Funcional | 1600 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1543 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1494 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1557 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1529 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1454 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1423 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1581 | 4372 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1448 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1644 | 3685 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1707 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1599 | 2453 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1565 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2000 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1597 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1535 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1555 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1651 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1555 | 1506 | 1806 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1891 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1732 | 2520 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1324 | 6328 | 3890 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1626 | 7376 | 3972 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1415 | 6568 | 3564 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1443 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1411 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1355 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1332 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1508 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1750 | 4362 | 4819 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1624 | 2083 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1314 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1623 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1506 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1296 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1894 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1374 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1426 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1503 | 2029 | 3650 | 0 | 0 | ok |
| `peso` | Peso | 1325 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1364 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1590 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1374 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1409 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1376 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1522 | 14663 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1324 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1289 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1346 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1273 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1378 | 2243 | 1870 | 0 | 2 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1650 | 5684 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1616 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1591 | 5323 | 3719 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1603 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1737 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1664 | 356 | 425 | 0 | 2 | ok |
| `atividade:almoco` | Almoço | 1756 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 2028 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1606 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1614 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1548 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1595 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1603 | 4373 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1588 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1865 | 3686 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1651 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1586 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1512 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2009 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1422 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1428 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1543 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1576 | 3579 | 3262 | 0 | 0 | ok |

