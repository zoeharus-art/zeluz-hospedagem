# Instagram Zêluz — como funciona

**Ideia:** a equipe fotografa e filma no celular. Você manda pro Claude. O Claude devolve o texto. Você monta a arte no Estúdio em 2 minutos. Posta.

## As 3 peças

| Peça | O que é | Pra quê |
|---|---|---|
| `estudio.html` | Página que faz a arte com a nossa foto | Arte sempre igual, com a cara da Zêluz |
| `.claude/skills/zeluz-instagram` | O "cérebro" da voz Zêluz | Qualquer Claude escreve como a gente, sem cara de IA |
| `pauta-mes-1.md` | O que postar nas próximas 4 semanas | Você não precisa pensar no que postar |

## O fluxo (5 passos)

1. **Equipe registra** (todo dia, 2 min): foto ou vídeo de algo que aconteceu de verdade + uma frase no grupo. Ex.: "Mel dormiu na toalha depois do banho".
2. **Você manda pro Claude**: a foto + a frase + "faz um post" (ou "faz um story", "carrossel", "reel").
3. **Claude devolve** texto da arte, legenda e qual layout usar.
4. **Estúdio**: abre `estudio.html`, escolhe a foto, cola o texto, baixa.
5. **Posta** no Instagram e cola a legenda.

Reels: o Claude te dá um roteiro que **não precisa editar**. Só gravar e pôr texto na tela pelo próprio Instagram.

## As 3 regras que deixam com cara de gente

1. **Foto nossa, sempre.** Nada de banco de imagem ou imagem de IA.
2. **Um fato real por post.** Nome do FILHOt, o que aconteceu, quem da equipe fez.
3. **Pouco texto na arte.** A foto conta. A legenda explica.

## Por que não vira "colcha de retalhos"

O Estúdio só tem 4 layouts, 2 formatos, as fontes e cores do Design System v8 e um filtro "Tom Zêluz" que deixa fotos de celulares diferentes com a mesma luz. Não tem como sair do padrão.

| Layout | Use para |
|---|---|
| Foto | FILHOt em ação, equipe, momentos |
| Foto + papel | Explicar algo (banho, tosa, Empório) |
| Frase | Fala de cliente ou da equipe |
| Bastidor | Foto crua + bilhetinho. Capa de reel |

## Cuidados

- **Autorização da família** antes de mostrar FILHOt e nome.
- Este repositório é **público**: fotos e vídeos nunca entram aqui. O Estúdio roda no navegador e não envia nada pra lugar nenhum.

## Como abrir o Estúdio

No computador: baixe a pasta `instagram/` e dê dois cliques em `estudio.html` (Chrome ou Safari). Para usar no celular, o próximo passo é publicar o Estúdio num endereço da internet.
