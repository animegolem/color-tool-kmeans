use color_core::analyze::{analyze, AnalyzeRequest, ImageSource};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn analyze_image(encoded_bytes: &[u8], resolved_params: JsValue) -> Result<JsValue, JsValue> {
    let mut request: AnalyzeRequest = serde_wasm_bindgen::from_value(resolved_params)
        .map_err(|error| JsValue::from_str(&format!("invalid analysis request: {error}")))?;
    request.path.clear();

    let response = analyze(&request, ImageSource::Bytes(encoded_bytes))
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
    serde_wasm_bindgen::to_value(&response).map_err(|error| {
        JsValue::from_str(&format!("failed to serialize analysis response: {error}"))
    })
}
