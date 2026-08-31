# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 30/08/2026, 00:18:28.
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
| `monitor` | Felipe (`monitor`) | 9 | 0 | 1 |
| `plantonista` | Teste do Sistema (`plantonista`) | 1 | 0 | 1 |
| `recepcao` | Giullian Gomes (`consultora`) | 13 | 0 | 2 |
| `vet` | Suellen (`vet`) | 2 | 0 | 0 |
| `supervisao` | Amanda Silva (`supervisor`) | 23 | 0 | 2 |
| `gestao` | Márcia · Gestora (`gestao`) | 49 | 0 | 8 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 49 | 0 | 8 |

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
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `plantonista` | _(carga + entrada)_ | 1 | push daycare/auditoria/2026-08-30 |
| `recepcao` | `hospedes` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `supervisao` | `conferencia` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `gestao` | `conferencia` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `gestao` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-08-30 · push daycare/auditoria/2026-08-30 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-08-31 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-01 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-02 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-03 |
| `diretoria` | `conferencia` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-08-30 |
| `diretoria` | `atividade:almoco2` | 2 | set daycare/dashboard-auto/2026-08-30 · push daycare/auditoria/2026-08-30 |
| `diretoria` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-08-31 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-01 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-02 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-03 |

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
| `conferencia` | Conferência do check-in | 1296 | 521 | 541 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1261 | 2726 | 3021 | 0 | 0 | ok |
| `checkout` | Check-out | 1276 | 1121 | 944 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1245 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1238 | 59 | 339 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1322 | 6124 | 4461 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1274 | 553 | 534 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1261 | 4663 | 3517 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1262 | 1341 | 1575 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 1 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `hospedagem` | Plantão da noite | 1258 | 3313 | 3256 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 13 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1258 | 2142 | 2304 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1289 | 8180 | 6812 | 0 | 1 | ok |
| `checkin` | Check-in 1 | 1273 | 450 | 411 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1289 | 5799 | 5758 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1272 | 1123 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1287 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1260 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1310 | 3923 | 2701 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1265 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1266 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1256 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 488 | 542 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1237 | 706 | 759 | 0 | 0 | ok |
| `peso` | Peso | 1256 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 23 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1267 | 2142 | 2304 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1306 | 521 | 541 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1271 | 706 | 759 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1337 | 8180 | 6812 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1335 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1283 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 1155 | 853 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1261 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1302 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1287 | 1123 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1301 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1273 | 1672 | 3178 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1317 | 3923 | 2701 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1272 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1269 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1288 | 3620 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1275 | 2424 | 2416 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1273 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1258 | 488 | 542 | 0 | 0 | ok |
| `config` | Configurações | 1259 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1287 | 8447 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1341 | 7694 | 11913 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1257 | 2142 | 2304 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1399 | 521 | 541 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1276 | 706 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1354 | 3341 | 3837 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1366 | 8180 | 6812 | 0 | 0 | ok |
| `checkout` | Check-out | 1283 | 1121 | 944 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1342 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1271 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 1155 | 853 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1285 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1313 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1268 | 1123 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1274 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1273 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1307 | 3923 | 2701 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1278 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1257 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1314 | 3620 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1268 | 2424 | 2416 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1261 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1252 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1271 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1274 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1304 | 8447 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1321 | 7694 | 11913 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1376 | 5614 | 3849 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1282 | 5153 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1303 | 5225 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1302 | 4537 | 3214 | 0 | 2 | ok |
| `turminha:sex` | Sexta 53 | 1319 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1277 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1296 | 7305 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1291 | 687 | 581 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1264 | 2723 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1303 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1285 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1281 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1278 | 4603 | 3733 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1336 | 1671 | 1751 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1290 | 3912 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1270 | 1608 | 1734 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1276 | 2699 | 1578 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1287 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1288 | 4423 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1301 | 580 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1276 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1278 | 2717 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1281 | 3816 | 3390 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 49 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1259 | 2142 | 2304 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1307 | 521 | 541 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1287 | 663 | 759 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1615 | 3107 | 3690 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1340 | 8180 | 6812 | 0 | 0 | ok |
| `checkout` | Check-out | 1280 | 1121 | 944 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1323 | 9115 | 8230 | 0 | 0 | ok |
| `checkin` | Check-in 1 | 1268 | 450 | 411 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1259 | 1155 | 853 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1290 | 7827 | 7786 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1302 | 2867 | 3353 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1266 | 1123 | 2903 | 0 | 1 | ok |
| `reposicao` | Reposições 2 | 1267 | 1295 | 1034 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1264 | 1962 | 3517 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1304 | 3923 | 2701 | 0 | 0 | ok |
| `alergia` | Alergias a confirmar | 1255 | 5219 | 6881 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1317 | 3620 | 3006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 2424 | 2416 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1269 | 2217 | 1673 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1246 | 488 | 542 | 0 | 0 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `config` | Configurações | 1260 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1306 | 8447 | 6349 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1263 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1320 | 7694 | 11913 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 43 | 1379 | 5614 | 3849 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1290 | 5153 | 3454 | 0 | 0 | ok |
| `turminha:qua` | Quarta 44 | 1271 | 5225 | 3857 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1292 | 4537 | 3214 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1314 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1287 | 583 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1335 | 7305 | 5257 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1345 | 687 | 581 | 0 | 2 | ok |
| `atividade:livre` | Atividade livre | 1280 | 2723 | 3361 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1289 | 559 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1285 | 595 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1363 | 6114 | 4215 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1298 | 4604 | 3733 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1349 | 1671 | 1751 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1328 | 3913 | 3601 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1293 | 1608 | 1734 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1366 | 2700 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1309 | 580 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1286 | 4423 | 4978 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1325 | 580 | 526 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1280 | 613 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1266 | 2717 | 3361 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1280 | 3816 | 3390 | 0 | 1 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-08-30T03:15:51.649Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-30T03:16:31.165Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-08-30T03:17:44.952Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

