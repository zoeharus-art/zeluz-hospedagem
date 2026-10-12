# Servidor da senha — Rota A (Fase 0 do PRD-006)

> Escrito em 25/set/2026. A decisão da Rota A é da Adriana (25/set: "ok" para todas as recomendações da auditoria).

## Por que existe

Hoje o app confere a senha **dentro do navegador**:

- as senhas fixas (Gestão e plantão) estão escritas no código da página, que é pública;
- as senhas da equipe ficam em `daycare/config/monitores`, que qualquer sessão logada lê. O login anônimo do próprio site conta como sessão logada.

Quem abre o código-fonte entra como Gestão.

Com este servidor, a conferência sai do celular:

1. o celular manda `{pin, aparelho}`;
2. o servidor confere e devolve um **token do Firebase com o papel dentro**;
3. o celular entra com esse token.

A equipe continua digitando o mesmo PIN. Custo: R$ 0,00, porque roda na VPS da Kairós, que já é paga.

## O que ele faz

| Situação | Resposta |
|---|---|
| Senha certa, aparelho liberado | entra (token com papel) |
| Senha certa da **Gestão** em aparelho novo | entra, marcada como aparelho novo, para a Gestão poder liberá-lo (a mesma regra do app de 05/ago) |
| Senha certa da equipe em aparelho **não** liberado | recusa como "aparelho não liberado", **sem o nome** da pessoa |
| Senha errada | recusa, sem dizer de quem seria |
| 5 erros do mesmo aparelho em 10 min | aquele aparelho espera 15 min (a digitação errada trava só o celular que errou, não a loja) |
| 20 erros do mesmo endereço em 10 min | aquele endereço espera 15 min |
| 150 erros de qualquer lugar em 10 min | todos esperam 5 min (freio contra o ataque espalhado; só acontece sob ataque) |

Acertar a senha **não zera** os erros: quem tem um PIN válido não pode alternar erros e acertos para testar todos os outros.

Toda tentativa conferida deixa rastro em `auaulandia/logins-servidor/{dia}`:
- o rastro **não guarda a senha nem o endereço**: guarda só uma impressão digital curta do endereço, com um sal que nasce a cada partida do serviço e não sai da memória;
- pedido barrado pelo freio não grava nada.

A conta mora em `logica.js`, e as provas dela estão em `tests/servidor-senha.test.js`. Para rodar as provas: `node tests/servidor-senha.test.js`.

## Instalação na VPS (uma vez, ~30 minutos)

**Nada secreto entra no repositório.** Os dois arquivos secretos ficam só no servidor.

1. **Chave da conta de serviço.** Siga os passos abaixo:
   1. No Console do Firebase, abra: projeto `hospedagem-zeluz` → ⚙ Configurações do projeto → Contas de serviço → **Gerar nova chave privada**.
   2. Envie o arquivo para a VPS em `/etc/zeluz/conta-servico.json`.
   3. Rode: `chmod 600 /etc/zeluz/conta-servico.json`.
2. **Senhas fixas.** Siga os passos abaixo:
   1. Crie `/etc/zeluz/senhas-fixas.json` com o modelo abaixo. O modelo não fica em arquivo no repositório: o `.gitignore` barra todo arquivo que começa com `senhas`, para nenhuma senha de verdade subir por engano.
      ```json
      {
        "1111": { "id": "adriana", "role": "gestao", "nome": "Adriana · Gestão Total", "souAdriana": true, "avisoSonoro": true },
        "2222": { "id": "marcia", "role": "gestao", "nome": "Márcia · Gestora", "avisoSonoro": true },
        "3333": { "id": "plantonista", "role": "plantonista", "nome": "Plantonista" }
      }
      ```
   2. Troque os PINs de mentira (`1111`, `2222`, `3333`) pelos de verdade.
   3. Mantenha o `id` de cada entrada (`adriana`, `marcia`, `plantonista`): é ele que liga a entrada à senha trocada no app (veja «A senha fixa trocada no app», abaixo).
   4. Rode: `chmod 600 /etc/zeluz/senhas-fixas.json`.
3. **Instale e suba o serviço** (Node 18 ou mais novo):
   ```bash
   cd /opt && git clone https://github.com/zoeharus-art/zeluz-hospedagem.git
   cd /opt/zeluz-hospedagem/servidor-senha && npm install --omit=dev
   pm2 start servidor.js --name zeluz-senha && pm2 save
   ```
   Variáveis opcionais:
   - `PORTA` (padrão 8787);
   - `ORIGENS` (padrão `https://zoeharus-art.github.io`);
   - `CONTA_SERVICO`;
   - `SENHAS_FIXAS`.
4. **nginx** (no site `kairospresenca.com.br`):
   ```nginx
   location /zeluz/senha/ {
     proxy_pass http://127.0.0.1:8787/;
     proxy_set_header X-Real-IP $remote_addr;
   }
   ```
5. **Conferir:** `curl https://kairospresenca.com.br/zeluz/senha/saude` deve responder `{"ok":true}`.

## A senha fixa trocada no app (Story 6.76)

Desde a 6.76, a Adriana, a Márcia e a Gestão (para o posto Plantonista) trocam as senhas fixas pela tela Time › Senhas. A senha nova fica no banco só como um código, em `daycare/config/senhas-fixas/{id}`: `{hash, sal}`, com `hash` = SHA-256 da senha seguida do sal, em hexadecimal, e o sal com 16 bytes aleatórios em hexadecimal (o mesmo formato do PIN de `gestao.html`). A senha nunca vai ao banco, ao rastro, ao log nem ao Telegram.

