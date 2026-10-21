'use strict';
/*
 * PROVA das varreduras de segredo e de dado pessoal (Story 6.112, Fase 2A, task 8: AC8.1, AC8.2,
 * mais o AC12.4 e o AC12.7 no que dizem respeito à varredura).
 *
 *   AC8.1  roda sobre TODOS os commits do pull request, não só sobre a árvore final
 *          (prova: segredo plantado no 1º commit e removido no 2º dá vermelho);
 *   AC8.2  cobre chave privada, token, JWT, chave de API, senha em endereço, telefone com DDD,
 *          identificador do WhatsApp, e-mail e CPF; cada padrão tem um defeito plantado pego;
 *          os valores plantados são SINTÉTICOS e montados em execução (amostras.js);
 *   AC12.4 a varredura procura o endereço, o domínio e a porta da VPS (sem que nenhum arquivo
 *          do projeto tenha o domínio escrito: a lista é de impressões digitais SHA-256);
 *   AC12.7 o log do GitHub é público: a saída da varredura NUNCA mostra o valor achado;
 *   QA 1ª rodada (V15 a V19): o conteúdo que o git trata como binário (byte nulo, `-diff`, `binary` no .gitattributes
 *          do próprio pull request) é lido; a chave escrita SEM aspas (Environment=, YAML, cabeçalho, endereço) é achada.
 *   QA 2ª rodada (V20): a chave com nome em português («chave», como em chaveDoCanal, EVOLUTION_CHAVE e "chave:" em YAML) é achada, com
 *          aspas ou sem, na superfície do projeto novo; fora dela (no app) um identificador de registro com «Chave» no nome não trava nada.
 *   QA 3ª rodada (V21 a V23): o valor entre crases (const token = `…`) passa pelas regras de credencial (SEC-012); a lista numa linha só, o nome
 *          com acento e o nome com espaço entre aspas também (SEC-013); e os dois limites escritos no LEIA-ME são verdadeiros (V23).
 *
 * Todos os repositórios são descartáveis (pasta temporária). Sem rede, sem banco, sem segredo de verdade.
 *
 * Uso:  node zelozinha/provas/varredura.test.js
 */

const assert = require('assert');
const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const A = require('./ajuda');
const S = require('./amostras');
const V = require('./varredura');

const { prova, rodar } = A.criarProvas('Varreduras de segredo e de dado pessoal');

const CLI = path.join(__dirname, 'varredura.js');
const CAMINHO_DA_SUPERFICIE = 'zelozinha/exemplo.txt';   // dentro da superfície: todas as regras valem
const CAMINHO_DO_APP = 'index.html';                       // fora dela: só as regras de escopo "tudo"

const idsDasRegras = () => V.REGRAS.map((r) => r.id);
const achou = (achados, regra) => achados.some((a) => a.regra === regra);

function rodarCli(args, opcoes) {
  const r = cp.spawnSync(process.execPath, [CLI].concat(args), Object.assign({ encoding: 'utf8', env: A.ambienteGit() }, opcoes || {}));
  return { status: r.status, saida: String(r.stdout) + String(r.stderr) };
}

prova('V1 (AC8.2) — toda regra (menos a de host proibido, que tem prova própria) tem defeito plantado, e toda amostra pertence a uma regra', () => {
  const positivas = S.positivas();
  const semAmostra = idsDasRegras().filter((id) => id !== 'host-proibido' && !positivas[id]);
  assert.deepStrictEqual(semAmostra, [], 'regras sem defeito plantado: ' + semAmostra.join(', '));
  const semRegra = Object.keys(positivas).filter((id) => !idsDasRegras().includes(id));
  assert.deepStrictEqual(semRegra, [], 'amostras sem regra: ' + semRegra.join(', '));
  ['chave-privada', 'token', 'jwt', 'chave-api', 'senha-em-endereco', 'telefone-ddd', 'jid-whatsapp', 'email', 'cpf'].forEach((id) => {
    assert.ok(idsDasRegras().includes(id), 'falta a regra obrigatória do AC8.2: ' + id);
  });
});

prova('V2 (AC8.2, d01 a d09) — cada defeito plantado (segredo e dado pessoal) é pego pela regra certa', () => {
  const positivas = S.positivas();
  Object.keys(positivas).forEach((id) => {
    assert.ok(positivas[id].length >= 1);
    positivas[id].forEach((amostra, i) => {
      const achados = V.varrerTexto('linha antes\n' + amostra + '\nlinha depois\n', CAMINHO_DA_SUPERFICIE);
      assert.ok(achou(achados, id), 'a regra ' + id + ' não pegou a amostra ' + (i + 1));
      assert.ok(achados.every((a) => a.linha === 2), 'a linha do achado deveria ser a 2 (' + id + ' #' + (i + 1) + ')');
      // o achado só diz onde e qual regra: nunca carrega o valor
      assert.ok(!JSON.stringify(achados).includes(amostra), 'o achado repetiu o valor plantado (' + id + ')');
    });
  });
});

prova('V3 — linhas comuns (versão, máscara, exemplo, nome técnico, data, hash, endereço de laboratório) não são achadas', () => {
  S.negativas().forEach((linha) => {
    const achados = V.varrerTexto(linha, CAMINHO_DA_SUPERFICIE);
    assert.deepStrictEqual(achados.map((a) => a.regra), [], 'falso positivo em: ' + linha);
  });
});

