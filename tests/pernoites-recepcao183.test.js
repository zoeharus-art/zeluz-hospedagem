'use strict';
// Área «Pernoites» da Recepção (Adriana, 12 e 14/nov/2026): lançar em datas separadas, mudar o dia, tirar,
// só Auluno na busca, monitor e plantonista só leem. Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

/* ---------- pedaços REAIS do app, recortados do arquivo ---------- */
function entre(ini, fim, aPartirDe) {
  const a = html.indexOf(ini, aPartirDe || 0); assert.ok(a >= 0, 'não achei: ' + ini);
  const b = html.indexOf(fim, a + ini.length); assert.ok(b > a, 'não achei o fim: ' + fim);
  return html.slice(a, b);
}
const BLOCO = entre('/* pernoites-recepcao183:ini */', '/* pernoites-recepcao183:fim */');
const GRAVAR = entre('function pernGravarDoLancamento(', '// O aviso ao grupo do plantão');
const CHAVE = entre('function pernChaveDe(', '// O nome limpo, sem o detalhe');
const LIMPO = html.match(/function pernNomeLimpo\(v\)\{[^\n]*\}/)[0];
const INDICE = entre('function pernFichaIndiceDe(r){', '/* A NOITE ANTERIOR É CONFERIDA');
const JSNORM = html.match(/function jsNorm\(s\)\{[^\n]*\}/)[0];
const ESCATTR = html.match(/function escAttr\(s\)\{[^\n]*\}/)[0];
const TEXTOLIMPO = entre('function dashDetTextoLimpo(v){', 'function dashEscolher(');

/* ---------- banco de mentira em memória, com consulta ao vivo ---------- */
function bancoFalso(inicial) {
  const raiz = { v: JSON.parse(JSON.stringify(inicial || {})) };
  const ouvintes = [];
  const falso = { falhaLeitura: false, atrasoLeitura: false, gravacoes: [] };
  const partes = (p) => p.split('/').filter(Boolean);
  const copia = (x) => (x === undefined || x === null) ? null : JSON.parse(JSON.stringify(x));
  function ler(p) { let n = raiz.v; for (const k of partes(p)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return copia(n); }
  function gravar(p, valor) {
    const ks = partes(p); let n = raiz.v;
    ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== 'object') n[k] = {}; n = n[k]; });
    if (valor === null) { delete n[ks[ks.length - 1]]; podar(ks.slice(0, -1)); } else n[ks[ks.length - 1]] = copia(valor);
    avisar();
  }
  /* o banco de verdade some com o nó pai que ficou vazio */
  function podar(ks) { for (let i = ks.length; i > 0; i--) { let n = raiz.v; ks.slice(0, i - 1).forEach((k) => { n = n[k]; }); const k = ks[i - 1]; if (n[k] && typeof n[k] === 'object' && !Object.keys(n[k]).length) delete n[k]; else break; } }
  function avisar() { ouvintes.slice().forEach((o) => o.fn({ val: () => o.q.valor() })); }
  const snap = (p) => ({ key: partes(p).pop(), val: () => ler(p) });
  let seq = 0;
  function ref(p) {
    return {
      key: partes(p).pop(),
      once: async () => snap(p),
      set: async (v) => { falso.gravacoes.push(['set', p]); gravar(p, v); },
      update: async (o) => { falso.gravacoes.push(['update', p]); Object.keys(o).forEach((k) => gravar(p + '/' + k, o[k] === undefined ? null : o[k])); },
      remove: async () => { falso.gravacoes.push(['remove', p]); gravar(p, null); },
      push: () => ref(p + '/k' + (++seq)),
      transaction: async (fn) => {
        let novo = fn(null); const atual = ler(p);
        if (atual !== null) novo = fn(atual);
        if (novo === undefined) return { committed: false, snapshot: snap(p) };
        gravar(p, novo); return { committed: true, snapshot: snap(p) };
      },
      orderByKey: () => {
        const q = { de: null, ate: null };
        q.startAt = (x) => { q.de = x; return q; }; q.endAt = (x) => { q.ate = x; return q; };
        q.valor = () => { const t = ler(p) || {}, o = {}; Object.keys(t).sort().forEach((k) => { if ((q.de === null || k >= q.de) && (q.ate === null || k <= q.ate)) o[k] = t[k]; }); return Object.keys(o).length ? o : null; };
        q.on = (ev, fn, erro) => {
          if (falso.falhaLeitura) { erro(new Error('permission_denied')); return; }
          if (falso.atrasoLeitura) return;
          ouvintes.push({ fn, q }); fn({ val: () => q.valor() });
        };
        q.off = (ev, fn) => { const i = ouvintes.findIndex((o) => o.fn === fn); if (i >= 0) ouvintes.splice(i, 1); };
        return q;
      }
    };
  }
  return Object.assign(falso, { ref, ler, gravar, ouvintes });
}

