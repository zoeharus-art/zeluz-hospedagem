# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 05/09/2026, 07:04:17.
> Servidor: endereço informado em SMOKE_BASE (https://zoeharus-art.github.io/zeluz-hospedagem) · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).

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
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 100 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 94 |

### O nome do papel e o que o app grava

Em alguns casos o nome que a gente usa não é a palavra que o app guarda em `body[data-role]`:

- **`diretoria`** entra como `gestao` — senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria).

## Falhas encontradas — nenhuma

Nenhuma tela abriu vazia, presa no "carregando", com texto quebrado ou com erro de JavaScript.

## Telas que tentam GRAVAR só de abrir

Informação, não falha: são gravações que aconteceriam no banco real só por alguém abrir a tela.
Todas foram barradas pelo guarda.

| Papel | Tela | Tentativas | Caminhos |
|---|---|---:|---|
| `gestao` | _(carga + entrada)_ | 57 | remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S · remove auaulandia/med-tg-fila/-P0USu1lJo_JL2rsEPLe |
| `gestao` | `inicio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `hospedes` | 16 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `hospedagem` | 4 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |
| `gestao` | `checkoutconf` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `gestao` | `turminha:qua` | 4 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |
| `diretoria` | _(carga + entrada)_ | 47 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `diretoria` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `hospedes` | 16 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `hospedagem` | 4 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |
| `diretoria` | `checkoutconf` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `diretoria` | `turminha:qui` | 4 | transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330664_2o1i_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788554891553_3aka_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037366_1374_07-00 · transaction daycare/urgencias-enviadas/2026-09-05/med-kako__m%C3%A1rcia%20nascimento-ci_1788555037369_d7sq_07-00 |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1277 | 1492 | 1733 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1313 | 551 | 349 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1441 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1285 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1326 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1389 | 8637 | 6829 | 0 | 16 | ok |
| `cuidadovet` | Cuidado Vet | 1305 | 979 | 969 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1405 | 7063 | 7966 | 0 | 4 | ok |
| `gestdia` | Conferência do dia | 1306 | 3625 | 3665 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1300 | 1328 | 1056 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1265 | 759 | 632 | 0 | 4 | ok |
| `orcamento` | Orçamento de hospedagem | 1285 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1354 | 11750 | 16536 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1380 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1298 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1314 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1343 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1267 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1290 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1269 | 4149 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1328 | 4568 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1298 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1281 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1300 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1273 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1268 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1337 | 13114 | 8081 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1344 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1371 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1360 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1308 | 5194 | 3795 | 0 | 4 | ok |
| `turminha:qui` | Quinta 37 | 1338 | 4365 | 3140 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1285 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1357 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1453 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1393 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1281 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1294 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1279 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1380 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1351 | 4361 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1377 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1451 | 3705 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1313 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1319 | 2450 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1391 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1374 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1388 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1384 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1521 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1365 | 3659 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1307 | 1492 | 1733 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 1323 | 551 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1424 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1329 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1443 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1418 | 8637 | 6829 | 0 | 16 | ok |
| `cuidadovet` | Cuidado Vet | 1307 | 979 | 969 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1478 | 7063 | 7966 | 0 | 4 | ok |
| `gestdia` | Conferência do dia | 1316 | 3625 | 3665 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1365 | 1328 | 1056 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1284 | 759 | 632 | 0 | 4 | ok |
| `orcamento` | Orçamento de hospedagem | 1329 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1536 | 11750 | 16536 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1414 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1467 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1484 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1652 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1551 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1431 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1429 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1298 | 4109 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1403 | 4568 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1306 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1283 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1298 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1274 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1273 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1318 | 13114 | 8081 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1276 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1360 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1425 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1359 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1301 | 5194 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1672 | 4365 | 3140 | 0 | 4 | ok |
| `turminha:sex` | Sexta 53 | 1371 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1366 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1373 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1352 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1294 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1305 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1336 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1331 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1532 | 4362 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1669 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 2317 | 3706 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1541 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1733 | 2451 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1414 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1601 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1822 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1511 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1512 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1598 | 3659 | 3262 | 0 | 0 | ok |

