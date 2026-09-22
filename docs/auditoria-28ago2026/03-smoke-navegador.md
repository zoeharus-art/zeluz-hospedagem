# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 22/09/2026, 11:55:26.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-22-02.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 11 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 9 |
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 19 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 64 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 156 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 113 |

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
| `monitor` | `checkout` | 1 | transaction daycare/turma/2026-09-22 |
| `plantonista` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `recepcao` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `recepcao` | `peso` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `recepcao` | `alergia` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `recepcao` | `vacinas` | 2 | set daycare/dashboard-auto/2026-09-24 · set daycare/dashboard-auto/2026-09-25 |
| `recepcao` | `vencimentos` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `emporio` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `reposicao` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `recepcao` | `renovacao` | 2 | set daycare/dashboard-auto/2026-09-29 · set daycare/dashboard-auto/2026-09-30 |
| `recepcao` | `agenda` | 1 | set daycare/dashboard-auto/2026-10-01 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `mesa` | 1 | transaction daycare/turma/2026-09-22 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | _(carga + entrada)_ | 51 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `gestao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `peso` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `atividade:almoco` | 2 | set daycare/dashboard-auto/2026-09-22 · push daycare/auditoria/2026-09-22 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `diretoria` | `mesa` | 1 | transaction daycare/turma/2026-09-22 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `turminha:qua` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1363 | 1813 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1265 | 559 | 560 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1335 | 1281 | 1376 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1257 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1380 | 2569 | 1538 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1346 | 1825 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1271 | 2849 | 3216 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9298 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9542 | 385 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9324 | 3188 | 2094 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9282 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9308 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9461 | 6715 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9325 | 1257 | 1452 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9428 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 9301 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9292 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 9618 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9340 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9340 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 9262 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 9298 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9275 | 3660 | 5454 | 0 | 1 | ok |
| `vacinas` | Prevenção | 9454 | 24496 | 14707 | 0 | 2 | ok |
| `vencimentos` | Vence amanhã (45) | 10462 | 40093 | 38272 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 9289 | 2433 | 1928 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 9513 | 5831 | 4315 | 0 | 1 | ok |
| `renovacao` | Renovação de planos | 9320 | 4718 | 3885 | 0 | 2 | ok |
| `agenda` | Agenda em breve | 9277 | 59 | 339 | 0 | 1 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1245 | 487 | 484 | 0 | 1 | ok |
| `peso` | Peso | 1257 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1295 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1546 | 576 | 477 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1380 | 3186 | 2094 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1281 | 6842 | 3962 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1267 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1302 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1292 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1332 | 6749 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1301 | 1257 | 1452 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1350 | 17076 | 10522 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1276 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1456 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1281 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1273 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1328 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1272 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1276 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1255 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1630 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2160 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1361 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1344 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1392 | 22774 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1275 | 6394 | 5940 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1315 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1577 | 4338 | 3732 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1523 | 1485 | 1694 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9263 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9533 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9439 | 3190 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9319 | 6846 | 3962 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9288 | 8204 | 4377 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9341 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9277 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9295 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2477 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1348 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1405 | 2754 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1292 | 1257 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1281 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1368 | 17076 | 10522 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1277 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1254 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1568 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1293 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1270 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1321 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1256 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 2 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1268 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1506 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2066 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1420 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1535 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1393 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1320 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1268 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1289 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1298 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1306 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1469 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1497 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1426 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1395 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1435 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1492 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1445 | 7354 | 5416 | 0 | 2 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1404 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1415 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1406 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1381 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1405 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1486 | 4536 | 3765 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1445 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1440 | 3849 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1430 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1469 | 2460 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1510 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1839 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1483 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1435 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1406 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1454 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1246 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1551 | 644 | 494 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1364 | 3196 | 2094 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1256 | 6852 | 3962 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1258 | 8210 | 4377 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1244 | 6894 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1258 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1318 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1295 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1349 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1397 | 2754 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1291 | 1257 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1278 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1336 | 17076 | 10522 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1264 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1273 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1556 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1270 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1321 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1256 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1272 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1259 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1400 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 1806 | 40093 | 38272 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1290 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1351 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1316 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1378 | 22774 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1288 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1311 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1301 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1335 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1427 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1458 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1471 | 5342 | 3824 | 0 | 2 | ok |
| `turminha:qui` | Quinta 43 | 1498 | 4970 | 3468 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1406 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1481 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1429 | 7354 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1454 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1402 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1446 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1490 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1430 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1472 | 4537 | 3765 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1567 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1558 | 3850 | 3574 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1484 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1436 | 2461 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1418 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1606 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1398 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1412 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1536 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1565 | 3579 | 3262 | 0 | 0 | ok |

