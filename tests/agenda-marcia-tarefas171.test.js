'use strict';
// Agenda da Márcia com tarefas (30/out/2026, maquete aprovada pela Adriana): formulário com Idade e só duas escolhas por
// cuidado, agenda do dia da Márcia (Revisei / Feito / reação / Tutor avisado), contadores do menu e o «Tutor já fez»
// da Zelozinha atualizando a ficha. Dados inventados; sem rede e sem banco de verdade (banco de mentira em memória).
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const AM = require('../auaulandia/agenda-marcia/dados.js');
const AP = require('../auaulandia/agenda-marcia/painel.js');
const MD = require('../auaulandia/marcia129/dados.js');
const MP = require('../auaulandia/marcia129/painel.js');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }
const tick = () => new Promise((r) => setImmediate(r));
const clone = (v) => v == null ? v : JSON.parse(JSON.stringify(v));

/* ---------- banco de mentira: once, on/off('value'), push e transaction ---------- */
class BancoFalso {
  constructor(inicial) { this.v = clone(inicial || {}); this.n = 0; this.ouvintes = []; this.leituras = []; }
  ler(p) { let n = this.v; for (const k of p.split('/').filter(Boolean)) { if (!n || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : clone(n); }
  gravar(p, val) {
    const ks = p.split('/').filter(Boolean); let n = this.v;
    ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== 'object') n[k] = {}; n = n[k]; });
    if (val == null) delete n[ks.at(-1)]; else n[ks.at(-1)] = clone(val);
    this.ouvintes.forEach((o) => { if ((p + '/').startsWith(o.p + '/') || (o.p + '/').startsWith(p + '/')) o.fn({ val: () => this.ler(o.p) }); });
  }
  ref(p) {
    const db = this;
    return {
      key: p.split('/').pop(),
      push() { return { key: 'reg-' + (++db.n) }; },
      once: async () => { db.leituras.push(p); return { val: () => db.ler(p) }; },
      on(ev, fn) { db.leituras.push(p); db.ouvintes.push({ p, fn }); fn({ val: () => db.ler(p) }); },
      off(ev, fn) { db.ouvintes = db.ouvintes.filter((o) => !(o.p === p && o.fn === fn)); },
      orderByKey() { return this; }, limitToFirst() { return this; },
      transaction: async (fn) => { const old = db.ler(p), nx = fn(old); if (nx === undefined) return { committed: false, snapshot: { val: () => old } }; db.gravar(p, nx); return { committed: true, snapshot: { val: () => db.ler(p) } }; }
    };
  }
}

const HOJE = MP.dataSP();
const AUTOR = { id: 'zelosa-ficticia', nome: 'Márcia Fictícia' };
function cadastro(extra) {
  return Object.assign({ nome: 'Biscoito', raca: 'SRD', idade: '2 anos', tutor: 'Ciclano Fictício', telefone: '(00) 90000-0000', hora: '10:00',
    vacina: { conferido: true, plano: 'em_dia', detalhe: '' }, vermifugo: { conferido: false, plano: 'na_zeluz', detalhe: 'Produto X, 2ª dose' },
    carrapaticida: { conferido: false, plano: 'na_zeluz', detalhe: 'Produto Y' }, experiencia: '', saude: '', observacoes: '', pagamento: { recebido: false, valorCent: 0 } }, extra || {});
}
function agendaDados(db) { return AM.criar({ db, pode: () => true, autor: () => AUTOR, agora: () => Date.parse(HOJE + 'T09:00:00-03:00') }); }
function marciaDados(db) { return MD.criar({ db, pode: () => true, autor: () => AUTOR, fontesCadastro: () => ({ pronto: false }), helpers: {}, agora: () => Date.parse(HOJE + 'T09:12:00-03:00') }); }

/* =================================== 1. AGENDA MÁRCIA =================================== */
prova('formulário: grade em 2 colunas na ordem Nome | Raça; Idade | Tutor; Telefone | Horário', () => {
  const h = AP.formHTML({}, '');
  assert.match(h, /<div class="am171__grade">/);
  const nomes = [...h.matchAll(/name="(nome|raca|idade|tutor|telefone|hora)"/g)].map((m) => m[1]);
  assert.deepEqual(nomes, ['nome', 'raca', 'idade', 'tutor', 'telefone', 'hora']);
  assert.match(h, /<label class="cad-lb" for="am-idade-novo">Idade<\/label><input class="cad-in" id="am-idade-novo" name="idade" maxlength="30" type="text" placeholder="ex.: 2 anos"/);
  assert.doesNotMatch(h, /name="idade"[^>]*required/, 'Idade é opcional');
});

prova('Idade: gravada no registro como `idade`, opcional, até 30 letras; registro sem idade não ganha o campo', async () => {
  const db = new BancoFalso(), am = agendaDados(db), dia = HOJE;
  const v = AP.validar(cadastro()).valor;
  assert.equal(v.idade, '2 anos');
  const r = await am.salvar({ acao: 'criar', dia, requestId: 'idade-1', avaliacao: v });
  assert.equal(r.item.idade, '2 anos');
  assert.equal(db.ler('daycare/dashboard/' + dia + '/avaliacao/' + r.id).det.avaliacao129.idade, '2 anos');
  assert.equal(AP.ackValido(r, { acao: 'criar', dia, avaliacao: v }), true);
  await assert.rejects(am.salvar({ acao: 'criar', dia, requestId: 'idade-2', avaliacao: Object.assign({}, v, { idade: 'x'.repeat(31) }) }), /IDADE_INVALIDO/);
  const semIdade = await am.salvar({ acao: 'criar', dia, requestId: 'idade-3', avaliacao: Object.assign({}, v, { idade: '' }) });
  assert.equal('idade' in db.ler('daycare/dashboard/' + dia + '/avaliacao/' + semIdade.id).det.avaliacao129, false);
  assert.match(AP.formHTML(r.item, r.id), new RegExp('name="idade" maxlength="30" type="text" placeholder="ex.: 2 anos" value="2 anos"'));
});

