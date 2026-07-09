use std::hint::black_box;
use std::io::{self, Read};
use std::path::PathBuf;
use std::process::{Child, Command, ExitStatus, Stdio};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

use rayon::prelude::*;
use tauri_app::color;

const DEFAULT_WIDTH: u32 = 320;
const DEFAULT_HEIGHT: u32 = 180;
const PIXELS_PER_FRAME: usize = 57_600;
const BENCH_REPS: usize = 100;
const WARMUP_REPS: usize = 10;
const USAGE: &str = "Usage:\n  live_pipe_probe pipe <clip> [--ffmpeg <path>] [--width 320] [--height 180]\n  live_pipe_probe convert";

struct PipeOptions {
    clip: PathBuf,
    ffmpeg: String,
    width: u32,
    height: u32,
}

struct ChildGuard {
    child: Child,
    stderr_thread: Option<JoinHandle<io::Result<Vec<u8>>>>,
    reaped: bool,
}

impl ChildGuard {
    fn new(child: Child, stderr_thread: JoinHandle<io::Result<Vec<u8>>>) -> Self {
        Self {
            child,
            stderr_thread: Some(stderr_thread),
            reaped: false,
        }
    }

    fn wait(mut self) -> Result<(ExitStatus, String), String> {
        let status = self
            .child
            .wait()
            .map_err(|error| format!("failed to wait for ffmpeg: {error}"))?;
        self.reaped = true;
        let stderr = self.join_stderr()?;
        Ok((status, stderr))
    }

    fn join_stderr(&mut self) -> Result<String, String> {
        let handle = self
            .stderr_thread
            .take()
            .ok_or_else(|| "ffmpeg stderr drain was already joined".to_string())?;
        let bytes = handle
            .join()
            .map_err(|_| "ffmpeg stderr drain thread panicked".to_string())?
            .map_err(|error| format!("failed to drain ffmpeg stderr: {error}"))?;
        Ok(String::from_utf8_lossy(&bytes).trim().to_string())
    }
}

impl Drop for ChildGuard {
    fn drop(&mut self) {
        if !self.reaped {
            if !matches!(self.child.try_wait(), Ok(Some(_))) {
                let _ = self.child.kill();
            }
            let _ = self.child.wait();
        }
        if let Some(handle) = self.stderr_thread.take() {
            let _ = handle.join();
        }
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error}\n\n{USAGE}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    match args.next().as_deref() {
        Some("pipe") => run_pipe(parse_pipe_options(args.collect())?),
        Some("convert") => {
            if let Some(extra) = args.next() {
                return Err(format!("unexpected argument for convert: {extra}"));
            }
            run_convert();
            Ok(())
        }
        Some("-h" | "--help") => {
            println!("{USAGE}");
            Ok(())
        }
        Some(command) => Err(format!("unknown subcommand: {command}")),
        None => Err("missing subcommand".to_string()),
    }
}

fn parse_pipe_options(args: Vec<String>) -> Result<PipeOptions, String> {
    let mut args = args.into_iter();
    let clip = args
        .next()
        .ok_or_else(|| "pipe requires a clip path".to_string())?;
    let mut options = PipeOptions {
        clip: PathBuf::from(clip),
        ffmpeg: "ffmpeg".to_string(),
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    };

    while let Some(flag) = args.next() {
        let value = args
            .next()
            .ok_or_else(|| format!("{flag} requires a value"))?;
        match flag.as_str() {
            "--ffmpeg" => options.ffmpeg = value,
            "--width" => options.width = parse_dimension("width", &value)?,
            "--height" => options.height = parse_dimension("height", &value)?,
            _ => return Err(format!("unknown pipe option: {flag}")),
        }
    }

    if !options.clip.is_file() {
        return Err(format!(
            "clip is not a readable regular file: {}",
            options.clip.display()
        ));
    }
    Ok(options)
}

fn parse_dimension(name: &str, value: &str) -> Result<u32, String> {
    let dimension = value
        .parse::<u32>()
        .map_err(|_| format!("invalid {name} '{value}': expected a positive integer"))?;
    if dimension == 0 {
        return Err(format!("invalid {name} '{value}': value must be non-zero"));
    }
    Ok(dimension)
}

