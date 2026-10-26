'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../auaulandia/index.html'), 'utf8');
const entre = (inicio, fim) => {
  const a = html.indexOf(inicio), b = html.indexOf(fim, a + inicio.length);
  assert.ok(a >= 0 && b > a, `trecho não encontrado: ${inicio}`);
  return html.slice(a, b);
};
const script = (id) => {
  const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m, `script ausente: ${id}`);
  return m[1];
};
const puro = {};
vm.createContext(puro);
vm.runInContext(script('zelozinha-tela94-puro'), puro);
vm.runInContext(entre('/* Confirmação humana de lançamento no Snoopy.', '/* Adaptador local para Snoopy28.'), puro);
const T = puro.ZelozinhaTela94, S = puro.ZeluzSnoopyConfirmacao;
assert.ok(T && S && typeof S.projetar === 'function');
assert.match(script('zelozinha-contatos89-ui'), /if\(acao==='esc'\)\{if\(cy\)gravarEscolha\(c,cy,el\.getAttribute\('data-zt694-campo'\)/, 'clique do chip deve chegar à gravação');

const corpo = entre('  async function gravarEscolha(c,cy,campo,valor,op){', '  function capacidadeCartaz(){');
const controller116 = script('zelozinha-painel116-controller');
const clone = (x) => JSON.parse(JSON.stringify(x));
const dia = '2026-10-26', dc = 'filhot-ficticio__tutor-ficticio';
const cycleKey = JSON.stringify(['pet-fixture','tutor-fixture','antip','2026-10-27','ecto_p']);
const cy = { cycleKey, itemK: 'ecto_p' };
const c = { dia, dcKey: dc, ciclos: [cy] };
const lineId = 'linha-fixture', respostaId = 'resposta-fixture';
const ref = { dia, item: 'carrapaticida', id: lineId };
function linha() {
  return { chave: dc, valor: 'FILHOt fictício (CONFERIR ORIENTAÇÃO)', det: { cuidado57_estado: 'conferir-orientacao' },
    origemVencimento: { protocolo: 'cuidado57', linhaId: lineId, cycleKey, itemK: 'ecto_p', respostaId, revisao: 0, origemResposta: 'loja' } };
}
function registro() {
  return { respostasEscopo49: { porCiclo: { [cycleKey]: { cycleKey, itemK: 'ecto_p', respostaId, revisao: 0, decisao: 'autorizar', origem: 'loja' } },
    tarefas57: { [cycleKey]: { estado: 'criada', versao: { respostaId, revisao: 0 }, linha: { item: 'carrapaticida', id: lineId } } } } };
}
function mundo(op = {}) {
  const store = { linha: linha(), registro: registro(), snoopy: { eventos: {} }, tx: 0, redraw: 0, releu: 0, invalidou116: 0, aviso: '', bloquearTx: false };
  const antigo = clone(store.linha), assAntiga = S.assinatura(antigo);
  store.snoopy.eventos.confirmacaoFicticia = { tipo: 'confirmacao', assinatura: assAntiga, operacaoId: 'confirmacaoFicticia' };
  assert.equal(S.projetar(store.linha, store.snoopy, store.linha).estado, 'confirmacao-vigente');
  let soltarWarm;
  const ctx = {
    T, c, cy, estado: { salvando: {}, avisos: {}, linhas: {}, registros139: {}, snoopyEstado: 'pronto' }, DASH_DADOS: {},
    vmCuidado: () => ({ tarefa: store.registro.respostasEscopo49.tarefas57[cycleKey] }),
    lerRegistro: async () => { const r = clone(store.registro); ctx.estado.registros139[dc] = { dia, registro: r }; return r; },
    respostaAtual: () => ctx.estado.registros139[dc].registro.respostasEscopo49.porCiclo[cycleKey],
    tarefaDe: () => ctx.estado.registros139[dc].registro.respostasEscopo49.tarefas57[cycleKey],
    valorAtual: (r) => r && r.decisao === 'autorizar' && r.origem === 'loja' ? 'autorizar_loja' : '',
    daLinha: (v) => v === 'autorizar_loja', linhaDoDia: () => clone(store.linha),
    snoopyConfirmadoDe: async () => op.snoopyFalha ? null : true,
    avisoLinha: (_dc, _i, msg) => { store.aviso = msg; }, redesenharLinha: () => { store.redraw++; },
    chaveLinha: () => 'linha', linhaPronta: () => !op.semMemoria, txt: (v) => typeof v === 'string' ? v.trim() : '',
    DB: { ref: (p) => ({
      once: async () => { if (p === `daycare/snoopy/${dia}/carrapaticida/${lineId}`) return { val: () => clone(store.snoopy) };
        assert.equal(p, `daycare/dashboard/${dia}/carrapaticida/${lineId}`); if (op.noWarm) await new Promise(resolve => { soltarWarm = resolve; });
        if (op.mudarTarefaNoWarm) store.registro.respostasEscopo49.tarefas57[cycleKey].estado = 'emexecucao';
        if (op.mudarRespostaNoWarm) { store.registro.respostasEscopo49.porCiclo[cycleKey].respostaId = 'resposta-concorrente'; store.registro.respostasEscopo49.porCiclo[cycleKey].revisao = 1; store.registro.respostasEscopo49.tarefas57[cycleKey].versao = { respostaId: 'resposta-concorrente', revisao: 1 }; }
        return { val: () => clone(store.linha) }; },
      transaction: async (f) => { assert.equal(p, `daycare/dashboard/${dia}/carrapaticida/${lineId}`); store.tx++; const novo = f(clone(store.linha)); if (op.falharAck || !novo) return { committed: false, snapshot: { val: () => clone(store.linha) } }; store.linha = clone(novo); return { committed: true, snapshot: { val: () => clone(store.linha) } }; }
    }) },
    sincronizarSnoopyExterno: async () => { store.releu++; store.projecao = S.projetar(store.linha, store.snoopy, store.linha); return true; },
    window: { ZeluzSnoopyConfirmacao: S, zelozinha116SnoopyInvalidar: () => { store.invalidou116++; return true; } }
  };
  vm.createContext(ctx);
  vm.runInContext(corpo, ctx);
  return { store, ctx, escolher: (campo, valor) => ctx.gravarEscolha(c, cy, campo, valor, {}), soltar: () => soltarWarm && soltarWarm() };
}
async function testarAbaSnoopy116() {
  const elemento = () => ({ innerHTML: '', textContent: '', attrs: {}, classList: { add() {}, remove() {}, contains: () => ativo }, addEventListener() {},
    setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, getAttribute(k) { return this.attrs[k] || null; } });
  let ativo = false, leiturasDados = 0, leiturasSnoopy = 0, invalidacoes = 0, cancelamentos = 0, adiar = false, falharProxima = false;
  const pendencias = [];
  const host = elemento(), contador = elemento(), listaCuidados = elemento(), listaAndamento = elemento(), listaSnoopy = elemento(), badge = elemento();
  const tabs = ['resolve','progress','snoopy'].map(nome => { const e=elemento(); e.attrs['data-zt694-tab']=nome; return e; });
  const panes = tabs.map(tab => { const e=elemento(); e.attrs['data-zt694-pane']=tab.attrs['data-zt694-tab']; return e; });
  const eventos = {};
  const hub = { querySelector(sel) { return ({ '[data-zt694-date-host]':host,'[data-zt694-day-label]':elementoDia,
    '[data-zt694-count]':contador,'[data-zt694-resolver-list]':listaCuidados,'[data-zt694-andamento-list]':listaAndamento,
    '[data-zt694-snoopy-list]':listaSnoopy,'[data-zt694-snoopy-count]':badge,'[data-zt694-tab="snoopy"]':tabs[2] })[sel] || null; },
    querySelectorAll(sel) { return sel === '[data-zt694-tab]' ? tabs : sel === '[data-zt694-pane]' ? panes : []; },
    addEventListener(nome,fn) { eventos[nome]=fn; }, closest() { return { classList: { contains: () => ativo } }; } };
  const elementoDia = elemento();
  const doc = { querySelector: () => hub, dispatchEvent() {} };
  const w = { zPainel44Dia: () => dia, DB: {}, ZeluzSnoopyConfirmacao: S, ZeluzSnoopy31AdaptadorDB: {}, ZeluzSnoopy33Interface: {},
    ZelozinhaDadosPainel116: {
      criar(op) { return { ler: async d => { leiturasDados++; op.aoAtualizar({ dia:d, estado:'pronto', total:1, itens:[] }); return true; } }; },
      criarSnoopy(op) { return { ler: async d => { const numero=++leiturasSnoopy; if(adiar)await new Promise(resolve => { pendencias.push(resolve); });
        if(falharProxima){falharProxima=false;const r={dia:d,estado:'desconhecido',total:null,itens:null};op.aoAtualizar(r);return r;}
        const pendente=numero!==1&&numero!==5;
        const r={ dia:d, estado:'pronto', total:pendente?1:0, itens:[{ item:'carrapaticida', id:lineId, valor:'FILHOt fictício', confirmado:!pendente, html:'' }] };
        op.aoAtualizar(r); return r; }, invalidar() { invalidacoes++; }, cancelar() { cancelamentos++; } }; }
    } };
  vm.runInNewContext(controller116, { window:w, document:doc, DB:w.DB, CustomEvent:class { constructor(){} }, setTimeout, clearTimeout, Date, Intl });
  ativo = true; await w.zelozinha116Ativar();
  assert.match(listaSnoopy.innerHTML, /Feito/); assert.equal(leiturasDados,1); assert.equal(leiturasSnoopy,1);
  assert.equal(w.zelozinha116SnoopyInvalidar(dia), true);
  assert.equal(invalidacoes,1); assert.equal(badge.textContent,'—');
  assert.doesNotMatch(listaSnoopy.innerHTML, /Feito/, 'cartão financeiro antigo some imediatamente');
  assert.equal(leiturasDados,1, 'chip não relê presença nem projeção');
  eventos.click({ target: { closest: () => tabs[2] } });
  await new Promise(setImmediate);
  assert.equal(leiturasSnoopy,2, 'abrir a aba relê apenas o financeiro uma vez');
  assert.equal(leiturasDados,1, 'abrir a aba não relê presença nem projeção');
  assert.match(listaSnoopy.innerHTML, /Pendente/); assert.doesNotMatch(listaSnoopy.innerHTML, /Feito/);
  assert.equal(badge.textContent,'1'); assert.equal(elementoDia.textContent.includes('2026'),true,'data escolhida preservada');
  const diaNovo='2026-10-27';
  await w.zelozinha116SelecionarDia(diaNovo,false);
  const cancelAntes=cancelamentos, dadosAntes=leiturasDados, snAntes=leiturasSnoopy;
  w.zelozinha116SnoopyInvalidar(dia);
  assert.equal(cancelamentos,cancelAntes,'invalidar data antiga não cancela leitura da nova');
  assert.equal(leiturasDados,dadosAntes); assert.equal(leiturasSnoopy,snAntes);
  assert.equal(elementoDia.textContent.includes('27'),true,'data nova continua selecionada');
  await w.zelozinha116SelecionarDia(dia,false);
  w.zelozinha116AbrirFila('snoopy');
  adiar=true;const dadosAntesCorrida=leiturasDados;
  w.zelozinha116SnoopyInvalidar(dia);
  await new Promise(setImmediate);assert.equal(leiturasSnoopy,5);
  w.zelozinha116SnoopyInvalidar(dia);
  assert.equal(leiturasSnoopy,5,'segunda invalidação não inicia leitura concorrente');
  pendencias.shift()();await new Promise(setImmediate);
  assert.doesNotMatch(listaSnoopy.innerHTML,/Feito/,'resultado velho em voo não reaparece');
  assert.equal(leiturasSnoopy,6,'ao terminar leitura obsoleta, uma nova leitura começa');
  pendencias.shift()();await new Promise(setImmediate);
  assert.match(listaSnoopy.innerHTML,/Pendente/);
  assert.equal(leiturasSnoopy,6,'sem terceira leitura');
  assert.equal(leiturasDados,dadosAntesCorrida,'corrida financeira não relê dadosApi');
  falharProxima=true;w.zelozinha116SnoopyInvalidar(dia);await new Promise(setImmediate);
  assert.equal(leiturasSnoopy,7);pendencias.shift()();await new Promise(setImmediate);
  assert.equal(leiturasSnoopy,7,'falha sem invalidação nova não entra em loop');
  assert.equal(badge.textContent,'—');assert.doesNotMatch(listaSnoopy.innerHTML,/Feito/);
}

(async () => {
  await testarAbaSnoopy116();
  assert.equal(T.podeEscolher({ campo: 'prod', tarefaEstado: 'criada', snoopyConfirmado: true }).ok, true);
  assert.equal(T.podeEscolher({ campo: 'qtd', tarefaEstado: 'criada', snoopyConfirmado: true }).ok, true);
  assert.equal(JSON.stringify(T.camposDoCuidado('ecto_p')), JSON.stringify(['prod','qtd','onde']));
  assert.equal(T.podeEscolher({ campo: 'onde', tarefaEstado: 'criada', snoopyConfirmado: true }).motivo, 'ja-no-snoopy');
  assert.equal(T.podeEscolher({ campo: 'prod', tarefaEstado: 'realizado', snoopyConfirmado: true }).motivo, 'ja-aplicado');
  const m = mundo();
  assert.equal(await m.escolher('prod', 'PRODUTO FICTÍCIO'), true);
  assert.equal(await m.escolher('qtd', '1 UNIDADE'), true);
  assert.equal(m.store.linha.det.prod, 'PRODUTO FICTÍCIO');
  assert.equal(m.store.linha.det.qtd, '1 UNIDADE');
  assert.equal(m.store.linha.valor, linha().valor, 'célula de lançamento preservada');
  assert.equal(m.store.linha.origemVencimento.origemResposta, 'loja');
  assert.equal(m.store.tx, 2, 'duas escolhas humanas, duas transações com ACK');
  assert.equal(m.store.invalidou116, 2, 'cache financeiro116 invalidado somente após cada ACK material');
  assert.equal(m.store.releu, 2, 'Snoopy relido após cada mudança confirmada');
  assert.equal(m.store.projecao.estado, 'pendente', 'assinatura material nova pede confirmação');
  assert.ok(m.store.snoopy.eventos.confirmacaoFicticia, 'recibo anterior preservado');
  assert.equal(m.store.snoopy.eventos.confirmacaoFicticia.assinatura, S.assinatura(linha()), 'recibo mantém material antigo');

  const origem = mundo();
  assert.equal(await origem.escolher('onde', 'NA BOLSA'), false);
  assert.equal(origem.store.tx, 0); assert.match(origem.store.aviso, /Snoopy/);
  const semPainel = mundo(); delete semPainel.ctx.window.zelozinha116SnoopyInvalidar;
  assert.equal(await semPainel.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(semPainel.store.tx, 0, 'sem invalidação financeira, não criar Feito obsoleto');
  const falha = mundo({ falharAck: true });
  assert.equal(await falha.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(falha.store.linha.det.prod, undefined); assert.equal(falha.store.releu, 0);
  assert.equal(falha.store.invalidou116, 0, 'sem ACK não invalidar o financeiro');
  assert.match(falha.store.aviso, /banco não confirmou/);
  const semMemoria = mundo({ semMemoria: true });
  assert.equal(await semMemoria.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(semMemoria.store.linha.det.prod, 'PRODUTO FICTÍCIO', 'ACK do banco preservado');
  assert.equal(semMemoria.store.releu, 0, 'sem fonte material na memória, não declarar releitura nativa');
  assert.match(semMemoria.store.aviso, /Escolha salva na linha.*Snoopy/);
  const corrida = mundo({ noWarm: true });
  const primeiro = corrida.escolher('prod', 'PRODUTO FICTÍCIO');
  await new Promise(setImmediate);
  assert.equal(await corrida.escolher('qtd', '1 UNIDADE'), false, 'duplo toque não disputa a linha');
  corrida.soltar(); assert.equal(await primeiro, true); assert.equal(corrida.store.tx, 1);
  const mudou = mundo({ mudarTarefaNoWarm: true });
  assert.equal(await mudou.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(mudou.store.tx, 0, 'tarefa alterada antes da transação bloqueia a escolha');
  const concorrente = mundo({ mudarRespostaNoWarm: true });
  assert.equal(await concorrente.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(concorrente.store.tx, 0, 'resposta e tarefa alteradas juntas não herdam a linha antiga');
  const realizado = mundo(); realizado.store.linha.det.cuidado57_estado = 'realizado-conferido';
  assert.equal(await realizado.escolher('prod', 'PRODUTO FICTÍCIO'), false);
  assert.equal(realizado.store.tx, 1, 'transação consulta a linha real e falha fechada');
  console.log('escolhas142: clique ligado, duas escolhas com ACK, Snoopy material pendente, falhas e concorrência conferidos.');
})().catch(e => { console.error(e); process.exitCode = 1; });
