use std::io::Cursor;
use std::path::Path;

use color_core::analyze::{analyze, AnalyzeRequest, ImageSource};
use color_core::RESULT_DIGEST_VERSION;
use image::{ImageFormat, Rgb, RgbImage};
use serde::Deserialize;
use sha2::{Digest, Sha256};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParityFixture {
    input: ParityInput,
    request: serde_json::Value,
    resolved_sampling: ResolvedSampling,
    digest_version: u32,
    expected_digest: String,
    jpeg: EncodedFixture,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParityInput {
    path: String,
    sha256: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResolvedSampling {
    stride: u32,
    max_samples: usize,
    max_dimension: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EncodedFixture {
    encoded_hex: String,
    sha256: String,
    expected_digest: String,
}

fn request(seed: u64) -> AnalyzeRequest {
    serde_json::from_value(serde_json::json!({
        "path": "",
        "k": 8,
        "quality": 2,
        "mergeThreshold": 0.0,
        "seed": seed,
    }))
    .expect("request from json")
}

fn jpeg_bytes() -> Vec<u8> {
    let mut img = RgbImage::new(96, 64);
    for (x, y, pixel) in img.enumerate_pixels_mut() {
        *pixel = Rgb([(x * 2) as u8, (y * 3) as u8, ((x + y) % 255) as u8]);
    }
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Jpeg)
        .expect("encode jpeg");
    buf
}

fn parity_fixture() -> ParityFixture {
    serde_json::from_str(include_str!("fixtures/f1-parity.json")).expect("parse parity fixture")
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn decode_hex(encoded: &str) -> Vec<u8> {
    assert_eq!(encoded.len() % 2, 0, "hex byte string must be even");
    encoded
        .as_bytes()
        .chunks_exact(2)
        .map(|pair| {
            let digits = std::str::from_utf8(pair).expect("hex must be UTF-8");
            u8::from_str_radix(digits, 16).expect("valid hex byte")
        })
        .collect()
}

fn palette_json(bytes: &[u8], seed: u64) -> String {
    let response = analyze(&request(seed), ImageSource::Bytes(bytes)).expect("analyze bytes");
    serde_json::to_string(&response.clusters).expect("serialize clusters")
}

#[test]
fn jpeg_bytes_analysis_is_deterministic() {
    let bytes = jpeg_bytes();
    let first = palette_json(&bytes, 1);
    let second = palette_json(&bytes, 1);
    assert_eq!(first, second, "same seed must produce identical palettes");
}

#[test]
fn fixed_png_digest_matches_parity_record() {
    let fixture = parity_fixture();
    assert_eq!(fixture.digest_version, RESULT_DIGEST_VERSION);
    assert_eq!(fixture.resolved_sampling.stride, 4);
    assert_eq!(fixture.resolved_sampling.max_samples, 180_000);
    assert_eq!(fixture.resolved_sampling.max_dimension, 2200);

    let pattern = Path::new(env!("CARGO_MANIFEST_DIR")).join(&fixture.input.path);
    let bytes = std::fs::read(&pattern).expect("read parity image");
    assert_eq!(sha256_hex(&bytes), fixture.input.sha256);
    let request: AnalyzeRequest =
        serde_json::from_value(fixture.request).expect("parse parity request");

    let via_bytes = analyze(&request, ImageSource::Bytes(&bytes)).expect("analyze parity bytes");
    let via_path = analyze(&request, ImageSource::Path(&pattern)).expect("analyze parity path");
    assert_eq!(via_bytes.result_digest, fixture.expected_digest);
    assert_eq!(via_path.result_digest, fixture.expected_digest);
}

#[test]
fn fixed_jpeg_digest_matches_parity_record() {
    let fixture = parity_fixture();
    let bytes = decode_hex(&fixture.jpeg.encoded_hex);
    assert_eq!(sha256_hex(&bytes), fixture.jpeg.sha256);
    let request: AnalyzeRequest =
        serde_json::from_value(fixture.request).expect("parse parity request");
    let response = analyze(&request, ImageSource::Bytes(&bytes)).expect("analyze parity JPEG");
    assert_eq!(response.result_digest, fixture.jpeg.expected_digest);
}

#[test]
fn bytes_and_path_sources_produce_identical_palettes() {
    let pattern = Path::new(env!("CARGO_MANIFEST_DIR")).join("../test-patterns/hsl_ligthness.png");
    assert!(pattern.exists(), "missing test pattern: {pattern:?}");
    let bytes = std::fs::read(&pattern).expect("read pattern bytes");

    let via_path = analyze(&request(1), ImageSource::Path(&pattern)).expect("analyze path source");
    let via_bytes = palette_json(&bytes, 1);
    assert_eq!(
        serde_json::to_string(&via_path.clusters).expect("serialize clusters"),
        via_bytes,
        "path and bytes sources must agree on the same image"
    );
    assert_eq!(
        via_path.result_digest,
        analyze(&request(1), ImageSource::Bytes(&bytes))
            .expect("analyze bytes source")
            .result_digest
    );
}