prova('V3b — manifesto e lockfile: 22 mil linhas de hash em hexadecimal, de integridade em base64 e de identificador aleatório (sempre as mesmas, geradas com semente fixa) não geram nenhum falso positivo', () => {
  // Um número de 11 dígitos tem 1% de chance de ser um CPF válido, e uma sequência de dígitos dentro de um hash pode
  // parecer telefone. O manifesto da Codex e o lockfile terão milhares de linhas assim; a varredura não pode barrá-los.
  function sementeFixa(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const sorteio = sementeFixa(1234);
  const hex = '0123456789abcdef';
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const sortear = (alfabeto, n) => { let o = ''; for (let i = 0; i < n; i++) o += alfabeto[Math.floor(sorteio() * alfabeto.length)]; return o; };
  const linhas = [];
  for (let i = 0; i < 10000; i++) linhas.push(sortear(hex, 64) + '  zelozinha/runtime/arquivo-' + i + '.js');
  for (let i = 0; i < 10000; i++) linhas.push('"integrity": "sha512-' + sortear(b64, 86) + '=="');
  for (let i = 0; i < 2000; i++) linhas.push('"id": "' + sortear(hex, 8) + '-' + sortear(hex, 4) + '-' + sortear(hex, 4) + '-' + sortear(hex, 4) + '-' + sortear(hex, 12) + '"');
  const achados = V.varrerTexto(linhas.join('\n'), 'zelozinha/manifesto/amostra.sha256');
  assert.deepStrictEqual(achados.map((a) => a.regra + ':' + a.linha), [], 'falso positivo em texto aleatório');
});

prova('V4 — o CPF sem pontuação só conta com os dígitos verificadores certos (11 dígitos soltos, como um número de pedido, não)', () => {
  const valido = S.cpfComDigitos('529982247');
  assert.ok(achou(V.varrerTexto('cpf ' + valido, CAMINHO_DA_SUPERFICIE), 'cpf'));
  const invalido = valido.slice(0, 10) + String((Number(valido[10]) + 1) % 10);
  assert.ok(!achou(V.varrerTexto('pedido ' + invalido, CAMINHO_DA_SUPERFICIE), 'cpf'), 'número sem dígito verificador válido virou CPF');
  assert.ok(!achou(V.varrerTexto('pedido 11111111111', CAMINHO_DA_SUPERFICIE), 'cpf'), 'dígitos todos iguais viraram CPF');
});

prova('V5 (AC12.4, d58) — endereço, porta e impressão digital da VPS são pegos na superfície do projeto; endereço de laboratório e de rede interna não', () => {
  const p = S.positivas();
  ['ip-publico', 'porta-ssh', 'impressao-ssh'].forEach((id) => {
    p[id].forEach((amostra) => assert.ok(achou(V.varrerTexto(amostra, 'AGENTS.md'), id), id + ' não pegou: ' + (id === 'impressao-ssh' ? '(amostra)' : amostra)));
    p[id].forEach((amostra) => assert.ok(achou(V.varrerTexto(amostra, '.github/workflows/zelozinha-publicar.yml'), id)));
    p[id].forEach((amostra) => assert.ok(achou(V.varrerTexto(amostra, 'zelozinha/implantacao/publicar.sh'), id)));
  });
});

prova('V6 — escopo: dado pessoal e endereço só valem na superfície do projeto (AGENTS.md, CLAUDE.md, .github/, zelozinha/, regras-banco/); segredo vale em qualquer arquivo do pull request (a regra da «chave» em português é a exceção, só na superfície: V20)', () => {
  const p = S.positivas();
  // fora da superfície (um arquivo do app): e-mail, telefone, IP e a chave do Firebase do HTML (pública) não bloqueiam
  assert.deepStrictEqual(V.varrerTexto(p['email'][0], CAMINHO_DO_APP), []);
  assert.deepStrictEqual(V.varrerTexto(p['telefone-ddd'][0], CAMINHO_DO_APP), []);
  assert.deepStrictEqual(V.varrerTexto(p['ip-publico'][0], CAMINHO_DO_APP), []);
  assert.deepStrictEqual(V.varrerTexto(p['chave-api'][0], CAMINHO_DO_APP), [], 'a chave do Firebase no HTML do app é pública por natureza');
  // segredo de verdade vale em qualquer lugar
  ['chave-privada', 'token', 'jwt', 'senha-em-endereco', 'credencial-atribuida', 'credencial-sem-aspas'].forEach((id) => {
    assert.ok(achou(V.varrerTexto(p[id][0], CAMINHO_DO_APP), id), id + ' deveria valer em qualquer arquivo');
  });
  assert.ok(achou(V.varrerTexto(p['chave-api'][1], CAMINHO_DO_APP), 'chave-api'), 'chave da AWS deveria valer em qualquer arquivo');
  // e com o escopo total tudo vale em qualquer arquivo
  assert.ok(achou(V.varrerTexto(p['email'][0], CAMINHO_DO_APP, { escopoTotal: true }), 'email'));
});

prova('V7 (AC12.4) — domínio da VPS: a lista é de impressões digitais SHA-256 (nenhum arquivo traz o domínio escrito); acha o nome, o subdomínio e o nome dentro de endereço', () => {
  const nome = S.j('vps-de-mentira', '.exemplo', '.invalid');
  const hashes = new Set([crypto.createHash('sha256').update(nome).digest('hex')]);
  const o = { hashesProibidos: hashes };
  assert.ok(achou(V.varrerTexto('ssh usuario@' + nome, CAMINHO_DA_SUPERFICIE, o), 'host-proibido'));
  assert.ok(achou(V.varrerTexto('https://painel.' + nome + '/saude', CAMINHO_DA_SUPERFICIE, o), 'host-proibido'));
  assert.ok(achou(V.varrerTexto(nome.toUpperCase(), CAMINHO_DA_SUPERFICIE, o), 'host-proibido'), 'maiúsculas não devem escapar');
  assert.ok(!achou(V.varrerTexto('https://github.com/zoeharus-art e docs.github.com', CAMINHO_DA_SUPERFICIE, o), 'host-proibido'));
  assert.ok(!achou(V.varrerTexto('x' + nome + 'y', CAMINHO_DA_SUPERFICIE, o), 'host-proibido'), 'um nome que só CONTÉM o proibido no meio de outro não é o mesmo domínio');
  assert.ok(!achou(V.varrerTexto('ssh usuario@' + nome, CAMINHO_DO_APP, o), 'host-proibido'), 'fora da superfície não vale');
});

prova('V8 (AC12.4, d58) — a lista que vai no projeto (hosts-proibidos.sha256) existe, tem pelo menos um nome e só guarda impressões digitais; o carregador lê o formato dela (provado com um nome INVENTADO, nunca com o de um servidor de verdade)', () => {
  const arquivo = path.join(__dirname, 'hosts-proibidos.sha256');
  const texto = fs.readFileSync(arquivo, 'utf8');
  const linhas = texto.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('#'));
  assert.ok(linhas.length >= 1, 'a lista está vazia');
  linhas.forEach((l) => assert.ok(/^[0-9a-f]{64}(\s+\S.*)?$/.test(l), 'linha que não é uma impressão digital: ' + l.slice(0, 20)));
  assert.ok(V.carregarHashesProibidos().size >= 1, 'o carregador não leu nenhuma impressão digital da lista do projeto');

  // O formato é provado com um nome inventado: a prova monta uma lista igual à do projeto (cabeçalho em comentário,
  // linha em branco, impressão digital e rótulo) numa pasta temporária e confere que o carregador a lê e que a
  // varredura acha o nome e o subdomínio. O nome de um servidor de verdade não pode estar escrito aqui, nem em pedaços.
  const inventado = S.j('servidor-de-mentira', '.exemplo', '.invalid');
  const pasta = A.temporaria('lista-de-nomes');
  const listaDeTeste = path.join(pasta, 'hosts-de-teste.sha256');
  fs.writeFileSync(listaDeTeste, '# comentário de cabeçalho\n\n' + crypto.createHash('sha256').update(inventado).digest('hex') + '  rótulo que não revela o nome\n');
  const hashes = V.carregarHashesProibidos(listaDeTeste);
  assert.strictEqual(hashes.size, 1, 'o carregador deveria ler uma impressão digital e ignorar comentário e linha em branco');
  const o = { hashesProibidos: hashes };
  const achados = V.varrerTexto('Painel em https://painel.' + inventado + '/saude', CAMINHO_DA_SUPERFICIE, o);
  assert.ok(achou(achados, 'host-proibido'), 'o nome inventado passou');
  assert.ok(!JSON.stringify(achados).includes(inventado), 'o achado repetiu o domínio');

  // Opcional, para quem SABE o nome do servidor: confere que ele está na lista do projeto sem escrevê-lo em arquivo.
  //   ZELOZINHA_HOST_CANDIDATO=nome.do.servidor node zelozinha/provas/varredura.test.js
  // (a variável só existe no terminal de quem roda; nas provas do GitHub ela não existe e este trecho não roda).
  const candidato = process.env.ZELOZINHA_HOST_CANDIDATO;
  if (candidato) {
    assert.ok(achou(V.varrerTexto('https://' + candidato + '/x', CAMINHO_DA_SUPERFICIE), 'host-proibido'), 'o nome informado em ZELOZINHA_HOST_CANDIDATO não está na lista do projeto');
  }
});

