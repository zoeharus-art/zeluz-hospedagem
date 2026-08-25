# Auditoria de Cores Hardcoded vs. Tokens — AuAulândia `index.html`

> Auditoria **somente leitura**, 25/ago/2026. Escopo: `packages` não — arquivo único
> `C:\Users\zeluz\projetos-aios\zeluz-hospedagem\auaulandia\index.html` (22.102 linhas).
> Fonte de verdade consultada: `docs/zeluz/branding/ZELUZ-DESIGN.md` (Constituição Cromática v8.1.1)
> e `docs/zeluz/branding/zeluz-ds-v8/shared/tokens.css`.
> Este documento **não altera o app** — é insumo para a Fase 4 (design consistente).

---

## 1. Resumo

| Métrica | Valor |
|---|---|
| Ocorrências totais de cor "à mão" (hex + `rgb()`/`rgba()` + palavras-chave) fora do `:root` | **781** |
| Valores distintos | **202** |
| Com token equivalente **idêntico** (Δ=0, hex bate exato) | **118 valores distintos / 533 ocorrências** (68% das ocorrências) |
| **Próximos** de um token (Δ≤15, diferença sutil, ver Seção 3) | **23 valores distintos / 48 ocorrências** |
| **Sem token** (Δ>15 — cor realmente fora da paleta) | **59 valores distintos / 181 ocorrências** |
| Palavras-chave CSS válidas (`transparent`, `currentColor` — não são cor de marca, não precisam de token) | **2 valores / 19 ocorrências** |

**Por onde a cor aparece** (das 781 ocorrências):

| Local | Ocorrências | % |
|---|---|---|
| `<style>` principal (linhas 18–1623) | 404 | 51,7% |
| `<script>` (JS que monta HTML/strings — linhas 3461–22100) | 317 | 40,6% |
| `<style>` do Check-in embutido no corpo (linhas 2300–2390, inclui a folha `#ci-print` de impressão) | 38 | 4,9% |
| `style="..."` estático no HTML do corpo | 22 | 2,8% |

**Nota sobre a contagem de ~271 da proposta original:** este levantamento chegou a 202 valores distintos / 781 ocorrências totais — número diferente de ~271. A diferença mais provável é método (a proposta pode ter contado por *ocorrência de regex bruta antes de filtrar entidades HTML* como `&#10003;` `&#9654;` `&#9888;`, que parecem hex mas são símbolos Unicode — 28 ocorrências falsas removidas aqui — ou pode ter contado apenas um subconjunto do arquivo). Os números desta auditoria foram extraídos programaticamente linha a linha e conferidos manualmente nos maiores valores; use-os como base para o planejamento.

**Achado central:** 68% das ocorrências já têm token idêntico disponível — a maior parte do trabalho da Fase 4 é **mecânica** (find-replace por `var(--token)`), não de design. O grosso do esforço de design mesmo (decidir cor nova ou consolidar) está concentrado em poucos valores de alto volume: `#B3261E` (68x), `#6B5F4B` (8x), `#555` (7x), `#2B7A4B` (6x) — ver Seção 3.

---

## 2. Tabela por valor (todas as 202 ocorrências, da maior para a menor)

Legenda da coluna **Onde**: `CSS` = `<style>` principal · `CSS(check-in)` = 2º `<style>` embutido no corpo (inclui a folha `#ci-print` de impressão) · `HTML` = atributo `style="..."` estático no corpo · `JS` = string dentro do `<script>` (HTML montado dinamicamente, inclusive os mini-documentos de exportação WhatsApp/PDF).

Legenda da coluna **Distância**: `idêntico` = mesmo hex convertido para RGB, diferença zero · `próximo (Δn)` = diferença Euclidiana em RGB ≤15 (visualmente quase igual) · `distante (Δn)` = diferença >15 (é outra cor).

