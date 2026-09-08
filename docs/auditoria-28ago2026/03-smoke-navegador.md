# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 08/09/2026, 13:52:08.
> Servidor: servidor já no ar na porta 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).

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
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 3 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 2 |
| `vet` | Suellen (`vet`) | 2 | 0 | 5 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 5 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 5 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 7 |

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
| `monitor` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-08 |
| `plantonista` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `recepcao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `vet` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-08 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `hospedes` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |

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
| `painelmeu` | Meu Painel | 1247 | 1803 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1279 | 1815 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1298 | 3453 | 3348 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1624 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1313 | 395 | 287 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1439 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1307 | 2151 | 1712 | 0 | 0 | ok |
| `checkin` | Check-in | 1268 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1405 | 7089 | 5571 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1327 | 1450 | 1714 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1275 | 9894 | 9039 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 4380 | 2908 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1311 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1299 | 2344 | 3552 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1350 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1254 | 3351 | 4976 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1292 | 545 | 423 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1279 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1280 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1276 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1262 | 652 | 715 | 0 | 1 | ok |
| `peso` | Peso | 1265 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1325 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1334 | 381 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1362 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1342 | 2149 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1286 | 3997 | 2235 | 0 | 0 | ok |
| `checkin` | Check-in | 1284 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1321 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1380 | 7089 | 5571 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 652 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1313 | 1450 | 1714 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1275 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1325 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1375 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1314 | 4380 | 2908 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1296 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1323 | 2344 | 3552 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1390 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1274 | 3351 | 4976 | 0 | 0 | ok |
| `peso` | Peso | 1277 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1314 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1254 | 545 | 423 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1268 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1294 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1265 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1263 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1308 | 27855 | 16014 | 0 | 0 | ok (tem "carregando" na tela) |
| `agenda` | Agenda em breve | 1484 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1411 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1255 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1356 | 453 | 349 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1421 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1346 | 2153 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1273 | 4001 | 2235 | 0 | 0 | ok |
| `checkin` | Check-in | 1299 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1312 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1417 | 7089 | 5571 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 652 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1403 | 3649 | 4558 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1296 | 1450 | 1714 | 0 | 0 | ok |
| `checkout` | Check-out | 1333 | 910 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1256 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1275 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1406 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1319 | 4380 | 2908 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1362 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1296 | 2634 | 3891 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1393 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1262 | 3351 | 4976 | 0 | 0 | ok |
| `peso` | Peso | 1290 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1352 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1265 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1312 | 4391 | 2663 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1968 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1294 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1318 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1292 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1279 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1269 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1312 | 31946 | 18694 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1321 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1360 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1474 | 4932 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1411 | 5191 | 4071 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1305 | 5073 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 39 | 1308 | 4328 | 3528 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1341 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1315 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1436 | 7740 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1364 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1311 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1349 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1373 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1374 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1400 | 4494 | 3582 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1396 | 1513 | 1569 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1393 | 3961 | 3468 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1333 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1270 | 2475 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1328 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1329 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1304 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1312 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1298 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1355 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1255 | 1344 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1355 | 453 | 349 | 0 | 0 | ok |
| `painel-diretoria` | Painel da Diretoria | 1292 | 3673 | 2098 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1361 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1316 | 2159 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1277 | 4007 | 2235 | 0 | 0 | ok |
| `checkin` | Check-in | 1272 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1298 | 434 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1333 | 7089 | 5571 | 0 | 2 | ok |
| `cuidadovet` | Cuidado Vet | 1283 | 652 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1380 | 3649 | 4558 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1292 | 1450 | 1714 | 0 | 0 | ok |
| `checkout` | Check-out | 1286 | 910 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 2 | 1255 | 708 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1274 | 12015 | 11129 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1330 | 13768 | 19624 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1293 | 4380 | 2908 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1270 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1276 | 2634 | 3891 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1334 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1260 | 3351 | 4976 | 0 | 0 | ok |
| `peso` | Peso | 1269 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1287 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1258 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1255 | 4445 | 2663 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1313 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1291 | 3861 | 2791 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1272 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1258 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1252 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1269 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1322 | 31946 | 18694 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1295 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1330 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1374 | 4932 | 3817 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1328 | 5191 | 4071 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1312 | 5073 | 3830 | 0 | 0 | ok |
| `turminha:qui` | Quinta 39 | 1302 | 4328 | 3528 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1305 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1297 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1409 | 7740 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1291 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1275 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1298 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1289 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1360 | 5659 | 4199 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1337 | 4495 | 3582 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1272 | 1513 | 1569 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1393 | 3962 | 3468 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1312 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1260 | 2476 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1283 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1273 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1288 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1253 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1276 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1283 | 3668 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-08T16:48:10.894Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T16:48:58.013Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T16:49:45.810Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T16:51:12.572Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

