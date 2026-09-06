use crate::profiling::{ProfileState, PROFILE_SESSION_ENV};
use crate::profiling_validation::validate_batch;
use crate::profiling_wire::*;
use crate::profiling_writer::ProfileWriter;
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::ffi::OsString;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tempfile::tempdir;

const SESSION_ID: &str = "native-interop";
const CLOCK_ID: &str = "renderer-native-interop";
const NUMERIC_ACTION: &str = "renderer-native-interop:action-numeric";
const BOOLEAN_ACTION: &str = "renderer-native-interop:action-boolean";
const INVALID_ACTION: &str = "renderer-native-interop:action-invalid";

fn state(root: &Path, session_id: &str) -> ProfileState {
    ProfileState::from_launch(root, Some(OsString::from(session_id)))
}

fn artifact(root: &Path, session_id: &str) -> PathBuf {
    root.join(PROFILE_DIRECTORY)
        .join(format!("profile-{session_id}.jsonl"))
}

fn analysis_config(clusters: u64, snap: bool) -> ProfileAnalysisConfigEvidence {
    ProfileAnalysisConfigEvidence::Resolved {
        value: Map::from_iter([
            ("clusters".into(), json!(clusters)),
            ("quality".into(), json!(2)),
            ("sampleCap".into(), json!(180_000)),
            ("maxDimension".into(), json!(2200)),
            ("ignoreTopN".into(), json!(0)),
            ("mergeThreshold".into(), json!(0.125)),
            ("snapToReal".into(), json!(snap)),
            ("seed".into(), json!(1)),
            ("maxIterations".into(), json!(40)),
            ("tolerance".into(), json!(0.001)),
            ("warmStart".into(), json!("none")),
        ]),
    }
}

fn render_config() -> Map<String, Value> {
    Map::from_iter([
        ("symbolScale".into(), json!(1.25)),
        ("showClusterOutline".into(), json!(false)),
        ("showAxisLabels".into(), json!(true)),
        ("polarMode".into(), json!("okhsv")),
        ("hueLightnessSizeMode".into(), json!("chroma")),
        ("histogramSort".into(), json!("frequency")),
        ("showHistogram".into(), json!(true)),
        ("showPolarChart".into(), json!(true)),
        ("showHueLightness".into(), json!(true)),
        ("showSimplifiedTones".into(), json!(false)),
        ("frameLabel".into(), json!("frame")),
        ("stripMode".into(), json!("filmstrip")),
        ("compactSidebars".into(), json!(false)),
    ])
}

fn event(
    action_id: &str,
    event_type: &str,
    renderer_ms: f64,
    data: Option<Map<String, Value>>,
) -> ProfileRendererEvent {
    ProfileRendererEvent {
        event_type: event_type.into(),
        action_id: action_id.into(),
        clock_id: CLOCK_ID.into(),
        renderer_ms,
        data,
    }
}

fn input_data(input: &ProfileInputObservation) -> Map<String, Value> {
    let mut data = Map::from_iter([
        ("control".into(), json!(input.control)),
        ("targetState".into(), json!(input.target_state)),
    ]);
    if let Some(number) = input.target_number {
        data.insert("targetNumber".into(), json!(number));
    }
    if let Some(boolean) = input.target_boolean {
        data.insert("targetBoolean".into(), json!(boolean));
    }
    data
}

fn outcome_data(status: &str, reason: Option<&str>, endpoint: Option<&str>) -> Map<String, Value> {
    Map::from_iter([
        ("status".into(), json!(status)),
        (
            "reasonCode".into(),
            reason.map_or(Value::Null, |value| json!(value)),
        ),
        (
            "endpoint".into(),
            endpoint.map_or(Value::Null, |value| json!(value)),
        ),
    ])
}

fn short_batch(
    sequence: u32,
    action_id: &str,
    input: ProfileInputObservation,
    status: &str,
    reason: &str,
) -> ProfileRendererBatch {
    let events = vec![
        event(action_id, "delivered_input", 1.25, Some(input_data(&input))),
        event(
            action_id,
            "action_outcome",
            2.5,
            Some(outcome_data(status, Some(reason), None)),
        ),
    ];
    ProfileRendererBatch {
        session_id: SESSION_ID.into(),
        batch_sequence: sequence,
        action_id: action_id.into(),
        renderer_process_clock_id: CLOCK_ID.into(),
        events,
        observed_outcome: ProfileObservedOutcome {
            status: status.into(),
            reason_code: Some(reason.into()),
            endpoint: None,
            renderer_ms: 2.25,
            fresh_execution: Some(false),
            association_checks: BTreeMap::new(),
            measurements: BTreeMap::new(),
        },
        renderer_dropped_event_count: 0,
        analysis_config: analysis_config(46, true),
        render_config: render_config(),
        input,
        image_runtime_id: "image-native-interop".into(),
    }
}

fn unavailable_batch(sequence: u32, action_id: &str, control: &str) -> ProfileRendererBatch {
    let input = ProfileInputObservation {
        control: control.into(),
        target_state: "invalid-or-empty".into(),
        target_number: None,
        target_boolean: None,
    };
    let events = vec![
        event(action_id, "delivered_input", 1.25, Some(input_data(&input))),
        event(
            action_id,
            "input_resolved",
            2.5,
            Some(Map::from_iter([
                ("sourceMatches".into(), json!(true)),
                ("targetMatches".into(), json!(false)),
            ])),
        ),
        event(
            action_id,
            "action_outcome",
            3.75,
            Some(outcome_data(
                "unverified",
                Some("input-target-invalid"),
                None,
            )),
        ),
    ];
    ProfileRendererBatch {
        session_id: SESSION_ID.into(),
        batch_sequence: sequence,
        action_id: action_id.into(),
        renderer_process_clock_id: CLOCK_ID.into(),
        events,
        observed_outcome: ProfileObservedOutcome {
            status: "unverified".into(),
            reason_code: Some("input-target-invalid".into()),
            endpoint: None,
            renderer_ms: 3.75,
            fresh_execution: Some(false),
            association_checks: BTreeMap::from([("inputTargetResolved".into(), false)]),
            measurements: BTreeMap::new(),
        },
        renderer_dropped_event_count: 0,
        analysis_config: ProfileAnalysisConfigEvidence::Unavailable {
            reason_code: "input-target-invalid".into(),
        },
        render_config: render_config(),
        input,
        image_runtime_id: "image-native-interop".into(),
    }
}

