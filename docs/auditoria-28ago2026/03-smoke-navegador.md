# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 09/09/2026, 01:09:31.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-08 e versão carimbada 2026-09-08-07.

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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 3 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 4 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 7 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 10 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 16 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 18 |

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
| `monitor` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `plantonista` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-09 · push daycare/auditoria/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-09 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `supervisao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `supervisao` | `inicio` | 1 | set daycare/limpeza-fotos/2026-09-09 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-09 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `gestao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `gestao` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-09 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `gestao` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-09 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-09 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `gestao` | `atividade:aucademia` | 2 | set daycare/dashboard-auto/2026-09-09 · push daycare/auditoria/2026-09-09 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-09 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · set daycare/limpeza-fotos/2026-09-09 |
| `diretoria` | `inicio` | 1 | set daycare/limpeza-fotos/2026-09-09 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `diretoria` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-09 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-09 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-09 |
| `diretoria` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:agility` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-14 |

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
| `painelmeu` | Meu Dashboard | 1260 | 1799 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1275 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1305 | 1800 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1328 | 3264 | 3294 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1293 | 1619 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1435 | 239 | 287 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1497 | 2137 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1357 | 7084 | 5428 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1350 | 1040 | 1285 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1408 | 9398 | 8460 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1525 | 13175 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1389 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1290 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1280 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1340 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1308 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1302 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1359 | 1908 | 3224 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1277 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1278 | 355 | 480 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1293 | 3774 | 2692 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1286 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1277 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1283 | 589 | 670 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9324 | 1293 | 1619 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 9549 | 367 | 333 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9438 | 2135 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9325 | 6151 | 3781 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2496 | 459 | 343 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1381 | 7084 | 5428 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1345 | 1040 | 1285 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1451 | 9398 | 8460 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1562 | 13175 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1406 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1320 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1276 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1300 | 932 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1565 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1295 | 589 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1420 | 11530 | 10768 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1323 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1314 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1327 | 1908 | 3224 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1324 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1258 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1282 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1274 | 355 | 480 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 6055 | 5523 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1322 | 3774 | 2692 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1340 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1285 | 1293 | 1619 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1684 | 453 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1620 | 2139 | 1676 | 0 | 1 | ok |
| `painel-amanda` | Dashboard da Amanda | 1281 | 6155 | 3781 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1373 | 5811 | 3129 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1368 | 459 | 343 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1374 | 7084 | 5428 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1466 | 2802 | 3275 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1329 | 1040 | 1285 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1306 | 1148 | 1032 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1508 | 9398 | 8460 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1524 | 13175 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1377 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1300 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1281 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1294 | 932 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1563 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1325 | 589 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1376 | 11530 | 10768 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1344 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1300 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1344 | 2198 | 3563 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1317 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1285 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1280 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 355 | 480 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1282 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1312 | 6055 | 5523 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1291 | 482 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1301 | 3774 | 2692 | 0 | 0 | ok |
| `pessoas` | Time | 1292 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1263 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1373 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1560 | 5020 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1511 | 4936 | 3387 | 0 | 0 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1530 | 5883 | 4124 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1613 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1514 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1556 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1644 | 7424 | 5747 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1601 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1604 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1586 | 332 | 425 | 0 | 2 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1514 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1521 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1618 | 4361 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1591 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1766 | 3706 | 3500 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1671 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1571 | 2465 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1553 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2294 | 4220 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1567 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1560 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1635 | 2516 | 3356 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1666 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9270 | 1293 | 1619 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 9657 | 453 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9412 | 2145 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9328 | 6161 | 3781 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9395 | 5817 | 3129 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9410 | 5256 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2402 | 459 | 343 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1373 | 7084 | 5428 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1483 | 2802 | 3275 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1311 | 1040 | 1285 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1300 | 1148 | 1032 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1521 | 9398 | 8460 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1544 | 13175 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1394 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1286 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1261 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1294 | 932 | 622 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1563 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1308 | 589 | 670 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1398 | 11530 | 10768 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1339 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1336 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1386 | 2198 | 3563 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1365 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1281 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1267 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 355 | 480 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1267 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1313 | 6055 | 5523 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1300 | 482 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1330 | 3774 | 2692 | 0 | 0 | ok |
| `pessoas` | Time | 1280 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1282 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1315 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1550 | 5020 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1540 | 4936 | 3387 | 0 | 1 | ok |
| `turminha:qua` | Quarta · hoje 45 | 1662 | 5883 | 4124 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1487 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1508 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1496 | 356 | 425 | 0 | 1 | ok |
| `atividade:almoco` | Almoço | 1545 | 7444 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1556 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1537 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1578 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1513 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1547 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1542 | 4362 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1595 | 1434 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1620 | 3707 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1575 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1525 | 2466 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1509 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2235 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1513 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1515 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1489 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1657 | 3668 | 3262 | 0 | 0 | ok |

