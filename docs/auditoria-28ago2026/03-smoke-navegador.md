# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 10/09/2026, 13:23:22.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-10 e versão carimbada 2026-09-10-01.

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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 4 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 6 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 10 |
| `vet` | Suellen (`vet`) | 2 | 0 | 7 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 16 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 29 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 25 |

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
| `monitor` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `monitor` | `agenda` | 1 | transaction daycare/turma/2026-09-10 |
| `plantonista` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-10 · set daycare/aniversario-enviado/2026-09-10 · push daycare/auditoria/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-10 · set daycare/aniversario-enviado/2026-09-10 · push daycare/auditoria/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `mesa` | 3 | transaction daycare/turma/2026-09-10 · set auaulandia/med-vigia/2026-09-10 · transaction daycare/falta-automatica/2026-09-10 |
| `recepcao` | `gestdia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `recepcao` | `orcamento` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `peso` | 2 | set daycare/aniversario-enviado/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `supervisao` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-10 · set daycare/aniversario-enviado/2026-09-10 · push daycare/auditoria/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `inicio` | 2 | transaction daycare/turma/2026-09-10 · transaction daycare/falta-automatica/2026-09-10 |
| `supervisao` | `mesa` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `supervisao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-09 · update daycare/checkout-corpo/2026-09-09 · set daycare/limpeza-fotos/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `supervisao` | `gestdia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `supervisao` | `peso` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-10 · set daycare/aniversario-enviado/2026-09-10 · push daycare/auditoria/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `inicio` | 2 | transaction daycare/turma/2026-09-10 · transaction daycare/falta-automatica/2026-09-10 |
| `gestao` | `mesa` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-09 · update daycare/checkout-corpo/2026-09-09 · set daycare/limpeza-fotos/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `gestao` | `paineloperacao` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | `gestdia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | `checkout` | 5 | update daycare/checkin-corpo/2026-09-09 · update daycare/checkout-corpo/2026-09-09 · set daycare/limpeza-fotos/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `gestao` | `ritmo` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `gestao` | `turminha:sex` | 2 | set daycare/dashboard-auto/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `gestao` | `atividade:checkout-pert` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `diretoria` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-10 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `diretoria` | `inicio` | 2 | transaction daycare/turma/2026-09-10 · transaction daycare/falta-automatica/2026-09-10 |
| `diretoria` | `mesa` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `diretoria` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-09 · update daycare/checkout-corpo/2026-09-09 · set daycare/limpeza-fotos/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `diretoria` | `paineloperacao` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `diretoria` | `gestdia` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `diretoria` | `ficha` | 3 | update daycare/checkout-corpo/2026-09-09 · set daycare/limpeza-fotos/2026-09-10 · push daycare/auditoria/2026-09-10 |
| `diretoria` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-10 |
| `diretoria` | `turminha:ter` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-10 |
| `diretoria` | `atividade:foto` | 2 | set daycare/dashboard-auto/2026-09-13 · transaction daycare/falta-automatica/2026-09-10 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1382 | 1808 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1273 | 59 | 339 | 0 | 1 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1301 | 1820 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1346 | 3068 | 3240 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1355 | 1397 | 1732 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1442 | 292 | 287 | 0 | 3 | ok |
| `consultoras` | Dashboard das Consultoras | 1507 | 2154 | 1712 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1341 | 6921 | 5397 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1329 | 1031 | 1259 | 0 | 1 | ok (tem "carregando" na tela) |
| `ficha` | Cadastro de Peludinhos | 1579 | 9664 | 8711 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1553 | 13396 | 9078 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1521 | 3399 | 5062 | 0 | 0 | ok |
| `peso` | Peso | 1376 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1318 | 436 | 411 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1385 | 10874 | 9934 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 1468 | 280 | 376 | 0 | 0 | ok |
| `reposicao` | Reposições 34 | 1459 | 4414 | 3578 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1527 | 1696 | 3190 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1280 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1275 | 355 | 480 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1375 | 3793 | 2738 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1377 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1281 | 298 | 471 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1251 | 604 | 670 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1404 | 1397 | 1732 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1534 | 431 | 333 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1546 | 2152 | 1712 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1297 | 6256 | 3831 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1372 | 542 | 556 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1469 | 6921 | 5397 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1379 | 1031 | 1259 | 0 | 1 | ok (tem "carregando" na tela) |
| `ficha` | Cadastro de Peludinhos | 1455 | 9664 | 8711 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1527 | 13396 | 9078 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1389 | 3399 | 5062 | 0 | 0 | ok |
| `peso` | Peso | 1325 | 298 | 471 | 0 | 1 | ok |
| `checkin` | Check-in 1 | 1296 | 436 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1299 | 845 | 863 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1903 | 17105 | 25297 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1430 | 604 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1400 | 13030 | 12045 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1422 | 280 | 376 | 0 | 0 | ok |
| `reposicao` | Reposições 34 | 1455 | 4414 | 3578 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1407 | 1696 | 3190 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1334 | 796 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1283 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1288 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1264 | 355 | 480 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1469 | 1627 | 1851 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1440 | 3793 | 2738 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1345 | 2757 | 2246 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1274 | 1397 | 1732 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1691 | 551 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1467 | 2156 | 1712 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1409 | 6260 | 3831 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1392 | 5752 | 3020 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1367 | 542 | 556 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1432 | 6921 | 5397 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1753 | 2557 | 3140 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1535 | 1031 | 1259 | 0 | 1 | ok (tem "carregando" na tela) |
| `checkout` | Check-out | 1424 | 1023 | 983 | 0 | 5 | ok |
| `ficha` | Cadastro de Peludinhos | 1533 | 9664 | 8711 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1564 | 13396 | 9078 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1506 | 3399 | 5062 | 0 | 0 | ok |
| `peso` | Peso | 1387 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1281 | 436 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 845 | 863 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1621 | 17105 | 25297 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1325 | 604 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1376 | 13030 | 12045 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1400 | 280 | 376 | 0 | 0 | ok |
| `reposicao` | Reposições 34 | 1367 | 4414 | 3578 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1372 | 1986 | 3529 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 796 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1396 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1427 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1434 | 355 | 480 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1755 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1564 | 1627 | 1851 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1359 | 485 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1571 | 3793 | 2738 | 0 | 1 | ok |
| `pessoas` | Time | 1310 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1286 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1351 | 2757 | 2246 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1603 | 5018 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1481 | 5164 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1530 | 5188 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 41 | 1562 | 5255 | 3828 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1570 | 5962 | 4164 | 0 | 2 | ok |
| `atividade:agility` | Agility Funcional | 1515 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1561 | 7923 | 5447 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1645 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1567 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1564 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1531 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1567 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1728 | 4833 | 3782 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1550 | 1432 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1609 | 4187 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1548 | 1369 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1539 | 2455 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1526 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2219 | 4237 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1552 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1570 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1584 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1660 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1279 | 1397 | 1732 | 0 | 2 | ok |
| `mesa` | O que fazer hoje | 1629 | 551 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1409 | 2162 | 1712 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1423 | 6266 | 3831 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1373 | 5758 | 3020 | 0 | 1 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1367 | 5290 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1314 | 542 | 556 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1372 | 6921 | 5397 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1456 | 2557 | 3140 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1299 | 1031 | 1259 | 0 | 1 | ok (tem "carregando" na tela) |
| `checkout` | Check-out | 1284 | 1023 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1442 | 9664 | 8711 | 0 | 3 | ok |
| `vacinas` | Prevenção | 1498 | 13396 | 9078 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1388 | 3399 | 5062 | 0 | 1 | ok |
| `peso` | Peso | 1420 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1289 | 436 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 845 | 863 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 1 | 1612 | 17105 | 25297 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1310 | 604 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1347 | 13030 | 12045 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1474 | 280 | 376 | 0 | 0 | ok |
| `reposicao` | Reposições 34 | 1373 | 4414 | 3578 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1410 | 1986 | 3529 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1342 | 796 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1351 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1254 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1255 | 355 | 480 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1267 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1504 | 1627 | 1851 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1447 | 485 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1328 | 3793 | 2738 | 0 | 0 | ok |
| `pessoas` | Time | 1305 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1251 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1320 | 2757 | 2246 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1538 | 5018 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1445 | 5164 | 3732 | 0 | 1 | ok |
| `turminha:qua` | Quarta 45 | 1442 | 5188 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 41 | 1523 | 5255 | 3828 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1572 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1617 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1662 | 7923 | 5447 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1665 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1843 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1621 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1535 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1524 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1713 | 4834 | 3782 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1545 | 1432 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1724 | 4188 | 3650 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1560 | 1369 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1704 | 2456 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1596 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2284 | 4237 | 4877 | 0 | 2 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1566 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1545 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1562 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1671 | 3668 | 3262 | 0 | 0 | ok |

