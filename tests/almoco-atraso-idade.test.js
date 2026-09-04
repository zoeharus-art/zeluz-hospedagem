'use strict';
/*
 * PROVA (relógio simulado) do atraso do aviso de ALMOÇO reportado pela Adriana em 04/set/2026:
 * "hoje, o aviso do almoço de ONTEM chegou às 6h da manhã".
 *
 * ⚠ ESTE ARQUIVO NÃO CARREGA auaulandia/index.html. Naquele momento o arquivo estava sendo
 * editado por outro agente em paralelo (instrução explícita: não tocar nele nesta sessão).
 * O que segue abaixo em `atualEmpPendentesDoDia` e `atualEmpAvisarAtrasoNoTelegram` é uma
 * TRANSCRIÇÃO FIEL da lógica de produção — cada função cita a linha exata de onde foi
 * copiada, e uma segunda pessoa pode abrir o arquivo real e comparar linha a linha. O modelo
 * "PROPOSTO" ao final é o patch sugerido, ainda não aplicado.
 *
 * ===================== O CAMINHO REAL (mapeado por leitura, sem editar nada) =============
 *
 * 1. auaulandia/index.html:19305 avisarGrupoComida(k, opts) — é chamada NA HORA, de forma
 *    síncrona, quando o monitor marca "não comeu" no 2º horário (marcarAlmoco2, linha 19272:
 *    `if(nx==='nao'){ try{ avisarGrupoComida(k); }catch(e){} }`). Isso já está certo: o
 *    envio imediato EXISTE.
 *
 * 2. Se esse envio imediato FALHAR (rede do tablet, ponte fora do ar, o timeout de 6s da
 *    linha 19334, etc.), o único registro que sobra é `daycare/avisos-telegram-comida/{dia}/
 *    {k}` com `ok:false` (linha 19359). NÃO existe fila com relógio para essa falha — ao
 *    contrário de `med-tg-fila` (medicação/urgência/gestão), que tem `setInterval` de 10 em
 *    10 minutos (índice 17309: `setInterval(function(){...medTgFilaTentar();...}, 600000)`).
 *    O único jeito de reenviar isso é um humano abrir "Meu Painel" e clicar "Reenviar"
 *    (pmReenviar, linha 29342 — não há chamada automática a pmAbrir/pmReenviar em lugar
 *    nenhum do arquivo, conferido por grep).
 *
 * 3. SEPARADAMENTE — e é aqui que mora o atraso de 6h da manhã — existe uma segunda rota,
 *    de propósito diferente: `empAvisarAtrasoNoTelegram()` (linha 28345), chamada por
 *    `abrirEmporio()` (linha 28248) toda vez que uma pessoa ABRE a aba "Empório" no app
 *    (linha 4288: `if(v==='emporio'){ abrirEmporio(); }`). Essa função varre os últimos
 *    EMP_DIAS_GRUPO=2 dias (linha 28194) atrás de pendências — usando `empPendentesDoDia`
 *    (linha 28210) — e manda um RESUMO delas para o MESMO grupo `comida` do Telegram
 *    (linha 28384), com trava de "1 vez por dia" (`daycare/avisos-telegram-atraso/{hoje}`,
 *    linha 28345-28351).
 *
 * 4. `empPendentesDoDia` (linha 28210) decide "pendente" olhando só se o TUTOR já foi avisado
 *    (`avisados` = `daycare/avisos-comida/{dia}`, a marcação manual da consultora) — NUNCA
 *    olha se o Telegram já entregou (`daycare/avisos-telegram-comida`) nem A QUANTAS HORAS
 *    o evento aconteceu. Resultado: se ninguém abriu "Empório" no dia anterior, o primeiro
 *    a abrir essa aba — o que naturalmente acontece de manhã cedo, no início do turno —
 *    dispara o resumo de TUDO que ficou pendente, não importa se aconteceu há 20 minutos ou
 *    há 20 horas. É exatamente "a mensagem do almoço de ontem chegando às 6h da manhã".
 *
 * CONCLUSÃO: não há um "reenvio automático" propriamente — há uma segunda rota (o resumo do
 * Empório) que só roda quando uma TELA é aberta, sem filtro de idade. É o suspeito #1 do
 * pedido da Adriana ("envio que só acontece quando alguma tela/rotina roda") CONFIRMADO.
 * E não há relógio curto retomando o envio IMEDIATO que falhou (suspeito #3, também
 * CONFIRMADO: sem retry automático de curto prazo para `avisos-telegram-comida`).
 *
 * ===================== O QUE ESTE TESTE PROVA ==============================================
 *   A. Reproduzindo a lógica ATUAL de empPendentesDoDia/empAvisarAtrasoNoTelegram: um item
 *      de ONTEM às 15:20 (parte do 2º horário) ainda aparece como "a mandar" quando alguém
 *      abre o Empório hoje às 06:00 — e o texto que sairia no Telegram não diz que é velho.
 *   B. O modelo do FIX proposto (mesma função + 1 checagem de idade por `ts`) faz o MESMO
 *      evento, com mais de 12h, deixar de ir para o Telegram e virar aviso de tela.
 *   C. O modelo do FIX proposto para o retry de `avisarGrupoComida` (relógio de 2 min, com
 *      trava por transaction para não duplicar) reenvia sozinho um item que falhou — sem
 *      esperar alguém abrir uma tela — e não manda duas vezes quando dois "aparelhos"
 *      disputam o mesmo item ao mesmo tempo.
 *
 * Uso:  node tests/almoco-atraso-idade.test.js
 */

