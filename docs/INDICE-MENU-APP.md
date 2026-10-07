# Índice do app — menu aprovado pela Adriana (reorganizado em 08/set/2026, ajustado em 15, 17, 18, 19, 21, 24, 25, 27, 28 e 30/set e 01, 02, 06 e 07/out/2026)

> Regra: o app tem de ser autoexplicativo, para treinamento rápido. Cada item tem **Título** e **subtítulo** (a explicação curta que aparece como dica no menu e no índice da Gestão no computador). Nomes são decisão da Adriana.

## O que mudou em 07/out/2026 (v 2026-10-07-02) — falta avisada em alguns dias (caso do Fred)

> **Adriana, 06/out/2026:** *"Lancei na reposição do Fred e da Eleonora o dia 13 e 14. E lá no Falta, um período, eu escrevi dia 13 e dia 14 e contabilizou apenas um dia, como se fosse o dia 13. Precisa de resolver isso. Às vezes a pessoa vai fazer dois, três dias, a gente colocar mais datas."* Story 6.39.

### (AP) Reposições › Lançar falta avisada › "Alguns dias"

| Antes | Agora |
|---|---|
| Só "Um dia só" ou "Um período". No período, o dia que não era dia dele na ficha ficava de fora **sem aviso**: 13 e 14/10 com só a terça davam 1 crédito, e ninguém sabia por quê | Terceiro modo, **Alguns dias (datas soltas)**: uma data por linha, "+ outra data" e "×" para tirar. Cada data em que ele viria vira um crédito, num lançamento só, com o mesmo motivo e o mesmo dia de repor (só no primeiro crédito, como no período) |
| — | A prévia diz **o que fica de fora e por quê**: "14/10 (quarta-feira) não entra: não é dia do Fred na ficha (ele vem Ter). Se ele passou a vir nesse dia, marque o dia no alto da ficha." Sábado e domingo: "não há Day Care". Data repetida conta uma vez só, com o aviso. No período, os dias de semana que ficam de fora aparecem também (até 5 pelo nome e "e mais N") |

- **A regra do crédito não muda:** a falta é de um dia em que ele viria (a mesma do período). Plano com dias diferentes em cada mês (6.30): vale o dia daquele mês do plano, e o conselho manda ajustar na aba Plano.
- **A confirmação, o rastro e o Extrato** dizem os dias ("alguns dias: 13/10, 15/10, 20/10") e o que ficou de fora. A mensagem pronta ao tutor fala dos dias: "contando as dos dias 13/10, 15/10 e 20/10".
- **"Um dia só" continua como antes** (aceita qualquer data; a troca de dia continua só nele).
- **Onde está no código:** `repAlgunsAnalise` (o que entra e o que fica de fora), `repPorQueNaoVem` (o porquê), `repPreverAlguns` e `repForaDoPeriodo` (as prévias), `repAlgunsHTML`/`repAlgunsMais`/`repAlgunsTirar` (as linhas), `repConfirmar` (o modo `alguns`), `repMensagem` (os dias na mensagem) e `repExtratoAlguns` (o Extrato).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (7 provas da 6.39); `tests/harness.js` v-51 (paridade com o período, FILHOt por FILHOt da lista do app, em 3 semanas; todo dia de fora com o porquê). Defeitos plantados: 17, todos pegos.

## O que mudou em 07/out/2026 (v 2026-10-07-01) — aba Plano: o "2x" marca os dias ali mesmo (caso do Fred)

> **Adriana, 06/out/2026,** com a foto do Confirmar do Fred dizendo "1x por semana · Ter": *"Erro - Fred eleonora deseja 2x por semana vou fechar e volta para uma vez"*. Story 6.37.

### (AN) Ficha › Plano › "Quais dias?"

| Antes | Agora |
|---|---|
| Tocar em **2x** na aba Plano só mostrava "Marque 2 dias da semana lá em cima" e apontava os chips do alto da ficha; ao fechar o aviso, o seletor voltava para 1x, e o Confirmar gravava 1x | Logo abaixo de "Aulas por semana" aparecem os dias (**Quais dias?** Seg · Ter · Qua · Qui · Sex). Tocar em **2x** diz quantos faltam ("Para 2x, marque mais 1 dia aqui embaixo (hoje está marcado Ter)"); tocar no dia o marca, e o **2x** acende. Pedir menos do que está marcado diz quantos desmarcar |

- Os dias da aba Plano são **os mesmos** do alto da ficha (a mesma gravação, com rastro): marcar num lugar aparece no outro. As aulas por semana continuam sendo a quantidade de dias marcados — é esse número que entra na mensalidade.
- Os botões dos dias têm 44 px de altura, para o toque no celular, e os 5 cabem numa linha a 375 px. Quem não edita a ficha vê os dias, sem tocar.
- **Tocar no dia redesenha a aba na hora** (QA da 6.37): o cadastro em memória acompanha a gravação, sem esperar o banco; dois toques rápidos no mesmo dia marcam e desmarcam.
- O texto da aba aponta **«Quais dias?»**, e não mais "lá em cima": o texto de apoio, a faixa amarela do plano que não bate com os dias (o caso do Fred), o Desfazer e o Confirmar sem nenhum dia.
- Nenhum dia marcado: nenhum número aceso, "Hoje: nenhum dia marcado", a mensalidade diz "marque os dias em «Quais dias?»" e a faixa amarela diz "nenhum dia está marcado".
- Plano com dias diferentes em cada mês (6.30): no modo "Mudam durante o plano", valem as linhas de cada mês (sem mudança). Com o plano por mês correndo e "Iguais", tocar num dia da aba pergunta antes; a saída é **«Mudam durante o plano»**, ali mesmo (e não "Ir para a aba Plano", onde a pessoa já está). Quando isso não serve — o plano em edição é mensal, ou hoje vale um mês do plano anterior —, o botão é **Voltar** e a pergunta diz por quê.
- **Onde está no código:** `planoDiasChipsHTML` (os dias na aba), `setRenovAulas` (o aviso), `blocoPlano`; a gravação é a de sempre, `toggleDiaPel` (com `origem='plano'` quando o toque vem da aba).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (11 provas da 6.37: a da entrega, as 7 do QA — o redesenho na hora e o toque duplo, a ordem e a grade, a rotina × o Mês 1, a pergunta vinda da aba, o texto e o zero dia, o Confirmar sem dia — e as 3 do re-QA — o «Mudam» só quando serve, a faixa com zero dia, o Desfazer); `tests/harness.js` v-15 (o aviso aponta os dias da aba ou do alto; o texto de apoio novo; a faixa amarela). Defeitos plantados: 7 na entrega, 25 nos ajustes do QA (os 16 do QA e 9 novos) e 5 nos do re-QA, todos pegos. Chromium a 375 e a 1280 px (dado inventado): os roteiros do QA sem redesenho manual, todos ok.

### (AO) Renovação de planos: o primeiro desenho como consultora (Story 6.40)

- Ao entrar no app como consultora, a tela Renovação de planos podia ser desenhada antes de o filtro "a cobrar agora" existir, e o primeiro desenho dava erro (a lista aparecia depois). Agora, sem filtro, vale "a cobrar agora".
- **Onde está no código:** `renderRenovacao`. **Prova:** Fase 0, "6.40".

## O que mudou em 07/out/2026 (v 2026-10-07-01) — o Financeiro soma mês a mês o plano com dias diferentes em cada mês (caso da Hopi)

> **Adriana, 05/out/2026:** *"Ela foi fechado a creche trimestral 718, mais duas vezes por semana de 589. Então, ficou o total de 1.307 o plano."* Story 6.36, continuação da 6.30 (no mesmo pull request), com as respostas recomendadas, pela autorização do /loop de 06/out.

### (AM) Financeiro: o plano com dias diferentes em cada mês vale a soma dos meses

| Antes | Agora |
|---|---|
| O Financeiro calculava o plano por uma quantidade só de aulas, a do Mês 1 gravada no plano: para a Hopi, R$ 359,00 × 3 = **R$ 1.077,00**, R$ 230,00 a menos que o combinado | O valor do plano é a **soma mês a mês** da tabela, com o desconto do Nº na família aplicado e arredondado em cada mês (a mesma conta da aba Plano). Hopi (Gold, 1º da família, paga em 05/10/2026): **R$ 1.307,00** em outubro; **R$ 0,00** em novembro e em dezembro (o plano inteiro cai no mês do pagamento, como sempre) |
| A linha da ficha dizia "1x por semana" (o Mês 1) | A linha diz os dias e o valor de cada mês: **"plano Gold (trimestral) · dias por mês: 1x, 1x, 2x — R$ 359,00 + R$ 359,00 + R$ 589,00"**, no Dashboard da Adriana (Maiores valores a receber) e no Lançar pagamento |
| Plano vencido sem renovação: o "valor de um mês" saía do Mês 1 | Sai da **rotina** (os dias do alto da ficha), que é o que volta a valer depois do plano |

- **Onde aparece:** Recebimentos do mês (Dashboard da Adriana e da Márcia, linhas Trimestral e Semestral), Dashboard da Adriana (a receber, em atraso, maiores valores a receber, vencidos) e a tela Lançar pagamento (fora do menu desde 18/set, código vivo), que passa a aceitar **R$ 1.307,00** e barra R$ 1.077,00 ("falta R$ 230,00").
- **Os valores da story, ao centavo:** Gold 1x, 1x, 2x — 1º **R$ 1.307,00** · 2º **R$ 1.215,51** · 3º **R$ 1.150,16**; Black 1x, 1x, 1x, 1x, 2x, 2x, 1º **R$ 2.488,00**. O "Valor do plano" da aba Plano e o Financeiro dão o mesmo centavo (provado em 120 combinações).
- **Dias por mês que não fecham com o plano** (outro número de meses, mês sem dia, data que não fecha, plano mensal, mês sem preço na tabela): a ficha fica **fora de toda soma**, em "sem como calcular", com o motivo escrito (por exemplo, "o Mês 2 está sem dia da semana válido (segunda a sexta) — confira na ficha, aba Plano"). Nunca um valor inventado.
- **Vencido sem a rotina marcada** (sem dias no alto da ficha e na lista do app): fora da soma de vencidos, com o motivo escrito.
- **Fichas sem dias por mês:** o Financeiro dá exatamente os mesmos números de antes, linha por linha (provado contra a conta de antes da 6.36, guardada em `tests/lib/financeiro-logica-antes-6.36.js`).
- **Onde está no código:** `auaulandia/financeiro-logica.js`: `finResumoMes` (a porta: `if (r.dias_mes)`), `finResumoDiasMes` (a linha do mês), `finValorDoPlano` (a soma mês a mês), `finMesesDoPlano`, `finDiasMesValidos`, `finMesesDatas`, `finDiasMesSaneado`, `finMesesN`, `finMeioMesVale`, `finAddMesesISO`, `finAddDiasISO` (espelhos, em ES5, das contas da 6.30 no app), `finDiasMesMotivo` (o motivo escrito) e `finAulasRotina` (o vencido pela rotina); `auaulandia/index.html`: `pdirFinHTML` e `lpCobrancaHTML` (o texto dos dias por mês).
- **A versão no endereço dos arquivos de conta (QA da 6.36):** `resposta-tutor.js`, `painel-logica.js` e `financeiro-logica.js` entram na página com `?v=` igual à `APP_VERSAO`. A versão nova recarrega a página com outro endereço, mas o navegador guarda os arquivos de fora pelo endereço deles (10 minutos no GitHub Pages): sem o `?v=`, um aparelho aberto pouco antes da publicação rodaria o app novo com a conta velha e mostraria R$ 1.077,00 para a Hopi, sem aviso. **Ao subir a versão, o `?v=` sobe junto** (o harness v-50 confere).
- **Na tela, "R$ 359,00" não quebra no meio:** o detalhe dos meses usa o espaço que não quebra depois do R$ (`brlSemQuebra`), no Dashboard da Adriana e no Lançar pagamento.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (18 provas da 6.36, bloco "6.36 — Financeiro": as 12 da entrega e as 6 do QA — o arredondamento ao centavo mais próximo com preço quebrado, o pagamento a mais, o contador do Day Care, o meio do mês sem o mês da 1ª cobrança, o Nº na família torto numa família, o `?v=` e o R$ que não quebra); `tests/harness.js` v-50 (N1: o `?v=` igual à `APP_VERSAO`; H3: a conta de 2026-06 a 2026-10 igual à de antes da 6.36. O retrato sintético não tem cadastro: a prova de fato foi um cadastro inventado sobre a lista do app, comparado com a cópia congelada do Financeiro de antes. H5: paridade app × Financeiro em 120 combinações, a tabela da story ao centavo e o preço com centavos); defeitos plantados: 30 na entrega, todos pegos, e 12 nos ajustes do QA, todos pegos. Revisão tripla (lógica, entradas e verificação independente) registrada na story.

## O que mudou em 07/out/2026 (v 2026-10-07-01) — plano com dias diferentes em cada mês (caso da Hopi)

> **Adriana, 05/out/2026:** *"Tem alguns planos [...] que quando o tutor viaja, a gente fecha um plano e deixa para fazer a reposição depois. É o caso da Hopi. Da Hopi, nós fechamos um plano trimestral, sendo que durante dois meses ela vai vir uma vez por semana apenas, e no último mês, duas vezes por semana, para poder fazer as reposições que vamos precisar. [...] Ela foi fechado a creche trimestral 718, mais duas vezes por semana de 589. Então, ficou o total de 1.307 o plano. Então, eu preciso conseguir escolher como que funciona isso e os dias da semana que ela vai vir. No primeiro mês, ela vai vir tais dias da semana, no segundo mês, ela vai vir tais dias e etc. [...] para poder ter esses casos que a gente acaba fazendo."* Story 6.30, com as respostas recomendadas, pela autorização do /loop de 06/out.

### (AL) Ficha › Plano › "Os dias da semana": iguais no plano todo ou mudando a cada mês

| Antes | Agora |
|---|---|
| Um conjunto só de dias da semana por FILHOt, igual para o plano inteiro. Para a Hopi vir 2x no 3º mês, alguém precisava lembrar de trocar os dias da ficha à mão no dia certo, e isso mudava também as datas passadas e futuras | No plano **trimestral** ou **semestral**, a aba Plano tem **"Os dias da semana": Iguais no plano todo · Mudam durante o plano**. Em "Mudam", aparece uma linha por mês (Mês 1, Mês 2, Mês 3…), com as datas, os dias de cada mês e o valor da tabela daquele mês. No plano **mensal** a opção não aparece |
| O valor do plano era sempre a mensalidade de um conjunto de dias | **"Valor do plano"** é a soma da tabela, mês a mês. Hopi (Gold, 1º da família): Mês 1 Seg R$ 359,00 · Mês 2 Seg R$ 359,00 · Mês 3 Seg e Qua R$ 589,00 · **Valor do plano: R$ 1.307,00**. O desconto do 2º e do 3º peludinho é aplicado em cada mês |
| A turma, a Chamada, o check-in, a TV, as vagas, a troca de dia, a reposição e o orçamento liam os dias da ficha, sem data | Tudo lê os dias **pela data**: na quarta 09/12/2026 (Mês 3) a Hopi está na turma, na Chamada, no check-in e na planilha; na quarta 11/11/2026 (Mês 2), não. Troca de dia, reposição (dia a dia e por período), próxima vinda, orçamento de hospedagem (noite a noite) e o contador das Turminhas seguem o mês do plano de cada data |
| Os chips do alto da ficha eram "os dias dele" | Com plano que muda por mês, os chips do alto são a **rotina**: o que vale depois do plano, se ele não for renovado. Acima deles, uma faixa diz qual mês vale hoje e quando os dias mudam ("Hoje vale o Mês 1 de 3 do plano: Seg. A partir de 05/12/2026: Seg, Qua…"). Tocar num chip durante o plano pergunta antes ("Mudar a rotina" ou "Ir para a aba Plano") |

- **O mês do plano conta do início do plano** (Hopi: 05/10 a 04/11, 05/11 a 04/12) e **o último mês termina no fim da vigência** (05/12 a 31/12). Quem começou no meio do mês tem os meses a partir do mês cobrado (22/09 a 31/10, novembro, dezembro).
- **Nada grava antes do Confirmar.** O resumo mostra cada mês com as datas, os dias e o valor, o "Valor do plano: R$ 1.307,00 — pago à vista" e o que vale depois ("Depois de 31/12/2026, sem renovação: Seg"). O Confirmar barra mês sem dia (aponta o mês), mês sem valor na tabela e os meses todos iguais (aí é "Iguais no plano todo").
- **Os dias a mais do mês são dias do plano:** lançar "Reposição" num dia do plano (a quarta do Mês 3) pergunta antes de abater ("Quarta já é dia da Hopi no plano"), e a baixa automática não gasta saldo nesse dia.
- **A troca de mês fica registrada:** no primeiro dia de Day Care do mês novo (Hopi: segunda 07/12), a Linha do tempo do dia registra uma vez "Hopi: começa hoje o Mês 3 do plano — passa a vir Seg, Qua (era Seg)". Mês com os mesmos dias do anterior não gera registro. Depois de uma renovação, o começo de cada mês que ainda falta do plano anterior também é registrado ("Hopi: começa hoje o Mês 3 do plano anterior — passa a vir Seg, Qua (era Seg)").
- **Corrigir a data do pagamento não é plano novo** (ajuste do QA, 06/out): 05/10 → 02/10 (erro de digitação), ou 05/10 → 06/10 respondendo "Manter até 31/12/2026 (só corrigi a data)", continua em "Mudam", com os mesmos dias de cada mês contados do início corrigido (Mês 1 de 02/10 a 01/11, Mês 3 de 02/12 a 31/12) e o mesmo "Valor do plano: R$ 1.307,00". É correção quando o plano termina no mesmo dia do gravado, quando o período não começa depois do gravado ou quando a pessoa responde "Correção da data" / "Manter … (só corrigi a data)". Se a consultora escolher "Iguais" numa correção, o resumo do Confirmar diz, numa linha: "Os dias de cada mês do plano atual (Seg | Seg | Seg, Qua) deixam de valer — a partir de 02/10/2026 vale Seg."
- **Renovação:** o plano novo começa em "Iguais" (não herda o arranjo da viagem). Os dias que faltam do plano antigo continuam valendo até o fim dele. Quando o plano novo começa **dentro** do antigo (pago em 10/12, ou em 25/11 com o plano novo a partir de 01/12), nos dias em que os dois valem vale a **soma dos dias dos dois** (o tutor pagou os dois): as quartas 16, 23 e 30/12 continuam da Hopi. O resumo do Confirmar diz até quando: "Os dias de cada mês do plano atual (Seg | Seg | Seg, Qua) continuam valendo até 31/12/2026, junto com os do plano novo — a partir de 01/01/2027, vale Seg." A faixa acima dos chips diz "Hoje vale o Mês 3 de 3 do plano anterior, junto com o plano atual: Seg, Qua.", e a pergunta da Reposição nos Lançamentos do dia também. O Desfazer devolve o plano anterior com os dias de cada mês. Plano vencido sem renovação: valem os chips do alto.
- **"Mudam" também pede os chips do alto:** sem nenhum dia marcado lá em cima, o Confirmar aponta os chips ("são eles que valem depois do plano, se ele não for renovado"); sem eles, o FILHOt sairia da turma quando o plano acabasse.
- **O aviso "os dias mudam por mês do plano"** (no modal de Reposições e no orçamento de hospedagem) só aparece enquanto existe mês do plano de hoje em diante; depois do último mês, some (a conta de datas passadas continua).
- **Mensagens ao tutor:** "Plano finalizou" fala da rotina ("uma vez por semana, na segunda"); "Renovação confirmada" sai sem a frequência (uma linha com os dias de cada mês seria texto novo, só com o texto da Adriana).
- **O Financeiro soma mês a mês** desde a v 2026-10-07-01 (Story 6.36, seção (AM) acima): a Hopi vale **R$ 1.307,00** em outubro em todo lugar que lê o Financeiro (Recebimentos do mês, Dashboard da Adriana e Lançar pagamento).
- **Fichas sem dias por mês:** nada muda, em data nenhuma. O que foi provado de fato: (1) o harness com o **retrato sintético** sobre a **lista de FILHOts do app** (118 fichas, hoje e em 10 datas, a turma de cada dia da semana e o contador das Turminhas) — o retrato da nuvem **não tem o cadastro** (`daycare/cadastro`), então **não** foi provado no cadastro real; (2) as provas diferenciais do QA contra a versão sem a 6.30 (`789726d`), com 300 fichas sintéticas: **408.632 comparações, 0 diferenças** em toda leitura de dias, e 0 diferenças no Confirmar, no Desfazer, no orçamento e na Reposição (refeitas depois dos ajustes do QA). Quando a Hopi for convertida, ela (e o plano anterior dela, depois de uma renovação) sai dessa comparação do harness, com prova de que a exclusão pega só as fichas com dias por mês.
- **Onde está no código:** `renovMesesDoPlano`, `renovMesesDatas`, `renovDiasMesSaneado`, `renovDiasNaData` (com a soma dos dias na sobreposição), `renovMesNaData`, `renovDentroDoPlano`, `renovValorDoPlano` (as contas); `renovEhCorrecao`, `renovRascMesmoPlano` (correção × plano novo), `renovLinhaMesesDoAtual` (a linha do resumo); `pelTemMesDoPlanoAdiante`, `orcPorMesAviso` (o aviso só enquanto há mês do plano); `pelDias(p, quando)` (a porta única: sem data = hoje, data = o mês do plano, `'rotina'` = os chips); `nAulasDe` (rotina); `turmaDoDia(iso)`, `turmaDe`, `turmaListaDoDia`, `nMatriculados`, `gradeAlmocoDados`, `relPertencesBranco`; `trocaValidar`, `repEhDiaDele`, `dxVereditoTroca`, `repDiasQueViria`, `proximaVindaDe`, `vencProximoDiaDele`, `dashAutoVemNoDia`, `banhosAvisoDiaSemDaycare`, `orcDiasEfetivosEm`; aba Plano: `renovEdit`, `renovRascSujo`, `renovDiasModoSet`, `renovMesDiaToggle`, `renovMesesHTML`, `blocoPlano`, `confirmarRenovacao`, `renovMesmoPlano`, `renovHistHTML`, `desfazerRenovacao`; chips: `diasEditInner`, `toggleDiaPel`, `pelPlanoMesHoje`; registro: `planoMesComecaHoje`, `planoMesQuemMudaHoje` (no `gravarTurmaDoDia`); reposição: `dashLancar`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (58 provas da 6.30, bloco "6.30 — plano com dias por mês": as 29 da entrega, as 15 do QA independente, as 13 dos ajustes do QA — a correção da data, a sobreposição, o aviso e os chips do "Mudam" — e 1 do re-QA); `tests/harness.js` v-49 (14 checagens: a regressão na lista do app, com prova de que só as fichas com dias por mês saem da comparação, e a Tâmara inventada na aba Plano, no Confirmar e no Desfazer); defeitos plantados: 38 na entrega, todos pegos, e 49 nos ajustes do QA (os 22 do QA e 27 novos), 47 pegos e 2 equivalentes (registrados na story 6.30); no re-QA, o registro do mês novo passou a olhar também o plano anterior quando o mês do plano atual não muda no mesmo dia (1 prova nova, `planoMesComecaHoje`); roteiro no navegador a 375 px (24 de 24 na entrega; 42 de 42 nos ajustes: a correção da data e a renovação dentro do plano antigo).

## O que mudou em 06/out/2026 (v 2026-10-06-04 e -05) — a hora do banho fixo nos Lançamentos do dia, e "Escova os dentes aqui?" no painel rápido

> **Adriana, 06/out/2026:** *"Precisa de aparecer também nos lançamentos do dia, quando é jogado pela planilha, o horário. É igual o banho aqui, Charlotte está aqui na planilha [...] foi para a planilha às 15h28, mas não está falando o horário do banho deles. Eu preciso visivelmente esse horário, assim como Ragna, que está aqui às 14h30."* Story 6.34.
>
> *"Hoje [na Zêluz], sobre a troca de escova de dente em aberto. Aí tá aqui, nunca registrado. Tem peludo que não escova dentes [...] que não deixa. Então, a gente tem que colocar que não deixa. Então, tem que ter opção aqui, troca de escovas de dente do Antônio. É, ele escova dente? Se ele escova, ok. Se ele não escova, a gente não tem como fazer."* Story 6.35.

### (AJ) A linha do banho fixo diz a hora do banho — a que está na planilha

| Antes | Agora |
|---|---|
| "Charlotte/Spitz · automático · banho fixo · na planilha ✓ 06/10 15:28" — a hora que aparecia era a do **envio** à planilha (15:28), não a do banho | "Charlotte/Spitz **(a hora do banho dela)** · automático · banho fixo · na planilha ✓ (enviado em 06/10, 15:28)" — a **hora do banho** em destaque, ao lado do nome, como já aparecia no banho lançado à mão (a Ragna, 14:30) |
| A hora mudada na ficha depois do envio ("mudar só o dia" com outra hora, a hora do combinado trocada) **não chegava à planilha**: a TV tocava o alarme na hora velha | A conferência automática percebe que a hora mudou e a ponte **regrava a "Hora Banho"** daquela linha, na próxima conferência (ela começa 20 segundos depois de salvar no Banhos recorrentes e passa dia por dia; sem isso, na volta de 5 minutos) |

- **A hora da linha é a que foi gravada na planilha** (o registro da conferência guarda, nome por nome, a hora enviada), não uma conta feita a cada redesenho: entre mudar a ficha e a conferência passar, a linha mostra a hora que ainda está na planilha. Sem hora gravada (registro anterior a esta versão, ou banho lançado à mão), a linha fica só com o nome. Vale também para outro dia escolhido no seletor e para dias que já passaram.
- **Primeira passada depois da publicação:** os banhos fixos já lançados (hoje + 14 dias) recebem a hora uma vez, para o registro passar a guardá-la; depois disso, só quando a hora muda.
- **O "(enviado em …)"** vale em todas as linhas do automático dos Lançamentos do dia (banho, reposição, falta, adaptação). A tela de Reposições continua com "lançada na planilha ✓ 06/10 15:28".
- **Não deu para regravar a hora:** a linha mostra a hora que continua lá e diz "a planilha recusou — a hora 16:15 não foi gravada", ou, se a conexão caiu, "a hora 16:15 ainda não foi gravada; a conexão com a planilha caiu…"; a próxima passada tenta de novo. Sem conseguir ler os Lançamentos do dia, a conferência não regrava nada (a linha pode ser da recepção).
- **Aba sem a coluna "Hora Banho":** a ponte grava o nome e avisa; a linha fica sem hora e diz "sem a hora: a planilha deste dia não tem a coluna "Hora Banho""; a conferência não insiste a cada 5 minutos, mas confere de novo a cada 6 horas (a coluna pode ter sido criada).
- **Hora apagada no combinado:** a conferência tira a linha e lança de novo, sem hora. Se tirou e não conseguiu lançar, a linha diz "o banho saiu da planilha para acertar a hora e ainda não voltou" (a próxima passada lança).
- O botão **Conferir agora** diz também quantas horas acertou ("· 2 hora(s) acertada(s)").
- **Depende da ponte:** a regravação usa o `lancar` da ponte com o mesmo texto, que acerta só a "Hora Banho" daquela linha (`integracao-daycare/Codigo.gs`, desde a versão 5, de 19/set, a da "Hora Medicação"; a publicada é a 6).
- O banho lançado à mão pela recepção continua com a hora dela: a conferência não mexe.
- **Onde está no código:** `repPlanHoraNome`, `dashAutoLinhas`; em `dashAutoSincronizar`, `horaAntesDe`, `horaAvisoDe` e o passo "já está lá" (a hora e o aviso no `marcar`).

### (AK) "Escova os dentes aqui?" no painel da troca de escova

- Tocar na troca de escova (por exemplo, "em aberto, nunca registrado") no **Hoje na Zêluz**, nos **Vencimentos** ou na **Prevenção** abre o painel com a pergunta **"Escova os dentes aqui?"**: **Sim, escova** · **Não deixa escovar** · **O tutor não compra a pasta**.
- **Não:** grava na ficha a mesma resposta de Ficha › Prevenção › "Escova os dentes no Day Care?" (com o motivo). A troca de escova sai de toda cobrança (Prevenção, Vencimentos, Hoje na Zêluz e mensagem ao tutor) e da escovação dos monitores; aparece a confirmação verde ("já leem esta resposta").
- **Sim:** grava e o painel continua aberto para a data da troca (Feito hoje ou Feito em…), com a dica "Escova aqui: grave abaixo a data da troca."
- **O banco recusou:** aparece "A FICHA NÃO FOI ATUALIZADA" e o painel continua aberto, sem confirmação.
- **Quem pode:** quem atualiza a prevenção na tela (recepção, Supervisão, Gestão).
- **Onde está no código:** `prevCorrigeEscovaDcHTML`, `prevCorrigeEscovaDc` (usa `escovaDcPatch`, a mesma da ficha).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (3 provas da 6.34 e 2 da 6.35). Defeitos plantados: 18 na 1ª rodada, todos pegos; 19 depois do 1º QA, 18 pegos (o que escapa grava hora vazia em colunas sem hora, que a tela não lê); 13 depois do 2º QA (os que escapavam a ele), todos pegos.

## O que mudou em 06/out/2026 (v 2026-10-06-03) — Ficha › Prevenção: check-up e escova no topo, com as duas datas

