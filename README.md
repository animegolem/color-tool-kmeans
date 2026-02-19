# Color Tool — Perceptual Color & Tonality Analyzer

Desktop app for analyzing color palettes and tonal structure in images and video. Built with Tauri (Rust + Svelte), using OKLab/OKLch color spaces for perceptually accurate results.

## Features

### Color Analysis
- K-means clustering in OKLab space extracts dominant colors
- Three visualization modes:
  - **Cluster histogram**: Top clusters sorted by frequency, hue, or lightness
  - **Polar chart**: Hue × chroma plot in OKLCH (default) or HSL ("Gurney circles") mode
  - **Hue × Lightness**: Scatter plot showing color distribution across hue and value
- Configurable cluster count (K), sampling stride, and quality settings

### Video Support
- HTML5 video player with timeline scrubbing
- Frame extraction via ffmpeg with 250ms debounce
- Thumbnail strip (60 frames) for quick navigation
- Analyze any frame by scrubbing to it

### Values/Tonality Analysis
- Extracts lightness distribution from OKLab L channel
- Configurable tonal buckets (2–5 levels) via k-means
- Notan mode: 2-tone simplification using Otsu thresholding
- Range finder showing image key (high key, low key, full range)
- Generates neutral grayscale and simplified tone previews

### Exports
- PNG, SVG, and CSV export for charts and palettes

## Quick Start

### Prerequisites
- Node 18.20.8
- Rust (stable)
- Tauri CLI: `npm i -g @tauri-apps/cli`
- ffmpeg/ffprobe (for video features)

### Development
```bash
cd tauri-app
npm ci
npm run tauri dev
```

### Build
```bash
cd tauri-app
npm run build           # build renderer
npm run tauri build     # bundle native app
```

### Linux/NVIDIA/Wayland
WebKit stability fix for packaged builds:
```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/release/tauri-app
```

## Architecture

### UI Structure
- **Home tab**: Image/video upload, color analysis, three chart views
- **Values tab**: Tonality analysis with tonal buckets and histograms
- **Exports tab**: Export charts and palettes

### Color Pipeline
All color processing uses OKLab/OKLch for perceptual uniformity (colors that look equally different to humans are equally distant in the color space). The one exception is HSL mode in the polar chart, included for artists familiar with traditional color wheels.

### Video Pipeline
1. `ffprobe` extracts duration and frame rate
2. Thumbnail strip generated on load (60 frames tiled)
3. Scrubbing triggers debounced frame extraction via `ffmpeg`
4. Extracted frame analyzed with same pipeline as images

### State Management
Analysis results are cached per image/frame. Video state (position, paths) persists across sessions for quick restoration.

## FFmpeg

Video features require ffmpeg and ffprobe binaries.

**Release builds**: Include ffmpeg binaries with LGPL license sidecars.

**Building from source**: Helper scripts are available for compiling ffmpeg with the required features. See `scripts/` directory.

**System ffmpeg**: The app auto-discovers ffmpeg in standard locations if not bundled.

## Troubleshooting

- **"Could not connect to localhost"** in packaged debug builds: Start the dev server (`npm run dev`) or use the release bundle.
- **Linux/NVIDIA crash**: Use `WEBKIT_DISABLE_DMABUF_RENDERER=1` (and optionally `GDK_BACKEND=x11`).


## Credits

- OKLab color space by Björn Ottosson
- ffmpeg for video processing (LGPL)
- K-means clustering and color conversions implemented in Rust

## License

MIT — see `LICENSE`.
