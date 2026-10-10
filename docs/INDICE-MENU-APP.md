# Índice do app — menu aprovado pela Adriana (reorganizado em 08/set/2026, ajustado em 15, 17, 18, 19, 21, 24, 25, 27, 28 e 30/set e 01, 02, 06, 07, 08, 09 e 10/out/2026)

> Regra: o app tem de ser autoexplicativo, para treinamento rápido. Cada item tem **Título** e **subtítulo** (a explicação curta que aparece como dica no menu e no índice da Gestão no computador). Nomes são decisão da Adriana.

## O que mudou em 10/out/2026 (v 2026-10-09-16) — O remédio parado não volta a tocar por fora: nada de dose em dobro (S3-P12)

> Achado do QA da 6.59: um remédio parado («Parou de tomar») podia voltar a tocar pelo «Salvar agenda» do Plantão e pela Ficha › Medicamentos, e o alarme pedia de novo a dose de hoje já dada. Esta entrega fecha essas portas e protege os remédios que já ficaram assim no banco. Ela não cria tela nova no menu nem botão novo. Regra de ouro: o remédio parado só volta a ser dado pelo «Voltou a tomar» da ficha.

### (BS) Hospedagem › Plantão do hóspede › Agenda de Medicação e Cadastro de Peludinhos › aba Medicamentos

| Antes | Agora |
|---|---|
| No remédio parado, mudar o horário, ligar o «Uso contínuo» ou mudar o «Tomar até» e tocar «Salvar agenda» (ou «Salvar medicamentos») gravava, e o alarme podia pedir hoje a mesma dose de novo | **Recusado**, com o nome do remédio e o caminho: «… Para voltar a dar, use «Voltou a tomar» na ficha (aba Medicamentos). Nada foi salvo.» A mesma frase do Cuidado Vet. Nada é gravado; na Ficha, a pergunta «Salvar os medicamentos de …?» nem abre |
| A frequência e o início do remédio parado mudavam | Também recusados, com a frase própria («a frequência e o início dele não mudam por aqui…») |
| O remédio parado antigo sem «Início» trancava a Ficha (ela pede o início de todos) | Preencher o início com uma data de hoje para trás **grava** (fora do «dia sim, dia não»). Só de madrugada, enquanto a dose de ontem do remédio ainda pode ser pedida pelo alarme, a data de hoje é recusada: «O início do remédio X não pode ser hoje: a dose de ontem dele ainda pode ser pedida agora pelo alarme. Preencha a data em que ele começou (de ontem para trás).» |
| No remédio suspenso pela Veterinária, o horário mudava no Plantão e na Ficha; reativado no mesmo dia, o alarme pedia o horário novo | **Recusado**, com a frase do Cuidado Vet: «Reative primeiro e depois mude o horário.» O «Tomar até» e o resto do suspenso continuam mudando |
| O remédio suspenso (ou parado) amarrado à refeição («45 min antes do jantar») recebia o horário novo quando o jantar mudava em Configurações e alguém salvava a agenda; reativado no mesmo dia, o alarme pedia de novo a dose já dada | Ele **fica com o horário que tinha**, sem recusa (a agenda dos outros remédios grava normalmente). O horário novo da refeição vale quando ele voltar a ser dado e a agenda for salva de novo |
| — | **O que continua mudando no parado:** a dose, o nome, a medida, o local, a observação, o motivo, o tipo, a origem e o estoque. O remédio continua parado |
| — | **Sem recusa falsa:** salvar outro remédio com o parado sem mudança na tela grava normalmente (os horários e os dias da semana em outra ordem, o horário que vem da refeição e a frequência «todos os dias» contam como iguais) |

### (BT) O remédio que «voltou a tocar» (parado e em uso ao mesmo tempo, já gravado no banco)

| Antes | Agora |
|---|---|
| O remédio aparecia como «PAROU DE TOMAR … Não gera alarme» (ou sem aviso nenhum) e continuava tocando | O cartão do Plantão, a Ficha e o Cuidado Vet dizem **«Voltou a tocar depois do «Parou de tomar» de {data} ({quem}). Para encerrar: «Parou de tomar» na ficha (aba Medicamentos).»** |
| A Ficha mostrava «Voltou a tomar», que criava uma linha nova com a antiga ainda tocando: **a mesma dose duas vezes, todo dia** | A Ficha mostra **«Parou de tomar»**; o «Voltou a tomar» é recusado («Este remédio ainda está em uso: não há o que retomar.»). O alarme continua pedindo as doses dele (nenhuma dose perdida) |
| O horário, o período e a frequência mudavam pelo Plantão ou pela Ficha | Recusados nas três telas, com o caminho certo: «Parou de tomar» e depois «Voltou a tomar», com o horário novo. A linha nova começa amanhã quando a dose de hoje já foi dada |
| A régua do horário pulava esse remédio: o horário mudado depois da dose de hoje tocava hoje | A régua trata como qualquer remédio em uso: o horário novo começa amanhã |
| O remédio nesse estado e também suspenso aparecia com «Voltou a tocar …» ao lado de «SUSPENSO … Não gera alarme» | Mostra só a faixa do suspenso; a recusa diz «está suspenso pela Veterinária … Reative primeiro, no Cuidado Vet; depois, para encerrar, use «Parou de tomar» …» |

### (BV) Hospedagem › Check-in › medicação («não está em uso»)

| Antes | Agora |
|---|---|
| O «não está em uso» do Check-in parava o remédio, mas um Plantão ou uma Ficha abertos antes do check-in, ao salvar, regravavam o «uso contínuo»: o remédio voltava a tocar | O «não está em uso» vale como o «Parou de tomar» da Ficha: a tela aberta antes é recusada («A agenda de … mudou em outro aparelho. Nada foi salvo: feche e abra de novo.») e o remédio continua parado |

### (BU) Cuidado Vet › Medicação em vigor

| Antes | Agora |
|---|---|
| No remédio parado, o «Alterar» da frequência fazia o alarme pedir hoje a dose de um remédio parado | **Recusado**, com a frase da frequência e do início. A frase do horário, do «uso contínuo» e do «tomar até» continua a mesma |
| O histórico da troca de horário dizia «Salvar agenda do Plantão: …» também quando a mudança vinha do Cuidado Vet ou da Ficha | Diz de onde veio: **«Cuidado Vet: …»**, **«Ficha › Medicamentos: …»** ou «Salvar agenda do Plantão: …» |
| Duas doses perto demais na noite da troca: a frase mandava a própria Veterinária «pedir a confirmação da veterinária» | No Cuidado Vet: «… para fazer essa troca, use «Mudar comida e remédio», no Plantão do hóspede, e confirme lá as duas doses perto.» No Plantão e na Ficha, a frase de sempre |

## O que mudou em 10/out/2026 (v 2026-10-09-15) — O peso, o recado à veterinária e o Cuidado Vet: corrigir, anular e desfazer (S3 da revisão tela por tela, parte 2)

> Adriana, 09/out/2026 (quadro de pedidos, linha 87): *"O app está engessado, tudo preciso entrar no Claude para alterar."* Esta entrega usa o cartaz único da S0 (Corrigir / Anular / Reabrir) no peso, no recado à veterinária dos Vencimentos e no Cuidado Vet. Ela não cria tela nova no menu. Regra de ouro: nada é apagado (o que sai fica riscado, com quem, quando e o motivo), e a dose do vermífugo e o alarme do remédio seguem o dado corrigido.

### (BM) Cadastro de Peludinhos › aba Prevenção › Peso e tela Peso

| Antes | Agora |
|---|---|
| O peso errado (18 kg em vez de 8) não se corrigia e continuava valendo no vermífugo | **«Corrigir» e «Anular»** em cada pesagem (44 px). A lista mostra as 6 últimas e **«ver todas (N)»**. O cartaz traz a pesagem (data, kg, quem pesou), o peso novo (a mesma leitura da balança: 9,7 · 9.700 · 9700) e **a dose do vermífugo antes e depois** |
| — | **Quem assina:** a pesagem de hoje, quem pesou ou quem pode mexer na ficha ou no Cuidado Vet, com a própria senha; a de dia anterior e o «Anular», **só a Gestão** (entra na dose do vermífugo) |
| — | **Nada some:** a pesagem fica na lista como foi pesada; a corrigida aparece com **«(era 18 kg)»** e a anulada riscada, as duas com quem, quando, o motivo e **«Reabrir»**. O último peso, o «pesado este mês», a régua de 30 dias, o vermífugo, a variação da pesagem seguinte e «Pesados hoje» passam a usar o peso corrigido |
| — | **Dois aparelhos:** se outro aparelho corrigiu, anulou ou reabriu a mesma pesagem depois que o cartaz abriu, nada é gravado («mudou em outro aparelho… feche e abra de novo»): a correção do outro não some |
| A variação avisada à veterinária por um peso errado ficava sem correção | **A veterinária sabe:** se aquela pesagem (ou a seguinte) a avisou, o grupo dela recebe «PESO CORRIGIDO», «PESO ANULADO» ou «PESO — A CORREÇÃO FOI DESFEITA», com quem corrigiu, anulou ou desfez. Sem como saber, a tela pergunta (recomendado: sim, quando a dose muda). Sem o grupo na ponte, a tela mostra o texto pronto para mandar à mão |
| A segunda pesagem do mesmo dia trocava o valor sem rastro | O valor de antes vai para o rastro da ficha: «Peso de hoje: 18 kg (pesou: …) → 8 kg (pesou: …)» |
| — | **A atividade Peso do Day Care não mudou** (decisão 2) |

### (BN) Vencimentos › recado à veterinária

| Antes | Agora |
|---|---|
| O tutor mudava de ideia («Não quer agora») e a veterinária continuava preparando a vacina | O recado sai do cartão e fica guardado inteiro (com quem, quando e a resposta nova); o grupo da veterinária recebe **«CANCELADO — … Não precisa preparar.»**. Vale também para o desfazer da resposta |
| — | **Trocar o período** (manhã → tarde): o recado novo diz «No lugar de 13/10/2026 (manhã).» |
| — | **Dois aparelhos (ou dois toques seguidos):** o cancelamento confere o recado que está no banco na hora de gravar. A Consultora com a tela aberta antes que toca «Não quer agora» cancela o recado que a Gestão acabou de criar, e o «CANCELADO» diz o recado que valia (o de tarde, se ele trocou o de manhã) |
| — | A troca de outro assunto (antiparasitário) não derruba o recado da vacina |
| — | Sem o grupo da veterinária na ponte (ou com a ponte falhando): **«A VETERINÁRIA NÃO FOI AVISADA DO CANCELAMENTO»**, com o texto pronto para mandar à mão |

### (BO) Cuidado Vet › consultas

| Antes | Agora |
|---|---|
| A consulta errada não se corrigia nem se anulava | **«Corrigir»**: uma versão nova (as fotos ficam); a anterior desce riscada, sem PDF. A instrução que nasceu dela passa para a versão nova. No mesmo dia, a própria senha; de dia anterior, a Gestão |
| — | **A reavaliação na correção:** só muda a reavaliação que nasceu daquela consulta; a de outra consulta continua como está. Tirar a data deixa a reavaliação riscada (com «Reabrir»); mudar a data ou o motivo guarda a de antes no histórico. O cartaz diz o que acontece com a reavaliação |
| — | **«Anular»** (lançada por engano): só a Gestão; a consulta fica riscada; a instrução e a reavaliação nascidas dela saem junto; a reavaliação antiga pergunta «Tirar junto» ou «Manter» |
| Ninguém sabia se o receituário já tinha saído | PDF (só quando o arquivo é gerado), WhatsApp e e-mail ficam registrados na consulta; o cartaz avisa **«Este receituário já saiu: … Avise o tutor da correção.»** |
| Sem permissão, «Salvar consulta», «Alterar», «Suspender» e «Reativar» ficavam calados | Dizem quem pode e nada é gravado |

### (BP) Cuidado Vet › instrução, reavaliação e observação

| Antes | Agora |
|---|---|
| A instrução da veterinária só saía com uma consulta nova | **«Retirar instrução»** (a própria senha, motivo de 4 palavras): a tarja some da ficha e do card do Plantão; no Cuidado Vet fica riscada, com **«Reabrir»** |
| A reavaliação feita continuava no quadro do dia | **«Feita»** no quadro «Reavaliação de hoje» (quem e quando, pelo login), com «Reabrir»; remover pede 4 palavras e a própria senha e deixa riscada |
| A observação para o tutor não se editava | **«Editar»** guarda o original (aviso: a Márcia pode já ter repassado ao tutor); **«Retirar»** some da ficha e fica riscada, com «Reabrir». De dia anterior, a Gestão |

### (BQ) Cuidado Vet › Medicação em vigor

| Antes | Agora |
|---|---|
| «Alterar» regravava o remédio inteiro pela cópia da tela (perdia o que outras telas tinham gravado) | Grava só o que o formulário mudou; o resto continua. **A régua do «Salvar agenda»:** o horário mudado com a dose de hoje dada começa amanhã, com a frase na tela. **A trava:** a agenda mudada em outro aparelho depois que a tela abriu é recusada («Nada foi salvo: feche e abra de novo») |
| «Alterar» mudava o horário do remédio parado ou suspenso, e o alarme pedia de novo a dose de hoje já dada | **Recusado**, com o caminho: o parado volta por «Voltou a tomar» na ficha; o suspenso, reativando antes. No parado, o «uso contínuo» e o «tomar até» também são recusados (ele voltaria a tocar). A linha do remédio parado diz **«Parou de tomar em …»** (quem e o motivo). A dose e o resto do parado continuam mudando |
| — | **A tela diz o que aconteceu com o horário:** «✅ … já vale na ficha e nos alarmes» quando vale já; «✅ … gravada na ficha» com a frase do «começa amanhã»; quando a régua manteve o horário, «✋ A alteração foi gravada, mas o horário NÃO mudou», com o porquê |
| — | **A tela que não leu o carimbo da agenda não grava o «Alterar»** («feche e abra de novo»); «Suspender», «Reativar» e «Ainda preciso reavaliar» releem o carimbo antes e, sem conseguir, não gravam |
| O «Ciente» do término não voltava | Mudar o fim do tratamento tira o «Ciente» (vira linha do histórico); **«Ainda preciso reavaliar»** traz de volta o aviso «Receita encerrada», dentro dos 30 dias |
| «Suspender» e «Reativar» aceitavam qualquer motivo | Motivo de pelo menos 4 palavras («erro» é recusado); FILHOt hospedado: o grupo do plantão recebe a mudança |
| — | **«Lançada por engano»**: o anular do remédio da agenda (a Gestão assina; nada é apagado; o remédio fica riscado, sem botões) |
| Só as 4 últimas ações do histórico | **«ver o histórico inteiro (N)»** |

### (BR) Dashboards › Linha do tempo do dia (e Configurações › Logins e segurança, o resumo por pessoa)

| Antes | Agora |
|---|---|
| — | **As ações novas em português:** Corrigiu uma pesagem, Anulou uma pesagem (lançada por engano), Reabriu uma pesagem (a correção foi desfeita), Vencimentos: conversa com o tutor e recado à veterinária, Corrigiu uma consulta (versão nova), Anulou uma consulta (lançada por engano), Retirou e Reabriu a instrução da Veterinária, Marcou a reavaliação como feita, Reabriu a reavaliação, Editou, Retirou e Reabriu a observação para o tutor, Suspendeu um remédio (Veterinária), Deu «Ciente» do fim da receita e Desfez o «Ciente» («Ainda preciso reavaliar»); e as que apareciam em código: Peso do FILHOt, Consulta da Veterinária, Observação da Veterinária para o tutor. A retirada e a remoção aparecem como «Retirou» e «Removeu», não como «lançado por engano» |

## O que mudou em 10/out/2026 (v 2026-10-09-14) — O remédio: desfazer a dose, «Lançado por engano», «Voltou a tomar» e a medicação do dia (S3 da revisão tela por tela, parte 1)

> Adriana, 09/out/2026 (quadro de pedidos, linha 87): *"O app está engessado, tudo preciso entrar no Claude para alterar."* Esta entrega usa o cartaz único da S0 (Corrigir / Anular / Reabrir) no remédio: a dose dada, o remédio da agenda e a medicação dos Lançamentos do dia. Ela não cria tela nova no menu. Regra de ouro: nada de dose em dobro, nada de dose perdida, e nenhuma dose dada some do histórico (anular deixa riscado).

### (BH) Plantão › Agenda de Medicação › «Horários de hoje» (a dose dada)

| Antes | Agora |
|---|---|
| A dose registrada no FILHOt errado não se desfazia: o alarme ficava calado, o estoque descontado e a Gestão deixava de ver o atraso | **«Desfazer esta dose»** em toda dose dada (agendada e avulsa), com 44 px. O cartaz mostra o que sai junto: a dose, o estoque (contável: «de 11 para 12»; frasco, pote e avulsa: não muda), o alarme (hoje: volta a pedir a dose agora; ontem: volta só dentro do horário seguro da 6.47, senão aparece como «faltou» para a Gestão), as cópias da dose em outras linhas do mesmo FILHOt e a mensagem ao grupo do plantão. Aviso fixo, em vermelho: «Se a dose FOI dada, não anule…». **Só a Gestão assina** (decisão 1) |
| — | **Nada some:** a dose e as cópias ficam no registro, riscadas, com quem anulou, quando e o motivo, numa gravação só. O estoque volta **uma vez só** (dois aparelhos ou dois toques não devolvem duas vezes). O grupo do plantão (Gestão) recebe a correção; se o Telegram falhar, a mensagem entra na fila de reenvio. Se a gravação das cópias falhar depois da dose (ou a cópia nascer no mesmo instante da anulação, em outro aparelho), a cópia já conta como desfeita: o alarme e o Plantão pedem a dose de novo, e «Dei agora» registra por cima dela (com dois aparelhos ao mesmo tempo, um registra e o outro ouve «ESTA DOSE JÁ FOI REGISTRADA»). «Reabrir» a dose de origem depois de a cópia dela ser registrada de novo é recusado, como numa linha só; se esse registro novo também foi desfeito, a tela manda reabrir o registro da linha que toca. A dose com cópia na linha do «Voltou a tomar»: a cascata diz que o alarme volta a pedir a dose pela linha nova |
| — | **A linha volta a «Dei agora»**, com o riscado («Anulada (lançada por engano)») e o botão **«Reabrir»** (a dose volta a contar como dada, o estoque desconta de novo e o alarme cala). Registrar de novo pelo «Dei agora» guarda a anulação de antes dentro da dose nova. Dois aparelhos: o segundo «Dei agora» é recusado («ESTA DOSE JÁ FOI REGISTRADA», com quem assinou); dois «Desfazer» no mesmo instante: o segundo vê que a dose já foi anulada e não manda outra mensagem |
| — | **O estoque não se perde num «Salvar agenda»:** salvar a agenda (ou os Medicamentos da ficha) entre a dose e o «Desfazer» guarda as marcas do estoque; o «Desfazer» seguinte ainda devolve a dose |
| A dose avulsa errada (nome, quantidade, hora) não se corrigia | **«Corrigir»** na dose avulsa: no mesmo dia, quem registrou (com a própria senha) ou quem tem «editar medicação»; de dia anterior, só a Gestão. O mesmo registro guarda o antes e o depois, e o grupo do plantão recebe a correção |

### (BI) Cadastro de Peludinhos › aba Medicamentos (a ficha)

| Antes | Agora |
|---|---|
| O remédio lançado no FILHOt errado só saía apagando | **«Lançado por engano»** em cada remédio salvo (44 px): a Gestão assina; o remédio para **agora** pela régua da 6.54 (a dose de hoje já dada continua no histórico; as que faltam não são mais pedidas, nem a de ontem que o alarme ainda tocaria) e as continuações do mesmo remédio (a troca por datas) saem junto, numa gravação só. Com hospedagem ativa, a linha do remédio na lista da estadia ganha o «parou» na mesma gravação. Nada é apagado: o remédio desce para a seção **«Lançados por engano»**, riscado, com **«Reabrir»** |
| Não existia «Voltou a tomar»: para dar de novo, era preciso cadastrar outra vez (e o histórico se perdia) | **«Voltou a tomar»** (e o «Reabrir» do lançado por engano): a dose, os horários, até quando (o que a linha tinha antes do «Lançado por engano») e **«Começar hoje?»** vêm para conferir; o remédio volta numa **linha nova**, que continua a antiga, com o estoque que sobrou. Assina quem pode mexer no remédio do check-in, com a própria senha; o botão diz «Gravar «Voltou a tomar»» |
| — | **«Começar hoje?» só quando é seguro:** não é madrugada, hoje é dia do remédio, nenhuma linha dele ainda toca hoje, todo horário novo que já passou tem a dose dada e **toda dose dada hoje cai num horário da linha nova** (a registrada antes da hora também). Essas doses **continuam contando**: a linha nova recebe uma cópia de cada uma, o cartaz cita todas e o alarme não as pede de novo. Dose dada hoje num horário que sai da agenda recusa «hoje» com a frase da troca de horário («A dose das 08:00 de hoje já foi dada: o horário novo vale a partir de…»), como o horário que sai sem registro já passado ou a menos de 15 minutos. Quando não é seguro, o cartaz diz o porquê e a linha nova começa no próximo dia dele |
| — | **O horário de hoje sem alarme é dito com todas as letras:** «ATENÇÃO: a dose de hoje das 20:00 não será pedida pelo alarme (a linha nova começa sábado, 10/10): se a veterinária mandar dar hoje, registre como dose avulsa». Quando a linha antiga ainda toca hoje, ela fica com as doses de hoje (como na troca de horário por datas) |
| — | **Dia sim, dia não:** a linha nova segue a contagem da linha antiga (o «próximo sim»); nunca dá dois dias seguidos. Dias específicos (seg, qua, sex) continuam os mesmos |
| «Parou de tomar» aceitava motivo de 3 letras e não andava o carimbo da agenda | **Motivo de pelo menos 4 palavras** (na própria caixa) e o carimbo na mesma gravação: um «Salvar agenda» aberto antes, em outro aparelho, é recusado e não faz o remédio voltar |
| «Salvar medicamentos» mudava o horário de hoje mesmo com a dose já dada | **A régua do «Salvar agenda»:** o horário mudado depois da dose de hoje começa amanhã, por troca de datas, com a mesma frase |

### (BJ) Plantão › Agenda de Medicação (a lista) e Cuidado Vet

| Antes | Agora |
|---|---|
| «Remover item» apagava o remédio salvo, sem motivo e sem nome no rastro | **O remédio salvo vira o mesmo «Lançado por engano»** (a Gestão assina; nada é apagado; a Linha do tempo diz o remédio e o FILHOt). O rascunho que nunca foi salvo continua saindo só da tela (pergunta S3-P1 à Adriana) |
| — | **O remédio anulado aparece riscado e só leitura** no Plantão (fora do «Salvar agenda»: um formulário velho não o regrava) e no Cuidado Vet (sem «Alterar», «Suspender» e «Reativar»; a gravação e o «Reativar» da Veterinária releem o banco e recusam o anulado, sem apagar o histórico). Ele sai do alarme, do check-in (também da pergunta «tomava X — não toma mais?»), da linha «💊 toma remédio», do texto pronto do lançamento, da conta "vai faltar" e da «Receita encerrada», e não recebe cópia de dose de outra linha |
| — | **O rascunho do «Remover item» nunca apaga remédio salvo:** se, com a pergunta aberta, o «Salvar agenda» transformou o rascunho em remédio salvo, o «Remover» vira o «Lançado por engano» |

### (BK) Lançamentos do dia › Medicação

| Antes | Agora |
|---|---|
| A medicação errada só mudava tirando e lançando de novo; no intervalo, o alarme sumia | **«corrigir»** (44 px) na linha da medicação: qual remédio e como dar, onde está e a hora. O **mesmo lançamento** guarda o antes e o depois, e o alarme passa do valor antigo para o novo sem intervalo. Recusa mudar a hora de uma dose já dada (o alarme pediria de novo); recusa mudar a hora quando **a hora antiga já passou (ou falta menos de 15 minutos) e a dose não foi registrada** — o alarme dela pode estar aberto no celular da plantonista, e a hora nova pediria a dose de novo (a mesma regra da agenda, 6.54); e recusa a correção que separaria esta dose da dose igual do check-in de pertences (as duas tocariam). Assina quem vê a tela pelo papel ou a recebeu no Time. Na planilha e na TV: texto mudado, a linha nova entra antes de a antiga sair; só a hora, tira e lança, dizendo o resultado de cada passo |
| «tirar» apagava a medicação | **«tirar» pede a senha da Gestão** (decisão 1): o lançamento sai da lista viva e fica guardado inteiro, numa gravação só; aparece **riscado no mesmo cartão** («Anulada (lançada por engano)»), também depois de recarregar a tela, com **«Reabrir»** (lança de novo, como registro novo, com a trava de repetido, a régua da dose já dada e a da hora já passada sem registro). A dose já dada continua no registro, com o nome de quem deu |
| — | **Dois aparelhos:** «corrigir» e «tirar» com o lançamento mudado em outro aparelho enquanto o cartaz estava aberto são recusados («mudou em outro aparelho. Nada foi gravado») |

### (BL) Dashboards › Linha do tempo do dia (e Configurações › Logins e segurança, o resumo por pessoa)

| Antes | Agora |
|---|---|
| — | **As ações novas em português:** Desfez uma dose de remédio (lançada por engano), Reabriu uma dose de remédio anulada, Corrigiu uma dose avulsa de remédio, O estoque do remédio voltou (dose anulada), Anulou um remédio da agenda (lançado por engano), Voltou a tomar um remédio, Corrigiu a medicação dos Lançamentos do dia, Tirou a medicação dos Lançamentos do dia (lançada por engano); e as que apareciam em código: Medicamentos da ficha, Aviso de remédio ao Telegram, Prescrição da Veterinária, Reativou um remédio (Veterinária) |

> **Servidor (vigia do Telegram, `integracao-telegram/Codigo.gs`):** a dose anulada passa a contar como sem registro (de dia, na noite de ontem e no teste de bancada). Só vale depois de publicado no Apps Script pelo @devops com a Adriana (pergunta S3-P3). Até lá, o app cobra a dose anulada e o servidor não.

## O que mudou em 09/out/2026 (v 2026-10-09-13) — A base comum de corrigir e anular (S0 da revisão tela por tela)

> Adriana, 09/out/2026 (quadro de pedidos, linha 87): *"O app está engessado, tudo preciso entrar no Claude para alterar. Preciso que tudo no app possa ser excluído, modificado, alterado e etc."* Esta entrega é a peça comum que as próximas 14 entregas (S1 a S14) vão usar em cada tela. Ela não cria tela nova no menu: muda o que já existe em seis lugares e deixa pronto o cartaz único.

### (BB) O cartaz único «Corrigir / Anular / Reabrir» (sem tela própria; as telas das próximas entregas o chamam)

| Antes | Agora |
|---|---|
| Cada tela inventava o seu jeito de corrigir (a 6.53 e a 6.56 fizeram cada uma o seu cartaz) | **Um cartaz só**, com três ações: **Corrigir** (os campos vêm com o valor de agora; antes da senha, o cartaz mostra «Antes → Depois» do que mudou; sem mudança, «Nada mudou» e nada é gravado), **Anular («lançado por engano»)** (a lista inteira do que sai junto — alarme, pendência, linha da planilha e da TV, crédito, pontos — e a frase "O registro fica riscado, com quem, quando e o motivo. Nada é apagado.") e **Reabrir** (o estado para o qual volta e o que volta junto; a volta é um registro novo) |
| — | **Motivo** de no mínimo 4 palavras (a régua da 6.53, a mesma do app inteiro), recusado na própria tela, sem fechar |
| — | **Assinatura com a senha da própria pessoa.** Senha de posto (Plantonista, Monitor 1, Recepção), senha de ninguém e nome digitado não assinam. No nível «Gestão» (anular dinheiro e remédio: decisão 1, pela recomendação), só a Gestão e a Diretoria. Recusada a senha, a tela diz por quê e quem assina. O app grava o nome, nunca a senha |
| — | **«Pronto», «Anulado» ou «Desfeito» só depois de o banco confirmar.** Recusado: «NADA FOI GRAVADO», o motivo em português e "O registro continua como estava". Sem resposta em 20 segundos: «O BANCO AINDA NÃO CONFIRMOU — confira na tela antes de tentar de novo» |
| — | **Rastro:** cada correção vira uma entrada nova na Linha do tempo do dia, com o antes e o depois, o motivo, quem assinou e o papel. O que foi corrigido ou anulado pode aparecer riscado, com quem, quando, o motivo e o botão «Reabrir» |

### (BC) Cadastro de Peludinhos › qualquer campo da ficha (e Plantão › ficha do hóspede)

| Antes | Agora |
|---|---|
| A ficha mudava sem guardar o que era nem quem mudou (a alergia é dado de saúde) | **Todo campo mudado guarda o antes e o depois**, inteiros, com quem, quando, a tela e se foi uma pessoa ou o app sozinho (a coleira recalculada ao abrir a ficha e a resposta do tutor tratada sozinha saem como «automático»). Fica num lugar novo do banco (`daycare/ficha-rastro`), fora do cadastro, e na Linha do tempo do dia: «Mudou "Comportamento: Em casa" de {FILHOt}: "antes" → "depois" (Cadastro de Peludinhos)». Data aparece no jeito brasileiro («01/10/2026»). A foto entra só como «foto trocada»; o peso fica de fora (a pesagem já guarda data e quem). Vale também para o Plantão: dados do hóspede, brinquedos e alergia ou restrição — inclusive a **primeira** alergia ou restrição de um FILHOt que nunca teve uma («(vazio) → "frango"») |
| — | **O rastro fica no nome de quem mudou**, com o papel e a hora da mudança, mesmo quando o tablet está sem internet e outra pessoa entra no lugar antes de o banco confirmar |
| «✓ Salvo» aparecia antes de o banco responder (e só na aba Identificação) | **«Salvando…» enquanto o banco não responde; «✓ Salvo» só com o ok.** Recusado: em vermelho, "Anotado NESTE aparelho, mas NÃO salvou no sistema", com o motivo em português. Sem resposta em 20 segundos: "O banco ainda não confirmou". O aviso aparece também numa barra no pé da tela, em qualquer aba da ficha (tocar fecha); a barra **some junto com a ficha** ao trocar de tela ou voltar para a lista, e a resposta de uma ficha nunca aparece em outra nem segura o «✓ Salvo» de outra. O que o app grava sozinho (a coleira recalculada ao abrir a ficha) não mostra «Salvando…» nem «✓ Salvo». A foto também espera o banco |

### (BD) Cadastro de Peludinhos › Plano («Confirmar» e «Desfazer a última renovação»)

| Antes | Agora |
|---|---|
| Quem não podia mexer no plano tocava em Confirmar: a linha do histórico era gravada e a tela dizia «PLANO GRAVADO» | **Barrado antes de gravar qualquer coisa**, com a frase de quem pode (Consultora de Bem-Estar, Supervisão, Gestão e Diretoria) e o registro na Linha do tempo |
| O plano novo, a linha do histórico e a resposta da troca de categoria eram três gravações separadas | **Uma gravação só, tudo ou nada.** «PLANO GRAVADO» só depois do ok; recusado: «O PLANO NÃO FOI GRAVADO — nem o plano nem as Renovações anteriores mudaram» |
| O «Desfazer» tirava a linha do histórico mesmo quando o plano não voltava | **Uma gravação só:** o plano que volta, a linha nova e a saída da antiga. Recusado: «A RENOVAÇÃO NÃO FOI DESFEITA — nada mudou» |

### (BE) Cadastro de Peludinhos › «Novo cadastro» («Criar e abrir a ficha»)

| Antes | Agora |
|---|---|
| A ficha abria como criada e o FILHOt entrava na lista deste aparelho mesmo com a gravação recusada | **A ficha só abre depois do ok do banco.** Recusado: «O CADASTRO NÃO FOI SALVO», o FILHOt não entra na lista e o que foi digitado continua no formulário para tentar de novo |
| — | **Dois toques seguidos** em «Criar e abrir a ficha» antes de o banco responder: o segundo espera («O cadastro de {FILHOt} já está sendo salvo: espere a confirmação do banco.»). Um cadastro, um rastro, uma ficha aberta |

### (BF) O papel conferido na função que grava (não só no menu)

| Onde | Quem pode agora (uma tela velha em outro aparelho ou o console também são barrados, com o registro na Linha do tempo) |
|---|---|
| O que fazer hoje › «Tratei — pode tirar da mesa» (atenção da entrevista) | Gestão e Diretoria |
| Plantão e Hóspedes de hoje › «É o mesmo FILHOt?» | Consultora de Bem-Estar (Recepção), Supervisão, Gestão e Diretoria. Quem não responde (Encãotador, plantonista) continua vendo a pergunta, com a frase «Quem responde é a Recepção, a Supervisão ou a Gestão.» (pergunta S0-P1 à Adriana) |
| Relatórios › «Fotos a conferir» (É ele / Não é / desfazer) | Quem vê Relatórios pelo papel (Consultora de Bem-Estar, Supervisão, Gestão e Diretoria) ou recebeu a tela Relatórios no Time |
| Orçamento › «Cancelar reserva» e «Mudar as datas» (e o Excluir da hospedagem) | A senha tem de ser de uma pessoa (não de posto) que trabalha no Orçamento: Consultora de Bem-Estar, Supervisão, Gestão e Diretoria, ou quem recebeu a tela Orçamento no Time. Com dois nomes iguais no Time, vale a pessoa da senha digitada (antes, a gravação procurava pelo nome e podia achar a outra) |
| Pendências de prevenção › «Tirar pendência» | Quem vê a tela pelo papel ou a recebeu no Time |
| Lançamentos do dia › «Tirar» (também o caminho fora do prazo da reposição) | Quem vê a tela pelo papel (Consultora de Bem-Estar, Supervisão, Gestão e Diretoria) ou a recebeu no Time; a frase de quem pode sai da mesma regra da tela |

### (BG) Dashboards › Linha do tempo do dia (e Configurações › Logins e segurança, o resumo por pessoa)

| Antes | Agora |
|---|---|
| As ações de corrigir, desfazer e anular apareciam com o nome técnico (`renovacao-desfeita`, `gravacao-FALHOU`…) | **Em português, num lugar só, nas duas telas:** as ações desta entrega (Mudou um campo da ficha, Corrigiu, Anulou (lançado por engano), Reabriu, Tentativa sem permissão… Nada foi gravado.), as 21 de corrigir, desfazer e anular que já existiam, as da 6.54 e da 6.56, e «A gravação NÃO chegou ao sistema: … (o motivo)». As outras ações antigas continuam com o nome de hoje até a S13 |
| A mesma ação usada para coisas diferentes aparecia com o nome de uma só delas («Tirou uma pendência de prevenção» para quem abriu ou avisou) | **Nome neutro e o detalhe diz o que foi:** «Pendência de prevenção — abriu…», «Ficha pela resposta do tutor — conferiu sem mudar nada…», «Atenção da entrevista», «Duplicidade de hóspede», «Comida ou remédio do hóspede». No resumo por pessoa, a tentativa barrada conta como «Tentativa sem permissão» |

## O que mudou em 09/out/2026 (v 2026-10-09-12) — Mudar a comida e o remédio do hóspede depois do check-in (caso do Palito: 45 g, e não 50 g)

> Adriana, 08/out/2026 (quadro de pedidos, linha 82): *"O Palito come 45 gramas e não 50 como colocamos no checkin, precisamos conseguir alterar medicação e comida dos hóspedes c/ quantidade, marca, ração ou patê ou comida etc! assim como medicação, e de forma simples."* E em 09/10: *"Preciso que tudo no app possa ser excluído, modificado, alterado e etc."* Até aqui a comida só mudava pelo «✎ Corrigir informação errada» do Check-in (a tela inteira, com assinatura e reconfirmação de cada remédio) e o remédio, pelo «Salvar agenda» do Plantão — que, mudando o horário depois de a dose de hoje ter sido dada, fazia o alarme tocar a dose do horário novo: **dose em dobro**. (Story 6.54 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BA) Plantão › FILHOt › «✎ Mudar comida e remédio» (também em Hóspedes › «Comida e remédio» e no quadro "já está hospedado" do Check-in)

