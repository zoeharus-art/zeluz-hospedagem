# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 08/09/2026, 09:51:57.
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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 3 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 4 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 7 |
| `vet` | Suellen (`vet`) | 2 | 0 | 4 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 10 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 14 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 16 |

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
| `plantonista` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `recepcao` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-08 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `vet` | _(carga + entrada)_ | 3 | set auaulandia/med-vigia/2026-09-08 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `inicio` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `gestao` | `checkoutconf` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | `atividade:livre` | 2 | set daycare/dashboard-auto/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `diretoria` | _(carga + entrada)_ | 2 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `inicio` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `diretoria` | `checkoutconf` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `diretoria` | `atividade:livre` | 2 | set daycare/dashboard-auto/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-10 |

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
| `painelmeu` | Meu Painel | 1253 | 1801 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1283 | 1813 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1301 | 3957 | 4098 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1272 | 1347 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1276 | 324 | 287 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1397 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1326 | 2155 | 1712 | 0 | 0 | ok |
| `checkin` | Check-in | 1299 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1361 | 7586 | 5934 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1284 | 1731 | 1977 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1271 | 9586 | 8863 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1265 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1262 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1272 | 2012 | 3269 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1301 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1245 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1259 | 545 | 423 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1262 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1260 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1244 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1252 | 736 | 715 | 0 | 1 | ok |
| `peso` | Peso | 1268 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1289 | 1347 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1290 | 367 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1326 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1308 | 2153 | 1712 | 0 | 1 | ok |
| `painel-amanda` | Painel da Supervisão | 1261 | 3083 | 1869 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1271 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1325 | 7586 | 5934 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1277 | 736 | 715 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1273 | 1731 | 1977 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 630 | 607 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1271 | 11700 | 10931 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1354 | 13785 | 19718 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1276 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1275 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1272 | 2012 | 3269 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1359 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1239 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1283 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1322 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1270 | 545 | 423 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1256 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1289 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1248 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1252 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1291 | 18676 | 11380 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1317 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1244 | 1347 | 1659 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1295 | 453 | 349 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1351 | 9318 | 8441 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1288 | 2157 | 1712 | 0 | 1 | ok |
| `painel-amanda` | Painel da Supervisão | 1270 | 3087 | 1869 | 0 | 0 | ok |
| `checkin` | Check-in | 1276 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1276 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1354 | 7586 | 5934 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1278 | 736 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1322 | 4470 | 5586 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1270 | 1731 | 1977 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1278 | 997 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1259 | 630 | 607 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1262 | 11700 | 10931 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1320 | 13785 | 19718 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1283 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1263 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1312 | 2302 | 3608 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1300 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1248 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1281 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1257 | 4145 | 2504 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1291 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1271 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1257 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1258 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1254 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1311 | 18676 | 11380 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1308 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1413 | 4958 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1294 | 5584 | 4035 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1275 | 5585 | 4035 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1316 | 5585 | 4035 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1288 | 5584 | 4035 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1311 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1366 | 7443 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1302 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1274 | 2522 | 3356 | 0 | 2 | ok |
| `atividade:aucademia` | Aucademia | 1287 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1257 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1295 | 5782 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1277 | 4317 | 3702 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1292 | 1496 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1313 | 3686 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1272 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1286 | 2475 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1274 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1274 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1290 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1277 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1249 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1297 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1258 | 1347 | 1659 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1285 | 453 | 349 | 0 | 0 | ok |
| `painel-diretoria` | Painel da Diretoria | 1278 | 3671 | 2098 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1339 | 9318 | 8441 | 0 | 1 | ok |
| `consultoras` | Painel das Consultoras | 1290 | 2163 | 1712 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1247 | 3093 | 1869 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1273 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1332 | 7586 | 5934 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 736 | 715 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1360 | 4470 | 5586 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1272 | 1731 | 1977 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1291 | 997 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1268 | 630 | 607 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1256 | 11700 | 10931 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1368 | 13785 | 19718 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1287 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1285 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1285 | 2302 | 3608 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1323 | 9120 | 5977 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1248 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1276 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1256 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1259 | 4151 | 2504 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1317 | 5800 | 5203 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1271 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1246 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1263 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1259 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1249 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1287 | 18676 | 11380 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1306 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1370 | 4958 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1294 | 5584 | 4035 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1289 | 5088 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1307 | 5088 | 3795 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1270 | 5782 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1288 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1373 | 7443 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1343 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1286 | 2522 | 3356 | 0 | 2 | ok |
| `atividade:aucademia` | Aucademia | 1282 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1271 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1289 | 5782 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1264 | 4318 | 3702 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1282 | 1496 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1323 | 3687 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1266 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1274 | 2476 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1264 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1278 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1272 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1276 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1275 | 2516 | 3356 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1288 | 3668 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-08T12:48:13.489Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T12:48:57.129Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T12:49:42.773Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-08T12:51:04.593Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

