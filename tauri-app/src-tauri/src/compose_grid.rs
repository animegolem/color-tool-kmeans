use std::path::{Path, PathBuf};

use image::imageops::FilterType;
use image::{ImageReader, RgbaImage};

const GAP: u32 = 8;

/// Returns `(cols, rows)` for the given image count.
/// Extends the frontend `computeGridLayout` (which caps at 3 cols) to support
/// 4-column layouts for batch analysis of up to 16 images.
pub fn compute_grid_layout(count: usize) -> (u32, u32) {
    match count {
        0 => (0, 0),
        1 => (1, 1),
        2 => (2, 1),
        3..=4 => (2, 2),
        5..=6 => (3, 2),
        7..=9 => (3, 3),
        10..=12 => (4, 3),
        _ => (4, 4),
    }
}

/// Compose a grid of images from the given filesystem paths.
///
/// Returns `(output_path, total_width, total_height, cols, rows)`.
pub fn compose_grid(
    paths: &[String],
    max_cell_dim: u32,
    cache_dir: &Path,
) -> Result<(PathBuf, u32, u32, u32, u32), String> {
    if paths.len() < 2 {
        return Err("At least 2 images are required for grid composition".into());
    }
    if paths.len() > 16 {
        return Err("Grid composition supports a maximum of 16 images".into());
    }

    let (cols, rows) = compute_grid_layout(paths.len());
    let max_cell = max_cell_dim.max(1);

    // Load and resize each image
    let mut cells: Vec<RgbaImage> = Vec::with_capacity(paths.len());
    for path in paths {
        let img = ImageReader::open(path)
            .map_err(|e| format!("Failed to open '{}': {e}", path))?
            .with_guessed_format()
            .map_err(|e| format!("Failed to detect format for '{}': {e}", path))?
            .decode()
            .map_err(|e| format!("Failed to decode '{}': {e}", path))?;

        let rgba = img.to_rgba8();
        let (w, h) = rgba.dimensions();
        let current_max = w.max(h);
        let scaled = if current_max > max_cell {
            let scale = max_cell as f32 / current_max as f32;
            let dst_w = ((w as f32) * scale).round().max(1.0) as u32;
            let dst_h = ((h as f32) * scale).round().max(1.0) as u32;
            image::imageops::resize(&rgba, dst_w, dst_h, FilterType::Lanczos3)
        } else {
            rgba
        };
        cells.push(scaled);
    }

    // Compute cell size (max width/height among all scaled images)
    let cell_w = cells.iter().map(|c| c.width()).max().unwrap_or(1);
    let cell_h = cells.iter().map(|c| c.height()).max().unwrap_or(1);

    // Canvas dimensions including gaps
    let total_width = cols * cell_w + (cols.saturating_sub(1)) * GAP;
    let total_height = rows * cell_h + (rows.saturating_sub(1)) * GAP;

    // Canvas starts as all zeros = transparent RGBA
    let mut canvas = RgbaImage::new(total_width, total_height);

    for (i, cell) in cells.iter().enumerate() {
        let col = (i as u32) % cols;
        let row = (i as u32) / cols;
        // Center the cell within its grid slot
        let slot_x = col * (cell_w + GAP);
        let slot_y = row * (cell_h + GAP);
        let offset_x = slot_x + (cell_w - cell.width()) / 2;
        let offset_y = slot_y + (cell_h - cell.height()) / 2;
        image::imageops::overlay(&mut canvas, cell, offset_x as i64, offset_y as i64);
    }

    if !cache_dir.exists() {
        std::fs::create_dir_all(cache_dir)
            .map_err(|e| format!("Failed to create cache directory: {e}"))?;
    }

    let output_path = cache_dir.join("batch-grid.png");
    canvas
        .save(&output_path)
        .map_err(|e| format!("Failed to save grid image: {e}"))?;

    Ok((output_path, total_width, total_height, cols, rows))
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgb, RgbImage, Rgba};
    use tempfile::TempDir;

    fn make_test_image(w: u32, h: u32, color: [u8; 3]) -> (TempDir, String) {
        let dir = TempDir::new().expect("temp dir");
        let path = dir.path().join("test.png");
        let mut img = RgbImage::new(w, h);
        for pixel in img.pixels_mut() {
            *pixel = Rgb(color);
        }
        img.save(&path).expect("save test image");
        (dir, path.to_string_lossy().to_string())
    }

    fn make_test_images(count: usize, w: u32, h: u32) -> (TempDir, Vec<String>) {
        let dir = TempDir::new().expect("temp dir");
        let mut paths = Vec::new();
        let colors: Vec<[u8; 3]> = vec![
            [255, 0, 0],
            [0, 255, 0],
            [0, 0, 255],
            [255, 255, 0],
            [255, 0, 255],
            [0, 255, 255],
            [128, 128, 128],
            [64, 64, 64],
            [192, 192, 192],
            [255, 128, 0],
            [128, 0, 255],
            [0, 128, 255],
            [255, 128, 128],
            [128, 255, 128],
            [128, 128, 255],
            [200, 200, 100],
        ];
        for i in 0..count {
            let path = dir.path().join(format!("img_{i}.png"));
            let color = colors[i % colors.len()];
            let mut img = RgbImage::new(w, h);
            for pixel in img.pixels_mut() {
                *pixel = Rgb(color);
            }
            img.save(&path).expect("save test image");
            paths.push(path.to_string_lossy().to_string());
        }
        (dir, paths)
    }

    #[test]
    fn grid_layout_correctness() {
        assert_eq!(compute_grid_layout(0), (0, 0));
        assert_eq!(compute_grid_layout(1), (1, 1));
        assert_eq!(compute_grid_layout(2), (2, 1));
        assert_eq!(compute_grid_layout(3), (2, 2));
        assert_eq!(compute_grid_layout(4), (2, 2));
        assert_eq!(compute_grid_layout(5), (3, 2));
        assert_eq!(compute_grid_layout(6), (3, 2));
        assert_eq!(compute_grid_layout(7), (3, 3));
        assert_eq!(compute_grid_layout(8), (3, 3));
        assert_eq!(compute_grid_layout(9), (3, 3));
        assert_eq!(compute_grid_layout(10), (4, 3));
        assert_eq!(compute_grid_layout(11), (4, 3));
        assert_eq!(compute_grid_layout(12), (4, 3));
        assert_eq!(compute_grid_layout(13), (4, 4));
        assert_eq!(compute_grid_layout(14), (4, 4));
        assert_eq!(compute_grid_layout(15), (4, 4));
        assert_eq!(compute_grid_layout(16), (4, 4));
    }

    #[test]
    fn error_on_zero_paths() {
        let dir = TempDir::new().expect("temp dir");
        let result = compose_grid(&[], 800, dir.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("At least 2"));
    }

    #[test]
    fn error_on_one_path() {
        let (_dir, path) = make_test_image(100, 100, [255, 0, 0]);
        let cache = TempDir::new().expect("temp dir");
        let result = compose_grid(&[path], 800, cache.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("At least 2"));
    }

    #[test]
    fn error_on_seventeen_paths() {
        let cache = TempDir::new().expect("temp dir");
        let paths: Vec<String> = (0..17).map(|i| format!("/fake/path_{i}.png")).collect();
        let result = compose_grid(&paths, 800, cache.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("maximum of 16"));
    }

    #[test]
    fn error_on_unreadable_path() {
        let (_dir, good_path) = make_test_image(100, 100, [255, 0, 0]);
        let cache = TempDir::new().expect("temp dir");
        let bad_path = "/nonexistent/path/image.png".to_string();
        let result = compose_grid(&[good_path, bad_path.clone()], 800, cache.path());
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains(&bad_path),
            "Error should identify the bad path: {err}"
        );
    }

    #[test]
    fn compose_four_images() {
        let (_dir, paths) = make_test_images(4, 100, 100);
        let cache = TempDir::new().expect("temp dir");
        let (output_path, width, height, cols, rows) =
            compose_grid(&paths, 800, cache.path()).expect("compose should succeed");

        assert!(output_path.exists(), "Output file should exist");
        assert_eq!(cols, 2);
        assert_eq!(rows, 2);
        // 2 cells of 100px + 1 gap of 8px = 208
        assert_eq!(width, 208);
        assert_eq!(height, 208);

        // Verify it's a valid RGBA PNG
        let result = image::open(&output_path).expect("should open output");
        let rgba = result.to_rgba8();
        assert_eq!(rgba.width(), width);
        assert_eq!(rgba.height(), height);
    }

    #[test]
    fn transparent_gaps() {
        let (_dir, paths) = make_test_images(4, 50, 50);
        let cache = TempDir::new().expect("temp dir");
        let (output_path, _w, _h, _cols, _rows) =
            compose_grid(&paths, 800, cache.path()).expect("compose should succeed");

        let result = image::open(&output_path).expect("should open output");
        let rgba = result.to_rgba8();

        // The gap is at x=50..58 (between col 0 and col 1)
        // Sample a pixel in the gap — should be transparent
        let gap_pixel = rgba.get_pixel(53, 25);
        assert_eq!(
            gap_pixel,
            &Rgba([0, 0, 0, 0]),
            "Gap pixels should be fully transparent"
        );
    }

    #[test]
    fn deterministic_output() {
        let (_dir, paths) = make_test_images(4, 80, 60);
        let cache1 = TempDir::new().expect("temp dir");
        let cache2 = TempDir::new().expect("temp dir");

        let (path1, ..) = compose_grid(&paths, 800, cache1.path()).expect("first compose");
        let (path2, ..) = compose_grid(&paths, 800, cache2.path()).expect("second compose");

        let bytes1 = std::fs::read(&path1).expect("read first");
        let bytes2 = std::fs::read(&path2).expect("read second");
        assert_eq!(
            bytes1, bytes2,
            "Same inputs should produce identical output"
        );
    }

    #[test]
    fn scaling_large_images() {
        let (_dir, paths) = make_test_images(2, 2000, 1500);
        let cache = TempDir::new().expect("temp dir");
        let (output_path, width, height, cols, rows) =
            compose_grid(&paths, 400, cache.path()).expect("compose should succeed");

        assert!(output_path.exists());
        assert_eq!(cols, 2);
        assert_eq!(rows, 1);
        // Each image scaled: max(2000,1500)=2000 > 400, scale=0.2
        // dst_w=400, dst_h=300. Two cols: 400+8+400=808, one row: 300
        assert_eq!(width, 808);
        assert_eq!(height, 300);
    }
}
