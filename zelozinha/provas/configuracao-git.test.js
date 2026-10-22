'use strict';
/*
 * PROVA da configuração do git para a Zelozinha (Story 6.112, Fase 2A, task 6).
 *
 *   AC3.3  O `.gitattributes` não converte fim de linha dentro de zelozinha/runtime/: um arquivo
 *          com CRLF entra e sai do projeto com os MESMOS bytes (senão o `sha256sum -c` do
 *          manifesto da Codex acusaria diferença e a importação deixaria de ser "byte a byte").
 *   AC4.4  O `.gitignore` bloqueia `automatico80.json` (a configuração real, com segredos);
 *          só `*.modelo.json` passa. Entra também `zelozinha/**\/node_modules/` (AC3.2).
 *
 * Como as provas funcionam: cada verificação é uma função que recebe o TEXTO do arquivo e devolve
 * a lista de problemas. Ela roda com o arquivo real (tem de dar lista vazia) e com "defeitos
 * plantados" (cópias estragadas de propósito; cada uma tem de dar pelo menos um problema).
 * Os repositórios são descartáveis, criados numa pasta temporária; nenhum dado de verdade.
 *
 * Uso:  node zelozinha/provas/configuracao-git.test.js
 */

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const A = require('./ajuda');

const { prova, rodar } = A.criarProvas('Configuração do git para a Zelozinha (.gitattributes e .gitignore)');

/** Falha mostrando só os primeiros problemas (a lista inteira pode ter dezenas de linhas). */
function semProblemas(lista) {
  if (lista.length === 0) return;
  throw new Error(lista.length + ' problema(s):\n' + lista.slice(0, 6).join('\n') + (lista.length > 6 ? '\n(+' + (lista.length - 6) + ')' : ''));
}

// ---------------------------------------------------------------------------------------------
// .gitattributes
// ---------------------------------------------------------------------------------------------

const CINCO_LINHAS_DA_BASE = [
  '*.html text eol=lf',
  '*.js text eol=lf',
  '*.md text eol=lf',
  '*.json text eol=lf',
  '*.gs text eol=lf',
];
const LINHA_NOVA = 'zelozinha/runtime/** -text';

/** Arquivos que a Codex pode trazer, todos com fim de linha que o git costuma "consertar". */
function amostrasDoRuntime() {
  const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
  const txt = (s) => Buffer.from(s, 'utf8');
  return [
    { caminho: 'zelozinha/runtime/automatico81/executar-automatico81.cjs', conteudo: txt("#!/usr/bin/env node\r\n'use strict';\r\nconst a = 1;\r\n") },
    { caminho: 'zelozinha/runtime/automatico81/calendario106.js', conteudo: txt('a\r\nb\nc\r\n') },
    { caminho: 'zelozinha/runtime/mensagem-unica41/index.js', conteudo: txt('sem quebra no fim\r\nsegunda linha') },
    { caminho: 'zelozinha/runtime/package.json', conteudo: txt('{\r\n  "name": "amostra"\r\n}\r\n') },
    { caminho: 'zelozinha/runtime/package-lock.json', conteudo: txt('{\r\n  "lockfileVersion": 3\r\n}\r\n') },
    { caminho: 'zelozinha/runtime/LEIA-ME.md', conteudo: txt('# Amostra\r\n\r\ntexto\r\n') },
    { caminho: 'zelozinha/runtime/fontes43/pagina.html', conteudo: txt('<p>a</p>\r\n<p>b</p>\r\n') },
    { caminho: 'zelozinha/runtime/fontes43/com-bom.js', conteudo: Buffer.concat([BOM, txt('x\r\ny\r\n')]) },
    { caminho: 'zelozinha/runtime/automatico81/sem-extensao', conteudo: txt('a\rb\r\nc') },
    { caminho: 'zelozinha/runtime/automatico81/unidade.service', conteudo: txt('[Unit]\r\nDescription=amostra\r\n') },
    { caminho: 'zelozinha/runtime/dados/binario.bin', conteudo: Buffer.from([0x89, 0x50, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x0d, 0x0a]) },
  ];
}

/** Controle: fora do runtime a trava de LF do app continua valendo (não afrouxamos o resto). */
const CONTROLE_FORA_DO_RUNTIME = 'zelozinha/testes/controle-lf.js';

function extrairTar(tarBuffer, destino) {
  const arquivoTar = path.join(A.temporaria('tarfile'), 'release.tar');   // dentro de uma pasta que será apagada no fim
  fs.writeFileSync(arquivoTar, tarBuffer);
  const r = cp.spawnSync('tar', ['-xf', arquivoTar, '-C', destino]);
  if (r.error && r.error.code === 'ENOENT') return false;   // sem tar nesta máquina: pula só esta conferência
  if (r.status !== 0) throw new Error('tar falhou: ' + String(r.stderr));
  return true;
}

