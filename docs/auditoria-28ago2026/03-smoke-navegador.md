# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 15/09/2026, 16:52:37.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-15-03.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 21 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 16 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 19 |
| `vet` | Suellen (`vet`) | 2 | 0 | 17 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 79 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 131 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 133 |

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
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `plantonista` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `recepcao` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `vet` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `vet` | `cuidadovet` | 3 | set daycare/aniversario-enviado/2026-09-15 · push daycare/auditoria/2026-09-15 · set auaulandia/med-vigia/2026-09-15 |
| `supervisao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `supervisao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `pessoas` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `turminha:sex` | 6 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `cuidadovet` | 7 | transaction daycare/falta-automatica/2026-09-15 · set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `turminha:qui` | 6 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-19 |

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
| `painelmeu` | Meu Dashboard | 1272 | 1804 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1254 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1281 | 964 | 1103 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1256 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1381 | 2457 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1269 | 1816 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1268 | 2873 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1268 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1374 | 302 | 287 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1396 | 2485 | 1717 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1300 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1301 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1330 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1282 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1317 | 12346 | 11257 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1334 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 1266 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1270 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1465 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1299 | 5441 | 4328 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1256 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1251 | 415 | 492 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 1283 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1257 | 585 | 489 | 0 | 3 | ok |
| `peso` | Peso | 1273 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1277 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1396 | 491 | 446 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1368 | 2483 | 1717 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1273 | 6212 | 3801 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1321 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1327 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1300 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1315 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1277 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1269 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1554 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1283 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1272 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1310 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 1266 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1250 | 3520 | 5239 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1379 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1299 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1309 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1265 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1301 | 11170 | 7835 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1265 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1258 | 3454 | 3482 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1279 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1308 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1255 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1534 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1366 | 2487 | 1717 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1281 | 6216 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1329 | 5810 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1335 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1360 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1451 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1298 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1271 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1318 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1272 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1252 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1565 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1296 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1306 | 14551 | 13410 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1281 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1254 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1394 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1314 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1310 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1301 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1270 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1288 | 11170 | 7835 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1266 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1253 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1253 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1290 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1275 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1281 | 1104 | 1676 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1252 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1283 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1495 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1423 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1366 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1376 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1398 | 5774 | 4121 | 0 | 6 | ok |
| `atividade:agility` | Agility Funcional | 1435 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1413 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1464 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1408 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1422 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1415 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1403 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1587 | 4667 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1418 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1487 | 3947 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1440 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1425 | 2457 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1419 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1667 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1411 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1383 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1420 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1455 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1250 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1505 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1388 | 2493 | 1717 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1286 | 6222 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1332 | 5816 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1345 | 5281 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1285 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1331 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1408 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1299 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1284 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1331 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1265 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1251 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1564 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1270 | 585 | 489 | 0 | 7 | ok |
| `orcamento` | Orçamento de hospedagem | 1331 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1301 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1270 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1424 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1287 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1288 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1274 | 11170 | 7835 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1254 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1273 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1255 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1271 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1317 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1445 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1407 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1395 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1414 | 4983 | 3476 | 0 | 6 | ok |
| `turminha:sex` | Sexta 51 | 1392 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1415 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1411 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1448 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1403 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1439 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1419 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1429 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1511 | 4668 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1480 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1525 | 3948 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1443 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1427 | 2458 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1470 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1755 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1408 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1364 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1416 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1448 | 3579 | 3262 | 0 | 0 | ok |

