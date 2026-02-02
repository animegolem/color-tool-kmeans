#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{Local, SecondsFormat};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tauri_app::color;
use tauri_app::ffmpeg;
use tauri_app::image_pipeline::{prepare_samples, quality_preset, SampleParams};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};
use tauri_app::value_study::{generate_value_study, ValueStudyResult};

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
    #[serde(default, alias = "mergeThreshold", alias = "merge_threshold")]
    merge_threshold: f32,
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

#[derive(Debug, Clone, Copy)]
struct RawCluster {
    centroid: [f32; 3],
    count: usize,
}

#[derive(Debug, Clone, Copy)]
struct MergeCluster {
    centroid: [f32; 3],
    count: usize,
    radius: f32,
}

fn merge_clusters_by_threshold(clusters: Vec<RawCluster>, threshold: f32) -> Vec<RawCluster> {
    let count = clusters.len();
    if count < 2 || threshold <= 0.0 {
        return clusters;
    }

    let mut working: Vec<MergeCluster> = clusters
        .into_iter()
        .map(|cluster| MergeCluster {
            centroid: cluster.centroid,
            count: cluster.count,
            radius: 0.0,
        })
        .collect();

    loop {
        let len = working.len();
        if len < 2 {
            break;
        }

        let mut pairs: Vec<(f32, usize, usize)> = Vec::new();
        for i in 0..len {
            let ci = working[i].centroid;
            for j in (i + 1)..len {
                let cj = working[j].centroid;
                let dist = centroid_distance(ci, cj);
                let guarded = dist + working[i].radius + working[j].radius;
                if guarded <= threshold {
                    pairs.push((dist, i, j));
                }
            }
        }

        if pairs.is_empty() {
            break;
        }

        pairs.sort_by(|a, b| {
            a.0.partial_cmp(&b.0)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.1.cmp(&b.1))
                .then_with(|| a.2.cmp(&b.2))
        });

        let mut merged_flags = vec![false; len];
        let mut next: Vec<MergeCluster> = Vec::with_capacity(len);

        for (_dist, i, j) in pairs {
            if merged_flags[i] || merged_flags[j] {
                continue;
            }
            let a = working[i];
            let b = working[j];
            let total = (a.count + b.count) as f32;
            let inv = 1.0 / total;
            let centroid = [
                (a.centroid[0] * a.count as f32 + b.centroid[0] * b.count as f32) * inv,
                (a.centroid[1] * a.count as f32 + b.centroid[1] * b.count as f32) * inv,
                (a.centroid[2] * a.count as f32 + b.centroid[2] * b.count as f32) * inv,
            ];
            let radius = {
                let dist_a = centroid_distance(a.centroid, centroid);
                let dist_b = centroid_distance(b.centroid, centroid);
                (a.radius + dist_a).max(b.radius + dist_b)
            };
            next.push(MergeCluster {
                centroid,
                count: a.count + b.count,
                radius,
            });
            merged_flags[i] = true;
            merged_flags[j] = true;
        }

        for (idx, cluster) in working.iter().enumerate() {
            if !merged_flags[idx] {
                next.push(*cluster);
            }
        }

        if next.len() == len {
            break;
        }
        working = next;
    }

    let mut merged: Vec<RawCluster> = working
        .into_iter()
        .map(|cluster| RawCluster {
            centroid: cluster.centroid,
            count: cluster.count,
        })
        .collect();
    merged.sort_by(|a, b| b.count.cmp(&a.count));
    merged
}

fn centroid_distance(a: [f32; 3], b: [f32; 3]) -> f32 {
    let dx = a[0] - b[0];
    let dy = a[1] - b[1];
    let dz = a[2] - b[2];
    (dx * dx + dy * dy + dz * dz).sqrt()
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
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)
        {
            let _ = file.write_all(line.as_bytes());
        }
    }
}

fn build_log_path(cache_dir: &Path) -> PathBuf {
    let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    cache_dir.join(format!("event-log-{timestamp}.txt"))
}

fn prune_event_logs(cache_dir: &Path, keep: usize, current: &Path) {
    let Ok(entries) = fs::read_dir(cache_dir) else {
        return;
    };
    let mut logs: Vec<(PathBuf, std::time::SystemTime)> = entries
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let path = entry.path();
            let name = path.file_name()?.to_string_lossy();
            if !name.starts_with("event-log") || !name.ends_with(".txt") {
                return None;
            }
            let modified = entry
                .metadata()
                .and_then(|meta| meta.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            Some((path, modified))
        })
        .collect();

    logs.sort_by_key(|(_, modified)| *modified);
    let mut to_remove = logs.len().saturating_sub(keep);
    for (path, _) in logs {
        if to_remove == 0 {
            break;
        }
        if path == current {
            continue;
        }
        let _ = fs::remove_file(&path);
        to_remove -= 1;
    }
}

