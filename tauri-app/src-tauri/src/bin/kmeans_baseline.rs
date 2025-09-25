use std::time::Instant;

use rand::{rngs::SmallRng, Rng, SeedableRng};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};

const SAMPLE_COUNT: usize = 120_000;
const BASE_CLUSTERS: usize = 40;
const RUNS: usize = 3;

fn main() {
    println!("Baseline k-means timing ({} samples)", SAMPLE_COUNT);
    let dataset = generate_dataset();
    let ks = [64usize, 128, 300];

    for &k in &ks {
        let mut durations = Vec::new();
        for run_idx in 0..RUNS {
            let cfg = KMeansConfig {
                k,
                max_iters: 40,
                tol: 1e-3,
                seed: run_idx as u64 + 1,
                warm_start: None,
                mini_batch: None,
            };
            let start = Instant::now();
            let result = run_kmeans(&dataset, &cfg);
            let elapsed = start.elapsed();
            durations.push(elapsed);
            println!(
                "  k={k:>3} run #{run_idx} -> {:.2?} (iters: {}, inertia: {:.2})",
                elapsed, result.iterations, result.inertia
            );
        }
        let avg_ns: u128 = durations.iter().map(|d| d.as_nanos()).sum::<u128>() / RUNS as u128;
        println!(
            "  k={k:>3} avg {:.2?}\n",
            std::time::Duration::from_nanos(avg_ns as u64)
        );
    }
}

fn generate_dataset() -> Vec<[f32; 3]> {
    let mut rng = SmallRng::seed_from_u64(12345);
    let mut centers = Vec::with_capacity(BASE_CLUSTERS);
    for _ in 0..BASE_CLUSTERS {
        centers.push([
            rng.gen_range(0.0..1.0),
            rng.gen_range(0.0..1.0),
            rng.gen_range(0.0..1.0),
        ]);
    }

    let mut points = Vec::with_capacity(SAMPLE_COUNT);
    for _ in 0..SAMPLE_COUNT {
        let center = centers[rng.gen_range(0..BASE_CLUSTERS)];
        let jitter = [
            rng.gen_range(-0.02..0.02),
            rng.gen_range(-0.02..0.02),
            rng.gen_range(-0.02..0.02),
        ];
        points.push([
            clamp01(center[0] + jitter[0]),
            clamp01(center[1] + jitter[1]),
            clamp01(center[2] + jitter[2]),
        ]);
    }
    points
}

fn clamp01(v: f32) -> f32 {
    v.max(0.0).min(1.0)
}
