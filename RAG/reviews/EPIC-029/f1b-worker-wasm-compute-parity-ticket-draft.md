---
node_id: AI-IMP-*
tags:
  - IMP-LIST
  - Implementation
  - Browser
  - Wasm
  - Worker
  - Compute
  - Epic-029
kanban_status: planned
depends_on: [AI-EPIC-029]
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.84
date_created: 2026-10-14
date_completed:
draft_key: F1b
draft_depends_on: [F1a]
---

# DRAFT F1b — worker/WASM current-core compute and exact parity

The Review Lead assigns the final AI-IMP number and replaces `F1a` with its
minted dependency. This draft is not an implementation fence.

## Run current color-core from encoded bytes off the browser main thread

The renderer has only a Tauri compute implementation. The removed WASM crate
duplicated obsolete CIELAB/color/k-means logic and accepted decoded pixels.
Add a thin wasm-bindgen crate over current `color-core`, a non-Rayon sequential
feature path, and a dedicated-worker adapter that consumes the Blob retained by
F1a. Preserve the existing runner/store tokens as publication authority.

Done means the fixed encoded PNG and JPEG decode in WASM, the fixed PNG returns
the same canonical digest as native default-feature `color-core`, cancellation
terminates worker work and rejects stale replies, and native analysis remains
behind the same validated renderer contract.

### Out of Scope

- Restoring any source from the removed `compute-wasm` implementation.
- Decoded-RGBA compute, server upload, main-thread WASM, worker pooling, or a
  numeric tolerance.
- Values, Batch, exports, video/live playback, redesign integration, hosting, or
  full IMP-202 profiling.
- Playwright, npm dependencies, npm lock changes, or CI/browser job changes
  (F1c).
- A general public CLI/MCP product; the parity helper is test-only.

### Design/Approach

Follow `f1-shared-runtime-design.md` §§2–4. Make Rayon optional behind a
`parallel` feature while retaining default native `simd + parallel`. Implement
the non-parallel assignment with identical chunking and fixed-order reduction.
Add `color-core-wasm` as a thin workspace member depending on current core with
SIMD selected and Rayon absent.

The renderer worker receives transferred encoded bytes, calls the generated
binding, and replies with its opaque request ID. One worker is owned by one
active request. Abort revokes the ID, terminates the worker, and rejects with a
typed cancellation; the existing runner token still gates every publication.
Native and worker replies use one strict validator.

Add `resultDigest` in shared core using the ruled versioned binary encoding and
SHA-256. The native default-feature fixture establishes the expected digest;
Node/WASM and browser consumers compare exactly. Any decoder/WASM build failure,
unreasonable artifact size, or digest mismatch stops for a lead amendment.

### Files to Touch

- `.gitignore`: ignore only generated `color-core-wasm/pkg*` and its target
  output.
- `Cargo.toml`: add the thin WASM workspace member.
- `color-core/Cargo.toml`: optional Rayon/parallel feature and digest dependency.
- `color-core/src/kmeans.rs`: parallel/sequential chunk collection with one
  deterministic reduction.
- `color-core/src/digest.rs` (new): versioned canonical-result encoder and
  SHA-256.
- `color-core/src/analyze.rs`: include the shared result digest.
- `color-core/src/lib.rs`: export the digest contract.
- `color-core/tests/analyze_bytes.rs`: encoded-byte/path/default/scalar digest
  cases.
- `color-core/tests/kmeans_snapshots.rs`: assert default and non-parallel
  behavior remains fixture-compatible where needed.
- `color-core/tests/fixtures/f1-parity.json` (new): input hash, resolved params,
  digest version, and native expected digest.
- `color-core-wasm/Cargo.toml` (new): cdylib/rlib wasm-bindgen adapter manifest.
- `color-core-wasm/src/lib.rs` (new): request conversion and delegation only.
- `scripts/wasm/build.mjs` (new): pinned-tool check and web/node WASM builds.
- `scripts/wasm/parity.mjs` (new): encoded PNG/JPEG and exact digest harness.
- `scripts/wasm/README.md` (new): generated-artifact and toolchain boundary.
- `tauri-app/package.json`: WASM build/parity scripts only; no package addition.
- `tauri-app/vite.config.ts`: resolve the generated WASM package and module
  worker.
- `tauri-app/src/lib/compute/worker-protocol.ts` (new): closed request/reply and
  serialized-error unions.