> **Adriana, 02/out/2026, na ficha da Cookie:** *"Em cadastro do peludinho, eu tô aqui tentando achar onde que está a troca de escova de dente. Não tô achando [...] a escova de dente é um cuidado, né? [...] Então, ter essas duas opções em todos os casos. Para exame, para tudo que a gente precisa de manter ali."* Story 6.27, com as respostas recomendadas, pela autorização do /loop de 06/out.

### (AI) O que se procura primeiro fica em cima

| Antes | Agora |
|---|---|
| A troca de escova ficava no **fim** da aba (Saúde e rotina), depois das vacinas e dos antiparasitários | **Check-up e escova** é o primeiro bloco da Prevenção: check-up, troca de escova e "Escova os dentes no Day Care?" |
| O check-up aparecia **duas vezes**, em campos diferentes: no topo, só a data (sem "Vence em"); no fim, a data com "Vence em" | **Um campo só:** "Último check-up (fez em)" e "Vence em (próximo check-up)". A data grava as três casas antigas juntas (pela ficha, pelo painel rápido e pelo "lançar"); com casas diferentes, vale a **mais recente** |

- **As duas datas em tudo:** vacinas, carrapaticida, coleira, vermífugo, exame de fezes, check-up e escova têm a data em que foi feito ("Última dose", "Última aplicação", "Deu em", "Último exame", "fez em") e o "Vence em". Gestão, Diretoria e Supervisão podem digitar direto no "Vence em" quando só sabem quando vence.
- **O vencimento do check-up que vale:** sem "à mão", o mais tarde entre o vencimento gravado e um ano depois da data mais recente — a ficha, os Vencimentos, o Hoje na Zêluz e a mesa "Check-up a marcar" dizem a mesma coisa. Ficha antiga sem vencimento gravado continua sem cobrança. O "Vence em" digitado à mão vale também na mesa "Check-up a marcar".
- O "fez em" não aceita data futura (o campo barra no computador; no celular, o app avisa "ESSA DATA AINDA NÃO CHEGOU", não grava e o campo volta à data gravada); o "Vence em" e a nota "Pela conta" ao lado acompanham na hora a data digitada.
- **Prevenção › editar (o lançamento da tela Prevenção):** o check-up mostra a data mais recente e o vencimento que vale, e o Salvar grava essa data nas três casas (antes mostrava a casa velha como vencida e, ao salvar, apagava o check-up novo).
- **Vermífugo (a pergunta da Cookie):** o campo "Vence em (próximo vermífugo)" já existia, logo abaixo de "Deu em". Quem **digita** o "Vence em" é a Gestão, a Diretoria e a Supervisão (decisão de 24/set); os outros perfis veem a data, sem campo.
- A emergência (veterinário de confiança do tutor) continua no topo, logo depois; o peso, no fim.
- **Onde está no código:** a aba em `abrirPeludinho` (bloco `ps-saude`); `prevCheckupData` (a data mais recente); `prevUltimaDireta` (grava casas juntas).
- **Onde está no código (QA):** `prevCheckupVence` (lido por `prevValor` e pela mesa do check-up), `junto` no item do check-up em `PREV_ITENS`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (7 provas da 6.27; defeitos plantados: 12 do dev e 20 do 1º QA, todos os que mudam o comportamento pegos; 5 depois do 2º QA, todos pegos).

## O que mudou em 06/out/2026 (v 2026-10-06-02) — o alarme de remédio atravessa a meia-noite

> **Achado do QA57 (01/out/2026), já existia antes:** "num aparelho que entrou antes da meia-noite, o alarme de remédio não dispara depois da meia-noite". Story 6.32, feita no /loop autorizado pela Adriana em 06/out ("o que está pendente para você ir consertando em loop").

### (AH) A tela da hospedagem passa para o dia novo sozinha, e o celular da plantonista não recarrega de madrugada

| O que acontecia | Por quê | Agora |
|---|---|---|
| Depois da meia-noite, o celular aberto desde a noite **não tocava o alarme** das doses da madrugada | O alarme só toca quando a data da tela da hospedagem é a de hoje. A tela ficava em "ontem" até a página recarregar, e ela só recarrega **parada** (com a mão na tela, nunca) | A tela da hospedagem **passa sozinha para o dia novo, sem recarregar**, quando estava no dia em que o app abriu e nada está aberto. Junto vêm a lista de hóspedes, a agenda dos remédios, o registro das doses e o retrato do vigia, todos no dia certo |
| O aparelho parado recarregava logo depois da meia-noite | A regra da virada do dia (seção do 01/out) | O celular de quem recebe o alarme (monitores e plantonistas), **já tocado** e **com a tela já no dia novo**, não recarrega entre **0h e 6h**: a recarga apaga o toque que libera o som do celular, e o alarme da madrugada sairia mudo. A faixa diz "O dia virou — o app atualiza sozinho às 6h"; tocar nela pergunta antes de atualizar. Com a tela que não passou (ficha aberta, outra data escolhida), o aparelho parado recarrega como antes |
| Alarme mudo sem ninguém saber | O celular só libera o som depois de um toque na página | Se o alarme abre sem som, aparece a faixa **"SEM SOM NESTE APARELHO: toque na tela para o alarme tocar."** O primeiro toque em qualquer lugar destrava o som, e a faixa vira "Som ligado." no mesmo lugar (sumir fazia o botão "Dei o remédio" pular) |

- **A troca espera** quando há ficha do FILHOt aberta, alarme tocando, check-in ou almoço abertos; e não acontece se alguém escolheu outra data na tela.
- **A dose de ontem adiada na virada:** a tela espera em ontem, e o aparelho não recarrega, **até o alarme dela voltar** (ou até a dose aparecer dada, neste ou em outro aparelho): com o celular na mão, na mesa ou no bolso. Quando o adiar vence, o alarme volta a tocar e a dose é registrada em ontem. Enquanto espera, as doses do dia novo não tocam naquele aparelho — por isso a espera tem limite: o remédio que saiu da agenda sai da espera na hora; com outra data escolhida na tela (o alarme não toca ali), não há espera; e, em último caso, ela acaba **1 hora depois do fim do adiar** (1h05 depois do toque em "ADIAR 5 min"). Celular no bolso por mais que isso: a dose de ontem não volta no aparelho (o vigia do servidor cobra depois de 30 minutos). A dose de ontem que ninguém viu nem adiou não volta depois da troca (já era assim; fica para uma story própria).
- O adiado que ainda não voltou também segura a recarga da **versão nova** (como o alarme na tela), e **tocar na faixa pergunta antes** ("HÁ UM REMÉDIO ADIADO": Esperar o alarme · Atualizar mesmo assim).
- Com outra data escolhida na tela e o aparelho parado, a recarga da virada espera só se houver um adiado de hoje esperando o alarme.
- A dose dada e o espelho nas fichas irmãs (o mesmo remédio em duas fichas) ficam no **mesmo dia**, mesmo que a tela passe para o dia novo no meio.
- O Day Care (turma, falta automática, planilha) continua travado até a recarga, como já era: a faixa **"O dia virou — toque para atualizar"** segue acesa.
- Quem não recebe o alarme (Gestão, recepção, consultoras) recarrega na virada como antes.
- **Limites conhecidos:** sem internet na virada, a lista de hóspedes de ontem continua até a planilha responder (os remédios seguem os de quem dormiu). O navegador do teste não aplica a regra de som do celular: o "SEM SOM" é a garantia de que ninguém fica sem saber.
- **Onde está no código:** `zDiaTelaAvancar`, `zDiaSegurarNoite`, `zDiaAdiadoAtivo` (com `despMedSnoozePend`, os adiados que ainda não voltaram, e `DIA_ADIADO_TETO_MS`), `medDiaVelhoAuto` (em `checarDespertadorMed`), `DIA_TELA_AUTO`, `DIA_NOITE_ATE`, `medSomMudo`, `medSomConferir`, a pergunta em `aplicarVersaoNova`, `_diaLog` em `registrarDoseAgendadaGlobal`; `zMotivoParado` e `zViradaDoDiaTick` olham o adiado.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (10 provas da 6.32 e 1 prova da 6.21 atualizada; defeitos plantados: 20 do dev; 22 do 1º QA, dos quais escapam 6 (Q1 equivalente; Q7, Q10, Q11, Q20 e Q22, lacunas baixas); 10 depois do 2º QA, todos pegos). Chromium com o relógio adiantado: na versão anterior, a página recarregava na virada; agora a tela passa para o dia 07, o alarme das 00:05 abre e a dose é registrada no dia 07. Com a dose adiada às 23:58: na mesa, no bolso e com a página congelada, o alarme volta com a tela em ontem e nada recarrega por cima.

## O que mudou em 06/out/2026 (v 2026-10-06-01) — Lançamentos do dia: o banho para em 17:30, e a tela não perde o lugar nem o cursor

> **Adriana, 06/out/2026:** *"Já fiz uma reclamação sobre o horário, para colocar horário de banho em lançamentos do dia. Fica difícil de digitar, toda hora tem que voltar. Então, horário de banho, de veterinário, saída mais cedo, tudo que tem horário, ser mais fácil. Pode ser a marcação mesmo. Horário de banho, por exemplo, a gente pode marcar é, 14, 14h15, 14h30, marcar de 15 em 15 minutos até as 17h30. Último horário, 17h30."* Story 6.31.

### (AG) O último horário é 17:30 em tudo, e a busca não perde o que está sendo digitado

| O que acontecia | Agora |
|---|---|
| O banho ia até 17:45 (pedido de 02/out) | **Tudo vai até 17:30**, o banho também. Um banho às 17:45 (fixo ou já lançado) continua valendo: aparece com o relógio aberto, em «outro horário» |
| Quando a tela se redesenhava sozinha (a confirmação da planilha de um lançamento, as leituras ao abrir a tela ou trocar o dia, a fila que roda de 10 em 10 minutos), **a busca perdia o cursor** (o teclado do celular fechava no meio do nome) e, quando a lista de cima mudava de tamanho, **a tela pulava** (239 px no teste) | A tela guarda **o campo com o cursor** e **o cartão que importa** (o último tocado, até 4 s antes, ou o que está no terço de cima da tela). Depois do redesenho, o campo (ou, sem campo, o cartão) volta ao mesmo lugar, sem deslizar, e o cursor volta ao campo, no mesmo ponto do texto. O relógio (hora digitada no teclado) fica de fora, como era |

- Os horários prontos (seção (AD)) continuam iguais: as horas de 8h a 17h, os minutos de 15 em 15, e «outro horário» para o resto.
- A rolagem foi testada também sem a âncora do navegador, como no iPhone (o iPhone de verdade não foi testado: vale conferir 2 minutos no celular da recepção).
- A rolagem que o próprio app faz não conta como "alguém mexeu" (a trava e a recarga do aparelho parado seguem iguais).
- O campo com o cursor só é a âncora quando está **à vista**: quem subiu até outro cartão continua vendo o mesmo cartão parado (o cursor continua no campo).
- **Onde está no código:** `dashAncoraGuardar`, `dashAncoraVoltar`, `dashAncoraEscolher`, `dashToqueLigar` (chamadas no começo e no fim de `renderDash`); `DASH_HORA_FIM` vazio.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (5 provas da 6.31 e 2 provas da 6.26 atualizadas para o 17:30; defeitos plantados: 19 do dev, todos pegos, e 22 do QA, todos os que mudam o comportamento pegos). Teste no Chromium a 375 px, com e sem a âncora do navegador: antes, 4 falhas (cursor perdido, cartão pulando 239 px); depois, 17 de 17.

## O que mudou em 02/out/2026 (v 2026-10-02-08 e -09) — «Ele está aqui» no aviso do banho de quem faltou, e o almoço

> **Adriana, 02/out/2026** (com as fotos das janelas "NÃO VEIO" da Luna, do Pipoca, da Mika e do Rafael): *"Luna também está aqui! Eu peguei ela!!! eu a levei!"* · *"Pipoca veio! eu o peguei"* · *"Mika idem está aqui"* · *"também está aqui — coloque a opção está aqui (para que se não foi feito o checkin do corpo apareça que tem que fazer!!! e o almoço!!!)"*. Story 6.29.

### (AF) Quem já está aqui volta para a chamada em um toque, e o check-in que falta aparece

| O que acontecia | Por quê | Agora |
|---|---|---|
| A Luna, o Pipoca, a Mika e o Rafael chegaram sem o check-in de entrada e, ao meio-dia, entraram como **falta na chamada**. A janela "NÃO VEIO — TINHA BANHO" só oferecia **Liberar o horário**, **Ainda vem** e **Decidir depois** | nenhuma das três tirava a falta; quem tirava era o check-in de entrada ou o ✓ Veio da Chamada, e a janela não dizia isso | a janela ganhou **«Ele está aqui»** (ou **«Ela está aqui»**, pela ficha). Um toque marca **VEIO** na Chamada, segura o banho e, **se o check-in do corpo de entrada não foi feito**, avisa "FALTA O CHECK-IN DO CORPO DE …" com **Fazer o check-in agora** (abre o check-in de entrada já com o nome dele) e **Abrir o almoço** |

- **O almoço:** a falta do meio-dia **não** tira ninguém da grade do almoço; só a **falta avisada na planilha** tira. Agora, quem avisou a falta e está como **VEIO** na chamada (veio mesmo assim) **volta para a grade** — a mesma regra do banho. A grade do almoço passou a acompanhar a chamada ao vivo.
- **O mesmo ✓ Veio da Chamada:** o remédio lançado na recepção volta para a fila do alarme, e a pendência de prevenção avisa a chegada.
- **Com o check-in já feito,** a tela só confirma: "… ESTÁ NA CHAMADA". Sem conseguir ler o check-in: "CONFIRA O CHECK-IN DO CORPO DE …".
- **Quem tem as atividades limitadas no Time:** a tela só oferece o atalho para o que a pessoa pode abrir; sem o check-in, diz "Peça a quem faz o check-in do corpo: Day Care › Check-in do corpo".
- **Xarás:** com duas fichas do mesmo nome, o aviso e o cartão mostram o tutor (ou a raça): "BOLT - RUI NÃO VEIO…".
- **A busca do Check-in do corpo** passou a filtrar a lista na hora (antes ficava presa no nome até outra coisa redesenhar a tela).
- **A próxima pergunta espera:** com um exame do corpo aberto **na tela**, o aviso do próximo FILHOt não abre por cima. O exame deixado pela metade (saiu pelo menu) não cala os avisos do aparelho (v -09).
- **Se a presença não grava** (o banco recusou), a tela diz "A PRESENÇA NÃO FOI MARCADA", nada é segurado e a pergunta volta. **Aviso de outro dia** (aparelho que virou a noite aberto): "O DIA VIROU", nada é marcado.
- **Outro aparelho já liberou (ou está liberando) o horário:** a tela diz isso, em vez de prometer o banho.
- **No Hoje na Zêluz,** o cartão "Banho de quem faltou" tem o mesmo botão ao lado de **Liberar o horário**, até o horário ser liberado.
- **Quem pode:** quem decide o banho de quem faltou (recepção, Supervisão, Gestão, Diretoria).
- **O exame do corpo continua obrigatório:** sem ele, o FILHOt continua em "ainda sem check-in do corpo" no painel do monitor.
- **Onde está no código:** `banhoFaltaEstaAqui`, `banhoFaltaEstaAquiUI`, `banhoFaltaAquiTexto`, `banhoFaltaNomeVisivel`, `banhoFaltaAtivLiberada`, `banhoFaltaIrAoCheckin`, `banhoFaltaIrAoAlmoco`, `almFaltouAvisada` (grade do almoço) e `onDcBusca`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (7 provas da 6.29 e 2 provas antigas atualizadas; defeitos plantados: 25 + 22 + 5, todos pegos).

## O que mudou em 02/out/2026 (v 2026-10-02-03, -05 e -07) — quem dormiu aqui ou só está na hospedagem não recebe a falta automática do meio-dia; leitura que falha não vira falta

> **Adriana, 02/out/2026** (com a foto da janela "ROMEO NÃO VEIO — TINHA BANHO ÀS 15:30"): *"o romeu está aqui e dormiu de ontem para hoje. Precisamos rever isso! Porque ontem teve erro e agora também"*. Story 6.28.

### (AE) A falta automática das 12h pula quem passou a noite na casa

| O que acontecia | Por quê | Agora |
|---|---|---|
| O Romeo dormiu aqui de 01/10 para 02/10 e, ao meio-dia, saiu como **"faltou"** na chamada. A janela "ROMEO NÃO VEIO — TINHA BANHO ÀS 15:30" oferecia **Liberar o horário** do banho dele | a falta automática das 12h compara a turma com o check-in de entrada do Day Care e com a chamada. Quem dormiu aqui não passa pelo check-in de entrada: já estava na casa | a falta automática **pula quem dormiu aqui na noite anterior**. Ele fica sem marcação na chamada; quem marca **VEIO** ou **FALTOU** é a recepção ou o monitor |

- **Onde a noite fica registrada (as três portas valem):**
  1. a **estadia da hospedagem** (aba Hóspedes, check-in de hospedagem ou de pernoite), menos a cancelada ou recusada;
  2. a **pernoite ou o hóspede lançado no Plantão**, com o número de noites, menos quem a Gestão tirou do dia;
  3. a **pernoite dos Lançamentos do dia** (a fila do check-in de pernoite), menos a cancelada ("Tutor buscou, cancelar").
- **Se o app não consegue ler o check-in, a chamada ou a noite de ontem** (sem rede), o dia não fecha naquele momento: ninguém recebe falta, e o app tenta de novo a cada 30 segundos. O aviso das 12h15 no Telegram continua cobrando se o dia não fechar.
  - Antes (v 2026-10-02-05), a leitura do check-in que falhava chegava **vazia**, e a chamada que falhava também: "ninguém fez check-in" virava falta para a turma inteira, por cima até do "veio" da chamada. Caminho achado depois da Luna, do Pipoca e da Mika (02/out): não confirmado que foi o caso deles; corrigido de qualquer jeito.
- **Só hóspede (v 2026-10-02-07):** quem está na turma **só por causa da estadia da hospedagem** (não é do Day Care naquele dia) não recebe a falta automática, inclusive no dia em que chega. Era o caminho provável do "ontem teve erro" do Romeo: no dia de entrada, ele não passou pelo check-in de entrada do Day Care e recebeu falta. O aluno do Day Care que tem estadia começando no dia continua com a regra de sempre.
- **Pendências de prevenção:** quem ficou sem a falta automática (dormiu aqui ou está na hospedagem) não vira "não veio" para o remédio, o vermífugo, a coleira, a escova ou a hidratação lançados depois do meio-dia. A trava do dia guarda quem é (`sem_falta`).
- **Check-out antes da saída prevista:** a noite que vale é a do check-out. Quem foi embora em 28/09 com saída marcada para 05/10 não "dorme aqui" até 05/10.
- **Xarás:** o registro que só tem o nome (sem tutor e sem ficha ligada) só decide quando o nome é único no cadastro. Quem a Gestão tira do dia é conferido pelo nome **e** pelo tutor.
- **Rastro:** o Painel do Dia registra "sem falta automática porque dormiram aqui: …" e "… porque estão na hospedagem (não são do Day Care hoje): …", com os nomes. Quando ninguém recebe falta por causa disso, o rastro diz "ninguém recebeu falta".
- **Limites conhecidos:**
  - a tela do **Check-in do corpo** continua listando quem dormiu aqui e os só hóspedes do dia em "FALTARAM HOJE … entraram como falta" (é a área protegida do check-in; não foi mexida);
  - uma hospedagem agendada que não aconteceu, ou uma pernoite "aguardando" nunca cancelada, deixa o FILHOt sem a falta automática (a chamada continua valendo).
- **Não muda:** quem passou pelo check-in de entrada, quem já tem marcação na chamada, a falta avisada na planilha, os feriados, o sábado e o domingo.
- **Hoje (02/out), com o Romeo:** a correção vale do próximo meio-dia em diante. A falta de hoje se desfaz na **Chamada** (tocar **VEIO**), e o banho fica com ele em **«Ele ainda vem»**.
- **Onde está no código:** `faltaDormiuAqui`, `faltaDormiuEste`, `faltaDormiuLer` e o laço da turma em `aplicarFaltaAutomatica`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (13 provas da 6.28; defeitos plantados: 26 + 5 + 19, todos pegos).

## O que mudou em 02/out/2026 (v 2026-10-02-02) — horários prontos em um toque nos Lançamentos do dia

> **Adriana, 02/out/2026:** *"O lançamento do dia, banho, o horário está péssimo para escrever, o horário de veterinário, de tudo, está péssimo para poder colocar. Tem que clicar várias vezes, precisa de melhorar essa forma. Talvez já vir com horários prontos: 14, 14:15, 14:30, 14:45, 17, 13 horas, 15 horas e por aí vai. [...] Indo até o horário de 5 e meia, que dá para marcar outro; 5 e 45 dá para marcar ainda banho."* Story 6.26.

### (AD) O horário em um ou dois toques

| Antes | Agora |
|---|---|
| O relógio do celular, que pede vários toques para chegar à hora | **Botões:** as horas, de **8h a 17h**; um toque já escolhe a hora cheia (14h → 14:00). Logo abaixo, os minutos daquela hora, de 15 em 15 (14:00, 14:15, 14:30, 14:45): um segundo toque, só se precisar |

- **Até onde vai:** tudo até **17:30**, o banho também (desde 06/out, seção (AG); antes, o banho ia até 17:45).
- **outro horário** abre o relógio de sempre, para o que fugir da grade (7:30, 18:00, o remédio da noite). Uma hora fora da grade já aparece com o relógio aberto.
- Tocar de novo na mesma hora não apaga os minutos; tocar em outra hora troca para a hora cheia.
- A hora escolhida aparece escrita ("Horário: 14:30") e acesa. O lançamento, a planilha, a TV e o alarme leem a mesma hora de sempre.
- Vale na busca, no painel do FILHOt escolhido e no nome escrito à mão (Avaliação). O "Avisado às" da Pernoite continua com o relógio.
- **A hora vem antes da busca**, em toda busca que pede horário (Banho, Veterinário, Sai mais cedo, Avaliação e Medicação): no Veterinário, no Sai mais cedo e na Avaliação, tocar no nome já lança, então a hora fica escolhida antes; e os nomes sugeridos ficam colados no campo, sem o teclado do celular escondê-los.
- Botões grandes para o dedo (42 px de altura).
- **Onde está no código:** `dashHoraGrade`, `dashHorarioHTML`, `dashHoraHora`, `dashHoraEscolher`, `dashHoraAbrirOutro`, `dashHoraOutro`, `DASH_HORA_FIM` (vazio desde 06/out: todos até 17:30).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (5 provas da 6.26; 26 defeitos plantados, 26 pegos).

## O que mudou em 02/out/2026 (v 2026-10-02-01) — reposição e troca: "ele veio" com o dia certo, e a baixa sozinha pelo check-in

> **Adriana, 01/out/2026:** *"Fui procurar o Billy Paul, que ele faltou hoje. E aqui está que ele estava marcado para o dia 30/09 e ele não repôs. Ele repôs, sim. Ele veio no dia 30/09, tomou banho, fez tudo isso. Eu tenho que ter a opção de falar que ele veio. E tem que configurar melhor como isso vai funcionar."* Story 6.25.

### (AC) A troca e a reposição marcadas não dependem mais de lembrar de tocar

| O que acontecia | Por quê | Agora |
|---|---|---|
| A troca do Billy Paul (falta na terça 29/09, vinda na quarta 30/09) aparecia no dia seguinte como "Estava marcada para 30/09 e ele não repôs", e a única saída era **desmarcar**, o que deixava a reposição valendo (1 a mais no saldo) | o app só dava a troca ou a reposição marcada como cumprida com o toque em **Veio repor hoje**, no próprio dia. O check-in do dia não contava; e, como o próprio app pôs o Billy Paul na planilha e na TV, parecia resolvido | **Reposições** › a linha diz **"Estava marcada para 30/09/2026 (troca, no lugar de 29/09): a vinda não foi marcada · ele veio · desmarcar"** (ou **ela veio**, pela ficha). **Ele veio** pergunta e grava a vinda **com o dia marcado** (30/09), não com o de hoje |
| (nada) | — | **A baixa sozinha:** do dia seguinte em diante, o app confere a chamada (e, se ela estiver vazia, o check-in) **daquele** dia. Quem tem "veio" na chamada ou passou pelo check-in tem a troca ou a reposição dada como cumprida sozinha, sem ninguém tocar. "Faltou" na chamada não dá baixa; sem registro nenhum, fica o **ele veio** para a recepção |

- **Troca:** a vinda conta como troca ("TROCA CUMPRIDA"); as reposições do tutor não mudam e nenhuma mensagem de reposição vai para ele.
- **Reposição:** o saldo desce 1, com a mensagem pronta para o tutor ("como usou 1 em 30/09/2026, ficará com…").
- **Quando a baixa NÃO é sozinha** (ter vindo não prova que veio pela reposição; fica o botão): num **dia fixo** dele, e num dia em que ele estava **hospedado na Auaulândia** (o hóspede entra na chamada do Day Care durante a estadia).
- **Uma vinda por dia, nunca duas baixas:** o registro é um só por FILHOt e por dia. Duas marcadas no mesmo dia, dois aparelhos, ou o botão junto com a baixa sozinha dão **uma** vinda. Dia que já tem vinda (por **Veio repor hoje**, pela Reposição dos Lançamentos do dia, pela hospedagem) não recebe outra. Se sobrou uma 2ª marcação nesse dia, a linha diz **"Marcada outra vez para 30/09/2026: esse dia já tem um uso registrado (veja o Extrato) · desmarcar"**.
- **Vinda devolvida no Extrato** (**Devolver**, de qualquer caminho: **ele veio**, baixa sozinha, **Veio repor hoje**): a linha volta, e **ele veio** pode marcar de novo. A baixa sozinha respeita a devolução de uma pessoa: não refaz nem relê. A única exceção é o **Tirar só o lançamento** dos Lançamentos do dia (sai só o lançamento repetido; a vinda continua, e a baixa sozinha pode acertar).
- **Lançamentos do dia › Reposição** num dia que já tem um uso: pergunta antes ("Thor já tem um uso registrado em 30/09"), com **Lançar sem abater**, **Abater mesmo assim** ou **Não lançar**. A planilha recebe; o saldo não desce duas vezes sem a pessoa dizer. **Abater mesmo assim** passa pelas mesmas checagens de sempre: sem saldo, avisa "não tem saldo de reposição" (nunca deixa o saldo negativo); com dia reservado em hospedagem, avisa.
- **Veio repor hoje** num dia que já tem um uso: pergunta antes ("Thor já tem um uso registrado hoje"), com **Marcar mesmo assim** ou **Não marcar**.
- **Extrato:** a vinda aparece no dia marcado, com "Marcado depois: veio em 30/09, pela troca de 29/09" ou "Baixa automática pelo check-in de 30/09".
- **Marcados para repor HOJE:** o aviso diz que dá para marcar **Veio repor hoje** e que, se ninguém marcar, o check-in de hoje dá a baixa sozinho no dia seguinte (menos em dia fixo ou de hospedagem).
- **Quem roda a baixa sozinha:** os aparelhos de quem lança reposição (recepção, Supervisão, Gestão), com o cadastro e as estadias já carregados, pouco depois de abrir o app, de 10 em 10 minutos e ao abrir Reposições. Olha até 60 dias para trás. Nunca num aparelho aberto desde ontem. Do check-in, lê só a hora em que terminou.
- **Onde está no código:** `repPresencaNoDia`, `repDiaTemUso`, `repVeioChave` (nó `veio-{dia}`, por transação), `repVeioDevolvido`, `repVeioCorte`, `repEstadiaCobre`, `repHospedadoNoDia`, `repVeioRegistro`, `repVeioGravar`, `repVeioCredito`, `repVeioNoDia`, `repBaixaPelaPresenca`, `renderReposicao`, `dashLancar` (Reposição, com `seguirRep`), `repUsar`, `repDevolverUsoGravar` (`so_lancamento`), `dashRemover`. Só leitura de `daycare/chamada/{dia}` e `daycare/checkin-corpo/{dia}/{FILHOt}/fim`: nada muda no check-in.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (21 provas da 6.25; 50 defeitos plantados, 50 pegos).

## O que mudou em 01/out/2026 (v 2026-10-01-01) — o dia virou: o aparelho aberto desde ontem não lança a turma errada

> **Adriana, 01/out/2026 (quinta), 7h50:** *"Acabei de lançar em banhos recorrentes um banho para o Nock da Claudia toda quinta às 17hs. E não apareceu no Dashboard; a Lana da Marcela também tem banho hoje recorrente e não está no lançamento do dia."* Story 6.21.

### (Z) O aparelho sabe que o dia virou

