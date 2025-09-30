//! Color space conversions (ported for wasm). sRGB + D65.
//!
//! Color space algorithms based on:
//! - Color-tool by L. Jégou (CC BY 3.0): https://github.com/ljegou/Color-tool
//! - CIE 15:2018 (Colorimetry, 4th Edition) for LAB/LUV
//! - IEC 61966-2-1:1999 for sRGB gamma and XYZ transforms

const EPSILON: f32 = 1e-6;
const XYZ_WHITE: [f32; 3] = [0.95047, 1.0, 1.08883]; // D65

#[inline]
fn clamp01(v: f32) -> f32 {
    v.max(0.0).min(1.0)
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
        ((c + 0.055) / 1.055).powf(2.4)
    }
}
#[inline]
pub fn linear_to_srgb(c: f32) -> f32 {
    if c <= 0.0031308 {
        c * 12.92
    } else {
        1.055 * c.powf(1.0 / 2.4) - 0.055
    }
}

pub fn srgb8_to_linear(rgb: [u8; 3]) -> [f32; 3] {
    rgb.map(|c| srgb_to_linear((c as f32) / 255.0))
}
pub fn linear_to_srgb8(rgb: [f32; 3]) -> [u8; 3] {
    rgb.map(|c| to_u8(linear_to_srgb(c)))
}

pub fn rgb_to_xyz(linear_rgb: [f32; 3]) -> [f32; 3] {
    let [r, g, b] = linear_rgb;
    [
        0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
        0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
        0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
    ]
}

pub fn xyz_to_rgb(xyz: [f32; 3]) -> [f32; 3] {
    let [x, y, z] = xyz;
    [
        3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
        -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
        0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
    ]
}

#[inline]
fn f_lab(t: f32) -> f32 {
    const D: f32 = 6.0 / 29.0;
    if t > D.powi(3) {
        t.cbrt()
    } else {
        t / (3.0 * D * D) + 4.0 / 29.0
    }
}
#[inline]
fn f_lab_inv(t: f32) -> f32 {
    const D: f32 = 6.0 / 29.0;
    if t > D {
        t.powi(3)
    } else {
        3.0 * D * D * (t - 4.0 / 29.0)
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
    let [l, a, b] = lab;
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
    let (u_p, v_p) = if denom.abs() < EPSILON {
        (0.0, 0.0)
    } else {
        (4.0 * xyz[0] / denom, 9.0 * xyz[1] / denom)
    };
    let denom_ref = XYZ_WHITE[0] + 15.0 * XYZ_WHITE[1] + 3.0 * XYZ_WHITE[2];
    let u_ref = 4.0 * XYZ_WHITE[0] / denom_ref;
    let v_ref = 9.0 * XYZ_WHITE[1] / denom_ref;
    let y_ratio = xyz[1] / XYZ_WHITE[1];
    let l = if y_ratio > (6.0f32 / 29.0).powi(3) {
        116.0 * y_ratio.cbrt() - 16.0
    } else {
        (29.0f32 / 3.0).powi(3) * y_ratio
    };
    let u = 13.0 * l * (u_p - u_ref);
    let v = 13.0 * l * (v_p - v_ref);
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
    let u_p = luv[1] / (13.0 * l) + u_ref;
    let v_p = luv[2] / (13.0 * l) + v_ref;
    let y = if l > 8.0 {
        ((l + 16.0) / 116.0).powi(3)
    } else {
        l / (29.0f32 / 3.0).powi(3)
    } * XYZ_WHITE[1];
    let denom = 4.0 * v_p;
    let (x, z) = if denom.abs() < EPSILON {
        (0.0, 0.0)
    } else {
        (
            9.0 * y * u_p / denom,
            y * (12.0 - 3.0 * u_p - 20.0 * v_p) / denom,
        )
    };
    let linear = xyz_to_rgb([x, y, z]).map(clamp01);
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
    let [y, u, v] = yuv;
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
    [if h < 0.0 { h + 360.0 } else { h }, s, l]
}

pub fn hsl_to_rgb8(hsl: [f32; 3]) -> [u8; 3] {
    let mut h = hsl[0] % 360.0;
    if h < 0.0 {
        h += 360.0;
    }
    let s = hsl[1].clamp(0.0, 1.0);
    let l = hsl[2].clamp(0.0, 1.0);
    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = l - c / 2.0;
    let (r1, g1, b1) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
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
    [if h < 0.0 { h + 360.0 } else { h }, s, v]
}

pub fn hsv_to_rgb8(hsv: [f32; 3]) -> [u8; 3] {
    let mut h = hsv[0] % 360.0;
    if h < 0.0 {
        h += 360.0;
    }
    let s = hsv[1].clamp(0.0, 1.0);
    let v = hsv[2].clamp(0.0, 1.0);
    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;
    let (r1, g1, b1) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };
    [to_u8(r1 + m), to_u8(g1 + m), to_u8(b1 + m)]
}
