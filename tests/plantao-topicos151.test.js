'use strict';

// A ficha do Plantão em tópicos (Adriana, 27/out/2026: «Clicou no nome do peludinho, aparecem as
// coisas dele. Os tópicos dentro de cada ficha — para abrir, fazer e aplicar.»), o ALERTA para o
// plantão e o «Como comeu?». Lê só o index.html; dados fictícios, sem banco.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'auaulandia', 'index.html'), 'utf8');

function funcao(nome) {
  const inicio = src.indexOf('function ' + nome + '(');
  assert.ok(inicio >= 0, 'função ausente: ' + nome);
  const abre = src.indexOf('{', inicio);
  let nivel = 0;
  let aspas = '';
  let escape = false;
  for (let i = abre; i < src.length; i += 1) {
    const c = src[i];
    if (aspas) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === aspas) aspas = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') nivel += 1;
    if (c === '}' && --nivel === 0) return src.slice(inicio, i + 1);
  }
  throw new Error('função incompleta: ' + nome);
}

let n = 0;
function prova(nome, fn) { fn(); n += 1; void nome; }

// ---------------------------------------------------------------- o alerta: quando vale
const ctx = { ALERTAS_CACHE: {}, HOJE: '2026-10-27' };
ctx.cadKey = (h) => String(h.refKey || (h.nome + '__' + h.tutor)).toLowerCase();
ctx.zHojeISO = () => ctx.HOJE;
vm.createContext(ctx);
vm.runInContext(['alertaFimTs', 'alertaVale', 'alertasAtivosDe'].map(funcao).join('\n'), ctx);
const run = (c) => vm.runInContext(c, ctx);

prova('«Só hoje» vale até o meio-dia do dia seguinte (a noite do plantão atravessa a meia-noite)', () => {
  const fim = run("alertaFimTs('2026-10-27', 1)");
  assert.strictEqual(fim, new Date(2026, 9, 28, 12, 0, 0).getTime());
  assert.strictEqual(run("alertaFimTs('2026-10-27', 3)"), new Date(2026, 9, 30, 12, 0, 0).getTime(), 'pernoite de 3 noites');
  assert.strictEqual(run("alertaFimTs('27/10/2026', 1)"), 0, 'data fora do formato não inventa prazo');
});

prova('alerta tirado, vencido, sem frase ou de pernoite futuro não aparece; o resto aparece, o mais novo primeiro', () => {
  const agora = new Date(2026, 9, 27, 22, 10).getTime();
  ctx.ALERTAS_CACHE = {
    'ref-thor': {
      a1: { txt: 'Afastado dos outros — suspeita de virose', ts: agora - 3600e3, desde: '2026-10-27', ateTs: new Date(2026, 9, 28, 12).getTime() },
      a2: { txt: 'Dorme sozinho — não aceita os outros', ts: agora - 60e3, desde: '2026-10-20', ateTs: 0 },
      a3: { txt: 'Já tirado', ts: agora, tirado: { quem: 'Monitora Exemplo', ts: agora } },
      a4: { txt: 'Venceu ontem', ts: agora - 86400e3 * 2, ateTs: new Date(2026, 9, 26, 12).getTime() },
      a5: { txt: '   ', ts: agora },
      a6: { txt: 'Pernoite da semana que vem', ts: agora, desde: '2026-11-03', ateTs: new Date(2026, 10, 4, 12).getTime() },
    },
  };
  ctx.AGORA = agora;
  const L = run("(function(){ var _n=Date.now; Date.now=function(){ return AGORA; }; try{ return alertasAtivosDe({refKey:'ref-thor'}).map(function(a){ return a._id; }).join(','); } finally { Date.now=_n; } })()");
  assert.strictEqual(L, 'a2,a1');
  assert.strictEqual(run("alertasAtivosDe({refKey:'ref-mel'}).length"), 0, 'FILHOt sem alerta');
  assert.strictEqual(run('alertasAtivosDe(null).length'), 0);
});

// ---------------------------------------------------------------- a ficha: os tópicos
const ficha = src.slice(src.indexOf('<div id="hosp-ficha"'), src.indexOf('<div class="card so-equipe" id="hf-zonarisco"'));

