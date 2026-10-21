'use strict';
/*
 * Amostras SINTÉTICAS para plantar defeitos nas provas das varreduras (Story 6.112, AC8.2).
 *
 * Regra: nenhum valor aqui é de verdade, e NENHUM vem escrito por inteiro neste arquivo. Cada amostra é
 * montada em tempo de execução, juntando pedaços (j('gh', 'p_', ...)), por dois motivos:
 *   1. este arquivo, e o repositório, não disparam a própria varredura nem o alerta de segredos do GitHub;
 *   2. ninguém copia daqui um valor que pareça real.
 * Os corpos são repetições óbvias ("AAAA...", "0000"), nunca um valor que já tenha existido.
 *
 * Usado só pelas provas (varredura.test.js e manual.test.js). O varredor (varredura.js) não importa este arquivo.
 */

const crypto = require('crypto');

const j = function () { return Array.prototype.join.call(arguments, ''); };

/** CPF válido montado a partir de nove dígitos (calcula os dois dígitos verificadores). */
function cpfComDigitos(base9) {
  const digitos = base9.split('').map(Number);
  const dv = (lista) => {
    const soma = lista.reduce((acc, d, i) => acc + d * (lista.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(digitos);
  const d2 = dv(digitos.concat(d1));
  return base9 + d1 + d2;
}

function formatarCpf(onze) {
  return onze.slice(0, 3) + '.' + onze.slice(3, 6) + '.' + onze.slice(6, 9) + '-' + onze.slice(9);
}

/** regra -> lista de linhas que o varredor TEM de achar. */
function positivas() {
  const cpf = cpfComDigitos('529982247');
  return {
    'chave-privada': [
      j('-----BEGIN ', 'RSA ', 'PRIVATE ', 'KEY-----'),
      j('-----BEGIN OPENSSH ', 'PRIVATE KEY-----'),
      j('-----BEGIN PGP ', 'PRIVATE KEY ', 'BLOCK-----'),
    ],
    'token': [
      j('gh', 'p_', 'A'.repeat(36)),
      j('github', '_pat_', 'A'.repeat(30)),
      j('xo', 'xb-', '1234567890-', 'abcdefghij'),
      j('ya', '29.', 'a'.repeat(30)),
      j('123456789', ':', 'A'.repeat(35)),
      j('Authorization: Bearer ', 'a'.repeat(30)),
    ],
    'jwt': [
      j('eyJ', 'hbGciOiJub25lIn0', '.', 'eyJ', 'zdWIiOiJ0ZXN0In0', '.', 'c2lnbmF0dXJl'),
    ],
    'chave-api': [
      j('AI', 'za', 'A'.repeat(35)),
      j('AK', 'IA', 'A'.repeat(16)),
      j('sk', '_live_', 'a'.repeat(24)),
      j('sk', '-', 'a'.repeat(30)),
    ],
    'credencial-atribuida': [
      j('api', 'key: "', 'a1b2c3d4e5f6a7b8c9d0', '"'),
      j("sen", "ha = '", 'Abc123Def456Ghi789', "'"),
      j('"to', 'ken": "', 'x9'.repeat(8), '"'),
      j('AUTOMATICO_', 'SECRET=', '"', 'k8'.repeat(10), '"'),
    ],
    // A chave escrita SEM aspas: linha Environment= de um drop-in do systemd, YAML, cabeçalho de um curl e endereço
    // (o risco 12 e o AC5.2 esperam justamente isto no espelho do drop-in; a chave do Evolution não tem prefixo de fornecedor).
    'credencial-sem-aspas': [
      j('Environment=EVOLUTION_', 'API_KEY=', 'a1b2c3d4e5f6a7b8c9d0e1f2'),
      j('Environment="AUTOMATICO_', 'SECRET=', 'k8k8k8k8k8k8k8k8k8k8k8k8', '"'),
      j('api', 'key: ', 'a1b2c3d4e5f6a7b8c9d0e1f2'),
      j("curl -H 'api", "key: ", "a1b2c3d4e5f6a7b8c9d0e1f2", "' https://servidor-de-mentira.exemplo.invalid/mensagem"),
      j('https://servidor-de-mentira.exemplo.invalid/mensagem?api', 'key=', 'a1b2c3d4e5f6a7b8c9d0e1f2', '&canal=1'),
      j('export EVOLUTION_', 'TOKEN=', 'Zx9Zx9Zx9Zx9Zx9Zx9Zx9'),
      j('sen', 'ha: ', 'Abc123Def456Ghi789Jkl'),
    ],
    // A chave com nome em português (QA, SEC-007): a Codex nomeia tudo em português. As três primeiras são as do QA (R1 a R3):
    // o nome do modelo da configuração, o da chave do Evolution num drop-in do systemd e «chave:» em YAML. O valor é sempre sintético.
    'chave-em-portugues': [
      j('"cha', 'veDoCanal": "', 'k9m2p4x7q1w8e3r5t6y0u2i4', '"'),
      j('Environment=EVOLUTION_', 'CHAVE=', 'k9m2p4x7q1w8e3r5t6y0u2i4'),
      j('cha', 've: ', 'k9m2p4x7q1w8e3r5t6y0u2i4'),
      j('"exemplo', 'ChaveDoCanal": "', 'k9m2p4x7q1w8e3r5t6y0u2i4', '"'),
      j('exemplo', 'ChaveDoCanal: ', 'k9m2p4x7q1w8e3r5t6y0u2i4'),
      j('"cha', 've-do-canal": "', 'k9m2p4x7q1w8e3r5t6y0u2i4', '"'),
      j('Environment="EVOLUTION_', 'CHAVE=', 'k9m2p4x7q1w8e3r5t6y0u2i4', '"'),
      j('export CHAVE_DO_', 'CANAL=', 'k9m2p4x7q1w8e3r5t6y0u2i4'),
      j("curl -H 'cha", "ve: ", "k9m2p4x7q1w8e3r5t6y0u2i4", "' https://servidor-de-mentira.exemplo.invalid/mensagem"),
      j('https://servidor-de-mentira.exemplo.invalid/mensagem?cha', 've=', 'k9m2p4x7q1w8e3r5t6y0u2i4', '&canal=1'),
      j('const cha', "ve = '", 'k9m2p4x7q1w8e3r5t6y0u2i4', "';"),
    ],
    'senha-em-endereco': [
      j('postgres', '://usuario:', 'abc123xyz', '@servidor-de-mentira.exemplo.invalid/base'),
      j('https', '://admin:', 'trocar123', '@exemplo.invalid'),
    ],
    'telefone-ddd': [
      j('(11) 9', '0000-', '0000'),
      j('+55 11 9', '0000-0000'),
      j('55119', '00000000'),
      j('11 9', '0000-0000'),
      j('(11) 3', '000-0000'),
    ],
    'jid-whatsapp': [
      j('55119', '00000000', '@s.whatsapp.net'),
      j('120363000000000000', '@g.us'),
      j('11900000000', '@c.us'),
    ],
    'email': [
      j('maria.sintetica', '@', 'servidor-de-mentira.com.br'),
      j('contato', '@', 'empresa-ficticia.com'),
    ],
    'cpf': [
      formatarCpf(cpf),
      cpf,
      j('CPF ', '000.000.000', '-00'),
    ],
    'ip-publico': [
      j('198.', '18.', '0.5'),
      j('100.', '64.', '0.9'),
      j('ssh usuario@', '198.19.', '3.4', ' -i chave'),
    ],
    'porta-ssh': [
      j('ssh -p ', '2222 usuario@servidor'),
      j('Port ', '2222'),
      j('https://', 'servidor-qualquer.exemplo.invalid', ':8443/saude'),
      j('scp -P ', '2200 a b'),
    ],
    'impressao-ssh': [
      j('SHA256', ':', 'A'.repeat(43)),
      j('ssh-ed', '25519 AAAA', 'C3NzaC1lZDI1NTE5', 'A'.repeat(40)),
    ],
  };
}

/** Linhas comuns que NÃO podem ser achadas (nome técnico, exemplo, máscara, versão, data, hash...). */
function negativas() {
  return [
    'Node 22.22.2 e Chrome 118.0.5993.70',
    'https://github.com/zoeharus-art/zeluz-hospedagem/pulls',
    'telefone mascarado (31) *****-1234',
    'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>',
    'logo@2x.png e icone@3x.webp',
    '10.0.0.1 e 192.168.0.10 e 127.0.0.1 e 0.0.0.0 e 203.0.113.9 e 192.0.2.1 e 198.51.100.4',
    'http://localhost:3000/saude e http://127.0.0.1:9000 (o emulador)',
    'ssh -p <porta> <usuario>@<servidor>',
    'Authorization: Bearer <token>',
    "const senha = '1111';",
    'postgres://usuario:<senha>@servidor/base',
    'piloto59/interno-20261019/painel81/2026-10-21',
    'R$ 148.391,61 em 2026-10-21T13:30:00-03:00',
    'instalada em 20/10/2026 às 21h12min46s',
    'actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab',
    'lodash@4.17.21',
    'timestamp 1729517400000',
    'zelozinha/runtime/automatico81/executar-automatico81.cjs',
    'sha256 ' + crypto.createHash('sha256').update('nada').digest('hex'),
    'usuario@exemplo.com e alguem@example.org',
    'senha: "nova senha do usuário"',
    '"token": "<segredo: fica só na VPS>"',
    'apikey: "${EVOLUTION_CHAVE}"',
    'o app de 20-04 e a 106 (release automatico106-1225a25c)',
    // dado inventado que a varredura aceita (convenção do LEIA-ME): DDD 00, CPF só de zeros, e-mail de exemplo
    'telefone de teste (00) 90000-0000 e +55 00 90000-0000',
    'cpf de teste 00000000000 e 11111111111',
    'contato@exemplo.invalid',
    "const SENHA_NOVA = 'segredo-de-mentira-do-teste-123456';",
    // configuração sem aspas que NÃO é segredo: fuso, modo, caminhos, variáveis, marcadores, datas, nomes de arquivo e código
    'Environment=TZ=America/Sao_Paulo e Environment=NODE_ENV=production',
    'LoadCredential=evolution-key:/etc/zeluz-piloto/chave-evolution-2026.txt',
    'Environment=EVOLUTION_API_KEY_ARQUIVO=/etc/zeluz-piloto/evolution-api-key-2026.txt',
    'EnvironmentFile=/etc/zeluz-piloto/segredos.env',
    'apikey: ${EVOLUTION_CHAVE}',
    'curl -H "apikey: $EVOLUTION_CHAVE" https://servidor-de-mentira.exemplo.invalid/mensagem',
    'curl -H apikey:<chave> https://servidor-de-mentira.exemplo.invalid/mensagem?apikey=<chave>&canal=1',
    'token_expira: 2026-10-21T13:30:00-03:00',
    'senha: sem valor nesta linha de texto corrido, escrita só para explicar',
    'api_key_do_servico: usar-a-chave-de-exemplo-0000000000',
    'cache_key: compute.cache.chave20261021abcd',
    'sort_key: senhas-fixas-20261021-revisadas.json',
    'secret: false',
    'token: null',
    'password: ******************',
    '.senha-input:focus{outline:0}',
    // «chave» no nome, valor que NÃO é segredo: marcador, variável, máscara, caminho, nome de campo, data, texto, "exemplo"
    '"chaveDoCanal": "<segredo: fica só na VPS>"',
    '"exemploChaveDoCanal": "<segredo: fica só na VPS>"',
    'chave: ${EVOLUTION_CHAVE}',
    'curl -H "chave: $EVOLUTION_CHAVE" https://servidor-de-mentira.exemplo.invalid/mensagem',
    'curl -H chave:<chave> https://servidor-de-mentira.exemplo.invalid/mensagem?chave=<chave>&canal=1',
    'Environment=EVOLUTION_CHAVE_ARQUIVO=/etc/zeluz-piloto/chave-evolution-2026.txt',
    'LoadCredential=chave-evolution:/etc/zeluz-piloto/chave-evolution-2026.txt',
    'chave: usar-a-chave-de-exemplo-0000000000',
    'chave_do_canal: nome-do-canal-principal-da-casa',
    'chaveDoCanal: 2026-10-21T13:30:00-03:00',
    'chave: ******************',
    'chave: null',
    '"chave": "nome-do-canal-principal"',
    '"chave": "************************"',
    "const chave = 'valor-de-exemplo-do-canal-0001';",
    'a chave de acesso fica só na VPS e nunca vai para o projeto',
  ];
}

/**
 * Linhas de um arquivo do APP que têm «Chave» no nome e um valor que parece hexadecimal: são identificadores de registro (a impressão
 * digital de uma função, por exemplo), não segredo. A regra da «chave» em português vale só na superfície do projeto novo, então
 * NENHUMA destas pode ser achada fora dela (a prova V20 confere). Os valores são inventados e os nomes, montados em execução.
 */
function registrosDoApp() {
  return [
    j('    rep', 'FaltaChave: ', "'", '1a2b3c4d5e6f7a8b', "', rep", 'VeioChave: ', "'", '9f8e7d6c5b4a3921', "',"),
    j('  const BASE = { pend', 'ChaveDoLancamento: ', "'", 'a1b2c3d4e5f60789', "', pendGravar: '", '0123456789abcdef', "' };"),
    j('const BASE2 = {"orcFeriados', 'Chave": "', 'f0e1d2c3b4a59687'.repeat(4), '"};'),
    j('    contatoEstadia', 'Chave: ', "'", '0f1e2d3c4b5a6978', "',"),
  ];
}

module.exports = { cpfComDigitos, formatarCpf, j, negativas, positivas, registrosDoApp };
