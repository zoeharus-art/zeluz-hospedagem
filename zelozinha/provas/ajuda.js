'use strict';
/*
 * Ajudas comuns das provas do projeto da Zelozinha (Story 6.112, Fase 2A).
 *
 * Sem rede, sem banco, sem WhatsApp e sem nenhum dado de verdade. As provas que precisam do
 * git criam repositórios descartáveis numa pasta temporária (a variável TMPDIR / TEMP manda
 * onde) e os apagam no fim. Nada aqui lê nem grava fora dessa pasta.
 */

const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Raiz do projeto: zelozinha/provas/ -> zelozinha/ -> raiz. */
const RAIZ = path.join(__dirname, '..', '..');

const temporarias = [];

/** Cria uma pasta temporária vazia; é apagada em limparTemporarias(). */
function temporaria(prefixo) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'zelozinha-' + (prefixo || 'prova') + '-'));
  temporarias.push(pasta);
  return pasta;
}

function limparTemporarias() {
  while (temporarias.length) {
    const pasta = temporarias.pop();
    try { fs.rmSync(pasta, { recursive: true, force: true }); } catch (e) { /* já saiu */ }
  }
}

/**
 * Ambiente do git isolado da máquina de quem roda: nenhuma configuração global ou do
 * sistema (autocrlf, assinatura de commit, ganchos), identidade inventada.
 */
function ambienteGit(extra) {
  return Object.assign({}, process.env, {
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Prova',
    GIT_AUTHOR_EMAIL: 'prova@exemplo.invalid',
    GIT_COMMITTER_NAME: 'Prova',
    GIT_COMMITTER_EMAIL: 'prova@exemplo.invalid',
    GIT_TERMINAL_PROMPT: '0',
  }, extra || {});
}

/**
 * Roda o git (sem shell) numa pasta. Devolve texto UTF-8, ou Buffer com { buffer: true }.
 * Erro do git vira Error com a mensagem dele.
 */
function git(cwd, args, opcoes) {
  const o = opcoes || {};
  const r = cp.spawnSync('git', ['-c', 'core.quotepath=false'].concat(args), {
    cwd,
    env: ambienteGit(o.env),
    input: o.entrada,
    maxBuffer: 512 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0 && !o.aceitarStatus) {
    throw new Error('git ' + args.join(' ') + ' falhou (' + r.status + '): ' + String(r.stderr || '').trim());
  }
  if (o.aceitarStatus) return { status: r.status, saida: o.buffer ? r.stdout : String(r.stdout) };
  return o.buffer ? r.stdout : String(r.stdout);
}

/** Repositório novo, com o ramo master e o texto dado nos arquivos (caminho -> texto/Buffer). */
function repositorioNovo(arquivos) {
  const pasta = temporaria('repo');
  git(pasta, ['init', '-q', '--initial-branch=master']);
  if (arquivos) escrever(pasta, arquivos);
  return pasta;
}

function escrever(pasta, arquivos) {
  Object.keys(arquivos).forEach((caminho) => {
    const destino = path.join(pasta, caminho);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, arquivos[caminho]);
  });
}

/** git add -A e commit; devolve o hash completo do commit. */
function commitar(pasta, mensagem) {
  git(pasta, ['add', '-A']);
  git(pasta, ['commit', '-q', '--allow-empty', '-m', mensagem]);
  return git(pasta, ['rev-parse', 'HEAD']).trim();
}

function sha256(conteudo) {
  return crypto.createHash('sha256').update(conteudo).digest('hex');
}

/** Lê um arquivo da raiz do projeto como texto; null se não existir. */
function lerDaRaiz(relativo) {
  try { return fs.readFileSync(path.join(RAIZ, relativo), 'utf8'); } catch (e) { return null; }
}

/**
 * Corredor mínimo das provas (mesmo estilo de tests/servidor-senha.test.js):
 *   const { prova, rodar } = criarProvas('Título');
 *   prova('nome', () => { ...asserts... });
 *   rodar();
 */
function criarProvas(titulo) {
  const fila = [];
  function prova(nome, fn) { fila.push({ nome, fn }); }
  async function rodar() {
    let ok = 0;
    const falhas = [];
    console.log(titulo);
    for (const p of fila) {
      try {
        await p.fn();
        ok++;
        console.log('  ✓ ' + p.nome);
      } catch (e) {
        const msg = String((e && e.message) || e);
        falhas.push(p.nome + ' — ' + msg.split('\n')[0]);
        console.log('  ✗ ' + p.nome + '\n      ' + msg.split('\n').join('\n      '));
      }
    }
    console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam:' : '.'));
    falhas.forEach((f) => console.log('  - ' + f));
    limparTemporarias();
    process.exit(falhas.length ? 1 : 0);
  }
  return { prova, rodar };
}

module.exports = {
  RAIZ,
  ambienteGit,
  commitar,
  criarProvas,
  escrever,
  git,
  lerDaRaiz,
  limparTemporarias,
  repositorioNovo,
  sha256,
  temporaria,
};
