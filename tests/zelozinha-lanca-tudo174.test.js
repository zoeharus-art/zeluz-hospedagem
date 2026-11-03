'use strict';
/*
 * PROVAS da Story 6.124 — a Zelozinha «lança tudo de uma vez» (Adriana, 03/11/2026): no próprio cuidado, o produto (e o regime) e a data;
 * um toque em «Autorizou pegar na loja», «Trouxe na bolsa» ou «Tutor já fez» deixa a Prevenção da ficha em dia e (loja e bolsa) a linha
 * vai para o Lançamento do dia, sem outra confirmação.
 * Dado 100% inventado: FILHOts «Teste …», tutores «Tutor Teste …», telefones (00) 9xxxx. Nenhum dado de produção, nenhum Firebase,
 * nenhum pedido de rede (todo http(s) é abortado). O banco é um banco de mentira ESPIÃO (o mesmo da 6.94): o que lê e o que grava fica
 * registrado por caminho e por operação (once, set, update, remove, push e transaction).
 *
 * Dois ambientes:
 *   L — Node (vm): as funções puras novas (ZelozinhaLanca174), a validação irmã da 138, o dia de São Paulo perto da meia-noite e o código;
 *   C — Chromium a 375 px (Playwright): o APP REAL (file://) com o banco de mentira por baixo; os toques são cliques de verdade nos botões.
 *       Sem o Playwright/Chromium as provas C dizem PULADO (e não contam como passadas).
 * C11 a C13 (e o fim da C7) vêm da rodada 1 do QA: a rede caindo no meio do toque (o «Atualizar ficha» e o «Salvar» do formulário concluem,
 * em loja, bolsa e «Tutor já fez»), o «Local informado» do formulário, o «Tutor já fez» depois da ficha em dia, o aviso do caractere
 * invisível e o «Atualizados hoje» sem o recibo que não muda nada.
 *
 * Uso:  node tests/zelozinha-lanca-tudo174.test.js
 *       TZ=America/Sao_Paulo node tests/zelozinha-lanca-tudo174.test.js
 *       PROVAS=C2,C7 node tests/zelozinha-lanca-tudo174.test.js   (só estas)
 *       APP174=/caminho/index.html   (outra cópia do app; por exemplo, a do master, para ver as provas marcadas [F] falharem)
 *       APP174_BASE=/caminho/index.html   (o app do master: a C10 compara, caminho por caminho, o que «Vai fazer em casa», «Não respondeu» e
 *                                          «Agendou para» gravam; sem ela, a C10 diz PULADO)
 *       FOTOS174=/pasta   (guarda as fotos do cuidado a 375 px, antes e depois do toque)
 * As cópias do app precisam estar dentro de uma pasta `auaulandia` (o app carrega os módulos ao lado, por caminho relativo).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const APP = process.env.APP174 || path.join(__dirname, '..', 'auaulandia', 'index.html');
const HTML = fs.readFileSync(APP, 'utf8');
const SO = (process.env.PROVAS || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const DIA = '2026-11-03';
const RELOGIO = DIA + 'T10:00:00-03:00';
const FUSO_NAVEGADOR = process.env.TZ === 'America/Sao_Paulo' ? 'America/Sao_Paulo' : 'UTC';

let ok = 0, puladas = 0; const falhas = [];
const fila = [];
function quer(id) { return SO.length === 0 || SO.indexOf(id) >= 0; }
function prova(id, nome, fn, ambiente) { fila.push({ id: id, nome: '6.124 ' + id + ' — ' + nome, fn: fn, ambiente: ambiente || 'L' }); }

// ---------------------------------------------------------------- o banco de mentira ESPIÃO (cópia do da 6.94, tests/zelozinha-tela94.test.js)
function criarBancoFalso(seed, opcoes) {
  opcoes = opcoes || {};
  var arv = seed ? JSON.parse(JSON.stringify(seed)) : {};
  var log = { leituras: [], gravacoes: [], transacoes: [] };
  var ouvintes = [];
  var falhas = [], falhasEscrita = [], calados = [];
  var pend = 0;   /* operações do banco ainda em andamento (só existem com latência): as provas só dão o toque por terminado com zero delas */
  var SV = { '.sv': 'timestamp' };
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function partes(p) { return String(p || '').split('/').filter(function (x) { return x !== ''; }); }
  function pegar(p) {
    var c = arv, ps = partes(p);
    for (var i = 0; i < ps.length; i++) { if (c === null || typeof c !== 'object' || !(ps[i] in c)) return undefined; c = c[ps[i]]; }
    return c;
  }
  function resolverSV(v) {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      Object.keys(v).forEach(function (k) { v[k] = resolverSV(v[k]); });
    }
    return v;
  }
  function podar(ps) {
    for (var n = ps.length; n > 0; n--) {
      var pai = arv, ok = true;
      for (var i = 0; i < n - 1; i++) { pai = pai[ps[i]]; if (!pai || typeof pai !== 'object') { ok = false; break; } }
      if (!ok) return;
      var filho = pai[ps[n - 1]];
      if (filho && typeof filho === 'object' && Object.keys(filho).length === 0) delete pai[ps[n - 1]]; else return;
    }
  }
  /* O Realtime Database de verdade descarta o filho nulo ao gravar (set, update e transaction): o banco de mentira faz o mesmo, senão uma gravação com `origem: null` volta igual e o defeito não aparece (6.97, AC1) */
  function semNulos(x) {
    if (Array.isArray(x)) return x.map(semNulos);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { if (x[k] !== null && x[k] !== undefined) o[k] = semNulos(x[k]); }); return o; }
    return x;
  }
  function por(p, v) {
    var ps = partes(p);
    if (!ps.length) { arv = (v === null || v === undefined) ? {} : semNulos(clone(v)); return; }
    var c = arv;
    for (var i = 0; i < ps.length - 1; i++) { if (c[ps[i]] === null || typeof c[ps[i]] !== 'object') c[ps[i]] = {}; c = c[ps[i]]; }
    if (v === null || v === undefined) { delete c[ps[ps.length - 1]]; podar(ps); } else c[ps[ps.length - 1]] = semNulos(clone(v));
  }
  function snap(v, key) {
    var val = clone(v);
    return {
      key: key, val: function () { return val === undefined ? null : clone(val); }, exists: function () { return val !== undefined && val !== null; },
      forEach: function (fn) { if (val && typeof val === 'object') { Object.keys(val).some(function (k) { return fn(snap(val[k], k)) === true; }); } },
      child: function (c) { var r = val; partes(c).forEach(function (k) { r = (r && typeof r === 'object') ? r[k] : undefined; }); return snap(r, partes(c).pop()); }
    };
  }
  function avisar(p) { ouvintes.slice().forEach(function (o) { if (p === o.path || p.indexOf(o.path + '/') === 0 || o.path.indexOf(p + '/') === 0) { Promise.resolve().then(function () { if (opcoes.cacheFrio && (ouvintes.indexOf(o) < 0 || !o.recebeu)) return; o.fn(snap(pegar(o.path), partes(o.path).pop())); }); } }); }
  /* o aparelho tem o nó guardado: um ouvinte ligado nele ou acima dele já recebeu o 1º valor (6.113) */
  function quente(p) { return ouvintes.some(function (o) { return o.recebeu && (o.path === '' || p === o.path || p.indexOf(o.path + '/') === 0); }); }
  function esperar(v) { if (!opcoes.latencia) return Promise.resolve(v); pend++; return new Promise(function (r) { setTimeout(function () { pend--; r(v); }, typeof opcoes.latencia === 'function' ? opcoes.latencia() : opcoes.latencia); }); }
  /* a ida ao servidor do 1º valor de um ouvinte novo (`cacheFrio`): nunca no mesmo instante, nem com latência zero (no Firebase de verdade é uma volta pela rede);
     senão, quem roda a transação sem esperar o ouvinte passaria por sorte da ordem das promessas */
  function idaAoServidor() { pend++; return new Promise(function (r) { setTimeout(function () { pend--; r(); }, opcoes.latencia ? (typeof opcoes.latencia === 'function' ? opcoes.latencia() : opcoes.latencia) : 0); }); }
  function ref(path) {
    path = partes(path).join('/');
    var r = {
      key: partes(path).pop() || null, path: path,
      child: function (c) { return ref(path + '/' + c); },
      once: function () { log.leituras.push({ op: 'once', path: path }); if (falhas.some(function (f) { return path.indexOf(f) === 0; })) return Promise.reject(new Error('falha de teste em ' + path)); return esperar(snap(pegar(path), r.key)); },
      on: function (ev, fn, cancelar) {
        log.leituras.push({ op: 'on', path: path }); var o = { path: path, fn: fn, recebeu: !opcoes.cacheFrio }; ouvintes.push(o);
        if (!opcoes.cacheFrio) { Promise.resolve().then(function () { fn(snap(pegar(path), r.key)); }); return fn; }
        /* o 1º valor vem do servidor: chega depois da latência, com o que o servidor tem NAQUELA hora (null vale); quem desligou antes não recebe; um nó «calado» não responde nunca;
           num nó com `falhar`, o servidor recusa o ouvinte (o Firebase o tira e chama o cancelamento) */
        if (calados.some(function (c) { return path.indexOf(c) === 0; })) return fn;
        if (falhas.some(function (f) { return path.indexOf(f) === 0; })) { idaAoServidor().then(function () { var i = ouvintes.indexOf(o); if (i < 0) return; ouvintes.splice(i, 1); if (typeof cancelar === 'function') cancelar(new Error('falha de teste em ' + path)); }); return fn; }
        idaAoServidor().then(function () { if (ouvintes.indexOf(o) < 0) return; o.recebeu = true; fn(snap(pegar(path), r.key)); });
        return fn;
      },
      off: function (ev, fn) { ouvintes = ouvintes.filter(function (o) { return !(o.path === path && (!fn || o.fn === fn)); }); },
      set: function (v) { v = resolverSV(clone(v)); log.gravacoes.push({ op: 'set', path: path, valor: clone(v) }); por(path, v); avisar(path); return esperar(); },
      update: function (obj) {
        log.gravacoes.push({ op: 'update', path: path, valor: clone(obj) });
        Object.keys(obj || {}).forEach(function (k) { por(path ? (path + '/' + k) : k, resolverSV(clone(obj[k]))); });
        avisar(path); return esperar();
      },
      remove: function () { log.gravacoes.push({ op: 'remove', path: path }); por(path, null); avisar(path); return esperar(); },
      push: function (v) {
        var k = '-N' + (++contador) + 'x'; var filho = ref(path + '/' + k);
        var pr = (v === undefined) ? Promise.resolve() : filho.set(v); pr.key = k; return pr;
      },
      transaction: function (fn, aoTerminar, aplicarLocal) {
        log.leituras.push({ op: 'transaction', path: path });
        var frio = !!opcoes.cacheFrio && !quente(path), t = { path: path, nArgs: arguments.length, aplicarLocal: aplicarLocal, frio: frio, rodadas: [] };
        log.transacoes.push(t);
        if (falhasEscrita.some(function (f) { return path.indexOf(f) === 0; })) return esperar({ committed: false, snapshot: snap(pegar(path), r.key) });
        var atual = pegar(path), servidor = atual === undefined ? null : clone(atual), local = frio ? null : servidor;
        t.rodadas.push(local === null ? 'null' : 'valor');
        var r2 = fn(clone(local));
        if (r2 === undefined) { t.desistiu = true; return esperar({ committed: false, snapshot: snap(frio ? undefined : atual, r.key) }); }
        if (JSON.stringify(local) !== JSON.stringify(servidor)) {   /* o servidor recusa o palpite feito sobre o retrato velho do aparelho e a função roda de novo com o valor dele */
          t.rodadas.push('valor'); r2 = fn(clone(servidor));
          if (r2 === undefined) { t.desistiu = true; return esperar({ committed: false, snapshot: snap(atual, r.key) }); }
        }
        var novo = resolverSV(clone(r2));
        log.gravacoes.push({ op: 'transaction', path: path, valor: clone(novo) });
        por(path, novo); avisar(path);
        return esperar({ committed: true, snapshot: snap(pegar(path), r.key) });
      },
      orderByKey: function () { return consulta(path, { por: 'key' }); },
      orderByChild: function (c) { return consulta(path, { por: 'child', c: c }); },
      limitToLast: function (n) { return consulta(path, { por: 'key', ultimos: n }); },
      limitToFirst: function (n) { return consulta(path, { por: 'key', primeiros: n }); },
      onDisconnect: function () { return { set: function () { return Promise.resolve(); }, remove: function () { return Promise.resolve(); }, cancel: function () { return Promise.resolve(); } }; }
    };
    return r;
  }
  function consulta(path, q) {
    var c = {
      startAt: function (v) { q.ini = v; return c; }, endAt: function (v) { q.fim = v; return c; }, equalTo: function (v) { q.ini = v; q.fim = v; return c; },
      limitToLast: function (n) { q.ultimos = n; return c; }, limitToFirst: function (n) { q.primeiros = n; return c; },
      orderByKey: function () { q.por = 'key'; return c; }, orderByChild: function (x) { q.por = 'child'; q.c = x; return c; },
      once: function () {
        log.leituras.push({ op: 'once', path: path, consulta: JSON.stringify(q) });
        var base = pegar(path), saida = {};
        if (base && typeof base === 'object') {
          var chaves = Object.keys(base).filter(function (k) {
            var v = q.por === 'child' ? (base[k] && base[k][q.c]) : k;
            if (q.ini !== undefined && !(v >= q.ini)) return false;
            if (q.fim !== undefined && !(v <= q.fim)) return false;
            return true;
          }).sort();
          if (q.ultimos) chaves = chaves.slice(-q.ultimos);
          if (q.primeiros) chaves = chaves.slice(0, q.primeiros);
          chaves.forEach(function (k) { saida[k] = base[k]; });
        }
        return esperar(snap(Object.keys(saida).length ? saida : undefined, partes(path).pop()));
      },
      on: function (ev, fn) { c.once().then(fn); return fn; }, off: function () {}
    };
    return c;
  }
  var contador = 0;
  return { pendentes: function () { return pend; }, falhar: function (prefixos) { falhas = prefixos || []; }, falharEscrita: function (prefixos) { falhasEscrita = prefixos || []; },
    calar: function (prefixos) { calados = prefixos || []; }, ouvintesEm: function (prefixo) { return ouvintes.filter(function (o) { return o.path.indexOf(prefixo) === 0; }).length; }, ref: ref, log: log, arvore: function () { return arv; }, ler: function (p) { return clone(pegar(p)); }, poe: function (p, v) { por(p, v); }, SV: SV };
}

