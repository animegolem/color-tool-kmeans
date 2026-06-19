#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <target-triple> <url-to-ffmpeg-archive>"
  echo "Example: $0 x86_64-unknown-linux-gnu https://.../ffmpeg-n7.0.2-linux64-lgpl.tar.xz"
  exit 1
fi

target="$1"
url="$2"

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
tmp_dir="$(mktemp -d)"
archive="${tmp_dir}/ffmpeg-archive"
extract_dir="${tmp_dir}/extract"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

echo "Downloading FFmpeg archive..."
curl -L "$url" -o "$archive"

mkdir -p "$extract_dir"

case "$url" in
  *.zip)
    if ! command -v unzip >/dev/null 2>&1; then
      if command -v python3 >/dev/null 2>&1; then
        python3 -m zipfile -e "$archive" "$extract_dir"
      elif command -v python >/dev/null 2>&1; then
        python -m zipfile -e "$archive" "$extract_dir"
      else
        echo "unzip (or python) is required to extract zip archives."
        exit 1
      fi
    else
      unzip -q "$archive" -d "$extract_dir"
    fi
    ;;
  *.tar.xz|*.tar.gz|*.tgz|*.tar.bz2)
    tar -xf "$archive" -C "$extract_dir"
    ;;
  *)
    echo "Unsupported archive type. Use .zip or .tar.*"
    exit 1
    ;;
esac

ffmpeg_path="$(find "$extract_dir" -type f -name 'ffmpeg' -o -name 'ffmpeg.exe' | head -n 1 || true)"
if [[ -z "$ffmpeg_path" ]]; then
  echo "Failed to locate ffmpeg binary in archive."
  exit 1
fi

bin_dir="$(dirname "$ffmpeg_path")"
"${root_dir}/scripts/install-ffmpeg-sidecars.sh" "$target" "$bin_dir"