| O que acontecia | Por quê | Agora |
|---|---|---|
| O banho fixo de quinta não ia para a planilha, e o que outro aparelho tinha posto **saía** dela (Lana sumiu dos Lançamentos do dia) | o celular que volta do bolso e o computador ligado a noite toda não recarregam a página; o dia da semana do Day Care (`HOJE_DIA`) é calculado uma vez, ao abrir. Na quinta, o aparelho aberto na quarta montava a turma de **quarta** | o app guarda a data em que abriu (`APP_DIA_ABERTO`). Quando ela deixa de ser a de hoje, **o aparelho se atualiza sozinho**: o que ficou aberto à noite já está trancado (a tela tranca em 5 minutos sem toque, menos na tela do almoço) e atualiza logo depois da meia-noite; o celular que volta do bolso depois de 3 minutos ou mais fora atualiza na hora, antes do primeiro toque. Com alguém usando, aparece a faixa do topo **"O dia virou — toque para atualizar"**, e ele atualiza assim que ficar parado (a mesma regra da versão nova). **Nunca** com alarme na tela (o de remédio das 23h55 que ninguém respondeu), check-in aberto (corpo, pertences, ou a ficha da hospedagem na tela com algo ainda não salvo), almoço ou sem internet; no computador, voltar à aba só acende a faixa. Tocar na faixa com um check-in aberto ou sem internet também não atualiza: o app diz o que fazer |
| No aparelho aberto desde ontem, a fotografia da turma das 7h e a **falta automática das 12h** usavam a turma de ontem | a mesma conta (`turmaDeHoje()` com o `HOJE_DIA` velho) | enquanto não recarrega, esse aparelho **não grava nada do dia**: nem a planilha, nem a fotografia da turma, nem a falta automática. Os outros aparelhos gravam. O botão **Conferir a planilha agora** e o **Mandar agora** dizem "este aparelho ainda está com o dia 30/09: toque na faixa do topo para atualizar" |
| Com o Day Care aberto na aba de outro dia (ex.: sexta), a planilha de hoje saía com a turma de sexta | a conta de hoje lia a aba (`turmaDoDia()`), não o dia | a conta de hoje usa a turma de **hoje**, qualquer que seja a aba (`turmaDeHoje()`, a mesma porta da falta automática desde 11/ago) |
| O banho dos próximos 14 dias saía pelos dias do cadastro importado | o motor lia `p.dias` | lê os dias da **ficha** (`pelDias`), os mesmos do Day Care |
| Banho fixo combinado num dia em que, pela ficha, o FILHOt não vem ao Day Care sumia calado | o motor só lança o banho de quem vem naquele dia, e a linha não avisava | a linha de **Banhos recorrentes** avisa: "Pela ficha, Nock não vem ao Day Care na quinta (vem: …). O app só lança o banho fixo em dia de Day Care. Se vem só para o banho, lance à mão nos Lançamentos do dia; se passou a vir ao Day Care na quinta, marque a quinta nos dias da ficha." (Marcar a quinta para quem vem só para o banho faria a falta das 12h tirar o banho da planilha.) Nada muda no que é gravado |

- **Ninguém precisa mais fechar e abrir o app** nem tocar em "Conferir a planilha agora": depois de atualizado, o aparelho confere a planilha sozinho (em até 5 minutos; 20 segundos depois de salvar um banho fixo).
- **O "Salvo" do banho fixo** num aparelho ainda com o dia de ontem diz: "Salvo. Este aparelho ainda está com o dia 30/09 e se atualiza sozinho quando ficar parado; aí a planilha se acerta. Para ser agora, toque na faixa do topo."
- **Fica para decisão da Adriana:** lançar o banho fixo de quem vem **só para o banho** naquele dia (sem Day Care).
- **Onde está no código:** `APP_DIA_ABERTO`, `appDiaVelho`, `appDiaVelhoData`, `appDiaVelhoTexto`, `zDiaCheckinAberto`, `zDiaTrabalhoAberto`, `zViradaDoDiaTick`, `zViradaDoDiaVisibilidade`, `zFaixaVersao`, `zMotivoParado` (alarme na tela não é "parado", também para a versão nova), `zRecargaQuandoParado` (com o dia velho, a recarga da versão fica com o vigia do dia), `aplicarVersaoNova` (o toque na faixa com o dia velho avisa em vez de atualizar), `repMandarAgora`, travas em `dashAutoSincronizar`, `dashAutoRodar`, `gravarTurmaDoDia`, `aplicarFaltaAutomatica`; `dashAutoCalcular` (hoje com `turmaDeHoje`), `dashAutoVemNoDia` (`pelDias`), `banhosAvisoDiaSemDaycare`, `banhosSalvar`, `banhosGravarExcecao`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (13 provas da 6.21; 45 defeitos plantados, 45 pegos). O `tests/harness.js` passou a dizer, nos cenários com relógio de mentira, que o aparelho abriu no dia simulado.

### (AA) Mensagem de renovação: o prazo do plano, "da Amora" e "manter ou aumentar" (v 2026-10-01-02)

> **Adriana, 01/out/2026:** *"Plano Silver, Gold, Black, as pessoas não sabem: é mensal, trimestral ou semestral. [...] Precisa ser fácil, encantadora e não vir com do, da. A Amora é uma menina, a gente já tem esses dados."* Story 6.22.

Ficha › aba **Plano** › **Mensagens para o tutor** ("Plano finalizou — oferecer renovação" e "Renovação confirmada"):

| Antes | Agora |
|---|---|
| "no plano Silver" (Gold, Black) | **o prazo:** "Hoje, ela vem uma vez por semana, na quarta, no plano **semestral**." (Silver é mensal, Gold é trimestral, Black é semestral, pela tabela de planos) |
| "do(a) Amora", "ele(a)" | **pelo sexo da ficha:** "da Amora", "do Nelson", "ela", "ele". Sem o sexo na ficha, a frase usa o nome ("de Bia", "Hoje, Bia vem") |
| "1x por semana, nos dias quarta" | "**uma vez por semana, na quarta**"; "duas vezes por semana, na segunda e na quarta". Sem dia marcado, vale o nº de aulas do plano; sem nenhum dos dois, a frase não inventa a frequência |
| "Vamos manter o mesmo plano e os mesmos dias? Ou deseja alterar…" | "**Vamos manter uma vez por semana para a Amora ou vamos aumentar?**" (com cinco vezes, só "Vamos manter…?") |
| (nada) | **plano mensal** ganha o convite: "E que tal passar para o plano trimestral? A mensalidade fica menor, e o Nelson ainda ganha 10% de desconto na Auaulândia (no semestral, 15%)." Os números saem da tabela de planos do app (a mesma da mensalidade e do orçamento); o que a tabela não confirma não aparece |

- **O resto é o texto da Adriana** (pedido de 15/jul): o parágrafo "O Day Care da Zêluz é muito mais do que companhia: é rotina de movimento, socialização, estímulo cognitivo…" fica como ela escreveu.
- **Onde está no código:** `msgPlanoFinalizou`, `msgRenovado`, `RENOV_VEZES`, `renovArtigo`, `renovONome`, `renovDoNome`, `renovParaNome`, `renovDiasNa`, `renovPrazo`, `renovAulasMsg`, `renovPct`, `renovConviteTrimestral`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (9 provas da 6.22, entre elas o texto inteiro da Amora e do Nelson; 14 defeitos plantados, 14 pegos).
- **Ainda diz "plano Silver" ao tutor (fora desta mudança):** o recibo de **Lançar pagamento**.

### (AB) Orçamento: a raça de quem nunca hospedou vem da lista (v 2026-10-01-03)

> **Adriana, 01/out/2026:** *"Para quem nunca hospedou, a raça, que é obrigatória: ter as principais raças que a gente trabalha já pré-cadastradas, para quando começar a digitar, para não digitarem errado. Dachshund, Westie, Spitz, Poodle, York, Shih Tzu, Maltês, SRD — tudo que já tem cadastrado no Day Care."* Story 6.23.

Orçamento › quadro **"Nunca hospedou? Escreva aqui!"** › **Raça**:
- **Ao começar a digitar, aparece a lista**: as raças da casa (o mesmo banco do cadastro e do check-in), as da planilha da hospedagem e as do cadastro do Day Care, sem repetir a mesma raça escrita de outro jeito.
- **A grafia certa entra sozinha**: maiúscula, acento, espaço e hífen não importam ("shih-tzu" vira Shih Tzu). Os apelidos de sempre levam ao nome da lista: westie → West Terrier; york, yorkie → Yorkshire; salsicha, teckel, daschund → Dachshund (Salsicha); spitz, lulu → Spitz Alemão (Lulu da Pomerânia); vira-lata, srd → SRD (vira-lata); shitzu → Shih Tzu; maltes → Maltês; e as grafias curtas do cadastro: lhasa → Lhasa Apso, cocker → Cocker Spaniel, cavalier → Cavalier King Charles, jack russell → Jack Russell Terrier, norfolk → Norfolk Terrier, shetland/sheltie → Pastor de Shetland, shiba inu → Shiba, bulldog francês → Buldogue Francês. Raças parecidas (maltipoo, yorkipoo, spitz japonês, Biewer Yorkshire) não viram a raça errada: perguntam.
- **As raças do cadastro ficam numa lista à parte** (`RACAS_CADASTRO`): só servem de sugestão e de grafia certa. A lista da casa (`RACAS`), que também ajuda a separar raça de tutor na planilha, não muda. O texto de cada sugestão é escapado (raça com aspas não quebra a lista).
- **Raça fora da lista pergunta** antes de entrar: "A raça "X" não está na lista", com **Corrigir** ou **Usar assim mesmo**. Raça rara não fica bloqueada; erro de digitação não passa calado.
- **Onde está no código:** `racaChave`, `RACA_APELIDOS`, `racaCanonica`, `RACAS_CADASTRO`, `racasListaRender`, `orcRacasAtualizar`, `orcAddAvulso`, campo `orcAvRaca` (`list="racasList"`).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (7 provas da 6.23, inclusive sobre o cadastro de fábrica de 118 FILHOts e a lista pronta ao abrir o app; 19 defeitos plantados, 19 pegos).

## O que mudou em 30/set/2026 (v 2026-09-30-01) — Time › quem pode ver o quê; renovação paga antes do fim do plano

> **Adriana, 30/set/2026:** *"Preciso dar acesso à veterinária a Hoje na Zêluz, Quem chamar hoje, Lançamentos do dia, e o que é ali da Central Zêluz, e não estou conseguindo. Aparece, eu já dei Hoje na Zêluz, Quem chamar hoje, Pendências de prevenção, mas não deu. Eu preciso de conseguir dar acesso a todas as pessoas que eu quiser. [...] Eu preciso que tudo esteja atualizado."* Story 6.19.

### (X) A tela liberada no Time aparece, abre e vale na hora

| O que acontecia | Por quê | Agora |
|---|---|---|
| O item aparecia, mas a tela respondia "Esta tela é da Central Zêluz" (Hoje na Zêluz, Quem chamar hoje, Pendências de prevenção, Vencimentos) | a porta da tela conferia só o PAPEL; o menu já somava a tela liberada | a porta faz a mesma conta do menu: **papel OU tela liberada no Time** (`podeTela`) |
| O item ficava solto, sem o nome da gaveta; os dias dos Vencimentos (Hoje a Sexta) nem apareciam | a regra de papel da veterinária esconde todo cabeçalho e todo item fora do caminho dela | a tela liberada fica marcada (`data-concedido`) e o cabeçalho da gaveta e os dias vêm junto |
| Lançamentos do dia, Prevenção, Peso e mais 5 telas não estavam na lista do Time | a lista nunca as teve | entraram: Enriquecimento Ambiental, Ritmo do Time, Conferência do dia, Banhos recorrentes, **Lançamentos do dia**, Peso, Pesquisa com a Família Multiespécie e **Prevenção** |
| A lista do Time tinha outra ordem e outras gavetas (Conferência do check-in, Hóspedes, Plantão e Check-out em "Central Zêluz · AuAulândia") | foi escrita antes do menu de 17/set | segue o menu **na ordem dele**, gaveta por gaveta, com o mesmo nome; as atividades do Day Care aparecem na gaveta "Ecossistema Daycare · Day Care" |
| Marcar uma tela no Time não avisava que faltava salvar | o aviso só nascia no nome, na senha e no horário | marcar tela ou atividade mostra "Há mudanças não salvas" |
| Depois de salvar, nada mudava no celular da pessoa até ela **sair e entrar de novo** (recarregar não bastava) | as telas eram lidas uma vez, na senha | quando o Time muda no banco, o aparelho relê **as telas dela** e redesenha o menu, sem tirar ninguém da tela (`permReaplicarDoTime`) |

- **Ninguém perde tela no dia da publicação.** As 8 telas novas **só liberam**, como já era com Hoje na Zêluz, Quem chamar hoje, Pendências de prevenção e Vencimentos: marcada, aparece; desmarcada, fica o que o papel já mostrava (a recepção continua com os Lançamentos do dia, a veterinária com o Peso). No Time, essas telas aparecem com **"· vem com o papel"** (borda tracejada) quando o papel da pessoa já as mostra, e o resumo "Hoje esta pessoa vê" as lista como "(pelo papel)". As outras 16 continuam com a regra de sempre: quem tem lista vê só o marcado.
- **A dica das atividades do Day Care estava errada** ("nada marcado = vê todas"): para quem entra pelo Time, nada marcado = **nenhuma** atividade. A dica agora diz isso, e diz que atividades e papel valem na próxima entrada com a senha (só as telas valem na hora).
- **Na entrada, a gaveta de cada tela liberada já abre** (a veterinária continua com o Peso à vista); o rótulo "Planos e cobranças" some quando nada abaixo dele está à mostra.
- **Não se concedem pelo Time** (e a própria tela do Time diz isso): a mesa de cada papel (O que fazer hoje e os dashboards Meu, Consultoras, Amanda, Márcia e Adriana), Início, Escala e plano do dia (é da Márcia), Financeiro do plantão, Configurações (senhas do sistema), Abertura do dia (vai para quem abre a casa) e Agenda (em breve).
- **Achado no caminho:** o monitor e o aprendiz viam os dias dos Vencimentos (Hoje, Segunda...) soltos em Central Zêluz › Day Care, sem ter a tela — o toque dava em "Esta tela é da Central Zêluz". A gaveta volta a sumir junto com o item (`ajustarAcordeoes` respeita `data-acc-perm`).
- **A conversa com o tutor na ficha** e o **arquivo da turma com telefones** seguem a mesma regra do Hoje na Zêluz e do Quem chamar hoje: quem recebeu uma dessas telas no Time também os tem.
- **Onde está no código:** `NAV_PAGINAS_ALL`, `NAV_PAGINAS_SO_LIBERA`, `NAV_PAGINAS_FORA`, `permEditInner`, `toggleMonPagina`, `paginaConcedida`, `podeTela`, `permCarregarConcedidas`, `permMarcarConcedida`, `aplicarPaginasPessoa`, `aplicarPermMenu`, `ajustarAcordeoes`, `ajustarSubcabecalhosMenu`, `permReaplicarDoTime`, portas em `hojeAbrir`, `contatosAbrir`, `pendAbrir`, `vencAbrir`, `vencRender`, `fichaTutorPode`, `turmaPodeBaixar`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (20 provas da 6.19, entre elas: cada tela do Time está na mesma gaveta, com o mesmo nome e na mesma ordem do menu lido do próprio HTML; nenhuma tela do menu fica de fora sem aviso) e `tests/menu-concessao-navegador.test.js` (27 provas no navegador, sem banco: a veterinária alcança e abre as telas liberadas; liberar e tirar valem na hora; quem não recebeu nada vê a barra de sempre).

### (Y) Renovação de planos: pagou antes de o plano acabar, vale o período seguinte

> **Adriana, 30/set/2026**, renovando o Baque e o Nelson: *"Eles fizeram o pagamento hoje, 30/09, valor da mensalidade... vai valer do dia 1º/10 até 31/10. E ao confirmar dá 30/09 até 30/09. E não está renovando... quatro renovações aqui que não deram certo. Ela precisa de automaticamente ir. O tutor já pagou."* Story 6.20.

| O que acontecia | Por quê | Agora |
|---|---|---|
| Pago em 30/09, o mensal "valia de 30/09 até 30/09" | a data do pagamento era também o começo do plano, e o plano vale até o fim do mês em que começa | o app guarda as duas coisas: **a data do pagamento** (`renov.inicio`, é por ela que o Financeiro conta o mês) e **o começo do período** (`renov.vig_inicio`, quando é outro dia) |
| Cada Confirmar gravava de novo o mesmo 30/09 e a renovação "não ia" | a conta dava sempre o mesmo vencimento | o período sai de 3 regras (abaixo); e um pagamento novo cuja conta **não estende** o plano pergunta antes: "Começar em 01/10, valendo até 31/10" ou "Manter" |
| Quatro tentativas iguais viraram quatro "Renovações anteriores" | cada Confirmar empurrava uma cópia do plano gravado | Confirmar o mesmo plano de novo não empurra cópia; as tentativas iguais que já estão lá aparecem numa linha só, "N vezes iguais (tentativas repetidas)" — nada é apagado do banco |

**As 3 regras do começo do período** (`renovVigenciaComeca`), nesta ordem:
1. **Corrigir o plano gravado** (a mesma data de pagamento de novo, ou uma data ainda antes do começo do período gravado): o período é o que já era.
2. **Renovação antecipada:** o tutor pagou enquanto o plano ainda vale, nos **últimos 15 dias** dele (é quando ele aparece na Renovação de planos). O novo período começa **no dia seguinte ao fim** do atual. Plano até 30/09, pago em 30/09 (ou 20/09): vale de 01/10 até 31/10. Trimestral até 30/09, pago em 25/09: 01/10 a 31/12.
3. **Fim do mês:** pagamento nos **últimos 7 dias do mês** (de 24/09 em diante, num mês de 30 dias) começa no **dia 1º do mês seguinte**. Até o dia 23, o mês do pagamento continua sendo o 1º mês do plano. Pagou atrasado em 02/10: vale outubro, como sempre.

- **Quando a data sozinha não diz, o Confirmar pergunta** (revisão QA54, dinheiro não se adivinha):
  - **"Pagamento novo ou correção da data?"**: a data nova fica a até 15 dias da gravada (20/09 → 21/09 num plano de setembro). Uma resposta dá "renovação de 01/10 até 31/10", a outra "fica de 21/09 até 30/09".
  - **"Este pagamento é de qual período?"**: ficha antiga paga nos últimos dias do mês (o Baque: gravado 30/09 → 30/09). Uma resposta dá "Mês seguinte: de 01/10 até 31/10", a outra "Manter".
  - A ficha avisa antes: "(O Confirmar vai perguntar…)". Quando a conta vai além do gravado e nada foi mexido, aparece **"Nada foi gravado ainda. Gravado hoje: … A conta de hoje dá …"**.
  - Essas perguntas vêm **antes** da trava "nasce vencida". **"Manter"** numa ficha antiga fica anotado: a ficha para de oferecer o mês seguinte. Ficha importada que já vai além do mês seguinte (26/09 → 15/11) não recebe essa pergunta: o resumo do Confirmar mostra o que muda.
