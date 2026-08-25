# Auditoria — confirm(), prompt() e alert() nativos no caminho de salvar

**Escopo:** `packages` não se aplica — arquivo auditado: `C:\Users\zeluz\projetos-aios\zeluz-hospedagem\auaulandia\index.html` (script único, ~22 mil linhas). Auditoria só de leitura — nenhuma linha do app foi alterada. O `index.html` estava sendo editado por outro agente durante esta leitura; as linhas citadas são **aproximadas** (podem ter deslocado algumas linhas desde a leitura).

## 1. Resumo

- **Total de ocorrências de `confirm`/`prompt`/`alert` no arquivo: 282** — sendo **273 chamadas reais** (54 `confirm`, 30 `prompt`, 189 `alert`) e **9 aparições dentro de comentário** (texto histórico sobre o próprio bug, não código executável — ver seção 5).
- **Estão no caminho de uma gravação (a resposta decide se grava): 80** — os 53 `confirm()` reais que guardam um `if(!confirm(...)) return;` antes de um `DB.ref(...).set/update/push/remove`, mais 27 `prompt()` reais cujo texto digitado é campo obrigatório para a gravação (motivo, senha, nome, data) — 3 `prompt()` ficam de fora por serem só apoio de relatório/clipboard (não gravam nada). Todos os 189 `alert()` ficam **fora** do caminho de gravar em si (não têm valor de retorno usado em `if`), mas continuam sendo risco de "silêncio" — a pessoa não vê o aviso e segue sem saber o que houve.
- **São só aviso (não decidem nada, é o `alert()` puro): 189** — 55 são erro pós-gravação dentro de `.catch()` (o `DB.ref` já tentou escrever, o alerta só reporta se deu certo ou não), o resto se reparte entre bloqueio de permissão, validação de campo obrigatório, aviso de duplicidade e confirmação de sucesso.
- **Pares de `confirm()` duplo (dois seguidos) — o pior padrão:** 3 pares GENUÍNOS ainda vivos no código hoje, todos em `cancelarPernoiteFicha` (2 pares) e `removerHospedeCard` (1 par condicional) — ver seção 4. Mais 2 casos JÁ documentados como corrigidos em comentário no próprio código (`_vMed`/plantão — o bug real do commit `260c544` — e `registrarDoseAgendada`/medicação).
- **Por gravidade** (entre as 273 chamadas reais): Alta = 148 · Média = 92 · Baixa = 33. Entre as que **estão no caminho de gravar** (80): Alta = 52 · Média = 25 · Baixa = 3 — ou seja, **a maior parte do risco de gravação (66%) é Alta**: medicação, plantão, check-in/check-out, acerto/dinheiro e presença.

## 2. Inventário completo (273 chamadas reais)

Vocabulário: FILHOt, tutor, Zeloso. "no caminho de gravar" = a resposta do diálogo decide se a gravação no Firebase acontece (`confirm()`/`prompt()` guardando um `if(!x) return;` ou alimentando o dado salvo). "Sim (indireto)" = não grava nesta função, mas o valor digitado vira a assinatura usada em TUDO que for gravado depois.

