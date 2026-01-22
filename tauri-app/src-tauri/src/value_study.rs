use std::fs;
use std::path::{Path, PathBuf};

use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, GrayImage, ImageReader, RgbImage};
use thiserror::Error;

use crate::color;

const VALUE_STUDY_MAX_DIMENSION: u32 = 1600;
const PERCENTILE_LOW: f32 = 0.05;
const PERCENTILE_HIGH: f32 = 0.95;
const BLACK_OFFSETS: [f32; 3] = [0.15, 0.0, -0.05];
const WHITE_OFFSETS: [f32; 3] = [0.05, 0.0, -0.15];
const TILE_ROWS: usize = 3;
const TILE_COLS: usize = 3;
const CENTER_ROW: usize = 1;
const CENTER_COL: usize = 1;

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
    pub width: u32,
    pub height: u32,
    pub percentile_low: f32,
    pub percentile_high: f32,
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
    if tile_paths.iter().all(|path| path.exists()) {
        let (width, height) = image::open(&tile_paths[CENTER_ROW * TILE_COLS + CENTER_COL])
            .map_err(ValueStudyError::Decode)?
            .dimensions();
        return Ok(ValueStudyResult {
            tiles: tile_paths,
            width,
            height,
            percentile_low: PERCENTILE_LOW,
            percentile_high: PERCENTILE_HIGH,
        });
    }

    let rgb = load_rgb_with_downscale(path.as_ref())?;
    let (width, height) = rgb.dimensions();
    let l_values = compute_l_values(&rgb);
    if l_values.is_empty() {
        return Err(ValueStudyError::EmptyImage);
    }
    let (p_low, p_high) = percentile_bounds(&l_values, PERCENTILE_LOW, PERCENTILE_HIGH);
    let range = (p_high - p_low).abs();

    let mut tiles = Vec::with_capacity(tile_paths.len());
    for row in 0..TILE_ROWS {
        let target_black = clamp01(p_low + BLACK_OFFSETS[row] * range);
        for col in 0..TILE_COLS {
            let target_white = clamp01(p_high + WHITE_OFFSETS[col] * range);
            let idx = row * TILE_COLS + col;
            let tile_path = &tile_paths[idx];
            let mut tile = GrayImage::new(width, height);
            for (i, pixel) in tile.pixels_mut().enumerate() {
                let l = l_values[i];
                let mapped = if row == CENTER_ROW && col == CENTER_COL {
                    l
                } else {
                    remap_value(l, p_low, p_high, target_black, target_white)
                };
                *pixel = image::Luma([to_u8(mapped)]);
            }
            tile.save(tile_path)?;
            tiles.push(tile_path.clone());
        }
    }

    Ok(ValueStudyResult {
        tiles,
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
    let idx = ((n - 1) as f32 * percentile).floor() as usize;
    sorted[idx]
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
