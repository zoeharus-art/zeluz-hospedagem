'use strict';
// Zelozinha simples (29/out/2026): app (fila no check-in + tela) e serviço da VPS. Dados inventados, sem rede e sem banco.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const N = require('../zelozinha/simples/nucleo');
const { criarServico } = require('../zelozinha/simples/zelozinha');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- banco de mentira (API compat do app e Admin SDK da VPS) ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) }, ouvintes = [];
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function gravar(p, valor) {
    const ks = partes(p), antesPai = ler(ks.slice(0, -1).join('/')) || {};
    let n = raiz;
    let chave = 'v';
    for (const k of ks) { if (!n[chave] || typeof n[chave] !== 'object') n[chave] = {}; n = n[chave]; chave = k; }
    if (valor === null) delete n[chave]; else n[chave] = JSON.parse(JSON.stringify(valor));
    avisar(ks, antesPai);
  }
  function snap(k, v) { return { key: k, val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }; }
  function avisar(ks, antesPai) {
    const pai = ks.slice(0, -1).join('/'), filho = ks[ks.length - 1], agora = ler(pai) || {};
    ouvintes.forEach((o) => {
      if (o.ev === 'value' && (ks.join('/') + '/').startsWith(o.p + '/')) o.fn(snap(partes(o.p).pop(), ler(o.p)));
      if (o.p === pai && o.ev === 'child_added' && !(filho in antesPai) && filho in agora) o.fn(snap(filho, agora[filho]));
      if (o.p === pai && o.ev === 'child_changed' && filho in antesPai && filho in agora) o.fn(snap(filho, agora[filho]));
      if (o.p === pai && o.ev === 'child_removed' && filho in antesPai && !(filho in agora)) o.fn(snap(filho, antesPai[filho]));
    });
  }
  const db = {
    leituras: [],
    ref(p) {
      return {
        once: async () => { db.leituras.push(p); return snap(partes(p).pop(), ler(p)); },
        set: async (v) => gravar(p, v),
        update: async (o) => { Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k])); },
        transaction: async (fn) => { const atual = ler(p), novo = fn(atual); if (novo === undefined) return { committed: false, snapshot: snap(partes(p).pop(), atual) }; gravar(p, novo); return { committed: true, snapshot: snap(partes(p).pop(), novo) }; },
        on: (ev, fn) => { ouvintes.push({ p, ev, fn }); if (ev === 'value') fn(snap(partes(p).pop(), ler(p))); if (ev === 'child_added') { const v = ler(p) || {}; Object.keys(v).forEach((k) => fn(snap(k, v[k]))); } },
        off: (ev, fn) => { for (let i = ouvintes.length - 1; i >= 0; i--) if (ouvintes[i].p === p && ouvintes[i].ev === ev && ouvintes[i].fn === fn) ouvintes.splice(i, 1); }
      };
    },
    ler, gravar
  };
  return db;
}

/* ---------- o módulo do app, rodado como no navegador ---------- */
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini);
assert.ok(ini > 0 && fim > ini, 'o texto aprovado (mensagem-unica41) está na página');
vm.runInContext(html.slice(ini, fim), ctx);
vm.runInContext(script('zelozinha-simples'), ctx);
const ZS = ctx.ZelozinhaSimples, MU = ctx.MensagemUnica41;
const TEL = '(00) 90000-0000', NUM = '5500900000000';
const SEG = '2026-11-02', QUI = '2026-11-05';   // segunda e quinta
const cad = (extra) => Object.assign({ tutor: 'Família Fictícia', tel: TEL }, extra || {});
const ficha = { dcKey: 'filhot-ficticio__familia-ficticia', pelKey: 'filhot-ficticio', nome: 'Paçoca', tutor: 'Família Fictícia', sexo: 'F' };