| # | linha | função | tipo | texto exibido (resumido) | no caminho de gravar? | o que se perde se travar | gravidade | substituto sugerido |
|---|---|---|---|---|---|---|---|---|
| 1 | 1932 | `(fora de função)` | alert | 'Rascunho: salvaria o registro de adaptação do dia.')">Salvar registro do dia</button></div> | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 2 | 4159 | `repAbrirLancar` | alert | 'Só a recepção, a Gestão ou a Supervisão lançam reposição.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 3 | 4286 | `repUsar` | alert | 'Só a recepção, a Gestão ou a Supervisão marcam o uso da reposição.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 4 | 4288 | `repUsar` | alert | pelNome(p)+' não tem saldo de reposição.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 5 | 4289 | `repUsar` | confirm | 'Marcar que '+pelNome(p)+' veio REPOR hoje? / / Saldo agora: '+s+' / Depois de marcar: '+(s-1))) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "reposição — marcar uso" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques + campo de texto na tela |
| 6 | 4290 | `repUsar` | prompt | 'Alguma observação? (opcional)','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (reposição — marcar uso) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | 2 toques + campo de texto na tela |
| 7 | 4294 | `repUsar` | alert | 'Não consegui marcar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 8 | 4298 | `repEstornar` | alert | 'Só a recepção, a Gestão ou a Supervisão estornam.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 9 | 4299 | `repEstornar` | prompt | 'Estornar este lançamento — por quê? / / O lançamento original NÃO é apagado: fica no extrato, e o estorno entra como uma linha nova explicando o erro | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (reposição — estornar lançamento) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 10 | 4304 | `repEstornar` | alert | 'Não consegui estornar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 11 | 4369 | `trocaDecidir` | alert | 'Só a Gestão ou a Diretoria decide uma troca acima das '+TROCA_VAGAS_DIA+' vagas.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 12 | 4372 | `trocaDecidir` | prompt | 'Recusar a troca de '+(t.nome\|\|'')+' para '+fmtBR(dataISO)+'. / / Por quê? A recepção precisa saber o que dizer ao tutor.','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (troca de dia — decidir (recusar)) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 13 | 4385 | `trocaCancelar` | confirm | 'Cancelar esta troca? A vaga volta a ficar livre e o crédito continua com ele.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "troca de dia — cancelar" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 14 | 4442 | `trocaAbrirLancar` | alert | 'Só a Recepção, a Supervisão ou a Gestão marcam troca.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 15 | 4443 | `trocaAbrirLancar` | prompt | 'Marcar troca — qual FILHOt? / / Escreva o nome (ou nome e tutor, se houver xará).','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (troca de dia — lançar) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 16 | 4446 | `trocaAbrirLancar` | alert | 'Não achei "'+nome+'" no cadastro.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 17 | 4448 | `trocaAbrirLancar` | alert | 'Achei mais de um: / / '+achados.slice(0,6).map(function(x){ return '· '+pelNome(x)+' — '+(x.tutor\|\|'sem tutor'); }).join(' / ') | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 18 | 4454 | `trocaAbrirLancar` | prompt | 'Troca de '+pelNome(p)+' / / Para qual dia ele vem? Escreva no formato aaaa-mm-dd. / / Dias em que ele já vem: '+jaVem,'')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (troca de dia — lançar) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 19 | 4457 | `trocaAbrirLancar` | alert | erro); return; } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Média | zAlertao |
| 20 | 4462 | `trocaAbrirLancar` | prompt | 'Por que a troca? (ex.: viagem do tutor, consulta, cio) / / '+aviso,'')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (troca de dia — lançar) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 21 | 4464 | `trocaAbrirLancar` | alert | reg.status==='confirmada' | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 22 | 4467 | `trocaAbrirLancar` | alert | e.message\|\|'Não consegui marcar.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 23 | 5252 | `salvarFoto` | alert | 'Tire ou escolha a foto primeiro (📷 Trocar foto).'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 24 | 5695 | `magRemoverItem` | alert | 'Apenas a Veterinária, a Gestão ou a Supervisão podem remover medicação.'); return; } } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 25 | 5696 | `magRemoverItem` | alert | 'Você não tem permissão para remover medicação.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 26 | 5697 | `magRemoverItem` | confirm | 'Remover este medicamento da agenda?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "medicação — remover item da agenda" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (padrão registrarDoseAgendada) |
| 27 | 5985 | `tocarEstoqueAcabando` | confirm | 'Avisar a Recepção que "'+(it.nome\|\|'este medicamento')+'" está acabando?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "medicação — avisar estoque acabando" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (padrão registrarDoseAgendada) |
| 28 | 5986 | `tocarEstoqueAcabando` | alert | 'Banco conectando… tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 29 | 6042 | `chamadoResponder` | alert | 'Escreva a solução — é isso que a monitora vai ler.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 30 | 6043 | `chamadoResponder` | alert | 'Assine com o seu nome. Quem respondeu responde pela solução.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 31 | 6057 | `chamadoResponder` | alert | 'Não consegui responder: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 32 | 6147 | `avisoAddEntrada` | alert | 'Escreva o que foi feito e o seu nome para registrar.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 33 | 6156 | `avisoResolver` | alert | 'Descreva o que foi feito e assine para marcar como resolvido.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 34 | 6326 | `ocorrResolver` | alert | 'Escreva o que foi feito. É isso que a próxima pessoa vai ler.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 35 | 6328 | `ocorrResolver` | alert | 'Assine com o SEU NOME — um ponto ou uma letra solta não diz quem resolveu.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 36 | 6341 | `ocorrResolver` | alert | 'Erro ao registrar: '+(e&&e.message\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 37 | 6347 | `ocorrAvisarTutor` | alert | 'Escreva o que foi falado com o tutor e o seu nome para registrar.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 38 | 6352 | `ocorrAvisarTutor` | alert | 'Erro ao registrar: '+(e&&e.message\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 39 | 6356 | `ocorrReabrir` | confirm | 'Reabrir esta ocorrência? Ela volta a aparecer como "falta avisar".')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "ocorrência — reabrir" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 40 | 6412 | `avisoRacaoAddEntrada` | alert | 'Escreva o que foi feito e o seu nome para registrar.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 41 | 6421 | `avisoRacaoResolver` | alert | 'Descreva o que foi feito e assine para marcar como resolvido.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 42 | 6638 | `registrarDoseAgendadaGlobal` | alert | 'Erro ao registrar a dose: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 43 | 6938 | `confirmarRecebimento` | confirm | 'Você leu TODO o relatório de '+((currentHosp&&currentHosp.nome)\|\|'este FILHOt')+'? / / Ao assinar, você assume o cuidado dele a partir de agora. / /  | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — assinar recebimento do relatório" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (o mesmo bug do commit 260c544 nasceu aqui) |
| 44 | 7062 | `_vMed` | confirm | 'Você escreveu "'+passou+'". / / Você é a '+_prox.o+'? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — verificação de identidade no relatório" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) — igual ao aviso do commit 260c544 |
| 45 | 7156 | `copiarTexto` | alert | 'Texto copiado! Cole no WhatsApp do tutor.'); } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao (op.ok:true) |
| 46 | 7237 | `fecharTurnoEAvisar` | alert | 'Não consegui montar o resumo agora — confira a internet e tente de novo.'); return; } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Alta | zEscolha (botões na tela) |
| 47 | 7240 | `fecharTurnoEAvisar` | confirm | 'Vai para o grupo da Gestão: / / '+texto.replace(/<\/?b>/g,'')+' / / Mandar?')){ voltar(); return; } | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — fechar turno e avisar Telegram/Gestão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 48 | 7257 | `fecharTurnoEAvisar` | alert | 'A ponte do Telegram não está configurada neste sistema. Avise a Gestão.'); } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zEscolha (botões na tela) |
| 49 | 7258 | `fecharTurnoEAvisar` | alert | 'Não consegui ler a configuração do Telegram. Tente de novo.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zEscolha (botões na tela) |
| 50 | 7262 | `fecharTurnoEAvisar` | alert | 'Não consegui montar o resumo agora. Tente de novo.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zEscolha (botões na tela) |
| 51 | 7484 | `orcAddAvulso` | alert | 'Escreva o nome do peludinho e o nome do tutor.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 52 | 7485 | `orcAddAvulso` | alert | 'Falta a raça. Ela é obrigatória para cliente novo — sem ela, dois FILHOts de mesmo nome viram um só.'); try{ document.getElementById('orcAvRaca').foc | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 53 | 7487 | `orcAddAvulso` | alert | 'Ele já está neste orçamento.'); return; } | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Média | zAlertao |
| 54 | 7839 | `orcMudarDatas` | alert | 'Esta reserva não tem FILHOt salvo — não dá para reabrir. Use "Cancelar reserva" e faça um orçamento novo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 55 | 7940 | `orcSalvarEdicao` | alert | 'As datas continuam as mesmas ('+orcBR(antes.entrada)+' a '+orcBR(antes.saida)+'). / / Mude a entrada ou a saída antes de salvar.'); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 56 | 7946 | `orcSalvarEdicao` | confirm | 'Mudar a reserva de '+nomes+'? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "orçamento — salvar mudança de datas" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + 2 toques |
| 57 | 7951 | `orcSalvarEdicao` | prompt | 'Por que as datas mudaram? / (ex.: a tutora antecipou a viagem)','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (orçamento — salvar mudança de datas) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + 2 toques |
| 58 | 7952 | `orcSalvarEdicao` | alert | 'Escreva o motivo — é ele que explica a mudança quando alguém for conferir depois.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Alta | zAlertao |
| 59 | 7953 | `orcSalvarEdicao` | prompt | 'Digite a SUA senha para confirmar. / / É o seu nome que vai ficar registrado.','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (orçamento — salvar mudança de datas) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + 2 toques |
| 60 | 7955 | `orcSalvarEdicao` | alert | 'Essa senha não é de ninguém cadastrado. A reserva NÃO foi alterada.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 61 | 8088 | `orcApagar` | confirm | 'Apagar de vez o orçamento de '+(nomes\|\|'—')+' ('+fmtCent(o.total_cent\|\|0)+')? / / Não dá para desfazer.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "orçamento — apagar de vez" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 62 | 8115 | `orcCancelar` | confirm | 'CANCELAR a reserva de '+nomes+'? / / '+orcBR(o.entrada\|\|'')+' a '+orcBR(o.saida\|\|'')+' / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "orçamento — cancelar reserva" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + 2 toques |
| 63 | 8118 | `orcCancelar` | prompt | 'Por que a reserva foi cancelada? / (ex.: a viagem foi desmarcada, o tutor adiou)','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (orçamento — cancelar reserva) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + 2 toques |
| 64 | 8119 | `orcCancelar` | alert | 'Escreva o motivo — é ele que explica o cancelamento quando alguém for conferir depois.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Alta | zAlertao |
| 65 | 8120 | `orcCancelar` | prompt | 'Digite a SUA senha para confirmar o cancelamento. / / É o seu nome que vai ficar registrado.','')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (orçamento — cancelar reserva) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + 2 toques |
| 66 | 8121 | `orcCancelar` | alert | 'Cancelamento não confirmado — a senha é obrigatória.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 67 | 8123 | `orcCancelar` | alert | 'Essa senha não é de ninguém cadastrado. A reserva NÃO foi cancelada. / / Confira a senha e tente de novo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 68 | 8124 | `orcCancelar` | alert | 'Sem conexão com o banco agora — a reserva não foi cancelada. Tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 69 | 8138 | `orcCancelar` | alert | 'NÃO consegui cancelar: '+((e&&e.message)\|\|e)+' / / Nada foi alterado. Confira a internet e tente de novo.'); | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Alta | zAlertao |
| 70 | 8373 | `orcAddFeriado` | alert | 'Preencha a data e o nome do feriado.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Baixa | zAlertao |
| 71 | 8931 | `plantConfirmar` | confirm | msg)) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — confirmar participação" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 72 | 8935 | `plantConfirmarNova` | prompt | 'Como se escreve o nome dela, certo? / / Ela assinou como "'+apelido+'".', apelido)\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (plantão — confirmar nome de plantonista nova) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela |
| 73 | 8946 | `plantNaoEhPlantonista` | confirm | '"'+apelido+'" nunca fez plantão? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — marcar que nunca fez plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 74 | 8958 | `plantVoltarAContar` | confirm | '"'+apelido+'" passou a fazer plantão? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — voltar a contar plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 75 | 9150 | `acertoRecalcular` | confirm | 'Atualizar '+orcBR(iso)+' de '+fmtCent(antes)+' para '+fmtCent(v.total)+'? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "acerto/dinheiro — recalcular valor" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (padrão registrarDoseAgendada) |
| 76 | 9162 | `acertoRecalcular` | alert | 'Não salvou: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 77 | 9166 | `acertoMarcar` | alert | 'Escreva o nome de quem passou a noite. Pagamento sem nome não fecha conta.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Alta | zAlertao |
| 78 | 9206 | `acertoMarcar` | alert | 'Não salvou: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 79 | 9330 | `dispensarAvisoBarrado` | confirm | 'Tirar o aviso de "'+quem+'"? / / O celular NÃO será liberado — só o aviso sai da lista.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "acesso — dispensar aviso de celular barrado" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 80 | 9377 | `liberarAparelhoDaLista` | prompt | 'Dê um nome para este celular (ex.: "Celular do Octávio"):', 'Celular de '+(quem\|\|''))\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (acesso — nomear e liberar aparelho) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 81 | 9385 | `liberarAparelhoDaLista` | alert | 'Erro ao liberar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 82 | 9547 | `removerPessoa` | confirm | 'Remover '+(MONITORES[i].nome\|\|'esta pessoa')+' do cadastro? (Não apaga histórico — só tira o acesso.)')) return; MONITORES.splice(i,1); try{ renderMo | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "cadastro de pessoas — remover acesso" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 83 | 9581 | `autorizarAparelho` | prompt | 'Dê um nome para ESTE aparelho (ex: iPhone Daycare 1):')\|\|'').trim(); if(!nome) return; | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (acesso — nomear aparelho autorizado) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 84 | 10120 | `escolherHospede` | confirm | '⚠ ATENÇÃO — '+nome+' é ALÉRGICO(A) / tem RESTRIÇÃO: / '+det+' / Confirme para lançar a hospedagem.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — lançar hóspede no Plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 85 | 10135 | `escolherHospede` | alert | nome+' JÁ está na lista de hoje — ' | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Alta | zEscolha (botões na tela) |
| 86 | 10146 | `escolherHospede` | confirm | '⚠ ATENÇÃO — '+nome+' é ALÉRGICO(A) / tem RESTRIÇÃO: / '+detalhe+' / Confirme para prosseguir com o registro da hospedagem.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — lançar hóspede no Plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 87 | 10155 | `escolherHospede` | alert | 'Erro ao adicionar: '+e.message)); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zEscolha (botões na tela) |
| 88 | 10217 | `salvarPernAgendado` | alert | 'Sem conexão com o banco agora — o pernoite não foi lançado. Tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 89 | 10227 | `salvarPernAgendado` | alert | 'Pernoite de '+(reg.nome\|\|'')+' lançado para '+qdo+'. / / ' | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 90 | 10230 | `salvarPernAgendado` | alert | 'NÃO consegui lançar o pernoite: '+((e&&e.message)\|\|e)+' / / Nada foi salvo. Confira a internet e tente de novo.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 91 | 10242 | `cancelarHospedeManual` | alert | 'Este registro não pode ser cancelado por aqui — ele veio da planilha, não foi lançado manualmente hoje.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | 2 toques + zAlertao |
| 92 | 10243 | `cancelarHospedeManual` | confirm | 'Cancelar a pernoite/hospedagem de '+(h.nome\|\|'?')+' de hoje? / / Isso remove só o lançamento de hoje — não mexe no cadastro do FILHOt. Se ele voltar  | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar pernoite/hospedagem manual" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques + zAlertao |
| 93 | 10251 | `cancelarHospedeManual` | alert | 'Erro ao cancelar: '+e.message)); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | 2 toques + zAlertao |
| 94 | 10262 | `removerHospedeCard` | alert | 'Só a Gestão, a Supervisão, a Diretoria ou o Monitor podem remover.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 95 | 10264 | `removerHospedeCard` | alert | 'A moradora Repolho não é removida.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 96 | 10285 | `removerHospedeCard` | confirm | cabeca+' / / '+corpo)) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — remover hóspede do Plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + 2 toques |
| 97 | 10287 | `removerHospedeCard` | prompt | 'Por que '+nome+' está saindo do Plantão? / / ' | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (check-in/out — remover hóspede do Plantão) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + 2 toques |
| 98 | 10293 | `removerHospedeCard` | alert | 'Preciso do motivo escrito para tirar '+nome+' da lista. / / ' | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 99 | 10297 | `removerHospedeCard` | confirm | 'CONFIRMAÇÃO FINAL / / '+nome+' está hospedado'+(ate?(' até '+ate):'')+'. / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — remover hóspede do Plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + 2 toques |
| 100 | 10303 | `removerHospedeCard` | alert | 'Sem conexão com o banco agora — nada foi alterado. Tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 101 | 10314 | `removerHospedeCard` | alert | 'NÃO consegui tirar: '+(e&&e.message\|\|e)+' / / Nada foi alterado.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 102 | 10317 | `removerHospedeCard` | alert | 'Sem conexão com o banco agora — nada foi alterado. Tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 103 | 10324 | `removerHospedeCard` | alert | 'NÃO consegui tirar: '+(e&&e.message\|\|e)+' / / Nada foi alterado.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 104 | 10380 | `hospTrazerDeVolta` | alert | 'Só a Supervisão, a Gestão ou a Diretoria podem trazer um FILHOt de volta ao Plantão.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 105 | 10382 | `hospTrazerDeVolta` | confirm | 'Trazer '+(v.nome\|\|'este FILHOt')+' de volta ao Plantão de hoje? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — trazer FILHOt de volta ao Plantão" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 106 | 10384 | `hospTrazerDeVolta` | alert | 'Sem conexão com o banco agora — tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 107 | 10394 | `hospTrazerDeVolta` | alert | (v.nome\|\|'Ele')+' voltou para o Plantão. / / Peça para a plantonista atualizar a tela.'); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 108 | 10395 | `hospTrazerDeVolta` | alert | 'NÃO consegui trazer de volta: '+((e&&e.message)\|\|e)+' / / Nada foi alterado.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 109 | 10399 | `cancelarPernoiteFicha` | alert | 'Só a Gestão, a Supervisão, a Diretoria ou o Monitor podem deletar uma pernoite.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 110 | 10407 | `cancelarPernoiteFicha` | confirm | 'CANCELAR a estadia de '+(h.nome\|\|'este FILHOt')+'? / / Use quando o check-in foi lançado ERRADO. Cancela a estadia inteira (sai do Plantão e do Day C | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar/remover estadia da ficha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 111 | 10408 | `cancelarPernoiteFicha` | confirm | 'Confirmação final: cancelar a estadia de '+(h.nome\|\|'este FILHOt')+'?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar/remover estadia da ficha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 112 | 10409 | `cancelarPernoiteFicha` | alert | 'Sem internet agora — tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 113 | 10414 | `cancelarPernoiteFicha` | alert | 'Erro ao cancelar a estadia: '+(e&&e.message\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 114 | 10421 | `cancelarPernoiteFicha` | confirm | 'Remover '+(h.nome\|\|'este FILHOt')+' do Hotel de hoje? / / Ele sai da lista de hoje. O cadastro continua salvo. (Registro da planilha/estadia — removi | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar/remover estadia da ficha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 115 | 10428 | `cancelarPernoiteFicha` | alert | 'Erro ao remover: '+(e&&e.message\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 116 | 10431 | `cancelarPernoiteFicha` | confirm | 'Tem certeza que quer deletar esse peludinho do Hotel? / / '+(h.nome\|\|'Este FILHOt')+' sai da lista de hoje. O cadastro dele continua salvo.')) return | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar/remover estadia da ficha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 117 | 10432 | `cancelarPernoiteFicha` | confirm | 'Confirmação final: deletar '+(h.nome\|\|'este FILHOt')+' da AuAulândia de hoje?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — cancelar/remover estadia da ficha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 118 | 10441 | `cancelarPernoiteFicha` | alert | 'Erro ao deletar: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | 2 toques (dupla confirmação já existe — trocar por zEscolha) |
| 119 | 10732 | `_acharPelPlano` | alert | 'Só a Gestão/Supervisão importa os planos.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 120 | 10904 | `avisoEscolhaPlano` | alert | 'Escolha o plano (Mensal, Trimestral ou Semestral) antes de lançar a vigência.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 121 | 10925 | `setRenovInicio` | confirm | 'ATENÇÃO — esta vigência já nasce VENCIDA. / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plano — vigência já nasce vencida" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | zEscolha (botões na tela) |
| 122 | 10942 | `confirmarRenovacao` | alert | 'Preencha a data do pagamento.'); | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zEscolha (botões na tela) |
| 123 | 10949 | `confirmarRenovacao` | confirm | 'ATENÇÃO — você está confirmando uma renovação JÁ VENCIDA. / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plano — confirmar renovação vencida" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | zEscolha (botões na tela) |
| 124 | 11482 | `vetRemoverReavaliacao` | alert | 'Apenas a Veterinária, a Gestão ou a Supervisão podem remover a reavaliação.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 125 | 11484 | `vetRemoverReavaliacao` | confirm | 'Remover a reavaliação marcada de '+(vetHosp.nome\|\|'este peludinho')+'?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "medicação — remover reavaliação" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 126 | 11491 | `vetRemoverReavaliacao` | alert | 'Erro ao remover reavaliação: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 127 | 11614 | `vetAbrirNovaMed` | alert | 'Apenas a Veterinária, a Gestão ou a Supervisão podem prescrever medicação.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 128 | 11621 | `vetAbrirAlterarMed` | alert | 'Apenas a Veterinária, a Gestão ou a Supervisão podem alterar medicação.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 129 | 11688 | `vetSuspenderMed` | prompt | 'Suspender "'+(it.nome\|\|'este medicamento')+'". Motivo (fica registrado e assinado):')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (medicação — suspender) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela |
| 130 | 11689 | `vetSuspenderMed` | alert | 'É preciso informar o motivo para suspender.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 131 | 11696 | `vetSuspenderMed` | alert | 'Erro ao suspender: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 132 | 11701 | `vetReativarMed` | prompt | 'Reativar "'+(it.nome\|\|'este medicamento')+'". Motivo (fica registrado):')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (medicação — reativar) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela |
| 133 | 11702 | `vetReativarMed` | alert | 'É preciso informar o motivo para reativar.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 134 | 11709 | `vetReativarMed` | alert | 'Erro ao reativar: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 135 | 12004 | `vetCienteFimMed` | alert | 'Apenas a Veterinária, a Gestão ou a Supervisão podem dar ciência do término.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 136 | 12013 | `vetCienteFimMed` | alert | 'Erro ao registrar ciência: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 137 | 12095 | `zFalta` | alert | (lista.length>1?'Faltam '+lista.length+' coisas: / / ':'Falta: / / ') | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao (já é o padrão recomendado no comentário da própria função) |
| 138 | 12170 | `gateCadastro` | alert | 'Só a recepção, a Gestão ou a Supervisão podem cadastrar um FILHOt.'); | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 139 | 12234 | `onRacaPel` | alert | 'Já existe um cadastro idêntico: "'+pelNome(gemeoExato)+'" · '+(pelGet(gemeoExato,'raca')\|\|'—')+' · tutor '+(pelGet(gemeoExato,'tutor')\|\|'—')+'. / / E | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Média | zAlertao / zEscolha |
| 140 | 12242 | `onRacaPel` | confirm | 'Já existe outro(a) "'+nome+'" · '+raca+' cadastrado(a) com o(a) tutor(a) "'+(pelGet(parecido,'tutor')\|\|'sem tutor informado')+'". / / É um FILHOt dif | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "cadastro — cadastro idêntico/parecido" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | zAlertao / zEscolha |
| 141 | 12648 | `prevLancar` | alert | 'Escolha a data em que foi feito.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 142 | 12649 | `prevLancar` | alert | 'Essa data ainda não chegou ('+fmtBR(dt)+'). Confira o mês e o ano.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 143 | 12713 | `copiarPrevencao` | alert | 'Nada a copiar — ninguém com pendência neste filtro.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao com o texto pronto para copiar |
| 144 | 12715 | `copiarPrevencao` | alert | 'Lista copiada — '+l.length+' FILHOt'+(l.length>1?'s':'')+'. É só colar onde quiser.'); }; | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao com o texto pronto para copiar |
| 145 | 12716 | `copiarPrevencao` | prompt | 'Copie daqui:',txt); }); | Não | Não é gravação — é um recurso de apoio (copiar texto/escolher dia para relatório); se travar, a pessoa só não consegue copiar/gerar, nada é perdido no banco. | Baixa | zAlertao com o texto pronto para copiar |
| 146 | 12717 | `copiarPrevencao` | prompt | 'Copie daqui:',txt); | Não | Não é gravação — é um recurso de apoio (copiar texto/escolher dia para relatório); se travar, a pessoa só não consegue copiar/gerar, nada é perdido no banco. | Baixa | zAlertao com o texto pronto para copiar |
| 147 | 12721 | `baixarPrevencao` | alert | 'Nada a baixar — ninguém com pendência neste filtro.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 148 | 12755 | `baixarPrevencao` | alert | 'Não consegui gerar o arquivo: '+err.message); } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Baixa | zAlertao |
| 149 | 12962 | `salvarFotoPel` | alert | 'Escolha a foto primeiro (Inserir foto).'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Baixa | zAlertao |
| 150 | 13016 | `registrarObito` | alert | 'Só a Gestão, a Supervisão ou a Diretoria podem registrar um falecimento.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | campo de texto na tela + zEscolha |
| 151 | 13019 | `registrarObito` | alert | nome+' já está registrado como falecido'+(ex.dataObito?(' em '+ex.dataObito):'')+'. / / ' | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Alta | campo de texto na tela + zEscolha |
| 152 | 13023 | `registrarObito` | confirm | 'Registrar o falecimento de '+nome+'? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "cadastro — registrar falecimento" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + zEscolha |
| 153 | 13031 | `registrarObito` | prompt | 'Em que dia '+nome+' faleceu? / / ' | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (cadastro — registrar falecimento) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + zEscolha |
| 154 | 13037 | `registrarObito` | alert | 'Não entendi a data "'+v+'". / / Escreva assim: '+hojeBR); data=v; continue; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Alta | campo de texto na tela + zEscolha |
| 155 | 13039 | `registrarObito` | alert | 'Essa data não existe no calendário. Confira o dia e o mês.'); data=v; continue; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 156 | 13040 | `registrarObito` | alert | 'Essa data ainda não chegou. Confira o ano.'); data=v; continue; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 157 | 13046 | `registrarObito` | prompt | 'Quer deixar alguma observação? (opcional) / / ' | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (cadastro — registrar falecimento) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + zEscolha |
| 158 | 13053 | `registrarObito` | alert | nome+' foi registrado como falecido em '+data+'. / / ' | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 159 | 13062 | `inativarPeludinhoRapido` | alert | 'Só a Gestão, a Supervisão ou a Diretoria podem inativar um FILHOt.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | campo de texto na tela + zEscolha |
| 160 | 13066 | `inativarPeludinhoRapido` | alert | nome+' está registrado como falecido'+(ex.dataObito?(' em '+ex.dataObito):'')+'. / / ' | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 161 | 13071 | `inativarPeludinhoRapido` | confirm | nome+' está inativo. / / Reativar? Ele volta para as listas do dia e para a chamada.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "presença — inativar/reativar FILHOt" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + zEscolha |
| 162 | 13075 | `inativarPeludinhoRapido` | alert | '✅ '+nome+' voltou. Ele já aparece de novo nas listas do dia.'); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 163 | 13082 | `inativarPeludinhoRapido` | confirm | nome+' — este é um caso de PAUSA (o tutor suspendeu por um tempo e ele volta)? / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "presença — inativar/reativar FILHOt" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | campo de texto na tela + zEscolha |
| 164 | 13086 | `inativarPeludinhoRapido` | prompt | 'Inativar '+nome+' — '+(ehPausaResp?'por que ele vai PAUSAR?':'por que ele saiu do Day Care?') | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (presença — inativar/reativar FILHOt) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela + zEscolha |
| 165 | 13090 | `inativarPeludinhoRapido` | alert | 'Sem o motivo eu não inativo. Se não souber ainda, pergunte antes — o cadastro continua ativo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 166 | 13095 | `inativarPeludinhoRapido` | alert | '✅ '+nome+' foi inativado. / / Motivo: '+motivo+' / Data: '+data+' / / Ele sai das listas do dia e da chamada. O cadastro e todo o histórico continuam | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | campo de texto na tela + zEscolha |
| 167 | 13162 | `reativarPeludinho` | alert | 'Apenas Gestão e Supervisão podem reativar um peludinho.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 168 | 13165 | `reativarPeludinho` | confirm | nome+' voltou para o Day Care? / / Ele volta para a lista de Peludinhos frequentes e para as chamadas do dia. A saída anterior fica guardada no histór | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "presença — reativar FILHOt no Day Care" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 169 | 13173 | `reativarPeludinho` | alert | nome+' voltou para a ativa. Já aparece em Peludinhos e nas chamadas do dia.'); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 170 | 13575 | `inserirAluno` | alert | 'Apenas Gestão e Supervisão podem cadastrar um novo aluno.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 171 | 13662 | `criarAluno` | confirm | 'Já existe um(a) '+nome+' cadastrado(a) com o(a) tutor(a) "'+(pelGet(homonimo,'tutor')\|\|'sem tutor informado')+'". / / Este é outro FILHOt, de outra f | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "cadastro — homônimo, confirmar novo aluno" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | zEscolha (botões na tela) |
| 172 | 13684 | `excluirCadastroPel` | alert | 'Somente a Diretoria pode excluir um cadastro definitivamente.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 173 | 13686 | `excluirCadastroPel` | alert | 'Sem conexão com o banco agora. A exclusão precisa gravar no Firebase antes de sumir da tela — tente de novo com internet.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 174 | 13688 | `excluirCadastroPel` | prompt | 'Motivo da exclusão de '+nome+' (obrigatório — fica registrado no histórico):')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (cadastro — excluir definitivamente) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela (mantém a confirmação por nome digitado) |
| 175 | 13689 | `excluirCadastroPel` | alert | 'Sem motivo escrito, o cadastro não é excluído.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 176 | 13690 | `excluirCadastroPel` | prompt | 'CONFIRMAÇÃO FINAL — isso é IRREVERSÍVEL e diferente de inativar. / / Se o FILHOt pode voltar ou a família continua tutora, CANCELE aqui e use "Saiu d | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (cadastro — excluir definitivamente) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela (mantém a confirmação por nome digitado) |
| 177 | 13691 | `excluirCadastroPel` | alert | 'O nome digitado não confere com "'+nome+'". Cadastro NÃO excluído.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 178 | 13707 | `excluirCadastroPel` | alert | 'Cadastro de '+nome+' excluído. Uma cópia completa (com data, motivo e quem excluiu) ficou guardada em daycare/excluidos.'); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 179 | 13711 | `excluirCadastroPel` | alert | 'Erro ao excluir: '+e.message+' / / O cadastro NÃO foi apagado — tente novamente.')); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 180 | 13992 | `escolherAvulso` | alert | nome+' já está na turma de hoje — não precisa marcar diária avulsa de novo.'); | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Alta | zAlertao |
| 181 | 14002 | `escolherAvulso` | alert | 'Erro: '+e.message)); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 182 | 14070 | `acrescentarAtividade` | prompt | 'Nome da nova atividade:')\|\|'').trim(); if(!t) return; ATIVIDADES.push({t:t}); salvarAtiv(); renderAtiv(); } | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (catálogo de atividades (EA)) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Baixa | campo de texto na tela |
| 183 | 14071 | `removerAtividade` | confirm | 'Remover a atividade \"'+ATIVIDADES[i].t+'\"?')) return; ATIVIDADES.splice(i,1); salvarAtiv(); renderAtiv(); } | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "catálogo de atividades (EA) — remover" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Baixa | 2 toques |
| 184 | 14199 | `setAlmStep` | alert | 'Conclua a etapa anterior primeiro (modo treinamento).'); return; } almStep=step; renderAlmStep(); } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 185 | 14727 | `ckVideo` | alert | 'Este vídeo tem '+mb.toFixed(1)+' MB e é grande demais para guardar ('+CK_VIDEO_MAX_MB+' MB é o limite). / / Grave de novo com 5 a 10 segundos — é o b | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 186 | 15137 | `ckSalvar` | alert | 'Erro ao salvar: '+e.message); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 187 | 15358 | `irmSalvar` | alert | 'Sem conexão com o banco — o vínculo não foi salvo. Tente de novo.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Média | zAlertao |
| 188 | 15369 | `irmSalvar` | alert | 'Não consegui salvar: '+((e&&e.message)\|\|e)+'. Nada foi gravado.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 189 | 15373 | `irmDesfazer` | confirm | 'Desfazer este vínculo? Os dois voltam a ser conferidos separadamente.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "vínculo de duplas/irmãos — desfazer" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 190 | 15377 | `irmDesfazer` | alert | 'Não consegui desfazer: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 191 | 15619 | `ptAddHora` | alert | 'Escolha o horário no relógio antes de acrescentar.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 192 | 15694 | `ptAvisarRecepcao` | alert | 'Não consegui avisar: '+((e&&e.message)\|\|e)+'. Ligue para a Recepção.'); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 193 | 15703 | `ptSalvarSaida` | confirm | 'Ainda não foram guardados: / / '+naoGuardados.map(function(x){ return '· '+x.t; }).join(' / ') | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "pertences — salvar saída" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques + zAlertao |
| 194 | 15711 | `ptSalvarSaida` | alert | 'Sem conexão — não deu para salvar.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Média | 2 toques + zAlertao |
| 195 | 15717 | `ptSalvarSaida` | alert | 'Não salvou: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | 2 toques + zAlertao |
| 196 | 15722 | `ptSalvar` | alert | 'Falta responder: '+faltam.map(function(x){ return x.t; }).join(', ')+'. / / Marcar "não trouxe" também conta — é assim que a saída sabe o que não pod | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 197 | 15730 | `ptSalvar` | alert | 'Sem conexão — não deu para salvar. Tente de novo quando a internet voltar.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Média | zAlertao |
| 198 | 15756 | `ptSalvar` | alert | 'Não salvou: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 199 | 16050 | `eaMarcarTempo` | confirm | 'Refazer o tempo de "'+((EA_ETAPAS.find(function(x){return x.k===k;})\|\|{}).t\|\|k)+'"? / / O horário anterior é perdido.')) return; t={ini:agora}; } | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "enriquecimento ambiental — refazer tempo de etapa" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 200 | 16528 | `algResponder` | alert | 'Não consegui gravar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 201 | 16991 | `pessoaDoTurno` | prompt | 'QUEM ESTA NO TURNO AGORA? / / Escreva o seu nome. Ele fica registrado em tudo o que voce fizer neste aparelho — ' | Sim (indireto) | Se o diálogo travar, ninguém assina o turno — e toda ação feita depois (dose de remédio, check-in, plantão) fica sem saber quem foi. É a assinatura que vira "quem" em tudo que se grava a seguir. | Alta | campo de texto na tela |
| 202 | 16996 | `pessoaDoTurno` | alert | avisoAssinaturaInvalida(v)); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 203 | 17000 | `trocarPessoaDoTurno` | alert | 'Turno agora com: '+n); return n; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 204 | 17071 | `turnoTrocar` | confirm | rotulo+' de hoje JÁ foi registrado às '+atual+(quemAtual?' por '+quemAtual:'')+'. / / ' | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "plantão — turno já registrado hoje" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 205 | 17137 | `ativEncerrar` | alert | 'Esta atividade ainda não foi iniciada. Toque em "Iniciar" primeiro — sem o começo não dá para medir o tempo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 206 | 17357 | `marcarAlmoco` | alert | 'Você está vendo a turma de '+DIA_FULL[dcDia]+', que não é hoje. / / O almoço é registrado no dia em que acontece. Volte para '+DIA_FULL[HOJE_DIA]+' ( | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 207 | 17577 | `dashApagarPonte` | alert | 'Só a Diretoria pode desligar a ponte.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 208 | 17578 | `dashApagarPonte` | confirm | 'Desligar a ponte com a planilha? / / O app continua guardando tudo, mas a TV para de receber o que for lançado — e alguém terá que escrever na planil | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "painel TV — desligar ponte com a planilha" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 209 | 17662 | `dashLancar` | alert | 'Escolha o horário antes — é ele que faz o alarme tocar na TV.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Média | zAlertao |
| 210 | 17665 | `dashLancar` | alert | valor+' já está lançado em '+it.t+' hoje.'); return; | Não | Se o alerta for suprimido, a pessoa não vê o aviso de possível duplicidade e pode acabar criando um cadastro repetido. | Média | zAlertao |
| 211 | 17676 | `dashLancar` | alert | 'Não salvou: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 212 | 17706 | `dashReenviar` | alert | 'Não achei este lançamento para reenviar. Atualize a tela e tente de novo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 213 | 17711 | `dashReenviar` | alert | 'Enviado para a planilha.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 214 | 17714 | `dashReenviar` | alert | 'Não foi para a planilha: '+e); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 215 | 17717 | `dashReenviar` | alert | 'Não foi para a planilha: '+((e&&e.message)\|\|e)); | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 216 | 17723 | `dashRemover` | confirm | 'Tirar '+reg.valor+' de '+it.t+'? / / Sai daqui e sai da planilha — some da TV.')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "painel TV — remover lançamento" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 217 | 17729 | `dashRemover` | alert | 'Não removeu: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 218 | 17755 | `baixarSemMicrochip` | alert | 'Todos os FILHOts ativos já têm microchip na ficha. Nada a listar.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 219 | 17775 | `baixarSemMicrochip` | alert | 'Não consegui gerar o arquivo: '+err.message); } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Baixa | zAlertao |
| 220 | 17779 | `baixarGradeAlmoco` | alert | 'A grade ainda não carregou. Espere alguns segundos e tente de novo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 221 | 17789 | `baixarGradeAlmoco` | alert | 'Não consegui gerar o arquivo: '+err.message); } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Baixa | zAlertao |
| 222 | 17795 | `relBaixarXLS` | alert | 'Os dados ainda não carregaram. Espere alguns segundos e tente de novo.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 223 | 17804 | `relBaixarXLS` | alert | 'Não consegui gerar o arquivo: '+err.message); } | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Baixa | zAlertao |
| 224 | 17820 | `relOrcamentos` | alert | 'Nenhum orçamento salvo ainda. Abra "Orçamento de Hospedagem" primeiro para carregar a lista.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 225 | 17843 | `relCheckinHoje` | alert | 'Sem conexão com o banco.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Baixa | zAlertao |
| 226 | 17855 | `relCheckinHoje` | alert | 'Nenhum check-in registrado hoje ainda.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 227 | 17861 | `relCheckinHoje` | alert | 'Não consegui ler os dados: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Baixa | zAlertao |
| 228 | 17865 | `relPertencesHoje` | alert | 'Sem conexão com o banco.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Baixa | zAlertao |
| 229 | 17880 | `relPertencesHoje` | alert | 'Nenhum check-in de pertences registrado hoje ainda.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 230 | 17886 | `relPertencesHoje` | alert | 'Não consegui ler os dados: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Baixa | zAlertao |
| 231 | 17897 | `relPertencesBranco` | alert | 'Não há peludinhos marcados para '+(DIA_FULL[d]\|\|d)+'.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Baixa | zAlertao |
| 232 | 17906 | `relPertencesBrancoEscolher` | prompt | 'Qual dia da semana? / / '+opc+' / / (escreva o dia, ex: quarta)','')\|\|'').trim(); | Não | Não é gravação — é um recurso de apoio (copiar texto/escolher dia para relatório); se travar, a pessoa só não consegue copiar/gerar, nada é perdido no banco. | Baixa | botões de dia na tela em vez de prompt() |
| 233 | 17910 | `relPertencesBrancoEscolher` | alert | 'Não entendi "'+r+'". Escreva o dia da semana: '+opc+'.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Baixa | zAlertao |
| 234 | 18943 | `ciCriarNovoHospede` | confirm | 'Já existe "'+nome+'"'+(raca?(' · '+raca):'')+' com o tutor "'+(pelGet(parecido,'tutor')\|\|'sem tutor informado')+'". / / É um FILHOt diferente, de out | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in — homônimo, confirmar novo cadastro" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 235 | 19203 | `ciAddMedBtn` | alert | 'Apenas a Consultora, a Gestão, a Supervisão ou a Veterinária cadastram medicação no check-in.'); return; } ciAddMed(); } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 236 | 19274 | `ciTogglePertManage` | alert | 'Apenas a Consultora, a Gestão, a Supervisão ou a Diretoria podem gerenciar o banco de pertences.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 237 | 19312 | `ciRenomearPertBanco` | alert | 'Sem permissão para editar o banco.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Baixa | zAlertao |
| 238 | 19314 | `ciRenomearPertBanco` | prompt | 'Editar o nome do item "'+def.nome+'":', def.nome)\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (check-in — renomear item do banco de pertences) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Baixa | campo de texto na tela |
| 239 | 19325 | `ciExcluirPertBanco` | alert | 'Sem permissão para excluir do banco.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Média | zAlertao |
| 240 | 19327 | `ciExcluirPertBanco` | confirm | 'Excluir "'+def.nome+'" do banco de pertences? Some da lista para todos.'+(ciPertEhDefault(k)?' / / (É um item padrão — ele pode voltar em atualizaçõe | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in — excluir item do banco de pertences" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | 2 toques |
| 241 | 19593 | `ciPodeSairDoCheckin` | confirm | '⚠️ O check-in de '+((ciHosp&&ciHosp.nome)\|\|'este FILHOt')+' ainda NÃO FOI SALVO. / / Se sair agora, ele não existe no sistema — não vai aparecer na C | Não* (decide se sai sem salvar — ver nota) | Esta é a trava contra perder o check-in inteiro ao sair sem salvar: se o diálogo travar/for suprimido e devolver false, ele BLOQUEIA a saída mesmo quando a pessoa quer sair — se devolver true sozinho, o check-in inteiro digitado se perde sem aviso. | Alta | zEscolha (botões na tela) — risco de perder o check-in inteiro |
| 242 | 19747 | `ciSalvar` | prompt | 'CORREÇÃO — por que esta informação está sendo alterada? / / O motivo fica gravado no check-in e a Conferência é reaberta. / / Ex.: a tutora ligou às  | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (check-in — salvar correção) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela |
| 243 | 19749 | `ciSalvar` | prompt | 'Seu nome (quem está corrigindo):', (typeof quemSou==='function'?quemSou():'')\|\|'')\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (check-in — salvar correção) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Alta | campo de texto na tela |
| 244 | 19843 | `ciQuemRecebeu` | prompt | msg)\|\|'').trim(); | Sim | Se o diálogo travar ou for suprimido, o campo obrigatório (check-in — quem recebeu o pertence) fica vazio, o código segue o "return" de validação e a gravação NÃO acontece — sem que a pessoa saiba que precisava preencher algo. | Média | campo de texto na tela |
| 245 | 19844 | `ciQuemRecebeu` | confirm | 'Sem o nome de quem recebeu, ninguém sabe quem pegou o material na mão. / / Cancelar o lançamento?')) { continue; } return null; } | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in — quem recebeu o pertence" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Média | campo de texto na tela |
| 246 | 20268 | `reemitirFichaAtual` | alert | 'Ainda não há um check-in salvo para reemitir a ficha deste hóspede.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Média | zAlertao |
| 247 | 20437 | `hospDarBaixa` | alert | 'Só a Recepção, a Supervisão, a Gestão ou a Diretoria podem dar baixa numa hospedagem.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 248 | 20443 | `hospConfirmarBaixa` | alert | 'Sem permissão para dar baixa.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 249 | 20453 | `hospConfirmarBaixa` | alert | 'Sem conexão com o banco agora — a baixa não foi dada. Tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 250 | 20455 | `hospConfirmarBaixa` | confirm | 'Dar baixa em '+(e.nome\|\|'esta hospedagem')+'? / / Foi embora em: '+((typeof ciBRdata==='function')?ciBRdata(dt):dt) | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — dar baixa numa hospedagem" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 251 | 20465 | `hospConfirmarBaixa` | alert | 'NÃO consegui dar a baixa: '+((err&&err.message)\|\|err)+' / / Nada foi alterado. Confira a internet e tente de novo.'); | Não | Se o alerta for suprimido, a informação simplesmente se perde — a pessoa segue sem saber o que aconteceu. | Alta | zAlertao |
| 252 | 20518 | `hospEditarDatas` | alert | 'Só a Gestão, a Supervisão, a Consultora ou a Diretoria podem mudar as datas de uma hospedagem.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 253 | 20526 | `hospRegistrarDaPlanilha` | alert | 'Só a Gestão, a Supervisão, a Consultora ou a Diretoria podem registrar as datas.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 254 | 20622 | `hospSalvarDatas` | alert | 'Sem permissão para mudar as datas.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 255 | 20626 | `hospSalvarDatas` | alert | 'Informe a data de ENTRADA da hospedagem.'); return; } | Não | Se o alerta for suprimido, o campo obrigatório continua vazio e a ação já parou (return) sem que a pessoa saiba o motivo. | Alta | zAlertao |
| 256 | 20627 | `hospSalvarDatas` | alert | 'A saída não pode ser antes da entrada. Confira as datas.'); return; } | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 257 | 20628 | `hospSalvarDatas` | confirm | 'Sem data de saída, '+(e.nome\|\|'o FILHOt')+' fica no Plantão todos os dias até alguém encerrar a hospedagem. / / Salvar assim mesmo?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — salvar datas de hospedagem" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 258 | 20635 | `hospSalvarDatas` | confirm | 'Esta hospedagem está marcada como '+(st==='cancelada'?'CANCELADA':'encerrada')+'. / / Reabrir '+(e.nome\|\|'a hospedagem')+' com as novas datas? Ele vo | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — salvar datas de hospedagem" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 259 | 20638 | `hospSalvarDatas` | alert | 'Sem conexão com o banco agora — tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 260 | 20649 | `hospSalvarDatas` | alert | 'Datas salvas. '+(e.nome\|\|'O FILHOt')+' fica de '+((typeof ciBRdata==='function')?ciBRdata(ent):ent)+' até '+(sai?((typeof ciBRdata==='function')?ciBR | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 261 | 20650 | `hospSalvarDatas` | alert | 'Erro ao salvar as datas: '+((err&&err.message)\|\|err)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 262 | 20657 | `novaHospedagem` | alert | 'Só a Gestão, a Supervisão, a Consultora ou a Diretoria podem lançar uma hospedagem.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 263 | 20666 | `novaPernoiteHoje` | alert | 'Só a Gestão, a Supervisão, a Consultora ou a Diretoria podem lançar uma pernoite.'); return; } | Não | Se o alerta for suprimido, a pessoa não entende por que nada aconteceu e insiste tentando de novo sem saber que falta permissão. | Alta | zAlertao |
| 264 | 20675 | `hospSalvarNova` | alert | 'Sem conexão com o banco agora — tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 265 | 20743 | `_hospGravarNova` | alert | p.nome+' hospedado(a) de '+((typeof ciBRdata==='function')?ciBRdata(ent):ent)+' até '+(sai?((typeof ciBRdata==='function')?ciBRdata(sai):sai):'data a  | Não | Se o alerta for suprimido, a pessoa não tem certeza se a ação terminou e pode repetir sem necessidade, ou seguir sem saber que já deu certo. | Alta | zAlertao |
| 266 | 20745 | `_hospGravarNova` | alert | 'Erro ao lançar a hospedagem: '+((err&&err.message)\|\|err)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 267 | 20754 | `hospAbrirFicha` | confirm | e.nome+' ainda não tem ficha no cadastro de peludinhos. / / Criar a ficha agora com os dados da hospedagem (nome, tutor e raça)? Depois é só completar | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "check-in/out — criar ficha a partir da hospedagem" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | zEscolha (botões na tela) |
| 268 | 21334 | `cfAvisarFaltaMed` | alert | 'Banco conectando… tente de novo em instantes.'); return; } | Não | Se o alerta for suprimido, a pessoa acha que gravou, mas estava sem internet — nada foi salvo no Firebase. | Alta | zAlertao |
| 269 | 21335 | `cfAvisarFaltaMed` | confirm | 'Avisar a Recepção que faltam '+c.deficit+' '+medUnidLbl(c.deficit,c.unidade)+' de "'+(m.nome\|\|'medicamento')+'" para cobrir a estadia?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "medicação — avisar falta de estoque" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques (padrão registrarDoseAgendada) |
| 270 | 21375 | `cfAddOcorrencia` | alert | 'Erro ao registrar: '+(e&&e.message\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Alta | zAlertao |
| 271 | 21379 | `cfRemoverOcorrencia` | confirm | 'Remover esta ocorrência?')) return; | Sim | Se o diálogo travar ou o navegador suprimir e devolver false sozinho, a ação de "medicação — remover ocorrência de conferência" NÃO acontece — a tela segue como se a pessoa tivesse cancelado, mesmo que ela quisesse confirmar (o mesmo padrão que travou o plantão dos 3 hóspedes no commit 260c544). | Alta | 2 toques |
| 272 | 21720 | `empAvisar` | alert | 'Erro ao registrar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |
| 273 | 21736 | `empAvisarDia` | alert | 'Erro ao registrar: '+((e&&e.message)\|\|e)); }); | Não | Isto roda DEPOIS de uma tentativa de salvar que falhou (.catch). Se o alerta for suprimido, a pessoa acha que salvou, mas o Firebase recusou — o dado fica sem registro e ninguém percebe. | Média | zAlertao |

