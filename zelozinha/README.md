# Zelozinha

O serviço que manda, por WhatsApp, a mensagem de cuidados às famílias depois do check-in do corpo do FILHOt. Esta pasta é onde ele vai morar dentro do projeto da AuAulândia. O manual do projeto inteiro é o `AGENTS.md`, na raiz: leia-o antes deste.

Esta é a primeira versão do README (Story 6.112, Fase 2A). O que depende do código ou da VPS está marcado «a confirmar pela Codex» e será completado quando o código chegar. Tudo o que está dito aqui da VPS vem do handoff da Codex de 20/10/2026. O Claude, que escreveu esta primeira versão, não entra na VPS e não o conferiu; só a Codex confirma.

## Estado de hoje (21/10/2026)

1. A pasta `zelozinha/` ainda não tem o código do serviço. A Codex vai trazê-lo por pull request (Fase 1 da Story 6.112). Hoje a pasta tem só este README e as provas do projeto (`zelozinha/provas/`).
2. A VPS ainda roda a cópia da Codex. Mudar o projeto ainda não muda o que roda: nenhum Merge troca a Zelozinha que está no ar.
3. Esta seção muda quando o código entrar no projeto e quando a VPS passar a rodar a partir dele.

## O que ela faz

- Depois de um check-in do corpo válido do dia, prepara e manda **uma** mensagem por família com os cuidados elegíveis daquele dia.
- Antes de preparar o contato, confere de novo a presença atual e a ausência de checkout posterior.
- Seleciona os cuidados permitidos e as datas reais da fonte. Uma data nova não libera um ciclo que já foi contatado.
- Agrupa os cuidados de um mesmo FILHOt em um contato. Para irmãos vinculados, espera os check-ins esperados e combina a comunicação familiar conforme a regra.
- Vacina só entra na mensagem quando a fonte do dia confirma a presença da veterinária. A agenda usual dela não basta, e fonte ausente não quer dizer que ela faltou: quer dizer que não há base segura para oferecer vacina.
- O texto vem do módulo `mensagem-unica41`, com os textos aprovados pela Adriana.
- Guarda o próprio estado (fila, ledger, recibos) e o painel diário no namespace de piloto do Firebase.

## O que ela não faz

- Não interpreta a resposta do tutor. `respostasAutomaticas: false`.
- Não autoriza nada. `autorizacoesAutomaticas: false`.
- Não registra aplicação de cuidado nem cobrança. Quem responde, autoriza, aplica e registra são pessoas.
- Não manda mensagem às famílias dos FILHOts que têm `comunicacaoZelozinha.modo: humano` no cadastro: a equipe fala com elas.
- Não manda sem check-in do corpo e não manda depois do checkout.
- Contato humano, fonte indisponível, identidade inconsistente ou estado do ledger ambíguo interrompem a rota automática. Ela nunca infere presença a partir de uma falha de leitura.
- Não escreve em dado clínico (a instalação 106 confirmou zero escrita clínica direta).
- Mensagem aceita pelo WhatsApp não é mensagem entregue: só há entrega com recibo técnico correspondente.
- Não depende de Claude, Telegram nem Hermes para enviar.

## A janela de envio

- Segunda a sexta, das 07:00 (inclusive) às 13:00 (exclusive), horário de São Paulo (`America/Sao_Paulo`). A conta da janela está no módulo `calendario106.js`, que chega com o código da Codex.
- No mínimo 120 segundos entre duas tentativas.
- A saída da janela encerra o envio automático. A resposta humana pode ser registrada depois das 13h.
- À noite o processo pode ficar em `operacional_aguardando_eventos`, com `polling: false`. Não haver projeção nova à noite é o esperado.
- **Janela protegida** (para reiniciar ou trocar a versão): segunda a sexta, das 6h45 às 13h05, ou seja, a janela de envio com 15 minutos de margem antes e 5 depois. Nunca reinicie a Zelozinha nesse horário.

## O que ela lê e grava no Firebase

Segundo o handoff da Codex (20/10/2026). `<dia>` é a data no formato AAAA-MM-DD; `<dcKey>`, `<pelKey>` e `<petId>` são chaves do cadastro.

| Lê | Para quê |
|---|---|
| `daycare/checkin-corpo/<dia>/<dcKey>` | O check-in do corpo do dia: o gatilho |
| `daycare/checkout-corpo/<dia>/<dcKey>` | O checkout do dia |
| `daycare/turma/<dia>` e `daycare/irmaos` | Turma e irmãos do dia |
| `daycare/cadastro/<pelKey>` | Cadastro exato; a política de contato fica em `comunicacaoZelozinha` |
| `daycare/vencimentos/<dia>/<dcKey>` | Datas clínicas dos cuidados. A consulta recente lê a raiz `daycare/vencimentos` ordenada por chave, com início, fim e `limitToFirst(32)`; o 32 limita os nós diários, não o número de FILHOts nem de mensagens |
| `daycare/zelozinha-operacao/v1/veterinaria/<dia>` | A confirmação da veterinária do dia |

