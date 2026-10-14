---
node_id: AI-IMP-205
tags:
  - IMP-LIST
  - Implementation
  - Browser
  - Wasm
  - Worker
  - Compute
  - Epic-029
kanban_status: planned
depends_on: [AI-EPIC-029, AI-IMP-204]
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.84
date_created: 2026-10-14
date_completed:
---

# AI-IMP-205 (F1b) — worker/WASM current-core compute and exact parity

> Minted by the Review Lead 2026-10-14 from Sol's draft `reviews/EPIC-029/f1b-worker-wasm-compute-parity-ticket-draft.md` (kept unchanged as the review record). Symbolic names in the body: F1a = AI-IMP-204, F1b = AI-IMP-205, F1c = AI-IMP-206.

## Lead amendments (binding; functional-path F1 verdict, 2026-10-14)

- **A1, transcendental parity, the FIRST step of this ticket:** color-core calls `powf` (sRGB transfer, color.rs:27/36/472/480)
  and `cbrt` (OKLab, color.rs:91-93/194/253/507-509). Neither is guaranteed correctly rounded, so the native libm (macOS)
  and the wasm32 one may differ in the last bit; one ulp can flip a cluster assignment and break the digest. Before any
  adapter work: a probe comparing native vs wasm32 BIT-FOR-BIT over the full 8-bit sRGB transfer domain (256 inputs each
  way) and a dense sweep of the LMS range for `cbrt`. **If identical:** record it and proceed. **If any differ:** stop and
  report. The lead's intended fix is ONE implementation on both targets: the pure-Rust `libm` crate for `cbrtf`/`powf` (and
  a committed 256-entry constant table for the 8-bit sRGB decode), with any resulting native golden/snapshot change ruled
  as its own disclosed step. No tolerance is pre-granted.
- **A2, the toolchain pin:** `wasm-bindgen = "=0.2.128"` (exact), with `wasm-bindgen-cli` 0.2.128 installed via
  `cargo install --locked`; target `wasm32-unknown-unknown`; no `wasm-pack`; `wasm-opt` optional and, if used, pinned and
  reported. If 0.2.128 cannot build, report it; don't float the version.
- **A3, size ceiling:** the release `.wasm` must be at most **4 MiB uncompressed**. Report the exact size; over the ceiling =
  stop for a lead ruling (likely trimming `image` decoder features), not a silent feature cut.

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
- `color-core/Cargo.toml`: optional Rayon/parallel feature and digest dependency; **`libm = "=0.2.16"`** (A1 ruling).
- `color-core/src/color.rs` (**added by lead amendment, 2026-10-14, A1 ruling 595ccf7**): the committed 256-entry `f32`
  sRGB decode table (exact bit patterns, kept in this file) for the 8-bit path, and `libm::powf` / `libm::cbrtf` in the
  continuous transfer and cbrt call sites. No other change to this file.
- `color-core/tests/srgb_decode_table.rs` (new, **lead amendment**): the native-only provenance test (table == today's
  native `srgb_to_linear(i/255.0)` for all 256) and the shared table-read test. Unit tests inside `color.rs` are an
  acceptable alternative; use one, not both.
- `tauri-app/src-tauri/Cargo.toml` (**added by lead amendment 2, 2026-10-14**; Sol found that optional Rayon would
  silently make the shipped app sequential): `[features]` becomes exactly `default = ["simd", "parallel"]`,
  `simd = ["color-core/simd"]`, `parallel = ["color-core/parallel"]`. The `color-core` dependency KEEPS
  `default-features = false`, so `--no-default-features` stays an honest scalar/sequential path. No other change to
  this file. **Acceptance:** report `cargo tree -p tauri-app -e features -i color-core` showing `parallel` and `simd`
  enabled under the default build, and the same command with `--no-default-features` showing neither.
- **Lead amendment 3, 2026-10-14 (randomness parity; ruling `reviews/EPIC-029/f1b-rng-portability-ruling.md`):**
  - `color-core/Cargo.toml`: `rand = { version = "0.8", default-features = false }` (drops `getrandom`; no
    `getrandom/js`, no `small_rng` feature once SmallRng is gone; add `alloc` only if compilation proves it needed).
  - `color-core/src/rng.rs` (new): `PortableRng`, an in-tree Xoshiro256++ implementing `rand_core::RngCore` +
    `SeedableRng`, seeded exactly like rand 0.8's 64-bit `SmallRng` (SplitMix64 `seed_from_u64`; `next_u32` = the high
    32 bits of `next_u64`), identical on every target. No new crate.
  - `color-core/src/kmeans.rs` and `color-core/src/image_pipeline.rs` (the latter added here): replace `SmallRng` with
    `PortableRng`; every `gen_range` over `usize` becomes a `u64` draw (`rng.gen_range(0..n as u64) as usize`). No other
    change.
  - Tests: a native-only (64-bit) oracle test that `PortableRng` equals `rand::rngs::SmallRng` for seeds 0, 1, 42, the
    default seed and `u64::MAX` over 10,000 `next_u64` AND 10,000 `next_u32` draws; and the existing k-means snapshot and
    golden unchanged (the golden-stop rule still holds). Prove `getrandom` absent with `cargo tree --target
    wasm32-unknown-unknown -p color-core-wasm -i getrandom` (expected: no match).