/* ---------- um «navegador» mínimo: elementos criados sob demanda ---------- */
function mundo(db, papel) {
  const els = {};
  const el = (id) => els[id] || (els[id] = {
    id, innerHTML: '', value: '', textContent: '', style: {}, disabled: false, dataset: {},
    classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, toggle(c, on) { if (on) this.s.add(c); else this.s.delete(c); }, contains(c) { return this.s.has(c); } },
    focus() {}
  });
  const registro = { alertas: [], falhas: [], leituras: [], auditorias: [], pedidos: [] };
  const ctx = { Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, setTimeout, clearTimeout };
  ctx.window = ctx;
  ctx.document = { getElementById: el, querySelectorAll: () => [] };
  vm.createContext(ctx);
  const P = [{ n: 'Auluno Teste', tutor: 'Tutora Um', raca: 'SRD', cat: 'auluno' },
             { n: 'Avulso Teste', tutor: 'Tutora Dois', raca: 'SRD', cat: 'avulso' },
             { n: 'Hospede Teste', tutor: 'Tutora Tres', raca: 'SRD', cat: 'hospede' },
             { n: 'Morador Teste', tutor: 'Equipe', raca: 'SRD', cat: 'morador' },
             { n: 'Inativo Teste', tutor: 'Tutora Cinco', raca: 'SRD', cat: 'auluno', inativo: true }];
  ctx.PELUDINHOS = P;
  ctx.DB = db;
  ctx.papel = papel || 'consultora';
  ctx.zTextoResposta = 'a tutora vai buscar às 18h';
  ctx.dia0 = '2026-11-14';
  vm.runInContext(`
    var PERN_FILA={}, PERN_FILA_DIA='';
    function pernHoje(){ return dia0; }
    function pernNo(dia){ return 'daycare/pernoites/'+dia; }
    function addDiasISO(iso,n){ var d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
    function fmtBR(iso){ var a=String(iso||'').split('-'); return a[2]+'/'+a[1]+'/'+a[0]; }
    function podePapel(c){ var L={'ver-pernoites':['consultora','supervisor','gestao','diretoria','monitor','plantonista'],'lancar-pernoite':['consultora','supervisor','gestao','diretoria']}; return (L[c]||[]).indexOf(papel)>=0; }
    function pelInativo(p){ return !!p.inativo; } function pelCategoria(p){ return p.cat; }
    function pelNome(p){ return p.n; } function pelGet(p,c){ return p[c]||''; }
    function dcKey(n,t){ return (n+'__'+t).toLowerCase().replace(/ /g,'-'); }
    function dashNomePlanilha(p){ return p.n+'/'+p.raca; }
    function quemSou(){ return 'Recepção Teste'; }
    function pick(){} function pernCartaoRender(){} function pernAvisarPlantao(){}
    function audit(a,t){ __reg.auditorias.push([a,t]); }
    function _logFalhaGrav(o,e){ __reg.falhas.push(o); } function _logLeituraFalhou(o,e){ __reg.leituras.push(o); }
    function zAlertao(t,l){ __reg.alertas.push([t,l]); }
    function zTexto(t,l,op){ __reg.pedidos.push([t,op]); return Promise.resolve(zTextoResposta); }
    function zErroFrase(x){ return String(x); } function zErroMotivo(e){ return String(e&&e.message||e); }
  `, Object.assign(ctx, { __reg: registro }));
  [JSNORM, ESCATTR, TEXTOLIMPO, LIMPO, CHAVE, INDICE, GRAVAR, BLOCO].forEach((c) => vm.runInContext(c, ctx));
  return { ctx, el, P, registro, els };
}
const NOITE = (n) => { const d = new Date('2026-11-14T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const CH = (n, t) => (n + '__' + t).toLowerCase().replace(/ /g, '-');
const CHAVE_A = CH('Auluno Teste', 'Tutora Um');

/* escolhe o Auluno e marca as noites exatamente como a recepção faria */
function abrirELancar(m, noites, obs) {
  m.ctx.pnAbrirLancar();
  m.ctx.pnEscolher(0);
  m.ctx.PN_NOITES.slice().forEach((d) => m.ctx.pnNoiteAlternar(d));   // desmarca o «hoje» que já vem marcado
  noites.forEach((d) => m.ctx.pnNoiteAlternar(d));
  if (obs) m.el('pnObs').value = obs;
}

prova('só Aulunos aparecem na busca: hóspede, morador e inativo ficam de fora', () => {
  const m = mundo(bancoFalso({}));
  m.ctx.pnAbrirLancar();
  m.el('pnBusca').value = 'teste';
  m.ctx.pnBuscar();
  const h = m.el('pnResultados').innerHTML;
  assert.match(h, /Auluno Teste/); assert.match(h, /Avulso Teste/);
  assert.doesNotMatch(h, /Hospede Teste/); assert.doesNotMatch(h, /Morador Teste/); assert.doesNotMatch(h, /Inativo Teste/);
  m.el('pnBusca').value = 'hospede'; m.ctx.pnBuscar();
  assert.match(m.el('pnResultados').innerHTML, /Hóspede não tem pernoite/);
  m.ctx.pnEscolher(2);   // mesmo forçando o índice do hóspede, ele não é escolhido
  assert.equal(m.ctx.PN_PEL, null);
});

prova('lançar 2 datas separadas grava 2 itens dos Lançamentos do dia e 2 registros da fila, no formato certo', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2), NOITE(6)], 'viagem');
  assert.equal(m.el('pnOk').textContent, 'Lançar 2 pernoites');
  assert.equal(await m.ctx.pnLancar(), true);
  [NOITE(2), NOITE(6)].forEach((d) => {
    const itens = db.ler('daycare/dashboard/' + d + '/pernoite') || {};
    const ids = Object.keys(itens); assert.equal(ids.length, 1);
    const it = itens[ids[0]];
    assert.equal(it.valor, 'Auluno Teste/SRD (TUTOR AVISOU · VIAGEM)');
    assert.equal(it.chave, CHAVE_A); assert.equal(it.quem, 'Recepção Teste'); assert.equal(typeof it.ts, 'number');
    assert.deepEqual(it.det, { motivo: 'TUTOR AVISOU', obs: 'VIAGEM' });
    assert.equal('planilha_ok' in it, false, 'pernoite não vai para a planilha');
    const f = db.ler('daycare/pernoites/' + d + '/' + CHAVE_A);
    assert.equal(f.status, 'aguardando'); assert.equal(f.nome, 'Auluno Teste/SRD'); assert.equal(f.chave, CHAVE_A);
    assert.equal(f.dia, d); assert.equal(f.motivo, 'TUTOR AVISOU'); assert.equal(f.obs, 'VIAGEM'); assert.equal(f.quem, 'Recepção Teste');
  });
  assert.equal(db.ler('daycare/pernoites/' + NOITE(3)), null, 'nada de noites no meio: não é intervalo');
  assert.equal(m.el('pnModal').classList.contains('on'), false, 'o modal fecha');
  assert.match(m.el('pnMsg').innerHTML, /pernoite lançada para/);
});

