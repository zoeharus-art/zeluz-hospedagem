# Auditoria de Gordura de Código — `auaulandia/index.html`

> 28/ago/2026 · repositório `zeluz-hospedagem` · arquivo `auaulandia/index.html` (25.733 linhas)
> Auditoria **somente leitura**: nada foi alterado no arquivo, nada foi commitado.
> Ferramentas: `jscpd` (npx, funcionou — detector de código duplicado por tokens) + análise própria
> em Node.js (tokenizador de JS escrito para esta auditoria, com máscara de string/comentário/regex
> e casamento de chaves, para achar funções, variáveis globais e blocos `catch`).

---

## Sumário em uma frase

O arquivo **não é gordo por cópia-e-cola óbvia** — duplicação literal é baixa (0,81% do JS, 0,78%
do CSS) — a gordura real está em **outro lugar**: 487 blocos `try/catch` que engolem erro em
silêncio (43 deles em cima de gravação), 34 classes CSS mortas, ~34 funções sem nenhuma chamada
direta, e 68 caixas de diálogo nativas do navegador (`confirm`/`prompt`) que travam a tela até
alguém tocar em "OK" — nenhuma dessas quatro coisas aparece num detector de duplicação, porque
nenhuma delas é código repetido.

---

## 1. Código duplicado (`jscpd`, min-tokens 50)

O `npx jscpd` funcionou (é hoje um binário Rust reempacotado sob o mesmo nome — `cpd 5.0.16` — não
o `jscpd` clássico em Node; a sintaxe de flags mudou um pouco, mas o motor de detecção é o mesmo
tipo: comparação de tokens, não de texto cru). Rodado separadamente sobre o JavaScript extraído
(22.075 linhas) e sobre o CSS extraído (1.784 linhas), com `--min-tokens 50`.

| | Linhas totais | Blocos duplicados | Linhas duplicadas | % linhas | Tokens duplicados | % tokens |
|---|---:|---:|---:|---:|---:|---:|
| **JavaScript** | 22.075 | 25 | 179 | **0,81%** | 2.858 | 0,97% |
| **CSS** | 1.784 | 2 | 14 | **0,78%** | 154 | 0,22% |

**Isso é pouco.** Para um arquivo com 1.431 funções, esperava-se mais cópia-e-cola literal. A
explicação: o `jscpd`/`cpd` faz detecção **Tipo-1** (token a token, exige texto idêntico) —
não pega duas funções parecidas com nomes de variável diferentes. O padrão real de repetição deste
arquivo (dezenas de funções `render*`, `*Salvar`, `*HTML` que fazem a mesma coisa com campos
diferentes) é duplicação **estrutural**, que um detector de clones semântico pegaria e este não
pega. Ver seção 8.

### Os 25 blocos duplicados em JavaScript (todos — ordenados do maior para o menor)

