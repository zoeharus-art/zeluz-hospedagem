# Regras do Realtime Database — versão 2 (Etapa 4)

> 29/ago/2026 · continuação de `01-seguranca.md` (Etapa 4 do plano da seção 6).
> **Nada foi publicado, nada foi gravado no Firebase, nenhum commit foi feito.** O arquivo
> `database.rules.json` (a versão publicada hoje) não foi tocado. Esta etapa entrega uma
> **proposta**, `database.rules.v2.json`, ao lado da atual, e este documento explica o
> raciocínio, o que foi verificado e o que fica pendente.
>
> **Aviso sobre os números de linha.** O `auaulandia/index.html` está em edição ativa (o
> `git status` mostra alterações não commitadas nele, feitas por outra sessão enquanto esta
> auditoria rodava). Todo número de linha citado aqui foi conferido no instante desta leitura
> (29/ago, à noite) e pode já ter deslocado alguns números quando você ler isto — é normal
> num app que muda todo dia. O que importa e não muda com a rolagem de linha é **o caminho no
> banco e o padrão de escrita** (`set`, `update`, `push`, `remove`, `set(null)`) — foi isso que
> foi verificado.

---

## 1. O que muda, nó por nó

### 1.1 `daycare/auditoria` — o diário vira SÓ CRIA

**Hoje (v1):** qualquer login anônimo apaga o diário de um dia inteiro com um `DELETE
/daycare/auditoria/2026-08-28.json` (achado **D**, Crítico).

**Como o app grava:** sempre com `push()` — nunca `update()`, nunca `remove()`, nunca `set()`
no dia inteiro. Toda gravação vira uma chave nova e aleatória (`audit()`, linha ~21786;
`_audReenviarBolso()`, linha ~21774, para o reenvio do que ficou no bolso do aparelho).

**v2:**
```
daycare/auditoria/$dia            .write: false                (ninguém escreve aqui direto)
daycare/auditoria/$dia/$entryId   .write: auth != null
                                            && !data.exists()   (só se a chave AINDA não existe)
                                            && newData.exists() (não pode ser null)
                                   .validate: tem ts, quem, role, acao — com o tipo certo
```
Resultado: dá para **criar** uma entrada nova (é isso que `push()` sempre faz — a chave é
sempre inédita). Não dá mais para **editar** uma entrada já existente, nem para **apagar**
nada — nem uma entrada, nem o dia inteiro. Fecha o achado D por completo, sem afetar o app:
nenhuma linha do código escreve de outro jeito.

### 1.2 `auaulandia/medicacao-log` — o registro do que já foi dado vira intocável