fn run_pipe(options: PipeOptions) -> Result<(), String> {
    let frame_bytes = (options.width as usize)
        .checked_mul(options.height as usize)
        .and_then(|pixels| pixels.checked_mul(3))
        .ok_or_else(|| "frame dimensions overflow the addressable buffer size".to_string())?;
    let filter = format!(
        "fps=24,scale={}:{}:flags=area",
        options.width, options.height
    );
    let mut child = Command::new(&options.ffmpeg)
        .arg("-i")
        .arg(&options.clip)
        .args(["-f", "rawvideo", "-pix_fmt", "rgb24", "-vf"])
        .arg(&filter)
        .args(["-v", "error", "pipe:1"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| {
            format!(
                "failed to start ffmpeg executable '{}': {error}",
                options.ffmpeg
            )
        })?;
    let mut stdout = child
        .stdout
        .take()
        .expect("stdout is present because it was configured as piped");
    let mut stderr = child
        .stderr
        .take()
        .expect("stderr is present because it was configured as piped");
    let stderr_thread = std::thread::spawn(move || {
        let mut bytes = Vec::new();
        stderr.read_to_end(&mut bytes)?;
        Ok(bytes)
    });
    let guard = ChildGuard::new(child, stderr_thread);

    let started = Instant::now();
    let mut buffer = vec![0_u8; frame_bytes];
    let mut read_latencies = Vec::new();
    loop {
        let read_started = Instant::now();
        match stdout.read_exact(&mut buffer) {
            Ok(()) => {
                read_latencies.push(read_started.elapsed());
                black_box(&buffer);
            }
            Err(error) if error.kind() == io::ErrorKind::UnexpectedEof => break,
            Err(error) => {
                return Err(format!(
                    "failed while reading raw frame {} from ffmpeg: {error}",
                    read_latencies.len() + 1
                ));
            }
        }
    }
    drop(stdout);
    let (status, stderr) = guard.wait()?;
    let wall = started.elapsed();
    if !status.success() {
        let detail = if stderr.is_empty() {
            "ffmpeg produced no diagnostic output".to_string()
        } else {
            stderr
        };
        return Err(format!(
            "ffmpeg exited with {status} after {} complete frame(s): {detail}",
            read_latencies.len()
        ));
    }
    if read_latencies.is_empty() {
        return Err("ffmpeg exited successfully but produced no complete RGB frames".to_string());
    }

    print_pipe_stats(&options, wall, &mut read_latencies);
    Ok(())
}

fn print_pipe_stats(options: &PipeOptions, wall: Duration, latencies: &mut [Duration]) {
    latencies.sort_unstable();
    let frames = latencies.len();
    let mean_ms =
        latencies.iter().map(Duration::as_secs_f64).sum::<f64>() * 1_000.0 / frames as f64;
    let p95_index = (frames * 95).div_ceil(100) - 1;
    let p95_ms = latencies[p95_index].as_secs_f64() * 1_000.0;
    let max_ms = latencies[frames - 1].as_secs_f64() * 1_000.0;
    let sustained_fps = frames as f64 / wall.as_secs_f64();

    println!("Rawvideo pipe probe");
    println!("  clip: {}", options.clip.display());
    println!("  frame: {}x{} rgb24", options.width, options.height);
    println!("  frames: {frames}");
    println!("  wall time: {:.3} s", wall.as_secs_f64());
    println!("  sustained fps: {sustained_fps:.2}");
    println!("  read latency mean: {mean_ms:.3} ms");
    println!("  read latency p95: {p95_ms:.3} ms");
    println!("  read latency max: {max_ms:.3} ms");
}

fn run_convert() {
    let frame = deterministic_frame();
    let lut = build_srgb_lut();
    let current_ms = benchmark_conversion(&frame, |input, output| {
        for (pixel, converted) in input.chunks_exact(3).zip(output) {
            *converted = color::rgb8_to_oklab([pixel[0], pixel[1], pixel[2]]);
        }
    });
    let lut_ms = benchmark_conversion(&frame, |input, output| {
        for (pixel, converted) in input.chunks_exact(3).zip(output) {
            *converted = lut_pixel_to_oklab(pixel, &lut);
        }
    });
    let parallel_ms = benchmark_conversion(&frame, |input, output| {
        input
            .par_chunks(3)
            .zip(output.par_iter_mut())
            .for_each(|(pixel, converted)| *converted = lut_pixel_to_oklab(pixel, &lut));
    });

    println!("OKLab conversion probe");
    println!("  frame: {PIXELS_PER_FRAME} pixels; {BENCH_REPS} reps after {WARMUP_REPS} warmup");
    println!("  current sequential rgb8_to_oklab: {current_ms:.3} ms/frame");
    println!("  LUT sequential: {lut_ms:.3} ms/frame");
    println!("  LUT + rayon par_chunks: {parallel_ms:.3} ms/frame");
}

fn benchmark_conversion<F>(frame: &[u8], mut convert: F) -> f64
where
    F: FnMut(&[u8], &mut [[f32; 3]]),
{
    let mut output = vec![[0.0_f32; 3]; PIXELS_PER_FRAME];
    for _ in 0..WARMUP_REPS {
        convert(black_box(frame), &mut output);
        black_box(&output);
    }
    let started = Instant::now();
    for _ in 0..BENCH_REPS {
        convert(black_box(frame), &mut output);
        black_box(&output);
    }
    started.elapsed().as_secs_f64() * 1_000.0 / BENCH_REPS as f64
}

fn deterministic_frame() -> Vec<u8> {
    let mut frame = Vec::with_capacity(PIXELS_PER_FRAME * 3);
    for index in 0..PIXELS_PER_FRAME {
        let x = index % DEFAULT_WIDTH as usize;
        let y = index / DEFAULT_WIDTH as usize;
        frame.extend_from_slice(&[
            ((x * 37 + y * 17 + 13) & 0xff) as u8,
            ((x * 11 + y * 29 + 71) & 0xff) as u8,
            ((x * 23 + y * 7 + 191) & 0xff) as u8,
        ]);
    }
    frame
}

fn build_srgb_lut() -> [f32; 256] {
    std::array::from_fn(|index| {
        let srgb = index as f32 / 255.0;
        if srgb <= 0.04045 {
            srgb / 12.92
        } else {
            ((srgb + 0.055) / 1.055).powf(2.4)
        }
    })
}

fn lut_pixel_to_oklab(pixel: &[u8], lut: &[f32; 256]) -> [f32; 3] {
    linear_rgb_to_oklab([
        lut[pixel[0] as usize],
        lut[pixel[1] as usize],
        lut[pixel[2] as usize],
    ])
}

#[allow(clippy::excessive_precision)]
fn linear_rgb_to_oklab(rgb: [f32; 3]) -> [f32; 3] {
    let l = 0.4122214708 * rgb[0] + 0.5363325363 * rgb[1] + 0.0514459929 * rgb[2];
    let m = 0.2119034982 * rgb[0] + 0.6806995451 * rgb[1] + 0.1073969566 * rgb[2];
    let s = 0.0883024619 * rgb[0] + 0.2817188376 * rgb[1] + 0.6299787005 * rgb[2];
    let l = l.cbrt();
    let m = m.cbrt();
    let s = s.cbrt();
    [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn srgb_lut_matches_current_conversion_for_every_channel_value() {
        let lut = build_srgb_lut();
        // sRGB transfer is channel-independent, so enumerating each byte value once
        // covers every channel of every 24-bit RGB input (all 16.7M combinations).
        for value in u8::MIN..=u8::MAX {
            let expected = color::srgb8_to_linear([value; 3]);
            for component in expected {
                let error = (lut[value as usize] - component).abs();
                assert!(error < 1e-3, "value {value} differed by {error}");
            }
        }
    }

    #[test]
    fn lut_pipeline_matches_shipping_rgb8_to_oklab() {
        // The OKLab matrix above is a copy of color.rs's (this bin may not
        // touch shipping modules); this pins the full LUT pipeline to the
        // shipping conversion so silent drift fails loudly.
        let lut = build_srgb_lut();
        for r in (0..=255).step_by(17) {
            for g in (0..=255).step_by(17) {
                for b in (0..=255).step_by(17) {
                    let pixel = [r as u8, g as u8, b as u8];
                    let expected = color::rgb8_to_oklab(pixel);
                    let actual = lut_pixel_to_oklab(&pixel, &lut);
                    for (a, e) in actual.iter().zip(expected.iter()) {
                        let error = (a - e).abs();
                        assert!(error < 1e-3, "rgb {pixel:?} differed by {error}");
                    }
                }
            }
        }
    }
}
