---
node_id: AI-IMP-150
tags:
  - IMP-LIST
  - Implementation
  - performance
  - media-bucket
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed:
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

### Files to Touch

- `src/lib/components/MediaBucket.svelte`: thumbnail rendering and lifecycle
- Image store or URL management layer: cache blob URLs

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Profile current behavior: identify why thumbnails reload on expand
- [ ] Determine root cause (DOM remount, blob URL revocation, or re-decode)
- [ ] Implement caching fix (keep mounted, cache URLs, or prevent re-decode)
- [ ] Verify no memory leaks from cached blob URLs
- [ ] Test with 10+ images: expand/collapse cycle should be near-instant
- [ ] `npm run check && npm run lint`

### Acceptance Criteria

**Scenario:** Instant sidebar expansion
**GIVEN** the media bucket contains 5+ images and the sidebar is collapsed.
**WHEN** the user expands the sidebar.
**THEN** all thumbnails appear immediately without visible loading flash.

### Issues Encountered

<!--
This section is filled out post work.
-->
