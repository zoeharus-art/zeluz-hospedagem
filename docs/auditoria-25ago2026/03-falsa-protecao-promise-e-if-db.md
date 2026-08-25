# Falsa proteção — Promise dentro de try/catch e if(DB) sem else

> Auditoria somente leitura de `auaulandia/index.html` (arquivo em edição simultânea por outro agente —
> linhas citadas são aproximadas, conferir contra o código atual antes de aplicar qualquer correção).
> Base: achado da auditoria de 22/ago/2026 sobre `salvarFotoCad` e sobre o "achado nº 5" (`if(DB)` sem
> tratar o banco reconectando).

## Resumo em 5 linhas

`try{}catch(e){}` não pega erro de Promise que não foi `await`ada nem tem `.catch` — o `catch` só serve
para erro síncrono, e as duas chamadas a `salvarFotoCad` fora do padrão (em `setPelExtra` e em
`renomearCadastroPel`) deixam a foto do FILHOt sem sincronizar entre aparelhos em silêncio total, uma
delas ainda mostrando "✓ Salvo" mesmo se a gravação falhar. Três outros `try/catch` do mesmo formato
(`ativCarregarTempo`, `anivAuto`, `resumoDiaAuto`) são inofensivos porque a função chamada já tem
`.catch()` interno — o `try/catch` externo é código morto, não perda real. No padrão `if(DB){...}` sem
`else`, o problema é distinto e mais espalhado: quando o banco está reconectando, o bloco inteiro é
pulado sem aviso nenhum — o caso mais grave é o `ckSalvar` (check-in/check-out do corpo), que ZERA o
rascunho e fecha a tela como se tivesse salvo, mesmo sem gravar nada. `onCad`/`onCadNome`/`onBrinq`/
`setHospAlergia` já ganharam `_logFalhaGrav` para falha de gravação real, mas nenhum dos quatro ganhou
o `else` para o caso de banco ainda reconectando — ou seja, a correção de 22/ago cobriu metade do
problema.

---

## Tabela A — `try/catch` que não pega Promise

| # | Linha aprox. | Função | Chamada assíncrona dentro do try | O que se perde se falhar | Gravidade | Correção |
|---|---|---|---|---|---|---|
| A1 | ~12336 (bloco em ~12325-12332) | `setPelExtra` | `try{ salvarFotoCad(k, patch.foto); }catch(e){}` | A foto do FILHOt não sobe para `daycare/fotos/{k}` — nenhum outro aparelho recebe. Pior: se o patch só tinha `foto`, a função já mostra `"✓ Salvo"` na sequência, ANTES de saber se a gravação deu certo — a tela mente. | **Alta** | Retornar/encadear a Promise: `return salvarFotoCad(k, patch.foto).then(()=>{ mostra "✓ Salvo" }).catch(e=>{ _logFalhaGrav('foto/'+k,e); mostra aviso de falha });` — só declarar sucesso depois que a gravação resolveu. |
| A2 | ~12494 (dentro de `renomearCadastroPel`) | `renomearCadastroPel` | `try{ salvarFotoCad(kB,_fotoMove); delete FOTOS[kA]; if(DB) DB.ref('daycare/fotos/'+kA).remove().catch(function(){}); }catch(e){}` | Ao renomear um FILHOt (exatamente o cenário que gerou os "4 Stopas"), a foto é apagada da chave antiga **localmente e de imediato**, mas a gravação na chave nova pode falhar em silêncio — o FILHOt fica sem foto em todos os outros aparelhos, sem nenhum rastro do que aconteceu. | **Alta** | Encadear: `const _pFoto=salvarFotoCad(kB,_fotoMove).catch(e=>_logFalhaGrav('foto-renomeio/'+kB,e));` e só apagar a chave antiga (`delete FOTOS[kA]` + `remove()`) depois que `_pFoto` resolver — ou aceitar o risco documentando por que a ordem é essa. |
| A3 | ~13987, ~14282, ~14289 (3 call sites) | `abrirAtividade`, listener de `visibilitychange`, boot do app | `try{ if(typeof ativCarregarTempo==='function') ativCarregarTempo(); }catch(e){}` | Nada — `ativCarregarTempo()` (def. ~17296) já termina em `.catch(function(){ try{ renderBarraAtiv(); }catch(e){} })`, isto é, a própria função nunca rejeita. O `try/catch` externo é morto: não existe erro assíncrono para ele pegar. | **Baixa** | Não é urgente corrigir dado real, mas por consistência: trocar `try{ ativCarregarTempo(); }catch(e){}` por só `ativCarregarTempo();` (a função já se protege), ou documentar com comentário que o `try/catch` ali é vestigial. |
| A4 | ~16602 | `anivAuto` | `try{ if(new Date().getHours()>=7) anivEnviarTelegram(false); }catch(e){}` | Nada de novo perdido — `anivEnviarTelegram` (def. ~16565) sempre resolve (nunca rejeita) e já grava o resultado via `audit('aniversariantes', ...)` tanto no sucesso quanto na falha. | **Baixa** | Mesma observação de A3: `try/catch` é código morto. Pode ser removido ou mantido como documentação, sem risco. |
| A5 | ~17016 | `resumoDiaAuto` | `try{ if(new Date().getHours()<18) return; resumoDiaEnviar(false); }catch(e){}` | Nada de novo perdido — `resumoDiaEnviar` (def. ~16971) também sempre resolve e audita os dois desfechos internamente. | **Baixa** | Idem A3/A4. |

