//! Color space conversions for the Rust compute core.
//! All transforms assume sRGB primaries with a D65 white point (IEC 61966-2-1).
//!
//! Color space algorithms based on:
//! - Color-tool by L. Jégou (CC BY 3.0): https://github.com/ljegou/Color-tool
//! - CIE 15:2018 (Colorimetry, 4th Edition) for LAB/LUV
//! - IEC 61966-2-1:1999 for sRGB gamma and XYZ transforms

const EPSILON: f32 = 1e-6;
const XYZ_WHITE: [f32; 3] = [0.95047, 1.0, 1.08883]; // D65

// Frozen from the pre-libm arm64 macOS srgb_to_linear outputs. Keeping the
// exact bits preserves native 8-bit decode while making every target identical.
const SRGB8_TO_LINEAR_TABLE: [f32; 256] = [
    f32::from_bits(0x00000000),
    f32::from_bits(0x399f22b4),
    f32::from_bits(0x3a1f22b4),
    f32::from_bits(0x3a6eb40e),
    f32::from_bits(0x3a9f22b4),
    f32::from_bits(0x3ac6eb61),
    f32::from_bits(0x3aeeb40e),
    f32::from_bits(0x3b0b3e5d),
    f32::from_bits(0x3b1f22b4),
    f32::from_bits(0x3b33070b),
    f32::from_bits(0x3b46eb61),
    f32::from_bits(0x3b5b518d),
    f32::from_bits(0x3b70f18d),
    f32::from_bits(0x3b83e1c6),
    f32::from_bits(0x3b8fe616),
    f32::from_bits(0x3b9c87fd),
    f32::from_bits(0x3ba9c9b7),
    f32::from_bits(0x3bb7ad6f),
    f32::from_bits(0x3bc63549),
    f32::from_bits(0x3bd56361),
    f32::from_bits(0x3be539c1),
    f32::from_bits(0x3bf5ba70),
    f32::from_bits(0x3c0373b5),
    f32::from_bits(0x3c0c6152),
    f32::from_bits(0x3c15a703),
    f32::from_bits(0x3c1f45be),
    f32::from_bits(0x3c293e6b),
    f32::from_bits(0x3c3391f7),
    f32::from_bits(0x3c3e4149),
    f32::from_bits(0x3c494d43),
    f32::from_bits(0x3c54b6c7),
    f32::from_bits(0x3c607eb1),
    f32::from_bits(0x3c6ca5df),
    f32::from_bits(0x3c792d22),
    f32::from_bits(0x3c830aa8),
    f32::from_bits(0x3c89af9f),
    f32::from_bits(0x3c9085db),
    f32::from_bits(0x3c978dc5),
    f32::from_bits(0x3c9ec7c2),
    f32::from_bits(0x3ca63433),
    f32::from_bits(0x3cadd37d),
    f32::from_bits(0x3cb5a601),
    f32::from_bits(0x3cbdac20),
    f32::from_bits(0x3cc5e639),
    f32::from_bits(0x3cce54ab),
    f32::from_bits(0x3cd6f7d5),
    f32::from_bits(0x3cdfd010),
    f32::from_bits(0x3ce8ddb9),
    f32::from_bits(0x3cf2212c),
    f32::from_bits(0x3cfb9ac1),
    f32::from_bits(0x3d02a569),
    f32::from_bits(0x3d0798dc),
    f32::from_bits(0x3d0ca7e6),
    f32::from_bits(0x3d11d2af),
    f32::from_bits(0x3d171963),
    f32::from_bits(0x3d1c7c2e),
    f32::from_bits(0x3d21fb3c),
    f32::from_bits(0x3d2796b2),
    f32::from_bits(0x3d2d4ebb),
    f32::from_bits(0x3d332380),
    f32::from_bits(0x3d39152b),
    f32::from_bits(0x3d3f23e3),
    f32::from_bits(0x3d454fd1),
    f32::from_bits(0x3d4b991c),
    f32::from_bits(0x3d51ffef),
    f32::from_bits(0x3d58846a),
    f32::from_bits(0x3d5f26b7),
    f32::from_bits(0x3d65e6fe),
    f32::from_bits(0x3d6cc564),
    f32::from_bits(0x3d73c20f),
    f32::from_bits(0x3d7add29),
    f32::from_bits(0x3d810b68),
    f32::from_bits(0x3d84b795),
    f32::from_bits(0x3d887330),
    f32::from_bits(0x3d8c3e4a),
    f32::from_bits(0x3d9018f6),
    f32::from_bits(0x3d940345),
    f32::from_bits(0x3d97fd4a),
    f32::from_bits(0x3d9c0716),
    f32::from_bits(0x3da020bb),
    f32::from_bits(0x3da44a4b),
    f32::from_bits(0x3da883d7),
    f32::from_bits(0x3daccd70),
    f32::from_bits(0x3db12728),
    f32::from_bits(0x3db59112),
    f32::from_bits(0x3dba0b3b),
    f32::from_bits(0x3dbe95b5),
    f32::from_bits(0x3dc33092),
    f32::from_bits(0x3dc7dbe2),
    f32::from_bits(0x3dcc97b6),
    f32::from_bits(0x3dd1641f),
    f32::from_bits(0x3dd6412c),
    f32::from_bits(0x3ddb2eef),
    f32::from_bits(0x3de02d77),
    f32::from_bits(0x3de53cd5),
    f32::from_bits(0x3dea5d19),
    f32::from_bits(0x3def8e52),
    f32::from_bits(0x3df4d091),
    f32::from_bits(0x3dfa23e8),
    f32::from_bits(0x3dff8861),
    f32::from_bits(0x3e027f07),
    f32::from_bits(0x3e054280),
    f32::from_bits(0x3e080ea3),
    f32::from_bits(0x3e0ae378),
    f32::from_bits(0x3e0dc105),
    f32::from_bits(0x3e10a754),
    f32::from_bits(0x3e13966b),
    f32::from_bits(0x3e168e52),
    f32::from_bits(0x3e198f10),
    f32::from_bits(0x3e1c98ad),
    f32::from_bits(0x3e1fab30),
    f32::from_bits(0x3e22c6a3),
    f32::from_bits(0x3e25eb09),
    f32::from_bits(0x3e29186c),
    f32::from_bits(0x3e2c4ed0),
    f32::from_bits(0x3e2f8e41),
    f32::from_bits(0x3e32d6c4),
    f32::from_bits(0x3e362861),
    f32::from_bits(0x3e39831e),
    f32::from_bits(0x3e3ce703),
    f32::from_bits(0x3e405416),
    f32::from_bits(0x3e43ca5f),
    f32::from_bits(0x3e4749e4),
    f32::from_bits(0x3e4ad2ae),
    f32::from_bits(0x3e4e64c2),
    f32::from_bits(0x3e520027),
    f32::from_bits(0x3e55a4e6),
    f32::from_bits(0x3e595303),
    f32::from_bits(0x3e5d0a8b),
    f32::from_bits(0x3e60cb7c),
    f32::from_bits(0x3e6495e0),
    f32::from_bits(0x3e6869bf),
    f32::from_bits(0x3e6c4720),
    f32::from_bits(0x3e702e0c),
    f32::from_bits(0x3e741e84),
    f32::from_bits(0x3e781890),
    f32::from_bits(0x3e7c1c38),
    f32::from_bits(0x3e8014c2),
    f32::from_bits(0x3e82203c),
    f32::from_bits(0x3e84308d),
    f32::from_bits(0x3e8645ba),
    f32::from_bits(0x3e885fc5),
    f32::from_bits(0x3e8a7eb2),
    f32::from_bits(0x3e8ca283),
    f32::from_bits(0x3e8ecb3d),
    f32::from_bits(0x3e90f8e1),
    f32::from_bits(0x3e932b74),
    f32::from_bits(0x3e9562f8),
    f32::from_bits(0x3e979f71),
    f32::from_bits(0x3e99e0e2),
    f32::from_bits(0x3e9c274e),
    f32::from_bits(0x3e9e72b7),
    f32::from_bits(0x3ea0c322),
    f32::from_bits(0x3ea31892),
    f32::from_bits(0x3ea57308),
    f32::from_bits(0x3ea7d289),
    f32::from_bits(0x3eaa3718),
    f32::from_bits(0x3eaca0b7),
    f32::from_bits(0x3eaf0f69),
    f32::from_bits(0x3eb18333),
    f32::from_bits(0x3eb3fc18),
    f32::from_bits(0x3eb67a18),
    f32::from_bits(0x3eb8fd37),
    f32::from_bits(0x3ebb8579),
    f32::from_bits(0x3ebe12e1),
    f32::from_bits(0x3ec0a571),
    f32::from_bits(0x3ec33d2d),
    f32::from_bits(0x3ec5da17),
    f32::from_bits(0x3ec87c33),
    f32::from_bits(0x3ecb2383),
    f32::from_bits(0x3ecdd00b),
    f32::from_bits(0x3ed081cd),
    f32::from_bits(0x3ed338cc),
    f32::from_bits(0x3ed5f50b),
    f32::from_bits(0x3ed8b68d),
    f32::from_bits(0x3edb7d54),
    f32::from_bits(0x3ede4965),
    f32::from_bits(0x3ee11ac1),
    f32::from_bits(0x3ee3f16b),
    f32::from_bits(0x3ee6cd67),
    f32::from_bits(0x3ee9aeb7),
    f32::from_bits(0x3eec955d),
    f32::from_bits(0x3eef815d),
    f32::from_bits(0x3ef272ba),
    f32::from_bits(0x3ef56976),
    f32::from_bits(0x3ef86594),
    f32::from_bits(0x3efb6717),
    f32::from_bits(0x3efe6e02),
    f32::from_bits(0x3f00bd2d),
    f32::from_bits(0x3f02460e),
    f32::from_bits(0x3f03d1a7),
    f32::from_bits(0x3f055ff9),
    f32::from_bits(0x3f06f106),
    f32::from_bits(0x3f0884cf),
    f32::from_bits(0x3f0a1b56),
    f32::from_bits(0x3f0bb49b),
    f32::from_bits(0x3f0d50a0),
    f32::from_bits(0x3f0eef67),
    f32::from_bits(0x3f1090f1),
    f32::from_bits(0x3f12353e),
    f32::from_bits(0x3f13dc51),
    f32::from_bits(0x3f15862b),
    f32::from_bits(0x3f1732cd),
    f32::from_bits(0x3f18e239),
    f32::from_bits(0x3f1a946f),
    f32::from_bits(0x3f1c4971),
    f32::from_bits(0x3f1e0141),
    f32::from_bits(0x3f1fbbdf),
    f32::from_bits(0x3f21794e),
    f32::from_bits(0x3f23398e),
    f32::from_bits(0x3f24fca0),
    f32::from_bits(0x3f26c286),
    f32::from_bits(0x3f288b41),
    f32::from_bits(0x3f2a56d3),
    f32::from_bits(0x3f2c253d),
    f32::from_bits(0x3f2df680),
    f32::from_bits(0x3f2fca9e),
    f32::from_bits(0x3f31a197),
    f32::from_bits(0x3f337b6c),
    f32::from_bits(0x3f355820),
    f32::from_bits(0x3f3737b3),
    f32::from_bits(0x3f391a26),
    f32::from_bits(0x3f3aff7c),
    f32::from_bits(0x3f3ce7b5),
    f32::from_bits(0x3f3ed2d2),
    f32::from_bits(0x3f40c0d4),
    f32::from_bits(0x3f42b1be),
    f32::from_bits(0x3f44a590),
    f32::from_bits(0x3f469c4b),
    f32::from_bits(0x3f4895f1),
    f32::from_bits(0x3f4a9282),
    f32::from_bits(0x3f4c9201),
    f32::from_bits(0x3f4e946e),
    f32::from_bits(0x3f5099cb),
    f32::from_bits(0x3f52a218),
    f32::from_bits(0x3f54ad57),
    f32::from_bits(0x3f56bb8a),
    f32::from_bits(0x3f58ccb0),
    f32::from_bits(0x3f5ae0cd),
    f32::from_bits(0x3f5cf7e0),
    f32::from_bits(0x3f5f11ec),
    f32::from_bits(0x3f612eee),
    f32::from_bits(0x3f634eef),
    f32::from_bits(0x3f6571e9),
    f32::from_bits(0x3f6797e3),
    f32::from_bits(0x3f69c0d6),
    f32::from_bits(0x3f6beccd),
    f32::from_bits(0x3f6e1bbf),
    f32::from_bits(0x3f704db8),
    f32::from_bits(0x3f7282af),
    f32::from_bits(0x3f74baae),
    f32::from_bits(0x3f76f5ae),
    f32::from_bits(0x3f7933b9),
    f32::from_bits(0x3f7b74c6),
    f32::from_bits(0x3f7db8e0),
    f32::from_bits(0x3f800000),
];

