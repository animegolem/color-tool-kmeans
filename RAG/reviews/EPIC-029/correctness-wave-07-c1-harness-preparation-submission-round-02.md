# Wave07 C1 harness preparation submission Round02

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.75 and binding amendments C1-H7..H12. This is a correction, compilation, and pure-test submission only. **The harness executable, Tauri App, AppKit event loop, and WKWebView were not launched. No 193-B work or platform-ordering claim is included.**

## Result and exact fence

Corrected the standalone harness at:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz`

Five of the six permitted existing files changed: `src/driver.rs`, `src/protocol.rs`, `src/trace.rs`, `assets/harness.js`, and `README.md`. The sixth permitted file, `src/main.rs`, did not need a change. No file was added or split inside the harness. `Cargo.toml`, `Cargo.lock`, `build.rs`, `tauri.conf.json`, `src/lib.rs`, the two HTML pages, and the icon are byte-identical to the frozen Round01 source. Generated Cargo/Tauri material remains under the already-reserved `target-harness/` and `gen/` directories.

The Round01 submission remains SHA256 `9588c34136fb84bd614852c4308bc94c857790caf34862a30928352e52f0fe00`. The preserved review snapshot at `color-tool-c1-harness-review-r1.A54v6z` was not modified. Its original driver remains `54d825da419901099bae09474ef4623ce0dcdc6358e725780e533fe0f19c3738`, and its preserved executable remains `970b51d104d3bd9bcc7392e9e8b1062468af7e23cb1fd0a6b85d49abb42f46d7`.

Candidate source remains clean and unchanged at commit `6e12a73783c7119dae9b6add947e1b5085abe003`. Final candidate checks:

- `git status --short`: empty.
- workspace `Cargo.toml`: `22964484ab47857c253186fa250eb7a314c581bebdf8e8081852a27fa6ddd444`.
- workspace `Cargo.lock`: `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- candidate native `Cargo.toml`: `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e`.
- accepted 193-A `artifact_ownership.rs`: `a4bbdf1194920abde1ed9f1def8422a130630b384326aa0d324a575a7fbdd7c0`.

No candidate, ticket, PROJECT-RECORD, INDEX, AI log, production config, production asset, cache, app data, frozen evidence, or prior report was edited. This Round02 submission is the only write outside the harness.

## Exact old/new SHA256 manifest

| Classification | Relative path | Round01 SHA256 | Round02 SHA256 |
| --- | --- | --- | --- |
| unchanged | `Cargo.toml` | `50dfd50c3b392f4a31845303fee28490e31bd8e4872a75e01ae9791717efb9ee` | same |
| unchanged | `Cargo.lock` | `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72` | same |
| unchanged | `build.rs` | `75cc0cc5d9904756f0836fde89236725c2f41fd962e27cff8cfccbd881e4deb8` | same |
| unchanged | `tauri.conf.json` | `fea26088343061857e031fa68b4d716b17dea4f3ba65b224223fd1dcb8124b7f` | same |
| unchanged | `src/main.rs` | `f6c81c97d4ee4be953438f6853c56572e272257cce36c9ddb99af51ed03bcbd5` | same |
| unchanged; corrected full hash | `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` | same |
| corrected C1-H7/H9 | `src/protocol.rs` | `add37512c7fd5d748d802f52306d5849cea1736368f3e68934b419a2e5cf1e80` | `ea1bef009df6a3e9cc13d0777defcff7ba70c331a015896e24149a92d1314ce0` |
| corrected C1-H7..H11 | `src/driver.rs` | `54d825da419901099bae09474ef4623ce0dcdc6358e725780e533fe0f19c3738` | `6ae7247d607eff20d6935c9835156b043a46734bca3cbee3204e81c1534cc69d` |
| corrected C1-H11 | `src/trace.rs` | `65a304faaca64f17881a8e21425d9729bf1a42b7f50c8d082c4ba4881139ffcc` | `4c5c6b1d392ecc9147301b3e5f968b0b2f206ef8b142baaf5c854c98bffcdc66` |
| unchanged | `assets/a.html` | `d99bf3129e919b3ff61804a21093d4a2f240f61d790968b74e2650d8a0db880d` | same |
| unchanged | `assets/b.html` | `ada968a270bb36bf868a5de2749542189fa8a71d9631bff16cf1c2d67fd62911` | same |
| corrected C1-H7 | `assets/harness.js` | `46ba2a0d47f3bfc3cc581dce9057f8ab4b2a638e1cd2a943ed81c7dc1e3fa236` | `4a06a1bbf8efd24981ea798c14bfcaf7d7f227ea2d8fb79232ba7339df26b111` |
| unchanged | `assets/icon.png` | `08c9a2e7e6afe1867b9111784a0c54daf897a5076bcf02af41bfed54fb93e9e1` | same |
| corrected C1-H10/H11/H12 | `README.md` | `8b0cd64054fd008f2769dec63848ce2fc79e8f0836fce8b741889bca90c73c6b` | `b96d006a117b686505901dd9f2f784a21b3e712763e4212efb40376974ec37fe` |

