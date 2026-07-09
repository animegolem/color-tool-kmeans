use chrono::{Local, SecondsFormat};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

pub const RUNTIME_PRUNE_INTERVAL: Duration = Duration::from_secs(60);

// Runtime-created media is intentionally retained generously, but no class is
// allowed to grow without a session-time cap.
const VIDEO_FRAME_KEEP: usize = 80;
const VIDEO_STRIP_KEEP: usize = 10;
const ARTIFACT_MAX_AGE: Duration = Duration::from_secs(30 * 24 * 60 * 60);
const CLIPBOARD_MAX_BYTES: u64 = 512 * 1024 * 1024;
const SNAPSHOT_MAX_BYTES: u64 = 1024 * 1024 * 1024;

#[derive(Debug)]
pub struct EventLog {
    pub path: PathBuf,
}

impl EventLog {
    pub fn append(&self, message: &str) {
        let timestamp = Local::now().to_rfc3339_opts(SecondsFormat::Millis, false);
        eprintln!("[log] {timestamp} {message}");
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

pub fn build_log_path(cache_dir: &Path) -> PathBuf {
    let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    cache_dir.join(format!("event-log-{timestamp}.txt"))
}

pub fn prune_event_logs(cache_dir: &Path, keep: usize, current: &Path) {
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

pub fn prune_video_cache(cache_dir: &Path, keep_frames: usize, keep_strips: usize) {
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

pub fn prune_runtime_cache(cache_dir: &Path, local_data_dir: &Path) {
    prune_video_cache(cache_dir, VIDEO_FRAME_KEEP, VIDEO_STRIP_KEEP);
    prune_flat_directory(
        &cache_dir.join("clipboard"),
        CLIPBOARD_MAX_BYTES,
        ARTIFACT_MAX_AGE,
    );
    prune_flat_directory(
        &local_data_dir.join("snapshots"),
        SNAPSHOT_MAX_BYTES,
        ARTIFACT_MAX_AGE,
    );
}

pub fn remove_managed_artifact(
    cache_dir: &Path,
    local_data_dir: &Path,
    artifact_path: &Path,
) -> std::io::Result<bool> {
    let parent = artifact_path.parent();
    let name = artifact_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    let is_clipboard = parent == Some(cache_dir.join("clipboard").as_path())
        && name.starts_with("paste-")
        && name.ends_with(".png");
    let is_video_frame =
        parent == Some(cache_dir) && name.starts_with("video-frame-") && name.ends_with(".png");
    let is_snapshot = parent == Some(local_data_dir.join("snapshots").as_path())
        && name.starts_with("snapshot-")
        && name.ends_with(".png");

    if !(is_clipboard || is_video_frame || is_snapshot) || !artifact_path.exists() {
        return Ok(false);
    }
    fs::remove_file(artifact_path)?;
    Ok(true)
}

fn prune_flat_directory(directory: &Path, max_bytes: u64, max_age: Duration) {
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };
    let now = SystemTime::now();
    let mut files: Vec<(PathBuf, SystemTime, u64)> = entries
        .flatten()
        .filter_map(|entry| {
            let metadata = entry.metadata().ok()?;
            if !metadata.is_file() {
                return None;
            }
            let modified = metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH);
            Some((entry.path(), modified, metadata.len()))
        })
        .collect();

    files.retain(|(path, modified, _)| {
        let expired = now
            .duration_since(*modified)
            .map(|age| age > max_age)
            .unwrap_or(false);
        if expired {
            let _ = fs::remove_file(path);
        }
        !expired
    });

    files.sort_by_key(|(_, modified, _)| *modified);
    let mut total_bytes: u64 = files.iter().map(|(_, _, size)| size).sum();
    for (path, _, size) in files {
        if total_bytes <= max_bytes {
            break;
        }
        if fs::remove_file(path).is_ok() {
            total_bytes = total_bytes.saturating_sub(size);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn aud_011_runtime_prune_enforces_the_flat_directory_size_cap() {
        let temp = TempDir::new().expect("temp dir");
        let directory = temp.path().join("clipboard");
        fs::create_dir_all(&directory).expect("clipboard dir");
        fs::write(directory.join("paste-1.png"), [0_u8; 8]).expect("first artifact");
        fs::write(directory.join("paste-2.png"), [0_u8; 8]).expect("second artifact");

        prune_flat_directory(&directory, 8, ARTIFACT_MAX_AGE);

        let retained_bytes: u64 = fs::read_dir(directory)
            .expect("retained artifacts")
            .flatten()
            .filter_map(|entry| entry.metadata().ok())
            .map(|metadata| metadata.len())
            .sum();
        assert!(retained_bytes <= 8);
    }

    #[test]
    fn managed_artifact_removal_rejects_paths_outside_owned_roots() {
        let temp = TempDir::new().expect("temp dir");
        let cache_dir = temp.path().join("cache");
        let local_data_dir = temp.path().join("data");
        let external = temp.path().join("snapshot-external.png");
        fs::write(&external, [1_u8]).expect("external artifact");

        let removed = remove_managed_artifact(&cache_dir, &local_data_dir, &external)
            .expect("removal result");

        assert!(!removed);
        assert!(external.exists());
    }
}
