# Etapa 2 — preparar os cinco consumidores que quebram com o App Check

> 28/ago/2026 · repositório `zeluz-hospedagem` · projeto Firebase `hospedagem-zeluz`
> Continuação da Etapa 2 da seção 6 de `01-seguranca.md`.
> **Nada foi gravado no Firebase, nada foi enviado ao Telegram e nenhum commit foi feito.**

---

## PARE AQUI ANTES DE CLICAR EM "IMPOR"

Enquanto eu preparava os consumidores, testei o app que **já está publicado e no ar** — o
`auaulandia/index.html`, sem tocar em nada — e descobri o seguinte:

> **O app da equipe NÃO consegue emitir um token de App Check hoje. O Google devolve
> HTTP 403 · `App attestation failed` · `PERMISSION_DENIED`.**

A prova, colhida do app publicado em `https://zoeharus-art.github.io/zeluz-hospedagem/auaulandia/`,
sem nenhuma alteração minha:

```
HTTP 403 https://content-firebaseappcheck.googleapis.com/v1/projects/hospedagem-zeluz/apps/
         1:199129329105:web:22d0995972c197e24644f0:exchangeRecaptchaV3Token
{ "error": { "code": 403, "message": "App attestation failed.", "status": "PERMISSION_DENIED" } }
```

**O que isso significa em português simples.** O reCAPTCHA funciona: a página consegue produzir a
prova. Quem recusa é o Firebase, na hora de trocar essa prova por um crachá válido. Ele recusa
porque, no Console, **o cadastro do reCAPTCHA v3 para este app web não bate com a chave que está no
HTML** — ou a chave secreta correspondente nunca foi salva, ou foi salva outra.

**Consequência.** Se a Adriana clicar em "Impor" hoje, **não quebram cinco consumidores: quebra
tudo, inclusive o app da equipe**. Ninguém do Day Care nem da AuAulândia consegue abrir nada.

A auditoria de 28/ago dizia que o app "continua funcionando" com o "Impor" ligado, porque a ativação
está escrita no código (`auaulandia/index.html:3727-3731`). Está escrita, sim — mas o Console recusa.
**Correção formal do relatório `01-seguranca.md`, Etapa 1:** o app da equipe também quebra.

**O que fazer antes do "Impor" (Etapa 1.0, nova, obrigatória):**

1. Console do Firebase → **App Check** → aba **Apps** → o app web `hospedagem-zeluz`.
2. Conferir se o provedor **reCAPTCHA v3** está registrado e **qual chave do site** está lá.
3. Ela tem de ser exatamente `6Lc9zmotAAAAADTA2O4DGzmZakZxqWPLWMIL0RB1` — a que está no HTML — e a
   **chave secreta** do mesmo par tem de estar salva no Console.
4. Salvar, esperar uns minutos, reabrir o app e conferir na aba **Métricas** se aparece requisição
   **verificada**. Só existe "Impor" seguro depois que essa contagem sair do zero.

Sem esse passo, todo o resto desta preparação fica correto e continua inerte — mas o "Impor"
continua sendo um botão que apaga a casa.

---

## 1. O que mudou, arquivo por arquivo

### 1.1 `index.html` (raiz — calculadora de ração) · 3 trechos, +17 linhas

| Linha | O que entrou |
|---|---|
| **816** | `<script src=".../10.14.1/firebase-app-check-compat.js"></script>` — a mesma versão 10.14.1 das outras três tags da página (conferida nas linhas 813-815), **não** a versão do app |
| **836-840** | `const APPCHECK_SITE_KEY = '6Lc9zmot…'` — a mesma chave do app, com o comentário explicando que é inerte enquanto o "Impor" estiver desligado |
| **982-992** | Dentro de `initFirebase()`, logo depois de `initializeApp`: `if (APPCHECK_SITE_KEY && typeof firebase.appCheck === 'function') { firebase.appCheck(app).activate(new firebase.appCheck.ReCaptchaV3Provider(APPCHECK_SITE_KEY), true); }` dentro de `try/catch` |

