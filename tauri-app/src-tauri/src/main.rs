#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

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
}

fn default_space() -> String {
    "HSL".into()
}

#[tauri::command]
async fn analyze_image(req: AnalyzeRequest, _app: AppHandle) -> Result<AnalyzeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    Ok(AnalyzeResponse {
        message: format!(
            "Analysis placeholder for {} (K={}, stride={})",
            req.path, req.clusters, req.stride
        ),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![analyze_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
