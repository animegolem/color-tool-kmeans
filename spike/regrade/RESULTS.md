# Results (2026-11-21)

Machine: Apple M3 Max, Chrome headless (ANGLE on Metal: the real GPU, not SwiftShader). Headless
means no real display: frame counts below are the decoder's and our loop's, not a screen's.
Media: Café Terrace at Night (Van Gogh, 1920×2408, public domain), a Sorolla (1920×1945, public
domain), and two minutes of "Spring" (Blender Foundation, CC BY 4.0) at 1920×804, H.264, 24 fps.

## The answers

1. **Still regrade: yes, at display rate.** A full regrade of the 4.6-megapixel Van Gogh, including
   the wait for the GPU, takes 1.3 ms at 12 colours, 2.0 ms at 32 and 3.4 ms at 64 (120 draws each).
   Dragging a centre redraws once per display frame. A real mouse drag on the a·b plane was tested.
2. **Video regrade: yes, live, with the palette re-clustered on every frame.** 1080p at 60 new
   frames a second (the 24 fps clip at 2.5× speed), 32 colours, tracking on: the decoder dropped
   2 of 901 frames in the 15 seconds at 60 fps, and our loop missed 6 of 1,145 over the whole run
   (which includes 10 seconds at 24 fps before the speed change).
3. **e-means: yes, it gets more out of each pass than Lloyd.** Over all 24 cells (two paintings,
   3 sample sizes, 8 to 64 colours), relative to full Lloyd (40 iterations): Lloyd stopped at 2
   iterations is 5% to 21% worse and at 5 iterations 1% to 10% worse, where e-means is 1% better
   to 6% worse after 2 epochs and 2% better to 2% worse after 5. Five-epoch e-means matches full
   Lloyd in about a sixth of the time. Its weakest cells are all on the Sorolla at 32 colours (2
   epochs: 4% to 6% worse; 5 epochs: 1% to 2% worse), at every sample size, so the fitted range of
   its scaling laws does not explain them. Lloyd stopped at 10 iterations is 0.3% to 4% worse.

## e-means against Lloyd

Same samples, same k-means++ starting centres, median of 5 seeds. Each cell is time / error, where
error is the mean squared OKLab distance of the exact assignment relative to full Lloyd's (lower is
better). Times include the k-means++ start (one pass). "Lloyd-2/5/10" stop at that many
iterations. "color-core rule" is Lloyd with color-core's stopping rule (`kmeans.rs`: stop when
sqrt(sum of squared centre shifts) < 1e-3, at most 40). Full tables: `node bench.mjs <image> <ffmpeg>`.

Van Gogh:

| n | K | Lloyd-40 ms | Lloyd-2 | Lloyd-5 | Lloyd-10 | color-core rule (iters) | e-means 2 | e-means 5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6000 | 16 | 10.8 | 0.9 ms / 1.151 | 1.8 ms / 1.076 | 3.1 ms / 1.012 | 6.9 ms / 1.002 (24) | 1.2 ms / 0.991 | 2.4 ms / 0.980 |
| 6000 | 32 | 19.1 | 1.5 ms / 1.144 | 2.9 ms / 1.061 | 5.2 ms / 1.019 | 16.0 ms / 1.000 (35) | 1.9 ms / 1.012 | 3.6 ms / 0.988 |
| 6000 | 64 | 32.7 | 2.7 ms / 1.140 | 5.1 ms / 1.054 | 9.2 ms / 1.023 | 31.6 ms / 1.000 (38) | 3.3 ms / 1.038 | 6.2 ms / 1.010 |
| 25000 | 16 | 47.3 | 3.6 ms / 1.167 | 7.1 ms / 1.064 | 12.7 ms / 1.033 | 45.3 ms / 1.000 (39) | 4.8 ms / 1.016 | 9.2 ms / 0.997 |
| 25000 | 32 | 77.8 | 6.1 ms / 1.139 | 11.9 ms / 1.058 | 21.1 ms / 1.026 | 77.0 ms / 1.000 (40) | 7.5 ms / 0.991 | 14.2 ms / 0.985 |
| 25000 | 64 | 140.3 | 11.0 ms / 1.128 | 21.3 ms / 1.055 | 38.2 ms / 1.029 | 138.9 ms / 1.000 (40) | 12.6 ms / 1.004 | 23.7 ms / 0.994 |
| 100000 | 16 | 187.8 | 14.5 ms / 1.178 | 28.5 ms / 1.098 | 51.0 ms / 1.035 | 187.7 ms / 1.000 (40) | 19.7 ms / 1.001 | 39.8 ms / 1.001 |
| 100000 | 32 | 315.6 | 24.9 ms / 1.142 | 47.6 ms / 1.070 | 85.4 ms / 1.032 | 315.3 ms / 1.000 (40) | 29.8 ms / 0.989 | 58.9 ms / 0.987 |
| 100000 | 64 | 562.4 | 44.6 ms / 1.115 | 84.3 ms / 1.055 | 151.6 ms / 1.026 | 561.5 ms / 1.000 (40) | 50.3 ms / 0.994 | 96.3 ms / 0.990 |