## 3. Legenda de gravidade

- **Alta** — medicação, plantão, check-in/check-out, acerto/dinheiro, presença (critério do pedido) — mais os casos de dado crítico e irreversível mesmo fora dessa lista-exemplo (óbito, exclusão definitiva de cadastro): perder ou não ver o aviso tem consequência real e às vezes irreversível.
- **Média** — bloqueia uma gravação ou ação real (orçamento, cadastro, troca de dia, vínculo, painel da TV, reposição, ração, ocorrência) mas sem o mesmo risco imediato à saúde/dinheiro/presença do FILHOt.
- **Baixa** — só informativo: relatórios/downloads, validação trivial de campo, mensagem de sucesso, tela de rascunho não conectada ao banco.

## 4. Pares de `confirm()` seguidos (duplos) — o pior padrão

### 4.1 Já documentados no próprio código como corrigidos

Histórico já documentado no próprio código-fonte, e já corrigido — não é um duplo vivo hoje: o comentário em `_vMed` (linha aprox. 7026, "22/ago/2026 — ISTO TRAVOU O PLANTÃO DE 3 HÓSPEDES") registra que ali havia DOIS confirm() nativos em sequência (a checagem de identidade de quem assina o relatório de Toshi/Maya/Arthur). No celular, quando o navegador suprime diálogos, o confirm() devolve `false` sozinho e o código fazia `return` — o relatório do plantão inteiro se perdia. Hoje só resta 1 `confirm()` na função (linha ~7062) — precisa virar `zEscolha`/2-toques como o restante do padrão novo. O segundo caso já documentado é a própria `registrarDoseAgendada` (comentário na linha aprox. 6590): antes usava `confirm()` nativo para registrar a dose; hoje é o padrão-modelo (2 toques) — comentário deixado de propósito para não repetirem o erro.

