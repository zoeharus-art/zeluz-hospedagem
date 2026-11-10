'use strict';
// Zelozinha (05/11/2026): «Sem finalização» (as questões não podem sumir de um dia para o outro), o plano com cuidados incluídos
// (só o aviso, no dia em que o FILHOt vem) e o horário da vacina no Lançamento do dia › Veterinário. Maquetes aprovadas pela Adriana.
// Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const N = require('../zelozinha/simples/nucleo');
const AP = require('../zelozinha/simples/aviso-plano');
const MU = require('../zelozinha/simples/mensagem-unica41');
const { criarServico } = require('../zelozinha/simples/zelozinha');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }
const json = (v) => JSON.parse(JSON.stringify(v));

/* ---------- banco de mentira (compatível com o app e com o Admin SDK), com consulta por faixa de chave ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) }, ouvintes = [];
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) {
    const ks = partes(p), antesPai = ler(ks.slice(0, -1).join('/')) || {};
    let n = raiz, chave = 'v';
    for (const k of ks) { if (!n[chave] || typeof n[chave] !== 'object') n[chave] = {}; n = n[chave]; chave = k; }
    if (valor === null) delete n[chave]; else n[chave] = JSON.parse(JSON.stringify(valor));
    avisar(ks, antesPai);
  }
  function snap(k, v) { return { key: k, val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }; }
  function faixa(p, ini, fim) { const v = ler(p); if (!v || typeof v !== 'object') return null; const o = {}; Object.keys(v).sort().forEach((k) => { if ((ini === undefined || k >= ini) && (fim === undefined || k <= fim)) o[k] = v[k]; }); return Object.keys(o).length ? o : null; }
  function avisar(ks, antesPai) {
    const pai = ks.slice(0, -1).join('/'), filho = ks[ks.length - 1], agora = ler(pai) || {};
    ouvintes.forEach((o) => {
      if (o.ev === 'value' && (ks.join('/') + '/').startsWith(o.p + '/')) o.fn(snap(partes(o.p).pop(), faixa(o.p, o.ini, o.fim)));
      if (o.p === pai && o.ev === 'child_added' && !(filho in antesPai) && filho in agora) o.fn(snap(filho, agora[filho]));
      if (o.p === pai && o.ev === 'child_changed' && filho in antesPai && filho in agora) o.fn(snap(filho, agora[filho]));
      if (o.p === pai && o.ev === 'child_removed' && filho in antesPai && !(filho in agora)) o.fn(snap(filho, antesPai[filho]));
    });
  }
  const db = {
    leituras: [], falharEscrita: false,
    ref(p, ini, fim) {
      const r = {
        once: async () => { db.leituras.push(p + (ini ? '[' + ini + '..' + (fim || '') + ']' : '')); return snap(partes(p).pop(), ini !== undefined || fim !== undefined ? faixa(p, ini, fim) : ler(p)); },
        set: async (v) => { if (db.falharEscrita) throw Error('sem conexão'); gravar(p, v); },
        update: async (o) => { Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k])); },
        remove: async () => { gravar(p, null); },
        transaction: async (fn) => {
          if (db.falharEscrita) throw Error('sem conexão');
          const atual = ler(p), novo = fn(atual);
          if (novo === undefined) return { committed: false, snapshot: snap(partes(p).pop(), atual) };
          gravar(p, novo); return { committed: true, snapshot: snap(partes(p).pop(), novo) };
        },
        on: (ev, fn) => { ouvintes.push({ p, ev, fn, ini, fim }); if (ev === 'value') fn(snap(partes(p).pop(), ini !== undefined || fim !== undefined ? faixa(p, ini, fim) : ler(p))); if (ev === 'child_added') { const v = ler(p) || {}; Object.keys(v).forEach((k) => fn(snap(k, v[k]))); } },
        off: (ev, fn) => { for (let i = ouvintes.length - 1; i >= 0; i--) if (ouvintes[i].p === p && ouvintes[i].ev === ev && ouvintes[i].fn === fn) ouvintes.splice(i, 1); },
        orderByKey: () => ({ startAt: (a) => ({ endAt: (b) => db.ref(p, a, b), once: (...x) => db.ref(p, a).once(...x), on: (...x) => db.ref(p, a).on(...x), off: (...x) => db.ref(p, a).off(...x) }) })
      };
      return r;
    },
    ler, gravar
  };
  return db;
}

const cacheScripts = {};
function script(id) { if (cacheScripts[id]) return cacheScripts[id]; const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return (cacheScripts[id] = m[1]); }
function novoContexto() {
  const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
  vm.runInContext(html.slice(ini, fim), ctx);
  vm.runInContext(script('aviso-plano'), ctx);
  vm.runInContext(script('zelozinha-simples'), ctx);
  vm.runInContext(script('zelozinha-pendencias178'), ctx);
  return ctx;
}

/* ================= A. o texto do aviso do plano e o serviço da VPS ================= */
const TUTOR = 'Tutora Fictícia', PRIMEIRO = 'Tutora';   // a mensagem chama o tutor só pelo primeiro nome (10/11/2026)
const cuid = (...ks) => ks.map((itemK) => ({ itemK }));
prova('aviso do plano: um FILHOt, o texto aprovado (muda só o artigo e os nomes)', () => {
  const m = AP.gerarAvisoPlano({ nomeTutor: 'Dora', peludos: [{ nome: 'Mingau', sexo: 'M', cuidados: cuid('vac_mult_p') }] });
  assert.equal(m.ok, true);
  assert.equal(m.texto, 'Oi, Dora, tudo bem? Hoje o Mingau recebe aqui a vacina múltipla, conforme fechado no plano. Qualquer novidade, a gente conta. 💛');
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'Dora', peludos: [{ nome: 'Nina', sexo: 'F', cuidados: cuid('verm_p') }] }).texto,
    'Oi, Dora, tudo bem? Hoje a Nina recebe aqui o vermífugo, conforme fechado no plano. Qualquer novidade, a gente conta. 💛');
  assert.match(AP.gerarAvisoPlano({ nomeTutor: 'Dora', peludos: [{ nome: 'Luna', cuidados: cuid('ecto_p') }] }).texto, /Hoje Luna recebe aqui a proteção contra pulgas e carrapatos, conforme fechado no plano\./);
});

prova('aviso do plano: vários cuidados saem sempre na mesma ordem, com «conforme fechado no plano» (09/11/2026)', () => {
  const a = AP.gerarAvisoPlano({ nomeTutor: 'Dora', peludos: [{ nome: 'Mingau', sexo: 'M', cuidados: cuid('verm_p', 'vac_mult_p') }] });
  assert.match(a.texto, /recebe aqui a vacina múltipla e o vermífugo, conforme fechado no plano\./);
  const b = AP.gerarAvisoPlano({ nomeTutor: 'Dora', peludos: [{ nome: 'Mingau', sexo: 'M', cuidados: cuid('col_p', 'ecto_p', 'vac_mult_p') }] });
  assert.match(b.texto, /a vacina múltipla, a proteção contra pulgas e carrapatos e a coleira repelente, conforme fechado no plano\./);
});

prova('aviso do plano: irmãos do mesmo tutor recebem um aviso só', () => {
  const igual = AP.gerarAvisoPlano({ nomeTutor: 'Helena', peludos: [{ nome: 'Tico', sexo: 'M', cuidados: cuid('vac_mult_p') }, { nome: 'Teca', sexo: 'F', cuidados: cuid('vac_mult_p') }] });
  assert.equal(igual.texto, 'Oi, Helena, tudo bem? Hoje o Tico e a Teca recebem aqui a vacina múltipla, conforme fechado no plano. Qualquer novidade, a gente conta. 💛');
  const dif = AP.gerarAvisoPlano({ nomeTutor: 'Helena', peludos: [{ nome: 'Tico', sexo: 'M', cuidados: cuid('vac_mult_p') }, { nome: 'Teca', sexo: 'F', cuidados: cuid('verm_p') }] });
  assert.equal(dif.texto, 'Oi, Helena, tudo bem? Hoje o Tico recebe aqui a vacina múltipla e a Teca recebe aqui o vermífugo, conforme fechado no plano. Qualquer novidade, a gente conta. 💛');
  assert.equal((igual.texto.match(/Oi, /g) || []).length, 1, 'uma mensagem só');
});

prova('aviso do plano: entrada ruim não vira texto (tutor, nome repetido, cuidado desconhecido, vacina na quinta)', () => {
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: '', peludos: [{ nome: 'A', cuidados: cuid('verm_p') }] }).ok, false);
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', peludos: [] }).ok, false);
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', peludos: [{ nome: 'A', cuidados: cuid('escova_p') }] }).ok, false);
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', peludos: [{ nome: 'A', cuidados: cuid('verm_p') }, { nome: 'a', cuidados: cuid('verm_p') }] }).ok, false);
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', dia: '2026-11-05', peludos: [{ nome: 'A', cuidados: cuid('vac_mult_p') }] }).ok, false, 'quinta: sem vacina');
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', dia: '2026-11-06', peludos: [{ nome: 'A', cuidados: cuid('vac_mult_p') }] }).ok, true, 'sexta: com vacina');
  assert.equal(AP.gerarAvisoPlano({ nomeTutor: 'T', dia: '2026-11-05', peludos: [{ nome: 'A', cuidados: cuid('verm_p') }] }).ok, true, 'quinta: o vermífugo vale');
});

prova('o texto da mensagem do dia (mensagem-unica41) NÃO mudou: nenhuma letra', () => {
  const m = MU.gerarMensagem({ nomeTutor: 'Dora', nomePeludo: 'Mingau', sexo: 'M', dia: '2026-11-02', presencaConfirmada: true, cuidados: [{ itemK: 'verm_p', vence: '2026-11-02' }], veterinariaConfirmada: false });
  assert.equal(m.texto, 'Bom dia, Dora! Como você está? 💛\n\nO Mingau está com a gente hoje e temos um cuidado para deixar em dia:\n🐾 O vermífugo *vence hoje*.\n\nPodemos cuidar disso hoje, enquanto ele aproveita o dia na Zêluz? Assim, vocês resolvem tudo em uma só visita, sem precisar encaixar outro compromisso na rotina — e sobra mais tempo para curtirem juntos. 💛');
});

prova('a cópia do app é idêntica à do serviço e o serviço está na versão simples-6', () => {
  assert.equal(script('aviso-plano').replace(/\s+$/, ''), fs.readFileSync(path.resolve(__dirname, '../zelozinha/simples/aviso-plano.js'), 'utf8').replace(/\s+$/, ''));
  assert.equal(N.VERSAO, 'simples-6', 'os cuidados pagos no plano (doses e segunda mensagem) mudam o serviço: versão nova');
});

prova('cuidados pagos no plano (09/11/2026): vale dentro do período, só o que foi pago, e cada dose uma vez; o check-in repetido no dia não gasta de novo', () => {
  const ficha = { plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2, ecto_p: 1, escova_p: 3, col_p: 9 } } } };
  assert.equal(AP.cobre(ficha, '2026-11-02', 'verm_p'), true);
  assert.equal(AP.cobre(ficha, '2026-11-02', 'verm_dose2_p'), true, 'a 2ª dose do vermífugo gasta do vermífugo');
  assert.equal(AP.cobre(ficha, '2026-11-02', 'vac_mult_p'), false, 'não pago: pergunta normal');
  assert.equal(AP.cobre(ficha, '2026-11-02', 'col_p'), false, 'quantidade fora de 1 a 6 não vale');
  assert.equal(AP.cobre(ficha, '2026-12-01', 'verm_p'), false, 'fora do período: pergunta normal');
  assert.equal(AP.cobre(ficha, '2026-10-31', 'verm_p'), false, 'antes do período: pergunta normal');
  let usos = AP.gastar(ficha, '2026-11-02', ['verm_p', 'ecto_p', 'vac_mult_p'], null);
  assert.deepEqual(json(usos), { verm_p: { '2026-11-02': true }, ecto_p: { '2026-11-02': true } });
  assert.deepEqual(json(AP.gastar(ficha, '2026-11-02', ['verm_p', 'ecto_p'], usos)), json(usos), 'o mesmo dia não gasta de novo');
  ficha.plano_usos = usos;
  assert.equal(AP.cobre(ficha, '2026-11-02', 'ecto_p'), true, 'a dose de hoje já gasta continua valendo hoje');
  assert.equal(AP.cobre(ficha, '2026-11-09', 'ecto_p'), false, 'a única dose acabou: volta a pergunta');
  usos = AP.gastar(ficha, '2026-11-09', ['verm_p', 'ecto_p'], usos); ficha.plano_usos = usos;
  assert.deepEqual(json(Object.keys(usos.verm_p)), ['2026-11-02', '2026-11-09']); assert.deepEqual(json(Object.keys(usos.ecto_p)), ['2026-11-02']);
  assert.equal(AP.cobre(ficha, '2026-11-16', 'verm_p'), false, 'as duas doses do vermífugo acabaram');
  assert.equal(AP.doseDoDia(ficha, '2026-11-09', 'verm_p'), true); assert.equal(AP.doseDoDia(ficha, '2026-11-09', 'ecto_p'), false);
  /* renovação: o plano novo começa outro período, e a dose do plano anterior não conta nele */
  ficha.plano_cuidados['2026-12-01'] = { fim: '2027-02-28', itens: { verm_p: 1 } };
  assert.equal(AP.planoDoDia(ficha, '2026-12-07').inicio, '2026-12-01'); assert.equal(AP.cobre(ficha, '2026-12-07', 'verm_p'), true);
  assert.equal(AP.saldo(ficha, AP.planoDoDia(ficha, '2026-12-07'), 'verm_p', '2026-12-07').antes, 0);
});

/* ---- o serviço ---- */
const SEG = '2026-11-02', QUI = '2026-11-05', TEL = '(00) 90000-0000', NUM = '5500900000000';
const cad = (extra) => Object.assign({ tutor: TUTOR, tel: TEL, n: 'Filhot' }, extra || {});
/* a ficha com os cuidados pagos no plano e a dose do dia já gasta (o check-in grava plano_usos antes de pôr o aviso na fila) */
const PLANO = { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2, vac_mult_p: 1 } } };
const cadP = (extra, dia) => cad(Object.assign({ plano_cuidados: PLANO, plano_usos: { verm_p: { [dia || SEG]: true }, vac_mult_p: { [dia || SEG]: true } } }, extra || {}));
const CONF = { gerar: MU.gerarMensagem, gerarPlano: AP.gerarAvisoPlano, doseDoDia: AP.doseDoDia };
const itemPlano = (nome, pelKey, itens, extra) => Object.assign({ v: 1, estado: 'pronto', tipo: 'plano', dia: SEG, dcKey: N.dcKeyDoPelKey(pelKey), pelKey, nome, sexo: 'F', tutor: TUTOR, para: NUM, itens, criadoEm: 1,
  texto: AP.gerarAvisoPlano({ nomeTutor: PRIMEIRO, dia: SEG, peludos: [{ nome, sexo: 'F', cuidados: itens }] }).texto }, extra || {});
const checkin = { tipo: 'entrada', quem: 'pessoa', fim: Date.parse(SEG + 'T09:00:00-03:00') };

prova('serviço: o aviso do plano só sai com o texto do aviso, remontado pelo serviço; o texto da pergunta num item de plano é recusado', () => {
  const pk = 'luna__' + TUTOR.toLowerCase();
  const it = itemPlano('Luna', pk, cuid('verm_p'));
  const ok = N.conferirItem({ item: it, cadastro: cadP({ n: 'Luna' }), checkin, ...CONF });
  assert.equal(ok.ok, true, ok.motivo);
  const pergunta = MU.gerarMensagem({ nomeTutor: PRIMEIRO, nomePeludo: 'Luna', sexo: 'F', dia: SEG, presencaConfirmada: true, cuidados: [{ itemK: 'verm_p', vence: SEG }], veterinariaConfirmada: false }).texto;
  assert.equal(N.conferirItem({ item: Object.assign({}, it, { texto: pergunta }), cadastro: cadP({ n: 'Luna' }), checkin, ...CONF }).ok, false);
  assert.equal(N.conferirItem({ item: Object.assign({}, it, { texto: it.texto + ' Pague agora.' }), cadastro: cadP({ n: 'Luna' }), checkin, ...CONF }).ok, false);
  assert.equal(N.conferirItem({ item: it, cadastro: cadP({ n: 'Luna' }), checkin, gerar: MU.gerarMensagem, doseDoDia: AP.doseDoDia }).ok, false, 'sem o gerador do aviso, nada sai');
  assert.equal(N.conferirItem({ item: Object.assign({}, it, { tipo: undefined }), cadastro: cadP({ n: 'Luna' }), checkin, ...CONF }).ok, false, 'item sem a marca do plano é conferido como pergunta e não fecha');
});

prova('serviço: o aviso do plano só sai se a FICHA tem o cuidado pago no plano que vale hoje, com a dose de hoje gasta (o serviço não confia na fila)', () => {
  const pk = 'luna__' + TUTOR.toLowerCase(), it = itemPlano('Luna', pk, cuid('verm_p'));
  const conf = (cadastro) => N.conferirItem({ item: it, cadastro, checkin, ...CONF });
  assert.equal(conf(cadP({ n: 'Luna' })).ok, true);
  [cad({ n: 'Luna' }), cad({ n: 'Luna', cuidadosNoPlano: true }), cadP({ n: 'Luna' }, '2026-11-03'),
    cad({ n: 'Luna', plano_cuidados: { '2026-10-01': { fim: '2026-10-31', itens: { verm_p: 2 } } }, plano_usos: { verm_p: { [SEG]: true } } }),
    cad({ n: 'Luna', plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { ecto_p: 2 } } }, plano_usos: { verm_p: { [SEG]: true } } })].forEach((c) => {
    const r = conf(c); assert.equal(r.ok, false); assert.equal(r.motivo, 'A ficha não tem este cuidado pago no plano, com a dose de hoje; nada foi enviado.');
  });
  assert.equal(N.conferirItem({ item: it, cadastro: cadP({ n: 'Luna' }), checkin, gerar: MU.gerarMensagem, gerarPlano: AP.gerarAvisoPlano }).ok, false, 'sem a conferência da dose, nada sai');
  /* o caso contrário não é recusado: ficha com plano e item comum segue como pergunta (não engana o tutor) */
  const pergunta = MU.gerarMensagem({ nomeTutor: PRIMEIRO, nomePeludo: 'Luna', sexo: 'F', dia: SEG, presencaConfirmada: true, cuidados: [{ itemK: 'verm_p', vence: SEG }], veterinariaConfirmada: false }).texto;
  const comum = Object.assign({}, it, { texto: pergunta, itens: [{ itemK: 'verm_p', vence: SEG }] }); delete comum.tipo;
  assert.equal(N.conferirItem({ item: comum, cadastro: cadP({ n: 'Luna' }), checkin, ...CONF }).ok, true);
});

