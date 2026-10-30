'use strict';
/* Zelozinha simples — o serviço da VPS (Adriana, 29/out/2026: "mandando mensagem devagar como se fosse um humano").
   Escuta a fila do dia (daycare/zelozinha-fila/{dia}) e a pausa; manda UM item por vez, no horário,
   com «digitando…» antes e um intervalo sorteado depois; marca o item; dá sinal de vida a cada 2 min.
   Não monta texto, não escolhe quem recebe e não lê ficha: isso tudo nasce no app, no check-in. */

const fs = require('node:fs');
const N = require('./nucleo');
const Mensagem = require('./mensagem-unica41');   // cópia idêntica do texto aprovado do app (a prova confere)
const MensagemIrmaos = require('./mensagem-irmaos');   // texto aprovado para irmãos do mesmo tutor (30/out/2026), também idêntico ao do app

const PASSO_MS = 15000, SINAL_MS = 120000, ESPERA_NUMERO_MS = 60000, TENTATIVAS_NUMERO = 3;

function criarEvolution(e, fetchImpl = globalThis.fetch) {
  const base = e.baseUrl, inst = encodeURIComponent(e.instancia);
  const cabecalhos = { 'content-type': 'application/json' };
  cabecalhos.apikey = e.chaveAcesso;
  async function chamar(metodo, caminho, corpo) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), e.httpTimeoutMs);
    try {
      const r = await fetchImpl(base + caminho, { method: metodo, headers: cabecalhos, body: corpo ? JSON.stringify(corpo) : undefined, signal: ac.signal, redirect: 'error' });
      let j = null; try { j = await r.json(); } catch (_) { j = null; }
      return { status: r.status, corpo: j };
    } finally { clearTimeout(t); }
  }
  return {
    numero: async (n) => N.interpretarNumero(await chamar('POST', `/chat/whatsappNumbers/${inst}`, { numbers: [n] }), n),
    enviar: (jid, textoMsg, digitando) => chamar('POST', `/message/sendText/${inst}`, { number: jid.slice(0, jid.indexOf('@')), text: textoMsg, delay: digitando })
      .catch(() => ({ erro: true })),
    estado: () => chamar('GET', `/instance/connectionState/${inst}`)
      .then((r) => (r.corpo && r.corpo.instance && typeof r.corpo.instance.state === 'string' ? r.corpo.instance.state : 'desconhecido'), () => 'desconhecido')
  };
}

