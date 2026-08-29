# Auditoria de Segurança — app da AuAulândia e Day Care

> 28/ago/2026 · repositório `zeluz-hospedagem` · projeto Firebase `hospedagem-zeluz`
> Publicado em `https://zoeharus-art.github.io/zeluz-hospedagem/auaulandia/`
> Auditoria **somente leitura**: nada foi alterado no repositório e nada foi gravado no banco.

---

## Sumário em uma frase

As regras do banco publicadas em 29/jul/2026 fecharam a raiz, mas continuam apoiadas numa única
condição — *estar logado* — e qualquer pessoa da internet consegue estar logada em três segundos.
Dentro dessa porta, um estranho lê a base inteira de tutores e FILHOts, altera dose de medicação,
apaga o diário de auditoria de um dia inteiro num único comando, mexe na tabela de preços e no
acerto das plantonistas, lê as senhas de toda a equipe em texto puro e ainda descobre a
palavra-chave das duas pontes do Google (Telegram e planilha).

São **24 achados**: 6 Críticos, 10 Altos, 4 Médios e 4 Baixos. Quatorze deles fecham com um único
clique da Adriana — o App Check em "Impor" — mas esse clique, hoje, derruba cinco coisas que a casa
usa. A ordem certa está na seção 6.

---

## 1. Mapa de quem lê e quem escreve no banco

O banco é o Realtime Database `hospedagem-zeluz-default-rtdb`. Todos os consumidores abaixo usam a
**mesma chave web pública** `AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28` e o **mesmo login anônimo**.

| # | Quem | Método | Autenticação | App Check | O que faz |
|---|------|--------|--------------|-----------|-----------|
| 1 | `auaulandia/index.html` — o app da equipe | SDK web (`firebase-database` compat) | `signInAnonymously()` — `auaulandia/index.html:3732` | **Sim**, ativado no cliente — `auaulandia/index.html:3709`, `:3729` | Lê e escreve `auaulandia/*` e `daycare/*` |
| 2 | `index.html` (raiz) — calculadora de ração | SDK web | `signInAnonymously()` — `index.html:978` | **Não** | Lê e escreve `racao` |
| 3 | `checkin.html` (raiz) — cadastro de FILHOts | SDK web | `signInAnonymously()` — `checkin.html:478` | **Não** | Lê `filhots` e `racao`; escreve `filhots/{uid}` |
| 4 | `gestao.html` (raiz) | — | **Não usa o Firebase.** Lê uma planilha do Google (`gestao.html:337`) e o relógio de `worldtimeapi.org` (`:443`). Protegida por um PIN fixo no código (`:340`) | — | Nada no banco |
| 5 | `integracao-telegram/Codigo.gs` — ponte do Telegram | REST | Login anônimo via `identitytoolkit` — `integracao-telegram/Codigo.gs:210-218` (`_fbToken`) | **Não** (Apps Script, servidor do Google) | Lê `daycare/atividade/{dia}/almoco2` e `daycare/cobranca-almoco2/{dia}`; escreve `daycare/cobranca-almoco2/{dia}` (`:232`, `_fbGravar`) |
| 6 | `integracao-planilha/Codigo.gs` — ponte da planilha da Hospedagem | — | **Não toca no Firebase** | — | Recebe POST do app e escreve na planilha do Google |
| 7 | `integracao-daycare/Codigo.gs` — ponte da planilha do Day Care | — | **Não toca no Firebase** | — | Recebe POST do app e escreve na planilha do Google |
| 8 | `tests/harness.js` — rede de testes | REST | Login anônimo — `tests/harness.js:53-58` (`anonToken`) | **Não** | **Só leitura** (`GET`, `tests/harness.js:61-64`); o único `POST` é o de obter o token anônimo (`:54`) |
| 9 | Script local da Adriana — carimbo da versão | REST com login anônimo (informado) | — | **Não** | Escreve `daycare/config/versao-app` |
| 10 | `auaulandia/painel-logica.js` | — | **Não toca no Firebase** | — | Só lógica de tela |

> **Item 9 — não verificado.** O script de carimbo não está neste repositório (a única referência a
> `daycare/config/versao-app` no código é a **leitura** em `auaulandia/index.html:9951`). Trato-o
> como descrito no briefing: REST + login anônimo, sem App Check.

### 1.1 Ramos e caminhos usados

**Ramo `auaulandia`** (lido e escrito pelo app, `auaulandia/index.html`):

| Caminho | Evidência (leitura) | Evidência (escrita) |
|---|---|---|
| `auaulandia/cadastro` | `:3745` | — |
| `auaulandia/manuais` | `:3773` | — |
| `auaulandia/estadias/{id}` | `:3798`, `:22774` | `:11215` (cancelar), `:6750` (aviso ao tutor) |
| `auaulandia/medicacao-agenda/{key}/itens/{id}` | `:6213`, `:7024` | `:6203`, `:6209`, `:6103` (`remove`), `:6334` (`transaction`), `:6389` |
| `auaulandia/avisos-estoque` | `:3785` | — |
| `auaulandia/avisos-racao/{id}` | `:3798` | `:6816`, `:6825`, `:6830`, `:24664` |
| `auaulandia/vet-recomendacoes`, `vet-reavaliacao`, `vet-observacoes` | `:3789`, `:3793`, `:3796` | — |
| `auaulandia/aparelhos/{deviceId}` — lista de celulares liberados | `:10277`, `:10056` | `:10081`, `:10285` |
| `auaulandia/avisos-barrados-dispensados/{aparelho}` | `:10057` | `:10036` |
| `auaulandia/config/acerto-plantao` — tabela de pagamento das plantonistas | `:9474` | `:9931` |
| `auaulandia/acerto-plantao/{iso}` — o acerto pago de cada noite | `:9475` | `:9846`, `:9877` |
| `auaulandia/config/plantonistas` | `:9233` | `:9296`, `:9633`, `:9643` |
| `auaulandia/orcamentos/{id}` — reservas com valores | `:8711` | `:8605` (`push`), `:8662`, `:8809`, `:8882`, `:8956`, `:8771` (`remove`) |
| `auaulandia/config/orcamento/precos`, `/feriados`, `/sheets` — **a tabela de preços** | `:9066` | `:9045`, `:9057`, `:9016` |
| `auaulandia/relatorios/{key}` | `:5540`, `:9369` | `:7343`, `:7464` |
| `auaulandia/medicacao-log/{dia}/{key}/{doseId}` — o registro de cada dose dada | `:7123` | `:7033`, `:7072` |
| `auaulandia/removidos/{dia}/{key}` | `:11132` | `:11083`, `:11096`, `:11164`, `:11229` |
| `auaulandia/pertences-banco/{k}` | `:21983` | `:22663`, `:22676` (`remove`), `:22690` |
| `auaulandia/vet-consultas/{key}/{id}` | `:12594` | `:12568` |
| `auaulandia/cafe/{dia}`, `auaulandia/cafe-turno/{dia}` | `:5302`, `:5303` | — |
| `auaulandia/checkout/{dia}` | `:19344` | `:19345`, `:19348` |
| **`auaulandia/config/telegram`** — **URL da ponte + palavra-chave** | `:7867`, `:16344`, `:16358`, `:17257` | **`:21045`** |

