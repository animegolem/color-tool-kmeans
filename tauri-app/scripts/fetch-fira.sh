#!/usr/bin/env bash
set -euo pipefail

FONT_DIR="$(dirname "$0")/../src/assets/fonts"
mkdir -p "$FONT_DIR"

BASE="https://fonts.gstatic.com/s/firasans/v35"

declare -A FILES=(
  ["FiraSans-Regular.woff2"]="${BASE}/va9E4kDNxMZdWfMOD5VvWXM.woff2"
  ["FiraSans-Medium.woff2"]="${BASE}/va9C4kDNxMZdWfMOD7hW.woff2"
  ["FiraSans-Bold.woff2"]="${BASE}/va9B4kDNxMZdWfMOD7gXDA.woff2"
)

echo "Downloading Fira Sans variants..."
for file in "${!FILES[@]}"; do
  url="${FILES[$file]}"
  echo " - $file"
  curl -fsSL "$url" -o "$FONT_DIR/$file"
  chmod 644 "$FONT_DIR/$file"

done

echo "Done. Font files stored in $FONT_DIR"
