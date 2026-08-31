'use strict';
/*
 * Configura o PIN da Gestão de gestao.html — grava `daycare/config/pin-gestao` no
 * Realtime Database, como { hash, sal } (SHA-256(pin + sal)). NUNCA em texto puro.
 *
 * Por que existe: auditoria 28/ago/2026, achado 23 — o PIN de gestao.html vivia em
 * texto puro no HTML público, e era o MESMO valor do PIN padrão do Monitor 3 do app
 * da equipe. Um número não deve abrir duas portas diferentes. Ver
 * docs/auditoria-28ago2026/06-pontes-e-pin.md para o quadro completo.
 *
 * ESTE SCRIPT NÃO RODA SOZINHO — alguém com autoridade sobre o Firebase (a Diretoria,
 * ou quem ela autorizar) precisa rodá-lo, uma vez, para configurar o PIN definitivo.
 * Até lá, gestao.html usa o PIN_PROVISORIO que está no próprio HTML (não é mais '1007').
 *
 * Uso:
 *   node tools/configurar-pin-gestao.js 4821          gera um sal novo, grava e confere
 *   node tools/configurar-pin-gestao.js --ver          só mostra se já está configurado
 *                                                       (nunca mostra o PIN nem o hash)
 *
 * O PIN pedido aqui é o que a Diretoria vai digitar depois na tela — 4 dígitos, como hoje.
 * Escolha um valor que ninguém mais no app esteja usando (ver a lista em
 * auaulandia/index.html: SENHAS fixas 1101/0902/1001 e MONITORES_DEFAULT 1005/1007-1011).
 *
 * App Check: se existir a variável de ambiente FIREBASE_APPCHECK_DEBUG_TOKEN, o script
 * troca esse segredo por um token de App Check e manda a prova no cabeçalho
 * X-Firebase-AppCheck. SEM a variável, o comportamento é idêntico ao de sempre — nenhum
 * cabeçalho a mais. Como criar o token está em docs/auditoria-28ago2026/04-preparacao-appcheck.md.
 *
 * Não tem dependência externa: só o Node (fetch nativo e o módulo `crypto`, ambos nativos
 * a partir do Node 18).
 */

const crypto = require('crypto');
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const CAMINHO = 'daycare/config/pin-gestao';

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

async function pedir(metodo, tokenAuth, tokenAppCheck, corpo) {
  const url = `${DB_BASE}/${CAMINHO}.json?auth=${tokenAuth}`;
  const opcoes = {
    method: metodo,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhosFirebase(tokenAppCheck))
  };
  if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);
  const r = await fetch(url, opcoes);
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json, texto };
}

/** SHA-256(pin + sal) em hexadecimal — a MESMA conta que gestao.html faz no navegador (Web Crypto). */
function calcularHash(pin, sal) {
  return crypto.createHash('sha256').update(String(pin) + String(sal)).digest('hex');
}

/**
 * Gera um sal novo, grava { hash, sal } e confere o que ficou (sem nunca reimprimir o PIN).
 * @param {string} pin 4 dígitos, o que a Diretoria vai digitar na tela
 */
async function configurar(pin) {
  if (!pin || !/^\d{4}$/.test(pin)) {
    throw new Error('Informe um PIN de 4 dígitos. Ex.: node tools/configurar-pin-gestao.js 4821');
  }
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = calcularHash(pin, sal);
  const tokenAppCheck = await obterTokenAppCheck();
  const tokenAuth = await tokenAnonimo();
  const gravou = await pedir('PUT', tokenAuth, tokenAppCheck, { hash, sal });
  if (gravou.status >= 300) {
    throw new Error(`O banco recusou a gravação (HTTP ${gravou.status}). Nada foi salvo. ${gravou.texto}`);
  }
  const leu = await pedir('GET', tokenAuth, tokenAppCheck);
  const bateu = leu.json && leu.json.hash === hash && leu.json.sal === sal;
  return { status: gravou.status, bateu, comAppCheck: Boolean(tokenAppCheck) };
}

/** Só diz SE já existe configuração — nunca o PIN nem o hash. */
async function ver() {
  const tokenAppCheck = await obterTokenAppCheck();
  const tokenAuth = await tokenAnonimo();
  const r = await pedir('GET', tokenAuth, tokenAppCheck);
  return { configurado: !!(r.json && r.json.hash), comAppCheck: Boolean(tokenAppCheck) };
}

module.exports = { calcularHash, configurar, ver, DB_BASE, CAMINHO };

// Só age quando chamado direto na linha de comando. Ser requerido (por um teste) não toca no banco.
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--ver')) {
    ver()
      .then((r) => {
        console.log(r.configurado
          ? 'daycare/config/pin-gestao JÁ está configurado (PIN definitivo em uso).'
          : 'daycare/config/pin-gestao ainda NÃO existe — gestao.html está usando o PIN_PROVISORIO do HTML.',
          r.comAppCheck ? '(com prova do App Check)' : '(sem App Check)');
      })
      .catch((e) => { console.error('ERRO', e.message); process.exit(1); });
  } else {
    const pin = args.filter((a) => !a.startsWith('--'))[0];
    configurar(pin)
      .then((r) => {
        if (!r.bateu) throw new Error('Gravou, mas a conferência não bateu — rode de novo antes de confiar.');
        console.log('PIN da Gestão configurado em daycare/config/pin-gestao.',
                    r.comAppCheck ? '(com prova do App Check)' : '(sem App Check)');
        console.log('Agora é só entrar em gestao.html com o PIN que você acabou de escolher.');
      })
      .catch((e) => { console.error('ERRO', e.message); process.exit(1); });
  }
}