**Ramo `daycare`** (lido e escrito pelo app):

| Caminho | Evidência (leitura) | Evidência (escrita) |
|---|---|---|
| `daycare/cadastro/{key}` | `:3749` | `:5077` (alergia/restrição) |
| `daycare/fotos`, `daycare/fotos-v` | `:3693` | `:3701`, `:3702` |
| `daycare/reposicao` | `:3781` | — |
| `daycare/almoco-cad` | `:3761` | — |
| `daycare/banho-aviso/{dia}` | `:3759` | — |
| `daycare/atividade/{dia}/almoco2` | ponte, `Codigo.gs:224` | — |
| `daycare/auditoria/{dia}` — **o diário de quem fez o quê** | `:10052`, `:24995` | **`:21401`** (`push`) |
| `daycare/avisos-telegram-comida/{dia}` | `:24995` | `:17316` |
| `daycare/avisos-telegram-atraso/{dia}` | — | `:25090` (`transaction`), `:25139` |
| `daycare/cobranca-almoco2/{dia}` | ponte, `Codigo.gs:220` | ponte, `Codigo.gs:232` |
| **`daycare/config/monitores`** — **nome, papel, horário e SENHA de cada colaborador** | `:3763` | **`:10256`** |
| **`daycare/config/ponte-planilha`** — **URL da ponte + token** | `:20134`, `:20213` | **`:20180`**, `:20205` |
| `daycare/config/sensiveis` | `:3746` | `:13203` |
| `daycare/config/atividades` | `:3747` | `:15466` |
| `daycare/config/auditoria` | `:3762` | `:21390` |
| `daycare/config/versao-app` | `:9951` | script externo (não verificado) |
| `daycare/chamada/{dia}`, `daycare/checkin-corpo/{dia}`, `daycare/checkin-pertences/{dia}` | `:6652`, `:6653`, `:20973` | `:15332`, `:16566`, `:17155` |
| `daycare/checkin-hist/{k}`, `daycare/ocorrencias/{k}` | `:14843`, `:6603` | `:16570`, `:16575` |
| `daycare/med-dia/{dia}`, `daycare/conferir-medicacao/{dia}/{key}` | `:12113` | `:17187`, `:7481` |
| `daycare/alergia-confirmada/{k}` | `:17900` | `:18522`, `:18541`, `:18577` |
| `daycare/excluidos/{key}`, `daycare/trocas`, `daycare/irmaos`, `daycare/avulsos/{dia}` | `:4556`, `:16681`, `:15353` | `:15036`, `:4597`, `:16805`, `:16817` (`remove`), `:15411` |
| `daycare/pontos-checkout/{mes}`, `daycare/tempo-atividade/{dia}` | `:19654`, `:19539` | `:25689`, `:19563` |
| `daycare/dashboard/{dia}`, `daycare/dashboard-auto/{iso}`, `daycare/resumo-gestao/{dia}` | `:20084`, `:20620`, `:18879` | `:20434`, `:20735` (`remove`), `:20654`, `:18889` |

> São ~65 caminhos distintos de leitura e ~90 de escrita, todos dentro de `auaulandia/*` e
> `daycare/*`. A lista acima cobre os que importam para a análise de risco; a varredura completa
> confirmou que **não há escrita fora desses dois ramos** neste arquivo.

**Ramo `filhots`** — só as páginas da raiz: leitura em `checkin.html:481`; escrita em
`checkin.html:850-852`.

**Ramo `racao`** — leitura em `index.html:982` e `checkin.html:487`; escrita em `index.html:988`
e `index.html:1384`.

---

## 2. O que um atacante com login anônimo consegue fazer HOJE

### 2.1 Como as regras realmente funcionam

O arquivo é `database.rules.json`. A estrutura repetida nos quatro ramos é:

```json
".read": false, ".write": false,
"auaulandia": {
  ".read": "auth != null",
  ".write": false,
  "$colecao": {
    ".write": "auth != null && newData.exists()",
    "$item": { ".write": "auth != null" }
  }
}
```

Três fatos das regras do Firebase que mudam tudo na leitura desse arquivo:

1. **`.write: false` num nível superior não nega nada abaixo.** As regras só concedem; nunca negam.
   O `false` em `/auaulandia` (`database.rules.json:22`) impede escrever *naquele ponto exato* — e
   nada mais.
2. **Uma permissão concedida desce até o fim do galho.** O `.write: "auth != null"` de `$item`
   (`database.rules.json:25`) vale para `$item` e para **tudo que existe debaixo dele**, em qualquer
   profundidade.
3. **`newData.exists()` só barra o valor nulo.** Escrever `{"x":1}` por cima de uma coleção
   satisfaz `newData.exists()` — e substitui a coleção inteira.

### 2.2 O que está protegido (confirmado nas regras)