| Valor | Ocorrências | Onde | Token equivalente | Distância | Ação |
|---|---|---|---|---|---|
| `#FFF` | 129 | CSS 84, CSS(check-in) 13, HTML 2, JS 30 | `--z-white` | idêntico | trocar por `var(--z-white)` |
| `#B3261E` | 68 | CSS 33, HTML 1, JS 34 | `--crm-critico` | distante (Δ26.4) | decisão de design — ver Seção 3 |
| `#234D67` | 56 | CSS 13, CSS(check-in) 3, HTML 1, JS 39 | `--z-blue` | idêntico | trocar por `var(--z-blue)` (2 ocorrências em JS são `canvas` — ver Seção 4) |
| `#1E8449` | 33 | CSS 10, JS 23 | `--crm-ok-text` | idêntico | trocar por `var(--crm-ok-text)` — token não existe no `:root` do app, importar primeiro |
| `#DEB428` | 22 | CSS 5, JS 17 | `--z-gold` | idêntico | trocar por `var(--z-gold)` |
| `#FFFDF6` | 20 | CSS 6, HTML 3, JS 11 | `--z-cream` | idêntico | trocar por `var(--z-cream)` |
| `transparent` | 18 | CSS 16, CSS(check-in) 1, JS 1 | — | n/a | manter (palavra-chave CSS válida) |
| `#2E7D8A` | 16 | CSS 1, HTML 1, JS 14 | `--z-vetcare` | idêntico | trocar por `var(--z-vetcare)` |
| `#C0392B` | 15 | CSS 10, CSS(check-in) 2, JS 3 | `--crm-critico` | idêntico | trocar por `var(--crm-critico)` |
| `#7C8B99` | 11 | CSS 4, JS 7 | `--muted` | próximo (Δ6.1) | avaliar consolidar em `var(--muted)` |
| `rgba(222,180,40,.16)` | 9 | CSS 6, JS 3 | `--z-gold` | idêntico | trocar por `var(--z-gold)` com opacidade inline, ou criar wash |
| `rgba(222,180,40,.14)` | 9 | CSS 4, CSS(check-in) 1, JS 4 | `--z-gold` | idêntico | trocar (idem) |
| `#E08856` | 9 | CSS 1, JS 8 | `--z-daycare` | idêntico | trocar por `var(--z-daycare)` |
| `#6B5F4B` | 8 | JS 8 | `--z-gray-600` | distante (Δ29.2) | criar token novo — ver Seção 3 |
| `rgba(255,255,255,.14)` | 7 | CSS 2, JS 5 | `--z-white` | idêntico | trocar (com opacidade inline) |
| `rgba(39,174,96,.1)` | 7 | CSS 5, JS 2 | `--crm-ok` | idêntico | trocar (com opacidade inline) |
| `#555` | 7 | CSS(check-in) 1, JS 6 | `--z-gray-700` | distante (Δ22.1) | manter como constante de impressão — ver Seção 3 |
| `rgba(222,180,40,.12)` | 6 | CSS 3, CSS(check-in) 1, HTML 1, JS 1 | `--z-gold` | idêntico | trocar |
| `#F1EBDE` | 6 | CSS 6 | `--z-gray-200` | próximo (Δ11.6) | avaliar consolidar em `var(--z-gray-200)` |
| `#2B7A4B` | 6 | CSS(check-in) 2, HTML 2, JS 2 | `--crm-ok-text` | distante (Δ16.5) | criar token novo — ver Seção 3 |
| `#5AABB5` | 6 | JS 6 | `--z-auaulandia` | idêntico | trocar por `var(--z-auaulandia)` |
| `rgba(222,180,40,.10)` | 5 | CSS 1, JS 4 | `--z-gold` | idêntico | trocar |
| `rgba(222,180,40,.22)` | 5 | CSS 4, JS 1 | `--z-gold` | idêntico | trocar |
| `#5E9B6B` | 5 | JS 5 | `--z-emporio` | idêntico | trocar por `var(--z-emporio)` |
| `#B8A9C9` | 5 | JS 5 | `--z-spa` | idêntico | trocar por `var(--z-spa)` |
| `rgba(255,255,255,.25)` | 5 | JS 5 | `--z-white` | idêntico | trocar |
| `rgba(0,0,0,.25)` | 4 | CSS 4 | `--z-black` | distante (Δ50.2) | é `box-shadow`, não cor — ver Seção 4 |
| `rgba(179,38,30,.08)` | 4 | CSS 1, JS 3 | `--crm-critico` | distante (Δ26.4) | ligado ao mesmo caso de `#B3261E` — ver Seção 3 |
| `rgba(222,180,40,.18)` | 4 | CSS 2, JS 2 | `--z-gold` | idêntico | trocar |
| `rgba(192,57,43,.12)` | 4 | CSS 4 | `--crm-critico` | idêntico | trocar |
| `rgba(192,57,43,0)` | 4 | CSS 4 | `--crm-critico` | idêntico | trocar (gradiente transparente) |
| `rgba(222,180,40,.5)` | 4 | CSS 4 | `--z-gold` | idêntico | trocar |
| `rgba(222,180,40,.2)` | 4 | CSS 4 | `--z-gold` | idêntico | trocar |
| `rgba(26,58,79,.55)` | 4 | CSS 4 | `--z-blue-deep` | idêntico | trocar |
| `#FDECEA` | 4 | CSS 1, JS 3 | `--z-cream-warm` | próximo (Δ10.0) | avaliar — é rosa muito claro de fundo de alerta, ver Seção 3 |
| `rgba(35,77,103,.10)` | 4 | JS 4 | `--z-blue` | idêntico | trocar |
| `#F6D8D4` | 4 | JS 4 | `--line` | distante (Δ17.1) | paleta de exportação WhatsApp — ver Seção 4 |
| `rgba(0,0,0,.35)` | 3 | CSS 3 | `--z-black` | distante (Δ50.2) | é `box-shadow` — ver Seção 4 |
| `#A85A2E` | 3 | CSS 2, JS 1 | `--crm-critico` | distante (Δ40.9) | criar token novo (marrom-terracota, ver Seção 3) |
| `rgba(35,77,103,.22)` | 3 | CSS 3 | `--z-blue` | idêntico | trocar |
| `rgba(192,57,43,.08)` | 3 | CSS 2, CSS(check-in) 1 | `--crm-critico` | idêntico | trocar |
| `#2B7E88` | 3 | CSS 3 | `--z-vetcare` | próximo (Δ3.7) | consolidar em `var(--z-vetcare)` (diferença imperceptível) |
| `rgba(35,77,103,.08)` | 3 | CSS 2, JS 1 | `--z-blue` | idêntico | trocar |
| `rgba(192,57,43,.14)` | 3 | CSS 3 | `--crm-critico` | idêntico | trocar |
| `rgba(192,57,43,.07)` | 3 | CSS 3 | `--crm-critico` | idêntico | trocar |
| `rgba(35,77,103,.12)` | 3 | CSS 2, JS 1 | `--z-blue` | idêntico | trocar |
| `rgba(192,57,43,.06)` | 3 | CSS 2, CSS(check-in) 1 | `--crm-critico` | idêntico | trocar |
| `rgba(222,180,40,.20)` | 3 | CSS 1, JS 2 | `--z-gold` | idêntico | trocar |
| `#5E6CFF` | 3 | CSS 1, HTML 2 | `--crm-info` | distante (Δ90.0) | fora da paleta — logo/gradiente decorativo, ver Seção 3 |
| `#6AF2A3` | 3 | CSS 1, HTML 2 | `--z-auaulandia` | distante (Δ75.0) | fora da paleta — mesmo gradiente decorativo, ver Seção 3 |
| `rgba(46,125,138,.12)` | 3 | JS 3 | `--z-vetcare` | idêntico | trocar |
| `rgba(30,132,73,.10)` | 3 | JS 3 | `--crm-ok-text` | idêntico | trocar — importar token no `:root` primeiro |
| `#E7E0D2` | 3 | JS 3 | `--line` | idêntico | trocar por `var(--line)` |
| `#FDF3D6` | 3 | JS 3 | `--z-cream-warm` | distante (Δ22.4) | paleta de exportação — ver Seção 4 |
| `#8E1B10` | 3 | JS 3 | `--crm-critico-text` | distante (Δ35.2) | paleta de exportação — ver Seção 4 |
| `#B6C2CC` | 3 | JS 3 | `--z-spa` | distante (Δ25.3) | criar token novo (cinza-azulado, ver Seção 3) |
| `#FBF3D2` | 3 | JS 3 | `--z-cream-warm` | distante (Δ26.2) | paleta de exportação — ver Seção 4 |
| `#2A597A` | 2 | CSS 2 | `--crm-info-text` | distante (Δ23.4) | é o azul do gradiente do sidebar — ver Seção 3 |
| `#1A3A4F` | 2 | CSS 2 | `--z-blue-deep` | idêntico | trocar |
| `rgba(255,255,255,.2)` | 2 | CSS 2 | `--z-white` | idêntico | trocar |
| `rgba(255,255,255,.07)` | 2 | CSS 2 | `--z-white` | idêntico | trocar |
| `rgba(255,255,255,.1)` | 2 | CSS 2 | `--z-white` | idêntico | trocar |
| `rgba(224,136,86,.14)` | 2 | CSS 2 | `--z-daycare` | idêntico | trocar |
| `rgba(39,174,96,.12)` | 2 | CSS 2 | `--crm-ok` | idêntico | trocar |
| `rgba(90,171,181,.16)` | 2 | CSS 2 | `--z-auaulandia` | idêntico | trocar |
| `rgba(39,174,96,.14)` | 2 | CSS 2 | `--crm-ok` | idêntico | trocar |
| `rgba(124,139,153,.14)` | 2 | CSS 1, JS 1 | `--muted` | próximo (Δ6.1) | consolidar em `var(--muted)` |
| `rgba(222,180,40,.07)` | 2 | CSS 1, JS 1 | `--z-gold` | idêntico | trocar |
| `#B6AD9C` | 2 | CSS 1, JS 1 | `--z-gray-400` | distante (Δ21.2) | criar token novo (bege-acinzentado) |
| `rgba(192,57,43,.4)` | 2 | CSS 2 | `--crm-critico` | idêntico | trocar |
| `rgba(222,180,40,.1)` | 2 | CSS 2 | `--z-gold` | idêntico | trocar |
| `rgba(192,57,43,.1)` | 2 | CSS 1, JS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(192,57,43,.05)` | 2 | CSS 1, CSS(check-in) 1 | `--crm-critico` | idêntico | trocar |
| `rgba(35,77,103,.07)` | 2 | CSS 2 | `--z-blue` | idêntico | trocar |
| `#1E7A5A` | 2 | CSS 2 | `--crm-ok-text` | distante (Δ19.7) | criar token novo (verde-comida-natural, ver Seção 3) |
| `rgba(192,57,43,.55)` | 2 | CSS 2 | `--crm-critico` | idêntico | trocar |
| `rgba(39,174,96,.35)` | 2 | CSS 1, JS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(39,174,96,.09)` | 2 | CSS 1, JS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(179,38,30,.45)` | 2 | CSS 2 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` — ver Seção 3 |
| `rgba(179,38,30,0)` | 2 | CSS 2 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` — ver Seção 3 |
| `rgba(39,174,96,.10)` | 2 | CSS 1, JS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(41,128,185,.14)` | 2 | CSS 2 | `--crm-info` | idêntico | trocar |
| `rgba(192,57,43,.13)` | 2 | CSS 2 | `--crm-critico` | idêntico | trocar |
| `rgba(39,174,96,.08)` | 2 | CSS 1, CSS(check-in) 1 | `--crm-ok` | idêntico | trocar |
| `#C96F3F` | 2 | CSS 2 | `--z-daycare` | distante (Δ41.0) | criar token novo (laranja-terracota) |
| `rgba(255,255,255,.22)` | 2 | CSS 1, JS 1 | `--z-white` | idêntico | trocar |
| `rgba(124,139,153,.16)` | 2 | CSS 1, JS 1 | `--muted` | próximo (Δ6.1) | consolidar em `var(--muted)` |
| `#25D366` | 2 | CSS(check-in) 1, HTML 1 | `--crm-ok` | distante (Δ37.5) | manter — é o verde oficial do WhatsApp (botão "Enviar"), não é cor de marca |
| `#08351B` | 2 | CSS(check-in) 1, HTML 1 | `--z-black` | distante (Δ31.2) | manter — texto sobre o botão WhatsApp acima |
| `#F1F7F3` | 2 | CSS(check-in) 1, HTML 1 | `--z-gray-100` | próximo (Δ6.3) | consolidar em `var(--z-gray-200)`/tema "comida natural" — ver Seção 3 |
| `#CFE6DA` | 2 | CSS(check-in) 1, HTML 1 | `--z-gray-300` | distante (Δ17.3) | mesmo tema "comida natural" — ver Seção 3 |
| `#E8F5EC` | 2 | JS 2 | `--z-gray-200` | próximo (Δ10.4) | consolidar |
| `rgba(16,10,8,.78)` | 2 | JS 2 | `--z-black` | distante (Δ31.1) | overlay de modal — ver Seção 4 |
| `rgba(0,0,0,.45)` | 2 | JS 2 | `--z-black` | distante (Δ50.2) | é `box-shadow` — ver Seção 4 |
| `rgba(124,139,153,.10)` | 2 | JS 2 | `--muted` | próximo (Δ6.1) | consolidar |
| `rgba(179,38,30,.07)` | 2 | JS 2 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` — ver Seção 3 |
| `#1B3D52` | 1 | CSS 1 | `--z-blue-deep` | próximo (Δ4.4) | consolidar (hover do botão de login) |
| `rgba(255,255,255,.12)` | 1 | CSS 1 | `--z-white` | idêntico | trocar |
| `rgba(58,106,133,.45)` | 1 | CSS 1 | `--z-blue-soft` | idêntico | trocar |
| `currentcolor` | 1 | CSS 1 | — | n/a | manter (palavra-chave CSS válida) |
| `rgba(255,255,255,.06)` | 1 | CSS 1 | `--z-white` | idêntico | trocar |
| `rgba(255,255,255,.18)` | 1 | CSS 1 | `--z-white` | idêntico | trocar |
| `rgba(39,174,96,.07)` | 1 | CSS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(39,174,96,.28)` | 1 | CSS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(30,132,73,.45)` | 1 | CSS 1 | `--crm-ok-text` | idêntico | trocar |
| `#1B3C52` | 1 | CSS 1 | `--z-blue-deep` | próximo (Δ3.7) | consolidar |
| `rgba(255,255,255,.75)` | 1 | CSS 1 | `--z-white` | idêntico | trocar |
| `rgba(241,196,15,.18)` | 1 | CSS 1 | `--crm-atencao` | idêntico | trocar |
| `rgba(222,180,40,.6)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(222,180,40,0)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar (gradiente) |
| `#EEF3F6` | 1 | CSS 1 | `--z-gray-100` | próximo (Δ9.9) | consolidar |
| `rgba(179,38,30,.10)` | 1 | CSS 1 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` |
| `rgba(200,40,40,.04)` | 1 | CSS 1 | `--crm-critico` | distante (Δ19.0) | 3ª variação de vermelho — consolidar em `--crm-critico` |
| `rgba(200,40,40,.5)` | 1 | CSS 1 | `--crm-critico` | distante (Δ19.0) | idem |
| `rgba(200,40,40,.13)` | 1 | CSS 1 | `--crm-critico` | distante (Δ19.0) | idem |
| `rgba(200,40,40,.05)` | 1 | CSS 1 | `--crm-critico` | distante (Δ19.0) | idem |
| `rgba(20,140,90,.06)` | 1 | CSS 1 | `--crm-ok-text` | distante (Δ21.3) | 3ª variação de verde — consolidar |
| `#F4F1E8` | 1 | CSS 1 | `--z-gray-200` | próximo (Δ7.3) | consolidar |
| `rgba(222,180,40,.45)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(192,57,43,.5)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `#C9C2B2` | 1 | CSS 1 | `--z-gray-400` | distante (Δ24.5) | criar token novo ou avaliar reuso |
| `rgba(222,180,40,.28)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(222,180,40,.35)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(192,57,43,.35)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(35,77,103,.35)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `#3D6B47` | 1 | CSS 1 | `--z-gray-700` | distante (Δ36.4) | verde escuro — avaliar junto ao tema "comida natural" |
| `rgba(94,155,107,.16)` | 1 | CSS 1 | `--z-emporio` | idêntico | trocar |
| `rgba(35,77,103,.09)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `rgba(0,0,0,.22)` | 1 | CSS 1 | `--z-black` | distante (Δ50.2) | é `box-shadow` — ver Seção 4 |
| `#F0CC55` | 1 | CSS 1 | `--z-gold-light` | próximo (Δ14.4) | consolidar |
| `#D9584A` | 1 | CSS 1 | `--chart-7` | distante (Δ28.8) | avaliar — cor de gráfico, não crítica |
| `rgba(224,136,86,.55)` | 1 | CSS 1 | `--z-daycare` | idêntico | trocar |
| `rgba(222,180,40,.4)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(39,174,96,.32)` | 1 | CSS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(192,57,43,.32)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(192,57,43,.45)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(222,180,40,.15)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `#F3EFE5` | 1 | CSS 1 | `--z-gray-200` | próximo (Δ6.7) | consolidar |
| `rgba(26,58,79,.18)` | 1 | CSS 1 | `--z-blue-deep` | idêntico | trocar |
| `rgba(192,57,43,.3)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(39,174,96,.13)` | 1 | CSS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(58,106,133,.12)` | 1 | CSS 1 | `--z-blue-soft` | idêntico | trocar |
| `#F5F1E8` | 1 | CSS 1 | `--z-cream-warm` | próximo (Δ6.9) | consolidar |
| `#1F3344` | 1 | CSS 1 | `--z-blue-deep` | próximo (Δ14.0) | consolidar |
| `rgba(35,77,103,.05)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `rgba(30,122,90,.07)` | 1 | CSS 1 | `--crm-ok-text` | distante (Δ19.7) | 4ª variação de verde — consolidar |
| `rgba(30,122,90,.26)` | 1 | CSS 1 | `--crm-ok-text` | distante (Δ19.7) | idem |
| `rgba(192,57,43,.28)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `#B26A00` | 1 | CSS 1 | `--crm-atencao-text` | distante (Δ40.1) | avaliar — laranja-âmbar isolado |
| `rgba(178,106,0,.08)` | 1 | CSS 1 | `--crm-atencao-text` | distante (Δ40.1) | idem |
| `rgba(178,106,0,.30)` | 1 | CSS 1 | `--crm-atencao-text` | distante (Δ40.1) | idem |
| `#5B4B8A` | 1 | CSS 1 | `--z-blue-soft` | distante (Δ45.6) | roxo isolado — avaliar propósito |
| `rgba(91,75,138,.08)` | 1 | CSS 1 | `--z-blue-soft` | distante (Δ45.6) | idem |
| `rgba(91,75,138,.28)` | 1 | CSS 1 | `--z-blue-soft` | distante (Δ45.6) | idem |
| `rgba(192,57,43,.34)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(192,57,43,.30)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(35,77,103,.06)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `rgba(35,77,103,.3)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `#9A7B00` | 1 | CSS 1 | `--crm-atencao-text` | distante (Δ21.3) | consolidar ou criar variante escura |
| `rgba(46,157,109,.07)` | 1 | CSS 1 | `--crm-ok` | distante (Δ22.5) | consolidar em `--crm-ok` |
| `rgba(192,57,43,.09)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(222,180,40,.09)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `#8A6D0B` | 1 | CSS 1 | `--crm-atencao-text` | próximo (Δ11.0) | consolidar |
| `rgba(222,180,40,.24)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(184,150,31,.16)` | 1 | CSS 1 | `--z-gold-deep` | idêntico | trocar |
| `rgba(179,38,30,.055)` | 1 | CSS 1 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` |
| `rgba(46,125,138,.15)` | 1 | CSS 1 | `--z-vetcare` | idêntico | trocar |
| `rgba(39,174,96,.16)` | 1 | CSS 1 | `--crm-ok` | idêntico | trocar |
| `rgba(41,128,185,.13)` | 1 | CSS 1 | `--crm-info` | idêntico | trocar |
| `rgba(41,128,185,.08)` | 1 | CSS 1 | `--crm-info` | idêntico | trocar |
| `rgba(41,128,185,.12)` | 1 | CSS 1 | `--crm-info` | idêntico | trocar |
| `#A53125` | 1 | CSS 1 | `--crm-critico-text` | próximo (Δ13.2) | consolidar |
| `rgba(192,57,43,.18)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(179,38,30,.12)` | 1 | CSS 1 | `--crm-critico` | distante (Δ26.4) | ligado a `#B3261E` |
| `rgba(26,58,79,.5)` | 1 | CSS 1 | `--z-blue-deep` | idêntico | trocar |
| `rgba(222,180,40,0.10)` | 1 | CSS 1 | `--z-gold` | idêntico | trocar |
| `rgba(35,77,103,0.18)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `rgba(35,77,103,0.50)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `rgba(35,77,103,0.70)` | 1 | CSS 1 | `--z-blue` | idêntico | trocar |
| `#E74C3C` | 1 | CSS 1 | `--chart-7` | distante (Δ36.8) | avaliar — 4ª variação de vermelho isolada |
| `rgba(192,57,43,.50)` | 1 | CSS 1 | `--crm-critico` | idêntico | trocar |
| `rgba(0,0,0,.2)` | 1 | HTML 1 | `--z-black` | distante (Δ50.2) | é `box-shadow` — ver Seção 4 |
| `rgba(35,77,103,.25)` | 1 | HTML 1 | `--z-blue` | idêntico | trocar |
| `rgba(197,49,37,.05)` | 1 | HTML 1 | `--crm-critico` | próximo (Δ11.2) | consolidar |
| `rgba(222,180,40,.06)` | 1 | CSS(check-in) 1 | `--z-gold` | idêntico | trocar |
| `#C9BFA8` | 1 | CSS(check-in) 1 | `--z-gray-400` | distante (Δ24.2) | placeholder de assinatura — avaliar |
| `#1E5A36` | 1 | CSS(check-in) 1 | `--z-blue-deep` | distante (Δ40.8) | verde escuro (hover botão comida natural) |
| `#DDD` | 1 | CSS(check-in) 1 | `--z-gray-300` | próximo (Δ5.1) | paleta de impressão — ver Seção 4 |
| `#111` | 1 | CSS(check-in) 1 | `--z-black` | distante (Δ20.8) | paleta de impressão — ver Seção 4 |
| `#222` | 1 | CSS(check-in) 1 | `--z-black` | próximo (Δ8.8) | paleta de impressão — ver Seção 4 |
| `#B9BFC4` | 1 | JS 1 | `--z-spa` | distante (Δ22.6) | avaliar propósito específico |
| `#8C2B21` | 1 | JS 1 | `--crm-critico-text` | distante (Δ18.6) | paleta de exportação — ver Seção 4 |
| `rgba(197,49,37,.10)` | 1 | JS 1 | `--crm-critico` | próximo (Δ11.2) | consolidar |
| `rgba(0,0,0,.07)` | 1 | JS 1 | `--z-black` | distante (Δ50.2) | é borda sutil, não `box-shadow` — avaliar |
| `#C0C0C0` | 1 | JS 1 | `--z-gray-400` | distante (Δ22.8) | prata isolado — avaliar |
| `rgba(224,136,86,.16)` | 1 | JS 1 | `--z-daycare` | idêntico | trocar |
| `rgba(30,132,73,.06)` | 1 | JS 1 | `--crm-ok-text` | idêntico | trocar — importar token no `:root` |
| `rgba(255,255,255,.16)` | 1 | JS 1 | `--z-white` | idêntico | trocar |
| `#C9C0AC` | 1 | JS 1 | `--z-gray-400` | distante (Δ23.7) | avaliar |
| `#FFFFFF` | 1 | JS 1 | `--z-white` | idêntico | trocar (forma longa do branco — inconsistência com `#fff` de sempre) |
| `rgba(46,125,138,.14)` | 1 | JS 1 | `--z-vetcare` | idêntico | trocar |
| `rgba(30,132,73,.08)` | 1 | JS 1 | `--crm-ok-text` | idêntico | trocar — importar token no `:root` |

