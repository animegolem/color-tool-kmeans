use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Runtime};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Clone)]
pub struct FrameExtractRequest {
    pub input_path: PathBuf,
    pub timestamp_seconds: f32,
    pub max_dimension: u32,
    pub output_path: PathBuf,
}

pub async fn ffmpeg_version<R: Runtime>(app: &AppHandle<R>) -> Result<String, String> {
    let (command, path) = build_ffmpeg_command(app)?;
    let output = command
        .args(["-version"])
        .output()
        .await
        .map_err(|e| format!("FFmpeg failed at {}: {e}", path.display()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        let detail = if message.is_empty() {
            "FFmpeg exited with an error".to_string()
        } else {
            message.to_string()
        };
        return Err(detail);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.lines().next().unwrap_or("").to_string())
}

pub async fn ffprobe_details<R: Runtime>(
    app: &AppHandle<R>,
    input_path: &Path,
) -> Result<(f32, Option<f32>), String> {
    let (command, path) = build_ffprobe_command(app)?;
    let output = command
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "format=duration",
            "-show_entries",
            "stream=avg_frame_rate,r_frame_rate",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            input_path.to_string_lossy().as_ref(),
        ])
        .output()
        .await
        .map_err(|e| format!("FFprobe failed at {}: {e}", path.display()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        let detail = if message.is_empty() {
            "FFprobe exited with an error".to_string()
        } else {
            message.to_string()
        };
        return Err(detail);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut duration: Option<f32> = None;
    let mut fps: Option<f32> = None;
    for line in stdout.lines() {
        let value = line.trim();
        if value.is_empty() {
            continue;
        }
        if duration.is_none() {
            if let Ok(parsed) = value.parse::<f32>() {
                duration = Some(parsed);
                continue;
            }
        }
        if fps.is_none() {
            if let Some(parsed) = parse_frame_rate(value) {
                fps = Some(parsed);
            }
        }
    }
    let duration = duration.ok_or_else(|| "FFprobe returned invalid duration".to_string())?;
    Ok((duration, fps))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StripMode {
    Filmstrip,
    Barcode,
}

#[derive(Debug, Clone)]
pub struct StripExtractRequest {
    pub input_path: PathBuf,
    pub duration_seconds: f32,
    pub thumb_count: u32,
    pub thumb_width: u32,
    pub thumb_height: u32,
    pub output_path: PathBuf,
    pub strip_mode: StripMode,
}

pub async fn extract_strip_png<R: Runtime>(
    app: &AppHandle<R>,
    req: &StripExtractRequest,
) -> Result<(), String> {
    if req.input_path.as_os_str().is_empty() {
        return Err("Missing input path".into());
    }
    if req.thumb_count == 0 || req.thumb_height == 0 {
        return Err("Invalid thumbnail dimensions".into());
    }
    if req.strip_mode == StripMode::Filmstrip && req.thumb_width == 0 {
        return Err("Invalid thumbnail width".into());
    }
    ensure_parent_dir(&req.output_path)?;

    let source_fps = if req.strip_mode == StripMode::Barcode {
        ffprobe_details(app, &req.input_path)
            .await
            .ok()
            .and_then(|(_, fps)| fps)
    } else {
        None
    };
    let filter = build_strip_filter(req, source_fps);

    let (command, path) = build_ffmpeg_command(app)?;
    let output = command
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            req.input_path.to_string_lossy().as_ref(),
            "-frames:v",
            "1",
            "-vf",
            &filter,
            "-y",
            req.output_path.to_string_lossy().as_ref(),
        ])
        .output()
        .await
        .map_err(|e| format!("FFmpeg failed at {}: {e}", path.display()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        let detail = if message.is_empty() {
            "FFmpeg exited with an error".to_string()
        } else {
            message.to_string()
        };
        return Err(detail);
    }

    prune_sibling_pngs(&req.output_path, "video-strip-", 10);
    Ok(())
}

fn build_strip_filter(req: &StripExtractRequest, source_fps: Option<f32>) -> String {
    match req.strip_mode {
        StripMode::Barcode => {
            // Barcode: scale each frame to 1px wide, then tile into Nx1.
            // Unknown frame rates are sampled defensively so the tile cannot
            // silently consume only the first `thumb_count` decoded frames.
            let needs_fps = req.duration_seconds > 0.0
                && req.thumb_count > 0
                && source_fps
                    .map(|fps| (req.thumb_count as f32) < req.duration_seconds * fps * 0.95)
                    .unwrap_or(true);
            if needs_fps {
                let fps = (req.thumb_count as f32 / req.duration_seconds).max(0.1);
                format!(
                    "fps={fps:.5},scale=1:{h}:flags=area,tile={count}x1",
                    h = req.thumb_height,
                    count = req.thumb_count
                )
            } else {
                format!(
                    "scale=1:{h}:flags=area,tile={count}x1",
                    h = req.thumb_height,
                    count = req.thumb_count
                )
            }
        }
        StripMode::Filmstrip => {
            let fps = if req.duration_seconds > 0.0 {
                (req.thumb_count as f32 / req.duration_seconds).max(0.1)
            } else {
                0.1
            };
            format!(
                "fps={fps:.5},scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,tile={count}x1",
                w = req.thumb_width,
                h = req.thumb_height,
                count = req.thumb_count
            )
        }
    }
}

pub async fn extract_frame_png<R: Runtime>(
    app: &AppHandle<R>,
    req: &FrameExtractRequest,
) -> Result<String, String> {
    // CLI contract: ffmpeg -ss <timestamp> -i <input> -frames:v 1 -vf scale=W:H -y <output.png>
    if req.input_path.as_os_str().is_empty() {
        return Err("Missing input path".into());
    }
    if req.max_dimension == 0 {
        return Err("Invalid output size".into());
    }
    ensure_parent_dir(&req.output_path)?;
    let timestamp = format!("{:.3}", req.timestamp_seconds.max(0.0));
    let scale = build_frame_scale_filter(req.max_dimension);
    let (command, path) = build_ffmpeg_command(app)?;
    let output = command
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            &timestamp,
            "-i",
            req.input_path.to_string_lossy().as_ref(),
            "-frames:v",
            "1",
            "-vf",
            &scale,
            "-compression_level",
            "1",
            "-y",
            req.output_path.to_string_lossy().as_ref(),
        ])
        .output()
        .await
        .map_err(|e| format!("FFmpeg failed at {}: {e}", path.display()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = stderr.trim();
        let detail = if message.is_empty() {
            "FFmpeg exited with an error".to_string()
        } else {
            message.to_string()
        };
        return Err(detail);
    }

    prune_sibling_pngs(&req.output_path, "video-frame-", 80);
    Ok(timestamp)
}

