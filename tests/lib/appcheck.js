'use strict';
/*
 * App Check para quem NÃO é navegador — a rede de testes e o script de carimbo.
 *
 * O app roda no navegador e produz a prova do App Check com o reCAPTCHA. Um script
 * de linha de comando não tem navegador e não consegue fazer o reCAPTCHA. O caminho
 * oficial do Firebase para servidor e teste é o TOKEN DE DEPURAÇÃO: cria-se um no
 * Console (App Check → app web → Gerenciar tokens de depuração) e troca-se esse
 * segredo por um token de App Check de verdade, pela API oficial:
 *
 *   POST https://firebaseappcheck.googleapis.com/v1/projects/{projectId}/apps/{appId}:exchangeDebugToken?key={apiKey}
 *   corpo    { "debug_token": "<segredo>" }
 *   resposta { "token": "<token de App Check>", "ttl": "3600s" }
 *
 * O token vai depois no cabeçalho `X-Firebase-AppCheck` de cada chamada REST ao
 * Realtime Database.
 *
 * O segredo NUNCA fica em arquivo — este repositório é público. Ele vem da variável
 * de ambiente FIREBASE_APPCHECK_DEBUG_TOKEN. Sem a variável, tudo aqui devolve
 * `null` e quem chama segue exatamente como antes, sem cabeçalho nenhum.
 *
 * Uso na linha de comando (diagnóstico):  node tests/lib/appcheck.js
 *   sem a variável  → imprime `null`
 *   com a variável  → imprime o token de App Check
 */

// Os três dados abaixo são públicos por natureza: saem do firebaseConfig que está
// no HTML de todas as páginas (auaulandia/index.html, index.html, checkin.html).
const PROJECT_ID = 'hospedagem-zeluz';
const APP_ID     = '1:199129329105:web:22d0995972c197e24644f0';
const API_KEY    = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';

const URL_TROCA = `https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/apps/${APP_ID}:exchangeDebugToken?key=${API_KEY}`;

/**
 * Troca o token de depuração por um token de App Check.
 * @param {object} [env] de onde ler a variável (padrão: process.env)
 * @returns {Promise<string|null>} o token, ou null quando não há segredo ou a troca falha
 */
async function obterTokenAppCheck(env) {
  const ambiente = env || process.env;
  const segredo = ambiente.FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (!segredo) return null;   // sem segredo: comportamento idêntico ao de antes

  let resposta;
  try {
    resposta = await fetch(URL_TROCA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debug_token: segredo })
    });
  } catch (e) {
    // Falha de rede não pode ser silêncio: quem chama precisa saber por que ficou sem prova.
    console.warn('App Check: erro de rede ao trocar o token de depuração —', e.message, '— seguindo sem');
    return null;
  }
  if (!resposta.ok) {
    console.warn('App Check: a troca do token de depuração falhou (HTTP ' + resposta.status + ') — seguindo sem');
    return null;
  }
  const corpo = await resposta.json();
  if (!corpo || !corpo.token) {
    console.warn('App Check: a resposta da troca veio sem token — seguindo sem');
    return null;
  }
  return corpo.token;
}

/**
 * Cabeçalhos a acrescentar numa chamada REST ao Realtime Database.
 * @param {string|null} token
 * @returns {object} `{}` quando não há token — nada muda
 */
function cabecalhosFirebase(token) {
  return token ? { 'X-Firebase-AppCheck': token } : {};
}

/**
 * Faz o `https.request` do harness carregar a prova do App Check sem que o harness
 * precise mudar em mais de uma linha. Só age se houver a variável de ambiente.
 *
 * A troca do token é assíncrona e o `https.request` é síncrono; por isso a troca é
 * feita uma vez, num processo separado (`node tests/lib/appcheck.js`), antes de
 * qualquer chamada. Sem a variável de ambiente, não há processo nenhum e a função
 * devolve null na hora.
 *
 * @param {object} https o módulo `https` do harness
 * @param {object} [opcoes] `{ token }` — usado só pelos testes, para não ir à rede
 * @returns {string|null} o token instalado, ou null quando nada foi feito
 */
function instalarNoHttps(https, opcoes) {
  let token = (opcoes && opcoes.token) || null;
  if (!token) {
    if (!process.env.FIREBASE_APPCHECK_DEBUG_TOKEN) return null;
    const { execFileSync } = require('child_process');
    let saida = '';
    try {
      saida = String(execFileSync(process.execPath, [__filename], { encoding: 'utf8' })).trim();
    } catch (e) {
      console.warn('App Check: não consegui obter o token —', e.message, '— seguindo sem');
      return null;
    }
    token = (saida && saida !== 'null') ? saida : null;
    if (!token) return null;
  }
  const original = https.request;
  https.request = function (opcoesPedido, retorno) {
    if (opcoesPedido && typeof opcoesPedido === 'object' &&
        /(^|\.)firebaseio\.com$/.test(opcoesPedido.hostname || '')) {
      opcoesPedido.headers = Object.assign({}, opcoesPedido.headers, cabecalhosFirebase(token));
    }
    return original.call(https, opcoesPedido, retorno);
  };
  return token;
}

module.exports = { obterTokenAppCheck, cabecalhosFirebase, instalarNoHttps, URL_TROCA, PROJECT_ID, APP_ID, API_KEY };

// Linha de comando: imprime o token (ou `null`). Não toca no banco.
if (require.main === module) {
  obterTokenAppCheck()
    .then((t) => { console.log(t); })
    .catch((e) => { console.error('App Check:', e.message); process.exit(1); });
}
