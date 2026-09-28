# Fresh candidate build and bounded native smoke — 2026-09-05

## Verdict and identity

PASS for local macOS packaging and the executed smoke below. Not full regression, owner acceptance, main integration, release, or cross-platform acceptance.

Candidate: codex/correctness-wave-01-2026-09-05, application source at cf4c3440ae525bbd204e17c1af5b5db60c5bc9ed plus the four-file IMP-201 build repair. The final build commit is recorded in PROJECT-RECORD.

Bundle: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01/target/debug/bundle/macos/Color Tool.app

- Info.plist: com.color.tool, version 1.0.2.
- Bundled Contents/MacOS/tauri-app SHA-256: b8c726f6bdfc370f7c9111250a9aa130011a0830602399ca467949b8d3178fc1.
- Root Cargo.lock SHA-256 before and after package: e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454.
- Fresh process PID 61660 was verified against the exact bundle executable; installed 1.0.1 PID 69231 is a separate process. Do not mix their observations.
- No listener on Vite port 5175. Native accessibility reports tauri://localhost. Real analysis and export work without a development server.
- Local unsigned debug candidate, not installed into /Applications or notarized. Existing private candidate sidecars reused, not downloaded or re-pinned by this repair.

## Build repair and gates

Only .gitignore, Cargo.lock, tauri-app/package.json and tauri-app/package-lock.json change under IMP-201. Track the existing native lock unchanged; align JS API to exact 2.11.1 and dialog to exact 2.7.3. Store and CLI unchanged. npm 10 generated the lock and installed in the private candidate only. The initial npm ci dry-run was not an actual installation. No app Cargo.toml delta remains.

B1 withdrew provisional custom-protocol and native minor-cap edits before packaging: the installed official CLI changelog says the feature is no longer required and is ignored in Tauri 2. No version-check bypass was used. Sol's separate current-build-dependency-diagnosis.md preserves the read-only investigation, including deferred release workflow/toolchain/sidecar concerns.

From tauri-app:

```sh
CARGO_NET_OFFLINE=true npm run tauri -- build --debug --bundles app --no-sign --ci -- --locked
```

Exit 0; frontend build and macOS app bundling completed.

Post-alignment validation:

| Gate | Outcome |
| --- | --- |
| npm run test -- --run | 19 files, 209 tests passed |
| npm run check | 0 errors, 2 existing tabindex warnings |
| npm run lint | Exit 0 |
| npm run format:check | Exit 0 |
| cargo fmt --all -- --check | Exit 0 |
| cargo clippy --workspace --locked --offline -- -D warnings | Exit 0 |
| cargo test --workspace --locked --offline | 50 tests passed |
| cargo test -p color-core --no-default-features --test kmeans_snapshots --locked --offline | 1 passed |

## Executed native interaction

Computer use targeted the exact bundle path, not a generic app name or bundle ID. No source instrumentation or mocked IPC.

1. Open fresh empty Colors. Native file picker imported the owner's e94c2a0b reference PNG. Real image, histogram, polar and hue-lightness results appeared; first observation 1044 ms / 18 iterations / 72,900 samples. Debug timing is not a performance acceptance benchmark.
2. External/user interaction changed K from the first observed 82 to 147 before the next action; CUA correctly required a refreshed state. Preserve that state, do not misattribute it to the agent. Subsequent result: 1902 ms / 20 iterations / 72,900 samples.
3. Colors → Values retained the wheel image. Observed pending text then original/neutral rendering, 51–98% mass range, 31–98% extremes, two-tone 23% / 77%.
4. Opened library within Values and imported owner's f550e16e reference through native picker. Stayed in Values; original/neutral switched to Palette Studio; two-tone level stayed 2, shares updated to 17% / 83%.
5. Selected the first existing library tile. Stayed in Values and restored wheel-dependent measurements, 23% / 77%. This supports the shared-material UI-D1 model. Drawer remains open: auto-collapse is a proposed redesign, not present behavior.
6. Batch with these two unpinned items showed the explicit pin-two-or-more empty state. Presence/active selection alone did not populate Batch. No claim about pinned computation.
7. Exports exposed Colors and Values sections, per-item saves, CSV/ASE/JSON, composite actions, disabled image-inapplicable video barcode, and 2x PNG scale. Export Colors Composite opened the real save dialog.
8. Saved /tmp/color-tool-native-smoke.oXo6RC/wheel-colors.png. Verified a real 2600×1539 PNG (~990 KiB), then visually inspected it: selected wheel, polar plot, histogram, hue-lightness and labeled top-20 palette are present; no app navigation is embedded.
9. Returned to Colors; existing wheel result and K147 remained. Left the fresh app open for owner inspection.

Original reference files were not modified or deleted. The candidate's media bucket now contains these two references. No clipboard write, pin/remove action, or Settings edit was performed by the agent.

## Remaining acceptance and design observations

This is a first smoke, not evidence that every adopted race/format fix was exercised natively. Actual OS drag/drop and clipboard MIME variants, delayed listener teardown/relaunch, pin/unpin Batch computation, rapid source-switch/cancellation races, error recovery, video, resizing, keyboard accessibility, Values/SVG/data exports, retention/removal, and long sessions remain unrun. Node 20, Windows/Linux, release signing, and owner acceptance remain open.

No new confirmed functional failure occurred in this bounded pass. Two design observations: the rail stays open after choosing material; Pin/Remove are folded into the media tile's accessibility description rather than separately exposed controls in the inspected tree. The latter merits a focused keyboard/accessibility check, not an asserted inaccessible-control defect without that check.

Current source behavior supports preserving shared study material. Do not infer approval of UI-D2..D6 or start redesign implementation from this smoke.