| Antes | Agora |
|---|---|
| Para trocar 50 g por 45 g, só o «✎ Corrigir» do Check-in: a ficha inteira de novo, assinatura com o dedo ou «O tutor não veio», reconfirmação de cada remédio, e o PDF saindo "sem o tutor" | **Uma tela curta**, aberta em 3 lugares: no Plantão (botão logo abaixo de «Reemitir ficha»), em Hóspedes (linha HOSPEDADO ou A CHEGAR) e no quadro amarelo "já está hospedado" do Check-in («Só a comida ou o remédio mudou? Mudar sem refazer o check-in»). Quem vê o botão: Consultora de Bem-Estar, Gestão, Supervisão, Diretoria e Veterinária (a Veterinária não tem a aba Hóspedes). Plantonista, monitor, aprendiz e conferência continuam vendo a comida e o remédio, sem o botão |
| — | **Cabeçalho de identidade** (nome, raça, tutor, datas da hospedagem). Raça ou tutor diferentes da ficha ligada, duas hospedagens ativas do mesmo FILHOt, hospedagem ligada à ficha só pelo nome, ou a planilha dizendo outro tutor (o caso da Frida) **não deixam mudar**: a tela diz o que está diferente e manda resolver a ligação antes (Gestão). Sem check-in da hospedagem: «Faça o check-in da hospedagem» |
| — | **Comida em 1 toque:** uma linha por refeição ("Jantar · 19:00"), com **−5 g** e **+5 g** (em lata, sachê ou medidor, −½ e +½) e o campo para digitar (aceita 47; recusa negativo; abaixo de zero a ração daquela refeição sai). Depois do toque: "(era 50 g)". **Mesma quantidade em todas** quando todas são iguais (50 → 45 em todas com 1 toque). **«Mudar o que ele come»:** tipo (Ração, Ração + natural, Comida natural), marca, medida (gramas, medidor, lata, sachê) e, por refeição, horário, ração, comida natural e "o que mais (patê, iogurte…)"; acrescentar ou tirar refeição. O **patê** é complemento da refeição (PA5). **«Não trouxe ração — comida úmida da casa»** (só nesta hospedagem). Tarja de **alergia e restrição** no alto do bloco. O almoço do Day Care aparece como leitura ("Almoço no Day Care: 40g … a Gestão muda em Ficha › Almoço") |
| A ficha (próxima hospedagem) só aprendia a comida nova se alguém tocasse em «Mudou — guardar na ficha» no check-in | **«Guardar também na ficha de {nome} (na próxima hospedagem já vem assim)»** — ligado por padrão (PA4); desligado = só desta vez. Sem permissão de ficha ou com a ligação incerta: a frase "a ficha só muda pela recepção ou pela Gestão" e a ficha não muda |
| — | **Remédios:** cada remédio em uso ou que ainda vai começar tem **Mudar dose**, **Mudar horário** e **Parou de tomar**, e há **+ Remédio novo**. Suspenso pela veterinária: só leitura ("só ela reativa"). Remédio lançado no Day Care hoje (check-in de pertences): só leitura ("muda lá"); o remédio novo com nome parecido avisa |
| Mudar o horário depois de dar a dose de hoje fazia o alarme tocar de novo no horário novo (P6) | **A régua da dose de hoje:** o horário novo **começa amanhã** quando a dose de hoje (num horário que sai) já foi dada, quando o horário que sai já passou ou está a menos de 15 minutos, quando o horário novo já passou hoje, ou antes das 06:00. É uma **troca de datas**: o remédio antigo termina hoje (as doses de hoje continuam nele) e um novo começa amanhã (dia sim, dia não: no próximo dia "sim"). **«Hoje»** só aparece quando nada disso acontece, e mesmo assim o recomendado é **«A partir de amanhã»** (um celular sem internet ainda segue o horário antigo hoje). A tela mostra **«Como fica»**: "Hoje: 08:00 (já dada por Wandela às 08:04). A partir de sábado, 10/10: 09:00." Tratamento que termina hoje: "o horário novo não chega a valer" (nada muda). **Duas doses perto na noite da troca** (ex.: 22:00 → 00:30 deixa 2 h 30 min entre a das 22:00 de hoje e a das 00:30 de amanhã): a tela diz até quando dar a das 22:00 ("não dê depois das 23:15") e só salva com **«Confirmei com a veterinária»**; o alarme da das 22:00 atrasada para às 23:15 (a metade do intervalo; num celular com o app antigo, ainda pode tocar até 01:00). Se o remédio da linha nova for suspenso pela veterinária ou parado antes de começar, a das 22:00 volta ao teto de sempre (3 h). A trava das 06:00 é só do remédio que já existe: o **remédio novo** lançado de madrugada pode começar hoje |
| — | **Dose:** muda no mesmo remédio, vale na próxima dose; o estoque contado e os "contados" de hoje continuam. Trocar a medida de um blister pede a contagem de novo (ou o estoque deixa de ser contado). **Parou de tomar:** "A dose de hoje das 20:00 ainda deve ser dada?" — «Não — parou agora» (recomendado) tira os horários de hoje ainda não dados e deixa os já dados no placar (sem nenhum dado hoje, termina ontem); «Sim — para depois de hoje». **De madrugada**, a pergunta inclui a dose de ontem sem registro que o alarme ainda toca ("Ainda devem ser dadas a dose de ontem das 22:00 (sem registro) e a de hoje das 22:00?"); «Não — parou agora» tira também essa (ontem fica só com as doses dadas ontem) e a tela avisa "O alarme da dose de ontem das 22:00 (toca até 01:00) de Zenrelia pode tocar no celular da plantonista: avise para não dar". O remédio fica na lista da hospedagem, com "parou em", para o Check-out devolver. **Remédio novo:** nome, medicamento ou suplemento, dose e medida, horários, uso contínuo ou "tomar até", de onde veio, como veio (blister com a contagem, pote ou frasco, ou da casa) e **"O tutor trouxe agora?"** — Sim, com quem recebeu: a Conferência reabre ("CHEGOU MATERIAL NOVO … recebido por …"); Não: não reabre. **«Tomar até» antes do primeiro dia não grava** (um remédio assim nunca tocaria): "o remédio termina na sexta, 09/10 e começaria no sábado, 10/10: escolha «Hoje» ou mude «Tomar até»"; com o horário de hoje já passado, "é um remédio só de hoje com o horário já passado: fale com a veterinária". Dois remédios novos com o mesmo nome na mesma tela: "junte os horários num só" |
| O estoque da troca e o aviso "está acabando" | Na troca por datas o estoque **passa para o remédio novo**: o que sobra agora menos as doses de hoje ainda por dar (o antigo fica sem estoque e o desconto dele não conta duas vezes). O aviso de estoque aberto passa a apontar para o novo (não nasce outro). "Horários de hoje" mostra uma linha de estoque só |
| A conta "vai faltar" contava da entrada, com o que veio | Depois de mudar um remédio, a conta é refeita **a partir do que sobra agora** até a saída; se não cobre, o aviso de sempre em "Pendências com o tutor" (sem duplicar o aberto). O remédio parado não é cobrado. A comida que aumenta também refaz a conta |
| O motivo do Corrigir aceitava 1 letra | **Motivo de no mínimo 4 palavras** (3 diferentes, de 2 letras ou mais — a régua é a da 6.53, uma só no app) e **o nome de quem mudou** (login de posto, como "Recepção", não serve). 4 frases prontas de 1 toque, editáveis: "A tutora avisou por WhatsApp", "A tutora ligou e corrigiu", "A veterinária mudou a prescrição", "Erro de digitação no check-in" (PA1) |
| — | **«Conferir e salvar»:** o resumo de → para em português ("Jantar: 50 g → 45 g de ração"; "Zenrelia: horário 08:00 → 09:00, a partir de sábado, 10/10"), o motivo, quem, e se a ficha também muda. **«Voltar e mudar»** não grava nada. **«Salvar»:** uma gravação só (hospedagem, agenda, lista da hospedagem, rastro e Conferência de uma vez) mais o carimbo das hospedagens. Mudado por outra pessoa depois que a tela abriu (a comida, um remédio, a veterinária suspendeu, uma dose foi registrada e o «Hoje» não vale mais): **não grava** e diz o quê. Sem conexão: "Sem conexão: não salvou". Repetir o Salvar não grava duas vezes. Prazo sem resposta: "Ainda não confirmou: não repita. Confira em 1 minuto, em OUTRO aparelho" (neste, a mudança aparece antes de o banco confirmar). Na hora de salvar, a **permissão e o nome** são conferidos de novo (troca de turno com a tela aberta: a plantonista não grava; o nome do turno anterior pede confirmação). **O dia que virou** com a tela aberta volta ao «Conferir», com o resumo do dia novo. Duas gravações ao mesmo tempo do mesmo remédio caem no **mesmo item** (nunca dois alarmes iguais); o remédio novo que outra pessoa acabou de lançar barra. Se os remédios do FILHOt forem gravados em outro aparelho entre a releitura e a gravação (por exemplo, «Parou — agora» de um lado e a troca de horário do outro), **o segundo não grava**: "Os remédios de Palito mudaram agora há pouco, em outro aparelho. Nada foi salvo: feche e abra de novo". A troca nunca sobrescreve outro remédio da agenda (o item novo da troca tem nome próprio, `mcr_t_…`), e um remédio novo parado no mesmo dia pode ser lançado de novo. **«Avise a plantonista e confira no celular dela»** também na mudança de dose, no «Parou — agora» e no remédio novo que começa hoje. Se antes houve uma mudança «só desta vez», a tela diz que a ficha leva a comida inteira desta tela, inclusive aquela mudança |
| — | **Rastro:** cada mudança em `estadias/{id}/alteracoes/{aid}` (quando, quem, motivo, as frases de → para, a comida de antes e de depois, cada remédio com "vale hoje/amanhã"), em "Já resolvido" da Conferência e do Check-out, no histórico de cada remédio e na auditoria. **Cada mudança de remédio manda uma linha ao grupo do Plantão no Telegram** (PA6; só se o grupo existe na ponte; a comida não manda). O **PDF reemitido** ganha a seção **"ALTERAÇÕES DEPOIS DO CHECK-IN"** numa página a mais (a primeira página fica igual; sem alteração, nada muda) |
| A comida mudada na recepção só aparecia no card do Plantão de outro aparelho em até 5 minutos; o remédio mudado em outro aparelho só entrava no alarme quando a lista de hóspedes era relida | **Outros aparelhos:** o card do Plantão se redesenha em 2 segundos (só com a lista à vista, sem ficha aberta); o alarme dos celulares de quem recebe o alarme refaz a fila em 3 segundos quando horário, dose, datas, frequência ou suspensão mudam (o desconto do estoque a cada dose não relê). Fecha também o limite da 6.47 ("remédio suspenso em outro aparelho"). A referência do alarme é guardada também no aparelho que estava na Gestão, para a 1ª mudança depois que a plantonista entra também refazer a fila |
| «Salvar agenda» do Plantão (Veterinária e Gestão): o horário mudado depois de a dose de hoje ser dada tocava de novo | **A mesma régua:** a troca vira troca por datas, e a mensagem diz "a dose das 08:00 de hoje já foi dada. O horário novo (09:00) começa amanhã, sábado, 10/10; hoje continua 08:00." Sem dose dada e com folga, muda no mesmo remédio, como antes. A dose mudada junto com o horário já vale na próxima dose de hoje (a frase e o histórico dizem a dose); o fim do tratamento lido é o do formulário. **No dia da troca, a linha de hoje** (a que termina hoje) passa pela mesma régua — com a dose dada, continua no horário de hoje e a frase manda "mudar a linha de baixo (a que começa no sábado, 10/10)" —, não volta a valer depois de hoje e não ganha estoque vazio ("Horários de hoje" com uma linha de estoque só). Duas doses perto demais (22:00 → 00:30) não trocam por aqui: só pela tela nova, com a confirmação da veterinária. **Formulário aberto antes de uma mudança feita em outro aparelho** (uma troca de horário ou um «Parou» pela tela nova, a veterinária, o check-in, a Ficha): o «Salvar agenda» não grava — "A agenda de Palito mudou em outro aparelho. Nada foi salvo: feche e abra de novo." (sem isso, o remédio antigo voltava a ser "uso contínuo" e tocavam o antigo e o novo). Fechado e aberto de novo, grava; o 2º «Salvar» na mesma tela também. A **Ficha › Medicamentos** tem a mesma trava |
| — | Check-in no dia da troca: o remédio antigo não volta para a tela (só o novo). A troca por datas de um remédio da veterinária **não acende** "Receita encerrada" (o «Parou» continua acendendo). A lista de remédios da hospedagem passa a guardar o id da agenda (`agendaId`) |
| «Corrigir esta hospedagem › trocar a ficha» (6.53) levava para a ficha certa só o remédio lançado no check-in: a linha nova de uma troca de horário e o remédio novo feitos por esta tela ficavam na ficha errada (no dia seguinte tocavam no FILHOt errado e faltavam no certo) | **A troca de ficha leva também os remédios desta hospedagem mudados por esta tela**: a linha do horário novo segue o remédio de onde veio (a corrente inteira), o remédio novo vai quando foi lançado **nesta** hospedagem, e o trocado e o parado vão junto, com o histórico inteiro. Mesmo id, mesmo estoque, doses já dadas copiadas (as originais ficam), o sinal para os outros aparelhos antes de o remédio sair da ficha errada. Remédio de **outra** hospedagem da ficha errada, ou da própria ficha (não nascido nesta hospedagem), fica onde está. O «Retomar a troca de ficha» também leva (inclusive uma troca começada antes desta versão). Antes da senha, "Vai para a ficha certa" diz cada linha: "Zenrelia (o horário de antes, 08:00, até 09/10; o estoque passou para o horário novo)", "Zenrelia (o horário novo, 09:00, a partir de 10/10, com o estoque)". Se a ficha certa já tem **outro** remédio com o mesmo registro (o remédio novo tem registro de nome + dia), nada é gravado: "a ficha de … já tem outro remédio com o mesmo registro de "Probiótico"; confira a aba Medicamentos das duas fichas com a Gestão". **Excluir** a hospedagem lançada por engano também para o alarme desses remédios ("lançados nesta hospedagem (no check-in ou depois)") |
| O remédio que a veterinária ou o Plantão lançou na ficha errada durante a hospedagem ficava lá depois da troca de ficha, sem aviso (a Amoxicilina receitada no dia 08 parava de tocar para o hóspede) | **Antes da senha, o cartaz pergunta, um por um**: "Remédios lançados durante esta hospedagem (não vieram do check-in): de quem são?". Cada um com a dose, o horário e quem lançou ("Lançado em 08/10 pela veterinária"), e duas escolhas: **«Levar para a ficha certa»** ou **«Deixar onde está»** — nada vem marcado. O **«Trocar a ficha» fica travado** até todos terem escolha ("Falta escolher … em 2 remédios lançados durante esta hospedagem"). «Levar» segue a mesma régua (mesmo id, estoque, doses copiadas, a troca de horário dele junto, o sinal antes de sair da ficha errada, choque de registro recusado). A escolha vai para o rastro (a estadia, `hospedagem-correcoes` e o aviso da Gestão) e para o «Conferir». Um remédio lançado na ficha errada **depois** de o cartaz abrir trava a gravação: "feche este cartaz e abra de novo, para escolher". Se a linha antiga de uma troca de horário foi removida antes (o «Remover item»), a linha do horário novo ainda vai junto (remédio do check-in) ou é perguntada (remédio da veterinária, do Plantão ou da Ficha). Um remédio do plano removido da ficha errada com o cartaz aberto trava a gravação: "Nada foi gravado: um remédio mudou com o cartaz aberto (…); feche e abra de novo." |
| A troca de ficha e o Excluir mexiam na agenda da ficha errada sem avisar a trava: um «Salvar agenda» (ou a Ficha › Medicamentos) aberto antes, salvo depois, recriava ou revivia lá os remédios desta hospedagem | **A troca e o Excluir andam o carimbo da agenda da ficha errada** (o Excluir na mesma escrita do "parou"): o formulário de antes é recusado — "A agenda de Palito mudou em outro aparelho. Nada foi salvo: feche e abra de novo." A recusa por registro repetido diz como sair: o que conferir, quem resolve (a Gestão) e o que fazer em cada caso («Remover item» na Agenda de Medicação e trocar de novo, ou lançar de novo na ficha certa). **O «Remover item» do Plantão e o «Reativar», o «Suspender» e o «Ciente» do Cuidado Vet também andam o carimbo**, na mesma escrita: o formulário de antes não traz de volta o remédio removido, não suspende de novo o reativado e não apaga do histórico a linha "Suspendeu" nem a "Ciente do término". **O «Remover item» passa pela mesma trava do «Salvar agenda»:** depois de remover, o «Salvar agenda» da mesma tela grava; se outro aparelho mudou a agenda antes, nada sai e a tela diz "A agenda de Palito mudou em outro aparelho. Nada foi salvo: feche e abra de novo." |

- **Perguntas à Adriana (não travam; aplicadas pela recomendação):** **MC7** — mudar a dose da noite para depois da meia-noite (22:00 → 00:30) pede «Confirmei com a veterinária»; a alternativa seria não deixar. Recomendado: pedir a confirmação. **MC1** — a senha da pessoa não é pedida (basta o nome de quem está no turno; a senha da Gestão fica para excluir e desfazer, story 6.53). Recomendado: sem senha. **MC2** — o PDF reemitido leva as alterações numa página a mais, com a primeira página idêntica à aprovada. Recomendado: sim. **MC3** — a tela nova não grava o almoço do Day Care (é dado da área protegida): mostra e diz para mudar em Ficha › Almoço. Recomendado: manter assim. **MC4** — o «Hoje» continua como escolha (com «A partir de amanhã» recomendado) quando a régua deixa. Recomendado: manter. **MC5** — as frases prontas dizem "A tutora…"; trocar para "O tutor…" ou deixar as duas. Recomendado: manter (são editáveis).
- **Limites (registrados na Story 6.54):** frequência e período (dia sim, dia não; "tomar até") de um remédio que já existe continuam no Plantão › Agenda de Medicação (Gestão e Veterinária) — a tela nova muda dose, horário, parou e remédio novo; trocar o nome é «Parou» + «Remédio novo». Outras portas ainda mudam o horário no mesmo remédio sem a régua: Ficha › Medicamentos, Cuidado Vet e o Corrigir/SUBSTITUIR do Check-in (risco R11, story à parte). O Cuidado Vet regrava o remédio inteiro e apaga as marcas da troca (`trocadoPor`) se a veterinária editar o remédio antigo no dia da troca. O «➕ Acrescentar» do Check-in continua regravando a comida da hospedagem sem motivo (K20). Celular sem internet segue a fila velha até voltar (por isso "Amanhã" é o recomendado). Se o alarme da dose de ontem já estiver aberto no celular da plantonista quando alguém toca «Parou — agora» de madrugada, ele continua na tela até alguém responder (por isso o aviso "avise para não dar"). O Firebase de mentira do teste no navegador às vezes não entregava a gravação à aba de trás (limite da bancada, não do app).
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`; o check-in novo, o Acrescentar, o Corrigir e o SUBSTITUIR gravam como antes (só a lista da hospedagem ganha `agendaId`); o alarme (`checarDespertadorMed`, `registrarDoseAgendadaGlobal`, `descontarEstoquePorDose`; de `carregarAgendaMedTodos` e `medOntemTeto`, só o horário do item novo da troca, `continuaEm`, para o teto da dose atrasada), o registro das doses (`medicacao-log`, nada é gravado lá), o retrato do vigia e o vigia do servidor. A versão do app (`APP_VERSAO`) não foi carimbada.
- **Onde está no código** (`auaulandia/index.html`): bloco novo "MUDAR COMIDA E REMÉDIO DEPOIS DO CHECK-IN" (antes da Conferência) — régua e regras puras `motivoQuatroPalavras`, `alimDerivados`, `mcrRegraHorario`, `mcrModo`, `mcrInicioNovo`, `mcrTrocaPorDatas`, `mcrEstoqueHerdado`, `mcrParou`, `mcrDosesHojeRestantes`, `mcrCoberturaDaqui`, `mcrCasarNaLista`, `mcrListaAplicar`, `mcrIdentidade`, `mcrEstadiaDoHosp`, `mcrChaveViaSoNome`, `mcrRemediosDaTela`, `mcrDiffComida`, `mcrPasso`, `mcrQtdLimpa`, `mcrAssinaturaAlarme`, `mcrAgendaRegua`, `mcrPdfApendice`, e da 2ª rodada `mcrNovoChecar`, `mcrOntemFaltam`, `mcrPertoDaTroca`, `mcrPertoTxt`, `mcrParouTexto`, `mcrIdTroca`, `mcrIdNovo`, `mcrNoDia`, e da 3ª `mcrIdTrocaOcupado`, `mcrIdNovoLivre`, `mcrNovoJaLancadoTxt`, `mcrTravaAgenda`; estado e gravação `mcrEstadoInicial`, `mcrValidar`, `mcrConferirAntes`, `mcrMontar`, `mcrGravar`, `mcrDepoisDeSalvar`, `mcrAvisarPlantao`, `mcrRearmarAlarme`, `mcrPedirRedesenhoPlantao`, `mcrReguaDaAgenda`; portas e tela `mcrBotaoPlantaoHTML`, `mcrBotaoHospedesHTML`, `mcrBotaoCheckinHTML`, `mcrAbrirDoPlantao`, `mcrAbrirEstadia`, `mcrRender` e os toques `mcr*`; a capacidade `mudar-comida-remedio` no `PERM`; CSS `#mcrTela`. Alteradas (uma ou poucas linhas cada) — `salvarMedAgenda` (a régua e, na 4ª rodada, a trava da agenda), `carregarMedAgenda` (guarda o carimbo `_ts` lido), `fmedRender` e `fmedSalvar` (a mesma trava na Ficha › Medicamentos), `ciChecarHospedado` (o botão), `hospAbaLinha` (o botão), `abrirPlantao` (o botão), `ciPreencherMedicacao` (sem o `trocadoPor`), `ciMedsToLista` (`agendaId`), `medsEncerradasPend` (sem o `trocadoPor`), `carregarAgendaMedTodos` e `medOntemTeto` (`continuaEm`, K17), `checarFaltasDaEstadia` (o parado e o retrato `cobertura`), `ciFichaFonteEstadia`, `ciFichaPdfBlob` e `zPdfDocBlob` (a página das alterações; a assinatura fica na página dela), o ouvinte da agenda (re-arm) e `_cfIndexarEstadias` (redesenho).
- **8ª rodada (conferência final 4 do QA, CONCERNS):** o «Remover item» pela trava (C7-1: `magRemoverItem` usa `mcrTravaAgenda` e guarda na tela o carimbo novo) e o «Suspender» e o «Ciente» do fim da receita com o carimbo na mesma escrita (C7-2: `vetSuspenderMed` e `vetCienteFimMed`). 5 provas "6.54 QA7" (H12, H12b, H13, H13b e H14): **1085 provas, 0 falhas** (987 da versão publicada + 98 da 6.54).
- **7ª rodada (conferência final 3 do QA, CONCERNS):** a linha antiga removida antes da troca de ficha (C6-1: `hospMcrDaEstadia` decide pela raiz fora da agenda; a ponta da corrente de um remédio da veterinária, do Plantão ou da Ficha entra na escolha), o remédio do plano removido com o cartaz aberto (C6-2: a 1ª gravação recusa; o «Retomar» continua com o retrato) e as portas antigas que não andavam o carimbo (C6-3: `magRemoverItem` e `vetReativarMed`). 6 provas "6.54 QA6" (H1, H2, H5, H6, H7 e H8 do QA): **1080 provas, 0 falhas** (987 da versão publicada + 93 da 6.54). **Condição de publicação, a mais:** terminar (ou retomar) qualquer troca de ficha pela metade antes de publicar.
- **6ª rodada (conferência final 2 do QA, CONCERNS):** a trava pelas portas da 6.53 (C5-1: `hospTrocaAplicar` e `hospExcluirGravar` andam o carimbo da agenda da ficha errada), a escolha do remédio lançado durante a hospedagem (C5-3: `hospLancadoEm`, `hospInicioDoDia`, `hospOrigemTxt`, `hospTrocarEscolher`; o plano ganha `escolher`; `hospTrocarGravar` recusa sem escolha e com remédio lançado depois de o cartaz abrir) e a frase da recusa por registro repetido (`hospChoqueTxt`). 7 provas "6.54 QA5" (M1, M2 e M3 do QA, a frase da recusa e C5-3 a, b e c): **1074 provas, 0 falhas** (987 da versão publicada + 87 da 6.54). **Condição de publicação:** no dia do Merge, recarregar o computador da Gestão antes de qualquer «Corrigir esta hospedagem» (uma troca feita na versão antiga só leva o remédio do check-in).
- **5ª rodada (MC8, antes do QA):** a troca de ficha da 6.53 leva os remédios da 6.54 desta hospedagem — funções novas `hospMcrRaiz`, `hospMcrNovosDaEstadia`, `hospMcrDaEstadia`, `hospChoques`, `hospChoqueTxt`, `hospMoverNaHora` e `hospRemedioQueVaiTxt`; alteradas `hospPlanoDaTroca` (os `mcr_` decididos pela raiz e pela hospedagem), `hospTrocarGravar` (o choque conferido antes de gravar), `hospTrocaAplicar` (o que vai é relido na hora, também no «Retomar») e as linhas "Vai para a ficha certa" e "O alarme destes remédios… para" do cartaz. 6 provas "6.54 MC8" (a a f): **1067 provas, 0 falhas** (987 da versão publicada + 80 da 6.54).
- **4ª rodada (conferência final do QA e junção com a v 2026-10-09-07):** 4 provas "6.54" (RG14, RG14b e RG14c: o «Salvar agenda» e a Ficha › Medicamentos abertos antes de uma troca ou de um «Parou» feitos em outro aparelho; e o redesenho da tela: depois de digitar num campo, o toque no botão não se perde): **1061 provas, 0 falhas** (987 da versão publicada + 74 da 6.54).
- **3ª rodada (re-gate do QA, 09/10):** 9 provas "6.54 QA2" (RG2, RG3, RG4, RG5, RG5b, RG10, RG11, a trava da agenda e a dose de ontem já dada): **841 provas, 0 falhas**. O teto da dose atrasada, sem troca para amanhã (ou com o novo suspenso, parado ou começando depois de amanhã), é igual ao da base em 3.600 instantes sorteados.
- **2ª rodada (achados do QA, 09/10):** 20 provas "6.54 QA" (uma por achado, R28, R29, S01, S02 e as 3 provas pequenas do QA): **832 provas, 0 falhas**. Defeitos plantados: os 69 do dev (20 novos) e os 21 do QA, todos pegos pela Fase 0 sozinha. Simulação minuto a minuto do QA (34 cenários, com R26b e R27b): no celular que recebe o alarme, nenhuma dose em dobro e nenhuma perdida. Chromium a 375 px: 22:00 → 00:30 com «Confirmei com a veterinária», o remédio novo que termina hoje, «Parou — agora» às 00:30 com a dose de ontem, o «Salvar agenda» no dia da troca e o botão de 44 px em Hóspedes.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (812 no total na 1ª rodada, 0 falhas; 41 da 6.54, todas com relógio fixo e dado inventado; antes da implementação, as 36 primeiras falhavam na base e as 771 antigas passavam). A régua com a tabela (a) a (i), a folga de 15 minutos exata, as 06:00 em ponto, o remédio que começa hoje e o que termina hoje; o P6 fechado no alarme e no retrato do vigia, com a contraprova no mesmo remédio; sem dose perdida; a dose de ontem da 6.47 sem fantasma às 23:00; estoque, aviso e "vai faltar"; os derivados da comida iguais aos do check-in em 60 cenários; a gravação única, sem atropelo, sem conexão e sem repetir. Defeitos plantados: 49 (16 na régua da dose), 49 pegos. Harness: **3868 ok, com as mesmas 17 falhas do master**. Área protegida idêntica (155 funções `ck`/`ckt`/`pt`, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px (Firebase de mentira, dado inventado, relógio de São Paulo): Palito 50 g → 45 g no jantar e no café com −5 g, o card do Plantão mostra "JANTAR: 45 gramas de ração" no aparelho que salvou e no da plantonista; Zenrelia 08:00 → 09:00 às 10:00 com a dose das 08:00 dada: «Como fica» diz "a partir de sábado, 10/10", a agenda fica com 08:00 até hoje e 09:00 a partir de amanhã, e o alarme das 09:00 não toca hoje; motivo de 1 palavra recusado; «Voltar e mudar» sem gravar; o PDF reemitido com 2 páginas (1 sem alteração); sem rolagem lateral e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-11) — O erro dito em português em Reposições, Lançamentos do dia e Orçamentos («Failed to fetch» e parentes)

> Quadro de pedidos de 08/out/2026, linha 33: *"Banho da Cristal não apareceu («a planilha recusou — Failed to fetch»)"*. A 6.12 traduziu três lugares; a recepção ainda via o inglês técnico do navegador e do banco ("Failed to fetch", "PERMISSION_DENIED: Permission denied", "Cannot read properties of undefined…") nas outras mensagens dessas telas. Esta é a **1ª entrega** (pergunta F1 do quadro, recomendação aplicada a pedido da Adriana em 09/10); as outras telas vêm na 2ª. (Story 6.48 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BA) Reposições, Lançamentos do dia, Banho de quem faltou (Hoje na Zêluz) e Orçamentos › as mensagens de falha

| Antes | Agora |
|---|---|
| «Mandar agora» e «tentar de novo» (Reposições): "NÃO FOI PARA A PLANILHA · Failed to fetch · O lançamento continua salvo aqui no app — só não chegou à planilha." | **"A conexão com a planilha caiu."** e **"O lançamento continua salvo aqui no app. O app tenta de novo sozinho em até 10 min, enquanto estiver aberto."** — a promessa só quando o dia está na conferência automática (hoje até hoje+14) **e** alguém está conferindo (este aparelho com a conferência ligada, ou a última conferência de hoje há menos de 10 min). Senão: **"Confira a internet e toque em «Mandar agora» de novo; se continuar, avise a Gestão."** O prazo: "A planilha não respondeu a tempo (12 s)." A recusa com código vira frase: "A planilha recusou: a palavra-chave guardada no app não bate com a PONTE_SENHA gravada no Apps Script." + "Avise a Gestão." |
| A linha do crédito em Reposições, depois de falhar: "NÃO foi para a planilha — a conexão com a planilha caiu; o app tenta de novo sozinho em até 10 min", com o botão «tentar de novo» — mesmo quando o cartaz tinha acabado de dizer o contrário | A linha usa a **mesma régua do cartaz**: com alguém conferindo, a frase da 6.12; sem a prova, **"NÃO foi para a planilha — a conexão com a planilha caiu; confira a internet e toque em «Mandar agora» de novo; se continuar, avise a Gestão"**. O botão da linha se chama **«Mandar agora»** também depois da falha (é o que o cartaz manda tocar) |
| «Dia extra» avulso com o banco recusando: "Não salvou: o sistema recusou a gravação. Nada foi lançado…" e, logo embaixo, "Ele já estava lançado como Avulso em…" | Só o motivo. "Ele já estava lançado como Avulso" só quando ele já estava lançado |
| «reenviar» (Lançamentos do dia): "NÃO FOI PARA A PLANILHA · Failed to fetch" | Na queda e no prazo, o título é **"A PLANILHA NÃO CONFIRMOU"** (a linha pode ter entrado); o app tenta sozinho em até 10 min só se o lançamento não esgotou as 5 tentativas e o dia está entre hoje−7 e hoje+14; senão, "toque em «reenviar» de novo". Na recusa, continua "NÃO FOI PARA A PLANILHA", com o motivo em português |
| As gravações no banco que falhavam mostravam o código do banco e mandavam "Confira a internet", "Confira a conexão" ou "tente de novo em instantes" | **"o sistema recusou a gravação"** + **"Avise a Gestão."** (sem internet, o banco não dá erro: espera e grava sozinho). **"Nada foi salvo/mudado"** só onde a gravação é uma só; com várias (o «+ Falta» de período ou de alguns dias), "Confira o Extrato de {nome} antes de lançar de novo". Quando a gravação entrou e o que vem depois falhou, a tela **não** diz "Nada foi salvo": "Confira no Extrato (na lista) se entrou antes de tentar de novo; avise a Gestão." A conexão que cai no meio de uma transação: "Confira na tela se ficou marcado antes de tocar de novo." O aparelho sem banco: "Feche e abra o app com a internet ligada; se continuar, avise a Gestão." Erro do próprio app: "erro inesperado do app (…)" + "Avise a Gestão com um print desta tela." |
| Banho de quem faltou: "Não consegui tirar o banho de Bolt: Failed to fetch. O banho continua na planilha…"; o cartão "não deu certo: a ponte não respondeu" | Na queda: **"Não sei se saiu da planilha: confira. Tente de novo pelo Hoje na Zêluz, ou tire à mão: {onde}."** O cartão diz **"não deu certo: a conexão com a planilha caiu"** (também nos registros antigos). A decisão que não gravou não manda mais "Confira a conexão" |
| Orçamentos — fechar com a conexão caída: "FECHADO — MAS NÃO CONSEGUI FALAR COM A PLANILHA · Motivo: Failed to fetch · Lance à mão nas duas abas" | **"FECHADO — MAS A PLANILHA NÃO CONFIRMOU"**: "pode ter entrado tudo, uma parte ou nada"; "Quando a internet voltar, **espere 1 minuto e toque em «reenviar» uma vez só**, na lista de Orçamentos"; rodapé "**Não lance à mão**: com o «reenviar», a reserva entraria duas vezes." O cartão e a linha do histórico: "A planilha não confirmou — a conexão caiu antes da resposta…" (e não "NÃO entrou na planilha — Failed to fetch"); no «ver»: "Planilha: a conexão com a planilha caiu antes da resposta" |
| Orçamentos — cancelar com a conexão caída: "A vaga continua ocupada na planilha" | **"CANCELADA NO SISTEMA — MAS A PLANILHA NÃO CONFIRMOU"**: "não sei se {FILHOt} saiu da planilha" e "Confira as linhas de {A} a {B} na aba do calendário: se ainda estiver lá, apague à mão e risque a linha na aba Hospedagem." «Cancelar» recusado pelo banco: "Nada foi alterado. Avise a Gestão." (sem "Confira a internet") |
| Configurações › Valores da hospedagem › «Testar agora» (só Gestão): "Não consegui falar com a planilha: Failed to fetch" | "a conexão caiu ou a ponte não aceita o pedido. Confira a internet; se ela estiver boa, confira no Apps Script se a publicação está com acesso "qualquer pessoa"." |
| «Salvar a ponte» (Lançamentos do dia), «Salvar» da ponte dos Orçamentos e «Salvar» da tabela de preços (só Gestão): gravou, a tela de depois quebrou, e a frase dizia "Não salvou… Nada foi salvo" | **"Erro inesperado do app (…). Confira se salvou antes de tentar de novo; avise a Gestão com um print desta tela."** "Nada foi salvo" só quando o banco recusou a própria gravação. O mesmo no «Salvar orçamento» e no «Salvar a alteração»: quando não dá para saber se gravou, a tela não afirma "NÃO foi salvo" |
| Cancelar uma reserva ou uma pernoite que entrou, com a tela de depois quebrando: "Confira na lista se entrou…" | "Confira na lista de Orçamentos **se a reserva foi cancelada**…" e "Confira na lista **se a pernoite foi cancelada**…" |
| A trava de «+ Falta», «Dia extra» e «Autorizar» quando o Extrato não chegou: "Não consegui trazer o Extrato de reposições: o banco recusou a leitura (permissão)", ou o texto do banco em inglês | Na recusa, **"…: o sistema recusou a leitura."**; nos outros casos, o motivo pelo tradutor: com o banco fora do ar ("unavailable…"), **"a conexão com o banco caiu"**; com o pedido grande demais ("too_big…"), **"a leitura ficou grande demais"** (na gravação, "a gravação ficou grande demais", com "Avise a Gestão"). O resto da frase não mudou |

