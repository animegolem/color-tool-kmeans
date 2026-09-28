# AI-IMP-202 B11 control-proof verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev 0.41.
**Diagnostic accepted with limitations; valid-action correlation FAILED. No performance or aggregate acceptance.**

Reviewed submission: profiling-b11-v2-control-proof-submission.md, SHA-256 1cc9dd3d84297d30fa3468c5770ff674f20f81feba00ee9a4ad412e102b5965c.

## V1 — independently reproduced persistence, not timing

Lead executed the unchanged parser, organizer and action inspector against the immutable raw copy. Result: 15,910 bytes, SHA-256 b9f7706b7a3c7293e97a7d674f153146227f7786e9202336979bf8757cc983d2; 14 v2 records, six contiguous batches and six closes, one renderer clock, zero native actions, zero loss, sealValid=true, tainted=false. The live trace rehash still matches.

Actions 1/4 honestly preserve actual empty input with the exact three-event unavailable/unverified form. Actions 2/5 deliver 4 but resolve against 46/45 and close input-value-unresolved. Actions 3/6 deliver final 46/45 but close request-key-unchanged, without native spans or renderer completion endpoints. Coherent noncompleted evidence is not successful execution correlation. Displayed 16/18/15 ms and ordinary ready states support no performance claim.

The retained event log independently shows null -> 4 -> 46 and null -> 4 -> 45, followed by pending/ready final values. The report's UI/navigation observations are retained diagnostic evidence, not a new lead-operated UI replay.

## V2 — preservation and evidence-index correction

All 57 accepted source hashes pass; exact git status -uall matches the capture receipt on unchanged candidate HEAD 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Lead read-only process check finds PID 57783, PPID 1, start Sun Sep 6 10:35:24 2026, at the exact B10 executable. No app control or source/build/Git mutation was performed.

The 36-file index currently gives 35 OK and one mismatch: b11-app.stderr.log is a still-live launcher carrier. The separately frozen stderr.final.log passes its recorded hash and is an exact 11,241-byte prefix of that carrier. Later suffix contains heartbeats, focus/visibility and stall observations. This is not evidence that the immutable trace changed, nor a basis to claim uninterrupted post-capture interaction. Preserve the original index and report; do not repair their bytes. Future final indexes must distinguish immutable snapshots from active carriers and exclude active carriers from immutable-payload claims.

Accept the report's narrower trace-hash interval: the first comparison was after final Colors navigation, not before it. No retroactive pre-navigation durability proof. B10 runtime namespaces now exist; earlier absence statements remain historical.

## V3 — correct the earlier ordering inference

The rev 0.37 statement that source supports observer-before-effect is withdrawn as a guarantee for real browser input. The B8/B9 surrogate tests establish binding conversion and wire handling, not mounted native-event ordering.

In the current ParameterControls.svelte, oninput is delegated while bind:value installs a target listener. HomeView.svelte:521-545 schedules from a real reactive effect. In profiling-svelte.spec.ts:465-488, the test instead calls handleInput and scheduleAnalysisWith inside one listener and dispatches synthetic events synchronously. Its asserted ordering is imposed by the test.

B11 is consistent with binding/effect processing before the delegated observer; a microtask checkpoint between native listener callbacks is a hypothesis, not directly recorded browser proof. Do not label the exact mechanism proven solely by B11 or source inspection.

## V4 — narrow candidate direction; production authority unchanged

Installed Svelte source and a lead-executed in-memory compile confirm oninputcapture generates $.event('input', input, handler, true), before unchanged $.bind_value. events.js:54-62 bypasses delegation in capture. Coordinator paramsWithTarget already supports prebinding target snapshots. The separate accepted-result figure effect is not the analysis effect.

Checkbox needs separate treatment in the proof: bind_checked listens to change, whereas the observation endpoint is input. Do not move to onchange merely for uniformity or infer checkbox behavior from number-field evidence.

Preferred repair hypothesis: move only existing profiling input hooks to capture phase. Preserve bindings, scheduler/debounce/request keys, numerical behavior and fail-closed trace semantics. No production repair is authorized by this verdict alone: B12 supplies a bounded trusted-input reproduction and exact implementation/test fence, then lead issues the implementation ruling promptly.

## Handoff and open gates

profiling-b12-input-ordering-review-brief.md is the next assignment under existing IMP-202, not a new sweep. B11 artifacts and sealed B10 remain untouched. Full suites were not rerun in this diagnostic review. Candidate implementation, fresh native proof, bound acquisition, overhead/parity, end-to-end flame graph, platform and owner acceptance remain open. No owner decision is pending.

Review friction: the first in-memory compiler probe used an unsupported named ESM import from the installed CommonJS compiler. Retried with require; compile succeeded without writes. A default git-status count collapses untracked directories; exact -uall yielded 57 and matched the retained receipt.
