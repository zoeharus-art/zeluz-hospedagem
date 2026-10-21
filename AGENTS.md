# AGENTS.md — AuAulândia e Zelozinha

Manual para qualquer IA (Claude, Codex ou outra) continuar este projeto sem a conversa que o criou. Leia o arquivo inteiro antes de mudar qualquer coisa. Última revisão: 21/10/2026 (Story 6.112, Fase 2A).

## Estado de hoje (21/10/2026)

1. A pasta `zelozinha/` ainda não tem o código do serviço. A Codex vai trazê-lo por pull request (Fase 1 da Story 6.112). Hoje a pasta tem só o manual (`zelozinha/README.md`) e as provas do projeto (`zelozinha/provas/`).
2. A VPS ainda roda a cópia da Codex. Mudar o projeto ainda não muda o que roda: nenhum Merge troca a Zelozinha que está no ar.
3. O que só a Codex sabe sobre a VPS está escrito como «a confirmar pela Codex» (lista na parte 8). Não preencha esses pontos por dedução.
4. Esta seção muda quando o código entrar no projeto e quando a VPS passar a rodar a partir dele.

## 1. O que é o projeto

A Zêluz é um centro de cuidados que atende FILHOts (o termo da casa para os peludos que moram com as famílias). Este repositório, aberto na internet, guarda dois sistemas:

- **O app da AuAulândia e do Day Care**, ferramenta da equipe (os Zelosos). É um site estático, publicado pelo GitHub Pages, com o Firebase Realtime Database `hospedagem-zeluz` por trás. A tela da equipe é `auaulandia/index.html` (um arquivo grande), com a lógica em `auaulandia/*.js`.
- **A Zelozinha**, um serviço Node que roda numa VPS e manda, por WhatsApp (pela Evolution API), a mensagem de cuidados ao tutor depois do check-in do corpo do FILHOt. Ela é determinística, não é agente de linguagem: não interpreta resposta, não autoriza nada e não registra aplicação de cuidado. Pessoas respondem, autorizam, aplicam e registram (no Dr. Snoopy, o sistema onde a equipe registra e lança cobrança, fora deste projeto). Janela de envio: segunda a sexta, das 07:00 (inclusive) às 13:00 (exclusive), horário de São Paulo, com no mínimo 120 segundos entre duas tentativas. Detalhes em `zelozinha/README.md`.

Há ainda um perfil da Zelozinha no Hermes (conversa por Telegram, ligado ao cérebro da empresa na VPS). O serviço de envio não o usa, e ele fica fora deste projeto por enquanto (quais arquivos o formam: a confirmar pela Codex).

Mapa das pastas:

| Caminho | O que é |
|---|---|
| `auaulandia/` | O app da equipe: `index.html` e os scripts de lógica |
| `index.html`, `checkin.html`, `gestao.html` (na raiz) | Páginas à parte do app principal: painel, check-in e gestão financeira da AuAulândia |
| `servidor-senha/` | Serviço Node que confere o PIN da equipe e devolve o token de entrada; os arquivos secretos moram só na VPS |
| `integracao-daycare/`, `integracao-planilha/`, `integracao-telegram/` | Pontes em Google Apps Script (`Codigo.gs`) entre o app e a planilha que alimenta a TV do Day Care, a planilha da AuAulândia e os grupos do Telegram |
| `database.rules.json`, `database.rules.v2.json` | Regras do banco (quem as publica é a Adriana, no Console do Firebase) |
| `tests/`, `tools/` | Provas do app e scripts de apoio (por exemplo, o carimbo de versão) |
| `docs/` | Documentos do app: índice do menu, auditorias, capturas |
| `SEGURANCA.md`, `AUDITORIA-FASE0-FASE1.md` | Segurança do banco e auditoria inicial do app |
| `zelozinha/` | A Zelozinha. Hoje: `README.md` e `provas/`. Chegam com o código da Codex: `runtime/`, `manifesto/`, `testes/`, `config/`, `implantacao/`, `docs/` |
| `regras-banco/` (ainda não existe) | Espelho, só de leitura, das regras que estão no Console do Firebase |
| `.github/workflows/zelozinha-provas.yml` | As provas automáticas do GitHub (a cargo do @devops): rodam em todo pull request e no commit do Merge, e passam a valer a partir do Merge do pull request que as traz (task 10 da Story 6.112). O `zelozinha-publicar.yml`, que publica na VPS, é da Fase 3 e ainda não existe |

## 2. Quem decide