prova('não duplica a mesma noite: diz que já está lançada', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2)]);
  assert.equal(await m.ctx.pnLancar(), true);
  abrirELancar(m, [NOITE(2)]);
  assert.equal(await m.ctx.pnLancar(), false);
  assert.match(m.el('pnAviso').textContent, /Já está lançada/);
  assert.equal(Object.keys(db.ler('daycare/dashboard/' + NOITE(2) + '/pernoite')).length, 1);
  // a noite que o check-in já cobriu também não duplica
  db.gravar('daycare/pernoites/' + NOITE(4) + '/' + CHAVE_A, { status: 'checkin_feito', nome: 'Auluno Teste/SRD', dia: NOITE(4) });
  abrirELancar(m, [NOITE(4)]);
  assert.equal(await m.ctx.pnLancar(), false);
  assert.equal(db.ler('daycare/dashboard/' + NOITE(4) + '/pernoite'), null);
  // duas noites, uma já lançada: só a nova entra
  abrirELancar(m, [NOITE(2), NOITE(5)]);
  assert.equal(await m.ctx.pnLancar(), true);
  assert.match(m.el('pnMsg').innerHTML, /Já estava lançada/);
  assert.equal(Object.keys(db.ler('daycare/dashboard/' + NOITE(2) + '/pernoite')).length, 1);
  assert.equal(Object.keys(db.ler('daycare/dashboard/' + NOITE(5) + '/pernoite')).length, 1);
});

