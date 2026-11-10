'use strict';
/* Zelozinha simples — as decisões do serviço, sem rede e sem banco (por isso testáveis).
   A fila nasce no app (daycare/zelozinha-fila/{dia}/{dcKey}); o serviço só manda devagar e marca:
   pronto -> enviando -> enviado | conferir | falhou | cancelado.
   O aviso do plano mora na chave {dcKey}~plano (09/11/2026): no mesmo dia, o FILHOt pode ter o aviso do que foi pago
   e a pergunta do que não foi, e cada um sai na sua mensagem. */

const FILA = 'daycare/zelozinha-fila';
const SAUDE = 'daycare/zelozinha-saude/vps';
const CONTROLE = 'daycare/zelozinha-controle/estado';
const VERSAO = 'simples-6';
const SUFIXO_PLANO = '~plano';
const JID = /^\d{6,20}@s\.whatsapp\.net$/;

const PADRAO = Object.freeze({
  janelaInicio: 7, janelaFim: 13,            // segunda a sexta, 7h (inclusive) às 13h (exclusive), São Paulo
  intervaloMinMs: 3 * 60000, intervaloMaxMs: 7 * 60000,   // entre uma mensagem e outra, sorteado
  digitandoMinMs: 4000, digitandoMaxMs: 9000,             // «digitando…» antes de cada envio
  esperaIrmaosMs: 10 * 60000,                // quem entrou na fila há menos que isso ainda não sai: dá tempo de o irmão chegar
  httpTimeoutMs: 15000
});

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const objeto = (v) => !!(v && typeof v === 'object' && !Array.isArray(v));