- **O que fica guardado como veio:** o que vai para o banco (`planilha_msg`, `cancelado_planilha_msg`, `_erro.msg`, o `msg` do banho de quem faltou), os retornos e a auditoria continuam com o texto cru — a Gestão diagnostica pela Linha do tempo, e as regras da fila e da coluna que falta leem o cru. O app só traduz na hora de mostrar. A palavra-chave da ponte nunca aparece (•••).
- **Decisão de execução da 2ª rodada (REQ-002):** a linha do crédito em Reposições só promete "o app tenta de novo sozinho" com a mesma prova do cartaz (este aparelho com a conferência ligada, ou a conferência de hoje há menos de 10 min, lida antes do toque — o horário que o próprio toque regrava não vale); o botão é «Mandar agora» também depois da falha.
- **Decisões aplicadas pela recomendação (podem mudar):** F1 — esta é a 1ª entrega. K22 — "o sistema recusou a gravação" + "Avise a Gestão." (alternativa: "o banco recusou (sem permissão)" + "Tente de novo; se repetir, avise a Gestão."). Perguntas abertas: ER1 (ligar a conferência automática também ao abrir Reposições — recomendado: não agora) e ER2 (o texto da recusa — recomendado: manter).
- **Não mudou:** as frases da 6.12 (a linha do automático nos Lançamentos do dia, na queda: "a conexão com a planilha caiu; o app tenta de novo sozinho em até 10 min"; a do crédito em Reposições continua igual quando há alguém conferindo); as frases da 6.46 para a conexão que cai no meio em Reposições; a área protegida (`ck*`, `ckt*`, `pt*`, `#v-daycare`, `pendAvisarChegada`: 155 funções idênticas) e as pontes compartilhadas (`tgAvisar`, `tgAvisarAlteracao`, `dashPonteChamarJa`, `dashEspelhar`, `dashAutoSincronizar`, `orcPonteMotivo`, `_logFalhaGrav`, `audit`: idênticas). Ficam para a 2ª entrega: Check-in e Check-out da hospedagem, Hóspedes de hoje, Plantão da noite, o resto do Hoje na Zêluz, Vencimentos, Prevenção, Banhos recorrentes, Peso, Cadastro, Pesquisa, Relatórios, Quem não comeu hoje, Configurações e os painéis — e, das versões publicadas depois, o desfazer do lançado por engano no Day Care (6.56: a ocorrência, o chamado de comida e a diária avulsa) e o banho na saída (6.52).
- **Onde está no código** (`auaulandia/index.html`): novas — `zErroBruto`, `zErroOrigem`, `zErroSemInternet`, `zErroTipo`, `zErroMotivo`, `zErroFrase`, `zErroInicial`, `zErroAcao`, `zErroTexto`, `zErroGrav`, `zErroAviso`, `dashPonteToken`, `repConferenciaViva`, `repConferenciaVivaJa`, `repPlanQuedaSemPromessaTexto`, `zErroSalvouTexto`, `repNaoFoiLinhas`, `repUsarFalhou`, `dashLancarFalhou`, `dashReenviarRefaz`, `orcEhComposicao`, `orcPlanilhaCaiu`, `orcPlanilhaMotivo`; alteradas — `repPlanEhQuedaConexao` (passa a usar `zErroTipo`), `repPlanLinhaHTML`, `repMandarAgora`, `repConfirmar`, `repDesmarcar`, `repUsar`, `repEstornar`, `repConferirVisto`, `repContarNaoVeio`, `repConferirNaoContar`, `repVeioNoDia`, `repDevolverUso`, `repDevolverDesfecho`, `dxConfirmar`, `dxLancarAvulso` (três estados: já estava, falhou, entrou), `dxPedir`, `vagasAutorizar`, `vagasRecusar`, `repFichaExtrato`, `dashReenviar`, `dashAutoBotao`, `dashAutoLinhas`, `dashLancar`, `dashRepAbater`, `dashRemover`, `dashRemoverRepForaPrazo`, `pernGravarDoLancamento`, `pernConferirNoite`, `pernMarcarCheckinFeito`, `pernCancelar`, `dashSalvarPonte`, `dashCriarColunas`, `banhoDiaDepois`, `banhoDiaDepoisTarde`, `dashTvPorDeNovo`, `dashBanhoFixoACaminhoTexto`, `banhoFaltaSemRegistro`, `banhoFaltaManter`, `banhoFaltaExecutar`, `banhoFaltaCardHTML`, `banhoFaltaEstaAqui`, `banhoFaltaDesfazerAqui`, `orcPlanilhaHtml`, `orcLinhaHistoricoHtml`, `orcEnviarPlanilha`, `orcTirarDaPlanilha`, `orcCancelar`, `orcSalvar`, `orcSalvarEdicao`, `orcSalvarSheets`, `orcTestarSheets`, `orcSalvarPrecos`, `repExtratoEsperaTexto` (3ª rodada).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (**1.212** no total, 0 falhas, em UTC e no horário de São Paulo, sobre a 6.52 publicada; 48 da 6.48, com dado inventado e relógio fixo — 47 falham na versão publicada; 5 provas antigas ajustadas: as 3 previstas na story, a da 6.12, pela decisão do REQ-002, e a «6.46 R11», pela trava do Extrato). A varredura do erro cru ficou mais larga: acha também «(e && e.message)», «String(e)», «e.toString()», «(e+'')», «e['message']», «JSON.stringify» da resposta, o «.motivo» de uma resposta, o erro dentro de um array (também o montado com «push») e a variável que guardou o cru — as 15 formas que o QA plantou são pegas; a gravação no banco é a única coisa que ela deixa de ler. As funções novas da 6.56 e da 6.52 estão classificadas (o texto do próprio app à parte, com o porquê), e o «.motivo» que é dado (o motivo que a pessoa escreveu) fica congelado à parte. Defeitos plantados: os 90 do @dev e os 50 do QA, todos pegos. Harness com retrato sintético: **3868 ok, com as mesmas 17 falhas do master** (2 checagens ajustadas: o texto-fonte do `dashLancar`, a prevista, e o nome do botão da linha do crédito, pela decisão do REQ-002). Área protegida e pontes compartilhadas idênticas à versão publicada. Chromium a 375 px (dado inventado): as três telas e o cartão do banho, a linha do crédito com e sem a conferência, o «Dia extra» recusado, o «Salvar a ponte» e a trava do Extrato com o banco fora do ar, sem rolagem lateral e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-10) — Banho do hospedado: o banho na saída vai para o dia da saída, com alerta de hora, e o banho fixo sai dos dias da estadia

> Adriana, 09/out/2026 (quadro de pedidos, linha 85): *"Rafael e Theo estão hospedados e por isso não tomarão banho hoje e sim na terça quando vão embora. Se eu marcar no check-in de hospedagem que terá banho no final — esse banho pode ir para o dia de saída, mas faltará o horário muitas das vezes e terá que pedir um alerta para o consultor verificar o horário depois, para lançar no dashboard."* (Story 6.52 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BE) Check-in da hospedagem › «Banho na saída?»; Lançamentos do dia › Banho; Hoje na Zêluz

| Antes | Agora |
|---|---|
| «Banho na saída? Sim», com a hora, ficava só na ficha da estadia e no PDF: não ia para a planilha, nem para a TV, nem para os Lançamentos do dia | **O banho vai para a planilha do dia da saída** (coluna Banho, com a Hora Banho), pelo mesmo automático do banho fixo, e aparece na TV e nos Lançamentos do dia daquele dia com o selo **«automático · banho de saída»**. Na planilha e na TV ele se lê "Theo/Golden (BANHO DE SAÍDA · HIDRATAÇÃO)" (o «Qual banho?» do check-in vai junto, quando foi escrito). Se a recepção já lançou o mesmo FILHOt à mão naquele dia, vale a linha dela: nada de banho em dobro |
| «O tutor ainda não sabe a hora que chega — deixar a confirmar» não avisava ninguém | **O alerta:** do último dia em que a casa abre antes da saída até o dia da saída (a véspera; se a véspera é domingo ou feriado, o dia aberto antes dela — a saída na terça 13/10, com a segunda 12/10 feriado e o domingo fechado, avisa desde o **sábado 10/10**), o Hoje na Zêluz e o alto dos Lançamentos do dia mostram **«Banho de saída sem hora: Rafael, terça 13/10 — definir a hora»**. Tocar em «definir a hora» abre ali os horários prontos (de 15 em 15 minutos, até 17:30, e "outro horário") e o botão «Definir 13/10 às 14:30». A hora vai para a estadia, o alerta some e o banho entra na planilha na conferência seguinte (a fila de 20 s). Sem hora, o banho **não** vai para a planilha |
| No check-in novo, «Banho na saída? Sim» vinha com a hora da última hospedagem (pré-preenchida da estadia anterior) | **A hora do banho de saída não vem da vez passada:** o check-in novo continua trazendo da última hospedagem o «Sim» e o «Qual banho?», mas a hora fica **«a confirmar»** — e o alerta pede a hora na véspera da saída. O resto que vem preenchido da última estadia continua vindo. «Corrigir» a mesma estadia continua mostrando a hora dela |
| A hora definida ia junto quando a saída mudava (a hora de terça ia sozinha para a sexta) | **A hora é de uma saída:** mudou a data da saída (na aba Hóspedes ou no «Corrigir»), a hora volta a **«a confirmar»** e o alerta pede de novo, lembrando a de antes: «Banho de saída sem hora: Theo, sexta 16/10 (a saída mudou: a hora era 15:00, para 13/10) — definir a hora». O painel já vem com a hora de antes escolhida: um toque em «Definir 16/10 às 15:00» confirma. Até lá, nada vai para a planilha do dia novo (o do dia antigo sai). Se a saída volta para a data da hora (13 → 16 → 13, na aba Hóspedes), a hora volta a valer |
| A saída num domingo ou feriado ia para a planilha de um dia em que a casa não abre | **Saída em dia fechado:** o banho de saída não vai sozinho para a planilha (o que já estava escrito sai). O alerta, no mesmo lugar e desde o último dia aberto, diz **«Banho de saída: Theo, domingo 11/10 — a saída é num dia em que a casa está fechada: combinar o banho»** (no feriado, com o nome dele), com «tirar» para o aviso sair depois de combinado; o cartão Banho daquele dia mostra "Banho de saída em dia fechado" |
| O check-out no próprio dia da saída mantinha o banho, mesmo feito de manhã, antes da hora do banho (o alarme da TV tocava por quem já tinha ido embora) | **Check-out antes da hora do banho tira o banho** (ele foi embora antes): sai da planilha e da TV na conferência seguinte. Check-out na hora do banho ou depois: o banho fica (aconteceu). A recepção pode lançar à mão se ele tomou banho antes de ir |
| — | No cartão Banho do dia da saída: **"Banho de saída sem hora"** (com «definir a hora» e «tirar»), **"Banho de saída que o automático ainda não confirmou"** (a hora acabou de ser escrita; vai na próxima conferência) e **"Banho de saída que não vai para a TV"** (o tirado, com «pôr de volta») |
| A data da saída mudou, a hospedagem foi cancelada ou o «Banho na saída» virou «Não»: nada acontecia (não havia nada na planilha) | **O banho acompanha:** sai do dia antigo da planilha (só a célula que o app escreveu; o que uma pessoa escreveu fica) e vai para o dia novo. Cancelada, excluída (a exclusão da hospedagem grava "cancelada") ou «Não»: sai. Check-out ou baixa no dia da saída: o banho fica (ele aconteceu). Check-out antes do dia da saída e saída antecipada: sai do dia da saída |
| O banho fixo continuava caindo nos dias em que o FILHOt estava hospedado; era preciso tirar dia a dia («tirar só este dia», 6.50) | **Com «Banho na saída? Sim», o banho fixo sai dos dias da estadia:** da entrada até a véspera da saída ele não vai para a planilha nem para a TV, e no dia da saída vale o banho de saída — **um banho só**. Nos Lançamentos do dia ele aparece em "Banho fixo de hoje que não vai para a TV" (e "Banho fixo de 12/10 que não vai para a TV", num dia à frente) com **«hospedado — banho na saída em 13/10»**. O que já estava na planilha (escrito antes do check-in) sai na próxima conferência («— sai da planilha e da TV na próxima conferência, em instantes»). O Hoje na Zêluz não anuncia mais "banho hoje (fixo)" de quem está hospedado com banho na saída. **Com «Não», o banho fixo continua nos dias dele** |
| — | **A linha do banho de saída tem «tirar» e «mudar a hora»** (como o banho fixo, 6.50). «tirar» pergunta antes ("Tirar o banho de saída de Theo de 13/10?"), grava na estadia e a linha vai para "Banho de saída que não vai para a TV", com «tirado (por quem, quando)» e **«pôr de volta»**. O «tirar» vale para aquele dia de saída: se a saída mudar, o banho vai para o dia novo. «mudar a hora» abre os mesmos horários prontos; a planilha recebe a hora nova na conferência seguinte |
| — | **Quem pode:** quem pode tirar um lançamento à mão nos Lançamentos do dia (a recepção, a Supervisão, a Gestão e a Diretoria, e quem recebeu a tela no Time). Quem não pode vê o alerta e as linhas, sem os botões |
| — | **Rastro:** cada mudança entra na auditoria («banho-saida»), com o FILHOt, o dia, a estadia, quem e quando: "Rafael — definiu a hora do banho de saída de 13/10/2026: 14:30 (no Hoje na Zêluz)", "Theo — tirou o banho de saída de 13/10/2026 (nos Lançamentos do dia)", "… pôs de volta …", "… mudou a hora … de 15:00 para 16:00 …". A estadia guarda quem definiu a hora (`hora_por`) e quem tirou (`tirado`) |

- **Como é gravado:** numa transação só no banho da estadia (`auaulandia/estadias/{id}/ficha/spa`): `horario` + `aConfirmar:false` + `hora_por:{quem, ts, de}` ao definir ou mudar a hora; `tirado:{dia, quem, ts}` ao tirar. A transação lê o banco: se o «Banho na saída» foi desmarcado em outro aparelho, nada é gravado e a tela avisa. Sem rede, o mesmo aviso de 6 segundos da 6.50. «Acrescentar» e «Corrigir» no check-in (que regravam a ficha inteira): **o banho é juntado campo a campo: da tela, vale só o que a pessoa mudou nela** (o «Sim/Não», o «Qual banho?», a hora); o resto vem do banho que está no banco, relido na hora de salvar — a hora definida em outro aparelho depois de a tela abrir não se perde, e o banho não sai da planilha (2ª e 3ª rodadas do QA). Quem escreve só o «Qual banho?» grava o «Qual banho?» e fica com a hora do banco (a planilha troca o texto e mantém a hora). Desmarcar «a confirmar» sem escrever a hora não é hora nova. Mudar o «Sim/Não» leva o banho da tela inteiro. O «tirar» e quem definiu a hora ficam; o histórico da correção diz só o que a tela mudou. A hora escrita no check-in leva o dia da saída (`horaDia`). Ficha antiga (de antes do «Banho na saída» ganhar a caixa própria, 24/set/2026, só com `ficha.banho`): «definir a hora» grava (a caixa nasce na ficha, numa transação nela).
- **Dois aparelhos:** o painel aberto em B quando A grava a hora continua aberto e diz «Nina, quarta 14/10: a hora foi definida em outro aparelho: 11:00.», com «Agora está às 11:00.» e «Mudar 14/10 para 16:00» (a escolha de B não some calada); se A tirou, diz que foi tirado e oferece «Fechar». B relê o registro do automático do dia na tela 35 s e 95 s depois de ver a mudança, e a linha deixa de dizer "sai da planilha na próxima conferência" quando a conferência de A já passou. Só as hospedagens com «Banho na saída? Sim» contam: o check-in, o check-out e as datas de quem não tem banho de saída não redesenham a tela nem pedem releitura.
- **Sem as hospedagens lidas no aparelho** (a leitura ainda descendo, ou falhou), o automático desse aparelho não tira nem troca pelo banho fixo o banho de saída que o app já escreveu; o aparelho que tem as hospedagens confere de novo na passada seguinte.
- **Aplicado pela recomendação (pode mudar):** **BS1** — no check-in novo, a hora do banho de saída **não** vem da última hospedagem: fica «a confirmar», e o alerta pede a hora (o pedido da Adriana: "faltará o horário muitas das vezes e terá que pedir um alerta"). Sem isso, a hora da vez passada iria sozinha para a planilha e para a TV. **BS2** — fica como está: quem faz check-out antes da saída combinada (ou tem saída antecipada) perde o banho de saída (sai da planilha e não vai para o dia em que foi embora), porque ele já foi embora e o banho não vai acontecer no dia combinado; se tomou banho antes de ir, a recepção lança à mão. **BS3** — a hora é de uma saída: a saída mudou, a hora volta a «a confirmar» (a mesma razão do BS1: uma hora que ninguém conferiu não vai sozinha para a planilha). **BS4** — check-out no próprio dia da saída, antes da hora do banho: o banho sai, como no BS2.
- **Não mudou:** o banho lançado à mão (com o «tirar» de sempre), o banho fixo de quem não está hospedado (e o «tirar só este dia» da 6.50), o sábado, a identidade pela ficha e "na planilha que a TV lê" da 6.49, o Banho de quem faltou, as outras colunas do automático, a contagem das vagas, a tela do check-in da hospedagem (as mesmas perguntas), o PDF, o check-in do corpo, os pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`.
- **Onde está no código** (`auaulandia/index.html`): novas — `banhoSaidaHospLidas`, `banhoSaidaMapaPel`, `banhoSaidaPel`, `banhoSaidaDe`, `banhoSaidaDeSemTexto`, `banhoSaidaComTexto`, `banhoSaidaNomePlanilha`, `banhoSaidaTexto`, `banhoSaidaEhTexto`, `banhoSaidaNome`, `banhoSaidaDiaTexto`, `banhoSaidaDoDia`, `banhoSaidaTiraOFixo`, `banhoSaidaMotivoFixo`, `banhoSaidaDaLinha`, `banhoSaidaAlertas`, `banhoSaidaAlertaTexto`, `banhoSaidaBotao`, `banhoSaidaAlertaHTML`, `banhoSaidaAcoesHTML`, `banhoSaidaCartaoHTML`, `banhoSaidaHoraPainelHTML`, `banhoSaidaRedesenhar`, `banhoSaidaHoraMexeu`, `banhoSaidaAssinatura`, `banhoSaidaEstadiasMudaram`, `banhoSaidaAchar`, `banhoSaidaTx`, `banhoSaidaGravar`, `banhoSaidaDepois`, `banhoSaidaDepoisTarde`, `banhoSaidaTirar`, `banhoSaidaPorDeVolta`, `banhoSaidaHoraAbrir`, `banhoSaidaHoraFechar`, `banhoSaidaMudarHora`, `banhoSaidaGuardarNaCorrecao`, `banhoSaidaSemRastro`, `banhoSaidaSemHoraDaVezPassada`; da 2ª rodada — `banhoSaidaHoraDia`, `banhoSaidaHoraLocal`, `banhoSaidaDiaFechado`, `banhoSaidaAlertaDesde`, `banhoSaidaHoraVelhaTexto`, `banhoSaidaReleRegistroDepois`, `banhoSaidaTelaIntacta`, `banhoSaidaNaGravacao` e `ciBanhoDaTela` (o banho da tela do check-in, que o `ciColetarFicha` usa); mudadas (uma ou poucas linhas cada) — `dashAutoCalcular` (B1 e o banho de saída), `dashAutoSincronizar` (as hospedagens não lidas), `dashAutoLinhas`, `dashTvBanhoLinhas`, `dashBanhoFixoMotivo`, `dashBanhoFixoClassificar`, `dashBanhoFixoPuladosHTML`, `banhoRecFraseDia`, `renderDash`, `hojeRender`, `dashHoraAplicar`, `dashHoraAbrirOutro`, `_cfIndexarEstadias`, `__ciGravar` (a regra do M1 e do BS3, `banhoSaidaNaGravacao`), `ciDiffCorrecao`, `ciPreencherUltimaEstadia` (o check-in novo passa a última estadia por `banhoSaidaSemHoraDaVezPassada`, que tira só a hora do banho de saída, numa cópia), `ciColetarFicha` (o banho da tela por `ciBanhoDaTela`), `ciAplicarEstadiaNaFicha` (o retrato do banho com que a tela abriu, `CI_SPA_ABRIU`) e `ciEscolher` (zera o retrato). `tests/harness.js`: a conferência v-48 conta 4 chamadores da fila de 20 s (o novo é `banhoSaidaGravar`).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` — **1027 no total, 0 falhas** (o mesmo em `TZ=America/Sao_Paulo`; 987 da versão -07 + 40 da 6.52): P1 a P14 (a P14 é a do BS1), as 10 da 2ª rodada ("6.52 R2": A1 com os feriados de verdade, B1, BS3, BS4, M1, B2, B6 e todas as gravações com a transação do Firebase de verdade), as 9 do QA ("6.52 QA", G1 a G9) e mais uma com os outros defeitos do QA, as 3 do re-gate ("6.52 QA2", G10 a G12) e as 3 da 3ª rodada ("6.52 R3": a junção campo a campo, 13 → 16 → 13 e o retrato só com o «Sim»). Relógio fixo em 09/10/2026 e dado inventado (Rafael e Theo, tutores "Teste"). Defeitos plantados: **142, todos pegos** — os 62 da 1ª rodada, os 27 da 2ª, os 48 do re-gate do QA e 5 novos da 3ª rodada. Harness com retrato sintético: 3868 ok, as mesmas 17 falhas de sempre; área protegida idêntica. Chromium a 375 px (e 1280 px), feriados de verdade, Firebase, planilha e ponte de mentira: o alerta no sábado, o «Acrescentar» que não apaga a hora e o painel que acompanha em dois aparelhos, sem rolagem lateral e sem erro de página.
- **Publicação (condição):** depois do Merge, **recarregar todos os computadores e celulares (a faixa de versão no topo)**, de preferência fora do horário de banho. Um aparelho ainda na versão anterior não sabe do banho de saída: na conferência dele, tira da planilha o banho de saída que o novo pôs e põe de volta o banho fixo nos dias da estadia (o novo desfaz na passada seguinte, e a TV pisca) até ele recarregar. As hospedagens que já estão com «Banho na saída? Sim» e hora passam a ir para a planilha do dia da saída logo na primeira conferência da versão nova. O BS1 vale para o check-in feito na versão nova: a hospedagem aberta antes, com a hora trazida da vez passada, vai com essa hora — vale a recepção conferir, na publicação, a hora das hospedagens em curso com «Sim».

## O que mudou em 09/out/2026 (v 2026-10-09-09) — Desfazer o lançado por engano no Day Care: a ocorrência do Tonico, o chamado de comida e a diária avulsa

> Quadro de pedidos, linha 27 (*"Desfazer o que foi lançado por engano, com senha: check-in errado da Frida e ocorrência do Tonico"*) e linha 87 (*"Preciso que tudo no app possa ser excluído, modificado, alterado."*). Auditoria de 09/out/2026 (`docs/zeluz/auaulandia/auditoria-editar-excluir-2026-10-09.md`), entrega S1, achados B04, B06 e A05, **só a parte fora da área protegida**. Decisão 1 da auditoria aplicada pela recomendação: o que mexe em dinheiro ou já saiu para um grupo pede a senha da Gestão; o resto, a senha da própria pessoa. O lado da estadia (caso Frida) é a 6.53. (Story 6.56 — 4ª rodada, sobre a 6.53 publicada; aguardando o novo QA.)

### (BF) Pendências com o tutor › Ocorrências do Day Care e Perguntas do Day Care; Day Care › Chamada

| Antes | Agora |
|---|---|
| A ocorrência do Day Care lançada por engano (o Tonico) só tinha 4 desfechos («Avisei o tutor», «Levei à veterinária», «Estou acompanhando», «Sem intervenção necessária»). Ficava na fila da Recepção, no quadro «Ocorrências sem desfecho» da Mesa, no Dashboard da Supervisão e nos problemas do dia do Painel da Operação | **«Lançada por engano»** no cartão (aberto ou já resolvido). Pergunta antes: «Ela sai da fila, das contagens e da Mesa. Nada é apagado: fica riscada, com quem, quando e o motivo. Se ela já foi a um grupo do Telegram, o mesmo grupo recebe uma linha de correção. O tutor não recebe nada.» Pede o motivo (pelo menos 4 palavras; se faltar, pergunta de novo e diz quantas faltam) e a **senha da Gestão**. Sai da fila, da Mesa, do Dashboard da Supervisão e do Painel da Operação, e fica **riscada** na gaveta «Lançadas por engano (N)», no fim da lista, com quem, quando, o motivo e o que foi mandado ao Telegram |
| A ocorrência já tinha ido aos grupos de Urgências e da Veterinária, e nada a desmentia | **O mesmo grupo recebe uma linha:** «Correção: a ocorrência de Tonico de 09/10, 08:15, foi lançada por engano — Gestora». Só vai ao grupo que recebeu a ocorrência (a trava do dia do check-in). Nenhuma mensagem ao tutor. Com duas ocorrências do mesmo FILHOt no dia, o grupo só viu a primeira: anular a que ele **não** viu não manda nada («o grupo só recebeu a de 08:15»); uma outra **de texto diferente** não cala a correção, e a tela da Gestão diz «A ocorrência "check-in de entrada: Olhos: secreção" (09:20) não foi ao grupo»: a Gestão decide se manda à mão. **Ponto e alerta:** se tudo o que o grupo viu (cada ponto com cada alerta do check-in, como «Pele: vermelhidão») continua numa ocorrência válida do dia, nada sai e a tela diz onde continua valendo; quando a que continuava valendo é anulada depois, a conta é refeita e a correção sai (ou a Gestão escolhe, se só parte continua); se **só parte** continua, nada sai sozinho: antes de mandar, um cartão mostra o que o grupo viu, o que continua valendo e o que deixa de valer, e a Gestão escolhe **«Mandar a correção»** (a linha termina com «Continua valendo: Pele: vermelhidão») ou **«Não mandar»** |
| — | **Desfazer (senha da Gestão):** a ocorrência volta como estava (aberta, ou resolvida com o desfecho de antes), e a anulação fica guardada na trilha. Se o grupo tinha recebido «foi lançada por engano», recebe «Correção: a ocorrência de Tonico de 09/10, 08:15, vale de novo: não foi lançada por engano — Gestora» |
| **«Reabrir» não fazia nada:** escrevia num lugar da hospedagem que não existe, e a ocorrência continuava resolvida | **«Reabrir» reabre:** pede o motivo e a **senha da própria pessoa** (Consultora de Bem-Estar, Supervisão ou Gestão). A ocorrência volta para a fila, sem desfecho; o desfecho de antes fica na trilha do cartão («Reaberta por Bia: "a tutora ainda não respondeu". Desfecho de antes: …») |
| O check-in salvo de novo criava a mesma ocorrência outra vez, sem aviso | A segunda (mesmo FILHOt, mesmo dia, mesmo texto) diz **«Já existe: a mesma ocorrência de Tonico foi registrada às 08:15 (o check-in foi salvo de novo). Se esta é a repetida, toque em «Lançada por engano».»** A repetida anulada não manda correção ao grupo enquanto a original vale |
| A resposta da Recepção ao Day Care era assinada com o nome digitado («Seu nome») | **A resposta é assinada com a senha da própria pessoa** (campo com o rótulo «Sua senha» e a dica «A sua senha assina a resposta: o app grava o seu nome, nunca a senha»), como na correção da hospedagem: o app grava o nome do cadastro, nunca a senha. Senha de posto («Recepção») não assina. Se outra pessoa já respondeu, ou o chamado foi cancelado, a tela diz e nada é gravado |
| O chamado de comida respondido não se corrigia: a resposta e a comida de hoje ficavam até a virada do dia | **«Corrigir a resposta»:** os campos abrem com o que está escrito (a resposta, «O quê», «Quanto»), pede o motivo e a senha. Antes de gravar mostra o antes e o depois. **Quem assinou a resposta com a própria senha corrige no mesmo dia; depois disso, ou outra pessoa, só a Gestão** (a resposta antiga, de nome digitado, só a Gestão corrige). O antes fica na linha do chamado («Corrigida por … Antes: «…»»). A tarja «SÓ HOJE» do Almoço passa a mostrar a comida nova; apagar «O quê» tira a comida de hoje do Almoço. O nome do FILHOt volta a piscar na tela dos pertences |
| O chamado aberto por engano (a comida apareceu) só saía respondendo qualquer coisa; o alerta «Day Care chamando» ficava na Mesa | **«Foi engano — cancelar o chamado»** (e «Cancelar o chamado (foi engano)» no já respondido): motivo e a senha da própria pessoa. Fica riscado («CANCELADO — Cancelado por Carla em 09/10 10:05 — "a comida estava na mochila dela"»), sai da Mesa, e o Day Care lê «Foi engano, chamado cancelado: …» e para de esperar (o Almoço deixa de dizer «NÃO TROUXE COMIDA»). A comida de hoje que veio da resposta sai do Almoço |
| A diária avulsa lançada por engano ficava o dia inteiro na Chamada, no Check-in, nos Pertences, no Almoço e nas contagens; só o Claude apagava | **«Tirar a diária avulsa»** no cartão do avulso de hoje, na Chamada. Antes de confirmar, diz o que sai e o que fica: a turma de hoje; os Lançamentos do dia e o **Financeiro** (com o valor, «R$ 120,00»); a planilha e a TV (só a célula que o app escreveu); o que está escrito à mão na planilha (o app não tira); o check-in do corpo e a marca da Chamada, que continuam. Pede o motivo e a **senha da Gestão** (é dinheiro). A diária fica riscada no alto da Chamada, em «Diárias avulsas tiradas hoje (N)», com quem, a hora e o motivo |

- **Nada se apaga.** A ocorrência ganha `anulada` (motivo, quem, papel, quando, o estado de antes e o que foi mandado ao Telegram) e uma entrada na `trilha`; desfazer e reabrir também entram na trilha, com o «antes». O chamado guarda cada correção em `correcoes` (antes e depois) e o cancelamento em `cancelado` (com o antes). A exceção do almoço guarda a de antes (`antes`) e, retirada, fica com «O quê» vazio e `retirada`. A diária avulsa sai do nó vivo e fica **inteira** em `daycare/avulsos-anulados/{dia}/{origem}__{id}__{carimbo}` (o molde do `excluirCadastroPel`), no mesmo update; tirar a mesma diária duas vezes no dia guarda os dois registros. A senha é conferida e esquecida: o app grava o nome de quem assinou.
- **Quem pode (conferido na função que grava, não só na tela):** o aparelho precisa ser da Recepção (`corrigir-engano-dc`: Consultora de Bem-Estar, Supervisão, Gestão e Diretoria) para a ocorrência e o chamado; «Lançada por engano», o desfazer e «Tirar a diária avulsa» pedem a senha da Gestão (`gestao-role`). Senha de posto («Recepção», «Monitor 3») não assina. A diária avulsa sai só no dia de hoje.
- **O Telegram:** o grupo recebe uma mensagem por FILHOt, por dia e por origem (a trava do check-in): a da primeira ocorrência. A decisão olha o **estado dessa mensagem**, não o texto da ocorrência anulada: se a mensagem ainda vale, nada sai (a anulada é a repetida ou nunca foi ao grupo); se ela já foi anulada, conta o que o grupo ainda acredita (tudo dela; nada, se a correção já saiu; ou o «continua valendo» da correção parcial) e refaz a conta **por ponto e alerta**, sem a de agora: tudo continua, nada sai; só parte, a Gestão escolhe antes de mandar; nada, a correção sai (e, se uma correção parcial já tinha saído, a nova diz «Também não vale mais: …»). A correção que já saiu não sai de novo. Se, enquanto a Gestão responde, outro aparelho mexe nas ocorrências do mesmo FILHOt e a decisão muda, nada sai sozinho e a tela diz «confira à mão». Sem conseguir ler a trava ou as ocorrências do dia, nada sai sozinho e a tela diz «Não consegui conferir os grupos: confira à mão» (nunca «não tinha ido a grupo nenhum»). Já disse «foi engano», não repete; a ocorrência do mesmo texto volta a valer, sai «vale de novo». O texto fala da hora da mensagem que o grupo viu. Se a ponte cair, a linha entra na fila de reenvio de sempre.
- **O que pede conferência vem num cartão de atenção** (dourado escuro, sem o sinal de feito), nunca no verde de «pronto»: «não foi ao grupo… a Gestão decide se manda à mão», «não consegui conferir os grupos: confira à mão» e a escolha «Mandar a correção» / «Não mandar». No cartão riscado da gaveta, isso aparece numa faixa de atenção, abaixo do verde.
- **Duas telas ao mesmo tempo:** o desfecho da ocorrência, a resposta, a correção e o cancelamento do chamado leem e gravam numa transação só: a tela velha de outro aparelho não grava por cima da «Lançada por engano», de um chamado cancelado ou de uma resposta já dada.
- **A planilha (regra da 6.49):** só sai a célula que o app escreveu e confirmou («planilha_ok»). Sem a confirmação, ou com o mesmo texto em outro lançamento de hoje (o xará), a célula fica e a tela diz «tire à mão».
- **Perguntas à Adriana (não travam):** **EN1** — o botão «Lançada por engano» também no Painel da Operação e no Dashboard da Supervisão? Recomendado: não; esses painéis só observam (regra da casa), e o toque na linha já abre a Recepção. **EN2** — liberar a área protegida para o resto da S1 (avisar «já existe» antes de gravar no check-in, cancelar o chamado do lado do Day Care, anular exame e pertences, «Não veio hoje» depois do check-in, voltar um passo na trilha)? Recomendado: sim, numa story própria. **EN4** — «Tirar a diária avulsa» ganha «pôr de volta»? Recomendado: não por enquanto (lançar de novo resolve). A **EN3** (a resposta do chamado assinada com a senha) foi aplicada pela recomendação nesta versão: muda a rotina da Recepção (a senha a cada resposta ao Day Care, só num aparelho da Recepção); se a Adriana preferir, dá para voltar ao nome digitado.
- **Fora desta versão (área protegida, decisão 2 da auditoria):** o aviso «já existe» antes de gravar, no Salvar do check-in do corpo (`ckSalvar`); cancelar o chamado do lado do Day Care (`pt*`); anular exame do corpo e pertences; «Não veio hoje» depois do check-in; voltar um passo na trilha. O texto fixo da tela dos pertences («Pegue na recepção e siga com a rotina dele.») continua depois do «Foi engano, chamado cancelado». Depois de «Tirar a diária avulsa», a marca «veio» da Chamada e as contagens que leem a Chamada direto continuam (EN2). O «tirar» dos Lançamentos do dia (`dashRemover`) ainda apaga a avulsa com valor sem a senha da Gestão e sem arquivo (fica para a S9).
- **Não mudou:** a ocorrência da hospedagem e o «Reabrir» dela; os 4 desfechos; responder ao Day Care; a Chamada, o Check-in do corpo, os Pertences e o Almoço de quem não foi tirado; o «tirar» dos Lançamentos do dia; check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*` (sonda: «nenhuma diferente», «#v-daycare idêntico: true»).
- **Onde está no código** (`auaulandia/index.html`): novas — réguas comuns: `motivoQuatroPalavras` é a da 6.53 (uma só no arquivo), `enganoAssinar`, `enganoChave`, `enganoPedirMotivo`, `enganoPedirSenha`, `enganoLer`; ocorrência: `ocorrDcAnular`, `ocorrDcDesfazerEngano`, `ocorrDcReabrir`, `ocorrDcEnganoAbrir`, `ocorrDcDesfazerAbrir`, `ocorrDcReabrirAbrir`, `ocorrDcGruposAvisados` (decide pelo estado da mensagem que o grupo viu, por ponto e alerta), `ocorrDcUnidadesDe`, `ocorrDcUnidade`, `ocorrDcConjunto`, `ocorrDcCobre`, `ocorrDcOQueOGrupoCre`, `ocorrDcDecisaoChave` (a prévia × a gravação), `ocorrDcCobertura`, `ocorrDcTrazNovo`, `ocorrDcOndeTxt`, `ocorrDcContinuaValendo`, `ocorrDcParcialLinhas`, `ocorrDcAtencaoLinhas`, `enganoAtencao` (o cartão de atenção), `enganoEscolher`, `ocorrDcCrenca`, `ocorrDcDarDesfecho` (o desfecho por transação), `ocorrDcLinhaNaoFoi`, `ocorrDcChaveTelegram`, `ocorrDcTextoCorrecao`, `ocorrDcCorrigirNoTelegram`, `ocorrDcMarcarRepetidas`, `ocorrDcJaExiste`, `ocorrenciasDayCareAnuladas`, `ocorrDcAnuladasHTML`, `ocorrDcAnuladaCardHTML`, `ocorrDcTrilhaHTML` e auxiliares; chamado: `chamadoCorrigir` e `chamadoCancelar` (por transação), `chamadoRespondeuEla` (a identidade da senha), `chamadoExcecaoNova`, `chamadoGravarExcecao`, `chamadoEditar`, `chamadoCorrigirGravar`, `chamadoCancelarGravar` e os desenhos (`chamadoBotoesHTML`, `chamadoCorrecoesHTML`, `chamadoFormCorrigirHTML`, `chamadoFormCancelarHTML`, `chamadoCanceladoHTML`); diária avulsa: `avulsaTirar`, `avulsaTirarAbrir`, `avulsaFontesDoDia`, `avulsaTirarDaPlanilha`, `avulsaAMaoNaPlanilha`, `avulsaOQueFica`, `avulsaAnuladasCarregar`, `avulsaAnuladasHTML` e auxiliares; a capacidade `corrigir-engano-dc` na tabela PERM. Alteradas — `ocorrDayCareItem`, `ocorrenciasDayCare`, `ocorrCardHTML` (só o cartão do Day Care), `renderOcorrenciasRecepcao`, `ocorrResolver`, `ocorrReabrir` (o ramo do Day Care), `poProblemasDoDia`, `renderChamadosRecepcao`, `chamadoResponder` (assinada com a senha, por transação), `renderDaycare` e `carregarChamada`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` — **1062 no total, 0 falhas** (também em `TZ=America/Sao_Paulo`), sobre a 6.53 publicada: 75 da 6.56 (24 da 1ª rodada, 16 da 2ª, as 10 sondas R1 a R10 do re-gate do QA como «6.56 QA2», 8 da 3ª, as 11 sondas T1 a T11 da conferência final do QA como «6.56 QA3» e 6 da 4ª: anular a que o grupo viu e depois a que a cobria, nas duas ordens e somadas; a correção que já saiu não sai de novo; a prévia × a gravação; ponto e alerta; o «Desfazer» que devolve o que o grupo leu como engano), com relógio fixo em 09/10/2026 e dado inventado. Defeitos plantados: os do dev e os do QA (ver a story). Harness com o retrato sintético: 3868 ok e as mesmas 17 falhas de antes; área protegida idêntica à da 6.53 publicada (`bdb04b5`). Chromium a 375 px (Firebase, Telegram e planilha de mentira): 51 conferências, todas OK, sem rolagem lateral e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-08) — Quem chamar hoje: o contato que finaliza, para quem só se hospeda

