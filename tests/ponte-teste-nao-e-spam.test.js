'use strict';
/*
 * Teste unitário: a "Ponte de testes" do Telegram (integracao-telegram/Codigo.gs) NÃO PODE
 * mandar mensagem para os grupos sozinha — nem por um GET comum na URL /exec, nem por um
 * acionador (trigger) chamando doGet sem parâmetro nenhum, nem por reenvio.
 *
 * Motivo (Adriana, 04/set/2026): a mensagem "Ponte de testes: está tudo funcionando..."
 * estava chegando "o tempo inteiro, em todos os grupos". Causa: doGet() mandava a mensagem
 * de teste para TODOS os grupos configurados em TODA chamada — e um GET em /exec não pede
 * senha nenhuma (é assim que o Apps Script publica um "site"). Qualquer crawler, monitor de
 * uptime, prévia de link de WhatsApp/Telegram, ou simplesmente alguém abrindo o link salvo,
 * disparava o spam. Ver o comentário de doGet() em integracao-telegram/Codigo.gs.
 *
 * Este teste carrega o Codigo.gs de VERDADE (o arquivo publicado é este mesmo arquivo, sem
 * cópia) numa sandbox `vm` do Node, com duplos de mentira para os serviços do Apps Script.
 * Nada toca o Firebase, o Telegram ou o Google.
 *
 * O que se prova:
 *   1. Um GET comum em doGet() (sem parâmetro, como um acionador de tempo chamaria, ou como
 *      um navegador/crawler faria abrindo a URL pura) NÃO manda nenhuma mensagem — zero
 *      chamadas ao Telegram.
 *   2. doGet() com ?listar=1 continua funcionando (não manda nada — só lista).
 *   3. testarTodosOsGrupos() SEM a propriedade MODO_TESTE ligada NÃO manda nada — mesmo
 *      chamada diretamente, como um acionador mal configurado tentaria.
 *   4. testarTodosOsGrupos() COM MODO_TESTE=sim manda a mensagem de teste — mas só UMA VEZ
 *      por grupo, e só quando alguém rodou essa função explicitamente.
 *
 * Uso:  node tests/ponte-teste-nao-e-spam.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ARQUIVO = 'integracao-telegram/Codigo.gs';

/** Duplo mínimo dos serviços do Apps Script, com UrlFetchApp gravando cada chamada feita. */
function montarSandbox(propriedades) {
  const chamadasTelegram = []; // toda vez que algo tentaria falar com a API do Telegram, cai aqui
  const logs = [];
  const props = Object.assign({}, propriedades);
  const sandbox = {
    logs,
    chamadasTelegram,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(chave) {
            return Object.prototype.hasOwnProperty.call(props, chave) ? props[chave] : null;
          }
        };
      }
    },
    Logger: { log(msg) { logs.push(String(msg)); } },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput(texto) {
        return { _texto: texto, setMimeType() { return this; }, getContent() { return this._texto; } };
      }
    },
    // Grava toda chamada — é a PROVA de "nada foi enviado" quando o array fica vazio.
    UrlFetchApp: {
      fetch(url, opcoes) {
        chamadasTelegram.push({ url, opcoes });
        return {
          getResponseCode() { return 200; },
          getContentText() { return JSON.stringify({ ok: true, result: [] }); }
        };
      }
    },
    Utilities: {
      formatDate() { return ''; },
      newBlob() { return {}; },
      base64Decode() { return []; }
    },
    console
  };
  vm.createContext(sandbox);
  return sandbox;
}

function carregarPonte(propriedades) {
  const caminho = path.join(RAIZ, ARQUIVO);
  const codigo = fs.readFileSync(caminho, 'utf8');
  const sandbox = montarSandbox(propriedades);
  vm.runInContext(codigo, sandbox, { filename: ARQUIVO });
  return sandbox;
}

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('doGet() sem parâmetro nenhum (GET puro / acionador chamando sem evento) NÃO manda nada', () => {
  const sandbox = carregarPonte({});
  const resposta = sandbox.doGet(); // como um acionador de tempo chamaria: sem `e`
  const corpo = JSON.parse(resposta.getContent());
  assert.strictEqual(sandbox.chamadasTelegram.length, 0,
    'doGet() não pode falar com o Telegram — zero chamadas esperadas, achei ' + sandbox.chamadasTelegram.length);
  assert.strictEqual(corpo.ok, true, 'doGet() ainda relata que a ponte está no ar');
  assert.ok(!('AINDA NAO CONFIGURADO' in {}), 'sanity'); // no-op, mantém padrão de asserts
});