**Hoje (v1):** `DELETE /auaulandia/medicacao-log/{dia}.json` apaga a prova de que um remédio
foi administrado (achado **P**, Alto — "numa disputa com o tutor, a Zêluz não tem o que
mostrar").

**Como o app grava:** só `set()` de uma dose nova (`registrarDoseAgendadaGlobal`,
`registrarDoseAvulsa`) ou `update()` para gravar as "doses espelho" quando o mesmo remédio
está em mais de uma ficha do mesmo FILHOt. **Não existe nenhum `remove()` neste ramo em todo o
arquivo** — conferido com `grep -n "medicacao-log" auaulandia/index.html` (7 ocorrências, todas
leitura/gravação, nenhuma remoção).

**v2 (redação original, 28/ago):** `newData.exists()` nos três níveis (`$dia`, `$key`,
`$doseId`) — apagar deixa de ser possível em qualquer nível — mais `.validate` no nível da
dose exigindo `nome`, `u` (a medida/unidade), `ts`, `quem` e `horario`, cada um com o tipo
certo (texto ou número). Como o app **sempre** grava esses cinco campos (ver
`registrarDoseAgendadaGlobal`, `registrarDoseAvulsa` e o comentário de formato na linha ~5987
do arquivo), nenhuma gravação legítima é bloqueada.

**Correção de 29/ago (rodando o teste de verdade — ver seção 3, "Problema 2"):** o desenho de
cima tinha um furo que só apareceu executando a regra, não lendo ela. `.write` cascateia no
Realtime Database — um ancestral que autoriza a escrita autoriza mesmo que o nível mais fundo
negue. Com `newData.exists()` no `$dia` e no `$key`, apagar **uma dose isolada** passava toda
vez que sobrava outra dose no mesmo FILHOt/dia (o `$key` "ainda existia" depois da remoção, o
ancestral autorizava, e a negativa do `$doseId` não valia nada). **v2, como ficou:** só o
`$doseId` tem `.write` (continua exigindo `newData.exists()` — não apaga); `$dia` e `$key`
ficaram sem `.write` própria nenhuma, então apagar o dia inteiro ou o FILHOt inteiro num
comando direto continua negado — agora pelo motivo certo (nenhum nível do caminho concede
escrita), não por "ainda ter sobrado algo por acaso".

### 1.3 `auaulandia/medicacao-agenda` — protegido só até onde o app precisa

**Aqui está a descoberta importante desta etapa.** A auditoria de 28/ago pediu para travar
"os nós de doses/medicação" com `newData.exists()` no `$item`. Ao ler o código de verdade,
achei uma função do próprio app, deliberada e comentada, que **depende de apagar item por
item**:

> `magRemoverItem()` (linha ~6169): *"Remoção EXPLÍCITA, item a item (Fundação 1 —
> anti-Hulk). Como o 'Salvar agenda' nunca mais sobrescreve o nó inteiro, apagar um remédio
> precisa deletar SÓ aquele item no banco."* — faz `DB.ref('auaulandia/medicacao-agenda/'+key
> +'/itens/'+id).remove()`.

Se eu travasse `newData.exists()` no nível de `itens/$id` como o pedido original sugeria,
**a Vet/Gestão/Supervisão perderiam a capacidade de remover um remédio da agenda** — a mesma
proteção "anti-Hulk" que o app foi desenhado para ter. Achei também um segundo caso: a
Conferência do check-in **zera a agenda inteira de propósito** quando o tutor marca "sem
medicação" — `DB.ref('auaulandia/medicacao-agenda/'+key+'/itens').set(P.temMed?meds:null)`
(linha ~23803) — um `set(null)` legítimo no nó `itens` inteiro.

**Decisão tomada (documentando para a Adriana, não perguntando — mas registrando o porquê):**
a regra **recua** no nível `itens/$id` — continua exatamente como na v1 (`auth != null`, sem
`newData.exists()`), porque travar isso quebraria um recurso que a Zêluz pediu e já usa todo
dia. Em vez disso, a proteção entra um nível **acima**, no `$key` (a ficha do FILHOt inteira):

```
auaulandia/medicacao-agenda/$key             .write: auth != null && newData.exists()
                                              .validate: precisa ser um objeto (não um número solto)