`isTokenAutoRefreshEnabled` é o segundo argumento do `activate` — está `true`, igual ao app.

### 1.2 `checkin.html` (raiz — cadastro de FILHOts) · 3 trechos, +17 linhas

| Linha | O que entrou |
|---|---|
| **437** | a tag do `firebase-app-check-compat.js`, versão **10.14.1** (a mesma das linhas 434-436) |
| **451-455** | `const APPCHECK_SITE_KEY = '6Lc9zmot…'` |
| **483-493** | a mesma ativação protegida por `typeof firebase.appCheck === 'function'`, dentro de `initFirebase()` |

### 1.3 `integracao-telegram/Codigo.gs` (ponte do Telegram) · +97 linhas

| Linha | O que entrou |
|---|---|
| **4-7** | cabeçalho: "Versão 7 (28/ago/2026)" |
| **208-271** | bloco novo: `APPCHECK_PROJECT_ID`, `APPCHECK_APP_ID`, `_appCheckToken()` e `_fbCabecalhos()` |
| **333-346** | `_fbLer()` passa `headers: _fbCabecalhos()` e registra no log quando o banco recusa |
| **348-362** | `_fbGravar()` passa os mesmos cabeçalhos e **o `catch` vazio virou log** |
| **372** | `vigiaAlmoco2_TESTE()` passa a imprimir a linha do App Check |

**A troca do token (o coração da mudança).** `_appCheckToken()` lê o segredo de
`PropertiesService.getScriptProperties().getProperty('APPCHECK_DEBUG_TOKEN')` — **nunca do código**,
porque este repositório é público — e chama a API oficial:

```
POST https://firebaseappcheck.googleapis.com/v1/projects/hospedagem-zeluz/apps/
     1:199129329105:web:22d0995972c197e24644f0:exchangeDebugToken?key=<chave pública do app>
corpo    { "debug_token": "<segredo>" }
resposta { "token": "<token de App Check>", "ttl": "3600s" }
```

O token vai em toda chamada REST ao banco no cabeçalho **`X-Firebase-AppCheck`**.

**Se a propriedade não existir**, a ponte segue exatamente como hoje — sem cabeçalho nenhum — e
escreve no log: `App Check: sem token de depuração — seguindo sem`. O mesmo vale se a troca falhar.

**O `catch` vazio corrigido.** Antes, `_fbGravar` engolia qualquer erro (`catch (e) {}`,
linhas 229-234 da versão antiga). Se a gravação da trava diária falhasse, ninguém sabia — e a ponte
repetia o aviso a cada 15 minutos até as 17h20. Agora a falha vira uma linha no log dizendo que **a
trava do dia NÃO foi gravada**. O comportamento de envio ao Telegram **não mudou em nada**.

### 1.4 `integracao-planilha/Codigo.gs` — **nenhuma mudança, e é o certo**

Varri o arquivo procurando `firebase`, `identitytoolkit`, `FB_KEY` e `UrlFetch`: **zero
ocorrências**. Essa ponte só recebe POST do app e escreve na planilha do Google. Ela **não fala com
o Firebase**, logo o App Check não a alcança e não há o que preparar. Confirma o item 6 da tabela da
seção 1 de `01-seguranca.md`. O mesmo vale para `integracao-daycare/Codigo.gs`.

### 1.5 `tools/carimbar-versao.js` — **arquivo novo** (o carimbo, agora versionado)

O script solto que estava só na máquina virou arquivo do repositório. Node puro, **sem nenhuma
dependência externa** (usa o `fetch` que já vem no Node 18+).

- Lê o segredo de `process.env.FIREBASE_APPCHECK_DEBUG_TOKEN`. **Sem a variável, o comportamento é
  idêntico ao de sempre** — nenhum cabeçalho a mais.