| Tentativa | Resultado | Por quê |
|---|---|---|
| Ler a raiz `/` | **Negado** | `database.rules.json:19` |
| Ler ou escrever sem login nenhum | **Negado** | todas as condições exigem `auth != null` |
| Criar ramo novo de topo (`/hackeado`) | **Negado** | raiz `.write:false` e não há curinga no topo |
| `DELETE /auaulandia.json` (apagar o ramo inteiro) | **Negado** | `:22` |
| `DELETE /auaulandia/cadastro.json` (apagar a coleção com valor nulo) | **Negado** | `newData.exists()` em `:24` |

Isso é real e vale o crédito: era muito pior antes de 29/jul/2026.

### 2.3 O que NÃO está protegido — e é grave

Tudo abaixo exige apenas um `POST` a `identitytoolkit.googleapis.com/v1/accounts:signUp` com a chave
que está no HTML público, e depois chamadas REST comuns. **Nenhuma senha da Zêluz é necessária.**

| # | O que o atacante faz | Como | Regra que permite |
|---|---|---|---|
| A | **Lê a base inteira de tutores e FILHOts** — nomes, telefones, endereços, alergias, medicações, relatórios, fotos | `GET /auaulandia.json`, `GET /daycare.json` | `.read: "auth != null"` — `:21`, `:30` |
| B | **Altera a dose de um remédio** de um hóspede | `PATCH /auaulandia/medicacao-agenda/{filhot}/itens/{id}.json` com `{"q":"4","u":"comprimido"}` | cascata do `$item` — `:25` |
| C | **Marca ou desmarca um FILHOt como "saiu"** / cancela uma estadia | `PATCH /auaulandia/estadias/{id}.json` com `{"status":"cancelada"}` | cascata do `$item` — `:25` |
| D | **Apaga o diário de auditoria de um dia inteiro, em um comando** | `DELETE /daycare/auditoria/2026-08-28.json` | `$item` **não tem** `newData.exists()` — `:34` |
| E | **Apaga um FILHOt do cadastro** | `DELETE /auaulandia/cadastro/{key}.json` | idem — `:25` |
| F | **Destrói uma coleção inteira** (cadastro, estadias, agenda de medicação) sem usar delete | `PUT /auaulandia/cadastro.json` com `{"x":1}` | `newData.exists()` é satisfeito — `:24` |
| G | **Lê as senhas de toda a equipe em texto puro** | `GET /daycare/config/monitores.json` | `.read` do ramo — `:30`; escrita do app em `auaulandia/index.html:10256` grava `senha` em claro |
| H | **Cria para si um acesso de Gestão** que vale em todos os celulares | `PUT /daycare/config/monitores.json` com um item `{"id":"x","nome":"Manutenção","senha":"7777","role":"gestao"}` | `$item` — `:34`; o app aceita o `role` do banco em `auaulandia/index.html:10014` |
| I | **Libera o próprio celular** na trava de aparelho | `PUT /auaulandia/aparelhos/{qualquer-id}.json` | `$item` — `:25`; leitura da trava em `auaulandia/index.html:10277` |
| J | **Rouba a palavra-chave das duas pontes do Google** | `GET /auaulandia/config/telegram.json` e `GET /daycare/config/ponte-planilha.json` | `.read` — `:21`, `:30`; gravadas em claro em `auaulandia/index.html:21045` e `:20180` |
| K | **Desliga os avisos ao grupo** apagando ou trocando a configuração do Telegram | `PUT /auaulandia/config/telegram.json` com `{"url":"","senha":""}` | `$item` — `:25` |
| L | **Enche o banco de lixo até o plano Spark desativar o serviço** | `PUT /auaulandia/lixo-1.json`, `-2`, `-3`… (nomes novos são aceitos pelo curinga `$colecao`) | `:24` |
| M | **Faz o app da equipe inteira recarregar** ou exibir aviso falso de versão | `PUT /daycare/config/versao-app.json` | `$item` — `:34`; leitura em `auaulandia/index.html:9951` |
| N | **Altera a tabela de preços da hospedagem** — o próximo orçamento sai com o valor do atacante | `PUT /auaulandia/config/orcamento/precos.json` | `$item` — `:25`; leitura em `auaulandia/index.html:9066`, escrita legítima em `:9045` |
| O | **Mexe no acerto das plantonistas** — o que a Zêluz paga por noite | `PATCH /auaulandia/acerto-plantao/{data}.json` ou `PUT /auaulandia/config/acerto-plantao.json` | `$item` — `:25`; escritas legítimas em `:9846`, `:9931` |
| P | **Apaga o registro de doses já administradas** | `DELETE /auaulandia/medicacao-log/{dia}.json` | `$item` — `:25`; escrita legítima em `auaulandia/index.html:7033` |

**Correção de rota em relação ao documento anterior.** O `AUDITORIA-FASE0-FASE1.md` (linha 47) e o
`SEGURANCA.md` registram "apagar coleção inteira → 401 negado". Isso é verdade **apenas para o
`DELETE`**. Os itens **D** e **F** acima mostram que o mesmo efeito destrutivo continua a um comando
de distância — por cima (`PUT` com valor bobo) ou um nível abaixo (`DELETE` no `$item`). A frase
"ninguém apaga uma coleção inteira" do cabeçalho do `database.rules.json:6` **não se sustenta**.

> **Não testado ao vivo nesta auditoria.** Não executei nenhuma dessas chamadas: a auditoria é
> somente leitura e um `accounts:signUp` cria uma conta anônima no projeto. A análise é a leitura
> literal do `database.rules.json`. O que já foi testado de fora, em 22/ago/2026 e registrado em
> `AUDITORIA-FASE0-FASE1.md:44-47`, confirma a base: leitura anônima de `daycare/*` → **200**;
> escrita anônima item a item em `daycare/*` → **200**.

---

## 3. Segredos no repositório e no HTML publicado

### 3.1 O que é público por natureza — e não é vazamento

