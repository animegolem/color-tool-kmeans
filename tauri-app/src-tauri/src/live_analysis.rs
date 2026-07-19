use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

use rayon::prelude::*;
use tauri::{AppHandle, Emitter, State};
use tauri_app::color;
use tauri_app::ffmpeg;
use tauri_app::kmeans::{run_kmeans, KMeansConfig};

use crate::commands::{build_analysis_response, AnalysisOutputOptions};
use crate::commands_types::{
    LiveAnalysisError, LiveAnalysisFrame, LiveAnalysisStartRequest, LiveAnalysisStartResponse,
};

const WIDTH: usize = 320;
const HEIGHT: usize = 180;
const FRAME_BYTES: usize = WIDTH * HEIGHT * 3;
const ANALYSIS_FPS: f64 = 24.0;
const WARM_ITERATIONS: usize = 4;

struct Session {
    stop: Arc<AtomicBool>,
    worker: JoinHandle<()>,
}

#[derive(Default)]
pub struct LiveAnalysisState {
    next_session_id: AtomicU64,
    session: Mutex<Option<Session>>,
}

impl LiveAnalysisState {
    pub fn stop(&self) {
        let session = self.session.lock().ok().and_then(|mut slot| slot.take());
        if let Some(session) = session {
            session.stop.store(true, Ordering::Release);
            let _ = session.worker.join();
        }
    }

    fn start(&self, req: LiveAnalysisStartRequest, app: AppHandle) -> Result<u64, String> {
        validate_request(&req)?;
        self.stop();

        let session_id = self.next_session_id.fetch_add(1, Ordering::Relaxed) + 1;
        let child = spawn_ffmpeg(&req)?;
        let stop = Arc::new(AtomicBool::new(false));
        let worker_stop = Arc::clone(&stop);
        let worker = std::thread::Builder::new()
            .name(format!("live-analysis-{session_id}"))
            .spawn(move || run_worker(session_id, req, child, worker_stop, app))
            .map_err(|error| format!("Failed to start live analysis worker: {error}"))?;
        let session = Session { stop, worker };
        *self
            .session
            .lock()
            .map_err(|_| "Live analysis state is unavailable".to_string())? = Some(session);
        Ok(session_id)
    }
}

#[tauri::command]
pub fn start_live_analysis(
    req: LiveAnalysisStartRequest,
    app: AppHandle,
    state: State<'_, LiveAnalysisState>,
) -> Result<LiveAnalysisStartResponse, String> {
    let session_id = state.start(req, app)?;
    Ok(LiveAnalysisStartResponse { session_id })
}

#[tauri::command]
pub fn stop_live_analysis(state: State<'_, LiveAnalysisState>) {
    state.stop();
}

fn validate_request(req: &LiveAnalysisStartRequest) -> Result<(), String> {
    if req.path.trim().is_empty() {
        return Err("No video selected".into());
    }
    if req.k == 0 || req.k > WIDTH * HEIGHT {
        return Err(format!("Invalid live cluster count: {}", req.k));
    }
    Ok(())
}

fn spawn_ffmpeg(req: &LiveAnalysisStartRequest) -> Result<Child, String> {
    let binary = ffmpeg::ffmpeg_binary_path()?;
    Command::new(&binary)
        .args(["-hide_banner", "-loglevel", "error"])
        .args(["-ss", &format!("{:.6}", req.start_timestamp.max(0.0))])
        .args(["-i", &req.path, "-an", "-sn", "-dn"])
        .args(["-f", "rawvideo", "-pix_fmt", "rgb24", "-vf"])
        .arg(format!(
            "fps={ANALYSIS_FPS},scale={WIDTH}:{HEIGHT}:flags=area"
        ))
        .arg("pipe:1")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("Failed to start FFmpeg at {}: {error}", binary.display()))
}

fn run_worker(
    session_id: u64,
    req: LiveAnalysisStartRequest,
    mut child: Child,
    stop: Arc<AtomicBool>,
    app: AppHandle,
) {
    let result = run_loop(session_id, &req, &mut child, &stop, &app);
    let _ = child.kill();
    let _ = child.wait();
    if let Err(message) = result {
        let _ = app.emit(
            "live-analysis-error",
            LiveAnalysisError {
                session_id,
                message,
            },
        );
    }
}

