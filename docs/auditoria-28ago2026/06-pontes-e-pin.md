# Pontes e PIN — Etapas 6 e 7 da auditoria de 28/ago/2026

> Sessão de 29/ago/2026. Cobre os itens 10 (palavra-chave das duas pontes do Google) e
> 11 (PIN de `gestao.html`) do plano em `docs/auditoria-28ago2026/01-seguranca.md`, seção 6,
> **Etapa 6** ("Trocar as palavras-chave das pontes") e **Etapa 7** ("Conferir a planilha e o
> PIN do painel da Gestão").
>
> Regras desta sessão: proibido editar `auaulandia/index.html` (outro agente está nele) e
> proibido fazer commit. Nada foi gravado no Firebase nem no Telegram. Tudo abaixo foi testado
> com duplos de mentira (sandbox `vm` do Node) — nenhuma chamada real à rede.

---

## Sumário em uma frase

As duas pontes (`integracao-telegram` e `integracao-planilha`) tinham a mesma palavra-chave
fixa escrita num repositório público — e agora recusam tudo por padrão até alguém configurar
a Propriedade do script; o PIN de `gestao.html`, que era `1007` em texto puro e coincidia com
o PIN padrão do Monitor 3 do app, agora usa um valor novo (não mais `1007`) e um caminho pronto
para migrar para um hash guardado no banco — mas os dois consertos de fundo (a Propriedade nas
duas pontes, e o hash no banco) só ficam **de pé** depois que alguém com acesso ao Apps Script e
ao Firebase — a Diretoria, ou quem ela autorizar — rodar os dois roteiros da seção 4.

---

## 1. Item 10 — a palavra-chave das duas pontes

### 1.1 O que estava errado (achados 8 e 9 do `01-seguranca.md`)

Duas pontes — `integracao-telegram/Codigo.gs` (avisos ao Telegram) e
`integracao-planilha/Codigo.gs` (planilha financeira da Hospedagem) — comparavam o pedido do
app contra a **mesma string fixa**, escrita no próprio código:

```js
// integracao-telegram/Codigo.gs:21 (antes)
var SENHA = 'zeluz-auaulandia';

// integracao-planilha/Codigo.gs:24 (antes)
var TOKEN = 'zeluz-auaulandia';
```

Os dois arquivos estão neste repositório, que é **público** no GitHub. Qualquer pessoa que o
lesse ganhava:
- poder de postar texto e foto nos 4 grupos do Telegram da Zêluz — inclusive o "Zêluz · Plantão
  AuAulândia", o grupo da Gestão (achado 8);
- escrita livre na planilha financeira da Hospedagem (achado 9).

O banco também guarda essa mesma senha em claro (`auaulandia/config/telegram`, lida por
qualquer login anônimo — achado S5), mas isso é a **Etapa 1/2** (App Check) e não muda aqui.
Esta etapa resolve a metade que é **só do repositório**: parar de versionar o segredo.

### 1.2 O que mudou

Os dois arquivos agora leem a palavra-chave de uma **Propriedade do script**
(`PropertiesService.getScriptProperties()`), nunca do código:

```js
// a mesma função nos dois arquivos
function _ponteSenha() {
  try {
    return PropertiesService.getScriptProperties().getProperty('PONTE_SENHA') || '';
  } catch (e) {
    Logger.log('PONTE_SENHA: não consegui ler as Propriedades do script — ' + e);
    return '';
  }
}
```

E o `doPost()` dos dois passou a recusar **tudo** quando a Propriedade não existe — nunca abre
a porta por padrão, e diz por quê no log:

```js
var senhaEsperada = _ponteSenha();
if (!senhaEsperada) {
  Logger.log('PONTE_SENHA não configurada nas Propriedades do script — recusando o pedido.');
  return _resp({ ok: false, erro: 'PONTE_SENHA não configurada nas Propriedades do script' });
}
if (String(d.senha || '') !== senhaEsperada) {   // d.token, no caso da planilha
  return _resp({ ok: false, erro: 'senha invalida' });
}
```

| Arquivo | Campo do pedido | Variável antiga | Linha nova |
|---|---|---|---|
| `integracao-telegram/Codigo.gs` | `d.senha` | `SENHA` | `_ponteSenha()` |
| `integracao-planilha/Codigo.gs` | `d.token` | `TOKEN` | `_ponteSenha()` |

`TOKEN_BOT` (o token do bot do Telegram) **não muda** — já vivia só no Apps Script publicado,
nunca neste repositório (era `'COLE_AQUI_O_TOKEN'` no arquivo), e continua assim.

`integracao-daycare/Codigo.gs` (a ponte do Day Care, que alimenta `daycare/config/ponte-planilha`
e a TV) **não foi tocado** — já usava um placeholder (`'COLE_AQUI_UMA_SENHA_SUA'`), nunca teve a
senha real commitada, e não estava entre os dois achados 8/9. Fica registrado aqui para não
confundir: são **três** pontes no total, só duas tinham o problema.

### 1.3 Onde a senha nova vai ser digitada, no app (para quem for editar `index.html`)

Não editei `auaulandia/index.html` (fora do escopo desta sessão), mas o app já tem os dois
lugares que gravam essa senha — quem for atualizá-la só precisa saber onde:

| Ponte | Nó no banco | Tela no app | Linha que grava |
|---|---|---|---|
| Telegram | `auaulandia/config/telegram` = `{url, senha}` | Configurações → Avisos no Telegram (campos `#tgUrl`, `#tgSenha`) | `tgSalvarCfg()`, `auaulandia/index.html:~21823` |
| Planilha da Hospedagem | `auaulandia/config/orcamento/sheets` = `{url, token}` | Orçamentos → Ponte com a planilha (campos `#orcShUrl`, `#orcShToken`) | `auaulandia/index.html:~9205` |

**Achado à parte, fora do pedido original, registrado para quem editar `index.html` depois:**
o campo `#orcShToken` (linha `auaulandia/index.html:9189`) tem
`placeholder="zeluz-auaulandia"` — o **valor antigo da senha**, escrito como dica visual do
campo. Isso não é a senha funcionando (placeholder não é `value`), mas é a mesma senha antiga
aparecendo de novo em texto puro num arquivo público. Vale trocar esse placeholder por um texto
genérico (`"a mesma palavra-chave do PONTE_SENHA no script"`) na próxima edição desse arquivo.

### 1.4 Roteiro para a Diretoria (o que fica pendente, e como fechar)

1. **Escolher uma palavra-chave nova**, longa e aleatória — não precisa ser memorável, só
   colada uma vez em cada lugar. Ex.: gerar com `openssl rand -hex 24` ou qualquer gerador de
   senha forte.
2. **No Apps Script do Telegram** (`integracao-telegram/Codigo.gs`, já publicado): abrir o
   projeto → Configurações do projeto (a engrenagem, à esquerda) → Propriedades do script →
   Adicionar propriedade do script → nome `PONTE_SENHA`, valor a palavra-chave nova → Salvar.
   Repetir **exatamente igual** no Apps Script da planilha (`integracao-planilha/Codigo.gs`) —
   é uma segunda propriedade, num projeto Apps Script diferente. **Colar o mesmo Codigo.gs
   atualizado nos dois projetos publicados** (o repositório tem a versão nova; o que está
   publicado no Apps Script ainda é a versão antiga até alguém colar e implantar de novo:
   Implantar → Gerenciar implantações → lápis → Nova versão → Implantar).
3. **No app**, colar a MESMA palavra-chave nos dois lugares da tabela acima (Configurações →
   Avisos no Telegram; Orçamentos → Ponte com a planilha).
4. **Testar cada ponte** antes de considerar pronto:
   - Telegram: Configurações → "Mandar mensagem de teste" — tem de chegar no grupo.
   - Planilha: fazer um orçamento de teste com a ponte ligada e conferir se a linha caiu na
     planilha (ou usar o botão de teste da tela, se houver).
   - Rodar `vigiaAlmoco2_TESTE()` no editor do Apps Script do Telegram — tem de imprimir
     `token: ok`.
5. Se algo falhar depois do passo 2 e antes do passo 3 (a senha nova já está na Propriedade,
   mas ainda não foi colada no app): a ponte vai recusar com `senha invalida` — comportamento
   esperado, silêncio nunca sem explicação. Colar a senha no app resolve.

### 1.5 O que pode quebrar (transparência, como as etapas anteriores)

- Entre configurar a Propriedade nova nos dois Apps Script e colar a mesma senha no app, os
  avisos do Telegram e a gravação na planilha ficam recusados — janela de minutos, e a falha é
  visível (`senha invalida` no retorno, registrado no log do Apps Script).
- Se a Propriedade `PONTE_SENHA` **não** for configurada em algum dos dois projetos, aquela
  ponte passa a recusar **tudo**, sempre — inclusive a senha antiga, que não vale mais para
  nada (o código antigo já não existe). Isso é intencional: melhor a ponte parada e visível do
  que aberta para qualquer um.
- `vigiaAlmoco2()` (o vigia das 16h20, que roda sozinho por gatilho de tempo) depende do mesmo
  login anônimo do Firebase — **não** depende da `PONTE_SENHA`, então continua funcionando
  normalmente durante essa migração.

### 1.6 Como reverter

Nas Propriedades do script, apagar `PONTE_SENHA` volta a ponte ao estado "recusa tudo" (mais
seguro que o antigo "aceita a senha fixa", nunca pior). Para voltar ao comportamento de antes
de verdade seria preciso reintroduzir a string fixa no código — **não recomendado**, e por isso
não deixei nenhum caminho de volta para isso no código.

### 1.7 Prova — `tests/pontes-senha.test.js`

```
node tests/pontes-senha.test.js
```

Carrega os dois `Codigo.gs` de verdade (o arquivo publicado é lido pelo teste, sem cópia) numa
sandbox `vm` do Node, com duplos de `PropertiesService`, `Logger` e `ContentService`. Confirma:

1. **Sem** a Propriedade `PONTE_SENHA`: `doPost()` recusa QUALQUER pedido — inclusive um com a
   senha antiga certa — e o log diz exatamente por quê.
2. **Com** a Propriedade certa: `doPost()` aceita a senha que bate com ela (a prova de "aceitou"
   é passar do portão e chegar ao próximo passo real — para o Telegram, a mensagem de "grupo não
   configurado"; para a planilha, `ok:true`).
3. **Com** a Propriedade certa mas a senha do pedido errada: recusa.
4. Um pedido sem campo de senha nenhum também é recusado quando a Propriedade não existe.
5. **A antiga palavra-chave fixa não existe mais em nenhum `.gs` do repositório** — nem como
   valor funcional, nem como comentário (o teste varre todo `.gs` do repo e falha se achar).

```
9 passaram, 0 falharam.
```

Grep independente (fora do teste, para conferir à mão):

```bash
grep -rn "zeluz-auaulandia" --include=*.gs .
# (sem saída — nenhuma ocorrência)
```

---

## 2. Item 11 — o PIN de `gestao.html`

### 2.1 O que estava errado (achado 23 do `01-seguranca.md`)

```js
// gestao.html:340 (antes)
const PIN_CORRETO= '1007';
```

Dois problemas, não um:
1. **Texto puro num HTML público.** Quem abrir "Exibir código-fonte" lê o PIN.
2. **Colisão com outra senha do sistema.** `1007` é também o PIN padrão do **Monitor 3** do app
   da equipe (`auaulandia/index.html:10193`, dentro de `MONITORES_DEFAULT`). Um número não deve
   abrir duas portas diferentes — quem descobre o PIN do painel financeiro descobre, de brinde,
   um acesso do app.

### 2.2 O que `gestao.html` é, de fato (para escolher o conserto certo)

Antes de mexer, conferi o que a página faz: é **só leitura de planilha** — lê a aba `Dash Geral`
da mesma planilha de Hospedagem via `gviz`/JSONP, direto do navegador, sem login nenhum. Não
tinha Firebase, não escreve nada em lugar nenhum. É uma página solta, linkada só a partir da
raiz (`index.html:761`, botão "🔐 Gestão") — não é aberta a partir do app da equipe
(`auaulandia/index.html`).

O pedido apontava duas rotas possíveis: mover o PIN para o banco (gravável pela tela Time do
app) OU proteger pela mesma sessão do app, já que a página só lê planilha. Implementei **as duas**,
uma em cima da outra, porque elas resolvem coisas diferentes:

| Rota | O que resolve | O que NÃO resolve |
|---|---|---|
| **Sessão do app** (`sessionStorage.zeluz_login`) | Não pedir PIN de novo a quem JÁ entrou no app da equipe, nesta mesma aba, como Gestão/Diretoria | Não é segurança de verdade — o próprio `01-seguranca.md` (achado 10) já documenta que essa sessão se forja pelo console do navegador. É conveniência, não barreira. |
| **Hash no banco** (`daycare/config/pin-gestao`) | Tira o PIN de texto puro do HTML; permite um PIN que não colide com o de mais ninguém | Sozinho ainda depende de alguém (a Diretoria) configurar o valor — enquanto isso não acontece, o HTML precisa de ALGUM PIN local para não travar a página |

### 2.3 O que mudou em `gestao.html`

**a) A colisão foi resolvida imediatamente, sem depender de nada.** `PIN_CORRETO='1007'` saiu.
No lugar, um `PIN_PROVISORIO` novo (`5829`) — que não bate com nenhum PIN hoje em uso no app
(`1101`, `0902`, `1001` das SENHAS fixas; `1005`, `1007`, `1008`, `1009`, `1010`, `1011` dos
monitores). É o valor que vale **enquanto** o banco não estiver configurado.

**b) Quem já está autenticado no app, nesta aba, passa direto.** Ao carregar, `init()` confere
`sessionStorage.getItem('zeluz_login')`: se o papel salvo é `'gestao'` ou `'diretoria'`, a tela
de PIN nem aparece.

