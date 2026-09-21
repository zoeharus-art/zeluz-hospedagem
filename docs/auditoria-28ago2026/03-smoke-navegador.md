# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 21/09/2026, 13:27:16.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-21-02.

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
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 11 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 67 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 120 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 118 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-21 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `monitor` | `checkout` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `plantonista` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-21 |
| `recepcao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `recepcao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-21 |
| `supervisao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `mesa` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `supervisao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `inicio` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `gestao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `turminha:qua` | 4 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-21 · set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:musicoterapia` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `diretoria` | `inicio` | 2 | transaction daycare/turma/2026-09-21 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 |
| `diretoria` | `ficha` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-21 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `turminha:seg` | 3 | transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-21/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-21 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-26 |

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
| `painelmeu` | Meu Dashboard | 1288 | 1791 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1275 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 5 | 1306 | 1101 | 1088 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1270 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1272 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1524 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1383 | 1803 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1348 | 3512 | 3966 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1524 | 332 | 303 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1395 | 2768 | 2037 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1281 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1301 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1426 | 7235 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1358 | 1891 | 2140 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1402 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1344 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1825 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1438 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1380 | 1854 | 3474 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1304 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1274 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1665 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1549 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1308 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1352 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1381 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1286 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1257 | 653 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1302 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1338 | 1512 | 1768 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1870 | 523 | 477 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1574 | 2766 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1332 | 6606 | 3873 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1381 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1326 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1346 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1368 | 7286 | 5700 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1338 | 1891 | 2140 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1401 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1302 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1263 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1867 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1373 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1413 | 1562 | 1513 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1381 | 1854 | 3474 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1279 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1306 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1274 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1496 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1440 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1337 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1346 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1360 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1399 | 18981 | 14560 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1303 | 6131 | 5621 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1383 | 2243 | 1870 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1946 | 3739 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1606 | 1287 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1251 | 1512 | 1768 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1907 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1368 | 2770 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1295 | 6610 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1266 | 7758 | 4278 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1324 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1270 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1312 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1313 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1361 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1427 | 3880 | 4319 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1346 | 1891 | 2140 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1311 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1376 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in | 1311 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1633 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1318 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1342 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1332 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1272 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1409 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1380 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1321 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1351 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1432 | 18981 | 14560 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1317 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1391 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1300 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1264 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1350 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1568 | 5615 | 4111 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1483 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1461 | 5342 | 3824 | 0 | 4 | ok |
| `turminha:qui` | Quinta 43 | 1482 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1488 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1509 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1468 | 7367 | 5416 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1490 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1480 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1482 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1423 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1437 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1602 | 4494 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1453 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1616 | 3819 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1477 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1467 | 2470 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1546 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1922 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1416 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1422 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1471 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1460 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1512 | 1768 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1738 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1480 | 2776 | 2037 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1284 | 6616 | 3873 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1395 | 7764 | 4278 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1512 | 6671 | 3582 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1340 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1278 | 518 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1322 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1316 | 434 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1383 | 7286 | 5700 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1439 | 3881 | 4319 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1371 | 1892 | 2140 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1291 | 1006 | 983 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1432 | 14642 | 9883 | 0 | 1 | ok |
| `checkin` | Check-in | 1313 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1286 | 623 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1762 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1335 | 653 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1353 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1348 | 2144 | 3813 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1261 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1283 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1268 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1440 | 17582 | 12060 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (34) | 1475 | 9168 | 14916 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1401 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1339 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1341 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1386 | 18981 | 14560 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1328 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1379 | 6131 | 5621 | 0 | 0 | ok |
| `pessoas` | Time | 1310 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1275 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1370 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1568 | 5615 | 4111 | 0 | 3 | ok |
| `turminha:ter` | Terça 46 | 1550 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1579 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1556 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1579 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1550 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1593 | 7367 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1610 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1569 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1574 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1526 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1524 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1660 | 4495 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1497 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1576 | 3820 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1486 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1470 | 2471 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1480 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1822 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1498 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1491 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1491 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1580 | 3579 | 3262 | 0 | 0 | ok |