/** Devolve a lista de problemas do .gitattributes dado (vazia = o runtime sai igual ao que entrou). */
function verificarAtributos(textoGitattributes) {
  const problemas = [];
  const amostras = amostrasDoRuntime();
  ['false', 'true', 'input'].forEach((modo) => {
    const origem = A.repositorioNovo();
    A.git(origem, ['config', 'core.autocrlf', modo]);
    const arquivos = { '.gitattributes': textoGitattributes };
    amostras.forEach((a) => { arquivos[a.caminho] = a.conteudo; });
    arquivos[CONTROLE_FORA_DO_RUNTIME] = Buffer.from("'use strict';\r\nconst a = 1;\r\n");
    A.escrever(origem, arquivos);
    A.commitar(origem, 'amostras');

    // 1. o que o git guardou no commit
    amostras.forEach((a) => {
      const blob = A.git(origem, ['cat-file', 'blob', 'HEAD:' + a.caminho], { buffer: true });
      if (A.sha256(blob) !== A.sha256(a.conteudo)) problemas.push('autocrlf=' + modo + ': ' + a.caminho + ' mudou ao ser commitado');
    });
    const controle = A.git(origem, ['cat-file', 'blob', 'HEAD:' + CONTROLE_FORA_DO_RUNTIME], { buffer: true });
    if (controle.includes(0x0d)) problemas.push('autocrlf=' + modo + ': a trava de LF do app deixou de valer fora do runtime');

    // 2. o que sai de um clone novo (é o que um checkout do GitHub faz)
    const clone = A.temporaria('clone');
    A.git(clone, ['-c', 'core.autocrlf=' + modo, 'clone', '-q', origem, '.']);
    const linhasManifesto = [];
    amostras.forEach((a) => {
      const lido = fs.readFileSync(path.join(clone, a.caminho));
      if (A.sha256(lido) !== A.sha256(a.conteudo)) problemas.push('autocrlf=' + modo + ': ' + a.caminho + ' saiu diferente do clone');
      linhasManifesto.push(A.sha256(a.conteudo) + '  ' + a.caminho);
    });

    // 3. o que sai do `git archive` (é como o publicador monta a release na VPS)
    const destinoTar = A.temporaria('tar');
    const tar = A.git(origem, ['archive', '--format=tar', 'HEAD', 'zelozinha/runtime'], { buffer: true });
    if (extrairTar(tar, destinoTar)) {
      amostras.forEach((a) => {
        const lido = fs.readFileSync(path.join(destinoTar, a.caminho));
        if (A.sha256(lido) !== A.sha256(a.conteudo)) problemas.push('autocrlf=' + modo + ': ' + a.caminho + ' saiu diferente do git archive');
      });
    }

    // 4. o mesmo conferidor do AC3.2: sha256sum -c do manifesto, dentro do clone
    const manifesto = path.join(A.temporaria('manifesto'), 'amostras.sha256');
    fs.writeFileSync(manifesto, linhasManifesto.join('\n') + '\n');
    const sc = cp.spawnSync('sha256sum', ['-c', manifesto], { cwd: clone });
    if (!(sc.error && sc.error.code === 'ENOENT') && sc.status !== 0) {
      problemas.push('autocrlf=' + modo + ': sha256sum -c do manifesto de amostra acusou diferença');
    }
  });
  return problemas;
}

function semLinhaNova(texto) {
  return texto.split('\n').filter((l) => l.trim() !== LINHA_NOVA).join('\n');
}

prova('P1 (AC3.3) — .gitattributes real: CRLF dentro de zelozinha/runtime/ entra e sai com os mesmos bytes (commit, clone, git archive e sha256sum -c; autocrlf false, true e input)', () => {
  const real = A.lerDaRaiz('.gitattributes');
  assert.ok(real !== null, '.gitattributes não existe');
  semProblemas(verificarAtributos(real));
});

prova('P2 — as cinco linhas de LF do app continuam no .gitattributes, e a linha nova vem DEPOIS delas (a última regra vence)', () => {
  const linhas = A.lerDaRaiz('.gitattributes').split('\n').map((l) => l.trim());
  const posicaoNova = linhas.indexOf(LINHA_NOVA);
  assert.ok(posicaoNova >= 0, 'falta a linha "' + LINHA_NOVA + '"');
  CINCO_LINHAS_DA_BASE.forEach((l) => {
    const p = linhas.indexOf(l);
    assert.ok(p >= 0, 'sumiu a linha de LF do app: ' + l);
    assert.ok(p < posicaoNova, 'a linha nova precisa vir depois de: ' + l);
  });
});

