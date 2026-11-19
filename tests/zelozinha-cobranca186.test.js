'use strict';
// Cobrança do «Vai fazer em casa» (Adriana, 17/11/2026; textos aprovados em 19/11/2026): "Se tiver ainda pendente no próximo dia,
// a Zelozinha precisa mandar mensagem" — no próximo dia em que o FILHOt está de novo na Zêluz, depois do check-in.
// Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const N = require('../zelozinha/simples/nucleo');
const CC = require('../zelozinha/simples/cobranca-casa');
const MU = require('../zelozinha/simples/mensagem-unica41');
const { criarServico } = require('../zelozinha/simples/zelozinha');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }
const json = (v) => JSON.parse(JSON.stringify(v));

/* ---------- banco de mentira (compatível com o app e com o Admin SDK) ---------- */
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
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
function novoContexto() {
  const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
  vm.runInContext(html.slice(ini, fim), ctx);
  vm.runInContext(script('aviso-plano'), ctx);
  vm.runInContext(script('cobranca-casa'), ctx);
  vm.runInContext(script('zelozinha-simples'), ctx);
  vm.runInContext(script('zelozinha-pendencias178'), ctx);
  return ctx;
}

/* ---------- dados inventados ---------- */
const ORIGEM = '2026-11-17', HOJE = '2026-11-20';   // a tutora respondeu na terça; o FILHOt volta na sexta
const TUTOR = 'Tutora Fictícia', NUM = '5531999990000', PK = 'luna__tutora fictícia', DC = N.dcKeyDoPelKey(PK);
const cad = (extra) => Object.assign({ n: 'Luna', tutor: TUTOR, tel: '31999990000' }, extra || {});
const checkin = { tipo: 'entrada', quem: 'Recepção Teste', fim: Date.parse(HOJE + 'T08:10:00-03:00') };
const TEXTO_VERM = ["Olá, Tutora, tudo bem? 💛","","Luna está aqui com a gente hoje, aproveitando o dia. 🐾","Na ficha, o vermífugo ainda aparece em aberto. Se você já fez, é só nos contar o produto e a data, que atualizamos tudo por aqui. 📝","Se a correria não deixou, podemos cuidar disso hoje mesmo, enquanto Luna aproveita o dia. Assim a proteção de Luna fica em dia, e a de todos os nossos Aulunos também.","Podemos fazer hoje? 💛"].join('\n');
const TEXTO_VAC = ["Olá, Tutora, tudo bem? 💛","","Luna está aqui com a gente hoje, aproveitando o dia. 🐾","Na ficha, a vacina antirrábica ainda aparece em aberto. Se já foi aplicada, pode nos enviar uma foto do cartão de vacinação assinado pelo médico-veterinário? 📸","Assim atualizamos tudo por aqui.","Se a correria não deixou, podemos aplicar aqui na Zêluz, com a nossa equipe veterinária. Assim a proteção de Luna fica em dia, e a de todos os nossos Aulunos também.","Quer que a gente agende? 💛"].join('\n');
function itemCobranca(extra) {
  return Object.assign({ v: 1, tipo: 'cobranca', estado: 'pronto', dia: HOJE, dcKey: DC, pelKey: PK, nome: 'Luna', sexo: 'F', tutor: TUTOR, para: NUM,
    texto: TEXTO_VERM, itens: [{ itemK: 'verm_p', vence: ORIGEM }], origem: { dia: ORIGEM, itemK: 'verm_p' }, criadoEm: 1 }, extra || {});
}

/* ================= A. o texto aprovado ================= */
prova('o texto aprovado do vermífugo, do carrapaticida e da coleira Seresto (muda só os nomes e o cuidado)', () => {
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'verm_p' }).texto, TEXTO_VERM);
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'ecto_p' }).texto, TEXTO_VERM.replace('o vermífugo', 'o carrapaticida'));
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'col_p' }).texto, TEXTO_VERM.replace('o vermífugo', 'a coleira Seresto'));
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'verm_dose2_p' }).texto, TEXTO_VERM.replace('o vermífugo', 'a 2ª dose do vermífugo'));
});

