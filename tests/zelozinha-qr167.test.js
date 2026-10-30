'use strict';
// Zelozinha: reconexão do WhatsApp por QR (30/out/2026). Serviço e tela, com banco e WhatsApp de mentira e dados inventados.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const N = require('../zelozinha/simples/nucleo');
const { criarServico } = require('../zelozinha/simples/zelozinha');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- banco de mentira (a mesma API do Admin SDK e do app) ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) }, ouvintes = [];
  const partes = (p) => p.split('/').filter(Boolean);
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : JSON.parse(JSON.stringify(n)); }
  function snap(k, v) { return { key: k, val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }; }
  function gravar(p, valor) {
    const ks = partes(p); let n = raiz, chave = 'v';
    for (const k of ks) { if (!n[chave] || typeof n[chave] !== 'object') n[chave] = {}; n = n[chave]; chave = k; }
    if (valor === null) delete n[chave]; else n[chave] = JSON.parse(JSON.stringify(valor));
    ouvintes.slice().forEach((o) => { if (o.ev === 'value' && ((ks.join('/') + '/').startsWith(o.p + '/') || (o.p + '/').startsWith(ks.join('/') + '/'))) o.fn(snap(partes(o.p).pop(), ler(o.p))); });
  }
  const db = {
    gravacoes: [],
    ref(p) {
      return {
        once: async () => snap(partes(p).pop(), ler(p)),
        set: async (v) => { db.gravacoes.push(p); gravar(p, v); },
        update: async (o) => { db.gravacoes.push(p); Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k])); },
        transaction: async (fn) => { const atual = ler(p), novo = fn(atual); if (novo === undefined) return { committed: false }; gravar(p, novo); return { committed: true }; },
        on: (ev, fn) => { ouvintes.push({ p, ev, fn }); if (ev === 'value') fn(snap(partes(p).pop(), ler(p))); if (ev === 'child_added') { const v = ler(p) || {}; Object.keys(v).forEach((k) => fn(snap(k, v[k]))); } },
        off: (ev, fn) => { for (let i = ouvintes.length - 1; i >= 0; i--) if (ouvintes[i].p === p && ouvintes[i].ev === ev && ouvintes[i].fn === fn) ouvintes.splice(i, 1); }
      };
    },
    ouvindo: (p) => ouvintes.some((o) => o.p === p),
    ler, gravar
  };
  return db;
}

/* ---------- WhatsApp de mentira ---------- */
const ZELUZ = '5500900000001', OUTRO = '5500900000002';
const PNG = (n) => 'data:image/png;base64,' + Buffer.from('qr-ficticio-' + n).toString('base64');
function evoFalso() {
  const e = { state: 'open', numeroConectado: ZELUZ, donoFalha: false, qrs: 0, saidas: 0, estados: 0, envios: [], codigo: 'c1' };
  e.estado = async () => { e.estados++; return e.state; };
  e.dono = async () => (e.donoFalha ? { ok: false } : { ok: true, numero: e.numeroConectado });
  e.qr = async () => { e.qrs++; return e.state === 'open' ? { ok: false, conectado: true } : { ok: true, base64: PNG(e.codigo), code: e.codigo }; };
  e.sair = async () => { e.saidas++; e.state = 'close'; return true; };
  e.numero = async (n) => ({ ok: true, jid: n + '@' + 's.whatsapp' + '.net' });
  e.enviar = async (jid, t) => { e.envios.push(t); return { status: 201, corpo: { key: { id: 'msg-' + e.envios.length, remoteJid: jid } } }; };
  return e;
}
const SEG = '2026-11-02';
const BASE = { banco: { firebaseUrl: 'https://banco-ficticio.invalid', serviceUid: 'uid-ficticio' }, automatico: { evolution: { baseUrl: 'https://canal-ficticio.invalid', apiKey: 'valor-ficticio', instanceName: 'instancia' } } };
const comNumero = (n) => { const b = JSON.parse(JSON.stringify(BASE)); b.automatico.evolution.numeroZeluz = n; return N.lerConfig(b).cfg; };
const MSv = require('../zelozinha/simples/mensagem-unica41');
const K = (dc) => N.dcKeyDoPelKey('filhot ' + dc + '__família fictícia');
function bancoComUmItem() {
  const it = { v: 1, dia: SEG, dcKey: K('a'), pelKey: 'filhot a__família fictícia', nome: 'FILHOt A', sexo: '', tutor: 'Família Fictícia', para: '5500900000000', itens: [{ itemK: 'verm_p', vence: SEG }], estado: 'pronto', criadoEm: 1 };
  it.texto = MSv.gerarMensagem({ nomeTutor: 'Família Fictícia', nomePeludo: it.nome, dia: SEG, presencaConfirmada: true, cuidados: it.itens }).texto;
  return bancoFalso({ daycare: { 'zelozinha-fila': { [SEG]: { [it.dcKey]: it } }, cadastro: { [it.pelKey]: { tutor: 'Família Fictícia', tel: '(00) 90000-0000' } },
    'checkin-corpo': { [SEG]: { [it.dcKey]: { tipo: 'entrada', quem: 'Pessoa Fictícia', fim: Date.parse(SEG + 'T07:30:00-03:00') } } } } });
}
const T8 = Date.parse(SEG + 'T08:00:00-03:00');

