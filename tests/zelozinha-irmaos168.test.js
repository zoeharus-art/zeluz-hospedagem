'use strict';
// Zelozinha: irmãos do mesmo tutor numa mensagem só (Adriana, 30/out/2026: "tutor dono de dois peludinhos,
// sempre se tiver coisa junta mandar juntos, na mesma mensagem, não mandar várias"). Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const N = require('../zelozinha/simples/nucleo');
const { criarServico } = require('../zelozinha/simples/zelozinha');
const MU = require('../zelozinha/simples/mensagem-unica41');
const MI = require('../zelozinha/simples/mensagem-irmaos');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- banco de mentira (Admin SDK da VPS): ler, gravar, ouvir ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) }, ouvintes = [];
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) {
    const ks = partes(p), antesPai = ler(ks.slice(0, -1).join('/')) || {};
    let n = raiz, chave = 'v';
    for (const k of ks) { if (!n[chave] || typeof n[chave] !== 'object') n[chave] = {}; n = n[chave]; chave = k; }
    if (valor === null) delete n[chave]; else n[chave] = JSON.parse(JSON.stringify(valor));
    const pai = ks.slice(0, -1).join('/'), filho = ks[ks.length - 1], agora = ler(pai) || {};
    ouvintes.forEach((o) => {
      if (o.ev === 'value' && (ks.join('/') + '/').startsWith(o.p + '/')) o.fn(snap(partes(o.p).pop(), ler(o.p)));
      if (o.p === pai && o.ev === 'child_added' && !(filho in antesPai) && filho in agora) o.fn(snap(filho, agora[filho]));
      if (o.p === pai && o.ev === 'child_changed' && filho in antesPai && filho in agora) o.fn(snap(filho, agora[filho]));
    });
  }
  function snap(k, v) { return { key: k, val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }; }
  return {
    ref(p) {
      return {
        once: async () => snap(partes(p).pop(), ler(p)),
        update: async (o) => { Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k])); },
        transaction: async (fn) => { const atual = ler(p), novo = fn(atual); if (novo === undefined) return { committed: false }; gravar(p, novo); return { committed: true }; },
        on: (ev, fn) => { ouvintes.push({ p, ev, fn }); if (ev === 'value') fn(snap(partes(p).pop(), ler(p))); if (ev === 'child_added') { const v = ler(p) || {}; Object.keys(v).forEach((k) => fn(snap(k, v[k]))); } },
        off: () => {}
      };
    },
    ler, gravar
  };
}
function evoFalso(op) {
  const e = { envios: [], numeros: 0, op: op || {} };
  e.numero = async (n) => { e.numeros++; if (e.op.numeroFalha) throw Error('fora do ar'); return { ok: true, jid: n + '@' + 's.whatsapp' + '.net' }; };
  e.enviar = async (jid, t, d) => { e.envios.push({ jid, t, d }); return { status: 201, corpo: { key: { id: 'msg-' + e.envios.length, remoteJid: jid } } }; };
  e.estado = async () => 'open';
  return e;
}

const SEG = '2026-11-02', QUI = '2026-11-05', VENCIDO = '2026-10-20';
const CFG = N.lerConfig({ banco: { firebaseUrl: 'https://banco-ficticio.invalid', serviceUid: 'uid-ficticio' }, automatico: { evolution: { baseUrl: 'https://canal-ficticio.invalid', apiKey: 'valor-ficticio', instanceName: 'instancia' } } }).cfg;
const TEL_UM = '5500900000001', TEL_DOIS = '5500900000002';
/* um FILHOt inventado na fila, com a ficha e o check-in dele; o texto é o aprovado para um FILHOt */
function filhot(nome, tutor, para, itens, criadoEm, sexo) {
  const pelKey = nome.toLowerCase() + '__' + tutor.toLowerCase(), dcKey = N.dcKeyDoPelKey(pelKey);
  const it = { v: 1, dia: SEG, dcKey, pelKey, nome, sexo: sexo || '', tutor, para, itens, estado: 'pronto', criadoEm };
  it.texto = MU.gerarMensagem({ nomeTutor: tutor, nomePeludo: nome, sexo: sexo || undefined, dia: SEG, presencaConfirmada: true, cuidados: itens, veterinariaConfirmada: itens.some((x) => x.itemK.startsWith('vac_')) }).texto;
  return it;
}
function banco(itens, extra) {
  const filaDia = {}, cadastro = {}, checkin = {};
  itens.forEach((it) => { filaDia[it.dcKey] = it; cadastro[it.pelKey] = { tutor: it.tutor, tel: it.para.slice(2) }; checkin[it.dcKey] = { tipo: 'entrada', quem: 'Pessoa Fictícia', fim: Date.parse(SEG + 'T07:30:00-03:00') }; });
  const d = { 'zelozinha-fila': { [SEG]: filaDia }, cadastro, 'checkin-corpo': { [SEG]: checkin } };
  Object.keys(extra || {}).forEach((k) => { d[k] = Object.assign(d[k] || {}, extra[k]); });
  return bancoFalso({ daycare: d });
}

