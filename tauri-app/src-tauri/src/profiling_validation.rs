use crate::profiling_wire::*;
use serde_json::{Map, Value};

const EVENT_TYPES: &[&str] = &[
    "delivered_input",
    "input_resolved",
    "schedule_observed",
    "request_admitted",
    "renderer_native_issue",
    "renderer_native_settle",
    "renderer_response_parsed",
    "store_accepted",
    "store_rejected",
    "figure_generated",
    "enabled_figures_generated",
    "dom_settled",
    "raf1",
    "associated_result_dom_raf2_approx",
    "action_outcome",
];
const ANALYSIS_KEYS: &[&str] = &[
    "clusters",
    "quality",
    "sampleCap",
    "maxDimension",
    "ignoreTopN",
    "mergeThreshold",
    "snapToReal",
    "seed",
    "maxIterations",
    "tolerance",
    "warmStart",
];
const RENDER_KEYS: &[&str] = &[
    "symbolScale",
    "showClusterOutline",
    "showAxisLabels",
    "polarMode",
    "hueLightnessSizeMode",
    "histogramSort",
    "showHistogram",
    "showPolarChart",
    "showHueLightness",
    "showSimplifiedTones",
    "frameLabel",
    "stripMode",
    "compactSidebars",
];
const CHECK_KEYS: &[&str] = &[
    "acceptedResultObjectMatches",
    "activeImageMatchesAdmitted",
    "actualPathMatchesExpected",
    "analysisConfigMatches",
    "domFiguresMatch",
    "enabledFiguresMatch",
    "inputTargetResolved",
    "nativeRequestMatchesAdmitted",
    "renderConfigMatches",
    "storeReceiptAccepted",
    "visibleAtDomSettle",
    "visibleAtRaf1",
    "visibleAtRaf2",
];
const MEASUREMENT_KEYS: &[&str] = &[
    "input_to_request_admitted_ms",
    "renderer_native_roundtrip_ms",
    "input_to_store_accepted_ms",
    "input_to_enabled_figures_generated_ms",
    "input_to_dom_settled_ms",
    "input_to_associated_result_dom_raf2_approx_ms",
    "run_kmeans_ms",
];

pub(crate) fn validate_batch(batch: &ProfileRendererBatch) -> Result<(), &'static str> {
    validate_batch_identifiers(batch)?;
    if batch.batch_sequence == 0
        || batch.events.is_empty()
        || batch.events.len() > MAX_RENDERER_BATCH_EVENTS
    {
        return Err("renderer-batch-count");
    }
    for event in &batch.events {
        if !finite_nonnegative(event.renderer_ms)
            || !EVENT_TYPES.contains(&event.event_type.as_str())
            || !valid_event_data(event)
            || serde_json::to_vec(event)
                .map_or(true, |bytes| bytes.len() > MAX_RENDERER_EVENT_BYTES)
        {
            return Err("renderer-event-invalid");
        }
    }
    if batch
        .events
        .windows(2)
        .any(|pair| pair[0].renderer_ms > pair[1].renderer_ms)
    {
        return Err("renderer-event-order");
    }
    let outcomes: Vec<_> = batch
        .events
        .iter()
        .filter(|event| event.event_type == "action_outcome")
        .collect();
    if batch.events[0].event_type != "delivered_input"
        || outcomes.len() != 1
        || batch.events.last().map(|event| event.event_type.as_str()) != Some("action_outcome")
        || !outcome_event_matches(outcomes[0], &batch.observed_outcome)
        || !input_event_matches(&batch.events[0], &batch.input)
    {
        return Err("renderer-outcome-event-invalid");
    }
    validate_outcome(&batch.observed_outcome)?;
    let admitted = batch
        .events
        .iter()
        .any(|event| event.event_type == "request_admitted");
    let expected_fresh_execution =
        if matches!(batch.observed_outcome.status.as_str(), "deduped" | "cache") || !admitted {
            Some(false)
        } else {
            None
        };
    if batch.observed_outcome.fresh_execution != expected_fresh_execution {
        return Err("renderer-outcome-invalid");
    }
    if !valid_analysis_config_evidence(batch)
        || !valid_render_config(&batch.render_config)
        || !valid_input(&batch.input)
    {
        return Err("renderer-binding-invalid");
    }
    if serde_json::to_vec(batch).map_or(true, |bytes| bytes.len() > MAX_RENDERER_BATCH_BYTES) {
        return Err("renderer-batch-bytes");
    }
    Ok(())
}

