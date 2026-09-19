# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 19/09/2026, 18:18:16.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-19 e versão carimbada 2026-09-19-04.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 43 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 40 |
| `recepcao` | Giullian Gomes (`consultora`) | 20 | 0 | 41 |
| `vet` | Suellen (`vet`) | 2 | 0 | 41 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 107 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 212 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 56 | 0 | 161 |

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
| `monitor` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `monitor` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/cobranca-almoco2/2026-09-19 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `plantonista` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | _(carga + entrada)_ | 38 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `mesa` | 2 | transaction daycare/cobranca-almoco2/2026-09-19 · transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `vet` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `supervisao` | _(carga + entrada)_ | 38 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `inicio` | 1 | transaction daycare/resumo-gestao/2026-09-19 |
| `supervisao` | `mesa` | 2 | transaction daycare/cobranca-almoco2/2026-09-19 · transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `supervisao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | _(carga + entrada)_ | 83 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `painel-amanda` | 7 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `gestao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `dashdc` | 7 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | _(carga + entrada)_ | 38 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 2 | transaction daycare/cobranca-almoco2/2026-09-19 · transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `turminha:ter` | 7 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-25 |

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
| `painelmeu` | Meu Dashboard | 1395 | 1802 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1297 | 435 | 324 | 0 | 2 | ok |
| `checkout` | Check-out 2 | 1645 | 1077 | 1012 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1279 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1290 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1523 | 2455 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1303 | 1787 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1333 | 3817 | 3971 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 20 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1271 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1565 | 278 | 241 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1487 | 2514 | 1809 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1318 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1371 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1408 | 7622 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1344 | 2176 | 2406 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1424 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1294 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1272 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1824 | 27857 | 42309 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1362 | 1516 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1364 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 1307 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1269 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1590 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1369 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1375 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1344 | 4767 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1282 | 719 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1307 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1303 | 1506 | 1806 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1488 | 294 | 316 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1554 | 2512 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1307 | 6317 | 3890 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1310 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1297 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1370 | 435 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1400 | 7741 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1402 | 2176 | 2406 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1392 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1310 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1295 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1777 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1319 | 719 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1362 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1397 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 1295 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1328 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1553 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1373 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1392 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1384 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1400 | 17922 | 13831 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1300 | 5135 | 4948 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1282 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1372 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1884 | 3639 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1587 | 1303 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9292 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9762 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9476 | 2516 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9319 | 6321 | 3890 | 0 | 7 | ok |
| `paineloperacao` | Dashboard da Márcia | 9319 | 7469 | 3990 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9383 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9327 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9362 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2398 | 435 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1416 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1565 | 4409 | 4812 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1345 | 2164 | 2406 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1340 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1443 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1309 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1310 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1841 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1355 | 719 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1382 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1379 | 2038 | 3700 | 0 | 7 | ok |
| `peso` | Peso | 1313 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1296 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1530 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1352 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1349 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1375 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1418 | 17922 | 13831 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1299 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1343 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1333 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1277 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1365 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1706 | 5684 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1539 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1528 | 5342 | 3824 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1544 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1515 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1520 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1583 | 7180 | 5365 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1555 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1520 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1556 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1516 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1524 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1618 | 4385 | 3745 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1561 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1624 | 3683 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1570 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1611 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1509 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2010 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1516 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1497 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1537 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1649 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1280 | 1506 | 1806 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1752 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1514 | 2522 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1287 | 6327 | 3890 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1432 | 7475 | 3990 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1456 | 6651 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1299 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1282 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1306 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1373 | 435 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1408 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1522 | 4419 | 4812 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1376 | 2174 | 2406 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1303 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1426 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1325 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1308 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1824 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1353 | 719 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1369 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1376 | 2038 | 3700 | 0 | 0 | ok |
| `peso` | Peso | 1305 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1332 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1572 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1309 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1392 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1367 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1368 | 17922 | 13831 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1316 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1323 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1353 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1293 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1359 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1594 | 5684 | 4097 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1552 | 5322 | 3719 | 0 | 7 | ok |
| `turminha:qua` | Quarta 47 | 1507 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1512 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1525 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1539 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1572 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1595 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1582 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1526 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1512 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1554 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1652 | 4386 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1582 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1630 | 3684 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1559 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1534 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1533 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2059 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1527 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1512 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1569 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1635 | 3579 | 3262 | 0 | 0 | ok |

