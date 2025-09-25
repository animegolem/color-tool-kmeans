---
node_id: AI-IMP-043
tags:
  - IMP-LIST
  - Implementation
  - Wasm
  - Renderer
  - Svelte
  - Epic-004
kanban_status: planned
depends_on: [AI-IMP-041, AI-IMP-042]
confidence_score: 0.86
created_date: 2025-09-25
close_date:
---

# AI-IMP-043-renderer-bridge-to-wasm

## Summary of Issue #1
Replace the Tauri IPC path with a wasm bridge in the renderer. Keep the existing Svelte 5 stores/views; only the `analyze_image` invocation point changes. Done when selecting/dropping an image triggers the wasm compute and the UI renders clusters with the same contract as before.

### Out of Scope
- Electron packaging and CI (042/045).
- Export implementations (044).

### Design/Approach
- Create `src/lib/compute/bridge.ts` that lazy‑loads the wasm module and exposes `analyzeImage`.
- Wire `HomeView` to call the bridge; preserve spinner threshold and error overlays.
- Keep mock path for pure browser dev (`isElectron`/feature flag).

### Files to Touch
- `tauri-app/src/lib/compute/bridge.ts` (new) or equivalent in the renderer root.
- `tauri-app/src/lib/tauri.ts` (retire/remove Tauri‑specific dialog usage where not needed).
- `tauri-app/src/lib/views/HomeView.svelte`: swap invocation to bridge.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add bridge that imports the wasm module and exposes `analyzeImage`.
- [ ] Update `HomeView` to call the bridge; keep debounce/spinner/error flows.
- [ ] Verify payload and result shapes; maintain camelCase contract.
- [ ] Manual smoke with the same bench images; log duration/iterations in dev console.
- [ ] Remove/guard Tauri API imports from the renderer (dialog path optional via Electron preload).

### Acceptance Criteria
**Scenario:** Renderer computes via wasm bridge
GIVEN the wasm bundle is built
WHEN a user opens an image in the Electron app
THEN the wasm bridge returns clusters and the UI renders previews
AND the spinner threshold and error handling behave as before.

### Issues Encountered
{LOC|20}