**Contagem Tabela A: 5 ocorrências — 2 Alta, 3 Baixa.**

---

## Tabela B — `if(DB){...}` sem tratar "banco reconectando"

Padrão de referência já correto no arquivo: `ciSalvarRestricao` (~L19068) faz
`if(DB){ salva; mostra "Salvando…"; .then mostra sucesso; .catch mostra "Anotado NESTE aparelho, mas
NÃO salvou..." + audit('checkin-FALHA',...); } else { mostra "Banco está reconectando — salve de novo
em instantes." + audit('checkin-PENDENTE',...); }` — trata os DOIS jeitos de falhar (banco ausente no
clique **e** gravação que rejeita depois). `salvarMonitores` (~L9751) e `_vMed`/checklist médico
(~L7079) também já têm `else` com aviso. Todos os itens abaixo NÃO têm isso.

### Grupo 1 — Gravidade Alta (dado de segurança, cadastro-mestre ou UI que finge sucesso)

| # | Linha aprox. | Função | O que está sendo gravado | Aviso na tela? | Correção |
|---|---|---|---|---|---|
| B1 | ~15333 (bloco `if(DB){...}` sem `else`; def. `ckSalvar` ~15265) | `ckSalvar` | Check-in/check-out do corpo: pontos do exame físico, fotos, `daycare/chamada` (presença), `daycare/checkin-hist`, `daycare/ocorrencias` — **4 gravações**, tudo dentro do mesmo `if(DB)`. | **NÃO.** Sem banco, o bloco inteiro é pulado e a função segue para `audit(...)`, `ckAtual=null; ckRascunho=null; renderCheckin();` — a tela fecha o rascunho e volta como se tivesse salvo tudo. | Envolver: `if(DB){ ...4 gravações... } else { zAlertao('⚠ SEM CONEXÃO — NADA FOI SALVO', [...]); return; }` — sem `return`, NUNCA limpar `ckAtual`/`ckRascunho` nem fechar a tela quando não há banco. Prioridade máxima do lote. |
| B2 | ~12336 (def. `setPelExtra` ~12323) | `setPelExtra` | `daycare/cadastro/{k}` — grava qualquer campo extra da ficha (atividades, tutor, raça, restrição, etc. — é a função-base usada por várias telas). | Não — segue reta para `s.textContent='✓ Salvo'` de qualquer forma. | `if(DB){ ...update... } else { mostra "Banco reconectando — salve de novo em instantes."; _logFalhaGrav('ficha/'+k,'sem DB'); }` — como é usada por muitos chamadores, propagar o retorno (Promise) para quem chama poder mostrar o próprio aviso. |
| B3 | ~18971 (def. `ciSalvarCadastroFalta` ~18958) | `ciSalvarCadastroFalta` | Espelho em `auaulandia/cadastro/{kAua}` do que `setPelExtra` já gravou (ou não) em `daycare/cadastro`. | Não — a função termina com `st2.textContent='✅ N campo(s) salvo(s) no cadastro.'` incondicionalmente, mesmo que B2 E este espelho tenham falhado silenciosamente. | Encadear a Promise de `setPelExtra` + a deste espelho; só mostrar "✅ salvo" depois que ambas resolverem, e mostrar aviso de banco reconectando se `!DB`. |
| B4 | ~21549 (`cfConfirmarAlarme`) | `cfConfirmarAlarme` | `auaulandia/estadias/{id}/conferencia/medicacao/{k}` — confirmação de que a plantonista OUVIU o alarme de remédio. | Não — o checkbox já fica marcado (ação do próprio clique) independente do banco. | `if(DB){ set(...).catch(e=>_logFalhaGrav('alarme-med/'+k,e)); } else { desmarca o checkbox de volta + avisa "Banco reconectando — confirme de novo"; }` — item de segurança, não pode ficar "confirmado" na tela sem estar gravado. |
| B5 | ~21294 (`cfToggleItem`) | `cfToggleItem` | `auaulandia/estadias/{id}/conferencia/{campo}/{k}` — etiqueta conferida de medicação/pertence na saída. | Não. | Mesmo padrão de B4 — é conferência de handoff entre plantões, referenciada em Memory (`feedback-dupla-nao-e-uma-pessoa`) como ponto sensível. |
| B6 | ~10821 (`setAlmCad`) | `setAlmCad` | `daycare/almoco-cad/{k}` — cadastro de restrição/alergia alimentar do almoço. | Não. | `if(DB){...} else { mostra aviso + _logFalhaGrav ou audit('almoco-cad-PENDENTE',...); }` — é dado de segurança alimentar (mesma família do achado de 20/ago sobre alimentação). |
| B7 | ~4824 (`setHospAlergia`) | `setHospAlergia` | `daycare/cadastro/{key}` — campo de alergia/restrição do hóspede. **Já tem** `.catch(e=>_logFalhaGrav(...))` (parte do achado nº 5 já corrigida). | Parcial — se a gravação falhar DEPOIS de disparada, fica registrado em auditoria (mas sem aviso visível na tela). Se `DB` já estava nulo no momento do clique, nada acontece e nem `_logFalhaGrav` roda. | Falta o `else`: `if(DB){...} else { _logFalhaGrav('alergia/'+campo,'sem DB'); mostra aviso na tela }`. |
| B8 | ~5344 (`onCadGravar`) | `onCadGravar` | `auaulandia/cadastro/{_ck}` + `daycare/cadastro/{_ck}` — grava o cadastro-mestre completo do FILHOt. **Já tem** `_logFalhaGrav` no catch. | Mesmo caso de B7 — falta o ramo `!DB`. | Adicionar `else` com aviso + log; é o cadastro mestre, mesma família do achado "cadastro único" (`feedback-cadastro-unico-quem-cadastra`). |
| B9 | ~5357 (`onCadNome`) | `onCadNome` | Igual a B8, mas só o campo nome. **Já tem** `_logFalhaGrav`. | Falta `else`. | Mesma correção de B7/B8. |
| B10 | ~5379 (`onBrinq`) | `onBrinq` | `auaulandia/cadastro/{key}` campo brinquedos. **Já tem** `_logFalhaGrav`. | Falta `else`. | Mesma correção — gravidade um degrau abaixo de B7-B9 (dado não é de segurança), mas mantém no Grupo 1 por já estar na lista do achado nº 5. |
| B11 | ~14130 (`marcarPresenca`) | `marcarPresenca` | `daycare/chamada/{dia}/{k}` — marca quem veio/faltou no dia. Base de "quem está no prédio" citada várias vezes em Memory (`feedback-duas-telas-duas-verdades`, `feedback-lista-curta-mente`). | Não. | `if(DB){...} else { avisa "Presença marcada só NESTE aparelho — banco reconectando"; }` — presença é dado que outros aparelhos (recepção, gestão) precisam ver na hora. |
| B12 | ~13868 (`criarAluno`) | `criarAluno` | `daycare/cadastro/{key}` — criação de novo cadastro pela recepção/gestão. | Não. | Mesmo padrão de B8 — é criação de cadastro-mestre, mesma criticidade do "cadastro único". |
| B13 | ~10300 (`criarPeludinhoENovoHospedeForcado`) | `criarPeludinhoENovoHospedeForcado` | `daycare/cadastro/{key}` — cadastro forçado quando a recepção não achou o FILHOt na busca. | Não. | Mesmo padrão — some com o cadastro sem avisar, e por ser fluxo de "forçar" a pessoa pode não conferir depois. |
| B14 | ~20959 (`hospAbrirFicha`) | `hospAbrirFicha` | `daycare/cadastro/{key}` — cria ficha ao abrir hospedagem sem cadastro prévio. | Não. | Mesmo padrão de B12/B13. |