const BANCO_SRC = criarBancoFalso.toString();
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ENC = encodeURIComponent;

// ================================================================= L — Node (vm): as funções puras novas
function script(h, id) { const m = h.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); return m ? m[1] : null; }
function puro174() {
  const src = script(HTML, 'zelozinha-lanca174'); assert.ok(src, 'o script zelozinha-lanca174 existe');
  const c = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Math }; c.window = c; c.globalThis = c; vm.createContext(c); vm.runInContext(src, c);
  return c.ZelozinhaLanca174;
}
const SEL = () => ({ versao: 174, origem: 'loja', dia: DIA, dcKey: 'teste-theo__tutor-teste', pelKey: 'teste theo__tutor teste', petId: 'pet1', tutorId: 'tut1', cycleKey: '["pet1","tut1","ecto","2026-10-31","ecto_p"]', itemK: 'ecto_p', dataAplicacao: DIA, respostaId: 'r88_teste', revisao: 0, ator: { id: 'amanda', nome: 'Amanda', papel: 'supervisor' } });
const FONTES = () => ({ dia: DIA, fichaUnica: true, cadastro: { n: 'Teste Theo', tutor: 'Tutor Teste' }, ator: { id: 'amanda', nome: 'Amanda', papel: 'supervisor' },
  resposta: { cycleKey: '["pet1","tut1","ecto","2026-10-31","ecto_p"]', itemK: 'ecto_p', respostaId: 'r88_teste', revisao: 0, decisao: 'autorizar', origem: 'loja', estado: 'decidido' }, ciclos: [{ cycleKey: '["pet1","tut1","ecto","2026-10-31","ecto_p"]', itemK: 'ecto_p' }] });

