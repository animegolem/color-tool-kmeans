# EPIC-029 sweep adoption manifest

Status: proposed integration input, not an applied or accepted stack. Baseline: main `2cc2000bce04ce2e6bda11a2853dd42595946980`; source: `f427ff40bf6efa2e332c9705830048e1b5cfe8bd`; common ancestor: `28d9e8415736cc82154fbcc2dfb90b70157ac6cf`.

Round 01 update: that is the historical review baseline and still the planning checkout base. Current main/origin main were rechecked at `5baa20e021855fbc57aebf48fa0f9b3374ded281`; divergence is **4 / 33**. Future adoption uses this or a newer explicitly reviewed tip and preserves the core stderr diagnostic correction.

## Provenance

The source contains 32 implementation commits and one historical-register commit. No source commit is on main. Preserve one-issue-per-commit provenance, including SWEEP tags; do not squash this into a generic remediation commit. New residual corrections use their AI-IMP IDs. An implementation verdict will state who may commit; this manifest does not override the delegated-agent no-commit rule.

| Source SHA                                 | Original subject                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `b3d202c39f8fc71aee0218e505b650628fbfd0c5` | fix(analysis): preserve export request ownership [SWEEP-001]                       |
| `e4924d91df848348f29a01c60bbe5736fb29b4f0` | fix(batch): pin retained IDs during ingestion [SWEEP-005]                          |
| `9f8e07b8285fa07404fcfd04f36b4428e935df7f` | fix(values): revoke requests when media is removed [SWEEP-006]                     |
| `362b4a4a9327040682944e89ddbb8fd3d138932c` | fix(events): make drag registration failure-atomic [SWEEP-004]                     |
| `a09c834d0d2ac990bbed210ebbf206a3057ca665` | fix(video): reset cached seek ownership [SWEEP-003]                                |
| `880c09f765d77c5b8f02d0522cead7a710384736` | fix(exports): prevent destructive same-file copies [SWEEP-002]                     |
| `42137f7451297c8bff52cb0ee73c83845979c14f` | fix(colors): invalidate same-path replacements [SWEEP-010]                         |
| `f1564b2d7660cdb9c817e6bd7e62832ddb708a7f` | fix(video): sample near-cap barcode tails [SWEEP-007]                              |
| `9024da4083984c7f756e47421645474cd11c8e5c` | fix(media): unify supported type registry [SWEEP-009]                              |
| `0857489c2f658c795c29df7f51aa2ba217cf7b65` | fix(values): snapshot only settled frames [SWEEP-008]                              |
| `e7901c57aca6f5ec83f182dac5a05ffa0e5376d9` | fix(clipboard): preserve pasted image formats [SWEEP-011]                          |
| `648686dc04e70c6d3ae3ff2a17e48dfc7c96e751` | fix(kmeans): refine reseeded empty clusters [SWEEP-012]                            |
| `86199ac1a6b56eea455b70ea542e9bfd9fa18e56` | fix(prefs): serialize hydration and writes [SWEEP-016]                             |
| `94399faca4280b430675d25446c3ecb5259ca4d6` | fix(media): cancel stale pending video switches [SWEEP-013]                        |
| `1e48deb6d3cac490096fc45cd1ca1fc1c1b1025a` | fix(batch): invalidate replaced pinned content [SWEEP-017]                         |
| `41d61ba5f2c32249e623b41172d75f6335b0fc49` | fix(exports): retry analysis after file switches [SWEEP-015]                       |
| `ca147e0a8d4c455c771be0f40d20334c2d581217` | fix(values): exclude transparent pixels from analysis [SWEEP-014] [loc-bypass]     |
| `0f15c8e5697613586cabc6d8f1e203fa92f3615b` | fix(values): isolate native artifact generations [SWEEP-021] [loc-bypass]          |
| `dd73c6ba370de1d14d527b85bfecda1387004ce2` | fix(cache): prune artifacts only before session ownership [SWEEP-022] [loc-bypass] |
| `ea7944da84423f4ca9d8a19c95e3484acef1417f` | fix(media): guard raw-video thumbnail ownership [SWEEP-018]                        |
| `84c8f88b85752303cfb3a4dce6f1670920bf7168` | fix(batch): isolate concurrent grid generations [SWEEP-019]                        |
| `4ca1a7090a11357657349ecc7b6533ce7e0fccb6` | fix(batch): recover failed result refreshes [SWEEP-020] [loc-bypass]               |
| `48238c00507b2031fa36930433729c0d2ee2c61b` | refactor(exports): unify color formatting helpers [SWEEP-026] [loc-bypass]         |
| `755d0a6b0eaf12454113e5743be7c056cee4b128` | refactor(video): unify FFmpeg failure handling [SWEEP-024] [loc-bypass]            |
| `1546b79c6d75e5dfd6949ae8ce2763c06a8669c9` | fix(video): revoke unmounted view ownership [SWEEP-023] [loc-bypass]               |
| `dc49245a3ce8dfd93109074c8dca4d470a552ad5` | refactor(batch): use the typed path compute bridge [SWEEP-025] [loc-bypass]        |
| `489c3627d264b67e9789f0bb25ac5d41a525f5df` | refactor(commands): offload blocking native work [SWEEP-029] [loc-bypass]          |
| `e1954a65b71264c733cb620e565a7781ead22001` | refactor(analysis): unify scroll restoration ownership [SWEEP-028] [loc-bypass]    |
| `3640300831162cf530e61b9cfe6f0b82edf49c23` | refactor(bridges): validate media IPC responses [SWEEP-027]                        |
| `4dbf714b51ddfaa57bca225945ae16c308738b2c` | refactor(exports): unify Values Notan cell mapping [SWEEP-032] [loc-bypass]        |
| `d64b65923e6e6eb2865702ebe9df36c8e047345a` | refactor(exports): reuse chart save pipeline in Values [SWEEP-031] [loc-bypass]    |
| `e383b8812a68326fd7a0b0a7d4bbcc4edae4e59f` | refactor(cache): unify collision-safe artifact IDs [SWEEP-030] [loc-bypass]        |
| `f427ff40bf6efa2e332c9705830048e1b5cfe8bd` | docs(audit): register the control-flow sweep [SWEEP-AUDIT] [loc-bypass]            |

