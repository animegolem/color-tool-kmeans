use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use anyhow::{bail, Context, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri_app::color;
#[cfg(feature = "bench-crate")]
use tauri_app::kmeans::KMeansResult;
use tauri_app::kmeans::{run_kmeans_soa, KMeansConfig, PointsSoa};

fn main() {
    if let Err(err) = run() {
        eprintln!("[bench-runner] error: {err:?}");
        std::process::exit(1);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ComputeVariant {
    Inhouse,
    #[cfg(feature = "bench-crate")]
    Crate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DeltaMetric {
    De76,
    De2000,
}

#[derive(Debug, Clone, Copy)]
struct WeightedMatching {
    alpha: f32,
}

#[derive(Debug)]
struct RunnerArgs {
    variant: ComputeVariant,
    delta: DeltaMetric,
    weighted: Option<WeightedMatching>,
    explain: bool,
    parity: bool,
    tails_gate: bool,
    manifest_path: PathBuf,
}

fn parse_args() -> Result<RunnerArgs> {
    let mut args = std::env::args();
    let _exe = args.next();
    let mut variant = ComputeVariant::Inhouse;
    let mut delta = DeltaMetric::De76;
    let mut weighted: Option<WeightedMatching> = None;
    let mut explain = false;
    let mut parity = false;
    let mut tails_gate = false;
    let mut manifest_arg: Option<String> = None;

    while let Some(arg) = args.next() {
        if arg == "--variant" {
            if let Some(value) = args.next() {
                variant = parse_variant(&value)?;
            } else {
                bail!("--variant requires a value");
            }
        } else if arg == "--delta" {
            if let Some(value) = args.next() {
                delta = parse_delta(&value)?;
            } else {
                bail!("--delta requires a value");
            }
        } else if arg == "--weighted" {
            weighted = Some(WeightedMatching { alpha: 1.0 });
        } else if arg == "--explain" {
            explain = true;
        } else if arg == "--parity" {
            parity = true;
        } else if arg == "--tails-gate" {
            tails_gate = true;
        } else if let Some(rest) = arg.strip_prefix("--weighted=") {
            let alpha: f32 = rest
                .parse()
                .with_context(|| format!("invalid alpha '{rest}' for --weighted"))?;
            if alpha < 0.0 {
                bail!("--weighted alpha must be >= 0");
            }
            weighted = Some(WeightedMatching { alpha });
        } else if let Some(rest) = arg.strip_prefix("--variant=") {
            variant = parse_variant(rest)?;
        } else if let Some(rest) = arg.strip_prefix("--delta=") {
            delta = parse_delta(rest)?;
        } else if manifest_arg.is_none() {
            manifest_arg = Some(arg);
        } else {
            bail!("unexpected argument: {arg}");
        }
    }

    let manifest_path = manifest_arg
        .map(PathBuf::from)
        .context("expected path to samples-manifest.json")?;

    Ok(RunnerArgs {
        variant,
        delta,
        weighted,
        explain,
        parity,
        tails_gate,
        manifest_path,
    })
}

fn parse_variant(value: &str) -> Result<ComputeVariant> {
    match value.to_lowercase().as_str() {
        "inhouse" => Ok(ComputeVariant::Inhouse),
        #[cfg(feature = "bench-crate")]
        "crate" => Ok(ComputeVariant::Crate),
        other => bail!("unsupported variant '{other}'"),
    }
}

fn parse_delta(value: &str) -> Result<DeltaMetric> {
    match value.to_lowercase().as_str() {
        "de76" | "deltae76" | "cie76" => Ok(DeltaMetric::De76),
        "de2000" | "deltae2000" | "ciede2000" => Ok(DeltaMetric::De2000),
        other => bail!("unsupported delta metric '{other}' (use de76|de2000)"),
    }
}

fn run() -> Result<()> {
    let args = parse_args()?;
    let variant = args.variant;
    let delta_metric = args.delta;
    let weighted = args.weighted;
    let parity = args.parity;
    let tails_gate = args.tails_gate;
    let manifest_path = args.manifest_path.clone();

    let manifest_dir = manifest_path
        .parent()
        .map(Path::to_path_buf)
        .context("manifest path must have a parent directory")?;

    let explain_dir = if args.explain {
        let dir = manifest_dir.join("explain");
        fs::create_dir_all(&dir)?;
        Some(dir)
    } else {
        None
    };

    let manifest: SamplesManifest =
        serde_json::from_str(&fs::read_to_string(&manifest_path).context("read manifest")?)
            .context("parse manifest json")?;

    let mut job_results = Vec::with_capacity(manifest.jobs.len());

    for job in &manifest.jobs {
        let sample_path = manifest_dir.join(&job.sample_file);
        let report = process_job(
            job,
            &sample_path,
            variant,
            delta_metric,
            weighted,
            explain_dir.as_deref(),
            parity,
        )?;
        job_results.push(report);
    }

    let tails_gate_limit = 6usize;
    let output = ReportsBundle::from_jobs(
        job_results.clone(),
        variant,
        delta_metric,
        weighted,
        tails_gate,
        tails_gate_limit,
    );
    write_reports(&manifest_dir, &output)?;

    if parity {
        write_parity_report(&manifest_dir, &job_results)?;
    }

    // Acceptance: speed gate for inhouse variant (≤ +20% vs JS per image)
    if matches!(variant, ComputeVariant::Inhouse) {
        let pass = speed_gate(&output.comparison_report, 1.20);
        if !pass {
            bail!("Speed gate failed: Rust slower than +20% vs JS on at least one image");
        }
    }

    if tails_gate {
        if let Some(false) = output.tails_gate_result {
            bail!("Tails gate failed: more than 6 clusters exceeded ΔE>20 on at least one image");
        }
    }

    Ok(())
}

fn write_reports(output_dir: &Path, bundle: &ReportsBundle) -> Result<()> {
    let rust_json = serde_json::to_string_pretty(&bundle.rust_report)?;
    fs::write(output_dir.join("rust-results.json"), rust_json)?;

    let comparison_json = serde_json::to_string_pretty(&bundle.comparison_report)?;
    fs::write(output_dir.join("comparison.json"), comparison_json)?;

    fs::write(
        output_dir.join("latest.md"),
        bundle.markdown_summary.as_bytes(),
    )?;
    Ok(())
}

fn process_job(
    job: &ManifestJob,
    sample_path: &Path,
    variant: ComputeVariant,
    delta_metric: DeltaMetric,
    weighted: Option<WeightedMatching>,
    explain_dir: Option<&Path>,
    parity: bool,
) -> Result<JobReport> {
    let space = ColorSpace::try_from(job.options.space.as_str())?;
    let raw_samples = load_samples(sample_path, job.sample_count)
        .with_context(|| format!("load samples from {}", sample_path.display()))?;

    if raw_samples.is_empty() {
        return Ok(JobReport::empty(job.clone()));
    }

    let parity_stats = if parity {
        Some(compute_lab_parity(&raw_samples, 10_000))
    } else {
        None
    };

    let dataset = build_dataset(&raw_samples, space);
    let total_samples = dataset.len();
    let effective_k = job.options.k.min(total_samples.max(1));
    let mut config = KMeansConfig {
        k: effective_k,
        max_iters: job.options.max_iter as usize,
        tol: job.options.tol as f32,
        seed: job.options.seed as u64,
        warm_start: None,
        mini_batch: None,
    };

    let mut interactive_metrics = None;
    let mut warm_start_for_full: Option<Vec<[f32; 3]>> = None;
    let default_mini_batch = job.options.interactive_mini_batch.unwrap_or(4000);
    if default_mini_batch > 0 {
        if let Some((metrics, warm_start)) =
            run_interactive_preview(&dataset, &config, &job.options)
        {
            interactive_metrics = Some(metrics);
            warm_start_for_full = Some(warm_start);
        }
    }
    if let Some(ws) = warm_start_for_full.clone() {
        config.warm_start = Some(ws);
    }

    let start = Instant::now();
    let (result, variant_label) = match variant {
        ComputeVariant::Inhouse => (run_kmeans_soa(&dataset, &config), "inhouse"),
        #[cfg(feature = "bench-crate")]
        ComputeVariant::Crate => (run_kmeans_crate(&dataset, &config)?, "crate"),
    };
    let duration = start.elapsed();

    let mut clusters = build_clusters(&result.centroids, &result.counts, total_samples, space);
    clusters.sort_by(|a, b| b.count.cmp(&a.count));

    let interactive_clone = interactive_metrics.clone();
    let mut rust_metrics = RustMetrics {
        duration_ms: duration.as_secs_f64() * 1000.0,
        iterations: result.iterations,
        inertia: result.inertia,
        converged: result.iterations < config.max_iters,
        total_samples,
        effective_k,
        variant: variant_label.to_string(),
        interactive: interactive_metrics,
    };

    let mut comparisons =
        build_cluster_comparisons(&job.js_clusters, &clusters, delta_metric, weighted);

    let tail_limit = 6usize;
    if comparisons.count_over_20 > tail_limit && warm_start_for_full.is_some() {
        let mut fallback_cfg = config.clone();
        fallback_cfg.warm_start = None;
        fallback_cfg.seed = fallback_cfg.seed.wrapping_add(9973);
        let fallback_start = Instant::now();
        let fallback_result = run_kmeans_soa(&dataset, &fallback_cfg);
        let fallback_duration = fallback_start.elapsed();
        clusters = build_clusters(
            &fallback_result.centroids,
            &fallback_result.counts,
            total_samples,
            space,
        );
        clusters.sort_by(|a, b| b.count.cmp(&a.count));
        rust_metrics = RustMetrics {
            duration_ms: fallback_duration.as_secs_f64() * 1000.0,
            iterations: fallback_result.iterations,
            inertia: fallback_result.inertia,
            converged: fallback_result.iterations < fallback_cfg.max_iters,
            total_samples,
            effective_k,
            variant: variant_label.to_string(),
            interactive: interactive_clone,
        };
        comparisons =
            build_cluster_comparisons(&job.js_clusters, &clusters, delta_metric, weighted);
    }

    if let Some(dir) = explain_dir {
        write_explain_report(
            dir,
            job,
            &dataset,
            &job.js_clusters,
            &clusters,
            &comparisons,
            delta_metric,
        )?;
    }

    Ok(JobReport {
        job: job.clone(),
        rust_metrics,
        rust_clusters: clusters,
        comparisons,
        parity: parity_stats,
    })
}

fn run_interactive_preview(
    dataset: &PointsSoa,
    base_cfg: &KMeansConfig,
    options: &Options,
) -> Option<(InteractiveMetrics, Vec<[f32; 3]>)> {
    let mut batch_size = options.interactive_mini_batch.unwrap_or(4000);
    if batch_size == 0 {
        return None;
    }

    let budget_ms = options.interactive_budget_ms.unwrap_or(280.0).max(10.0);
    let min_batch = options.interactive_min_batch.unwrap_or(800).max(100);
    let shift_tol = options.interactive_shift_tol.unwrap_or(3.0).max(0.1);
    let max_attempts = 5;

    let mut warm_start = base_cfg.warm_start.clone();
    let mut latest: Option<(InteractiveMetrics, Vec<[f32; 3]>)> = None;

    for attempt in 0..max_attempts {
        let mut cfg = base_cfg.clone();
        cfg.mini_batch = Some(batch_size);
        cfg.max_iters = options
            .interactive_max_iters
            .unwrap_or(cfg.max_iters as u32) as usize;
        cfg.seed = cfg.seed.wrapping_add(attempt as u64);
        cfg.warm_start = warm_start.clone();

        let start = Instant::now();
        let result = run_kmeans_soa(dataset, &cfg);
        let duration_ms = start.elapsed().as_secs_f64() * 1000.0;
        let centroid_shift = warm_start
            .as_ref()
            .map(|prev| centroid_shift(prev, &result.centroids));

        latest = Some((
            InteractiveMetrics {
                duration_ms,
                iterations: result.iterations,
                mini_batch: batch_size,
                max_iters: cfg.max_iters,
                centroid_shift,
            },
            result.centroids.clone(),
        ));

        warm_start = Some(result.centroids);

        let shift_ok = centroid_shift
            .map(|shift| shift <= shift_tol)
            .unwrap_or(false);

        if duration_ms <= budget_ms || batch_size <= min_batch || shift_ok {
            break;
        }

        batch_size = ((batch_size as f64) * 0.6).ceil() as usize;
        if batch_size < min_batch {
            batch_size = min_batch;
        }
    }

    latest
}

#[cfg(feature = "bench-crate")]
fn run_kmeans_crate(dataset: &PointsSoa, cfg: &KMeansConfig) -> Result<KMeansResult> {
    use kmeans_colors::get_kmeans;
    use palette::{white_point::D65, Lab};

    if dataset.len() == 0 {
        return Ok(KMeansResult {
            centroids: Vec::new(),
            counts: Vec::new(),
            iterations: 0,
            inertia: 0.0,
        });
    }

    let mut lab_buf: Vec<Lab<D65, f32>> = Vec::with_capacity(dataset.len());
    for idx in 0..dataset.len() {
        let (l, a, b) = dataset.component_tuple(idx);
        lab_buf.push(Lab::<D65, f32>::new(l, a, b));
    }

    let run = get_kmeans(cfg.k, cfg.max_iters, cfg.tol, false, &lab_buf, cfg.seed);

    let mut counts = vec![0usize; cfg.k];
    for &label in &run.indices {
        if let Some(slot) = counts.get_mut(label as usize) {
            *slot += 1;
        }
    }

    let centroids: Vec<[f32; 3]> = run
        .centroids
        .iter()
        .map(|lab| [lab.l, lab.a, lab.b])
        .collect();

    let mut inertia = 0.0f32;
    for (idx, &label) in run.indices.iter().enumerate() {
        let (px, py, pz) = dataset.component_tuple(idx);
        let centroid = &centroids[label as usize];
        let dx = px - centroid[0];
        let dy = py - centroid[1];
        let dz = pz - centroid[2];
        inertia += dx * dx + dy * dy + dz * dz;
    }

    Ok(KMeansResult {
        centroids,
        counts,
        iterations: cfg.max_iters,
        inertia,
    })
}

fn load_samples(path: &Path, declared_count: usize) -> Result<Vec<[u8; 3]>> {
    let bytes = fs::read(path)?;
    if bytes.len() % 12 != 0 {
        bail!(
            "sample file {} length {} not divisible by 12",
            path.display(),
            bytes.len()
        );
    }
    let mut samples = Vec::with_capacity(bytes.len() / 12);
    for chunk in bytes.chunks_exact(12) {
        let r = f32::from_le_bytes(chunk[0..4].try_into().unwrap());
        let g = f32::from_le_bytes(chunk[4..8].try_into().unwrap());
        let b = f32::from_le_bytes(chunk[8..12].try_into().unwrap());
        samples.push([clamp_channel(r), clamp_channel(g), clamp_channel(b)]);
    }
    if declared_count != 0 && declared_count != samples.len() {
        eprintln!(
            "[bench-runner] warning: declared sample count {} but file yielded {}",
            declared_count,
            samples.len()
        );
    }
    Ok(samples)
}

fn build_dataset(samples: &[[u8; 3]], space: ColorSpace) -> PointsSoa {
    let converted: Vec<[f32; 3]> = samples
        .iter()
        .map(|rgb| match space {
            ColorSpace::Rgb => [rgb[0] as f32, rgb[1] as f32, rgb[2] as f32],
            ColorSpace::Hsl => color::rgb8_to_hsl(*rgb),
            ColorSpace::Yuv => rgb_to_yuv_js(*rgb),
            ColorSpace::Cielab => color::rgb8_to_lab(*rgb),
            ColorSpace::Cieluv => color::rgb8_to_luv(*rgb),
        })
        .collect();
    PointsSoa::from_points(&converted)
}

fn build_clusters(
    centroids: &[[f32; 3]],
    counts: &[usize],
    total_samples: usize,
    space: ColorSpace,
) -> Vec<ClusterOutput> {
    centroids
        .iter()
        .zip(counts.iter())
        .enumerate()
        .filter_map(|(idx, (centroid, &count))| {
            if count == 0 {
                return None;
            }
            let rgb_u8 = space_to_rgb(*centroid, space);
            let rgb = RgbValue::from(rgb_u8);
            let hsv = color::rgb8_to_hsv(rgb_u8);
            Some(ClusterOutput {
                index: idx,
                count,
                share: if total_samples > 0 {
                    count as f64 / total_samples as f64
                } else {
                    0.0
                },
                centroid_space: *centroid,
                rgb,
                hsv,
            })
        })
        .collect()
}

fn clamp_channel(value: f32) -> u8 {
    value.round().clamp(0.0, 255.0) as u8
}

fn rgb_to_yuv_js(rgb: [u8; 3]) -> [f32; 3] {
    let r = rgb[0] as f32;
    let g = rgb[1] as f32;
    let b = rgb[2] as f32;
    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let u = -0.168_736 * r - 0.331_264 * g + 0.5 * b + 128.0;
    let v = 0.5 * r - 0.418_688 * g - 0.081_312 * b + 128.0;
    [y, u, v]
}

fn yuv_to_rgb_js(yuv: [f32; 3]) -> [u8; 3] {
    let y = yuv[0];
    let u = yuv[1] - 128.0;
    let v = yuv[2] - 128.0;
    let r = y + 1.402 * v;
    let g = y - 0.344_136 * u - 0.714_136 * v;
    let b = y + 1.772 * u;
    [clamp_channel(r), clamp_channel(g), clamp_channel(b)]
}

fn space_to_rgb(values: [f32; 3], space: ColorSpace) -> [u8; 3] {
    match space {
        ColorSpace::Rgb => [
            clamp_channel(values[0]),
            clamp_channel(values[1]),
            clamp_channel(values[2]),
        ],
        ColorSpace::Hsl => color::hsl_to_rgb8(values),
        ColorSpace::Yuv => yuv_to_rgb_js(values),
        ColorSpace::Cielab => color::lab_to_rgb8(values),
        ColorSpace::Cieluv => color::luv_to_rgb8(values),
    }
}

fn rgb_delta(js_rgb: &RgbValue, rust_rgb: &RgbValue) -> f32 {
    let dr = (js_rgb.r - rust_rgb.r).abs();
    let dg = (js_rgb.g - rust_rgb.g).abs();
    let db = (js_rgb.b - rust_rgb.b).abs();
    dr.max(dg).max(db)
}

fn build_cluster_comparisons(
    js_clusters: &[ClusterOutput],
    rust_clusters: &[ClusterOutput],
    delta: DeltaMetric,
    weighted: Option<WeightedMatching>,
) -> ClusterComparisons {
    let n_js = js_clusters.len();
    let n_rust = rust_clusters.len();
    let n = n_js.max(n_rust).max(1);

    // Precompute LAB for cost calculation
    let js_lab: Vec<[f32; 3]> = js_clusters
        .iter()
        .map(|c| color::rgb8_to_lab(c.rgb.to_u8()))
        .collect();
    let rust_lab: Vec<[f32; 3]> = rust_clusters
        .iter()
        .map(|c| color::rgb8_to_lab(c.rgb.to_u8()))
        .collect();

    // Build square cost matrix (ΔE per chosen metric). Missing entries padded with a large cost.
    let big = 1_000_000.0_f32;
    let mut cost = vec![big; n * n];
    let mut base_delta = vec![big; n * n];
    for i in 0..n_js {
        for j in 0..n_rust {
            let de = match delta {
                DeltaMetric::De76 => {
                    let dl = js_lab[i][0] - rust_lab[j][0];
                    let da = js_lab[i][1] - rust_lab[j][1];
                    let db = js_lab[i][2] - rust_lab[j][2];
                    (dl * dl + da * da + db * db).sqrt()
                }
                DeltaMetric::De2000 => delta_e_ciede2000(js_lab[i], rust_lab[j]),
            };
            base_delta[i * n + j] = de;
            let weight = if let Some(w) = weighted {
                let share_diff = (js_clusters[i].share - rust_clusters[j].share).abs();
                1.0 + w.alpha * share_diff as f32
            } else {
                1.0
            };
            cost[i * n + j] = de * weight;
        }
    }

    let assignment = hungarian_min_cost(&cost, n);

    // Build comparisons for matched pairs only (ignore dummy matches)
    let mut pairs = Vec::new();
    for i in 0..n_js {
        let j = assignment[i];
        if j < n_rust {
            let js = &js_clusters[i];
            let rust = &rust_clusters[j];
            pairs.push(ClusterComparison {
                index: pairs.len(),
                js_index: i,
                rust_index: j,
                js_count: js.count,
                rust_count: rust.count,
                count_diff: rust.count as i64 - js.count as i64,
                js_share: js.share,
                rust_share: rust.share,
                share_diff: rust.share - js.share,
                rgb_delta_max: rgb_delta(&js.rgb, &rust.rgb),
                delta_e: base_delta[i * n + j],
            });
        }
    }

    let extra_js_clusters = n_js.saturating_sub(pairs.len());
    let extra_rust_clusters = n_rust.saturating_sub(pairs.len());

    let delta_values: Vec<f32> = pairs.iter().map(|c| c.delta_e).collect();

    let max_delta_e = delta_values.iter().cloned().fold(0.0_f32, f32::max);
    let mean_delta_e = if delta_values.is_empty() {
        0.0
    } else {
        delta_values.iter().sum::<f32>() / delta_values.len() as f32
    };
    let max_rgb_delta = pairs
        .iter()
        .map(|c| c.rgb_delta_max)
        .fold(0.0_f32, f32::max);

    let delta_p90 = percentile(&delta_values, 0.90);
    let delta_p95 = percentile(&delta_values, 0.95);
    let delta_p99 = percentile(&delta_values, 0.99);
    let count_over_10 = delta_values.iter().filter(|&&v| v > 10.0).count();
    let count_over_15 = delta_values.iter().filter(|&&v| v > 15.0).count();
    let count_over_20 = delta_values.iter().filter(|&&v| v > 20.0).count();
    let mut share_weighted_sum = 0.0_f32;
    let mut share_weight_total = 0.0_f32;
    for pair in &pairs {
        let weight = (((pair.js_share + pair.rust_share) * 0.5) as f32).max(0.0);
        share_weighted_sum += weight * pair.delta_e;
        share_weight_total += weight;
    }
    let share_weighted_mean_delta_e = if share_weight_total > 0.0 {
        share_weighted_sum / share_weight_total
    } else {
        0.0
    };

    let matching_strategy = match weighted {
        Some(w) => format!("weighted(alpha={:.2})", w.alpha),
        None => "standard".into(),
    };

    ClusterComparisons {
        pairs,
        max_delta_e,
        mean_delta_e,
        max_rgb_delta,
        extra_js_clusters,
        extra_rust_clusters,
        delta_p90,
        delta_p95,
        delta_p99,
        count_over_10,
        count_over_15,
        count_over_20,
        share_weighted_mean_delta_e,
        matching_strategy,
    }
}

fn percentile(values: &[f32], q: f32) -> f32 {
    if values.is_empty() {
        return 0.0;
    }
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let n = sorted.len();
    if n == 1 {
        return sorted[0];
    }
    let pos = q.clamp(0.0, 1.0) * (n as f32 - 1.0);
    let lower = pos.floor() as usize;
    let upper = pos.ceil() as usize;
    if lower == upper {
        sorted[lower]
    } else {
        let weight = pos - lower as f32;
        sorted[lower] * (1.0 - weight) + sorted[upper] * weight
    }
}

fn write_explain_report(
    dir: &Path,
    job: &ManifestJob,
    dataset: &PointsSoa,
    js_clusters: &[ClusterOutput],
    rust_clusters: &[ClusterOutput],
    comparisons: &ClusterComparisons,
    delta_metric: DeltaMetric,
) -> Result<()> {
    if js_clusters.is_empty() || rust_clusters.is_empty() {
        return Ok(());
    }

    let js_centroids: Vec<[f32; 3]> = js_clusters.iter().map(|c| c.centroid_space).collect();
    let rust_centroids: Vec<[f32; 3]> = rust_clusters.iter().map(|c| c.centroid_space).collect();
    let js_lab: Vec<[f32; 3]> = js_clusters
        .iter()
        .map(|c| color::rgb8_to_lab(c.rgb.to_u8()))
        .collect();
    let rust_lab: Vec<[f32; 3]> = rust_clusters
        .iter()
        .map(|c| color::rgb8_to_lab(c.rgb.to_u8()))
        .collect();

    let js_len = js_centroids.len();
    let rust_len = rust_centroids.len();
    let mut confusion = vec![vec![0usize; rust_len]; js_len];
    let mut row_totals = vec![0usize; js_len];
    let mut col_totals = vec![0usize; rust_len];

    for idx in 0..dataset.len() {
        let (px, py, pz) = dataset.component_tuple(idx);
        let js_idx = nearest_centroid_index(px, py, pz, &js_centroids);
        let rust_idx = nearest_centroid_index(px, py, pz, &rust_centroids);
        confusion[js_idx][rust_idx] += 1;
        row_totals[js_idx] += 1;
        col_totals[rust_idx] += 1;
    }

    let mut jaccard = vec![vec![0.0f64; rust_len]; js_len];
    for i in 0..js_len {
        for j in 0..rust_len {
            let intersection = confusion[i][j] as f64;
            let union = (row_totals[i] + col_totals[j] - confusion[i][j]) as f64;
            jaccard[i][j] = if union <= 0.0 {
                0.0
            } else {
                intersection / union
            };
        }
    }

    let matched_pairs: Vec<ExplainPair> = comparisons
        .pairs
        .iter()
        .map(|pair| {
            let js_idx = pair.js_index;
            let rust_idx = pair.rust_index;
            let intersection = confusion
                .get(js_idx)
                .and_then(|row| row.get(rust_idx))
                .copied()
                .unwrap_or(0);
            let union = row_totals[js_idx] + col_totals[rust_idx] - intersection;
            ExplainPair {
                js_index: js_idx,
                rust_index: rust_idx,
                js_count: pair.js_count,
                rust_count: pair.rust_count,
                delta_e: pair.delta_e,
                share_diff: pair.share_diff,
                intersection,
                union,
                jaccard: if union == 0 {
                    0.0
                } else {
                    intersection as f64 / union as f64
                },
            }
        })
        .collect();

    let nearest_js = nearest_neighbors(&js_lab, delta_metric);
    let nearest_rust = nearest_neighbors(&rust_lab, delta_metric);

    let explain = ExplainReport {
        label: job.label.clone(),
        image_file: job.image_file.clone(),
        matching_strategy: comparisons.matching_strategy.clone(),
        delta_metric: match delta_metric {
            DeltaMetric::De76 => "DE76".into(),
            DeltaMetric::De2000 => "DE2000".into(),
        },
        samples: dataset.len(),
        confusion,
        jaccard,
        row_totals,
        col_totals,
        matched_pairs,
        nearest_js,
        nearest_rust,
    };

    let slug = job
        .label
        .chars()
        .map(|ch| {
            if ch.is_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>();
    let base = slug.trim_matches('_');
    let filename = if base.is_empty() {
        format!("explain-{}.json", job.image_file.replace('.', "_"))
    } else {
        format!("explain-{}.json", base)
    };
    let path = dir.join(filename);
    let json = serde_json::to_string_pretty(&explain)?;
    fs::write(path, json)?;
    Ok(())
}

fn nearest_centroid_index(px: f32, py: f32, pz: f32, centroids: &[[f32; 3]]) -> usize {
    let mut best_idx = 0usize;
    let mut best_dist = f32::MAX;
    for (idx, centroid) in centroids.iter().enumerate() {
        let dx = px - centroid[0];
        let dy = py - centroid[1];
        let dz = pz - centroid[2];
        let d = dx * dx + dy * dy + dz * dz;
        if d < best_dist {
            best_dist = d;
            best_idx = idx;
        }
    }
    best_idx
}

fn nearest_neighbors(
    lab_centroids: &[[f32; 3]],
    delta_metric: DeltaMetric,
) -> Vec<NeighborSummary> {
    let mut neighbors = Vec::with_capacity(lab_centroids.len());
    for (idx, lab) in lab_centroids.iter().enumerate() {
        let mut best_delta = f32::MAX;
        let mut best_idx = None;
        for (other_idx, other) in lab_centroids.iter().enumerate() {
            if idx == other_idx {
                continue;
            }
            let delta = match delta_metric {
                DeltaMetric::De76 => {
                    let dl = lab[0] - other[0];
                    let da = lab[1] - other[1];
                    let db = lab[2] - other[2];
                    (dl * dl + da * da + db * db).sqrt()
                }
                DeltaMetric::De2000 => delta_e_ciede2000(*lab, *other),
            };
            if delta < best_delta {
                best_delta = delta;
                best_idx = Some(other_idx);
            }
        }
        neighbors.push(NeighborSummary {
            index: idx,
            neighbor_index: best_idx,
            delta_e: if best_delta.is_finite() {
                best_delta
            } else {
                0.0
            },
        });
    }
    neighbors
}

fn compute_lab_parity(samples: &[[u8; 3]], limit: usize) -> LabParityStats {
    let target = limit.max(1);
    let len = samples.len();
    let stride = (len / target).max(1);

    let mut count = 0usize;
    let mut sum_abs = [0.0f64; 3];
    let mut max_abs = [0.0f32; 3];
    let mut sum_delta = 0.0f64;
    let mut max_delta = 0.0f32;
    let mut buckets = ParityBuckets {
        under_0_1: 0,
        under_0_25: 0,
        under_1_0: 0,
        over_1_0: 0,
    };

    for rgb in samples.iter().step_by(stride) {
        if count >= target {
            break;
        }
        let rust_lab = color::rgb8_to_lab(*rgb);
        let js_lab = js_rgb_to_lab(*rgb);
        let mut delta_sq = 0.0f32;
        for c in 0..3 {
            let diff = rust_lab[c] - js_lab[c];
            let abs_diff = diff.abs();
            sum_abs[c] += abs_diff as f64;
            max_abs[c] = max_abs[c].max(abs_diff);
            delta_sq += diff * diff;
        }
        let delta = delta_sq.sqrt();
        sum_delta += delta as f64;
        max_delta = max_delta.max(delta);
        if delta < 0.1 {
            buckets.under_0_1 += 1;
        } else if delta < 0.25 {
            buckets.under_0_25 += 1;
        } else if delta < 1.0 {
            buckets.under_1_0 += 1;
        } else {
            buckets.over_1_0 += 1;
        }
        count += 1;
    }

    let denom = count.max(1) as f64;
    LabParityStats {
        sample_count: count,
        mean_abs_l: (sum_abs[0] / denom) as f32,
        mean_abs_a: (sum_abs[1] / denom) as f32,
        mean_abs_b: (sum_abs[2] / denom) as f32,
        max_abs_l: max_abs[0],
        max_abs_a: max_abs[1],
        max_abs_b: max_abs[2],
        mean_delta: (sum_delta / denom) as f32,
        max_delta,
        buckets,
    }
}

fn centroid_shift(prev: &[[f32; 3]], next: &[[f32; 3]]) -> f32 {
    let len = prev.len().min(next.len());
    if len == 0 {
        return 0.0;
    }
    let mut acc = 0.0f32;
    for idx in 0..len {
        let dx = prev[idx][0] - next[idx][0];
        let dy = prev[idx][1] - next[idx][1];
        let dz = prev[idx][2] - next[idx][2];
        acc += dx * dx + dy * dy + dz * dz;
    }
    (acc / len as f32).sqrt()
}

fn write_parity_report(output_dir: &Path, reports: &[JobReport]) -> Result<()> {
    let parity_jobs: Vec<ParityJobReport> = reports
        .iter()
        .filter_map(|job| job.parity.clone().map(|stats| (job, stats)))
        .map(|(job, stats)| ParityJobReport {
            label: job.job.label.clone(),
            image_file: job.job.image_file.clone(),
            parity: stats,
        })
        .collect();

    if parity_jobs.is_empty() {
        return Ok(());
    }

    let aggregate = aggregate_parity(parity_jobs.iter().map(|entry| &entry.parity));
    let report = ParityReport {
        generated_at: Utc::now().to_rfc3339(),
        jobs: parity_jobs,
        aggregate,
    };
    let json = serde_json::to_string_pretty(&report)?;
    fs::write(output_dir.join("parity.json"), json)?;
    Ok(())
}

fn aggregate_parity<'a, I>(stats_iter: I) -> ParityAggregate
where
    I: Iterator<Item = &'a LabParityStats>,
{
    let mut total_samples = 0usize;
    let mut sum_abs = [0.0f64; 3];
    let mut max_abs = [0.0f32; 3];
    let mut sum_delta = 0.0f64;
    let mut max_delta = 0.0f32;
    let mut buckets = ParityBuckets {
        under_0_1: 0,
        under_0_25: 0,
        under_1_0: 0,
        over_1_0: 0,
    };

    for stats in stats_iter {
        let weight = stats.sample_count as f64;
        total_samples += stats.sample_count;
        sum_abs[0] += stats.mean_abs_l as f64 * weight;
        sum_abs[1] += stats.mean_abs_a as f64 * weight;
        sum_abs[2] += stats.mean_abs_b as f64 * weight;
        max_abs[0] = max_abs[0].max(stats.max_abs_l);
        max_abs[1] = max_abs[1].max(stats.max_abs_a);
        max_abs[2] = max_abs[2].max(stats.max_abs_b);
        sum_delta += stats.mean_delta as f64 * weight;
        max_delta = max_delta.max(stats.max_delta);
        buckets.under_0_1 += stats.buckets.under_0_1;
        buckets.under_0_25 += stats.buckets.under_0_25;
        buckets.under_1_0 += stats.buckets.under_1_0;
        buckets.over_1_0 += stats.buckets.over_1_0;
    }

    let denom = total_samples.max(1) as f64;
    ParityAggregate {
        sample_count: total_samples,
        mean_abs_l: (sum_abs[0] / denom) as f32,
        mean_abs_a: (sum_abs[1] / denom) as f32,
        mean_abs_b: (sum_abs[2] / denom) as f32,
        max_abs_l: max_abs[0],
        max_abs_a: max_abs[1],
        max_abs_b: max_abs[2],
        mean_delta: (sum_delta / denom) as f32,
        max_delta,
        buckets,
    }
}

fn js_rgb_to_lab(rgb: [u8; 3]) -> [f32; 3] {
    fn srgb_to_linear(c: f32) -> f32 {
        let v = c / 255.0;
        if v <= 0.04045 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    }

    fn pivot_lab(t: f32) -> f32 {
        if t > 0.008856 {
            t.cbrt()
        } else {
            (7.787 * t) + (16.0 / 116.0)
        }
    }

    const WHITEPOINT: [f32; 3] = [95.047, 100.0, 108.883];

    let r_lin = srgb_to_linear(rgb[0] as f32);
    let g_lin = srgb_to_linear(rgb[1] as f32);
    let b_lin = srgb_to_linear(rgb[2] as f32);

    let x = (r_lin * 0.4124 + g_lin * 0.3576 + b_lin * 0.1805) * 100.0;
    let y = (r_lin * 0.2126 + g_lin * 0.7152 + b_lin * 0.0722) * 100.0;
    let z = (r_lin * 0.0193 + g_lin * 0.1192 + b_lin * 0.9505) * 100.0;

    let xr = x / WHITEPOINT[0];
    let yr = y / WHITEPOINT[1];
    let zr = z / WHITEPOINT[2];

    let fx = pivot_lab(xr);
    let fy = pivot_lab(yr);
    let fz = pivot_lab(zr);

    let l = (116.0 * fy) - 16.0;
    let a = 500.0 * (fx - fy);
    let b = 200.0 * (fy - fz);
    [l, a, b]
}

#[inline]
fn deg_to_rad(d: f32) -> f32 {
    d.to_radians()
}

#[inline]
fn rad_to_deg(r: f32) -> f32 {
    r.to_degrees()
}

#[inline]
fn atan2_deg(y: f32, x: f32) -> f32 {
    let mut a = rad_to_deg(y.atan2(x));
    if a < 0.0 {
        a += 360.0;
    }
    a
}

// CIEDE2000 ΔE implementation (kL=kC=kH=1)
fn delta_e_ciede2000(lab1: [f32; 3], lab2: [f32; 3]) -> f32 {
    let (l1, a1, b1) = (lab1[0], lab1[1], lab1[2]);
    let (l2, a2, b2) = (lab2[0], lab2[1], lab2[2]);

    let c1 = (a1 * a1 + b1 * b1).sqrt();
    let c2 = (a2 * a2 + b2 * b2).sqrt();
    let c_bar = 0.5 * (c1 + c2);
    let c_bar7 = c_bar.powi(7);
    let g = 0.5 * (1.0 - (c_bar7 / (c_bar7 + 25.0_f32.powi(7))).sqrt());
    let ap1 = (1.0 + g) * a1;
    let ap2 = (1.0 + g) * a2;
    let cp1 = (ap1 * ap1 + b1 * b1).sqrt();
    let cp2 = (ap2 * ap2 + b2 * b2).sqrt();
    let hp1 = if cp1 == 0.0 { 0.0 } else { atan2_deg(b1, ap1) };
    let hp2 = if cp2 == 0.0 { 0.0 } else { atan2_deg(b2, ap2) };

    let dl = l2 - l1;
    let dc = cp2 - cp1;
    let dh_deg = if cp1 * cp2 == 0.0 {
        0.0
    } else {
        let mut d = hp2 - hp1;
        if d > 180.0 {
            d -= 360.0;
        }
        if d < -180.0 {
            d += 360.0;
        }
        d
    };
    let dh = 2.0 * (cp1 * cp2).sqrt() * (deg_to_rad(dh_deg * 0.5)).sin();

    let l_bar = 0.5 * (l1 + l2);
    let c_bar_p = 0.5 * (cp1 + cp2);
    let h_bar = if cp1 * cp2 == 0.0 {
        hp1 + hp2
    } else if (hp1 - hp2).abs() <= 180.0 {
        0.5 * (hp1 + hp2)
    } else if (hp1 + hp2) < 360.0 {
        0.5 * (hp1 + hp2 + 360.0)
    } else {
        0.5 * (hp1 + hp2 - 360.0)
    };

    let t = 1.0 - 0.17 * deg_to_rad(h_bar - 30.0).cos()
        + 0.24 * deg_to_rad(2.0 * h_bar).cos()
        + 0.32 * deg_to_rad(3.0 * h_bar + 6.0).cos()
        - 0.20 * deg_to_rad(4.0 * h_bar - 63.0).cos();

    let delta_theta = 30.0 * (-((h_bar - 275.0) / 25.0).powi(2)).exp();
    let c_bar_p7 = c_bar_p.powi(7);
    let r_c = 2.0 * (c_bar_p7 / (c_bar_p7 + 25.0_f32.powi(7))).sqrt();
    let s_l = 1.0 + (0.015 * (l_bar - 50.0).powi(2)) / (20.0 + (l_bar - 50.0).powi(2)).sqrt();
    let s_c = 1.0 + 0.045 * c_bar_p;
    let s_h = 1.0 + 0.015 * c_bar_p * t;
    let r_t = -deg_to_rad(2.0 * delta_theta).sin() * r_c;

    let kl = 1.0;
    let kc = 1.0;
    let kh = 1.0;
    let dl_term = dl / (kl * s_l);
    let dc_term = dc / (kc * s_c);
    let dh_term = dh / (kh * s_h);
    ((dl_term * dl_term) + (dc_term * dc_term) + (dh_term * dh_term) + r_t * dc_term * dh_term)
        .sqrt()
}

// Hungarian algorithm (minimal assignment) for a square cost matrix of size n×n.
// Returns assignment: for each row i, the chosen column j.
fn hungarian_min_cost(cost: &[f32], n: usize) -> Vec<usize> {
    let mut u = vec![0.0_f64; n + 1];
    let mut v = vec![0.0_f64; n + 1];
    let mut p = vec![0_usize; n + 1];
    let mut way = vec![0_usize; n + 1];

    for i in 1..=n {
        p[0] = i;
        let mut j0 = 0_usize;
        let mut minv = vec![f64::INFINITY; n + 1];
        let mut used = vec![false; n + 1];
        loop {
            used[j0] = true;
            let i0 = p[j0];
            let mut delta = f64::INFINITY;
            let mut j1 = 0_usize;
            for j in 1..=n {
                if used[j] {
                    continue;
                }
                let cur = cost[(i0 - 1) * n + (j - 1)] as f64 - u[i0] - v[j];
                if cur < minv[j] {
                    minv[j] = cur;
                    way[j] = j0;
                }
                if minv[j] < delta {
                    delta = minv[j];
                    j1 = j;
                }
            }
            for j in 0..=n {
                if used[j] {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            j0 = j1;
            if p[j0] == 0 {
                break;
            }
        }
        loop {
            let j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
            if j0 == 0 {
                break;
            }
        }
    }

    let mut assignment = vec![0_usize; n];
    for j in 1..=n {
        if p[j] > 0 {
            assignment[p[j] - 1] = j - 1;
        }
    }
    assignment
}

// === Data structures ===

#[derive(Debug, Clone, Copy)]
enum ColorSpace {
    Rgb,
    Hsl,
    Yuv,
    Cielab,
    Cieluv,
}

impl TryFrom<&str> for ColorSpace {
    type Error = anyhow::Error;
    fn try_from(value: &str) -> Result<Self> {
        match value {
            "RGB" => Ok(Self::Rgb),
            "HSL" => Ok(Self::Hsl),
            "YUV" => Ok(Self::Yuv),
            "CIELAB" => Ok(Self::Cielab),
            "CIELUV" => Ok(Self::Cieluv),
            other => bail!("unsupported color space {other}"),
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SamplesManifest {
    #[allow(dead_code)]
    _generated_at: String,
    #[allow(dead_code)]
    _samples_dir: String,
    jobs: Vec<ManifestJob>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ManifestJob {
    label: String,
    image_file: String,
    sample_file: String,
    sample_count: usize,
    width: u32,
    height: u32,
    options: Options,
    js_metrics: JsMetrics,
    js_clusters: Vec<ClusterOutput>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Options {
    stride: u32,
    min_lum: f64,
    space: String,
    k: usize,
    max_samples: usize,
    seed: u64,
    max_iter: u32,
    tol: f64,
    #[serde(default)]
    interactive_mini_batch: Option<usize>,
    #[serde(default)]
    interactive_max_iters: Option<u32>,
    #[serde(default)]
    interactive_budget_ms: Option<f64>,
    #[serde(default)]
    interactive_min_batch: Option<usize>,
    #[serde(default)]
    interactive_shift_tol: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct JsMetrics {
    js_duration_reported_ms: f64,
    js_duration_measured_ms: f64,
    js_iterations: usize,
    total_samples: usize,
    cluster_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ClusterOutput {
    #[serde(default)]
    index: usize,
    count: usize,
    share: f64,
    centroid_space: [f32; 3],
    rgb: RgbValue,
    hsv: [f32; 3],
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
struct RgbValue {
    r: f32,
    g: f32,
    b: f32,
}

impl From<[u8; 3]> for RgbValue {
    fn from(rgb: [u8; 3]) -> Self {
        Self {
            r: rgb[0] as f32,
            g: rgb[1] as f32,
            b: rgb[2] as f32,
        }
    }
}

impl RgbValue {
    fn to_u8(self) -> [u8; 3] {
        [
            clamp_channel(self.r),
            clamp_channel(self.g),
            clamp_channel(self.b),
        ]
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct InteractiveMetrics {
    duration_ms: f64,
    iterations: usize,
    mini_batch: usize,
    max_iters: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    centroid_shift: Option<f32>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RustMetrics {
    duration_ms: f64,
    iterations: usize,
    inertia: f32,
    converged: bool,
    total_samples: usize,
    effective_k: usize,
    variant: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    interactive: Option<InteractiveMetrics>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct JobReport {
    #[serde(flatten)]
    job: ManifestJob,
    rust_metrics: RustMetrics,
    rust_clusters: Vec<ClusterOutput>,
    comparisons: ClusterComparisons,
    #[serde(skip_serializing_if = "Option::is_none")]
    parity: Option<LabParityStats>,
}

impl JobReport {
    fn empty(job: ManifestJob) -> Self {
        Self {
            job,
            rust_metrics: RustMetrics {
                duration_ms: 0.0,
                iterations: 0,
                inertia: 0.0,
                converged: true,
                total_samples: 0,
                effective_k: 0,
                variant: "inhouse".into(),
                interactive: None,
            },
            rust_clusters: Vec::new(),
            comparisons: ClusterComparisons::empty(),
            parity: None,
        }
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ClusterComparison {
    index: usize,
    js_index: usize,
    rust_index: usize,
    js_count: usize,
    rust_count: usize,
    count_diff: i64,
    js_share: f64,
    rust_share: f64,
    share_diff: f64,
    rgb_delta_max: f32,
    delta_e: f32,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ClusterComparisons {
    pairs: Vec<ClusterComparison>,
    max_delta_e: f32,
    mean_delta_e: f32,
    max_rgb_delta: f32,
    extra_js_clusters: usize,
    extra_rust_clusters: usize,
    delta_p90: f32,
    delta_p95: f32,
    delta_p99: f32,
    count_over_10: usize,
    count_over_15: usize,
    count_over_20: usize,
    share_weighted_mean_delta_e: f32,
    matching_strategy: String,
}

impl ClusterComparisons {
    fn empty() -> Self {
        Self {
            pairs: Vec::new(),
            max_delta_e: 0.0,
            mean_delta_e: 0.0,
            max_rgb_delta: 0.0,
            extra_js_clusters: 0,
            extra_rust_clusters: 0,
            delta_p90: 0.0,
            delta_p95: 0.0,
            delta_p99: 0.0,
            count_over_10: 0,
            count_over_15: 0,
            count_over_20: 0,
            share_weighted_mean_delta_e: 0.0,
            matching_strategy: "standard".into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExplainPair {
    js_index: usize,
    rust_index: usize,
    js_count: usize,
    rust_count: usize,
    delta_e: f32,
    share_diff: f64,
    intersection: usize,
    union: usize,
    jaccard: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NeighborSummary {
    index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    neighbor_index: Option<usize>,
    delta_e: f32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExplainReport {
    label: String,
    image_file: String,
    matching_strategy: String,
    delta_metric: String,
    samples: usize,
    confusion: Vec<Vec<usize>>,
    jaccard: Vec<Vec<f64>>,
    row_totals: Vec<usize>,
    col_totals: Vec<usize>,
    matched_pairs: Vec<ExplainPair>,
    nearest_js: Vec<NeighborSummary>,
    nearest_rust: Vec<NeighborSummary>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LabParityStats {
    sample_count: usize,
    mean_abs_l: f32,
    mean_abs_a: f32,
    mean_abs_b: f32,
    max_abs_l: f32,
    max_abs_a: f32,
    max_abs_b: f32,
    mean_delta: f32,
    max_delta: f32,
    buckets: ParityBuckets,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ParityBuckets {
    under_0_1: usize,
    under_0_25: usize,
    under_1_0: usize,
    over_1_0: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ParityJobReport {
    label: String,
    image_file: String,
    parity: LabParityStats,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ParityAggregate {
    sample_count: usize,
    mean_abs_l: f32,
    mean_abs_a: f32,
    mean_abs_b: f32,
    max_abs_l: f32,
    max_abs_a: f32,
    max_abs_b: f32,
    mean_delta: f32,
    max_delta: f32,
    buckets: ParityBuckets,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ParityReport {
    generated_at: String,
    jobs: Vec<ParityJobReport>,
    aggregate: ParityAggregate,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RustReport {
    generated_at: String,
    variant: String,
    jobs: Vec<JobReport>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ComparisonJobSummary {
    label: String,
    image_file: String,
    samples: usize,
    js_duration_ms: f64,
    rust_duration_ms: f64,
    duration_delta_ms: f64,
    js_iterations: usize,
    rust_iterations: usize,
    variant: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    interactive_duration_ms: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    interactive_iterations: Option<usize>,
    comparisons: ClusterComparisons,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ComparisonReport {
    generated_at: String,
    variant: String,
    delta_metric: String,
    matching_strategy: String,
    jobs: Vec<ComparisonJobSummary>,
    totals: ComparisonTotals,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ComparisonTotals {
    mean_duration_delta_ms: f64,
    max_duration_delta_ms: f64,
    max_delta_e: f32,
}

struct ReportsBundle {
    rust_report: RustReport,
    comparison_report: ComparisonReport,
    markdown_summary: String,
    tails_gate_result: Option<bool>,
}

impl ReportsBundle {
    fn from_jobs(
        jobs: Vec<JobReport>,
        variant: ComputeVariant,
        delta_metric: DeltaMetric,
        weighted: Option<WeightedMatching>,
        tails_gate_enabled: bool,
        tails_gate_limit: usize,
    ) -> Self {
        let generated_at = Utc::now().to_rfc3339();
        let variant_label = match variant {
            ComputeVariant::Inhouse => "inhouse",
            #[cfg(feature = "bench-crate")]
            ComputeVariant::Crate => "crate",
        };
        let delta_label = match delta_metric {
            DeltaMetric::De76 => "DE76",
            DeltaMetric::De2000 => "DE2000",
        };
        let matching_label = match weighted {
            Some(w) => format!("weighted(alpha={:.2})", w.alpha),
            None => "standard".into(),
        };

        let rust_report = RustReport {
            generated_at: generated_at.clone(),
            variant: variant_label.to_string(),
            jobs: jobs.clone(),
        };

        let mut comparison_jobs = Vec::new();
        let mut duration_delta_sum = 0.0_f64;
        let mut duration_delta_count = 0usize;
        let mut max_duration_delta_abs = 0.0_f64;
        let mut max_delta_e_overall = 0.0_f32;

        for job in &jobs {
            let comparisons = job.comparisons.clone();
            let duration_delta =
                job.rust_metrics.duration_ms - job.job.js_metrics.js_duration_measured_ms;
            duration_delta_sum += duration_delta;
            duration_delta_count += 1;
            max_duration_delta_abs = max_duration_delta_abs.max(duration_delta.abs());
            max_delta_e_overall = max_delta_e_overall.max(comparisons.max_delta_e);

            comparison_jobs.push(ComparisonJobSummary {
                label: job.job.label.clone(),
                image_file: job.job.image_file.clone(),
                samples: job.rust_metrics.total_samples,
                js_duration_ms: job.job.js_metrics.js_duration_measured_ms,
                rust_duration_ms: job.rust_metrics.duration_ms,
                duration_delta_ms: duration_delta,
                js_iterations: job.job.js_metrics.js_iterations,
                rust_iterations: job.rust_metrics.iterations,
                variant: job.rust_metrics.variant.clone(),
                interactive_duration_ms: job
                    .rust_metrics
                    .interactive
                    .as_ref()
                    .map(|m| m.duration_ms),
                interactive_iterations: job.rust_metrics.interactive.as_ref().map(|m| m.iterations),
                comparisons,
            });
        }

        let totals = ComparisonTotals {
            mean_duration_delta_ms: if duration_delta_count == 0 {
                0.0
            } else {
                duration_delta_sum / duration_delta_count as f64
            },
            max_duration_delta_ms: max_duration_delta_abs,
            max_delta_e: max_delta_e_overall,
        };

        let comparison_report = ComparisonReport {
            generated_at: generated_at.clone(),
            variant: variant_label.to_string(),
            delta_metric: delta_label.to_string(),
            matching_strategy: matching_label,
            jobs: comparison_jobs,
            totals,
        };

        let tails_gate_result = if tails_gate_enabled {
            Some(tails_gate_pass(&comparison_report, tails_gate_limit))
        } else {
            None
        };

        let markdown_summary = build_markdown_summary(
            &comparison_report,
            tails_gate_result,
            tails_gate_enabled.then_some(tails_gate_limit),
        );

        Self {
            rust_report,
            comparison_report,
            markdown_summary,
            tails_gate_result,
        }
    }
}

fn build_markdown_summary(
    report: &ComparisonReport,
    tails_gate_result: Option<bool>,
    tails_gate_limit: Option<usize>,
) -> String {
    let mut md = String::new();
    md.push_str(&format!(
        "# Benchmark Summary (variant: {}, ΔE: {}, matching: {})\n\n",
        report.variant, report.delta_metric, report.matching_strategy
    ));
    md.push_str(
        "| Image | Samples | Variant | Interactive ms | JS ms (measured) | Rust ms | Δms | Max ΔE | Mean ΔE | P95 ΔE | >20 cnt | Max ΔRGB |\n",
    );
    md.push_str("|---|---:|:---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n");
    let mut has_extras = false;
    for job in &report.jobs {
        let comps = &job.comparisons;
        if comps.extra_js_clusters > 0 || comps.extra_rust_clusters > 0 {
            has_extras = true;
        }
        let label = if comps.extra_js_clusters > 0 || comps.extra_rust_clusters > 0 {
            format!("{}*", job.label)
        } else {
            job.label.clone()
        };
        let interactive_ms = job
            .interactive_duration_ms
            .map(|v| format!("{:.2}", v))
            .unwrap_or_else(|| "-".into());
        md.push_str(&format!(
            "| {} | {} | {} | {} | {:.2} | {:.2} | {:+.2} | {:.2} | {:.2} | {:.2} | {} | {:.2} |\n",
            label,
            job.samples,
            job.variant,
            interactive_ms,
            job.js_duration_ms,
            job.rust_duration_ms,
            job.duration_delta_ms,
            comps.max_delta_e,
            comps.mean_delta_e,
            comps.delta_p95,
            comps.count_over_20,
            comps.max_rgb_delta
        ));
    }
    md.push_str("\n");
    md.push_str(&format!(
        "Average Δms: {:+.2} — Max Δms: {:+.2} — Max ΔE: {:.2}\n",
        report.totals.mean_duration_delta_ms,
        report.totals.max_duration_delta_ms,
        report.totals.max_delta_e
    ));
    if report
        .jobs
        .iter()
        .any(|j| j.comparisons.share_weighted_mean_delta_e > 0.0)
    {
        let avg_share_weighted = if report.jobs.is_empty() {
            0.0
        } else {
            report
                .jobs
                .iter()
                .map(|j| j.comparisons.share_weighted_mean_delta_e as f64)
                .sum::<f64>()
                / report.jobs.len() as f64
        };
        md.push_str(&format!(
            "Mean ΔE (share-weighted) avg: {:.2}\n",
            avg_share_weighted
        ));
    }
    // Show speed gate result for inhouse
    if report.variant == "inhouse" {
        let pass = speed_gate(report, 1.20);
        md.push_str(&format!(
            "Speed gate (Rust ≤ +20% vs JS per image): {}\n",
            if pass { "PASS" } else { "FAIL" }
        ));
    }
    if has_extras {
        md.push_str(
            "* Rows marked with * indicate unmatched clusters between JS and Rust outputs.\n",
        );
    }
    if let Some(result) = tails_gate_result {
        let limit = tails_gate_limit.unwrap_or(0);
        md.push_str(&format!(
            "Tails gate (ΔE>20 clusters ≤{}): {}\n",
            limit,
            if result { "PASS" } else { "FAIL" }
        ));
    }
    md
}

fn speed_gate(report: &ComparisonReport, max_ratio: f64) -> bool {
    report.jobs.iter().all(|job| {
        let allowed = job.js_duration_ms * max_ratio;
        job.rust_duration_ms <= allowed
    })
}

fn tails_gate_pass(report: &ComparisonReport, max_allowed: usize) -> bool {
    report
        .jobs
        .iter()
        .all(|job| job.comparisons.count_over_20 <= max_allowed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn centroid_shift_zero_for_identical() {
        let prev = vec![[1.0, 2.0, 3.0], [0.5, -0.4, 0.1]];
        let next = prev.clone();
        assert_eq!(centroid_shift(&prev, &next), 0.0);
    }

    #[test]
    fn centroid_shift_computes_distance() {
        let prev = vec![[0.0, 0.0, 0.0], [1.0, 1.0, 1.0]];
        let next = vec![[1.0, 0.0, 0.0], [1.0, 2.0, 1.0]];
        let shift = centroid_shift(&prev, &next);
        assert!((shift - 1.0).abs() < 1e-6);
    }

    #[test]
    fn compute_lab_parity_matches_js_transform() {
        let samples = vec![
            [0, 0, 0],
            [128, 64, 32],
            [255, 255, 255],
            [12, 200, 128],
            [240, 30, 220],
        ];
        let stats = compute_lab_parity(&samples, 100);
        assert_eq!(stats.sample_count, samples.len());
        assert!(stats.max_delta < 0.05);
        assert_eq!(stats.buckets.over_1_0, 0);
    }

    #[test]
    fn tails_gate_enforces_threshold() {
        let base_report = ComparisonReport {
            generated_at: "now".into(),
            variant: "inhouse".into(),
            delta_metric: "DE2000".into(),
            matching_strategy: "standard".into(),
            jobs: vec![ComparisonJobSummary {
                label: "sample".into(),
                image_file: "sample.png".into(),
                samples: 100,
                js_duration_ms: 1000.0,
                rust_duration_ms: 200.0,
                duration_delta_ms: -800.0,
                js_iterations: 10,
                rust_iterations: 5,
                variant: "inhouse".into(),
                interactive_duration_ms: None,
                interactive_iterations: None,
                comparisons: ClusterComparisons {
                    pairs: Vec::new(),
                    max_delta_e: 0.0,
                    mean_delta_e: 0.0,
                    max_rgb_delta: 0.0,
                    extra_js_clusters: 0,
                    extra_rust_clusters: 0,
                    delta_p90: 0.0,
                    delta_p95: 0.0,
                    delta_p99: 0.0,
                    count_over_10: 0,
                    count_over_15: 0,
                    count_over_20: 2,
                    share_weighted_mean_delta_e: 0.0,
                    matching_strategy: "standard".into(),
                },
            }],
            totals: ComparisonTotals {
                mean_duration_delta_ms: -800.0,
                max_duration_delta_ms: 800.0,
                max_delta_e: 0.0,
            },
        };

        assert!(tails_gate_pass(&base_report, 3));

        let mut failing = base_report.clone();
        failing.jobs[0].comparisons.count_over_20 = 7;
        assert!(!tails_gate_pass(&failing, 6));
    }
}
