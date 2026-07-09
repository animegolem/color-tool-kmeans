use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use image::imageops::FilterType;
use image::{DynamicImage, GrayImage, ImageReader, Luma, Rgb, RgbImage};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::color;
use crate::kmeans::{run_kmeans, KMeansConfig};

const VALUE_ANALYSIS_CACHE_VERSION: u8 = 5;
const VALUE_ANALYSIS_MAX_DIMENSION: u32 = 1600;
const VALUE_ANALYSIS_SQUINT_MAX_DIMENSION: u32 = 256;
const VALUE_ANALYSIS_BLUR_SIGMA: f32 = 1.0;
const PERCENTILE_LOW: f32 = 0.10;
const PERCENTILE_HIGH: f32 = 0.90;
const PERCENTILE_EXTREME_LOW: f32 = 0.01;
const PERCENTILE_EXTREME_HIGH: f32 = 0.99;
const BUCKET_QUANTILE_LOW: f32 = 0.10;
const BUCKET_QUANTILE_HIGH: f32 = 0.90;
const LEVEL_MIN: usize = 2;
const LEVEL_MAX: usize = 5;
const MAX_ITERS: usize = 20;
const HISTOGRAM_BINS: usize = 16;
const META_FILE: &str = "meta.json";
const NEUTRAL_FILE: &str = "neutral.png";
const PREVIEW_FILE: &str = "preview.png";
const BUCKET_MAP_FILE: &str = "bucket-map.png";

