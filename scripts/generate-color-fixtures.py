#!/usr/bin/env python3
import json
import random
from pathlib import Path

import colour
from colour.models import RGB_COLOURSPACE_sRGB, RGB_to_XYZ, XYZ_to_Oklab, Oklab_to_Oklch
import colorsys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "tauri-app" / "src-tauri" / "tests" / "fixtures" / "color_golden.json"


def to_oklab(rgb8):
    rgb = [c / 255.0 for c in rgb8]
    xyz = RGB_to_XYZ(rgb, RGB_COLOURSPACE_sRGB, apply_cctf_decoding=True)
    lab = XYZ_to_Oklab(xyz)
    return [float(lab[0]), float(lab[1]), float(lab[2])]


def to_oklch(lab):
    lch = Oklab_to_Oklch(lab)
    return [float(lch[0]), float(lch[1]), float(lch[2])]


def to_hsv(rgb8):
    rgb = [c / 255.0 for c in rgb8]
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    return [float(h * 360.0), float(s), float(v)]


def round_list(values, places=8):
    return [round(v, places) for v in values]


def build_samples():
    samples = []
    base = [
        (0, 0, 0),
        (255, 255, 255),
        (255, 0, 0),
        (0, 255, 0),
        (0, 0, 255),
        (255, 255, 0),
        (0, 255, 255),
        (255, 0, 255),
        (128, 128, 128),
        (1, 1, 1),
        (254, 254, 254),
        (250, 128, 114),
    ]
    for v in range(0, 256, 32):
        base.append((v, v, v))
    for rgb in base:
        samples.append(rgb)

    rng = random.Random(0x5CA1AB1)
    seen = set(samples)
    target = 120
    while len(samples) < target:
        rgb = (rng.randint(0, 255), rng.randint(0, 255), rng.randint(0, 255))
        if rgb in seen:
            continue
        seen.add(rgb)
        samples.append(rgb)
    return samples


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    samples = build_samples()
    payload = {
        "meta": {
            "generator": "colour-science",
            "version": colour.__version__,
            "count": len(samples),
            "notes": "sRGB D65, RGB_to_XYZ apply_cctf_decoding=True"
        },
        "samples": []
    }
    for rgb in samples:
        lab = to_oklab(rgb)
        lch = to_oklch(lab)
        hsv = to_hsv(rgb)
        payload["samples"].append(
            {
                "name": f"rgb_{rgb[0]}_{rgb[1]}_{rgb[2]}",
                "rgb": list(rgb),
                "oklab": round_list(lab),
                "oklch": round_list(lch),
                "hsv": round_list(hsv),
            }
        )
    OUTPUT.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {OUTPUT} with {len(samples)} samples.")


if __name__ == "__main__":
    main()
