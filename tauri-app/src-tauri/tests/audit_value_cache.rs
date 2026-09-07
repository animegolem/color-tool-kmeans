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
use tauri_app::value_analysis::{generate_value_analysis, ValueAnalysisResult};
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

fn artifact_paths(result: &ValueAnalysisResult) -> [&Path; 3] {
    [&result.neutral, &result.preview, &result.bucket_map]
}

fn artifact_bytes(result: &ValueAnalysisResult) -> Vec<Vec<u8>> {
    artifact_paths(result)
        .into_iter()
        .map(|path| std::fs::read(path).expect("read Values artifact"))
        .collect()
}

fn assert_rendered_value(result: &ValueAnalysisResult, expected: [u8; 3]) {
    for path in [&result.neutral, &result.preview] {
        let image = image::open(path)
            .expect("decode rendered Values artifact")
            .to_rgb8();
        assert_eq!(image.get_pixel(0, 0), &Rgb(expected));
    }
    let bucket_map = image::open(&result.bucket_map)
        .expect("decode bucket map")
        .to_luma8();
    assert_eq!(
        bucket_map.dimensions(),
        (result.preview_width, result.preview_height)
    );
    assert_eq!(result.bucket_map_data.len(), bucket_map.len());
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

#[test]
fn sweep_021_concurrent_observed_generations_retain_distinct_artifacts() {
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let dark_source = source_dir.path().join("dark.png");
    let light_source = source_dir.path().join("light.png");
    RgbImage::from_pixel(8, 8, Rgb([0, 0, 0]))
        .save(&dark_source)
        .expect("save dark source");
    RgbImage::from_pixel(8, 8, Rgb([255, 255, 255]))
        .save(&light_source)
        .expect("save light source");
    let cache_path = cache_dir.path().to_path_buf();
    let start = std::sync::Barrier::new(2);

    let (dark, light) = std::thread::scope(|scope| {
        let dark_worker = scope.spawn(|| {
            start.wait();
            generate_value_analysis(&dark_source, "same-logical-frame", 3, false, &cache_path)
                .expect("dark analysis")
        });
        let light_worker = scope.spawn(|| {
            start.wait();
            generate_value_analysis(&light_source, "same-logical-frame", 3, false, &cache_path)
                .expect("light analysis")
        });
        (
            dark_worker.join().expect("dark worker"),
            light_worker.join().expect("light worker"),
        )
    });

    for (dark_path, light_path) in artifact_paths(&dark)
        .into_iter()
        .zip(artifact_paths(&light))
    {
        assert_ne!(
            dark_path, light_path,
            "different observed generations must not share output paths"
        );
    }
    assert!(dark.p10 < 0.01, "dark result must retain dark statistics");
    assert!(
        light.p10 > 0.99,
        "light result must retain light statistics"
    );
    assert_rendered_value(&dark, [0, 0, 0]);
    assert_rendered_value(&light, [255, 255, 255]);
    let dark_bytes = artifact_bytes(&dark);
    let light_bytes = artifact_bytes(&light);

    let mid_source = source_dir.path().join("mid.png");
    RgbImage::from_pixel(8, 8, Rgb([128, 128, 128]))
        .save(&mid_source)
        .expect("save later source");
    let later = generate_value_analysis(&mid_source, "same-logical-frame", 3, false, &cache_path)
        .expect("later analysis");
    for prior_path in artifact_paths(&dark)
        .into_iter()
        .chain(artifact_paths(&light))
    {
        assert!(
            !artifact_paths(&later).contains(&prior_path),
            "later generation must use new output paths"
        );
    }
    for (path, expected) in artifact_paths(&dark).into_iter().zip(dark_bytes) {
        assert_eq!(
            std::fs::read(path).expect("reread dark artifact after later generation"),
            expected
        );
    }
    for (path, expected) in artifact_paths(&light).into_iter().zip(light_bytes) {
        assert_eq!(
            std::fs::read(path).expect("reread light artifact after later generation"),
            expected
        );
    }
}

#[test]
fn sweep_021_same_path_changed_generation_retains_prior_artifacts() {
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let source = source_dir.path().join("replace.bmp");
    let first_time = UNIX_EPOCH + Duration::from_secs(10 * 24 * 60 * 60);
    let second_time = UNIX_EPOCH + Duration::from_secs(11 * 24 * 60 * 60);

    RgbImage::from_pixel(8, 8, Rgb([0, 0, 0]))
        .save(&source)
        .expect("save first source generation");
    set_modified(&source, first_time);
    assert_eq!(
        std::fs::metadata(&source)
            .expect("first source metadata")
            .modified()
            .expect("first source mtime"),
        first_time
    );
    let source_length = std::fs::metadata(&source)
        .expect("first source metadata")
        .len();
    let first =
        generate_value_analysis(&source, "same-path-generation", 3, false, cache_dir.path())
            .expect("first source generation analysis");
    let first_paths: Vec<_> = artifact_paths(&first)
        .into_iter()
        .map(Path::to_path_buf)
        .collect();
    let first_bytes = artifact_bytes(&first);

    RgbImage::from_pixel(8, 8, Rgb([255, 255, 255]))
        .save(&source)
        .expect("replace source bytes");
    set_modified(&source, second_time);
    let replaced_metadata = std::fs::metadata(&source).expect("replaced source metadata");
    assert_eq!(replaced_metadata.len(), source_length);
    assert_eq!(
        replaced_metadata.modified().expect("replaced source mtime"),
        second_time
    );
    let second =
        generate_value_analysis(&source, "same-path-generation", 3, false, cache_dir.path())
            .expect("replacement source generation analysis");

    for (first_path, second_path) in first_paths.iter().zip(artifact_paths(&second)) {
        assert_ne!(first_path, second_path);
    }
    assert!(first.p10 < 0.01);
    assert!(second.p10 > 0.99);
    assert_rendered_value(&first, [0, 0, 0]);
    assert_rendered_value(&second, [255, 255, 255]);
    for (path, expected) in first_paths.iter().zip(first_bytes) {
        assert_eq!(
            std::fs::read(path).expect("reread prior generation artifact"),
            expected
        );
    }
}

#[test]
fn sweep_021_unchanged_source_reuses_outputs_without_rewrite() {
    let source_dir = TempDir::new().expect("source temp dir");
    let cache_dir = TempDir::new().expect("cache temp dir");
    let source = source_dir.path().join("unchanged.png");
    RgbImage::from_pixel(8, 8, Rgb([64, 64, 64]))
        .save(&source)
        .expect("save unchanged source");
    let source_mtime = mtime_nanos(&source);
    let source_length = std::fs::metadata(&source).expect("source metadata").len();

    let first = generate_value_analysis(&source, "unchanged-source", 3, false, cache_dir.path())
        .expect("first analysis");
    let paths: Vec<_> = artifact_paths(&first)
        .into_iter()
        .map(Path::to_path_buf)
        .collect();
    let bytes = artifact_bytes(&first);
    let controlled_output_time = UNIX_EPOCH + Duration::from_secs(12 * 24 * 60 * 60);
    for path in &paths {
        set_modified(path, controlled_output_time);
        assert_eq!(
            std::fs::metadata(path)
                .expect("controlled output metadata")
                .modified()
                .expect("controlled output mtime"),
            controlled_output_time
        );
    }

    let reused = generate_value_analysis(&source, "unchanged-source", 3, false, cache_dir.path())
        .expect("reuse unchanged analysis");

    assert_eq!(mtime_nanos(&source), source_mtime);
    assert_eq!(
        std::fs::metadata(&source)
            .expect("unchanged source metadata")
            .len(),
        source_length
    );
    for (index, ((path, reused_path), expected)) in paths
        .iter()
        .zip(artifact_paths(&reused))
        .zip(bytes)
        .enumerate()
    {
        assert_eq!(path, reused_path, "artifact {index} path must be reused");
        assert_eq!(
            std::fs::read(path).expect("read reused artifact"),
            expected,
            "artifact {index} bytes must be unchanged"
        );
        assert_eq!(
            std::fs::metadata(path)
                .expect("reused output metadata")
                .modified()
                .expect("reused output mtime"),
            controlled_output_time,
            "artifact {index} must not be rewritten"
        );
    }
}
