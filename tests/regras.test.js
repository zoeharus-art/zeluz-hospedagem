'use strict';
/*
 * Teste das regras v2 do Realtime Database — contra o EMULADOR, nunca contra produção.
 *
 * O que prova (as 4 provas originais da Etapa 4 da auditoria de 28/ago/2026, seção 6, mais as
 * provas acrescentadas em 29/ago/2026 quando o teste rodou pela primeira vez — decisão da
 * Adriana sobre histórico intocável × plano editável, e a ressalva da seção 1.3):
 *   1. Anônimo NÃO apaga uma entrada já existente de daycare/auditoria — nem uma entrada
 *      isolada, nem o dia inteiro (achado D).
 *   2. Anônimo GRAVA uma dose válida em auaulandia/medicacao-log.
 *   3. Anônimo NÃO grava uma dose com tipo errado (ts como texto em vez de número).
 *   4. A escrita na raiz continua negada.
 *   5. HISTÓRICO intocável (decisão da Adriana, 29/ago): auaulandia/medicacao-log NÃO se apaga
 *      em nenhum nível — dose isolada, FILHOt inteiro no dia, ou o dia inteiro.
 *   6. PLANO ATUAL editável (decisão da Adriana, 29/ago): auaulandia/medicacao-agenda/{key}/itens/{id}
 *      continua podendo ser removido pela Vet/Gestão (magRemoverItem) — e daycare/config/monitores
 *      não fica vazio (não apaga, exige nome+senha+role em cada posição).
 *   7. Ressalva da seção 1.3 (set(null) em medicacao-agenda/{key}/itens numa ficha cujo único
 *      campo era "itens") — testada explicitamente e RESOLVIDA (ver database.rules.v2.json,
 *      nó auaulandia/medicacao-agenda/$key/itens, e a seção 1.3 do 05-regras-v2.md).
 *
 * Por que @firebase/rules-unit-testing: é o pacote OFICIAL do Firebase para testar regra de
 * segurança contra o emulador, sem precisar de login de verdade nem de projeto de verdade.
 * Documentação: https://firebase.google.com/docs/rules/unit-tests
 *
 * COMO RODAR (testado e funcionando em 29/ago/2026 — ver docs/auditoria-28ago2026/05-regras-v2.md,
 * seção 3, "Como testar", para o comando exato usado e o motivo de cada parte dele):
 *
 *   export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot"
 *   export PATH="$JAVA_HOME/bin:$PATH"
 *   export NODE_PATH="<pasta-com-node_modules-de-@firebase/rules-unit-testing>"
 *   # 1) aponte firebase.json temporariamente para database.rules.v2.json (nunca publique assim)
 *   npx --yes firebase-tools emulators:exec --only database --project hospedagem-zeluz \
 *     "node tests/regras.test.js"
 *   # 2) devolva firebase.json ao original (database.rules.json) depois do teste
 *
 * Sai 0 se todas as provas passam, 1 se alguma falhar — mesmo padrão do tests/harness.js.
 */

const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, '..', 'database.rules.v2.json');
const PROJECT_ID = 'hospedagem-zeluz-regras-teste'; // qualquer nome — o emulador não usa o projeto de verdade