/* op: db (Admin SDK, com a identidade técnica), evo, cfg, agora(), aleatorio(), log(), servidorAgora */
function criarServico(op) {
  const { db, evo, cfg } = op, agora = op.agora || Date.now, aleatorio = op.aleatorio || Math.random, log = op.log || (() => {});
  const est = { dia: '', fila: {}, refFila: null, pausado: false, proximoEm: 0, ocupado: false, whatsapp: 'desconhecido' };

  function guardar(s) { est.fila[s.key] = s.val(); }
  function tirar(s) { delete est.fila[s.key]; }
  async function trocarDia(dia) {
    if (est.refFila) { est.refFila.off('child_added', guardar); est.refFila.off('child_changed', guardar); est.refFila.off('child_removed', tirar); }
    est.dia = dia; est.fila = {};
    const ref = db.ref(`${N.FILA}/${dia}`);
    est.refFila = ref;
    ref.on('child_added', guardar); ref.on('child_changed', guardar); ref.on('child_removed', tirar);
    /* quem ficou «enviando» num reinício vai para Conferir: nunca reenviar sozinho */
    const tudo = (await ref.once('value')).val() || {};
    for (const it of N.abandonados(tudo)) {
      await mudar(dia, it.dcKey, 'enviando', { estado: 'conferir', motivo: 'O serviço reiniciou durante o envio; veja no WhatsApp da Zêluz se a mensagem saiu.' });
    }
  }
  function mudar(dia, dc, de, campos) {
    return db.ref(`${N.FILA}/${dia}/${dc}`).transaction((a) => (a && a.estado === de ? Object.assign({}, a, campos) : undefined))
      .then((r) => !!(r && r.committed));
  }
  async function iniciar() {
    db.ref(N.CONTROLE).on('value', (s) => { const v = s.val(); est.pausado = !!(v && v.pausado === true); });
    const saude = (await db.ref(N.SAUDE).once('value')).val();
    const ultimo = Number(saude && saude.ultimoEnvioEm) || 0;
    if (ultimo) est.proximoEm = ultimo + cfg.intervaloMinMs;   // reinício não encurta o intervalo
    await trocarDia(N.diaSP(agora()));
    await sinal();
  }
  async function passo() {
    const t = agora(), dia = N.diaSP(t);
    if (dia !== est.dia) await trocarDia(dia);
    if (est.ocupado || est.pausado || !N.naJanela(t, cfg) || t < est.proximoEm) return 'esperando';
    const it = N.escolherProximo(est.fila);
    if (!it) return 'vazio';
    est.ocupado = true;
    try { return await enviarItem(dia, it); } finally { est.ocupado = false; }
  }
  /* reserva o item (pronto -> enviando) e confere com o banco; devolve o item conferido ou o estado em que ele ficou */
  async function prepararItem(dia, it) {
    const dc = it.dcKey;
    if (!(await mudar(dia, dc, 'pronto', { estado: 'enviando', tentativaEm: agora() }))) return 'disputado';
    const ler = (c) => db.ref(c).once('value').then((s) => s.val());
    const [saida, checkin, cadastro] = await Promise.all([ler(`daycare/checkout-corpo/${dia}/${dc}`), ler(`daycare/checkin-corpo/${dia}/${dc}`), ler(`daycare/cadastro/${it.pelKey}`)]);
    if (N.saidaConfirmada(saida)) { await mudar(dia, dc, 'enviando', { estado: 'cancelado', motivo: 'Saiu antes do envio.' }); return 'cancelado'; }
    /* não confia na fila: só sai o texto aprovado, para o tutor principal da ficha, de quem tem check-in hoje */
    const conf = N.conferirItem({ item: it, cadastro, checkin, gerar: Mensagem.gerarMensagem });
    if (!conf.ok) { await mudar(dia, dc, 'enviando', { estado: 'falhou', motivo: conf.motivo }); log('recusado', 'item não confere com o banco'); return 'recusado'; }
    return { it, tutor: N.responsavel(cadastro, it.tutor).nome };
  }
  async function enviarItem(dia, it) {
    const dc = it.dcKey;
    const principal = await prepararItem(dia, it);
    if (typeof principal === 'string') return principal;
    /* irmãos do mesmo tutor (mesmo telefone) que estão na fila saem juntos, na vez do primeiro; cada um é conferido */
    const grupo = [principal];
    for (const x of N.irmaos(est.fila, it)) { const p = await prepararItem(dia, x); if (typeof p !== 'string') grupo.push(p); }
    const devolver = (lista) => Promise.all(lista.map((g) => mudar(dia, g.it.dcKey, 'enviando', { estado: 'pronto' })));
    let numero;
    try { numero = await evo.numero(it.para); } catch (e) {
      const tentativas = (Number(it.tentativasNumero) || 0) + 1;
      await mudar(dia, dc, 'enviando', tentativas >= TENTATIVAS_NUMERO
        ? { estado: 'falhou', motivo: 'Não consegui confirmar o número no WhatsApp.', tentativasNumero: tentativas }
        : { estado: 'pronto', tentativasNumero: tentativas });
      await devolver(grupo.slice(1));
      est.proximoEm = agora() + ESPERA_NUMERO_MS;
      log('numero', e.message);   // sem nome de FILHOt nem de tutor no registro
      return 'numero-depois';
    }
    if (!numero.ok) { await Promise.all(grupo.map((g) => mudar(dia, g.it.dcKey, 'enviando', { estado: 'falhou', motivo: numero.motivo }))); return 'falhou'; }
    let texto = it.texto, juntos = grupo;
    if (grupo.length > 1) {
      const m = MensagemIrmaos.gerarMensagemIrmaos({ nomeTutor: principal.tutor, dia, presencaConfirmada: true,
        veterinariaConfirmada: grupo.some((g) => g.it.itens.some((x) => String(x && x.itemK).startsWith('vac_'))),
        peludos: grupo.map((g) => ({ nome: g.it.nome, sexo: g.it.sexo || undefined, cuidados: g.it.itens })) });
      /* se o texto dos irmãos não fechar, o primeiro sai sozinho e os outros voltam para a fila */
      if (m.ok) texto = m.texto; else { await devolver(grupo.slice(1)); juntos = [principal]; log('irmaos', 'o texto dos irmãos não fechou; vai um de cada vez'); }
    }
    const r = N.interpretarEnvio(await evo.enviar(numero.jid, texto, N.digitandoMs(aleatorio(), cfg)), numero.jid);
    const t = agora(), extra = juntos.length > 1 ? { textoEnviado: texto, junto: juntos.map((g) => g.it.dcKey) } : {};
    await Promise.all(juntos.map((g) => mudar(dia, g.it.dcKey, 'enviando', Object.assign(r.estado === 'enviado' ? { estado: 'enviado', enviadoEm: t, msgId: r.msgId, motivo: null } : { estado: r.estado, motivo: r.motivo }, extra))));
    est.proximoEm = t + N.proximoIntervalo(aleatorio(), cfg);
    await db.ref(N.SAUDE).update({ ultimoEnvioEm: t, proximoEm: est.proximoEm });
    log('envio', r.estado + (juntos.length > 1 ? ` (${juntos.length} irmãos numa mensagem)` : ''));
    return r.estado;
  }
  async function sinal() {
    est.whatsapp = await evo.estado();
    await db.ref(N.SAUDE).update({ vivoEm: op.servidorAgora || agora(), whatsapp: est.whatsapp, proximoEm: est.proximoEm || null, pausado: est.pausado, versao: N.VERSAO });
  }
  return { iniciar, passo, sinal, trocarDia, _est: est };
}

async function principal() {
  const i = process.argv.indexOf('--config');
  const lido = N.lerConfig(JSON.parse(fs.readFileSync(i > 0 ? process.argv[i + 1] : '/etc/zeluz-piloto/automatico80.json', 'utf8')));
  if (!lido.ok) { console.error('configuração incompleta:', lido.falta.join(', ')); process.exit(2); }
  const cfg = lido.cfg;
  const { initializeApp, applicationDefault } = require('firebase-admin/app');
  const { getDatabase, ServerValue } = require('firebase-admin/database');
  const app = initializeApp({ credential: applicationDefault(), databaseURL: cfg.firebaseUrl, databaseAuthVariableOverride: { uid: cfg.serviceUid } }, 'zelozinha-simples');
  const servico = criarServico({ db: getDatabase(app), evo: criarEvolution(cfg.evolution), cfg, servidorAgora: ServerValue.TIMESTAMP,
    log: (...a) => console.log(new Date().toISOString(), ...a) });
  await servico.iniciar();
  console.log(JSON.stringify({ ok: true, zelozinha: N.VERSAO, dia: servico._est.dia }));
  setInterval(() => servico.passo().catch((e) => console.error('passo:', e.message)), PASSO_MS);
  setInterval(() => servico.sinal().catch((e) => console.error('sinal:', e.message)), SINAL_MS);
}

if (require.main === module) principal().catch((e) => { console.error('não iniciou:', e.message); process.exit(1); });

module.exports = { criarEvolution, criarServico };
