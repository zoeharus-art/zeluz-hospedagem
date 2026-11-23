'use strict';
/*
 * PROVA: mudar a saída do hóspede sem refazer o check-in (Adriana, 23/nov/2026; maquete aprovada no mesmo dia).
 *
 * «Tutor pediu para mudar a data de saída. Tive que entrar no check-in e confirmar todo ele. Quero uma forma mais
 *  simples de mudar o dia. [...] Se for faltar algo, tem que ser avisado, para passarmos para o tutor.»
 *
 * - Botão «Mudar saída» no cartão do hóspede (recepção, supervisão, gestão, diretoria; a plantonista não vê).
 * - Nova data em um toque; o banho de saída vai junto (mesma hora, outra hora ou sem banho).
 * - Antes de salvar, confere comida e remédio até a nova data; a mensagem para o tutor sai pronta.
 * - Grava num update só da estadia, com o histórico em datas_historico; sem senha, quem está logado assina.
 *
 * Parte pura (mudar-saida.js) e app real no Chromium, sem rede, com banco falso. Dados inventados.
 * Uso:  node tests/mudar-saida190.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..', 'auaulandia');
const APP = path.join(RAIZ, 'index.html');
const M = require(path.join(RAIZ, 'mudar-saida.js'));
let ok = 0; const falhas = [];
const sq = (x) => String(x || '').replace(/\s+/g, '');
function tem(t, frag) { assert.ok(sq(t).indexOf(sq(frag)) >= 0, 'faltou «' + frag + '» em: ' + t); }
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

(async () => {
  console.log('Parte pura');
  await prova('opções: «Amanhã» quando a saída é hoje; «Mais 1 dia» quando é mais à frente', () => {
    assert.deepStrictEqual(M.opcoes('2026-11-23', '2026-11-23'), [{ v: '2026-11-24', rot: 'Amanhã (24/11)' }, { v: '2026-11-25', rot: 'Mais 2 dias (25/11)' }]);
    assert.deepStrictEqual(M.opcoes('2026-11-26', '2026-11-23').map((o) => o.rot), ['Mais 1 dia (27/11)', 'Mais 2 dias (28/11)']);
  });
  await prova('a frase das noites: a mais, a menos e a mesma data', () => {
    assert.strictEqual(M.frase('2026-11-23', '2026-11-24'), 'Fica mais 1 noite (sai terça, 24/11).');
    assert.strictEqual(M.frase('2026-11-23', '2026-11-25'), 'Fica mais 2 noites (sai quarta, 25/11).');
    assert.strictEqual(M.frase('2026-11-23', '2026-11-22'), 'Sai antes: 1 noite a menos (sai domingo, 22/11).');
    assert.strictEqual(M.frase('2026-11-23', '2026-11-23'), 'É a mesma data de saída.');
  });
  await prova('a régua: data passada, antes da entrada, mesma data e hospedagem encerrada não salvam', () => {
    const e = { status: 'ativa', entrada: '2026-11-18', saida: '2026-11-23' };
    assert.strictEqual(M.validar(e, '2026-11-24', '2026-11-23'), '');
    assert.ok(/já passou/.test(M.validar(e, '2026-11-22', '2026-11-23')));
    assert.ok(/antes da entrada/.test(M.validar(e, '2026-11-17', '2026-11-16')));
    assert.ok(/mesma data/.test(M.validar(e, '2026-11-23', '2026-11-23')));
    assert.ok(/não está em curso/.test(M.validar(Object.assign({}, e, { status: 'finalizada' }), '2026-11-24', '2026-11-23')));
    assert.ok(/Escolha/.test(M.validar(e, '', '2026-11-23')));
  });
  const E = { nome: 'Teste 01', tutor: 'Tutora Teste', status: 'ativa', entrada: '2026-11-18', saida: '2026-11-23',
    ficha: { spa: { banho: 'Sim', horario: '16:00', horaDia: '2026-11-23', aConfirmar: false, tipo: 'Premium' } } };
  await prova('gravação com a mesma hora: a hora passa a valer para o dia novo (horaDia) e o histórico ganha um registro', () => {
    const P = M.patch({ e: E, nova: '2026-11-24', banho: 'mesma', quem: 'Recepção Teste', ts: 1000, quando: '23/11 09:20', motivo: 'Tutor pediu', chave: 'dh1000' });
    assert.strictEqual(P.saida, '2026-11-24');
    assert.deepStrictEqual(P.alteracao_anterior, { entrada: '2026-11-18', saida: '2026-11-23' });
    assert.strictEqual(P['ficha/spa/horario'], '16:00'); assert.strictEqual(P['ficha/spa/horaDia'], '2026-11-24'); assert.strictEqual(P['ficha/spa/aConfirmar'], false);
    assert.deepStrictEqual(P['ficha/spa/hora_por'], { quem: 'Recepção Teste', ts: 1000, de: '16:00' });
    const h = P['datas_historico/dh1000'];
    assert.strictEqual(h.saida_antes, '2026-11-23'); assert.strictEqual(h.saida, '2026-11-24'); assert.strictEqual(h.origem, 'mudar-saida');
    assert.strictEqual(h.registro.por, 'Recepção Teste'); assert.strictEqual(h.registro.quando, '23/11 09:20'); assert.strictEqual(h.motivo, 'Tutor pediu');
    assert.strictEqual(h.banho, 'banho de saída 24/11 às 16:00');
    assert.ok(!Object.keys(P).some((k) => /^ficha\/(alim|medic)|^medicacao|^checkin/.test(k)), 'o check-in não é tocado');
  });
  await prova('outra hora e sem banho', () => {
    const P = M.patch({ e: E, nova: '2026-11-24', banho: 'outra', hora: '14:30', quem: 'R', ts: 1, chave: 'k' });
    assert.strictEqual(P['ficha/spa/horario'], '14:30'); assert.deepStrictEqual(P['ficha/spa/hora_por'].de, '16:00');
    const S = M.patch({ e: E, nova: '2026-11-24', banho: 'sem', quem: 'R', ts: 1, chave: 'k' });
    assert.strictEqual(S['ficha/spa/banho'], 'Não'); assert.strictEqual(S['ficha/spa/horario'], undefined);
    assert.deepStrictEqual(S['ficha/spa/sem_por'].antes, { banho: 'Sim', horario: '16:00', tipo: 'Premium' });
  });
  await prova('sem banho de saída na estadia: a gravação não mexe em ficha/spa', () => {
    const P = M.patch({ e: { status: 'ativa', entrada: '2026-11-18', saida: '2026-11-23' }, nova: '2026-11-24', banho: 'mesma', quem: 'R', ts: 1, chave: 'k' });
    assert.ok(!Object.keys(P).some((k) => k.indexOf('ficha/') === 0));
  });
  await prova('a mensagem para o tutor: formatada, com o que falta', () => {
    const txt = M.mensagem({ tutor: 'Tutora Teste', nome: 'Teste 01', nova: '2026-11-24',
      faltas: [{ tipo: 'medicacao', nome: 'Remédio Teste', deficit: 2, unidade: 'comp.' }, { tipo: 'racao', nome: 'Ração', deficit: 60, unidade: 'g' }] });
    assert.strictEqual(txt, 'Olá, Tutora! 💛\n\nAnotamos: Teste 01 fica com a gente até terça, 24/11. 🐾\n\n💊 O Remédio Teste não dá para os dias a mais. Pode trazer mais 2 comp.?\n🥣 A comida não dá para os dias a mais. Pode trazer mais 60 g?\n\nQualquer dúvida, é só chamar. 💛');
    assert.strictEqual(M.faltaTexto({ tipo: 'medicacao', nome: 'Remédio Teste', trazido: 10, necessario: 12, deficit: 2, unidade: 'comprimido', ate: '2026-11-24' }),
      'Remédio Teste: veio 10 comprimidos, precisa de 12 comprimidos até 24/11. Faltam 2 comprimidos.');
    assert.strictEqual(M.faltaTexto({ tipo: 'racao', nome: 'Ração', trazido: 500, necessario: 560, deficit: 60, unidade: 'g', ate: '2026-11-24' }),
      'Comida Ração: veio 500 g, precisa de 560 g até 24/11. Faltam 60 g.');
    assert.ok(!/remédio|comida/i.test(M.mensagem({ tutor: 'Tutora', nome: 'X', nova: '2026-11-24', faltas: [] }).replace('Qualquer', '')));
  });

  console.log('App');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e.message || e)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.replace(/\\/g, '/'));
  await p.waitForTimeout(700);
  const r = await p.evaluate(async () => {
    const out = {};
    const hoje = cafeDataKey(), mais = (n) => orcMaisDias(hoje, n);
    const ests = {
      e1: { nome: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD', refKey: 'teste 01__tutora teste', status: 'ativa', entrada: mais(-3), saida: hoje,
        ficha: { spa: { banho: 'Sim', horario: '16:00', horaDia: hoje, aConfirmar: false, tipo: 'Premium' } },
        medicacao: [{ nome: 'Remédio Teste', q: '1', u: 'comprimido', horarios: ['08:00', '20:00'], estoque: { modo: 'contavel', inicial: 8 } }] },
      e2: { nome: 'Teste 02', tutor: 'Tutora Dois', raca: 'SRD', refKey: 'teste 02__tutora dois', status: 'ativa', entrada: mais(-1), saida: mais(2) }
    };
    _cfIndexarEstadias(JSON.parse(JSON.stringify(ests)));
    hospedes = [{ nome: 'Teste 01', tutor: 'Tutora Teste', refKey: 'teste 01__tutora teste', ini: 'T', cor: '#234D67' },
                { nome: 'Teste 02', tutor: 'Tutora Dois', refKey: 'teste 02__tutora dois', ini: 'T', cor: '#234D67' }];
    // Banco falso: guarda o que foi gravado.
    const gravado = []; const banco = JSON.parse(JSON.stringify(ests));
    const ler = (c) => c.split('/').slice(2).reduce((o, k) => (o == null ? o : o[k]), banco);
    DB = { ref: (c) => ({
      once: () => Promise.resolve({ val: () => (c.indexOf('auaulandia/estadias/') === 0 ? JSON.parse(JSON.stringify(ler(c) || null)) : null) }),
      update: (P) => { gravado.push({ c, P }); return Promise.resolve(); },
      push: (v) => { gravado.push({ c, push: v }); return Promise.resolve(); },
      set: () => Promise.resolve(), transaction: () => Promise.resolve({ committed: true }), on: () => {}, off: () => {} }) };
    // Plantonista: não vê o botão.
    let u = { role: 'plantonista', nome: 'Plantonista Teste' }; sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    renderHosp();
    out.botoesPlantonista = document.querySelectorAll('#hospGrid .ms-btn').length;
    // Recepção (consultora): vê nos dois cartões.
    u = { role: 'consultora', nome: 'Recepção Teste' }; sessionStorage.setItem('zeluz_login', JSON.stringify(u)); aplicarLogin(u);
    renderHosp();
    out.botoes = [...document.querySelectorAll('#hospGrid .ms-btn')].map((x) => x.dataset.ms);
    // Tocar no botão não abre a ficha do plantão.
    let abriuFicha = false; const af = window.abrirPlantao; window.abrirPlantao = function () { abriuFicha = true; };
    document.querySelector('#hospGrid .ms-btn[data-ms="e1"]').click();
    window.abrirPlantao = af;
    out.abriuFicha = abriuFicha;
    const box = document.getElementById('msModal');
    out.aberto = box.classList.contains('on');
    out.txt1 = box.innerText;
    out.faltas1 = [...box.querySelectorAll('.dc-faltas')].map((x) => x.innerText);
    out.mesmaOn = [...box.querySelectorAll('.seg button.on')].map((x) => x.innerText);
    // Copiar a mensagem: o texto aparece.
    [...box.querySelectorAll('button')].find((x) => /Copiar mensagem/.test(x.innerText)).click();
    out.msg = (document.getElementById('msMsg') || {}).innerText || '';
    // Outra hora: escolhe 14:30.
    [...box.querySelectorAll('.seg button')].find((x) => x.innerText === 'Outra hora').click();
    [...box.querySelectorAll('.seg button')].find((x) => x.innerText === '14:30').click();
    // Data que já passou: aviso e Salvar travado.
    [...box.querySelectorAll('.seg button')].find((x) => x.innerText === 'Outra data').click();
    msData(mais(-1));
    out.passou = [...box.querySelectorAll('.dc-faltas')].map((x) => x.innerText).join(' | ');
    out.salvarTravado = [...box.querySelectorAll('button')].find((x) => /Salvar nova saída/.test(x.innerText)).disabled;
    [...box.querySelectorAll('.seg button')].find((x) => /^Amanhã/.test(x.innerText)).click();
    out.horaAinda = [...box.querySelectorAll('.seg button.on')].map((x) => x.innerText);
    await msSalvar();
    await new Promise((ok) => setTimeout(ok, 60));
    out.gravado = gravado;
    out.feito = box.innerText;
    out.estTodas = EST_TODAS.e1.saida;
    [...box.querySelectorAll('button')].find((x) => x.innerText === 'Fechar').click();
    out.fechou = !box.classList.contains('on');
    // Teste 02: sem banho de saída e nada faltando.
    document.querySelector('#hospGrid .ms-btn[data-ms="e2"]').click();
    out.txt2 = box.innerText; out.faltas2 = box.querySelectorAll('.dc-faltas').length;
    msFechar();
    out.hoje = hoje; out.amanha = mais(1);
    out.largura = document.documentElement.scrollWidth;
    return out;
  });
  await prova('a plantonista não vê «Mudar saída»; a recepção vê em cada hóspede com estadia em curso', () => {
    assert.strictEqual(r.botoesPlantonista, 0);
    assert.deepStrictEqual(r.botoes, ['e1', 'e2']);
  });
  await prova('o botão abre o cartão sem abrir a ficha do plantão', () => {
    assert.strictEqual(r.aberto, true); assert.strictEqual(r.abriuFicha, false);
    tem(r.txt1, 'Mudar a saída de Teste 01'); tem(r.txt1, 'Saída combinada:');
    assert.ok(/Fica mais 1 noite/.test(r.txt1), r.txt1);
    assert.ok(r.mesmaOn.some((x) => /^Amanhã/.test(x)) && r.mesmaOn.indexOf('Mesma hora (16:00)') >= 0 && r.mesmaOn.indexOf('Tutor pediu') >= 0, r.mesmaOn.join(','));
    tem(r.txt1, 'BANHO DE SAÍDA · PREMIUM');
  });
  await prova('antes de salvar, o remédio que falta aparece em vermelho e a mensagem sai pronta', () => {
    assert.strictEqual(r.faltas1.length, 1, r.faltas1.join(' | '));
    assert.ok(/Remédio Teste/.test(r.faltas1[0]) && /Avisar a tutora/.test(r.faltas1[0]), r.faltas1[0]);
    assert.ok(/^Olá, Tutora! 💛/.test(r.msg) && /Teste 01 fica com a gente até/.test(r.msg) && /💊 O Remédio Teste/.test(r.msg), r.msg);
  });
  await prova('data que já passou: avisa e não deixa salvar', () => {
    assert.ok(/já passou/.test(r.passou), r.passou); assert.strictEqual(r.salvarTravado, true);
    assert.ok(r.horaAinda.indexOf('14:30') >= 0, 'a hora escolhida continua: ' + r.horaAinda.join(','));
  });
  await prova('Salvar grava num update só da estadia: saída, banho no dia novo às 14:30 e o histórico', () => {
    const up = r.gravado.filter((g) => g.P);
    assert.strictEqual(up.length, 1, JSON.stringify(r.gravado).slice(0, 400));
    assert.strictEqual(up[0].c, 'auaulandia/estadias/e1');
    const P = up[0].P;
    assert.strictEqual(P.saida, r.amanha);
    assert.strictEqual(P['ficha/spa/horario'], '14:30'); assert.strictEqual(P['ficha/spa/horaDia'], r.amanha);
    const k = Object.keys(P).find((x) => x.indexOf('datas_historico/dh') === 0);
    assert.ok(k, Object.keys(P).join(','));
    assert.strictEqual(P[k].registro.por, 'Recepção Teste'); assert.strictEqual(P[k].motivo, 'Tutor pediu');
    assert.strictEqual(r.estTodas, r.amanha);
  });
  await prova('a falta vira pendência com o tutor (Pendências com o tutor)', () => {
    const av = r.gravado.filter((g) => g.push && g.c === 'auaulandia/avisos-racao');
    assert.strictEqual(av.length, 1, JSON.stringify(r.gravado).slice(0, 300));
    assert.strictEqual(av[0].push.itemNome, 'Remédio Teste'); assert.strictEqual(av[0].push.estadiaId, 'e1');
  });
  await prova('a confirmação diz o que mudou e o que falta avisar', () => {
    tem(r.feito, 'Saída mudada'); tem(r.feito, 'Banho de saída:'); tem(r.feito, 'às 14:30 (planilha e TV)');
    tem(r.feito, 'Falta avisar a tutora sobre o Remédio Teste');
    assert.strictEqual(r.fechou, true);
  });
  await prova('hóspede sem banho de saída e com tudo em dia: sem bloco de banho, «nada falta»', () => {
    assert.ok(!/BANHO DE SAÍDA/.test(r.txt2)); tem(r.txt2, 'Comida e remédios: nada falta até'); assert.strictEqual(r.faltas2, 0);
  });
  await prova('cabe no celular e nenhum erro de página', () => {
    assert.ok(r.largura <= 391, 'largura ' + r.largura);
    assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); // prevSecVirar: tela de prevenção sem rede, de antes
  });
  await b.close();
  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
