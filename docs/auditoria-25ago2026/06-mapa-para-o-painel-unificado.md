# Mapa para o Painel Unificado — AuAulândia (`index.html`)

> 25/ago/2026 · Auditoria somente leitura, sem alterar o app nem os testes.
> O `index.html` real estava sendo editado por outro agente ao mesmo tempo desta leitura;
> os números de linha abaixo refletem o instantâneo lido nesta sessão e podem se deslocar
> algumas linhas para cima ou para baixo em relação à versão publicada mais recente — os
> nomes de função e de nó do banco, esses, não mudam de uma hora para outra.
> Base: `05-mapa-do-dado-e-estado-global.md` (mapa dos nós) e `PROPOSTA-ARQUITETURA-SAAS.html`
> (seção "Andar de cima — o que a equipe VÊ").

**Objetivo:** preparar a Fase 2 do plano (o Painel unificado, ver `PROPOSTA-ARQUITETURA-SAAS.html`)
mapeando o que já existe hoje em duas telas separadas ("Início" e "Painel"), o que dá para
reaproveitar sem recriar, e o que falta de verdade.

**Correção de escopo (recebida durante esta auditoria):** a *evolução de cada colaborador ao
longo do tempo* — série histórica de protocolo cumprido, tempo por etapa, pontos, avisos não
enviados, semana a semana — pertence à fatia **Gestão (Márcia)**, não só à Diretoria. A
Diretoria (Adriana) vê tudo por herança. O item 4 já reflete essa correção.

---

## 1. As duas telas de hoje, lado a lado

### 1.1 "Início" — `v-inicio` (L1822-1888)

A tela que abre para todo mundo (`class="view active"`). Não tem nota de papel (`role-note`) —
é a tela padrão de qualquer login.

| Bloco | Função que monta | Nós do banco (ou cache em memória) | Quem vê hoje |
|---|---|---|---|
| **O que precisa de você** (`#pendGrid`) | `renderPendencias()` L4018, que chama `contarPendencias()` L3951 (a MESMA conta usada nos badges vermelhos do menu, via `atualizarPendenciasNav()` L3974) | `CF_ESTADIAS` (mem), `MED_AGENDA_TODOS` (mem), `AVISOS_ESTOQUE_CACHE`/`AVISOS_RACAO_CACHE` (mem, ouvintes), `empLista()` (deriva de `daycare/almoco` em cache), `repSaldo()` sobre `PELUDINHOS`/`REPO_CACHE` | **Todos** — nenhuma classe `so-*` no `#pendGrid` em si; o conteúdo é o mesmo para quem quer que abra a tela |
| Aniversariantes (`#anivCard`) / Adaptação (`#adaptPendCard`) | (fora do escopo desta leitura) | — | Todos (aparece todo dia, inclusive fim de semana — nota no HTML, Adriana 20/ago) |
| **A casa** (KPIs: Peludinhos / Day Care / AuAulândia / Adaptação) | `renderKPIs()` L3880 | contadores sobre `PELUDINHOS`/`hospedes` (mem) | Todos |
| **Carteira de planos** (`#cardCarteira`) | `renderCarteira()` L4703 | `carteiraResumo()` sobre `PELUDINHOS` (mem) | `.so-carteira` → `consultora`, `gestao`, `supervisor`, `diretoria` |
| **Entrou e saiu no mês** (`#cardMovimento`) | `renderMovimento()` L4660, `movMes()` L4617 | `movimentoDoMes()` sobre `PELUDINHOS` (mem, campos de saída/pausa/óbito do cadastro) | `.so-carteira` → mesmos 4 papéis acima |

### 1.2 "Painel" — `v-painel` (L3379-3420)

Tela de leitura ("só observa: não altera nada" — texto do próprio `role-note`).

