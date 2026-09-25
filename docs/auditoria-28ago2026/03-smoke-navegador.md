# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 24/09/2026, 21:19:32.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-24-08.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 14 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 9 |
| `recepcao` | Giullian Gomes (`consultora`) | 24 | 0 | 32 |
| `vet` | Suellen (`vet`) | 2 | 0 | 10 |
| `supervisao` | Amanda Silva (`supervisor`) | 32 | 0 | 71 |
| `gestao` | Márcia · Gestora (`gestao`) | 59 | 0 | 164 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 60 | 0 | 166 |

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
| `monitor` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-24 · transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 |
| `plantonista` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · push daycare/auditoria/2026-09-24 |
| `plantonista` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-24 |
| `recepcao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `recepcao` | `inicio` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `gestdia` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `recepcao` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `banhos` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `peso` | 3 | set daycare/dashboard-auto/2026-09-24 · transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-09-25 |
| `recepcao` | `alergia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `vacinas` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `vencimentos` | 2 | set daycare/dashboard-auto/2026-09-28 · transaction daycare/falta-automatica/2026-09-24 |
| `recepcao` | `emporio` | 3 | set daycare/dashboard-auto/2026-09-29 · transaction daycare/avisos-telegram-atraso/2026-09-24 · set daycare/dashboard-auto/2026-09-30 |
| `recepcao` | `reposicao` | 1 | set daycare/dashboard-auto/2026-10-01 |
| `recepcao` | `renovacao` | 3 | set daycare/dashboard-auto/2026-10-02 · transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-10-03 |
| `recepcao` | `agenda` | 1 | set daycare/dashboard-auto/2026-10-04 |
| `vet` | _(carga + entrada)_ | 9 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | _(carga + entrada)_ | 12 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `supervisao` | `inicio` | 43 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `supervisao` | `painel-amanda` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `supervisao` | `recepcao` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `supervisao` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-09-24 |
| `gestao` | _(carga + entrada)_ | 54 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `gestao` | `inicio` | 43 | transaction daycare/falta-automatica/2026-09-24 · remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 |
| `gestao` | `painel-amanda` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `linhadotempo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `dashdc` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:almoco2` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-29 |
| `diretoria` | _(carga + entrada)_ | 54 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `diretoria` | `inicio` | 43 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `painel-amanda` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `eahist` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `diretoria` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `checkoutconf` | 2 | transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `turminha:ter` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-24 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `diretoria` | `atividade:musicoterapia` | 3 | set daycare/dashboard-auto/2026-09-29 · transaction daycare/falta-automatica/2026-09-24 · transaction daycare/urgencias-enviadas/2026-09-24/med-romeo__jeanine-ci_1789820689356_sbzg_14-00 |

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
| `painelmeu` | Meu Dashboard | 1246 | 1803 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1254 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1304 | 928 | 1088 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1240 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1380 | 2454 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1268 | 1804 | 1453 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1257 | 2473 | 2585 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 24 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9266 | 1767 | 2016 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 9538 | 252 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9305 | 3157 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9269 | 471 | 518 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9304 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9316 | 6546 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9299 | 820 | 1038 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 9336 | 19201 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 9299 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9276 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 9587 | 34018 | 52207 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 9311 | 1518 | 1463 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 9397 | 2257 | 906 | 0 | 0 | ok |
| `banhos` | Banhos recorrentes | 9311 | 19877 | 10335 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 9380 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 9259 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 9281 | 321 | 471 | 0 | 3 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9272 | 3684 | 5497 | 0 | 1 | ok |
| `vacinas` | Prevenção | 9488 | 18375 | 14602 | 0 | 1 | ok |
| `vencimentos` | Vencimentos (48) | 9861 | 53570 | 51644 | 0 | 2 | ok |
| `emporio` | Quem não comeu hoje | 9306 | 3549 | 3952 | 0 | 3 | ok |
| `reposicao` | Reposições 45 | 9430 | 6551 | 4502 | 0 | 1 | ok |
| `renovacao` | Renovação de planos | 9288 | 4613 | 3811 | 0 | 3 | ok |
| `agenda` | Agenda em breve | 9274 | 59 | 339 | 0 | 1 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1225 | 626 | 660 | 0 | 1 | ok |
| `peso` | Peso | 1243 | 321 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 32 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9287 | 1767 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9543 | 460 | 348 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9397 | 3155 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9271 | 6891 | 3985 | 0 | 2 | ok |
| `eahist` | Enriquecimento Ambiental | 9284 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9279 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2272 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1302 | 6563 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1303 | 821 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1339 | 19201 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1256 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1539 | 34018 | 52207 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1310 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1321 | 2257 | 906 | 0 | 0 | ok |
| `banhos` | Banhos recorrentes | 1320 | 19877 | 10335 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1317 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1258 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1269 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1509 | 18375 | 14602 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1696 | 53570 | 51644 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1314 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1415 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1286 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1320 | 24367 | 17968 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1256 | 6900 | 6456 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1265 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1302 | 2523 | 2041 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1639 | 3983 | 3435 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1401 | 1266 | 1516 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 59 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9285 | 1767 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9561 | 643 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9383 | 3159 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9278 | 6895 | 3985 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9255 | 8582 | 4845 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9259 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9265 | 527 | 646 | 0 | 1 | ok |
| `ritmo` | Ritmo do Time | 9275 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2352 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1322 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1351 | 1960 | 2491 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1274 | 821 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1277 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1352 | 19201 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1248 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1260 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1540 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1259 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1337 | 2257 | 906 | 0 | 0 | ok |
| `banhos` | Banhos recorrentes | 1301 | 19877 | 10335 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1323 | 2507 | 4275 | 0 | 2 | ok |
| `pendencias` | Pendências de prevenção | 1244 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1253 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1439 | 18375 | 14602 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1587 | 53570 | 51644 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1297 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1449 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1286 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1322 | 24367 | 17968 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1252 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1270 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1272 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1243 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1294 | 2523 | 2041 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1469 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1379 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1401 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1476 | 5404 | 3834 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1502 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1410 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1413 | 7567 | 5392 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1441 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1410 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1424 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1409 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1456 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1533 | 4767 | 3862 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1393 | 1389 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1546 | 4092 | 3671 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1470 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1448 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1412 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1670 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1373 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1358 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1445 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1472 | 3579 | 3264 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 60 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9273 | 1767 | 2016 | 0 | 43 | ok |
| `mesa` | O que fazer hoje | 9588 | 643 | 494 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9379 | 3165 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9283 | 6901 | 3985 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 9275 | 8588 | 4845 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9243 | 6863 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9251 | 471 | 518 | 0 | 1 | ok |
| `linhadotempo` | Linha do tempo do dia | 9263 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9305 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2333 | 441 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1304 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1350 | 1960 | 2491 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1272 | 821 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1274 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1352 | 19201 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1249 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1256 | 910 | 895 | 0 | 2 | ok |
| `recepcao` | Pendências com o tutor | 1524 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 626 | 660 | 0 | 2 | ok |
| `orcamento` | Orçamento de hospedagem | 1260 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na Zêluz (5) | 1336 | 2257 | 906 | 0 | 0 | ok |
| `banhos` | Banhos recorrentes | 1307 | 19877 | 10335 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1378 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1261 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1480 | 18375 | 14602 | 0 | 0 | ok |
| `vencimentos` | Vencimentos (48) | 1814 | 53570 | 51644 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1289 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1392 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1302 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1318 | 24367 | 17968 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1269 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1276 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1258 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1296 | 2523 | 2041 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1469 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1405 | 5461 | 3809 | 0 | 1 | ok |
| `turminha:qua` | Quarta 47 | 1411 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1651 | 5404 | 3834 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1423 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1393 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1422 | 7567 | 5392 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1440 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1456 | 2437 | 3349 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1442 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1374 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1418 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1520 | 4768 | 3862 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1432 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1516 | 4093 | 3671 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1398 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1414 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1420 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1657 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1408 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1389 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1310 | 2431 | 3349 | 0 | 3 | ok |
| `atividade:peso` | Peso do peludinho | 1429 | 3579 | 3264 | 0 | 0 | ok |

