use serde::{Deserialize, Serialize};

// The analyze IPC contract (request/response shapes, including the nested
// ClusterOut/RgbValue types) is defined by color-core; re-export the parts
// the commands reference so the command surface stays unchanged.
pub use color_core::analyze::{AnalyzeRequest, AnalyzeResponse};

pub fn default_value_levels() -> usize {
    3
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValueAnalysisRequest {
    pub path: String,
    pub image_id: String,
    #[serde(default = "default_value_levels")]
    pub levels: usize,
    #[serde(default)]
    pub notan_mode: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValueAnalysisResponse {
    pub neutral: String,
    pub neutral_width: u32,
    pub neutral_height: u32,
    pub preview: String,
    pub preview_width: u32,
    pub preview_height: u32,
    pub bucket_map: String,
    pub bucket_map_data: Vec<u8>,
    pub p10: f32,
    pub p90: f32,
    pub p01: f32,
    pub p99: f32,
    pub centroids: Vec<f32>,
    pub boundaries: Vec<f32>,
    pub bucket_values: Vec<f32>,
    pub counts: Vec<usize>,
    pub histogram_bins: Vec<u32>,
    pub levels: usize,
    pub notan_mode: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoFrameRequest {
    pub path: String,
    pub frame_id: String,
    pub timestamp: f32,
    pub max_dimension: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoFrameResponse {
    pub path: String,
    pub timestamp_used: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoProbeRequest {
    pub path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoProbeResponse {
    pub duration: f32,
    pub fps: Option<f32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoStripRequest {
    pub path: String,
    pub strip_id: String,
    pub duration: f32,
    pub thumb_count: u32,
    pub thumb_width: u32,
    pub thumb_height: u32,
    #[serde(default)]
    pub strip_mode: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoStripResponse {
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileRequest {
    pub path: String,
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileResponse {
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyFileRequest {
    pub source: String,
    pub dest: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyFileResponse {
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEventRequest {
    pub message: String,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposeGridRequest {
    pub paths: Vec<String>,
    #[serde(default)]
    pub max_cell_dim: Option<u32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposeGridResponse {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub grid_cols: u32,
    pub grid_rows: u32,
}