### 4.2 Duplos genuínos ainda vivos hoje (auditoria encontrou)

- **cancelarPernoiteFicha — "CANCELAR a estadia...?" seguido de "Confirmação final: cancelar a estadia...?"** — linhas ~10407 e ~10408. Dois confirm() nativos em sequência para a MESMA ação (cancelar a estadia). Se o primeiro travar/for suprimido, já para ali; se o navegador suprimir e devolver false em ambos sem intervenção, o botão parece não fazer nada.
- **cancelarPernoiteFicha — "Tem certeza que quer deletar esse peludinho do Hotel?" seguido de "Confirmação final: deletar...?"** — linhas ~10431 e ~10432. Mesmo padrão de dupla confirmação nativa sequencial, para a ação de deletar do Hotel de hoje — é o pior padrão citado no pedido: dois confirm() um atrás do outro.
- **removerHospedeCard — confirm geral (cabeça+corpo) seguido de "CONFIRMAÇÃO FINAL" quando o FILHOt já está hospedado** — linhas ~10285 e ~10297 (condicional: só roda o 2º "if(est && ...)"). Quando "est" é verdadeiro (o FILHOt está hospedado), a pessoa precisa passar por DOIS confirm() nativos seguidos para remover o card — mesmo padrão de risco.

### 4.3 Pares descartados (mesma função, confirm próximos, mas NÃO são duplo em sequência)