- **A trava "nasce vencida"** (data de pagamento cujo período já passou) oferece **"Voltar e corrigir a data do pagamento"**, sem gravar nada, ou **"Manter DD/MM mesmo assim (o dinheiro conta em {mês})"**. A data do pagamento é o mês do dinheiro no Financeiro, e a trava não a troca mais sozinha. Depois dela, nenhuma outra pergunta refaz o que a pessoa escolheu.
- **O meio do mês registrado para a família** não estica o plano de um irmão cuja vigência é de outro mês.
- **Quem começa no meio do mês** (opção 1 ou 2) continua com a regra própria, sem mudança.
- **Onde a pessoa vê:** na ficha, "Vale até" vira "**de 01/10 até 31/10**", com a frase do porquê embaixo; o resumo do Confirmar diz "**Pagamento 30/09 · vale de 01/10 até 31/10**" e o porquê; a mensagem ao tutor, a lista da Renovação, "Renovações anteriores" (com "pago em 30/09"), o Desfazer e a aba Identificação mostram o período.
- **O Financeiro não muda:** o mês do dinheiro continua sendo o da data do pagamento (regime de caixa, decisão de 02/set/2026). `financeiro-logica.js` não foi tocado.
- **Onde está no código:** `aplicarRenovacao`, `renovCalcular`, `renovVigenciaComeca`, `renovRegraFimDoMes`, `renovVigenciaFrase`, `renovMesmoPlano`, `renovEdit` (`_inicio_gravado`), `blocoPlano`, `confirmarRenovacao`, `renovHistHTML`, `desfazerRenovacao`, `msgRenovado`, `renderRenovacao`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js`, 28 provas da 6.20 (o caso do Baque e do Nelson, o estado em que as 4 tentativas deixaram a ficha, correção, antecipada, fim do mês, meio do mês e o irmão, o Confirmar de verdade com as perguntas na ordem, a trava, o resumo e a gravação, a ficha, o histórico, a ficha importada mais longa); 33 defeitos plantados, 33 pegos. Quatro revisões independentes (QA54 a QA56 e a desta).

## O que mudou em 27/set/2026 (v 2026-09-27-01)

> **Adriana, 27/set/2026**, respondendo às decisões pendentes: *"1 — sim, tem que refazer depois de 4 meses · 2 — sim · 3 — sim · 4 — não entendi. Precisa refazer, está muito difícil. Acho melhor em pertences descrever, está muito ruim aquele monte de opção. Geralmente o que trazem: comida, remédios, mochila, cama, guia. Basicamente isso!"*

### (U) Mensagem ao tutor: o que já venceu diz "venceu em" e a data

| Situação | Antes | Agora |
|---|---|---|
| Tudo o que a mensagem cobra já venceu | "a vacina de Raiva da Cookie **venceu hoje**" (a data era o dia dela aqui, não a do vencimento) | "a vacina de Raiva da Cookie **venceu em 10/09**" |
| Vermífugo vencido, na véspera | "amanhã vence o vermífugo" | "venceu em 15/09 o vermífugo da Cookie" |
| Um vencido e outro por vencer | "amanhã vencem o vermífugo e o carrapaticida" | "o vermífugo da Cookie venceu em 15/09 e o carrapaticida vence em 28/09" |
| O que ainda vai vencer | igual | igual |

- Vencidos em **datas diferentes** também dizem cada um a sua data (QA19): "o carrapaticida da Cookie venceu em 12/09 e o vermífugo venceu em 15/09". Na mesma data, uma frase só: "venceram em 12/09 o carrapaticida e o vermífugo".
- Vale para os textos de Configurações › Mensagens prontas escritos com "vence {quando}", "{quando} vence" ou "{vencer} {dia}". O "{quando}" do fecho ("Podemos fazer {quando}?") continua sendo o dia dele aqui.
- O aviso amarelo do cartão ("Aqui há o que JÁ venceu") só aparece quando a frase não traz a data do que venceu (texto escrito de outro jeito).
- "Como ela estará conosco **nesse dia**" (ou "neste dia", "naquele dia") ganha o dia escrito, porque o dia saiu da frase anterior.
- **Onde está no código:** `vencTextoPassado`, `vencTextoMisto`, chamadas em `vencMensagemDe`.

### (V) Pertences da hospedagem: os cinco de sempre, e descrever

- A grade tem só **Comida, Remédios, Mochila, Cama, Guia** (na ordem dela) e **Outro**. Tocou duas vezes, são dois itens.
- Cada item marcado ganha **uma linha para descrever** (cor, marca, quantidade), com um exemplo no próprio campo. Saíram a caixa de 17 cores, o banco de itens e o "Gerenciar itens do banco".
- Estadia antiga (coleira, peitoral, ração, roupa...) continua abrindo com os nomes que tinha, depois dos cinco.
- **"Outro" sem descrição não deixa salvar**: ninguém saberia o que devolver.
- Na **última estadia pré-preenchida**, "Ração" e "Comida natural" viram **Comida**, com o que estava escrito ("Ração Royal Canin"). Corrigir ou acrescentar numa estadia que já existe não muda nada.
- Na **Conferência do check-in**, Comida é item crítico, como a ração e a comida natural antigas. Remédios não vira trava nova: cada remédio já é conferido em "Etiquetar remédio".
- **Onde está no código:** `CI_PERT_DEFAULT`, `CI_PERT_ANTIGOS`, `ciPertOrdem`, `ciDrawPert`, `carregarPertBanco`, `ciPertDef`, `ciPertAntigoParaComida`, `ciFaltando`, `cfListaItens`.

### (W) Plantão: "Editar cadastro" não apaga mais a ficha

> **Adriana, 27/set/2026:** *"Reveja as conexões, elas estão conversando? Dado do hóspede, dos aulunos e etc... o banco de dados precisa ser o mesmo, para tudo."* A auditoria de dados (`aios-zeluz/docs/zeluz/auaulandia/AUDITORIA-DADOS-27set2026.md`) achou o único ponto em que uma área **apagava** dado da outra.

| O quê | Antes | Agora |
|---|---|---|
| Abrir "Editar cadastro" no card do Plantão | abria com a cópia antiga do Plantão (`auaulandia/cadastro`), muitas vezes sem sexo, castração e nascimento | abre com a **ficha-mestre** (`daycare/cadastro`) por cima da cópia |
| Digitar um campo | a cada tecla, gravava o formulário **inteiro** na ficha: `dias:""` (o campo nem existe nesta tela), sexo, castração e nascimento vazios. O auluno "corrigido" sumia da chamada e do almoço | grava **só o campo que mudou**; nunca grava `dias`; nunca grava vazio por cima de valor |
| Leitura do banco chegando depois | atropelava o que a pessoa estava digitando | só redesenha se a pessoa ainda não mexeu |
| Apagar o nome no campo | gravava nome vazio na ficha | não grava; o nome novo grava quando houver letra |
| Alergia de hóspede sem ficha ligada (veio só da planilha) | ficava calada, só no aparelho de quem digitou | continua anotada, mas a tela avisa **em vermelho** onde registrar, e o rastro (`alergia-sem-ficha`) chega à Gestão. Quem edita fichas lê "registre pelo Cadastro de Peludinhos"; quem não edita (Monitora) lê "avise a Gestão ou a Supervisão". O aviso some ao trocar de hóspede e quando alergia e restrição estão as duas vazias. A resposta atrasada de uma gravação só aparece na tela de quem gravou |
| Nascimento digitado pela metade ("01/05/2", "15/03/19") ou no futuro | ia para a ficha numa pausa da digitação | só grava a data completa (ano com 4 dígitos) e possível, a mesma régua da ficha. Ao sair do campo, "15/03/19" vira "15/03/2019" e grava |
| FILHOt da base fixa do Day Care (lista no código) | o formulário abria sem raça, tutor e nascimento dele | abre com a base fixa + o que foi gravado; um vazio gravado não encobre valor de outra fonte |
| Microchip | "sem microchip" aparecia como número no campo; o Cadastro gravava num campo (`microchip`) e o Plantão e o check-in em outro (`chip`), e um número antigo encobria a correção, o apagamento e o "não tem" feitos no Cadastro | o campo mostra só número. **Os dois campos andam juntos** em toda edição feita por uma pessoa (campo do Cadastro, "não tem", desfazer, check-in, FILHOt novo e Plantão). A Mesa da IA e a resposta do tutor gravam texto livre só em `microchip` e nunca trocam o número; o "Editar cadastro" do Plantão respeita o microchip da ficha-mestre mesmo apagado ou "não tem"; nos cards, o que foi anotado no aparelho não encobre a ficha |
| Check-in: "Novo Hóspede" com o mesmo nome e tutor de um FILHOt que já existe, raça diferente | gravava por cima da ficha existente, com dias vazios (o auluno saía da chamada do Day Care) | bloqueia e orienta: buscar o FILHOt acima ou diferenciar o nome (ex.: "Mel Poodle") |
| Trocar de hóspede, trocar o dia, fechar o card ou tocar em Salvar logo depois de digitar | a edição esperava 0,9 s e podia se perder | grava na hora |
| Botão "Salvar cadastro" | dizia "salvo" mesmo quando nada gravava | diz o que aconteceu: "Salvo", "Data de nascimento incompleta: não gravou a data. Confira", "Para apagar, use o Cadastro de Peludinhos" (ou "avise a Gestão") e, sem conexão, "Sem conexão: não salvou" (a próxima tentativa grava). Quando nada gravou, começa com "⚠" e não diz "salvo" |

- **Onde está no código:** `cadFormLer`, `cadDiferenca`, `onCadGravar`, `cadGravarAgora`, `cadTextoSalvar`, `onCad`, `onCadNome`, `normalizarNasc`, `aplicarCadastro`, `carregarCadastro`, `cadMestreDe`, `cadSoCheios`, `setHospAlergia`, `abrirPlantao`, `toggleCadastro`; microchip: `zChipPatch` (campo do Cadastro, `pelChipNaoTemGravar`, `pelChipNaoTemLimpar`, `ciMarcarSemMicrochip`, `ciSalvarCadastroFalta`, `ciCriarNovoHospede`), `cadChipDoMestre`, `cadMestreBruto`, `extraDoHosp`; check-in: `ciCriarNovoHospede`.
- **Ficou para depois (story 6.7):** chave da ficha sem o recurso do primeiro nome (M4b); trocar o tutor pelo Plantão (M5, decisão da Adriana).

### (X) Reposição: falta com o dia de repor já combinado é troca na mensagem ao tutor (28/set/2026)

> **Adriana, 28/set/2026 (caso do Bis Leon):** *"O tutor está trocando o dia, ele não tem uma reposição. […] Conforme pedido, estamos fazendo a troca do Bis do dia 2 de outubro para quinta-feira, dia 1 de outubro."*

| Situação | Antes | Agora |
|---|---|---|
| Reposições › **Lançar reposição**: falta de um dia com o **dia de repor** já combinado | a mensagem dizia "está com 1 reposição, com a de hoje, referente ao dia 02/10/2026. O dia de repor já ficou combinado: 01/10/2026" | a mensagem fala em **troca**: "Conforme pedido, estamos fazendo a troca do Bis Leon do dia 02/10 para quinta-feira, dia 01/10." A planilha e o saldo não mudam (falta avisada no dia dele e reposição no dia novo). O lançamento ganha a mesma marca da "Marcar troca": no dia novo, o app mostra "troca cumprida" e não oferece a mensagem "usou uma reposição" |
| Troca de dia (Marcar reposição ou dia extra › Troca de dia) | "a troca pedida do dia 29/09 (terça-feira) para o dia 30/09 (quarta-feira) foi feita" | o mesmo texto novo, nas palavras dela |
| Falta lançada para outro dia, sem dia de repor | "com a de hoje, referente ao dia 02/10/2026" (errado: a falta não era de hoje) | "contando a do dia 02/10/2026". "Com a de hoje" só quando a falta é de hoje |
| Período (férias, viagem) com o dia de volta marcado, mesmo que renda um dia só | reposição | continua reposição |
| Falta de um dia que já passou, lançada com o dia de repor | reposição | continua reposição (a troca é sempre de hoje em diante, como na "Marcar troca") |
| Dia novo que já é dia dele, dia novo no sábado ou domingo, ou falta num dia que não é dele | reposição | continua reposição (as mesmas regras da "Marcar troca") |
| Desfazer uma troca lançada pela tela de Reposição, antes do dia | a falta ficava e virava reposição sem dia | a falta sai e ele volta a vir no dia dele, igual à "Marcar troca" |

- **Onde está no código:** `repLancEhTroca`, `repMensagem` (modos `troca` e `credito`), `repConfirmar` (marca `troca` e `nasceu_troca` no crédito), `repTrocaComoDesfaz`.

### (Y) Banho de quem faltou: a recepção é avisada e libera o horário (28/set/2026)

> **Adriana, 28/set/2026 (caso da Jasmine):** *"A Jasmine não veio hoje, tinha banho agendado para ela. Tem que, de alguma forma, tirar o horário do banho e avisar. […] Porque está aqui o horário dela e a gente deixa de marcar um outro banho."*

| Situação | Antes | Agora |
|---|---|---|
| Faltou (chamada, falta automática das 12h ou falta avisada) e tinha banho no dia | o banho lançado ou digitado ficava na planilha e na TV; só o banho fixo saía, em silêncio; ninguém era avisado | quem cuida dos lançamentos recebe "JASMINE NÃO VEIO — TINHA BANHO ÀS 10:00", com **Liberar o horário**, **Ela ainda vem** e **Decidir depois** |
| Liberar o horário | não existia | tira o banho do dia da planilha e da TV: lançamento sai dos Lançamentos do dia; banho fixo vira "pular só este dia"; digitado na planilha sai pela ponte |
| Vários aparelhos | — | quem decidir primeiro vale; os outros veem "JÁ FOI DECIDIDO" e quem decidiu (`daycare/banho-falta/{dia}/{chave}`) |
| Outro cartaz aberto (check-in, pagamento, mensagem ao tutor) | — | o aviso do banho espera e aparece depois; nunca apaga o que a recepção está fazendo |
| Ao tocar em Liberar | — | o app **relê na hora** a planilha e os Lançamentos do dia. Se não conseguir ler a planilha, diz "NÃO LIBEREI O HORÁRIO" e pede para tirar à mão ou tentar de novo; nunca diz "liberado" sem ler. Se a leitura falha, a planilha que o aparelho já tinha continua (avulso, reposição, despertador) |
| O banho já tinha saído (tirado à mão) | — | "já não estava na planilha nem nos Lançamentos do dia: o horário já está livre" |
| Chegou com a pergunta aberta | — | antes de tirar, o app olha a chamada de agora no banco (sem conseguir ler, a da memória): se ela diz "veio", nada sai, e o cartaz "JASMINE CHEGOU" diz que o banho continua e onde tirar à mão, se não for tomar banho |
| Nada saiu (ponte fora do ar) | — | "falhou", com o motivo e onde tirar à mão, conforme a origem: Lançamentos do dia › Banho, Banhos recorrentes › Pular o próximo, ou direto na planilha; o botão continua no cartão |
| Parte saiu, e a planilha não confirmou o resto | — | fica "liberado", com o aviso "PARTE NÃO SAIU DA PLANILHA"; no cartão: "horário liberado · a planilha não confirmou: tire à mão" |
| Liberado, mas uma leitura **nova** ainda mostra o banho (lançado de novo, ou a ponte não tirou) | — | o cartão diz "liberado por Márcia, mas o banho ainda aparece na planilha", e a pergunta volta dizendo quem liberou. **Liberar** e **Ainda vem** funcionam de novo (no banho fixo, o "Ainda vem" troca o "pular" do dia pelo "manter"). Só conta leitura pedida depois de o aparelho saber da liberação (a planilha, com 1 minuto de folga para a TV): uma planilha lida antes, como a das 8h, nunca acusa |
| "Ainda vem" | — | o horário fica com ele. No banho fixo, o automático deixa o banho na planilha mesmo com a falta. O botão de liberar continua no cartão. Se não conseguir gravar, fica "não deu certo", a pergunta volta e o cartão ganha o botão **Ainda vem** |
| Avisou a falta, mas veio | — | a chamada "veio" vence a falta avisada (do app e da coluna da planilha): não pergunta |
| "Liberando" que não terminou (o aparelho caiu no meio) | — | depois de 5 minutos volta a ficar em aberto; antes de perguntar, o app relê a decisão (se outro aparelho terminou, não pergunta) |
| Tirar o banho à mão (Lançamentos do dia › Banho › tirar) | — | depois de a ponte tirar a linha, o app relê a planilha, e o cartão se acerta |
| Liberado e depois chegou | — | o cartão avisa: "chegou depois de o horário ser liberado: se ainda for tomar banho, lance de novo" |
| Hoje na Zêluz | — | cartão "Banho de quem faltou", com o botão de liberar e o que foi decidido |
| Despertador do banho | chamava para descer com quem faltou | não chama quem faltou nem quem avisou a falta, e some da tela quando a falta é marcada |

- **Por que não tira sozinho:** a falta automática das 12h também marca quem ainda chega à tarde para o banho. Quem decide é a recepção.
- **Onde está no código:**
  - `banhoFaltaQuem`, `banhoFaltaLista`, `banhoFaltaMontar`, `banhoFaltaVerificar`, `banhoFaltaPerguntar`, `banhoFaltaReivindicar`, `banhoFaltaExecutar`, `banhoFaltaReler`, `banhoFaltaVeioAgora`, `banhoFaltaManter`, `banhoFaltaCardHTML`;
  - "ainda na planilha" só com leitura nova: `banhoFaltaAindaNaPlanilha`, `BANHO_FALTA_VIU`, `BANHO_FALTA_LIDO` e o carimbo `planDia.lidaEm`;
  - ganchos em `chamadaVivaLigar`, `carregarPlanilhaDia`, `repConfirmar`, `hojeCarregar` e `dashRemover`; `dcGarantirPlanilha(true)` com outra leitura em curso relê quando ela terminar;
  - `checarDespertadorBanho`; `banhoAutoPodeNoDia` respeita o "manter" do dia; `banhosGravarExcecao` devolve a promessa.

### (Z) Orçamento fechado que a planilha recusou: a tela diz o motivo (29/set/2026)

> **Adriana, 29/set/2026 (orçamento da Frida, tutora Ana Carolina):** *"Fui fechar um orçamento de hospedagem […] e ele deu uma mensagem que não entrou para a planilha, que tem que conferir com a gestão por causa da ponte."*

| Situação | Antes | Agora |
|---|---|---|
| A ponte da planilha de Hospedagem recusou o "Fechou" | "FECHADO — MAS A PLANILHA RECUSOU", com a linha "Frida/Ana Carolina:" vazia: o motivo que a ponte manda se perdia | a linha diz o motivo, em palavras de quem opera (abaixo), e o motivo fica gravado na lista ("NÃO entrou na planilha — motivo") |
| Palavra-chave diferente | — | "a palavra-chave guardada no app não bate com a PONTE_SENHA gravada no Apps Script." |
| Apps Script sem a PONTE_SENHA | — | "falta a palavra-chave PONTE_SENHA nas Propriedades do Apps Script." |
| A ponte respondeu com uma página (URL mudou ou falta autorização) | — | "a ponte respondeu com uma página, e não com os dados: a URL mudou ou o Apps Script pede nova autorização." |
| O que fazer | "Lance à mão nas duas abas e avise a Gestão" | "O orçamento está salvo como FECHADO. Mostre este motivo à Gestão: acertada a ponte, toque em «reenviar» na lista de Orçamentos." E o aviso: se lançar à mão, não reenviar (a reserva entraria duas vezes) |

- **Onde está no código:** `orcPonteMotivo` e `orcEnviarPlanilha`; a ponte é `integracao-planilha/Codigo.gs` (`doPost` devolve `{ok:false, erro}`).
- **O conserto da ponte é na configuração** (a Gestão): Configurações › Valores da hospedagem › Ponte com a planilha (Testar agora, Palavra-chave, Salvar ponte) e, no Apps Script, Propriedades do script › PONTE_SENHA.
- **O Testar agora confere só a URL.** Ele não manda a palavra-chave: com a palavra-chave errada ou sem a PONTE_SENHA, ele diz "✅ A ponte está de pé" do mesmo jeito. A palavra-chave só se confirma no **reenviar** do orçamento.
- **O reenviar não duplica** o FILHOt que já tinha entrado: a ponte responde "já estava lá". Só duplica se alguém lançou à mão com outro texto.
- **Ajustes do QA38:**
  - o **cancelamento** recusado também diz o motivo;
  - se a resposta repetir a palavra-chave, ela aparece como •••;
  - "excedido!" não ganha ponto depois da exclamação;
  - o aviso de ponte sem configuração aponta para Configurações › Valores da hospedagem.

### (AA) Queda de conexão com a planilha não é "a planilha recusou" (29/set/2026)

> **Adriana, 29/set/2026 (banho fixo da Cristal, foto de Lançamentos do dia):** *"Banho recorrente não apareceu, o que houve?"* A linha dizia "a planilha recusou — Failed to fetch". Depois de entender a causa: *"Pode trocar a frase do banho."*

| Onde | Antes | Agora |
|---|---|---|
| Lançamentos do dia, linha do automático (banho fixo, reposição, falta avisada, adaptação) | "a planilha recusou — Failed to fetch", em vermelho | "a conexão com a planilha caiu; o app tenta de novo sozinho em até 10 min", em dourado |
| Reposições, linha do crédito | "NÃO foi para a planilha — Failed to fetch" | "NÃO foi para a planilha — a conexão com a planilha caiu; o app tenta de novo sozinho em até 10 min", com o botão **tentar de novo** |
| Botão **Conferir a planilha agora** com a conexão caída | "✅ 0 posto(s) · 0 tirado(s) em 15 dia(s)", como se tivesse dado certo | "⚠ não consegui ler a planilha: a conexão com a planilha caiu" (ou "não consegui ler 2 de 15 dia(s)") |
| Recusa de verdade (coluna que não existe, palavra-chave) | "a planilha recusou — motivo" | igual: o motivo da ponte continua aparecendo, em vermelho |

- **Conta como queda:**
  - "Failed to fetch" (Chrome);
  - "Load failed", "connection was lost", "appears to be offline", "request timed out" e "conexão de rede" (Safari e iPhone);
  - "NetworkError" (Firefox);
  - "a ponte não respondeu", inclusive o prazo de 12 s.
- **Por que "em até 10 min":** a conferência automática (`dashAutoLigar` › `dashAutoRodar`) roda a cada 5 minutos enquanto algum aparelho estiver com o app aberto. A trava de 5 minutos, porém, conta do fim da passada anterior. Com um aparelho só, a volta logo depois da queda pula, e a seguinte confere (QA34). O botão **Conferir a planilha agora**, no alto de Lançamentos do dia, adianta a conferência.
- **Onde está no código:** `repPlanEhQuedaConexao`, `repPlanQuedaTexto`, `repPlanLinhaHTML`, `dashAutoLinhas`, `dashAutoRodarAgora` (conta os dias que não leu) e `dashAutoBotao`.

### (AB) O automático nunca tira da planilha o que a recepção lançou à mão (29/set/2026)

> **Adriana, 29/set/2026:** *"Cadastrei hoje no lançamento do dia banho da Cristal, banho do Ozzy, da Charlotte e da Repolho. No dashboard só aparece a Repolho e a Charlotte. Precisamos de rever isso urgente."*

| Situação | Antes | Agora |
|---|---|---|
| Banho fixo que deixa de valer no dia (a falta do meio-dia, falta avisada, "pular", feriado) e a recepção lançou o mesmo FILHOt à mão | o automático tirava da planilha a linha com o nome dele, que era a da recepção (com o mesmo texto, a ponte não duplica: a célula é uma só), e o FILHOt sumia da TV | a linha da recepção fica, e o automático larga o registro dela. Se ainda houver a célula do banho fixo com outro texto, só ela sai, para o FILHOt não aparecer duas vezes |
| O mesmo caso, sem lançamento à mão | o banho fixo sai da planilha e da TV | igual |
| Não deu para ler os Lançamentos do dia naquela passada | — | o automático não tira nada e tenta na próxima passada |

- **Por que só a Cristal e o Ozzy:** eles têm banho fixo, e a Charlotte e a Repolho não. O automático só tira o que ele mesmo pôs, e ele contava a linha da recepção como sua, porque compara pelo primeiro nome.
- **Vale para as quatro colunas do automático que também se lançam à mão:** Banho, Reposição, Faltas Avisadas e Adaptação.
- **Onde está no código:** `dashAutoSincronizar`, que lê `daycare/dashboard/{dia}` junto com a planilha e o registro, e o passo "2) foi este mecanismo que pôs e não vale mais".
- **A troca do shampoo** (passo 1) também não troca a célula cujo texto é igual ao que a recepção lançou (QA35).

### (AC) Todo lançamento do dia chega à TV (29/set/2026)

> **Adriana, 29/set/2026 (fotos de Lançamentos do dia e da TV: Banho com 4 no app e 2 na TV):** *"Reveja todos os lançamentos do dia, porque isso é obrigatório que a gente tenha no dashboard."*

| Onde falhava | Antes | Agora |
|---|---|---|
| Dois lançamentos quase juntos (o Ozzy e a Charlotte, 15:30) | a ponte grava na "primeira célula vazia do dia": os dois pedidos escolhiam a mesma célula, o segundo apagava o primeiro, e os dois respondiam ok | neste aparelho, lançar e tirar vão **um de cada vez** (`dashPonteChamar`, fila); entre aparelhos, a ponte tem uma **trava** (versão 7 de `integracao-daycare/Codigo.gs`, que precisa ser publicada) |
| O automático mandava vários banhos fixos ao mesmo tempo | a mesma corrida | entram na mesma fila |
| Um lançamento do app que sumiu da planilha, por qualquer motivo | ficava fora da TV sem ninguém saber: o app dizia que tinha ido | a **conferência** (em até cerca de 12 minutos, com algum aparelho aberto, ou na hora, pelo botão **Conferir a planilha agora**) compara os Lançamentos do dia de hoje e dos próximos 14 dias com a planilha e manda de novo o que falta, com a hora |
| O automático e a pessoa ao mesmo tempo | o automático empurrava dezenas de escritas para a fila, e o lançamento da recepção esperava atrás delas | o automático manda uma por vez, e a pessoa entra na próxima vaga (QA36) |

- **Como a conferência sabe que já está lá:** o mesmo texto na coluna; ou, fora de Medicação e Veterinário (onde um FILHOt tem vários no dia), uma linha da **mesma ficha**. A Luna/SRD volta mesmo com a Luna/Poodle na coluna; as gotas das 16:00 voltam mesmo com o Apoquel do meio-dia lá.
- **O que a conferência não repõe:**
  - lançamento de menos de 2 minutos, cujo envio pode estar a caminho;
  - o mesmo FILHOt que já está na coluna com outro texto (não entra uma segunda linha);
  - item que não vai para a planilha (Pernoite);
  - lançamento que esgotou as 5 tentativas ou cuja coluna não existe: esses continuam com o botão **reenviar**.
- **Tirado durante a conferência não volta:** ela relê o lançamento antes de repor. Se ele for tirado enquanto a ponte grava, a conferência desfaz o que escreveu.
- **O que foi tirado pelo app** ("tirar", ou "Liberar o horário" do banho de quem faltou) sai também dos Lançamentos: a conferência não põe de volta. Quem apaga uma linha direto na planilha vê a linha voltar; o caminho certo é o "tirar" do app.
- **Rastro:** cada reposição grava na auditoria "a conferência repôs na planilha …", com o nome do item e o dia.
- **Ordem para publicar:** primeiro o Merge e **recarregar o app em todos os aparelhos**. Depois, a ponte nova no Apps Script: com a ponte nova e um aparelho no app antigo, as escritas do automático antigo esbarram na trava (QA36).
- **Onde está no código:** `dashPonteChamar` (fila) e `dashPonteChamarJa`; `dashAutoSincronizar`, passo 3; `integracao-daycare/Codigo.gs`, `_umPorVez`.

### (AD) Check-in da hospedagem: o botão Confirmado/Mudou escolhido dá para ler (29/set/2026)

> **Adriana, 29/set/2026 (foto do check-in no celular):** *"É impossível conseguir salvar o que está ocorrendo! Precisa facilitar o processo. […] Tem um botão mudou, e outro que nem tem como ler!"*

| Onde | Antes | Agora |
|---|---|---|
| Faixa "Confirme com o tutor: é isso mesmo?" de cada remédio que veio da ficha | o botão tocado ficava creme sobre creme, sem dar para ler | fica verde (Confirmado) ou marrom (Mudou), com letra creme e um ✓ na frente |

- **O que o check-in pede antes de salvar** (cada item vira vermelho, com a frase do que fazer, e a tela rola até o primeiro):
  - data de entrada;
  - pelo menos uma refeição com o que ele come;
  - cada remédio da ficha com **Confirmado** ou **Mudou**;
  - a caixinha da conferência de segurança da medicação;
  - "Outro" nos pertences descrito;
  - o nome de quem entrega e a assinatura com o dedo (ou "O tutor não veio").
- **Onde está no código:** `.ci-med-conf button.on` (CSS) e `ciMedConfSet`.

### (AE) Check-in rápido da hospedagem (29/set/2026)

> **Adriana, 29/set/2026:** *"Checkin de entrada do peludo na hospedagem! É impossível conseguir salvar […] Precisa facilitar o processo. Está difícil demais!"* Pedidos dela: pertences só em texto, coleira nas primeiras linhas, "está em uso de alguma medicação?" (o kit de emergência não conta), comida, tela mais curta. Ela autorizou seguir com as respostas recomendadas.

**A ordem nova da tela** é a da conversa com o tutor: FILHOt › coleira › alergia › medicação em uso › comida › pertences › datas (hospedagem ou pernoite, datas, observações, banho de saída) › assinatura. Os atalhos do alto seguem a mesma ordem.

| Onde | Antes | Agora |
|---|---|---|
| Coleira | não existia | **"Está com coleira antipulga ou repelente?"** Sim ou Não; com Sim, **"Qual?"** (Seresto, Scalibor…). Fica na estadia e sai no PDF, no resumo do WhatsApp e na Conferência. A ficha do FILHOt não muda. Não trava o salvar |
| Medicação | a lista aparecia sempre, com uma linha em branco | a pergunta **"Está em uso de alguma medicação?"** vem primeiro, e sem resposta o check-in não salva. **Não:** a lista some, nada liga alarme, e os remédios da ficha ficam como "já não toma mais" (terminam ontem, com o nome de quem ouviu do tutor, o mesmo registro do "Parou" da aba Medicamentos). **Sim:** abrem nome, dose e horários. Com remédio na ficha, a resposta já vem Sim |
| Remédios da ficha | Confirmado ou Mudou, um por um | continua, e há o botão **"Tudo igual — confirmar todos (N)"** para quando o tutor diz que nada mudou |
| Kit de emergência | ia como remédio e ligava alarme | a tela diz: não é medicação em uso, escreva em Pertences |
| Comida | todos os campos sempre abertos | quando o que a ficha diz é **Confirmado**, o detalhe dobra e fica a frase do plano; **Mudou** abre tudo. Os rótulos: "O que come e quanto, em CADA refeição" e "Quanto trouxe de ração (g)" |
| Pertences | grade com Comida, Remédios, Mochila, Cama, Guia e Outro, e uma linha para cada | **um campo de texto:** "comida (ração Royal, 1 pacote), cama rosa, sacola verde…". Cada item, por linha ou por vírgula, vira um item na Conferência, no Check-out e no PDF; embaixo aparece como o app separou. Comida continua crítica na Conferência |
| Vermelho do que falta | tocar em Confirmado ou Mudou apagava o vermelho de TODOS os bloqueios | sai só o vermelho do que foi respondido, e o botão conta o que ainda falta. O problema de cada remédio fica na linha dele |
| Quem não pode confirmar remédio | alerta nativo, que o celular pode esconder | aviso na própria página, dizendo quem pode confirmar |

- **O que o check-in pede antes de salvar,** na ordem da tela:
  1. a resposta "está em uso de alguma medicação?";
  2. com Sim: cada remédio completo, os da ficha com Confirmado ou Mudou, e a caixinha da conferência de segurança;
  3. pelo menos uma refeição com o que ele come (e, na pernoite, Confirmado ou Mudou na comida);
  4. "Outro" de estadia antiga descrito;
  5. a data de entrada, o nome de quem entrega e a assinatura (ou "O tutor não veio").
- **Estadia antiga** abre com os pertences como texto, um por linha; sem mexer, volta igual, com o V verde da Conferência.
- **Onde está no código:** `ciColeira*`, `ciMedEmUso`, `ciMedEmUsoChange`, `ciMedTudoIgual`, `ciMedNaoEmUso`, `ciMedMarcarParou`, `ciPertPartes`, `ciPertTipo`, `ciPertDoTexto`, `ciAlimProblemas`, `ciMedLinhaDoProblema` e `zLimparFaltaEm`.
- **Ajustes do QA39 (a medicação em primeiro lugar):**
  - o **"Não" só vale quando alguém toca nele neste check-in.** O "Não" que volta de uma estadia salva (Corrigir, Acrescentar) é só a resposta de antes: com remédio em vigor na lista (a veterinária pode ter começado um depois), a resposta volta "Sim" e a lista aparece;
  - o "Não" para os remédios que estavam **na tela** e as cópias repetidas deles, que a tela não mostra (QA44: antes parava também o remédio que a veterinária começou enquanto a recepção fazia o check-in);
  - no **Corrigir**, o "Não" não apaga mais a agenda: quem parou fica em "já não toma mais", com o histórico;
  - no **Acrescentar**, não dá para dizer "Não" com remédio na lista: o aviso manda usar o Corrigir;
  - só o remédio **em vigor** vem para a lista e para o "Tudo igual" (o que já parou, foi suspenso ou acabou fica de fora);
  - o vermelho do remédio fica **na faixa Confirmado/Mudou** (e, nos outros problemas, no nome), e dois remédios de mesmo nome ficam cada um na sua linha;
  - pertences: número só completa o item quando é quantidade ("ração, 2 kg"); "2 brinquedos" e "1 manta" são itens; "pote de comida", "cama de fibra natural" e "kit de banho" não viram comida nem remédio; "marmitas", "alimento úmido" viram comida; a comida aparece marcada "(comida: etiquetar)" na lista;
  - editar a descrição de um pertence antigo conserva o item (não vira material novo na Conferência);
  - o cartaz da correção fala a coleira e a medicação em uso em português.
- **Ajustes do QA44:**
  - **ACRESCENTAR pela janela "JÁ ESTÁ HOSPEDADO"** com "Não" nesta tela e remédio no check-in que já existe não grava: o aviso manda usar SUBSTITUIR (`ciAcrescentarBarrado`);
  - a pergunta do salvar **"tomava X — não toma mais?"** não pergunta mais pelo remédio que já parou ou já terminou;
  - **Corrigir e SUBSTITUIR com "Sim"** reescrevem só os remédios em vigor: os de "já não toma mais" e os suspensos pela veterinária ficam na agenda, com o histórico;
  - **pertences:** "guia vermelha, 2 kg de ração" são dois itens, e a comida continua crítica na Conferência; peso ("2 kg") e marca de ração conhecida (Royal Canin, Golden, Premier…) contam como comida; no Acrescentar, o item novo ganha uid próprio (antes, dois itens andavam juntos na Conferência); reescrever a linha de um item da grade antiga não vira "material novo";
  - textos: "Nenhum alarme deles toca" com mais de um remédio; no Acrescentar, o caminho para dizer que parou é "saia desta tela, abra o FILHOt de novo e toque em ✎ Corrigir informação errada".
- **Ajustes do QA46:**
  - **Corrigir e SUBSTITUIR com "Sim"** tiram da agenda só o que a tela carregou e a pessoa tirou, com as cópias repetidas. O que a veterinária parou depois fica parado, mesmo com o remédio na tela, e o que ela começou depois fica (`CI_MED_CARREGADOS`);
  - **"➕ Acrescentar"** do quadro do alto, com "Não" e remédio gravado na estadia, também não grava: o aviso manda usar Corrigir. A regra agora está dentro da gravação;
  - **"tomava X — não toma mais?"** volta a perguntar pelo remédio que terminou por data durante a última estadia, mas não pelo que terminou antes dela nem pelo que está em "já não toma mais";
  - o **"Não" não regrava** o remédio que alguém já parou;
  - **pertences:** "ração úmida, 3 latas" é um item só. Antiparasitário por faixa de peso ("Bravecto 20-40 kg") é remédio. "areia 4 kg" e "caixa de transporte" não são comida. Suplementos (condroitina, ômega, vitamina) são remédio;
  - **textos no plural** quando há mais de um remédio ("eles continuariam lá", "os remédios ficam").
- **Ajustes do QA49:**
  - **Corrigir com "Sim":** o remédio que a veterinária parou ou apagou depois de a lista carregar sai também da estadia e do PDF. O aviso final diz qual foi ("Mexido pela veterinária enquanto você corrigia — ficou como ela deixou"). Se a lista de remédios não chegou a carregar, nada que está em vigor sai da agenda: ninguém viu;
  - a **lista que volta depois de trocar de FILHOt** é ignorada (não entra na tela do outro);
  - **"tomava X?"** pergunta só pelo que terminou durante a última estadia (entre a entrada e a saída);
  - **pertences:** "caixa de sachês" continua comida (crítica na Conferência); "caixa de transporte" e "caixa de areia" são objeto. "guia vermelha, 3 latas" são dois itens. "Golden 10-15 kg" é comida. "NexGard 10,1-25 kg" não se parte na vírgula.

### (AH) O check-in que já existe está errado: SUBSTITUIR, sem duplicar (29/set/2026)

> **Adriana, 29/set/2026 (Toshi):** *"Preciso cancelar o check-in que a Márcia fez do Toshi, urgente, e ele não me dá a opção. Foi errado, tem que ter a opção… não pode duplicar! Principalmente isso é medicação!"*

| Onde | Antes | Agora |
|---|---|---|
| Salvar › janela "JÁ ESTÁ HOSPEDADO" | Acrescentar (soma: o remédio errado continua) · Criar 2º (duplica) · Cancelar | Acrescentar · **✎ SUBSTITUIR o que já existe pelo desta tela** · Criar 2º (duplica) · Cancelar |
| Quadro amarelo "já está hospedado", no alto do check-in | Acrescentar · Corrigir | igual, com a frase: "Corrigir substitui o que está errado, inclusive a medicação. Já preencheu tudo nesta tela? Toque em Salvar e escolha SUBSTITUIR." |

- **SUBSTITUIR** pede o motivo (na própria página) e grava pelo mesmo caminho do Corrigir: a estadia passa a ter o que está na tela, a agenda de medicação passa a ser exatamente a desta tela (o remédio errado sai, nada fica em dobro) e o de antes fica no histórico da estadia (`correcoes`), com quem, quando e o motivo. A ficha em PDF sai como em todo salvar.
- **Onde está no código:** `ciSubstituirExistente` e a janela em `ciSalvar`.
- **Ajustes do QA42 (valem também para o Corrigir e o Acrescentar):**
  - a pergunta "quem recebeu" vem **antes** de gravar qualquer coisa. Cancelada, nada é escrito: nem a estadia, nem a agenda. Antes, a estadia ia com o remédio novo e a agenda ficava com o antigo, com a tela dizendo "nada foi salvo";
  - o prazo de 25 segundos do Salvar fica parado enquanto a pessoa escreve o nome;
  - no SUBSTITUIR, a pergunta é "Quem recebeu do tutor o que está nesta tela?", e a assinatura nova e quem entregou também são gravadas.
- **Ajustes do QA43:**
  - no SUBSTITUIR, a assinatura, quem assinou e os pertences de antes ficam no histórico da estadia (antes, a assinatura antiga sumia);
  - a Conferência e o aviso final dizem "SUBSTITUIU O CHECK-IN", e não "chegou material novo";
  - quem erra o nome vê de novo a mesma pergunta do SUBSTITUIR;
  - se outro aviso tirar a pergunta "quem recebeu" da tela, em 10 minutos o botão Salvar volta, sem ter gravado nada.

### (AF) Escovação: quem escova no Day Care e as duas saídas da troca (29/set/2026)

> **Adriana, 29/set/2026:** *"Nem todo mundo escova dente, então nem todo mundo vai ter escova de dente. Ou não escova porque não deixa, ou não escova porque o tutor não compra pasta com a gente."* E: *"Troca de escova tem que colocar se escova dente no Day Care ou não! […] E precisa ter se o cliente tinha em casa! Ou não autorizou a troca. Aí deixamos para daqui a 3 meses! Automaticamente."* Seguiu com as respostas recomendadas.

| Onde | Antes | Agora |
|---|---|---|
| Ficha › Prevenção › Saúde e rotina | só as datas da troca de escova | **"Escova os dentes no Day Care?"** Sim ou Não. Com Não: **"Por que não escova?"** Não deixa · O tutor não compra a pasta · Outro (com o motivo escrito) |
| Cobrança da troca de escova (Prevenção, Vencimentos, Hoje na Zêluz, mensagem ao tutor) | todo FILHOt com a troca vencida era cobrado | quem **não escova** no Day Care sai de toda cobrança; a data antiga fica na ficha |
| Ficha, logo abaixo | — | **"Troca de escova de hoje":** "O tutor tinha em casa (já trocou)" e "O tutor não autorizou a troca". Os dois põem a próxima troca daqui a 3 meses, sozinha |
| Vencimentos › troca de escova (botões da resposta do tutor) | Vai aplicar em casa · Vai mandar na bolsa · Pegar na loja · Não respondeu · Não quer agora | Vai mandar na bolsa · Pegar na loja · **Tinha em casa (já trocou)** · **Não autorizou a troca** · Não respondeu |

- **"Tinha em casa"** vale como troca de hoje: a última troca passa a ser hoje e a próxima, daqui a 90 dias.
- **"Não autorizou"** só adia: a última troca continua a que era, e o "vence em" passa a ser daqui a 90 dias (marcado como data à mão).
- **Só na ficha:** nenhum dos dois vai para a planilha nem para a TV, porque não é troca feita aqui. Fica o rastro com quem registrou e quando.
- **Onde está no código:** `escovaNaoEscova`, `prevForaDaCobranca`, `escovaFichaHTML`, `escovaDcSet`, `escovaMotivoSet`, `escovaPatchTresMeses`, `escovaTresMeses`, `VENC_ESCOVA_EXTRAS` e `vencRespostasEscova`.
- **Harness:** a checagem v-32 ("o quadro das respostas pendentes traz os CINCO botões") mudou de propósito: o cartão dela é de troca de escova, e os botões da escova agora são outros. Continuam cinco.
- **Ajustes do QA40:**
  - o "Não" também fecha a conversa da escova que já tinha sido mandada ao tutor;
  - **uma fonte só:** o "Não" tira o chip "Escova de dentes" das atividades (a lista de escovação dos monitores) e o "Sim" põe; marcar o chip à mão numa ficha com "Não" volta para "Sim";
  - quem não pode mudar a ficha recebe aviso na página e nada é gravado (nem nos Vencimentos);
  - a ficha se redesenha depois de responder;
  - o "vence em" da troca adiada diz "Adiada: o tutor não autorizou a troca em …";
  - o painel "Lance aqui mesmo" da Prevenção diz "não escova no Day Care — fora da cobrança";
  - a resposta antiga ("Vai aplicar em casa") num cartão de escova continua legível.

### (AG) Carrapaticida: a duração vem do produto, e a lista se edita sem programador (29/set/2026)

> **Adriana, 29/set/2026 (Bravecto do Antônio):** *"Bravecto é um medicamento que dura 90 dias. Credeli dura 30 dias. Simparic, 35. NexGard, 30. […] Quando é comprimido, eu preciso ter uma barra na frente para colocar qual o tempo de durabilidade daquele produto. […] Quando a gente já sabe o Bravecto, é isso e pronto. Mas cada vez mais sai produtos."* Seguiu com as respostas recomendadas.

| Onde | Antes | Agora |
|---|---|---|
| Configurações › Prevenção | só as coleiras | **"Carrapaticida — cada produto protege quantos dias?"**: Pipeta 30, Bravecto 90, Credelli 30, Simparic 35, Nexgard 30, cada um com o número editável; **Produto novo** + **Protege quantos dias?** acrescenta; o produto novo pode sair da lista (a duração fica guardada para as fichas que já têm). Fica no rastro (`config-prevencao`) |
| Ficha › Prevenção › Ectoparasitas | quatro comprimidos fixos no código | os comprimidos da lista, com a duração no botão ("Bravecto · 90d") |
| Painel rápido (toque no item em Prevenção, Vencimentos e Hoje na Zêluz) | a conta usava o produto da ficha; sem produto, **30 dias** (o Bravecto era cobrado 2 meses antes) | **"Qual produto?"**, com a duração na frente ("Bravecto · 90 dias"), já com o da ficha escolhido. O produto vai para a ficha junto com a data. Sem produto na tela e na ficha, o painel pede o produto e não grava; se o tutor não sabe, "Não sei qual foi" conta o prazo mais curto. "Outro" pede quantos dias |
| Lançamentos do dia › Carrapaticida | quanto foi dado e observação | **"Qual produto?"** (opcional) com a duração na frente; escolhido, entra no texto da planilha e da TV |

- **Ajustes do QA41:**
  - **Nome do produto novo:** só letras, números, espaço, "-" e "+". O que sobrar (ponto, barra, aspas, apóstrofo, parênteses, "<") é dito na tela ("Tire: …"), nunca apagado em silêncio: esses caracteres quebravam o botão da ficha, o botão dos Lançamentos do dia ou a leitura da planilha. "bravecto" é o Bravecto de sempre, não um segundo produto.
  - **Tirar da lista não apaga:** o produto some das escolhas, mas a duração continua valendo para as fichas que já têm. Na ficha e no painel ele aparece marcado "(saiu da lista)". Em Configurações aparece a linha "Fora da lista"; para voltar, basta escrever o nome em "Produto novo".
  - **"Não sei qual foi"** no painel rápido: conta o prazo mais curto da lista (hoje, 30 dias) e não grava produto na ficha. Cobrar cedo protege; cobrar tarde deixa o FILHOt sem proteção. **Decisão aplicada pela recomendação; a Adriana pode mudar.**
  - **"Gravar o vencimento"** leva também o produto escolhido.
  - **Salvar o bloco da ficha** sem duração conhecida (sem produto, ou "Outro" sem os dias) não apaga mais a próxima data.
  - **Textos com os números da lista:** "Pipeta dura N dias", o aviso "Escolha o produto", "1 dia" no singular e "Quantos dias protege o produto X?". Sem produto, o painel diz "Escolha o produto: a duração depende dele." (antes, "Vale 30 dias").
  - **Tutor com "&" no nome:** o painel acha o campo do produto.
- **Ajustes do QA45:**
  - **"Não sei qual foi" deixa a ficha sem produto** (antes, o produto de antes ficava, e o Salvar seguinte da ficha refazia a conta com ele, por exemplo 90 dias do Bravecto). O rastro diz "produto não informado — prazo mais curto".
  - **A ficha aberta pela Prevenção** ("Feito em" e o recálculo do "Vale até") conta pelo produto da ficha: Bravecto 90 dias, não 30.
  - **Salvar o bloco da ficha com dose nova e sem produto** pede o produto antes de gravar, como o painel.
  - **A lista é gravada com `update`,** e só depois de ter sido lida do banco. Um produto que outro aparelho acrescentou não some; um aparelho que não conseguiu ler a lista salva as coleiras e avisa que a lista não foi salva.
  - **O nome** tem até 40 letras, e o que precisa sair aparece entre « ».
- **Ajustes do QA47:**
  - **A ficha aberta pela Prevenção** (toque no nome em Prevenção) mostra **"Qual produto?"** no carrapaticida, com o da ficha já escolhido e a frase "Vale N dias". Trocar o produto refaz o "Vale até" na hora. O Salvar grava o produto junto e, sem produto, pede o produto, como o painel. Antes, contava em silêncio pelo produto da ficha e cobrava tarde quando a dose do dia era outra.
  - **"Não sei qual foi" com "Gravar o vencimento"** também deixa a ficha sem produto.
  - **Salvar o bloco da ficha** com a data da carteira digitada em «Vence em» no mesmo Salvar não é barrado por falta de produto.
  - **Configurações › Prevenção** lê os campos pela lista que estava na tela e grava só o que mudou. O número ou o "fora" que outro aparelho mudou continua valendo. A tela desenhada antes de a lista chegar do banco não grava a lista. O rastro só fala da lista quando ela foi gravada.
- **Ajustes do QA48:**
  - na ficha aberta pela Prevenção, os **dias do "Outro"** também refazem o "Vale até" enquanto são digitados (antes, a data do produto anterior ficava e a cobrança vinha tarde);
  - o **«Vence em» da carteira** digitado no mesmo Salvar de uma dose nova, sem produto, é gravado e fica marcado "à mão". Apagado (vazio), o Salvar pede o produto;
  - a **confirmação verde** continua dizendo "(marcado à mão)" com "Não sei qual foi";
  - **Configurações:** mudar o número grava só o número (se outro aparelho tirou o produto da lista, ele continua fora). Salvar sem mudar a lista não regrava o nó. A releitura depois de salvar não redesenha a tela, para não apagar o que está sendo digitado. Quando a lista chega depois de a tela abrir, o aviso manda conferir e salvar de novo, sem recarregar.
- **Onde está no código:** `ECTO_DUR_PADRAO`, `ECTO_DUR`, `ECTO_FORA`, `ectoCfgAplicar`, `ectoComprimidos`, `ectoProdutosLista`, `ectoRotulo`, `ectoMaisCurto`, `ectoExemplos`, `ectoNomeProblema`, `ectoFraseDias`, `DASH_ECTO_PROD`, `ectoDashOpsRefazer`, `prevCorrigeEctoHTML`, `prevCorrigeEctoDaTela`, `cfgPrevEctoHTML` e `cfgPrevEctoDaTela`. A lista mora num nó só dela, `daycare/config/prevencao-ectos` (QA41): um aparelho ainda na versão antiga regrava `daycare/config/prevencao` inteiro ao salvar as coleiras, e apagaria a lista se ela morasse ali.
- **Harness:** duas checagens mudaram de propósito. A v-16 continua exigindo o `set` das coleiras com as mesmas três chaves e passa a exigir também o `set` da lista no nó dela. Na v-47 ("Feito em…" do carrapaticida numa ficha sem produto), a pessoa agora escolhe a pipeta no painel.

### Decisões registradas (sem mudança de código)

- **Exame de fezes depois da 1ª dose dispensa a 2ª dose do vermífugo**, e o exame volta a ser cobrado 4 meses depois (`vermOuFezes`, `FEZES_PROX`). Já era assim; ficou decidido.
- **Tutor que respondeu a mensagem da véspera** não recebe de novo a pergunta "fazer hoje?" sobre o mesmo assunto. Já valia para o que tinha vencido; o QA19 mostrou que o que ainda ia vencer (ex.: carrapaticida de quinta, com ele aqui na terça) era perguntado de novo. **Agora vale para os dois**, mas só para o item que a mensagem da véspera levou: o que nunca foi dito ao tutor continua sendo perguntado (`hojeAntecipar`, QA20).

## O que mudou em 25/set/2026 (v 2026-09-25-01) — Fase 0 do "ciclo fechado"

> **Origem:** auditoria completa de 25/set/2026 e PRD-006 ("nada fica sem cobrar, nada fica esquecido"). A Adriana respondeu "ok" para todas as recomendações e autorizou a Fase 0. **Publicado em 27/set/2026** (merge do pull request #1 pela Adriana), junto com as seções (Q) a (T). Depois de publicar, falta carimbar a versão (`node tools/carimbar-versao.js 2026-09-25-01`).

> **Adriana, 25/set/2026:** *"Eu clico aqui, vermífugo, Simba, nada acontece."* · *"Vermífugo: duas doses com 21 dias de intervalo, depois 4 meses; opção de dose única; exame de fezes com data e resultado."* · *"Banhos recorrentes: só quem tem banho fixo."*

### (A) O remédio lançado na recepção entra no alarme e no vigia

**Antes:** o remédio lançado em **Lançamentos do dia › Medicação** ia para a planilha e para a TV, mas não entrava no registro de doses. Ficavam de fora três coisas:
- o alarme no celular;
- o "Dei agora";
- o vigia do servidor.

Só entrava a dose do check-in de pertences.

**Agora:** lançamento de Medicação de **hoje**, com a ficha casada e horário, vira dose esperada (`medDosesDosLancamentos`).
- Se o check-in de pertences já tem a mesma dose no mesmo horário, ela **não entra duas vezes**.
- Lançar ou tirar o remédio refaz a agenda na hora.

### (B) Feriado: a falta automática das 12h não marca a turma inteira

**Antes:** num feriado, a falta das 12h marcava como "faltou" todo mundo da turma. O vigia da ponte do Telegram também avisava a falta.

**Agora:**
- O app lê a lista de feriados, a mesma do orçamento (`auaulandia/config/orcamento/feriados`), e não marca falta em feriado.
- A ponte (`integracao-telegram/Codigo.gs`, `_ehFeriado`) também pula o feriado. **Ela precisa ser republicada no Apps Script.**

### (C) Vencimentos: o toque abre o quadro ALI, e o cartão só fecha com a ficha em dia

| O quê | Antes | Agora |
|---|---|---|
| Tocar no nome no resumo do topo ("Vermífugo: Simba") | o quadro abria no cartão, lá embaixo: parecia que o toque não fazia nada | o quadro abre **logo abaixo da linha tocada** |
| Dois FILHOts com o mesmo nome (tutores diferentes) | o segundo sumia do resumo | aparecem os dois (a conferência é pela chave) |
| "Nunca fez — quer fazer aqui" | fechava o assunto e **não lançava nada** | dois botões, cada um lança o vermífugo e o carrapaticida nos Lançamentos do dia; a vacina em aberto vira recado para a veterinária no dia dele:<br>• "Nunca fez — fazer aqui, **está na bolsa**";<br>• "Nunca fez — fazer aqui, **pegar na loja**" |
| "Sim, a ficha foi atualizada" | fechava o cartão sem conferir a ficha | **só fecha se a ficha estiver em dia**. Se ainda há vacina, vermífugo ou carrapaticida vencido ou nunca registrado, abre o quadro de gravar a data e diz o que falta |

Ficam de fora dessa trava:
- o que é opcional: coleira, escova, exame de fezes e 2ª dose;
- o assunto em que o tutor disse "Não quer agora".

Cartão marcado "atualizado" antes desta versão e com a ficha ainda devendo **volta aberto**, com a linha explicando.

### (D) Vermífugo no quadro rápido (sem abrir a ficha)

- **Dose única** ou **2 doses (repete em 21 dias)**, escolhido na hora de gravar. Com 2 doses:
  - a 2ª fica prevista em 21 dias;
  - o próximo vermífugo vem 4 meses depois da 2ª.
- Gravar a **2ª dose** recalcula o próximo vermífugo **a partir dela**. Antes, a data ia para um campo que a conta não lia.
  - 2ª dose antes da 1ª é recusada.
  - "Não vai ter 2ª dose" passa para dose única.
- **Exame de fezes** no mesmo quadro: data, próxima em 4 meses e **resultado**. Fica recolhido: toca-se para abrir.
- **Regra "vermífugo OU exame de fezes": vale o mais recente** (`vermOuFezes`).
  - Antes, qualquer exame registrado, de qualquer ano, dispensava o vermífugo para sempre. Quem tinha um exame antigo e um vermífugo novo **não devia nenhum dos dois**, e o vermífugo vencia em silêncio.
  - A regra é a mesma na Prevenção, nos Vencimentos e na ficha.

### (E) Hospedagem: pernoite de ontem e hóspede recorrente

- **Pernoite lançada ontem e sem check-in** continua aparecendo, com a data da noite, por até 3 dias. Aparece em três lugares:
  - no Check-in;
  - na mesa do dia;
  - no painel da Márcia.

  "Fazer o check-in desta noite" abre com a entrada **naquela noite**. "Tutor buscou, cancelar" pede o motivo, como sempre.
- **Hóspede sem check-in** agora confere as **datas** da estadia. Antes, qualquer estadia antiga, de qualquer mês, contava como check-in feito, e o cliente recorrente nunca aparecia. Estadia cancelada não conta.

### (F) Banhos recorrentes: só quem tem banho fixo

- A lista abre só com quem tem banho fixo. Conta tanto o gravado quanto o ligado no rascunho: a linha recém-ligada não some no meio da edição.
- A busca procura em **todos** os ativos, para incluir alguém novo.
- O botão **"Mostrar também quem não tem banho fixo"** mostra a casa inteira.

### (G) Segurança (P0 da auditoria)

- **Servidor da senha (Rota A)** pronto em `servidor-senha/`:
  - confere o PIN no servidor da Kairós e devolve o token com o papel;
  - tem freio contra quem tenta adivinhar;
  - mantém a trava de aparelho;
  - deixa rastro sem guardar a senha.

  **Ainda não está no ar:** a instalação na VPS e as etapas seguintes estão em `servidor-senha/LEIA-ME.md`.
- As senhas reais **saíram dos 24 arquivos de teste**. Agora vêm do ambiente: `ZELUZ_SENHA_DIRETORIA`, `ZELUZ_SENHA_GESTAO` e `ZELUZ_SENHA_PLANTAO`.
- O rastro da auditoria sai sempre no formato que o banco aceita (`_audNormalizar`). Antes, um registro sem `quem` e `role` voltava para o bolso a cada reenvio, para sempre.

### (H) Relatórios: a foto do xará não é mais oferecida ao FILHOt novo

> **Adriana, 25/set/2026:** *"Toda vez que um novo peludinho chega (hoje o Thor, Spitz, da Juliana), pergunta em Relatórios se a foto é dele. Está confundindo agora o Thor da Andrea com o novato Spitz."*

**Antes:** a pergunta "esta foto é dele?" devia aparecer só para foto **órfã** (guardada numa chave que não é ficha de ninguém). Mas a conta oferecia também a foto de **outra ficha que existe**. Todo FILHOt novo com um xará antigo caía na pergunta, e um "é ele" copiava a foto do outro.

**Agora:**
- Foto de ficha que existe não é candidata: o Thor novo vai para "precisa fotografar".
- Card novo **"Duas fichas com a MESMA foto"**: mostra as fichas que ficaram com a foto copiada antes desta correção. A foto certa se tira em «Trocar».

### (T) Banho fixo: o shampoo vai junto (qual, nome e onde está)

> **Adriana, 25/set/2026:** *"Temos diversos peludinhos do Day Care que usam shampoo hipoalergênico, shampoo medicamentoso e tudo mais, e que o tutor já manda na mochila ou fica aqui… essa informação precisa ir junto para o dashboard, para o pessoal já descer com o shampoo… o shampoo está na bolsa que o tutor manda, ou está aqui embaixo na loja. Essa informação precisa ficar."*

| Onde | O que mudou |
|---|---|
| **Banhos recorrentes** (a linha do FILHOt) | depois de "Shampoo" (trouxe o dele / comprou na loja), a linha pergunta **Qual** (Hipoalergênico, Medicamentoso; tocar de novo desmarca) e o **nome** (ex.: Cloresten), e **Onde está** ganhou **"Está aqui na loja"**, ao lado de "na bolsa dele" e "na recepção". Fica gravado no combinado (`banho_rec.tipo`, `banho_rec.nome`) |
| **Planilha e TV** | a célula do banho leva tudo: `Lana/Spitz (SHAMPOO · MEDICAMENTOSO · CLORESTEN · NA BOLSA)`. Sem qual/nome, sai igual ao de antes: `(SHAMPOO · NA RECEPÇÃO)` |
| **Lançamentos do dia › Banho** | os mesmos campos (qual e nome, opcionais) e o mesmo "aqui na loja". Escolhido o FILHOt, **o shampoo gravado no banho fixo dele já vem marcado** — é rascunho, a recepção só confere e lança |
| **Hoje na Zêluz e Vencimentos** | "🛁 banho hoje 10:00 (fixo) · shampoo próprio medicamentoso Cloresten — está na bolsa". Quem usa o da casa não ganha aviso |
| **Mudou o shampoo de quem já tem banho fixo** (QA17) | os dias que o automático **já tinha escrito** na planilha também mudam: a célula que ELE escreveu sai e a nova entra, com a hora. A célula que uma pessoa escreveu à mão não é tocada |
| **Nome com parêntese** (QA17) | "Episoothe (Virbac)" vira `EPISOOTHE VIRBAC` na planilha — o parêntese confundiria a leitura do nome e do tutor (xarás) |

- **Onde está no código:** `DASH_SHAM_TIPO`, `DASH_SHAM_ONDE` (NA LOJA), item `banho` de `DASH_ITENS` (campos `tipo` e `nome`), `banhoRecNormal`, `banhoRecDetalhe`, `banhoRecShampooFrase`, `banhoPreMarcarLanc`, `banhosLinhaHTML`, `banhosSet`, `banhosValidar`, `banhosSalvar`.

### (S) Troca de dia: falta avisada no dia dele e Reposição no novo

> **Adriana, 25/set/2026:** *"O tutor está querendo trocar o dia tal e vir no outro… não quero usar a reposição, eu quero trocar o dia… A troca pedida do dia tal pro dia tal foi feita. Coco Chanel da Juliana e Billy Paul da Juliana precisam estar com falta avisada na terça-feira e ir direto para reposição na quarta."*

**Onde:** Reposições › «Marcar reposição» › marcar **"É troca de dia"** e dizer em que dia dele ele NÃO vem. O «+ Marcar troca» da Lista de troca abre a mesma tela, já com a troca marcada.

| O quê | Como |
|---|---|
| O que grava | um crédito próprio da troca: `data` = o dia dele (falta avisada), `volta` = o dia novo (Reposição), `motivo:'troca'`, `troca:{de, para, quem, ts}`. Se o tutor já tinha avisado a falta daquele dia, a troca usa aquela falta |
| As reposições que ele já tinha | não são usadas: a troca não depende de saldo e nunca vira avulso |
| Já estava marcada como reposição no dia novo | converte: a reposição marcada volta a ficar sem dia (o dia fica guardado em `volta_desmarcada`, "virou troca") |
| Planilha | falta avisada no dia dele e Reposição no dia novo, pela conferência automática |
| Turma | no dia dele: "trocou para 30/09"; no dia novo: "troca (no lugar de 29/09)". Vagas e lista de Reposições dizem "troca" |
| Mensagem para o tutor | "Passando para confirmar: a troca pedida do dia 29/09 (terça-feira) para o dia 30/09 (quarta-feira) foi feita. A Coco Chanel vem na quarta-feira, 30/09." — não fala em reposição |
| Dia lotado | «Avisar a Márcia» leva a troca dentro do pedido; quando ela autoriza, o app faz a troca inteira |
| Não deixa | o dia que sai não é dia dele; o dia novo já é dia dele; o dia que sai já passou (use «+ Falta»); os dois dias iguais; a mesma troca duas vezes; o dia novo ocupado por avulso ou por troca antiga (desfaça lá primeiro) |
| No dia da troca | «Veio repor hoje» e o lançamento de Reposição do dia registram a vinda **pela troca** (`motivo:'troca'`): a tela diz "TROCA CUMPRIDA — as reposições continuam N" e **nenhuma mensagem de reposição** vai ao tutor |
| Desfazer a troca | «desmarcar» ao lado da troca (ou «Tirar e desfazer a troca» nos Lançamentos do dia). Se o crédito nasceu da troca e o dia de origem **ainda não passou**, ele é estornado: a falta avisada sai e ele volta a vir naquele dia. Se o dia de origem **já passou** (ele de fato não veio), a falta fica e vira reposição sem dia. Se a falta já tinha sido avisada antes, ela fica |
| A troca "viva" | só enquanto o dia marcado é o da própria troca (`troca.para === volta`). Remarcada, vira reposição comum — e as telas deixam de dizer "troca" |
| Mensagens ao desfazer (QA16) | desfazer a troca manda ao tutor "a troca do dia 29/09 (terça-feira) para o dia 30/09 (quarta-feira) foi desfeita. A Coco Chanel vem na terça-feira, 29/09, como sempre." — sem falar em reposição. Se a falta fica (o dia já passou ou já tinha sido avisada), a mensagem diz que ela continua valendo e quantas ficam para marcar. «Tirar só o lançamento» não manda nada ao tutor (a marcação ou a troca continua). O saldo mostrado desconta o crédito da troca que sai junto |
| O crédito da troca não é reposição (QA16) | enquanto a troca não é cumprida, o crédito dela não conta como reposição livre: o «Marcar reposição» de outro dia sai como **avulso** (a lei de 21/set: sem crédito livre, é avulso) e o orçamento de hospedagem não o oferece como desconto (`repTrocasPendentes`) |
| Márcia autoriza tarde | o pedido é revalidado antes de gravar: se a troca não vale mais (o dia de origem passou), nada é gravado e a tela diz por quê |
| Estorno na planilha | a falta avisada de um crédito estornado não vai mais para a planilha (e o banho fixo também não a conta) |
| Trocas antigas da Lista de troca | continuam na lista, com o × para cancelar (o × não aparece nas trocas novas — elas se desfazem pelo «desmarcar»). Elas só ocupavam a vaga (sem falta avisada e fora da planilha): para Coco Chanel e Billy Paul, cancele a antiga e faça a troca de novo |

- **Onde está no código:** `dxVereditoTroca`, `repTrocaGravar`, `repTrocaFeitaModal`, `dxTrocaMudou`, `dxTrocaAtual`; `dxVeredito`, `dxConfirmar`, `dxPedir`, `vagasAutorizar`, `repMensagem` ('troca'), `turmaListaDoDia`, `ocupantesDoDia`, `renderReposicao` e `trocaAbrirLancar` ajustadas.

### (R) Reposição: tirar, devolver ao saldo e remarcar

> **Adriana, 25/set/2026:** *"Uma tutora cancelou a reposição da Safira na quarta e não consigo remarcar e nem cancelar. Preciso de poder tirar a reposição e ela voltar para a quantidade que o tutor tem! Com o dia que foi remarcada."*

**Três becos sem saída, fechados:**

| Onde | Antes | Agora |
|---|---|---|
| **Lançamentos do dia › Reposição › Tirar** | o lançamento abatia 1 do Banco de Reposições; tirar tirava da planilha, mas o saldo **não voltava** | a confirmação diz "a reposição volta para o saldo: era N, fica N+1"; tirar devolve o uso daquele lançamento e sai a mensagem pronta para o tutor ("a reposição … que estava marcada para quarta-feira, 30/09, foi desmarcada") |
| **Reposições › Extrato** | só o crédito tinha botão («Estornar»); um uso cancelado não tinha como voltar | o uso tem **«Devolver»** (pede o motivo). O uso da hospedagem (orçamento) não tem: quem o desfaz é o próprio orçamento |
| **Reposições › a marcada para um dia que já passou** | sumia da tela e prendia o crédito: não dava para desmarcar nem remarcar («Marcar reposição» dizia "Não achei um crédito sem dia marcado") | aparece em vermelho: "Estava marcada para 23/09 e ela não repôs · desmarcar". «Marcar reposição» remarca a mesma reposição |

- **Tirar um dia que também está marcado** (na tela de Reposições): a tela pergunta, com três saídas — «Tirar e desmarcar 30/09 (o tutor não vem)», «Tirar só o lançamento (a marcação continua)» ou «Manter». Sem a pergunta, a marcação ficaria e o automático poria a Reposição de volta na planilha.
- **A marcada que já passou só aparece enquanto há saldo livre para ela** (QA14): com o saldo já todo marcado para outros dias, ela não "continua valendo" e não se remarca — senão ficariam mais dias marcados do que reposições.
- **Nada é apagado:** o uso devolvido fica riscado no Extrato; a devolução aparece como "+1 DEVOLVIDA", com o motivo e "devolveu a reposição de dd/mm". A devolução tem chave fixa (`dev-{uso}`): dois toques ou dois aparelhos gravam o mesmo nó.
- **O dia fica guardado:** o crédito mostra no Extrato "marcada para dd/mm", "desmarcada de dd/mm (por quem)" ou "estava marcada para dd/mm e foi remarcada para dd/mm (por quem)".
- **Ligação nova:** o uso criado pelos Lançamentos do dia guarda `lanc:{dia, id}` do lançamento. Os antigos, sem ligação, são achados pelo dia e pelo texto "Reposição lançada nos Lançamentos do dia".
- **Celular:** na lista de Reposições, os botões descem para baixo do texto (antes espremiam o nome até virar uma coluna de uma palavra).
- **Onde está no código:** `repUsoDoLancamento`, `repUsoDevolvivel`, `repVoltasVencidas`, `repDevolverUso`, `repDevolverUsoGravar`, `dashRepDoLancamento`, `repExtratoDesmarcada`; `dashRemover`, `dashRepAbater`, `repCreditoLivre`, `repAgendarVolta`, `repDesmarcar`, `renderReposicao` e `repAbrirExtrato` ajustadas.

### (Q) Fechamento por assunto

> **Adriana, 25/set/2026:** *"Pode seguir com o fechamento por assunto."*

**Antes:** a conversa com o tutor só fechava pelo "Sim" do cartão inteiro, e o cartão só sai quando tudo está em dia. Se o vermífugo já estava registrado na ficha, mas a vacina continuava no cartão, a conversa do vermífugo **continuava sendo cobrada**.

**Agora:** cada **assunto** fecha sozinho quando a ficha deixa de ter item dele no cartão daquele dia.

| O quê | Como |
|---|---|
| Quando | toda vez que uma data de prevenção é gravada na ficha, de qualquer tela (quadro do cartão, aba Prevenção, blocos da ficha, "Vence em" digitado), e só depois de a gravação dar certo. Lançamentos do dia não grava a ficha e, por isso, não fecha nada |
| Dias considerados | antes de fechar, o aparelho relê do banco os dias de conversa (30 dias para trás e 21 para frente), com a mesma trava de 2 minutos da Mesa e de Hoje na Zêluz. Se essa leitura já estiver em curso (a Mesa pediu), espera a leitura chegar. Assim fecha também no aparelho que só abriu a Prevenção e no dia que está aberto em Vencimentos desde cedo |
| Duas gravações seguidas | vale a data mais nova de cada campo: gravar e, logo em seguida, corrigir não fecha pela data que foi desfeita. Se o fechamento da primeira ainda estiver a caminho do banco, a conta da segunda espera que ele chegue (até 15 segundos). Se as duas gravações acabarem fundidas numa conta só, o cartão fechado pelo quadro reabre pela mesma régua que o fechou |
| Onde fica registrado | no mesmo registro da conversa: `daycare/vencimentos/{dia}/{chave}/fechados/{assunto}` = quem, quando e `via: ficha`. Vale para todos os dias em que houve conversa sobre aquele assunto |
| O que fecha | só o assunto que **foi conversado** com o tutor (mandado, respondido, cobrado ou tentado) e que não tem mais item dele no cartão. A pergunta "fazer hoje?" do mesmo assunto que **já tinha saído** fecha junto. A que nunca saiu continua "a mandar" enquanto Hoje na Zêluz a oferecer; a que sair depois do fechamento é outra conversa: espera a resposta e fecha de novo quando a ficha a resolver |
| O que continua aberto | todo assunto com item ainda no cartão (a vacina continua sendo cobrada) e o assunto que ainda nem foi mandado |
| A pergunta "fazer hoje?" | tem janela própria: vale até a próxima vinda (mais a folga de Configurações). Enquanto o item que **ela pergunta** ainda estiver nessa janela, o assunto dela **não** fecha, mesmo que o cartão do dia tenha esvaziado. Em semana de feriado isso importa (ex.: 05/10, ele só volta em 19/10). A régua é a mesma da própria pergunta (`hojeAntecipar`): só segura o assunto perguntado e só o que ela cobre (check-up e exame de fezes, por exemplo, não). No fechamento do **cartão inteiro** pelo quadro, a régua segura tudo o que a pergunta daquele dia cobre, perguntado ou não, no cartão de hoje e no de um dia que ainda vai chegar (a véspera não fecha o cartão de amanhã se, amanhã, com ele na casa, houver pergunta a fazer): a pergunta oferecida e ainda não mandada não pode virar "respondido". Quando a mensagem do dia e a pergunta são do mesmo assunto, ele inteiro fica aberto até o item da pergunta ser gravado, porque o fechamento é por assunto |
| Data apagada | apagar a data não é resolver: o item que virou "em aberto" segura o assunto que foi conversado |
| Reabre | se a data for corrigida para trás (gravou no FILHOt errado e desfez), o assunto que **a ficha** fechou volta a ser cobrado. Se o cartão inteiro tinha sido fechado pelo quadro, ele reabre quando a régua do quadro (`vencQuadroSegura`) volta a encontrar item, também de assunto nunca conversado, e o recado da veterinária volta. A pergunta mandada depois do fechamento não reabre o que a ficha já tinha resolvido. O que o tutor respondeu e o "Sim" dado pela pessoa não são tocados |
| Se o fechamento automático falhar | fica no log de falhas, sem alerta para quem salvou a ficha (a ficha foi salva). Vale também para o fechamento pelo quadro |
| Registro antigo sem o retrato dos itens | o que nunca foi registrado na ficha segura o assunto de base (não fecha). Falha para o lado seguro e sai da faixa de 30 dias sozinho |
| Em todas as telas | cartão de Vencimentos, calendário, contagens, Respostas pendentes, Quem chamar hoje, Hoje na Zêluz e aba Com o tutor, que mostra "**resolvido na ficha** (quem, quando)" |
| Recado da veterinária | sai quando a vacina foi resolvida na ficha. Quando só o "em aberto" fechou (por exemplo, com a data velha da carteirinha) e a vacina ainda deve, o recado **fica**. O recado combinado **depois** do fechamento (pela pergunta mandada depois) também fica. O recado de uma vacina **nunca registrada** ("Nunca fez — fazer aqui") fica enquanto ela deve, mesmo que outra vacina do cartão tenha sido gravada e fechado o assunto vacina |

O fechamento do cartão inteiro (o "Sim" e o fechamento pelo quadro com o cartão vazio) continua como estava.

### (P) Ficha única: aba "Com o tutor" na ficha do FILHOt

> **Adriana, 25/set/2026:** *"Pensando que no futuro humanos, máquina e um agente vão utilizar essas informações: menos cliques, que vá tudo para uma ficha única do cliente e que a informação não se perca."*

**Cadastro de Peludinhos › (FILHOt) › Com o tutor** (aba nova, visível para Consultoras, Supervisão, Gestão e Diretoria):

| Bloco | O que mostra |
|---|---|
| **Agora › O que a ficha deve** | o que venceu, vence hoje ou nunca foi registrado |
| **Agora › Pendências de outro dia** | o que foi lançado para um dia em que ele não veio e volta a ser cobrado na próxima vinda |
| **Agora › Esperando resposta do tutor** | cada mensagem sem resposta, com quem mandou e quando; em vermelho quando passou do prazo e é para cobrar |
| **Conversas com o tutor** | dos últimos 30 dias e dos próximos já combinados, da mais nova para a mais antiga: o assunto, quem mandou e quando, a resposta (quem registrou e quando), as cobranças, as tentativas e se a ficha foi atualizada. A pergunta feita com ele na casa aparece marcada "(com ele na casa)" |

- **No cabeçalho da ficha**, logo abaixo da linha do remédio, aparece uma linha quando há algo em aberto: *"Com o tutor: 1 item vencido · 1 conversa sem resposta · 1 pendência de outro dia"*.
- **Nada é gravado e nenhum nó novo nasce.** A aba é uma leitura das fontes que já existem (`daycare/vencimentos`, `daycare/pendencias` e a própria ficha). Uma cópia consolidada gravada à parte seria a segunda verdade que envelhece.
- **Para agentes:** a mesma leitura (`fichaUnicaDados`) devolve tudo em campos com nome. O contrato está no PRD-006, seção "Arquitetura do ciclo fechado".

**Correções da 6ª rodada do QA (ficha e check-in), antes de publicar:**

| Achado | Correção |
|---|---|
| **A1:** abrir a aba enquanto a primeira leitura da sessão ainda corria **congelava a página** (laço de redesenho) | uma leitura por vez; redesenha só quando algo mudou; no máximo 4 novas tentativas espaçadas, e depois a aba diz "Não consegui ler agora — toque na aba de novo" |
| **M1:** leitura que falhava era refeita sem parar | a mesma trava |
| **M2:** a aba ficava presa em "Montando…" quando a ficha se redesenhava | a ficha redesenhada desenha a aba de novo (vale também para Medicamentos, que tinha o mesmo defeito) |
| **M3:** a aba e as Respostas pendentes discordavam sobre o que espera resposta | "Esperando resposta" usa a mesma régua das Respostas pendentes, com a trava da ficha |
| **M4:** trocar a cor podia estragar o que foi escrito ("rosa choque" virava "azul choque") | a cor só troca a que o próprio seletor pôs; o que foi escrito à mão fica intacto e a cor entra na frente. O seletor acompanha o que se digita |
| Re-QA da 6ª rodada: **CONCERNS — pode publicar**, com 7 ressalvas baixas, todas corrigidas | a aba se atualiza sozinha quando a leitura chega por outra tela; as tentativas param quando a ficha sai da tela; "Rosa Choque", "Verde Água" e "Azul Marinho" escritos à mão não são trocados; o rascunho de Medicamentos sobrevive ao redesenho da ficha; abrir a ficha voltou a ser leve (a régua olha só os registros deste FILHOt); o estado de cada conversa marca "legado" e "substituída" em vez de contradizer a lista; textos |
| Baixos | gênero e plural dos itens novos ("pijama vermelho", "meias vermelhas"), rolagem da barra "Ir para" sem folga a mais, registros antigos (sem assunto, só com a ficha atualizada), aba e linha só para quem fala com o tutor, "ela/ele" conforme o FILHOt, "são dois itens", atalho "Medicação" |

### (O) Check-in da hospedagem no celular: pertences sem digitar

> **Adriana, 25/set/2026:** *"Check-in, preenchimento de hospedagem, está muito difícil. Precisa colocar manual os pertences! Digitar! Está confuso. Tela imensa, sem agilidade nenhuma. Péssima visibilidade no celular."*

Medido a 375 px de largura, antes da mudança:
- a ficha inteira tinha cerca de 5.500 px de altura;
- só o cartão de Pertences tinha 1.267 px: os 12 tipos de item viravam 12 botões empilhados, com a largura inteira da tela;
- cada toque num tipo abria o teclado sozinho, pedindo para escrever.

| O quê | Agora |
|---|---|
| Os tipos de item | viram **pílulas lado a lado**, do tamanho do nome. Os 12 cabem em 5 linhas |
| Tocar num tipo | só adiciona. **O teclado não abre mais sozinho** |
| A cor | é **um toque**, num seletor na própria linha: preto, branco, azul, rosa, vermelho, estampado etc. Concorda com o item ("coleira vermelha", "peitoral vermelho"). Ração, comida natural, petiscos e tapete não têm seletor: ali o que importa é a marca |
| O detalhe por escrito | continua existindo, **opcional** ("Detalhe (opcional): marca, estampa…"). Trocar a cor mexe só na cor e mantém o resto |
| Ir de um cartão a outro | uma barra **Ir para:** logo abaixo do nome do FILHOt, com Datas · Alimentação · Medicação · Pertences · Assinatura e salvar |

- **O dado gravado não mudou:** a cor entra no começo da mesma especificação de sempre. A Conferência, o PDF e o Check-out leem igual.
- O check-in do corpo e o de pertences do Day Care **não foram tocados**. Só o cartão de Pertences do check-in da hospedagem e a barra de atalhos.

### (N) Quem chamar hoje, e "está aqui hoje, está atrasado: podemos fazer hoje?"

> **Adriana, 25/set/2026:** *"Que a gente consiga bater o olho e ver. Que o consultor vire e fale: eu tenho que entrar em contato com fulano, ciclano. E ele só deu um clique, copia a mensagem, já manda."* · *"O peludo está aqui hoje? Vamos fazer hoje. Podemos fazer, tutor? Hoje o peludo já está aqui. Vamos fazer hoje, porque está atrasado."*

**Tela nova: Central Zêluz › Day Care › Quem chamar hoje**, logo abaixo de Hoje na Zêluz, com o contador no menu. Uma lista só, em três gavetas, com **um botão por linha**:

| Gaveta | Quem entra | O botão |
|---|---|---|
| **Estão aqui hoje — podemos fazer hoje?** | quem está na casa com algo que **já venceu**, vence hoje ou vence antes de voltar, e a pergunta ainda não saiu | **Mandar no WhatsApp**: abre a conversa do tutor com a mensagem pronta e marca que saiu |
| **Vêm (próximo dia da casa) — avisar** | a mensagem da véspera que ainda não saiu | o mesmo; grava sempre no próximo dia da casa, qualquer que seja o dia aberto na tela de Vencimentos |
| **Não responderam — cobrar** | mensagem mandada, prazo vencido e nenhuma resposta | **Cobrar no WhatsApp**: abre com a cobrança e marca **Cobrei** |

- **Nada novo é gravado por esta tela.** Cada botão usa o mesmo gesto da tela de origem, e o estado continua em `daycare/vencimentos/{dia}/{chave}`. A resposta do tutor se registra no cartão do FILHOt, em Hoje na Zêluz ou em Vencimentos.
- **O mesmo pedido não sai duas vezes.** Quem foi (ou vai ser) perguntado hoje, com ele na casa, não aparece de novo na gaveta do próximo dia. O cartão de Vencimentos do próximo dia avisa: *"Hoje, com o FILHOt na casa, este assunto já foi perguntado ao tutor — resposta: …"*.
- Enquanto os textos de Configurações não carregam, os botões esperam: mandar o texto de fábrica no lugar do que a Gestão escreveu seria mandar a mensagem errada.
- A mesma leitura (`contatosDados`) devolve tudo em campos com nome: é a porta para um agente ler, no futuro, "com quem falar hoje".

**Hoje na Zêluz: o atrasado virou pergunta.** Antes, o que já tinha vencido era só o alerta vermelho da linha, sem mensagem. Agora:
- vermífugo, 2ª dose, carrapaticida, coleira e escova que **já venceram** (ou vencem hoje) entram no bloco laranja "fazer hoje?";
- a vacina vencida entra só em **dia de atendimento da Veterinária** (segunda a sexta, exceto quinta);
- **não entra** quando a mensagem da véspera já tratou do assunto para hoje (saiu ou foi respondida);
- o bloco ganhou **Mandar no WhatsApp** direto, sem abrir a dobra. **Ver a mensagem** abre o texto para editar; depois de mandada, o botão vira **Registrar a resposta**.

**Correções da 5ª rodada do QA (antes de publicar):**

| Achado | Correção |
|---|---|
| **A1:** dez checagens do harness e dois scripts de captura esperavam as telas antigas | atualizados: a chave `contatos` (lista do Time, subgrupo do Day Care, acesso esperado, 40 itens no menu), o contador "(2 · 2 hoje)", o botão direto, a janela das buscas em `vencGravar`, as Turminhas abrindo a Turma do dia e o "Cobrar no WhatsApp". **Conferido:** ver "Harness completo", no fim desta seção |
| **A2:** com dois aparelhos, a lista lia uma cópia velha: o mesmo pedido saía de novo, e o toque **apagava o "Mandei" do outro aparelho** | antes de gravar envios, respostas, cobranças, tentativas e o lançamento automático, o app **relê do banco** aquele mapa e soma só o assunto do toque (vale para todas as telas). A lista relê o dia ao abrir |
| **M1:** Vencimentos › Hoje oferecia de novo o que o "fazer hoje?" já tinha perguntado | o cartão do próprio dia também avisa; e a pergunta de hoje não some depois |
| **M2:** a cobrança de ontem e a pergunta de hoje sobre o mesmo item apareciam juntas | a pergunta nova substitui a cobrança da velha |
| **M3:** o contador de Quem chamar hoje não acompanhava os toques de outras telas | acompanha |
| **M4:** cada abertura relia centenas de KB | no máximo uma releitura a cada 30 s |
| **M5:** janela do WhatsApp bloqueada era marcada como "mandada" | nada é marcado, e a tela avisa |
| **M6:** o contador pesava a cada marcação da chamada | a conta espera 300 ms e junta as rajadas |
| Re-QA (N2 a N6) | a cobrança velha também sai quando a pergunta nova **já foi mandada**; a lista usa a leitura mais nova das duas; a conversa do dia respondida fecha o "fazer hoje?"; o desfazer usa a memória de depois do "sim"; cobranças e tentativas de dois aparelhos somam; dois toques rápidos gravam em fila, sem um apagar o outro |
| Baixos | concordância no Excel da Turma ("1 vem"), frase da mensagem mista sem generalizar o prazo, subtítulo do quadro, "Nada a mandar para o próximo dia", troca ainda pedida não muda a turma, feriado avisado na Turma, Excel e PDF da Turma (com telefones) só para quem fala com o tutor, botão direto espera os textos de Configurações, "Ver a resposta" com o assunto fechado |

**Mensagens novas em Configurações › Mensagens prontas** (editáveis, com `{itens}` obrigatório):
- *Fazer hoje — já venceu e ele está na casa:* "Olá, {tutor}, tudo bem? 🐾 / Aproveitando que {ofilhot} está conosco hoje: {itens}. / O ideal é aproveitar e fazer hoje mesmo. Podemos? É só nos confirmar por aqui que já deixamos tudo pronto."
- *Fazer hoje — vacina que já venceu:* a mesma abertura, com "A nossa Veterinária atende hoje e pode aplicar durante o dia {dele} aqui. Podemos fazer hoje mesmo?"
- `{itens}` traz cada item com a sua data ("o carrapaticida venceu em 01/09 e a coleira repelente Seresto vence em 27/09"): misturado, nenhum finge estar atrasado.

### (M) WhatsApp em um toque

> **Adriana, 25/set/2026:** *"Ele só deu um clique, copia a mensagem, já manda automaticamente e a gente já resolve."*

Onde havia mensagem pronta para o tutor, o botão principal agora é **Mandar no WhatsApp**. Ele abre a conversa **do tutor** (o telefone da ficha, com o 55) com a mensagem já escrita, incluindo o que a Consultora editou na caixa. Falta só tocar em enviar.

| Onde | O toque também… |
|---|---|
| Vencimentos: mensagem de cada assunto | marca **Mandei** (eram três toques: Copiar, colar, Mandei) |
| Vencimentos: cobrança ("Cobrar no WhatsApp") | marca **Cobrei** |
| Hoje na Zêluz: "Perguntar hoje" (ele está aqui) | marca **Mandei** |
| Reposição: lançada, marcada, desmarcada, usada e abatida | abre a conversa com a mensagem |

- **Copiar** continua ali, ao lado, para quem manda por outro caminho.
- **Sem telefone na ficha**, o WhatsApp abre para escolher o contato.
- **O app não envia sozinho.** Isso depende da API do WhatsApp, que é decisão futura. Quem envia é a Consultora.

### (L) Turminhas → Turma do dia (lista enxuta, com Excel e PDF)

> **Adriana, 25/set/2026:** *"Não precisa aparecer o quadro imenso de peludinhos. O Boris trocou a sexta pela quarta (dia 23) e aparece lá — já era esperado que ele não viria. Preciso conseguir baixar em Excel ou PDF quem vem em cada dia, para mandar mensagens e cobrar vermífugo, vacina etc., junto com quem marcou reposição."*

**Turminhas › (dia)** abre a **Turma do dia**, e não mais a Chamada com o quadro grande. A Chamada daquele dia continua a um toque, no alto. Quem tem menu por atividade, como os monitores, não vê as Turminhas.

| Bloco | Quem entra |
|---|---|
| **Vêm** | os fixos do dia da semana, mais quem vem por **reposição marcada**, por **troca** ("no lugar de 26/09") ou como **avulso** lançado para a data. Hoje também mostra "✓ veio" ou "faltou" da chamada |
| **Avisaram que não vêm** | o fixo com **falta avisada** naquela data (com o motivo e "repõe em…") ou que **trocou o dia** ("trocou para 23/09"). É o caso do Boris |
| **O que cobrar** (em cada linha) | a prevenção vencida ou vencendo, pela mesma régua dos Vencimentos; o que está em aberto na ficha, num chip só; e o que ficou **pendente de outro dia** (Pendências de prevenção: o vermífugo lançado num dia em que ele não veio) |

- **Tocar no nome** abre a ficha.
- **Tocar no que cobrar** abre os Vencimentos daquele dia, com as mensagens prontas.
- **Baixar Excel** e **PDF / imprimir** saem da mesma lista. As colunas são: FILHOt, raça, tutor, telefone, como vem, o que cobrar e reposições.
- **Moradores** (Repolho etc.) não entram: não são turma.
- **Nada novo é gravado:** a tela só lê o cadastro, as reposições, as trocas, as pendências e os avulsos do dia.

### (K) Orçamentos de hospedagem → Check-in

> **Adriana, 25/set/2026:** *"O Pingo já foi embora, já foi feito o check-out dele, e ele continua aparecendo em Estadias fechadas. Era para ele ter ido para Já hospedados. Elizabeth, Pipoca hoje — precisariam de já ir para o check-in direto, assim como o Camus. Poder dar entrada pelo orçamento de hospedagem ou também no check-in. Aqui só está aparecendo a Pipoca do João."*

**O Pingo em "Estadias fechadas".**
- **A causa:** o cliente novo entra no orçamento com a chave provisória `avulso__nome__tutor`. A estadia nasce, no check-in, com a chave do cadastro, e a comparação parava no "avulso". O check-in dele nunca era reconhecido, e o card ficava em "Estadias fechadas" até a saída passar.
- **Agora:** os dois lados são escritos do mesmo jeito antes de comparar (sem o "avulso__", sem acento, sem caixa), e ele desce para "Já hospedados / passadas". Xará de outro tutor continua sendo outro FILHOt.

**O Camus e a Elizabeth fora do Check-in.**
- **A causa:** a lista "sem check-in" nasce da planilha, e o orçamento fechado de cliente novo nem sempre casa com um cadastro lá.
- **Agora:** o **topo do Check-in** tem o cartão **"Chegam pelos orçamentos fechados"**, lido direto dos orçamentos:
  - só os fechados com a entrada até hoje, a saída ainda por vir e o FILHOt ainda sem check-in;
  - quem devia ter entrado antes aparece com o aviso em vermelho;
  - "Fazer check-in" abre a ficha com as datas do orçamento, pelo mesmo atalho da tela de Orçamentos;
  - enquanto as estadias carregam, o cartão não aparece, para ninguém ser chamado a um segundo check-in;
  - ele se refaz sozinho quando um check-in é salvo.

O check-in do corpo e o de pertences não foram tocados. A ficha do check-in da hospedagem também não: só entrou o cartão no alto.

**Correções da 4ª rodada do QA (orçamento e reposição):**

| Achado | Correção |
|---|---|
| **M1:** tutor "Maria" contava como "Mariana" (e "Ana" como "Anabela"): um orçamento podia sumir do cartão ou prender as noites de outra reserva | o começo do nome do tutor vale só até o fim da palavra. "João" continua sendo "João Francisco…" |
| **M2:** com o tutor escrito de outro jeito, o "Fazer check-in" achava a ficha, mas as datas da última estadia sobrescreviam as do orçamento | o bilhete das datas passa a levar a chave da ficha achada |
| **B1:** leitura das estadias que falhou mandava todo mundo fazer check-in | estadias vazias escondem o cartão ("não sei" não é "ninguém entrou") |
| **B2:** os 60 orçamentos eram baixados de novo a cada toque | lidos há menos de 3 minutos, vale o que está em mão |
| **B3:** tutor com ponto ou barra ("Ana C. Souza", "Ana/Pedro") não era reconhecido | ponto, barra, cerquilha, cifrão e colchete viram espaço nos dois lados |
| **B4:** o aviso de desmarcar dizia "0 reposições sem dia" | sem a conta em mão, diz "continua valendo e volta a ficar sem dia marcado" |
| **B5:** cliente de primeira vez: o Novo Hóspede não traz as datas do orçamento | o cartão escreve as datas na linha e diz para cadastrar em Novo Hóspede |

### (J) Reposição: marcar e desmarcar já avisam o tutor

> **Adriana, 25/set/2026:** *"Assinalei a marcação que a tutora pediu para agendar na segunda 28/09 a reposição, e não deu nenhuma mensagem para enviar ao tutor! Precisa ter a mensagem que com a marcação ficará 1 reposição… Caso o tutor desmarque, temos que voltar e desmarcar, e o saldo volta!"*

| O quê | Antes | Agora |
|---|---|---|
| **Marcar a reposição** (tela de Reposições › "Marcar reposição") | o aviso "DIA EXTRA MARCADO", sem mensagem para o tutor. A mensagem só existia ao lançar a falta e quando ele vinha repor | abre a mesma caixa verde de mensagem pronta: "a reposição da Luna ficou marcada para segunda-feira, 28/09. Com essa marcação, fica 1 reposição ainda sem dia" |
| **Desmarcar** | não existia | cada data em "Vem repor em…" tem **desmarcar**. A data sai do crédito e a reposição continua valendo, sem dia. O dia desmarcado fica guardado no crédito (`volta_desmarcada`), com quem e quando. A planilha daquele dia deixa de receber a Reposição na próxima conferência e as vagas se abrem. Sai a mensagem para o tutor: "continua valendo: fica 1 reposição para marcar" |

O saldo de reposição não muda ao marcar: o crédito só sai quando ele vem. A mensagem fala de "quantas ficam **sem dia**", que é o que o tutor precisa saber.

### (I) Correções do QA Gate (Elo 6), antes de publicar

| Achado | Correção |
|---|---|
| Remédio da recepção + check-in de pertences podiam virar **duas doses** (alarme de novo depois de dado) | viram **uma** quando é o mesmo FILHOt e horário, ou o mesmo remédio com até 1 h de diferença. Fica a que já tem "dei" registrado (`medJuntarDoDia`) |
| Remédio lançado para quem **faltou** tocava alarme e cobrava a Gestão | quem está "faltou" sai da fila na montagem e pela chamada viva. O check-in do corpo **não foi tocado** |
| Pernoite de dia anterior: **check-in em dobro** entre aparelhos | três proteções:<br>• a noite é relida no banco antes do check-in e do cancelar;<br>• o fechamento e o cancelamento são por transação;<br>• a noite já coberta por uma estadia sai da lista. A janela passa a ser de 7 dias |
| "Sim" antigo com a ficha devendo aparecia como "respondido" nos contadores | o estado do assunto passa a conferir a ficha |
| Rastro da auditoria sem autor no check-in novo | campo vazio não apaga o autor |
| Servidor da senha | quatro ajustes:<br>• freio por aparelho, e acertar não zera os erros;<br>• a resposta de aparelho não liberado não traz o nome;<br>• o endereço vem pelo `X-Real-IP`;<br>• o resumo do endereço leva sal |

### Provas

Todas rodam sem rede e sem dado de cliente:
- `node tests/fase0-ciclo-fechado.test.js`: 145 provas (com os cenários A, B, D, F, G, H, I, J, K, L e M do fechamento pelo quadro e o fechamento por assunto, incluindo os achados do QA8 ao QA12);
- `node tests/servidor-senha.test.js`: 11 provas.

**Harness completo** (`node tests/harness.js`). Ele precisa do retrato da VPS, que não é acessível daqui. Por isso rodou com um **retrato sintético**, só numa cópia, com o bloco das provas de dado real desligado. O mesmo retrato foi usado nas duas versões:

| Versão | Resultado |
|---|---|
| `master` publicado (`d824fbe`) | 3842 ok · 17 falhas |
| esta branch | 3844 ok · **as mesmas 17 falhas**, nenhuma nova |

As 17 falham nas duas porque o retrato sintético não tem os dados que elas leem. Na primeira comparação, feita com uma base que já tinha parte da Fase 0, **9 checagens falhavam só na branch**. Nenhuma era defeito do app: eram as regras antigas que a Fase 0 mudou de propósito (v-24, v-28 ×2, v-31, v-41, v-46 ×2 e v-47) e a margem de impressão da Turma do dia (v-21). As checagens foram atualizadas com o motivo escrito ao lado.

A do v-28 revelou um furo de verdade:
- quando a ficha ficava toda em dia pelo quadro, o cartão saía da lista e levava o botão "Sim";
- a conversa com o tutor nunca fechava.

Agora quem põe a última data fecha o assunto, com o nome e a hora (`prevCorrigeFecharConversa`).
- Só fecha quando o **cartão do dia fica vazio**, que é quando ele some da lista e leva o "Sim" junto. Qualquer item ainda no cartão segura, mesmo que ainda nem tenha sido mandado ao tutor; enquanto o cartão está na tela, quem fecha é a pessoa, pelo "Sim". O assunto que o tutor recusou não segura.
- Lê a ficha **nova**, a que acabou de ser gravada, e usa a chave dos Vencimentos, qualquer que seja a tela.
- As regras vieram da revisão final do QA, que reprovou a primeira versão.

**Antes de publicar, rodar o harness com o retrato real da VPS.**

**QA Gate (Elo 6):** três rodadas por agente independente.

| Rodada | Veredito | O que achou |
|---|---|---|
| 1ª | FAIL | dose em dobro, alarme de quem faltou, check-in em dobro da pernoite |
| 2ª | FAIL | a junção de remédio olhava só o horário; o cancelar da noite anterior não gravava |
| 3ª | **CONCERNS — pode publicar** | ressalvas |
| 4ª (orçamento e reposição) | **CONCERNS — pode publicar** | M1, M2 e B1 a B5, todos corrigidos (ver K) |
| 5ª (Turma, WhatsApp, Quem chamar hoje) | **FAIL** → corrigido | A1, A2, M1 a M6 e os baixos, todos corrigidos (ver N) |
| 6ª (check-in no celular e ficha única) | **FAIL** (ficha) · CONCERNS (check-in) → corrigido | A1, M1 a M4 e os baixos, todos corrigidos (ver P) |
| Re-QA da 6ª | **CONCERNS — pode publicar** | 7 ressalvas baixas, corrigidas (ver P) |
| Re-QA de `2b4a574` | **FAIL** → corrigido com a regra validada pelo próprio QA | o fechamento pelo quadro ainda fechava um cartão com assunto que nem tinha sido mandado ao tutor (a vacina sumia) e fechava com a ficha devendo. Passou a valer a regra mais simples, testada pelo QA numa cópia: **fecha só quando o cartão do dia fica vazio**. A conversa irmã só fecha o assunto com resposta de verdade (não com "Não respondeu" antigo) |
| QA de `0b1b2ca` e `1ae740c` | **FAIL** → corrigido | a primeira versão do fechamento pelo quadro fechava conversa sem resposta, apagava o recado da veterinária e não fechava o caso certo; a conversa irmã respondida passa a fechar o assunto também no estado (cartão, calendário, contagens); o rascunho de Medicamentos só volta se for do mesmo FILHOt |
| Re-QA final (5ª) | **CONCERNS** | NOVO-1 (MÉDIO): respondida a conversa do dia, a pergunta "fazer hoje?" do mesmo assunto não é mais cobrada, e vice-versa. NOVO-2 a NOVO-6 (baixos): fonte mais nova, prazo da fila, rastro contado pelo que foi gravado, textos. Todos corrigidos |

Destino de cada ressalva da 3ª rodada:
- **C1:** o exemplo do campo agora pede o nome do remédio primeiro: "Ex.: Otomax — gotas no ouvido, 2x ao dia";
- **C2:** nome genérico não junta doses;
- **C3:** o "Sim" antigo continua fechando em todas as telas;
- **C4:** fica como está (só leitura).

Nenhuma função do check-in do corpo, de pertences ou da hospedagem foi alterada.

---

## O que mudou em 24/set/2026 (v 2026-09-24-08)

### (A) O remédio que se multiplicava a cada check-in — a agenda da Lisa

> **Adriana, 24/set/2026:** *"O check-in de entrada da hospedagem da Lisa está confuso: apareceu várias vezes o VitaC e o Ômega 3, ela toma uma vez por dia; tive que remover vários. Por quê?"*

**A causa, exata.** `ciAddMed` criava um id NOVO (`ci_<relógio>_<aleatório>`) para **toda** linha do check-in — inclusive para a que vinha **pré-preenchida da ficha**. Na gravação, cada linha vira `auaulandia/medicacao-agenda/{chave}/itens/{id}.update(…)`. Com id novo, isso **não atualiza** o remédio que já existe: **cria outro igual**. Um check-in, uma cópia. Quatro check-ins da Lisa, quatro VitaC. No banco havia **47 duplicados em 33 agendas** — o Kako com **9 cópias** do PromunDog.

**A correção, em três camadas:**

| Camada | O quê |
|---|---|
| A causa | a linha vinda da ficha **conserva o id da agenda** (`ciAddMed(item, {daFicha:true, agendaId:id})`). Só o que a Consultora digita de novo ganha id novo |
| A régua | `medAssinatura(item)` diz quando dois itens são o **mesmo remédio escrito duas vezes**: nome + dose + medida + local + horários + tipo + contínuo/data-fim + "quando dar" + motivo, tudo normalizado. **Suspenso pela vet** e **parou de tomar** entram na assinatura de propósito — para nunca se juntarem com o item vivo (a lição do caso Hulk) |
| A porta única | `medAgendaGravarItens(chave, meds, contexto)` lê o que está no banco, junta com o que está na tela (a tela vence no mesmo id), deduplica, grava quem fica e **remove** quem sai, com rastro **`medicacao-agenda-dedupe`** (quantos, quais nomes, em quem) |

**Onde a régua vale:** no salvar do check-in (novo, *acrescentar* e *corrigir*), na aba **Medicamentos** da ficha, na lista que vai para a **estadia** (`ciMedsToLista`) e na **abertura** do check-in — dado antigo já duplicado aparece **uma vez só** na tela, e sai do banco no primeiro Salvar.

**O que NÃO mudou:** remédio novo continua entrando normalmente; o histórico, a suspensão da vet e o "parou de tomar" continuam intocados; nada é apagado sem rastro.

---

### (B) Tela nova: **Banhos recorrentes**

> **Adriana, 24/set/2026:** *"Muitos peludos tomam banho já marcado, semanal ou quinzenal, e são do Day Care; o horário é sempre o mesmo. Em vez de lançar no dia, isso já vai automaticamente e a gente só altera se o tutor mudar. Ex.: Lana toma banho de 15 em 15 dias, às quintas, a partir de 01/10. Nick da Cláudia toma banho toda quinta. Preciso de uma caixa fácil para marcar 'esse peludo tem banho ou não', sem entrar na ficha e fazer todo um cadastro. A ficha está muito confusa."*

| Onde fica | Central Zêluz › Day Care, **logo antes de Lançamentos do dia** (a ordem alfabética do bloco) |
|---|---|
| `data-v` | `banhos` |
| Quem vê | a **mesma** classe de Lançamentos do dia: `so-recepcao`. Quem lança banho é quem combina banho |
| Quem grava | quem edita ficha (`canEditPel` → capacidade `editar-peludinho`: Central Zêluz, Supervisão, Gestão, Diretoria). O `setPelExtra` barra o resto mesmo se a função for chamada por fora — **esconder não é impedir** |
| Onde o dado mora | na **ficha** (`pelExtra.banho_rec`), como todo o resto. Nenhum nó novo |

**A tela.** Uma linha por FILHOt ativo, com busca por nome no topo, e um interruptor **"Tem banho fixo"**. Ao ligar, os botões aparecem **na própria linha** — sem abrir a ficha:

| O botão | O que diz |
|---|---|
| Ritmo | Semanal · Quinzenal |
| Dia | Seg · Ter · Qua · Qui · Sex |
| Hora | 08:00 a 17:00 de meia em meia hora, mais um campo de hora livre ao lado |
| A partir de | a data em que o combinado começa a valer (ao escolher o dia, ela anda sozinha para a próxima ocorrência daquele dia) |
| Shampoo | Sim, trouxe o dele · Comprou aqui na loja · Não trouxe |
| Onde está | Está na recepção · Está na bolsa dele (só aparece quando há shampoo) |
| Observação | texto curto |

Antes do **Salvar**, a linha mostra a frase inteira que vai para a planilha: *"Vai para a planilha assim: **Lana/Cocker (SHAMPOO · NA RECEPÇÃO)** · hora **10:00**"*. **Nada é gravado antes do Salvar daquela linha**, e cada gravação deixa rastro **`banho-recorrente`**, de → para.

**A conta do ritmo.** Quinzenal conta a paridade **a partir de `desde`**: 01/10 (quinta) → 01/10, 15/10, 29/10 — e nunca 08/10. Semanal é toda semana no dia escolhido. Antes de `desde` não existe combinado nenhum.

**Um dia específico** se resolve por **exceção**, sem desfazer o combinado: **"Pular o próximo (dd/mm)"** e **"Mudar só o dia dd/mm"** gravam em `banho_rec.excecoes[dia]`. As exceções ficam visíveis na linha, com um "desfazer" ao lado — exceção esquecida vira surpresa.

**O lançamento automático.** É o **mesmo motor** das reposições (`dashAutoCalcular` / `dashAutoSincronizar`), agora com a fonte `banho`. Hoje e nos **14 dias** seguintes (`DASH_AUTO_FUTURO.banho`), ele escreve o nome na coluna **"Banho"** e a hora em **"Hora Banho"** — a primeira fonte automática com hora (`DASH_AUTO_COLS_HORA`), e é ela que faz o alarme tocar na TV.

| A trava | Por quê |
|---|---|
| Respeita `dashNomePlanilha` | com xará, o nome leva o primeiro nome do tutor — o mesmo que a recepção escreve |
| Não duplica o manual | dedupe pelo nome (`dashAutoNomeChave`): se a recepção já lançou o banho dele naquele dia, o automático não escreve de novo |
| Feriado e domingo | a casa não abre: não lança (`orcFechado`, a **mesma** lista do Orçamento) |
| Falta avisada | o dia que gerou o crédito da reposição é dia em que ele não vem: não lança |
| Quem não vem no dia | fora dos dias da ficha, não lança. **Reposição agendada** para aquele dia **conta como vir** |
| Marcado FALTOU na chamada | o automático deixa de querer aquele banho — e **tira da planilha o que ele mesmo escreveu**, com a hora junto (a regra que já valia para a reposição) |

Nos **Lançamentos do dia**, a linha do automático aparece no **próprio cartão Banho**, com a etiqueta **"automático · banho fixo"** e sem botão "tirar": ela se corrige na origem, que é esta tela.

**Onde mais o combinado aparece** (a lei do *"dado carregado numa tela só some nas outras"*):

| A tela | O que mostra |
|---|---|
| Cadastro de Peludinhos | etiqueta na linha: *"🛁 banho quinzenal qui 10:00"* ou *"sem banho fixo"* — e ela é o **atalho** para esta tela, já com o nome na busca |
| Hoje na Zêluz | na primeira linha do FILHOt: *"🛁 banho hoje 10:00 (fixo)"* — inclusive no texto que vai para o WhatsApp e para o Excel |
| Vencimentos | no cartão, ao lado do remédio de uso contínuo: quem fala com o tutor sobre vacina também precisa saber que ele já tem banho marcado |

**A rede de testes.** Bloco **v-48** em `tests/harness.js` (72 provas): a assinatura e a dedupe da medicação, a gravação que não duplica ao salvar duas vezes, o ritmo quinzenal caindo em 01/10, 15/10 e 29/10 (e não em 08/10), o semanal toda quinta, as exceções, o automático escrevendo Banho + Hora Banho no dia certo, não duplicando o manual, pulando feriado, falta avisada e FALTOU, e o interruptor + Salvar gravando `banho_rec` com rastro. O bloco cobre ainda a Prevenção (parte C). Capturas em `docs/capturas-v36/` (`tests/capturar-v36.js`), incluindo a tabela da Prevenção com e sem o botão dos 30 dias.

---

### (C) Prevenção: só o que está em aberto, e em tabela

> **Adriana, 24/set/2026:** *"Fui em Prevenção e procurei a Cindy. Aparece a vacina que só vence dia 12. Eu preciso só do que está em aberto. A coleira está vencida, ok. A escova de dente vai ser trocada na semana que vem, e ele não me deixa ir para a semana que vem. Só tem que aparecer o que está vencido ou que não tem data. Não dá para ficar aparecendo tudo; se aparece tudo, a gente não consegue ver. Se não tem nada vencido, não aparece: está tudo em dia. Preciso de uma tabela. Facilitar a vida aqui."*

**O que é "em aberto".** Vencido (a data já passou) **ou** sem data nenhuma na ficha. Nada mais. O que vence lá na frente não é dívida — é agenda, e agenda tem tela própria (**Vencimentos**). Onde isso aparecia era no painel que abria ao tocar no FILHOt: ele listava os **onze** itens de `PREV_ITENS`, inclusive os que estavam em dia. A lista em si já só trazia vencido/sem data — o que poluía era o painel.

| O que muda | Como |
|---|---|
| A lista | uma **tabela**: uma linha por FILHOt, uma coluna por item que **alguém** está devendo (item que ninguém deve não vira coluna) |
| A célula | o mesmo **chip tocável** de sempre — "venceu 01/09", "sem data", "A FAZER NA ZÊLUZ" — e toca-se nele para gravar ali, sem sair da tela (`prevCorrigePainelHTML`, tela `'prev'`) |
| Em dia | um **traço**. Traço quer dizer "em dia" |
| O nome | é botão: abre a ficha de prevenção inteira daquele FILHOt, numa linha logo abaixo (a tela antiga continua existindo — mudou de porta, não sumiu) |
| Quem não deve nada | **não aparece** — e o resumo diz quantos são: *"FILHOts em dia — nada vencido nem em branco"* |
| Data na célula | **dd/mm** quando é deste ano; com outro ano, a data inteira — "venceu 01/09" de 2024 ao lado de um de 2026 enganaria |
| Largura | a tabela rola **dentro da própria caixa** (`overflow-x:auto`); a coluna do nome tem largura fixa, senão no celular ela come a tela |

**O botão dos 30 dias.** *"Mostrar também o que vence nos próximos 30 dias"* liga uma janela (`prevJanela()`, padrão **zero**) que acrescenta o que vence até lá, com tipo **próprio** (`avencer`) e cor própria — nunca confundido com dívida em conta nenhuma. A escolha fica guardada **no aparelho** (`zeluz_prev_janela`): quem trabalha assim não reaperta todo dia. Ligado o botão, quem só tem item por vencer entra na **mesma aba** de quem está devendo — ligar é dizer *"quero ver também"*, não *"quero trocar de aba"*.

**A régua em uma linha:** `prevFaltasDe(ficha, janela)` — `janela = 0` devolve só vencido e sem data; `janela = 30` acrescenta o que vence em até 30 dias. `prevAbertas(faltas)` separa dívida de agenda, e é só a dívida que classifica o FILHOt (`prevClasse`).

### "Vence em" aceita data futura — em todo lugar

É justamente *"vai ser trocada na semana que vem"*. Conferido campo a campo, e agora provado pela rede de testes:

| Onde | Regra |
|---|---|
| Ficha (`prevVenceCampoHTML`) | `min="2015-01-01" max="2035-12-31"` — futuro é o ponto do campo |
| Cadastro novo (`naV_*`) | idem, e a validação só confere o **ano** (2015–2035) |
| Painel da tela (`prevCorrV_*`) | idem |
| `prevVenceManualSet` | **não** barra futuro em lugar nenhum |
| **"Feito em"** (`prevCorrT_*`, `prevT_*`, `naP_*`) | `max = hoje`, e a validação recusa por dentro, com o recado que manda ao campo certo: *"A data em que foi feito está no futuro. Se o que você sabe é quando VENCE, use o campo «Vence em…»"* |

**Dois consertos que vieram junto.** (1) O texto que a recepção cola no WhatsApp e o Excel passaram a usar a **mesma frase** da célula — antes escreviam "sem data" para um item que apenas ia vencer. (2) No bloco dos **hóspedes**, o botão *"lançar a data que ele mandou"* **não abria nada**: o hóspede sai da lista dos aulunos, e era só lá que a ficha de lançamento era desenhada. Botão que não faz nada e não diz por quê é a falha muda de sempre — agora a ficha abre ali mesmo.

Gravado um vencimento futuro, o item **sai** da lista de abertos na hora (passou a ser futuro) e a confirmação verde diz *"em dia até 01/10 **(marcado à mão)**"*. Com o botão dos 30 dias ligado ele reaparece como *"vence 01/10 (à mão)"*. O rastro `prevencao-atualizada-na-tela` agora também diz **"atualizado na tela Prevenção"**.

---

## O que mudou em 24/set/2026 (v 2026-09-24-03)

Adriana, em 24/set/2026:

> "Em turminhas daycare, não está aparecendo quem veio. Essa ficha precisa ser preenchida; quando faz o check-in do corpo automaticamente já pode preencher com quem veio. E preciso desse relatório de forma sucinta na Central Zêluz › Day Care: precisamos na recepção saber todo mundo que está hoje e que está com pendência de algo (carrapaticida, vermífugo, escova, vacinas)."

### O diagnóstico: o banco estava certo, a tela é que não se redesenhava

No banco daquele dia, `daycare/chamada/2026-09-24` tinha **34 chaves `veio`** e havia **34 check-ins do corpo**. O check-in de **entrada** já grava a presença sozinho desde sempre. O que não acontecia era o **redesenho**: `carregarChamada` lia o nó com `once('value')` e a tela ficava com a fotografia do instante em que foi aberta. Quem abriu a Chamada às 7h50 via a turma inteira como *"PENDENTE — marque"* o dia todo, mesmo com todo mundo já dentro da casa.

É a lei de 28/ago em outra roupa: **aviso que depende de reabrir a tela não é aviso**.

### A Chamada ficou viva

| O quê | Como |
|---|---|
| O nó do dia | `daycare/chamada/{dia}` passou a ter **ouvinte vivo** (`chamadaVivaLigar`, pelo `zMapaVivo` — o mesmo mecanismo econômico do check-in do corpo): desce **uma vez**, e cada marcação nova chega como delta |
| Quem se redesenha | a Chamada, o Check-in do corpo, a tela **Hoje na Zêluz** e o contador do menu — todos no mesmo lugar, a partir da mesma fonte |
| Quando o dia vira | o ouvinte do dia **velho** é desligado (`zMapaDesligar`): nó de ontem escutando é download que ninguém lê |
| Segundo download | nenhum — `carregarChamada` e `carregarCheckin` agora pedem `zMapaUma(chamadaNo())`, servido do mesmo retrato |
| Na linha do FILHOt | o cartão verde diz de **onde** veio a presença: *"presente pelo check-in às 07:52"* (a hora sai do nó do check-in do corpo do dia, que a tela do Check-in já mantém vivo) ou apenas *"presente"* |
| O check-**out** | continua **sem encostar** na chamada. A gravação é guardada por `if(entrada)`, e agora com comentário de lei: quem sai continua tendo vindo |

### Tela nova: **Hoje na Zêluz**

| Onde fica | Central Zêluz › Day Care, **primeiro item do bloco** |
|---|---|
| `data-v` | `hoje` |
| Quem vê | Central Zêluz (consultora), Supervisão, Gestão e Diretoria — pela capacidade `hoje-na-casa` na tabela `PERM`, revelada por `aplicarPermMenu()`. O monitor **não** vê: a lista dele é a Chamada, com o FILHOt na frente. |
| Também é concedível | sim — entrou em `NAV_PAGINAS_ALL` (tela do Time), com o **mesmo rótulo** do sidebar |
| Onde os dados moram | em lugar nenhum novo: a tela **junta** o que já existe (ver a tabela abaixo) |

**Por que ela fura a ordem alfabética do bloco.** É a pergunta que a recepção faz primeiro todo dia — quem está aqui agora. Tudo o mais do Day Care se resolve depois de saber isso.

**De onde vem cada pedaço** (nenhuma fonte nova, e nenhum download novo):

| O pedaço | A fonte |
|---|---|
| Quem está na casa | a chamada do dia (ouvinte vivo) + o check-in do corpo do dia + a estadia ativa da AuAulândia + os moradores da casa — tudo por `turmaDeHoje()`, já deduplicado |
| O que venceu | `vencItensDe(ficha, hoje, 0, hoje, {incluirSemRegistro:true})` sobre `PREV_ITENS` — a **mesma** regra de *Vencimentos*, e desde 24/set/2026 trazendo também o que **nunca foi registrado** na ficha |
| Remédio contínuo | `medLinhaDoPel(ficha)` — a mesma linha de toda tela |
| Pendência aberta | `daycare/pendencias/{chave}` (`PEND_ABERTAS`, v-19-05) |
| Resposta que o tutor não deu | `daycare/vencimentos` dos últimos dias (`VENC_PEND`, v-21-01) |

**Quem está na casa — quatro respostas, e a primeira que responder manda:**

1. a chamada diz `faltou` → **não** está (é a palavra de quem marcou, e ela vence tudo);
2. tem check-in do corpo de **entrada** hoje → está, e com a hora em que entrou;
3. a chamada diz `veio` → está (alguém marcou no dedo, sem passar pelo check-in);
4. hóspede com estadia ativa, ou morador da casa → está: ele dorme aqui e não depende de ninguém marcar chamada.

**A folga é ZERO aqui.** Em *Vencimentos* a folga (padrão 7 dias) existe para a consultora avisar **antes**. Nesta tela a pergunta é outra — *quem está com pendência agora* — e item que só vence daqui a seis dias, numa lista lida em pé no balcão, é ruído. Ruído esconde o que é urgente. Quem quer o de amanhã abre a tela de amanhã.

**A linha**, na frase que ela ditou:

```
Simba/Spitz · tutor Thais · ⚠ vacina antirrábica venceu 24/03 · ⚠ vermífugo venceu 20/08 · 💊 toma remédio · pendência: vermífugo de 18/09
```

**O cabeçalho** traz os dois números — *"20 presentes · 13 com pendência"* — e é a **mesma conta** do contador que aparece ao lado do item no menu (`navHojeN` = presentes **com pendência**). O contador desce na **entrada**, junto com os das Pendências de prevenção e de Vencimentos: quem entra às 8h vê na primeira tela quantos FILHOts já estão na casa devendo alguma coisa.

**A ordem:** quem tem pendência vem **primeiro**; dentro de cada grupo, ordem alfabética. É a ordem em que a recepção trabalha.

**Os filtros**, em botão, cada um com a sua contagem: Todos · Só com pendência · Vacina · Vermífugo · Carrapaticida · Coleira · Escova.

**Sai da tela:** **Copiar lista** (texto puro, uma linha por FILHOt, pronto para o WhatsApp — com queda para um campo já selecionado quando o navegador não tem área de transferência) e **Baixar Excel**, que também virou relatório na Central de Relatórios (`relHojeNaCasa`). Os três — tela, texto e Excel — saem da **mesma** lista e das **mesmas** frases: duas escritas da mesma linha viram duas verdades.

---

## O que mudou em 21/set/2026 (v 2026-09-21-01)

Adriana, em 21/set/2026:

> "Nós temos dentro do aplicativo a parte de trocas: vacinação, que é importantíssimo no nosso processo, a vermifugação, o carrapaticida, a troca de coleiras, tudo isso é muito importante, nós temos também a troca de escova dental. Todas essas questões são de suma importância. Eu preciso facilitar esse processo. Como? Tudo que for vencer no dia, eu ter um calendário do dia para o setor de consultoria, onde vai mandar; isso tem que mandar para o peludo antes dele vir. Vamos imaginar que o dia do Otávio seja amanhã. Hoje tem que perguntar para o tutor: fulano, amanhã pode fazer isso, isso e isso no Otávio? (…) O fluxo hoje não está dando certo: as pessoas estão mandando e não estão finalizando aquilo dali. A gente precisa que dê uma resposta. (…) Então tem que perguntar: já foi atualizada a ficha? E a pessoa tem que clicar em sim ou não."

### Tela: **Vencimentos** — "Está vencendo"

> **24/set/2026 — Adriana:** *"Aqui no Day Care, em Vence amanhã, coloque 'Vencimentos' aqui dentro; o título 'está vencendo', e abrindo no sidebar aparece segunda, terça, quarta, quinta, sexta. Preciso que todos os que estejam com alguma pendência de quinta-feira e que estão aí, estejam aqui dentro — os que vieram na aula hoje. (…) Quem está com pendência? Hoje: fulano, fulano. Amanhã: fulano. E quais são as pendências? Tudo organizado para eu arrumar e deixar zerado. Com pendência de vermífugo, carrapaticida, todas as vacinas e a escova dentária que estava sem nada."*

**O que mudou nessa data:** o item do menu virou **sub-sanfona** (`Vencimentos`) com seis filhos — **Hoje · Segunda · Terça · Quarta · Quinta · Sexta** —, o título da tela passou a ser **"Está vencendo"** (subtítulo *"quem vem {dia} e o que está em aberto"*), o que **nunca foi registrado** na ficha passou a contar como pendência e nasceu o bloco **"Quem vem {dia} com pendência"**, com os nomes em fila por tipo e um **Copiar resumo**.

| Onde fica | Central Zêluz › Day Care, **logo depois de Prevenção** |
|---|---|
| `data-v` | `vencimentos` |
| Quem vê | Central Zêluz (consultora), Supervisão, Gestão e Diretoria — pela capacidade `vencimentos-amanha` na tabela `PERM`, revelada por `aplicarPermMenu()`. O monitor **não** vê: quem fala com o tutor é a recepção. |
| Também é concedível | sim — entrou em `NAV_PAGINAS_ALL` (tela do Time), com o **mesmo rótulo** do sidebar |
| Onde os dados moram | `daycare/vencimentos/{dia}/{chave do FILHOt}` |
| O texto e o prazo | `daycare/config/textos/vencimento` — editáveis em **Configurações › Mensagens prontas** |

**Por que ela não é alfabética no bloco.** Todo o subgrupo Day Care da Central está em ordem alfabética até *Planos e cobranças*; "Vencimentos" fura a ordem e fica colado em **Prevenção** porque é a outra metade do mesmo trabalho: a Prevenção diz **quem deve**, esta diz **o que fazer hoje** a respeito de quem vem no dia. Separá-las por uma letra faria a consultora procurar em dois cantos do menu.

**A sub-sanfona dos dias (24/set/2026).** O item é `<a data-v="vencimentos" class="nav-parent" data-acc-toggle="c-vencimentos">`, dentro de `<div class="acc" data-acc="c-vencimentos" data-acc-perm="vencimentos">`. O `data-v` **não mudou** — é por ele que a permissão (`PERM_MENU`) e o espelho da tela do Time (`NAV_PAGINAS_ALL`) encontram a tela. Clicar no pai **abre a gaveta E vai para a tela** (item de menu que só abre gaveta é função enterrada). Cada filho é `<a class="nav-dia" data-vdia="…">` e chama `vencIrDia()`: **Hoje** abre o dia de hoje; os outros abrem a **próxima ocorrência** daquele dia da semana — numa quinta, *Quinta* é hoje, *Sexta* é amanhã e *Segunda* é 28/09. Feriado não é dia de Day Care: a próxima ocorrência pula para a semana seguinte.

**A lei dos três níveis continua de pé:** categoria 17px/700 › sub-cabeçalho 15px/700 › item 14px/500 › **dia 13px/500**. Filho nunca é maior que o pai. Sem permissão, a **gaveta inteira** some junto com o pai (`data-acc-perm`) — esconder só o `<a>` deixaria os dias à mostra.

**O dia-alvo.** Por padrão, o **próximo dia de Day Care** — amanhã; se amanhã for sábado, domingo ou feriado, o próximo dia útil. A lista de feriados é a **mesma** do Orçamento (`orcEhFeriado`), que a Gestão já edita: duas listas discordariam. O seletor tem **Hoje**, **Amanhã** e o calendário para qualquer outro dia.

**Quem entra na lista.** Cada FILHOt da turma daquele dia (mesma porta do Day Care, `turmaDoDia`, com a aba trocada e devolvida) que tenha pelo menos um item de `PREV_ITENS` **vencido ou vencendo até o dia-alvo mais a folga** (padrão 7 dias, ajustável). Entram vacinas, carrapaticida, coleira, vermífugo, exame de fezes, **troca de escova de dentes** e check-up. Ficam de fora: data quebrada (ano 0026 é ficha para corrigir) e a regra de sempre — *ou é vermífugo ou exame de fezes*.

**E o que NUNCA foi registrado (24/set/2026).** *"…e a escova dentária que estava sem nada."* Item de ficha sem data nenhuma não vence nunca — e por isso sumia de todas as contas. Agora ele entra como **"em aberto — nunca registrado"** (`sem_registro:true`), em **cor própria** (azul), nunca em vermelho: ninguém deixou vencer, a ficha é que nunca recebeu a data. A lista é a dela: **as três vacinas, o vermífugo, o carrapaticida e a troca de escova**. O **exame de fezes** e o **check-up** ficam de fora (não foram citados), e a **coleira** só entra quando a ficha diz a marca (`col_nome`) — sem marca não há coleira para cobrar.

Quem liga isso é o parâmetro `vencItensDe(ex, diaAlvo, margem, hoje, {incluirSemRegistro:true})`, e **só duas telas o pedem**: esta e **Hoje na Zêluz**. A **Prevenção não mudou** — continua lendo por `prevPendencias()`, exatamente como antes. O item em aberto **não se lança** na planilha nem vira recado para a veterinária: o que se faz com ele é pedir a data ou a carteirinha ao tutor.

**Antes dos cartões, a lista do dia (24/set/2026).** O bloco **"Quem vem {dia} com pendência"** mostra, por **tipo** de pendência, os nomes em fila — *Vermífugo: Simba · Lana · Ozzy*. A ordem das linhas é: vermífugo · carrapaticida · vacinas · coleira · escova de dentes · exame de fezes e check-up · **em aberto na ficha**. O botão **Copiar resumo** gera o **mesmo** texto em texto puro (`vencResumoTexto`), para colar no WhatsApp — duas escritas da mesma lista viram duas verdades, então tela e texto saem da mesma função.

**O cartão traz**, nesta ordem: nome, raça e tutor · telefone (quando a ficha tem) · os itens com a data (*"Carrapaticida — venceu em 22/07"*) · a **mensagem pronta** numa caixa **editável antes de copiar** · **Copiar mensagem** e **Mandei** · os quatro botões de resposta do tutor · e, quando é a hora, a pergunta da ficha.

**A mensagem.** O modelo é o dela, e mora em Configurações — não no código. As chaves: `{tutor}` (primeiro nome), `{filhot}` (só o nome), `{ofilhot}` (o nome com o artigo certo: *"o Otávio"*, *"a Lana"*), `{dele}`, `{ela}`, `{itens}` (a lista com as datas) e `{dia}` (*"amanhã, terça-feira (22/09)"*). Há **dois** modelos: o padrão e o de **vacina** — vacina não se faz na recepção, então a frase vira *"Podemos agendar com a veterinária?"*. Quando a lista **mistura** vacina com os demais vale o padrão, e a tela avisa a consultora em uma linha.

**As duas mensagens novas (24/set/2026).**

| Modelo | Quando sai | Chaves próprias |
|---|---|---|
| **Em aberto na ficha** (`aberto`) | Quando o FILHOt tem item que nunca foi registrado | `{itens_abertos}` — a lista com o artigo certo |
| **Vacina — agendar no próximo dia dele** (`vacina_agendar`) | Quando o dia do FILHOt **não** é dia de atendimento da nossa Veterinária (a quinta) **e** se sabe quando ele volta | `{proximo_dia_vet_dele}` e `{data}` — o próximo dia da ficha dele que também é dia dela |

Sem saber quando ele volta, vale o texto antigo (`vacina`), que oferece um **horário** em vez de um dia: inventar um dia de vinda para o tutor é pior do que não oferecer nenhum. `{vencer}` passou a concordar também com o **tempo** — *vence · vencem · venceu · venceram*.

**"Aplicar no dia dele" agora grava QUAL dia.** O botão volta a aparecer numa quinta quando há um próximo dia dele que seja dia da veterinária — é exatamente o que a mensagem ofereceu ao tutor —, e `vet.dia` passa a ser esse dia (`vencDiaAgendado`). O quadro **Avisar a veterinária** e a linha que vai para o grupo dela mostram essa data.

**A resposta do tutor, em botão** (resposta escrita à mão vira "ok" e não diz nada a quem ler depois):

| Botão | O que faz |
|---|---|
| **Pode fazer na Zêluz** | Abre um bloco que pergunta, item por item, **onde está o produto** (na bolsa dele · comprar aqui na loja) e a outra resposta que os Lançamentos do dia já exigem (quanto vai ser dado; onde a coleira vai ser trocada). **Nada grava enquanto ela responde** — só no **Confirmar**, que mostra antes a frase inteira que vai para a planilha. Aí o item é lançado em `daycare/dashboard/{dia-alvo}` pela **mesma porta** dos Lançamentos do dia (`dashLancar`), com `det.onde` — e por isso vai à planilha e à TV. Se ele faltar no dia, vira **pendência** sozinho. |
| **Tutor faz em casa / no veterinário** | Registra a resposta e abre a pergunta da ficha na hora — a data nova só existe com o tutor. |
| **Não quer agora** | Registra e o cartão fica aberto. |
| **Não respondeu** | Registra e o cartão fica aberto: continua contando como assunto em aberto. |

Trocar de botão **troca** a resposta, e a auditoria registra que mudou — errar aqui tem conserto.

**"Já foi atualizada a ficha?" — Sim / Não.** Só **Sim** fecha o cartão (`ficha_atualizada`, com quem e quando). **Não** o mantém aberto com a frase *"Falta atualizar a ficha: {itens}"* e o link **Abrir a ficha**. Para quem vai **fazer na Zêluz** a pergunta só aparece **depois do dia-alvo**: até lá a ficha se atualiza quando a aplicação for registrada, e perguntar antes é cobrar o que ainda não aconteceu. Cartão fechado pode ser **reaberto**.

**Idempotente:** a chave é `{dia}/{chave do FILHOt}`. Reabrir a tela não duplica nem apaga o que já foi respondido, e confirmar de novo não lança duas vezes — quando o item já está no dia, o cartão diz *"já estava lançado"* em vez de mentir que lançou.

**O aviso que não depende de abrir a tela:** um quadro **Vence amanhã — N mensagens para mandar** em **O que fazer hoje** (nas três mesas: Gestão, Supervisão e Recepção) e no **Dashboard das Consultoras**. Ao lado do item do menu, o contador de **hoje** (quantos da turma de hoje estão com pendência; em dia sem Day Care, o do próximo dia), mais o que já passou do prazo e precisa ser **cobrado**, de qualquer dia. Enquanto o dia não desceu do banco, o quadro mostra "…" — nunca afirma que não há nada.

**Uma conta só:** `vencContagem()` devolve *total*, *para mandar* e *sem resposta*. O menu, a mesa e o Dashboard das Consultoras leem daí — "quase igual" é como nascem duas telas brigando.

**Telegram:** de propósito, **nenhum aviso sai daqui** — a mesma razão das Pendências de prevenção. Os grupos que existem na ponte são o da veterinária, o do almoço, o do plantão da AuAulândia, o Diário do Daycare e o de URGÊNCIAS. Nenhum deles é o grupo da recepção, que é quem faz este trabalho — e mandar para o grupo errado é o erro que já custou caro. Quando existir um grupo da recepção, é ali que a linha nasce.

### Cartão novo em Configurações: **Mensagens prontas**

Os **dois textos** da mensagem e a **folga em dias** moram no banco e se editam aqui, sem programador (a lei de 22/ago). Salvar sem `{itens}` é recusado — a mensagem tem de dizer **o que** está vencendo — e a folga precisa ficar entre 1 e 90 dias. Há um botão **Voltar ao texto de fábrica** que devolve os campos ao padrão **sem gravar**: quem grava continua sendo o Salvar.

**Provas:** bloco `v-28` do `tests/harness.js` (o item no menu, no espelho e no `PERM`; o calendário que pula fim de semana e feriado; a função pura `vencItensDe`; a mensagem com o texto de Configurações e a concordância de gênero; a lista provada contra o **cadastro real** do retrato — quem vem na terça e está vencendo entra, quem está em dia não; "Mandei", as respostas e o lançamento no dia-alvo com `det.onde`; a idempotência; a pergunta da ficha; e os quadros da mesa e das Consultoras) e a captura `tests/capturar-v28.js` (`docs/capturas-v28/`).

---

## O que mudou em 19/set/2026 (v 2026-09-19-05)

Adriana, em 18/set/2026:

> "Em toda a parte do dia, vermífugo, carrapaticida, coleira que tem que trocar, tudo, se o peludo não estiver lá no dia, igual hoje, tá lá que o Batata tem que tomar vermífugo. No entanto, o Batata não foi hoje. Então isso precisa de um alerta avisando que vira uma pendência para colocar para o próximo dia que o Batata vier. Então tem que ter uma área de pendências, porque isso é muito sério, senão vai esquecendo."

### Tela nova: **Pendências de prevenção**

| Onde fica | Central Zêluz › Day Care, logo depois de **Lançamentos do dia** (a ordem alfabética do bloco) |
|---|---|
| `data-v` | `pendencias` |
| Quem vê | Central Zêluz (consultora), Supervisão, Gestão e Diretoria — pela capacidade `pendencias-prevencao` na tabela `PERM`, revelada por `aplicarPermMenu()`. O monitor **não** vê: vermífugo e coleira resolvem-se na recepção, com a bolsa do tutor. |
| Também é concedível | sim — entrou em `NAV_PAGINAS_ALL` (tela do Time), com o **mesmo rótulo** do sidebar |
| Onde os dados moram | `daycare/pendencias/{chave do FILHOt}/{item}` |

**O que vira pendência (e só isto):** `vermifugo` · `carrapaticida` · `coleira` · `medicacao` · `hidratacao` — o que é **aplicado no FILHOt** e tem data. Banho, veterinário, avulso, falta avisada, festa, reposição, adaptação e avaliação **não**: ou não dependem de o corpo dele estar aqui, ou já têm o seu lugar no sistema.

**Os dois caminhos, que são os dela:**

1. **Lançado DEPOIS de o dia fechar ou de a falta ser marcada** — o cartaz aparece na hora, para quem lançou: *"O Batata não veio em 18/09. O lançamento de Vermífugo ficou guardado como PENDÊNCIA."*
2. **Lançado ANTES** (ela deixa marcado para a segunda-feira) — quando aquele dia fecha (a falta automática das `CK_HORA_FALTA` horas) **ou** quando alguém marca a falta na chamada / no check-in, o app varre os lançamentos daquele dia e abre as pendências de quem não veio. É o caso do Caco, marcado para a terça 22.

**Idempotente:** a chave é fixa — `{chave}/{item}`. Rodar duas vezes não duplica; o segundo dia entra na lista `dias` e a pendência continua sendo **uma**.

**Sair da lista tem dois caminhos, e só dois:**

| Botão | O que faz |
|---|---|
| **Resolvido hoje** | Relança o MESMO item no dia de **hoje**, pela MESMA porta dos Lançamentos do dia (`dashLancar`) — e por isso vai à planilha e à TV, com as mesmas respostas (`1 COMPRIMIDO · NA BOLSA`). A pendência fica `resolvida`, com **quem** resolveu e em que dia. Confirma antes, mostrando a frase inteira que vai para a planilha. |
| **Tirar pendência** | Pede o motivo em **botão** — *Tutor aplicou em casa* · *Não precisa mais* · *Lançado por engano*. Fica `cancelada`, com o motivo, quem e quando. **Nada some sem rastro.** |

**O aviso que não depende de abrir a tela:** no dia em que o FILHOt com pendência aberta **faz check-in** ou é marcado **Veio** na chamada, o cartaz aparece na hora para quem está ali, com o item, o dia e o que estava lançado — e um botão que leva direto às Pendências. Um cartaz por FILHOt por dia.

**Onde mais ele aparece:** um quadro **só de leitura** — *"Pendências de prevenção de quem veio hoje"* — no **Dashboard da Márcia** e no **Dashboard da Amanda** (a MESMA função, `blocoPendPrevHTML`), e um quadro em **O que fazer hoje** nas três mesas (Gestão, Supervisão e Recepção). Ao lado do item do menu, o contador `(3)`.

**Telegram:** de propósito, **nenhum aviso sai daqui**. Os grupos que existem na ponte são o da veterinária, o do almoço, o do plantão da AuAulândia, o Diário do Daycare e o de URGÊNCIAS (só Adriana e Márcia) — nenhum deles é o grupo da recepção, e mandar para o grupo errado é o erro que já custou caro. Quando existir um grupo da recepção, é ali que a linha nasce.

### O lançamento passou a guardar a CHAVE do FILHOt

Todo lançamento novo em **Lançamentos do dia** grava `chave` (a mesma `dcKey(nome, tutor)` do resto do app) junto com o valor. Sem ela a pendência teria de adivinhar de quem é o vermífugo pelo texto da célula — e *nome sozinho não identifica ninguém*. Os lançamentos **antigos** continuam valendo: a chave é resolvida pelo texto, com `planCasar`, e **casamento ambíguo não conta** (nesse caso a pendência não nasce, e a auditoria diz por quê). Sem ficha casada o lançamento entra do mesmo jeito — nada trava.

### Permissão: o papel é o piso, a concessão só LIBERA

`pendencias` é o **primeiro** item que está nas duas listas — na tabela `PERM_MENU` (visibilidade pelo papel) e em `NAV_PAGINAS_ALL` (concessão pessoa a pessoa, na tela do Time). A regra entre elas é uma só: **o papel é o piso e a concessão por pessoa só libera, nunca esconde.** Assim a Consultora vê a tela no dia em que ela nasce, e a Gestão ainda pode dá-la a alguém cujo papel não a traria. Para os itens antigos do `PERM_MENU` nada muda — nenhum deles está na lista de concessão.

O menu foi de **35** para **36** itens com `data-v`. Nenhum outro item mudou de gaveta nem de classe `so-*`.

### A senha da ponte de Hospedagem parou de aparecer escrita

Em **Configurações › Valores da hospedagem**, o campo *Palavra-chave* (`orcShToken`) mostrava a senha da ponte **em texto puro** (`value="…"`). Era o último campo do app assim — a ponte do Day Care já fazia o certo desde 19/ago/2026. Agora é a **mesma regra** dos dois lados:

- campo `type="password"` que **nasce vazio**;
- ao lado, só o aviso **✓ senha guardada — deixe em branco para manter, ou digite outra para trocar** (ou *nenhuma senha guardada*, em vermelho);
- **salvar sem digitar mantém** a senha que está lá (dá para corrigir só a URL);
- depois de salvar, o campo zera: a senha **nunca** é escrita de volta na tela.

A URL continua aparecendo — ela não é segredo, e é o que a Gestão corrige.

**Provas:** bloco `v-27` do `tests/harness.js` (o item no menu, no espelho e no `PERM`; a função pura `pendDeveAbrir`; a chave gravada no lançamento; a criação idempotente; a varredura do dia; o "Resolvido hoje" que relança por `dashLancar` e marca resolvida com quem; o cancelar que exige motivo; o cartaz da chegada; e a senha da ponte escondida) e a captura `tests/capturar-v27.js` (`docs/capturas-v27/`).

---

## O que mudou em 19/set/2026 (v 2026-09-19-03)

Adriana, duas frases:

> "Em orçamento quero que coloque mais uma opção: fim de ano! Que irá do dia 21/12 a 11/01/27."

> "Sobre os valores de hospedagem, eu preciso ter autonomia para modificar sem depender de vocês. Em configurações precisa ter como colocar valores de hospedagem."

### Os valores da hospedagem mudaram de tela

O cartão que era **Orçamento de hospedagem › Tabela e feriados** virou **Configurações › Valores da hospedagem** — e é o **primeiro** cartão da tela de Configurações. É o mesmo `#orcConfig` de sempre: os preços, os **feriados** em que a casa não recebe nem entrega, e a **ponte com a planilha de Hospedagem** foram junto. Nada se duplicou — a tabela existe num lugar só.

