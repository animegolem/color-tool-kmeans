use std::fs;
use std::path::{Path, PathBuf};

use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, GrayImage, ImageReader, RgbImage};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::color;

const VALUE_STUDY_MAX_DIMENSION: u32 = 1600;
const VALUE_STUDY_CACHE_VERSION: u8 = 6;
const PERCENTILE_LOW: f32 = 0.10;
const PERCENTILE_HIGH: f32 = 0.90;
const MAJOR_SHIFTS: [f32; 3] = [0.35, 0.0, -0.35];
const MINOR_SCALES: [f32; 3] = [1.2, 1.0, 0.75];
const BOUNDS_BLUR_SIGMA: f32 = 1.6;
const POSTERIZE_LEVELS: u8 = 6;
const TILE_ROWS: usize = 3;
const TILE_COLS: usize = 3;
const CENTER_ROW: usize = 1;
const CENTER_COL: usize = 1;
const META_FILE: &str = "meta.json";
const NEUTRAL_FILE: &str = "neutral.png";

#[derive(Debug, Error)]
pub enum ValueStudyError {
    #[error("failed to open image: {0}")]
    Io(#[from] std::io::Error),
    #[error("failed to decode image: {0}")]
    Decode(#[from] image::ImageError),
    #[error("cache directory unavailable")]
    CacheUnavailable,
    #[error("no pixels available")]
    EmptyImage,
}

pub type Result<T> = std::result::Result<T, ValueStudyError>;

#[derive(Debug)]
pub struct ValueStudyResult {
    pub tiles: Vec<PathBuf>,
    pub neutral: PathBuf,
    pub width: u32,
    pub height: u32,
    pub percentile_low: f32,
    pub percentile_high: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ValueStudyMeta {
    version: u8,
    percentile_low: f32,
    percentile_high: f32,
    bound_low: f32,
    bound_high: f32,
    major_shifts: [f32; 3],
    minor_scales: [f32; 3],
    blur_sigma: f32,
    posterize_levels: u8,
}

pub fn generate_value_study(
    path: impl AsRef<Path>,
    image_id: &str,
    cache_root: impl AsRef<Path>,
) -> Result<ValueStudyResult> {
    let cache_dir = cache_root.as_ref().join("value-study");
    fs::create_dir_all(&cache_dir)?;
    let cache_dir = cache_dir.join(sanitize_id(image_id));
    fs::create_dir_all(&cache_dir)?;

    let tile_paths = build_tile_paths(&cache_dir);
    let neutral_path = cache_dir.join(NEUTRAL_FILE);
    if tile_paths.iter().all(|path| path.exists()) && neutral_path.exists() {
        if let Some(meta) = load_meta(&cache_dir).filter(is_meta_current) {
            let (width, height) = image::open(&tile_paths[CENTER_ROW * TILE_COLS + CENTER_COL])
                .map_err(ValueStudyError::Decode)?
                .dimensions();
            return Ok(ValueStudyResult {
                tiles: tile_paths,
                neutral: neutral_path,
                width,
                height,
                percentile_low: meta.bound_low,
                percentile_high: meta.bound_high,
            });
        }
    }

    let rgb = load_rgb_with_downscale(path.as_ref())?;
    let (width, height) = rgb.dimensions();
    let l_values = compute_l_values(&rgb);
    if l_values.is_empty() {
        return Err(ValueStudyError::EmptyImage);
    }
    let l_values_stats = if BOUNDS_BLUR_SIGMA > 0.0 {
        let blurred = image::imageops::blur(&rgb, BOUNDS_BLUR_SIGMA);
        compute_l_values(&blurred)
    } else {
        l_values.clone()
    };
    let (p_low, p_high) = percentile_bounds(&l_values_stats, PERCENTILE_LOW, PERCENTILE_HIGH);
    let mid = 0.5 * (p_low + p_high);
    let half = 0.5 * (p_high - p_low);

    let mut neutral = GrayImage::new(width, height);
    for (i, pixel) in neutral.pixels_mut().enumerate() {
        let l = l_values[i];
        *pixel = image::Luma([to_u8(l)]);
    }
    neutral.save(&neutral_path)?;

    let mut tiles = Vec::with_capacity(tile_paths.len());
    for row in 0..TILE_ROWS {
        let target_half = half * MINOR_SCALES[row];
        for col in 0..TILE_COLS {
            let target_mid = mid + MAJOR_SHIFTS[col] * half;
            let (target_black, target_white) = target_window(target_mid, target_half);
            let idx = row * TILE_COLS + col;
            let tile_path = &tile_paths[idx];
            let mut tile = GrayImage::new(width, height);
            for (i, pixel) in tile.pixels_mut().enumerate() {
                let l = l_values[i];
                let mut mapped = remap_value(l, p_low, p_high, target_black, target_white);
                if POSTERIZE_LEVELS >= 2 {
                    mapped = posterize_in_band(mapped, target_black, target_white, POSTERIZE_LEVELS);
                }
                *pixel = image::Luma([to_u8(mapped)]);
            }
            tile.save(tile_path)?;
            tiles.push(tile_path.clone());
        }
    }

    write_meta(
        &cache_dir,
        &ValueStudyMeta {
            version: VALUE_STUDY_CACHE_VERSION,
            percentile_low: PERCENTILE_LOW,
            percentile_high: PERCENTILE_HIGH,
            bound_low: p_low,
            bound_high: p_high,
            major_shifts: MAJOR_SHIFTS,
            minor_scales: MINOR_SCALES,
            blur_sigma: BOUNDS_BLUR_SIGMA,
            posterize_levels: POSTERIZE_LEVELS,
        },
    );

    Ok(ValueStudyResult {
        tiles,
        neutral: neutral_path,
        width,
        height,
        percentile_low: p_low,
        percentile_high: p_high,
    })
}

fn load_rgb_with_downscale(path: &Path) -> Result<RgbImage> {
    let img = ImageReader::open(path)?
        .with_guessed_format()?
        .decode()?;
    Ok(to_rgb_with_downscale(img, VALUE_STUDY_MAX_DIMENSION))
}

fn to_rgb_with_downscale(img: DynamicImage, max_dim: u32) -> RgbImage {
    let rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let current_max = w.max(h);
    if current_max > max_dim {
        let scale = max_dim as f32 / current_max as f32;
        let dst_w = ((w as f32) * scale).round().max(1.0) as u32;
        let dst_h = ((h as f32) * scale).round().max(1.0) as u32;
        return image::imageops::resize(&rgb, dst_w, dst_h, FilterType::Lanczos3);
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

fn posterize_in_band(value: f32, target_black: f32, target_white: f32, levels: u8) -> f32 {
    if levels < 2 {
        return value;
    }
    let band = (target_white - target_black).max(1e-6);
    let t = ((value - target_black) / band).clamp(0.0, 1.0);
    let steps = (levels - 1) as f32;
    let tq = (t * steps).round() / steps;
    (target_black + tq * band).clamp(0.0, 1.0)
}

fn remap_value(l: f32, p_low: f32, p_high: f32, target_black: f32, target_white: f32) -> f32 {
    let range = p_high - p_low;
    if range.abs() < 1e-6 {
        return l;
    }
    let t = ((l - p_low) / range).clamp(0.0, 1.0);
    let mut black = target_black;
    let mut white = target_white;
    if white <= black {
        let mid = (black + white) * 0.5;
        black = (mid - 0.01).max(0.0);
        white = (mid + 0.01).min(1.0);
    }
    (black + t * (white - black)).clamp(0.0, 1.0)
}

fn target_window(mid: f32, half: f32) -> (f32, f32) {
    let clamped_half = half.max(0.0).min(0.49);
    let clamped_mid = mid.clamp(clamped_half, 1.0 - clamped_half);
    let black = clamp01(clamped_mid - clamped_half);
    let white = clamp01(clamped_mid + clamped_half);
    if white <= black {
        let center = 0.5 * (black + white);
        return ((center - 0.01).max(0.0), (center + 0.01).min(1.0));
    }
    (black, white)
}

fn clamp01(value: f32) -> f32 {
    value.max(0.0).min(1.0)
}

fn to_u8(value: f32) -> u8 {
    (clamp01(value) * 255.0 + 0.5).floor() as u8
}

fn build_tile_paths(cache_dir: &Path) -> Vec<PathBuf> {
    let mut tiles = Vec::with_capacity(TILE_ROWS * TILE_COLS);
    for idx in 0..(TILE_ROWS * TILE_COLS) {
        tiles.push(cache_dir.join(format!("tile-{idx:02}.png")));
    }
    tiles
}

fn is_meta_current(meta: &ValueStudyMeta) -> bool {
    meta.version == VALUE_STUDY_CACHE_VERSION
        && approx_eq(meta.percentile_low, PERCENTILE_LOW)
        && approx_eq(meta.percentile_high, PERCENTILE_HIGH)
        && approx_eq(meta.blur_sigma, BOUNDS_BLUR_SIGMA)
        && meta.posterize_levels == POSTERIZE_LEVELS
        && approx_eq(meta.major_shifts[0], MAJOR_SHIFTS[0])
        && approx_eq(meta.major_shifts[1], MAJOR_SHIFTS[1])
        && approx_eq(meta.major_shifts[2], MAJOR_SHIFTS[2])
        && approx_eq(meta.minor_scales[0], MINOR_SCALES[0])
        && approx_eq(meta.minor_scales[1], MINOR_SCALES[1])
        && approx_eq(meta.minor_scales[2], MINOR_SCALES[2])
}

fn approx_eq(a: f32, b: f32) -> bool {
    (a - b).abs() <= 1e-5
}

fn load_meta(cache_dir: &Path) -> Option<ValueStudyMeta> {
    let path = cache_dir.join(META_FILE);
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

fn write_meta(cache_dir: &Path, meta: &ValueStudyMeta) {
    let path = cache_dir.join(META_FILE);
    if let Ok(data) = serde_json::to_string(meta) {
        let _ = fs::write(path, data);
    }
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
    fn remap_value_maps_range() {
        let mapped_low = remap_value(0.2, 0.2, 0.8, 0.3, 0.7);
        let mapped_mid = remap_value(0.5, 0.2, 0.8, 0.3, 0.7);
        let mapped_high = remap_value(0.8, 0.2, 0.8, 0.3, 0.7);
        assert!((mapped_low - 0.3).abs() < 1e-6);
        assert!((mapped_mid - 0.5).abs() < 1e-6);
        assert!((mapped_high - 0.7).abs() < 1e-6);
    }
}