The newly compiled but unexecuted Round02 binary is `target-harness/debug/color-tool-c1-harness`: Mach-O 64-bit arm64, 25,875,416 bytes, SHA256 `191ebde7464f27dc9bcb0561ca233e199894da1acb3b292cdf5b30c9831d9fbc`.

## Preserved compiling before-fix regressions

Eight targeted regressions compiled against the Round01 implementation and failed by assertion with exit 101 before their fixes. The commands selected the full test name and ran one test; the initial attempt that used `--exact` with an unqualified name ran zero tests and is explicitly not evidence.

1. `protocol::tests::exact_original_retry_recovers_same_session_without_registry_growth`: `left: Rejected { reason: ChallengeConsumed }`; `right: Duplicate { session: ActiveSession { ... token: SessionToken("session-first") } }`.
2. `driver::tests::bootstrap_ipc_reply_never_serializes_authority`: the failing value was the actual reply projection, `{"boundary":"processed","decision":{"status":"activated","session":{"incarnation":"inc","generation":1,"challenge":"challenge-secret","documentNonce":"doc","token":"grant-secret"}}}`.
3. `driver::tests::rejected_current_challenge_diagnostic_cannot_activate_pending_bootstrap`: the left protocol snapshot unexpectedly contained a newly allocated current session; the right snapshot retained `session: None` for the pending bootstrap.
4. `protocol::tests::matching_destruction_retires_current_session`: `left: Ok(false)`; `right: Ok(true)`.
5. `driver::tests::loose_activation_match_rejects_same_generation_foreign_incarnation`: `assertion failed: !activation_matches_minimum(&foreign, 1)`.
6. `trace::tests::terminal_write_failure_prevents_successful_finalization`: `assertion failed: ledger.finalize_success(...).is_err()`.
7. `trace::tests::ledger_creation_is_exclusive`: `assertion failed: TraceLedger::create(&directory.0).is_err()`.
8. `driver::tests::exit_policy_prevents_only_code_less_controlled_replacement_exit`: `left: AllowUnexpected`; `right: PreventExpectedReplacement`.

These tests remain in the actual implementation files. They now pass, together with expanded retired-request, exact-event, operation/receipt, finalization-count, and lifecycle nonmutation coverage.

## C1-H7 — reply authority and exact original retry

- `BootstrapAck` now contains only a boundary, non-authorizing status, and optional reject reason. Held, Activated, Duplicate, and Rejected reply projections are all serialized through the real helper in the permanent test; neither the active session nor challenge/token secret is present.
- The only grant-bearing path remains the guarded session-delivery eval. `assets/harness.js` retries a byte-equivalent copy of `lastBootstrapRequest`; it no longer requires a live session or inserts `knownSession`.
- `ProtocolState::validate_bootstrap` recognizes only the exact current native challenge/request descriptor as a duplicate when `known_session` is absent. It returns the existing session; `ArtifactRegistry` admission is `AlreadyAdmitted`, with unchanged groups/bytes/leases. A different nonce/descriptor, stale generation, stale incarnation, unknown session, and retired session still reject without replacing authority.
- Case 1 now exercises real original-request recovery through the ordinary command, waits for the non-authorizing Duplicate reply boundary and a second exact guarded delivery of the same session, then proves the same original request is terminal after reload.

## C1-H8 — observational diagnostics

