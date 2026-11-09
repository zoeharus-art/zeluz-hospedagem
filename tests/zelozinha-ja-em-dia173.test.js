'use strict';
// Zelozinha: «Já em dia hoje» (Adriana, 04/11/2026, Opção B). A mensagem saiu às 09:50, às 09:53 a equipe atualizou a ficha e o
// cartão sumiu da tela; quem recebeu mensagem hoje e não está mais na lista aparece numa seção recolhível, só para consulta.
// Dados inventados, sem rede e sem banco de verdade.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');

let falhas = 0, total = 0;
const fila = [];
function prova(nome, fn) { fila.push([nome, fn]); }

function script(id) { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')); assert.ok(m, 'script ' + id); return m[1]; }
function novoContexto() {
  const ctx = { Intl, Date, JSON, Object, Array, Number, String, RegExp, Error, Promise, Math, Map, Set, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(script('zelozinha-simples'), ctx);
  return ctx;
}

const DIA = '2026-11-04';
const EM = (hora) => Date.parse(DIA + 'T' + hora + '-03:00');
/* a fila do dia pela porta que a tela usa: o banco de mentira só entrega os eventos que a tela escuta */
function ligarTela(ctx, itens) {
  const ZS = ctx.ZelozinhaSimples, ouv = [];
  ZS.ligar({ ref: (p) => ({ on: (ev, fn) => { ouv.push([p, ev, fn]); }, off: () => {} }) }, DIA);
  const emitir = (ev, key, it) => ouv.filter((o) => o[1] === ev && o[0] === `${ZS.FILA}/${DIA}`).forEach((o) => o[2]({ key, val: () => it }));
  Object.keys(itens || {}).forEach((k) => emitir('child_added', k, itens[k]));
  return { ZS, emitir };
}
const reg = (dc, nome, tutor, estado, extra) => Object.assign({ v: 1, dia: DIA, dcKey: dc, nome, tutor, estado, texto: 'Texto fictício de ' + nome, para: '5500900000000', itens: [{ itemK: 'verm_p', vence: DIA }], criadoEm: 1 }, extra || {});
const ITENS = {
  mel: reg('mel__fulana', 'Mel', 'Fulana Teste', 'enviado', { enviadoEm: EM('09:50:00'), itens: [{ itemK: 'ecto_p', vence: '2026-10-30' }] }),
  thor: reg('thor__beltrana', 'Thor', 'Beltrana Teste', 'enviado', { enviadoEm: EM('08:12:00'), itens: [{ itemK: 'vac_mult_p', vence: '2026-10-25' }, { itemK: 'verm_p', vence: '2026-10-25' }] }),
  luna: reg('luna__sicrano', 'Luna', 'Sicrano Teste', 'pronto'),
  fumaca: reg('fumaca__fulana', 'Fumaça', 'Fulana Teste', 'conferir', { tentativaEm: EM('09:00:00') }),
  nina: reg('nina__fulana', 'Nina', 'Fulana Teste', 'falhou'),
  rex: reg('rex__fulana', 'Rex', 'Fulana Teste', 'cancelado')
};
/* no banco a chave da fila é a dcKey */
Object.keys(ITENS).forEach((k) => { ITENS[ITENS[k].dcKey] = ITENS[k]; delete ITENS[k]; });

prova('a seção só lista quem recebeu mensagem hoje (enviado): pronto, conferir, falhou e cancelado ficam de fora', () => {
  const ctx = novoContexto(), { ZS } = ligarTela(ctx, ITENS);
  assert.deepEqual(ZS.enviadosHoje(DIA, {}).map((x) => x.dcKey), ['mel__fulana', 'thor__beltrana'], 'o mais recente primeiro');
  assert.equal(ZS.enviadosHoje('2026-11-05', {}).length, 0, 'outro dia: nada');
  const h = ZS.secaoEmDiaHTML(DIA, {});
  assert.match(h, /Já em dia hoje \(2\)/);
  ['Luna', 'Fumaça', 'Nina', 'Rex'].forEach((n) => assert.ok(!h.includes(n), n + ' não é desta seção'));
  ZS.desligar();
});

prova('quem já está na lista da tela não aparece de novo na seção (nem no contador)', () => {
  const ctx = novoContexto(), { ZS } = ligarTela(ctx, ITENS);
  const h = ZS.secaoEmDiaHTML(DIA, { 'mel__fulana': {} });
  assert.match(h, /Já em dia hoje \(1\)/); assert.ok(!h.includes('Mel')); assert.match(h, /Thor/);
  assert.equal(ZS.secaoEmDiaHTML(DIA, { 'mel__fulana': {}, 'thor__beltrana': {} }), '', 'sem ninguém, nenhuma seção');
  ZS.desligar();
});

prova('o cartão da seção: nome, tutor, cuidados, «ENVIADA 09:50» e «Ver mensagem»; recolhida por padrão, sem botões de resposta', () => {
  const ctx = novoContexto(), { ZS } = ligarTela(ctx, ITENS);
  const h = ZS.secaoEmDiaHTML(DIA, {});
  assert.match(h, /^<details class="zs-emdia" data-zs-emdia data-zt694-aberto="emdia\|hoje">/, 'fechada por padrão e com o estado guardado pelo mesmo mecanismo da tela');
  assert.ok(!/<details[^>]*\sopen[\s>]/.test(h.split('<div class="zs-emdia-corpo">')[0]), 'a seção não vem aberta');
  assert.match(h, /Mel[^<]*<small>[^<]*· Fulana Teste/); assert.match(h, /Proteção contra pulgas e carrapatos/);
  assert.match(h, /Vacina múltipla, Vermífugo/, 'todos os cuidados da mensagem');
  assert.match(h, /ENVIADA 09:50/); assert.match(h, /ENVIADA 08:12/);
  assert.match(h, /Ver mensagem/); assert.match(h, /Texto fictício de Mel/);
  assert.ok(!/<button/.test(h), 'só consulta: nenhum botão');
  assert.ok(!/data-zs-acao|zt694-acao|Mandar de novo|Foi enviada/.test(h));
  ZS.desligar();
});

prova('irmãos: «Ver mensagem» mostra o texto que saiu (textoEnviado) e o cartão continua sendo de cada FILHOt', () => {
  const ctx = novoContexto();
  const a = reg('bolinha__familia', 'Bolinha', 'Família Teste', 'enviado', { enviadoEm: EM('10:00:00'), textoEnviado: 'Texto dos irmãos', junto: ['bolinha__familia', 'farofa__familia'] });
  const b = reg('farofa__familia', 'Farofa', 'Família Teste', 'enviado', { enviadoEm: EM('10:00:00'), textoEnviado: 'Texto dos irmãos', junto: ['bolinha__familia', 'farofa__familia'], itens: [{ itemK: 'col_p', vence: DIA }] });
  const { ZS } = ligarTela(ctx, { [a.dcKey]: a, [b.dcKey]: b });
  const h = ZS.secaoEmDiaHTML(DIA, { 'farofa__familia': {} });
  assert.match(h, /\(1\)/); assert.match(h, /Bolinha/); assert.match(h, /Texto dos irmãos/); assert.ok(!/Texto fictício/.test(h));
  ZS.desligar();
});

prova('tudo escapado: nome, tutor, texto e chave com marcação não viram HTML', () => {
  const ctx = novoContexto();
  const ruim = reg('x"><img src=x onerror=alert(1)>__t', '<b>Nome</b>', 'Tutor <script>alert(2)</script>', 'enviado', { enviadoEm: EM('09:00:00'), textoEnviado: '<img src=x onerror=alert(3)>' });
  const { ZS } = ligarTela(ctx, { 'x"><img src=x onerror=alert(1)>__t': ruim });
  const h = ZS.secaoEmDiaHTML(DIA, {});
  assert.ok(!/<b>Nome|<script|<img/.test(h), h);
  assert.match(h, /&lt;b&gt;Nome&lt;\/b&gt;/); assert.match(h, /Tutor &lt;script&gt;/);
  assert.ok(!/data-zs-emdia-card="[^"]*"[^>]*"><img/.test(h));
  ZS.desligar();
});

prova('sem nome na fila, o cartão usa o que está na chave (antes do «__») em vez de quebrar', () => {
  const ctx = novoContexto();
  const it = reg('pipoca__familia-teste', '', '', 'enviado', { enviadoEm: EM('09:00:00') }); delete it.nome; delete it.tutor;
  const { ZS } = ligarTela(ctx, { 'pipoca__familia-teste': it });
  const h = ZS.secaoEmDiaHTML(DIA, {});
  assert.match(h, /pipoca/i); assert.match(h, /Ver mensagem/);
  ZS.desligar();
});

prova('a seção acompanha a fila já em memória: nasce quando o envio acontece e some quando o cartão volta à lista; sem leitura nova do banco', () => {
  const ctx = novoContexto(), leituras = [];
  const ZS = ctx.ZelozinhaSimples, ouv = [];
  ZS.ligar({ ref: (p) => ({ on: (ev, fn) => { ouv.push([p, ev, fn]); }, once: () => { leituras.push(p); throw Error('a seção não lê o banco'); }, off: () => {} }) }, DIA);
  const emitir = (ev, key, it) => ouv.filter((o) => o[1] === ev && o[0] === `${ZS.FILA}/${DIA}`).forEach((o) => o[2]({ key, val: () => it }));
  const mel = reg('mel__fulana', 'Mel', 'Fulana Teste', 'pronto');
  emitir('child_added', 'mel__fulana', mel);
  assert.equal(ZS.secaoEmDiaHTML(DIA, {}), '');
  emitir('child_changed', 'mel__fulana', Object.assign({}, mel, { estado: 'enviado', enviadoEm: EM('09:50:00') }));
  assert.match(ZS.secaoEmDiaHTML(DIA, {}), /Já em dia hoje \(1\)/);
  assert.equal(ZS.secaoEmDiaHTML(DIA, { 'mel__fulana': {} }), '', 'voltou para a lista: some da seção, sem duplicar');
  emitir('child_removed', 'mel__fulana', null);
  assert.equal(ZS.secaoEmDiaHTML(DIA, {}), '');
  assert.deepEqual(leituras, [], 'nenhuma leitura nova do banco');
  ZS.desligar();
});

/* a função da tela, tirada da página como está, rodando com a lista de cartões de mentira */
function funcaoDaPagina(nome) {
  const ini = html.indexOf('  function ' + nome + '(');
  assert.ok(ini > 0, 'a página tem ' + nome);
  const fim = html.indexOf('\n  }\n', ini);
  return html.slice(ini, fim + 4);
}
function telaDeMentira(ctx, itensDaLista) {
  const estado = { erro: '', resultado: { itens: Object.keys(itensDaLista).map((k) => ({ dcKey: k })) }, atualizacaoFalhou: false, historico143: undefined, itens: itensDaLista, dia: DIA };
  const classif = { paraResolver: Object.keys(itensDaLista).map((k) => ({ dcKey: k, contato: { dcKey: k } })), emAndamento: [] };
  const sandbox = Object.assign({}, ctx, { estado, window: ctx, classificacao117: () => classif, petHTML: (c) => `<article data-lista="${c.dcKey}"></article>`, topoTexto: () => 'N para resolver', diaAtual: () => DIA, esc: (v) => String(v) });
  vm.createContext(sandbox);
  vm.runInContext(funcaoDaPagina('emDiaHoje') + '\n' + funcaoDaPagina('montarMarkup') + '\nthis.montarMarkup=montarMarkup;', sandbox);
  return { montarMarkup: sandbox.montarMarkup, estado, classif };
}

prova('a tela: a seção vai no fim de «Para resolver», não aparece em «Em andamento» e não duplica quem está na lista', () => {
  const ctx = novoContexto(); ligarTela(ctx, ITENS);
  const { montarMarkup } = telaDeMentira(ctx, { 'mel__fulana': { dcKey: 'mel__fulana' } });
  const resolver = montarMarkup('resolve');
  assert.match(resolver, /data-lista="mel__fulana"/); assert.match(resolver, /Já em dia hoje \(1\)/); assert.match(resolver, /Thor/);
  assert.ok(resolver.indexOf('data-lista="mel__fulana"') < resolver.indexOf('Já em dia hoje'), 'a seção fica depois dos cartões');
  assert.ok(!/data-zs-emdia-card="mel__fulana"/.test(resolver), 'Mel está na lista: não repete na seção');
  assert.ok(!/Já em dia hoje/.test(montarMarkup('progress')), 'Em andamento não tem a seção');
  ctx.ZelozinhaSimples.desligar();
});

prova('a tela: lista vazia (o caso do cartão que sumiu) ainda mostra a seção; carregando e erro não mostram', () => {
  const ctx = novoContexto(); ligarTela(ctx, ITENS);
  const t = telaDeMentira(ctx, {});
  t.estado.resultado = { itens: [{ dcKey: 'qualquer__um' }] };
  assert.match(t.montarMarkup('resolve'), /Nada falta resolver nesta leitura[\s\S]*Já em dia hoje \(2\)/);
  t.estado.resultado = { itens: [] };
  assert.match(t.montarMarkup('resolve'), /Nenhum cuidado[\s\S]*Já em dia hoje \(2\)/);
  t.estado.resultado = null; assert.ok(!/Já em dia/.test(t.montarMarkup('resolve')));
  t.estado.resultado = { itens: [] }; t.estado.erro = 'falhou'; assert.ok(!/Já em dia/.test(t.montarMarkup('resolve')));
  ctx.ZelozinhaSimples.desligar();
});

prova('a tela: o estado aberto/fechado e a rolagem seguem o mesmo mecanismo do resto (data-zt694-aberto, pintar com preservar)', () => {
  assert.match(html, /function lembrarAbertos\(raiz\)\{Array\.prototype\.forEach\.call\(raiz\.querySelectorAll\('details\[data-zt694-aberto\]'\)/);
  assert.match(html, /if\(window\.ZelozinhaSimples\)window\.ZelozinhaSimples\.aoMudar\(function\(\)\{if\(estado\.resultado&&alvosAtuais\(\)\.length\)pintar\(alvosAtuais\(\),true\);\}\);/);
  const corpo = funcaoDaPagina('emDiaHoje');
  assert.ok(!/\.ref\(|\.once\(|\.on\(/.test(corpo), 'a tela não abre leitura nova do banco para a seção');
  assert.match(html, /\.zs-emdia\{/); assert.match(html, /\.zs-emdia\[open\]/);
});

prova('regras da casa: sem alert/confirm/prompt novos, sem vocabulário proibido no texto novo; versão 2026-11-09-02 em todos os arquivos versionados', () => {
  assert.match(html, /const APP_VERSAO='2026-11-09-02';/);
  assert.ok(!/2026-11-02-01/.test(html), 'nenhum ?v= ficou na versão antiga');
  const ini = html.indexOf('/* JÁ EM DIA HOJE'), fim = html.indexOf('/* fim JÁ EM DIA HOJE */');
  assert.ok(ini > 0 && fim > ini, 'o bloco novo está marcado no código');
  const novo = html.slice(ini, fim) + funcaoDaPagina('emDiaHoje');
  assert.ok(!/\b(alert|confirm|prompt)\(/.test(novo));
  assert.ok(!/\b(cão|cães|cachorro|baia|soltar|solto)\b/i.test(novo), 'vocabulário da casa');
});

(async () => {
  for (const [nome, fn] of fila) {
    total++;
    try { await fn(); console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n    ' + (e && e.stack || e)); }
  }
  console.log(`zelozinha-ja-em-dia173: ${total - falhas} de ${total} provas passaram`);
  if (falhas) process.exit(1);
})();