pub(crate) fn validate_batch_identifiers(batch: &ProfileRendererBatch) -> Result<(), &'static str> {
    if !valid_token(&batch.action_id, 128)
        || !valid_token(&batch.renderer_process_clock_id, 128)
        || !valid_token(&batch.image_runtime_id, 128)
        || batch.events.iter().any(|event| {
            event.action_id != batch.action_id
                || event.clock_id != batch.renderer_process_clock_id
                || !valid_token(&event.action_id, 128)
                || !valid_token(&event.clock_id, 128)
        })
    {
        return Err("profiling-invalid-batch-id");
    }
    Ok(())
}

pub(crate) fn valid_session_id(value: &str) -> bool {
    let mut chars = value.chars();
    matches!(chars.next(), Some(first) if first.is_ascii_alphanumeric())
        && value.len() <= 64
        && chars.all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_'))
}

pub(crate) fn valid_token(value: &str, max_len: usize) -> bool {
    !value.is_empty()
        && value.len() <= max_len
        && value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.' | ':'))
}

fn validate_outcome(outcome: &ProfileObservedOutcome) -> Result<(), &'static str> {
    if !finite_nonnegative(outcome.renderer_ms)
        || outcome.measurements.iter().any(|(key, value)| {
            !MEASUREMENT_KEYS.contains(&key.as_str()) || !finite_nonnegative(*value)
        })
        || outcome
            .association_checks
            .keys()
            .any(|key| !CHECK_KEYS.contains(&key.as_str()))
    {
        return Err("renderer-outcome-invalid");
    }
    match outcome.status.as_str() {
        "completed" => {
            if outcome.reason_code.is_some()
                || outcome.endpoint.as_deref() != Some("associated_result_dom_raf2_approx")
            {
                return Err("renderer-outcome-invalid");
            }
        }
        status => {
            let Some(reason) = outcome.reason_code.as_deref() else {
                return Err("renderer-outcome-invalid");
            };
            if outcome.endpoint.is_some() || !valid_status_reason(status, reason) {
                return Err("renderer-outcome-invalid");
            }
        }
    }
    Ok(())
}

fn valid_status_reason(status: &str, reason: &str) -> bool {
    match status {
        "deduped" => reason == "request-key-unchanged",
        "cache" => reason == "cache-parameters-unbound",
        "cancelled" => matches!(
            reason,
            "input-superseded" | "debounce-replaced" | "source-replaced" | "view-unmounted"
        ),
        "stale" => matches!(reason, "runner-token-mismatch" | "store-token-rejected"),
        "failed" => matches!(
            reason,
            "native-invoke" | "invalid-response" | "accepted-error"
        ),
        "unverified" => matches!(
            reason,
            "result-association-unverified"
                | "hidden-before-dom-raf2"
                | "dom-figure-mismatch"
                | "trace-dropped"
                | "trace-flush-failed"
                | "no-enabled-figures"
                | "input-target-invalid"
                | "input-value-unresolved"
                | "session-lost"
        ),
        _ => false,
    }
}

fn valid_event_data(event: &ProfileRendererEvent) -> bool {
    let (required, optional): (&[&str], &[&str]) = match event.event_type.as_str() {
        "delivered_input" => (
            &["control", "targetState"],
            &["targetNumber", "targetBoolean"],
        ),
        "input_resolved" => (&["sourceMatches", "targetMatches"], &[]),
        "schedule_observed" => (&["disposition"], &[]),
        "renderer_native_issue" => (&["pathMatches", "requestMatches"], &[]),
        "renderer_native_settle" => (&["ok"], &[]),
        "store_accepted" | "store_rejected" => (&[], &["error"]),
        "figure_generated" => (&["figure", "durationMs"], &[]),
        "enabled_figures_generated" => (&["count"], &[]),
        "action_outcome" => (&["status", "reasonCode", "endpoint"], &[]),
        _ => (&[], &[]),
    };
    let empty = Map::new();
    let data = event.data.as_ref().unwrap_or(&empty);
    if data.len()
        != required.len()
            + data
                .keys()
                .filter(|key| optional.contains(&key.as_str()))
                .count()
        || !required.iter().all(|key| data.contains_key(*key))
        || !data.values().all(valid_primitive)
    {
        return false;
    }
    match event.event_type.as_str() {
        "delivered_input" => {
            matches!(
                string(data, "control"),
                Some("clusters" | "quality" | "ignoreTopN" | "mergeThreshold" | "snapToReal")
            ) && matches!(
                string(data, "targetState"),
                Some("number" | "boolean" | "invalid-or-empty")
            ) && data
                .get("targetNumber")
                .is_none_or(|value| value.as_f64().is_some_and(f64::is_finite))
                && data.get("targetBoolean").is_none_or(Value::is_boolean)
        }
        "input_resolved" => bools(data, &["sourceMatches", "targetMatches"]),
        "schedule_observed" => matches!(
            string(data, "disposition"),
            Some("repeated" | "deduped" | "bound")
        ),
        "renderer_native_issue" => bools(data, &["pathMatches", "requestMatches"]),
        "renderer_native_settle" => bools(data, &["ok"]),
        "store_accepted" | "store_rejected" => data.get("error").is_none_or(Value::is_boolean),
        "figure_generated" => {
            matches!(
                string(data, "figure"),
                Some("histogram" | "polar" | "hue-lightness")
            ) && data
                .get("durationMs")
                .and_then(Value::as_f64)
                .is_some_and(finite_nonnegative)
        }
        "enabled_figures_generated" => data.get("count").is_some_and(Value::is_u64),
        "action_outcome" => true,
        _ => data.is_empty(),
    }
}