Sorolla:

| n | K | Lloyd-40 ms | Lloyd-2 | Lloyd-5 | Lloyd-10 | color-core rule (iters) | e-means 2 | e-means 5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6000 | 16 | 10.6 | 0.9 ms / 1.109 | 1.7 ms / 1.038 | 3.0 ms / 1.012 | 6.4 ms / 1.001 (23) | 1.2 ms / 1.018 | 2.4 ms / 1.011 |
| 6000 | 32 | 17.9 | 1.5 ms / 1.093 | 2.8 ms / 1.035 | 5.3 ms / 1.017 | 13.2 ms / 1.001 (28) | 1.9 ms / 1.039 | 3.7 ms / 1.013 |
| 6000 | 64 | 26.6 | 2.6 ms / 1.111 | 5.1 ms / 1.040 | 9.0 ms / 1.011 | 22.3 ms / 1.002 (27) | 3.2 ms / 1.032 | 6.1 ms / 1.011 |
| 25000 | 16 | 45.3 | 3.6 ms / 1.103 | 6.8 ms / 1.053 | 12.5 ms / 1.020 | 44.2 ms / 1.000 (40) | 4.7 ms / 0.989 | 9.2 ms / 0.995 |
| 25000 | 32 | 77.5 | 5.9 ms / 1.156 | 11.5 ms / 1.086 | 20.9 ms / 1.029 | 75.1 ms / 1.000 (40) | 7.4 ms / 1.056 | 14.0 ms / 1.019 |
| 25000 | 64 | 137.0 | 10.7 ms / 1.114 | 20.7 ms / 1.051 | 37.4 ms / 1.027 | 137.0 ms / 1.000 (40) | 12.2 ms / 1.020 | 23.1 ms / 1.002 |
| 100000 | 16 | 175.7 | 13.9 ms / 1.116 | 26.7 ms / 1.046 | 48.4 ms / 1.024 | 172.5 ms / 1.000 (40) | 19.1 ms / 0.987 | 38.8 ms / 0.990 |
| 100000 | 32 | 300.3 | 23.9 ms / 1.173 | 45.5 ms / 1.088 | 81.3 ms / 1.040 | 297.5 ms / 1.000 (40) | 29.5 ms / 1.022 | 58.9 ms / 1.012 |
| 100000 | 64 | 558.9 | 43.3 ms / 1.119 | 83.1 ms / 1.060 | 149.9 ms / 1.026 | 557.6 ms / 1.000 (40) | 50.3 ms / 1.007 | 97.8 ms / 0.995 |

**Why the times come out this way.** Each method's cost is its number of passes over the data.
Full Lloyd makes about 41 (one for the k-means++ start); five-epoch e-means makes about 6.
41/6 ≈ 6.8×, against 5.8× measured at 100k samples and 64 colours. The equal-pass columns show the
rest: at 2 or 5 passes, e-means' error is far lower than Lloyd's, so the gain is not only that 40
iterations were too many.

