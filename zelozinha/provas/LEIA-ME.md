# Provas do projeto da Zelozinha

Provas que protegem o que este projeto promete, hoje, antes de o código da Codex chegar (Story 6.112, Fase 2A). Rodam sem rede, sem banco, sem WhatsApp e sem nenhum dado de verdade. Os repositórios que elas criam são descartáveis e ficam numa pasta temporária.

Pedem Node 18 ou mais novo e git 2.32 ou mais novo (a versão do Node da VPS: a confirmar pela Codex, C1).

```
node zelozinha/provas/rodar-todas.js          # roda tudo; sai com 1 se qualquer prova falhar
node zelozinha/provas/<arquivo>.test.js       # uma prova só
```

## O que cada arquivo faz

| Arquivo | O que prova |
|---|---|
| `configuracao-git.test.js` | `.gitattributes`: um arquivo com CRLF dentro de `zelozinha/runtime/` entra e sai do projeto com os mesmos bytes (commit, clone, `git archive` e `sha256sum -c`), e a trava de LF do app continua valendo fora do runtime (AC3.3). `.gitignore`: `automatico80.json` fica de fora, só `*.modelo.json` passa, `node_modules` do `zelozinha/` fica de fora e nenhuma exceção por pasta libera nome de segredo (AC4.4, AC3.2) |
| `manual.test.js` | `AGENTS.md` (sete partes, dez «nunca» e três regras), `CLAUDE.md` (até 3 linhas, só aponta), `zelozinha/README.md` (assuntos do AC6.3), o estado de hoje com data (AC26.2), a marca e o português (AC25.1) e a varredura sobre os três textos |
| `varredura.test.js` | A varredura de segredo, dado pessoal e endereço da VPS: cada padrão tem um defeito plantado pego; vale sobre todos os commits, não só a árvore final; a saída nunca mostra o valor (AC8.1, AC8.2, AC12.4, AC12.7) |
| `regra-versao.test.js` | Se `zelozinha/runtime/` muda, `zelozinha/VERSAO` também muda (AC7.2) |
| `varredura.js`, `regra-versao.js` | As duas ferramentas de linha de comando que o GitHub chama (abaixo) |
| `amostras.js` | Os valores sintéticos dos defeitos plantados, montados em execução (nenhum vem escrito por inteiro) |
| `ajuda.js` | Corredor de provas e funções de git para repositórios descartáveis |
| `hosts-proibidos.sha256` | Impressões digitais (SHA-256) de nomes de servidor que não podem aparecer no projeto novo |

## A varredura

```
node zelozinha/provas/varredura.js --commits <base>..<head> [--repo <pasta>] [--escopo-total]
node zelozinha/provas/varredura.js --arvore <pasta> [--so a,b,c]
```

- Saída 0 = verde; 1 = vermelho (achou algo); 2 = uso errado ou intervalo que não existe. Nunca verde por engano.
- **Nunca mostra o valor achado.** Mostra `arquivo:linha`, a regra e, no modo de commits, o commit. O log do GitHub deste projeto é público.
- Modo de commits: lê a mensagem e as linhas acrescentadas por cada commit do intervalo, sem os de junção. Um segredo posto no 1º commit e tirado no 2º continua sendo achado.
- Regras de segredo valem em qualquer arquivo do pull request. As de dado pessoal e de endereço da VPS valem na superfície do projeto novo: `AGENTS.md`, `CLAUDE.md`, `.github/`, `zelozinha/` e `regras-banco/` (para um e-mail que já mora no app não travar o Merge de um pull request do app). `--escopo-total` aplica tudo em todos os arquivos.
- Cobre: chave privada, token, JWT, chave de API, valor de segredo atribuído a uma variável, senha dentro de endereço; telefone com DDD, identificador do WhatsApp, e-mail, CPF; endereço IP, porta de SSH, impressão digital ou chave pública de SSH, e os nomes da lista de proibidos.
- **Limites ditos com honestidade:** telefone sem pontuação e sem o 55 na frente não é achado; arquivos binários e maiores que 5 MB não são lidos (a saída conta quantos); nome de FILHOt e de tutor não se acha por padrão, só por leitura documento por documento (AC2.1(d), AC9.1); a varredura de verdade com os valores da configuração é feita pela Codex na VPS.

