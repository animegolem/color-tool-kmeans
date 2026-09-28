---
node_id: AI-IMP-203
tags:
  - IMP-LIST
  - Implementation
  - tooling
kanban_status: in-progress
depends_on: []
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.99
date_created: 2026-09-06
date_completed:
---

# AI-IMP-203-svelte-event-guard-token-boundary

## Stop CSS selectors being mistaken for legacy Svelte events

The attempted reviewed profiling-baseline commit is blocked by the hook's unanchored `on:[a-zA-Z]` search matching the suffix of `button:disabled` and `button:not`. No legacy event directive exists in the observed matches. Use a token boundary to retain the current textual gate while excluding these CSS suffixes. Lead-owned tooling prerequisite; app source must stay unchanged.

### Out of Scope

AST-based linter replacement, changing runes policy, disabling hooks, app/profiling source changes, package/dependency changes, main integration or release.

### Design/Approach

Add a word boundary immediately before `on:`. A small Node test reads the actual hook expression and passes cases to installed ripgrep, covering CSS/runes negatives and legacy event/modifier/forwarded-event positives. This remains a conservative textual guard, not a Svelte parser. Use candidate-local hooks for the commit; inherited absolute core.hooksPath points at main and must not silently select the older guard. Do not alter shared Git configuration.

### Files to Touch

- Candidate `.githooks/pre-commit`.
- Candidate `scripts/svelte-event-guard.test.mjs` (new).
- Hook-generated candidate `RAG/INDEX.md` only as normal derived metadata.
- Lead-owned planning ticket/log/record.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Reproduce CSS false positives against the original hook expression.
- [x] Correct token boundary and pass all negative/positive cases.
- [x] Run enabled candidate-local commit hooks; preserve the57 reviewed profiling source files unchanged.
- [x] Record local commit and integration limitation.

### Acceptance Criteria

GIVEN ordinary CSS button pseudoclasses and runes events, WHEN the guard runs, THEN it allows them; GIVEN legacy Svelte event attributes, modifiers or forwarding, THEN it continues to reject them. The actual baseline commit must pass the corrected gate without a hook bypass.

### Issues Encountered

<!-- Preserve failed approaches and missing acceptance evidence. -->

Discovered while preparing the already-reviewed profiling baseline; first commit attempt stopped before any commit. Reserved203 after no collisions in all eight registered worktree ticket directories or all-ref commit subjects. Main's absolute hooksPath is inherited; use per-command candidate-local hooks, not a persistent shared config change. No owner blocker.

Locally accepted856fc987f12ca78753205a67b960e5383144319a: hook,42-line regression and generatedINDEX. Before correction7pass/3fail; after10pass, including actual hook execution. Following profiling commit9215711 also passes enabled hooks; exact57 source hashes preserved. Status remains in-progress until main integration; no release or whole-parser claim.
