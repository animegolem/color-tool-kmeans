# AI-IMP-202 B18 R1 signed-zero amendment submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.48; `profiling-b18-r1-review-verdict.md`. Review state: **SUBMITTED; the one-line signed-zero ULP correction and production-inspector boundary regression are complete, all repeated gates pass, and new suffixed evidence confirms unchanged B16 behavior. Original B18 evidence/report remain immutable.**

## Exact amendment

Only the existing B18 two-file fence was used.

In `trace-integrity.mjs`, `ulp(value)` now returns `Number.MIN_VALUE` when `value === 0` before interpreting binary64 bits. JavaScript equality covers both `+0` and `-0`, so both now have the same correct next-higher spacing. No trace number is normalized or rewritten; the exact zero/nonzero duration rule and recomputed reporting authority are unchanged.

In `profiling-trace-integrity.test.mjs`, a production `inspectActionEvidence` test preserves `-0` in memory after JSON parsing, because `JSON.stringify` would erase its sign. With start `-0` and end/duration `Number.MIN_VALUE`:

- recorded `5 * Number.MIN_VALUE` is accepted exactly at the four-ULP envelope;
- recorded `6 * Number.MIN_VALUE` is rejected immediately outside it;
- recorded zero is rejected by the existing zero/nonzero rule.

The test calls the real inspector and the existing batch-span mutation helper; it does not copy the production comparison.

## Source and preservation

- Candidate branch/HEAD remain `codex/correctness-wave-01-2026-09-05` / `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- Exact `git status --short -uall` remains 57 entries with stream SHA-256 `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`.
- Other 55 accepted baseline paths rechecked `OK`.
- Final R1 source hashes:
  - `tauri-app/scripts/profiling/trace-integrity.mjs`: `476836565d75e82b9147ab61801cd762d49fcefd5a72348c6b7b8abb3b441dee` (439 lines)
  - `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs`: `5da348902e19b05c8d9ab8f05e8e5bd4c75c77d660c5e4b0d963125aed2ef3a5` (865 lines)
- Original B18 submission remains SHA-256 `2f6d79b75dbd7d8edd3c06ff24b92050e07b6e3f58f6f95c00d2a64eeb636777`.
- Original B18 receipt/index/script remain byte-identical at `70ed0f60...`, `f4dcbc59...`, and `41df090f...` respectively.
- The reviewed LOC-bypass ruling remains necessary. No minification or boundary broadening was used.

No candidate file outside the two-file fence, B14/B15/B16/B17/original-B18 evidence, raw trace, schema, config, dependency, manifest, lockfile or Git metadata was changed. No app build/launch/control, acquisition, benchmark, or flame graph occurred.

## Repeated gates

Focused production inspector/importer:

```text
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

All profiling Node tests:

```text
ℹ tests 88
ℹ suites 0
ℹ pass 88
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Frontend and static gates:

```text
Test Files  27 passed (27)
     Tests  335 passed (335)
svelte-check found 0 errors and 2 warnings in 2 files
eslint: exit 0
All matched files use Prettier code style!
```

The two Svelte warnings remain the accepted AUD-020 warnings in untouched `VideoPanel.svelte` and `ValuesView.svelte`.

Native gates:

```text
cargo fmt --all -- --check: exit 0
cargo clippy --workspace --offline -- -D warnings: exit 0
72 passed; 0 failed; 1 intentional ignored fixture emitter
```

The ignored emitter remains exercised successfully by the passing Node native-wire interop test. No install or lock generation occurred.

## Suffixed R1 numerical evidence

The final R1 production parser/organizer/inspector re-read the unchanged B16 JSONL in memory. It did not overwrite the original B18 receipt and did not fabricate an import binding.

- Raw trace before/after: 41,843 bytes, mode 0600, SHA-256 `1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652`, byte-identical.
- Policy receipt identifies `renderer-duration-coherence-v1-r1`, `Number.MIN_VALUE` signed-zero spacing, `2^30 ms` domain, `0.000001 ms` cap, exact zero behavior and endpoint-subtraction reporting.
- Schema v2, 26 records, eight actions, four completed, untainted; all eight actual outcomes retained and all four completed actions coherent.
- The only nonexact values remain the sequence-3/8 `input_to_request_admitted_ms` fields: recorded `402.0000000002328`, recomputed `402.00000000023283`, difference `5.684341886080802e-14 ms`.

New suffixed evidence under the existing mode-0700 B18 root; each file is mode 0600:

| Evidence | SHA-256 |
| --- | --- |
| `inspect-b16-r1.mjs` | `198b1d0b9e3c6d93cfccab3cf1a27fe3ad76725b0ece246e9ba2201d069ec72a` |
| `b16-numerical-reinspection-r1.json` | `9242f68627081caa0edd84b2971f8824b4823db689f52feb51470b042fc7e644` |
| `artifact-hashes-r1.sha256` | `f96a1d3f9cce7a31d485e53ba4ff35f0f501b7d476bb3c83b6b1bba6dfa095bb` |

The two R1 indexed artifacts reverified `OK`. This is numerical reinspection only—not an acquisition-bound import, historical relabelling, or performance/flame acceptance.

No assigned gate is missing and no owner blocker is asserted. Stop point: Review Lead R1 source/evidence acceptance.