pub(crate) fn unavailable_analysis_config(batch: &ProfileRendererBatch) -> bool {
    matches!(
        &batch.analysis_config,
        ProfileAnalysisConfigEvidence::Unavailable { reason_code }
            if reason_code == "input-target-invalid"
    )
}

fn valid_analysis_config_evidence(batch: &ProfileRendererBatch) -> bool {
    match &batch.analysis_config {
        ProfileAnalysisConfigEvidence::Resolved { value } => valid_analysis_config(value),
        ProfileAnalysisConfigEvidence::Unavailable { reason_code } => {
            reason_code == "input-target-invalid" && valid_unavailable_analysis_config(batch)
        }
    }
}

fn valid_unavailable_analysis_config(batch: &ProfileRendererBatch) -> bool {
    let events = &batch.events;
    let input = &batch.input;
    let outcome = &batch.observed_outcome;
    let Some(resolved) = events.get(1).and_then(|event| event.data.as_ref()) else {
        return false;
    };
    events.len() == 3
        && events[0].event_type == "delivered_input"
        && events[1].event_type == "input_resolved"
        && events[2].event_type == "action_outcome"
        && matches!(
            input.control.as_str(),
            "clusters" | "quality" | "ignoreTopN" | "mergeThreshold"
        )
        && input.target_state == "invalid-or-empty"
        && input.target_number.is_none()
        && input.target_boolean.is_none()
        && batch.renderer_dropped_event_count == 0
        && outcome.status == "unverified"
        && outcome.reason_code.as_deref() == Some("input-target-invalid")
        && outcome.endpoint.is_none()
        && outcome.fresh_execution == Some(false)
        && outcome.association_checks.len() == 1
        && outcome.association_checks.get("inputTargetResolved") == Some(&false)
        && outcome.measurements.is_empty()
        && resolved.len() == 2
        && resolved.get("sourceMatches").and_then(Value::as_bool) == Some(true)
        && resolved.get("targetMatches").and_then(Value::as_bool) == Some(false)
}

fn valid_analysis_config(map: &Map<String, Value>) -> bool {
    const QUALITY_LIMITS: &[(u64, u64)] = &[
        (50_000, 1200),
        (100_000, 1600),
        (180_000, 2200),
        (260_000, 2600),
        (350_000, 3200),
    ];
    let quality = map.get("quality").and_then(Value::as_u64);
    let quality_limits = quality
        .and_then(|value| usize::try_from(value).ok())
        .and_then(|index| QUALITY_LIMITS.get(index));
    exact_keys(map, ANALYSIS_KEYS)
        && positive_integer(map, "clusters")
        && integer_between(map, "quality", 0, 4)
        && quality_limits.is_some_and(|(sample_cap, max_dimension)| {
            map.get("sampleCap").and_then(Value::as_u64) == Some(*sample_cap)
                && map.get("maxDimension").and_then(Value::as_u64) == Some(*max_dimension)
        })
        && nonnegative_integer(map, "ignoreTopN")
        && nonnegative_number(map, "mergeThreshold")
        && map.get("snapToReal").is_some_and(Value::is_boolean)
        && nonnegative_integer(map, "seed")
        && positive_integer(map, "maxIterations")
        && nonnegative_number(map, "tolerance")
        && string(map, "warmStart") == Some("none")
}

