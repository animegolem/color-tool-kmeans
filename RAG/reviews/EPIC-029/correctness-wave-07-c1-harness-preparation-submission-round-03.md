# Wave07 C1 harness preparation submission Round03

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.76 and binding C1-H13. This is the one-file page-load provenance correction only. **The harness executable, Tauri App, AppKit event loop, and WKWebView were not launched. No candidate file or 193-B work was touched.**

## Result and exact fence

Changed only the existing harness file:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/src/driver.rs`

Round02 driver SHA256: `6ae7247d607eff20d6935c9835156b043a46734bca3cbee3204e81c1534cc69d`.

Round03 driver SHA256: `12464052c290afb3a1d0388ab9beb474e49a9d4c171035d74fae8ff2735d656d`.

Comparison against the frozen Round02 source at `color-tool-c1-harness-review-r2.U6Hnyn` reports only `src/driver.rs` different. No README, protocol, trace, main, dependency, manifest, config, icon, lock, HTML, JS, candidate, previous report, or frozen snapshot changed. This Round03 report is the only write outside the harness.

Candidate verification after all work:

- `git status --short`: empty.
- HEAD: `6e12a73783c7119dae9b6add947e1b5085abe003`.
- workspace `Cargo.toml`: `22964484ab47857c253186fa250eb7a314c581bebdf8e8081852a27fa6ddd444`.
- workspace `Cargo.lock`: `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- candidate native `Cargo.toml`: `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e`.
- accepted 193-A `artifact_ownership.rs`: `a4bbdf1194920abde1ed9f1def8422a130630b384326aa0d324a575a7fbdd7c0`.

## Compiling before-fix regression

The regression was added against the real `page_load_trace_record` constructor after both Started and Finished branches had been routed through it, while that constructor still reproduced the Round02 behavior by ignoring `SyntheticInjected`. The fully qualified test selected exactly one test, compiled, and exited 101. Its assertion transcript was:

```text
running 1 test

thread 'driver::tests::synthetic_started_and_finished_records_serialize_injected_provenance' panicked at src/driver.rs:2881:13:
assertion `left == right` failed
  left: String("tauri-on-page-load")
 right: "native-driver-injected-page-load"
test driver::tests::synthetic_started_and_finished_records_serialize_injected_provenance ... FAILED

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 25 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

This is a source/serialization regression, not platform evidence. No App or WebView was constructed.

## C1-H13 correction and source-to-test evidence

- `PageLoadProvenance` is explicit call-site data with two closed variants: `ActualPlatform` and `SyntheticInjected`. No URL, result, case, or timing inference selects provenance.
- `HarnessState::on_page_load` now requires that provenance and carries it into the shared `page_load_trace_record` constructor used by both Started and Finished ledger rows.
- The actual `WebviewWindowBuilder::on_page_load` callback passes `ActualPlatform`. Its serialized rows retain event `page-load-started` or `page-load-finished`, evidence `observed`, source `tauri-on-page-load`, and actuality `actual`.
- The two deliberate late-old case6 calls pass `SyntheticInjected`. Their serialized rows retain the same transition event names but use evidence `forced`, source `native-driver-injected-page-load`, and actuality `synthetic-injected-callback`.
- The Started randomness-failure row also derives evidence/source/actuality from the explicit provenance, so even that exceptional synthetic path cannot fall back to an actual-platform label.
- Protocol transitions are unchanged. The case6 pre/post snapshot assertion and the existing stale-incarnation/destruction nonmutation tests remain intact.

Two permanent tests call the same record constructor used by the runtime path and serialize the resulting `TraceRecord` with Serde:

1. `actual_started_and_finished_records_serialize_platform_provenance` asserts the serialized `event`, `evidence`, `source`, and `actuality` fields for both Started and Finished actual inputs.
2. `synthetic_started_and_finished_records_serialize_injected_provenance` asserts those same serialized fields for both Started and Finished injected inputs and rejects the Round02 platform-source label.

These are not disconnected test-only records and do not use substring checks.

## Unchanged 13-file manifest

All hashes match the frozen Round02 source:

| Relative path | SHA256 |
| --- | --- |
| `Cargo.toml` | `50dfd50c3b392f4a31845303fee28490e31bd8e4872a75e01ae9791717efb9ee` |
| `Cargo.lock` | `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72` |
| `README.md` | `b96d006a117b686505901dd9f2f784a21b3e712763e4212efb40376974ec37fe` |
| `build.rs` | `75cc0cc5d9904756f0836fde89236725c2f41fd962e27cff8cfccbd881e4deb8` |
| `tauri.conf.json` | `fea26088343061857e031fa68b4d716b17dea4f3ba65b224223fd1dcb8124b7f` |
| `src/main.rs` | `f6c81c97d4ee4be953438f6853c56572e272257cce36c9ddb99af51ed03bcbd5` |
| `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` |
| `src/protocol.rs` | `ea1bef009df6a3e9cc13d0777defcff7ba70c331a015896e24149a92d1314ce0` |
| `src/trace.rs` | `4c5c6b1d392ecc9147301b3e5f968b0b2f206ef8b142baaf5c854c98bffcdc66` |
| `assets/a.html` | `d99bf3129e919b3ff61804a21093d4a2f240f61d790968b74e2650d8a0db880d` |
| `assets/b.html` | `ada968a270bb36bf868a5de2749542189fa8a71d9631bff16cf1c2d67fd62911` |
| `assets/harness.js` | `4a06a1bbf8efd24981ea798c14bfcaf7d7f227ea2d8fb79232ba7339df26b111` |
| `assets/icon.png` | `08c9a2e7e6afe1867b9111784a0c54daf897a5076bcf02af41bfed54fb93e9e1` |

Round02 submission remains SHA256 `fc845013d879e8e5ea572148c40abb3761436ff20fb7aee90d327f216787e92c`. The frozen Round02 source and the Review Lead's independently rebuilt, unexecuted binary `6993c0f13d29229c65be634c45b857471349d2cde6cb75a8345c50de02056ac4` were not modified.

## Final offline preparation gates

All commands ran from the harness root with `TAURI_CONFIG` explicitly removed and Cargo output confined to `target-harness`.

- `cargo fmt --all -- --check`: PASS, empty output.
- `env -u TAURI_CONFIG cargo check --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 1.32s`.
- `env -u TAURI_CONFIG cargo clippy --offline --all-targets --target-dir target-harness -- -D warnings`: PASS, `Finished dev profile ... in 1.44s`.
- `env -u TAURI_CONFIG cargo test --offline --target-dir target-harness`: PASS. Library `26 passed; 0 failed; 0 ignored`; binary config `1 passed; 0 failed; 0 ignored`; doc tests `0`. Total: 27 pure tests, including all 25 Round02 tests.
- `env -u TAURI_CONFIG cargo build --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 1.42s`.
- Frozen-source comparison: only `src/driver.rs` differs.
- Candidate status: clean at `6e12a73783c7119dae9b6add947e1b5085abe003`.

The newly compiled and deliberately unexecuted Round03 binary is `target-harness/debug/color-tool-c1-harness`: Mach-O 64-bit arm64, 25,875,784 bytes, SHA256 `0610dfc964e1e96feee34f443ffae256f38dcf2c1d2965eabe9c5022b45d655f`.

This binary is a fresh build identity. It is not claimed byte-identical to the prior Code Lead binary `191ebde7464f27dc9bcb0561ca233e199894da1acb3b292cdf5b30c9831d9fbc` or the Review Lead rebuild `6993c0f13d29229c65be634c45b857471349d2cde6cb75a8345c50de02056ac4`.

## Remaining limits and stop state

Pure record-construction tests establish serialized provenance mapping, not actual macOS callback delivery or ordering. The prepared harness has still never been launched by this Code Lead. No runtime ledger, WKWebView scheduling result, platform callback frequency, cross-platform behavior, production integration, whole-protocol result, C1-C3 acceptance, or 193-B authorization is claimed.

Review Lead acceptance remains the next gate before any prospective first launch. No owner decision is requested. Stop after sending this report path/hash; do not poll.