#[inline]
fn clamp01(v: f32) -> f32 {
    v.clamp(0.0, 1.0)
}

#[inline]
fn to_u8(v: f32) -> u8 {
    (clamp01(v) * 255.0 + 0.5).floor() as u8
}

#[inline]
pub fn srgb_to_linear(c: f32) -> f32 {
    if c <= 0.04045 {
        c / 12.92
    } else {
        libm::powf((c + 0.055) / 1.055, 2.4)
    }
}

#[inline]
pub fn linear_to_srgb(c: f32) -> f32 {
    if c <= 0.0031308 {
        c * 12.92
    } else {
        1.055 * libm::powf(c, 1.0 / 2.4) - 0.055
    }
}

pub fn srgb8_to_linear(rgb: [u8; 3]) -> [f32; 3] {
    rgb.map(|c| SRGB8_TO_LINEAR_TABLE[c as usize])
}

pub fn linear_to_srgb8(rgb: [f32; 3]) -> [u8; 3] {
    rgb.map(|c| {
        let srgb = linear_to_srgb(c);
        to_u8(srgb)
    })
}

#[allow(clippy::excessive_precision)]
pub fn rgb_to_xyz(linear_rgb: [f32; 3]) -> [f32; 3] {
    let r = linear_rgb[0];
    let g = linear_rgb[1];
    let b = linear_rgb[2];
    [
        0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
        0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
        0.0193339 * r + 0.119_192 * g + 0.9503041 * b,
    ]
}