prova('cuidados: só «Em dia» e «Vai fazer na Zêluz» — saem «antes» e «a_conferir»', () => {
  const h = AP.formHTML({}, '');
  assert.equal((h.match(/data-am-plano="(vacina|vermifugo|carrapaticida)" data-v="em_dia"/g) || []).length, 3);
  assert.equal((h.match(/data-am-plano="(vacina|vermifugo|carrapaticida)" data-v="na_zeluz"/g) || []).length, 3);
  assert.equal((h.match(/data-v="/g) || []).length, 6, 'duas escolhas por cuidado, nada mais');
  assert.doesNotMatch(h, /(value|data-v)="(antes|a_conferir)"/);
  for (const fora of ['Vai fazer antes da avaliação', 'A conferir', '<select class="cad-in" id="am-vacina']) assert.ok(!h.includes(fora), 'não aparece: ' + fora);
  assert.match(h, /Vai para a agenda da Márcia no dia da avaliação para revisar\./);
});

prova('cuidados: sem escolha a linha pede em vermelho; a faixa do topo diz o que falta; salvar exige as três e o «Qual?»', () => {
  const vazio = AP.formHTML({}, '');
  assert.equal((vazio.match(/class="am171__tarefa is-falta"/g) || []).length, 3);
  assert.equal((vazio.match(/Escolha: Em dia ou Vai fazer na Zêluz/g) || []).length, 3);
  assert.match(vazio, /<p class="am171__guia" role="status" aria-live="polite" data-am-guia>Falta: escolher Em dia ou Vai fazer na Zêluz em Vacina; escolher Em dia ou Vai fazer na Zêluz em Vermífugo; escolher Em dia ou Vai fazer na Zêluz em Carrapaticida\.<\/p>/);
  const semQual = cadastro({ vermifugo: { plano: 'na_zeluz', detalhe: '' } });
  assert.deepEqual(AP.validar(semQual).erros, ['Preencha o «Qual?» de Vermífugo.']);
  assert.equal(AP.guiaCuidados(semQual), 'Falta: preencher o «Qual?» de Vermífugo.');
  assert.match(AP.formHTML(semQual, ''), /Vai fazer na Zêluz: falta o «Qual\?» \(obrigatório\)/);
  assert.deepEqual(AP.validar(cadastro({ carrapaticida: {} })).erros, ['Escolha Em dia ou Vai fazer na Zêluz em Carrapaticida.']);
  const ok = AP.validar(cadastro({ vacina: { plano: 'em_dia', detalhe: 'sobrou de antes' } }));
  assert.equal(ok.valido, true);
  assert.deepEqual(ok.valor.vacina, { conferido: true, plano: 'em_dia', detalhe: '' }, '«Em dia» não leva o «Qual?»');
  assert.deepEqual(ok.valor.vermifugo, { conferido: false, plano: 'na_zeluz', detalhe: 'Produto X, 2ª dose' });
  const completo = AP.formHTML(cadastro(), 'x');
  assert.match(completo, /<p class="am171__guia" role="status" aria-live="polite" data-am-guia><\/p>/, 'faixa vazia (escondida pelo CSS) quando nada falta');
  assert.match(completo, /class="am171__tarefa is-ok" data-am-cuidado="vacina"><div class="am171__linha"><span class="am171__caixa ok" aria-hidden="true">✓<\/span>/);
});

prova('registro ANTIGO com «antes», «a_conferir» ou sem plano abre sem escolha (não some nem quebra)', async () => {
  const db = new BancoFalso(), am = agendaDados(db), dia = HOJE;
  const legado = { valor: 'Amora / Pinscher', hora: '14:00', det: { agendaMarcia: true, avaliacao129: { versao: 133, agendaMarcia: true, tutor: 'Beltrana Fictícia', telefone: '+5500900000003', revisao: 3, autorId: 'antiga', autorNome: 'Equipe', ts: 1, quando: '29/10/2026 10:00',
    vacina: { conferido: false, plano: 'antes', detalhe: 'V10' }, vermifugo: { conferido: false, plano: 'a_conferir', detalhe: '' }, carrapaticida: { conferido: true } } } };
  db.gravar('daycare/dashboard/' + dia + '/avaliacao/antigo', legado);
  let snap; am.observar(dia, (s) => { snap = s; });
  const it = snap.itens.find((x) => x.id === 'antigo');
  assert.equal(it.vacina.plano, 'antes', 'o dado antigo continua legível');
  const h = AP.formHTML(it, it.id);
  for (const k of ['vacina', 'vermifugo', 'carrapaticida']) assert.match(h, new RegExp('<input type="hidden" name="' + k + '-plano" value="">'));
  assert.match(h, /name="vacina-detalhe" maxlength="300" autocomplete="off" placeholder="ex.: V10, gripe" value="V10"/, 'o «Qual?» antigo fica no campo');
  assert.equal(AP.validar(it).valido, false, 'salvar pede a escolha nova');
  const tela = AP.desenhar(snap, {});
  assert.match(tela, /Amora/, 'o agendamento antigo continua na agenda');
});

prova('escolher pelo toque grava o plano; o telefone tem WhatsApp à esquerda e copiar à direita (✓ «Copiado» por 2 s)', async () => {
  const valores = { nome: 'Biscoito', raca: 'SRD', idade: '2 anos', tutor: 'Ciclano Fictício', telefone: '(00) 90000-0000', hora: '10:00', 'vacina-plano': '', 'vermifugo-plano': '', 'carrapaticida-plano': '',
    'vacina-detalhe': '', 'vermifugo-detalhe': '', 'carrapaticida-detalhe': 'Produto Y', experiencia: '', saude: '', observacoes: '', 'pagamento-recebido': false };
  const form = { closest() { return this; }, getAttribute: (n) => n === 'data-am-form' ? 'novo' : null,
    querySelector(sel) { const m = /^\[name="(.+)"\]$/.exec(sel); if (!m || !(m[1] in valores)) return null; const k = m[1]; return { get value() { return valores[k]; }, set value(v) { valores[k] = v; }, checked: valores[k] === true }; } };
  const botao = (k, v) => ({ closest(sel) { return sel === 'form[data-am-form]' ? form : this; }, hasAttribute: (n) => n === 'data-am-plano', getAttribute: (n) => n === 'data-am-plano' ? k : n === 'data-v' ? v : null });
  let pedido = null; const raiz = { innerHTML: '', h: {}, ownerDocument: { activeElement: null }, addEventListener(n, f) { this.h[n] = f; }, removeEventListener() {}, contains: () => true, querySelector: () => null, querySelectorAll: () => [] };
  AP.montar(raiz, { dia: HOJE, carregar: () => Promise.resolve({ dia: HOJE, estado: 'pronto', itens: [] }), salvar(p) { pedido = p; return new Promise(() => {}); } });
  await tick();
  raiz.h.submit({ target: form, preventDefault() {} }); await tick();
  assert.equal(pedido, null, 'sem as escolhas nada vai ao banco');
  assert.match(raiz.innerHTML, /Escolha Em dia ou Vai fazer na Zêluz em Vacina\./);
  raiz.h.click({ target: botao('vacina', 'em_dia') });
  raiz.h.click({ target: botao('vermifugo', 'na_zeluz') });
  raiz.h.click({ target: botao('carrapaticida', 'na_zeluz') });
  assert.equal(valores['vacina-plano'], 'em_dia'); assert.equal(valores['vermifugo-plano'], 'na_zeluz');
  raiz.h.submit({ target: form, preventDefault() {} }); await tick();
  assert.equal(pedido, null, '«Vai fazer na Zêluz» sem o «Qual?» ainda não salva');
  valores['vermifugo-detalhe'] = 'Produto X';
  raiz.h.submit({ target: form, preventDefault() {} }); await tick();
  assert.ok(pedido, 'com as três escolhas salva');
  assert.deepEqual(pedido.avaliacao.vacina, { conferido: true, plano: 'em_dia', detalhe: '' });
  assert.deepEqual(pedido.avaliacao.vermifugo, { conferido: false, plano: 'na_zeluz', detalhe: 'Produto X' });
  assert.equal(pedido.avaliacao.idade, '2 anos');

  const contato = AP.contatoHTML('+5500900000000', 'r1', 'avaliacao');
  assert.match(contato, /<div class="am171__tel-box"><a class="am171__tel-wa" data-am-wa href="https:\/\/wa\.me\/5500900000000" target="_blank" rel="noopener noreferrer" aria-label="Abrir o WhatsApp do tutor"><svg/);
  assert.match(contato, /<span class="am171__tel-ok" role="status">Copiado<\/span><button type="button" class="am171__btn-icone" data-am-copiar-telefone="r1" aria-label="Copiar telefone">/);
  const campo = AP.formHTML({ telefone: '+5500900000000' }, '');
  assert.match(campo, /<a class="am171__tel-wa" data-am-wa href="https:\/\/wa\.me\/5500900000000"[^>]*>.*<\/a><input class="cad-in" id="am-telefone-novo" inputmode="tel" autocomplete="off" name="telefone" required maxlength="24" type="tel" value="\+5500900000000"><span class="am171__tel-ok" role="status">Copiado<\/span><button type="button" class="am171__btn-icone" data-am-copiar-campo aria-label="Copiar telefone">/, 'o campo continua editável, com o WhatsApp antes do DDD e o copiar depois');

  const copiados = [], classes = new Set(), caixa = { classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) }, querySelector: (s) => s === 'input[name="telefone"]' ? { value: ' (00) 90000-0000 ' } : null };
  const raiz2 = { innerHTML: '', h: {}, ownerDocument: { activeElement: null }, addEventListener(n, f) { this.h[n] = f; }, removeEventListener() {}, contains: () => true, querySelector: () => null, querySelectorAll: () => [] };
  AP.montar(raiz2, { dia: HOJE, carregar: () => Promise.resolve({ dia: HOJE, estado: 'pronto', itens: [] }), copiarTexto: (t) => { copiados.push(t); return Promise.resolve(); } });
  await tick();
  raiz2.h.click({ target: { closest: (s) => s === '.am171__tel-box' ? caixa : { hasAttribute: (n) => n === 'data-am-copiar-campo', closest: (x) => x === '.am171__tel-box' ? caixa : null } } });
  await tick(); await tick();
  assert.deepEqual(copiados, ['(00) 90000-0000']);
  assert.equal(classes.has('copiado'), true, 'o ícone vira ✓ e aparece «Copiado»');
});

/* ================================ 2. MÁRCIA GESTÃO ================================ */
async function cenarioMarcia() {
  const db = new BancoFalso(), am = agendaDados(db), dia = HOJE;
  const criado = await am.salvar({ acao: 'criar', dia, requestId: 'gestao-1', avaliacao: AP.validar(cadastro()).valor });
  db.gravar('daycare/dashboard/' + dia + '/avaliacao/antigo', { valor: 'Amora / Pinscher', hora: '14:00', det: { agendaMarcia: true, avaliacao129: { versao: 131, tutor: 'Beltrana Fictícia', telefone: '+5500900000003', revisao: 2,
    vacina: { conferido: false, plano: 'antes', detalhe: 'V10' }, vermifugo: { conferido: true }, carrapaticida: { conferido: false, plano: 'a_conferir' }, historico: [{ revisao: 2, acao: 'criar' }] } } });
  db.gravar('daycare/dashboard/' + dia + '/avaliacao/manual', { valor: 'Farofa / SRD', hora: '16:00', det: { fora_do_cadastro: true } });
  const md = marciaDados(db), snap = await md.carregar(dia);
  return { db, am, md, dia, criado, snap, idDe: (nome) => snap.agenda.itens.find((x) => x.nome === nome).id };
}

prova('agenda do dia: «Em dia» marcado; «na Zêluz» e os antigos abertos, «a revisar»; a faixa conta o que falta', async () => {
  const { snap } = await cenarioMarcia();
  const conta = MP.contarCuidados171(snap.agenda.itens);
  assert.deepEqual(conta, { avaliacoes: 3, revisar: 5, alertas: 0 }, '2 do Biscoito + 3 da Amora; o lançado à mão não conta');
  const tela = MP.desenhar(snap, { dia: HOJE });
  assert.match(tela, /<p class="m171__faixa m171__faixa--atencao" role="status">Hoje: 3 avaliações · 5 cuidados para revisar antes <a href="#" data-m171-ir="pend">Ir ao primeiro em aberto<\/a><\/p>/);
  assert.match(tela, /<li class="m171__it is-feito"><span class="m171__caixa ok" aria-hidden="true">✓<\/span><div class="m171__txt"><strong>Vacina<\/strong><small>Em dia<\/small><\/div><\/li>/);
  assert.match(tela, /<strong>Vermífugo<\/strong><small>Vai fazer na Zêluz<\/small><p class="m171__qual">Qual: Produto X, 2ª dose<\/p><span class="m171__pend">Revisar antes da avaliação<\/span>/);
  assert.match(tela, /Registro antigo: «Vai fazer antes da avaliação» — a revisar · V10/);
  assert.match(tela, /Registro antigo: «A conferir» — a revisar/);
  assert.match(tela, /Registro antigo sem escolha \(Em dia, origem não registrada\) — a revisar/);
  assert.match(tela, /Lançado fora da Agenda Márcia: confira na ficha\./);
  assert.match(tela, /SRD · 2 anos · Ciclano Fictício/, 'a idade aparece no resumo');
  assert.match(tela, /class="m171__tel-wa" href="https:\/\/wa\.me\/5500900000000"/, 'telefone no mesmo box');
});

prova('Revisei → Feito → reação → Tutor avisado, no MESMO registro, sem apagar nada nem mexer na revisão do cadastro', async () => {
  const { db, am, md, dia, criado, idDe } = await cenarioMarcia(), id = idDe('Biscoito'), caminho = 'daycare/dashboard/' + dia + '/avaliacao/' + criado.id;
  const antes = db.ler(caminho);
  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'vermifugo', acao: 'feito', feito: { oQue: 'x', usado: 'y', reacoes: ['bem'] } }), /REVISAR_ANTES/);
  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'vacina', acao: 'revisar' }), /CUIDADO_EM_DIA/);
  await assert.rejects(md.salvarCuidado({ dia, id: idDe('Farofa'), cuidado: 'vacina', acao: 'revisar' }), /CUIDADO_FORA_DA_AGENDA/);
  const r1 = await md.salvarCuidado({ dia, id, cuidado: 'vermifugo', acao: 'revisar' });
  assert.equal(r1.ok, true);
  const rev = db.ler(caminho).det.avaliacao129.vermifugo.revisao;
  assert.equal(rev.por, AUTOR.nome); assert.equal(rev.porId, AUTOR.id); assert.ok(rev.em > 0);
  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'vermifugo', acao: 'revisar' }), /CUIDADO_JA_REVISADO/);
  await md.salvarCuidado({ dia, id, cuidado: 'carrapaticida', acao: 'revisar' });
  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'carrapaticida', acao: 'feito', feito: { oQue: 'Carrapaticida aplicado', usado: 'Produto Y', reacoes: ['bem'] } }), /QTD_INVALIDO/, 'no carrapaticida a quantidade é obrigatória');
  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'carrapaticida', acao: 'feito', feito: { oQue: 'a', usado: 'b', qtd: 'PIPETA', reacoes: ['bem', 'dor'] } }), /REACOES_INVALIDAS/);
  await md.salvarCuidado({ dia, id, cuidado: 'carrapaticida', acao: 'feito', feito: { oQue: 'Carrapaticida aplicado', usado: 'Produto Y', qtd: 'PIPETA', reacoes: ['bem'] } });
  const r2 = await md.salvarCuidado({ dia, id, cuidado: 'vermifugo', acao: 'feito', feito: { oQue: 'Vermífugo dado', usado: 'Produto X, 1 comprimido', reacoes: ['vomito'], obs: 'vomitou uma vez, 20 min depois' } });
  assert.equal(MP.estadoCuidado171(r2.agenda.vermifugo), 'alerta');
  const depois = db.ler(caminho), a = depois.det.avaliacao129;
  assert.deepEqual(Object.keys(a.vermifugo).sort(), ['conferido', 'detalhe', 'feito', 'plano', 'revisao']);
  assert.equal(a.vermifugo.feito.oQue, 'Vermífugo dado'); assert.deepEqual(a.vermifugo.feito.reacoes, ['vomito']); assert.equal(a.vermifugo.feito.por, AUTOR.nome);
  assert.equal(a.carrapaticida.feito.qtd, 'PIPETA');
  assert.equal(a.revisao, antes.det.avaliacao129.revisao, 'a revisão do cadastro não muda: o formulário aberto continua valendo');
  assert.deepEqual(a.historico, antes.det.avaliacao129.historico, 'o histórico não perde nada');
  for (const k of ['nome', 'raca', 'idade', 'tutor', 'telefone', 'hora', 'pagamento']) assert.deepEqual(a[k], antes.det.avaliacao129[k], 'mantém ' + k);
  assert.deepEqual(a.vacina, antes.det.avaliacao129.vacina);
  let snapA; am.observar(dia, (s) => { snapA = s; });
  assert.equal(snapA.itens.find((x) => x.id === criado.id).fingerprint, criado.item.fingerprint, 'o carimbo da Agenda Márcia não muda');

  const snap2 = await md.carregar(dia), item = snap2.agenda.itens.find((x) => x.id === id);
  assert.deepEqual(MP.contarCuidados171(snap2.agenda.itens), { avaliacoes: 3, revisar: 3, alertas: 1 });
  const tela = MP.desenhar(snap2, { dia: HOJE, mensagensAbertas: { [id + '|vermifugo']: true } });
  assert.match(tela, /Hoje: 3 avaliações · 3 cuidados para revisar antes · 1 alerta de reação <a href="#" data-m171-ir="alerta">Ir ao alerta<\/a>/);
  assert.match(tela, /<span class="m171__tag-alerta">Atenção: reação — avisar o tutor<\/span>/);
  assert.match(tela, /Feito por Márcia Fictícia às \d\d:\d\d · Vermífugo dado · vômito/);
  assert.match(tela, /Feito por Márcia Fictícia às \d\d:\d\d · Carrapaticida aplicado · sem reação<\/p><p class="m171__usado">Usado: Produto Y · Pipeta \(o tubo inteiro\)<\/p>/);
  assert.match(tela, /<span class="m171__pilula">texto a aprovar<\/span>/);
  const msg = MP.mensagemReacao171(item, 'vermifugo', item.vermifugo.feito);
  assert.equal(msg, 'Olá, Ciclano! Aqui é a Márcia, da Zêluz.\nHoje, na avaliação, Biscoito recebeu vermífugo: Vermífugo dado (Produto X, 1 comprimido).\nDepois, apresentou: vômito. Observação: vomitou uma vez, 20 min depois.\nEstamos acompanhando de perto. Se notar algo diferente em casa, é só falar com a gente.');
  assert.ok(tela.includes('href="https://wa.me/5500900000000?text=' + encodeURIComponent(msg) + '"'), '«Abrir no WhatsApp» com o texto');
  assert.doesNotMatch(msg, /\b(cão|cachorro|cãozinho|baia|soltar|solto)\b/i);
  assert.ok(/texto a aprovar/i.test(fs.readFileSync(path.resolve(__dirname, '../auaulandia/marcia129/painel.js'), 'utf8')), 'o código marca o texto como «a aprovar»');

  await assert.rejects(md.salvarCuidado({ dia, id, cuidado: 'carrapaticida', acao: 'tutor_avisado' }), /SEM_REACAO/);
  await md.salvarCuidado({ dia, id, cuidado: 'vermifugo', acao: 'tutor_avisado' });
  const snap3 = await md.carregar(dia);
  assert.equal(MP.estadoCuidado171(snap3.agenda.itens.find((x) => x.id === id).vermifugo), 'avisado');
  assert.deepEqual(MP.contarCuidados171(snap3.agenda.itens), { avaliacoes: 3, revisar: 3, alertas: 0 });
  assert.match(MP.desenhar(snap3, { dia: HOJE }), /<span class="m171__rev">Tutor avisado por Márcia Fictícia às \d\d:\d\d<\/span>/);
});