prova('o texto aprovado da vacina pede a foto do cartão assinado pelo médico-veterinário e oferece agendar', () => {
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'vac_raiva_p' }).texto, TEXTO_VAC);
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'vac_mult_p' }).texto, TEXTO_VAC.replace('vacina antirrábica', 'vacina múltipla'));
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'vac_gripe_p' }).texto, TEXTO_VAC.replace('vacina antirrábica', 'vacina contra gripe'));
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'vac_raiva_p' }).vacina, true);
});

prova('o tom combinado: formatado em linhas e com emojis leves, sem «em casa», sem «o/a» antes do FILHOt; entrada ruim não vira texto', () => {
  ['verm_p', 'verm_dose2_p', 'ecto_p', 'col_p', 'vac_mult_p', 'vac_gripe_p', 'vac_raiva_p'].forEach((k) => {
    const t = CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: k }).texto;
    assert.ok(/^Olá, Tutora, tudo bem\? 💛\n\nLuna está aqui com a gente hoje, aproveitando o dia\. 🐾\n/.test(t) && /💛$/.test(t), 'formatado em linhas e com emojis (pedido de 19/11): ' + k);
    assert.ok(!/em casa/i.test(t), 'nunca «em casa» (ela achou pesado): ' + k);
    assert.ok(!/\b(o|a) Luna\b/.test(t), 'sem artigo antes do nome: ' + k);
    assert.ok(!/\b(cão|cães|cachorro|dono)\b/i.test(t), 'vocabulário da casa: ' + k);
  });
  assert.equal(CC.gerarCobranca({ nomeTutor: '', nomePeludo: 'Luna', itemK: 'verm_p' }).ok, false);
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: '', itemK: 'verm_p' }).ok, false);
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora', nomePeludo: 'Luna', itemK: 'escova_p' }).ok, false);
  assert.equal(CC.gerarCobranca({ nomeTutor: 'Tutora <b>', nomePeludo: 'Luna', itemK: 'verm_p' }).ok, false, 'nome com símbolo não entra');
});

prova('a cópia do app é idêntica à do serviço; o texto da mensagem do dia (mensagem-unica41) não mudou', () => {
  assert.equal(script('cobranca-casa').replace(/\s+$/, ''), fs.readFileSync(path.resolve(__dirname, '../zelozinha/simples/cobranca-casa.js'), 'utf8').replace(/\s+$/, ''));
  const m = MU.gerarMensagem({ nomeTutor: 'Dora', nomePeludo: 'Mingau', sexo: 'M', dia: '2026-11-02', presencaConfirmada: true, cuidados: [{ itemK: 'verm_p', vence: '2026-11-02' }], veterinariaConfirmada: false });
  assert.match(m.texto, /^Bom dia, Dora! Como você está\? 💛/);
  assert.equal(N.VERSAO, 'simples-7');
});

/* ================= B. o serviço da VPS ================= */
prova('serviço: a cobrança só vale na chave {dcKey}~cobranca e sai sempre sozinha (nunca com irmãos nem com a pergunta)', () => {
  const T0 = Date.parse(HOJE + 'T10:00:00-03:00'), it = itemCobranca();
  assert.equal(N.escolherProximo({ [DC + N.SUFIXO_COBRANCA]: it }, T0).chave, DC + '~cobranca');
  assert.equal(N.escolherProximo({ [DC]: it }, T0), null, 'na chave da pergunta, a cobrança não sai');
  assert.equal(N.escolherProximo({ 'outra__t~cobranca': it }, T0), null, 'na chave de outro FILHOt, não sai');
  const pergunta = Object.assign({}, it, { dcKey: 'tico__t', texto: 'x' }); delete pergunta.tipo;
  const f = { [DC + '~cobranca']: it, 'tico__t': pergunta };
  assert.deepEqual(N.irmaos(f, Object.assign({}, it, { chave: DC + '~cobranca' })), [], 'a cobrança não leva irmão');
  assert.deepEqual(N.irmaos(f, Object.assign({}, pergunta, { chave: 'tico__t' })), [], 'a pergunta não leva a cobrança junto');
});