### Grupo 2 — Gravidade Média (rotina operacional diária, sem risco de segurança imediato)

| # | Linha aprox. | Função | O que está sendo gravado | Aviso na tela? | Correção |
|---|---|---|---|---|---|
| B15 | ~15962 (`marcarGenerico`) | Atividade genérica marcada "feito" | Não | `if(DB){...} else { toast "salvo só neste aparelho — banco reconectando"; }` |
| B16 | ~15969 (`marcarAlmoco2`) | Marcação de 2º prato do almoço | Não | Mesma correção |
| B17 | ~17555 (`marcarAlmoco`) | Grade principal do almoço (comeu tudo/metade/não comeu) | Não | Mesma correção — é a grade citada na "Grade nunca mais aparece vazia" (08/ago); o problema aqui é o oposto (grava local sem replicar) |
| B18 | ~14411 (`toggleAlmPrep`) | Checklist de preparação do almoço | Não | Mesma correção |
| B19 | ~14418 (`confirmarExec`) | Confirmação de leitura das regras de execução do almoço | Não | Mesma correção |
| B20 | ~14425 (`toggleAlmFinal`) | Checklist de finalização do almoço | Não | Mesma correção |
| B21 | ~14429 (`toggleBanho`) | Marca/desmarca banho do dia | Não | Mesma correção |
| B22 | ~16231 (`eaToggleItem`) | Enriquecimento Ambiental — item do dia | Não | Mesma correção (feature mexida em 20-22/ago) |
| B23 | ~16237 (`eaToggleTipo`) | Enriquecimento Ambiental — tipo | Não | Mesma correção |
| B24 | ~16249 (`eaMarcarTempo`) | Enriquecimento Ambiental — tempo marcado | Não | Mesma correção |
| B25 | ~17110 (`toggleCheckoutPlantao`) | Checklist de check-out do plantão | Não | Mesma correção |
| B26 | ~17113 (`salvarCheckoutPlantao`) | Confirma checkout do plantão (`_salvo`) | Não | Mesma correção |
| B27 | ~17138 (`toggleAberturaM1`) | Checklist de abertura M1 | Não | Mesma correção |
| B28 | ~17271 e ~17275 (`turnoTrocar`) | Helper genérico de troca de turno — grava histórico + patch em vários lugares que o chamam | Não | Como é helper reaproveitado, encadear a Promise devolvida e deixar cada chamador decidir o aviso — ou padronizar um aviso genérico dentro do próprio helper |
| B29 | ~11428 (`fecharDespertador`) | Marca "desceu para o banho" | Não | Mesma correção |
| B30 | ~19514 (`ciRenomearPertBanco`) | Banco de pertences — renomear item | Não | Mesma correção |
| B31 | ~19527 (`ciExcluirPertBanco`) | Banco de pertences — excluir item | Não | Mesma correção |
| B32 | ~19541 (`ciAddPertItem`) | Banco de pertences — adicionar item | Não | Mesma correção |
| B33 | ~4925 (`marcarCafe`) | Café da manhã do hóspede | Não | Mesma correção |
| B34 | ~4932 (`iniciarCafe`) | Contagem do turno do café | Não | Mesma correção |
| B35 | ~16037 (`_comidaFalhou`) | Registra que o aviso de comida NÃO saiu (já é um log de falha) | Não (mas o próprio nome da função já é sobre lidar com falha) | Baixa prioridade dentro do Grupo 2 — like tudo mais aqui, mas o dado em si é secundário (log de log) |