fn completed_numeric_batch() -> ProfileRendererBatch {
    let input = ProfileInputObservation {
        control: "clusters".into(),
        target_state: "number".into(),
        target_number: Some(46.0),
        target_boolean: None,
    };
    let mut renderer_ms = 1.25;
    let mut next = |kind: &str, data: Option<Map<String, Value>>| {
        let current = renderer_ms;
        renderer_ms += 1.25;
        event(NUMERIC_ACTION, kind, current, data)
    };
    let mut events = vec![
        next("delivered_input", Some(input_data(&input))),
        next(
            "input_resolved",
            Some(Map::from_iter([
                ("sourceMatches".into(), json!(true)),
                ("targetMatches".into(), json!(true)),
            ])),
        ),
        next(
            "schedule_observed",
            Some(Map::from_iter([("disposition".into(), json!("bound"))])),
        ),
        next("request_admitted", None),
        next(
            "renderer_native_issue",
            Some(Map::from_iter([
                ("pathMatches".into(), json!(true)),
                ("requestMatches".into(), json!(true)),
            ])),
        ),
        next(
            "renderer_native_settle",
            Some(Map::from_iter([("ok".into(), json!(true))])),
        ),
        next("renderer_response_parsed", None),
        next("store_accepted", None),
    ];
    for figure in ["histogram", "polar", "hue-lightness"] {
        events.push(next(
            "figure_generated",
            Some(Map::from_iter([
                ("figure".into(), json!(figure)),
                ("durationMs".into(), json!(1.125)),
            ])),
        ));
    }
    events.extend([
        next(
            "enabled_figures_generated",
            Some(Map::from_iter([("count".into(), json!(3))])),
        ),
        next("dom_settled", None),
        next("raf1", None),
        next("associated_result_dom_raf2_approx", None),
    ]);
    let checks = BTreeMap::from([
        ("inputTargetResolved".into(), true),
        ("actualPathMatchesExpected".into(), true),
        ("nativeRequestMatchesAdmitted".into(), true),
        ("storeReceiptAccepted".into(), true),
        ("activeImageMatchesAdmitted".into(), true),
        ("acceptedResultObjectMatches".into(), true),
        ("analysisConfigMatches".into(), true),
        ("renderConfigMatches".into(), true),
        ("enabledFiguresMatch".into(), true),
        ("domFiguresMatch".into(), true),
        ("visibleAtDomSettle".into(), true),
        ("visibleAtRaf1".into(), true),
        ("visibleAtRaf2".into(), true),
    ]);
    let endpoint = "associated_result_dom_raf2_approx";
    let outcome_ms = renderer_ms;
    events.push(event(
        NUMERIC_ACTION,
        "action_outcome",
        outcome_ms + 0.25,
        Some(outcome_data("completed", None, Some(endpoint))),
    ));
    let first = events[0].renderer_ms;
    let by_type = |kind: &str| {
        events
            .iter()
            .find(|item| item.event_type == kind)
            .unwrap()
            .renderer_ms
            - first
    };
    let measurements = BTreeMap::from([
        (
            "input_to_request_admitted_ms".into(),
            by_type("request_admitted"),
        ),
        (
            "renderer_native_roundtrip_ms".into(),
            by_type("renderer_native_settle") - by_type("renderer_native_issue"),
        ),
        (
            "input_to_store_accepted_ms".into(),
            by_type("store_accepted"),
        ),
        (
            "input_to_enabled_figures_generated_ms".into(),
            by_type("enabled_figures_generated"),
        ),
        ("input_to_dom_settled_ms".into(), by_type("dom_settled")),
        (
            "input_to_associated_result_dom_raf2_approx_ms".into(),
            by_type("associated_result_dom_raf2_approx"),
        ),
        ("run_kmeans_ms".into(), 4.125),
    ]);
    ProfileRendererBatch {
        session_id: SESSION_ID.into(),
        batch_sequence: 1,
        action_id: NUMERIC_ACTION.into(),
        renderer_process_clock_id: CLOCK_ID.into(),
        events,
        observed_outcome: ProfileObservedOutcome {
            status: "completed".into(),
            reason_code: None,
            endpoint: Some(endpoint.into()),
            renderer_ms: outcome_ms,
            fresh_execution: None,
            association_checks: checks,
            measurements,
        },
        renderer_dropped_event_count: 0,
        analysis_config: analysis_config(46, true),
        render_config: render_config(),
        input,
        image_runtime_id: "image-native-interop".into(),
    }
}

fn context(action_id: &str) -> crate::profiling::ProfileInvocationContext {
    context_for(SESSION_ID, action_id)
}

fn context_for(session_id: &str, action_id: &str) -> crate::profiling::ProfileInvocationContext {
    crate::profiling::ProfileInvocationContext {
        session_id: session_id.into(),
        action_id: action_id.into(),
        renderer_clock_id: CLOCK_ID.into(),
    }
}

fn for_session(mut batch: ProfileRendererBatch, session_id: &str) -> ProfileRendererBatch {
    batch.session_id = session_id.into();
    batch
}

#[test]
fn disabled_and_invalid_launch_create_no_artifact() {
    let root = tempdir().unwrap();
    assert!(
        !ProfileState::from_launch(root.path(), None)
            .status()
            .enabled
    );
    assert!(!root.path().join(PROFILE_DIRECTORY).exists());
    let invalid = state(root.path(), "../escape");
    assert!(!invalid.status().enabled);
    assert_eq!(
        invalid.status().error_code.as_deref(),
        Some("profiling-invalid-session")
    );
}

