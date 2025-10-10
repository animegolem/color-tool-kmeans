---
node_id: AI-IMP-062
tags:
  - Implementation
  - tauri
  - ui
  - diagnostics
kanban_status: in_review
depends_on:
  - ADR-002
  - AI-EPIC-006
  - AI-EPIC-007
confidence_score: 0.85
created_date: 2025-10-10
close_date:
---

## HomeView: Error Propagation, Native Badge, and Dev Detection Banner

Current issue: Native analysis errors are not shown to users; drag/drop is disabled in native mode but lacks clear indication. Dev sessions need a small detection banner to confirm environment/selection.

Measurable outcome: On Tauri dev, first Upload shows a one‑time detection banner (env + selected bridge + override). During runtime, errors from `TauriComputeError` or `tauriInvoke` surface as toasts/dialogs within 2s. A “Native mode” chip is visible while native path is active and drag/drop is disabled.

### Out of Scope
- Changing Rust command signatures (covered by AI‑IMP‑063)
- Graph visualization and exports (EPIC‑007)

### Design/Approach  
- Add a lightweight toast/overlay system in HomeView for transient errors.
- Render a “Native mode” chip when `(isTauriEnv() || override==='tauri')` is true, and hide drag/drop affordance with copy.
- Dev detection banner (dev‑only): on first file open and first analysis, print `tauriDetectionInfo()`, selected fs/compute bridges, and `bridge.force` status; hide after dismiss.
- Catch and map errors from `analyzeImage()` and `tauriInvoke()` to user text (no stack traces).

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: add chip, dev banner, and error surfacing
- `tauri-app/src/lib/bridges/tauri.ts`: helper for `getBridgeOverride()` (already present)
- `tauri-app/src/lib/stores/ui.ts`: optional message store (if needed)

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [ ] Add `nativeMode` derived boolean and render chip near the Upload area
- [ ] Replace current bannerMessage paths with dev detection banner (DEV only, one‑time per session)
- [ ] Add `try/catch` mapping around analyze flow to set user‑friendly error text for `TauriComputeError` codes
- [ ] Ensure drag/drop disabled text matches Figma copy
- [ ] Verify dev logs show detection info + selected bridges once
- [ ] Build and manual smoke (dev + packaged)

### Acceptance Criteria
**Scenario:** First run in Tauri dev
**GIVEN** the app runs via `npm run tauri dev`
**WHEN** a user clicks Upload the first time
**THEN** a detection banner appears with env + selected bridges + override status
**AND** a “Native mode” chip is shown while native path is active

**Scenario:** Invalid response from native compute
**GIVEN** `analyze_image` returns malformed payload
**WHEN** analysis begins
**THEN** user sees an actionable error message within 2 seconds (no silent hang)

**Scenario:** Drag/drop in native mode
**GIVEN** Tauri native mode is active
**WHEN** user drags a file over the UI
**THEN** a notice explains drag/drop is disabled in native mode; directs to Upload

### Issues Encountered 
{LOC|20}


## Implementation Notes

- Added native mode chip and static copy discouraging drag/drop.
- Introduced dev-only detection banner with override/bridge summary, logging once per session.
- Mapped TauriComputeError codes to user-facing messages and surfaced dialog failures via notice overlay.
- Spinner/error flows unchanged; analysis overlay now receives friendly text.

## Validation

- npm run lint
- npm run build
- Dev stub verification pending (manual).
