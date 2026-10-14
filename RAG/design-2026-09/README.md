# September UI design references

Status: review candidates, 2026-09-05. No production implementation or owner acceptance is implied.

Authority: [PROJECT-RECORD rev 0.5](../PROJECT-RECORD.md), especially §9. Tickets project that contract; these sketches illustrate it. [Coverage and waves](coverage-and-waves.md) names remaining decisions and integration gates. The July bundle remains historical evidence, not a requirement for folded-paper chrome.

## Walkthroughs

The reviewed references are preserved byte-for-byte in the durable repository
carrier at [`../design-system/2026-09/`](../design-system/2026-09/). They are
conversation fragments, not production app pages. The original task-owned
source paths and hashes remain in `reference-sha256.txt`; the carrier has a
separate relative-path checksum list. None belongs in `App.svelte` or a
production network dependency.

| Reference                                                                                                                                                   | Use and limitations                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ui-surface-walkthrough.html](../design-system/2026-09/ui-surface-walkthrough.html)                                                                         | New 20-state export/settings/management/batch close-up; illustrative data, simulated saving, proposed confirmation treatments.                                                                                          |
| [user-storyboard.html](../design-system/2026-09/user-storyboard.html) / [user-storyboard-register.md](../design-system/2026-09/user-storyboard-register.md) | Earlier 34-frame lifecycle map, with explicit unresolved branch variants. New walkthrough extends it; does not retroactively approve its proposals.                                                                     |
| [app-layout-studies.html](../design-system/2026-09/app-layout-studies.html)                                                                                 | Three arrangements over the same study; named icon positions are placeholders.                                                                                                                                          |
| [media-collection-flow.html](../design-system/2026-09/media-collection-flow.html)                                                                           | Compact strip, full collection, select-and-return interaction sketch.                                                                                                                                                   |
| [oklab-gamut-volume.html](../design-system/2026-09/oklab-gamut-volume.html)                                                                                 | Actual sRGB-in-OKLab shape and camera exploration reference. The preserved prototype still needs its pinned CDN modules; this is not approval for a production network dependency or a claim of an offline 3D fallback. |
| [third-primitive-flows.html](../design-system/2026-09/third-primitive-flows.html)                                                                           | Historical inline/expanded interaction exploration. Its placeholder geometry is NOT the normative gamut shape.                                                                                                          |
| [color-studies.html](../design-system/2026-09/color-studies.html)                                                                                           | Early editorial/palette aesthetic exploration, not a requirement to retain every decorative pattern.                                                                                                                    |

Original IMP-168–177 and epic text are preserved in `../reviews/EPIC-027/legacy-2026-07-09/`. Do not overwrite that archive. Source/configuration identity, retained export inputs, and native ownership follow accepted EPIC-029 rulings even where a drawing omits them.

## Source evidence

Current source was inspected at main `5baa20e021855fbc57aebf48fa0f9b3374ded281`: ExportsView.svelte, SettingsView.svelte, MediaBucket.svelte, BatchView.svelte, existing export generators/runners, preferences and image/pin stores. This is source confirmation, not a newly executed live Tauri session.

Existing export controls and formats are retained. The existing palette SVG prints RGB/count/share, but not a HEX label; the underlying CSV already includes HEX/OKLab/OKLCH. New work adds shared visible labels and a raster 3D capture, not additional data export formats.

Reference checksums are recorded in `reference-sha256.txt`. They pin the reviewed visual inputs, not production assets. A changed sketch needs a new checksum and a recorded design amendment before it changes an active assignment.
