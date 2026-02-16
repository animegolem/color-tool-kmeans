#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cache;
mod commands;
mod commands_types;
mod merge;

use std::time::Duration;
use tauri::Manager;

use cache::{build_log_path, prune_event_logs, prune_video_cache, EventLog};
use commands::*;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let cache_dir = app
                .path()
                .app_cache_dir()
                .map_err(|_| String::from("Failed to resolve cache directory"))?;
            let log_path = build_log_path(&cache_dir);
            let logger = EventLog { path: log_path };
            logger.append("[system] app setup");
            prune_event_logs(&cache_dir, 5, &logger.path);
            prune_video_cache(&cache_dir, 80, 10);
            app.manage(logger);
            let heartbeat_path = app.state::<EventLog>().path.clone();
            std::thread::spawn(move || {
                let heartbeat = EventLog {
                    path: heartbeat_path,
                };
                loop {
                    std::thread::sleep(Duration::from_secs(10));
                    heartbeat.append("[system] heartbeat");
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(focused) = event {
                let log = window.app_handle().state::<EventLog>();
                log.append(&format!("[system] window focused={focused}"));
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            analyze_image,
            value_analysis,
            log_event,
            save_file,
            copy_file,
            open_image_dialog,
            open_video_dialog,
            extract_video_frame,
            probe_video,
            extract_video_strip,
            ffmpeg_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use tauri_app::color;
    use tauri_app::image_pipeline::{prepare_samples, SampleParams};
    use tauri_app::kmeans::{run_kmeans, KMeansConfig};

    use crate::merge::{merge_clusters_by_threshold, RawCluster};

    fn test_pattern_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("..")
            .join("test-patterns")
            .join(name)
    }

    fn run_merge_on(path: PathBuf, threshold: f32) -> (usize, usize) {
        assert!(path.exists(), "missing test pattern: {:?}", path);
        let params = SampleParams {
            path,
            stride: 2,
            min_lum: 0,
            max_samples: 120_000,
            max_dimension: Some(512),
            seed: 7,
        };
        let samples = prepare_samples(&params).expect("samples");
        let dataset: Vec<[f32; 3]> = if let Some(lab) = &samples.samples_oklab {
            lab.clone()
        } else {
            samples
                .samples
                .iter()
                .map(|&rgb| color::rgb8_to_oklab(rgb))
                .collect()
        };
        let k = 12.min(dataset.len().max(1));
        let cfg = KMeansConfig {
            k,
            max_iters: 40,
            tol: 1e-3,
            seed: 1,
            warm_start: None,
            mini_batch: None,
        };
        let result = run_kmeans(&dataset, &cfg);
        let raw_clusters: Vec<RawCluster> = result
            .centroids
            .iter()
            .zip(result.counts.iter())
            .filter_map(|(centroid, &count)| {
                if count == 0 {
                    return None;
                }
                Some(RawCluster {
                    centroid: *centroid,
                    count,
                })
            })
            .collect();
        let before = raw_clusters.len();
        let merged = merge_clusters_by_threshold(raw_clusters, threshold);
        let after = merged.len();
        println!(
            "[merge-test] {:?} before={} after={}",
            params.path, before, after
        );
        (before, after)
    }

    #[test]
    fn merge_threshold_on_grey_pattern() {
        let (before, after) = run_merge_on(test_pattern_path("grey.gif"), 0.1);
        assert!(before >= 1);
        assert!(after >= 1);
        assert!(after <= before);
    }

    #[test]
    fn merge_threshold_on_hsl_lightness_pattern() {
        let (before, after) = run_merge_on(test_pattern_path("hsl_ligthness.png"), 0.06);
        assert!(before >= 1);
        assert!(after >= 1);
        assert!(after <= before);
    }
}
