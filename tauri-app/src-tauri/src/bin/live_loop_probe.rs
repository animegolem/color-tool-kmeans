//! End-to-end live-analysis loop prototype (AI-IMP-161).
//!
//! Composes the pieces validated by IMP-159/IMP-160: persistent ffmpeg
//! rawvideo stream at analysis resolution → LUT + rayon sRGB→OKLab →
//! warm-started, iteration-budgeted k-means. Measures sustained fps with a
//! read/convert/cluster breakdown, and every `QUALITY_INTERVAL` frames runs
//! a converged reference from the same warm seed to report the inertia
//! ratio of budgeted vs converged clustering (the go/no-go signal).
//!
//! Duplicates the pipe reader and LUT from `live_pipe_probe` and the OKLab
//! matrix from `color.rs` on purpose — spike binaries may not touch
//! shipping modules (see ticket).

use std::io::{self, Read};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc;
use std::time::Instant;

use rayon::prelude::*;
use tauri_app::kmeans::{run_kmeans, KMeansConfig};

const WIDTH: usize = 320;
const HEIGHT: usize = 180;
const FRAME_BYTES: usize = WIDTH * HEIGHT * 3;
const K_VALUES: [usize; 3] = [64, 128, 300];
const ITER_BUDGETS: [usize; 2] = [2, 4];
const QUALITY_INTERVAL: usize = 24; // converged-reference check cadence
const CONVERGED_MAX_ITERS: usize = 40; // production parity
const CONVERGED_TOL: f32 = 1e-3;
const CLIP_SECONDS: &str = "60"; // cap per-run decode so the full sweep stays tractable

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("Usage: live_loop_probe <clip> [<clip>...] [--ffmpeg <path>]");
        std::process::exit(1);
    }
    let mut clips = Vec::new();
    let mut ffmpeg = "ffmpeg".to_string();
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        if arg == "--ffmpeg" {
            ffmpeg = iter.next().unwrap_or_else(|| {
                eprintln!("--ffmpeg requires a value");
                std::process::exit(1);
            });
        } else {
            clips.push(arg);
        }
    }

    println!("live_loop_probe: stream -> LUT convert -> warm budgeted k-means");
    println!(
        "analysis {WIDTH}x{HEIGHT} @ fps=24 · budgets {ITER_BUDGETS:?} · quality check every {QUALITY_INTERVAL} frames\n"
    );
    print_header();
    for clip in &clips {
        for k in K_VALUES {
            for budget in ITER_BUDGETS {
                for two_stage in [false, true] {
                    match run_loop(clip, &ffmpeg, k, budget, two_stage) {
                        Ok(row) => print_row(clip, k, budget, two_stage, &row),
                        Err(e) => {
                            eprintln!("error: {clip} k={k} budget={budget}: {e}");
                            std::process::exit(1);
                        }
                    }
                }
            }
        }
        println!();
    }
}

struct RunRow {
    frames: usize,
    fps: f64,
    read_ms: f64,
    convert_ms: f64,
    cluster_ms: f64,
    frame_p95_ms: f64,
    frame_max_ms: f64,
    inertia_ratio_mean: f64,
    inertia_ratio_max: f64,
}

