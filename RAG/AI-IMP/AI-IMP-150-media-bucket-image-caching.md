---
node_id: AI-IMP-150
tags:
  - IMP-LIST
  - Implementation
  - performance
  - media-bucket
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed: 2026-06-19
---

# AI-IMP-150-media-bucket-image-caching

## Media bucket sidebar image caching

When the media bucket sidebar is collapsed and re-expanded, thumbnail images appear to reload from scratch — visible as a flash of empty slots before images render. This suggests thumbnails are being recreated or re-decoded on each mount rather than cached. For buckets with many images, this creates a sluggish feel. Thumbnails should be cached so that expanding the sidebar is near-instant.

### Out of Scope

- Lazy loading of thumbnails (load on scroll).
- Thumbnail resolution/quality changes.
- Persistent disk-based cache across app restarts.

### Design/Approach

Investigate whether the reload is caused by DOM remounting (component destroyed on collapse), blob URL revocation, or missing image caching. If the component is destroyed, consider keeping it mounted but hidden (`display: none` or `visibility: hidden`). If blob URLs are revoked, maintain a URL cache keyed by image ID that persists across mount cycles. Profile with 10+ images to confirm the fix eliminates the flash.

**Premise correction (2026-06-09 code review):** MediaBucket is already kept mounted — the rail collapses via `visibility: hidden` (`.library-rail--hidden`, `app.css`), not an `{#if}` block, so `<img>` elements persist across collapse/expand. The "component destroyed" hypothesis is ruled out. If the flash reproduces, the likely cause is WebKit discarding decoded bitmaps for hidden subtrees and re-decoding on reveal (markedly worse on Linux WebKitGTK than macOS WKWebView). This ticket is repro-first: timebox an attempt to reproduce on the target platform with 10+ images before committing to any fix. Acceptable outcomes include close-as-cannot-reproduce (macOS) or documenting it as a Linux-specific limitation, consistent with Linux being deprioritized for v1.

### Files to Touch

- `src/lib/components/MediaBucket.svelte`: thumbnail rendering and lifecycle
- Image store or URL management layer: cache blob URLs

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Profile current behavior: identify why thumbnails reload on expand — MediaBucket stays mounted (visibility:hidden), `<img>` elements persist
- [x] Determine root cause (DOM remount, blob URL revocation, or re-decode) — no remount; no reload flash reproducible on macOS
- [x] Implement caching fix (keep mounted, cache URLs, or prevent re-decode) — N/A, already satisfied by mounted architecture
- [x] Verify no memory leaks from cached blob URLs — N/A
- [x] Test with 10+ images: expand/collapse cycle should be near-instant — user confirmed no issue (2026-06-19)
- [x] `npm run check && npm run lint` — N/A, no code change

### Acceptance Criteria

**Scenario:** Instant sidebar expansion
**GIVEN** the media bucket contains 5+ images and the sidebar is collapsed.
**WHEN** the user expands the sidebar.
**THEN** all thumbnails appear immediately without visible loading flash.

### Issues Encountered

**Closed as cannot-reproduce (2026-06-19).** The ticket premise (component destroyed on collapse → thumbnails re-decode) is wrong: the library rail collapses via `visibility: hidden` (`.library-rail--hidden` in `app.css`), not an `{#if}`, so MediaBucket remains mounted and its `<img>` elements persist across collapse/expand cycles. No reload flash is reproducible on macOS, confirmed by the user during the EPIC-024 wrap. FR-7 (thumbnails cached / no repeated loading) is satisfied by the existing mounted architecture. If a flash ever surfaces on Linux WebKitGTK (decoded-bitmap discard for hidden subtrees), revisit as a platform-specific follow-up — but Linux is deprioritized for v1.
