# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 16/09/2026, 13:15:07.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-16-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 19 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 15 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 19 |
| `vet` | Suellen (`vet`) | 2 | 0 | 16 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 79 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 185 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 137 |

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
| `monitor` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `monitor` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/turma/2026-09-16 |
| `monitor` | `checkout` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-16 · transaction daycare/falta-automatica/2026-09-16 |
| `plantonista` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-16 · transaction daycare/avisos-telegram-atraso/2026-09-16 · transaction daycare/falta-automatica/2026-09-16 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-16 |
| `recepcao` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `vet` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-16 |
| `supervisao` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `mesa` | 3 | transaction daycare/turma/2026-09-16 · transaction daycare/avisos-telegram-atraso/2026-09-16 · transaction daycare/falta-automatica/2026-09-16 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 |
| `supervisao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-16 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 59 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-16 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `gestao` | `painel-amanda` | 6 | transaction daycare/falta-automatica/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 |
| `gestao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-16 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `turminha:qui` | 6 | transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `gestao` | `turminha:sex` | 2 | set daycare/dashboard-auto/2026-09-16 · push daycare/auditoria/2026-09-16 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:musicoterapia` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `diretoria` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `inicio` | 1 | transaction daycare/turma/2026-09-16 |
| `diretoria` | `mesa` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-16 · transaction daycare/falta-automatica/2026-09-16 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 |
| `diretoria` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `checkout` | 42 | remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 |
| `diretoria` | `checkoutconf` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `diretoria` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-16 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-16 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:seg` | 6 | transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-16/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `diretoria` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-09-16 · push daycare/auditoria/2026-09-16 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-16 · set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-16 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:foto` | 2 | set daycare/dashboard-auto/2026-09-20 · transaction daycare/falta-automatica/2026-09-16 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-21 |

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
| `painelmeu` | Meu Dashboard | 1476 | 1794 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1305 | 441 | 324 | 0 | 2 | ok |
| `checkout` | Check-out 2 | 1492 | 1151 | 1122 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1285 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1297 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1478 | 2445 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1292 | 1806 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1289 | 2877 | 3224 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1416 | 239 | 287 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1394 | 2376 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1324 | 6790 | 5291 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1349 | 1298 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1381 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1287 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1417 | 12544 | 11401 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1353 | 1684 | 3179 | 0 | 0 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1250 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1449 | 14943 | 10469 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1325 | 2347 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1342 | 5211 | 4214 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1276 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 415 | 492 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 1274 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1264 | 566 | 489 | 0 | 1 | ok |
| `peso` | Peso | 1307 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1297 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1588 | 428 | 333 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1436 | 2374 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1310 | 6246 | 3801 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1374 | 441 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1390 | 6790 | 5291 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1308 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1396 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1281 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 754 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1721 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 566 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1400 | 14749 | 13554 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1321 | 1684 | 3179 | 0 | 0 | ok |
| `peso` | Peso | 1291 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1411 | 3520 | 5239 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1462 | 14943 | 10469 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1304 | 2347 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1317 | 5211 | 4214 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1341 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1271 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1352 | 14176 | 10837 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1276 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1262 | 3721 | 3801 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1342 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1287 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1353 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9262 | 1311 | 1624 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9768 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9516 | 2378 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9316 | 6250 | 3801 | 0 | 6 | ok |
| `paineloperacao` | Dashboard da Márcia | 9414 | 5820 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2298 | 441 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1403 | 6790 | 5291 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1538 | 2861 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1364 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1433 | 1056 | 1017 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1631 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1340 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1294 | 754 | 607 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1783 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1310 | 566 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1432 | 14749 | 13554 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1411 | 1974 | 3518 | 0 | 0 | ok |
| `peso` | Peso | 1326 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1279 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1604 | 14943 | 10469 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1411 | 2347 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1364 | 5211 | 4214 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1362 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1293 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1337 | 14176 | 10837 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1285 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1291 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1280 | 3721 | 3801 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1308 | 503 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1321 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1302 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1260 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1371 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1650 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 44 | 1578 | 5014 | 3782 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1562 | 5015 | 3782 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1837 | 4983 | 3476 | 0 | 6 | ok |
| `turminha:sex` | Sexta 51 | 1539 | 5774 | 4121 | 0 | 2 | ok |
| `atividade:agility` | Agility Funcional | 1561 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1540 | 7307 | 5233 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1557 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1543 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1510 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1483 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1497 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1646 | 4465 | 3765 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1497 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1607 | 3790 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1595 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1593 | 2444 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1552 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2067 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1523 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1480 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1561 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1657 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1330 | 1311 | 1624 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1923 | 551 | 349 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1463 | 2384 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1301 | 6256 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1388 | 5826 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1419 | 5290 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1351 | 441 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1389 | 6790 | 5291 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1496 | 2861 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1340 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 2 | 1315 | 1056 | 1017 | 0 | 42 | ok |
| `ficha` | Cadastro de Peludinhos | 1648 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1334 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1307 | 754 | 607 | 0 | 1 | ok |
| `recepcao` | Pendências com o tutor 2 | 1757 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1414 | 566 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1450 | 14749 | 13554 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1411 | 1974 | 3518 | 0 | 0 | ok |
| `peso` | Peso | 1310 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1276 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1525 | 14943 | 10469 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1360 | 2347 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1328 | 5211 | 4214 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1325 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1262 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1352 | 14176 | 10837 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1290 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1288 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1293 | 3721 | 3801 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1292 | 503 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1281 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1448 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1277 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1352 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1522 | 5016 | 3782 | 0 | 6 | ok |
| `turminha:ter` | Terça 44 | 1469 | 5077 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1514 | 6081 | 4157 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1509 | 4983 | 3476 | 0 | 2 | ok |
| `turminha:sex` | Sexta 51 | 1482 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1565 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1599 | 7307 | 5233 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1521 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1537 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1492 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1579 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1602 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1737 | 4466 | 3765 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1553 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1733 | 3791 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1625 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1653 | 2445 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1799 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2156 | 4151 | 4559 | 0 | 2 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1630 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1639 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1640 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1756 | 3579 | 3262 | 0 | 0 | ok |

