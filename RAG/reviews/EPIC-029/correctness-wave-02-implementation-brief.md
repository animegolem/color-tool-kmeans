# EPIC-029 correctness wave 02 — implementation authorized

Review Lead to existing Code Lead Sol, 2026-09-05. Owner-authorized correctness continuation while design stays with the Review Lead. This is a bounded coding assignment, not a new general review.

## Authority and baseline

- Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01.
- Branch: codex/correctness-wave-01-2026-09-05 (retain the existing stack branch; the name records its creation, not a one-wave limit).
- Required starting HEAD: 6a17da61d079635d2dcec93c896d8e05c17027d8, accepted local wave-01 tip. Lead verified clean status after creating two issue commits. Main/origin main are still 5baa20e; do not fetch/rebase/move any refs yourself.
- Normative planning carrier: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan. Read its PROJECT-RECORD rev 0.9, IMP-180, sweep-adoption-manifest.md, Round 01/02 verdicts and correctness-wave-01-verdict.md. Read candidate AGENTS.md/CLAUDE.md; note CLAUDE's old batch-drop helper-export location is stale after wave 01. The live helper is services/async-listener.ts.
- Prior submission/review files remain immutable. Your only additional planning output is the wave-02 report named below. Lead owns ticket/status/index updates and all commits. Do not poll.
- Private node_modules, Cargo caches and correctly positioned FFmpeg sidecars already exist. No npm install/ci, dependency changes or build/provisioning cleanup. Do not touch redundant bin/bin copies.

## Issue order and source review

### 1. SWEEP-009 — consistent supported media types

Adapt source 9024da4083984c7f756e47421645474cd11c8e5c, classified Adopt/P4 in Round 01. The lead rechecked current fs.ts: picker accepts tiff but omits tif, while MIME inference/source naming accept both. Share the registry across picker, drag/drop and source extension helpers. Keep public fs.ts inferMimeType compatibility and preserve existing supported media, aliases, video detection and unsupported-name fallback. This is desktop correctness, not implementation of the proposed images-only hosted edition.

Numbered lead correction W2-1: the historical plain Record tables are indexed without an own-key guard. Inputs such as sample.constructor or sample.__proto__ can return an inherited object/function instead of the declared MIME string and break canonicalImageExtension's startsWith call. Use an own-key-safe lookup (or equivalent Map) in this bounded registry. Add permanent regressions proving unsupported/prototype-named extensions never throw, infer application/octet-stream, and preserve PNG fallback; arbitrary unsupported MIME keys return null. This is a narrow correction within the adopted helper, not new ingestion policy.

Prove both pure table behavior and actual picker/drag-drop callers: use the existing fenced media-types.spec.ts and drag-drop.spec.ts if needed for mocked open/listen assertions. Test .tif/.tiff, uppercase and aliases, current image/video sets, source export naming and unknown-type fallback. Do not rely only on table equality as proof that callers consume it. Preserve wave-01 lifecycle tests.

### 2. SWEEP-011 — honest pasted-image extensions

Adapt source e7901c57aca6f5ec83f182dac5a05ffa0e5376d9 after the registry. Current App paste writes arbitrary image blob bytes under .png; native cleanup recognizes only paste-*.png. Derive path and display-name extensions from supported image MIME, using the shared registry; keep bytes unchanged and reject unsupported/missing MIME explicitly before saving. Preserve paste listener lifecycle, navigation, analysis and normal UI behavior.

Numbered lead correction W2-2: native cleanup must accept supported owned clipboard formats without becoming a blanket delete-any-paste-prefix rule. Keep exact managed-parent and prefix checks, accept supported image extensions (including legacy jpeg/tiff aliases), and preserve unrelated filenames, unsupported suffixes and external paths. Extend cache.rs tests across the supported formats and negative cases. Do not change retention ages, byte/count limits, startup behavior, publication IDs, leases or registry architecture. Timestamp-collision/source-ownership concerns are not solved by this format-only adoption; report any discovered residual instead of silently broadening it.

Retain the six-format clipboard table and unsupported MIME tests; include uppercase/whitespace normalization. Avoid redundant format tables in the renderer. No new UI controls or format conversions.

## Exact source fence

Only these nine paths in the candidate (eight historical source paths plus the existing drag/drop regression spec for actual-caller proof):

1. tauri-app/src/lib/bridges/fs.ts — media registry wiring only; no save/copy behavior change.
2. tauri-app/src/lib/services/media-types.ts — new pure registry.
3. tauri-app/src/lib/services/media-types.spec.ts — new registry/caller regressions.
4. tauri-app/src/lib/services/drag-drop.ts — MIME import/wiring only; preserve failure-atomic lifecycle.
5. tauri-app/src/lib/services/drag-drop.spec.ts — actual media payload proof if needed; preserve existing tests.
6. tauri-app/src/lib/services/clipboard-image.ts — new pure MIME helper.
7. tauri-app/src/lib/services/clipboard-image.spec.ts — new tests.
8. tauri-app/src/App.svelte — paste MIME/name/path wiring only; no shell/markup/preferences/lifecycle changes.
9. tauri-app/src-tauri/src/cache.rs — clipboard format eligibility and its tests only.

W2-3: the exact fence includes drag-drop.spec.ts beyond the historical eight-file union to prove real caller behavior. This numbered scope supplement governs over any earlier eight-file summary in PROJECT-RECORD. The lead synchronizes that summary before dispatch.

No other source/config/package/fixture/CLAUDE changes. No source tree-wide formatting. No UI foundations, IMP-178 work, native publication/quota policy, sweep patches beyond these two, active view controllers, export jobs or RAG import. At most two disjoint writers if useful; shared registry/caller dependencies mean you must establish registry ownership before parallel work. No agents commit.

## Validation and submission

Inspect each exact historical patch before adapting; never copy a later full file containing other sweep changes. Run focused tests after each issue. From tauri-app:

```text
npm run test -- --run src/lib/services/media-types.spec.ts src/lib/services/clipboard-image.spec.ts src/lib/services/drag-drop.spec.ts src/lib/views/__tests__/audit-resource-integrity.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

From tauri-app/src-tauri:

```text
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
cargo test -p color-core --no-default-features --test kmeans_snapshots
cargo tree -p color-core --edges normal
```

Offline Rust is allowed. Run native cache focused tests after issue 2, git diff --check and exact boundary checks. Record actual counts, runtime/platform, failures and recovery, environmental outputs and all unrun Node 20/Windows/Linux/native-human gates. Never turn failures into it.fails/skips, regenerate fixtures or change unrelated gates. No validate-tickets.sh exists here.

Write only /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/correctness-wave-02-submission.md as the durable report. Include base/branch/uncommitted status, per-issue source SHA to file mapping, exact test deltas, outcomes, W2-1..3 evidence, deviations/residuals and two proposed conventional commit subjects carrying SWEEP-009/SWEEP-011 and AI-IMP-180. Retain independent issue staging guidance; don't stage or commit yourself. No ticket completion or index regeneration.

Notify Review Lead task 019f7c75-2b8b-7882-9df7-0cdc1e494671 with the report path and stop. No autonomous next wave, polling, merge/PR/release or design work.
