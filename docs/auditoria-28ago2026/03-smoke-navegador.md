# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 04/09/2026, 15:23:54.
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
| `monitor` | Felipe (`monitor`) | 3 | 0 | 15 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 15 |
| `recepcao` | Giullian Gomes (`consultora`) | 16 | 0 | 22 |
| `vet` | Suellen (`vet`) | 2 | 0 | 16 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 24 |
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 24 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 25 |

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
| `monitor` | _(carga + entrada)_ | 14 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `monitor` | `agenda` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `plantonista` | _(carga + entrada)_ | 15 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `recepcao` | _(carga + entrada)_ | 14 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `recepcao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `vet` | _(carga + entrada)_ | 15 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | _(carga + entrada)_ | 14 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `supervisao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `supervisao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `gestao` | _(carga + entrada)_ | 14 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `gestao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `diretoria` | _(carga + entrada)_ | 15 | set daycare/versoes/cadastro · set auaulandia/versoes/estadias · set auaulandia/med-vigia/2026-09-04 · transaction auaulandia/med-tg-fila/-P0RDDYGW4hZeQWT9L-o |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-04 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-04 |
| `diretoria` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |

**Como ler esta tabela.** Gravar ao abrir não é errado por si só — às vezes é uma regra do
negócio (marcar falta depois da hora, por exemplo). Mas duas coisas merecem atenção sempre:

1. **Gravação na carga, antes de qualquer login** — vale para qualquer pessoa que só abra o
   endereço do app. Remendo antigo esquecido no código costuma morar aí.
2. **Regra que só acontece se alguém abrir a tela certa** — se ninguém abrir, a regra não roda.
   É a mesma armadilha do aviso de almoço, que só saía quando alguém abria o Empório.

## Tabela completa — papel × tela

### `monitor` — Felipe (senha 1005, cadastro do banco (daycare/config/monitores))

Entrou como **Felipe**, papel `monitor`. 3 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1252 | 1539 | 1295 | 0 | 0 | ok |
| `abertura` | Abertura do dia | 1251 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1226 | 59 | 339 | 0 | 1 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1255 | 1551 | 1234 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1242 | 4128 | 4087 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 16 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1261 | 1684 | 1843 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1275 | 395 | 287 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1293 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1294 | 2613 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1338 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1276 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1263 | 8217 | 7963 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1276 | 5901 | 6291 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1273 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1246 | 2329 | 3732 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1305 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1252 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1268 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1259 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1270 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1254 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1255 | 805 | 759 | 0 | 1 | ok |
| `peso` | Peso | 1255 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1271 | 1684 | 1843 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1260 | 457 | 333 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1308 | 440 | 509 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 805 | 759 | 0 | 1 | ok |
| `hospedes` | Hóspedes de hoje | 1306 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1254 | 2613 | 2783 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1324 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1280 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1268 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1286 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1298 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1268 | 5901 | 6291 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1270 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1271 | 2329 | 3732 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1314 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1258 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1271 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1311 | 2136 | 1760 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1259 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1292 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1254 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1309 | 90102 | 40796 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1281 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1317 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1250 | 1684 | 1843 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1269 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1300 | 440 | 509 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1278 | 805 | 759 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1352 | 5235 | 6276 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1339 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1259 | 2613 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out | 1279 | 1094 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1316 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1294 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1268 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1260 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1302 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1299 | 5901 | 6291 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1289 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1252 | 2619 | 4071 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1308 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1254 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1244 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1307 | 2136 | 1760 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1258 | 3846 | 2693 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1331 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1268 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1271 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1242 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1266 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1285 | 90102 | 40796 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1306 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1360 | 4834 | 3918 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1270 | 4817 | 3494 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1270 | 4936 | 3931 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1272 | 4453 | 3276 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1278 | 6369 | 4914 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1305 | 579 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1382 | 9181 | 6438 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1300 | 1687 | 1579 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1292 | 3160 | 3955 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1369 | 555 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1284 | 591 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1289 | 6369 | 4914 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1302 | 5069 | 3739 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1330 | 2110 | 1988 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1366 | 4453 | 3611 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1275 | 1767 | 1989 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1270 | 2662 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1303 | 576 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1306 | 844 | 827 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1285 | 576 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1290 | 609 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1276 | 3154 | 3955 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1273 | 781 | 765 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1262 | 1684 | 1843 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1286 | 453 | 349 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1310 | 440 | 509 | 0 | 1 | ok |
| `cuidadovet` | Cuidado Vet | 1276 | 805 | 759 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1369 | 5235 | 6276 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1299 | 7885 | 6430 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1261 | 2613 | 2783 | 0 | 0 | ok |
| `checkout` | Check-out | 1256 | 1094 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1331 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor 1 | 1270 | 825 | 729 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1268 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1331 | 11341 | 16195 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1316 | 5901 | 6291 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1280 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1257 | 2619 | 4071 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1297 | 7712 | 5198 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1250 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1258 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1294 | 2136 | 1760 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1262 | 3848 | 2693 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1477 | 4230 | 3982 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1302 | 3784 | 2699 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1265 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1256 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1252 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1261 | 90102 | 40796 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1302 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1331 | 4834 | 3918 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1280 | 4817 | 3494 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1279 | 4936 | 3931 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1287 | 4453 | 3276 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1273 | 6369 | 4914 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1289 | 579 | 526 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1306 | 9181 | 6438 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1303 | 1687 | 1579 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1300 | 3160 | 3955 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1349 | 555 | 526 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1283 | 591 | 526 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1293 | 6369 | 4914 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1283 | 5070 | 3739 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1330 | 2110 | 1988 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1365 | 4454 | 3611 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1302 | 1767 | 1989 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1284 | 2663 | 1578 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1274 | 576 | 526 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1274 | 844 | 827 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1273 | 576 | 526 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1274 | 609 | 526 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1279 | 3154 | 3955 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1317 | 781 | 765 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-04T18:21:02.386Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T18:21:45.402Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-04T18:23:04.573Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

