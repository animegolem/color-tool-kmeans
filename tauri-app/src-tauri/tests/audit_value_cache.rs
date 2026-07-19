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

#[test]
fn sweep_021_concurrent_generations_keep_immutable_artifact_paths() {
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let dark_source = source_dir.path().join("dark.png");
    let light_source = source_dir.path().join("light.png");
    RgbImage::from_pixel(8, 8, Rgb([0, 0, 0]))
        .save(&dark_source)
        .expect("save dark frame");
    RgbImage::from_pixel(8, 8, Rgb([255, 255, 255]))
        .save(&light_source)
        .expect("save light frame");

    let dark_cache = cache_dir.path().to_path_buf();
    let light_cache = dark_cache.clone();
    let dark = std::thread::spawn(move || {
        generate_value_analysis(dark_source, "same-logical-frame", 3, false, dark_cache)
            .expect("dark analysis")
    });
    let light = std::thread::spawn(move || {
        generate_value_analysis(light_source, "same-logical-frame", 3, false, light_cache)
            .expect("light analysis")
    });

    let dark = dark.join().expect("dark worker");
    let light = light.join().expect("light worker");
    assert_ne!(dark.preview, light.preview);
    assert_ne!(dark.neutral, light.neutral);
    assert_ne!(dark.bucket_map, light.bucket_map);
    assert!(dark.p10 < 0.01);
    assert!(light.p10 > 0.99);

    let dark_preview = std::fs::read(&dark.preview).expect("read dark preview");
    let light_preview = std::fs::read(&light.preview).expect("read light preview");
    assert_ne!(dark_preview, light_preview);
    assert_eq!(
        std::fs::read(&dark.preview).expect("reread dark preview"),
        dark_preview
    );
}
