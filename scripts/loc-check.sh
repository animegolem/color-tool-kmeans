#!/usr/bin/env bash
set -euo pipefail

if [ "${LOC_BYPASS:-0}" = "1" ]; then
  echo "[loc-check] LOC_BYPASS=1 detected; skipping line-count inspection"
  exit 0
fi

THRESHOLD=${LOC_MAX:-400}
YELLOW='\033[33m'
RESET='\033[0m'

echo "[loc-check] threshold: ${THRESHOLD} LOC per file"

STAGED=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED" ]; then
  echo "[loc-check] no staged files"
  exit 0
fi

warned=0
while IFS= read -r f; do
  # Skip binary/large/generated directories
  case "$f" in
    figma/*|**/*.png|**/*.jpg|**/*.jpeg|**/*.svg|dist/*|build/*|node_modules/*|pkgs/proportions-et-relations-colorees/*)
      continue ;;
  esac
  if [ -f "$f" ]; then
    # Only count if it's likely text
    if file "$f" | grep -qiE 'text|json|xml|javascript|typescript|html|css'; then
      LOC=$(wc -l < "$f" | tr -d ' ')
      if [ "$LOC" -gt "$THRESHOLD" ]; then
        printf "${YELLOW}[loc-check] %s has %s lines (> %s). Consider splitting. Use [loc-bypass] in commits/CI or set LOC_BYPASS=1 to override.${RESET}\n" "$f" "$LOC" "$THRESHOLD"
        warned=1
      fi
    fi
  fi
done <<< "$STAGED"

if [ "$warned" -eq 1 ]; then
  echo "[loc-check] warnings emitted (pre-commit does not block)."
fi

exit 0
