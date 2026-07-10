# Repository Guidelines (delegated agents)

Color analysis desktop app: Tauri 2 + Svelte 5 renderer (`tauri-app/src/`) + Rust core (`tauri-app/src-tauri/`). Offline-first — no runtime network, all assets vendored. Architecture detail lives in `CLAUDE.md`; read it before structural work. This file covers process, gates, and the traps delegated agents actually hit.

## Ground rules

- **Your ticket is the normative spec.** `RAG/AI-IMP/AI-IMP-NNN-*.md` — follow Files-to-Touch and Do-NOT-touch lists strictly; sibling agents often work adjacent tickets in parallel and boundary violations get reverted in review. If a fix genuinely requires a fenced file, STOP and request authorization in your report rather than editing it.
- **Do not attempt `git commit`** — sandboxes cannot write `.git` even in standalone clones. Leave all changes in the working tree; the lead reviews and commits.
- Check ticket checklist items only after implemented AND validated. Fill **Issues Encountered** honestly — deviations, surprises, failed approaches. That section is where the next session learns what the diff can't say.
- Ticket status values: `backlog | planned | in-progress | completed | cancelled | deferred` (not "Closed"). `RAG/INDEX.md` is generated — never hand-edit.

## Environment facts

- Node 20 is the CI runtime; local machines may run newer. **package-lock.json must stay npm-10 compatible** — regenerate only with `npx -y npm@10 install --package-lock-only`.
- `node_modules` is usually pre-installed in delegation clones — do NOT run `npm install`/`npm ci`.
- Cargo registry cache is warm; add `--offline` if the network is blocked.
- ffmpeg/ffprobe sidecars in `src-tauri/bin/` are gitignored; fresh clones fail the Tauri build script until they're copied in (delegation clones come pre-provisioned; otherwise copy from the main checkout).
- ffmpeg CLI: `/opt/homebrew/bin/ffmpeg` on the dev machine. Never commit media files; generate test clips under `$TMPDIR`.

## Validation gates (all must pass)

From `tauri-app/`:
```
npm run test -- --run      # full vitest
npm run check              # svelte-check (2 known AUD-020 a11y warnings are accepted)
npm run lint
npm run format:check
```
From `tauri-app/src-tauri/`:
```
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace     # --offline ok
```
CI runs all of the above plus golden/snapshot gates and a Windows build. Strict LOC check in CI (warn 400/file locally) — `[loc-bypass]` in the commit message when a file must exceed it (the lead handles this at commit time; flag it in your report).

## Code style

- 2-space indent, semicolons, single quotes; `camelCase` functions, `PascalCase` components/classes, `UPPER_SNAKE` constants, `kebab-case.ts` files.
- **Svelte 5 runes only** (`$state`, `$derived`, `onclick`) — legacy `on:` syntax is hook-blocked.
- Logic extraction pattern: `create*()` factories in `*.svelte.ts` returning reactive objects (see `views/home/`).
- Prettier config is `prettier.config.mjs`; run `npx prettier --write` on files you touch.

## Testing notes

- Vitest specs sit next to source (`*.spec.ts`); audit regression suites live in `views/__tests__/` with AUD-IDs in test names — keep them.
- **Rune trap:** importing a `.svelte.ts` runner factory into a node test throws `rune_outside_svelte` (vitest doesn't transform runes). Use the `installRuneShims`/`restoreRuneDescriptors` pattern from `audit-control-flow-races.spec.ts`, or test pure functions instead. Do not "fix" this by marking tests `it.fails` — that's how false-positive repros happen.
- Store race invariants are token-based (see CLAUDE.md "Stores" invariants); if you touch analysis/image/video stores, run the audit suites specifically.
- Export outputs must remain byte-deterministic (`exports/__tests__/` fixtures).

## Commits & reports

- Conventional Commits, referencing the ticket ID: `fix(video): ... [AI-IMP-158]`.
- Your FINAL REPORT is raw data for the lead, not prose for a user: files changed, per-item fix summary, tests converted/added with counts, verbatim gate outcomes, deviations from the ticket, candid friction notes.

## Security & configuration

- No remote content; local files via the Tauri asset protocol; IPC bridge only.
- No secrets in commits. Preferences are local-only (Tauri Store); no telemetry.

## Current state snapshot (2026-07-09)

- v1.0.2 shipped; 2026-07 audit remediation (EPIC-028) landed: video-switch races, cancellation ownership, resource pruning, honest export extensions, and working repo gates.
- Active: **EPIC-026** (live playback — architecture fixed in `RAG/ADR/ADR-003`: persistent rawvideo pipe → LUT+rayon OKLab → warm-start k-means with a fixed 4-iteration budget, single-stage, events per frame) and **EPIC-027** (notebook UI redesign — design bundle in `RAG/`, lifecycle coverage in `RAG/DESIGN-COVERAGE.md`; the shell/views will be rebuilt, so check ticket state before investing in current layout code).
- Bench binaries under `src-tauri/src/bin/` (`kmeans_baseline`, `kmeans_framesim`, `live_pipe_probe`, `live_loop_probe`) are spike instrumentation — don't modify unless your ticket says so.