## Bounded file allowance for AI-IMP-180

These are exact source-stack paths, not permission to refactor their unrelated contents. Restore only reviewed issue changes and directly associated tests. The old native k-means path is remapped to `color-core/src/kmeans.rs`. Source history's RAG files belong to the review lead; import the historical log unchanged and regenerate INDEX as a separate documentation operation. `Cargo.lock` is additionally permitted only for dependency reconciliation; do not regenerate the npm lock.

- `RAG/AI-LOG/2026-07-19-LOG-AI-control-flow-sweep.md`
- `RAG/INDEX.md`
- `tauri-app/src-tauri/Cargo.toml`
- `tauri-app/src-tauri/src/artifact_id.rs`
- `tauri-app/src-tauri/src/cache.rs`
- `tauri-app/src-tauri/src/commands.rs`
- `tauri-app/src-tauri/src/compose_grid.rs`
- `tauri-app/src-tauri/src/ffmpeg.rs`
- `color-core/src/kmeans.rs` — remapped from old native location.
- `tauri-app/src-tauri/src/lib.rs`
- `tauri-app/src-tauri/src/main.rs`
- `tauri-app/src-tauri/src/value_analysis.rs`
- `tauri-app/src-tauri/tests/audit_value_cache.rs`
- `tauri-app/src/App.svelte`
- `tauri-app/src/lib/bridges/compose.ts`
- `tauri-app/src/lib/bridges/compute.ts`
- `tauri-app/src/lib/bridges/fs.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.spec.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.ts`
- `tauri-app/src/lib/bridges/video.ts`
- `tauri-app/src/lib/compute/bridge-path.spec.ts`
- `tauri-app/src/lib/compute/bridge.ts`
- `tauri-app/src/lib/exports/__tests__/color-format.spec.ts`
- `tauri-app/src/lib/exports/color-format.ts`
- `tauri-app/src/lib/exports/histogram.ts`
- `tauri-app/src/lib/exports/hue-lightness.ts`
- `tauri-app/src/lib/exports/palette-ase.ts`
- `tauri-app/src/lib/exports/palette-web.ts`
- `tauri-app/src/lib/exports/palette.ts`
- `tauri-app/src/lib/exports/polar-chart.ts`
- `tauri-app/src/lib/services/analysis-scroll-lock.spec.ts`
- `tauri-app/src/lib/services/analysis-scroll-lock.ts`
- `tauri-app/src/lib/services/async-listener.ts`
- `tauri-app/src/lib/services/clipboard-image.spec.ts`
- `tauri-app/src/lib/services/clipboard-image.ts`
- `tauri-app/src/lib/services/drag-drop.spec.ts`
- `tauri-app/src/lib/services/drag-drop.ts`
- `tauri-app/src/lib/services/media-ingestion-thumbnail.spec.ts`
- `tauri-app/src/lib/services/media-ingestion.ts`
- `tauri-app/src/lib/services/media-types.spec.ts`
- `tauri-app/src/lib/services/media-types.ts`
- `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts`
- `tauri-app/src/lib/stores/image.ts`
- `tauri-app/src/lib/stores/multi-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/stores/multi-analysis.ts`
- `tauri-app/src/lib/stores/prefs-ordering.spec.ts`
- `tauri-app/src/lib/stores/prefs.ts`
- `tauri-app/src/lib/stores/value-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/stores/value-analysis.ts`
- `tauri-app/src/lib/views/BatchView.svelte`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/ValuesView.svelte`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts`
- `tauri-app/src/lib/views/__tests__/batch-ingestion.spec.ts`
- `tauri-app/src/lib/views/__tests__/batch-reanalysis.spec.ts`
- `tauri-app/src/lib/views/batch/batch-drop.svelte.ts`
- `tauri-app/src/lib/views/batch/batch-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/values-export-chart-save.spec.ts`
- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`
- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`
- `tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/main.ts`
- `Cargo.lock` — dependency reconciliation only.
- `color-core/src/kmeans_tests.rs` — only if the accepted math base includes IMP-178's extraction; do not create a competing module.

