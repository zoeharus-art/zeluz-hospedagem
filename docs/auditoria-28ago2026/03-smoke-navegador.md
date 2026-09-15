# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 15/09/2026, 15:39:19.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-15-02.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 18 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 16 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 18 |
| `vet` | Suellen (`vet`) | 2 | 0 | 17 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 80 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 138 |
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
| `monitor` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `monitor` | `checkout` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `plantonista` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `recepcao` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `vet` | _(carga + entrada)_ | 14 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `vet` | `peso` | 2 | set daycare/aniversario-enviado/2026-09-15 · push daycare/auditoria/2026-09-15 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `supervisao` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `consultoras` | 44 | set daycare/aniversario-enviado/2026-09-15 · push daycare/auditoria/2026-09-15 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `supervisao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 15 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `checkout` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 6 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `gestao` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:foto` | 2 | set daycare/dashboard-auto/2026-09-20 · transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | _(carga + entrada)_ | 13 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `mesa` | 3 | transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `turminha:qui` | 6 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-20 |
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
| `conferencia` | Conferência do check-in | 1269 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1287 | 964 | 1103 | 0 | 3 | ok |
| `abertura` | Abertura do dia | 1275 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1252 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1418 | 2457 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1368 | 1816 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1268 | 2873 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1287 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1410 | 302 | 287 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1396 | 2134 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1329 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1347 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1345 | 9827 | 8869 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1504 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1270 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1289 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1252 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1320 | 12346 | 11257 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1269 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1299 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1304 | 1753 | 3292 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1258 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 415 | 492 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 1280 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1259 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1287 | 298 | 471 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1241 | 585 | 489 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1487 | 491 | 446 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1366 | 2132 | 1676 | 0 | 44 | ok |
| `painel-amanda` | Dashboard da Amanda | 1285 | 6224 | 3801 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1331 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1332 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1303 | 1303 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1351 | 9827 | 8869 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1478 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1381 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1299 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1259 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1558 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1281 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1363 | 14551 | 13410 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 1315 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1289 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1331 | 1753 | 3292 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1321 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1272 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1289 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1252 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1256 | 3454 | 3482 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1299 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1330 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1253 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1579 | 551 | 349 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1391 | 2136 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1312 | 6228 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1350 | 5810 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1317 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1348 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1413 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1291 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1271 | 869 | 998 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1398 | 9827 | 8869 | 0 | 42 | ok |
| `vacinas` | Prevenção | 1466 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1364 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1302 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1270 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1600 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1292 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1329 | 14551 | 13410 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1300 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1332 | 2043 | 3631 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1313 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1262 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1303 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1271 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1285 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1271 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1255 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1279 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1313 | 2243 | 1870 | 0 | 6 | ok |
| `turminha:seg` | Segunda 44 | 1544 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1459 | 5860 | 4049 | 0 | 1 | ok |
| `turminha:qua` | Quarta 45 | 1431 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1442 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1433 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1470 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1466 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1510 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1466 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1472 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1452 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1444 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1601 | 4658 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1484 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1597 | 3973 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1458 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1453 | 2457 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1442 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1801 | 4151 | 4559 | 0 | 2 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1432 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1416 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1458 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1528 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1269 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1598 | 551 | 349 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1384 | 2142 | 1676 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1289 | 6234 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1271 | 5816 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1344 | 5289 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1317 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1347 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1444 | 2873 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 1303 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1271 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1355 | 9827 | 8869 | 0 | 42 | ok |
| `vacinas` | Prevenção | 1437 | 15099 | 9999 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1375 | 3520 | 5239 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1264 | 414 | 376 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1262 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1551 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1298 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1254 | 14551 | 13410 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1304 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1303 | 5441 | 4328 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1323 | 2043 | 3631 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1296 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1268 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1302 | 9988 | 6488 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1269 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1283 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1282 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1270 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1318 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1498 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1464 | 5860 | 4049 | 0 | 1 | ok |
| `turminha:qua` | Quarta 45 | 1450 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1438 | 4983 | 3476 | 0 | 6 | ok |
| `turminha:sex` | Sexta 51 | 1429 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1455 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1452 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1495 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1472 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1477 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1420 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1439 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1539 | 4659 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1478 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1596 | 3974 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1485 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1453 | 2458 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1422 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1813 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1423 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1405 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1450 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1496 | 3579 | 3262 | 0 | 1 | ok |

