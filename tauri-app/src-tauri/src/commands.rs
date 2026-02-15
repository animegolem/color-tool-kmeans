use std::path::{Path, PathBuf};
use std::time::Instant;
use tauri::{AppHandle, Manager};

use tauri_app::color;
use tauri_app::ffmpeg;
use tauri_app::image_pipeline::{prepare_samples, quality_preset, SampleParams};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};

use crate::cache::EventLog;
use crate::commands_types::*;
use crate::merge::{merge_clusters_by_threshold, RawCluster};

#[tauri::command]
pub async fn analyze_image(
    req: AnalyzeRequest,
    _app: AppHandle,
) -> Result<AnalyzeResponse, String> {
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
pub async fn value_analysis(
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
pub async fn save_file(req: SaveFileRequest) -> Result<SaveFileResponse, String> {
    let path = std::path::PathBuf::from(&req.path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Cannot create directory: {e}"))?;
        }
    }
    std::fs::write(&path, &req.data).map_err(|e| format!("Failed to write file: {e}"))?;
    Ok(SaveFileResponse {
        path: path.display().to_string(),
    })
}

#[tauri::command]
pub async fn log_event(req: LogEventRequest, app: AppHandle) -> Result<(), String> {
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
pub async fn open_image_dialog(app: AppHandle) -> Result<Option<String>, String> {
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
pub async fn open_video_dialog(app: AppHandle) -> Result<Option<String>, String> {
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
pub async fn extract_video_frame(
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
pub async fn probe_video(
    req: VideoProbeRequest,
    app: AppHandle,
) -> Result<VideoProbeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let (duration, fps) = ffmpeg::ffprobe_details(&app, Path::new(&req.path)).await?;
    Ok(VideoProbeResponse { duration, fps })
}

#[tauri::command]
pub async fn extract_video_strip(
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
pub async fn ffmpeg_version(app: AppHandle) -> Result<String, String> {
    ffmpeg::ffmpeg_version(&app).await
}
