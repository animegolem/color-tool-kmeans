---
node_id: AI-IMP-046
tags:
  - IMP-LIST
  - Implementation
  - Benchmark
  - Wasm
  - Epic-004
kanban_status: planned
depends_on: [AI-IMP-041]
confidence_score: 0.8
created_date: 2025-09-25
close_date:
---

# AI-IMP-046-bench-wasm-variant

## Summary of Issue #1
Add a minimal bench to compare wasm compute vs native on small fixtures to monitor performance and parity during the pivot. Done when a script runs both paths and prints durations and ΔE stats to console/JSON.

### Out of Scope
- Full suite; this is a quick parity/latency sanity check.

### Design/Approach
- Reuse the bench assets and sample generator; run wasm in a headless environment (Node + jsdom if needed) and native via the existing harness.
- Output JSON with durations, iterations, and basic ΔE stats.

### Files to Touch
- `scripts/bench/wasm-bench.mjs` (new).
- Small additions to `bench-reports/README.md`.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Implement wasm bench runner; load the module and run on sample datasets.
- [ ] Compare against native JSON outputs for ΔE and iterations.
- [ ] Log a short markdown summary.

### Acceptance Criteria
**Scenario:** Wasm vs native summary appears
GIVEN wasm and native builds are available
WHEN the script runs
THEN it prints duration comparison and parity metrics and writes a JSON file under `bench-reports/`.

### Issues Encountered
{LOC|20}