auaulandia/medicacao-agenda/$key/itens       .write: auth != null   (ver "RESOLVIDO" abaixo)
auaulandia/medicacao-agenda/$key/itens/$id   .write: auth != null   (IGUAL à v1 — sem mudança)
```

Isso fecha a metade grave do achado: **ninguém mais apaga a ficha de medicação inteira de um
FILHOt com um `PUT` de lixo** (`{"x":1}` por cima do nó `$key`). Continua sendo possível
apagar um remédio específico da agenda — porque é para isso que o botão existe.

**Ressalva registrada aqui em 28/ago, RESOLVIDA em 29/ago (rodando o teste de verdade no
emulador) — ver seção 3, "Problema 2".** O raciocínio original: a escrita do `set(null)`
acontece no nó `itens`, que é filho de `$key`; como `itens` não tinha regra própria, o
Firebase usava a regra do ancestral `$key` — e ali o que se avaliava era se **o `$key`
inteiro** ainda existia depois da escrita, não se `itens` existia. Como a ficha quase sempre
tem outros campos (`nome`, `tutor`, `_ts`, `_quem`), o `$key` normalmente continua existindo
e a escrita passa — mas **numa ficha cujo único campo gravado fosse justamente `itens`**, o
`$key` ficaria vazio e a v2 bloquearia a gravação por engano. Não foi achado, na leitura do
código, um fluxo em que isso acontecesse — mas a leitura de código não prova a ausência do
caso, só a testagem de verdade prova. **Testado com um caso de teste explícito em
`tests/regras.test.js`** (ficha só com `itens`, sem `nome`/`tutor`, seguida de
`itens.set(null)`): a correção deu ao nó `itens` sua própria regra de escrita
(`auth != null`, igual à v1 — sem depender de o `$key` continuar tendo outro campo), e um
segundo caso de teste confirma que isso não reabre a possibilidade de apagar a ficha inteira
($key) com um comando direto. As 18 provas de `tests/regras.test.js` passam com essa correção
no lugar — ver seção 3.

### 1.4 `daycare/med-dia` e `daycare/conferir-medicacao` — mesmo raciocínio do 1.3

**Achado semelhante ao 1.3:** a tela de pertences grava
`DB.ref('daycare/med-dia/'+dia+'/'+k).set(Object.keys(doses).length ? {...} : null)`
(linha ~17516) — um `set(null)` **legítimo e deliberado**: quando não há dose nenhuma para
aquele FILHOt naquele check-in, o app apaga o item de propósito. `daycare/conferir-medicacao`
não tem esse padrão (só `set()` de objeto completo, sem `null` em lugar nenhum — conferido).

**v2:** os dois ganham `newData.exists()` só no nível do **dia** (`$dia`) — ninguém apaga o dia
inteiro com um comando. O nível do item (`$item`) continua como na v1, sem `newData.exists()`,
porque é ali que o `set(null)` legítimo acontece.

### 1.5 As três configurações nomeadas no pedido

**A pergunta central que o pedido já antecipa, respondida com honestidade:** as três
continuam legíveis e graváveis por qualquer login anônimo, porque **o app precisa disso hoje**
— não existe separação de papel no servidor (isso é a Etapa 5, que pede VPS ou Auth por
pessoa). O que dá para fechar sem servidor: apagar e gravar lixo com tipo errado.

| Nó | O app grava (linha ~) | v1 | v2 |
|---|---|---|---|
| `auaulandia/config/acerto-plantao` | `10059`, sempre `{faixas:[...], ajuda:número}` completo | apaga com `PUT`/`DELETE` bobo | `newData.exists()` (não apaga) + `.validate`: precisa ter `faixas` e `ajuda`, e `ajuda` tem que ser número |
| `auaulandia/config/telegram` | `21511`, sempre `{url:texto, senha:texto}` completo (inclusive ao "desligar", grava string vazia — nunca `null`) | apaga com `PUT`/`DELETE` bobo | `newData.exists()` (não apaga) + `.validate`: `url` e `senha` precisam ser texto |
| `daycare/config/monitores` | `10384`, sempre o array inteiro de colaboradores | apaga com `PUT`/`DELETE` bobo; qualquer item pode virar `{"role":"gestao"}` sem nome nem senha | `newData.exists()` (não apaga) + `.validate` por posição do array: cada colaborador precisa ter `nome`, `senha` e `role`, todos texto |

**O que isso NÃO fecha, e é preciso dizer:** um anônimo ainda consegue **sobrescrever** as
três com um conteúdo *plausível* (ex.: trocar a tabela de preço por outra tabela de preço,
trocar a senha de um monitor por outra senha de 4 dígitos válida, ou ainda **esvaziar** o
array de monitores até zero — ver a nota de risco na seção 2). O `.validate` barra o
**absurdo de tipo** (número onde devia ser texto, objeto sem os campos mínimos); não barra um
valor válido mas malicioso. Isso só se fecha sabendo **quem** está escrevendo — Etapa 5.

**Risco novo, pequeno, que a v2 introduz e que a Adriana precisa saber:** se a Gestão remover
o **último** colaborador do cadastro (array fica com zero itens), o `.set([])` que o app faz
vira, na prática, um apagar do nó `monitores` inteiro (o Firebase não guarda array/objeto
vazio) — e a v2 bloqueia isso (`newData.exists()`). **Hoje isso salva sem erro; na v2, dá erro
"permission denied" e nada é salvo.** Cenário raro (a equipe nunca fica com zero pessoas), mas
registrado — se acontecer, o sintoma seria "não consegui salvar Colaboradores" com a lista
vazia.

### 1.6 O que ficou de fora desta etapa (e por quê)

- **`daycare/config/ponte-planilha`** (a senha da ponte do Day Care, achado S6) — o pedido
  nomeou só as três configurações da seção 1.5. Esta continua exatamente como na v1. Fica
  registrado como pendência para uma próxima rodada, junto com a Etapa 6 (trocar a
  palavra-chave).
- **`auaulandia/acerto-plantao/{iso}`** (o acerto **pago** de cada noite — diferente da
  *tabela* de preço da seção 1.5) e **`auaulandia/config/orcamento/{precos,feriados,sheets}`**
  (achado N) — continuam como na v1. O pedido nomeou só `config/acerto-plantao`.
- **O curinga `$colecao`** (achado 12 — nome de coleção novo é sempre aceito, enchimento do
  banco até o plano Spark desativar) — **decisão: não mexer nesta etapa.** O próprio relatório
  de 28/ago avisa que enumerar as coleções quebra silenciosamente qualquer caminho novo que o
  app crie e ninguém lembre de acrescentar à lista (a maioria das gravações termina em
  `.catch(function(){})` vazio — a falha não aparece em lugar nenhum). Fechar isso direito
  pede rodar a lista completa de caminhos contra o emulador primeiro — e o emulador não roda
  nesta máquina agora (seção 3).
- **Separação por papel** (achado 10 — quem já tem o app aberto pode tudo) — não é possível
  sem servidor. É a Etapa 5.

---

## 2. Verificação estática — toda gravação do app, caminho por caminho

Levantamento feito com `grep -noE "DB\.ref\([^)]*\)"` (e equivalente para `firebaseDb.ref`)
em `auaulandia/index.html`, `index.html`, `checkin.html`, seguido da operação
(`set`/`update`/`push`/`remove`/`transaction`) na mesma linha ou nas seguintes — **160
pontos de gravação** no total. Cada um foi confrontado contra a v2.

### 2.1 Toda remoção e todo `set(null)` do app — linha a linha (o que a v2 poderia bloquear)

Esta é a lista completa de gravações "destrutivas" (`remove()` ou um `set()` que pode virar
`null`) encontradas no app. É exatamente o que o pedido descreveu como "cada `remove()` ou
`set(null)` que as regras v2 passariam a bloquear".

| Linha (~) | Caminho | Nó endurecido na v2? | v2 permite esta gravação? | Decisão |
|---|---|---|---|---|
| 6182 | `auaulandia/medicacao-agenda/{key}/itens/{id}` `.remove()` | Sim (`medicacao-agenda`) | **Sim — sem mudança** | Regra recua no `itens/$id` de propósito (seção 1.3) — é `magRemoverItem()`, recurso deliberado |
| 6413 | `.../itens/{itemId}/estoque` `.transaction()` | Sim (mas `itens/$id` sem mudança) | **Sim — sem mudança** | Dentro do `itens/$id`, que ficou como v1 |
| 6641 | `.../itens/{itemId}/estoque/acabando` `.set(null)` | Sim (mas `itens/$id` sem mudança) | **Sim — sem mudança** | Idem — limpa um alerta de estoque, dentro do `itens/$id` |
| 23803 | `auaulandia/medicacao-agenda/{key}/itens` `.set(P.temMed?meds:null)` | Sim (`$key` exige `newData.exists()`) | **Sim, no caso normal** (ver ressalva 1.3) | Testar manualmente antes de publicar (ficha nova + "sem medicação" direto na Conferência) |
| 16813 | `auaulandia/avisos-vet-fila/{id}` `.remove()` | Não | Sim — sem mudança | Fora do escopo desta etapa |
| 8899 | `auaulandia/orcamentos/{id}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 11125, 11227, 11378 | `auaulandia/manuais/{dia}/{manualKey}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 11302 | `auaulandia/removidos/{dia}/{k}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 12444 | `auaulandia/vet-reavaliacao/{key}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 17145 | `daycare/irmaos/{id}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 13290, 19532, 21209, 21672 | `daycare/fotos/{chave}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 21669 | `daycare/foto-confirmada/{ck}/{cf}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 23150 | `auaulandia/pertences-banco/{k}` `.remove()` | Não | Sim — sem mudança | Fora do escopo |
| 25282 | `auaulandia/estadias/{id}/ocorrencias/{id2}` `.remove()` | Não | Sim — sem mudança | Fora do escopo (estadias não foi endurecido) |
| 25540, 25555 | `daycare/cobranca-almoco2/{dia}` `.remove()` (2×, dentro de `.transaction()`) | Não | Sim — sem mudança | Também usado pela ponte do Telegram (leitura) — não hardenizado, sem impacto na ponte |
| 6878/6886 | `auaulandia/estadias/{id}/ocorrencias/{id2}/avisadoTutor` `.set(null)` | Não | Sim — sem mudança | Fora do escopo |
| — | `checkin.html`: `firebaseDb.ref().update({'filhots/{uid}': reg, 'filhots/{antigo}': null})` | Não (`filhots` não tocado) | Sim — sem mudança | Fora do escopo desta etapa; é o achado 15 (médio), já bloqueado hoje por `newData.exists()` no `$colecao` — continua igual |