prova('serviço: irmão sem a marca do plano não entra no aviso conjunto (cada um é conferido antes) e fica «Não enviada»', async () => {
  const pk1 = 'tico__' + TUTOR.toLowerCase(), pk2 = 'teca__' + TUTOR.toLowerCase();
  const a = itemPlano('Tico', pk1, cuid('verm_p'), { sexo: 'M' }), b = itemPlano('Teca', pk2, cuid('verm_p'), { criadoEm: 2 });
  a.texto = AP.gerarAvisoPlano({ nomeTutor: PRIMEIRO, dia: SEG, peludos: [{ nome: 'Tico', sexo: 'M', cuidados: a.itens }] }).texto;
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [SEG]: { [a.dcKey]: a, [b.dcKey]: b } }, cadastro: { [pk1]: cadP({ n: 'Tico' }), [pk2]: cad({ n: 'Teca', cuidadosNoPlano: true }) },
    'checkin-corpo': { [SEG]: { [a.dcKey]: checkin, [b.dcKey]: checkin } } } });
  const enviados = [];
  const evo = { numero: async () => ({ ok: true, jid: NUM + '@s.whatsapp.net' }), enviar: async (jid, texto) => { enviados.push(texto); return { status: 201, corpo: { key: { id: 'X' + enviados.length, remoteJid: jid } } }; }, estado: async () => 'open' };
  const sv = criarServico({ db, evo, cfg: N.PADRAO, agora: () => Date.parse(SEG + 'T10:00:00-03:00'), aleatorio: () => 0, log: () => {} });
  await sv.trocarDia(SEG); await sv.passo();
  assert.equal(enviados.length, 1); assert.match(enviados[0], /Hoje o Tico recebe aqui o vermífugo/); assert.ok(!/Teca/.test(enviados[0]), 'o irmão sem o plano não aparece no aviso');
  const f = db.ler('daycare/zelozinha-fila/' + SEG);
  assert.equal(f[a.dcKey].estado, 'enviado'); assert.equal(f[b.dcKey].estado, 'falhou'); assert.match(f[b.dcKey].motivo, /não tem este cuidado pago no plano/);
});

prova('serviço: o aviso do plano só se junta a outro aviso do plano (irmãos); pergunta e aviso nunca saem na mesma mensagem', () => {
  const a = itemPlano('Tico', 'tico__t', cuid('verm_p')), b = itemPlano('Teca', 'teca__t', cuid('verm_p')), c = Object.assign({}, itemPlano('Pipoca', 'pipoca__t', cuid('verm_p')), { tipo: undefined });
  delete c.tipo;
  const f = { [a.dcKey]: a, [b.dcKey]: b, [c.dcKey]: c };
  assert.deepEqual(N.irmaos(f, a).map((x) => x.dcKey), [b.dcKey]);
  assert.deepEqual(N.irmaos(f, c).map((x) => x.dcKey), [], 'a pergunta não leva o aviso do plano junto');
});

prova('serviço de ponta a ponta: aviso do plano (na chave {dcKey}~plano) sai uma vez, devagar; irmãos do plano saem juntos num aviso só; a pergunta do mesmo FILHOt sai na sua mensagem', async () => {
  const pk1 = 'tico__' + TUTOR.toLowerCase(), pk2 = 'teca__' + TUTOR.toLowerCase();
  const a = itemPlano('Tico', pk1, cuid('verm_p'), { sexo: 'M' }), b = itemPlano('Teca', pk2, cuid('verm_p'), { criadoEm: 2 });
  a.texto = AP.gerarAvisoPlano({ nomeTutor: PRIMEIRO, dia: SEG, peludos: [{ nome: 'Tico', sexo: 'M', cuidados: a.itens }] }).texto;
  const pergunta = MU.gerarMensagem({ nomeTutor: PRIMEIRO, nomePeludo: 'Tico', sexo: 'M', dia: SEG, presencaConfirmada: true, cuidados: [{ itemK: 'ecto_p', vence: SEG }], veterinariaConfirmada: false }).texto;
  const q = Object.assign({}, a, { texto: pergunta, itens: [{ itemK: 'ecto_p', vence: SEG }], criadoEm: 3 }); delete q.tipo;
  const ka = a.dcKey + N.SUFIXO_PLANO, kb = b.dcKey + N.SUFIXO_PLANO;
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [SEG]: { [ka]: a, [kb]: b, [a.dcKey]: q } }, cadastro: { [pk1]: cadP({ n: 'Tico' }), [pk2]: cadP({ n: 'Teca' }) },
    'checkin-corpo': { [SEG]: { [a.dcKey]: checkin, [b.dcKey]: checkin } } } });
  const enviados = [];
  const evo = { numero: async () => ({ ok: true, jid: NUM + '@s.whatsapp.net' }), enviar: async (jid, texto) => { enviados.push(texto); return { status: 201, corpo: { key: { id: 'X' + enviados.length, remoteJid: jid } } }; }, estado: async () => 'open' };
  let t = Date.parse(SEG + 'T10:00:00-03:00');
  const sv = criarServico({ db, evo, cfg: N.PADRAO, agora: () => t, aleatorio: () => 0, log: () => {} });
  await sv.trocarDia(SEG);
  assert.equal(await sv.passo(), 'enviado');
  assert.equal(enviados.length, 1, 'uma mensagem só para os dois irmãos');
  assert.match(enviados[0], /^Oi, Tutora, tudo bem\? Hoje o Tico e a Teca recebem aqui o vermífugo, conforme fechado no plano\./);
  assert.ok(!/Bom dia/.test(enviados[0]), 'não é a mensagem da pergunta');
  let f = db.ler('daycare/zelozinha-fila/' + SEG);
  assert.equal(f[ka].estado, 'enviado'); assert.equal(f[kb].estado, 'enviado'); assert.equal(f[a.dcKey].estado, 'pronto', 'a pergunta não foi junto');
  assert.deepEqual(f[ka].junto.sort(), [a.dcKey, b.dcKey].sort()); assert.equal(f[ka].textoEnviado, enviados[0]);
  t += 8 * 60000; assert.equal(await sv.passo(), 'enviado');
  assert.equal(enviados.length, 2); assert.match(enviados[1], /^Bom dia, /, 'a pergunta do que não foi pago sai na sua mensagem');
  f = db.ler('daycare/zelozinha-fila/' + SEG); assert.equal(f[a.dcKey].estado, 'enviado');
});

prova('serviço: só vale a chave do item (a pergunta na dcKey; o aviso na dcKey ou na dcKey~plano); a pergunta numa chave ~plano não sai', () => {
  const it = itemPlano('Luna', 'luna__t', cuid('verm_p')), q = Object.assign({}, it); delete q.tipo;
  const T0 = Date.parse(SEG + 'T10:00:00-03:00');
  assert.equal(N.escolherProximo({ [it.dcKey + '~plano']: it }, T0).chave, it.dcKey + '~plano');
  assert.equal(N.escolherProximo({ [it.dcKey]: it }, T0).chave, it.dcKey, 'o aviso antigo, na dcKey, ainda sai');
  assert.equal(N.escolherProximo({ [it.dcKey + '~plano']: q }, T0), null);
  assert.equal(N.escolherProximo({ 'outra__t~plano': it }, T0), null);
  assert.deepEqual(json(N.abandonados({ [it.dcKey + '~plano']: Object.assign({}, it, { estado: 'enviando' }) }).map((x) => x.chave)), [it.dcKey + '~plano']);
});

prova('serviço: um aviso do plano com texto adulterado na fila não sai (fica «Não enviada»)', async () => {
  const pk = 'luna__' + TUTOR.toLowerCase(), it = itemPlano('Luna', pk, cuid('verm_p'));
  it.texto = 'Oi, Tutora Fictícia! Pague a conta de R$ 100 agora.';
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [SEG]: { [it.dcKey]: it } }, cadastro: { [pk]: cadP({ n: 'Luna' }) }, 'checkin-corpo': { [SEG]: { [it.dcKey]: checkin } } } });
  const enviados = [];
  const evo = { numero: async () => ({ ok: true, jid: NUM + '@s.whatsapp.net' }), enviar: async (jid, t) => { enviados.push(t); return { status: 201, corpo: { key: { id: 'X', remoteJid: jid } } }; }, estado: async () => 'open' };
  const sv = criarServico({ db, evo, cfg: N.PADRAO, agora: () => Date.parse(SEG + 'T10:00:00-03:00'), aleatorio: () => 0, log: () => {} });
  await sv.trocarDia(SEG); await sv.passo();
  assert.equal(enviados.length, 0);
  assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + it.dcKey).estado, 'falhou');
});

/* ================= B. o check-in: o aviso do plano nasce no lugar da pergunta ================= */
const pecaFicha = { dcKey: 'luna__' + TUTOR.toLowerCase(), pelKey: 'luna__' + TUTOR.toLowerCase(), nome: 'Luna', tutor: TUTOR, sexo: 'F' };
prova('ZelozinhaSimples.montar com o que o plano cobre: o pago vai no aviso ({dcKey}~plano), o resto na pergunta; mesmas regras de vacina (só com a veterinária no dia, nunca na quinta)', () => {
  const ctx = novoContexto(), ZS = ctx.ZelozinhaSimples, todos = { vac_mult_p: true, verm_p: true };
  const m = ZS.montar({ dia: SEG, ficha: pecaFicha, cadastro: cad(), plano: todos, veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: SEG }, { itemK: 'verm_p', vence: '2026-11-01' }, { itemK: 'escova_p', vence: SEG }] });
  assert.equal(m.ok, true, m.motivo); assert.equal(m.itens.length, 1, 'tudo pago: só o aviso, sem pergunta');
  assert.equal(m.item.tipo, 'plano'); assert.equal(m.item.estado, 'pronto'); assert.equal(m.item.para, NUM); assert.equal(ZS.chaveDe(m.item), pecaFicha.dcKey + '~plano');
  assert.deepEqual(json(m.item.itens.map((x) => x.itemK)), ['verm_p', 'vac_mult_p'].sort());
  assert.equal(m.item.texto, AP.gerarAvisoPlano({ nomeTutor: PRIMEIRO, dia: SEG, peludos: [{ nome: 'Luna', sexo: 'F', cuidados: cuid('vac_mult_p', 'verm_p') }] }).texto);
  const misto = ZS.montar({ dia: SEG, ficha: pecaFicha, cadastro: cad(), plano: { verm_p: true }, veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: SEG }, { itemK: 'verm_p', vence: SEG }] });
  assert.equal(misto.itens.length, 2, 'pago e não pago no mesmo dia: duas mensagens');
  assert.equal(misto.itens[0].tipo, undefined); assert.match(misto.itens[0].texto, /^Bom dia, /); assert.deepEqual(json(misto.itens[0].itens.map((x) => x.itemK)), ['vac_mult_p']);
  assert.equal(ZS.chaveDe(misto.itens[0]), pecaFicha.dcKey);
  assert.equal(misto.itens[1].tipo, 'plano'); assert.match(misto.itens[1].texto, /Hoje a Luna recebe aqui o vermífugo, conforme fechado no plano\./);
  const quinta = ZS.montar({ dia: QUI, ficha: pecaFicha, cadastro: cad(), plano: todos, veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: QUI }, { itemK: 'verm_p', vence: QUI }] });
  assert.deepEqual(json(quinta.item.itens.map((x) => x.itemK)), ['verm_p'], 'quinta: só o vermífugo');
  const so = ZS.montar({ dia: QUI, ficha: pecaFicha, cadastro: cad(), plano: todos, veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: QUI }] });
  assert.equal(so.ok, false); assert.equal(so.vazio, true, 'só a vacina e a veterinária não vem: nenhum aviso, nada sai');
  const humano = ZS.montar({ dia: SEG, ficha: pecaFicha, cadastro: cad({ comunicacaoZelozinha: { modo: 'humano' } }), plano: todos, prevencoes: [{ itemK: 'verm_p', vence: SEG }] });
  assert.equal(humano.ok, false); assert.equal(humano.humano, true);
  const normal = ZS.montar({ dia: SEG, ficha: pecaFicha, cadastro: cad(), prevencoes: [{ itemK: 'verm_p', vence: SEG }] });
  assert.equal(normal.item.tipo, undefined, 'sem o plano, a pergunta de sempre'); assert.match(normal.item.texto, /^Bom dia, /);
  assert.equal(ZS.montar({ dia: SEG, ficha: pecaFicha, cadastro: cad(), plano: true, prevencoes: [{ itemK: 'verm_p', vence: SEG }] }).item.tipo, undefined, 'a chave antiga (plano: true) não vale mais');
});

function fabrica(ctx, cadastro, extra, prevs) {
  const ZS = ctx.ZelozinhaSimples, db = bancoFalso({ daycare: { cadastro: { [pecaFicha.pelKey]: cadastro } } });
  const p = { n: 'Luna', tutor: TUTOR, sexo: 'F' }, portas = { peludinhos: () => [p], dcKey: () => pecaFicha.dcKey, pelNome: (x) => x.n };
  const lancadas = [];
  const snapshot = () => ({ ok: true, ficha: { dcKey: pecaFicha.dcKey, pelKey: pecaFicha.pelKey, base: { n: 'Luna', tutor: TUTOR } }, prevencoes: prevs || [{ itemK: 'verm_p', dueDate: SEG, care: 'vermifugo' }] });
  const f = ZS.criarFabrica(Object.assign({ db: () => db, hoje: () => SEG, snapshot, veterinaria: async () => false, lancarPlano: async (x) => { lancadas.push(x); return { ok: true }; } }, extra || {}));
  const recibo = { dia: SEG, dcKey: pecaFicha.dcKey, nome: 'Luna', tutor: TUTOR };
  return { f, db, recibo, portas, lancadas };
}
prova('o check-in de ficha com o vermífugo pago no plano gasta a dose, põe o AVISO na fila ({dcKey}~plano, sem pergunta) e pede a linha do Lançamento do dia', async () => {
  const ctx = novoContexto(), { f, db, recibo, portas, lancadas } = fabrica(ctx, cad({ plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2 } } } }));
  assert.equal((await f.receber(recibo, portas, { monId: 'pessoa' })).status, 'na-fila');
  const it = db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano');
  assert.equal(it.tipo, 'plano'); assert.match(it.texto, /^Oi, Tutora, tudo bem\? Hoje a Luna recebe aqui o vermífugo, conforme fechado no plano\./);
  assert.ok(!/Bom dia|Podemos cuidar/.test(it.texto), 'nenhuma pergunta'); assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey), null, 'nenhuma pergunta na fila');
  assert.deepEqual(json(db.ler('daycare/cadastro/' + pecaFicha.pelKey + '/plano_usos')), { verm_p: { [SEG]: true } }, 'a dose do dia foi gasta na ficha');
  assert.equal(lancadas.length, 1); assert.equal(lancadas[0].dia, SEG); assert.equal(lancadas[0].dcKey, pecaFicha.dcKey);
  assert.deepEqual(json(lancadas[0].itens.map((x) => x.itemK)), ['verm_p']);
  assert.equal((await f.receber(recibo, portas, { monId: 'pessoa' })).status, 'ja-estava-na-fila');
  assert.deepEqual(json(db.ler('daycare/cadastro/' + pecaFicha.pelKey + '/plano_usos')), { verm_p: { [SEG]: true } }, 'o check-in repetido no dia não gasta outra dose');
  assert.equal(lancadas.length, 2, 'a linha é pedida de novo (gravar é «só se não existir»): se a primeira falhou, esta refaz');
  assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano/texto'), it.texto, 'o item da fila não é sobrescrito');
});

prova('check-in com um cuidado pago e outro não: o aviso e a pergunta, cada um na sua chave; doses acabadas voltam para a pergunta', async () => {
  const prevs = [{ itemK: 'verm_p', dueDate: SEG }, { itemK: 'ecto_p', dueDate: SEG }];
  const { f, db, recibo, portas, lancadas } = fabrica(novoContexto(), cad({ plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2 } } } }), null, prevs);
  assert.equal((await f.receber(recibo, portas, {})).status, 'na-fila');
  const q = db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey), a = db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano');
  assert.match(q.texto, /^Bom dia, /); assert.deepEqual(json(q.itens.map((x) => x.itemK)), ['ecto_p']);
  assert.equal(a.tipo, 'plano'); assert.deepEqual(json(a.itens.map((x) => x.itemK)), ['verm_p']); assert.deepEqual(json(lancadas[0].itens.map((x) => x.itemK)), ['verm_p']);
  /* as duas doses já foram gastas em outros dias do plano: pergunta normal, nenhuma dose a mais */
  const usado = cad({ plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2 } } }, plano_usos: { verm_p: { '2026-11-01': true, '2026-11-03': true } } });
  const acabou = fabrica(novoContexto(), usado);
  await acabou.f.receber(acabou.recibo, acabou.portas, {});
  assert.match(acabou.db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '/texto'), /^Bom dia, /);
  assert.equal(acabou.db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano'), null);
  assert.equal(acabou.lancadas.length, 0);
  assert.deepEqual(json(acabou.db.ler('daycare/cadastro/' + pecaFicha.pelKey + '/plano_usos')), { verm_p: { '2026-11-01': true, '2026-11-03': true } }, 'nenhuma dose a mais');
});

