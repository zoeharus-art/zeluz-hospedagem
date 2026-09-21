# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 21/09/2026, 16:55:03.
> Servidor: servidor Node interno na porta 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-04.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 27 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 26 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 23 |
| `vet` | Suellen (`vet`) | 2 | 0 | 27 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 104 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 154 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 155 |

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
| `monitor` | `conferencia` | 4 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `plantonista` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `plantonista` | `hospedagem` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `recepcao` | `recepcao` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `vet` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `vet` | `peso` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `supervisao` | `conferencia` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `cuidadovet` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `config` | 7 | set daycare/dashboard-auto/2026-09-21 · transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas |
| `supervisao` | `acerto` | 10 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `conferencia` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `gestdia` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `cuidadovet` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `reposicao` | 10 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `renovacao` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `acerto` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:chamada` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `gestao` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `diretoria` | _(carga + entrada)_ | 22 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `inicio` | 3 | transaction daycare/cobranca-almoco2/2026-09-21 · transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `hospedes` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `peso` | 10 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `acerto` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `relatorios` | 10 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_15-15 |
| `diretoria` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:escova` | 2 | transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1302 | 1791 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1286 | 434 | 324 | 0 | 4 | ok |
| `checkout` | Check-out 5 | 1304 | 1101 | 1088 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1378 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1541 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 2191 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1490 | 1803 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1673 | 3512 | 3966 | 0 | 3 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1332 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1627 | 332 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1448 | 2768 | 2037 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1348 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 2047 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1466 | 7235 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1341 | 2018 | 2145 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1452 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1330 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1307 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 2735 | 28155 | 42600 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1431 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1469 | 1922 | 3640 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1332 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1309 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1392 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1735 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1782 | 21429 | 26795 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1515 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1668 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1772 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1688 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1460 | 653 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1350 | 298 | 471 | 0 | 3 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1621 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1937 | 523 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1946 | 2766 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1456 | 6734 | 3873 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1393 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1703 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1666 | 434 | 324 | 0 | 10 | ok |
| `hospedes` | Hóspedes de hoje | 1455 | 7286 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1420 | 2018 | 2145 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1741 | 14642 | 9883 | 0 | 1 | ok |
| `checkin` | Check-in | 1484 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1453 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 2039 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1528 | 653 | 700 | 0 | 10 | ok |
| `orcamento` | Orçamento de hospedagem | 1726 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1454 | 1922 | 3640 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1374 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1400 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1293 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1833 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1934 | 21429 | 26795 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1463 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 2472 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 2015 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 2382 | 20961 | 15880 | 0 | 7 | ok |
| `acerto` | Financeiro do plantão | 1769 | 6131 | 5621 | 0 | 10 | ok |
| `agenda` | Agenda em breve | 1677 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1528 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 2839 | 3691 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 2142 | 1287 | 1591 | 0 | 1 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1327 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 2066 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1712 | 2770 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1417 | 6738 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1437 | 7758 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1725 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1462 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1365 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1430 | 434 | 324 | 0 | 10 | ok |
| `hospedes` | Hóspedes de hoje | 1600 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1604 | 4006 | 4333 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1471 | 2018 | 2145 | 0 | 1 | ok |
| `checkout` | Check-out 5 | 1353 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 2428 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1387 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1314 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1581 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1496 | 653 | 700 | 0 | 10 | ok |
| `orcamento` | Orçamento de hospedagem | 1417 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1383 | 2212 | 3979 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1396 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1328 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1326 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1590 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1622 | 21429 | 26795 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1328 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1379 | 5366 | 4313 | 0 | 10 | ok |
| `renovacao` | Renovação de planos | 1351 | 4718 | 3885 | 0 | 1 | ok |
| `config` | Configurações | 1428 | 20961 | 15880 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1360 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1864 | 6131 | 5621 | 0 | 1 | ok |
| `pessoas` | Time | 1328 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1327 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1553 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1433 | 5322 | 3719 | 0 | 1 | ok |
| `turminha:qua` | Quarta 47 | 1504 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1727 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1494 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1551 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1559 | 7350 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1563 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1547 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1583 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1542 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1985 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1958 | 4491 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 2866 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1919 | 3771 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1800 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 2983 | 2470 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1830 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2038 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1509 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1511 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1556 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1666 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1262 | 1512 | 1768 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1642 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1361 | 2776 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1375 | 6744 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1435 | 7764 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1390 | 6667 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1272 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1270 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1315 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1349 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1407 | 7286 | 5700 | 0 | 10 | ok |
| `hospedagem` | Plantão da noite | 1480 | 4006 | 4333 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1374 | 2018 | 2145 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1291 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1407 | 14642 | 9883 | 0 | 1 | ok |
| `checkin` | Check-in | 1309 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1278 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1841 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1328 | 653 | 700 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1404 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1409 | 2212 | 3979 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1538 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1474 | 298 | 471 | 0 | 10 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1483 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1848 | 24094 | 14490 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (41) | 1793 | 21429 | 26795 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1463 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1386 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1346 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1375 | 20961 | 15880 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1293 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1384 | 6131 | 5621 | 0 | 1 | ok |
| `pessoas` | Time | 1327 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1299 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1346 | 2243 | 1870 | 0 | 10 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1630 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1575 | 5322 | 3719 | 0 | 1 | ok |
| `turminha:qua` | Quarta 47 | 1471 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1467 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1469 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1491 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1447 | 7350 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1481 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1501 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1559 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1527 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1529 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1726 | 4492 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1549 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1858 | 3772 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1603 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1555 | 2471 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1555 | 353 | 425 | 0 | 2 | ok |
| `atividade:foto` | Foto do peludinho | 2048 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1529 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1495 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1492 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1576 | 3579 | 3262 | 0 | 0 | ok |