```js
function sessaoDoAppJaAutenticada() {
  try {
    const u = JSON.parse(sessionStorage.getItem('zeluz_login') || 'null');
    return !!(u && (u.role === 'gestao' || u.role === 'diretoria'));
  } catch (e) { return false; }
}
```

**c) O caminho para o PIN definitivo já está pronto, só falta a Diretoria configurar.** A
página agora se conecta ao Firebase (só leitura, login anônimo — o mesmo padrão de
`index.html`/`checkin.html`, com App Check já ligado no cliente, herdando a mesma chave pública
e a mesma site key do reCAPTCHA v3) e tenta ler `daycare/config/pin-gestao`. Se o nó existir —
formato `{ hash, sal }`, onde `hash = SHA-256(pin + sal)` calculado com a Web Crypto API do
próprio navegador — o PIN passa a ser conferido contra esse hash, e o `PIN_PROVISORIO` **deixa
de valer**. Se o nó não existir (caso de hoje), a página avisa discretamente embaixo do teclado
("PIN provisório em uso — peça à Diretoria para configurar o PIN definitivo") e o
`PIN_PROVISORIO` continua sendo quem decide.

```js
async function validarPin() {
  let ok = false;
  try {
    if (pinRemoto && pinRemoto.hash) {
      const calc = await sha256Hex(pinBuffer + (pinRemoto.sal || ''));
      ok = (calc === pinRemoto.hash);
    } else {
      ok = (pinBuffer === PIN_PROVISORIO);
    }
  } catch (e) { ok = (pinBuffer === PIN_PROVISORIO); }   // qualquer erro cai no provisório — nunca trava
  // ... libera ou mostra "PIN incorreto"
}
```

