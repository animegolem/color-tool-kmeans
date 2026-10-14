# Color core WASM build boundary

`build.mjs` builds the thin `color-core-wasm` adapter for
`wasm32-unknown-unknown`, then runs exactly `wasm-bindgen-cli 0.2.128` for both
web-worker and Node harness outputs. It rejects any other CLI version and fails
if an uncompressed generated `.wasm` exceeds 4 MiB.

Generated packages live in `color-core-wasm/pkg-web/` and `pkg-node/`. They are
ignored build artifacts, never source or release inputs to commit.
The Node package includes a generated `package.json` that marks wasm-bindgen's
Node-target glue as CommonJS inside this repository's ESM package boundary.

From `tauri-app/`:

```sh
npm run wasm:build
npm run wasm:parity
```

The parity harness sends the checked-in encoded PNG and the fixture's frozen
encoded JPEG through the Node WASM binding. Both must return the native digest
recorded in `color-core/tests/fixtures/f1-parity.json` exactly. No decoded RGBA
or numeric tolerance is used.
