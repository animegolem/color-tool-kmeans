use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use image::{Rgb, RgbImage};
use tauri_app::value_analysis::generate_value_analysis;
use tempfile::TempDir;

fn mtime_seconds(path: &Path) -> u64 {
    std::fs::metadata(path)
        .expect("metadata")
        .modified()
        .expect("mtime")
        .duration_since(UNIX_EPOCH)
        .expect("mtime after epoch")
        .as_secs()
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

#[test]
#[should_panic(expected = "same-second file replacement must invalidate")]
fn audit_same_second_source_replacement_is_not_cached() {
    align_away_from_second_boundary();
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let source = source_dir.path().join("frame.png");

    RgbImage::from_pixel(8, 8, Rgb([255, 0, 0]))
        .save(&source)
        .expect("save red frame");
    let first_mtime = mtime_seconds(&source);
    let first = generate_value_analysis(&source, "same-logical-frame", 3, false, cache_dir.path())
        .expect("first analysis");

    RgbImage::from_pixel(8, 8, Rgb([0, 0, 255]))
        .save(&source)
        .expect("save blue frame");
    let second_mtime = mtime_seconds(&source);
    assert_eq!(
        first_mtime, second_mtime,
        "test setup crossed a second boundary"
    );

    let second = generate_value_analysis(&source, "same-logical-frame", 3, false, cache_dir.path())
        .expect("second analysis");
    assert!(
        (first.p10 - second.p10).abs() > 0.05,
        "same-second file replacement must invalidate the Values cache"
    );
}