#[allow(clippy::excessive_precision)]
pub fn xyz_to_rgb(xyz: [f32; 3]) -> [f32; 3] {
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    [
        3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
        -0.969_266 * x + 1.8760108 * y + 0.0415560 * z,
        0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
    ]
}

fn normalize_degrees(deg: f32) -> f32 {
    let mut value = deg % 360.0;
    if value < 0.0 {
        value += 360.0;
    }
    value
}

#[allow(clippy::excessive_precision)]
fn linear_rgb_to_oklab(rgb: [f32; 3]) -> [f32; 3] {
    let r = rgb[0];
    let g = rgb[1];
    let b = rgb[2];
    let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    let l_ = libm::cbrtf(l);
    let m_ = libm::cbrtf(m);
    let s_ = libm::cbrtf(s);
    [
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    ]
}

#[allow(clippy::excessive_precision)]
fn oklab_to_linear_rgb(lab: [f32; 3]) -> [f32; 3] {
    let l = lab[0];
    let a = lab[1];
    let b = lab[2];
    let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    let s_ = l - 0.0894841775 * a - 1.2914855480 * b;
    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;
    [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ]
}

fn is_in_gamut_rgb(rgb: [f32; 3]) -> bool {
    rgb.iter().all(|&c| (-EPSILON..=1.0 + EPSILON).contains(&c))
}

