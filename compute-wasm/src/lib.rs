use rand::{Rng, SeedableRng};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod color;
mod kmeans;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Params {
    // image layout
    width: u32,
    height: u32,
    // sampling
    #[serde(default)]
    stride: u32,
    #[serde(default)]
    min_lum: u8,
    #[serde(default = "default_max_samples")]
    max_samples: usize,
    // kmeans
    #[serde(default = "default_k")]
    k: usize,
    #[serde(default = "default_max_iter")]
    max_iter: u32,
    #[serde(default = "default_tol")]
    tol: f32,
    #[serde(default = "default_seed")]
    seed: u64,
    // color space: RGB|HSL|HSV|YUV|CIELAB|CIELUV
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

#[wasm_bindgen]
pub fn analyze_image(bytes: &[u8], params: JsValue) -> Result<JsValue, JsValue> {
    let start = js_sys::Date::now();
    let p: Params = serde_wasm_bindgen::from_value(params)
        .map_err(|e| JsValue::from_str(&format!("Invalid params: {e}")))?;

    let width = p.width as usize;
    let height = p.height as usize;
    if width == 0 || height == 0 {
        return Err(JsValue::from_str("width/height must be > 0"));
    }
    if bytes.len() < width * height * 3 {
        return Err(JsValue::from_str("pixel buffer too small for dimensions"));
    }

    let stride = p.stride.max(1) as usize;
    let max_samples = if p.max_samples == 0 {
        usize::MAX
    } else {
        p.max_samples
    };
    let min_lum = p.min_lum as f32;

    // Input can be RGB (3) or RGBA (4)
    let channels = if bytes.len() >= width * height * 4 {
        4
    } else {
        3
    };

    // Sample pixels (stride + luma filter + reservoir sampling)
    let mut rng = rand::rngs::SmallRng::seed_from_u64(p.seed);
    let mut samples: Vec<[u8; 3]> = Vec::with_capacity(max_samples.min(width * height));
    let mut seen = 0usize;
    for y in (0..height).step_by(stride) {
        for x in (0..width).step_by(stride) {
            let idx = (y * width + x) * channels;
            let r = bytes[idx];
            let g = bytes[idx + 1];
            let b = bytes[idx + 2];
            let lum = 0.2126 * (r as f32) + 0.7152 * (g as f32) + 0.0722 * (b as f32);
            if lum < min_lum {
                continue;
            }
            seen += 1;
            if samples.len() < max_samples {
                samples.push([r, g, b]);
            } else {
                let sidx = rng.gen_range(0..seen);
                if sidx < max_samples {
                    samples[sidx] = [r, g, b];
                }
            }
        }
    }

    if samples.is_empty() {
        return Err(JsValue::from_str(
            "No pixels met sampling criteria (check stride/minLum)",
        ));
    }

    // Build dataset in requested color space
    let space_upper = p.space.to_ascii_uppercase();
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
        _ => {
            return Err(JsValue::from_str(
                "Unsupported color space (RGB|HSL|HSV|YUV|CIELAB|CIELUV)",
            ))
        }
    };

    let k = p.k.min(dataset.len().max(1));
    let cfg = kmeans::KMeansConfig {
        k,
        max_iters: p.max_iter as usize,
        tol: p.tol,
        seed: p.seed,
        mini_batch: None,
    };
    let result = kmeans::run_kmeans(&dataset, &cfg);

    // Convert centroids back to RGB + HSV for UI, compute shares
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
        duration_ms: js_sys::Date::now() - start,
        total_samples: samples.len(),
        variant: "wasm".into(),
    };
    serde_wasm_bindgen::to_value(&resp)
        .map_err(|e| JsValue::from_str(&format!("Serialize failed: {e}")))
}