| Item | Onde | Veredito |
|---|---|---|
| Chave web do Firebase `AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28` | `auaulandia/index.html:3712`, `index.html:827`, `checkin.html:442`, `integracao-telegram/Codigo.gs:200`, `tests/harness.js:28` | **Não é segredo.** É identificador de projeto, obrigatoriamente visível em todo app web. Trocá-la não protege nada. |
| Site key do App Check `6Lc9zmotAAAAADTA2O4DGzmZakZxqWPLWMIL0RB1` | `auaulandia/index.html:3709` | **Não é segredo.** É a metade pública do reCAPTCHA v3; a metade secreta fica no Console. |
| `projectId`, `databaseURL`, `appId`, `messagingSenderId` | `auaulandia/index.html:3713-3718` | **Não é segredo.** |

Fica registrado para não se perder tempo trocando o que não protege: a proteção do Firebase nunca
foi a chave — é a regra do banco somada ao App Check.

### 3.2 Segredos de verdade — o que está exposto

| # | Segredo | Onde | Situação |
|---|---|---|---|
| S1 | **Senha da Gestão (Adriana `1101`, Márcia `0902`) e do Plantão (`1001`)** | `auaulandia/index.html:9979-9981` | **Em texto puro, num HTML público na internet.** |
| S2 | **Senhas padrão dos 6 monitores (`1005`, `1007`–`1011`)** | `auaulandia/index.html:9997-10002` | **Em texto puro, no mesmo HTML público.** |
| S3 | **Senhas reais de toda a equipe** (as cadastradas em Time → Colaboradores) | banco, `daycare/config/monitores`; gravadas por `auaulandia/index.html:10256` | **Legíveis por qualquer login anônimo.** |
| S4 | **Palavra-chave da ponte da planilha da Hospedagem: `zeluz-auaulandia`** | `integracao-planilha/Codigo.gs:24` | **Segredo real, versionado num repositório público.** É o que impede um estranho de escrever na planilha do financeiro. |
| S5 | **URL + palavra-chave da ponte do Telegram** | banco, `auaulandia/config/telegram`; gravadas por `auaulandia/index.html:21045` | Legíveis por qualquer login anônimo. Rende poder de postar nos 4 grupos. |
| S6 | **URL + token da ponte da planilha do Day Care** | banco, `daycare/config/ponte-planilha`; gravados por `auaulandia/index.html:20180` | Legíveis por qualquer login anônimo. |
| S7 | **IDs dos 4 grupos do Telegram** (`-5484669898`, `-5460714392`, `-5388577278`, `-5486234450`) | `integracao-telegram/Codigo.gs:26-33` | Baixa gravidade sozinho: sem o token do bot, o id não abre porta. Vira munição quando somado a S5. |
| S8 | **PIN do painel da Gestão: `1007`** | `gestao.html:340` — `const PIN_CORRETO='1007';` | **Em texto puro num HTML público.** Agravante: é exatamente a senha padrão do Monitor 3 (`auaulandia/index.html:9999`) — o mesmo número abre duas portas diferentes. |
| S9 | **ID da planilha de hóspedes** `1SJ3OZ6E2wMa1JHrQUcgtNffgQLQhCpa01IUQKCv605w` | `gestao.html:337`, `index.html:821`, `checkin.html:451` | As três páginas leem essa planilha do navegador, sem login. Isso só funciona se a planilha estiver compartilhada como "qualquer pessoa com o link". Nesse caso, **o calendário completo de hóspedes é público** para quem ler o código-fonte. *(A configuração de compartilhamento da planilha está no Google Drive — **não verificado** nesta auditoria.)* |

### 3.3 O que **não** foi encontrado — e é uma boa notícia

Varri a árvore de trabalho e o histórico do git (`git log --all -p`, com filtro por padrão de token):

- **Token do bot do Telegram: nunca foi commitado.** No arquivo está o marcador
  `COLE_AQUI_O_TOKEN` (`integracao-telegram/Codigo.gs:20`). No histórico só existem os marcadores
  antigos (`COLE_AQUI_O_TOKEN_DO_BOTFATHER`) e um exemplo fictício de documentação
  (`8123456789:AAH1a2B3c4D5e6F7g8H9i0J...`). Nenhuma ocorrência do padrão real
  `\d{8,10}:AA[\w-]{30,}` em toda a história do repositório.
- **Token da ponte do Day Care: também não.** Está `COLE_AQUI_UMA_SENHA_SUA`
  (`integracao-daycare/Codigo.gs:42`).
- **Nenhuma chave privada, conta de serviço ou `.env`.** Zero ocorrências de `BEGIN PRIVATE KEY`,
  `service_account` ou `private_key`. O `.gitignore` (linhas 7-26) já cobre esses padrões.
- **Nenhum CPF ou telefone** em `docs/` ou nos `.md` da raiz.
- Apenas **uma** chave `AIza` em toda a história — a chave web pública, que é a mesma de hoje.

---

## 4. A senha por papel

**Onde fica.** Em dois lugares, os dois legíveis por qualquer um:

1. Os acessos fixos da Gestão, no próprio HTML público — `auaulandia/index.html:9978-9985`.
2. Os acessos de toda a equipe, no banco em `daycare/config/monitores`, gravados em claro pelo
   próprio app — `auaulandia/index.html:10256`.

**Como é comparada.** No navegador, por igualdade direta de texto. `senhasRuntime()`
(`auaulandia/index.html:10007-10015`) junta os dois mapas; `doLogin()` faz
`const u = senhasRuntime()[v]` (`auaulandia/index.html:10289`) e, se achou, grava a sessão com
`sessionStorage.setItem('zeluz_login', JSON.stringify(u))` (`:10302`).

**O que isso significa na prática.** A senha não é o portão — ela é apenas a chave de um dicionário
que já está na página. **Não é preciso nem descobrir a senha:** basta abrir o console do navegador,
escrever `sessionStorage.zeluz_login = '{"role":"diretoria","nome":"Manutenção"}'` e recarregar. Todo
o controle de papéis do app (`podePapel()`, `auaulandia/index.html:4003`; `podeVerSenhas()`, `:4010`;
`canEditMed()`, `:5937`) lê dessa mesma sessão. É organização de equipe, não segurança — o que o
`SEGURANCA.md` já dizia, e continua verdade.

