# Financeiro — dashboard de mensalidades e cobranças

> 31/ago/2026. Pedido da Adriana: *"somar todos os pagamentos que entraram no mês
> (mensalidades, planos etc.), o que foi pago e o que falta a receber."*
>
> **02/set/2026 — as 3 perguntas do § 5 têm resposta.** Ver § 5 (as decisões) e § 6
> (números recalculados com o dado de hoje, pelos dois caminhos independentes).
>
> Conta pura já pronta e provada: `auaulandia/financeiro-logica.js` (provada no
> `tests/harness.js`, conferida contra dado real e contra um recálculo independente).
> Esta espec é só a TELA. Nada aqui inventa número: tudo sai do `finResumoMes()`.

---

## 1. A verdade desconfortável (ler antes de desenhar)

**O banco não tem registro de pagamento recebido.** Não existe nó, campo, baixa de
parcela nem data de recebimento — em lugar nenhum. O que existe é:

| O que existe | Onde | O que significa de verdade |
|---|---|---|
| `renov.inicio` | `daycare/cadastro/{chave}/renov` | Rotulado na tela como **"Data do pagamento"**. É uma declaração de data, sem valor, sem forma, sem prova. Em **88 fichas** ela foi **deduzida** de uma planilha, não digitada por ninguém. |
| `parcela1_cent` / `parcela2_cent` | `auaulandia/orcamentos/{id}` | Quanto **vai** ser cobrado (50% na reserva, 50% no dia). Nunca diz se entrou. |
| `status: 'fechado'` | idem | O tutor **aceitou**. Não é "pagou". |

Por isso o card **"Recebido no mês" abre em R$ 0,00** — e o dashboard **diz por quê**,
em letra visível, em vez de mostrar um número bonito que não é caixa.

**Sem o dado novo (§ 4), este dashboard responde só metade da pergunta da Adriana:**
sabe dizer *o que falta receber*, não sabe dizer *o que entrou*.

---

## 2. Os cards

Fatia de topo, 4 cards em linha (desktop 12 colunas: 3+3+3+3; mobile 1 coluna).
Modo Painel do `GABARITO-PAINEL-MODO-PAINEL.md`: chão creme, card branco radius 16px,
KPI 36px/600 `tabular-nums`, count-up 600ms, sem fundo chapado.

| # | Card | Valor | Cor de acento | Regra |
|---|---|---|---|---|
| 1 | **Recebido no mês** | `recebidoTotal` | dourado `--z-gold` (o número-âncora) | Só de lançamento real. Hoje: R$ 0,00 + a frase do aviso embaixo, em 12px. |
| 2 | **A receber** | `aReceberTotal` | azul `--z-blue` | O que vence no mês e ainda não foi lançado. |
| 3 | **Em atraso** | `emAtrasoTotal` | badge alpha vermelho (fundo 12%, texto na cor) | **É RECORTE do card 2**, não parcela nova. O card traz a legenda *"parte do 'a receber' cujo prazo já passou"* — sem ela alguém soma os dois e conta o mesmo dinheiro duas vezes. |
| 4 | **Planos vencidos** | `inadimplenciaTotal` | dourado escuro `--z-gold-deep` | População **separada**: plano que acabou e ninguém renovou. Um mês por FILHOt. Não está no card 2. Toque abre a Renovação de planos filtrada em "a cobrar agora". |

### Por serviço — 2 cards lado a lado
Wash de 12% das cores de serviço do DS v8 (nunca bloco saturado):

| Serviço | Token | Conteúdo |
|---|---|---|
| **Day Care** | `--z-daycare` #E08856 em wash 12% no ícone/badge | `porServico.daycare`: recebido · a receber · quantos FILHOts |
| **AuAulândia** | `--z-auaulandia` #5AABB5 em wash 12% | `porServico.auaulandia`: recebido · a receber · quantas reservas |

Barra de proporção entre os dois: progress pill 8px, duas séries, uma cor por serviço,
legenda com o nome — nunca só a cor.

### Tabela — por FILHOt (`porFILHOt`)
Zebra 3% azul. Colunas: **FILHOt · Tutor · Serviço (chip wash) · Plano · Valor · Pago · Falta · Situação**.
Situação em badge alpha: `pago` verde · `aberto` azul. **`parcial` não existe mais**
(Adriana, 02/set/2026, § 5 — pagamento parcial não existe: o lançamento é barrado
na entrada por `finLancamentoValido()` antes de virar registro).
Ordem já vem pronta: quem deve mais primeiro.
Linha com `ordemPetSuposta` ganha um asterisco discreto ligado ao rodapé. Linha com
`resolvidoPorFamilia` (ordem resolvida pelo vínculo de irmãos, sem palpite) ganha um
ícone de vínculo, discreto, sem asterisco — não é "suposição", é dado resolvido.
Toque na linha abre a ficha do FILHOt na aba Plano (mesmo caminho do `abrirPeludinhoRenov`).

