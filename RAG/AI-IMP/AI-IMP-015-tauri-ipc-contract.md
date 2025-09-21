---
node_id: AI-IMP-015
tags:
  - IMP-LIST
  - Implementation
  - Tauri
  - IPC
  - API
kanban_status: planned
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot, AI-IMP-011, AI-IMP-012, AI-IMP-014]
confidence_score: 0.86
created_date: 2025-09-21
close_date:
--- 

# AI-IMP-015-tauri-ipc-contract

## Summary of Issue #1
Define and implement a stable IPC between Svelte UI and Rust core. Outcome: Tauri commands `analyze_image`, `export_composite` (stub), with JSON schemas and error mapping. The UI can call `analyze_image` with parameters and receive clusters, iterations, and timing.

### Out of Scope 
- Composite export final rendering (separate IMP-017/018);
- Packaging.

### Design/Approach  
- Define request/response structs with `serde` and `ts-rs` (generate TS types for Svelte). Validate inputs server‑side.
- Map Rust errors to friendly UI messages; ensure commands are async and cancel‑safe (debounce in UI).
- Include a small sample cache keyed by (file, K, stride, minLum, space) to enable warm‑starts.

### Files to Touch
- `src-tauri/src/main.rs` (register commands).
- `src-tauri/src/api.rs` (request/response types, validation).
- `src/lib/api.ts` (generated types, thin wrappers).
- `src/lib/stores/ui.ts` (wire compute call & cancellation debounce).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Define `AnalyzeParams` and `Cluster` types (Rust + TS) with serde/ts-rs.
- [ ] Implement `analyze_image(params)` command: decode→sample→colorspace→k‑means; return clusters + meta.
- [ ] Add warm‑start cache in core keyed by compatible params.
- [ ] Add input validation + descriptive error messages.
- [ ] Svelte client: call command; render counts; disable controls during compute; cancel old requests (debounce).
- [ ] Dev smoke test across Linux/Windows images.

### Acceptance Criteria
**Scenario: Compute via IPC**
GIVEN the app is running with an image selected
WHEN the UI calls `analyze_image` with K, stride, minLum, space
THEN a response arrives within budget, and charts update from returned clusters without blocking the UI.

### Issues Encountered 
To be filled during implementation.