- `montarPedido()` está separada de propósito: é o que o teste examina sem tocar no banco.
- Só age quando chamado direto na linha de comando (`require.main === module`). Ser importado pelo
  teste **não grava nada**.

```
node tools/carimbar-versao.js 2026-08-28-01        grava e confere
node tools/carimbar-versao.js --ver                só mostra o que está no banco
```

### 1.6 `tests/lib/appcheck.js` — **arquivo novo** (a peça compartilhada)

Exporta `obterTokenAppCheck()`, `cabecalhosFirebase(token)` e `instalarNoHttps(https)`. É a mesma
lógica da ponte, em Node. Sem a variável de ambiente, `obterTokenAppCheck()` devolve `null` e
**nenhuma chamada de rede acontece**.

Diagnóstico na mão: `node tests/lib/appcheck.js` → imprime o token, ou `null`.

### 1.7 `tests/carimbar-versao.test.js` — **arquivo novo** (a prova)

Nove testes com o `fetch` global substituído por um duplo. Não toca no banco nem na internet.

---

## 2. A linha única para o `tests/harness.js`

**Não a inseri** — o harness está sendo mexido por outra sessão. Insira **logo depois** de
`const crypto = require('crypto');` (hoje a linha 24):

```js
require('./lib/appcheck').instalarNoHttps(https); // App Check: só age se FIREBASE_APPCHECK_DEBUG_TOKEN existir
```

Ela embrulha o `https.request` do harness e acrescenta o cabeçalho `X-Firebase-AppCheck` **só** nas
chamadas para `firebaseio.com` — o login anônimo continua sem cabeçalho. Sem a variável de ambiente,
a função devolve `null` na hora, não abre processo nenhum e **não mexe no `https.request`**: o
harness roda exatamente como hoje.

Para rodar o harness com a prova, depois que a Etapa 1.0 estiver resolvida:

```bash
FIREBASE_APPCHECK_DEBUG_TOKEN='<o segredo>' node tests/harness.js
```

---

## 3. Como reverter (3 linhas por arquivo)

| Arquivo | Como voltar atrás |
|---|---|
| `index.html` | apagar a tag `firebase-app-check-compat.js` (linha 816); apagar o `const APPCHECK_SITE_KEY` (836-840); apagar o bloco `if (APPCHECK_SITE_KEY …)` dentro de `initFirebase()` (982-992) |
| `checkin.html` | apagar a tag (437); apagar o `const APPCHECK_SITE_KEY` (451-455); apagar o bloco `if (APPCHECK_SITE_KEY …)` (483-493) |
| `integracao-telegram/Codigo.gs` | apagar o bloco `_appCheckToken()`/`_fbCabecalhos()` (208-271); tirar `headers: _fbCabecalhos(),` de `_fbLer` e de `_fbGravar`; apagar a linha do App Check em `vigiaAlmoco2_TESTE()` |
| `tools/carimbar-versao.js`, `tests/lib/appcheck.js`, `tests/carimbar-versao.test.js` | apagar os arquivos — são novos, ninguém depende deles |
| `tests/harness.js` | apagar a linha única, se ela tiver sido inserida |

Mais rápido ainda, enquanto não houver commit: `git checkout -- index.html checkin.html
integracao-telegram/Codigo.gs`.

**E o desligamento sem mexer em código:** apagar a propriedade `APPCHECK_DEBUG_TOKEN` no Apps Script
faz a ponte voltar ao comportamento antigo na hora. Esvaziar `APPCHECK_SITE_KEY` (deixar `''`) nas
duas páginas as devolve ao estado anterior sem apagar nada.

---

## 4. Passo a passo para a Adriana

Vou escrever como se ninguém aqui soubesse o que é App Check. **Não faça o passo 5 antes do
passo 0** — ele é novo e é o que impede a casa de parar.

### Antes de tudo — o que é isso, em uma frase

