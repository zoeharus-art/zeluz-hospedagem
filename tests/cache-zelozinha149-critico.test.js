'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
function script(id) {
  const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m, `script ausente: ${id}`);
  return m[1];
}
const dia1 = '2026-10-26', dia2 = '2026-10-27';
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));

function elemento(ativo) {
  return {
    innerHTML: '', textContent: '', hidden: false, attrs: {}, isConnected: true,
    classList: { add() {}, remove() {}, contains: () => ativo.valor }, addEventListener() {}, querySelector() { return null; },
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  };
}

function criarMundo() {
  let agora = Date.parse('2026-10-26T10:00:00-03:00'), hoje = dia1, assinatura = 'fonte-a', bloquearDados = false;
  const soltarDados = [], consultas = [], ativo = { valor: false }, snoopy = { consultas: 0, adiar: false, confirmado: false, valor: 'CACHE INICIAL', pendencias: [] };
  class DataFalsa extends Date { constructor(v) { super(v === undefined ? agora : v); } static now() { return agora; } }
  const moduloCtx = { module: { exports: {} }, exports: {}, Date: DataFalsa, TextEncoder };
  vm.createContext(moduloCtx); vm.runInContext(script('zelozinha-dados-painel116'), moduloCtx);
  const Dados116 = moduloCtx.module.exports;
  function painel(d) {
    return { dia: d, detalhesEnvioVersao: 104, assinaturaConteudo: d === dia1 ? assinatura : `fonte-${d}`, atualizadoEm: `${d}T12:00:00.000Z`,
      identidadesPets: { p1: { dcKeyAtual: 'pet-ficticio__tutor-ficticio', pelKeyAtual: 'pet-ficticio', petId: 'p1', tutorRefId: 't1', nomePeludo: 'Pet Fictício', nomeTutor: 'Tutor Fictício' } },
      cuidadosDia: { versao: 104, itens: { h1: { petId: 'p1', cycleKey: '["p1","t1","vacina","2026-11-01","vac"]', care: 'vacina', itemK: 'vac', dueDate: '2026-11-01' } } }, grupos: [] };
  }
  const db = { ref(p) { return { once() {
    consultas.push(p);
    const produzir = () => { const d = p.slice(-10); if (p.startsWith('piloto59/')) return { val: () => painel(d) }; if (p.startsWith('daycare/checkin-corpo/')) return { val: () => ({ 'pet-ficticio__tutor-ficticio': { tipo: 'entrada', fim: agora } }) }; return { val: () => ({}) }; };
    if (!bloquearDados) return Promise.resolve(produzir());
    return new Promise(resolve => soltarDados.push(() => resolve(produzir())));
  } }; } };
  const host = elemento(ativo), rotulo = elemento(ativo), contador = elemento(ativo), cuidados = elemento(ativo), andamento = elemento(ativo), listaSnoopy = elemento(ativo), badge = elemento(ativo);
  const tabs = ['resolve','progress','snoopy'].map(n => { const e = elemento(ativo); e.attrs['data-zt694-tab'] = n; return e; });
  const panes = tabs.map(t => { const e = elemento(ativo); e.attrs['data-zt694-pane'] = t.attrs['data-zt694-tab']; return e; });
  const hub = { querySelector(sel) { return ({ '[data-zt694-date-host]':host, '[data-zt694-day-label]':rotulo, '[data-zt694-count]':contador,
    '[data-zt694-resolver-list]':cuidados, '[data-zt694-andamento-list]':andamento, '[data-zt694-snoopy-list]':listaSnoopy,
    '[data-zt694-snoopy-count]':badge, '[data-zt694-tab="snoopy"]':tabs[2] })[sel] || null; },
    querySelectorAll(sel) { return sel === '[data-zt694-tab]' ? tabs : sel === '[data-zt694-pane]' ? panes : []; }, addEventListener() {},
    closest() { return { classList: { contains: () => ativo.valor } }; } };
  const doc = { querySelector: () => hub, dispatchEvent() {} };
  const w = { DB: db, zPainel44Dia: () => hoje, usuarioAtual: () => ({ id:'pessoa-a', nome:'Pessoa Fictícia', role:'gestao' }),
    zPainel44ValidarFonte80: v => v, Z44_DISPATCH80: { dados: { dia: dia1, assinaturaConteudo: assinatura } },
    ZelozinhaDadosPainel116: {
      criar: op => Dados116.criar({ ...op, assinar: async s => `sha-${s.length}` }),
      criarSnoopy(op) { return { async ler(d) { snoopy.consultas++; const n = snoopy.consultas, confirmado = snoopy.confirmado, valor = snoopy.valor;
          if (snoopy.adiar) await new Promise(resolve => snoopy.pendencias.push(resolve));
          const r = { dia:d, estado:'pronto', total:confirmado?0:1,
          itens:[{ item:'medicacao', id:'linha', valor:n === 1 ? 'CACHE ANTIGO' : valor, confirmado:confirmado, html:'' }] }; op.aoAtualizar(clone(r)); return r; },
        invalidar() {}, cancelar() {} }; }
    }, ZeluzSnoopyConfirmacao:{}, ZeluzSnoopy31AdaptadorDB:{}, ZeluzSnoopy33Interface:{}, dashEditarAtor(){},
    z89Render104() { cuidados.innerHTML = '<article>cuidados confirmados</article>'; }, hojeAbrir(){}, zelozinha45AtorMudou(){}, zelozinha45Logout(){} };
  vm.runInNewContext(script('zelozinha-painel116-controller'), { window:w, document:doc, DB:db, CustomEvent:class { constructor(){} }, setTimeout, clearTimeout, Date:DataFalsa, Intl });
  return { w, consultas, snoopy, listaSnoopy, cuidados, ativo,
    avancar(ms) { agora += ms; }, assinatura(v) { assinatura = v; w.Z44_DISPATCH80.dados.assinaturaConteudo = v; },
    bloquear(v) { bloquearDados = v; }, soltarTudo() { while (soltarDados.length) soltarDados.shift()(); },
    soltarUltimos(n) { soltarDados.splice(Math.max(0, soltarDados.length - n), n).forEach(f => f()); },
    adiarSnoopy(v) { snoopy.adiar = v; }, estadoSnoopy(confirmado, valor) { snoopy.confirmado = confirmado; snoopy.valor = valor; },
    soltarSnoopy() { const f = snoopy.pendencias.shift(); if (f) f(); } };
}