prova('check-in: se a dose do plano não puder ser gravada na ficha, nada vai para a fila (nem pergunta a quem pagou) e a fila tenta de novo', async () => {
  const { f, db, recibo, portas } = fabrica(novoContexto(), cad({ plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2 } } } }));
  const ref = db.ref; db.ref = (p, ...x) => { const r = ref.call(db, p, ...x); if (/plano_usos$/.test(p)) r.transaction = async () => { throw Error('sem conexão'); }; return r; };
  const r = await f.receber(recibo, portas, {});
  assert.equal(r.ok, false); assert.equal(r.status, 'pendente-fila'); assert.match(r.motivo, /doses do plano/);
  assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey), null); assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano'), null);
});

prova('sem o plano, o check-in segue como sempre (pergunta) e nenhuma linha de plano nasce', async () => {
  const ctx = novoContexto(), { f, db, recibo, portas, lancadas } = fabrica(ctx, cad());
  assert.equal((await f.receber(recibo, portas, {})).status, 'na-fila');
  const it = db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey);
  assert.equal(it.tipo, undefined); assert.match(it.texto, /^Bom dia, /); assert.equal(lancadas.length, 0);
  const desligado = fabrica(novoContexto(), cad({ cuidadosNoPlano: true }));
  await desligado.f.receber(desligado.recibo, desligado.portas, {});
  assert.match(desligado.db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '/texto'), /^Bom dia, /);
});

prova('plano: se a linha do Lançamento do dia não entrar, o aviso continua na fila e o check-in diz o que faltou', async () => {
  const ctx = novoContexto(), { f, db, recibo, portas } = fabrica(ctx, cad({ plano_cuidados: { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2 } } } }), { lancarPlano: async () => ({ ok: false }) });
  const r = await f.receber(recibo, portas, {});
  assert.equal(r.status, 'plano-sem-linha', 'não é um final: a fila se completa sozinha e tenta a linha de novo'); assert.equal(r.ok, true); assert.match(r.motivo || '', /Lançamento do dia/);
  assert.equal(db.ler('daycare/zelozinha-fila/' + SEG + '/' + pecaFicha.dcKey + '~plano/estado'), 'pronto');
});

/* ============== C. «Sem finalização»: a lista, a máquina de estados, a gravação e a tela ============== */
const HOJE = '2026-11-05', EM = (dia, hora) => Date.parse(dia + 'T' + hora + ':00-03:00');
const rg = (dia, dc, nome, tutor, itens, extra) => Object.assign({ v: 1, dia, dcKey: dc, nome, tutor, estado: 'enviado', enviadoEm: EM(dia, '10:05'), itens, texto: 'Texto fictício de ' + nome, para: NUM, criadoEm: 1 }, extra || {});
function filaDeExemplo() {
  return {
    '2026-11-02': { 'nina__tutora-a': rg('2026-11-02', 'nina__tutora-a', 'Nina', 'Tutora A', [{ itemK: 'ecto_p', vence: '2026-11-01' }]),
      'zeca__tutor-b': rg('2026-11-02', 'zeca__tutor-b', 'Zeca', 'Tutor B', [{ itemK: 'vac_raiva_p', vence: '2026-11-01' }], { enviadoEm: EM('2026-11-02', '14:20') }) },
    '2026-11-03': { 'pipoca__tutor-c': rg('2026-11-03', 'pipoca__tutor-c', 'Pipoca', 'Tutor C', [{ itemK: 'verm_p', vence: '2026-11-03' }], { enviadoEm: EM('2026-11-03', '09:50') }),
      'biscoito__tutora-d': rg('2026-11-03', 'biscoito__tutora-d', 'Biscoito', 'Tutora D', [{ itemK: 'ecto_p', vence: '2026-11-03' }]) },
    '2026-11-04': { 'farofa__tutora-e': rg('2026-11-04', 'farofa__tutora-e', 'Farofa', 'Tutora E', [{ itemK: 'vac_mult_p', vence: '2026-11-04' }], { junto: ['farofa__tutora-e', 'pacoca__tutora-e'], textoEnviado: 'Texto dos irmãos' }),
      'pacoca__tutora-e': rg('2026-11-04', 'pacoca__tutora-e', 'Paçoca', 'Tutora E', [{ itemK: 'vac_mult_p', vence: '2026-11-04' }], { junto: ['farofa__tutora-e', 'pacoca__tutora-e'], textoEnviado: 'Texto dos irmãos' }),
      'luna__tutora-f~plano': rg('2026-11-04', 'luna__tutora-f', 'Luna', 'Tutora F', [{ itemK: 'verm_p', vence: '2026-11-04' }], { tipo: 'plano' }) },
    '2026-11-05': { 'rex__tutor-g': rg('2026-11-05', 'rex__tutor-g', 'Rex', 'Tutor G', [{ itemK: 'verm_p', vence: HOJE }], { estado: 'pronto' }),
      'mel__tutora-h': rg('2026-11-05', 'mel__tutora-h', 'Mel', 'Tutora H', [{ itemK: 'verm_p', vence: HOJE }], { enviadoEm: EM(HOJE, '08:15') }) }
  };
}
const respostaAntiga = (dia, dc) => (dc === 'biscoito__tutora-d' ? 'outra' : dc === 'pipoca__tutor-c' ? 'aguardar' : '');
const aindaVence = (dia, dc) => (dc === 'mel__tutora-h' ? false : dc === 'zeca__tutor-b' ? null : true);
function modulo() { return novoContexto().ZelozinhaPendencias178; }

prova('a lista nasce da fila dos últimos dias: tudo que foi enviado e não tem final aparece, do mais antigo para o mais novo', () => {
  const P = modulo(), l = P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs: {}, respostaAntiga, aindaVence });
  assert.deepEqual(json(l.abertas.map((c) => c.pet)), ['Nina', 'Zeca', 'Pipoca', 'Farofa', 'Paçoca']);
  assert.equal(l.maisAntiga, '2026-11-02');
  assert.ok(!l.abertas.some((c) => c.pet === 'Rex'), 'mensagem que ainda não saiu (pronto) não é questão aberta');
  assert.ok(!l.abertas.some((c) => c.pet === 'Biscoito'), 'quem já tem resposta registrada no cartão do dia não é repetido aqui');
  assert.ok(!l.abertas.some((c) => c.pet === 'Mel'), 'ficha atualizada (o cuidado já está em dia): sai sozinha, sem final');
  assert.ok(l.abertas.some((c) => c.pet === 'Zeca'), 'ficha que não se consegue ler continua aberta (na dúvida, não some)');
  assert.ok(!l.abertas.some((c) => c.pet === 'Luna'), 'o aviso do plano não é pergunta');
  assert.equal(l.abertas.find((c) => c.pet === 'Pipoca').antiga, true, '«Não respondeu» do cartão antigo continua aberto');
});

prova('a mensagem de ontem continua na lista hoje (o defeito que fazia a mensagem sumir de um dia para o outro)', () => {
  const P = modulo();
  const hoje = P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs: {}, respostaAntiga, aindaVence });
  const diaSeguinte = P.listar({ hoje: '2026-11-06', fila: filaDeExemplo(), regs: {}, respostaAntiga, aindaVence });
  assert.ok(hoje.abertas.some((c) => c.pet === 'Nina') && diaSeguinte.abertas.some((c) => c.pet === 'Nina'));
  const ontem = diaSeguinte.abertas.find((c) => c.pet === 'Farofa');
  assert.equal(P.idadeTxt(ontem, '2026-11-06'), 'aberta há 2 dias'); assert.equal(P.idadeTxt(ontem, '2026-11-04'), 'aberta hoje'); assert.equal(P.idadeTxt(ontem, '2026-11-05'), 'aberta há 1 dia');
  const velha = filaDeExemplo(); velha['2026-10-01'] = { 'ana__t': rg('2026-10-01', 'ana__t', 'Ana', 'T', [{ itemK: 'verm_p', vence: '2026-10-01' }]) };
  assert.ok(!P.listar({ hoje: HOJE, fila: velha, regs: {}, respostaAntiga, aindaVence }).abertas.some((c) => c.pet === 'Ana'), 'a janela é de 21 dias');
});

prova('irmãos: o cartão diz «Mensagem junto com o irmão» e o texto que saiu; cada FILHOt tem o seu cartão', () => {
  const P = modulo(), l = P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs: {}, respostaAntiga, aindaVence });
  const f = l.abertas.find((c) => c.pet === 'Farofa'), p = l.abertas.find((c) => c.pet === 'Paçoca');
  assert.equal(f.irmao, 'do Paçoca'); assert.equal(p.irmao, 'do Farofa'); assert.equal(f.msg, 'Texto dos irmãos');
  const h = P.telaSemHTML(Object.assign({ pronto: true, hoje: HOJE }, l), P.novoUI());
  assert.match(h, /Mensagem junto com o irmão/); assert.equal((h.match(/data-z178-card=/g) || []).length, 5);
});

prova('registros: aberta em andamento, resolvida e agendada; e o registro sem item na fila (o aviso do plano que não foi dado) também aparece', () => {
  const P = modulo(), fila = filaDeExemplo();
  const regs = { '2026-11-02': { 'nina__tutora-a': { ecto_p: { v: 1, st: 'aberta', passo: 'bolsa1', prev: 'naoresp', precisa: { f: 'pipeta', n: 1, t: '1 pipeta', v: 'PIPETA' }, rev: 2, vence: '2026-11-01', nome: 'Nina' } } },
    '2026-11-03': { 'pipoca__tutor-c': { verm_p: { v: 1, st: 'resolvida', res: { por: 'Dani', em: EM(HOJE, '09:30'), como: 'Vai fazer em casa. Sem lançamento' }, seq: 5, rev: 1 } } },
    '2026-11-04': { 'farofa__tutora-e': { vac_mult_p: { v: 1, st: 'agendada', agenda: { para: '2026-11-09' }, res: { por: 'Dani', em: EM(HOJE, '09:40'), como: 'Agendado para seg, 09/11' }, seq: 9, rev: 1 } },
      'luna__tutora-f': { verm_p: { v: 1, st: 'aberta', passo: 'data', origem: 'plano', faltou: { dia: '2026-11-04', sel: 'Plano: não foi dado em 04/11', msg: 'x' }, vence: '2026-11-04', nome: 'Luna', tutor: 'Tutora F', rev: 1 } } },
    '2026-11-05': { 'orfa__tutora-z': { verm_p: { v: 1, st: 'aberta', passo: 'data', faltou: { dia: HOJE, sel: 'Plano: não foi dado em 05/11', msg: 'x' }, vence: HOJE, nome: 'Orfa', tutor: 'Tutora Z', rev: 1 } } } };
  const l = P.listar({ hoje: HOJE, fila, regs, respostaAntiga, aindaVence });
  assert.equal(P.grupoDe(l.abertas.find((c) => c.pet === 'Nina')), 'bolsa');
  assert.deepEqual(json(l.fechadas.map((c) => c.pet + ':' + c.st)), ['Farofa:agendada', 'Pipoca:resolvida']);
  assert.equal(l.agendadas, 1);
  const luna = l.abertas.find((c) => c.pet === 'Luna'), orfa = l.abertas.find((c) => c.pet === 'Orfa');
  assert.equal(P.grupoDe(luna), 'faltou'); assert.equal(luna.msgTipo, 'Aviso do plano'); assert.equal(P.grupoDe(orfa), 'faltou', 'sem item na fila, o registro basta');
  assert.ok(!l.abertas.some((c) => c.pet === 'Pipoca'), 'o resolvido sai da lista aberta');
  assert.equal(l.contagem.faltou, 2); assert.equal(l.contagem.bolsa, 1);
});

/* ---- a máquina de estados ---- */
const ctxT = (extra) => Object.assign({ hoje: HOJE, agora: EM(HOJE, '09:20'), por: 'Dani', precisaDe: (c) => (c.itemK === 'verm_p' ? modulo().precisaDeValor('verm_p', '1 COMPRIMIDO E MEIO') : null),
  validarData: (h, d) => (d <= h ? { ok: false, motivo: 'O agendamento é para depois de hoje.' } : { ok: true }), pet: (dc) => ({ base: 'Pipoca/Poodle', chave: dc }) }, extra || {});
function cartaoDe(P, pet, regs) { return P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs: regs || {}, respostaAntiga: () => '', aindaVence: () => true }).abertas.find((c) => c.pet === pet); }
function passo(P, c, acao, args, ctx) { const t = P.transicao(c, acao, args, ctx || ctxT()); assert.equal(t.ok, true, t.erro); const regs = { [c.dia]: { [c.dc]: { [c.itemK]: t.rec } } }; return { t, c: cartaoDe2(P, c, regs) }; }
function cartaoDe2(P, c, regs) { const l = P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs, respostaAntiga: () => '', aindaVence: () => true }); return l.abertas.concat(l.fechadas).find((x) => x.key === c.key); }

prova('«Vai fazer em casa» resolve direto, sem lançamento; «Tentei de novo» registra quem tentou e quando, sem mensagem nova', () => {
  const P = modulo(), c = cartaoDe(P, 'Zeca');
  const a = passo(P, c, 'tent', {}); assert.equal(a.t.efeitos.length, 0);
  assert.equal(a.c.tent.length, 1); assert.equal(a.c.tent[0].por, 'Dani'); assert.equal(a.c.st, 'aberta'); assert.equal(P.grupoDe(a.c), 'nresp');
  const b = passo(P, a.c, 'resp', { k: 'casa' });
  assert.equal(b.t.efeitos.length, 0); assert.equal(b.c.st, 'resolvida'); assert.equal(b.c.res.como, 'Vai fazer em casa. Sem lançamento'); assert.equal(b.c.res.por, 'Dani');
});

prova('«Autorizou pegar na loja» pede o horário (sem ele, não salva) e lança hoje no Lançamento do dia, com o horário', () => {
  const P = modulo(), c = cartaoDe(P, 'Nina');
  const a = passo(P, c, 'resp', { k: 'loja' }); assert.equal(P.grupoDe(a.c), 'resp'); assert.equal(a.c.prev, 'naoresp');
  const sem = P.transicao(a.c, 'salvarh', { hora: '' }, ctxT()); assert.equal(sem.ok, false); assert.equal(sem.erro, 'Escolha o horário antes.');
  assert.equal(P.transicao(a.c, 'salvarh', { hora: '25:00' }, ctxT()).ok, false);
  const v = passo(P, a.c, 'voltar0', {}); assert.equal(P.grupoDe(v.c), 'nresp', '«Voltar» desfaz a escolha');
  const f = P.transicao(a.c, 'salvarh', { hora: '10:30' }, ctxT());
  assert.equal(f.ok, true); assert.equal(f.efeitos.length, 1);
  const ef = f.efeitos[0];
  assert.equal(ef.tipo, 'linha'); assert.equal(ef.dia, HOJE); assert.equal(ef.item, 'carrapaticida'); assert.equal(ef.reg.z178.origem, 'loja'); assert.equal(ef.reg.z178.hora, '10:30'); assert.equal(ef.reg.det.onde, 'LOJA');
  assert.equal(f.rec.st, 'resolvida'); assert.match(f.rec.res.como, /Autorizou pegar na loja · horário 10:30 · foi para o Lançamento do dia 05\/11/); assert.deepEqual(json(f.rec.linha), { dia: HOJE, item: 'carrapaticida', id: ef.id });
});

prova('«Trouxe na bolsa»: passo 1 «Estava na bolsa?»; «Não veio» leva a «Falar com o tutor»; voltar refaz o passo 1', () => {
  const P = modulo(), c = cartaoDe(P, 'Pipoca');
  const a = passo(P, c, 'resp', { k: 'bolsa' }); assert.equal(a.c.passo, 'bolsa1'); assert.equal(a.c.precisa.t, '1 e ½ comprimido'); assert.equal(P.grupoDe(a.c), 'bolsa');
  const n = passo(P, a.c, 'b1', { v: 'nao' }); assert.equal(P.grupoDe(n.c), 'contato'); assert.equal(n.t.efeitos.length, 0);
  const v = passo(P, n.c, 'voltar', {}); assert.equal(v.c.passo, 'bolsa1');
  assert.equal(passo(P, v.c, 'b1', { v: 'sim' }).c.passo, 'bolsa2');
});

prova('passo 2: a dose confere («Falta ½ comprimido», «Forma diferente»); só «Confirmado» fecha, e só quando a dose dá', () => {
  const P = modulo(), c0 = cartaoDe(P, 'Pipoca');
  let c = passo(P, passo(P, c0, 'resp', { k: 'bolsa' }).c, 'b1', { v: 'sim' }).c;
  assert.equal(P.transicao(c, 'confirmar', {}, ctxT()).ok, false, 'nada escolhido');
  c = passo(P, c, 'tem', { v: 'um' }).c;
  assert.deepEqual(json(P.avalia(c.precisa, c.tem)), { tipo: 'falta', msg: 'Falta ½ comprimido. Falar com o tutor.' });
  assert.equal(P.transicao(c, 'confirmar', {}, ctxT()).ok, false, 'falta dose: não deixa confirmar');
  const pip = passo(P, c, 'tem', { v: 'pip' }).c;
  assert.match(P.avalia(pip.precisa, pip.tem).msg, /Forma diferente: pipeta não serve para o vermífugo em comprimido/);
  const resto = P.transicao(c, 'comb', { v: 'resto' }, ctxT());
  assert.equal(resto.ok, true); assert.match(resto.rec.res.como, /Tutor mandou o resto · foi para o Lançamento do dia 05\/11/); assert.equal(resto.efeitos[0].reg.z178.origem, 'bolsa');
  assert.equal(resto.efeitos[0].reg.det.qtd, '1 COMPRIMIDO E MEIO', 'o Lançamento leva a dose que o Day Care precisa dar'); assert.equal(resto.efeitos[0].reg.det.onde, 'NA BOLSA');
  assert.match(P.transicao(c, 'comb', { v: 'loja' }, ctxT()).rec.res.como, /Autorizou completar com a loja/);
  const outra = passo(P, c, 'comb', { v: 'outra' }); assert.equal(outra.c.passo, 'data'); assert.equal(outra.c.prev, 'bolsa2'); assert.equal(outra.t.efeitos.length, 0);
  const certo = passo(P, c, 'tem', { v: 'umemeio' }).c; assert.equal(P.avalia(certo.precisa, certo.tem).tipo, 'ok');
  assert.equal(P.transicao(certo, 'comb', { v: 'resto' }, ctxT()).ok, false, 'dose certa: não há o que combinar');
  const ok = P.transicao(certo, 'confirmar', {}, ctxT()); assert.equal(ok.ok, true); assert.equal(ok.rec.st, 'resolvida'); assert.equal(ok.efeitos.length, 1);
  const mais = passo(P, c, 'tem', { v: 'dois' }).c; assert.equal(P.avalia(mais.precisa, mais.tem).tipo, 'ok', 'mais do que o preciso também dá');
});

