#[cfg(not(target_arch = "wasm32"))]
use std::time::Instant;

pub(crate) struct Stopwatch {
    #[cfg(not(target_arch = "wasm32"))]
    start: Instant,
}

impl Stopwatch {
    pub(crate) fn start() -> Self {
        Self {
            #[cfg(not(target_arch = "wasm32"))]
            start: Instant::now(),
        }
    }

    pub(crate) fn elapsed_ms(&self) -> Option<f64> {
        #[cfg(not(target_arch = "wasm32"))]
        {
            Some(self.start.elapsed().as_secs_f64() * 1000.0)
        }
        #[cfg(target_arch = "wasm32")]
        {
            None
        }
    }
}
