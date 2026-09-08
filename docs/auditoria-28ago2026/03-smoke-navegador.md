# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 08/09/2026, 20:52:11.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-07 e versão carimbada 2026-09-08-04.

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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 45 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 49 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 53 |
| `vet` | Suellen (`vet`) | 2 | 0 | 50 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 114 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 146 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 143 |

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
| `monitor` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `plantonista` | _(carga + entrada)_ | 46 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `plantonista` | `hospedagem` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `recepcao` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `recepcao` | `mesa` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `recepcao` | `vacinas` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `vet` | _(carga + entrada)_ | 46 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `vet` | `cuidadovet` | 1 | set auaulandia/med-vigia/2026-09-08 |
| `vet` | `peso` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `supervisao` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `inicio` | 5 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 · set daycare/resumo-gestao/2026-09-08 |
| `supervisao` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `supervisao` | `conferencia` | 40 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `supervisao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `mesa` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `conferencia` | 40 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `checkout` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `checkoutconf` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `gestao` | `turminha:seg` | 20 | transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `turminha:ter` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `gestao` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `gestao` | `atividade:checkin-corpo` | 2 | set daycare/dashboard-auto/2026-09-12 · transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-08 · set daycare/dashboard-auto/2026-09-13 |
| `gestao` | `atividade:checkout-pert` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-15 |
| `diretoria` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `mesa` | 5 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 · set daycare/resumo-gestao/2026-09-08 |
| `diretoria` | `painel-diretoria` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `conferencia` | 40 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `checkoutconf` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `recepcao` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `diretoria` | `agenda` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `diretoria` | `turminha:qua` | 20 | transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `turminha:sex` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-08 · set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `diretoria` | `atividade:foto` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `atividade:massagem` | 1 | set daycare/dashboard-auto/2026-09-13 |

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
| `painelmeu` | Meu Painel | 1277 | 1803 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Painel | 1305 | 1815 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1475 | 4682 | 4724 | 0 | 3 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1359 | 1348 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1718 | 239 | 287 | 0 | 3 | ok |
| `ficha` | Cadastro de Peludinhos | 1480 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1399 | 2160 | 1676 | 0 | 0 | ok |
| `checkin` | Check-in | 1315 | 414 | 376 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1437 | 7995 | 6275 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1401 | 2737 | 2472 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1359 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1335 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1297 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1360 | 2012 | 3269 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1458 | 13035 | 8901 | 0 | 1 | ok |
| `alergia` | Conversa com o Tutor | 1263 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1282 | 190 | 366 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1284 | 545 | 423 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1318 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1308 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1279 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1314 | 858 | 910 | 0 | 1 | ok |
| `peso` | Peso | 1375 | 190 | 366 | 0 | 3 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1449 | 1348 | 1659 | 0 | 5 | ok |
| `mesa` | O que fazer hoje | 1575 | 429 | 333 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1401 | 9398 | 8460 | 0 | 1 | ok |
| `consultoras` | Painel das Consultoras | 1534 | 2158 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1471 | 2969 | 1815 | 0 | 0 | ok |
| `checkin` | Check-in | 1348 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1316 | 435 | 324 | 0 | 40 | ok |
| `hospedes` | Hóspedes de hoje | 1400 | 7995 | 6275 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1300 | 858 | 910 | 0 | 20 | ok |
| `gestdia` | Conferência do dia | 1400 | 2737 | 2472 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1337 | 630 | 607 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1378 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1487 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1303 | 2706 | 2064 | 0 | 1 | ok |
| `reposicao` | Reposições 4 | 1270 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1305 | 2012 | 3269 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1380 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1270 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1399 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1298 | 545 | 423 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1451 | 5801 | 5247 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1532 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1364 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1270 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1395 | 10322 | 6559 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1256 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1463 | 7164 | 11208 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1267 | 1348 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1706 | 552 | 349 | 0 | 3 | ok |
| `ficha` | Cadastro de Peludinhos | 1394 | 9398 | 8460 | 0 | 1 | ok |
| `consultoras` | Painel das Consultoras | 1379 | 2162 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1271 | 2973 | 1815 | 0 | 0 | ok |
| `checkin` | Check-in | 1282 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1314 | 435 | 324 | 0 | 40 | ok |
| `hospedes` | Hóspedes de hoje | 1380 | 7995 | 6275 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1286 | 858 | 910 | 0 | 20 | ok |
| `hospedagem` | Plantão da noite | 1503 | 5844 | 5521 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1360 | 2737 | 2472 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1276 | 997 | 1013 | 0 | 1 | ok |
| `checkoutconf` | Check-out com o tutor | 1293 | 630 | 607 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1329 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1509 | 12233 | 17243 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1404 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1301 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1377 | 2302 | 3608 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1531 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1380 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1312 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1265 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1363 | 4121 | 2366 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1325 | 5801 | 5247 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1317 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1270 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1295 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1284 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1266 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1393 | 10322 | 6559 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1284 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1472 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 2036 | 5020 | 3782 | 0 | 20 | ok |
| `turminha:ter` | Terça · hoje 43 | 1829 | 6056 | 4055 | 0 | 1 | ok |
| `turminha:qua` | Quarta 45 | 1814 | 5190 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1837 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1837 | 5964 | 4164 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1742 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1729 | 7680 | 5462 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1799 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1903 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1668 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1727 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1715 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 2013 | 4577 | 3706 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1922 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1872 | 3890 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1788 | 1371 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1786 | 2475 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1860 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2315 | 4220 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1651 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1766 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1882 | 2516 | 3356 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1932 | 3668 | 3262 | 0 | 0 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1253 | 1348 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1585 | 552 | 349 | 0 | 5 | ok |
| `painel-diretoria` | Painel da Diretoria | 1365 | 3676 | 2098 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1374 | 9398 | 8460 | 0 | 0 | ok |
| `consultoras` | Painel das Consultoras | 1394 | 2168 | 1676 | 0 | 0 | ok |
| `painel-amanda` | Painel da Supervisão | 1272 | 2979 | 1815 | 0 | 0 | ok |
| `checkin` | Check-in | 1274 | 414 | 376 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1310 | 435 | 324 | 0 | 40 | ok |
| `hospedes` | Hóspedes de hoje | 1362 | 7995 | 6275 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1269 | 858 | 910 | 0 | 20 | ok |
| `hospedagem` | Plantão da noite | 1484 | 5844 | 5521 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1363 | 2737 | 2472 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1265 | 997 | 1013 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1259 | 630 | 607 | 0 | 1 | ok |
| `orcamento` | Orçamento de hospedagem | 1273 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 6 | 1440 | 12233 | 17243 | 0 | 1 | ok |
| `emporio` | Quem não comeu hoje | 1303 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1274 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1311 | 2302 | 3608 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1413 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Conversa com o Tutor | 1260 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1272 | 190 | 366 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1302 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1256 | 545 | 423 | 0 | 0 | ok |
| `paineloperacao` | Painel da Operação | 1262 | 4127 | 2366 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1304 | 5801 | 5247 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1299 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1272 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1271 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1260 | 769 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1314 | 983 | 721 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1434 | 10322 | 6559 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1288 | 59 | 339 | 0 | 1 | ok |
| `relatorios` | Relatórios | 1410 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1928 | 5020 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1846 | 6056 | 4055 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1754 | 5190 | 3795 | 0 | 20 | ok |
| `turminha:qui` | Quinta 37 | 1643 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1715 | 5964 | 4164 | 0 | 1 | ok |
| `atividade:agility` | Agility Funcional | 1688 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1739 | 7680 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1727 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1715 | 2522 | 3356 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1667 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1740 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1689 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1789 | 4578 | 3706 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1705 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1825 | 3891 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1714 | 1371 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1646 | 2476 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1662 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2218 | 4220 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1736 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1689 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1678 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1753 | 3668 | 3262 | 0 | 0 | ok |

