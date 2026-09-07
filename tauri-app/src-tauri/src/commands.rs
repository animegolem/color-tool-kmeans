use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use color_core::analyze::ImageSource;
use tauri_app::compose_grid;
use tauri_app::ffmpeg;
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};

use crate::cache::EventLog;
use crate::commands_types::*;
use crate::profiling::{ProfileInvocationContext, ProfileState};

async fn run_blocking<T, F>(operation: &'static str, task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|error| format!("{operation} worker failed: {error}"))?
}

#[tauri::command]
pub async fn analyze_image(
    req: AnalyzeRequest,
    profile_context: Option<ProfileInvocationContext>,
    app: AppHandle,
) -> Result<AnalyzeResponse, String> {
    let profiling = app.state::<ProfileState>();
    run_profiled_analysis(req, profile_context, &profiling, analyze_image_sync).await
}

async fn run_profiled_analysis<F>(
    req: AnalyzeRequest,
    profile_context: Option<ProfileInvocationContext>,
    profiling: &ProfileState,
    task: F,
) -> Result<AnalyzeResponse, String>
where
    F: FnOnce(AnalyzeRequest) -> Result<AnalyzeResponse, String> + Send + 'static,
{
    let span = profiling.begin_native(profile_context.as_ref());
    let no_file_selected = req.path.is_empty();
    let result = if no_file_selected {
        Err("No file selected".into())
    } else {
        run_blocking("Analyze image", move || task(req)).await
    };
    // Capture the aggregate endpoint before any return-event serialization or I/O.
    let return_ns = profiling.capture_native_end();
    profiling.finish_native(
        span,
        return_ns,
        if result.is_ok() { "success" } else { "error" },
        if result.is_ok() {
            None
        } else if no_file_selected {
            Some("no-file-selected")
        } else {
            Some("analysis-failed")
        },
    );
    result
}

fn analyze_image_sync(req: AnalyzeRequest) -> Result<AnalyzeResponse, String> {
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
    run_blocking("Value analysis", move || {
        value_analysis_sync(req, cache_dir)
    })
    .await
}

fn value_analysis_sync(
    req: ValueAnalysisRequest,
    cache_dir: PathBuf,
) -> Result<ValueAnalysisResponse, String> {
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
    run_blocking("Save file", move || save_file_sync(req)).await
}

fn save_file_sync(req: SaveFileRequest) -> Result<SaveFileResponse, String> {
    let path = PathBuf::from(&req.path);
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
    run_blocking("Copy file", move || copy_file_sync(req)).await
}

fn copy_file_sync(req: CopyFileRequest) -> Result<CopyFileResponse, String> {
    let source = PathBuf::from(&req.source);
    let dest = PathBuf::from(&req.dest);
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
    run_blocking("Compose grid", move || compose_grid_sync(req, cache_dir)).await
}

