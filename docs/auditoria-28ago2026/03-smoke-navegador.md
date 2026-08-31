# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 31/08/2026, 00:49:09.
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
| `monitor` | Felipe (`monitor`) | 9 | 0 | 0 |
| `plantonista` | Teste do Sistema (`plantonista`) | 1 | 0 | 1 |
| `recepcao` | Giullian Gomes (`consultora`) | 13 | 0 | 0 |
| `vet` | Suellen (`vet`) | 2 | 0 | 0 |
| `supervisao` | Amanda Silva (`supervisor`) | 23 | 0 | 0 |
| `gestao` | Márcia · Gestora (`gestao`) | 49 | 0 | 5 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 49 | 0 | 6 |

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
| `plantonista` | _(carga + entrada)_ | 1 | push daycare/auditoria/2026-08-31 |
| `gestao` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-08-31 · push daycare/auditoria/2026-08-31 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-01 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-02 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-03 |
| `diretoria` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-08-31 · push daycare/auditoria/2026-08-31 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-01 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-02 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-03 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-04 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 9 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `conferencia` | Conferência do check-in | 1312 | 575 | 556 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1320 | 3137 | 3098 | 0 | 0 | ok |
| `checkout` | Check-out 6 | 1302 | 1249 | 987 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1270 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1243 | 59 | 339 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1355 | 6126 | 4461 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1281 | 553 | 534 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1291 | 4665 | 3517 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1287 | 1343 | 1575 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 1 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `hospedagem` | Plantão da noite | 1244 | 3698 | 3925 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 13 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1288 | 2243 | 2342 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1302 | 8396 | 6933 | 0 | 0 | ok |
| `checkin` | Check-in 2 | 1273 | 475 | 453 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1300 | 5799 | 5758 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1272 | 1013 | 872 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1301 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1300 | 4289 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1275 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1261 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 488 | 542 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1258 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1255 | 749 | 759 | 0 | 0 | ok |
| `peso` | Peso | 1252 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1281 | 2243 | 2342 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1327 | 575 | 556 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1287 | 749 | 759 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1379 | 8396 | 6933 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1347 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 2 | 1276 | 475 | 453 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1286 | 743 | 592 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1272 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 9 | 1296 | 3243 | 4016 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 1013 | 872 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1321 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1267 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1329 | 4289 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1268 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1261 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1323 | 3485 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1266 | 3005 | 2792 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1288 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1284 | 488 | 542 | 0 | 0 | ok |
| `config` | Configurações | 1276 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1313 | 8570 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1264 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1337 | 6961 | 10854 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1265 | 2243 | 2342 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1396 | 575 | 556 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1296 | 749 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1364 | 3791 | 3988 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1366 | 8396 | 6933 | 0 | 0 | ok |
| `checkout` | Check-out 6 | 1300 | 1249 | 987 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1364 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 2 | 1284 | 475 | 453 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1272 | 743 | 592 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1290 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 9 | 1322 | 3243 | 4016 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 1013 | 872 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1281 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1282 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1347 | 4289 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1256 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1267 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1310 | 3485 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1272 | 3005 | 2792 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1289 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1269 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1277 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1271 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1315 | 8570 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1286 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1334 | 6961 | 10854 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1369 | 5616 | 3849 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1314 | 5153 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1295 | 5225 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1288 | 4537 | 3214 | 0 | 2 | ok |
| `turminha:sex` | Sexta 53 | 1273 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1346 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1364 | 7305 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1317 | 687 | 581 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1289 | 2723 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1347 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1303 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1319 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1348 | 4603 | 3733 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1333 | 1671 | 1751 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1323 | 3912 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1314 | 1608 | 1734 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1304 | 2675 | 1578 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1319 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1287 | 4423 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1335 | 580 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1285 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1302 | 2717 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1283 | 3828 | 3390 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1250 | 2243 | 2342 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1293 | 575 | 556 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 749 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1365 | 3791 | 3988 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1383 | 8396 | 6933 | 0 | 0 | ok |
| `checkout` | Check-out 6 | 1305 | 1249 | 987 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1364 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 2 | 1307 | 475 | 453 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 743 | 592 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1272 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 9 | 1317 | 3243 | 4016 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1268 | 1013 | 872 | 0 | 0 | ok |
| `reposicao` | Reposições 2 | 1288 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1315 | 4289 | 2958 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1270 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1265 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 3485 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1273 | 3005 | 2792 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1285 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1251 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1274 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1276 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1318 | 8570 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1333 | 6961 | 10854 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1415 | 5616 | 3849 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1287 | 5153 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1261 | 5225 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1277 | 4537 | 3214 | 0 | 2 | ok |
| `turminha:sex` | Sexta 53 | 1288 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1301 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1335 | 7305 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1296 | 687 | 581 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1318 | 2723 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1315 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1278 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1290 | 6114 | 4215 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1316 | 4604 | 3733 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1278 | 1671 | 1751 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1291 | 3913 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1293 | 1608 | 1734 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1303 | 2676 | 1578 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1312 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1277 | 4423 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1301 | 580 | 526 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1309 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1276 | 2717 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1331 | 3828 | 3390 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-08-31T03:46:31.923Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-31T03:47:11.941Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-31T03:48:26.580Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