**Nenhuma gravação destrutiva de fora dos seis nós endurecidos foi tocada.** Dentro dos seis,
só uma (`23803`) tem uma ressalva de baixa probabilidade, já registrada.

### 2.2 As três configurações nomeadas — não são remoção, mas são sobrescrita total

| Linha (~) | Caminho | Formato gravado | v2 valida? |
|---|---|---|---|
| 10059 | `auaulandia/config/acerto-plantao` `.set()` | `{faixas:[{ate,v}], ajuda:número}` | Sim — passa |
| 21511 | `auaulandia/config/telegram` `.set()` | `{url:texto, senha:texto}` (inclusive vazio) | Sim — passa |
| 10384 | `daycare/config/monitores` `.set()` | array de `{id,nome,role,senha,entrada,saida,...}` | Sim — passa, **exceto se o array ficar vazio** (seção 1.5) |

### 2.3 Todo o resto — 144 pontos de gravação, confirmados sem mudança nenhuma

Fora dos caminhos das seções 2.1 e 2.2, **nenhum outro caminho foi tocado nesta etapa** — a
v2 é idêntica à v1 para tudo abaixo. Agrupado por coleção, com contagem de pontos de gravação
(`set`/`update`/`push`) encontrados:

| Coleção (auaulandia) | Pontos de gravação | Coleção (daycare) | Pontos de gravação |
|---|---|---|---|
| `estadias/*` (inclui `conferencia`, `ocorrencias`, `checkout_etapa1`) | 22 | `cadastro/*` | 10 |
| `orcamentos/*` | 9 | `fotos`, `fotos-v` | 5 |
| `config/orcamento/*`, `config/plantonistas` | 6 | `config/*` (fora as 3 nomeadas) | 4 |
| `avisos-racao/*`, `avisos-estoque/*`, `avisos-vet-fila/*`, `avisos-barrados-dispensados/*` | 9 | `trocas/*`, `irmaos/*`, `hospede-mesmo/*` | 6 |
| `medicacao-agenda/{key}` (metadados) e `.../itens/{id}` (fora `.remove`) | 8 | `almoco-cad/*`, `chamada/*`, `checkin-hist/*`, `falta-tardia/*` | 6 |
| `manuais/*` | 2 | `cobranca-almoco2/*`, `avisos-telegram-atraso/*`, `avisos-comida/*` | 5 |
| `vet-consultas`, `vet-observacoes`, `vet-recomendacoes`, `vet-reavaliacao` | 4 | `conferir-medicacao/*` (nó, sem remoção — ver 1.4) | 1 |
| `aparelhos/*` | 2 | `alergia-confirmada/*`, `foto-confirmada/*` | 5 |
| `pertences-banco/*` | 3 | `excluidos`, `prevencao-aviso`, `reposicao/lancamentos`, `aniversario-enviado`, `resumo-gestao` | 5 |
| `cafe-turno/*` (via `turnoTrocar`) | 2 | `almoco-turno`, `almoco-prep-turno`, `almoco-final-turno` (via `turnoTrocar`) | 6 |
| — | — | `tempo-atividade/{slug}` (via `ativTempoNo`) | 3 |
| — | — | `avisos-plantao/{dia}/{tipo}/{chave ou __fechamento}` (via a variável `base`) | 4 |
| — | — | `dashboard-auto/{iso}` (via a variável `noAuto`) | 1 |
| — | — | `pontos-checkout/{mes}` | 1 |

