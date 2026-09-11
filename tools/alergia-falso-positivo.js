'use strict';
/*
 * A NEGATIVA DO TUTOR QUE VIROU RESTRIÇÃO — 11/set/2026.
 *
 * POR QUE EXISTE
 * Adriana, 11/set/2026: "Jasmim no EA apareceu como 'não pode comer nada', e não tem esse
 * dado, de onde tirou isso? A tutora respondeu a pergunta dizendo 'Não, até o presente
 * momento não teve nada disso' e você colocou como alergia."
 *
 * Eram dois erros em fila, os dois corrigidos na versão 2026-09-11-01 do app:
 *   1. o filtro que segurava as negativas procurava os pedaços soltos "da ", "do ", "de ",
 *      "se " para decidir se a frase tinha conteúdo — e "na[da ]disso" contém "da ". Toda
 *      negativa com a palavra "nada" escapava e virava campo de ficha;
 *   2. o Enriquecimento Ambiental lia a palavra "nada" como "restrição a TUDO".
 *
 * O app não erra mais daqui para a frente. Este script mostra — e limpa — o que já ficou
 * gravado nas fichas.
 *
 * COMO USA
 *   node tools/alergia-falso-positivo.js --ver        lista as fichas, campo a campo,
 *                                                     com o texto original do tutor
 *   node tools/alergia-falso-positivo.js --ver --vivo o mesmo, lendo o banco de verdade
 *   node tools/alergia-falso-positivo.js --aplicar    limpa a marca, GUARDANDO o texto
 *                                                     original em {campo}_negativa_11set
 *
 * --ver NÃO ESCREVE NADA e, sem --vivo, nem toca o Firebase (lê tests/.retrato).
 * --aplicar nunca APAGA a resposta: o texto do tutor continua inteiro na entrevista da
 * ficha e passa a ficar também no campo de rastro, com a data e quem limpou. O que sai é
 * só a marca de restrição que a equipe lê na hora de servir.
 *
 * A REGRA é a MESMA do app: a função zNegativaPura é extraída do index.html, não copiada.
 */
const fs = require('fs');
const path = require('path');
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');
const retratoLib = require('../tests/lib/retrato');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const QUEM = 'tools/alergia-falso-positivo.js';
const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
const CAMPOS = ['alergia', 'restricao', 'restricoes', 'ea_restr'];

const args = process.argv.slice(2);
const VER = args.indexOf('--ver') >= 0;
const APLICAR = args.indexOf('--aplicar') >= 0;
const VIVO = args.indexOf('--vivo') >= 0 || APLICAR;

// A MESMA função do app — extraída, não copiada. Uma fonte só para a regra.
function carregarNegativa() {
  const html = fs.readFileSync(APP, 'utf8');
  const jsn = html.indexOf('  function jsNorm(s){');
  if (jsn < 0) throw new Error('não achei jsNorm no index.html');
  const jsnFim = html.indexOf('\n', jsn);
  const ini = html.indexOf('  var Z_NEG_MARCA=');
  if (ini < 0) throw new Error('não achei Z_NEG_MARCA no index.html');
  const fim = html.indexOf('\n  // "Não", "Nada novo"', ini);
  if (fim < 0) throw new Error('não achei o fim de zNegativaPura');
  const codigo = html.slice(jsn, jsnFim) + '\n' + html.slice(ini, fim) + '\n return zNegativaPura;';
  return new Function(codigo)();   // eslint-disable-line no-new-func
}

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

function levantar(cadastros, zNegativaPura) {
  const achados = [];
  Object.keys(cadastros || {}).forEach((base) => {
    const cad = cadastros[base] || {};
    Object.keys(cad).forEach((k) => {
      const ex = cad[k] || {};
      const nomes = [String(k).split('__')[0] || '', String(k).split('__')[1] || '', ex.tutor || ''];
      CAMPOS.forEach((c) => {
        const v = String(ex[c] || '').trim();
        if (!v) return;
        if (!zNegativaPura(v, nomes)) return;
        achados.push({ base, k, campo: c, texto: v, nome: nomes[0], tutor: ex.tutor || nomes[1] });
      });
    });
  });
  return achados.sort((a, b) => (a.k + a.campo).localeCompare(b.k + b.campo));
}