**Dá para ler as senhas do banco com login anônimo?** **Sim.** `GET /daycare/config/monitores.json`
com um token anônimo devolve o vetor completo com `nome`, `role`, `senha`, `entrada`, `saida` e
`paginas` de cada pessoa. A tela que a Adriana pediu para esconder a senha até da Gestão
(`auaulandia/index.html:3186-3191`) protege a tela — não protege o dado.

**Agravante que anula a defesa:** a trava por aparelho (`auaulandia/index.html:10269-10287`) é a
única barreira além da senha, e ela também mora no banco em `auaulandia/aparelhos/{id}` — gravável
por qualquer anônimo (item **I** da seção 2.3). Quem quiser entrar pelo app de verdade se
autoriza sozinho.

---

## 5. A ponte do Telegram (`integracao-telegram/Codigo.gs`)

**Como obtém o token do Firebase.** Faz o mesmo login anônimo do app, por REST, com a mesma chave
pública: `_fbToken()` chama `identitytoolkit.googleapis.com/v1/accounts:signUp?key=FB_KEY`
(`integracao-telegram/Codigo.gs:210-218`). A chave está em `:200`.

**O token do bot está no código?** **Não.** `var TOKEN_BOT = 'COLE_AQUI_O_TOKEN';`
(`integracao-telegram/Codigo.gs:20`). Ele vive apenas dentro do Apps Script publicado, o que está
correto. O comentário em `auaulandia/index.html:3357` reforça a regra e ela foi cumprida.

**O que está no código e é segredo:** a palavra-chave compartilhada
`var SENHA = 'zeluz-auaulandia'` (`integracao-telegram/Codigo.gs:21`) — a mesma string do
`integracao-planilha/Codigo.gs:24`. É a única coisa que separa a internet dos grupos do Telegram da
Zêluz, e está tanto no repositório público quanto no banco lido por anônimos.

**O que a ponte grava.** No Firebase, um único caminho:
`daycare/cobranca-almoco2/{dia}` = `{ts, por:'ponte', hora}` (`integracao-telegram/Codigo.gs:232`,
via `_fbGravar`, `:227`). No Telegram, envia texto e foto para os 4 grupos (`:100`, `:117`).

**O que quebra se as regras exigirem mais que `auth != null`.** Três coisas, nesta ordem:

1. **A leitura de `daycare/atividade/{dia}/almoco2` e de `daycare/cobranca-almoco2/{dia}`**
   (`:220`, `:224`) para de funcionar se a leitura passar a exigir papel. Efeito: o vigia das 16h20
   sai calado — e o defeito que ele foi criado para consertar (silêncio que tem dois significados)
   volta, agora sem ninguém saber.
2. **A gravação da trava diária** (`:232`) falha. Como `_fbGravar` engole o erro num `catch` vazio
   (`:229-234`), a ponte reenviaria o aviso a cada 15 minutos dentro da janela, até as 17h20 — quatro
   ou cinco mensagens repetidas no grupo, todo dia.
3. **Se o App Check for imposto**, a ponte é barrada **antes** das regras: o Apps Script não roda no
   site e não tem como produzir a prova do reCAPTCHA. Ela quebra por inteiro.

Consequência de projeto: qualquer aperto nas regras exige dar à ponte uma identidade própria — uma
conta de serviço, ou um usuário e-mail/senha dedicado, ou um token com claim `ponte`. Não dá para
apertar as regras e deixar a ponte no login anônimo.

**Efeito colateral já hoje.** Um estranho que leia `auaulandia/config/telegram` obtém a URL `/exec`
e a palavra-chave, e passa a poder postar texto e foto em qualquer um dos 4 grupos — inclusive no
"Zêluz · Plantão AuAulândia", que é o grupo da Gestão. Uma mensagem falsa de emergência veterinária,
com a cara das mensagens reais, é trivial.

---

## 6. Plano de correção — etapas pequenas e reversíveis

Ordenado do maior risco para o menor. Cada etapa é independente: dá para parar em qualquer ponto.

---

### Etapa 1 — App Check em "Impor" (1 clique da Adriana, depois de conferir o monitoramento)

**O que muda.** O Firebase passa a exigir a prova do reCAPTCHA v3 **antes** de olhar as regras. Todo
acesso que não venha do site `zoeharus-art.github.io` é barrado: `curl`, HTML copiado, Postman,
script de fora.

**O que cobre.** Fecha a porta para o estranho anônimo — os itens **A** a **M** da seção 2.3 deixam
de ser alcançáveis de fora. É, de longe, a maior redução de risco por unidade de esforço.

**O que NÃO cobre — e precisa ficar claro.**
- Não separa papéis. Um Zeloso com o app aberto continua podendo tudo (seção 4).
- Não protege as senhas do banco de quem já usa o app.
- Não protege contra um celular da equipe perdido ou emprestado.
- Não impede que alguém copie um token do App Check do próprio navegador e o reutilize por alguns
  minutos.

**O que pode quebrar — e é MUITO:**

| Consumidor | O que acontece com o "Impor" ligado |
|---|---|
| `auaulandia/index.html` (app da equipe) | **Continua funcionando** — é o único com App Check (`:3729`) |
| `index.html` (calculadora de ração) | **Quebra** — sem App Check (`index.html:975`) |
| `checkin.html` (cadastro) | **Quebra** — sem App Check (`checkin.html:476`) |
| `integracao-telegram/Codigo.gs` (vigia do almoço) | **Quebra** — Apps Script não produz a prova |
| Script de carimbo da versão | **Quebra** |
| `tests/harness.js` | **Quebra** — a rede de testes para de rodar |

**Como testar ANTES de aplicar.** No Console do Firebase → App Check → aba **Métricas** do Realtime
Database. Ela mostra, dos últimos 7 dias, quantas requisições vieram **verificadas** e quantas
vieram **sem prova**. Só ligar o "Impor" quando o volume "sem prova" for igual ao esperado dos
consumidores da tabela acima — porque é exatamente esse volume que vai morrer. Se aparecer volume
"sem prova" que não se explica pela tabela, **parar e investigar antes**: é equipe usando alguma
coisa que ninguém mapeou.

