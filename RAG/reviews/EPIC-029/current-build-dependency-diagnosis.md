# Current build dependency diagnosis

Read-only diagnosis by Sol for the EPIC-029 Review Lead, 2026-09-05. No install, update, build, source/config/lock edit, Git mutation, or subagent write was performed. The only durable output is this report.

## Recommendation

Advance the bounded JavaScript Tauri cohort to the Rust versions already resolved and validated, and begin tracking the root workspace `Cargo.lock`.

Recommended declared JavaScript versions:

```json
{
  "@tauri-apps/api": "~2.11.1",
  "@tauri-apps/plugin-dialog": "~2.7.3",
  "@tauri-apps/plugin-store": "~2.4.4",
  "@tauri-apps/cli": "~2.11.4"
}
```

The first two changes clear the exact validator failures. Store is already major/minor-compatible at JS 2.4.2 versus Rust 2.4.4, and CLI is not part of the mismatch rule, but patch-aligning Store and bringing the build CLI to the current 2.11 cohort costs no additional files and avoids needless tool/API skew. Tilde ranges keep later lock regeneration inside the selected minor; the tracked lockfiles provide exact reproduction.

Strict minimum reproducible file set:

1. `.gitignore` — remove the root `/Cargo.lock` ignore only.
2. `Cargo.lock` — add the existing root workspace lock as a tracked application lock.
3. `tauri-app/package.json` — set the four bounded versions above.
4. `tauri-app/package-lock.json` — regenerate with npm 10 and retain lockfile version 3.

No `Cargo.toml`, Tauri config, feature, application source, or plugin-registration change is required to clear the mismatch reproducibly once the root lock is tracked. If AI-IMP-201 intentionally adds a fifth file for defense-in-depth, cap every direct Tauri Rust family to its already-resolved minor rather than constraining only the two validator pairs:

```toml
tauri = { version = "~2.11.0", features = ["protocol-asset", "devtools"] }
tauri-plugin-shell = "~2.3.0"
tauri-plugin-dialog = "~2.7.0"
tauri-plugin-store = "~2.4.0"
tauri-build = { version = "~2.6.0", features = [] }
```

Those caps preserve the current lock while preventing a later lock refresh from independently jumping any direct Tauri crate to a new minor. The tracked root lock remains the exact reproducibility boundary.

## Observed current state

Candidate topology changed only through the lead's concurrent Wave 02 review: diagnosis began with the uncommitted Wave 02 diff on `6a17da6`; the lead then created `13b6340` and `cf4c344`. Final observed candidate is clean at `cf4c3440ae525bbd204e17c1af5b5db60c5bc9ed`. Sol made no candidate or Git changes.

Declared npm ranges in `tauri-app/package.json` are broad caret ranges, but the tracked npm lock and installed tree resolve:

| Package | Installed/locked |
| --- | ---: |
| `@tauri-apps/api` | 2.9.1 |
| `@tauri-apps/plugin-dialog` | 2.6.0 |
| `@tauri-apps/plugin-store` | 2.4.2 |
| `@tauri-apps/cli` | 2.9.6 |

The root workspace `Cargo.lock` exists locally but is ignored by `.gitignore:7` and untracked. Candidate resolution:

| Crate | Candidate lock |
| --- | ---: |
| `tauri` | 2.11.5 |
| `tauri-build` | 2.6.3 |
| `tauri-plugin-dialog` | 2.7.3 |
| `tauri-plugin-store` | 2.4.4 |
| `tauri-plugin-shell` | 2.3.6 |
| transitive `tauri-plugin-fs` | 2.5.2 |

`cargo metadata --locked --offline --no-deps` identifies the repository root as the workspace root and `/target` as its target directory. There is no nested authoritative Cargo lock.

The ignored lock has already drifted without a tracked diff: the clean main checkout's August lock contains dialog 2.7.2 and shell 2.3.5, while the candidate's September lock contains dialog 2.7.3 and shell 2.3.6. Both resolve tauri 2.11.5 and store 2.4.4. This is direct evidence that current Rust builds are not reproducible from Git alone.

## CLI evidence

`tauri-app/node_modules/.bin/tauri info` completed with process exit 0 but printed the CLI's explicit error:

