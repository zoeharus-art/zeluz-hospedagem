# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 24/09/2026, 09:35:55.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-23 e versão carimbada 2026-09-24-01.

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
| `recepcao` | Giullian Gomes (`consultora`) | 22 | 0 | 7 |
| `vet` | Suellen (`vet`) | 2 | 0 | 7 |
| `supervisao` | Amanda Silva (`supervisor`) | 30 | 0 | 58 |
| `gestao` | Márcia · Gestora (`gestao`) | 57 | 0 | 103 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 58 | 0 | 146 |

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
| `monitor` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `monitor` | `painelmeu` | 1 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `monitor` | `checkout` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `plantonista` | _(carga + entrada)_ | 6 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/aniversario-enviado/2026-09-24 · push daycare/auditoria/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `recepcao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `recepcao` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `vet` | _(carga + entrada)_ | 5 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `vet` | `cuidadovet` | 2 | transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `supervisao` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `supervisao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | _(carga + entrada)_ | 4 | set auaulandia/med-vigia/2026-09-24 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto · transaction daycare/aniversario-enviado/2026-09-24 |
| `gestao` | `mesa` | 2 | transaction daycare/turma/2026-09-24 · transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `hospedes` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `gestao` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-24 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-26 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-27 |
| `diretoria` | _(carga + entrada)_ | 49 | set auaulandia/med-vigia/2026-09-24 · transaction daycare/aniversario-enviado/2026-09-24 · transaction daycare/dashboard/2026-09-23/avulso/-P29fQfTNNDy6RUFmt-4 · set auaulandia/aparelhos/01c5cf02-5715-42a7-8cc7-6043bdc2da74/visto |
| `diretoria` | `inicio` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-09-02 · remove daycare/fotos-corpo/2026-09-01 · remove daycare/fotos-corpo/2026-08-31 · remove daycare/fotos-corpo/2026-08-30 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-24 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-24 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `atividade:livre` | 2 | set daycare/dashboard-auto/2026-09-24 · push daycare/auditoria/2026-09-24 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-25 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-26 |

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
| `painelmeu` | Meu Dashboard | 1259 | 1801 | 1514 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in | 1257 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1272 | 928 | 1088 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1254 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1267 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1399 | 2454 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1258 | 1813 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1260 | 2465 | 2585 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 22 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1269 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1476 | 253 | 303 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1282 | 3157 | 2130 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1259 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1288 | 10879 | 7001 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1326 | 6546 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1287 | 797 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1348 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1280 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1585 | 34018 | 52207 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1327 | 1518 | 1463 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1332 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1260 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1252 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1418 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1740 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1273 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1319 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1285 | 4613 | 3811 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1244 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1223 | 626 | 660 | 0 | 2 | ok |
| `peso` | Peso | 1243 | 321 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 30 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1259 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1472 | 399 | 348 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1354 | 3155 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1256 | 6883 | 3985 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1271 | 471 | 518 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1301 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1286 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1334 | 6563 | 5168 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1320 | 797 | 1038 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1321 | 17185 | 10586 | 0 | 0 | ok |
| `checkin` | Check-in | 1272 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1542 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1257 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1277 | 2217 | 3936 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1243 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1256 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1385 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1685 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1289 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1305 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1289 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1318 | 22787 | 16956 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1255 | 6900 | 6456 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1265 | 2243 | 1870 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1570 | 3811 | 3393 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1376 | 1266 | 1516 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1248 | 1767 | 2016 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1504 | 546 | 349 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1361 | 3159 | 2130 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1252 | 6887 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1272 | 8580 | 4845 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1251 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1255 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1291 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1287 | 441 | 324 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1411 | 6563 | 5168 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1415 | 1855 | 2432 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1285 | 797 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1254 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1332 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1275 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1585 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1295 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1287 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1337 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1257 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1398 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1678 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1341 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1298 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1336 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1255 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1273 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1272 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1294 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1373 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1342 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1399 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1431 | 5404 | 3834 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1414 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1409 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1429 | 7397 | 5350 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1441 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1425 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1412 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1448 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1355 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1480 | 4604 | 3821 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1497 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1427 | 3920 | 3630 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1390 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1401 | 2453 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1450 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1688 | 4151 | 4559 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1358 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1401 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1443 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1502 | 3579 | 3264 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 58 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9238 | 1767 | 2016 | 0 | 42 | ok |
| `mesa` | O que fazer hoje | 9565 | 546 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9370 | 3165 | 2130 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9255 | 6893 | 3985 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 9282 | 8586 | 4845 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9257 | 6885 | 3600 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9252 | 471 | 518 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 9258 | 527 | 646 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 9284 | 10879 | 7001 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2553 | 441 | 324 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1310 | 6563 | 5168 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1336 | 1855 | 2432 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1259 | 797 | 1038 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1262 | 833 | 983 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1330 | 17185 | 10586 | 0 | 42 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1262 | 910 | 895 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1552 | 34018 | 52207 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1285 | 626 | 660 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1259 | 1562 | 1513 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1331 | 2507 | 4275 | 0 | 0 | ok |
| `pendencias` | Pendências de prevenção | 1267 | 559 | 269 | 0 | 0 | ok |
| `peso` | Peso | 1268 | 321 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1261 | 3684 | 5497 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1429 | 25030 | 14908 | 0 | 0 | ok |
| `vencimentos` | Vence amanhã (51) | 1846 | 43190 | 41650 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1300 | 3549 | 3952 | 0 | 1 | ok |
| `reposicao` | Reposições 45 | 1388 | 6551 | 4502 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1287 | 4613 | 3811 | 0 | 0 | ok |
| `config` | Configurações | 1312 | 22787 | 16956 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1256 | 771 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1261 | 6900 | 6456 | 0 | 0 | ok |
| `pessoas` | Time | 1273 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1272 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1295 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1398 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 46 | 1384 | 5461 | 3809 | 0 | 0 | ok |
| `turminha:qua` | Quarta 47 | 1361 | 5342 | 3824 | 0 | 0 | ok |
| `turminha:qui` | Quinta · hoje 44 | 1480 | 5404 | 3834 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1398 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1408 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1502 | 6150 | 4683 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1460 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1452 | 2437 | 3349 | 0 | 2 | ok |
| `atividade:aucademia` | Aucademia | 1403 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1367 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1361 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1460 | 4605 | 3821 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1362 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1495 | 3921 | 3630 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1447 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1430 | 2454 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1395 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1892 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1402 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1470 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1452 | 2431 | 3349 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1527 | 3579 | 3264 | 0 | 0 | ok |