/// Convert sRGB bytes to OKLab (L in 0..1, a/b in OKLab units).
pub fn rgb8_to_oklab(rgb: [u8; 3]) -> [f32; 3] {
    let linear = srgb8_to_linear(rgb);
    linear_rgb_to_oklab(linear)
}

/// Convert OKLab (L in 0..1) to sRGB bytes with simple RGB clamping.
pub fn oklab_to_rgb8(lab: [f32; 3]) -> [u8; 3] {
    let linear = oklab_to_linear_rgb(lab).map(clamp01);
    linear_to_srgb8(linear)
}

/// Convert OKLab to OKLCH (h in degrees, C in OKLab units).
pub fn oklab_to_oklch(lab: [f32; 3]) -> [f32; 3] {
    let l = lab[0];
    let a = lab[1];
    let b = lab[2];
    let c = (a * a + b * b).sqrt();
    let h = if c < EPSILON {
        0.0
    } else {
        normalize_degrees(b.atan2(a).to_degrees())
    };
    [l, c, h]
}

/// Convert OKLCH (h in degrees, C in OKLab units) to OKLab.
pub fn oklch_to_oklab(lch: [f32; 3]) -> [f32; 3] {
    let l = lch[0];
    let c = lch[1].max(0.0);
    let h = normalize_degrees(lch[2]).to_radians();
    let a = c * h.cos();
    let b = c * h.sin();
    [l, a, b]
}

/// Convert OKLab to sRGB bytes using chroma compression to keep L/h stable.
pub fn oklab_to_srgb8_gamut_mapped(lab: [f32; 3]) -> [u8; 3] {
    let linear = oklab_to_linear_rgb(lab);
    if is_in_gamut_rgb(linear) {
        return linear_to_srgb8(linear);
    }
    let lch = oklab_to_oklch(lab);
    let l = lch[0];
    let c = lch[1];
    let h = lch[2];
    if c <= 0.0 {
        let neutral = oklab_to_linear_rgb([l, 0.0, 0.0]).map(clamp01);
        return linear_to_srgb8(neutral);
    }
    let mut low = 0.0;
    let mut high = c;
    let mut best = [l, 0.0, 0.0];
    for _ in 0..24 {
        let mid = (low + high) * 0.5;
        let candidate = oklch_to_oklab([l, mid, h]);
        let linear = oklab_to_linear_rgb(candidate);
        if is_in_gamut_rgb(linear) {
            best = candidate;
            low = mid;
        } else {
            high = mid;
        }
    }
    linear_to_srgb8(oklab_to_linear_rgb(best).map(clamp01))
}

#[inline]
fn f_lab(t: f32) -> f32 {
    const DELTA: f32 = 6.0 / 29.0;
    if t > DELTA.powi(3) {
        libm::cbrtf(t)
    } else {
        t / (3.0 * DELTA * DELTA) + 4.0 / 29.0
    }
}

#[inline]
fn f_lab_inv(t: f32) -> f32 {
    const DELTA: f32 = 6.0 / 29.0;
    if t > DELTA {
        t.powi(3)
    } else {
        3.0 * DELTA * DELTA * (t - 4.0 / 29.0)
    }
}

