'use strict';
/*
 * QUEM ESTÁ LIGADO, EM QUE VERSÃO — 08/set/2026.
 *
 * Lê auaulandia/aparelhos (uns 3 KB) e mostra, aparelho por aparelho, a versão do app que
 * ele rodou pela última vez e há quanto tempo deu sinal de vida (o batimento que o app
 * grava ao entrar, a cada 10 min e quando o aviso de versão aparece).
 *
 * Por que existe: em 08/set um aparelho parado com o código velho vazou 695 MB num dia,
 * e ninguém tinha como enxergar QUAL aparelho era. Agora é um comando.
 *
 * Uso:
 *   node tools/aparelhos.js            tabela, os mais recentes primeiro
 *   node tools/aparelhos.js --json     a mesma coisa em JSON
 *   node tools/aparelhos.js --velhos 2026-09-08-04   só quem NÃO está nessa versão
 *
 * Só leitura. Login anônimo — a mesma porta que o app usa. Sem dependência externa.
 */
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)

async function tokenAnonimo() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const corpo = await r.json();
  if (!corpo || !corpo.idToken) throw new Error('Não obtive o token anônimo do Firebase');
  return corpo.idToken;
}

function haQuanto(ts) {
  if (!ts) return 'nunca';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  if (h < 48) return h + ' h ' + (min % 60) + ' min';
  return Math.floor(h / 24) + ' dias';
}

function quando(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const iVelhos = args.indexOf('--velhos');
  const soForaDe = iVelhos >= 0 ? args[iVelhos + 1] : null;

  const tokenAuth = await tokenAnonimo();
  const tokenAppCheck = await obterTokenAppCheck();
  const r = await fetch(`${DB_BASE}/auaulandia/aparelhos.json?auth=${tokenAuth}`,
    { headers: cabecalhosFirebase(tokenAppCheck) });
  if (!r.ok) throw new Error('Leitura recusada (HTTP ' + r.status + ')');
  const aparelhos = (await r.json()) || {};

  let linhas = Object.keys(aparelhos).map((id) => {
    const a = aparelhos[id] || {};
    const v = a.visto || {};
    return {
      id, nome: a.nome || '(sem nome)', autorizadoPor: a.por || '',
      versao: v.versao || '', quem: v.quem || '', role: v.role || '',
      trancado: !!v.trancado, motivo: v.motivo || '', visto: v.ts || 0
    };
  }).sort((a, b) => b.visto - a.visto);
  if (soForaDe) linhas = linhas.filter((l) => l.versao !== soForaDe);

  if (json) { console.log(JSON.stringify(linhas, null, 2)); return; }

  const semBatimento = linhas.filter((l) => !l.visto).length;
  console.log('Aparelhos autorizados: ' + linhas.length + (soForaDe ? ' fora da versão ' + soForaDe : '') +
    ' · com batimento: ' + (linhas.length - semBatimento) + ' · sem batimento (ainda na versão velha ou desligado): ' + semBatimento);
  console.log('');
  const col = (s, n) => String(s == null ? '' : s).padEnd(n).slice(0, n);
  console.log(col('Aparelho', 22) + col('Versão', 16) + col('Último sinal', 13) + col('Há quanto', 12) + col('Quem', 22) + col('Papel', 12) + 'Estado');
  console.log('-'.repeat(110));
  for (const l of linhas) {
    console.log(col(l.nome, 22) + col(l.versao || '—', 16) + col(quando(l.visto), 13) + col(haQuanto(l.visto), 12) +
      col(l.quem, 22) + col(l.role, 12) + (l.trancado ? 'trancado' : (l.visto ? l.motivo : '')));
  }
}

main().catch((e) => { console.error('ERRO:', e.message || e); process.exit(1); });