A Adriana, diretora da Zêluz, decide tudo o que é marca, dinheiro, pessoas, prioridade, prazo, publicação, texto que vai ao tutor e escopo. A IA propõe por pull request; o Merge é dela. Decisão tomada, a IA executa sem reabrir: pode discordar uma vez, com dados, e depois executa. Na dúvida sobre escopo, pergunte; não decida por ela.

Stories, PRD, arquitetura e o histórico das decisões ficam no projeto fechado `zoeharus-art/aios-zeluz` (`docs/stories/` e `docs/zeluz/auaulandia/`). Esta mudança tem a story `docs/stories/6.112.story.md` e o desenho `docs/zeluz/auaulandia/arquitetura-zelozinha-no-projeto.md`. Quem só tem acesso a este projeto tem o código e este manual, mas não o histórico das decisões: peça acesso aos dois.

A Codex é a outra IA do projeto e hoje a única com acesso à VPS; o Claude não entra nela. Mudar o que a Zelozinha manda, para quem e quando é pedido da Adriana, em story própria.

Cada mudança nasce de uma story, e o commit a cita, no padrão do histórico: `tipo(escopo): descrição [Story N.N]`, por exemplo `fix(zelozinha): ... [Story 6.94]`.

## 3. Como testar

**O app** (`tests/`). Cada prova é um arquivo `tests/*.test.js`, rodado com `node tests/<arquivo>.test.js`. Regras da casa:

- Prova de rotina não lê o banco real. O `tests/harness.js` e as demais usam um retrato do banco, guardado em `tests/.retrato/` (baixado uma vez por dia por `tests/lib/retrato.js`, o que exige a chave de quem roda). O banco vivo só de propósito, com ordem da Adriana.
- `tests/consumo-bytes.test.js` fica fora da rodada de rotina.
- Uma rodada pesada por vez (a Fase 0, `tests/fase0-ciclo-fechado.test.js`, o `tests/harness.js` e as que abrem navegador), sem navegador sobrando.
- A Fase 0 já tem falhas na base. Compara-se a lista de títulos que falham antes e depois, em UTC e em `TZ=America/Sao_Paulo`, e não o «passou tudo».
- Prova nova vai em arquivo próprio. O app não tem `package.json` na raiz. As provas da Zelozinha pedem Node 18 ou mais novo e git 2.32 ou mais novo (a versão do Node que roda na VPS: a confirmar pela Codex, C1).

**A Zelozinha.**

- Hoje: `node zelozinha/provas/rodar-todas.js` roda as provas do projeto (manual, varredura de segredos, configuração do git, regra do número da versão). Sem rede, sem banco e sem WhatsApp. O GitHub roda as mesmas provas, mais a varredura de todos os commits e a regra do número da versão, em todo pull request e no commit do Merge (`.github/workflows/zelozinha-provas.yml`), a partir do Merge do pull request que traz esse arquivo.
- Quando o código da Codex entrar: `node zelozinha/testes/rodar.js` (ainda não existe) roda os testes dela, que a Codex reportou como 44 principais, 30 de revisão independente e 8 do adaptador, mais as regras do banco no emulador. Esses testes rodam com a rede proibida e sem dado de verdade. Onde estão hoje e se usam dado real: a confirmar pela Codex.
- Nunca teste mandando mensagem a um tutor.

## 4. Como publicar e como voltar

**O app.** Publicar é o Merge do pull request no `master`: o GitHub Pages publica sozinho. Depois do Merge, carimbe a versão com `node tools/carimbar-versao.js <versão>`; sem o carimbo o celular da equipe continua abrindo a versão velha (o script precisa de acesso ao banco, então quem tem a credencial roda). Voltar: um pull request que desfaz a mudança, e um novo carimbo.

**As regras do banco** não se publicam por pull request: a Adriana as cola no Console do Firebase, mesclando. As regras publicadas para a Zelozinha (namespace `piloto59`) não são as do repositório; o espelho delas chega em `regras-banco/` com o código da Codex.

**A Zelozinha hoje.** Quem troca o que roda na VPS é a Codex, a pedido da Adriana. Como ela instala e como volta, com o comando exato: a confirmar pela Codex. No ar está a 106 (`automatico106-1225a25c`, instalada em 20/10/2026 às 21h12min46s); a 105 (`automatico105-35ac05e7`) está guardada para volta. Qualquer volta preserva o ledger e a projeção.

