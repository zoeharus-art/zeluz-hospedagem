# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 08/09/2026, 22:53:13.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-07 e versão carimbada 2026-09-08-06.

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
| `monitor` | Felipe (`monitor`) | 2 | 0 | 48 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 49 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 53 |
| `vet` | Suellen (`vet`) | 2 | 0 | 47 |
| `supervisao` | Amanda Silva (`supervisor`) | 28 | 0 | 110 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 126 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 125 |

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
| `monitor` | `agenda` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `plantonista` | _(carga + entrada)_ | 46 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `plantonista` | `hospedagem` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `recepcao` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `recepcao` | `inicio` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `recepcao` | `mesa` | 2 | set daycare/resumo-gestao/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `recepcao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `recepcao` | `reposicao` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `vet` | _(carga + entrada)_ | 44 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `vet` | `cuidadovet` | 3 | set auaulandia/med-vigia/2026-09-08 · set daycare/resumo-gestao/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `supervisao` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `supervisao` | `conferencia` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `alergia` | 5 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `supervisao` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `supervisao` | `acerto` | 20 | transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `supervisao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-08 |
| `gestao` | _(carga + entrada)_ | 45 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `inicio` | 3 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `gestao` | `conferencia` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `ficha` | 2 | set daycare/limpeza-fotos/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `gestao` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `gestao` | `turminha:seg` | 20 | transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `gestao` | `atividade:almoco` | 2 | set daycare/dashboard-auto/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `gestao` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-10 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `atividade:checkout-corpo` | 2 | set daycare/dashboard-auto/2026-09-11 · transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `atividade:checkout-pert` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `gestao` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-12 |
| `gestao` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-13 |
| `gestao` | `atividade:peso` | 1 | set daycare/dashboard-auto/2026-09-14 |
| `diretoria` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `inicio` | 5 | transaction daycare/cobranca-almoco2/2026-09-08 · transaction daycare/turma/2026-09-08 · transaction daycare/falta-automatica/2026-09-08 · set daycare/resumo-gestao/2026-09-08 |
| `diretoria` | `consultoras` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `conferencia` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `ficha` | 1 | set daycare/limpeza-fotos/2026-09-08 |
| `diretoria` | `vacinas` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `alergia` | 4 | update daycare/cadastro/lisa__enilce · set daycare/versoes/cadastro · set daycare/alergia-confirmada/lisa__enilce/ficha · push daycare/auditoria/2026-09-08 |
| `diretoria` | `cuidadovet` | 20 | set auaulandia/med-vigia/2026-09-08 · transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 |
| `diretoria` | `turminha:ter` | 20 | transaction daycare/urgencias-enviadas/2026-09-08/med-hana__alessandra-ci_1788200741749_h8fo_14-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_26px_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-hannah%20clara%20of%20zoe%20harus__adriana%20duarte-ci_1788552196674_uduh_08-00 · transaction daycare/urgencias-enviadas/2026-09-08/med-kako__m%C3%A1rcia%20nascimento-ci_1788550330662_u4uc_08-00 |
| `diretoria` | `atividade:agility` | 2 | set daycare/dashboard-auto/2026-09-08 · push daycare/auditoria/2026-09-08 |
| `diretoria` | `atividade:livre` | 1 | set daycare/dashboard-auto/2026-09-09 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-08 · set daycare/dashboard-auto/2026-09-10 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `atividade:checkout-pert` | 1 | set daycare/dashboard-auto/2026-09-11 |
| `diretoria` | `atividade:escova` | 1 | transaction daycare/falta-automatica/2026-09-08 |
| `diretoria` | `atividade:foto` | 1 | set daycare/dashboard-auto/2026-09-12 |
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
| `painelmeu` | Meu Dashboard | 1528 | 1803 | 1514 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1266 | 59 | 339 | 0 | 3 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1453 | 1815 | 1453 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1364 | 4682 | 4724 | 0 | 3 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1395 | 1348 | 1659 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1817 | 239 | 287 | 0 | 2 | ok |
| `consultoras` | Dashboard das Consultoras | 1543 | 2160 | 1676 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1441 | 7995 | 6275 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1749 | 2737 | 2472 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1446 | 9398 | 8460 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1595 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1475 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1513 | 251 | 454 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1307 | 545 | 423 | 0 | 0 | ok |
| `checkin` | Check-in | 1305 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1378 | 9423 | 8700 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1320 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1367 | 1476 | 1193 | 0 | 1 | ok |
| `dashdc` | Lançamentos do dia | 1370 | 2012 | 3269 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1336 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1276 | 355 | 480 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `peso` | Peso | 1341 | 251 | 454 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1298 | 858 | 910 | 0 | 3 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 28 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1469 | 1348 | 1659 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1572 | 429 | 333 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1550 | 2158 | 1676 | 0 | 1 | ok |
| `painel-amanda` | Dashboard da Amanda | 1312 | 4413 | 2776 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1634 | 10322 | 6559 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1402 | 435 | 324 | 0 | 20 | ok |
| `hospedes` | Hóspedes de hoje | 1384 | 7995 | 6275 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1467 | 2737 | 2472 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1491 | 9398 | 8460 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1707 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1616 | 3351 | 4976 | 0 | 5 | ok |
| `peso` | Peso | 1324 | 251 | 454 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1356 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1552 | 545 | 423 | 0 | 0 | ok |
| `checkin` | Check-in | 1289 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1281 | 630 | 607 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1444 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1881 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1332 | 858 | 910 | 0 | 20 | ok |
| `emporio` | Quem não comeu hoje | 1329 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1316 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1334 | 2012 | 3269 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1324 | 5801 | 5247 | 0 | 20 | ok |
| `ritmo` | Ritmo do Time | 1303 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1266 | 355 | 480 | 0 | 0 | ok |
| `config` | Configurações | 1272 | 983 | 721 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1273 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1421 | 7164 | 11208 | 0 | 1 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1268 | 1348 | 1659 | 0 | 3 | ok |
| `mesa` | O que fazer hoje | 1720 | 552 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1453 | 2162 | 1676 | 0 | 1 | ok |
| `painel-amanda` | Dashboard da Amanda | 1302 | 4417 | 2776 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1362 | 4121 | 2366 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1467 | 10322 | 6559 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1301 | 435 | 324 | 0 | 20 | ok |
| `hospedes` | Hóspedes de hoje | 1378 | 7995 | 6275 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1513 | 5844 | 5521 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1334 | 2737 | 2472 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1277 | 997 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1430 | 9398 | 8460 | 0 | 2 | ok |
| `vacinas` | Prevenção | 1531 | 13035 | 8901 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1402 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1312 | 251 | 454 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1372 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1289 | 545 | 423 | 0 | 0 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1279 | 630 | 607 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1375 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1593 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1327 | 858 | 910 | 0 | 20 | ok |
| `emporio` | Quem não comeu hoje | 1298 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1297 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1320 | 2302 | 3608 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1300 | 5801 | 5247 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1281 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1261 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1272 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1271 | 772 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1260 | 983 | 721 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1252 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1397 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 2037 | 5020 | 3782 | 0 | 20 | ok |
| `turminha:ter` | Terça · hoje 43 | 1912 | 6056 | 4055 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1709 | 5190 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1657 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1694 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1722 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1806 | 7680 | 5462 | 0 | 2 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1762 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1715 | 2522 | 3356 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1762 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1700 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1694 | 5964 | 4164 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 2035 | 4604 | 3706 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1688 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1900 | 3912 | 3574 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1797 | 1371 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1764 | 2475 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1775 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 2378 | 4220 | 4877 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1796 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1697 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1813 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1848 | 3668 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1262 | 1348 | 1659 | 0 | 5 | ok |
| `mesa` | O que fazer hoje | 1751 | 552 | 349 | 0 | 0 | ok |
| `consultoras` | Dashboard das Consultoras | 1419 | 2168 | 1676 | 0 | 1 | ok |
| `painel-amanda` | Dashboard da Amanda | 1352 | 4423 | 2776 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1414 | 4127 | 2366 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1292 | 3682 | 2117 | 0 | 0 | ok |
| `painel` | Painel do Dia | 1376 | 10322 | 6559 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1344 | 435 | 324 | 0 | 20 | ok |
| `hospedes` | Hóspedes de hoje | 1363 | 7995 | 6275 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1440 | 5844 | 5521 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1347 | 2737 | 2472 | 0 | 0 | ok |
| `checkout` | Check-out 4 | 1259 | 997 | 1013 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1386 | 9398 | 8460 | 0 | 1 | ok |
| `vacinas` | Prevenção | 1490 | 13035 | 8901 | 0 | 1 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1362 | 3351 | 4976 | 0 | 4 | ok |
| `peso` | Peso | 1300 | 251 | 454 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1331 | 1023 | 881 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1296 | 545 | 423 | 0 | 0 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1270 | 630 | 607 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1348 | 11530 | 10768 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor 5 | 1599 | 12110 | 16866 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1308 | 858 | 910 | 0 | 20 | ok |
| `emporio` | Quem não comeu hoje | 1326 | 2706 | 2064 | 0 | 0 | ok |
| `reposicao` | Reposições 4 | 1288 | 1476 | 1193 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1309 | 2302 | 3608 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1298 | 5801 | 5247 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1312 | 3774 | 2692 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1268 | 355 | 480 | 0 | 0 | ok |
| `pessoas` | Time | 1282 | 1104 | 1676 | 0 | 0 | ok |
| `planodia` | Escala e plano do dia | 1286 | 772 | 1006 | 0 | 0 | ok |
| `config` | Configurações | 1270 | 983 | 721 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1255 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1419 | 7164 | 11208 | 0 | 0 | ok |
| `turminha:seg` | Segunda 44 | 1953 | 5020 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça · hoje 43 | 1748 | 6056 | 4055 | 0 | 20 | ok |
| `turminha:qua` | Quarta 45 | 1748 | 5190 | 3795 | 0 | 0 | ok |
| `turminha:qui` | Quinta 37 | 1734 | 4370 | 3169 | 0 | 0 | ok |
| `turminha:sex` | Sexta 53 | 1796 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1758 | 356 | 425 | 0 | 2 | ok |
| `atividade:almoco` | Almoço | 1817 | 7680 | 5462 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1735 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1760 | 2522 | 3356 | 0 | 1 | ok |
| `atividade:aucademia` | Aucademia | 1770 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1778 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1743 | 5964 | 4164 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1821 | 4605 | 3706 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1716 | 1434 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1871 | 3913 | 3574 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1728 | 1371 | 1570 | 0 | 1 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1738 | 2476 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1712 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 2319 | 4220 | 4877 | 0 | 1 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1681 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1654 | 386 | 425 | 0 | 1 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1687 | 2516 | 3356 | 0 | 0 | ok |
| `atividade:peso` | Peso do peludinho | 1747 | 3668 | 3262 | 0 | 0 | ok |

