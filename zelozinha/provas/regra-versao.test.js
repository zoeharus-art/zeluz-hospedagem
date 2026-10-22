'use strict';
/*
 * PROVA da regra "o código mudou, o número muda" (Story 6.112, AC7.2; prepara a task 9 do @devops).
 *
 * Quando `zelozinha/runtime/` muda e `zelozinha/VERSAO` não muda, o sinal fica vermelho com a frase
 * «O código da Zelozinha mudou; mude também o número em zelozinha/VERSAO.» (d18: "runtime muda, VERSAO não, e passa").
 *
 * A regra é uma função pura (lista de arquivos alterados -> veredito) e uma linha de comando que pergunta ao git
 * quais arquivos o pull request alterou. As provas rodam a regra real e quatro versões estragadas de propósito
 * (cada uma tem de ser pega por pelo menos um caso), e depois a linha de comando em repositórios descartáveis,
 * como seria num pull request de verdade.
 *
 * Uso:  node zelozinha/provas/regra-versao.test.js
 */

const assert = require('assert');
const cp = require('child_process');
const path = require('path');
const A = require('./ajuda');
const R = require('./regra-versao');

const { prova, rodar } = A.criarProvas('Regra: se o runtime muda, o número da versão muda');

const CLI = path.join(__dirname, 'regra-versao.js');

const CASOS = [
  { nome: 'só documentos', arquivos: ['zelozinha/README.md', 'zelozinha/docs/ESTADO.md'], ok: true },
  { nome: 'runtime sem VERSAO (o defeito d18)', arquivos: ['zelozinha/runtime/automatico81/calendario106.js'], ok: false },
  { nome: 'runtime direto, sem subpasta, sem VERSAO', arquivos: ['zelozinha/runtime/package.json'], ok: false },
  { nome: 'runtime e VERSAO juntos', arquivos: ['zelozinha/runtime/automatico81/calendario106.js', 'zelozinha/VERSAO'], ok: true },
  { nome: 'só a VERSAO (a publicação de ensaio do AC19.5)', arquivos: ['zelozinha/VERSAO', 'zelozinha/docs/HISTORICO-RELEASES.md'], ok: true },
  { nome: 'nenhum arquivo', arquivos: [], ok: true },
  { nome: 'arquivo do app', arquivos: ['index.html', 'auaulandia/index.html'], ok: true },
  { nome: 'pasta de nome parecido com runtime não conta', arquivos: ['zelozinha/runtime-notas.md'], ok: true },
  { nome: 'config e manifesto não são runtime', arquivos: ['zelozinha/config/CHAVES.md', 'zelozinha/manifesto/automatico106-1225a25c.sha256'], ok: true },
];

function falhasDaImplementacao(verificar) {
  return CASOS.filter((c) => verificar(c.arquivos).ok !== c.ok).map((c) => c.nome);
}

prova('RV1 (AC7.2) — a regra real acerta todos os casos e diz a frase combinada', () => {
  assert.deepStrictEqual(falhasDaImplementacao(R.verificarVersao), []);
  assert.strictEqual(R.verificarVersao(['zelozinha/runtime/x.js']).mensagem, 'O código da Zelozinha mudou; mude também o número em zelozinha/VERSAO.');
});

prova('RV2 (d18) — defeitos plantados na regra: ignorar a VERSAO, olhar só a raiz do runtime, prefixo frouxo e exigir VERSAO sempre são todos pegos', () => {
  const ok = { ok: true, mensagem: '' };
  const ruim = { ok: false, mensagem: 'x' };
  const mutantes = {
    'ignora a VERSAO (passa sempre)': () => ok,
    'olha só os arquivos diretos do runtime': (a) => (a.some((f) => /^zelozinha\/runtime\/[^/]+$/.test(f)) && !a.includes('zelozinha/VERSAO') ? ruim : ok),
    'prefixo sem a barra (pega runtime-notas.md)': (a) => (a.some((f) => f.startsWith('zelozinha/runtime')) && !a.includes('zelozinha/VERSAO') ? ruim : ok),
    'exige a VERSAO em qualquer mudança da pasta': (a) => (a.some((f) => f.startsWith('zelozinha/')) && !a.includes('zelozinha/VERSAO') ? ruim : ok),
  };
  Object.keys(mutantes).forEach((nome) => {
    assert.ok(falhasDaImplementacao(mutantes[nome]).length > 0, 'o defeito passou sem ser pego: ' + nome);
  });
});

