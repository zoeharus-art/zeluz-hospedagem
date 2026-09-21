# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 21/09/2026, 14:09:30.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-03.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 22 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 19 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 21 |
| `vet` | Suellen (`vet`) | 2 | 0 | 20 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 86 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 195 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 144 |

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
| `monitor` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `monitor` | `checkout` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `plantonista` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `recepcao` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `recepcao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `vet` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `supervisao` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `supervisao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `supervisao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `supervisao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `supervisao` | `dashdc` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | _(carga + entrada)_ | 62 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `gestao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `painel-amanda` | 8 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `gestao` | `peso` | 8 | transaction daycare/falta-automatica/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:livre` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `diretoria` | `inicio` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `turminha:qua` | 8 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520758427_hhzc_14-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-romeo__jeanine-ci_1785520816211_3wkm_14-00 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:musicoterapia` | 2 | set daycare/dashboard-auto/2026-09-26 · transaction daycare/falta-automatica/2026-09-21 |

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
| `painelmeu` | Meu Dashboard | 1275 | 1791 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1283 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 5 | 1302 | 1101 | 1088 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1257 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1398 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1324 | 1803 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1264 | 3512 | 3966 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1259 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1392 | 332 | 303 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1316 | 2768 | 2037 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1310 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1368 | 7235 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1334 | 1961 | 2143 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1396 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1317 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1617 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1403 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1368 | 1854 | 3474 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1266 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3660 | 5454 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1471 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1392 | 9773 | 15222 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1285 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1316 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1316 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1274 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1255 | 653 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1280 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1494 | 523 | 477 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1491 | 2766 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1300 | 6606 | 3873 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1263 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1391 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1323 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1331 | 7286 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1368 | 1961 | 2143 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1424 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1279 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1673 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1302 | 653 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1321 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1316 | 1854 | 3474 | 0 | 1 | ok |
| `pendencias` | Pendências de prevenção | 1265 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1280 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1501 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1424 | 9773 | 15222 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1291 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1379 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1344 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1422 | 19380 | 14772 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1293 | 6131 | 5621 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1285 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1344 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1772 | 3730 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1496 | 1287 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9257 | 1512 | 1768 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9617 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9396 | 2770 | 2037 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9276 | 6610 | 3873 | 0 | 8 | ok |
| `paineloperacao` | Dashboard da Márcia | 9341 | 7758 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9336 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9295 | 518 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9335 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2572 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1353 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1471 | 3949 | 4329 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1961 | 2143 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1302 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1358 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1301 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1284 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1793 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1313 | 653 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1333 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1375 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1285 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1296 | 298 | 471 | 0 | 8 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1461 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1410 | 9773 | 15222 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1287 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1303 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1300 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1379 | 19380 | 14772 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1285 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1297 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1297 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1338 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1604 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1514 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1461 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1441 | 4970 | 3468 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1434 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1456 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1461 | 7367 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1466 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1514 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1496 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1449 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1451 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1592 | 4531 | 3765 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1489 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1557 | 3810 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1523 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1522 | 2470 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1507 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1780 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1565 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1592 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1557 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1548 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1259 | 1512 | 1768 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1618 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1382 | 2776 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1381 | 6616 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1314 | 7764 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1267 | 6671 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1286 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1271 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1300 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1314 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1352 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1365 | 3949 | 4329 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1961 | 2143 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1271 | 1006 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1333 | 14642 | 9883 | 0 | 42 | ok |
| `checkin` | Check-in | 1279 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1273 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1551 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 653 | 700 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1303 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1331 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1257 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1445 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1392 | 9773 | 15222 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1301 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1317 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1420 | 19380 | 14772 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1349 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1325 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1632 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1287 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1365 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1499 | 5615 | 4111 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1489 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1430 | 5342 | 3824 | 0 | 8 | ok |
| `turminha:qui` | Quinta 43 | 1431 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1443 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1459 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1484 | 7367 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1576 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1506 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1474 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1446 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1424 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1591 | 4532 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1531 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1521 | 3811 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1449 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1476 | 2471 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1466 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1774 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1463 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1430 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1466 | 2431 | 3349 | 0 | 2 | ok |
| `atividade:peso` | Peso do peludinho | 1552 | 3579 | 3262 | 0 | 0 | ok |

