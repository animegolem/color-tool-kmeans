# IMP-193-4 owner session 01 launch gate

2026-09-18 / PROJECT-RECORD rev0.97. Preparation remains accepted under P16..P18; runtime and owner acceptance are not yet established.

## 193-4-L1 — One explicit launch

Owner: "gotcha feel free to launch the test app and let me know what we need to review". This authorizes the Review Lead to launch the accepted isolated artifact once and hand over the visible interaction. It supersedes the earlier manual-owner-launch wording for this session only. No source edit, rebuild, production launch/change, implementation assignment, automatic retry or adoption is authorized.

## 193-4-L2 — Exact executable and preflight

- Executable: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r3.WATeWJ/color-tool-c1-visible-r3-lead-build`
- SHA256 reverified: `0e6237f7d32c6d0c9419c93babd899345574c241d7214205798b1b2f034b953b`; Mach-O arm64.
- Host actually observed: macOS27.0 build26A428, arm64. This is not the earlier preparation host evidence.
- Namespace: `com.color.tool.c1visible.p8xk8n`, title `Color Tool — Visible Replacement Test [p8xk8n]`. Process and desktop inventory show no test instance before launch; production Color Tool is not running.
- Sole fresh output: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N/run-20260908-visible-owner-01`. Absent before launch; the date is its reservation date, not the actual session date. Let the binary create it.
- Candidate/main remain clean at `6e12a73783c7119dae9b6add947e1b5085abe003` / `5baa20e021855fbc57aebf48fa0f9b3374ded281`. Frozen source and earlier evidence stay unchanged.

Launch exactly the executable above with `env -u TAURI_CONFIG`, `--run` and the exact fresh output. Track actual stdout/stderr and exit using the tool process session. Startup observation is not successful finalization; preserve partial evidence and stop if startup fails.

## 193-4-L3 — Owner interaction and finite bounds

The owner controls the six ordered cases: initial typing/selection/Tab/Cmd-L; local A/B navigation without replacement; explicit Replace/Cmd-R; requested reload then simulated loss; status/exact geometry/manual resize-move/replacement; minimize/restore/fullscreen/relevant Spaces and normal close. Record met/failed/untested; failed/untested requires a note. Finish and quit, red close and Cmd-Q are available.

Replacement should retain the native parent and native synthetic work/data but intentionally resets renderer scratch text, selection, focus and local view. Watch for unacceptable flicker, blanking, lost keyboard access, unexpected activation or window movement. Wry may activate the application; continuity is an observation, not a guarantee.

Overall watchdog is30minutes, machine operations20seconds. Expiry/failure is not success. No induced real process crash, owner-file loading, media, network, installation or production test. Simulated loss is not actual OS loss evidence.

## 193-4-L4 — Evidence and handoff

Lead may read startup ledger/UI, record the launch session and hand over without performing owner cases or entering their dispositions. Keep the three runtime/owner checklist items open. After exit, record actual exit status and validate/hash the sealed or partial evidence separately. Owner supplies explicit acceptable/unacceptable feel verdict. No automatic repeat and no IMP-193-5 authority.

## Launch receipt

Executed once on2026-09-18 with the exact command scoped above. Tool process session86478, observed PID62026; initial launch and subsequent process poll have no stdout/stderr and process remains running. The binary created the reserved output and ledger.jsonl.

Read-only startup inspection finds19 rows: child-admitted at9, parent-show-returned at10, actual renderer visible receipt at14 and animation-frame receipts15/16. Current session accepts controls with child-1, no recovery/infrastructure failure/shutdown/terminal and no owner dispositions. Later visibility/focus receipts reflect a hidden/unfocused window; bring the test window forward for interaction. These are native/renderer receipts, not an independent screenshot or subjective UI verdict.

Desktop inventory does not expose this bare executable as an addressable app, although ps confirms the exact running process. Lead did not call an app selector that might launch a duplicate, perform any owner case or enter a disposition. Actual exit and final ledger validation remain pending owner completion. Planning index generation completed exit0; git diff --check passed.