pub fn rgb8_to_lab(rgb: [u8; 3]) -> [f32; 3] {
    let linear = srgb8_to_linear(rgb);
    let xyz = rgb_to_xyz(linear);
    let xr = xyz[0] / XYZ_WHITE[0];
    let yr = xyz[1] / XYZ_WHITE[1];
    let zr = xyz[2] / XYZ_WHITE[2];
    let fx = f_lab(xr);
    let fy = f_lab(yr);
    let fz = f_lab(zr);
    [116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz)]
}

pub fn lab_to_rgb8(lab: [f32; 3]) -> [u8; 3] {
    let l = lab[0];
    let a = lab[1];
    let b = lab[2];
    let fy = (l + 16.0) / 116.0;
    let fx = fy + a / 500.0;
    let fz = fy - b / 200.0;
    let xr = f_lab_inv(fx);
    let yr = f_lab_inv(fy);
    let zr = f_lab_inv(fz);
    let xyz = [xr * XYZ_WHITE[0], yr * XYZ_WHITE[1], zr * XYZ_WHITE[2]];
    let linear = xyz_to_rgb(xyz).map(clamp01);
    linear_to_srgb8(linear)
}

pub fn rgb8_to_luv(rgb: [u8; 3]) -> [f32; 3] {
    let linear = srgb8_to_linear(rgb);
    let xyz = rgb_to_xyz(linear);
    let denom = xyz[0] + 15.0 * xyz[1] + 3.0 * xyz[2];
    let (u_prime, v_prime) = if denom.abs() < EPSILON {
        (0.0, 0.0)
    } else {
        (4.0 * xyz[0] / denom, 9.0 * xyz[1] / denom)
    };

    let denom_ref = XYZ_WHITE[0] + 15.0 * XYZ_WHITE[1] + 3.0 * XYZ_WHITE[2];
    let u_ref = 4.0 * XYZ_WHITE[0] / denom_ref;
    let v_ref = 9.0 * XYZ_WHITE[1] / denom_ref;

    let y_ratio = xyz[1] / XYZ_WHITE[1];
    let l = if y_ratio > (6.0f32 / 29.0).powi(3) {
        116.0 * libm::cbrtf(y_ratio) - 16.0
    } else {
        (29.0f32 / 3.0).powi(3) * y_ratio
    };

    let u = 13.0 * l * (u_prime - u_ref);
    let v = 13.0 * l * (v_prime - v_ref);
    [l, u, v]
}

pub fn luv_to_rgb8(luv: [f32; 3]) -> [u8; 3] {
    let l = luv[0];
    if l.abs() < EPSILON {
        return [0, 0, 0];
    }
    let denom_ref = XYZ_WHITE[0] + 15.0 * XYZ_WHITE[1] + 3.0 * XYZ_WHITE[2];
    let u_ref = 4.0 * XYZ_WHITE[0] / denom_ref;
    let v_ref = 9.0 * XYZ_WHITE[1] / denom_ref;
    let u_prime = luv[1] / (13.0 * l) + u_ref;
    let v_prime = luv[2] / (13.0 * l) + v_ref;

    let y = if l > 8.0 {
        ((l + 16.0) / 116.0).powi(3)
    } else {
        l / (29.0f32 / 3.0).powi(3)
    } * XYZ_WHITE[1];

    let denom = 4.0 * v_prime;
    let (x, z) = if denom.abs() < EPSILON {
        (0.0, 0.0)
    } else {
        let x = 9.0 * y * u_prime / denom;
        let z = y * (12.0 - 3.0 * u_prime - 20.0 * v_prime) / denom;
        (x, z)
    };
    let xyz = [x, y, z];
    let linear = xyz_to_rgb(xyz).map(clamp01);
    linear_to_srgb8(linear)
}

pub fn rgb8_to_yuv(rgb: [u8; 3]) -> [f32; 3] {
    let r = rgb[0] as f32;
    let g = rgb[1] as f32;
    let b = rgb[2] as f32;
    // BT.601 coefficients (matching CC BY 3.0 Color-tool reference)
    let y = r * 0.299 + g * 0.587 + b * 0.114;
    let u = r * -0.168736 + g * -0.331264 + b * 0.5 + 128.0;
    let v = r * 0.5 + g * -0.418688 + b * -0.081312 + 128.0;
    [y, u, v]
}

pub fn yuv_to_rgb8(yuv: [f32; 3]) -> [u8; 3] {
    let y = yuv[0];
    let u = yuv[1];
    let v = yuv[2];
    // BT.601 inverse (matching CC BY 3.0 Color-tool reference)
    let r = y + 1.4075 * (v - 128.0);
    let g = y - 0.3455 * (u - 128.0) - 0.7169 * (v - 128.0);
    let b = y + 1.779 * (u - 128.0);
    [to_u8(r / 255.0), to_u8(g / 255.0), to_u8(b / 255.0)]
}

