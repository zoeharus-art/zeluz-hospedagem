# Mapa do Dado e Estado Global — AuAulândia (`index.html`)

> 25/ago/2026 · Auditoria somente leitura, sem alterar o app.
> Base: cópia congelada do arquivo no início desta auditoria (`22.299` linhas — o `index.html`
> real estava sendo editado por outro agente ao mesmo tempo; para não misturar dois arquivos
> diferentes na mesma tabela, esta análise trabalha inteira sobre essa cópia parada no tempo).
> Ponto de partida: `AUDITORIA-FASE0-FASE1.md`, seção "Fase 1d — Mapa do dado".

**Números de referência:** 65 nós de primeiro nível no banco, cobrindo 331 pontos de leitura ou
escrita (`DB.ref(...)`) espalhados por mais de 220 funções · 340 variáveis globais de topo
(`let/var/const` do `<script>` principal) · 10 campos do cadastro sincronizados manualmente entre
`daycare/cadastro` e `auaulandia/cadastro`.

---

## 1. Mapa dos nós do banco

Cada nó abaixo é `daycare/...` ou `auaulandia/...`. "Grava" e "Lê" listam as funções (não as
telas — a coluna Tela(s) resolve isso). `on` = ouvinte permanente (`.on('value')`, carrega uma vez
no login e atualiza sozinho); `once` = leitura pontual. Números de linha referem-se à cópia
congelada desta auditoria.

### 1.1 Cadastro (o FILHOt em si)

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `daycare/cadastro/{key}` | `onCadGravar` L5344, `onCadNome` L5357, `setHospAlergia` L4824, `setPelExtra` L12336, `criarPeludinhoENovoHospedeForcado` L10300, `criarAluno` L13868, `excluirCadastroPel` L13899, `renomearCadastroPel` L12513-12514, `ciSalvarRestricao` L19087, `ciCriarNovoHospede` L19151, `hospAbrirFicha` L20959 | ouvinte único em `wireFirebaseListeners` L3550 → alimenta `pelCadCache` (cache-mestre lido por 76 funções via `PELUDINHOS`) | nome, raça, tutor, nascimento, sexo, castração, chip, dias, **restrição/alergia**, ficha completa (vacinas, peso, carrapaticida — via `setPelExtra`), `_novo`, `freq`, `excluido`/`motivoExclusao`, `movido_para` | Ficha do peludinho, Cadastro (Day Care), Check-in (novo hóspede), Carteira |
| `auaulandia/cadastro/{key}` | `onCadGravar` L5344, `onCadNome` L5357, `onBrinq` L5379, `preCadastro` L5389-5390 (2 chips fixos, hardcoded), `ciSalvarCadastroFalta` L18973 (espelha só 4 campos) | ouvinte em `wireFirebaseListeners` L3547 → `cadCache`; leitura pontual `carregarCadastro` L5385 | mesmos 10 campos "de ficha" + `brinquedos` (campo que **só existe aqui**) | Ficha da hospedagem (aba Cadastro) |
| `daycare/fotos/{key}` + `daycare/fotos-v` | `salvarFotoCad` L3508-3509 | `carregarFotos` L3495/3498 (versão + payload, para não baixar tudo se nada mudou) | foto do FILHOt em base64 | Ficha, cards |
| `daycare/excluidos/{key}` | `excluirCadastroPel` L13898 | — (backup de auditoria) | cópia integral do cadastro + ficha completa no momento da exclusão, motivo, quem, quando | (sem tela própria — só backup) |
| `daycare/irmaos/{id}` | `irmSalvar` L15362, `irmDesfazer` L15374 | ouvinte `irmaosCarregar` L15238 | vínculo `nome__tutor` de duplas (16 confirmadas) | Ficha, Pertences, EA |
| `auaulandia/pertences-banco/{k}` | `ciAddPertItem` L19541, `ciRenomearPertBanco` L19514, `ciExcluirPertBanco` L19527 | `carregarPertBanco` L18876 | itens de guarda-volumes cadastrados por nome (mochila, coleira, vasilha) | Check-in, Pertences |

### 1.2 Presença / chamada (Day Care)

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `daycare/chamada/{dia}` | `marcarPresenca` L14130, `ckSalvar` L15336, `aplicarFaltaAutomatica` L6266 | `carregarChamada` L14138, `aplicarFaltaAutomatica` L6252 | presente/falta por FILHOt no dia | Chamada, Painel do Dia |
| `daycare/checkin-corpo/{dia}` **ou** `daycare/checkout-corpo/{dia}` (via `ckNo()` L14702, alterna conforme `ckEhEntrada()`) | `ckSalvar` L15334 | `ckCarregarEntradaDoDia` L15358, `aplicarFaltaAutomatica` L6251, `relCheckinHoje` L18042 | check-list corporal (pontos, coco, foto) — entrada OU saída do dia, mesmo nó alternado | Check-in/Checkout Day Care |
| `daycare/checkin-hist/{k}` | `ckSalvar` L15338 | `carregarHistCheckin` L13705 | histórico consolidado de check-ins | Ficha (histórico) |
| `daycare/avulsos/{dia}` | `escolherAvulso` L14000 | `carregarChamada` L13942 | FILHOt avulso do dia (sem plano fixo) | Chamada |
| `daycare/trocas/{dia}/{k}` | `trocaLancar` L4360, `trocaDecidir` L4374/4379, `trocaCancelar` L4386 | ouvinte `trocaCarregar` L4319 | pedido de troca de dia de plano | Trocas |
| `daycare/reposicao/{k}/lancamentos` | `repGravar` L4127 | ouvinte em `wireFirebaseListeners` L3556 → `REPO_CACHE` | saldo de reposição (falta avisada vira crédito) | Reposição |
| `daycare/abertura-m1/{dia}` | `toggleAberturaM1` L17138 | `carregarAberturaM1` L17137 | checklist de abertura do Day Care (M1) | Painel do Dia |