function pullRequest(arquivosBase, mudar) {
  const repo = A.repositorioNovo(arquivosBase);
  const base = A.commitar(repo, 'base');
  A.git(repo, ['checkout', '-q', '-b', 'ramo']);
  mudar(repo);
  const head = A.commitar(repo, 'mudanças do pull request');
  return { repo, base, head };
}

function rodarCli(repo, base, head) {
  const r = cp.spawnSync(process.execPath, [CLI, '--base', base, '--head', head, '--repo', repo], { encoding: 'utf8', env: A.ambienteGit() });
  return { status: r.status, saida: String(r.stdout) + String(r.stderr) };
}

const BASE = { 'zelozinha/runtime/a.js': 'a\n', 'zelozinha/runtime/sub/b.js': 'b\n', 'zelozinha/VERSAO': '106\n', 'zelozinha/README.md': 'r\n', 'index.html': '<p>app</p>\n' };

prova('RV3 (AC7.2) — a linha de comando num pull request de verdade: runtime mudado com VERSAO igual dá vermelho com a frase; com VERSAO mudada, só documentos, só a VERSAO ou só o app dá verde', () => {
  const casos = [
    ['runtime mudado, VERSAO igual', (r) => A.escrever(r, { 'zelozinha/runtime/a.js': 'a2\n' }), 1],
    ['runtime novo numa subpasta, VERSAO igual', (r) => A.escrever(r, { 'zelozinha/runtime/novo/c.js': 'c\n' }), 1],
    ['runtime apagado, VERSAO igual', (r) => A.git(r, ['rm', '-q', 'zelozinha/runtime/sub/b.js']), 1],
    ['arquivo MOVIDO para fora do runtime, VERSAO igual (rename não esconde a mudança)', (r) => A.git(r, ['mv', 'zelozinha/runtime/a.js', 'zelozinha/README-a.js']), 1],
    ['runtime e VERSAO mudados', (r) => A.escrever(r, { 'zelozinha/runtime/a.js': 'a2\n', 'zelozinha/VERSAO': '107\n' }), 0],
    ['só documentos', (r) => A.escrever(r, { 'zelozinha/README.md': 'r2\n' }), 0],
    ['só a VERSAO', (r) => A.escrever(r, { 'zelozinha/VERSAO': '107\n' }), 0],
    ['só o app', (r) => A.escrever(r, { 'index.html': '<p>app2</p>\n' }), 0],
  ];
  casos.forEach(([nome, mudar, esperado]) => {
    const { repo, base, head } = pullRequest(BASE, mudar);
    const r = rodarCli(repo, base, head);
    assert.strictEqual(r.status, esperado, nome + ': ' + r.saida);
    if (esperado === 1) {
      assert.ok(r.saida.includes('O código da Zelozinha mudou; mude também o número em zelozinha/VERSAO.'), nome + ': falta a frase: ' + r.saida);
      assert.ok(/VERMELHO/.test(r.saida));
    } else {
      assert.ok(/VERDE/.test(r.saida), nome + ': ' + r.saida);
    }
  });
});

prova('RV4 — com a pasta zelozinha/ ainda vazia (Fase 2A) a regra dá verde; uso errado e referência que não existe dão erro (2), nunca verde', () => {
  const { repo, base, head } = pullRequest({ 'index.html': '<p>app</p>\n' }, (r) => A.escrever(r, { 'zelozinha/README.md': 'novo\n' }));
  assert.strictEqual(rodarCli(repo, base, head).status, 0);
  const semArgumentos = cp.spawnSync(process.execPath, [CLI], { encoding: 'utf8' });
  assert.strictEqual(semArgumentos.status, 2);
  const inexistente = rodarCli(repo, '0000000000000000000000000000000000000000', head);
  assert.strictEqual(inexistente.status, 2, inexistente.saida);
  assert.ok(!/VERDE/.test(inexistente.saida));
});

rodar();
