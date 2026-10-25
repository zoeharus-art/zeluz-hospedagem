'use strict';

const assert = require('node:assert/strict');
const M = require('../auaulandia/marcia129/painel.js');

function bloco(itens = []) { return { estado: 'pronto', itens }; }
function snap(dia = '2026-10-24', extras = {}) {
  return Object.assign({
    dia,
    agenda: bloco([]),
    quantidades: { estado: 'pronto', matriculados: 12, avulsos: 2, reposicoes: 1, total: 15, hospedes: 3, presentes: 13 },
    faltas: bloco([]), novatos: bloco([]), comida: bloco([]), saude: bloco([]), tempos: bloco([]), tarefas: bloco([])
  }, extras);
}
function avaliacao(id, nome = 'FILHOt') {
  return { id, hora: '09:00', nome, raca: 'SRD', tutor: 'Responsável', vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true }, observacoes: [{ rotulo: 'Restrição', valor: 'Nenhuma informada' }] };
}
function adiar() { return new Promise(resolve => setImmediate(resolve)); }
function controlada() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }

class RaizFake {
  constructor() { this.innerHTML = ''; this.handlers = {}; this.ownerDocument = { activeElement: null }; }
  addEventListener(tipo, fn) { this.handlers[tipo] = fn; }
  removeEventListener(tipo) { delete this.handlers[tipo]; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  contains() { return true; }
  clicar(atributo, valor = '') {
    const alvo = {
      closest() { return this; },
      hasAttribute(nome) { return nome === atributo; },
      getAttribute(nome) { return nome === atributo ? valor : null; }
    };
    this.handlers.click({ target: alvo });
  }
}

function formAvaliacao(id, valores) {
  const campos = Object.assign({ tutor: 'Responsável', 'vacina-conferido': true, 'vermifugo-conferido': false, 'carrapaticida-conferido': true, experiencia: '', saude: '', observacoes: '', expectedRevision: '0' }, valores);
  return { closest() { return this; }, getAttribute(nome) { return nome === 'data-marcia-form-avaliacao' ? id : null; }, querySelector(seletor) { const m = seletor.match(/^\[name="(.+)"\]$/); return m ? { value: campos[m[1]] == null ? '' : campos[m[1]], checked: campos[m[1]] === true } : null; } };
}

async function executar() {
  assert.equal(typeof M.montar, 'function');
  assert.equal(typeof M.normalizar, 'function');
  assert.equal(typeof M.desenhar, 'function');
  assert.equal(typeof M.calendario, 'function');

  const invalido = M.normalizar(snap('2026-10-24', {
    agenda: bloco([avaliacao('a', '<img src=x onerror=1>')]),
    quantidades: { estado: 'pronto', matriculados: null, avulsos: 0, reposicoes: 0, total: null, hospedes: null },
    saude: bloco([{ id: 's', nome: 'Nome muito longo '.repeat(20), detalhe: '<script>ruim()</script>' }])
  }), '2026-10-24');
  assert.equal(invalido.quantidades.total, null, 'ausente não vira zero');
  assert.equal(invalido.agenda.itens[0].vermifugo.conferido, false, 'prevenção ausente fica a conferir');
  const semConferencia = snap('2026-10-24', { agenda: bloco([avaliacao('idem')]) });
  const normalizadoUmaVez = M.normalizar(semConferencia, '2026-10-24');
  const normalizadoDuasVezes = M.normalizar(normalizadoUmaVez, '2026-10-24');
  assert.deepEqual(normalizadoDuasVezes.agenda, normalizadoUmaVez.agenda, 'normalização de prevenção é idempotente sem conferencia original');
  assert.equal(normalizadoDuasVezes.agenda.itens[0].vacina.conferido, true);
  const canonicaFalsa = M.normalizar(snap('2026-10-24', { agenda: bloco([Object.assign(avaliacao('canon'), { conferencia: { tutor: 'Responsável', vacina: { conferido: false }, vermifugo: { conferido: true }, carrapaticida: { conferido: true }, revisao: 1 } })]) }), '2026-10-24');
  assert.equal(canonicaFalsa.agenda.itens[0].vacina.conferido, false, 'false canônico não é promovido pelo legado visual');
  const booleanos = M.normalizar(snap('2026-10-24', { tarefas: bloco([{ id: 'm', titulo: 'Não feita', feito: 'false' }]), tempos: bloco([{ id: 't', atividade: 'Pátio', emCurso: 'false' }]) }), '2026-10-24');
  assert.equal(booleanos.tarefas.itens[0].feito, false, 'texto false não vira tarefa feita');
  assert.equal(booleanos.tempos.itens[0].emCurso, false, 'texto false não vira atividade em curso');
  assert.equal(M.validarConferencia({ tutor: '', vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true } }, '2026-10-24').valido, false);
  assert.equal(M.validarConferencia({ tutor: 'Responsável', vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true } }, '2026-10-24').valido, true);
  const htmlSeguro = M.desenhar(invalido, { dia: invalido.dia });
  assert(!htmlSeguro.includes('<script>'));
  assert(!htmlSeguro.includes('<img src=x'));
  assert(htmlSeguro.includes('&lt;script&gt;ruim()&lt;/script&gt;'));
  assert(htmlSeguro.includes('>—<'), 'quantidade desconhecida usa travessão');

  for (const n of [0, 2, 3]) {
    const itens = Array.from({ length: n }, (_, i) => avaliacao(String(i), 'Nome ' + i));
    const html = M.desenhar(snap('2026-10-24', { agenda: bloco(itens) }), { dia: '2026-10-24' });
    assert.equal((html.match(/<details class="marcia129__avaliacao"/g) || []).length, n, `${n} avaliações aparecem integralmente`);
    assert(!html.includes('excesso'), 'quantidade usual não é limite');
  }

  const cal = M.calendario('2026-10-24', '2026-10');
  assert.equal(cal.dias.length, 35);
  assert.equal(cal.dias.filter(x => x && x.selecionado).length, 1);
  assert.equal(cal.dias.filter(x => x === null).length, 4, 'grade usa apenas vazios iniciais e dias do mês');
  assert.equal(M.calendario('2026-10-24', '2026-13').mes, '2026-10', 'mês inválido volta ao selecionado');
  assert.doesNotThrow(() => M.normalizar(snap('2026-10-24', { agenda: bloco([null]), faltas: bloco([null]) }), '2026-10-24'));

  const oito = M.desenhar(snap(), { dia: '2026-10-24' });
  ['Agenda da Márcia', 'Avaliações do dia (0)', 'O que fazer hoje', 'Matriculados previstos', 'Avulsos', 'Reposições', 'Total Day Care', 'Hóspedes', 'Faltas', 'Novatos', 'Quem não comeu — Day Care', 'Quem não comeu — Hóspedes', 'Questões do check-in', 'Tempo nas atividades'].forEach(t => assert(oito.includes(t), t));
  assert(!oito.includes('Quem não comeu — grupo a conferir'), 'grupo a conferir vazio não ocupa a tela');
  assert(oito.includes('pm-tile'));
  assert.equal((oito.match(/<details/g) || []).length, 6, 'seções são accordions nativos');
  const alimentacao = M.desenhar(snap('2026-10-24', { faltas: bloco([{ id: 'f', nome: 'Falta 1' }, { id: 'f2', nome: 'Falta 2' }]), comida: bloco([{ id: 'd', nome: 'Day', grupo: 'daycare' }, { id: 'h', nome: 'Hosp', grupo: 'hospede' }, { id: 'u', nome: 'Sem grupo', grupo: '' }]) }), { dia: '2026-10-24' });
  assert(alimentacao.includes('marcia129__secao-badge--critico">2</strong>'), 'faltas usam contador crítico');
  assert(alimentacao.includes('Quem não comeu — Day Care'));
  assert(alimentacao.includes('Quem não comeu — Hóspedes'));
  assert(alimentacao.includes('Quem não comeu — grupo a conferir'));
  assert(alimentacao.includes('Sem grupo'), 'grupo desconhecido não é omitido');

  const velha = controlada(), nova = controlada();
  const raiz = new RaizFake();
  const inst = M.montar(raiz, {
    dia: '2026-10-24',
    carregar(dia) { return dia === '2026-10-24' ? velha.promise : nova.promise; },
    salvarTarefa() { return Promise.reject(new Error('não usado')); }
  });
  await adiar();
  raiz.clicar('data-marcia-dia', '2026-10-25');
  await adiar();
  nova.resolve(snap('2026-10-25', { novatos: bloco([{ id: 'n', nome: 'Dado novo', detalhe: 'válido' }]) }));
  await adiar();
  velha.resolve(snap('2026-10-24', { novatos: bloco([{ id: 'v', nome: 'Dado velho' }]) }));
  await adiar();
  assert(raiz.innerHTML.includes('Dado novo'));
  assert(!raiz.innerHTML.includes('Dado velho'), 'callback antigo é descartado');
  assert.equal(inst.atualizar(snap('2026-10-24', { novatos: bloco([{ id: 'x', nome: 'Dia incorreto' }]) })), false);
  assert(!raiz.innerHTML.includes('Dia incorreto'), 'atualização de outro dia é ignorada');
  assert.equal(inst.atualizar(snap('2026-10-25', { novatos: bloco([{ id: 'c', nome: 'Atualização corrente' }]) })), true);
  assert(raiz.innerHTML.includes('Atualização corrente'));
  inst.destroy();
  assert.equal(inst.atualizar(snap('2026-10-25')), false, 'controller destruído ignora atualização');

  const salvamento = controlada();
  const raiz2 = new RaizFake();
  const baseTarefa = snap('2026-10-24', { tarefas: bloco([{ id: 'ligar', titulo: 'Ligar para responsável', feito: false }]) });
  M.montar(raiz2, { dia: '2026-10-24', carregar() { return Promise.resolve(baseTarefa); }, salvarTarefa() { return salvamento.promise; } });
  await adiar(); await adiar();
  raiz2.clicar('data-marcia-tarefa', 'ligar');
  await adiar();
  assert(raiz2.innerHTML.includes('Salvando…'));
  assert(raiz2.innerHTML.includes('aria-pressed="false"'), 'check só muda após confirmação');
  salvamento.resolve({ feito: true, quem: 'Márcia', quando: '10:30' });
  await adiar();
  assert(raiz2.innerHTML.includes('aria-pressed="true"'));
  assert(raiz2.innerHTML.includes('Márcia · 10:30'));

  const raiz3 = new RaizFake();
  M.montar(raiz3, { dia: '2026-10-24', carregar() { return Promise.resolve(baseTarefa); }, salvarTarefa() { return Promise.reject(new Error('falhou')); } });
  await adiar(); await adiar(); raiz3.clicar('data-marcia-tarefa', 'ligar'); await adiar(); await adiar();
  assert(raiz3.innerHTML.includes('Não foi possível salvar'));
  assert(raiz3.innerHTML.includes('aria-pressed="false"'));

  let pedido;
  const raiz4 = new RaizFake();
  M.montar(raiz4, { dia: '2026-10-24', carregar() { return Promise.resolve(snap('2026-10-24', { tarefas: bloco([{ id: 'feito', titulo: 'Tarefa feita', feito: true }]) })); }, salvarTarefa(x) { pedido = x; return Promise.resolve({ id: x.id, feito: x.feito, quem: 'Márcia', quando: '10:40' }); } });
  await adiar(); await adiar(); raiz4.clicar('data-marcia-tarefa', 'feito'); await adiar(); await adiar();
  assert.equal(pedido.feito, false, 'check permite desfazer');
  assert(raiz4.innerHTML.includes('aria-pressed="false"'));

  const raiz5 = new RaizFake();
  M.montar(raiz5, { dia: '2026-10-24', carregar() { return Promise.resolve(snap('2026-10-25')); }, salvarTarefa() { return Promise.resolve({ feito: true, quem: 'Márcia', quando: '10:45' }); } });
  await adiar(); await adiar();
  assert(raiz5.innerHTML.includes('Informação indisponível'), 'provider não pode trocar o dia silenciosamente');

  const raiz6 = new RaizFake();
  M.montar(raiz6, { dia: '2026-10-24', carregar() { return Promise.resolve(baseTarefa); }, salvarTarefa() { return Promise.resolve({ feito: true }); } });
  await adiar(); await adiar(); raiz6.clicar('data-marcia-tarefa', 'ligar'); await adiar(); await adiar();
  assert(raiz6.innerHTML.includes('Não foi possível salvar'), 'confirmação sem autoria/hora falha fechada');
  assert(raiz6.innerHTML.includes('aria-pressed="false"'));

  const feitaHtml = M.desenhar(snap('2026-10-24', { tarefas: bloco([{ id: 'ok', titulo: 'Concluída', feito: true, quem: 'Márcia', quando: '11:00' }]) }), { dia: '2026-10-24' });
  assert(feitaHtml.includes('Feitas (1)'));
  assert(feitaHtml.includes('<details class="marcia129__feitas">'));

  const editavel = M.desenhar(snap('2026-10-24', { agenda: bloco([avaliacao('av1')]) }), { dia: '2026-10-24', podeSalvarAvaliacao: true, avaliacoesPendentes: {}, avaliacoesErros: {} });
  assert(editavel.includes('Salvar conferência'));
  assert(editavel.includes('Experiência anterior em creche'));
  assert(editavel.indexOf('name="vacina-conferido"') < editavel.indexOf('Corrigir dados da avaliação'), 'checks ficam visíveis antes da gaveta de dados');
  assert(editavel.includes('aria-label="Domingo, 25 de outubro"') || editavel.includes('aria-label="Domingo, 25 de outubro de 2026"'));
  const somenteLeitura = M.desenhar(snap('2026-10-24', { agenda: bloco([avaliacao('av1')]) }), { dia: '2026-10-24' });
  assert(!somenteLeitura.includes('Salvar conferência'));
  const tutorVazio = M.desenhar(snap('2026-10-24', { agenda: bloco([Object.assign(avaliacao('sem-tutor'), { tutor: '' })]) }), { dia: '2026-10-24', podeSalvarAvaliacao: true, avaliacoesPendentes: {}, avaliacoesErros: {} });
  assert(tutorVazio.includes('<details class="marcia129__editar" open>'), 'dados abrem quando tutor está vazio');

  let envioAvaliacao;
  const raiz7 = new RaizFake();
  let enviosAvaliacao = [];
  M.montar(raiz7, { dia: '2026-10-24', carregar() { return Promise.resolve(snap('2026-10-24', { agenda: bloco([avaliacao('av1')]) })); }, salvarTarefa() { return Promise.reject(); }, salvarAvaliacao(x) { envioAvaliacao = x; enviosAvaliacao.push(x); const rev = enviosAvaliacao.length; return Promise.resolve({ id: 'av1', codigoOrigem: '', agenda: { tutor: x.tutor, vacina: x.vacina, vermifugo: x.vermifugo, carrapaticida: x.carrapaticida }, conferencia: { tutor: x.tutor, vacina: x.vacina, vermifugo: x.vermifugo, carrapaticida: x.carrapaticida, experiencia: x.experiencia, saude: x.saude, observacoes: x.observacoes, revisao: rev, quem: 'Márcia', quando: '12:00' } }); } });
  await adiar(); await adiar();
  const form = formAvaliacao('av1');
  raiz7.handlers.submit({ target: form, preventDefault() {} });
  await adiar(); await adiar();
  assert.equal(envioAvaliacao.id, 'av1');
  assert.equal(envioAvaliacao.expectedRevision, 0);
  assert.equal(envioAvaliacao.vacina.conferido, true);
  assert.equal(envioAvaliacao.vermifugo.conferido, false, 'desmarcado permanece a conferir');
  assert(!raiz7.innerHTML.includes('Não foi possível salvar a conferência'));
  assert(raiz7.innerHTML.includes('name="expectedRevision" value="1"'), 'revisão numérica 1 sobrevive ao render');
  raiz7.handlers.submit({ target: formAvaliacao('av1', { expectedRevision: '1', 'vacina-conferido': false }), preventDefault() {} });
  await adiar(); await adiar();
  assert.equal(enviosAvaliacao[1].expectedRevision, 1, 'segunda edição envia revisão 1');
  assert.equal(enviosAvaliacao[1].vacina.conferido, false, 'check pode ser desmarcado e salvo rapidamente');

  const raiz8 = new RaizFake();
  M.montar(raiz8, { dia: '2026-10-24', carregar() { return Promise.resolve(snap('2026-10-24', { agenda: bloco([avaliacao('av2')]) })); }, salvarTarefa() { return Promise.reject(); }, salvarAvaliacao() { return Promise.resolve({ id: 'errado' }); } });
  await adiar(); await adiar(); raiz8.handlers.submit({ target: formAvaliacao('av2'), preventDefault() {} }); await adiar(); await adiar();
  assert(raiz8.innerHTML.includes('Não foi possível salvar a conferência'));

  const salvarAntigo = controlada();
  const raiz9 = new RaizFake();
  M.montar(raiz9, { dia: '2026-10-24', carregar(d) { return Promise.resolve(snap(d, { agenda: bloco(d === '2026-10-24' ? [avaliacao('av3')] : []) })); }, salvarTarefa() { return Promise.reject(); }, salvarAvaliacao() { return salvarAntigo.promise; } });
  await adiar(); await adiar(); raiz9.handlers.submit({ target: formAvaliacao('av3'), preventDefault() {} }); await adiar();
  raiz9.clicar('data-marcia-dia', '2026-10-25'); await adiar(); await adiar();
  salvarAntigo.resolve({ id: 'av3', codigoOrigem: '', agenda: { tutor: 'Tutor antigo', vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true } }, conferencia: { tutor: 'Tutor antigo', vacina: { conferido: true }, vermifugo: { conferido: false }, carrapaticida: { conferido: true }, revisao: 1, quem: 'Márcia', quando: '12:10' } });
  await adiar(); await adiar();
  assert.equal(raiz9.innerHTML.includes('Tutor antigo'), false, 'confirmação tardia de outro dia é ignorada');

  const tempoSemMin = M.desenhar(snap('2026-10-24', { tempos: bloco([{ id: 'tm', atividade: 'Almoço', minutos: null, emCurso: true }]) }), { dia: '2026-10-24' });
  assert(tempoSemMin.includes('Almoço · Em curso'));

  const cargaAntiga = controlada();
  const raiz10 = new RaizFake();
  const controleLive = M.montar(raiz10, { dia: '2026-10-24', carregar() { return cargaAntiga.promise; }, salvarTarefa() { return Promise.reject(); } });
  await adiar();
  assert.equal(controleLive.atualizar(snap('2026-10-24', { novatos: bloco([{ id: 'b', nome: 'SNAPSHOT B' }]) })), true);
  cargaAntiga.resolve(snap('2026-10-24', { novatos: bloco([{ id: 'a', nome: 'SNAPSHOT A' }]) }));
  await adiar(); await adiar();
  assert(raiz10.innerHTML.includes('SNAPSHOT B'));
  assert(!raiz10.innerHTML.includes('SNAPSHOT A'), 'carga inicial não regride atualização live');

  const cargaComErro = controlada();
  const raiz11 = new RaizFake();
  const controleErro = M.montar(raiz11, { dia: '2026-10-24', carregar() { return cargaComErro.promise; }, salvarTarefa() { return Promise.reject(); } });
  await adiar(); controleErro.atualizar(snap('2026-10-24', { novatos: bloco([{ id: 'b2', nome: 'LIVE PRESERVADO' }]) }));
  cargaComErro.reject(new Error('falha antiga')); await adiar(); await adiar();
  assert(raiz11.innerHTML.includes('LIVE PRESERVADO'));
  assert(!raiz11.innerHTML.includes('Informação indisponível'), 'erro da carga antiga não apaga live válido');

  console.log('marcia-dashboard129: OK');
}

executar().catch(err => { console.error(err); process.exitCode = 1; });