- escolherHospede — dois confirm() de alergia em pontos de entrada diferentes (NÃO é duplo em sequência) — linhas ~10120 e ~10146. Descartado da lista de duplos: são dois call-sites distintos (um por caminho de lançamento), não dois confirm() um atrás do outro na mesma execução. Cada um, individualmente, já entra na tabela principal com o mesmo risco de qualquer confirm() isolado.
- inativarPeludinhoRapido — confirm de "está inativo, reativar?" e confirm de "é caso de PAUSA?" (NÃO é duplo) — linhas ~13071 e ~13082. Descartado: são ramos mutuamente exclusivos (um é o caminho de reativar quem já está inativo; o outro é o caminho de inativar quem está ativo). Nunca executam os dois em sequência.
- hospSalvarDatas — confirm de "sem data de saída, salvar assim mesmo?" e confirm de "reabrir hospedagem cancelada/encerrada?" (NÃO é duplo claro) — linhas ~20628 e ~20635. Condições diferentes (!sai vs. status cancelada/encerrada); PODEM coincidir na mesma chamada dependendo do caso (reabrir uma hospedagem cancelada E sem data de saída), o que tornaria a pessoa sujeita aos dois confirm() em sequência. Vale revisão manual — por ora tratado como risco, não como duplo confirmado.