A tela de Orçamento ficou com uma **placa** dizendo onde os valores moram, mais um botão `Abrir Configurações › Valores da hospedagem` (só a Gestão o vê, como antes).

| Antes | Agora |
|---|---|
| Orçamento de hospedagem › **Tabela e feriados** (`so-master`) | **Configurações › Valores da hospedagem** (`so-master`, `#cardValoresHospedagem`) |

A classe `so-master` é a mesma: **ninguém ganhou nem perdeu acesso**. `config` continua fora do `NAV_PAGINAS_ALL` — ajuste de sistema não se concede a ninguém, é da Gestão e da Diretoria.

### Nasceu a terceira temporada: **Fim de ano**

O seletor de Temporada tem agora **três** botões: Baixa · Alta · **Fim de ano**.

| O que | Onde se mexe | Guardado como |
|---|---|---|
| Pernoite — fim de ano | Configurações › Valores da hospedagem | `precos.pernoite.fim` (centavos) |
| Diária de hotel — fim de ano | idem | `precos.diaria.fim` (centavos) |
| Fim de ano **começa em** (padrão 21/12) | idem, em dia/mês | `precos.fim_de` = `12-21` |
| Fim de ano **termina em** (padrão 11/01) | idem, em dia/mês | `precos.fim_ate` = `01-11` |