O PIN em si **nunca** é gravado ou lido em texto puro — nem no HTML, nem no banco. Só o hash.

### 2.4 O que fica para quem editar `index.html` (não fiz — fora do escopo desta sessão)

Para o hash em `daycare/config/pin-gestao` ser **gravável pela tela Time do app** (como o pedido
original descreveu), falta uma peça em `auaulandia/index.html`: um campo em Time → Colaboradores
(ou uma tela própria, restrita a `role==='diretoria'`, no mesmo padrão de `dashRevelarSenha()`/
`dashApagarPonte()` já usado para a ponte do Day Care) que:

1. Peça o PIN novo (4 dígitos, para manter a mesma experiência de digitar);
2. Gere um sal aleatório no navegador (`crypto.getRandomValues`) e calcule
   `hash = SHA-256(pin + sal)` com `crypto.subtle.digest` — a MESMA fórmula que `gestao.html`
   já sabe conferir;
3. Grave `{ hash, sal }` em `daycare/config/pin-gestao` — nunca o PIN puro em lugar nenhum.

**Até essa tela existir**, uso o script abaixo como o roteiro imediato — ele faz exatamente os
passos 2 e 3 pela linha de comando, sem precisar esperar a tela ficar pronta.

### 2.5 Roteiro para a Diretoria — configurar o PIN definitivo agora, sem esperar o app

