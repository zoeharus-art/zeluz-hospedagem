# Índice do app — menu aprovado pela Adriana (reorganizado em 08/set/2026)

> Regra: o app tem de ser autoexplicativo, para treinamento rápido. Cada item tem **Título** e **subtítulo** (a explicação curta que aparece como dica no menu e no índice da Gestão no computador). Nomes são decisão da Adriana.

## O que mudou em 08/set/2026, às 23h30 (v 2026-09-08-07) — e por quê

Adriana, três frases:

> "O Painel do Dia é um dashboard e precisa ir para quem precisa ver." · "Central Zêluz em três partes: Peludinhos, AuAulândia e Day Care." · "Operação: itens em ordem alfabética."

E, meia hora depois, mais duas:

> "Time continua Time... não mexe em nada... tudo de login vai para dentro de Configurações › Logins/Segurança." · "Peso pode manter os 30 dias mesmo, e a Gestão decide que dia irá pesar." · "Em Relatórios tirar essa 'todas as fotos, de quem é cada uma'... as fotos, os monitores tiram e alteram, de acordo com nome, raça e nome do tutor. Precisa aceitar isso... Tem duas Amoras e terão mais ainda."

### 1 · O Painel do Dia foi DISSOLVIDO

A tela era um dashboard escondido atrás de um nome de tela. Cada bloco dela foi para a mesa de quem **age** sobre aquilo:

| Bloco que era do Painel do Dia | Foi para |
|---|---|
| Urgente a resolver (quem saiu, ficha por migrar) | **Dashboard da Márcia** |
| Prevenção vencida — não podem frequentar | **Dashboard da Amanda** |
| Falta pesar — agora com a **data do último peso** e há quantos dias | **Dashboard da Amanda** |
| Plantão agora | **Dashboard da Adriana** |
| Cumprimento dos protocolos | **Dashboard da Adriana E da Márcia** (uma função, dois usos) |
| Tempo das atividades — agora **gráfico de barras** por atividade | **Dashboard da Adriana E da Márcia** (uma função, dois usos) |
| O que cada pessoa fez hoje | **Configurações › Logins e segurança** |
| Linha do tempo do dia | **Operação › Linha do tempo do dia** (tela nova, navegação por mês) |
| Partiram | **removido** — "não tem necessidade de aparecer para ninguém" |
| N doses de medicação sem o nome de quem deu | **removido** — "pode tirar isso" |

O item **Painel do Dia saiu do menu**. A tela `v-painel` continua existindo por link (rota antiga não morre) e guarda o que não cabe num quadro de dashboard: o tempo das atividades **por dia da semana, dia a dia e por pessoa**, e a confiabilidade das plantonistas. Os dois gráficos dos dashboards abrem lá.

A classe `so-master` que o item carregava passou **inteira** para a "Linha do tempo do dia": quem via continua vendo, quem não via continua sem ver.

O editor de **Horários esperados** (a janela de cada protocolo) desceu para **Configurações**. Razão de princípio: dashboard só observa — quem grava é a tela de ajuste.

E o **relógio de 30 s** que relia o dia inteiro sumiu junto com a tela. Era a causa dominante dos 68 MB/h medidos em 07/set. O que sobrou ali é histórico fechado: não muda sozinho.

### 2 · Central Zêluz em três partes

**Peludinhos** (Cadastro · Prevenção · Pesquisa com a Família Multiespécie · Peso) › **AuAulândia** (Check-in · Check-out com o tutor · Pendências com o tutor · Cuidado Vet · Orçamento de hospedagem) › **Day Care** (Quem não comeu hoje · Reposições · Lançamentos do dia · **Planos e cobranças**).

"Planos e cobranças" deixou de ser sub-cabeçalho e virou um **rótulo** dentro do Day Care (11,5px/800, dourado): sub-cabeçalho dentro de sub-cabeçalho não existe, e a lei dos três níveis proíbe um filho maior que o pai. O rótulo é **menor** que o item — separa sem fingir que é cabeçalho.

Os nomes "AuAulândia" e "Day Care" voltam a se repetir entre Serviços e Central. O problema de 04/set **não volta**: lá eram duas gavetas com os mesmos itens; aqui o critério é quem faz — o monitor de um lado, quem fala com o tutor do outro — e nenhuma tela mora nos dois. O harness morde isso.

