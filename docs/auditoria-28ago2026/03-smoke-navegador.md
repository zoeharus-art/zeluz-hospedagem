# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 22/09/2026, 09:54:51.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-21 e versão carimbada 2026-09-22-01.

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
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 9 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 65 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 113 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 160 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `monitor` | `checkout` | 1 | transaction daycare/turma/2026-09-22 |
| `plantonista` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `recepcao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 1 | transaction daycare/turma/2026-09-22 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-22 |
| `supervisao` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `supervisao` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `supervisao` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `inicio` | 1 | transaction daycare/turma/2026-09-22 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:qua` | 4 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set daycare/dashboard-auto/2026-09-22 · push daycare/auditoria/2026-09-22 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | _(carga + entrada)_ | 51 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · transaction daycare/aniversario-enviado/2026-09-22 |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 · remove daycare/fotos-corpo/2026-08-29 · remove daycare/fotos-corpo/2026-08-28 |
| `diretoria` | `checkin` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-22 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 2 | set daycare/dashboard-auto/2026-09-22 · push daycare/auditoria/2026-09-22 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:foto` | 2 | transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-22/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `atividade:peso` | 1 | update daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1255 | 1813 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1267 | 559 | 560 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1331 | 1281 | 1376 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1279 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1411 | 2569 | 1538 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1268 | 1825 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1273 | 2849 | 3216 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1283 | 1741 | 1912 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1476 | 385 | 303 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1284 | 3188 | 2094 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1258 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1303 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1404 | 6715 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1355 | 1257 | 1452 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1372 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1311 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1621 | 28155 | 42600 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1356 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1389 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1294 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1315 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1341 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1531 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2279 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1297 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1371 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1374 | 4718 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1280 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1239 | 487 | 484 | 0 | 1 | ok |
| `peso` | Peso | 1270 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9312 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9718 | 576 | 477 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9572 | 3186 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9291 | 6842 | 3962 | 0 | 2 | ok |
| `eahist` | Enriquecimento Ambiental | 9265 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9295 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2409 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1380 | 6749 | 5274 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1354 | 1257 | 1452 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1422 | 14642 | 9883 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1298 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1320 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1668 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1324 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1373 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1411 | 1877 | 3606 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1269 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1279 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1277 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1501 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2423 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1440 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1603 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1386 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1449 | 22395 | 16630 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1295 | 6394 | 5940 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1281 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1345 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1799 | 4244 | 3711 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1507 | 1485 | 1694 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1255 | 1741 | 1912 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1602 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1379 | 3190 | 2094 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1266 | 6846 | 3962 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1380 | 8204 | 4377 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1284 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1263 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1325 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1299 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1367 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1442 | 2754 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1283 | 1257 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1296 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1364 | 14642 | 9883 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1281 | 437 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1586 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1300 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1312 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1378 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1265 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1294 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1265 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1578 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2337 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1332 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1513 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1382 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1409 | 22395 | 16630 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1287 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1329 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1308 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1298 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1326 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1485 | 5900 | 4058 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 46 | 1450 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1413 | 5342 | 3824 | 0 | 4 | ok |
| `turminha:qui` | Quinta 43 | 1426 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1406 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1531 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1450 | 7354 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1499 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1433 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1490 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1386 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1440 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1588 | 4538 | 3765 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1564 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1541 | 3854 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1563 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1537 | 2460 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1536 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1980 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1564 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1469 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1442 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1598 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9279 | 1741 | 1912 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9626 | 644 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9431 | 3196 | 2094 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9287 | 6852 | 3962 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9302 | 8210 | 4377 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9293 | 6882 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9289 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9306 | 521 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9373 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2297 | 559 | 560 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1322 | 6749 | 5274 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1397 | 2754 | 3110 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1296 | 1257 | 1452 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1305 | 1186 | 1271 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1396 | 14642 | 9883 | 0 | 42 | ok |
| `checkin` | Check-in 1 | 1347 | 437 | 411 | 0 | 2 | ok |
| `checkoutconf` | Check-out com o tutor | 1276 | 1110 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1756 | 28155 | 42600 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1336 | 487 | 484 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1323 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1409 | 2167 | 3945 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1307 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1307 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1272 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1580 | 24496 | 14707 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (45) | 2532 | 38978 | 37899 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1346 | 2433 | 1928 | 0 | 0 | ok |
| `reposicao` | Reposições 43 | 1489 | 5831 | 4315 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1330 | 4718 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1355 | 22395 | 16630 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1273 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1310 | 6394 | 5940 | 0 | 0 | ok |
| `pessoas` | Time | 1311 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1267 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1330 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1537 | 5016 | 3782 | 0 | 2 | ok |
| `turminha:ter` | Terça · hoje 46 | 1660 | 6125 | 4139 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1532 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1523 | 4970 | 3468 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1530 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1548 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1602 | 7354 | 5416 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1526 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1576 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1548 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1545 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1537 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1674 | 4539 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1572 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1661 | 3855 | 3574 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1554 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1621 | 2461 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1544 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1907 | 4151 | 4559 | 0 | 2 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1506 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1479 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1449 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1496 | 3579 | 3262 | 0 | 1 | ok |