Todos herdam o padrão `$colecao`/`$item` que já valia na v1: `auth != null`, sem exigir
`newData.exists()` no item — **exatamente como hoje.**

### 2.4 Os outros consumidores pedidos explicitamente

| Arquivo | O que faz no banco | Afetado pela v2? |
|---|---|---|
| `index.html` (raiz) | Escreve em `racao` **no nível do ramo** (`firebaseDb.ref('racao').set(...)`, linhas ~999, ~1006, ~1401) | **Não** — e já está bloqueado **hoje**, na v1: o `.write:false` explícito em `/racao` nega a escrita nesse nível exato (o `$colecao` só vale para `racao/{item}`, não para `racao` inteiro). É o achado 14 do relatório de 28/ago, confirmado de novo aqui. A v2 não muda nem piora nem resolve isso — `racao` não foi tocado. |
| `checkin.html` | Lê `filhots` e `racao`; escreve `filhots/{uid}` (e `filhots/{antigo}=null` ao renomear) via `firebaseDb.ref().update(...)` | Não — `filhots` não foi tocado |
| `integracao-telegram/Codigo.gs` | Lê `daycare/atividade/{dia}/almoco2` e `daycare/cobranca-almoco2/{dia}`; escreve `daycare/cobranca-almoco2/{dia}` | Não — nenhum dos dois caminhos foi tocado |
| `tools/carimbar-versao.js` | Escreve `daycare/config/versao-app` | Não — cai no `$outraConfig` de `daycare/config`, sem mudança |
| `tests/harness.js` | **Só leitura** (o próprio cabeçalho do arquivo garante isso — nenhum `PUT`/`POST` de dado, só o de obter o token anônimo) | Não — nenhuma leitura foi restringida na v2 (todos os `.read` continuam `auth != null`, iguais à v1) |

