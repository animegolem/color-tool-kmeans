//! Canonical, target-neutral digest of deterministic analysis result fields.

use sha2::{Digest, Sha256};

use crate::analyze::ClusterOut;

pub const RESULT_DIGEST_VERSION: u32 = 1;
const RESULT_DIGEST_TAG: &[u8] = b"color-tool.analysis-result";

fn push_u32(bytes: &mut Vec<u8>, value: u32) {
    bytes.extend_from_slice(&value.to_le_bytes());
}

fn push_u64(bytes: &mut Vec<u8>, value: u64) {
    bytes.extend_from_slice(&value.to_le_bytes());
}

fn push_f32(bytes: &mut Vec<u8>, value: f32) {
    push_u32(bytes, value.to_bits());
}

fn push_f32_triplet(bytes: &mut Vec<u8>, values: [f32; 3]) {
    for value in values {
        push_f32(bytes, value);
    }
}

pub fn canonical_result_bytes(
    iterations: usize,
    total_samples: usize,
    clusters: &[ClusterOut],
) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(48 + clusters.len() * 79);
    bytes.extend_from_slice(RESULT_DIGEST_TAG);
    push_u32(&mut bytes, RESULT_DIGEST_VERSION);
    push_u64(&mut bytes, iterations as u64);
    push_u64(&mut bytes, total_samples as u64);
    push_u64(&mut bytes, clusters.len() as u64);

    for cluster in clusters {
        push_u64(&mut bytes, cluster.count as u64);
        push_u64(&mut bytes, cluster.share.to_bits());
        push_f32_triplet(&mut bytes, cluster.centroid_space);
        push_f32_triplet(&mut bytes, cluster.oklab);
        push_f32_triplet(&mut bytes, cluster.oklch);
        push_f32_triplet(&mut bytes, cluster.hsv);
        bytes.extend_from_slice(&[cluster.rgb.r, cluster.rgb.g, cluster.rgb.b]);
    }

    bytes
}

pub fn result_digest(iterations: usize, total_samples: usize, clusters: &[ClusterOut]) -> String {
    let digest = Sha256::digest(canonical_result_bytes(iterations, total_samples, clusters));
    let mut hex = String::with_capacity(digest.len() * 2);
    const HEX: &[u8; 16] = b"0123456789abcdef";
    for byte in digest {
        hex.push(HEX[(byte >> 4) as usize] as char);
        hex.push(HEX[(byte & 0x0f) as usize] as char);
    }
    hex
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::analyze::RgbValue;

    #[test]
    fn canonical_encoding_uses_float_bits_and_fixed_order() {
        let clusters = [ClusterOut {
            count: 7,
            share: 0.25,
            centroid_space: [0.1, 0.2, 0.3],
            oklab: [0.4, 0.5, 0.6],
            oklch: [0.7, 0.8, 0.9],
            rgb: RgbValue { r: 1, g: 2, b: 3 },
            hsv: [4.0, 5.0, 6.0],
        }];

        let bytes = canonical_result_bytes(2, 11, &clusters);
        assert!(bytes.starts_with(RESULT_DIGEST_TAG));
        assert_eq!(result_digest(2, 11, &clusters).len(), 64);

        let original = result_digest(2, 11, &clusters);
        let mut changed = clusters;
        changed[0].centroid_space[0] = f32::from_bits(0.1f32.to_bits() + 1);
        assert_ne!(original, result_digest(2, 11, &changed));
    }
}