| Grava (namespace `piloto59/interno-20261019`) | O quê |
|---|---|
| `runtime43/fila` | Fila de check-ins |
| `runtime43/identidades/pets/<petId>` | Identidades preparadas |
| `recibos81` | Ledger, reservas e recibos |
| `painel81/<dia>` | Painel diário, com `detalhesEnvioVersao: 104` |

Limites que valem para qualquer mudança: o serviço usa a identidade técnica que já existe, com as regras publicadas. Não crie identidade, chave nem usuário novo no Firebase; não alargue a leitura para uma raiz clínica; não faça listagem ampla; não altere as regras por conveniência; não use `/local/acompanhamento` como teste de saúde (ele pode gravar uma projeção); não sobrescreva o histórico de dias anteriores para «limpar».

## Como rodar os testes

- **Hoje:** `node zelozinha/provas/rodar-todas.js`. Roda as provas do projeto: o manual, a varredura de segredos e de dado pessoal, a configuração do git e a regra do número da versão. Não usa rede, banco nem WhatsApp. Pede Node 18 ou mais novo e git 2.32 ou mais novo.
- **Quando o código da Codex entrar:** `node zelozinha/testes/rodar.js` (ainda não existe). A Codex reportou 44 testes principais, 30 de revisão independente, 8 do adaptador e as regras do banco no emulador. Eles terão de rodar com a rede proibida e só com dado inventado. Onde estão hoje e se algum usa dado real: a confirmar pela Codex.
- Nunca teste mandando mensagem a um tutor.

## Como publicar

- **Hoje:** quem troca o que roda na VPS é a Codex, a pedido da Adriana, e só fora da janela protegida. O comando e o passo a passo dela: a confirmar pela Codex. O Merge neste projeto não troca nada na VPS.
- **Depois** (Fases 3 e 4 da Story 6.112, ainda não feitas, e a pergunta 29 à Adriana está aberta): o Merge no `master` passa a publicar. O GitHub repete as provas, confere que o commit entrou por Merge e chama a VPS; a VPS monta a versão nova, testa sem rede, confere as chaves da configuração e só então troca e reinicia. Merge dentro da janela protegida espera até as 13h05. Se a versão nova não subir, a VPS volta sozinha à anterior. Hoje nada disso existe.
- O número da versão fica em `zelozinha/VERSAO` (chega com o código). Se `zelozinha/runtime/` muda, o número muda no mesmo pull request: `node zelozinha/provas/regra-versao.js --base <commit-base> --head <commit-final>` confere.

## Como voltar

- **Hoje:** a versão 105 (`automatico105-35ac05e7`) está guardada na VPS para volta. Quem troca é a Codex. Qualquer volta tem de preservar o ledger e a projeção. O comando exato: a confirmar pela Codex.
- **Depois:** voltar à versão anterior e desfazer a virada inteira serão cada um um comando só na VPS, e o primeiro também um botão no GitHub (Fases 3 e 4 da Story 6.112; ainda não existem).
- Mudança que grava o ledger ou a fila num formato novo só vale com uma story própria que diga como a versão anterior lê o formato novo. Sem isso, a volta fica bloqueada para aquela versão.

## Como parar numa emergência

- **Hoje:** peça à Codex. Quem tiver acesso à VPS pode parar a unidade `zeluz-automatico81` pelo systemd. Parar não apaga nada (fila, ledger e painel ficam no Firebase), e enquanto estiver parada nenhuma mensagem automática sai; a equipe segue no humano.
- **Cuidado:** parar no meio de um envio pode deixar uma reserva ambígua, que suspende o canal até alguém conciliar. O que acontece com uma reserva no estágio «reservado»: a confirmar pela Codex (C5).
- **Depois:** o botão de parar e ligar de novo do app (Story 6.100; depende de o serviço ler o nó de controle, o que ainda não acontece) e o freio de reserva pelo GitHub (Story 6.112, Fase 3; ainda não existe).
- Para corrigir uma mensagem errada, primeiro pare a Zelozinha e só depois troque a versão.

## Histórico de releases

| Versão | Release na VPS | Quando | Observação |
|---|---|---|---|
| 105 | `automatico105-35ac05e7` | Anterior à 106 (data: a confirmar pela Codex) | Guardada como base de volta |
| 106 | `automatico106-1225a25c` | Instalada em 20/10/2026 às 21h12min46s | No ar hoje. 59 arquivos verificados na instalação. Calendário contínuo de São Paulo (`calendario106.js`) e regras 106 do banco |

## O que ainda não sabemos (a confirmar pela Codex)

C1 a C9 da Story 6.112: usuário da unidade e versão do Node, `package.json` e lockfile, e onde fica o `node_modules` (C1); o que o drop-in do calendário tem além do calendário (C2); se o serviço guarda algo em disco fora do Firebase (C3); o sinal de que ela subiu bem sem gravar nada (C4); parar no meio de um envio e a reserva no estágio «reservado» (C5); onde estão os testes e se usam dado real (C6); se a VPS é a mesma do `servidor-senha`, o SSH e quem mais tem acesso (C7); onde roda o Evolution (C8); os arquivos do perfil do Hermes (C9). A lista completa está na parte 8 do `AGENTS.md`.
