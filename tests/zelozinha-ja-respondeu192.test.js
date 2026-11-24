'use strict';
/* Zelozinha: o tutor que já respondeu num dia anterior não recebe a mesma pergunta de novo (Adriana, 24/nov/2026).
   «Foi enviado novamente para o tutor a proteção contra carrapatos dos dois irmãos, e eu já tinha colocado que o tutor autorizou [...].
   Não pode mandar para quem já tomou.»
   Prova o snapshot do hook 41 (o que decide o que entra na fila no check-in) tirado do próprio index.html. Dados inventados. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');
const ini = html.indexOf('/* zelozinha41-hook/zelozinha41-hook.js */');
const fim = html.indexOf('/* zelozinha40/zelozinha40-rtdb-repositorio.js */');
assert.ok(ini > 0 && fim > ini, 'achei o hook 41 no index.html');
const codigo = html.slice(ini, fim);

function carregar() {
  const ctx = {
    Zelozinha41Adaptador: {},
    ZeluzPrevencaoFontes: {
      tipoCuidado: (x) => ({ ecto_p: 'ectoparasita', verm_p: 'vermifugo', vac_raiva_p: 'vacina' })[x && x.k] || '',
      evidenciaDoRegistro: (r, assuntos) => {
        const resp = (r && r.respostas) || {};
        for (const a of assuntos) { const v = String((resp[a] || {}).v || ''); if (v && v !== 'sem') return { tipo: 'resposta', assunto: a, valor: v }; }
        return null;
      }
    }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx);
  return ctx.Zelozinha41Hook;
}
const H = carregar();
assert.ok(H && typeof H.snapshot === 'function', 'o hook expõe o snapshot');

const HOJE = '2026-11-24', DC = 'luna__familia-ficticia';
const recibo = { confirmed: true, tipo: 'entrada', dia: HOJE, dcKey: DC, path: 'daycare/checkin-corpo/' + HOJE + '/' + DC, fim: 1, quem: 'Monitora Fictícia', nome: 'Luna', tutor: 'Família Fictícia' };
const ciclo = (vence, item) => JSON.stringify([DC, DC, item.replace(/_p$/, ''), vence, item]);
const resposta88 = (vence, item, decisao, origem, estado) => ({ respostasEscopo49: { porCiclo: { c1: { itemK: item, cycleKey: ciclo(vence, item), decisao, origem: origem || '', estado: estado || 'decidido' } } } });

function portas(o) {
  o = o || {};
  const itens = o.itens || [{ k: 'ecto_p', vence: '2026-11-19', tipo: 'ecto' }];
  const regs = o.regs || {};
  const p = {
    cadastroPronto: () => true,
    vencimentosProntos: () => true,
    peludinhos: () => [{ n: 'Luna', tutor: 'Família Fictícia' }],
    dcKey: () => DC, pelKey: () => 'luna__familia ficticia', pelNome: (x) => x.n, pelExtra: () => ({}),
    vencItensDe: (ex, dia) => itens.filter((x) => x.vence <= dia),
    vencRegDeDia: (dia, chave) => (chave === DC ? regs[dia] || null : null),
    vencRespostaDe: (r, tipo) => ((r || {}).respostas || {})[tipo] || null,
    vencRespDef: () => null,
    vencTipoDoItemObj: (x) => x.tipo
  };
  if (o.anteriores !== undefined) p.vencAnterioresProntos = () => o.anteriores;
  return p;
}
const rodar = (o) => H.snapshot(recibo, portas(o), {});
const itensNaFila = (s) => JSON.parse(JSON.stringify((s.prevencoes || []).map((x) => x.itemK)));   // a lista vem de outro contexto (vm)

let n = 0;
function prova(nome, fn) { fn(); n++; console.log('ok', n, '-', nome); }

prova('o caso de 24/11: «Autorizou pegar na loja» em 19/11 barra a pergunta em 24/11, com a ficha ainda vencida', () => {
  const s = rodar({ anteriores: true, regs: { '2026-11-19': resposta88('2026-11-19', 'ecto_p', 'autorizar', 'loja') } });
  assert.strictEqual(s.ok, true);
  assert.deepStrictEqual(itensNaFila(s), []);
  const r = s.revisoes.find((x) => x.itemK === 'ecto_p');
  assert.ok(r && /já respondeu em 19\/11/.test(r.motivo), 'diz quando o tutor respondeu');
  assert.strictEqual(r.respondidoEm, '2026-11-19');
});