prova('serviço: confere a cobrança com o banco — texto aprovado com o primeiro nome, questão de um dia anterior, tutor principal e check-in', () => {
  const conf = (item, cadastro) => N.conferirItem({ item, cadastro: cadastro || cad(), checkin, gerar: MU.gerarMensagem, gerarCobranca: CC.gerarCobranca });
  assert.equal(conf(itemCobranca()).ok, true);
  assert.equal(conf(itemCobranca({ texto: TEXTO_VERM.replace('Tutora,', 'Tutora Fictícia,') })).ok, false, 'com sobrenome não sai');
  assert.equal(conf(itemCobranca({ texto: 'Olá, Tutora! Pague a conta de R$ 100,00 agora.' })).motivo, 'O texto não confere com a cobrança aprovada para esta ficha; nada foi enviado.');
  assert.equal(conf(itemCobranca({ origem: { dia: HOJE, itemK: 'verm_p' } })).motivo, 'A cobrança não tem a questão de origem certa; nada foi enviado.', 'questão do mesmo dia não é cobrança');
  assert.equal(conf(itemCobranca({ origem: null })).ok, false);
  assert.equal(conf(itemCobranca({ itens: [{ itemK: 'verm_p' }, { itemK: 'ecto_p' }] })).ok, false, 'um cuidado só');
  assert.equal(conf(itemCobranca(), cad({ tel: '31988887777' })).ok, false, 'o telefone tem de ser o do tutor principal');
  assert.equal(N.conferirItem({ item: itemCobranca(), cadastro: cad(), checkin: null, gerarCobranca: CC.gerarCobranca }).ok, false, 'sem check-in hoje, nada sai');
  assert.equal(N.conferirItem({ item: itemCobranca(), cadastro: cad(), checkin, gerar: MU.gerarMensagem }).ok, false, 'sem o texto aprovado carregado, nada sai');
  const vac = itemCobranca({ texto: TEXTO_VAC, itens: [{ itemK: 'vac_raiva_p', vence: ORIGEM }], origem: { dia: ORIGEM, itemK: 'vac_raiva_p' } });
  assert.equal(conf(vac).ok, true, 'a vacina sai em qualquer dia de envio: é cobrança, não aplicação');
});

prova('serviço de ponta a ponta: a cobrança sai uma vez, sozinha, com o texto aprovado; a pergunta do mesmo tutor sai na sua mensagem', async () => {
  const pergunta = MU.gerarMensagem({ nomeTutor: 'Tutora', nomePeludo: 'Tico', sexo: 'M', dia: HOJE, presencaConfirmada: true, cuidados: [{ itemK: 'ecto_p', vence: HOJE }], veterinariaConfirmada: false }).texto;
  const pk2 = 'tico__tutora fictícia', dc2 = N.dcKeyDoPelKey(pk2);
  const q = { v: 1, estado: 'pronto', dia: HOJE, dcKey: dc2, pelKey: pk2, nome: 'Tico', sexo: 'M', tutor: TUTOR, para: NUM, texto: pergunta, itens: [{ itemK: 'ecto_p', vence: HOJE }], criadoEm: 2 };
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [HOJE]: { [DC + '~cobranca']: itemCobranca(), [dc2]: q } }, cadastro: { [PK]: cad(), [pk2]: cad({ n: 'Tico' }) },
    'checkin-corpo': { [HOJE]: { [DC]: checkin, [dc2]: checkin } } } });
  const enviados = [];
  const evo = { numero: async () => ({ ok: true, jid: NUM + '@s.whatsapp.net' }), enviar: async (jid, texto) => { enviados.push(texto); return { status: 201, corpo: { key: { id: 'X' + enviados.length, remoteJid: jid } } }; }, estado: async () => 'open' };
  let t = Date.parse(HOJE + 'T10:00:00-03:00');
  const sv = criarServico({ db, evo, cfg: N.PADRAO, agora: () => t, aleatorio: () => 0, log: () => {} });
  await sv.trocarDia(HOJE);
  assert.equal(await sv.passo(), 'enviado');
  assert.deepEqual(enviados, [TEXTO_VERM], 'a cobrança sai sozinha, com o texto aprovado');
  let f = db.ler('daycare/zelozinha-fila/' + HOJE);
  assert.equal(f[DC + '~cobranca'].estado, 'enviado'); assert.equal(f[dc2].estado, 'pronto', 'a pergunta do irmão não foi junto');
  t += 8 * 60000; assert.equal(await sv.passo(), 'enviado');
  assert.match(enviados[1], /^Bom dia, Tutora!/); assert.equal(enviados.length, 2);
  t += 8 * 60000; assert.equal(await sv.passo(), 'vazio', 'nada sai duas vezes');
});