## 5. Aparições dentro de comentário (não são código executável)

Ficam fora da contagem de 273 e da tabela principal — são texto histórico no próprio código explicando bugs já corrigidos ou avisando para não repetir o padrão errado.

| linha | função | tipo (palavra citada) | texto |
|---|---|---|---|
| 1760 | `(fora de função)` | prompt | prompt() que só serviam para HOJE — a recepção precisa agendar com antecedência |
| 4845 | `renderHospAlergiaBlock` | prompt | // Bug histórico: adicionarPernoite/adicionarHospede pediam nome+tutor por prompt() cru, sem |
| 6590 | `registrarDoseAgendada` | confirm | // Confirmação na PRÓPRIA tela — NUNCA confirm() nativo. No celular o navegador pode suprimir |
| 7026 | `_vMed` | confirm | // Aqui havia DOIS confirm() nativos. Toshi, Maya e Arthur já tinham se hospedado antes, |
| 10006 | `hospAvisoFalha` | prompt | // ===== Adicionar hóspede/pernoite — busca no cadastro-mestre, NUNCA prompt() cru ===== |
| 10007 | `hospAvisoFalha` | prompt | // Antes: 2 prompt()s pediam nome e tutor soltos, sem ligação com o cadastro-mestre. Resultado: |
| 10166 | `escolherHospede` | prompt | // prompt() em sequência). Agora tem data, número de noites e o jantar num formulário só. |
| 12041 | `corPel` | alert | // O padrão antigo era `alert('Falta a foto de: Pele'); return;` — a pessoa fecha o aviso e |
| 19596 | `ciPodeSairDoCheckin` | alert | // O alert() do celular é uma caixinha cinza que some com um toque — duas estadias |

## 6. Ordem de correção — lotes de até 8

Ordenado primeiro por **gravidade Alta + no caminho de gravar** (risco real de travar uma gravação crítica), depois Alta sem gravar (risco de silêncio em tema crítico), depois Média com gravar, Média sem gravar, e por último Baixa. Dentro de cada faixa, agrupado por função.

### Lote 1 (8 itens)

