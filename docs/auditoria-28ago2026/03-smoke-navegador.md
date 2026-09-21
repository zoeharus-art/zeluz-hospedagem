# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 21/09/2026, 19:02:06.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-05.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 28 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 27 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 26 |
| `vet` | Suellen (`vet`) | 2 | 0 | 25 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 107 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 208 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 150 |

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
| `monitor` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `monitor` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-21 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `monitor` | `checkout` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `plantonista` | _(carga + entrada)_ | 24 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `plantonista` | `hospedagem` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `mesa` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `vet` | _(carga + entrada)_ | 24 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `supervisao` | _(carga + entrada)_ | 26 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-21 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `painel-amanda` | 10 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `conferencia` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `cuidadovet` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | _(carga + entrada)_ | 68 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `painel-amanda` | 10 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `conferencia` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `cuidadovet` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `pendencias` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `peso` | 9 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-09-21 · push daycare/auditoria/2026-09-21 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:almoco2` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `conferencia` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `cuidadovet` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `turminha:ter` | 10 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:jogos` | 1 | transaction daycare/falta-automatica/2026-09-21 |

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
| `painelmeu` | Meu Dashboard | 1271 | 1791 | 1514 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1256 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 5 | 1302 | 1101 | 1088 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1265 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1265 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1509 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1504 | 1794 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1307 | 3512 | 3966 | 0 | 3 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1273 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1392 | 332 | 303 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1553 | 3061 | 2037 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1362 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1322 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1430 | 7235 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1434 | 2020 | 2145 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1454 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1319 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1292 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1702 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1378 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1309 | 1922 | 3640 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1269 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1608 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 2124 | 30522 | 30007 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1286 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1288 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1297 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1275 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1314 | 653 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1283 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9291 | 1512 | 1768 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9604 | 523 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9421 | 3059 | 2037 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9291 | 6734 | 3873 | 0 | 10 | ok |
| `eahist` | Enriquecimento Ambiental | 9319 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9339 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2500 | 434 | 324 | 0 | 10 | ok |
| `hospedes` | Hóspedes de hoje | 1423 | 7286 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1349 | 2020 | 2145 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1412 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1296 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1797 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 653 | 700 | 0 | 10 | ok |
| `orcamento` | Orçamento de hospedagem | 1350 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1337 | 1922 | 3640 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1277 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1674 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 2029 | 30522 | 30007 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1317 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1328 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1365 | 21831 | 16364 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1272 | 6131 | 5621 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1282 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1366 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1830 | 3713 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1551 | 1287 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9267 | 1512 | 1768 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9631 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9557 | 3063 | 2037 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9264 | 6738 | 3873 | 0 | 10 | ok |
| `paineloperacao` | Dashboard da Márcia | 9301 | 7758 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9324 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9292 | 518 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9320 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2379 | 434 | 324 | 0 | 10 | ok |
| `hospedes` | Hóspedes de hoje | 1355 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1498 | 4008 | 4333 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1362 | 2020 | 2145 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1287 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1361 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1289 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1782 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1290 | 653 | 700 | 0 | 10 | ok |
| `orcamento` | Orçamento de hospedagem | 1371 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1344 | 2212 | 3979 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1274 | 559 | 269 | 0 | 1 | ok |
| `peso` | Peso | 1272 | 298 | 471 | 0 | 9 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1436 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1662 | 30522 | 30007 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1287 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1287 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1376 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1408 | 21831 | 16364 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1286 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1316 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1316 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1281 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1340 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1635 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1609 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1527 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1445 | 4970 | 3468 | 0 | 2 | ok |
| `turminha:sex` | Sexta 51 | 1491 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1462 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1493 | 7350 | 5416 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1547 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1542 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1515 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1525 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1523 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1713 | 4484 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1562 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1820 | 3797 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1551 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1529 | 2470 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1516 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1937 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1544 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1421 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1478 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1438 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1251 | 1512 | 1768 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1626 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1393 | 3069 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1308 | 6744 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1378 | 7764 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1274 | 6651 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1299 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1267 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1329 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1331 | 434 | 324 | 0 | 10 | ok |
| `hospedes` | Hóspedes de hoje | 1380 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1486 | 3988 | 4333 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1312 | 1978 | 2145 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1285 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1491 | 14642 | 9883 | 0 | 1 | ok |
| `checkin` | Check-in | 1312 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1255 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1618 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1354 | 653 | 700 | 0 | 10 | ok |
| `orcamento` | Orçamento de hospedagem | 1314 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1285 | 2212 | 3979 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1267 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1270 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1346 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1516 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1761 | 30522 | 30007 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1339 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1311 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1374 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1409 | 21831 | 16364 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1291 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1366 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1335 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1304 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1583 | 5615 | 4111 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1546 | 5613 | 4111 | 0 | 10 | ok |
| `turminha:qua` | Quarta 47 | 1397 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1499 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1491 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1458 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1427 | 7350 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1546 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1511 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1518 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1520 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1498 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1655 | 4485 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1494 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1524 | 3798 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1536 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1574 | 2471 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1503 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1789 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1442 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1520 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1521 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1499 | 3579 | 3262 | 0 | 0 | ok |