prova('o tutor principal recebe: Tutor 2 usa tutor2/tel2; sem telefone não há envio', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(ZS.responsavel(cad({ tutorPrinc: 'Tutor 2', tutor2: 'Outra Pessoa', tel2: TEL, tel: '' }), 'X'))), { ok: true, nome: 'Outra Pessoa', telefone: NUM });
  assert.equal(ZS.responsavel(cad(), 'Nome Legado').nome, 'Nome Legado', 'sem tutorPrinc, vale o nome da ficha (como o serviço antigo)');
  assert.equal(ZS.responsavel(cad({ tel: '' })).ok, false);
});

prova('a mensagem é a do texto aprovado, sem mudar uma letra', () => {
  const m = ZS.montar({ dia: SEG, ficha, cadastro: cad({ tutorPrinc: 'Tutor 1' }), prevencoes: [{ itemK: 'verm_p', vence: SEG }, { itemK: 'ecto_p', vence: '2026-10-30' }, { itemK: 'escova_p', vence: SEG }] });
  assert.equal(m.ok, true);
  const esperado = MU.gerarMensagem({ nomeTutor: 'Família Fictícia', nomePeludo: 'Paçoca', sexo: 'F', dia: SEG, presencaConfirmada: true, cuidados: [{ itemK: 'ecto_p', vence: '2026-10-30' }, { itemK: 'verm_p', vence: SEG }], veterinariaConfirmada: false });
  assert.equal(m.item.texto, esperado.texto);
  assert.equal(m.item.para, NUM); assert.equal(m.item.estado, 'pronto');
  assert.deepEqual(m.item.itens.map((x) => x.itemK), ['ecto_p', 'verm_p'], 'a escova fica com a equipe');
});

prova('vacina só com a veterinária confirmada, e nunca na quinta', () => {
  const sem = ZS.montar({ dia: SEG, ficha, cadastro: cad(), prevencoes: [{ itemK: 'vac_mult_p', vence: SEG }, { itemK: 'verm_p', vence: SEG }] });
  assert.equal(sem.ok, true); assert.equal(sem.item.semVacina, true); assert.deepEqual(sem.item.itens.map((x) => x.itemK), ['verm_p']);
  const so = ZS.montar({ dia: SEG, ficha, cadastro: cad(), prevencoes: [{ itemK: 'vac_mult_p', vence: SEG }] });
  assert.equal(so.ok, false); assert.equal(so.vazio, true);
  const com = ZS.montar({ dia: SEG, ficha, cadastro: cad(), veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: SEG }] });
  assert.equal(com.ok, true); assert.match(com.item.texto, /Nossa veterinária está aqui hoje\./);
  const quinta = ZS.montar({ dia: QUI, ficha, cadastro: cad(), veterinariaConfirmada: true, prevencoes: [{ itemK: 'vac_mult_p', vence: QUI }, { itemK: 'verm_p', vence: QUI }] });
  assert.deepEqual(quinta.item.itens.map((x) => x.itemK), ['verm_p']);
});

prova('contato humano na ficha: não entra na fila', () => {
  const m = ZS.montar({ dia: SEG, ficha, cadastro: cad({ comunicacaoZelozinha: { modo: 'humano' } }), prevencoes: [{ itemK: 'verm_p', vence: SEG }] });
  assert.equal(m.ok, false); assert.equal(m.humano, true);
});

prova('a fila não sobrescreve: o segundo check-in do mesmo FILHOt não muda o item', async () => {
  const db = bancoFalso();
  const m = ZS.montar({ dia: SEG, ficha, cadastro: cad(), prevencoes: [{ itemK: 'verm_p', vence: SEG }] });
  assert.equal((await ZS.enfileirar(db, m.item, { criadoEm: 1, criadoPor: 'pessoa' })).criado, true);
  db.gravar(`${ZS.FILA}/${SEG}/${ficha.dcKey}/estado`, 'enviado');
  assert.equal((await ZS.enfileirar(db, m.item, { criadoEm: 2 })).criado, false);
  assert.equal(db.ler(`${ZS.FILA}/${SEG}/${ficha.dcKey}/estado`), 'enviado');
});