prova('serviço: cobrança com texto adulterado fica «Não enviada» sem tocar no WhatsApp; FILHOt que já saiu tem a cobrança cancelada', async () => {
  const db = bancoFalso({ daycare: { 'zelozinha-fila': { [HOJE]: { [DC + '~cobranca']: itemCobranca({ texto: 'Pague agora.' }) } }, cadastro: { [PK]: cad() }, 'checkin-corpo': { [HOJE]: { [DC]: checkin } } } });
  const enviados = [];
  const evo = { numero: async () => { enviados.push('numero'); return { ok: true, jid: NUM + '@s.whatsapp.net' }; }, enviar: async () => { enviados.push('texto'); return { status: 201, corpo: { key: { id: 'X' } } }; }, estado: async () => 'open' };
  const sv = criarServico({ db, evo, cfg: N.PADRAO, agora: () => Date.parse(HOJE + 'T10:00:00-03:00'), aleatorio: () => 0, log: () => {} });
  await sv.trocarDia(HOJE); await sv.passo();
  assert.deepEqual(enviados, []); assert.equal(db.ler('daycare/zelozinha-fila/' + HOJE + '/' + DC + '~cobranca').estado, 'falhou');
  const db2 = bancoFalso({ daycare: { 'zelozinha-fila': { [HOJE]: { [DC + '~cobranca']: itemCobranca() } }, cadastro: { [PK]: cad() }, 'checkin-corpo': { [HOJE]: { [DC]: checkin } },
    'checkout-corpo': { [HOJE]: { [DC]: { tipo: 'saida', fim: Date.parse(HOJE + 'T09:00:00-03:00') } } } } });
  const sv2 = criarServico({ db: db2, evo, cfg: N.PADRAO, agora: () => Date.parse(HOJE + 'T10:00:00-03:00'), aleatorio: () => 0, log: () => {} });
  await sv2.trocarDia(HOJE); assert.equal(await sv2.passo(), 'cancelado'); assert.deepEqual(enviados, []);
});