O que o servidor faz com isso:

1. lê `daycare/config/senhas-fixas` com o mesmo cache de 60 segundos da equipe;
2. para a entrada do arquivo cujo `id` tem `{hash, sal}` no banco, o PIN do arquivo **deixa de valer**, e o PIN novo vale se o SHA-256 conferir;
3. o PIN do arquivo continua **reservado**: ninguém da equipe passa a entrar com ele;
4. quem foi desativado no Time (`ativo: false`) não entra pelo servidor, como no app.

Sem nenhuma senha trocada no banco, a conta é a de antes. A conta mora em `logica.js` (`montarTabela`, `trocadaConfere`, `trocadaValida`, `aparelhoLiberado`), e as provas estão em `tests/servidor-senha.test.js` (6.76 S1 a S6 e QA676-S01 a S05).

O que é preciso saber sobre esse nó (2ª rodada da 6.76):

1. **Um PIN curto num nó legível cai rápido.** O `{hash, sal}` de um PIN de 4 a 6 dígitos não resiste a quem testar as combinações: são no máximo 1.110.000, e um computador comum testa todas em segundos. O ganho da troca é real (a senha sai do código público e nunca aparece em texto), mas a segurança de verdade é a etapa 4.
2. **Qualquer sessão logada lê e grava `daycare/config/senhas-fixas` hoje** (regra v1, até o login anônimo). Por isso:
   - quem grava um registro no formato certo, com um PIN que conhece, entra como a dona;
   - quem apaga o nó devolve a senha do código, que é pública;
   - um registro fora do formato (hash que não tem 64 letras hexadecimais, ou sal que não tem 32) **não conta como troca**, no app e no servidor: vale a senha do código, e ninguém tranca a dona do lado de fora com lixo;
   - o limite dessa escolha (3ª rodada, DOC-002): um registro **bem-formado** (64 e 32 letras hexadecimais) com um PIN que ninguém conhece **ainda tranca a dona do lado de fora** — a senha do código é recusada, porque o registro conta como troca, e nenhum PIN abre (prova QA676R-09). A saída: a outra pessoa da Gestão define uma **senha provisória** em Time › Senhas (motivo e a própria senha), e a dona troca na entrada. Se as duas estiverem trancadas, peça ao Claude o passo a passo pelo banco, que não precisa de nenhum dado de produção: apagar o nó `daycare/config/senhas-fixas/{id}` (`adriana`, `marcia` ou `plantonista`) no console do Firebase devolve a senha do código, e a dona troca a senha de novo em seguida. Isso vale até a etapa 4; depois dela, só a Gestão e a Diretoria gravam esse nó.
3. **Na etapa 4,** `daycare/config/senhas-fixas` e `daycare/config/senhas-fixas-historico` entram junto com `monitores` e `aparelhos`: leitura e gravação só pela Gestão e pela Diretoria (e leitura pelo servidor).
4. **O cache de 60 segundos:** depois de uma troca, o servidor ainda aceita a senha velha por até 60 segundos. Enquanto o servidor estiver fora do ar, isso não importa; na etapa 2, o cache pode virar um ouvinte do nó (são três registros miúdos).
5. **A senha provisória:** quando a Adriana ou a Márcia esquece a senha, a outra define uma provisória em Time › Senhas (motivo e a própria senha). Ela fica guardada com `provisoria: true`. No app, ela abre a entrada e a tela trancada só para pedir «Trocar a minha senha» antes de qualquer tela, e não assina cartaz nem autoriza celular. **O servidor ainda aceita a provisória como uma senha comum,** sem pedir a troca: isso precisa entrar na etapa 2 (o app é que pede a troca).

O celular com a autorização retirada na tela Configurações › Celulares ganha `revogado` no próprio registro de `auaulandia/aparelhos/{id}`. O registro nunca é apagado. A régua do servidor é a mesma do app (`aparelhoLiberado`): liberado é o registro com nome (ou a hora da autorização) e sem `revogado`; o registro que só tem o batimento (`visto`) não está liberado.

## Depois que ele estiver no ar

Cada etapa vale uma sessão de trabalho, e nenhuma etapa começa antes de a anterior rodar uma semana sem problema.

| Etapa | O que muda | Quem |
|---|---|---|
| 2 | O app passa a mandar a senha para o servidor e entra com o token. Se o servidor não responder, a tela avisa "servidor da senha fora do ar" e ninguém fica trancado: a Gestão continua entrando pelo caminho antigo enquanto a etapa 3 não chega. | desenvolvimento |
| 3 | As senhas fixas **saem** do código da página. | desenvolvimento |
| 4 | Regras do banco com o papel de verdade, além de desligar o login anônimo no Console. O que muda:<br>• `daycare/config/monitores`, `auaulandia/aparelhos`, `daycare/config/senhas-fixas` e `daycare/config/senhas-fixas-historico` passam a ser lidos só por quem tem papel `gestao` (e pelo servidor); os dois nós das senhas fixas, gravados só pela Gestão e pela Diretoria;<br>• gravar exige um papel. | desenvolvimento + Adriana (Console) |
| 5 | **Trocar todas as senhas**, porque as antigas ficaram no histórico público do repositório. | Adriana |

Só na etapa 5 o problema está resolvido. Até lá, o risco é o mesmo de hoje.

Nem a trava de aparelho segura sozinha: a lista de aparelhos liberados também é lida por qualquer sessão logada, até a etapa 4.