```text
Found version mismatched Tauri packages. Make sure the NPM package and Rust crate versions are on the same major/minor releases:
tauri (v2.11.5) : @tauri-apps/api (v2.9.1)
tauri-plugin-dialog (v2.7.3) : @tauri-apps/plugin-dialog (v2.6.0)
```

The lead separately observed packaging reject the mismatch. `tauri build --help` exposes `--ignore-version-mismatches`, but its own help warns that mismatched packages can cause unknown behavior. Do not use that bypass.

The lead's prompt named Rust dialog 2.7.2; that is the main checkout's ignored local lock. The live accepted candidate resolves 2.7.3, confirmed independently by the root lock and `tauri info`, and Wave 02 native tests ran against that resolution. The validator requires the 2.7 minor, so JS dialog 2.7.2 would also clear the mismatch and itself requires API `^2.11.0`; it would not, however, exactly match the candidate patch. Prefer 2.7.3. If the lead deliberately chooses 2.7.2, pin both lockfiles to 2.7.2 rather than describing it as the candidate-tested resolution.

Authoritative registry metadata queried read-only confirms:

- Latest current npm packages are API 2.11.1, dialog 2.7.3, store 2.4.4, and CLI 2.11.4.
- Dialog JS 2.7.3 and Store JS 2.4.4 both require `@tauri-apps/api ^2.11.0`, so API must advance with them.
- Rust tauri has non-yanked 2.9.0 through 2.9.5; Rust dialog has only non-yanked 2.6.0 in the 2.6 minor.

