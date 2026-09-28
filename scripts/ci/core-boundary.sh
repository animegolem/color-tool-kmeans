#!/usr/bin/env bash
set -euo pipefail

# Do not put cargo on the left of an if-pipeline: a failed dependency query is
# a failed gate, never evidence that the dependency is absent.
tree=$(cargo tree -p color-core --edges normal)
case "$tree" in
  *tauri*)
    echo "color-core must not depend on tauri" >&2
    exit 1
    ;;
esac
echo "[core-boundary] color-core has no normal Tauri dependency"
