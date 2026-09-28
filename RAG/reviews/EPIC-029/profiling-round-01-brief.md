# Real-app profiling — Round 01 review only

Review Lead → existing Code Lead Sol, 2026-09-05. Owner wants durable end-to-end profiling to ground subsequent work. Do not instrument/build/integrate yet. This review designs the smallest defensible measurement workflow, not another generic correctness review.

## Baselines and authority

- Planning carrier: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan; PROJECT-RECORD rev 0.17, especially §10, and AI-IMP-202-real-app-profiling-system.md govern.
- Accepted candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05 at 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Verify clean state; no changes.
- Read candidate AGENTS.md/CLAUDE.md with known stale native-core/debug-package descriptions checked against live source. Current root Cargo.toml declares the workspace but no custom profiles.
- Wave 03 local debug binary hash and build command are preserved in correctness-wave-03-verdict.md. Owner manual picker/video observation supersedes the earlier automation blocker as evidence of manual import working, not comprehensive lifecycle acceptance.
- Independent IMP-178 worktree: /Users/golem/.codex/visualizations/2026/09/04/01a06e41-5fbc-7d80-a106-606e924ac497/color-tool-kmeans-perf, uncommitted production changes at 2cc2000. Read-only evidence; do not edit, stage, commit, build, integrate or claim it is in Wave 03.
- No new task, timer, daemon or ports. Write only the report below. Lead owns ticket/record/epic updates and decisions; never edit them mid-review.

## Questions to resolve from source and available tooling

1. Trace actual user input/selection → intentional debounce → request issue/admission/wait → video FFmpeg/decode → image decode/downscale/sample → OKLab → dataset/SoA preparation → initialization/iterations/final assignment → snap/merge/conversion → response serialization/delivery → store publication → chart generation → DOM update/presentation. Cite precise entry points and existing timings; identify missing, overlapping and conditional work rather than presuming a linear pipeline.
2. Propose optimized, symbolized macOS builds without changing algorithm/compiler optimization semantics relative to the matched release. Verify supported Cargo/Tauri/tool options from local tool help/source or authoritative documentation. dSYM/executable identity and source maps need verifiable matching. A productName overlay is not proof of isolated preferences/cache when bundle ID is shared.
3. Distinguish native process/Rayon/FFmpeg work from WKWebView WebContent/renderer work. State what Instruments Time Profiler can actually capture in the installed version, what JS/chart profiling additionally needs, and what remains unavailable. Propose native call trees/flame graphs and a correlated time-ordered trace; a CPU flame graph alone cannot locate waiting or prove full interactivity.
4. Define observational run/action/span identities independent of production selection/job authority. Explain asynchronous parentage, parallel overlaps, clock-domain alignment/calibration uncertainty, dropped trace events, stale/cancelled/error terminal records and timeout/censoring treatment. Do not subtract raw Rust Instant from JS performance.now or sum overlapping spans as wall time.
5. Define two separate user-facing endpoints: first feedback/responsiveness and correct-result presentation. DOM commit, animation-frame callback and display presentation are different evidence; label a next-frame approximation honestly if actual presentation cannot be observed. Include latest-wins correctness under rapid actions and visible result provenance.
6. Define a private local manifest for owner's standard varied Desktop set (exact paths remain an owner/local mapping; no broad Desktop scan). Include stable case ID, content hash, media metadata/frame timestamp, full resolved parameters/features, palette/render controls, viewport, source/cache condition, algorithm seed, binary/lock/toolchain/sidecar hashes and workload notes. Specify what must be asked later without blocking this source review.
7. Order experiment gates: first same-material/config quiet optimized candidate sanity; then known-good release vs candidate-no-178; optional candidate-plus-reviewed-178 only after its own acceptance. Keep immutable original release observations separate from a recompiled instrumented historical tree. If old source/binary cannot be identified, mark that arm unavailable instead of substituting another build.
8. Propose feasible cold/warm, quiet/active-ML randomized or counterbalanced repeats with a seed/order log; define cache semantics and enough per-case samples for honest tail claims. Do not conflate fresh app state with cold OS disk cache. Do not pool unlike K/sample sizes or turn 20–60 ms recollection into a universal SLA. Specify robust outlier/failure policy, profiler-on/off overhead pairs, estimated run budget and threshold-setting procedure before implementation.
9. Inventory prior benchmarks/EPIC-025/026/IMP-178 and dedupe the proposed system from existing tooling. Propose minimal script/schema/report tests and exact future file fences in dependency order. Keep color-core Tauri-free, normal runtime offline, collection bounded/opt-in, and disabled overhead demonstrated. Avoid per-pixel/centroid trace events. Retain raw traces locally; no external upload or private asset commits.

## Boundaries and allowed validation

Read-only source/history and existing artifact inspection; local version/help/template listings and symbol metadata queries are allowed. No build, benchmark, profile recording, app interaction, ML orchestration, system settings/cache changes, installs, dependency edits, Git mutations or instrumented scratch code. Don't start long background work or edit existing spike/bench binaries. Do not inspect unrelated owner files/process arguments.

The lead confirmed /Applications/Xcode.app/Contents/Developer/usr/bin/xctrace resolves; this is availability, not validated recording or symbolication. Verify each consequential API/tool claim; report unknowns honestly. No new profiling thresholds or numerical fidelity concessions may be silently selected.

## Deliverable

Write /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-round-01-review.md.

Include: verified baselines, source timing map, proposed minimal architecture with alternatives/tradeoffs, exact implementation file list by stage, manifests/trace schema sketch, reproducible build/capture command proposals, metric endpoint definitions, workload/sample plan and execution budget, correctness/overhead/schema tests, provisional thresholds clearly marked for lead approval, risks/unavailable evidence and a concise decision list. Preserve owner observations as reported rather than measured by you.

Recommend the smallest first implementation slice that can answer whether optimized Wave 03 is actually slow before building a general-purpose tracing platform. Explain what further instrumentation becomes justified only after that sanity comparison. No requirement to finish every profiler surface in one wave.

Notify Review Lead task 019f7c75-2b8b-7882-9df7-0cdc1e494671 with the report path and stop. No implementation or IMP-178 integration until the numbered verdict and explicit assignment.