---

## 3. O teste rodou de verdade no emulador — 29/ago/2026

**Atualização de 29/ago/2026 (sessão seguinte).** O plano da Etapa 4 pedia para carregar a v2
no **emulador** do Firebase e rodar `tests/regras.test.js` antes de publicar. Na sessão
anterior isso não foi possível por falta de Java na máquina. Nesta sessão o Java foi instalado
(`Eclipse Adoptium JDK 21`), e o teste **rodou de verdade, contra o emulador de verdade** —
não é mais leitura de regra, é execução de regra.

**Resultado final: 18/18 provas passaram, saída 0.** Mas rodar de verdade expôs **dois
problemas reais** que a verificação estática (seção 2) não conseguia ver — e os dois já foram
corrigidos no `database.rules.v2.json`, com o próprio teste provando a correção:

### Problema 1 — o arquivo de regras, como estava escrito, não carregava no emulador

A v2 documentava cada trecho com chaves JSON fictícias (`"//"`, `"//01"`, ...) cujo *valor*
era uma frase de comentário — válido como JSON puro, mas **não é válido na gramática de regra
do Realtime Database**: toda chave que não começa com `.` é lida como um **caminho filho**, e
um caminho filho só pode valer um **objeto** (outro nó de regra), nunca uma string solta. O
emulador recusava o arquivo inteiro: `database.rules.v2.json:3:11: Expected '{'.` — ou seja,
**o arquivo, do jeito que estava, não seria aceito nem pelo emulador nem, quase certamente,
pelo Console do Firebase na hora de publicar** (a seção 4 abaixo, "Como publicar", contava com
colar o arquivo ali — isso teria falhado).

**Correção:** as notas viraram comentários de verdade (`//` e `/* */`, fora de qualquer
chave/valor — sintaxe que o parser de regras do Firebase aceita nativamente). Conferido nó a
nó, com um script, que a troca não mudou nenhum `.read`/`.write`/`.validate` — só a forma da
documentação.

### Problema 2 — a ressalva da seção 1.3 (e uma segunda igual, achada de brinde)

**A ressalva registrada na seção 1.3** (`set(null)` em `medicacao-agenda/{key}/itens` numa
ficha cujo único campo gravado fosse `itens`) foi testada explicitamente em
`tests/regras.test.js` — e **aconteceu**: sem correção, a prova falhava. **Resolvida:** o nó
`itens` (o pai direto dos itens de remédio, não o item em si) ganhou sua própria regra de
escrita, igual à que já tinha na v1 (`auth != null`, sem depender de o `$key` continuar
existindo). Um segundo caso de teste prova que isso **não reabre** o buraco original —
apagar a ficha inteira ($key) com um comando direto continua negado.

