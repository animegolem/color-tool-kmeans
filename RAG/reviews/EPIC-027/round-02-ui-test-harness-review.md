---
submission: epic-027-ui-test-harness
recommendation: accept
round: 2
source_commit: 5baa20e021855fbc57aebf48fa0f9b3374ded281
planning_commit: 2cc2000bce04ce2e6bda11a2853dd42595946980
implementation_authorized: false
submitted: 2026-09-05
---

# EPIC-027 Round 02 — focused UI test-harness compatibility review

## Recommendation

**ACCEPT V1/C1 using a narrowly filtered Svelte compiler transform in the existing Vitest configuration.**

The route is executable with the installed dependency graph and the normal Vitest runner. It does not load `@sveltejs/vite-plugin-svelte` into Vitest's nested Vite 5.4.21. It compiles only module IDs whose query-stripped filename ends exactly in `.svelte`, with Svelte's installed compiler set to `generate: 'server'`; `.svelte.ts` rune factories do not match and retain their current handling.

The final disposable proof rendered a nested Svelte 5 showcase/frame pair with a typed `Snippet`, native control markup, and an action callback through `svelte/server`. The callback remained uninvoked. In the same targeted invocation, the real `audit-control-flow-races.spec.ts` suite passed all 15 tests using its existing rune shims. Final result: **2 test files passed, 17 tests passed, exit 0**.

This settles the component-compilation half of C1. Real keyboard, focus, pointer, CSS, and reflow evidence still belongs to the separately approved `study-showcase.html` browser carrier under V2/V3. SSR must not be used to claim those behaviors.

## Exact installed environment

- Source checkout: `/Users/golem/git/color-tool-kmeans`, `HEAD = main = origin/main = 5baa20e021855fbc57aebf48fa0f9b3374ded281`, clean at review start and end.
- Planning carrier: `2cc2000bce04ce2e6bda11a2853dd42595946980`, deliberately dirty; only this Round 02 report was added by this review.
- Local runtime: Node 26.8.1.
- Svelte: 5.39.6, Node engine `>=18`.
- Vitest: 1.6.1, resolving nested Vite 5.4.21.
- Root Vite: 7.3.1.
- Svelte Vite plugin: 6.2.1, peer Vite `^6.3.0 || ^7.0.0`.
- Current `svelte.config.js` uses `vitePreprocess()` (`tauri-app/svelte.config.js:1-5`). The selected test transform deliberately does not load that incompatible plugin into Vitest.
- Current source contains 16 `.svelte` UI components, all with `lang="ts"`, and no non-TypeScript style/script preprocessor use was found.

The final compatibility result is local macOS/Node 26 evidence. CI's supported Node 20 leg was not run; future implementation validation must reproduce on the project's actual Node 20.19-or-newer image.

## Selected route

### Test-config behavior

Amend only `tauri-app/vitest.config.ts` to add a small test-only Vite transform before the existing `test` and `resolve` settings:

```ts
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vitest/config';

const configRequire = createRequire(import.meta.url);
const compilerModule = await import(
  pathToFileURL(configRequire.resolve('svelte/compiler')).href
);
const compiler = compilerModule.default ?? compilerModule;

function svelteComponentSsrTransform() {
  return {
    name: 'svelte-component-ssr-tests',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      const filename = id.split('?', 1)[0];
      if (!filename.endsWith('.svelte')) return null;
      const compiled = compiler.compile(source, {
        dev: true,
        filename,
        generate: 'server',
      });
      return { code: compiled.js.code, map: compiled.js.map };
    },
  };
}

export default defineConfig({
  plugins: [svelteComponentSsrTransform()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: { enabled: false },
  },
  resolve: { alias: { '@': '/src' } },
});
```

The runtime package resolution is intentional. The first external-config probe imported Svelte's internal compiler file by absolute path; Vite bundled it outside Svelte's package scope and broke its private `#compiler/*` imports. Resolving `svelte/compiler` from the project package boundary and dynamically importing its public export preserved that boundary and passed through the real Vitest config loader. The future config can use `createRequire(import.meta.url)` because it resides at the package root; the disposable equivalent anchored the same `tauri-app/package.json` explicitly because its config lived under `/tmp`.

