'use strict';
/*
 * INTERRUPTOR DE ECONOMIA DO FIREBASE — 08/set/2026.
 *
 * Grava daycare/config/economia, que TODO aparelho na versão 2026-09-08-04 ou mais nova
 * escuta. Serve para segurar a frota inteira em um comando, sem publicar versão nova:
 *
 *   node tools/economia.js --ver            mostra o que está no banco
 *   node tools/economia.js --pausar         pausa os relógios que leem o banco (Painel da
 *                                           Operação, risco de não comer, fila da vet)
 *   node tools/economia.js --retomar        volta ao normal
 *   node tools/economia.js --painel 120     o Painel da Operação passa a reler o dia a cada
 *                                           120 s (mínimo 30; padrão 30)
 *
 * Quando usar: o console do Firebase mostra download subindo sem explicação e o app
 * precisa continuar no ar enquanto se investiga. Pausar NÃO tira nenhuma tela do ar —
 * só para as releituras automáticas; abrir a tela de novo continua lendo.
 *
 * Login anônimo — a mesma porta que o app usa. Sem dependência externa.
 */
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const CAMINHO = 'daycare/config/economia';

async function tokenAnonimo() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const corpo = await r.json();
  if (!corpo || !corpo.idToken) throw new Error('Não obtive o token anônimo do Firebase');
  return corpo.idToken;
}

async function pedir(metodo, tokenAuth, tokenAppCheck, corpo) {
  const r = await fetch(`${DB_BASE}/${CAMINHO}.json?auth=${tokenAuth}`, {
    method: metodo,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhosFirebase(tokenAppCheck)),
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });
  if (!r.ok) throw new Error(metodo + ' recusado (HTTP ' + r.status + ')');
  return r.json();
}

function mostrar(v) {
  v = v || {};
  console.log('Relógios de leitura: ' + (v.pausar ? 'PAUSADOS' : 'ligados (normal)'));
  console.log('Painel da Operação relê o dia a cada: ' + Math.max(30, Number(v.painelSeg) || 30) + ' s');
  if (v.por || v.ts) console.log('Última mudança: ' + (v.por || '?') + ' em ' + (v.ts ? new Date(v.ts).toLocaleString('pt-BR') : '?'));
}

async function main() {
  const args = process.argv.slice(2);
  const tokenAuth = await tokenAnonimo();
  const tokenAppCheck = await obterTokenAppCheck();
  const atual = (await pedir('GET', tokenAuth, tokenAppCheck)) || {};

  let novo = null;
  if (args.includes('--pausar')) novo = Object.assign({}, atual, { pausar: true });
  if (args.includes('--retomar')) novo = Object.assign({}, atual, { pausar: false });
  const iP = args.indexOf('--painel');
  if (iP >= 0) {
    const seg = Number(args[iP + 1]);
    if (!(seg >= 30)) throw new Error('--painel precisa de um número de segundos, mínimo 30');
    novo = Object.assign({}, novo || atual, { painelSeg: seg });
  }

  if (!novo) { mostrar(atual); return; }
  novo.por = 'tools/economia.js (' + (process.env.USERNAME || process.env.USER || 'terminal') + ')';
  novo.ts = Date.now();
  await pedir('PUT', tokenAuth, tokenAppCheck, novo);
  const conferido = await pedir('GET', tokenAuth, tokenAppCheck);
  console.log('Gravado e conferido:');
  mostrar(conferido);
}

main().catch((e) => { console.error('ERRO:', e.message || e); process.exit(1); });