prova('configuração: o número da Zêluz é opcional e fica só com os dígitos', () => {
  assert.equal(comNumero('+55 (00) 9 0000-0001').evolution.numeroZeluz, ZELUZ);
  assert.equal(comNumero('123').evolution.numeroZeluz, '', 'número curto demais não liga o QR');
  assert.equal(N.lerConfig(BASE).cfg.evolution.numeroZeluz, '');
  assert.equal(N.lerConfig(BASE).ok, true, 'sem o número a configuração continua válida');
});

prova('decisões: duas checagens fora do ar mostram o QR; respostas do WhatsApp lidas com cuidado', () => {
  assert.deepEqual(N.passoConexao('close', 0), { fora: 1, buscarQr: false });
  assert.deepEqual(N.passoConexao('connecting', 1), { fora: 2, buscarQr: true });
  assert.deepEqual(N.passoConexao('open', 5), { fora: 0, buscarQr: false });
  assert.deepEqual(N.interpretarQr({ status: 200, corpo: { base64: PNG(1), code: 'abc' } }), { ok: true, base64: PNG(1), code: 'abc' });
  assert.equal(N.interpretarQr({ status: 200, corpo: { instance: { state: 'open' } } }).conectado, true);
  assert.equal(N.interpretarQr({ status: 200, corpo: { base64: 'javascript:alert(1)', code: 'abc' } }).ok, false, 'só imagem PNG passa');
  assert.equal(N.interpretarQr({ status: 500 }).ok, false);
  const jid = (n) => n + ':7@' + 's.whatsapp' + '.net';
  assert.deepEqual(N.interpretarDono({ status: 200, corpo: [{ name: 'outra', ownerJid: jid(OUTRO) }, { name: 'instancia', ownerJid: jid(ZELUZ) }] }, 'instancia'), { ok: true, numero: ZELUZ });
  assert.equal(N.interpretarDono({ status: 200, corpo: [{ name: 'instancia' }] }, 'instancia').ok, false, 'sem ownerJid não dá para conferir');
  assert.equal(N.numeroCerto({ ok: true, numero: ZELUZ }, ZELUZ), true);
  assert.equal(N.numeroCerto({ ok: true, numero: OUTRO }, ZELUZ), false);
  assert.equal(N.numeroCerto({ ok: true, numero: ZELUZ }, ''), false);
});

prova('serviço sem o número da Zêluz: não mostra QR, mas as mensagens esperam o WhatsApp voltar', async () => {
  const db = bancoComUmItem(), evo = evoFalso(); evo.state = 'close';
  const s = criarServico({ db, evo, cfg: N.lerConfig(BASE).cfg, agora: () => T8, aleatorio: () => 0 });
  await s.iniciar(); await s.conexao(); await s.conexao();
  assert.equal(db.ler(N.QR), null); assert.equal(evo.qrs, 0);
  assert.equal(db.ler(N.SAUDE).whatsapp, 'close');
  assert.equal(await s.passo(), 'esperando'); assert.equal(evo.envios.length, 0);
});

