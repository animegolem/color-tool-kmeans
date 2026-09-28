# EPIC-029 correctness wave 02 — Code Lead submission

Submitted by Sol to the Review Lead on 2026-09-05. This is an uncommitted implementation submission for independent review. It does not claim ticket completion, merge, PR, release, or human acceptance.

## Candidate state

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Required base and current HEAD: `6a17da61d079635d2dcec93c896d8e05c17027d8`
- Prior accepted Wave 01 commits and regressions are preserved unchanged.
- State: five modified tracked source files and four new untracked source files, all unstaged and uncommitted. No Git mutation was performed.
- Final touched-file comparison: exactly the nine paths authorized by the Wave 02 brief. No package, lock, configuration, fixture, UI layout, unrelated native policy, color-core, CLAUDE, ticket, PROJECT-RECORD, INDEX, or prior report delta exists in the candidate.
- `git diff --check`: exit 0.

## 1. SWEEP-009 — consistent supported media types

Source provenance: adapted reviewed source commit `9024da4083984c7f756e47421645474cd11c8e5c`, including lead corrections W2-1 and W2-3. Result is an uncommitted patch; no resulting commit SHA is claimed.

Independent staging group for the lead:

1. `tauri-app/src/lib/services/media-types.ts` (new)
2. `tauri-app/src/lib/services/media-types.spec.ts` (new)
3. `tauri-app/src/lib/bridges/fs.ts`
4. `tauri-app/src/lib/services/drag-drop.ts`
5. `tauri-app/src/lib/services/drag-drop.spec.ts`

Implementation:

- Defines one renderer registry for the existing image extensions `png`, `jpg`, `jpeg`, `webp`, `bmp`, `gif`, `tif`, `tiff` and video extensions `mp4`, `mov`, `webm`.
- Derives picker extension lists, extension-to-MIME lookup, canonical MIME-to-extension lookup, source export naming, and video-extension detection from that registry.
- Preserves the public `inferMimeType` export from `bridges/fs.ts` while moving its implementation to the pure service.
- Adds `.tif` to the native picker without removing `.tiff`; preserves all prior MIME values, aliases, uppercase handling, video detection, and unknown-name fallback.
- Drag/drop imports MIME inference directly from the shared service while preserving Wave 01's failure-atomic registration and teardown code byte-for-byte apart from the import.

W2-1 proof:

- Lookup uses private `Map` instances derived from the registry, so inherited object keys cannot be returned as MIME/extension values.
- Permanent parameterized regressions cover `sample.constructor`, `sample.__proto__`, and `sample.toString`: each infers `application/octet-stream`, canonical image naming falls back to `png`, and lookup does not throw.
- Arbitrary unsupported MIME keys including `image/heic`, `video/constructor`, and `__proto__` return `null`.

W2-3 actual-caller proof:

- Picker tests invoke `getFsBridge().openMediaFiles()` for `images`, `videos`, and `all`, asserting that each real dialog call receives the shared extension sets, including `.tif` and `.tiff`.
- A picker payload test proves uppercase `.TIF`, `.TIFF`, and `.WEBM` paths receive the expected shared-registry MIME values.
- A drag/drop test invokes the registered native event callback and proves `.TIF`, `.TIFF`, `.WEBM`, and `.constructor` payloads receive the correct MIME/fallback values.
- The new drag/drop test invokes cleanup and verifies its listener releases once; the four Wave 01 lifecycle tests continue to pass.
- Source export naming tests cover TIFF/TIF and JPEG aliases plus unknown-to-PNG fallback.

Test delta for this issue: nine frontend cases (eight in the new media-types spec and one added to drag-drop.spec.ts). Initial issue-focused run: exit 0; 2 files passed, 12 tests passed (the nine new cases plus three pre-existing Wave 01 drag/drop cases).

Proposed lead commit subject:

`fix(media): unify supported type registry [SWEEP-009] [AI-IMP-180]`

## 2. SWEEP-011 — honest pasted-image extensions

Source provenance: adapted reviewed source commit `e7901c57aca6f5ec83f182dac5a05ffa0e5376d9` after SWEEP-009, including lead correction W2-2. Result is an uncommitted patch; no resulting commit SHA is claimed.

Independent staging group for the lead, dependent on the preceding registry commit:

1. `tauri-app/src/lib/services/clipboard-image.ts` (new)
2. `tauri-app/src/lib/services/clipboard-image.spec.ts` (new)
3. `tauri-app/src/App.svelte`
4. `tauri-app/src-tauri/src/cache.rs`

Implementation:

- The clipboard MIME helper reuses the shared media registry; there is no second renderer format table.
- Supported clipboard MIME types map to honest canonical suffixes: PNG, JPEG, WebP, BMP, GIF, and TIFF.
- MIME input is trimmed and lowercased. Unsupported or missing MIME returns `null`.
- `App.svelte` derives the suffix before its first async import/read/save, explicitly rejects unsupported/missing MIME, and uses one captured timestamp for the cache path and display name.
- Blob bytes remain unchanged: the existing `arrayBuffer` to `Uint8Array` to `save_file` path is retained; only validation and filename/path suffix selection changed.
- Paste listener lifecycle, selection/navigation, analysis setup, markup, and styles are unchanged.