### 1.3 Alimentação / almoço — o nó mais fragmentado do app

O próprio código documenta a fragmentação em comentário (L5053-5058, "O JANTAR DO HÓSPEDE",
22/ago/2026): *"A informação SEMPRE existiu — só nunca chegou a quem serve. Ela mora em três
lugares, nesta ordem de confiança: 1. `ficha.alim` da estadia … 2. `daycare/almoco-cad` … 3.
nada"*. Na prática, o assunto "comida" tem **9 nós** distintos:

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `auaulandia/estadias/{id}/ficha.alim` | check-in de hospedagem (`__ciGravar` L20107 e segs.) | `alimDoHospede` L5079/5084 (via `CF_ESTADIAS`), conferência (`cfConfirmarRacao` L21387 etc.) | ração, marca, quantidade por refeição — **fonte de maior confiança** | Check-in, Ficha, Conferência de Fotos |
| `daycare/almoco-cad/{k}` | `setAlmCad` L10821, `renomearCadastroPel` L12506 | ouvinte `wireFirebaseListeners` L3563 → `almCadCache`; `alimCarregarAlmocoCad` L5069 | cardápio-cadastro do almoço do Day Care — usado como **substituto** quando não há `ficha.alim` (pernoite sem check-in) | Cadastro do almoço |
| `daycare/almoco/{dia}` | `marcarAlmoco` L17555, `carregarGenerico` (push) L15960 | `carregarAlmoco` L17214, `resumoDiaMontar` L16879, `abrirEmporio` L21731 | marcação "comeu / não comeu" do almoço do dia (1º e 2º horário) | Almoço (grade) |
| `daycare/almoco-excecao/{dia}/{k}` | `chamadoResponder` L6052 | ouvinte `almEscutarExcecoes` L18179 | exceção pontual de almoço lançada pela recepção | Recepção → Almoço |
| `daycare/almoco-prep/{dia}` + `daycare/almoco-prep-turno/{dia}` | `toggleAlmPrep` L14411 / `turnoTrocar` (via `iniciarPrep`/`encerrarPrep` L17570-17572) | `carregarAlmoco` L17218/17216 | etapa "preparação" do almoço — status por FILHOt + turno/cronômetro em nó irmão | Almoço (fases) |
| `daycare/almoco-exec/{dia}` | `confirmarExec` L14418 | `carregarAlmoco` L17220 | etapa "execução" (servir) | Almoço (fases) |
| `daycare/almoco-final/{dia}` + `daycare/almoco-final-turno/{dia}` | `toggleAlmFinal` L14425 / `iniciarFinal`/`encerrarFinal` L17574-17576 | `carregarAlmoco` L17219/17217 | etapa "finalização" — status + turno em nó irmão | Almoço (fases) |
| `daycare/almoco-turno/{dia}` | `iniciarAlmoco`/`encerrarAlmoco` L17545-17547 (via `turnoTrocar`) | `carregarAlmoco` L17215 | cronômetro do turno do almoço "genérico" (distinto das 3 fases acima) | Almoço |
| `daycare/atividade/{dia}/almoco2` | `marcarAlmoco2` L15969 | `carregarGenerico` L15762 | marcação do 2º horário (quem não comeu no 1º) | Almoço (2º horário) |
| `daycare/avisos-telegram-comida/{dia}/{k}` + `daycare/avisos-comida/{dia}` (Empório) | `avisarGrupoComida` L16024, `_comidaFalhou` L16037, `empAvisar` L21913, `empAvisarDia` L21926 | `avisarGrupoComida` L16000 | registro de aviso ao tutor sobre recusa alimentar | Avisar tutores |

**Leitura:** "almoço" não é 1 conceito, são pelo menos 3 fluxos empilhados (status por FILHOt ×
3 fases de preparo × cronômetro de turno por fase) mais o cardápio-cadastro e a exceção da
recepção — 9 nós que **nada garante que concordem entre si**. É exatamente o padrão que já
causou o bug de 08/ago (`almoco` vs `almoco-turno` dessincronizados).

### 1.4 Medicação — 4 nós, nenhuma visão única

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `auaulandia/medicacao-agenda/{key}/itens/{id}` | `salvarMedAgenda` L5802/5808, `vetSalvarMed` L11873-11874, `vetSuspenderMed` L11889, `vetReativarMed` L11902, `vetCienteFimMed` L12207, `magRemoverItem` L5702, `descontarEstoquePorDose` L5933 (transaction), `__ciGravar` L20125-20187 | `carregarMedAgenda` L5829, `carregarAgendaMedTodos` L11473, `vetCarregarMed` L11769, `ciPreencherMedicacao` L19443, `registrarDoseAgendadaGlobal` L6623 | **prescrição/agenda**: nome do remédio, dose, horários, estoque | Ficha (medicação), Vet, Check-in |
| `auaulandia/medicacao-log/{dia}/{key}/{doseId}` | `registrarDoseAgendadaGlobal` L6630/6632, `registrarDoseAvulsa` L6671 | `dosesMedDoDia` L6722, `resumoDoTurno` L7369, `checarDespertadorMed` L11525, `carregarMedAgenda` L5830 | **execução**: dose realmente dada hoje, quem deu, hora | Plantão, despertador de dose |
| `daycare/med-dia/{dia}` | `ptSalvar` L15941 | `carregarAgendaMedTodos` L11490 | resumo simplificado de medicação do dia (visão Day Care) | Pertences/Chamada |
| `daycare/conferir-medicacao/{dia}/{pk}` | `salvarRelatorioCard` L7096 | — (só grava, ninguém lê de volta neste arquivo) | flag de conferência do relatório de plantão | Relatório de turno |

