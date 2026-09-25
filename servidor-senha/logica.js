'use strict';
/*
 * A CONTA DA SENHA NO SERVIDOR — Rota A (Fase 0 do PRD-006, 25/set/2026)
 *
 * Hoje o app confere a senha DENTRO do navegador: as senhas fixas estão escritas no código da
 * página (que é pública) e as da equipe moram em daycare/config/monitores, que qualquer sessão
 * logada lê. Quem abre o código-fonte entra como Gestão. A Rota A (decidida pela Adriana em
 * 25/set: "ok" para todas as recomendações) muda o lugar da conferência: o celular manda a
 * senha para este servidor (VPS Kairós), o servidor confere e devolve um TOKEN do Firebase com
 * o papel dentro. A equipe continua digitando o mesmo PIN — nada muda para elas.
 *
 * Este arquivo é só CONTA: não fala com rede nem com banco. É ele que o teste morde
 * (tests/servidor-senha.test.js). Quem fala com o mundo é o servidor.js.
 *
 * As regras que ele reproduz são as MESMAS do app (auaulandia/index.html):
 *   · senhasRuntime(): senhas fixas + equipe; a equipe nunca sobrescreve uma senha fixa;
 *   · o papel da equipe sem `role` vale 'monitor' (o mesmo `m.role||'monitor'` da tela);
 *   · TRAVA DE APARELHO PARA TODOS (Adriana, 05/ago/2026): só entra em aparelho liberado pela
 *     Gestão — e a Gestão entra em aparelho novo para poder liberá-lo.
 */

const PIN_RE = /^[0-9]{4,6}$/;
const APARELHO_RE = /^[A-Za-z0-9_-]{6,80}$/;

function normalizarPin(pin) {
  const s = String(pin == null ? '' : pin).trim();
  return PIN_RE.test(s) ? s : '';
}
function idAparelhoValido(id) { return APARELHO_RE.test(String(id || '')); }

// A tabela de senhas: as FIXAS (arquivo do servidor, fora do repositório) e a EQUIPE
// (daycare/config/monitores). Devolve {pin: perfil}.
function montarTabela(fixas, equipe) {
  const mapa = {};
  Object.keys(fixas || {}).forEach((pin) => {
    const p = normalizarPin(pin);
    if (p) mapa[p] = Object.assign({}, fixas[pin], { fonte: 'fixa' });
  });
  const lista = Array.isArray(equipe) ? equipe : Object.values(equipe || {});
  lista.forEach((m) => {
    if (!m) return;
    const p = normalizarPin(m.senha);
    if (!p || mapa[p]) return;                       // a equipe nunca sobrescreve uma senha fixa
    mapa[p] = {
      role: String(m.role || 'monitor').trim() || 'monitor',
      nome: String(m.nome || '').trim(),
      monId: String(m.id || '').trim(),
      fonte: 'equipe',
    };
  });
  return mapa;
}

function ehGestao(perfil) { return !!perfil && (perfil.role === 'gestao' || perfil.role === 'diretoria'); }

