'use strict';
/*
 * RETRATO DO BANCO — a fonte de dados padrão dos testes (04/set/2026).
 *
 * POR QUE EXISTE
 * O consumo do Firebase bateu 694 MB em 24 h e a causa dominante éramos NÓS: cada rodada
 * do harness descia o banco real inteiro de novo. A VPS já guarda um backup diário
 * completo (`/var/backups/zeluz-firebase/zeluz-{daycare,auaulandia}-YYYY-MM-DD.json.gz`).
 * Este módulo baixa esse retrato UMA vez por dia (por ssh, canal que já existe — regra da
 * casa em ds-v8-publicar-vps.md) e o guarda em `tests/.retrato/`. Todas as rodadas do dia
 * leem do disco: zero tráfego no Firebase.
 *
 * O banco VIVO continua acessível — mas só de propósito: `HARNESS_VIVO=1 node tests/harness.js`.
 *
 * O retrato de cada arquivo é o CONTEÚDO do nó raiz correspondente:
 *   zeluz-daycare-*.json.gz    → conteúdo de `daycare/`
 *   zeluz-auaulandia-*.json.gz → conteúdo de `auaulandia/`
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..', '.retrato');
const VPS = 'root@187.77.63.227';
const CHAVE = path.join(os.homedir(), '.ssh', 'id_ed25519');
const REMOTO = '/var/backups/zeluz-firebase';

function isoDe(d) {
  const p = (x) => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function arquivoLocal(qual, dia) { return path.join(DIR, qual + '-' + dia + '.json'); }

// Baixa o retrato de UM dia por ssh e grava no cache local. Devolve o caminho ou null.
function baixar(qual, dia) {
  const destino = arquivoLocal(qual, dia);
  try {
    const cmd = 'ssh -i "' + CHAVE + '" -o StrictHostKeyChecking=no -o ConnectTimeout=20 ' + VPS +
      ' "zcat ' + REMOTO + '/zeluz-' + qual + '-' + dia + '.json.gz"';
    const buf = cp.execSync(cmd, { maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    if (!buf || !buf.length) return null;
    JSON.parse(buf.toString('utf8'));            // só grava retrato íntegro — meio JSON não serve
    fs.writeFileSync(destino, buf);
    return destino;
  } catch (e) {
    try { fs.unlinkSync(destino); } catch (e2) { /* não existia */ }
    return null;
  }
}

// O retrato mais novo que existir no cache local para `qual` (daycare|auaulandia).
function maisNovoLocal(qual) {
  try {
    const re = new RegExp('^' + qual + '-(\\d{4}-\\d{2}-\\d{2})\\.json$');
    const nomes = fs.readdirSync(DIR).filter((n) => re.test(n)).sort();
    return nomes.length ? path.join(DIR, nomes[nomes.length - 1]) : null;
  } catch (e) { return null; }
}

// Garante um retrato utilizável de `qual`: cache de hoje → baixa hoje → baixa ontem →
// o mais novo que houver no cache. Devolve {dia, dados} ou lança erro explicando o caminho.
function garantir(qual) {
  try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) { /* já existe */ }
  const hoje = new Date();
  const ontem = new Date(hoje.getTime() - 86400000);
  const tenta = [isoDe(hoje), isoDe(ontem)];
  for (const dia of tenta) {
    const f = arquivoLocal(qual, dia);
    if (fs.existsSync(f)) return { dia, dados: JSON.parse(fs.readFileSync(f, 'utf8')) };
  }
  for (const dia of tenta) {
    const f = baixar(qual, dia);
    if (f) return { dia, dados: JSON.parse(fs.readFileSync(f, 'utf8')) };
  }
  const velho = maisNovoLocal(qual);
  if (velho) {
    const dia = (path.basename(velho).match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || '?';
    console.warn('  ⚠ retrato de ' + qual + ': sem acesso à VPS — usando o mais novo do cache (' + dia + ')');
    return { dia, dados: JSON.parse(fs.readFileSync(velho, 'utf8')) };
  }
  throw new Error('Não há retrato de "' + qual + '" e não consegui baixar da VPS (' + VPS + ':' + REMOTO + ').\n' +
    'Confira a chave ssh (~/.ssh/id_ed25519) e a rede — ou rode uma vez com HARNESS_VIVO=1 (gasta banda do Firebase).');
}

// Carrega os dois retratos. Chamar UMA vez no início da rodada.
function carregar() {
  const dc = garantir('daycare');
  const au = garantir('auaulandia');
  return { dia: dc.dia, daycare: dc.dados, auaulandia: au.dados };
}

// Lê um caminho do banco ('daycare/cadastro', 'auaulandia/orcamentos'…) no retrato.
// Mesma semântica do REST: nó inexistente devolve null.
function ler(retrato, caminho) {
  const partes = String(caminho || '').split('/').filter(Boolean);
  if (!partes.length) return null;
  let no;
  if (partes[0] === 'daycare') no = retrato.daycare;
  else if (partes[0] === 'auaulandia') no = retrato.auaulandia;
  else return null;
  for (let i = 1; i < partes.length; i++) {
    if (no == null || typeof no !== 'object') return null;
    no = no[partes[i]];
  }
  return (no === undefined) ? null : no;
}

module.exports = { carregar, ler, DIR };
