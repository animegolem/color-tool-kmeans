# Wave07 C1-H1 harness preparation submission

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.73/C1-H1..H5 and the numbered icon amendment rev0.74/C1-H6. This is preparation and compile evidence only. **The harness binary, Tauri App, AppKit event loop and WKWebView were not launched. Platform ordering remains untested.**

## Result and exact fence

Prepared the standalone crate at:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz`

Candidate source stayed clean and byte-unchanged at `6e12a73783c7119dae9b6add947e1b5085abe003`. Candidate verification after all harness work:

- `git status --short`: empty.
- workspace `Cargo.toml`: `22964484ab47857c253186fa250eb7a314c581bebdf8e8081852a27fa6ddd444`.
- workspace `Cargo.lock`: `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- candidate native `Cargo.toml`: `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e`.
- actual 193-A `artifact_ownership.rs`: `a4bbdf1194920abde1ed9f1def8422a130630b384326aa0d324a575a7fbdd7c0`.

No candidate, ticket, record, INDEX, production config, cache, app data or retained evidence was edited. The only outside-harness write is this submission.

## Prepared-file SHA256 manifest

| Classification | Relative path | SHA256 |
| --- | --- | --- |
| authored | `Cargo.toml` | `50dfd50c3b392f4a31845303fee28490e31bd8e4872a75e01ae9791717efb9ee` |
| mechanically reconciled from candidate baseline | `Cargo.lock` | `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72` |
| authored | `build.rs` | `75cc0cc5d9904756f0836fde89236725c2f41fd962e27cff8cfccbd881e4deb8` |
| authored | `tauri.conf.json` | `fea26088343061857e031fa68b4d716b17dea4f3ba65b224223fd1dcb8124b7f` |
| authored | `src/main.rs` | `f6c81c97d4ee4be953438f6853c56572e272257cce36c9ddb99af51ed03bcbd5` |
| authored | `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc` |
| authored | `src/protocol.rs` | `add37512c7fd5d748d802f52306d5849cea1736368f3e68934b419a2e5cf1e80` |
| authored | `src/driver.rs` | `54d825da419901099bae09474ef4623ce0dcdc6358e725780e533fe0f19c3738` |
| authored | `src/trace.rs` | `65a304faaca64f17881a8e21425d9729bf1a42b7f50c8d082c4ba4881139ffcc` |
| authored | `assets/a.html` | `d99bf3129e919b3ff61804a21093d4a2f240f61d790968b74e2650d8a0db880d` |
| authored | `assets/b.html` | `ada968a270bb36bf868a5de2749542189fa8a71d9631bff16cf1c2d67fd62911` |
| authored | `assets/harness.js` | `46ba2a0d47f3bfc3cc581dce9057f8ab4b2a638e1cd2a943ed81c7dc1e3fa236` |
| deterministic C1-H6 generated fixture | `assets/icon.png` | `08c9a2e7e6afe1867b9111784a0c54daf897a5076bcf02af41bfed54fb93e9e1` |
| authored | `README.md` | `8b0cd64054fd008f2769dec63848ce2fc79e8f0836fce8b741889bca90c73c6b` |

C1-H6 fixture provenance: `build.rs` emits one deterministic 32 x 32, 8-bit RGBA, non-interlaced PNG from fixed pixel rules and an in-file PNG/CRC/Adler encoder. The dark field, cyan C1 glyph and magenta border are harness-specific; no downloaded/generated-service/production image is present. `file` and `sips` both validated PNG/32 x 32/RGBA-compatible material. The generator's only output is `assets/icon.png`.

Compilation also generated ordinary Tauri schema material under `gen/schemas/` and Cargo material under `target-harness/`, both inside the reserved root as allowed. No additional authored path was added.

## Native protocol and actual registry seam

- Every manual builder gets a 192-bit OS-random native incarnation captured by both its page-load closure and its static document-start script. The JS random document nonce is diagnostic only.
- `ProtocolState::page_started` is the sole generation-advancing transition. Finished, document-start, ready, bootstrap request, retry, eval report and async completion only observe or validate existing authority. A Started transition retires the prior session before issuing a new native challenge.
- The page accepts a challenge only when the expected incarnation matches and its generation is strictly greater than the page slot. Session delivery separately checks incarnation, exact generation and diagnostic document nonce. Challenges and sessions are delivered by guarded current-document eval, never as authority in the old invoke promise.
- Bootstrap validation occurs and is traced before the registry seam. Only an activated/current session calls the frozen candidate's real `ArtifactRegistry::register_group` and `acquire`, using fixed `TransientOutput`, 17-byte test metadata and no disk artifact. Duplicate admission is idempotent. Rejections compare actual registry accounting before/after and fail the harness if groups/leases change.
- Deterministic tests prove stale incarnation admission yields zero groups/leases, positive current admission yields one group/two leases, duplicate admission does not add another, reverse generation does not decrease native authority, only Started advances, and retired sessions are terminal.