prova('serviço: caiu, mostra o QR; troca quando o código muda; volta com o celular da Zêluz e apaga o QR', async () => {
  const db = bancoComUmItem(), evo = evoFalso(); evo.state = 'close';
  const s = criarServico({ db, evo, cfg: comNumero(ZELUZ), agora: () => T8, aleatorio: () => 0 });
  await s.iniciar();                                   // primeira checagem fora do ar: ainda sem QR
  assert.equal(db.ler(N.QR), null);
  await s.conexao();                                   // segunda: QR gravado
  assert.equal(db.ler(N.QR).base64, PNG('c1')); assert.equal(typeof db.ler(N.QR).em, 'number');
  const gravacoes = db.gravacoes.filter((p) => p === N.QR).length;
  await s.conexao();
  assert.equal(db.gravacoes.filter((p) => p === N.QR).length, gravacoes, 'o mesmo código não é gravado de novo');
  evo.codigo = 'c2'; await s.conexao();
  assert.equal(db.ler(N.QR).base64, PNG('c2'));
  assert.equal(await s.passo(), 'esperando'); assert.equal(evo.envios.length, 0);
  evo.state = 'open'; await s.conexao();
  assert.equal(db.ler(N.QR), null, 'conectado: o QR some do banco');
  assert.equal(db.ler(N.SAUDE).whatsapp, 'open');
  assert.equal(await s.passo(), 'enviado'); assert.equal(evo.envios.length, 1);
});

prova('serviço: outro celular conectado é desconectado na hora e nada sai', async () => {
  const db = bancoComUmItem(), evo = evoFalso(); evo.numeroConectado = OUTRO;
  const logs = [];
  const s = criarServico({ db, evo, cfg: comNumero(ZELUZ), agora: () => T8, aleatorio: () => 0, log: (...a) => logs.push(a.join(' ')) });
  await s.iniciar();
  assert.equal(evo.saidas, 1); assert.equal(db.ler(N.SAUDE).whatsapp, 'numero-errado');
  assert.equal(await s.passo(), 'esperando'); assert.equal(evo.envios.length, 0);
  assert.ok(logs.every((l) => !l.includes(OUTRO) && !l.includes(ZELUZ)), 'o registro não guarda número');
  await s.conexao(); await s.conexao();
  assert.ok(db.ler(N.QR), 'depois de desconectar, o QR volta para alguém conectar o certo');
  assert.equal(db.ler(N.SAUDE).whatsapp, 'numero-errado', 'o aviso fica até o celular da Zêluz conectar');
  evo.numeroConectado = ZELUZ; evo.state = 'open'; await s.conexao();
  assert.equal(db.ler(N.SAUDE).whatsapp, 'open'); assert.equal(db.ler(N.QR), null);
  assert.equal(await s.passo(), 'enviado');
});

prova('serviço: sem conseguir conferir o número, não envia; «Já escaneei» faz conferir na hora', async () => {
  const db = bancoComUmItem(), evo = evoFalso(); evo.donoFalha = true;
  const s = criarServico({ db, evo, cfg: comNumero(ZELUZ), agora: () => T8, aleatorio: () => 0 });
  await s.iniciar();
  assert.equal(db.ler(N.SAUDE).whatsapp, 'desconhecido'); assert.equal(await s.passo(), 'esperando');
  evo.donoFalha = false; const antes = evo.estados;
  db.gravar(N.RECONEXAO, { por: 'Pessoa Fictícia', em: T8 });
  await s.conexao();
  assert.ok(evo.estados > antes, 'a gravação do app disparou uma checagem');
  assert.equal(db.ler(N.SAUDE).whatsapp, 'open');
});

/* ---------- a tela ---------- */
function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
ctx.window = ctx; ctx.globalThis = ctx;
let pessoa = { papel: 'consultora', nome: 'Pessoa Fictícia' };
ctx.usuarioAtual = () => pessoa;
vm.createContext(ctx);
vm.runInContext(script('zelozinha-simples'), ctx);
const ZS = ctx.ZelozinhaSimples;
const agoraTela = Date.parse(SEG + 'T09:00:00-03:00');