/* ================= C. o app: montar, ler e decidir quem cobrar ================= */
const ficha = { dcKey: DC, pelKey: PK, nome: 'Luna', sexo: 'F', tutor: TUTOR };
prova('app: montarCobranca põe na fila o texto aprovado, para o tutor principal, na chave {dcKey}~cobranca, lembrando a questão de origem', () => {
  const ZS = novoContexto().ZelozinhaSimples;
  const m = ZS.montarCobranca({ dia: HOJE, ficha, cadastro: cad(), itemK: 'verm_p', vence: ORIGEM, origemDia: ORIGEM });
  assert.equal(m.ok, true);
  assert.deepEqual(json(m.item), json(Object.assign(itemCobranca(), { criadoEm: undefined })));
  assert.equal(ZS.chaveDe(m.item), DC + '~cobranca');
  assert.equal(N.conferirItem({ item: m.item, cadastro: cad(), checkin, gerarCobranca: CC.gerarCobranca }).ok, true, 'o que o app monta, o serviço aceita');
  assert.equal(ZS.montarCobranca({ dia: HOJE, ficha, cadastro: cad(), itemK: 'verm_p', origemDia: HOJE }).ok, false, 'só num dia depois da resposta');
  assert.equal(ZS.montarCobranca({ dia: HOJE, ficha, cadastro: cad({ comunicacaoZelozinha: { modo: 'humano' } }), itemK: 'verm_p', origemDia: ORIGEM }).humano, true, 'ficha com contato humano não recebe');
  assert.equal(ZS.montarCobranca({ dia: HOJE, ficha, cadastro: cad({ tel: '' }), itemK: 'verm_p', origemDia: ORIGEM }).ok, false, 'sem telefone, nada');
  assert.equal(ZS.montarCobranca({ dia: HOJE, ficha, cadastro: cad(), itemK: 'escova_p', origemDia: ORIGEM }).ok, false);
});

const rgEnviado = (dia, dc, nome, itemK) => ({ v: 1, dia, dcKey: dc, nome, tutor: TUTOR, estado: 'enviado', enviadoEm: Date.parse(dia + 'T10:05:00-03:00'), itens: [{ itemK, vence: dia }], texto: 'Texto fictício de ' + nome, para: NUM, criadoEm: 1 });
const regCasa = (dia, dc, itemK, nome) => ({ [dia]: { [dc]: { [itemK]: { v: 1, dia, dcKey: dc, itemK, st: 'aberta', passo: 'casa', prev: 'naoresp', casa: { por: 'Dani', em: 1 }, vence: dia, nome, tutor: TUTOR, rev: 1 } } } });
function cenario(filaHojeExtra) {
  const filaDias = { [ORIGEM]: { [DC]: rgEnviado(ORIGEM, DC, 'Luna', 'verm_p'), 'bob__t': rgEnviado(ORIGEM, 'bob__t', 'Bob', 'ecto_p') }, [HOJE]: Object.assign({}, filaHojeExtra || {}) };
  const regs = Object.assign({}, regCasa(ORIGEM, DC, 'verm_p', 'Luna'));
  return { filaDias, regs };
}
prova('a lista: a cobrança não vira questão nova; ela aparece no cartão da questão de origem (a mais recente vale)', () => {
  const P = novoContexto().ZelozinhaPendencias178;
  const { filaDias, regs } = cenario({ [DC + '~cobranca']: itemCobranca({ estado: 'enviado', enviadoEm: Date.parse(HOJE + 'T10:12:00-03:00') }) });
  filaDias['2026-11-18'] = { [DC + '~cobranca']: itemCobranca({ dia: '2026-11-18', estado: 'cancelado', motivo: 'Saiu antes do envio.' }) };
  const l = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
  assert.ok(!l.abertas.some((c) => /~cobranca/.test(c.dc)), 'nenhuma questão nasce da cobrança');
  const luna = l.abertas.find((c) => c.pet === 'Luna');
  assert.equal(P.grupoDe(luna), 'casa'); assert.equal(luna.cobranca.estado, 'enviado'); assert.equal(luna.cobranca.dia, HOJE); assert.equal(luna.cobranca.texto, TEXTO_VERM);
  assert.equal(l.abertas.find((c) => c.pet === 'Bob').cobranca, undefined, 'quem não tem cobrança não ganha uma');
});

