# Gabarito com medida — Painel unificado em Modo Painel (v2)

> 26/ago/2026 · Orion. Fonte de autoridade: `code/docs/zeluz/branding/design-language-zeluz/preferencias-visuais-adriana.json` (v2, decisões finais 05/jul) + `zeluz-ds-v8/shared/tokens.css`. A v1 do esboço foi rejeitada pela Adriana ("sem vida, só largou os dados") — este gabarito existe para a v2 convergir.

## Lei nº 1 (veto verbatim da Adriana)
Fundo chapado é PROIBIDO em qualquer cor. Chão claro (creme `--z-cream` #FFFDF6). Azul #234D67 só em borda, texto e detalhe. "Se o texto precisou virar branco para ser lido, a cor virou parede."

## Base (medidas)
| Item | Medida |
|---|---|
| Chão | `--z-cream` #FFFDF6, sem seção full-bleed |
| Card | branco, radius **16px**, padding 16–18px, sombra tingida de azul `0 6px 18px rgba(35,77,103,.08)`; hover: `translateY(-3px)` + sombra `.14`, 200ms |
| Grid | mobile (≤600px) 1 coluna, gap 12px; ≥900px 12 colunas, cards de 4/6/8/12 colunas; densidade alta (≥ 8 cards visíveis no desktop na fatia Supervisão) |
| Sidebar | vidro: `rgba(255,255,255,.92)` + `backdrop-filter: blur(16px)`, borda direita 1px `rgba(35,77,103,.10)`; item ativo = pílula com wash dourado 14% + texto azul; é a ÚNICA superfície tratada da peça |
| Tipografia | Poppins. Saudação 22px/600; título de card 15px/600 azul; rótulo 12px/500 `--muted`; KPI **36px/600** `font-variant-numeric: tabular-nums`; hero (1 por fatia) 44px/600 |
| Cor | uma cor de acento por card, sempre Zêluz: dourado #DEB428 (nobre: anel, tarja, número-âncora), azul #234D67 (borda/texto), teal de dados #5AABB5 (2ª série), cores de serviço do DS v8 só em wash 10–14% (ícone/badge). Semáforo em badge alpha (fundo 12%, texto na cor) — nunca bloco saturado |
| Botões/chips/badges | pílula (radius 999px); primário = azul; ação de destaque = dourado com texto azul |
| Efeitos (dose homeopática) | 1 textura = vidro da sidebar · 1 destaque = glow do donut-âncora (`0 0 0 6px rgba(222,180,40,.18)`) · 1 selo = tarja dourada 3px no topo do card "Plano de hoje". Nada mais. |
| Motion | scroll-reveal dos cards em cascata (opacity+translateY 12px, 360ms, stagger 60ms); contadores dos KPIs sobem em 600ms; donut preenche em 700ms ease-out; barras crescem em 500ms; 1 indicador "ao vivo" pulsando (dot 8px, 1.6s, só onde há dado em tempo real); **nada acima de 800ms**; `prefers-reduced-motion` desliga tudo |
| Gráficos (formas permitidas) | donut completo 360° dourado com furo branco (métrica-âncora), barras sólidas com leve 3D (topo iluminado 1px, base 1px sombra), sparkline linha 2px + área 10%, progress pill 8px, linha suave 4 pontos. PROIBIDO: pizza 2D chata, barra grossa preenchendo área, área grande sólida, dual-axis, número em todo ponto |
| Regras dataviz | uma cor por série e cor fixa por entidade; ≥2 séries → legenda; status só com ícone+texto; marcas finas; grid recessivo; sem tooltip como único meio de leitura |

## Por card — forma, medida, motion
### Fatia Monitor (Octávio)
| Card | Forma | Medida | Motion |
|---|---|---|---|
| Meu dia | 3 stat tiles (entrada/almoço/saída) + timeline vertical | tile: valor 28px/600, rótulo 12px; timeline: trilho 2px azul 20%, nó 12px; feito = nó dourado + ✓; em curso = nó com dot pulsando; futuro = nó vazado; progress pill "3 de 6 feitas" 8px | pill cresce 500ms; dot 1.6s |
| Plano de hoje | card com tarja dourada 3px (o selo) + 3 linhas de atividade com chip pílula | chip wash dourado 14% | reveal |
| Meu protocolo hoje (âncora) | **donut 360°** 132px, espessura 12px, dourado sobre trilho `rgba(35,77,103,.08)`, centro "3/5" 34px/600 + "feitos" 12px; ao lado lista "faltam" com botão pílula azul | glow do donut (o destaque) | anel preenche 700ms |
| Meus pontos | KPI 44px dourado (hero da fatia) + sparkline dos últimos 9 check-outs (linha 2px azul, área 10%, 120×36px) | | count-up 600ms; sparkline desenha 500ms |
| Avisos que ficaram comigo | badge semáforo alpha (vermelho 12%) + texto + botão pílula "reenviar" | | reveal |

### Fatia Supervisão (Amanda)
| Card | Forma | Medida |
|---|---|---|
| Fila do dia | KPI row: 4 tiles (check-ins pendentes · sem ficha · check-outs hoje · tutores a avisar), cada um com ícone em wash de serviço | valor 36px, count-up |
| Quem não comeu | barras horizontais sólidas 3D (comeu tudo / metade / não comeu / não se aplica), 10px altura, uma cor: azul, "não comeu" em vermelho alpha; abaixo 2 linhas de FILHOt + status Telegram (badge) | barras crescem 500ms |
| Medicação do dia | progress pill "5 de 7 doses" + lista de 2 (atrasada = badge alpha vermelho, próxima = badge azul) | |
| Resolver com o tutor · Ocorrências · Alergia · Cadastro incompleto · Renovação · Orçamento | cards-lista compactos: 2–3 linhas, ícone 28px em wash, chip pílula de contexto | |
| Prevenção | barras horizontais por item (vacina, vermífugo, coleira, exame, peso) com contagem à direita | |
| Acerto do cliente | 1 linha isolada: "Fofucho — acertar plano **R$ 5.000,00**" em chip dourado; sem soma | |

### Fatia Gestão (Márcia)
| Card | Forma | Medida |
|---|---|---|
| O que aconteceu hoje | KPI row (aulunos · hóspedes · EA feitos · ocorrências abertas) | |
| Quem fez o quê | barras horizontais por pessoa (minutos por etapa), série única azul, média da semana como marca cinza (emphasis) | barras 500ms |
| Ritmo do Time | 3 sparklines (almoço · montagem · finalização), min/FILHOt, 4 semanas | |
| Bolsa do check-out | barras verticais sólidas 3D dourado por monitor (pontos do mês), rótulo só no topo de cada barra | |
| Entrou e saiu | 2 KPIs com delta em badge alpha (verde/vermelho) | |
| Plantonistas — acerto | tabela leve (zebra 3% azul) + KPI "Total do mês R$ 3.120,00" | |
| Evolução de cada colaborador | seletor pílula de pessoa + **linha suave** (protocolo %, 4 pontos, 2px azul, área 10%, marcador 8px) + 3 mini-KPIs (pontos, avisos não enviados, tempo médio) | linha desenha 600ms |
| Dashboard Day Care | 3 KPIs | |

### Fatia Diretoria (Adriana)
Tudo das três + "Acerto — conferência" (mesma tabela) + "Auditoria — gravações que falharam": feed live (dot pulsando) com 3 linhas, badge alpha por nó, botão pílula "tentar gravar de novo".

## Estrutura da página
Sidebar de vidro (símbolo Zêluz #39 real, 44px; itens Painel/AuAulândia/Day Care/Agenda) · topo com saudação "Bom dia, Octávio" + data + seletor de fatia em pílulas (Monitor · Supervisão · Gestão · Diretoria) · conteúdo em grid. Mobile: sidebar vira barra superior de vidro; grid 1 coluna; nada mais largo que a tela.

## Gate
`bash tools/html-preflight.sh` APROVADO · zero cor/fonte fora dos tokens (importar `tokens.css` + usar variáveis; se precisar de teal/wash, definir `--p-*` locais derivadas dos tokens com comentário) · paleta categórica validada com `dataviz/scripts/validate_palette.js` · 375/390/1280px sem elemento com `right > innerWidth` · logo é SVG real · R$ completo · vocabulário Zêluz.