prova('sem resposta em dia nenhum, a pergunta entra na fila como sempre', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true })), ['ecto_p']);
});

prova('«Vai fazer em casa» (externo) e «Trouxe na bolsa» de outro dia também barram', () => {
  for (const origem of ['externo', 'bolsa']) {
    const s = rodar({ anteriores: true, regs: { '2026-11-20': resposta88('2026-11-19', 'ecto_p', 'autorizar', origem) } });
    assert.deepStrictEqual(itensNaFila(s), [], origem);
  }
});

prova('recusa do tutor em outro dia barra', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': resposta88('2026-11-19', 'ecto_p', 'recusar') } })), []);
});

prova('«Não respondeu» (aguardar) não barra: a Zelozinha pergunta de novo', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': resposta88('2026-11-19', 'ecto_p', 'aguardar') } })), ['ecto_p']);
});

prova('resposta ainda não decidida (rascunho) não barra', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': resposta88('2026-11-19', 'ecto_p', 'autorizar', 'loja', 'rascunho') } })), ['ecto_p']);
});

prova('resposta de um ciclo antigo (outro vencimento) não barra o ciclo novo', () => {
  const s = rodar({ anteriores: true, itens: [{ k: 'ecto_p', vence: '2026-11-19', tipo: 'ecto' }], regs: { '2026-11-19': resposta88('2026-10-20', 'ecto_p', 'autorizar', 'loja') } });
  assert.deepStrictEqual(itensNaFila(s), ['ecto_p']);
});

prova('resposta a outro cuidado não barra este', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': resposta88('2026-11-19', 'verm_p', 'autorizar', 'loja') } })), ['ecto_p']);
});

prova('formato antigo: «respostas.ecto» de um dia anterior barra; «sem» não barra', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': { respostas: { ecto: { v: 'casa' } } } } })), []);
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': { respostas: { ant_ecto: { v: 'zeluz' } } } } })), []);
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-19': { respostas: { ecto: { v: 'sem' } } } } })), ['ecto_p']);
});

prova('formato antigo de antes da véspera do vencimento é de outro ciclo: não barra', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-10': { respostas: { ecto: { v: 'casa' } } } } })), ['ecto_p']);
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { '2026-11-18': { respostas: { ecto: { v: 'casa' } } } } })), [], 'a véspera conta');
});

prova('sem os dias anteriores na memória, nada entra na fila e o snapshot pede a leitura', () => {
  const s = rodar({ anteriores: false });
  assert.strictEqual(s.ok, false);
  assert.strictEqual(s.precisaAnteriores, true);
  assert.strictEqual(s.checkinSaved, true);
});

prova('cuidado que vence amanhã não depende dos dias anteriores', () => {
  const s = rodar({ anteriores: false, itens: [{ k: 'ecto_p', vence: '2026-11-25', tipo: 'ecto' }] });
  assert.strictEqual(s.ok, true);
  assert.deepStrictEqual(itensNaFila(s), ['ecto_p']);
});

prova('quem não passa a porta nova (provas antigas) segue como antes', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ regs: { '2026-11-19': resposta88('2026-11-19', 'ecto_p', 'autorizar', 'loja') } })), []);
  assert.deepStrictEqual(itensNaFila(rodar({})), ['ecto_p']);
});

prova('a resposta de hoje continua barrando como antes', () => {
  assert.deepStrictEqual(itensNaFila(rodar({ anteriores: true, regs: { [HOJE]: { respostas: { ecto: { v: 'loja' } } } } })), []);
});

prova('o app real liga a porta e a fila lê os vencimentos quando faltam os dias anteriores', () => {
  assert.ok(/vencAnterioresProntos:function\(\)\{return typeof VENC_PEND!=='undefined'&&VENC_PEND!==null;\}/.test(html), 'porta real');
  assert.ok(html.includes("((s&&s.precisaAnteriores===true)||(typeof portas.vencimentosProntos==='function'&&portas.vencimentosProntos(recibo.dia)!==true))"), 'a fila carrega e tenta de novo');
});

console.log('\n' + n + ' provas passaram');