async function inicializar(m) { m.ativo.valor = true; await m.w.zelozinha116Ativar(); }

async function invalidaNaoRessuscita() {
  const m = criarMundo(); await inicializar(m);
  assert.match(m.listaSnoopy.innerHTML, /CACHE ANTIGO/);
  m.w.zelozinha116SnoopyInvalidar(dia1);
  await m.w.zelozinha116SelecionarDia(dia2, false);
  const antes = m.snoopy.consultas;
  await m.w.zelozinha116SelecionarDia(dia1, false);
  assert.equal(m.snoopy.consultas, antes + 1, 'voltar ao dia sujo deve revalidar Snoopy, sem aceitar o cache invalidado');
  assert.doesNotMatch(m.listaSnoopy.innerHTML, /CACHE ANTIGO/, 'cache financeiro invalidado não pode reaparecer nem limpar o sinal sujo');
}

async function financeiroRevalidaSessentaSegundos() {
  const m = criarMundo(); await inicializar(m); const html = m.listaSnoopy.innerHTML, dados = m.consultas.length;
  m.avancar(61000);
  const p = m.w.zelozinha116Ativar();
  assert.equal(m.listaSnoopy.innerHTML, html, 'revalidação financeira mantém o DOM confirmado imediatamente');
  await p;
  assert.equal(m.consultas.length, dados, 'revalidação financeira não relê presença/projeção');
  assert.equal(m.snoopy.consultas, 2, 'após 60s, reabrir agenda uma revalidação financeira em segundo plano');
}