**Um segundo problema, da mesma família, foi achado no `auaulandia/medicacao-log`** — este
não estava registrado como ressalva antes, porque só apareceu rodando o teste de verdade.
O Realtime Database cascateia `.write`: se **qualquer** nível ancestral no caminho autoriza a
escrita, ela é permitida, não importa o que o nível mais fundo diga. Como `$dia` e `$key`
tinham `.write: "auth != null && newData.exists()"`, apagar **uma dose isolada** ($doseId) —
que deveria ser impossível — passava a valer sempre que sobrava **qualquer outra dose** no
mesmo FILHOt/dia: o `$key` "ainda existia" depois da remoção, então a condição do ancestral
dava verdadeiro e a remoção da dose passava por cima da regra do `$doseId`. A prova "anônimo
NÃO apaga uma dose já registrada" falhava exatamente nesse cenário (que é o cenário normal —
a prova 2, logo antes, já tinha gravado outra dose no mesmo FILHOt/dia). **Corrigido:**
`$dia` e `$key` ficaram sem `.write` própria — só o `$doseId` concede escrita, e continua
exigindo `newData.exists()` (não apaga). Sem nenhuma escrita concedida em `$dia`/`$key`,
apagar o dia inteiro ou o FILHOt inteiro num comando direto continua negado — e agora não
depende mais de "ainda ter sobrado algo": nenhum nível do caminho concede a escrita, ponto.
Mais forte que antes, não mais fraco.

### O teste, como ficou

`tests/regras.test.js` usa o pacote oficial `@firebase/rules-unit-testing` (o mesmo caminho
recomendado pela documentação do Firebase para testar regras). As 18 provas, na ordem em que
rodam:

1. Anônimo **não apaga** uma entrada já existente de `daycare/auditoria` (achado D).
2. Anônimo **cria** uma entrada nova em `daycare/auditoria` (nunca existiu antes — é o
   `push()`/`audit()` de verdade).
3. Anônimo **não apaga o dia inteiro** de `daycare/auditoria` (achado D, num comando só).
4. Anônimo **grava** uma dose válida em `auaulandia/medicacao-log`.
5. Anônimo **não grava** uma dose com tipo errado (`ts` como texto em vez de número).
6. Anônimo **não apaga** uma dose já registrada em `auaulandia/medicacao-log` — histórico
   intocável (achado P), decisão da Adriana de 29/ago/2026.
7. Anônimo **não apaga** o histórico de um FILHOt inteiro no dia, em `medicacao-log`.
8. Anônimo **não apaga** o dia inteiro em `medicacao-log`.
9. Anônimo **continua removendo** um item da AGENDA (`magRemoverItem`) — plano atual editável,
   decisão da Adriana de 29/ago/2026.
10. Anônimo **limpa a agenda** (`itens=null`) numa ficha cujo único campo era `itens` —
    **ressalva da seção 1.3, resolvida** (ver Problema 2 acima).
11. Anônimo **continua sem apagar** a ficha de medicação inteira ($key) com um comando direto
    — controle: prova que a correção de cima não reabriu o buraco original.
12. Escrita na **raiz** continua negada.
13. Anônimo **não apaga** `daycare/config/monitores`.
14. Anônimo **não grava** um monitor sem senha (formato incompleto).
15. Anônimo **grava** `daycare/config/monitores` no formato certo.
16. Anônimo **não apaga** o dia inteiro de `daycare/med-dia`.
17. Anônimo **continua zerando** o item de um FILHOt em `daycare/med-dia` (limpeza legítima
    do app, quando não há mais dose a registrar).
18. Anônimo **não apaga** o dia inteiro de `daycare/conferir-medicacao`.

### Como testar (comando exato que funcionou, 29/ago/2026)

Pré-requisitos únicos: Java 11+ (usado aqui: `Eclipse Adoptium JDK 21`, instalado em
`C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`) e o pacote
`@firebase/rules-unit-testing` instalado em **qualquer pasta fora do repo** (não entra no
`package.json` do projeto — o repositório não tem `package.json` na raiz e não precisa ganhar
um só para isto).

```bash
# 1) Java no PATH desta sessão (ajuste o caminho se o JDK estiver noutro lugar)
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"

# 2) instalar o pacote de teste FORA do repositório (aqui, numa pasta de trabalho) e apontar
#    o Node para ele via NODE_PATH — assim `require('@firebase/rules-unit-testing')` resolve
#    sem criar node_modules nem package.json dentro do repo
mkdir -p /caminho/fora/do/repo/regras-teste && cd /caminho/fora/do/repo/regras-teste
npm install --no-save @firebase/rules-unit-testing
export NODE_PATH="/caminho/fora/do/repo/regras-teste/node_modules"

# 3) apontar o emulador para a v2 (NUNCA publicar assim — é só para o teste)
cd /caminho/do/repo/zeluz-hospedagem
#   editar firebase.json: "rules": "database.rules.v2.json" (em vez de database.rules.json)

# 4) rodar o teste dentro do emulador — firebase-tools baixado pelo npx, sem instalar no repo
npx --yes firebase-tools emulators:exec --only database --project hospedagem-zeluz \
  "node tests/regras.test.js"

# 5) devolver firebase.json ao original (database.rules.json) — SEMPRE, mesmo se o teste falhar
```