pub fn rgb8_to_hsl(rgb: [u8; 3]) -> [f32; 3] {
    let r = rgb[0] as f32 / 255.0;
    let g = rgb[1] as f32 / 255.0;
    let b = rgb[2] as f32 / 255.0;
    let max = r.max(g.max(b));
    let min = r.min(g.min(b));
    let delta = max - min;
    let l = (max + min) * 0.5;

    let s = if delta.abs() < EPSILON {
        0.0
    } else {
        delta / (1.0 - (2.0 * l - 1.0).abs())
    };

    let h = if delta.abs() < EPSILON {
        0.0
    } else if max == r {
        60.0 * (((g - b) / delta) % 6.0)
    } else if max == g {
        60.0 * (((b - r) / delta) + 2.0)
    } else {
        60.0 * (((r - g) / delta) + 4.0)
    };
    let h_normalized = if h < 0.0 { h + 360.0 } else { h };
    [h_normalized, s, l]
}

pub fn hsl_to_rgb8(hsl: [f32; 3]) -> [u8; 3] {
    let h = (hsl[0] % 360.0 + 360.0) % 360.0;
    let s = hsl[1].clamp(0.0, 1.0);
    let l = hsl[2].clamp(0.0, 1.0);

    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = l - c / 2.0;

    let (r1, g1, b1) = match h {
        h if h < 60.0 => (c, x, 0.0),
        h if h < 120.0 => (x, c, 0.0),
        h if h < 180.0 => (0.0, c, x),
        h if h < 240.0 => (0.0, x, c),
        h if h < 300.0 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };

    [to_u8(r1 + m), to_u8(g1 + m), to_u8(b1 + m)]
}

pub fn rgb8_to_hsv(rgb: [u8; 3]) -> [f32; 3] {
    let r = rgb[0] as f32 / 255.0;
    let g = rgb[1] as f32 / 255.0;
    let b = rgb[2] as f32 / 255.0;
    let max = r.max(g.max(b));
    let min = r.min(g.min(b));
    let delta = max - min;
    let v = max;
    let s = if max.abs() < EPSILON {
        0.0
    } else {
        delta / max
    };
    let h = if delta.abs() < EPSILON {
        0.0
    } else if max == r {
        60.0 * (((g - b) / delta) % 6.0)
    } else if max == g {
        60.0 * (((b - r) / delta) + 2.0)
    } else {
        60.0 * (((r - g) / delta) + 4.0)
    };
    let h_norm = if h < 0.0 { h + 360.0 } else { h };
    [h_norm, s, v]
}

pub fn hsv_to_rgb8(hsv: [f32; 3]) -> [u8; 3] {
    let h = (hsv[0] % 360.0 + 360.0) % 360.0;
    let s = hsv[1].clamp(0.0, 1.0);
    let v = hsv[2].clamp(0.0, 1.0);

    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;

    let (r1, g1, b1) = match h {
        h if h < 60.0 => (c, x, 0.0),
        h if h < 120.0 => (x, c, 0.0),
        h if h < 180.0 => (0.0, c, x),
        h if h < 240.0 => (0.0, x, c),
        h if h < 300.0 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };

    [to_u8(r1 + m), to_u8(g1 + m), to_u8(b1 + m)]
}

pub fn hue_to_radians(h: f32) -> f32 {
    h.to_radians()
}

/// Calculate WCAG contrast ratio between two colors using their Lab L* values
/// Returns ratio in range [1.0, 21.0] where higher is more contrast
pub fn calculate_contrast_ratio(lab1: [f32; 3], lab2: [f32; 3]) -> f32 {
    // WCAG formula uses relative luminance (not Lab L*)
    // Convert Lab back to linear RGB, then calculate relative luminance
    let rgb1 = lab_to_rgb8(lab1);
    let rgb2 = lab_to_rgb8(lab2);

    let linear1 = srgb8_to_linear(rgb1);
    let linear2 = srgb8_to_linear(rgb2);

    // Calculate relative luminance using sRGB coefficients
    let lum1 = 0.2126 * linear1[0] + 0.7152 * linear1[1] + 0.0722 * linear1[2];
    let lum2 = 0.2126 * linear2[0] + 0.7152 * linear2[1] + 0.0722 * linear2[2];

    // WCAG contrast ratio formula: (lighter + 0.05) / (darker + 0.05)
    let lighter = lum1.max(lum2);
    let darker = lum1.min(lum2);
    (lighter + 0.05) / (darker + 0.05)
}

/// Calculate CIE76 Delta E color difference
/// Returns perceptual distance where 0 = identical, >100 = very different
pub fn delta_e_cie76(lab1: [f32; 3], lab2: [f32; 3]) -> f32 {
    let dl = lab1[0] - lab2[0];
    let da = lab1[1] - lab2[1];
    let db = lab1[2] - lab2[2];
    (dl * dl + da * da + db * db).sqrt()
}

