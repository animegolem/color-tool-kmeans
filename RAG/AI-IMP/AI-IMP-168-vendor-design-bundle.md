---
node_id: AI-IMP-168
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed: 2026-10-14
assignee: Code Lead (Sol)
---

# AI-IMP-168-vendor-design-bundle

## Preserve design provenance and add dormant study tokens

Replace the zip-only design handoff with a searchable, provenance-preserving September study-design carrier and a dormant token sheet. Existing Fira Sans/Fira Code assets are already vendored; do not duplicate them. Archive references by copying, never delete the supplied archives.

Normative basis: PROJECT-RECORD rev 0.5 §9.1, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No runtime UI, dependencies, font replacement, old-zip deletion, analysis, export output, or IPC changes.

### Design/Approach

Follow PROJECT-RECORD rev 0.6 §9.7 and Round 01 verdict V3/V5/V6. Preserve all eight pinned references byte-for-byte in a dated carrier; record source/copy hashes separately from any generated preview wrappers. Six non-3D HTML fragments plus the Markdown register have no runtime network imports; the preserved 3D HTML is a network-dependent prototype with an honest limitation, not an offline visual fallback. Three.js vendoring/fallback belongs to IMP-197. Add study-tokens.css under [data-study-surface] with only --study-* variables and no production import. Record nine font binaries plus README, six archive matches, and absent in-repo license evidence truthfully; download nothing and keep all archive/font bytes unchanged. Serif remains an unapproved proposal.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- RAG/design-system/** (new reference-only extraction, excluding duplicate uploads)
- RAG/design-2026-09/** (provenance/portable previews only; do not rewrite normative decisions)
- tauri-app/src/lib/styles/study-tokens.css (new, dormant)
- tauri-app/src/assets/fonts/README.md (inventory only)
- CLAUDE.md and AGENTS.md (design pointers only)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Inventory all reference sources, dates, licensing, and hashes; keep originals unchanged.
- [x] Verify already-vendored font files; do not download or add fonts without a licensing ruling.
- [x] Add dormant scoped tokens with no main-entry import or effect on current rendering.
- [x] Keep the non-3D references inspectable offline; explicitly identify the preserved Three.js prototype's network limitation without claiming a bundled fallback. Generated wrappers require separately declared paths and never replace pinned sources.
- [x] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN current main and the design carrier, WHEN a developer opens the references offline, THEN they can identify current versus superseded designs and inspect the non-3D walkthrough, AND the shipping UI and source behavior are unchanged.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Implementation validation on macOS 27.0 at main `a4b5f49`: all eight
repository copies match both their pinned source hashes and source bytes. The
three preserved archives remain unchanged with 104/137/12 entries; the Figma
carrier and all nine font binaries remain unchanged. Six same-name archive font
entries match the current binaries. No font or dependency was downloaded, and
no license/OFL record was found in the reviewed repository locations; that is
recorded as an evidence gap rather than a licensing conclusion.

Chromium was forced offline through its network protocol while each preserved
reference was loaded from `file:`. The six non-3D HTML files and Markdown
register completed with visible content, zero failed requests, and zero runtime
exceptions. The 3D prototype produced the expected two
`net::ERR_INTERNET_DISCONNECTED` failures for its preserved `esm.sh` imports
and displayed its own "3D view could not start" status. No wrapper or fallback
was added.

The token sheet has one `[data-study-surface]` selector, only `--study-*`
properties, and no production import. The production build transformed 284
modules and emitted only `dist/index.html` plus its normal assets; searches of
the output found no study selector, variable, carrier path, or sentinel value.
Existing app validation passed: Vitest 16 files/179 tests; Svelte check 0 errors
and the two accepted AUD-020 warnings; ESLint; Prettier; production build; Cargo
format; strict workspace Clippy; Cargo workspace tests 48 passed/0 failed/0
ignored; scalar snapshot 1 passed; and the normal `color-core` dependency tree
contains no Tauri package. `git diff --check`, 8/8 carrier checksum checks, and
format checks for the new carrier README, both edited inventory/provenance
READMEs, and the token sheet also passed. No new application test was needed for
this reference-only, dormant change.

The first offline Clippy attempt exposed that the repository's root
`Cargo.lock` is intentionally ignored: the fresh clone resolved a newer graph
and lacked `zerocopy-derive 0.8.62` in cache. The live checkout's ignored lock
(SHA-256
`fc69255a02bb05664a4cd1e7fe9e69115034445584a3526e04dcdda76065b82e`)
was copied into the disposable candidate, after which locked/offline Clippy and
tests passed; no tracked lock or package file changed. Toolchains were Node
26.8.1, npm 11.19.0, and Rust/Cargo 1.90.0. Node 20, Windows, Linux, packaging,
shipping-app runtime, and owner visual acceptance remain unrun and are not
inferred from these gates.

The Review Lead reproduced the original 16-path fence, 8/8 carrier hashes,
token dormancy, unchanged font binaries, Prettier checks, and Vitest 179/179,
then found that the real staged hook rejected seven immutable reference HTML
files as unformatted. Reformatting them would violate their pins. Under the
lead's narrow ticket amendment, `.githooks/pre-commit` now treats
`RAG/design-system/*` like the existing vendored/generated exclusions, and
`scripts/ci/pre-commit.test.mjs` proves both sides: pinned carrier HTML needs no
formatter toolchain, while unformatted HTML elsewhere still fails.

The first negative-control HTML string was already valid Prettier output, so the
focused suite honestly failed 1 of 45 tests; replacing it with a verified
noncanonical nested case made the full suite pass 45/45. `bash -n` passed. The
actual hook then passed on all 18 amended staged paths, reporting two formatter
inputs and zero failures while preserving both index and working-tree status
digests. The hook and its regression are the only additions to the lead-reviewed
16-path candidate.