```bash
node tools/configurar-pin-gestao.js 4821
```
(troque `4821` pelo PIN de 4 dígitos que a Diretoria quiser usar — um valor que não esteja na
lista de PINs já em uso no app: `1101`, `0902`, `1001`, `1005`, `1007`–`1011`)

O script (`tools/configurar-pin-gestao.js`, novo neste repositório):
- faz login anônimo no Firebase (a mesma porta que o app usa);
- gera um sal aleatório de 16 bytes;
- calcula `SHA-256(pin + sal)` em Node (`crypto.createHash`) — a MESMA conta que o navegador
  faz com a Web Crypto API, então o resultado bate;
- grava `{ hash, sal }` em `daycare/config/pin-gestao`;
- confere lendo de volta o que ficou gravado;
- **nunca imprime o PIN nem o hash na tela** — só diz se deu certo.

Para só checar se já está configurado, sem mexer em nada:

```bash
node tools/configurar-pin-gestao.js --ver
```

Depois de rodar, é só abrir `gestao.html` e digitar o PIN escolhido — a página vai ler o hash
do banco na hora, e o aviso de "PIN provisório" desaparece.

**Quem pode rodar este script:** exige apenas o login anônimo público do Firebase (a mesma
chave que já está no HTML) — não exige nenhuma credencial adicional. Qualquer pessoa com acesso
a este repositório e ao Node consegue rodar. Por isso o valor do PIN escolhido deve ser
combinado só entre quem precisa saber (a Diretoria), e o script não imprime o PIN de volta.

