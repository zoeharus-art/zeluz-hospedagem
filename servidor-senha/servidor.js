'use strict';
/*
 * SERVIDOR DA SENHA — Rota A (Fase 0 do PRD-006, 25/set/2026)
 *
 * Roda na VPS da Kairós (kairospresenca.com.br), atrás do nginx. Recebe {pin, aparelho} do
 * celular, confere com a conta de logica.js e, quando a senha é certa, devolve um token do
 * Firebase com o papel dentro (custom token, Admin SDK — R$ 0,00, sem sair do plano gratuito).
 *
 * NADA SECRETO FICA AQUI. O repositório é público. Os segredos moram em arquivos do próprio
 * servidor, fora do repositório, legíveis só pelo usuário do serviço (chmod 600):
 *   CONTA_SERVICO  — a chave da conta de serviço do Firebase (JSON baixado do Console)
 *   SENHAS_FIXAS   — as senhas fixas da Gestão e do plantão ({"pin": {role, nome, ...}})
 * O passo a passo está no LEIA-ME.md desta pasta.
 *
 * Rotas:
 *   POST /entrar   {pin, aparelho}  → ver `decidir` em logica.js
 *   GET  /saude                     → {ok:true} (para o monitor da VPS)
 */

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const L = require('./logica');

const CFG = {
  porta: Number(process.env.PORTA || 8787),
  host: process.env.HOST || '127.0.0.1',                 // só o nginx fala com ele
  origens: String(process.env.ORIGENS || 'https://zoeharus-art.github.io').split(',').map((s) => s.trim()).filter(Boolean),
  contaServico: process.env.CONTA_SERVICO || '/etc/zeluz/conta-servico.json',
  senhasFixas: process.env.SENHAS_FIXAS || '/etc/zeluz/senhas-fixas.json',
  dbUrl: process.env.DB_URL || 'https://hospedagem-zeluz-default-rtdb.firebaseio.com',
};

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(CFG.contaServico, 'utf8'))),
  databaseURL: CFG.dbUrl,
});
const db = admin.database();

// A equipe muda pela tela Time → Colaboradores: relê a cada minuto, no máximo.
let cacheEquipe = { ts: 0, v: null };
async function equipe() {
  if (cacheEquipe.v && Date.now() - cacheEquipe.ts < 60 * 1000) return cacheEquipe.v;
  const s = await db.ref('daycare/config/monitores').once('value');
  cacheEquipe = { ts: Date.now(), v: s.val() || [] };
  return cacheEquipe.v;
}
let cacheFixas = { ts: 0, v: null };
function fixas() {
  if (cacheFixas.v && Date.now() - cacheFixas.ts < 60 * 1000) return cacheFixas.v;
  cacheFixas = { ts: Date.now(), v: JSON.parse(fs.readFileSync(CFG.senhasFixas, 'utf8')) };
  return cacheFixas.v;
}
async function aparelhoLiberado(id) {
  if (!L.idAparelhoValido(id)) return false;
  const s = await db.ref('auaulandia/aparelhos/' + id).once('value');
  return !!s.val();
}

const porIp = L.criarLimitador({ max: 5, janelaMs: 10 * 60 * 1000, bloqueioMs: 15 * 60 * 1000 });
const geral = L.criarLimitador({ max: 60, janelaMs: 10 * 60 * 1000, bloqueioMs: 10 * 60 * 1000 });
setInterval(() => { const t = Date.now(); porIp.limpar(t); geral.limpar(t); }, 5 * 60 * 1000).unref();

// O rastro de cada tentativa — SEM a senha. O endereço vai resumido (impressão digital curta):
// dá para ver que foi o mesmo lugar tentando, sem guardar o endereço de ninguém.
function registrar(ok, motivo, pedido, perfil) {
  const agora = new Date();
  const p = (x) => String(x).padStart(2, '0');
  const dia = agora.getFullYear() + '-' + p(agora.getMonth() + 1) + '-' + p(agora.getDate());
  const reg = {
    ts: agora.getTime(), ok: !!ok, motivo: String(motivo || ''),
    aparelho: String(pedido.aparelho || '').slice(0, 80),
    origem: crypto.createHash('sha256').update(String(pedido.ip || '-')).digest('hex').slice(0, 12),
  };
  if (perfil) { reg.nome = String(perfil.nome || ''); reg.role = String(perfil.role || ''); }
  return db.ref('auaulandia/logins-servidor/' + dia).push(reg)
    .catch((e) => console.error('Não consegui gravar o rastro do login:', e.message));
}

function ipDe(req) {
  // Atrás do nginx, o endereço de verdade vem no cabeçalho — e só se confia nele quando a
  // conexão veio do próprio servidor (o nginx).
  const direto = String(req.socket.remoteAddress || '');
  const local = direto === '127.0.0.1' || direto === '::1' || direto === '::ffff:127.0.0.1';
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (local && xff) ? xff : direto;
}
function cors(req, res) {
  const o = String(req.headers.origin || '');
  if (CFG.origens.indexOf(o) >= 0) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}
function responder(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}

const servidor = http.createServer((req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const caminho = String(req.url || '').split('?')[0].replace(/\/+$/, '');
  if (req.method === 'GET' && caminho.endsWith('/saude')) return responder(res, 200, { ok: true });
  if (req.method !== 'POST' || !caminho.endsWith('/entrar')) return responder(res, 404, { ok: false, erro: 'rota' });

  let corpo = '';
  req.on('data', (c) => {
    corpo += c;
    if (corpo.length > 2048) { responder(res, 413, { ok: false, erro: 'pedido' }); req.destroy(); }
  });
  req.on('end', async () => {
    if (res.writableEnded) return;
    let dados = {};
    try { dados = JSON.parse(corpo || '{}'); } catch (e) { return responder(res, 400, { ok: false, erro: 'pedido' }); }
    const pedido = { pin: dados.pin, aparelho: dados.aparelho, ip: ipDe(req) };
    try {
      const r = await L.decidir(pedido, {
        agora: () => Date.now(),
        tabela: async () => L.montarTabela(fixas(), await equipe()),
        aparelhoLiberado, porIp, geral,
      });
      if (r.status === 200) {
        r.corpo.token = await admin.auth().createCustomToken(L.uidDoPerfil(r.perfil), L.claimsDoPerfil(r.perfil));
      }
      registrar(r.status === 200, r.corpo.erro || (r.corpo.aparelhoNovo ? 'aparelho-novo' : 'entrou'), pedido,
        (r.status === 200 || r.status === 403) ? r.perfil : null);
      return responder(res, r.status, r.corpo);
    } catch (e) {
      // Falha do servidor NÃO vira "senha errada": o celular precisa saber que o problema é
      // aqui, para a equipe não achar que esqueceu a senha.
      console.error('Erro ao conferir a senha:', e && e.message);
      return responder(res, 503, { ok: false, erro: 'servidor' });
    }
  });
});

servidor.listen(CFG.porta, CFG.host, () => {
  console.log('Servidor da senha no ar em ' + CFG.host + ':' + CFG.porta + ' — origens aceitas: ' + CFG.origens.join(', '));
});