prova('bolsa de cuidado sem dose (vacina, coleira): «Sim, estava» já confirma e lança; sem dose conhecida na ficha, o Day Care escolhe o que veio', () => {
  const P = modulo(), z = cartaoDe(P, 'Zeca');
  const a = passo(P, z, 'resp', { k: 'bolsa' }).c, b = P.transicao(a, 'b1', { v: 'sim' }, ctxT());
  assert.equal(b.ok, true); assert.equal(b.rec.st, 'resolvida'); assert.equal(b.efeitos[0].item, 'vet'); assert.equal(b.efeitos[0].reg.hora, '', 'o horário da vacina é posto depois, no Lançamento'); assert.match(b.efeitos[0].reg.valor, /· Vacina antirrábica$/);
  const sem = ctxT({ precisaDe: () => null }), p = cartaoDe(P, 'Pipoca');
  const c = passo(P, passo(P, passo(P, p, 'resp', { k: 'bolsa' }, sem).c, 'b1', { v: 'sim' }, sem).c, 'tem', { v: 'um' }, sem).c;
  assert.equal(c.precisa, null); assert.equal(P.avalia(c.precisa, c.tem).tipo, 'ok'); assert.equal(P.avalia(c.precisa, c.tem).semBase, true);
  const f = P.transicao(c, 'confirmar', {}, sem); assert.equal(f.ok, true); assert.equal(f.efeitos[0].reg.det.qtd, undefined, 'sem dose conhecida, o Lançamento não inventa quantidade');
});

prova('«Autorizou para outra data»: pede a data; data inválida não salva; salvar usa o «Agendou para» e a questão vai para «Resolvidas» com o selo', () => {
  const P = modulo(), c = cartaoDe(P, 'Zeca'), a = passo(P, c, 'resp', { k: 'data' }).c;
  assert.equal(P.grupoDe(a), 'data');
  assert.equal(P.transicao(a, 'salvard', { data: '' }, ctxT()).erro, 'Escolha a data antes.');
  assert.equal(P.transicao(a, 'salvard', { data: HOJE }, ctxT()).erro, 'O agendamento é para depois de hoje.');
  const f = P.transicao(a, 'salvard', { data: '2026-11-09' }, ctxT());
  assert.equal(f.ok, true); assert.deepEqual(json(f.efeitos), [{ tipo: 'agendar', para: '2026-11-09', itemK: 'vac_raiva_p' }]);
  assert.equal(f.rec.st, 'agendada'); assert.equal(f.rec.res.como, 'Agendado para seg, 09/11 · a Zelozinha não manda de novo'); assert.deepEqual(json(f.rec.agenda), { para: '2026-11-09' });
});

prova('«Reabrir» volta a questão ao que era (e pede para tirar a linha e o agendamento que ela criou); reaberta aparece como tal', () => {
  const P = modulo(), c0 = cartaoDe(P, 'Zeca');
  const a = passo(P, c0, 'tent', {}).c, b = passo(P, a, 'resp', { k: 'data' }).c, d = passo(P, b, 'salvard', { data: '2026-11-09' });
  assert.equal(d.c.st, 'agendada');
  const r = P.transicao(d.c, 'reabrir', {}, ctxT());
  assert.equal(r.ok, true); assert.deepEqual(json(r.efeitos.map((e) => e.tipo)), ['desfazer-agenda']);
  assert.equal(r.rec.st, 'aberta'); assert.equal(r.rec.passo, 'data', 'volta ao passo em que a questão estava antes de fechar'); assert.equal(r.rec.reaberta, true); assert.equal(r.rec.tent.length, 1, 'as tentativas já feitas continuam'); assert.equal(r.rec.agenda, undefined);
  assert.equal(P.transicao(c0, 'reabrir', {}, ctxT()).ok, false, 'questão aberta não se reabre');
});

prova('«Faltou» em qualquer linha devolve a questão a «Sem finalização» pedindo nova data, sem mensagem nova; «Foi dado» fecha', () => {
  const P = modulo(), c = cartaoDe(P, 'Nina');
  const fa = P.transicaoLinha(c, 'faltou', { dia: '2026-11-09', origem: 'agendado' }, ctxT());
  assert.equal(fa.ok, true); assert.equal(fa.rec.st, 'aberta'); assert.equal(fa.rec.passo, 'data'); assert.equal(fa.rec.faltou.sel, 'Faltou no dia combinado (09/11)'); assert.match(fa.rec.faltou.msg, /não manda mensagem nova ao tutor sozinha/);
  assert.equal(P.transicaoLinha(c, 'faltou', { dia: HOJE, origem: 'loja' }, ctxT()).rec.faltou.sel, 'Não foi dado em 05/11');
  const pl = P.transicaoLinha(c, 'faltou', { dia: HOJE, origem: 'plano' }, ctxT());
  assert.equal(pl.rec.faltou.sel, 'Plano: não foi dado em 05/11'); assert.match(pl.rec.faltou.msg, /Nenhuma mensagem nova sai sozinha\. Combine uma nova data com a tutora\./); assert.equal(pl.rec.origem, 'plano');
  const dado = P.transicaoLinha(c, 'dado', { dia: HOJE, origem: 'bolsa' }, ctxT());
  assert.equal(dado.rec.st, 'resolvida'); assert.equal(dado.rec.res.como, 'Foi dado em 05/11');
  const depois = cartaoDe2(P, c, { [c.dia]: { [c.dc]: { [c.itemK]: fa.rec } } });
  assert.equal(P.grupoDe(depois), 'faltou'); assert.equal(depois.passo, 'data');
  const novaData = P.transicao(depois, 'salvard', { data: '2026-11-10' }, ctxT()); assert.equal(novaData.ok, true); assert.equal(novaData.rec.faltou, undefined, 'com a nova data, o aviso de falta some');
  assert.equal(P.transicao(depois, 'resp', { k: 'casa' }, ctxT()).rec.st, 'resolvida', '«Ou dar outro final»');
});

prova('o que vai para o Lançamento do dia: o formato dos lançamentos à mão, id estável e seguro, e a marca da Zelozinha', () => {
  const P = modulo(), c = cartaoDe(P, 'Pipoca'), b = passo(P, passo(P, c, 'resp', { k: 'bolsa' }).c, 'b1', { v: 'sim' }).c;
  const m = P.montarLinha({ card: b, tipo: 'bolsa', dia: HOJE, pet: { base: 'Pipoca/Poodle', chave: b.dc }, por: 'Dani', agora: 5 });
  assert.equal(m.item, 'vermifugo'); assert.equal(m.reg.valor, 'Pipoca/Poodle (1 COMPRIMIDO E MEIO · NA BOLSA)'); assert.equal(m.reg.chave, 'pipoca__tutor-c'); assert.equal(m.reg.hora, '');
  assert.deepEqual(json(m.reg.z178), { dia: '2026-11-03', dcKey: 'pipoca__tutor-c', itemK: 'verm_p', origem: 'bolsa', estado: 'pendente', por: 'Dani', em: 5, nome: 'Pipoca', tutor: 'Tutor C', vence: '2026-11-03' });
  assert.match(m.id, /^z178_bolsa_[a-z0-9]+$/); assert.equal(m.id, P.montarLinha({ card: b, tipo: 'bolsa', dia: HOJE, pet: { base: 'x', chave: b.dc } }).id, 'o mesmo cuidado, o mesmo dia: o mesmo id (gravar de novo não duplica)');
  assert.notEqual(m.id, P.montarLinha({ card: b, tipo: 'loja', dia: HOJE, pet: { base: 'x', chave: b.dc } }).id);
  const v = P.montarLinha({ card: cartaoDe(P, 'Zeca'), tipo: 'plano', dia: HOJE, pet: { base: 'Mingau/Yorkshire', chave: 'zeca__tutor-b' }, por: 'Dani', agora: 5 });
  assert.equal(v.item, 'vet'); assert.equal(v.reg.valor, 'Mingau/Yorkshire · Vacina antirrábica'); assert.equal(v.reg.hora, '');
  const loja = P.montarLinha({ card: cartaoDe(P, 'Nina'), tipo: 'loja', dia: HOJE, hora: '10:30', pet: { base: 'Nina/Shih Tzu', chave: 'nina__tutora-a' }, por: 'Dani', agora: 5 });
  assert.equal(loja.reg.valor, 'Nina/Shih Tzu (PIPETA · LOJA)'); assert.equal(loja.reg.hora, '', 'só o Veterinário tem hora na planilha'); assert.equal(loja.reg.z178.hora, '10:30');
  assert.equal(P.montarLinha({ card: cartaoDe(P, 'Nina'), tipo: 'loja', dia: HOJE, pet: null }), null, 'sem a ficha única, não lança');
});

/* ---- a gravação ---- */
function ambiente(extra, inicial) {
  const db = bancoFalso(inicial || { daycare: { 'zelozinha-fila': (({ [HOJE]: _, ...passado }) => passado)(filaDeExemplo()) } });
  const chamadas = { gravar: [], remover: [], agendar: [], desfazer: [], marcar: [], marcarAgenda: [] };
  let agora = EM(HOJE, '09:20'), clique = 0;
  const portas = Object.assign({ db: () => db, hoje: () => HOJE, agora: () => agora + (clique++), ator: () => ({ nome: 'Dani', id: 'u1' }),
    filaHoje: () => filaDeExemplo()[HOJE], respostaAntiga, aindaVence, raca: () => 'SRD', precisaDe: (c) => (c.itemK === 'verm_p' ? modulo().precisaDeValor('verm_p', '1 COMPRIMIDO E MEIO') : null),
    validarData: (h, d) => (d <= h ? { ok: false, motivo: 'O agendamento é para depois de hoje.' } : new Date(d + 'T00:00:00Z').getUTCDay() === 0 ? { ok: false, motivo: 'A Zêluz não abre aos domingos.' } : { ok: true }),
    pet: (dc) => ({ base: 'Nome/Raça', chave: dc }),
    gravarLinha: async (ef) => { chamadas.gravar.push(ef); db.gravar(`daycare/dashboard/${ef.dia}/${ef.item}/${ef.id}`, ef.reg); return { ok: true, criada: true }; },
    removerLinha: async (ref) => { chamadas.remover.push(ref); const l = db.ler(`daycare/dashboard/${ref.dia}/${ref.item}/${ref.id}`); if (l && l.z178 && l.z178.estado === 'dado') return { ok: false, motivo: 'dado' }; db.gravar(`daycare/dashboard/${ref.dia}/${ref.item}/${ref.id}`, null); return { ok: true }; },
    agendar: async (x) => { chamadas.agendar.push(x); return { ok: true }; }, desfazerAgenda: async (x) => { chamadas.desfazer.push(x); return true; },
    marcarLinha: async (ref, estado) => { chamadas.marcar.push([ref, estado]); db.gravar(`daycare/dashboard/${ref.dia}/${ref.item}/${ref.id}/z178/estado`, estado); return true; }, marcarAgenda: async (x, estado) => { chamadas.marcarAgenda.push([x, estado]); return true; } }, extra || {});
  const P = modulo(), api = P.criar(portas);
  return { P, api, db, chamadas, portas };
}
const caminhoDe = (c) => `daycare/zelozinha-pendencias/${c.dia}/${c.dc}/${c.itemK}`;

prova('abrir a tela lê UMA vez a fila dos dias anteriores (por faixa de chave) e fica ouvindo os registros; hoje vem da fila que já está na memória', async () => {
  const { api, db } = ambiente();
  await api.abrir();
  const v = api.view(); assert.equal(v.pronto, true); assert.equal(v.abertas.length, 5);
  assert.deepEqual(db.leituras.filter((l) => /zelozinha-fila/.test(l)), ['daycare/zelozinha-fila[2026-10-15..2026-11-04]']);
  await api.abrir(); assert.equal(db.leituras.filter((l) => /zelozinha-fila/.test(l)).length, 1, 'a segunda abertura não baixa de novo');
  await api.atualizar(); assert.equal(db.leituras.filter((l) => /zelozinha-fila/.test(l)).length, 2, '«Atualizar» baixa de novo');
  assert.ok(!db.leituras.some((l) => /vencimentos|cadastro/.test(l)));
});

prova('«Autorizou pegar na loja»: cada passo fica gravado; o horário lança a linha de hoje UMA vez e fecha a questão', async () => {
  const { api, db, chamadas } = ambiente();
  await api.abrir();
  const nina = () => api.view().abertas.find((c) => c.pet === 'Nina');
  let k = nina().key;
  assert.equal((await api.acao(k, 'resp', { k: 'loja' })).ok, true);
  assert.equal(db.ler(caminhoDe(nina())).passo, 'loja_h'); assert.equal(chamadas.gravar.length, 0);
  const r0 = await api.acao(k, 'salvarh', { hora: '' }); assert.equal(r0.ok, false); assert.equal(r0.erro, 'Escolha o horário antes.'); assert.equal(chamadas.gravar.length, 0);
  const c = nina(), r = await api.acao(k, 'salvarh', { hora: '10:30' });
  assert.equal(r.ok, true); assert.equal(chamadas.gravar.length, 1);
  const rec = db.ler(caminhoDe(c)); assert.equal(rec.st, 'resolvida'); assert.equal(rec.linha.item, 'carrapaticida'); assert.equal(rec.v, 1);
  const linha = db.ler(`daycare/dashboard/${HOJE}/carrapaticida/${rec.linha.id}`); assert.equal(linha.z178.origem, 'loja'); assert.equal(linha.z178.hora, '10:30');
  const v = api.view(); assert.ok(!v.abertas.some((x) => x.pet === 'Nina')); assert.ok(v.fechadas.some((x) => x.pet === 'Nina'));
  assert.equal(api.finalizado(c.dia, c.dc, c.itemK), true);
  const outraVez = await api.acao(k, 'salvarh', { hora: '11:00' });
  assert.equal(outraVez.ok, false); assert.match(outraVez.erro, /já tem um final/); assert.equal(chamadas.gravar.length, 1, 'um toque repetido não lança outra linha');
});

prova('se o Lançamento do dia não aceita a linha, NADA é salvo e a questão continua aberta, com o aviso', async () => {
  const { api, db } = ambiente({ gravarLinha: async () => ({ ok: false }) });
  await api.abrir();
  const c = api.view().abertas.find((x) => x.pet === 'Nina'); await api.acao(c.key, 'resp', { k: 'loja' });
  const r = await api.acao(c.key, 'salvarh', { hora: '10:30' });
  assert.equal(r.ok, false); assert.match(r.erro, /Nada foi salvo/);
  assert.equal(db.ler(caminhoDe(c)).passo, 'loja_h', 'continua esperando o horário'); assert.equal(db.ler(caminhoDe(c)).st, 'aberta');
});

prova('duas pessoas na mesma questão: quem chega depois com a tela velha não atropela; a linha criada nesse meio-tempo é desfeita', async () => {
  const A = ambiente(); await A.api.abrir();
  const B = ambiente({ db: () => A.db, gravarLinha: async (ef) => { B.chamadas.gravar.push(ef); A.db.gravar(`daycare/dashboard/${ef.dia}/${ef.item}/${ef.id}`, ef.reg); return { ok: true, criada: true }; },
    removerLinha: async (ref) => { B.chamadas.remover.push(ref); A.db.gravar(`daycare/dashboard/${ref.dia}/${ref.item}/${ref.id}`, null); return { ok: true }; } });
  await B.api.abrir();
  const k = A.api.view().abertas.find((x) => x.pet === 'Zeca').key;
  const velho = B.api.achar(k); B.api.desligar();   // a tela da B ficou sem a escuta: a visão dela envelhece
  await A.api.acao(k, 'resp', { k: 'bolsa' });
  assert.equal(B.api.achar(k).rec, null, 'a B ainda vê a questão como era');
  const r = await B.api.acao(k, 'resp', { k: 'bolsa' });
  assert.equal(r.ok, false); assert.equal(r.conflito, true); assert.match(r.erro, /Outra pessoa mexeu/);
  assert.equal(A.db.ler(caminhoDe(velho)).passo, 'bolsa1', 'o registro da A não foi atropelado');
  // a B também cria uma linha no meio da ação: se o registro não pôde ser salvo, a linha é desfeita
  const b2 = B.api.achar(k); assert.equal(b2.rec, null);
  const x = await B.api.acao(k, 'b1', { v: 'sim' });
  assert.equal(x.ok, false);
  const c = ambiente(); await c.api.abrir();
  const z = c.api.view().abertas.find((q) => q.pet === 'Zeca'); await c.api.acao(z.key, 'resp', { k: 'bolsa' });
  c.api.desligar();   // visão velha: a escuta do banco não traz a revisão nova
  c.db.gravar(caminhoDe(z) + '/rev', 9);
  const y = await c.api.acao(z.key, 'b1', { v: 'sim' });
  assert.equal(y.ok, false); assert.equal(y.conflito, true); assert.equal(c.chamadas.gravar.length, 1, 'a linha foi criada...'); assert.equal(c.chamadas.remover.length, 1, '...e desfeita, porque o registro não pôde ser salvo');
  assert.equal(c.db.ler(`daycare/dashboard/${HOJE}/vet/${c.chamadas.gravar[0].id}`), null);
});