### 3 · Operação em ordem alfabética

Configurações · Enriquecimento Ambiental · Escala e plano do dia · Financeiro do plantão · Linha do tempo do dia · Ritmo do Time · Time. O submenu do Time (`#pSubnav`) continua colado nele.

### 4 · Peso: 30 dias em todo lugar

`PESO_REGUA_DIAS` passou de 45 para **30**. Em dia até 30 · atrasado de 31 a 60 · muito atrasado de 60 em diante · "nunca pesado" no topo. A tela Peso e o quadro "Falta pesar" do Dashboard da Amanda leem a **mesma função** — dois lugares nunca contam de jeitos diferentes. A frase de apoio na tela: *"Pesagem a cada 30 dias; a Gestão decide o dia."*

### 5 · A galeria "todas as fotos" saiu de Relatórios

A identidade da foto nunca foi o nome: é a chave da **ficha** (`pelKey` = `nome__tutor`, com a raça na ficha). Duas Amoras de tutores diferentes são duas chaves, duas fotos independentes — cada monitor troca a da sua e nenhuma sobrescreve a outra. A galeria juntava as duas na gaveta "Amora" e pedia decisão onde não havia dúvida. Com mais homônimos chegando, só pioraria. Continuam de pé: o relatório "FILHOts SEM foto na ficha" e a conferência de foto **órfã** (chave sem ficha — não homônimo).

**Promessa mantida (mordida no harness):** os `<a data-v>` do menu conservam EXATAMENTE as classes `so-*`/`op-only` que já tinham. A **única** diferença é o item "Painel do Dia", que saiu — e cuja classe passou para a "Linha do tempo do dia". Prova reproduzível:

```bash
git show HEAD~1:auaulandia/index.html | grep -oE '<a data-v="[a-z-]+"( class="[^"]*")?' | sort > antes.txt
grep -oE '<a data-v="[a-z-]+"( class="[^"]*")?' auaulandia/index.html | sort > depois.txt
diff antes.txt depois.txt   # só a linha do painel sai; só a da linhadotempo entra
```

Capturas: `docs/capturas-v07/` — `dashboard-adriana.png`, `dashboard-marcia.png`, `dashboard-amanda.png`, `linha-do-tempo.png` (1440 px) e `menu-central.png` (o menu aberto nas três partes). Geradas no **emulador** com o retrato do backup: o banco real não recebeu um byte.

---

## O que tinha mudado em 08/set/2026, às 21h40

Adriana:

> "painel mudar para Dashboards" · "Colocar nomes: Adriana / Márcia / Amanda" · "Central Zêluz — primeiro Peludinhos, depois Planos e Cobranças, depois os outros itens" · "Conversa com o tutor — mudar para Pesquisa com a Família Multiespécie"

Quatro coisas, todas de NOME e ORDEM:

1. **A categoria "Painéis" virou "Dashboards".** A chave do estado aberto/fechado continua `paineis` — quem já deixou a gaveta aberta no aparelho não a perde.
2. **Cada dashboard passou a se chamar pela PESSOA que se senta nele.** Ninguém na casa procura "a Supervisão": procura a Amanda. `Meu Painel` → **Meu Dashboard**; `Painel das Consultoras` → **Dashboard das Consultoras**; `Painel da Supervisão` → **Dashboard da Amanda**; `Painel da Operação` → **Dashboard da Márcia**; `Painel da Diretoria` → **Dashboard da Adriana**. O **Painel do Dia** ficou com o nome que tinha (ela não pediu para mudar).
3. **Na Central Zêluz, o subgrupo Peludinhos subiu para o topo**, seguido de Planos e cobranças; os itens da chegada à saída ficaram embaixo, na mesma ordem do dia que já tinham. O FILHOt vem antes do dinheiro, e o dinheiro antes da rotina.
4. **"Conversa com o Tutor" virou "Pesquisa com a Família Multiespécie".** É pesquisa, não conversa — e quem responde é a família inteira, não só quem assina.

