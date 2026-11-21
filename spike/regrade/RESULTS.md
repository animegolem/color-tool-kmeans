# Results (2026-11-21)

Machine: Apple M3 Max, Chrome (headless, ANGLE on Metal: the real GPU, not SwiftShader).
Media: Café Terrace at Night (Van Gogh, 1920×2408, public domain), a Sorolla (3.7 MP, public
domain), and two minutes of "Spring" (Blender Foundation, CC BY 4.0) at 1920×804, H.264, 24 fps.

## The answers

1. **Still regrade: yes, at display rate.** A full regrade of the 4.6-megapixel Van Gogh, including
   the wait for the GPU, takes 1.3 ms at 12 colours, 2.0 ms at 32 and 3.4 ms at 64 (120 draws each).
   Dragging a centre redraws once per display frame.
2. **Video regrade: yes, live, with the palette re-clustered every frame.** 1080p at 60 frames per
   second (the 24 fps clip at 2.5× speed), 32 colours, tracking on: 60 fps processed, 1 frame dropped
   of 899. At normal speed: 0 to 7 dropped of about 588 in every configuration.
3. **e-means: yes, it beats Lloyd at our scale, with one exception.** Two epochs match Lloyd's error
   (40 iterations) to within about 0.6% in a tenth of the time; five epochs are about equal or
   slightly better in a sixth. The exception is small samples with many colours (6,000 samples,
   32 to 64 colours), where e-means ends 1% to 6% worse on the Sorolla. That is below the
   100k-to-10M rows its scaling laws were fitted on.

## e-means against Lloyd

Same samples, same k-means++ starting centres, median of 5 seeds; error is the mean squared OKLab
distance of the exact assignment, relative to Lloyd's. `node bench.mjs <image> <ffmpeg>`.
Times include the k-means++ start (one pass), except `em5rand`, which starts from random rows as
e-means does by default.

Van Gogh:

| n | K | Lloyd ms (iters) | em1 ms / err | em2 ms / err | em5 ms / err | em5rand ms / err |
| --- | --- | --- | --- | --- | --- | --- |
| 6000 | 16 | 14.1 (40) | 1.1 / 1.036 | 1.6 / 1.004 | 2.9 / 0.995 | 2.7 / 1.009 |
| 6000 | 64 | 38.1 (33) | 3.3 / 1.097 | 4.0 / 1.029 | 9.2 / 0.999 | 6.9 / 1.042 |
| 25000 | 16 | 57.1 (40) | 3.9 / 1.017 | 6.2 / 1.006 | 12.6 / 0.995 | 10.1 / 0.995 |
| 25000 | 64 | 169.9 (40) | 9.9 / 1.028 | 15.2 / 1.004 | 31.2 / 0.994 | 26.4 / 1.008 |
| 100000 | 16 | 234.3 (40) | 16.9 / 1.005 | 25.0 / 0.996 | 48.3 / 0.992 | 45.9 / 0.995 |
| 100000 | 64 | 734.0 (40) | 42.4 / 1.011 | 59.0 / 1.000 | 114.7 / 0.993 | 96.6 / 1.008 |

Sorolla:

| n | K | Lloyd ms (iters) | em1 ms / err | em2 ms / err | em5 ms / err | em5rand ms / err |
| --- | --- | --- | --- | --- | --- | --- |
| 6000 | 16 | 12.1 (33) | 1.2 / 1.026 | 1.4 / 1.033 | 2.5 / 1.018 | 2.1 / 1.004 |
| 6000 | 32 | 20.5 (40) | 1.8 / 1.148 | 2.5 / 1.041 | 4.4 / 1.060 | 3.6 / 1.008 |
| 6000 | 64 | 35.2 (34) | 2.7 / 1.174 | 3.7 / 1.062 | 7.5 / 1.010 | 6.0 / 1.045 |
| 25000 | 16 | 55.4 (40) | 3.6 / 1.018 | 5.4 / 1.005 | 10.7 / 1.004 | 10.4 / 0.999 |
| 25000 | 64 | 144.9 (40) | 9.3 / 1.047 | 13.6 / 1.029 | 29.0 / 1.006 | 20.1 / 1.023 |
| 100000 | 16 | 190.1 (40) | 12.8 / 1.001 | 20.1 / 1.000 | 39.9 / 0.995 | 35.7 / 0.995 |
| 100000 | 64 | 647.9 (40) | 39.8 / 1.030 | 54.4 / 1.007 | 109.6 / 0.998 | 94.7 / 1.008 |