prova('«Mudar o dia» cancela a antiga (mudou_para), retira o item antigo e cria a nova (veio_de)', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2)], 'cirurgia');
  await m.ctx.pnLancar();
  m.ctx.pnAbrir();
  assert.match(m.el('pnLista').innerHTML, /Mudar o dia/);
  m.ctx.pnMudarAbrir(NOITE(2), CHAVE_A);
  assert.equal(m.el('pnMudarModal').classList.contains('on'), true);
  assert.doesNotMatch(m.el('pnMudarNoites').innerHTML, new RegExp('data-dia="' + NOITE(2) + '"'), 'a noite de hoje dela não é oferecida');
  m.ctx.pnMudarSel(NOITE(8));
  assert.equal(await m.ctx.pnMudarConfirmar(), true);
  const velha = db.ler('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A);
  assert.equal(velha.status, 'cancelado'); assert.equal(velha.cancel_motivo, 'mudou para 22/11'); assert.equal(velha.mudou_para, NOITE(8));
  assert.equal(velha.cancel_quem, 'Recepção Teste');
  assert.equal(db.ler('daycare/dashboard/' + NOITE(2) + '/pernoite'), null, 'o item antigo saiu dos Lançamentos');
  const nova = db.ler('daycare/pernoites/' + NOITE(8) + '/' + CHAVE_A);
  assert.equal(nova.status, 'aguardando'); assert.equal(nova.veio_de, NOITE(2)); assert.equal(nova.motivo, 'TUTOR AVISOU'); assert.equal(nova.obs, 'CIRURGIA');
  const itens = db.ler('daycare/dashboard/' + NOITE(8) + '/pernoite'); const it = itens[Object.keys(itens)[0]];
  assert.equal(it.valor, 'Auluno Teste/SRD (TUTOR AVISOU · CIRURGIA)'); assert.equal(it.chave, CHAVE_A);
  assert.equal(m.el('pnMudarModal').classList.contains('on'), false);
  // a lista mostra a antiga nas «Tiradas» e a nova com «veio de»
  const lista = m.el('pnLista').innerHTML;
  assert.match(lista, /Tiradas \(1\)/); assert.match(lista, /mudou para 22\/11/); assert.match(lista, /veio de 16\/11/);
});

