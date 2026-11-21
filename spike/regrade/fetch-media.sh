#!/usr/bin/env bash
# Fetch the spike's test media into spike/regrade/media/ (ignored; the repository is public).
# "Spring", Blender Foundation (Andy Goralczyk, 2019), CC BY 4.0, via Wikimedia Commons.
set -euo pipefail
cd "$(dirname "$0")"
FF="${FFMPEG:-$(command -v ffmpeg || echo ../../tauri-app/src-tauri/bin/ffmpeg-aarch64-apple-darwin)}"  # the sidecar is gitignored: set FFMPEG in a worktree
mkdir -p media
[ -f media/spring.webm ] || curl -fL -A "color-tool-spike/0.1" -o media/spring.webm \
  "https://upload.wikimedia.org/wikipedia/commons/a/a5/Spring_-_Blender_Open_Movie.webm"
# Two minutes at 1080p, H.264: what Chrome and Electron both decode in hardware.
[ -f media/spring-1080p.mp4 ] || "$FF" -v error -ss 60 -t 120 -i media/spring.webm \
  -vf scale=1920:-2 -c:v h264_videotoolbox -b:v 12M -an -movflags +faststart media/spring-1080p.mp4
# One still, for the image path.
[ -f media/spring-still.png ] || "$FF" -v error -ss 150 -i media/spring.webm -frames:v 1 media/spring-still.png
ls -la media
