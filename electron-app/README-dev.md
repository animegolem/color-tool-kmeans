# Compute Pipeline Notes

## Worker Contract
- Entry: `processCompute({ id, pixels, width, height, stride, minLum, space, k, maxIter, tol, maxSamples, warmStart, seed })`.
- Returns `{ id, totalSamples, durationMs, iterations, converged, centroids, counts, clusters[] }` wrapped in worker response.
- `clusters[]` rows: `{ count, share, centroidSpace(Float32Array), rgb({r,g,b}), hsv(Float32Array) }` sorted by count desc.
- Warm starts: pass a `Float32Array(k*3)`; reuse across calls when K/space/stride/minLum unchanged.
- Cancellation: worker checks token via `shouldCancel` and emits `cancelled` result. Renderer should replay latest control change only.

## Dataset & Sampling
- RGBA buffers sampled via `buildDatasetFromRgbBuffer(buffer, stride, minLum, maxSamples, seed)`.
- Applies BT.709 luma filter (`minLum`), stride skipping, and reservoir sampling capped at `maxSamples` (default 300k).
- Guarantees deterministic sampling via seeded RNG.

## Performance Smoke Tests (4000x3000 synthetic image)
| K | Stride | maxSamples | Duration (ms) |
|---|--------|------------|---------------|
| 10 | 2 | 400k | 262 |
| 100 | 2 | 400k | 889 |
| 300 | 2 | 400k | 2,379 |

Warm-starting subsequent runs with unchanged stride/minLum/space typically halves recompute time in manual tests. Further optimization (mini-batch updates, SIMD) earmarked for AI-IMP-009.

## Renderer Exports
- `PolarChart` now exposes `toSVG()`, `toPNG(scale)` (requires `OffscreenCanvas`), and `exportAs({format, scale})`. SVG embeds Fira Sans and axis labels; PNG path defers to `svgToPngBlob` for DPR-aware rendering.
- `PaletteBar` mirrors the API (`toSVG`, `toPNG`, `exportAs`) producing background-free outputs. Both components reuse the same `svgToPngBlob` helper in `views/exporters.js`.
- Tests mock `svgToPngBlob` to avoid OffscreenCanvas requirements under Node; expect runtime PNG conversions to occur only inside the Electron renderer.

## Testing
- `npm test` runs Node built-in tests covering colorspace roundtrips, k-means behavior (including cancellation), and pipeline integration on synthetic image data.