#[test]
fn canonical_native_input_serialization_omits_inactive_arms() {
    let numeric = ProfileInputObservation {
        control: "clusters".into(),
        target_state: "number".into(),
        target_number: Some(46.0),
        target_boolean: None,
    };
    let boolean = ProfileInputObservation {
        control: "snapToReal".into(),
        target_state: "boolean".into(),
        target_number: None,
        target_boolean: Some(false),
    };
    let invalid = ProfileInputObservation {
        control: "clusters".into(),
        target_state: "invalid-or-empty".into(),
        target_number: None,
        target_boolean: None,
    };
    assert_eq!(
        serde_json::to_value(numeric).unwrap(),
        json!({
            "control": "clusters", "targetState": "number", "targetNumber": 46.0
        })
    );
    assert_eq!(
        serde_json::to_value(boolean).unwrap(),
        json!({
            "control": "snapToReal", "targetState": "boolean", "targetBoolean": false
        })
    );
    assert_eq!(
        serde_json::to_value(invalid).unwrap(),
        json!({
            "control": "clusters", "targetState": "invalid-or-empty"
        })
    );
    assert!(serde_json::from_value::<ProfileInputObservation>(json!({
        "control": "clusters",
        "targetState": "number",
        "targetNumber": 46.0,
        "targetBoolean": null
    }))
    .is_err());
}

#[test]
fn native_success_and_error_spans_are_correlated_and_missing_context_is_a_noop() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    assert!(state.begin_native(None).is_none());

    let success = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let end = state.capture_native_end();
    state.finish_native(success, end, "success", None);
    let failure = state.begin_native(Some(&context(BOOLEAN_ACTION)));
    let end = state.capture_native_end();
    state.finish_native(failure, end, "error", Some("analysis-failed"));

    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    assert_eq!(contents.matches("\"phase\":\"receive\"").count(), 2);
    assert_eq!(contents.matches("\"phase\":\"return\"").count(), 2);
    assert!(contents.contains(&format!("\"actionId\":\"{NUMERIC_ACTION}\"")));
    assert!(contents.contains("\"errorCode\":\"analysis-failed\""));
}

#[test]
fn accepted_batch_persists_immutable_outcome_before_close_and_returns_receipt() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let span = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    let receipt = state
        .append_batch(short_batch(
            1,
            NUMERIC_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ))
        .unwrap();

    assert_eq!(receipt.error_code, None);
    assert_eq!(receipt.accepted_count, 2);
    assert!(receipt.outcome_accepted);
    assert!(receipt.native_receive_recorded);
    assert!(receipt.native_return_recorded);
    assert!(receipt.closed);
    assert!(!receipt.session_tainted);
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    let batch_at = contents.find("\"recordType\":\"renderer-batch\"").unwrap();
    let close_at = contents.find("\"recordType\":\"action-close\"").unwrap();
    assert!(batch_at < close_at);
}

#[test]
fn unavailable_then_resolved_batches_persist_as_contiguous_v2_evidence() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let invalid = state
        .append_batch(unavailable_batch(1, INVALID_ACTION, "quality"))
        .unwrap();
    assert!(invalid.outcome_accepted && invalid.closed);
    assert!(!invalid.native_receive_recorded && !invalid.native_return_recorded);
    let resolved = state
        .append_batch(short_batch(
            2,
            BOOLEAN_ACTION,
            ProfileInputObservation {
                control: "snapToReal".into(),
                target_state: "boolean".into(),
                target_number: None,
                target_boolean: Some(false),
            },
            "deduped",
            "request-key-unchanged",
        ))
        .unwrap();
    assert!(resolved.outcome_accepted && resolved.closed);
    let seal = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(seal.sealed);
    assert_eq!(seal.last_batch_sequence, 2);
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    assert!(contents
        .lines()
        .all(|line| line.contains("\"schemaVersion\":2")));
    assert!(contents.contains("\"state\":\"unavailable\""));
    assert!(contents.contains("\"state\":\"resolved\""));
}

#[test]
fn native_validation_rejects_each_unavailable_contradiction() {
    let mut contradictions = Vec::new();

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.input.control = "snapToReal".into();
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.renderer_dropped_event_count = 1;
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.events.remove(1);
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.events[1]
        .data
        .as_mut()
        .unwrap()
        .insert("sourceMatches".into(), json!(false));
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch
        .observed_outcome
        .measurements
        .insert("run_kmeans_ms".into(), 1.0);
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.observed_outcome.association_checks.clear();
    contradictions.push(batch);

    let mut batch = unavailable_batch(1, INVALID_ACTION, "clusters");
    batch.analysis_config = ProfileAnalysisConfigEvidence::Unavailable {
        reason_code: "other".into(),
    };
    contradictions.push(batch);

    for batch in contradictions {
        assert!(validate_batch(&batch).is_err());
    }
}

#[test]
fn unavailable_evidence_cannot_conflict_with_native_history_or_bad_sequence() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let span = state.begin_native(Some(&context(INVALID_ACTION)));
    assert!(span.is_some());
    assert_eq!(
        state
            .append_batch(unavailable_batch(1, INVALID_ACTION, "clusters"))
            .unwrap_err(),
        "profiling-unavailable-native-history"
    );
    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    let accepted = state
        .append_batch(short_batch(
            1,
            BOOLEAN_ACTION,
            ProfileInputObservation {
                control: "snapToReal".into(),
                target_state: "boolean".into(),
                target_number: None,
                target_boolean: Some(false),
            },
            "deduped",
            "request-key-unchanged",
        ))
        .unwrap();
    assert_eq!(accepted.batch_sequence, 1);
    assert!(accepted.session_tainted);

    let fresh_root = tempdir().unwrap();
    let fresh = ProfileState::from_launch(fresh_root.path(), Some(OsString::from("bad-sequence")));
    let mut sequence_two = unavailable_batch(2, "bad-sequence:invalid", "clusters");
    sequence_two.session_id = "bad-sequence".into();
    assert_eq!(
        fresh.append_batch(sequence_two).unwrap_err(),
        "profiling-batch-sequence-invalid"
    );
}