prova('a ficha tem os tópicos na ordem: ALERTA, MEDICAMENTO, ALIMENTAÇÃO, OBSERVAÇÕES, relatórios, CADASTRO', () => {
  const pos = ['id="tp-alerta"', 'id="tp-med"', 'id="tp-alim"', 'id="tp-obs"', 'class="rel-stack"', 'id="tp-cad"'].map((s) => ficha.indexOf(s));
  pos.forEach((p, i) => assert.ok(p > 0, 'tópico ausente: ' + i));
  assert.deepStrictEqual(pos.slice().sort((a, b) => a - b), pos, 'ordem dos tópicos');
  ['tp-alerta', 'tp-med', 'tp-alim', 'tp-obs', 'tp-cad'].forEach((id) => {
    assert.ok(new RegExp('class="card rel-card collapsed tp-card" id="' + id + '"').test(ficha), id + ' começa fechado');
    assert.ok(ficha.indexOf("onclick=\"toggleRel('" + id + "')\"") > 0, id + ' abre e fecha');
  });
});

prova('os ids de antes continuam valendo, cada um uma vez, e no tópico certo', () => {
  const dentro = (id, de, ate) => {
    const p = ficha.indexOf('id="' + id + '"');
    return p > ficha.indexOf(de) && p < ficha.indexOf(ate);
  };
  ['magHoje', 'magItens', 'mag-status', 'magAvNome', 'mag-avulsa-status', 'hf-obsgeral', 'hf-vet-instr', 'magSoLeituraAviso', 'card-medagenda',
    'hf-alertas', 'hfComeuSeg', 'hf-alim-info', 'hfAlertaDiaBox'].forEach((id) => {
    assert.strictEqual(src.split('id="' + id + '"').length - 1, 1, 'id único: ' + id);
  });
  assert.ok(dentro('magHoje', 'id="tp-med"', 'id="tp-alim"'), 'Horários de hoje no MEDICAMENTO');
  assert.ok(dentro('magAvNome', 'id="tp-med"', 'id="tp-alim"'), 'dose avulsa no MEDICAMENTO');
  assert.ok(dentro('hf-obsgeral', 'id="tp-obs"', 'class="rel-stack"'), 'recados nas OBSERVAÇÕES');
  assert.ok(dentro('hf-vet-instr', 'id="tp-obs"', 'class="rel-stack"'), 'instrução da vet nas OBSERVAÇÕES');
  assert.ok(ficha.indexOf('id="magItens"') > ficha.indexOf('id="tp-cad"'), 'o cadastro do remédio no CADASTRO');
  assert.ok(dentro('hfAlertaDiaBox', 'id="card-dia"', 'id="card-inicio"'), 'o alerta se lança no Relatório do Dia');
});

prova('o cadastro do remédio some para a plantonista; o alerta de lançar também', () => {
  assert.ok(/body\[data-role="plantonista"\] #tp-cad\{display:none !important\}/.test(src));
  assert.ok(/<div class="so-equipe" id="hfAlertaDiaBox"><\/div>/.test(ficha));
});

prova('«Como comeu?» tem as 3 opções que ela pediu, e o alerta fica fora das perguntas obrigatórias do relatório', () => {
  const seg = ficha.slice(ficha.indexOf('id="hfComeuSeg"'), ficha.indexOf('id="hf-comeu-st"'));
  assert.deepStrictEqual((seg.match(/>([^<]+)<\/button>/g) || []).map((s) => s.slice(1, -9)), ['Comeu', 'Somente metade', 'Não comeu']);
  assert.ok(/fichaComeuMarcar\('nao',this\)/.test(seg));
  const form = funcao('alertaFormHTML');
  assert.ok(!/obsline/.test(form) && !/<textarea/.test(form), 'o relatório lê .obsline e textarea como perguntas — o alerta não usa nenhum dos dois');
  assert.ok(/'auaulandia\/comeu\/'\+dataKeyAtual\(\)\+'\/'\+k/.test(funcao('fichaComeuCaminho')), 'grava no dia da ficha');
});

prova('o pernoite grava o alerta junto, e o card ganha a tarja ALERTA', () => {
  const pf = funcao('abrirPernForm');
  assert.ok(/alertaFormHTML\('pf'/.test(pf));
  const sp = funcao('salvarPernAgendado');
  assert.ok(/alertaFormLer\('pf'\)/.test(sp) && /'auaulandia\/alertas\/'\+_alKey/.test(sp));
  const rh = funcao('renderHosp');
  assert.ok(/alertasAtivosDe\(h\)\.length\) \? '<span class="mini-alert">ALERTA<\/span>'/.test(rh));
  assert.ok(/\$\{alertaVivoFoto\}/.test(rh));
});

console.log('plantao-topicos151: OK (' + n + ' provas)');