No TypeScript preprocessor is required for this foundation seam. Svelte 5.39.6 directly compiled the proof's `<script lang="ts">`, interface declarations, type-only `Snippet` import, `$props`, `{#snippet}`, and `{@render}`. Foundation components should remain within Svelte's natively erasable TypeScript subset and plain CSS. If a later component requires a non-native script/style preprocessor, stop for a separate tooling ruling rather than expanding this transform or loading the incompatible Vite plugin.

### Component-spec pattern

The future specs remain ordinary `src/**/*.spec.ts` files and statically import their `.svelte` components:

```ts
import { render } from 'svelte/server';
import FeedbackState from './FeedbackState.svelte';

const onAction = vi.fn();
const { body } = render(FeedbackState, { props: { model, onAction } });
expect(body).toContain('Previous study result');
expect(onAction).not.toHaveBeenCalled();
```

- `FigureFrame.spec.ts` can directly prove required heading and optional-region omission.
- `DevStudyShowcase.spec.ts` should render the showcase to prove nested `.svelte` imports and named Svelte 5 snippets naturally, as the disposable `ProbeShowcase.svelte → ProbeFrame.svelte` pair did.
- `FeedbackState.spec.ts` can prove markup, provenance, supplied-action visibility, announcement attributes, and zero callback calls at render.
- Browser interaction remains in the isolated showcase, not these Node SSR specs.

## Normal CI discovery

No test script or include change is needed. Current `tauri-app/package.json:14` runs `vitest run`, and current `tauri-app/vitest.config.ts:4-6` includes `src/**/*.spec.ts`. All planned specs are already beneath `src/`:

- `src/lib/components/study/FigureFrame.spec.ts`
- `src/lib/views/DevStudyShowcase.spec.ts`
- `src/lib/components/study/FeedbackState.spec.ts`
- `src/lib/components/study/feedback-state.spec.ts`

Therefore `npm run test -- --run` discovers the new component and pure-model specs together with the existing 16 files. Static `.svelte` imports encounter the test-only transform; existing pure TypeScript and `.svelte.ts` factory modules do not. No package.json, lockfile, setup-file, alternate test script, or second CI command is required.

## Precise future file fence

For the C1 test seam:

- **Modify:** `tauri-app/vitest.config.ts` — add only the exact-suffix SSR transform; retain the existing Node environment, include glob, coverage setting, and alias.
- **No new test helper/config file.** The transform is small enough to keep in the sole test configuration.
- **No permanent diagnostic fixture.** The ticket-owned FigureFrame, showcase, FeedbackState, and their specs replace the disposable proof.

Already approved separately by V1/V2/V3 for IMP-169:

- `tauri-app/study-showcase.html`
- `tauri-app/src/dev-study-showcase.ts`

Still fenced out:

- `tauri-app/vite.config.ts`
- `tauri-app/svelte.config.js`
- `tauri-app/package.json`
- `tauri-app/package-lock.json`
- `tauri-app/src/main.ts`
- `tauri-app/src/App.svelte`
- `tauri-app/src/app.css`
- installed package contents and all production/store/runner/bridge/native files.

IMP-195 reuses the accepted `vitest.config.ts` seam and does not modify it again.

## Executed proof

Task-specific temporary directory:

`/tmp/color-tool-ui-harness.h3lVhQ`

Final proof inputs:

- `vitest.config.mjs` — exact-suffix compiler transform.
- `vitest.project-root.config.mjs` — points the disposable proof at the real project root, keeps cache under the temp directory, and limits discovery to the proof plus the existing rune audit.
- `src/ProbeFrame.svelte` — typed `Snippet` prop, `$props`, `{@render}`, and caller action.
- `src/ProbeShowcase.svelte` — imports ProbeFrame and supplies a named controls snippet with a native select.
- `src/probe-frame.spec.ts` — actual `svelte/server` render, markup assertions, zero callback invocation, and a `.svelte.ts` rune-shim check.
- `src/rune-factory.svelte.ts` — exact-suffix negative control.