> Adriana, 08/out/2026 (quadro de pedidos, linha 79): *"Quem só se hospeda (não é Aluno): não ficar cobrando; mostrar a mensagem enviada, o que o tutor respondeu, quantas vezes foi mandada, e finalizar («mandei 2, 3 vezes e não respondeu»)."* E, em 09/10: *"Preciso que tudo no app possa ser excluído, modificado, alterado."* As perguntas H1 a H7 foram aplicadas pela recomendação. (Story 6.55 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BD) Quem chamar hoje, Hoje na Zêluz, Vencimentos, Respostas pendentes, ficha › Com o tutor, Prevenção e Configurações — o contato com o tutor

| Antes | Agora |
|---|---|
| O app guardava quem marcou e quando, mas **não o texto** que saiu nem o que o tutor disse; o «Mandada — marcar de novo» **apagava** o registro do 1º envio | **Toda mensagem de prevenção que sai pelo app fica no histórico do FILHOt**, com quem, o dia, a hora, a tela e o **texto exato** aberto no WhatsApp (ou o da caixa, quando é «Mandei» à mão): «Mandar no WhatsApp» (Quem chamar hoje, Hoje na Zêluz, Vencimentos), «Mandei», «Cobrar no WhatsApp», «Cobrei», «Não respondeu», cada resposta (trocar a resposta é outro registro), o «desfazer» da resposta e o «Já avisei» da Prevenção. O «marcar de novo» não apaga o primeiro: o histórico tem os dois e a conta diz 2. Janela do WhatsApp bloqueada: nada é marcado nem registrado, como antes |
| A linha de «Não responderam» dizia "sem resposta há 2 dias · já cobrado 2 vezes" | A linha diz **«mandada em 06/10 às 14:10 por Ana · 2 cobranças (a última em 07/10 às 09:02) · 3 contatos»** — em Quem chamar hoje, nas Respostas pendentes e na faixa de cobrança do cartão de Vencimentos. «Contatos» = a mensagem mais as cobranças; os «não respondeu» continuam à parte. Para quem só se hospeda, a conta é da hospedagem inteira; para o Auluno, da conversa |
| A resposta do tutor era só o botão | Depois do toque na resposta aparece **«+ o que o tutor disse»** (até 1.000 letras), no cartão de Vencimentos, no Hoje na Zêluz e na ficha › Com o tutor; nas Respostas pendentes, a linha respondida some e o «+ o que o tutor disse» fica no alto por 10 minutos. A resposta continua em um toque |
| Não existia «encerrar sem resposta»; a cobrança voltava 3 horas depois de cada «Cobrei», sem limite | **«Finalizar»** em toda conversa mandada e sem resposta (Quem chamar hoje › «Não responderam — cobrar ou finalizar», Respostas pendentes, faixa do cartão, Hoje na Zêluz e Com o tutor; nunca na que não saiu). O painel mostra o histórico (o texto de cada mensagem ao tocar), quantos contatos e as três saídas: **«Respondeu e resolveu»**, **«Não quer»** (nas duas, o que o tutor disse é obrigatório) e **«Não respondeu — encerrar (3 contatos)»** (opcional). Sem saída, o botão fica desligado e diz o que falta. O painel diz quando o assunto volta. O assunto sai de todas as listas (Não responderam, Estão aqui hoje, Respostas pendentes, contador do menu, faixa «sem resposta do tutor»); a ficha não muda (o vencido continua vermelho) |
| — | Com **3 contatos** (número editável em Configurações), a linha **para de oferecer «Cobrar»** e mostra só «Finalizar»: «3 contatos sem resposta: o app parou de cobrar. Finalize a conversa.» |
| **Quem só se hospeda** recebia a mesma pergunta «fazer hoje?» em todo dia da estadia (7 noites, até 7 perguntas sobre o mesmo vermífugo), e continuava em «cobrar» por até 30 dias depois de ir embora | Vale para a categoria **Hóspede** e para o **Auluno Avulso** (H1). A pergunta sai **uma vez por hospedagem** (H2): nos dias seguintes, Estão aqui hoje e o cartão de hoje não perguntam de novo, e o bloco do Hoje na Zêluz mostra **a conversa daquele dia** — «Perguntado em 05/10, sem resposta — uma pergunta por hospedagem», com os botões de resposta e o «Finalizar», gravando no dia da conversa. Quem **já foi embora** com a conversa aberta (a conversa de dentro da hospedagem) mostra **«já foi embora em DD/MM»** e só «Finalizar» — a conversa de Day Care de quem um dia se hospedou não conta; o app não finaliza sozinho (H5). Finalizado, o assunto **só volta na próxima hospedagem**, se a ficha continuar devendo (H4). Ficha **sem categoria**, sem plano e sem dias, com hospedagem: tratada como hóspede, e a linha avisa «ficha sem categoria». O Auluno hospedado continua Auluno |
| — | **Auluno** (H6): finalizar encerra **só aquela conversa** — a pergunta «fazer hoje?» do mesmo assunto não volta no mesmo dia, e o assunto volta na véspera do próximo dia dele, se a ficha continuar devendo |
| — | **Desfazer o «Finalizar»** («desfazer» ao lado do desfecho, no cartão, no Hoje na Zêluz e em Com o tutor): no mesmo dia, quem finalizou; depois, a Supervisão, a Gestão e a Diretoria. Sempre com o motivo. Nada se apaga: o «Finalizar» e o desfazer ficam no histórico e no rastro |
| O calendário de Vencimentos contava como «respondido» todo assunto fechado; a aba Com o tutor escrevia «resolvido na ficha» para qualquer fechamento | O calendário tem a conta **«finalizado»** (cor própria) quando tudo fechou e ao menos um assunto foi pelo Finalizar; o selo do assunto diz «finalizado»; «resolvido na ficha» é só o que a ficha fechou, e o Finalizar aparece como «Finalizado por Ana em 08/10 às 17:40: não respondeu (3 contatos)» |
| — | **Configurações › Mensagens prontas:** campo **«Contatos antes de finalizar»** (padrão de fábrica 3, de 1 a 20), com botão próprio («Salvar este número»): grava em `daycare/config/contatos`, à parte das mensagens |
| A Prevenção › Hóspedes mostrava só «Tutor avisado em …» | Mostra também **a última conversa finalizada** («Última conversa finalizada em 07/10 por Ana: não respondeu (3 contatos) — vermífugo, carrapaticida e coleira»), e o «Já avisei» entra no histórico do FILHOt |
| A resposta que chega depois do dia da pergunta ia para «o próximo dia dele» no Day Care — para quem só se hospeda, no fim de semana ou no feriado, isso caía **depois da saída** | Para quem só se hospeda: com o FILHOt **hospedado hoje** (ou, sem hospedagem, na turma de hoje), o lançamento vai **para hoje**, e o bloco do Hoje na Zêluz diz **«Lançado para hoje, sábado (10/10): …»** e o porquê. **Se a hospedagem dele terminou** (foi embora, inclusive com check-out antes da saída marcada), **nada se lança**: a resposta fica registrada, o cartão diz «Resposta registrada. Nada foi lançado: no dia da resposta, o FILHOt não estava na Zêluz (a hospedagem terminou em DD/MM)», o «desfazer» continua (e diz só «A resposta «…» sai, e o assunto volta a esperar resposta») e a tela avisa «NADA FOI LANÇADO». O mesmo vale para «Pode aplicar hoje» da vacina: o recado da veterinária é para hoje; com a hospedagem terminada, não sai recado. **Quem não tem hospedagem nenhuma** (o Auluno Avulso que não veio hoje, a ficha que não é achada pela chave) e o Auluno seguem como antes: lança para o próximo dia dele e, se ele faltar, vira pendência sozinho (HB6) |
| Duas estadias seguidas (a nova começando no dia em que a anterior termina) eram duas hospedagens: a pergunta saía de novo | **Estadia emendada é a mesma hospedagem** (HB5): a pergunta não se repete e o dia da troca conta uma vez só. Sair e voltar no dia seguinte é outra hospedagem. O fim que vale é o efetivo: com o check-out antes da saída marcada, os dias depois dele não são mais daquela hospedagem (a conversa dela não soma os contatos da seguinte) |
| — | O **Finalizar** de quem só se hospeda fecha as conversas abertas **da mesma hospedagem** (nunca as de outra estadia). **Sem rede**, o painel do Finalizar fecha com o aviso «A GRAVAÇÃO CONTINUA» — a gravação termina sozinha quando a internet volta, sem gravar em dobro |

- **O banco:** novo `daycare/contatos-log/{chave}/{id}` — o histórico, que só cresce; lido **só do FILHOt aberto** (as últimas 300 entradas, ao abrir Com o tutor ou o painel do Finalizar), nunca inteiro; o texto das mensagens mora aqui, não em `daycare/vencimentos`. No registro do dia (`daycare/vencimentos/{dia}/{chave}`), só a lista `envios[assunto]` (`{quem, ts}`, cerca de 40 bytes por envio) e o `fechados[assunto]` com `via:'finalizar'` (desfecho, contatos, o id do histórico). O Finalizar grava tudo **numa atualização só** (os dias com conversa aberta e o evento); falhou, nada muda e a tela diz «NÃO consegui gravar». Antes de gravar, relê: finalizado em outro aparelho, recusa com «Já finalizado por Bia às 14:40». Novo `daycare/config/contatos`. `daycare/pendencias` não ganha nada. Regras v2 (`database.rules.v2.json`): o histórico é **só cria** (como a auditoria), com o texto até 4.000 letras e o que o tutor disse e o motivo até 1.000; com a v1 no ar, essa promessa é só do app. As estadias de cada FILHOt são lidas por um índice montado uma vez por leitura das estadias (não a cada desenho).
- **Decisões aplicadas pela recomendação (podem mudar):** H1 Hóspede e Auluno Avulso · H2 uma pergunta por hospedagem · H3 3 contatos, editável · H4 volta na próxima hospedagem · H5 quem foi embora só finaliza, o app não finaliza sozinho · H6 o Auluno também finaliza, só aquela conversa · H7 o que o tutor disse é obrigatório em «Respondeu e resolveu» e «Não quer» · HB5 estadia emendada é a mesma hospedagem · HB6 «nada se lança» só quando a hospedagem terminou; sem hospedagem, a regra de sempre. Quem pode finalizar: quem já fala com o tutor (Consultoras, Supervisão, Gestão, Diretoria e quem recebeu Hoje na Zêluz ou Quem chamar hoje no Time).
- **Perguntas à Adriana (não travam):** **HB1** — o hóspede recebe o «fazer hoje?» do Auluno ou o convite da Prevenção? (recomendado: o convite; hoje recebe o do Auluno). **HB2** — o «Já avisei» da Prevenção conta como a pergunta da hospedagem? (recomendado: sim, numa story à parte). **HB3** — quem recebeu a tela no Time também finaliza? (aplicado: sim; alternativa: só vê). **HB4** — «Respondeu e resolveu» pelo Finalizar não lança nada nos Lançamentos do dia nem muda a ficha (recomendado: manter; para lançar, use o botão de resposta de sempre). **HB5** — estadia emendada conta como a mesma hospedagem? (aplicado: sim; alternativa: cada estadia é uma hospedagem e a pergunta sai de novo). **HB6** — o Auluno Avulso que responde depois, sem estar na casa: lançar para o próximo dia dele (vira pendência na chegada, como antes) ou só avisar? (aplicado: lançar, como antes; «nada se lança» só para a hospedagem que terminou).
- **Limites:** aparelho com a versão anterior não grava o histórico nem a lista `envios` (a conta usa o registro de antes como piso, e a tela diz «Parte dos envios foi marcada sem o texto»); «mandou» quer dizer «abriu o WhatsApp com este texto» (o app não sabe se a Consultora tocou em enviar); estadia de mais de 30 dias pode receber a pergunta de novo (a conversa do 1º dia sai da varredura); sem as estadias lidas, o hóspede é perguntado como antes (o «Lendo…» vale para a varredura das conversas); o calendário ainda conta «a mandar» no cartão de hoje do hóspede já perguntado nesta hospedagem; um aparelho desatualizado pode cobrar depois de um Finalizar (fica no histórico); dois aparelhos marcando o mesmo envio no mesmo instante podem contar um envio a menos (o histórico tem os dois; a linha oferece «Cobrar» uma vez a mais), e dois aparelhos finalizando no mesmo instante deixam dois «finalizou» no histórico (fica o do último); sem as estadias lidas, a resposta tardia de quem só se hospeda segue a regra de sempre. À parte (de antes da 6.55, para outra story): o Auluno que responde «Pode aplicar hoje» no dia seguinte ainda avisa a veterinária com o dia que já passou. Da área protegida (não mexida): a turma do dia usa só a estadia mais recente — o hóspede com outra reserva já lançada pode sumir da turma de hoje.
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `turmaDoDia`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`; nenhuma mensagem nova ao tutor (as de Configurações › Mensagens prontas continuam as mesmas); o «Não respondeu» de sempre continua anotando a tentativa sem fechar; o estado de cada assunto (`vencEstadoTipo`) e o fechamento pela ficha (6.2).
- **Onde está no código** (`auaulandia/index.html`, bloco «QUEM CHAMAR HOJE — O CONTATO QUE FINALIZA»): novas — o perfil e as estadias `contatoPerfil`, `contatoEstadiasDe`, `contatoEstadiaChave`, `contatoEstadiaFim`, `contatoEstadiaDoDia`, `contatoJaFoiEmbora`; a conta `contatoListasReg`, `contatoContagemSoma`, `contatoContagemReg`, `contatoContagem`, `contatoDiasDe`, `contatoTiposDe`, `contatoResumoFrase`, `contatoPodeCobrar`, `contatoLinhaInfo`; o finalizado `contatoFinalizadoDe`, `contatoEstadoSelo`, `contatoResolvidoPelaFicha`, `contatoFinalizadoTexto`, `contatoVoltaTexto`, `contatoFinalizadoDados`, `contatoFinalizadoNoCartao`, `contatoUltimoDesfechoDe`; a hospedagem `contatoTratadoNaEstadia`, `contatoAntGrupos`, `contatoAntAberto`, `contatoHojeBlocoHTML`, `contatoResponderOutroDia`, `contatoCartaoEstadiaHTML`; as telas `contatoCartaoFaixaHTML`, `contatoSemCobrarHTML`, `contatoFinalizarBotaoHTML`, `contatoFinalizadoLinhaHTML`, `contatoPrevDesfechoHTML`, `contatoFichaConversaHTML`, `contatosFinalizar`; o histórico `contatoLogGravar`, `contatoLogCarregar`, `contatoLogEventos`, `contatoLogLimpar`, `contatoLogMem`, `contatoLogNovoId`, `contatoPrevAvisoLog`, `contatoEventoFrase`, `contatoEventoHTML`, `contatoEventosMemoria`, `contatoHistoricoJunto`, `contatoEventoEnvio`, `contatoEnviosCom`; a nota `contatoNotaLinkHTML`, `contatoRespUltHTML`, `contatoNotaAbrir`; o Finalizar `contatoPodeFinalizar`, `contatoFinalizarAlvos`, `contatoFinalizarMontar`, `contatoFinalizarValida`, `contatoFinalizarHistoricoHTML`, `contatoFinalizarPainelHTML`, `contatoFinalizarAbrir`, `contatoFinalizarDesenhar`, `contatoFinalizarEscolher`, `contatoFinalizarNota`, `contatoFinalizarFechar`, `contatoFinalizarConfirmar`, `contatoFinalizarFrase`, `contatoFinalizarPatch`, `contatoLerFechado`, `contatoFinalizarGravar`, `contatoMemFechados`, `contatoRedesenhar`; desfazer `contatoPodeReabrir`, `contatoReabrir`; a resposta tardia de quem só se hospeda `contatoLancarHospede`, `contatoNaTurmaDeHoje`, `contatoLancarForaDaEstadia`, `contatoDesfazerForaLinhas`; o índice das estadias `contatoEstIndice`, `contatoEstadiaNaLista`; `contatoEnvioAntigo`, `contatoRespostaMaoLog`; Configurações `contatoFinalizarApos`, `contatoFinalizarAposDe`, `contatoCfgCarregar`, `contatoCfgHTML`, `contatoCfgSalvar`. Alteradas — `vencMandei`, `vencWhats`, `vencCobrei`, `vencWhatsCobranca`, `vencResponderTipo`, `vencLancarAuto` (a resposta tardia de quem só se hospeda), `vencAutoLancadoHTML`, `vencLancarConfirmado` (o «respondeu» do escolher à mão), `vencDesfazerAuto` e `vencAutoDesmanchar` (o texto do «nada lançado»), `vencFecharAssuntosFazer` (guarda o desfecho quando a ficha fecha depois), `vencContagemDia`, `vencCalHTML`, `vencCartaoHTML`, `vencSeloEstado`, `vencCobrancaHTML`, `vencRespostasHTML`, `vencPendLinhaHTML` (o tutor passou a sair escapado), `vencPendListaHTML`, `hojeMandei`, `hojeWhats`, `hojeWhatsDireto`, `hojeAnteciparContagem`, `hojeAntBlocoHTML`, `hojeLista` (só as duas linhas de `antGrupos`/`antAbertos`), `contatosDados`, `vencMandeiNoDia`, `vencWhatsNoDia`, `vencCobrarNoWhats`, `contatosTocar`, `contatosLinhaHTML`, `contatosRender`, `fichaUnicaDados` (campos `finalizado`, `historico`, `historicoLido`), `fichaTutorRender`, `prevMarcarAvisado`, `prevBlocoHospedes`, `cfgVencRender`, `VENC_MAPAS_POR_ASSUNTO` (+ `envios`) e a tabela `PERM` (+ `desfazer-finalizar-contato`). Contrato para agentes: `contatosDados()` — cada linha ganha `perfil`, `semCategoria`, `contatos`, `ultimoContato`, `podeCobrar`, `jaFoiEmbora` (e `frase` na de cobrar, `lendo` na de aqui); `fichaUnicaDados(p)` — cada conversa ganha `finalizado {desfecho, rotulo, quem, ts, contatos, log, volta}` e, com o histórico lido (`historicoLido`), `historico[]`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (1.046 no total com a 6.53 e a 6.38 já publicadas, 0 falhas, também no fuso de São Paulo; 59 da 6.55, com relógio fixo e dado inventado: os 29 critérios da especificação, o caso da linha 79 só com o que a base já tem, C1, C14, C20 e C31 da crítica, 22 da 2ª rodada — os achados do QA independente e uma prova para cada defeito plantado por ele que escapava — 3 da 3ª rodada, do re-gate, e 1 da conferência final). Contra a versão publicada (`bdb04b5`), 58 delas falham (a da janela bloqueada já valia) e nenhuma outra. Defeitos plantados: os 44 do QA, 44 pegos; os do dev, 84 de 85 na 3ª rodada e os 2 novos da conferência final, 2 de 2 (1 equivalente, explicado na story). Harness: **3868 ok, com as mesmas 17 falhas do master**. Área protegida idêntica (155 funções ck/ckt/pt, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px (Firebase de mentira, dado inventado, relógio de São Paulo): o Tico (hóspede) com 3 contatos → «Finalizar — não respondeu» (o painel com o texto da 1ª mensagem ao tocar), sai de «Não responderam», o Hoje na Zêluz mostra a conversa da hospedagem finalizada, «desfazer» pede o motivo e devolve a conversa; a Mel (Auluno) finalizada não recebe o «fazer hoje?» no mesmo dia e volta na quinta, véspera da sexta dela; sem rolagem lateral e sem erro de página. Na 2ª rodada, também: sábado, «Pode fazer hoje — está na bolsa» do hóspede na casa lança para o próprio sábado e o bloco diz «Lançado para hoje, sábado (10/10)»; sem rede, o painel do Finalizar fecha e a gravação termina sozinha. `tests/regras.test.js` ganhou 10 provas do histórico («só cria» e o tamanho), rodadas no emulador oficial do Firebase: todas passam.

## O que mudou em 09/out/2026 (v 2026-10-09-07) — Corrigir a hospedagem: trocar a ficha ou excluir, com motivo e assinatura (a Frida)

> Adriana, 08/out/2026 (quadro de pedidos, linha 27): *"Pedi ontem para poder excluir hospedagem. Entrou uma Frida Spitz … apareceu outra Frida a SRD que é aluna! … Precisa de justificar e assinar quem fez e porque. E não aceitar por exemplo 1 palavra apenas. … Um mínimo de palavras. Sei lá 4 palavras."* E em 09/10: *"Preciso que tudo no app possa ser excluído, modificado, alterado e etc."* A Frida Spitz (cliente nova, tutora Ana Carolina) foi ligada à **única** Frida do cadastro, a Frida SRD, de outra tutora; não havia como trocar a ficha nem como excluir onde as hospedagens moram. (Story 6.53 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (AZ) Hóspedes de hoje, Plantão da noite › Zona de risco e Check-in › «Corrigir esta hospedagem»

| Antes | Agora |
|---|---|
| Não havia Excluir em **Hóspedes de hoje** nem no **Check-in**. O único caminho era a Zona de risco do Plantão: escondido da Consultora, sem motivo, e com o texto "(hoje)" cancelando a estadia **inteira** | **«Corrigir esta hospedagem»** em cada linha de Hóspedes de hoje (Consultora, Supervisão, Gestão e Diretoria), no quadro "já está hospedado" do Check-in (**«Foi no FILHOt errado ou não aconteceu? Trocar a ficha ou excluir»**) e na Zona de risco do Plantão: com check-in, o botão vira **«Corrigir esta hospedagem (trocar a ficha ou excluir)»** e não grava nada sozinho. Um cartaz só, com três saídas e quando usar cada uma: FILHOt errado · não aconteceu · informação errada |
| Corrigir e SUBSTITUIR não trocavam o FILHOt: a Frida continuava na ficha da Frida SRD | **Trocar a ficha:** busca no cadastro (nome, raça e tutor; a ficha atual não aparece) ou **«É um FILHOt novo? Criar a ficha»**, já preenchida com o nome, o tutor e a raça do orçamento fechado das mesmas datas, com as travas do Novo Hóspede (idêntica bloqueia; homônima pede «É outro FILHOt»). Antes de gravar: **"Sai de / Vai para / Continua igual"** (comida, remédios, pertences, assinatura do tutor, Conferência e fotos) |
| O que o check-in escreveu na ficha errada ficava lá | Vai para a ficha certa **o que se sabe que estava vazio** antes do check-in (a comida guardada pela primeira vez, os campos do cartão "cadastro incompleto", o "sem restrição nem alergia" e a restrição que a tutora da hóspede declarou) e sai da ficha errada. O remédio nascido no check-in **muda de agenda com o mesmo id e o estoque**; as doses já dadas são **copiadas** (as originais ficam no registro); o aviso "está acabando" vai junto |
| — | O que não dá para saber vira **"Conferir"** (não muda sozinho): remédio da outra ficha "Confirmado", "Mudou" ou "Parou" no check-in, alergia que pode ter sido apagada, comida trocada, comida que começou com a da outra ficha, registros do Day Care nos dias da estadia (não são movidos: área protegida). Cada item tem **«Abrir a ficha de …»** (na aba certa), **«Desfazer o parou»** (uso contínuo ou até uma data; só para quem mexe na medicação: Veterinária, Supervisão e Gestão) e **«Conferido»**, que grava o nome (só Recepção, Supervisão, Gestão e Diretoria). Em Hóspedes de hoje, a linha mostra **«Conferir (N)»** até o último |
| Remédio da outra ficha dado à hóspede não aparecia em lugar nenhum | O cartaz mostra a dose (remédio, dia e hora) e deixa **prontos os textos para a veterinária e para a tutora**. **Nada é enviado pelo app**: o botão «Copiar» só aparece depois de a Adriana aprovar o modelo (até lá: "Modelo aguardando a aprovação da Adriana: não envie ainda") |
| — | **Excluir:** só o que não aconteceu. Grava "cancelada" com o objeto da exclusão; **nada é apagado**. Com prova de que o FILHOt dormiu aqui (dose registrada, relatório do plantão, Conferência concluída, check-out ou saída antecipada) **não grava** e oferece **Trocar a ficha** — conferido ao abrir e **de novo na hora de gravar**: a dose ou o relatório que chega com o cartaz aberto também trava ("Enquanto este cartaz estava aberto, apareceu prova de que o FILHOt dormiu aqui …"); o relatório escrito na ficha de onde a estadia saiu numa troca anterior também conta. **Hospedagem lançada em dobro:** excluir a duplicada não esconde a verdadeira do mesmo FILHOt — o Plantão, o alarme, a Conferência, o Check-out, a Zona de risco e a chamada do Day Care ficam com a hospedagem que não foi excluída (a excluída guarda a hora em "cancelada em", sem passar a ser "a mais recente"), no aparelho que excluiu e nos outros. Pernoite com valor mostra o valor ("Pernoite com valor: R$ 150,00 …"). O alarme do remédio nascido neste check-in para (vira "Parou de tomar", com o motivo). Na mesma tela: a **linha da planilha** (tirar do Plantão nos dias da estadia, com o mesmo motivo) e o **orçamento** (cancelar a reserva com o mesmo motivo e a mesma senha, ou deixar). Se a hospedagem está na ficha errada (o caso da Frida), a tela acha o orçamento fechado das mesmas datas com o mesmo nome e **outro tutor**, só quando é um e só se esse FILHOt não tem a própria hospedagem, e avisa em vermelho: "Este orçamento é de {nome}, de {tutor} (outro tutor) … Cancele a reserva só se ela era desta hospedagem." A Saída antecipada continua achando o orçamento só pela ficha |
| A hospedagem cancelada aparecia como "CANCELADA", sem dizer por quê | Em **"Já saíram — histórico"**, com o selo **EXCLUÍDA**: "Excluída em DD/MM/AAAA às HH:MM por {nome} — {motivo}". A linha da hospedagem trocada diz **"Ficha trocada em … por …: estava na ficha de …"** |
| Motivo: o ✎ Corrigir aceitava 1 palavra, o SUBSTITUIR 3 letras, o × do Plantão 8 letras, e a Zona de risco não pedia nada | **Pelo menos 4 palavras, 3 diferentes de 2 letras ou mais**, em todos (Trocar a ficha, Excluir, ✎ Corrigir, SUBSTITUIR, × e Zona de risco). A tela diz quantas faltam: "Escreva o que aconteceu em pelo menos 4 palavras (faltam 2)." "não é a ficha dela" passa; "Frida errada" e "ok ok ok ok" não passam. Na Zona de risco sem check-in, o motivo é escrito no próprio cartão, entre os dois toques |
| — | **Assinatura:** Trocar a ficha e Excluir pedem a **senha da própria pessoa** (Gestão ou Supervisão), em qualquer aparelho; a Consultora abre e chama uma delas. Senha de posto (Plantonista, Monitor 1) ou de outro papel não assina ("Essa senha é de {nome}, que não pode assinar …"). O app grava o nome, o papel e quem estava logado no aparelho; **a senha nunca** |
| — | **Rastro em quatro lugares:** na estadia (a troca e a exclusão como lista, e as correções), em `auaulandia/hospedagem-correcoes`, na auditoria do dia e no grupo da Gestão no Telegram ("HOSPEDAGEM CORRIGIDA: …" / "HOSPEDAGEM EXCLUÍDA: …"). O Telegram que falha não desfaz nada, e a tela diz |
| O botão Check-in do orçamento de cliente nova abria a única ficha de mesmo nome, de outra tutora; a lista "sem check-in" abria a primeira de mesmo nome; "Registrar datas" usava o tutor de outra ficha e copiava a comida de qualquer estadia de mesmo nome | **As portas fechadas:** com os dois tutores escritos e diferentes, o app não liga sozinho — a busca vem preenchida, com o aviso "Na lista, Frida é de {tutora}. Neste orçamento, Frida é de Ana Carolina: se é a primeira vez na Zêluz, toque em Novo Hóspede, que já está preenchido." A lista "sem check-in" usa o nome **e o tutor** da planilha. "Registrar datas" usa o tutor da planilha, e a hospedagem nova copia a comida só da **mesma ficha**, nunca de estadia excluída |
| — | **PDF reemitido** depois da troca: "Correção: Ficha corrigida em DD/MM: estava na ficha de outro FILHOt (…)". O cartaz oferece **«Reemitir a ficha em PDF»** |
| — | **A troca que ficou pela metade** (a internet caiu depois de a estadia mudar): o cartaz e a linha avisam, e **«Retomar a troca de ficha»** termina sem duplicar nada. Enquanto ela não termina, o cartaz só oferece o «Retomar»: trocar de novo, excluir ou corrigir esperam ("A troca de ficha anterior ficou pela metade…"). **O alarme de outro aparelho** recarrega quando a troca muda um remédio de ficha (o aviso sai **antes** de o remédio deixar a ficha antiga, e de novo no fim), e o «Dei agora» de uma tela velha não grava a dose na ficha antiga ("ESTE REMÉDIO MUDOU DE FICHA"); antes de recusar, o app confere no banco onde o remédio está: **trocar a ficha de volta** não trava o «Dei agora». **O tablet do Plantão que já estava aberto** (a lista montada antes da troca) acerta a hospedagem na hora: o card passa para a ficha certa, o remédio que mudou continua tocando, os remédios da outra ficha param de tocar para ela, e a lista é remontada; na **exclusão**, a hospedagem sai do Plantão e do alarme desse tablet. Toda troca (mesmo sem remédio) e toda exclusão avisam os outros aparelhos |
| — | **O remédio é lido na hora de gravar**, não na hora em que o cartaz abriu: a dose dada pela plantonista enquanto a Gestão ainda não tinha digitado a senha vai para a ficha certa, e o estoque vai com o valor de agora, descontado **uma vez** (a mesma marca dia + dose do alarme, com a quantidade da dose) — sem "medicação não dada" falso e sem risco de segunda dose. As doses já dadas chegam à ficha certa **antes** do remédio: o aparelho que recarrega no meio da troca não toca de novo a dose que já foi dada. **O aviso no Telegram não segura a troca:** o remédio muda de ficha (ou o alarme para, no Excluir) sem esperar a ponte; se a ponte não responde em 20 segundos, a tela diz "O aviso no grupo da Gestão não confirmou em 20 segundos: confira o grupo antes de avisar de novo" |
| — | Antes de gravar, a tela avisa se a **planilha de hoje** escreve o tutor de um jeito que não leva à ficha certa ("a linha de Frida traz "Carol" como tutor …") |

- **Decisões aplicadas pela recomendação (FR1 a FR8 do quadro; podem mudar):** FR1 — Gestão e Supervisão assinam; a Consultora abre e chama. FR2 — a senha da própria pessoa, grava o nome. FR3 — 4 palavras também no Corrigir, no SUBSTITUIR e no ×. FR4 — Excluir travado com prova de que dormiu aqui. FR5 — registros do Day Care não se movem; a lista vai para a Gestão. FR6 — aviso no grupo da Gestão. FR7 — a mesma tela trata planilha e orçamento. FR8 — o texto para a tutora e a veterinária fica pronto, mas só sai depois de a Adriana aprovar o modelo.
- **Monitor:** continua vendo a Zona de risco do Plantão; com check-in, o cartaz abre **só para ler** (a hospedagem e o que falta conferir), sem Trocar, Excluir, Corrigir nem «Conferido», com "chame a Recepção, a Amanda ou a Gestão". Em Hóspedes de hoje, o Monitor não vê a correção. A Consultora não vê a Zona de risco (como antes): a porta dela é Hóspedes de hoje e o Check-in.
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*` (155, idênticas ao master); os registros do Day Care já gravados na ficha antiga (chamada, check-in do corpo, fotos) não são movidos; os relatórios do plantão ficam na chave em que foram escritos; o alarme continua lendo a agenda como antes.
- **Limites (registrados na Story 6.53):** as regras novas do banco para `hospedagem-correcoes` (só criar) não foram publicadas — até lá, o rastro dentro do app pode ser apagado por qualquer aparelho logado; o Telegram é a cópia fora do app. A senha não é segurança (está no app e no banco legível por login); dá responsabilidade. O "medAgendaKey/pelMestreDe sem o nome único" (Passo 3 da auditoria de dados) fica para uma story própria.
- **Onde está no código** (`auaulandia/index.html`): novas — `motivoQuatroPalavras`, `hospAssinarPorSenha`, `hospPushTs`, `hospDiasDaEstadia`, `hospDiasDoPeriodo`, `hospProvaDeEstadia`, `hospPlanoDaTroca`, `hospMsgRemedioDado`, `hospTrocaPatch`, `hospExclusaoPatch`, `hospParouPatch`, `hospPendenciasAbertas`, `hospNotaTrocaFicha`, `hospAvisoPlanilha`, `hospCorrigirAbrir`, `hospCorrHtml`, `hospTrocarPreparar`, `hospTrocarGravar`, `hospTrocaAplicar`, `hospRetomarTroca`, `hospRastro`, `hospExcluirPreparar`, `hospLerProvasExcluir`, `hospExcluirGravar`, `hospConferido`/`hospPodeConferir`/`hospMarcarConferido`, `hospDoseCopiavel`, `hospDoseItemId`, `hospEstoqueAcertar`, `hospMarcarMovidos`, `hospGravarSinalAgenda`, `hospCardsDoSinal`, `hospComPrazo`, `hospEstadiaGanha`, `hospEstadiaLocal`, `hospDesfazerParou`, `hospCorrLinha`, `hospZonaRiscoRotulo`, `hospSinalAgenda`/`hospSinalAgendaOuvir`/`hospMedMovido`, `hospGarantirOrcamentos`, `hospIdxDaLinha`, `orcAvisoOutroTutor`/`orcAvisoNaBusca`, `ciNovoHospedeTrava`, `orcCancelarGravar`; alteradas — `PERM` (`corrigir-hospedagem`, `assinar-correcao-hospedagem`), `orcAcharPeludinho` (passos 4 e 5), `orcAbrirCheckin`, `orcCancelar`, `renderCiBusca`, `ciCriarNovoHospede`, `ciChecarHospedado`, `ciSalvar` (✎ Corrigir), `ciSubstituirExistente`, `removerHospedeCard`, `cancelarPernoiteFicha` (e o cartão da Zona de risco no HTML), `abrirPlantao`, `zCampo` (`op.validar`), `hospAbaLinha`, `renderHospedesAba`, `_hospGravarNova`, `ciFichaFonteEstadia`/`ciFichaPdfBlob`, `registrarDoseAgendadaGlobal` (uma linha), `wireFirebaseListeners` (uma linha), `hospOrcamentoDaEstadia` (o orçamento de outro tutor; `{estrito:true}` na Saída antecipada, em `hospConfirmarAntecipada`), `carregarManuais` e `_cfIndexarEstadias` (a estadia que vale para a ficha: a não cancelada ganha da cancelada).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (866 no total, 0 falhas, em UTC e no horário de São Paulo; 95 da 6.53, com dado inventado e relógio fixo: 32 da 1ª rodada, 26 + 6 + 6 do QA independente levadas para cá, 9 da 2ª rodada, 10 da 3ª e 6 da 4ª — inclusive com **dois aparelhos** no mesmo banco de mentira; contra a base, 31 das 32 primeiras falham; contra o código da 3ª rodada, 10 falham — as da hospedagem lançada em dobro, da troca pela metade, do card manual e do texto do prazo). 65 defeitos plantados do dev, 65 pegos; os 36 defeitos plantados do QA (20 + 8 + 8) caem na Fase 0 sozinha. Harness com retrato sintético: **3868 ok, com as mesmas 17 falhas do master**; 3 checagens antigas da Zona de risco e do × foram reescritas porque provavam o comportamento que a story tira (o 2º toque que cancelava a estadia sem motivo e o lançamento apagado sem motivo). Área protegida idêntica. Chromium a 375 px (dado inventado): troca de ficha da Pitanga SRD para a Pitanga Spitz, exclusão do Quindim lançado por engano, motivo curto recusado, senha de consultora recusada, sem rolagem lateral e sem erro de página. 2ª rodada: a cápsula dada em outro aparelho com o cartaz aberto chegou à ficha certa com o estoque de agora; trocar de volta não travou o «Dei agora»; o relatório que chegou com o Excluir aberto travou; o orçamento de outro tutor apareceu com o aviso; o Monitor pela Zona de risco só leu. 3ª rodada, com dois aparelhos: o tablet do Plantão aberto antes da troca passou sozinho para a ficha certa (o remédio que mudou continua no alarme; o da outra ficha parou de tocar para a hóspede), e a hospedagem excluída saiu do Plantão e do alarme dele. 4ª rodada, com dois aparelhos: o Quindim com a hospedagem verdadeira (08 a 12/10) e uma lançada em dobro (09 a 10/10) — a recepção excluiu a duplicada, e nos dois aparelhos o Quindim continuou no Plantão, com o "Antibiótico Teste 21:00" no alarme e o índice na hospedagem verdadeira.