/// Convert RGB to hex string format (#RRGGBB)
pub fn rgb_to_hex(rgb: [u8; 3]) -> String {
    format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_rgb_close(a: [u8; 3], b: [u8; 3], tol: u8) {
        for i in 0..3 {
            let diff = a[i].abs_diff(b[i]);
            assert!(diff <= tol, "channel {i} diff {diff} exceeds {tol}");
        }
    }

    fn assert_lab_close(actual: [f32; 3], expected: [f64; 3], tol: f64) {
        for i in 0..3 {
            let diff = (actual[i] as f64 - expected[i]).abs();
            assert!(diff <= tol, "channel {i} diff {diff} exceeds {tol}");
        }
    }

    fn srgb_to_linear_ref(c: f64) -> f64 {
        if c <= 0.04045 {
            c / 12.92
        } else {
            ((c + 0.055) / 1.055).powf(2.4)
        }
    }

    fn linear_to_srgb_ref(c: f64) -> f64 {
        if c <= 0.0031308 {
            c * 12.92
        } else {
            1.055 * c.powf(1.0 / 2.4) - 0.055
        }
    }

    fn clamp01_ref(v: f64) -> f64 {
        v.clamp(0.0, 1.0)
    }

    fn to_u8_ref(v: f64) -> u8 {
        (clamp01_ref(v) * 255.0 + 0.5).floor() as u8
    }

    fn srgb8_to_linear_ref(rgb: [u8; 3]) -> [f64; 3] {
        rgb.map(|c| srgb_to_linear_ref((c as f64) / 255.0))
    }

    fn linear_to_srgb8_ref(rgb: [f64; 3]) -> [u8; 3] {
        rgb.map(|c| to_u8_ref(linear_to_srgb_ref(c)))
    }

    fn linear_rgb_to_oklab_ref(rgb: [f64; 3]) -> [f64; 3] {
        let r = rgb[0];
        let g = rgb[1];
        let b = rgb[2];
        let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
        let l_ = l.cbrt();
        let m_ = m.cbrt();
        let s_ = s.cbrt();
        [
            0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
        ]
    }

    fn oklab_to_linear_rgb_ref(lab: [f64; 3]) -> [f64; 3] {
        let l = lab[0];
        let a = lab[1];
        let b = lab[2];
        let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        let s_ = l - 0.0894841775 * a - 1.2914855480 * b;
        let l = l_ * l_ * l_;
        let m = m_ * m_ * m_;
        let s = s_ * s_ * s_;
        [
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
        ]
    }

    fn oklab_to_oklch_ref(lab: [f64; 3]) -> [f64; 3] {
        let l = lab[0];
        let a = lab[1];
        let b = lab[2];
        let c = (a * a + b * b).sqrt();
        let h = if c < 1e-12 {
            0.0
        } else {
            let mut deg = b.atan2(a).to_degrees();
            if deg < 0.0 {
                deg += 360.0;
            }
            deg
        };
        [l, c, h]
    }

    fn oklch_to_oklab_ref(lch: [f64; 3]) -> [f64; 3] {
        let l = lch[0];
        let c = lch[1].max(0.0);
        let h = lch[2].to_radians();
        let a = c * h.cos();
        let b = c * h.sin();
        [l, a, b]
    }

    fn is_in_gamut_rgb_ref(rgb: [f64; 3]) -> bool {
        rgb.iter().all(|&c| (-1e-9..=1.0 + 1e-9).contains(&c))
    }

    fn oklab_to_srgb8_gamut_mapped_ref(lab: [f64; 3]) -> [u8; 3] {
        let linear = oklab_to_linear_rgb_ref(lab);
        if is_in_gamut_rgb_ref(linear) {
            return linear_to_srgb8_ref(linear);
        }
        let lch = oklab_to_oklch_ref(lab);
        let l = lch[0];
        let c = lch[1];
        let h = lch[2];
        if c <= 0.0 {
            let neutral = oklab_to_linear_rgb_ref([l, 0.0, 0.0]);
            return linear_to_srgb8_ref(neutral.map(clamp01_ref));
        }
        let mut low = 0.0;
        let mut high = c;
        let mut best = [l, 0.0, 0.0];
        for _ in 0..32 {
            let mid = (low + high) * 0.5;
            let candidate = oklch_to_oklab_ref([l, mid, h]);
            let linear = oklab_to_linear_rgb_ref(candidate);
            if is_in_gamut_rgb_ref(linear) {
                best = candidate;
                low = mid;
            } else {
                high = mid;
            }
        }
        linear_to_srgb8_ref(oklab_to_linear_rgb_ref(best).map(clamp01_ref))
    }

    fn srgb8_to_oklab_ref(rgb: [u8; 3]) -> [f64; 3] {
        linear_rgb_to_oklab_ref(srgb8_to_linear_ref(rgb))
    }

    #[test]
    fn srgb8_decode_reads_committed_table() {
        for value in 0..=u8::MAX {
            let expected = SRGB8_TO_LINEAR_TABLE[value as usize].to_bits();
            let actual = srgb8_to_linear([value; 3]).map(f32::to_bits);
            assert_eq!(actual, [expected; 3], "table lookup mismatch at {value}");
        }
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    #[test]
    fn srgb8_table_matches_pre_libm_native_transfer_bits() {
        for value in 0..=u8::MAX {
            let c = (value as f32) / 255.0;
            let native = if c <= 0.04045 {
                c / 12.92
            } else {
                ((c + 0.055) / 1.055).powf(2.4)
            };
            assert_eq!(
                SRGB8_TO_LINEAR_TABLE[value as usize].to_bits(),
                native.to_bits(),
                "frozen native provenance mismatch at {value}"
            );
        }
    }

    #[test]
    fn lab_round_trip() {
        let samples = [[255, 0, 0], [12, 200, 64], [240, 240, 240]];
        for rgb in samples {
            let lab = rgb8_to_lab(rgb);
            let back = lab_to_rgb8(lab);
            assert_rgb_close(rgb, back, 2);
        }
    }

    #[test]
    fn luv_round_trip() {
        let samples = [[18, 42, 200], [250, 128, 114], [0, 0, 0]];
        for rgb in samples {
            let luv = rgb8_to_luv(rgb);
            let back = luv_to_rgb8(luv);
            assert_rgb_close(rgb, back, 3);
        }
    }

    #[test]
    fn yuv_round_trip() {
        let rgb = [128, 200, 32];
        let yuv = rgb8_to_yuv(rgb);
        let back = yuv_to_rgb8(yuv);
        assert_rgb_close(rgb, back, 2);
    }

    #[test]
    fn hsl_round_trip() {
        let rgb = [12, 180, 90];
        let hsl = rgb8_to_hsl(rgb);
        let back = hsl_to_rgb8(hsl);
        assert_rgb_close(rgb, back, 2);
    }

    #[test]
    fn hsv_round_trip() {
        let rgb = [200, 32, 240];
        let hsv = rgb8_to_hsv(rgb);
        let back = hsv_to_rgb8(hsv);
        assert_rgb_close(rgb, back, 2);
    }

    #[test]
    fn oklab_round_trip() {
        let samples = [[18, 42, 200], [250, 128, 114], [240, 240, 240]];
        for rgb in samples {
            let lab = rgb8_to_oklab(rgb);
            let back = oklab_to_rgb8(lab);
            assert_rgb_close(rgb, back, 2);
        }
    }

    #[test]
    fn oklch_round_trip() {
        let lab = rgb8_to_oklab([120, 200, 32]);
        let lch = oklab_to_oklch(lab);
        let back = oklch_to_oklab(lch);
        assert!((lab[0] - back[0]).abs() < 1e-4);
        assert!((lab[1] - back[1]).abs() < 1e-4);
        assert!((lab[2] - back[2]).abs() < 1e-4);
    }

    #[test]
    fn oklab_gamut_mapping_keeps_hue_stable() {
        let lab = [0.65, 0.4, 0.2];
        let lch = oklab_to_oklch(lab);
        let mapped = oklab_to_srgb8_gamut_mapped(lab);
        let mapped_lch = oklab_to_oklch(rgb8_to_oklab(mapped));
        let hue_delta = (lch[2] - mapped_lch[2]).abs();
        let hue_delta = hue_delta.min(360.0 - hue_delta);
        let linear = srgb8_to_linear(mapped);
        assert!(is_in_gamut_rgb(linear));
        assert!(hue_delta < 5.0, "hue drift too large: {hue_delta}");
    }

    #[test]
    fn oklab_reference_matches_high_precision() {
        let samples = [
            [255, 0, 0],
            [0, 255, 0],
            [0, 0, 255],
            [128, 128, 128],
            [255, 255, 255],
        ];
        for rgb in samples {
            let expected = srgb8_to_oklab_ref(rgb);
            let actual = rgb8_to_oklab(rgb);
            assert_lab_close(actual, expected, 6e-4);

            let back_expected = oklab_to_srgb8_gamut_mapped_ref(expected);
            let back_actual = oklab_to_srgb8_gamut_mapped([
                expected[0] as f32,
                expected[1] as f32,
                expected[2] as f32,
            ]);
            assert_rgb_close(back_actual, back_expected, 1);
        }
    }

    #[test]
    fn known_lab_value_for_red() {
        let lab = rgb8_to_lab([255, 0, 0]);
        assert!((lab[0] - 53.24).abs() < 0.2);
        assert!((lab[1] - 80.09).abs() < 0.5);
        assert!((lab[2] - 67.20).abs() < 0.5);
    }
}