## Integration rulings

- A read-only merge-tree probe reported conflicts in `RAG/INDEX.md`, native `Cargo.toml`, `commands.rs`, and `lib.rs`. This is not an exhaustive semantic conflict list.
- Preserve `color_core::analyze` delegation and core IPC re-exports. Add blocking wrappers around current calls, not the sweep's obsolete inline pipeline.
- Preserve the Tauri-free crate and SIMD feature wiring; native filesystem dependencies belong to the native crate.
- Do not resurrect native `color.rs`, `kmeans.rs`, `image_pipeline.rs`, or `merge.rs`.
- IMP-180 already touches k-means while adopting SWEEP-012. Coordinate its exact core base with the independently owned IMP-178 performance work before adoption, then preserve that coordination for the IMP-187 correction. Neither ticket authorizes modifying the performance worktree.
- SWEEP-021/022/019 publication and retention remain incomplete. Adoption does not close IMP-185/186/193 or authorize broader concurrency acceptance.
- Atomic-copy destination-link replacement differs from writing through an existing inode. Test exact aliases, unrelated symlink/hard-link destinations, overwrite, and failure preservation; obtain a lead ruling if platform behavior diverges.
- Do not replay the documentation commit's generated index over current tracking. Retain the historical log as dated branch evidence; September's reconciliation governs current disposition.
- Round 01 ruling: original log import and INDEX regeneration stay Review-Lead-owned. Their presence in this source inventory is not Code Lead write permission.
- Round 01 ruling: non-overlapping adoption need not await all of IMP-178. Only shared math changes require its coordinated accepted shape. Incorporate IMP-187 into the RT-07/SWEEP-012 semantic adaptation and record both identities; do not introduce a known degenerate-loop regression simply to preserve an intermediate source patch.

## Submission table

The code lead's implementation submission must list source SHA → resulting SHA or unchanged patch identifier → adapted files → regression evidence. Do not fill resulting SHAs before they exist. Report omitted/replaced patches individually and request review; never silently drop a SWEEP identity.