prova('a fábrica da ponte: check-in de hoje vira item; falta de telefone avisa a recepção', async () => {
  const db = bancoFalso({ daycare: { cadastro: { 'filhot-ficticio': cad() } } });
  const p = { n: 'Paçoca', tutor: 'Família Fictícia', sexo: 'F' };
  const portas = { peludinhos: () => [p], dcKey: () => ficha.dcKey, pelNome: (x) => x.n };
  const recibo = { dia: SEG, dcKey: ficha.dcKey, nome: 'Paçoca', tutor: 'Família Fictícia' };
  const snapshot = () => ({ ok: true, ficha: { dcKey: ficha.dcKey, pelKey: 'filhot-ficticio', base: { n: 'Paçoca', tutor: 'Família Fictícia' } }, prevencoes: [{ itemK: 'verm_p', dueDate: SEG, care: 'vermifugo' }] });
  const f = ZS.criarFabrica({ db: () => db, hoje: () => SEG, snapshot, veterinaria: async () => false });
  assert.equal((await f.receber(recibo, portas, { monId: 'pessoa' })).status, 'na-fila');
  const it = db.ler(`${ZS.FILA}/${SEG}/${ficha.dcKey}`);
  assert.equal(it.estado, 'pronto'); assert.equal(it.criadoPor, 'pessoa'); assert.match(it.texto, /^Bom dia, Família Fictícia!/);
  assert.equal((await f.receber(Object.assign({}, recibo, { dia: QUI }), portas, {})).status, 'outro-dia');
  const semTel = ZS.criarFabrica({ db: () => bancoFalso({ daycare: { cadastro: { 'filhot-ficticio': cad({ tel: '' }) } } }), hoje: () => SEG, snapshot, veterinaria: async () => false });
  const r = await semTel.receber(recibo, portas, {});
  assert.equal(r.ok, false); assert.equal(r.checkinSaved, true); assert.match(r.motivo, /telefone/);
  const ruim = ZS.criarFabrica({ db: () => db, hoje: () => SEG, snapshot: () => ({ ok: false, motivo: 'cadastro ou vencimentos ainda não carregados' }), veterinaria: async () => false });
  assert.match((await ruim.receber(recibo, portas, {})).motivo, /vencimentos/);
});