**Como reverter.** No mesmo lugar, "Não imposto". Efeito em minutos. Não há perda de dado.

**Recomendação honesta.** Ligar o "Impor" **só depois** da Etapa 2 — porque ela conserta os
consumidores que quebrariam. Ligar hoje derruba a ração, o cadastro do check-in, o vigia do almoço e
o harness, de uma vez.

---

### Etapa 2 — Preparar os cinco consumidores que quebram

**O que muda.**
1. Copiar as três linhas de App Check de `auaulandia/index.html:3727-3731` para `index.html` e
   `checkin.html`, com a mesma site key. São páginas do mesmo domínio, logo a prova é válida.
2. Para as pontes e o carimbo, registrar um **token de depuração** do App Check no Console (App
   Check → app web → Gerenciar tokens de depuração) e passá-lo nas chamadas REST. É o caminho oficial
   do Firebase para servidor e teste, custa R$ 0,00 e não exige plano pago.
3. Para o `tests/harness.js`, o mesmo token de depuração, lido de variável de ambiente — nunca
   escrito no arquivo (o repositório é público).

**O que pode quebrar.** Nada em produção: acrescentar App Check no cliente é inerte enquanto o
"Impor" estiver desligado, exatamente como já aconteceu quando a chave foi colada no app.

**Como testar.** Abrir `index.html` e `checkin.html`, salvar alguma coisa, conferir no console do
navegador que não há erro. Rodar `node tests/harness.js` — tem de continuar 225/225. Rodar
`vigiaAlmoco2_TESTE()` no editor do Apps Script (`integracao-telegram/Codigo.gs:250`) — tem de
imprimir `token: ok`.

**Como reverter.** Remover as linhas acrescentadas. São três linhas por arquivo.

---

### Etapa 3 — Tirar as senhas do banco e do HTML

**O que muda.** Parar de gravar `senha` em texto puro em `daycare/config/monitores`. Guardar no
lugar um resumo irreversível: `hash = SHA-256(senha + sal_fixo)`. O app compara o hash do que foi
digitado com o hash guardado — a experiência da equipe não muda em nada, continua o mesmo PIN de 4
dígitos. E apagar as senhas fixas do HTML (`auaulandia/index.html:9979-9981`, `:9997-10002`),
movendo a Gestão para o mesmo cadastro.

**Reconhecendo o limite.** Com 4 dígitos, um hash é quebrável por força bruta em segundos (10 mil
combinações). Portanto isto **não** é a solução — é apenas parar de entregar a lista pronta. A
solução de verdade é a Etapa 5.

**O que pode quebrar.** O relatório de senhas da Gestão (`renderSenhas()`,
`auaulandia/index.html:10021`) deixa de conseguir mostrar a senha — passa a mostrar apenas quem tem
acesso, com um botão "definir nova senha". Isso é justamente o que a Adriana pediu em 19/ago/2026
(`auaulandia/index.html:3186-3191`). Risco real: se alguém esquecer o PIN, só a Gestão redefine.

**Como testar.** Rodar o harness com o novo formato e um `daycare/config/monitores` de teste, e
entrar no app com cada papel antes de publicar.

**Como reverter.** O código antigo aceita o campo `senha`; manter a leitura dos dois formatos por
duas semanas torna a volta atrás instantânea.

---

### Etapa 4 — Apertar as regras sem depender de papel

Mesmo sem servidor, dá para fechar buracos que hoje estão abertos por descuido, não por necessidade.

**O que muda em `database.rules.json`:**

| Mudança | Fecha qual item da 2.3 |
|---|---|
| Trocar `$item { ".write": "auth != null" }` por `".write": "auth != null && (newData.exists() \|\| data.child('_del').exists())"` em `daycare/auditoria` — ou, mais simples, dar a `daycare/auditoria` regra própria com `".write": "!data.exists()"` (só cria, nunca altera nem apaga) | **D** — diário de auditoria vira à prova de apagamento |
| Regra própria para `daycare/config` e `auaulandia/config` com `".read"` e `".write"` restritos (por ora, `false` para escrita externa e leitura só do que o app precisa) | **G**, **J**, **K**, **M** |
| Fixar a lista de coleções permitidas em vez do curinga `$colecao` (enumerar `cadastro`, `estadias`, `manuais`, …) | **L** — nome novo deixa de ser aceito |
| Validações de forma: `.validate` de tipo e tamanho nos campos de dose e status | limita **B** e **C** a valores plausíveis |

**O que pode quebrar.** Este é o ponto mais delicado do plano. Enumerar coleções quebra qualquer
caminho novo que o app criar e que ninguém lembrar de acrescentar à regra — e a falha vai ser
**silenciosa**, porque quase toda gravação do app termina em `.catch(function(){})` vazio (padrão já
mapeado em `docs/auditoria-25ago2026/01-gravacoes-mudas.md`).

**Como testar ANTES de aplicar — e este teste existe e é grátis.** O emulador do Firebase roda local:

```
firebase emulators:start --only database
```

Com as regras candidatas carregadas, apontar o harness para o emulador e rodar as 225 verificações.
Depois, rodar à mão a lista de caminhos da seção 1.1 — cada `set`, `update`, `push` e `remove` do app
— e conferir que todos continuam **200**. Só publicar quando a lista inteira passar.

**Como reverter.** O Console do Firebase guarda o histórico de regras: reverter é escolher a versão
anterior e publicar. Menos de um minuto.

---

### Etapa 5 — Regras por papel de verdade (o que dá e o que não dá de graça)

A pergunta central: dá para o banco saber **quem** está pedindo, sem servidor e sem sair do plano
Spark?

**A resposta honesta, item por item:**

