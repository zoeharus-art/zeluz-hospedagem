'use strict';
/*
 * PROVA: pernoite lançada aparece no Plantão sem check-in, e a noite da ficha é a do relógio (Adriana, 27/nov/2026).
 *
 * «Quando o peludo fica de pernoite [...] a gente fixou esses dias lá, mas ele não está aparecendo no final do dia
 *  para a monitora [...] eu não tenho que fazer check-in dele, mas ele tem que aparecer.»
 * «Ela entrou hoje, colocou que ela deu o remédio à noite, que ela deu o jantar. Amanhã de manhã ela tem que
 *  passar o relatório como foi a noite, entrando nesse mesmo quadradinho [...] ela dá continuidade.»
 * «Na ficha possa vir destacado o que é o almoço, o que é o café, o que é o jantar, se ele tem medicamento.»
 *
 * 1) A pernoite «aguardando» de daycare/pernoites/{noite} entra em Hóspedes de hoje (com a ficha do Day Care); a
 *    cancelada e a de check-in feito não; a de ontem aparece de manhã até 11h30 e some depois.
 * 2) Das 18h50 em diante a ficha de hoje abre o Relatório da Noite que COMEÇA (gravado no dia seguinte); de manhã
 *    e à tarde, o da noite que terminou hoje; dia escolhido à mão, o daquele dia; tela presa em ontem depois da
 *    meia-noite, o de hoje.
 * 3) O que se marca de noite vira rascunho (relatorios-rascunho) e volta ao abrir a ficha; o relatório assinado manda.
 * 4) O destaque no topo da ficha mostra só o plantão da hora: de noite o jantar e o remédio da noite.
 * App real no Chromium, sem rede; o banco é de mentira. Dados inventados.
 * Uso:  node tests/plantao-noite-pernoite198.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

// Prepara a página no horário pedido e devolve o que a prova precisa olhar.
async function rodar(b, quando, corpo, arg) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; // «prevSecVirar» já falha no app publicado ao abrir pelo arquivo (o ontoggle dos <details open> corre antes do script): não é desta mudança.
  p.on('pageerror', (e) => { const m = String(e.message || e); if (!/prevSecVirar is not defined/.test(m)) erros.push(m); });
  await p.clock.install({ time: new Date(quando) });
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.split(path.sep).join('/'));
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    // Banco de mentira: lê e grava num objeto; guarda o que foi gravado.
    window.__dados = {}; window.__grav = [];
    const val = (c) => c.split('/').filter(Boolean).reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), window.__dados);
    const por = (c, v) => { const ks = c.split('/').filter(Boolean); let o = window.__dados; ks.slice(0, -1).forEach((k) => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
    const snap = (c) => ({ val: () => { const v = val(c); return v == null ? null : JSON.parse(JSON.stringify(v)); }, exists: () => val(c) != null, forEach() {}, key: c.split('/').pop() });
    const ref = (c) => { const x = {
      key: c.split('/').pop(),
      once: () => Promise.resolve(snap(c)),
      on() { return () => {}; }, off() {},
      set: (v) => { window.__grav.push({ op: 'set', c, v }); por(c, v); return Promise.resolve(); },
      update: (v) => { window.__grav.push({ op: 'update', c, v }); Object.keys(v || {}).forEach((k) => por(c + '/' + k, v[k])); return Promise.resolve(); },
      remove: () => { window.__grav.push({ op: 'remove', c }); por(c, null); return Promise.resolve(); },
      transaction: (fn) => { const cur = val(c); const nv = fn(cur == null ? null : JSON.parse(JSON.stringify(cur))); if (nv !== undefined) { window.__grav.push({ op: 'tx', c, v: nv }); por(c, nv); } return Promise.resolve({ committed: nv !== undefined, snapshot: snap(c) }); },
      push: () => ref(c + '/k' + Math.random().toString(36).slice(2, 8)),
      child: (k) => ref(c + '/' + k), orderByKey: () => x, orderByChild: () => x, startAt: () => x, endAt: () => x, equalTo: () => x, limitToLast: () => x, limitToFirst: () => x }; return x; };
    DB = { ref };
    window.zMapaUma = () => Promise.resolve({});
    window.tgCfgPronta = () => Promise.resolve(null);
    const u = { role: 'plantonista', nome: 'Plantonista Teste' };
    sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    selectedDate = new Date();
  });
  const r = await p.evaluate(corpo, arg);
  r.erros = erros;
  await p.close();
  return r;
}

(async () => {
  const b = await chromium.launch();

  // ---- 1) A pernoite lançada entra na lista do Plantão --------------------------------
  const lista = async (quando) => rodar(b, quando, async () => {
    PELUDINHOS = [{ n: 'Teste Pern', tutor: 'Tutora Um', raca: 'Spitz', categoria: 'auluno' }];
    const ch = dcKey('Teste Pern', 'Tutora Um');
    const hoje = zHojeISO(), ontem = orcMaisDias(hoje, -1);
    __dados.daycare = { pernoites: {
      [hoje]: { [ch]: { nome: 'Teste Pern/Spitz', chave: ch, status: 'aguardando' },
        'teste-cancelada__tutora-dois': { nome: 'Teste Cancelada', chave: 'teste-cancelada__tutora-dois', status: 'cancelado' },
        'teste-feita__tutora-tres': { nome: 'Teste Feita', chave: 'teste-feita__tutora-tres', status: 'checkin_feito' } },
      [ontem]: { 'teste-ontem__tutora-quatro': { nome: 'Teste Ontem/SRD', chave: 'teste-ontem__tutora-quatro', status: 'aguardando' } } } };
    hospedes = []; carregarManuais();
    await new Promise((ok) => setTimeout(ok, 400));
    return { nomes: hospedes.map((h) => h.nome + '|' + h.tutor + '|' + (h.pernoite ? 'P' : '') + (h.saidaHoje ? 'S' : '')),
      chave: (hospedes.find((h) => h.nome === 'Teste Pern') || {}).refKey };
  });
  const manha = await lista('2026-11-27T09:00:00-03:00');
  const tarde = await lista('2026-11-27T15:00:00-03:00');
  console.log('Pernoite lançada no Plantão');
  await prova('a pernoite aguardando o check-in aparece, com o nome e o tutor da ficha do Day Care', () => assert.ok(manha.nomes.includes('Teste Pern|Tutora Um|P'), JSON.stringify(manha.nomes)));
  await prova('ela usa a chave do cadastro (relatórios, remédio e comida casam com a ficha)', () => assert.ok(manha.chave && manha.chave.length > 0, String(manha.chave)));
  await prova('a cancelada e a de check-in feito não entram por aqui', () => assert.ok(!manha.nomes.some((n) => /Cancelada|Feita/.test(n)), JSON.stringify(manha.nomes)));
  await prova('a pernoite de ontem aparece de manhã como saída do dia (sem ficha no aparelho, pelo nome lançado)', () => assert.ok(manha.nomes.includes('Teste Ontem|Tutora Quatro|PS'), JSON.stringify(manha.nomes)));
  await prova('depois das 11h30 a de ontem sai e a de hoje continua', () => { assert.ok(!tarde.nomes.some((n) => /Ontem/.test(n)), JSON.stringify(tarde.nomes)); assert.ok(tarde.nomes.includes('Teste Pern|Tutora Um|P')); });
  await prova('sem erro na página', () => assert.deepStrictEqual(manha.erros.concat(tarde.erros), []));

  // ---- 2) A noite da ficha é a do relógio ---------------------------------------------
  const dia = async (quando, extra) => rodar(b, quando, async (extra) => {
    if (extra === 'ontem-auto') { selectedDate = new Date(Date.now() - 86400000); DIA_TELA_AUTO = dataKeyAtual(); }
    if (extra === 'ontem-mao') { selectedDate = new Date(Date.now() - 86400000); DIA_TELA_AUTO = zHojeISO(); }
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' }];
    renderHosp(); abrirPlantao(0);
    return { noite: relNoiteDiaISO(), chave: relFichaKey('noite'), dia: relFichaKey('dia') };
  }, extra);
  const n2030 = await dia('2026-11-26T20:30:00-03:00');
  const n0630 = await dia('2026-11-27T06:30:00-03:00');
  const n1500 = await dia('2026-11-27T15:00:00-03:00');
  const n0130 = await dia('2026-11-27T01:30:00-03:00', 'ontem-auto');
  const nMao = await dia('2026-11-27T15:00:00-03:00', 'ontem-mao');
  console.log('A noite da ficha');
  await prova('às 20h30 do dia 26 a ficha abre a noite de 26 para 27 (gravada no dia 27)', () => { assert.strictEqual(n2030.noite, '2026-11-27'); assert.ok(/__2026-11-27$/.test(n2030.chave), n2030.chave); assert.ok(/__2026-11-26$/.test(n2030.dia), n2030.dia); });
  await prova('às 6h30 do dia 27 é a mesma noite (a que termina hoje)', () => assert.strictEqual(n0630.noite, '2026-11-27'));
  await prova('às 15h do dia 27 é a noite que terminou hoje cedo', () => assert.strictEqual(n1500.noite, '2026-11-27'));
  await prova('tela presa em ontem depois da meia-noite: a noite de hoje', () => assert.strictEqual(n0130.noite, '2026-11-27'));
  await prova('dia escolhido à mão: o relatório daquele dia', () => assert.strictEqual(nMao.noite, '2026-11-26'));

  // ---- 3) Rascunho de noite, assinatura de manhã ---------------------------------------
  const rasc = await rodar(b, '2026-11-26T20:30:00-03:00', async () => {
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' }];
    renderHosp(); abrirPlantao(0);
    await new Promise((ok) => setTimeout(ok, 300));
    const out = {};
    const kAmanha = relFichaKey('noite'), kHoje = fichaKey();
    // O relatório da noite ANTERIOR já assinado (mora no dia 26): de noite, a ficha não abre mais ele.
    __dados.auaulandia = { relatorios: { [kHoje]: { noite: { passou: 'Outra Plantonista', byQ: { 'Como passou a noite?': 'Agitado' } } } } };
    carregarFicha(); await new Promise((ok) => setTimeout(ok, 300));
    out.passouNaTela = document.getElementById('passou-noite').value;
    out.marcadoAntes = valDe('card-noite', 'Como passou a noite?');
    // Marca de noite: vira rascunho.
    const bt = [...document.querySelectorAll('#card-noite .obsline')].find((l) => l.querySelector('.q').textContent.trim() === 'Fez xixi?').querySelector('button');
    bt.click(); await new Promise((ok) => setTimeout(ok, 1000));
    out.rascGravado = __grav.filter((g) => g.c === 'auaulandia/relatorios-rascunho/' + kAmanha).length;
    out.rascValor = ((((__dados.auaulandia || {})['relatorios-rascunho'] || {})[kAmanha] || {}).byQ || {})['Fez xixi?'];
    out.status = document.getElementById('status-noite').textContent;
    // Reabre a ficha (outra hora): o rascunho volta.
    document.querySelectorAll('#card-noite button.on').forEach((x) => x.classList.remove('on'));
    carregarFicha(); await new Promise((ok) => setTimeout(ok, 300));
    out.voltou = valDe('card-noite', 'Fez xixi?');
    out.statusVolta = document.getElementById('status-noite').textContent;
    // O relatório assinado manda sobre o rascunho.
    __dados.auaulandia.relatorios[kAmanha] = { noite: { passou: 'Plantonista Teste', byQ: { 'Fez xixi?': 'Não vi' } } };
    carregarFicha(); await new Promise((ok) => setTimeout(ok, 300));
    out.assinado = valDe('card-noite', 'Fez xixi?');
    // A assinatura grava no dia da noite e apaga o rascunho.
    delete __dados.auaulandia.relatorios[kAmanha];
    __dados.auaulandia['relatorios-rascunho'][kAmanha] = { byQ: { 'Fez xixi?': 'Sim' }, quem: 'x', _ts: 1 };
    carregarFicha(); await new Promise((ok) => setTimeout(ok, 300));
    document.querySelectorAll('#card-noite .obsline').forEach((l) => { if (l.style.display === 'none') return; if (!l.querySelector('button.on')) { const b0 = l.querySelector('.seg button'); if (b0) pick(b0); } });
    document.getElementById('passou-noite').value = 'Plantonista Teste';
    __grav.length = 0;
    salvarRelatorioCard('noite'); await new Promise((ok) => setTimeout(ok, 600));
    out.gravouNoite = __grav.filter((g) => g.op === 'tx').map((g) => g.c);
    out.apagouRasc = __grav.filter((g) => g.op === 'remove').map((g) => g.c);
    out.statusFim = document.getElementById('status-noite').textContent;
    out.kAmanha = kAmanha;
    return out;
  });
  console.log('Rascunho da noite');
  await prova('de noite a ficha não mostra o relatório da noite anterior, já fechado', () => { assert.strictEqual(rasc.passouNaTela, ''); assert.strictEqual(rasc.marcadoAntes, ''); });
  await prova('o que se marca de noite fica guardado como rascunho, no dia da noite', () => { assert.ok(rasc.rascGravado >= 1); assert.strictEqual(rasc.rascValor, 'Sim'); assert.ok(/Rascunho guardado/.test(rasc.status), rasc.status); });
  await prova('ao abrir a ficha de novo o rascunho volta, com o aviso', () => { assert.strictEqual(rasc.voltou, 'Sim'); assert.ok(/Rascunho de Plantonista Teste/.test(rasc.statusVolta), rasc.statusVolta); });
  await prova('o relatório assinado manda sobre o rascunho', () => assert.strictEqual(rasc.assinado, 'Não vi'));
  await prova('assinar grava o relatório no dia da noite e apaga o rascunho', () => {
    assert.deepStrictEqual(rasc.gravouNoite, ['auaulandia/relatorios/' + rasc.kAmanha + '/noite'], JSON.stringify(rasc.gravouNoite) + ' ' + rasc.statusFim);
    assert.ok(rasc.apagouRasc.includes('auaulandia/relatorios-rascunho/' + rasc.kAmanha), JSON.stringify(rasc.apagouRasc));
  });
  await prova('sem erro na página', () => assert.deepStrictEqual(rasc.erros, []));

  // ---- 4) O destaque da ficha segue o plantão da hora ---------------------------------
  const destaque = async (quando) => rodar(b, quando, async () => {
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' }];
    renderHosp(); abrirPlantao(0);
    await new Promise((ok) => setTimeout(ok, 300));
    MAG_RESUMO = { itens: 2 };
    MED_AGENDA_ITENS = { a: { nome: 'Remedio Noite', horarios: ['21:00'] }, b: { nome: 'Remedio Dia', horarios: ['08:00'] } };
    fichaDestaqueRender();
    const t = document.getElementById('hfDestaque').innerText.replace(/\s+/g, ' ').trim();
    MED_AGENDA_ITENS = {}; fichaDestaqueRender();
    const sem = document.getElementById('hfDestaque').innerText.replace(/\s+/g, ' ').trim();
    return { t, sem };
  });
  const dNoite = await destaque('2026-11-26T20:30:00-03:00');
  const dDia = await destaque('2026-11-26T10:00:00-03:00');
  console.log('Destaque na ficha');
  await prova('de noite: o jantar e só o remédio da noite, em destaque', () => {
    assert.ok(/plantão da noite/i.test(dNoite.t), dNoite.t); assert.ok(/Jantar/.test(dNoite.t)); assert.ok(!/Café da manhã|Almoço/.test(dNoite.t), dNoite.t);
    assert.ok(/Remédio: SIM 21:00 Remedio Noite/.test(dNoite.t), dNoite.t); assert.ok(!/Remedio Dia/.test(dNoite.t));
  });
  await prova('de dia: o café, o almoço e só o remédio do dia', () => {
    assert.ok(/Café da manhã/.test(dDia.t) && /Almoço/.test(dDia.t), dDia.t); assert.ok(!/Jantar/.test(dDia.t));
    assert.ok(/08:00 Remedio Dia/.test(dDia.t) && !/Remedio Noite/.test(dDia.t), dDia.t);
  });
  await prova('sem remédio, o destaque diz que não tem', () => assert.ok(/não tem remédio neste plantão/.test(dNoite.sem), dNoite.sem));
  await prova('sem erro na página', () => assert.deepStrictEqual(dNoite.erros.concat(dDia.erros), []));

  // ---- 5) Regras da casa no texto novo -------------------------------------------------
  const fs = require('fs');
  const html = fs.readFileSync(APP, 'utf8');
  console.log('Regras da casa');
  await prova('versão 2026-11-27-01 em todos os arquivos versionados', () => { assert.match(html, /const APP_VERSAO='2026-11-27-01';/); assert.equal(html.split('2026-11-27-01').length - 1, 18); });
  await prova('sem «cão» nem «cachorro» no texto novo', () => {
    const a = html.indexOf('A NOITE QUE ESTÁ ABERTA'), d = html.indexOf('EM DESTAQUE NA FICHA');
    const novo = html.slice(a, a + 4000) + html.slice(d, d + 4000);
    assert.ok(!/\bc[ãa]o\b|cachorro/i.test(novo));
  });

  await b.close();
  console.log('\n' + ok + ' passaram, ' + falhas.length + ' falharam');
  if (falhas.length) { falhas.forEach((f) => console.log(' - ' + f)); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