#[test]
fn late_native_admission_after_unavailable_close_records_loss_not_a_span() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    state
        .append_batch(unavailable_batch(1, INVALID_ACTION, "clusters"))
        .unwrap();
    assert!(state.begin_native(Some(&context(INVALID_ACTION))).is_none());
    let seal = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(seal.sealed);
    assert_eq!(seal.dropped_event_count, 1);
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    assert!(!contents.contains("\"recordType\":\"native-event\""));
}

#[test]
fn invalid_and_oversized_batches_close_as_session_loss() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let mut invalid = short_batch(
        1,
        "invalid-event-action",
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    invalid.events[0].event_type = "made_up".into();
    let receipt = state.append_batch(invalid).unwrap();
    assert_eq!(receipt.accepted_count, 0);
    assert_eq!(receipt.dropped_count, 2);
    assert!(receipt.closed && receipt.session_tainted);
    assert_eq!(
        receipt.error_code.as_deref(),
        Some("renderer-event-invalid")
    );

    let mut oversized = short_batch(
        2,
        "oversized-action",
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    oversized.events = (0..=MAX_RENDERER_BATCH_EVENTS)
        .map(|index| event("oversized-action", "schedule_observed", index as f64, None))
        .collect();
    let receipt = state.append_batch(oversized).unwrap();
    assert_eq!(
        receipt.dropped_count as usize,
        MAX_RENDERER_BATCH_EVENTS + 1
    );
    assert!(receipt.closed && receipt.session_tainted);
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    assert_eq!(sealed.dropped_event_count, 131);
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    let losses: Vec<Value> = contents
        .lines()
        .filter_map(|line| {
            let record: Value = serde_json::from_str(line).unwrap();
            (record["recordType"] == "session-loss").then_some(record)
        })
        .collect();
    assert_eq!(losses.len(), 2);
    assert_eq!(losses[0]["droppedEventCount"], 2);
    assert_eq!(losses[1]["droppedEventCount"], 131);
}

#[test]
fn cancellation_close_allows_one_late_native_return_without_reopening() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let span = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let mut terminal = short_batch(
        1,
        NUMERIC_ACTION,
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "source-replaced",
    );
    terminal.renderer_dropped_event_count = 2;
    let receipt = state.append_batch(terminal).unwrap();
    assert!(!receipt.native_return_recorded);
    assert_eq!(receipt.dropped_count, 2);
    assert!(receipt.session_tainted);

    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    assert!(state
        .append_batch(short_batch(
            2,
            NUMERIC_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "source-replaced",
        ))
        .is_err());
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    assert_eq!(
        contents.matches("\"recordType\":\"action-close\"").count(),
        1
    );
    assert_eq!(contents.matches("\"phase\":\"return\"").count(), 1);
}

#[test]
fn finalization_stops_new_actions_waits_for_open_native_and_seals_once() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let span = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let pending = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(!pending.sealed);
    assert_eq!(pending.open_action_count, 1);
    assert_eq!(
        pending.error_code.as_deref(),
        Some("profiling-actions-open")
    );
    assert_eq!(
        state
            .append_batch(short_batch(
                1,
                BOOLEAN_ACTION,
                ProfileInputObservation {
                    control: "snapToReal".into(),
                    target_state: "boolean".into(),
                    target_number: None,
                    target_boolean: Some(false),
                },
                "deduped",
                "request-key-unchanged",
            ))
            .unwrap_err(),
        "profiling-finalization-started"
    );
    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    state
        .append_batch(short_batch(
            1,
            NUMERIC_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ))
        .unwrap();
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    assert_eq!(sealed.open_action_count, 0);
    let repeated = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert_eq!(repeated.artifact_byte_count, sealed.artifact_byte_count);
    let bytes = fs::read(artifact(root.path(), SESSION_ID)).unwrap();
    assert_eq!(bytes.len(), sealed.artifact_byte_count);
    let last = bytes.split(|byte| *byte == b'\n').rev().nth(1).unwrap();
    let record: Value = serde_json::from_slice(last).unwrap();
    assert_eq!(record["recordType"], "session-seal");
    assert_eq!(record["artifactByteCount"], bytes.len());
}

#[test]
fn successful_seal_is_irreversible_for_known_action_receive_batch_and_loss() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let action_id = "known-renderer-only-action";
    state
        .append_batch(short_batch(
            1,
            action_id,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ))
        .unwrap();
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    let before = fs::read(artifact(root.path(), SESSION_ID)).unwrap();

    assert!(state.begin_native(Some(&context(action_id))).is_none());
    assert_eq!(
        state
            .append_batch(short_batch(
                2,
                action_id,
                ProfileInputObservation {
                    control: "clusters".into(),
                    target_state: "number".into(),
                    target_number: Some(47.0),
                    target_boolean: None,
                },
                "cancelled",
                "source-replaced",
            ))
            .unwrap_err(),
        "profiling-session-sealed"
    );
    state.record_test_loss(7, "post-seal-test-loss");

    let repeated = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert_eq!(
        serde_json::to_value(&repeated).unwrap(),
        serde_json::to_value(&sealed).unwrap()
    );
    assert_eq!(fs::read(artifact(root.path(), SESSION_ID)).unwrap(), before);
}