prova('mudança de outro aparelho chega pela escuta dos registros: a lista e o contador se refazem sem baixar a fila de novo', async () => {
  const A = ambiente(); await A.api.abrir();
  const B = ambiente({ db: () => A.db }); await B.api.abrir();
  let avisos = 0; B.api.aoMudar(() => { avisos++; });
  const k = A.api.view().abertas.find((x) => x.pet === 'Nina').key;
  await A.api.acao(k, 'resp', { k: 'casa' });
  assert.ok(avisos > 0); assert.ok(!B.api.view().abertas.some((x) => x.pet === 'Nina')); assert.equal(B.api.contar(), 4);
  assert.equal(A.db.leituras.filter((l) => /zelozinha-fila/.test(l)).length, 2, 'uma leitura por aparelho (os dois abriram), nenhuma por causa da mudança');
});

prova('«Autorizou para outra data» chama o «Agendou para»; se ele recusar (data de domingo), a mensagem dele aparece e nada é salvo', async () => {
  const { api, db, chamadas } = ambiente();
  await api.abrir();
  const c = api.view().abertas.find((x) => x.pet === 'Zeca'); await api.acao(c.key, 'resp', { k: 'data' });
  const dom = await api.acao(c.key, 'salvard', { data: '2026-11-08' }); assert.equal(dom.ok, false); assert.equal(dom.erro, 'A Zêluz não abre aos domingos.'); assert.equal(chamadas.agendar.length, 0);
  const ok = await api.acao(c.key, 'salvard', { data: '2026-11-09' });
  assert.equal(ok.ok, true); assert.equal(chamadas.agendar.length, 1); assert.equal(chamadas.agendar[0].dc, 'zeca__tutor-b'); assert.equal(chamadas.agendar[0].para, '2026-11-09'); assert.equal(chamadas.agendar[0].itemK, 'vac_raiva_p');
  assert.equal(db.ler(caminhoDe(c)).st, 'agendada'); assert.equal(api.view().agendadas, 1);
  const f = ambiente({ agendar: async () => ({ ok: false, motivo: 'A veterinária não vem nesse dia. Escolha segunda, terça, quarta ou sexta.' }) }); await f.api.abrir();
  const z = f.api.view().abertas.find((x) => x.pet === 'Zeca'); await f.api.acao(z.key, 'resp', { k: 'data' });
  const r = await f.api.acao(z.key, 'salvard', { data: '2026-11-11' }); assert.equal(r.ok, false); assert.match(r.erro, /veterinária não vem/); assert.equal(f.db.ler(caminhoDe(z)).st, 'aberta');
});

prova('«Reabrir»: tira a linha criada; se a linha já foi dada, recusa e não muda nada; desfaz o agendamento', async () => {
  const { api, db, chamadas } = ambiente();
  await api.abrir();
  const c = api.view().abertas.find((x) => x.pet === 'Nina'); await api.acao(c.key, 'resp', { k: 'loja' }); await api.acao(c.key, 'salvarh', { hora: '09:00' });
  const rec = db.ler(caminhoDe(c)), linhaCam = `daycare/dashboard/${HOJE}/${rec.linha.item}/${rec.linha.id}`;
  db.gravar(linhaCam + '/z178/estado', 'dado');
  const nao = await api.acao(c.key, 'reabrir', {}); assert.equal(nao.ok, false); assert.match(nao.erro, /já foi dada/); assert.equal(db.ler(caminhoDe(c)).st, 'resolvida');
  db.gravar(linhaCam + '/z178/estado', 'pendente');
  const sim = await api.acao(c.key, 'reabrir', {}); assert.equal(sim.ok, true); assert.equal(db.ler(linhaCam), null, 'a linha saiu do Lançamento do dia');
  const volta = api.view().abertas.find((x) => x.pet === 'Nina'); assert.equal(volta.reaberta, true); assert.equal(volta.passo, 'loja_h', 'volta ao passo em que estava ao fechar (o horário)'); assert.equal(volta.prev, 'naoresp', '«Voltar» leva ao início');
  const z = api.view().abertas.find((x) => x.pet === 'Zeca'); await api.acao(z.key, 'resp', { k: 'data' }); await api.acao(z.key, 'salvard', { data: '2026-11-09' });
  assert.equal((await api.acao(z.key, 'reabrir', {})).ok, true); assert.equal(chamadas.desfazer.length, 1); assert.equal(chamadas.desfazer[0].itemK, 'vac_raiva_p');
});

prova('«Faltou» e «Foi dado» vindos da linha: faltou tira a linha e volta a questão pedindo data; dado marca a linha e fecha; vale também para o «Agendados para este dia»', async () => {
  const { api, db, chamadas } = ambiente();
  await api.abrir();
  const c = api.view().abertas.find((x) => x.pet === 'Pipoca');
  await api.acao(c.key, 'resp', { k: 'bolsa' }); await api.acao(c.key, 'b1', { v: 'sim' }); await api.acao(c.key, 'tem', { v: 'umemeio' }); await api.acao(c.key, 'confirmar', {});
  const rec = db.ler(caminhoDe(c)), ref = { dia: HOJE, item: rec.linha.item, id: rec.linha.id };
  const dado = await api.daLinha('dado', Object.assign({ diaOrigem: c.dia, dcKey: c.dc, itemK: c.itemK, origem: 'bolsa' }, ref));
  assert.equal(dado.ok, true); assert.deepEqual(json(chamadas.marcar[0][0]), ref); assert.equal(db.ler(caminhoDe(c)).res.como, 'Foi dado em 05/11'); assert.equal(db.ler(caminhoDe(c)).st, 'resolvida');
  const n = api.view().abertas.find((x) => x.pet === 'Nina');
  const faltou = await api.daLinha('faltou', { dia: HOJE, item: 'carrapaticida', id: 'x1', diaOrigem: n.dia, dcKey: n.dc, itemK: n.itemK, origem: 'loja' });
  assert.equal(faltou.ok, true); assert.equal(chamadas.remover.length >= 1, true);
  const v = api.view().abertas.find((x) => x.pet === 'Nina'); assert.equal(modulo().grupoDe(v), 'faltou'); assert.equal(v.faltou.sel, 'Não foi dado em 05/11'); assert.equal(db.ler(caminhoDe(n)).passo, 'data');
  const z = api.view().abertas.find((x) => x.pet === 'Zeca');
  const ag = await api.daLinha('faltou', { tipo: 'agenda', dia: '2026-11-09', diaOrigem: z.dia, dcKey: z.dc, itemK: z.itemK, origem: 'agendado', nome: 'Zeca', tutor: 'Tutor B' });
  assert.equal(ag.ok, true); assert.equal(chamadas.desfazer[0].itemK, 'vac_raiva_p'); assert.equal(db.ler(caminhoDe(z)).faltou.sel, 'Faltou no dia combinado (09/11)');
  const sem = await api.daLinha('faltou', { dia: HOJE, item: 'vet', id: 'x', diaOrigem: HOJE, dcKey: 'agendada-antiga__t', itemK: 'vac_mult_p', origem: 'agendado', tipo: 'agenda', nome: 'Antiga', tutor: 'T' });
  assert.equal(sem.ok, true, 'agendamento feito antes desta tela (sem registro): o «Faltou» cria o registro e a questão aparece');
  assert.ok(api.view().abertas.some((x) => x.pet === 'Antiga'));
});

/* ---- o horário da vacina ---- */
prova('horário da vacina: grava na mesma linha, guarda quem pôs, e leva para a planilha/TV pelo caminho do app', async () => {
  const P = modulo(), db = bancoFalso({ daycare: { dashboard: { [HOJE]: { vet: { l1: { valor: 'Nina/Shih Tzu · Vacina antirrábica', hora: '', quem: 'Dani', ts: 1, chave: 'nina__t', planilha_ok: null, planilha_msg: 'aguardando o horário' } } } } } });
  const espelhos = []; const op = { db: () => db, agora: () => 99, espelhar: async (x) => { espelhos.push(x); return { ok: true }; } };
  const sem = await P.salvarHora(op, { dia: HOJE, item: 'vet', id: 'l1', hora: '', por: 'Bruna' }); assert.equal(sem.ok, false); assert.equal(sem.erro, 'Escolha o horário antes.');
  assert.equal(db.ler(`daycare/dashboard/${HOJE}/vet/l1/hora`), '');
  const ok = await P.salvarHora(op, { dia: HOJE, item: 'vet', id: 'l1', hora: '09:30', por: 'Bruna' });
  assert.equal(ok.ok, true); const l = db.ler(`daycare/dashboard/${HOJE}/vet/l1`);
  assert.equal(l.hora, '09:30'); assert.equal(l.hora_por, 'Bruna'); assert.equal(l.hora_em, 99); assert.equal(l.valor, 'Nina/Shih Tzu · Vacina antirrábica'); assert.equal(l.planilha_msg, '');
  assert.equal(espelhos.length, 1); assert.equal(espelhos[0].reg.hora, '09:30'); assert.equal(espelhos[0].antes.hora, '');
  const sumiu = await P.salvarHora(op, { dia: HOJE, item: 'vet', id: 'nao-existe', hora: '09:30' }); assert.equal(sumiu.ok, false); assert.match(sumiu.erro, /Não achei/);
  assert.equal(db.ler(`daycare/dashboard/${HOJE}/vet/nao-existe`), null, 'nunca recria uma linha que foi tirada');
});

prova('horário da vacina: linha que já está na planilha muda pelo «editar hora» do app (nunca por cima); alteração pendente barra', async () => {
  const P = modulo(), db = bancoFalso({ daycare: { dashboard: { [HOJE]: { vet: { na: { valor: 'A · Vacina', hora: '', planilha_ok: true }, pend: { valor: 'B · Vacina', hora: '', planilha_ok: true, edicao_pendente: { op_id: 'x' } } } } } } });
  const edicoes = []; const op = { db: () => db, editarHora: async (x) => { edicoes.push(x); return { ok: true }; } };
  const r = await P.salvarHora(op, { dia: HOJE, item: 'vet', id: 'na', hora: '14:00' });
  assert.equal(r.ok, true); assert.equal(r.editou, true); assert.deepEqual(json(edicoes), [{ dia: HOJE, item: 'vet', id: 'na', hora: '14:00' }]); assert.equal(db.ler(`daycare/dashboard/${HOJE}/vet/na/hora`), '', 'quem grava é o «editar hora»');
  const p = await P.salvarHora(op, { dia: HOJE, item: 'vet', id: 'pend', hora: '14:00' }); assert.equal(p.ok, false); assert.match(p.erro, /alteração de hora esperando a planilha/);
  const negou = await P.salvarHora({ db: () => db, editarHora: async () => ({ ok: false, erro: 'A planilha não confirmou.' }) }, { dia: HOJE, item: 'vet', id: 'na', hora: '14:00' });
  assert.equal(negou.ok, false); assert.equal(negou.erro, 'A planilha não confirmou.');
});

/* ---- a tela ---- */
function leitura(P, regs, extra) {
  const l = P.listar({ hoje: HOJE, fila: filaDeExemplo(), regs: regs || {}, respostaAntiga, aindaVence });
  return Object.assign({ pronto: true, hoje: HOJE, erro: '' }, l, extra || {});
}
prova('a tela: contador, filtros por tipo, cartões, «Resolvidas» recolhida; o filtro que esvazia volta a «Todas»', () => {
  const P = modulo(), v = leitura(P), ui = P.novoUI();
  const h = P.telaSemHTML(v, ui);
  assert.match(h, /5 questões abertas · <span class="dest">a mais antiga é de 02\/11<\/span>/);
  assert.match(h, /Todas <span class="n">5<\/span>/); assert.match(h, /Tutor não respondeu <span class="n">5<\/span>/); assert.ok(!/Falar com o tutor <span/.test(h), 'filtro de grupo vazio não aparece');
  assert.match(h, /Tentei de novo/); assert.match(h, /Copiar mensagem/); ['Autorizou pegar na loja', 'Trouxe na bolsa', 'Vai fazer em casa', 'Autorizou para outra data'].forEach((t) => assert.ok(h.includes(t), t));
  assert.match(h, /Resolvidas \(0\)/); assert.match(h, /<div data-z178-resolvidas hidden>/);
  ui.filtro = 'faltou'; assert.equal((P.telaSemHTML(v, ui).match(/data-z178-card=/g) || []).length, 5, 'grupo sem ninguém: mostra todas');
  const um = leitura(P, {}, { abertas: v.abertas.slice(0, 1), contagem: { nresp: 1 } }); assert.match(P.telaSemHTML(um, P.novoUI()), /1 questão aberta · /);
  const vazio = leitura(P, {}, { abertas: [], contagem: {}, maisAntiga: '' }); assert.match(P.telaSemHTML(vazio, P.novoUI()), /Nenhuma questão aberta\. Tudo finalizado\./);
  assert.match(P.telaSemHTML({ pronto: false }, P.novoUI()), /Conferindo as mensagens dos últimos dias/);
  assert.match(P.telaSemHTML({ pronto: false, erro: 'Falhou' }, P.novoUI()), /Falhou[\s\S]*Atualizar/);
});

prova('a tela: cada passo mostra o que a maquete mostra (horário, passo 1 de 2, passo 2 de 2 com «Precisa», aviso de dose, data, pedir nova data)', () => {
  const P = modulo();
  const com = (rec) => P.telaSemHTML(leitura(P, { '2026-11-03': { 'pipoca__tutor-c': { verm_p: Object.assign({ v: 1, rev: 1 }, rec) } } }), P.novoUI());
  assert.match(com({ st: 'aberta', passo: 'loja_h', prev: 'naoresp' }), /Qual horário hoje\?[\s\S]*type="time"[\s\S]*Salvar horário/);
  assert.match(com({ st: 'aberta', passo: 'bolsa1', precisa: { f: 'comp', n: 1.5, t: '1 e ½ comprimido', v: '1 COMPRIMIDO E MEIO' } }), /Passo 1 de 2[\s\S]*Estava na bolsa\?[\s\S]*Sim, estava[\s\S]*Não veio/);
  const p2 = com({ st: 'aberta', passo: 'bolsa2', tem: 'um', precisa: { f: 'comp', n: 1.5, t: '1 e ½ comprimido', v: '1 COMPRIMIDO E MEIO' } });
  assert.match(p2, /Passo 2 de 2[\s\S]*Dá a dose certa\?[\s\S]*Precisa: 1 e ½ comprimido[\s\S]*Tem na bolsa/); assert.match(p2, /Falta ½ comprimido\. Falar com o tutor\./); assert.match(p2, /Tutor mandou o resto/); assert.match(p2, /Autorizou completar com a loja/); assert.match(p2, /Vai dar em outra data/); assert.ok(!/>Confirmado</.test(p2));
  const certo = com({ st: 'aberta', passo: 'bolsa2', tem: 'dois', precisa: { f: 'comp', n: 1.5, t: '1 e ½ comprimido', v: '1 COMPRIMIDO E MEIO' } }); assert.match(certo, /Dose certa\. Tem o bastante\.[\s\S]*Confirmado/);
  assert.match(com({ st: 'aberta', passo: 'contato', prev: '' }), /Não veio na bolsa\. Falar com o tutor\.[\s\S]*Voltar para «Estava na bolsa\?»/);
  assert.match(com({ st: 'aberta', passo: 'data', prev: 'naoresp' }), /Para qual dia\?[\s\S]*type="date" min="2026-11-06"[\s\S]*Depois de salvar, a Zelozinha não manda de novo\./);
  assert.match(com({ st: 'aberta', passo: 'data', faltou: { dia: HOJE, sel: 'Plano: não foi dado em 05/11', msg: 'Peça uma nova data.' } }), /Plano: não foi dado em 05\/11[\s\S]*Pedir nova data[\s\S]*Ou dar outro final/);
});