// Value renders can be regenerated from their source media. Keep a generous
// working set while bounding both abandoned entries and aggregate disk use.
const VALUE_CACHE_MAX_AGE: Duration = Duration::from_secs(30 * 24 * 60 * 60);
const VALUE_CACHE_MAX_BYTES: u64 = 512 * 1024 * 1024;

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
    pub bucket_map: PathBuf,
    pub bucket_map_data: Vec<u8>,
    pub p10: f32,
    pub p90: f32,
    pub p01: f32,
    pub p99: f32,
    pub centroids: Vec<f32>,
    pub boundaries: Vec<f32>,
    pub bucket_values: Vec<f32>,
    pub counts: Vec<usize>,
    pub histogram_bins: Vec<u32>,
    pub notan_mode: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ValueAnalysisMeta {
    version: u8,
    levels: usize,
    notan_mode: bool,
    #[serde(default)]
    source_path: String,
    #[serde(default)]
    source_mtime: Option<u64>,
    percentile_low: f32,
    percentile_high: f32,
    percentile_extreme_low: f32,
    percentile_extreme_high: f32,
    p10: f32,
    p90: f32,
    p01: f32,
    p99: f32,
    centroids: Vec<f32>,
    boundaries: Vec<f32>,
    bucket_values: Vec<f32>,
    counts: Vec<usize>,
    bucket_map_data: Vec<u8>,
    histogram_bins: Vec<u32>,
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
    notan_mode: bool,
    cache_root: impl AsRef<Path>,
) -> Result<ValueAnalysisResult> {
    let cache_root = cache_root.as_ref();
    let levels = levels.clamp(LEVEL_MIN, LEVEL_MAX);
    let notan_mode = notan_mode && levels == 2;
    let cache_dir = cache_root.join("value-analysis");
    fs::create_dir_all(&cache_dir)?;
    let cache_dir = cache_dir.join(sanitize_id(image_id));
    fs::create_dir_all(&cache_dir)?;
    let mode_tag = if notan_mode { "notan" } else { "kmeans" };
    let cache_dir = cache_dir.join(format!("k{levels}-{mode_tag}"));
    fs::create_dir_all(&cache_dir)?;

    let neutral_path = cache_dir.join(NEUTRAL_FILE);
    let preview_path = cache_dir.join(PREVIEW_FILE);
    let bucket_map_path = cache_dir.join(BUCKET_MAP_FILE);

    let source_path_str = path.as_ref().to_string_lossy();
    let source_mtime = file_mtime(path.as_ref());
    if neutral_path.exists() && preview_path.exists() && bucket_map_path.exists() {
        if let Some(meta) = load_meta(&cache_dir).filter(|meta| {
            is_meta_current(meta, levels, notan_mode, &source_path_str, source_mtime)
        }) {
            return Ok(ValueAnalysisResult {
                neutral: neutral_path,
                preview: preview_path,
                bucket_map: bucket_map_path,
                neutral_width: meta.neutral_width,
                neutral_height: meta.neutral_height,
                preview_width: meta.preview_width,
                preview_height: meta.preview_height,
                bucket_map_data: meta.bucket_map_data,
                p10: meta.p10,
                p90: meta.p90,
                p01: meta.p01,
                p99: meta.p99,
                centroids: meta.centroids,
                boundaries: meta.boundaries,
                bucket_values: meta.bucket_values,
                counts: meta.counts,
                histogram_bins: meta.histogram_bins,
                notan_mode: meta.notan_mode,
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

    let histogram_bins = histogram_counts(&l_values, HISTOGRAM_BINS);
    let (p10, p90) = percentile_bounds(&l_values, PERCENTILE_LOW, PERCENTILE_HIGH);
    let (p01, p99) = percentile_bounds(&l_values, PERCENTILE_EXTREME_LOW, PERCENTILE_EXTREME_HIGH);
    let mut sorted = l_values.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let effective_k = if notan_mode {
        levels
    } else {
        levels.min(sorted.len().max(1))
    };
    let (centroids, boundaries, bucket_values, counts, bucket_indices) = if notan_mode {
        let threshold = otsu_threshold(&l_values, 256).clamp(0.0, 1.0);
        let boundaries = vec![threshold];
        let (bucket_indices, mut bucket_samples) =
            assign_buckets(&l_values, &boundaries, effective_k);
        let counts: Vec<usize> = bucket_samples.iter().map(|samples| samples.len()).collect();
        let centroids = bucket_means(&bucket_samples, threshold);
        let bucket_values = bucket_representatives(&mut bucket_samples, &centroids);
        (centroids, boundaries, bucket_values, counts, bucket_indices)
    } else {
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
        let boundaries: Vec<f32> = centroids
            .windows(2)
            .map(|pair| 0.5 * (pair[0] + pair[1]))
            .collect();
        let (bucket_indices, mut bucket_samples) =
            assign_buckets(&l_values, &boundaries, effective_k);
        let counts: Vec<usize> = bucket_samples.iter().map(|samples| samples.len()).collect();
        let bucket_values = bucket_representatives(&mut bucket_samples, &centroids);
        (centroids, boundaries, bucket_values, counts, bucket_indices)
    };

    let preview = render_preview_with_buckets(
        &bucket_indices,
        preview_width,
        preview_height,
        &bucket_values,
    );
    preview.save(&preview_path)?;
    let bucket_map = render_bucket_map(&bucket_indices, preview_width, preview_height);
    bucket_map.save(&bucket_map_path)?;

    write_meta(
        &cache_dir,
        &ValueAnalysisMeta {
            version: VALUE_ANALYSIS_CACHE_VERSION,
            levels,
            notan_mode,
            source_path: source_path_str.into_owned(),
            source_mtime,
            percentile_low: PERCENTILE_LOW,
            percentile_high: PERCENTILE_HIGH,
            percentile_extreme_low: PERCENTILE_EXTREME_LOW,
            percentile_extreme_high: PERCENTILE_EXTREME_HIGH,
            p10,
            p90,
            p01,
            p99,
            centroids: centroids.clone(),
            boundaries: boundaries.clone(),
            bucket_values: bucket_values.clone(),
            counts: counts.clone(),
            bucket_map_data: bucket_indices.clone(),
            histogram_bins: histogram_bins.clone(),
            neutral_width,
            neutral_height,
            preview_width,
            preview_height,
            squint_max_dimension: VALUE_ANALYSIS_SQUINT_MAX_DIMENSION,
            blur_sigma: VALUE_ANALYSIS_BLUR_SIGMA,
        },
    );

    let result = ValueAnalysisResult {
        neutral: neutral_path,
        preview: preview_path,
        bucket_map: bucket_map_path,
        neutral_width,
        neutral_height,
        preview_width,
        preview_height,
        bucket_map_data: bucket_indices,
        p10,
        p90,
        p01,
        p99,
        centroids,
        boundaries,
        bucket_values,
        counts,
        histogram_bins,
        notan_mode,
    };
    prune_value_analysis_cache(cache_root);
    Ok(result)
}

pub fn remove_value_analysis_artifacts(
    cache_root: impl AsRef<Path>,
    image_id: &str,
) -> std::io::Result<bool> {
    let path = cache_root
        .as_ref()
        .join("value-analysis")
        .join(sanitize_id(image_id));
    if !path.exists() {
        return Ok(false);
    }
    fs::remove_dir_all(path)?;
    Ok(true)
}

pub fn prune_value_analysis_cache(cache_root: impl AsRef<Path>) {
    prune_value_analysis_cache_with_policy(
        cache_root.as_ref(),
        VALUE_CACHE_MAX_BYTES,
        VALUE_CACHE_MAX_AGE,
    );
}

fn prune_value_analysis_cache_with_policy(cache_root: &Path, max_bytes: u64, max_age: Duration) {
    let root = cache_root.join("value-analysis");
    let Ok(entries) = fs::read_dir(&root) else {
        return;
    };
    let now = SystemTime::now();
    let mut artifacts: Vec<(PathBuf, SystemTime, u64)> = entries
        .flatten()
        .filter_map(|entry| {
            let (size, modified) = artifact_stats(&entry.path()).ok()?;
            Some((entry.path(), modified, size))
        })
        .collect();

    artifacts.retain(|(path, modified, _)| {
        let expired = now
            .duration_since(*modified)
            .map(|age| age > max_age)
            .unwrap_or(false);
        if expired {
            let _ = remove_artifact_path(path);
        }
        !expired
    });

    artifacts.sort_by_key(|(_, modified, _)| *modified);
    let mut total_bytes: u64 = artifacts.iter().map(|(_, _, size)| size).sum();
    for (path, _, size) in artifacts {
        if total_bytes <= max_bytes {
            break;
        }
        if remove_artifact_path(&path).is_ok() {
            total_bytes = total_bytes.saturating_sub(size);
        }
    }
}

fn artifact_stats(path: &Path) -> std::io::Result<(u64, SystemTime)> {
    let metadata = fs::metadata(path)?;
    let mut size = metadata.len();
    let mut modified = metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH);
    if metadata.is_dir() {
        size = 0;
        for entry in fs::read_dir(path)?.flatten() {
            let (entry_size, entry_modified) = artifact_stats(&entry.path())?;
            size = size.saturating_add(entry_size);
            modified = modified.max(entry_modified);
        }
    }
    Ok((size, modified))
}

fn remove_artifact_path(path: &Path) -> std::io::Result<()> {
    if path.is_dir() {
        fs::remove_dir_all(path)
    } else {
        fs::remove_file(path)
    }
}

fn load_rgb_with_downscale(path: &Path, max_dim: u32, filter: FilterType) -> Result<RgbImage> {
    let img = ImageReader::open(path)?.with_guessed_format()?.decode()?;
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

fn render_preview_with_buckets(
    bucket_indices: &[u8],
    width: u32,
    height: u32,
    bucket_values: &[f32],
) -> RgbImage {
    let mut preview = RgbImage::new(width, height);
    for (i, pixel) in preview.pixels_mut().enumerate() {
        let idx = bucket_indices[i] as usize;
        let l = bucket_values
            .get(idx)
            .copied()
            .unwrap_or(0.5)
            .clamp(0.0, 1.0);
        let rgb = color::oklab_to_rgb8([l, 0.0, 0.0]);
        *pixel = Rgb(rgb);
    }
    preview
}

fn render_bucket_map(bucket_indices: &[u8], width: u32, height: u32) -> GrayImage {
    let mut map = GrayImage::new(width, height);
    for (i, pixel) in map.pixels_mut().enumerate() {
        let idx = bucket_indices[i];
        *pixel = Luma([idx]);
    }
    map
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

fn assign_buckets(values: &[f32], boundaries: &[f32], k: usize) -> (Vec<u8>, Vec<Vec<f32>>) {
    let mut indices = Vec::with_capacity(values.len());
    let mut buckets = vec![Vec::new(); k.max(1)];
    for &value in values.iter() {
        let idx = bucket_index(value, boundaries);
        indices.push(idx as u8);
        if let Some(bucket) = buckets.get_mut(idx) {
            bucket.push(value);
        }
    }
    (indices, buckets)
}

fn bucket_index(value: f32, boundaries: &[f32]) -> usize {
    for (idx, boundary) in boundaries.iter().enumerate() {
        if value <= *boundary {
            return idx;
        }
    }
    boundaries.len()
}

fn bucket_means(buckets: &[Vec<f32>], fallback: f32) -> Vec<f32> {
    buckets
        .iter()
        .map(|samples| {
            if samples.is_empty() {
                return fallback;
            }
            let sum: f32 = samples.iter().copied().sum();
            (sum / samples.len() as f32).clamp(0.0, 1.0)
        })
        .collect()
}

fn bucket_representatives(buckets: &mut [Vec<f32>], centroids: &[f32]) -> Vec<f32> {
    let last = buckets.len().saturating_sub(1);
    buckets
        .iter_mut()
        .enumerate()
        .map(|(idx, samples)| {
            let fallback = centroids.get(idx).copied().unwrap_or(0.5);
            if samples.is_empty() {
                return fallback;
            }
            samples.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            let quantile = if idx == 0 {
                BUCKET_QUANTILE_LOW
            } else if idx == last {
                BUCKET_QUANTILE_HIGH
            } else {
                0.5
            };
            percentile_at(samples, quantile).clamp(0.0, 1.0)
        })
        .collect()
}

fn otsu_threshold(values: &[f32], bins: usize) -> f32 {
    if values.is_empty() {
        return 0.5;
    }
    let hist = histogram_counts(values, bins.max(2));
    let total = values.len() as f32;
    let mut sum_total = 0.0;
    for (idx, count) in hist.iter().enumerate() {
        sum_total += idx as f32 * (*count as f32);
    }
    let mut sum_bg = 0.0;
    let mut weight_bg = 0.0;
    let mut best = 0usize;
    let mut best_var = -1.0;
    for (idx, count) in hist.iter().enumerate() {
        weight_bg += *count as f32;
        if weight_bg <= 0.0 {
            continue;
        }
        let weight_fg = total - weight_bg;
        if weight_fg <= 0.0 {
            break;
        }
        sum_bg += idx as f32 * (*count as f32);
        let mean_bg = sum_bg / weight_bg;
        let mean_fg = (sum_total - sum_bg) / weight_fg;
        let between = weight_bg * weight_fg * (mean_bg - mean_fg).powi(2);
        if between > best_var {
            best_var = between;
            best = idx;
        }
    }
    (best as f32 / (bins as f32 - 1.0)).clamp(0.0, 1.0)
}

fn histogram_counts(values: &[f32], bins: usize) -> Vec<u32> {
    let bins = bins.max(2);
    let mut hist = vec![0u32; bins];
    for &value in values.iter() {
        let scaled = (value.clamp(0.0, 1.0) * (bins as f32 - 1.0)).round() as usize;
        let idx = scaled.min(bins - 1);
        hist[idx] += 1;
    }
    hist
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

fn is_meta_current(
    meta: &ValueAnalysisMeta,
    levels: usize,
    notan_mode: bool,
    source_path: &str,
    source_mtime: Option<u64>,
) -> bool {
    meta.version == VALUE_ANALYSIS_CACHE_VERSION
        && meta.levels == levels
        && meta.notan_mode == notan_mode
        && !meta.source_path.is_empty()
        && meta.source_path == source_path
        && meta.source_mtime == source_mtime
        && approx_eq(meta.percentile_low, PERCENTILE_LOW)
        && approx_eq(meta.percentile_high, PERCENTILE_HIGH)
        && approx_eq(meta.percentile_extreme_low, PERCENTILE_EXTREME_LOW)
        && approx_eq(meta.percentile_extreme_high, PERCENTILE_EXTREME_HIGH)
        && approx_eq(meta.blur_sigma, VALUE_ANALYSIS_BLUR_SIGMA)
        && meta.squint_max_dimension == VALUE_ANALYSIS_SQUINT_MAX_DIMENSION
}

fn approx_eq(a: f32, b: f32) -> bool {
    (a - b).abs() <= 1e-5
}

fn file_mtime(path: &Path) -> Option<u64> {
    fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
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
    use tempfile::TempDir;

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

    #[test]
    fn aud_011_value_cache_prune_enforces_the_size_cap() {
        let temp = TempDir::new().expect("temp dir");
        let root = temp.path().join("value-analysis");
        let first = root.join("image-1").join("k3-kmeans");
        let second = root.join("image-2").join("k3-kmeans");
        fs::create_dir_all(&first).expect("first cache entry");
        fs::create_dir_all(&second).expect("second cache entry");
        fs::write(first.join(NEUTRAL_FILE), [0_u8; 8]).expect("first artifact");
        fs::write(second.join(NEUTRAL_FILE), [0_u8; 8]).expect("second artifact");

        prune_value_analysis_cache_with_policy(temp.path(), 8, VALUE_CACHE_MAX_AGE);

        let retained = fs::read_dir(root)
            .expect("retained value entries")
            .flatten()
            .count();
        assert!(retained <= 1);
    }

    #[test]
    fn aud_011_entry_removal_deletes_owned_value_artifacts() {
        let temp = TempDir::new().expect("temp dir");
        let entry = temp
            .path()
            .join("value-analysis")
            .join("image-1")
            .join("k3-kmeans");
        fs::create_dir_all(&entry).expect("cache entry");
        fs::write(entry.join(NEUTRAL_FILE), [0_u8]).expect("artifact");

        let removed =
            remove_value_analysis_artifacts(temp.path(), "image-1").expect("artifact removal");

        assert!(removed);
        assert!(!temp.path().join("value-analysis").join("image-1").exists());
    }
}