function slug(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// O uid do token: estável por PESSOA (o mesmo colaborador ganha sempre o mesmo uid), para o
// rastro do banco dizer quem gravou. O Firebase aceita até 128 caracteres.
function uidDoPerfil(perfil) {
  const base = perfil.monId || slug(perfil.nome) || 'sem-nome';
  return ('zeluz-' + slug(perfil.role || 'x') + '-' + base).slice(0, 120);
}
// O que vai DENTRO do token (custom claims — o Firebase limita a 1.000 bytes). Só o que as
// regras do banco precisam: papel, nome, id do colaborador e a marca da Diretoria.
function claimsDoPerfil(perfil) {
  return {
    role: String(perfil.role || ''),
    nome: String(perfil.nome || '').slice(0, 80),
    monId: String(perfil.monId || '').slice(0, 40),
    diretoria: !!perfil.souAdriana,
  };
}
// O perfil que volta para o celular — o mesmo formato que o app já usa em entrarComoPessoa.
// A senha NUNCA volta.
function perfilPublico(perfil) {
  const out = {};
  Object.keys(perfil || {}).forEach((k) => { if (k !== 'senha' && k !== 'fonte') out[k] = perfil[k]; });
  return out;
}

// ---- o freio contra quem tenta adivinhar ------------------------------------------------
// Um PIN de 4 dígitos tem 10.000 combinações: sem freio, um robô testa todas em minutos.
// Três freios (revistos pelo QA da Fase 0, 25/set/2026):
//   · por APARELHO + endereço: 5 erros em 10 min → 15 min parado. É o da digitação errada:
//     trava só o celular que errou, não a loja inteira (que sai por UM endereço só);
//   · por ENDEREÇO: 20 erros em 10 min → 15 min parado. Segura quem troca o id do aparelho;
//   · o GERAL: 150 erros em 10 min de qualquer lugar → 5 min parado. Só acontece sob ataque
//     espalhado por muitos endereços — e é melhor a casa esperar 5 min do que perder a senha.
// ACERTAR NÃO ZERA os erros: quem tem um PIN válido (qualquer colaborador) não pode alternar
// 4 erros e 1 acerto para testar o espaço inteiro sem nunca ser barrado.
function criarLimitador(op) {
  op = op || {};
  const max = op.max || 5;
  const janela = op.janelaMs || 10 * 60 * 1000;
  const bloqueio = op.bloqueioMs || 15 * 60 * 1000;
  const reg = new Map();
  return {
    situacao(chave, agora) {
      const r = reg.get(chave);
      if (r && r.ate > agora) return { bloqueado: true, esperaMs: r.ate - agora };
      return { bloqueado: false, esperaMs: 0 };
    },
    falhou(chave, agora) {
      const r = reg.get(chave) || { falhas: [], ate: 0 };
      r.falhas = r.falhas.filter((t) => agora - t < janela);
      r.falhas.push(agora);
      if (r.falhas.length >= max) { r.ate = agora + bloqueio; r.falhas = []; }
      reg.set(chave, r);
      return r.ate > agora;
    },
    acertou() { /* de propósito: acertar não zera os erros (ver o comentário acima) */ },
    limpar(agora) {
      for (const [k, r] of reg) {
        if (r.ate <= agora && !r.falhas.some((t) => agora - t < janela)) reg.delete(k);
      }
    },
    tamanho() { return reg.size; },
  };
}

/*
 * A DECISÃO. Recebe o pedido e as dependências (tabela, aparelho liberado, freios, relógio) e
 * devolve {status, corpo, perfil?}. Não cria token — quem cria é o servidor, só quando
 * status === 200.
 *   200 {ok:true, perfil, aparelhoNovo?}  — entra (aparelhoNovo: Gestão em aparelho novo,
 *                                           que o app oferece para liberar)
 *   400 {ok:false, erro:'pedido'}         — senha fora do formato ou aparelho sem id
 *   401 {ok:false, erro:'senha'}          — senha errada
 *   403 {ok:false, erro:'aparelho'}      — senha certa em aparelho não liberado (sem o nome)
 *   429 {ok:false, erro:'espera', esperaSeg} — freio acionado
 */
async function decidir(pedido, dep) {
  const agora = dep.agora();
  const ip = String(pedido.ip || '-');
  const aparelho = String(pedido.aparelho || '');
  const chaveAp = ip + '|' + aparelho;
  const sits = [dep.porAparelho.situacao(chaveAp, agora), dep.porIp.situacao(ip, agora), dep.geral.situacao('geral', agora)];
  if (sits.some((x) => x.bloqueado)) {
    const espera = Math.max.apply(null, sits.map((x) => x.esperaMs));
    return { status: 429, corpo: { ok: false, erro: 'espera', esperaSeg: Math.ceil(espera / 1000) } };
  }
  const pin = normalizarPin(pedido.pin);
  if (!pin || !idAparelhoValido(aparelho)) {
    return { status: 400, corpo: { ok: false, erro: 'pedido' } };
  }
  const tabela = await dep.tabela();
  const perfil = tabela[pin];
  if (!perfil) {
    dep.porAparelho.falhou(chaveAp, agora);
    dep.porIp.falhou(ip, agora);
    dep.geral.falhou('geral', agora);
    return { status: 401, corpo: { ok: false, erro: 'senha' } };
  }
  const liberado = await dep.aparelhoLiberado(aparelho);
  if (!liberado && !ehGestao(perfil)) {
    // Sem o nome: a resposta não pode dizer, a quem está num aparelho estranho, de quem é o
    // PIN que acabou de acertar (QA da Fase 0). O app já sabe dizer "aparelho não liberado".
    return { status: 403, corpo: { ok: false, erro: 'aparelho' }, perfil };
  }
  return { status: 200, corpo: { ok: true, perfil: perfilPublico(perfil), aparelhoNovo: !liberado }, perfil };
}

module.exports = {
  normalizarPin, idAparelhoValido, montarTabela, ehGestao, slug,
  uidDoPerfil, claimsDoPerfil, perfilPublico, criarLimitador, decidir,
};