prova('a tela: Resolvidas mostra quem resolveu, quando e «Reabrir»; agendada leva o selo dourado e conta à parte', () => {
  const P = modulo(), regs = { '2026-11-03': { 'pipoca__tutor-c': { verm_p: { v: 1, st: 'agendada', res: { por: 'Dani', em: EM(HOJE, '09:40'), como: 'Agendado para seg, 09/11 · a Zelozinha não manda de novo' }, seq: 3, rev: 1 } } } };
  const ui = P.novoUI(); ui.resAberto = true;
  const h = P.telaSemHTML(leitura(P, regs), ui);
  assert.match(h, /Resolvidas \(1\)/); assert.ok(!/data-z178-resolvidas hidden/.test(h)); assert.match(h, /Agendada por Dani, 05\/11 09:40/); assert.match(h, /z178-chip sem">Agendado para seg, 09\/11/); assert.match(h, /1 agendada para outro dia \(fica em «Resolvidas», fora da contagem\)/); assert.match(h, /data-z178-a="reabrir"/);
});

prova('a tela: «Resolvidas» mostra as 50 mais recentes e diz quantas são no total', () => {
  const P = modulo(), muitas = [];
  for (let i = 0; i < 53; i++) muitas.push(Object.assign(P.cartao('2026-11-03', 'p' + i + '__t', 'verm_p', '2026-11-03', { nome: 'P' + i, tutor: 'T' }, { v: 1, st: 'resolvida', res: { por: 'Dani', em: EM(HOJE, '09:00'), como: 'Vai fazer em casa. Sem lançamento' }, seq: i }, null)));
  const h = P.telaSemHTML({ pronto: true, hoje: HOJE, abertas: [], fechadas: muitas, contagem: {}, agendadas: 0, maisAntiga: '' }, Object.assign(P.novoUI(), { resAberto: true }));
  assert.match(h, /Resolvidas \(53\)/); assert.equal((h.match(/data-z178-res=/g) || []).length, 50); assert.match(h, /Mostrando as 50 mais recentes\./);
});

prova('a tela: tudo escapado (nome, tutor, texto da mensagem, chave) e sem o vocabulário que a casa não usa', () => {
  const P = modulo(), fila = filaDeExemplo();
  fila['2026-11-04']['x"><img src=x onerror=alert(1)>__t'] = rg('2026-11-04', 'x"><img src=x onerror=alert(1)>__t', '<b>Nome</b>', 'Tutor <script>alert(2)</script>', [{ itemK: 'verm_p', vence: '2026-11-04' }], { textoEnviado: '<img src=x onerror=alert(3)>' });
  const l = P.listar({ hoje: HOJE, fila, regs: {}, respostaAntiga, aindaVence }), ui = P.novoUI();
  l.abertas.forEach((c) => { ui.msgAberta[c.key] = true; });
  const h = P.telaSemHTML(Object.assign({ pronto: true, hoje: HOJE }, l), ui);
  assert.ok(!/<b>Nome|<script|<img/.test(h), h); assert.match(h, /&lt;b&gt;Nome&lt;\/b&gt;/); assert.match(h, /Tutor &lt;script&gt;/); assert.ok(!/data-z178-q="[^"]*"[^>]*><img/.test(h));
  const codigo = script('zelozinha-pendencias178');
  assert.ok(!/\b(cão|cães|cachorro|cachorros|baia|baias|soltar|solto)\b/i.test(codigo), 'vocabulário da casa'); assert.ok(!/\b(alert|confirm|prompt)\(/.test(codigo), 'sem alert/confirm/prompt');
});

prova('a linha do Lançamento do dia: de onde veio, «A dar», «Foi dado»/«Faltou»; vacina sem horário vem com o selo e «Pôr horário»; linha comum fica como estava', () => {
  const P = modulo(), ui = P.novoUI();
  const z = { dia: '2026-11-03', dcKey: 'a__b', itemK: 'vac_mult_p', origem: 'bolsa', estado: 'pendente' };
  const vet = P.linhaHTML('vet', 'l1', { valor: 'Nina · Vacina', hora: '', z178: z }, HOJE, ui);
  assert.match(vet, /A dar/); assert.match(vet, /Da bolsa, conferido pelo Day Care/); assert.match(vet, /SEM HORÁRIO/); assert.match(vet, /Pôr horário/); assert.match(vet, /data-z178-l="dado"[^>]*>Foi dado/); assert.match(vet, /data-z178-l="faltou"[^>]*>Faltou/); assert.match(vet, /data-z178-ref="2026-11-05\|vet\|l1"/);
  const comHora = P.linhaHTML('vet', 'l1', { valor: 'Nina · Vacina', hora: '09:30', z178: z }, HOJE, ui); assert.ok(!/SEM HORÁRIO|Pôr horário/.test(comHora)); assert.match(comHora, /Foi dado/);
  const dado = P.linhaHTML('vermifugo', 'l2', { valor: 'x', z178: Object.assign({}, z, { estado: 'dado', feitoPor: 'Dani' }) }, HOJE, ui); assert.match(dado, /Dado/); assert.ok(!/Foi dado|Faltou/.test(dado)); assert.match(dado, /dado por Dani/);
  assert.equal(P.linhaHTML('vermifugo', 'l3', { valor: 'x' }, HOJE, ui), '', 'linha à mão: nada muda');
  const antiga = P.linhaHTML('vet', 'l4', { valor: 'Nina · Vacina (CONFERIR HORÁRIO/ORIENTAÇÃO)', hora: '' }, HOJE, ui); assert.match(antiga, /SEM HORÁRIO/); assert.match(antiga, /Pôr horário/); assert.ok(!/Foi dado|Faltou/.test(antiga), 'a linha da resposta antiga ganha só o horário');
  ui.horaAberta[HOJE + '|vet|l1'] = true; const aberto = P.linhaHTML('vet', 'l1', { valor: 'N', hora: '', z178: z }, HOJE, ui);
  assert.match(aberto, /type="time"[\s\S]*Salvar horário[\s\S]*Falta o horário: sem ele o alarme não toca na TV\./);
  ui.horaErro[HOJE + '|vet|l1'] = 'Escolha o horário antes.'; assert.match(P.linhaHTML('vet', 'l1', { valor: 'N', hora: '', z178: z }, HOJE, ui), /role="alert">Escolha o horário antes\./);
  assert.equal(P.linhaHTML('vet', 'l5', { valor: 'N', hora: '', edicao_pendente: { op_id: 'x' } }, HOJE, ui), '', 'com alteração pendente, o app já mostra o estado dela');
});

prova('o bloco do horário no cartão da família: salvo mostra «alarme na TV · trocar»; sem horário pede e avisa', () => {
  const P = modulo(), ui = P.novoUI(), ref = HOJE + '|vet|l1';
  const salvo = P.horaBlocoHTML({ ref, hora: '16:30', por: 'Bruna', em: EM(HOJE, '09:20') }, ui);
  assert.match(salvo, /Horário: 16:30 · alarme na TV · salvo por Bruna às 09:20 · <button[^>]*data-z178-h="trocar"/);
  const sem = P.horaBlocoHTML({ ref, hora: '' }, ui); assert.match(sem, /Falta o horário: sem ele o alarme não toca na TV\./); assert.match(sem, /hbloco falta/);
  ui.horaAberta[ref] = true; assert.match(P.horaBlocoHTML({ ref, hora: '16:30' }, ui), /value="16:30"[\s\S]*cancelar/);
});

prova('a tela do plano (09/11/2026): só conferência, sem chave; validade, doses usadas, quem falta marcar na ficha, irmãos e o texto aprovado', () => {
  const P = modulo(), ui = P.novoUI();
  const h = P.planoHTML({ fichas: [{ dc: 'tico__h', pet: 'Tico', raca: 'Beagle', tutor: 'Helena', irmaos: ['Teca'], ate: '30/11/2026', linhas: [{ nome: 'Vermífugo', texto: '1 de 2 doses usadas', acabou: false }, { nome: 'Coleira repelente', texto: '1 de 1 dose usada', acabou: true }] }],
    falta: [{ dc: 'luna__d', pet: 'Luna', raca: 'Poodle', tutor: 'Dora' }], hoje: [{ pet: 'Tico', cuidados: 'Vermífugo', estado: 'ENVIADA 10:03' }], texto: 'Oi, Dora, tudo bem? Hoje o Mingau recebe aqui o vermífugo, conforme fechado no plano. Qualquer novidade, a gente conta. 💛' }, ui);
  assert.match(h, /Famílias com cuidados pagos \(1\)/); assert.match(h, /plano até 30\/11\/2026/); assert.match(h, /Vermífugo<\/strong> · 1 de 2 doses usadas/);
  assert.match(h, /1 de 1 dose usada <span class="z178-chip sem">acabou: volta a pergunta/); assert.match(h, /Falta marcar na ficha \(1\)/); assert.match(h, /Luna/);
  assert.match(h, /um aviso só/); assert.match(h, /ENVIADA 10:03/); assert.match(h, /conforme fechado no plano/); assert.match(h, /aba Plano › «Cuidados pagos junto com o plano»/);
  assert.ok(!/role="switch"|plano-sw|data-z178-ligar/.test(h), 'a chave de ligar saiu');
  assert.match(P.planoHTML({}, P.novoUI()), /Nenhuma ficha com cuidados pagos no plano que vale hoje/);
  assert.ok(!/Falta marcar/.test(P.planoHTML({}, P.novoUI())));
});

prova('a ligação com a página (sem navegador de verdade): o toque no botão chama a camada de gravação e repinta; o erro aparece no cartão', async () => {
  const { api } = ambiente(); await api.abrir();
  const P = modulo();
  const ouvintes = {}, raiz = { innerHTML: '' };
  const ctx = novoContexto();
  ctx.document = { addEventListener: (ev, fn) => { (ouvintes[ev] = ouvintes[ev] || []).push(fn); }, querySelectorAll: (s) => (s === '[data-z178-raiz="sem"]' ? [raiz] : []), querySelector: () => null, documentElement: { style: {} }, head: null };
  ctx.window = Object.assign(ctx, { pageYOffset: 0, scrollTo: () => {} });
  const Pm = ctx.ZelozinhaPendencias178, amb = ambiente(); await amb.api.abrir();
  const tela = Pm.instalar({ api: amb.api, portas: {} }); tela.pintar();
  assert.match(raiz.innerHTML, /5 questões abertas/);
  const nina = amb.api.view().abertas.find((c) => c.pet === 'Nina');
  const botao = (a, extra) => ({ disabled: false, getAttribute: (n) => ({ 'data-z178-a': a, 'data-z178-q': nina.key }[n] || (extra || {})[n] || null) });
  const toque = (b) => ouvintes.click.forEach((fn) => fn({ target: { closest: (s) => (s === '[data-z178-a]' ? b : null) } }));
  toque(botao('resp', { 'data-k': 'loja' })); await new Promise((r) => setTimeout(r, 20));
  assert.match(raiz.innerHTML, /Qual horário hoje\?/);
  toque(botao('salvarh')); await new Promise((r) => setTimeout(r, 20));
  assert.match(raiz.innerHTML, /Escolha o horário antes\./, 'o erro aparece no próprio cartão');
  toque(botao('vermsg')); await new Promise((r) => setTimeout(r, 5)); assert.match(raiz.innerHTML, /Esconder mensagem/);
  toque(botao('filtro', { 'data-k': 'resp' })); await new Promise((r) => setTimeout(r, 5)); assert.match(raiz.innerHTML, /aria-pressed="true">Resposta a registrar/);
});

/* ============== D. o plano no Lançamento do dia (a linha nasce no check-in) ============== */
prova('as linhas do plano: uma por cuidado, sem pergunta e sem cobrança extra (não leva «LOJA»), vacina em Veterinário sem horário', () => {
  const P = modulo();
  const ls = P.montarLinhasPlano({ dia: HOJE, dc: 'mingau__dora', nome: 'Mingau', tutor: 'Dora', itens: [{ itemK: 'vac_mult_p', vence: '2026-11-05' }, { itemK: 'verm_p', vence: '2026-11-04' }, { itemK: 'ecto_p', vence: '2026-11-04' }],
    pet: { base: 'Mingau/Yorkshire', chave: 'mingau__dora' }, precisaDe: (c) => (c.itemK === 'verm_p' ? P.precisaDeValor('verm_p', '1 COMPRIMIDO') : null), por: 'Check-in', agora: 7 });
  assert.deepEqual(json(ls.map((x) => x.item)), ['vet', 'vermifugo', 'carrapaticida']);
  assert.equal(ls[0].reg.valor, 'Mingau/Yorkshire · Vacina múltipla'); assert.equal(ls[0].reg.hora, '');
  assert.equal(ls[1].reg.valor, 'Mingau/Yorkshire (1 COMPRIMIDO)'); assert.equal(ls[2].reg.valor, 'Mingau/Yorkshire (PIPETA)');
  ls.forEach((x) => { assert.equal(x.reg.z178.origem, 'plano'); assert.equal(x.reg.z178.estado, 'pendente'); assert.ok(!x.reg.det || !x.reg.det.onde, 'o plano já está pago no acerto do mês: nenhuma linha vira cobrança'); assert.equal(x.dia, HOJE); });
  assert.deepEqual(json(P.montarLinhasPlano({ dia: HOJE, dc: 'a__b', itens: [{ itemK: 'verm_p', vence: HOJE }], pet: null })), [], 'sem a ficha única, nenhuma linha');
});

prova('lançar o plano: grava cada linha pela porta e diz se alguma não entrou (a de antes continua, gravar de novo não duplica)', async () => {
  const P = modulo(), gravadas = [];
  const ok = await P.lancarPlano({ pet: () => ({ base: 'Mingau/Yorkshire', chave: 'mingau__dora' }), gravarLinha: async (ef) => { gravadas.push(ef); return { ok: true, criada: true }; }, precisaDe: () => null, agora: () => 7 },
    { dia: HOJE, dcKey: 'mingau__dora', nome: 'Mingau', tutor: 'Dora', itens: [{ itemK: 'vac_mult_p', vence: HOJE }, { itemK: 'verm_p', vence: HOJE }] });
  assert.equal(ok.ok, true); assert.equal(gravadas.length, 2); assert.equal(gravadas[0].tipo, 'linha'); assert.match(gravadas[0].id, /^z178_plano_/);
  const falha = await P.lancarPlano({ pet: () => ({ base: 'x', chave: 'a__b' }), gravarLinha: async () => ({ ok: false }), agora: () => 7 }, { dia: HOJE, dcKey: 'a__b', itens: [{ itemK: 'verm_p', vence: HOJE }] });
  assert.equal(falha.ok, false);
  const semFicha = await P.lancarPlano({ pet: () => null, gravarLinha: async () => ({ ok: true }) }, { dia: HOJE, dcKey: 'a__b', itens: [{ itemK: 'verm_p', vence: HOJE }] });
  assert.equal(semFicha.ok, false);
});

prova('a Zelozinha trata o aviso do plano como aviso: sem botões de resposta, com a frase certa; e lista os avisos de hoje', async () => {
  const ctx = novoContexto(), ZS = ctx.ZelozinhaSimples, ouv = [];
  const it = { v: 1, dia: HOJE, dcKey: 'luna__t', nome: 'Luna', tutor: 'T', estado: 'enviado', tipo: 'plano', enviadoEm: EM(HOJE, '10:03'), itens: [{ itemK: 'verm_p', vence: HOJE }], texto: 'Texto fictício' };
  ZS.ligar({ ref: (p) => ({ on: (ev, fn) => { ouv.push([p, ev, fn]); }, off: () => {} }) }, HOJE);
  ouv.filter((o) => o[1] === 'child_added' && o[0] === `${ZS.FILA}/${HOJE}`).forEach((o) => o[2]({ key: 'luna__t', val: () => it }));
  const st = ZS.statusDoCiclo({ dia: HOJE, dcKey: 'luna__t' }, { itemK: 'verm_p' });
  assert.equal(st.plano, true); assert.match(st.motivo, /Plano com cuidados incluídos/); assert.match(st.rotulo, /ENVIADA/);
  const normal = Object.assign({}, it, { dcKey: 'rex__t', tipo: undefined }); delete normal.tipo;
  ouv.filter((o) => o[1] === 'child_added' && o[0] === `${ZS.FILA}/${HOJE}`).forEach((o) => o[2]({ key: 'rex__t', val: () => normal }));
  assert.equal(ZS.statusDoCiclo({ dia: HOJE, dcKey: 'rex__t' }, { itemK: 'verm_p' }).plano, undefined);
  const hoje = ZS.planoHoje(HOJE); assert.equal(hoje.length, 1); assert.equal(hoje[0].dcKey, 'luna__t'); assert.equal(hoje[0].pet, 'Luna'); assert.equal(hoje[0].cuidados, 'Vermífugo'); assert.match(hoje[0].estado, /ENVIADA 10:03/);
  assert.deepEqual(json(ZS.planoHoje('2026-11-06')), []);
  ZS.desligar();
});

/* ============== E. a página: abas, ligação, Lançamento do dia, cartões da Zelozinha ============== */
function funcaoDaPagina(nome) {
  const ini = html.indexOf('  function ' + nome + '(');
  assert.ok(ini > 0, 'a página tem ' + nome);
  const fim = html.indexOf('\n  }\n', ini);
  return html.slice(ini, fim + 4);
}
function funcaoSolta(nome) {
  const ini = html.indexOf('function ' + nome + '(');
  assert.ok(ini > 0, 'a página tem ' + nome);
  let d = 0, i = html.indexOf('{', ini);
  for (let j = i; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (d === 0) return html.slice(ini, j + 1); } }
  throw Error('função sem fim: ' + nome);
}

prova('a tela da Zelozinha ganha as abas «Sem finalização» (com o contador) e «Plano com cuidados incluídos», cada uma com a sua raiz', () => {
  const hub = html.slice(html.indexOf('<div data-zelozinha-hub116>'), html.indexOf('<!-- ===== BANHOS RECORRENTES'));
  assert.match(hub, /data-zt694-tab="semfinal">Sem finalização <span class="badge badge-neutral" data-z178-badge[^>]*>—<\/span>/);
  assert.match(hub, /data-zt694-tab="plano">Plano com cuidados incluídos<\/button>/);
  assert.match(hub, /<section id="hub116-pane-semfinal"[^>]*data-zt694-pane="semfinal" hidden>\s*<div data-z178-raiz="sem">/);
  assert.match(hub, /<section id="hub116-pane-plano"[^>]*data-zt694-pane="plano" hidden>\s*<div data-z178-raiz="plano">/);
  assert.match(hub, /aria-controls="hub116-pane-semfinal"/); assert.match(html, /w\.zelozinha116AbrirFila = function \(nome\) \{ if \(nome === 'resolve' \|\| nome === 'progress' \|\| nome === 'snoopy' \|\| nome === 'semfinal' \|\| nome === 'plano'\) alternarAba\(nome\); \};/);
});

prova('a página carrega o aviso do plano e o módulo novo, na ordem certa, e liga tudo numa só ligação', () => {
  const pos = (id) => html.indexOf('<script id="' + id + '"');
  ['aviso-plano', 'zelozinha-pendencias178', 'zelozinha-pendencias178-ligacao'].forEach((id) => assert.ok(pos(id) > 0, id));
  assert.ok(pos('aviso-plano') < pos('zelozinha-simples'), 'o aviso vem antes de quem o usa');
  assert.ok(pos('zelozinha-simples') < pos('zelozinha-pendencias178') && pos('zelozinha-pendencias178') < pos('zelozinha-contatos89-ui') && pos('zelozinha-painel116-controller') < pos('zelozinha-pendencias178-ligacao'));
  const lig = script('zelozinha-pendencias178-ligacao');
  ['gravarLinha', 'removerLinha', 'marcarLinha', 'agendar', 'desfazerAgenda', 'marcarAgenda', 'respostaAntiga', 'aindaVence', 'precisaDe', 'filaHoje', 'salvarHora', 'editarHora', 'espelhar', 'planoView', 'lerLinha', 'redesenharLinha'].forEach((n) => assert.ok(lig.includes(n + ':') || lig.includes('function ' + n + '('), 'a ligação entrega ' + n));
  assert.ok(!/\b(alert|confirm|prompt)\(/.test(lig), 'sem alert/confirm/prompt novos'); assert.ok(!/\b(cão|cães|cachorro|baia|soltar|solto)\b/i.test(lig), 'vocabulário da casa');
});

prova('a ligação grava só em caminhos que a regra do banco já permite (daycare/{coleção}/{item}), sem regra nova', () => {
  const regras = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../database.rules.json'), 'utf8')).rules.daycare;
  assert.equal(regras['$colecao']['$item']['.write'], 'auth != null', 'qualquer login grava dentro de daycare/{coleção}/{item}');
  const P = script('zelozinha-pendencias178') + script('zelozinha-pendencias178-ligacao');
  const caminhos = new Set(); (P.match(/'daycare\/[a-z0-9-]+/g) || []).forEach((c) => caminhos.add(c.slice(1)));
  const permitidos = ['daycare/zelozinha-pendencias', 'daycare/zelozinha-fila', 'daycare/dashboard', 'daycare/agendamentos', 'daycare/cadastro'];
  caminhos.forEach((c) => assert.ok(permitidos.includes(c), 'caminho não previsto: ' + c));
  assert.ok(caminhos.has('daycare/zelozinha-pendencias'));
});

prova('Lançamento do dia: a linha da Zelozinha só atualiza a ficha depois de «Foi dado» (o que vai ser dado ainda não foi dado)', () => {
  const sb = { DASH_PREV_FICHA_ITENS: { vermifugo: 'verm_p', carrapaticida: 'ecto_p' } };
  vm.createContext(sb); vm.runInContext(funcaoDaPagina('dashPrevFichaElegivel') + '\nthis.f=dashPrevFichaElegivel;', sb);
  const f = sb.f, base = { chave: 'a__b' };
  assert.equal(f('vermifugo', base), true, 'lançamento à mão: como sempre');
  assert.equal(f('vermifugo', Object.assign({ z178: { estado: 'pendente' } }, base)), false);
  assert.equal(f('vermifugo', Object.assign({ z178: { estado: 'dado' } }, base)), true);
  assert.equal(f('vermifugo', Object.assign({ z178: { estado: 'faltou' } }, base)), false);
  assert.equal(f('vermifugo', { chave: 'a__b', origemVencimento: { protocolo: 'cuidado57' } }), false, 'o que já era barrado continua barrado');
});

prova('Lançamento do dia › Veterinário: sem horário primeiro, depois por horário, e a linha mostra o que a Zelozinha sabe dela', () => {
  const sb = {}; vm.createContext(sb); vm.runInContext(funcaoDaPagina('dashOrdemLinhas') + '\nthis.f=dashOrdemLinhas;', sb);
  const lista = { a: { hora: '16:30', ts: 1 }, b: { hora: '', ts: 5 }, c: { hora: '09:00', ts: 3 }, d: { hora: '', ts: 2 }, e: { hora: '09:00', ts: 2 } };
  assert.deepEqual(json(sb.f('vet', lista)), ['d', 'b', 'e', 'c', 'a']);
  const outro = { a: { ts: 3 }, b: { ts: 1 }, c: { ts: 2 } };
  assert.deepEqual(json(sb.f('banho', outro)), ['b', 'c', 'a'], 'os outros cartões continuam pela ordem em que foram lançados');
  const corpo = funcaoSolta('dashCartaoHTML');
  assert.ok(corpo.includes('dashOrdemLinhas(it.k,lista)'), 'o cartão usa a ordem'); assert.ok(corpo.includes('+dashZ178LinhaHTML(it.k,id,o,__diaDash)'), 'a linha mostra a marca da Zelozinha');
  assert.ok(/o\.planilha_ok!==true&&\(Date\.now\(\)-\(o\.ts\|\|0\)\)>120000&&!dashZ178AguardaHora\(it\.k,o\)/.test(corpo), 'sem horário, o aviso de «envio à planilha não confirmado» não aparece (o horário vem primeiro)');
  assert.ok(corpo.includes('dashZ178Resumo(it.k,ks,lista)'), 'o título do Veterinário diz quantas estão sem horário');
  const ponte = funcaoSolta('dashZ178LinhaHTML');
  assert.ok(ponte.includes('ZelozinhaPendencias178') && ponte.includes('linhaHTML'), 'a linha pede o HTML ao módulo, sem repetir regra');
});

prova('Lançamento do dia: o resumo do Veterinário e o aviso de planilha esperam o horário', () => {
  const sb = {}; vm.createContext(sb); vm.runInContext(funcaoDaPagina('dashZ178Resumo') + funcaoDaPagina('dashZ178AguardaHora') + '\nthis.r=dashZ178Resumo;this.a=dashZ178AguardaHora;', sb);
  assert.equal(sb.r('vet', ['x', 'y', 'z'], { x: { hora: '' }, y: { hora: '09:00' }, z: {} }), ' · <span style="color:var(--crm-atencao-text);font-weight:800">2 sem horário</span>');
  assert.equal(sb.r('vet', ['x'], { x: { hora: '09:00' } }), ''); assert.equal(sb.r('banho', ['x'], { x: { hora: '' } }), '');
  assert.equal(sb.a('vet', { hora: '', planilha_msg: 'aguardando o horário' }), true); assert.equal(sb.a('vet', { hora: '09:00', planilha_msg: 'aguardando o horário' }), false); assert.equal(sb.a('vermifugo', { hora: '' }), false);
  assert.equal(sb.a('vet', { hora: '' }), false, 'linha antiga sem a marca: o aviso de sempre continua');
});

prova('cartões da Zelozinha: o que foi finalizado em «Sem finalização» sai de «Para resolver», e o aviso do plano não pede resposta', () => {
  const corpo = funcaoDaPagina('cuidadoFila117');
  assert.ok(/var f178=final178\(c,v\);if\(f178\)return f178;/.test(corpo), 'a classificação consulta o final antes de tudo');
  const sb = { window: { ZelozinhaPendencias178: { finalizado: (dia, dc, k) => dia === HOJE && dc === 'a__b' && k === 'verm_p' } } };
  vm.createContext(sb); vm.runInContext(funcaoDaPagina('final178') + '\nthis.f=final178;', sb);
  const pronto = { respostaSalva: true, linhaObrigatoria: false, linhaConfirmada: false, bloqueado: false, tarefaOrfa: false, cuidadoEmAberto: false };
  assert.deepEqual(json(sb.f({ dia: HOJE, dcKey: 'a__b' }, { cy: { itemK: 'verm_p' }, st: {} })), pronto);
  assert.equal(sb.f({ dia: HOJE, dcKey: 'a__b' }, { cy: { itemK: 'ecto_p' }, st: {} }), null);
  assert.deepEqual(json(sb.f({ dia: HOJE, dcKey: 'x__y' }, { cy: { itemK: 'verm_p' }, st: { plano: true } })), pronto, 'plano com cuidados incluídos: nada a responder');
  const care = funcaoDaPagina('careHTML'); assert.ok(care.includes('v.st&&v.st.plano'), 'o cartão do plano não tem botões de resposta');
});

prova('cartões da Zelozinha: a vacina que foi para o Lançamento do dia pede o horário ali mesmo, e o salvar redesenha o cartão', () => {
  const pos = funcaoDaPagina('posHTML'); assert.ok(pos.includes('horario178(c,l,linha)'), 'o cartão mostra o bloco do horário da vacina');
  const h = funcaoDaPagina('horario178'); assert.ok(h.includes("l.item!=='vet'") && h.includes('horaBlocoHTML'));
  assert.match(html, /document\.addEventListener\('z178:hora',function\(ev\)/);
});

prova('os cuidados pagos são marcados na ficha › aba Plano (plano_cuidados) e o check-in lê deles, com a dose gasta numa transação; a chave antiga não decide mais', () => {
  const lig = script('zelozinha-pendencias178-ligacao'), zs = script('zelozinha-simples');
  assert.ok(!/setPelExtra\(p,\{cuidadosNoPlano/.test(lig), 'a aba da Zelozinha não liga mais nada na ficha');
  assert.ok(!zs.includes('cuidadosNoPlano===true'), 'o check-in não decide mais pela chave antiga');
  assert.ok(zs.includes("db.ref('daycare/cadastro/'+pelKey+'/plano_usos').transaction("), 'a dose do dia é gasta numa transação na ficha');
  assert.ok(html.includes('+planoCuidadosHTML(ex,p)'), 'o bloco fica na aba Plano da ficha');
  const ip = html.indexOf('  async function pcSalvar('), pc = html.slice(ip, html.indexOf('\n  }\n', ip)); assert.ok(pc.length > 100, 'a página tem pcSalvar'); assert.ok(pc.includes("patch['plano_cuidados/'+per.inicio]") && pc.includes('renovPodeDesfazer()') && pc.includes('setPelExtra('), 'grava pela porta da ficha, com a régua do Confirmar do plano');
});

prova('o bloco «Cuidados pagos» usa o desenho da ficha: caixa creme com faixa dourada e as doses na barra dourada, sem caixinha nem −/+', () => {
  const i = html.indexOf('  function planoCuidadosHTML('), b = html.slice(i, html.indexOf('\n  }\n', i));
  assert.ok(b.includes('border-left:4px solid var(--z-gold)') && b.includes('background:var(--z-cream-warm)'), 'mesma caixa do «Começou no meio do mês?»');
  assert.ok(b.includes('class="seg gold" data-single') && b.includes('class="field"') && b.includes('class="cad-grid"'), 'campo com rótulo e barra dourada, como o «Nº do peludinho»');
  assert.ok(b.includes("'Não pagou'") && b.includes('onclick="pcPor('), '«Não pagou» é o zero e cada número grava no rascunho');
  assert.ok(!b.includes('type="checkbox"') && !b.includes('pcDoses(') && !html.includes('function pcMarcar('), 'sem caixinha de marcar e sem −/+');
});

prova('a fábrica do check-in recebe a porta que lança o plano, e a auditoria sabe contar a história do plano', () => {
  const f = funcaoDaPagina('fabricaPonte'); assert.ok(f.includes('lancarPlano:'), 'fabricaPonte entrega lancarPlano');
  assert.ok(f.includes("'plano-sem-linha'"), 'a auditoria diz quando a linha do plano não entrou');
  assert.ok(script('zelozinha-simples').includes("FINAIS={'na-fila':1,'ja-estava-na-fila':1,humano:1,'resolvido-antes':1};"), 'plano-sem-linha NÃO é final: a fila se completa sozinha e tenta de novo');
});

prova('versão 2026-11-10-04 em todos os arquivos versionados; nenhuma versão antiga ficou para trás', () => {
  assert.match(html, /const APP_VERSAO='2026-11-10-04';/);
  assert.equal(html.split('2026-11-10-04').length - 1, 12);
  assert.ok(!/2026-11-05-01|2026-11-05-02/.test(html), 'nenhum ?v= ficou na versão antiga');
});

/* ============== F. «Agendados para este dia»: ganha «Foi dado» e «Faltou» ============== */
function comAgenda(db) {
  const ctx = novoContexto();
  vm.runInContext(script('zelozinha-agenda'), ctx);
  return { ctx, ZA: ctx.ZelozinhaAgenda, P: ctx.ZelozinhaPendencias178 };
}
prova('a lista «Agendados para este dia» ganha «Foi dado» e «Faltou»; o que já foi dado mostra quem deu e perde os botões', async () => {
  const reg = { v: 1, para: HOJE, itemK: 'vac_mult_p', dcKey: 'zeca__tutor-b', pelKey: 'zeca__tutor-b', nome: 'Zeca', tutor: 'Tutor B', diaOrigem: '2026-11-03', por: 'Dani', z178: { dia: '2026-11-02', vence: '2026-11-01' } };
  const db = bancoFalso({ daycare: { agendamentos: { 'zeca__tutor-b': { vac_mult_p: reg, verm_p: Object.assign({}, reg, { itemK: 'verm_p', dado: { por: 'Bruna', em: 1 } }) } } } });
  const { ZA } = comAgenda(db); await ZA.carregar(db);
  const h = ZA.lancamentoHTML(HOJE);
  assert.match(h, /Agendados para este dia \(2\)/); assert.equal((h.match(/data-z178-ag="dado"/g) || []).length, 1); assert.equal((h.match(/data-z178-ag="faltou"/g) || []).length, 1);
  assert.match(h, /dado por Bruna/); assert.match(h, /Confirmar horário/, 'o que já existia continua');
  const o = h.match(/data-z178-ag="dado" data-z178-o="([^"]+)"/)[1].split('|').map(decodeURIComponent);
  assert.deepEqual(o, ['zeca__tutor-b', 'vac_mult_p', '2026-11-02', HOJE, 'Zeca', 'Tutor B', '2026-11-01'], 'o dia da questão é o que o agendamento guardou (z178.dia), não o dia em que foi agendado');
  const antigo = Object.assign({}, reg); delete antigo.z178;
  assert.match(modulo().agendaBotoesHTML(antigo, HOJE), /2026-11-03/, 'agendamento feito pelo botão antigo: vale o dia em que foi agendado');
});

prova('«Foi dado» e «Faltou» no agendado funcionam pela mesma camada: faltou desfaz o agendamento e devolve a questão; dado marca; o aviso do plano dado não vira questão', async () => {
  const { api, db, chamadas } = ambiente({}, { daycare: { 'zelozinha-fila': (({ [HOJE]: _, ...p }) => p)(filaDeExemplo()) } });
  await api.abrir();
  const z = api.view().abertas.find((x) => x.pet === 'Zeca'); await api.acao(z.key, 'resp', { k: 'data' }); await api.acao(z.key, 'salvard', { data: '2026-11-09' });
  const faltou = await api.daLinha('faltou', { tipo: 'agenda', dia: '2026-11-09', diaOrigem: z.dia, dcKey: z.dc, itemK: z.itemK, origem: 'agendado' });
  assert.equal(faltou.ok, true); assert.equal(chamadas.desfazer.length, 1);
  const v = api.view().abertas.find((x) => x.pet === 'Zeca'); assert.equal(v.passo, 'data'); assert.equal(v.faltou.sel, 'Faltou no dia combinado (09/11)'); assert.equal(v.agenda, null);
  const n = api.view().abertas.find((x) => x.pet === 'Nina'); await api.acao(n.key, 'resp', { k: 'data' }); await api.acao(n.key, 'salvard', { data: '2026-11-10' });
  const dado = await api.daLinha('dado', { tipo: 'agenda', dia: '2026-11-10', diaOrigem: n.dia, dcKey: n.dc, itemK: n.itemK, origem: 'agendado' });
  assert.equal(dado.ok, true); assert.equal(chamadas.marcarAgenda.length, 1); assert.equal(db.ler(caminhoDe(n)).res.como, 'Foi dado em 10/11');
  const antes = JSON.stringify(db.ler('daycare/zelozinha-pendencias'));
  const plano = await api.daLinha('dado', { dia: HOJE, item: 'vermifugo', id: 'lp1', diaOrigem: HOJE, dcKey: 'luna__tutora-f', itemK: 'verm_p', origem: 'plano' });
  assert.equal(plano.ok, true); assert.equal(chamadas.marcar.length, 1); assert.equal(JSON.stringify(db.ler('daycare/zelozinha-pendencias')), antes, 'nenhum registro novo: o aviso do plano que foi dado não vira «questão resolvida»');
});

prova('o toque em «Foi dado»/«Faltou» da lista de agendados (sem navegador de verdade) chama a camada e repinta', async () => {
  const amb = ambiente({}, { daycare: { 'zelozinha-fila': (({ [HOJE]: _, ...p }) => p)(filaDeExemplo()) } }); await amb.api.abrir();
  const ouvintes = {}, raiz = { innerHTML: '' }, ctx = novoContexto();
  ctx.document = { addEventListener: (ev, fn) => { (ouvintes[ev] = ouvintes[ev] || []).push(fn); }, querySelectorAll: (s) => (s === '[data-z178-raiz="sem"]' ? [raiz] : []), querySelector: () => null, documentElement: { style: {} }, head: null };
  ctx.window = Object.assign(ctx, { pageYOffset: 0, scrollTo: () => {} });
  ctx.ZelozinhaPendencias178.instalar({ api: amb.api, portas: {} });
  const o = ['zeca__tutor-b', 'vac_raiva_p', '2026-11-02', HOJE, 'Zeca', 'Tutor B', '2026-11-01'].map(encodeURIComponent).join('|');
  const b = { disabled: false, textContent: 'Faltou', getAttribute: (n) => ({ 'data-z178-ag': 'faltou', 'data-z178-o': o }[n] || null) };
  ouvintes.click.forEach((fn) => fn({ target: { closest: (s) => (s === '[data-z178-ag]' ? b : null) } }));
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(amb.chamadas.desfazer.length, 1); assert.equal(amb.chamadas.desfazer[0].itemK, 'vac_raiva_p');
  assert.match(raiz.innerHTML, /Faltou no dia combinado \(05\/11\)/, 'a questão voltou, pedindo nova data');
});

/* ============== G. a ligação com a página, rodada com as funções do app trocadas por dublês ============== */
function ligacaoContexto(extra, inicial) {
  const ctx = novoContexto(), db = bancoFalso(inicial || {});
  vm.runInContext(script('zelozinha-agenda'), ctx);
  const chamadas = { espelhar: [], remover: [], conciliar: 0, redesenhar: [], editar: [] };
  const pets = [
    { n: 'Luna', tutor: 'Tutora F', raca: 'Poodle' }, { n: 'Tico', tutor: 'Helena', raca: 'Beagle' }, { n: 'Teca', tutor: 'Helena', raca: 'Beagle' }, { n: 'Mingau', tutor: 'Dora', raca: 'Yorkshire' }, { n: 'Mel', tutor: 'Dora', raca: 'SRD' }
  ];
  const PL = { '2026-11-01': { fim: '2026-11-30', itens: { verm_p: 2, col_p: 1 } } };
  const cad = { 'tico__helena': { plano_cuidados: PL, plano_usos: { verm_p: { '2026-11-02': true }, col_p: { '2026-11-02': true } }, raca: 'Beagle', tutor: 'Helena' }, 'teca__helena': { plano_cuidados: PL, raca: 'Beagle', tutor: 'Helena' }, 'luna__tutora f': { cuidadosNoPlano: true, raca: 'Poodle', tutor: 'Tutora F' } };
  const jsNorm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  Object.assign(ctx, {
    DB: db, CARTEIRA_CARREGADA: true, PELUDINHOS: pets, pelCadCache: cad, jsNorm,
    pelKey: (p) => ((p.n || '') + '__' + (p.tutor || '')).toLowerCase(), dcKey: (n, t) => jsNorm((n || '') + '__' + (t || '')).replace(/[.#$[\]/ ]/g, '-'),
    pelGet: (p, c) => p[c] || '', dashNomePlanilha: (p) => p.n + '/' + p.raca,
    zPainel44Dia: () => HOJE, dashDia: () => HOJE, DASH_DADOS: {}, DASH_DADOS_DE: null, VENC_PEND: {}, DASH_PREV_FICHA: { quando: 5 },
    dashItem: (k) => ({ vet: { col: 'Veterinário', colHora: 'Hora Veterinário', hora: true }, vermifugo: { col: 'Vermifugo' }, carrapaticida: { col: 'Carrapaticida' }, coleira: { col: 'Troca de Coleira' } }[k] || null),
    dashEspelhar: async (k, id, reg, acao, dia) => { chamadas.espelhar.push([k, id, acao, dia, reg.hora]); return { ok: true }; },
    dashRemoverDaPlanilha: async (k, id, reg, dia) => { chamadas.remover.push([k, id, dia]); return { ok: true }; },
    dashPrevFichaConciliar: () => { chamadas.conciliar++; }, dashAtualizarCard: (k, o) => { chamadas.redesenhar.push([k, o.origem]); },
    usuarioAtual: () => ({ monId: 'u1', pessoa: 'Dani' }), pelExtra: (p) => cad[ctx.pelKey(p)] || {},
    vencItensDe: () => [{ k: 'verm_p', vence: '2026-11-04' }], vermAvaliarFicha: () => ({ pesar: false, dose: { rot: '1 COMPRIMIDO E MEIO' } }),
    setPelExtra: async (p, patch) => { cad[ctx.pelKey(p)] = Object.assign({}, cad[ctx.pelKey(p)] || {}, patch); chamadas.ficha = [ctx.pelKey(p), patch]; return { ok: true }; }
  }, extra || {});
  ctx.document = { querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, hidden: false, head: null };
  ctx.window = Object.assign(ctx, { pageYOffset: 0, scrollTo: () => {} });
  vm.runInContext(script('zelozinha-pendencias178-ligacao'), ctx);
  return { ctx, db, chamadas, T: ctx.ZelozinhaPendencias178Tela };
}
const linhaVet = (extra) => Object.assign({ valor: 'Nina/SRD · Vacina múltipla', hora: '', quem: 'x', ts: 1, chave: 'nina__t', planilha_msg: 'aguardando o horário', z178: { dia: HOJE, dcKey: 'nina__t', itemK: 'vac_mult_p', origem: 'bolsa', estado: 'pendente' } }, extra || {});

prova('a ligação carrega sem a tela aberta e entrega a ponte que a fábrica do check-in usa', () => {
  const { ctx, T } = ligacaoContexto();
  assert.ok(T && T.api && T.tela && typeof ctx.zelozinha178LancarPlano === 'function' && typeof ctx.zelozinha178Abrir === 'function');
  assert.equal(typeof T.portas.gravarLinha, 'function');
});

prova('gravar a linha: só se não existir, leva para a planilha pelo caminho do app (o Veterinário só com horário) e atualiza a memória do Lançamento do dia', async () => {
  const { ctx, db, chamadas, T } = ligacaoContexto();
  ctx.DASH_DADOS_DE = { ok: true, dia: HOJE, obj: ctx.DASH_DADOS };
  const ef = { dia: HOJE, item: 'vermifugo', id: 'z178_bolsa_x1', reg: { valor: 'Pipoca/Poodle (1 COMPRIMIDO · NA BOLSA)', hora: '', quem: 'Dani', ts: 1, chave: 'pipoca__c', z178: { estado: 'pendente' } } };
  const a = await T.portas.gravarLinha(ef); assert.deepEqual(json(a), { ok: true, criada: true });
  assert.equal(db.ler(`daycare/dashboard/${HOJE}/vermifugo/z178_bolsa_x1/valor`), ef.reg.valor);
  assert.equal(chamadas.espelhar.length, 1); assert.deepEqual(chamadas.espelhar[0].slice(0, 4), ['vermifugo', 'z178_bolsa_x1', 'lancar', HOJE]);
  assert.equal(ctx.DASH_DADOS.vermifugo.z178_bolsa_x1.valor, ef.reg.valor); assert.deepEqual(chamadas.redesenhar[0], ['vermifugo', 'z178']);
  const b = await T.portas.gravarLinha(Object.assign({}, ef, { reg: Object.assign({}, ef.reg, { valor: 'OUTRO' }) }));
  assert.deepEqual(json(b), { ok: true, criada: false }); assert.equal(db.ler(`daycare/dashboard/${HOJE}/vermifugo/z178_bolsa_x1/valor`), ef.reg.valor, 'não sobrescreve'); assert.equal(chamadas.espelhar.length, 1, 'não leva duas vezes');
  const v = await T.portas.gravarLinha({ dia: HOJE, item: 'vet', id: 'z178_bolsa_v1', reg: linhaVet() }); assert.equal(v.criada, true); assert.equal(chamadas.espelhar.length, 1, 'vacina sem horário não vai para a planilha');
  const vh = await T.portas.gravarLinha({ dia: HOJE, item: 'vet', id: 'z178_loja_v2', reg: linhaVet({ hora: '10:30', planilha_msg: null }) }); assert.equal(vh.criada, true); assert.equal(chamadas.espelhar.length, 2); assert.equal(chamadas.espelhar[1][4], '10:30');
  const sem = ligacaoContexto({ DB: null }); assert.deepEqual(json(await sem.T.portas.gravarLinha(ef)), { ok: false });
});

prova('tirar a linha: sai do Lançamento do dia e da planilha; linha já dada não sai; «Foi dado» marca quem deu e libera a ficha', async () => {
  const { ctx, db, chamadas, T } = ligacaoContexto();
  const cam = (id) => `daycare/dashboard/${HOJE}/vet/${id}`;
  db.gravar(cam('a'), linhaVet({ planilha_ok: true })); db.gravar(cam('b'), linhaVet({ z178: { estado: 'dado' } })); db.gravar(cam('c'), linhaVet());
  assert.deepEqual(json(await T.portas.removerLinha({ dia: HOJE, item: 'vet', id: 'a' })), { ok: true }); assert.equal(db.ler(cam('a')), null); assert.deepEqual(chamadas.remover, [['vet', 'a', HOJE]]);
  assert.deepEqual(json(await T.portas.removerLinha({ dia: HOJE, item: 'vet', id: 'b' })), { ok: false, motivo: 'dado' }); assert.ok(db.ler(cam('b')));
  assert.deepEqual(json(await T.portas.removerLinha({ dia: HOJE, item: 'vet', id: 'c' })), { ok: true }); assert.equal(chamadas.remover.length, 1, 'linha que nunca foi para a planilha não pede para tirar de lá');
  assert.deepEqual(json(await T.portas.removerLinha({ dia: HOJE, item: 'vet', id: 'nao-existe' })), { ok: true }, 'já não existe: o que se queria está feito');
  db.gravar(cam('d'), linhaVet());
  assert.equal(await T.portas.marcarLinha({ dia: HOJE, item: 'vet', id: 'd' }, 'dado'), true);
  const d = db.ler(cam('d')); assert.equal(d.z178.estado, 'dado'); assert.equal(d.z178.feitoPor, 'Dani'); assert.ok(d.z178.feitoEm > 0); assert.equal(chamadas.conciliar, 1, 'a ficha é conferida logo depois do «Foi dado»');
  assert.equal(await T.portas.marcarLinha({ dia: HOJE, item: 'vet', id: 'sumiu' }, 'dado'), false);
  assert.equal(db.ler(cam('sumiu')), null, 'nunca cria linha');
});

prova('horário de uma linha já na planilha: pelo «editar hora» do app, só com o Lançamento do dia aberto e a edição liberada', async () => {
  const feitas = [];
  const { ctx, T } = ligacaoContexto({ dashEditarAbrir: () => true, dashEditarHora: (h) => feitas.push(['hora', h]), dashEditarSalvar: async () => true });
  const sem = await ligacaoEditar(T, ctx, { dia: HOJE, item: 'vet', id: 'a', hora: '15:00' });
  assert.equal(sem.ok, false); assert.match(sem.erro, /Abra o Lançamento do dia de hoje/);
  ctx.DASH_DADOS_DE = { ok: true, dia: HOJE, obj: ctx.DASH_DADOS };
  const ok = await ligacaoEditar(T, ctx, { dia: HOJE, item: 'vet', id: 'a', hora: '15:00' }); assert.equal(ok.ok, true); assert.deepEqual(feitas, [['hora', '15:00']]);
  const nao = ligacaoContexto({ dashEditarAbrir: () => false, dashEditarHora: () => {}, dashEditarSalvar: async () => true }); nao.ctx.DASH_DADOS_DE = { ok: true, dia: HOJE, obj: nao.ctx.DASH_DADOS };
  const r = await ligacaoEditar(nao.T, nao.ctx, { dia: HOJE, item: 'vet', id: 'a', hora: '15:00' }); assert.equal(r.ok, false); assert.match(r.erro, /O horário não foi salvo/);
  const falha = ligacaoContexto({ dashEditarAbrir: () => true, dashEditarHora: () => {}, dashEditarSalvar: async () => false }); falha.ctx.DASH_DADOS_DE = { ok: true, dia: HOJE, obj: falha.ctx.DASH_DADOS };
  const f = await ligacaoEditar(falha.T, falha.ctx, { dia: HOJE, item: 'vet', id: 'a', hora: '15:00' }); assert.equal(f.ok, false); assert.match(f.erro, /A planilha não confirmou a hora/);
});
async function ligacaoEditar(T, ctx, o) {
  /* a ponte é a mesma que o salvarHora usa: a linha já está na planilha, então quem grava é o «editar hora» */
  ctx.DB.gravar(`daycare/dashboard/${o.dia}/${o.item}/${o.id}`, { valor: 'x', hora: '', planilha_ok: true });
  return ctx.ZelozinhaPendencias178.salvarHora({ db: () => ctx.DB, editarHora: T.editarHora, espelhar: undefined }, o);
}

prova('«Agendou para»: agenda pelo módulo que já existe e deixa na marca de qual questão veio (o dia da mensagem)', async () => {
  const { ctx, db, T } = ligacaoContexto();
  const r = await T.portas.agendar({ dc: 'luna__tutora-f', itemK: 'ecto_p', para: '2026-11-09', vence: '2026-11-04', nome: 'Luna', tutor: 'Tutora F', hoje: HOJE, dia: '2026-11-04', por: 'Dani' });
  assert.equal(r.ok, true);
  const a = db.ler('daycare/agendamentos/luna__tutora-f/ecto_p'); assert.equal(a.para, '2026-11-09'); assert.equal(a.qtd, 'PIPETA'); assert.equal(a.pelKey, 'luna__tutora f'); assert.deepEqual(json(a.z178), { dia: '2026-11-04', vence: '2026-11-04' });
  const dom = await T.portas.agendar({ dc: 'luna__tutora-f', itemK: 'verm_p', para: '2026-11-08', hoje: HOJE, dia: HOJE, por: 'Dani' }); assert.equal(dom.ok, false); assert.equal(dom.motivo, 'A Zêluz não abre aos domingos.');
  const sem = await T.portas.agendar({ dc: 'ninguem__t', itemK: 'verm_p', para: '2026-11-09', hoje: HOJE, dia: HOJE, por: 'Dani' }); assert.equal(sem.ok, false); assert.match(sem.motivo, /ficha única/);
  assert.equal((await T.portas.desfazerAgenda({ dc: 'luna__tutora-f', itemK: 'ecto_p' })), true); assert.equal(db.ler('daycare/agendamentos/luna__tutora-f/ecto_p'), null);
  await T.portas.agendar({ dc: 'mel__dora', itemK: 'verm_p', para: '2026-11-09', hoje: HOJE, dia: HOJE, por: 'Dani' });
  assert.equal(await T.portas.marcarAgenda({ dc: 'mel__dora', itemK: 'verm_p' }, 'dado'), true); assert.equal(db.ler('daycare/agendamentos/mel__dora/verm_p/dado/por'), 'Dani');
});

prova('o que a tela lê do app: resposta já registrada no cartão, ficha em dia (ou na dúvida), dose pelo peso, raça', () => {
  const { ctx, T } = ligacaoContexto();
  ctx.VENC_PEND = { '2026-11-03': { 'pipoca__tutor-c': { respostasEscopo49: { porCiclo: { c1: { itemK: 'verm_p', decisao: 'aguardar' }, c2: { itemK: 'ecto_p', decisao: 'autorizar' } } } } } };
  assert.equal(T.portas.respostaAntiga('2026-11-03', 'pipoca__tutor-c', 'verm_p'), 'aguardar'); assert.equal(T.portas.respostaAntiga('2026-11-03', 'pipoca__tutor-c', 'ecto_p'), 'outra'); assert.equal(T.portas.respostaAntiga('2026-11-03', 'pipoca__tutor-c', 'col_p'), ''); assert.equal(T.portas.respostaAntiga('2026-11-02', 'x', 'verm_p'), '');
  assert.equal(T.portas.aindaVence(HOJE, 'luna__tutora-f', 'verm_p', '2026-11-04'), true);
  assert.equal(T.portas.aindaVence(HOJE, 'luna__tutora-f', 'verm_p', '2026-10-01'), false, 'a ficha foi atualizada: a data é outra');
  assert.equal(T.portas.aindaVence(HOJE, 'ninguem__t', 'verm_p', '2026-11-04'), null, 'sem ficha única: na dúvida, continua aberta');
  ctx.CARTEIRA_CARREGADA = false; assert.equal(T.portas.aindaVence(HOJE, 'luna__tutora-f', 'verm_p', '2026-11-04'), null, 'cadastro ainda não carregou');
  ctx.CARTEIRA_CARREGADA = true;
  assert.deepEqual(json(T.portas.precisaDe({ itemK: 'verm_p', dc: 'luna__tutora-f' })), { f: 'comp', n: 1.5, t: '1 e ½ comprimido', v: '1 COMPRIMIDO E MEIO' }); assert.equal(T.portas.precisaDe({ itemK: 'ecto_p', dc: 'luna__tutora-f' }), null);
  ctx.vermAvaliarFicha = () => ({ pesar: true, dose: { rot: '' } }); assert.equal(T.portas.precisaDe({ itemK: 'verm_p', dc: 'luna__tutora-f' }), null, 'peso que pede balança: nenhuma dose inventada');
  assert.equal(T.portas.raca('luna__tutora-f'), 'Poodle'); assert.deepEqual(json(T.portas.pet('luna__tutora-f')), { base: 'Luna/Poodle', chave: 'luna__tutora-f' }); assert.equal(T.portas.pet('ninguem__t'), null);
});

prova('o plano: lista quem tem cuidados pagos no plano de hoje (validade, doses usadas, irmãos juntos) e quem tinha a chave antiga e falta marcar na ficha', () => {
  const { T } = ligacaoContexto();
  const v = T.planoView();
  assert.deepEqual(json(v.fichas.map((f) => [f.pet, f.irmaos, f.ate])), [['Teca', ['Tico'], '30/11/2026'], ['Tico', ['Teca'], '30/11/2026']]);
  assert.deepEqual(json(v.fichas[1].linhas), [{ nome: 'Vermífugo', texto: '1 de 2 doses usadas', acabou: false }, { nome: 'Coleira repelente', texto: '1 de 1 dose usada', acabou: true }]);
  assert.deepEqual(json(v.fichas[0].linhas.map((l) => l.texto)), ['0 de 2 doses usadas', '0 de 1 dose usada']);
  assert.deepEqual(json(v.falta.map((f) => f.pet)), ['Luna']);
  assert.match(v.texto, /^Oi, Dora, tudo bem\? Hoje o Mingau recebe aqui o vermífugo, conforme fechado no plano\./);
  assert.equal(T.planoLigar, undefined, 'não há mais ligar e desligar');
});

prova('lançar o plano pela ponte do check-in: uma linha por cuidado, no Lançamento do dia de hoje', async () => {
  const { db, chamadas, T } = ligacaoContexto();
  const r = await T.lancarPlano({ dia: HOJE, dcKey: 'mingau__dora', nome: 'Mingau', tutor: 'Dora', itens: [{ itemK: 'vac_mult_p', vence: HOJE }, { itemK: 'verm_p', vence: HOJE }] });
  assert.deepEqual(json(r), { ok: true, n: 2 });
  const vet = db.ler(`daycare/dashboard/${HOJE}/vet`), verm = db.ler(`daycare/dashboard/${HOJE}/vermifugo`);
  const l1 = vet[Object.keys(vet)[0]], l2 = verm[Object.keys(verm)[0]];
  assert.equal(l1.valor, 'Mingau/Yorkshire · Vacina múltipla'); assert.equal(l1.z178.origem, 'plano'); assert.equal(l1.quem, 'Zelozinha'); assert.equal(l1.planilha_msg, 'aguardando o horário');
  assert.equal(l2.valor, 'Mingau/Yorkshire (1 COMPRIMIDO E MEIO)'); assert.equal(chamadas.espelhar.length, 1, 'só o vermífugo vai para a planilha agora; a vacina espera o horário');
  const de_novo = await T.lancarPlano({ dia: HOJE, dcKey: 'mingau__dora', nome: 'Mingau', tutor: 'Dora', itens: [{ itemK: 'vac_mult_p', vence: HOJE }, { itemK: 'verm_p', vence: HOJE }] });
  assert.equal(de_novo.ok, true); assert.equal(Object.keys(db.ler(`daycare/dashboard/${HOJE}/vet`)).length, 1, 'o mesmo check-in duas vezes não duplica a linha'); assert.equal(chamadas.espelhar.length, 1);
  assert.equal((await T.lancarPlano({ dia: HOJE, dcKey: 'ninguem__t', itens: [{ itemK: 'verm_p', vence: HOJE }] })).ok, false);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-pendencias178: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