prova('L1', 'a validação irmã da 138 aceita a loja e a bolsa exatas e recusa ciclo trocado, dia trocado, ficha duplicada, sessão, resposta e data fora de hoje (AC10)', () => {
  const Z = puro174(), v = (s, f) => Z.validarAtualizacaoFicha174(s, f).ok;
  assert.strictEqual(v(SEL(), FONTES()), true, 'loja exata');
  assert.strictEqual(v(Object.assign(SEL(), { origem: 'bolsa' }), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { origem: 'bolsa' }) })), true, 'bolsa exata');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { ciclos: [{ cycleKey: '["pet1","tut1","ecto","2026-11-30","ecto_p"]', itemK: 'ecto_p' }] })), false, 'ciclo trocado');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { ciclos: [] })), false, 'ciclo que sumiu');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { ciclos: [FONTES().ciclos[0], FONTES().ciclos[0]] })), false, 'ciclo duplicado');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { dia: '2026-11-04' })), false, 'dia trocado');
  assert.strictEqual(v(Object.assign(SEL(), { dataAplicacao: '2026-11-02' }), FONTES()), false, 'data que não é a de hoje');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { fichaUnica: false })), false, 'ficha duplicada');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { cadastro: { movido_para: 'outra' } })), false, 'ficha movida');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { ator: { id: 'outra', nome: 'Outra', papel: 'supervisor' } })), false, 'sessão trocada');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { origem: 'bolsa' }) })), false, 'a resposta virou bolsa');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { origem: 'externo' }) })), false, 'a resposta virou «Vai fazer em casa»');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { revisao: 1 }) })), false, 'outra revisão');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { estado: 'realizado' }) })), false, 'já realizado pelo Encãotador');
  assert.strictEqual(v(SEL(), Object.assign(FONTES(), { resposta: Object.assign(FONTES().resposta, { revisaoOperacional: 'animal_ja_saiu' }) })), false, 'em revisão da coordenação');
  assert.strictEqual(v(Object.assign(SEL(), { versao: 138 }), FONTES()), false, 'a seleção do tutor não passa por aqui');
  assert.strictEqual(v(Object.assign(SEL(), { itemK: 'vac_mult_p' }), FONTES()), false, 'vacina fica de fora');
});
prova('L2', 'o dia de hoje é o de São Paulo, perto da meia-noite, em qualquer fuso do aparelho (AC3)', () => {
  const Z = puro174();
  assert.strictEqual(Z.hojeSP(Date.parse('2026-11-04T02:59:00Z')), '2026-11-03', '23h59 em São Paulo ainda é 03/11');
  assert.strictEqual(Z.hojeSP(Date.parse('2026-11-04T03:00:00Z')), '2026-11-04', 'meia-noite em São Paulo já é 04/11');
  assert.strictEqual(Z.hojeSP(Date.parse('2026-11-03T03:30:00Z')), '2026-11-03', '00h30 em São Paulo é 03/11 (no UTC ainda é 03/11, 3h30)');
  assert.strictEqual(Z.hojeSP(Date.parse('2026-11-03T02:30:00Z')), '2026-11-02', '23h30 do dia 02 em São Paulo');
  assert.strictEqual(Z.quemDeu('Amanda'), 'Day Care — registrado por Amanda'); assert.strictEqual(Z.quemDeu(''), '');
  assert.strictEqual(Z.origemDe('autorizar_loja'), 'loja'); assert.strictEqual(Z.origemDe('autorizar_bolsa'), 'bolsa'); assert.strictEqual(Z.origemDe('autorizar_externo'), ''); assert.strictEqual(Z.origemDe('aguardar'), '');
});
prova('L3', 'a vitória diz o cuidado, a data e o próximo, com «feito/feita» certo; vacina não entra (AC9, AC12)', () => {
  const Z = puro174();
  assert.strictEqual(Z.vitoriaTexto('ecto_p', DIA, '2026-12-03'), 'Ficha em dia: Carrapaticida feito em 03/11/2026; próximo em 03/12/2026.');
  assert.strictEqual(Z.vitoriaTexto('verm_p', DIA, '2027-03-03'), 'Ficha em dia: Vermífugo feito em 03/11/2026; próximo em 03/03/2027.');
  assert.strictEqual(Z.vitoriaTexto('col_p', DIA, '2027-07-01'), 'Ficha em dia: Coleira repelente feita em 03/11/2026; próximo em 01/07/2027.');
  assert.strictEqual(Z.vitoriaTexto('escova_p', DIA, '2027-02-01'), 'Ficha em dia: Troca de escova de dentes feita em 03/11/2026; próximo em 01/02/2027.');
  assert.strictEqual(Z.vitoriaTexto('verm_dose2_p', DIA, '2027-03-03'), 'Ficha em dia: Vermífugo — 2ª dose feita em 03/11/2026; próximo em 03/03/2027.');
  assert.match(Z.vitoriaHTML({ indice: 0, itemK: 'ecto_p', data: DIA, proximo: '2026-12-03' }), /EM DIA ATÉ 03\/12\/2026/);
  ['vac_mult_p', 'vac_gripe_p', 'vac_raiva_p', 'fezes_p', 'checkup_p'].forEach((k) => { assert.strictEqual(Z.daFicha(k), false, k + ' não é deste toque'); assert.strictEqual(Z.vitoriaTexto(k, DIA, '2027-11-03'), ''); });
  ['verm_p', 'verm_dose2_p', 'ecto_p', 'col_p', 'escova_p'].forEach((k) => assert.strictEqual(Z.daFicha(k), true, k));
  assert.strictEqual(Z.fichaTemData({ carrapaticida_t: DIA }, 'ecto_p', DIA), true, 'o campo antigo vale'); assert.strictEqual(Z.fichaTemData({ escova_t: DIA }, 'escova_p', DIA), true);
  assert.strictEqual(Z.fichaTemData({ ecto_t: '2026-10-01' }, 'ecto_p', DIA), false);
});
function trechoUi174(h) {
  const ui = script(h, 'zelozinha-contatos89-ui') || '', ini = ui.indexOf('/* ===== Story 6.124'), fim = ui.indexOf('  async function registrarGrupo(');
  return ini >= 0 && fim > ini ? ui.slice(ini, fim) : '';
}
prova('L4', 'o código novo: nenhum texto novo ao tutor, nenhuma escrita direta nova no banco, nenhuma palavra proibida, nenhum emoji, nenhuma função ck/pt; a ficha só pelo prevLancar (AC10, AC12, AC14c)', () => {
  const novo = trechoUi174(HTML), puro = script(HTML, 'zelozinha-lanca174') || ''; assert.ok(novo.length > 1000, 'o trecho novo da tela existe');
  const tudo = novo + '\n' + puro;
  assert.ok(!/Obrigada|Combinado|Olá|Oi,|mensagemAprovada|textoEmCasa|textoTutorJaFez|whats/i.test(tudo), 'nenhuma mensagem ao tutor no código novo');
  assert.ok(!/\p{Extended_Pictographic}/u.test(tudo), 'nenhum emoji');
  assert.ok(!/\b(animal|animais|bicho|bichos|cachorro|cachorros|cão|cães|dono|donos|proprietário|funcionário|funcionários|monitor|monitora)\b/i.test(tudo.replace(/papel monitor/g, '')), 'nenhuma palavra proibida');
  const metodos = [...tudo.matchAll(/\.ref\([^)]*\)\.([A-Za-z]+)\(/g)].map((x) => x[1]);
  assert.ok(metodos.length > 0 && metodos.every((x) => x === 'once'), 'o código novo só LÊ o banco (once): ' + metodos.join(', '));
  assert.ok(!/setPelExtra|prevGravar\(|\.transaction\(|\.update\(|\.remove\(|\.set\(/.test(tudo), 'nenhuma escrita direta: a ficha vai pelo prevLancar e a linha pelo gravarEscolha que já existiam');
  assert.ok(/prevLancar\(sf\.pelKey,sf\.itemK\)/.test(novo), 'a ficha de loja e bolsa é gravada pelo mesmo prevLancar do «Salvar»');
  assert.ok(/gravarEscolha\(c,cy,'prod',op\.v,\{silencioso:true\}\)/.test(novo), 'o produto na linha vai pelo gravarEscolha (o mesmo do chip)');
  assert.ok(!/function (ck|ckt|pt)[A-Za-z0-9_]*\(/.test(tudo), 'nenhuma função nova entra na área protegida');
  assert.match(HTML, /if\(loja174\)patch\[base\+'_ondefoi'\]='Day Care';else patch\[base\+'_ondefoi'\]='Tutor em casa';/, '«Quem deu» de loja/bolsa é «Day Care»; o do tutor continua «Tutor em casa»');
  assert.match(HTML, /var validar=s\.versao===174\?\(window\.ZelozinhaLanca174&&window\.ZelozinhaLanca174\.validarAtualizacaoFicha174\)/, 'a seleção 174 passa pela validação irmã, depois de reler a ficha, a resposta e o ciclo');
});
prova('L5', 'os caminhos do banco do app são os mesmos da base: nenhum caminho novo; o passo do Encãotador no Day Care é o mesmo texto da base (AC10, AC11, AC14)', () => {
  const base = require('child_process').spawnSync('git', ['show', 'master:auaulandia/index.html'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (base.status !== 0) return;   /* sem o git (cópia sem histórico): a prova L4 já cobre o código novo */
  const caminhos = (h) => [...new Set((h.match(/DB\.ref\('[^']*'/g) || []).concat(h.match(/'daycare\/[a-z0-9-]+[^']*'/gi) || []))].sort();
  const novos = caminhos(HTML).filter((c) => caminhos(base.stdout).indexOf(c) < 0);
  igual(novos, [], 'nenhum caminho de banco novo: ' + novos.join(', '));
  const trecho = (h, de, ate) => { const i = h.indexOf(de), j = h.indexOf(ate, i); return i >= 0 && j > i ? h.slice(i, j) : null; };
  [['  function dcCuidado57Render(){', '  function dcCarregarLancamentos(){'], ['function dashCuidado36LinhaHTML(k,id,o){', 'function prevCuidado36Preparar('], ['<script data-sol57="integrar-formulario-base16.js">', '</script>']].forEach(([a, b]) => {
    const x = trecho(HTML, a, b), y = trecho(base.stdout, a, b); assert.ok(x && y, a); assert.strictEqual(x, y, a + ' igual à base');
  });
  const v = (h) => { const ls = h.split('\n'), i = ls.findIndex((l) => l.includes('<section class="view" id="v-daycare">')); let j = i + 1; while (j < ls.length && !ls[j].includes('<section class="view"')) j++; return ls.slice(i, j).join('\n'); };
  assert.strictEqual(v(HTML), v(base.stdout), '#v-daycare igual à base');
});

// ================================================================= C — Chromium a 375 px com o app real
/* Roda no navegador. S = {filhots:[{n,tutor,tel,cuidados:[itemK],vence:{itemK:dia},ficha:{...},saiu:'hh:mm'}], usuario, vetConfirmada} */
async function montarMundo174(S) {
  window.ckLimparFotosEnviadas = function () { return Promise.resolve(0); };
  var dia = zPainel44Dia();
  var banco = criarBancoFalso({}, { latencia: 0 });
  window.__banco = banco; DB = banco;
  window.firebase = { auth: function () { return { currentUser: { uid: 'uid-teste' }, onAuthStateChanged: function () { return function () {}; } }; }, database: { ServerValue: { TIMESTAMP: banco.SV } } };
  aplicarLogin(S.usuario || { monId: 'amanda', pessoa: 'Amanda', nome: 'Amanda', role: 'supervisor' });
  async function sha256(s) { var b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), h = ''; for (var i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, '0'); return h; }
  var agoraIso = new Date().toISOString(), identidades = {}, itensDia = {}, grupos = {}, linhas = [], info = [], nCuid = 0;
  var alvo = (function (d) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); })(dia);
  PELUDINHOS.length = 0; CARTEIRA_CARREGADA = true;
  for (var i = 0; i < S.filhots.length; i++) {
    var f = S.filhots[i], p = { n: f.n, tutor: f.tutor, raca: 'SRD' };
    PELUDINHOS.push(p);
    var pk = pelKey(p), dk = dcKey(p.n, p.tutor), petId = 'pet' + (i + 1), tutorId = 'tut' + (i + 1);
    var cad = { n: f.n, tutor: f.tutor, tel: f.tel || '(00) 90000-000' + (i % 10) };
    if (f.modo !== 'enviada') cad.comunicacaoZelozinha = { versao: 1, modo: 'humano', atualizadoEm: agoraIso, atualizadoPor: 'Adriana' };
    (f.cuidados || ['verm_p']).forEach(function (k) { cad[k] = (f.vence && f.vence[k]) || dia; });
    if (f.ficha) Object.keys(f.ficha).forEach(function (k) { cad[k] = f.ficha[k]; });
    banco.poe('daycare/cadastro/' + pk, cad); pelCadCache[pk] = cad;
    banco.poe('daycare/checkin-corpo/' + dia + '/' + dk, { tipo: 'entrada', quem: 'Zeloso Teste', fim: Date.now() - 3600000 });
    if (f.saiu) banco.poe('daycare/checkout-corpo/' + dia + '/' + dk, { tipo: 'saida', quem: 'Zeloso Teste', hora: f.saiu, fim: Date.parse(dia + 'T' + f.saiu + ':00-03:00') });
    identidades[petId] = { petId: petId, tutorRefId: tutorId, pelKeyAtual: pk, dcKeyAtual: dk, aliases: {} }; identidades[petId].aliases[pk] = true;
    var itens = vencItensDe(Object.assign({}, pelExtra(p), cad), alvo, 0, dia, {}).filter(function (x) { return x && !x.sem_registro && x.vence <= alvo; });
    var ciclos = itens.map(function (x) { var care = window.ZeluzPrevencaoFontes.tipoCuidado(x); if (!care && x.k === 'escova_p') care = 'escova'; return { cycleKey: JSON.stringify([petId, tutorId, care, x.vence, x.k]), itemK: x.k, care: care, vence: x.vence }; }).filter(function (c) { return !!c.care; });
    var enviada = f.modo === 'enviada';
    ciclos.forEach(function (c) { itensDia['h' + (nCuid++)] = { cycleKey: c.cycleKey, petId: petId, tutorId: tutorId, care: c.care, itemK: c.itemK, dueDate: c.vence, statusPainel: enviada ? 'entrega_confirmada' : 'acompanhamento_humano', motivo: enviada ? 'Entrega confirmada.' : 'Contato humano conforme configuração da ficha.' }; });
    /* «enviada»: a mensagem da Zelozinha antiga (painel81), como no mundo da 6.94 — o caminho em que o «Conferir cuidado» do Encãotador resolve a tarefa no master */
    if (enviada && ciclos.length) {
      var gk = JSON.stringify([petId, tutorId, dia]);
      var texto = MensagemUnica41.gerarMensagem({ nomeTutor: f.tutor, nomePeludo: f.n, sexo: undefined, dia: dia, presencaConfirmada: true, cuidados: ciclos.map(function (c) { return { itemK: c.itemK, vence: c.vence }; }), veterinariaConfirmada: false });
      grupos['h' + (i + 1).toString(16).padStart(31, '0')] = { groupKey: gk, petId: petId, tutorId: tutorId, statusPainel: 'enviado_confirmado', textoDisponivel: true, textoEnviado: texto.texto, textoSha: await sha256(texto.texto), messageId: 'm' + (i + 1), nomePeludo: f.n, nomeTutor: f.tutor, sexoMensagem: '', cycleKeys: ciclos.map(function (c) { return c.cycleKey; }), itemKs: ciclos.map(function (c) { return c.itemK; }), respostaHumana: 'pendente', acompanhamentoHumanoPendente: true, retornoHumanoPrevisto: '13:30', autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, canalReciboId: 'rc' + (i + 1), tentativaEm: agoraIso, verificadoEm: dia + 'T08:42:00-03:00' };
    }
    linhas.push({ chave: dk, p: p });
    info.push({ i: i, n: f.n, dcKey: dk, pelKey: pk, petId: petId, tutorId: tutorId, ciclos: ciclos });
  }
  var proj = { versao: 81, dia: dia, atualizadoEm: agoraIso, autoria: { id: 'zelozinha-zeluz', nome: 'Zelozinha', tipo: 'servico' }, detalhesEnvioVersao: 104, assinaturaConteudo: await sha256('assinatura-174'), estadoRecibos43: { versao: 43, stateJson: JSON.stringify({ groups: Object.keys(grupos).reduce(function (a, h) { a[grupos[h].groupKey] = { nomeTutor: grupos[h].nomeTutor, nomePeludo: grupos[h].nomePeludo }; return a; }, {}) }) }, identidadesPets: identidades, grupos: grupos, cuidadosDia: { versao: 104, itens: itensDia } };
  banco.poe('piloto59/interno-20261019/painel81/' + dia, proj);
  window.__linhasHoje = linhas;
  hojeLista = function () { return window.__linhasHoje; };
  zPainel44ValidarFonte80 = function (v) {
    if (!v || v.versao !== 81 || v.dia !== zPainel44Dia()) return null;
    var gs = Object.keys(v.grupos || {}).map(function (k) { return v.grupos[k]; }).sort(function (a, b) { return a.groupKey.localeCompare(b.groupKey); });
    return { versao: 81, dia: v.dia, atualizadoEm: v.atualizadoEm, autoria: v.autoria, detalhesEnvioVersao: Number(v.detalhesEnvioVersao), grupos: gs, estadoRecibos43: (function () { try { return JSON.parse(v.estadoRecibos43.stateJson); } catch (_) { return { groups: {} }; } })(), identidadesPets: v.identidadesPets || {}, cuidadosDia: v.cuidadosDia || { versao: 104, itens: {} } };
  };
  zPainel44Projecao80Atual = function () { var st = Z44_DISPATCH80, pr = st && st.dados; return pr && pr.dia === zPainel44Dia() ? pr : null; };
  zPainel44Despacho80Conectar = function () {};
  Z44_DISPATCH80.dados = zPainel44ValidarFonte80(proj); Z44_DISPATCH80.erro = ''; Z44_DISPATCH80.carregando = false;
  window.zelozinha47Veterinaria = { ler: function () { return Promise.resolve({ ok: true, dia: zPainel44Dia(), confirmada: !!S.vetConfirmada, tipo: S.vetConfirmada ? 'confirmada' : 'pendente' }); } };
  window.zWhatsAbrir = function () { return true; };
  window.__mundo = info;
  VENC_PEND = null; await vencPendCarregar(true);
  return info;
}

let chromium = null, navegador = null, semNavegador = '';
try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { semNavegador = 'o Playwright não está instalado nesta máquina'; } } }
function caminhoChromium() { return ['/opt/pw-browsers/chromium'].filter((p) => fs.existsSync(p))[0] || undefined; }
async function garantirNavegador() { if (navegador) return navegador; if (!chromium) throw new Error(semNavegador); navegador = await chromium.launch({ executablePath: caminhoChromium(), args: ['--no-sandbox'] }); return navegador; }
const ate = async (fn, ms) => { const fim = Date.now() + (ms || 10000); let v; for (;;) { v = await fn(); if (v || Date.now() >= fim) return v; await esperar(80); } };
const ABERTOS = new Set();
async function fecharSobras() { for (const c of [...ABERTOS]) { ABERTOS.delete(c); try { await c.close(); } catch (_) { /* silencioso de propósito: já tinha fechado */ } } }
/* o que é dos relógios do PRÓPRIO app (limpeza de fotos, aniversário, auditoria da limpeza) não é da tela: fica fora da conta */
const RUIDO = (g) => /^daycare\/(fotos-corpo|limpeza-fotos|aniversario-enviado)\//.test(g.path) || (/^daycare\/auditoria\//.test(g.path) && g.valor && g.valor.acao === 'limpeza-fotos');
async function mundo(S, opcoes) {
  opcoes = opcoes || {};
  const b = await garantirNavegador();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, timezoneId: FUSO_NAVEGADOR });
  ABERTOS.add(ctx);
  const page = await ctx.newPage();
  const m = { ctx, page, erros: [], S };
  page.on('pageerror', (e) => m.erros.push(String(e && e.message || e).slice(0, 300)));
  await page.route(/^https?:/, (r) => r.abort());
  await page.addInitScript(BANCO_SRC + '\nwindow.criarBancoFalso=criarBancoFalso;');
  await page.addInitScript(montarMundo174.toString() + '\nwindow.montarMundo174=montarMundo174;');
  await page.clock.setFixedTime(opcoes.relogio || RELOGIO);
  await page.goto('file://' + (opcoes.app || APP));
  await page.waitForFunction(() => document.readyState === 'complete' && typeof montarMundo174 === 'function' && typeof aplicarLogin === 'function' && typeof zPainel44Dia === 'function' && typeof vencPendCarregar === 'function' && typeof ZeluzRespostaApp88 === 'object' && !!window.__zelozinhaContatos89Instalado, null, { timeout: 30000 });
  /* o «ontoggle» dos <details> abertos no HTML dispara antes de o script principal definir prevSecVirar (é da carga do app, em qualquer versão): os erros contam a partir do mundo montado */
  m.erros.length = 0;
  m.info = await page.evaluate((s) => montarMundo174(s), S);
  m.ev = (fn, arg) => page.evaluate(fn, arg);
  m.dcDe = (n) => { const x = m.info.filter((i) => i.n === n)[0]; if (!x) throw new Error('FILHOt de teste desconhecido: ' + n); return x.dcKey; };
  m.pkDe = (n) => m.info.filter((i) => i.n === n)[0].pelKey;
  m.cicloDe = (n, k) => { const x = m.info.filter((i) => i.n === n)[0]; const c = x.ciclos.filter((y) => y.itemK === k)[0]; if (!c) throw new Error('cuidado ' + k + ' não existe em ' + n + ': ' + JSON.stringify(x.ciclos)); return c.cycleKey; };
  m.sel = (n) => '[data-zt694-pet="' + ENC(m.dcDe(n)) + '"]';
  m.cuidado = (n, k) => m.sel(n) + ' [data-zt694-care][data-z104-care="' + ENC(m.cicloDe(n, k)) + '"]';
  m.botao = (n, k, valor) => m.cuidado(n, k) + ' [data-zt694-acao="resp"][data-zt694-valor="' + valor + '"]';
  m.log = async () => { const l = await page.evaluate(() => ({ leituras: window.__banco.log.leituras.slice(), gravacoes: window.__banco.log.gravacoes.slice() })); l.gravacoes = l.gravacoes.filter((g) => !RUIDO(g)); return l; };
  m.zerarLog = () => page.evaluate(() => { window.__banco.log.leituras.length = 0; window.__banco.log.gravacoes.length = 0; });
  m.ler = (p) => page.evaluate((p) => window.__banco.ler(p), p);
  m.ficha = (n) => m.ler('daycare/cadastro/' + m.pkDe(n));
  m.texto = (n, k) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerText : null; }, k ? m.cuidado(n, k) : m.sel(n));
  m.quieto = async (extra) => {
    let ultimo = -1, estavel = 0;
    for (let i = 0; i < 200; i++) {
      const t = await page.evaluate(() => ({ n: window.__banco.log.leituras.length + window.__banco.log.gravacoes.length, pend: window.__banco.pendentes(), salvando: [...document.querySelectorAll('[data-zt694-status],[data-zt694-ficha174-st]')].some((e) => /Salvando|Deixando a ficha|Conferindo a ficha/.test(e.textContent)) || !!document.querySelector('[aria-busy="true"]') }));
      if (t.n === ultimo && !t.salvando && t.pend === 0) estavel++; else estavel = 0;
      ultimo = t.n; if (estavel >= 4) break; await esperar(120);
    }
    await esperar(extra || 80);
  };
  /* a tela da Zelozinha (Início › Zelozinha, «Para resolver» e «Em andamento»), no dia de hoje */
  m.abrirTela = async () => {
    await page.evaluate(() => { irParaView('hoje'); if (typeof window.zelozinha116Ativar === 'function') window.zelozinha116Ativar(true); });
    await page.waitForSelector('[data-zt694] [data-zt694-pet]', { state: 'attached', timeout: 30000 });
    await m.quieto(200); await m.abrirTodos();
  };
  /* os FILHOts aparecem em «details» fechados e em duas abas: abre todos, para tocar como a equipe toca */
  m.abrirTodos = () => page.evaluate(() => { document.querySelectorAll('[data-zt694-pane]').forEach((p) => { if (p.getAttribute('data-zt694-pane') !== 'snoopy') p.hidden = false; }); document.querySelectorAll('details.zt694-familia').forEach((d) => { d.open = true; }); });
  m.tocar = async (n, k, valor) => { await m.abrirTodos(); await page.click(m.botao(n, k, valor)); await m.quieto(); await m.abrirTodos(); };
  m.modal = () => page.evaluate(() => { const b = document.getElementById('zAlertaoBox'); return b && b.offsetParent !== null ? b.innerText : ''; });
  m.fechar = async () => { ABERTOS.delete(ctx); await ctx.close(); };
  if (opcoes.abrir !== false) await m.abrirTela();
  return m;
}
const gravouAlgo = (log) => log.gravacoes.filter((g) => ['set', 'update', 'remove', 'transaction'].indexOf(g.op) >= 0);
const linhasDe = async (m, item) => (await m.ler('daycare/dashboard/' + DIA + '/' + item)) || {};
const rastros = async (m) => { const r = await m.ler('daycare/prevencao-correcoes/' + DIA) || {}; return Object.keys(r).map((id) => Object.assign({ id }, r[id])); };
const regDe = (m, n) => m.ler('daycare/vencimentos/' + DIA + '/' + m.dcDe(n));
const respostaDe = async (m, n, k) => { const r = await regDe(m, n); const ck = await m.ev((c) => ZeluzResposta88.codificarChave(c), m.cicloDe(n, k)); return { resposta: r && r.respostasEscopo49 && r.respostasEscopo49.porCiclo && r.respostasEscopo49.porCiclo[ck], tarefa: r && r.respostasEscopo49 && r.respostasEscopo49.tarefas57 && r.respostasEscopo49.tarefas57[ck] }; };
const conta = async (m, fn, arg) => m.ev(fn, arg);
const SEM_PALAVRA_PROIBIDA = (t) => assert.ok(!/\b(animal|animais|bicho|cachorro|cão|cães|dono|funcionário)\b/i.test(t), 'palavra proibida na tela: ' + t);

