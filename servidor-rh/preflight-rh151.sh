#!/bin/sh
# Somente leitura. Não instala, cria diretórios, muda permissões ou acessa Firebase.
set -eu

release="${1:-}"
config="/etc/zeluz-rh151/config.json"
modules="/opt/zeluz-piloto/releases/piloto70-24ca48a1/node_modules"
adc="/etc/zeluz-piloto/firebase-adc.json"
socket="/run/zeluz-rh151/api.sock"

case "$release" in
  /opt/zeluz-rh151/releases/*) ;;
  *) printf '%s\n' '{"ok":false,"erro":"release_invalido"}'; exit 2 ;;
esac

bool() { if "$@"; then printf true; else printf false; fi; }
usuario_existe() { id zeluz-piloto >/dev/null 2>&1; }
node_ok=false
if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"
  [ "${major:-0}" -ge 18 ] 2>/dev/null && node_ok=true
fi

printf '{'
printf '"ok":true,'
printf '"nodeMinimo":%s,' "$node_ok"
printf '"usuarioExiste":%s,' "$(bool usuario_existe)"
printf '"releaseRegular":%s,' "$(bool test -d "$release")"
printf '"startupRegular":%s,' "$(bool test -f "$release/executar-producao151.js")"
printf '"backendRegular":%s,' "$(bool test -f "$release/startup.modelo.js")"
printf '"configRegular":%s,' "$(bool test -f "$config")"
printf '"configLegivelPeloServico":%s,' "$(bool runuser -u zeluz-piloto -- test -r "$config")"
printf '"adcLegivelPeloServico":%s,' "$(bool runuser -u zeluz-piloto -- test -r "$adc")"
printf '"firebaseAdminPresente":%s,' "$(bool test -f "$modules/firebase-admin/package.json")"
printf '"googleAuthPresente":%s,' "$(bool test -f "$modules/google-auth-library/package.json")"
printf '"socketAusente":%s' "$(bool test ! -e "$socket")"
printf '}\n'