## Seven prepared runtime cases and production-hook map

| Case | Prepared forced/actual boundaries | C1 production-hook question exercised |
| --- | --- | --- |
| 1 initial + same-URL reload | Actual Started/Finished, init doc-start/ready, guarded challenge/bootstrap/session; duplicate live bootstrap; forced old-session retry | Manual-builder incarnation, Started-only generation, idempotent current bootstrap, terminal predecessor session |
| 2 held A bootstrap then B | Actual A invoke receipt is held by name before processing; B activates through ordinary lifecycle; forced A release validates against current state | Command receipt/processing boundary and zero 193-A allocation for a stale caller |
| 3 delayed eval controls | A marker script is captured before native submission; after B activation unguarded release must identify/mutate B; guarded repeat must reject and retain B session/marker | Guard required on any delayed native-to-renderer mutation; negative control cannot pass vacuously |
| 4 reverse challenge | Generation N challenge held explicitly **before submission**; N+1 from actual B Started delivers first; N then reports page rejection and undergoes actual native validation | Page-slot monotonicity plus native old-challenge rejection; separately records the Started-scheduled challenge's observed document |
| 5 submitted eval + rapid navigation | Eight disclosed repetitions submit a timer-bearing eval, record eval callback boundary, immediately navigate A->B, and classify any explicit page receipt | Scheduling observation only: distinguishes submitted-to-WebKit from held-before-submission and never claims exhaustive ordering |
| 6 same-label replacement | Capture old incarnation work; close/drop the old public handle before reuse; manually build same harness label with a fresh captured incarnation; release old work as synthetic | Incarnation check precedes mutation; actual late lifecycle callbacks remain labeled actual; no retained-old-handle map-removal stunt |
| 7 old async response | Actual Tauri async invoke held in native work; replace same label; release and record native return to ordinary Tauri responder; observe bounded Promise callback separately; deliver explicit guarded receipt | Numeric callback routing is evidence only, never authority; old session fails native and page guards while successor survives |

Every required negative/positive control has an explicit non-vacuity condition. Required missing reports, trace/parse failures and per-case timeouts return failure/inconclusive. Case 5 alone treats a canceled timer as an observed scheduling outcome after a disclosed 750 ms bound. The process watchdog requests exit code 124 at five minutes; normal failed/inconclusive cases request exit code 1.

## Isolation proof

- Config has product `Color Tool C1 Harness`, identifier `com.color.tool.c1harness.zvfthz`, `app.windows=[]`, `bundle.active=false`, only embedded `assets`, and no asset-protocol filesystem scope.
- The only runtime construction is a manual `WebviewWindowBuilder`: hidden, nonfocused, `incognito(true)`, static init script, per-builder page-load closure and navigation policy. The policy admits only `about:blank` and the Tauri local origin paths `/`, `/a.html`, `/b.html`; remote, file, localhost-server and other app paths are rejected.
- Installed Tauri 2.11.5 forwards `WebviewWindowBuilder::incognito` at `src/webview/webview_window.rs:1046-1054`; installed Wry 0.55.1 maps the true value to `WKWebsiteDataStore::nonPersistentDataStore` at `src/wkwebview/mod.rs:231-236`.
- macOS setup selects accessory activation. No plugin is initialized; no dialog, shell, store, asset filesystem, clipboard, shortcut, FFmpeg, logger, production setup/cache helper, remote URL, local server, user input or production identifier is used. Candidate plugin crates remain transitive compile dependencies only because the allowed path dependency compiles the candidate library; the harness builder does not register them.
- `main` parses arguments before calling `driver::run`. Default/`--help` only print usage. `--validate-config` parses and asserts the embedded namespace/window/bundle/asset settings. Only exact `--run ABSOLUTE_PATH` continues; validation requires a nonexistent direct `run-*` child of the canonical harness root before creating the output directory and before any Tauri builder/App/WebView construction.
- Unit tests exercise pure state, string construction, config parsing, navigation policy and an in-memory trace sink. No test calls `driver::run`, `tauri::Builder`, `build_window`, AppKit or WebView APIs.

The direct manifest pins `tauri=2.11.5` and `tauri-build=2.6.3`; final `cargo tree --offline` retains `tauri-runtime-wry=2.11.4` and `wry=0.55.1`. The candidate path dependency is `default-features=false` and is used for actual 193-A registry code only.

## Lock reconciliation