---

## 3. Valores SEM token — proposta de nome e semântica

Estes são os casos que exigem **decisão de design**, não apenas substituição mecânica. Ordenados por prioridade (ocorrências × impacto).

### 3.1 `#B3261E` — 68 ocorrências — DECISÃO DE MAIS ALTO IMPACTO

Vermelho de "Material Design" (`#B3261E`, cor de erro do Material 3 do Google), usado em paralelo ao vermelho oficial da Zêluz (`--crm-critico` `#C0392B`). Semanticamente os dois cobrem o **mesmo papel** — "negativo/crítico/erro": saldo negativo em `.mov-kpi.bad`, dia cheio em `.troca-dia.cheio`, vaga zerada em `.troca-vagas.zero`, pedido pendente em `.troca-ped`, histórico ruim em `.hist-resumo.bad`, chips de "Não" em `.ck-b.bad`/`.ck-chip`. A Regra de Ouro do `ZELUZ-DESIGN.md` (§ "Cada cor pertence a UMA camada e tem UM papel") é violada aqui: dois vermelhos para o mesmo papel.

- **Opção recomendada:** consolidar em `var(--crm-critico)` (troca mecânica de todas as 68 ocorrências + as ~10 `rgba(179,38,30,X)` que são a mesma cor em wash, listadas na tabela). Unifica o vermelho da marca, elimina a duplicidade.
- **Opção alternativa** (só se houver razão intencional para 2 vermelhos — ex.: "vermelho de validação de formulário" ≠ "vermelho de status crítico do CRM"): formalizar um token novo `--z-error-form: #B3261E` documentado no DS como camada separada, com justificativa registrada.
- Decisão cabe à Adriana — ver `.claude/rules/design-language-zeluz-lei.md` ("Só a Adriana muda o DS").