### 2.6 O que pode quebrar

- **Nada quebra hoje.** `gestao.html` continua funcionando com o `PIN_PROVISORIO` (`5829`) até
  a Diretoria rodar o roteiro acima. Ninguém fica sem acesso ao painel financeiro.
- Se o Firebase estiver fora do ar, ou o App Check algum dia passar a "Impor" e esta página
  não tiver sido preparada para ele (ver Etapa 2 do `01-seguranca.md` — hoje `gestao.html` **não
  está** na lista de páginas com App Check ativado, porque nunca falava com o Firebase antes
  desta mudança): a leitura do PIN remoto falha silenciosamente, o aviso "PIN provisório" some
  de vista (o elemento não é atualizado) e o `PIN_PROVISORIO` continua valendo — a página nunca
  trava por causa disso.
- Depois que a Diretoria configurar `daycare/config/pin-gestao`, o `PIN_PROVISORIO` (`5829`)
  deixa de abrir a porta. Isso é intencional — mas precisa estar claro para quem usa a página
  hoje, para não tentar `5829` depois da migração e achar que "quebrou".
- **Consequência do App Check (Etapa 1) para esta página, se for ligado antes de prepará-la:**
  como `gestao.html` agora fala com o Firebase mas ainda não foi listada entre as páginas
  preparadas para o "Impor" (ver `docs/auditoria-28ago2026/04-preparacao-appcheck.md`), se a
  Adriana ligar o "Impor" sem revisitar esta página, a LEITURA do PIN remoto passa a falhar (sem
  a prova do App Check) — o efeito prático é só continuar no modo `PIN_PROVISORIO` para sempre,
  nunca um travamento. Registrado aqui para quem cuidar da Etapa 1: `gestao.html` precisa entrar
  na lista de páginas revisitadas antes de "Impor".