prova('«Mudar o dia» para uma noite em que ele já tem pernoite não mexe em nada', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2), NOITE(3)]);
  await m.ctx.pnLancar();
  m.ctx.pnAbrir();
  m.ctx.pnMudarAbrir(NOITE(2), CHAVE_A);
  assert.match(m.el('pnMudarNoites').innerHTML, /disabled[^>]*data-dia="2026-11-17"/, 'a noite que ele já tem vem travada');
  m.ctx.pnMudarSel(NOITE(3));   // mesmo forçando
  assert.equal(await m.ctx.pnMudarConfirmar(), false);
  assert.equal(db.ler('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A).status, 'aguardando');
  assert.match(m.el('pnMudarAviso').textContent, /já tem pernoite/);
});

prova('«Tirar» pede o motivo, cancela na fila com quem e por quê, e retira o item do dia', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2), NOITE(6)]);
  await m.ctx.pnLancar();
  m.ctx.pnAbrir();
  assert.equal(await m.ctx.pnTirar(NOITE(6), CHAVE_A), true);
  assert.equal(m.registro.pedidos.length, 1); assert.equal(m.registro.pedidos[0][1].minimo, 4);
  const f = db.ler('daycare/pernoites/' + NOITE(6) + '/' + CHAVE_A);
  assert.equal(f.status, 'cancelado'); assert.equal(f.cancel_motivo, 'a tutora vai buscar às 18h'); assert.equal(f.cancel_quem, 'Recepção Teste'); assert.equal(typeof f.cancel_ts, 'number');
  assert.equal(db.ler('daycare/dashboard/' + NOITE(6) + '/pernoite'), null);
  assert.ok(db.ler('daycare/dashboard/' + NOITE(2) + '/pernoite'), 'a outra noite continua');
  assert.match(m.el('pnLista').innerHTML, /Tiradas \(1\)/);
  assert.match(m.el('pnLista').innerHTML, /a tutora vai buscar às 18h/);
  // desistir da pergunta não mexe em nada
  m.ctx.zTextoResposta = null;
  assert.equal(await m.ctx.pnTirar(NOITE(2), CHAVE_A), false);
  assert.equal(db.ler('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A).status, 'aguardando');
  // e dá para lançar de novo a noite tirada: o aviso de cancelamento antigo sai
  abrirELancar(m, [NOITE(6)]);
  assert.equal(await m.ctx.pnLancar(), true);
  const de_novo = db.ler('daycare/pernoites/' + NOITE(6) + '/' + CHAVE_A);
  assert.equal(de_novo.status, 'aguardando'); assert.equal('cancel_motivo' in de_novo, false);
});

prova('noite com check-in feito não oferece mudar nem tirar, e as funções também recusam', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(2)]);
  await m.ctx.pnLancar();
  db.gravar('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A + '/status', 'checkin_feito');
  m.ctx.pnAbrir();
  const h = m.el('pnLista').innerHTML;
  assert.match(h, /check-in feito/); assert.doesNotMatch(h, /Mudar o dia/); assert.doesNotMatch(h, />Tirar</);
  m.ctx.pnMudarAbrir(NOITE(2), CHAVE_A);
  assert.equal(m.el('pnMudarModal').classList.contains('on'), false);
  assert.equal(await m.ctx.pnTirar(NOITE(2), CHAVE_A), false);
  assert.equal(db.ler('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A).status, 'checkin_feito');
  assert.ok(db.ler('daycare/dashboard/' + NOITE(2) + '/pernoite'));
});

prova('o quadro conta as 14 noites e tocar numa noite filtra a lista', async () => {
  const db = bancoFalso({});
  const m = mundo(db);
  abrirELancar(m, [NOITE(0), NOITE(5)]);
  await m.ctx.pnLancar();
  m.ctx.pnAbrir();
  const q = m.el('pnDias').innerHTML;
  assert.equal((q.match(/class="troca-dia[ "]/g) || []).length, 14);
  assert.equal((q.match(/1 pernoite</g) || []).length, 2);
  assert.match(m.el('pnLista').innerHTML, /hoje/); assert.match(m.el('pnLista').innerHTML, /sexta|sábado|domingo|segunda|terça|quarta|quinta/);
  m.ctx.pnFiltrar(NOITE(5));
  const f = m.el('pnLista').innerHTML;
  assert.equal((f.match(/he-grp/g) || []).length, 1);
  m.ctx.pnFiltrar(NOITE(5));
  assert.equal((m.el('pnLista').innerHTML.match(/he-grp/g) || []).length, 2);
  m.ctx.pnFiltrar(NOITE(9));
  assert.match(m.el('pnLista').innerHTML, /Nenhuma pernoite nesta noite/);
});

