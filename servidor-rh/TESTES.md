# Evidência local — backend RH 151

Data: 2026-10-26.

Execução somente com Node/CreateRequire, requests/responses falsos, relógio injetado e banco em memória. Nenhuma porta foi aberta.

## Resultado

- `auth.test.cjs` — OK.
- `dados.test.cjs` — OK.
- `api.test.cjs` — OK.
- `startup.test.cjs` — OK.
- A prova integrada cliente-servidor foi executada em outra candidata; não integra este pacote isolado.
- A prova do cliente da candidata original passou naquela rodada; a prova integrada do projeto deve ser executada novamente após o transporte.

Na rodada anterior, o teste cruzado usou respostas serializadas pelo handler e os módulos da candidata original: login de Adriana, leitura vazia, criação, ACK151, reconsulta do dia, consulta mensal, saída e recusa posterior passaram sem servidor real.

## Cobertura relevante

- scrypt e duas credenciais distintas;
- principais permitidos e terceiros negados;
- segredo incorreto, rate limit, IP confiável, expiração, saída e token forjado;
- CORS permitido sem bearer continua 401;
- URL absoluta, role, autoria e path no corpo não autorizam;
- sessão expirada durante leitura não devolve dados;
- namespace fixo, sem acesso a `daycare`;
- dados inválidos, uma consulta mensal e remoção do observador;
- timeout remove observador;
- idempotência em nova instância e conflito de conteúdo;
- CAS/revisão/autoria e ACK forjado de cancelar/reativar;
- composição fail closed sem configuração/Admin/IP reais;
- `criarServidor` não inicia escuta;
- compatibilidade cliente-backend e logout.
- revogação entre retries transacionais impede commit;
- expiração após commit bloqueia o ACK sem repetir a escrita internamente, e retry externo conserva um item;
- falha real do banco continua `BANCO_INDISPONIVEL`, sem expor host;
- concorrência de scrypt e total de sessões são limitados;
- mapa de falhas permanece limitado e satura em modo fechado;
- slow body retorna 408 e remove os listeners HTTP.

## Limites

Não houve Firebase, Admin SDK real, regras vivas, rede, HTTP real, socket, navegador, GUI, VPS ou implantação. As provas não confirmam ambiente de produção.

## SHA-256 das fontes principais

- `auth.js`: `06a18fc58dedf10be22a2d697e38f7609e26e194b24bd44a91f53d36a8c9bec0`
- `dados.js`: `511bbed52c2d1cb3290c65f51995879a043442beb34846c96a630f4ca099a980`
- `api.js`: `7cf6ece52b216a2d1b47d60394fee60ed06d9d6a0e28d406dc13b9a19280573f`
- `startup.modelo.js`: `3d917d9f6434b7bc437a45cd1705a1f79fd5ee55bb0ec3a1f226718c94d55175`
