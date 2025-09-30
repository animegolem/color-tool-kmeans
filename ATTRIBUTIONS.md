# Attributions

This project uses and builds upon work from the following sources under their respective licenses:

## Color Space Algorithms

The color space conversion implementations in this project are based on algorithms from:

**Color-tool** by Laurent Jégou
License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
Source: https://github.com/ljegou/Color-tool
Author: L. Jégou, Université Toulouse-2 Jean Jaurès, Dépt. de Géographie, UMR LISST

The following color space transformations are derived from this work:
- RGB ↔ HSV conversions
- RGB ↔ YUV conversions (BT.601 coefficients)
- RGB ↔ CIE L\*a\*b\* via XYZ (D65 white point, sRGB primaries)
- RGB ↔ CIE L\*u\*v\* via XYZ (D65 white point, sRGB primaries)

These implementations also reference published international standards:
- sRGB color space: IEC 61966-2-1:1999
- CIE L\*a\*b\* and L\*u\*v\*: CIE 15:2018 (Colorimetry, 4th Edition)
- XYZ transformation matrices: IEC 61966-2-1 (sRGB to XYZ, D65 illuminant)

## K-Means Clustering

The k-means clustering algorithm uses k-means++ initialization as described in:
Arthur, D., & Vassilvitskii, S. (2007). "k-means++: The advantages of careful seeding."
Proceedings of the eighteenth annual ACM-SIAM symposium on Discrete algorithms.

Baseline performance comparison and validation uses:

**kmeans-engine** by Stanley Fok
License: MIT
Source: https://github.com/stanleyfok/kmeans-engine
Note: This library is used only for benchmarking; our production implementation is original.

## UI Assets

This project vendors UI assets locally for offline use:

- Icons and UI elements (CC BY) from Figma Community files:
  - https://www.figma.com/community/file/1380235722331273046
  - https://www.figma.com/community/file/1035203688168086460

- VisionOS reference components were viewed for inspiration only. We do not redistribute Apple-provided assets. Our slider/controls are custom-rendered to be OS‑neutral.

---

Please ensure these attributions are included in the About dialog and distribution README.

