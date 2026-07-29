# Segurança do app da AuAulândia — o que está aberto e como fechar

> Escrito em 28/jul/2026, depois de comprovar a falha na prática.

## O que foi encontrado

O banco do app (`hospedagem-zeluz`) está **aberto para qualquer pessoa na internet**.

Comprovado de fora, sem nenhuma senha da Zêluz:

1. A chave do Firebase está no HTML do app — e isso é **normal e inevitável**, ela é pública por
   natureza. Todo app web tem a dele visível.
2. O projeto aceita **login anônimo**. Qualquer um pede um login anônimo com essa chave e recebe.
3. As regras do banco liberavam **tudo** para quem estivesse logado.

Resultado: com o endereço do app, uma pessoa de fora conseguia **ler o banco inteiro** — nomes de
tutores, FILHOts, medicações, relatórios — e **escrever e apagar** à vontade. Testei: li a raiz,
gravei um nó e apaguei em seguida. Foram três comandos.

O que **não** é o problema: a senha estar no HTML, o app estar no GitHub Pages, ou o endereço ser
público. O problema é o banco não exigir nada além de "estar logado" — e qualquer um consegue estar.

---

## O que já foi feito (está no repositório, falta publicar)

### 1. Regras do banco — `database.rules.json`

- A **raiz fica fechada**: ninguém cria ramo novo (`/qualquercoisa`).
- **Ninguém apaga uma coleção inteira**: não dá mais para zerar `estadias`, `medicacao-agenda` ou
  `cadastro` num comando só.
- Item por item continua liberado — é disso que o app vive, e nada muda para a equipe.

### 2. App Check — já instalado no app, **desligado**

O App Check exige uma prova de que a requisição veio **deste site**. Quem não tem a prova é barrado
pelo próprio Firebase, **antes** das regras. É o que mata o ataque de fora: curl, HTML copiado,
qualquer coisa que não seja o app de verdade.

O código já está em `auaulandia/index.html`. Ele fica **inerte** enquanto a chave estiver vazia, então
nada quebrou. Liga sozinho quando a chave for colada.

---

## O que só a Adriana pode fazer (Console do Firebase)

### Passo 1 — Publicar as regras  ·  ~2 minutos

1. Abrir https://console.firebase.google.com/project/hospedagem-zeluz/database/hospedagem-zeluz-default-rtdb/rules
2. Apagar o conteúdo e colar o conteúdo de `database.rules.json` (o arquivo na raiz deste repositório).
3. **Publicar**.
4. Abrir o app e conferir: entrar, ver a lista, salvar alguma coisa. Se algo parar de salvar, é só
   voltar às regras anteriores no mesmo lugar (o Console guarda o histórico) e me avisar.

### Passo 2 — Ligar o App Check  ·  ~10 minutos

1. Criar a chave reCAPTCHA v3 em https://www.google.com/recaptcha/admin/create
   - Tipo: **reCAPTCHA v3**
   - Domínios: `zoeharus-art.github.io`
   - Copiar a **chave do site** (a pública) e a **chave secreta**.
2. No Console do Firebase → **App Check** → registrar o app web com o provedor **reCAPTCHA v3**,
   colando a **chave secreta**.
3. Colar a **chave do site** em `auaulandia/index.html`, na linha:
   ```js
   var APPCHECK_SITE_KEY='';
   ```
   (me mande a chave que eu coloco, testo e publico)
4. Deixar rodando em **modo de monitoramento por alguns dias**. O Console mostra quantas requisições
   vêm com prova e quantas vêm sem. Quando estiver tudo verde, **ativar a imposição** (enforcement)
   no Realtime Database.

> A ordem importa: **impor antes de monitorar derruba o app para a equipe.** Monitorar primeiro é o
> que garante que ninguém fica de fora.

### Passo 3 — Desligar o login anônimo (só depois do Passo 4)

Enquanto o login for anônimo, o App Check é a única barreira. Não desligar antes de ter o Passo 4.

---

## O que ainda fica em aberto (e a decisão é sua)

As senhas por papel (0901 da Adriana, 1006 da Wandela, etc.) são conferidas **no navegador**. Isso
organiza a equipe, mas **não é segurança**: quem souber abrir o console do navegador se declara
gestão. O App Check impede o estranho de entrar; não impede um Zeloso de ver o que não é dele.

Para separar papéis de verdade, o banco precisa receber uma prova de **quem** está pedindo — e essa
prova tem que ser emitida por um servidor, nunca pelo navegador.

### Caminho recomendado — PIN validado no servidor da Kairós

Você já tem a VPS (`kairospresenca.com.br`). Um endpoint pequeno lá:

1. recebe o PIN digitado;
2. confere contra a lista de senhas **no servidor**;
3. devolve um token do Firebase **com o papel dentro** (`plantonista`, `vet`, `gestao`…).

As regras do banco passam a ler o papel **do token**, que o navegador não consegue forjar.

- A equipe **continua digitando o mesmo PIN** — nada muda para elas.
- Custo: **R$ 0,00** (usa infraestrutura que você já paga).
- Precisa de: uma chave de conta de serviço, que você baixa no Console e me envia.

### Alternativas descartadas, e por quê

| Caminho | Por que não |
|---|---|
| Login com e-mail e senha por Zeloso | Muda a rotina da equipe, some o PIN, gera esquecimento de senha |
| Cloud Functions do Firebase | Exige plano Blaze — cartão de crédito cadastrado, sem ganho sobre a VPS |
| Deixar como está | Continua exposto |

---

## Resumo em uma linha

**Passos 1 e 2 fecham o app para o mundo hoje, de graça, sem mexer na rotina de ninguém.** O Passo 3
separa papéis de verdade e depende de uma decisão sua sobre usar a VPS.
