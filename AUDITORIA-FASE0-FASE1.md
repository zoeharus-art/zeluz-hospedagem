# Auditoria AuAulândia — Fase 0 (rede de segurança) + Fase 1 (auditoria)

> 22/ago/2026 · Orion (AIOX Master) · app `auaulandia/index.html`, versão no ar `2026-08-22-09`
> Nada foi alterado no app. Isto é diagnóstico. As correções são a Fase 2, na ordem que a Adriana decidir.

---

## Sumário em uma frase

O app funciona, mas cresceu sem fundação de engenharia: falta uma rede de testes automática, a
segurança do banco depende de um interruptor que ainda não foi ligado, e a informação mora onde
coube — não onde é usada. Este documento entrega a rede de testes (pronta e passando) e o mapa
dos três problemas.

---

## Fase 0 — A rede de segurança (`tests/harness.js`)

**O que é:** um script que carrega o `<script>` real do `index.html` dentro de um sandbox, injeta
**dado real do banco** (login anônimo, só leitura) e roda as funções de verdade do app — validando
regras de negócio. É a resposta ao "como testar tudo?": roda em segundos, antes de cada publicação.

**Como rodar:**
```
cd zeluz-hospedagem
node tests/harness.js
```
Sai `0` se tudo passa, `1` se algo falha (serve de trava antes de publicar).

**Estado atual: 17 de 17 verde**, contra dado real (1 FILHOt em reposição, 16 duplas de irmãos):
- v05 Reposição: saldo é sempre número; agenda nunca traz data no passado; janela invertida/sem dias = vazio.
- v07 Irmãos: todo vínculo usa chave composta `nome__tutor` (não nome solto); 16 duplas reais no banco.
- **Papel de quem usa:** monitor e plantonista NÃO podem lançar reposição; gestão pode. (Testar com o
  papel certo foi o que faltou na v15 e travou o plantão — agora está no teste.)

**Próximo passo do harness:** cobrir v06 (confirmação de tutor na busca), v08 (`algMensagem` com
ALIMENTAÇÃO antes de SAÚDE) e v09 (salvar sem `confirm`). Base pronta para crescer.

---

## Fase 1a — Segurança (o estado REAL, sem exagero)

**Correção de rota:** o que parecia "buraco crítico novo" já é **conhecido e documentado** em
`SEGURANCA.md`. As regras do banco (`database.rules.json`) já foram publicadas em 29/jul e testadas.
O que confirmei por REST (com o mesmo login anônimo que qualquer um obtém da URL):

| Teste | Resultado | Leitura |
|---|---|---|
| Ler/escrever a **raiz** sem login | 401 negado | ✅ raiz fechada |
| Criar ramo novo / apagar coleção inteira | 401 negado | ✅ protegido pelas regras |
| Ler `daycare/*` com login anônimo | **200** | ⚠️ dados de FILHOts, tutores e **senhas da equipe em texto plano** ficam legíveis |
| Escrever **item a item** em `daycare/*` com login anônimo | **200** | ⚠️ por design (o app vive disso), mas exposto a qualquer anônimo |

**A barreira que falta é o App Check em modo "Impor".** A chave reCAPTCHA **já está colada** no
código (linha ~3515) — o App Check está ativo no cliente, mas o **enforcement no Console do Firebase
não foi ligado**. Por isso meu `curl` anônimo ainda passou. Ligar o enforce é o que fecha o app para
o mundo (curl, HTML copiado, qualquer coisa que não seja o app real).

**⚠️ Cuidado que a memória já registrava — a ordem importa:** ligar "Impor" ANTES de rodar dias em
modo "Monitorar" **derruba o app para a equipe inteira**. O caminho seguro é: App Check em
monitoramento → conferir no Console que tudo vem "com prova" → só então impor.

**Risco residual conhecido (decisão da Adriana, não urgência técnica):** senha por papel é conferida
no navegador — organiza a equipe, mas não é segurança de verdade. A separação real de papéis pede um
PIN validado no servidor da VPS (custo R$ 0,00, detalhado no `SEGURANCA.md`).

---

## Fase 1b — Funcional (v05–v09 de 22/ago)

O que o harness já **provou** contra dado real: v05 (reposição) e v07 (irmãos) estão sólidos nas
invariantes de negócio. v06, v08 e v09 são de fluxo de tela — validação recomendada abrindo o app
**com o papel de monitor/plantonista**, não só de Gestão. Nenhuma quebra encontrada na lógica pura.

---

## Fase 1c — Padrões perigosos (varredura mecânica do arquivo inteiro)

Ordenado por gravidade — capacidade de **perder trabalho da equipe em silêncio**:

| # | Onde | O quê | Gravidade |
|---|---|---|---|
| 1 | linha 6549 `registrarDoseAgendada` | Se o banco reconecta no instante do clique, sai **mudo** — sem aviso, sem audit. A plantonista pensa que registrou a **dose de remédio**. A função irmã (6604) já trata certo ("Banco conectando…"). | **Alta** (medicação) |
| 2 | linhas 12057, 12224 `salvarFotoCad` | Chamado dentro de `try{}catch(e){}` que **não pega Promise** — falsa sensação de proteção; foto pode não salvar sem ninguém saber. | Média |
| 3 | ~95 gravações com `.catch(function(){})` | "Grava e esquece": tela mostra salvo, banco rejeita, ninguém sabe. Piores: `update({restricao:val})` linha 18689 (**alergia!**) e o próprio log de auditoria (9536, 17904). | Média-alta |
| 4 | ~55 pontos `confirm()`/`prompt()` no caminho de salvar | Mesmo padrão que travou o plantão. 2 pares de `confirm()` duplo já documentados; ~50 pontos ainda não mitigados. | Média |
| 5 | linhas 18583, 5304, 5317 `if(DB){…}` sem `else` | Se `DB` está reconectando, a atualização do cadastro-mestre (nome/raça/chip) some sem aviso. | Média |
| 6 | linha 8747 `acertoMarcarDobras` | Compara plantonista por nome exato **sem normalizar** — variação de digitação pode não pagar a dobra de plantão (24h). | Média (dinheiro) |

Padrões que a varredura **inocentou**: nenhum FILHOt é identificado só por nome (sempre com tutor ou
chave composta); a recarga por cache vazio que travou a v15 já foi corrigida (flag `ALM_CAD_TENTOU`).

---

## Fase 1d — Mapa do dado (o "puxadinho", diagnosticado)

A informação está organizada por **local de uso**, não por **assunto**. Saber "o que aconteceu com
este FILHOt hoje" exige de 5 a 13 leituras em paralelo. Os casos concretos de fragmentação:

1. **Alimentação/jantar vive em 3 lugares** — o código admite isso na linha 5013. Nasce no check-in
   (`estadias/{id}/ficha.alim`), mas é lido misturado com o cardápio de almoço do Day Care
   (`daycare/almoco-cad`), editado por outra pessoa, em outra tela. É a dor de 20/ago.
2. **Cadastro do mesmo pet duplicado** em `daycare/cadastro` e `auaulandia/cadastro`, sincronizado à
   mão no código. Campo novo esquecido num dos dois = cadastro fantasma.
3. **Medicação em 4 nós** sem visão única — "o remédio foi dado?" exige cruzar até 3.
4. **Pernoite mora fora de `estadias`** (`auaulandia/manuais`) — relatório que só lê `estadias`
   subestima noites (o "18 noites a menos" da memória).
5. **"Checkout" = 3 coisas diferentes** com o mesmo nome (gamificação, plantão, hóspede saindo).
6. **Status e cronômetro separados** (`almoco` vs `almoco-turno`) — dois nós têm que concordar e nada
   garante; origem do bug de 08/ago.

**Recomendação de arquitetura:** antes de mais tela, um documento "dia do FILHOt" e um dono único
para alimentação e para cadastro. É o que transforma puxadinho em construção.

---

## Decisões que dependem só da Adriana

1. **Autorizar o celular da Amanda** (tela de entrada, senha da Gestão) — ela está barrada agora.
2. **Colar URL + senha da planilha do Day Care** (senha **sem** aspas) — sem isso as colunas novas não sobem.
3. **App Check → Monitorar → Impor** no Console do Firebase — fecha o app para o mundo. Monitorar ANTES de impor.
4. **Firebase Spark → Blaze** com alerta de R$ 50 — Spark desliga o app ao estourar (download já em 12,7%).
5. **Foto da Luna** — confirmar se é ela (preto e branco, sentada no cimento, mangueira verde ao fundo).
6. **TV:** se a LG for de 2010–2013, Chromecast ou mini-PC (~R$ 200) é mais barato e confiável que contornar o navegador antigo.

## Ordem recomendada para a Fase 2 (a Adriana bate o martelo)

1. Achado nº 1 (dose de remédio muda) — segurança, correção trivial, padrão certo já existe ao lado.
2. App Check em monitoramento (você no Console; eu valido).
3. Achados nº 3 e nº 5 (gravações e cadastro que somem em silêncio).
4. Só então os 3 dashboards por papel (Amanda · Márcia · Adriana · TV) — sessão própria, com as perguntas de escopo antes.