**Leitura:** "o remédio foi dado?" exige cruzar `medicacao-agenda` (o que precisa) com
`medicacao-log` (o que foi feito) — dois nós, chaves diferentes (`key` vs `dia/key/doseId`), sem
nenhuma view/join no banco. `daycare/med-dia` e `daycare/conferir-medicacao` são visões paralelas
que também podem divergir das duas primeiras.

### 1.5 Estadias / check-in / check-out (hóspedes com ficha completa)

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `auaulandia/estadias/{id}` | `_hospGravarNova` L20935, `__ciGravar` L20057-20167 (check-in completo), `hospConfirmarBaixa` L20654, `hospSalvarDatas` L20839, `hospAbrirFicha` L20960, `cancelarPernoiteFicha` L10607, `coFinalizar` L22248 | ouvinte `wireFirebaseListeners` L3600 (indexa em `CF_ESTADIAS`), `resumoDoTurno` L7370, `carregarManuais` L10136, várias telas de conferência (`ciCorrigirExistente`, `ciAcrescentarNoExistente`) | ficha completa: alimentação, SPA, medicação vinculada, ocorrências, conferência, `checkout_etapa1` | Check-in, Ficha, Conferência, Checkout |
| `auaulandia/estadias/{id}/ocorrencias/{ocId}` | `cfAddOcorrencia` L21567, `cfRemoverOcorrencia` L21577, `ocorrAvisarTutor` L6349, `ocorrReabrir` L6357 | `carregarOcorrenciasDayCare` (nó irmão `daycare/ocorrencias`, ver abaixo) | ocorrência do hóspede (comportamento, saúde) e desfecho | Conferência, Ocorrências |
| `daycare/ocorrencias/{k}/{ocId}` | `ckSalvar` L15343, `ocorrResolver` L6336 (caminho condicional — ver §2.5) | `carregarOcorrenciasDayCare` L6202 | ocorrência do **Day Care** (FILHOt sem estadia de hospedagem) | Check-in Day Care |

### 1.6 Pernoite / manuais (hóspedes SEM ficha completa)

| Nó | Grava | Lê | Guarda | Tela(s) |
|---|---|---|---|---|
| `auaulandia/manuais/{dia}` | `escolherHospede` L10350, `salvarPernAgendado` L10419, `cancelarHospedeManual` L10443, `removerHospedeCard` L10508, `hospTrazerDeVolta` L10586, `cancelarPernoiteFicha` L10632 | `carregarManuais` L10131, `acertoCarregarPernoites` L8659 (**acerto financeiro só lê daqui**), `ciChecarPernoiteJaLancada` L18851 | lançamento manual de hóspede/pernoite pela recepção — **sem passar por `estadias`** | Plantão (hóspedes), Acerto de plantonista |
| `auaulandia/removidos/{dia}/{k}` | `removerHospedeCard` L10502/10515, `hospTrazerDeVolta` L10583, `cancelarPernoiteFicha` L10621 | `carregarRemovidosHoje` L10551, `acertoCarregarPernoites` L8660 | hóspede/pernoite removido do dia (cancelamento) | Plantão |

**Leitura:** o acerto financeiro de plantonista (`acertoCarregarPernoites`, base do pagamento)
lê **somente** `auaulandia/manuais` + `auaulandia/removidos`. Pernoites de hóspedes que **têm**
ficha completa em `auaulandia/estadias` (check-in feito) não entram nessa conta — é a origem
concreta do "18 noites a menos" registrado na memória de 18/ago.

### 1.7 "Checkout" — 4 significados diferentes no mesmo arquivo (a auditoria de 22/ago já
apontava 3; a leitura completa achou um quarto)

| Nó | Significado | Funções |
|---|---|---|
| `daycare/checkin-corpo` **ou** `daycare/checkout-corpo` (mesmo nó, sufixo trocado por `ckNo()`) | saída do FILHOt do Day Care **no fim do dia** | `ckSalvar`, `ckCarregarEntradaDoDia` |
| `auaulandia/checkout/{dia}` | checklist do **plantonista** (protocolo de fechamento do turno) | `carregarCheckoutPlantao` L17109, `toggleCheckoutPlantao` L17110, `salvarCheckoutPlantao` L17111 |
| `daycare/pontos-checkout/{mes}` | **gamificação** — pontos do monitor por tarefa de checkout cumprida | `ritmoPontosCarregar` L17419, `coMeusPontos` L21954, `coFinalizar` L22255 |
| `auaulandia/estadias/{id}/checkout_etapa1` + `coFinalizar` sobre `auaulandia/estadias/{id}` | **hóspede saindo de fato** (o FILHOt vai embora) | `coFecharEtapa1` L22109, `coFinalizar` L22213 |

