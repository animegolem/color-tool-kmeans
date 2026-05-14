---
node_id: LOG-2025-10-09-EPIC6-REACTIVITY
tags:
  - AI-log
  - tauri
  - bridge-architecture
  - epic-006
  - runtime-debug
created_date: 2025-10-09
related_files:
  - tauri-app/src/lib/views/HomeView.svelte
  - tauri-app/src/lib/stores/ui.ts
  - tauri-app/src/lib/bridges/compute.ts
  - tauri-app/src/lib/bridges/fs.ts
  - tauri-app/src/lib/compute/bridge.ts
confidence_score: 0.9
---

# 2025-10-09-LOG-AI-epic6-tauri-bridge-reactivity

## Summary
- Verified native Tauri bridge path after async-ready refactor; Upload now selects `tauri-native` and returns analysis results.
- Root cause of "silent UI" regression traced to HomeView deriving store values with `get()` at module scope, blocking reactivity.
- Patched HomeView to subscribe to stores directly; UI now surfaces selected file banner and cluster list when native analysis completes.

## Key Events

- Added comprehensive [tauri-invoke] diagnostics per AI-IMP-060, logging each fallback path and including command names in failure messages.
- Implemented AI-IMP-061 response validation: Tauri compute bridge now wraps invoke failures, normalizes camel/snake fields, and raises `TauriComputeError` when payloads are malformed (FR-7).

- Began AI-IMP-062: HomeView now shows Native mode badge, dev detection banner, and maps native analysis errors to actionable messaging.
- Migrated tauri-app to ESLint flat config with browser globals and pruned generated JS from lint scope; `npm run lint` now passes.
- Raised LOC warning guard to 400 lines (manual override via LOC_BYPASS=1 or [loc-bypass]).
1. Added diagnostic logging across bridges and HomeView to confirm bridge readiness and analysis execution sequence.
2. Observed `setAnalysisSuccess` firing without UI updates, indicating renderer reactivity issue rather than bridge failure.
3. Replaced `$derived.by(() => get(store))` usage with explicit store subscriptions updating local `$state` fields; reactivity restored without altering business logic.
4. Confirmed native run renders cluster preview in dev build; browser build remains functional.

## Outstanding Items
- Spinner overlay currently gated by `spinnerVisible`; consider tuning thresholds for longer native runs.
- Diagnostic `console.info` statements remain for monitoring; revisit before release packaging.
- Image preview / polar graph outputs still omitted in native mode by design; plan follow-up when native dataset support lands.

## Next Steps
- Decide whether to keep explicit subscriptions or reintroduce Svelte `derived` helpers with a reactive pattern.
- Trim logging once native bridge stability is validated across more hosts.
- Update AI-IMP-059 checklist/AC to reflect restored native flow and remaining polish tasks.

