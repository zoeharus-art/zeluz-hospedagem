# Índice do app — menu aprovado pela Adriana (reorganizado em 08/set/2026, ajustado em 15, 17, 18, 19 e 21/set/2026)

> Regra: o app tem de ser autoexplicativo, para treinamento rápido. Cada item tem **Título** e **subtítulo** (a explicação curta que aparece como dica no menu e no índice da Gestão no computador). Nomes são decisão da Adriana.

## O que mudou em 21/set/2026 (v 2026-09-21-01)

Adriana, em 21/set/2026:

> "Nós temos dentro do aplicativo a parte de trocas: vacinação, que é importantíssimo no nosso processo, a vermifugação, o carrapaticida, a troca de coleiras, tudo isso é muito importante, nós temos também a troca de escova dental. Todas essas questões são de suma importância. Eu preciso facilitar esse processo. Como? Tudo que for vencer no dia, eu ter um calendário do dia para o setor de consultoria, onde vai mandar; isso tem que mandar para o peludo antes dele vir. Vamos imaginar que o dia do Otávio seja amanhã. Hoje tem que perguntar para o tutor: fulano, amanhã pode fazer isso, isso e isso no Otávio? (…) O fluxo hoje não está dando certo: as pessoas estão mandando e não estão finalizando aquilo dali. A gente precisa que dê uma resposta. (…) Então tem que perguntar: já foi atualizada a ficha? E a pessoa tem que clicar em sim ou não."

### Tela nova: **Vence amanhã**

| Onde fica | Central Zêluz › Day Care, **logo depois de Prevenção** |
|---|---|
| `data-v` | `vencimentos` |
| Quem vê | Central Zêluz (consultora), Supervisão, Gestão e Diretoria — pela capacidade `vencimentos-amanha` na tabela `PERM`, revelada por `aplicarPermMenu()`. O monitor **não** vê: quem fala com o tutor é a recepção. |
| Também é concedível | sim — entrou em `NAV_PAGINAS_ALL` (tela do Time), com o **mesmo rótulo** do sidebar |
| Onde os dados moram | `daycare/vencimentos/{dia}/{chave do FILHOt}` |
| O texto e o prazo | `daycare/config/textos/vencimento` — editáveis em **Configurações › Mensagens prontas** |

**Por que ela não é alfabética no bloco.** Todo o subgrupo Day Care da Central está em ordem alfabética até *Planos e cobranças*; "Vence amanhã" fura a ordem e fica colado em **Prevenção** porque é a outra metade do mesmo trabalho: a Prevenção diz **quem deve**, esta diz **o que fazer hoje** a respeito de quem vem amanhã. Separá-las por uma letra faria a consultora procurar em dois cantos do menu.

**O dia-alvo.** Por padrão, o **próximo dia de Day Care** — amanhã; se amanhã for sábado, domingo ou feriado, o próximo dia útil. A lista de feriados é a **mesma** do Orçamento (`orcEhFeriado`), que a Gestão já edita: duas listas discordariam. O seletor tem **Hoje**, **Amanhã** e o calendário para qualquer outro dia.

**Quem entra na lista.** Cada FILHOt da turma daquele dia (mesma porta do Day Care, `turmaDoDia`, com a aba trocada e devolvida) que tenha pelo menos um item de `PREV_ITENS` **vencido ou vencendo até o dia-alvo mais a folga** (padrão 7 dias, ajustável). Entram vacinas, carrapaticida, coleira, vermífugo, exame de fezes, **troca de escova de dentes** e check-up. Ficam de fora: item sem data (não há o que avisar), data quebrada (ano 0026 é ficha para corrigir) e a regra de sempre — *ou é vermífugo ou exame de fezes*.

**O cartão traz**, nesta ordem: nome, raça e tutor · telefone (quando a ficha tem) · os itens com a data (*"Carrapaticida — venceu em 22/07"*) · a **mensagem pronta** numa caixa **editável antes de copiar** · **Copiar mensagem** e **Mandei** · os quatro botões de resposta do tutor · e, quando é a hora, a pergunta da ficha.

**A mensagem.** O modelo é o dela, e mora em Configurações — não no código. As chaves: `{tutor}` (primeiro nome), `{filhot}` (só o nome), `{ofilhot}` (o nome com o artigo certo: *"o Otávio"*, *"a Lana"*), `{dele}`, `{ela}`, `{itens}` (a lista com as datas) e `{dia}` (*"amanhã, terça-feira (22/09)"*). Há **dois** modelos: o padrão e o de **vacina** — vacina não se faz na recepção, então a frase vira *"Podemos agendar com a veterinária?"*. Quando a lista **mistura** vacina com os demais vale o padrão, e a tela avisa a consultora em uma linha.

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

**O aviso que não depende de abrir a tela:** um quadro **Vence amanhã — N mensagens para mandar** em **O que fazer hoje** (nas três mesas: Gestão, Supervisão e Recepção) e no **Dashboard das Consultoras**. Ao lado do item do menu, o contador dos que ainda estão **sem resposta**. Enquanto o dia não desceu do banco, o quadro mostra "…" — nunca afirma que não há nada.

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
| **Central Zêluz › Day Care** | Lançamentos do dia (`dashdc`) | A planilha do Day Care, item por item. | so-recepcao |
| | Pendências de prevenção (`pendencias`) | O que ficou para a próxima vinda: vermífugo, carrapaticida, coleira, medicação e hidratação de quem não veio. | `PERM` `pendencias-prevencao` (consultora · supervisão · gestão · diretoria) |
| | Peso (`peso`) | Pesar qualquer FILHOt: recepção, veterinária e gestão. | so-pesa |
| | Pesquisa com a Família Multiespécie (`alergia`) | A pesquisa com a família: enviar, colar a resposta, e ela vira ficha sozinha. | so-gestao |
| | Prevenção (`vacinas`) | Vacina, vermífugo, coleira e exame de fezes: quem está atrasado e quem está para vencer. | so-gestao |
| | Vence amanhã (`vencimentos`) | Mande hoje a mensagem de quem vem no próximo dia com prevenção vencendo. | `PERM` `vencimentos-amanha` (consultora · supervisão · gestão · diretoria) |
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
