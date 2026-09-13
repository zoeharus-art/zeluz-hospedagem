# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 13/09/2026, 00:14:57.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-12 e versão carimbada 2026-09-12-02.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 6 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 4 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 7 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 15 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 30 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 30 |

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
| `monitor` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `plantonista` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-13 · push daycare/auditoria/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `recepcao` | `ritmo` | 2 | set daycare/dashboard-auto/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `supervisao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `supervisao` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `supervisao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 |
| `gestao` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `gestao` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `gestao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | `atividade:almoco` | 2 | set daycare/dashboard-auto/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | _(carga + entrada)_ | 8 | set auaulandia/med-vigia/2026-09-13 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 |
| `diretoria` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `diretoria` | `checkout` | 1 | update daycare/checkin-corpo/2026-09-11 |
| `diretoria` | `ficha` | 3 | update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `diretoria` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `diretoria` | `atividade:almoco2` | 2 | set daycare/dashboard-auto/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-18 |

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
| `painelmeu` | Meu Dashboard | 1361 | 1776 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1266 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out | 1589 | 1294 | 1302 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1250 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1426 | 2436 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1290 | 1788 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1272 | 3848 | 3925 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9281 | 1190 | 1581 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9470 | 239 | 287 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9397 | 2139 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9348 | 7401 | 5802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9346 | 3173 | 3029 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9422 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 9520 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9384 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 9296 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 9283 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9399 | 12165 | 11072 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 9335 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 9290 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9317 | 1671 | 3134 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 9282 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9279 | 415 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9278 | 7386 | 4901 | 0 | 2 | ok |
| `agenda` | Agenda em breve | 9307 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1255 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1252 | 794 | 685 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9278 | 1190 | 1581 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 9514 | 317 | 333 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9428 | 2137 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9270 | 5738 | 3533 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2542 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1365 | 7401 | 5802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1392 | 3173 | 3029 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1362 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1463 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1252 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1288 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1604 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1295 | 794 | 685 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1390 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1291 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1303 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1313 | 1671 | 3134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1299 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1266 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1287 | 5117 | 3747 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1270 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1270 | 2569 | 2786 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1329 | 7386 | 4901 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1316 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9259 | 1190 | 1581 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 9614 | 453 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9471 | 2141 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9279 | 5742 | 3533 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9359 | 5844 | 3166 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2419 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1349 | 7401 | 5802 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1529 | 5487 | 5559 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1354 | 3173 | 3029 | 0 | 0 | ok |
| `checkout` | Check-out | 1276 | 1199 | 1197 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1368 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1451 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1373 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1294 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1272 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1613 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1320 | 794 | 685 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1363 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1316 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1313 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1302 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1263 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1286 | 5117 | 3747 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1264 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1273 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1270 | 2569 | 2786 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1286 | 494 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1289 | 7386 | 4901 | 0 | 0 | ok |
| `pessoas` | Time | 1307 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1343 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1514 | 5664 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1494 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1432 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1449 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1444 | 5958 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1452 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1493 | 7439 | 5296 | 0 | 2 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1511 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1511 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1483 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1467 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1451 | 5958 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1472 | 4389 | 3691 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1527 | 1428 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1528 | 3669 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1498 | 1365 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1473 | 2434 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1455 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1855 | 4271 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1458 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1463 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1503 | 2510 | 3356 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1558 | 3694 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9247 | 1190 | 1581 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 9626 | 453 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9441 | 2147 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9312 | 5748 | 3533 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9559 | 5850 | 3166 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9267 | 5254 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2384 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1350 | 7401 | 5802 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1486 | 5487 | 5559 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1302 | 3173 | 3029 | 0 | 0 | ok |
| `checkout` | Check-out | 1282 | 1199 | 1197 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1473 | 9876 | 8916 | 0 | 3 | ok |
| `vacinas` | Prevenção | 1463 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1253 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1255 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1615 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1297 | 794 | 685 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1321 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1300 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1350 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1315 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1268 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1285 | 5117 | 3747 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1282 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1267 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1291 | 2569 | 2786 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1272 | 494 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1287 | 7386 | 4901 | 0 | 0 | ok |
| `pessoas` | Time | 1270 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1372 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1558 | 5664 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1509 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1437 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1428 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1415 | 5183 | 3795 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1458 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1449 | 7439 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1477 | 460 | 480 | 0 | 2 | ok |
| `atividade:livre` | Atividade livre | 1472 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1486 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1495 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1432 | 5958 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1486 | 4390 | 3691 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1445 | 1428 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1595 | 3670 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1469 | 1365 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1425 | 2435 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1426 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1867 | 4271 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1437 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1417 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1476 | 2510 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1557 | 3694 | 3262 | 0 | 1 | ok |

