---
submission: correctness-wave-03
verdict: accepted
acceptance_scope: local-source-candidate-only
branch: codex/correctness-wave-01-2026-09-05
submission_base: 58880e0feb8baee754230be9d28acb8a683147ef
commit: 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2
reviewed: 2026-09-05
---

# Correctness wave 03 — independent lead verdict

Accepted locally as two issue commits. Not main integration, full native video acceptance, owner acceptance, release or cross-platform evidence. Preserve Sol's uncommitted submission unchanged.

## Scope and logic

Read the complete three tracked-file diff and both new specs. Exact five-source-file fence held. Production changes match the reviewed original issue patches, with stronger permanent tests. No configuration, package, native, core, store, fixture, design, active-study routing or unrelated lifecycle edits.

SWEEP-003 clears both cached-restore fields in full reset; cached loading reinstates the intended seek after reset. Three tests include the fresh-B negative scenario, exact cached positive control, and repeated reset.

SWEEP-008 captures path/name/timestamp from one settled entry. Pending begins before the timer, and the existing token guard prevents stale completion/finally from clearing newer work. Values capture handler and disabled state share the derived request. Timestamp zero remains eligible; current request failure fabricates no result. Wave-01 disposal wiring is intact. Ten tests cover the bounded W3-1 cases; request-time semantics remain unchanged under W3-2.

IMP-182 exact cached-content reuse during seeks and IMP-183 cross-view pending-frame reacquisition remain open. Neither is solved by these narrower corrections.

| Issue | Historical source | Lead commit |
| --- | --- | --- |
| SWEEP-003 / partial IMP-180 | a09c834d0d2ac990bbed210ebbf206a3057ca665 | 4893477dbce439a8b24c84dfdf4e1f8e82fa6de4 |
| SWEEP-008 / partial IMP-180 | 0857489c2f658c795c29df7f51aa2ba217cf7b65 | 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 |

Enabled hooks passed on both commits. Generated INDEX is the only extra metadata: controller/Values LOC updates and the new snapshot spec's size-watch entry. No manual index edits or planning corpus imported. Candidate is clean at the resulting seven-commit local stack. Main remains unchanged.

## Independently reproduced

- Full frontend: 21 files / 222 tests passed, exit 0.
- Four-file focus: 4 files / 33 tests passed, exit 0.
- Check: zero errors, two existing tabindex warnings.
- Lint and format: exit 0.
- Rust fmt, locked/offline clippy with warnings denied: exit 0.
- Locked/offline workspace tests: 50 passed.
- Locked/offline scalar snapshot: 1 passed.
- Diff whitespace and exact source boundary checks passed.

Sol's two pre-fix behavioral failures are preserved reported evidence, not claimed independently rerun by the lead. No skipped/it.fails cases introduced. No new core dependency is possible from the observed renderer-only diff; the lead did not repeat cargo tree in this sitting.

## Separately named native package

From candidate/tauri-app:

```sh
CARGO_NET_OFFLINE=true npm run tauri -- build --debug --bundles app --no-sign --ci --config '{"productName":"Color Tool Wave 03"}' -- --locked
```

Exit 0. The CLI-only productName overlay creates a separate bundle without changing tracked configuration or overwriting the preceding Color Tool.app. Version remains 1.0.2. This is a local unsigned debug test package, not a release build.

Bundle: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01/target/debug/bundle/macos/Color Tool Wave 03.app

- New bundled executable SHA-256: 46d9f1d1ee6a65b4343a5839b38a8a872688d33fa2f7edb9e8bfc2b2952be1f9.
- Prior Color Tool.app executable remains b8c726f6bdfc370f7c9111250a9aa130011a0830602399ca467949b8d3178fc1.
- Cargo.lock remains e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454.
- Exact new bundle launched via computer use; process 84962 verified against its full executable path. AX reports the empty Colors view at tauri://localhost. No development server was started.

The package includes both reviewed source patches, built while the second commit's hooks were completing; the commit adds no further production delta.

## Native smoke attempt — incomplete

Generated two local disposable test clips under /tmp/color-tool-wave03-smoke.zzmTkr using installed /opt/homebrew/bin/ffmpeg, no downloaded media:

- study-a.mp4: testsrc2, 640×360, 24 fps, 10 s, H.264/yuv420p.
- study-b.mp4: smptebars, 640×360, 24 fps, 6 s, H.264/yuv420p.

ffprobe independently confirms A is valid H.264, 640×360, duration 10.000000.

The first native picker navigated to and previewed A, but AX reported Open disabled. Return and direct file-selection attempts did not import it. The picker was dismissed with Escape. A screenshot then failed with ScreenCaptureKit -3811 / tool -10005; later collection Add media attempt hit the external-window-change guard. Re-query showed the empty Colors view and open empty library. No clip or snapshot was imported, no original user file was modified/deleted, no settings changed.

This is an unresolved test blocker, not a confirmed application regression. Read-only source confirms the Colors caller requests all media, the registry includes mp4, and installed rfd 0.16.0 flattens every filter's extensions into setAllowedFileTypes. No proven filter omission was found; no speculative repair is authorized from this attempt.

Next native gate: with stable computer-use access, import both clips; check cached A→fresh B and positive restore; Values step/snapshot pending and settled label/copy; source/view switching. Need separate stress/OS clipboard/drop/Batch/reflow/platform tests too. Do not close these from unit tests or successful packaging.