fn build_frame_scale_filter(max_dimension: u32) -> String {
    // `force_original_aspect_ratio=decrease` constrains the output box but
    // does not prevent upscaling. Cap each input axis explicitly so a 720p
    // frame is not expanded into a multi-megapixel PNG before analysis.
    format!(
        "scale=min(iw\\,{max_dimension}):min(ih\\,{max_dimension}):force_original_aspect_ratio=decrease:flags=lanczos"
    )
}

fn prune_sibling_pngs(output_path: &Path, prefix: &str, keep: usize) {
    let Some(directory) = output_path.parent() else {
        return;
    };
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };
    let mut artifacts: Vec<(PathBuf, std::time::SystemTime)> = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            let name = path.file_name()?.to_str()?;
            if !name.starts_with(prefix) || !name.ends_with(".png") {
                return None;
            }
            let modified = entry
                .metadata()
                .and_then(|metadata| metadata.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            Some((path, modified))
        })
        .collect();
    artifacts.sort_by_key(|(_, modified)| *modified);

    let mut to_remove = artifacts.len().saturating_sub(keep.max(1));
    for (path, _) in artifacts {
        if to_remove == 0 {
            break;
        }
        if path == output_path {
            continue;
        }
        if fs::remove_file(path).is_ok() {
            to_remove -= 1;
        }
    }
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create folder: {e}"))?;
    }
    Ok(())
}

