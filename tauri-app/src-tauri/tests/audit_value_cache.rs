use std::fs::FileTimes;
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[cfg(not(windows))]
use std::fs::File;
#[cfg(windows)]
use std::fs::OpenOptions;
#[cfg(windows)]
use std::os::windows::fs::OpenOptionsExt;

use image::{Rgb, RgbImage};
use tauri_app::value_analysis::generate_value_analysis;
use tempfile::TempDir;

#[cfg(windows)]
const FILE_WRITE_ATTRIBUTES_ACCESS: u32 = 0x0000_0100;
#[cfg(windows)]
const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;

fn mtime_seconds(path: &Path) -> u64 {
    std::fs::metadata(path)
        .expect("metadata")
        .modified()
        .expect("mtime")
        .duration_since(UNIX_EPOCH)
        .expect("mtime after epoch")
        .as_secs()
}

fn mtime_nanos(path: &Path) -> u128 {
    std::fs::metadata(path)
        .expect("metadata")
        .modified()
        .expect("mtime")
        .duration_since(UNIX_EPOCH)
        .expect("mtime after epoch")
        .as_nanos()
}

fn align_away_from_second_boundary() {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("current time");
    let millis = now.subsec_millis() as u64;
    if millis > 500 {
        std::thread::sleep(Duration::from_millis(1_050 - millis));
    }
}

fn set_modified(path: &Path, modified: SystemTime) {
    #[cfg(windows)]
    let file = OpenOptions::new()
        // SetFileTime needs FILE_WRITE_ATTRIBUTES; no file-data write access is required.
        .access_mode(FILE_WRITE_ATTRIBUTES_ACCESS)
        // CreateFile needs FILE_FLAG_BACKUP_SEMANTICS to open a directory.
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS)
        .open(path)
        .expect("open artifact for timestamp update");
    #[cfg(not(windows))]
    let file = File::open(path).expect("open artifact for timestamp update");

    file.set_times(FileTimes::new().set_modified(modified))
        .expect("set deterministic artifact timestamp");
}

fn set_tree_modified(path: &Path, modified: SystemTime) {
    if path.is_dir() {
        for entry in std::fs::read_dir(path).expect("read artifact tree") {
            set_tree_modified(&entry.expect("artifact entry").path(), modified);
        }
    }
    set_modified(path, modified);
}

#[test]
fn sweep_022_timestamp_helper_updates_file_and_directory_without_altering_bytes() {
    let temp = TempDir::new().expect("temp dir");
    let directory = temp.path().join("artifact");
    let file = directory.join("bytes.bin");
    let bytes = [0_u8, 1, 2, 3, 254, 255];
    std::fs::create_dir(&directory).expect("fixture directory");
    std::fs::write(&file, bytes).expect("fixture file");
    let requested = UNIX_EPOCH + Duration::from_secs(24 * 60 * 60);

    set_modified(&file, requested);
    set_modified(&directory, requested);

    assert_eq!(
        std::fs::metadata(&file)
            .expect("file metadata")
            .modified()
            .expect("file modified time"),
        requested
    );
    assert_eq!(
        std::fs::metadata(&directory)
            .expect("directory metadata")
            .modified()
            .expect("directory modified time"),
        requested
    );
    assert_eq!(std::fs::read(file).expect("fixture bytes"), bytes);
}

#[test]
fn sweep_022_values_generation_preserves_unrelated_prior_artifact_bytes() {
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let prior_source = source_dir.path().join("prior.png");
    let new_source = source_dir.path().join("new.png");
    RgbImage::from_pixel(8, 8, Rgb([255, 0, 0]))
        .save(&prior_source)
        .expect("save prior source");
    RgbImage::from_pixel(8, 8, Rgb([0, 0, 255]))
        .save(&new_source)
        .expect("save new source");

    let prior =
        generate_value_analysis(&prior_source, "prior-artifact", 3, false, cache_dir.path())
            .expect("generate prior analysis");
    let prior_paths = [&prior.neutral, &prior.preview, &prior.bucket_map];
    let prior_bytes: Vec<Vec<u8>> = prior_paths
        .iter()
        .map(|path| std::fs::read(path).expect("read prior artifact bytes"))
        .collect();
    let prior_root = cache_dir.path().join("value-analysis/prior-artifact");
    set_tree_modified(&prior_root, UNIX_EPOCH + Duration::from_secs(24 * 60 * 60));

    let generated =
        generate_value_analysis(&new_source, "new-artifact", 3, false, cache_dir.path())
            .expect("generate new analysis");

    for (path, expected) in prior_paths.into_iter().zip(prior_bytes) {
        assert_eq!(
            std::fs::read(path).expect("prior artifact must survive generation"),
            expected,
            "Values generation must not delete or alter an unrelated prior artifact"
        );
    }
    assert!(generated.neutral.exists());
    assert!(generated.preview.exists());
    assert!(generated.bucket_map.exists());
    for path in [
        &generated.neutral,
        &generated.preview,
        &generated.bucket_map,
    ] {
        image::open(path).expect("new analysis artifact must be a valid image");
    }
    assert_eq!(generated.neutral_width, 8);
    assert_eq!(generated.neutral_height, 8);
    assert_eq!(generated.bucket_map_data.len(), 64);
}

#[test]
fn aud_005_same_second_source_replacement_is_not_cached() {
    align_away_from_second_boundary();
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    // BMP: fixed header + raw pixels, so equal dimensions guarantee equal
    // file length regardless of content (PNG compression made this flaky —
    // red/blue encoded to different sizes on Linux CI).
    let source = source_dir.path().join("frame.bmp");

    RgbImage::from_pixel(8, 8, Rgb([255, 0, 0]))
        .save(&source)
        .expect("save red frame");
    let first_mtime = mtime_seconds(&source);
    let first_mtime_nanos = mtime_nanos(&source);
    let first_length = std::fs::metadata(&source).expect("red metadata").len();
    let first = generate_value_analysis(&source, "same-logical-frame", 3, false, cache_dir.path())
        .expect("first analysis");

    RgbImage::from_pixel(8, 8, Rgb([0, 0, 255]))
        .save(&source)
        .expect("save blue frame");
    let second_mtime = mtime_seconds(&source);
    let second_mtime_nanos = mtime_nanos(&source);
    let second_length = std::fs::metadata(&source).expect("blue metadata").len();
    assert_eq!(
        first_mtime, second_mtime,
        "test setup crossed a second boundary"
    );
    assert_eq!(
        first_length, second_length,
        "replacement must keep the same file length"
    );
    assert_ne!(
        first_mtime_nanos, second_mtime_nanos,
        "test filesystem must expose subsecond mtime precision"
    );

    let second = generate_value_analysis(&source, "same-logical-frame", 3, false, cache_dir.path())
        .expect("second analysis");
    assert!(
        (first.p10 - second.p10).abs() > 0.05,
        "same-second file replacement must invalidate the Values cache"
    );
}
