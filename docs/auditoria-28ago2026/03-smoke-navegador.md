# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 15/09/2026, 18:16:31.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-15-04.

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
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 40 |
| `vet` | Suellen (`vet`) | 2 | 0 | 17 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 89 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 187 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 188 |

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
| `monitor` | `checkout` | 5 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · set auaulandia/med-vigia/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `plantonista` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `recepcao` | `inicio` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `hospedes` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `alergia` | 2 | set daycare/dashboard-auto/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `vacinas` | 2 | set daycare/dashboard-auto/2026-09-16 · set daycare/dashboard-auto/2026-09-17 |
| `recepcao` | `emporio` | 3 | transaction daycare/avisos-telegram-atraso/2026-09-15 · set daycare/dashboard-auto/2026-09-18 · set daycare/dashboard-auto/2026-09-19 |
| `recepcao` | `reposicao` | 2 | transaction daycare/falta-automatica/2026-09-15 · set daycare/dashboard-auto/2026-09-20 |
| `recepcao` | `lancar-pagamento` | 2 | set daycare/dashboard-auto/2026-09-21 · set daycare/dashboard-auto/2026-09-22 |
| `recepcao` | `eahist` | 2 | set daycare/dashboard-auto/2026-09-23 · set daycare/dashboard-auto/2026-09-24 |
| `recepcao` | `ritmo` | 3 | set daycare/dashboard-auto/2026-09-25 · transaction daycare/falta-automatica/2026-09-15 · set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `agenda` | 2 | set daycare/dashboard-auto/2026-09-27 · set daycare/dashboard-auto/2026-09-28 |
| `vet` | _(carga + entrada)_ | 16 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `supervisao` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `supervisao` | `painel-amanda` | 6 | transaction daycare/falta-automatica/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `acerto` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | _(carga + entrada)_ | 61 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `painel-amanda` | 6 | transaction daycare/falta-automatica/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `ritmo` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:almoco` | 7 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1789411796070_tv6c_09-00 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | _(carga + entrada)_ | 61 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `painel-amanda` | 6 | transaction daycare/falta-automatica/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `conferencia` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `checkout` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `cuidadovet` | 6 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 7 | set daycare/dashboard-auto/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-15 · set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:foto` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-21 |

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
| `painelmeu` | Meu Dashboard | 1262 | 1804 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1280 | 434 | 324 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1293 | 964 | 1103 | 0 | 5 | ok |
| `abertura` | Abertura do dia | 1266 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1383 | 2457 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1344 | 1816 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1284 | 2873 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9280 | 1311 | 1624 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 9381 | 302 | 287 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9373 | 2485 | 1717 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9320 | 6711 | 5276 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 9331 | 1299 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9435 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 9304 | 414 | 376 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 9470 | 12346 | 11257 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9328 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 9325 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9367 | 3520 | 5239 | 0 | 2 | ok |
| `vacinas` | Prevenção | 9516 | 14569 | 10320 | 0 | 2 | ok |
| `emporio` | Quem não comeu hoje | 9313 | 2343 | 3335 | 0 | 3 | ok |
| `reposicao` | Reposições 42 | 9335 | 5441 | 4328 | 0 | 2 | ok |
| `lancar-pagamento` | Lançar pagamento | 9280 | 545 | 423 | 0 | 2 | ok |
| `eahist` | Enriquecimento Ambiental | 9278 | 415 | 492 | 0 | 2 | ok |
| `ritmo` | Ritmo do Time | 9332 | 7550 | 5035 | 0 | 3 | ok |
| `agenda` | Agenda em breve | 9299 | 59 | 339 | 0 | 2 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1270 | 585 | 489 | 0 | 1 | ok |
| `peso` | Peso | 1265 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9288 | 1311 | 1624 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9541 | 492 | 446 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9392 | 2483 | 1717 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9428 | 6212 | 3801 | 0 | 6 | ok |
| `conferencia` | Conferência do check-in | 2563 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1333 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1324 | 1304 | 1534 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1377 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1301 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1265 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1607 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1285 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1354 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1300 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 1310 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1267 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1432 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1343 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1318 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1352 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1276 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1306 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1262 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1265 | 3454 | 3482 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 1431 | 7550 | 5035 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1254 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1334 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9271 | 1311 | 1624 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9642 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9441 | 2487 | 1717 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9275 | 6216 | 3801 | 0 | 6 | ok |
| `paineloperacao` | Dashboard da Márcia | 9354 | 5810 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2346 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1316 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1394 | 2874 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1300 | 1304 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1266 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1359 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1274 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1274 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1522 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1325 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1265 | 298 | 471 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1265 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1462 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1279 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1297 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1298 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1270 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1300 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1252 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1268 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1299 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1269 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1266 | 7550 | 5035 | 0 | 1 | ok |
| `pessoas` | Time | 1269 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1240 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1317 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1555 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1415 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1386 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1430 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1450 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1409 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1453 | 7482 | 5476 | 0 | 7 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1439 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1424 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1404 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1442 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1420 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1504 | 4671 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1483 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1483 | 3969 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1490 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1567 | 2457 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1414 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1828 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1502 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1440 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1470 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1582 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9274 | 1311 | 1624 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9613 | 551 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9455 | 2493 | 1717 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9412 | 6222 | 3801 | 0 | 6 | ok |
| `paineloperacao` | Dashboard da Márcia | 9346 | 5816 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9415 | 5269 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2438 | 434 | 324 | 0 | 6 | ok |
| `hospedes` | Hóspedes de hoje | 1347 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1381 | 2874 | 3182 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1289 | 1304 | 1534 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1273 | 869 | 998 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1378 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1284 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1536 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1279 | 585 | 489 | 0 | 6 | ok |
| `orcamento` | Orçamento de hospedagem | 1346 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1321 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1257 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1413 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1302 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1295 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1303 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1291 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1329 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1317 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1463 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1281 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1250 | 7550 | 5035 | 0 | 0 | ok |
| `pessoas` | Time | 1270 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1301 | 2243 | 1870 | 0 | 7 | ok |
| `turminha:seg` | Segunda 44 | 1575 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1465 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1450 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1493 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1468 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1546 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1461 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1626 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1544 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1492 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1423 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1531 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1633 | 4672 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1401 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1531 | 3970 | 3650 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1408 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1490 | 2458 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1452 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1683 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1425 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1376 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1458 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1456 | 3579 | 3262 | 0 | 1 | ok |

