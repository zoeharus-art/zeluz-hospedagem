# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 23/09/2026, 18:54:54.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-23-02.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 20 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 15 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 19 |
| `vet` | Suellen (`vet`) | 2 | 0 | 18 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 78 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 132 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 132 |

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
| `monitor` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `monitor` | `painelmeu` | 1 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `monitor` | `conferencia` | 2 | transaction daycare/resumo-gestao/2026-09-23 · set auaulandia/med-vigia/2026-09-23 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `plantonista` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `inicio` | 1 | transaction daycare/resumo-gestao/2026-09-23 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `vet` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-23 |
| `vet` | `peso` | 2 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 |
| `supervisao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `inicio` | 4 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `supervisao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 2 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 |
| `gestao` | `mesa` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `checkoutconf` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `turminha:qua` | 5 | transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-29 |
| `diretoria` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 2 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 |
| `diretoria` | `mesa` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 43 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `pessoas` | 5 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-23 · set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | `atividade:ea` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-28 |

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
| `painelmeu` | Meu Dashboard | 1259 | 1798 | 1514 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1249 | 434 | 324 | 0 | 2 | ok |
| `checkout` | Check-out 1 | 1276 | 806 | 1088 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1240 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1381 | 2478 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1262 | 1799 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1307 | 2519 | 2596 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1253 | 1769 | 2016 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1488 | 316 | 303 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1351 | 3164 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1258 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1274 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1315 | 6450 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1317 | 1208 | 1371 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1450 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1300 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1285 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1869 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1363 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1370 | 2392 | 3935 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1281 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1268 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3684 | 5497 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1414 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 1763 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1292 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1402 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1341 | 4613 | 3811 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1279 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1384 | 641 | 684 | 0 | 1 | ok |
| `peso` | Peso | 1430 | 298 | 471 | 0 | 2 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1316 | 1769 | 2016 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 1733 | 524 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1572 | 3162 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1527 | 6885 | 3985 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1322 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1319 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1312 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1330 | 6484 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1304 | 1208 | 1371 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1330 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1335 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1326 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1952 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1343 | 641 | 684 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1316 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1393 | 2392 | 3935 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1292 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1285 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1476 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 1894 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1304 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1355 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1337 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1365 | 22787 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1262 | 6645 | 6137 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1298 | 2243 | 1870 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1632 | 3987 | 3811 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1442 | 1433 | 1729 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1242 | 1769 | 2016 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1869 | 644 | 494 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1377 | 3166 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1280 | 6889 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1361 | 8290 | 4511 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1290 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1268 | 524 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1286 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1275 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1304 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1345 | 2386 | 2700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1271 | 1208 | 1371 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1270 | 711 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1321 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1259 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 619 | 607 | 0 | 1 | ok |
| `recepcao` | Pendências com o tutor | 1600 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1271 | 641 | 684 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1301 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1305 | 2682 | 4274 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1271 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1257 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1263 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1409 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 1833 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1301 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1320 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1278 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1344 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1284 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1299 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1270 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1244 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1295 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1471 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1416 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1436 | 6345 | 4470 | 0 | 5 | ok |
| `turminha:qui` | Quinta 44 | 1442 | 5070 | 3808 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1395 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1416 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1496 | 7302 | 5259 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1421 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1423 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1425 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1402 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1356 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1555 | 4484 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1437 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1500 | 3782 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1439 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1460 | 2477 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1380 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1651 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1377 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1374 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1438 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1467 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1243 | 1769 | 2016 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1709 | 644 | 494 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1411 | 3172 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1258 | 6895 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1256 | 8296 | 4511 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1266 | 6879 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1331 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1256 | 524 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1310 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1352 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1370 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1662 | 2386 | 2700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1823 | 1208 | 1371 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1666 | 711 | 983 | 0 | 43 | ok |
| `ficha` | Cadastro de Peludinhos | 1866 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1507 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1422 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1983 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1386 | 641 | 684 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1423 | 2682 | 4274 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1298 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1427 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1320 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1736 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2736 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1451 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1601 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1472 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1458 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1354 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1313 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1294 | 1104 | 1676 | 0 | 5 | ok |
| `agenda` | Agenda em breve | 1272 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1334 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1496 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1531 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1553 | 6345 | 4470 | 0 | 0 | ok |
| `turminha:qui` | Quinta 44 | 1636 | 5070 | 3808 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1583 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1609 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1576 | 7302 | 5259 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1485 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1489 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1455 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1462 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1404 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1656 | 4485 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1438 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1525 | 3783 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1427 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1391 | 2478 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1408 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1746 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1384 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1396 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1416 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1485 | 3579 | 3262 | 0 | 0 | ok |