A chave do Firebase que está no site é pública: qualquer pessoa que abra o código da página a
enxerga. O App Check é um **crachá**: o site tira uma prova de que quem está pedindo é o nosso site
de verdade, e o Firebase só atende quem mostra o crachá. Enquanto o crachá é **pedido mas não
exigido** ("Não imposto"), nada muda. Quando passa a ser **exigido** ("Impor"), quem não tem crachá
é barrado na porta.

### Passo 0 — CONSERTAR O CRACHÁ DO APP (é o passo novo, e é o mais importante)

Hoje **nem o nosso próprio app consegue tirar o crachá**. Eu testei o app publicado e o Google
respondeu "recusado". Enquanto isso não for consertado, apertar o "Impor" derruba tudo.

1. Entre no **Console do Firebase** → projeto **hospedagem-zeluz** → menu **App Check**.
2. Abra a aba **Apps** e clique no app da web.
3. Veja se aparece **reCAPTCHA v3** ali. Clique para editar.
4. Confira se a **chave do site** é esta: `6Lc9zmotAAAAADTA2O4DGzmZakZxqWPLWMIL0RB1`.
   - Se estiver diferente, ou em branco: é aqui que está o problema.
   - A chave do site vem em par com uma **chave secreta**. As duas nascem juntas, no painel do
     reCAPTCHA do Google. O Firebase precisa da **secreta**; o nosso site usa a **do site**.
5. Cole o par certo, salve, espere uns 5 minutos.
6. Abra o app da equipe no celular, use normalmente por um minuto, e volte ao Console → App Check →
   aba **Métricas**. Se começar a aparecer requisição **verificada**, o crachá está funcionando.
   Enquanto ficar tudo em "sem prova", **não siga adiante**.

### Passo 1 — Criar o token de depuração (o crachá de quem não é navegador)

O app roda no navegador e tira o crachá sozinho. A ponte do Telegram roda no servidor do Google, não
tem navegador e não consegue. Para esses casos o Firebase dá um crachá especial, chamado **token de
depuração**. É gratuito e é o caminho oficial.

1. Console do Firebase → **App Check** → aba **Apps** → no app da web, clique nos três pontinhos
   (⋮) → **Gerenciar tokens de depuração**.
2. **Adicionar token de depuração**. Dê um nome que diga para que serve, por exemplo
   `ponte-telegram`.
3. O Google mostra um código comprido, parecido com
   `a1b2c3d4-e5f6-...`. **Copie agora** — ele não aparece de novo.
4. Guarde esse código no gerenciador de senhas. **Ele é segredo.** Nunca cole em arquivo do
   repositório: o repositório é público e qualquer pessoa lê.

> Se quiser um token separado para o carimbo da versão e para a rede de testes, crie outro com nome
> `carimbo-e-testes`. Dá certo com um só, mas com dois é mais fácil cancelar um sem derrubar o outro.

### Passo 2 — Colar o token no Apps Script e atualizar o código da ponte

1. Abra a planilha/projeto do Apps Script da **ponte do Telegram**.
2. Menu da engrenagem à esquerda: **Configurações do projeto**.
3. Role até **Propriedades do script** → **Adicionar propriedade de script**.
   - **Propriedade:** `APPCHECK_DEBUG_TOKEN` (escreva exatamente assim, tudo maiúsculo, com os
     traços baixos)
   - **Valor:** o código comprido que você copiou no passo 1
   - **Salvar propriedades do script**
4. Volte ao editor, abra o arquivo `Codigo.gs` e substitua todo o conteúdo pelo do arquivo
   `integracao-telegram/Codigo.gs` deste repositório (a Versão 7).
5. **Salve** (o disquete). Não precisa reimplantar: a função do vigia roda por acionador de tempo,
   não pela URL.

> Se você **não** fizer este passo, nada quebra. A ponte simplesmente segue como hoje e escreve no
> log: "App Check: sem token de depuração — seguindo sem".

