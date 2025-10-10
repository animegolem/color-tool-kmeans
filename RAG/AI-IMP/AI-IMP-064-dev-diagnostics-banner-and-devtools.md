---
node_id: AI-IMP-064
tags:
  - Implementation
  - tauri
  - diagnostics
kanban_status: backlog
depends_on:
  - ADR-002
  - AI-EPIC-006
confidence_score: 0.9
created_date: 2025-10-10
close_date:
---

## Dev Diagnostics: Detection Banner, Force‑Override Warning, DevTools Hotkey

Current issue: In dev, it’s not always obvious which bridge was selected or whether `bridge.force` is active. Accessing DevTools should be reliable via a hotkey.

Measurable outcome: On first file open and first analysis (dev only), the app shows a small banner with `tauriDetectionInfo()`, selected bridges, and force‑override status. It also logs a concise summary once. DevTools opens via a documented hotkey.

### Out of Scope
- User‑facing error copy (see AI‑IMP‑062)
- Packaging env changes

### Design/Approach  
- Add a small `DevBanner` component gated by `import.meta.env.DEV`.
- Log a one‑liner with detection info and selected bridges at first invoke.
- Bind a hotkey (e.g., F12 / Ctrl+Shift+I) to toggle DevTools via Tauri command.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte` (or a new banner component)
- `tauri-app/src/lib/bridges/tauri.ts` (reuse `tauriDetectionInfo()`)
- `tauri-app/src-tauri/src/main.rs` (webview devtools toggle command if needed)

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE>
- [ ] Implement `DevBanner` and gate by `import.meta.env.DEV`
- [ ] One‑time banner on first file open and first analysis in dev
- [ ] One‑time console summary with detection + selected bridges + override
- [ ] Add DevTools toggle hotkey; ensure permission is configured
- [ ] Smoke test dev + packaged (banner hidden in packaged)

### Acceptance Criteria
**Scenario:** Dev banner shows once
**GIVEN** dev build
**WHEN** first file is opened or first analysis runs
**THEN** banner appears once with detection summary (dismissible)

**Scenario:** DevTools hotkey
**GIVEN** dev build running
**WHEN** user presses the hotkey
**THEN** DevTools open reliably (or toggle)

### Issues Encountered 
{LOC|20}