teste('doGet() chamado como um navegador chamaria (evento vazio {}) NÃO manda nada', () => {
  const sandbox = carregarPonte({});
  const resposta = sandbox.doGet({});
  const corpo = JSON.parse(resposta.getContent());
  assert.strictEqual(sandbox.chamadasTelegram.length, 0, 'evento vazio também não pode disparar envio');
  assert.strictEqual(corpo.ok, true);
});

teste('doGet() chamado repetidamente (simulando crawler/monitor de uptime batendo várias vezes) NUNCA manda nada', () => {
  const sandbox = carregarPonte({});
  for (let i = 0; i < 20; i++) sandbox.doGet();
  assert.strictEqual(sandbox.chamadasTelegram.length, 0,
    '20 GETs seguidos não podem gerar nenhum envio — antes da correção, geravam 20× o total de grupos');
});

teste('doGet(?listar=1) continua funcionando e continua sem mandar nada', () => {
  const sandbox = carregarPonte({});
  const resposta = sandbox.doGet({ parameter: { listar: '1' } });
  const corpo = JSON.parse(resposta.getContent());
  // _listarGrupos chama getUpdates (uma leitura), nunca sendMessage/sendPhoto/sendDocument.
  const chamouEnvio = sandbox.chamadasTelegram.some((c) => /send(Message|Photo|Document)/.test(c.url));
  assert.strictEqual(chamouEnvio, false, '?listar=1 não pode disparar envio nenhum');
  assert.strictEqual(corpo.ok, true);
});

teste('testarTodosOsGrupos() SEM MODO_TESTE ligado recusa e não manda nada', () => {
  const sandbox = carregarPonte({}); // MODO_TESTE ausente
  const r = sandbox.testarTodosOsGrupos();
  assert.strictEqual(r.ok, false, 'sem a propriedade, a função tem de recusar');
  assert.strictEqual(sandbox.chamadasTelegram.length, 0, 'nenhum envio pode acontecer sem MODO_TESTE=sim');
  assert.ok(sandbox.logs.some((l) => /MODO_TESTE não está ligado/.test(l)),
    'o log tem de dizer por que recusou — silêncio não pode ter dois significados');
});

teste('testarTodosOsGrupos() com MODO_TESTE="nao" (qualquer valor que não seja "sim") também recusa', () => {
  const sandbox = carregarPonte({ MODO_TESTE: 'nao' });
  const r = sandbox.testarTodosOsGrupos();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(sandbox.chamadasTelegram.length, 0);
});

teste('testarTodosOsGrupos() com MODO_TESTE="sim" manda a mensagem — UMA VEZ por grupo configurado', () => {
  const sandbox = carregarPonte({ MODO_TESTE: 'sim' });
  const r = sandbox.testarTodosOsGrupos();
  assert.strictEqual(r.ok, true);
  const gruposConfigurados = Object.keys(sandbox.GRUPOS).filter(
    (n) => String(sandbox.GRUPOS[n]).indexOf('COLE_AQUI') !== 0
  );
  const enviosDeTexto = sandbox.chamadasTelegram.filter((c) => /sendMessage/.test(c.url));
  assert.strictEqual(enviosDeTexto.length, gruposConfigurados.length,
    'com MODO_TESTE=sim, tem de mandar exatamente 1 mensagem por grupo configurado (' +
    gruposConfigurados.length + '), não ' + enviosDeTexto.length);
  enviosDeTexto.forEach((c) => {
    assert.ok(/Ponte de testes/.test(decodeURIComponent(String(c.opcoes.payload.text || ''))),
      'cada envio tem de ser a mensagem de teste, não outra coisa');
  });
});

teste('nenhum acionador (trigger) está instalado apontando para a função de teste — busca por ScriptApp.newTrigger no arquivo', () => {
  const codigo = fs.readFileSync(path.join(RAIZ, ARQUIVO), 'utf8');
  // O arquivo não pode conter código que auto-instale um trigger para testarTodosOsGrupos
  // ou para doGet — instalar trigger é sempre ação manual da Adriana no editor do Apps Script.
  const trechoSuspeito = /newTrigger\(\s*['"](testarTodosOsGrupos|doGet)['"]/;
  assert.ok(!trechoSuspeito.test(codigo),
    'o código não pode se autoinstalar como acionador da função de teste ou do doGet');
});

// ------------------------------------------------------------------ execução
(async () => {
  let passou = 0, falhou = 0;
  for (const t of testes) {
    try {
      await t.fn();
      console.log('  ok   ' + t.nome);
      passou++;
    } catch (e) {
      console.log('  FALHA ' + t.nome + '\n         ' + e.message);
      falhou++;
    }
  }
  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou ? 1 : 0);
})();
