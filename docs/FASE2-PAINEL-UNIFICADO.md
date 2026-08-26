# Fase 2 — Painel unificado (proposta para aprovação)

> 25/ago/2026 · Orion (AIOX Master) · para a Adriana aprovar ANTES de qualquer código.
> Base: respostas da Adriana às 4 perguntas de escopo (25/ago ~04h) + `docs/auditoria-25ago2026/06-mapa-para-o-painel-unificado.md`.

## A frase que manda

> "A ideia é o aplicativo ser uma ferramenta de **feedback**, de algum **controle** e de **aprendizado**.
> O monitor vê onde está falhando e pode consertar a rota." — Adriana

Por isso o Painel tem **quatro fatias**, e a primeira é a do próprio monitor. Não é "os chefes olhando":
é cada pessoa vendo a própria rota, e a chefia vendo o time.

## O que muda para quem usa (versão simples)

Hoje existem duas telas parecidas: **Início** (todo mundo vê) e **Painel** (só Gestão/Diretoria — a Amanda
não vê). Vira **uma tela só, chamada Painel**, que mostra a fatia de quem está logado. Ninguém perde nada
que vê hoje; a Amanda passa a ver o que precisa; o monitor ganha a fatia dele. A tela "Início" deixa de
existir como tela separada (vira a fatia de cada um).

## As quatro fatias

Legenda: **[reuso nº]** = bloco que já existe no app (numeração do mapa 06). **[novo]** = precisa ser
construído. Ordem dentro de cada fatia = ordem na tela (o mais urgente em cima).

### 1 · Monitor / Encãotador / plantonista — "minha rota hoje"

Quem: monitor, plantonista, aprendiz (cada um vê SÓ o seu).

**Decisão da Adriana (26/ago):** o monitor NÃO vê "tempo por etapa" — isso é ferramenta da Gestão para
saber se o protocolo está sendo burlado. O que o monitor vê é **o que ele tem que fazer**: o horário dele
(entrada, almoço, saída) e as atividades do dia; e onde está falhando no que é dele (protocolo, pontos,
avisos que ficaram com ele).

| Card | O que mostra | Origem |
|---|---|---|
| Meu dia | entrada · almoço · saída de HOJE, e as atividades do dia na ordem, com horário | [novo E] escala por monitor + plano do dia (ver "Planos 1, 2, 3") |
| Plano de hoje | "Plano 2 — a Wandela está de folga": qual plano vale hoje e o que muda para mim | [novo E] |
| Meu protocolo hoje | check-ins do corpo que eu fiz / que faltam no meu turno, passos cumpridos | [novo A] recorte por pessoa de `porPessoa` (`renderPainelDia`) + `protoStatus()` |
| Meus pontos do check-out | total no mês, bolsas perfeitas, onde perdi ponto | [reuso 13] `coMeusPontos()` — o único bloco pessoal que já existe; é o molde |
| Avisos que ficaram comigo | aviso ao grupo/vet/tutor que eu marquei e NÃO saiu (ok:false), com botão reenviar | [novo B] `daycare/avisos-*` filtrado por `quem` |

Sem tempo por etapa, sem nomes de outras pessoas, sem dinheiro, sem ranking público.

#### Planos 1, 2, 3 — o dia "normal" e os dias em que alguém faltou (requisito novo, 26/ago)

Adriana: "cada monitor tem horário de entrada, almoço e saída e as atividades do dia. Temos que ter
planos modificados: plano 1, 2 ou 3 (alguém faltou, alguém de férias)." Hoje isso não existe no app —
é dado novo, não tela nova:

- `daycare/config/escala/{monitor}` — entrada, almoço, saída (padrão).
- `daycare/config/planos/{plano}` — nome ("Plano 1 — completo", "Plano 2 — um a menos", "Plano 3 —
  férias"), e para cada monitor a lista de atividades com horário.
- `daycare/plano-do-dia/{dia}` — qual plano vale hoje + motivo + quem definiu (Gestão/Supervisão).

**Respostas da Adriana (26/ago):** o plano é **por monitor** ("estamos construindo isso"): Octávio = monitoria,
guardar os pertences, 2º horário de almoço; Wandela = check-in de corpo e pertences, check-in de hóspedes.
**Quem define o plano do dia é sempre a Márcia.** Cada monitor vê só a fatia dele.

### 2 · Supervisão (Amanda) — "a Recepção e a conversa com o tutor"

| Card | Origem |
|---|---|
| Fila do dia: check-in pendente / hóspede sem ficha / check-out de hoje | [reuso 1, 4] |
| Resolver com o tutor: faltou algo, ração, remédio (avisos de estoque/ração, itens não conferidos) | [reuso 15, 5] |
| Quem não comeu hoje + status do grupo do Telegram + mensagem pronta | [reuso 2, 3] (`empLista`, `empStatusGrupo`) |
| Medicação do dia: o que precisa × o que foi dado, atrasadas | [reuso 19] `dosesMedDoDia()` — hoje só lista atrasadas; vira "resumo do dia" |
| Ocorrências e alertas do relatório de plantão (o que aconteceu com o FILHOt) | [reuso 20, 5] |
| Prevenção: quem deve vacina / vermífugo / coleira / exame / peso | [reuso 6] |
| Alergia a confirmar | [reuso 7] |
| Cadastro incompleto (ficha do tutor e do FILHOt) | [reuso 4 — `cadastroFaltando`] |
| Renovação de planos e carteira | [reuso 9] |
| Acerto do cliente, **na ficha de cada FILHOt**: "Fofucho — acertar plano R$ 5.000,00" — valor isolado, sem soma nem cálculo | [reuso 9 — ficha/carteira] — **decisão 26/ago: a Supervisão de loja cobra o cliente, então vê o valor, mas só isolado na ficha** |
| Orçamento de hospedagem | [reuso 18] |

### 3 · Gestão (Márcia) — "o Day Care, a Auaulândia e o time"

Tudo da Supervisão **mais**:

| Card | Origem |
|---|---|
| O que aconteceu com os FILHOts hoje (ocorrências, EA, atividades, histórico do EA) | [reuso 8, 20] |
| Quem fez o quê / tempo por etapa por pessoa (visão do dia) | [reuso 14] `renderPainelDia()` |
| Ritmo do Time (agregado) | [reuso 11] |
| Bolsa do check-out — pontos do mês, todos os monitores | [reuso 12] |
| Acerto das plantonistas **com R$** — quem dobrou, quantas noites, valor por pessoa, soma do mês, quanto pagamos | [reuso 10] completo — **decisão 26/ago (corrigida): a Márcia paga as plantonistas; a Adriana só confere** |
| Entrou e saiu no mês | [reuso 16] `movimentoDoMes()` — já existe, só muda de lugar |
| **Evolução de cada colaborador** — série semana a semana: protocolo cumprido, tempo por etapa, pontos, avisos não enviados | [novo C] `evolucaoPorColaborador()` sobre `daycare/auditoria`, `daycare/pontos-checkout`, `daycare/tempo-atividade`, agrupados por semana ISO |
| Dashboard Day Care | [reuso 17] |

### 4 · Diretoria (Adriana) — tudo

Herda as três fatias (o acerto das plantonistas aparece como **conferência** — mesmos números da Gestão). Único acréscimo: o caderno de auditoria com filtro "gravações que FALHARAM"
(os eventos `gravacao-FALHOU` criados em 25/ago) — para a Adriana ver se o sistema está perdendo alguma
coisa em silêncio. [novo D, baixo esforço: filtro sobre `daycare/auditoria`]

### Monitor no escritório (computador da Adriana e da Márcia)

Não é tela nova: é a fatia Gestão/Diretoria aberta no computador. Sem "modo TV", sem tela pública.

## Regras de construção (o que garante que não quebra)

1. **Integrar, nunca recriar.** Cada card é a função que já existe, chamada de outro lugar. Zero cópia de
   código. Os 3 blocos novos (A, B, C) são funções novas com prova no harness.
2. **Um relógio só.** O Painel usa UMA data (`painelDate`) para todos os cards. As funções que hoje leem
   `selectedDate` (medicação atrasada, alertas do plantão) passam a receber a data como parâmetro.
3. **Permissão em um lugar só.** Cada card entra na tabela `PERM` (Centro de Permissões da Fase 1):
   `painel-monitor`, `painel-supervisao`, `painel-gestao`, `painel-diretoria`, `ver-acerto-plantonistas` (gestao, diretoria — como hoje), `ver-valor-plano-na-ficha` (supervisor, gestao, diretoria).
   Nada de classe `so-*` nova. O harness prova, papel a papel, o que aparece e o que não aparece.
4. **Custo de leitura sob controle (Firebase Spark).** Cards usam os caches que já existem por ouvinte
   (`PELUDINHOS`, `CF_ESTADIAS`, `MED_AGENDA_TODOS`, `AVISOS_ESTOQUE_CACHE`…). Os blocos pesados
   (Ritmo, quem-fez-o-quê, medicação atrasada, alertas do plantão) carregam **uma vez por abertura** e
   são compartilhados entre as fatias — nunca cada fatia recarrega do zero. O harness conta as leituras.
5. **Atualização automática que não engana.** O auto-refresh de 30 s passa a olhar "o Painel está
   visível?", não "a seção antiga está visível?".
6. **Lacuna que precisa de dado novo, não de tela:** "check-in atribuído a um monitor" não existe no
   banco (esforço alto). Fica fora desta fase; entra na fatia do Monitor quando houver campo "quem está
   de plantão para isto".

## Entrega em quatro passos (cada um publicável e testado sozinho)

| Passo | O quê | Risco | Prova |
|---|---|---|---|
| 2.1 | Fatia **Monitor** (cards 1–4; o 5 vem no 2.3) | baixo — só leitura, nada grava | harness: monitor vê só o seu; plantonista idem; não vê dinheiro nem outros nomes |
| 2.2 | Fatia **Supervisão** + fusão Início/Painel numa tela | médio — mexe no menu | harness: Amanda vê os 11 cards, não vê valor do acerto; gestao/diretoria continuam vendo tudo que viam |
| 2.3 | **Evolução por colaborador** (função C) — na Gestão e no card "Minha semana" do Monitor | médio — função nova sobre 3 nós | harness com dado real: série de 4 semanas para 1 pessoa bate com a soma manual |
| 2.4 | Fatia **Gestão** completa + filtro de auditoria da Diretoria + relógio único | médio | harness: 1 relógio, contagem de leituras por abertura ≤ hoje |

Recomendação: começar pelo 2.1 — é a tese da Adriana em forma de tela, é o menor risco, e é o que o
time sente primeiro.

## Aprovado pela Adriana em 26/ago ("pode ir na sequência")

Ordem 2.1 → 2.4 mantida. Próximo artefato: **esboço visual** das 4 fatias na cara do app, antes de código.
O card "Meu dia"/"Plano de hoje" espera as duas perguntas dos Planos 1, 2, 3.

## O que foi perguntado (histórico)

1. As quatro fatias estão certas? Algum card sobrando ou faltando?
2. Confirma que o **valor em R$ do acerto** continua fora da Supervisão?
3. Confirma a ordem 2.1 → 2.2 → 2.3 → 2.4? (Se preferir ver a Amanda primeiro, inverto 2.1 e 2.2.)
4. Depois do OK: eu trago um **esboço visual** (na mesma cara do app, sem código novo de estilo) antes
   de o agente escrever a tela.