**Why the times come out this way.** Each method's cost is the number of passes over the data.
Lloyd nearly always hits the 40-iteration cap, so it makes about 41 passes (one for the k-means++
start). Five-epoch e-means makes about 6. 41/6 ≈ 6.8×, against 6.4× measured at 100k and 64
colours. So the speed comes from fewer passes, not faster ones.

Lloyd hitting its cap also says 1.x's k-means was never converging at these sizes: every analysis
paid the full 40 iterations.

## Live video, per frame (1920×804)

| Colours | Tracking | Upload | Track (readback + e-means step) | Regrade, with GPU wait | Dropped |
| --- | --- | --- | --- | --- | --- |
| 12 | off | 0.16 ms | — | 2.49 ms | 0 of 582 |
| 12 | on | 0.19 ms | 2.50 ms | 2.51 ms | 5 of 588 |
| 32 | off | 0.23 ms | — | 3.61 ms | 1 of 588 |
| 32 | on | 0.25 ms | 2.95 ms | 3.06 ms | 7 of 587 |
| 32 | on, 60 fps | 0.13 ms | 2.44 ms | 0.27 ms (no wait) | 1 of 899 |

Averages. The "regrade" column forces a GPU wait so that it measures the GPU work. That wait is
itself a cost: with it on at 60 fps, 24 of 901 frames dropped.

**Where the tracking time goes.** The e-means step itself is 0.12 ms at 12 colours, 0.30 ms at 32
and 0.58 ms at 64 (4,096 samples; Node). About 2 ms of the 2.4 ms is the synchronous read of the
160-pixel-wide frame copy back from the GPU. An asynchronous read (a pixel buffer and a fence),
with tracking one frame behind, would remove most of it.

## Against the ceiling written beforehand

| Step | Estimate | Measured |
| --- | --- | --- |
| Regrade shader, 1080p-class | about 0.1 ms | 1.3 to 3.4 ms with the wait, on 4.6 MP; 2.5 to 3.6 ms on video |
| Frame upload | about 1 ms | 0.13 to 0.25 ms (Chrome uploads GPU to GPU) |
| Readback of the small copy | 1 to 2 ms | about 2 ms |
| One e-means batch, K = 16 | about 0.1 ms | 0.12 ms (K = 12) |
| Lloyd, 50k, K = 16 | 30 to 60 ms | 57 ms at 25k, 234 ms at 100k: worse, because JS is scalar here |

The shader is 10 to 30 times slower than the FLOP estimate. The measurement includes a full GPU
round trip (a 1-pixel `readPixels`), which is not free, and the shader's two loops over K with an
`exp` each. A timer query would separate the two. It does not matter yet: everything fits in a
frame with room to spare.

## Correctness

The shader and the JS formula agree exactly (worst difference 0 of 255) on 256 pixels of each of
the three images at 12 and 64 colours (`window.__check()`). The check reads its input from the
WebGL texture: Chrome decodes some JPEGs a byte differently for WebGL than for a 2D canvas, which
the regrade then stretches to 3.

## What this does not show

- **Electron.** Not tested. It is Chromium, so the same code should behave the same; the planned
  first proof (SPEC.org) still has to run there.
- **Hand feel.** All runs were headless. Nobody has yet dragged a centre with a mouse and judged it.
- **Identity under tracking.** Streaming e-means keeps each centre's index (no revival, constant
  step), so an edit stays attached. Whether it stays on the *same-looking* colour through a scene
  cut was not measured.
- **Wide gamut and HDR video.** Everything here is sRGB and 8 bits.

## Next, if this merges

1. Asynchronous readback for tracking.
2. Target palettes: a Poline-style path between anchor colours, built in OKLCh, and a mapping of
   the image's clusters onto it.
3. e-means with two epochs as the still default above 25k samples; keep Lloyd (or more epochs) for
   small samples with many colours.