| Bloco | Função que monta | Nós do banco | Quem vê hoje |
|---|---|---|---|
| Nota do topo (`role-note`) | — (texto estático) | — | classe `.so-gestao` no texto (mas ver discrepância abaixo) |
| Navegação de data + botão "⚙ Horários esperados" | `painelMuda()`/`painelHoje()` L18587-18588, `abrirAuditCfg()` L19040 | `daycare/config/auditoria` (config das janelas) | O item do menu que leva à tela inteira é `.so-master`; o botão de config é `.so-master` de novo |
| `#painelCfg` (editor de horários esperados) | `abrirAuditCfg()`/`setAuditCfg()` | `daycare/config/auditoria` | `.so-master` |
| **`#painelWrap`** — o corpo do Painel: placar do dia, quem não comeu/comeu metade, urgente a resolver, plantão agora, banco de tempo do almoço, cumprimento dos protocolos, o que cada pessoa fez hoje, linha do tempo | `carregarPainel()` L18589 (13 leituras `once` por dia) → `renderPainelDia()` L18947, que chama `relAlmocoHTML()` L18877, `cardUrgenciasHTML()` L18933, `protoStatus()` L18893 | `daycare/chamada`, `daycare/avulsos`, `daycare/almoco`, `daycare/almoco-turno`, `daycare/almoco-prep(+turno)`, `daycare/almoco-final(+turno)`, `daycare/almoco-exec`, `daycare/atividade`, `daycare/banho`, `daycare/auditoria`, `auaulandia/checkout` — todos do dia selecionado | **Sem `so-*` dentro do `#painelWrap`** — quem consegue abrir a tela (hoje: gestão/diretoria/supervisor, via o item do menu `.so-master`) vê tudo dentro dela, inclusive "o que cada pessoa fez hoje" nome a nome |
| **Tempo das atividades** (`#monEquipeWrap`) | `carregarEquipe()` L18638 | `daycare/almoco-prep-turno`, `daycare/almoco-turno`, `daycare/almoco-final-turno`, `daycare/almoco`, `daycare/auditoria` × período (7/30/90 dias, `once` por dia) | `.so-master` |
| **Plantão AuAulândia** (`#monPlantaoWrap`) | (montagem a partir de `monAud`/`ACERTO_QUEM`, fora do escopo desta leitura) | idem acima + dados de plantão | `.so-master` |

### 1.3 O que está duplicado entre as duas telas

- **Duas telas com nome e função parecidos.** "Início" responde "o que precisa de ação agora"
  (fila operacional: check-in faltando, conferência, faltas, avisar tutor, reposição). "Painel"
  responde "como o dia transcorreu" (score de protocolo, quem fez o quê). Não competem pelo
  mesmo dado, mas competem pelo mesmo conceito — é exatamente o ponto 1 da proposta SaaS
  ("dois painéis competindo").
- **"Quem não comeu" é calculado 3 vezes, por 3 caminhos diferentes**, sem nenhum compartilhar
  função: `relAlmocoHTML()` (dentro do Painel, olha `daycare/almoco` do dia), `empLista()`
  (Empório/pendGrid, olha o mesmo `daycare/almoco` mas via cache `window.__empAlm1/2` e ainda
  cruza com o 2º horário) e `carregarRiscoNaoComer()` L7528 (badge vermelho no card do hóspede,
  olha `auaulandia/relatorios/{fichaKeyDe}` — uma fonte totalmente diferente, o relatório de
  plantão, não a grade de almoço). As três podem, em tese, discordar sobre o mesmo FILHOt no
  mesmo dia.
- **"Medicação atrasada" não aparece em nenhuma das duas.** Existe uma terceira tela —
  `#painelMedAtrasada` dentro de `v-hospedagem` — com seu próprio gate JS (`gestao`,
  `supervisor`, `diretoria`) e sua própria leitura (`carregarMedAtrasadaGestora()` L6762). É
  informação "do dia" que devia estar num painel unificado, mas mora numa terceira tela.
