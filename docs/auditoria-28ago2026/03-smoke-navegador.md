# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 12/09/2026, 16:30:26.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-11 e versão carimbada 2026-09-11-02.

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
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 48 |
| `vet` | Suellen (`vet`) | 2 | 0 | 41 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 84 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 112 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 113 |

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
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-12 |
| `monitor` | `checkout` | 2 | transaction daycare/cobranca-almoco2/2026-09-12 · transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `plantonista` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | _(carga + entrada)_ | 41 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `recepcao` | `eahist` | 2 | set daycare/dashboard-auto/2026-09-12 · set daycare/dashboard-auto/2026-09-13 |
| `recepcao` | `ritmo` | 2 | set daycare/dashboard-auto/2026-09-14 · set daycare/dashboard-auto/2026-09-15 |
| `recepcao` | `agenda` | 2 | set daycare/dashboard-auto/2026-09-16 · set daycare/dashboard-auto/2026-09-17 |
| `vet` | _(carga + entrada)_ | 40 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-12 |
| `supervisao` | _(carga + entrada)_ | 39 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `mesa` | 2 | transaction daycare/cobranca-almoco2/2026-09-12 · transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `supervisao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `supervisao` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `gestao` | _(carga + entrada)_ | 39 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-09-12 |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `gestao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `gestao` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `gestao` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `gestao` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `gestao` | `turminha:qua` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `gestao` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | _(carga + entrada)_ | 39 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `inicio` | 1 | transaction daycare/cobranca-almoco2/2026-09-12 |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `diretoria` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `diretoria` | `conferencia` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-10 · update daycare/checkout-corpo/2026-09-10 · set daycare/limpeza-fotos/2026-09-12 · push daycare/auditoria/2026-09-12 |
| `diretoria` | `cuidadovet` | 19 | set auaulandia/med-vigia/2026-09-12 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-12 |
| `diretoria` | `turminha:seg` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `turminha:qua` | 18 | transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-12/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `diretoria` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `diretoria` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | `atividade:checkin-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-18 |

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
| `painelmeu` | Meu Dashboard | 1272 | 1802 | 1537 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1298 | 635 | 556 | 0 | 1 | ok |
| `checkout` | Check-out 1 | 1324 | 1244 | 1092 | 0 | 2 | ok |
| `abertura` | Abertura do dia | 1271 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1429 | 2450 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1282 | 1814 | 1476 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1290 | 4281 | 4013 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 9316 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 9566 | 292 | 287 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 9358 | 2210 | 1739 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 9437 | 7792 | 5954 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 9395 | 2835 | 2617 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 9436 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 9541 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 9271 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 9315 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 9331 | 476 | 496 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 9378 | 11599 | 10516 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 9316 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 9360 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 9374 | 1671 | 3134 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 9266 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 9285 | 404 | 492 | 0 | 2 | ok |
| `ritmo` | Ritmo do Time | 9308 | 6088 | 4114 | 0 | 2 | ok |
| `agenda` | Agenda em breve | 9263 | 59 | 339 | 0 | 2 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1272 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1253 | 812 | 685 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1298 | 1236 | 1539 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1535 | 482 | 429 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1466 | 2208 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1296 | 6260 | 3886 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1367 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1432 | 7792 | 5954 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1404 | 2835 | 2617 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1416 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1513 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1397 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1317 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1349 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1298 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1654 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1390 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1406 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1302 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1322 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1405 | 1671 | 3134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1326 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1281 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1266 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1267 | 404 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1268 | 2194 | 2446 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1313 | 6088 | 4114 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1282 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1383 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1262 | 1236 | 1539 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1773 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1410 | 2212 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1274 | 6264 | 3886 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1362 | 5856 | 3222 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1366 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1397 | 7792 | 5954 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1562 | 5538 | 5201 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1389 | 2835 | 2617 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1314 | 1149 | 987 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1408 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1551 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1271 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1339 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1287 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1274 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1642 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1302 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1450 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1319 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1328 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1330 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1340 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1285 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1275 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1276 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1261 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1295 | 2194 | 2446 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1287 | 491 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1300 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1341 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1271 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1376 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1587 | 5449 | 3775 | 0 | 1 | ok |
| `turminha:ter` | Terça 45 | 1551 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1495 | 5188 | 3795 | 0 | 18 | ok |
| `turminha:qui` | Quinta 43 | 1529 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1475 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1511 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1482 | 7443 | 5296 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1561 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1508 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1527 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1501 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1502 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1573 | 4366 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1544 | 1432 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1570 | 3675 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1636 | 1369 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1548 | 2448 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1522 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2085 | 4237 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1529 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1443 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1501 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1734 | 3698 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1260 | 1236 | 1539 | 0 | 1 | ok |
| `mesa` | O que fazer hoje | 1754 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1452 | 2218 | 1739 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1254 | 6270 | 3886 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1375 | 5862 | 3222 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1389 | 5279 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1344 | 635 | 556 | 0 | 19 | ok |
| `hospedes` | Hóspedes de hoje | 1385 | 7792 | 5954 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1521 | 5538 | 5201 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1394 | 2835 | 2617 | 0 | 0 | ok |
| `checkout` | Check-out 1 | 1287 | 1149 | 987 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1435 | 9760 | 8805 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1471 | 14147 | 9518 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1376 | 3496 | 5196 | 0 | 0 | ok |
| `peso` | Peso | 1318 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in 3 | 1283 | 476 | 496 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 737 | 592 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 4 | 1674 | 19941 | 29175 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 812 | 685 | 0 | 19 | ok |
| `orcamento` | Orçamento de hospedagem | 1338 | 13776 | 12669 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 865 | 1377 | 0 | 1 | ok |
| `reposicao` | Reposições 35 | 1332 | 4513 | 3657 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1330 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1281 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1267 | 1680 | 1173 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1283 | 404 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1297 | 2194 | 2446 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1293 | 491 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1283 | 6088 | 4114 | 0 | 0 | ok |
| `pessoas` | Time | 1312 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1383 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1593 | 5449 | 3775 | 0 | 1 | ok |
| `turminha:ter` | Terça 45 | 1498 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1483 | 5188 | 3795 | 0 | 18 | ok |
| `turminha:qui` | Quinta 43 | 1481 | 4983 | 3476 | 0 | 1 | ok |
| `turminha:sex` | Sexta 53 | 1493 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1484 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1506 | 7443 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1558 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1530 | 2520 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1506 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1440 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1481 | 5962 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1533 | 4367 | 3632 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1548 | 1432 | 1587 | 0 | 1 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1570 | 3676 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1594 | 1369 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1520 | 2449 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1489 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2046 | 4237 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1519 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1422 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1551 | 2514 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1681 | 3698 | 3262 | 0 | 0 | ok |