prova('na tela: «Revisei», «Feito» abre o registro com chips e «Salvar o que foi feito» manda tudo; falta, não manda', async () => {
  const item = { id: 'avaliacao-teste', codigoOrigem: 'reg-1', hora: '10:00', nome: 'Biscoito', raca: 'SRD', tutor: 'Ciclano Fictício', telefone: '+5500900000000', agendaMarcia: true, pagamento: { recebido: false, valorCent: 0 },
    vacina: { conferido: true, plano: 'em_dia' }, vermifugo: { conferido: false, plano: 'na_zeluz', detalhe: 'Produto X' }, carrapaticida: { conferido: false, plano: 'na_zeluz', detalhe: 'Produto Y', revisao: { por: 'Márcia Fictícia', em: 1 } },
    observacoes: [], conferencia: { tutor: 'Ciclano Fictício', revisao: 1 } };
  const pronto = (itens) => ({ estado: 'pronto', itens: itens || [] });
  const snap = { dia: HOJE, agenda: pronto([item]), quantidades: { estado: 'pronto' }, faltas: pronto(), novatos: pronto(), comida: pronto(), saude: pronto(), tempos: pronto(), tarefas: pronto() };
  const pedidos = []; const raiz = { innerHTML: '', h: {}, ownerDocument: { activeElement: null }, addEventListener(n, f) { this.h[n] = f; }, removeEventListener() {}, contains: () => true, querySelector: () => null, querySelectorAll: () => [] };
  MP.montar(raiz, { dia: HOJE, carregar: () => Promise.resolve(snap), salvarTarefa: () => Promise.resolve(), salvarCuidado: (p) => { pedidos.push(p); return new Promise(() => {}); } });
  await tick();
  const alvo = (attrs) => ({ disabled: false, closest() { return this; }, hasAttribute: (n) => n in attrs, getAttribute: (n) => n in attrs ? attrs[n] : null });
  raiz.h.click({ target: alvo({ 'data-m171-acao': 'revisar', 'data-m171': 'avaliacao-teste|vermifugo' }) });
  await tick();
  assert.deepEqual(pedidos[0], { dia: HOJE, id: 'avaliacao-teste', cuidado: 'vermifugo', acao: 'revisar' });
  assert.match(raiz.innerHTML, /Salvando…/);
  raiz.h.click({ target: alvo({ 'data-m171-acao': 'feito', 'data-m171': 'avaliacao-teste|carrapaticida' }) });
  assert.match(raiz.innerHTML, /Carrapaticida: registrar o que foi feito/);
  assert.match(raiz.innerHTML, /O que foi feito/); assert.match(raiz.innerHTML, /Quanto foi usado/); assert.match(raiz.innerHTML, /Como o peludinho ficou depois/);
  for (const t of ['Pipeta (o tubo inteiro)', '½ comprimido', '1 comprimido', '2 comprimidos', 'Bem, sem reação', 'Dor', 'Vômito', 'Diarreia', 'Outro']) assert.ok(raiz.innerHTML.includes('>' + t + '</button>'), 'chip ' + t);
  raiz.h.click({ target: alvo({ 'data-m171-acao': 'salvar-feito', 'data-m171': 'avaliacao-teste|carrapaticida' }) });
  await tick();
  assert.equal(pedidos.length, 1, 'com campos faltando nada é enviado');
  assert.match(raiz.innerHTML, /Falta: o que foi feito; o que foi usado; quanto foi usado; como o peludinho ficou depois\./);
  raiz.h.input({ target: alvo({ 'data-m171-campo': 'avaliacao-teste|carrapaticida', 'data-f': 'oQue', value: 'Carrapaticida aplicado' }) });
  raiz.h.input({ target: Object.assign(alvo({ 'data-m171-campo': 'avaliacao-teste|carrapaticida', 'data-f': 'usado' }), { value: 'Produto Y' }) });
  raiz.h.input({ target: Object.assign(alvo({ 'data-m171-campo': 'avaliacao-teste|carrapaticida', 'data-f': 'oQue' }), { value: 'Carrapaticida aplicado' }) });
  raiz.h.click({ target: alvo({ 'data-m171-chip': 'avaliacao-teste|carrapaticida', 'data-f': 'qtd', 'data-v': 'PIPETA' }) });
  raiz.h.click({ target: alvo({ 'data-m171-chip': 'avaliacao-teste|carrapaticida', 'data-f': 'reacao', 'data-v': 'dor' }) });
  assert.match(raiz.innerHTML, /<div class="m171__obs">/, 'com reação aparece a observação');
  raiz.h.input({ target: Object.assign(alvo({ 'data-m171-campo': 'avaliacao-teste|carrapaticida', 'data-f': 'obs' }), { value: 'Coçou o local' }) });
  raiz.h.click({ target: alvo({ 'data-m171-acao': 'salvar-feito', 'data-m171': 'avaliacao-teste|carrapaticida' }) });
  await tick();
  assert.deepEqual(pedidos[1], { dia: HOJE, id: 'avaliacao-teste', cuidado: 'carrapaticida', acao: 'feito', feito: { oQue: 'Carrapaticida aplicado', usado: 'Produto Y', qtd: 'PIPETA', reacoes: ['dor'], obs: 'Coçou o local' } });
});

