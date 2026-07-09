//! Warm-start frame-sequence benchmark (AI-IMP-159).
//!
//! Simulates 120-frame video-like sequences (320x180 analysis resolution,
//! 57,600 points/frame) across three scenarios and compares a cold-start
//! arm (fresh k-means++ every frame) against a warm-start arm (each frame
//! seeded from the previous frame's centroids via `KMeansConfig.warm_start`).
//! `kmeans_baseline` remains the untouched cold-start reference; this binary
//! only calls the existing `run_kmeans` API, it does not change it.

use std::time::Instant;

use rand::{rngs::SmallRng, Rng, SeedableRng};
use tauri_app::kmeans::{run_kmeans, KMeansConfig};

const NUM_FRAMES: usize = 120;
const POINTS_PER_FRAME: usize = 57_600; // 320x180 analysis resolution
const MIXTURE_CLUSTERS: usize = 40; // matches kmeans_baseline's BASE_CLUSTERS
const CUT_INTERVAL: usize = 48;
const HELD_JITTER_SIGMA: f32 = 0.005;
const MIXTURE_DRIFT_SIGMA: f32 = 0.01;
const MOTION_RESAMPLE_FRACTION: f64 = 0.20;
const K_VALUES: [usize; 3] = [64, 128, 300];
const MAX_ITERS: usize = 40;
const TOL: f32 = 1e-3;

fn main() {
    println!("kmeans_framesim: warm-start frame-sequence benchmark");
    println!(
        "{NUM_FRAMES} frames x {POINTS_PER_FRAME} points/frame, k in {:?}\n",
        K_VALUES
    );

    let scenarios: [(&str, u64, f64, bool, Option<usize>); 3] = [
        ("held", 10_000, 0.0, false, None),
        ("motion", 20_000, MOTION_RESAMPLE_FRACTION, true, None),
        (
            "cut",
            30_000,
            MOTION_RESAMPLE_FRACTION,
            true,
            Some(CUT_INTERVAL),
        ),
    ];

    print_header();
    for (name, seed, resample_frac, drift, cut_interval) in scenarios {
        let frames = build_frames(seed, resample_frac, drift, cut_interval);
        for k in K_VALUES {
            let cold_seed_base = seed + 1 + (k as u64) * 1000;
            let warm_seed_base = seed + 2 + (k as u64) * 1000;
            let cold_stats = run_arm(&frames, k, false, cold_seed_base);
            let warm_stats = run_arm(&frames, k, true, warm_seed_base);
            print_row(name, k, "cold", &summarize(&cold_stats));
            print_row(name, k, "warm", &summarize(&warm_stats));
        }
    }
}

/// Per-frame result of a single k-means run.
struct FrameStat {
    iterations: usize,
    ms: f64,
}

/// Runs one cold or warm arm over an identical frame sequence for a given k.
/// Frame 0 is cold in both arms (no prior centroids exist yet).
fn run_arm(frames: &[Vec<[f32; 3]>], k: usize, warm: bool, seed_base: u64) -> Vec<FrameStat> {
    let mut prev_centroids: Option<Vec<[f32; 3]>> = None;
    let mut stats = Vec::with_capacity(frames.len());

    for (t, points) in frames.iter().enumerate() {
        let cfg = KMeansConfig {
            k,
            max_iters: MAX_ITERS,
            tol: TOL,
            seed: seed_base + t as u64,
            warm_start: if warm { prev_centroids.clone() } else { None },
            mini_batch: None,
        };
        let start = Instant::now();
        let result = run_kmeans(points, &cfg);
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;

        stats.push(FrameStat {
            iterations: result.iterations,
            ms: elapsed,
        });
        if warm {
            prev_centroids = Some(result.centroids);
        }
    }

    stats
}

/// Aggregated per-arm metrics across all frames in a sequence.
struct ArmSummary {
    mean_iter: f64,
    p95_iter: f64,
    mean_ms: f64,
    p95_ms: f64,
    max_ms: f64,
}

fn summarize(stats: &[FrameStat]) -> ArmSummary {
    let n = stats.len() as f64;
    let mean_iter = stats.iter().map(|s| s.iterations as f64).sum::<f64>() / n;
    let mean_ms = stats.iter().map(|s| s.ms).sum::<f64>() / n;

    let mut iters_sorted: Vec<f64> = stats.iter().map(|s| s.iterations as f64).collect();
    iters_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mut ms_sorted: Vec<f64> = stats.iter().map(|s| s.ms).collect();
    ms_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    ArmSummary {
        mean_iter,
        p95_iter: percentile(&iters_sorted, 0.95),
        mean_ms,
        p95_ms: percentile(&ms_sorted, 0.95),
        max_ms: ms_sorted.last().copied().unwrap_or(0.0),
    }
}