/* Os FILHOts do mundo de teste (todos inventados). «Teste Theo» é o caso da captura: carrapaticida vencido há 3 dias, «Confront pet» na
   ficha (o «Nome do produto») e «Pipeta · 30 dias» no «Qual produto?». */
const VENCIDO = '2026-10-31';
const THEO = (n) => ({ n: n || 'Teste Theo', tutor: 'Tutor Teste Theo', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO }, ficha: { ecto_nome: 'Confront pet', ecto_prod: 'Pipeta', ecto_tipo: 'Pipeta', ecto_t: '2026-10-01', ecto_ondefoi: 'Day Care' } });

prova('C1', 'o cuidado mostra, antes do toque, o produto, o regime e a data que a ficha precisa, pré-preenchidos com o último da ficha; vacina, sem campos; cabe a 375 px (AC1, AC2, AC3, AC14c) [F]', async () => {
  const m = await mundo({ filhots: [THEO(), { n: 'Teste Legado', tutor: 'Tutor Teste Legado', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO }, ficha: { ecto_prod: 'Confront pet', ecto_tipo: 'Pipeta' } },
    { n: 'Teste Vazio', tutor: 'Tutor Teste Vazio', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO } }, { n: 'Teste Verm', tutor: 'Tutor Teste Verm', cuidados: ['verm_p'], ficha: { verm_nome: 'Vermífugo Teste', verm_doses: 'Dose única' } },
    { n: 'Teste Col', tutor: 'Tutor Teste Col', cuidados: ['col_p'], ficha: { col_nome: 'Seresto' } }, { n: 'Teste Esc', tutor: 'Tutor Teste Esc', cuidados: ['escova_p'], ficha: { escova_t: '2026-08-05', escova_dc: 'Sim' } },
    { n: 'Teste Vac', tutor: 'Tutor Teste Vac', cuidados: ['vac_mult_p'] }] });
  try {
    const bloco = (n, k) => m.ev((s) => { const b = document.querySelector(s + ' [data-zt694-ficha174]'); if (!b) return null; const nome = b.querySelector('[data-zt174-campo="nome"]'), reg = b.querySelector('[data-zt174-campo="regime"]'); return { texto: b.innerText, nome: nome ? nome.value : null, regime: reg ? reg.value : null, rotulo: reg && reg.selectedOptions[0] ? reg.selectedOptions[0].textContent : null }; }, m.cuidado(n, k));
    const theo = await bloco('Teste Theo', 'ecto_p');
    assert.ok(theo, 'o carrapaticida do Theo tem o bloco da ficha');
    igual([theo.nome, theo.regime, theo.rotulo], ['Confront pet', 'Pipeta', 'Pipeta · 30 dias']);
    assert.match(theo.texto, /Nome do produto/); assert.match(theo.texto, /Qual produto\?/);
    assert.match(theo.texto, /Vale 30 dias — a próxima data sai sozinha da data em que foi feito\./, 'a mesma frase do painel de Prevenção (ectoFraseDias)');
    assert.match(theo.texto, /«Autorizou pegar na loja» e «Trouxe na bolsa»: feito hoje, 03\/11\/2026\./, 'loja e bolsa: a data de hoje, fixa');
    const fez = await m.ev((s) => { const x = document.querySelector(s + ' [data-zt694-data-fez]'); return x ? { max: x.max, type: x.type } : null; }, m.cuidado('Teste Theo', 'ecto_p'));
    igual(fez, { max: DIA, type: 'date' }, '«Tutor já fez»: o campo de data de sempre, com máximo hoje');
    const leg = await bloco('Teste Legado', 'ecto_p'); igual([leg.nome, leg.regime], ['Confront pet', 'Pipeta'], 'ficha antiga: o nome no «Nome do produto» e o regime «Pipeta»');
    const vaz = await bloco('Teste Vazio', 'ecto_p'); igual([vaz.nome, vaz.regime], ['', ''], 'sem nada na ficha, o produto vem vazio');
    const ver = await bloco('Teste Verm', 'verm_p'); igual([ver.nome, ver.regime], ['Vermífugo Teste', null]); assert.match(ver.texto, /Como está na ficha: dose única\./);
    const col = await bloco('Teste Col', 'col_p'); assert.match(col.texto, /Validade: 240 dias \(Seresto\)\./);
    const esc = await bloco('Teste Esc', 'escova_p'); assert.match(esc.texto, /Troca a cada 90 dias\./);
    assert.strictEqual(await bloco('Teste Vac', 'vac_mult_p'), null, 'vacina: sem campos novos');
    // 375 px: os campos e o botão cabem, a letra é legível
    const med = await m.ev((s) => { const b = document.querySelector(s + ' [data-zt694-ficha174]'), r = b.getBoundingClientRect(), campos = [...b.querySelectorAll('input,select')].map((x) => { const q = x.getBoundingClientRect(), cs = getComputedStyle(x); return { esq: q.left, dir: q.right, alt: q.height, fonte: parseFloat(cs.fontSize) }; }); const btns = [...document.querySelectorAll(s + ' [data-zt694-acao="resp"]')].map((x) => x.getBoundingClientRect().right); return { esq: r.left, dir: r.right, campos, btns, sw: document.documentElement.scrollWidth, fontes: [...b.querySelectorAll('p,label')].map((x) => parseFloat(getComputedStyle(x).fontSize)) }; }, m.cuidado('Teste Theo', 'ecto_p'));
    assert.ok(med.esq >= 0 && med.dir <= 375, 'o bloco cabe: ' + JSON.stringify(med));
    assert.ok(med.campos.length === 2 && med.campos.every((c) => c.esq >= 0 && c.dir <= 375 && c.alt >= 44 && c.fonte >= 16), 'campos dentro da tela, com 44 px de altura e letra de 16 px: ' + JSON.stringify(med.campos));
    assert.ok(med.btns.every((x) => x <= 375), 'os botões cabem'); assert.ok(med.sw <= 375, 'sem rolagem lateral: ' + med.sw); assert.ok(med.fontes.every((f) => f >= 12), 'letra legível: ' + med.fontes);
    SEM_PALAVRA_PROIBIDA(await m.texto('Teste Theo'));
    if (process.env.FOTOS174) await m.page.locator(m.cuidado('Teste Theo', 'ecto_p')).screenshot({ path: path.join(process.env.FOTOS174, 'c1-antes-do-toque.png') });
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

/* depois de um toque: a ficha, a linha do Lançamento do dia e o rastro — o que o app mesmo calcula, lido na página */
const calculo = (m, expr, arg) => m.ev(([e, a]) => (new Function('a', 'return (' + e + ');'))(a), [expr, arg]);

prova('C2', 'Theo, «Autorizou pegar na loja», UM toque: a ficha fica em dia (data de hoje, Confront pet, Pipeta, Vale até pela conta do app, «Quem deu: Day Care»), a linha vai para o Lançamento do dia, o rastro fica na Prevenção, o cartão mostra a vitória e o lembrete do Snoopy; o clique repetido não duplica (AC4, AC7, AC9, AC10, AC13) [F]', async () => {
  const m = await mundo({ filhots: [THEO()] });
  try {
    const esperadoP = await calculo(m, "addDiasISO(a, parseInt(ECTO_DUR['Pipeta'],10))", DIA);
    assert.strictEqual(esperadoP, '2026-12-03', 'a conta do app: 03/11/2026 + 30 dias');
    await m.zerarLog();
    await m.tocar('Teste Theo', 'ecto_p', 'autorizar_loja');
    await ate(async () => { const f = await m.ficha('Teste Theo'); return f && f.ecto_t === DIA; }, 15000);
    const f = await m.ficha('Teste Theo');
    igual([f.ecto_t, f.ecto_p, f.ecto_prod, f.ecto_tipo, f.ecto_nome, f.ecto_ondefoi], [DIA, esperadoP, 'Pipeta', 'Pipeta', 'Confront pet', 'Day Care'], 'a ficha em dia, num toque');
    assert.strictEqual(f.ecto_por, 'Day Care — registrado por Amanda', '«Quem fez» diz quem registrou');
    const linhas = await linhasDe(m, 'carrapaticida'), ids = Object.keys(linhas);
    assert.strictEqual(ids.length, 1, 'uma linha no Lançamento do dia: ' + JSON.stringify(linhas));
    const l = linhas[ids[0]];
    igual([l.origemVencimento.protocolo, l.origemVencimento.origemResposta, l.det.cuidado57_estado, l.chave], ['cuidado57', 'loja', 'conferir-orientacao', m.dcDe('Teste Theo')]);
    const r = await respostaDe(m, 'Teste Theo', 'ecto_p'); igual([r.resposta.decisao, r.resposta.origem, r.tarefa.estado], ['autorizar', 'loja', 'criada'], 'a resposta é a de hoje e a tarefa do Day Care foi criada');
    const rs = await rastros(m); assert.strictEqual(rs.length, 1, 'um rastro na Prevenção: ' + JSON.stringify(rs));
    igual([rs[0].como, rs[0].tela, rs[0].k, rs[0].depois.ecto_t, rs[0].antes.ecto_t, rs[0].depois.ecto_ondefoi], ['lance-aqui', 'Prevenção', 'ecto_p', DIA, '2026-10-01', 'Day Care'], 'o rastro de sempre do «Salvar», com o antes e o depois');
    const t = await m.texto('Teste Theo', 'ecto_p');
    assert.match(t, /Ficha em dia: Carrapaticida feito em 03\/11\/2026; próximo em 03\/12\/2026\./, t);
    assert.match(t, /Foi para o Lançamento do dia/);
    const extra = await m.ev((s) => ({ editor: !!document.querySelector(s + ' [data-z138-editor-native]'), atualizar: !!document.querySelector(s + ' [data-zt694-acao="ficha174"]'), bloco: !!document.querySelector(s + ' [data-zt694-ficha174]'), salvar: [...document.querySelectorAll(s + ' button')].some((b) => /^Salvar/.test(b.textContent.trim())) }), m.cuidado('Teste Theo', 'ecto_p'));
    igual(extra, { editor: false, atualizar: false, bloco: false, salvar: false }, 'nenhum segundo botão no caso comum');
    // o produto vai para a linha (det.prod), o mesmo campo do chip «Qual produto?»
    const prod = await ate(async () => { const x = await linhasDe(m, 'carrapaticida'); return x[ids[0]] && x[ids[0]].det && x[ids[0]].det.prod; }, 8000);
    assert.strictEqual(prod, 'PIPETA · 30 DIAS', 'a linha leva o produto escolhido no cartão');
    const sn = await ate(async () => { const x = await m.ev((s) => { const e = document.querySelector(s + ' [data-zt694-snoopy]'); return e ? e.innerText : ''; }, m.cuidado('Teste Theo', 'ecto_p')); return /Snoopy/.test(x) && !/conferindo/.test(x) ? x : ''; }, 15000);
    assert.ok(/Lançado no Snoopy|Falta lançar no Snoopy|Já lancei no Snoopy/.test(sn), 'o lembrete do Snoopy continua na linha da loja: ' + sn);
    assert.ok(!(await m.ev((s) => { const c = document.querySelector(s + ' [data-zt694-snoopy-check]'); return !!(c && c.checked); }, m.cuidado('Teste Theo', 'ecto_p'))), 'e a ficha ficou em dia sem ele marcado (pergunta 85)');
    // clique repetido: nada duplica (nem regrava); trocar a resposta começa por desfazer a ficha, e nada é gravado
    await m.zerarLog();
    await m.tocar('Teste Theo', 'ecto_p', 'autorizar_loja');
    assert.match(await m.texto('Teste Theo'), /Já está salvo: a ficha está em dia e o cuidado está no Lançamento do dia\./);
    await m.tocar('Teste Theo', 'ecto_p', 'autorizar_externo');
    assert.match(await m.texto('Teste Theo'), /A ficha deste cuidado já está em dia \(feito hoje\)\. Para trocar a resposta, desfaça antes em Prevenção › «Atualizados hoje»\./);
    igual(gravouAlgo(await m.log()), [], 'o toque repetido e a troca não gravam nada');
    assert.strictEqual(Object.keys(await linhasDe(m, 'carrapaticida')).length, 1, 'continua uma linha');
    assert.strictEqual((await rastros(m)).length, 1, 'continua um rastro');
    igual((await m.ficha('Teste Theo')).ecto_t, DIA);
    igual((await respostaDe(m, 'Teste Theo', 'ecto_p')).resposta.origem, 'loja', 'a resposta continua «Autorizou pegar na loja»');
    if (process.env.FOTOS174) await m.page.locator(m.cuidado('Teste Theo', 'ecto_p')).screenshot({ path: path.join(process.env.FOTOS174, 'c2-depois-do-toque.png') });
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C3', '«Trouxe na bolsa», UM toque, com outro produto da ficha (Bravecto · 90 dias): a ficha em dia pela conta do app e «Quem deu: Day Care»; a linha vai para o Lançamento do dia (AC4, AC7, AC9) [F]', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Bolsa', tutor: 'Tutor Teste Bolsa', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO }, ficha: { ecto_prod: 'Bravecto', ecto_tipo: 'Comprimido', ecto_t: '2026-08-02' } }] });
  try {
    await m.tocar('Teste Bolsa', 'ecto_p', 'autorizar_bolsa');
    await ate(async () => { const f = await m.ficha('Teste Bolsa'); return f && f.ecto_t === DIA; }, 15000);
    const f = await m.ficha('Teste Bolsa'), esperado = await calculo(m, "addDiasISO(a, parseInt(ECTO_DUR['Bravecto'],10))", DIA);
    igual([f.ecto_t, f.ecto_p, f.ecto_prod, f.ecto_ondefoi, f.ecto_por], [DIA, esperado, 'Bravecto', 'Day Care', 'Day Care — registrado por Amanda']);
    assert.strictEqual(esperado, '2027-02-01');
    const linhas = await linhasDe(m, 'carrapaticida'); assert.strictEqual(Object.keys(linhas).length, 1); assert.strictEqual(linhas[Object.keys(linhas)[0]].origemVencimento.origemResposta, 'bolsa');
    const t = await m.texto('Teste Bolsa', 'ecto_p');
    assert.match(t, /Ficha em dia: Carrapaticida feito em 03\/11\/2026; próximo em 01\/02\/2027\./); assert.match(t, /Foi para o Lançamento do dia/);
    assert.strictEqual((await rastros(m)).length, 1);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C4', 'vermífugo (loja), coleira (bolsa) e escova (loja), UM toque cada: a ficha em dia pela mesma conta do app, «Quem deu: Day Care», uma linha para cada no Lançamento do dia (AC5) [F]', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Verm', tutor: 'Tutor Teste Verm', cuidados: ['verm_p'], ficha: { verm_nome: 'Vermífugo Teste', verm_doses: 'Dose única', verm_t: '2026-07-01' } },
    { n: 'Teste Col', tutor: 'Tutor Teste Col', cuidados: ['col_p'], ficha: { col_nome: 'Seresto', col_t: '2026-03-01' } },
    { n: 'Teste Esc', tutor: 'Tutor Teste Esc', cuidados: ['escova_p'], ficha: { escova_t: '2026-08-05', escova_dc: 'Sim' } }] });
  try {
    const exV = await m.ficha('Teste Verm'), proxV = await calculo(m, "prevVermLanceConta(a, 'verm_p', '" + DIA + "')", exV);
    const exC = await m.ficha('Teste Col'), proxC = await calculo(m, "addDiasISO('" + DIA + "', prevDiasDoItem({coleira:true}, a))", exC);
    const proxE = await calculo(m, "addDiasISO(a, PREV_ITENS.filter(function(x){return x.k==='escova_p';})[0].dias)", DIA);
    await m.tocar('Teste Verm', 'verm_p', 'autorizar_loja');
    await m.tocar('Teste Col', 'col_p', 'autorizar_bolsa');
    await m.tocar('Teste Esc', 'escova_p', 'autorizar_loja');
    await ate(async () => { const a = await m.ficha('Teste Verm'), b = await m.ficha('Teste Col'), c = await m.ficha('Teste Esc'); return a.verm_t === DIA && b.col_t === DIA && c.escova_t === DIA; }, 20000);
    const v = await m.ficha('Teste Verm'), c = await m.ficha('Teste Col'), e = await m.ficha('Teste Esc');
    igual([v.verm_t, v.verm_p, v.verm_nome, v.verm_ondefoi], [DIA, proxV, 'Vermífugo Teste', 'Day Care'], 'vermífugo');
    igual([c.col_t, c.col_p, c.col_ondefoi], [DIA, proxC, 'Day Care'], 'coleira'); assert.strictEqual(proxC, '2027-07-01');
    igual([e.escova_t, e.escova_p, e.escova_ondefoi], [DIA, proxE, 'Day Care'], 'escova'); assert.strictEqual(proxE, '2027-02-01');
    for (const item of ['vermifugo', 'coleira', 'escova']) assert.strictEqual(Object.keys(await linhasDe(m, item)).length, 1, 'uma linha de ' + item);
    assert.match(await m.texto('Teste Verm', 'verm_p'), /Ficha em dia: Vermífugo feito em 03\/11\/2026; próximo em /);
    assert.match(await m.texto('Teste Col', 'col_p'), /Ficha em dia: Coleira repelente feita em 03\/11\/2026; próximo em 01\/07\/2027\./);
    assert.match(await m.texto('Teste Esc', 'escova_p'), /Ficha em dia: Troca de escova de dentes feita em 03\/11\/2026; próximo em 01\/02\/2027\./);
    assert.strictEqual((await rastros(m)).length, 3, 'um rastro por cuidado');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

const tutorFez = async (m, n, k, data) => { await m.abrirTodos(); await m.page.fill(m.cuidado(n, k) + ' [data-zt694-data-fez]', data); await m.page.click(m.cuidado(n, k) + ' [data-zt694-acao="tutor-fez"]'); await m.quieto(); await m.abrirTodos(); };

prova('C5', '«Tutor já fez» em UM toque: a resposta com a data do tutor, a ficha em dia com a data, o produto e o regime, «Quem deu: Tutor em casa» e «Tutor — informado por …»; o formulário não fica aberto; sem produto, o aviso na linha e nada gravado (AC6, AC8) [F]', async () => {
  const m = await mundo({ filhots: [THEO('Teste Tutor'), { n: 'Teste Tutor Sem', tutor: 'Tutor Teste Sem', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO } }] });
  try {
    await tutorFez(m, 'Teste Tutor', 'ecto_p', '2026-10-28');
    await ate(async () => { const f = await m.ficha('Teste Tutor'); return f && f.ecto_t === '2026-10-28'; }, 15000);
    const r = await respostaDe(m, 'Teste Tutor', 'ecto_p');
    igual([r.resposta.decisao, r.resposta.origem, r.resposta.confirmacaoTutor137 && r.resposta.confirmacaoTutor137.dataAplicacao], ['autorizar', 'externo', '2026-10-28']);
    const f = await m.ficha('Teste Tutor');
    igual([f.ecto_t, f.ecto_p, f.ecto_prod, f.ecto_nome, f.ecto_ondefoi, f.ecto_por], ['2026-10-28', '2026-11-27', 'Pipeta', 'Confront pet', 'Tutor em casa', 'Tutor — informado por Amanda']);
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-z138-editor-native]'), m.sel('Teste Tutor')), false, 'o formulário nativo não fica aberto');
    const t = await m.texto('Teste Tutor', 'ecto_p'); assert.match(t, /Ficha atualizada — Carrapaticida feito em 28\/10\/2026 · próximo em 27\/11\/2026/, 'a vitória já aprovada do «Tutor já fez»: ' + t);
    const msg = await m.ev((s) => { const x = document.querySelector(s + ' [data-zt694-ficha171] [data-zt694-texto]'); return x ? x.textContent : null; }, m.cuidado('Teste Tutor', 'ecto_p'));
    assert.strictEqual(msg, 'Obrigada, Tutor! \u{1F49B}\nJá atualizamos a ficha de Teste Tutor: a proteção contra pulgas e carrapatos foi feita em 28/10/2026 e o próximo é em 27/11/2026.\nQuando estiver chegando perto, a gente avisa por aqui.', 'a mensagem aprovada do «Tutor já fez», letra por letra');
    assert.strictEqual(Object.keys(await linhasDe(m, 'carrapaticida')).length, 0, '«Tutor já fez» não cria linha no Lançamento do dia');
    // sem produto: aviso na linha, nada gravado; escolhido o produto, o toque seguinte grava
    await m.zerarLog();
    await tutorFez(m, 'Teste Tutor Sem', 'ecto_p', '2026-10-28');
    assert.match(await m.texto('Teste Tutor Sem', 'ecto_p'), /Falta o produto do carrapaticida: escolha em «Qual produto\?»\./);
    igual(gravouAlgo(await m.log()), [], 'nenhuma gravação: nem a resposta, nem a ficha');
    await m.page.selectOption(m.cuidado('Teste Tutor Sem', 'ecto_p') + ' [data-zt174-campo="regime"]', 'Bravecto');
    await m.page.click(m.cuidado('Teste Tutor Sem', 'ecto_p') + ' [data-zt694-acao="tutor-fez"]'); await m.quieto(); await m.abrirTodos();
    await ate(async () => { const x = await m.ficha('Teste Tutor Sem'); return x && x.ecto_t === '2026-10-28'; }, 15000);
    const g = await m.ficha('Teste Tutor Sem'); igual([g.ecto_t, g.ecto_p, g.ecto_prod, g.ecto_ondefoi], ['2026-10-28', '2027-01-26', 'Bravecto', 'Tutor em casa']);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C6', 'carrapaticida sem produto: o toque em loja avisa NA LINHA o que falta e o banco não registra nenhuma gravação (set, update, remove, push, transaction); escolhido o produto, o toque seguinte grava (AC8) [F]', async () => {
  const m = await mundo({ filhots: [{ n: 'Teste Vazio', tutor: 'Tutor Teste Vazio', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO } }] });
  try {
    await m.zerarLog();
    await m.tocar('Teste Vazio', 'ecto_p', 'autorizar_loja');
    const t = await m.texto('Teste Vazio', 'ecto_p'); assert.match(t, /Falta o produto do carrapaticida: escolha em «Qual produto\?»\./, t);
    assert.match(await m.texto('Teste Vazio'), /Nada foi gravado\. Complete o que falta no cuidado e toque de novo\./);
    const log = await m.log(); igual(gravouAlgo(log), [], 'nada gravado: ' + JSON.stringify(log.gravacoes));
    igual(Object.keys(await linhasDe(m, 'carrapaticida')), []); igual(await rastros(m), []);
    const r = await respostaDe(m, 'Teste Vazio', 'ecto_p'); assert.ok(!r.resposta, 'nem a resposta');
    await m.page.selectOption(m.cuidado('Teste Vazio', 'ecto_p') + ' [data-zt174-campo="regime"]', 'Pipeta');
    await m.page.fill(m.cuidado('Teste Vazio', 'ecto_p') + ' [data-zt174-campo="nome"]', 'Produto Teste');
    await m.tocar('Teste Vazio', 'ecto_p', 'autorizar_loja');
    await ate(async () => { const f = await m.ficha('Teste Vazio'); return f && f.ecto_t === DIA; }, 15000);
    const f = await m.ficha('Teste Vazio'); igual([f.ecto_t, f.ecto_p, f.ecto_prod, f.ecto_tipo, f.ecto_nome, f.ecto_ondefoi], [DIA, '2026-12-03', 'Pipeta', 'Pipeta', 'Produto Teste', 'Day Care']);
    assert.strictEqual(Object.keys(await linhasDe(m, 'carrapaticida')).length, 1);
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

/* o Encãotador no Day Care: «Cuidados autorizados de hoje» → «Conferir cuidado» → «Salvar» no formulário de sempre */
async function encantadorConfere(m, n, k, item) {
  await m.ev(() => aplicarLogin({ monId: 'enc1', pessoa: 'Encãotadora Teste', nome: 'Encãotadora Teste', role: 'monitor' }));
  await m.ev(async () => { DC_DASH_TURMA.quando = 0; await dcCarregarLancamentos(); });
  const lista = await m.ev(() => DC_CUIDADOS57.itens.map((x) => ({ grupo: x.grupo, id: x.id, chave: x.chave })));
  const alvo = lista.filter((x) => x.chave === m.dcDe(n) && x.grupo === item)[0];
  assert.ok(alvo, 'a linha está em «Cuidados autorizados de hoje»: ' + JSON.stringify(lista));
  const passo = await m.ev(() => { dcCuidado57Render(); const a = document.getElementById('dcCuidados57'); return a ? a.innerText : ''; });
  assert.match(passo, /Cuidados autorizados de hoje/); assert.match(passo, /Conferir cuidado/);
  const abriu = await m.ev(([g, id]) => Promise.resolve(dcCuidado57Abrir(g, id)), [alvo.grupo, alvo.id]);
  assert.strictEqual(abriu, true, 'o «Conferir cuidado» abre o formulário: ' + (await m.modal()));
  const pk = m.pkDe(n), btn = '[id="prevEd_' + pk + '"] button[data-prev-item="' + k + '"]';
  await m.page.waitForSelector(btn, { timeout: 15000 });
  const campos = await m.ev(([pk, k]) => ({ t: (document.getElementById('prevT_' + pk + '_' + k) || {}).value, q: (document.getElementById('prevQ_' + pk + '_' + k) || {}).value }), [pk, k]);
  await m.page.click(btn);
  await m.quieto(300);
  return { alvo, campos };
}

prova('C7', 'depois do toque na Zelozinha (loja e bolsa), o «Conferir cuidado» do Encãotador continua funcionando: a linha fecha sem erro, a ficha não é desfeita nem relançada (uma data, um próximo, uma atualização na Prevenção) e não aparece «a ficha mudou» (AC11) [F]', async () => {
  for (const valor of ['autorizar_loja', 'autorizar_bolsa']) {
    const m = await mundo({ filhots: [Object.assign(THEO(), { modo: 'enviada' })] });
    try {
      await m.tocar('Teste Theo', 'ecto_p', valor);
      await ate(async () => { const f = await m.ficha('Teste Theo'); return f && f.ecto_t === DIA; }, 15000);
      await ate(async () => (await rastros(m)).length === 1, 8000);
      const fichaZelozinha = await m.ficha('Teste Theo');
      const { alvo, campos } = await encantadorConfere(m, 'Teste Theo', 'ecto_p', 'carrapaticida');
      igual([campos.t, campos.q], [DIA, 'Day Care — registrado por Amanda'], 'o formulário já vem com a data e quem fez');
      const linha = await ate(async () => { const l = (await linhasDe(m, 'carrapaticida'))[alvo.id]; return l && l.det && l.det.cuidado57_estado === 'realizado-conferido' ? l : null; }, 20000);
      const modal = await m.modal();
      assert.ok(linha, valor + ': a linha fechou (realizado-conferido). Cartaz: ' + modal + ' · ' + JSON.stringify((await linhasDe(m, 'carrapaticida'))[alvo.id]));
      if (valor === 'autorizar_loja') assert.strictEqual(linha.det.onde, 'LOJA', 'loja: a linha fica cobrável no Snoopy, como antes');
      const r = await respostaDe(m, 'Teste Theo', 'ecto_p'); assert.strictEqual(r.tarefa.estado, 'realizado', valor + ': a tarefa do Day Care foi realizada');
      const depois = await m.ficha('Teste Theo');
      igual([depois.ecto_t, depois.ecto_p, depois.ecto_prod, depois.ecto_nome, depois.ecto_ondefoi], [fichaZelozinha.ecto_t, fichaZelozinha.ecto_p, fichaZelozinha.ecto_prod, fichaZelozinha.ecto_nome, fichaZelozinha.ecto_ondefoi], 'a ficha não foi desfeita nem relançada');
      const rs = await rastros(m), mudaram = rs.filter((x) => JSON.stringify(x.antes && x.antes.ecto_t) !== JSON.stringify(x.depois && x.depois.ecto_t));
      assert.strictEqual(mudaram.length, 1, 'uma atualização só da data na Prevenção: ' + JSON.stringify(rs));
      const recibo = rs.filter((x) => x.execucaoPrevencao);
      assert.strictEqual(recibo.length, 1, 'o recibo da execução do Encãotador'); assert.strictEqual(recibo[0].depois.ecto_t, recibo[0].antes.ecto_t, 'o recibo não muda a ficha');
      // QA (rodada 1): o recibo que não muda nada fica no banco, mas não vira uma segunda entrada no «Atualizados hoje» (nem um «Desfazer» que não desfaria nada)
      const hoje = await m.ev(async () => { PREV_CORR_ERRO = ''; await prevCorrCarregar(true); return { linhas: prevCorrLinhas().map((x) => [x.k, x.antes && x.antes.ecto_t, x.depois && x.depois.ecto_t]), quadro: (prevCorrQuadroHTML('hoje').match(/>Desfazer<\/button>/g) || []).length }; });
      igual(hoje, { linhas: [['ecto_p', '2026-10-01', DIA]], quadro: 1 }, valor + ': «Atualizados hoje» com uma entrada só, a que mudou a data (o banco tem ' + rs.length + ' registros)');
      assert.ok(!/a ficha mudou|CUIDADO A CONFERIR|NÃO CONSEGUI/i.test(modal), 'nenhum cartaz de erro: ' + modal);
      assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
    } finally { await m.fechar(); }
  }
}, 'C');

prova('C8', 'o que não muda: FILHOt que saiu hoje não grava e o cartão diz isso na linha; vacina sem campos nem ficha; «Vai fazer em casa», «Não respondeu» e «Agendou para» sem campos e sem mexer na ficha (AC1 [C], AC12)', async () => {
  const m = await mundo({ filhots: [THEO('Teste Saiu'), { n: 'Teste Vac', tutor: 'Tutor Teste Vac', cuidados: ['vac_mult_p'], ficha: { vac_mult_t: '2025-11-01' } },
    { n: 'Teste Casa', tutor: 'Tutor Teste Casa', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO }, ficha: { ecto_prod: 'Pipeta', ecto_tipo: 'Pipeta', ecto_t: '2026-10-01' } },
    { n: 'Teste Aguarda', tutor: 'Tutor Teste Aguarda', cuidados: ['verm_p'], ficha: { verm_t: '2026-07-01', verm_doses: 'Dose única' } },
    { n: 'Teste Agenda', tutor: 'Tutor Teste Agenda', cuidados: ['col_p'], ficha: { col_nome: 'Seresto', col_t: '2026-03-01' } }] });
  try {
    // saiu depois de a lista abrir: o toque não grava nada e a linha diz por quê
    await m.ev(([dia, dk]) => window.__banco.poe('daycare/checkout-corpo/' + dia + '/' + dk, { tipo: 'saida', quem: 'Zeloso Teste', hora: '09:40', fim: Date.parse(dia + 'T09:40:00-03:00') }), [DIA, m.dcDe('Teste Saiu')]);
    await m.zerarLog();
    await m.tocar('Teste Saiu', 'ecto_p', 'autorizar_loja');
    igual(gravouAlgo(await m.log()), [], 'quem saiu: nada gravado');
    assert.match(await m.texto('Teste Saiu'), /saída não permite registrar|presença não permite|Já saiu hoje/i);
    igual((await m.ficha('Teste Saiu')).ecto_t, '2026-10-01', 'a ficha de quem saiu não mudou');
    // vacina: nenhum campo novo e a ficha da vacina não muda com a resposta
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-ficha174]'), m.cuidado('Teste Vac', 'vac_mult_p')), false);
    await m.tocar('Teste Vac', 'vac_mult_p', 'autorizar_loja');
    igual((await m.ficha('Teste Vac')).vac_mult_t, '2025-11-01', 'vacina: a ficha só muda com a Veterinária, como antes');
    // «Vai fazer em casa» e «Não respondeu»: sem campos novos e sem ficha
    await m.tocar('Teste Casa', 'ecto_p', 'autorizar_externo');
    await m.tocar('Teste Aguarda', 'verm_p', 'aguardar');
    igual((await m.ficha('Teste Casa')).ecto_t, '2026-10-01'); igual((await m.ficha('Teste Aguarda')).verm_t, '2026-07-01');
    for (const [n, k] of [['Teste Casa', 'ecto_p'], ['Teste Aguarda', 'verm_p']]) assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-ficha174]'), m.cuidado(n, k)), false, n + ': sem os campos');
    // «Agendou para» aberto: sem os campos
    await m.abrirTodos(); await m.page.click(m.cuidado('Teste Agenda', 'col_p') + ' [data-zt694-acao="agendar-abrir"]'); await m.quieto(); await m.abrirTodos();
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-ficha174]'), m.cuidado('Teste Agenda', 'col_p')), false, '«Agendou para»: sem os campos');
    igual((await rastros(m)), [], 'nenhuma atualização na Prevenção');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C9', 'perto da meia-noite (23h50 de São Paulo), em aparelho em UTC ou em São Paulo, «feito hoje» é o dia de São Paulo (AC3) [F]', async () => {
  const m = await mundo({ filhots: [THEO()] }, { relogio: DIA + 'T23:50:00-03:00' });
  try {
    const t = await m.ev((s) => { const b = document.querySelector(s + ' [data-zt694-ficha174]'); return b ? b.innerText : ''; }, m.cuidado('Teste Theo', 'ecto_p'));
    assert.match(t, /«Autorizou pegar na loja» e «Trouxe na bolsa»: feito hoje, 03\/11\/2026\./, 'o fuso do navegador é ' + FUSO_NAVEGADOR + ': ' + t);
    assert.strictEqual(await m.ev(() => window.ZelozinhaLanca174.hojeSP(Date.now())), DIA);
  } finally { await m.fechar(); }
}, 'C');

