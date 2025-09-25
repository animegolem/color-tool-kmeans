# Tauri Color Tool (Scaffold)

This directory hosts the next-generation desktop client built with Tauri + Svelte.

## Getting Started

1. Install dependencies:

```bash
cd tauri-app
npm install
```

2. Fetch local Fira Sans fonts (one-time):

```bash
./scripts/fetch-fira.sh
```

3. Run the app:

```bash
npm run tauri dev
```

## Scripts

- `npm run dev` – Vite dev server (without native shell)
- `npm run tauri dev` – launches the native window
- `npm run build` – type-check + Vite build
- `npm run lint` – ESLint (Svelte + TS)
- `npm run format:check` / `npm run format` – Prettier
- `npm run check` – `svelte-check`

## Notes

- Drag-and-drop + File→Open are stubbed; the Rust backend returns placeholder messages until analysis is implemented.
- Fonts must be local. The helper script downloads the open-source Fira Sans variants we use in the UI. If offline, add the WOFF2 files manually to `src/assets/fonts/` and re-run.
- Renderer now targets Svelte 5 runes. DOM events use `onclick`/`oninput`, and components manage state via `$state`, `$derived`, `$effect`, `$props`. See `src/App.svelte` and `src/lib/views/HomeView.svelte` for reference patterns.