**How many iterations 1.x pays depends on the picture.** Real color-core (`analyze`, 180,000 samples,
tol 1e-3, at most 40) runs 27 iterations at 8 colours on both paintings. On the Van Gogh it reaches the
40 cap at 16, 32 and 64 colours; on the Sorolla it runs 24 at 16 colours, 30 at 32, and 40 at 64.
(SPEC.org's 2026-11-19 frame settled in 10 at 16 colours.) The JS copy of the rule in the table above
agrees in kind: it reaches the cap at 25,000 samples and 16 colours or more.

## Live video, per frame (1920×804)

| Colours | Tracking | Speed | Upload (call) | Track (readback + step) | Draw | Loop missed | Decoder dropped (15 s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | on | 24 fps | 0.15 ms | 2.81 ms | 0.76 ms (call) | 2 of 570 | 1 of 360 |
| 32 | off | 24 fps | 0.19 ms | — | 0.39 ms (call) | 0 of 571 | 0 of 360 |
| 32 | on | 24 fps | 0.18 ms | 2.87 ms | 0.72 ms (call) | 1 of 570 | 0 of 360 |
| 32 | on | 60 fps | 0.15 ms | 2.27 ms | 0.37 ms (call) | 6 of 1,145 (incl. the 24 fps lead-in) | 2 of 901 |
| 32 | on | 24 fps | 0.17 ms | 2.16 ms | 3.46 ms (with GPU wait) | 2 of 571 | 0 of 359 |
| 32 | on | 60 fps | 0.12 ms | 2.92 ms | 2.96 ms (with GPU wait) | 19 of 1,145 (incl. lead-in) | 13 of 899 |

Averages. "(call)" is the time for the call to return, not the GPU's work; only the "with GPU wait"
rows bound the work, and forcing that wait itself costs frames at 60 fps. "Loop missed" counts gaps
in the video's `presentedFrames` seen by our frame callback since the video opened; "decoder
dropped" is the `<video>` element's own counter over the measured window.

**Where the tracking time goes.** The e-means step itself is 0.12 ms at 12 colours, 0.30 ms at 32
and 0.58 ms at 64 (4,096 samples; Node). About 2 ms of the 2.2 to 2.9 ms is the synchronous read of
the 160-pixel-wide frame copy back from the GPU. An asynchronous read (a pixel buffer and a fence),
with tracking one frame behind, would remove most of it.

## Against the ceiling written beforehand

| Step | Estimate | Measured |
| --- | --- | --- |
| Regrade shader, 1080p-class | about 0.1 ms | 1.3 to 3.4 ms on 4.6 MP, 3.0 to 3.5 ms on video, both with the wait |
| Frame upload | about 1 ms | 0.12 to 0.19 ms to return; GPU work not separated |
| Readback of the small copy | 1 to 2 ms | about 2 ms |
| One e-means batch, K = 16 | about 0.1 ms | 0.12 ms (K = 12) |
| Lloyd, 50k, K = 16 | 30 to 60 ms | 45 ms at 25k, 176 to 188 ms at 100k: worse, because this JS is scalar |

The "with wait" times are 10 to 30 times the FLOP estimate. They include a full GPU round trip (a
1-pixel `readPixels`) and the shader's two loops over K with an `exp` each. A timer query would
separate the two. It does not matter yet: everything fits in a frame with room to spare.

## Correctness

- **Shader.** The shader and the JS formula agree exactly (worst difference 0 of 255) on 256 pixels
  of each of the three images at 12 and 64 colours (`window.__check()`). The check reads its input
  from the WebGL texture: Chrome decodes some JPEGs a byte differently for WebGL than for a 2D
  canvas, which the regrade then stretches to 3.
- **Using the page.** Driven over the DevTools protocol as a user would: the file picker (still,
  video, still, the same video twice), a real mouse drag on the a·b plane (the offset changed and
  the picture changed), and no page exceptions. Two fixes came out of it: opening a new file now
  ends the old video's frame loop, and choosing the same file again reopens it.

## What this does not show

- **Electron.** Not tested. It is Chromium, so the same code should behave the same; the planned
  first proof (SPEC.org) still has to run there.
- **Hand feel.** All runs were headless. Nobody has yet dragged a centre by hand and judged it.
- **Identity under tracking.** Streaming e-means keeps each centre's index (no revival, constant
  step), so an edit stays attached to that index. Whether it stays on the *same-looking* colour
  through a scene cut was not measured.
- **Wide gamut and HDR video.** Everything here is sRGB and 8 bits.

## Next, if this merges

1. Asynchronous readback for tracking.
2. Target palettes: a Poline-style path between anchor colours, built in OKLCh; and the reverse,
   fitting such a path through an image's clusters, so its palette can be exported as a function.
3. e-means, two epochs, as the still default; five epochs (or Lloyd) for 6,000 samples with many
   colours.