- `tauri-app/src/lib/compute/worker-protocol.spec.ts` (new): protocol validation.
- `tauri-app/src/lib/compute/color-analysis.worker.ts` (new): thin WASM worker.
- `tauri-app/src/lib/compute/worker-client.ts` (new): per-request worker,
  transfer, abort/termination, and reply ownership.
- `tauri-app/src/lib/compute/worker-client.spec.ts` (new): wrong/duplicate/late
  reply and cancellation tests with an injected worker.
- `tauri-app/src/lib/bridges/compute.ts`: shared response parser, typed errors,
  source-aware native/browser adapters, and digest validation.
- `tauri-app/src/lib/bridges/compute.spec.ts` (new): native/worker contract and
  invalid-response cases.
- `tauri-app/src/lib/compute/bridge.ts`: pass source plus invocation context.
- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`: own the abort
  controller/request ID while retaining runner/store token gates.
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`: execute
  abort/success/error/finally successor cases through the production runner.

`tauri-app/package-lock.json`, `.github/workflows/ci.yml`, application views
other than the named runner/tests, native command source, and every file not
listed above are forbidden. `tauri-app/package.json` may change scripts only;
dependencies/devDependencies and the npm lock must remain byte-identical. The
ignored workspace `Cargo.lock` is not a deliverable and must not be forced into
Git.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `parallel = ["dep:rayon"]` and preserve native default features;
      prove `color-core-wasm` has neither Rayon nor Tauri in its normal wasm tree.
- [ ] Implement sequential chunk collection with the same 1,024-point chunks
      and fixed-order reduction as the parallel path.
- [ ] Keep default and no-default k-means snapshots green; add a direct
      parallel/non-parallel equality case for the parity fixture.
- [ ] Implement the versioned canonical binary encoding and SHA-256 while
      excluding `durationMs` and `variant`.
- [ ] Record the fixed PNG source hash, fully resolved parameters, digest
      version, and native default-feature expected digest.
- [ ] Add the thin wasm-bindgen adapter with no copied numeric/decode logic.
- [ ] Build and execute encoded PNG and JPEG through WASM before renderer
      integration; record release `.wasm` byte size and tool versions.
- [ ] Stop and request a lead re-ruling if the decoder does not compile/run, the
      size breaches the lead's ceiling, or exact digest parity fails.
- [ ] Add the closed worker protocol and transfer the encoded `ArrayBuffer`.
- [ ] Make each request own a worker; on abort revoke ID, terminate, detach
      listeners, and reject with a typed cancellation exactly once.
- [ ] Reject wrong, duplicate, canceled, and late replies without publishing
      result/error state.
- [ ] Make `ComputeBridge.analyze` source-aware and validate both native and
      worker responses through the same strict schema, including digest.
- [ ] Pass an opaque request UUID plus `AbortSignal` from the existing runner;
      retain its current/store token checks on success, error, and finally.
- [ ] Prove browser cancellation is not rendered as compute failure and native
      stale IPC completion cannot publish after revocation.
- [ ] Run every AGENTS.md frontend/Rust gate, scalar snapshot, default/nonparallel
      parity, Tauri-free/Rayon-free trees, encoded WASM harness, RAG generator
      review, and real staged hook; record counts, sizes, versions, and warnings.
- [ ] Verify the npm lock, CI workflow, native command source, and all unlisted
      files remain byte-identical.

### Acceptance Criteria

**Scenario: Shared encoded-byte core**  
**GIVEN** the fixed encoded PNG and ruled resolved parameters  
**WHEN** native default-feature core and the WASM binding analyze it  
**THEN** both decode through current `color-core`  
**AND** both return the exact checked-in `resultDigest`  
**AND** no old CIELAB or duplicated algorithm source exists.

**Scenario: Browser analysis stays off the main thread**  
**GIVEN** a Blob-backed still  
**WHEN** browser analysis starts  
**THEN** encoded bytes are transferred to a dedicated module worker  
**AND** only a matching live request ID may resolve the bridge promise.

**Scenario: A request is superseded**  
**GIVEN** worker request A is pending  
**WHEN** the runner cancels A and starts B  
**THEN** A's worker is terminated and its promise rejects as canceled once  
**AND** any late A reply is ignored  
**AND** only B's live runner/store token may publish success/error/finally.

**Scenario: Tauri behavior is preserved**  
**GIVEN** a real path source and a Tauri target  
**WHEN** analysis is requested  
**THEN** the existing `analyze_image` IPC runs and its response passes the same
validator/digest contract  
**AND** renderer abort revokes publication even if backend work finishes.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

None yet; implementation has not begun. The build fence must name the permitted
`wasm-pack` version and release-size ceiling before this checklist can close.
