use serde::{Deserialize, Serialize};

pub fn default_tol() -> f32 {
    1e-3
}
pub fn default_max_iters() -> u32 {
    40
}
pub fn default_seed() -> u64 {
    1
}
pub fn default_max_samples() -> usize {
    300_000
}
pub fn default_value_levels() -> usize {
    3
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeRequest {
    #[serde(default)]
    pub path: String,
    #[serde(default, alias = "K", alias = "k", alias = "clusters")]
    pub k: usize,
    #[serde(default)]
    pub stride: u32,
    #[serde(default)]
    pub quality: Option<i8>,
    #[serde(default, alias = "ignoreTopN", alias = "ignore_top_n")]
    pub ignore_top_n: usize,
    #[serde(default, alias = "mergeThreshold", alias = "merge_threshold")]
    pub merge_threshold: f32,
    #[serde(default, alias = "min_lum")]
    pub min_lum: u8,
    #[serde(default = "default_tol")]
    pub tol: f32,
    #[serde(default = "default_max_iters", alias = "max_iters")]
    pub max_iter: u32,
    #[serde(default = "default_seed")]
    pub seed: u64,
    #[serde(default = "default_max_samples")]
    pub max_samples: usize,
    #[serde(default, alias = "snap_to_real")]
    pub snap_to_real: bool,
}

#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub struct RgbValue {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClusterOut {
    pub count: usize,
    pub share: f64,
    pub centroid_space: [f32; 3],
    pub oklab: [f32; 3],
    pub oklch: [f32; 3],
    pub rgb: RgbValue,
    pub hsv: [f32; 3],
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeResponse {
    pub clusters: Vec<ClusterOut>,
    pub iterations: usize,
    pub duration_ms: f64,
    pub total_samples: usize,
    pub variant: String,
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
