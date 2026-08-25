# Auditoria — Gravações Mudas no AuAulândia (`index.html`)

> Auditoria somente leitura, feita com o app em edição simultânea por outro agente. Os
> números de linha são do estado do arquivo no momento da leitura (25/ago/2026) — podem
> deslocar; por isso toda ocorrência também traz o **nome da função** onde vive.

## 1. Resumo

- **131 gravações** no banco engolem o erro em silêncio — `.catch(function(){})` ou `.catch(()=>{})` vazio — em **113 escritas de banco** (`set`/`update`/`push`/`remove`) e mais **18 leituras/fetches externos** com o mesmo padrão (fora do escopo de "gravação", listadas à parte na seção 5).
- Por gravidade: **19 Alta** (medicação, alergia, check-in/out, presença, auditoria) · **~68 Média** (cadastro, pertences, config, avisos) · **~26 Baixa** (contador, cache, preferência visual).
- Além dos 113, há **2 gravações sem `.catch` nenhum** — pior que o vazio: a promessa de `salvarFotoCad` fica sem tratamento nenhum quando chamada de dentro de um `try{}catch(e){}` (que só pega erro síncrono, nunca rejeição de promessa) na função `renomearCadastroPel`.
- As **5 piores** (Alta, ligadas a segurança do FILHOt e a confiança no próprio sistema de auditoria):
  1. `_vMed` (linha ~7100) — aviso de **divergência de medicação** para a Recepção confirmar com o tutor: se a gravação falhar, ninguém pergunta se o remédio foi suspenso — o caso raiz que gerou o padrão `_logFalhaGrav` continua se repetindo aqui.
  2. `ckSalvar` (linha ~15348) — alerta de **ocorrência/diarreia para a Coordenação**: se falhar, a Coordenação nunca vê o alerta, e a auditoria não mostra "não avisou".
  3. `audit()` (linha 18293) — o **próprio helper de auditoria** grava com `.catch(()=>{})`: se a escrita da auditoria falhar, o evento — inclusive eventos de segurança como `login-barrado` — não fica registrado em lugar nenhum, e ninguém percebe.
  4. `magRemoverItem` / `descontarEstoquePorDose` / `registrarDoseAgendadaGlobal` (linhas ~5707, ~5949, ~6631) — remoção, desconto de estoque e **espelhamento de dose de medicação**: é exatamente a família de bug que causou o caso da Dolly (remédio some da lista por `.catch` vazio).
  5. `cfConfirmarAlarme` (linha ~21549) — confirmação de que o **alarme de remédio foi testado e ouvido** na Conferência: se não gravar, a Conferência mostra "não confirmado" ou pior, mostra confirmado na tela mas nada persiste.

---

## 2. Tabela completa — uma linha por ocorrência

Legenda de gravidade: **A** = Alta (medicação, alergia, check-in/out, dinheiro, auditoria, presença) · **M** = Média (cadastro, pertences, configuração) · **B** = Baixa (contador, cache, preferência visual).