**Promessa mantida (mordida no harness):** os 36 `<a data-v>` do menu conservam EXATAMENTE as classes `so-*`/`op-only` que já tinham. Prova reproduzível:

```bash
git show HEAD~1:auaulandia/index.html | grep -oE '<a data-v="[a-z-]+"( class="[^"]*")?' | sort > antes.txt
grep -oE '<a data-v="[a-z-]+"( class="[^"]*")?' auaulandia/index.html | sort > depois.txt
diff antes.txt depois.txt   # tem de sair vazio
```

---

## O que tinha mudado em 08/set/2026, de manhã

Adriana: **"a sidebar virou bagunça."**

Três coisas foram arrumadas:

1. **Os painéis viraram uma categoria só** (que à noite virou "Dashboards"). Antes estavam espalhados por três lugares: dois na raiz do menu, dois dentro da Central Zêluz e dois dentro da Operação. Quem procurava painel não sabia onde procurar.
2. **"Serviços" voltou — mas com outro critério: QUEM FAZ.** Serviços é o trabalho de quem fica com o FILHOt (monitor e plantonista): AuAulândia e Day Care. Central Zêluz é o outro lado do mesmo dia: quem fala com o tutor (Consultoras de Bem-Estar, supervisão da Amanda e a veterinária). Nenhuma tela aparece nos dois lados — cada uma mora num lugar só, e por isso não volta o problema de 04/set (duas gavetas com o mesmo nome e os mesmos itens).
3. **O subgrupo "Peludinhos" ganhou o Cadastro.** Cadastro, Prevenção, a pesquisa com a família e Peso são leituras da mesma ficha — agora vivem juntos.

**Promessa mantida:** ninguém ganhou nem perdeu acesso. Cada item conservou exatamente as classes `so-*`/`op-only` que já tinha; só mudaram grupo e ordem. O harness (`tests/harness.js`) morde isso a cada rodada.

## Três níveis que se enxergam (Adriana, 27/ago/2026)

| Nível | Tamanho / peso | Cor | Comportamento |
|---|---|---|---|
| Categoria | 17px / 700 | creme | recolhível, com ícone e seta |
| Sub-cabeçalho | 15px / 700 | dourado | recolhível, com seta |
| Item | 14px / 500 | — | destino |

Nunca um filho maior que o pai. Abre só o caminho da tela ativa. A pendência sobe em dois degraus (item › sub-cabeçalho › categoria). Cabeçalho sem item visível some.

---

## O menu

