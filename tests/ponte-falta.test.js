'use strict';
/*
 * Teste da retaguarda da falta das 12h — `vigiaFalta12h()` em
 * integracao-telegram/Codigo.gs (LOTE A, 30/ago/2026).
 *
 * NÃO toca no Firebase, no Telegram nem no Google. O Codigo.gs publicado é carregado de
 * verdade (este arquivo, sem cópia) dentro de uma sandbox `vm` do Node, com duplos de
 * mentira para os serviços do Apps Script (PropertiesService, Logger, UrlFetchApp,
 * Utilities, ContentService, SpreadsheetApp). O relógio também é de mentira: quem decide
 * a hora é `Utilities.formatDate`, então basta ensiná-lo a responder o que o teste quiser.
 *
 * O que se prova:
 *
 *   1. JANELA — só age entre 12h15 e 13h15. Antes e depois, nem token pede.
 *   2. DIA — sábado e domingo não cobram nada (não há Day Care).
 *   3. SILÊNCIO QUANDO FECHOU — se daycare/falta-automatica/<dia> existe, alguém fechou
 *      o dia: a ponte não fala.
 *   4. COBRANÇA QUANDO NÃO FECHOU — sem a trava do fechamento, manda UMA mensagem, e ela
 *      vai para o grupo da Gestão.
 *   5. NÃO MARCA NINGUÉM — a ponte nunca escreve em daycare/chamada nem em
 *      daycare/falta-automatica. Cobrar é o limite dela; marcar é decisão da casa.
 *   6. UMA VEZ POR DIA — com daycare/cobranca-falta/<dia> já gravado, silêncio.
 *   7. TRAVA DEPOIS DO ENVIO — se o Telegram falhar, a trava NÃO é gravada (para tentar
 *      de novo daqui a 15 minutos, ainda dentro da janela).
 *
 * Uso:  node tests/ponte-falta.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const PONTE = 'integracao-telegram/Codigo.gs';
const GRUPO_GESTAO = '-5388577278';   // Zêluz - Plantão AuAulândia

// ------------------------------------------------------------------ a sandbox do Apps Script
/**
 * Duplo mínimo dos serviços usados no caminho de `vigiaFalta12h`.
 * `opcoes.agora` é o relógio ('2026-08-27T12:20:00' etc.), `opcoes.banco` é o que cada
 * caminho do Firebase responde, e `opcoes.telegramOk` diz se o envio deu certo.
 */
function montarSandbox(opcoes) {
  const o = opcoes || {};
  const quando = new Date(o.agora || '2026-08-27T12:20:00');
  const banco = o.banco || {};
  const telegramOk = (o.telegramOk === undefined) ? true : o.telegramOk;

  const logs = [];
  const pedidos = [];   // tudo que a ponte tentou fazer pela rede

  const sandbox = {
    logs,
    pedidos,
    PropertiesService: {
      getScriptProperties() {
        return { getProperty() { return null; } };   // sem App Check e sem senha: não é o assunto aqui
      }
    },
    Logger: { log(msg) { logs.push(String(msg)); } },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput(texto) {
        return { _texto: texto, setMimeType() { return this; }, getContent() { return this._texto; } };
      }
    },
    SpreadsheetApp: {
      getActiveSpreadsheet() { return { getSheetByName() { return null; }, getSheets() { return []; } }; }
    },
    Utilities: {
      // O único uso real: a hora, o dia da semana e a data, sempre em America/Sao_Paulo.
      // O relógio de mentira responde a partir de `quando`, e o teste escolhe `quando`.
      formatDate(data, fuso, formato) {
        const d = (data instanceof Date) ? data : quando;
        const p = (n) => String(n).padStart(2, '0');
        if (formato === 'HH:mm') return p(d.getHours()) + ':' + p(d.getMinutes());
        if (formato === 'yyyy-MM-dd') return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
        if (formato === 'u') { const g = d.getDay(); return String(g === 0 ? 7 : g); }  // 7 = domingo
        return '';
      },
      newBlob() { return {}; },
      base64Decode() { return []; }
    },
    UrlFetchApp: {
      fetch(url, params) {
        const opcao = params || {};
        const metodo = String(opcao.method || 'get').toLowerCase();
        pedidos.push({ url: String(url), metodo, payload: opcao.payload });

        // Login anônimo do Firebase
        if (url.indexOf('identitytoolkit.googleapis.com') >= 0) {
          return resposta(200, JSON.stringify({ idToken: 'token-de-mentira' }));
        }
        // Telegram
        if (url.indexOf('api.telegram.org') >= 0) {
          return resposta(telegramOk ? 200 : 500, JSON.stringify({ ok: telegramOk }));
        }
        // Firebase Realtime Database
        if (url.indexOf('firebaseio.com') >= 0) {
          const caminho = String(url).split('firebaseio.com/')[1].split('.json')[0];
          if (metodo === 'put') return resposta(200, JSON.stringify(JSON.parse(opcao.payload)));
          const v = Object.prototype.hasOwnProperty.call(banco, caminho) ? banco[caminho] : null;
          return resposta(200, JSON.stringify(v));
        }
        throw new Error('URL inesperada no teste: ' + url);
      }
    },
    console
  };
  vm.createContext(sandbox);
  return sandbox;
}