### Passo 3 — Rodar o teste e conferir

1. No editor do Apps Script, escolha a função **`vigiaAlmoco2_TESTE`** na lista de cima e clique em
   **Executar**.
2. Abra o **Registro de execução** (embaixo). Você tem de ver, nesta ordem:

```
token: ok
App Check: ok (com prova)
dia: 2026-08-28 · registros no 2º horário: N
```

- `token: ok` → a ponte entrou no Firebase.
- `App Check: ok (com prova)` → o crachá funcionou.
- Se aparecer `App Check: sem token de depuração — seguindo sem`, a propriedade não foi salva (volte
  ao passo 2) ou o nome está escrito diferente.
- Se aparecer `a troca do token de depuração falhou`, o código foi copiado errado ou o token foi
  apagado no Console.

Essa execução **não manda mensagem nenhuma** para o Telegram — é só leitura.

### Passo 4 — Olhar as Métricas ANTES de clicar em "Impor"

Console do Firebase → **App Check** → **Realtime Database** → aba **Métricas**. Ela mostra, dos
últimos 7 dias, quanta coisa chegou **verificada** (com crachá) e quanta chegou **sem prova**.

O que você quer ver antes de clicar:

- **Verificadas: a maior parte.** Se ainda estiver tudo em "sem prova", o passo 0 não terminou.
- **Sem prova: só o que dá para explicar** — a ponte, o carimbo, a rede de testes, e celulares da
  equipe que ainda não abriram o app depois da atualização.
- Se aparecer volume "sem prova" que **ninguém consegue explicar**, pare. É gente usando alguma
  coisa que não está mapeada, e essa coisa vai morrer no clique.

Espere pelo menos **um dia inteiro de uso normal** com o passo 0 já resolvido. É esse dia que enche
o gráfico com a verdade.

### Passo 5 — O clique

Console do Firebase → **App Check** → **Realtime Database** → **Impor**. Confirme.

A partir daí, quem não tem crachá é barrado pelo Firebase **antes** de olhar as regras. Isso fecha
quatorze dos vinte e quatro achados da auditoria de uma vez.

**Nos 30 minutos seguintes, confira, nesta ordem:**

1. Abra o app da equipe no celular e veja se a lista carrega.
2. Peça a alguém do Day Care para abrir e registrar qualquer coisa.
3. Abra a calculadora de ração e o check-in.
4. Rode `vigiaAlmoco2_TESTE()` de novo — tem de continuar `App Check: ok (com prova)`.

### Passo 6 — Como voltar atrás (leva 2 minutos, sem perder nada)

Mesmo lugar: Console → **App Check** → **Realtime Database** → **Não imposto**. Efeito em poucos
minutos. **Nenhum dado é perdido**, nada é apagado, ninguém precisa refazer nada. É um interruptor:
liga e desliga quantas vezes for preciso.

Se algo quebrar e você não souber o quê: **desligue primeiro, investigue depois.** A casa
funcionando vale mais que a porta trancada.

---

## 5. As provas desta sessão

| # | O que foi provado | Como | Resultado |
|---|---|---|---|
| 1 | O teste unitário passa | `node tests/carimbar-versao.test.js` | **9 passaram, 0 falharam** |
| 2 | Sem a variável de ambiente, nada muda | `node tests/lib/appcheck.js` (sem `FIREBASE_APPCHECK_DEBUG_TOKEN`) | imprime `null`, sai com código 0 |
| 3 | As páginas alteradas carregam sem erro novo | servidor `python -m http.server 8765` + Playwright headless | SDK carregado, chave presente, `firebase.appCheck()` ativado nas duas |
| 4 | O erro de reCAPTCHA no `localhost` **não** é meu | mesmo servidor, mesmo navegador, com o `auaulandia/index.html` **intocado** | o app aprovado dá **o mesmo erro** — é a chave presa ao domínio `zoeharus-art.github.io` |
| 5 | As páginas alteradas sob o domínio real | Playwright servindo o HTML do disco na origem `zoeharus-art.github.io` | reCAPTCHA passa; o **403 do Firebase** aparece — o mesmo do app |
| 6 | O 403 é anterior a esta sessão | app **publicado**, sem nenhuma interceptação | `403 · App attestation failed · PERMISSION_DENIED` em `exchangeRecaptchaV3Token` |
| 7 | Hoje nada quebrou | mesmas páginas, com o "Impor" desligado | `index.html` leu **1024** registros de `racao`; `checkin.html` leu os **1** de `filhots` (conferido por REST) |
| 8 | Só os arquivos permitidos mudaram | `git diff --stat` + `git status` | ver abaixo |