fn prune_video_cache(cache_dir: &Path, keep_frames: usize, keep_strips: usize) {
    let Ok(entries) = fs::read_dir(cache_dir) else {
        return;
    };
    let mut frames: Vec<(PathBuf, std::time::SystemTime)> = Vec::new();
    let mut strips: Vec<(PathBuf, std::time::SystemTime)> = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let name = match path.file_name().map(|n| n.to_string_lossy()) {
            Some(name) => name,
            None => continue,
        };
        if !name.ends_with(".png") {
            continue;
        }
        if name.starts_with("video-frame-") {
            let modified = entry
                .metadata()
                .and_then(|meta| meta.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            frames.push((path, modified));
        } else if name.starts_with("video-strip-") {
            let modified = entry
                .metadata()
                .and_then(|meta| meta.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            strips.push((path, modified));
        }
    }

    frames.sort_by_key(|(_, modified)| *modified);
    strips.sort_by_key(|(_, modified)| *modified);

    let mut to_remove = frames.len().saturating_sub(keep_frames);
    for (path, _) in frames {
        if to_remove == 0 {
            break;
        }
        let _ = fs::remove_file(&path);
        to_remove -= 1;
    }

    let mut to_remove = strips.len().saturating_sub(keep_strips);
    for (path, _) in strips {
        if to_remove == 0 {
            break;
        }
        let _ = fs::remove_file(&path);
        to_remove -= 1;
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
    histogram_bins: Vec<u32>,
    levels: usize,
    notan_mode: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VideoFrameRequest {
    path: String,
    frame_id: String,
    timestamp: f32,
    max_dimension: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoFrameResponse {
    path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VideoProbeRequest {
    path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoProbeResponse {
    duration: f32,
    fps: Option<f32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VideoStripRequest {
    path: String,
    strip_id: String,
    duration: f32,
    thumb_count: u32,
    thumb_width: u32,
    thumb_height: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoStripResponse {
    path: String,
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

    // 4) Build clusters; apply merge threshold; convert centroid to RGB and HSV
    let mut raw_clusters: Vec<RawCluster> = result
        .centroids
        .iter()
        .zip(result.counts.iter())
        .filter_map(|(centroid, &count)| {
            if count == 0 {
                return None;
            }
            Some(RawCluster {
                centroid: *centroid,
                count,
            })
        })
        .collect();
    let merge_threshold = req.merge_threshold.clamp(0.0, 0.2);
    if merge_threshold > 0.0 {
        let before_count = raw_clusters.len();
        raw_clusters = merge_clusters_by_threshold(raw_clusters, merge_threshold);
        let after_count = raw_clusters.len();
        println!(
            "[analyze_image] merge_threshold={:.3} clusters={} -> {}",
            merge_threshold, before_count, after_count
        );
    } else {
        raw_clusters.sort_by(|a, b| b.count.cmp(&a.count));
    }

    let mut clusters: Vec<ClusterOut> = raw_clusters
        .into_iter()
        .map(|cluster| {
            let rgb_u8 = color::oklab_to_srgb8_gamut_mapped(cluster.centroid);
            let rgb = RgbValue {
                r: rgb_u8[0],
                g: rgb_u8[1],
                b: rgb_u8[2],
            };
            let oklab = cluster.centroid;
            let oklch = color::oklab_to_oklch(cluster.centroid);
            let hsv = color::rgb8_to_hsv(rgb_u8);
            ClusterOut {
                count: cluster.count,
                share: (cluster.count as f64) / (samples.sampled_pixels as f64),
                centroid_space: cluster.centroid,
                oklab,
                oklch,
                rgb,
                hsv,
            }
        })
        .collect();
    clusters.sort_by(|a, b| b.count.cmp(&a.count));
    let ignore_top_n = req.ignore_top_n.min(clusters.len().saturating_sub(1));
    if ignore_top_n > 0 {
        clusters = clusters.into_iter().skip(ignore_top_n).collect();
    }

    let variant = if merge_threshold > 0.0 {
        "inhouse+merge"
    } else {
        "inhouse"
    };

    Ok(AnalyzeResponse {
        clusters,
        iterations: result.iterations,
        duration_ms,
        total_samples: samples.sampled_pixels,
        variant: variant.into(),
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
        histogram_bins,
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
        histogram_bins,
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
    let source = req.source.unwrap_or_else(|| String::from("renderer"));
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
    let path = rx
        .recv()
        .map_err(|_| String::from("dialog channel closed"))?;
    Ok(path)
}

#[tauri::command]
async fn open_video_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let (tx, rx) = std::sync::mpsc::channel::<Option<String>>();
    app.dialog()
        .file()
        .add_filter("Videos", &["mp4"])
        .pick_file(move |p| {
            let mapped = p.map(|fp| match fp {
                FilePath::Path(pb) => pb.display().to_string(),
                FilePath::Url(u) => u.to_string(),
            });
            let _ = tx.send(mapped);
        });
    let path = rx
        .recv()
        .map_err(|_| String::from("dialog channel closed"))?;
    Ok(path)
}

#[tauri::command]
async fn extract_video_frame(
    req: VideoFrameRequest,
    app: AppHandle,
) -> Result<VideoFrameResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|_| String::from("Failed to resolve cache directory"))?;
    let safe_id: String = req
        .frame_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if safe_id.is_empty() {
        return Err("Invalid frame id".into());
    }
    let max_dimension = req.max_dimension.clamp(80, 4096);
    let output_path = cache_dir.join(format!("video-frame-{safe_id}.png"));
    let frame_req = ffmpeg::FrameExtractRequest {
        input_path: PathBuf::from(&req.path),
        timestamp_seconds: req.timestamp.max(0.0),
        max_dimension,
        output_path: output_path.clone(),
    };
    ffmpeg::extract_frame_png(&app, &frame_req).await?;
    Ok(VideoFrameResponse {
        path: output_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn probe_video(req: VideoProbeRequest, app: AppHandle) -> Result<VideoProbeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let (duration, fps) = ffmpeg::ffprobe_details(&app, Path::new(&req.path)).await?;
    Ok(VideoProbeResponse { duration, fps })
}

#[tauri::command]
async fn extract_video_strip(
    req: VideoStripRequest,
    app: AppHandle,
) -> Result<VideoStripResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|_| String::from("Failed to resolve cache directory"))?;
    let safe_id: String = req
        .strip_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if safe_id.is_empty() {
        return Err("Invalid strip id".into());
    }
    let thumb_count = req.thumb_count.clamp(8, 120);
    let thumb_width = req.thumb_width.clamp(32, 240);
    let thumb_height = req.thumb_height.clamp(24, 200);
    let output_path = cache_dir.join(format!("video-strip-{safe_id}.png"));
    let strip_req = ffmpeg::StripExtractRequest {
        input_path: PathBuf::from(&req.path),
        duration_seconds: req.duration.max(0.0),
        thumb_count,
        thumb_width,
        thumb_height,
        output_path: output_path.clone(),
    };
    ffmpeg::extract_strip_png(&app, &strip_req).await?;
    Ok(VideoStripResponse {
        path: output_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn ffmpeg_version(app: AppHandle) -> Result<String, String> {
    ffmpeg::ffmpeg_version(&app).await
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let cache_dir = app
                .path()
                .app_cache_dir()
                .map_err(|_| String::from("Failed to resolve cache directory"))?;
            let log_path = build_log_path(&cache_dir);
            let logger = EventLog { path: log_path };
            logger.append("[system] app setup");
            prune_event_logs(&cache_dir, 5, &logger.path);
            prune_video_cache(&cache_dir, 80, 10);
            app.manage(logger);
            let heartbeat_path = app.state::<EventLog>().path.clone();
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
            open_image_dialog,
            open_video_dialog,
            extract_video_frame,
            probe_video,
            extract_video_strip,
            ffmpeg_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_pattern_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("..")
            .join("test-patterns")
            .join(name)
    }

    fn run_merge_on(path: PathBuf, threshold: f32) -> (usize, usize) {
        assert!(path.exists(), "missing test pattern: {:?}", path);
        let params = SampleParams {
            path,
            stride: 2,
            min_lum: 0,
            max_samples: 120_000,
            max_dimension: Some(512),
            seed: 7,
        };
        let samples = prepare_samples(&params).expect("samples");
        let dataset: Vec<[f32; 3]> = if let Some(lab) = &samples.samples_oklab {
            lab.clone()
        } else {
            samples
                .samples
                .iter()
                .map(|&rgb| color::rgb8_to_oklab(rgb))
                .collect()
        };
        let k = 12.min(dataset.len().max(1));
        let cfg = KMeansConfig {
            k,
            max_iters: 40,
            tol: 1e-3,
            seed: 1,
            warm_start: None,
            mini_batch: None,
        };
        let result = run_kmeans(&dataset, &cfg);
        let raw_clusters: Vec<RawCluster> = result
            .centroids
            .iter()
            .zip(result.counts.iter())
            .filter_map(|(centroid, &count)| {
                if count == 0 {
                    return None;
                }
                Some(RawCluster {
                    centroid: *centroid,
                    count,
                })
            })
            .collect();
        let before = raw_clusters.len();
        let merged = merge_clusters_by_threshold(raw_clusters, threshold);
        let after = merged.len();
        println!(
            "[merge-test] {:?} before={} after={}",
            params.path, before, after
        );
        (before, after)
    }

    #[test]
    fn merge_threshold_on_grey_pattern() {
        let (before, after) = run_merge_on(test_pattern_path("grey.gif"), 0.1);
        assert!(before >= 1);
        assert!(after >= 1);
        assert!(after <= before);
    }

    #[test]
    fn merge_threshold_on_hsl_lightness_pattern() {
        let (before, after) = run_merge_on(test_pattern_path("hsl_ligthness.png"), 0.06);
        assert!(before >= 1);
        assert!(after >= 1);
        assert!(after <= before);
    }
}
