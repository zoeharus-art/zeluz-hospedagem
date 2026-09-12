# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 12/09/2026, 18:02:28.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-11 e versão carimbada 2026-09-12-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 43 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 40 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 42 |
| `vet` | Suellen (`vet`) | 2 | 0 | 96 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 106 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 172 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 139 |

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
| `monitor` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `monitor` | `conferencia` | 2 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/cobranca-almoco2/2026-09-12 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `plantonista` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | _(carga + entrada)_ | 39 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | `mesa` | 2 | transaction daycare/cobranca-almoco2/2026-09-12 · transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `vet` | _(carga + entrada)_ | 95 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-12 |
| `supervisao` | _(carga + entrada)_ | 41 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `supervisao` | `painel-amanda` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `supervisao` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `supervisao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | _(carga + entrada)_ | 94 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-09-12 |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `gestao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `gestao` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `checkout` | 2 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 |
| `gestao` | `ficha` | 2 | set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `gestao` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `gestao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | `turminha:qua` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `gestao` | `atividade:agility` | 2 | set daycare/dashboard-auto/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `gestao` | `atividade:aucademia` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `gestao` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `inicio` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `diretoria` | `painel-amanda` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `diretoria` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `diretoria` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `diretoria` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `diretoria` | `agenda` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | `atividade:checkin-corpo` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-19 |

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
| `painelmeu` | Meu Dashboard | 1295 | 1802 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1280 | 635 | 556 | 0 | 2 | ok |
| `checkout` | Check-out 1 | 1777 | 1244 | 1092 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1274 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1259 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1483 | 2450 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1293 | 1814 | 1476 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1327 | 4281 | 4013 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1318 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1512 | 292 | 287 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1439 | 2210 | 1739 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1383 | 7792 | 5954 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1379 | 2840 | 2617 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1409 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1544 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1419 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1300 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1281 | 476 | 496 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1397 | 11599 | 10516 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1299 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1322 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1438 | 1671 | 3134 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1295 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1271 | 404 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1300 | 6088 | 4114 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1304 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1280 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1271 | 812 | 685 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9323 | 1236 | 1539 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 9574 | 483 | 429 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9451 | 2208 | 1739 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9321 | 6265 | 3886 | 0 | 18 | ok |
| `conferencia` | Conferência do check-in | 2527 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1462 | 7792 | 5954 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1402 | 2840 | 2617 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1405 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1553 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1412 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1314 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1286 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1308 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1691 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1329 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1421 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1312 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1347 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1356 | 1671 | 3134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1335 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1275 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1309 | 5175 | 3729 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1295 | 404 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1295 | 2194 | 2446 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1331 | 6088 | 4114 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1287 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1337 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1258 | 1236 | 1539 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1775 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1409 | 2212 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1282 | 6269 | 3886 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1375 | 5856 | 3222 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1338 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1406 | 7792 | 5954 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1577 | 5543 | 5201 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1375 | 2840 | 2617 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1285 | 1149 | 987 | 0 | 2 | ok |
| `ficha` | Cadastro de Peludinhos | 1417 | 9760 | 8805 | 0 | 2 | ok |
| `vacinas` | Prevenção | 1516 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1358 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1298 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1287 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1656 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1308 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1390 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1401 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1313 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1327 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1333 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1261 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1300 | 5175 | 3729 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1280 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1279 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1282 | 2194 | 2446 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1282 | 491 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1298 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1303 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1340 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1551 | 5449 | 3775 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1520 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1472 | 5188 | 3795 | 0 | 18 | ok |
| `turminha:qui` | Quinta 43 | 1482 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1506 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1535 | 356 | 425 | 0 | 2 | ok |
| `atividade:almoco` | Almoço | 1558 | 7443 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1537 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1578 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1534 | 332 | 425 | 0 | 1 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1491 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1488 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1601 | 4390 | 3691 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1544 | 1432 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1620 | 3706 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1555 | 1369 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1557 | 2448 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1537 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2228 | 4237 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1529 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1503 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1577 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1628 | 3698 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9279 | 1236 | 1539 | 0 | 4 | ok |
| `mesa` | O que fazer hoje | 9710 | 552 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9558 | 2218 | 1739 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 9318 | 6275 | 3886 | 0 | 18 | ok |
| `paineloperacao` | Dashboard da Márcia | 9397 | 5862 | 3222 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 9400 | 5267 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 2317 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1410 | 7792 | 5954 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1564 | 5536 | 5201 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1360 | 2833 | 2617 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1289 | 1149 | 987 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1409 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1520 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1343 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1311 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1298 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1274 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1628 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1308 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1374 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1333 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1329 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1343 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1317 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1281 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1310 | 5175 | 3729 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1282 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1286 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1280 | 2194 | 2446 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1283 | 491 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1297 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1312 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 18 | ok |
| `relatorios` | Relatórios | 1329 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1530 | 5449 | 3775 | 0 | 1 | ok |
| `turminha:ter` | Terça 45 | 1541 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1464 | 5188 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1559 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1500 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1492 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1527 | 7443 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1550 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1515 | 2520 | 3356 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1508 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1495 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1494 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1644 | 4400 | 3691 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1552 | 1432 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1601 | 3698 | 3500 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1526 | 1369 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1527 | 2449 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1494 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 2106 | 4237 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1555 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1495 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1534 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1693 | 3698 | 3262 | 0 | 1 | ok |