fn build_ffmpeg_command<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<(tauri_plugin_shell::process::Command, PathBuf), String> {
    let path = resolve_binary_path("ffmpeg")?;
    Ok((app.shell().command(path.clone()), path))
}

fn build_ffprobe_command<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<(tauri_plugin_shell::process::Command, PathBuf), String> {
    let path = resolve_binary_path("ffprobe")?;
    Ok((app.shell().command(path.clone()), path))
}

fn resolve_binary_path(name: &str) -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| format!("Failed to resolve current exe: {e}"))?;
    let exe_dir = exe
        .parent()
        .ok_or_else(|| "Missing executable directory".to_string())?;
    let mut candidates = vec![
        exe_dir.join(name),
        exe_dir.join(format!("{name}.exe")),
        exe_dir.join("bin").join(name),
        exe_dir.join("bin").join(format!("{name}.exe")),
    ];

    let mut dev_bin = None;
    if let Some(candidate) = exe_dir
        .parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("bin"))
    {
        let suffix = target_suffix();
        candidates.push(candidate.join(format!("{name}-{suffix}")));
        candidates.push(candidate.join(format!("{name}-{suffix}.exe")));
        dev_bin = Some(candidate);
    }

    if let Some(path) = candidates.iter().find(|path| path.exists()) {
        return Ok(path.to_path_buf());
    }

    if let Some(dev_bin) = dev_bin {
        if let Ok(found) = find_any_binary(&dev_bin, name) {
            return Ok(found);
        }
    }

    let tried = candidates
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join(", ");
    Err(format!("{name} binary not found. Tried: {tried}"))
}

fn target_suffix() -> &'static str {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        return "aarch64-apple-darwin";
    }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    {
        return "x86_64-apple-darwin";
    }
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    {
        return "x86_64-unknown-linux-gnu";
    }
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    {
        return "aarch64-unknown-linux-gnu";
    }
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        return "x86_64-pc-windows-msvc";
    }
    #[allow(unreachable_code)]
    "unknown"
}

fn find_any_binary(dir: &Path, bin_name: &str) -> Result<PathBuf, String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read {dir:?}: {e}"))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read {dir:?} entry: {e}"))?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let filename = entry.file_name().to_string_lossy().to_string();
        let prefix = format!("{bin_name}-");
        if filename.starts_with(&prefix)
            || filename == bin_name
            || filename == format!("{bin_name}.exe")
        {
            return Ok(path);
        }
    }
    Err(format!("No {bin_name} binary found in dev bin"))
}

fn parse_frame_rate(value: &str) -> Option<f32> {
    if let Some((num, den)) = value.split_once('/') {
        let num = num.trim().parse::<f32>().ok()?;
        let den = den.trim().parse::<f32>().ok()?;
        if den > 0.0 && num > 0.0 {
            return Some(num / den);
        }
        return None;
    }
    value.trim().parse::<f32>().ok().filter(|v| *v > 0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn barcode_request(duration_seconds: f32, thumb_count: u32) -> StripExtractRequest {
        StripExtractRequest {
            input_path: PathBuf::from("clip.mp4"),
            duration_seconds,
            thumb_count,
            thumb_width: 1,
            thumb_height: 100,
            output_path: PathBuf::from("strip.png"),
            strip_mode: StripMode::Barcode,
        }
    }

    #[test]
    fn aud_014_samples_a_capped_60_fps_barcode_across_the_full_duration() {
        let filter = build_strip_filter(&barcode_request(600.0, 30_000), Some(60.0));

        assert_eq!(filter, "fps=50.00000,scale=1:100:flags=area,tile=30000x1");
    }

    #[test]
    fn frame_scale_filter_caps_both_axes_without_forcing_an_upscale() {
        assert_eq!(
            build_frame_scale_filter(2200),
            "scale=min(iw\\,2200):min(ih\\,2200):force_original_aspect_ratio=decrease:flags=lanczos"
        );
    }
}
