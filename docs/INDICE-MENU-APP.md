# Índice do app — menu aprovado pela Adriana (reorganizado em 08/set/2026, ajustado em 15, 17, 18, 19, 21, 24 e 25/set/2026)

> Regra: o app tem de ser autoexplicativo, para treinamento rápido. Cada item tem **Título** e **subtítulo** (a explicação curta que aparece como dica no menu e no índice da Gestão no computador). Nomes são decisão da Adriana.

## O que mudou em 25/set/2026 (v 2026-09-25-01) — Fase 0 do "ciclo fechado"

> **Origem:** auditoria completa de 25/set/2026 e PRD-006 ("nada fica sem cobrar, nada fica esquecido"). A Adriana respondeu "ok" para todas as recomendações e autorizou a Fase 0. **Nada aqui foi publicado ainda:** a versão fica no branch até a Adriana aprovar a publicação, porque o sistema está em uso.

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

### (Q) Fechamento por assunto

> **Adriana, 25/set/2026:** *"Pode seguir com o fechamento por assunto."*

**Antes:** a conversa com o tutor só fechava pelo "Sim" do cartão inteiro, e o cartão só sai quando tudo está em dia. Se o vermífugo já estava registrado na ficha, mas a vacina continuava no cartão, a conversa do vermífugo **continuava sendo cobrada**.

**Agora:** cada **assunto** fecha sozinho quando a ficha deixa de ter item dele no cartão daquele dia.

| O quê | Como |
|---|---|
| Quando | toda vez que uma data de prevenção é gravada na ficha, de qualquer tela (quadro do cartão, aba Prevenção, blocos da ficha, "Vence em" digitado), e só depois de a gravação dar certo. Lançamentos do dia não grava a ficha e, por isso, não fecha nada |
| Dias considerados | antes de fechar, o aparelho relê do banco os dias de conversa (30 dias para trás e 21 para frente), com a mesma trava de 2 minutos da Mesa e de Hoje na Zêluz. Assim fecha também no aparelho que só abriu a Prevenção |
| Onde fica registrado | no mesmo registro da conversa: `daycare/vencimentos/{dia}/{chave}/fechados/{assunto}` = quem, quando e `via: ficha`. Vale para todos os dias em que houve conversa sobre aquele assunto |
| O que fecha | só o assunto que **foi conversado** com o tutor (mandado, respondido, cobrado ou tentado) e que não tem mais item dele no cartão. A pergunta "fazer hoje?" do mesmo assunto fecha junto |
| O que continua aberto | todo assunto com item ainda no cartão (a vacina continua sendo cobrada) e o assunto que ainda nem foi mandado |
| A pergunta "fazer hoje?" | tem janela própria: vale até a próxima vinda (mais a folga de Configurações). Enquanto o item ainda estiver nessa janela, ela **não** fecha, mesmo que o cartão do dia tenha esvaziado. Em semana de feriado isso importa (ex.: 05/10, ele só volta em 19/10). A mesma janela vale para o fechamento pelo quadro |
| Data apagada | apagar a data não é resolver: o item que virou "em aberto" segura o assunto que foi conversado |
| Reabre | se a data for corrigida para trás (gravou no FILHOt errado e desfez), o assunto que **a ficha** fechou volta a ser cobrado. O que o tutor respondeu não é tocado |
| Se o fechamento automático falhar | fica no log de falhas, sem alerta para quem salvou a ficha (a ficha foi salva) |
| Em todas as telas | cartão de Vencimentos, calendário, contagens, Respostas pendentes, Quem chamar hoje, Hoje na Zêluz e aba Com o tutor, que mostra "**resolvido na ficha** (quem, quando)" |
| Recado da veterinária | sai quando a vacina foi resolvida na ficha. Quando só o "em aberto" fechou (por exemplo, com a data velha da carteirinha) e a vacina ainda deve, o recado **fica** |

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
- `node tests/fase0-ciclo-fechado.test.js`: 105 provas (com os cenários A, B, D, F, G, H, I e J do fechamento pelo quadro e o fechamento por assunto, incluindo os achados do QA8);
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