## O que mudou em 09/out/2026 (v 2026-10-09-06) — A regra das 24 horas: troca não é reposição; marcou e não veio, conta (casos do Totó e do Batata)

> Adriana, 06/out/2026: *"Quando o peludo marcou uma reposição como o Batata e não veio ela conta como vinda. Foi a troca dele."* E em 08/out/2026: *"o Totô marcou reposição igual o João e Juju. Trocar o dia de quarta para quinta-feira. [...] E está constando lá como uma reposição. Isso já tem que ser retirado [...] A não ser que ela desmarque, aí pode ter a opção de desmarcar com as 24 horas anteriores."* A regra das 24 horas é dela (08/10); as perguntas de detalhe P1 a P8, R1, R2 e a 6 (baixa no mesmo dia) foram aplicadas pela recomendação do quadro de pedidos. (Story 6.38 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BB) Reposições › a troca fora do saldo, o prazo para desmarcar, o «não veio» e a lista «Para a Gestão conferir»

| Antes | Agora |
|---|---|
| **A troca de dia contava como reposição:** o Totó trocou a quarta pela quinta e o número em Reposições, no Extrato, na ficha e na mensagem ao tutor subia 1 | **A troca não entra no saldo de reposições.** O número de Reposições, o cabeçalho do Extrato, a ficha, as buscas do «+ Falta» e do «Marcar reposição», a turma do dia e a mensagem ao tutor mostram só as reposições. A linha da troca continua em Reposições: "Vem repor em 15/10/2026 (troca, no lugar de 14/10) · desmarcar até as 24h de 14/10" |
| Extrato: a troca aparecia como "+1 CRÉDITO" | Rótulos novos: **TROCA** ("Troca: quarta-feira, 14/10 → quinta-feira, 15/10 · não entra no saldo"), **TROCA CUMPRIDA**, **TROCA PERDIDA**, **−1 NÃO VEIO**, **−1 DESMARCADA FORA DO PRAZO** e "+1 CRÉDITO … era troca, virou reposição". O cabeçalho diz a troca marcada: "Saldo atual: 1 dia(s) de reposição · troca marcada: quarta-feira, 14/10 → quinta-feira, 15/10 (não entra no saldo)" |
| A troca de um dia pagava outro dia («Veio repor hoje», «Usou 1 hoje», Lançamentos do dia › Reposição, o orçamento da hospedagem) | **A troca vale só no dia dela.** Em outro dia: "Totó não tem saldo de reposição. A troca marcada para quinta-feira, 15/10, não é reposição: ela vale só nesse dia." No próprio dia, tudo aceita a troca, como antes |
| Marcou, não veio e não desmarcou: o crédito continuava no saldo, com «ele veio» e «desmarcar» | **Conta como usada.** No dia seguinte (pelo relógio do servidor, no fuso de Brasília), o app grava sozinho o uso "Marcada para 08/10 — não veio (não desmarcou até as 24h do dia anterior)" — só para as marcadas **depois** desta versão, só com o dia fechado no app (a trava da falta automática), sem check-in e sem «veio» na chamada. Troca: "TROCA PERDIDA", o saldo de reposições não muda. Na tela, ainda no dia seguinte, a recepção também pode tocar «ele veio» ou «não veio» |
| A reposição marcada para hoje só saía do saldo com o toque em «Veio repor hoje» ou no dia seguinte (o Extrato do Batata em 07/10: "era para ser 3") | **Sai no mesmo dia** quando o check-in do corpo de entrada dele é feito (pergunta 6, recomendação aplicada). A chamada sozinha continua esperando o dia seguinte; dia fixo e dia de hospedagem continuam com o toque. O app só lê o que o check-in grava |
| «desmarcar» liberava o crédito em qualquer dia, inclusive no próprio dia e depois | **Prazo: até as 24h do dia anterior ao dia marcado.** Dentro do prazo, como antes (a reposição volta a ficar sem dia; a troca tem duas saídas: «Volta a vir na quarta-feira, 07/10» ou «Não vem nos dois dias: vira reposição»). Fora do prazo, primeiro **"Quando o tutor avisou?"** (dia e hora; o aviso por WhatsApp antes do prazo vale), e depois **"Desmarcar fora do prazo?"**: «Desmarcar e contar como usada» (a vaga fica livre, a reposição conta como usada; na troca, «Desmarcar: a troca é perdida»), «A Zêluz desmarcou (não conta)», **só a Gestão** «Desmarcar sem contar (exceção)» com o motivo, e «Manter o dia». A 2ª marcação no mesmo dia e o dia em que a casa não abre desmarcam sem contar |
| — | **Na confirmação de toda marcação**, a linha do prazo: "Prazo para desmarcar: até as 24h de quarta-feira, 14/10." Toda marcação nova grava o dia do prazo (`prazo24h`) |
| Remarcar uma reposição que já passou ou que está fora do prazo era livre | **Barrado com a frase:** "A reposição marcada para 08/10/2026 já passou do prazo para desmarcar (até as 24h de quarta-feira, 07/10). Desmarque primeiro em Reposições (ela conta como usada) ou peça a exceção à Gestão." Dentro do prazo, como antes |
| «Devolver» no Extrato: qualquer pessoa da recepção | O uso "não veio" e o "desmarcada fora do prazo" **só a Gestão devolve** (com o motivo; a troca volta como reposição). A recepção vê "Só a Gestão devolve (regra das 24 horas)". Os outros usos continuam como antes |
| As marcadas que já tinham passado ficavam "Estava marcada para dd/mm" para sempre | **Nada do passado muda sozinho.** Quadro novo em Reposições, só para a Gestão: **"Para a Gestão conferir — reposições e trocas marcadas que já passaram (N)"**, uma por uma, com o porquê ("marcada antes da regra das 24 horas · o tutor não tinha sido avisado do prazo · confira o WhatsApp antes de contar") e o que o app sabe ("sem chamada, sem check-in, o dia não foi fechado no app"), com «Contar: não veio», «Ele veio» e «Não contar» (com motivo). Vão para lá também dia fixo, hospedagem, feriado, 2ª marcação, chamada e check-in que se contradizem e o dia sem registro. Na mesa da Gestão, o quadro **"Reposições para conferir"** com o número ("marcadas que já passaram sem desfecho, e desmarcadas antes da regra, para ver — confira uma por uma"). A vencida de ontem aparece na lista, na linha e na baixa no mesmo dia em que o «Marcar reposição» já a cita, também quando a marcada de hoje já teve a vinda |
| «Marcar reposição» com as reposições já marcadas em outros dias usava uma delas sem dizer | **Para:** "Totó tem 1 reposição, marcada para 13/10. Para usá-la neste dia, desmarque o outro dia (até as 24h do dia anterior) e marque de novo." Sem reposição livre, nunca vira avulso sozinho. A marcada de hoje que já teve a vinda (check-in do corpo ou «Veio repor hoje») não conta mais como "marcada": quem tem outra livre marca normalmente, e a linha não diz mais "Vem repor em" nesse dia |
| — | **A troca que passou esperando a Gestão** também para o «Marcar reposição», em vez de sair avulso: "Totó: a troca de 08/10 espera a Gestão conferir. Até lá, este dia não sai como avulso nem como reposição: peça à Gestão para conferir em Reposições." O orçamento da hospedagem continua com o desconto dela, como antes |
| A troca por vir cujo crédito uma versão antiga já tinha gastado noutro dia deixava o número em −1 | **O número nunca fica abaixo de 0** (tela, Extrato, ficha, turma e mensagem ao tutor). O livro-caixa não muda. A troca por vir continua troca mesmo com um dia reservado em hospedagem: o «Veio repor hoje» em outro dia não fica liberado por isso |
| Dia de feriado marcado: a recepção tinha só «ela veio» e «não veio», e «não veio» contava | **«desmarcar (não conta)»** na linha ("Estava marcada para 12/10/2026: a Zêluz não abriu (Nossa Senhora Aparecida)") e, na lista da Gestão, «Desmarcar (a Zêluz não abriu: não conta)». «não veio» em feriado é recusado para todos. Dia de hospedagem, dia fixo e uso devolvido no dia: a recepção vê «ele veio» e "a Gestão confere"; «não veio» é da Gestão |
| Marcada antes desta versão para hoje: o tutor que ligava para desmarcar caía em "Desmarcar fora do prazo?" e pagava; quem simplesmente não vinha ia para a Gestão | **Desmarcar não conta:** "Marcada antes da regra das 24 horas: não conta (o tutor não tinha recebido o prazo para desmarcar)." A Gestão vê cada uma em **"Para a Gestão ver — desmarcadas sem contar, marcadas antes da regra das 24 horas (N)"**, com «Visto» (fica no Extrato). O texto de HOJE avisa quem está nesse caso |
| "Quando o tutor avisou?" aceitava qualquer data | Recusa o aviso **antes da marcação**: "O aviso não pode ser antes da marcação: 13/10/2026 foi marcado em 12/10 às 21:00. Confira o dia e a hora do aviso. Nada foi mudado." |
| «não veio» e «ele veio» decidiam "o dia já passou" pela hora do aparelho | Pedem também a **hora do servidor**: "Pelo relógio do servidor, 08/10/2026 ainda não terminou (a hora deste aparelho pode estar adiantada). Nada foi gravado. No próprio dia, use «Veio repor hoje» ou «desmarcar»." |
| «Marcar reposição» sem "É troca de dia" num dia em que ele tem falta avisada futura sem dia virava reposição comum (o caminho do Batata) | **Dica (não trava):** "Ele tem a falta avisada de quarta-feira, 14/10, ainda sem dia de repor. Se o tutor está trocando o dia, marque «É troca de dia» e escolha 14/10: a troca não mexe nas reposições." |
| «+ Falta» com o dia de repor lotado → «Avisar a Márcia» → «Autorizar» gravava reposição comum; "Alguns dias" com uma data só também | **As duas gravam a troca.** A autorização da Márcia depois do dia de origem, com a falta já lançada, também. Se a troca não cabe (o dia novo já é dia dele, por exemplo), entra como reposição e a tela diz: "Entrou como reposição: …". A autorização da Márcia traz a mensagem pronta para o tutor |
| A mensagem ao tutor não falava de prazo | **R1 (texto da Adriana)** no fim da mensagem da falta com o dia de repor combinado, da reposição marcada e da troca: "Caso precise desmarcar a reposição, me avise até as 24h do dia anterior. Temos apenas 5 vagas de reposição por dia, além dos nossos Aulunos, e assim consigo remanejar outros Aulunos e famílias que precisam." (na troca: "desmarcar a troca" e "5 vagas por dia"; o número vem das Configurações). **R2** na desmarcação fora do prazo: "Passando para confirmar: a reposição do Totó que estava marcada para quinta-feira, 08/10, foi desmarcada. Como o aviso chegou depois das 24h do dia anterior, ela conta como usada: fica 1 reposição para marcar quando for melhor para vocês." (e o texto da troca) |
| Texto de "HOJE" em Reposições: só a lista | "Marcados para repor HOJE (1): Bolinha. O prazo para desmarcar estes dias era até as 24h de ontem. Veio: marque «Veio repor hoje» (ou o check-in do corpo de hoje dá a baixa sozinho, logo depois da entrada). Não veio: amanhã a reposição sai do saldo sozinha, como «não veio», e a troca é perdida. Dia fixo dele, dia de hospedagem e dia sem registro ficam para a Gestão conferir." |

- **O relógio do prazo:** o dia de hoje é o do **servidor** (`.info/serverTimeOffset`), no fuso de Brasília (`America/Sao_Paulo`; sem o Intl, UTC−3). Antes de a conexão subir, vale o do aparelho, e o registro diz `relogio: 'aparelho'`. O «não veio» automático só é gravado com os **dois relógios** depois do dia marcado e com o do servidor já lido. Segunda-feira: o prazo vence às 24h de domingo.
- **Uma vez só por dia:** o «não veio», o «ele veio», o «desmarcada fora do prazo» e o «Contar: não veio» da Gestão gravam no mesmo nó do dia (`veio-{dia}`), por transação. Dois aparelhos, ou a baixa rodando 10 vezes, dão um registro só.
- **Na virada, quem tem troca marcada vê o número de Reposições cair 1** (é o pedido). As trocas antigas (sem o prazo gravado) que já passaram sem vinda também saem do número, **de qualquer idade**, até a Gestão conferir (2ª rodada, QA638-01: sem corte de dias). Depois da virada, o número só muda com um toque (recepção ou Gestão) ou com a baixa do dia: **nunca sozinho de um dia para o outro**. A marcada na regra que a baixa não alcança mais (passou da janela de 60 dias dela) vai para a lista da Gestão. Avisar a recepção numa linha na entrega.
- **Decisões aplicadas pela recomendação (podem mudar):** P1 a P8, R1 e R2 do quadro de pedidos; pergunta 6 (baixa no mesmo dia pelo check-in do corpo); o passado vai para a Gestão (P2); o «Desmarcar sem contar (exceção)» e o «Devolver» do uso com desfecho só para a Gestão (P3). R2 é mensagem a cliente: o texto é o recomendado no quadro e pode ser trocado por ela. Na 2ª rodada, pelo @po, todas pelo lado conservador (sem cobrar o tutor de surpresa): sem corte de dias nas trocas antigas; o número nunca negativo; a troca que espera a Gestão não sai avulso; casa fechada nunca conta; a marcada antes da regra não conta ao desmarcar.
- **Perguntas à Adriana (não travam esta versão; lista completa na Story 6.38):** a troca antiga que espera a Gestão segura o «Marcar reposição» (nem avulso, nem reposição) até a Gestão conferir, enquanto o orçamento da hospedagem ainda a usa como desconto? (recomendado: sim, como está); num dia de hospedagem, o «ele veio» da recepção também vai para a Gestão? (recomendado: sim, numa story à parte; hoje continua com a recepção, como desde a 6.25); a desmarcação fora do prazo com o aviso de antes do prazo (o «Quando o tutor avisou?»): vai também para a lista da Gestão? (recomendado: não; fica no Extrato e na Linha do tempo); segunda-feira com prazo no domingo ou no último dia útil (recomendado: domingo, como está); o coração no fim de toda mensagem ao tutor, de antes desta versão (a regra da marca é zero emoji; recomendado: decidir à parte).
- **Aparelhos com a versão antiga** desmarcam de graça e não gravam o prazo até recarregar o app: o que eles marcam vai para a lista da Gestão. Depois da publicação, recarregar todos os tablets.
- **Fora desta versão:** a troca pelos Lançamentos do dia (T6) continua gastando reposição de verdade (só a frase "sem saldo" mudou); «Veio repor hoje» em dois aparelhos ao mesmo tempo; "só a Gestão" é regra de tela (o banco só exige login; servidor de senha no quadro, linha 59).
- **Não mudou:** check-in do corpo, pertences, a Chamada (`#v-daycare`), `pendAvisarChegada`, as funções `ck*`/`ckt*`/`pt*`, o livro-caixa (`repSaldo`) e o crédito da saída antecipada da hospedagem (`sa-`, `hospConfirmarAntecipada`). O app só lê `daycare/checkin-corpo/{dia}/{FILHOt}/fim` e a trava `daycare/falta-automatica/{dia}`.
- **Onde está no código** (`auaulandia/index.html`): novas — a conta: `repNaRegra`, `repSaldoDe`, `repAgendaDeL`, `repTrocasPendentesLista`, `repSaldoReposicao`, `repSaldoReposicaoDe`, `repSaldoRepDepois`, `repTrocaPendenteDoDia`, `repSaldoParaUsarHoje`, `repVencidasSemDesfecho`, `repLivresParaMarcar`, `repSemSaldoTexto`, `repTrocaCabe`, `repEhGestao`, `repP2`; o relógio e o prazo: `repBrasiliaPartes`, `repDiaBrasilia`, `repQuandoBrasilia`, `repAgoraServidor`, `repRelogio`, `repHojeServidor`, `repDiaAnterior`, `repPrazoTexto`, `repPrazo`, `repPrazoLinha`, `repRelogioOuvir`, `repAvisoMs`, `repAvisoCampo`, `repRemarcarBarrado`; o desfecho: `repDesfechoRegistro`, `repDesfechoGravar`, `repDesfechoDoDia`, `repMotivoSemLer`, `repComoDesmarcar`, `repDesfechoTexto`, `repDevolverDesfecho`, `repUsoDevolvivelPor`, `dashRemoverRepForaPrazo`; o Extrato: `repExtratoPares`, `repExtratoRotulo`; a lista da Gestão: `repConferirMotivo`, `repConferirLista`, `repConferirContagem`, `repConferirSaber`, `repConferirHTML`, `repConferirContar`, `repConferirVeio`, `repContarNaoVeio`, `repConferirNaoContar`; as mensagens e os caminhos: `repMensagemPrazo`, `repMarcadasMotivo`, `repDicaTroca`; 2ª rodada: `repTetosDe`, `repReservadoDe`, `repTetoVencidas`, `repTrocasPendentesDe`, `repTrocasPendentesP`, `repTrocasFuturas`, `repTrocaEsperaMotivo`, `repMarcadaEm`, `repConferirVisto`, `repDiaNaoTerminouTexto`. Alteradas — `orcSaldoRep` (só as trocas por vir, 2ª rodada), `repVoltasVencidasValendo` (o teto pela agenda de verdade, 3ª rodada), `repTrocasPendentes`, `repMensagem`, `repLancEhTroca`, `repConfirmar`, `repDesmarcar`, `repUsar`, `repVeioNoDia`, `repDevolverUso`, `repExtratoDesmarcada`, `repAgendarVolta`, `repCreditoLivre`, `repTrocaGravar`, `repTrocaFeitaModal`, `repBaixaPelaPresenca`, `dashRepDoLancamento`, `dashRemover`, `dashRepAbater`, `dashLancar` (só o `seguirRep` de dentro), `dxVeredito`, `dxVereditoTroca`, `dxVeredictoHTML`, `dxConfirmar`, `dxBuscar`, `dxPintar`, `vagasAutorizar`, `vagasPedCarregar`, `contarPendencias`, `repBuscarPel`, `repMostrarEscolhido`, `turmaListaDoDia`, `blocoReposicaoFicha`, `renderReposicao`, `repAbrirExtrato`, `mesaFatiaHtml`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (826 no total, 0 falhas; 55 da 6.38, todas com relógio fixo: P38-01 a P38-34 da especificação, P4, P5, P6, P7, C06, C11, C16 e C17 das críticas, R2-01 a R2-10 e R2-09b do 1º gate do QA independente e R3-01 a R3-03 do re-gate, com as sondas N8 e N9 do QA nas R2-04 e R2-05; 12 antigas ajustadas, cada uma com o porquê no comentário). Contra o código de antes da 6.38, falham as provas novas da regra e as 8 antigas que mudaram de regra; as de cada rodada falham contra a rodada anterior. TZ=UTC e TZ=America/Sao_Paulo: 0 falhas. Harness: **3868 ok, com as mesmas 17 falhas do master** (AUDIT-5 e v-33 ajustados ao nome novo do saldo e ao bloqueio das marcadas, sem mudar a contagem). Defeitos plantados: 112 rodados, 111 pegos (os 45 da especificação em 47 variantes, 33 meus e os 32 do QA independente; o único que escapa, o Z08 do QA, é equivalente: ver Story 6.38). Chromium a 375 px (Gestão e consultora): sem rolagem lateral e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-05) — Banho fixo: tirar e mudar a hora só por um dia, e o sábado

> Adriana, 09/out/2026 (quadro de pedidos, linhas 75 e 84): *"Preciso URGENTE de ter como tirar no lançamento do dia — assim como todos os outros eu consigo tirar, os recorrentes também precisam ser tirados. O Rafael é recorrente e não tomará banho hoje."* e, em 08 e 09/10, *"Banhos recorrentes. pode colocar no sábado, está sem a possibilidade de colocar sábado!"* (Story 6.50 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (AY) Lançamentos do dia › Banho; e Banhos recorrentes

| Antes | Agora |
|---|---|
| A linha do banho fixo nos Lançamentos do dia não tinha «tirar»: o banho de quem não vinha tomar (o Rafael) ficava na planilha e na TV, e só dava para pular em Banhos recorrentes, e só o próximo | **«tirar só este dia»** na linha do banho fixo, em qualquer dia que a tela mostre, de hoje em diante. Pergunta antes: "Tirar o banho de Rafael de 09/10? Só este dia. O combinado continua valendo para os próximos." (com xará de primeiro nome, a pergunta diz qual: "Fiona/SRD"). Grava a mesma exceção do «Pular o próximo» e pede a conferência: a planilha e a TV perdem o banho em instantes (a fila de 20 s), sem esperar os 5 minutos. A linha passa na hora para "Banho fixo de hoje que não vai para a TV", com «pulado só hoje (por quem, quando) — sai da planilha e da TV na próxima conferência, em instantes»; depois da conferência, fica só «pulado só hoje (por quem, quando)» |
| Mudar a hora de um dia só era em Banhos recorrentes, só a do próximo banho, digitando a hora | **«mudar a hora só este dia»** na mesma linha: abre ali os horários prontos da 6.26 (de 15 em 15 minutos, até 17:30) e "outro horário", e o botão «Mudar só 09/10 para 15:30». A linha diz «hora mudada só neste dia (o combinado é 10:00)» e, até a conferência regravar a "Hora Banho", «a hora nova vai para a planilha na próxima conferência» (o destaque continua sendo a hora que está na planilha, como na 6.34) |
| — | **Desfazer:** «pôr de volta» no grupo "não vai para a TV" (o dia volta a seguir o combinado, e a conferência põe o banho de novo na planilha) e «voltar para 10:00» na linha da hora mudada. Escolher no painel a hora do combinado é o mesmo «voltar». O banho liberado porque faltou (Hoje na Zêluz › Banho de quem faltou) não ganha «pôr de volta»: a decisão continua lá |
| O banho fixo que o automático ainda não confirmou (a conferência parada, a ponte fora do ar) não tinha o que fazer | Também tem «tirar só este dia» e «mudar a hora só este dia»: tirado, vai para "não vai para a TV" e não chega à planilha |
| Num dia futuro na tela, o banho fixo pulado não aparecia em lugar nenhum | **"Banho fixo de 16/10 que não vai para a TV (1)"**, com «pulado só neste dia (por quem, quando)» e «pôr de volta». Só os pulados: o resto daquele cartão da 6.49 (faltou, não vem, a caminho) continua sendo de hoje |
| Mexer num dia só era só para quem edita a ficha | **Quem pode tirar um lançamento à mão nesta tela pode tirar e mudar a hora do banho fixo daquele dia:** a recepção, a Supervisão, a Gestão e a Diretoria, pelo papel, e quem recebeu os Lançamentos do dia no Time (mesmo sem editar a ficha). O combinado (dia da semana, hora de sempre, desligar) continua só em Banhos recorrentes, com a permissão de lá |
| Banhos recorrentes oferecia só o próximo dia («Pular o próximo», «Mudar só o dia») | **«Um dia só»**: uma lista com os próximos 14 dias em que o combinado cai ("sex 16/10", "sex 23/10 — pulado", "sex 30/10 — às 14:30"); escolhido o dia, «Pular este dia», «Mudar a hora deste dia», «Voltar para 10:00» ou «Pôr de volta este dia». Para quem combinou com o tutor uma semana diferente. «Pular o próximo» e «Mudar só o dia» continuam |
| As exceções na linha diziam "09/10 (pulado)" | Dizem quem fez: "09/10 (pulado, por Ana)", "16/10 às 15:30 (por Ana)", "23/10 (ainda vem, por Ana)". Cada tirar, mudar e desfazer dos Lançamentos do dia entra na auditoria com o FILHOt, o dia e quem fez ("Rafael — tirou o banho fixo de 09/10/2026 (só este dia; o combinado continua), nos Lançamentos do dia") |
| Banhos recorrentes não tinha o sábado | **Sáb** entre os dias. No sábado o Day Care não abre: o banho fixo de sábado vai sozinho para a planilha do sábado, para a TV e para os Lançamentos do dia **sem olhar os dias de Day Care da ficha** (ele vem para o banho). Feriado, falta avisada, faltou na chamada, pular e mudar a hora valem como nos dias de semana. A frase do combinado diz "banho semanal sáb 09:30", e a linha explica o sábado em vez de dizer "não vem ao Day Care no sábado" |
| «Pular este dia» e «Pôr de volta este dia» em Banhos recorrentes diziam "✅ pulou…" com a lista ainda sem "— pulado" (e o botão errado) até tocar em outra coisa | A linha mostra o estado novo na hora; o «Salvar» do combinado também (2ª rodada) |
| Sem rede, «tirar só este dia» ficava calado | Em 6 segundos: «O BANCO NÃO RESPONDEU — Em 6 segundos o banco não confirmou a gravação: a conexão pode ter caído. Ela fica na fila e é feita sozinha quando a conexão voltar; a linha muda nessa hora.» Quando a conexão volta, grava e a linha muda; se aí o banco recusar, «A GRAVAÇÃO NÃO FOI FEITA». Em Banhos recorrentes, a linha diz «O banco ainda não respondeu…» (2ª rodada) |
| Com a tela aberta desde ontem, tocar no botão do dia que já passou não fazia nada | «ESSE DIA JÁ PASSOU — O banho de 09/10 já passou: não dá para tirar nem mudar a hora dele. Esta tela está aberta desde 09/10: toque na faixa do topo para atualizar.» Vale nos Lançamentos do dia e em «Um dia só» (2ª rodada) |
| — | **A planilha sem o sábado:** se a aba do mês não tiver as linhas do sábado, a linha do banho diz «a planilha não tem as linhas do sábado 10/10 na aba do mês: não foi para a planilha nem para a TV. O app não cria linha nem aba; peça à Gestão para pôr o dia na planilha» (antes: "a planilha recusou — nao achei nenhuma linha de…"). Vale para qualquer dia e coluna do automático, e para a aba do mês que não existe («a planilha não tem a aba "2026 DayCare Novembro"…») |

- **Como a exceção é gravada:** só o dia (`daycare/cadastro/{ficha}/banho_rec/excecoes/{dia}`), numa transação no combinado, a partir do que o **banco** tem — nos Lançamentos do dia e, desde a 2ª rodada, também em Banhos recorrentes («Pular o próximo», «Mudar só o dia», «Um dia só», «desfazer») e no Banho de quem faltou (Hoje na Zêluz), para quem edita a ficha. Duas pessoas mexendo em dias diferentes do mesmo FILHOt não apagam a exceção uma da outra, e uma cópia velha num aparelho não desfaz o combinado mudado em outro. O combinado desligado em outro aparelho não recebe exceção (nos Lançamentos do dia, a tela avisa «O banho fixo deste FILHOt foi desligado em Banhos recorrentes (em outro aparelho): nada foi gravado.»; em Banhos recorrentes, a linha diz «Não salvei: o banho fixo deste FILHOt foi desligado em outro aparelho.»). A memória do aparelho acompanha na hora. Quem não edita a ficha continua barrado em Banhos recorrentes (o aviso de sempre). **Fica uma janela:** o «Salvar» do combinado (dia, hora, shampoo, ligar e desligar) ainda grava o combinado inteiro com as exceções que o aparelho conhece; um «Salvar» com a cópia velha, nos segundos em que outro aparelho grava uma exceção, pode apagá-la.
- **Publicação (a troca de versão no sábado):** o aparelho ainda na versão anterior lê o combinado de sábado sem o dia (`dia:""`): na conferência dele, tira da planilha o banho de sábado que o novo pôs (o novo põe de volta na passada seguinte, e a TV pisca); e um «desfazer» feito nele num combinado de sábado grava o combinado **sem o dia** — o banho fixo de sábado para, calado. O código novo não tem como impedir (é o código antigo que apaga). **Depois do Merge, recarregar todos os computadores e celulares (a faixa de versão no topo) antes de alguém cadastrar banho fixo de sábado.** Os computadores não se atualizam sozinhos.
- **À parte (não é da 6.50; já acontecia na versão publicada):** quem recebeu só os Lançamentos do dia no Time (um monitor) tinha um erro de página ao entrar: a tela abria enquanto o app ainda carregava. Agora ela espera o app terminar de carregar e desenha sem erro.
- **O sábado (o que foi conferido no código):** a ponte acha o dia pela data, na aba do mês ("2026 DayCare Outubro"), e o «criar meses» da ponte põe todos os dias, sábado e domingo inclusive (50 linhas por dia); uma aba feita à mão só com os dias de Day Care não tem o sábado (aí vale o aviso acima). O automático confere hoje e os próximos 14 dias, sábado inclusive. A TV filtra só pela data de hoje, sem regra de dia da semana. `banhoRecProxima`, o quinzenal, o feriado (`orcFechado`: sábado é dia aberto) e a falta avisada já funcionavam no sábado. O que travava era o «ele vem?»: sem Day Care no sábado, ninguém tem o sábado na ficha nem está na turma, e o banho fixo de sábado cairia em "não vem ao Day Care". Não há falta das 12h no sábado (ninguém está na turma).
- **Perguntas à Adriana (não travam):** **SÁ1** — no sábado, o banho fixo vai sozinho para a planilha mesmo sem Day Care? (aplicado: sim, é o que a story pede; alternativa: ir para "não vem ao Day Care" com «Lançar à mão», como nos dias de semana). **SÁ2** — as abas do mês na planilha têm as linhas do sábado, e a TV fica ligada no sábado? (recomendado: a Gestão abrir a aba de outubro e conferir se há linhas com a data 10/10/2026, 2 minutos; sem as linhas, o app avisa e não cria nada).
- **Fora desta versão:** o banho do hospedado na saída e o banho fixo durante a estadia (Story 6.52); o mesmo «tirar só este dia» para o banho escrito direto na planilha.
- **Não mudou:** o banho lançado à mão (com o «tirar» de sempre), o automático das outras colunas, a contagem das vagas, a identidade pela ficha e "na planilha que a TV lê" da 6.49, o Banho de quem faltou, o check-in do corpo, os pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`.
- **Onde está no código** (`auaulandia/index.html`): novas — `banhoDiaPode`, `banhoDiaMapaFichas`, `banhoDiaFixoDaLinha`, `banhoDiaNome`, `banhoDiaBR`, `banhoDiaGravar`, `banhoDiaDepois`, `banhoDiaDoFixo`, `banhoDiaTirar`, `banhoDiaPorDeVolta`, `banhoDiaHoraAbrir`, `banhoDiaHoraFechar`, `banhoDiaHoraPainelHTML`, `banhoDiaMudarHora`, `banhoDiaVoltarHora`, `banhoDiaAcoesHTML`, `banhoDiaSaindoTexto`, `banhoDiaPorDeVoltaBotao`, `dashBanhoFixoPuladosHTML`, `dashPlanilhaSemDiaTexto`, `banhoRecDiaSemDaycare`, `banhosProximosDias`, `banhoDiaRotulo`, `banhosUmDiaHTML`, `banhosEscolherDia`, `banhosDiaValido`, `banhosPularDia`, `banhosMudarHoraDia`; na 2ª rodada, `banhoRecExcecaoTx` (a transação única, com o prazo de 6 s), `banhoDiaDepoisTarde` e `banhoDiaJaPassou` (e `DASH_BFX_HORA`, `BANHO_UM_DIA_N`, `BANHO_DIA_ESC`, `BANHO_TX_PRAZO_MS`). Alteradas — `BANHO_DIAS` e `BANHO_DIA_NOME` (o sábado), `banhoAutoPodeNoDia` e `dashBanhoFixoMotivo` (o sábado; "pulado só neste dia" no dia futuro), `banhoRecTexto` ("sáb"), `dashAutoLinhas`, `dashTvBanhoLinhas`, `dashBanhoFixoClassificar`, `dashBanhoFixoForaHTML`, `renderDash` (uma linha), `banhosRender` (o texto do alto), `banhosLinhaHTML`, `banhosAvisoDiaSemDaycare`, `banhosPular` e `banhosMudarDia` (passam por `banhosPularDia` e `banhosMudarHoraDia`, com os mesmos textos); na 2ª rodada, `banhosGravarExcecao` (a transação, para quem edita a ficha), `banhosTirarExcecao` (devolve a gravação), `banhosSalvar` (a memória acompanha), `dashDadosDeHoje` e `renderDash` (a tela aberta durante a carga). `tests/harness.js`: a conferência do v-48 conta 3 chamadores da fila de 20 s (era 2).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` — **804 no total, 0 falhas** (806 com `QA_BASE` apontando para o index.html da versão anterior; o mesmo em `TZ=America/Sao_Paulo`): 14 da 6.50 (P1 a P14), 16 do QA ("6.50 QA", Q1 a Q15 e as observações; Q11 e Q12 só com `QA_BASE`) e 5 da 2ª rodada (R2-1 a R2-5). As 14 da 1ª rodada falham no código de antes (771 passam lá); no código da 1ª rodada, 9 falham (R2-1 a R2-5, P12, Q2, Q10 e Q13). Defeitos plantados contra o código final: 57 de 59 do @dev (os 2 que escapam ficaram equivalentes à guarda nova do dia que passou) e 19 de 21 do QA (os mesmos 2 sem impacto do gate; o sábado lido em UTC só cai no fuso de São Paulo). Harness com retrato sintético: 3868 ok, com as mesmas 17 falhas do master. Área protegida idêntica. Chromium a 375 px (Firebase, planilha e ponte de mentira, dado inventado, relógio parado em 09/10/2026 09:00): «tirar só este dia» do Rafael, a pergunta, o grupo "não vai para a TV" com «pulado só hoje», a conferência tirando da planilha, «pôr de volta» (o banho volta), «mudar a hora só este dia» (15:30 na planilha) e «voltar para 10:00»; o sábado da Mel nos Lançamentos do dia de 10/10; Banhos recorrentes com Sáb e «Um dia só»; a Nina ganhando banho fixo no sábado pela tela; a planilha sem as linhas do sábado; e, na 2ª rodada, sem rede (o aviso em 6 s e a gravação quando a rede volta), «Pular este dia»/«Pôr de volta este dia» com a linha em dia na hora, o botão de ontem com a tela aberta desde ontem, e o monitor com os Lançamentos do dia sem erro de página. Sem rolagem lateral e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-04) — Escovação: quem não deixa escovar vira treino, como ele aceita e o kit dental

