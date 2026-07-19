use std::fmt::Write;

use sha2::{Digest, Sha256};

const ARTIFACT_ID_PREFIX: &str = "aid-";

/// Maps an arbitrary logical ID to one fixed-length, cross-platform-safe file component.
pub fn canonical_artifact_id(value: &str) -> String {
    let digest = Sha256::digest(value.as_bytes());
    let mut encoded = String::with_capacity(ARTIFACT_ID_PREFIX.len() + digest.len() * 2);
    encoded.push_str(ARTIFACT_ID_PREFIX);
    for byte in digest {
        write!(&mut encoded, "{byte:02x}").expect("writing to String cannot fail");
    }
    encoded
}

#[cfg(test)]
mod tests {
    use super::canonical_artifact_id;

    #[test]
    fn sweep_030_canonical_ids_are_stable_and_filesystem_safe() {
        let first = canonical_artifact_id("video/frame:α");
        let second = canonical_artifact_id("video/frame:α");

        assert_eq!(first, second);
        assert_eq!(first.len(), 68);
        assert!(first
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-'));
    }

    #[test]
    fn sweep_030_inputs_collapsed_by_old_sanitizers_remain_distinct() {
        assert_ne!(canonical_artifact_id("ab"), canonical_artifact_id("a/b"));
        assert_ne!(canonical_artifact_id("a/b"), canonical_artifact_id("a?b"));
        assert_ne!(canonical_artifact_id("a_b"), canonical_artifact_id("a/b"));
        assert_ne!(canonical_artifact_id("é"), canonical_artifact_id("è"));
    }

    #[test]
    fn sweep_030_same_logical_id_has_parity_across_artifact_classes() {
        let logical_id = "shared/frame:id";
        let frame_id = canonical_artifact_id(logical_id);
        let strip_id = canonical_artifact_id(logical_id);
        let values_id = canonical_artifact_id(logical_id);

        assert_eq!(frame_id, strip_id);
        assert_eq!(strip_id, values_id);
    }
}
