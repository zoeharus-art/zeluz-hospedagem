'use strict';
/*
 * O FILHOt QUE NÃO CHEGOU À PLANILHA — 11/set/2026.
 *
 * POR QUE EXISTE
 * Adriana, 11/set/2026: "Duas irmãs entraram para a hospedagem, a Nala e a Irma, e você
 * simplesmente mandou para o dashboard e a planilha o nome de uma, da Nala. Se fizemos o
 * orçamento para 2, 3, 4, 6… precisamos que cada um entre na planilha para sabermos
 * quantos hóspedes teremos. Temos limite de vagas, e precisamos pagar as plantonistas,
 * então sempre precisa ir todos, cada um para uma linha da tabela."
 *
 * Até a versão 2026-09-10-01, um orçamento fechado mandava para a aba Hospedagem UMA linha
 * só — com o nome do PRIMEIRO FILHOt e o dinheiro inteiro. Os demais iam apenas para o
 * calendário, num segundo pedido (acao:'calendario'). Quem abria a tabela via um hóspede
 * onde havia dois. A versão 2026-09-11-01 corrige daqui para a frente (orcLinhasPlanilha).
 * Este script mostra — e conserta — o que ficou para trás.
 *
 * COMO USA
 *   node tools/reenviar-hospede.js --ver              o que falta, lendo o retrato do dia
 *   node tools/reenviar-hospede.js --ver --vivo       o mesmo, lendo o banco de verdade
 *   node tools/reenviar-hospede.js --ver --nome nala  só as reservas de quem tem esse nome
 *   node tools/reenviar-hospede.js --aplicar          reenvia à ponte o que falta, com rastro
 *
 * --ver NÃO ESCREVE NADA e, sem --vivo, nem toca o Firebase (lê tests/.retrato).
 * Só --aplicar grava — e grava na PLANILHA (pela mesma ponte do app) e no Firebase
 * (auaulandia/orcamentos/{id}: planilha_msg, planilha_ok e o rastro do reenvio).
 *
 * SEGURANÇA DE REPETIR: a ponte recusa linha repetida (_jaTem casa nome + entrada) e o
 * calendário reaproveita a coluna em que o FILHOt já está. Rodar duas vezes não duplica.
 */
const fs = require('fs');
const path = require('path');
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');
const retratoLib = require('../tests/lib/retrato');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const QUEM = 'tools/reenviar-hospede.js';
const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');

const args = process.argv.slice(2);
const VER = args.indexOf('--ver') >= 0;
const APLICAR = args.indexOf('--aplicar') >= 0;
const VIVO = args.indexOf('--vivo') >= 0 || APLICAR;
const FILTRO = (() => {
  const i = args.indexOf('--nome');
  return i >= 0 ? String(args[i + 1] || '').trim().toLowerCase() : '';
})();

function brData(iso) {
  const a = String(iso || '').split('-');
  return a.length === 3 ? (a[2] + '/' + a[1] + '/' + a[0]) : (iso || '—');
}
function brl(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------------
// A MESMA função do app — extraída do index.html, não copiada. Se a regra mudar lá,
// muda aqui junto: uma fonte só, como manda a lei do "tela e pagamento pelo mesmo cálculo".
function carregarOrcLinhasPlanilha() {
  const html = fs.readFileSync(APP, 'utf8');
  const ini = html.indexOf('  function orcLinhasPlanilha(o, hoje){');
  if (ini < 0) throw new Error('não achei orcLinhasPlanilha no index.html');
  const fim = html.indexOf('\n  function orcEnviarPlanilha(id){', ini);
  if (fim < 0) throw new Error('não achei o fim de orcLinhasPlanilha');
  const codigo = html.slice(ini, fim) + '\n return orcLinhasPlanilha;';
  return new Function(codigo)();   // eslint-disable-line no-new-func
}

// ---------------------------------------------------------------------------- rede
async function tokenAnonimo() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const corpo = await r.json();
  if (!corpo || !corpo.idToken) throw new Error('Não obtive o token anônimo do Firebase');
  return corpo.idToken;
}
async function ler(caminho, auth, appCheck) {
  const r = await fetch(`${DB_BASE}/${caminho}.json?auth=${auth}`, { headers: cabecalhosFirebase(appCheck) });
  if (!r.ok) throw new Error('GET ' + caminho + ' recusado (HTTP ' + r.status + ')');
  return JSON.parse((await r.text()) || 'null');
}
async function gravar(caminho, corpo, auth, appCheck) {
  const r = await fetch(`${DB_BASE}/${caminho}.json?auth=${auth}`, {
    method: 'PATCH',
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhosFirebase(appCheck)),
    body: JSON.stringify(corpo)
  });
  if (!r.ok) throw new Error('PATCH ' + caminho + ' recusado (HTTP ' + r.status + '): ' + (await r.text()).slice(0, 200));
  return r.json();
}