Quatro conceitos diferentes — "o FILHOt saiu do prédio hoje", "o plantonista cumpriu o protocolo",
"o monitor ganhou pontos" e "o hóspede está de saída definitiva" — competem pela mesma palavra em
4 nós e famílias de função (`ck*`, `checkout*`, `pontos-checkout`/`co*`). Nenhum deles referencia
os outros.

### 1.8 Reposição, irmãos, prevenção — os que já funcionam bem

| Nó | Grava | Lê | Guarda |
|---|---|---|---|
| `daycare/reposicao/{k}/lancamentos` | `repGravar` L4127 | ouvinte único L3556 → `REPO_CACHE` | saldo de reposição — **1 nó, 1 dono, 1 cache** (o harness de 22/ago confirma invariantes sólidas aqui) |
| `daycare/irmaos/{id}` | `irmSalvar`, `irmDesfazer` | ouvinte único L15238 → `IRMAOS_CACHE` | vínculo `nome__tutor` — também 1 nó só, chave composta (16 duplas reais) |
| Prevenção (vacina/vermífugo/coleira/exame/peso) | dentro de `setPelExtra` → `daycare/cadastro/{k}` (não tem nó próprio) | `PREV_ITENS` (const local, L12617) calcula vencimento a partir dos campos do cadastro | datas de última aplicação — **vive dentro do cadastro**, não fragmentado, mas dependente da leitura ampla de `daycare/cadastro` |

### 1.9 Acerto de plantão / pontos

| Nó | Grava | Lê | Guarda |
|---|---|---|---|
| `auaulandia/acerto-plantao/{iso}` | `acertoRecalcular` L9349, `acertoMarcar` L9373 | `acertoCarregar` L8991 | tabela de dobras e pagamento por plantonista/dia |
| `auaulandia/config/acerto-plantao` | `acertoSalvarTabela` L9427 | `acertoCarregar` L8990 | valores/regras da tabela de acerto |
| `auaulandia/config/plantonistas` | `plantAprender` L8812, `plantNaoEhPlantonista` L9149, `plantVoltarAContar` L9159 | `plantCarregarLivro` L8749 | livro de nomes conhecidos como plantonista (aprendizado de grafia — comparação **não normalizada**, achado nº 6 da Fase 1c) |
| `daycare/pontos-checkout/{mes}` | `coFinalizar` L22255 | `ritmoPontosCarregar`, `coMeusPontos` | pontos de gamificação (ver §1.7) |

### 1.10 Auditoria / login / dispositivos

| Nó | Grava | Lê | Guarda |
|---|---|---|---|
| `daycare/auditoria/{dia}` | `doLogin` L9802, `audit` L18293 | `acertoDeduzirQuem` L8956, `renderLoginsBarrados` L9539 | trilha de auditoria (quem fez o quê) — ponto nº 3 da Fase 1c (`~95` gravações com `.catch` vazio incluem o próprio log) |
| `auaulandia/aparelhos/{id}` | `liberarAparelhoDaLista` L9577, `autorizarAparelho` L9780 | `deviceAutorizado` L9772, `renderLoginsBarrados` L9552 | aparelhos autorizados por login |
| `auaulandia/avisos-barrados-dispensados` | `dispensarAvisoBarrado` L9528 | `renderLoginsBarrados` L9553 | avisos de login barrado dispensados |
| `daycare/config/monitores`, `daycare/config/sensiveis`, `daycare/config/atividades`, `daycare/config/auditoria` | `salvarMonitores`, `salvarSens`, `salvarAtiv`, `salvarAuditCfg` | ouvintes em `wireFirebaseListeners` L3548-3565 | listas e regras de configuração da equipe |
| `auaulandia/config/telegram` | `tgSalvarCfg` L18135 | `tgCarregarCfg` L15130, `tgCfgPronta` L15144, várias | credenciais da ponte com o Telegram |
| `daycare/config/ponte-planilha` | `dashSalvarPonte`/`dashApagarPonte` L17752/17777 | `dashCarregar` L17719 | URL + senha da ponte com a planilha do Day Care |

### 1.11 Configuração/outros (orçamento, avisos de estoque/ração, EA, vet, dashboard)

