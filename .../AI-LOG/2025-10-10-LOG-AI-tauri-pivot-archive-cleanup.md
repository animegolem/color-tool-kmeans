---
node_id: LOG-2025-10-10-EPIC6-PIVOT-CLEANUP
tags:
  - AI-log
  - tauri
  - repo-cleanup
  - architecture
closed_tickets: []
created_date: 2025-10-10
related_files:
  - archive/
  - tauri-app/src/lib/bridges/compute.ts
  - tauri-app/src/lib/bridges/fs.ts
  - README.md
  - .github/workflows/ci.yml
  - RAG/ADR/ADR-002-tauri-pivot.md
confidence_score: 0.9
---

# 2025-10-10-LOG-AI-tauri-pivot-archive-cleanup

## Work Completed
- Archived legacy shells and demo paths to align with Tauri-only direction (ADR-002).
- Removed Electron fallbacks from FS/Compute bridges; code paths now prefer Tauri and, for FS only, browser fallback remains for demos.
- Archived compute-wasm and cut renderer references; Vite build no longer warns about runtime-resolved WASM.
- Archived `electron-app/` and removed Electron build workflow from CI. Updated README to reflect new structure.

## Session Commits
- Moved `electron-app/` to `archive/` and dropped from index; removed `.github/workflows/electron-build.yml`.
- Removed `compute-wasm` from index; deleted renderer `wasm.ts/js` and references.
- Simplified bridges: dropped Electron branches; kept browser FS fallback; WASM compute now throws if accidentally selected.
- README repo structure updated; added `archive/README.md`.

## Issues Encountered
- Some generated JS under `src/lib` can drift from TS. ESLint is configured to ignore `**/*.js`, and builds rely on TS, so no action needed now.
- If remote size matters, recommend history rewrite to delete `electron-app` blobs (git filter-repo/BFG) before sharing widely.

## Tests Added
- None (refactor/cleanup). Verified `npm run lint` and `npm run build` in `tauri-app/`.

## Next Steps
- Implement AI-IMP-063 (Rust path validation + dialog Result) and AI-IMP-064 (dev banner + hotkey).
- Optionally remove WASM compute bridge entirely (currently throws) to further reduce branches.