- `_vMed` linha 7062 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela) — igual ao aviso do commit 260c544
- `acertoRecalcular` linha 9150 (confirm, grava=Sim, gravidade=Alta) → 2 toques (padrão registrarDoseAgendada)
- `cancelarHospedeManual` linha 10243 (confirm, grava=Sim, gravidade=Alta) → 2 toques + zAlertao
- `cancelarPernoiteFicha` linha 10407 (confirm, grava=Sim, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10408 (confirm, grava=Sim, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10421 (confirm, grava=Sim, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10431 (confirm, grava=Sim, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10432 (confirm, grava=Sim, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)

**Provar no harness:** Para cada função da lista (`_vMed`, `acertoRecalcular`, `cancelarHospedeManual`, `cancelarPernoiteFicha`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 2 (8 itens)

- `cfAvisarFaltaMed` linha 21335 (confirm, grava=Sim, gravidade=Alta) → 2 toques (padrão registrarDoseAgendada)
- `cfRemoverOcorrencia` linha 21379 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `ciCriarNovoHospede` linha 18943 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)
- `ciSalvar` linha 19747 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela
- `ciSalvar` linha 19749 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela
- `confirmarRecebimento` linha 6938 (confirm, grava=Sim, gravidade=Alta) → 2 toques (o mesmo bug do commit 260c544 nasceu aqui)
- `escolherHospede` linha 10120 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)
- `escolherHospede` linha 10146 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)

**Provar no harness:** Para cada função da lista (`cfAvisarFaltaMed`, `cfRemoverOcorrencia`, `ciCriarNovoHospede`, `ciSalvar`, `confirmarRecebimento`, `escolherHospede`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 3 (8 itens)

- `excluirCadastroPel` linha 13688 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela (mantém a confirmação por nome digitado)
- `excluirCadastroPel` linha 13690 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela (mantém a confirmação por nome digitado)
- `fecharTurnoEAvisar` linha 7240 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)
- `hospAbrirFicha` linha 20754 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)
- `hospConfirmarBaixa` linha 20455 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `hospSalvarDatas` linha 20628 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `hospSalvarDatas` linha 20635 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `hospTrazerDeVolta` linha 10382 (confirm, grava=Sim, gravidade=Alta) → 2 toques

**Provar no harness:** Para cada função da lista (`excluirCadastroPel`, `fecharTurnoEAvisar`, `hospAbrirFicha`, `hospConfirmarBaixa`, `hospSalvarDatas`, `hospTrazerDeVolta`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 4 (8 itens)

- `inativarPeludinhoRapido` linha 13071 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13082 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13086 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `magRemoverItem` linha 5697 (confirm, grava=Sim, gravidade=Alta) → 2 toques (padrão registrarDoseAgendada)
- `orcApagar` linha 8088 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `orcCancelar` linha 8115 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `orcCancelar` linha 8118 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `orcCancelar` linha 8120 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques

**Provar no harness:** Para cada função da lista (`inativarPeludinhoRapido`, `magRemoverItem`, `orcApagar`, `orcCancelar`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 5 (8 itens)

- `orcSalvarEdicao` linha 7946 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `orcSalvarEdicao` linha 7951 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `orcSalvarEdicao` linha 7953 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `pessoaDoTurno` linha 16991 (prompt, grava=Sim (indireto), gravidade=Alta) → campo de texto na tela
- `plantConfirmar` linha 8931 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `plantConfirmarNova` linha 8935 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela
- `plantNaoEhPlantonista` linha 8946 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `plantVoltarAContar` linha 8958 (confirm, grava=Sim, gravidade=Alta) → 2 toques

**Provar no harness:** Para cada função da lista (`orcSalvarEdicao`, `pessoaDoTurno`, `plantConfirmar`, `plantConfirmarNova`, `plantNaoEhPlantonista`, `plantVoltarAContar`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 6 (8 itens)

- `reativarPeludinho` linha 13165 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `registrarObito` linha 13023 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13031 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13046 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + zEscolha
- `removerHospedeCard` linha 10285 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `removerHospedeCard` linha 10287 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `removerHospedeCard` linha 10297 (confirm, grava=Sim, gravidade=Alta) → campo de texto na tela + 2 toques
- `tocarEstoqueAcabando` linha 5985 (confirm, grava=Sim, gravidade=Alta) → 2 toques (padrão registrarDoseAgendada)

**Provar no harness:** Para cada função da lista (`reativarPeludinho`, `registrarObito`, `removerHospedeCard`, `tocarEstoqueAcabando`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 7 (8 itens)

- `turnoTrocar` linha 17071 (confirm, grava=Sim, gravidade=Alta) → zEscolha (botões na tela)
- `vetReativarMed` linha 11701 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela
- `vetRemoverReavaliacao` linha 11484 (confirm, grava=Sim, gravidade=Alta) → 2 toques
- `vetSuspenderMed` linha 11688 (prompt, grava=Sim, gravidade=Alta) → campo de texto na tela
- `_hospGravarNova` linha 20743 (alert, grava=Não, gravidade=Alta) → zAlertao
- `_hospGravarNova` linha 20745 (alert, grava=Não, gravidade=Alta) → zAlertao
- `acertoMarcar` linha 9166 (alert, grava=Não, gravidade=Alta) → zAlertao
- `acertoMarcar` linha 9206 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para cada função da lista (`turnoTrocar`, `vetReativarMed`, `vetRemoverReavaliacao`, `vetSuspenderMed`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos. Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 8 (8 itens)

- `acertoRecalcular` linha 9162 (alert, grava=Não, gravidade=Alta) → zAlertao
- `cancelarHospedeManual` linha 10242 (alert, grava=Não, gravidade=Alta) → 2 toques + zAlertao
- `cancelarHospedeManual` linha 10251 (alert, grava=Não, gravidade=Alta) → 2 toques + zAlertao
- `cancelarPernoiteFicha` linha 10399 (alert, grava=Não, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10409 (alert, grava=Não, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10414 (alert, grava=Não, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10428 (alert, grava=Não, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)
- `cancelarPernoiteFicha` linha 10441 (alert, grava=Não, gravidade=Alta) → 2 toques (dupla confirmação já existe — trocar por zEscolha)

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 9 (8 itens)

- `cfAddOcorrencia` linha 21375 (alert, grava=Não, gravidade=Alta) → zAlertao
- `cfAvisarFaltaMed` linha 21334 (alert, grava=Não, gravidade=Alta) → zAlertao
- `ciAddMedBtn` linha 19203 (alert, grava=Não, gravidade=Alta) → zAlertao
- `ciPodeSairDoCheckin` linha 19593 (confirm, grava=Não* (decide se sai sem salvar — ver nota), gravidade=Alta) → zEscolha (botões na tela) — risco de perder o check-in inteiro
- `escolherAvulso` linha 13992 (alert, grava=Não, gravidade=Alta) → zAlertao
- `escolherAvulso` linha 14002 (alert, grava=Não, gravidade=Alta) → zAlertao
- `escolherHospede` linha 10135 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)
- `escolherHospede` linha 10155 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)

**Provar no harness:** Para cada função da lista (`ciPodeSairDoCheckin`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos. Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 10 (8 itens)

- `excluirCadastroPel` linha 13684 (alert, grava=Não, gravidade=Alta) → zAlertao
- `excluirCadastroPel` linha 13686 (alert, grava=Não, gravidade=Alta) → zAlertao
- `excluirCadastroPel` linha 13689 (alert, grava=Não, gravidade=Alta) → zAlertao
- `excluirCadastroPel` linha 13691 (alert, grava=Não, gravidade=Alta) → zAlertao
- `excluirCadastroPel` linha 13707 (alert, grava=Não, gravidade=Alta) → zAlertao
- `excluirCadastroPel` linha 13711 (alert, grava=Não, gravidade=Alta) → zAlertao
- `fecharTurnoEAvisar` linha 7237 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)
- `fecharTurnoEAvisar` linha 7257 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 11 (8 itens)

- `fecharTurnoEAvisar` linha 7258 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)
- `fecharTurnoEAvisar` linha 7262 (alert, grava=Não, gravidade=Alta) → zEscolha (botões na tela)
- `hospConfirmarBaixa` linha 20443 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospConfirmarBaixa` linha 20453 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospConfirmarBaixa` linha 20465 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospDarBaixa` linha 20437 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospEditarDatas` linha 20518 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospRegistrarDaPlanilha` linha 20526 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 12 (8 itens)

- `hospSalvarDatas` linha 20622 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarDatas` linha 20626 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarDatas` linha 20627 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarDatas` linha 20638 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarDatas` linha 20649 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarDatas` linha 20650 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospSalvarNova` linha 20675 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospTrazerDeVolta` linha 10380 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 13 (8 itens)

- `hospTrazerDeVolta` linha 10384 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospTrazerDeVolta` linha 10394 (alert, grava=Não, gravidade=Alta) → zAlertao
- `hospTrazerDeVolta` linha 10395 (alert, grava=Não, gravidade=Alta) → zAlertao
- `inativarPeludinhoRapido` linha 13062 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13066 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13075 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13090 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `inativarPeludinhoRapido` linha 13095 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 14 (8 itens)

- `magRemoverItem` linha 5695 (alert, grava=Não, gravidade=Alta) → zAlertao
- `magRemoverItem` linha 5696 (alert, grava=Não, gravidade=Alta) → zAlertao
- `novaHospedagem` linha 20657 (alert, grava=Não, gravidade=Alta) → zAlertao
- `novaPernoiteHoje` linha 20666 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcCancelar` linha 8119 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcCancelar` linha 8121 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcCancelar` linha 8123 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcCancelar` linha 8124 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 15 (8 itens)

- `orcCancelar` linha 8138 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcSalvarEdicao` linha 7940 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcSalvarEdicao` linha 7952 (alert, grava=Não, gravidade=Alta) → zAlertao
- `orcSalvarEdicao` linha 7955 (alert, grava=Não, gravidade=Alta) → zAlertao
- `pessoaDoTurno` linha 16996 (alert, grava=Não, gravidade=Alta) → zAlertao
- `reativarPeludinho` linha 13162 (alert, grava=Não, gravidade=Alta) → zAlertao
- `reativarPeludinho` linha 13173 (alert, grava=Não, gravidade=Alta) → zAlertao
- `registrarDoseAgendadaGlobal` linha 6638 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 16 (8 itens)

- `registrarObito` linha 13016 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13019 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13037 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13039 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13040 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `registrarObito` linha 13053 (alert, grava=Não, gravidade=Alta) → campo de texto na tela + zEscolha
- `removerHospedeCard` linha 10262 (alert, grava=Não, gravidade=Alta) → zAlertao
- `removerHospedeCard` linha 10264 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 17 (8 itens)

- `removerHospedeCard` linha 10293 (alert, grava=Não, gravidade=Alta) → zAlertao
- `removerHospedeCard` linha 10303 (alert, grava=Não, gravidade=Alta) → zAlertao
- `removerHospedeCard` linha 10314 (alert, grava=Não, gravidade=Alta) → zAlertao
- `removerHospedeCard` linha 10317 (alert, grava=Não, gravidade=Alta) → zAlertao
- `removerHospedeCard` linha 10324 (alert, grava=Não, gravidade=Alta) → zAlertao
- `salvarPernAgendado` linha 10217 (alert, grava=Não, gravidade=Alta) → zAlertao
- `salvarPernAgendado` linha 10227 (alert, grava=Não, gravidade=Alta) → zAlertao
- `salvarPernAgendado` linha 10230 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 18 (8 itens)

- `tocarEstoqueAcabando` linha 5986 (alert, grava=Não, gravidade=Alta) → zAlertao
- `trocarPessoaDoTurno` linha 17000 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetAbrirAlterarMed` linha 11621 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetAbrirNovaMed` linha 11614 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetCienteFimMed` linha 12004 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetCienteFimMed` linha 12013 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetReativarMed` linha 11702 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetReativarMed` linha 11709 (alert, grava=Não, gravidade=Alta) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 19 (8 itens)

- `vetRemoverReavaliacao` linha 11482 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetRemoverReavaliacao` linha 11491 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetSuspenderMed` linha 11689 (alert, grava=Não, gravidade=Alta) → zAlertao
- `vetSuspenderMed` linha 11696 (alert, grava=Não, gravidade=Alta) → zAlertao
- `acrescentarAtividade` linha 14070 (prompt, grava=Sim, gravidade=Baixa) → campo de texto na tela
- `autorizarAparelho` linha 9581 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela
- `ciExcluirPertBanco` linha 19327 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `ciQuemRecebeu` linha 19843 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela

**Provar no harness:** Para cada função da lista (`acrescentarAtividade`, `autorizarAparelho`, `ciExcluirPertBanco`, `ciQuemRecebeu`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos. Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 20 (8 itens)

- `ciQuemRecebeu` linha 19844 (confirm, grava=Sim, gravidade=Média) → campo de texto na tela
- `ciRenomearPertBanco` linha 19314 (prompt, grava=Sim, gravidade=Baixa) → campo de texto na tela
- `confirmarRenovacao` linha 10949 (confirm, grava=Sim, gravidade=Média) → zEscolha (botões na tela)
- `criarAluno` linha 13662 (confirm, grava=Sim, gravidade=Média) → zEscolha (botões na tela)
- `dashApagarPonte` linha 17578 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `dashRemover` linha 17723 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `dispensarAvisoBarrado` linha 9330 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `eaMarcarTempo` linha 16050 (confirm, grava=Sim, gravidade=Média) → 2 toques

**Provar no harness:** Para cada função da lista (`ciQuemRecebeu`, `ciRenomearPertBanco`, `confirmarRenovacao`, `criarAluno`, `dashApagarPonte`, `dashRemover`, `dispensarAvisoBarrado`, `eaMarcarTempo`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 21 (8 itens)

- `irmDesfazer` linha 15373 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `liberarAparelhoDaLista` linha 9377 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela
- `ocorrReabrir` linha 6356 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `onRacaPel` linha 12242 (confirm, grava=Sim, gravidade=Média) → zAlertao / zEscolha
- `ptSalvarSaida` linha 15703 (confirm, grava=Sim, gravidade=Média) → 2 toques + zAlertao
- `removerAtividade` linha 14071 (confirm, grava=Sim, gravidade=Baixa) → 2 toques
- `removerPessoa` linha 9547 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `repEstornar` linha 4299 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela

**Provar no harness:** Para cada função da lista (`irmDesfazer`, `liberarAparelhoDaLista`, `ocorrReabrir`, `onRacaPel`, `ptSalvarSaida`, `removerAtividade`, `removerPessoa`, `repEstornar`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 22 (8 itens)

- `repUsar` linha 4289 (confirm, grava=Sim, gravidade=Média) → 2 toques + campo de texto na tela
- `repUsar` linha 4290 (prompt, grava=Sim, gravidade=Média) → 2 toques + campo de texto na tela
- `setRenovInicio` linha 10925 (confirm, grava=Sim, gravidade=Média) → zEscolha (botões na tela)
- `trocaAbrirLancar` linha 4443 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela
- `trocaAbrirLancar` linha 4454 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela
- `trocaAbrirLancar` linha 4462 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela
- `trocaCancelar` linha 4385 (confirm, grava=Sim, gravidade=Média) → 2 toques
- `trocaDecidir` linha 4372 (prompt, grava=Sim, gravidade=Média) → campo de texto na tela

**Provar no harness:** Para cada função da lista (`repUsar`, `setRenovInicio`, `trocaAbrirLancar`, `trocaCancelar`, `trocaDecidir`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos.

### Lote 23 (8 itens)

- `(fora de função)` linha 1932 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `_acharPelPlano` linha 10732 (alert, grava=Não, gravidade=Média) → zAlertao
- `algResponder` linha 16528 (alert, grava=Não, gravidade=Média) → zAlertao
- `ativEncerrar` linha 17137 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `avisoAddEntrada` linha 6147 (alert, grava=Não, gravidade=Média) → zAlertao
- `avisoEscolhaPlano` linha 10904 (alert, grava=Não, gravidade=Média) → zAlertao
- `avisoRacaoAddEntrada` linha 6412 (alert, grava=Não, gravidade=Média) → zAlertao
- `avisoRacaoResolver` linha 6421 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 24 (8 itens)

- `avisoResolver` linha 6156 (alert, grava=Não, gravidade=Média) → zAlertao
- `baixarGradeAlmoco` linha 17779 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `baixarGradeAlmoco` linha 17789 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `baixarPrevencao` linha 12721 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `baixarPrevencao` linha 12755 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `baixarSemMicrochip` linha 17755 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `baixarSemMicrochip` linha 17775 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `chamadoResponder` linha 6042 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 25 (8 itens)

- `chamadoResponder` linha 6043 (alert, grava=Não, gravidade=Média) → zAlertao
- `chamadoResponder` linha 6057 (alert, grava=Não, gravidade=Média) → zAlertao
- `ciExcluirPertBanco` linha 19325 (alert, grava=Não, gravidade=Média) → zAlertao
- `ciRenomearPertBanco` linha 19312 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `ciTogglePertManage` linha 19274 (alert, grava=Não, gravidade=Média) → zAlertao
- `ckSalvar` linha 15137 (alert, grava=Não, gravidade=Média) → zAlertao
- `ckVideo` linha 14727 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `confirmarRenovacao` linha 10942 (alert, grava=Não, gravidade=Média) → zEscolha (botões na tela)

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 26 (8 itens)

- `copiarPrevencao` linha 12713 (alert, grava=Não, gravidade=Baixa) → zAlertao com o texto pronto para copiar
- `copiarPrevencao` linha 12715 (alert, grava=Não, gravidade=Baixa) → zAlertao com o texto pronto para copiar
- `copiarPrevencao` linha 12716 (prompt, grava=Não, gravidade=Baixa) → zAlertao com o texto pronto para copiar
- `copiarPrevencao` linha 12717 (prompt, grava=Não, gravidade=Baixa) → zAlertao com o texto pronto para copiar
- `copiarTexto` linha 7156 (alert, grava=Não, gravidade=Baixa) → zAlertao (op.ok:true)
- `dashApagarPonte` linha 17577 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashLancar` linha 17662 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashLancar` linha 17665 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para cada função da lista (`copiarPrevencao`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos. Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 27 (8 itens)

- `dashLancar` linha 17676 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashReenviar` linha 17706 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashReenviar` linha 17711 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashReenviar` linha 17714 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashReenviar` linha 17717 (alert, grava=Não, gravidade=Média) → zAlertao
- `dashRemover` linha 17729 (alert, grava=Não, gravidade=Média) → zAlertao
- `empAvisar` linha 21720 (alert, grava=Não, gravidade=Média) → zAlertao
- `empAvisarDia` linha 21736 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 28 (8 itens)

- `gateCadastro` linha 12170 (alert, grava=Não, gravidade=Média) → zAlertao
- `inserirAluno` linha 13575 (alert, grava=Não, gravidade=Média) → zAlertao
- `irmDesfazer` linha 15377 (alert, grava=Não, gravidade=Média) → zAlertao
- `irmSalvar` linha 15358 (alert, grava=Não, gravidade=Média) → zAlertao
- `irmSalvar` linha 15369 (alert, grava=Não, gravidade=Média) → zAlertao
- `liberarAparelhoDaLista` linha 9385 (alert, grava=Não, gravidade=Média) → zAlertao
- `marcarAlmoco` linha 17357 (alert, grava=Não, gravidade=Média) → zAlertao
- `ocorrAvisarTutor` linha 6347 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 29 (8 itens)

- `ocorrAvisarTutor` linha 6352 (alert, grava=Não, gravidade=Média) → zAlertao
- `ocorrResolver` linha 6326 (alert, grava=Não, gravidade=Média) → zAlertao
- `ocorrResolver` linha 6328 (alert, grava=Não, gravidade=Média) → zAlertao
- `ocorrResolver` linha 6341 (alert, grava=Não, gravidade=Média) → zAlertao
- `onRacaPel` linha 12234 (alert, grava=Não, gravidade=Média) → zAlertao / zEscolha
- `orcAddAvulso` linha 7484 (alert, grava=Não, gravidade=Média) → zAlertao
- `orcAddAvulso` linha 7485 (alert, grava=Não, gravidade=Média) → zAlertao
- `orcAddAvulso` linha 7487 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 30 (8 itens)

- `orcAddFeriado` linha 8373 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `orcMudarDatas` linha 7839 (alert, grava=Não, gravidade=Média) → zAlertao
- `prevLancar` linha 12648 (alert, grava=Não, gravidade=Média) → zAlertao
- `prevLancar` linha 12649 (alert, grava=Não, gravidade=Média) → zAlertao
- `ptAddHora` linha 15619 (alert, grava=Não, gravidade=Média) → zAlertao
- `ptAvisarRecepcao` linha 15694 (alert, grava=Não, gravidade=Média) → zAlertao
- `ptSalvar` linha 15722 (alert, grava=Não, gravidade=Média) → zAlertao
- `ptSalvar` linha 15730 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 31 (8 itens)

- `ptSalvar` linha 15756 (alert, grava=Não, gravidade=Média) → zAlertao
- `ptSalvarSaida` linha 15711 (alert, grava=Não, gravidade=Média) → 2 toques + zAlertao
- `ptSalvarSaida` linha 15717 (alert, grava=Não, gravidade=Média) → 2 toques + zAlertao
- `reemitirFichaAtual` linha 20268 (alert, grava=Não, gravidade=Média) → zAlertao
- `relBaixarXLS` linha 17795 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relBaixarXLS` linha 17804 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relCheckinHoje` linha 17843 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relCheckinHoje` linha 17855 (alert, grava=Não, gravidade=Baixa) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 32 (8 itens)

- `relCheckinHoje` linha 17861 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relOrcamentos` linha 17820 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relPertencesBranco` linha 17897 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relPertencesBrancoEscolher` linha 17906 (prompt, grava=Não, gravidade=Baixa) → botões de dia na tela em vez de prompt()
- `relPertencesBrancoEscolher` linha 17910 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relPertencesHoje` linha 17865 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relPertencesHoje` linha 17880 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `relPertencesHoje` linha 17886 (alert, grava=Não, gravidade=Baixa) → zAlertao

**Provar no harness:** Para cada função da lista (`relPertencesBrancoEscolher`): um check no estilo "função NÃO usa confirm()/prompt() nativo" — grep no corpo da função por `confirm(` / `prompt(` fora de comentário, igual ao harness já faz para `registrarDoseAgendada`. Para as trocadas pelo padrão de 2 toques: check "1º toque não grava, 2º toque grava" — simular clique 1 e checar que NÃO houve escrita no `DB.ref` mockado; simular clique 2 e checar que a escrita aconteceu com os dados certos. Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 33 (8 itens)

- `repAbrirLancar` linha 4159 (alert, grava=Não, gravidade=Média) → zAlertao
- `repEstornar` linha 4298 (alert, grava=Não, gravidade=Média) → zAlertao
- `repEstornar` linha 4304 (alert, grava=Não, gravidade=Média) → zAlertao
- `repUsar` linha 4286 (alert, grava=Não, gravidade=Média) → zAlertao
- `repUsar` linha 4288 (alert, grava=Não, gravidade=Média) → zAlertao
- `repUsar` linha 4294 (alert, grava=Não, gravidade=Média) → zAlertao
- `salvarFoto` linha 5252 (alert, grava=Não, gravidade=Média) → zAlertao
- `salvarFotoPel` linha 12962 (alert, grava=Não, gravidade=Baixa) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 34 (8 itens)

- `setAlmStep` linha 14199 (alert, grava=Não, gravidade=Baixa) → zAlertao
- `trocaAbrirLancar` linha 4442 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaAbrirLancar` linha 4446 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaAbrirLancar` linha 4448 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaAbrirLancar` linha 4457 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaAbrirLancar` linha 4464 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaAbrirLancar` linha 4467 (alert, grava=Não, gravidade=Média) → zAlertao
- `trocaDecidir` linha 4369 (alert, grava=Não, gravidade=Média) → zAlertao

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).

### Lote 35 (1 item)

- `zFalta` linha 12095 (alert, grava=Não, gravidade=Média) → zAlertao (já é o padrão recomendado no comentário da própria função)

**Provar no harness:** Para as trocadas por `zAlertao`: check que o elemento `#zAlertaoBox` aparece na tela com o texto esperado, e que só fecha no clique do botão "Entendi" (não há mais `window.alert` chamado).