prova('quem a Zelozinha cobra hoje: «Vai fazer em casa» aberto de um dia anterior, com check-in hoje, de segunda a sexta, uma vez por questão', () => {
  const P = novoContexto().ZelozinhaPendencias178;
  const ver = (filaHoje, extra) => { const { filaDias, regs } = cenario(filaHoje); const l = P.listar({ hoje: (extra && extra.hoje) || HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
    return P.cobrancasDoDia({ hoje: (extra && extra.hoje) || HOJE, abertas: l.abertas, presentes: (extra && extra.presentes) || { [DC]: true, 'bob__t': true } }).map((c) => c.pet).join(','); };
  assert.equal(ver({}), 'Luna', 'só quem está em «Vai fazer em casa» (Bob ainda não respondeu)');
  assert.equal(ver({}, { presentes: { 'bob__t': true } }), '', 'sem check-in hoje, não cobra');
  assert.equal(ver({}, { hoje: '2026-11-21' }), '', 'sábado: o serviço não envia, então não entra na fila');
  assert.equal(ver({}, { hoje: ORIGEM }), '', 'no mesmo dia da resposta, não cobra');
  ['enviado', 'enviando', 'conferir', 'falhou'].forEach((st) => {
    assert.equal(ver({ [DC + '~cobranca']: itemCobranca({ estado: st }) }), '', 'já cobrada (' + st + '): não repete');
  });
  assert.equal(ver({ [DC + '~cobranca']: itemCobranca({ estado: 'cancelado' }) }), '', 'hoje já teve uma cobrança: não põe outra no mesmo dia');
  const { filaDias, regs } = cenario({});
  filaDias['2026-11-18'] = { [DC + '~cobranca']: itemCobranca({ dia: '2026-11-18', estado: 'cancelado' }) };
  filaDias['2026-11-19'] = { [DC + '~cobranca']: itemCobranca({ dia: '2026-11-19', estado: 'pronto' }) };
  const l = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
  assert.equal(P.cobrancasDoDia({ hoje: HOJE, abertas: l.abertas, presentes: { [DC]: true } }).map((c) => c.pet).join(','), 'Luna', 'a que não chegou a sair (ficou na fila depois das 13h) volta na próxima vinda');
});

prova('um FILHOt recebe no máximo uma cobrança por dia (a questão mais antiga primeiro)', () => {
  const P = novoContexto().ZelozinhaPendencias178;
  const { filaDias, regs } = cenario({});
  filaDias['2026-11-18'] = { [DC]: rgEnviado('2026-11-18', DC, 'Luna', 'vac_raiva_p') };
  Object.assign(regs, regCasa('2026-11-18', DC, 'vac_raiva_p', 'Luna'));
  const l = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
  const r = P.cobrancasDoDia({ hoje: HOJE, abertas: l.abertas, presentes: { [DC]: true } });
  assert.equal(r.length, 1); assert.equal(r[0].itemK, 'verm_p'); assert.equal(r[0].dia, ORIGEM);
});

prova('a cobrança de hoje que ainda não saiu sai da fila quando a questão fecha (a ficha recebeu a data ou a resposta mudou)', () => {
  const P = novoContexto().ZelozinhaPendencias178;
  const filaHoje = { [DC + '~cobranca']: itemCobranca() };
  const { filaDias, regs } = cenario(filaHoje);
  const aberta = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
  assert.deepEqual(json(P.cobrancasParaCancelar({ abertas: aberta.abertas, filaHoje })), [], 'questão aberta: a cobrança fica');
  const fechou = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => false });
  assert.deepEqual(json(P.cobrancasParaCancelar({ abertas: fechou.abertas, filaHoje })), [DC + '~cobranca'], 'a ficha recebeu a data: sai da fila');
  assert.deepEqual(json(P.cobrancasParaCancelar({ abertas: fechou.abertas, filaHoje: { [DC + '~cobranca']: itemCobranca({ estado: 'enviado' }) } })), [], 'o que já saiu não muda');
});