Final command:

```text
cd /Users/golem/git/color-tool-kmeans/tauri-app
npm run test -- --run --config /tmp/color-tool-ui-harness.h3lVhQ/vitest.project-root.config.mjs
```

Final outcome:

```text
RUN v1.6.1 /Users/golem/git/color-tool-kmeans/tauri-app
[component-transform] .../ProbeShowcase.svelte
[component-transform] .../ProbeFrame.svelte
✓ .../probe-frame.spec.ts (2 tests)
✓ src/lib/views/__tests__/audit-control-flow-races.spec.ts (15 tests)
Test Files 2 passed (2)
Tests 17 passed (17)
exit 0
```

The transform log contained the two `.svelte` components only. It did not contain the disposable `.svelte.ts` negative control or any of the audit's `.svelte.ts` runner factories. The audit's own `installRuneShims`/`restoreRuneDescriptors` path remained active and all 15 tests passed.

The proof asserted:

- nested Svelte component import and SSR render;
- typed named snippet content in returned markup;
- native control markup in the snippet;
- visible title/action markup;
- `onAction` call count remained zero after render;
- `.svelte.ts` factory execution still required and accepted the existing-style global rune shim.

Witness hashes:

```text
ecab87df22d195fc5db8fc00d1a5dafa09ebf99b1884316e0c1f4146f164c1ce  vitest.config.mjs
2c74469dc4b7083d7adf83ce8ca107ca8041e3ab3434cce29ee09b4fc7b04e26  vitest.project-root.config.mjs
ff99e45c20fc2b051927f961d69576a9ec8e55d87dc8417898455829d91e0195  src/ProbeFrame.svelte
3e58a99979fabec952acafac97d28f043b886e86ba50548d1550d3ed33526768  src/ProbeShowcase.svelte
4d541d2a9c8ce78a484b731f1519a8bc602180aa870e6978055efee0b7ccda03  src/probe-frame.spec.ts
bb220c38611c72710ece65124e07fc4690ba26248f92e616e1580d693a980547  src/rune-factory.svelte.ts
```

The temp directory remains intentionally available for Review Lead inspection. It also contains the failed alternatives and Vitest result caches, all beneath the same temp root. No server process or task-owned listening socket remained after the probes. After the verdict, the directory may be deleted as one explicit disposable target; nothing from it should be copied into production except the reviewed config pattern.

## Failed and superseded alternatives

1. **Direct Svelte Vite plugin in Vitest:** rejected by V1 and not rerun. Plugin 6.2.1 requires Vite 6/7; Vitest uses Vite 5.4.21. The lead's exact probe failed at `hot-update.js:56` before SSR load.
2. **Absolute import of Svelte compiler internals from the external config:** failed config load, exit 1, with `ERR_PACKAGE_IMPORT_NOT_DEFINED` for `#compiler/builders`. Cause: config bundling moved compiler code outside its package import-map scope. Public package resolution plus runtime dynamic import fixed this; no internals were patched.
3. **Temp-root transform without project package resolution for runtime imports:** compiled the component but Vitest could not resolve `svelte/server` from the external root. Pointing the disposable test at the real package root fixed resolution without aliases; this is the topology the future in-repo config/specs already have.
4. **Isolated root-Vite-7 server harness:** not recommended. A non-HTTP-listening `createServer` attempt still emitted a WebSocket port-24678 conflict and then failed resolving `svelte/internal/client` for the external fixture. Its `finally` block closed the server and deleted its task cache; no listener remained. Although more aliases/config might repair it, that route is larger, creates server/watcher lifecycle obligations, and is unnecessary because the direct compiler transform passed under the actual Vitest runner.
5. **Manual TypeScript preprocessing:** superseded. An earlier passing transform used `svelte/compiler.preprocess` plus `typescript.transpileModule`, but direct Svelte 5 compilation then succeeded on the same typed fixture and the final 17-test proof passed without that code. The smaller route is selected.

