# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 22/09/2026, 17:19:50.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-22-04.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 17 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 13 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 16 |
| `vet` | Suellen (`vet`) | 2 | 0 | 14 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 75 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 177 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 181 |

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
| `monitor` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `monitor` | `checkout` | 3 | transaction daycare/cobranca-almoco2/2026-09-22 · transaction daycare/turma/2026-09-22 · transaction daycare/falta-automatica/2026-09-22 |
| `plantonista` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `mesa` | 3 | transaction daycare/cobranca-almoco2/2026-09-22 · transaction daycare/turma/2026-09-22 · transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `pendencias` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `vet` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `mesa` | 3 | transaction daycare/cobranca-almoco2/2026-09-22 · transaction daycare/turma/2026-09-22 · transaction daycare/falta-automatica/2026-09-22 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `dashdc` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | _(carga + entrada)_ | 57 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-22 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `painel-amanda` | 5 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `dashdc` | 5 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:almoco` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:escova` | 1 | update daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | _(carga + entrada)_ | 57 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-22 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `painel-amanda` | 5 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `diretoria` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `checkin` | 5 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:ter` | 2 | transaction daycare/falta-automatica/2026-09-22 · update daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `diretoria` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-22 · update daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:massagem` | 5 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `atividade:peso` | 1 | update daycare/dashboard-auto/2026-09-25 |

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
| `painelmeu` | Meu Dashboard | 1242 | 1815 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1282 | 559 | 560 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1289 | 1281 | 1376 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1257 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1240 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1381 | 2569 | 1538 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1268 | 1827 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1285 | 2849 | 3216 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1274 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1539 | 385 | 303 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1407 | 3190 | 2094 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1259 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1314 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1347 | 6715 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1313 | 1294 | 1453 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1340 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1291 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1287 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1524 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1335 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1331 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1264 | 559 | 269 | 0 | 1 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1257 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1458 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 1954 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1358 | 6152 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1299 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1267 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1243 | 487 | 484 | 0 | 1 | ok |
| `peso` | Peso | 1266 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1292 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1590 | 576 | 477 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1364 | 3188 | 2094 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1301 | 6844 | 3962 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1281 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1311 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1304 | 559 | 560 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1377 | 6749 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1282 | 1294 | 1453 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1329 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1270 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1285 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1612 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 487 | 484 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1313 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1320 | 1877 | 3606 | 0 | 1 | ok |
| `pendencias` | Pendências de prevenção | 1257 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1269 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1260 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1498 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 1929 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1303 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1373 | 6152 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1327 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1383 | 22774 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1284 | 6394 | 5940 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1304 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1341 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1946 | 4345 | 3732 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1496 | 1485 | 1694 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9258 | 1741 | 1912 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9679 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9372 | 3192 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9295 | 6848 | 3962 | 0 | 5 | ok |
| `paineloperacao` | Dashboard da Márcia | 9278 | 8206 | 4377 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9290 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9284 | 521 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9364 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 4115 | 559 | 560 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1352 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1481 | 2780 | 3114 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1283 | 1453 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1311 | 1186 | 1271 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1436 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1284 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1806 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1341 | 487 | 484 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1327 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1352 | 2167 | 3945 | 0 | 5 | ok |
| `pendencias` | Pendências de prevenção | 1268 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1255 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1499 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2295 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1342 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1521 | 6152 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1334 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1397 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1270 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1297 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1314 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1264 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1360 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1549 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1624 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1491 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1487 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1484 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1505 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1514 | 7354 | 5416 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1501 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1453 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1469 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1437 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1468 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1589 | 4540 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1471 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1510 | 3856 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1437 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1495 | 2460 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1545 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1808 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1456 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1439 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1500 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1617 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9262 | 1741 | 1912 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9729 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9383 | 3198 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9389 | 6854 | 3962 | 0 | 5 | ok |
| `paineloperacao` | Dashboard da Márcia | 9391 | 8212 | 4377 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9261 | 6888 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9276 | 451 | 505 | 0 | 1 | ok |
| `linhadotempo` | Linha do tempo do dia | 9277 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9332 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2506 | 559 | 560 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1366 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1416 | 2790 | 3114 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1298 | 1293 | 1453 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1310 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1405 | 17076 | 10522 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1302 | 437 | 411 | 0 | 5 | ok |
| `checkoutconf` | Check-out com o tutor | 1286 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1659 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1304 | 487 | 484 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1268 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1322 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1279 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1259 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1546 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2125 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1474 | 6152 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1414 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1406 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1290 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1304 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1304 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1332 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1531 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1545 | 6125 | 4139 | 0 | 2 | ok |
| `turminha:qua` | Quarta 47 | 1464 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1432 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1453 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1474 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1424 | 7354 | 5416 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1512 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1457 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1412 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1408 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1411 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1557 | 4541 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1407 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1503 | 3857 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1462 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1449 | 2461 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1433 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1738 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1506 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1431 | 386 | 425 | 0 | 5 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1472 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1600 | 3579 | 3262 | 0 | 1 | ok |

