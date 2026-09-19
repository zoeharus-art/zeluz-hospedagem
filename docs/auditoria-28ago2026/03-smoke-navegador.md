# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 19/09/2026, 19:50:05.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-19 e versão carimbada 2026-09-19-05.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 49 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 47 |
| `recepcao` | Giullian Gomes (`consultora`) | 21 | 0 | 61 |
| `vet` | Suellen (`vet`) | 2 | 0 | 47 |
| `supervisao` | Amanda Silva (`supervisor`) | 29 | 0 | 129 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 176 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 240 |

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
| `monitor` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `monitor` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-19 |
| `monitor` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/cobranca-almoco2/2026-09-19 · transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `plantonista` | _(carga + entrada)_ | 46 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `plantonista` | `hospedagem` | 1 | transaction daycare/cobranca-almoco2/2026-09-19 |
| `recepcao` | _(carga + entrada)_ | 47 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `pendencias` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `recepcao` | `peso` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `recepcao` | `alergia` | 2 | set daycare/dashboard-auto/2026-09-21 · set daycare/dashboard-auto/2026-09-22 |
| `recepcao` | `vacinas` | 2 | set daycare/dashboard-auto/2026-09-23 · set daycare/dashboard-auto/2026-09-24 |
| `recepcao` | `emporio` | 3 | transaction daycare/avisos-telegram-atraso/2026-09-19 · set daycare/dashboard-auto/2026-09-25 · set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `reposicao` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `renovacao` | 2 | set daycare/dashboard-auto/2026-09-28 · set daycare/dashboard-auto/2026-09-29 |
| `recepcao` | `agenda` | 2 | set daycare/dashboard-auto/2026-09-30 · set daycare/dashboard-auto/2026-10-01 |
| `vet` | _(carga + entrada)_ | 46 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `supervisao` | _(carga + entrada)_ | 47 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `supervisao` | `painel-amanda` | 10 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `supervisao` | `conferencia` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | _(carga + entrada)_ | 44 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-09-19 |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `conferencia` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `cuidadovet` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `turminha:qua` | 10 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | _(carga + entrada)_ | 89 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `painel-amanda` | 10 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `conferencia` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `ficha` | 10 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `cuidadovet` | 11 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:massagem` | 10 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |

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
| `painelmeu` | Meu Dashboard | 1446 | 1802 | 1537 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1415 | 435 | 324 | 0 | 3 | ok |
| `checkout` | Check-out 2 | 1390 | 1077 | 1012 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1284 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1561 | 2455 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1379 | 1787 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1533 | 3839 | 3971 | 0 | 1 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 21 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9372 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9574 | 278 | 241 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9490 | 2514 | 1809 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9353 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9351 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9484 | 7622 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9376 | 2222 | 2409 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9410 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 9283 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9290 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 9801 | 27857 | 42309 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9365 | 1516 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9378 | 1748 | 3361 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 9283 | 559 | 269 | 0 | 1 | ok |
| `peso` | Peso | 9308 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9281 | 3660 | 5454 | 0 | 2 | ok |
| `vacinas` | Prevenção | 9545 | 17012 | 11762 | 0 | 2 | ok |
| `emporio` | Quem não comeu hoje | 9354 | 3655 | 5176 | 0 | 3 | ok |
| `reposicao` | Reposições 43 | 9353 | 5366 | 4313 | 0 | 1 | ok |
| `renovacao` | Renovação de planos | 9347 | 4767 | 3885 | 0 | 2 | ok |
| `agenda` | Agenda em breve | 9274 | 59 | 339 | 0 | 2 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1266 | 719 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 29 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9292 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9506 | 369 | 333 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9394 | 2512 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9324 | 6617 | 3890 | 0 | 10 | ok |
| `eahist` | Enriquecimento Ambiental | 9292 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9326 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2469 | 435 | 324 | 0 | 11 | ok |
| `hospedes` | Hóspedes de hoje | 1362 | 7741 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1315 | 2222 | 2409 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1383 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1295 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1689 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1322 | 719 | 700 | 0 | 11 | ok |
| `orcamento` | Orçamento de hospedagem | 1318 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1348 | 1748 | 3361 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1259 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1284 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1485 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1382 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1359 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1323 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1350 | 17999 | 13858 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1269 | 5135 | 4948 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1329 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1952 | 3643 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1600 | 1303 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1245 | 1506 | 1806 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1889 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1467 | 2516 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1308 | 6621 | 3890 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1406 | 7769 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1333 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1282 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1408 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1348 | 435 | 324 | 0 | 11 | ok |
| `hospedes` | Hóspedes de hoje | 1384 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1458 | 4499 | 4818 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1315 | 2222 | 2409 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1284 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1392 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1281 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1770 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1326 | 719 | 700 | 0 | 11 | ok |
| `orcamento` | Orçamento de hospedagem | 1330 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1330 | 2038 | 3700 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1268 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1297 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1268 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1514 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1317 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1358 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1353 | 17999 | 13858 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1272 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1306 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1286 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1349 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1546 | 5684 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1501 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1484 | 5342 | 3824 | 0 | 10 | ok |
| `turminha:qui` | Quinta 43 | 1459 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1473 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1475 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1451 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1552 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1482 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1459 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1438 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1478 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1617 | 4374 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1501 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1678 | 3687 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1516 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1517 | 2453 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1465 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1856 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1512 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1545 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1527 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1595 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9263 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9739 | 552 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9414 | 2522 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9421 | 6627 | 3890 | 0 | 10 | ok |
| `paineloperacao` | Dashboard da Márcia | 9374 | 7775 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9396 | 6631 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9306 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9276 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9345 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2506 | 435 | 324 | 0 | 11 | ok |
| `hospedes` | Hóspedes de hoje | 1375 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1473 | 4499 | 4818 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1328 | 2222 | 2409 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1289 | 982 | 907 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1391 | 10185 | 9234 | 0 | 10 | ok |
| `checkin` | Check-in | 1301 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1738 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1318 | 719 | 700 | 0 | 11 | ok |
| `orcamento` | Orçamento de hospedagem | 1332 | 1560 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1317 | 2038 | 3700 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1277 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1303 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1279 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1595 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1353 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1364 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1346 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1361 | 17999 | 13858 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1263 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1308 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1412 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1355 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1627 | 5684 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1539 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1550 | 5342 | 3824 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1517 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1486 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1471 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1499 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1525 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1507 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1508 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1473 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1449 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1522 | 4375 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1532 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1646 | 3688 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1478 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1499 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1459 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1863 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1450 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1444 | 386 | 425 | 0 | 10 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1472 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1635 | 3579 | 3262 | 0 | 0 | ok |