/* =================================== 3. CONTADORES =================================== */
function empListaDoApp() {
  const ini = html.indexOf('  function empLista(){'), fim = html.indexOf('  // Mensagem pronta para o tutor', ini);
  assert.ok(ini > 0 && fim > ini, 'empLista no app');
  return html.slice(ini, fim);
}
prova('menu: «Márcia Gestão» conta não revisados + reações sem aviso; «Quem não comeu hoje» conta os de hoje ainda não avisados; some no zero', async () => {
  const m = html.match(/<script id="menu-contadores171">([\s\S]*?)<\/script>/); assert.ok(m, 'script do menu');
  const env = await cenarioMarcia(), db = env.db, dia = env.dia, marcas = [], intervalos = [];
  db.gravar('daycare/almoco/' + dia, { 'biscoito__ciclano': 'nao', 'amora__beltrana': 'metade', 'farofa__fulana': 'tudo' });
  db.gravar('daycare/atividade/' + dia + '/almoco2', { 'biscoito__ciclano': 'nao' });
  db.gravar('daycare/avisos-comida/' + dia, {});
  db.leituras.length = 0;
  const link = { style: {} };
  const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Set, Map, setTimeout, clearTimeout,
    setInterval: (f, ms) => { intervalos.push(ms); return 0; }, DB: db, usuarioAtual: () => ({ id: 'x', nome: 'Gestão Fictícia' }), podePapel: (c) => c === 'painel-operacao',
    getComputedStyle: () => ({ display: 'flex' }), document: { readyState: 'complete', querySelector: (s) => /gestaomarcia|emporio/.test(s) ? link : null, body: {} },
    navPend: (view, n, titulo) => marcas.push([view, n, titulo]), navPendSubirParaOPai: () => {}, empDataKey: () => dia,
    ZeluzMarciaDados129: MD, ZeluzMarcia129: MP, EMP_AVISOS: {}, atualizacoes: 0 };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext('var EMP_AVISOS={};function atualizarPendenciasNav(){atualizacoes++;}', ctx);
  vm.runInContext(m[1], ctx);
  assert.deepEqual(intervalos, [30000]);
  const ultima = (v) => marcas.filter((x) => x[0] === v).at(-1);
  assert.equal(ultima('gestaomarcia')[1], 5);
  assert.match(ultima('gestaomarcia')[2], /5 cuidados para revisar/);
  assert.deepEqual([...new Set(db.leituras)].sort(), ['daycare/almoco/' + dia, 'daycare/atividade/' + dia + '/almoco2', 'daycare/avisos-comida/' + dia, 'daycare/dashboard/' + dia + '/avaliacao'].sort(), 'só os nós do dia');
  // a Márcia revisa e registra uma reação: o número acompanha o banco
  await env.md.salvarCuidado({ dia, id: env.idDe('Biscoito'), cuidado: 'vermifugo', acao: 'revisar' });
  assert.equal(ultima('gestaomarcia')[1], 4);
  await env.md.salvarCuidado({ dia, id: env.idDe('Biscoito'), cuidado: 'vermifugo', acao: 'feito', feito: { oQue: 'Vermífugo dado', usado: 'Produto X', reacoes: ['diarreia'] } });
  assert.equal(ultima('gestaomarcia')[1], 5, '4 a revisar + 1 alerta');
  assert.match(ultima('gestaomarcia')[2], /1 alerta de reação/);
  await env.md.salvarCuidado({ dia, id: env.idDe('Biscoito'), cuidado: 'vermifugo', acao: 'tutor_avisado' });
  assert.equal(ultima('gestaomarcia')[1], 4);
  const base = 'daycare/dashboard/' + dia + '/avaliacao/';
  db.gravar(base + 'antigo', null); db.gravar(base + env.criado.id, null);
  assert.equal(ultima('gestaomarcia')[1], 0, 'zero: navPend(…, 0) tira o número');
  // Quem não comeu: os dados do dia vão para a conta do app (empLista), que só conta quem ainda não foi avisado
  assert.deepEqual(ctx.__empAlm1, db.ler('daycare/almoco/' + dia)); assert.deepEqual(ctx.__empAlm2, db.ler('daycare/atividade/' + dia + '/almoco2'));
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(ctx.atualizacoes >= 1, 'o menu refaz a conta (uma vez, logo depois de a grade parar de mudar)');
  const turma = [{ p: { n: 'Biscoito', tutor: 'Ciclano' } }, { p: { n: 'Amora', tutor: 'Beltrana' } }, { p: { n: 'Farofa', tutor: 'Fulana' } }];
  vm.runInContext('function turmaDoDia(){return __turma;}function dcKey(n,t){return (n+"__"+t).toLowerCase();}function pelExtra(){return {};}function jsNorm(s){return String(s);}var __turma=[];' + empListaDoApp(), ctx);
  ctx.__turma = turma;
  const naoAvisados = () => vm.runInContext('empLista().filter(function(x){return !x.aviso;}).length', ctx);
  assert.equal(naoAvisados(), 2, 'Biscoito não comeu e Amora comeu metade');
  db.gravar('daycare/avisos-comida/' + dia + '/biscoito__ciclano', { quem: 'Consultora Fictícia', ts: 1 });
  assert.equal(naoAvisados(), 1, 'avisado sai da conta');
});

