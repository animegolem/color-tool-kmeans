//! Tauri-free color analysis engine.
//!
//! Extracted from the color-tool Tauri app so external projects can consume
//! the engine as a library. The pipeline: sample pixels from an image
//! ([`image_pipeline`]), cluster them with k-means++ in OKLab ([`kmeans`]),
//! merge near-duplicate clusters ([`merge`]), and convert centroids across
//! color spaces ([`color`]). [`analyze`] orchestrates the full pipeline.
//!
//! Color space algorithms in [`color`] are based in part on Color-tool by
//! L. Jégou (CC BY 3.0); see ATTRIBUTIONS.md in this crate.

pub mod analyze;
mod clock;
pub mod color;
pub mod digest;
pub mod image_pipeline;
pub mod kmeans;
pub mod merge;
mod rng;

pub use analyze::{
    analyze, AnalyzeError, AnalyzeRequest, AnalyzeResponse, ClusterOut, ImageSource, RgbValue,
};
pub use digest::{canonical_result_bytes, result_digest, RESULT_DIGEST_VERSION};
