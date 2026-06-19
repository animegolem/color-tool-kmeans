#!/usr/bin/env bash
set -euo pipefail

FONT_DIR="$(dirname "$0")/../src/assets/fonts"
mkdir -p "$FONT_DIR"

# Google Fonts v18 — Latin subset woff2
BASE="https://fonts.gstatic.com/s/firasans/v18"

echo "Downloading Fira Sans variants..."

echo " - FiraSans-Regular.woff2"
curl -fsSL "${BASE}/va9E4kDNxMZdWfMOD5Vvl4jLazX3dA.woff2" -o "$FONT_DIR/FiraSans-Regular.woff2"
chmod 644 "$FONT_DIR/FiraSans-Regular.woff2"

echo " - FiraSans-Medium.woff2"
curl -fsSL "${BASE}/va9B4kDNxMZdWfMOD5VnZKveRhf6Xl7Glw.woff2" -o "$FONT_DIR/FiraSans-Medium.woff2"
chmod 644 "$FONT_DIR/FiraSans-Medium.woff2"

echo " - FiraSans-Bold.woff2"
curl -fsSL "${BASE}/va9B4kDNxMZdWfMOD5VnLK3eRhf6Xl7Glw.woff2" -o "$FONT_DIR/FiraSans-Bold.woff2"
chmod 644 "$FONT_DIR/FiraSans-Bold.woff2"

echo "Done. Font files stored in $FONT_DIR"