prova('o texto dos irmãos é o aprovado, letra por letra', () => {
  const r = MI.gerarMensagemIrmaos({ nomeTutor: 'Fulana', dia: SEG, presencaConfirmada: true, veterinariaConfirmada: true,
    peludos: [{ nome: 'Paçoca', cuidados: [{ itemK: 'vac_gripe_p', vence: '2026-11-03' }] }, { nome: 'Amora', cuidados: [{ itemK: 'vac_mult_p', vence: '2026-11-03' }] }] });
  assert.equal(r.ok, true);
  assert.equal(r.texto, [
    'Bom dia, Fulana! Como você está? 💛',
    '',
    'Paçoca e Amora estão com a gente hoje e temos dois cuidados para deixar em dia:',
    '🐾 Paçoca: a vacina contra gripe *vence amanhã*.',
    '🐾 Amora: a vacina múltipla *vence amanhã*.',
    'Nossa veterinária está aqui hoje.',
    '',
    'Podemos cuidar disso hoje, enquanto eles aproveitam o dia na Zêluz? Assim, vocês resolvem tudo em uma só visita, sem precisar encaixar outro compromisso na rotina — e sobra mais tempo para curtirem juntos. 💛'
  ].join('\n'));
});

prova('texto dos irmãos: «elas», três nomes, uma linha por cuidado e as mesmas regras do texto de um FILHOt', () => {
  const r = MI.gerarMensagemIrmaos({ nomeTutor: 'Fulana', dia: SEG, presencaConfirmada: true,
    peludos: [{ nome: 'Mel', sexo: 'F', cuidados: [{ itemK: 'verm_p', vence: SEG }, { itemK: 'ecto_p', vence: VENCIDO }] }, { nome: 'Luna', sexo: 'F', cuidados: [{ itemK: 'col_p', vence: SEG }] }, { nome: 'Nina', sexo: 'F', cuidados: [{ itemK: 'verm_dose2_p', vence: SEG }] }] });
  assert.equal(r.ok, true);
  assert.match(r.texto, /\nMel, Luna e Nina estão com a gente hoje e temos quatro cuidados para deixar em dia:\n/);
  assert.match(r.texto, /\n🐾 Mel: o vermífugo \*vence hoje\*\.\n🐾 Mel: a proteção contra pulgas e carrapatos \*venceu em 20\/10\/2026\*\.\n🐾 Luna: a coleira repelente \*vence hoje\*\.\n/);
  assert.match(r.texto, /enquanto elas aproveitam o dia/);
  assert.ok(!/veterinária/.test(r.texto), 'sem vacina, sem a linha da veterinária');
  const base = { nomeTutor: 'Fulana', dia: SEG, presencaConfirmada: true };
  const dois = (a, b) => [{ nome: 'Mel', cuidados: a }, { nome: 'Rex', cuidados: b }];
  assert.equal(MI.gerarMensagemIrmaos(Object.assign({}, base, { peludos: [{ nome: 'Mel', cuidados: [{ itemK: 'verm_p', vence: SEG }] }] })).ok, false, 'um FILHOt só usa o texto de um FILHOt');
  assert.match(MI.gerarMensagemIrmaos(Object.assign({}, base, { peludos: dois([{ itemK: 'vac_mult_p', vence: SEG }], [{ itemK: 'verm_p', vence: SEG }]) })).motivo, /veterinária/);
  assert.match(MI.gerarMensagemIrmaos(Object.assign({}, base, { dia: QUI, veterinariaConfirmada: true, peludos: [{ nome: 'Mel', cuidados: [{ itemK: 'vac_mult_p', vence: QUI }] }, { nome: 'Rex', cuidados: [{ itemK: 'verm_p', vence: QUI }] }] })).motivo, /quinta/);
  assert.match(MI.gerarMensagemIrmaos(Object.assign({}, base, { peludos: dois([{ itemK: 'verm_p', vence: '2026-11-10' }], [{ itemK: 'verm_p', vence: SEG }]) })).motivo, /hoje, amanhã ou vencidas/);
  assert.match(MI.gerarMensagemIrmaos(Object.assign({}, base, { peludos: [{ nome: 'Mel', cuidados: [{ itemK: 'verm_p', vence: SEG }] }, { nome: 'mel', cuidados: [{ itemK: 'ecto_p', vence: SEG }] }] })).motivo, /mesmo nome/);
  assert.match(MI.gerarMensagemIrmaos(Object.assign({}, base, { peludos: dois([{ itemK: 'escova_p', vence: SEG }], [{ itemK: 'verm_p', vence: SEG }]) })).motivo, /não reconhecido/);
});