prova('V9 (AC8.1, d10) — todos os commits do pull request: segredo plantado no 1º commit e removido no 2º dá VERMELHO nos commits e a árvore final está limpa', () => {
  const p = S.positivas();
  const repo = A.repositorioNovo({ 'LEIA.txt': 'base\n' });
  const base = A.commitar(repo, 'base');
  A.git(repo, ['checkout', '-q', '-b', 'ramo']);
  A.escrever(repo, { 'zelozinha/runtime/a.js': "const a = 1;\nconst b = 2;\nconst c = 3;\nconst chave = '" + p['token'][0] + "';\nconst d = 4;\n" });
  const c1 = A.commitar(repo, 'adiciona a.js');
  A.escrever(repo, { 'zelozinha/runtime/a.js': 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\n' });
  const c2 = A.commitar(repo, 'remove o que não devia estar aqui');

  const arvoreFinal = V.varrerArvore(repo, { so: ['zelozinha'] });
  assert.deepStrictEqual(arvoreFinal.achados, [], 'a árvore final deveria estar limpa');

  const r = V.varrerCommits(repo, base + '..' + c2);
  assert.strictEqual(r.commits, 2);
  // A linha plantada é «const chave = '<token>'»: o token é achado como token e, desde o SEC-007, a atribuição a um campo «chave» também.
  assert.strictEqual(r.achados.length, 2, 'esperava 2 achados (token e chave-em-portugues), veio ' + r.achados.length + ': ' + JSON.stringify(r.achados.map((a) => a.regra)));
  assert.deepStrictEqual(r.achados.map((a) => a.regra).sort(), ['chave-em-portugues', 'token']);
  r.achados.forEach((a) => {
    assert.strictEqual(a.commit, c1);
    assert.strictEqual(a.caminho, 'zelozinha/runtime/a.js');
    assert.strictEqual(a.linha, 4, 'o número da linha do achado tem de ser o do arquivo novo');
  });
  assert.ok(!JSON.stringify(r).includes(p['token'][0]), 'o resultado repetiu o valor plantado');

  // a CLI conta a mesma história
  const cli = rodarCli(['--commits', base + '..' + c2, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/VERMELHO/.test(cli.saida) && /zelozinha\/runtime\/a\.js:4/.test(cli.saida), cli.saida);
  assert.ok(!cli.saida.includes(p['token'][0]), 'a saída da CLI mostrou o valor');
  const so2 = rodarCli(['--commits', c1 + '..' + c2, '--repo', repo]);
  assert.strictEqual(so2.status, 0, 'o 2º commit sozinho só remove: ' + so2.saida);
});

prova('V10 (AC8.1) — a mensagem do commit também é varrida (o histórico do projeto aberto é público), e o rodapé da casa não dá falso positivo', () => {
  const p = S.positivas();
  const repo = A.repositorioNovo({ 'LEIA.txt': 'base\n' });
  const base = A.commitar(repo, 'base');
  A.escrever(repo, { 'zelozinha/x.md': 'nada\n' });
  const limpo = A.commitar(repo, 'docs: texto limpo\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_exemplo');
  assert.deepStrictEqual(V.varrerCommits(repo, base + '..' + limpo).achados, []);
  A.escrever(repo, { 'zelozinha/y.md': 'nada\n' });
  const sujo = A.commitar(repo, 'docs: fala com ' + p['email'][0] + ' e usa ' + p['token'][0]);
  const r = V.varrerCommits(repo, limpo + '..' + sujo);
  assert.deepStrictEqual(r.achados.map((a) => a.regra).sort(), ['email', 'token']);
  assert.ok(r.achados.every((a) => a.commit === sujo && a.caminho === '(mensagem do commit)'));
});

prova('V11 (AC8.1) — pull request só com arquivos do app: o dado pessoal e o endereço que já moram no app não bloqueiam; segredo bloqueia; arquivo binário e commit vazio não derrubam a varredura', () => {
  const p = S.positivas();
  const repo = A.repositorioNovo({ 'LEIA.txt': 'base\n' });
  const base = A.commitar(repo, 'base');
  A.escrever(repo, {
    'index.html': '<p>' + p['email'][0] + ' ' + p['ip-publico'][0] + '</p>\n',
    'logo.bin': Buffer.from([0x89, 0x50, 0x00, 0x01, 0xff, 0x00]),
  });
  const c1 = A.commitar(repo, 'app: texto e imagem');
  const c2 = A.commitar(repo, 'commit vazio');
  assert.deepStrictEqual(V.varrerCommits(repo, base + '..' + c2).achados, []);
  A.escrever(repo, { 'index.html': '<p>' + p['jwt'][0] + '</p>\n' });
  const c3 = A.commitar(repo, 'app: erro');
  assert.deepStrictEqual(V.varrerCommits(repo, c2 + '..' + c3).achados.map((a) => a.regra), ['jwt']);
  assert.ok(c1 && c2 && c3);
});

prova('V11b (AC8.1) — uma junção (merge) que traz o segredo na resolução, sem estar em nenhum commit comum, também é pega pelo resultado final do intervalo', () => {
  const p = S.positivas();
  const repo = A.repositorioNovo({ 'f.txt': 'a\n' });
  const base = A.commitar(repo, 'base');
  A.git(repo, ['checkout', '-q', '-b', 'outro']);
  A.escrever(repo, { 'zelozinha/g.txt': 'g\n' });
  A.commitar(repo, 'outro ramo');
  A.git(repo, ['checkout', '-q', '-b', 'ramo', base]);
  A.escrever(repo, { 'zelozinha/h.txt': 'h\n' });
  A.commitar(repo, 'commit comum, limpo');
  A.git(repo, ['merge', '--no-commit', '--no-ff', '-q', 'outro']);
  A.escrever(repo, { 'zelozinha/h.txt': 'h\nchave = ' + p['jwt'][0] + '\n' });
  const juncao = A.commitar(repo, 'junção com a resolução suja');
  const r = V.varrerCommits(repo, base + '..' + juncao);
  assert.deepStrictEqual(r.achados.map((a) => a.regra), ['jwt'], JSON.stringify(r.achados.map((a) => a.regra)));
  assert.strictEqual(r.achados[0].commit, '', 'o achado do resultado final não tem commit próprio');
  assert.strictEqual(r.achados[0].caminho, 'zelozinha/h.txt');
  const cli = rodarCli(['--commits', base + '..' + juncao, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/resultado final do intervalo/.test(cli.saida) && !cli.saida.includes(p['jwt'][0]), cli.saida);
});

prova('V12 — intervalo vazio é verde; intervalo que não existe é erro claro (a CLI sai com 2), nunca verde por engano', () => {
  const repo = A.repositorioNovo({ 'LEIA.txt': 'base\n' });
  const base = A.commitar(repo, 'base');
  const vazio = V.varrerCommits(repo, base + '..' + base);
  assert.strictEqual(vazio.commits, 0);
  assert.throws(() => V.varrerCommits(repo, '0000000000000000000000000000000000000000..HEAD'), /intervalo|git/i);
  const cli = rodarCli(['--commits', '0000000000000000000000000000000000000000..HEAD', '--repo', repo]);
  assert.strictEqual(cli.status, 2, cli.saida);
  assert.ok(!/VERDE/.test(cli.saida), 'erro de intervalo virou verde');
});

prova('V13 (AC12.7) — a CLI sobre uma pasta: vermelho com arquivo:linha e regra, sem nunca mostrar o valor; verde quando limpa; conta o que não leu (binários, pastas ignoradas)', () => {
  const p = S.positivas();
  const sujo = A.temporaria('arvore-suja');
  A.escrever(sujo, {
    'doc.md': 'um\ndois\n' + p['telefone-ddd'][0] + '\n',
    'chave.txt': p['chave-privada'][0] + '\n',
    'node_modules/pacote/index.js': p['token'][0] + '\n',
    '.git/config': p['token'][0] + '\n',
    'imagem.bin': Buffer.from([0, 1, 2, 0, 255]),
  });
  const r = rodarCli(['--arvore', sujo]);
  assert.strictEqual(r.status, 1, r.saida);
  assert.ok(/VERMELHO: 2 achado/.test(r.saida), r.saida);
  assert.ok(/doc\.md:3/.test(r.saida) && /chave\.txt:1/.test(r.saida), r.saida);
  assert.ok(/binário/.test(r.saida) && /pasta ignorada|pastas ignoradas/.test(r.saida), 'a saída deveria contar o que não leu: ' + r.saida);
  [p['telefone-ddd'][0], p['chave-privada'][0], p['token'][0]].forEach((v) => assert.ok(!r.saida.includes(v), 'a saída mostrou um valor plantado'));

  const limpo = A.temporaria('arvore-limpa');
  A.escrever(limpo, { 'doc.md': 'só texto\n' });
  const ok = rodarCli(['--arvore', limpo]);
  assert.strictEqual(ok.status, 0, ok.saida);
  assert.ok(/VERDE/.test(ok.saida));

  const semArgumento = rodarCli([]);
  assert.strictEqual(semArgumento.status, 2, 'sem argumento é erro de uso');
});

prova('V14 (AC6.7, AC8) — o projeto novo passa pela própria varredura: AGENTS.md, CLAUDE.md, .github/, zelozinha/ e regras-banco/ (todos os arquivos que existem), com o escopo total', () => {
  const r = V.varrerArvore(A.RAIZ, { so: ['AGENTS.md', 'CLAUDE.md', '.github', 'zelozinha', 'regras-banco'] });
  assert.ok(r.arquivos >= 1, 'nenhum arquivo do projeto novo foi lido');
  const lista = r.achados.map((a) => a.caminho + ':' + a.linha + ' [' + a.regra + ']');
  assert.deepStrictEqual(lista, [], 'a varredura achou algo no projeto novo');
  assert.ok(fs.existsSync(path.join(A.RAIZ, 'AGENTS.md')), 'AGENTS.md não existe');
});

// ---------------------------------------------------------------------------------------------
// QA, 1ª rodada: o que o git trata como binário não pode ficar sem leitura (SEC-002) e a chave sem aspas (SEC-003)
// ---------------------------------------------------------------------------------------------

const montar = (...pedacos) => pedacos.join('');

/** Cria um repositório com a base, abre o ramo e devolve { repo, base }. */
function repositorioComRamo() {
  const repo = A.repositorioNovo({ 'LEIA.txt': 'base\n' });
  const base = A.commitar(repo, 'base');
  A.git(repo, ['checkout', '-q', '-b', 'ramo']);
  return { repo, base };
}

prova('V15 (AC8.1, SEC-002, Q6) — arquivo de texto com um byte nulo (o git o chama de binário): o token dentro dele é achado, na linha certa, e a saída conta o arquivo com byte nulo', () => {
  const p = S.positivas();
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, { 'zelozinha/runtime/a.js': Buffer.from("const a = 1;\nconst t = '" + p['token'][0] + "';\n// fim\0\n", 'utf8') });
  const c1 = A.commitar(repo, 'adiciona a.js, com um byte nulo');
  const r = V.varrerCommits(repo, base + '..' + c1);
  assert.deepStrictEqual(r.achados.map((a) => a.regra + '@' + a.caminho + ':' + a.linha), ['token@zelozinha/runtime/a.js:2']);
  assert.deepStrictEqual(r.comByteNulo, ['zelozinha/runtime/a.js']);
  assert.strictEqual(r.arquivos, 1, 'o arquivo com byte nulo tem de contar como lido');
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/zelozinha\/runtime\/a\.js:2/.test(cli.saida) && /byte nulo[^\n]*: 1\b/.test(cli.saida), cli.saida);
  assert.ok(!cli.saida.includes(p['token'][0]), 'a saída da CLI mostrou o valor');
});

prova('V16 (AC8.1, SEC-002, Q5) — `-diff` e `binary` no .gitattributes do próprio pull request (no mesmo commit, num commit depois ou num commit antes) e filtro de conversão de quem roda não escondem o conteúdo de nenhum commit', () => {
  const p = S.positivas();
  const temTrue = !cp.spawnSync('true').error;   // o filtro de teste é o comando `true`, que devolve texto nenhum
  [
    { nome: 'no mesmo commit', ordem: 'junto', atributos: '*.js -diff\n' },
    { nome: 'num commit depois', ordem: 'depois', atributos: '*.js -diff\n' },
    { nome: 'num commit antes', ordem: 'antes', atributos: '*.js -diff\n' },
    { nome: 'com a macro binary, junto', ordem: 'junto', atributos: '*.js binary\n' },
    { nome: 'filtro de conversão (textconv) que devolve texto nenhum', ordem: 'junto', atributos: '*.js diff=escondido\n', config: ['diff.escondido.textconv', 'true'], precisaDoTrue: true },
  ].forEach((caso) => {
    if (caso.precisaDoTrue && !temTrue) return;
    const { repo, base } = repositorioComRamo();
    if (caso.config) A.git(repo, ['config'].concat(caso.config));
    const arquivo = { 'zelozinha/runtime/b.js': "const t = '" + p['token'][0] + "';\n" };
    let ultimo;
    if (caso.ordem === 'junto') {
      A.escrever(repo, Object.assign({ '.gitattributes': caso.atributos }, arquivo));
      ultimo = A.commitar(repo, 'atributos e arquivo juntos');
    } else if (caso.ordem === 'depois') {
      A.escrever(repo, arquivo);
      A.commitar(repo, 'adiciona o arquivo');
      A.escrever(repo, { '.gitattributes': caso.atributos });
      ultimo = A.commitar(repo, 'atributos depois');
    } else {
      A.escrever(repo, { '.gitattributes': caso.atributos });
      A.commitar(repo, 'atributos antes');
      A.escrever(repo, arquivo);
      ultimo = A.commitar(repo, 'adiciona o arquivo');
    }
    const r = V.varrerCommits(repo, base + '..' + ultimo);
    assert.deepStrictEqual(r.achados.map((a) => a.regra + '@' + a.caminho + ':' + a.linha), ['token@zelozinha/runtime/b.js:1'], caso.nome + ': ' + JSON.stringify(r.achados));
    assert.strictEqual(rodarCli(['--commits', base + '..' + ultimo, '--repo', repo]).status, 1, caso.nome + ': a CLI deveria sair com 1');
  });
});

prova('V17 (AC8.1, SEC-002, Q17) — .gitattributes aninhado em zelozinha/runtime/ com `* binary` (pode vir na pasta da release): token e e-mail do .js são achados, e a CLI não diz VERDE', () => {
  const p = S.positivas();
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, {
    'zelozinha/runtime/.gitattributes': '* binary\n',
    'zelozinha/runtime/automatico81/executar.js': "const t = '" + p['token'][0] + "';\n// contato: " + p['email'][0] + '\n',
  });
  const c1 = A.commitar(repo, 'release com .gitattributes aninhado');
  const r = V.varrerCommits(repo, base + '..' + c1);
  assert.deepStrictEqual(r.achados.map((a) => a.regra + ':' + a.linha).sort(), ['email:2', 'token:1']);
  assert.ok(r.arquivos >= 2, 'a varredura contou ' + r.arquivos + ' arquivo(s) lido(s)');
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(!/VERDE/.test(cli.saida), cli.saida);
});

prova('V17b (AC8.1, SEC-002) — o resultado final do intervalo (o que a junção trouxe) também é lido quando o arquivo tem byte nulo ou `binary` no .gitattributes', () => {
  const p = S.positivas();
  const repo = A.repositorioNovo({ 'f.txt': 'a\n' });
  const base = A.commitar(repo, 'base');
  A.git(repo, ['checkout', '-q', '-b', 'outro']);
  A.escrever(repo, { 'zelozinha/g.txt': 'g\n' });
  A.commitar(repo, 'outro ramo');
  A.git(repo, ['checkout', '-q', '-b', 'ramo', base]);
  A.escrever(repo, { 'zelozinha/h.txt': 'h\n' });
  A.commitar(repo, 'commit comum, limpo');
  A.git(repo, ['merge', '--no-commit', '--no-ff', '-q', 'outro']);
  A.escrever(repo, { 'zelozinha/.gitattributes': '* binary\n', 'zelozinha/h.txt': Buffer.from('h\nchave = ' + p['jwt'][0] + '\n\0\n', 'utf8') });
  const juncao = A.commitar(repo, 'junção com a resolução suja e binária');
  const r = V.varrerCommits(repo, base + '..' + juncao);
  assert.deepStrictEqual(r.achados.map((a) => a.regra), ['jwt'], JSON.stringify(r.achados));
  assert.strictEqual(r.achados[0].commit, '', 'o achado do resultado final não tem commit próprio');
  assert.ok(r.comByteNulo.includes('zelozinha/h.txt'));
});

prova('V18 (AC8.1, SEC-002) — texto em UTF-16 (um byte nulo entre as letras) também é lido: o segredo dentro dele é achado; a saída conta o arquivo', () => {
  const p = S.positivas();
  [['utf16le', '﻿'], ['utf16le', ''], ['utf16be', '']].forEach(([codificacao, bom]) => {
    const { repo, base } = repositorioComRamo();
    let bytes = Buffer.from(bom + "const t = '" + p['token'][0] + "';\n", 'utf16le');
    if (codificacao === 'utf16be') bytes = Buffer.from(bytes).swap16();
    A.escrever(repo, { 'zelozinha/config/modelo.txt': bytes });
    const c1 = A.commitar(repo, 'arquivo em ' + codificacao);
    const r = V.varrerCommits(repo, base + '..' + c1);
    assert.deepStrictEqual(r.achados.map((a) => a.regra), ['token'], codificacao + ': ' + JSON.stringify(r.achados));
    assert.deepStrictEqual(r.comByteNulo, ['zelozinha/config/modelo.txt'], codificacao);
  });
});

prova('V19 (AC8.2, SEC-003, Q1 a Q4) — chave escrita SEM aspas num drop-in do systemd, em YAML, no cabeçalho de um curl e dentro de um endereço é achada, em cada arquivo onde aparece, e o valor nunca é mostrado', () => {
  const p = S.positivas()['credencial-sem-aspas'];
  const arquivos = {
    'zelozinha/implantacao/systemd/zz-evolution.conf': '[Service]\nEnvironment=TZ=America/Sao_Paulo\n' + p[0] + '\n',          // Q1
    'zelozinha/config/exemplo.yml': 'evolution:\n  url: http://localhost:8080\n  ' + p[2] + '\n',                                  // Q2
    'zelozinha/implantacao/testar.sh': '#!/bin/sh\n' + p[3] + '\n',                                                                    // Q3
    'zelozinha/docs/chamada.md': 'Chame:\n\n    ' + p[4] + '\n',                                                                      // Q4
  };
  const esperados = ['zelozinha/config/exemplo.yml:3', 'zelozinha/docs/chamada.md:3', 'zelozinha/implantacao/systemd/zz-evolution.conf:3', 'zelozinha/implantacao/testar.sh:2'];
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, arquivos);
  const c1 = A.commitar(repo, 'quatro arquivos com a chave sem aspas');
  const r = V.varrerCommits(repo, base + '..' + c1);
  assert.deepStrictEqual(r.achados.map((a) => a.caminho + ':' + a.linha).sort(), esperados, JSON.stringify(r.achados));
  assert.ok(r.achados.every((a) => a.regra === 'credencial-sem-aspas'), JSON.stringify(r.achados.map((a) => a.regra)));
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  p.forEach((amostra) => assert.ok(!cli.saida.includes(amostra), 'a saída da CLI mostrou o valor'));
  // a mesma linha em um arquivo do app (fora da superfície): segredo vale em qualquer arquivo
  assert.ok(achou(V.varrerTexto(p[0], 'auaulandia/config.txt'), 'credencial-sem-aspas'));
});

