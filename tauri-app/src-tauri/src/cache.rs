use chrono::{Local, SecondsFormat};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

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
