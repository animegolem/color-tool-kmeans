use std::io::{self, Read};
use std::time::Instant;

use rand::{rngs::SmallRng, Rng, SeedableRng};
use serde::{Deserialize, Serialize};
use tauri_app::color;
use tauri_app::kmeans::{run_kmeans, KMeansConfig};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    width: u32,
    height: u32,
    data: Vec<u8>,
    #[serde(default)]
    stride: u32,
    #[serde(default)]
    min_lum: u8,
    #[serde(default = "default_max_samples")]
    max_samples: usize,
    #[serde(default = "default_k")]
    k: usize,
    #[serde(default = "default_max_iter")]
    max_iter: u32,
    #[serde(default = "default_tol")]
    tol: f32,
    #[serde(default = "default_seed")]
    seed: u64,
    #[serde(default = "default_space")]
    space: String,
}

fn default_k() -> usize {
    16
}
fn default_max_iter() -> u32 {
    40
}
fn default_tol() -> f32 {
    1e-3
}
fn default_seed() -> u64 {
    1
}
fn default_max_samples() -> usize {
    300_000
}
fn default_space() -> String {
    "CIELAB".into()
}

#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
struct RgbValue {
    r: u8,
    g: u8,
    b: u8,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ClusterOut {
    count: usize,
    share: f64,
    centroid_space: [f32; 3],
    rgb: RgbValue,
    hsv: [f32; 3],
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalyzeResponse {
    clusters: Vec<ClusterOut>,
    iterations: usize,
    duration_ms: f64,
    total_samples: usize,
    variant: String,
}

fn main() -> anyhow::Result<()> {
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf)?;
    if buf.trim().is_empty() {
        anyhow::bail!("expected JSON request on stdin");
    }
    let req: Request = serde_json::from_str(&buf)?;
    let width = req.width as usize;
    let height = req.height as usize;
    if width == 0 || height == 0 {
        anyhow::bail!("width/height must be > 0");
    }
    let pixels = width * height;
    let channels = match req.data.len() / pixels {
        3 => 3,
        4 => 4,
        other => anyhow::bail!("unsupported channel count: {other}"),
    };

    let stride = req.stride.max(1) as usize;
    let max_samples = if req.max_samples == 0 {
        usize::MAX
    } else {
        req.max_samples
    };
    let min_lum = req.min_lum as f32;

    let mut rng = SmallRng::seed_from_u64(req.seed);
    let mut samples: Vec<[u8; 3]> = Vec::with_capacity(max_samples.min(pixels));
    let mut seen = 0usize;
    for y in (0..height).step_by(stride) {
        for x in (0..width).step_by(stride) {
            let idx = (y * width + x) * channels;
            let r = req.data[idx];
            let g = req.data[idx + 1];
            let b = req.data[idx + 2];
            let lum = 0.2126 * (r as f32) + 0.7152 * (g as f32) + 0.0722 * (b as f32);
            if lum < min_lum {
                continue;
            }
            seen += 1;
            if samples.len() < max_samples {
                samples.push([r, g, b]);
            } else {
                let ridx = rng.gen_range(0..seen);
                if ridx < max_samples {
                    samples[ridx] = [r, g, b];
                }
            }
        }
    }

    if samples.is_empty() {
        anyhow::bail!("no pixels met sampling criteria (check stride/minLum)");
    }

    let space_upper = req.space.to_ascii_uppercase();
    let dataset: Vec<[f32; 3]> = match space_upper.as_str() {
        "CIELAB" | "LAB" => samples.iter().map(|&rgb| color::rgb8_to_lab(rgb)).collect(),
        "RGB" => samples
            .iter()
            .map(|&rgb| [rgb[0] as f32, rgb[1] as f32, rgb[2] as f32])
            .collect(),
        "HSL" => samples.iter().map(|&rgb| color::rgb8_to_hsl(rgb)).collect(),
        "HSV" => samples.iter().map(|&rgb| color::rgb8_to_hsv(rgb)).collect(),
        "YUV" => samples.iter().map(|&rgb| color::rgb8_to_yuv(rgb)).collect(),
        "CIELUV" | "LUV" => samples.iter().map(|&rgb| color::rgb8_to_luv(rgb)).collect(),
        _ => anyhow::bail!("unsupported color space"),
    };

    let k = req.k.min(dataset.len().max(1));
    let cfg = KMeansConfig {
        k,
        max_iters: req.max_iter as usize,
        tol: req.tol,
        seed: req.seed,
        warm_start: None,
        mini_batch: None,
    };

    let start = Instant::now();
    let result = run_kmeans(&dataset, &cfg);
    let duration_ms = start.elapsed().as_secs_f64() * 1000.0;

    let mut clusters: Vec<ClusterOut> = Vec::with_capacity(result.centroids.len());
    for (centroid, &count) in result.centroids.iter().zip(result.counts.iter()) {
        if count == 0 {
            continue;
        }
        let rgb_u8 = match space_upper.as_str() {
            "RGB" => [
                centroid[0].round().clamp(0.0, 255.0) as u8,
                centroid[1].round().clamp(0.0, 255.0) as u8,
                centroid[2].round().clamp(0.0, 255.0) as u8,
            ],
            "HSL" => color::hsl_to_rgb8(*centroid),
            "HSV" => color::hsv_to_rgb8(*centroid),
            "YUV" => color::yuv_to_rgb8(*centroid),
            "CIELAB" | "LAB" => color::lab_to_rgb8(*centroid),
            "CIELUV" | "LUV" => color::luv_to_rgb8(*centroid),
            _ => unreachable!(),
        };
        let rgb = RgbValue {
            r: rgb_u8[0],
            g: rgb_u8[1],
            b: rgb_u8[2],
        };
        let hsv = color::rgb8_to_hsv(rgb_u8);
        clusters.push(ClusterOut {
            count,
            share: (count as f64) / (samples.len() as f64),
            centroid_space: *centroid,
            rgb,
            hsv,
        });
    }
    clusters.sort_by(|a, b| b.count.cmp(&a.count));

    let resp = AnalyzeResponse {
        clusters,
        iterations: result.iterations,
        duration_ms,
        total_samples: samples.len(),
        variant: "native".into(),
    };

    println!("{}", serde_json::to_string_pretty(&resp)?);
    Ok(())
}