| # | Linha* | Função | Caminho no banco | O que se perde se falhar | Grav. | Correção sugerida |
|---|---|---|---|---|---|---|
| 1 | 4375 | `trocaDecidir` | `daycare/trocas/{data}/{k}` (status: recusada) | a recepção não vê que a troca foi recusada; o tutor fica com resposta pendente | M | `_logFalhaGrav` + mensagem na tela |
| 2 | 4380 | `trocaDecidir` | `daycare/trocas/{data}/{k}` (status: confirmada) | troca acima da vaga não fica confirmada no banco | M | `_logFalhaGrav` + mensagem na tela |
| 3 | 4387 | `trocaCancelar` | `daycare/trocas/{data}/{k}` (status: cancelada) | vaga não volta a ficar livre para outro FILHOt | M | `_logFalhaGrav` + mensagem na tela |
| 4 | 4925 | `marcarCafe` | `auaulandia/cafe/{data}/{k}` | marcação de quem tomou café da manhã some | B | `_logFalhaGrav` |
| 5 | 4932 | `iniciarCafe` | `auaulandia/cafe-turno/{data}` | contagem de quantos tomaram café fica errada | B | `_logFalhaGrav` |
| 6 | 5076 | `alimCarregarAlmocoCad` | (bloco de almoço — comentário já assume falha) | segue sem o almoço carregado, sem avisar quem está vendo a ficha | M | `_logFalhaGrav` + aviso "sem permissão/erro" na tela |
| 7 | 5389 | `preCadastro` | `auaulandia/cadastro/charlotte__sabrina` (chip) | ajuste pontual de microchip não grava | B | `_logFalhaGrav` |
| 8 | 5390 | `preCadastro` | `auaulandia/cadastro/lana__` (chip) | idem acima | B | `_logFalhaGrav` |
| 9 | 5707 | `magRemoverItem` | `auaulandia/medicacao-agenda/{key}/itens/{id}` (remove) | remédio removido na tela continua ativo no banco — pode voltar a alarmar ou ser dado de novo | **A** | `_logFalhaGrav` + travar a remoção visual até confirmar sucesso |
| 10 | 5949 | `descontarEstoquePorDose` | `auaulandia/medicacao-agenda/{key}/itens/{id}/estoque` (transaction) | estoque do remédio não desconta ao dar a dose — projeção de "vai acabar" fica errada | **A** | `_logFalhaGrav` |
| 11 | 5979 | `criarAvisoEstoque` | `auaulandia/avisos-estoque` (push) | aviso de estoque baixo de remédio não é criado — ninguém é avisado que vai faltar | **A** | `_logFalhaGrav` |
| 12 | 5988 | `tocarEstoqueAcabando` | `.../estoque` (acabando:true) | flag "acabando" do remédio não liga — aviso de estoque baixo não dispara | **A** | `_logFalhaGrav` |
| 13 | 6150 | `avisoAddEntrada` | `auaulandia/avisos-estoque/{id}` (entries/status) | resposta/entrada dada ao aviso de estoque não fica registrada | M | `_logFalhaGrav` |
| 14 | 6159 | `avisoResolver` | `auaulandia/avisos-estoque/{id}` (status: resolvido) | aviso de estoque continua "pendente" mesmo resolvido | M | `_logFalhaGrav` |
| 15 | 6161 | `avisoResolver` | `.../estoque/acabando` (set null) | flag "acabando" não limpa — pode continuar disparando aviso já resolvido | M | `_logFalhaGrav` |
| 16 | 6166 | `avisoReabrir` | `auaulandia/avisos-estoque/{id}` (status: em_processo) | aviso de estoque não volta a "em processo" | B | `_logFalhaGrav` |
| 17 | 6336 | `ocorrResolver` | `daycare/ocorrencias/{dia}/{id}/status` (resolvida) | ocorrência do Day Care continua "aberta" mesmo resolvida | M | `_logFalhaGrav` |
| 18 | 6357 | `ocorrReabrir` | `auaulandia/estadias/{id}/ocorrencias/{ocId}/avisadoTutor` (set null) | reabertura da ocorrência não persiste | M | `_logFalhaGrav` |
| 19 | 6415 | `avisoRacaoAddEntrada` | `auaulandia/avisos-racao/{id}` (entries/status) | resposta ao aviso de ração/comida não grava | M | `_logFalhaGrav` |
| 20 | 6424 | `avisoRacaoResolver` | `auaulandia/avisos-racao/{id}` (status: resolvido) | aviso de ração continua pendente | M | `_logFalhaGrav` |
| 21 | 6429 | `avisoRacaoReabrir` | `auaulandia/avisos-racao/{id}` (status: em_processo) | reabertura do aviso de ração não grava | B | `_logFalhaGrav` |
| 22 | 6631 | `registrarDoseAgendadaGlobal` | `auaulandia/medicacao-log/{data}/{key}` (espelho de dose em itens "irmãos") | a cópia do MESMO remédio em outra ficha do FILHOt não recebe a baixa — volta a alarmar como se não tivesse sido dado (caso Dolly/Betaína) | **A** | `_logFalhaGrav` — este é exatamente o bug histórico que a rule de plantão já documentou |
| 23 | 7100 | `_vMed` | `daycare/conferir-medicacao/{dia}/{pk}` | aviso de **divergência de medicação** à Recepção não é criado — ninguém confirma com o tutor se o remédio foi suspenso | **A** | `_logFalhaGrav` + banner de erro visível (hoje só avisa sucesso) |
| 24 | 7296 | `plantaoAvisoGestao` | `daycare/avisos-plantao/{dia}/{tipo}/{k}` (ok:true, "passou bem") | status "avisado" do relatório de plantão não grava — a rodada não fecha para a Gestão | M | `_logFalhaGrav` |
| 25 | 7305 | `plantaoAvisoGestao` | `daycare/avisos-plantao/{dia}/{tipo}/{k}` (ok/erro) | status do aviso de intercorrência ao grupo da Gestão não grava | M | `_logFalhaGrav` |
| 26 | 7320 | `plantFalhou` | `daycare/avisos-plantao/{dia}/{tipo}/{k}` (ok:false) | nem o registro de FALHA do aviso é salvo — fica sem rastro nenhum | M | `_logFalhaGrav` |
| 27 | 7348 | `plantChecarFechamento` | `daycare/avisos-plantao/{dia}/{tipo}/__fechamento` | fechamento da rodada de plantão para a Gestão não grava — pode repetir o resumo | B | `_logFalhaGrav` |
| 28 | 8177 | `orcSalvarEdicao` | `auaulandia/orcamentos/{id}/historico` (push) | histórico de alteração de datas do orçamento não grava (o registro principal já tem catch com alerta — aqui só o histórico se perde) | M | `_logFalhaGrav` |
| 29 | 8290 | `orcApagar` | `auaulandia/orcamentos/{id}` (remove) | orçamento apagado na tela pode continuar existindo no banco | M | `_logFalhaGrav` + confirmar sucesso antes de sumir da lista |
| 30 | 8379 | `orcTirarDaPlanilha` | `auaulandia/orcamentos/{id}` (cancelado_planilha_ok) | status de liberação da planilha ao cancelar reserva não grava | M | `_logFalhaGrav` |
| 31 | 8389 | `orcTirarDaPlanilha` | `auaulandia/orcamentos/{id}` (cancelado_planilha_ok:false) | idem, ramo de erro | M | `_logFalhaGrav` |
| 32 | 8403 | `orcStatus` | `auaulandia/orcamentos/{id}` (status) | mudança de status do orçamento (ex.: fechado) não persiste | M | `_logFalhaGrav` |
| 33 | 8472 | `orcEnviarPlanilha` | `auaulandia/orcamentos/{id}` (planilha_ok) | status "lançado na planilha" não grava (o envio real já foi feito via fetch e o resultado já é mostrado em `zAlertao`) | B | `_logFalhaGrav` |
| 34 | 8480 | `orcEnviarPlanilha` | `auaulandia/orcamentos/{id}` (planilha_ok:false) | idem, ramo de erro | B | `_logFalhaGrav` |
| 35 | 8573 | `orcAddFeriado` | `auaulandia/config/orcamento/feriados` | feriado novo não grava no banco (só na memória local) | M | `_logFalhaGrav` |
| 36 | 8578 | `orcDelFeriado` | `auaulandia/config/orcamento/feriados` | remoção de feriado não grava | M | `_logFalhaGrav` |
| 37 | 8814 | `plantAprender` | `auaulandia/config/plantonistas` | apelido↔nome oficial da plantonista não grava | M | `_logFalhaGrav` |
| 38 | 9533 | `dispensarAvisoBarrado` | `auaulandia/avisos-barrados-dispensados/{aparelho}` | dispensa de aviso de aparelho barrado não grava — aviso pode voltar a aparecer | B | `_logFalhaGrav` |
| 39 | 9807 | `doLogin` | `daycare/auditoria/{dia}` (push, acao: login-barrado) | **tentativa de login barrada não fica auditada** — a Gestão não vê quem tentou entrar e não conseguiu (é o próprio caso Letícya/Octávio que motivou a funcionalidade) | **A** | `_logFalhaGrav` |
| 40 | 10300 | `criarPeludinhoENovoHospedeForcado` | `daycare/cadastro/{key}` (update) | cadastro-rascunho criado na hora do hóspede forçado não persiste no banco | M | `_logFalhaGrav` |
| 41 | 10507 | `removerHospedeCard` | `auaulandia/removidos/{dia}/{key}` (backup antes de remover) | backup do lançamento removido não grava — se for engano, não dá pra "trazer de volta" pelo botão dedicado | M | `_logFalhaGrav` + bloquear a remoção seguinte se o backup falhar |
| 42 | 10821 | `setAlmCad` | `daycare/almoco-cad/{k}` (update) | correção no cadastro de almoço (pode incluir restrição/comedouro lento) não grava | M | `_logFalhaGrav` |
| 43 | 11428 | `fecharDespertador` | `daycare/banho-aviso/{dia}/{k}` | "já desci com ele para o banho" não grava — alarme pode voltar a tocar em outro aparelho | M | `_logFalhaGrav` |
| 44 | 11874 | `vetSalvarMed` | `auaulandia/medicacao-agenda/{key}` (nome/tutor no cabeçalho, após já ter salvo o item) | cabeçalho da agenda de medicação fica com nome/tutor desatualizado — risco de confundir de quem é o remédio | **A** | `_logFalhaGrav` |
| 45 | 12336 | `setPelExtra` | `daycare/cadastro/{k}` (update, ficha genérica) | qualquer campo da ficha do FILHOt salvo por aqui (pode incluir alergia/restrição) não persiste | **A** | `_logFalhaGrav` — este é o setter genérico usado por muitas telas; merece prioridade |
| 46 | 12494 | `renomearCadastroPel` | `salvarFotoCad(kB,_fotoMove)` — **sem `.catch` nenhum**, dentro de `try{}catch{}` síncrono | ao renomear um FILHOt, a foto pode não ser movida para a nova chave e simplesmente desaparecer — sem nenhum rastro, nem no console | **A** (pior que muda: sem tratamento algum) | encadear `.catch(e=>_logFalhaGrav('foto-renomear',e))` na chamada |
| 47 | 12494 | `renomearCadastroPel` | `daycare/fotos/{kA}` (remove, foto antiga) | foto antiga não é removida — fica órfã no banco | B | `_logFalhaGrav` |
| 48 | 12506 | `renomearCadastroPel` | `daycare/almoco-cad/{kB}` (update) | cadastro de almoço não é movido ao renomear — repete o bug da Heidi (ficha "sem almoço cadastrado") | **A** | `_logFalhaGrav` |
| 49 | 12550 | `salvarSens` | `daycare/config/sensiveis` | lista de FILHOts sensíveis não grava (fica só no aparelho) | B | `_logFalhaGrav` |
| 50 | 13868 | `criarAluno` | `daycare/cadastro/{key}` (update) | cadastro de auluno novo não persiste no banco (fica só na memória local) | M | `_logFalhaGrav` |
| 51 | 14130 | `marcarPresenca` | `daycare/chamada/{dia}/{k}` | marcação manual de presença/falta na chamada não grava | **A** | `_logFalhaGrav` |
| 52 | 14252 | `salvarAtiv` | `daycare/config/atividades` | lista de atividades do Day Care não grava | B | `_logFalhaGrav` |
| 53 | 14411 | `toggleAlmPrep` | `daycare/almoco-prep/{dia}/{i}` | item do checklist de preparo do almoço não grava | B | `_logFalhaGrav` |
| 54 | 14418 | `confirmarExec` | `daycare/almoco-exec/{dia}` | confirmação de leitura das regras de execução do almoço não grava | B | `_logFalhaGrav` |
| 55 | 14425 | `toggleAlmFinal` | `daycare/almoco-final/{dia}/{i}` | item do checklist de finalização do almoço não grava | B | `_logFalhaGrav` |
| 56 | 14429 | `toggleBanho` | `daycare/banho/{dia}/{k}` | marcação de banho do dia não grava | M | `_logFalhaGrav` |
| 57 | 15232 | `vetFilaGuardar` | `auaulandia/avisos-vet-fila` (push) | aviso de intercorrência veterinária não entra na fila de reenvio — some de vez se o Telegram também falhar | **A** | `_logFalhaGrav` |
| 58 | 15336 | `ckSalvar` | `daycare/chamada/{dia}/{k}` (set 'veio', marca presença pelo check-in) | presença automática pelo check-in de entrada não grava — FILHOt pode aparecer como falta | **A** | `_logFalhaGrav` |
| 59 | 15340 | `ckSalvar` | `daycare/checkin-hist/{k}` (push) | histórico de alterações do check-in do FILHOt não grava | M | `_logFalhaGrav` |
| 60 | 15348 | `ckSalvar` | `daycare/ocorrencias/{dia}` (push, quando há alteração ou diarreia) | **alerta de ocorrência para a Coordenação não é criado** — ninguém sabe que algo mudou no corpo do FILHOt ou que houve diarreia | **A** | `_logFalhaGrav` + aviso na tela de quem fez o check-in |
| 61 | 15360 | `ckCarregarEntradaDoDia` | (grava um registro auxiliar do check-in do dia) | dado auxiliar de apoio ao check-in não grava | M | `_logFalhaGrav` |
| 62 | 15870 | `ptPendenciaComidaHTML` | `daycare/chamados-recepcao/{dia}/{k}` (status: visto) | marcar "visto" num chamado da recepção não grava — chamado pode continuar aparecendo como pendente | M | `_logFalhaGrav` |
| 63 | 15962 | `marcarGenerico` | `daycare/atividade/{dia}/{atividade}/{k}` | marcação de "feito" em qualquer atividade genérica do Day Care não grava | M | `_logFalhaGrav` |
| 64 | 15969 | `marcarGenerico` | `daycare/atividade/{dia}/almoco2/{k}` | marcação do 2º horário de almoço não grava | M | `_logFalhaGrav` |
| 65 | 16027 | `avisarGrupoComida` | `daycare/avisos-telegram-comida/{dia}/{k}` | status do aviso ao grupo sobre quem não comeu não grava (o aviso real já foi tentado via Telegram) | B | `_logFalhaGrav` |
| 66 | 16040 | `_comidaFalhou` | `daycare/avisos-telegram-comida/{dia}/{k}` (ramo de falha) | nem o registro de falha do aviso de comida é salvo | B | `_logFalhaGrav` |
| 67 | 16208 | `eaCongelar` | `{eaNo()}/registro` (Enriquecimento Ambiental) | fechamento do registro diário do EA (quem participou/quem foi impedido) não grava | M | `_logFalhaGrav` |
| 68 | 16231 | `eaToggleItem` | `{eaNo()}/oque` | o que foi feito no EA hoje não grava | B | `_logFalhaGrav` |
| 69 | 16237 | `eaToggleTipo` | `{eaNo()}/tipos/{k}` | tipo de EA marcado não grava | B | `_logFalhaGrav` |
| 70 | 16249 | `eaMarcarTempo` | `{eaNo()}/tempos/{k}` | tempo do EA não grava | B | `_logFalhaGrav` |
| 71 | 16261 | `eaMarcarTempo` | `daycare/tempo-atividade/{dia}/ea` | métrica de tempo por atividade não grava | B | `_logFalhaGrav` |
| 72 | 16593 | `anivEnviarTelegram` | `daycare/aniversario-enviado/{dia}` | status de envio da lista de aniversariantes não grava (mensagem já foi tentada) | B | `_logFalhaGrav` |
| 73 | 16990 | `resumoDiaEnviar` | `daycare/resumo-gestao/{dia}` (ramo: ponte não conhece o grupo) | nem o registro de que o resumo diário FALHOU é salvo | B | `_logFalhaGrav` |
| 74 | 16999 | `resumoDiaEnviar` | `daycare/resumo-gestao/{dia}` | status do envio do resumo diário à Gestão não grava | B | `_logFalhaGrav` |
| 75 | 17110 | `toggleCheckoutPlantao` | `auaulandia/checkout/{dia}/{i}` | item do checklist de checkout do plantão não grava | M | `_logFalhaGrav` |
| 76 | 17113 | `salvarCheckoutPlantao` | `auaulandia/checkout/{dia}/_salvo` | confirmação de checklist de checkout do plantão salvo não grava | M | `_logFalhaGrav` |
| 77 | 17138 | `renderCheckoutPlantao`(*) | `daycare/abertura-m1/{dia}/{i}` | item do checklist de abertura da manhã não grava | M | `_logFalhaGrav` |
| 78 | 17271 | `turnoTrocar` | `{caminho}/historico` (push) | histórico de troca de turno não grava | B | `_logFalhaGrav` |
| 79 | 17275 | `turnoTrocar` | `{caminho}` (update) | a própria troca de turno pode não persistir | M | `_logFalhaGrav` |
| 80 | 17328 | `ativIniciarAgora` | `{ativTempoNo(slug)}` (caes) | contagem de FILHOts numa atividade cronometrada não grava | B | `_logFalhaGrav` |
| 81 | 17555 | `marcarAlmoco` | `daycare/almoco/{dia}/{k}` | marcação "comeu tudo/metade/nada" do almoço não grava | M | `_logFalhaGrav` |
| 82 | 17780 | `dashApagarPonte` | `daycare/config/ponte-planilha` (limpa) | desligar a ponte com a planilha da TV pode não persistir | B | `_logFalhaGrav` |
| 83 | 17891 | `dashEspelhar` | `{dashNo()}/.../planilha_ok` | status de espelhamento no dashboard da TV não grava | B | `_logFalhaGrav` |
| 84 | 17892 | `dashEspelhar` | `{dashNo()}/.../planilha_msg` | idem, mensagem de erro | B | `_logFalhaGrav` |
| 85 | 18293 | `audit` (helper) | `daycare/auditoria/{dia}` (push) | **o próprio registro de auditoria pode falhar sem rastro** — qualquer evento (inclusive segurança) fica sem histórico e ninguém percebe, porque é o helper universal | **A** | `_logFalhaGrav` teria efeito circular aqui — melhor: fila local (localStorage) + reenvio, já que é a última linha de defesa |
| 86 | 18307 | `salvarAuditCfg` | `daycare/config/auditoria` | configuração de quais eventos auditar não grava | B | `_logFalhaGrav` |
| 87 | 18973 | `ciSalvarCadastroFalta` | `auaulandia/cadastro/{kAua}` (espelho do cadastro completado no check-in) | cadastro completado no check-in não espelha para a AuAulândia — pode divergir do Day Care | M | `_logFalhaGrav` |
| 88 | 19151 | `ciCriarNovoHospede` | `daycare/cadastro/{key}` (update) | cadastro-rascunho criado durante o check-in de um hóspede novo não persiste | M | `_logFalhaGrav` |
| 89 | 19514 | `ciRenomearPertBanco` | `auaulandia/pertences-banco/{k}` (update nome) | renomear um item do banco de pertences não grava | M | `_logFalhaGrav` |
| 90 | 19527 | `ciExcluirPertBanco` | `auaulandia/pertences-banco/{k}` (remove) | exclusão de item do banco de pertences não grava | M | `_logFalhaGrav` |
| 91 | 19541 | `ciAddPertItem` | `auaulandia/pertences-banco/{k}` (set) | item novo do banco de pertences não grava | M | `_logFalhaGrav` |
| 92 | 20959 | `hospAbrirFicha` | `daycare/cadastro/{key}` (update, cadastro-stub ao abrir ficha) | ficha criada na hora para um hóspede sem cadastro-mestre não persiste | M | `_logFalhaGrav` |
| 93 | 20960 | `hospAbrirFicha` | `auaulandia/estadias/{id}` (refKey) | vínculo da estadia com o cadastro-mestre novo não grava | M | `_logFalhaGrav` |
| 94 | 21294 | `cfToggleItem` | `auaulandia/estadias/{id}/conferencia/{campo}/{k}` | etiqueta de item conferido (pertence/medicação) na Conferência não grava | **A** | `_logFalhaGrav` |
| 95 | 21461 | `cfCriarAvisoRacao` | `auaulandia/avisos-racao` (push) | aviso automático de falta de ração/remédio na Conferência não é criado | **A** | `_logFalhaGrav` |
| 96 | 21463 | `cfCriarAvisoRacao` | (fechamento do fluxo acima) | idem — nem o "já existe aviso aberto" é confiável se a leitura falhar | M | `_logFalhaGrav` |
| 97 | 21471 | `avisoTrocarTipo` | `auaulandia/avisos-racao/{id}` (update tipo) | correção do tipo de um aviso (ex.: era ração, é remédio) não grava | M | `_logFalhaGrav` |
| 98 | 21549 | `cfConfirmarAlarme` | `auaulandia/estadias/{id}/conferencia/medicacao/{k}` | **confirmação de que o alarme do remédio foi testado e ouvido** não grava — a Conferência pode fechar sem essa prova | **A** | `_logFalhaGrav` |
| 99 | 21580 | `cfRemoverOcorrencia` | `auaulandia/estadias/{id}/ocorrencias/{id}` (remove) | remoção de ocorrência na Conferência pode não persistir | M | `_logFalhaGrav` |
| 100 | 21618 | `cfSalvarFotos` | `auaulandia/estadias/{id}/conferencia/fotos` | fotos da conferência não gravam | M | `_logFalhaGrav` |
| 101 | 21939 | `empDesfazer` | `daycare/avisos-comida/{dia}/{k}` (desfazer aviso ao tutor) | desfazer um aviso de "não comeu" ao tutor não grava | M | `_logFalhaGrav` |
| 102 | 22259 | `coFinalizar` | `daycare/pontos-checkout/{mes}` (push, gamificação) | pontos de gamificação de quem montou a bolsa do checkout não gravam | B | `_logFalhaGrav` |