- **Regra de acesso escrita de dois jeitos na mesma tela.** O `role-note` de `v-painel` diz
  `.so-gestao` no texto, mas o item do menu (`data-v="painel"`) e a maior parte dos cards são
  `.so-master`. Hoje isso não engana ninguém porque `.so-master` já foi corrigido (19/ago) para
  incluir a Supervisão — mas é o retrato exato do ponto 3 da proposta SaaS ("as regras de quem
  pode o quê estão escritas em 30 lugares diferentes").

---

## 2. Inventário de blocos existentes reaproveitáveis

Legenda de papel: **Mon** = Monitor · **Sup** = Supervisão (Amanda) · **Ges** = Gestão (Márcia)
· **Dir** = Diretoria (Adriana, herda tudo).

| # | Bloco | Função que renderiza | Nós do banco | Papéis que veem hoje | Fatia(s) do novo Painel | Observação |
|---|---|---|---|---|---|---|
| 1 | Pendências do menu (fila operacional) | `contarPendencias()`/`atualizarPendenciasNav()`/`navPend()` L3909-3984 | `CF_ESTADIAS`, `MED_AGENDA_TODOS`, `AVISOS_ESTOQUE_CACHE`, `AVISOS_RACAO_CACHE`, `REPO_CACHE` (todos mem/cache) | Todos (badge do menu) | Sup | Conta ÚNICA já compartilhada entre o badge do menu e o card do Início — pronta para virar o card "Agora" da fatia Supervisão sem recriar nada |
| 2 | Quem não almoçou (Empório) | `empLista()`/`renderEmporio()` L22177+ | `daycare/almoco` (cache `__empAlm1/2`), `daycare/avisos-comida` | Quem acessa `v-emporio` | Sup | Já é tela/card isolado — fácil de mover como card dentro do Painel |
| 3 | "Não comeu" no card do hóspede | `carregarRiscoNaoComer()` L7528, `NAOCOMEU_HOJE` | `auaulandia/relatorios/{fichaKeyDe}` × 3 períodos × N hóspedes (`once`) | Badge no `hospGrid`, sem gate próprio | Sup | Duplica `relAlmocoHTML()` do Painel com fonte diferente — ao integrar, decidir UMA fonte para "quem não comeu" |
| 4 | Check-in pendente / hóspede sem ficha | `hospedesSemCheckin()` L3931 | `CF_ESTADIAS` (mem) | Menu + `pendGrid` | Sup | Função pura, já devolve a LISTA (não só o número) — plugável direto |
| 5 | Ocorrências e fila de aviso ao vet | (ocorrências: `daycare/ocorrencias`, `estadias/{id}/ocorrencias`; fila: `vetFilaGuardar`/`vetFilaTentar`) | `daycare/ocorrencias`, `auaulandia/estadias/{id}/ocorrencias`, `auaulandia/avisos-vet-fila` | `v-recepcao`, `v-cuidadovet` | Sup | Dois nós paralelos (Day Care × hospedagem) — ver mapa 05 §1.5; decidir qual alimenta o card antes de integrar |
| 6 | Prevenção (vacina/vermífugo/coleira/exame/peso) | `renderPrevencao()`/`prevDados()` L12879-12905 | **Nenhum nó próprio** — deriva de `PELUDINHOS`/`pelExtra()` (campos do cadastro) em memória | `v-vacinas` | Sup + Ges | Função pura sem leitura de rede nova — encaixe direto; `cardUrgenciasHTML()` do Painel já usa a mesma base (`prevPendencias`) |
| 7 | Alergia a confirmar | `algCarregar()`/`algRender()` L16879+ | `daycare/alergia-confirmada` (nó inteiro, `once`) | `v-alergia` (`.so-gestao`) | Sup + Ges | Tela própria — extrair só o total "a confirmar" para um card-resumo no Painel |
| 8 | Histórico do EA | `eaHistInit()`/`eaHistRender()` L17033+ | `daycare/ea` (nó inteiro, `once`) | `v-eahist` (`.so-gestao`) | Ges | É calendário de consulta, não card de resumo do dia — manter tela própria, só um atalho no Painel |
| 9 | Renovação de planos / Carteira | `renderRenovacao()` L11289 / `renderCarteira()` L4703 | `PELUDINHOS` (mem, campos de plano/vencimento) | `v-renovacao` (`.so-gestao`) + `#cardCarteira` (`.so-carteira`, já inclui `supervisor`) | Sup | Já parcialmente disponível hoje — a Amanda já enxerga `#cardCarteira` no Início; só falta trazer para dentro do Painel novo |
| 10 | Acerto das plantonistas (valor R$) | `acertoCarregar()`/`renderAcerto()` L9025-9206 | `auaulandia/acerto-plantao`, `auaulandia/config/acerto-plantao`, `auaulandia/config/plantonistas`, `auaulandia/manuais`+`auaulandia/removidos` (via `acertoCarregarPernoites`) | `v-acerto` (`.so-master`) | **Ges apenas** | Único bloco com exclusão EXPLÍCITA da Supervisão por decisão da Adriana ("a Supervisão não precisa, nem deve, ver o que cada plantonista recebe" — comentário no HTML) — não entra na fatia Sup |
| 11 | Ritmo do Time (tempo por atividade, agregado) | `ritmoCarregar()`/`renderRitmo()` L17716-17746 | `daycare/tempo-atividade/{dia}` × 60 dias (`once` × 60) | `v-ritmo` (`.so-gestao`) | Ges | Leitura pesada (60 `once` a cada abertura); o card "quem está fora da média" já é por pessoa — dá para recortar por pessoa/self (ver §3) |
| 12 | Bolsa do check-out — pontos do mês (agregado, todos os monitores) | `ritmoPontosCarregar()` L17678 | `daycare/pontos-checkout/{mes}` (nó do mês inteiro, `once`) | `v-ritmo`, card `.so-gestao` | Ges | Lê o MESMO nó que o item 13 usa individualmente — a Gestão vê todo mundo, o Monitor só vê a si mesmo |
| 13 | **Meus pontos** (individual, autoavaliação) | `coMeusPontos()` L22368 | `daycare/pontos-checkout/{mes}`, filtrado por `quemSou()` | Dentro de `v-checkout`, sem gate de papel (só aparece se `coModo==='monitor'`) | **Mon** | Já é 100% o modelo de card individual — é o que copiar para os outros dados pessoais do Monitor |
| 14 | Quem fez o quê / tempo por etapa por pessoa | `carregarEquipe()` L18638 + `porPessoa` dentro de `renderPainelDia()` L18973-18974 | `daycare/almoco-prep-turno`, `daycare/almoco-turno`, `daycare/almoco-final-turno` × período (`once`), `daycare/auditoria/{dia}` | `v-painel`, `.so-master` | Ges (visão do dia); Mon (recorte pessoal — só existe agregado hoje, ver §3-4) | Leitura pesada: 30 dias × 5 `once` = 150 leituras a cada carregamento, repetida a cada 30s de auto-refresh se a tela estiver aberta no dia de hoje |
| 15 | Avisos de estoque/ração | `renderAvisosEstoque()` L6158 | `auaulandia/avisos-estoque`, `auaulandia/avisos-racao` (via `AVISOS_ESTOQUE_CACHE`/`AVISOS_RACAO_CACHE`, ouvintes já abertos) | `v-recepcao` | Sup | Card já isolado, com "resolvidos" recolhível — fácil reusar, e é leitura GRÁTIS (já vem de ouvinte aberto) |
| 16 | Entrou e saiu no mês | `renderMovimento()`/`movimentoDoMes()` L4660-4703 | `PELUDINHOS` (mem) | `#cardMovimento` em `v-inicio`, `.so-carteira` | Ges | **Já existe e já é card pronto** — só falta aparecer também na fatia Gestão do Painel novo (hoje mora só no Início) |
| 17 | Dashboard Day Care (espelho da planilha) | `dashCarregar()`/`renderDash()` L17978+ | `daycare/config/ponte-planilha`, `daycare/dashboard/{dia}` | `v-dashdc` | Sup + Ges | Tela própria com 13 tipos de item (`DASH_ITENS`) — encaixa como card de "avisos operacionais do dia" |
| 18 | Orçamento de hospedagem | `orcCarregarLista()`/`orcRenderLista()` L8266+ | `auaulandia/orcamentos/{id}`, `auaulandia/config/orcamento/*` | `v-orcamento` | Sup | Não é "resumo do dia" — fica fora do Painel diário; pode ganhar um contador de pendentes no `pendGrid` (ainda não existe) |
| 19 | **Medicação atrasada (Gestora)** | `carregarMedAtrasadaGestora()`/`dosesMedDoDia()` L6746-6773 | `MED_AGENDA_TODOS` (mem) **junto com** `auaulandia/medicacao-log/{dia}` (`once`) | `#painelMedAtrasada` em `v-hospedagem`, gate JS (`gestao`/`supervisor`/`diretoria`) | Sup + Ges | **Achado:** `dosesMedDoDia()` já é a função-junção agenda×log que o mapa 05 (§2.3) diz que falta no app — reaproveitar em vez de recriar, e trazer para dentro do Painel em vez de deixar isolada em `v-hospedagem` |
| 20 | Alertas do relatório de plantão (Gestora) | `carregarPainelGestora()`/`renderPainelGestora` L7516-7521 | `auaulandia/relatorios/{fichaKeyDe}` × 3 períodos × N hóspedes (`once`) | `#painelGestora` em `v-hospedagem`, gate JS (`gestao`/`supervisor`/`diretoria`) | Sup + Ges | Leitura pesada (N hóspedes × 3 `once` a cada troca de dia); já mostra alertas por hóspede (diarreia, vômito, não comeu) — encaixe direto num card do Painel |

**Total inventariado: 20 blocos.**

---

## 3. A fatia do Monitor — o que já existe de feedback pessoal

O único dado hoje filtrado **por pessoa, para a própria pessoa ver**, sem depender de a Gestão
abrir uma tela e procurar o nome dela numa lista, é:

- **`coMeusPontos()`** (item 13 do inventário) — lê `daycare/pontos-checkout/{mes}`, filtra pelo
  nome de quem está logado (`quemSou()`), mostra total de pontos no mês, quantas bolsas saíram
  perfeitas (10/10) e onde perdeu pontos. Aparece dentro da tela de check-out do próprio
  Monitor, sem gate de papel — só depende de `coModo==='monitor'`.

Tudo o mais que poderia virar feedback pessoal **hoje só existe agregado**, numa tela que o
Monitor não acessa:

| Dado | Onde existe hoje (agregado) | O Monitor vê o próprio recorte? |
|---|---|---|
| Gamificação do check-out (pontos) | `ritmoPontosCarregar()` — todos os monitores juntos, em `v-ritmo` (`.so-gestao`) | Sim, mas só via `coMeusPontos()` (item 13) — a ÚNICA exceção |
| Tempo por etapa (Montagem/Almoço/Finalização) | `renderRitmo()` sobre `RITMO_DADOS` — agregado por dia/atividade, `v-ritmo` (`.so-gestao`) | Não — a tela inteira é `.so-gestao`, o Monitor não abre |
| "O que cada pessoa fez hoje" (`porPessoa`) dentro do Painel | `renderPainelDia()` — já quebra por nome (ações, primeira/última hora) | Não — dentro de `#painelWrap`, atrás do gate `.so-master` do menu |
| Protocolo cumprido no dia (score %) | `protoStatus()`/`cumpridos` — é um número ÚNICO do dia inteiro, não por pessoa | Não existe recorte por pessoa nem para a Gestão — é uma média geral |
| Avisos que deixou de mandar (`.catch` vazio) | Nós como `daycare/avisos-telegram-comida/{dia}/{k}` com `ok:false` | Não — nem a Gestão tem uma tela que lista "avisos que falharam", é dado que existe só no banco |
| Check-ins pendentes atribuídos a ele | `hospedesSemCheckin()` — lista geral, sem dono | Não existe atribuição de responsável no modelo de dado |

**Resumo:** hoje existe **1 bloco verdadeiramente pessoal** (pontos do check-out). Tudo o resto
que a fatia Monitor precisaria — protocolo cumprido, tempo por etapa, avisos não enviados —
existe só como número agregado, dentro de telas que o próprio Monitor não pode abrir.

---

## 4. Lacunas

Dados que a Adriana pediu e que **não existem em lugar nenhum hoje**, mais os que existem mas
estão presos na tela errada.

| Lacuna | Existe hoje? | De onde derivar | Esforço | Fatia |
|---|---|---|---|---|
| **Evolução de cada colaborador ao longo do tempo** (série semana a semana de protocolo cumprido, tempo por etapa, pontos, avisos não enviados) | **Não** — os números de hoje são sempre "do dia" ou "do mês", nunca uma série histórica por pessoa | `daycare/auditoria/{dia}` (ação a ação, com quem+hora), `daycare/pontos-checkout/{mes}` (já por mês), `daycare/tempo-atividade/{dia}/{slug}` (já usado em `ritmoCarregar()`, mas agrupado por dia-da-semana, não por semana corrida por pessoa) | **Médio** — os nós já existem; falta uma função nova, por exemplo `evolucaoPorColaborador(nome, semanas)`, que agrupe os 3 nós por semana ISO em vez de por dia/mês soltos | **Gestão** (Márcia vê a evolução do time; Diretoria herda tudo) |
| Avisos que a equipe deixou de mandar, por pessoa | **Não** — o dado `ok:false` existe no banco (`daycare/avisos-telegram-comida/{dia}/{k}` e afins), mas nem sempre grava quem tentou enviar | Mesmos nós de `daycare/avisos-*` — mas primeiro corrigir a gravação para sempre incluir `quem` | **Médio-alto** — exige mudar a escrita antes de conseguir agregar por pessoa | Gestão / Monitor (autoavaliação) |
| Check-in "atribuído a" um monitor específico | **Não** — `hospedesSemCheckin()` é uma lista sem dono; não existe campo de "quem está de plantão para isto" | Não é derivável do que já existe — pede desenho de campo novo | **Alto** | Supervisão |
| Quantos entraram e saíram no mês | **Já existe** — `renderMovimento()`/`movimentoDoMes()` (item 16 do inventário), hoje preso à fatia `.so-carteira` do Início | — (só levar para o Painel) | **Baixo** | Gestão |
| "O que precisa vs. o que foi feito" de medicação, junto | **Já existe a função** (`dosesMedDoDia()`, item 19), mas só é usada para listar as atrasadas | — (reaproveitar a mesma função para um card "resumo do dia") | **Baixo** | Supervisão / Gestão |
| Protocolo cumprido POR pessoa (não só a média do dia inteiro) | **Parcial** — `porPessoa` já existe dentro de `renderPainelDia()`, mas é ação-a-ação (contagem), não um score de "cumpriu o protocolo dela" | Filtrar o mesmo cálculo de `protoStatus()` pelo nome de quem fez cada ação, dentro de `porPessoa` | **Baixo** para expor ao próprio Monitor um recorte do dia; **cai no item da evolução (acima)** para virar série ao longo do tempo | Monitor (self) / Gestão |

---

## 5. Riscos para integrar sem recriar

- **Dois relógios de "que dia estou vendo".** `carregarPainel()` usa a variável global
  `painelDate`; `carregarPainelGestora()`/`carregarMedAtrasadaGestora()` (em `v-hospedagem`)
  usam `selectedDate`, uma variável diferente. Um Painel unificado que junte blocos das duas
  origens na mesma tela precisa decidir UM relógio só — senão a fatia Supervisão e a fatia
  Gestão podem mostrar dias diferentes ao mesmo tempo sem avisar.
- **Auto-refresh que só olha se a tela está visível.** O `setInterval` de 30s (L22653) só chama
  `carregarPainel()` quando `document.getElementById('v-painel')` tem `display!=='none'`. Se o
  Painel unificado virar abas dentro de uma mesma `section` (Monitor/Supervisão/Gestão/Diretoria
  como abas, não telas separadas), uma aba escondida com `display:none` pode enganar esse check
  e parar de atualizar sozinha — quem está na aba errada vê dado congelado sem saber.
- **Custo de leitura ao somar tudo numa tela só.** `carregarEquipe()` sozinha já faz 5 leituras
  `once` × 30 dias = 150 chamadas de rede a cada abertura (e de novo a cada troca de período
  7/30/90); `carregarPainelGestora()`/`carregarMedAtrasadaGestora()` fazem N hóspedes × 3
  leituras a cada troca de dia. Juntar os 20 blocos do inventário na mesma tela sem cache soma
  todos esses custos de uma vez — e a memória de 20/ago já registra que o app roda em Firebase
  **Spark** (plano que desativa ao estourar cota, sem cobrar automaticamente) e que o consumo já
  estava em risco antes desta proposta. Recomendação: reaproveitar os caches que já existem via
  ouvinte (`PELUDINHOS`, `CF_ESTADIAS`, `MED_AGENDA_TODOS`, `AVISOS_ESTOQUE_CACHE` etc. — itens
  1, 4, 6, 15 do inventário são leitura GRÁTIS) antes de abrir novos `once()`, e não deixar cada
  fatia de papel recarregar os blocos pesados (11, 14, 19, 20) do zero de forma independente.
- **Duas classes de permissão convivendo, não uma.** `so-*` (CSS, esconde/mostra bloco) e
  `PERM`/`podePapel()` (JS, libera/bloqueia AÇÃO dentro do bloco) são mecanismos diferentes e já
  documentados como divergentes em outros pontos do app. Ao desenhar as 4 fatias, checar os dois
  níveis por bloco — um card pode aparecer (`so-*` libera) mas o botão dentro dele continuar
  travado (`PERM` nega), ou o contrário.
- **A própria tela do Painel já tem essa divergência hoje.** O `role-note` do topo de `v-painel`
  diz `.so-gestao` no texto, mas o item do menu e a maioria dos cards são `.so-master` — mesmo
  padrão que já causou o bug relatado em 19/ago ("Classe de permissão que mentia"). Copiar esse
  padrão para o Painel novo (nota dizendo uma coisa, classe fazendo outra) herda a mesma
  armadilha.
- **Dado sensível com exclusão explícita não pode "vazar" por proximidade.** O Acerto das
  Plantonistas (valor em R$, item 10) tem exclusão EXPLÍCITA da Supervisão, decidida pela
  Adriana e registrada em comentário no próprio HTML. Ao montar a fatia Supervisão do Painel
  novo, não incluir esse bloco só porque ele hoje mora ao lado de outros blocos `.so-master` que
  a Amanda já pode ver desde o fix de 19/ago — a regra dele é mais estrita que a classe CSS
  sugere.

---

**Resumo:** `06-mapa-para-o-painel-unificado.md` — **20 blocos** inventariados no item 2,
**6 lacunas** mapeadas no item 4 (1 delas já existente só fora de lugar, 1 com função pronta
sem uso), e **3 duplicações concretas** entre "Início" e "Painel" identificadas no item 1.3
(quem-não-comeu calculado 3 vezes, medicação atrasada numa terceira tela, regra de acesso
escrita de dois jeitos na mesma tela).