prova('V19b (AC8.2, SEC-003) — configuração comum do serviço (fuso, modo, caminho de arquivo secreto, variável, marcador, data) não é achada em drop-in, YAML nem script', () => {
  const conf = [
    '[Service]',
    'Environment=TZ=America/Sao_Paulo',
    'Environment=NODE_ENV=production',
    'Environment="NODE_OPTIONS=--max-old-space-size=384"',
    'EnvironmentFile=/etc/zeluz-piloto/segredos.env',
    'LoadCredential=evolution-key:/etc/zeluz-piloto/chave-evolution-2026.txt',
    'Environment=EVOLUTION_API_KEY_ARQUIVO=/etc/zeluz-piloto/evolution-api-key-2026.txt',
    'evolution:',
    '  apikey: ${EVOLUTION_CHAVE}',
    '  token: <preencher na VPS>',
    '  secret: false',
    'curl -H "apikey: $EVOLUTION_CHAVE" "http://localhost:8080/instance/fetchInstances?token=<token>"',
  ].join('\n');
  ['zelozinha/implantacao/systemd/zz-evolution.conf', 'zelozinha/config/exemplo.yml', 'zelozinha/implantacao/testar.sh'].forEach((caminho) => {
    assert.deepStrictEqual(V.varrerTexto(conf, caminho), [], 'falso positivo em ' + caminho);
  });
});

