# Backend local RH 151

Pacote preparado para revisão. Não está instalado, ligado ao Firebase, publicado ou executando como servidor.

## O que contém

- `auth.js`: geração dos dois verificadores, autenticação, rate limit e sessões bearer em RAM.
- `dados.js`: CRUD transacional da Entrevista 150 no prefixo fixo `rh-entrevistas-v1/entrevistas`.
- `api.js`: cinco rotas HTTP, CORS exato e `criarServidor()` sem `listen()` automático.
- `startup.modelo.js`: composição injetável e fail closed; não importa Firebase Admin.
- `config.modelo.json`: formato documental deliberadamente inválido para produção, sem segredos.
- `*.test.cjs`: provas locais com banco, HTTP, relógio e cliente falsos.

## Garantias implementadas

- somente os IDs internos `adriana` e `marcia` existem no autenticador;
- cada segredo tem 12 a 128 caracteres; a geração rejeita duas senhas iguais;
- `crypto.scrypt`: `N=32768`, `r=8`, `p=1`, salt de 32 bytes, hash de 64 bytes e `maxmem=64 MiB`;
- nenhum PIN do app, senha compartilhada, role ou nome enviado pelo navegador autentica;
- bearer aleatório de 32 bytes em base64url (43 caracteres);
- a RAM guarda a chave SHA-256 do bearer, não o bearer bruto;
- TTL absoluto com teto de 12 horas e revogação por saída/principal;
- rate limit por IP confiável global e por IP + principal;
- limite global e por IP para scrypt concorrente;
- limites explícitos para sessões e entradas dos mapas de falha;
- nenhum cookie; CORS aceita apenas origens HTTPS exatas;
- respostas usam `Cache-Control: no-store`;
- token, segredo, host e stack não aparecem nas respostas;
- autoria é derivada da sessão;
- corpo não aceita `role`, `autor`, `path` ou campos clínicos;
- idempotência, CAS, histórico, revisão e ACK da Frente 150 permanecem;
- leitura usa um observador de primeiro snapshot, removido no sucesso, erro ou timeout;
- corpo HTTP lento também expira e remove todos os listeners;
- a sessão é revalidada dentro de cada retry da transação e antes de devolver o ACK;
- consulta mensal única e limitada ao mês;
- não existe rota genérica de banco nem caminho fornecido pelo cliente.

## Contrato HTTP

Relativo ao endereço RH configurado:

- `POST /sessao`
- `POST /sessao/sair`
- `GET /entrevistas?dia=AAAA-MM-DD`
- `GET /entrevistas?mes=AAAA-MM`
- `POST /entrevistas`

Todas as respostas estruturadas usam `versao: 151`. `expiraEm` é timestamp Unix em milissegundos. O ACK de escrita é o ACK150 acrescido de `versao: 151`.

## Configuração real obrigatória

`config.modelo.json` não pode ser usado diretamente: `startup.modelo.js` rejeita `modelo: true`.

Antes de preparar configuração real, ainda é preciso confirmar:

1. conexão Admin SDK/databaseURL já existente e correspondente ao banco correto;
2. regras vivas mantendo o novo namespace negado aos clientes;
3. origem HTTPS exata do frontend;
4. IP confiável fornecido pelo adaptador do proxy reverso;
5. TTL, timeout de corpo, janela, bloqueio, falhas, concorrência scrypt, sessões e tamanho dos mapas aprovados;
6. duas credenciais novas, pessoais e exclusivas, inseridas por canal seguro.

`ipConfiavel(req)` é dependência obrigatória. Não copiar diretamente `X-Forwarded-For`; o adaptador da implantação deve aceitar esse cabeçalho somente do proxy reverso conhecido.

Para produzir os verificadores em ambiente protegido, chamar `gerarPrincipais()` de `auth.js` com os dois segredos recebidos de forma segura e persistir somente `saltHex` e `hashHex` no gerenciador de configuração do servidor. Não gravar segredos em arquivo, terminal compartilhado, histórico ou repositório.

## Inicialização

`startup.modelo.js` recebe configuração e dependências já resolvidas:

- `config` real, com `modelo: false`;
- `bancoAdmin`, expondo `ref()`;
- `ipConfiavel(req)`;
- relógio/timers opcionais para testes.

Ele devolve `handler` e uma fábrica de servidor. Nada chama `listen()`. O adaptador de produção, ainda não criado, será responsável por montar o Admin SDK confirmado, integrar ao processo HTTPS existente e iniciar a escuta somente após autorização específica.

Se faltar configuração, banco Admin ou resolução confiável de IP, a composição falha fechada.

## Estrutura no projeto

Este diretório fica em `servidor-rh/` na raiz. O teste cruzado usa os módulos integrados em `../auaulandia/agenda-marcia/rh151-transporte.js` e `rh151-dados.js`. O pacote não inicia servidor nem contém configuração real.

## Testes locais

Sem dependências externas:

```text
node auth.test.cjs
node dados.test.cjs
node api.test.cjs
node startup.test.cjs
```

Os testes usam apenas Node, requests/responses falsos e banco em memória. Não abrem socket, navegador, Firebase, VPS ou rede.

## Limites

- não confirma que o servidor existente está implantado;
- não confirma Admin SDK ou regras vivas;
- não escolhe nem instala armazenamento de configuração/secrets;
- sessão em RAM pressupõe um processo; múltiplos processos exigem decisão adicional;
- se a sessão expirar logo após o commit, a API devolve 401 embora a gravação já possa estar confirmada; o retry externo precisa conservar o mesmo `requestId`/base para ser idempotente e nunca é disparado automaticamente pelo backend;
- não inclui integração do painel nem publicação;
- não migra dados do caminho antigo.
