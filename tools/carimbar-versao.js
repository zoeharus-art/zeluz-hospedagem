'use strict';
/*
 * Carimbo da versão do app — grava `daycare/config/versao-app` no Realtime Database.
 *
 * Por que existe: publicar não é só `git push`. Enquanto o número da versão não é
 * carimbado no banco, o celular da equipe continua abrindo a versão velha. Este
 * script é o carimbo — a última etapa de publicar.
 *
 * Uso:
 *   node tools/carimbar-versao.js 2026-08-28-01        grava e confere
 *   node tools/carimbar-versao.js 2026-08-28-01 --ver  só mostra o que está lá
 *
 * App Check: se existir a variável de ambiente FIREBASE_APPCHECK_DEBUG_TOKEN, o
 * script troca esse segredo por um token de App Check e manda a prova no cabeçalho
 * `X-Firebase-AppCheck`. SEM a variável, o comportamento é idêntico ao de sempre —
 * nenhum cabeçalho a mais. O segredo nunca fica em arquivo: este repositório é
 * público. Como criar o token está em docs/auditoria-28ago2026/04-preparacao-appcheck.md.
 *
 * Não tem dependência externa: só o Node (fetch nativo, versão 18 ou mais nova).
 */

const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const CAMINHO = 'daycare/config/versao-app';

/** Login anônimo — a mesma porta que o app usa. */
async function tokenAnonimo() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const corpo = await r.json();
  if (!corpo || !corpo.idToken) throw new Error('Não obtive o token anônimo do Firebase');
  return corpo.idToken;
}

/**
 * Monta a requisição ao banco. Separada de propósito: é o que o teste unitário
 * examina para conferir o cabeçalho do App Check sem tocar no banco de verdade.
 */
function montarPedido(metodo, caminho, tokenAuth, tokenAppCheck, corpo) {
  const url = `${DB_BASE}/${caminho}.json?auth=${tokenAuth}`;
  const opcoes = {
    method: metodo,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhosFirebase(tokenAppCheck))
  };
  if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);
  return { url, opcoes };
}

async function pedir(metodo, caminho, tokenAuth, tokenAppCheck, corpo) {
  const { url, opcoes } = montarPedido(metodo, caminho, tokenAuth, tokenAppCheck, corpo);
  const r = await fetch(url, opcoes);
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json, texto };
}

/**
 * Grava a versão e devolve o que ficou gravado.
 * @param {string} versao ex.: '2026-08-28-01'
 */
async function carimbar(versao) {
  if (!versao) throw new Error('Falta o número da versão. Ex.: node tools/carimbar-versao.js 2026-08-28-01');
  const tokenAppCheck = await obterTokenAppCheck();
  const tokenAuth = await tokenAnonimo();
  const gravou = await pedir('PUT', CAMINHO, tokenAuth, tokenAppCheck, versao);
  if (gravou.status >= 300) {
    throw new Error(`O banco recusou o carimbo (HTTP ${gravou.status}). Nada foi gravado.`);
  }
  const leu = await pedir('GET', CAMINHO, tokenAuth, tokenAppCheck);
  return { status: gravou.status, gravado: leu.json, comAppCheck: Boolean(tokenAppCheck) };
}

/** Só lê a versão que está no banco. Não grava nada. */
async function ler() {
  const tokenAppCheck = await obterTokenAppCheck();
  const tokenAuth = await tokenAnonimo();
  const r = await pedir('GET', CAMINHO, tokenAuth, tokenAppCheck);
  return { gravado: r.json, comAppCheck: Boolean(tokenAppCheck) };
}

module.exports = { montarPedido, carimbar, ler, DB_BASE, CAMINHO };

// Só age quando chamado direto na linha de comando. Ser requerido (pelo teste) não toca no banco.
if (require.main === module) {
  const args = process.argv.slice(2);
  const soVer = args.includes('--ver');
  const versao = args.filter((a) => !a.startsWith('--'))[0];
  const acao = soVer ? ler() : carimbar(versao);
  acao
    .then((r) => {
      console.log('carimbo no banco:', JSON.stringify(r.gravado),
                  r.comAppCheck ? '(com prova do App Check)' : '(sem App Check)');
    })
    .catch((e) => { console.error('ERRO', e.message); process.exit(1); });
}
