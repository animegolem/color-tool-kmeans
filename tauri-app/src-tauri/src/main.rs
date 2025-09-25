#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Instant;
use tauri::AppHandle;
use tauri_app::color;
use tauri_app::image_pipeline::{prepare_samples, SampleParams};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};
use tauri_plugin_dialog;
use tauri_plugin_shell;

#[derive(Debug, Clone, Copy)]
enum ColorSpace {
    Rgb,
    Hsl,
    Yuv,
    Cielab,
    Cieluv,
}

impl ColorSpace {
    fn parse(s: &str) -> Result<Self, String> {
        match s.to_ascii_uppercase().as_str() {
            "RGB" => Ok(Self::Rgb),
            "HSL" => Ok(Self::Hsl),
            "YUV" => Ok(Self::Yuv),
            "CIELAB" | "LAB" => Ok(Self::Cielab),
            "CIELUV" | "LUV" => Ok(Self::Cieluv),
            other => Err(format!("Unsupported color space '{other}' (RGB|HSL|YUV|CIELAB|CIELUV)")),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzeRequest {
    #[serde(default)]
    path: String,
    // Accept aliases: K|k|clusters
    #[serde(default, alias = "K", alias = "k", alias = "clusters")]
    k: usize,
    #[serde(default)]
    stride: u32,
    #[serde(default, alias = "min_lum")]
    min_lum: u8,
    // Accept aliases: space|color_space
    #[serde(default = "default_space", alias = "color_space")]
    space: String,
    #[serde(default = "default_tol")]
    tol: f32,
    #[serde(default = "default_max_iters", alias = "max_iters")]
    max_iter: u32,
    #[serde(default = "default_seed")]
    seed: u64,
    #[serde(default = "default_max_samples")]
    max_samples: usize,
}

fn default_space() -> String {
    "CIELAB".into()
}
fn default_tol() -> f32 {
    1e-3
}
fn default_max_iters() -> u32 {
    40
}
fn default_seed() -> u64 {
    1
}
fn default_max_samples() -> usize {
    300_000
}

#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
struct RgbValue {
    r: u8,
    g: u8,
    b: u8,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ClusterOut {
    count: usize,
    share: f64,
    centroid_space: [f32; 3],
    rgb: RgbValue,
    hsv: [f32; 3],
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzeResponse {
    clusters: Vec<ClusterOut>,
    iterations: usize,
    duration_ms: f64,
    total_samples: usize,
    variant: String,
}

#[tauri::command]
async fn analyze_image(req: AnalyzeRequest, _app: AppHandle) -> Result<AnalyzeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let k = if req.k == 0 { 16 } else { req.k };
    let space = ColorSpace::parse(&req.space)?;

    // 1) Sampling
    let sample_params = SampleParams {
        path: PathBuf::from(&req.path),
        stride: req.stride.max(1),
        min_lum: req.min_lum,
        max_samples: req.max_samples.max(1),
        max_dimension: Some(3200),
        seed: req.seed,
    };
    let samples = prepare_samples(&sample_params).map_err(|e| format!("Sampling failed: {e}"))?;
    if samples.sampled_pixels == 0 {
        return Err("No pixels met sampling criteria (check stride/minLum)".into());
    }

    // 2) Build working dataset in requested space
    let dataset: Vec<[f32; 3]> = match space {
        ColorSpace::Cielab => {
            if let Some(lab) = &samples.samples_lab {
                lab.clone()
            } else {
                samples
                    .samples
                    .iter()
                    .map(|&rgb| color::rgb8_to_lab(rgb))
                    .collect()
            }
        }
        ColorSpace::Rgb => samples
            .samples
            .iter()
            .map(|&rgb| [rgb[0] as f32, rgb[1] as f32, rgb[2] as f32])
            .collect(),
        ColorSpace::Hsl => samples
            .samples
            .iter()
            .map(|&rgb| color::rgb8_to_hsl(rgb))
            .collect(),
        ColorSpace::Yuv => samples
            .samples
            .iter()
            .map(|&rgb| color::rgb8_to_yuv(rgb))
            .collect(),
        ColorSpace::Cieluv => samples
            .samples
            .iter()
            .map(|&rgb| color::rgb8_to_luv(rgb))
            .collect(),
    };

    let effective_k = k.min(dataset.len().max(1));

    // 3) Run k-means
    let cfg = KMeansConfig {
        k: effective_k,
        max_iters: req.max_iter as usize,
        tol: req.tol,
        seed: req.seed,
        warm_start: None,
        mini_batch: None,
    };
    let start = Instant::now();
    let result = run_kmeans(&dataset, &cfg);
    let duration_ms = start.elapsed().as_secs_f64() * 1000.0;

    // 4) Build clusters; convert centroid to RGB and HSV
    let mut clusters: Vec<ClusterOut> = result
        .centroids
        .iter()
        .zip(result.counts.iter())
        .filter_map(|(centroid, &count)| {
            if count == 0 {
                return None;
            }
            let rgb_u8 = match space {
                ColorSpace::Rgb => [
                    clamp_channel(centroid[0]),
                    clamp_channel(centroid[1]),
                    clamp_channel(centroid[2]),
                ],
                ColorSpace::Hsl => color::hsl_to_rgb8(*centroid),
                ColorSpace::Yuv => color::yuv_to_rgb8(*centroid),
                ColorSpace::Cielab => color::lab_to_rgb8(*centroid),
                ColorSpace::Cieluv => color::luv_to_rgb8(*centroid),
            };
            let rgb = RgbValue {
                r: rgb_u8[0],
                g: rgb_u8[1],
                b: rgb_u8[2],
            };
            let hsv = color::rgb8_to_hsv(rgb_u8);
            Some(ClusterOut {
                count,
                share: (count as f64) / (samples.sampled_pixels as f64),
                centroid_space: *centroid,
                rgb,
                hsv,
            })
        })
        .collect();
    clusters.sort_by(|a, b| b.count.cmp(&a.count));

    Ok(AnalyzeResponse {
        clusters,
        iterations: result.iterations,
        duration_ms,
        total_samples: samples.sampled_pixels,
        variant: "inhouse".into(),
    })
}

fn clamp_channel(value: f32) -> u8 {
    value.round().clamp(0.0, 255.0) as u8
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![analyze_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