prova('a tela: estados do topo, posição na fila, selo do cuidado e «Conferir»', async () => {
  const agora = Date.parse(SEG + 'T08:00:00-03:00');
  const item = (dc, estado, criadoEm, extra) => Object.assign({ v: 1, dia: SEG, dcKey: dc, estado, criadoEm, texto: 'Texto fictício', itens: [{ itemK: 'verm_p', vence: SEG }] }, extra || {});
  const db = bancoFalso();
  ZS.ligar(db, SEG);
  assert.equal(ZS.geral(agora).tipo, 'parada', 'sem sinal de vida = parada (faixa vermelha)');
  assert.match(ZS.textoGeral(ZS.geral(agora), agora).faixa, /ainda não deu sinal de vida/);
  db.gravar(ZS.SAUDE, { vivoEm: agora - 60000, whatsapp: 'open', proximoEm: agora + 4 * 60000 });
  db.gravar(`${ZS.FILA}/${SEG}/a`, item('a', 'enviado', 1, { enviadoEm: agora - 30 * 60000 }));
  db.gravar(`${ZS.FILA}/${SEG}/b`, item('b', 'pronto', 3));
  db.gravar(`${ZS.FILA}/${SEG}/c`, item('c', 'enviando', 2));
  db.gravar(`${ZS.FILA}/${SEG}/d`, item('d', 'conferir', 1, { tentativaEm: agora - 5 * 60000 }));
  const g = ZS.geral(agora);
  assert.equal(g.tipo, 'enviando'); assert.equal(g.cont.total, 4);
  assert.match(ZS.textoGeral(g, agora).html, /próxima em ~4 min/);
  assert.equal(ZS.posicao('c'), 1, 'quem está digitando é o 1º'); assert.equal(ZS.posicao('b'), 2);
  assert.equal(ZS.statusDoCiclo({ dia: SEG, dcKey: 'b' }, { itemK: 'verm_p' }).rotulo, 'NA FILA · 2º');
  assert.match(ZS.statusDoCiclo({ dia: SEG, dcKey: 'a' }, { itemK: 'verm_p' }).rotulo, /^ENVIADA \d\d:\d\d$/);
  assert.equal(ZS.statusDoCiclo({ dia: SEG, dcKey: 'a' }, { itemK: 'ecto_p' }), null, 'cuidado fora da mensagem segue o cartão de antes');
  assert.equal(ZS.statusDoCiclo({ dia: SEG, dcKey: 'a' }, { itemK: 'vac_mult_p' }).rotulo, 'CONTATO HUMANO');
  const card = ZS.cartaoHTML({ dia: SEG, dcKey: 'd' });
  assert.match(card.conf, /data-zs-acao="foi"/); assert.match(card.conf, /data-zs-acao="denovo"/); assert.match(card.msg, /Ver mensagem/);
  assert.equal(ZS.cartaoHTML({ dia: SEG, dcKey: 'b' }).conf, '', 'só o cartão com dúvida pede conferência');
  assert.equal(await ZS.marcar('b', 'foi'), false, '«Foi enviada» não vale para quem está na fila');
  assert.equal(await ZS.marcar('d', 'foi'), true);
  assert.equal(db.ler(`${ZS.FILA}/${SEG}/d`).estado, 'enviado'); assert.equal(db.ler(`${ZS.FILA}/${SEG}/d`).manual, true);
  db.gravar(ZS.CONTROLE, { pausado: true, por: 'Pessoa Fictícia', em: agora });
  assert.equal(ZS.geral(agora).tipo, 'pausada');
  db.gravar(ZS.CONTROLE, { pausado: false });
  db.gravar(ZS.SAUDE + '/whatsapp', 'close');
  assert.equal(ZS.geral(agora).tipo, 'whatsapp');
  db.gravar(ZS.SAUDE + '/whatsapp', 'open');
  assert.equal(ZS.geral(Date.parse('2026-10-31T09:00:00-03:00')).tipo, 'fora', 'sábado é fora do horário');
  assert.equal(ZS.geral(agora + 10 * 60000).tipo, 'parada', 'sinal com mais de 5 min = parada');
  ZS.desligar();
});

