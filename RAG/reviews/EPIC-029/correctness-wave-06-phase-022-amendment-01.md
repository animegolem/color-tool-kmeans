# Wave06 phase022 amendment01 — Windows fixture access

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.64. **AMEND**, not source acceptance or permission to begin019. Preserve original submission64a1ba088f90529790028f52e2ade4b877e4b93f86f26909f544444b3abdd862 unchanged.

## Reviewed evidence

Lead matched all five prepared hashes and binary diff d4f6147ee17a21e104ae6792dbb9129de3d92b3acf124c8f1bd5949cd755e877 at933d888; read the complete five-file diff and inspected prune call sites. Independently reproduced native74 plus one intentional ignored emitter, scalar1, core normal tree without Tauri, frontend434/35, profiling Node88 including native emitter, event10, fmt/clippy/check/lint/format/diff. Check retains exactly two accepted AUD-020 warnings. First lead native command stopped before tests because hash paths were incorrectly relative to the native cwd; corrected command reproduced all native gates. No candidate source or Git edit by lead.

The narrow production adaptation is consistent with the assigned safety floor. The new test helper has one source-proven Windows API-contract error not covered by macOS gates.

## A1 — acquire timestamp-update access for both files and directories

`tauri-app/src-tauri/tests/audit_value_cache.rs:47` opens the Windows fixture with `.read(true)` and `FILE_FLAG_BACKUP_SEMANTICS`, then invokes `File::set_times`. Rust1.90 maps read-only OpenOptions to GENERIC_READ and calls SetFileTime on that same handle, without reopening it. SetFileTime requires FILE_WRITE_ATTRIBUTES. The directory flag permits opening a directory but does not supply timestamp-write access. Consequently this Windows branch can fail during fixture setup before the intended pruning assertion.

Primary evidence: [Rust1.90 Windows OpenOptions/get_access_mode and File::set_times](https://github.com/rust-lang/rust/blob/1.90.0/library/std/src/sys/fs/windows.rs#L233), [SetFileTime access requirement](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfiletime). This is source/API evidence, **not an executed Windows failure**.

Correct only the test helper in `tauri-app/src-tauri/tests/audit_value_cache.rs`. Use an explicit minimal Windows access mode including FILE_WRITE_ATTRIBUTES, retaining directory-opening semantics, existing-file-only behavior and no truncation. Prefer the already imported std Windows extension over a dependency; name/document any platform constant. Do not merely add arbitrary broad rights or remove the Windows branch without checking directories. Preserve the production regression and AUD-005. Add a focused helper control for a regular fixture file and a fixture directory that reads back their requested modified times and preserves file bytes; it must exercise the real helper and run on the current platform, with Windows coverage enabled under normal test discovery. No source-string assertion as a substitute and no ignored/skipped Windows test.

The other four prepared source files remain byte-identical to original submission. No new file/dependency, other prerequisite, quota/registry, app/build/package, live cache/evidence, Git or scope change is authorized. Candidate stays on933d888 plus these five original modifications. Existing isolated fixture/test permissions remain.

Rerun the focused audit/helper and startup controls, native fmt/clippy/workspace/scalar/core-tree, and the original full renderer/profiling/event/static gates on the final bytes. If a Windows runtime already exists in the authorized environment, record actual helper/regression outcomes there; do not install a toolchain, create remote jobs or claim Windows execution otherwise. API-correct source plus passing local gates may receive bounded local acceptance, while Windows CI remains an explicit unrun gate.

Write `RAG/reviews/EPIC-029/correctness-wave-06-phase-022-submission-round-02.md` only in the planning carrier, including updated manifest/diff, proof the four production hashes are preserved, exact test counts and evidence limits. Notify lead with path/hash and stop without polling. Lead will review and commit before issuing019.
