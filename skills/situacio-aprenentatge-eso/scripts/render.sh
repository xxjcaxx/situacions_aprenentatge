#!/usr/bin/env bash
# Converteix una plantilla HTML en PDF A4 horitzontal amb Chrome headless.
# Ús: bash scripts/render.sh entrada.html [sortida.pdf]
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Ús: bash scripts/render.sh entrada.html [sortida.pdf]" >&2
  exit 1
fi

input="$1"
if [[ $# -ge 2 ]]; then
  output="$2"
else
  output="${input%.html}.pdf"
fi

if [[ ! -f "$input" ]]; then
  echo "No existeix el fitxer: $input" >&2
  exit 1
fi

input_abs="$(readlink -f "$input")"
output_abs="$(readlink -m "$output")"
mkdir -p "$(dirname "$output_abs")"

chrome_bin="${CHROME_BIN:-}"
if [[ -z "$chrome_bin" ]]; then
  for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$candidate" >/dev/null 2>&1; then
      chrome_bin="$candidate"
      break
    fi
  done
fi

if [[ -z "$chrome_bin" ]]; then
  echo "No s'ha trobat Chrome/Chromium. Defineix CHROME_BIN." >&2
  exit 1
fi

"$chrome_bin" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=2000 \
  --print-to-pdf="$output_abs" \
  "file://$input_abs" >/dev/null 2>&1

echo "PDF generat: $output_abs"