prova('a página: a ponte usa a fila simples, o controle antigo saiu e a versão subiu', () => {
  assert.match(html, /root\.ZelozinhaSimples\.criarFabrica\(/);
  assert.ok(!/estado\.api\.receber\(recibo/.test(html), 'o check-in não alimenta mais a fila do piloto59');
  assert.ok(!/data-operacao116/.test(html) && !/ponte121\//.test(html), 'sem o controle que falava com o serviço apagado');
  assert.match(html, /data-zs-estado/); assert.match(html, /data-zs-faixa/); assert.match(html, /data-zs-pausa/);
  assert.match(html, /window\.ZelozinhaSimples\.statusDoCiclo\(c,cy\)/);
  assert.match(html, /window\.ZelozinhaSimples\.ligar\(DB,diaAtual\(\)\)/);
  assert.match(html, /const APP_VERSAO='2026-10-30-01';/);
  assert.equal(html.split('2026-10-30-01').length - 1, 11);
});

/* ---------- o serviço da VPS ---------- */
const JIDT = NUM + '@' + 's.whatsapp' + '.net';
const CFG = N.lerConfig({ banco: { firebaseUrl: 'https://banco-ficticio.invalid', serviceUid: 'uid-ficticio' }, automatico: { evolution: { baseUrl: 'https://canal-ficticio.invalid', apiKey: 'valor-ficticio', instanceName: 'instancia' } } });

prova('configuração: lê o arquivo que já existe na VPS e acusa o que falta', () => {
  assert.equal(CFG.ok, true); assert.equal(CFG.cfg.evolution.instancia, 'instancia'); assert.equal(CFG.cfg.serviceUid, 'uid-ficticio');
  assert.deepEqual(N.lerConfig({}).falta.slice(0, 2), ['firebaseUrl', 'serviceUid']);
});

prova('horário: segunda a sexta, das 7h às 13h de São Paulo', () => {
  assert.equal(N.naJanela(Date.parse(SEG + 'T07:00:00-03:00')), true);
  assert.equal(N.naJanela(Date.parse(SEG + 'T06:59:00-03:00')), false);
  assert.equal(N.naJanela(Date.parse(SEG + 'T13:00:00-03:00')), false);
  assert.equal(N.naJanela(Date.parse('2026-10-31T09:00:00-03:00')), false);
  assert.equal(N.diaSP(Date.parse('2026-11-03T01:00:00Z')), SEG, '22h de segunda em São Paulo ainda é segunda');
  assert.equal(N.proximoIntervalo(0), 180000); assert.equal(N.proximoIntervalo(1), 420000);
  assert.equal(N.digitandoMs(0), 4000); assert.equal(N.digitandoMs(1), 9000);
});

prova('respostas do WhatsApp: dúvida vira Conferir, recusa vira Não enviada', () => {
  assert.deepEqual(N.interpretarNumero({ status: 200, corpo: [{ number: NUM, exists: true, jid: JIDT }] }, NUM), { ok: true, jid: JIDT });
  assert.equal(N.interpretarNumero({ status: 200, corpo: [{ number: NUM, exists: false }] }, NUM).ok, false);
  assert.throws(() => N.interpretarNumero({ status: 500 }, NUM));
  assert.equal(N.interpretarEnvio({ status: 201, corpo: { key: { id: 'm1', remoteJid: JIDT } } }, JIDT).estado, 'enviado');
  assert.equal(N.interpretarEnvio({ erro: true }, JIDT).estado, 'conferir');
  assert.equal(N.interpretarEnvio({ status: 502 }, JIDT).estado, 'conferir');
  assert.equal(N.interpretarEnvio({ status: 201, corpo: {} }, JIDT).estado, 'conferir');
  assert.equal(N.interpretarEnvio({ status: 400 }, JIDT).estado, 'falhou');
});

function evoFalso(op) {
  const e = { envios: [], numeros: 0, op: op || {} };
  e.numero = async (n) => { e.numeros++; if (e.op.numeroFalha) throw Error('fora do ar'); return { ok: true, jid: n + '@' + 's.whatsapp' + '.net' }; };
  e.enviar = async (jid, t, d) => { e.envios.push({ jid, t, d }); return e.op.envio || { status: 201, corpo: { key: { id: 'msg-' + e.envios.length, remoteJid: jid } } }; };
  e.estado = async () => 'open';
  return e;
}
const MSv = require('../zelozinha/simples/mensagem-unica41');
const K = (dc) => N.dcKeyDoPelKey('filhot ' + dc + '__família fictícia');
function itemS(dc, criadoEm, extra) {
  const it = { v: 1, dia: SEG, dcKey: K(dc), pelKey: 'filhot ' + dc + '__família fictícia', nome: 'FILHOt ' + dc.toUpperCase(), sexo: '', tutor: 'Família Fictícia', para: NUM, itens: [{ itemK: 'verm_p', vence: SEG }], estado: 'pronto', criadoEm };
  it.texto = MSv.gerarMensagem({ nomeTutor: 'Família Fictícia', nomePeludo: it.nome, dia: SEG, presencaConfirmada: true, cuidados: it.itens }).texto;
  return Object.assign(it, extra || {});
}
/* o banco de mentira do serviço: a fila, a ficha e o check-in de cada FILHOt da fila */
function bancoServico(itens, extra) {
  const filaDia = {}, cadastro = {}, checkin = {};
  itens.forEach((it) => { filaDia[it.dcKey] = it; cadastro[it.pelKey] = cad(); checkin[it.dcKey] = { tipo: 'entrada', quem: 'Pessoa Fictícia', fim: Date.parse(SEG + 'T07:30:00-03:00') }; });
  const d = { 'zelozinha-fila': { [SEG]: filaDia }, cadastro, 'checkin-corpo': { [SEG]: checkin } };
  Object.keys(extra || {}).forEach((k) => { d[k] = Object.assign(d[k] || {}, extra[k]); });
  return bancoFalso({ daycare: d });
}

prova('a chave do FILHOt sai da chave da ficha do mesmo jeito que no app', () => {
  const pegar = (re) => { const m = html.match(re); assert.ok(m, String(re)); return m[0]; };
  const f = new Function(pegar(/function jsNorm\(s\)\{[^\n]*\}/) + '\n' + pegar(/function pelKey\(p\)\{[^\n]*\}/) + '\n' + pegar(/function dcKey\(name,tutor\)\{[^\n]*\}/) + '\nreturn {pelKey,dcKey};')();
  [['Paçoca', 'Família Fictícia'], ['Dr. Bóris', 'Ana  Maria / Zé'], ['Mel#1', 'Joana [Tutor] $'], ['ÍCARO', 'jo.ão']].forEach(([n, tutor]) => {
    assert.equal(N.dcKeyDoPelKey(f.pelKey({ n, tutor })), f.dcKey(n, tutor), n + ' / ' + tutor);
  });
});

prova('o serviço usa uma cópia idêntica do texto aprovado do app', () => {
  const copia = fs.readFileSync(path.resolve(__dirname, '../zelozinha/simples/mensagem-unica41.js'), 'utf8');
  assert.equal(copia.replace(/\s+$/, ''), html.slice(ini, fim).replace(/\s+$/, ''), 'zelozinha/simples/mensagem-unica41.js tem de ser igual ao bloco do app');
});

prova('serviço não confia na fila: texto mexido, telefone trocado ou sem check-in não sai', () => {
  const base = itemS('a', 1), gerar = MSv.gerarMensagem, ck = { tipo: 'entrada', quem: 'Pessoa', fim: 1 };
  assert.equal(N.conferirItem({ item: base, cadastro: cad(), checkin: ck, gerar }).ok, true);
  assert.match(N.conferirItem({ item: Object.assign({}, base, { texto: base.texto + ' Promoção!' }), cadastro: cad(), checkin: ck, gerar }).motivo, /texto aprovado/);
  assert.match(N.conferirItem({ item: Object.assign({}, base, { para: '5500911111111' }), cadastro: cad(), checkin: ck, gerar }).motivo, /telefone/);
  assert.match(N.conferirItem({ item: base, cadastro: cad(), checkin: null, gerar }).motivo, /check-in/);
  assert.match(N.conferirItem({ item: Object.assign({}, base, { nome: 'X\nLinha extra' }), cadastro: cad(), checkin: ck, gerar }).motivo, /nome/);
  assert.match(N.conferirItem({ item: Object.assign({}, base, { pelKey: 'outro filhot__outra família' }), cadastro: cad(), checkin: ck, gerar }).motivo, /ficha não corresponde/);
  const outroNome = Object.assign({}, base, { nome: 'Rex' });
  outroNome.texto = MSv.gerarMensagem({ nomeTutor: 'Família Fictícia', nomePeludo: 'Rex', dia: SEG, presencaConfirmada: true, cuidados: base.itens }).texto;
  assert.match(N.conferirItem({ item: outroNome, cadastro: cad(), checkin: ck, gerar }).motivo, /nome do FILHOt não confere/);
  assert.equal(N.conferirItem({ item: outroNome, cadastro: cad({ n: 'Rex' }), checkin: ck, gerar }).ok, true, 'FILHOt renomeado na ficha passa pelo nome gravado nela');
  assert.equal(N.escolherProximo({ 'chave-errada': base }), null, 'item fora da sua chave não sai');
});

prova('serviço: um de cada vez, com «digitando…», e o próximo só depois do intervalo', async () => {
  let t = Date.parse(SEG + 'T08:00:00-03:00');
  const db = bancoServico([itemS('a', 2), itemS('b', 1)]);
  const evo = evoFalso();
  const s = criarServico({ db, evo, cfg: CFG.cfg, agora: () => t, aleatorio: () => 0.5 });
  await s.iniciar();
  assert.equal(db.ler(N.SAUDE).whatsapp, 'open'); assert.equal(db.ler(N.SAUDE).versao, N.VERSAO);
  assert.equal(await s.passo(), 'enviado');
  assert.equal(evo.envios[0].t, itemS('b', 1).texto, 'quem entrou primeiro sai primeiro');
  assert.equal(evo.envios[0].d, 6500); assert.equal(evo.envios[0].jid, JIDT);
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).estado, 'enviado'); assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).msgId, 'msg-1');
  t += 60000; assert.equal(await s.passo(), 'esperando', 'o intervalo ainda não passou');
  t += 4 * 60000; assert.equal(await s.passo(), 'enviado');
  assert.equal(evo.envios.length, 2);
  t += 10 * 60000; assert.equal(await s.passo(), 'vazio');
});