fn run_loop(
    clip: &str,
    ffmpeg: &str,
    k: usize,
    budget: usize,
    two_stage: bool,
) -> Result<RunRow, String> {
    let mut child = spawn_ffmpeg(ffmpeg, clip)?;
    let mut stdout = child.stdout.take().expect("piped stdout");
    let lut = build_srgb_lut();

    let mut points: Vec<[f32; 3]> = vec![[0.0; 3]; WIDTH * HEIGHT];
    let mut prev_centroids: Option<Vec<[f32; 3]>> = None;
    let mut read_ms = Vec::new();
    let mut convert_ms = Vec::new();
    let mut cluster_ms = Vec::new();
    let mut frame_ms = Vec::new();
    let mut ratios = Vec::new();

    // Two-stage: a reader thread pulls raw frames into a bounded channel so
    // ffmpeg decodes ahead while the main thread converts + clusters.
    enum Source {
        Single(std::process::ChildStdout),
        Staged(mpsc::Receiver<Vec<u8>>),
    }
    let mut source = if two_stage {
        let (tx, rx) = mpsc::sync_channel::<Vec<u8>>(2);
        std::thread::spawn(move || {
            let mut buf = vec![0u8; FRAME_BYTES];
            while let Ok(true) = stdout_read(&mut stdout, &mut buf) {
                if tx.send(buf.clone()).is_err() {
                    break;
                }
            }
        });
        Source::Staged(rx)
    } else {
        Source::Single(stdout)
    };
    let mut buf = vec![0u8; FRAME_BYTES];

    let wall = Instant::now();
    let mut frame_idx = 0usize;
    loop {
        let t_frame = Instant::now();
        let t_read = Instant::now();
        match &mut source {
            Source::Staged(rx) => match rx.recv() {
                Ok(frame) => buf = frame,
                Err(_) => break, // reader hit EOF and hung up
            },
            Source::Single(stdout) => match stdout_read(stdout, &mut buf) {
                Ok(true) => {}
                Ok(false) => break,
                Err(e) => return Err(e),
            },
        }
        read_ms.push(elapsed_ms(t_read));

        let t_convert = Instant::now();
        buf.par_chunks(3)
            .zip(points.par_iter_mut())
            .for_each(|(px, out)| {
                *out = oklab_from_lut(px, &lut);
            });
        convert_ms.push(elapsed_ms(t_convert));

        let t_cluster = Instant::now();
        let warm = prev_centroids.clone();
        let cfg = if warm.is_some() {
            KMeansConfig {
                k,
                max_iters: budget,
                tol: 0.0, // fixed budget: never early-out on tol
                seed: 1,
                warm_start: warm,
                mini_batch: None,
            }
        } else {
            // First frame: cold k-means++ at production parity.
            KMeansConfig {
                k,
                max_iters: CONVERGED_MAX_ITERS,
                tol: CONVERGED_TOL,
                seed: 1,
                warm_start: None,
                mini_batch: None,
            }
        };
        let result = run_kmeans(&points, &cfg);
        cluster_ms.push(elapsed_ms(t_cluster));
        frame_ms.push(elapsed_ms(t_frame));

        // Quality check: converged reference from the SAME warm seed the
        // budgeted run used, so the ratio isolates what the budget costs.
        if frame_idx > 0 && frame_idx.is_multiple_of(QUALITY_INTERVAL) {
            let reference = run_kmeans(
                &points,
                &KMeansConfig {
                    k,
                    max_iters: CONVERGED_MAX_ITERS,
                    tol: CONVERGED_TOL,
                    seed: 1,
                    warm_start: prev_centroids.clone(),
                    mini_batch: None,
                },
            );
            if reference.inertia > 0.0 {
                ratios.push((result.inertia / reference.inertia) as f64);
            }
        }

        prev_centroids = Some(result.centroids);
        frame_idx += 1;
    }
    let wall_s = wall.elapsed().as_secs_f64();
    let _ = child.kill();
    let _ = child.wait();

    if frame_ms.is_empty() {
        return Err("no frames decoded".into());
    }
    frame_ms.sort_by(|a, b| a.partial_cmp(b).unwrap());
    Ok(RunRow {
        frames: frame_ms.len(),
        fps: frame_ms.len() as f64 / wall_s,
        read_ms: mean(&read_ms),
        convert_ms: mean(&convert_ms),
        cluster_ms: mean(&cluster_ms),
        frame_p95_ms: frame_ms[((frame_ms.len() - 1) as f64 * 0.95).round() as usize],
        frame_max_ms: *frame_ms.last().unwrap(),
        inertia_ratio_mean: mean(&ratios),
        inertia_ratio_max: ratios.iter().cloned().fold(0.0, f64::max),
    })
}

