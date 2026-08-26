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

| Card | O que mostra | Origem |
|---|---|---|
| Meus pontos do check-out | total no mês, bolsas perfeitas, onde perdi ponto | [reuso 13] `coMeusPontos()` — o único bloco pessoal que já existe; é o molde |
| Meu protocolo hoje | check-ins do corpo que eu fiz / que faltam no meu turno, passos cumpridos | [novo A] recorte por pessoa do `porPessoa` de `renderPainelDia()` + `protoStatus()` |
| Meu tempo por etapa | montagem / almoço / finalização — o meu tempo de hoje vs. minha média | [novo A] recorte por pessoa de `RITMO_DADOS` (`daycare/tempo-atividade`) |
| Avisos que ficaram comigo | aviso ao grupo/vet/tutor que eu marquei e NÃO saiu (ok:false) com botão reenviar | [novo B] leitura de `daycare/avisos-*` filtrada por `quem` — depende de o registro gravar quem tentou |
| Minha semana | os 4 números acima, semana a semana (últimas 4) | [novo C] `evolucaoPorColaborador(nome, semanas)` — mesma função que serve à Márcia |

Sem nomes de outras pessoas, sem dinheiro, sem ranking público. O feedback é para corrigir a rota, não
para expor.

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
| Acertos — **só a parte sem valor em R$** (quem dobrou, quantas noites) | [reuso 10, recortado] — o valor em R$ continua fora da Supervisão (decisão anterior da Adriana) |
| Orçamento de hospedagem | [reuso 18] |

### 3 · Gestão (Márcia) — "o Day Care, a Auaulândia e o time"

Tudo da Supervisão **mais**:

| Card | Origem |
|---|---|
| O que aconteceu com os FILHOts hoje (ocorrências, EA, atividades, histórico do EA) | [reuso 8, 20] |
| Quem fez o quê / tempo por etapa por pessoa (visão do dia) | [reuso 14] `renderPainelDia()` |
| Ritmo do Time (agregado) | [reuso 11] |
| Bolsa do check-out — pontos do mês, todos os monitores | [reuso 12] |
| Acerto das plantonistas **com valor** | [reuso 10] (`so-master` hoje; passa a `PERM` "ver-acerto-valor": gestao, diretoria) |
| Entrou e saiu no mês | [reuso 16] `movimentoDoMes()` — já existe, só muda de lugar |
| **Evolução de cada colaborador** — série semana a semana: protocolo cumprido, tempo por etapa, pontos, avisos não enviados | [novo C] `evolucaoPorColaborador()` sobre `daycare/auditoria`, `daycare/pontos-checkout`, `daycare/tempo-atividade`, agrupados por semana ISO |
| Dashboard Day Care | [reuso 17] |

### 4 · Diretoria (Adriana) — tudo

Herda as três fatias. Único acréscimo: o caderno de auditoria com filtro "gravações que FALHARAM"
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
   `painel-monitor`, `painel-supervisao`, `painel-gestao`, `painel-diretoria`, `ver-acerto-valor`.
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

## O que preciso da Adriana

1. As quatro fatias estão certas? Algum card sobrando ou faltando?
2. Confirma que o **valor em R$ do acerto** continua fora da Supervisão?
3. Confirma a ordem 2.1 → 2.2 → 2.3 → 2.4? (Se preferir ver a Amanda primeiro, inverto 2.1 e 2.2.)
4. Depois do OK: eu trago um **esboço visual** (na mesma cara do app, sem código novo de estilo) antes
   de o agente escrever a tela.