Os dois valores **nascem zerados de propósito**: quem põe preço é ela. O **período** também é dela — no ano que vem muda a data na tela, sem programador (a lei de 22/ago/2026).

- **Marca sozinho:** quando a entrada ou a saída cai dentro do período (a virada do ano é respeitada — 21/12 de um ano a 11/01 do seguinte), o botão **Fim de ano** acende sozinho e a tela diz *"Marcado sozinho: a estadia cai no fim de ano (21/12 a 11/01)"*. Quem atende pode trocar à mão — e a partir daí o automático não mexe mais.
- **Sem preço não vira conta:** com o valor em R$ 0,00, o total **não** é calculado. A tela mostra *"Falta o valor do fim de ano — preencha em Configurações › Valores da hospedagem"* e o salvar trava com a **mesma** frase. Nunca em silêncio, nunca hospedagem de graça.
- **Nada grava antes do botão** `Salvar tabela` — e a gravação deixa rastro na auditoria (`orcamento-precos`) com **o que mudou, de quanto para quanto**, e o valor anterior inteiro.
- **O passado não muda:** cada orçamento já salvo guarda o `precos_da_epoca`.

### Compatibilidade

O orçamento passou a gravar `temporada` (`baixa` · `alta` · `fim`) **e** continua gravando `alta_temporada` (verdadeiro só para `alta`). Quem já lia o campo antigo — lista, resumo, planilha e relatório — não quebrou. Orçamento antigo com `alta_temporada:true` é lido como `alta`.