| # | Tamanho | Tokens | Primeira ocorrência | Segunda ocorrência |
|---|---:|---:|---|---|
| 1 | 14 linhas | 273 | `auaulandia/index.html:23599-23612` | `auaulandia/index.html:23653-23665` |
| 2 | 14 linhas | 264 | `auaulandia/index.html:23600-23613` | `auaulandia/index.html:23654-23666` |
| 3 | 12 linhas | 160 | `auaulandia/index.html:8590-8601` | `auaulandia/index.html:8643-8651` |
| 4 | 11 linhas | 53 | `auaulandia/index.html:12789-12799` | `auaulandia/index.html:12835-12838` |
| 5 | 10 linhas | 156 | `auaulandia/index.html:5635-5644` | `auaulandia/index.html:14181-14186` |
| 6 | 10 linhas | 144 | `auaulandia/index.html:16044-16053` | `auaulandia/index.html:16112-16121` |
| 7 | 9 linhas | 126 | `auaulandia/index.html:20777-20785` | `auaulandia/index.html:20824-20832` |
| 8 | 9 linhas | 50 | `auaulandia/index.html:10602-10610` | `auaulandia/index.html:10637-10640` |
| 9 | 8 linhas | 194 | `auaulandia/index.html:6184-6191` | `auaulandia/index.html:22577-22584` |
| 10 | 8 linhas | 155 | `auaulandia/index.html:6154-6161` | `auaulandia/index.html:22552-22559` |
| 11 | 8 linhas | 90 | `auaulandia/index.html:12747-12754` | `auaulandia/index.html:23550-23558` |
| 12 | 7 linhas | 95 | `auaulandia/index.html:13803-13809` | `auaulandia/index.html:20778-20784` |
| 13 | 7 linhas | 90 | `auaulandia/index.html:8693-8699` | `auaulandia/index.html:8909-8914` |
| 14 | 7 linhas | 78 | `auaulandia/index.html:10770-10776` | `auaulandia/index.html:15372-15376` |
| 15 | 7 linhas | 76 | `auaulandia/index.html:10784-10790` | `auaulandia/index.html:15379-15385` |
| 16 | 7 linhas | 76 | `auaulandia/index.html:22981-22987` | `auaulandia/index.html:23006-23012` |
| 17 | 7 linhas | 61 | `auaulandia/index.html:12767-12773` | `auaulandia/index.html:23571-23580` |
| 18 | 7 linhas | 54 | `auaulandia/index.html:22790-22796` | `auaulandia/index.html:22829-22836` |
| 19 | 6 linhas | 145 | `auaulandia/index.html:7368-7373` | `auaulandia/index.html:7896` |
| 20 | 6 linhas | 135 | `auaulandia/index.html:12340-12345` | `auaulandia/index.html:24286-24291` |
| 21 | 6 linhas | 97 | `auaulandia/index.html:6489-6494` | `auaulandia/index.html:6773-6778` |
| 22 | 6 linhas | 90 | `auaulandia/index.html:25247-25252` | `auaulandia/index.html:25297-25302` |
| 23 | 6 linhas | 76 | `auaulandia/index.html:12348-12353` | `auaulandia/index.html:24301-24306` |
| 24 | 6 linhas | 68 | `auaulandia/index.html:19097-19102` | `auaulandia/index.html:19159-19164` |
| 25 | 6 linhas | 52 | `auaulandia/index.html:17763-17768` | `auaulandia/index.html:17806-17811` |

Os blocos #1 e #2 são quase o mesmo par de lugares (`23599↔23653` e `23600↔23654`) — é a mesma
duplicação vista com duas janelas de tokens que se sobrepõem, não dois problemas diferentes.
Os blocos #9/#10 e #12 envolvem `auaulandia/index.html:22552-22584`, perto de `checarFaltasDaEstadia`
— mesma área de código repetida em dois pontos do arquivo.

### Os 2 blocos duplicados em CSS

| # | Tamanho | Tokens | Primeira ocorrência | Segunda ocorrência |
|---|---:|---:|---|---|
| 1 | 9 linhas | 70 | `auaulandia/index.html:1691-1699` | `auaulandia/index.html:1704-1712` |
| 2 | 7 linhas | 84 | `auaulandia/index.html:1342-1348` | `auaulandia/index.html:1475-1481` |

---

## 2. Funções nunca chamadas

Metodologia: toda `function nome(` do arquivo (1.431 no total — bate exatamente com o número informado
na tarefa) foi localizada; para cada nome, o arquivo inteiro (HTML + JS, incluindo atributos
`onclick="nome(..."` fora do bloco `<script>`) foi vasculhado por `nome(` fora da própria definição.

**34 funções com zero chamada direta** (`nome(`) em qualquer lugar do arquivo. Divididas em dois grupos:

### 2.1 — Mortas com confiança alta (15) — o nome só aparece na própria definição, nem como referência solta

| Função | Linha | Tamanho |
|---|---:|---:|
| `importarPlanosPlanilha` | `auaulandia/index.html:11550` | 42 linhas |
| `ocorrAvisarTutor` | `auaulandia/index.html:6744` | 11 linhas |
| `carregarEstadoAcordeoes` | `auaulandia/index.html:15100` | 7 linhas |
| `orcFeriadosNoPeriodo` | `auaulandia/index.html:8024` | 5 linhas |
| `prevFeitoEm` | `auaulandia/index.html:13309` | 6 linhas |
| `dataPlausivel` | `auaulandia/index.html:4386` | 4 linhas |
| `ptIrmaoDe` | `auaulandia/index.html:16716` | 4 linhas |
| `setRole` | `auaulandia/index.html:4037` | 1 linha |
| `toggleDia` | `auaulandia/index.html:5781` | 1 linha |
| `txtArea` | `auaulandia/index.html:7537` | 1 linha |
| `temRestricao` | `auaulandia/index.html:11461` | 1 linha |
| `fmtNasc` | `auaulandia/index.html:12948` | 1 linha |
| `ptLinhas` | `auaulandia/index.html:17051` | 1 linha |
| `setDcAba` | `auaulandia/index.html:19381` | 1 linha |
| `trocarPessoaDoTurno` | `auaulandia/index.html:19432` | 1 linha |