### Lançar pagamento — valor cheio, sempre
O formulário de "Lançar pagamento" chama `finLancamentoValido(lancamento, valorEsperado)`
ANTES de gravar. Se o valor não bater com o esperado — pra menos ou pra mais — o
lançamento é **barrado**, com o motivo já pronto ("falta R$ 237,00" / "passa R$ 63,00
do valor esperado"). Nunca grava parcial, nunca grava sobra como crédito calado.

### Rodapé honesto (obrigatório — não é opcional)
Três blocos, sempre visíveis quando houver conteúdo. É o que separa este dashboard
de um número inventado:

1. **`avisos`** — cada um numa linha, 13px, ícone de atenção. Hoje aparecem três:
   sem registro de pagamento · R$ 36.816,99 declarados sem lançamento · 80 FILHOts sem
   o "Nº do peludinho na família".
2. **`semComoCalcular`** — *"N FILHOt(s) ficaram FORA da soma por falta de dado"*, com
   a lista e o motivo escrito. Hoje: **1** (o Toddy da Roberta Secca, auluno sem plano lançado).
3. **`propostasAbertas`** — orçamentos `aguardando`. Aparecem à parte, **nunca** somados
   em "a receber": proposta não é dinheiro.

### Seletor de mês
Pílula no topo: `‹ agosto de 2026 ›`. **Não existe mais seletor de regime** — a
Adriana decidiu (02/set/2026, § 5): só existe **Caixa**. O plano inteiro
(trimestral/semestral incluído) cai por inteiro no mês da renovação.

---

## 3. Onde entra e quem vê

**Onde:** a entrada `Em débito · em breve` (sidebar › **Planos e cobranças**, hoje sem
`data-v`, `opacity:.55`) vira **`Financeiro`** com `data-v="financeiro"`. O grupo já
existe e já é `so-gestao` — a tela nasce no lugar certo, ninguém aprende menu novo.

Além dela:
- **Card na fatia Diretoria do Painel unificado** — 3 KPIs (recebido · a receber · em
  atraso do mês corrente) com "ver tudo" levando à tela cheia. Um card, não oito.
- **Na ficha do FILHOt**, aba Plano: a linha dele em `porFILHOt` (valor · pago · falta).
  A Central vê **só isto** — o FILHOt que está na mão dela, nunca o total da casa.

**Quem vê:**

| Papel | Vê |
|---|---|
| `gestao`, `diretoria` | tudo: cards, tabela, rodapé, todos os meses |
| `supervisor`, `consultora` | a tela por FILHOt e a Renovação; **não** vê os totais da casa |
| `monitor`, `plantonista`, `aprendiz`, `tutor` | nada |

Marcação: item de menu e tela com **`so-master`** (Gestão + Diretoria). A linha na ficha
usa a `so-sensivel` que já existe (Gestão · Supervisão · Diretoria · Consultora).
Cuidado registrado em 19/ago: `.so-master` já mentiu uma vez deixando a Supervisão passar —
conferir a regra no CSS antes de publicar, não confiar no nome da classe.

---

## 4. O dado que falta — o nó novo

Sem isto, "Recebido" é R$ 0,00 para sempre.

```
daycare/pagamentos/{AAAA-MM}/{push-id} = {
  chave:      "theo__renata",   // pelKey do FILHOt · para hospedagem: "orc:{id do orçamento}"
  servico:    "daycare",        // daycare | auaulandia
  valor_cent: 38700,            // SEMPRE centavos, inteiro
  data:       "2026-08-03",     // quando o dinheiro entrou
  ref:        "2026-08",        // a que mês se refere (pagamento atrasado conta no mês certo)
  forma:      "pix",            // pix | cartão | dinheiro | boleto | transferência
  plano:      "Silver",         // o que foi pago (informativo)
  quem:       "Amanda Silva",   // quem lançou — toda ação crítica tem dono
  ts:         1787946844549
}
```

`financeiro-logica.js` **já lê este nó** (`finPagamentosDoMes`) e já foi provado com ele.
Falta só a tela que grava.

**Onde a Central lança:** botão **"Lançar pagamento"** na própria tela Financeiro e na
linha da tabela. Formulário curto: valor (número + "R$" ao lado, nunca texto livre —
lei de 15/jul), data pelo calendário, forma em botões-pílula, mês de referência já
preenchido. Grava com `quem` da sessão. Nada de janelinha nativa: diálogo do app.

Vale a pena? **Sim.** É o único jeito de a pergunta da Adriana ser respondida — e é o
que faz a AuAulândia parar de depender de alguém lembrar de olhar a planilha.

---

## 5. As 3 decisões da Adriana (02/set/2026)

As 3 perguntas abaixo tinham resposta pendente até 31/ago. **Adriana decidiu as três
em 02/set/2026.** `financeiro-logica.js` já obedece; `tests/harness.js` já prova.

**1. Plano trimestral e semestral: o tutor paga tudo de uma vez, ou mês a mês?**
**Decidido: tudo de uma vez, na renovação.** O Gold é R$ 359,00/mês por 3 meses —
paga R$ 1.077,00 inteiro no mês do fechamento; setembro e outubro (se o plano fechou
em agosto) não geram cobrança nova. **Não existe mais seletor de regime** (caixa ×
competência) — só existe este jeito. O campo `parcelas` da tabela de planos
(Silver 2, Gold 2, Black 3) segue **sem uso** — ninguém confirmou parcelamento.

**2. Pagamento parcial existe?**
**Decidido: não existe.** `finLancamentoValido(lancamento, valorEsperado)` recusa
qualquer valor diferente do esperado — pra menos OU pra mais — com o motivo já
escrito ("falta R$ 237,00"). O estado `parcial` saiu da conta: uma cobrança agora só
é `pago` ou `aberto`.

**3. Desconto de irmão: quem é o 2º e o 3º da família?**
**Decidido: a família resolve sozinha.** Por família (vínculos em `daycare/irmaos`),
exatamente 1 FILHOt paga cheio e os demais pagam com o desconto da tabela — a
dedução é automática, não importa qual É o 2º. Ficha com `renov.ordemPet` explícito
continua prevalecendo sobre a família. Sem vínculo nenhum: continua a regra antiga
(assume 1º, avisa). Ver `finOrdensFamilia()` em `financeiro-logica.js`.

---

## 6. Onde estamos — agosto/2026, com o dado real de hoje (02/set/2026)

Números conferidos por **dois caminhos independentes** (o `finResumoMes()` do
`financeiro-logica.js`, dentro do harness, e um recódigo do zero à parte, sem
reusar nenhuma função do arquivo), batendo **ao centavo**:

| | Valor |
|---|---|
| Recebido | **R$ 0,00** — não existe registro de pagamento no sistema |
| **A receber** | **R$ 73.612,43** (Day Care R$ 64.744,93 · AuAulândia R$ 8.867,50) |
| Em atraso (recorte do acima, em 31/08) | R$ 73.254,18 |
| Planos vencidos (população à parte) | R$ 338,00 |
| Declarado sem lançamento | R$ 35.582,99 |
| Fora da soma por falta de dado | 1 FILHOt |
| Com "Nº na família" ainda suposto (sem vínculo) | 59 FILHOts |
| Resolvido automaticamente pela família (vínculo de irmãos) | 19 FILHOts |

> O dado real mudou entre 31/ago (quando a tela ainda pendia das 3 decisões) e hoje —
> a Central segue cadastrando planos todo dia. Por isso o número acima não é
> comparável linha a linha com o de 31/ago; o que importa é o EFEITO das 3 decisões
> sobre o dado de HOJE:
> - Regime caixa (decisão 1) já era o padrão usado no cálculo de 31/ago — sem mudança de comportamento aqui, só ficou definitivo (sem seletor).
> - Irmãos (decisão 3), sobre o dado de hoje: sem aplicar a família, "a receber" seria **R$ 73.687,12** (78 FILHOts com "Nº suposto"); aplicando a família, cai para **R$ 73.612,43** — **R$ 74,69 a menos**, e 19 dos 78 deixam de ser "suposição" e passam a ser dado resolvido.

---

## 7. Gate antes de publicar

- [ ] `node tests/harness.js` — 0 falhas
- [ ] `bash tools/html-preflight.sh` — APROVADO
- [ ] Todo valor na tela sai de `finBRL()`. Zero `toFixed`, zero `toLocaleString` solto
- [ ] Nenhum card mostra total sem o rodapé honesto correspondente
- [ ] "Em atraso" traz a legenda de que é recorte — a tela nunca convida a somar
- [ ] 375px e 390px sem elemento com `right > innerWidth`; tabela rola dentro do card
- [ ] Testado **logado como quem usa** (Gestão e Consultora), não só como Gestão
- [ ] Cor e fonte só por token; logo é SVG real; vocabulário Zêluz
