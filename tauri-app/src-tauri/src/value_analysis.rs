use std::fs;
use std::path::{Path, PathBuf};

use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, ImageReader, Rgb, RgbImage};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::color;
use crate::kmeans::{run_kmeans, KMeansConfig};

const VALUE_ANALYSIS_CACHE_VERSION: u8 = 1;
const VALUE_ANALYSIS_MAX_DIMENSION: u32 = 1600;
const VALUE_ANALYSIS_SQUINT_MAX_DIMENSION: u32 = 256;
const VALUE_ANALYSIS_BLUR_SIGMA: f32 = 1.0;
const PERCENTILE_LOW: f32 = 0.10;
const PERCENTILE_HIGH: f32 = 0.90;
const LEVEL_MIN: usize = 2;
const LEVEL_MAX: usize = 5;
const MAX_ITERS: usize = 20;
const META_FILE: &str = "meta.json";
const NEUTRAL_FILE: &str = "neutral.png";
const PREVIEW_FILE: &str = "preview.png";

#[derive(Debug, Error)]
pub enum ValueAnalysisError {
    #[error("failed to open image: {0}")]
    Io(#[from] std::io::Error),
    #[error("failed to decode image: {0}")]
    Decode(#[from] image::ImageError),
    #[error("cache directory unavailable")]
    CacheUnavailable,
    #[error("no pixels available")]
    EmptyImage,
}

pub type Result<T> = std::result::Result<T, ValueAnalysisError>;

#[derive(Debug)]
pub struct ValueAnalysisResult {
    pub neutral: PathBuf,
    pub neutral_width: u32,
    pub neutral_height: u32,
    pub preview: PathBuf,
    pub preview_width: u32,
    pub preview_height: u32,
    pub p10: f32,
    pub p90: f32,
    pub centroids: Vec<f32>,
    pub boundaries: Vec<f32>,
    pub counts: Vec<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ValueAnalysisMeta {
    version: u8,
    levels: usize,
    percentile_low: f32,
    percentile_high: f32,
    p10: f32,
    p90: f32,
    centroids: Vec<f32>,
    boundaries: Vec<f32>,
    counts: Vec<usize>,
    neutral_width: u32,
    neutral_height: u32,
    preview_width: u32,
    preview_height: u32,
    squint_max_dimension: u32,
    blur_sigma: f32,
}

pub fn generate_value_analysis(
    path: impl AsRef<Path>,
    image_id: &str,
    levels: usize,
    cache_root: impl AsRef<Path>,
) -> Result<ValueAnalysisResult> {
    let levels = levels.clamp(LEVEL_MIN, LEVEL_MAX);
    let cache_dir = cache_root.as_ref().join("value-analysis");
    fs::create_dir_all(&cache_dir)?;
    let cache_dir = cache_dir.join(sanitize_id(image_id));
    fs::create_dir_all(&cache_dir)?;
    let cache_dir = cache_dir.join(format!("k{levels}"));
    fs::create_dir_all(&cache_dir)?;

    let neutral_path = cache_dir.join(NEUTRAL_FILE);
    let preview_path = cache_dir.join(PREVIEW_FILE);

    if neutral_path.exists() && preview_path.exists() {
        if let Some(meta) = load_meta(&cache_dir).filter(|meta| is_meta_current(meta, levels)) {
            return Ok(ValueAnalysisResult {
                neutral: neutral_path,
                preview: preview_path,
                neutral_width: meta.neutral_width,
                neutral_height: meta.neutral_height,
                preview_width: meta.preview_width,
                preview_height: meta.preview_height,
                p10: meta.p10,
                p90: meta.p90,
                centroids: meta.centroids,
                boundaries: meta.boundaries,
                counts: meta.counts,
            });
        }
    }

    let neutral_rgb = load_rgb_with_downscale(
        path.as_ref(),
        VALUE_ANALYSIS_MAX_DIMENSION,
        FilterType::Lanczos3,
    )?;
    let (neutral_width, neutral_height) = neutral_rgb.dimensions();
    let neutral = render_neutral(&neutral_rgb);
    neutral.save(&neutral_path)?;

    let squint_rgb = load_rgb_with_downscale(
        path.as_ref(),
        VALUE_ANALYSIS_SQUINT_MAX_DIMENSION,
        FilterType::Triangle,
    )?;
    let analysis_rgb = if VALUE_ANALYSIS_BLUR_SIGMA > 0.0 {
        image::imageops::blur(&squint_rgb, VALUE_ANALYSIS_BLUR_SIGMA)
    } else {
        squint_rgb.clone()
    };
    let (preview_width, preview_height) = analysis_rgb.dimensions();
    let l_values = compute_l_values(&analysis_rgb);
    if l_values.is_empty() {
        return Err(ValueAnalysisError::EmptyImage);
    }

    let (p10, p90) = percentile_bounds(&l_values, PERCENTILE_LOW, PERCENTILE_HIGH);
    let mut sorted = l_values.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let effective_k = levels.min(sorted.len().max(1));
    let warm_start = warm_start_centroids(&sorted, effective_k);
    let dataset: Vec<[f32; 3]> = l_values.iter().map(|&l| [l, 0.0, 0.0]).collect();
    let cfg = KMeansConfig {
        k: effective_k,
        max_iters: MAX_ITERS,
        tol: 1e-4,
        seed: 1,
        warm_start: Some(warm_start),
        mini_batch: None,
    };
    let result = run_kmeans(&dataset, &cfg);

    let mut clusters: Vec<(f32, usize)> = result
        .centroids
        .iter()
        .zip(result.counts.iter())
        .map(|(centroid, &count)| (centroid[0].clamp(0.0, 1.0), count))
        .collect();
    clusters.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));

    let centroids: Vec<f32> = clusters.iter().map(|(l, _)| *l).collect();
    let counts: Vec<usize> = clusters.iter().map(|(_, count)| *count).collect();
    let boundaries: Vec<f32> = centroids
        .windows(2)
        .map(|pair| 0.5 * (pair[0] + pair[1]))
        .collect();

    let preview = render_preview(&l_values, preview_width, preview_height, &centroids);
    preview.save(&preview_path)?;

    write_meta(
        &cache_dir,
        &ValueAnalysisMeta {
            version: VALUE_ANALYSIS_CACHE_VERSION,
            levels,
            percentile_low: PERCENTILE_LOW,
            percentile_high: PERCENTILE_HIGH,
            p10,
            p90,
            centroids: centroids.clone(),
            boundaries: boundaries.clone(),
            counts: counts.clone(),
            neutral_width,
            neutral_height,
            preview_width,
            preview_height,
            squint_max_dimension: VALUE_ANALYSIS_SQUINT_MAX_DIMENSION,
            blur_sigma: VALUE_ANALYSIS_BLUR_SIGMA,
        },
    );

    Ok(ValueAnalysisResult {
        neutral: neutral_path,
        preview: preview_path,
        neutral_width,
        neutral_height,
        preview_width,
        preview_height,
        p10,
        p90,
        centroids,
        boundaries,
        counts,
    })
}

fn load_rgb_with_downscale(path: &Path, max_dim: u32, filter: FilterType) -> Result<RgbImage> {
    let img = ImageReader::open(path)?
        .with_guessed_format()?
        .decode()?;
    Ok(to_rgb_with_downscale(img, max_dim, filter))
}

fn to_rgb_with_downscale(img: DynamicImage, max_dim: u32, filter: FilterType) -> RgbImage {
    let rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let current_max = w.max(h);
    if current_max > max_dim {
        let scale = max_dim as f32 / current_max as f32;
        let dst_w = ((w as f32) * scale).round().max(1.0) as u32;
        let dst_h = ((h as f32) * scale).round().max(1.0) as u32;
        return image::imageops::resize(&rgb, dst_w, dst_h, filter);
    }
    rgb
}

fn compute_l_values(rgb: &RgbImage) -> Vec<f32> {
    rgb.pixels()
        .map(|pixel| {
            let [r, g, b] = pixel.0;
            let lab = color::rgb8_to_oklab([r, g, b]);
            lab[0].clamp(0.0, 1.0)
        })
        .collect()
}

fn render_neutral(rgb: &RgbImage) -> RgbImage {
    let (w, h) = rgb.dimensions();
    let mut neutral = RgbImage::new(w, h);
    for (src, pixel) in rgb.pixels().zip(neutral.pixels_mut()) {
        let [r, g, b] = src.0;
        let l = color::rgb8_to_oklab([r, g, b])[0].clamp(0.0, 1.0);
        let neutral_rgb = color::oklab_to_rgb8([l, 0.0, 0.0]);
        *pixel = Rgb(neutral_rgb);
    }
    neutral
}

fn render_preview(l_values: &[f32], width: u32, height: u32, centroids: &[f32]) -> RgbImage {
    let mut preview = RgbImage::new(width, height);
    for (i, pixel) in preview.pixels_mut().enumerate() {
        let l = l_values[i].clamp(0.0, 1.0);
        let nearest = nearest_centroid(l, centroids);
        let rgb = color::oklab_to_rgb8([nearest, 0.0, 0.0]);
        *pixel = Rgb(rgb);
    }
    preview
}

fn nearest_centroid(value: f32, centroids: &[f32]) -> f32 {
    let mut best = centroids[0];
    let mut best_dist = (value - best).abs();
    for &centroid in centroids.iter().skip(1) {
        let dist = (value - centroid).abs();
        if dist < best_dist {
            best = centroid;
            best_dist = dist;
        }
    }
    best
}

fn warm_start_centroids(sorted: &[f32], k: usize) -> Vec<[f32; 3]> {
    if sorted.is_empty() || k == 0 {
        return Vec::new();
    }
    let mut seeds = Vec::with_capacity(k);
    for idx in 0..k {
        let percentile = (2 * idx + 1) as f32 / (2 * k) as f32;
        let l = percentile_at(sorted, percentile);
        seeds.push([l, 0.0, 0.0]);
    }
    seeds
}

fn percentile_bounds(values: &[f32], low: f32, high: f32) -> (f32, f32) {
    if values.is_empty() {
        return (0.0, 1.0);
    }
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let p_low = percentile_at(&sorted, low);
    let p_high = percentile_at(&sorted, high);
    if p_high <= p_low {
        (p_low, (p_low + 1e-3).min(1.0))
    } else {
        (p_low, p_high)
    }
}

fn percentile_at(sorted: &[f32], percentile: f32) -> f32 {
    let n = sorted.len();
    if n == 0 {
        return 0.0;
    }
    if percentile <= 0.0 {
        return sorted[0];
    }
    if percentile >= 1.0 {
        return sorted[n - 1];
    }
    let pos = (n - 1) as f32 * percentile;
    let lower = pos.floor() as usize;
    let upper = pos.ceil() as usize;
    if lower == upper {
        return sorted[lower];
    }
    let t = pos - lower as f32;
    sorted[lower] + (sorted[upper] - sorted[lower]) * t
}

fn load_meta(cache_dir: &Path) -> Option<ValueAnalysisMeta> {
    let path = cache_dir.join(META_FILE);
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

fn write_meta(cache_dir: &Path, meta: &ValueAnalysisMeta) {
    let path = cache_dir.join(META_FILE);
    if let Ok(data) = serde_json::to_string(meta) {
        let _ = fs::write(path, data);
    }
}

fn is_meta_current(meta: &ValueAnalysisMeta, levels: usize) -> bool {
    meta.version == VALUE_ANALYSIS_CACHE_VERSION
        && meta.levels == levels
        && approx_eq(meta.percentile_low, PERCENTILE_LOW)
        && approx_eq(meta.percentile_high, PERCENTILE_HIGH)
        && approx_eq(meta.blur_sigma, VALUE_ANALYSIS_BLUR_SIGMA)
        && meta.squint_max_dimension == VALUE_ANALYSIS_SQUINT_MAX_DIMENSION
}

fn approx_eq(a: f32, b: f32) -> bool {
    (a - b).abs() <= 1e-5
}

fn sanitize_id(value: &str) -> String {
    let mut sanitized = String::with_capacity(value.len());
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
            sanitized.push(ch);
        } else {
            sanitized.push('_');
        }
    }
    if sanitized.is_empty() {
        "image".to_string()
    } else {
        sanitized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn percentile_at_bounds() {
        let values = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        assert_eq!(percentile_at(&values, 0.0), 0.1);
        assert_eq!(percentile_at(&values, 1.0), 0.5);
        assert_eq!(percentile_at(&values, 0.5), 0.3);
    }

    #[test]
    fn warm_start_uses_quantiles() {
        let values = vec![0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
        let seeds = warm_start_centroids(&values, 3);
        assert_eq!(seeds.len(), 3);
        assert!(seeds[0][0] >= 0.0 && seeds[0][0] <= 1.0);
        assert!(seeds[1][0] >= 0.0 && seeds[1][0] <= 1.0);
        assert!(seeds[2][0] >= 0.0 && seeds[2][0] <= 1.0);
    }
}