prova('a leitura pede só as 14 noites; antes de ler diz «conferindo»; erro nunca vira «nenhuma pernoite»', () => {
  const db = bancoFalso({ daycare: { pernoites: { [NOITE(-1)]: { x: { status: 'aguardando', nome: 'Ontem Teste' } }, [NOITE(20)]: { x: { status: 'aguardando', nome: 'Longe Teste' } }, [NOITE(3)]: { y: { status: 'aguardando', nome: 'Dentro Teste/SRD', motivo: 'TUTOR AVISOU' } } } } });
  const m = mundo(db);
  m.ctx.pnAbrir();
  const L = m.el('pnLista').innerHTML;
  assert.match(L, /Dentro Teste/); assert.doesNotMatch(L, /Ontem Teste/); assert.doesNotMatch(L, /Longe Teste/);
  assert.match(html, /DB\.ref\('daycare\/pernoites'\)\.orderByKey\(\)\.startAt\(h\)\.endAt\(ate\)/);
  assert.match(html, /PN_REF\.off\('value', PN_REF_FN\)/);
  // ainda não leu
  const d2 = bancoFalso({}); d2.atrasoLeitura = true;
  const m2 = mundo(d2); m2.ctx.pnAbrir();
  assert.match(m2.el('pnLista').innerHTML, /conferindo/); assert.doesNotMatch(m2.el('pnLista').innerHTML, /Nenhuma pernoite/);
  // erro de leitura
  const d3 = bancoFalso({}); d3.falhaLeitura = true;
  const m3 = mundo(d3); m3.ctx.pnAbrir();
  assert.match(m3.el('pnLista').innerHTML, /Não consegui ler as pernoites agora/);
  assert.doesNotMatch(m3.el('pnLista').innerHTML, /Nenhuma pernoite/);
  assert.equal(m3.registro.leituras.length, 1);
  assert.equal(m3.ctx.PN_LIDO, false);
  // sair da tela fecha a consulta
  assert.equal(db.ouvintes.length, 1); m.ctx.pnParar(); assert.equal(db.ouvintes.length, 0);
});

prova('monitor e plantonista veem a lista e o quadro, sem os botões de lançar, mudar e tirar', async () => {
  const db = bancoFalso({});
  const dono = mundo(db);
  abrirELancar(dono, [NOITE(2)]);
  await dono.ctx.pnLancar();
  for (const papel of ['monitor', 'plantonista']) {
    const m = mundo(db, papel);
    m.ctx.pnAbrir();
    assert.match(m.el('pnLista').innerHTML, /Auluno Teste/, papel + ' vê quem dorme aqui');
    assert.doesNotMatch(m.el('pnLista').innerHTML, /Mudar o dia/); assert.doesNotMatch(m.el('pnLista').innerHTML, />Tirar</);
    assert.equal(m.el('pnBotaoLancar').style.display, 'none');
    assert.equal((m.el('pnDias').innerHTML.match(/class="troca-dia[ "]/g) || []).length, 14);
    m.ctx.pnAbrirLancar(); assert.equal(m.el('pnModal').classList.contains('on'), false);
    assert.equal(m.registro.alertas.length, 1);
    m.ctx.pnMudarAbrir(NOITE(2), CHAVE_A); assert.equal(m.el('pnMudarModal').classList.contains('on'), false);
    assert.equal(await m.ctx.pnTirar(NOITE(2), CHAVE_A), false);
    assert.equal(db.ler('daycare/pernoites/' + NOITE(2) + '/' + CHAVE_A).status, 'aguardando');
  }
  const outro = mundo(db, 'tutor');
  outro.ctx.pnAbrir();
  assert.doesNotMatch(outro.el('pnLista').innerHTML, /Auluno Teste/, 'quem não tem o papel não vê a lista');
});