### 2.7 Como reverter

Local: reverter `gestao.html` para a versão anterior (`git checkout` do arquivo) volta ao PIN
fixo `1007` — não recomendado, é o próprio problema que esta etapa resolve.

No banco: apagar `daycare/config/pin-gestao` (ou nunca configurá-lo) mantém o `PIN_PROVISORIO`
como único caminho, para sempre — comportamento seguro, só sem a força extra do PIN definitivo
escolhido pela Diretoria.

### 2.8 Prova — `tests/gestao-pin.test.js`

```
node tests/gestao-pin.test.js
```

Carrega o `<script>` de verdade de `gestao.html` (o mesmo arquivo publicado, sem cópia) numa
sandbox `vm` do Node, com duplos mínimos de `document`/`window`/`sessionStorage`/`firebase`.
Confirma:

1. `PIN_PROVISORIO` não é mais `'1007'`, e continua um PIN de 4 dígitos (a experiência de
   digitar não muda).
2. `sha256Hex()` bate com o SHA-256 nativo do Node para o mesmo texto — a mesma fórmula que o
   script de configuração (`tools/configurar-pin-gestao.js`) usa do lado do servidor.
3. `sessaoDoAppJaAutenticada()`: só `true` para papel `'gestao'` ou `'diretoria'` salvo pelo
   APP nesta mesma aba — qualquer outro papel, JSON quebrado ou sessão ausente devolve `false`.
4. `validarPin()` sem PIN configurado no banco: só o `PIN_PROVISORIO` libera; qualquer outro
   valor é recusado.
5. `validarPin()` com PIN configurado no banco (hash + sal de teste): o PIN certo libera pelo
   hash, o `PIN_PROVISORIO` sozinho **deixa de valer**, e um PIN errado é recusado.
6. `init()`: com sessão do app válida, pula a tela de PIN e chama `initDashboard()` direto; sem
   sessão, a tela de PIN continua visível.

```
14 passaram, 0 falharam.
```

---

## 3. `git diff --stat` desta sessão

```
 gestao.html                    | 113 ++++++++++++++++++++++++++++++++++++++++++--
 integracao-planilha/Codigo.gs  |  39 +++++++++++++-
 integracao-telegram/Codigo.gs  |  39 +++++++++++++-
 3 files changed, 184 insertions(+), 7 deletions(-)
```

Arquivos novos (não versionados ainda): `tests/pontes-senha.test.js`,
`tests/gestao-pin.test.js`, `tools/configurar-pin-gestao.js`, e este documento.

Nenhum outro arquivo do repositório foi tocado nesta sessão. `auaulandia/index.html` foi
deliberadamente deixado intocado, conforme o escopo — outra sessão está nele.

---

## 4. Resumo — o que fazer, em ordem

1. Rodar `node tests/pontes-senha.test.js` e `node tests/gestao-pin.test.js` — os dois têm de
   passar 100% (já rodei e passaram: 9/9 e 14/14).
2. **Pontes:** configurar `PONTE_SENHA` nas Propriedades dos dois Apps Script
   (`integracao-telegram` e `integracao-planilha`), colar o `Codigo.gs` atualizado deste
   repositório em cada um, implantar nova versão, colar a mesma senha nova no app
   (Configurações → Avisos no Telegram; Orçamentos → Ponte com a planilha), testar as duas.
3. **PIN:** rodar `node tools/configurar-pin-gestao.js <PIN-escolhido>` para tirar
   `gestao.html` do modo provisório. Opcional, mas recomendado: numa sessão futura que edite
   `auaulandia/index.html`, acrescentar a tela em Time → Colaboradores para isso ficar
   administrável pela própria Gestão, sem depender de rodar um script.
4. Registrar (achado à parte): trocar o `placeholder="zeluz-auaulandia"` de
   `auaulandia/index.html:9189` por um texto genérico, na próxima sessão que tocar esse arquivo.