Soma: **87 linhas**. Candidatas diretas a remoção — nenhum outro trecho do arquivo as menciona,
nem como chamada, nem como referência de função (`el.onclick = nome`, sem parênteses).

### 2.2 — "Possível" (19) — sem chamada `nome(`, mas o nome aparece solto em outro lugar (referência de callback, ou colisão de nome genérico) — **exige checagem humana**

| Função | Linha | Tamanho | Referências soltas (além da própria definição) |
|---|---:|---:|---:|
| `renderPainelGestora` | `auaulandia/index.html:7939` | 37 linhas | 1 |
| `cancelarHospedeManual` | `auaulandia/index.html:10976` | 30 linhas | 1 |
| `avisoRacaoCardHTML` | `auaulandia/index.html:6764` | 34 linhas | 2 |
| `checarDespertadorMed` | `auaulandia/index.html:12142` | 22 linhas | 2 |
| `avisoCardHTML` | `auaulandia/index.html:6476` | 22 linhas | 2 |
| `onCadGravar` | `auaulandia/index.html:5733` | 19 linhas | 1 |
| `ocorrCardHTML` | `auaulandia/index.html:6681` | 16 linhas | 2 |
| `inatChecar` | `auaulandia/index.html:10522` | 14 linhas | 1 |
| `nomeDaChaveDC` | `auaulandia/index.html:21678` | 11 linhas | 1 |
| `prevLinhaTexto` | `auaulandia/index.html:13785` | 6 linhas | 1 |
| `dashEscolher` | `auaulandia/index.html:20325` | 5 linhas | 1 |
| `iniciarPrep` / `encerrarPrep` / `iniciarFinal` / `encerrarFinal` | `auaulandia/index.html:19805-19811` | 2 linhas cada | 1 cada |
| `_csvLinha` | `auaulandia/index.html:11507` | 1 linha | 1 |
| `ciRefSet` | `auaulandia/index.html:22412` | 1 linha | 1 |
| `move` | `auaulandia/index.html:22855` | 1 linha | 2 |
| `end` | `auaulandia/index.html:22856` | 1 linha | 11 |

`move` e `end` quase certamente são handlers de ponteiro/assinatura (`CO_SIG`, o mesmo bloco de
assinatura em canvas usado no check-out) referenciados por nome como *callback* — ex.:
`el.addEventListener('pointermove', move)` — e não por chamada direta; **não remover sem olhar o
contexto**. As demais têm 1-2 referências soltas cada, o que pode ser: (a) uso real como
callback/valor de propriedade, (b) menção em comentário, ou (c) colisão com uma variável/propriedade
de mesmo nome em outro lugar do arquivo. Soma total do grupo: **228 linhas** — nenhuma dessas deve
ser apagada sem confirmar isso função por função.

---

## 3. As 30 maiores funções

