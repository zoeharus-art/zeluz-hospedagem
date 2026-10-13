# Histórico de hospedagens

Versão: `2026-10-13-06`. Consulta das quatro etapas, integrada aos componentes e painéis existentes. A publicação foi autorizada pela responsável pelo projeto.

## Acesso da equipe

Gestão e consultoras acessam **Central Zêluz → AuAulândia → Histórico de hospedagens**. Os painéis de consultoras e da gestora também oferecem um atalho. O nome da rota interna continua `historicocheckins`, para preservar a integração existente.

1. Buscar pelo animal ou tutor; opcionalmente filtrar período e situação da conferência.
2. Abrir a estadia desejada, conferindo as datas para não misturar hospedagens.
3. Consultar **Check-in**, **Conferência do check-in**, **Check-out** e **Conferência do check-out**, com responsáveis e horários disponíveis.
4. Expandir os detalhes de cada conferência para ler os itens e observações salvos.
5. Tocar em **Ver fotos da conferência do check-in** e ampliar uma foto; baixar os PDFs pelos botões da estadia.

## Fidelidade dos registros

- O histórico consulta o conjunto completo de estadias; não depende da lista operacional recente.
- Dados ausentes aparecem como não registrados. Falha de leitura ou exibição aparece como erro, sem ser apresentada como ausência de registros.
- O responsável pela entrada, quem concluiu a conferência, quem montou a bolsa e quem confirmou a saída são campos distintos. Uma assinatura de tutor nunca é atribuída automaticamente à pessoa que operou o sistema.
- O status finalizada, isoladamente, não comprova que exista um check-out salvo. O PDF de saída exige o objeto de checkout; a preparação da bolsa sozinha não o substitui.
- Uma marcação de checklist indica o estado salvo da conferência. Ela não prova, por si só, devolução física de um item consumido ou com observações.
- As fotos exibidas pertencem à conferência selecionada e são lidas sob demanda. A melhoria não cria captura de fotos de saída nem recupera fotos removidas.
- Os PDFs são reemissões dos dados salvos, com a data de geração separada das datas históricas. Não são os arquivos originais emitidos no dia.
- Retirada sem tutor é explicitada. A assinatura da entrada não é reaproveitada como assinatura da saída.

## PDF de saída na recepção

Antes de salvar a conferência final, o botão de PDF gera um rascunho identificado. Depois de salvar, gera o comprovante com os dados e a assinatura da saída. O botão de envio oferece o arquivo PDF pelo compartilhamento do aparelho; quando esse recurso não está disponível, baixa o arquivo para anexação manual. Abrir o compartilhamento não comprova entrega ao tutor.

Fotos continuam somente na conferência da entrada. A pontuação existente da montagem da bolsa permanece; esta versão não cria pesos novos para a gamificação mensal das quatro etapas.

## Implementação e limites

A consulta reutiliza os adaptadores e o gerador PDF nativos, sem nova biblioteca no produto, sem novo listener permanente e sem escrita nos registros históricos. Os módulos `historico-checkins.js`, `.css` e `historico-checkins-pdf.js` mantêm os nomes anteriores para reduzir mudanças de integração. As APIs puras de seções são compartilhadas pela tela e pelos documentos. O salvamento operacional da saída preserva a estadia selecionada no início da operação mesmo se a pessoa abrir outra ficha enquanto a resposta do banco está pendente.

A capacidade `historico-checkins` atende gestão, diretoria e consultoras. A interface e os adaptadores verificam sessão e papel; isso não equivale a uma auditoria integral das regras de segurança do banco. Monitores e plantonistas mantêm os fluxos operacionais existentes.

Esta entrega não cria uma trilha imutável de todas as alterações, autores por item onde isso não era salvo, fotografias inexistentes ou redesenho integral dos painéis.

## Publicação controlada

Base: commit `7032d34aa522ee875f12a494b5ba8a8e4cf3f0f5`, versão pública de referência `2026-10-09-29`.

Usar apenas os arquivos autorizados pelo manifesto desta entrega. Conferir a fonte remota antes da publicação; se tiver mudado, reintegrar a melhoria e repetir os testes afetados. A cópia antiga `app` é um protótipo obsoleto e não deve ser publicada. Não incluir fixtures, fotos, PDFs reais, logs ou capturas nos arquivos públicos.

A atualização de sinalizador de versão, quando aplicável, deve acompanhar a publicação autorizada. Guardar a versão anterior para reversão; os registros de hóspedes não precisam de migração para esta consulta.

## Verificação

Os testes dedicados cobrem interface, autorização dos adaptadores, seleção da estadia, checklist, fotos, falhas e PDFs. O teste de navegação usa o app completo com dados locais e emulador, viewport de celular em Chromium; não representa validação em Safari físico nem teste de autenticação por senha. A comparação ampla usa snapshot datado e mantém falhas preexistentes documentadas nas evidências locais da entrega.

## Correção de confiabilidade — 06

O preparo da bolsa e o fechamento da conferência de entrada preservam a estadia e a autoria selecionadas no início do salvamento. Uma resposta atrasada não altera nem fecha uma ficha que foi aberta depois. As marcas enviadas da bolsa são uma cópia do momento da confirmação. Toques repetidos na mesma confirmação aguardam a gravação já em andamento; outra hospedagem pode ser atendida normalmente. Uma falha libera a tentativa seguinte. Regras de conferência, fotos, assinatura, pontuação e visual permanecem iguais.
