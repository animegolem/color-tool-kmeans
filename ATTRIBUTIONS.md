# Attributions

While no code is shared this project is deeply inspired by **Color-tool** by Laurent Jégou. It wouldn't exist without you! 

--- 

This project uses and builds upon work from the following sources under their respective licenses:

## Media Decode

This project bundles FFmpeg for video frame extraction (LGPL build only, no GPL components enabled).

**FFmpeg** by the FFmpeg Project
License: LGPL 2.1+ (https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)
Source: https://ffmpeg.org

## K-Means Clustering

The k-means clustering algorithm uses k-means++ initialization as described in:
Arthur, D., & Vassilvitskii, S. (2007). "k-means++: The advantages of careful seeding."
Proceedings of the eighteenth annual ACM-SIAM symposium on Discrete algorithms.

Baseline performance comparison and validation uses:

**kmeans-engine** by Stanley Fok
License: MIT
Source: https://github.com/stanleyfok/kmeans-engine
Note: This library is used only for benchmarking; our production implementation is original.

## Algorithms

- e-means (spike/regrade/kmeans.js), ported from faiss `contrib/e_means`
  Copyright (c) Meta Platforms, Inc. and affiliates. License: MIT
  Source: https://github.com/facebookresearch/faiss/tree/main/contrib/e_means
  Paper: Bessa et al., "e-means: outperforming k-means (in one-tenth the epochs)", 2026, arXiv 2611.09501

## UI Assets

This project vendors UI assets locally for offline use:

- Icons and UI elements (CC BY) from Figma Community files:
  - https://www.figma.com/community/file/1380235722331273046
  - https://www.figma.com/community/file/1035203688168086460
- Sidebar layout toggle icons derived from VS Code Codicons
  License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
  Source: https://github.com/microsoft/vscode-codicons

---

Please ensure these attributions are included in the About dialog and distribution README.

