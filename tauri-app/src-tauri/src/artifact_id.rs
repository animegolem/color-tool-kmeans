use std::fmt::Write;

use sha2::{Digest, Sha256};

const ARTIFACT_ID_PREFIX: &str = "aid-";

/// Maps the exact UTF-8 bytes of a logical ID to one filesystem-safe component.
pub fn canonical_artifact_id(logical_id: &str) -> String {
    let digest = Sha256::digest(logical_id.as_bytes());
    let mut component = String::with_capacity(ARTIFACT_ID_PREFIX.len() + digest.len() * 2);
    component.push_str(ARTIFACT_ID_PREFIX);
    for byte in digest {
        write!(&mut component, "{byte:02x}").expect("writing to String cannot fail");
    }
    component
}

#[cfg(test)]
mod tests {
    use std::path::{Component, Path};

    use super::canonical_artifact_id;

    fn assert_safe_component(logical_id: &str) {
        let component = canonical_artifact_id(logical_id);
        assert_eq!(component.len(), 68);
        assert!(component.starts_with("aid-"));
        assert!(component[4..]
            .chars()
            .all(|ch| ch.is_ascii_digit() || ('a'..='f').contains(&ch)));
        assert_eq!(
            Path::new(&component).components().collect::<Vec<_>>(),
            vec![Component::Normal(component.as_ref())]
        );
    }

    #[test]
    fn sweep_030_matches_known_sha256_vector_and_is_stable() {
        let expected = "aid-ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
        assert_eq!(canonical_artifact_id("abc"), expected);
        assert_eq!(canonical_artifact_id("abc"), expected);
    }

    #[test]
    fn sweep_030_arbitrary_ids_are_fixed_length_safe_components() {
        for logical_id in [
            "raw Unicode αβ😀",
            "slash/and\\backslash",
            "punctuation: ?*<>|\"!",
            "../../traversal-shaped",
            "CON",
            "nul.txt",
            ".",
            "..",
        ] {
            assert_safe_component(logical_id);
        }
        assert_safe_component(&"very-long/".repeat(4_096));
    }

    #[test]
    fn sweep_030_preserves_exact_logical_id_byte_distinctions() {
        for (left, right) in [
            ("id", "ID"),
            ("id", " id"),
            ("id", "id "),
            ("é", "e\u{301}"),
            ("ab", "a/b"),
            ("a/b", "a?b"),
            ("a_b", "a/b"),
        ] {
            assert_ne!(
                canonical_artifact_id(left),
                canonical_artifact_id(right),
                "{left:?} and {right:?} must remain distinct"
            );
        }
    }
}