async function assinaturaNovaTemSingleflight() {
  const m = criarMundo(); await inicializar(m); const base = m.consultas.length;
  m.assinatura('fonte-b'); m.bloquear(true);
  const p1 = m.w.zelozinha116Ativar();
  const p2 = m.w.zelozinha116Ativar();
  await new Promise(setImmediate);
  assert.equal(m.consultas.length - base, 4, 'duas reaberturas durante a mesma invalidação compartilham uma única leitura das quatro fontes');
  m.bloquear(false); m.soltarTudo(); await Promise.all([p1,p2]);

  m.bloquear(true); m.assinatura('fonte-c'); const antiga = m.w.zelozinha116Ativar(); await new Promise(setImmediate);
  const antesNova = m.consultas.length; m.assinatura('fonte-d'); const nova = m.w.zelozinha116Ativar(); await new Promise(setImmediate);
  assert.equal(m.consultas.length - antesNova, 4, 'assinatura realmente posterior abre um novo voo próprio');
  m.soltarUltimos(4); await nova; m.soltarTudo(); await antiga; m.bloquear(false);
  const depoisCorrida = m.consultas.length; await m.w.zelozinha116Ativar();
  assert.equal(m.consultas.length, depoisCorrida, 'resposta anterior tardia não sobrescreve a assinatura mais nova');
}

async function logoutCancelaVoo() {
  const m = criarMundo(); await inicializar(m); m.assinatura('fonte-logout'); m.bloquear(true);
  const voo = m.w.zelozinha116Ativar(); await new Promise(setImmediate);
  m.w.zelozinha45Logout(); m.soltarTudo(); await voo; m.bloquear(false);
  const antes = m.consultas.length; m.w.zelozinha45AtorMudou({ id:'pessoa-a', nome:'Pessoa Fictícia', role:'gestao' });
  await m.w.zelozinha116Ativar();
  assert.equal(m.consultas.length, antes + 4, 'logout cancela o voo e o novo acesso não herda seu resultado');
  const imediato = criarMundo(); await inicializar(imediato); const base = imediato.consultas.length;
  imediato.assinatura('fonte-logout-imediato'); imediato.bloquear(true);
  const agendado = imediato.w.zelozinha116Ativar(); imediato.w.zelozinha45Logout(); await new Promise(setImmediate); await agendado;
  assert.equal(imediato.consultas.length, base, 'logout no mesmo turno impede até o início tardio da leitura agendada');
}

async function ackEnfileiraLeituraPosterior() {
  const m = criarMundo(); await inicializar(m); m.avancar(61000); m.estadoSnoopy(false, 'SNAPSHOT VELHO'); m.adiarSnoopy(true);
  const antigo = m.w.zelozinha116Ativar(); await new Promise(setImmediate);
  assert.equal(m.snoopy.consultas, 2, 'background antigo entrou em voo');
  m.estadoSnoopy(true, 'SNAPSHOT NOVO');
  const depoisAck = m.w.zelozinha116SnoopyAtualizar();
  assert.equal(m.snoopy.consultas, 2, 'ACK não abre uma leitura concorrente ao snapshot antigo');
  m.soltarSnoopy(); await new Promise(setImmediate);
  assert.equal(m.snoopy.consultas, 3, 'ao terminar o voo antigo, ACK inicia exatamente uma leitura posterior');
  assert.doesNotMatch(m.listaSnoopy.innerHTML, /SNAPSHOT VELHO/, 'snapshot iniciado antes do ACK não aparece');
  m.soltarSnoopy(); await Promise.all([antigo, depoisAck]);
  assert.match(m.listaSnoopy.innerHTML, /SNAPSHOT NOVO/);
  assert.match(m.listaSnoopy.innerHTML, /Lançado/);
}

(async () => {
  const falhas = [];
  for (const [nome, fn] of [['cache Snoopy invalidado', invalidaNaoRessuscita], ['revalidação financeira 60s', financeiroRevalidaSessentaSegundos], ['singleflight dados116', assinaturaNovaTemSingleflight], ['logout cancela voo', logoutCancelaVoo], ['ACK enfileira leitura posterior', ackEnfileiraLeituraPosterior]]) {
    try { await fn(); console.log(`PASSOU: ${nome}`); } catch (e) { falhas.push(`${nome}: ${e.message}`); console.error(`FALHOU: ${nome}\n${e.stack}`); }
  }
  if (falhas.length) { console.error(`cache149 crítico: ${falhas.length} falhas reproduzidas.`); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exitCode = 1; });
