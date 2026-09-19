# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 19/09/2026, 13:04:08.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-19 e versão carimbada 2026-09-19-03.

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
| `recepcao` | Giullian Gomes (`consultora`) | 20 | 0 | 41 |
| `vet` | Suellen (`vet`) | 2 | 0 | 30 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 86 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 178 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 56 | 0 | 180 |

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
| `recepcao` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `recepcao` | `peso` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `recepcao` | `alergia` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `recepcao` | `vacinas` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `recepcao` | `emporio` | 3 | transaction daycare/avisos-telegram-atraso/2026-09-19 · set daycare/dashboard-auto/2026-09-22 · set daycare/dashboard-auto/2026-09-23 |
| `recepcao` | `reposicao` | 2 | set daycare/dashboard-auto/2026-09-24 · set daycare/dashboard-auto/2026-09-25 |
| `recepcao` | `renovacao` | 2 | set daycare/dashboard-auto/2026-09-26 · set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `agenda` | 2 | set daycare/dashboard-auto/2026-09-28 · set daycare/dashboard-auto/2026-09-29 |
| `vet` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `supervisao` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `supervisao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `supervisao` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 71 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `gestao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `peso` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | _(carga + entrada)_ | 71 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `ficha` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `atividade:agility` | 2 | set daycare/dashboard-auto/2026-09-19 · push daycare/auditoria/2026-09-19 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:peso` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |

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
| `painelmeu` | Meu Dashboard | 1260 | 1802 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1255 | 435 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 2 | 1273 | 1077 | 1012 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1271 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1416 | 2455 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1256 | 1814 | 1476 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1289 | 3817 | 3971 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 20 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9272 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9411 | 278 | 241 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9399 | 2514 | 1809 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9278 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9303 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9435 | 7622 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9396 | 2084 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9384 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 9350 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9279 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 9818 | 27857 | 42309 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9416 | 1516 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9353 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 9294 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9263 | 3660 | 5454 | 0 | 1 | ok |
| `vacinas` | Prevenção | 9524 | 17012 | 11762 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 9294 | 3655 | 5176 | 0 | 3 | ok |
| `reposicao` | Reposições 43 | 9317 | 5366 | 4313 | 0 | 2 | ok |
| `renovacao` | Renovação de planos | 9401 | 4767 | 3885 | 0 | 2 | ok |
| `agenda` | Agenda em breve | 9283 | 59 | 339 | 0 | 2 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1260 | 719 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9277 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9517 | 368 | 333 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9380 | 2512 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9301 | 6320 | 3890 | 0 | 2 | ok |
| `eahist` | Enriquecimento Ambiental | 9282 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9317 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2394 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1344 | 7741 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1379 | 2084 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1364 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1279 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1630 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1294 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1319 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1316 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 1293 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1269 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1466 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1288 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1339 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1349 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1349 | 17363 | 13499 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1285 | 5135 | 4948 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1287 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1355 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1724 | 3617 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1476 | 1303 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9276 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9743 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9446 | 2516 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9356 | 6324 | 3890 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9391 | 7372 | 3972 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9336 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9422 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9370 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2464 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1346 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1459 | 4330 | 4802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1335 | 2078 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1316 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1463 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1307 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1334 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1877 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1331 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1332 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1398 | 2038 | 3700 | 0 | 0 | ok |
| `peso` | Peso | 1296 | 298 | 471 | 0 | 2 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1250 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1548 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1313 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1316 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1313 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1347 | 17363 | 13499 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1279 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1312 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1311 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1252 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1379 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1590 | 5684 | 4097 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1448 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1530 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1487 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1526 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1513 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1540 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1522 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1526 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1574 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1486 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1472 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1552 | 4367 | 3745 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1495 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1607 | 3692 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1510 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1550 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1461 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1883 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1517 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1442 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1473 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1516 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9262 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9525 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9399 | 2522 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9390 | 6330 | 3890 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9349 | 7378 | 3972 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9337 | 6570 | 3564 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9293 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9339 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9401 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2813 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1473 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1551 | 4329 | 4802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1359 | 2083 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1279 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1462 | 10185 | 9234 | 0 | 2 | ok |
| `checkin` | Check-in | 1332 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1648 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1299 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1328 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1362 | 2038 | 3700 | 0 | 0 | ok |
| `peso` | Peso | 1304 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1492 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1342 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1334 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1402 | 17363 | 13499 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1269 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1296 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1303 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1333 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1555 | 5684 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1553 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1395 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1449 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1408 | 4969 | 3468 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1453 | 356 | 425 | 0 | 2 | ok |
| `atividade:almoco` | Almoço | 1491 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1523 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1465 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1579 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1487 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1495 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1562 | 4368 | 3745 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1532 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1694 | 3693 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1606 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1523 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1421 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1882 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1429 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1392 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1465 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1509 | 3579 | 3262 | 0 | 2 | ok |