Na lista de orçamentos, no resumo e no relatório em XLS a etiqueta é **FIM DE ANO** quando for o caso.

**Provas:** bloco `v-25` do `tests/harness.js` (a tabela dentro de `#v-config` e fora do Orçamento, os campos e o período, o preço de fábrica zerado, os três botões, a estadia de 23/12 a 03/01 que marca sozinha, o total que não sai sem preço e o que sai com ele, a leitura do campo antigo e a versão carimbada).

---

## O que mudou em 18/set/2026 (v 2026-09-18-01)

Adriana, uma frase:

> "Plano e cobranças.. delete lançar pagamentos.. inútil, a soma dos recebimentos vai para o meu dashboard e da Márcia com os valores, quanto foi de mensalidade, trimestral e semestral esse mês de setembro, quanto foi de diária avulsa e etc.. não faz sentido ter mais algo."

### Saiu do menu: **Lançar pagamento**

O item `lancar-pagamento` saiu de **Central Zêluz › Day Care › Planos e cobranças** e saiu também da tabela `PERM_MENU` — a única linha que podia revelá-lo. O menu foi de **36** para **35** itens com `data-v`. Nenhum outro item mudou de gaveta nem de classe `so-*`.

O nó `daycare/pagamentos`, que essa tela alimentaria, **nunca recebeu um único lançamento**: nasceu vazio e vazio ficou. Por isso o card "recebido" do Dashboard da Adriana era R$ 0,00 desde sempre.

