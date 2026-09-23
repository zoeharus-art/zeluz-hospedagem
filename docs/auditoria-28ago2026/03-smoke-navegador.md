# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 23/09/2026, 19:54:01.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-23-03.

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
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 18 |
| `vet` | Suellen (`vet`) | 2 | 0 | 16 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 86 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 184 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 187 |

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
| `monitor` | `painelmeu` | 2 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · transaction daycare/resumo-gestao/2026-09-23 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-23 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `plantonista` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-23 · transaction daycare/turma/2026-09-23 · transaction daycare/avisos-telegram-atraso/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `vet` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 2 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/med-vigia/2026-09-23 |
| `vet` | `peso` | 1 | transaction daycare/resumo-gestao/2026-09-23 |
| `supervisao` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-23 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `supervisao` | `painel-amanda` | 5 | transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `supervisao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `supervisao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 2 | set daycare/dashboard-auto/2026-09-23 · transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | _(carga + entrada)_ | 60 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-23 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `painel-amanda` | 5 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `dashdc` | 5 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `pessoas` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:almoco` | 2 | transaction daycare/falta-automatica/2026-09-23 · set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-23 · set daycare/dashboard-auto/2026-09-27 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-29 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-30 |
| `diretoria` | _(carga + entrada)_ | 60 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-23 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `painel-amanda` | 5 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `conferencia` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `ficha` | 5 | transaction daycare/falta-automatica/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 5 | set auaulandia/med-vigia/2026-09-23 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-23 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `turminha:seg` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-23 |
| `diretoria` | `atividade:jogos` | 5 | transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-23/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-29 |

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
| `painelmeu` | Meu Dashboard | 1276 | 1798 | 1514 | 0 | 2 | ok |
| `conferencia` | Conferência do check-in | 1275 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1412 | 806 | 1088 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1282 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1412 | 2478 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1310 | 1799 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1372 | 2592 | 2649 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1297 | 1769 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1628 | 316 | 303 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1555 | 3164 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1279 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1284 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1412 | 6450 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1376 | 1208 | 1371 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1472 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1307 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1278 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1841 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1393 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1393 | 2445 | 4101 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1302 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1386 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1634 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2058 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1431 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1510 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1510 | 4613 | 3811 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1337 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1253 | 641 | 684 | 0 | 2 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9311 | 1769 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9678 | 524 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9405 | 3162 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9296 | 6885 | 3985 | 0 | 5 | ok |
| `eahist` | Enriquecimento Ambiental | 9331 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9350 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2429 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1449 | 6484 | 5153 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1328 | 1208 | 1371 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1489 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1297 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1894 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1310 | 641 | 684 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1377 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1395 | 2445 | 4101 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1267 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1329 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1605 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2260 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1332 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1602 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1370 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1420 | 22787 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1300 | 6645 | 6137 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1293 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1356 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1966 | 3991 | 3811 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1567 | 1433 | 1729 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9307 | 1769 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 10029 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9386 | 3166 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9299 | 6889 | 3985 | 0 | 5 | ok |
| `paineloperacao` | Dashboard da Márcia | 9382 | 8635 | 4863 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9329 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9275 | 524 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9325 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2519 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1376 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1453 | 2463 | 2752 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1409 | 1208 | 1371 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1289 | 711 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1450 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1305 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1285 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1757 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1305 | 641 | 684 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1326 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1374 | 2735 | 4440 | 0 | 5 | ok |
| `pendencias` | Pendências de prevenção | 1268 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1297 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1296 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1596 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2187 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1342 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1564 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1355 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1351 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1281 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1312 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1291 | 1104 | 1676 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1262 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1318 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1557 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1498 | 5461 | 3809 | 0 | 1 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1579 | 6345 | 4470 | 0 | 0 | ok |
| `turminha:qui` | Quinta 44 | 1493 | 5070 | 3808 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1486 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1506 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1556 | 7302 | 5259 | 0 | 2 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1528 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1514 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1494 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1496 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1516 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1725 | 4473 | 3765 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1510 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1551 | 3786 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1502 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1513 | 2477 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1448 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1855 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1509 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1450 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1485 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1590 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9276 | 1769 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9977 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9554 | 3172 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9301 | 6895 | 3985 | 0 | 5 | ok |
| `paineloperacao` | Dashboard da Márcia | 9384 | 8641 | 4863 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9282 | 6863 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9300 | 471 | 518 | 0 | 1 | ok |
| `linhadotempo` | Linha do tempo do dia | 9270 | 524 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9359 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2494 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1380 | 6484 | 5153 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1469 | 2463 | 2752 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1287 | 1208 | 1371 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1289 | 711 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1481 | 17185 | 10586 | 0 | 5 | ok |
| `checkin` | Check-in | 1310 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 619 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1876 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1312 | 641 | 684 | 0 | 5 | ok |
| `orcamento` | Orçamento de hospedagem | 1349 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1378 | 2735 | 4440 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1260 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1282 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1552 | 24799 | 14879 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (44) | 2030 | 37427 | 35523 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1390 | 3901 | 4809 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1459 | 7055 | 4713 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1349 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1394 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1285 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1287 | 6645 | 6137 | 0 | 0 | ok |
| `pessoas` | Time | 1303 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1260 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1333 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1540 | 5016 | 3782 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1484 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 47 | 1547 | 6345 | 4470 | 0 | 0 | ok |
| `turminha:qui` | Quinta 44 | 1483 | 5070 | 3808 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1477 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1479 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1528 | 7302 | 5259 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1547 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1513 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1478 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1423 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1478 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1611 | 4474 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1516 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1553 | 3787 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1520 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1473 | 2478 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1449 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1870 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1497 | 353 | 425 | 0 | 5 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1461 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1522 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1608 | 3579 | 3262 | 0 | 0 | ok |