- **Lead amendment 4, 2026-10-14 (CORRECTS amendment 3's seeding clause; Sol's oracle failed at seed 0, draw 0):**
  rand 0.8.8's `SmallRng` does NOT override `seed_from_u64` (`rngs/small.rs:105-117`), so it inherits rand_core 0.6.4's
  default PCG32 seed fill (`rand_core/src/lib.rs:335+`), not the inner type's SplitMix64. Therefore `PortableRng` MUST NOT
  override `seed_from_u64` (inherit the same rand_core default); its `from_seed` mirrors
  `rngs/xoshiro256plusplus.rs:34-41` exactly, including the all-zero-seed branch, which falls back to the SplitMix64
  seeding of 0 (a private helper copied from lines 46+); `next_u32` stays the high 32 bits of `next_u64`. Every other
  clause of amendment 3 and the oracle test stand unchanged.
- **Lead amendment 5, 2026-10-14 (wasm has no `std::time::Instant`; Sol's feasibility stop):** `Instant::now()` panics on
  `wasm32-unknown-unknown`. Duration is already excluded from the digest, so this is an honesty question, not a parity one.
  - `color-core/src/clock.rs` (new, private): `Stopwatch { start() , elapsed_ms() -> Option<f64> }`. Native: wraps
    `Instant` exactly as today (`Some`). `cfg(target_arch = "wasm32")`: holds nothing and returns `None`. No other API.
  - `color-core/src/lib.rs`: `mod clock;` (private) only.
  - `color-core/src/image_pipeline.rs` (lines 3/99/114/126/144) and `color-core/src/analyze.rs` (lines 10/192/194): replace
    `Instant` with `Stopwatch`. Where the existing field needs a number, use `elapsed_ms().unwrap_or(0)` /
    `unwrap_or(0.0)` ONLY in core, and no other change to either file. Native durations are therefore unchanged.
  - The WASM adapter / worker (already fenced) OVERWRITES `durationMs` with the worker's own `performance.now()` delta
    measured around the synchronous call, so the browser never surfaces core's placeholder 0 as a measurement. A test asserts
    the worker-reported duration is the JS-measured one (nonzero for the fixed still).
- **Lead amendment 6, 2026-10-14 (A1 COMPLETED; Sol's digest stop: 4 OKLch-hue values 1 ulp apart from `f32::atan2`):**
  A1 named only `powf`/`cbrt`; the lead's full inventory of production `color.rs` (tests start at line 711) adds:
  - `atan2` (405) → `libm::atan2f`; `cos`/`sin` (415/416) → `libm::cosf`/`libm::sinf` (not correctly rounded; same rule).
  - `powi(3)` ×6 (454, 465, 513, 516, 536, 538) → explicit `x * x * x` (left-to-right). `powi` lowers to an intrinsic whose
    multiplication order isn't promised across targets; three plain multiplies are exact IEEE ops everywhere.
  - `to_degrees`/`to_radians` stay (multiplication by a constant: deterministic). `sqrt` stays (correctly rounded).
  - Only those lines of `color-core/src/color.rs` change. Test-module (`#[cfg(test)]`) oracles stay native.
  - **Golden step:** run every existing native golden/round-trip/snapshot. If any EXISTING expected value changes: STOP and
    report (fixture, field, before/after bits) before editing it. `color-core/tests/fixtures/f1-parity.json` (205's own new
    file) may be regenerated from the native default build after this change; disclose the old and new digest.
  - Acceptance: the A1 probe extended to `atan2f`/`sinf`/`cosf` over a dense grid (0 mismatches), and the encoded PNG/JPEG
    digests equal across native default, native scalar and wasm32.
- **Golden/snapshot fixtures are NOT authorized by this amendment.** If the A1 golden step (ruling step 4) shows any
  expected value changing, stop and report; the lead names the exact fixture paths in a further amendment.
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
  **Lead amendment (2026-10-14):** superseded by A2/A3: there is no wasm-pack; read "the pinned `wasm-bindgen-cli`
  0.2.128 (A2) and the 4 MiB release ceiling (A3)".
