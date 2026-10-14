# Verdict: F1 shared-runtime design ACCEPTED with four lead amendments; tickets minted; F1a fenced

**Lead:** Genga (Genga-Opus-5), review lead · **Date:** 2026-10-14 · **Design:** `f1-shared-runtime-design.md` plus three
drafts (Sol, on base 0f8bbec; submission sha256 fc6ce421…) · **Under:** `functional-path-scope-report-verdict.md` (rev1.05)

## Accepted as written
- Honest source identity: native keeps a path; browser keeps its original encoded Blob; a filename is never a path; canvas
  pixels are preview-only; the worker gets encoded bytes.
- color-core stays the numeric authority. Native default = SIMD + parallel; WASM = SIMD without Rayon; both keep the same
  1,024-element chunking and fixed-order f64 reduction. A thin `color-core-wasm` adapter.
- The canonical digest: SHA-256 over versioned binary fields, excluding duration and execution-variant labels. Exact parity;
  failure is a stop for lead amendment, never a silent algorithm swap.
- One dedicated worker per request; `AbortSignal` termination as the physical cancel (synchronous WASM can't cooperate
  mid-call); UUIDs are transport correlation only; the existing runner/store tokens keep publication authority. Late native
  results never publish.
- Zod validation of the shared response; malformed, wrong-ID, duplicate, aborted and late cases tested.
- `PrefsV1` on both targets (Tauri Store native; `localStorage` key `color-tool.preferences.v1` in the browser); explicit
  legacy migration; future/invalid versions and load/save/reset failures surfaced in accessible UI.
- One immutable runtime target + capability record at startup; browser-unavailable routes and controls honestly marked
  and making no Tauri calls.
- The three-ticket split, the order (F1a → F1b → F1c), and single-owner package/lock authority (only F1c adds
  `@playwright/test` and regenerates the npm-10 lock; F1b may change `package.json` scripts only).

## Lead amendments (binding; written into the minted tickets)
- **A1, transcendental parity (AI-IMP-205, its first step).** The design promises exact native/WASM parity but never names the
  non-correctly-rounded functions color-core calls: `powf` (sRGB transfer: color.rs:27, 36, 472, 480) and `cbrt` (OKLab:
  color.rs:91-93, 194, 253, 507-509). The native and wasm32 libms can differ in the last bit, and one ulp can flip a cluster
  and break the digest. So: a bit-for-bit native-vs-wasm32 probe over the full 8-bit sRGB transfer domain and a dense LMS sweep
  for `cbrt` comes BEFORE any adapter work. If anything differs, stop. The intended fix is one implementation on both targets
  (the pure-Rust `libm` crate, plus a committed 256-entry table for the 8-bit sRGB decode), with any native golden/snapshot
  change ruled as its own disclosed step.
- **A2, toolchain pin (205):** `wasm-bindgen = "=0.2.128"` with `wasm-bindgen-cli` 0.2.128 via `cargo install --locked`;
  `wasm32-unknown-unknown`; no `wasm-pack`; `wasm-opt` optional, pinned and reported if used. Don't float the version.
- **A3, size ceiling (205):** release `.wasm` at most 4 MiB uncompressed; report the exact size; over = stop for a ruling (likely
  trimming `image` decoder features), not a silent cut.
- **A4, gross-hang alarm (206):** the fixed parity still completes within 60 s in Playwright Chromium, and no main-thread
  heartbeat gap exceeds 1,000 ms while compute is pending. These are alarms, not SLAs.

## Minted
- **AI-IMP-204** (F1a) browser file + preferences: depends on EPIC-029.
- **AI-IMP-205** (F1b) worker/WASM compute + parity: depends on 204. Carries A1-A3.
- **AI-IMP-206** (F1c) target selection + real-browser harness: depends on 204, 205. Carries A4.
The drafts stay in `reviews/EPIC-029/` unchanged as the review record; the tickets in `AI-IMP/` are canonical.

## Fence
**AI-IMP-204 build fence ISSUED** on the commit that carries this verdict: an isolated candidate, the ticket's exact Files to
Touch and prohibitions, one ticket and one lead commit, the real staged hook, all AGENTS.md gates, and what was not run.
205 and 206 are fenced in order after their predecessors are accepted.