| Nó | Assunto | Funções principais |
|---|---|---|
| `auaulandia/orcamentos/{id}` (11 pontos) | Orçamentos de hospedagem | `orcSalvar`, `orcSalvarEdicao`, `orcCancelar`, `orcStatus`, `orcEnviarPlanilha` |
| `auaulandia/config/orcamento/*` | Preços, feriados, planilha do orçamento | `orcSalvarPrecos`, `orcAddFeriado`, `orcSalvarSheets` |
| `auaulandia/avisos-estoque/{id}` + `auaulandia/avisos-racao/{id}` | Estoque de remédio / ração acabando | `criarAvisoEstoque`, `avisoAddEntrada`, `avisoResolver`, `checarFaltasDaEstadia`, `cfCriarAvisoRacao` |
| `auaulandia/vet-consultas`, `vet-observacoes`, `vet-recomendacoes`, `vet-reavaliacao` | Prontuário veterinário | `salvarConsultaVet`, `vetSalvarObs`, `vetRemoverReavaliacao` |
| `auaulandia/avisos-vet-fila` | Fila de aviso ao veterinário | `vetFilaGuardar`, `vetFilaTentar` |
| `daycare/ea` (Enriquecimento Ambiental) | Registro diário de EA por FILHOt | `eaCarregar`, `eaCongelar`, `eaMarcarTempo`, `eaToggleItem` |
| `daycare/tempo-atividade/{dia}/{slug}` | Cronômetro de cada atividade (inclusive EA) | `ativIniciar`, `ativIniciarAgora`, `ritmoCarregar` |
| `daycare/dashboard/{dia}` (via `dashNo()`) | Espelho para a planilha do Day Care | `dashCarregar`, `dashLancar`, `dashEspelhar`, `dashRemover` |
| `daycare/resumo-gestao/{dia}` | Resumo diário enviado à gestão | `resumoDiaEnviar`, `resumoDiaMontar` |
| `daycare/alergia-confirmada/{k}` | Confirmação de alergia pelo tutor | `algCarregar`, `algResponder` |
| `daycare/aniversario-enviado/{dia}` | Controle de aviso de aniversário | `anivEnviarTelegram` |
| `daycare/banho`, `daycare/banho-aviso` | Marcação e despertador de banho | `toggleBanho`, `fecharDespertador` |
| `auaulandia/cafe`, `auaulandia/cafe-turno` | Café da manhã (marcação + turno) | `marcarCafe`, `cafeCarregar`, `iniciarCafe` |
| `auaulandia/relatorios/{ficha}` | Relatório de turno (dia/início/noite) — tem migração de formato antigo (`migrarAntigo`) | `salvarRelatorioCard`, `carregarFicha`, `resumoDoTurno` |
| `daycare/avisos-plantao/{dia}/{tipo}/{k}` (via variável `base`, não string literal direta) | Aviso de intercorrência ao grupo de gestão | `plantaoAvisoGestao` L7283, `plantFalhou`, `plantChecarFechamento` |

---

## 2. As 6 fragmentações da auditoria de 22/ago — verificadas

### 2.1 Alimentação/jantar em 3 lugares → na prática, **9 nós** (ver §1.3)

**Confirmado e maior do que o diagnosticado.** O código admite 3 fontes de confiança em
comentário próprio (L5053-5058), mas ao redor delas existem 6 nós adicionais só para o fluxo de
"almoço" do Day Care (cardápio, status, 3 fases de preparo, cronômetro de cada fase, exceção da
recepção).

- **Dono recomendado:** `auaulandia/estadias/{id}/ficha.alim` para quem tem check-in de
  hospedagem; `daycare/almoco-cad/{k}` como cadastro-mãe do cardápio do Day Care (já é chamado de
  "cadastro" no nome — faz sentido virar a fonte única de "o que este FILHOt come").
- **Quem teria que mudar:** `alimDoHospede` (L5079) já faz esse fallback em cascata — o problema
  não é essa função, é que os 6 nós de `almoco-*`/`almoco-*-turno` não alimentam essa cascata:
  eles só respondem "comeu hoje?", nunca "o que ele come". Migração seria: 1) os 3 pares
  fase+turno (`almoco-prep`/`-prep-turno`, `almoco-exec`, `almoco-final`/`-final-turno`) viram
  **um único documento por dia por FILHOt** com um campo `fase` e um campo `turno` dentro dele, em
  vez de 6 nós paralelos; 2) `almoco` (status) e `almoco-turno` (cronômetro "genérico") somem —
  hoje não está claro em que fluxo eles ainda são usados fora dos três pares de fase.

### 2.2 Cadastro duplicado `daycare/cadastro` × `auaulandia/cadastro` — campo a campo

**Confirmado.** Sincronizado à mão em 2 pontos (`onCadGravar` L5344 e `onCadNome` L5357, cada um
com **duas chamadas `DB.ref` seguidas**, uma para cada nó) e espelhado parcialmente por
`ciSalvarCadastroFalta` (L18973).

| Campo | Escrito em `daycare/cadastro` | Escrito em `auaulandia/cadastro` | Sincronizado? |
|---|---|---|---|
| `nome` | ✅ | ✅ | Sim — `onCadGravar`/`onCadNome` |
| `nasc` | ✅ | ✅ | Sim — `onCadGravar` (e `ciSalvarCadastroFalta`) |
| `idadeAprox` | ✅ | ✅ | Sim — `onCadGravar` |
| `raca` | ✅ | ✅ | Sim — `onCadGravar` (e `ciSalvarCadastroFalta`) |
| `corPelo` | ✅ | ✅ | Sim — `onCadGravar` |
| `sexo` | ✅ | ✅ | Sim — `onCadGravar` |
| `castrado` | ✅ | ✅ | Sim — `onCadGravar` |
| `tutor` | ✅ | ✅ | Sim — `onCadGravar` (e `ciSalvarCadastroFalta`) |
| `chip` | ✅ | ✅ | Sim — `onCadGravar` (e `ciSalvarCadastroFalta`) |
| `dias` | ✅ | ✅ | Sim — `onCadGravar` |
| `restricao`/alergia | ✅ (`setHospAlergia` L4824, `ciSalvarRestricao` L19087) | ❌ | **Não — só daycare** |
| ficha completa (vacina, carrapaticida, peso, `alim_refs`, …) | ✅ (`setPelExtra` L12336, patch genérico) | ❌ | **Não — só daycare** |
| `_novo`/`freq` (cadastro criado no plantão ou no Day Care) | ✅ (`criarPeludinhoENovoHospedeForcado`, `criarAluno`, `hospAbrirFicha`, `ciCriarNovoHospede`) | ❌ | **Não — 4 caminhos de criação, nenhum grava do lado hospedagem** |
| `excluido`/`motivoExclusao`/`excluidoPor` | ✅ (`excluirCadastroPel` L13898) | ❌ | **Não** — se o mesmo FILHOt tem registro em `auaulandia/cadastro`, ele fica órfão "ativo" lá |
| `movido_para` (renomeação) | ✅ (`renomearCadastroPel` L12513-12514, atualiza a chave nova e marca a velha) | ❌ | **Não — bug real:** ao renomear, o registro em `auaulandia/cadastro` continua na **chave antiga**, sem `movido_para` e sem espelho na chave nova |
| `brinquedos` | ❌ | ✅ (`onBrinq` L5379) | **Não — só auaulandia** (campo exclusivo desse lado) |
| chip hardcoded (Charlotte, Lana) | ❌ | ✅ (`preCadastro` L5389-5390) | Correção manual pontual, só num lado |

