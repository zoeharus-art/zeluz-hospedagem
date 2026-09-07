# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 07/09/2026, 20:26:09.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).

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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 2 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 3 |
| `recepcao` | Giullian Gomes (`consultora`) | 17 | 0 | 7 |
| `vet` | Suellen (`vet`) | 2 | 0 | 4 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 10 |
| `gestao` | Márcia · Gestora (`gestao`) | 55 | 0 | 18 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 55 | 0 | 17 |

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
| `monitor` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `plantonista` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `recepcao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `recepcao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `vet` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `gestao` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `hospedagem` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `gestao` | `turminha:seg` | 2 | set daycare/dashboard-auto/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `mesa` | 1 | transaction daycare/cobranca-almoco2/2026-09-07 |
| `diretoria` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-07 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-07 |
| `diretoria` | `turminha:seg` | 2 | set daycare/dashboard-auto/2026-09-07 · push daycare/auditoria/2026-09-07 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `diretoria` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-12 |

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
| `painelmeu` | Meu Painel | 1252 | 1520 | 1273 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1248 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1266 | 1523 | 1212 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1279 | 3332 | 3833 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 17 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1284 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1290 | 239 | 287 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1339 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1283 | 2160 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1257 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1348 | 7361 | 5813 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1270 | 2279 | 2453 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1275 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1276 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1271 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1307 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1301 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1259 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1278 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1245 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1260 | 688 | 715 | 0 | 1 | ok |
| `peso` | Peso | 1260 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1343 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1280 | 317 | 333 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1389 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1287 | 2158 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1272 | 2849 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1263 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1536 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1403 | 7361 | 5813 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1265 | 688 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1313 | 2279 | 2453 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1283 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1309 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1465 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1360 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1317 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1334 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1404 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1262 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1288 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1341 | 1023 | 881 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1263 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1350 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1312 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1280 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1523 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1338 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1361 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1278 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1285 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1381 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1338 | 2162 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1285 | 2853 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1282 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1336 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1402 | 7361 | 5813 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1305 | 688 | 715 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1483 | 4365 | 5580 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1285 | 2279 | 2453 | 0 | 0 | ok |
| `checkout` | Check-out | 1278 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1467 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1535 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1430 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1386 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1287 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1335 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1371 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1253 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1287 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1420 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1266 | 4289 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1300 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1364 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1282 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1273 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1256 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1268 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1354 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1265 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1332 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1372 | 4839 | 3840 | 0 | 2 | ok |
| `turminha:ter` | Terça 43 | 1782 | 4910 | 3442 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1455 | 4957 | 3851 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1366 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1300 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1323 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1383 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1486 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1300 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1647 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1457 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1382 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1316 | 4035 | 2629 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1299 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1395 | 3348 | 2497 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1385 | 1371 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1767 | 2448 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1297 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1303 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1312 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1313 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1269 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1316 | 3665 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 55 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1269 | 1348 | 1697 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1297 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1426 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1316 | 2168 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1269 | 2859 | 1761 | 0 | 0 | ok |
| `checkin` | Check-in | 1312 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1464 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1545 | 7361 | 5813 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 688 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1399 | 4365 | 5580 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1389 | 2279 | 2453 | 0 | 0 | ok |
| `checkout` | Check-out | 1333 | 849 | 701 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1280 | 746 | 580 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1297 | 11563 | 10812 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1408 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1335 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1301 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1362 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1373 | 8824 | 5828 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1268 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1778 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1312 | 1023 | 881 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1281 | 4295 | 2744 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1892 | 5404 | 4910 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1282 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1254 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1267 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1259 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1252 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1302 | 19236 | 11625 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1321 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1315 | 4839 | 3840 | 0 | 2 | ok |
| `turminha:ter` | Terça 43 | 1328 | 4910 | 3442 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1315 | 4957 | 3851 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1301 | 4289 | 3205 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1279 | 5698 | 4220 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1324 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1349 | 7445 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1290 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1275 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1295 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1274 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1311 | 5698 | 4220 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1266 | 4036 | 2629 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1272 | 1434 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1396 | 3349 | 2497 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1312 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1268 | 2449 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1272 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1267 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1350 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1323 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1302 | 2516 | 3356 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1331 | 3665 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-07T23:22:59.433Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-07T23:23:46.595Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-07T23:25:15.471Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

