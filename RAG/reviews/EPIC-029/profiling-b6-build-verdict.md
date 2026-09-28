# AI-IMP-202 B6 build — accepted with metadata repair recorded

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev0.35 §10.14.

**ACCEPT this exact immutable B6 bundle for the separately assigned B7 operator-control proof.** No runtime, measurement, parity/overhead, performance or aggregate acceptance.

## Independently verified

- Report SHA256 f4abbd22776fd6d5db8ed6d619cab2d8bab41ec5b521e9b8e7284669a230c4a4.
-36 final-index payloads,13 source-evidence entries,6 bundle files,8 frontend files,56 current dirty-source hashes and515 full current-source hashes match. Strict build manifest a24eaaefca59a2d7f59233a8a1f458d73ca67d2aaf9c0d80ebfdc6c9f57b726a validates. Its7 bound file hashes and10 external evidence hashes independently match.
- Before/after dirty56 hashes and exact current status are byte-identical to pre-build records. Lead archive6ef4ad8b… contains56 leaves. Full reconstructed515 leaves were independently rehashed after the metadata repair below and match the preserved manifest.
- Executable /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/cargo-target/release/bundle/macos/Color Tool Profile B6.app/Contents/MacOS/tauri-app is owner-executable (0700), SHA256869ce8df24d5b9c251253197979de656f778f8343fed71726fc981cd73314fb6. Plist identifier com.color.tool.profile.b6.r8bf3187 verified.
- Executable and dSYM independently share UUID B86C1C57-048A-3528-ABEA-D30B4E5C2A62. DWARF leaf89ad636e… is bound by manifest.
- Actual rustc log lines6602/6640/6646 retain opt3, line-tables-only, packed debug info and no strip. Fresh static nm verifies core run_kmeans at0x1004b4ea8 and app ProfileWriter::finalize at0x100209fcc; matching B6 dSYM lookups independently resolve kmeans.rs131 and profiling_writer.rs247. Their addresses happen to equal B2, but were not merely copied.
- B6 prospective runtime namespaces remain absent. B2 executable still hashes9f297d5e… and its existing PID67432/start20:29:26 is unchanged by read-only ps inspection.

The target inventory digest was verified, not every one of its3671 leaves. Full test suites were not rerun during this build review. Source maps remain unavailable; source-line proof does not establish every frame/process coverage.

## Lead metadata repair

Initial traversal of attempt-01/reconstructed-source failed with EACCES. Its root directory was mode0600, so listing child names was possible but traversal/stat failed. Lead changed **only that exact root directory** to0700; checked descendants and found no other directory mode repair necessary. Regular-file bytes and permissions, original archives, report, manifests, source carrier, bundle and dSYM were not changed.

Afterward all515 reconstructed leaf hashes match full-reconstructed-source-hashes.sha256. This is an owner-only directory-traversal repair, not a content repair or rebuild. Preserve this addendum alongside the original immutable report rather than rewriting its historical claims.

Build/wrapper both0 and81.53seconds refer only to compilation/packaging. Preserve disclosed sidecar-glob, working-directory and private-output-mode packaging failures. No performance conclusion.

## Next authority

profiling-b7-control-proof-brief.md permits one new B6 launch with a reserved profiling session and the exact supplied still, bounded K/navigation/Finish interactions, immutable raw evidence and strict read-only trace parsing. B2 remains untouched. No source/build/Git mutation, fabricated seal, reload/resume, benchmark or performance/eligibility claim.