prova('V20 (AC8.2, SEC-007, R1 a R3) — chave com nome em português (chaveDoCanal, EVOLUTION_CHAVE, «chave:» em YAML) é achada, com aspas ou sem, na superfície; fora dela (no app) um identificador de registro com «Chave» no nome não trava nada; o valor nunca é mostrado', () => {
  const p = S.positivas()['chave-em-portugues'];

  // (a) os três defeitos do QA em arquivos da superfície, num intervalo de commits de verdade (R1: JSON de teste; R2: drop-in do systemd; R3: YAML)
  const arquivos = {
    'zelozinha/testes/canal.json': '{\n  ' + p[0] + '\n}\n',
    'zelozinha/implantacao/systemd/zz-evolution.conf': '[Service]\nEnvironment=TZ=America/Sao_Paulo\n' + p[1] + '\n',
    'zelozinha/config/exemplo.yml': 'evolution:\n  url: http://localhost:8080\n  ' + p[2] + '\n',
  };
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, arquivos);
  const c1 = A.commitar(repo, 'três arquivos com a chave em português');
  const r = V.varrerCommits(repo, base + '..' + c1);
  assert.deepStrictEqual(r.achados.map((a) => a.caminho + ':' + a.linha).sort(), ['zelozinha/config/exemplo.yml:3', 'zelozinha/implantacao/systemd/zz-evolution.conf:3', 'zelozinha/testes/canal.json:2'], JSON.stringify(r.achados));
  assert.ok(r.achados.every((a) => a.regra === 'chave-em-portugues'), JSON.stringify(r.achados.map((a) => a.regra)));
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/VERMELHO: 3 achado/.test(cli.saida), cli.saida);
  p.forEach((amostra) => assert.ok(!cli.saida.includes(amostra), 'a saída da CLI mostrou o valor'));

  // (b) fora da superfície (um arquivo do app) a regra não vale: nem as amostras nem os identificadores de registro do app são achados,
  //     e um pull request do app só com esses identificadores fica verde
  p.forEach((amostra) => assert.deepStrictEqual(V.varrerTexto(amostra, CAMINHO_DO_APP), [], 'a regra da «chave» não deveria valer fora da superfície'));
  const registros = S.registrosDoApp();
  registros.forEach((linha) => assert.deepStrictEqual(V.varrerTexto(linha, 'tests/fase0-ciclo-fechado.test.js'), [], 'identificador de registro do app foi achado fora da superfície'));
  const { repo: repoApp, base: baseApp } = repositorioComRamo();
  A.escrever(repoApp, { 'tests/fase0-ciclo-fechado.test.js': registros.join('\n') + '\n' });
  const cApp = A.commitar(repoApp, 'app: identificadores de registro');
  assert.deepStrictEqual(V.varrerCommits(repoApp, baseApp + '..' + cApp).achados, [], 'pull request do app só com identificadores de registro não pode ficar vermelho');
  assert.strictEqual(rodarCli(['--commits', baseApp + '..' + cApp, '--repo', repoApp]).status, 0);

  // (c) com o escopo total, vale em qualquer arquivo; e na superfície o mesmo identificador de registro é achado (limite dito no LEIA-ME:
  //     dado de teste lá usa um marcador ou a palavra «exemplo»)
  p.forEach((amostra) => assert.ok(achou(V.varrerTexto(amostra, CAMINHO_DO_APP, { escopoTotal: true }), 'chave-em-portugues'), 'escopo total não pegou uma amostra'));
  registros.forEach((linha) => assert.ok(achou(V.varrerTexto(linha, CAMINHO_DA_SUPERFICIE), 'chave-em-portugues'), 'na superfície o identificador de registro deveria ser achado'));
});