/// Nearest-rank percentile over an ascending-sorted slice.
fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let rank = (p * (sorted.len() as f64 - 1.0)).round() as usize;
    sorted[rank.min(sorted.len() - 1)]
}

fn print_header() {
    println!(
        "{:<8} {:>4} {:<5} {:>9} {:>8} {:>9} {:>8} {:>9}",
        "scenario", "k", "arm", "mean_it", "p95_it", "mean_ms", "p95_ms", "max_ms"
    );
}

fn print_row(scenario: &str, k: usize, arm: &str, s: &ArmSummary) {
    println!(
        "{:<8} {:>4} {:<5} {:>9.2} {:>8.2} {:>9.2} {:>8.2} {:>9.2}",
        scenario, k, arm, s.mean_iter, s.p95_iter, s.mean_ms, s.p95_ms, s.max_ms
    );
}

/// Builds a deterministic 120-frame sequence for one scenario.
///
/// `resample_fraction` of points are, each frame, redrawn from a mixture of
/// `MIXTURE_CLUSTERS` centers (simulating character movement over a held
/// background); the remainder carry over from the previous frame with
/// Gaussian jitter (film grain on a held cel). If `drift` is set the mixture
/// centers themselves take a small random walk each frame. If `cut_interval`
/// is set, every Nth frame is a hard scene change: a fresh random mixture is
/// drawn and every point is regenerated from scratch (no carry-over), to
/// measure warm-start recovery cost after a cut.
fn build_frames(
    seed: u64,
    resample_fraction: f64,
    drift: bool,
    cut_interval: Option<usize>,
) -> Vec<Vec<[f32; 3]>> {
    let mut rng = SmallRng::seed_from_u64(seed);
    let mut mixture = random_mixture(&mut rng, MIXTURE_CLUSTERS);
    let resample_count = (POINTS_PER_FRAME as f64 * resample_fraction).round() as usize;

    let mut frame = initial_frame(&mixture, &mut rng);
    let mut frames = Vec::with_capacity(NUM_FRAMES);
    frames.push(frame.clone());

    for t in 1..NUM_FRAMES {
        let is_cut = cut_interval.is_some_and(|ci| t % ci == 0);
        if is_cut {
            mixture = random_mixture(&mut rng, MIXTURE_CLUSTERS);
            frame = initial_frame(&mixture, &mut rng);
        } else {
            for p in frame.iter_mut() {
                jitter_point(p, HELD_JITTER_SIGMA, &mut rng);
            }
            if drift {
                drift_mixture(&mut mixture, &mut rng);
                for (i, p) in frame.iter_mut().enumerate().take(resample_count) {
                    let cluster = i % mixture.len();
                    let mut np = mixture[cluster];
                    jitter_point(&mut np, HELD_JITTER_SIGMA, &mut rng);
                    *p = np;
                }
            }
        }
        frames.push(frame.clone());
    }

    frames
}

fn initial_frame(mixture: &[[f32; 3]], rng: &mut SmallRng) -> Vec<[f32; 3]> {
    let mut frame = Vec::with_capacity(POINTS_PER_FRAME);
    for i in 0..POINTS_PER_FRAME {
        let cluster = i % mixture.len();
        let mut p = mixture[cluster];
        jitter_point(&mut p, HELD_JITTER_SIGMA, rng);
        frame.push(p);
    }
    frame
}

fn random_mixture(rng: &mut SmallRng, count: usize) -> Vec<[f32; 3]> {
    (0..count)
        .map(|_| {
            [
                rng.gen_range(0.0..1.0),
                rng.gen_range(0.0..1.0),
                rng.gen_range(0.0..1.0),
            ]
        })
        .collect()
}

fn drift_mixture(mixture: &mut [[f32; 3]], rng: &mut SmallRng) {
    for c in mixture.iter_mut() {
        for comp in c.iter_mut() {
            *comp = (*comp + gaussian_sample(rng, MIXTURE_DRIFT_SIGMA)).clamp(0.0, 1.0);
        }
    }
}

fn jitter_point(p: &mut [f32; 3], sigma: f32, rng: &mut SmallRng) {
    for c in p.iter_mut() {
        *c = (*c + gaussian_sample(rng, sigma)).clamp(0.0, 1.0);
    }
}

/// Box-Muller transform; `rand` (without `rand_distr`) has no built-in
/// Gaussian sampler and this binary adds no new dependencies.
fn gaussian_sample(rng: &mut SmallRng, sigma: f32) -> f32 {
    let u1: f32 = rng.gen::<f32>().max(1e-9);
    let u2: f32 = rng.gen::<f32>();
    let r = (-2.0 * u1.ln()).sqrt();
    let theta = 2.0 * std::f32::consts::PI * u2;
    r * theta.cos() * sigma
}