fn compose_grid_sync(
    req: ComposeGridRequest,
    cache_dir: PathBuf,
) -> Result<ComposeGridResponse, String> {
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

#[cfg(test)]
mod tests {
    use super::{analyze_image_sync, run_blocking, run_profiled_analysis};
    use crate::commands_types::AnalyzeRequest;
    use crate::profiling::{ProfileInvocationContext, ProfileState};
    use crate::profiling_wire::PROFILE_DIRECTORY;
    use image::{Rgb, RgbImage};
    use serde_json::Value;
    use std::ffi::OsString;
    use std::path::Path;
    use tempfile::TempDir;

    const PROFILE_SESSION: &str = "phase029-commands";
    const RENDERER_CLOCK: &str = "phase029-renderer";

    fn analysis_request(path: impl Into<String>) -> AnalyzeRequest {
        AnalyzeRequest {
            path: path.into(),
            k: 2,
            stride: 1,
            quality: None,
            ignore_top_n: 0,
            merge_threshold: 0.0,
            min_lum: 0,
            tol: 0.001,
            max_iter: 20,
            seed: 1,
            max_samples: 1_000,
            snap_to_real: false,
        }
    }

    fn profile_context(action_id: &str) -> ProfileInvocationContext {
        ProfileInvocationContext {
            session_id: PROFILE_SESSION.into(),
            action_id: action_id.into(),
            renderer_clock_id: RENDERER_CLOCK.into(),
        }
    }

    fn profile_artifact(root: &Path) -> std::path::PathBuf {
        root.join(PROFILE_DIRECTORY)
            .join(format!("profile-{PROFILE_SESSION}.jsonl"))
    }

    fn native_records(root: &Path) -> Vec<Value> {
        std::fs::read_to_string(profile_artifact(root))
            .expect("read profile artifact")
            .lines()
            .map(|line| serde_json::from_str(line).expect("parse profile record"))
            .filter(|record: &Value| record["recordType"] == "native-event")
            .collect()
    }

    #[test]
    fn sweep_029_run_blocking_moves_typed_work_off_the_calling_thread() {
        let caller = std::thread::current().id();
        let (worker, value) =
            tauri::async_runtime::block_on(run_blocking("Test operation", || {
                Ok::<_, String>((std::thread::current().id(), 42_u32))
            }))
            .expect("typed worker result");

        assert_ne!(caller, worker, "blocking work must leave the caller thread");
        assert_eq!(value, 42);

        let error = tauri::async_runtime::block_on(run_blocking("Test operation", || {
            Err::<u32, _>("domain failure".to_string())
        }));
        assert_eq!(error, Err("domain failure".to_string()));
    }

    #[test]
    fn sweep_029_maps_worker_panic_without_panicking_the_awaiting_future() {
        let error = tauri::async_runtime::block_on(run_blocking::<(), _>("Copy file", || {
            panic!("worker panic")
        }))
        .expect_err("panic must become an operation-labelled command error");

        assert!(error.starts_with("Copy file worker failed:"), "{error}");
    }

    #[test]
    fn sweep_029_profiled_analysis_finishes_success_errors_and_worker_panic() {
        let root = TempDir::new().expect("profile root");
        let state = ProfileState::from_launch(root.path(), Some(OsString::from(PROFILE_SESSION)));
        let source = root.path().join("small.png");
        let image = RgbImage::from_fn(8, 8, |x, _| {
            if x < 4 {
                Rgb([255, 0, 0])
            } else {
                Rgb([0, 0, 255])
            }
        });
        image.save(&source).expect("save small source");

        let success = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(source.to_string_lossy()),
            Some(profile_context("phase029-success")),
            &state,
            analyze_image_sync,
        ));
        assert!(success.is_ok());

        let no_file = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(""),
            Some(profile_context("phase029-no-file")),
            &state,
            analyze_image_sync,
        ));
        assert_eq!(
            no_file.expect_err("empty path must fail"),
            "No file selected"
        );

        let invalid = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(root.path().join("missing.png").to_string_lossy()),
            Some(profile_context("phase029-invalid-source")),
            &state,
            analyze_image_sync,
        ));
        assert!(!invalid.expect_err("missing source must fail").is_empty());

        let panic = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(source.to_string_lossy()),
            Some(profile_context("phase029-worker-panic")),
            &state,
            |_| panic!("analysis worker panic"),
        ));
        assert!(panic
            .expect_err("worker panic must be mapped")
            .starts_with("Analyze image worker failed:"));

        let records = native_records(root.path());
        assert_eq!(records.len(), 8, "four actions need receive/return pairs");
        for (action_id, outcome, error_code) in [
            ("phase029-success", "success", Value::Null),
            ("phase029-no-file", "error", Value::from("no-file-selected")),
            (
                "phase029-invalid-source",
                "error",
                Value::from("analysis-failed"),
            ),
            (
                "phase029-worker-panic",
                "error",
                Value::from("analysis-failed"),
            ),
        ] {
            let action_records: Vec<_> = records
                .iter()
                .filter(|record| record["actionId"] == action_id)
                .collect();
            assert_eq!(action_records.len(), 2, "paired action {action_id}");
            assert_eq!(action_records[0]["phase"], "receive");
            assert_eq!(action_records[1]["phase"], "return");
            assert_eq!(action_records[1]["outcome"], outcome);
            assert_eq!(action_records[1]["errorCode"], error_code);
            assert_eq!(action_records[1]["rendererClockId"], RENDERER_CLOCK);
            assert!(action_records[1]["nativeAggregateNs"].is_string());
        }

        let before_missing_context = records.len();
        let missing_context = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(""),
            None,
            &state,
            analyze_image_sync,
        ));
        assert_eq!(
            missing_context.expect_err("empty path remains an error"),
            "No file selected"
        );
        assert_eq!(native_records(root.path()).len(), before_missing_context);

        let disabled_root = TempDir::new().expect("disabled profile root");
        let disabled = ProfileState::from_launch(disabled_root.path(), None);
        let disabled_result = tauri::async_runtime::block_on(run_profiled_analysis(
            analysis_request(""),
            Some(profile_context("phase029-disabled")),
            &disabled,
            analyze_image_sync,
        ));
        assert_eq!(
            disabled_result.expect_err("empty path remains an error"),
            "No file selected"
        );
        assert!(!profile_artifact(disabled_root.path()).exists());
    }
}