prova('a página: menu, tela, papéis, título, abertura e versão', () => {
  assert.match(html, /<a data-v="pernoites" style="display:none"[^>]*><span data-icon="cal"><\/span><span>Pernoites<\/span><\/a>/);
  const iCk = html.indexOf('<a data-v="checkin"'), iPn = html.indexOf('<a data-v="pernoites"'), iHist = html.indexOf('<a data-v="historicocheckins"');
  assert.ok(iCk > 0 && iPn > iCk && iPn < iHist + 400, 'Pernoites fica ao lado do Check-in, no grupo Hotel');
  assert.match(html, /<section class="view" id="v-pernoites">/);
  assert.match(html, /Só Aulunos do Day Care\. Hóspede que sai depois do horário paga meia diária, não pernoite\./);
  assert.match(html, /'ver-pernoites':\s*\['consultora','supervisor','gestao','diretoria','monitor','plantonista'\]/);
  assert.match(html, /'lancar-pernoite':\s*\['consultora','supervisor','gestao','diretoria'\]/);
  assert.match(html, /\['pernoites','ver-pernoites'\]/);
  assert.match(html, /pernoites:\['Pernoites',/);
  assert.match(html, /if\(v==='pernoites'\)\{ if\(typeof pnAbrir==='function'\) pnAbrir\(\); \}/);
  assert.match(html, /if\(v!=='pernoites'\)\{ if\(typeof pnParar==='function'\) pnParar\(\); \}/);
  assert.match(html, /const APP_VERSAO='2026-11-22-01';/);
  assert.equal((html.match(/2026-11-22-01/g) || []).length, 15);
  assert.equal(html.includes('2026-11-12-01'), false);
  // o desenho é o da Reposição: classes copiadas, sem caixa de marcar nem − / +
  const tela = entre('<section class="view" id="v-pernoites">', '<!-- Extrato de um peludinho -->');
  ['troca-dia', 'rep-card', 'rep-lb', 'rep-in', 'seg gold', 'rep-ok', 'rep-cancel'].forEach((c) => assert.ok((tela + BLOCO).includes(c), 'usa ' + c));
  assert.doesNotMatch(tela + BLOCO, /type="checkbox"|type=\\"checkbox\\"/);
  assert.doesNotMatch(tela, />\s*[−+-]\s*</);
});

prova('regras da casa no trecho novo: sem alert/confirm/prompt, sem emoji, sem palavra proibida, sem catch vazio mudo', () => {
  const tela = entre('<section class="view" id="v-pernoites">', '<!-- Extrato de um peludinho -->');
  const css = entre('/* ===== PERNOITES (Recepção › Hotel', '.rep-row{');
  const tudo = BLOCO + tela + css;
  assert.doesNotMatch(tudo, /(^|[^A-Za-z_.])(alert|confirm|prompt)\s*\(/);
  assert.doesNotMatch(tudo, /window\.(alert|confirm|prompt)/);
  assert.doesNotMatch(tudo, /\p{Extended_Pictographic}/u);
  assert.doesNotMatch(tudo, /\b(cão|cães|cachorro|cachorros|baia|baias|soltar|solto|solta|soltas|soltos)\b/i);
  const mudos = tudo.match(/catch\s*\(\w*\)\s*\{\s*\}(?!\s*\/\*\s*silencioso de propósito:)/g);
  assert.equal(mudos, null, 'catch vazio sem o comentário da casa: ' + mudos);
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`pernoites-recepcao183: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