| Caminho | Funciona no Spark? | Por quê |
|---|---|---|
| **Cloud Functions** para emitir token com papel | **Não.** | O plano Spark deixou de permitir a implantação de Cloud Functions. Exige o plano Blaze (pago por uso). |
| **Custom Claims pelo Admin SDK, rodando na VPS da Kairós** | **Sim, e custa R$ 0,00.** | O Admin SDK é uma biblioteca, não um produto pago. Roda em qualquer servidor. A Zêluz já paga a VPS `kairospresenca.com.br`. É exatamente o caminho que o `SEGURANCA.md` já recomendava. |
| **Custom Claims sem servidor nenhum** | **Não.** | Emitir um token assinado exige a chave privada da conta de serviço. Colocá-la no navegador entrega o projeto inteiro para quem abrir o HTML. Não existe atalho. |
| **Firebase Auth com e-mail/senha por pessoa, sem claims** | **Sim, de graça** — mas resolve pela metade. | As regras passam a conhecer o `auth.uid`. Dá para escrever `".write": "root.child('papeis/'+auth.uid+'/role').val() === 'gestao'"`, com o mapa de papéis num nó que só a Gestão escreve. Funciona, é grátis, e não precisa de servidor. **Preço:** cada Zeloso precisa de uma conta (o PIN de 4 dígitos vira senha de conta), e o cadastro de gente passa a ter dois lugares. |

**Recomendação.** Duas rotas, e a decisão é da Adriana:

- **Rota A — VPS (a do `SEGURANCA.md`).** Um endereço pequeno na Kairós recebe o PIN, confere contra
  a lista **no servidor** e devolve um token do Firebase com o papel dentro. A equipe continua
  digitando o mesmo PIN — nada muda para elas. Custo R$ 0,00. Precisa de: uma chave de conta de
  serviço baixada do Console. **Mais trabalho de montagem, experiência idêntica para a equipe.**
- **Rota B — Auth nativo + nó de papéis.** Sem servidor nenhum, sem chave de conta de serviço. A
  equipe passa a entrar com um usuário. **Menos trabalho, experiência diferente para a equipe.**

A Rota A preserva o que já funciona; a Rota B é mais rápida de chegar em pé. Nenhuma das duas exige
sair do plano gratuito.

---

### Etapa 6 — Trocar as palavras-chave das pontes

**O que muda.** A palavra-chave `zeluz-auaulandia` está num repositório público
(`integracao-planilha/Codigo.gs:24`) desde que foi commitada, e no banco lido por anônimos. Trocar
por uma string longa e aleatória, **sem escrevê-la no repositório** — só no Apps Script publicado e
no campo de configuração do app.

**O que pode quebrar.** Os avisos ao Telegram e a gravação na planilha param no instante em que a
ponte é republicada e antes de a nova palavra ser salva no app. Janela de alguns minutos, e a falha é
silenciosa nos dois lados.

**Como testar.** Publicar a nova versão da ponte, abrir a URL `/exec` no navegador (`doGet` responde
"ponte no ar"), salvar a nova palavra em Configurações e disparar um aviso de teste. Só então
considerar feito.

**Como reverter.** Voltar a implantação anterior no Apps Script e a palavra antiga no app.

**Observação.** Trocar a palavra **não** resolve o problema de fundo enquanto ela continuar guardada
em claro num nó que qualquer anônimo lê (S5, S6). Esta etapa só vale de verdade depois da Etapa 1 ou
da Etapa 4.

---

### Etapa 7 — Conferir a planilha e o PIN do painel da Gestão

Esta etapa é fora do Firebase, e por isso **nenhuma das etapas anteriores a resolve**.

**O que muda.**
1. Abrir a planilha `1SJ3OZ6E2wMa1JHrQUcgtNffgQLQhCpa01IUQKCv605w` no Google Drive e verificar o
   compartilhamento. Se estiver como "qualquer pessoa com o link", o calendário de hóspedes está
   público. O `gestao.html`, o `index.html` e o `checkin.html` leem essa planilha direto do
   navegador (`gestao.html:337`, `index.html:821`, `checkin.html:451`) — logo, ou ela está aberta,
   ou essas três páginas não funcionam hoje.
2. Trocar o `PIN_CORRETO='1007'` de `gestao.html:340` — está em texto puro num arquivo público, e é
   a mesma senha padrão do Monitor 3 (`auaulandia/index.html:9999`). Um número não deve abrir duas
   portas diferentes.

**O que pode quebrar.** Fechar a planilha derruba as três páginas até que elas passem a ler o dado
por outro caminho (a ponte do Apps Script, que já existe, ou o próprio Firebase).

**Como testar.** Abrir a URL `gviz` da planilha numa janela anônima do navegador. Se responder com
dados, está pública.

**Como reverter.** Voltar o compartilhamento anterior no Drive; voltar o PIN antigo no arquivo.

---

## 7. Classificação dos achados

