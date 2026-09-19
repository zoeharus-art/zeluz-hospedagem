# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 19/09/2026, 12:30:08.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-19 e versão carimbada 2026-09-19-02.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 31 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 29 |
| `recepcao` | Giullian Gomes (`consultora`) | 20 | 0 | 30 |
| `vet` | Suellen (`vet`) | 2 | 0 | 30 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 84 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 135 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 56 | 0 | 178 |

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
| `monitor` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `plantonista` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `recepcao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `vet` | _(carga + entrada)_ | 29 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-19 |
| `supervisao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `supervisao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 28 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `gestao` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `turminha:sex` | 3 | set daycare/dashboard-auto/2026-09-20 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | _(carga + entrada)_ | 71 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 · remove auaulandia/med-tg-fila/-P1qqYq7W0LbNEMVR05C |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `painel-amanda` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `conferencia` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-28 · remove daycare/fotos-corpo/2026-08-27 · remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 |
| `diretoria` | `checkoutconf` | 2 | transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-19 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-19/med-juma__caroline%20moreira%20nogueira-vet_1789584182875_ragy_07-15 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-19 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-24 |

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
| `painelmeu` | Meu Dashboard | 1286 | 1802 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1276 | 435 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 2 | 1289 | 1077 | 1012 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1268 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1416 | 2455 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1269 | 1814 | 1476 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1274 | 3817 | 3971 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 20 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1273 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1381 | 278 | 241 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1397 | 2514 | 1809 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1286 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1288 | 10878 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1361 | 7622 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1320 | 2083 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1355 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1586 | 27857 | 42309 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1331 | 1276 | 1251 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1310 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1450 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1291 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1306 | 4767 | 3885 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1280 | 719 | 700 | 0 | 1 | ok |
| `peso` | Peso | 1285 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1279 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1476 | 294 | 316 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1365 | 2512 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1253 | 6320 | 3890 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1254 | 451 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1304 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1313 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1316 | 7741 | 5926 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1321 | 2084 | 2403 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1367 | 10185 | 9234 | 0 | 0 | ok |
| `checkin` | Check-in | 1283 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1259 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1611 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1299 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1366 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1332 | 1748 | 3361 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1269 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1526 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1289 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1300 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1318 | 14663 | 11049 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1269 | 5135 | 4948 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1277 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1321 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1865 | 3617 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1436 | 1303 | 1591 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1243 | 1506 | 1806 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1879 | 551 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1366 | 2516 | 1809 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1281 | 6324 | 3890 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1367 | 7372 | 3972 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1289 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1271 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1272 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1296 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1318 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1432 | 4330 | 4802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1330 | 2084 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1271 | 982 | 907 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1317 | 10185 | 9234 | 0 | 42 | ok |
| `checkin` | Check-in | 1294 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1269 | 471 | 320 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1709 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1302 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1301 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1299 | 2038 | 3700 | 0 | 0 | ok |
| `peso` | Peso | 1267 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1270 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1432 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1312 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1316 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1299 | 14663 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1259 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1266 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1281 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1325 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1558 | 5684 | 4097 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1450 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1437 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1468 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1472 | 5774 | 4121 | 0 | 3 | ok |
| `atividade:agility` | Agility Funcional | 1508 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1478 | 7180 | 5365 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1511 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1552 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1518 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1480 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1420 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1518 | 4377 | 3745 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1497 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1501 | 3661 | 3554 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1447 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1360 | 2453 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1426 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1756 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1421 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1420 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1469 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1513 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9264 | 1506 | 1806 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9539 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9410 | 2522 | 1809 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9279 | 6330 | 3890 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9263 | 7378 | 3972 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9266 | 6570 | 3564 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9272 | 451 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9257 | 512 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9358 | 10878 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2449 | 435 | 324 | 0 | 3 | ok |
| `hospedes` | Hóspedes de hoje | 1337 | 7741 | 5926 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1398 | 4330 | 4802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1304 | 2084 | 2403 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1259 | 982 | 907 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1321 | 10185 | 9234 | 0 | 42 | ok |
| `checkin` | Check-in | 1268 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1291 | 471 | 320 | 0 | 2 | ok |
| `recepcao` | Pendências com o tutor | 1589 | 27857 | 42309 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1288 | 719 | 700 | 0 | 3 | ok |
| `orcamento` | Orçamento de hospedagem | 1318 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1318 | 2038 | 3700 | 0 | 0 | ok |
| `peso` | Peso | 1275 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1264 | 3660 | 5454 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1453 | 17012 | 11762 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1274 | 3655 | 5176 | 0 | 1 | ok |
| `reposicao` | Reposições 43 | 1299 | 5366 | 4313 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1302 | 4767 | 3885 | 0 | 0 | ok |
| `config` | Configurações | 1315 | 14663 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1251 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1322 | 5135 | 4948 | 0 | 0 | ok |
| `pessoas` | Time | 1284 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1304 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1547 | 5684 | 4097 | 0 | 1 | ok |
| `turminha:ter` | Terça 46 | 1467 | 5322 | 3719 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1387 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1405 | 4970 | 3468 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1391 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1444 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1463 | 7180 | 5365 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1476 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1540 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1532 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1584 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1556 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1631 | 4378 | 3745 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1525 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1580 | 3662 | 3554 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1492 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1458 | 2454 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1406 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1740 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1463 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1401 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1517 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1451 | 3579 | 3262 | 0 | 0 | ok |

