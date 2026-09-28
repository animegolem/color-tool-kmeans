# IMP-193-4 round03 preparation accepted — owner session next

Review Lead -> Sol / Code Lead and owner, 2026-09-08. PROJECT-RECORD rev0.96. **ACCEPT round03 as isolated source/preparation evidence.** No further implementation assigned. This is not visible behavior, owner acceptance or production adoption; no App has launched.

Reviewed report SHA256 `f60891e4943a5af4bd8cd29fb47a76e187f1193e23524e631d0da45440c6e08e`. Prior round02 AMEND `10069d87b0b758be3eeb99aafde6ea4b5e63061183d849671a1a53d68809f828` remains unchanged. All15 submitted source hashes independently matched, with exactly three changed files against frozen R2: driver +524/-44, audit +10/-1, README +1/-1; total +535/-46. Twelve files byte-identical, including optional session.rs. No extra authored file, symlink, dependency/feature/lock change or reserved run output.

## 193-4-P16 — P13..P15 closed at the preparation boundary

1. P13: reviewed the entire driver delta and runtime call sites. renderer_receipt uses route_renderer_receipt; classification/observe_context share the protocol guard, match the captured native label against the frozen protocol-current snapshot, and distinguish initial/recovery candidates from admitted session-current controls. Candidate receipts no longer depend on their own prior session admission. Actual candidate contradictions send AdmissionFailed to the matching admission waiter rather than recursively requesting recovery. Stale/retired/poisoned labels reject before observation. Unchanged owner-control authorization still rejects candidates. Six added real protocol/session/runtime-helper regressions reproduce successful initial and A->B admission prefixes, retired-A isolation, both candidate contradiction dispositions, pre-admission control rejection and admitted-current one-attempt recovery. These are source/pure integration evidence, not complete platform callback-schedule proof or renderer authentication.
2. P14: runtime sample_status delegates to sample_status_with, which completes the two owned snapshot statements before invoking the sampler. The actual helper's injected regression independently acquires both mutexes at that seam. Main-thread dispatch, self-wait guard, operation bound and geometry checks remain unchanged. Adjacent specific snapshot/dispatch call sites reviewed; no remaining same-expression held-guard pattern found there. No native deadlock or pointer call was executed.
3. P15: the actual validator mutator now clones the final terminal and resequences; its explicit two-terminal precondition precedes rejection. Independently reran the unchanged lead R2 validator-fixture probe against R3 source: terminal count2, appended terminal-session, exit0. Prior failure remains preserved in R2. The production validator's exactly-one-terminal check was not weakened.

Preserve prior P7..P12 improvements and their existing regressions. No new general protocol/harness round or production migration follows this acceptance.

## 193-4-P17 — Independent gates and frozen identity

Fresh lead-only review root:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r3.WATeWJ`

All15 submitted source files were selectively preserved unchanged under `source/` before independent builds. No source fix was made by Review Lead. Actual P8xk8N source was built using a fresh WATeWJ/target-lead with env-unset TAURI_CONFIG and locked/offline resolution, preserving the relative read-only candidate dependency without altering the nested frozen manifest.

| Independent gate | Outcome |
| --- | --- |
| Node syntax, harness and validator | Exit0 |
| Actual validator/projection self-test | Exit0; five ledger positives,16 rejection fixtures, projection pass |
| Cargo fmt / locked offline check | Exit0 / exit0 |
| Cargo tests | **59 library +3 binary =62 passed**,0failed/ignored;0doc tests; exit0 |
| Strict all-target Clippy / locked offline build | Exit0 / exit0 |
| Inspected default / help / config-only paths | Each exit0; no Tauri initialization |
| Lead duplicate-terminal construction probe | Two actual terminals; exit0 |

Gate transcript `lead-preparation-gates.txt` SHA256 `d3f355e63284ad40586d26bdf1dbac1c3c10b2c6cc5a56ffbcf8ced95487fb6a`. All seven newly required runtime-helper regressions reproduced. Node was26.8.1; Node20 remains unrun/uninstalled, not a claimed CI gate.

- Preserved submitted binary `color-tool-c1-visible-r3-submitted`: SHA256 `08e5a757ecfc229fde0a8db1d85aee516190db715c1fb11521173e8251898db8`.
- Preserved independent binary **selected for the later owner launch gate**, `color-tool-c1-visible-r3-lead-build`: SHA256 `0e6237f7d32c6d0c9419c93babd899345574c241d7214205798b1b2f034b953b`.
- Both binaries are Mach-O64-bit arm64. Different submitted/independent binary hashes are recorded, not represented as a reproducible-binary match. The selected executable must be rehashed immediately before any later launch.
- Lead fixture probe source `lead-r3-validator-probe.cjs` retains exact R2 probe hash `2ffa5e645147dc2aabb4ae68479297f4095b6fe31416f6a68812aa33d861d5f6`; new passing transcript `lead-r3-validator-probe.txt` hash `e8e932a0ce63f085d097e611af401084f47a5394dcb52a5ae24a0e00edb2cceb`.

Source remains at the reserved P8xk8N root, and future owner output remains the currently nonexistent direct child `run-20260908-visible-owner-01`. Preserve both source and all R1/R2/R3 freezes/reports/probes/binaries. Nothing is installed, committed, merged, deleted or enabled in candidate/main.

## 193-4-P18 — Owner readiness and separate launch boundary

Preparation is complete; no further Sol action, polling or source/build changes assigned. Check only the ticket's isolated-artifact preparation/review item. Three runtime/owner acceptance items remain open, and193-4 remains in-progress.193-5 remains backlog; aggregate193/C1-C3 and production integration stay unaccepted.

The accepted plan specifies an owner-initiated manual launch, not an automatic background run. Ask the owner when ready for the hands-on session. Before that session, Review Lead issues the separate one-run launch record identifying the selected exact executable/hash, freshly rechecked host/macOS/namespace and absent output path,30-minute owner-session/20-second machine bounds, six cases, ordinary quit/failure behavior and post-exit evidence collection. Do not execute --run or create run output from this preparation verdict, and do not ask the owner to run an unverified mutable target binary.

The remaining owner pass covers input/selection/shortcuts; local A/B without replacement; explicit fresh-child replacement; denied reload then forced simulated loss; live geometry; and relevant macOS window modes/close. Owner records met/failed/untested with notes and supplies an explicit acceptable/unacceptable verdict. Ordinary early quit may be incomplete. An unacceptable result is valid and does not trigger automatic redesign or migration.

Residuals remain explicit: Wry insertion may activate the app; no focus-restoration promise; rAF is not composited-paint proof; public process-loss callback coverage is incomplete and simulated loss is not actual crash evidence; native close/absence is not destruction proof; ledger buffer flush is not fsync; Node20 and other platforms remain unrun. Driver2885LOC is review/maintenance friction under the fixed fence, not a production-ready commit. Independent pure gates close the identified preparation defects, not those runtime/owner obligations.

No App/Window/WebView/--run, owner interaction, actual/simulated runtime process loss or run-output creation occurred in this review. No new contract decision is needed; the next owner question is availability for the visible test.
