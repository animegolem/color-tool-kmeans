# Wave06 phase021 accepted; phase027 media reply validation

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.67. Accept phase021 as bounded local source/test preparation, not immutable input or atomic-publication acceptance.

## Acceptance receipt

Report a2ebc9c8943c916b389d6360e661bf3faa246f02476b5d42adbd5d867ede3f65 preserved. Lead read the complete two-file diff and matched both hashes, binary diff5df8cd2b23c57ecd7b83c51e6a07547ecf0c500e07d1522f7cc31d8fcb85a5ce, unchanged019/rootlock and untouched022 paths. Concurrent distinct sources, later three-output byte retention, same-path changed observation and actual unchanged-source no-rewrite controls are verified locally. Existing AUD-005/022 and Windows helper tests remain intact.

Lead reproduced renderer434/35, check0errors/two accepted warnings, lint/format, profiling Node88, event10, native fmt/clippy/workspace80 plus one intentional ignored emitter, scalar1 and core normal tree without Tauri. Actual candidate-local commit hooks pass. No platform or mounted native lifetime proof is inferred.

Lead commit **caf822526af273c3dafdb44a51f7c094fb3ebeb4**, parent575868c697e67fb7331ae3df3ae39fc5069efca8. Two source/test files260ins/3del plus generatedINDEX: three files262ins/4del. Candidate clean. Cohesive766-line producer and431-line regression module explicitly LOC-reviewed; no out-of-scope split. Main/app/evidence unchanged. Same-generation writers, equal-metadata changed bytes, observe/decode races, direct partial groups and retention policy remain explicit185/193 residuals.

## Phase027 exact scope

Use existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at clean **caf822526af273c3dafdb44a51f7c094fb3ebeb4**. Adapt only AI-IMP-180 / SWEEP-027, historical source **3640300831162cf530e61b9cfe6f0b82edf49c23**. The source delta was already reviewed; read current source before edits, stop on unexpected base/dirty overlap.

Exactly four candidate paths:

- `tauri-app/src/lib/bridges/video.ts`: validate frame/probe/strip replies after invoke and re-export inferred reply types; request interfaces and command arguments unchanged.
- `tauri-app/src/lib/bridges/compose.ts`: validate grid reply after invoke and re-export its reply type; request/default behavior unchanged.
- `tauri-app/src/lib/bridges/ipc-contracts.ts` (new): focused Zod schemas/parsers/types and command-specific invalid-response error.
- `tauri-app/src/lib/bridges/ipc-contracts.spec.ts` (new): real bridge-boundary and parser regression/positive controls.

Installed Zod is4.1.11 and already direct; no package/lock install or dependency edit. Do not modify native types/commands, compute or Values bridge normalization, callers/stores/controllers, profiling, ownership fields, unrelated tests or RAG in candidate. If stricter correct reply types expose an out-of-fence fixture/caller that must change, report its exact path rather than weakening validation or editing silently. No Git, app/package/launch, capture, registry/quota, cache/evidence action. Isolated tests and ordinary compilation permitted; lead owns commits and planning projections.

## Native contract and parser ruling

Lead inspected current `commands_types.rs`, command constructors and consumer fps handling. Current Rust uses camelCase serialization: frame has required String `path` and `timestampUsed`; probe has required numeric `duration` and nullable Option<f32> `fps` (None is null, not absent); strip has required `path`; grid has required `path`, `width`, `height`, `gridCols`, `gridRows`, with numeric fields u32. Do not preserve the old TypeScript optional fields by fabricating defaults for missing native fields.

1. Require nonempty path/timestamp strings, finite nonnegative duration, and fps either null or finite positive number. Require positive integer u32 dimensions/row/column counts; reject fractional/nonfinite/out-of-range values. No string-to-number coercion, missing-field defaults, snake_case fallbacks or trimming/rewriting path bytes. This is shape/domain validation, not a path confinement, filesystem-existence, decoded-PTS or source-byte guarantee.
2. Every actual bridge function must invoke its appropriate parser exactly after a successful reply. Retain original command/argument shape, including compose's null default. Native invoke rejection remains distinct from malformed successful data: propagate invoke failures unchanged; invalid data becomes `IpcResponseError` with `code: invalid-response`, exact command and useful field diagnostic/cause. No logging the whole payload or swallowing unexpected errors.
3. Preserve the historical schema policy of projecting only declared fields; test extra reply fields are not exposed. No newly required artifact/group/escrow data until193. Implement with actual installed Zod, not a dependency upgrade or imported historical compile assumptions.
4. Add meaningful failing boundary assertions before replacing casts/unchecked returns: malformed resolved replies must reject for each of the four real bridge calls. Missing module/type/compiler failures do not count; it is fine to establish the new parser definitions/tests while leaving bridge hookup absent for the before-fix run. Keep exact command/args assertions and valid controls for both fps number/null, duration0, required frame timestamp, strip and full grid. Include missing fields, wrong/null/primitive/array shapes, empty strings, numeric strings, NaN/infinities, negative duration/nonpositive fps and invalid grid numbers; a compact parameterized matrix is preferred.
5. Tests mock the invoke transport but call the real bridge functions. They are contract examples, not production Rust serialization interoperability. Record that limit explicitly; read actual Rust field/Option semantics and do not call hand-authored JavaScript fixtures Rust-emitted proof. No native emitter or protocol expansion is assigned here.

## Gates and report

From tauri-app run focused `ipc-contracts.spec.ts`, then `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `node --test scripts/profiling/*.test.mjs`. Root: `node --test scripts/svelte-event-guard.test.mjs`, `git diff --check`. Native directory: `cargo fmt --all -- --check`, `cargo clippy --workspace --offline -- -D warnings`, `cargo test --workspace --offline`, `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`, `cargo tree -p color-core --offline --edges normal` with no Tauri. Use installed dependencies/pipefail; preserve all prior tests and two accepted warnings. No skipped/fails-marked malformed data.

Leave candidate uncommitted; report exact base/status, four-file manifest/diff, actual negative assertions/positive counts, preserved native/previous-phase hashes, argument/error behavior, schema policy, toolchain and candid limitations. Write only `RAG/reviews/EPIC-029/correctness-wave-06-phase-027-submission.md` in the planning carrier; notify lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 with path/hash, then stop without polling. No029 before next exact-base assignment. Owner pressure choice and193 implementation remain pending.
