use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use color_core::analyze::ImageSource;
use tauri_app::compose_grid;
use tauri_app::ffmpeg;
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};

use crate::cache::EventLog;
use crate::commands_types::*;

#[tauri::command]
pub async fn analyze_image(
    req: AnalyzeRequest,
    _app: AppHandle,
) -> Result<AnalyzeResponse, String> {
    if req.path.is_empty() {
        return Err("No file selected".into());
    }
    let path = PathBuf::from(&req.path);
    color_core::analyze(&req, ImageSource::Path(&path)).map_err(|e| e.to_string())
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
pub async fn copy_file(req: CopyFileRequest) -> Result<CopyFileResponse, String> {
    let source = std::path::PathBuf::from(&req.source);
    let dest = std::path::PathBuf::from(&req.dest);
    if let Some(parent) = dest.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Cannot create directory: {e}"))?;
        }
    }
    std::fs::copy(&source, &dest).map_err(|e| format!("Failed to copy file: {e}"))?;
    Ok(CopyFileResponse {
        path: dest.display().to_string(),
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
    let timestamp_used = ffmpeg::extract_frame_png(&app, &frame_req).await?;
    Ok(VideoFrameResponse {
        path: output_path.to_string_lossy().to_string(),
        timestamp_used,
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
    let is_barcode = req.strip_mode.as_deref() == Some("barcode");
    let strip_mode = if is_barcode {
        ffmpeg::StripMode::Barcode
    } else {
        ffmpeg::StripMode::Filmstrip
    };
    let (thumb_count, thumb_width, thumb_height) = if is_barcode {
        (
            req.thumb_count.clamp(1, 30_000),
            1_u32,
            req.thumb_height.clamp(60, 300),
        )
    } else {
        (
            req.thumb_count.clamp(8, 120),
            req.thumb_width.clamp(32, 240),
            req.thumb_height.clamp(24, 200),
        )
    };
    let output_path = cache_dir.join(format!("video-strip-{safe_id}.png"));
    let strip_req = ffmpeg::StripExtractRequest {
        input_path: PathBuf::from(&req.path),
        duration_seconds: req.duration.max(0.0),
        thumb_count,
        thumb_width,
        thumb_height,
        output_path: output_path.clone(),
        strip_mode,
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

#[tauri::command]
pub async fn compose_grid(
    req: ComposeGridRequest,
    app: AppHandle,
) -> Result<ComposeGridResponse, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|_| String::from("Failed to resolve cache directory"))?;
    let max_cell_dim = req.max_cell_dim.unwrap_or(800);
    let (path, width, height, cols, rows) =
        compose_grid::compose_grid(&req.paths, max_cell_dim, &cache_dir)
            .map_err(|e| format!("Grid composition failed: {e}"))?;
    Ok(ComposeGridResponse {
        path: path.to_string_lossy().to_string(),
        width,
        height,
        grid_cols: cols,
        grid_rows: rows,
    })
}