### 3.2 `#6B5F4B` — 8 ocorrências

Cor passada como parâmetro `cor:'#6b5f4b'` em botões "Cancelar" de modais de confirmação (`removerHospede`, cadastro incompleto, etc.). É um marrom-acinzentado quente, não está na escala de cinza do DS (mais fria: `--z-gray-600` `#6B6A66`).

- **Proposta:** `--z-neutral-action: #6B5F4B` — "cor neutra para ação secundária/cancelar em modais". Ou, se a intenção for reduzir para a escala de cinza padrão, trocar por `var(--z-gray-600)` (Δ29 é perceptível mas aceitável para um botão secundário).

### 3.3 `#555` (+ `#111`, `#222`, `#ddd`) — folha de impressão `#ci-print`

Grupo de cinzas usados exclusivamente dentro de `@media print` do check-in (`.pf-sub`, `.pf-row`, `.pf-mrow`). Não são cores de tela — são tons neutros pensados para impressão em papel (preto quase puro, cinza médio de legenda, borda cinza-claro). Ver Seção 4 para tratamento recomendado (paleta de impressão separada, não forçar na escala `--z-gray-*` da tela).

### 3.4 `#2B7A4B` / `#1E7A5A` / `#3D6B47` + fundo `#F1F7F3`/`#CFE6DA` — bloco "Comida Natural"

