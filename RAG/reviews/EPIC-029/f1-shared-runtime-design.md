# F1 shared-runtime source design

Sol (implementation partner) -> Genga (Review Lead), 2026-10-14. This is the
doc-only F1 design authorized by
[`functional-path-scope-report-verdict.md`](functional-path-scope-report-verdict.md).
It maps clean `main` `0f8bbec3d5b72eb6589809c0932091826d1ffa75`. It does
not authorize source edits, dependency installation, builds, runtime control,
commits, hosting, or deployment. The three adjacent ticket drafts are inputs to
lead review; their numbers and build fences remain the lead's.

## Outcome and boundary

F1 adds a shared capability plane for one still image without redesigning the
active Colors composition:

```text
browser File/Blob                    native path
       |                                  |
       | encoded ArrayBuffer              | path
       v                                  v
dedicated Web Worker -> thin WASM     Tauri analyze_image
             |                              |
             +------ current color-core ----+
                    same response validator
                              |
                existing runner/store token gate
```

The browser source is a retained `Blob`; its filename is display metadata, not a
filesystem path. Canvas/ImageBitmap decoding remains preview-only. Numeric
analysis always receives encoded bytes in the worker and decodes them through
`color-core`. Tauri continues to pass a real path into the same core decoder.

F1 does not add Values, Batch, export downloads, browser video, public hosting,
a service worker, CSP policy, Tauri remote loading, or the F2 study shell. On a
browser target, unsupported routes/controls remain reachable as honest
unavailable surfaces; they must not invoke a native bridge and fail after the
interaction.

## 1. Source identity and renderer contract

Replace the lossy blob marker with a discriminated source owned by each media
entry:

```ts
type ImageSource =
  | { kind: 'path'; path: string }
  | { kind: 'blob'; blob: Blob };

type AnalyzeInvocation = {
  requestId: string;
  signal: AbortSignal;
};
```

`ImageDataset` remains the decoded preview/renderer representation. It is not
the browser numeric-compute input. `ComputeBridge.analyze` receives the selected
entry's `ImageSource`, resolved analysis parameters, and `AnalyzeInvocation`.
The native adapter accepts only `path`; the browser adapter accepts only `blob`.
Mismatch is a typed, actionable error.

Browser browse and drop create `{ kind: 'blob', blob: file }` with `path`
absent. Deduplication for the one-still browser scope uses the entry identity,
not `File.name` masquerading as a path. Native path deduplication stays intact.
Object URLs remain separately tracked and revoked; retaining a `Blob` does not
transfer ownership of its preview URL.

## 2. `color-core` feature and WASM crate layout

Add one thin workspace member, `color-core-wasm/`. It contains only
wasm-bindgen conversion/error glue and calls public `color-core::analyze`; it
must not contain copied color conversion, sampling, merge, or k-means code.

`color-core` separates parallelism from SIMD:

```toml
[features]
default = ["simd", "parallel"]
simd = ["dep:wide"]
parallel = ["dep:rayon"]

[dependencies]
rayon = { version = "1.8", optional = true }
```

The Tauri dependency retains default `color-core` features. The WASM adapter
depends on `color-core` with `default-features = false, features = ["simd"]`:
the existing four-lane algorithm stays selected, while Rayon is absent.
`wide` already has a portable fallback when wasm SIMD is unavailable, so F1
does not make `simd128` a browser requirement.

The non-parallel k-means assignment path must preserve the current 1,024-point
chunk boundaries and fixed-order `f64` partial merge. Only collection of chunk
partials changes from Rayon iteration to sequential iteration. This avoids an
accidental numeric algorithm fork and gives exact-digest parity a defensible
starting point. Both default and `--no-default-features` snapshot gates remain.

`color-core-wasm` exposes one binding:

```rust
analyze_image(encoded_bytes: &[u8], resolved_params: JsValue) -> Result<JsValue, JsValue>
```

It deserializes the current `AnalyzeRequest`, clears/ignores `path`, calls
`analyze(..., ImageSource::Bytes(encoded_bytes))`, and serializes the existing
response. `wasm-pack` produces ignored `pkg/` artifacts for Vite; generated JS
or `.wasm` bytes are not committed. The build helper pins and reports its
`wasm-pack` version and requires `wasm32-unknown-unknown`. Tool installation is
not implicit in either source ticket.