**A Zelozinha depois** (Fases 3 e 4 da Story 6.112; ainda não feitas, e a pergunta 29 à Adriana está aberta). O Merge passa a publicar na VPS pelo GitHub: as provas repetem, a VPS monta a versão nova, testa sem rede e só troca fora da janela protegida (segunda a sexta, das 6h45 às 13h05; Merge dentro dela espera até as 13h05). Se a versão nova não subir, a VPS volta sozinha à anterior. Voltar em um comando e parar numa emergência: ver `zelozinha/README.md`. **Hoje nada disso existe.**

## 5. O que nunca fazer

1. **Segredo ou dado de cliente** em arquivo, commit, captura de tela, log ou chat. Segredo é senha, chave, token ou o conteúdo de `automatico80.json`; dado de cliente é nome de tutor ou de FILHOt, telefone, identificador do WhatsApp, e-mail e CPF. O projeto é aberto na internet e o histórico dele é público: o que sobe não se desfaz.
2. **Mandar mensagem de teste a um tutor**, ou fabricar resposta, cobrança ou aplicação de cuidado em produção.
3. **Ler o banco real em teste sem querer.** Teste usa retrato, banco de mentira ou dado inventado.
4. **Editar o código direto na VPS.** O que roda tem de ser o que está no projeto; a mudança nasce em pull request.
5. **Reiniciar a Zelozinha de segunda a sexta, das 6h45 às 13h05.** Reiniciar no meio de um envio pode deixar uma reserva ambígua e suspender o canal.
6. **Mudar texto aprovado sem a Adriana.** Os textos que a Zelozinha manda (`mensagem-unica41`) foram aprovados por ela; uma letra mudada pede a aprovação dela por escrito.
7. **Publicar as regras do banco.** Quem publica é a Adriana, no Console do Firebase; a IA só propõe o arquivo.
8. **Mexer na área protegida do check-in do corpo** (`ck*`, `ckt*`, `pt*`, `#v-daycare`, `pendAvisarChegada`). Se a tarefa exigir, pare e pergunte à Adriana.
9. **Usar `/local/acompanhamento` como teste de saúde.** Ele grava uma projeção no banco.
10. **Usar `pull_request_target` ou runner próprio na VPS.** Em projeto aberto, um pull request de fora poderia rodar código na máquina que tem o WhatsApp e o banco.
11. **Regra: mudança de lugar e mudança de comportamento nunca no mesmo pull request.** Mover ou copiar código muda zero byte do que roda; mudar o que a Zelozinha faz é outro pull request, com a história própria.
12. **Regra: Merge só com sinal verde.** Verde é: as provas do projeto passam (`node zelozinha/provas/rodar-todas.js`) e o sinal do GitHub (`zelozinha-provas`) também, a partir do Merge que o traz. Vermelho é não dar o Merge; o GitHub sozinho não impede.
13. **Regra: nada da pasta `zelozinha` direto no master.** Sempre pull request. Um envio direto ao master não muda o que roda na VPS, mas hoje nada o acusa: o aviso vermelho de «entrou sem Merge» é do `zelozinha-publicar.yml` (Fase 3, ainda não existe), e o `zelozinha-provas.yml` fica verde se as provas passarem.

## 6. Como escrever para a equipe e para as famílias

- Português do Brasil correto, com todos os acentos. Datas como 21/10/2026; horas como 6h45 e 13h05; valores em Real como `R$ 148.391,61`.
- A marca é **Zêluz**, com circunflexo. O slogan é «Aqui, cada cuidado é ÚNICO.», com «Aqui,», a vírgula e ÚNICO em caixa alta.
- Vocabulário da casa: **FILHOt** (o «t» minúsculo), **tutor**, **Zeloso(a)** (quem trabalha na Zêluz), **Encãotador(a)** (quem cuida do Day Care), **Consultora de Bem-Estar** (recepção e Empório), **AuAulândia** (o espaço onde os FILHOts passam a noite), **Aucademia** (o Day Care da Zêluz), **Família Multiespécie**.
- Não use: cachorro, cão, animal, bicho, dono, proprietário, funcionário, monitor(a), atendente, vendedora, hotel canino, hospedagem (para o serviço) e pet (em contexto afetivo). Os nomes técnicos, como `zeluz-hospedagem` e `hospedagem-zeluz`, ficam como são.
- Sem emoji em texto de marca.
- Texto que vai ao tutor é da Adriana: não escreva, não reescreva e não «melhore». A mensagem automática vem de `mensagem-unica41`, com os textos que ela aprovou.
- Para a Adriana: português simples, o resultado primeiro, poucos passos e perguntas só quando necessárias, agrupadas, numeradas e cada uma com a resposta que você recomenda. A primeira linha é o que ela precisa fazer ou a resposta. Nada de jargão de programador no chat (hash, nome de função, contagem de testes); o detalhe técnico vai na story.
- Em testes, exemplos e documentos, nunca use nome real de FILHOt nem de tutor; invente. A varredura do projeto barra o que parece telefone, e-mail, CPF ou identificador do WhatsApp de verdade. Dado inventado que ela aceita: telefone com DDD 00 (`(00) 90000-0000`), e-mail em `exemplo.invalid`, CPF só de zeros e sem pontuação, IP de documentação (`203.0.113.9`). O identificador do WhatsApp de teste se monta em execução, juntando pedaços de texto, porque o formato dele é o de um número de verdade. Detalhes em `zelozinha/provas/LEIA-ME.md`.