\* Linhas do estado do arquivo no momento da auditoria (25/ago/2026, ~22h). Como outro agente edita o arquivo ao vivo, use a coluna **Função** para localizar cada ocorrência com `grep -n "nome_da_funcao" index.html`.

---

## 3. Agrupamento por função — onde um único helper corrige várias ocorrências

| Padrão repetido | Ocorrências | Correção de uma vez |
|---|---|---|
| **Toggle de checklist do dia** (`toggleAlmPrep`, `toggleAlmFinal`, `toggleBanho`, `toggleCheckoutPlantao`, `toggleAberturaM1`, `marcarGenerico`, `eaToggleItem`, `eaToggleTipo`, `eaMarcarTempo`, `marcarAlmoco`, `marcarPresenca`) | ~14 ocorrências (itens #52–56, 63–64, 67–71, 81) | Um único helper `_gravarToggle(ref, valor, contexto)` que chama `_logFalhaGrav` — todos os toggles do dia (Day Care e AuAulândia) usam a mesma forma `if(DB) DB.ref(...).set(x).catch(()=>{})` |
| **Status de aviso de estoque** (`avisoAddEntrada`, `avisoResolver`, `avisoReabrir`, `avisoRacaoAddEntrada`, `avisoRacaoResolver`, `avisoRacaoReabrir`) | 6 ocorrências (#13–16, 19–21) | Um helper `_gravarStatusAviso(nó, id, patch)` compartilhado entre avisos de estoque e de ração — hoje são 2 famílias de função quase idênticas duplicadas |
| **Status de envio ao Telegram/planilha após o disparo real** (`plantaoAvisoGestao`, `plantFalhou`, `plantChecarFechamento`, `resumoDiaEnviar`, `anivEnviarTelegram`, `avisarGrupoComida`, `_comidaFalhou`, `orcEnviarPlanilha`, `dashEspelhar`) | ~14 ocorrências (#24–27, 33–34, 65–66, 72–74, 83–84) | Um helper `_gravarStatusEnvio(ref, ok, erro)` — o envio em si já tem tratamento (fetch/Telegram), só falta o `_logFalhaGrav` na gravação do status |
| **Cadastro-mestre / espelho de cadastro** (`setPelExtra`, `criarPeludinhoENovoHospedeForcado`, `criarAluno`, `ciCriarNovoHospede`, `ciSalvarCadastroFalta`, `hospAbrirFicha` ×2, `renomearCadastroPel` ×3) | ~11 ocorrências (#40, 45, 48, 50, 87, 88, 92, 93, 46, 47) | `setPelExtra` é o setter genérico mais usado — corrigi-lo primeiro dá cobertura ampla; as demais são pontos que chamam `DB.ref(...).update()` direto, sem passar por ele — vale migrar todos para um único `_gravarCadastro(ref, patch)` |
| **Medicação (remoção, estoque, dose, alarme)** (`magRemoverItem`, `descontarEstoquePorDose`, `criarAvisoEstoque`, `tocarEstoqueAcabando`, `registrarDoseAgendadaGlobal`, `vetSalvarMed`, `cfConfirmarAlarme`) | 7 ocorrências (#9–12, 22, 44, 98) | Já existe o padrão certo em `registrarDoseAgendada` (dose individual) — replicar o mesmo `_logFalhaGrav` nessas 7 funções fecha a família inteira de medicação |
| **Pertences (banco de itens)** (`ciRenomearPertBanco`, `ciExcluirPertBanco`, `ciAddPertItem`) | 3 ocorrências (#89–91) | Um `_gravarPertBanco(ref, patch)` comum |
| **`_vMed` e `ckSalvar`** (divergência de medicação e ocorrência da Coordenação) | 3 ocorrências (#23, 59, 60) — todas dentro do mesmo fluxo de check-in/check-out do Day Care | Aplicar `_logFalhaGrav` direto nas 3 chamadas — é o fluxo de maior risco do arquivo |

---

## 4. Ordem recomendada de correção (lotes de até 10, começando pelas Altas)

**Lote 1 — Alta, medicação e presença (10 ocorrências: #9, #10, #11, #12, #22, #23, #44, #57, #58, #60)**
Prova no harness: para cada função (`magRemoverItem`, `descontarEstoquePorDose`, `criarAvisoEstoque`, `tocarEstoqueAcabando`, `registrarDoseAgendadaGlobal`, `_vMed`, `vetSalvarMed`, `vetFilaGuardar`, `ckSalvar` ×2), no estilo dos checks já existentes em `tests/harness.js`: **"função X NÃO tem `.catch` vazio"** (grep na função) e **"função X audita a falha"** (chama `_logFalhaGrav` ou equivalente dentro do `.catch`).

**Lote 2 — Alta, restante + auditoria (9 ocorrências: #39, #45, #46, #48, #51, #94, #95, #98, #85)**
Mesmo par de checks. O item #85 (`audit()`) é especial — não pode chamar `_logFalhaGrav` (seria recursivo); provar em vez disso que a falha de `audit()` cai numa fila local (`localStorage`) que é reenviada na próxima chamada de `audit()` bem-sucedida.

**Lote 3 — Média, fluxo de check-in/estadia (10 ocorrências: #40, #41, #42, #59, #61, #87, #88, #92, #93, #100)**
Checks: `.catch` não vazio + audita falha OU mostra mensagem na tela (`setSt`/`alert`) — este grupo já tem exemplos de UI de erro no próprio arquivo (`ciSalvarRestricao`) para copiar o padrão.

**Lote 4 — Média, avisos e estoque (10 ocorrências: #13–21, #96)**
Migrar as 2 famílias duplicadas (estoque de remédio × ração) para o helper único `_gravarStatusAviso` e provar as 2 famílias de uma vez com o mesmo teste parametrizado.

**Lote 5 — Média, restante de cadastro/pertences/config (10 ocorrências: #1, #2, #3, #6, #35, #36, #37, #67, #75, #76)**

**Lote 6 — Média, restante (10 ocorrências: #62, #77, #79, #89, #90, #91, #97, #99, #101, #28)**

**Lote 7 — Baixa, tudo o que sobrar (todas as ~26 restantes: contadores, cache, preferências visuais, gamificação, status de envio já tentado)**
Aqui o teste pode ser mais simples: só exigir `_logFalhaGrav`, sem exigir aviso na tela — são gravações onde a UI já reflete o estado local corretamente e o pior caso é o dado ficar desatualizado no banco até a próxima sincronização.

---

## 5. Fora do escopo estrito (leituras/fetches com `.catch` vazio — não são gravações)

Encontrados no mesmo padrão, mas em **leitura** (`.once('value')`) ou em `fetch()` externo (planilha), não em gravação: `carregarCadastro` (5385), `carregarOcorrenciasDayCare` (6209), `carregarPainelGestora` (7480), `carregarRiscoNaoComer` (7502), `orcLiberarNaPlanilha` (8222, fetch), `renderLoginsBarrados` (9569, 9570), `carregarAgendaMedTodos` (11481, 11483, 11502), `carregarChamada` (14138, 14139, 14140, 14142 — fetch), `decideStep` (17223, fetch), `dashCarregar` (17719), `ciPreencherMedicacao` (19449), `ciChecarHospedado` (19611). Nenhuma perde dado gravado — na pior hipótese, a tela não atualiza e a pessoa vê informação desatualizada até recarregar. Vale corrigir depois dos 7 lotes acima, com prioridade menor.

Também vale registrar: a linha 17201 é um **comentário** que cita literalmente `.catch(()=>{})` ao explicar o próprio problema (já resolvido ali por perto) — não é uma ocorrência real, foi excluída da contagem.