### Encoded-byte feasibility stop

Before renderer wiring, F1b must build the adapter and execute both the existing
PNG fixture and an encoded JPEG through the WASM binding. Failure of the
`image` decoder to compile/run on `wasm32`, or a release artifact size above the
lead-approved generous ceiling recorded in the implementation brief, stops the
ticket. The implementer reports the exact feature/dependency cause and size;
they do not switch to decoded RGBA. Only a new lead verdict may adopt that
fallback and its decode-parity fixture.

## 3. Worker protocol, cancellation, and stale results

The browser adapter creates one dedicated module worker per active analysis.
This favors an honest cancellation boundary over a pooled optimization in the
first functional slice. Request messages carry an opaque UUID, resolved params,
and a transferred `ArrayBuffer`:

```ts
type WorkerRequest = {
  type: 'analyze';
  requestId: string;
  encodedBytes: ArrayBuffer;
  params: ResolvedAnalyzeOptions;
};

type WorkerReply =
  | { type: 'result'; requestId: string; result: unknown }
  | { type: 'error'; requestId: string; error: SerializedComputeError };
```

An abort does three things synchronously in the worker client: revokes the
request ID, terminates that request's worker, and rejects with a typed
`cancelled` error. A synchronous WASM call cannot service a cooperative cancel
message while it is running, so F1 must not claim otherwise. Worker termination
is the actual compute stop.

The opaque worker `requestId` is transport correlation only. The existing
runner `currentToken` and store token remain publication authority. The runner
owns an `AbortController`, aborts it from `cancelPending` and before a successor
dispatch, and still checks `token === currentToken` before success, error, or
final cleanup. The worker client rejects unknown, duplicate, canceled, and
wrong-ID replies. A transport ID never revives a revoked store token.

Tauri IPC is not made physically cancelable by F1. Its adapter observes the
same `AbortSignal` before dispatch and after return, while the runner token gate
rejects stale completion. Native work may finish in the backend after renderer
revocation; it may not publish through the renderer.

All native and worker responses pass one exported Zod validator. Browser WASM
output is not trusted merely because it came from the shared Rust source.

## 4. Exact parity record

F1 uses existing `test-patterns/hsl_ligthness.png`, whose source-byte SHA-256 is
`b1ed9e6c45c8d2b1a91216171a0fdacab7bf29ff28db3f3e2bc0cc9aba63aa43`.
The checked-in parity record binds:

- that input digest;
- the fully resolved request (`k`, quality-derived sampling values,
  `ignoreTopN`, `mergeThreshold`, `snapToReal`, `minLum`, `tol`, `maxIter`,
  `seed`, and `maxSamples`);
- a digest format version; and
- the expected canonical result digest.

`color-core` computes `resultDigest` as SHA-256 over a version-tagged binary
encoding of deterministic response fields in declared order: iterations,
total-sample count, cluster count, and for each dominance-ordered cluster its
count, share bits, centroid/OKLab/OKLch/HSV `f32` bits, and RGB bytes. Integers
are fixed-width little-endian. `durationMs` and target `variant` are excluded.
This avoids differences between `serde_json` and `JSON.stringify` number
formatting. The native response and WASM response both carry the digest from
the shared core.

The native default-feature result establishes the checked-in digest. The
WASM/node harness and the real-browser worker must match it exactly. No numeric
tolerance is granted. If exact parity fails, F1b records the first differing
field/bit pattern and stops for a lead ruling; it does not round fields or
weaken the digest.

## 5. Preference adapter

The persistence interface is target-neutral:

```ts
interface PreferencesBridge {
  readonly id: 'tauri-store' | 'browser-local-storage';
  load(): Promise<PrefsV1>;
  save(next: PrefsV1): Promise<void>;
  reset(): Promise<void>;
}
```

Both adapters use the same `PrefsV1` definition, defaults, merge/migration
function, and full-object write semantics. Browser storage uses the namespaced
key `color-tool.preferences.v1`; the stored JSON includes `version: 1`.
Absence and an unversioned legacy Tauri object hydrate as v1 defaults plus known
fields. An explicit unsupported version, invalid JSON, denied/quota storage, or
write/readback failure becomes a typed error. Browser `exportDir` is always
`null`; browser code cannot retain a fake native directory.

