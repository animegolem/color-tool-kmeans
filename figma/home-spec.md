---
title: Home View — Slice Spec
date: 2025-09-21
source_fileKey: My07xcwuyW4N03cbwWHjM5
frames:
  onboot: 2:5054
  dragdrop: 2:4910
  loaded: 2:4664
---

# Components (Single Composite)
- DropAnywhere (composite): background panel, border, center icon, label text.
- PrimaryButton: default/hover/pressed/disabled.
- Status: throbber (spinner), error/info icon.
- ParamControls: slider, stepper, select caret; align to tokens.

# States
- Empty (on-boot)
- DragOver (overlay)
- Loading (spinner visible)
- Loaded (image + palette rail)
- Error (banner)

# Interactions
- Drop anywhere on window; show overlay on dragenter.
- Click image → zoom mode; click circle → charts view.
- Eyedropper: cursor change + tooltip; samples wherever mouse over image/circle within app.
- Close (×) on image unloads and restores DropAnywhere with fade.

# Assets to Export (SVG preferred)
- icons/upload.svg, icons/close.svg, icons/info.svg, icons/warn.svg
- controls/slider-track.svg, controls/slider-thumb.svg (if not pure CSS)
- status/spinner.svg (12‑segment)

# Typography
- Fira Sans for UI; Fira Code for vertical text labels where used.
- Exact sizes/weights vary per frame; verify live in Figma during slicing.

# Notes
- Tabs are navigation only; strings in flow chart are not UI copy.
- Export page consumes shared state from Home/Graphs; no separate params.

