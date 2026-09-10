'use strict';
/*
 * ACERTO RETROATIVO DAS REPOSIÇÕES USADAS EM HOSPEDAGEM — 10/set/2026.
 *
 * POR QUE EXISTE
 * Adriana, 10/set/2026: "O orçamento está fazendo contas certas, está conseguindo tirar
 * quando o peludinho tem reposição, no entanto não está tirando da ficha deles — dando
 * baixa. Hospedagem da Maya SRD (Luciana). Hospedagem da Serena (Ana Flávia)."
 *
 * O app até a versão 2026-09-08-07 ABATIA o valor (cada reposição transformava uma diária
 * de hotel em pernoite) e nem sequer GUARDAVA quantas usou. O Banco de Reposições ficava
 * intacto: o mesmo dia podia ser abatido de novo no orçamento seguinte, de graça.
 * A versão 2026-09-10-01 corrige o fluxo daqui para a frente. Este script conserta o que
 * ficou para trás.
 *
 * COMO USA
 *   node tools/reposicao-acerto.js --ver        mostra, por FILHOt, os orçamentos FECHADOS
 *                                               que abateram reposição sem baixa na ficha,
 *                                               o saldo de hoje e o saldo que DEVERIA estar
 *   node tools/reposicao-acerto.js --aplicar    grava as baixas que faltam, com rastro
 *
 * --ver NÃO ESCREVE NADA. Só --aplicar grava, e só quando a flag está lá.
 *
 * QUANTAS REPOSIÇÕES CADA ORÇAMENTO USOU
 * Nos orçamentos novos, o número está gravado em `pets[].reposicoes`. Nos antigos, ele não
 * existe — mas a MENSAGEM que o próprio app escreveu para o tutor na época diz, com todas
 * as letras: "Já usando 4 dias de reposição que ela tinha — economia de R$ 102,00". É essa
 * frase, escrita pelo app no momento do orçamento, que serve de prova. Nada é adivinhado
 * por diferença de valor.
 *
 * A BAIXA GRAVADA
 * Mesma chave determinística do app — 'orc-{id do orçamento}-{n}'. Rodar este script duas
 * vezes escreve exatamente o mesmo nó: o saldo não se mexe. Baixar duas vezes o mesmo
 * orçamento é impossível por construção, não por cuidado de quem roda.
 *
 * Login anônimo — a mesma porta que o app usa (ver tools/economia.js). Leitura de KB: dois
 * GETs, um em auaulandia/orcamentos e outro em daycare/reposicao.
 */
const { obterTokenAppCheck, cabecalhosFirebase } = require('../tests/lib/appcheck');

const DB_BASE = 'https://hospedagem-zeluz-default-rtdb.firebaseio.com';
const API_KEY = 'AIzaSyD3udp47XruRAEeIYWNGn0ICGCX3a1qr28';   // pública por natureza (está no HTML)
const QUEM = 'tools/reposicao-acerto.js';

