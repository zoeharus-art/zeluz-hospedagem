# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 13/09/2026, 13:56:25.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-12 e versão carimbada 2026-09-13-01.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 72 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 70 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 71 |
| `vet` | Suellen (`vet`) | 2 | 0 | 71 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 142 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 282 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 186 |

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
| `monitor` | _(carga + entrada)_ | 70 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `monitor` | `checkout` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `plantonista` | _(carga + entrada)_ | 70 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | _(carga + entrada)_ | 69 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `recepcao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `recepcao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `vet` | _(carga + entrada)_ | 70 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-13 |
| `supervisao` | _(carga + entrada)_ | 67 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `supervisao` | `painel-amanda` | 3 | update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `supervisao` | `conferencia` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `cuidadovet` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `supervisao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | _(carga + entrada)_ | 166 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `gestao` | `consultoras` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `conferencia` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `ficha` | 3 | update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `cuidadovet` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `gestao` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `gestao` | `turminha:sex` | 32 | transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `gestao` | `atividade:agility` | 2 | set daycare/dashboard-auto/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `gestao` | `atividade:aulinha` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:checkout-corpo` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-16 |
| `diretoria` | _(carga + entrada)_ | 69 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `mesa` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `diretoria` | `consultoras` | 2 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 |
| `diretoria` | `painel-amanda` | 2 | set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `conferencia` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `checkout` | 4 | update daycare/checkin-corpo/2026-09-11 · update daycare/checkout-corpo/2026-09-11 · set daycare/limpeza-fotos/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `cuidadovet` | 33 | set auaulandia/med-vigia/2026-09-13 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-13 |
| `diretoria` | `config` | 4 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/fim · transaction daycare/config/protocolos/almoco/inicio · transaction daycare/config/protocolos/almoco/fim |
| `diretoria` | `turminha:seg` | 32 | transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_014q_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1789069797725_9ryc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 · transaction daycare/urgencias-enviadas/2026-09-13/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330663_rskk_08-00 |
| `diretoria` | `atividade:livre` | 2 | set daycare/dashboard-auto/2026-09-13 · push daycare/auditoria/2026-09-13 |
| `diretoria` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-15 |
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
| `painelmeu` | Meu Dashboard | 1255 | 1776 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1259 | 441 | 324 | 0 | 1 | ok |
| `checkout` | Check-out | 1260 | 1294 | 1302 | 0 | 1 | ok |
| `abertura` | Abertura do dia | 1235 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1239 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1366 | 2436 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1302 | 1788 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1282 | 3826 | 3925 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1257 | 1190 | 1581 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1362 | 239 | 287 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1393 | 2139 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1325 | 7401 | 5802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1365 | 3756 | 3053 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1316 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1389 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1269 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1278 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1260 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1257 | 12165 | 11072 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1300 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1284 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1428 | 1671 | 3134 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1261 | 545 | 423 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 415 | 492 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1270 | 7386 | 4901 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1241 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1256 | 298 | 471 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1259 | 794 | 685 | 0 | 1 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1271 | 1190 | 1581 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1419 | 379 | 333 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1355 | 2137 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Dashboard da Amanda | 1359 | 5738 | 3533 | 0 | 3 | ok |
| `conferencia` | Conferência do check-in | 1323 | 441 | 324 | 0 | 33 | ok |
| `hospedes` | Hóspedes de hoje | 1355 | 7401 | 5802 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1359 | 3756 | 3053 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1354 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1545 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1255 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1294 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1286 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1519 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 794 | 685 | 0 | 33 | ok |
| `orcamento` | Orçamento de hospedagem | 1261 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1293 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1312 | 1671 | 3134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1328 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1272 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1271 | 5260 | 3821 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1265 | 415 | 492 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1267 | 2569 | 2786 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1328 | 7386 | 4901 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1253 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1321 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1265 | 1190 | 1581 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1583 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1381 | 2141 | 1676 | 0 | 4 | ok |
| `painel-amanda` | Dashboard da Amanda | 1293 | 5742 | 3533 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1479 | 5844 | 3166 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1359 | 441 | 324 | 0 | 33 | ok |
| `hospedes` | Hóspedes de hoje | 1321 | 7401 | 5802 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1436 | 5900 | 5586 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1303 | 3756 | 3053 | 0 | 0 | ok |
| `checkout` | Check-out | 1299 | 1199 | 1197 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1418 | 9876 | 8916 | 0 | 3 | ok |
| `vacinas` | Prevenção | 1513 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1265 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1275 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1254 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1246 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1460 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1285 | 794 | 685 | 0 | 33 | ok |
| `orcamento` | Orçamento de hospedagem | 1274 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1316 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1298 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1315 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1285 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1297 | 5260 | 3821 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1253 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1273 | 2569 | 2786 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1272 | 494 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1258 | 7386 | 4901 | 0 | 0 | ok |
| `pessoas` | Time | 1268 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1252 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1286 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1461 | 5664 | 4097 | 0 | 0 | ok |
| `turminha:ter` | Terça 45 | 1415 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1364 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1375 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1360 | 5958 | 4164 | 0 | 32 | ok |
| `atividade:agility` | Agility Funcional | 1474 | 356 | 425 | 0 | 2 | ok |
| `atividade:almoco` | Almoço | 1461 | 7439 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1474 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1437 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1465 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1367 | 368 | 425 | 0 | 1 | ok |
| `atividade:chamada` | Chamada | 1427 | 5958 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1519 | 4377 | 3691 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1529 | 1428 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1582 | 3702 | 3500 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1465 | 1365 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1476 | 2434 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1489 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1785 | 4271 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1484 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1569 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1485 | 2510 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1549 | 3694 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1239 | 1190 | 1581 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1517 | 552 | 349 | 0 | 1 | ok |
| `consultoras` | Dashboard das Consultoras | 1351 | 2147 | 1676 | 0 | 2 | ok |
| `painel-amanda` | Dashboard da Amanda | 1290 | 5748 | 3533 | 0 | 2 | ok |
| `paineloperacao` | Dashboard da Márcia | 1256 | 5850 | 3166 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1337 | 5290 | 2979 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1369 | 441 | 324 | 0 | 33 | ok |
| `hospedes` | Hóspedes de hoje | 1428 | 7401 | 5802 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1514 | 6068 | 5677 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1325 | 3756 | 3053 | 0 | 0 | ok |
| `checkout` | Check-out | 1269 | 1199 | 1197 | 0 | 4 | ok |
| `ficha` | Cadastro de Peludinhos | 1338 | 9876 | 8916 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1418 | 14691 | 9839 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1253 | 3543 | 5282 | 0 | 0 | ok |
| `peso` | Peso | 1287 | 298 | 471 | 0 | 0 | ok |
| `checkin` | Check-in | 1271 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1269 | 1225 | 1076 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 7 | 1519 | 22727 | 33031 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1280 | 794 | 685 | 0 | 33 | ok |
| `orcamento` | Orçamento de hospedagem | 1282 | 14363 | 13224 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1314 | 2075 | 3407 | 0 | 1 | ok |
| `reposicao` | Reposições 36 | 1272 | 4632 | 3737 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1286 | 1961 | 3473 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1270 | 785 | 662 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1262 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1272 | 5260 | 3821 | 0 | 4 | ok |
| `eahist` | Enriquecimento Ambiental | 1266 | 415 | 492 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1257 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1288 | 2569 | 2786 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1272 | 494 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1271 | 7386 | 4901 | 0 | 0 | ok |
| `pessoas` | Time | 1272 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1257 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1298 | 2243 | 1870 | 0 | 0 | ok |
| `turminha:seg` | Segunda · hoje 44 | 1433 | 5664 | 4097 | 0 | 32 | ok |
| `turminha:ter` | Terça 45 | 1359 | 5162 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1377 | 5184 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 43 | 1351 | 4983 | 3476 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1350 | 5958 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1407 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1517 | 7439 | 5296 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1410 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1408 | 2516 | 3356 | 0 | 2 | ok |
| `atividade:aucademia` | Aucademia | 1393 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1350 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1378 | 5958 | 4164 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1474 | 4378 | 3691 | 0 | 0 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1407 | 1428 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1437 | 3703 | 3500 | 0 | 0 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1394 | 1365 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1386 | 2435 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1359 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1629 | 4271 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1445 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1376 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1409 | 2510 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1426 | 3694 | 3262 | 0 | 0 | ok |