## 7. Onde está cada segredo

O valor nunca aparece neste projeto. Aqui só está onde mora e quem troca.

| Segredo | Onde mora | Quem troca |
|---|---|---|
| Configuração da Zelozinha, `/etc/zeluz-piloto/automatico80.json`: chave do Evolution e acesso da identidade técnica do Firebase (as chaves exatas: a confirmar pela Codex) | Só na VPS. No projeto entra apenas o modelo sem valores, `automatico80.modelo.json` | Quem tem acesso à VPS (hoje, a Codex) e, para o Firebase, quem tem acesso ao Console |
| Arquivos secretos do `servidor-senha` (conta de serviço e senhas fixas), em `/etc/zeluz/` | Só na VPS | Quem tem acesso à VPS |
| Regras do banco e chaves do App Check | Console do Firebase | A Adriana |
| Chave de publicação (Fases 3 e 4 da Story 6.112; ainda não existe) | Nos segredos do ambiente `vps-zelozinha` do GitHub, liberado só para o `master` | Quem tem acesso à VPS (apaga uma linha lá) e a Adriana, no GitHub |
| Acesso de administração à própria VPS | Hoje, com a Codex. De quem é a conta, quanto custa e quem mais tem acesso: a confirmar (pergunta 31 à Adriana; C7 à Codex) | Quem tem a conta |

A chave do Firebase que está no HTML do app é pública por natureza (ver `SEGURANCA.md`) e não é segredo. Isso não autoriza colar outra chave em lugar nenhum.

Se um segredo vazar: troque a chave na hora (apagar do histórico não basta, porque o que foi público pode ter sido copiado), avise a Adriana e registre na story.

## 8. O que ainda não se sabe (a confirmar pela Codex)

O que este manual diz da VPS vem do handoff da Codex de 20/10/2026. O Claude, que escreveu esta primeira versão, não entra na VPS e não o conferiu; só a Codex confirma. Estes pontos estão em aberto, e cada um tem o nome C1 a C9 nas perguntas à Codex:

- C1: usuário da unidade, versão do Node, `package.json` e lockfile da release, onde fica o `node_modules`, e as versões dos pacotes de terceiros.
- C2: o que o drop-in do calendário (`zz106-calendario.conf`) tem além do calendário; se há `Environment=` com segredo.
- C3: se o serviço guarda algo em disco fora do Firebase.
- C4: o sinal de que ela subiu bem sem gravar nada, e em quantos segundos aparece.
- C5: se parar a unidade no meio de um envio é seguro; o que acontece com uma reserva no estágio «reservado».
- C6: onde estão os testes (44, 30, 8 e o do emulador) e se algum usa dado real.
- C7: se a VPS da Zelozinha é a mesma do `servidor-senha` e dos retratos do banco; se o SSH aceita conexão de fora, com senha ou só com chave; quem mais tem acesso.
- C8: onde roda o Evolution (o WhatsApp).
- C9: quais arquivos formam o perfil da Zelozinha no Hermes.
- Também em aberto: a data da reserva que estava no estágio `reservado`, sem tentativa, na leitura de 20/10/2026.

## 9. Onde achar mais

- `zelozinha/README.md`: o que a Zelozinha faz e não faz, caminhos do Firebase, como testar, publicar, voltar e parar.
- `zelozinha/provas/LEIA-ME.md`: as provas do projeto (varredura, regras do git, regra do número da versão) e como o @devops as liga ao GitHub.
- `SEGURANCA.md`: o que está aberto no banco e como fechar. `docs/INDICE-MENU-APP.md`: o menu do app.
- No projeto fechado `zoeharus-art/aios-zeluz`: a Story 6.112, a arquitetura, o handoff da Codex (`docs/zeluz/auaulandia/zelozinha-handoff-codex-106.md`) e as perguntas abertas à Adriana (`docs/zeluz/PERGUNTAS-PARA-ADRIANA.md`).