No plugin internals were modified or monkey-patched, and no missing Vite environment object was synthesized.

## Tradeoffs and limits

- The transform intentionally produces server components only. It cannot test client lifecycle, DOM events, hydration, CSS layout, focus, pointer input, or reflow. That division is desirable: SSR proves deterministic structure; the isolated browser showcase supplies real-interaction evidence.
- It bypasses `svelte.config.js` preprocessing. That is acceptable for the bounded foundation components because the proof covers their intended Svelte 5/type-only TypeScript features. It is not a general preprocessor framework.
- Callback non-invocation is directly proven. Callback activation still requires the browser showcase because SSR cannot click a button.
- Returning the compiler source map is wired but stack/source-map quality was not separately assessed.
- The exact `.svelte` suffix filter is load-bearing. Do not broaden it to `.svelte.ts`; doing so would change the audit runner path this seam is designed to preserve.
- Full-suite behavior is structurally unchanged for the current 16 specs because none imports a `.svelte` UI component; only the most sensitive 15-test rune audit was executed here, per the focused brief. The future implementation round must run the complete normal gate.

## Future validation commands

After an authorized IMP-169 implementation:

```text
cd /Users/golem/git/color-tool-kmeans/tauri-app
npm run test -- --run src/lib/components/study/FigureFrame.spec.ts src/lib/views/DevStudyShowcase.spec.ts
npm run test -- --run src/lib/views/__tests__/audit-control-flow-races.spec.ts
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

After IMP-195, add its two focused spec paths, then repeat the unchanged normal command and full candidate gates required by PROJECT-RECORD §6. Record Node version, file/test counts, transform failures, and any CI-only difference. Do not treat SSR success as V2 keyboard/reflow acceptance.

## Read-only and diagnostic work performed

- Read the complete Round 01 verdict and Round 02 brief.
- Reverified source/planning revisions and source cleanliness.
- Inspected package/lock engine and peer ranges, current Vitest/Vite/Svelte configs, installed compiler exports, Svelte component/preprocessor inventory, and the existing rune-shim suite.
- Ran one direct, standalone Svelte compiler check as supporting evidence; it succeeded but was not treated as Vitest proof.
- Ran finite disposable Vitest diagnostics described above. The final selected route passed 17/17 tests.
- Checked for task-created Vite servers/listeners after failure; none remained.

## Tests and gates not run

- Did not run the other 15 existing Vitest files or the whole application suite.
- Did not run Svelte check, ESLint, Prettier, Vite production build, browser interaction, offline reference checks, Cargo/native tests, golden/snapshot suites, Windows/Linux packaging, or owner acceptance.
- Did not launch the application.

## Durable files changed

- `RAG/reviews/EPIC-027/round-02-ui-test-harness-review.md` — this report only.

## Boundary/deviation report

- No source, config, package, dependency, installed package, ticket, PROJECT-RECORD, INDEX, prior report, asset, production file, or other worktree was edited.
- No installation, commit, branch/ref change, push, PR, full build, application launch, polling, or notification loop occurred.
- The isolated root-Vite alternative unexpectedly attempted its default WebSocket path despite the non-listening intent; it encountered an existing-port error, did not reach a usable server, and was closed immediately in `finally`. No port was selected or retained because that route was abandoned rather than converted into a listening probe.
- C2–C6 and EPIC-029 were not reopened. The nine-font-binary correction is accepted and not revisited here.

## Requested next step

Review Lead independently reproduces or inspects the selected proof and issues the Round 02 numbered verdict. If accepted, the lead may expand IMP-169's future fence by `tauri-app/vitest.config.ts` plus the already approved isolated showcase entry and issue a separate bounded foundation implementation assignment. Nothing in this report authorizes coding.
