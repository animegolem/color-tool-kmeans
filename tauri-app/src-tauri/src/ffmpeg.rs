use std::path::{Path, PathBuf};
use std::{fs, io};
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

#[derive(Debug, Clone)]
pub struct StripExtractRequest {
    pub input_path: PathBuf,
    pub duration_seconds: f32,
    pub thumb_count: u32,
    pub thumb_width: u32,
    pub thumb_height: u32,
    pub output_path: PathBuf,
}

pub async fn extract_strip_png<R: Runtime>(
    app: &AppHandle<R>,
    req: &StripExtractRequest,
) -> Result<(), String> {
    if req.input_path.as_os_str().is_empty() {
        return Err("Missing input path".into());
    }
    if req.thumb_count == 0 || req.thumb_width == 0 || req.thumb_height == 0 {
        return Err("Invalid thumbnail dimensions".into());
    }
    ensure_parent_dir(&req.output_path)?;
    let fps = if req.duration_seconds > 0.0 {
        (req.thumb_count as f32 / req.duration_seconds).max(0.1)
    } else {
        0.1
    };
    let filter = format!(
        "fps={fps:.5},scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,tile={count}x1",
        w = req.thumb_width,
        h = req.thumb_height,
        count = req.thumb_count
    );
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

    Ok(())
}

pub async fn extract_frame_png<R: Runtime>(
    app: &AppHandle<R>,
    req: &FrameExtractRequest,
) -> Result<(), String> {
    // CLI contract: ffmpeg -ss <timestamp> -i <input> -frames:v 1 -vf scale=W:H -y <output.png>
    if req.input_path.as_os_str().is_empty() {
        return Err("Missing input path".into());
    }
    if req.max_dimension == 0 {
        return Err("Invalid output size".into());
    }
    ensure_parent_dir(&req.output_path)?;
    let timestamp = format!("{:.3}", req.timestamp_seconds.max(0.0));
    let max_dimension = req.max_dimension;
    let scale = format!(
        "scale={max_dimension}:{max_dimension}:force_original_aspect_ratio=decrease:flags=lanczos"
    );
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

    Ok(())
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
