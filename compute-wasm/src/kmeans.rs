use rand::{rngs::SmallRng, Rng, SeedableRng};

#[derive(Debug, Clone)]
pub struct KMeansConfig {
    pub k: usize,
    pub max_iters: usize,
    pub tol: f32,
    pub seed: u64,
    pub mini_batch: Option<usize>,
}

impl Default for KMeansConfig {
    fn default() -> Self {
        Self {
            k: 8,
            max_iters: 40,
            tol: 1e-3,
            seed: 1,
            mini_batch: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct KMeansResult {
    pub centroids: Vec<[f32; 3]>,
    pub counts: Vec<usize>,
    pub iterations: usize,
    pub inertia: f32,
}

#[derive(Debug, Clone)]
struct PointsSoa {
    px: Vec<f32>,
    py: Vec<f32>,
    pz: Vec<f32>,
}

impl PointsSoa {
    fn from_points(points: &[[f32; 3]]) -> Self {
        let mut px = Vec::with_capacity(points.len());
        let mut py = Vec::with_capacity(points.len());
        let mut pz = Vec::with_capacity(points.len());
        for p in points {
            px.push(p[0]);
            py.push(p[1]);
            pz.push(p[2]);
        }
        Self { px, py, pz }
    }
    fn len(&self) -> usize {
        self.px.len()
    }
    fn component_tuple(&self, i: usize) -> (f32, f32, f32) {
        (self.px[i], self.py[i], self.pz[i])
    }
}

#[derive(Debug, Clone)]
struct CentroidsSoa {
    cx: Vec<f32>,
    cy: Vec<f32>,
    cz: Vec<f32>,
}

impl CentroidsSoa {
    fn with_len(k: usize) -> Self {
        Self {
            cx: vec![0.0; k],
            cy: vec![0.0; k],
            cz: vec![0.0; k],
        }
    }
    fn len(&self) -> usize {
        self.cx.len()
    }
    fn set_from_soa(&mut self, c: usize, p: &PointsSoa, i: usize) {
        self.cx[c] = p.px[i];
        self.cy[c] = p.py[i];
        self.cz[c] = p.pz[i];
    }
    fn from_vec(v: &[[f32; 3]]) -> Self {
        let mut c = Self::with_len(v.len());
        for (i, cc) in v.iter().enumerate() {
            c.cx[i] = cc[0];
            c.cy[i] = cc[1];
            c.cz[i] = cc[2];
        }
        c
    }
    fn to_vec(&self) -> Vec<[f32; 3]> {
        self.cx
            .iter()
            .zip(&self.cy)
            .zip(&self.cz)
            .map(|((x, y), z)| [*x, *y, *z])
            .collect()
    }
    fn component_tuple(&self, i: usize) -> (f32, f32, f32) {
        (self.cx[i], self.cy[i], self.cz[i])
    }
}

#[derive(Clone, Debug, Default)]
struct ClusterPartial {
    sum_x: f32,
    sum_y: f32,
    sum_z: f32,
    count: usize,
}

#[inline]
fn squared_distance(px: f32, py: f32, pz: f32, cx: f32, cy: f32, cz: f32) -> f32 {
    let dx = px - cx;
    let dy = py - cy;
    let dz = pz - cz;
    dx * dx + dy * dy + dz * dz
}

fn assignment_step(points: &PointsSoa, cents: &CentroidsSoa) -> (Vec<ClusterPartial>, f32) {
    let k = cents.len();
    let mut totals = vec![ClusterPartial::default(); k];
    let mut inertia = 0.0f32;
    for i in 0..points.len() {
        let (px, py, pz) = points.component_tuple(i);
        let mut best = 0usize;
        let mut best_d = f32::MAX;
        for c in 0..k {
            let d = squared_distance(px, py, pz, cents.cx[c], cents.cy[c], cents.cz[c]);
            if d < best_d {
                best_d = d;
                best = c;
            }
        }
        let e = &mut totals[best];
        e.sum_x += px;
        e.sum_y += py;
        e.sum_z += pz;
        e.count += 1;
        inertia += best_d;
    }
    (totals, inertia)
}

fn kmeans_plus_plus(points: &PointsSoa, k: usize, rng: &mut SmallRng) -> CentroidsSoa {
    let n = points.len();
    let mut cents = CentroidsSoa::with_len(k);
    let mut chosen = vec![false; n];
    let first = rng.gen_range(0..n);
    cents.set_from_soa(0, points, first);
    chosen[first] = true;

    let mut dist = vec![0.0f32; n];
    for i in 0..n {
        dist[i] = squared_distance(
            points.px[i],
            points.py[i],
            points.pz[i],
            cents.cx[0],
            cents.cy[0],
            cents.cz[0],
        );
    }
    for c_idx in 1..k {
        let mut sum = 0.0;
        for (i, d) in dist.iter().enumerate() {
            if !chosen[i] {
                sum += *d;
            }
        }
        let chosen_idx = if sum == 0.0 {
            let mut idx;
            loop {
                idx = rng.gen_range(0..n);
                if !chosen[idx] {
                    break;
                }
            }
            idx
        } else {
            let mut target = rng.gen::<f32>() * sum;
            let mut idx = 0;
            for (i, d) in dist.iter().enumerate() {
                if chosen[i] {
                    continue;
                }
                target -= *d;
                if target <= 0.0 {
                    idx = i;
                    break;
                }
            }
            idx
        };
        cents.set_from_soa(c_idx, points, chosen_idx);
        chosen[chosen_idx] = true;
        for i in 0..n {
            if chosen[i] {
                dist[i] = 0.0;
                continue;
            }
            let d = squared_distance(
                points.px[i],
                points.py[i],
                points.pz[i],
                cents.cx[c_idx],
                cents.cy[c_idx],
                cents.cz[c_idx],
            );
            if d < dist[i] {
                dist[i] = d;
            }
        }
    }
    cents
}

pub fn run_kmeans(points: &[[f32; 3]], cfg: &KMeansConfig) -> KMeansResult {
    assert!(cfg.k > 0);
    assert!(points.len() >= cfg.k);
    let data = PointsSoa::from_points(points);
    let mut rng = SmallRng::seed_from_u64(cfg.seed);
    let mut cents = kmeans_plus_plus(&data, cfg.k, &mut rng);
    let mut counts = vec![0usize; cfg.k];
    let mut iterations = 0usize;
    let mut inertia = 0.0f32;
    while iterations < cfg.max_iters {
        let (partials, step_inertia) = assignment_step(&data, &cents);
        inertia = step_inertia;
        counts.fill(0);
        let mut shift = 0.0f32;
        for i in 0..cfg.k {
            let p = &partials[i];
            if p.count == 0 {
                continue;
            }
            let inv = 1.0 / p.count as f32;
            let nx = p.sum_x * inv;
            let ny = p.sum_y * inv;
            let nz = p.sum_z * inv;
            let (ox, oy, oz) = cents.component_tuple(i);
            shift += squared_distance(ox, oy, oz, nx, ny, nz);
            cents.cx[i] = nx;
            cents.cy[i] = ny;
            cents.cz[i] = nz;
            counts[i] = p.count;
        }
        iterations += 1;
        if shift.sqrt() < cfg.tol {
            break;
        }
    }
    KMeansResult {
        centroids: cents.to_vec(),
        counts,
        iterations,
        inertia,
    }
}