Tema verde próprio do painel "🍲 Comida natural" no check-in (`.ci-comida-painel`), com 3 tons de verde diferentes usados de forma quase intercambiável (`#2B7A4B`, `#1E7A5A`, `#3D6B47`) e 2 fundos claros (`#F1F7F3`, `#CFE6DA`). Nenhum bate com `--crm-ok` (que é o verde de status "OK/sucesso").

- **Proposta:** criar par de tokens dedicados `--z-natural: #2B7A4B` (o mais usado dos 3 verdes) + `--z-natural-soft: #F1F7F3` para fundo, e substituir as 3 variações de verde por um único valor — reduz de 3 verdes-quase-iguais para 1.

### 3.5 `#5E6CFF` / `#6AF2A3` — gradiente do ícone "Kairós"

Gradiente azul-violeta → verde-menta usado só no SVG do selo "Kairós" (linha ~3425, `linearGradient id="kfG"`), fora de qualquer paleta Zêluz (Δ75–90, a maior distância de toda a auditoria). Provavelmente é a identidade visual do **produto Kairós** (plataforma, não a marca Zêluz consumidor-final) embutida deliberadamente — não é um "erro" de cor solto, é uma marca secundária.
- **Proposta:** não tratar como pendência de tokenização — **perguntar a Adriana** se esse selo deve usar a paleta Zêluz (aí sim precisa de token) ou se é intencionalmente a marca própria do Kairós (aí deve virar constante documentada `--kairos-gradient-1`/`--kairos-gradient-2`, fora da Constituição Cromática Zêluz).