### Grupo 3 — Gravidade Baixa (configuração administrativa, muda pouco, Gestão nota se sumir)

| # | Linha aprox. | Função | O que está sendo gravado | Aviso na tela? | Correção |
|---|---|---|---|---|---|
| B36 | ~12550 (`salvarSens`) | Config de sensíveis do Day Care | Não | `else` simples com toast, baixa urgência |
| B37 | ~14252 (`salvarAtiv`) | Config de atividades | Não | Mesma correção |
| B38 | ~18307 (`salvarAuditCfg`) | Config do painel de auditoria | Não | Mesma correção |
| B39 | ~17328 (`ativIniciarAgora`) | Só atualiza a contagem de FILHOts (campo `caes`) numa atividade já iniciada por outra via protegida | Não | Baixa prioridade — dado é redundante/derivável |

**Contagem Tabela B: 39 ocorrências — 14 Alta (Grupo 1), 21 Média (Grupo 2), 4 Baixa (Grupo 3).**

Fora da tabela, já corretos e servem de modelo: `ciSalvarRestricao` (~L19068), `salvarMonitores`
(~L9751), `_vMed`/checklist médico (~L7079), `orcInit` (~L8580), `escolherHospede` (~L10349, ainda que
sem persistir o fallback local — fora do escopo desta auditoria), `escolherAvulso` (~L14194, mesma
ressalva), `carregarChamada` (~L14136), `decideStep`/`carregarAlmoco` (~L17206) e `ativIniciar`
(~L17314, cai no `ativIniciarAgora` de qualquer jeito).