function resposta(codigo, texto) {
  return { getResponseCode() { return codigo; }, getContentText() { return texto; } };
}

/** Carrega o Codigo.gs de verdade na sandbox e devolve o contexto com as funções definidas. */
function carregarPonte(opcoes) {
  const sandbox = montarSandbox(opcoes);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, PONTE), 'utf8'), sandbox, { filename: PONTE });
  return sandbox;
}

/**
 * `_paraHtml` troca acento e travessão por entidade numérica (&#233; etc.) antes de mandar.
 * O teste quer conferir a frase que a Gestão vai LER, então desfaz a troca — assim a
 * asserção fica escrita em português, e não em código de entidade.
 */
function decodificar(s) {
  return String(s).replace(/&#(\d+);/g, (t, n) => String.fromCharCode(Number(n)));
}

/** Os envios ao Telegram que a ponte fez, já com o destino e o texto separados. */
function enviosTelegram(sandbox) {
  return sandbox.pedidos
    .filter((p) => p.url.indexOf('api.telegram.org') >= 0)
    .map((p) => {
      // `_mandarTexto` monta o payload como OBJETO (o Apps Script codifica sozinho);
      // `_mandarFoto` usa outro formato. Aceita os dois para o teste não depender disso.
      let corpo = p.payload;
      if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; } }
      corpo = corpo || {};
      return {
        destino: String(corpo.chat_id || ''),
        texto: decodificar(String(corpo.text || corpo.caption || ''))
      };
    });
}

/** As gravações (PUT) que a ponte fez no Firebase, só os caminhos. */
function gravacoesFirebase(sandbox) {
  return sandbox.pedidos
    .filter((p) => p.url.indexOf('firebaseio.com') >= 0 && p.metodo === 'put')
    .map((p) => p.url.split('firebaseio.com/')[1].split('.json')[0]);
}

// ------------------------------------------------------------------ runner
const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

const DIA = '2026-08-27';                      // uma quinta-feira
const NO_FECHAMENTO = 'daycare/falta-automatica/' + DIA;
const NO_COBRANCA = 'daycare/cobranca-falta/' + DIA;

// ---- 1. a janela ----------------------------------------------------------------
[
  ['11:50', '2026-08-27T11:50:00', 'antes das 12h15'],
  ['12:14', '2026-08-27T12:14:00', 'um minuto antes da janela'],
  ['13:16', '2026-08-27T13:16:00', 'um minuto depois da janela'],
  ['18:00', '2026-08-27T18:00:00', 'de noite']
].forEach(([hora, agora, porque]) => {
  teste(`fora da janela (${hora}, ${porque}): não faz nada, nem pede token`, () => {
    const s = carregarPonte({ agora, banco: {} });
    s.vigiaFalta12h();
    assert.deepStrictEqual(s.pedidos, [], 'não deveria ter tocado na rede');
  });
});

[
  ['12:15', '2026-08-27T12:15:00'],
  ['12:45', '2026-08-27T12:45:00'],
  ['13:15', '2026-08-27T13:15:00']
].forEach(([hora, agora]) => {
  teste(`dentro da janela (${hora}): age`, () => {
    const s = carregarPonte({ agora, banco: {} });
    s.vigiaFalta12h();
    assert.strictEqual(enviosTelegram(s).length, 1, 'esperava exatamente uma cobrança');
  });
});

// ---- 2. o dia da semana ---------------------------------------------------------
teste('sábado ao meio-dia: não cobra (não há Day Care)', () => {
  const s = carregarPonte({ agora: '2026-08-29T12:20:00', banco: {} });   // 29/ago/2026 é sábado
  s.vigiaFalta12h();
  assert.deepStrictEqual(s.pedidos, []);
});

teste('domingo ao meio-dia: não cobra (não há Day Care)', () => {
  const s = carregarPonte({ agora: '2026-08-30T12:20:00', banco: {} });   // 30/ago/2026 é domingo
  s.vigiaFalta12h();
  assert.deepStrictEqual(s.pedidos, []);
});

// ---- 3. o dia foi fechado: silêncio ---------------------------------------------
teste('com o dia já fechado no app, a ponte fica calada', () => {
  const banco = {};
  banco[NO_FECHAMENTO] = { ts: 1, por: 'Márcia', hora: '12:03', quantos: 2 };
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco });
  s.vigiaFalta12h();
  assert.deepStrictEqual(enviosTelegram(s), [], 'não deveria ter mandado mensagem nenhuma');
  assert.deepStrictEqual(gravacoesFirebase(s), [], 'não deveria ter gravado nada');
});

teste('fechamento com zero faltas ("todos vieram") também cala a ponte', () => {
  const banco = {};
  banco[NO_FECHAMENTO] = { ts: 1, por: 'sistema', hora: '12:00', quantos: 0 };
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco });
  s.vigiaFalta12h();
  assert.deepStrictEqual(enviosTelegram(s), []);
});