| # | Função | Linhas | Tamanho |
|---|---|---|---:|
| 1 | `abrirPeludinho` | `auaulandia/index.html:14593-14823` | 231 |
| 2 | `__ciGravar` | `auaulandia/index.html:23254-23454` | 201 |
| 3 | `salvarRelatorioCard` | `auaulandia/index.html:7389-7532` | 144 |
| 4 | `renderAcerto` | `auaulandia/index.html:9649-9792` | 144 |
| 5 | `ckFichaHtml` | `auaulandia/index.html:16191-16330` | 140 |
| 6 | `renderEA` | `auaulandia/index.html:17641-17755` | 115 |
| 7 | `renderPrevencao` | `auaulandia/index.html:13451-13564` | 114 |
| 8 | `renderEquipe` | `auaulandia/index.html:21569-21675` | 107 |
| 9 | `ckSalvar` | `auaulandia/index.html:16497-16600` | 104 |
| 10 | `ciSalvar` | `auaulandia/index.html:23081-23180` | 100 |
| 11 | `resumoDiaMontar` | `auaulandia/index.html:18777-18875` | 99 |
| 12 | `carregarManuais` | `auaulandia/index.html:10633-10727` | 95 |
| 13 | `removerHospedeCard` | `auaulandia/index.html:11013-11103` | 91 |
| 14 | `renderPlantao` | `auaulandia/index.html:21481-21568` | 88 |
| 15 | `renderPainelDia` | `auaulandia/index.html:21784-21870` | 87 |
| 16 | `algCurHTML` | `auaulandia/index.html:18414-18497` | 84 |
| 17 | `renderNomesAConfirmar` | `auaulandia/index.html:9524-9606` | 83 |
| 18 | `renderEmporio` | `auaulandia/index.html:25234-25316` | 83 |
| 19 | `checarFaltasDaEstadia` | `auaulandia/index.html:23914-23995` | 82 |
| 20 | `orcCalcular` | `auaulandia/index.html:8300-8377` | 78 |
| 21 | `renderAlmoco` | `auaulandia/index.html:21260-21337` | 78 |
| 22 | `renderRelMedConfirm` | `auaulandia/index.html:6837-6913` | 77 |
| 23 | `renderGenerico` | `auaulandia/index.html:19256-19332` | 77 |
| 24 | `orcEnviarPlanilha` | `auaulandia/index.html:8895-8969` | 75 |
| 25 | `renderHosp` | `auaulandia/index.html:5377-5450` | 74 |
| 26 | `fotosConferirHTML` | `auaulandia/index.html:21122-21194` | 73 |
| 27 | `orcSalvarEdicao` | `auaulandia/index.html:8615-8686` | 72 |
| 28 | `medAgendaRowHTML` | `auaulandia/index.html:5958-6028` | 71 |
| 29 | `dashAutoCalcular` | `auaulandia/index.html:20543-20612` | 70 |
| 30 | `acertoQuemPelaAssinatura` | `auaulandia/index.html:9367-9434` | 68 |

Nenhuma delas é "gordura" no sentido de duplicação — são funções de renderização de tela (`render*`,
`*Html`) que montam HTML grande por concatenação de string, o que naturalmente estica. Mas são as
primeiras candidatas a **quebrar em pedaços menores** se o objetivo for manutenibilidade, e são
onde um bug tem mais lugar para se esconder.

---

## 4. Classes CSS definidas e nunca usadas

Comparado: nome de cada classe definida no CSS (799 classes, comentários CSS descontados) contra
o HTML inteiro e o JavaScript inteiro (procurando `class="...nome..."`, `classList.add('nome')`,
`classList.contains`/`toggle`/`remove` e `className`).

**34 classes sem nenhum uso encontrado** (nem HTML nem string de JS):

`.hosp-count` (`:39`) · `.mon-legenda` (`:336`) · `.mon-tot` (`:343`) · `.mon-barra` (`:345`) ·
`.mon-nums` (`:348`) · `.ck-frase` (`:397`) · `.lg-ok` (`:439`) · `.hosp-st` (`:522`) ·
`.racao-info` (`:533`) · `.chip-box` (`:538`) · `.chip-lab` (`:540`) · `.chip-input` (`:541`) ·
`.grid2` (`:626`) · `.tl` (`:657`) · `.tl-item` (`:659`) · `.dot` (`:660`) ·
`.so-supervisor-only` (`:737`) · `.dctab` (`:792`) · `.dc-layout` (`:813`) · `.dc-days` (`:814`) ·
`.dc-day` (`:815`) · `.qt` (`:816`) · `.dc-main` (`:819`) · `.dc-present` (`:821`) ·
`.grp-operacao` (`:850`) · `.pel-saiu` (`:930`) · `.dim` (`:1153`) · `.ck-proto-rod` (`:1224`) ·
`.pet-x` (`:1547`) · `.med-destaque` (`:2494`) · `.mdh` (`:2495`) · `.ci-dias` (`:2502`) ·
`.ci-comida-painel` (`:2517`) · `.ci-comida-tit` (`:2518`)

(linhas relativas ao bloco `<style>` de `auaulandia/index.html` — a maioria entre a linha 18 e a
1714; as 5 últimas, entre 2449 e 2539, no segundo bloco `<style>`.)

**Ressalva honesta:** algumas dessas classes ficam agrupadas na mesma regra que uma classe ainda em
uso (ex.: `.a, .b, .c{...}`) — apagar a regra inteira quebraria as classes vizinhas que sobrevivem.
Cada uma das 34 precisa ser olhada individualmente antes de apagar (é rápido: abrir a linha, ver se
a regra é exclusiva dela ou compartilhada).