prova('tela: consultora vê o QR e reconecta; quem chama a equipe é o monitor', async () => {
  const db = bancoFalso({ daycare: { 'zelozinha-saude': { vps: { vivoEm: agoraTela, whatsapp: 'close' } }, 'zelozinha-qr': { vps: { base64: PNG('t1'), em: 1 } } } });
  pessoa = { papel: 'consultora', nome: 'Pessoa Fictícia' };
  ZS.ligar(db, SEG);
  assert.equal(ZS.podeReconectar(), true);
  assert.ok(db.ouvindo(ZS.QR), 'quem pode reconectar escuta o QR');
  const g = ZS.geral(agoraTela);
  assert.equal(g.tipo, 'whatsapp');
  assert.match(ZS.textoGeral(g, agoraTela).faixa, /esperando na fila\.$/);
  const cartao = ZS.cartaoQrHTML(g);
  assert.ok(cartao.includes('src="' + PNG('t1') + '"')); assert.match(cartao, /Já escaneei/); assert.match(cartao, /Use só o celular da Zêluz/);
  assert.equal(await ZS.jaEscaneei(), true);
  assert.equal(db.ler(ZS.RECONEXAO).por, 'Pessoa Fictícia');
  assert.match(ZS.cartaoQrHTML(g), /Conectando…/);
  db.gravar(ZS.SAUDE + '/whatsapp', 'open');
  assert.match(ZS._vivo.ok.texto, /^WhatsApp reconectado por Pessoa Fictícia às \d{2}:\d{2}/);
  assert.equal(db.ouvindo(ZS.QR), false, 'conectado: a tela para de baixar o QR');
  ZS.desligar();

  pessoa = { papel: 'monitor', nome: 'Outra Pessoa' };
  const db2 = bancoFalso({ daycare: { 'zelozinha-saude': { vps: { vivoEm: agoraTela, whatsapp: 'close' } } } });
  ZS.ligar(db2, SEG);
  assert.equal(ZS.podeReconectar(), false); assert.equal(db2.ouvindo(ZS.QR), false, 'monitor não baixa o QR');
  assert.match(ZS.textoGeral(ZS.geral(agoraTela), agoraTela).faixa, /Chame a consultora, a supervisora ou a diretoria para reconectar\./);
  assert.equal(await ZS.jaEscaneei(), false);
  ZS.desligar();
});

prova('tela: número errado tem aviso próprio; QR que não é imagem não aparece; papéis com acento valem', () => {
  pessoa = { papel: 'Supervisão', nome: 'Pessoa Fictícia' };
  const db = bancoFalso({ daycare: { 'zelozinha-saude': { vps: { vivoEm: agoraTela, whatsapp: 'numero-errado' } }, 'zelozinha-qr': { vps: { base64: 'javascript:alert(1)' } } } });
  ZS.ligar(db, SEG);
  assert.equal(ZS.podeReconectar(), true);
  const g = ZS.geral(agoraTela);
  assert.match(ZS.textoGeral(g, agoraTela).faixa, /não é o da Zêluz.*nada foi enviado\. Conecte de novo com o celular da Zêluz\./);
  const cartao = ZS.cartaoQrHTML(g);
  assert.ok(!/<img/.test(cartao) && !/javascript/.test(cartao), 'só imagem PNG vira QR');
  assert.match(cartao, /Gerando o código/);
  assert.ok(/data-zs-ja disabled/.test(cartao), 'sem código, não dá para dizer que escaneou');
  ZS.desligar();
});

prova('página: o cartão do QR está na tela da Zelozinha e a pausa continua só com Diretoria e Supervisão', () => {
  assert.match(html, /<section class="zs-wa-cartao" data-zs-qr/);
  assert.match(html, /<div class="zs-wa-ok" data-zs-wa-ok/);
  assert.match(html, /var PODE_PAUSAR=\{diretoria:1,supervisor:1,supervisao:1\};/);
  const trecho = script('zelozinha-simples').split("if(g.tipo==='whatsapp'){")[1].split("if(g.tipo==='pausada')")[0];
  assert.ok(!/Avise a TI/.test(trecho), 'com o WhatsApp fora, a tela não manda mais «avisar a TI»');
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-qr167: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