| Grupo | Título (data-v) | Subtítulo didático | Quem vê (como hoje) |
|---|---|---|---|
| — | **Início** (`inicio`) | Visão geral do dia. | op-only |
| — | **O que fazer hoje** (`mesa`) | Tudo o que espera por você hoje — toque num quadro para ir direto ao item. | so-mesa |
| **Dashboards** | Meu Dashboard (`painelmeu`) | A sua fatia do dia: o seu horário, o seu plano, o que ficou aberto e os seus pontos. | tabela PERM |
| | Dashboard das Consultoras (`consultoras`) | A sua mesa do dia: o Seu dia e os cinco quadros que precisam de você. | tabela PERM |
| | Dashboard da Amanda (`painel-amanda`) | O seu dia e as duas listas: o que está esperando você e o que você já resolveu hoje. | tabela PERM |
| | Dashboard da Márcia (`paineloperacao`) | A casa de hoje num lugar só: quem veio, quem faltou, o tempo do time, as noites que vêm aí e o acerto. | tabela PERM |
| | Dashboard da Adriana (`painel-diretoria`) | A casa inteira e o dinheiro do mês — a visão de quem responde por tudo. | tabela PERM |
| | Painel do Dia (`painel`) | Auditoria e cumprimento de protocolos. | so-master |
| **Serviços › AuAulândia** | Conferência do check-in (`conferencia`) | O monitor confere corpo e pertences de quem chegou (2º passo; o 1º é da Central Zêluz). | so-conferencia |
| | Hóspedes de hoje (`hospedes`) | Quem está na casa, medicação e alimentação. | so-hosp |
| | Plantão da noite (`hospedagem`) | O relatório de cada hóspede, turno a turno. | todos |
| | Conferência do dia (`gestdia`) | Medicações por horário, problemas e os três tempos do plantão. | so-gestao |
| | Check-out (`checkout`) | O monitor monta a bolsa e devolve tudo (1º passo; a Central fecha com o tutor). | todos |
| **Serviços › Day Care** | Abertura do dia (`abertura`) | Monitor 1: como a casa abre. | so-abertura |
| | *(chamada, almoço, EA e as demais atividades)* | Vivem no `#dcSubnav`, dentro do `#blocoDaycare`. | so-day |
| **Central Zêluz › Peludinhos** | Cadastro de Peludinhos (`ficha`) | Um cadastro só, para Day Care e AuAulândia — tudo começa aqui. | so-gestao (+ destaque) |
| | Prevenção (`vacinas`) | Vacina, vermífugo, coleira, exame e peso: quem está atrasado. | so-gestao |
| | Pesquisa com a Família Multiespécie (`alergia`) | A pesquisa com a família: enviar, colar a resposta, e ela vira ficha sozinha. | so-gestao |
| | Peso (`peso`) | Pesar qualquer FILHOt: recepção, veterinária e gestão. | so-pesa |
| *Central Zêluz › Planos e cobranças* | Renovação de planos (`renovacao`) | Quem está no fim do plano. | so-gestao |
| | Lançar pagamento (`lancar-pagamento`) | O recebimento do plano vira registro. | tabela PERM |
| | Em débito | Quem deve no Day Care. | em breve (sem tela) |
| *Central Zêluz (a ordem do dia)* | Check-in (`checkin`) | O tutor chega: entrada, alimentação, medicação, assinatura (1º passo). | todos |
| | Check-out com o tutor (`checkoutconf`) | Conferir a bolsa junto com o tutor e assinar (2º passo). | so-conf-saida |
| | Orçamento de hospedagem (`orcamento`) | Monte e envie o orçamento ao tutor. | so-recepcao |
| | Pendências com o tutor (`recepcao`) | Ração acabando, remédio faltando, algo que ficou. | so-recepcao |
| | Cuidado Vet (`cuidadovet`) | Alterações no corpo que a veterinária precisa ver. | so-vet |
| | Quem não comeu hoje (`emporio`) | A mensagem pronta para avisar o tutor. | so-emporio |
| | Reposições (`reposicao`) | Créditos de dias por falta avisada. | so-recepcao |
| | Lançamentos do dia (`dashdc`) | A planilha do Day Care, item por item. | so-recepcao |
| **Operação** (a Márcia) | Financeiro do plantão (`acerto`) | Acerto das plantonistas: noites, dobras, quanto pagamos. | so-master |
| | Ritmo do Time (`ritmo`) | Tempo por etapa, dia a dia. | so-gestao |
| | Enriquecimento Ambiental (`eahist`) | O que foi feito e quem não participou. | so-gestao |
| | Time (`pessoas`) | Pessoas, senhas e quem acessa o quê. | so-master |
| | Escala e plano do dia (`planodia`) | A escala de cada um e qual plano vale hoje. | tabela PERM |
| | Configurações (`config`) | Telegram e ponte da planilha. | so-master |
| **Em breve** | Agenda (`agenda`) | Frequência e reservas. | todos |
| — | **Relatórios** (`relatorios`) | Resumo do dia, aniversariantes, exportações. | so-gestao |
| — | Sair (`sair`) | Encerra a sessão neste aparelho. | todos |

---

## Tela Peso — o que ela responde agora (08/set/2026)

Até 08/set a tela só respondia *"quem eu vou pesar agora?"*. Faltava a pergunta que ninguém fazia: *"quem a casa deixou de pesar?"* — e peso velho vira dose de remédio calculada em cima de um FILHOt que já não existe.

No topo da tela há **um box único e clicável**: *"N sem pesar há mais de 45 dias"*. Tocando nele abre a lista.

| Faixa | Régua | Como aparece |
|---|---|---|
| Em dia | 0 a 45 dias | não entra na lista |
| Atrasado | 46 a 89 dias | etiqueta dourada |
| Muito atrasado | 90 dias ou mais | etiqueta vermelha |
| Nunca pesado | sem nenhum peso na ficha | etiqueta vermelha, **no topo da lista** |

