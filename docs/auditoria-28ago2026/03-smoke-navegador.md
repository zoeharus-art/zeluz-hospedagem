# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 15/09/2026, 20:30:36.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-15 e versão carimbada 2026-09-15-05.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 25 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 20 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 25 |
| `vet` | Suellen (`vet`) | 2 | 0 | 21 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 99 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 205 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 146 |

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
| `monitor` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `monitor` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-15 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `plantonista` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `plantonista` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-15 |
| `recepcao` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `recepcao` | `inicio` | 1 | transaction daycare/resumo-gestao/2026-09-15 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `recepcao` | `ritmo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `vet` | _(carga + entrada)_ | 19 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-15 |
| `vet` | `peso` | 1 | transaction daycare/resumo-gestao/2026-09-15 |
| `supervisao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `supervisao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `supervisao` | `painel-amanda` | 8 | transaction daycare/falta-automatica/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `supervisao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `supervisao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `ritmo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | _(carga + entrada)_ | 76 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `gestao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `gestao` | `cuidadovet` | 9 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `ritmo` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `turminha:sex` | 8 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `gestao` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `gestao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-15 · set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | _(carga + entrada)_ | 18 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `diretoria` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-15 · transaction daycare/turma/2026-09-15 · transaction daycare/avisos-telegram-atraso/2026-09-15 · transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `conferencia` | 8 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 · remove daycare/fotos-corpo/2026-08-22 · remove daycare/fotos-corpo/2026-08-21 |
| `diretoria` | `cuidadovet` | 9 | set auaulandia/med-vigia/2026-09-15 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-15 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `ritmo` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `turminha:sex` | 8 | transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_07-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_12-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504656_p8xk_19-00 · transaction daycare/urgencias-enviadas/2026-09-15/med-dolly__marguita-ci_1784652504657_a0pg_09-00 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-15 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-20 |

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
| `painelmeu` | Meu Dashboard | 1270 | 1804 | 1514 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1247 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1266 | 964 | 1103 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1264 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1254 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1396 | 2457 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1263 | 1816 | 1453 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1278 | 2885 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1254 | 1311 | 1624 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1362 | 302 | 287 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1381 | 2485 | 1717 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1289 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1304 | 1340 | 1536 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1327 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1270 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1311 | 12346 | 11257 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1315 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1243 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1364 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1304 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1298 | 5441 | 4328 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1254 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 415 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1255 | 7550 | 5035 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1271 | 585 | 489 | 0 | 1 | ok |
| `peso` | Peso | 1272 | 298 | 471 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9290 | 1311 | 1624 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9447 | 492 | 446 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9364 | 2483 | 1717 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9275 | 6212 | 3801 | 0 | 8 | ok |
| `conferencia` | Conferência do check-in | 2272 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1461 | 6711 | 5276 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1364 | 1340 | 1536 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1320 | 9827 | 8869 | 0 | 0 | ok |
| `checkin` | Check-in | 1253 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1254 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1534 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1277 | 585 | 489 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1335 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1300 | 1753 | 3292 | 0 | 0 | ok |
| `peso` | Peso | 1270 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1254 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1377 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1285 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1286 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1263 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1277 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1251 | 3454 | 3482 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1270 | 7550 | 5035 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1323 | 2243 | 1870 | 0 | 1 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1242 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1580 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1358 | 2487 | 1717 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1282 | 6216 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1264 | 5810 | 3110 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1332 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1348 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1396 | 2908 | 3158 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1298 | 1340 | 1536 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1268 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1349 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1280 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1272 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1507 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1275 | 585 | 489 | 0 | 9 | ok |
| `orcamento` | Orçamento de hospedagem | 1264 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1336 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1265 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1244 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1381 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1308 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1286 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1299 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1262 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1285 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1250 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1267 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1269 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1247 | 7550 | 5035 | 0 | 1 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1250 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1310 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1473 | 5016 | 3782 | 0 | 1 | ok |
| `turminha:ter` | Terça · hoje 44 | 1470 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1407 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1482 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1445 | 5774 | 4121 | 0 | 8 | ok |
| `atividade:agility` | Agility Funcional | 1430 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1470 | 7482 | 5476 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1433 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1433 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1457 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1365 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1413 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1480 | 4663 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1450 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1505 | 3947 | 3650 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1409 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1412 | 2457 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1392 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1672 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1400 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1377 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1420 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1515 | 3579 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1265 | 1311 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1521 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1364 | 2493 | 1717 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1269 | 6222 | 3801 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1269 | 5816 | 3110 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1269 | 5253 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1299 | 434 | 324 | 0 | 8 | ok |
| `hospedes` | Hóspedes de hoje | 1301 | 6711 | 5276 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1400 | 2908 | 3158 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1285 | 1340 | 1536 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1267 | 869 | 998 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1320 | 9827 | 8869 | 0 | 42 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1274 | 708 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 2 | 1444 | 21984 | 32658 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1269 | 585 | 489 | 0 | 9 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 14551 | 13410 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1312 | 2043 | 3631 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1244 | 3520 | 5239 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1415 | 14569 | 10320 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1291 | 2343 | 3335 | 0 | 1 | ok |
| `reposicao` | Reposições 42 | 1299 | 5441 | 4328 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1289 | 4739 | 3885 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1255 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1287 | 12061 | 8336 | 0 | 6 | ok |
| `eahist` | Enriquecimento Ambiental | 1265 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1251 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1289 | 3454 | 3482 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1270 | 500 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1253 | 7550 | 5035 | 0 | 1 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1254 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1301 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1452 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 44 | 1414 | 5860 | 4049 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1418 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta 43 | 1404 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1391 | 5774 | 4121 | 0 | 8 | ok |
| `atividade:agility` | Agility Funcional | 1448 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1397 | 7482 | 5476 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1413 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1412 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1416 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1419 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1385 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1472 | 4664 | 3841 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1412 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1450 | 3948 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1401 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1391 | 2458 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1382 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1649 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1387 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1385 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1411 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1447 | 3579 | 3262 | 0 | 0 | ok |