---

## 5. Variáveis globais (nível superior do `<script>`)

**395 variáveis** declaradas com `const`/`let`/`var` fora de qualquer função (nível 0 de chaves) —
nenhum nome repetido entre elas. É um número alto para um único arquivo, mas é consistente com o
tamanho do app (é a "memória de tela" inteira do AuAulândia + Day Care num arquivo só).

### As 40 mais referenciadas

| # | Nome | Referências | # | Nome | Referências |
|---:|---|---:|---:|---|---:|
| 1 | `DB` | 605 | 21 | `selectedDate` | 26 |
| 2 | `PELUDINHOS` | 157 | 22 | `MED_AGENDA_ITENS` | 26 |
| 3 | `currentHosp` | 125 | 23 | `PLANT_LIVRO` | 26 |
| 4 | `pelAtual` | 125 | 24 | `ptAtual` | 26 |
| 5 | `ciHosp` | 101 | 25 | `cfHosp` | 23 |
| 6 | `dcAtiv` | 74 | 26 | `FOTOS` | 22 |
| 7 | `hospedes` | 71 | 27 | `ORC_LISTA_CACHE` | 22 |
| 8 | `ckRascunho` | 59 | 28 | `DIA_FULL` | 22 |
| 9 | `vetHosp` | 57 | 29 | `dcDia` | 22 |
| 10 | `ptRascunho` | 57 | 30 | `ACERTO_QUEM` | 20 |
| 11 | `cfEstadia` | 56 | 31 | `planDia` | 20 |
| 12 | `coEstadia` | 53 | 32 | `almTurno` | 20 |
| 13 | `cfConf` | 44 | 33 | `EST_TODAS` | 19 |
| 14 | `CF_ESTADIAS` | 40 | 34 | `AVISOS_ESTOQUE_CACHE` | 18 |
| 15 | `EA_DIA` | 38 | 35 | `ATIVIDADES` | 18 |
| 16 | `TG_CFG` | 37 | 36 | `ciPertSel` | 18 |
| 17 | `pelCadCache` | 36 | 37 | `ciRefs` | 18 |
| 18 | `MONITORES` | 30 | 38 | `AVISOS_RACAO_CACHE` | 16 |
| 19 | `DASH_PONTE` | 29 | 39 | `ORC_SEL` | 16 |
| 20 | `cfEstadiaId` | 28 | 40 | `ALG_RESP` | 16 |

`DB` (a referência ao Firebase) domina com folga — esperado. As 355 variáveis globais fora deste
top 40 têm cauda longa (muitas com 1-5 referências) — não são "gordura" por si só, é o preço de um
app de tela única sem módulos.

---

## 6. Blocos `catch(e){}` vazios

Busca por `catch` cujo corpo é vazio (nenhum código, nem log) — `} catch(e){ }` ou `} catch{ }`.

| Total de `catch` vazios | Sobre `.set(`/`.update(`/`.push(`/`.remove(` (qualquer objeto) | Dos quais claramente `DB.ref(...).{método}` |
|---:|---:|---:|
| **487** | **43** | **10** |

**Como foi medido:** para cada `catch` vazio, o `try` correspondente foi isolado (casamento de
chaves) e verificado se o corpo do `try` chama `.set(`, `.update(`, `.push(` ou `.remove(` — exatamente
os métodos pedidos. **Ressalva honesta:** esses quatro nomes de método não são exclusivos do
Firebase — `.push(` também é `Array.push`, `.remove(` também é `Element.remove()` do DOM, `.set(`
também é `Map`/`Set`. Por isso o número de 43 é uma contagem ampla "parece gravação"; o subconjunto
de 10 exige também `.ref(` no mesmo bloco `try`, o que é sinal quase certo de gravação real no
Firebase engolida em silêncio — essas 10 são as mais perigosas (usuário acha que salvou e não
salvou, sem nenhum aviso):

`auaulandia/index.html:7738` · `:13147` · `:16465` · `:17321` · `:20122` — e mais 5 no mesmo padrão
dentro do intervalo coberto pela busca. As outras 33 do grupo de 43 são majoritariamente
`.forEach(...)`/`.classList.remove(...)`/`.push({...})` em arrays e listas de tela — silenciam erro,
mas não escondem perda de dado gravado.