prova('P3 (d13) — defeitos plantados no .gitattributes: sem a linha, linha antes das de LF, "runtime/*" sem recursão e "* -text" global são todos pegos', () => {
  const real = A.lerDaRaiz('.gitattributes');
  const base = semLinhaNova(real);
  const linhas = base.split('\n');
  const antes = [linhas[0], LINHA_NOVA].concat(linhas.slice(1)).join('\n');
  const mutantes = {
    'sem a linha (como a base 35c0ebb)': base,
    'linha antes das de LF (a última regra vence, então não vale)': antes,
    'zelozinha/runtime/* -text (só os arquivos diretos, sem as subpastas)': base.replace(/\n*$/, '\n') + 'zelozinha/runtime/* -text\n',
    '"* -text" global (afrouxa o app inteiro)': base.replace(/\n*$/, '\n') + '* -text\n',
  };
  Object.keys(mutantes).forEach((nome) => {
    assert.ok(verificarAtributos(mutantes[nome]).length > 0, 'o defeito passou sem ser pego: ' + nome);
  });
});

// ---------------------------------------------------------------------------------------------
// .gitignore
// ---------------------------------------------------------------------------------------------

const DEVE_SER_IGNORADO = [
  'automatico80.json',
  'zelozinha/config/automatico80.json',
  'zelozinha/runtime/automatico81/automatico80.json',
  'etc/zeluz-piloto/automatico80.json',
  'zelozinha/config/automatico80.json.bak',
  'zelozinha/runtime/node_modules/pacote/index.js',
  'zelozinha/runtime/automatico81/node_modules/pacote/index.js',
  'zelozinha/testes/node_modules/pacote/index.js',
  // o que já era barrado continua barrado, inclusive DENTRO do runtime (nenhuma exceção por pasta)
  'zelozinha/runtime/credentials.json',
  'zelozinha/runtime/automatico81/secret-x.js',
  'zelozinha/runtime/.env',
  'zelozinha/.env.producao',
  'servidor-senha/node_modules/pacote/index.js',
];
const DEVE_PASSAR = [
  'zelozinha/config/automatico80.modelo.json',
  'zelozinha/config/CHAVES.md',
  'zelozinha/runtime/automatico81/executar-automatico81.cjs',
  'zelozinha/runtime/automatico81/calendario106.js',
  'zelozinha/runtime/mensagem-unica41/index.js',
  'zelozinha/runtime/package.json',
  'zelozinha/runtime/package-lock.json',
  'zelozinha/manifesto/automatico106-1225a25c.sha256',
  'zelozinha/implantacao/systemd/zeluz-automatico81.service',
  'regras-banco/publicadas-106.json',
  '.github/workflows/zelozinha-provas.yml',
  'AGENTS.md',
  'CLAUDE.md',
];

/** Devolve a lista de problemas do .gitignore dado. */
function verificarIgnore(textoGitignore) {
  const problemas = [];
  const repo = A.repositorioNovo({ '.gitignore': textoGitignore });
  const ignorado = (caminho) => {
    const r = A.git(repo, ['check-ignore', '-q', '--no-index', '--', caminho], { aceitarStatus: true });
    if (r.status !== 0 && r.status !== 1) throw new Error('git check-ignore deu status ' + r.status);
    return r.status === 0;
  };
  DEVE_SER_IGNORADO.forEach((c) => { if (!ignorado(c)) problemas.push('deveria ser ignorado e passa: ' + c); });
  DEVE_PASSAR.forEach((c) => { if (ignorado(c)) problemas.push('deveria passar e é ignorado: ' + c); });
  return problemas;
}

prova('P4 (AC4.4, AC3.2) — .gitignore real: automatico80.json (em qualquer pasta) e node_modules do zelozinha ficam de fora; só o *.modelo.json passa; nada do que já era barrado foi liberado', () => {
  const real = A.lerDaRaiz('.gitignore');
  assert.ok(real !== null, '.gitignore não existe');
  semProblemas(verificarIgnore(real));
});

prova('P5 (d12, d59) — defeitos plantados no .gitignore: sem automatico80.json, sem node_modules do zelozinha, exceção por PASTA do runtime e exceção por nome genérico são todos pegos', () => {
  const real = A.lerDaRaiz('.gitignore');
  const tira = (re) => real.split('\n').filter((l) => !re.test(l.trim())).join('\n');
  const mutantes = {
    'sem a linha automatico80.json (d12)': tira(/^automatico80\.json$/),
    'sem as cópias automatico80.json.*': tira(/^automatico80\.json\.\*$/),
    'sem zelozinha/**/node_modules/': tira(/^zelozinha\/\*\*\/node_modules\/$/),
    'exceção por PASTA: o runtime inteiro liberado, até nome de segredo (d59)': real.replace(/\n*$/, '\n') + '!zelozinha/runtime/**\n',
    'exceção que libera qualquer *.json de configuração': real.replace(/\n*$/, '\n') + '!automatico80*.json\n',
  };
  Object.keys(mutantes).forEach((nome) => {
    assert.notStrictEqual(mutantes[nome], real, 'o defeito não mudou o arquivo (a linha nem existia): ' + nome);
    assert.ok(verificarIgnore(mutantes[nome]).length > 0, 'o defeito passou sem ser pego: ' + nome);
  });
});

rodar();