/* QA (rodada 1, bloqueio 1): a rede cai no meio do toque. A resposta e a linha do Lançamento do dia ficam salvas e a ficha não; o formulário
   do cuidado fica aberto (o plano B). O «Atualizar ficha» do cuidado precisa concluir num toque, sem «outro cuidado», sem duplicar nada. */
const falharPrevLancar = (m) => m.ev(() => { window.__prevLancarReal = window.__prevLancarReal || prevLancar; window.__falhasPrev = 0; window.prevLancar = function () { window.__falhasPrev++; return Promise.resolve({ ok: false, erro: 'sem rede (teste)' }); }; });
const voltarPrevLancar = (m) => m.ev(() => { window.prevLancar = window.__prevLancarReal; });
const editorTexto = (m, n, k) => m.ev((s) => { const e = document.querySelector(s + ' [data-z138-editor-native]'); return e ? e.innerText : ''; }, m.cuidado(n, k));
const SEM_OUTRO = /Há dados de outro cuidado/;
const fichaEmDiaLoja = async (m, n) => {
  const f = await m.ficha(n);
  igual([f.ecto_t, f.ecto_p, f.ecto_prod, f.ecto_tipo, f.ecto_nome, f.ecto_ondefoi, f.ecto_por], [DIA, '2026-12-03', 'Pipeta', 'Pipeta', 'Confront pet', 'Day Care', 'Day Care — registrado por Amanda'], n + ': a ficha em dia');
};