// ---------------------------------------------------------------------------------------------
// QA, 3ª rodada: o valor entre crases (SEC-012) e as formas raras do campo «chave» (SEC-013)
// ---------------------------------------------------------------------------------------------

prova('V21 (AC8.2, SEC-012, T1 e T2) — valor entre crases (const chaveDoCanal = `…`, const token = `…`) é achado em arquivo da superfície, num intervalo de commits de verdade; crase com ${…} dentro é marcador e não é achada; o valor nunca é mostrado', () => {
  const f = S.formasDaRodada3();

  // (a) T1 (nome em português) e T2 (nome em inglês) em dois testes da superfície, como a Codex os escreveria
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, {
    'zelozinha/testes/canal.test.js': "'use strict';\n" + f.T1.linha + '\n',
    'zelozinha/testes/token.test.js': "'use strict';\n" + f.T2.linha + '\n',
  });
  const c1 = A.commitar(repo, 'dois testes com o valor entre crases');
  const r = V.varrerCommits(repo, base + '..' + c1);
  assert.deepStrictEqual(r.achados.map((a) => a.caminho + ':' + a.linha + ' ' + a.regra).sort(),
    ['zelozinha/testes/canal.test.js:2 chave-em-portugues', 'zelozinha/testes/token.test.js:2 credencial-atribuida'], JSON.stringify(r.achados));
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/VERMELHO: 2 achado/.test(cli.saida), cli.saida);
  [f.T1.valor, f.T2.valor].forEach((valor) => assert.ok(!cli.saida.includes(valor), 'a saída da CLI mostrou o valor'));

  // (b) as outras formas com crase: propriedade de objeto e duas atribuições na mesma linha, a primeira inofensiva
  ['T1b', 'T1c', 'T2b'].forEach((nome) => {
    const achados = V.varrerTexto(f[nome].linha, CAMINHO_DA_SUPERFICIE);
    assert.ok(achou(achados, f[nome].regra), nome + ': a regra ' + f[nome].regra + ' não pegou a forma com crase');
    assert.ok(!JSON.stringify(achados).includes(f[nome].valor), nome + ': o achado repetiu o valor');
  });

  // (c) escopo: o token vale em qualquer arquivo (segredo); a regra da «chave» só na superfície (SEC-007)
  assert.ok(achou(V.varrerTexto(f.T2.linha, CAMINHO_DO_APP), 'credencial-atribuida'), 'segredo entre crases deveria valer em qualquer arquivo');
  assert.deepStrictEqual(V.varrerTexto(f.T1.linha, CAMINHO_DO_APP), [], 'a regra da «chave» não deveria valer fora da superfície');

  // (d) crase que só monta texto ou aponta para uma variável não é segredo
  [
    'const token = `${process.env.TOKEN_DA_VPS}`;',
    'const token = `prefixo-${prefixo}-sufixo-12345678`;',
    'const chaveDoCanal = `<segredo: fica só na VPS>`;',
    'const senha = `nova senha do usuário`;',
    'throw new Error(`token inválido: ${t}`);',
  ].forEach((linha) => assert.deepStrictEqual(V.varrerTexto(linha, CAMINHO_DA_SUPERFICIE), [], 'falso positivo em: ' + linha));
});

