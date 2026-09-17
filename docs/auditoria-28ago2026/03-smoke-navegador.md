# Smoke de navegador — o app aberto de verdade, tela por tela

> Gerado por `tests/smoke-navegador.js` em 17/09/2026, 18:27:29.
> Servidor: python -m http.server 8765 · arquivo medido: `auaulandia/index.html` (do disco, nunca o GitHub Pages).
> Banco: emulador local na porta 9000 com o retrato de 2026-09-17 e versão carimbada 2026-09-17-03.

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
| `monitor` | Felipe (`monitor`) | 6 | 0 | 48 |
| `plantonista` | Teste do Sistema (`plantonista`) | 2 | 0 | 43 |
| `recepcao` | Giullian Gomes (`consultora`) | 18 | 0 | 48 |
| `vet` | Suellen (`vet`) | 2 | 0 | 63 |
| `supervisao` | Amanda Silva (`supervisor`) | 27 | 0 | 110 |
| `gestao` | Márcia · Gestora (`gestao`) | 56 | 0 | 169 |
| `diretoria` | Adriana · Gestão Total (`gestao`) | 57 | 0 | 168 |

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
| `monitor` | _(carga + entrada)_ | 43 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `monitor` | `conferencia` | 1 | set auaulandia/med-vigia/2026-09-17 |
| `monitor` | `checkout` | 4 | transaction daycare/cobranca-almoco2/2026-09-17 · transaction daycare/turma/2026-09-17 · transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `plantonista` | _(carga + entrada)_ | 42 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `plantonista` | `painelmeu` | 1 | transaction daycare/resumo-gestao/2026-09-17 |
| `recepcao` | _(carga + entrada)_ | 42 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `recepcao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-17 · transaction daycare/turma/2026-09-17 · transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `recepcao` | `emporio` | 2 | transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `vet` | _(carga + entrada)_ | 61 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `vet` | `cuidadovet` | 2 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/resumo-gestao/2026-09-17 |
| `supervisao` | _(carga + entrada)_ | 42 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `supervisao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-17 · transaction daycare/turma/2026-09-17 · transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `supervisao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `supervisao` | `conferencia` | 7 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `supervisao` | `cuidadovet` | 8 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `supervisao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-17 |
| `supervisao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | _(carga + entrada)_ | 42 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `gestao` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-17 · transaction daycare/turma/2026-09-17 · transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `gestao` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `gestao` | `conferencia` | 7 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `gestao` | `ficha` | 43 | remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `gestao` | `cuidadovet` | 7 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `gestao` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-17 |
| `gestao` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `gestao` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `gestao` | `turminha:qua` | 7 | transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 |
| `gestao` | `turminha:qui` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `gestao` | `atividade:almoco2` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `gestao` | `atividade:chamada` | 1 | set daycare/dashboard-auto/2026-09-20 |
| `gestao` | `atividade:checkin-corpo` | 1 | transaction daycare/falta-automatica/2026-09-17 |
| `gestao` | `atividade:checkout-corpo` | 2 | transaction daycare/falta-automatica/2026-09-17 · set daycare/dashboard-auto/2026-09-21 |
| `gestao` | `atividade:escova` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `gestao` | `atividade:musicoterapia` | 1 | set daycare/dashboard-auto/2026-09-23 |
| `gestao` | `atividade:peso` | 1 | transaction daycare/falta-automatica/2026-09-17 |
| `diretoria` | _(carga + entrada)_ | 42 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `diretoria` | `mesa` | 4 | transaction daycare/cobranca-almoco2/2026-09-17 · transaction daycare/turma/2026-09-17 · transaction daycare/avisos-telegram-atraso/2026-09-17 · transaction daycare/falta-automatica/2026-09-17 |
| `diretoria` | `consultoras` | 42 | remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `diretoria` | `conferencia` | 7 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `diretoria` | `checkout` | 1 | transaction daycare/falta-automatica/2026-09-17 |
| `diretoria` | `ficha` | 42 | remove daycare/fotos-corpo/2026-08-26 · remove daycare/fotos-corpo/2026-08-25 · remove daycare/fotos-corpo/2026-08-24 · remove daycare/fotos-corpo/2026-08-23 |
| `diretoria` | `cuidadovet` | 7 | set auaulandia/med-vigia/2026-09-17 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 |
| `diretoria` | `emporio` | 1 | transaction daycare/avisos-telegram-atraso/2026-09-17 |
| `diretoria` | `config` | 6 | transaction daycare/config/protocolos/checkin-corpo/inicio · transaction daycare/config/protocolos/checkin-corpo/inicio/porques · transaction daycare/config/protocolos/checkin-corpo/inicio/perguntas · transaction daycare/config/protocolos/checkin-corpo/fim |
| `diretoria` | `relatorios` | 1 | set daycare/dashboard-auto/2026-09-17 |
| `diretoria` | `turminha:ter` | 7 | transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545203_6fmr_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-dolly__marguita-ci_1789481545206_2vcw_09-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_07-00 · transaction daycare/urgencias-enviadas/2026-09-17/med-juma__caroline%20moreira%20nogueira-vet_1789584099070_ze2s_15-00 |
| `diretoria` | `turminha:qua` | 1 | set daycare/dashboard-auto/2026-09-18 |
| `diretoria` | `atividade:almoco` | 1 | set daycare/dashboard-auto/2026-09-19 |
| `diretoria` | `atividade:checkin-corpo` | 2 | transaction daycare/falta-automatica/2026-09-17 · set daycare/dashboard-auto/2026-09-20 |
| `diretoria` | `atividade:checkout-corpo` | 1 | transaction daycare/falta-automatica/2026-09-17 |
| `diretoria` | `atividade:ea` | 1 | set daycare/dashboard-auto/2026-09-21 |
| `diretoria` | `atividade:jogos` | 1 | set daycare/dashboard-auto/2026-09-22 |
| `diretoria` | `atividade:musicoterapia` | 1 | transaction daycare/falta-automatica/2026-09-17 |

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
| `painelmeu` | Meu Dashboard | 1267 | 1808 | 1514 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1265 | 434 | 324 | 0 | 1 | ok |
| `checkout` | Check-out | 1257 | 680 | 776 | 0 | 4 | ok |
| `abertura` | Abertura do dia | 1244 | 730 | 869 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1238 | 59 | 339 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1380 | 2456 | 1477 | 0 | 0 | ok |

### `plantonista` — Plantonista (senha 1001, senha fixa no HTML)

Entrou como **Teste do Sistema**, papel `plantonista`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `painelmeu` | Meu Dashboard | 1274 | 1809 | 1453 | 0 | 1 | ok |
| `hospedagem` | Plantão da noite | 1286 | 3002 | 3265 | 0 | 0 | ok |

### `recepcao` — Giullian Gomes (senha 8000, cadastro do banco (daycare/config/monitores))

Entrou como **Giullian Gomes**, papel `consultora`. 18 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1276 | 1209 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1363 | 278 | 241 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1362 | 2383 | 1712 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1281 | 432 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1270 | 10170 | 6608 | 0 | 0 | ok |
| `hospedes` | Hóspedes de hoje | 1331 | 6894 | 5326 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1305 | 1566 | 1667 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1336 | 9908 | 8973 | 0 | 0 | ok |
| `checkin` | Check-in | 1269 | 414 | 376 | 0 | 0 | ok |
| `orcamento` | Orçamento de hospedagem | 1318 | 1276 | 1251 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1318 | 1764 | 3269 | 0 | 0 | ok |
| `peso` | Peso | 1272 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1256 | 3543 | 5282 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1420 | 15024 | 10537 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1300 | 2698 | 3897 | 0 | 2 | ok |
| `reposicao` | Reposições 41 | 1285 | 5094 | 4134 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1255 | 545 | 423 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1269 | 59 | 339 | 0 | 0 | ok |

### `vet` — Suellen (senha 3000, cadastro do banco (daycare/config/monitores))

Entrou como **Suellen**, papel `vet`. 2 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `cuidadovet` | Cuidado Vet | 1263 | 515 | 489 | 0 | 2 | ok |
| `peso` | Peso | 1272 | 298 | 471 | 0 | 0 | ok |

### `supervisao` — Amanda Silva (senha 1209, cadastro do banco (daycare/config/monitores))

Entrou como **Amanda Silva**, papel `supervisor`. 27 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1254 | 1209 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1458 | 244 | 316 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1381 | 2381 | 1712 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1266 | 6173 | 3782 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1257 | 432 | 505 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1288 | 10170 | 6608 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1312 | 434 | 324 | 0 | 7 | ok |
| `hospedes` | Hóspedes de hoje | 1328 | 6945 | 5326 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1314 | 1566 | 1667 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1346 | 9908 | 8973 | 0 | 0 | ok |
| `checkin` | Check-in | 1267 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1267 | 569 | 565 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1588 | 24718 | 37360 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1267 | 515 | 489 | 0 | 8 | ok |
| `orcamento` | Orçamento de hospedagem | 1300 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1325 | 1764 | 3269 | 0 | 0 | ok |
| `peso` | Peso | 1284 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1259 | 3543 | 5282 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1407 | 15024 | 10537 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1286 | 2698 | 3897 | 0 | 1 | ok |
| `reposicao` | Reposições 41 | 1286 | 5094 | 4134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1329 | 4650 | 3811 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1255 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1299 | 14562 | 11049 | 0 | 6 | ok |
| `acerto` | Financeiro do plantão | 1269 | 4016 | 4053 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1268 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1317 | 2243 | 1870 | 0 | 0 | ok |

### `gestao` — Márcia · Gestora (senha 0902, senha fixa no HTML)

Entrou como **Márcia · Gestora**, papel `gestao`. 56 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1254 | 1209 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1425 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1383 | 2385 | 1712 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1286 | 6177 | 3782 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1253 | 6174 | 3405 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1283 | 432 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1269 | 506 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1296 | 10170 | 6608 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1304 | 434 | 324 | 0 | 7 | ok |
| `hospedes` | Hóspedes de hoje | 1324 | 6945 | 5326 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1396 | 3072 | 3227 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1300 | 1566 | 1667 | 0 | 0 | ok |
| `checkout` | Check-out | 1257 | 585 | 671 | 0 | 0 | ok |
| `ficha` | Cadastro de Peludinhos | 1330 | 9908 | 8973 | 0 | 43 | ok |
| `checkin` | Check-in | 1278 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1271 | 569 | 565 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1524 | 24718 | 37360 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1277 | 515 | 489 | 0 | 7 | ok |
| `orcamento` | Orçamento de hospedagem | 1326 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1346 | 2054 | 3608 | 0 | 0 | ok |
| `peso` | Peso | 1274 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1258 | 3543 | 5282 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1408 | 15024 | 10537 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1282 | 2698 | 3897 | 0 | 1 | ok |
| `reposicao` | Reposições 41 | 1313 | 5094 | 4134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1315 | 4650 | 3811 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1257 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1331 | 14562 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1279 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1289 | 4016 | 4053 | 0 | 0 | ok |
| `pessoas` | Time | 1298 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1270 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1324 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1480 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 44 | 1385 | 5071 | 3732 | 0 | 0 | ok |
| `turminha:qua` | Quarta 45 | 1367 | 5184 | 3795 | 0 | 7 | ok |
| `turminha:qui` | Quinta · hoje 43 | 1373 | 5514 | 3811 | 0 | 1 | ok |
| `turminha:sex` | Sexta 51 | 1420 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1412 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1412 | 7482 | 5436 | 0 | 0 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1418 | 460 | 480 | 0 | 1 | ok |
| `atividade:livre` | Atividade livre | 1451 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1406 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1405 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1392 | 5774 | 4121 | 0 | 1 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1510 | 4682 | 3821 | 0 | 1 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1435 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1468 | 3980 | 3630 | 0 | 2 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1421 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1452 | 2455 | 1477 | 0 | 0 | ok |
| `atividade:escova` | Escova de Dentes | 1456 | 353 | 425 | 0 | 1 | ok |
| `atividade:foto` | Foto do peludinho | 1705 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1414 | 353 | 425 | 0 | 0 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1424 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1427 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1468 | 3579 | 3262 | 0 | 1 | ok |

### `diretoria` — Adriana · Gestão Total (senha 1101, senha fixa no HTML (role=gestao + souAdriana, que o app trata como Diretoria))

Entrou como **Adriana · Gestão Total**, papel `gestao`. 57 tela(s) no menu dele.

| Tela (`data-v`) | Nome no menu | Estabilizou (ms) | Conteúdo (chars) | Altura (px) | Erros JS | Escritas | Situação |
|---|---|---:|---:|---:|---:|---:|---|
| `inicio` | Início | 1251 | 1209 | 1624 | 0 | 0 | ok |
| `mesa` | O que fazer hoje | 1595 | 551 | 349 | 0 | 4 | ok |
| `consultoras` | Dashboard das Consultoras | 1349 | 2391 | 1712 | 0 | 42 | ok |
| `painel-amanda` | Dashboard da Amanda | 1277 | 6183 | 3782 | 0 | 0 | ok |
| `paineloperacao` | Dashboard da Márcia | 1269 | 6180 | 3405 | 0 | 0 | ok |
| `painel-diretoria` | Dashboard da Adriana | 1269 | 5270 | 2979 | 0 | 0 | ok |
| `eahist` | Enriquecimento Ambiental | 1256 | 432 | 505 | 0 | 0 | ok |
| `linhadotempo` | Linha do tempo do dia | 1256 | 506 | 599 | 0 | 0 | ok |
| `ritmo` | Ritmo do Time | 1308 | 10170 | 6608 | 0 | 0 | ok |
| `conferencia` | Conferência do check-in | 1314 | 434 | 324 | 0 | 7 | ok |
| `hospedes` | Hóspedes de hoje | 1332 | 6945 | 5326 | 0 | 0 | ok |
| `hospedagem` | Plantão da noite | 1382 | 3072 | 3227 | 0 | 0 | ok |
| `gestdia` | Conferência do dia | 1289 | 1566 | 1667 | 0 | 0 | ok |
| `checkout` | Check-out | 1268 | 585 | 671 | 0 | 1 | ok |
| `ficha` | Cadastro de Peludinhos | 1321 | 9908 | 8973 | 0 | 42 | ok |
| `checkin` | Check-in | 1264 | 414 | 376 | 0 | 0 | ok |
| `checkoutconf` | Check-out com o tutor | 1252 | 569 | 565 | 0 | 0 | ok |
| `recepcao` | Pendências com o tutor | 1549 | 24718 | 37360 | 0 | 0 | ok |
| `cuidadovet` | Cuidado Vet | 1279 | 515 | 489 | 0 | 7 | ok |
| `orcamento` | Orçamento de hospedagem | 1318 | 3089 | 3236 | 0 | 0 | ok |
| `dashdc` | Lançamentos do dia | 1317 | 2054 | 3608 | 0 | 0 | ok |
| `peso` | Peso | 1303 | 298 | 471 | 0 | 0 | ok |
| `alergia` | Pesquisa com a Família Multiespécie | 1254 | 3543 | 5282 | 0 | 0 | ok |
| `vacinas` | Prevenção | 1397 | 15024 | 10537 | 0 | 0 | ok |
| `emporio` | Quem não comeu hoje | 1289 | 2698 | 3897 | 0 | 1 | ok |
| `reposicao` | Reposições 41 | 1299 | 5094 | 4134 | 0 | 0 | ok |
| `renovacao` | Renovação de planos | 1314 | 4650 | 3811 | 0 | 0 | ok |
| `lancar-pagamento` | Lançar pagamento | 1270 | 545 | 423 | 0 | 0 | ok |
| `config` | Configurações | 1329 | 14562 | 11049 | 0 | 6 | ok |
| `planodia` | Escala e plano do dia | 1266 | 772 | 1006 | 0 | 0 | ok |
| `acerto` | Financeiro do plantão | 1280 | 4016 | 4053 | 0 | 0 | ok |
| `pessoas` | Time | 1287 | 1104 | 1676 | 0 | 0 | ok |
| `agenda` | Agenda em breve | 1279 | 59 | 339 | 0 | 0 | ok |
| `relatorios` | Relatórios | 1332 | 2243 | 1870 | 0 | 1 | ok |
| `turminha:seg` | Segunda 44 | 1478 | 5016 | 3782 | 0 | 0 | ok |
| `turminha:ter` | Terça 44 | 1443 | 5071 | 3732 | 0 | 7 | ok |
| `turminha:qua` | Quarta 45 | 1376 | 5184 | 3795 | 0 | 1 | ok |
| `turminha:qui` | Quinta · hoje 43 | 1389 | 5514 | 3811 | 0 | 0 | ok |
| `turminha:sex` | Sexta 51 | 1471 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:agility` | Agility Funcional | 1405 | 356 | 425 | 0 | 0 | ok |
| `atividade:almoco` | Almoço | 1411 | 7482 | 5436 | 0 | 1 | ok |
| `atividade:almoco2` | 2º Horário de Almoço | 1419 | 460 | 480 | 0 | 0 | ok |
| `atividade:livre` | Atividade livre | 1432 | 2437 | 3349 | 0 | 0 | ok |
| `atividade:aucademia` | Aucademia | 1381 | 332 | 425 | 0 | 0 | ok |
| `atividade:aulinha` | Aulinha de Disciplina | 1421 | 368 | 425 | 0 | 0 | ok |
| `atividade:chamada` | Chamada | 1413 | 5774 | 4121 | 0 | 0 | ok |
| `atividade:checkin-corpo` | Check-in do corpo | 1604 | 4683 | 3821 | 0 | 2 | ok |
| `atividade:checkin-pert` | Check-in dos pertences | 1475 | 1389 | 1587 | 0 | 0 | ok |
| `atividade:checkout-corpo` | Check-out do corpinho | 1465 | 3981 | 3630 | 0 | 1 | ok |
| `atividade:checkout-pert` | Check-out dos pertences | 1439 | 1326 | 1570 | 0 | 0 | ok |
| `atividade:ea` | Enriquecimento Ambiental (EA) | 1473 | 2456 | 1477 | 0 | 1 | ok |
| `atividade:escova` | Escova de Dentes | 1418 | 353 | 425 | 0 | 0 | ok |
| `atividade:foto` | Foto do peludinho | 1739 | 4151 | 4559 | 0 | 0 | ok |
| `atividade:jogos` | Jogos Cognitivos | 1410 | 353 | 425 | 0 | 1 | ok |
| `atividade:massagem` | Massagem Dessensibilizadora | 1377 | 386 | 425 | 0 | 0 | ok |
| `atividade:musicoterapia` | Musicoterapia | 1436 | 2431 | 3349 | 0 | 1 | ok |
| `atividade:peso` | Peso do peludinho | 1449 | 3579 | 3262 | 0 | 0 | ok |

