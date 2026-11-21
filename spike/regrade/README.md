# Spike: regrade by cluster, and e-means

A throwaway spike on branch `spike/regrade`. It answers three questions about what Color Tool could do.
It is not the 2.0 design: the page is plain on purpose.

1. **Still regrade.** Can a user drag a cluster's colour and see the image follow while they drag?
2. **Video regrade.** Can a playing video be regraded on the fly?
3. **e-means.** Does Meta FAIR's e-means (Bessa et al. 2026, arXiv 2611.09501) beat Lloyd's k-means at
   our scale (d = 3, K ≤ 64, 6k to 100k samples)? Can it track a playing video, one batch per frame?

## How the regrade works

k-means gives K centres in OKLab. The user moves centre j by an offset d_j. Each pixel p moves by a
weighted blend of the offsets of the centres near it:

    p' = p + Σ_j w_j(p) d_j,   w_j ∝ exp(-|p - c_j|² / σ²), normalised

A hard nearest-centre shift would show seams at cluster edges; the soft weights remove them. This is the
idea of palette-based photo recolouring (Chang et al., SIGGRAPH 2015), simplified. The work per pixel is a
few dozen arithmetic operations, so it runs in a WebGL2 fragment shader.

## The ceiling, written before measuring

Machine: Apple M3 Max (40-core GPU, about 16 TFLOPS FP32, about 400 GB/s).

| Step | Estimate | Reasoning |
| --- | --- | --- |
| Regrade shader, 1080p, K = 16 | about 0.1 ms | about 400 FLOP/pixel × 2.07 M pixels = 0.8 GFLOP |
| Upload a 1080p video frame to a texture | about 1 ms | 8 MB per frame |
| Read back a 160×90 sample for clustering | 1 to 2 ms | a synchronous GPU read stalls the pipeline |
| One e-means batch, 4,096 samples, K = 16 | about 0.1 ms | 65 k distance evaluations in JIT-compiled JS |
| Lloyd, 50 k samples, K = 16, 40 iterations | 30 to 60 ms | 32 M distance evaluations |
| e-means, 50 k samples, K = 16, 5 epochs | 5 to 10 ms | about one eighth of Lloyd's distance evaluations |

The frame budget at 60 fps is 16.7 ms. If the estimates hold, live video regrade with live clustering fits
in about 3 ms per frame, and the display's refresh rate is the limit.

## Files

| File | What it is |
| --- | --- |
| `oklab.js` | sRGB ↔ OKLab (Ottosson 2021) |
| `kmeans.js` | Seeded k-means++ with Lloyd, e-means (batch), and e-means (streaming, one batch per frame) |
| `regrade-gl.js` | The WebGL2 regrade pass |
| `index.html` | The spike page: open an image or video, drag centres, play |
| `bench.mjs` | Lloyd against e-means on the same samples and the same starting centres |
| `RESULTS.md` | What was measured |

Test media is not committed (the repository is public). `fetch-media.sh` downloads it.

## Credits

e-means: faiss `contrib/e_means` (MIT, Meta Platforms). The port follows `base.py` and `e_means.py`:
the EMA update (Algorithm 1, line 8), the cosine-annealed step, the batch and step scaling laws, and
dead-cluster revival.
