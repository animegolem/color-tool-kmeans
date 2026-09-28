# EPIC-029 — Round 01 Code Lead review brief

Status: **dispatched to Code Lead on 2026-09-04**, task `01a06e5c-ac00-7761-884c-7ecca850de94`. Mode: **review only**. No coding, dependency installs, commit, cherry-pick, rebase, push or PR action is authorized by this brief.

Round 01 is now received and preserved. The [Round 01 verdict](round-01-verdict.md) supersedes the original base/output instructions for the focused Round 02 follow-up; this document remains the historical first assignment.

## Authority and inputs

The owner designated **Audit app control flows** as project lead. That task remains Review Lead and owns decisions, ticket IDs, scope amendments and acceptance. The Code Lead may propose scheduling and use read-only bounded subagents, but cannot redefine requirements or claim review acceptance.

Read in this order:

1. Repository AGENTS.md and CLAUDE.md, then RAG/PROJECT-RECORD.md.
2. RAG/AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md.
3. RAG/AI-EPIC/AI-EPIC-029-control-flow-remediation.md.
4. RAG/reviews/EPIC-029/sweep-adoption-manifest.md.
5. AI-IMP-179 through194 and their fenced source/test boundaries.
6. The July sweep register at source revision f427ff4, and relevant current tests.

Working branches: current main `2cc2000`; immutable sweep `f427ff4`; planning `codex/remediation-planning-2026-09-04`. Verify these before review; if a tip moved, report the delta rather than silently mixing evidence. Active IMP-178 performance work is separately owned and uncommitted in its own worktree; avoid heavy tests/benchmarks that interfere with measurement.

## Review tasks

1. Challenge each current residual against its callers and existing regression coverage. Return agree/disagree/needs evidence with source lines and trigger. Preserve rejected leads so the register can be denoised.
2. Propose the smallest coherent native ownership mechanism for IMP-193: admission, job lease, publication, consumer transfer, source removal, last-owner deletion and abandoned-startup recovery. Explain how image/video/Values/Batch/export consumers share one contract. Identify policy choices when every artifact is owned and a budget is reached; do not assume silent deletion is acceptable.
3. Verify core adoption boundaries: current `color_core::analyze`, core re-exports, native dependencies and k-means path. Identify source patches requiring adaptation and exact regression coverage. Do not import the obsolete inline command pipeline.
4. Review canonical selection epoch, exact cached restore and pending-frame handoff as one compositional contract. Check that settling the current request does not revoke itself.
5. Refine waves and estimate risk/effort. Parallelize only disjoint files; the selection lane, native frontend hooks, and export lane have explicit overlap. IMP-187 must coordinate with IMP-178.
6. Propose any necessary file-fence amendments and test-harness additions before edits. No tests marked it.fails; no permanent tests added in this review round.
7. Recommend whether optional189/190/194 should remain backlog for the first remedial release. Do not merge them into critical ownership changes.

## Permitted outputs

Only `RAG/reviews/EPIC-029/round-01-code-lead-review.md` may be created by the Code Lead in its assigned review worktree. Source and existing documents are read-only. Any subagent's notes are returned to the Code Lead for integration into that single submission; no competing central registers.

Return:

- Reviewed base/source/planning refs and role/round.
- Disposition table keyed by SEP and SWEEP IDs, including counterevidence.
- Native ownership proposal with alternatives, costs and unresolved owner choices.
- Exact ticket/file-boundary corrections requested.
- Ordered waves, shared-file exclusions, relevant concurrency limit and coordination with178.
- Concrete acceptance tests, executable versus source-only evidence, and honest environment constraints.
- A concise decision-request list; no hidden assumptions or implementation changes.

Do not request extra agents to reread the entire repository redundantly. Use bounded subsystem checks only where they add evidence.

## Review protocol

Review Lead returns `round-01-verdict.md` with accepted, rejected and revised items and numbered scope amendments. No verdict exists yet. Only after that verdict and explicit implementation authorization may the Code Lead begin coding. A subsequent implementation brief states exact ticket range, worktree/base, commit authority, validation gates and return format.

The requested delivery style remains one issue per commit in a reviewable stack, but repository delegated-agent rules currently prohibit commits. Do not infer a blanket override from this brief. Review Lead can prepare commits from checked patches or explicitly authorize the Code Lead in the later assignment.

Maintain separate meanings for prepared, dispatched, submitted, self-reviewed, accepted, merged and released. No watcher or timer is configured by this planning package.