prova('o app tem uma cópia idêntica do texto dos irmãos, e o texto de um FILHOt não mudou', () => {
  const m = html.match(/<script id="mensagem-irmaos">([\s\S]*?)<\/script>/);
  assert.ok(m, 'o app carrega o texto dos irmãos');
  assert.equal(m[1].replace(/\s+$/, ''), fs.readFileSync(path.resolve(__dirname, '../zelozinha/simples/mensagem-irmaos.js'), 'utf8').replace(/\s+$/, ''));
  const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
  assert.equal(fs.readFileSync(path.resolve(__dirname, '../zelozinha/simples/mensagem-unica41.js'), 'utf8').replace(/\s+$/, ''), html.slice(ini, fim).replace(/\s+$/, ''));
});

prova('quem é irmão: mesmo telefone, mesmo dia, ainda na fila; até cinco numa mensagem', () => {
  const a = filhot('Bolinha', 'Família Um', TEL_UM, [{ itemK: 'verm_p', vence: SEG }], 1);
  const b = filhot('Farofa', 'Família Um', TEL_UM, [{ itemK: 'ecto_p', vence: SEG }], 3);
  const c = filhot('Pipoca', 'Família Dois', TEL_DOIS, [{ itemK: 'verm_p', vence: SEG }], 2);
  const d = Object.assign(filhot('Quindim', 'Família Um', TEL_UM, [{ itemK: 'col_p', vence: SEG }], 4), { estado: 'enviado' });
  const filaDia = { [a.dcKey]: a, [b.dcKey]: b, [c.dcKey]: c, [d.dcKey]: d };
  assert.deepEqual(N.irmaos(filaDia, a).map((x) => x.nome), ['Farofa']);
  assert.deepEqual(N.irmaos(filaDia, c), []);
  const muitos = {}; for (let i = 0; i < 8; i++) { const x = filhot('Filhot' + 'ABCDEFGH'[i], 'Família Um', TEL_UM, [{ itemK: 'verm_p', vence: SEG }], i); muitos[x.dcKey] = x; }
  const primeiro = Object.values(muitos)[0];
  assert.equal(N.irmaos(muitos, primeiro).length, 4, 'no máximo cinco numa mensagem');
});

