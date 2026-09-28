---
node_id: AI-IMP-169
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-168
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-169-paper-primitives-library

## Minimal flat study surface primitives

Implement the minimum reusable FigureFrame and native-control styling required by the flat study UI, not a literal port of eighteen decorative paper components. Completion is a non-shipping showcase plus accessible component proofs.

Normative basis: PROJECT-RECORD rev 0.5 §9.1, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No App.svelte, real views, stores, runners, bridges, exports, Rust, package files, decorative primitives, or live routing.

### Design/Approach

Follow PROJECT-RECORD rev 0.6 §9.7 and Round 01 verdict V1–V3/V6. FigureFrame uses a required textual title/heading and typed optional Svelte 5 Snippet props for controls/content/caption with {@render}, not legacy slots. Scope every control selector under [data-study-surface], use native buttons/inputs/fieldsets/details, and mount only from an isolated dev entry. No framework/navigation clone/decorative primitives/status logic; IMP-195 owns feedback. SSR proves semantic structure and no render-time callbacks; browser evidence proves interactions. UI-T1 holds the test-config/helper seam: the installed plugin is incompatible with Vitest's nested Vite 5, so do not prescribe its direct addition or change test configuration before the focused compatibility verdict.

Round 02 update / PROJECT-RECORD rev 0.7: UI-T1 is resolved by the accepted test-only exact-.svelte compiler transform, not the incompatible Vite plugin. Preserve .svelte.ts handling and normal discovery; resolve the public compiler from the candidate package boundary. No proof paths, dependencies or preprocessing framework. Reproduce typed-config/Node 20/full-suite/browser gates after separate implementation assignment.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/components/study/FigureFrame.svelte (new)
- tauri-app/src/lib/components/study/FigureFrame.spec.ts (new)
- tauri-app/src/lib/styles/study-controls.css (new)
- tauri-app/src/lib/views/DevStudyShowcase.svelte (new, not mounted in App)
- tauri-app/src/lib/views/DevStudyShowcase.spec.ts (new)
- tauri-app/study-showcase.html (new isolated proof entry, not a shipping build input)
- tauri-app/src/dev-study-showcase.ts (new; mounts only the showcase and imports scoped study CSS, optionally existing local fonts.css, never app.css/main/App/stores)
- tauri-app/vitest.config.ts (planned narrow exact-.svelte server compiler transform only, per accepted Round 02 R2-1..R2-4; retain existing Node/include/coverage/alias settings, no new helper/config file)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Render figure headers, local controls, content and captions in the isolated showcase.
- [ ] Use native focus/tab behavior and readable labels with no nested interactive elements.
- [ ] Prove compatible real SSR component tests without changing existing audit/rune-factory expectations, using the separately approved test seam.
- [ ] Demonstrate stacking at 360/736/1024/1440 CSS-pixel widths and 720×600; check long labels, clipping, overflow and minimum-window vertical reachability without scaling an artboard.
- [ ] Exercise Tab/Shift+Tab, native control operation, visible focus, coarse-pointer targets and applicable reduced-motion behavior in the isolated browser page.
- [ ] Verify no production imports/routes or normal-build inclusion of the showcase/study CSS, and no new dependencies or current global-style changes.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN the isolated showcase, WHEN keyboard focus and narrow widths are exercised, THEN controls remain usable and figure contents do not clip, AND the shipping shell remains unchanged.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