Started from the exact candidate lock SHA `05e43199...` and let offline Cargo minimally reconcile the new standalone root. No shared package version/checksum changed. Exact semantic delta:

- added path package `color-tool-c1-harness 0.1.0`;
- removed candidate-workspace-only dev/SIMD nodes not reachable from this path-dependent non-default-feature build: `proptest 1.11.0`, `quick-error 1.2.3`, `rand 0.9.5`, `rand_chacha 0.9.0`, `rand_core 0.9.5`, `rand_xorshift 0.4.0`, `rusty-fork 0.3.1`, `safe_arch 0.7.4`, `unarray 0.1.4`, `wait-timeout 0.2.1`, `wide 0.7.33`;
- dependency strings that were version-qualified only because two versions existed collapsed to their sole retained package names. Actual retained versions did not move.

Final lock SHA is `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72`.

## Preparation commands and outcomes

All Cargo commands used `CARGO_TARGET_DIR=.../color-tool-c1-harness.zvftHz/target-harness` and offline mode where dependency resolution was involved.

- `cargo fmt --all -- --check`: PASS, empty output after formatting.
- `cargo check --offline`: PASS, `Finished dev profile ... in 1.17s` on final run.
- `cargo clippy --offline --all-targets -- -D warnings`: PASS, `Finished dev profile ... in 1.46s`.
- `cargo test --offline`: PASS. Library target `11 passed; 0 failed; 0 ignored`; binary config target `1 passed; 0 failed; 0 ignored`; doc tests `0`. Total 12 pure tests, no empty-list success.
- `cargo build --offline`: PASS, `Finished dev profile ... in 1.42s`.
- `cargo tree --offline`: PASS; exact locked runtime nodes above confirmed.

Built but never executed: `target-harness/debug/color-tool-c1-harness`, Mach-O 64-bit arm64, 25,630,824 bytes, SHA256 `970b51d104d3bd9bcc7392e9e8b1062468af7e23cb1fd0a6b85d49abb42f46d7`.

## Compile friction and deviations

1. Initial baseline-copy command named the candidate lock under `tauri-app/src-tauri/`; the actual workspace lock is at candidate root. That copy failed without changing the candidate. An initial offline `cargo generate-lockfile` then produced a too-broad latest-compatible graph. It was replaced, not retained: the correct candidate root lock was copied mechanically and normal `cargo check --offline` performed the minimal reconciliation documented above.
2. First compile reached Tauri context codegen and failed because `icons/icon.png` was absent even with bundling disabled/windows empty. It also exposed three ordinary compile errors: PageLoadEvent import path, URL-to-string conversion and cloning an `Fn` callback capture; a later pass caught the CLI empty/help match binding. No binary/App/WebView launched. C1-H6 then authorized exactly `assets/icon.png` plus the existing config pointer. Before C1-H6 landed, one compile-only `TAURI_CONFIG` environment override read the candidate PNG solely to get past context expansion and reveal the remaining Rust errors; it did not copy, author or retain that image, and final config/artifact/build use only the distinct deterministic harness icon. This transient read is disclosed because the final amendment forbids production-asset reuse.
3. A final lock-set comparison attempt through `cargo metadata --locked --offline` requested uncached non-host packages `crunchy 0.2.4` and `android_system_properties 0.1.6` and failed closed; Cargo did not access the network. Exact reconciliation was instead established from the two lockfiles and the successfully compiled host dependency tree.
4. First format check after the navigation-policy addition reported formatting-only diffs; `cargo fmt --all` corrected them and the final check is clean.

No functional scope deviation is knowingly retained. Driver length is 2,048 lines because all seven explicit real-runtime orchestration cases, command boundaries and failure classifications live in the one authorized driver path; this standalone non-workspace file is over the repository's ordinary 400-line warning and should be reviewed as a harness-specific cohesion tradeoff. No candidate LOC bypass is implicated.

## Future output schema and prospective command — not executed

Future `ledger.jsonl` is append-only and flushed per row. Each row has required `sequence`, monotonic `monotonicNanos`, `case`, `evidence`, `event`, `source`, and `actuality`; optional `intendedDocument`, `observedDocument`, `incarnation`, `generation`, `session`, `evalPhase`, `hold`, `accountingBefore`, `accountingAfter`; and structured `details`. Evidence is exactly `planned | forced | observed | inferred`. `actuality` distinguishes actual OS/Tauri/native boundaries from named synthetic holds/releases.

Prospective command, deliberately **not executed**:

```sh
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/target-harness/debug/color-tool-c1-harness --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-first-reviewed
```

No runtime ledger, macOS ordering result, Windows/Linux result, production integration result or C1 correctness acceptance is claimed. Lead source/config/namespace review remains the next gate before any first macOS launch. No 193-B work started.
