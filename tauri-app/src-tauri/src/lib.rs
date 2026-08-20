// Engine modules live in the tauri-free `color-core` crate; re-export them
// so existing `tauri_app::` / `crate::` paths keep working.
pub use color_core::{color, image_pipeline, kmeans, merge};

pub mod compose_grid;
pub mod ffmpeg;
pub mod value_analysis;
