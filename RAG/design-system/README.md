# Color Tool design reference carrier

This directory preserves reviewed design evidence as searchable repository
files. It is reference material, not a production asset bundle and not a second
source of product decisions. The normative contract remains
[`RAG/PROJECT-RECORD.md`](../PROJECT-RECORD.md), with ticket projections under
`RAG/AI-IMP/`.

[`2026-09/`](2026-09/) contains the eight September study-interface references
accepted as the current visual evidence set. They were copied byte-for-byte from
the task-owned visualization source recorded in
[`RAG/design-2026-09/reference-sha256.txt`](../design-2026-09/reference-sha256.txt).
The source-input list retains the original paths; the dated carrier's
[`reference-sha256.txt`](2026-09/reference-sha256.txt) verifies the durable
copies by relative filename.

The files are conversation fragments and walkthroughs, not production app
pages. [`RAG/design-2026-09/`](../design-2026-09/) explains how the references
map to tickets, lifecycle coverage, and remaining decisions. The original
zip/Figma carriers remain unchanged in `RAG/`; nothing here replaces or deletes
them.

Source carrier:
`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671`.
The seven original walkthroughs/register files were last modified on
2026-09-04 CDT; `ui-surface-walkthrough.html` was last modified on 2026-09-05
CDT. The exact bytes, rather than filesystem timestamps, are bound by the two
checksum lists.

## Inventory

| Reference                                                            | What it preserves                                           | Offline status                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ui-surface-walkthrough.html`](2026-09/ui-surface-walkthrough.html) | Export, Settings, collection-management and Batch close-ups | Inspectable offline                                                                                                                                                                                             |
| [`user-storyboard.html`](2026-09/user-storyboard.html)               | Earlier lifecycle storyboard                                | Inspectable offline                                                                                                                                                                                             |
| [`user-storyboard-register.md`](2026-09/user-storyboard-register.md) | Storyboard state register and unresolved variants           | Inspectable offline                                                                                                                                                                                             |
| [`app-layout-studies.html`](2026-09/app-layout-studies.html)         | Three arrangements of one study                             | Inspectable offline                                                                                                                                                                                             |
| [`media-collection-flow.html`](2026-09/media-collection-flow.html)   | Compact collection, full browser and select/return sketch   | Inspectable offline                                                                                                                                                                                             |
| [`third-primitive-flows.html`](2026-09/third-primitive-flows.html)   | Historical inline/expanded third-primitive exploration      | Inspectable offline; placeholder geometry is not the normative gamut                                                                                                                                            |
| [`color-studies.html`](2026-09/color-studies.html)                   | Early editorial and palette exploration                     | Inspectable offline                                                                                                                                                                                             |
| [`oklab-gamut-volume.html`](2026-09/oklab-gamut-volume.html)         | True sRGB-in-OKLab interaction prototype                    | Preserved network-dependent prototype: it imports pinned Three.js modules from `esm.sh` and shows its own failure notice when they cannot load. It is not the offline production implementation or 2D fallback. |

The seven non-3D references have no runtime network imports. SVG namespace
strings and source-attribution URLs are not runtime fetches. The 3D prototype's
offline dependency and visible failure path are intentionally preserved rather
than rewritten. Offline Three.js vendoring and a real 2D fallback belong to
AI-IMP-197.

No standalone license record accompanies these project design fragments. The
3D prototype's references to external Three.js modules are preserved evidence,
not dependency or license admission. The separate vendored-font inventory and
its missing in-repository license evidence are recorded in
`tauri-app/src/assets/fonts/README.md`. No asset or dependency was downloaded for
this carrier.

## Verification

From `RAG/design-system/2026-09/`:

```sh
shasum -a 256 -c reference-sha256.txt
```

Expected result: 8/8 files report `OK`. Any edited walkthrough requires a new
dated carrier and recorded design amendment; do not change these pinned copies
in place. Generated wrappers or production assets, if ever approved, must live
at a separately declared path and must not replace these copies.
