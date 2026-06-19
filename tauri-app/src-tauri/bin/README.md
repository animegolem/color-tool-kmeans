# FFmpeg sidecars

Place per-platform FFmpeg binaries in this directory so Tauri can bundle them as sidecars.

Expected naming pattern (examples):
- macOS: `ffmpeg-aarch64-apple-darwin`, `ffmpeg-x86_64-apple-darwin`
- Windows: `ffmpeg-x86_64-pc-windows-msvc.exe`
- Linux: `ffmpeg-x86_64-unknown-linux-gnu`

Optional: include `ffprobe` with the same target suffix.

These are referenced by `tauri.conf.json` via `bundle.externalBin`.

Install helper:
- Use `tauri-app/scripts/install-ffmpeg-sidecars.sh` to copy binaries into this folder.
- Use `tauri-app/scripts/build-ffmpeg-macos-lgpl.sh` to build LGPL-only macOS binaries locally.
- Use `tauri-app/scripts/fetch-ffmpeg-btbn-lgpl.sh` to download and install a BtbN LGPL archive.

Suggested sources:
- Windows/Linux: LGPL builds from BtbN (FFmpeg-Builds) with no GPL components.
- macOS: build from FFmpeg source with `--disable-gpl --disable-nonfree` and no GPL libraries.