- Ordem: **mais atrasados primeiro**; quem nunca foi pesado vem antes de todos.
- Cada linha traz: FILHOt, tutor, último peso (kg com vírgula), data e há quantos dias.
- Tocar na linha leva direto a pesar aquele FILHOt.
- O dado é o mesmo da ficha e da Prevenção — o histórico `pesos` do cadastro. Nada é calculado por fora.

---

## Dashboard da Amanda — refeito em 08/set/2026 (noite)

Adriana: **"Dashboard da Supervisão - Amanda - está horrível, ela é uma colaboradora, precisa de água e etc... não dá para entender nada desse dashboard."**

O que a tela tem agora, de cima para baixo:

| Andar | O que é |
|---|---|
| **Seu dia** | O MESMO card das Consultoras e do monitor (`pcSeuDiaCardHTML` — uma função, três usos): série da semana, 8 copos de 250 ml, a frase do dia na voz Zêluz e as três carinhas de como ela está. A Amanda é Zelosa como as outras. |
| **Placar** | Dois números grandes (esperando você · você resolveu hoje), a barra que enche e a festa com o carimbo quando a lista de pendentes zera. |
| **O que está esperando você** | Uma linha por item, com NOME: o FILHOt/tutor, de quem é a vez, **desde quando espera** e **quem abriu**. Agrupada por assunto, com a contagem de cada grupo. |
| **O que você resolveu hoje** | Uma linha por item, riscada e com selo verde: o que foi, **a que horas** e **quem fez**. |

Cada linha é um botão: toca e abre a tela onde aquilo se resolve (a lei do quadro clicável). As listas só observam — nenhuma delas grava. O card "Seu dia" é o único que grava, e grava no nome dela.

Capturas: `docs/capturas-v06/dashboard-amanda.png` (1440 px) e `dashboard-amanda-390.png` (celular). O script que as gera (`docs/capturas-v06/capturar.js`) roda no **emulador** com o retrato do backup — o banco real não recebe um byte.

---

## Pendências com o tutor — encerrar de verdade (08/set/2026, noite)

Adriana: **"Amanda colocou: Kakinho tem 7, ou seja dá até o final, e consta como processo. Precisa ser encerrado."**

**O caso, no retrato de 07/09** (`auaulandia/avisos-racao/-P0hscx2wW0rnnV0_hSy`): o FILHOt é o **Kako** ("Kakinho"), tutor Márcia Nascimento, remédio PromunDog, tipo `medicacao-sem-contagem`. A trilha tem uma entrada — `acao: "Tem 7 (Ate o final)"`, `assinatura: "Amanda"`, `quando: "04/09 17:35"`, `resolucao: true` — e a auditoria daquele dia traz `racao-aviso-resolvido` com o id exato do aviso, às 17:35, por Amanda. **O campo que ficou errado é o `status`: continuou `"em_processo"`.** Só o botão *Reabrir* devolvia um aviso encerrado a "em_processo" sem mexer na trilha — e ele gravava calado: sem motivo, sem quem, sem quando e sem uma linha na auditoria.

A regra nova, nos dois canais da tela (ração/remédio e estoque):

1. **Encerrar** carimba o desfecho no próprio nó: `resolvido_por`, `resolvido_em`, `resolvido_motivo`. O botão passou a se chamar **Encerrar** (era "Marcar como resolvido").
2. **Reabrir** pede o motivo na caixa da casa, deixa entrada na trilha, carimba `reaberto_por`/`reaberto_em`/`reaberto_motivo` e escreve na auditoria (`racao-aviso-reaberto` / `estoque-aviso-reaberto`).
3. **Encerramento herdado:** aviso cuja trilha tem resposta de encerramento e que nunca foi reaberto **conta como encerrado**, mesmo com o `status` atrasado (`avisoEncerrado` / `avisoStatusEfetivo`). Tela, contagem do menu e Dashboard da Amanda leem a mesma régua.

**O que a Adriana precisa fazer pelo Kakinho: nada.** A regra 3 fecha o caso sozinha, sem ninguém tocar no banco. Se ainda faltar remédio, é só abrir a tela e tocar em **Reabrir**, dizendo o motivo.