prova('serviço: sem resposta do WhatsApp vira Conferir e nunca é reenviado sozinho', async () => {
  let t = Date.parse(SEG + 'T09:00:00-03:00');
  const db = bancoServico([itemS('a', 1)]);
  const evo = evoFalso({ envio: { erro: true } });
  const s = criarServico({ db, evo, cfg: CFG.cfg, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'conferir');
  t += 60 * 60000; assert.equal(await s.passo(), 'vazio');
  assert.equal(evo.envios.length, 1);
});

prova('serviço: quem saiu antes do envio é cancelado; pausa e fora do horário não mandam', async () => {
  let t = Date.parse(SEG + 'T10:00:00-03:00');
  const db = bancoServico([itemS('a', 1), itemS('b', 2)], { 'checkout-corpo': { [SEG]: { [K('a')]: { tipo: 'saida', fim: t - 1000 } } } });
  const evo = evoFalso();
  const s = criarServico({ db, evo, cfg: CFG.cfg, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'cancelado'); assert.equal(evo.envios.length, 0);
  db.gravar(N.CONTROLE, { pausado: true });
  assert.equal(await s.passo(), 'esperando');
  db.gravar(N.CONTROLE, { pausado: false });
  t = Date.parse(SEG + 'T13:30:00-03:00'); assert.equal(await s.passo(), 'esperando');
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).estado, 'pronto');
});