### Como escrever dado de teste que a varredura aceita

Teste usa dado inventado, mas a varredura não sabe que um telefone é inventado: se parece telefone, e-mail, CPF ou identificador do WhatsApp de verdade, ela barra. Convenção:

| Dado | Como escrever num teste ou exemplo |
|---|---|
| Telefone | DDD `00`: `(00) 90000-0000` ou `+55 00 90000-0000` (nenhum número de verdade começa com 00) |
| E-mail | Em `exemplo.invalid`, `example.com`, `example.org` ou `example.net` |
| CPF | Só zeros e sem pontuação (`00000000000`); com pontuação ele é sempre barrado |
| Identificador do WhatsApp | Montado em execução, juntando pedaços de texto (o formato é o de um número de verdade) |
| Endereço IP | De documentação: `192.0.2.x`, `198.51.100.x` ou `203.0.113.x`; ou `127.0.0.1` |
| Nome de FILHOt e de tutor | Inventado. A varredura não acha nome; a leitura é que acha |
| Segredo | Montado em execução, juntando pedaços de texto, e com corpo óbvio («AAAA...»); nunca um valor que já tenha existido |

### Como acrescentar um nome de servidor à lista de proibidos

Em um terminal (o nome não fica gravado em nenhum arquivo do projeto):

```
printf '%s' 'nome.do.servidor' | sha256sum
```

Cole o resultado, mais um rótulo que não revele o nome, em `hosts-proibidos.sha256`. A lista pega o nome e os nomes que terminam nele (o subdomínio). Sobra decidir, depois da resposta C7 da Codex, se o nome que já está na lista é mesmo o da VPS da Zelozinha.

## Para o @devops: o que o `zelozinha-provas.yml` precisa fazer (task 9)

Os comandos estão prontos; o arquivo do GitHub é do @devops (CI/CD é exclusivo dele). Contrato:

1. Gatilhos: `pull_request` e `push` no `master`. **Nunca** `pull_request_target`, nunca runner próprio, nenhum segredo do GitHub. `permissions: contents: read`.
2. `actions/checkout` com `fetch-depth: 0` (a varredura e a regra do número da versão leem o histórico). Ações de terceiros: nenhuma; ações oficiais do GitHub, fixadas pelo hash do commit.
3. Node: provisório, o 22 (o que rodou estas provas); trocar pelo da VPS quando a Codex responder C1.
4. Passos, nesta ordem, cada um vermelho se sair com qualquer status diferente de 0 (inclusive o 2):
   1. `node zelozinha/provas/rodar-todas.js`
   2. `node zelozinha/provas/varredura.js --commits "$BASE..$HEAD"`
   3. `node zelozinha/provas/regra-versao.js --base "$BASE" --head "$HEAD"`
5. Em `pull_request`: `BASE` = `github.event.pull_request.base.sha` e `HEAD` = `github.event.pull_request.head.sha`. Em `push` no `master` (o commit do Merge): `BASE` = `github.event.before` e `HEAD` = `github.sha`; no primeiro push de um ramo o `before` é só zeros e o passo sai com 2 (trate esse caso).
6. Passe `BASE` e `HEAD` por `env:`, nunca escritos dentro do `run:` (injeção de comando).
7. O arquivo tem de funcionar com a pasta `zelozinha/` ainda sem o código (AC7.4): estas provas funcionam.
8. Nenhum endereço, domínio nem porta da VPS no workflow: a varredura confere (AC12.4).
9. Ainda não existem (task 12, Fase 2B): `node zelozinha/testes/rodar.js` e a conferência do instantâneo de texto com a linha «Texto aprovado pela Adriana em…» (AC8.4).
10. O `zelozinha-publicar.yml` (Fase 3) repete os mesmos passos sobre o commit do Merge, antes de chamar a VPS.