// ------------------------------------------------------------------- o levantamento
// `planilha_msg` é o recibo que o app guardou: "Nome/Raça/Tutor: <calendário> · <financeiro>",
// juntando os FILHOts com " | ". Quem não aparece ali nunca foi mandado; quem aparece com
// "nao mexe" foi só para o calendário — a linha do financeiro dele não existe.
function recibosDe(o) {
  const out = {};
  String((o && o.planilha_msg) || '').split(' | ').forEach((p) => {
    const i = p.indexOf(':');
    if (i < 0) return;
    out[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim();
  });
  return out;
}
function levantar(orcamentos, orcLinhasPlanilha) {
  const faltas = [];
  Object.keys(orcamentos || {}).forEach((id) => {
    const o = orcamentos[id] || {};
    if (o.status !== 'fechado') return;                 // só reserva confirmada ocupa vaga
    const linhas = orcLinhasPlanilha(o, o.entrada || '');
    if (linhas.length < 2) return;                      // 1 FILHOt sempre foi inteiro
    const rec = recibosDe(o);
    const nomes = (o.pets || []).map((p) => String(p.nome || ''));
    if (FILTRO && !nomes.some((n) => n.toLowerCase().indexOf(FILTRO) >= 0)) return;
    const semLinha = linhas.filter((L) => {
      const r = rec[L.peludoTutor.toLowerCase()];
      return !r || /nao mexe|linha unica/i.test(r);
    });
    if (!semLinha.length) return;
    faltas.push({ id, o, linhas, semLinha, recibo: o.planilha_msg || '' });
  });
  return faltas.sort((a, b) => String(a.o.entrada || '').localeCompare(String(b.o.entrada || '')));
}

function mostrar(faltas, fonte, totalFechados) {
  console.log('');
  console.log('=== FILHOts SEM LINHA PRÓPRIA NA PLANILHA ===');
  console.log('fonte: ' + fonte + ' · reservas FECHADAS com 2 ou mais FILHOts examinadas: ' + totalFechados);
  console.log('');
  if (!faltas.length) {
    console.log('Nenhum FILHOt ficou de fora: toda reserva fechada com mais de um FILHOt tem uma');
    console.log('linha por FILHOt na aba Hospedagem.');
    if (FILTRO) console.log('(filtro de nome ativo: "' + FILTRO + '")');
    return;
  }
  faltas.forEach((f) => {
    const nomes = (f.o.pets || []).map((p) => p.nome).join(' e ');
    console.log('• Reserva ' + String(f.id).slice(-6).toUpperCase() + ' — ' + nomes
      + ' · ' + brData(f.o.entrada) + ' a ' + brData(f.o.saida)
      + ' · tutor: ' + (f.o.tutor || '—'));
    console.log('  recibo guardado: ' + (f.recibo || '(nenhum)'));
    f.semLinha.forEach((L) => {
      console.log('  FALTA a linha de "' + L.peludoTutor + '" — ' + L.noites + ' noite(s), '
        + brl(L.total) + ' (reserva ' + brl(L.reserva) + ' · a pagar ' + brl(L.aPagar) + ')');
    });
    console.log('');
  });
  console.log('Ao todo: ' + faltas.reduce((a, f) => a + f.semLinha.length, 0)
    + ' linha(s) a mandar, em ' + faltas.length + ' reserva(s).');
  console.log('Para corrigir: node tools/reenviar-hospede.js --aplicar');
}

async function aplicar(faltas, auth, appCheck) {
  const cfg = (await ler('auaulandia/config/orcamento/sheets', auth, appCheck)) || {};
  if (!cfg.url) throw new Error('A ponte com a planilha não está configurada (auaulandia/config/orcamento/sheets).');
  for (const f of faltas) {
    const recibos = [];
    for (const L of f.semLinha) {                       // UMA de cada vez: a ponte escolhe a coluna lendo o calendário
      const r = await fetch(cfg.url, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ token: cfg.token || '' }, L))
      });
      const txt = await r.text().catch(() => '');
      let j = null;
      try { j = JSON.parse(txt); } catch (e) { j = { ok: false, erro: String(txt).slice(0, 120) }; }
      recibos.push(L.peludoTutor + ': ' + [(j && j.calendario) || '', (j && j.financeiro) || ''].filter(Boolean).join(' · '));
      console.log((j && j.ok ? '  ok  ' : '  ERRO ') + recibos[recibos.length - 1]);
    }
    const msg = [f.recibo, recibos.join(' | ')].filter(Boolean).join(' | ');
    await gravar('auaulandia/orcamentos/' + f.id, {
      planilha_msg: msg,
      planilha_ok: recibos.every((x) => !/ERRO/i.test(x)),
      reenvio_11set: {
        quando: new Date().toISOString().slice(0, 10),
        quem: QUEM,
        ts: Date.now(),
        filhots: f.semLinha.map((L) => L.peludoTutor),
        motivo: 'FILHOt sem linha própria na aba Hospedagem (versões até 2026-09-10-01)'
      }
    }, auth, appCheck);
  }
  console.log('');
  console.log('Pronto. Confira a aba Hospedagem: cada FILHOt agora tem a linha dele.');
}

async function main() {
  if (!VER && !APLICAR) {
    console.log('Use --ver (só mostra) ou --aplicar (corrige, com rastro).');
    process.exit(1);
  }
  const orcLinhasPlanilha = carregarOrcLinhasPlanilha();
  let orcamentos = null, fonte = '';
  let auth = null, appCheck = null;
  if (VIVO) {
    appCheck = await obterTokenAppCheck().catch(() => null);
    auth = await tokenAnonimo();
    orcamentos = await ler('auaulandia/orcamentos', auth, appCheck);
    fonte = 'banco vivo (' + new Date().toLocaleString('pt-BR') + ')';
  } else {
    const R = retratoLib.carregar();
    orcamentos = retratoLib.ler(R, 'auaulandia/orcamentos');
    fonte = 'retrato de ' + R.dia + ' (para o estado de agora: --vivo)';
  }
  const totalFechados = Object.keys(orcamentos || {})
    .filter((id) => (orcamentos[id] || {}).status === 'fechado' && ((orcamentos[id] || {}).pets || []).length > 1).length;
  const faltas = levantar(orcamentos, orcLinhasPlanilha);
  mostrar(faltas, fonte, totalFechados);
  if (APLICAR && faltas.length) await aplicar(faltas, auth, appCheck);
}

main().catch((e) => { console.error('ERRO:', (e && e.message) || e); process.exit(1); });
