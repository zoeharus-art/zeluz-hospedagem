'use strict';

// Integração real App → Dados → Painel usando apenas um banco falso.
const assert = require('node:assert/strict');
const Agenda = require('../auaulandia/agenda-marcia/dados.js');
const Entrevistas = require('../auaulandia/agenda-marcia/entrevistas.js');
const Composta = require('../auaulandia/agenda-marcia/composta.js');
const Painel = require('../auaulandia/agenda-marcia/painel.js');
const App = require('../auaulandia/agenda-marcia/app.js');

const DIA = '2026-10-25';
const PAI = 'daycare/dashboard/' + DIA + '/avaliacao';
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function snap(v) { return { val() { return clone(v); } }; }
class BancoFalso {
  constructor() { this.valores = {}; this.listeners = {}; this.referencias = []; this.writes = []; this.queries = []; this.pushCount = 0; this.offCount = 0; this.antesTx = null; }
  ref(path) { this.referencias.push(path); const db = this; return {
    orderByKey() { this.ordenada=true; return this; },
    startAt(v) { this.inicio=v; return this; },
    endAt(v) { this.fim=v; return this; },
    limitToFirst(n) { assert.equal(this.ordenada,true); assert.equal(n,path==='daycare/agenda-marcia/entrevistas'?31:1); db.queries.push({path,limit:n,inicio:this.inicio,fim:this.fim}); return this; },
    push() { db.pushCount += 1; return { key: 'row-' + db.pushCount }; },
    on(tipo, ok, erro) { assert.equal(tipo, 'value'); (db.listeners[path] || (db.listeners[path] = [])).push({ ok, erro }); queueMicrotask(() => ok(snap(db.valor(path)))); },
    once(tipo) { assert.equal(tipo, 'value'); return Promise.resolve(snap(db.valor(path))); },
    off(tipo, ok) { assert.equal(tipo, 'value'); db.offCount += 1; db.listeners[path] = (db.listeners[path] || []).filter(x => x.ok !== ok); },
    transaction(fn) { db.writes.push(path); if (db.antesTx) db.antesTx(path); const atual = clone(db.valor(path)), novo = fn(atual); if (novo === undefined) return Promise.resolve({ committed: false, snapshot: snap(atual) }); db.set(path, novo); return Promise.resolve({ committed: true, snapshot: snap(novo) }); }
  }; }
  valor(path) {
    if (Object.prototype.hasOwnProperty.call(this.valores, path)) return this.valores[path];
    const prefix = path.endsWith('/') ? path : path + '/'; const out = {};
    Object.keys(this.valores).forEach(k => { if (k.startsWith(prefix)) out[k.slice(prefix.length)] = this.valores[k]; });
    return Object.keys(out).length ? out : null;
  }
  set(path, value) { this.valores[path] = clone(value); const parent = path.slice(0, path.lastIndexOf('/')); const valueParent = this.valor(parent); (this.listeners[parent] || []).slice().forEach(x => x.ok(snap(valueParent))); }
}
class Raiz {
  constructor() { this.innerHTML = ''; this.handlers = {}; this.ownerDocument = { activeElement: null }; }
  addEventListener(n, f) { this.handlers[n] = f; }
  removeEventListener(n) { delete this.handlers[n]; }
  contains() { return true; }
  querySelector() { return null; }
}
function form(id, v = {}) {
  /* 30/out/2026: salvar exige as três escolhas; «Vai fazer na Zêluz» com o «Qual?» mantém conferido falso, como antes. */
  const d = Object.assign({ nome: 'Maya', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '09:30',
    'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
    'vacina-plano': 'na_zeluz', 'vacina-detalhe': 'Vacina fictícia', 'vermifugo-plano': 'na_zeluz', 'vermifugo-detalhe': 'Produto fictício', 'carrapaticida-plano': 'na_zeluz', 'carrapaticida-detalhe': 'Produto fictício',
    experiencia: '', saude: '', observacoes: '', 'pagamento-recebido': false }, v);
  return { closest() { return this; }, getAttribute(n) { return n === 'data-am-form' ? id : null; },
    querySelector(s) { const m = /^\[name="(.+)"\]$/.exec(s); return m ? { value: d[m[1]] == null ? '' : d[m[1]], checked: d[m[1]] === true } : null; } };
}
function submit(root, f) { root.handlers.submit({ target: f, preventDefault() {} }); }
function tick() { return new Promise(resolve => setImmediate(resolve)); }