fn valid_render_config(map: &Map<String, Value>) -> bool {
    exact_keys(map, RENDER_KEYS)
        && map
            .get("symbolScale")
            .and_then(Value::as_f64)
            .is_some_and(|value| finite_nonnegative(value) && value > 0.0)
        && bools(
            map,
            &[
                "showClusterOutline",
                "showAxisLabels",
                "showHistogram",
                "showPolarChart",
                "showHueLightness",
                "showSimplifiedTones",
                "compactSidebars",
            ],
        )
        && matches!(string(map, "polarMode"), Some("oklch" | "okhsv" | "hsv"))
        && matches!(
            string(map, "hueLightnessSizeMode"),
            Some("frequency" | "chroma")
        )
        && matches!(
            string(map, "histogramSort"),
            Some("frequency" | "hue" | "lightness")
        )
        && matches!(string(map, "frameLabel"), Some("timestamp" | "frame"))
        && matches!(string(map, "stripMode"), Some("filmstrip" | "barcode"))
}

fn valid_input(input: &ProfileInputObservation) -> bool {
    if !matches!(
        input.control.as_str(),
        "clusters" | "quality" | "ignoreTopN" | "mergeThreshold" | "snapToReal"
    ) {
        return false;
    }
    match input.target_state.as_str() {
        "number" => {
            input.target_number.is_some_and(f64::is_finite)
                && input.target_boolean.is_none()
                && input.control != "snapToReal"
        }
        "boolean" => {
            input.target_number.is_none()
                && input.target_boolean.is_some()
                && input.control == "snapToReal"
        }
        "invalid-or-empty" => input.target_number.is_none() && input.target_boolean.is_none(),
        _ => false,
    }
}

fn outcome_event_matches(event: &ProfileRendererEvent, outcome: &ProfileObservedOutcome) -> bool {
    let Some(data) = event.data.as_ref() else {
        return false;
    };
    string(data, "status") == Some(outcome.status.as_str())
        && optional_string_matches(data.get("reasonCode"), outcome.reason_code.as_deref())
        && optional_string_matches(data.get("endpoint"), outcome.endpoint.as_deref())
}

fn input_event_matches(event: &ProfileRendererEvent, input: &ProfileInputObservation) -> bool {
    let Some(data) = event.data.as_ref() else {
        return false;
    };
    string(data, "control") == Some(input.control.as_str())
        && string(data, "targetState") == Some(input.target_state.as_str())
        && match (input.target_number, data.get("targetNumber")) {
            (None, None) => true,
            (Some(expected), Some(actual)) => actual.as_f64() == Some(expected),
            _ => false,
        }
        && match (input.target_boolean, data.get("targetBoolean")) {
            (None, None) => true,
            (Some(expected), Some(actual)) => actual.as_bool() == Some(expected),
            _ => false,
        }
}

fn exact_keys(map: &Map<String, Value>, keys: &[&str]) -> bool {
    map.len() == keys.len() && keys.iter().all(|key| map.contains_key(*key))
}
fn valid_primitive(value: &Value) -> bool {
    match value {
        Value::Null | Value::Bool(_) => true,
        Value::Number(number) => number.as_f64().is_some_and(f64::is_finite),
        Value::String(value) => valid_token(value, 128),
        _ => false,
    }
}
fn optional_string_matches(value: Option<&Value>, expected: Option<&str>) -> bool {
    match (expected, value) {
        (None, Some(Value::Null)) => true,
        (Some(expected), Some(Value::String(actual))) => expected == actual,
        _ => false,
    }
}
fn string<'a>(map: &'a Map<String, Value>, key: &str) -> Option<&'a str> {
    map.get(key).and_then(Value::as_str)
}
fn bools(map: &Map<String, Value>, keys: &[&str]) -> bool {
    keys.iter()
        .all(|key| map.get(*key).is_some_and(Value::is_boolean))
}
fn finite_nonnegative(value: f64) -> bool {
    value.is_finite() && value >= 0.0
}
fn nonnegative_number(map: &Map<String, Value>, key: &str) -> bool {
    map.get(key)
        .and_then(Value::as_f64)
        .is_some_and(finite_nonnegative)
}
fn nonnegative_integer(map: &Map<String, Value>, key: &str) -> bool {
    map.get(key).is_some_and(Value::is_u64)
}
fn positive_integer(map: &Map<String, Value>, key: &str) -> bool {
    map.get(key)
        .and_then(Value::as_u64)
        .is_some_and(|value| value > 0)
}
fn integer_between(map: &Map<String, Value>, key: &str, min: u64, max: u64) -> bool {
    map.get(key)
        .and_then(Value::as_u64)
        .is_some_and(|value| (min..=max).contains(&value))
}
