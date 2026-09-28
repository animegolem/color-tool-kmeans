# C1-RUN-02 — finite macOS harness pass accepted

Review Lead, 2026-09-07. Executed once under shutdown-correction-verdict SHA256 **6f1403b35a5e11f29fa3870a6b0a414ce17d774b836923dce95057b645c2aa99**. **Accepted: this complete selected-schedule macOS harness run, including corrected shutdown. Not accepted: universal/cross-platform C1 or production integration.**

## Execution and integrity

- Host: macOS26.6.2 build25G83 arm64.
- Exact executed binary: **2a08c1c56a8e2564ba4fe0852d11253b648ab44f7cac23f5e6f84f64280a2d52**; driver **fd8e8099943113b207575113b7d360b9588134327c2cc890dff52a10fcd3476e**. Both checked before/after; source14 and exact lead binary preserved in color-tool-c1-harness-review-h14.Be7eFm. Manifest/config/lock/other sources unchanged from the accepted preparation.
- Exact command: the env -u TAURI_CONFIG C1-RUN-02 invocation in the authorization, using fresh direct child **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-second-reviewed**. No precreation/reuse, extra launch, external kill, runtime source edit or production app control.
- UTC preflight13:40:27Z, process completion confirmed by13:40:36Z. Actual recorded ledger interval ends at7,574,556,291ns (about7.575s); no narrower wall-clock duration is claimed.
- Process exited **0**, with empty stdout/stderr. Post-exit process check found no harness process.
- Ledger **ledger.jsonl**:361,913 bytes, SHA256 **0ef15c196b95ff523b32c62e600e1fd3f4f6389ff1b7e3702c0baf0bc481ad4f**. All482 JSONL rows parse, sequence exactly1..482, timestamps monotonic. Seven case-starts and seven ordered completions; exactly one final harness-completed row482, status passed/completedCases7. No subsequent row or failure/invalid/timeout event.
- Candidate remains clean6e12a73783c7119dae9b6add947e1b5085abe003. First failed ledgerbf09f574/source/binaries/reports are preserved unchanged; its exit1 remains failure.

## Independently reconciled controls

| Case | Completion row | Observed result and boundary |
| --- | --- | --- |
| 1 |37| Exact initial generation1, duplicate original request recovers existing session, same-URL reload generation2, stale original rejects. |
| 2 |66| Actual native receipt holds A; B activates; synthetic A release rejects with no accounting change. |
| 3 |133| Actual execution report99 confirms unguarded pre-dispatch-held A script mutates exact B (null -> from-A). Report132 confirms guarded counterpart rejects generation7 in exact B generation8, retaining null marker/current session. |
| 4 |160| Challenge9 held before dispatch arrives after10; page rejects nonmonotone delivery. Separate synthetic old bootstrap rejects without native authority/accounting mutation. |
| 5 |427|8 correlated timer-scheduled eval callbacks in A1..A8 (rows180/213/246/279/312/345/378/411);0 page timer receipts after eight750ms observation bounds. Unknown/canceled/undelivered only. |
| 6 |452| Actual CloseRequested430/Destroyed431/expected code-less exit prevention432 precede same-label successor. Synthetic old Destroyed446 and Started448/Finished449 leave successor unchanged; page injections are explicitly forced/synthetic. |
| 7 |479| Actual second close455/destroy456/exit prevention457; old native async response rejects StaleIncarnation. Ordinary callback unobserved within750ms; explicit page receipt477 rejects old session and preserves successor. |

All four stale bootstrap rows35/63/158/450 have equal before/after actual-registry accounting.26 groups/442 trusted test metadata bytes/52 leases remain in memory;27 validated bootstrap records include one duplicate, not27 allocations.

Event totals:3 incarnations;28 actual Started/Finished each plus one injected event each;28 diagnostic starts/readiness;66 eval dispatch requests and66 dispatch acceptances;58 explicit JS execution reports;63 parsed eval callback receipts. Three eval callbacks are absent, for each incarnation's initial challenge (dispatch4/435/460); the corresponding explicit JS receipt and activation are present. We do not infer why those callbacks are missing or claim universal callback delivery.

## Shutdown fix exercised at the former failure boundary

The same relevant suffix recurred: case7 completion479, valid final eval callback480, explicit exit0 request481. Unlike the first run, the receiver remained owned through finalization, yielding terminal success482 and actual exit0. Combined with the causal before/after pure helper regression, this supports H14's correction in the observed schedule. It is not a statistical reliability or exhaustive shutdown proof.

## Acceptance and next boundary

The instrument now supplies one complete finite macOS run. It demonstrates real negative-control successor mutation, selected guarded rejections, native incarnation replacement and finalization. It does **not** convert synthetic callback injection into platform delivery, establish why missing timers/ordinary callbacks vanished, or prove all native navigation/eval schedules safe.

The source-seam verdict's C1-H1..H5 remains binding. Public locked callbacks still do not expose correlated document identity, and the production candidate is still unwired. Before authorizing a production adapter, perform the narrow installed-source obligation closeout in correctness-wave-07-c1-evidence-closeout-brief.md. This is not another general ownership/protocol review, extra experiment, dependency fork or193-B coding assignment. Retention-only R, native persistent owners and fast-switch caches remain unchanged.