prova('V22 (AC8.2, SEC-013, T3, T5 e T6) — lista numa linha só, nome com acento e nome com espaço entre aspas são achados, em cada arquivo onde aparecem; a segunda atribuição da linha vale (TEST-003); o valor nunca é mostrado', () => {
  const f = S.formasDaRodada3();
  const nomes = ['T3', 'T3b', 'T3c', 'T3d', 'T5', 'T5b', 'T5c', 'T6', 'T6b', 'TEST003'];
  const arquivos = {};
  nomes.forEach((nome) => { arquivos['zelozinha/config/caso-' + nome + '.txt'] = 'antes\n' + f[nome].linha + '\n'; });
  const { repo, base } = repositorioComRamo();
  A.escrever(repo, arquivos);
  const c1 = A.commitar(repo, 'dez arquivos com as formas raras do campo');
  const r = V.varrerCommits(repo, base + '..' + c1);
  const esperados = nomes.map((nome) => 'zelozinha/config/caso-' + nome + '.txt:2 ' + f[nome].regra).sort();
  assert.deepStrictEqual(r.achados.map((a) => a.caminho + ':' + a.linha + ' ' + a.regra).sort(), esperados, JSON.stringify(r.achados));
  const cli = rodarCli(['--commits', base + '..' + c1, '--repo', repo]);
  assert.strictEqual(cli.status, 1, cli.saida);
  assert.ok(/VERMELHO: 10 achado/.test(cli.saida), cli.saida);
  nomes.forEach((nome) => assert.ok(!cli.saida.includes(f[nome].valor), nome + ': a saída da CLI mostrou o valor'));

  // fora da superfície só valem as regras de segredo comum (a da «chave» não)
  assert.deepStrictEqual(['T3', 'T3b', 'T3d', 'T5', 'T5b', 'T6', 'TEST003'].filter((nome) => V.varrerTexto(f[nome].linha, CAMINHO_DO_APP).length > 0), [], 'a regra da «chave» valeu fora da superfície');
  assert.deepStrictEqual(['T3c', 'T5c', 'T6b'].filter((nome) => V.varrerTexto(f[nome].linha, CAMINHO_DO_APP).length === 0), [], 'o segredo comum deveria valer em qualquer arquivo');
});