prova('serviço: dois irmãos saem numa mensagem só, com o texto aprovado; o outro tutor sai na vez dele', async () => {
  let t = Date.parse(SEG + 'T08:00:00-03:00');
  const a = filhot('Bolinha', 'Família Um', TEL_UM, [{ itemK: 'verm_p', vence: SEG }], 1, 'M');
  const b = filhot('Pipoca', 'Família Dois', TEL_DOIS, [{ itemK: 'verm_p', vence: SEG }], 2);
  const c = filhot('Farofa', 'Família Um', TEL_UM, [{ itemK: 'vac_raiva_p', vence: SEG }], 3, 'F');
  const db = banco([a, b, c]), evo = evoFalso();
  const s = criarServico({ db, evo, cfg: CFG, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'enviado');
  assert.equal(evo.envios.length, 1, 'uma mensagem só para a Família Um');
  const esperado = MI.gerarMensagemIrmaos({ nomeTutor: 'Família Um', dia: SEG, presencaConfirmada: true, veterinariaConfirmada: true,
    peludos: [{ nome: 'Bolinha', sexo: 'M', cuidados: a.itens }, { nome: 'Farofa', sexo: 'F', cuidados: c.itens }] }).texto;
  assert.equal(evo.envios[0].t, esperado); assert.equal(evo.envios[0].jid, TEL_UM + '@' + 's.whatsapp' + '.net');
  for (const x of [a, c]) {
    const it = db.ler(`${N.FILA}/${SEG}/${x.dcKey}`);
    assert.equal(it.estado, 'enviado'); assert.equal(it.msgId, 'msg-1'); assert.equal(it.textoEnviado, esperado);
    assert.deepEqual(it.junto, [a.dcKey, c.dcKey]);
  }
  assert.equal(db.ler(`${N.FILA}/${SEG}/${b.dcKey}`).estado, 'pronto', 'o outro tutor espera a vez dele');
  t += 4 * 60000; assert.equal(await s.passo(), 'enviado');
  assert.equal(evo.envios[1].t, b.texto, 'sozinho, sai o texto de um FILHOt');
  assert.equal(db.ler(`${N.FILA}/${SEG}/${b.dcKey}`).textoEnviado, undefined);
});

prova('serviço: o irmão que não confere ou que já saiu fica de fora; o outro sai com o texto de um FILHOt', async () => {
  const t = Date.parse(SEG + 'T08:00:00-03:00');
  const a = filhot('Bolinha', 'Família Um', TEL_UM, [{ itemK: 'verm_p', vence: SEG }], 1);
  const c = Object.assign(filhot('Farofa', 'Família Um', TEL_UM, [{ itemK: 'ecto_p', vence: SEG }], 2), { texto: 'Mensagem que ninguém aprovou' });
  const db = banco([a, c]), evo = evoFalso();
  const s = criarServico({ db, evo, cfg: CFG, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'enviado');
  assert.equal(evo.envios.length, 1); assert.equal(evo.envios[0].t, a.texto);
  assert.equal(db.ler(`${N.FILA}/${SEG}/${c.dcKey}`).estado, 'falhou');
  const d = filhot('Quindim', 'Família Um', TEL_UM, [{ itemK: 'col_p', vence: SEG }], 2);
  const db2 = banco([a, d], { 'checkout-corpo': { [SEG]: { [d.dcKey]: { tipo: 'saida', fim: t - 1000 } } } }), evo2 = evoFalso();
  const s2 = criarServico({ db: db2, evo: evo2, cfg: CFG, agora: () => t, aleatorio: () => 0 });
  await s2.iniciar();
  assert.equal(await s2.passo(), 'enviado');
  assert.equal(evo2.envios[0].t, a.texto); assert.equal(db2.ler(`${N.FILA}/${SEG}/${d.dcKey}`).estado, 'cancelado');
});

prova('serviço: número fora do ar devolve os irmãos para a fila, sem mandar nada', async () => {
  const t = Date.parse(SEG + 'T08:00:00-03:00');
  const a = filhot('Bolinha', 'Família Um', TEL_UM, [{ itemK: 'verm_p', vence: SEG }], 1);
  const c = filhot('Farofa', 'Família Um', TEL_UM, [{ itemK: 'ecto_p', vence: SEG }], 2);
  const db = banco([a, c]), evo = evoFalso({ numeroFalha: true });
  const s = criarServico({ db, evo, cfg: CFG, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'numero-depois');
  assert.equal(evo.envios.length, 0);
  assert.equal(db.ler(`${N.FILA}/${SEG}/${a.dcKey}`).estado, 'pronto'); assert.equal(db.ler(`${N.FILA}/${SEG}/${c.dcKey}`).estado, 'pronto');
});

prova('a tela: «Ver mensagem» mostra o texto que saiu para os irmãos', () => {
  const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(html.match(/<script id="zelozinha-simples">([\s\S]*?)<\/script>/)[1], ctx);
  const ZS = ctx.ZelozinhaSimples, ouv = [];
  const db = { ref: (p) => ({ on: (ev, fn) => { ouv.push([p, ev, fn]); }, off: () => {} }) };
  ZS.ligar(db, SEG);
  const it = { v: 1, dia: SEG, dcKey: 'farofa', estado: 'enviado', enviadoEm: 1, texto: 'Texto de um FILHOt', textoEnviado: 'Texto dos irmãos', junto: ['bolinha', 'farofa'], itens: [{ itemK: 'verm_p', vence: SEG }] };
  ouv.filter((o) => o[1] === 'child_added' && o[0] === `${ZS.FILA}/${SEG}`).forEach((o) => o[2]({ key: 'farofa', val: () => it }));
  const card = ZS.cartaoHTML({ dia: SEG, dcKey: 'farofa' });
  assert.match(card.msg, /Texto dos irmãos/); assert.ok(!/Texto de um FILHOt/.test(card.msg));
  assert.match(card.quando, /uma mensagem só para os irmãos/);
  ZS.desligar();
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-irmaos168: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