### 3.6 `#2A597A` — 2 ocorrências

É um tom de azul usado no gradiente do fundo do `.sidebar` e do `.login-screen` (`linear-gradient(165deg,#2A597A 0%,#234D67 45%,#1A3A4F 100%)`) — o extremo mais claro do degradê de marca, entre `--z-blue-soft` (`#3A6A85`) e `--z-blue` (`#234D67`), mas sem token próprio.
- **Proposta:** `--z-blue-bright: #2A597A` — "extremidade clara do gradiente do sidebar", ou formalizar o próprio gradiente como token composto `--gradient-sidebar` no DS.

### 3.7 Vermelhos e verdes "quase-crm" de ocorrência única

`rgba(200,40,40,X)` (4x), `rgba(30,122,90,X)` (2x), `#E74C3C`, `#A85A2E`, `#C96F3F`, `#B26A00`/`rgba(178,106,0,X)` (3x), `#9A7B00`, `#5B4B8A`/`rgba(91,75,138,X)` (3x) — cada um aparece isoladamente, provavelmente copiado de referências externas (Material Design, Font Awesome, paletas genéricas) em vez do token do DS. Nenhum justifica token novo pelo volume — **recomendação: consolidar cada um no token `--crm-*`/`--z-*` mais próximo listado na Seção 2**, exceto os isolados sem correspondência óbvia (`#B9BFC4`, `#C0C0C0`, `#C9C0AC`, `#C9C2B2` — cinzas variados sem padrão claro, avaliar linha a linha).