prova('serviço: reinício no meio do envio manda o item para Conferir; número fora do ar tenta de novo depois', async () => {
  let t = Date.parse(SEG + 'T11:00:00-03:00');
  const db = bancoServico([itemS('a', 1, { estado: 'enviando' }), itemS('b', 2)], { 'zelozinha-saude': { vps: { ultimoEnvioEm: t - 60000 } } });
  const evo = evoFalso({ numeroFalha: true });
  const s = criarServico({ db, evo, cfg: CFG.cfg, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('a')}`).estado, 'conferir');
  assert.equal(await s.passo(), 'esperando', 'o reinício respeita o intervalo do último envio');
  t += 3 * 60000; assert.equal(await s.passo(), 'numero-depois');
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).estado, 'pronto'); assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).tentativasNumero, 1);
  t += 61000; await s.passo(); t += 61000; await s.passo();
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('b')}`).estado, 'falhou', 'três tentativas sem confirmar o número: Não enviada');
  assert.equal(evo.envios.length, 0);
});


prova('serviço: item que não confere com o banco vira Não enviada, sem tocar no WhatsApp', async () => {
  const t = Date.parse(SEG + 'T08:30:00-03:00');
  const db = bancoServico([itemS('a', 1, { texto: 'Mensagem que ninguém aprovou' })]);
  const evo = evoFalso();
  const s = criarServico({ db, evo, cfg: CFG.cfg, agora: () => t, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(await s.passo(), 'recusado');
  assert.equal(db.ler(`${N.FILA}/${SEG}/${K('a')}`).estado, 'falhou');
  assert.equal(evo.envios.length, 0); assert.equal(evo.numeros, 0);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-simples166: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
