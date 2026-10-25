# Story dashboard-marcia129 — Márcia Gestão

Status: desenho aprovado em 25/10; integração final e publicação autorizadas por Adriana.

Solicitação: reunir agenda completa de avaliações, tarefas do dia, faltas, novatos, alimentação, questões do check-in, tempos da equipe e quantidades no dashboard da Márcia. Entrada: Início → Márcia Gestão. Uso principal em celular; copiar o estilo existente, sem alterar o Design System.

## Escopo

- Rota aditiva `gestaomarcia` com a capacidade existente `painel-operacao`; painel anterior preservado.
- Calendário com o padrão visual dos Lançamentos e seleção independente.
- Agenda somente de avaliações, com hora, FILHOt, raça, tutor e conferência por check de vacina, vermífugo e proteção contra pulgas/carrapatos, sem datas visíveis ou exigidas. Informações relevantes da família no mesmo cartão, que abre e fecha.
- Consultoras agendam em Recepção → Day Care → Lançamentos do dia → Avaliação (Márcia), com ou sem ficha. Tutor, checks e notas ficam no mesmo registro original em `det.avaliacao129`; sem criar cadastro ou uma segunda agenda. Selecionar a ficha abre a conferência antes de gravar. A confirmação posterior da Gestão prevalece sobre o agendamento original.
- Conferência da avaliação em metadados próprios; nenhuma alteração de ficha clínica, prescrição, lançamento original, nome, raça ou horário.
- Tarefas derivadas do dia com check/desfazer, confirmação de gravação, autoria e proteção de concorrência. Marcar uma tarefa não registra contato, aplicação, presença ou cobrança em outra fonte.
- Contagens sem duplicação e sem converter fonte ausente em zero; hóspedes separados do total do Day Care.
- Seções compactas de faltas, novatos, alimentação separada em Day Care e hóspedes, saúde e tempos. Vermelho para faltas/alimentação dos hóspedes; amarelo para alimentação do Day Care; azul para novatos, usando tokens de status existentes. Reaproveitar regras e dados operacionais existentes.

## Contratos

Código em `auaulandia/marcia129/`: apresentação (`painel.js`, `painel.css`), dados (`dados.js`) e ligação ao app (`app.js`). A apresentação recebe snapshots; não chama banco nem envia mensagens.

As fontes são limitadas ao dia selecionado. Cadastro, estadias e reposições usam caches existentes. Observadores próprios são removidos ao sair, mudar data ou sessão. Não há polling nem nova carga ampla de fotos, auditoria, relatórios ou medicação.

Novos metadados diários: `daycare/painel-tarefas/{dia}/{id}` e `daycare/avaliacoes-gestao/{dia}/{codigoOrigem}`. Escrita somente por ação humana, com permissão/autoria conferidas, transação e revisão. Nenhuma regra do Firebase é alterada por esta story. Falha de permissão ou gravação permanece visível sem confirmação falsa.

## Aceite

- Fonte incompleta, falha e lista vazia distintas.
- Ausências conforme regra existente das 11h30 e revisão das 15h; refeição/chegada posterior não viram falta.
- Novos e adaptação pelos critérios existentes; alimentação distingue espera do segundo horário; duração só com início/fim válidos.
- Datas, nomes longos, obrigatório ausente, escape de HTML, concorrência, callbacks antigos e troca de pessoa testados com dados sintéticos.
- Conferência visual a 440px, 390px e desktop; accordions, foco e toque adequados.
- Nenhum acesso de desenvolvimento ao Firebase real, envio de mensagem, alteração da Zelozinha ou edição de área protegida do check-in.
- Mostrar prévia antes da publicação. Adriana confirmou em 25/10: por enquanto, somente avaliações na agenda.