---

## 4. Pontos de atenção — onde `var(--token)` NÃO resolve sozinho

### 4.1 Canvas (`getContext('2d')`) — CSS custom properties não chegam lá

Apenas 2 ocorrências, mas são bloqueantes para qualquer "find-replace" ingênuo:

- **Linha 19694** — `S.ctx.strokeStyle='#234D67'` (traço da assinatura digital no check-in). `var(--z-blue)` **não funciona** dentro de uma propriedade de canvas em JS — precisa de uma constante JS espelhando o token, ex.: `const Z_BLUE_HEX = '#234D67';` no topo do `<script>`, mantida sincronizada manualmente com o `:root`.
- **Linha 20285** — `x.fillStyle='#ffffff'` (fundo branco do canvas offscreen usado para compor a foto redimensionada antes do upload). Mesma restrição — precisa de `const Z_WHITE_HEX = '#FFFFFF';`.

### 4.2 Documentos de impressão (`@media print` e strings HTML exportadas)

Duas frentes distintas, ambas fora do "corpo vivo" do app:

1. **Folha `#ci-print`** (linhas ~2367–2389, dentro do 2º `<style>`) — usa `#234D67`, `#C0392B` (esses batem exato com tokens, podem virar `var()`) e `#555`/`#111`/`#222`/`#ddd` (esses são propositalmente neutros de impressão, sem token correspondente na tela). **Recomendação:** manter uma mini paleta de impressão declarada explicitamente (`--print-text`, `--print-text-strong`, `--print-border`), documentada como exceção — impressão em papel não segue exatamente a mesma lei de contraste da tela.

2. **Strings JS que montam `<style>...</style>` completo** para abrir em nova janela/exportar (WhatsApp, PDF) — localizadas em `document.write`/`innerHTML` nas linhas **12727, 12922, 17452, 17457, 17762** e vizinhas. Contêm sua própria mini-paleta (`#7C8B99`, `#F6D8D4`/`#8E1B10` para "restrição", `#234D67` para cabeçalho de tabela) **isolada do resto do app** — é HTML que abre numa aba/janela nova, fora do CSS principal. `var(--token)` funciona tecnicamente (é um novo documento HTML, pode ter seu próprio `<style>` com `:root` copiado), mas hoje essas strings são independentes e não importam o `:root` do app. **Recomendação:** se for tokenizar, duplicar as variáveis usadas dentro de cada string de exportação (não dá para compartilhar `:root` entre documentos), ou aceitar essas strings como "paleta de exportação" documentada à parte — baixo risco porque não aparece na UI do app em uso normal.

### 4.3 `box-shadow` / `filter: drop-shadow` em preto puro (`rgba(0,0,0,X)`)

11 ocorrências (linhas 45, 79, 821, 832, 1006, 1337, 1442, 1456, 1631, 19820, 19842) — todas em `box-shadow` ou `filter:drop-shadow`, nunca em `color`/`background`. Tecnicamente "sem token equivalente" (distância Δ50 do `--z-black`), mas **isso não é o problema real**: o `ZELUZ-DESIGN.md`/`tokens.css` já define uma escala de sombra própria da marca, com preto substituído por **azul translúcido** (`--shadow-xs` a `--shadow-2xl`, todas `rgba(35,77,103,X)`) — o app usa sombra preta genérica em vez da sombra azulada da marca.
- **Recomendação:** não criar token de cor para essas 11 ocorrências — **trocar por `var(--shadow-md)`/`var(--shadow-lg)`/`var(--shadow-xl)` etc.** (o valor de sombra completo, não só a cor), alinhando com a decisão de design já tomada no DS v8.1. Isso está fora do escopo de "cor" desta auditoria, mas é um achado relevante para a Fase 4.