// ---------------------------------------------------------------- utilidades
function brl(centavos) {
  return 'R$ ' + (Number(centavos || 0) / 100).toLocaleString('pt-BR',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function brData(iso) {
  const a = String(iso || '').split('-');
  return a.length === 3 ? (a[2] + '/' + a[1] + '/' + a[0]) : (iso || '—');
}
function curto(id) { return String(id || '').slice(-6).toUpperCase(); }
function chaveBaixa(orcId, n) { return 'orc-' + orcId + '-' + n; }

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
  const r = await fetch(`${DB_BASE}/${caminho}.json?auth=${auth}`,
    { headers: cabecalhosFirebase(appCheck) });
  if (!r.ok) throw new Error('GET ' + caminho + ' recusado (HTTP ' + r.status + ')');
  const txt = await r.text();
  return { dados: JSON.parse(txt || 'null'), bytes: Buffer.byteLength(txt, 'utf8') };
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

// ------------------------------------------------- quantas reposições o orçamento usou
// Prioridade: o campo gravado (orçamento novo). Depois, a mensagem escrita ao tutor na
// época (orçamento antigo). A mensagem prefixa o nome do FILHOt quando há mais de um.
const RE_REP = /^(?:(.+?)\s+—\s+)?Já usando (\d+) dias? de reposição(?:.*?economia de (R\$ \d{1,3}(?:\.\d{3})*,\d{2}))?/;
function reposicoesDoOrcamento(o) {
  const pets = (o && o.pets) || [];
  const porNome = {};
  String((o && o.mensagem) || '').split('\n').forEach((linha) => {
    const m = RE_REP.exec(linha.trim());
    if (!m) return;
    porNome[(m[1] || '').trim().toLowerCase()] = { n: +m[2], economia: m[3] || '' };
  });
  const soUm = pets.length === 1;
  return pets.map((p) => {
    const gravado = +((p && p.reposicoes) || 0);
    if (gravado > 0) {
      return { pet: p, n: gravado, economia: brl(p.reposicao_economia_cent || 0), fonte: 'campo gravado' };
    }
    const daMsg = porNome[String((p && p.nome) || '').trim().toLowerCase()]
      || (soUm ? porNome[''] : null);
    if (daMsg && daMsg.n > 0) {
      return { pet: p, n: daMsg.n, economia: daMsg.economia || '—', fonte: 'mensagem ao tutor' };
    }
    return { pet: p, n: 0, economia: '', fonte: '' };
  });
}

// ------------------------------------------------------------------- o levantamento
function levantar(orcamentos, reposicao) {
  const porPet = {};   // key -> {nome, tutor, creditos, usos, saldoHoje, itens:[], faltando}
  // Orçamentos antigos não guardavam `pets[].reposicoes` — e sem esse número o app não sabe
  // devolver o dia se a reserva for cancelada depois. O acerto grava o número também, para
  // que o registro antigo passe a andar pelas mesmas regras dos novos.
  const porOrc = {};   // id -> {campo: valor} a gravar em auaulandia/orcamentos/{id}
  const ficha = (key, nome, tutor) => {
    if (!porPet[key]) {
      const L = ((reposicao || {})[key] || {}).lancamentos || {};
      const ids = Object.keys(L);
      const estornado = {};
      ids.forEach((id) => { if (L[id].tipo === 'estorno' && L[id].estornaId) estornado[L[id].estornaId] = true; });
      let saldo = 0;
      ids.forEach((id) => {
        const l = L[id];
        if (l.tipo === 'estorno') { if (!(l.estornaId && L[l.estornaId])) saldo--; return; }
        if (estornado[id]) return;
        saldo += (l.tipo === 'credito') ? 1 : -1;
      });
      porPet[key] = {
        key, nome: nome || key, tutor: tutor || '',
        creditos: ids.filter((id) => L[id].tipo === 'credito' && !estornado[id]).length,
        usos: ids.filter((id) => L[id].tipo === 'uso' && !estornado[id]).length,
        saldoHoje: saldo, existe: L, estornado, itens: [], faltando: 0, patch: {}
      };
    }
    return porPet[key];
  };

  Object.keys(orcamentos || {}).forEach((id) => {
    const o = orcamentos[id] || {};
    if (o.status !== 'fechado') return;                    // só reserva CONFIRMADA baixa
    reposicoesDoOrcamento(o).forEach((r, iPet) => {
      if (!r.n) return;
      const p = r.pet || {};
      if (!(+((p && p.reposicoes) || 0))) {                 // o número não estava gravado
        porOrc[id] = porOrc[id] || {};
        porOrc[id]['pets/' + iPet + '/reposicoes'] = r.n;
        porOrc[id].reposicoes_total = (porOrc[id].reposicoes_total || 0) + r.n;
      }
      if (p.sem_cadastro || !p.key) return;                // avulso não tem Banco de Reposições
      if (!(reposicao || {})[p.key]) return;               // ficha sem Banco: nada a abater
      const f = ficha(p.key, p.nome, p.tutor || o.tutor);
      const faltam = [];
      for (let n = 1; n <= r.n; n++) {
        const k = chaveBaixa(id, n);
        if (!f.existe[k] || f.estornado[k]) faltam.push(n);
      }
      f.itens.push({
        orcId: id, entrada: o.entrada || '', saida: o.saida || '', total: o.total_cent || 0,
        usadas: r.n, economia: r.economia, fonte: r.fonte, faltam
      });
      f.faltando += faltam.length;
      const agora = Date.now();
      faltam.forEach((n) => {
        f.patch['lancamentos/' + chaveBaixa(id, n)] = {
          tipo: 'uso', data: o.entrada || '', motivo: 'hospedagem',
          obs: 'Usada no orçamento de hospedagem ' + curto(id)
             + (o.entrada ? (', entrada ' + brData(o.entrada)) : '')
             + ' — baixa retroativa (o orçamento abateu o valor mas não deu baixa na ficha)',
          orcId: id, orcSeq: n, quem: QUEM, ts: agora, retroativo: true
        };
      });
    });
  });
  return { porPet, porOrc };
}

// ---------------------------------------------------------------------------- saída
function mostrar(porPet) {
  const chaves = Object.keys(porPet).sort();
  const comFalta = chaves.filter((k) => porPet[k].faltando > 0);
  if (!chaves.length) {
    console.log('Nenhum orçamento FECHADO usou reposição. Nada a acertar.');
    return 0;
  }
  chaves.forEach((k) => {
    const f = porPet[k];
    console.log('');
    console.log('── ' + f.nome + (f.tutor ? (' · tutor ' + f.tutor) : '') + '  [' + f.key + ']');
    console.log('   Créditos no Banco: ' + f.creditos + ' · usos já lançados: ' + f.usos + ' · saldo hoje: ' + f.saldoHoje);
    f.itens.forEach((it) => {
      console.log('   • Orçamento ' + curto(it.orcId) + ' (' + it.orcId + ') — FECHADO');
      console.log('     ' + brData(it.entrada) + ' a ' + brData(it.saida) + ' · ' + brl(it.total)
        + ' · usou ' + it.usadas + ' reposição(ões)'
        + (it.economia ? (' · abatimento de ' + it.economia) : '')
        + '  [' + it.fonte + ']');
      console.log('     Baixa na ficha: ' + (it.faltam.length ? ('FALTAM ' + it.faltam.length) : 'já existe'));
    });
    console.log('   → saldo hoje ' + f.saldoHoje + ' · baixas a gravar ' + f.faltando
      + ' · saldo depois do acerto: ' + (f.saldoHoje - f.faltando));
  });
  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(comFalta.length
    ? (comFalta.length + ' FILHOt(s) com baixa faltando · ' + comFalta.reduce((a, k) => a + porPet[k].faltando, 0) + ' baixa(s) a gravar.')
    : 'Todas as baixas já estão na ficha. Nada a fazer.');
  if (comFalta.length) console.log('Para gravar:  node tools/reposicao-acerto.js --aplicar');
  return comFalta.length;
}

async function main() {
  const args = process.argv.slice(2);
  const aplicar = args.includes('--aplicar');
  const ver = args.includes('--ver') || !aplicar;
  if (!args.length) console.log('(sem flag: assumindo --ver, que não escreve nada)\n');

  const auth = await tokenAnonimo();
  const appCheck = await obterTokenAppCheck();
  const orc = await ler('auaulandia/orcamentos', auth, appCheck);
  const rep = await ler('daycare/reposicao', auth, appCheck);
  console.log('Lido do banco: orçamentos ' + (orc.bytes / 1024).toFixed(1) + ' KB · reposições '
    + (rep.bytes / 1024).toFixed(1) + ' KB');

  const { porPet, porOrc } = levantar(orc.dados || {}, rep.dados || {});
  if (ver || !aplicar) { mostrar(porPet); if (!aplicar) return; }

  const alvos = Object.keys(porPet).filter((k) => porPet[k].faltando > 0);
  if (!alvos.length) { console.log('\nNada a gravar.'); return; }
  console.log('\n── GRAVANDO ' + alvos.reduce((a, k) => a + porPet[k].faltando, 0) + ' baixa(s) ──');
  for (const k of alvos) {
    const f = porPet[k];
    await gravar('daycare/reposicao/' + encodeURIComponent(k), f.patch, auth, appCheck);
    console.log('  ✓ ' + f.nome + ': ' + f.faltando + ' baixa(s) gravada(s) — saldo agora ' + (f.saldoHoje - f.faltando));
  }
  // E o número de reposições volta para dentro do orçamento antigo: sem ele, o app não
  // saberia quantos dias devolver se a reserva for cancelada depois.
  for (const id of Object.keys(porOrc)) {
    await gravar('auaulandia/orcamentos/' + id, porOrc[id], auth, appCheck);
    console.log('  ✓ orçamento ' + curto(id) + ': gravei reposicoes=' + porOrc[id].reposicoes_total);
  }
  console.log('\nPronto. Rode --ver de novo para conferir: as baixas devem aparecer como "já existe".');
}

// A conta mora aqui, mas quem a PROVA é o harness (tests/harness.js), contra o retrato do
// banco — por isso o módulo se deixa importar sem sair gravando nada.
module.exports = { levantar, reposicoesDoOrcamento, chaveBaixa, brl, curto };

if (require.main === module) {
  main().catch((e) => { console.error('ERRO:', (e && e.message) || e); process.exit(1); });
}
