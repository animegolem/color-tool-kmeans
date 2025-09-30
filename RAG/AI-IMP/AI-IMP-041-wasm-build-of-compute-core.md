---
node_id: AI-IMP-041
tags:
  - IMP-LIST
  - Implementation
  - Wasm
  - Rust
  - Compute
  - Epic-004
kanban_status: completed
depends_on: [AI-EPIC-004, AI-IMP-013, AI-IMP-014, AI-IMP-031, AI-IMP-033]
confidence_score: 0.85
created_date: 2025-09-25
close_date: 2025-09-26
---

# AI-IMP-041-wasm-build-of-compute-core

## Summary of Issue #1
Port the existing Rust compute core (sampling input provided by the UI, SoA+SIMD k-means, color conversions) to a WebAssembly module callable from the renderer. Expose a single entry `analyzeImage(params)` that mirrors the prior IPC contract and returns `{ clusters[], iterations, durationMs, totalSamples }`. Done when a small browser harness can `import()` the wasm and produce stable results on sample inputs within the documented performance envelope.

### Out of Scope
- Electron shell scaffolding and packaging.
- Native Node addon path; this ticket is wasm only.
- UI wiring; handled by the renderer bridge ticket.

### Design/Approach
- Use `wasm-bindgen` to generate JS bindings and TypeScript types; compile with `wasm-pack` in `--target bundler` mode for Vite.
- Minimize host/guest copies: accept `Uint8Array` for RGB bytes and return compact JSON for clusters.
- Reuse existing color conversion and k-means logic; gate SSE/AVX behind `cfg(target_arch = "wasm32")` (use scalar path in wasm).
- Provide deterministic seeds; ensure cross‑platform parity against the native bench harness for small fixtures.

### Files to Touch
- `compute-wasm/Cargo.toml` (new): wasm crate.
- `compute-wasm/src/lib.rs` (new): `#[wasm_bindgen]` interfaces and glue.
- `scripts/wasm/build.mjs` (new): convenience build script.
- `tauri-app/src/lib/compute/wasm.ts` (new): thin wrapper for dynamic import in the renderer.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create `compute-wasm` crate with `cdylib` target and `wasm-bindgen` dependency.
- [x] Implement `#[wasm_bindgen] pub fn analyze_image(bytes: &[u8], params: JsValue) -> JsValue`.
- [x] Port/guard color conversions and k-means for `wasm32` (disable wide/SIMD, keep scalar path).
- [x] Map RGB sampling contract to expected dataset (respect stride/minLum/seed).
- [x] Serialize result `{ clusters[], iterations, durationMs, totalSamples }` with camelCase.
- [x] Add `scripts/wasm/build.mjs` to invoke `wasm-pack build --target bundler` and copy artifacts.
- [x] Add a small Node/browser harness to call the built module on a fixed sample and log results.
- [x] Validate determinism for seeded runs vs native on a tiny fixture (ΔE and counts within tolerance).
- [x] Document build and import usage in the ticket and README note.

### Acceptance Criteria
**Scenario:** Wasm module loads and computes clusters
GIVEN the `compute-wasm` package is built
WHEN importing it in a browser harness with sample RGB data and params
THEN it resolves with `{ clusters[], iterations, durationMs, totalSamples }`
AND seeded runs are deterministic on the same host.

### Issues Encountered
- Initial attempt failed because `wasm-pack` was missing from the PATH; reran after installing (`cargo install wasm-pack`). Build + parity harness now execute with matching wasm/native outputs.
