---
node_id: AI-IMP-093
tags:
  - IMP-LIST
  - Implementation
  - kmeans
  - merge
  - oklab
  - stability
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-019-polar-field-and-merge-stability]]
confidence_score: 0.58
date_created: 2026-02-02
date_completed: 2026-02-02
---

# AI-IMP-093-merge-threshold-stability

## Replace chaining merge with stability-preserving merge
Current merge logic uses single-linkage union-find, which chains clusters together (A~B, B~C) and collapses large sets at small thresholds. We need a merge approach that prevents transitive gobbling while preserving threshold intent. Done when applying a small threshold no longer collapses large k (e.g., 2k) cluster sets on the test pattern.

### Out of Scope
- UI changes beyond the existing merge threshold control.
- New merge UI parameters (e.g., DBSCAN minPts) unless required for correctness.

### Design/Approach
- Implement a complete-linkage style guard using centroid distance plus cluster radius.
- Track a per-cluster radius (max distance from centroid) and only merge when `d(centroidA, centroidB) + rA + rB <= threshold`.
- Merge groups using weighted centroids; update radius based on merged children.
- Keep deterministic iteration order and stable sorting to preserve reproducibility.

### Files to Touch
- `tauri-app/src-tauri/src/main.rs`: replace `merge_clusters_by_threshold` implementation.
- `tauri-app/src-tauri/src/kmeans.rs` (optional): shared math helpers if needed.
- `tauri-app/src-tauri/tests/kmeans_snapshots.rs` (optional): add a regression case if feasible.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Implement radius-guarded merge in `merge_clusters_by_threshold`.
- [ ] Ensure deterministic ordering: stable iteration + stable sorting on counts.
- [ ] Add/update a regression test or manual validation note for 2k cluster collapse.
- [ ] Run `cargo fmt` and `cargo clippy` on `tauri-app/src-tauri`.

### Acceptance Criteria
**Scenario:** Large-k merge stability.
**GIVEN** 2k clusters and a small merge threshold (e.g., 0.01).
**WHEN** merge threshold is applied.
**THEN** clusters do not collapse into a single dominant cluster.

### Issues Encountered
- Transitive chaining in single-linkage merge caused collapse; replaced with radius-guarded merge.