fn run_loop(
    session_id: u64,
    req: &LiveAnalysisStartRequest,
    child: &mut Child,
    stop: &AtomicBool,
    app: &AppHandle,
) -> Result<(), String> {
    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "FFmpeg stdout was not piped".to_string())?;
    let mut frame = vec![0_u8; FRAME_BYTES];
    let mut points = vec![[0.0_f32; 3]; WIDTH * HEIGHT];
    let mut warm_start = None;
    let mut frame_index = 0_u64;
    let mut dropped_frames = 0_u64;
    let mut emitted_frames = 0_u64;
    let wall_start = Instant::now();

    while !stop.load(Ordering::Acquire) {
        let latest_index = (wall_start.elapsed().as_secs_f64() * ANALYSIS_FPS).floor() as u64;
        let skip = latest_index.saturating_sub(frame_index);
        for _ in 0..skip {
            if !read_frame(&mut stdout, &mut frame)? {
                return Ok(());
            }
            frame_index += 1;
            dropped_frames += 1;
        }
        if !read_frame(&mut stdout, &mut frame)? {
            return Ok(());
        }
        let timestamp = req.start_timestamp.max(0.0) + frame_index as f32 / ANALYSIS_FPS as f32;
        let analysis_start = Instant::now();
        frame
            .par_chunks_exact(3)
            .zip(points.par_iter_mut())
            .for_each(|(rgb, point)| {
                *point = color::rgb8_to_oklab([rgb[0], rgb[1], rgb[2]]);
            });

        let first_frame = warm_start.is_none();
        let result = run_kmeans(
            &points,
            &KMeansConfig {
                k: req.k,
                max_iters: if first_frame { 40 } else { WARM_ITERATIONS },
                tol: if first_frame { 1e-3 } else { 0.0 },
                seed: 1,
                warm_start,
                mini_batch: None,
            },
        );
        warm_start = Some(result.centroids.clone());
        let duration_ms = analysis_start.elapsed().as_secs_f64() * 1000.0;
        emitted_frames += 1;
        let effective_fps = emitted_frames as f64 / wall_start.elapsed().as_secs_f64().max(1e-6);
        let analysis = build_analysis_response(
            result,
            &points,
            points.len(),
            AnalysisOutputOptions {
                ignore_top_n: req.ignore_top_n,
                merge_threshold: req.merge_threshold,
                snap_to_real: req.snap_to_real,
                duration_ms,
                variant: "live-warm",
            },
        );
        app.emit(
            "live-analysis-frame",
            LiveAnalysisFrame {
                session_id,
                timestamp,
                dropped_frames,
                effective_fps,
                analysis,
            },
        )
        .map_err(|error| format!("Failed to publish live analysis: {error}"))?;

        frame_index += 1;
        sleep_until_frame(frame_index, wall_start, stop);
    }
    Ok(())
}

fn read_frame(stdout: &mut impl Read, frame: &mut [u8]) -> Result<bool, String> {
    match stdout.read_exact(frame) {
        Ok(()) => Ok(true),
        Err(error) if error.kind() == std::io::ErrorKind::UnexpectedEof => Ok(false),
        Err(error) => Err(format!("Failed to read live video frame: {error}")),
    }
}

fn sleep_until_frame(frame_index: u64, wall_start: Instant, stop: &AtomicBool) {
    let deadline = wall_start + Duration::from_secs_f64(frame_index as f64 / ANALYSIS_FPS);
    while !stop.load(Ordering::Acquire) {
        let now = Instant::now();
        if now >= deadline {
            break;
        }
        std::thread::sleep((deadline - now).min(Duration::from_millis(2)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(k: usize) -> LiveAnalysisStartRequest {
        LiveAnalysisStartRequest {
            path: "clip.mp4".into(),
            start_timestamp: 0.0,
            k,
            ignore_top_n: 0,
            merge_threshold: 0.0,
            snap_to_real: false,
        }
    }

    #[test]
    fn live_request_rejects_zero_clusters() {
        assert!(validate_request(&request(0)).is_err());
    }

    #[test]
    fn live_request_accepts_the_default_cluster_count() {
        assert!(validate_request(&request(45)).is_ok());
    }
}
