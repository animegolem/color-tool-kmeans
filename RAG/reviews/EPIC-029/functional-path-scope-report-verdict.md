# Verdict: functional-path scope report ACCEPTED; F1 architecture ruled; F0 build fence issued

**Lead:** Genga (Genga-Opus-5), review lead · **Date:** 2026-10-14 · **Report:** `functional-path-scope-report.md` (Sol, on main
021c2fd) · **Under:** `functional-first-priority-verdict.md` (the owner: "we can just make the app work, then we can make it faster")

## 1. The map is accepted as written
The surface map (§1), the shared-runtime gap (§2), the one-still milestone and its seven acceptance points (§3), the F0–F9
slices and their guardrails (§4), the test map (§5) and the holds (§6) are adopted. Especially kept: "a visually redesigned
shell that still throws outside Tauri is not a usable shared-web milestone", "'Looks similar' is not parity", and the
WASM-is-a-lead-not-a-restoration warning. Nothing old-WASM (CIELAB, duplicated k-means) is revived by self-consistency.

## 2. F1 architecture: ruled
- **Compute:** browser analysis runs in a dedicated **Web Worker** through a **wasm-bindgen adapter over current `color-core`**,
  with a **non-Rayon browser feature** (sequential inside the worker). No server upload, no main-thread WASM.
- **The boundary is ENCODED BYTES.** The worker receives the file's encoded bytes and decodes with `color-core`'s own decoder,
  the same one the native path uses. That makes decode parity hold by construction and removes the report's decode-difference
  risk (§6) instead of classifying it. The canvas/blob path stays for the preview only. **Fallback:** if the F1 source design
  shows the decoder cannot build for wasm32 or its size is unreasonable, propose decoded RGBA with a decode-parity fixture, and
  the lead re-rules. Don't switch silently.
- **Parity:** one fixed still, seed and resolved parameters; the canonical result digest must match native. If target
  arithmetic forces a difference, the source design names the field and a numeric tolerance for the lead to approve. No
  tolerance is pre-granted.
- **Preferences:** a browser adapter over `localStorage` with the SAME versioned schema as the Tauri Store, so it's durable. Not
  session-only. Write failures surface in the UI; console-only warnings are not acceptance.
- **Files:** browser browse and drop return File/Blob identity and never a fabricated native path. One still in the first milestone.
  Browser save (Blob download) belongs to F7.
- **Target selection:** startup reports the chosen target, and the absence of Tauri is not an error. Target-only controls are
  hidden or honestly unavailable, never failing after interaction.
- **Real-browser harness:** **Playwright** is the default proposal, in its own ticket with explicit dependency/lockfile authority
  (npm@10 lock rule per CLAUDE.md). The source design may argue for another tool.
- Hosting, service worker/offline, Tauri remote vs bundled loading, CSP and update trust stay OUT of the first fence (§2, as
  the report says).

## 3. 171's coupling: the functional-first split
Functional-first means **a one-layout, current-label first Colors acceptance**. 171's first acceptance is amended to one
already-reviewed layout plus the current palette information. 196 (three layouts, UI-D3) and 199 (patch labels, UI-D4) stay
OPEN for the full contract and are not weakened; they become the completion of Colors, not its gate. **Which reviewed layout:**
Sol names it, with its design-bundle reference, in the F2 ticket draft; the lead confirms. The owner is asked only if the bundle
gives no defensible default.

## 4. Fences

**F0 build fence: ISSUED.** 168 → 169 → 195 on current main, one ticket and one commit each, in that order, in an isolated
candidate, under the accepted Round 01/02 conditions and the exact-`.svelte` SSR seam. Dormant foundation: no production
import and no runtime work in the shipping entry (verify that, as §4 F0 asks). Every AGENTS.md gate runs on each commit.
Return the candidate with per-ticket validation, regressions and rationale; the lead reviews and merges.

**F1: source design first (doc-only, may run beside F0; no file overlap).** One short design at
`reviews/EPIC-029/f1-shared-runtime-design.md` covering: the wasm crate layout and the non-Rayon feature boundary in
`color-core`; the worker message contract (request id/token, cancel, stale-result rejection through the existing request
boundary); the encoded-bytes decode check; the parity fixture and digest; the prefs adapter schema; the target-selection
seam; and the Playwright fence. **Plus three ticket DRAFTS from the mandatory template:** F1a browser file + preferences
capability; F1b worker/WASM current-core compute + parity; F1c target selection + real-browser harness. Each names exact
files and package/lock authority. The lead mints the numbers and issues the F1 build fence from the accepted design.

**F2** is issued only after F0 and F1 are accepted, and requires the same-still browser/Tauri proof plus the cheap
responsiveness alarm (heartbeat/RAF while compute is pending; a generous hang timeout, not a benchmark).

**Unchanged:** 188 and 185 → 184 → 186 keep their own correctness order before F3/F4/F6/F7. IMP-193-5 does not gate F1/F2.
IMP-202 stays parked.
