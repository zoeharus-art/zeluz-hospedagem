# Adaptador de produção RH151 — ainda não instalado

Este diretório contém somente a camada nova de inicialização e modelos de implantação. O backend funcional `auth.js`, `dados.js`, `api.js` e `startup.modelo.js` continua sendo o pacote revisado da Frente 151 e deve ser copiado sem alteração para o mesmo release durante uma implantação autorizada.

## Estado confirmado

- Node compatível e dependências compartilhadas confirmadas no runtime existente.
- `firebase-admin` 14.5.0 e `google-auth-library` 11.3.1 são carregados somente do diretório compartilhado de leitura.
- O runtime existente aponta para esse mesmo diretório.
- A origem HTTPS pública já aprovada está congelada em `auaulandia/ponte121/config-publica116.js`. A rota RH deve reutilizar o mesmo host e acrescentar somente `/rh151`; o valor não é duplicado neste pacote.
- Há Traefik e nginx em Docker. Os modelos novos criam um proxy RH isolado sem alterar os containers existentes; rede, entrypoint, prioridade e CIDR ainda precisam ser confirmados antes da renderização.
- Não existe serviço RH instalado.

## Proxy preferido

O modelo preferido agora é `proxy-node151.js` com `compose-proxy-node151.modelo.yml`. Ele reutiliza a imagem Node já presente, sem depender de pull ou de nginx dentro da imagem do `controle116`. O container não publica porta no host, não recebe ambiente ou secrets, aceita somente o prefixo `/rh151` e encaminha para a socket Unix fixa. Cabeçalhos de autenticação e origem seguem para a API151, que continua responsável por autenticação, autorização e CORS.

O compose usa `entrypoint: ["node"]`, resolvido pelo `PATH` da imagem. A leitura sanitizada confirmou Node v22.23.4 em `/usr/local/bin/node`; usar `/usr/bin/node` do host seria incorreto. A imagem final ainda deve ser fixada por digest na renderização.

O proxy ignora `X-Forwarded-For` recebido e identifica apenas o peer TCP imediato, portanto o rate limit por IP da API vê o Traefik como uma única origem; o limite global continua ativo. Confiar no IP final exigiria uma cadeia de proxies formalmente configurada e não foi inferido nesta etapa.

Os modelos nginx permanecem como histórico revisável, mas não são a opção recomendada para esta ativação.

A unit do backend mantém o Node com JIT normal. `MemoryDenyWriteExecute=true` foi removido porque é incompatível com o comportamento usual do V8; não foi imposto `--jitless` sem prova de compatibilidade e desempenho no runtime real. As demais restrições da unit permanecem.

Os 12 arquivos do backend151 pertencem ao commit `cdc32dd`. Uma ausência temporária no checkout esparso não representa perda no Git e não autoriza copiar uma candidata antiga. A restauração deve usar os bytes exatos desse commit e nunca sobrescrever os arquivos novos deste adaptador.

## Falha fechada

Nada abre socket no `require()`. A inicialização explícita recusa:

- arquivo modelo ou configuração sem `modelo:false`;
- URL do banco não HTTPS/exata;
- origem do frontend não aprovada pelo backend;
- qualquer principal além de `adriana` e `marcia`;
- hashes/salts ausentes ou inválidos;
- caminho ou versão diferente das dependências confirmadas;
- TCP em lugar do socket Unix fixo;
- socket preexistente;
- Admin SDK sem Application Default Credentials ou banco injetado válido.

O Admin é inicializado como app nomeado separado. Nenhuma chave, conta ou regra é criada. A configuração modelo é deliberadamente inválida e não contém URL real, senha ou verificador real.

O serviço reutiliza o ADC e o Admin SDK existentes. O código desta aplicação só constrói referências dentro do prefixo fixo `rh-entrevistas-v1/entrevistas`; esse prefixo não vem do navegador nem da configuração. Isso limita o comportamento do código RH, mas não reduz a capacidade IAM já existente da credencial Admin. Nenhuma chave, conta, regra ou permissão IAM é criada ou ampliada por este pacote.

## Credenciais

`gerar-verificadores151.js` exige TTY, não aceita segredo por argumento ou variável de ambiente, oculta a digitação, rejeita senhas iguais e usa o KDF já testado em `auth.js`. Ele emite apenas salts e hashes. A execução deve ocorrer em sessão administrativa privada; o JSON resultante entra no arquivo privado de configuração com modo restrito. Senhas não devem ser gravadas nem enviadas pelo chat.

## Plano exato quando houver autorização de instalação

1. Gerar um release imutável novo em `/opt/zeluz-rh151/releases/<id>`, sem tocar nos serviços existentes.
2. Copiar o backend151 congelado e estes arquivos novos; conferir hashes locais/remotos.
3. Preparar fora do repositório `/etc/zeluz-rh151/config.json`, com URL do banco, origem HTTPS e verificadores aprovados. Não incluir senhas.
4. Rodar `preflight-rh151.sh <release>`; todos os campos precisam ser `true`.
5. Renderizar a unit substituindo somente `@@RELEASE_DIR@@`. Revisar com `systemd-analyze verify`; não iniciar ainda.
6. Ler a regra Traefik já existente somente para preencher `@@HOST_EXISTENTE@@`, `@@ENTRYPOINT_HTTPS_EXISTENTE@@`, `@@REDE_TRAEFIK_EXISTENTE@@`, prioridade e CIDR. O router novo deve combinar o mesmo `Host(...)` com `PathPrefix(`/rh151`)` e ter prioridade explícita sobre a rota geral.
7. Renderizar `compose-proxy-node151.modelo.yml` com a imagem Node já confirmada por digest, IDs privados do usuário existente, release e metadados do router. O container novo é somente leitura, não publica porta no host e monta apenas o arquivo do proxy e o diretório da socket.
8. Confirmar acesso ao socket `0660` pelo GID explícito do proxy. Não usar `0666`, não editar/reiniciar `controle116` e não alterar os containers Traefik/nginx existentes.
9. Fazer backup recuperável apenas dos arquivos de proxy/unit que forem efetivamente adicionados.
10. Instalar a unit e o proxy RH novos. Não reiniciar Zelozinha, ponte ou outros serviços.
11. Iniciar somente `zeluz-rh151.service` e o container `proxy-rh151`; verificar socket, log sanitizado e rota pela origem autorizada sem consultar conteúdo real.
12. Só então preencher no frontend o endereço já aprovado acrescido de `/rh151` e publicar a versão aprovada em etapa separada. `ENDERECO_RH` permanece vazio até essa autorização.

## Rollback

Desabilitar e parar apenas `zeluz-rh151.service`, retirar somente a rota RH nova, restaurar o backup do proxy se ele tiver sido alterado e remover o socket já inativo. Os serviços Zelozinha/ponte e o SDK compartilhado não são modificados. Dados no namespace RH não são apagados no rollback.

## Lacunas que ainda impedem ativação

- valores reais da regra existente: host, entrypoint, rede, prioridade e CIDR;
- GID autorizado para o proxy acessar a socket Unix;
- URL exata do banco já aprovado para o Admin existente;
- arquivo privado com dois verificadores pessoais;
- parâmetros operacionais reais de TTL, rate limit e timeouts.

Nenhuma dessas lacunas deve ser preenchida por suposição.

## Testes locais adicionais

- `node servidor-rh/proxy-node151.test.cjs`: roteamento, query, métodos, travessia, limite de corpo, timeouts, socket, erros, cabeçalhos e compose, tudo com fakes.
- `node servidor-rh/proxy-rh151.test.cjs`: preserva a prova estática do modelo nginx histórico.
