# Review incident — unintended debug launch

Review Lead, 2026-09-05. This is a workflow deviation, not a test result or profiling run.

During the B1 Round03 native review, the read-only reviewer attempted to list tests by invoking a guessed hashed executable:

`target/debug/deps/tauri_app-7a83e339c3f74237 --list | rg 'profiling_tests::'`

Working directory: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01.
That file was an application, not a Rust test harness. Executable SHA-256 independently read by lead: a0ad056e9bd9b3fafcf613026c1c04c68667b6a44f3c64f20d16493c72d41112.

The reviewer observed app setup and a focused window, then resolved exact PID1730 and sent SIGTERM (command exit0). Reviewer ps check found PID absent; lead independently found no process matching the exact executable. No UI input, media selection, app inspection or profiling capture was performed by the reviewer. Its attempted command supplies no test evidence. Lead full gates were separately run using normal npm/Node/Cargo commands and their actual counts.

Lead read only the exact incident log:
`/Users/golem/Library/Caches/com.color.tool/event-log-20260905-195307.txt`.
It contains setup at19:53:07.935-05:00, focus=true19:53:08.010, focus=false19:53:12.761 and heartbeats at19:53:17.942 and19:53:27.948. Therefore the process ran at least20 seconds; do not describe it as a momentary test probe or zero-side-effect run.

Current config and an executable string identify the ordinary com.color.tool namespace, not the isolated A0/B2 namespace. The exact ordinary-cache log confirms a runtime write. Current startup source invokes log pruning and managed frame/strip/clipboard/snapshot retention pruning. Without a pre-launch inventory, actual deletions cannot be established or ruled out. No restoration or cleanup was attempted, and no owner media/preferences or unrelated directories were inspected. Do not claim zero data changes.

The owner was informed during review, including the startup-write/pruning uncertainty. The source carrier remains the same53 known paths on8bf3187; B1/A1 preservation checks pass. This incident neither establishes controlled-app acceptance nor invalidates independently executed synthetic gates.

Prevention: use Cargo's test invocation/artifact identification, never execute a guessed binary under target/deps with --help/--list. B2 preparation permits static Mach-O/plist/DWARF inspection only, with a new bundle identifier and no launch. Any actual run receives an exact-executable, isolated-namespace assignment.