prova('V23 (SEC-013, T7 e T8) — os dois limites escritos no LEIA-ME são verdadeiros: o valor numa linha e o nome do campo em outra não é achado, e valor sem aspas com menos de 16 caracteres (ou entre aspas com menos de 12) também não; o limite começa exatamente aí', () => {
  const f = S.formasDaRodada3();
  const v = f.T1.valor;   // 24 caracteres, com letra e número
  const nada = (linha) => assert.deepStrictEqual(V.varrerTexto(linha, CAMINHO_DA_SUPERFICIE), [], 'este limite virou achado, então o LEIA-ME está desatualizado: ' + linha.split('\n')[0]);
  const acha = (linha) => assert.ok(V.varrerTexto(linha, CAMINHO_DA_SUPERFICIE).length > 0, 'deveria ser achado: ' + linha.split('\n')[0]);

  // T7: o valor na linha de baixo (YAML com «>-», lista em JSON com um item por linha, texto entre crases em várias linhas)
  nada('chave: >-\n  ' + v);
  nada('"chaves": [\n  "' + v + '"\n]');
  nada('const chaveDoCanal =\n  `' + v + '`;');
  // T8: sem aspas, menos de 16 caracteres; entre aspas, menos de 12
  nada('Environment=EVOLUTION_' + 'CHAVE=' + v.slice(0, 14));
  nada('chaveDoCanal: ' + v.slice(0, 15));
  nada('"chaveDoCanal": "' + v.slice(0, 11) + '"');
  acha('chaveDoCanal: ' + v.slice(0, 16));
  acha('"chaveDoCanal": "' + v.slice(0, 12) + '"');
});

rodar();
