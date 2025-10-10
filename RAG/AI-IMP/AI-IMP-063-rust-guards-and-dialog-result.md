---
node_id: AI-IMP-063
tags:
  - Implementation
  - tauri
  - rust
  - reliability
kanban_status: backlog
depends_on:
  - ADR-002
  - AI-EPIC-006
confidence_score: 0.82
created_date: 2025-10-10
close_date:
---

## Rust Guardrails: Path Validation and Dialog Result

Current issue: Native compute assumes file path validity; `open_image_dialog` uses `Option<String>`, conflating cancel vs. failure. We need typed errors and preflight checks.

Measurable outcome: `analyze_image` validates `req.path` via `std::fs::metadata()` and returns a typed `Err(String)` on unreadable/missing paths. `open_image_dialog` returns `Result<Option<String>, String>` to distinguish dialog failure from user cancel.

### Out of Scope 
- UI error copy/placement (AI‑IMP‑062)
- Packaging env tweaks (separate NFR ticket)

### Design/Approach  
- Add early `metadata(path)` + `is_file()` check; map IO errors to concise strings ("File not found", "Permission denied", etc.).
- Update `open_image_dialog` signature and map plugin callback errors to `Err(String)`; user cancel remains `Ok(None)`.
- Update TypeScript invoke sites only where type expectations change (bridge stays the same: `tauriInvoke('open_image_dialog')`).

### Files to Touch
- `tauri-app/src-tauri/src/main.rs`: update command signatures and guard code
- `tauri-app/src/lib/bridges/fs.ts`: adapt to `Result<Option<String>, String>` if return envelope changes
- `tauri-app/src/lib/views/HomeView.svelte`: ensure error surfaced (with AI‑IMP‑062)

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE>
- [ ] `analyze_image`: preflight `metadata(path)` + `is_file()` with typed Errs
- [ ] `open_image_dialog`: return `Result<Option<String>, String>`
- [ ] Bridge handling: adjust fs bridge to accept new envelope
- [ ] Build + dev smoke; verify failure messages propagate

### Acceptance Criteria
**Scenario:** Missing path
**GIVEN** path does not exist
**WHEN** `analyze_image` is invoked
**THEN** command returns `Err("File not found")` within 200ms

**Scenario:** Dialog failure vs cancel
**GIVEN** the file dialog errors
**WHEN** `open_image_dialog` is invoked
**THEN** the command returns `Err(<reason>)`; user cancel returns `Ok(None)`

### Issues Encountered 
{LOC|20}