**Fonte de verdade recomendada:** `daycare/cadastro`. É o nó com o cache mais lido do app
(`pelCadCache`, base do array `PELUDINHOS` — 76 funções o consultam), recebe 11 pontos de escrita
contra 8 de `auaulandia/cadastro`, e é o único que guarda alergia/restrição, ficha completa e o
histórico de exclusão/renomeação. `auaulandia/cadastro` deveria virar **espelho somente-leitura**
(ou desaparecer, migrando `brinquedos` para dentro de `daycare/cadastro`). Enquanto os dois
existirem, **toda** função que cria ou renomeia cadastro (`criarAluno`,
`criarPeludinhoENovoHospedeForcado`, `hospAbrirFicha`, `ciCriarNovoHospede`, `renomearCadastroPel`,
`excluirCadastroPel`) precisa passar a gravar também no espelho — hoje só 2 das 11 gravações em
`daycare/cadastro` chegam ao outro lado.

### 2.3 Medicação em 4 nós (ver §1.4)

**Confirmado.** `auaulandia/medicacao-agenda` (prescrição/estoque, 24 pontos de leitura/escrita) +
`auaulandia/medicacao-log` (execução/dose dada, 7 pontos) + `daycare/med-dia` (resumo Day Care) +
`daycare/conferir-medicacao` (flag de conferência, sem leitura de volta no arquivo — é
escrita-e-esquece). "O remédio foi dado?" pede juntar `medicacao-agenda` com `medicacao-log` na
mão — não existe função que faça essa junção de forma genérica; cada tela (`carregarFicha`,
`resumoDoTurno`, `dosesMedDoDia`) refaz o cruzamento à sua maneira.

**Dono recomendado:** `auaulandia/medicacao-agenda` para "o que precisa" (já é a fonte mais
escrita e mais lida) e `auaulandia/medicacao-log` para "o que foi feito" — os dois já fazem
sentido como par (agenda × execução, igual estoque × movimento). O que falta é uma função única
`medicacaoDoDia(pet, dia)` que sempre junte os dois, para que `daycare/med-dia` e
`daycare/conferir-medicacao` deixem de ser visões paralelas e passem a ser **derivadas** dela (ou
simplesmente sumam, se nada mais os lê como fonte).

### 2.4 Pernoite fora de `estadias` (ver §1.6)

**Confirmado, com a causa raiz do "18 noites a menos" identificada.** `acertoCarregarPernoites`
(L8659-8660, a base do pagamento de plantonista) lê **somente** `auaulandia/manuais` +
`auaulandia/removidos`. Um pernoite lançado com check-in completo mora em
`auaulandia/estadias/{id}` e nunca aparece nessas duas leituras — é contado como noite hospedada
para o tutor, mas não entra na conta de pagamento do plantonista que cuidou dele.

**Dono recomendado:** `auaulandia/estadias` deveria ser o único lugar de pernoite — `manuais`
existe porque a recepção precisa lançar um pernoite **rápido**, sem abrir a ficha completa do
check-in. Migração seria: 1) `escolherHospede`/`salvarPernAgendado` (que hoje escrevem em
`manuais`) passam a criar uma `estadia` "leve" (mesmo formato, campos vazios além do essencial);
2) `acertoCarregarPernoites` passa a ler `estadias` filtrando por tipo, e `manuais` vira histórico
somente-leitura do que já foi migrado.

### 2.5 "Checkout" = 3 (na verdade 4) significados (ver §1.7)

**Confirmado e ampliado.** A auditoria original contou 3: gamificação, plantão, hóspede saindo.
A leitura completa achou um 4º: `ckNo()` (L14702) alterna o **mesmo nó** entre
`checkin-corpo`/`checkout-corpo` conforme `ckEhEntrada()` — ou seja, "checkout" também significa
"o FILHOt foi embora do Day Care hoje", um quarto conceito que usa inclusive prefixo de função
diferente (`ck*`) dos outros três (`co*`, `checkout*` avulso).

**Recomendação:** não é preciso um nó único (os 4 fluxos são operacionalmente distintos), mas os
nomes deveriam parar de colidir. Sugestão: `daycare/dia-saida` (em vez de reaproveitar
"checkout" dentro de `ckNo()`), `auaulandia/plantao-checklist` (em vez de
`auaulandia/checkout`), manter `daycare/pontos-checkout` (gamificação, já é claro pelo prefixo
`pontos-`) e manter `estadias/{id}/checkout_etapa1` (esse já é inequívoco por estar dentro da
própria estadia).

