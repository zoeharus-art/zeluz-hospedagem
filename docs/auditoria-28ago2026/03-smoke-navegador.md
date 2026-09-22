# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 22/09/2026, 13:12:28.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-22-03.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 12 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 9 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 26 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 70 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 122 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 168 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `monitor` | `checkout` | 2 | transaction daycare/turma/2026-09-22 · transaction daycare/falta-automatica/2026-09-22 |
| `plantonista` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `recepcao` | _(carga + entrada)_ | 10 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `recepcao` | `inicio` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `gestdia` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `recepcao` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `pendencias` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `peso` | 1 | update daycare/dashboard-auto/2026-09-22 |
| `recepcao` | `alergia` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `recepcao` | `vacinas` | 2 | update daycare/dashboard-auto/2026-09-24 · transaction daycare/falta-automatica/2026-09-22 |
| `recepcao` | `vencimentos` | 2 | set daycare/dashboard-auto/2026-09-25 · set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `emporio` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `reposicao` | 2 | transaction daycare/falta-automatica/2026-09-22 · set daycare/dashboard-auto/2026-09-28 |
| `recepcao` | `renovacao` | 1 | set daycare/dashboard-auto/2026-09-29 |
| `recepcao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-30 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | _(carga + entrada)_ | 10 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `supervisao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `painel-amanda` | 3 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | _(carga + entrada)_ | 52 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `gestao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-22 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `gestao` | `painel-amanda` | 3 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `pendencias` | 3 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `pessoas` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `turminha:sex` | 1 | update daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:almoco` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `gestao` | `atividade:foto` | 1 | update daycare/dashboard-auto/2026-09-26 |
| `diretoria` | _(carga + entrada)_ | 52 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `diretoria` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-22 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 |
| `diretoria` | `painel-amanda` | 3 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `ficha` | 3 | transaction daycare/falta-automatica/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `turminha:seg` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `diretoria` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-22 |
| `diretoria` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-22 · set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:foto` | 4 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-22 · set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1243 | 1815 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1270 | 559 | 560 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1319 | 1281 | 1376 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1280 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1267 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1398 | 2569 | 1538 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1273 | 1827 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1281 | 2849 | 3216 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9274 | 1741 | 1912 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 9614 | 385 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9343 | 3190 | 2094 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9265 | 451 | 505 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9326 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9628 | 6715 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9375 | 1256 | 1452 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 9453 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 9301 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9304 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 9574 | 28155 | 42600 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 9385 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9370 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 9282 | 559 | 269 | 0 | 1 | ok |
| `peso` | Peso | 9300 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9455 | 3660 | 5454 | 0 | 1 | ok |
| `vacinas` | Prevenção | 9619 | 24496 | 14707 | 0 | 2 | ok |
| `vencimentos` | Vence amanhã (45) | 10476 | 40093 | 38272 | 0 | 2 | ok |
| `emporio` | Quem não comeu hoje | 9327 | 2433 | 1928 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 9534 | 5831 | 4315 | 0 | 2 | ok |
| `renovacao` | Renovação de planos | 9354 | 4718 | 3885 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 9292 | 59 | 339 | 0 | 1 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1244 | 487 | 484 | 0 | 1 | ok |
| `peso` | Peso | 1251 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9349 | 1741 | 1912 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9731 | 576 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9608 | 3188 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9318 | 6844 | 3962 | 0 | 3 | ok |
| `eahist` | Enriquecimento Ambiental | 9340 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9397 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2566 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1388 | 6749 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1353 | 1256 | 1452 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1450 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1327 | 437 | 411 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1311 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1763 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1313 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1343 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1341 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1271 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1281 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1277 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1453 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2079 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1476 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1458 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1440 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1374 | 22774 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1312 | 6394 | 5940 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1298 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1351 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 2065 | 4345 | 3732 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1531 | 1485 | 1694 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9255 | 1741 | 1912 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9759 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9560 | 3192 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9300 | 6848 | 3962 | 0 | 3 | ok |
| `paineloperacao` | Dashboard da Márcia | 9400 | 8206 | 4377 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9339 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9285 | 521 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9328 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2387 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1359 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1446 | 2753 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1299 | 1256 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1283 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1497 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1333 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1285 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1860 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1362 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1362 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1375 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1271 | 559 | 269 | 0 | 3 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1272 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1581 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2077 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1526 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1563 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1351 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1374 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1279 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1283 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1307 | 1104 | 1676 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1265 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1386 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1615 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1641 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1577 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1664 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1594 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1638 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1678 | 7354 | 5416 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1691 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1627 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1608 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1545 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1542 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1724 | 4531 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1501 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1714 | 3856 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1542 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1571 | 2460 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1515 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1979 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1522 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1456 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1521 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1554 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9291 | 1741 | 1912 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9774 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9388 | 3198 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9312 | 6854 | 3962 | 0 | 3 | ok |
| `paineloperacao` | Dashboard da Márcia | 9421 | 8212 | 4377 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9420 | 6896 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9317 | 451 | 505 | 0 | 1 | ok |
| `linhadotempo` | Linha do tempo do dia | 9285 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9353 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2464 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1363 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1485 | 2754 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1318 | 1257 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1286 | 1186 | 1271 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1407 | 17076 | 10522 | 0 | 3 | ok |
| `checkin` | Check-in 1 | 1293 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1758 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1337 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1349 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1256 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1290 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1257 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1513 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2124 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1410 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1486 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1395 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1362 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1278 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1381 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1412 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1286 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1369 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1594 | 5016 | 3782 | 0 | 1 | ok |
| `turminha:ter` | Terça · hoje 46 | 1619 | 6125 | 4139 | 0 | 1 | ok |
| `turminha:qua` | Quarta 47 | 1613 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1659 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1588 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1556 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1581 | 7354 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1563 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1614 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1601 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1580 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1549 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1681 | 4532 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1547 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1711 | 3857 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1629 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1653 | 2461 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1531 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2030 | 4151 | 4559 | 0 | 4 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1480 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1506 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1559 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1606 | 3579 | 3262 | 0 | 1 | ok |

