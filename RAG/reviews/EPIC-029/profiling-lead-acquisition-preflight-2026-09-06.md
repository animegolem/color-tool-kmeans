# Lead acquisition preflight notes after B18

2026-09-06. Read-only preparation, not a new Code Lead capture assignment.

Installed xctrace reports16.0 (17E192); template list contains Time Profiler/CPU Profiler/System Trace. Actual local help confirms record --attach PID, --time-limit, --output; export --toc then schema-derived --xpath; symbolicate --input/--output/--dsym. Always supply a NEW symbolicated output; default would rewrite the input trace. No recording or attachment has yet run. Do not use --all-processes or --no-prompt.

Proposed next execution shape after source acceptance: preserve B14 sealed session/carrier snapshots; separately authorize normal quit of only verified B14 PID and one new unique-session detached launch of unchanged B14 bundle. Existing support/cache namespace is now a known reused app namespace, not absent/fresh caches. No purges. Same supplied still, fully resolved current parameters and all setup inputs retained. Once loaded, one bounded120-second Time Profiler capture attached only to verified new native PID while ordinary settled K changes run. Preserve original .trace, TOC, exports and new symbolicated copy. Import binding must use actual captured source/config/viewport/PID/executable evidence; never set verified merely because schema accepts it. Private offline rendering may show native sampled stacks and separate renderer event spans but cannot invent cross-clock alignment.

Source caveats independently checked:
- Native profiling.rs creates header.wall_unix_ms before ProfileWriter::new, then origin:Instant::now afterward. The header's native0/wall pair is not a demonstrated exact calibration; unmeasured header-write delay matters.
- profile_status contains native monotonic/wall values and rendererBefore/After bounds, but trace.ts retains status for invocation/limits without persisting those calibration fields. Historical B16 cannot acquire new precise calibration retrospectively.
- Native receive/return and renderer issue/settle are correlated by action IDs and supply causal containment constraints; they do not directly align xctrace sampled timestamps or prove physical display.
- Current selected vite/main/config source search found no explicit sourcemap/devtools/isInspectable setting. This is not proof release Web Inspector is available or unavailable; do not assume semantic JS stack capture or broaden to all processes.
- Targeted native Time Profiler plus retained renderer events may establish complementary same-run evidence. CPU samples alone omit waiting and semantic renderer stacks. Do not call a native-only flame graph the owner's completed end-to-end deliverable.

Remaining acquisition choices belong to lead ruling after B18 R1: exact fresh session/runtime authority, attribution budget/control recipe, private artifact viewer, and honest clock uncertainty/coverage. No owner blocker has been demonstrated by installed-tool help alone.