### 2.6 `almoco` × `almoco-turno` — status e cronômetro sem garantia de concordância

**Confirmado, e generalizado em §1.3/2.1**: não é um par, são **3 pares** (status + turno) para
prep/exec/final, mais o par avulso `almoco`/`almoco-turno`. Nenhum dos 4 nós de status referencia
o nó de turno correspondente (nem vice-versa) — a concordância depende só da ordem em que a
pessoa toca os botões na tela, que foi exatamente a causa do bug de 08/ago (a auditoria já
documentava isso; esta leitura confirma que o padrão se repete 3 vezes a mais no mesmo arquivo).

---

## 3. Estado global do script

**340 variáveis de topo** (`let`/`var`/`const` declaradas na indentação de 2 espaços do
`<script>` principal — one scope só, sem módulos). Divididas por função:

| Categoria | Quantidade aprox. | Exemplos |
|---|---|---|
| Cache de nó do banco (espelho de `.on`/`.once`) | ~55 | `cadCache`, `pelCadCache`, `almCadCache`, `REPO_CACHE`, `TROCA_CACHE`, `CF_ESTADIAS`, `EST_TODAS`, `MED_AGENDA_GERAL`, `MED_AGENDA_TODOS`, `VET_REAVAL_CACHE`, `VET_OBS_CACHE`, `VET_MED_CACHE`, `VET_CONSULTAS_CACHE`, `IRMAOS_CACHE`, `PEL_HIST_CACHE`, `AVISOS_ESTOQUE_CACHE`, `AVISOS_RACAO_CACHE`, `ORC_LISTA_CACHE`, `TG_CFG`, `PLANT_LIVRO`, `ACERTO_REG`, `AUDIT_CFG`, `DASH_DADOS`, `RITMO_DADOS`, `monCache`, `ckEntradaCache`, `ptEntradaCache`, `ALM_CAD_CACHE` |
| Estado de tela (o que está aberto/selecionado agora) | ~90 | `currentHosp`, `selectedDate`, `ciHosp`, `cfHosp`, `cfEstadiaId`, `coHosp`, `coEstadiaId`, `pelAtual`, `pelAtualIdx`, `dcAtiv`, `dcAba`, `dcDia`, `almStep`, `almTurno`, `hospAbaEdit`, `hospAbaBaixa`, `renovFiltro`, `PREV_FILTRO`, `PREV_ABERTO`, `IRM_ALVO`, `IRM_SEL`, `ckRascunho`, `ptRascunho`, `painelDate`, `dashBusca` |
| Config/lookup estático (não muda em runtime) | ~110 | `DIAS`, `MESES`, `PERM`, `RACAS`, `MED_UNIDADES`, `MED_PLURAL`, `CK_PONTOS`, `CK_INTIMO`, `CK_COCO_PASSOS`, `ATIVS_DC`, `ATIVIDADES_DEFAULT`, `ORC_PRECOS_PADRAO`, `NAV_PAGINAS_ALL`, `ROLE_OPCOES`, `PLANOS_PADRAO`, `SENHAS`, `MONITORES_DEFAULT`, `CHECKOUT_PLANTAO`, `PT_ITENS`, `EA_CATALOGO`, `EA_TIPOS`, `CI_CAD_CAMPOS` |
| Flags/travas/timers | ~45 | `__fbReady`, `__scriptReady`, `__fbWired`, `_appTrancado`, `_inatUltimo`, `_inatTick`, `CARTEIRA_CARREGADA`, `ALM_CAD_TENTOU`, `_relCarregando`, `__ciSalvando`, `__ciTravadoDesde`, `__ciTimerPreso`, `_almVigiaDia`, `_almVigiaRefs`, `_vetFilaRodando`, `__avisoTravado`, `despMedLoopTimer`, `despMedSnooze`, `__cadKeyFixa`, `__cadTimer` |
| Handle de conexão | 1 | `DB` |

### As 10 variáveis mais cruzadas por assuntos diferentes

Medido por: em quantas funções de topo distintas o nome aparece (excluindo `DB`, que por ser o
handle de conexão aparece em 228 funções — praticamente todas — e não é comparável às demais).

| # | Variável | Ocorrências | Funções distintas que a tocam | Assuntos que se cruzam nela |
|---|---|---|---|---|
| 1 | `PELUDINHOS` | 143 | 76 | **Todo o app.** Array-mestre de FILHOts, alimentado por `daycare/cadastro`. Tocado por cadastro, carteira, reposição, irmãos, orçamento, adaptação, vet, EA, aniversário, plantão. É o ponto de maior risco de "mexe aqui, quebra ali" do sistema inteiro. |
| 2 | `currentHosp` | 125 | 35 | Ficha aberta na hospedagem — cadastro, medicação, relatório, foto, alergia, café, header. |
| 3 | `pelAtual` | 118 | 26 | Ficha aberta no Day Care — cadastro, renovação, peso, óbito, categoria, atividades seletivas. |
| 4 | `ciHosp` | 101 | 19 | Check-in em andamento — cadastro-em-falta, restrição, PDF, WhatsApp/e-mail, travamento de sessão. |
| 5 | `dcAtiv` | 71 | 28 | Aba de atividade ativa no Day Care — atravessa almoço, banho, EA, chamada, trocas, exclusão de cadastro (controla qual render acontece em telas completamente diferentes). |
| 6 | `hospedes` | 68 | 39 | Lista da hospedagem — plantão, vet, café, acerto, painel de gestão, relatórios. |
| 7 | `ckRascunho` | 57 | 20 | Rascunho do check-in/checkout de corpo — só dentro da família `ck*`, mas é o rascunho local que decide o que vai para `daycare/checkin-corpo`. |
| 8 | `ptRascunho` | 57 | 20 | Rascunho de pertences — equivalente ao `ckRascunho`, família `pt*`. |
| 9 | `vetHosp` | 57 | 15 | Ficha do hóspede aberta na aba Vet — consultas, medicação, reavaliação, observações. |
| 10 | `MONITORES` | 31 | 18 | Lista de monitores — permissões, senha, atividades permitidas, painel do dia, orçamento (quem confere pela senha). |

