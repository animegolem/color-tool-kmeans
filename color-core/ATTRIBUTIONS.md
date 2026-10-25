# Attributions

Thanks to **Color-tool** by Laurent Jégou (https://github.com/ljegou/Color-tool),
whose colour-proportion maps inspired this project. Its code is browser
JavaScript; this crate is a separate implementation in Rust and OKLab. The one
overlap is `yuv_to_rgb8`, whose inverse coefficients are rounded to four
decimals the same way Color-tool's `yuv2rgb` rounds them.

## Color conversions

`src/color.rs` implements the published standards:

- IEC 61966-2-1:1999 for the sRGB transfer function and the sRGB/XYZ matrices
- CIE 15:2018 (Colorimetry, 4th Edition) for CIELAB and CIELUV
- ITU-R BT.601 with JFIF full-range scaling for YCbCr ("YUV")
- OKLab and OKLch as published by Björn Ottosson,
  https://bottosson.github.io/posts/oklab/

## K-means clustering

Initialization is k-means++, as described in:
Arthur, D., & Vassilvitskii, S. (2007). "k-means++: The advantages of careful
seeding." Proceedings of the eighteenth annual ACM-SIAM symposium on Discrete
algorithms.
