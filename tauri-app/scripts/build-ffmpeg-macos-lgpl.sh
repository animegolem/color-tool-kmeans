#!/usr/bin/env bash
set -euo pipefail

FFMPEG_VERSION="${FFMPEG_VERSION:-7.0.2}"
target="${1:-}"

if [[ -z "$target" ]]; then
  arch="$(uname -m)"
  if [[ "$arch" == "arm64" ]]; then
    target="aarch64-apple-darwin"
  else
    target="x86_64-apple-darwin"
  fi
fi

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
build_dir="${root_dir}/.ffmpeg-build"
src_dir="${build_dir}/ffmpeg-${FFMPEG_VERSION}"
prefix_dir="${build_dir}/install-${target}"
bin_dir="${root_dir}/src-tauri/bin"

mkdir -p "$build_dir" "$bin_dir"

if [[ ! -d "$src_dir" ]]; then
  echo "Downloading FFmpeg ${FFMPEG_VERSION}..."
  curl -L "https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.xz" -o "${build_dir}/ffmpeg.tar.xz"
  tar -xf "${build_dir}/ffmpeg.tar.xz" -C "$build_dir"
fi

pushd "$src_dir" >/dev/null

echo "Configuring FFmpeg for ${target} (LGPL only)..."
./configure \
  --prefix="$prefix_dir" \
  --disable-gpl \
  --disable-nonfree \
  --disable-debug \
  --enable-pic \
  --enable-static \
  --disable-shared \
  --target-os=darwin \
  --arch="$(uname -m)" \
  --disable-doc

make -j"$(sysctl -n hw.ncpu)"
make install
popd >/dev/null

ffmpeg_src="${prefix_dir}/bin/ffmpeg"
ffprobe_src="${prefix_dir}/bin/ffprobe"

if [[ ! -f "$ffmpeg_src" ]]; then
  echo "FFmpeg build failed: missing ${ffmpeg_src}"
  exit 1
fi

cp "$ffmpeg_src" "${bin_dir}/ffmpeg-${target}"
chmod +x "${bin_dir}/ffmpeg-${target}"

if [[ -f "$ffprobe_src" ]]; then
  cp "$ffprobe_src" "${bin_dir}/ffprobe-${target}"
  chmod +x "${bin_dir}/ffprobe-${target}"
fi

echo "Installed macOS sidecars to ${bin_dir} for ${target}"