O **código da tela ficou parado no arquivo**, sem porta de entrada. Não se apaga código de dinheiro sem decisão dela — e as leis que ele guarda (valor cheio, pagamento parcial impossível, estorno só da chefia) continuam provadas no harness.

### Entrou nos dois dashboards: **Recebimentos do mês**

Um quadro novo, o **MESMO** nos dois — uma função (`recCardHTML`), dois usos:

| Dashboard | Onde |
|---|---|
| **Dashboard da Adriana** (`painel-diretoria`) | área FINANCEIRO, logo abaixo da conta do mês |
| **Dashboard da Márcia** (`paineloperacao`) | área FINANCEIRO, nova, antes de "O que pede a sua decisão" |

Ele mostra, com seletor de mês (`‹ mês anterior · próximo mês › · este mês` — o mês que ainda não começou não se abre):

| Linha | De onde vem o valor |
|---|---|
| **Mensalidade** (plano Silver) | a data do pagamento lançada na ficha, valor de 1 mês |
| **Trimestral** (plano Gold) | idem, valor de 3 meses à vista |
| **Semestral** (plano Black) | idem, valor de 6 meses à vista |
| **Plano sem compromisso definido** | só aparece quando existe alguém nele |
| **Hospedagem na AuAulândia** | orçamentos **fechados**: parcela da reserva no mês em que fechou, parcela do dia no mês da entrada |
| **Diária avulsa** | **sem valor** — o app registra quem veio de avulso, nunca o preço do dia |
| **Total do mês** | a soma das linhas com valor |

**Nenhuma conta nasce no quadro.** Cada linha é a soma das linhas que o `finResumoMes` (`financeiro-logica.js`) já calcula e o harness já prova. Sem a carteira inteira lida, ou sem os orçamentos e os vínculos de irmãos, o quadro **diz que ainda não sabe** em vez de mostrar um total pela metade. E ele **só observa**: não existe uma única gravação nesse bloco.

### O que ficou para a Adriana decidir

O app **não tem extrato de caixa**. O que o quadro soma é o que a casa **lançou**, não o que entrou no banco. Duas decisões continuam com ela:

1. **Diária avulsa** — não existe preço de dia avulso em lugar nenhum do banco. Enquanto ela não disser qual é (ou onde se lança), essa linha fica sem valor.
2. **Fichas vindas da planilha antiga** (`plano_deduzido`) — a data do pagamento veio de importação, não de alguém da Central dizendo "recebi". O quadro as soma, mas **conta quantas são**, no rodapé.

---

## O que mudou em 17/set/2026 (v 2026-09-17-01)

Adriana, três frases:

> "Serviços passa a ser Ecossistema Daycare." · "Operação passa a ser Configurações, e fica só o que é ajuste." · "Enriquecimento Ambiental, Ritmo do Time e Linha do tempo do dia vão para Dashboards, é o administrativo."

### Duas categorias trocaram de nome

| Antes | Agora |
|---|---|
| **Serviços** | **Ecossistema Daycare** |
| **Operação** | **Configurações** |

Só o **nome visível** mudou. Os `data-acc` (`servicos` e `operacao` — a chave do aberto/fechado guardada em cada aparelho), os `data-v` e as classes `so-*` continuam idênticos. Quem já tinha o menu aberto numa categoria continua com ela aberta.

### Três itens mudaram de gaveta: subiram para Dashboards

**Enriquecimento Ambiental** (`eahist`) · **Linha do tempo do dia** (`linhadotempo`) · **Ritmo do Time** (`ritmo`).

Ficam **depois** dos cinco dashboards das pessoas e entre si em **ordem alfabética**. A categoria Dashboards passou a ter, nesta ordem: Meu Dashboard · Dashboard das Consultoras · Dashboard da Amanda · Dashboard da Márcia · Dashboard da Adriana · Enriquecimento Ambiental · Linha do tempo do dia · Ritmo do Time.

**Ninguém ganhou nem perdeu acesso.** Cada item trouxe a sua própria classe: `eahist` e `ritmo` seguem `so-gestao`, `linhadotempo` segue `so-master`. A gaveta da Operação tinha `so-gestao` na categoria, e `so-master` (Gestão, Diretoria e Supervisão) é **mais estreito** que `so-gestao` — então a classe da gaveta nunca foi o que decidia para estes três.

### A gaveta Configurações ficou só com o que é ajuste

Em **ordem alfabética**: Configurações (`config`) · Escala e plano do dia (`planodia`) · Financeiro do plantão (`acerto`) · Time (`pessoas`), com o `#pSubnav` colado no Time — é o submenu dele.

### A tela do Time fala a mesma língua

`NAV_PAGINAS_ALL` (a lista que a Gestão lê para conceder telas) acompanhou os nomes: o grupo "Operação" virou "Configurações" e a "Linha do tempo do dia" passou para um grupo "Dashboards". **As chaves são as mesmas** — nenhuma permissão nasceu, nenhuma sumiu, e ninguém perdeu o que já estava concedido.

**Provas:** `tests/harness.js` (ordem das categorias, mapa item→gaveta, ordem alfabética dos três administrativos, as classes `so-*` item por item, os grupos do `NAV_PAGINAS_ALL`) e a captura `docs/capturas-v20/menu-ecossistema-configuracoes-dashboards.png`.


## O que mudou em 15/set/2026 (v 2026-09-15-03)

Adriana, duas frases:

> "No sidebar, Prevenção, Peso e Pesquisa têm que estar dentro de Daycare. Peludinhos apenas cadastro e busca, caso precise olhar algo rápido dentro da ficha."

### Peludinhos ficou com duas linhas

**Cadastro de Peludinhos** e **Buscar peludinho**. Nada mais. É a gaveta da ficha: criar uma e achar uma.

"Buscar peludinho" **não é tela nova**: é a mesma tela do Cadastro, aberta na lista e com o cursor já dentro do campo de busca (`abrirBuscaPeludinho`). Por isso o item não tem `data-v` próprio — tela nova pediria uma view, um título e uma linha de permissão, e criaria uma segunda porta para o mesmo cômodo. A visibilidade dele **espelha** a do Cadastro em `aplicarPaginasPessoa()`: quem não vê o Cadastro não vê o atalho.

### Prevenção, Peso e Pesquisa desceram para o Day Care da Central

O bloco **Central Zêluz › Day Care** passou a ser, em **ordem alfabética** até o rótulo:

Lançamentos do dia · Peso · Pesquisa com a Família Multiespécie · Prevenção · Quem não comeu hoje · Reposições · **Planos e cobranças** (rótulo) · Renovação de planos · Em débito.

> *18/set/2026: "Lançar pagamento" saiu desta lista — ver a seção do topo.*

Nenhum item mudou de classe `so-*`: mudou de gaveta, nunca de acesso. O harness morde a ordem alfabética e a lista exata dos dois blocos.


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
| Linha do tempo do dia | **Dashboards › Linha do tempo do dia** (tela nova, navegação por mês; nasceu na Operação e subiu para Dashboards em 17/set/2026) |
| Partiram | **removido** — "não tem necessidade de aparecer para ninguém" |
| N doses de medicação sem o nome de quem deu | **removido** — "pode tirar isso" |

O item **Painel do Dia saiu do menu**. A tela `v-painel` continua existindo por link (rota antiga não morre) e guarda o que não cabe num quadro de dashboard: o tempo das atividades **por dia da semana, dia a dia e por pessoa**, e a confiabilidade das plantonistas. Os dois gráficos dos dashboards abrem lá.

A classe `so-master` que o item carregava passou **inteira** para a "Linha do tempo do dia": quem via continua vendo, quem não via continua sem ver.

O editor de **Horários esperados** (a janela de cada protocolo) desceu para **Configurações**. Razão de princípio: dashboard só observa — quem grava é a tela de ajuste.

E o **relógio de 30 s** que relia o dia inteiro sumiu junto com a tela. Era a causa dominante dos 68 MB/h medidos em 07/set. O que sobrou ali é histórico fechado: não muda sozinho.

### 2 · Central Zêluz em três partes

**Peludinhos** (Cadastro · Prevenção · Pesquisa com a Família Multiespécie · Peso) › **AuAulândia** (Check-in · Check-out com o tutor · Pendências com o tutor · Cuidado Vet · Orçamento de hospedagem) › **Day Care** (Quem não comeu hoje · Reposições · Lançamentos do dia · **Planos e cobranças**).

> ⚠ **Superado em 15/set/2026** — ver o bloco no topo deste documento: Prevenção, Peso e Pesquisa saíram de Peludinhos e entraram no Day Care, e Peludinhos ganhou o "Buscar peludinho".

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

> **Desde 30/set/2026:** no Time, a Gestão libera qualquer tela da lista para qualquer pessoa, e vale na hora. Para as 12 telas que só liberam (Enriquecimento Ambiental, Ritmo do Time, Conferência do dia, Hoje na Zêluz, Quem chamar hoje, Banhos recorrentes, Lançamentos do dia, Pendências de prevenção, Peso, Pesquisa com a Família Multiespécie, Prevenção e Vencimentos), a coluna "Quem vê" é o **piso**. As outras 16 aparecem, para quem tem lista no Time, só se estiverem marcadas. Não se concedem por lá: Início, O que fazer hoje, os cinco dashboards de papel, Escala e plano do dia, Financeiro do plantão, Configurações, Abertura do dia e Agenda.

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
| | Enriquecimento Ambiental (`eahist`) | O que foi feito e quem não participou. | so-gestao |
| | Linha do tempo do dia (`linhadotempo`) | Tudo o que aconteceu, em ordem — escolha o mês e o dia. | so-master |
| | Ritmo do Time (`ritmo`) | Tempo por etapa, dia a dia. | so-gestao |
| **Ecossistema Daycare › AuAulândia** | Conferência do check-in (`conferencia`) | O monitor confere corpo e pertences de quem chegou (2º passo; o 1º é da Central Zêluz). | so-conferencia |
| | Hóspedes de hoje (`hospedes`) | Quem está na casa, medicação e alimentação. | so-hosp |
| | Plantão da noite (`hospedagem`) | O relatório de cada hóspede, turno a turno. | todos |
| | Conferência do dia (`gestdia`) | Medicações por horário, problemas e os três tempos do plantão. | so-gestao |
| | Check-out (`checkout`) | O monitor monta a bolsa e devolve tudo (1º passo; a Central fecha com o tutor). | todos |
| **Ecossistema Daycare › Day Care** | Abertura do dia (`abertura`) | Monitor 1: como a casa abre. | so-abertura |
| | *(chamada, almoço, EA e as demais atividades)* | Vivem no `#dcSubnav`, dentro do `#blocoDaycare`. | so-day |
| **Central Zêluz › Peludinhos** | Cadastro de Peludinhos (`ficha`) | Um cadastro só, para Day Care e AuAulândia — tudo começa aqui. | so-gestao (+ destaque) |
| | Buscar peludinho *(sem `data-v`)* | Achar um peludinho depressa e abrir a ficha dele. Abre a MESMA tela do Cadastro, já no campo de busca. | so-gestao (espelha o Cadastro) |
| **Central Zêluz › Day Care** | Hoje na Zêluz (`hoje`) | Quem está na Zêluz hoje e quem está com pendência: vacina, vermífugo, carrapaticida, coleira e escova. | `PERM` `hoje-na-casa` (consultora · supervisão · gestão · diretoria) |
| **Central Zêluz › Day Care** | Quem chamar hoje (`contatos`) | Com quem falar hoje: quem está na casa com algo vencido, quem vem no próximo dia e quem não respondeu. Um toque abre o WhatsApp com a mensagem pronta. | `PERM` `hoje-na-casa` (consultora · supervisão · gestão · diretoria) |
| | Lançamentos do dia (`dashdc`) | A planilha do Day Care, item por item. | so-recepcao |
| | Pendências de prevenção (`pendencias`) | O que ficou para a próxima vinda: vermífugo, carrapaticida, coleira, medicação e hidratação de quem não veio. | `PERM` `pendencias-prevencao` (consultora · supervisão · gestão · diretoria) |
| | Peso (`peso`) | Pesar qualquer FILHOt: recepção, veterinária e gestão. | so-pesa |
| | Pesquisa com a Família Multiespécie (`alergia`) | A pesquisa com a família: enviar, colar a resposta, e ela vira ficha sozinha. | so-gestao |
| | Prevenção (`vacinas`) | Vacina, vermífugo, coleira e exame de fezes: quem está atrasado e quem está para vencer. | so-gestao |
| | Vencimentos (`vencimentos`) — sub-sanfona com **Hoje · Segunda · Terça · Quarta · Quinta · Sexta** | "Está vencendo": quem vem no dia com prevenção vencendo, mais o que nunca foi registrado na ficha. | `PERM` `vencimentos-amanha` (consultora · supervisão · gestão · diretoria) |
| | Quem não comeu hoje (`emporio`) | A mensagem pronta para avisar o tutor. | so-emporio |
| | Reposições (`reposicao`) | Créditos de dias por falta avisada. | so-recepcao |
| *Central Zêluz › Planos e cobranças* | Renovação de planos (`renovacao`) | Quem está no fim do plano. | so-gestao |
| | Em débito | Quem deve no Day Care. | em breve (sem tela) |

> *"Lançar pagamento" (`lancar-pagamento`) saiu do menu em 18/set/2026, por decisão da Adriana. Não recolocar.*
| *Central Zêluz (a ordem do dia)* | Check-in (`checkin`) | O tutor chega: entrada, alimentação, medicação, assinatura (1º passo). | todos |
| | Check-out com o tutor (`checkoutconf`) | Conferir a bolsa junto com o tutor e assinar (2º passo). | so-conf-saida |
| | Orçamento de hospedagem (`orcamento`) | Monte e envie o orçamento ao tutor. | so-recepcao |
| | Pendências com o tutor (`recepcao`) | Ração acabando, remédio faltando, algo que ficou. | so-recepcao |
| | Cuidado Vet (`cuidadovet`) | Alterações no corpo que a veterinária precisa ver. | so-vet |
| **Configurações** (só o que é ajuste) | Configurações (`config`) | **Valores da hospedagem** (pernoite, diária e fim de ano, feriados e ponte da planilha de Hospedagem), Telegram, ponte da planilha, horários dos protocolos, protocolos passo a passo, **Prevenção** (validade da coleira e antecedência do aviso), **Horários das refeições** (café, almoço e jantar da casa — é daí que sai a hora do remédio amarrado à refeição), **Mensagens prontas** (o texto de *Vence amanhã* e a folga em dias), **Mensagem de entrada** (a placa da porta) e o rastro de logins. | so-master |
| | Escala e plano do dia (`planodia`) | A escala de cada um e qual plano vale hoje. | tabela PERM |
| | Financeiro do plantão (`acerto`) | Acerto das plantonistas: noites, dobras, quanto pagamos. | so-master |
| | Time (`pessoas`) | Pessoas, senhas e quem acessa o quê. | so-master |
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