#[test]
fn post_finalize_wait_conflicting_admissions_do_not_mutate_and_late_return_completes() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let span = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let pending = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(!pending.sealed);
    let before = fs::read(artifact(root.path(), SESSION_ID)).unwrap();

    let conflicting_context = crate::profiling::ProfileInvocationContext {
        session_id: SESSION_ID.into(),
        action_id: NUMERIC_ACTION.into(),
        renderer_clock_id: "renderer-conflicting-clock".into(),
    };
    assert!(state.begin_native(Some(&conflicting_context)).is_none());
    assert!(state.begin_native(Some(&context(NUMERIC_ACTION))).is_none());
    let mut conflicting_batch = short_batch(
        1,
        NUMERIC_ACTION,
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    conflicting_batch.renderer_process_clock_id = "renderer-conflicting-clock".into();
    for event in &mut conflicting_batch.events {
        event.clock_id = "renderer-conflicting-clock".into();
    }
    assert_eq!(
        state.append_batch(conflicting_batch).unwrap_err(),
        "profiling-action-clock-mismatch"
    );

    let repeated_pending = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert_eq!(
        serde_json::to_value(&repeated_pending).unwrap(),
        serde_json::to_value(&pending).unwrap()
    );
    assert_eq!(fs::read(artifact(root.path(), SESSION_ID)).unwrap(), before);

    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    state
        .append_batch(short_batch(
            1,
            NUMERIC_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ))
        .unwrap();
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    assert_eq!(sealed.dropped_event_count, 0);
}

#[test]
fn pre_finalization_129th_action_refusal_is_durable_loss_before_exact_seal() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    for index in 0..MAX_ACTIONS {
        let action_id = format!("capacity-action-{index:03}");
        state
            .append_batch(short_batch(
                u32::try_from(index + 1).unwrap(),
                &action_id,
                ProfileInputObservation {
                    control: "clusters".into(),
                    target_state: "number".into(),
                    target_number: Some(46.0),
                    target_boolean: None,
                },
                "cancelled",
                "view-unmounted",
            ))
            .unwrap();
    }
    let refused_id = "capacity-action-128";
    assert_eq!(
        state
            .append_batch(short_batch(
                129,
                refused_id,
                ProfileInputObservation {
                    control: "clusters".into(),
                    target_state: "number".into(),
                    target_number: Some(47.0),
                    target_boolean: None,
                },
                "cancelled",
                "view-unmounted",
            ))
            .unwrap_err(),
        "profiling-action-capacity"
    );
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    assert_eq!(sealed.dropped_event_count, 2);
    assert_eq!(sealed.last_batch_sequence, 128);
    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    assert!(!contents.contains(refused_id));
    assert_eq!(
        contents.matches("\"recordType\":\"session-loss\"").count(),
        1
    );
    let seal: Value = serde_json::from_str(contents.lines().last().unwrap()).unwrap();
    assert_eq!(seal["actionCount"], 128);
    assert_eq!(seal["droppedEventCount"], 2);
}

