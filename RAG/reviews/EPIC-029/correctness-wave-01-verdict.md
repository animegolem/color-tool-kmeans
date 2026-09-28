---
submission: correctness-wave-01
verdict: accepted
acceptance_scope: local-candidate-only
branch: codex/correctness-wave-01-2026-09-05
commit: 6a17da61d079635d2dcec93c896d8e05c17027d8
submission_base: 5baa20e021855fbc57aebf48fa0f9b3374ded281
round: 1
reviewed: 2026-09-05
---

# Correctness wave 01 — independent lead verdict

Accepted as a locally validated, two-issue candidate. Not merged, published, released or human-accepted. The immutable submission described an uncommitted diff at the submission base; the commit field above identifies the resulting lead-created tip, not a commit claimed by Sol.

## Boundary and topology

Sol changed exactly the nine authorized source paths: one golden spec; async-listener.ts, drag-drop.ts and its new spec; Home/Values/Batch listener wiring; batch-drop.svelte.ts; and the existing resource-integrity audit spec. No layout, Batch pinning, production math, dependency, configuration or fixture-byte changes.

The lead created these commits in order, with the repository hooks enabled:

| Issue | Candidate commit | Provenance |
| --- | --- | --- |
| IMP-179 | 271bee6efe7fd1f65ca5b90ef4e0e8d9bbfba922 | Identical one-line repair from the isolated IMP-178 performance candidate; no numeric work imported |
| SWEEP-004 / partial IMP-180 | 6a17da61d079635d2dcec93c896d8e05c17027d8 | Adapted source 362b4a4a9327040682944e89ddbb8fd3d138932c |

The first commit additionally contains the hook-generated RAG/INDEX.md refresh (date and three view LOC counts measured from the combined working candidate). No hand-edited index or ticket normalization was imported. The resulting stack has nine source files plus that generated index; the second commit contains exactly its eight source files. Canonical planning documents remain in the separate dirty planning carrier. Final candidate status was clean. Main and origin/main remained 5baa20e, with the main checkout clean.

## Logic reviewed

- Golden URL changes only: existing fixture and numerical assertions are unchanged.
- Partial listener registration drains acquired callbacks in reverse order, clears ownership before teardown and continues after individual cleanup failures without replacing the registration error.
- Shared mount ownership consumes synchronous registration throws and asynchronous rejection, releases late completion after disposal, and is idempotent under repeated disposal. Current error reporters are explicit console reporters; no general guarantee about a caller-supplied throwing reporter is claimed.
- Batch owns cleanup at onMount; its duplicate onDestroy lifecycle is removed. Processing, pinning, selection and normal view markup are unchanged.
- Six new cases and one strengthened existing regression are present. The reverse-order behavior was inspected in source; the tests assert all cleanup calls, error preservation and once-only disposal, not an explicit invocation-order expectation.

## Independently reproduced gates

On macOS arm64, Node 26.8.1 / npm 11.19.0 / Rust 1.90.0:

| Gate | Lead outcome |
| --- | --- |
| Full Vitest | Exit 0; 17 files, 185 tests passed |
| Golden + drag/drop + resource + race focus | Exit 0; 4 files, 24 tests passed (1 + 3 + 5 + 15) |
| Svelte check | Exit 0; zero errors, two accepted existing tabindex warnings |
| Lint / format check | Both exit 0 |
| Rust workspace fmt / clippy with warnings denied | Both exit 0; clippy used offline cache |
| Rust workspace tests | Exit 0; 48 passed, zero failed/ignored; empty doc-test suites |
| Scalar k-means snapshot | Exit 0; one passed |
| Normal color-core dependency tree | Exit 0; no Tauri dependency |
| Diff whitespace / final scope | Passed |

Both commit hooks also passed format, lint, Rust fmt/clippy and generated the index. Three preexisting large view files produced non-blocking local LOC warnings; no size-driven layout refactor was introduced. The inspected current CI workflow does not run a strict LOC step despite the historical CLAUDE description. CLAUDE also still names the old helper location; documentation synchronization remains a lead follow-up, not a claim that Sol changed it.

Sol's pre-fix golden ENOENT reproduction is submission evidence; the lead independently inspected the exact before/after URL and reran the passing repaired suite, but did not revert the candidate to rerun the negative case.

## Remaining acceptance and environment

Node 20, Linux/Windows CI/packaging, full native app launch and hands-on drag/drop were not run. IMP-179 remains in-progress pending integration despite checked local implementation evidence; IMP-180 remains partial and none of its aggregate checklist is closed. Release gates remain open. Private node_modules, Cargo outputs/cache, intended sidecars and redundant nested bin/bin copies remain; nothing was deleted or installed by this review. Sidecar provisioning friction is preserved in the submission and log.

## Channel state

Wave 01 is settled. Correctness wave 02 is separately scoped in correctness-wave-02-implementation-brief.md. Sol must read that assignment before further edits; no autonomous scope expansion or polling. UI implementation and owner design decisions remain parked.
