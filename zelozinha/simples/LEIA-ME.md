# Zelozinha simples

Pedido da Adriana (29/10/2026): «Quero que a zelozinha entre no app da forma mais simples possível, para mandar essas mensagens. Com menos gasto de tudo, e da forma mais tranquila, mandando mensagem devagar como se fosse um humano.»

## Como funciona

1. **A fila nasce no check-in.** Quando o check-in do corpo é salvo, o app confere o que o FILHOt tem devendo hoje e ainda sem resposta. Depois monta a mensagem com o texto aprovado (`mensagem-unica41`, sem mudar uma letra) e grava **um** item em `daycare/zelozinha-fila/<dia>/<dcKey>`. O item que já existe nunca é sobrescrito.
2. **O serviço só envia.** De segunda a sexta, das 7h às 13h (São Paulo), ele pega o item «pronto» mais antigo e mostra «digitando…» por 4 a 9 segundos antes de enviar. Depois espera de 3 a 7 minutos, sorteados, até o próximo.
3. **Cada item tem o seu estado:**
   - `pronto`: está na fila.
   - `enviando`: está saindo agora.
   - `enviado`: saiu.
   - `conferir`: o WhatsApp não confirmou. Só esse item para; o resto segue.
   - `falhou`: o WhatsApp recusou, ou o telefone não tem WhatsApp.
   - `cancelado`: o FILHOt saiu antes do envio.
4. **Sinal de vida.** A cada 2 minutos, o serviço grava em `daycare/zelozinha-saude/vps` a hora e o estado do WhatsApp. Sem sinal por mais de 5 minutos, a tela mostra a faixa vermelha «Zelozinha parada».
5. **Pausa.** O botão da tela grava em `daycare/zelozinha-controle/estado`, e quem pode usar é a Diretoria ou a Supervisão. O serviço respeita a pausa no próximo passo.
6. **Depois do envio, é humano.** Os botões dos cartões continuam os mesmos.
7. **WhatsApp caiu: quem está na loja reconecta.** O pedido da Adriana (30/10/2026) foi: «Ela não pode parar por falta de conexão, um humano tem que assumir, e quem estiver na loja no momento.»
   - **A cada 20 segundos**, o serviço confere a conexão. Quando o estado muda, ele grava em `daycare/zelozinha-saude/vps` na hora.
   - **Enquanto o WhatsApp está fora, nada sai**: as mensagens esperam na fila.
   - **QR na tela:** depois de duas checagens seguidas fora do ar, o serviço grava o QR em `daycare/zelozinha-qr/vps`, e só regrava quando o código troca. A tela mostra o cartão «Reconectar o WhatsApp» para a consultora, a recepção, a supervisora e a diretoria. Para o monitor e o plantonista, ela pede que chamem uma delas.
   - **«Já escaneei»:** o botão grava em `daycare/zelozinha-controle/reconexao`, e o serviço confere a conexão na hora.
   - **De volta ao ar:** quando o WhatsApp volta, o QR é apagado e a tela mostra quem reconectou e a que horas.
   - **Só o celular da Zêluz:** o banco não sabe quem é consultora (o app entra sem login individual), então qualquer pessoa com o app pode ver o QR. Por isso, ao reconectar, o serviço confere o número conectado contra `numeroZeluz` da configuração. Se for outro, desconecta na hora, nada é enviado e a tela avisa.
   - **Sem `numeroZeluz` na configuração,** não há QR. O serviço só acompanha o estado e espera, como antes.

O serviço não escolhe quem recebe: isso nasce no app. Ele também **não confia na fila**. Antes de cada envio, confere no banco cinco coisas:
- o item está na chave do FILHOt, e essa chave sai da chave da ficha (a mesma regra do app);
- o nome do FILHOt é o da ficha;
- o FILHOt tem check-in hoje;
- o telefone é o do tutor principal da ficha;
- o texto é exatamente o texto aprovado para aqueles cuidados, remontado pelo próprio serviço.