### O `git diff --stat`

```
 auaulandia/index.html         |  4 +-      ← OUTRA SESSÃO (ícones do menu). Não toquei.
 checkin.html                  | 17 ++++++++
 index.html                    | 17 ++++++++
 integracao-telegram/Codigo.gs | 97 +++++++++++++++++++++++++++++++++++++++---
 tests/harness.js              | 35 ++++++++++++++++   ← OUTRA SESSÃO (testes de ícone). Não toquei.
```

Confirmei que as mudanças em `auaulandia/index.html` e `tests/harness.js` são da outra sessão: são
troca de ícone (`shield` → `drop`, novo `settings`) e testes de ícone do menu. **Zero ocorrência de
`appCheck` nas duas.**

Arquivos novos (ainda não rastreados): `tools/carimbar-versao.js`, `tests/lib/appcheck.js`,
`tests/carimbar-versao.test.js`.

### O que foi confirmado na documentação oficial (não de memória)

| O quê | Fonte |
|---|---|
| `POST v1/projects/{projectId}/apps/{appId}:exchangeDebugToken`, resposta `{token, ttl}` | documento de descoberta oficial: `https://firebaseappcheck.googleapis.com/$discovery/rest?version=v1` |
| corpo com o campo `debug_token` | o próprio SDK do Firebase, `firebase-app-check-compat.js` 10.14.1 (`debug_token:t`) |
| `?key=<chave da API>` no fim da URL | o mesmo SDK: `projects/${r}/apps/${n}:${S}?key=${o}` |
| cabeçalho `X-Firebase-AppCheck` | `https://firebase.google.com/docs/app-check/custom-resource-backend` |
| o Realtime Database é protegido pelo App Check | `https://firebase.google.com/docs/app-check` |

`projectId` (`hospedagem-zeluz`) e `appId` (`1:199129329105:web:22d0995972c197e24644f0`) saíram do
`firebaseConfig` de `auaulandia/index.html:3712-3718`.

---

## 6. O que ficou de fora, de propósito

- **`tests/harness.js`** — outra sessão está no arquivo. A linha única está na seção 2.
- **`auaulandia/index.html`** — idem. Não precisa de mudança nenhuma: já tem o App Check.
- **Nenhuma gravação** no Firebase nem no Telegram. Antes de abrir a calculadora de ração no
  navegador, verifiquei por leitura que o nó `racao` **não tem chave em formato antigo** (0 de 1024),
  logo a migração automática dela não dispararia gravação.
- **`integrity="sha384-…"` nas tags de script** — o alerta apareceu na revisão. Não acrescentei
  porque as outras três tags de cada página também não têm, e uma tag com verificação e três sem é
  inconsistência sem ganho. Fica como melhoria futura: ou nas quatro, ou em nenhuma.
- **O `catch` de `_fbLer`** ganhou log, mas continua devolvendo `null` — mudar isso muda o
  comportamento do vigia, e não é escopo desta etapa.

---

*Trabalho de 28/ago/2026. Nada foi gravado no Firebase, nada foi enviado ao Telegram, nenhum commit
foi feito. Onde não deu para verificar, está escrito.*
