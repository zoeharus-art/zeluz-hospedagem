# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 15/09/2026, 14:57:04.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-15-01.

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
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 16 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 20 |
| `vet` | Suellen (`vet`) | 2 | 0 | 17 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 80 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 136 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 135 |

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
| `monitor` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `monitor` | `checkout` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `plantonista` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `recepcao` | `reposicao` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `vet` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `supervisao` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `supervisao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `vacinas` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:seg` | 5 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `gestao` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:massagem` | 2 | transaction daycare/falta-automatica/2026-09-15 · set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:qui` | 8 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:peso` | 1 | transaction daycare/falta-automatica/2026-09-15 |

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
| `painelmeu` | Meu Dashboard | 1267 | 1804 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1252 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1300 | 964 | 1103 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1271 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1413 | 2457 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1256 | 1816 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1289 | 2873 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1287 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1382 | 302 | 287 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1379 | 2134 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1301 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1301 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1393 | 9827 | 8869 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1467 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1301 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1348 | 12346 | 11257 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1301 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1327 | 5441 | 4328 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1352 | 1753 | 3292 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1253 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1254 | 415 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1259 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1283 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1257 | 585 | 489 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1284 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1471 | 491 | 446 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1367 | 2132 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1283 | 6224 | 3801 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1321 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1348 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1318 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1346 | 9827 | 8869 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1470 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1371 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1290 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1263 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1275 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1631 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1300 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1362 | 14551 | 13410 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 1293 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1314 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1317 | 1753 | 3292 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1330 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1254 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1297 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1251 | 3454 | 3482 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1294 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1259 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1314 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1266 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1575 | 551 | 349 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1391 | 2136 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1249 | 6228 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1344 | 5810 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1331 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1359 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1423 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1290 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1273 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1361 | 9827 | 8869 | 0 | 42 | ok |
| `vacinas` | Prevenção | 1450 | 15099 | 9999 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1374 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1284 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1274 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1283 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1610 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1300 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1346 | 14551 | 13410 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1318 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1344 | 2043 | 3631 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1315 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1268 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1303 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1263 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1284 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1279 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1300 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1286 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1323 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1491 | 5016 | 3782 | 0 | 5 | ok |
| `turminha:ter` | Terça · hoje 44 | 1491 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1476 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1468 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1466 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1455 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1528 | 7482 | 5476 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1489 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1459 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1464 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1491 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1431 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1555 | 4690 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1448 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1503 | 3969 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1485 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1450 | 2457 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1429 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1801 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1413 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1399 | 386 | 425 | 0 | 2 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1452 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1504 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1257 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1761 | 551 | 349 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1368 | 2142 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1384 | 6234 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1336 | 5816 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1367 | 5289 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1302 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1337 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1414 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1332 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1281 | 869 | 998 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1361 | 9827 | 8869 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1458 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1270 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 1 | ok |
| `checkin` | Check-in | 1256 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1255 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1542 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1299 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1344 | 14551 | 13410 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1308 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1313 | 2043 | 3631 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1319 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1265 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1290 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1271 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1310 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1286 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1288 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1285 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1329 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1485 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1522 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1403 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1444 | 4983 | 3476 | 0 | 8 | ok |
| `turminha:sex` | Sexta 51 | 1456 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1438 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1435 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1493 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1458 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1458 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1447 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1461 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1590 | 4691 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1453 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1526 | 3970 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1462 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1439 | 2458 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1529 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1919 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1444 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1412 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1456 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1679 | 3579 | 3262 | 0 | 1 | ok |