Os 444 `catch` vazios restantes (487−43) ficam sobre leitura, formatação de tela ou chamadas
auxiliares — ainda são um risco de "erro sumiu sem rastro" (o app não avisa ninguém, não loga em
lugar nenhum), mas não são bloco de gravação perdida.

---

## 7. `confirm(` e `prompt(` nativos

**41 `confirm()`** e **27 `prompt()`** — 68 caixas de diálogo nativas do navegador que travam a UI
até alguém tocar. Lista completa (linha + a primeira parte da frase mostrada):

### `confirm()` (41)

| Linha | Frase (início) |
|---:|---|
| `4526` | "Marcar que ... veio REPOR hoje?" |
| `4622` | "Cancelar esta troca? A vaga volta a ficar livre..." |
| `6098` | "Remover este medicamento da agenda?" |
| `6386` | "Avisar a Recepção que "..." está acabando?" |
| `6757` | "Reabrir esta ocorrência? Ela volta a aparecer..." |
| `7339` | "Você leu TODO o relatório de ...?" |
| `7853` | "Vai para o grupo da Gestão: ... Mandar?" |
| `8627` | "Mudar a reserva de ...?" |
| `8769` | "Apagar de vez o orçamento de ...? Não dá para desfazer." |
| `8796` | "CANCELAR a reserva de ...?" |
| `9612` | (confirmação de aprendizado de plantonista) |
| `9627` | ""..." nunca fez plantão?" |
| `9639` | ""..." passou a fazer plantão?" |
| `10031` | "Tirar o aviso de "..."?" |
| `10249` | "Remover ... do cadastro? (Não apaga histórico...)" |
| `10858` | "⚠ ATENÇÃO — ... é ALÉRGICO(A) / tem RESTRIÇÃO" |
| `10884` | "⚠ ATENÇÃO — ... é ALÉRGICO(A) / tem RESTRIÇÃO" (2ª ocorrência) |
| `11160` | "Trazer ... de volta ao Plantão de hoje?" |
| `11745` | "ATENÇÃO — esta vigência já nasce VENCIDA." |
| `11769` | "ATENÇÃO — você está confirmando uma renovação JÁ VENCIDA." |
| `12304` | "Remover a reavaliação marcada de ...?" |
| `13092` | "Já existe outro(a) "..." cadastrado(a) com..." |
| `14252` | "Registrar o falecimento de ...?" |
| `14300` | "... está inativo. Reativar?" |
| `14311` | "... este é um caso de PAUSA...?" |
| `14433` | "... voltou para o Day Care?" |
| `14997` | "Já existe um(a) ... cadastrado(a) com..." |
| `15482` | "Remover a atividade "..."?" |
| `16816` | "Desfazer este vínculo?" |
| `17146` | "Ainda não foram guardados: ... Salvar assim mesmo?" |
| `17526` | "Refazer o tempo de "..."?" |
| `19503` | "... de hoje JÁ foi registrado às ..." |
| `20203` | "Desligar a ponte com a planilha?" |
| `20734` | "Tirar ... de ...? Sai daqui e sai da planilha..." |
| `22673` | "Excluir "..." do banco de pertences?" |
| `22947` | "⚠️ O check-in de ... ainda NÃO FOI SALVO." |
| `23245` | "Sem o nome de quem recebeu... Cancelar o lançamento?" |
| `23830` | "Dar baixa em ...? Foi embora em: ..." |
| `24003` | "Sem data de saída, ... fica no Plantão todos os dias..." |
| `24010` | "Esta hospedagem está marcada como .... Reabrir?" |
| `24129` | "... ainda não tem ficha no cadastro. Criar a ficha agora...?" |

### `prompt()` (27)

