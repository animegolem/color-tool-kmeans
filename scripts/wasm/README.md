# compute-wasm build

- Build (wasm-pack):
  - `node scripts/wasm/build.mjs` → `compute-wasm/pkg/` (bundler target).
  - `node scripts/wasm/build.mjs --node` → also generates `compute-wasm/pkg-node/` for Node harnesses.
- Import (renderer):
  - `const mod = await import('compute-wasm');`
  - `const out = mod.analyze_image(Uint8Array, { width, height, k, stride, minLum, space, tol, maxIter, seed, maxSamples });`

Notes
- This module expects raw pixel buffers (RGB or RGBA) and image dimensions.
- Clustering space supports: RGB|HSL|HSV|YUV|CIELAB|CIELUV.
- Returns `{ clusters[], iterations, durationMs, totalSamples, variant: 'wasm' }`.
- Parity harness: `node scripts/wasm/harness.mjs` (after running build with `--node`) compares wasm output against the native CLI on a synthetic fixture.
- Prerequisite: `wasm-pack` must be installed and on the PATH (`cargo install wasm-pack`).