`DB` (564 ocorrências, 228 funções) fica de fora do ranking por ser o handle de conexão — mas é
o motivo pelo qual a Fase 1c aponta ~95 gravações com `.catch` vazio: qualquer uma dessas 228
funções pode estar chamando `DB.ref(...)` num momento em que a conexão está reconectando, e sem
tratamento explícito (como o achado nº 1 da Fase 1c, `registrarDoseAgendada`) a chamada simplesmente
falha em silêncio.

---

## 4. Proposta: documento "dia do FILHOt"

### 4.1 Formato proposto

Um único documento por FILHOt por dia, chave `{petKey}` (mesma chave `nome__tutor` já usada em todo
o app) dentro de `dia/{data}/{petKey}`, substituindo — não *além* — os nós fragmentados:

```
dia/{YYYY-MM-DD}/{petKey}:
  presenca:      { status, hora, origem }              ← hoje: daycare/chamada
  entrada:       { pontos, coco, foto, hora, quem }     ← hoje: daycare/checkin-corpo
  saida:         { pontos, coco, foto, hora, quem }     ← hoje: mesmo nó, ckNo() alternado
  pertences:     { itens, hora_entrada, hora_saida }    ← hoje: daycare/checkin-pertences
  alimentacao:
    fonte:       'checkin' | 'almoco-cad' | 'nenhuma'   ← hoje: cascata em alimDoHospede()
    racao, quantidade, marca, obs
    fases: { prep: {status,turno}, exec: {status}, final: {status,turno} }
    horarios: { cafe, almoco, jantar }                  ← hoje: 9 nós de almoco-*
  medicacao:
    agenda:      [ {item, dose, horario, dado_hoje} ]   ← junção agenda+log já pronta
  ocorrencias:   [ {tipo, desfecho, hora} ]              ← hoje: 2 nós (daycare/auaulandia)
  ea:            { etapas, tempo }                       ← hoje: daycare/ea + tempo-atividade
```

Os nós de **configuração** (cadastro, medicação-agenda como prescrição, pertences-banco,
plantonistas, acerto) continuam separados — eles não são "do dia", são cadastrais/recorrentes.
O que migra para o documento único é só o que hoje está fragmentado *por causa* de pertencer ao
mesmo dia do mesmo FILHOt e viver em nós diferentes.

### 4.2 Ordem segura de migração (escrever nos dois, ler do novo, parar de escrever no velho)

1. **Fase A — escrever nos dois lugares.** Toda função que hoje grava em `daycare/almoco*`,
   `daycare/checkin-corpo`/`checkout-corpo`, `daycare/checkin-pertences`, `daycare/chamada` e
   `daycare/ocorrencias` passa a gravar **também** em `dia/{data}/{petKey}` (mesma transação,
   sem remover a escrita antiga). Nada que lê muda ainda — zero risco de tela quebrar.
2. **Fase B — validar em paralelo.** Rodar por 1-2 semanas com um script de conferência (nos
   moldes do `tests/harness.js` já existente) comparando os nós antigos com o novo documento,
   FILHOt por FILHOt, dia por dia — sem alarme na tela, só log. Só avança se bater.
3. **Fase C — ler do novo.** Trocar as funções de leitura (`carregarChamada`, `carregarAlmoco`,
   `ckCarregarEntradaDoDia`, `carregarOcorrenciasDayCare`, etc.) para ler de
   `dia/{data}/{petKey}` em vez dos nós antigos — uma função por vez, testando cada uma com o
   harness antes de seguir para a próxima. A escrita nos dois lugares continua.
4. **Fase D — parar de escrever no nó velho.** Só depois que **todas** as leituras da Fase C
   estiverem migradas e estáveis por pelo menos 1 semana em uso real, remover a escrita duplicada
   nos nós antigos (um nó por vez, começando pelo menos crítico — `daycare/almoco-turno`, que já
   parece o menos referenciado — e terminando pelo mais crítico — `daycare/checkin-corpo`).
5. **Cadastro (`daycare/cadastro` × `auaulandia/cadastro`) segue à parte**, porque não é dado
   "do dia" — é cadastral. Recomendação separada: aplicar a Fase A/B/C/D da mesma forma, mas o
   destino final é `auaulandia/cadastro` deixar de existir como nó de escrita e virar leitura
   derivada de `daycare/cadastro` (ver §2.2).

Cada fase é reversível sozinha (a fase seguinte só começa depois que a anterior está validada), e
o harness de testes já criado na Fase 0 é a ferramenta natural para a Fase B de cada etapa.
