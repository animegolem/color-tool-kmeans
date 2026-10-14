---
node_id: AI-IMP-*
tags:
  - IMP-LIST
  - Implementation
  - Browser
  - Files
  - Preferences
  - Epic-029
kanban_status: planned
depends_on: [AI-EPIC-029]
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.88
date_created: 2026-10-14
date_completed:
draft_key: F1a
---

# DRAFT F1a — browser file and preference capability

The Review Lead assigns the final AI-IMP number. This draft is not an
implementation fence.

## Retain honest browser file authority and durable preferences

The browser can currently decode a dropped `File` for preview, but it fabricates
the filename as a path, discards the source Blob from the stored entry, has no
browse adapter, and silently falls back when Tauri Store writes fail. Add a
one-still browser picker and retain the Blob as the encoded source. Put Tauri
Store and localStorage behind one versioned `PrefsV1` contract, with UI-visible
persistence failures.

Done means browse and drop produce a Blob-backed still with no path, native
path behavior remains unchanged, browser preferences survive reload under
`color-tool.preferences.v1`, and load/save/reset failures are accessible in the
UI rather than console-only.

### Out of Scope

- Worker/WASM compute, response parity, or compute target selection (F1b/F1c).
- Multiple browser files, browser video, directory handles, save/download, or
  clipboard ingestion.
- Public hosting, service worker, CSP, Tauri loading, or redesign composition.
- New npm/Rust packages, package scripts, lockfile changes, or generated index.

### Design/Approach

Follow `f1-shared-runtime-design.md` §§1 and 5. Change `ImageSource` to retain a
real Blob for browser entries and remove every browser filename-to-path
fallback. `FsBridge` gains a `browser-file` adapter that creates an image-only,
single-selection `<input type="file">`; its save methods return a typed
unavailable error until F7. Keep native dialog and path behavior unchanged.

Extract the shared `PrefsV1` defaults and merge/version logic, then implement
`tauri-store` and `browser-local-storage` adapters. Missing/unversioned legacy
data migrates to v1; explicit unknown versions and invalid storage fail
honestly. The store facade persists full merged objects. A global accessible
preference-status surface reports load/save/reset failure and clears only after
a later successful operation or explicit dismissal.

### Files to Touch

- `tauri-app/src/lib/bridges/fs.ts`: add one-image browser picker, widen bridge
  ID, and keep browser selections pathless.
- `tauri-app/src/lib/bridges/fs.spec.ts` (new): picker/cancel/filter/pathless and
  unavailable-save contract tests.
- `tauri-app/src/lib/preferences/schema.ts` (new): `PrefsV1`, defaults,
  version/migration, and merge logic.
- `tauri-app/src/lib/bridges/preferences.ts` (new): Tauri Store/localStorage
  adapters and typed failures.
- `tauri-app/src/lib/bridges/preferences.spec.ts` (new): adapter, corruption,
  version, denial, and readback tests.
- `tauri-app/src/lib/stores/prefs.ts`: compatibility facade over the selected
  adapter; stop swallowing failures.
- `tauri-app/src/lib/stores/prefs.spec.ts` (new): full-object merge/save/reset
  behavior.
- `tauri-app/src/lib/stores/preferences.ts`: catch subscription writes and own
  the accessible persistence-error store.
- `tauri-app/src/lib/stores/image.ts`: retain Blob source while preserving path
  deduplication and URL cleanup.
- `tauri-app/src/lib/services/media-ingestion.ts`: create honest path/blob
  entries without conflating Blob and object-URL ownership.
- `tauri-app/src/lib/services/media-ingestion.spec.ts` (new): native path,
  browser Blob, and preview cleanup cases.
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: remove fake paths,
  reject browser video before ingestion, and keep one-still behavior.
- `tauri-app/src/lib/components/PreferenceStatus.svelte` (new): accessible,
  dismissible persistence warning.
- `tauri-app/src/lib/components/PreferenceStatus.spec.ts` (new): SSR structure
  and state/action contract.
- `tauri-app/src/lib/views/SettingsView.svelte`: reset failure/success feedback;
  target-only directory treatment is completed by F1c.
- `tauri-app/src/App.svelte`: mount the shared persistence-warning surface.
- `tauri-app/src/main.ts`: hydrate through the adapter without an empty catch.
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`: preserve
  native path/source and Blob lifetime/request ownership regressions.

`tauri-app/package.json`, `tauri-app/package-lock.json`, every Cargo manifest,
and all files not listed above are forbidden. No dependency or lock change is
authorized.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Move `PrefsV1`, defaults, and merge/version behavior to the pure schema
      module without changing accepted v1 values.
- [ ] Add injected, unit-testable Tauri Store and localStorage preference
      adapters using the same full-object v1 schema.
- [ ] Treat missing/unversioned legacy preferences as v1 migration and reject
      invalid JSON or explicit unsupported versions.
- [ ] Make save/reset reject on storage failure or failed readback; preserve the
      underlying cause in a typed error without exposing stored data.
- [ ] Catch load/save/reset failures in the store layer, show defaults after a
      load failure, and publish the accessible persistence warning.
- [ ] Verify subscription write-back has no unhandled rejection and a later
      successful operation clears only the matching warning.
- [ ] Add the single-image browser file-input adapter with image MIME/extensions,
      cancel handling, and no native path.
- [ ] Retain the source Blob in `ImageEntry`; keep `ImageDataset` and object URL
      ownership separate.
- [ ] Remove the browser drop fallback that writes `File.name` into `path`.
- [ ] Reject browser video/multiple-file input honestly before unsupported work;
      do not weaken native multi-file/video behavior.
- [ ] Preserve native path deduplication, active-path assignment, preview URLs,
      and resource cleanup.
- [ ] Add focused adapter/schema/ingestion/component tests and extend the
      existing race suite for Blob lifetime and stale load rejection.
- [ ] Run every AGENTS.md frontend and Rust gate, scalar snapshot, core boundary,
      RAG generator review, and the real staged hook; record counts and warnings.
- [ ] Verify `package.json`, npm lock, Cargo manifests, and generated INDEX stay
      byte-identical.

### Acceptance Criteria

**Scenario: Browser browse/drop has honest source authority**  
**GIVEN** a normal browser target and one supported still  
**WHEN** it is chosen or dropped  
**THEN** the entry retains that `File` as `{ kind: 'blob', blob }`  
**AND** `path` and native active-path authority remain absent  
**AND** preview decoding and object-URL cleanup still work.

**Scenario: Native file behavior is preserved**  
**GIVEN** a Tauri target and native selections  
**WHEN** one or more current supported files are chosen  
**THEN** real paths, deduplication, active-path selection, and video behavior
match the pre-ticket tests.

**Scenario: Browser preferences are durable and honest**  
**GIVEN** localStorage is available  
**WHEN** an approved setting changes and the page reloads  
**THEN** the same v1 schema restores the value  
**AND** `exportDir` remains `null` in browser storage.

**Scenario: Persistence fails**  
**GIVEN** corrupt, unsupported-version, denied, quota-exceeded, or failed
readback storage  
**WHEN** load/save/reset runs  
**THEN** defaults or prior in-memory state remain usable as appropriate  
**AND** an accessible UI warning names the failed operation  
**AND** no promise rejection is swallowed or left unhandled.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

None yet; implementation has not begun.