async function main() {
  let rulesUnitTesting;
  try {
    rulesUnitTesting = require('@firebase/rules-unit-testing');
  } catch (e) {
    console.error('Falta instalar o pacote de teste. Rode primeiro:');
    console.error('  npm install --no-save firebase-tools @firebase/rules-unit-testing');
    process.exit(1);
  }
  const { initializeTestEnvironment, assertSucceeds, assertFails } = rulesUnitTesting;

  const rules = fs.readFileSync(RULES_PATH, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      rules,
      // A porta padrão do emulador do Realtime Database é 9000; ajuste se o seu firebase.json
      // (ou firebase emulators:start) usar outra.
      host: '127.0.0.1',
      port: 9000,
    },
  });

  let falhas = 0;
  const ok = (nome) => console.log('OK   -', nome);
  const falhou = (nome, e) => { falhas++; console.error('FALHOU -', nome, '-', (e && e.message) || e); };

  try {
    // Contexto "anônimo autenticado" — mesma coisa que signInAnonymously() no app real: tem
    // auth != null, mas sem nenhum claim de papel. authId pode ser qualquer string; o que
    // importa para as regras é só a existência do token (auth != null).
    const anon = testEnv.authenticatedContext('usuario-anonimo-de-teste');
    const db = anon.database();

    // ---------------------------------------------------------------- prova 1
    // Preparar o estado SEM passar pelas regras (bypass de admin), como a doc recomenda.
    const dia = '2026-08-29';
    const entryId = 'entrada-existente-de-teste';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`daycare/auditoria/${dia}/${entryId}`)
        .set({ ts: Date.now(), quem: 'Teste', role: 'gestao', acao: 'setup', detalhe: '' });
    });
    try {
      await assertFails(db.ref(`daycare/auditoria/${dia}/${entryId}`).remove());
      ok('anônimo NÃO apaga uma entrada já existente de daycare/auditoria');
    } catch (e) { falhou('anônimo NÃO apaga uma entrada já existente de daycare/auditoria', e); }

    // Também prova que CRIAR uma entrada nova (push-like: chave inédita) continua permitido —
    // é o que audit() faz o tempo todo no app real. Sem isso, a v2 travaria a auditoria inteira.
    try {
      await assertSucceeds(db.ref(`daycare/auditoria/${dia}/entrada-nova-de-teste`)
        .set({ ts: Date.now(), quem: 'Teste', role: 'plantonista', acao: 'checkin', detalhe: 'ok' }));
      ok('anônimo CRIA uma entrada nova em daycare/auditoria (nunca existiu antes)');
    } catch (e) { falhou('anônimo CRIA uma entrada nova em daycare/auditoria', e); }

    // Prova irmã (auditoria): apagar o DIA INTEIRO do diário também tem que falhar — não só
    // uma entrada isolada. É o achado D original (DELETE .../2026-08-28.json apagava tudo).
    try {
      await assertFails(db.ref(`daycare/auditoria/${dia}`).remove());
      ok('anônimo NÃO apaga o dia inteiro de daycare/auditoria (achado D)');
    } catch (e) { falhou('anônimo NÃO apaga o dia inteiro de daycare/auditoria', e); }

    // ---------------------------------------------------------------- prova 2
    const doseValida = { nome: 'Betaína', u: 'comprimido', q: '1', ts: Date.now(), quem: 'Amanda', horario: '08:00' };
    try {
      await assertSucceeds(db.ref(`auaulandia/medicacao-log/${dia}/dolly/08-00`).set(doseValida));
      ok('anônimo GRAVA uma dose válida em auaulandia/medicacao-log');
    } catch (e) { falhou('anônimo GRAVA uma dose válida em auaulandia/medicacao-log', e); }

    // ---------------------------------------------------------------- prova 3
    const doseTipoErrado = { nome: 'Betaína', u: 'comprimido', q: '1', ts: 'agora mesmo', quem: 'Amanda', horario: '08:00' };
    try {
      await assertFails(db.ref(`auaulandia/medicacao-log/${dia}/dolly/09-00`).set(doseTipoErrado));
      ok('anônimo NÃO grava dose com "ts" como texto (tipo errado)');
    } catch (e) { falhou('anônimo NÃO grava dose com "ts" como texto (tipo errado)', e); }

    // Prova irmã: apagar uma dose já dada também tem que falhar (achado P do relatório).
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`auaulandia/medicacao-log/${dia}/dolly/10-00`).set(doseValida);
    });
    try {
      await assertFails(db.ref(`auaulandia/medicacao-log/${dia}/dolly/10-00`).remove());
      ok('anônimo NÃO apaga uma dose já registrada em auaulandia/medicacao-log');
    } catch (e) { falhou('anônimo NÃO apaga uma dose já registrada em auaulandia/medicacao-log', e); }

    // Decisão da Adriana (29/ago/2026): o HISTÓRICO de medicação é intocável em QUALQUER
    // nível — não só a dose isolada. Provar também o nível do FILHOt ($key) e o nível do
    // DIA ($dia) inteiro dentro do log — as duas formas "num comando só" de apagar prova.
    try {
      await assertFails(db.ref(`auaulandia/medicacao-log/${dia}/dolly`).remove());
      ok('anônimo NÃO apaga o histórico de um FILHOt inteiro em auaulandia/medicacao-log (histórico intocável)');
    } catch (e) { falhou('anônimo NÃO apaga o histórico de um FILHOt inteiro em auaulandia/medicacao-log', e); }

    try {
      await assertFails(db.ref(`auaulandia/medicacao-log/${dia}`).remove());
      ok('anônimo NÃO apaga o dia inteiro de auaulandia/medicacao-log (histórico intocável)');
    } catch (e) { falhou('anônimo NÃO apaga o dia inteiro de auaulandia/medicacao-log', e); }

    // Prova irmã 2: remover um item da AGENDA (não do log) continua permitido — é o recurso
    // deliberado magRemoverItem() (seção 1.3 do 05-regras-v2.md). Se isto falhar, a v2 quebrou
    // um recurso que a Vet/Gestão usa todo dia.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref('auaulandia/medicacao-agenda/dolly/itens/item1')
        .set({ nome: 'Betaína', q: '1', u: 'comprimido', horarios: ['08:00'] });
    });
    try {
      await assertSucceeds(db.ref('auaulandia/medicacao-agenda/dolly/itens/item1').remove());
      ok('anônimo CONTINUA removendo um item da agenda de medicação (magRemoverItem)');
    } catch (e) { falhou('anônimo CONTINUA removendo um item da agenda de medicação', e); }

    // ------------------------------------------------- prova da ressalva (seção 1.3 do 05-regras-v2.md)
    // A ressalva registrada no documento: "se esse set(null) acontecer numa ficha RECÉM-CRIADA,
    // cujo primeiro e único campo gravado até ali fosse justamente 'itens', o $key ficaria vazio
    // e a v2 bloquearia a gravação". O documento não achou esse fluxo no código, mas também não
    // provou que é impossível — registrou como "testar antes de publicar". Este é esse teste.
    //
    // Ficha "vazia": só tem 'itens' (nenhum nome/tutor/_ts — os campos que o app grava junto
    // sempre que HÁ medicação). É exatamente o estado que a ressalva descreve.
    const fichaVaziaKey = 'ficha-so-com-itens-de-teste';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`auaulandia/medicacao-agenda/${fichaVaziaKey}`)
        .set({ itens: { item1: { nome: 'Betaína', q: '1', u: 'comprimido', horarios: ['08:00'] } } });
    });
    try {
      // Mesmo comando que a Conferência do check-in faz (linha ~23803 do auaulandia/index.html)
      // quando o tutor confirma "sem medicação": DB.ref(.../itens).set(null).
      await assertSucceeds(db.ref(`auaulandia/medicacao-agenda/${fichaVaziaKey}/itens`).set(null));
      ok('anônimo LIMPA a agenda (itens=null) numa ficha cujo único campo era "itens" (ressalva 1.3 — RESOLVIDA)');
    } catch (e) { falhou('anônimo LIMPA a agenda (itens=null) numa ficha só com "itens" (ressalva 1.3)', e); }

    // Controle da ressalva: o conserto de cima NÃO pode reabrir o buraco original — apagar a
    // FICHA INTEIRA ($key) com um comando direto continua proibido, mesmo numa ficha completa
    // (com nome/tutor/itens, como toda ficha criada pelo fluxo normal do app).
    const fichaCompletaKey = 'ficha-completa-de-teste';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`auaulandia/medicacao-agenda/${fichaCompletaKey}`).set({
        nome: 'Dolly', tutor: 'Teste', _ts: Date.now(), _quem: 'Teste',
        itens: { item1: { nome: 'Betaína', q: '1', u: 'comprimido', horarios: ['08:00'] } },
      });
    });
    try {
      await assertFails(db.ref(`auaulandia/medicacao-agenda/${fichaCompletaKey}`).remove());
      ok('anônimo CONTINUA sem apagar a ficha de medicação inteira ($key) com um comando direto');
    } catch (e) { falhou('anônimo CONTINUA sem apagar a ficha de medicação inteira ($key)', e); }

    // ---------------------------------------------------------------- prova 4
    try {
      await assertFails(db.ref('/').set({ hackeado: true }));
      ok('escrita na raiz continua negada');
    } catch (e) { falhou('escrita na raiz continua negada', e); }

    // ---------------------------------------------------------------- prova extra (config)
    try {
      await assertFails(db.ref('daycare/config/monitores').set(null));
      ok('anônimo NÃO apaga daycare/config/monitores');
    } catch (e) { falhou('anônimo NÃO apaga daycare/config/monitores', e); }

    try {
      await assertFails(db.ref('daycare/config/monitores').set([{ nome: 'X', role: 'monitor' }])); // sem "senha"
      ok('anônimo NÃO grava monitor sem senha (formato incompleto)');
    } catch (e) { falhou('anônimo NÃO grava monitor sem senha', e); }

    try {
      await assertSucceeds(db.ref('daycare/config/monitores')
        .set([{ id: 'p1', nome: 'Amanda', role: 'monitor', senha: '1234', entrada: '', saida: '' }]));
      ok('anônimo GRAVA daycare/config/monitores no formato certo (o app precisa disto)');
    } catch (e) { falhou('anônimo GRAVA daycare/config/monitores no formato certo', e); }

    // ---------------------------------------------------------------- prova extra (med-dia / conferir-medicacao)
    // Seção 1.4 do 05-regras-v2.md: o DIA inteiro não pode mais ser apagado com um comando,
    // mas o ITEM de cada FILHOt dentro do dia continua podendo virar null — é assim que o app
    // "limpa" o item quando não há mais dose a registrar (linha ~17516 do auaulandia/index.html).
    const dcDia = 'dc-2026-08-29';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`daycare/med-dia/${dcDia}/dolly`).set({ nome: 'Betaína', hora: '08:00' });
    });
    try {
      await assertFails(db.ref(`daycare/med-dia/${dcDia}`).remove());
      ok('anônimo NÃO apaga o dia inteiro de daycare/med-dia');
    } catch (e) { falhou('anônimo NÃO apaga o dia inteiro de daycare/med-dia', e); }

    try {
      await assertSucceeds(db.ref(`daycare/med-dia/${dcDia}/dolly`).set(null));
      ok('anônimo CONTINUA zerando o item de um FILHOt em daycare/med-dia (limpeza legítima do app)');
    } catch (e) { falhou('anônimo CONTINUA zerando o item de um FILHOt em daycare/med-dia', e); }

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.database().ref(`daycare/conferir-medicacao/${dcDia}/dolly`).set({ divergencia: true });
    });
    try {
      await assertFails(db.ref(`daycare/conferir-medicacao/${dcDia}`).remove());
      ok('anônimo NÃO apaga o dia inteiro de daycare/conferir-medicacao');
    } catch (e) { falhou('anônimo NÃO apaga o dia inteiro de daycare/conferir-medicacao', e); }
  } finally {
    await testEnv.cleanup();
  }

  console.log('');
  if (falhas) {
    console.error(falhas + ' prova(s) falharam.');
    process.exit(1);
  }
  console.log('Todas as provas passaram.');
}

main().catch((e) => { console.error('ERRO ao rodar o teste:', e); process.exit(1); });