prova('C11', 'a rede cai no meio do toque (loja e bolsa): a resposta e a linha ficam salvas, a ficha não, e o cartão avisa; o formulário que ficou aberto diz «Local informado: Day Care»; o «Atualizar ficha» conclui num toque (ficha em dia, um rastro, uma linha), sem «outro cuidado»; o mesmo com o banco recusando a ficha, e com o «Salvar» do formulário (item B; QA rodada 1) [F]', async () => {
  const m = await mundo({ filhots: [THEO('Teste Rede'), THEO('Teste Rede Banco'), THEO('Teste Rede Salvar')] });
  try {
    // 1) o prevLancar falha (a rede cai): depois, «Atualizar ficha»
    await falharPrevLancar(m);
    await m.tocar('Teste Rede', 'ecto_p', 'autorizar_loja');
    assert.ok((await m.ev(() => window.__falhasPrev)) >= 1, 'o prevLancar foi chamado e falhou');
    let t = await m.texto('Teste Rede', 'ecto_p');
    assert.match(t, /A ficha não foi atualizada: sem rede \(teste\)\. Confira o formulário abaixo e toque em Salvar, ou use «Atualizar ficha»\./, t);
    igual([(await respostaDe(m, 'Teste Rede', 'ecto_p')).resposta.origem, Object.keys(await linhasDe(m, 'carrapaticida')).length, (await m.ficha('Teste Rede')).ecto_t], ['loja', 1, '2026-10-01'], 'a resposta e a linha salvas; a ficha ainda não');
    const ed = await editorTexto(m, 'Teste Rede', 'ecto_p');
    assert.match(ed, /Local informado\s*Day Care/, 'o formulário aberto diz o que o Salvar grava: ' + ed);
    assert.ok(!/Tutor em casa/.test(ed), 'e não «Tutor em casa»');
    await voltarPrevLancar(m);
    /* o laço do QA: cada toque no «Atualizar ficha» repetia «Há dados de outro cuidado…» e nada gravava; agora UM toque conclui */
    await m.abrirTodos(); await m.page.click(m.cuidado('Teste Rede', 'ecto_p') + ' [data-zt694-acao="ficha174"]'); await m.quieto(); await m.abrirTodos();
    await ate(async () => (await m.ficha('Teste Rede')).ecto_t === DIA, 15000);
    t = await m.texto('Teste Rede', 'ecto_p');
    assert.strictEqual((await m.ficha('Teste Rede')).ecto_t, DIA, 'um toque no «Atualizar ficha» deixa a ficha em dia; o cartão: ' + t);
    await fichaEmDiaLoja(m, 'Teste Rede');
    assert.ok(!SEM_OUTRO.test(t), 'sem «outro cuidado»: ' + t);
    assert.match(t, /Ficha em dia: Carrapaticida feito em 03\/11\/2026; próximo em 03\/12\/2026\./, t);
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-z138-editor-native]') || !!document.querySelector(s + ' [data-zt694-acao="ficha174"]'), m.cuidado('Teste Rede', 'ecto_p')), false, 'o formulário e o «Atualizar ficha» saem do cuidado');
    // 2) a gravação da ficha no banco cai (bolsa), pelo prevLancar de verdade: depois, «Atualizar ficha»
    await m.ev(() => { const b = window.__banco, real = b.ref; window.__refReal = real; b.ref = function (p) { const r = real(p); if (/^daycare\/cadastro\//.test(String(p))) r.update = function () { return Promise.reject(new Error('sem rede (teste)')); }; return r; }; });
    await m.tocar('Teste Rede Banco', 'ecto_p', 'autorizar_bolsa');
    t = await m.texto('Teste Rede Banco', 'ecto_p');
    assert.match(t, /A ficha não foi atualizada/, t);
    igual([(await respostaDe(m, 'Teste Rede Banco', 'ecto_p')).resposta.origem, (await m.ficha('Teste Rede Banco')).ecto_t], ['bolsa', '2026-10-01']);
    await m.ev(() => { window.__banco.ref = window.__refReal; });
    await m.abrirTodos(); await m.page.click(m.cuidado('Teste Rede Banco', 'ecto_p') + ' [data-zt694-acao="ficha174"]'); await m.quieto(); await m.abrirTodos();
    await ate(async () => (await m.ficha('Teste Rede Banco')).ecto_t === DIA, 15000);
    await fichaEmDiaLoja(m, 'Teste Rede Banco');
    assert.ok(!SEM_OUTRO.test(await m.texto('Teste Rede Banco', 'ecto_p')), 'sem «outro cuidado»');
    // 3) o plano B pelo «Salvar» do formulário que ficou aberto: conclui e o cuidado mostra a vitória
    await falharPrevLancar(m);
    await m.tocar('Teste Rede Salvar', 'ecto_p', 'autorizar_loja');
    assert.strictEqual((await m.ficha('Teste Rede Salvar')).ecto_t, '2026-10-01');
    await voltarPrevLancar(m);
    await m.abrirTodos(); await m.page.click(m.cuidado('Teste Rede Salvar', 'ecto_p') + ' [data-z138-editor-native] [data-zt694-acao="salvar-ficha"]'); await m.quieto(); await m.abrirTodos();
    await ate(async () => (await m.ficha('Teste Rede Salvar')).ecto_t === DIA, 15000);
    await fichaEmDiaLoja(m, 'Teste Rede Salvar');
    await ate(async () => /Ficha em dia: Carrapaticida/.test(await m.texto('Teste Rede Salvar', 'ecto_p') || ''), 8000);
    assert.match(await m.texto('Teste Rede Salvar', 'ecto_p') || '(o cuidado saiu do cartão)', /Ficha em dia: Carrapaticida feito em 03\/11\/2026; próximo em 03\/12\/2026\./);
    // um rastro e uma linha por FILHOt, nada em dobro
    const rs = await rastros(m), por = (n) => rs.filter((x) => x.dcKey === m.dcDe(n) || x.chave === m.pkDe(n)).length;
    igual([rs.length, por('Teste Rede'), por('Teste Rede Banco'), por('Teste Rede Salvar')], [3, 1, 1, 1], 'um rastro para cada: ' + JSON.stringify(rs.map((x) => [x.pet, x.chave, x.dcKey])));
    const ls = await linhasDe(m, 'carrapaticida'), porLinha = (n) => Object.keys(ls).filter((id) => ls[id].chave === m.dcDe(n)).length;
    igual([porLinha('Teste Rede'), porLinha('Teste Rede Banco'), porLinha('Teste Rede Salvar')], [1, 1, 1], 'uma linha no Lançamento do dia para cada');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C12', '«Tutor já fez» com a rede caindo no meio: tocar de novo (com a mesma data, ou com a data corrigida) conclui num toque (a ficha com a data certa, «Tutor em casa», um rastro), sem «outro cuidado» (o mesmo conserto no abrirFichaTutor138; QA rodada 1) [F]', async () => {
  const m = await mundo({ filhots: [THEO('Teste Tutor Mesma'), THEO('Teste Tutor Rede')] });
  try {
    /* um FILHOt de cada vez: o formulário aberto de um cuidado, com dados não salvos, barra o de OUTRO cuidado (o aviso «outro cuidado», que vale) */
    for (const [n, dt, prox] of [['Teste Tutor Mesma', '2026-10-28', '2026-11-27'], ['Teste Tutor Rede', '2026-10-29', '2026-11-28']]) {
      await falharPrevLancar(m);
      await tutorFez(m, n, 'ecto_p', '2026-10-28');
      let t = await m.texto(n, 'ecto_p');
      assert.match(t, /A ficha não foi atualizada: sem rede \(teste\)/, t);
      igual([(await respostaDe(m, n, 'ecto_p')).resposta.confirmacaoTutor137.dataAplicacao, (await m.ficha(n)).ecto_t], ['2026-10-28', '2026-10-01']);
      assert.match(await editorTexto(m, n, 'ecto_p'), /Local informado\s*Tutor em casa/, 'o formulário do tutor continua dizendo «Tutor em casa»');
      await voltarPrevLancar(m);
      /* a rede voltou: a equipe toca de novo com a mesma data (Mesma) ou com a data que o tutor corrigiu (Rede); o formulário que ficou
         aberto é deste mesmo cuidado e é reaproveitado (mesma data) ou refeito (data nova) */
      await tutorFez(m, n, 'ecto_p', dt);
      await ate(async () => (await m.ficha(n)).ecto_t === dt, 15000);
      const f = await m.ficha(n);
      igual([f.ecto_t, f.ecto_p, f.ecto_ondefoi, f.ecto_por], [dt, prox, 'Tutor em casa', 'Tutor — informado por Amanda'], n + ': o cartão: ' + (await m.texto(n, 'ecto_p')));
      igual((await respostaDe(m, n, 'ecto_p')).resposta.confirmacaoTutor137.dataAplicacao, dt, n + ': a resposta com a data');
      t = await m.texto(n, 'ecto_p');
      assert.ok(!SEM_OUTRO.test(t), n + ': sem «outro cuidado»: ' + t);
      assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-z138-editor-native]'), m.sel(n)), false, n + ': o formulário fecha');
    }
    const rs = await rastros(m), por = (n) => rs.filter((x) => x.dcKey === m.dcDe(n) || x.chave === m.pkDe(n)).length;
    igual([rs.length, por('Teste Tutor Mesma'), por('Teste Tutor Rede')], [2, 1, 1], 'um rastro para cada');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

prova('C13', 'ajustes do QA (rodada 1): depois da loja com a ficha em dia, o «Tutor já fez» sai do cuidado; o nome do produto com caractere invisível tem aviso próprio, e o de 81 letras o de sempre, sem gravar nada', async () => {
  const m = await mundo({ filhots: [THEO('Teste Sem Fez'), THEO('Teste Nome')] });
  try {
    assert.strictEqual(await m.ev((s) => !!document.querySelector(s + ' [data-zt694-tutor-fez]'), m.cuidado('Teste Sem Fez', 'ecto_p')), true, 'antes do toque, o «Tutor já fez» está lá');
    await m.tocar('Teste Sem Fez', 'ecto_p', 'autorizar_loja');
    await ate(async () => (await m.ficha('Teste Sem Fez')).ecto_t === DIA, 15000); await m.quieto(200); await m.abrirTodos();
    const depois = await m.ev((s) => ({ fez: !!document.querySelector(s + ' [data-zt694-tutor-fez]') || !!document.querySelector(s + ' [data-zt694-acao="tutor-fez"]'), texto: (document.querySelector(s) || {}).innerText || '' }), m.cuidado('Teste Sem Fez', 'ecto_p'));
    assert.strictEqual(depois.fez, false, 'com a ficha em dia, o «Tutor já fez» sai: ' + depois.texto);
    assert.match(depois.texto, /Ficha em dia: Carrapaticida/);
    /* o campo tem maxlength=80; o valor vem por programa (como num colar de outro aplicativo) para chegar ao conferir de antes de gravar */
    const porNome = (valor) => m.ev(([s, v]) => { const x = document.querySelector(s + ' [data-zt174-campo="nome"]'); x.value = v; x.dispatchEvent(new Event('input', { bubbles: true })); }, [m.cuidado('Teste Nome', 'ecto_p'), valor]);
    const recusado = async (valor) => {
      await porNome(valor); await m.zerarLog(); await m.tocar('Teste Nome', 'ecto_p', 'autorizar_loja');
      igual(gravouAlgo(await m.log()), [], 'nada gravado com o nome ' + JSON.stringify(valor));
      return m.texto('Teste Nome', 'ecto_p');
    };
    assert.match(await recusado('Confront\tpet'), /O nome do produto tem um caractere invisível \(por exemplo, uma tabulação\): apague e digite o nome de novo\./);
    assert.match(await recusado('C'.repeat(81)), /O nome do produto pode ter até 80 letras\./);
    SEM_PALAVRA_PROIBIDA(await m.texto('Teste Nome'));
    await porNome('Confront pet'); await m.tocar('Teste Nome', 'ecto_p', 'autorizar_loja');   /* com o nome certo, o mesmo toque grava */
    await ate(async () => (await m.ficha('Teste Nome')).ecto_t === DIA, 15000);
    await fichaEmDiaLoja(m, 'Teste Nome');
    assert.strictEqual(m.erros.length, 0, m.erros.join(' | '));
  } finally { await m.fechar(); }
}, 'C');

/* [C] com a base: o mesmo roteiro no app do master (APP174_BASE) e no novo grava os MESMOS caminhos em «Vai fazer em casa», «Não respondeu» e «Agendou para» */
const BASE = process.env.APP174_BASE || '';
const roteiroControle = async (app) => {
  const m = await mundo({ filhots: [{ n: 'Teste Casa', tutor: 'Tutor Teste Casa', cuidados: ['ecto_p'], vence: { ecto_p: VENCIDO }, ficha: { ecto_prod: 'Pipeta', ecto_tipo: 'Pipeta', ecto_t: '2026-10-01' } },
    { n: 'Teste Aguarda', tutor: 'Tutor Teste Aguarda', cuidados: ['verm_p'], ficha: { verm_t: '2026-07-01', verm_doses: 'Dose única' } },
    { n: 'Teste Agenda', tutor: 'Tutor Teste Agenda', cuidados: ['col_p'], ficha: { col_nome: 'Seresto', col_t: '2026-03-01' } }] }, { app });
  try {
    await m.zerarLog();
    await m.tocar('Teste Casa', 'ecto_p', 'autorizar_externo');
    await m.tocar('Teste Aguarda', 'verm_p', 'aguardar');
    await m.abrirTodos(); await m.page.click(m.cuidado('Teste Agenda', 'col_p') + ' [data-zt694-acao="agendar-abrir"]'); await m.quieto(); await m.abrirTodos();
    await m.page.fill(m.cuidado('Teste Agenda', 'col_p') + ' [data-zt694-agenda-data]', '2026-11-05');
    await m.page.click(m.cuidado('Teste Agenda', 'col_p') + ' [data-zt694-acao="agendar-salvar"]'); await m.quieto();
    const norm = (p) => p.replace(/\/-N\d+x$/, '/ID').replace(/r88_[0-9a-f]+/g, 'R').replace(/v1_[A-Za-z0-9_-]+/g, 'K');
    return (await m.log()).gravacoes.map((g) => g.op + ' ' + norm(g.path)).sort();
  } finally { await m.fechar(); }
};
prova('C10', '«Vai fazer em casa», «Não respondeu» e «Agendou para»: o mesmo resultado de gravação do master (caminho por caminho) (AC12 [C])', async () => {
  const novo = await roteiroControle(APP), base = await roteiroControle(BASE);
  igual(novo, base, 'as mesmas gravações');
  assert.ok(novo.some((x) => /zelozinha-agenda|agenda/.test(x)) && novo.some((x) => /vencimentos/.test(x)), 'o roteiro grava as respostas e o agendamento: ' + novo.join(' | '));
}, 'B');

// ---------------------------------------------------------------- a rodada
(async () => {
  for (const p of fila) {
    if (!quer(p.id)) continue;
    if ((p.ambiente === 'C' || p.ambiente === 'B') && semNavegador) { puladas++; console.log('  - ' + p.nome + ' — PULADO (' + semNavegador + ')'); continue; }
    if (p.ambiente === 'B' && !BASE) { puladas++; console.log('  - ' + p.nome + ' — PULADO (sem APP174_BASE, o app do master para comparar; a C8 cobre o que não muda)'); continue; }
    try { await p.fn(); ok++; console.log('  ✓ ' + p.nome); }
    catch (e) { falhas.push(p.nome + ' — ' + (e && e.message)); console.log('  ✗ ' + p.nome + '\n      ' + String(e && e.stack || e).split('\n').slice(0, 8).join('\n      ')); }
    finally { await fecharSobras(); }
  }
  if (navegador) await navegador.close();
  console.log('\n' + ok + ' provas passaram' + (puladas ? ', ' + puladas + ' puladas' : '') + (falhas.length ? ', ' + falhas.length + ' falharam' : '') + '.');
  if (falhas.length) { console.log('\nFALHARAM:\n  ' + falhas.join('\n  ')); process.exit(1); }
  console.log('zelozinha-lanca-tudo174: OK');
})();