prova('a tela do cartão: espera a próxima vinda, na fila de hoje, cobrou (com o texto), não saiu e recusada', () => {
  const P = novoContexto().ZelozinhaPendencias178;
  const tela = (filaHoje, extraDias) => { const { filaDias, regs } = cenario(filaHoje); Object.assign(filaDias, extraDias || {}); const l = P.listar({ hoje: HOJE, fila: filaDias, regs, respostaAntiga: () => '', aindaVence: () => true });
    return P.telaSemHTML(Object.assign({ pronto: true, hoje: HOJE }, l), P.novoUI()); };
  assert.match(tela({}), /Na próxima vinda de Luna, depois do check-in, a Zelozinha manda a cobrança sozinha \(segunda a sexta, das 7h às 13h\)\./);
  assert.match(tela({ [DC + '~cobranca']: itemCobranca() }), /A cobrança está na fila de hoje: sai no horário de envio\./);
  const h = tela({ [DC + '~cobranca']: itemCobranca({ estado: 'enviado', enviadoEm: Date.parse(HOJE + 'T10:12:00-03:00') }) });
  assert.match(h, /A Zelozinha cobrou em 20\/11 às 10:12/); assert.ok(h.includes(TEXTO_VERM.replace(/'/g, '&#39;')), 'o texto que saiu aparece no cartão');
  assert.match(h, /Se o tutor autorizar fazer aqui, toque em «Mudar a resposta» e escolha «Autorizou pegar na loja»\./);
  assert.match(tela({ [DC + '~cobranca']: itemCobranca({ estado: 'falhou', motivo: 'Este telefone não tem WhatsApp. Confira o telefone do tutor na ficha.' }) }), /A cobrança de 20\/11 não saiu: Este telefone não tem WhatsApp\..*«Cobrei o tutor»/);
  assert.match(tela({}, { '2026-11-19': { [DC + '~cobranca']: itemCobranca({ dia: '2026-11-19', estado: 'cancelado', motivo: 'Saiu antes do envio.' }) } }), /A cobrança de 19\/11 não chegou a sair \(Saiu antes do envio\)\. Ela sai na próxima vinda de Luna\./);
  assert.ok(!/\b(cão|cães|cachorro|baia|solto)\b/i.test(h), 'vocabulário da casa');
});

prova('a tela da Zelozinha do dia: a cobrança não deixa o FILHOt «Já em dia hoje» nem rouba a posição da pergunta', () => {
  const ctx = novoContexto(), ZS = ctx.ZelozinhaSimples, db = bancoFalso({ daycare: { 'zelozinha-fila': { [HOJE]: { [DC + '~cobranca']: itemCobranca({ estado: 'enviado', enviadoEm: 5 }) } } } });
  ZS.ligar(db, HOJE);
  assert.deepEqual(json(ZS.enviadosHoje(HOJE, {})), [], 'a cobrança fica no cartão da aba «Sem finalização»');
  assert.equal(ZS.posicao(DC), 0);
  ZS.desligar();
});

prova('a página: o texto aprovado vem antes de quem o usa; a ligação dispara a cobrança pelo mapa vivo dos check-ins, só lendo', () => {
  const pos = (id) => html.indexOf('<script id="' + id + '"');
  assert.ok(pos('cobranca-casa') > 0 && pos('cobranca-casa') < pos('zelozinha-simples'), 'o texto vem antes de quem o usa');
  const lig = script('zelozinha-pendencias178-ligacao');
  assert.match(lig, /zMapaVivo\(cob\.caminho,VAGA_COB/); assert.match(lig, /aindaVence\(c\.dia,c\.dc,c\.itemK,c\.vence\)!==true/, 'na dúvida sobre a ficha, não cobra');
  assert.match(lig, /v\.pronto!==true\|\|v\.erro/, 'sem a lista completa, não cancela nem cobra');
  assert.ok(!/\b(alert|confirm|prompt)\(/.test(lig));
  const n = (html.match(/2026-11-19-01/g) || []).length; assert.equal(n, 15, 'versão 2026-11-19-01 em todos os lugares');
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-cobranca186: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