Load failure shows defaults plus a persistent, dismissible UI warning. Save and
reset failures update the same accessible error surface and reject their
promise; they are never console-only. A later successful persistence operation
clears the matching error. Subscription write-back remains debounced and must
catch each promise so no unhandled rejection is introduced.

## 6. Runtime target selection and unavailable capabilities

One pure selector resolves `tauri` or `browser` once at startup and publishes an
immutable capability record. Factories receive that record instead of each
inventing a fallback:

| Capability              | Tauri                   | Browser in F1           |
| ----------------------- | ----------------------- | ----------------------- |
| file input              | native path dialog      | one image `File`/`Blob` |
| Colors compute          | native IPC              | worker + WASM           |
| preferences             | Tauri Store             | localStorage            |
| Values / Batch          | native current behavior | unavailable             |
| export save / directory | native current behavior | unavailable (F7)        |
| video / FFmpeg          | native current behavior | unavailable (F9)        |
| webview zoom            | native current behavior | unavailable             |

Startup logs one structured `[runtime] target` record, sets
`data-runtime-target` on the root element for inspection, and supplies the same
record to bridges and views. Absence of Tauri on a normal browser target is not
an error. Browser navigation keeps all routes, but Values, Batch, and Exports
render an honest unavailable view; Settings hides/disables the native export
directory with an explanation. Colors rejects browser video selection before
ingestion. The selector has no user override in F1.

## 7. Playwright fence and acceptance

F1c adds `@playwright/test` as the only new npm package, changes
`tauri-app/package.json` and `tauri-app/package-lock.json` together, and
regenerates the lock only with npm 10. It adds a Chromium-only Playwright config
and a required `browser-e2e` CI job; the aggregate gate and its regression test
must include that job. Browser binary installation is a CI/host prerequisite,
not a runtime dependency or committed artifact.

The browser suite uses the production Vite entry on loopback and the existing
parity PNG. It must prove:

1. startup selects `browser`, `browser-file`, `browser-worker-wasm`, and
   `browser-local-storage` without a Tauri warning;
2. browse and drop retain a Blob source with no path and reach the exact parity
   digest through the worker;
3. changing a parameter while an earlier request is pending publishes only the
   successor; cancellation does not surface as a user error;
4. a `requestAnimationFrame`/timer heartbeat fires while worker compute is
   pending and the fixed case finishes inside a generous hang timeout (an alarm,
   not an SLA);
5. a preference survives reload, and injected localStorage write denial renders
   the accessible persistence warning; and
6. target-only routes/controls are honestly unavailable and issue no Tauri
   invocation.

Unit tests inject worker, storage, file-picker, and target dependencies. They
cover invalid response, decode/empty input, wrong/duplicate worker ID,
abort-before-dispatch, abort-in-flight, late result, storage corruption, future
schema version, write denial, and native-selection preservation. Playwright
does not replace the ordinary renderer/Rust gates or the later same-still Tauri
F2 proof.

## Ticket order and package authority

1. **F1a — browser file + preferences:** no new packages; package and lock files
   are forbidden. It retains Blob authority, adds the browser picker and shared
   schema/adapters, and surfaces persistence failures.
2. **F1b — worker/WASM current-core compute + parity:** depends on F1a's retained
   Blob source. Rust manifest additions, the WASM build helper, and renderer
   worker files are allowed. No npm dependency or npm lock change.
3. **F1c — target selection + real-browser harness:** depends on F1a and F1b.
   It centralizes capability selection, guards unsupported browser surfaces, and
   alone owns Playwright plus npm-10 lock and CI changes.

Every implementation ticket uses an isolated candidate and the full AGENTS.md
gates. F1b additionally runs the scalar snapshot, Tauri-free core tree, encoded
PNG/JPEG WASM check, and exact digest harness. F1c additionally runs Playwright
on Chromium and the amended CI regression. No implementation begins until the
lead accepts this design, assigns ticket numbers, resolves any file-fence
amendment, and issues the build fence.