> Quadro de pedidos, linha 74 (08/out/2026): quem não deixa escovar (Bruce SRD, Ozzy Lhasa, Ozzy Spitz, Fiona Buldogue, Norberto, Rocky — deixa com o dedo —, Juma, Marta, Dolar, Lisa, Becca, Bis), o kit dental que ainda não tem e "vira cliente a trabalhar escovação". E1, E3, E4 e E5 aplicadas pela recomendação; **E2 (cobrar o kit do tutor) fica com a Adriana**. (Story 6.45 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (BC) Ficha › Prevenção › Check-up e escova; Prevenção (topo); Hoje na Zêluz

| Antes | Agora |
|---|---|
| A ficha só perguntava «Escova os dentes no Day Care?» Sim/Não (com o motivo do Não) | Para quem escova (Sim ou sem resposta): **«Como aceita a escovação?»** — «Deixa», «Só com o dedo (dedeira)» ou «Ainda não deixa — em treino». «Só com o dedo» e «Em treino» continuam escovando: **a troca de escova continua na cobrança**. Escolher numa ficha sem resposta grava o «Sim» junto (com o chip da escovação dos Encãotadores, a mesma regra da pergunta de 29/set). Em treino, a ficha mostra os últimos treinos («Últimos treinos: 09/10: deixou com o dedo, por …»). Com «Não escova», a pergunta não aparece |
| Não havia onde dizer se o kit dental do FILHOt está guardado aqui | **«Tem o kit dental aqui?»** Sim / Não, logo abaixo. Quem escova aqui (deixa, com o dedo, em treino **ou «Escova os dentes no Day Care? Sim» ainda sem «como aceita»**) e tem «Não» aparece em «Sem kit dental», na Prevenção, e a ficha avisa. Sem resposta ao kit não é "não tem": não entra na lista |
| Quem estava como «Não escova — Não deixa» ficava fora da escovação | **Prevenção, no topo: «Quem não deixa escovar — passar para treino?»** — só o «Não deixa» dos **Aulunos** ativos (o «O tutor não compra a pasta», o «Outro» e o «Não» sem motivo não entram; o hóspede da AuAulândia, o morador e o avulso também não, e não ganham o chip da escovação do Day Care). **«Passar para treino»** (1 toque) grava, só naquele FILHOt, «Sim» + «Ainda não deixa — em treino» + o chip da escovação; a confirmação verde diz que a troca de escova volta para a cobrança. **«Passar todos para treino (N)»** (com 2 ou mais na lista) pergunta antes, com os nomes; «Cancelar» não grava nada; a ficha que mudou enquanto a pergunta estava aberta fica como está, e o aviso diz («A troca de escova dele/dela/deles/delas volta para a cobrança»; com todos já mudados, «NENHUMA FICHA MUDOU», nunca "0 em treino"). Quem não atualiza a prevenção na tela vê a lista sem os botões. Tocar no nome abre a ficha |
| — | **Hoje na Zêluz: «Treinar escovação»** na linha de quem está em treino e está na casa hoje: **«Deixou», «Deixou com o dedo», «Não deixou»**. O resultado vai para a ficha (data, resultado, quem e quando); tocar de novo no mesmo dia troca o de hoje e guarda os dias antes. Sem resultado hoje, a linha mostra o último treino. Depois do «Deixou», a pergunta **«Ele já deixa? Passar para «Deixa»»** («Ela», para a FILHOt, pelo sexo da ficha em qualquer grafia: Fêmea, FÊMEA, F): a ficha só sai do treino com esse toque, nunca sozinha. Se outro aparelho marcou outro resultado hoje, o toque não passa: aparece **«A FICHA CONTINUA EM TREINO»** com o que foi marcado e por quem, e a tela se atualiza. Cada toque grava só o dia (um aparelho com a ficha desatualizada não apaga os dias que não viu). O treino não muda a conta "com pendência" do topo nem o contador do menu |
| — | **Prevenção, no topo: «Kit dental e escovação»** — «Em treino» (com os últimos resultados), «Só com o dedo» e «Sem kit dental» (cada linha diz só "sem kit dental"), com **«Baixar em Excel»** e **«PDF / imprimir»**: a mesma tabela (FILHOt, raça, tutor, como aceita, tem o kit dental aqui?, últimos treinos), uma linha por FILHOt |

- **Nada é cobrado do tutor e nenhuma mensagem nova ao tutor foi criada** (E2 é da Adriana). A troca de escova de quem passa para treino volta para a cobrança e a mensagem de sempre (AC 1); quem nunca teve troca registrada continua sem cobrança (a escova é opcional).
- **O rastro:** cada mudança (como aceita, kit, passar para treino, resultado do treino, passar para «Deixa») entra na auditoria como «ficha-escova», com quem e quando. O relatório baixado entra como «relatorio-baixado».
- **Quem grava:** na ficha, quem atualiza a ficha (Consultora, Supervisão, Gestão, Diretoria); na Prevenção e no Hoje na Zêluz, quem atualiza a prevenção na tela (o mesmo grupo). Monitor e plantonista: na Prevenção e no Hoje veem sem botões; na ficha veem os botões, que só avisam «SÓ QUEM CUIDA DA FICHA MUDA A ESCOVAÇÃO» e não gravam (igual à pergunta de 29/set).
- **Pergunta à Adriana (E2, não trava esta versão):** o kit dental é cobrado do tutor (pelo valor da escova das Configurações, com mensagem pronta) ou a Zêluz dá o kit? Recomendado: cobrar do tutor.
- **Não mudou:** «Escova os dentes no Day Care? Não» continua tirando a troca de escova de toda cobrança (6.16); o painel rápido «Escova os dentes aqui?» (6.35); a ficha aberta pela Prevenção com apóstrofo no tutor (6.51); o «Copiar lista» e o Excel do Hoje na Zêluz; check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`.
- **À parte (anterior a esta versão, igual no master):** a 375 px, a aba Prevenção da ficha fica 26 px mais larga que a tela por causa dos campos «Vence em (próxima)» das vacinas (medido: os mesmos 15 elementos, antes e depois; nenhum da escovação).
- **Onde está no código** (`auaulandia/index.html`): novas — `ESCOVA_ACEITA`, `ESCOVA_TREINO_RES`, `ESCOVA_TREINO_ULTIMOS`, `escovaRotulo`, `escovaAceitaRotulo`, `escovaTreinoResRotulo`, `escovaAceitaDe`, `escovaKitDe`, `escovaSemKit`, `escovaNaoDeixa`, `escovaTreinoLista`, `escovaTreinoTexto`, `escovaTreinoUltimosTexto`, `escovaAceitaPatch`, `escovaAtividadesDe`, `escovaCacheGravado`, `escovaAceitaFichaHTML`, `escovaFichaGravada`, `escovaAceitaSet`, `escovaKitSet`, `escovaJuntarNomes`, `escovaFichasDe`, `escovaNaoDeixaLista`, `escovaLinhaNomeHTML`, `escovaNaoDeixaCardHTML`, `escovaTreinoPatch`, `escovaTreinoGravar`, `escovaPassarTreino`, `escovaPassarTreinoTodos`, `escovaTreinoHojeHTML`, `escovaTreinoMarcar`, `escovaPassarDeixa`, `escovaKitDados`, `escovaKitCardHTML`, `escovaKitRelHTML`, `escovaKitExcel`, `escovaKitPDF`; e, na 2ª rodada (ajustes do QA), `escovaEscovaAqui`, `escovaEhAuluno`, `escovaNaoDeixaAuluno`, `escovaFemea`, `escovaDele`, `escovaTreinoGravarDia` (grava só `escova_treino/{dia}`) e `escovaCacheDia`. Alteradas (uma linha cada) — `escovaFichaHTML` (a pergunta nova), `renderPrevencao` (os dois quadros no topo) e `hojeRender` (o treino na linha). Campos novos na ficha: `escova_aceita`, `escova_kit`, `escova_treino`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (803 no total, 0 falhas; 29 da 6.45, com relógio fixo em 09/10/2026 e dado inventado; uma delas com o relógio adiantado no fuso de Brasília). Contra a base, as 29 falham e as 774 de antes passam. Defeitos plantados: os 41 do dev (29 da 1ª rodada, refeitos no código novo, e 12 da 2ª) e os 16 do QA independente, **todos pegos** (na 1ª rodada do QA, 8 dos 16 escapavam por falta de prova). Harness: **3868 ok, com as mesmas 17 falhas do master**. Área protegida idêntica ao master (155 funções ck/ckt/pt, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px e a 1280 px (Firebase de mentira, dado inventado, relógio fixo): o Bruce passa para treino na Prevenção, «Passar todos» (Marta e Rocky: "A troca de escova deles volta para a cobrança"), o hóspede e o morador fora da lista e sem chip, o «Sim» sem «como aceita» com kit «Não» em «Sem kit dental», «Deixou com o dedo» no Hoje vai para a ficha, dois aparelhos (o segundo marca «Não deixou» e o «Ela já deixa?» da tela velha não passa: «A FICHA CONTINUA EM TREINO»), o kit na ficha, o quadro e o PDF; sem rolagem lateral nas telas novas e sem erro de página.

## O que mudou em 09/out/2026 (v 2026-10-09-03) — Todo banho de hoje aparece: a Fiona e a planilha que a TV lê

> Adriana, 08/out/2026 (quadro de pedidos, linha 83): *"Fiona está no lançamento do dia no banho, no entanto não está aparecendo no dashboard. O que ocorreu? Preciso que todos apareçam."* O «dashboard» é a TV do Day Care. A causa do caso de 08/10 não foi confirmada (sem banco e sem planilha); a hipótese de maior peso é a TV sem recarregar desde 07/10. O defeito confirmado é outro, e é o fio dos casos Cristal e Ozzy (29/09) e Lana (01/10): o automático comparava os FILHOts pelo **primeiro nome**. (Story 6.49 — feita, ainda sem versão publicada; o @devops carimba a versão e a data deste título.)

### (AW) Lançamentos do dia › Banho; e o que se preenche sozinho na planilha (todas as colunas)

| Antes | Agora |
|---|---|
| **Duas Fionas** (Fiona/Buldogue Francês e Fiona/SRD) eram uma só para o automático: o banho fixo de uma passava por "na planilha ✓" sem ser escrito, porque a outra estava na coluna; a Fiona lançada à mão escondia a linha automática da outra e chegava a **tirar da planilha** o banho fixo dela; duas com banho fixo no mesmo dia viravam uma | **Quem é quem é a ficha.** O texto que casa **exatamente** com uma ficha só (o nome igual e, havendo xará, a raça ou o tutor) é aquela ficha; o que não casa com segurança vale o texto inteiro, nunca o primeiro nome. O erro de digitação não vale: um «Mel» sem ficha escrito na planilha não é o Bel/SRD (não segura o banho fixo dele nem lhe dá ✓). O xará que está nos Inativos não conta: «Boris» escrito à mão, com o Boris/Westie na casa e o Boris/Buldogue nos Inativos, é o Boris/Westie. As duas Fionas vão para a planilha, aparecem nos Lançamentos do dia e cada uma só ganha "na planilha ✓" com a própria célula. Vale para todas as colunas do automático: duas reposições, duas faltas avisadas ou duas restrições de xarás ficam as duas. "Ozzy - Lhasa" escrito à mão continua contando como o Ozzy/Lhasa (nada é escrito de novo) e as três Mayas continuam separadas pelo tutor. Um nome ambíguo escrito direto na planilha ("Fiona", com duas Fionas na casa) deixa de valer por uma delas: a TV pode mostrar as duas linhas — duplicado visível é melhor que banho sumido |
| O lançado à mão dizia nada quando a ponte respondia "ok" — e "foi para a planilha" não quer dizer "está na TV" (a TV só lê as linhas cuja Data está escrita "dd/mm/aaaa") | **Cada banho de hoje diz se está na planilha que a TV lê**, lida pela mesma porta e com as mesmas regras da TV: «na planilha que a TV lê ✓» (só com uma leitura feita **depois** do lançamento), «a caminho da planilha que a TV lê» (até 3 min), «NÃO está na planilha que a TV lê: a planilha não tem este banho nas linhas de hoje» + «pôr de novo», «NÃO está na planilha que a TV lê: está numa linha da planilha que a TV não lê (a data dessa linha está escrita diferente). Peça à Gestão para acertar a data.» ou «não consegui conferir a planilha que a TV lê agora (motivo)». Nunca "na TV ✓": daqui não se sabe se a TV foi recarregada, se está em outro dia ou sem internet. Os avisos que já existiam ("NÃO foi para a TV", "envio à planilha não confirmado", "a planilha recusou", "a conexão caiu") continuam e vêm antes. Vale para o lançado à mão e para a linha automática do banho fixo |
| Nada no alto da tela | **Aviso no alto** quando algum banho de hoje não está na planilha que a TV lê: "2 banhos de hoje NÃO estão na planilha que a TV lê:", um por linha, com a hora e o motivo, e o «pôr de novo». Some quando todos estão com ✓ |
| — | **«pôr de novo»** roda a conferência de hoje (a mesma do «Conferir a planilha agora», só para hoje): repõe o lançado à mão que sumiu e o banho fixo que falta. Não é uma porta nova de escrita, e a ponte não duplica. As linhas que estavam "a planilha não tem" ficam "a caminho" até a leitura seguinte |
| O banho fixo que o automático ia lançar e ainda não tinha lançado (antes da primeira conferência do dia, ou com a conferência parada) não aparecia em lista nenhuma | **"Banho fixo de hoje que o automático ainda não confirmou (N)"** no cartão Banho: «vai para a planilha na próxima conferência, em até 5 min» — ou por que ainda não: «este aparelho ainda está com o dia DD/MM» ou «a última conferência não conseguiu ler a planilha (motivo)». Se a planilha que a TV lê já tem a célula (outro aparelho conferiu), a linha diz «na planilha que a TV lê ✓». Botão **«Conferir a planilha agora»** (a conferência de hoje). Quando a conferência deste aparelho escreve, a linha vira a linha automática na hora, sem reler o banco |
| O banho fixo de quem faltou, de quem avisou a falta, de quem foi pulado, de quem é morador ou de quem não vem no dia simplesmente não aparecia | **"Banho fixo de hoje que não vai para a TV (N)"** no cartão Banho, com o motivo: faltou na chamada de hoje · falta avisada para hoje · pulado só hoje (por quem, quando) · feriado · está nos Inativos · mora na casa (o automático não lança banho fixo de morador) · não vem ao Day Care hoje, pela ficha. Faltou → **«Abrir Hoje na Zêluz › Banho de quem faltou»** (a decisão continua lá; daqui nada toca o check-in). Os outros → **«Lançar à mão»**, que só escolhe o FILHOt e a hora do combinado no painel do Banho (o shampoo do combinado vem marcado); nada é gravado sem o «Lançar na planilha» |
| «tirar» um lançamento repetido (o mesmo texto lançado em dois aparelhos) tirava da planilha a célula que o outro também usava, sem aviso | O app relê o item do dia antes: com outro lançamento do mesmo texto, sai só o lançamento, a célula fica, e a tela diz "A CÉLULA CONTINUA NA PLANILHA — Saiu só este lançamento. O mesmo texto («…») está em outro lançamento de Banho por {quem} às {hh:mm}…". Vale para todos os itens que vão para a planilha |
| O rastro do automático: "preencheu a planilha de … : 1 posto(s), 1 tirado(s)" | O rastro diz quem: "… — posto(s): Fiona/Buldogue Francês (SEM SHAMPOO) — tirado(s): …" (dá para achar a Fiona na Linha do tempo do dia) |
| O computador que passava a noite com os Lançamentos do dia abertos virava o dia com os banhos de ontem na memória, e a conferência da planilha de hoje os mostrava em vermelho como "banhos de hoje que NÃO estão na planilha que a TV lê" | Com o dia virado, a tela não confere os lançamentos de ontem contra a planilha de hoje (nem a lista do banho fixo, nem o aviso do alto) e **relê sozinha os lançamentos de hoje** (uma vez, pelo vigia da tela). Gravar continua barrado até atualizar o aparelho (a faixa do topo) |
| — | **Na troca de versão, o app só tira da planilha o que é dele com certeza.** Enquanto um aparelho ainda está na versão anterior, o registro do dia perde a lista inteira; o aparelho novo só refaz essa lista no **Banho do banho fixo** (o texto leva o detalhe do combinado em maiúscula, "(SEM SHAMPOO)", que ninguém escreve à mão). Nas colunas que pessoas também escrevem (Reposição, Faltas Avisadas, AUniversariante, Cliente Novo, Adaptação, as restrições de aulunos e de hóspedes), o "Nome/Raça" de uma pessoa é igual ao do app: **na dúvida, a célula fica**, e o alto dos Lançamentos do dia daquele dia diz **«Na dúvida, o app não tirou da planilha de DD/MM/AAAA: ficou na planilha: Fiona/SRD (coluna "Faltas Avisadas") — tire à mão se não vale mais»**, com o porquê. Vale para hoje e para os próximos 14 dias; o aviso some quando alguém tira a célula, quando ela é lançada à mão ou quando o automático volta a querê-la |

- **A leitura** é a que o app já faz da planilha do Day Care (a mesma porta pública da TV): no máximo **uma por minuto por aparelho**, só com a tela Lançamentos do dia à vista e em hoje, e só se há banho hoje. A leitura que o Day Care já fazia, quando é recente, serve também. No banco, só duas leituras novas: a do «tirar» (uma vez por toque) e, com a tela aberta quando o dia vira, a releitura dos lançamentos de hoje (a mesma de abrir a tela, uma vez por dia e por aparelho). O aviso «ficou na planilha» usa o registro do dia que a tela já leu.
- **Registro do automático, versão 2:** `daycare/dashboard-auto/{dia}` guarda o estado de cada nome pela identidade da ficha (`_estado_v` 2), a lista inteira em `_listas` quando há xarás de primeiro nome, quando o automático escreveu o banho (`escrito`) e, só nos dias com dúvida da troca de versão, o que ficou na planilha (`_ficou`). Para o aparelho que ainda não atualizou, a chave do primeiro nome leva só o que ele lê (o ✓ ou o motivo da recusa e a hora): até recarregar, ele mostra o ✓ sem o "enviado em". O registro de antes desta versão continua lido (Lançamentos do dia e tela de Reposições).
- **Tamanho do registro (medido, dado inventado):** 60 fichas (7 grupos de xarás) — 7.731 bytes antes da 6.49, 13.896 bytes agora (1,80 vez; a primeira versão desta mudança dava 20.785, 2,69 vezes); o exemplo de 24 fichas do QA — 2.942 → 5.251 bytes (1,78 vez). A quantidade de leituras não muda; cada leitura do registro pesa isso a mais enquanto a ponte entre versões estiver ligada.
- **Publicação:** publicar fora do horário de banho e **recarregar todos os aparelhos** (a faixa de versão). Enquanto um aparelho ainda estiver na versão antiga, ele lê o registro novo sem desfazer o que esta versão fez, e quando ele regrava o registro do jeito antigo (sem a lista inteira), o aparelho novo refaz a lista pela ficha e continua tirando da planilha o banho fixo do segundo xará que faltou, foi pulado ou desligado; nas outras colunas, na dúvida, a célula fica com o aviso «ficou na planilha». Fica um caso que já era defeito do aparelho antigo: uma Fiona lançada à mão e o banho fixo da outra Fiona no mesmo dia (o aparelho antigo tira, o novo põe de volta, até todos atualizarem).
- **Perguntas à Adriana (do quadro; não travam):** **FI1** — o «dashboard» é a TV do Day Care? (tratada como sim). **FI2** — banho fixo de quem vem só para o banho: o app lança sozinho? (recomendado: não; ele aparece em "não vem ao Day Care hoje", com «Lançar à mão»). **FI3** — hóspede da Auaulândia com banho lançado aparece na TV? (recomendado: sim; já é assim no lançado à mão).
- **Fora desta versão:** a TV (abrir no dia de Brasília, virar o dia sozinha, recarregar com versão nova, a data crua da linha, a versão no rodapé) é outro repositório; a ponte versão 7 no Apps Script (5 min, Adriana ou Gestão) continua pendente; a trava do «Lançar» entre aparelhos; as vagas pela ficha (depois da 6.46); o mesmo "está na planilha que a TV lê?" em Veterinário, Medicação, Avaliação e Sai cedo.
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada`, `banhoFaltaEstaAqui` e a contagem das vagas (`vagasNomeChave`).
- **Onde está no código** (`auaulandia/index.html`): novas — 3ª rodada do QA: `dashAutoFicouHTML` (e `dashAutoListaRefeita` e `dashAutoSincronizar` alteradas: só com prova, o `_ficou`); 2ª rodada do QA: `dashIdentFicha`, `dashIdentSoAtivas`, `dashAutoTextoDaFicha`, `dashAutoListaRefeita`, `dashAutoEstadoParaAntigo`, `dashAutoCacheAtualizar`, `dashDadosDeHoje`, `dashTvHoje`, `dashTvRelerDia`, `dashBanhoFixoClassificar`, `dashBanhoFixoACaminho`, `dashBanhoFixoACaminhoHoje`, `dashBanhoFixoACaminhoTexto`; 1ª rodada: `dashAutoIdent`, `dashAutoIdentador`, `dashIdentCalcular`, `dashIdentConferir`, `dashIdentAssinatura`, `dashIdentTexto`, `dashAutoListaDoRegistro`, `dashAutoPonteVersoes`, `repPlanEstadoChave`; a cópia das regras da TV `tvEspelhoBanho`, `tvLinhasDaTabela`, `tvV`, `tvHas`, `tvParseHora`, `tvTiraAcento`, `tvDataTexto`, `tvBanhoForaDaData`, `tvBanhoNaTV`; a leitura `tvBanhoLer`, `tvBanhoTique`, `tvBanhoPrecisaLer`, `tvBanhoTelaVisivel`, `tvBanhoLigar`, `tvTabelaGuardar`, `tvLerDiaGuardar`, `tvBanhoMexeu`, `tvBanhoErroTexto`, `tvBanhoLeitura`, `tvBanhoEstado`, `tvBanhoMotivoTexto`; a tela `dashTvBanhoLinhas`, `dashTvLinhaDaMao`, `dashTvLinhaDoAuto`, `dashTvComEstado`, `dashTvMaoHTML`, `dashTvAutoHTML`, `dashTvEstadoHTML`, `dashTvAvisoHTML`, `dashTvPorDeNovo`, `dashBanhoQuemVem`, `dashBanhoFixoMotivo`, `dashBanhoFixoFora`, `dashBanhoFixoForaHTML`, `dashBanhoFixoLancarMao`, `dashBanhoFixoAbrirFaltou`; o «tirar» `dashRemoverDaPlanilha`, `dashMesmoTextoEmOutro`. Alteradas — `dashAutoCalcular`, `dashAutoSincronizar`, `dashAutoLinhas`, `dashAutoListaDoDia`, `dashChavesDaMao`, `repPlanEstadoNome`, `repPlanHoraNome`, `repPlanHoraSemColuna`, `renderDash`, `dashCarregar`, `dashEspelhar`, `dashRemover` e `carregarPlanilhaDia` (uma linha: guarda a tabela). Iguais ao master: `dashAutoNomeChave`, `vagasNomeChave`, `dashLancar`, `dashNomePlanilha`, `planCasar`, `banhoFaltaEstaAqui`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (775 no total com a 6.47 e a 6.51, 0 falhas; 55 da 6.49 — 31 da 1ª rodada, 17 da 2ª, 6 da 3ª e 1 do gate final —, entre elas Fiona/Buldogue × Fiona/SRD em todas as combinações, o «Mel» × Bel/SRD, a troca de versão, o xará inativo, o dia que vira e o banho fixo a caminho; 5 antigas ajustadas à chave nova). Harness: **3868 ok, com as mesmas 17 falhas do master** (3 conferências ajustadas à chave nova). Defeitos plantados: 1ª rodada, 61 (59 pegos, 2 equivalentes explicados); 2ª rodada, 47 (42 nas linhas novas e os 5 do QA que escapavam): 45 pegos, todos os 5 do QA entre eles, e 2 equivalentes explicados na story; os 61 da 1ª rodada, rodados de novo, pegam os 56 que ainda se aplicam; 3ª rodada, 111 (21 nas linhas novas, os 25 do 2º QA, os 18 do caçador e os 47 da 2ª rodada, de novo): 106 pegos, os que escapam são equivalentes explicados na story. A cópia das regras da TV conferida contra o código da TV no mesmo exemplo. Área protegida idêntica ao master. Chromium a 375 px e a 1280 px (Firebase, planilha e ponte de mentira, dado inventado): as duas Fionas (uma fixa, uma à mão) com ✓, o aviso do alto, «pôr de novo», a lista do banho fixo fora, «Lançar à mão» → «Lançar na planilha» com a hora do combinado; na 2ª rodada, o banho fixo a caminho (vira a linha automática quando a conferência escreve) e o nome com erro de digitação («Mel» e «Lua» escritos à mão: o Bel/SRD e a Luna/Poodle vão para a planilha, sem ✓ falso — na versão anterior, os dois ficavam fora com a Luna em ✓); sem rolagem lateral e sem erro de página; na 3ª rodada, o aviso «ficou na planilha» no alto da tela, a 375 px e a 1280 px, com a ponte sem nenhum pedido de tirar.

## O que mudou em 09/out/2026 (v 2026-10-09-02) — Prevenção: a ficha de quem tem tutor com apóstrofo no nome funciona

> Pendência P1 do QA48 da story 6.11, igual no master: na ficha aberta pela tela **Prevenção** (toque no nome do FILHOt), um tutor com apóstrofo no nome ("Ana D'Ávila", "Clínica D'Or") travava os botões de **todos** os itens, sem aviso. (Story 6.51)

### (AX) Prevenção › toque no nome › a ficha "Lance aqui mesmo"

| Antes | Agora |
|---|---|
| Tutor com apóstrofo no nome: **"Feito em"** não refazia o "Vale até", **"Quem deu"** (Day Care · Tutor em casa), **"Salvar"** e **"fechar"** não faziam nada, em todos os 10 itens (check-up, vacinas, carrapaticida, coleira, vermífugo, exame de fezes e troca de escova). No Chromium, 41 dos 42 botões davam erro de página | Os 42 botões funcionam e cada um acha os próprios campos |
| Tutor com aspas, barra invertida ou `&` no nome: os mesmos botões morriam (com a barra, a chave chegava errada e o Salvar não achava os campos); com `<`/`>` junto, as datas sumiam e aparecia código na ficha | A ficha sai inteira e todos os botões funcionam |

- **Por quê:** a chave do FILHOt junta o nome e o tutor e ia crua para dentro do botão; o apóstrofo fechava o texto do botão no meio. Agora a chave vai protegida nos botões (`jsAspas`) e nos campos (`escAttr`), como já ia nos botões da tabela que abrem a ficha.
- **Não mudou:** para tutor sem apóstrofo, aspas ou barra, a ficha sai **igual** à de antes (mesmo HTML). Nada do que é gravado mudou. Check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*` intocados.
- **Onde está no código** (`auaulandia/index.html`): `prevEdicaoHTML` (as chaves `chJs` e `chId`).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (720 no total, 0 falhas; 3 da 6.51, que desenham a ficha com "Ana D'Ávila", com aspas, barra invertida, "<" e "&" no tutor e com um tutor comum, compilam e rodam cada botão e conferem que o campo procurado existe). Contra o master, as 2 primeiras falham. Defeitos plantados: 23, todos pegos — 11 do dev (os 5 botões e os 4 campos de volta crus, as duas chaves trocadas e o id do "Feito em" errado) e 12 do QA independente (entre eles o nome do produto ou da vacina, `prevN_`, e os campos do produto do carrapaticida, que as provas passaram a conferir depois do QA). Harness: **3868 ok, com as mesmas 17 falhas do master**. Área protegida idêntica ao master (155 funções ck/ckt/pt, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px, tocando cada botão: no master, com "Ana D'Ávila", 41 erros de página em 42 botões; na versão nova, 42 de 42 com a chave certa e nenhum erro.

## O que mudou em 09/out/2026 (v 2026-10-09-01) — A dose de remédio de ontem que ninguém viu toca depois da virada

> Quadro de pedidos (linha 62, "Consertos achados nas revisões") e backlog da story 6.32 (linha 49: *"tocar as doses atrasadas do dia velho antes da troca"*). A 6.32 fez o alarme de remédio atravessar a meia-noite, mas só para a dose **adiada**. A dose das 23:30 que nunca abriu o alarme (celular congelado no bolso, tela apagada, segunda dose na fila atrás de outra) **sumia** depois da meia-noite: a tela passava para hoje, ou a página recarregava, e ninguém era chamado; só o vigia do servidor cobrava, de manhã. (Story 6.47)

### (AH) Alarme de remédio da plantonista › a dose de ontem depois da meia-noite (ajustes)

| Antes | Agora |
|---|---|
| A dose de ontem sem registro e sem ADIAR sumia na virada | **A tela espera em ontem só enquanto há remédio de ontem por responder:** o alarme de ontem na tela, a próxima dose da fila (uma de cada vez, a mais antiga primeiro) ou a conferência curta do registro de ontem (no máximo 2 minutos). «Dei o remédio» grava **no dia da dose** (ontem). Quando nenhuma sobra, a tela passa para hoje e as doses de hoje tocam |
| O alarme dizia só «às 23:30», sem o dia nem o atraso | "Bia toma Apoquel — 1 comprimido **às 23:30 de ontem — há 50 min**" (o "há X" acompanha o relógio) e "Dose de ontem: confira se ninguém deu antes de dar. Se ninguém deu, dê o remédio agora — este alarme não desaparece sozinho." |
| Não havia regra para até quando a dose de ontem pode ser dada de madrugada | **Teto** (pergunta D1): o **menor** entre **3 horas** depois do horário e **a metade do intervalo até a próxima dose** do mesmo remédio. Uma vez por dia ou de 12 em 12 h: até 3 h; de 4 em 4 h: até 2 h. Fora do teto, a dose não toca, não segura a tela e nada é gravado |
| — | **Depois do teto,** o alarme aberto diz **«Passou do horário seguro desta dose: não dê sem falar com a veterinária.»**, e o ADIAR vira **«Entendi — não vou dar»**: fecha o alarme neste aparelho, ele não volta e nada é gravado no registro das doses (fica só o rastro da auditoria). «Dei o remédio» continua possível, se a veterinária mandar dar. Nos 30 segundos antes do teto: «Está no limite do horário seguro desta dose: não dê sem falar com a veterinária.» |
| A dose dada tarde e a próxima do mesmo remédio podiam tocar quase juntas, as duas mandando dar | **Só a próxima dose do mesmo remédio** avisa: «A dose anterior deste remédio (22:30 de ontem) foi registrada às 02:25, depois do horário seguro: não dê sem falar com a veterinária.», também com «Entendi — não vou dar». Vale para a dose de ontem dada pelo alarme depois do teto e para a de hoje dada pelo alarme de madrugada (0h às 6h); de dia, o alarme de hoje manda dar a qualquer atraso |
| O ADIAR tocado a cada volta segurava a tela em ontem e calava as doses de hoje de todos os FILHOts | **O ADIAR não segura a tela:** ela passa para hoje, as doses de hoje tocam na hora, e o adiado volta em 5 minutos **com a tela em hoje**, registrado no dia da dose. Já dado em outro aparelho, não volta. O remédio que saiu da agenda (o FILHOt foi para casa, a veterinária suspendeu, o horário mudou) é descartado com o aviso «ALARME ADIADO QUE NÃO VOLTA», sem gravar nada |
| «Hoje» (o botão, o da ficha e as setas que chegam a hoje) levava a tela para hoje com remédio de ontem por responder, e a dose sumia | **Pergunta antes:** «HÁ REMÉDIO DE ONTEM POR RESPONDER» (Responder o alarme · Ir para hoje mesmo assim); enquanto o registro de ontem é conferido, «CONFERINDO OS REMÉDIOS DE ONTEM». O toque na faixa com o alarme de ontem na tela também pergunta antes: «HÁ UM REMÉDIO DE ONTEM SEM REGISTRO» (Responder o alarme · Atualizar mesmo assim) |
| A ficha navegada para ontem mostrava «—pendente—» na dose que passou | Mostra **«—faltou—»**; a de amanhã continua «—pendente—» |
| A 375 px, a faixa «O dia virou» cobria o nome do FILHOt no alarme | O alarme de remédio abre **logo abaixo da faixa** |
| A dose de ontem adiada e registrada pela **ficha** («Dei agora»), com a tela já em hoje, caía em hoje: a das 23:30 de hoje ficava "dada" e não tocava | Vai para **o dia da dose adiada** (a dose, o espelho das fichas irmãs e o estoque), e a tela diz **«DOSE REGISTRADA NO DIA DELA»** ("A das 23:30 de hoje continua por dar."). Registrar **outra** dose pela ficha não fecha o alarme de ontem na tela: só o da mesma dose, do mesmo dia |
| A dose de ontem dada com a tela já em hoje descontava o estoque no dia de hoje | O estoque é descontado **no dia do registro** da dose |

- **Perguntas à Adriana (remédio; não travam esta versão; M1 e M2 no quadro de pedidos):** **D1** — até quando a dose esquecida de ontem toca de madrugada? Aplicado pela recomendação: o menor entre 3 h e a metade do intervalo até a próxima dose (vale confirmar o número com a veterinária); alternativas: 3 h fixas, ou 1 hora. Junto da D1, o que o alarme faz depois do teto: aplicado, fica na tela dizendo «não dê», com «Entendi — não vou dar»; alternativas: fechar sozinho sem gravar, ou «Falei com a veterinária». **D2** — a dose de ontem que passou do teto e ficou sem registro aparece para a Gestão, num bloco «De ontem, sem registro» do painel «Medicações de hoje», até as 12h? Recomendado: sim, numa story à parte (é tela nova); alternativa: só o Telegram do vigia do servidor, como hoje.
- **Aparelhos com a versão antiga** continuam deixando a dose de ontem sumir até recarregar o app: depois da publicação, recarregar os celulares das plantonistas.
- **Não toca depois da meia-noite:** o Day Care (inclusive a dose da pernoite lançada no check-in de pertences); quem tinha saída marcada para ontem; a tela posta à mão em outra data; os aparelhos de quem não recebe o alarme (Gestão, recepção). O vigia do servidor cobra de manhã as de ontem das 21h em diante. A dose adiada volta sempre.
- **Limites (registrados na Story 6.47):** app aberto do zero depois da meia-noite (aba descartada pelo celular, iPhone que recarrega a aba, celular reiniciado): a dose de ontem não toca, só o vigia do servidor, de manhã (fica para uma story própria). O remédio suspenso pela veterinária em **outro** aparelho só sai da agenda deste depois que a lista de hóspedes é relida. O celular que acorda com a conexão morta sem saber pode abrir o alarme com o registro velho (o alarme manda conferir, e «Dei o remédio» continua barrado se outra pessoa já assinou). Um alarme na tela por vez (regra da 6.32): sem resposta, as doses de hoje esperam. Com a ficha posta à mão em ontem, o adiado não toca: parado 3 minutos, a página recarrega e ele não volta. A mensagem do Telegram da dose de ontem não diz "de ontem" nem o atraso. Nada foi medido num celular de verdade.
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e as funções `ck*`/`ckt*`/`pt*`; o retrato do vigia (`medVigiaGravar`) e o vigia do servidor. Nenhum registro de "não dada" é gravado.
- **O detalhe rodada a rodada** está no bloco da story 6.47, dentro da seção de 06/out/2026 (AH).
- **Onde está no código** (`auaulandia/index.html`): novas — `zDiaOntemEstado`, `zDiaOntemPendente`, `zDiaOntemSegura`, `zDiaHojePergunta`, `medOntemNaJanela`, `medOntemTeto`, `medOntemPendentes`, `medOntemResponder`, `medOntemAcordou`, `medOntemSincronizado`, `medOntemLigarConexao`, `medOntemBatida`, `medOntemVisibilidade`, `medOntemReconferir`, `medOntemPendNaoDar`, `medDoseTsNoDia`, `medDespTextos`, `medDespRedesenhar`, `medAtrasoTexto`, `medRotuloDia`, `medDiaAnterior`, `medDiaSeguinte`, `medProximaDose`, `medTardiaMarcar`, `medTardiaAviso`, `medNaoVouDar`, `medNaoDarFeito`, `despMedSegundoBotao`, `medAdiadoPendente`, `medAdiadosPendentes`, `medAdiadoDeOutroDia`, `medAdiadoSoltar`, `medAdiadoForaDaAgenda`, `medAdiadoDescartar`, `medAdiadoVoltaNaoDar`, `medAdiadoAvisarDescarte`, `medAdiadoMostrarDescarte`; e `MED_ONTEM_TETO_MS`, `MED_ONTEM_CONF_MS`, `MED_ONTEM_BEIRA_MS`, `MED_ONTEM_SINC_MS`, `MED_ONTEM_PULO_OCULTO_MS`, `MED_TX_PASSOU`, `MED_TX_BEIRA`, `MED_NAO_VOU_DAR_TX`, `MED_AGENDA_DIA`, `MED_AGENDA_INTEIRA`, `MED_AGENDA_SUSPENSOS`, `despMedAtualDia`, `despMedOntemPend`, `despMedSnoozeDia`, `despMedSnoozeIt`, `despMedNaoDar`, `__medDescarteAviso`. Alteradas — `checarDespertadorMed`, `mostrarDespertadorMed`, `confirmarDoseDespertador`, `adiarDoseDespertador`, `fecharDespertadorMed`, `registrarDoseAgendadaGlobal` (`_diaOutro` e `_fecharSeDaDose`), `carregarAgendaMedTodos`, `statusDoseMed`, `renderPlacarMedDia`, `descontarEstoquePorDose`, `zDiaTelaAvancar`, `zViradaDoDiaTick`, `aplicarVersaoNova`, `aplicarLogin`, `zFaixaVersao`, `goToToday`, `fichaHoje`, `changeDate` e `fichaMudaDia`; no CSS, `.desp-med` abaixo da faixa (`--z-faixa-topo-h`).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (717 no total, 0 falhas: as 668 da versão de 08/out e 49 da 6.47 — 17 da 1ª rodada, 11 da 2ª, 12 da 3ª, 4 da 4ª e 5 da 5ª —, todas com relógio fixo; 2 da 6.32 ajustadas, e a da dose adiada reescrita com relógio fixo). Contra o master, falham as da 6.47 e as 2 da 6.32 ajustadas. Relógio de São Paulo deslocado (17 horários, da madrugada à noite) e fusos trocados: só as falhas que o master também tem nesses horários. Defeitos plantados: 280 nas cinco rodadas do dev (276 pegos; 4 equivalentes, explicados na story) e, no gate final, 32 do QA nas linhas da última rodada e os 34 do gate anterior refeitos no código final (todos pegos). Harness: **3868 ok, com as mesmas 17 falhas do master**. Área protegida idêntica ao master (155 funções ck/ckt/pt, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px (Firebase de mentira, dado inventado, relógio de São Paulo): o alarme «23:30 de ontem — há 50 min» abre 5,5 s depois de o celular acordar, «Dei o remédio» grava em 07/10, a tela passa para 08/10 e o alarme da dose das 00:30 de hoje abre às 00:25 (na versão anterior, nenhum alarme de ontem e nada gravado); Bia e Thor tocam uma depois da outra; o ADIAR às 23:50 não segura a tela, e o adiado volta pelo dia dele; o alarme que passa do teto troca o ADIAR por «Entendi — não vou dar»; a dose adiada dada pela ficha grava em 07/10, e o alarme de outra dose continua na tela; sem rolagem lateral e sem erro de página. QA final: PASS (gate e caçada adversarial).

## O que mudou em 08/out/2026 (v 2026-10-08-01) — A mesma falta avisada lançada duas vezes não vira dois créditos

> Adriana, quadro de pedidos (linha 42): *"Troca de dia não é reposição (Coco Chanel, Billy Paul, Bis Leon) (25 e 28/09)."* No mesmo aparelho, a troca lançada duas vezes já dava um crédito só (6.39). Ficava aberto: dois aparelhos ao mesmo tempo, o aparelho recém-aberto e o dia de repor já ocupado. Depois que ele vem, sobrava saldo 1 fantasma, e o próximo dia extra saía como reposição em vez de avulso (R$ 97,00 matriculado; R$ 170,00 não matriculado). (Story 6.46)

### (AV) Reposições › «+ Falta», «Marcar reposição», «+ Marcar troca», Extrato e o quadro de pedidos de encaixe da Márcia

| Antes | Agora |
|---|---|
| **«+ Falta» em dois aparelhos** (Um dia só, Alguns dias, Um período), «+ Faltou — dar 1 reposição» da ficha e «Avisar a Márcia»: os dois toques gravavam, cada um numa chave aleatória, e a mesma falta virava dois créditos | **Uma falta por FILHOt e por dia.** O crédito é gravado numa chave fixa (`fa-` + a data), por transação. Se outro aparelho já lançou, nada entra e a tela diz quem e a que horas: "A falta avisada de 13/10/2026 acabou de ser lançada em outro aparelho (por Recepção X, às 09:12). Ela já está no Extrato e já conta no saldo. Nada foi lançado de novo." Estornada, a data volta a valer (`fa-2026-10-13-2`), e o estorno antigo não anula o crédito novo |
| "Alguns dias" ou "Um período" com parte já lançada em outro aparelho entrava inteiro | Entram só os dias novos: "Entrou: 14/10/2026. Já estava lançada em outro aparelho: 13/10/2026 (ficou como estava)." O "Saldo agora" e a mensagem ao tutor contam as duas. O dia de repor não some calado: "O dia de repor (21/10/2026) não foi marcado: marque em «Marcar reposição»." ou "…já estava marcado no lançamento do outro aparelho." |
| «+ Falta» com um dia de repor que já tem a troca ou a reposição dele gravava mais um crédito | Recusa, como a «Marcar troca» já fazia: "Fredo já tem a troca de 13/10 marcada para 14/10/2026. Escolha outro dia de repor ou deixe em branco. Nada foi lançado." |
| **A troca já feita** («+ Marcar troca», «Marcar reposição › troca», Lista de troca) refeita em outro aparelho virava outro crédito | "Essa troca já está feita (em outro aparelho, por Recepção X): 13/10/2026 → 14/10/2026. Nada foi lançado de novo." A reposição marcada para o dia novo só é desmarcada depois que o crédito da troca entra. A troca (ou a falta) desfeita no outro aparelho entra de novo, numa chave nova, sem apagar o histórico da desfeita. O crédito da saída antecipada da hospedagem não é usado pela troca |
| Repetidas já gravadas apareciam no Extrato como dois créditos comuns | **Selo nas linhas do par:** «Repetida — lançada 2 vezes: Recepção X em 25/09/2026 às 09:10 · Recepção Y em 25/09/2026 às 09:11». Só mostra: o «Estornar» continua o de sempre, por uma pessoa |
| **Extrato não lido:** o aparelho recém-aberto (o Extrato de reposições ainda não chegou) lançava sem saber o que já estava lá | Os caminhos que criam crédito esperam: "Ainda estou trazendo o Extrato de reposições. Espere uns segundos e confirme de novo: assim a mesma falta não entra duas vezes." Sem internet ou com a leitura recusada pelo banco, a tela diz qual dos dois. Vale também para o avulso do «Marcar reposição», o «Avisar a Márcia» e a autorização da Márcia. Casa sem nenhuma reposição (Extrato vazio, mas lido) lança normalmente |
| **Quadro da Márcia:** a autorização em dois aparelhos lançava o encaixe duas vezes | **Reserva:** o pedido é reservado por transação (pela hora do servidor) antes de lançar. O outro aparelho: "Este pedido já está sendo autorizado em outro aparelho (por …). Nada foi lançado de novo." No quadro, o pedido fica **"em autorização por {quem}"**, sem botões; se o aparelho fecha no meio, a reserva volta a valer em 2 minutos e o quadro se redesenha sozinho (aceso) |
| Autorizar e recusar sem conferir o que já entrou | **Sem dobrar:** o «Recusar» só grava em pedido ainda em aberto. A conexão que cai depois do lançamento não reabre o pedido: o quadro mostra "Lançado neste aparelho; falta marcar o pedido como autorizado." (ou "A conexão caiu no meio da gravação; toque em «Autorizar» de novo.") e só o «Autorizar», que fecha sem lançar de novo. O pedido que mudou durante a pergunta: "O pedido mudou enquanto a senhora decidia (…). Nada foi lançado: confira de novo." A troca já feita fecha como "autorizado", com a nota "já estava feita por …". «Avisar a Márcia» de novo com o pedido em autorização ou já autorizado não pede outra vez |
| **Avulso já lançado** nos Lançamentos do dia: o «Autorizar» lançava outro, o «Recusar» deixava o avulso cobrado, e a reposição ou a troca entrava em cima dele | «Autorizar» de avulso fecha como "autorizado", com a nota "já estava lançado por …", sem lançar. «Recusar» não recusa: "O encaixe já está lançado (…): recusar não tira o lançamento. Nada foi recusado…" (sem resposta do banco em 6 s, também não recusa). «Autorizar» de reposição ou troca: "Fredo já tem um avulso lançado em 14/10/2026 (R$ 97,00): tire o avulso dos Lançamentos do dia antes de autorizar a reposição, para não cobrar duas vezes." |

- **Perguntas à Adriana (dinheiro de cliente; não travam esta versão):** **D1** — o Extrato oferece "Estornar a repetida", uma por vez, com confirmação? (recomendado: sim). **D2** — a repetida que ele já usou (estornar deixaria o saldo em −1): a casa absorve e só registra? (recomendado: sim; alternativa: cobrar o dia como avulso). **D3** — **caso B**: "Um dia só" no dia de repor de uma troca ou reposição dele (no mesmo aparelho) ainda dá dois créditos; não criar o crédito e oferecer «Desmarcar» a reposição? (recomendado: sim; muda a decisão registrada na 6.39).
- **Decisão aplicada pela recomendação (pode mudar):** o aparelho sem internet desde que abriu espera o Extrato chegar antes de lançar falta.
- **Aparelhos com a versão antiga** continuam gravando a falta pelo jeito antigo (chave aleatória) até recarregar o app: depois da publicação, recarregar todos os tablets.
- **O que já foi gravado não muda sozinho:** as repetidas de antes desta versão só ganham o selo (a decisão sobre estornar é a D1). A conferência dos pares já repetidos no banco de verdade não foi feita (sem acesso à produção).
- **Residuais registrados na Story 6.46** (lista completa lá): «Marcar reposição» num crédito cujo estorno ainda não chegou ao Extrato (já existia); caso C em dois aparelhos no mesmo instante; "em outro aparelho" dito também no mesmo aparelho sem rede; «+ Marcar troca» com a conexão caindo no meio, ao converter a reposição marcada; dois FILHOts com o mesmo nome da planilha e o avulso lançado sem a ficha; o refeito de uma troca que não entrou; o «Recusar» ainda visível nos outros aparelhos para o encaixe que já entrou (o toque confere e barra). O comportamento do Firebase de verdade na queda no meio de uma transação não foi testado (só com banco de mentira).
- **Fora desta story:** renomear FILHOt ou tutor deixa as reposições na chave antiga; «Veio repor hoje» em dois aparelhos grava dois usos. Cada um terá story própria.
- **Não mudou:** check-in do corpo, pertences, `#v-daycare`, `pendAvisarChegada` e o crédito da saída antecipada da hospedagem (`sa-`, `hospConfirmarAntecipada`).
- **Onde está no código** (`auaulandia/index.html`): novas — `repFaltaChave`, `repRelerLancamentos`, `repRecusasConferir`, `repConexaoCaiu`, `repExtratoEsperaTexto`, `repSaidaAntecipada`, `repVoltaOcupada`, `repVoltaOcupadaTexto`, `repJaLancadaTexto`, `repParteJaLancadaTexto`, `repVoltaRecusadaTexto`, `repTrocaJaFeitaTexto`, `repTrocaFeitaNoExtrato`, `repTrocaJaFeitaConferir`, `repRepetidas`, `repRepetidaSelo`, `repHoraDe`, `repQuandoDe`, `repQuemDe`; no quadro da Márcia, `vagasReservar`, `vagasPedidoLivre`, `vagasReservaNossa`, `vagasQuemReservou`, `vagasReservaTexto`, `vagasReservaVigiar`, `vagasAgora`, `vagasCarimboServidor`, `vagasPedidoEstado`, `vagasDevolvidoTexto`, `vagasMesmoPedido`, `vagasJsonEstavel`, `vagasPedidoTipoTexto`, `vagasPedidoMarca`, `vagasPedidoOcupado`, `vagasPedidoOcupadoTexto`, `vagasMesmoEncaixe`, `vagasEncaixeDePe`, `vagasLancadoChave`, `vagasLancadoAqui`, `vagasLancadoDoPedido`, `vagasAutorizadoNosso`, `vagasAvulsoDoFilhot`, `vagasAvulsoNoDiaLer`, `vagasEncaixeLancadoTexto`, `vagasTrocaDesfeitaDepois`, `vagasPedRedesenhar`; e `REPO_LIDO`, `REPO_ERRO`, `REP_EXTRATO_ESPERA`, `VAGAS_LANCADOS`, `VAGAS_RESERVA_MS`, `VAGAS_RELOGIO_DIF`. Alteradas — `repGravar` (com chave, por transação), `repConfirmar`, `repTrocaGravar`, `repTrocaFeitaModal`, `dxVereditoTroca`, `dxConfirmar`, `dxPedir`, `vagasPedir`, `vagasAutorizar`, `vagasRecusar`, `vagasPedCarregar`, `vagasPedidosAbertos`, `vagasPedidosHTML`, `repAbrirExtrato` e `wireFirebaseListeners` (o ouvinte do Extrato marca a leitura e o erro). Iguais ao master: `repSaldo`, `repUsar`, `repEstornar`, `repAnulados`, `repAgendarVolta`, `repCreditoVivoNaData`, `dashLancar`, `dxLancarAvulso`, `dxVeredito`, `hospConfirmarAntecipada`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (668 no total, 0 falhas; 58 da 6.46: as 15 dos critérios e as das cinco rodadas do QA e dos ataques de saldo; cada achado com prova que falha no código de antes). Harness: v-33 e v-51 com o Extrato lido; **3868 ok, com as mesmas 17 falhas do master**. Rodadas de ataque reaplicadas no código final: 706, 677 e 675 provas, 0 falhas. Defeitos plantados: 232 (D1 a D15, M1 a M41, N1 a N43, V1 a V55 e X1 a X33 do dev; QC-M14, -17 e -41, QD-M1 a M16 e Q1 a Q26 do QA); escaparam só 4 equivalentes explicados (N14, V15, QD-M15 e Q3) e 1 refatoração hipotética (Q14); o quadro sem acender só aparece com CSS e é pego no Chromium. Simulador de dois aparelhos: um crédito por falta nos cenários desta story; o caso B continua com dois (pergunta D3). Área protegida idêntica ao master (155 funções ck/ckt/pt, `#v-daycare` e `pendAvisarChegada`). Chromium a 375 px (app inteiro, Firebase de mentira, dado inventado): 16 de 16 nos fluxos da última rodada, e 28 de 28, 28 de 28 e 31 de 31 nos das rodadas anteriores, sem rolagem lateral e sem erro de página (uma prova da troca já feita no outro aparelho é instável no Chromium, sem mudança no código dela).

## O que mudou em 07/out/2026 (v 2026-10-07-09) — Fechamento de plano: o valor do plano, e o recebido de plano no mês FILHOt por FILHOt

> Adriana, 07/out/2026: *"Num plano trimestral, o valor da mensalidade não é o valor do plano: o valor do plano total fechado é maior. Seria interessante o valor do plano e não da mensalidade, que está aqui 359. Teria que somar quanto a gente recebeu do plano no mês para poder finalizar os recebimentos do mês, o que foi fechado, para a gente bater com o outro sistema."* (Story 6.44)

### (AU) Ficha › aba Plano e Recebimentos do mês (Dashboard da Adriana e da Márcia)

| Antes | Agora |
|---|---|
| A aba Plano mostrava **Mensalidade R$ 359,00** num trimestral; o total do plano não aparecia | **Valor do plano R$ 1.077,00**, com a conta embaixo: "3 meses × R$ 359,00 (mensalidade)". No mensal, "um mês (no mensal, o valor do plano é a própria mensalidade)". Com desconto de irmão, o rótulo diz "(com desconto)" |
| O resumo "CONFIRA ANTES DE GRAVAR", o aviso "PLANO GRAVADO" e o rastro (Linha do tempo) diziam "mensalidade R$ 359,00" | Dizem **"Valor do plano R$ 1.077,00 (3 × R$ 359,00)"** (no mensal, "(mensal)"). O plano com dias diferentes em cada mês continua com a soma mês a mês |
| Nenhum valor ficava gravado: o quadro recalculava pela tabela de hoje | O Confirmar grava o valor fechado (`renov.valor_plano_cent`; no modo "Iguais", também `renov.mensalidade_cent`). O mês que já fechou não muda se a tabela mudar. O Desfazer devolve os valores do plano que volta |
| Renovar apagava o pagamento anterior do mês dele (o Financeiro lia só o plano atual): Gold pago em 05/07 e renovado em setembro sumia de julho | As renovações anteriores contam no mês em que foram pagas. Não contam: a renovação **desfeita** e o plano **corrigido** (desde esta versão, o Confirmar diz no histórico quando foi "correção"; nos registros de antes, vale a regra do app: mesma data de pagamento, mesmo fim ou começa antes) |
| O quadro só tinha o total por tipo | **Ver FILHOt por FILHOt** (toque para abrir): nome, tutor, plano e tipo, data do pagamento e valor, com as reservas da hospedagem e as diárias avulsas lançadas; o total da lista é o total do quadro. **Baixar Excel** com a mesma lista e o mesmo total, para bater com o outro sistema |
| "Renovações anteriores" (aba Plano) não diziam o valor | Cada linha mostra o valor do plano: o gravado, ou o da tabela de hoje dito "(pela tabela)" para os planos fechados antes desta versão |

- **Sem valor gravado e sem histórico, nada muda:** a conta do mês dá exatamente os mesmos números de antes (a prova da 6.36 com 60 fichas continua passando).
- **Continua igual (perguntas à Adriana na Story 6.44):** quem saiu (inativado) não entra em nenhum mês; no "Começou no meio do mês", a opção 2 de um trimestral; as diárias do meio do mês fora dos recebimentos.
- **A renovação anterior** entra só no mês em que foi paga: não gera cobrança nem "em débito" em outro mês. Quem virou morador continua com o pagamento antigo no mês em que pagou. Plano anterior sem valor gravado: a tabela de hoje, com as aulas e o nº na família daquele plano (no plano com dias diferentes em cada mês, a soma mês a mês, e a lista diz "dias por mês: 1x, 1x, 2x").
- **Um pagamento por data:** o plano corrigido depois (a mesma data de pagamento) conta uma vez, pela versão final. O mensal renovado no fim de setembro antes da 6.20 ("30/09 até 30/09", refeito depois "de 01/10 até 31/10") não apaga o pagamento do começo do mês. O "Começou no meio do mês" que estica o fim depois do Confirmar não transforma uma correção em renovação.
- **"PAGAMENTO NOVO OU CORREÇÃO DA DATA?" no Confirmar** quando a data do pagamento muda, a regra da correção não decide e não dá para saber: o plano gravado foi confirmado hoje; a data nova não é depois do dia em que o plano gravado foi lançado (o tutor paga e só depois o pagamento é lançado: a data certa de um lançamento errado vem antes desse dia ou nele — o mês trocado no calendário e o plano lançado já vencido com o «Manter … mesmo assim»); ou a data nova veio com ele ainda longe de acabar (mais de 15 dias antes do fim). Ex.: Gold gravado com 23/09 e corrigido para 25/09; Gold digitado 01/07 e corrigido para 01/10 no dia seguinte; Silver lançado em 28/09 com 28/08 e corrigido no dia seguinte (agosto, já fechado, fica com **R$ 0,00**). "Correção da data" conta um pagamento só; "Pagamento novo" conta os dois. A pergunta só tem esses dois botões. O período é o mesmo nas duas respostas. A renovação de sempre (paga nos últimos 15 dias do plano, ou depois que ele acabou — o Baque, pago 02/09 e renovado 30/09 para outubro) não pergunta nada quando é paga depois do dia em que o plano gravado foi lançado: nem depois do «Manter … mesmo assim», nem depois do "Desfazer este registro" do meio do mês. O plano lançado atrasado (ou alterado) e renovado com um pagamento até esse dia pergunta, porque tem o mesmo jeito da correção do mês trocado; quando o tutor pagou de novo, a resposta é «Pagamento novo». O mesmo plano confirmado de novo, sem mudar nada, guarda o dia em que foi confirmado. Continua sem pergunta, porque não há como saber: o plano lançado em dia e corrigido noutro dia para uma data depois do lançamento (o mensal de 10/07 corrigido em 29/07 para 28/07 tem o jeito da renovação paga no fim do mês).
- **A troca de categoria por engano:** a ficha que virou morador, avulso ou hóspede e volta a ter plano com OUTRA data até o fim do plano que saiu, ou até o dia em que ele foi lançado (Gold pago 01/09, "Morador(a) Zêluz" tocado por engano, plano lançado de novo com 02/09), pergunta «PAGAMENTO NOVO OU CORREÇÃO DA DATA?»; o texto diz se a data cai antes, dentro ou depois daquele plano. "Correção da data" conta um pagamento só (setembro **R$ 1.077,00**) e "Renovações anteriores" diz "correção (virou morador por engano)"; "Pagamento novo" conta os dois. A resposta vai para o próprio registro "virou …" e para o rastro. A MESMA data é o mesmo pagamento: conta um só, sem pergunta, também depois de corrigir a data, as aulas ou renovar; e o plano relançado volta com o período que já era (o Silver pago 18/09 que valia outubro continua de 01/10 a 31/10 — antes voltava "de 18/09 até 30/09", ia para a cobrança e apagava o pagamento do plano anterior). O plano novo depois do fim do anterior e do dia em que ele foi lançado não pergunta.
- **O motivo decidido pelo app vale sem adivinhar:** desde esta versão o registro do histórico (Confirmar, Desfazer, troca de categoria) sai marcado como decidido na hora (`motivo_conferido`, em `renovHistGravar`) — menos o refazer de um registro de antes desta versão, que continua sem a marca (vale a regra do app). "Renovação" conta; "correção" e "desfeita" não. O plano desfeito nunca conta — nem quando o Desfazer é de uma correção da data para antes (05/10 → 03/10 e Desfazer: outubro fica com **R$ 1.077,00**; 01/10 digitado 01/07, "Manter mesmo assim" e Desfazer: julho fica com **R$ 0,00**).
- **Desfazer duas vezes** (para trazer a renovação de volta): o plano que sai foi pago e volta ao histórico com o motivo que tinha, e não como "desfeita".
- **Registros de antes desta versão** (sem a marca): vale a regra do app (mesma data, mesmo fim ou começa antes = correção), sempre contra o plano que entrou no lugar DELE — inclusive a correção feita depois (a troca de dias de antes seguida de "Correção da data" conta um pagamento só). O "desfeita" antigo só conta quando o plano foi confirmado ANTES do que voltou (ou no mesmo dia, com «confira», como diz abaixo) e o que voltou não começa antes dele (o desfazer duas vezes); ele entra no lugar dele na sequência dos planos. Na lista e no Excel aparece **"confira"**, com o motivo, onde não dá para decidir com certeza: o "desfeita" antigo que conta, e o par antigo em que o app de hoje teria perguntado («o plano seguinte foi confirmado no mesmo dia», «o pagamento seguinte é de antes do dia em que este plano foi lançado, ou do mesmo dia», «o pagamento seguinte veio mais de 15 dias antes do fim do plano», «o pagamento seguinte veio até 15 dias depois deste, com o plano ainda valendo» — a pergunta da 6.20, que o app de antes fazia e não gravava). O plano que voltou depois de um "desfeita" antigo é o primeiro registro seguinte que não é um "desfeita" de verdade: o de outra renovação desfeita não passa por pagamento, e o plano pago que o desfazer duas vezes marcou "desfeita" é o plano que voltou. O "desfeita" sem data (o Desfazer da troca de categoria no app de antes) não muda nada. O "desfeita" do mesmo dia que pode ter sido só uma correção desfeita não apaga o pagamento anterior: ele conta, com «confira» (também quando ele vem logo depois do plano pago do desfazer duas vezes). A versão mais nova de um pagamento que perdeu o começo do período (o plano relançado no app de antes) não apaga o pagamento anterior: ele conta, com «confira». O "desfeita" antigo confirmado no MESMO dia do plano que voltou conta, com «confira»: os dados não dizem se foi o pagamento anterior (desfazer duas vezes) ou uma correção desfeita. A correção antiga da data seguida da troca do TIPO na mesma data (Silver 10/09 corrigido para 20/09 e depois Gold em 20/09) conta um pagamento só. O Desfazer que refaz um "desfeita" antigo marca o plano que sai (`refeito_de_antigo`): quando ele conta, sai com «confira»; se esse plano volta e sai de novo, a marca vai junto (`refeito_do_que_voltou`). O "virou morador/avulso/hóspede" antigo conta sem "confira". O Desfazer de uma ficha com o "desfeita" antigo do plano pago desfaz o plano atual (não apaga o pagamento antigo); com a renovação desfeita de verdade, traz a renovação de volta.
- **"Desfazer este registro" do meio do mês** refaz o fim pelo começo do período: o plano pago antes do fim (Silver pago 23/11 que vale dezembro) não fica mais "de 01/12 até 30/11", não volta para a cobrança e não apaga o pagamento do plano anterior no fechamento do mês.
- **Valor fechado acima da tabela:** com o valor gravado, a ficha não sai do total se a tabela de hoje perder o preço (ou a ficha perder os dias); a correção só da data mantém o valor fechado. O plano anterior sem as aulas daquele plano vai para "sem como calcular" (a conta não usa os dias de hoje).
- **Confirmar de novo o mesmo plano** mantém o valor fechado; o resumo diz qual seria o da tabela de hoje, quando é outro. Plano novo ou corrigido no app deixa de ser "data vinda da planilha antiga". Virar avulso, hóspede ou morador leva o valor fechado junto para o histórico.
- **Quem pagou duas vezes no mês é um FILHOt** no quadro, no Dashboard da Adriana e no aviso das fichas de fora; o valor soma os dois pagamentos. O dinheiro lançado paga primeiro o pagamento mais antigo. A tela Lançar pagamento (fora do menu) cobra o plano atual. Em "Maiores valores a receber" e na lista, a linha do plano anterior diz "renovação anterior", ou "plano anterior (depois virou morador/avulso/hóspede)" (com acento, também nas Renovações anteriores da ficha).
- **A lista e o Excel dizem quem ficou fora do total** (sem como calcular), com o motivo. Hospedagem: "reserva fechada em 03/10/2026 + parcela do dia: entrada em 25/10/2026". O quadro aparece nos dois dashboards ao mesmo tempo: o aviso do Baixar Excel (e do "abra na tela" com a janela bloqueada) fica no quadro tocado.
- **Onde está no código:** `financeiro-logica.js` — `finValorGravado`, `finEhCorrecaoDe`, `finRenovHistContados`, `finResumoHistorico` (e o valor gravado nos dois caminhos de `finResumoMes`, a contagem de FILHOts e o aviso); `index.html` — `renovMesesDoTipo`, `renovContaDoValor`, `renovContaCurta`, `renovValorDoHist`, `renovPerguntaNovoOuCorrecao`, `renovMotivoRotulo`, `renovHistGravar` (a marca `motivo_conferido`), `blocoPlano`, `renovBaseDoRelancamento`, `confirmarRenovacao`, `desfazerRenovacao`, `mmFimDesfeitoDe`, `renovHistHTML`, `setPelCategoria`, `lpCobrancaDe`, `recQuebra`, `recBRL`, `recLinhasDoMes`, `recForaDoMes`, `recListaHTML`, `recStatusDe`, `recAbrirNaTela`, `recBaixarExcel`, `recCardHTML`; `relAbrirNaTela` devolve `false` quando a janela é bloqueada. No `financeiro-logica.js`, também `finCopia`, `finPerguntariaNovoOuCorrecao` (a mesma regra da pergunta, para o "confira") e `finMesmoComecoDoPeriodo` (a versão final que só trocou o tipo).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (610 no total; 56 da 6.44 — 13 dos critérios, 8 da revisão adversarial e 35 das cinco rodadas do QA independente e da conferência final — e 3 antigas revistas: o rótulo "Mensalidade" virou "Valor do plano"; a regra da correção (com a do mesmo começo do período) é a única outra leitura do começo do período; e, depois da trava "nasce vencida", entra a pergunta "pagamento novo ou correção"). Harness: a v-15 confere o valor do plano no resumo; a v-50 H3 tira da comparação com a conta antiga as fichas com renovação anterior ou valor gravado e, nas com renovação anterior, prova que só entram as linhas delas (o resto é o de antes) e mostra quanto cada mês muda e quantas linhas pedem "confira" (roda onde houver o retrato com dado real). Defeitos plantados: 174. Chromium a 375 px: aba Plano, Confirmar, quadro de julho com a renovação anterior, lista, Excel, os dois dashboards na tela (nenhum id repetido; o aviso fica no quadro tocado), os dois casos do 1º QA (corrigir a data e desfazer; 01/07 mantido e desfeito), o do 2º (23/09 → 25/09 com a pergunta: "Correção da data" R$ 1.077,00, "Pagamento novo" R$ 2.154,00), o do 3º (Gold digitado 01/07, "Manter", corrigido para 01/10 no dia seguinte: julho R$ 0,00) e os do 4º (o mês trocado no calendário: agosto R$ 0,00 e julho R$ 0,00; a renovação de sempre, no fim do plano, no fim do mês e depois do meio do mês, só com o «CONFIRA»; a troca de categoria por engano nas duas respostas; os registros antigos do desfazer duas vezes e da troca do tipo) e os do 5º (a troca de categoria relançada com a mesma data e corrigida depois: julho R$ 387,00; o mesmo pagamento passado para 2x e renovado: julho R$ 1.234,00; o meio do mês desfeito num plano pago antes do fim: junho R$ 2.028,00 e o fim continua 31/12; o "desfeita" sem data: junho R$ 2.028,00).

## O que mudou em 07/out/2026 (v 2026-10-07-08) — Feriado não vira reposição

> Adriana, 07/out/2026: *"feriado não são reposto. Não tem funcionando no dia e é perdido."* (a pergunta tinha ficado na Story 6.39).

### (AT) Reposições › Lançar falta avisada e Marcar o dia — feriado

| Antes | Agora |
|---|---|
| Falta avisada num feriado em dia dele virava crédito; a prévia só pedia "confira se a Zêluz abre" | **Não vira crédito.** Em "Alguns dias" e "Um período", o feriado aparece entre os que ficam de fora: "12/10 (segunda-feira) não entra: é feriado (Nossa Senhora Aparecida). A Zêluz não abre e o dia não é reposto." |
| "Um dia só" lançava o feriado sem aviso | Não lança: "12/10/2026 é feriado (…). A Zêluz não abre e o dia não é reposto: nada foi lançado." |
| O dia de repor podia ser um feriado | O aviso aparece assim que o dia é escolhido (sem vagas nem "Avisar a Márcia") e a falta não é gravada com ele: "12/10/2026 é feriado (…): a Zêluz não abre. Escolha outro dia." |
| "Marcar o dia" (reposição, avulso, troca e a Lista de troca, que abre a mesma tela) aceitava feriado | Não aceita o feriado como dia de vir (só o aviso, sem vagas nem "dia dele"), e a troca não sai de um feriado: "… a Zêluz não abre e o dia não é reposto. Não há dia para trocar." |
| A Gestão autorizava o encaixe de um pedido num feriado (reposição ou avulso cobrado) | Não autoriza: o aviso diz que é feriado e que o pedido continua em aberto para ser recusado |
| A Lista de troca oferecia o feriado ("0 de 5 vagas") | Não oferece, como não oferece sábado e domingo |
| Num aparelho que nunca abriu o Orçamento, valia só a lista de feriados do código | As duas janelas buscam a lista com o recesso da Gestão (uma vez por sessão) e refazem a prévia quando ela chega; até ela chegar (no máximo 4 s), um toque no botão não grava e a janela diz "Ainda estou conferindo os feriados. Espere um instante e confirme de novo." A autorização do encaixe também busca a lista antes de conferir |
| "Um período" com feriado: a confirmação não dizia que ele ficou de fora | A confirmação diz "Ficaram de fora: 12/10 (segunda-feira) — é feriado (…)" e o rastro, "(de fora, feriado: 12/10)". A mensagem ao tutor não mudou |

- **A lista é uma só:** Configurações › Valores da hospedagem, bloco "Feriados (não entregamos)" (nacionais, de MG, os dois de BH e o recesso que a Gestão acrescenta) — a mesma da falta automática das 12h e do calendário do Day Care. A lista do código só tem 2026 e 2027 (backlog: 2028 em diante).
- **O que já foi lançado não muda sozinho:** falta avisada de feriado lançada antes desta versão continua no saldo; a recepção estorna no Extrato, se for o caso.
- **Feriado no fim de semana** (ex.: 15/11/2026, domingo): em "Alguns dias", continua dizendo "é domingo: não há Day Care"; em "Um dia só", diz que é feriado. Nos dois casos, nada é lançado.
- **Onde está no código:** `repFeriadoNome`, `repFeriadoPorque`, `repFeriadoDiaRepor`, `repFeriadosBuscar` (`REP_FER_LENDO`); `repAlgunsAnalise`, `repPeriodoAnalise`, `repPreverDias`, `repVoltaPintar`, `repBotaoRotulo`, `repConfirmar`, `dxVeredito`, `dxVereditoTroca`, `dxPintar`, `dxConfirmar`, `vagasAutorizar`, `trocaProximosDias`, `repAbrirLancar`, `dxAbrir`. Saíram `repFeriadosEm` e `repFeriadosHTML` (o aviso "confira se a Zêluz abre").
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (554 no total; 12 da 6.43 e as da 6.39 que esperavam o crédito em feriado, revistas). Harness: v-51 A1 compara com o período de verdade e ganha a A3 (feriado nunca vira crédito). Defeitos plantados: 22 do dev na 1ª versão (21 válidos, todos pegos), 15 do QA (14 pegos; o Q7 não muda nada) e 18 dos ajustes, todos pegos. Chromium a 375 px: 20 de 20, como recepção e como Gestão.

## O que mudou em 07/out/2026 (v 2026-10-07-07) — Hoje na Zêluz: hóspede e morador fora do quadro do check-in

> QA independente da Story 6.42 (FAIL por um ponto): hóspede e morador marcados "veio" na Chamada (ela lista os dois) entravam no quadro "Na chamada, sem o check-in do corpo". O Repolho apareceria todo dia.

### (AR) Hoje na Zêluz › "Na chamada, sem o check-in do corpo" (ajustes)

| Antes | Agora |
|---|---|
| Hóspede da AuAulândia ou morador da casa marcado "veio" na Chamada entrava no quadro, com "Fazer o check-in agora", e a linha dizia "falta o check-in do corpo" em vermelho | **Não entram.** A linha volta a dizer "hóspede da AuAulândia — está na casa" e "morador da casa", em verde: os dois não passam pelo check-in de entrada do Day Care |
| Depois da meia-noite com o app aberto, o quadro mostrava os nomes de ontem até a tela ser reaberta | A chamada de ontem não vale no dia seguinte: o quadro começa vazio |
| O atalho abria o check-in com o Day Care no dia da semana que alguém deixou | Abre no dia de hoje (o check-in sempre foi gravado no dia de hoje; só o rótulo confundia) |
| Abrir o Hoje de novo no mesmo dia redesenhava a tela uma vez a mais | O aviso do check-in é ligado uma vez por dia |
| Monitora com o Hoje concedido: erro de página na carga (já existia) | A tela desenha sem os botões de filtro e eles voltam no desenho seguinte |

- **Xarás:** o quadro mostra o nome como a lista do check-in mostra (com o tutor ou a raça). O atalho leva à busca pelo nome; entre xarás, a monitora escolhe pelo mesmo sufixo.
- **Onde está no código:** `hojeSemCkDe` (quem deve o check-in), `hojeLista` (marca `hospede` e `morador`), `hojeFrasePresenca`, `hojeChamadaMapa`, `hojeCkVivoLigar`, `banhoFaltaIrAoCheckin`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (542 no total; 6 da 6.42 pelo QA, uma delas pela lista de verdade do Hoje). Defeitos plantados: 31 (21 do QA e 10 novos), todos pegos. Chromium a 375 px: 32 de 33 nos cenários do QA (o que falta é a busca entre xarás, acima).

## O que mudou em 07/out/2026 (v 2026-10-07-06) — «Está aqui»: o "Toquei errado — desfazer" não some

> QA independente da Story 6.41 (FAIL por um ponto): o botão de desfazer não aparecia para quem entra pelo Time sem as atividades do Day Care, nem quando outro cartaz estava na tela (por exemplo, "Fredo chegou e tem pendência").

### (AQ) «Ele está aqui» › **Toquei errado — desfazer** (ajustes)

| Antes | Agora |
|---|---|
| Sem as atividades do Day Care no Time (o padrão de quem é cadastrado no Time) ou com outro cartaz na frente, a janela virava um cartaz com "Entendi" e **sem o desfazer** | O desfazer aparece sempre que o toque mudou a chamada: sem atalhos, a janela traz "Entendi" e "Toquei errado — desfazer"; com outro cartaz na tela, a janela espera na fila e volta **com os botões** |
| Xarás: "DESFEITO: FREDO" | "DESFEITO: FREDO - TUTORA TESTE", como o aviso e a janela do toque |
| A rede caía no passo do banho e a janela dizia "corrija em Day Care › Chamada", com a chamada já desfeita | "⚠ DESFIZ SÓ A CHAMADA": diz que a chamada voltou e que o banho continua segurado ("ainda vem"), com o que fazer |
| O check-in do corpo terminado em outro aparelho no mesmo instante podia ser coberto pelo "faltou" | Depois de gravar, o app confere o check-in de novo: se apareceu, a chamada volta a "veio" e nada mais é desfeito ("NÃO DESFIZ: … ESTÁ AQUI") |
| "O banho continua segurado, como já estava antes do toque" quando outro aparelho já tinha liberado | Diz o que vale agora: "O horário do banho continua liberado (Lia liberou)." |

- **Rastro:** o desfazer do banho (não fixo) também entra no rastro do banho de quem faltou.
- **Pendência de prevenção:** a marca "já avisei" do aviso "chegou e tem pendência" sai no desfazer; se ele chegar de verdade hoje, o check-in avisa de novo. A pendência não muda e o `pendAvisarChegada` não foi alterado.
- **Texto:** "volta para a pergunta: «Liberar o horário» ou «Ele ainda vem»" (os nomes dos botões; sem o sexo na ficha, «Ainda vem»).
- **Onde está no código:** `banhoFaltaMostrar` (a fila com botões, `op.escolha`), `banhoFaltaEstaAqui` (o desfazer sem depender dos atalhos), `banhoFaltaDesfazerAqui`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (532 no total; 11 provas do QA e 6 novas). Defeitos plantados: 46 (17 do QA, 14 do dev e 15 novos), todos pegos. Chromium a 375 px: os 20 cenários do QA, inclusive a recepção sem atividades, a pendência aberta e os xarás.

## O que mudou em 07/out/2026 (v 2026-10-07-05) — falta avisada: a data já lançada não entra de novo

> QA independente da Story 6.39 (CONCERNS). O caso do Fred: o 13/10 já entrou pelo "Um período"; lançar 13 e 14/10 em "Alguns dias" daria dois créditos para o 13.

### (AS) Reposições › Lançar falta avisada (os três modos)

| Antes | Agora |
|---|---|
| A mesma data podia ganhar dois créditos: nada impedia lançar de novo um dia que já tinha falta avisada | **A data que já tem falta avisada lançada (e não estornada) não entra de novo.** "Alguns dias": fica de fora com "a falta avisada desse dia já foi lançada (está no Extrato)". "Um período": a prévia diz "13/10 já tem falta avisada lançada (está no Extrato): não entra de novo". "Um dia só": não lança e diz para estornar a anterior no Extrato. Estornada, a data volta a valer |
| Dois toques seguidos no "Avisar a Márcia" (a caixa de vagas) com o banco lento gravavam o lote duas vezes | **Um lançamento por vez:** o segundo toque diz "Ainda estou lançando o toque anterior. Espere a confirmação." Abrir o modal de novo destrava (sem rede, a gravação pode ficar pendente) |
| Feriado em dia dele virava crédito sem aviso | A prévia avisa: "12/10 é feriado (Nossa Senhora Aparecida): confira se a Zêluz abre. Se não abre, tire essa data." O crédito entra como sempre entrou; se feriado deve virar crédito é decisão da Adriana (pergunta na Story 6.39) |
| Trocar de FILHOt com o modal aberto deixava a prévia do anterior | A prévia refaz na hora, com o FILHOt escolhido |

- **Textos:** "nesses dias" quando são vários; a data fora do calendário do app aparece com o ano (para quem digitou errado ver o erro); a data repetida vem antes do que fica de fora; na confirmação, "15/10 (quinta-feira) — não é dia do Fred na ficha", sem parênteses dentro de parênteses; o conselho de mudar a ficha só aparece quando o motivo é "não é dia dele" (aba Plano no plano com dias por mês; alto da ficha nos outros).
- **Onde está no código:** `repCreditoVivoNaData` (a data já lançada), `repPeriodoAnalise` (o período sem as já lançadas), `repFeriadosEm`/`repFeriadosHTML` (o aviso de feriado), `REP_LANCANDO` (a trava, em `repConfirmar`; destrava em `repAbrirLancar`), `repMostrarEscolhido` (a prévia refeita), `repForaConselho` (o conselho por motivo).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (6 provas do QA da 6.39; 515 no total). Defeitos plantados: 31 (8 do QA que escapavam e 23 novos), todos pegos.

## O que mudou em 07/out/2026 (v 2026-10-07-04) — Hoje na Zêluz: quem está só na chamada, sem o check-in do corpo

> **Adriana, 02/out/2026** (o Rafael): *"coloque a opção está aqui (para que se não foi feito o checkin do corpo apareça que tem que fazer!!!)"*. A janela do «Está aqui» avisava uma vez; agora o Hoje na Zêluz lembra até o check-in ser feito. Story 6.42.

### (AR) Hoje na Zêluz › "Na chamada, sem o check-in do corpo"

| Antes | Agora |
|---|---|
| Marcado "veio" na chamada (✓ Veio ou «Está aqui») sem o check-in do corpo de entrada, a linha dizia só "presente"; fechada a janela do «Está aqui», só o painel do monitor lembrava | Quadro **"Na chamada, sem o check-in do corpo (N)"**, logo depois do banho de quem faltou, com o nome (e o tutor, se há xarás) e **Fazer o check-in agora** (abre o check-in do corpo de entrada com o nome). Quem não tem a atividade no Time lê "Peça a quem faz o check-in do corpo". O nome sai do quadro quando o check-in é feito, sem reabrir a tela |

- A linha do FILHOt na lista (e o Excel do Hoje) diz **"presente pela chamada — falta o check-in do corpo"**, em vermelho.
- Hóspedes, moradores e quem faltou não entram. Nada é gravado: o quadro só lê e leva até o check-in. Nenhuma leitura nova do banco: é o mesmo nó do dia que o Hoje já lia.
- **Onde está no código:** `hojeSemCheckinLista`, `hojeSemCheckinCardHTML`, `hojeSemCheckinIr`, `hojeCkVivoLigar` e `hojeFrasePresenca`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (4 provas da 6.42). Defeitos plantados: 11, todos pegos.

## O que mudou em 07/out/2026 (v 2026-10-07-03) — «Está aqui» tocado por engano: desfazer

> Da fila do /loop autorizado pela Adriana em 06/out ("desfazer o «Está aqui» tocado errado"); backlog da Story 6.29 (QA73). Story 6.41.

### (AQ) Aviso "NÃO VEIO — TINHA BANHO" › «Ele está aqui» › **Toquei errado — desfazer**

| Antes | Agora |
|---|---|
| «Ele está aqui» tocado no FILHOt errado só se consertava à mão, em dois lugares: Day Care › Chamada › Faltou, e Hoje na Zêluz › Banho de quem faltou › Liberar o horário | A janela que abre depois do toque (a do "FALTA O CHECK-IN DO CORPO") traz **Toquei errado — desfazer**: a chamada de hoje volta ao que era ("faltou" ou sem marcação) e o banho volta para a pergunta, se foi o toque que o segurou |

- **Não desfaz por cima de ninguém:** com o check-in do corpo de entrada feito, não desfaz ("ele está aqui de verdade"); chamada mudada por outra pessoa depois do toque, não mexe; "ainda vem" ou "liberado" de outra pessoa ficam. O "ainda vem" que já existia antes do toque continua.
- **Banho fixo:** o "manter" do dia que o toque gravou na ficha sai; as outras exceções ficam.
- A fila do remédio relê (voltou a faltar). Rastro: "desfez o «Está aqui» (toque errado)". Só quem decide o banho de quem faltou vê o botão. O botão não aparece quando a chamada já dizia "veio" antes do toque.
- **Onde está no código:** `banhoFaltaEstaAqui` (guarda o que o toque mudou em `BANHO_FALTA_AQUI`) e `banhoFaltaDesfazerAqui` (lê e só então grava).
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (3 provas da 6.41 e 2 da 6.29 com o botão novo). Defeitos plantados: 14, 13 pegos (o 14º, que o dev tinha como equivalente, não era: o QA mostrou o caso e a prova entrou na v 2026-10-07-06). Chromium a 375 px: 7 de 7.

## O que mudou em 07/out/2026 (v 2026-10-07-02) — falta avisada em alguns dias (caso do Fred)

> **Adriana, 06/out/2026:** *"Lancei na reposição do Fred e da Eleonora o dia 13 e 14. E lá no Falta, um período, eu escrevi dia 13 e dia 14 e contabilizou apenas um dia, como se fosse o dia 13. Precisa de resolver isso. Às vezes a pessoa vai fazer dois, três dias, a gente colocar mais datas."* Story 6.39.

### (AP) Reposições › Lançar falta avisada › "Alguns dias"

| Antes | Agora |
|---|---|
| Só "Um dia só" ou "Um período". No período, o dia que não era dia dele na ficha ficava de fora **sem aviso**: 13 e 14/10 com só a terça davam 1 crédito, e ninguém sabia por quê | Terceiro modo, **Alguns dias (datas soltas)**: uma data por linha, "+ outra data" e "×" para tirar. Cada data em que ele viria vira um crédito, num lançamento só, com o mesmo motivo e o mesmo dia de repor (só no primeiro crédito, como no período) |
| — | A prévia diz **o que fica de fora e por quê**: "14/10 (quarta-feira) não entra: não é dia do Fred na ficha (ele vem Ter). Se ele passou a vir nesse dia, marque o dia no alto da ficha." Sábado e domingo: "não há Day Care". Data repetida conta uma vez só, com o aviso. No período, os dias de semana que ficam de fora aparecem também (até 5 pelo nome e "e mais N") |

- **A regra do crédito não muda:** a falta é de um dia em que ele viria (a mesma do período). Plano com dias diferentes em cada mês (6.30): vale o dia daquele mês do plano, e o conselho manda ajustar na aba Plano.
- **A confirmação e o rastro** dizem os dias e o que ficou de fora. **O Extrato** diz só os dias que entraram ("alguns dias: 13/10, 15/10, 20/10"). A mensagem pronta ao tutor fala dos dias: "contando as dos dias 13/10, 15/10 e 20/10".
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
- **A dose de ontem adiada na virada:** o aparelho não recarrega **até o alarme dela voltar** (ou até a dose aparecer dada, neste ou em outro aparelho): com o celular na mão, na mesa ou no bolso. Quando o adiar vence, o alarme volta a tocar e a dose é registrada em ontem. **A tela não espera mais pelo adiado** (story 6.47, 4ª rodada): ela passa para hoje logo depois da meia-noite, as doses do dia novo tocam na hora, e o adiado volta **pelo dia dele** (registrado em ontem). Antes, a tela ficava em ontem até o alarme voltar, e, com o ADIAR tocado a cada volta, as doses do dia novo ficavam caladas por até 3 horas naquele aparelho. A espera da recarga tem limite: o remédio que saiu da agenda é descartado (a tela avisa); com outra data escolhida na tela (o alarme não toca ali), não há espera; e, em último caso, ela acaba **1 hora depois do fim do adiar** (1h05 depois do toque em "ADIAR 5 min"). Se a página recarregar antes de o adiado voltar, ele não volta no aparelho (o vigia do servidor cobra depois de 30 minutos). A dose de ontem que ninguém viu nem adiou: veja o bloco da story 6.47, logo abaixo.
- O adiado que ainda não voltou também segura a recarga da **versão nova** (como o alarme na tela), e **tocar na faixa pergunta antes** ("HÁ UM REMÉDIO ADIADO": Esperar o alarme · Atualizar mesmo assim).
- Com outra data escolhida na tela e o aparelho parado, a recarga da virada espera só se houver um adiado de hoje esperando o alarme.
- A dose dada e o espelho nas fichas irmãs (o mesmo remédio em duas fichas) ficam no **mesmo dia**, mesmo que a tela passe para o dia novo no meio.
- O Day Care (turma, falta automática, planilha) continua travado até a recarga, como já era: a faixa **"O dia virou — toque para atualizar"** segue acesa.
- Quem não recebe o alarme (Gestão, recepção, consultoras) recarrega na virada como antes.
- **Limites conhecidos:** sem internet na virada, a lista de hóspedes de ontem continua até a planilha responder (os remédios seguem os de quem dormiu). O navegador do teste não aplica a regra de som do celular: o "SEM SOM" é a garantia de que ninguém fica sem saber.
- **Onde está no código:** `zDiaTelaAvancar`, `zDiaSegurarNoite`, `zDiaAdiadoAtivo` (com `despMedSnoozePend`, os adiados que ainda não voltaram, e `DIA_ADIADO_TETO_MS`), `medDiaVelhoAuto` (em `checarDespertadorMed`), `DIA_TELA_AUTO`, `DIA_NOITE_ATE`, `medSomMudo`, `medSomConferir`, a pergunta em `aplicarVersaoNova`, `_diaLog` em `registrarDoseAgendadaGlobal`; `zMotivoParado` e `zViradaDoDiaTick` olham o adiado.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (10 provas da 6.32 e 1 prova da 6.21 atualizada; defeitos plantados: 20 do dev; 22 do 1º QA, dos quais escapam 6 (Q1 equivalente; Q7, Q10, Q11, Q20 e Q22, lacunas baixas); 10 depois do 2º QA, todos pegos). Chromium com o relógio adiantado: na versão anterior, a página recarregava na virada; agora a tela passa para o dia 07, o alarme das 00:05 abre e a dose é registrada no dia 07. Com a dose adiada às 23:58: na mesa, no bolso e com a página congelada, o alarme volta com a tela em ontem e nada recarrega por cima.

**A dose de ontem que ninguém viu (story 6.47, 08 e 09/out/2026 — publicada na v 2026-10-09-01; resumo na seção de 09/out/2026, no topo).** Antes, a dose das 23:30 que nunca abriu o alarme (celular congelado no bolso, tela apagada, segunda dose na fila atrás de outra) **sumia** depois da meia-noite: a tela passava para hoje, ou a página recarregava, e ninguém era chamado.

| O que acontecia | Agora |
|---|---|
| A dose de ontem sem registro e sem adiar sumia na virada | No celular de quem recebe o alarme, **a tela espera em ontem** (e a página não recarrega: na mesa, trancado, de volta do bolso, com a ficha aberta) enquanto houver dose de ontem para tocar. O alarme toca com a tela em ontem, **uma dose de cada vez, a mais antiga primeiro**, e «Dei o remédio» registra **no dia de ontem** |
| Duas doses às 23:30 (Bia e Thor): a segunda sumia quando a primeira era dada | A segunda toca logo depois; a tela só passa para hoje quando nenhuma sobrou |
| «Hoje» (o botão, o da ficha e as setas que chegam a hoje) com remédio de ontem por responder levava a tela para hoje: o adiado de ontem nunca mais voltava, a dose de ontem na fila sumia sem aviso, e a faixa mandava esperar um alarme que não podia voltar | **Pergunta antes: «HÁ REMÉDIO DE ONTEM POR RESPONDER»** ("Há remédio de ontem por responder: a tela fica em ontem até ele.") — Responder o alarme · Ir para hoje mesmo assim. Se ainda há dose de ontem que nem tocou, a pergunta diz que, indo para hoje, ela não toca mais neste aparelho. Enquanto o registro de ontem é conferido: **«CONFERINDO OS REMÉDIOS DE ONTEM»** (Esperar · Ir para hoje mesmo assim). «Responder o alarme» traz na hora o alarme adiado |
| O alarme ADIADO de ontem, com a tela já em hoje («Ir para hoje mesmo assim», ou o ADIAR antes da meia-noite da 6.32), nunca voltava | Volta em 5 minutos **pelo dia dele**: confere o registro daquele dia (já dado em outro aparelho, não volta) e «Dei o remédio» grava nele. Sem resposta do banco, o alarme abre assim mesmo e manda conferir antes de dar. Desde a 4ª rodada, é sempre assim que o adiado de ontem volta: a tela não espera por ele |
| Tocar na faixa com o alarme de ontem na tela apagava o alarme | Pergunta antes: **«HÁ UM REMÉDIO DE ONTEM SEM REGISTRO»** (Responder o alarme · Atualizar mesmo assim), com a tela em ontem e também com a tela já em hoje. Enquanto o aparelho ainda confere o registro de ontem: **«CONFERINDO OS REMÉDIOS DE ONTEM»** (Esperar · Atualizar mesmo assim; «Esperar» confere de novo). O check-in aberto e a falta de internet continuam com os avisos deles, antes |
| O alarme mostrava o atraso da hora em que abriu ("há 1 h 30 min" às 02:25) e continuava mandando dar depois do teto; a próxima dose do mesmo remédio tocava logo em seguida (duas doses quase juntas) | O "há X" acompanha o relógio (a cada batida de 15 e de 30 segundos, e na hora em que a página volta à vista). **Passado o teto**, o alarme diz **«Passou do horário seguro desta dose: não dê sem falar com a veterinária.»**; nos 30 segundos antes dele (para o texto valer até a próxima batida), **«Está no limite do horário seguro desta dose: não dê sem falar com a veterinária.»** (4ª rodada: antes, «Passou» aparecia ao lado de «há 1 h 59 min»). Nos dois casos, o ADIAR vira **«Entendi — não vou dar»**, no mesmo lugar: fecha o alarme neste aparelho, ele não volta e nada é gravado no registro das doses (só o rastro da auditoria, como o do ADIAR). «Dei o remédio» continua possível (se a veterinária mandar dar). Quando uma dose é dada pelo alarme depois do horário seguro (a de ontem; a de hoje só de madrugada, das 0h às 6h, quando a fila da dose de ontem a atrasou — 5ª rodada: de dia, o alarme de hoje manda dar a qualquer atraso, e a próxima não pode chamar essa dose de «depois do horário seguro»), **só a próxima dose do mesmo remédio** diz **«A dose anterior deste remédio (22:30 de ontem) foi registrada às 02:25, depois do horário seguro: não dê sem falar com a veterinária.»**, citando a dose certa, também com «Entendi — não vou dar» no lugar do ADIAR, até alguém responder (pergunta da Adriana, junto da D1). Duas doses do mesmo antibiótico quase juntas, as duas mandando dar, não acontecem mais por esse caminho |
| O ADIAR em laço segurava a tela em ontem e calava as doses de hoje de todos os FILHOts (depois do teto até a 2ª rodada; dentro do teto, por até 2 h 59 min, até a 3ª); quem saía disso via duas doses do mesmo antibiótico seguidas mandando dar | O ADIAR **não segura mais a tela**, dentro ou depois do teto (4ª rodada): a tela passa para hoje, as doses de hoje tocam na hora e o adiado volta pelo dia dele. O adiado ainda segura a recarga da virada e a pergunta da faixa até voltar, para não sumir em silêncio. Passado o teto, o alarme não tem ADIAR: só «Entendi — não vou dar» |
| O adiado guardado com o dia voltava no dia seguinte também quando o remédio tinha saído da agenda (o FILHOt foi para casa, a dose foi dada pela outra porta do Day Care): falso alarme de madrugada. Na 3ª rodada, o adiado do Day Care com pernoite, o de quem tinha saída marcada e o ADIAR tocado perto da meia-noite numa dose do dia sumiam em silêncio | O adiado volta **pelo menos uma vez** depois de vencer o ADIAR, seja qual for o dia, a hora da dose ou a porta (também o Day Care com pernoite e quem tinha saída marcada). Passado o horário seguro, volta dizendo «não dê» e sem ADIAR. **Só é descartado o adiado cujo remédio saiu da agenda** (o FILHOt foi para casa, a veterinária suspendeu, o horário mudou), e a tela diz: **«ALARME ADIADO QUE NÃO VOLTA»** ("O alarme adiado de Prednisolona de Lua (14:00) não toca de novo: o remédio saiu da agenda (suspenso, horário trocado ou o FILHOt foi para casa)." / "Nada foi registrado. Se a dose ainda for necessária, fale com a veterinária."), com rastro na auditoria. Com a agenda pela metade (alguma leitura falhou) ou de outro dia, nada é descartado |
| No aparelho que não recarregou, o prazo de um ADIAR de outra noite, na mesma dose, escondia a dose de ontem que ninguém viu (4ª rodada) ou a reabria fora do teto como falso alarme | Só conta o ADIAR **desta noite** que ainda não voltou |
| Com a tela já em hoje, a dose de ontem ADIADA e dada pela **ficha** («Dei agora» na linha das 23:30) era gravada em hoje: a dose das 23:30 de hoje ficava "dada" e não tocava à noite (4ª rodada) | É gravada **no dia do adiado** (ontem), o estoque também, e a tela diz: **«DOSE REGISTRADA NO DIA DELA»** ("A dose de Apoquel das 23:30 de ontem foi registrada no dia dela." / "A das 23:30 de hoje continua por dar."). O adiado não volta, e a dose de hoje toca no horário. Vale também com o alarme de ontem dessa dose na tela. Sem adiado nem alarme de outro dia, o «Dei agora» da ficha grava no dia da tela, como sempre (5ª rodada) |
| Registrar **outra** dose pela ficha fechava qualquer alarme na tela, também o de ontem que voltou com a tela em hoje, e ele não voltava mais (4ª rodada) | O registro só fecha o alarme **da mesma dose, do mesmo dia** (5ª rodada) |
| O remédio **suspenso** entre o ADIAR e a volta, com a tela já em hoje, voltava mandando dar (4ª rodada) | O adiado é descartado e a tela diz («ALARME ADIADO QUE NÃO VOLTA», "… (23:50 de ontem) …"): a carga da agenda de hoje guarda o remédio suspenso. O remédio com término ontem, que também não está na agenda de hoje, continua voltando: a dose de ontem dele ainda era devida (5ª rodada) |
| O aviso «ALARME ADIADO QUE NÃO VOLTA» abria em tela cheia **por cima do alarme de remédio** na tela (4ª rodada) | O rastro sai na hora, e o aviso espera o alarme ser respondido: aparece na primeira batida sem alarme na tela, uma vez (5ª rodada) |
| A seta «›» com a pergunta aberta: se a tela passava sozinha para hoje enquanto ela lia, «Ir para hoje mesmo assim» levava para **amanhã**, e nada tocava | «Ir para hoje mesmo assim» vai para o **destino da hora da pergunta** (hoje) |
| A ficha navegada para ontem mostrava «—pendente—» na dose que passou | Mostra **«—faltou—»**; a de amanhã mostra «—pendente—» |
| A 375 px, a faixa do topo cobria o nome do FILHOt no alarme (de madrugada a faixa fica acesa) | O alarme de remédio abre **logo abaixo da faixa** |
| A dose de ontem dada com a tela já em hoje descontava o estoque no dia de hoje, e a dose de hoje no mesmo horário não descontava | O desconto do estoque é marcado **no dia do registro** da dose |

- **O alarme da dose de ontem** diz o dia e o atraso: "Bia toma Apoquel — 1 comprimido às **23:30 de ontem** — há 50 min". E não afirma o que o aparelho não sabe: "Dose de ontem: confira se ninguém deu antes de dar. Se ninguém deu, dê o remédio agora — este alarme não desaparece sozinho." O alarme aberto antes da meia-noite e ainda sem resposta passa a dizer "de ontem" e o atraso depois da virada.
- **Até quando a dose de ontem toca** (pergunta D1 da Adriana, aplicada pela recomendação até ela confirmar): o **menor** entre **3 horas** depois do horário e **a metade do intervalo até a próxima dose do mesmo remédio**. Uma vez por dia: até 3 h. De 12 em 12 h: até 3 h. De 4 em 4 h (22h, 2h, 6h…): até 2 h, para não dar uma dose em cima da outra. Fora disso, não toca, não segura a tela e **nada é gravado** — fica sem registro, como antes (a ficha de ontem mostra «—faltou—»; o vigia do servidor cobra de manhã as de ontem das 21h em diante). O teto decide se o alarme **abre**; aberto, ele não some sozinho e, passado o teto, deixa de mandar dar.
- **O dia do registro é o dia em que o alarme abriu.** A troca de turno com outra senha e o «Ir para hoje mesmo assim» não mandam a dose de ontem para hoje. A plantonista que assume o aparelho continua com a tela em ontem enquanto houver remédio de ontem por responder (alarme na tela ou dose na janela; o adiado não conta desde a 4ª rodada: ele volta pelo dia dele); a Gestão (que não recebe o alarme) entra no dia de hoje, como sempre.
- **O celular que acorda** (página descongelada, de volta do bolso depois de 1 minuto ou mais, relógio que pulou 1 minuto ou mais — também com a página ainda escondida, a ordem do iPhone): o alarme de ontem espera o banco voltar a conversar e mais 5 segundos, para não chamar uma dose que outra plantonista já deu enquanto ele dormia. Sem banco por 1 minuto, toca pelo que o aparelho tem (e manda conferir antes de dar). Sem resposta nenhuma do registro de ontem, a espera da tela acaba em 2 minutos. Com a aba escondida sem congelar (o navegador espaçando o relógio, 1 batida por minuto), o "acordou" vale **uma vez por período escondido**: a tela passa logo depois da meia-noite e as doses de hoje tocam na hora (antes, o "acordou" se renovava a cada batida e a tela ficava em ontem até o teto). Com a página escondida, o relógio que pula **3 minutos ou mais** (um congelamento de verdade) conta de novo (4ª rodada): o alarme de ontem espera o banco também na ordem do iPhone depois de um primeiro pulo no mesmo período escondido; o relógio de 1 batida por minuto da aba escondida não chega a isso.
- **De madrugada, com a tela já em hoje e o alarme de ontem na tela**, o toque na faixa faz a pergunta do remédio de ontem, que fala também do som ("Atualizar agora também pode deixar o alarme de remédio sem som…"), no lugar da pergunta da madrugada.
- **A pergunta «HÁ UM REMÉDIO ADIADO»** não manda registrar a dose quando o adiado vai voltar já passado (ou no limite) do horário seguro: "Espere o alarme voltar e responda a ele (ele vai dizer para não dar sem falar com a veterinária); depois, atualize."
- **«Ir para hoje mesmo assim» com a conferência ainda em curso, ou logo depois de o celular voltar**, a pergunta diz: "Se for para hoje agora, qualquer dose de ontem que ainda não tocou não toca mais neste aparelho." (sem afirmar que há dose sem registro).
- **Não toca depois da meia-noite:** o Day Care (inclusive a dose da pernoite lançada no check-in de pertences: o vigia do servidor cobra de manhã); quem tinha saída marcada para ontem («Dormiu · sai hoje», estadia com saída ontem); o remédio que saiu da agenda **neste aparelho**; a tela que alguém pôs em outra data (a seta para trás não pergunta: é a regra de outra data); os aparelhos de quem não recebe o alarme. A dose **adiada** volta sempre, também a do Day Care e a de quem tinha saída: não segura a tela e volta pelo dia dela.
- **Limites (não resolvidos nesta story):** app aberto do zero depois da meia-noite (aba descartada pelo celular, iPhone que recarrega a aba, celular reiniciado): a dose de ontem não toca; só o vigia do servidor, de manhã. O remédio suspenso pela veterinária em **outro** aparelho só sai da agenda deste depois que a lista de hóspedes é relida (de dia já era assim). Celular que acorda com a conexão morta sem saber (rede trocada no bolso) pode abrir o alarme com o registro velho: «Dei o remédio» continua barrado se outra pessoa já assinou, e o alarme manda conferir. O alarme na tela sem resposta continua sendo um alarme por vez (regra da 6.32): as doses de hoje esperam até alguém responder («Dei o remédio», ADIAR ou, passado o horário seguro, «Entendi — não vou dar»); a dose de hoje que tocou atrasada e foi dada pelo alarme depois do horário seguro, de madrugada (0h às 6h), faz a próxima avisar. O aviso da dose anterior registrada tarde só vem do «Dei o remédio» do alarme deste aparelho (ou da transação que mostra que outro aparelho assinou a mesma dose desse alarme): o registro pela ficha e o de outro aparelho não avisam, porque a dose dada na hora e registrada depois não é dose tardia (4ª rodada); o aparelho aberto do zero não sabe. «Entendi — não vou dar» vale neste aparelho: numa dose de hoje, a recarga das 6h apaga a marca, e o alarme volta mandando dar. O adiado do Day Care com pernoite, com a tela segura em ontem pela ficha aberta e a agenda relida depois da meia-noite, só volta quando a tela passa para hoje. Com a ficha posta à mão em ontem (para conferir a dose de ontem que voltou com a tela em hoje), o adiado não toca e não segura a recarga (regra da 6.32 para outra data): parado 3 minutos, a página recarrega e ele não volta (5ª rodada, registrado). Um alarme que abre com o aviso do descarte já na tela fica por baixo dele até o «Entendi», e o aviso do descarte ainda substitui outro aviso aberto. O remédio suspenso só descarta o adiado de outro dia depois que a agenda deste aparelho é relida. A mensagem do Telegram da dose de ontem não diz "de ontem" nem o atraso.
- **Onde está no código:** `zDiaOntemEstado` / `zDiaOntemPendente` (em `zDiaTelaAvancar` e `zViradaDoDiaTick`), `medOntemNaJanela`, `medOntemTeto`, `medOntemPendentes`, `despMedOntemPend`, `MED_ONTEM_TETO_MS`, `MED_ONTEM_CONF_MS`; o celular que acorda: `medOntemAcordou`, `medOntemSincronizado`, `medOntemLigarConexao` (`.info/connected`), `medOntemBatida`, `medOntemVisibilidade`, o evento `resume`, `medOntemReconferir`; o dia do alarme: `despMedAtualDia` (em `mostrarDespertadorMed`, `confirmarDoseDespertador` e `registrarDoseAgendadaGlobal`) e `zDiaOntemSegura` (em `aplicarLogin`); o «Hoje»: `zDiaHojePergunta` (em `goToToday`, `fichaHoje`, `changeDate` e `fichaMudaDia`) e `medOntemResponder`; o adiado de outro dia: `despMedSnoozeDia` / `despMedSnoozeIt` (em `adiarDoseDespertador`) e `medAdiadoDeOutroDia` (em `checarDespertadorMed`); o adiado desta noite: `medAdiadoPendente` / `medAdiadosPendentes`; o remédio que saiu da agenda: `medAdiadoForaDaAgenda` / `medAdiadoAvisarDescarte` / `medAdiadoMostrarDescarte` (`__medDescarteAviso`), `MED_AGENDA_DIA` / `MED_AGENDA_INTEIRA` / `MED_AGENDA_SUSPENSOS` (em `carregarAgendaMedTodos`); o registro pela ficha com o adiado de outro dia e o alarme que só fecha na mesma dose: `_diaOutro` / `_fecharSeDaDose` (em `registrarDoseAgendadaGlobal`); a pergunta em `aplicarVersaoNova`; `statusDoseMed` com o dia; os textos do alarme: `medDespTextos`, `medDespRedesenhar` (a cada batida de `checarDespertadorMed`), `medAtrasoTexto`, `medRotuloDia`, `medTardiaMarcar` / `medTardiaAviso` / `medProximaDose` / `medDiaSeguinte`; depois do teto (3ª rodada): `MED_ONTEM_BEIRA_MS`, `MED_TX_PASSOU` / `MED_TX_BEIRA`, `despMedNaoDar`, `despMedSegundoBotao`, `medNaoVouDar` / `medNaoDarFeito`, `medOntemPendNaoDar`, `medAdiadoDescartar` / `medAdiadoVoltaNaoDar`; a página escondida: `MED_ONTEM_PULO_OCULTO_MS`; o estoque: `descontarEstoquePorDose(…, dia)`; `saidaHoje` na agenda (`carregarAgendaMedTodos`); `.desp-med{top:var(--z-faixa-topo-h)}` e `zFaixaVersao`.
- **Provas:** `tests/fase0-ciclo-fechado.test.js` (49 provas da 6.47 — 17 da 1ª rodada, 11 da 2ª, 12 da 3ª, 4 da 4ª e 5 da 5ª — e 2 da 6.32 ajustadas, todas com relógio fixo; a prova da 6.32 da dose adiada foi reescrita com relógio fixo, porque mudava de resultado entre 0h e 3h). Contra a versão anterior (master), falham as da 6.47 e as 2 da 6.32 ajustadas; contra a 1ª rodada, as 9 da 2ª que medem achado falham, e as 2 ajustadas (o texto com os trechos que mudam e o «Hoje» que pergunta). Defeitos plantados: 59 da 1ª rodada (58 pegos, 1 equivalente) e 62 nas linhas da 2ª rodada (todos pegos, contando os da 1ª rodada e do QA refeitos no texto novo). Chromium com Firebase de mentira e relógio de São Paulo: o alarme «23:30 de ontem» abre 5,5 s depois de o celular acordar, «Dei o remédio» registra em 07/10, a tela passa para 08/10 e a dose das 00:30 de hoje toca depois; na versão anterior, nenhum alarme de ontem e nada registrado. «Hoje» com o alarme de ontem na tela pergunta antes; «Ir para hoje mesmo assim» + ADIAR: o alarme volta 5 minutos depois e grava em 07/10. O alarme que passa do teto troca a instrução na tela. 3ª rodada: contra a 2ª, as 12 provas novas e 2 ajustadas falham; 76 defeitos plantados nas linhas novas (74 pegos, 2 equivalentes). No Chromium, o alarme das 22:30 de ontem troca o ADIAR por «Entendi — não vou dar» às 00:29:57; o toque fecha, nada é gravado, a tela passa e a dose de hoje das 01:00 toca às 00:55; a aba escondida com 1 batida por minuto passa para hoje às 00:01 e a dose das 00:30 toca às 00:25; a seta «›» com a pergunta vai para hoje (na 2ª rodada, para amanhã, e a página recarregou). 4ª rodada: contra a 3ª, 16 provas falham (7 novas ou refeitas e 9 ajustadas); 52 defeitos plantados nas linhas novas (51 pegos, 1 equivalente). No Chromium: ADIAR às 23:50 e a cada volta — a tela passa à meia-noite, o Rex das 00:30 de hoje toca às 00:25 e a Bia volta de 5 em 5 minutos pelo dia dela, gravada em 07/10 (na 3ª rodada, a tela ficava em ontem e o Rex não tocava); Day Care com pernoite e «ADIAR 5 min» às 00:01 (ou às 23:58): o alarme volta às 00:06 (00:03) dizendo «23:30 de ontem» e grava em 07/10 (na 3ª rodada, nunca voltava); antibiótico de 4 em 4 h com a dose das 00:30 dada às 02:31 (o alarme da Bia prendeu a fila): a das 04:30 diz que a anterior foi registrada às 02:31 e não manda dar (na 3ª rodada, mandava dar 1 h 55 min depois). 5ª rodada: contra a 4ª, 7 provas falham (as 5 novas e 2 ajustadas); 31 defeitos plantados nas linhas novas (todos pegos). No Chromium: a Bia adiada logo depois da meia-noite e dada pela ficha às 00:01, com a tela já em 08/10, grava em 07/10, a tela diz «DOSE REGISTRADA NO DIA DELA», o botão volta a «Dei agora», o adiado não volta e o Rex das 00:30 toca às 00:25 (na 4ª rodada, gravava em 08/10 e o adiado voltava às 00:06); o «Dei agora» do Rex na ficha com o alarme de ontem da Bia na tela deixa o alarme da Bia na tela, e «Dei o remédio» nele grava em 07/10 (na 4ª rodada, o alarme da Bia sumia).

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
