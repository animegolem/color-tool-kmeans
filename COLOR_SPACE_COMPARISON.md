# Color Space Implementation Comparison

This document compares our Rust implementations against the CC BY 3.0 reference (colorist2.js).

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| sRGB gamma | ✅ MATCH | Thresholds and formulas match exactly |
| XYZ matrices | ✅ MATCH | RGB→XYZ and XYZ→RGB coefficients match |
| LAB (f function) | ✅ MATCH | Uses standard delta=6/29 threshold |
| LUV | ✅ MATCH | Matches CC BY 3.0 implementation |
| YUV | ❌ DIFFERENT | **Needs alignment** - different coefficients |
| HSV | ⚠️ SIMILAR | Algorithm matches, minor scaling differences |

## Detailed Analysis

### 1. sRGB Gamma (✅ MATCH)

**CC BY 3.0 (colorist2.js:384-386):**
```javascript
if (r > 0.04045) {r = pow((r + 0.055) / 1.055, 2.4)} else {r = r / 12.92};
```

**Our Rust (color.rs:18-23):**
```rust
if c <= 0.04045 { c / 12.92 } else { ((c + 0.055) / 1.055).powf(2.4) }
```

✅ **Perfect match** - same thresholds (0.04045, 0.0031308) and formulas.

### 2. XYZ Transform Matrices (✅ MATCH)

**CC BY 3.0 RGB→XYZ (colorist2.js:392-394):**
```javascript
x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
```

**Our Rust (color.rs:46-54):**
```rust
0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
```

✅ **Perfect match** - identical coefficients.

**CC BY 3.0 XYZ→RGB (colorist2.js:354-356):**
```javascript
r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
```

**Our Rust (color.rs:57-65):**
```rust
3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
-0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
```

✅ **Perfect match**.

### 3. CIE LAB (✅ MATCH)

**CC BY 3.0 f function (colorist2.js:16-22):**
```javascript
f = function(t) {
  if (t > d * d * d) { return pow(t, 1 / 3); }
  else { return t / 3 / d / d + 4 / 29; }
};
```
Where `d = 6 / 29`.

**Our Rust (color.rs:69-76):**
```rust
fn f_lab(t: f32) -> f32 {
    const DELTA: f32 = 6.0 / 29.0;
    if t > DELTA.powi(3) { t.cbrt() }
    else { t / (3.0 * DELTA * DELTA) + 4.0 / 29.0 }
}
```

✅ **Perfect match** - same threshold (delta³ ≈ 0.008856) and formulas.

### 4. CIE LUV (✅ MATCH)

**CC BY 3.0 (colorist2.js:451-472):**
```javascript
Yd = Y / Yw;
if (Yd >= 0.00885645167903563082) {
    Yd = pow(Yd, 1.0 / 3.0);
} else {
    Yd = (7.787 * Yd) + (16.0 / 116.0);
}
```

**Our Rust (color.rs:130-134):**
```rust
let y_ratio = xyz[1] / XYZ_WHITE[1];
let l = if y_ratio > (6.0f32 / 29.0).powi(3) {
    116.0 * y_ratio.cbrt() - 16.0
} else {
    (29.0f32 / 3.0).powi(3) * y_ratio
};
```

✅ **Match** - equivalent thresholds and formulas (note: (6/29)³ ≈ 0.008856).

### 5. YUV (❌ DIFFERENT - NEEDS FIX)

**CC BY 3.0 (colorist2.js:292-294):**
```javascript
y = Math.round(s.r *  .299000 + s.g *  .587000 + s.b *  .114000);
u = Math.round(s.r * -.168736 + s.g * -.331264 + s.b *  .500000 + 128);
v = Math.round(s.r *  .500000 + s.g * -.418688 + s.b * -.081312 + 128);
```

**Our Rust (color.rs:175-179):**
```rust
[
    0.299 * r + 0.587 * g + 0.114 * b,
    -0.14713 * r - 0.28886 * g + 0.436 * b,     // DIFFERENT
    0.615 * r - 0.51499 * g - 0.10001 * b,      // DIFFERENT
]
```

❌ **MISMATCH**:
- Y component: ✅ matches
- U component: ❌ ours = [-0.14713, -0.28886, 0.436], CC BY = [-0.168736, -0.331264, 0.5]
- V component: ❌ ours = [0.615, -0.51499, -0.10001], CC BY = [0.5, -0.418688, -0.081312]

**Action needed:** Replace with CC BY 3.0 coefficients (BT.601 standard).

### 6. HSV (⚠️ SIMILAR)

**CC BY 3.0 (colorist2.js:157-186):**
```javascript
red /= 255.0; green /= 255.0; blue /= 255.0;
// ... standard HSV algorithm ...
return [Math.round(hue*255), Math.round(sat*255), Math.round(val*255)];
```

**Our Rust (color.rs:241-265):**
```rust
let r = rgb[0] as f32 / 255.0;
// ... standard HSV algorithm ...
[h_norm, s, v]  // Returns [0-360, 0-1, 0-1]
```

⚠️ **Minor difference**: CC BY scales to [0-255], we use [0-360, 0-1, 0-1]. Both are correct; ours matches modern conventions.

## Recommended Actions

1. **Fix YUV coefficients** to match CC BY 3.0 (BT.601):
   - Update `rgb8_to_yuv` in `tauri-app/src-tauri/src/color.rs`
   - Update `yuv_to_rgb8` reverse transform
   - Update `compute-wasm/src/color.rs` if it has YUV

2. **Document HSV scaling difference** - our convention is standard, no change needed.

3. **Add tests** comparing outputs against CC BY 3.0 reference values.

## White Point Reference

Both implementations use D65 white point:
```
X_w = 95.047
Y_w = 100.0
Z_w = 108.883
```

✅ Perfect match.