// ---- 4. ninguém fechou: cobra, uma vez, no grupo certo --------------------------
teste('sem fechamento, cobra UMA vez no grupo da Gestão', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {} });
  s.vigiaFalta12h();
  const envios = enviosTelegram(s);
  assert.strictEqual(envios.length, 1, 'esperava uma única mensagem');
  assert.strictEqual(envios[0].destino, GRUPO_GESTAO, 'a cobrança tem de ir para o grupo da Gestão');
  assert.ok(/ningu[ée]m fechou o dia/i.test(envios[0].texto),
    'a mensagem tem de dizer que ninguém fechou o dia: ' + envios[0].texto);
  assert.ok(/abram o app/i.test(envios[0].texto),
    'a mensagem tem de pedir para abrirem o app: ' + envios[0].texto);
});

teste('a mensagem não vai para o grupo do almoço nem para o da vet', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {} });
  s.vigiaFalta12h();
  const destinos = enviosTelegram(s).map((e) => e.destino);
  assert.ok(destinos.indexOf(s.GRUPOS['comida']) === -1, 'não é assunto do grupo do almoço');
  assert.ok(destinos.indexOf(s.GRUPOS['vet']) === -1, 'não é assunto do grupo da vet');
});

// ---- 5. a ponte NÃO marca ninguém -----------------------------------------------
teste('a ponte nunca marca falta: não escreve na chamada nem no fechamento', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {} });
  s.vigiaFalta12h();
  const gravou = gravacoesFirebase(s);
  assert.ok(gravou.every((c) => c.indexOf('daycare/chamada/') !== 0),
    'a ponte escreveu na chamada: ' + gravou.join(', '));
  assert.ok(gravou.indexOf(NO_FECHAMENTO) === -1,
    'a ponte tomou a trava do fechamento — ela é da casa, não da ponte: ' + gravou.join(', '));
  assert.deepStrictEqual(gravou, [NO_COBRANCA],
    'a única gravação permitida é a trava da própria cobrança');
});

// ---- 6. uma vez por dia ---------------------------------------------------------
teste('com a cobrança de hoje já gravada, fica calada', () => {
  const banco = {};
  banco[NO_COBRANCA] = { ts: 1, por: 'ponte', hora: '12:15' };
  const s = carregarPonte({ agora: '2026-08-27T12:45:00', banco });
  s.vigiaFalta12h();
  assert.deepStrictEqual(enviosTelegram(s), [], 'não deveria repetir a cobrança do dia');
});

teste('a trava da cobrança é lida antes da do fechamento (não cobra duas vezes)', () => {
  const banco = {};
  banco[NO_COBRANCA] = { ts: 1, por: 'ponte', hora: '12:15' };
  const s = carregarPonte({ agora: '2026-08-27T12:45:00', banco });
  s.vigiaFalta12h();
  assert.deepStrictEqual(gravacoesFirebase(s), []);
});

// ---- 7. a trava só é gravada depois de o Telegram aceitar -----------------------
teste('se o Telegram falhar, a trava NÃO é gravada (para tentar de novo em 15 min)', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {}, telegramOk: false });
  s.vigiaFalta12h();
  assert.strictEqual(enviosTelegram(s).length, 1, 'tentou mandar');
  assert.deepStrictEqual(gravacoesFirebase(s), [],
    'com o envio falhando, gravar a trava esconderia o problema até amanhã');
});

teste('com o Telegram aceitando, a trava do dia é gravada', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {}, telegramOk: true });
  s.vigiaFalta12h();
  assert.deepStrictEqual(gravacoesFirebase(s), [NO_COBRANCA]);
});

// ---- o texto do arquivo: o que não pode se perder num refactor ------------------
teste('a janela e o grupo estão escritos no arquivo, não adivinhados', () => {
  const gs = fs.readFileSync(path.join(RAIZ, PONTE), 'utf8');
  assert.ok(/var FALTA_HORA_INICIO = '12:15';/.test(gs), 'faltou a hora de início');
  assert.ok(/var FALTA_HORA_FIM {4}= '13:15';/.test(gs), 'faltou a hora de fim');
  assert.ok(/_mandarTexto\(GRUPOS\['gestao'\], texto\)/.test(gs), 'a cobrança tem de ir ao grupo da Gestão');
  assert.ok(/America\/Sao_Paulo/.test(gs), 'o fuso tem de ser explícito');
});

teste('existe o teste de bancada, como no vigiaAlmoco2', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {} });
  assert.strictEqual(typeof s.vigiaFalta12h_TESTE, 'function');
});

teste('o teste de bancada não escreve o token no log', () => {
  const s = carregarPonte({ agora: '2026-08-27T12:20:00', banco: {} });
  s.vigiaFalta12h_TESTE();
  assert.ok(s.logs.length > 0, 'esperava algum log');
  assert.ok(s.logs.every((l) => l.indexOf('token-de-mentira') === -1),
    'o token apareceu no log: ' + s.logs.join(' | '));
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
