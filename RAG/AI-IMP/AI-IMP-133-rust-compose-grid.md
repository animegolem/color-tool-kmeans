---
node_id: AI-IMP-133
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - rust
  - backend
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.85
date_created: 2026-03-18
date_completed: 2026-03-19
---

# AI-IMP-133-rust-compose-grid

## Rust `compose_grid` command + frontend bridge

The batch analysis feature requires stitching multiple images into a single RGBA PNG that can be fed to the existing `analyze_image` pipeline. This ticket adds a new Tauri command that loads N image paths, computes an auto-fit grid layout, paints each image (fit-with-transparent-padding) onto a transparent canvas, writes the result to the app cache directory, and returns the path.

A thin frontend bridge wraps the IPC call for use by the batch runner.

### Out of Scope

- Changes to `analyze_image` or `image_pipeline.rs` — the existing pipeline already handles transparent pixels correctly.
- Frontend-side Canvas compositing — Rust handles all image decode and composition.
- Grid layout configuration UI — auto-fit grid only for MVP.

### Design/Approach

**New Rust module:** `src-tauri/src/compose_grid.rs`

Grid layout algorithm (extends `computeGridLayout` in `compositor.ts` which caps at 3 columns for export tiles; the Rust grid adds 4-column layouts for 10-16 images):
- 2 → 2×1, 3-4 → 2×2, 5-6 → 3×2, 7-9 → 3×3, 10-12 → 4×3, 13-16 → 4×4

**Note:** The frontend `computeGridLayout` only goes to 3×2. This is intentional — it serves export tile compositing, not image grids. The Rust layout is authoritative for batch grid composition.

Per-cell logic:
1. Determine uniform cell size from `max_cell_dim` (default 800px).
2. Load each image, downscale to fit within cell (maintain aspect ratio, Lanczos3).
3. Center on transparent RGBA cell.
4. Paint cells into full canvas with gap (8px transparent between cells).
5. Encode as PNG, write to `app_cache_dir/batch-grid.png` (always overwrite — analysis is manual-trigger only, no stale-cache risk).

**Input validation:**
- 0 or 1 paths → return error `"At least 2 images required for grid composition"`
- \>16 paths → return error `"Maximum 16 images supported (received N)"`
- Unreadable/non-image file → return error `"Failed to load image: {path}: {reason}"`

**Request/Response types** in `commands_types.rs`:
```rust
struct ComposeGridRequest { paths: Vec<String>, max_cell_dim: Option<u32> }
struct ComposeGridResponse { path: String, width: u32, height: u32, grid_cols: u32, grid_rows: u32 }
```

**Frontend bridge:** `src/lib/bridges/compose.ts` — thin wrapper calling `tauriInvoke('compose_grid', { req })`.

### Files to Touch

- `src-tauri/src/compose_grid.rs`: new module (~100 LOC)
- `src-tauri/src/commands_types.rs`: add `ComposeGridRequest`, `ComposeGridResponse`
- `src-tauri/src/commands.rs`: add `compose_grid` command handler
- `src-tauri/src/lib.rs`: export `compose_grid` module
- `src-tauri/src/main.rs`: register `compose_grid` in command list
- `tauri-app/src/lib/bridges/compose.ts`: new bridge (~20 LOC)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create `src-tauri/src/compose_grid.rs` with `compute_grid_layout(count) -> (cols, rows)` function
- [x] Implement `compose_grid_image(paths, max_cell_dim, cache_dir) -> Result<(PathBuf, u32, u32, u32, u32)>`
  - [x] Load each image via `ImageReader::open().with_guessed_format().decode()`
  - [x] Compute uniform cell dimensions from max_cell_dim
  - [x] Scale each image to fit within cell (Lanczos3), maintaining aspect ratio
  - [x] Create transparent RGBA canvas (`RgbaImage::new` with dimensions)
  - [x] Paint each image centered in its grid cell using `image::imageops::overlay`
  - [x] Write PNG to cache dir as `batch-grid.png` (always overwrite)
- [x] Input validation: return descriptive errors for 0-1 paths, >16 paths, unreadable files
- [x] Add `ComposeGridRequest` and `ComposeGridResponse` to `commands_types.rs`
- [x] Add `#[tauri::command] pub async fn compose_grid(...)` to `commands.rs`
- [x] Export module in `lib.rs`, register command in `main.rs`
- [x] Create `tauri-app/src/lib/bridges/compose.ts` with `composeGrid()` function
- [x] Rust unit tests:
  - [x] `compute_grid_layout` returns correct (cols, rows) for counts 1-16
  - [x] `compose_grid` with 0 or 1 paths returns appropriate error
  - [x] `compose_grid` with >16 paths returns appropriate error
  - [x] `compose_grid` with unreadable path returns error identifying the file
  - [x] `compose_grid` with 4 test images produces RGBA PNG with transparent gaps
  - [x] Output is deterministic (same inputs → same pixel data)
- [x] Validate: `cargo fmt --check && cargo clippy -- -D warnings`
- [x] Validate: `cargo test` — all new + existing tests pass (37 Rust tests, 152 Vitest)
- [x] Validate: `npm run check && npm run lint`

### Acceptance Criteria

**Scenario:** Compositing 4 images of different aspect ratios
**GIVEN** 4 image files on disk (mix of landscape and portrait).
**WHEN** `compose_grid` is called with their paths and `max_cell_dim=800`.
**THEN** a 2×2 grid PNG is written to the cache directory.
**AND** the PNG has transparent background (RGBA with α=0 in gaps).
**AND** each image is fully visible (no cropping), centered in its cell.
**AND** the response includes correct width, height, grid_cols=2, grid_rows=2.

**Scenario:** Compositing 16 images (maximum)
**GIVEN** 16 image paths.
**WHEN** `compose_grid` is called.
**THEN** a 4×4 grid PNG is produced.
**AND** completes within 3 seconds.

**Scenario:** Frontend bridge invocation
**GIVEN** the Tauri app is running.
**WHEN** the frontend calls `composeGrid(paths)`.
**THEN** the IPC call succeeds and returns the cached PNG path + dimensions.

**Scenario:** Invalid input — too few images
**GIVEN** 0 or 1 image paths.
**WHEN** `compose_grid` is called.
**THEN** the command returns an error message indicating at least 2 images are required.

**Scenario:** Invalid input — unreadable file
**GIVEN** a mix of valid and invalid paths.
**WHEN** `compose_grid` is called.
**THEN** the command returns an error identifying which file could not be loaded.

### Issues Encountered

No issues encountered. All implementation and tests passed on first attempt. `cargo fmt` required minor reformatting of two long `assert!` macros in tests (auto-fixed).