Registry sources: [npm API metadata](https://registry.npmjs.org/@tauri-apps%2fapi), [npm dialog metadata](https://registry.npmjs.org/@tauri-apps%2fplugin-dialog), [npm Store metadata](https://registry.npmjs.org/@tauri-apps%2fplugin-store), [npm CLI metadata](https://registry.npmjs.org/@tauri-apps%2fcli), [crates.io tauri versions](https://crates.io/api/v1/crates/tauri/versions), [crates.io dialog versions](https://crates.io/api/v1/crates/tauri-plugin-dialog/versions).

## Why not constrain Rust down to the installed JS minors

A narrow-looking tauri 2.9 / dialog 2.6 downgrade is not resolver-complete:

- `tauri-plugin-dialog 2.6.0` requires `tauri ^2.9.3` and transitive `tauri-plugin-fs ^2.4.5`.
- `tauri-plugin-store 2.4.4` requires `tauri ^2.10`; it would also need to move back to exactly 2.4.2, whose dependency is `tauri ^2.9.3`.
- `tauri-plugin-shell 2.3.6` requires `tauri ^2.10`; it would also need to move back to exactly 2.3.4, whose dependency is `tauri ^2.9.3`.

A coherent backward candidate would therefore require at least:

```toml
tauri = "=2.9.5"
tauri-plugin-dialog = "=2.6.0"
tauri-plugin-store = "=2.4.2"
tauri-plugin-shell = "=2.3.4"
```

plus a newly tracked lock. That changes four native packages rather than two required JS pairings, potentially discards later bug fixes, and invalidates the strongest current evidence: Wave 01/02 Rust fmt, clippy, and workspace tests ran against tauri 2.11.5 with the newer plugins. It is a viable fallback only if the 2.11 JS cohort produces a demonstrated regression during build/hands-on acceptance.

## Exact implementation and verification sequence

Lead-owned implementation:

1. Edit only the four minimum files, plus `tauri-app/src-tauri/Cargo.toml` if the lead admits the complete direct-family minor caps above; preserve all application and Wave 02 source.
2. Remove `/Cargo.lock` from root `.gitignore` and retain the candidate's existing root lock.
3. Apply the bounded npm versions above in `tauri-app/package.json`.
4. From `tauri-app`, regenerate npm metadata with the repository-required npm 10:

   ```text
   npx -y npm@10 install --package-lock-only
   npx -y npm@10 ci --dry-run
   ```

5. Install the locked JS tree only in the lead's authorized build environment, then verify exact resolutions:

   ```text
   npm ci --no-audit --no-fund
   npm ls @tauri-apps/api @tauri-apps/cli @tauri-apps/plugin-dialog @tauri-apps/plugin-store --depth=0
   cargo metadata --locked --offline --no-deps --format-version 1
   npm run tauri -- info
   ```

   Acceptance: `tauri info` contains no mismatched-package error and shows core/API minor 2.11, dialog minor 2.7, and Store minor 2.4.

6. Run normal frontend/native gates with locked Cargo resolution. Where supported, add `--locked`:

   ```text
   npm run test -- --run
   npm run check
   npm run lint
   npm run format:check
   cargo fmt --all -- --check
   cargo clippy --workspace --locked -- -D warnings
   cargo test --workspace --locked
   cargo test -p color-core --no-default-features --test kmeans_snapshots --locked
   ```

7. Run the authorized package build without the mismatch bypass, passing Cargo's lock guard to the runner:

   ```text
   npm run tauri -- build --debug -- --locked
   ```

8. Hands-on smoke the JS surfaces affected by the cohort change: native open/save dialogs, Settings directory picker, Store preference hydration/write, event listener registration, asset URLs, zoom, clipboard paste formats, `.tif` picker/drop ingestion, and sidecar-backed video operations. Then inspect the actual bundle/output path before publication.

## Additional build traps and non-traps

1. **Release bundle upload path is probably wrong for this workspace.** Cargo metadata reports target output at repository-root `target/`, and CI's Windows upload uses `target/release/bundle`. Both release jobs instead upload `tauri-app/src-tauri/target/release/bundle/**/*`. No build was authorized here, so this is source/metadata-confirmed and still needs an actual packaging-path observation before changing the workflow.
2. **Release installs are weaker than CI installs.** `.github/workflows/release.yml` uses `npm install`; CI uses `npm ci`. Change release to `npm ci` in a separately authorized workflow hardening patch so the tracked npm lock is enforced deliberately.
3. **Cargo lock enforcement is absent.** CI and release Cargo/Tauri commands omit `--locked`. Tracking the root lock fixes fresh-checkout resolution; adding `--locked` to direct Cargo commands and passing it through Tauri's runner is a useful separate workflow hardening step.
4. **Sidecars are still external build inputs.** FFmpeg/ffprobe are gitignored, and CI/release scripts fetch or build them; the CI URLs use a moving `latest` artifact. Correct target-named sidecars are required before the Tauri build script runs. This is separate from the package mismatch and remains a provenance/reproducibility risk.
5. **`custom-protocol` is not missing.** Current Cargo metadata shows only `default` and `simd` application features. The installed official Tauri CLI changelog states that, since Tauri 2 beta, an application `custom-protocol` Cargo feature is no longer required and is ignored. Do not add it as a packaging workaround. Source: `tauri-app/node_modules/@tauri-apps/cli/CHANGELOG.md:1053-1055`.
6. **Missing JS shell/fs packages are not validator failures here.** The frontend contains no `@tauri-apps/plugin-shell` or `@tauri-apps/plugin-fs` imports. Rust shell is used natively for FFmpeg, and Rust fs is a dialog transitive dependency. `tauri info` reports their JS absence but does not include them in the mismatch error.
7. **Moving compiler/tool inputs remain.** Workflows use moving Rust `stable`; release sidecar sources also move. A rust-toolchain pin and sidecar digest/version pin would improve release reproducibility, but neither is required to clear this bounded Tauri mismatch.

## Evidence limits and probe friction

- No Tauri build, renderer build, install, update, lock regeneration, or hands-on app test was run by Sol. The lead separately reported that the current renderer build passes; that does not prove Tauri packaging.
- Registry queries were metadata-only. Initial crates.io calls without a descriptive User-Agent returned HTTP 403; the same endpoints succeeded read-only with `color-tool-dependency-audit/1.0`.
- A Node `require('<plugin>/package.json')` probe failed for dialog and Store because their package export maps intentionally hide `package.json`; direct read-only file inspection and `npm ls` supplied the same metadata.
- Two compound read-only shell probes used an incorrect working-directory-relative Cargo path / an empty `rust-toolchain` search and short-circuited before later read-only clauses. They changed nothing and were rerun with explicit repository-root paths.
- Final candidate is clean at `cf4c344`; no source/config/lock/Git state was changed by this diagnosis.
