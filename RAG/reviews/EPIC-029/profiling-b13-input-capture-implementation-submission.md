# AI-IMP-202 B13 capture-phase input implementation submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev 0.42 §10.21.
**Two-file source/test implementation complete; all required local gates pass. Prepared and uncommitted for source acceptance. No build, app/browser control, native capture, performance experiment, or Git mutation was performed.**

## Implementation outcome

The authorized capture-phase repair is applied exactly:

1. `tauri-app/src/lib/views/home/ParameterControls.svelte`
   - Changed the six existing profiling hooks from `oninput` to `oninputcapture` for clusters range, clusters number, quality range, ignoreTopN range, mergeThreshold range, and snapToReal checkbox.
   - No other byte differs from the accepted B10/B12 source. The result is byte-identical to B12's accepted capture fixture.
2. `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts`
   - Renamed and commented the installed-binding/native-transport-stub regression to say accurately that it proves synthetic binding conversion and wire persistence, not trusted browser listener ordering.
   - Updated the obsolete literal source assertion to require all six `oninputcapture` hooks and reject the old literal form.
   - Added an element-specific Svelte compiler contract for all six profiled controls.
   - Added an in-memory old-hook negative control using the same contract.

No scheduler, debounce, dedup, request key, coordinator, collector/schema, binding, input type, pointer behavior, numerical behavior, native code, or persistence behavior changed. In particular, B12 verdict R4 is preserved: the unchanged 400 ms debounce may legitimately supersede intermediate input; this implementation does not force intermediate work to execute.

## Compiler regression contract

The new helper compiles `ParameterControls.svelte` with the installed Svelte compiler (`generate: 'client'`, `dev: false`) and verifies:

- the exact six `bind_value` elements and fields remain, including clusters range and number separately;
- the exact three `bind_checked` elements and fields remain;
- each of the six named profiling elements has its own direct `input` registration;
- each registration calls `observeAnalysisInput` with the correct control;
- each registration ends with `capture=true`;
- each registration precedes that same element's `bind_value` or `bind_checked` call;
- delegated `input` is absent from the generated tail;
- delegated `pointerdown` and `pointerup` remain present;
- transforming the source in memory back to `oninput` causes the same contract to throw.

The focused suite is green with the production source and proves the old-hook negative arm rejects. This is a compiler contract, not a browser or native-execution claim; B12 retains the separate trusted Chrome evidence.

## Source identity and boundary preservation

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD before/after: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Exact `git status --porcelain=v1 -uall`: 57 paths before and after; both are byte-identical to B11's accepted `source-status.after.txt`.
- Accepted baseline hashes before edit: 57/57 pass.
- After edit: the two authorized paths differ; the other 55 accepted hashes pass.
- Candidate `ParameterControls.svelte` after edit is byte-identical to B12 `fixtures/capture/.../ParameterControls.svelte`.
- No other candidate path was formatted or authored.
- No commit, checkout, rebase, branch/ref, index, or other Git write was attempted.

| File | Accepted before SHA-256 | Prepared after SHA-256 |
|---|---|---|
| `tauri-app/src/lib/views/home/ParameterControls.svelte` | `0782f5828e9c7516df19c414449af36eb00150c777382275f30010da52122bb5` | `706e8e9c9c640e51fd2de73e7a92e4caad21738ad0ae8c8e99da939dfa346dab` |
| `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts` | `136618ea9ee05f011b90e676081a1b2ee12c58191b54948095db175dce6237f2` | `04d70b430559194e725d785813034bd90919af6164f6c9654e53ce2c9570cfec` |

## Validation results

Runtime versions: Node `v26.8.1`, npm `11.19.0`, rustc `1.90.0`, cargo `1.90.0`. Node 20/Windows remain separate CI gates.

| Gate | Result |
|---|---|
| `npm run test -- --run src/lib/views/__tests__/profiling-svelte.spec.ts` | exit 0; 19/19 tests, 1/1 file |
| `node --test scripts/profiling/*.test.mjs` | exit 0; 82/82 tests |
| `npm run test -- --run` | exit 0; 335/335 tests, 27/27 files |
| `npm run check` | exit 0; 0 errors, 2 accepted existing AUD-020 accessibility warnings |
| `npm run lint` | exit 0 |
| `npm run format:check` | exit 0 |
| `cargo fmt --all -- --check` | exit 0 |
| `cargo clippy --workspace --offline -- -D warnings` | exit 0 |
| `cargo test --workspace --offline` | exit 0; 72 passed, 0 failed, 1 intentional ignored emitter |
| `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` | exit 0; 1/1 scalar snapshot |
| `git diff --check` | exit 0 |

The intentional ignored Rust emitter is independently exercised by the passing Node profiling-native-wire test, as in the accepted baseline.

Validation logs and before/after receipts are preserved mode 0600 under:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b13.gates`

The log index `evidence-index.sha256` has SHA-256 `2bd714956c50ea908d34b0821879d071c30a56db25a129deaba06da7032fef22` and intentionally excludes itself from its payload list.

## Self-review

- Compared both prepared files against the accepted B10 reconstructed-source copies, not merely `git diff`; the carrier contains prepared untracked files, so ordinary `git diff` omits the untracked test file.
- The component diff against accepted source is exactly six one-token attribute changes.
- The test diff contains only the authorized surrogate labeling, source assertion, compiler contract, and old-hook negative control.
- The compiler contract associates every capture registration with the same generated input variable as its binding; it does not rely only on a total count or the first hook.
- The old-hook control uses an in-memory transformation only and does not write a fixture or mutate candidate source.
- The existing synthetic null/wire regression remains enabled and passes with its exact prior expected outcomes.
- The test file grows from 782 to 892 lines and was already above the local 400-line warning threshold. This is a cohesive existing integration suite; no split is authorized or useful for this bounded change. Flag for the lead's commit-time LOC handling rather than hiding it.

## Candid friction and open gates

- An initial ordinary `git diff -- <two files>` displayed only the tracked component delta and omitted the prepared untracked test file. Review switched immediately to the accepted B10 reconstructed-source archive, which provides exact before bytes for both files. No source was changed in response.
- Full Vitest emits expected stderr for two explicit analysis-error classification tests; the suite exits 0 with 335/335 passing.
- `svelte-check` retains exactly two accepted pre-existing accessibility warnings in `VideoPanel.svelte` and `ValuesView.svelte`; neither file was touched.
- Node 20, Windows, CI, packaging, Tauri/WebKit ordering, native action correlation, bound acquisition, numerical parity, matched profiling-off/on overhead, full end-to-end flame graph, physical presentation, and owner/platform acceptance remain unrun and unclaimed.
- B10/B11/B12 and all earlier immutable artifacts/runtime were not controlled, modified, or cleaned up.

## Requested next gate

Review and reproduce this exact two-file source/gate submission. If accepted, issue the distinct immutable build and fresh native control-capture assignment under B12 verdict R4: preserve honest supersession/dedup outcomes, require full native/renderer completion only for settled actions that actually execute, and keep matched overhead and flame-graph acquisition as separate evidence gates.