fn spawn_ffmpeg(ffmpeg: &str, clip: &str) -> Result<Child, String> {
    Command::new(ffmpeg)
        .arg("-i")
        .arg(clip)
        .args(["-t", CLIP_SECONDS])
        .args(["-f", "rawvideo", "-pix_fmt", "rgb24", "-vf"])
        .arg(format!("fps=24,scale={WIDTH}:{HEIGHT}:flags=area"))
        .args(["-v", "error", "pipe:1"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("failed to start ffmpeg '{ffmpeg}': {e}"))
}

fn stdout_read(stdout: &mut std::process::ChildStdout, buf: &mut [u8]) -> Result<bool, String> {
    match stdout.read_exact(buf) {
        Ok(()) => Ok(true),
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => Ok(false),
        Err(e) => Err(format!("frame read failed: {e}")),
    }
}

fn elapsed_ms(t: Instant) -> f64 {
    t.elapsed().as_secs_f64() * 1000.0
}

fn mean(v: &[f64]) -> f64 {
    if v.is_empty() {
        return 0.0;
    }
    v.iter().sum::<f64>() / v.len() as f64
}

fn print_header() {
    println!(
        "{:<28} {:>4} {:>3} {:<6} {:>6} {:>7} {:>6} {:>7} {:>8} {:>8} {:>8} {:>7} {:>7}",
        "clip",
        "k",
        "it",
        "mode",
        "frames",
        "fps",
        "rd_ms",
        "cv_ms",
        "cl_ms",
        "fr_p95",
        "fr_max",
        "q_mean",
        "q_max"
    );
}

fn print_row(clip: &str, k: usize, budget: usize, two_stage: bool, r: &RunRow) {
    let name: String = std::path::Path::new(clip)
        .file_stem()
        .map(|s| s.to_string_lossy().chars().take(28).collect())
        .unwrap_or_else(|| clip.chars().take(28).collect());
    println!(
        "{:<28} {:>4} {:>3} {:<6} {:>6} {:>7.1} {:>6.2} {:>7.2} {:>8.2} {:>8.2} {:>8.2} {:>7.4} {:>7.4}",
        name,
        k,
        budget,
        if two_stage { "2stage" } else { "single" },
        r.frames,
        r.fps,
        r.read_ms,
        r.convert_ms,
        r.cluster_ms,
        r.frame_p95_ms,
        r.frame_max_ms,
        r.inertia_ratio_mean,
        r.inertia_ratio_max
    );
}

fn build_srgb_lut() -> [f32; 256] {
    std::array::from_fn(|i| {
        let srgb = i as f32 / 255.0;
        if srgb <= 0.04045 {
            srgb / 12.92
        } else {
            ((srgb + 0.055) / 1.055).powf(2.4)
        }
    })
}

fn oklab_from_lut(px: &[u8], lut: &[f32; 256]) -> [f32; 3] {
    let (r, g, b) = (
        lut[px[0] as usize],
        lut[px[1] as usize],
        lut[px[2] as usize],
    );
    let l = (0.412_221_46 * r + 0.536_332_54 * g + 0.051_445_995 * b).cbrt();
    let m = (0.211_903_5 * r + 0.680_699_5 * g + 0.107_396_96 * b).cbrt();
    let s = (0.088_302_46 * r + 0.281_718_85 * g + 0.629_978_7 * b).cbrt();
    [
        0.210_454_26 * l + 0.793_617_8 * m - 0.004_072_047 * s,
        1.977_998_5 * l - 2.428_592_2 * m + 0.450_593_7 * s,
        0.025_904_037 * l + 0.782_771_77 * m - 0.808_675_77 * s,
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri_app::color;

    #[test]
    fn oklab_from_lut_matches_shipping_conversion() {
        let lut = build_srgb_lut();
        for r in (0..=255).step_by(17) {
            for g in (0..=255).step_by(17) {
                for b in (0..=255).step_by(17) {
                    let px = [r as u8, g as u8, b as u8];
                    let expected = color::rgb8_to_oklab(px);
                    let actual = oklab_from_lut(&px, &lut);
                    for (a, e) in actual.iter().zip(expected.iter()) {
                        assert!((a - e).abs() < 1e-3, "rgb {px:?}");
                    }
                }
            }
        }
    }
}
