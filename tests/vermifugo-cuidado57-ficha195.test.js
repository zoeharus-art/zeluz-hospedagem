'use strict';
/*
 * PROVA: a linha do cuidado autorizado pelo tutor também leva a data à ficha (Adriana, 25/nov/2026).
 *
 * «Vermífugo segunda dose, coloquei no agendamento do dia, mas não apareceu na ficha dele, está como devedor.
 *  Precisa ir para a ficha do peludinho o dia que foi dado.»
 *
 * A linha que nasce da resposta do tutor (protocolo cuidado57, «conferir orientação») esperava a monitora abrir
 * «Conferir cuidado»; na tela da Gestão ela ficava em «conferindo cuidado…» e a ficha nunca recebia a data. Agora:
 *   1. ela entra na regra de toda linha do dia (dashPrevFicha): com o check-in, a ficha recebe a data do lançamento;
 *   2. a 2ª dose cai em «2ª dose dada em» (verm_dose2_t), com o nome do produto;
 *   3. ela não mostra mais o «conferindo cuidado…»;
 *   4. a lista da monitora não mostra o cuidado que a ficha já recebeu no dia;
 *   5. a linha antiga do vencimento não fica presa em «conferindo cuidado…» quando o banco troca o objeto do registro.
 * App real no Chromium, sem rede; o banco é de mentira. Dados inventados.
 * Uso:  node tests/vermifugo-cuidado57-ficha195.test.js
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const APP = path.join(__dirname, '..', 'auaulandia', 'index.html');
let ok = 0; const falhas = [];
async function prova(nome, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + nome); }
  catch (e) { falhas.push(nome + ' — ' + e.message); console.log('  ✗ ' + nome + '\n      ' + e.message); }
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e.message || e)));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file:///' + APP.replace(/\\/g, '/'));
  await p.waitForTimeout(700);
  const r = await p.evaluate(async () => {
    const out = {};
    const pet = { n: 'Teste 01', tutor: 'Tutora Teste', raca: 'SRD' };
    PELUDINHOS = [pet];
    const dc = dcKey(pet.n, pet.tutor), pk = pelKey(pet), dia = dashDia();
    const ontem = orcMaisDias(dia, -26);
    pelCadCache[pk] = { verm_doses: '2 doses', verm_t: ontem, verm_dose2_t: '', verm_2a: orcMaisDias(ontem, 21), verm_p: orcMaisDias(ontem, 141) };
    const linha57 = (estado) => ({ chave: dc, quem: 'Gestão Teste', valor: 'Teste 01/SRD (CONFERIR ORIENTAÇÃO)',
      det: { cuidado57_estado: estado, nome: 'PRODUTO TESTE', qtd: 'MEIO COMPRIMIDO' },
      origemVencimento: { protocolo: 'cuidado57', chave: dc, diaOrigem: dia, itemK: 'verm_dose2_p', tipo: 'verm2', linhaId: 'r57_t1', origemResposta: 'bolsa' } });
    // 1) quem entra na regra do lançamento
    out.eleg57 = dashPrevFichaElegivel('vermifugo', linha57('conferir-orientacao'));
    out.elegFeito = dashPrevFichaElegivel('vermifugo', linha57('realizado-conferido'));
    out.elegZ178 = dashPrevFichaElegivel('vermifugo', Object.assign(linha57('conferir-orientacao'), { z178: { estado: 'plano' } }));
    out.elegAntiga = dashPrevFichaElegivel('vermifugo', { chave: dc, origemVencimento: { chave: dc, diaOrigem: dia, tipo: 'verm' } });
    out.elegMao = dashPrevFichaElegivel('vermifugo', { chave: dc, quem: 'X', det: {} });
    // 2) a conta da 2ª dose
    const calc = dashPrevFichaPatch('vermifugo', pelExtra(pet), dia, 'Gestão Teste', linha57('conferir-orientacao').det);
    out.calc = { itemK: calc.itemK, dose2: calc.patch && calc.patch.verm_dose2_t, nome: calc.patch && calc.patch.verm_nome, erro: calc.erro || '' };
    // 3) a linha não mostra mais «conferindo cuidado…»
    DASH_DADOS = { vermifugo: { r57_t1: linha57('conferir-orientacao') } };
    DASH_DADOS_DE = { obj: DASH_DADOS, dia: dia, ok: true, em: Date.now() };
    try { out.cuidado36 = dashCuidado36LinhaHTML('vermifugo', 'r57_t1', DASH_DADOS.vermifugo.r57_t1); } catch (e) { out.cuidado36 = 'erro: ' + e.message; }
    // 4) de ponta a ponta: com o check-in, a ficha recebe a data (banco de mentira; a gravação da ficha é capturada)
    const gravado = []; const marcas = {};
    const val = (c, dados) => c.split('/').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), dados);
    const dados = { daycare: { 'checkin-corpo': { [dia]: { [dc]: { tipo: 'entrada', hora: '09:00', quem: 'Teste', nome: 'Teste 01', fim: Date.now() } } } } };
    const ref = (c) => ({ once: () => Promise.resolve({ val: () => (c.indexOf('daycare/prev-ficha/') === 0 ? (val(c.replace('daycare/prev-ficha/' + dia, 'x'), { x: marcas }) || null) : val(c, dados)), exists: () => true, forEach() {} }),
      transaction: (fn) => { const atual = val(c.replace('daycare/prev-ficha/' + dia + '/', ''), marcas); const novo = fn(atual); if (novo === undefined) return Promise.resolve({ committed: false }); const ks = c.replace('daycare/prev-ficha/' + dia + '/', '').split('/'); marcas[ks[0]] = marcas[ks[0]] || {}; marcas[ks[0]][ks[1]] = novo; return Promise.resolve({ committed: true }); },
      update: (u) => { const ks = c.replace('daycare/prev-ficha/' + dia + '/', '').split('/'); Object.assign(marcas[ks[0]][ks[1]], u); return Promise.resolve(); },
      remove: () => Promise.resolve(), on() { return () => {}; }, off() {}, child: (k) => ref(c + '/' + k) });
    const db0 = DB, pg0 = prevGravar, ce0 = canEditPel;
    DB = { ref };
    prevGravar = function (pp, patch) { gravado.push(patch); Object.assign(pelCadCache[pelKey(pp)], patch); return Promise.resolve({ ok: true }); };
    canEditPel = function () { return true; };
    DASH_PREV_FICHA.dia = ''; DASH_PREV_FICHA.quando = 0; DASH_PREV_FICHA.lendo = false;
    try { await dashPrevFichaConciliar(); } catch (e) { out.erroConciliar = String(e && e.message || e); }
    out.gravado = gravado.map((g) => ({ dose2: g.verm_dose2_t, por: g.verm_dose2_por, lanc: !!g.verm_dose2_p_lanc }));
    out.marca = (marcas.vermifugo || {}).r57_t1 ? marcas.vermifugo.r57_t1.estado : '';
    out.linhaEstado = dashPrevFichaLinhaHTML('vermifugo', 'r57_t1', DASH_DADOS.vermifugo.r57_t1).replace(/<[^>]+>/g, '').trim();
    // 5) a lista da monitora: com a data de hoje na ficha, o cuidado sai
    const jnf = (typeof dashPrevFicha57JaNaFicha === 'function') ? dashPrevFicha57JaNaFicha : () => null;
    out.jaNaFicha = jnf(DASH_DADOS.vermifugo.r57_t1, pet, dia);
    out.jaNaFichaOntem = jnf(DASH_DADOS.vermifugo.r57_t1, pet, orcMaisDias(dia, -1));
    DB = db0; prevGravar = pg0; canEditPel = ce0;
    // 6) a linha antiga do vencimento: o banco troca o objeto (mesmo conteúdo) no meio da leitura e ela não fica presa
    const antiga = { chave: dc, valor: 'Teste 01/SRD', origemVencimento: { chave: dc, diaOrigem: dia, tipo: 'verm' } };
    DASH_DADOS = { vermifugo: { v1: antiga } };
    DASH_DADOS_DE = { obj: DASH_DADOS, dia: dia, ok: true, em: Date.now() };
    DASH_CUIDADO36_LINHAS = { dia: '', por: {}, ver: 0 };
    let soltar; const espera = new Promise((ok) => { soltar = ok; });
    const ref2 = (c) => ({ once: () => espera.then(() => ({ val: () => null, exists: () => false, forEach() {} })), on() { return () => {}; }, off() {}, child: (k) => ref2(c + '/' + k),
      orderByKey() { return this; }, orderByChild() { return this; }, startAt() { return this; }, endAt() { return this; }, equalTo() { return this; }, limitToLast() { return this; } });
    DB = { ref: ref2 };
    out.antes = dashCuidado36LinhaHTML('vermifugo', 'v1', antiga).replace(/<[^>]+>/g, '').trim();
    DASH_DADOS.vermifugo.v1 = JSON.parse(JSON.stringify(antiga));   // a releitura do banco: objeto novo, mesmo conteúdo
    soltar();
    await new Promise((ok) => setTimeout(ok, 300));
    out.depois = dashCuidado36LinhaHTML('vermifugo', 'v1', DASH_DADOS.vermifugo.v1).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    DB = db0;
    return out;
  });
  await b.close();

  console.log('Vermífugo do cuidado autorizado chega à ficha');
  await prova('a linha do cuidado autorizado («conferir orientação») entra na regra do lançamento', () => assert.strictEqual(r.eleg57, true));
  await prova('a linha já conferida, a do plano da Zelozinha e a antiga do vencimento continuam de fora', () => {
    assert.strictEqual(r.elegFeito, false); assert.strictEqual(r.elegZ178, false); assert.strictEqual(r.elegAntiga, false);
  });
  await prova('a linha lançada à mão continua na regra', () => assert.strictEqual(r.elegMao, true));
  await prova('a 2ª dose vai para «2ª dose dada em», com o nome do produto', () => {
    assert.strictEqual(r.calc.erro, ''); assert.strictEqual(r.calc.itemK, 'verm_dose2_p');
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.calc.dose2), JSON.stringify(r.calc)); assert.ok(/produto teste/i.test(r.calc.nome || ''), JSON.stringify(r.calc));
  });
  await prova('a linha não mostra mais «conferindo cuidado…»', () => assert.strictEqual(r.cuidado36, ''));
  await prova('com o check-in do dia, a ficha recebe a data do lançamento e quem deu', () => {
    assert.ok(!r.erroConciliar, r.erroConciliar);
    assert.strictEqual(r.gravado.length, 1, JSON.stringify(r.gravado));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.gravado[0].dose2)); assert.strictEqual(r.gravado[0].por, 'Gestão Teste'); assert.strictEqual(r.gravado[0].lanc, true);
    assert.strictEqual(r.marca, 'aplicado');
  });
  await prova('a linha diz «Ficha atualizada»', () => assert.ok(/^Ficha atualizada/.test(r.linhaEstado), r.linhaEstado));
  await prova('com a data de hoje na ficha, o cuidado sai da lista da monitora (só a do mesmo dia conta)', () => {
    assert.strictEqual(r.jaNaFicha, true); assert.strictEqual(r.jaNaFichaOntem, false);
  });
  await prova('a linha antiga do vencimento não fica presa em «conferindo cuidado…» quando o banco troca o objeto', () => {
    assert.ok(/conferindo cuidado/.test(r.antes), r.antes);
    assert.ok(!/conferindo cuidado/.test(r.depois), r.depois);
    assert.ok(/Conferir cuidado/.test(r.depois), r.depois);
  });
  await prova('nenhum erro de página', () => { assert.deepStrictEqual(erros.filter((x) => !/prevSecVirar/.test(x)), []); });

  console.log('\n' + ok + ' provas passaram' + (falhas.length ? ', ' + falhas.length + ' falharam' : ''));
  process.exit(falhas.length ? 1 : 0);
})();