async function executar() {
  const db = new BancoFalso(), raizAgenda = new Raiz(), projecoes = [];
  let permissao = true;
  const usuario = { id: 'consultora-1', nome: 'Consultora Ana', role: 'recepcao' };
  const globalAntes = {};
  ['entrevistas155Pode', 'DB', 'usuarioAtual', 'papelDoCorpo', 'telaVemDoPapel', 'paginaConcedida', 'PELUDINHOS', 'pelInativo', 'pelGet', 'RACAS', 'RACAS_CADASTRO', 'orcRacasAtualizar', 'racaCanonica', 'dashAgendaMarciaProjetar133'].forEach(k => { globalAntes[k] = globalThis[k]; });
  globalThis.DB = db;
  globalThis.entrevistas155Pode = () => true;
  globalThis.usuarioAtual = () => usuario;
  globalThis.papelDoCorpo = () => usuario.role;
  globalThis.telaVemDoPapel = (page, role) => permissao && page === 'agendamarcia' && role === 'recepcao';
  globalThis.paginaConcedida = () => false;
  globalThis.PELUDINHOS = [{ n: 'Maya', raca: 'SRD', tutor: 'Família Maya' }];
  globalThis.pelInativo = () => false;
  globalThis.pelGet = (p, k) => p[k];
  globalThis.RACAS = ['SRD', 'Poodle']; globalThis.RACAS_CADASTRO = [];
  globalThis.orcRacasAtualizar = () => {};
  globalThis.racaCanonica = v => v;
  globalThis.dashAgendaMarciaProjetar133 = (dia, id, reg, retry) => {
    const p = (((reg || {}).det || {}).avaliacao129 || {}).projecao || {};
    projecoes.push({ dia, id, acao: p.acao, retry: retry === true, reg: clone(reg) });
    return Promise.resolve({ ok: true });
  };

  const root = { document: {
    body: {},
    getElementById(id) {
      if (id === 'v-agendamarcia') return { classList: { contains() { return false; } } };
      return id === 'agendaMarciaRoot' ? raizAgenda : null;
    }
  }, ZeluzAgendaMarcia: Agenda, ZeluzAgendaMarciaEntrevistas: Entrevistas, ZeluzAgendaComposta150: Composta, ZeluzAgendaMarciaPainel: Painel, ZeluzMarcia129: { dataSP: () => DIA } };

  try {
    App.instalar(root);
    assert.equal(root.agendaMarciaAbrir(), true, 'rota autorizada abre');
    await tick(); await tick();
    assert(raizAgenda.innerHTML.includes('Agenda Márcia'));
    assert.deepEqual(db.referencias.filter(x => x === PAI), [PAI,PAI], 'fonte do dia e consulta limitada do calendário, sem once duplicado');
    assert.equal(db.queries.filter(x=>x.limit===1).length,31,'calendário limita a uma avaliação por dia do mês visível');
    assert.deepEqual(db.queries.filter(x=>x.limit===31),[{path:'daycare/agenda-marcia/entrevistas',limit:31,inicio:'2026-10-01',fim:'2026-10-31'}], 'entrevistas usam uma consulta mensal delimitada');
    assert.equal(db.referencias.length,34,'avaliações e entrevistas observadas no dia e no mês');

    // Campos obrigatórios faltando não chegam ao provider nem ao banco.
    submit(raizAgenda, form('novo', { nome: '', raca: '', tutor: '', hora: '', 'vacina-conferido': false }));
    await tick();
    assert.equal(db.writes.length, 0);
    assert(raizAgenda.innerHTML.includes('Informe o nome.') && raizAgenda.innerHTML.includes('Informe o tutor.'));

    // Dois submits simultâneos iguais reaproveitam o mesmo ID/transação.
    const fNovo = form('novo', { nome: 'Maya', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '09:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Resumo da chegada', 'pagamento-recebido': false });
    submit(raizAgenda, fNovo); submit(raizAgenda, fNovo);
    await tick(); await tick(); await tick();
    assert.equal(db.pushCount, 1, 'toque duplo de create aloca uma chave só');
    assert.equal(db.writes.filter(p => p.startsWith(PAI + '/')).length, 1, 'create concorrente faz uma transação');
    assert.equal(projecoes.length, 0, 'agendamento pendente não vai para Lançamentos/TV');
    const linha = db.valores[PAI + '/row-1'];
    assert.equal(linha.valor, 'Maya / SRD');
    assert.equal(linha.hora, '09:30');
    assert.equal(linha.det.avaliacao129.vacina.conferido, false, 'check desmarcado continua falso');
    assert.equal(linha.det.avaliacao129.vermifugo.conferido, false);
    assert.equal(linha.det.avaliacao129.carrapaticida.conferido, false);
    assert(!('tutor' in linha) && !linha.valor.includes('Família') && !linha.valor.includes('Resumo da chegada'), 'a planilha recebe só a projeção nome/raça/hora');
    assert.equal(linha.det.avaliacao129.pagamento.recebido, false, 'novo agendamento começa sem recebimento');
    assert.equal(root.agendaMarciaResumoHTML(linha), '', 'rota não injeta resumo paralelo no dashboard');
    assert(raizAgenda.innerHTML.includes('Agendamento salvo · pagamento pendente'));
    assert(!raizAgenda.innerHTML.includes('Avaliação confirmada'), 'pendente não aparece como avaliação confirmada');

    // Só depois que a Consultora marca recebido, o registro e os dois painéis confirmam R$ 80.
    submit(raizAgenda, form('row-1', { nome: 'Maya', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '09:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Resumo da chegada', 'pagamento-recebido': true }));
    await tick(); await tick();
    const linhaPaga = db.valores[PAI + '/row-1'];
    assert.equal(linhaPaga.det.avaliacao129.pagamento.recebido, true);
    assert.equal(linhaPaga.det.avaliacao129.pagamento.valorPagoCentavos, 8000);
    assert.equal(linhaPaga.det.avaliacao129.pagamento.autorId, usuario.id);
    assert.equal(linhaPaga.det.avaliacao129.pagamento.historico.at(-1).recebido, true);
    assert.equal(root.agendaMarciaResumoHTML(linhaPaga), '');
    assert(raizAgenda.innerHTML.includes('Avaliação confirmada · Consultora Ana'));
    assert.equal(projecoes.length, 1, 'pagamento confirmado lança uma vez');
    assert.equal(projecoes[0].acao, 'lancar');

    // Sem marcar recebido, o segundo evento segue pendente e não chama a projeção.
    submit(raizAgenda, form('novo', { nome: 'Sol', raca: 'Poodle', tutor: 'Família Sol', hora: '11:00', observacoes: 'Nota privada' }));
    await tick(); await tick(); await tick();
    const solPath = PAI + '/row-2', sol = db.valores[solPath];
    assert(sol, 'segundo agendamento persistiu');
    assert.equal(sol.det.avaliacao129.pagamento.recebido, false, 'não marcar o checkbox não inventa recebimento');
    assert.equal(root.agendaMarciaResumoHTML(sol), '');
    assert.equal(projecoes.length, 1, 'segundo agendamento pendente também não espelha');

    // Um edit só de observações preserva o recibo e não reenvia o resumo.
    const fEdit = form('row-1', { nome: 'Maya', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '09:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Observação revisada', 'pagamento-recebido': true });
    submit(raizAgenda, fEdit); await tick(); await tick();
    assert.equal(projecoes.length, 1, 'mudança só de detalhes não envia outra linha-resumo');
    assert.equal(db.valores[PAI + '/row-1'].det.avaliacao129.pagamento.recebido, true, 'editar preserva recebimento');

    // Mudar o resumo gera uma única pendência de edição e usa a ponte de update.
    const fResumo = form('row-1', { nome: 'Maya Nova', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '10:00',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Observação revisada', 'pagamento-recebido': true });
    submit(raizAgenda, fResumo); await tick(); await tick();
    assert.equal(projecoes.length, 2, 'edição do resumo pago usa uma projeção editar');
    assert.equal(projecoes[1].acao, 'editar'); assert.equal(projecoes[1].id, 'row-1');
    assert.equal(projecoes[1].reg.valor, 'Maya Nova / SRD');
    assert.equal(projecoes[1].reg.hora, '10:00');
    assert.equal(db.valores[PAI + '/row-1'].det.avaliacao129.pagamento.recebido, true);

    // Se a projeção de outra edição paga falha, os dados ficam salvos e a pendência fica visível.
    globalThis.dashAgendaMarciaProjetar133 = (dia,id,reg,retry) => { const p=reg.det.avaliacao129.projecao||{}; projecoes.push({dia,id,acao:p.acao,retry:retry===true,reg:clone(reg)}); return Promise.resolve({ok:false}); };
    submit(raizAgenda, form('row-1', { nome: 'Maya Nova', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '10:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Observação revisada', 'pagamento-recebido': true }));
    await tick(); await tick(); await tick();
    const linhaPendente = db.valores[PAI + '/row-1'];
    assert.equal(linhaPendente.hora, '10:30', 'falha da projeção não desfaz a edição do registro original');
    assert.equal(linhaPendente.det.avaliacao129.projecao.estado, 'pendente');
    assert.equal(linhaPendente.edicao_pendente.estado, 'ponte_pendente');
    assert.equal(projecoes.length, 3);
    assert.equal(projecoes[2].acao, 'editar');
    assert(raizAgenda.innerHTML.includes('Resumo na planilha/TV ainda pendente'), 'falha da projeção aparece sem fingir conclusão');

    // Mesmo com a projeção pendente, uma nota privada não tenta reenviar a linha-resumo.
    globalThis.dashAgendaMarciaProjetar133 = (dia,id,reg,retry) => { const p=reg.det.avaliacao129.projecao||{}; projecoes.push({dia,id,acao:p.acao,retry:retry===true,reg:clone(reg)}); return Promise.resolve({ok:true}); };
    submit(raizAgenda, form('row-1', { nome: 'Maya Nova', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '10:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false,
      observacoes: 'Nota após falha', 'pagamento-recebido': true }));
    await tick(); await tick();
    assert.equal(projecoes.length, 3, 'nota privada não reenvia uma projeção pendente');
    assert.equal(db.valores[PAI + '/row-1'].det.avaliacao129.observacoes, 'Nota após falha');

    // Conflito nativo após o snapshot antigo deve ser recusado pelo CAS.
    const before = clone(db.valores[PAI + '/row-1']);
    const stale = clone(before); stale.det.avaliacao129.observacoes = 'mudança concorrente'; stale.det.avaliacao129.revisao += 1;
    db.valores[PAI + '/row-1'] = stale;
    const fStale = form('row-1', { nome: 'Maya Nova', raca: 'SRD', tutor: 'Família Maya', telefone: '(00) 90000-0000', hora: '10:30',
      'vacina-conferido': false, 'vermifugo-conferido': false, 'carrapaticida-conferido': false, observacoes: 'Tentativa antiga', 'pagamento-recebido': true });
    const writesBeforeStale = db.writes.length, mirrorsBeforeStale = projecoes.length;
    submit(raizAgenda, fStale); await tick(); await tick();
    assert.equal(db.writes.length, writesBeforeStale + 1, 'CAS foi tentado uma vez');
    assert.equal(db.valores[PAI + '/row-1'].det.avaliacao129.observacoes, 'mudança concorrente', 'stale não sobrescreve a concorrência');
    assert.equal(projecoes.length, mirrorsBeforeStale, 'conflito não chama o espelho');
    assert(raizAgenda.innerHTML.includes('Não foi possível salvar.'), 'a interface informa o conflito e mantém o rascunho');

    // A consulta à rota não encosta em namespaces de cuidados clínicos ou cobrança.
    assert(db.referencias.every(p => /^daycare\/dashboard\/2026-10-\d{2}\/avaliacao(?:\/row-\d+)?$/.test(p) || /^daycare\/agenda-marcia\/entrevistas(?:\/2026-10-\d{2})?$/.test(p)), 'só avaliações diárias são consultadas; não há leitura do dashboard mensal inteiro');
    assert(db.referencias.every(p => !/vet|medicacao|cobranca|pagamento\/gateway/i.test(p)));
    root.agendaMarciaFechar();
    assert.equal(Object.keys(raizAgenda.handlers).length, 0, 'fechar remove listeners da UI');
    assert.equal(db.offCount,34,'fechar remove as fontes diárias e consultas mensais');
    assert(Object.values(db.listeners).every(x=>x.length===0),'nenhuma assinatura fica ativa depois de fechar');
    console.log('agenda-marcia-qa131: OK');
  } finally {
    try { root.agendaMarciaFechar(); } catch (_) {}
    ['entrevistas155Pode', 'DB', 'usuarioAtual', 'papelDoCorpo', 'telaVemDoPapel', 'paginaConcedida', 'PELUDINHOS', 'pelInativo', 'pelGet', 'RACAS', 'RACAS_CADASTRO', 'orcRacasAtualizar', 'racaCanonica', 'dashAgendaMarciaProjetar133'].forEach(k => {
      if (globalAntes[k] === undefined) delete globalThis[k]; else globalThis[k] = globalAntes[k];
    });
  }
}

executar().catch(e => { console.error(e); process.exitCode = 1; });