Saída esperada, resumida: 18 linhas `OK   - ...` e a última linha `Todas as provas passaram.`,
processo saindo com código 0 (`Script exited successfully (code 0)`). Se alguma prova falhar,
sai `FALHOU - ... - <motivo>` e o processo termina com código 1 — mesmo padrão de
`tests/harness.js`.

**Nota sobre a porta:** o emulador do Realtime Database usa a porta `9000` por padrão (não há
seção `emulators` em `firebase.json` fixando outra) — é a mesma porta que
`tests/regras.test.js` já esperava (`host: '127.0.0.1', port: 9000`); não precisou de ajuste.

---

## 4. Como publicar (quando a Adriana decidir)

1. Abrir o [Console do Firebase](https://console.firebase.google.com/) → projeto
   `hospedagem-zeluz` → **Realtime Database** → aba **Regras**.
2. Copiar o conteúdo de `database.rules.v2.json` (o objeto inteiro, incluindo `{"rules": ...}`)
   e colar por cima do que está no editor do Console.
3. O Console valida a sintaxe automaticamente antes de deixar publicar — se houver erro de
   sintaxe, ele avisa ali mesmo, antes de qualquer coisa mudar.
4. Clicar em **Publicar**.
5. **Confirmar na hora, com o app aberto:** salvar uma dose, remover um remédio da agenda
   (`magRemoverItem`), salvar a tabela de acerto e o cadastro de colaboradores. Se algo travar
   com "permission denied", é o sinal de reverter.

## Como reverter

Mesmo caminho — Console → Realtime Database → Regras. **O Firebase guarda o histórico de
versões de regra automaticamente**: dá para escolher a versão publicada antes e restaurá-la em
menos de um minuto, sem precisar copiar o `database.rules.json` de novo. Se preferir pelo
arquivo: colar o conteúdo de `database.rules.json` (o que já está na raiz do repositório, sem
mudança) e publicar por cima.

---

## 5. O que fica pendente para a Etapa 5

- **Separação por papel de verdade** (achado 10) — nada nesta etapa muda o fato de que quem já
  tem o app aberto continua podendo tudo. Só resolve com servidor (Rota A — VPS Kairós,
  preservando a experiência de PIN) ou com Firebase Auth por pessoa (Rota B — mais rápida,
  muda a experiência da equipe). Decisão de rota é da Adriana, como o relatório de 28/ago já
  registrou.
- **`daycare/config/ponte-planilha`** (S6) — mesma proteção da seção 1.5, não incluída aqui
  porque o pedido nomeou só as três outras.
- **`auaulandia/acerto-plantao/{iso}`** e **`auaulandia/config/orcamento/*`** (achado N/O, a
  parte que não é a tabela de preço) — mesma proteção, mesma razão.
- **O curinga `$colecao`** (achado 12) — precisa da lista completa de caminhos rodada contra o
  emulador antes de travar, porque a falha ao esquecer um caminho novo é silenciosa.
- ~~Rodar `tests/regras.test.js` de verdade~~ — **FEITO em 29/ago/2026** (sessão seguinte, com
  Java instalado). 18/18 provas passaram. Achou e corrigiu dois problemas que só apareciam
  executando a regra (ver seção 3) — a ressalva da seção 1.3 está resolvida.

---

*Etapa 4 conduzida em 29/ago/2026, a partir do plano da seção 6 de `01-seguranca.md`
(28/ago/2026). Somente leitura e escrita de arquivo novo: `database.rules.json` não foi
tocado, nada foi publicado no Firebase, nenhum commit foi feito.*

*Continuação em 29/ago/2026 (sessão seguinte): Java instalado, `tests/regras.test.js` rodado
de verdade contra o emulador (18/18 provas, saída 0). Dois problemas achados e corrigidos só
em `database.rules.v2.json` e em `tests/regras.test.js` — ver seção 3. `database.rules.json`
continua intocado, nada foi publicado no Firebase, nenhum commit foi feito nesta continuação.*
