#!/usr/bin/env node
'use strict';
/*
 * REGRA "o código mudou, o número muda" (Story 6.112, AC7.2).
 *
 * Se um pull request altera algo dentro de `zelozinha/runtime/`, ele precisa alterar também `zelozinha/VERSAO`.
 * Sem isso o sinal fica vermelho com uma frase em português. Alterar só a VERSAO é permitido (é a publicação de
 * ensaio do AC19.5); alterar só documentos também.
 *
 * Uso (o workflow de provas, do @devops, chama assim; `base` é o commit onde o pull request nasceu e `head`, o último):
 *   node zelozinha/provas/regra-versao.js --base <commit-base> --head <commit-final> [--repo <pasta>]
 *
 * Saída: 0 = verde, 1 = vermelho (com a frase), 2 = uso errado ou referência que não existe (nunca verde por engano).
 * Os renomes não escondem nada: um arquivo movido para fora do runtime conta como mudança do runtime.
 */

const cp = require('child_process');

const FRASE = 'O código da Zelozinha mudou; mude também o número em zelozinha/VERSAO.';
const PASTA_DO_RUNTIME = 'zelozinha/runtime/';
const ARQUIVO_DA_VERSAO = 'zelozinha/VERSAO';

/** Recebe a lista de caminhos alterados (a partir da raiz do projeto) e devolve { ok, mensagem }. */
function verificarVersao(arquivosAlterados) {
  const mudouORuntime = arquivosAlterados.some((a) => a.startsWith(PASTA_DO_RUNTIME));
  const mudouAVersao = arquivosAlterados.includes(ARQUIVO_DA_VERSAO);
  if (mudouORuntime && !mudouAVersao) return { ok: false, mensagem: FRASE };
  if (mudouORuntime) return { ok: true, mensagem: 'O código da Zelozinha mudou e o número em zelozinha/VERSAO também.' };
  return { ok: true, mensagem: 'O código da Zelozinha não mudou neste pull request.' };
}

const REFERENCIA = /^[0-9A-Za-z_@{}/~^.][0-9A-Za-z_@{}/~^.-]*$/;

/** Pergunta ao git quais arquivos o pull request alterou (desde o ponto onde o ramo nasceu). */
function arquivosAlterados(repo, base, head) {
  if (!REFERENCIA.test(base) || !REFERENCIA.test(head)) throw new Error('Referência de commit inválida.');
  const r = cp.spawnSync('git', ['-c', 'core.quotepath=false', '--no-pager', 'diff', '--name-only', '--no-renames', '-z', base + '...' + head], {
    cwd: repo,
    env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }),
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'utf8',
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('O git não achou os commits informados (' + String(r.stderr || '').trim().split('\n')[0] + ').');
  return r.stdout.split('\0').filter(Boolean);
}

function principal(argv) {
  const pegar = (nome) => { const i = argv.indexOf(nome); return i === -1 ? null : argv[i + 1]; };
  const base = pegar('--base');
  const head = pegar('--head');
  const repo = pegar('--repo') || process.cwd();
  if (!base || !head) {
    console.error('ERRO: informe --base <commit> e --head <commit>.');
    return 2;
  }
  try {
    const v = verificarVersao(arquivosAlterados(repo, base, head));
    console.log((v.ok ? 'VERDE: ' : 'VERMELHO: ') + v.mensagem);
    return v.ok ? 0 : 1;
  } catch (e) {
    console.error('ERRO: ' + e.message);
    return 2;
  }
}

module.exports = { FRASE, arquivosAlterados, verificarVersao };

if (require.main === module) process.exit(principal(process.argv.slice(2)));