/* Aceita a configuração que já mora na VPS (automatico80.json) ou uma enxuta com os mesmos campos. */
function lerConfig(bruto) {
  const b = objeto(bruto) ? bruto : {};
  const banco = objeto(b.banco) ? b.banco : b;
  const evo = objeto(b.automatico) && objeto(b.automatico.evolution) ? b.automatico.evolution : (objeto(b.evolution) ? b.evolution : {});
  const ajuste = objeto(b.simples) ? b.simples : {};
  const cfg = Object.assign({}, PADRAO, {
    firebaseUrl: texto(banco.firebaseUrl), serviceUid: texto(banco.serviceUid),
    evolution: { baseUrl: texto(evo.baseUrl).replace(/\/+$/, ''), chaveAcesso: texto(evo.apiKey), instancia: texto(evo.instanceName),
      httpTimeoutMs: Number.isInteger(evo.httpTimeoutMs) && evo.httpTimeoutMs >= 1000 && evo.httpTimeoutMs <= 30000 ? evo.httpTimeoutMs : PADRAO.httpTimeoutMs }
  });
  Object.keys(PADRAO).forEach((k) => { if (Number.isFinite(ajuste[k]) && ajuste[k] >= 0) cfg[k] = ajuste[k]; });
  const falta = [];
  if (!/^https:\/\//.test(cfg.firebaseUrl)) falta.push('firebaseUrl');
  if (!cfg.serviceUid) falta.push('serviceUid');
  if (!/^https:\/\//.test(cfg.evolution.baseUrl)) falta.push('evolution.baseUrl');
  if (!cfg.evolution.chaveAcesso) falta.push('evolution.apiKey');
  if (!cfg.evolution.instancia) falta.push('evolution.instanceName');
  if (cfg.intervaloMaxMs < cfg.intervaloMinMs || cfg.digitandoMaxMs < cfg.digitandoMinMs || cfg.janelaFim <= cfg.janelaInicio) falta.push('ajustes incoerentes');
  return { ok: falta.length === 0, falta, cfg };
}

function partesSP(ms) {
  const o = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(ms)).forEach((p) => { o[p.type] = p.value; });
  return { dia: `${o.year}-${o.month}-${o.day}`, semana: o.weekday, hora: Number(o.hour) };
}
const diaSP = (ms) => partesSP(ms).dia;
function naJanela(ms, cfg = PADRAO) {
  const p = partesSP(ms);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(p.semana) && p.hora >= cfg.janelaInicio && p.hora < cfg.janelaFim;
}
const sorteio = (r, min, max) => Math.round(min + Math.min(Math.max(Number(r) || 0, 0), 1) * (max - min));
const proximoIntervalo = (r, cfg = PADRAO) => sorteio(r, cfg.intervaloMinMs, cfg.intervaloMaxMs);
const digitandoMs = (r, cfg = PADRAO) => sorteio(r, cfg.digitandoMinMs, cfg.digitandoMaxMs);

/* Espera para juntar irmãos (Adriana, 04/11/2026): dois irmãos fizeram check-in com 26 s de diferença e saíram duas mensagens.
   Só sai quem está na fila há `esperaIrmaosMs`. Não espera: item sem criadoEm válido, com criadoEm mais de uma espera à frente
   (relógio do aparelho errado) e qualquer um nos últimos 10 minutos da janela (depois disso a fila só volta no dia seguinte). */
function jaEsperou(it, agora, cfg = PADRAO) {
  const espera = Number.isFinite(cfg.esperaIrmaosMs) && cfg.esperaIrmaosMs >= 0 ? cfg.esperaIrmaosMs : PADRAO.esperaIrmaosMs;
  const c = typeof it.criadoEm === 'number' ? it.criadoEm : NaN;
  if (!(c > 0) || !Number.isFinite(c) || c > agora + espera || agora - c >= espera) return true;
  return !naJanela(agora + espera, cfg);
}

/* o item só vale na chave dele: a pergunta na dcKey; o aviso do plano na dcKey ou na dcKey~plano. Devolve o item com a chave. */
function itensNaChave(fila) {
  return Object.keys(objeto(fila) ? fila : {}).filter((k) => objeto(fila[k]) && texto(fila[k].dcKey)
    && (texto(fila[k].dcKey) === k || (fila[k].tipo === 'plano' && texto(fila[k].dcKey) + SUFIXO_PLANO === k)))
    .map((k) => Object.assign({}, fila[k], { chave: k }));
}

/* O próximo da fila: o «pronto» que entrou primeiro e já esperou. Item sem texto ou sem telefone não sai. */
function escolherProximo(fila, agora = Date.now(), cfg = PADRAO) {
  const prontos = itensNaChave(fila)
    .filter((it) => it.estado === 'pronto' && texto(it.texto) && /^55\d{10,11}$/.test(texto(it.para)) && jaEsperou(it, agora, cfg));
  prontos.sort((a, b) => (Number(a.criadoEm) || 0) - (Number(b.criadoEm) || 0) || (a.chave < b.chave ? -1 : 1));
  return prontos[0] || null;
}

/* Irmãos (Adriana, 30/out/2026: "tutor dono de dois peludinhos, sempre se tiver coisa junta mandar juntos"):
   os outros «prontos» do mesmo dia para o mesmo telefone saem na mesma mensagem, na vez do primeiro. */
const IRMAOS_MAX = 5;
function irmaos(fila, principal) {
  if (!objeto(principal)) return [];
  const chave = texto(principal.chave) || texto(principal.dcKey);
  return itensNaChave(fila).filter((it) => it.chave !== chave && it.dcKey !== principal.dcKey)
    .filter((it) => it.estado === 'pronto' && it.dia === principal.dia && texto(it.texto) && texto(it.para) === texto(principal.para)
      && (it.tipo === 'plano') === (principal.tipo === 'plano'))   /* o aviso do plano só sai junto com outro aviso do plano */
    .sort((a, b) => (Number(a.criadoEm) || 0) - (Number(b.criadoEm) || 0) || (a.chave < b.chave ? -1 : 1))
    .slice(0, IRMAOS_MAX - 1);
}

/* Quem ficou «enviando» quando o serviço caiu nunca é reenviado sozinho: vai para Conferir. */
function abandonados(fila) {
  return Object.keys(objeto(fila) ? fila : {}).filter((k) => objeto(fila[k]) && fila[k].estado === 'enviando').map((k) => Object.assign({}, fila[k], { chave: k }));
}

/* A saída do dia (checkout do corpo) confirmada cancela o envio que ainda não saiu. */
function saidaConfirmada(v) {
  if (!objeto(v) || v.tipo !== 'saida') return false;
  const f = v.fim, n = Number(f);
  if (typeof f === 'number') return Number.isFinite(f) && f > 0;
  const s = String(f == null ? '' : f).trim();
  if (!s) return false;
  if (/^\d{10,13}$/.test(s)) return n > 0;
  return Number.isFinite(Date.parse(s));
}

function entradaConfirmada(v) {
  if (!objeto(v) || v.tipo !== 'entrada' || !texto(v.quem)) return false;
  const f = v.fim;
  if (typeof f === 'number') return Number.isFinite(f) && f > 0;
  const s = String(f == null ? '' : f).trim();
  return /^\d{10,13}$/.test(s) ? Number(s) > 0 : !!s && Number.isFinite(Date.parse(s));
}

/* As chaves do app: pelKey = (nome+'__'+tutor) minúsculo com .#$[]/ trocados por '-';
   dcKey = a mesma dupla normalizada (sem acento, espaços juntos) e espaço também vira '-'.
   Por isso a dcKey sai da pelKey (é a dcKeyDoPelKey do familia92). */
function jsNorm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' '); }
function dcKeyDoPelKey(pelKey) { return jsNorm(pelKey).replace(/[.#$[\]/ ]/g, '-'); }

function telefone(v) {
  const d = String(v == null ? '' : v).replace(/\D/g, '');
  if (/^55\d{10,11}$/.test(d)) return d;
  if (/^\d{10,11}$/.test(d)) return '55' + d;
  return '';
}

/* O mesmo critério do app (e do serviço antigo, responsavel103): quem recebe é o tutor principal da ficha. */
function responsavel(cad, nomeLegado) {
  if (!objeto(cad)) return { ok: false };
  const bruto = texto(cad.tutorPrinc) || 'Tutor 1', principal = bruto === 'Tutor1' ? 'Tutor 1' : bruto === 'Tutor2' ? 'Tutor 2' : bruto;
  if (principal !== 'Tutor 1' && principal !== 'Tutor 2') return { ok: false };
  const nome = principal === 'Tutor 2' ? texto(cad.tutor2) : texto(cad.tutor), tel = telefone(principal === 'Tutor 2' ? cad.tel2 : cad.tel);
  if (!nome || !tel) return { ok: false };
  return { ok: true, nome: texto(cad.tutorPrinc) ? nome : (texto(nomeLegado) || nome), telefone: tel };
}

/* PRIMEIRO NOME (Adriana, 10/11/2026: "está mandando nome e sobrenome do tutor e não precisamos disso, apenas o primeiro nome"):
   a mensagem chama o tutor só pelo primeiro nome da ficha («Fulana Fictícia» -> «Fulana»). O app usa a mesma regra. */
function primeiroNome(nome) { const s = texto(nome); return s.split(/[\s\/,]+/)[0] || s; }

/* O serviço não confia no que veio da fila: antes de enviar, confere com o banco que o FILHOt tem
   check-in hoje, que o telefone é o do tutor principal da ficha e que o texto é exatamente o texto
   aprovado (MensagemUnica41) para aqueles cuidados. Qualquer diferença: nada sai. */
function conferirItem({ item, cadastro, checkin, gerar, gerarPlano, doseDoDia }) {
  const recusa = (motivo) => ({ ok: false, motivo });
  if (!texto(item.pelKey) || dcKeyDoPelKey(item.pelKey) !== texto(item.dcKey)) return recusa('A ficha não corresponde ao FILHOt da fila; nada foi enviado.');
  if (!entradaConfirmada(checkin)) return recusa('Não achei o check-in de hoje deste FILHOt; nada foi enviado.');
  if (!objeto(cadastro) || cadastro.excluido === true) return recusa('A ficha do FILHOt não foi encontrada; nada foi enviado.');
  const r = responsavel(cadastro, texto(item.tutor));
  if (!r.ok || r.telefone !== texto(item.para)) return recusa('O telefone não confere com o tutor principal da ficha; nada foi enviado.');
  const nome = texto(item.nome), sexo = item.sexo === 'F' || item.sexo === 'M' ? item.sexo : undefined;
  if (!/^[\p{L}\p{M}' .-]{1,40}$/u.test(nome)) return recusa('O nome do FILHOt na fila não é válido; nada foi enviado.');
  /* o nome tem de ser o da ficha: o que está na chave da ficha ou o gravado nela */
  const chaveNome = texto(item.pelKey).split('__')[0];
  if (chaveNome !== nome.toLowerCase().replace(/[.#$[\]/]/g, '-') && jsNorm(texto(cadastro.n)) !== jsNorm(nome)) return recusa('O nome do FILHOt não confere com a ficha; nada foi enviado.');
  const itens = Array.isArray(item.itens) ? item.itens : [];
  /* aviso do plano com cuidados incluídos (05/11/2026): o texto é o do aviso, remontado aqui; nunca o da pergunta */
  if (item.tipo === 'plano') {
    /* não confia na fila: cada cuidado tem de estar pago no plano que vale hoje, com a dose de hoje gasta na ficha (09/11/2026) */
    if (!itens.length || typeof doseDoDia !== 'function' || !itens.every((x) => doseDoDia(cadastro, texto(item.dia), texto(x && x.itemK))))
      return recusa('A ficha não tem este cuidado pago no plano, com a dose de hoje; nada foi enviado.');
    const a = typeof gerarPlano === 'function' ? gerarPlano({ nomeTutor: primeiroNome(r.nome), dia: texto(item.dia), peludos: [{ nome, sexo, cuidados: itens.map((x) => ({ itemK: texto(x && x.itemK) })) }] }) : null;
    if (!a || a.ok !== true || a.texto !== texto(item.texto)) return recusa('O texto não confere com o aviso aprovado para esta ficha; nada foi enviado.');
    return { ok: true };
  }
  const m = typeof gerar === 'function' ? gerar({ nomeTutor: primeiroNome(r.nome), nomePeludo: nome, sexo, dia: texto(item.dia), presencaConfirmada: true,
    cuidados: itens.map((x) => ({ itemK: texto(x && x.itemK), vence: texto(x && x.vence) })),
    veterinariaConfirmada: itens.some((x) => texto(x && x.itemK).startsWith('vac_')) }) : null;
  if (!m || m.ok !== true || m.texto !== texto(item.texto)) return recusa('O texto não confere com o texto aprovado para esta ficha; nada foi enviado.');
  return { ok: true };
}

/* Resposta de /chat/whatsappNumbers. Lança erro quando a dúvida é passageira (tenta de novo depois). */
function interpretarNumero(resposta, numero) {
  if (!resposta || resposta.status !== 200) throw Error('a consulta do número não respondeu');
  const itens = Array.isArray(resposta.corpo) ? resposta.corpo : [];
  const exatos = itens.filter((x) => objeto(x) && texto(String(x.number == null ? '' : x.number)).replace(/\D/g, '') === numero);
  if (exatos.length !== 1) throw Error('a consulta do número não foi conclusiva');
  if (exatos[0].exists === false) return { ok: false, motivo: 'Este telefone não tem WhatsApp. Confira o telefone do tutor na ficha.' };
  if (exatos[0].exists === true && JID.test(texto(exatos[0].jid))) return { ok: true, jid: texto(exatos[0].jid) };
  throw Error('a consulta do número não foi conclusiva');
}

/* Resposta de /message/sendText. Dúvida (sem resposta, erro do servidor) = Conferir, nunca reenviar sozinho. */
function interpretarEnvio(r, jid) {
  if (!r || r.erro) return { estado: 'conferir', motivo: 'O WhatsApp não respondeu a tempo; a mensagem pode ter saído.' };
  const key = objeto(r.corpo) && objeto(r.corpo.key) ? r.corpo.key : null;
  if ((r.status === 200 || r.status === 201) && key && texto(key.id) && (!key.remoteJid || key.remoteJid === jid)) return { estado: 'enviado', msgId: texto(key.id) };
  if (r.status === 200 || r.status === 201) return { estado: 'conferir', motivo: 'O WhatsApp aceitou, mas não devolveu a confirmação da mensagem.' };
  if (r.status === 401 || r.status === 403) return { estado: 'falhou', motivo: 'A Zelozinha está sem acesso ao WhatsApp.' };
  if (r.status >= 400 && r.status < 500) return { estado: 'falhou', motivo: `O WhatsApp recusou a mensagem (código ${r.status}).` };
  return { estado: 'conferir', motivo: `O WhatsApp respondeu com erro (código ${r.status}); a mensagem pode ter saído.` };
}

module.exports = { FILA, SAUDE, CONTROLE, VERSAO, SUFIXO_PLANO, PADRAO, itensNaChave, lerConfig, partesSP, diaSP, naJanela, proximoIntervalo, digitandoMs,
  escolherProximo, jaEsperou, irmaos, abandonados, saidaConfirmada, entradaConfirmada, dcKeyDoPelKey, telefone, responsavel, primeiroNome, conferirItem, interpretarNumero, interpretarEnvio };
