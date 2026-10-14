# Ruling: AI-IMP-205 WASM feasibility stop, and the randomness parity behind it

**Lead:** Genga (Genga-Opus-5) · **Date:** 2026-10-14 · **Report:** Sol, `sol-to-genga.color-tool-205-wasm-feasibility-stop.2026-10-14.md`
(sha256 6dbfbc29…), candidate on d23ff5c.

## What Sol found (accepted)
`cargo` fails building for wasm32 in `getrandom 0.2.17`, pulled in through `rand 0.8.8`'s default `std` feature. color-core never
uses ambient entropy (every RNG is `seed_from_u64`). Sol's proposal: `rand` with default features off, and not `getrandom/js`.
Adopted.

## What the lead found behind it (two more parity traps, checked in the vendored rand-0.8.8 source)
1. **`SmallRng` is not portable:** `rand-0.8.8/src/rngs/small.rs:13-16` selects `Xoshiro256PlusPlus` when
   `target_pointer_width = "64"` and `Xoshiro128PlusPlus` otherwise. wasm32 is 32-bit, so even with getrandom gone, the browser
   would draw a different sequence for sampling (image_pipeline.rs:176) and k-means++ (kmeans.rs:140), and the digests could
   never match.
2. **`gen_range` over `usize` is width-dependent:** five draws (image_pipeline.rs:197; kmeans.rs:169, 367, 395, 457) sample at
   `usize` width, which is 64 bits natively and 32 in wasm32. (`gen::<f32>()` at kmeans.rs:402 reads 32 bits everywhere and is
   fine.)

## The ruling (fence: AI-IMP-205 amendment 3)
- `rand = { version = "0.8", default-features = false }`: no getrandom, no `getrandom/js`.
- An in-tree `PortableRng` (Xoshiro256++, rand 0.8's exact 64-bit `SmallRng` seeding: SplitMix64 `seed_from_u64`, `next_u32` = the
  high 32 bits of `next_u64`) implements `RngCore` + `SeedableRng`, replacing `SmallRng` everywhere. It's identical on every target
  by construction, and native output is unchanged because it IS the 64-bit SmallRng.
- Every `usize` `gen_range` becomes a `u64` draw. On 64-bit that's the same sampler (usize == u64), so native output doesn't
  change; on wasm32 it's now the same as native.
- The proof: a native-only oracle test (`PortableRng` == `SmallRng` over 10,000 `next_u64` and 10,000 `next_u32` draws for seeds
  0, 1, 42, the default and `u64::MAX`); the k-means snapshot and golden unchanged (otherwise the golden-stop rule applies);
  `getrandom` absent from the wasm tree. Then the encoded PNG/JPEG retry and the digest parity, as the ticket says.

## Why in-tree rather than `rand_xoshiro`
No new dependency or network fetch, and the oracle test against the exact generator the native build uses today is a stronger
proof than a third crate's documentation.

## Correction (2026-10-14, after Sol's oracle stop): the seeding clause above was WRONG
It said `SmallRng` seeds via SplitMix64. It doesn't: `SmallRng` (rngs/small.rs:105-117) implements only `from_seed`/`from_rng`
and inherits rand_core 0.6.4's default `seed_from_u64` (a PCG32 fill of the 32-byte seed). SplitMix64 is the INNER
Xoshiro256PlusPlus's own `seed_from_u64`, which SmallRng never calls except in `from_seed`'s all-zero fallback. The oracle test
did its job at seed 0, draw 0. The corrected rule is amendment 4: inherit the default `seed_from_u64`; mirror the inner
`from_seed` exactly, zero branch included. The original text stays above, uncorrected, as the record of the error.
