# Wave07 — focused C1 native document/window seam check

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.72; accepted Round02 C1 is already settled. This is a concrete runtime integration check before193-B, not a third general protocol review, product-policy discussion or193 source assignment.

## Exact scope and evidence base

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01 is clean at **6e12a73783c7119dae9b6add947e1b5085abe003**.193-A is locally accepted. Inspect current main.rs, Tauri configuration, renderer main.ts/App.svelte/invoke bridge, and the locally locked implementation. Actual lock versions: tauri2.11.5, tauri-runtime-wry2.11.4, wry0.55.1. Older cached versions exist; do not confuse them.

Lead has verified public tauri2.11.5 Webview::on_page_load / Builder::on_page_load, PageLoadPayload and eval/eval_with_callback surfaces exist, but has NOT established their document-recency guarantee. A callback name or URL alone is insufficient. Trace the implementation rather than assume it.

Only durable write: planning RAG/reviews/EPIC-029/correctness-wave-07-c1-runtime-seam-review.md. A small source/API compile probe under a newly created private temporary directory is permitted if it answers an actual signature/accessibility question using installed dependencies, with all authored files made via apply_patch and no new dependency install. It must not launch an app/WebView or touch normal user/cache data; report it separately from source/runtime proof. No candidate/planning ticket/record/index/source/test changes, Git mutation, package builds/launches, network/dependency upgrade, watchers or polling. Do not run the unchanged full suites just for this read-only check.

## Answer this exact question

How can the supported current Tauri/Wry stack establish a native-ordered window/document lifetime so a delayed old bootstrap/retry cannot retire or acquire ownership in its successor? C1 forbids last-arriving random JS nonce wins. A retired client is terminal unless it proves a new current document lifetime; never propose an unlimited SessionRetired bootstrap loop.

Provide exact installed-source paths/versions/line ranges and distinguish documented API, implementation trace, compile evidence, inferred behavior and unproven runtime ordering. Inspect at least:

1. Native lifecycle events for initial creation, same-window navigation/reload, close/destruction and same-label window replacement. Does callback context carry a stable incarnation/document identifier, or only label/URL/event? Which events refer to main-frame/provisional/committed navigation? What ordering survives delayed callbacks?
2. Eval/initialization-script/IPC delivery paths: whether a native-issued challenge can be delivered only to the current document and bound to a native lifetime, whether delayed evaluation can target a newer document, and what happens before renderer initialization or after navigation. Do not assume static initialization-script bytes are freshly native-issued per reload.
3. A small concrete transition trace for duplicate bootstrap, newer activation then old delayed call, simultaneous/reordered requests, old-client retries, stale window-generation calls, and old finish/response callbacks arriving after a new start. Show which native event establishes recency and why requests cannot advance it themselves.
4. If a supported seam exists, identify the smallest existing allowed files and a concrete test seam for implementation. Propose only an implementation mechanism for the already settled C1 invariant; lead owns final ruling and exact193-B assignment. Describe where193-A registry/backend identity attaches and which later C2 source/session grant recovery keys must persist.
5. If no supported seam establishes the needed ordering, identify the exact counterexample and smallest missing runtime evidence or capability. Do not silently weaken C1, invent a Tauri API, expand into a platform fork, or reopen all193 design.

Keep review focused: no re-audit of six accepted prerequisites, C2/3 redesign, quota discussion, filesystem publication implementation, UI rework or new general review round. Cross-platform differences found in installed sources should be explicit; macOS trace is not Windows/Linux execution. A proposed state machine test is not proof that native events have its assumed order.

## Handoff

Report exact base/status (unchanged), locked-version/source evidence, concise supported-versus-unproven result, smallest implementation/test fence, concrete counterexample where relevant, and any optional compile-probe path/hash/command/outcome. Send this lead the report path/hash and stop without polling. No owner decision is required unless a real product or authority expansion is exposed.

