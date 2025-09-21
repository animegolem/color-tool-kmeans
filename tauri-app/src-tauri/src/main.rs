#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod image_pipeline;

use image_pipeline::{prepare_samples, SampleParams};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog;
use tauri_plugin_shell;

#[derive(Debug, Deserialize)]
struct AnalyzeRequest {
    #[serde(default)]
    path: String,
    #[serde(default)]
    clusters: usize,
    #[serde(default)]
    stride: u32,
    #[serde(default)]
    min_lum: u8,
    #[serde(default = "default_space")]
    color_space: String,
}

#[derive(Debug, Serialize)]
struct AnalyzeResponse {
    message: String,
    sampled_pixels: usize,
}

fn default_space() -> String {
    "HSL".into()
}

#[tauri::command]
async fn analyze_image(req: AnalyzeRequest, _app: AppHandle) -> Result<AnalyzeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let params = SampleParams {
        path: PathBuf::from(&req.path),
        stride: req.stride.max(1),
        min_lum: req.min_lum,
        max_samples: 100_000,
        max_dimension: Some(3200),
        seed: 1,
    };

    let samples = prepare_samples(&params).map_err(|e| format!("Sampling failed: {e}"))?;

    Ok(AnalyzeResponse {
        message: format!(
            "Sampling succeeded: {} pixels ({}x{}).",
            samples.sampled_pixels, samples.width, samples.height
        ),
        sampled_pixels: samples.sampled_pixels,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![analyze_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
