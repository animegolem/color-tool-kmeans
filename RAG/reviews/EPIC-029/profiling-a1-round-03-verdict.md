# A1 Round 03 — accepted locally as evidence tooling

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.25.
**ACCEPT this implementation slice, not the complete profiling system.**

Submission SHA-256: 845706e61b5a82e6670df78b180448cb991a8a8946f89f4f55518755dc92a4b2.
Candidate remains at 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 with the 16 untracked A1 files. No tracked changes, commit, merge, publication, release or issue completion occurred.

## Independent evidence

- Recursive comparison against the preserved Round 02 snapshot confirms exactly the five authorized files changed; the other eleven are byte-identical.
- Lead repeated the pre-open FIFO scheduling probe independently of the new callback seam: interposed the Node lstat binding, replaced only a synthetic test-owned regular file with a FIFO, then invoked the real reader in a child with a 1500 ms kill boundary. Current code promptly returned INPUT_CHANGED, with no timeout. Temporary fixtures were removed.
- Lead repeated the original nested case/measurement/strata sentinel probe; no sentinel survives. Reviewed recursive case/availability/strata/measurement rebuilding and enum-keyed count filtering.
- Regenerated A0 summary in memory: bytes match the preserved Round 02 summary at SHA-256 2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013. All 31 attempts, four attempt groups and nine endpoint groups remain.
- Node profiling 54/54, no skips on this macOS host.
- Vitest 21 files / 222 tests pass.
- Svelte 0 errors / 2 accepted existing AUD-020 warnings; lint and format pass.
- Rust fmt and offline clippy pass; workspace 50/50, scalar snapshot 1/1.

R9 and R10 are satisfied. Earlier R1–R8 evidence remains in the preceding verdicts; no new app-performance or causal claim follows from these tool tests.

## Bounded acceptance and size ruling

The 427-line summarizer is accepted for cohesion in this slice: grouping/statistics and its explicit redacted projection share one summary contract; the extra allowlists address the approved safety issue. Do not minify or relocate them into unrelated modules just to suppress a size warning. No LOC bypass or commit has been performed; any later integration must account for the repository's actual LOC gate.

The redactor strips unknown nested fields from generated summary-shaped input; it is not a replacement validator for arbitrarily corrupted values in known fields. CLI records remain strictly validated. Nonblocking FIFO admission was exercised on macOS; the stated Windows/no-O_NONBLOCK skip remains explicit. Node 20 and Windows gates have not been run locally.

A1 can retain and summarize evidence. It does not yet collect a correlated live input-to-result trace, prove exact frame/pixel selection, fix application symbol coverage, quantify observer overhead or close AI-IMP-202. Accepted files stay prepared and uncommitted; preserve all previous reports and immutable A0 artifacts.

Next bounded source review is profiling-b0-boundary-review-brief.md. This supersedes the stopped A1 correction assignment only for that one report; no app instrumentation is authorized yet.