function mostrar(achados, fonte) {
  console.log('');
  console.log('=== CAMPOS DE FICHA QUE NASCERAM DE UMA RESPOSTA NEGATIVA ===');
  console.log('fonte: ' + fonte);
  console.log('');
  if (!achados.length) { console.log('Nenhum. Todas as restrições gravadas vieram de conteúdo afirmativo.'); return; }
  achados.forEach((a) => {
    const ea = (a.campo === 'ea_restr' || a.campo === 'restricao' || a.campo === 'alergia');
    console.log('• ' + (a.nome || a.k) + (a.tutor ? (' · tutor: ' + a.tutor) : '') + '  [' + a.base + ']');
    console.log('    campo: ' + a.campo);
    console.log('    o tutor escreveu: "' + a.texto.replace(/\s+/g, ' ') + '"');
    if (ea) console.log('    efeito: até a v 2026-09-10-01 entrava na lista de "quem NÃO pode" do EA.'
      + ' Da v 2026-09-11-01 em diante o EA já ignora — mas o texto continua gravado como'
      + ' restrição na ficha e ainda acende a tarja vermelha da equipe. Limpar é aqui.');
    console.log('');
  });
  console.log('Ao todo: ' + achados.length + ' campo(s) em '
    + new Set(achados.map((a) => a.k)).size + ' ficha(s).');
  console.log('Para limpar (guardando o texto original): node tools/alergia-falso-positivo.js --aplicar');
}

async function aplicar(achados, auth, appCheck) {
  const hoje = new Date().toISOString().slice(0, 10);
  for (const a of achados) {
    const raiz = (a.base === 'auaulandia' ? 'auaulandia' : 'daycare') + '/cadastro/' + a.k;
    const patch = {};
    patch[a.campo] = null;                                  // a marca de restrição sai
    patch[a.campo + '_negativa_11set'] = {                  // o texto do tutor fica
      texto: a.texto, quando: hoje, quem: QUEM,
      motivo: 'resposta negativa do tutor gravada como restrição (erro do filtro até 2026-09-10-01)'
    };
    await gravar(raiz, patch, auth, appCheck);
    console.log('  limpo: ' + (a.nome || a.k) + ' · ' + a.campo);
  }
  console.log('');
  console.log('Pronto. O texto do tutor continua na entrevista da ficha e no campo de rastro.');
}

async function main() {
  if (!VER && !APLICAR) {
    console.log('Use --ver (só mostra) ou --aplicar (limpa, guardando o original).');
    process.exit(1);
  }
  const zNegativaPura = carregarNegativa();
  let cadastros = null, fonte = '';
  let auth = null, appCheck = null;
  if (VIVO) {
    appCheck = await obterTokenAppCheck().catch(() => null);
    auth = await tokenAnonimo();
    cadastros = {
      daycare: await ler('daycare/cadastro', auth, appCheck),
      auaulandia: await ler('auaulandia/cadastro', auth, appCheck)
    };
    fonte = 'banco vivo (' + new Date().toLocaleString('pt-BR') + ')';
  } else {
    const R = retratoLib.carregar();
    cadastros = {
      daycare: retratoLib.ler(R, 'daycare/cadastro'),
      auaulandia: retratoLib.ler(R, 'auaulandia/cadastro')
    };
    fonte = 'retrato de ' + R.dia + ' (para o estado de agora: --vivo)';
  }
  const achados = levantar(cadastros, zNegativaPura);
  mostrar(achados, fonte);
  if (APLICAR && achados.length) await aplicar(achados, auth, appCheck);
}

main().catch((e) => { console.error('ERRO:', (e && e.message) || e); process.exit(1); });