Se algo não bater, nada sai e o item fica «Não enviada». Assim, nem quem consegue gravar no banco faz o WhatsApp da Zêluz mandar outra coisa ou para outra pessoa. Se o FILHOt já saiu, o envio é cancelado. O serviço grava só o estado do item e o sinal de vida.

## Regras que continuam

- Vacina só entra na mensagem com a veterinária confirmada no dia, e nunca na quinta. Sem a confirmação, a mensagem sai com os outros cuidados, e a vacina aparece no cartão como contato humano.
- A troca da escova fica com a equipe.
- Ficha com `comunicacaoZelozinha.modo: humano` não entra na fila.
- Quem recebe é o tutor principal da ficha (Tutor 1 ou Tutor 2), com o telefone dele. Sem telefone, o check-in avisa a recepção.
- Na dúvida, o item vai para Conferir. Nada é reenviado sozinho, nem depois de um reinício.

**Diferença para a versão antiga:** irmãos com o mesmo tutor recebem uma mensagem por FILHOt, uma de cada vez, com o intervalo entre elas.

## Arquivos

| Arquivo | O que é |
|---|---|
| `nucleo.js` | As decisões, sem rede e sem banco: horário, intervalo, próximo da fila e leitura das respostas do WhatsApp |
| `zelozinha.js` | O serviço: escuta a fila e a pausa, confere, envia, marca, dá sinal de vida e cuida da reconexão por QR |
| `mensagem-unica41.js` | Cópia idêntica do texto aprovado que está no app. A prova falha se as duas ficarem diferentes |
| `package.json` | Uma dependência só: `firebase-admin` 14.5.0 |
| `zelozinha.service` | A unidade do systemd |

No app, a parte da fila e da tela é o bloco `<script id="zelozinha-simples">` do `auaulandia/index.html`.

As provas são `node tests/zelozinha-simples166.test.js` e `node tests/zelozinha-qr167.test.js` (a reconexão por QR). O GitHub também as roda, por `zelozinha/provas/simples166.test.js` e `zelozinha/provas/qr167.test.js`. Elas não usam rede nem banco e só têm dado inventado.

## Instalar na VPS (só com o OK da Adriana, fora da janela de envio)

A configuração já existe na VPS e não muda: `/etc/zeluz-piloto/automatico80.json`, com o endereço do banco, a identidade técnica e o acesso ao WhatsApp. O serviço lê esse arquivo como está. Nenhum segredo entra no projeto.

1. Copie a pasta `zelozinha/simples/` para `/opt/zelozinha/`.
2. Em `/opt/zelozinha`, rode `npm install --omit=dev`.
3. Copie a unidade: `cp /opt/zelozinha/zelozinha.service /etc/systemd/system/`. Depois rode `systemctl daemon-reload` e `systemctl enable --now zelozinha`.
4. Confira com `journalctl -u zelozinha -n 20`. Tem de aparecer `{"ok":true,"zelozinha":"simples-2",…}`. Se aparecer «aviso: sem evolution.numeroZeluz», o QR está desligado.
   - **Para ligar o QR:** acrescente `"numeroZeluz"` (só dígitos) dentro de `automatico.evolution` no `automatico80.json`. O número é o que a instância mostra hoje como conectado (`ownerJid` em `/instance/fetchInstances`, sem o `@…`). Depois, reinicie o serviço.
   - **Regra do banco:** o QR precisa do bloco `zelozinha-qr` publicado pela Adriana no Console. Sem ele, o serviço não consegue gravar o QR.
5. A tela da Zelozinha deve mostrar «WhatsApp conectado», sem a faixa vermelha.
6. O webhook da instância do WhatsApp ainda aponta para a ponte antiga, que foi desligada. Desligue esse webhook, porque o serviço novo não usa eventos de entrada.

**Parar numa emergência:** use o botão «Pausar Zelozinha» na tela, ou `systemctl stop zelozinha`. Parar não apaga nada: a fila fica no banco.