### 4.4 SVG com `fill`/`stroke` hardcoded

Só 1 SVG estático com cor fixa fora de token: o gradiente `#5E6CFF`/`#6AF2A3` do selo Kairós (linha 3425, ver Seção 3.5) e os `fill="#FFFDF6"`/`fill="#234D67"` do mesmo ícone (linha 3429 — esses dois já batem exato com token, podem virar `fill="var(--z-cream)"` etc., já que SVG inline aceita `var()` normalmente).

### 4.5 `#25D366` / `#08351B` — verde e texto do botão WhatsApp

Não são "sem token" por descuido — `#25D366` é a cor oficial de marca do WhatsApp (usada no botão "📲 Enviar ao tutor"), não deveria virar `var(--crm-ok)` porque tem significado de marca de terceiros, não de status Zêluz. **Manter como está**, mas documentar a exceção explicitamente (comentário no código) para não ser "corrigido" por engano numa faxina futura.

---

## 5. Plano de substituição em lotes (≤40 ocorrências por lote)

Lotes pensados para os **118 valores com token idêntico** (533 ocorrências, 68% do total) — a parte mecânica e de baixo risco. Cada lote é verificável com o harness contando, no `index.html`, que o hex/rgba do lote não aparece mais fora do bloco `:root` (linhas 19–35).

| Lote | Conteúdo | Ocorrências | Como provar |
|---|---|---|---|
| 1 | `#FFF` — parte 1 (linhas 278–919, dentro do `<style>` principal) | 40 | `grep -c '#FFF'` nesse intervalo de linhas deve cair a 0 |
| 2 | `#FFF` — parte 2 (linhas 920–1585) | 40 | idem |
| 3 | `#FFF` — parte 3 (linhas 1604–19609, cruza para dentro do `<script>`) | 40 | idem |
| 4 | `#FFF` restante (9, linhas 20627–22151) + `#234D67` parte 1 (31, linhas 68–12929) | 40 | contagem total de `#FFF` = 0; `#234D67` fora do `:root` cai para 25 |
| 5 | `#234D67` restante (25) + `#1E8449` parte 1 (15) — **exige antes** importar `--crm-ok-text` no `:root` do app (não existe hoje) | 40 | `#234D67` = 0; `#1E8449` cai para 18 |
| 6 | `#1E8449` restante (18) + `#DEB428` (22) | 40 | ambos = 0 |
| 7 | `#FFFDF6` (20) + `#2E7D8A` (16) + `#C0392B` parte (4) | 40 | os 3 caem a 0 ou ao restante planejado |
| 8 | `#C0392B` restante (11) + `rgba(222,180,40,.16)` (9) + `rgba(222,180,40,.14)` (9) + `#E08856` (9) + `rgba(255,255,255,.14)` parte (2) | 40 | idem |
| 9–13 | Cauda de valores `rgba(222,180,40,X)` / `rgba(192,57,43,X)` / `rgba(35,77,103,X)` / `rgba(255,255,255,X)` / `rgba(39,174,96,X)` etc. com 1–9 ocorrências cada, agrupados por família de cor-base (dourado, vermelho-crítico, azul, branco, verde-ok) — ver lista completa gerada nesta auditoria | ~190 no total, distribuídas em 5 lotes de até 40 | idem, por família |
| 14 | Resto dos `rgba(...)` exatos com 1 ocorrência cada (13 valores) | 13 | idem |

**Depois dos 14 lotes acima (533 ocorrências, todas Δ=0):**

- **Lote 15 — "próximos" (Δ≤15, 48 ocorrências, 23 valores):** cada um exige 1 decisão de "consolidar ou não" (ex.: `#7C8B99`→`--muted`, `#2B7E88`→`--z-vetcare`) — tratar em lote único porque a decisão é rápida e repetitiva (ver tabela da Seção 2, coluna Ação).
- **Lote 16 — decisão `#B3261E` (68 + ~15 `rgba(179,38,30,X)`/`rgba(200,40,40,X)` relacionados ≈ 83 ocorrências):** maior lote, mas é 1 decisão de design (Seção 3.1) aplicada em massa depois de decidida — não é 68 decisões, é 1.
- **Lote 17 — tokens novos a criar (Seções 3.2–3.7):** `--z-neutral-action`, `--z-natural`/`--z-natural-soft`, `--z-blue-bright`, e a decisão sobre o gradiente Kairós — cerca de 30 ocorrências, mas cada token novo precisa aprovação da Adriana antes (regra do DS).
- **Lote 18 — exceções documentadas, não tokenizar:** `box-shadow` preto (Seção 4.3, resolve trocando por `var(--shadow-*)`, não por cor), paleta de impressão `#ci-print` (Seção 4.2.1), paleta de exportação WhatsApp/PDF em JS (Seção 4.2.2), canvas (Seção 4.1), WhatsApp verde oficial (Seção 4.5).

---

*Auditoria gerada por varredura programática linha a linha (Python) sobre `index.html`, com verificação manual de contexto nos maiores valores por ocorrência. Nenhuma edição foi feita no app.*
