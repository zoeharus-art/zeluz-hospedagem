'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'auaulandia', 'index.html');
const src = fs.readFileSync(indexPath, 'utf8');

function funcao(nome) {
  const inicio = src.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = src.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < src.length; i += 1) {
    const c = src[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return src.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}

function contexto() {
  const chamadas = { modal: [], alertas: [], mensagem: [], telefone: [], writers: 0 };
  const c = {
    chamadas,
    console,
    PELUDINHOS: [],
    REP_BOTAO_ESTILO: 'min-height:44px;',
    escAttr: (x) => String(x),
    esc: (x) => String(x),
    repAnulados: (L) => {
      const a = {};
      L.forEach((l) => { if (l.tipo === 'estorno' && l.estornaId) a[l.estornaId] = true; });
      return a;
    },
    repLancamentos: (p) => p.lancamentos || [],
    repLancDe: (L, id) => L.find((l) => l._id === id) || null,
    repTrocaViva: (l) => !!(l && l.tipo === 'credito' && l.troca && l.volta && l.troca.para === l.volta),
    repPelaChave: (key) => c.PELUDINHOS.find((p) => c.pelKey(p) === key) || null,
    pelKey: (p) => ((p.n || '') + '__' + (p.tutor || '')).toLowerCase().replace(/[.#$\[\]\/]/g, '-'),
    pelNome: (p) => p.n,
    repPodeLancar: () => true,
    corrQuemPode: () => 'Recepção, Supervisão ou Gestão',
    corrBarrar: (...args) => { chamadas.barrado = args; return false; },
    repNoDia: (d) => 'em ' + d,
    repMsgModal: (...args) => chamadas.modal.push(args),
    repMensagem: (p, tipo, op) => { chamadas.mensagem.push([p, tipo, op]); return 'TEXTO ORIGINAL ' + op.de + ' ' + op.para; },
    repTelDe: (p) => { chamadas.telefone.push(p); return '(00) 90000-0000'; },
    alert: (x) => chamadas.alertas.push(String(x)),
    repSaidaAntecipada: () => false,
    repBotaoLinha: (fn, i, id, rot) => `<button onclick="${fn}(${i},'${id}')">${rot}</button>`,
    repBotaoMensagemTroca: (key, id) => `<button onclick="repTrocaMensagemAbrir('${key}','${id}')">Mensagem para o tutor</button>`,
    repLoteVivos: () => [],
    repUsoDevolvivelPor: () => false,
    repUsoDevolvivel: () => false,
    repEstornoTipo: () => '',
    repEstornoDesfeitoPor: () => null,
    repDevolucaoDesfeitaPor: () => null,
  };
  vm.createContext(c);
  vm.runInContext(funcao('repTrocaDataValida') + '\n' + funcao('repTrocaMensagemAbrir') + '\n' + funcao('repExtratoAcoes'), c);
  return c;
}

(function acoesClaras() {
  const c = contexto();
  const troca = { _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-05', troca: { de: '2026-11-03', para: '2026-11-05' } };
  const html = c.repExtratoAcoes(troca, { i: 7, L: [troca], anulado: {}, chave: 'pingo__tutor-teste' });
  assert.match(html, /Cancelar falta lançada/);
  assert.match(html, /repEstornar\(7,'cred-t1'\)/);
  assert.match(html, /Mensagem para o tutor/);
})();

(function dataRealEPermissao() {
  const c = contexto();
  assert.strictEqual(c.repTrocaDataValida('2026-02-28'), true);
  assert.strictEqual(c.repTrocaDataValida('2026-02-31'), false);
  const troca = { _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-05', troca: { de: '2026-11-03', para: '2026-11-05' } };
  c.PELUDINHOS = [{ n: 'Pingo', tutor: 'Tutor Teste', lancamentos: [troca] }];
  c.repPodeLancar = () => false;
  assert.strictEqual(c.repTrocaMensagemAbrir('pingo__tutor teste', 'cred-t1'), false);
  assert.ok(c.chamadas.barrado);
  assert.strictEqual(c.chamadas.modal.length, 0);
  assert.strictEqual(c.chamadas.telefone.length, 0);
})();

(function reabreSemEscreverMesmoAposReordenar() {
  const c = contexto();
  const troca = { _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-05', troca: { de: '2026-11-03', para: '2026-11-05' } };
  const alvo = { n: 'Pingo', tutor: 'Tutor Teste', lancamentos: [troca] };
  c.PELUDINHOS = [{ n: 'Nuvem', tutor: 'Tutor Exemplo', lancamentos: [] }, alvo];
  assert.strictEqual(c.repTrocaMensagemAbrir('pingo__tutor teste', 'cred-t1'), true);
  assert.strictEqual(c.chamadas.modal.length, 1);
  assert.strictEqual(c.chamadas.modal[0][0], 'Mensagem para o tutor');
  assert.strictEqual(c.chamadas.modal[0][2], 'TEXTO ORIGINAL 2026-11-03 2026-11-05');
  assert.strictEqual(JSON.stringify(c.chamadas.mensagem[0].slice(1)), JSON.stringify(['troca', { de: '2026-11-03', para: '2026-11-05' }]));
  assert.strictEqual(c.chamadas.writers, 0);
})();

(function falhaFechadaParaTrocaCanceladaRemarcadaOuIdErrado() {
  const casos = [
    [{ _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-05', troca: { de: '2026-11-03', para: '2026-11-05' } }, { _id: 'est-cred-t1', tipo: 'estorno', estornaId: 'cred-t1' }],
    [{ _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-06', troca: { de: '2026-11-03', para: '2026-11-05' } }],
  ];
  casos.forEach((lancamentos) => {
    const c = contexto();
    c.PELUDINHOS = [{ n: 'Pingo', tutor: 'Tutor Teste', lancamentos }];
    assert.strictEqual(c.repTrocaMensagemAbrir('pingo__tutor teste', 'cred-t1'), false);
    assert.strictEqual(c.chamadas.modal.length, 0);
  });
  const c = contexto();
  c.PELUDINHOS = [{ n: 'Pingo', tutor: 'Tutor Teste', lancamentos: [] }];
  assert.strictEqual(c.repTrocaMensagemAbrir('pingo__tutor teste', 'inexistente'), false);
  assert.strictEqual(c.chamadas.modal.length, 0);
})();

(function chaveDuplicadaFalhaFechada() {
  const c = contexto();
  const troca = { _id: 'cred-t1', tipo: 'credito', data: '2026-11-03', volta: '2026-11-05', troca: { de: '2026-11-03', para: '2026-11-05' } };
  c.PELUDINHOS = [
    { n: 'Pingo', tutor: 'Tutor Teste', lancamentos: [troca] },
    { n: 'Pingo', tutor: 'Tutor Teste', lancamentos: [troca] },
  ];
  assert.strictEqual(c.repTrocaMensagemAbrir('pingo__tutor teste', 'cred-t1'), false);
  assert.strictEqual(c.chamadas.modal.length, 0);
})();

(function markupDoCartaoUsaIdentidadeEstavel() {
  assert.ok(src.includes("repBotaoMensagemTroca(pelKey(o.p), tc._id, true)"));
  assert.ok(src.includes("repTrocaMensagemAbrir('"));
  assert.ok(!funcao('repTrocaMensagemAbrir').includes('repTrocaGravar'));
  assert.ok(!funcao('repTrocaMensagemAbrir').includes('repDesmarcar'));
  assert.ok(!funcao('repTrocaMensagemAbrir').includes('DB.'));
  assert.match(funcao('repBotaoMensagemTroca'), /min-height:44px/);
  assert.ok(!funcao('repTrocaMensagemAbrir').includes('isoValida'));
})();

async function provaSenhaAdrianaNosWriters() {
  const chamadas = { gravar: 0, transacao: 0, rastros: 0 };
  const c = {
    console,
    chamadas,
    corrRegDaAdriana: (reg) => reg && reg.por === 'Diretora Teste' && reg.papel === 'diretoria',
    repHojeISO: () => '2026-11-02',
    repRastro: () => { chamadas.rastros += 1; },
    pelNome: () => 'Pingo',
    repBRdata: (x) => x,
    repListaDatasE: (xs) => xs.join(', '),
    repMotivoRotulo: (x) => x,
    repBanhoSeHoje: () => {},
    repJaEstornadaTexto: () => 'já cancelada',
    repConexaoCaiu: () => false,
    repIncerto: () => ({ ok: false }),
    quemSou: () => 'Pessoa da sessão',
    repLancDe: (L, id) => L.find((x) => x._id === id) || null,
    repLoteVivos: (L) => L.filter((x) => x.tipo === 'credito'),
    REP_NAO_ACHEI_EXTRATO: 'não achei',
    repGravar: (_p, reg, id) => { chamadas.gravar += 1; chamadas.ultimo = { reg, id }; return Promise.resolve({ committed: true }); },
    repTransacaoExtrato: (_p, montar) => {
      chamadas.transacao += 1;
      const L = [{ _id: 'c1', tipo: 'credito', data: '2026-11-03', lote: 'L1' }];
      const r = montar(L); const o = {}; r.aplica(o);
      chamadas.patch = o;
      return Promise.resolve({ ok: true, info: { ids: r.ids, datas: r.datas, novos: r.novos } });
    },
  };
  vm.createContext(c);
  vm.runInContext(funcao('repEstornarGravar') + '\n' + funcao('repLoteEstornarGravar'), c);
  const p = { n: 'Pingo' };
  const cred = { _id: 'c1', data: '2026-11-03', motivo: 'viagem' };
  const outro = { por: 'Outro Gestor', papel: 'gestao', motivo: 'Lançamento feito por engano' };
  assert.strictEqual((await c.repEstornarGravar(p, cred, outro)).ok, false);
  assert.strictEqual(chamadas.gravar, 0);
  const infoNegada = {};
  assert.strictEqual((await c.repLoteEstornarGravar(p, 'L1', outro, ['c1'], infoNegada)).ok, false);
  assert.strictEqual(chamadas.transacao, 0);

  const adriana = { por: 'Diretora Teste', papel: 'diretoria', motivo: 'Lançamento feito por engano' };
  assert.strictEqual((await c.repEstornarGravar(p, cred, adriana)).ok, true);
  assert.strictEqual(chamadas.gravar, 1);
  assert.strictEqual(chamadas.ultimo.id, 'est-c1');
  const info = {};
  assert.strictEqual((await c.repLoteEstornarGravar(p, 'L1', adriana, ['c1'], info)).ok, true);
  assert.strictEqual(chamadas.transacao, 1);
  assert.ok(chamadas.patch['est-c1']);
}

(function contratoDoCartazDaAdriana() {
  const um = funcao('repEstornarAbrir');
  const lote = funcao('repLoteEstornarAbrir');
  assert.match(um, /nivel:'adriana'/);
  assert.match(um, /adrianaOque:'cancela faltas lançadas'/);
  assert.match(um, /botao:'Cancelar falta lançada'/);
  assert.doesNotMatch(um, /nivel:'gestao'/);
  assert.match(lote, /nivel:'adriana'/);
  assert.match(lote, /adrianaOque:'cancela faltas lançadas'/);
  assert.match(lote, /botao:'Cancelar faltas lançadas'/);
  assert.doesNotMatch(lote, /nivel:'gestao'/);
  assert.ok(!funcao('repDesmarcar').includes('corrRegDaAdriana'));
})();

provaSenhaAdrianaNosWriters().then(() => console.log('reposicoes136-ui: OK')).catch((e) => { console.error(e); process.exitCode = 1; });
