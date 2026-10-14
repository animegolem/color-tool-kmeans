use rand::{Error, RngCore, SeedableRng};

/// Xoshiro256++ with a target-independent state width and seed expansion.
///
/// This intentionally matches rand 0.8's 64-bit `SmallRng` so existing native
/// analysis stays byte-for-byte stable while wasm32 uses the same sequence.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct PortableRng {
    state: [u64; 4],
}

impl SeedableRng for PortableRng {
    type Seed = [u8; 32];

    fn from_seed(seed: Self::Seed) -> Self {
        if seed.iter().all(|byte| *byte == 0) {
            return Self::from_splitmix64_seed(0);
        }

        let mut state = [0_u64; 4];
        for (word, bytes) in state.iter_mut().zip(seed.chunks_exact(8)) {
            let mut chunk = [0_u8; 8];
            chunk.copy_from_slice(bytes);
            *word = u64::from_le_bytes(chunk);
        }
        Self { state }
    }
}

impl PortableRng {
    fn from_splitmix64_seed(mut seed: u64) -> Self {
        const PHI: u64 = 0x9e37_79b9_7f4a_7c15;

        let mut state = [0_u64; 4];
        for word in &mut state {
            seed = seed.wrapping_add(PHI);
            let mut value = seed;
            value = (value ^ (value >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
            value = (value ^ (value >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
            *word = value ^ (value >> 31);
        }
        Self { state }
    }
}

impl RngCore for PortableRng {
    #[inline]
    fn next_u32(&mut self) -> u32 {
        (self.next_u64() >> 32) as u32
    }

    #[inline]
    fn next_u64(&mut self) -> u64 {
        let result = self.state[0]
            .wrapping_add(self.state[3])
            .rotate_left(23)
            .wrapping_add(self.state[0]);

        let shifted = self.state[1] << 17;
        self.state[2] ^= self.state[0];
        self.state[3] ^= self.state[1];
        self.state[1] ^= self.state[2];
        self.state[0] ^= self.state[3];
        self.state[2] ^= shifted;
        self.state[3] = self.state[3].rotate_left(45);

        result
    }

    fn fill_bytes(&mut self, destination: &mut [u8]) {
        let mut remaining = destination;
        while remaining.len() >= 8 {
            let (chunk, rest) = remaining.split_at_mut(8);
            chunk.copy_from_slice(&self.next_u64().to_le_bytes());
            remaining = rest;
        }

        match remaining.len() {
            0 => {}
            1..=4 => {
                let bytes = self.next_u32().to_le_bytes();
                remaining.copy_from_slice(&bytes[..remaining.len()]);
            }
            _ => {
                let bytes = self.next_u64().to_le_bytes();
                remaining.copy_from_slice(&bytes[..remaining.len()]);
            }
        }
    }

    fn try_fill_bytes(&mut self, destination: &mut [u8]) -> Result<(), Error> {
        self.fill_bytes(destination);
        Ok(())
    }
}

#[cfg(all(test, target_pointer_width = "64"))]
mod tests {
    use super::PortableRng;
    use rand::rngs::SmallRng;
    use rand::{RngCore, SeedableRng};

    #[test]
    fn matches_rand_08_small_rng_for_native_sequences() {
        let default_seed = crate::kmeans::KMeansConfig::default().seed;
        for seed in [0, 1, 42, default_seed, u64::MAX] {
            let mut portable = PortableRng::seed_from_u64(seed);
            let mut oracle = SmallRng::seed_from_u64(seed);
            for draw in 0..10_000 {
                assert_eq!(
                    portable.next_u64(),
                    oracle.next_u64(),
                    "next_u64 mismatch for seed {seed} at draw {draw}"
                );
            }

            let mut portable = PortableRng::seed_from_u64(seed);
            let mut oracle = SmallRng::seed_from_u64(seed);
            for draw in 0..10_000 {
                assert_eq!(
                    portable.next_u32(),
                    oracle.next_u32(),
                    "next_u32 mismatch for seed {seed} at draw {draw}"
                );
            }
        }
    }
}
