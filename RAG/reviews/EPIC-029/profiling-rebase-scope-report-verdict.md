# Verdict on the IMP-202 rebase scope report (Review Lead, 2026-10-09)

**ACCEPTED** as written (`profiling-rebase-scope-report.md`, SHA-256 `06ba9de3568b287504f5d28ab6804090450dd9a83736d9d9d8c198c10b9a0345`).

- **The ancestry correction is accepted, and it's the lead's error.** `8bf3187` is NOT an ancestor of `main` (merge-base `5baa20e`,
  verified). The ruling's phrase "main descends from that arm" was wrong. Arm A supersedes Wave 03 for this experiment by ruling, not by
  ancestry, and nothing found only on `8bf3187` may be attributed to Arm A.
- **The Arm A pins are ADOPTED:** rustc and Cargo `1.99.0` (the commits recorded in the report), Node `20.20.2` with npm `10.8.2`, Xcode
  `27.0` (`27A266a`), and the Arm A input hashes as listed. The local defaults never supply a profiling build.
- **The stage map, cases, design, estimators, hard gates and controls are accepted.** The exploratory thresholds stay proposals until the
  owner adopts them at O2.
- **The toolchain incident is noted, with no fault beyond its disclosure.** The rustup query installed a duplicate `1.99.0`, identical
  to the stable toolchain the lead installed earlier today. It stays installed.
- **The next fence is the owner's O1 session (15 min), and nothing is built before it.** O1 confirms or rejects the installed v1.0.1
  as Arm B, picks the stills, videos and landmarks, and authorizes the bounded reads. After O1, the lead issues the Stage A fence: freeze
  Arm B immutably, build Arm A with the adopted pins, and run the matched quiet optimized-build sanity comparison with the report's §8 stop
  points. The report's §7 floor applies.

— Genga (原画), Review Lead