| # | Achado | Nível | O que acontece de pior |
|---|---|---|---|
| 1 | Leitura anônima de `auaulandia/*` e `daycare/*` (`database.rules.json:21`, `:30`) | **Crítico** | A base completa de tutores, FILHOts, endereços, alergias, medicações e fotos vaza para quem tiver o endereço do app — e a Zêluz descobre pelo Instagram. |
| 2 | Escrita anônima item a item, com cascata para tudo abaixo (`database.rules.json:25`, `:34`) | **Crítico** | Um estranho altera a dose de um remédio de um hóspede e a plantonista administra o que está na tela. Dano físico a um FILHOt. |
| 3 | `$item` sem `newData.exists()` — apagar um dia inteiro de auditoria em um comando (`database.rules.json:34`) | **Crítico** | Some o registro de quem fez o quê no dia de um incidente. Não há como reconstruir a história nem responder ao tutor. |
| 4 | `PUT` com valor bobo destrói uma coleção inteira, apesar do `newData.exists()` (`database.rules.json:24`) | **Crítico** | `auaulandia/cadastro` vira `{"x":1}` e a casa perde o cadastro de todos os FILHOts. A proteção que o `SEGURANCA.md` anuncia não existe. |
| 5 | Senhas de toda a equipe em texto puro no banco, legíveis por anônimo (`auaulandia/index.html:10256`) | **Crítico** | A lista completa de acessos, com nome e papel, é baixada num comando. |
| 6 | Escalada de privilégio via `daycare/config/monitores` (`auaulandia/index.html:10014`) | **Crítico** | O atacante cria para si um acesso `gestao` que passa a valer em todos os celulares da casa. |
| 7 | Senha da Gestão em texto puro num HTML público (`auaulandia/index.html:9979-9981`) | **Alto** | Qualquer pessoa que abra o código-fonte da página entra como Adriana. |
| 8 | URL e palavra-chave das pontes legíveis por anônimo (`auaulandia/index.html:21045`, `:20180`) | **Alto** | Mensagem falsa de emergência veterinária no grupo da Gestão, ou linhas plantadas/apagadas na planilha do financeiro. |
| 9 | Palavra-chave `zeluz-auaulandia` versionada em repositório público (`integracao-planilha/Codigo.gs:24`) | **Alto** | Escrita livre na planilha da Hospedagem por quem ler o repositório. |
| 10 | Controle de papéis inteiramente no navegador (`auaulandia/index.html:10289`, `:10302`) | **Alto** | Uma linha no console do navegador transforma qualquer pessoa em Diretoria — sem precisar de senha nenhuma. |
| 11 | Trava por aparelho gravável por anônimo (`auaulandia/index.html:10285`) | **Alto** | O atacante autoriza o próprio celular e passa a usar o app de verdade, com a interface completa. |
| 12 | Curinga `$colecao` aceita nomes novos — enchimento do banco (`database.rules.json:24`) | **Alto** | O plano Spark **desativa** o banco ao estourar a cota. O app da casa inteira para, no meio do plantão. |
| 13 | App Check ativo no cliente mas **não** imposto (`auaulandia/index.html:3729`; Console) | **Alto** | Todos os itens acima continuam alcançáveis de fora. É o interruptor que ainda não foi ligado. *(Estado do Console informado no briefing — não verificado por mim.)* |
| 14 | `index.html:1384` escreve em `racao` (nível de ramo), o que as regras negam desde 29/jul | **Médio** | A calculadora de ração pode estar sem salvar há um mês, e o erro só aparece no console (`console.error`). *(Não testado ao vivo — leitura das regras.)* |
| 15 | `checkin.html:851` apaga `filhots/{uid}` num `update` atômico, o que `newData.exists()` nega | **Médio** | Renomear um FILHOt no check-in falha por inteiro; o toast diz "Erro ao salvar" sem dizer por quê. *(Não testado ao vivo.)* |
| 16 | `_fbGravar` da ponte engole erro em `catch` vazio (`integracao-telegram/Codigo.gs:229-234`) | **Médio** | Se a gravação da trava falhar, o grupo recebe a mesma cobrança 4 ou 5 vezes por dia, e ninguém sabe por quê. |
| 17 | `index.html` e `checkin.html` sem App Check (`index.html:975`, `checkin.html:476`) | **Médio** | Ligar o "Impor" derruba as duas páginas sem aviso. |
| 18 | `daycare/config/versao-app` gravável por anônimo (`auaulandia/index.html:9951`) | **Baixo** | Aviso falso de versão nova em todos os celulares — incômodo, não perda de dado. |
| 19 | IDs dos 4 grupos do Telegram no repositório (`integracao-telegram/Codigo.gs:26-33`) | **Baixo** | Sozinhos não abrem porta; só têm valor somados ao achado 8. |
| 20 | `AUDITORIA-FASE0-FASE1.md:47` e `database.rules.json:6` afirmam proteção que não existe | **Baixo** | Documentação que tranquiliza sobre um risco aberto é pior que documentação nenhuma. |
| 21 | Tabela de preços e acerto das plantonistas graváveis por anônimo (`auaulandia/index.html:9045`, `:9931`, `:9846`) | **Alto** | O orçamento seguinte sai com o preço de outra pessoa, ou o acerto da noite é adulterado — e o erro aparece no bolso de alguém. |
| 22 | Registro de doses administradas apagável por anônimo (`auaulandia/index.html:7033`) | **Alto** | Some a prova de que o remédio foi dado. Numa disputa com o tutor, a Zêluz não tem o que mostrar. |
| 23 | PIN `1007` em texto puro em `gestao.html:340`, igual à senha padrão do Monitor 3 (`auaulandia/index.html:9999`) | **Alto** | Quem abre o código-fonte do painel da Gestão entra nele — e descobre, de brinde, uma senha do app. |
| 24 | `SHEET_ID` da planilha de hóspedes em três HTMLs públicos (`gestao.html:337`, `index.html:821`, `checkin.html:451`) | **Alto** (se a planilha estiver aberta por link) | O calendário completo de quem está hospedado, com nomes, fica legível para qualquer pessoa. *(Compartilhamento não verificado.)* |

---

## 8. O primeiro passo, se for para fazer só um

**Etapa 2, depois Etapa 1.** Acrescentar App Check nas duas páginas da raiz e um token de depuração
nas pontes (Etapa 2) leva algumas horas e não muda nada em produção. Feito isso, o "Impor" (Etapa 1)
é um clique da Adriana e fecha, de uma vez, quatorze dos vinte e quatro achados desta lista — todos
os que dependem de alcançar o banco de fora.

**Duas coisas que o App Check não alcança, e é preciso dizer com todas as letras:**

- Os achados **23** e **24** (PIN do painel da Gestão e planilha de hóspedes) não passam pelo
  Firebase. Só a Etapa 7 os resolve, e ela é rápida.
- O achado **10** (papel decidido no navegador) continua exatamente como está. Enquanto o papel for
  decidido no navegador, o app protege a Zêluz de estranhos — nunca de quem já tem o app aberto.
  Isso é a Etapa 5, é trabalho maior, e pode esperar; mas não deve esperar muito.

---

*Auditoria conduzida em 28/ago/2026. Somente leitura: nenhum arquivo do repositório foi alterado,
nada foi gravado no Firebase e nenhum commit foi feito. Onde não foi possível verificar, está
escrito "não verificado" com o motivo.*