- `process_eval_report` first validates the report against an actually issued immutable eval job, then writes observation evidence and emits its driver event. It contains no bootstrap synthesis and no call to a mutating protocol/registry transition.
- The handler snapshots both protocol and actual registry accounting around every accepted diagnostic and fails if either changes. Unknown, duplicate, malformed, misattributed, empty, or non-harness receipts are rejected and taint the run; they cannot silently complete a case.
- The permanent current-challenge/pending-bootstrap counterexample now registers the actual issued job, processes the rejected renderer report, and proves protocol plus actual registry accounting equality.
- Case 4 separately constructs the exact captured generation-N request from its held native challenge and held document readiness, labels its release `synthetic-explicit-old-bootstrap-control`, and sends it through `process_bootstrap`. Telemetry remains observation-only.

## C1-H9 — real destruction and bounded exit policy

- Every manual window installs a per-incarnation `on_window_event` handler. `CloseRequested` is recorded but does not retire. `Destroyed` calls the production protocol helper, which retires and clears only a matching current incarnation/session/challenge/generation. A late foreign destruction returns `StaleIncarnation` and leaves the successor snapshot unchanged.
- Replacement arms a native `ReplacementGate` for the exact old incarnation, calls real window close, and requires exact observed CloseRequested, matching Destroyed, code-less `ExitRequested` prevention, and label absence before building the same-label successor. The gate is cleared only after matching destruction and successor construction.
- The explicit app run callback prevents only a code-less last-window exit while that replacement gate exists. Explicit 0/1/124 exits are never prevented. An unexpected code-less exit is logged and terminates nonzero; an explicit zero before seven-case durable finalization likewise cannot succeed.
- Case 6 now contains actual old-window close/destruction plus distinctly labeled synthetic late old Destroyed, Started, and Finished callbacks after successor activation. It proves those callbacks and the separately released stale bootstrap cannot retire, advance, or replace the successor.

## C1-H10 — exact joins and honest eval boundaries

- `DocumentExpectation` binds origin case, exact `visit` query value, native incarnation, exact generation, and excluded predecessor nonce. `wait_active_document` requires the matching diagnostic readiness nonce, an Activated bootstrap request/session with that exact incarnation/generation/nonce, then a validated session-delivery report with the same operation attribution, visit, nonce, incarnation, generation, and session.
- The real matcher tests reject a same-generation foreign incarnation, wrong visit, reused/wrong nonce, and a prior-case execution event. The exact readiness -> activation -> delivery sequence passes.
- Operation IDs include origin case, kind, incarnation, generation, and an issuance attempt where retries can otherwise collide; no challenge or session secret is used as identity material. `submit_eval` rejects duplicate identities and stores each immutable job before dispatch.
- Native `eval_with_callback` success is recorded only as `eval-native-dispatch-accepted` / `tauri-runtime-dispatch-only`, with `webkitExecutionProven: false`. Parsed callback receipts and renderer reports are separate observed execution evidence and must match the issued operation, origin case, kind, allowed local document, and nonempty document nonce. Callback records retain the operation's origin case and separately note the arrival case.
- Case 3 matches both negative and guarded outcomes to the exact B visit and nonce. Case 5 records eight dispatch-then-navigation observations, requires a correlated callback receipt, and classifies a missing timer report only as `unknown-canceled-or-undelivered-observation-not-correctness-pass`.

## C1-H11 — exact durable success gate

- `TraceLedger::create` uses `OpenOptions::create_new(true)`, so a pre-existing ledger cannot be truncated or reused.
- Any serialization, write, or flush failure taints the ledger. Further appends and success finalization reject. `finalize_success` requires exactly seven completed cases, an untainted/unfinalized ledger, successful terminal append, and final flush.
- Each case increments the completion count only after its ordered `case-completed` record writes successfully. Driver panics are caught as failure. The terminal `harness-completed` record is written only in response to the explicit successful exit request after all seven cases; a terminal-write failure exits nonzero. Post-terminal shutdown callbacks cannot append after the immutable terminal row.
- Permanent tests cover terminal-record write failure, exclusive creation, missing versus exactly-seven completion, and one-time successful finalization.

## Updated seven-case source map