/* =================================== 4. ZELOZINHA =================================== */
function script(id) { const mm = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(mm, 'script ' + id); return mm[1]; }
function zCtx() { const c = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Set, Map, setTimeout, clearTimeout }; c.window = c; c.globalThis = c; vm.createContext(c); vm.runInContext(script('zelozinha-ficha171'), c); return c; }

prova('Zelozinha: mensagem APROVADA ao tutor, com artigo, nomes e «feito/feita» certos', () => {
  const Z = zCtx().ZelozinhaFicha171;
  assert.equal(Z.mensagem({ tutor: 'Ciclano Fictício', pet: 'Biscoito', sexo: 'M' }, 'verm_p', '2026-10-20', '2027-02-17'),
    'Obrigada, Ciclano! 💛\nJá atualizamos a ficha do Biscoito: o vermífugo foi feito em 20/10/2026 e o próximo é em 17/02/2027.\nQuando estiver chegando perto, a gente avisa por aqui.');
  assert.equal(Z.mensagem({ tutor: 'Beltrana', pet: 'Amora', sexo: 'F' }, 'verm_dose2_p', '2026-10-20', '2027-02-17'),
    'Obrigada, Beltrana! 💛\nJá atualizamos a ficha da Amora: a 2ª dose do vermífugo foi feita em 20/10/2026 e o próximo é em 17/02/2027.\nQuando estiver chegando perto, a gente avisa por aqui.');
  assert.match(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca' }, 'vac_mult_p', '2026-10-20', '2027-10-20'), /a ficha de Paçoca: a vacina múltipla foi feita em 20\/10\/2026/);
  assert.match(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca', sexo: 'Fêmea' }, 'vac_raiva_p', '2026-10-20', '2027-10-20'), /ficha da Paçoca: a vacina antirrábica foi feita/);
  assert.match(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca', sexo: 'Macho' }, 'vac_gripe_p', '2026-10-20', '2027-10-20'), /ficha do Paçoca: a vacina contra gripe foi feita/);
  assert.match(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca' }, 'ecto_p', '2026-10-20', '2026-11-19'), /a proteção contra pulgas e carrapatos foi feita em 20\/10\/2026 e o próximo é em 19\/11\/2026\./);
  assert.match(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca' }, 'col_p', '2026-10-20', '2027-02-17'), /a coleira repelente foi feita/);
  assert.equal(Z.mensagem({ tutor: 'Fulana', pet: 'Paçoca' }, 'escova_p', '2026-10-20', '2027-01-20'), '', 'cuidado sem nome aprovado: sem mensagem');
  assert.equal(Z.mensagem({ tutor: '', pet: 'Paçoca' }, 'verm_p', '2026-10-20', '2027-02-17'), '', 'sem o nome do tutor não inventa destinatário');
});

prova('Zelozinha: os nomes e artigos são os de mensagem-unica41 (bloco aprovado, intacto)', () => {
  const ini = html.indexOf('/* mensagem-unica41/index.js */'), fim = html.indexOf('/* agrupador42/index.js */', ini), bloco = html.slice(ini, fim);
  const sha = require('node:crypto').createHash('sha256').update(bloco).digest('hex');
  const mestre = require('node:child_process').spawnSync('git', ['show', '83d1740:auaulandia/index.html'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (mestre.status === 0) { const i2 = mestre.stdout.indexOf('/* mensagem-unica41/index.js */'), f2 = mestre.stdout.indexOf('/* agrupador42/index.js */', i2); assert.equal(sha, require('node:crypto').createHash('sha256').update(mestre.stdout.slice(i2, f2)).digest('hex'), 'mensagem-unica41 não mudou uma letra'); }
  const nomes = vm.runInNewContext('(' + bloco.match(/const NOMES = Object\.freeze\((\{[\s\S]*?\})\);/)[1] + ')');
  const artigos = vm.runInNewContext('(' + bloco.match(/const ARTIGOS = Object\.freeze\((\{[\s\S]*?\})\);/)[1] + ')');
  const Z = zCtx().ZelozinhaFicha171;
  const j = (v) => JSON.parse(JSON.stringify(v));
  assert.deepEqual(j(Z.NOMES), j(nomes));
  assert.deepEqual(j(Z.ARTIGOS), j(Object.fromEntries(Object.entries(artigos).map(([k, v]) => [k, v.toLowerCase()]))));
});

prova('Zelozinha: a ficha já tem a data? e o próximo que ela guarda; o bloco verde com selo, mensagem e «Corrigir a data»', () => {
  const Z = zCtx().ZelozinhaFicha171;
  assert.equal(Z.fichaTemData({ verm_t: '2026-10-20' }, 'verm_p', '2026-10-20'), true);
  assert.equal(Z.fichaTemData({ vermifugo_t: '2026-10-20' }, 'verm_p', '2026-10-20'), true, 'campo antigo');
  assert.equal(Z.fichaTemData({ verm_t: '2026-09-01' }, 'verm_p', '2026-10-20'), false);
  assert.equal(Z.fichaTemData({ verm_dose2_t: '2026-10-20' }, 'verm_dose2_p', '2026-10-20'), true);
  assert.equal(Z.proximoDe({ verm_dose2_p: 'x', verm_p: '2027-02-17' }, 'verm_dose2_p'), '2027-02-17', 'a 2ª dose leva ao próximo vermífugo');
  assert.equal(Z.proximoDe({ ecto_p: '2026-11-19' }, 'ecto_p'), '2026-11-19');
  const h = Z.resultadoHTML({ indice: 0, cuidado: 'Vermífugo — 2ª dose', data: '2026-10-20', proximo: '2027-02-17', texto: 'Texto <aprovado>', temTelefone: true });
  assert.match(h, /✓ Ficha atualizada — Vermífugo — 2ª dose feito em 20\/10\/2026 · próximo em 17\/02\/2027/);
  assert.match(h, /EM DIA ATÉ 17\/02\/2027/);
  assert.match(h, /data-zt694-acao="copiar">Copiar mensagem<\/button><button type="button" class="btn zt694-acao" data-zt694-acao="whats-texto">Abrir no WhatsApp<\/button>/);
  assert.match(h, /Texto &lt;aprovado&gt;/);
  assert.match(h, /data-zt694-acao="corrigir-data171" data-zt694-ciclo="0">Corrigir a data<\/button>/);
  assert.match(Z.resultadoHTML({ indice: 0, cuidado: 'x', data: '2026-10-20', proximo: '2027-02-17', texto: 't', temTelefone: false }), /Sem telefone na ficha: use Copiar\./);
});

/* O «Tutor já fez» de verdade: o clique, a resposta, o formulário de sempre e o MESMO prevLancar do «Salvar». */
function zelozinhaUI() {
  const ctx = zCtx();
  vm.runInContext(script('zelozinha-tela94-puro'), ctx);
  const ui = script('zelozinha-contatos89-ui'), corte = ui.indexOf('  var baseAtualizar=window.zPainel44Atualizar;');
  assert.ok(corte > 0);
  const ficha = { sexo: 'M' }, chamadas = { prevLancar: [], abrir: [], responder: [] };
  Object.assign(ctx, { DB: null, VENC_PEND: null, document: { querySelectorAll: () => [], querySelector: (s) => /data-zt694-care|data-zt694-pet/.test(s) ? { querySelector: () => ({ querySelector: () => null }) } : null },
    pelExtra: () => ficha, poTelDoTutor: () => '(00) 90000-0000', ZeluzResposta88: { normalizarConfirmacaoTutor137: (meta) => meta, codificarChave: (k) => k },
    __ficha: ficha, __chamadas: chamadas, __resultado: { ok: true } });
  ctx.prevLancar = (pk, k) => { chamadas.prevLancar.push([pk, k]); if (ctx.__resultado.ok) { ficha.verm_t = '2026-10-20'; ficha.verm_p = '2027-02-17'; } return Promise.resolve(ctx.__resultado); };
  const exportar = `
  redesenharLinha=function(){};
  vmCuidado=function(c,cy){return {cy:cy,atual:c.__rv||null,valor:c.__rv?'autorizar_externo':'',st:{rotulo:'',categoria:'neutro'}};};
  confirmacaoTutorDe137=function(rv){return rv&&rv.confirmacaoTutor137||null;};
  responder=async function(c,idxs,valor,el,extra){window.__chamadas.responder.push([valor,extra.confirmacaoTutor137.dataAplicacao]);c.__rv={decisao:'autorizar',origem:'externo',confirmacaoTutor137:extra.confirmacaoTutor137};};
  abrirFichaTutor138=async function(c,v,i,care){window.__chamadas.abrir.push([c.dcKey,i,v.cy.itemK]);window.Z138_FICHA_SELECAO={dcKey:c.dcKey,cycleKey:v.cy.cycleKey,itemK:v.cy.itemK,pelKey:c.pelKey,dataAplicacao:v.atual.confirmacaoTutor137.dataAplicacao};return true;};
  window.__ui171={estado:estado,aoClicar:aoClicar,ficha171De:ficha171De,fichaDepoisTutorFez171:fichaDepoisTutorFez171,caixasDe:caixasDe};
})();`;
  vm.runInContext(ui.slice(0, corte) + exportar, ctx);
  return { ctx, ui: ctx.__ui171, ficha, chamadas };
}

prova('Zelozinha: «Tutor já fez» registra a resposta e já atualiza a ficha pelo prevLancar; depois mostra o verde e a mensagem aprovada', async () => {
  const { ctx, ui, chamadas } = zelozinhaUI();
  const dc = 'biscoito__ciclano', cy = { cycleKey: 'ciclo-ficticio', itemK: 'verm_p', care: 'vermifugo', nome: 'Vermífugo' };
  const card = { dia: '2026-10-30', dcKey: dc, pelKey: 'biscoito__ciclano', petId: 'p', tutorId: 't', row: { p: { n: 'Biscoito', tutor: 'Ciclano Fictício' } }, cadastro: { tutor: 'Ciclano Fictício' }, ciclos: [cy] };
  ui.estado.itens[dc] = card;
  const campo = { value: '2026-10-20' }, care = { querySelector: (s) => s === '[data-zt694-data-fez]' ? campo : null, getAttribute: () => '0' }, art = { getAttribute: () => encodeURIComponent(dc) };
  const botao = { disabled: false, getAttribute: (n) => n === 'data-zt694-acao' ? 'tutor-fez' : n === 'data-zt694-ciclo' ? '0' : '', closest: (s) => s === '[data-zt694-acao]' ? botao : s === '[data-zt694-care]' ? care : s === '[data-zt694-pet]' ? art : null };
  ui.aoClicar({ target: botao, preventDefault() {}, stopPropagation() {} });
  for (let i = 0; i < 20; i++) await tick();
  const j = (v) => JSON.parse(JSON.stringify(v));
  assert.deepEqual(j(chamadas.responder), [['autorizar_externo', '2026-10-20']], 'a resposta é registrada como antes');
  assert.deepEqual(j(chamadas.abrir), [[dc, 0, 'verm_p']], 'abre o formulário de sempre da ficha');
  assert.deepEqual(j(chamadas.prevLancar), [['biscoito__ciclano', 'verm_p']], 'e grava pelo MESMO prevLancar do «Salvar»');
  const f = ui.ficha171De(card, cy, card.__rv.confirmacaoTutor137, 0);
  assert.equal(f.ok, true);
  assert.match(f.html, /✓ Ficha atualizada — Vermífugo feito em 20\/10\/2026 · próximo em 17\/02\/2027/);
  assert.match(f.html, /EM DIA ATÉ 17\/02\/2027/);
  assert.ok(f.html.includes('Obrigada, Ciclano! 💛\nJá atualizamos a ficha do Biscoito: o vermífugo foi feito em 20/10/2026 e o próximo é em 17/02/2027.\nQuando estiver chegando perto, a gente avisa por aqui.'));
  assert.match(f.html, /Abrir no WhatsApp/);
  assert.equal(ui.caixasDe(card, [{ cy, atual: card.__rv, valor: 'autorizar_externo' }]).filter((x) => x.tipo === 'tutor-fez').length, 0, 'a caixa antiga «Vamos atualizar a ficha» sai');
  // «Corrigir a data» volta ao campo
  const corrigir = { disabled: false, getAttribute: (n) => n === 'data-zt694-acao' ? 'corrigir-data171' : n === 'data-zt694-ciclo' ? '0' : '', closest: (s) => s === '[data-zt694-acao]' ? corrigir : s === '[data-zt694-care]' ? care : s === '[data-zt694-pet]' ? art : null };
  ui.aoClicar({ target: corrigir, preventDefault() {}, stopPropagation() {} });
  assert.equal(ui.ficha171De(card, cy, card.__rv.confirmacaoTutor137, 0).ok, false, 'o campo da data volta');
  void ctx;
});

prova('Zelozinha: se a ficha não grava, o erro aparece claro e «Atualizar ficha» fica como plano B', async () => {
  const { ctx, ui, chamadas } = zelozinhaUI();
  ctx.__resultado = { ok: false, erro: 'o banco não confirmou' };
  const dc = 'amora__beltrana', cy = { cycleKey: 'ciclo-2', itemK: 'verm_p', care: 'vermifugo' };
  const card = { dia: '2026-10-30', dcKey: dc, pelKey: 'amora__beltrana', row: { p: { n: 'Amora', tutor: 'Beltrana' } }, cadastro: { tutor: 'Beltrana' }, ciclos: [cy], __rv: { confirmacaoTutor137: { dataAplicacao: '2026-10-20' } } };
  ui.estado.itens[dc] = card;
  const ok = await ui.fichaDepoisTutorFez171(dc, 'ciclo-2', 'verm_p', '2026-10-20');
  assert.equal(ok, false);
  assert.equal(chamadas.prevLancar.length, 1);
  const st = ui.estado.ficha171[dc + '|ciclo-2|verm_p'];
  assert.equal(st.estado, 'falhou');
  assert.match(st.msg, /A ficha não foi atualizada: o banco não confirmou\./);
  assert.match(st.msg, /«Atualizar ficha»/);
  assert.equal(ui.ficha171De(card, cy, card.__rv.confirmacaoTutor137, 0).ok, false, 'sem verde enquanto a ficha não tem a data');
  assert.equal(await ui.fichaDepoisTutorFez171(dc, 'ciclo-2', 'verm_p', '2026-10-21'), false, 'data diferente da registrada: não grava a ficha');
  assert.equal(chamadas.prevLancar.length, 1);
  const fonte = script('zelozinha-contatos89-ui');
  assert.match(fonte, /'<button type="button" class="btn zt694-acao" data-zt694-acao="atualizar-ficha"/, 'o botão «Atualizar ficha» continua no cartão');
});

prova('vocabulário da casa nos textos novos', () => {
  const novos = [fs.readFileSync(path.resolve(__dirname, '../auaulandia/agenda-marcia/painel.js'), 'utf8'), fs.readFileSync(path.resolve(__dirname, '../auaulandia/marcia129/painel.js'), 'utf8'), script('menu-contadores171'), script('zelozinha-ficha171')].join('\n');
  assert.doesNotMatch(novos, /\b(cão|cães|cachorro|cãozinho|baia|soltar|solto)\b/i);
});

(async () => {
  let falhas = 0;
  for (const [nome, fn] of fila) {
    try { await fn(); console.log('ok   ' + nome); }
    catch (e) { falhas++; console.log('FALHA ' + nome + '\n      ' + String(e && e.stack || e).split('\n').slice(0, 6).join('\n      ')); }
  }
  console.log((fila.length - falhas) + ' de ' + fila.length + ' provas passaram.');
  if (falhas) process.exitCode = 1; else console.log('agenda-marcia-tarefas171: OK');
})();
