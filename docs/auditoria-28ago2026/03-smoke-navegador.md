# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 11/09/2026, 18:58:17.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-11 e versão carimbada 2026-09-11-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 55 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 50 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 55 |
| `vet` | Suellen (`vet`) | 2 | 0 | 51 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 105 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 141 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 142 |

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
| `monitor` | _(carga + entrada)_ | 50 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-11 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-11 · transaction daycare/turma/2026-09-11 · transaction daycare/avisos-telegram-atraso/2026-09-11 · transaction daycare/falta-automatica/2026-09-11 |
| `plantonista` | _(carga + entrada)_ | 48 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `plantonista` | `hospedagem` | 2 | set daycare/resumo-gestao/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `recepcao` | _(carga + entrada)_ | 49 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-11 · transaction daycare/turma/2026-09-11 · transaction daycare/avisos-telegram-atraso/2026-09-11 · transaction daycare/falta-automatica/2026-09-11 |
| `recepcao` | `checkin` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-11 |
| `vet` | _(carga + entrada)_ | 50 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-11 |
| `supervisao` | _(carga + entrada)_ | 49 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-11 · transaction daycare/turma/2026-09-11 · transaction daycare/avisos-telegram-atraso/2026-09-11 · transaction daycare/falta-automatica/2026-09-11 |
| `supervisao` | `consultoras` | 2 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 |
| `supervisao` | `painel-amanda` | 2 | set daycare/limpeza-fotos/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `supervisao` | `conferencia` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `alergia` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `supervisao` | `cuidadovet` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-11 |
| `gestao` | _(carga + entrada)_ | 49 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-11 · transaction daycare/turma/2026-09-11 · transaction daycare/avisos-telegram-atraso/2026-09-11 · transaction daycare/falta-automatica/2026-09-11 |
| `gestao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `gestao` | `conferencia` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `gestdia` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `gestao` | `checkout` | 1 | update daycare/checkin-corpo/2026-09-10 |
| `gestao` | `ficha` | 3 | update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `gestao` | `cuidadovet` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-11 |
| `gestao` | `agenda` | 23 | transaction daycare/falta-automatica/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `turminha:sex` | 2 | set daycare/dashboard-auto/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `gestao` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-11 · set daycare/dashboard-auto/2026-09-13 |
| `gestao` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:foto` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | _(carga + entrada)_ | 49 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-11 · transaction daycare/turma/2026-09-11 · transaction daycare/avisos-telegram-atraso/2026-09-11 · transaction daycare/falta-automatica/2026-09-11 |
| `diretoria` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `diretoria` | `conferencia` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `hospedagem` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `diretoria` | `checkout` | 1 | update daycare/checkin-corpo/2026-09-10 |
| `diretoria` | `ficha` | 3 | update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `diretoria` | `cuidadovet` | 23 | set auaulandia/med-vigia/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-11 |
| `diretoria` | `pessoas` | 23 | transaction daycare/falta-automatica/2026-09-11 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-11/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `turminha:qui` | 2 | set daycare/dashboard-auto/2026-09-11 · push daycare/auditoria/2026-09-11 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-11 · set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `atividade:escova` | 1 | transaction daycare/falta-automatica/2026-09-11 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-16 |

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
| `painelmeu` | Meu Dashboard | 1258 | 1810 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1284 | 626 | 556 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1299 | 1066 | 1073 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1243 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1248 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1443 | 2472 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1353 | 1800 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1272 | 4471 | 4644 | 0 | 2 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1268 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1392 | 292 | 287 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1397 | 2224 | 1739 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1299 | 7911 | 6060 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1347 | 3150 | 2831 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1366 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1419 | 13663 | 9295 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3449 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1270 | 476 | 496 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1335 | 11599 | 10516 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1320 | 861 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1304 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1380 | 1725 | 3235 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1275 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1241 | 404 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1277 | 6088 | 4114 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1283 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1251 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1250 | 843 | 880 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1267 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1500 | 482 | 429 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1376 | 2222 | 1739 | 0 | 2 | ok |
| `painel-amanda` | Dashboard da Amanda | 1297 | 6264 | 3886 | 0 | 2 | ok |
| `conferencia` | Conferência do check-in | 1306 | 626 | 556 | 0 | 23 | ok |
| `hospedes` | Hóspedes de hoje | 1367 | 7911 | 6060 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1333 | 3150 | 2831 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1350 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1426 | 13663 | 9295 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1274 | 3449 | 5148 | 0 | 1 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1282 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1257 | 620 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1539 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 843 | 880 | 0 | 23 | ok |
| `orcamento` | Orçamento de hospedagem | 1320 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1296 | 861 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1289 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1319 | 1725 | 3235 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1268 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1257 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1254 | 404 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1244 | 1915 | 2127 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1284 | 6088 | 4114 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1273 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1334 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1260 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1679 | 552 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1398 | 2226 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1282 | 6268 | 3886 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1258 | 5858 | 3252 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1309 | 626 | 556 | 0 | 23 | ok |
| `hospedes` | Hóspedes de hoje | 1352 | 7911 | 6060 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1501 | 6009 | 5762 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1321 | 3150 | 2831 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1275 | 971 | 968 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1409 | 9760 | 8805 | 0 | 3 | ok |
| `vacinas` | Prevenção | 1438 | 13663 | 9295 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1346 | 3449 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1273 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1272 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1263 | 620 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1585 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1337 | 843 | 880 | 0 | 23 | ok |
| `orcamento` | Orçamento de hospedagem | 1349 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1317 | 861 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1290 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1314 | 2015 | 3574 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1304 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1272 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1258 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1261 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1270 | 1915 | 2127 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1269 | 488 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1266 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1278 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 23 | ok |
| `relatorios` | Relatórios | 1327 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1489 | 5018 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1448 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1415 | 5188 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1414 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1445 | 6759 | 4799 | 0 | 2 | ok |
| `atividade:agility` | Agility Funcional | 1427 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1476 | 8494 | 5844 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1496 | 549 | 534 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1464 | 2786 | 3896 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1451 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1425 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1417 | 6759 | 4799 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1600 | 5877 | 4398 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1481 | 1558 | 1800 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1559 | 4472 | 4123 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1571 | 1495 | 1783 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1482 | 2472 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1458 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 2072 | 4703 | 5513 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1443 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1437 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1469 | 2780 | 3896 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1551 | 4099 | 3790 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1260 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1616 | 552 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1378 | 2232 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1377 | 6274 | 3886 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1332 | 5864 | 3252 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1286 | 5268 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1304 | 626 | 556 | 0 | 23 | ok |
| `hospedes` | Hóspedes de hoje | 1375 | 7911 | 6060 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1503 | 6009 | 5762 | 0 | 1 | ok |
| `gestdia` | Conferência do dia | 1314 | 3150 | 2831 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1252 | 971 | 968 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1436 | 9760 | 8805 | 0 | 3 | ok |
| `vacinas` | Prevenção | 1439 | 13663 | 9295 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1270 | 3449 | 5148 | 0 | 0 | ok |
| `peso` | Peso | 1271 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1255 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1244 | 620 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1443 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1282 | 843 | 880 | 0 | 23 | ok |
| `orcamento` | Orçamento de hospedagem | 1275 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1287 | 861 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1285 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1291 | 2015 | 3574 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1292 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1240 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1254 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1274 | 1915 | 2127 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1280 | 488 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1259 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1270 | 1104 | 1676 | 0 | 23 | ok |
| `agenda` | Agenda em breve | 1260 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1271 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1476 | 5018 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1419 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1385 | 5188 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1436 | 4983 | 3476 | 0 | 2 | ok |
| `turminha:sex` | Sexta · hoje 53 | 1585 | 6759 | 4799 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1466 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1461 | 8494 | 5844 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1526 | 549 | 534 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1463 | 2786 | 3896 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1416 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1396 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1465 | 6759 | 4799 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1575 | 5878 | 4398 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1468 | 1558 | 1800 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1546 | 4473 | 4123 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1481 | 1495 | 1783 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1422 | 2473 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1408 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1819 | 4703 | 5513 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1433 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1413 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1421 | 2780 | 3896 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1547 | 4099 | 3790 | 0 | 0 | ok |

