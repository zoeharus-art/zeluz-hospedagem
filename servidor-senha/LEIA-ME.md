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
| Senha certa da equipe em aparelho **não** liberado | recusa, com o nome da pessoa, para o app mostrar o aviso de sempre |
| Senha errada | recusa, sem dizer de quem seria |
| 5 erros do mesmo endereço em 10 min | aquele endereço espera 15 min |
| 60 erros de qualquer lugar em 10 min | todos esperam 10 min (freio contra o ataque espalhado) |

Toda tentativa deixa rastro em `auaulandia/logins-servidor/{dia}`. O rastro **não guarda a senha nem o endereço de ninguém**: só uma impressão digital curta do endereço.

A conta mora em `logica.js`, e as provas dela estão em `tests/servidor-senha.test.js`. Para rodar as provas: `node tests/servidor-senha.test.js`.

## Instalação na VPS (uma vez, ~30 minutos)

**Nada secreto entra no repositório.** Os dois arquivos secretos ficam só no servidor.

1. **Chave da conta de serviço.** Siga os passos abaixo:
   1. No Console do Firebase, abra: projeto `hospedagem-zeluz` → ⚙ Configurações do projeto → Contas de serviço → **Gerar nova chave privada**.
   2. Envie o arquivo para a VPS em `/etc/zeluz/conta-servico.json`.
   3. Rode: `chmod 600 /etc/zeluz/conta-servico.json`.
2. **Senhas fixas.** Siga os passos abaixo:
   1. Copie `senhas-fixas.exemplo.json` para `/etc/zeluz/senhas-fixas.json`.
   2. Troque os PINs de mentira pelos de verdade.
   3. Rode: `chmod 600 /etc/zeluz/senhas-fixas.json`.
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
     proxy_set_header X-Forwarded-For $remote_addr;
   }
   ```
5. **Conferir:** `curl https://kairospresenca.com.br/zeluz/senha/saude` deve responder `{"ok":true}`.

## Depois que ele estiver no ar

Cada etapa vale uma sessão de trabalho, e nenhuma etapa começa antes de a anterior rodar uma semana sem problema.

| Etapa | O que muda | Quem |
|---|---|---|
| 2 | O app passa a mandar a senha para o servidor e entra com o token. Se o servidor não responder, a tela avisa "servidor da senha fora do ar" e ninguém fica trancado: a Gestão continua entrando pelo caminho antigo enquanto a etapa 3 não chega. | desenvolvimento |
| 3 | As senhas fixas **saem** do código da página. | desenvolvimento |
| 4 | Regras do banco com o papel de verdade, além de desligar o login anônimo no Console. O que muda:<br>• `daycare/config/monitores` e `auaulandia/aparelhos` passam a ser lidos só por quem tem papel `gestao`;<br>• gravar exige um papel. | desenvolvimento + Adriana (Console) |
| 5 | **Trocar todas as senhas**, porque as antigas ficaram no histórico público do repositório. | Adriana |

Só na etapa 5 o problema está resolvido. Até lá, o risco é o mesmo de hoje.

Nem a trava de aparelho segura sozinha: a lista de aparelhos liberados também é lida por qualquer sessão logada, até a etapa 4.