| Linha | Frase (início) |
|---:|---|
| `4527` | "Alguma observação? (opcional)" |
| `4536` | "Estornar este lançamento — por quê?" |
| `4609` | "Recusar a troca de ... para .... Por quê?" |
| `4680` | "Marcar troca — qual FILHOt?" |
| `4691` | "Troca de ... — Para qual dia ele vem?" |
| `4699` | "Por que a troca?" |
| `8632` | "Por que as datas mudaram?" |
| `8634` | "Digite a SUA senha para confirmar." |
| `8799` | "Por que a reserva foi cancelada?" |
| `8801` | "Digite a SUA senha para confirmar o cancelamento." |
| `9616` | "Como se escreve o nome dela, certo?" |
| `10078` | "Dê um nome para este celular" |
| `10283` | "Dê um nome para ESTE aparelho" |
| `12508` | "Suspender "...". Motivo..." |
| `12521` | "Reativar "...". Motivo..." |
| `13796` / `13797` | "Copie daqui:" (duas variantes, com/sem clipboard) |
| `14260` | "Em que dia ... faleceu?" |
| `14275` | "Quer deixar alguma observação?" |
| `14315` | "Inativar ... — por que ele...?" |
| `15023` | "Motivo da exclusão de ... (obrigatório)" |
| `15025` | "CONFIRMAÇÃO FINAL — isso é IRREVERSÍVEL..." |
| `15481` | "Nome da nova atividade:" |
| `19423` | "QUEM ESTA NO TURNO AGORA?" |
| `21012` | "Qual dia da semana?" |
| `22660` | "Editar o nome do item "...":" |
| `23244` | (mensagem dinâmica de confirmação de material) |

Isso não é "gordura" de linhas, mas é gordura de **experiência**: 68 pontos onde o app para tudo e
espera um clique num popup do navegador (sem estilo, sem o Design System Zêluz, sem funcionar bem
em todo navegador mobile) em vez de um modal próprio.

---

## 8. Estimativa honesta de quanto dá para remover sem mudar comportamento

| Item | Linhas | Confiança |
|---|---:|---|
| 15 funções mortas confirmadas (seção 2.1) | 87 | **Alta** — nenhuma referência em lugar nenhum |
| Consolidar os 25 blocos JS + 2 CSS duplicados (179+14 linhas cobertas, descontando o esqueleto da função compartilhada que substituiria cada par) | ~120-150 | **Alta** |
| **Subtotal mínimo — pode remover/refatorar com confiança, sem decisão humana caso a caso** | **≈ 200-240** | |
| 19 funções "possíveis" (seção 2.2), se cada uma for checada e confirmada morta | +228 | **Baixa** — algumas são callback (`move`, `end`), exigem olhar cada uma |
| 34 classes CSS não usadas (regra completa, ~2-4 linhas cada, se não estiver compartilhada com classe viva) | +70-140 | **Média** — exige checar se a regra é exclusiva |
| **Total máximo — se toda checagem humana confirmar remoção** | **≈ 500-600** | |

Isso é **2-2,5% do arquivo** (25.733 linhas) — pouco, mesmo no cenário máximo. Os 487 `catch` vazios
e os 68 `confirm`/`prompt` **não entram nessa conta**: não sobram linhas removendo-os (viram outra
forma de tratar erro / outro tipo de modal, não desaparecem), mas são o risco real do arquivo —
gravação que falha sem avisar ninguém (seção 6) e UX travada por popup nativo (seção 7).

**O que exige decisão humana, sempre:**
- As 19 funções "possíveis" (podem ser callback vivo).
- As 34 classes CSS (podem estar numa regra compartilhada).
- Os 43 `catch` vazios sobre gravação — decidir *o que fazer* quando falhar (avisar? tentar de novo?
  registrar em log?) é decisão de produto, não de faxina de código.
- As 10 gravações Firebase silenciosas — essas, especificamente, valem uma conversa com a Adriana
  antes de qualquer coisa: hoje, se uma delas falhar, ninguém no app fica sabendo.

**O que este relatório não pega:** duplicação estrutural (funções parecidas com nomes diferentes —
o padrão mais comum de "gordura" em um arquivo de 1.431 funções não modularizado). Pegar isso exigiria
um detector de clones Tipo-2/3 (ignora nomes de variável) ou uma varredura manual por família de
função (`render*`, `*Salvar`, `*HTML`) — fora do escopo desta medição.

---

## 9. Onde ficam os dados desta auditoria

- JS extraído (linhas 3656-25730 do arquivo original): `extracted.js` no scratchpad da sessão.
- CSS extraído (linhas 19-1713 e 2450-2538): `extracted.css` no scratchpad da sessão.
- Relatórios brutos do `jscpd`: `jscpd-js-report/jscpd-report.json` e `jscpd-css-report/jscpd-report.json`.
- Script de análise (funções, globais, `catch`, `confirm`/`prompt`, classes CSS): `analyze.js`,
  saída em `analysis-result.json` — todos no scratchpad da sessão, não versionados no repositório.
