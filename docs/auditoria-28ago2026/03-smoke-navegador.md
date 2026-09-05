# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 05/09/2026, 06:53:48.
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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 24 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 24 |
| `recepcao` | Giullian Gomes (`consultora`) | 16 | 0 | 31 |
| `vet` | Suellen (`vet`) | 2 | 0 | 24 |
| `supervisao` | Amanda Silva (`supervisor`) | 25 | 0 | 38 |
| `gestao` | Márcia · Gestora (`gestao`) | 53 | 0 | 46 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 53 | 0 | 46 |

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
| `monitor` | _(carga + entrada)_ | 24 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `plantonista` | _(carga + entrada)_ | 24 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `recepcao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `recepcao` | `ficha` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `recepcao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `vet` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `supervisao` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `supervisao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `supervisao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `gestao` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `gestao` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `checkin` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `gestao` | `checkoutconf` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `gestao` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |
| `diretoria` | _(carga + entrada)_ | 23 | set auaulandia/med-vigia/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStJ3BZP4-fiLSuHc · push daycare/auditoria/2026-09-05 · remove auaulandia/med-tg-fila/-P0UStYEOrFsMWAOJm7S |
| `diretoria` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `checkin` | 1 | update daycare/checkin-corpo/2026-09-04 |
| `diretoria` | `conferencia` | 5 | update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 · set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-05 |
| `diretoria` | `checkoutconf` | 4 | update daycare/checkin-corpo/2026-09-04 · update daycare/checkout-corpo/2026-09-04 · set daycare/limpeza-fotos/2026-09-05 · push daycare/auditoria/2026-09-05 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-05 |
| `diretoria` | `alergia` | 6 | update daycare/cadastro/ella__yerkes%20pereira%20e%20silva · set daycare/versoes/cadastro · set daycare/alergia-confirmada/ella__yerkes%20pereira%20e%20silva/ficha · set daycare/entrevista-atencao/ella__yerkes%20pereira%20e%20silva |

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
| `painelmeu` | Meu Painel | 1240 | 1529 | 1295 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1243 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1260 | 1541 | 1234 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1272 | 4908 | 4753 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 16 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1278 | 1492 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1287 | 239 | 287 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1436 | 9318 | 8441 | 0 | 1 | ok |
| `checkin` | Check-in | 1294 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1325 | 8637 | 6829 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1264 | 3563 | 3662 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1262 | 8217 | 7963 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1272 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1262 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1286 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1313 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1255 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1248 | 190 | 366 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1257 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1247 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1276 | 979 | 969 | 0 | 1 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 25 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1327 | 1492 | 1733 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1289 | 442 | 333 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1348 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1284 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1351 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1379 | 8637 | 6829 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1284 | 979 | 969 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1297 | 3563 | 3662 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1282 | 759 | 632 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1277 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1365 | 11750 | 16536 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1284 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1297 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1330 | 1671 | 3134 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1344 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1305 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1270 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1389 | 1409 | 1174 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1308 | 4568 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1275 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1259 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1256 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1304 | 13119 | 8081 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1272 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1339 | 7047 | 11031 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1260 | 1492 | 1733 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 1279 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1395 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1279 | 414 | 376 | 0 | 4 | ok |
| `conferencia` | Conferência do check-in 2 | 1312 | 434 | 324 | 0 | 2 | ok |
| `hospedes` | Hóspedes de hoje | 1379 | 8637 | 6829 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1287 | 979 | 969 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1474 | 6714 | 7813 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1288 | 3563 | 3662 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1270 | 1328 | 1056 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1246 | 759 | 632 | 0 | 4 | ok |
| `orcamento` | Orçamento de hospedagem | 1279 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1350 | 11750 | 16536 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1288 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1273 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1308 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1374 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1252 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1270 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1261 | 4149 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1318 | 4568 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1269 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1272 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1252 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1267 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1271 | 13119 | 8081 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1345 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1301 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1270 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1281 | 5194 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1292 | 4365 | 3140 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1290 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1277 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1338 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1343 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1441 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1304 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1293 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1305 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1384 | 4393 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1283 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1383 | 3701 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1317 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1288 | 2450 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1283 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1309 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1309 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1261 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1295 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1286 | 3659 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 53 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1263 | 1492 | 1733 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 1300 | 453 | 349 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1367 | 9318 | 8441 | 0 | 0 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 1 | ok |
| `conferencia` | Conferência do check-in 2 | 1333 | 434 | 324 | 0 | 5 | ok |
| `hospedes` | Hóspedes de hoje | 1401 | 8637 | 6829 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1281 | 979 | 969 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1456 | 6714 | 7813 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1324 | 3563 | 3662 | 0 | 0 | ok |
| `checkout` | Check-out 5 | 1314 | 1328 | 1056 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 759 | 632 | 0 | 4 | ok |
| `orcamento` | Orçamento de hospedagem | 1326 | 10329 | 10033 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1388 | 11750 | 16536 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1290 | 4447 | 6846 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1303 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1316 | 1961 | 3473 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1380 | 8376 | 5604 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1313 | 3442 | 5062 | 0 | 6 | ok |
| `peso` | Peso | 1279 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1331 | 1409 | 1174 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1261 | 4155 | 2395 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1288 | 4568 | 4302 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1292 | 3732 | 2646 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1273 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1274 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1272 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1273 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1285 | 13119 | 8081 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1326 | 7047 | 11031 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1394 | 5593 | 4121 | 0 | 0 | ok |
| `turminha:ter` | Terça 43 | 1344 | 4931 | 3357 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1299 | 5194 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1309 | 4365 | 3140 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1360 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1368 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1448 | 7449 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1383 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1327 | 2526 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1299 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1284 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1377 | 5968 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1389 | 4394 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1296 | 1438 | 1629 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1393 | 3702 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1286 | 1375 | 1612 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1289 | 2451 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1351 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1333 | 4187 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1333 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1290 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1285 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1287 | 3659 | 3262 | 0 | 0 | ok |

## Ruído do ambiente (não reprova)

O teste roda em `127.0.0.1`, e o App Check (reCAPTCHA) só reconhece o domínio de produção.
Estes erros são do laboratório, não do app:

| Mensagem | Vezes |
|---|---:|
| `[2026-09-05T09:50:53.018Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T09:51:36.725Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |
| `[2026-09-05T09:52:57.562Z]  @firebase/app-check: FirebaseError: AppCheck: ReCAPT` | 1 |

