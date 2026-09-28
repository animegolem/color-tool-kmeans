# Wave04 verdict — locally accepted renderer replacement identity

Review Lead, 2026-09-06. PROJECT-RECORD rev0.56 §§3–8,11. Accept all three issue patches within the local source/test boundary. No main integration, release, new app build or mounted/owner acceptance is claimed.

## Provenance and exact tip

Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, existing branch, clean tip **41222c50001b7a02d516e7122b94f434ea073243**.

| Issue | Reviewed source provenance | Lead-owned local commit |
| --- | --- | --- |
| SWEEP-010 | Adapt42137f7451297c8bff52cb0ee73c83845979c14f; reject unsafe preserveColorAnalysis branch |44d7f57cc9e09a66295a91544a2dffa04542b00f |
| SWEEP-017 | Adapt1e48deb6d3cac490096fc45cd1ca1fc1c1b1025a; store-owned non-recycling revisions |dbfad2600b2d5395a61966c9913c12b56650993d |
| AI-IMP-181 | New shared revision-aware scheduled/seeded key plus integration tests |41222c50001b7a02d516e7122b94f434ea073243 |

Prerequisites856fc98 [IMP203 hook] and9215711 [unchanged profiling foundation] remain separate. No historical B14/B20 source/trace identity is rewritten. Each issue includes only its allowed source/tests plus normal generatedINDEX; no delegated Git mutation. Final181 commit is4files370 additions/27deletions: three source/tests368/25 plus INDEX. Whole wave04 spans12 source/test paths plus INDEX,1163 additions/87deletions; permanent frontend delta is21 tests and4 files over335/27.

## Source and test review

Phase181 submission SHA25671bf21019ba62cfadf21e85461e2cfb5ac7b505bcc63e52a6bff8c0765cf5fd6 was read completely. Lead matched all three prepared hashes and exact fence, then inspected the shared key helper and real ingestion/store/runner tests. Actual contentRevision is read in both schedule and remount seed; all numeric key/native fields,400ms debounce,150ms spinner, status-aware retry, token cancellation, profiling observer and wire schema remain unchanged.

Earlier phase verdicts independently establish Colors/Values cache invalidation before content publication, canonical Values pending-token revocation, video cancellation before accepted-frame publication, caller/store identity normalization, fresh safe-integer revisions across remove/clear, primitive pinned snapshots and next explicit Batch recomposition.

The final tests prove ready A -> same-path B uses the retained ID but a fresh store revision, no native dispatch at399ms, exactly one at400ms despite explicit plus a labeled reactive-equivalent scheduling call; late A success/error cannot overwrite completed B. An actual stored-entry remount seed makes no native call, while new store admission does. Real profiling collector coverage distinguishes A/B opaque keys, deduplicates repeated B and retains one bound native invocation/store callback and identical numeric request.

Sol's negative5fail/7pass and corrected optional-observer mock error are attributed to its pre-production run, not an independent lead-negative replay. No regression is skipped/expected-failure. Lead full/focused Vitest used --silent; Sol's unsuppressed final report documents the expected two profiling error-path stacks.

## Independent final gates

Local macOS toolchain: Nodev26.8.1, npm11.19.0, rustc/cargo1.90.0. Installed dependencies used; no install or lock change.

- Full Vitest:31 files,356 tests passed.
- Focused image/multi lifecycle, Batch revision, runner revision, video reset, race audit, profiling contract/Svelte:8 files,65 tests passed.
- Svelte check:0errors,2accepted noninteractive-tabindex warnings (VideoPanel, ValuesView).
- Lint/format/diff-check:pass.
- Profiling Node:88passed,0failed,0skipped, including production Rust ignored-emitter interoperability.
- Hook regression:10passed,0failed,0skipped.
- Cargo fmt/clippy workspace with warnings denied:pass.
- Cargo workspace tests:72passed,0failed,1intentional ignored emit_native_interop_fixture; that emitter is exercised by Node. Initial verbose native output was truncated when combined with other tool output, so lead reran the quiet workspace suite and independently summed all target counts19+2+1+3+1+14+1+2+28+1=72.
- Scalar no-default-features kmeans_snapshots:1passed.
- color-core normal dependency tree:contains no Tauri.

Actual commit hooks ran via command-local core.hooksPath=.githooks and passed formatting/lint/fmt/clippy/index; shared hook configuration unchanged. Final181 files are under400LOC, no LOC exception. Phase010's already-cohesive large Home/controller/audit files retain its explicit reviewed LOC-bypass; phase017 required none.

## Acceptance boundaries and next work

Accept local renderer replacement correctness and per-issue provenance. IMP181's four implementation checklist items are satisfied; ticket remains in-progress pending integration, consistent with prior accepted-local tickets. IMP180 aggregate adoption stays open. The old video preservation boolean/ID-only seed was deliberately removed; exact already-stored entry reuse is the positive control, not re-extraction from mutable disk.

Not proved: mounted browser/Svelte effect ordering, live app/owner replacement/rapid video handoff, Node20 or Windows/Linux CI, physical display latency, immutable native source/job ownership, in-flight Batch/export replacement safety, performance or the historical stall's cause. No quality, algorithm, debounce or benchmark change follows from these tests.

Next correctness assignment is the separate read-only wave05 preflight for192 with182/183 reconciliation. Do not implement old cached-restore prose if wave04 has removed its premise. Scheduling and redesigned study flow retain their independent bounded gates. All old profiling evidence and app sessions remain untouched.