const assert = require('assert');

// ---------------------------------------------------------------------------------------
// A) MODELO FIEL da lógica atual (index.html:28210-28245, comportamento de produção)
// ---------------------------------------------------------------------------------------
// empPendentesDoDia(a1, a2, avisados) real (index.html:28210) só filtra por `avisados`
// (se a consultora já marcou que avisou o tutor) — sem olhar idade nem se o Telegram já
// entregou. Aqui simplificado para o essencial do teste: cada item tem {k, ts, avisadoTutor}.
function atualEmpPendentesDoDia(itensDoDia) {
  return itensDoDia.filter((it) => !it.avisadoTutor); // == `if((avisados||{})[k]) return;` real
}

// empAvisarAtrasoNoTelegram (index.html:28345) real: 1x por dia (trava por transaction),
// manda para o Telegram TUDO que atualEmpPendentesDoDia devolver dos últimos 2 dias — sem
// checar `ts`. Aqui devolvemos só a lista do que SAIRIA no Telegram, para o teste comparar.
function atualEmpAvisarAtrasoNoTelegram(itensPendentes) {
  return itensPendentes.map((it) => it.k); // manda todo mundo, não importa a idade
}

// ---------------------------------------------------------------------------------------
// B) MODELO PROPOSTO — a única mudança: idade do evento entra na decisão
// ---------------------------------------------------------------------------------------
const DOZE_HORAS_MS = 12 * 60 * 60 * 1000;

function propostoClassificarPendencias(itensDoDia, agoraMs) {
  const pendentes = itensDoDia.filter((it) => !it.avisadoTutor);
  const paraTelegram = [], paraTelaApenas = [];
  pendentes.forEach((it) => {
    const idadeMs = agoraMs - it.ts;
    if (idadeMs > DOZE_HORAS_MS) paraTelaApenas.push(it); // "aviso de ontem não saiu"
    else paraTelegram.push(it);
  });
  return { paraTelegram, paraTelaApenas };
}

// ---------------------------------------------------------------------------------------
// C) MODELO PROPOSTO — retry automático de curto prazo (espelha medTgFilaTentar, mas para
//    avisos-telegram-comida). Relógio simulado: nada de setInterval de verdade.
// ---------------------------------------------------------------------------------------
function criarFilaComRelogio() {
  const fila = new Map();      // id -> {texto, tentando:false, ok:false, lockTs:0}
  const enviosReais = [];      // prova de quantas vezes "saiu" de verdade
  function guardar(id, item) { fila.set(id, Object.assign({ tentando: false, ok: false, lockTs: 0 }, item)); }
  // Simula 1 "tique" do relógio de 2 minutos, com N aparelhos tentando ao mesmo tempo.
  // A trava (lockTs) é o mesmo padrão de medTgFilaTentar (index.html:8115-8118): quem chega
  // e vê lockTs recente (<120000ms) não manda de novo.
  function tique(agoraMs, aparelhos, enviarDeVerdade) {
    aparelhos.forEach(() => {
      fila.forEach((item, id) => {
        if (item.ok) return;
        if (item.lockTs && agoraMs - item.lockTs < 120000) return; // outro aparelho já pegou
        item.lockTs = agoraMs;
        const r = enviarDeVerdade(item);
        if (r && r.ok) { item.ok = true; enviosReais.push(id); }
      });
    });
  }
  return { fila, enviosReais, guardar, tique };
}

