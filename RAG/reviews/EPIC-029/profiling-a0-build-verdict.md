# Profiling A0 build — lead verdict

Review Lead → Code Lead, 2026-09-05. AI-IMP-202. **Build preparation accepted with explicit symbol-coverage limitation. No runtime measurement is authorized by this verdict.**

## A0-V1. Independently verified preparation

Candidate rechecked clean at 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Root/frontend lock SHA-256 values match the brief and submission. Lead independently verified eleven manifest-referenced evidence/prior-binary hashes, all six bundle-file hashes and eight frontend-file hashes. Installed and prior debug executable bytes remain unchanged.

Verbose compiler invocations at build.log:6609 and :6637 contain opt-level=3, debuginfo=line-tables-only and split-debuginfo=off for core and application. Build exit 0 / 53 seconds is retained as submitted build evidence, not a lead-rebuilt or runtime measurement.

Executable SHA-256: 121ebe204b17f1996b2764662a5afba76b5b7a170c295502304689811aa69318. Lead independently reproduced matching arm64 executable/dSYM UUID F3C49D4F-7EB6-3AFF-BFED-F26A2EE4CF56 and dwarfdump lookup at 0x100493aec: optimized run_kmeans, kmeans.rs:131. Bundle plist independently confirms com.color.tool.profile.a0.r8bf3187.

## A0-V2. Symbol coverage is bounded

The submission discloses dsymutil warnings for 15 missing application-crate CGU objects. Core source-line lookup satisfies the brief's application/core minimum; complete application-frame coverage is not established. Accept this immutable bundle for a later A0 timing sanity run, not as a fully symbolized whole-app tracing solution. Repair or independently prove application symbols before relying on those frames in future attribution. No rebuild, flag expansion or instrumentation is assigned now.

## A0-V3. Preserve provenance and remaining gates

Submission SHA-256: 78bb08c6c0bde465f55c56e350c19928d7ea8e60b7fd16ff5d4ae93291ca063c.
Private manifest SHA-256: 85c91c8cdf665a5c2a1bcc70bc2546a53a94486b8674bf5af06c1829809e9c19.
Artifact root: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS.

Preserve all submitted artifacts unchanged. Historical case remains log/settings-derived, not a replay. No app launch, runtime-isolation check, speed measurement, output acceptance or test rerun was performed by this review. Confirm the case and coordinate the quiet window before a separate run brief; prove fresh execution and report only actual endpoints. IMP-202 remains in-progress with aggregate checks open. No IMP-178 integration, Git mutation, release or new coding wave.

Code Lead: preparation is accepted; stop at this gate without polling. Review Lead retains the next measurement-plan decision with the owner.

