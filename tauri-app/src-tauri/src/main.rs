#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{Local, SecondsFormat};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tauri_app::color;
use tauri_app::image_pipeline::{prepare_samples, quality_preset, SampleParams};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};
use tauri_app::value_study::{generate_value_study, ValueStudyResult};
use tauri_plugin_dialog;
use tauri_plugin_shell;

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
    #[serde(default)]
    quality: Option<i8>,
    #[serde(default, alias = "ignoreTopN", alias = "ignore_top_n")]
    ignore_top_n: usize,
    #[serde(default, alias = "min_lum")]
    min_lum: u8,
    #[serde(default = "default_tol")]
    tol: f32,
    #[serde(default = "default_max_iters", alias = "max_iters")]
    max_iter: u32,
    #[serde(default = "default_seed")]
    seed: u64,
    #[serde(default = "default_max_samples")]
    max_samples: usize,
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
fn default_value_levels() -> usize {
    3
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
    oklab: [f32; 3],
    oklch: [f32; 3],
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

#[derive(Debug)]
struct EventLog {
    path: PathBuf,
}

impl EventLog {
    fn append(&self, message: &str) {
        let timestamp = Local::now().to_rfc3339_opts(SecondsFormat::Millis, false);
        let line = format!("{timestamp} {message}\n");
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&self.path) {
            let _ = file.write_all(line.as_bytes());
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValueStudyRequest {
    path: String,
    image_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ValueStudyResponse {
    tiles: Vec<String>,
    neutral: String,
    width: u32,
    height: u32,
    percentile_low: f32,
    percentile_high: f32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValueAnalysisRequest {
    path: String,
    image_id: String,
    #[serde(default = "default_value_levels")]
    levels: usize,
    #[serde(default)]
    notan_mode: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ValueAnalysisResponse {
    neutral: String,
    neutral_width: u32,
    neutral_height: u32,
    preview: String,
    preview_width: u32,
    preview_height: u32,
    bucket_map: String,
    bucket_map_data: Vec<u8>,
    p10: f32,
    p90: f32,
    p01: f32,
    p99: f32,
    centroids: Vec<f32>,
    boundaries: Vec<f32>,
    bucket_values: Vec<f32>,
    counts: Vec<usize>,
    levels: usize,
    notan_mode: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogEventRequest {
    message: String,
    source: Option<String>,
}

#[tauri::command]
async fn analyze_image(req: AnalyzeRequest, _app: AppHandle) -> Result<AnalyzeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let k = if req.k == 0 { 16 } else { req.k };

    // 1) Sampling
    let (stride, max_samples, max_dimension) = if let Some(quality) = req.quality {
        let preset = quality_preset(quality);
        (preset.stride, preset.max_samples, preset.max_dimension)
    } else {
        (req.stride.max(1), req.max_samples.max(1), Some(3200))
    };
    let sample_params = SampleParams {
        path: PathBuf::from(&req.path),
        stride,
        min_lum: req.min_lum,
        max_samples,
        max_dimension,
        seed: req.seed,
    };
    let samples = prepare_samples(&sample_params).map_err(|e| format!("Sampling failed: {e}"))?;
    if samples.sampled_pixels == 0 {
        return Err("No pixels met sampling criteria (check stride/minLum)".into());
    }

    // 2) Build working dataset in OKLab (perceptual)
    let dataset: Vec<[f32; 3]> = if let Some(lab) = &samples.samples_oklab {
        lab.clone()
    } else {
        samples
            .samples
            .iter()
            .map(|&rgb| color::rgb8_to_oklab(rgb))
            .collect()
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
            let rgb_u8 = color::oklab_to_srgb8_gamut_mapped(*centroid);
            let rgb = RgbValue {
                r: rgb_u8[0],
                g: rgb_u8[1],
                b: rgb_u8[2],
            };
            let oklab = *centroid;
            let oklch = color::oklab_to_oklch(*centroid);
            let hsv = color::rgb8_to_hsv(rgb_u8);
            Some(ClusterOut {
                count,
                share: (count as f64) / (samples.sampled_pixels as f64),
                centroid_space: *centroid,
                oklab,
                oklch,
                rgb,
                hsv,
            })
        })
        .collect();
    clusters.sort_by(|a, b| b.count.cmp(&a.count));
    let ignore_top_n = req.ignore_top_n.min(clusters.len().saturating_sub(1));
    if ignore_top_n > 0 {
        clusters = clusters.into_iter().skip(ignore_top_n).collect();
    }

    Ok(AnalyzeResponse {
        clusters,
        iterations: result.iterations,
        duration_ms,
        total_samples: samples.sampled_pixels,
        variant: "inhouse".into(),
    })
}

#[tauri::command]
async fn value_study(req: ValueStudyRequest, app: AppHandle) -> Result<ValueStudyResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    if req.image_id.trim().is_empty() {
        return Err("Missing image id".into());
    }
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|_| String::from("Failed to resolve cache directory"))?;
    let ValueStudyResult {
        tiles,
        neutral,
        width,
        height,
        percentile_low,
        percentile_high,
    } = generate_value_study(&req.path, &req.image_id, cache_dir)
        .map_err(|e| format!("Value study failed: {e}"))?;
    let tiles = tiles
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect();
    let neutral = neutral.to_string_lossy().to_string();
    Ok(ValueStudyResponse {
        tiles,
        neutral,
        width,
        height,
        percentile_low,
        percentile_high,
    })
}

#[tauri::command]
async fn value_analysis(
    req: ValueAnalysisRequest,
    app: AppHandle,
) -> Result<ValueAnalysisResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    if req.image_id.trim().is_empty() {
        return Err("Missing image id".into());
    }
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|_| String::from("Failed to resolve cache directory"))?;
    let levels = req.levels.clamp(2, 5);
    let notan_mode = req.notan_mode && levels == 2;
    let ValueAnalysisResult {
        neutral,
        neutral_width,
        neutral_height,
        preview,
        preview_width,
        preview_height,
        bucket_map,
        bucket_map_data,
        p10,
        p90,
        p01,
        p99,
        centroids,
        boundaries,
        bucket_values,
        counts,
        notan_mode: analysis_notan_mode,
    } = generate_value_analysis(&req.path, &req.image_id, levels, notan_mode, cache_dir)
        .map_err(|e| format!("Value analysis failed: {e}"))?;
    Ok(ValueAnalysisResponse {
        neutral: neutral.to_string_lossy().to_string(),
        preview: preview.to_string_lossy().to_string(),
        bucket_map: bucket_map.to_string_lossy().to_string(),
        neutral_width,
        neutral_height,
        preview_width,
        preview_height,
        bucket_map_data,
        p10,
        p90,
        p01,
        p99,
        centroids,
        boundaries,
        bucket_values,
        counts,
        levels,
        notan_mode: analysis_notan_mode,
    })
}

#[tauri::command]
async fn log_event(req: LogEventRequest, app: AppHandle) -> Result<(), String> {
    let message = req.message.trim();
    if message.is_empty() {
        return Ok(());
    }
    let source = req
        .source
        .unwrap_or_else(|| String::from("renderer"));
    let log = app.state::<EventLog>();
    log.append(&format!("[{source}] {message}"));
    Ok(())
}

#[tauri::command]
async fn open_image_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let (tx, rx) = std::sync::mpsc::channel::<Option<String>>();
    app.dialog()
        .file()
        .add_filter(
            "Images",
            &["png", "jpg", "jpeg", "webp", "bmp", "gif", "tiff"],
        )
        .pick_file(move |p| {
            let mapped = p.map(|fp| match fp {
                FilePath::Path(pb) => pb.display().to_string(),
                FilePath::Url(u) => u.to_string(),
            });
            let _ = tx.send(mapped);
        });
    let path = rx.recv().map_err(|_| String::from("dialog channel closed"))?;
    Ok(path)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let cache_dir = app
                .path()
                .app_cache_dir()
                .map_err(|_| String::from("Failed to resolve cache directory"))?;
            let log_path = cache_dir.join("event-log.txt");
            let logger = EventLog { path: log_path };
            logger.append("[system] app setup");
            app.manage(logger);
            let heartbeat_path = cache_dir.join("event-log.txt");
            std::thread::spawn(move || {
                let heartbeat = EventLog {
                    path: heartbeat_path,
                };
                loop {
                    std::thread::sleep(Duration::from_secs(10));
                    heartbeat.append("[system] heartbeat");
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(focused) = event {
                let log = window.app_handle().state::<EventLog>();
                log.append(&format!("[system] window focused={focused}"));
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            analyze_image,
            value_study,
            value_analysis,
            log_event,
            open_image_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
