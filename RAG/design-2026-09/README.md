# September UI design references

Status: review candidates, 2026-09-05. No production implementation or owner acceptance is implied.

Authority: [PROJECT-RECORD rev 0.5](../PROJECT-RECORD.md), especially §9. Tickets project that contract; these sketches illustrate it. [Coverage and waves](coverage-and-waves.md) names remaining decisions and integration gates. The July bundle remains historical evidence, not a requirement for folded-paper chrome.

## Walkthroughs

The editable references remain in the durable task-owned visualization directory below; they are conversation fragments, not production app pages. AI-IMP-168 will preserve searchable design provenance after review. None belongs in App.svelte or a production network dependency.

Reference directory: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671`

| Reference | Use and limitations |
| --- | --- |
| ui-surface-walkthrough.html | New 20-state export/settings/management/batch close-up; illustrative data, simulated saving, proposed confirmation treatments. |
| user-storyboard.html / user-storyboard-register.md | Earlier 34-frame lifecycle map, with explicit unresolved branch variants. New walkthrough extends it; does not retroactively approve its proposals. |
| app-layout-studies.html | Three arrangements over the same study; named icon positions are placeholders. |
| media-collection-flow.html | Compact strip, full collection, select-and-return interaction sketch. |
| oklab-gamut-volume.html | Actual sRGB-in-OKLab shape and camera exploration reference. Prototype CDN use is not approved in the offline desktop app. |
| third-primitive-flows.html | Historical inline/expanded interaction exploration. Its placeholder geometry is NOT the normative gamut shape. |
| color-studies.html | Early editorial/palette aesthetic exploration, not a requirement to retain every decorative pattern. |

Original IMP-168–177 and epic text are preserved in `../reviews/EPIC-027/legacy-2026-07-09/`. Do not overwrite that archive. Source/configuration identity, retained export inputs, and native ownership follow accepted EPIC-029 rulings even where a drawing omits them.

## Source evidence

Current source was inspected at main `5baa20e021855fbc57aebf48fa0f9b3374ded281`: ExportsView.svelte, SettingsView.svelte, MediaBucket.svelte, BatchView.svelte, existing export generators/runners, preferences and image/pin stores. This is source confirmation, not a newly executed live Tauri session.

Existing export controls and formats are retained. The existing palette SVG prints RGB/count/share, but not a HEX label; the underlying CSV already includes HEX/OKLab/OKLCH. New work adds shared visible labels and a raster 3D capture, not additional data export formats.

Reference checksums are recorded in `reference-sha256.txt`. They pin the reviewed visual inputs, not production assets. A changed sketch needs a new checksum and a recorded design amendment before it changes an active assignment.