| Case | Exact prepared boundary | Required evidence/non-vacuity |
| --- | --- | --- |
| 1 | Initial exact visit/incarnation/document; exact-original command retry; same-URL reload | Same session recovered only by guarded delivery with no registry growth; original becomes stale/terminal after reload |
| 2 | Exact A readiness plus bootstrap held at actual native receipt; exact B activation; synthetic held-A release | B's exact nonce/session remains authorized; rejected A changes no registry accounting |
| 3 | Captured pre-dispatch marker controls released only after exact B activation | Unguarded control mutates the exact B nonce/visit; guarded control rejects and preserves exact B session/marker |
| 4 | Challenge N held before native dispatch; exact N+1 successor first; diagnostic rejection plus separate synthetic native request | Diagnostic changes no authority; explicit old request rejects; exact successor session survives |
| 5 | Eight native-dispatch-accepted evals followed by rapid A->B navigation | Each eval callback is correlated; page timer report is classified when present, otherwise remains unknown/canceled/undelivered |
| 6 | Actual close request, matching destruction, expected last-window exit prevention, same-label rebuild | Exact successor activation; late old Destroyed/Started/Finished and stale bootstrap are synthetic controls and leave successor unchanged |
| 7 | Actual async invoke held across a second actual replacement; old native return; bounded ordinary Promise observation; explicit page receipt | Native authorization rejects old session; explicit receipt rejects against exact successor; successor remains authorized |

## Final preparation gates

`TAURI_CONFIG` was unset. All Cargo compilation used the harness-local `target-harness` directory and offline resolution.

- `cargo fmt --all -- --check`: PASS, empty output.
- `cargo check --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 0.99s`.
- `cargo clippy --offline --all-targets --target-dir target-harness -- -D warnings`: PASS, `Finished dev profile ... in 1.09s`.
- `cargo test --offline --target-dir target-harness`: PASS. Library `24 passed; 0 failed; 0 ignored`; binary config `1 passed; 0 failed; 0 ignored`; doc tests `0`. Total: 25 pure tests; no ignored or empty-list success.
- `cargo build --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 1.40s`.
- `CARGO_TARGET_DIR=target-harness cargo tree --offline`: PASS; exact retained nodes are `tauri 2.11.5`, `tauri-runtime 2.11.3`, `tauri-runtime-wry 2.11.4`, and `wry 0.55.1`.
- Frozen-snapshot comparison: only the five declared in-fence source files differ; all nine out-of-fence source/config/fixture hashes match.
- Candidate `git status --short`: empty; HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`.

Pure tests instantiate no `tauri::Builder`, App, event loop, window, or webview. The build produced the binary but did not execute it.

## Friction, prior deviation acknowledgement, and remaining limits

1. Regression selection initially used an unqualified test name with `--exact`; Cargo correctly ran zero tests. That invocation is excluded from evidence. Each named regression was immediately rerun without the mismatched exact filter and produced a compiling assertion failure.
2. One final `cargo tree` invocation incorrectly passed Cargo's unsupported `--target-dir` flag and failed during argument parsing. It did not compile, launch, or mutate sources. The tree was rerun successfully with `CARGO_TARGET_DIR=target-harness`.
3. The first Round01 compile's temporary `TAURI_CONFIG` override read a production icon before C1-H6 supplied the distinct deterministic harness icon. This remains a disclosed historical compile-only fence deviation: it launched no app, copied no production asset, and retained no production material. Round02 used no override; the environment was explicitly checked unset. The distinct final icon does not erase the earlier read.
4. The driver is now 3,193 lines because the binding correction kept all runtime orchestration and permanent tests in the one authorized existing file. No split, LOC bypass, candidate file, or out-of-fence harness file was introduced.
5. Source review and pure tests cannot establish actual macOS lifecycle ordering, whether the platform emits every expected replacement event in the prepared order, WebKit execution timing, callback frequency, or cross-platform behavior. These remain for the separately authorized first launch after Review Lead acceptance.

Prospective command, corrected to the actual target path and deliberately **not executed**:

```sh
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/target-harness/debug/color-tool-c1-harness --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-first-reviewed
```

No runtime ledger, macOS ordering result, Windows/Linux result, production integration result, whole-protocol acceptance, owner policy decision, or C1 correctness acceptance is claimed. Review Lead source/config/harness acceptance remains the next gate before any launch. Stop after delivery; no polling.