// ------------------------------------------------------------------ os testes
const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

teste('A) lógica ATUAL: item de ontem 15:20 ainda "pendente" quando o Empório abre hoje 06:00 — e vai pro Telegram sem dizer que é velho', () => {
  const ONTEM_15H20 = new Date('2026-09-03T15:20:00-03:00').getTime();
  const item = { k: 'camus__sophia-joao', ts: ONTEM_15H20, avisadoTutor: false };
  const pendentes = atualEmpPendentesDoDia([item]);
  const paraTelegram = atualEmpAvisarAtrasoNoTelegram(pendentes);
  assert.deepStrictEqual(paraTelegram, ['camus__sophia-joao'],
    'com a lógica de produção, o item de ontem sai no Telegram de hoje de manhã — sem filtro de idade');
});

teste('B) modelo PROPOSTO: o MESMO item (idade 14h30) para de ir pro Telegram e vira só aviso de tela', () => {
  const ONTEM_15H20 = new Date('2026-09-03T15:20:00-03:00').getTime();
  const HOJE_06H00 = new Date('2026-09-04T06:00:00-03:00').getTime();
  const item = { k: 'camus__sophia-joao', ts: ONTEM_15H20, avisadoTutor: false };
  const { paraTelegram, paraTelaApenas } = propostoClassificarPendencias([item], HOJE_06H00);
  assert.strictEqual(paraTelegram.length, 0, 'com o filtro de 12h, nada velho sai pelo Telegram');
  assert.strictEqual(paraTelaApenas.length, 1, 'o item velho vira aviso na tela');
  assert.strictEqual(paraTelaApenas[0].k, 'camus__sophia-joao');
});

teste('B2) modelo PROPOSTO: item de HÁ 3 HORAS (dentro da janela) ainda vai pro Telegram normalmente — o filtro não trava tudo', () => {
  const HOJE_09H00 = new Date('2026-09-04T09:00:00-03:00').getTime();
  const HOJE_12H00 = new Date('2026-09-04T12:00:00-03:00').getTime();
  const item = { k: 'theo__renata', ts: HOJE_09H00, avisadoTutor: false };
  const { paraTelegram, paraTelaApenas } = propostoClassificarPendencias([item], HOJE_12H00);
  assert.strictEqual(paraTelegram.length, 1, 'evento recente (3h) continua indo pro Telegram na hora certa');
  assert.strictEqual(paraTelaApenas.length, 0);
});

teste('C) modelo PROPOSTO: retry de 2 em 2 min reenvia sozinho um item que falhou — sem esperar ninguém abrir tela', () => {
  const q = criarFilaComRelogio();
  q.guardar('camus-1', { texto: 'Camus não comeu' });
  var tentativasDeRede = 0;
  var t0 = new Date('2026-09-03T15:22:00-03:00').getTime(); // falhou 2 min depois do evento
  // 1º tique: a "rede" ainda está fora (simula a ponte indisponível)
  q.tique(t0, ['tablet-recepcao'], () => { tentativasDeRede++; return { ok: false }; });
  assert.strictEqual(q.enviosReais.length, 0, 'na 1ª tentativa, ainda não conseguiu — nada foi marcado como enviado');
  // 2º tique, 2 minutos depois: a rede voltou
  var t1 = t0 + 2 * 60 * 1000;
  q.tique(t1, ['tablet-recepcao'], () => { tentativasDeRede++; return { ok: true }; });
  assert.strictEqual(q.enviosReais.length, 1, 'no relógio seguinte (2 min), reenviou sozinho e teve sucesso — sem intervenção humana');
  assert.strictEqual(tentativasDeRede, 2, 'exatamente 2 tentativas de rede, uma por tique');
});

teste('C2) modelo PROPOSTO: dois "aparelhos" no MESMO tique não mandam a mensagem em dobro (trava por lockTs)', () => {
  const q = criarFilaComRelogio();
  q.guardar('camus-2', { texto: 'Camus não comeu' });
  var envios = 0;
  var t0 = new Date('2026-09-03T15:22:00-03:00').getTime();
  q.tique(t0, ['tablet-recepcao', 'celular-monitor'], () => { envios++; return { ok: true }; });
  assert.strictEqual(envios, 1, 'dois aparelhos disputando o mesmo item no mesmo tique: só UM manda de verdade');
  assert.strictEqual(q.enviosReais.length, 1);
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
