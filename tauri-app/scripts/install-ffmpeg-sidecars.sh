#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <target-triple> <ffmpeg-bin-dir>"
  echo "Example: $0 x86_64-unknown-linux-gnu /path/to/ffmpeg/bin"
  exit 1
fi

target="$1"
src_dir="$2"
dest_dir="$(cd "$(dirname "$0")/../src-tauri/bin" && pwd)"

if [[ ! -d "$src_dir" ]]; then
  echo "Source directory not found: $src_dir"
  exit 1
fi

mkdir -p "$dest_dir"

ffmpeg_src="$src_dir/ffmpeg"
ffprobe_src="$src_dir/ffprobe"
if [[ ! -f "$ffmpeg_src" && -f "$src_dir/ffmpeg.exe" ]]; then
  ffmpeg_src="$src_dir/ffmpeg.exe"
fi
if [[ ! -f "$ffprobe_src" && -f "$src_dir/ffprobe.exe" ]]; then
  ffprobe_src="$src_dir/ffprobe.exe"
fi
if [[ ! -f "$ffmpeg_src" ]]; then
  echo "Missing ffmpeg binary at $src_dir/ffmpeg (or .exe)"
  exit 1
fi

ffmpeg_dest="$dest_dir/ffmpeg-$target"
if [[ "$ffmpeg_src" == *.exe ]]; then
  ffmpeg_dest="${ffmpeg_dest}.exe"
fi
cp "$ffmpeg_src" "$ffmpeg_dest"
chmod +x "$ffmpeg_dest"

if [[ -f "$ffprobe_src" ]]; then
  ffprobe_dest="$dest_dir/ffprobe-$target"
  if [[ "$ffprobe_src" == *.exe ]]; then
    ffprobe_dest="${ffprobe_dest}.exe"
  fi
  cp "$ffprobe_src" "$ffprobe_dest"
  chmod +x "$ffprobe_dest"
else
  echo "Note: ffprobe not found at $ffprobe_src (optional)."
fi

echo "Installed sidecars to $dest_dir for target $target"
