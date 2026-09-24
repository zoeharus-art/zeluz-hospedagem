# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 24/09/2026, 12:00:02.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-24-03.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 9 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 6 |
| `recepcao` | Giullian Gomes (`consultora`) | 23 | 0 | 18 |
| `vet` | Suellen (`vet`) | 2 | 0 | 7 |
| `supervisao` | Amanda Silva (`supervisor`) | 31 | 0 | 57 |
| `gestao` | Márcia · Gestora (`gestao`) | 58 | 0 | 105 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 59 | 0 | 104 |

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
| `monitor` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `monitor` | `checkout` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `plantonista` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/aniversario-enviado/2026-09-24 · push daycare/auditoria/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 7 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `peso` | 2 | set daycare/dashboard-auto/2026-09-24 · set daycare/dashboard-auto/2026-09-25 |
| `recepcao` | `alergia` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `recepcao` | `vacinas` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `recepcao` | `vencimentos` | 1 | set daycare/dashboard-auto/2026-09-28 |
| `recepcao` | `emporio` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-24 · set daycare/dashboard-auto/2026-09-29 |
| `recepcao` | `reposicao` | 1 | set daycare/dashboard-auto/2026-09-30 |
| `recepcao` | `renovacao` | 1 | update daycare/dashboard-auto/2026-10-01 |
| `recepcao` | `agenda` | 2 | set daycare/dashboard-auto/2026-10-02 · set daycare/dashboard-auto/2026-10-03 |
| `vet` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `vet` | `cuidadovet` | 2 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `supervisao` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `gestao` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:chamada` | 1 | update daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:jogos` | 1 | update daycare/dashboard-auto/2026-09-27 |
| `diretoria` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `diretoria` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:checkout-pert` | 1 | update daycare/dashboard-auto/2026-09-26 |
| `diretoria` | `atividade:peso` | 2 | transaction daycare/falta-automatica/2026-09-24 · set daycare/dashboard-auto/2026-09-27 |

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
| `painelmeu` | Meu Dashboard | 1257 | 1801 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1252 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1255 | 928 | 1088 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1246 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1359 | 2454 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1261 | 1813 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1254 | 2465 | 2585 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9263 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9458 | 253 | 303 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9298 | 3157 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9280 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9313 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9350 | 6546 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9307 | 797 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9331 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 9279 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 9275 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 9598 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9322 | 1518 | 1463 | 0 | 0 | ok |
| `hoje` | Hoje na casa (4) | 9372 | 1434 | 741 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9303 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 9264 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 9292 | 321 | 471 | 0 | 2 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9269 | 3684 | 5497 | 0 | 1 | ok |
| `vacinas` | Prevenção | 9487 | 25030 | 14908 | 0 | 1 | ok |
| `vencimentos` | Vence amanhã (51) | 9780 | 43190 | 41650 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 9304 | 3549 | 3952 | 0 | 2 | ok |
| `reposicao` | Reposições 45 | 9421 | 6551 | 4502 | 0 | 1 | ok |
| `renovacao` | Renovação de planos | 9300 | 4613 | 3811 | 0 | 1 | ok |
| `agenda` | Agenda em breve | 9271 | 59 | 339 | 0 | 2 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1251 | 626 | 660 | 0 | 2 | ok |
| `peso` | Peso | 1248 | 321 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 31 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1248 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1472 | 399 | 348 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1361 | 3155 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1258 | 6883 | 3985 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1251 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1274 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1270 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1307 | 6563 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1269 | 797 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1320 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1263 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1540 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1272 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1245 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na casa (4) | 1307 | 1434 | 741 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1287 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1266 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1242 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1409 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1722 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1285 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1321 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1273 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1317 | 22787 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1270 | 6900 | 6456 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1260 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1318 | 2521 | 2041 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1515 | 3899 | 3414 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1326 | 1266 | 1516 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1244 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1530 | 546 | 349 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1348 | 3159 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1259 | 6887 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1265 | 8580 | 4845 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1247 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1256 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1279 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1321 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1352 | 1909 | 2463 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1268 | 797 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1275 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1319 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1258 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1523 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1270 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1261 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na casa (4) | 1329 | 1434 | 741 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1304 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1265 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1245 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1482 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1718 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1289 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1323 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1281 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1318 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1258 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1262 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1278 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1307 | 2521 | 2041 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1475 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1418 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1411 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1402 | 5404 | 3834 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1442 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1488 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1392 | 7462 | 5371 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1418 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1434 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1440 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1408 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1419 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1578 | 4667 | 3841 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1403 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1468 | 3980 | 3650 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1397 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1397 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1388 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1637 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1398 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1386 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1414 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1481 | 3579 | 3264 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 59 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1246 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1615 | 546 | 349 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1345 | 3165 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1264 | 6893 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1255 | 8586 | 4845 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1260 | 6897 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1265 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1264 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1285 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1310 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1302 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1347 | 1909 | 2463 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1268 | 797 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1275 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1318 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1255 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1479 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1275 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1263 | 1562 | 1513 | 0 | 0 | ok |
| `hoje` | Hoje na casa (4) | 1317 | 1434 | 741 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1289 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1263 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1275 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1395 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1785 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1285 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1321 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1290 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1330 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1258 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1269 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1270 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1312 | 2521 | 2041 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1430 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1415 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1430 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1423 | 5404 | 3834 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1450 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1421 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1460 | 7462 | 5371 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1453 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1412 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1470 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1370 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1429 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1499 | 4668 | 3841 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1418 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1533 | 3981 | 3650 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1435 | 1326 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1415 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1397 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1653 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1398 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1338 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1443 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1468 | 3579 | 3264 | 0 | 2 | ok |