---

## Ordem de correção (lotes de até 8)

Cada lote deve terminar com uma prova no harness no estilo dos checks existentes
(`"função X trata banco reconectando (else do if(DB))"`), rodando os 22/22 já existentes mais o novo
check antes de avançar para o próximo lote.

**Lote 1 — o mais crítico, tela mente que salvou (Tabela A + B1-B3):**
1. A1 — `setPelExtra` encadeia `salvarFotoCad`
2. A2 — `renomearCadastroPel` encadeia `salvarFotoCad` antes de apagar a chave antiga
3. B1 — `ckSalvar` — `else` que bloqueia o fechamento da tela sem banco
4. B2 — `setPelExtra` — `else` com aviso (mesma função de A1, mas o outro ramo)
5. B3 — `ciSalvarCadastroFalta` — não mostrar "✅ salvo" sem confirmar as duas gravações
6. Prova: `setPelExtra trata banco reconectando (else do if(DB))`
7. Prova: `ckSalvar não fecha o rascunho sem banco`
8. Prova: `renomearCadastroPel não perde referência de foto antiga antes de confirmar a nova`

**Lote 2 — segurança/medicação/alimentação (B4-B7, B11):**
1. B4 — `cfConfirmarAlarme`
2. B5 — `cfToggleItem`
3. B6 — `setAlmCad`
4. B7 — `setHospAlergia` (fechar o achado nº 5 nesta função)
5. B11 — `marcarPresenca`
6. Prova: `cfConfirmarAlarme não marca confirmado sem banco`
7. Prova: `setHospAlergia trata banco reconectando (else do if(DB))`
8. Prova: `marcarPresenca avisa quando salva só localmente`

**Lote 3 — cadastro-mestre (B8-B10, B12-B14) — fecha o achado nº 5 nas 4 funções citadas:**
1. B8 — `onCadGravar`
2. B9 — `onCadNome`
3. B10 — `onBrinq`
4. B12 — `criarAluno`
5. B13 — `criarPeludinhoENovoHospedeForcado`
6. B14 — `hospAbrirFicha`
7. Prova: `onCadGravar/onCadNome/onBrinq tratam banco reconectando (else do if(DB))`
8. Prova: `criarAluno e criarPeludinhoENovoHospedeForcado avisam quando não gravam`

**Lote 4 — checklist de almoço e banho (B15-B21):**
1-7. B15 a B21
8. Prova: `checklist de almoço/banho avisa quando salva só localmente`

**Lote 5 — Enriquecimento Ambiental e plantão (B22-B29):**
1-8. B22 a B29
Prova: `EA e checklist de plantão avisam quando salvam só localmente`

**Lote 6 — banco de pertences, café, resíduos de log (B30-B35) + A3-A5 (limpeza opcional):**
1-6. B30 a B35
7. A3/A4/A5 — remover ou comentar os `try/catch` mortos em `ativCarregarTempo`/`anivAuto`/`resumoDiaAuto`
8. Prova: `pertences/café avisam quando salvam só localmente`

**Lote 7 — configuração administrativa (B36-B39), baixa urgência, pode esperar:**
1-4. B36 a B39
5. Prova final: `todo if(DB){...} do arquivo tem else ou justificativa documentada de por que não precisa`