#[test]
fn rejected_identifiers_never_persist_but_valid_identity_invalid_payload_closes() {
    let root = tempdir().unwrap();
    let state = state(root.path(), SESSION_ID);
    let rejected_action = "/private/source-name-secret.mov";
    let oversized_clock = "oversized-renderer-clock-secret".repeat(8);
    let rejected_image = "/private/rejected-image-secret.mov";
    let rejected_event = "/private/rejected-event-secret.mov";
    let rejected_native = "/private/rejected-native-secret.mov";

    assert!(state
        .begin_native(Some(&crate::profiling::ProfileInvocationContext {
            session_id: SESSION_ID.into(),
            action_id: rejected_native.into(),
            renderer_clock_id: CLOCK_ID.into(),
        }))
        .is_none());

    let malformed_action = short_batch(
        1,
        rejected_action,
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    assert_eq!(
        state.append_batch(malformed_action).unwrap_err(),
        "profiling-invalid-batch-id"
    );

    let mut bad_clock = short_batch(
        1,
        "safe-action-invalid-clock",
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    bad_clock.renderer_process_clock_id = oversized_clock.clone();
    for event in &mut bad_clock.events {
        event.clock_id = oversized_clock.clone();
    }
    assert_eq!(
        state.append_batch(bad_clock).unwrap_err(),
        "profiling-invalid-batch-id"
    );

    let mut bad_image = short_batch(
        1,
        "safe-action-invalid-image",
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    bad_image.image_runtime_id = rejected_image.into();
    assert_eq!(
        state.append_batch(bad_image).unwrap_err(),
        "profiling-invalid-batch-id"
    );

    let mut bad_event = short_batch(
        1,
        "safe-action-invalid-event",
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    bad_event.events[0].action_id = rejected_event.into();
    assert_eq!(
        state.append_batch(bad_event).unwrap_err(),
        "profiling-invalid-batch-id"
    );

    let valid_action = "valid-id-invalid-payload";
    let mut invalid_payload = short_batch(
        1,
        valid_action,
        ProfileInputObservation {
            control: "clusters".into(),
            target_state: "number".into(),
            target_number: Some(46.0),
            target_boolean: None,
        },
        "cancelled",
        "view-unmounted",
    );
    invalid_payload.events[0].event_type = "made_up".into();
    let receipt = state.append_batch(invalid_payload).unwrap();
    assert_eq!(receipt.accepted_count, 0);
    assert_eq!(
        receipt.error_code.as_deref(),
        Some("renderer-event-invalid")
    );
    assert!(receipt.closed && receipt.session_tainted);
    let sealed = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(sealed.sealed);
    assert_eq!(sealed.last_batch_sequence, 1);
    assert_eq!(sealed.dropped_event_count, 11);

    let contents = fs::read_to_string(artifact(root.path(), SESSION_ID)).unwrap();
    for rejected in [
        rejected_action,
        oversized_clock.as_str(),
        rejected_image,
        rejected_event,
        rejected_native,
        "safe-action-invalid-clock",
        "safe-action-invalid-image",
        "safe-action-invalid-event",
    ] {
        assert!(!contents.contains(rejected));
    }
    assert!(contents.contains(valid_action));
    let seal: Value = serde_json::from_str(contents.lines().last().unwrap()).unwrap();
    assert_eq!(seal["actionCount"], 1);
}

#[derive(Clone)]
struct ZeroAfterSuccessSink {
    bytes: Arc<Mutex<Vec<u8>>>,
    calls: usize,
    zero_on_call: usize,
}

impl Write for ZeroAfterSuccessSink {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.calls += 1;
        if self.calls == self.zero_on_call {
            return Ok(0);
        }
        self.bytes.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

fn test_header<'a>() -> TraceSessionRecord<'a> {
    TraceSessionRecord {
        schema_version: SCHEMA_VERSION,
        record_type: "trace-session",
        session_id: SESSION_ID,
        native_clock_id: "native-test",
        native_monotonic_ns: "0",
        wall_unix_ms: 1,
        limits: TraceLimits {
            max_actions: MAX_ACTIONS,
            max_artifact_events: MAX_ARTIFACT_EVENTS,
            max_artifact_records: MAX_ARTIFACT_RECORDS,
            max_artifact_bytes: MAX_ARTIFACT_BYTES,
            max_renderer_batch_events: MAX_RENDERER_BATCH_EVENTS,
            max_renderer_batch_bytes: MAX_RENDERER_BATCH_BYTES,
            max_renderer_event_bytes: MAX_RENDERER_EVENT_BYTES,
        },
    }
}

#[test]
fn zero_byte_write_after_success_cannot_leave_an_eligible_clean_prefix() {
    let shared = Arc::new(Mutex::new(Vec::new()));
    let sink = ZeroAfterSuccessSink {
        bytes: shared.clone(),
        calls: 0,
        zero_on_call: 3,
    };
    let mut writer = ProfileWriter::new(Box::new(sink), &test_header()).unwrap();
    writer
        .write_unreserved(&json!({ "recordType": "action-a-prefix" }), 1)
        .unwrap();
    assert_eq!(
        writer.write_unreserved(&json!({ "recordType": "action-b-first-write" }), 1),
        Err("profiling-write-failed")
    );
    writer.record_loss(SESSION_ID, "native-test", 1, "injected-zero-write");
    let seal = writer.finalize(SESSION_ID, "native-test");
    assert!(!seal.sealed);
    let prefix = String::from_utf8(shared.lock().unwrap().clone()).unwrap();
    assert!(prefix.contains("action-a-prefix"));
    assert!(!prefix.contains("session-loss"));
    assert!(!prefix.contains("session-seal"));
}

#[test]
fn every_nonfatal_loss_persists_a_strictly_increasing_cumulative_snapshot() {
    let sink = Arc::new(Mutex::new(Vec::<u8>::new()));
    let mut writer =
        ProfileWriter::new(Box::new(SharedSink(sink.clone())), &test_header()).unwrap();
    writer.record_loss(SESSION_ID, "native-test", 2, "renderer-drop");
    writer.record_loss(SESSION_ID, "native-test", 3, "invalid-batch");
    let seal = writer.finalize(SESSION_ID, "native-test");
    assert!(seal.sealed);
    assert_eq!(seal.dropped_event_count, 5);

    let contents = String::from_utf8(sink.lock().unwrap().clone()).unwrap();
    let records: Vec<Value> = contents
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    let losses: Vec<_> = records
        .iter()
        .filter(|record| record["recordType"] == "session-loss")
        .collect();
    assert_eq!(losses.len(), 2);
    assert_eq!(losses[0]["droppedEventCount"], 2);
    assert_eq!(losses[1]["droppedEventCount"], 5);
    assert_eq!(records.last().unwrap()["droppedEventCount"], 5);
}

#[test]
fn failure_to_persist_a_later_loss_snapshot_makes_the_session_unsealable() {
    let shared = Arc::new(Mutex::new(Vec::new()));
    let sink = ZeroAfterSuccessSink {
        bytes: shared.clone(),
        calls: 0,
        zero_on_call: 3,
    };
    let mut writer = ProfileWriter::new(Box::new(sink), &test_header()).unwrap();
    writer.record_loss(SESSION_ID, "native-test", 1, "first-loss");
    writer.record_loss(SESSION_ID, "native-test", 1, "second-loss");
    let seal = writer.finalize(SESSION_ID, "native-test");
    assert!(!seal.sealed);
    assert_eq!(
        seal.error_code.as_deref(),
        Some("profiling-writer-unavailable")
    );
    let prefix = String::from_utf8(shared.lock().unwrap().clone()).unwrap();
    assert_eq!(prefix.matches("\"recordType\":\"session-loss\"").count(), 1);
    assert!(!prefix.contains("\"recordType\":\"session-seal\""));
}

#[derive(Clone)]
struct SharedSink(Arc<Mutex<Vec<u8>>>);

impl Write for SharedSink {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[test]
fn nested_event_budget_reserves_close_loss_and_seal_at_the_boundary() {
    let mut writer = ProfileWriter::new(Box::new(Vec::<u8>::new()), &test_header()).unwrap();
    writer
        .reserve_action("budget-action", CLOCK_ID, true)
        .unwrap();
    writer.record_loss(SESSION_ID, "native-test", 1, "test-accounted-loss");
    let (reserved_events, _, _) = writer.reserved();
    writer.event_units_written = MAX_ARTIFACT_EVENTS - reserved_events - 128;
    writer
        .write_unreserved(&json!({ "recordType": "renderer-batch" }), 128)
        .unwrap();
    assert_eq!(
        writer.write_unreserved(&json!({ "recordType": "over-budget" }), 1),
        Err("profiling-artifact-capacity")
    );

    writer
        .write_action_reserved(
            "budget-action",
            crate::profiling_writer::ActionReservation::NativeReturn,
            &json!({ "recordType": "native-event", "phase": "return" }),
        )
        .unwrap();
    writer
        .write_action_reserved(
            "budget-action",
            crate::profiling_writer::ActionReservation::ActionClose,
            &json!({ "recordType": "action-close", "status": "cancelled" }),
        )
        .unwrap();
    writer.actions.get_mut("budget-action").unwrap().closed = true;
    let sealed = writer.finalize(SESSION_ID, "native-test");
    assert!(sealed.sealed);
    assert_eq!(sealed.event_count, MAX_ARTIFACT_EVENTS);

    let mut writer = ProfileWriter::new(Box::new(Vec::<u8>::new()), &test_header()).unwrap();
    writer.event_units_written = usize::MAX;
    assert_eq!(
        writer.write_unreserved(&json!({ "recordType": "overflow" }), 1),
        Err("profiling-artifact-capacity")
    );
}

#[test]
fn private_artifact_is_exclusive_and_owner_only_where_supported() {
    let root = tempdir().unwrap();
    let enabled = state(root.path(), SESSION_ID);
    assert!(enabled.status().enabled);
    let path = artifact(root.path(), SESSION_ID);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(&path).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }
    let duplicate = state(root.path(), SESSION_ID);
    assert!(!duplicate.status().enabled);
    assert_eq!(
        duplicate.status().error_code.as_deref(),
        Some("profiling-artifact-exclusive-create")
    );
}

#[test]
fn missing_optional_invocation_context_deserializes_as_none() {
    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase", deny_unknown_fields)]
    struct Args {
        req: Value,
        profile_context: Option<crate::profiling::ProfileInvocationContext>,
    }
    let args: Args = serde_json::from_value(json!({ "req": { "k": 46 } })).unwrap();
    assert_eq!(args.req["k"], 46);
    assert!(args.profile_context.is_none());
}

fn emit_round03_fixtures(root: &Path) -> Value {
    const POST_SESSION: &str = "native-post-seal";
    const POST_ACTION: &str = "native-post-seal:known-action";
    let post = state(root, POST_SESSION);
    post.append_batch(for_session(
        short_batch(
            1,
            POST_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ),
        POST_SESSION,
    ))
    .unwrap();
    let sealed = post
        .finalize(ProfileFinalizeRequest {
            session_id: POST_SESSION.into(),
        })
        .unwrap();
    let sealed_bytes = fs::read(artifact(root, POST_SESSION)).unwrap();
    assert!(post
        .begin_native(Some(&context_for(POST_SESSION, POST_ACTION)))
        .is_none());
    assert_eq!(
        post.append_batch(for_session(
            short_batch(
                2,
                POST_ACTION,
                ProfileInputObservation {
                    control: "clusters".into(),
                    target_state: "number".into(),
                    target_number: Some(47.0),
                    target_boolean: None,
                },
                "cancelled",
                "source-replaced",
            ),
            POST_SESSION,
        ))
        .unwrap_err(),
        "profiling-session-sealed"
    );
    post.record_test_loss(7, "post-seal-fixture-loss");
    let repeated = post
        .finalize(ProfileFinalizeRequest {
            session_id: POST_SESSION.into(),
        })
        .unwrap();
    let post_attempt_bytes = fs::read(artifact(root, POST_SESSION)).unwrap();
    assert_eq!(post_attempt_bytes, sealed_bytes);

    const CAPACITY_SESSION: &str = "native-capacity";
    const SELECTED_ACTION: &str = "native-capacity:selected-action";
    const REFUSED_ACTION: &str = "native-capacity:action-128";
    let capacity = state(root, CAPACITY_SESSION);
    let span = capacity.begin_native(Some(&context_for(CAPACITY_SESSION, SELECTED_ACTION)));
    let end = capacity.capture_native_end();
    capacity.finish_native(span, end, "success", None);
    let mut selected = completed_numeric_batch();
    selected.session_id = CAPACITY_SESSION.into();
    selected.action_id = SELECTED_ACTION.into();
    for event in &mut selected.events {
        event.action_id = SELECTED_ACTION.into();
    }
    capacity.append_batch(selected).unwrap();
    for index in 1..MAX_ACTIONS {
        let action_id = format!("native-capacity:action-{index:03}");
        capacity
            .append_batch(for_session(
                short_batch(
                    u32::try_from(index + 1).unwrap(),
                    &action_id,
                    ProfileInputObservation {
                        control: "clusters".into(),
                        target_state: "number".into(),
                        target_number: Some(46.0),
                        target_boolean: None,
                    },
                    "cancelled",
                    "view-unmounted",
                ),
                CAPACITY_SESSION,
            ))
            .unwrap();
    }
    let refusal_code = capacity
        .append_batch(for_session(
            short_batch(
                129,
                REFUSED_ACTION,
                ProfileInputObservation {
                    control: "clusters".into(),
                    target_state: "number".into(),
                    target_number: Some(47.0),
                    target_boolean: None,
                },
                "cancelled",
                "view-unmounted",
            ),
            CAPACITY_SESSION,
        ))
        .unwrap_err();
    let capacity_seal = capacity
        .finalize(ProfileFinalizeRequest {
            session_id: CAPACITY_SESSION.into(),
        })
        .unwrap();
    assert!(capacity_seal.sealed);
    assert_eq!(capacity_seal.dropped_event_count, 2);
    assert!(!fs::read_to_string(artifact(root, CAPACITY_SESSION))
        .unwrap()
        .contains(REFUSED_ACTION));

    const IDENTIFIER_SESSION: &str = "native-identifiers";
    const VALID_INVALID_ACTION: &str = "native-identifiers:valid-invalid-payload";
    let rejected_native = "/private/native-identity-secret.mov";
    let rejected_action = "/private/batch-identity-secret.mov";
    let oversized_clock = "oversized-renderer-clock-secret".repeat(8);
    let safe_invalid_clock_action = "native-identifiers:safe-invalid-clock";
    let identifiers = state(root, IDENTIFIER_SESSION);
    assert!(identifiers
        .begin_native(Some(&crate::profiling::ProfileInvocationContext {
            session_id: IDENTIFIER_SESSION.into(),
            action_id: rejected_native.into(),
            renderer_clock_id: CLOCK_ID.into(),
        }))
        .is_none());
    assert_eq!(
        identifiers
            .append_batch(for_session(
                short_batch(
                    1,
                    rejected_action,
                    ProfileInputObservation {
                        control: "clusters".into(),
                        target_state: "number".into(),
                        target_number: Some(46.0),
                        target_boolean: None,
                    },
                    "cancelled",
                    "view-unmounted",
                ),
                IDENTIFIER_SESSION,
            ))
            .unwrap_err(),
        "profiling-invalid-batch-id"
    );
    let mut bad_clock = for_session(
        short_batch(
            1,
            safe_invalid_clock_action,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ),
        IDENTIFIER_SESSION,
    );
    bad_clock.renderer_process_clock_id = oversized_clock.clone();
    for event in &mut bad_clock.events {
        event.clock_id = oversized_clock.clone();
    }
    assert_eq!(
        identifiers.append_batch(bad_clock).unwrap_err(),
        "profiling-invalid-batch-id"
    );
    let mut invalid_payload = for_session(
        short_batch(
            1,
            VALID_INVALID_ACTION,
            ProfileInputObservation {
                control: "clusters".into(),
                target_state: "number".into(),
                target_number: Some(46.0),
                target_boolean: None,
            },
            "cancelled",
            "view-unmounted",
        ),
        IDENTIFIER_SESSION,
    );
    invalid_payload.events[0].event_type = "made_up".into();
    let invalid_receipt = identifiers.append_batch(invalid_payload).unwrap();
    let identifier_seal = identifiers
        .finalize(ProfileFinalizeRequest {
            session_id: IDENTIFIER_SESSION.into(),
        })
        .unwrap();
    let identifier_contents = fs::read_to_string(artifact(root, IDENTIFIER_SESSION)).unwrap();
    for rejected in [
        rejected_native,
        rejected_action,
        oversized_clock.as_str(),
        safe_invalid_clock_action,
    ] {
        assert!(!identifier_contents.contains(rejected));
    }

    json!({
        "postSeal": {
            "sessionId": POST_SESSION,
            "traceFile": format!("profile-{POST_SESSION}.jsonl"),
            "knownActionId": POST_ACTION,
            "sealedByteCount": sealed_bytes.len(),
            "postAttemptByteCount": post_attempt_bytes.len(),
            "sealedReceipt": sealed,
            "repeatedReceipt": repeated,
        },
        "capacityRefusal": {
            "sessionId": CAPACITY_SESSION,
            "traceFile": format!("profile-{CAPACITY_SESSION}.jsonl"),
            "selectedActionId": SELECTED_ACTION,
            "refusedActionId": REFUSED_ACTION,
            "refusalCode": refusal_code,
            "expectedActionCount": MAX_ACTIONS,
            "expectedDroppedEventCount": 2,
            "expectedLastBatchSequence": MAX_ACTIONS,
            "sealReceipt": capacity_seal,
        },
        "identifierRejection": {
            "sessionId": IDENTIFIER_SESSION,
            "traceFile": format!("profile-{IDENTIFIER_SESSION}.jsonl"),
            "validInvalidPayloadActionId": VALID_INVALID_ACTION,
            "rejectedIdentifiers": [
                rejected_native,
                rejected_action,
                oversized_clock,
                safe_invalid_clock_action,
            ],
            "expectedActionCount": 1,
            "expectedDroppedEventCount": 7,
            "expectedLastBatchSequence": 1,
            "validInvalidPayloadReceipt": invalid_receipt,
            "sealReceipt": identifier_seal,
        }
    })
}

#[test]
#[ignore = "invoked by profiling-native-wire.test.mjs with an explicit test-owned output"]
fn emit_native_interop_fixture() {
    let root = std::env::var_os("COLOR_TOOL_PROFILE_INTEROP_DIR")
        .map(PathBuf::from)
        .expect("COLOR_TOOL_PROFILE_INTEROP_DIR is required");
    assert!(root.is_dir(), "interop root must already exist");
    let state = state(&root, SESSION_ID);
    assert!(state.status().enabled);

    state
        .append_batch(unavailable_batch(1, INVALID_ACTION, "clusters"))
        .unwrap();
    let span = state.begin_native(Some(&context(NUMERIC_ACTION)));
    let end = state.capture_native_end();
    state.finish_native(span, end, "success", None);
    let mut numeric_batch = completed_numeric_batch();
    numeric_batch.batch_sequence = 2;
    let numeric = state.append_batch(numeric_batch).unwrap();
    assert!(numeric.closed && numeric.accepted_count > 0);
    state
        .append_batch(short_batch(
            3,
            BOOLEAN_ACTION,
            ProfileInputObservation {
                control: "snapToReal".into(),
                target_state: "boolean".into(),
                target_number: None,
                target_boolean: Some(false),
            },
            "deduped",
            "request-key-unchanged",
        ))
        .unwrap();
    let seal = state
        .finalize(ProfileFinalizeRequest {
            session_id: SESSION_ID.into(),
        })
        .unwrap();
    assert!(seal.sealed);
    let metadata = json!({
        "sessionId": SESSION_ID,
        "traceFile": format!("profile-{SESSION_ID}.jsonl"),
        "actions": {
            "numeric": NUMERIC_ACTION,
            "boolean": BOOLEAN_ACTION,
            "invalid": INVALID_ACTION,
        }
    });
    fs::write(
        root.join(PROFILE_DIRECTORY)
            .join("native-interop-actions.json"),
        serde_json::to_vec_pretty(&metadata).unwrap(),
    )
    .unwrap();
    let round03 = emit_round03_fixtures(&root);
    fs::write(
        root.join(PROFILE_DIRECTORY)
            .join("native-round03-fixtures.json"),
        serde_json::to_vec_pretty(&round03).unwrap(),
    )
    .unwrap();
    println!(
        "PROFILE_INTEROP_TRACE={}",
        artifact(&root, SESSION_ID).display()
    );
}

#[test]
fn launch_environment_name_is_stable() {
    assert_eq!(PROFILE_SESSION_ENV, "COLOR_TOOL_PROFILE_SESSION");
}