W2-2 proof:

- Native cleanup retains the exact managed clipboard parent check and `paste-` prefix check.
- Eligibility is restricted to a case-insensitive allowlist of supported renderer-produced suffixes plus legacy aliases: `png`, `jpg`, `jpeg`, `webp`, `bmp`, `gif`, `tif`, and `tiff`.
- The positive native test creates and removes all eight suffix variants, plus uppercase `.JPEG`.
- The negative native test preserves an unrelated supported-suffix filename, unsupported `.svg`/`.heic`, missing suffix, misleading `.png.tmp`, and an external `paste-*.tiff` path.
- Existing video-frame, snapshot, managed-root, retention-age, byte-cap, and startup behavior are unchanged.

Test delta for this issue: 15 frontend cases in the new clipboard-image spec (six canonical formats, three uppercase/whitespace normalization cases, six unsupported/missing cases) and two native cleanup tests. Issue-focused renderer run, combined with its registry prerequisites and preserved drag/drop suite: exit 0; 3 files passed, 27 tests passed. Focused native cache run: exit 0; 2 selected tests passed.

Proposed lead commit subject:

`fix(clipboard): preserve pasted image formats [SWEEP-011] [AI-IMP-180]`

## Combined validation at uncommitted tip

Frontend, from `tauri-app`:

- Required combined focus command: exit 0; 5 files passed, 47 tests passed (`media-types` 8, `clipboard-image` 15, `drag-drop` 4, `audit-resource-integrity` 5, `audit-control-flow-races` 15).
- `npm run test -- --run`: exit 0; 19 files passed, 209 tests passed.
- `npm run check`: exit 0; 0 errors and the same 2 accepted existing noninteractive-`tabindex` warnings (`VideoPanel.svelte:33`, `ValuesView.svelte:265`).
- `npm run lint`: exit 0.
- `npm run format:check`: exit 0; all matched files use Prettier formatting.
- Local Prettier was run only on fenced renderer source files.

Native, from `tauri-app/src-tauri`:

- Focused `cargo test --workspace cache::tests::sweep_011`: exit 0; 2 selected tests passed, with unrelated tests filtered.
- `cargo fmt --all -- --check`: exit 0.
- `cargo clippy --workspace -- -D warnings`: exit 0.
- `cargo test --workspace`: exit 0; 50 tests passed, 0 failed, 0 ignored (26 color-core and 24 tauri-app/probe/audit/cache tests; doc-test suites contain 0 tests).
- `cargo test -p color-core --no-default-features --test kmeans_snapshots`: exit 0; 1 test passed.
- `cargo tree -p color-core --edges normal`: exit 0; no Tauri dependency appears in the normal color-core tree.

Final scope checks:

- `git diff --check`: exit 0.
- Branch and HEAD reverified after validation: `codex/correctness-wave-01-2026-09-05` at `6a17da61d079635d2dcec93c896d8e05c17027d8`.
- `git status --short`: exactly five modified and four new files, matching the nine-file Wave 02 fence.

## Toolchain and platform

- macOS/Darwin 25.6.0 arm64.
- Node v26.8.1.
- npm 11.19.0.
- rustc 1.90.0 (`1159e78c4 2025-09-14`).
- cargo 1.90.0 (`840b83a10 2025-07-30`).

Node 20 and Windows/Linux CI/packaging evidence were not executed.

## Residuals, friction, and environmental output

- No source/test gate failed after implementation; no `it.fails`, skips, fixture regeneration, dependency change, or harness/configuration change was used.
- The existing timestamp-only clipboard path can still collide when two pastes occur in the same millisecond. W2-2 expressly leaves timestamp-collision/source-ownership work outside this format-only adoption; no broader artifact-ID or publication design was introduced.
- The App paste path was source-reviewed rather than launched. Full native app launch, real OS clipboard format behavior, picker behavior, drag/drop, navigation, and hands-on cleanup acceptance remain outstanding human gates.
- `cargo fmt --all` was used after the one fenced Rust edit; final scope comparison confirms it changed no other tracked source. The required check form passed afterward.
- Normal existing `target/` build output was updated. Private node_modules, Cargo caches, correctly positioned sidecars, and redundant `bin/bin` copies were left in place. No installation, provisioning cleanup, or dependency update ran.
- No ticket/checklist/status, PROJECT-RECORD, INDEX, prior report, or CLAUDE file was edited. The stale helper-location note in CLAUDE remains lead-owned documentation follow-up.
- AI-IMP-180 remains partial; no aggregate checklist item is claimed complete.

## Final source file list

1. `tauri-app/src/lib/bridges/fs.ts`
2. `tauri-app/src/lib/services/media-types.ts`
3. `tauri-app/src/lib/services/media-types.spec.ts`
4. `tauri-app/src/lib/services/drag-drop.ts`
5. `tauri-app/src/lib/services/drag-drop.spec.ts`
6. `tauri-app/src/lib/services/clipboard-image.ts`
7. `tauri-app/src/lib/services/clipboard-image.spec.ts`
8. `tauri-app/src/App.svelte`
9. `tauri-app/src-tauri/src/cache.rs`

Ready for independent Review Lead reproduction and the lead-owned two-commit split. No further wave work was started.
