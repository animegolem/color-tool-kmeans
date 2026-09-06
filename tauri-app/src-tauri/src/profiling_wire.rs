use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

pub const SCHEMA_VERSION: u8 = 2;
pub const PROFILE_SESSION_ENV: &str = "COLOR_TOOL_PROFILE_SESSION";
pub const PROFILE_DIRECTORY: &str = "profiling";
pub const MAX_ACTIONS: usize = 128;
pub const MAX_ARTIFACT_EVENTS: usize = 8_192;
pub const MAX_ARTIFACT_RECORDS: usize = 1_024;
pub const MAX_ARTIFACT_BYTES: usize = 8 * 1024 * 1024;
pub const MAX_RENDERER_BATCH_EVENTS: usize = 128;
pub const MAX_RENDERER_BATCH_BYTES: usize = 128 * 1024;
pub const MAX_RENDERER_EVENT_BYTES: usize = 4 * 1024;

pub const SESSION_LOSS_BYTES: usize = 768;
pub const SESSION_SEAL_BYTES: usize = 1_536;
pub const NATIVE_RETURN_BYTES: usize = 768;
pub const ACTION_CLOSE_BYTES: usize = 1_536;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileInvocationContext {
    pub session_id: String,
    pub action_id: String,
    pub renderer_clock_id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileRendererEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub action_id: String,
    pub clock_id: String,
    pub renderer_ms: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub data: Option<Map<String, Value>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileObservedOutcome {
    pub status: String,
    pub reason_code: Option<String>,
    pub endpoint: Option<String>,
    pub renderer_ms: f64,
    pub fresh_execution: Option<bool>,
    pub association_checks: BTreeMap<String, bool>,
    pub measurements: BTreeMap<String, f64>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileInputObservation {
    pub control: String,
    pub target_state: String,
    #[serde(
        default,
        deserialize_with = "deserialize_present",
        skip_serializing_if = "Option::is_none"
    )]
    pub target_number: Option<f64>,
    #[serde(
        default,
        deserialize_with = "deserialize_present",
        skip_serializing_if = "Option::is_none"
    )]
    pub target_boolean: Option<bool>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(
    tag = "state",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum ProfileAnalysisConfigEvidence {
    Resolved { value: Map<String, Value> },
    Unavailable { reason_code: String },
}

fn deserialize_present<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    T::deserialize(deserializer).map(Some)
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileRendererBatch {
    pub session_id: String,
    pub batch_sequence: u32,
    pub action_id: String,
    pub renderer_process_clock_id: String,
    pub events: Vec<ProfileRendererEvent>,
    pub observed_outcome: ProfileObservedOutcome,
    pub renderer_dropped_event_count: u32,
    pub analysis_config: ProfileAnalysisConfigEvidence,
    pub render_config: Map<String, Value>,
    pub input: ProfileInputObservation,
    pub image_runtime_id: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileFinalizeRequest {
    pub session_id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileStatus {
    pub enabled: bool,
    pub session_id: Option<String>,
    pub clock_id: Option<String>,
    pub native_monotonic_ns: Option<String>,
    pub wall_unix_ms: Option<u64>,
    pub max_batch_events: usize,
    pub max_batch_bytes: usize,
    pub max_event_bytes: usize,
    pub error_code: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileWriteReceipt {
    pub session_id: String,
    pub batch_sequence: u32,
    pub action_id: String,
    pub accepted_count: u32,
    pub accepted_byte_count: u32,
    pub dropped_count: u32,
    pub outcome_accepted: bool,
    pub native_receive_recorded: bool,
    pub native_return_recorded: bool,
    pub session_tainted: bool,
    pub closed: bool,
    pub error_code: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileFinalizeReceipt {
    pub session_id: String,
    pub sealed: bool,
    pub open_action_count: usize,
    pub record_count: usize,
    pub event_count: usize,
    pub artifact_byte_count: usize,
    pub dropped_event_count: u32,
    pub last_batch_sequence: u32,
    pub error_code: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TraceSessionRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    pub session_id: &'a str,
    pub native_clock_id: &'a str,
    pub native_monotonic_ns: &'static str,
    pub wall_unix_ms: u64,
    pub limits: TraceLimits,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TraceLimits {
    pub max_actions: usize,
    pub max_artifact_events: usize,
    pub max_artifact_records: usize,
    pub max_artifact_bytes: usize,
    pub max_renderer_batch_events: usize,
    pub max_renderer_batch_bytes: usize,
    pub max_renderer_event_bytes: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct NativeEventRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    pub session_id: &'a str,
    pub action_id: &'a str,
    pub renderer_clock_id: &'a str,
    pub native_clock_id: &'a str,
    pub phase: &'static str,
    pub native_monotonic_ns: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub native_aggregate_ns: Option<String>,
    pub outcome: Option<&'static str>,
    pub error_code: Option<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RendererBatchRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    #[serde(flatten)]
    pub batch: &'a ProfileRendererBatch,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ActionCloseRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    pub session_id: &'a str,
    pub batch_sequence: u32,
    pub action_id: &'a str,
    pub accepted_event_count: u32,
    pub accepted_byte_count: u32,
    pub dropped_event_count: u32,
    pub observed_outcome_persisted: bool,
    pub native_receive_recorded: bool,
    pub native_return_recorded: bool,
    pub session_tainted: bool,
    pub closed: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionLossRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    pub session_id: &'a str,
    pub native_clock_id: &'a str,
    pub dropped_event_count: u32,
    pub error_code: &'static str,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionSealRecord<'a> {
    pub schema_version: u8,
    pub record_type: &'static str,
    pub session_id: &'a str,
    pub native_clock_id: &'a str,
    pub record_count: usize,
    pub event_count: usize,
    pub action_count: usize,
    pub closed_action_count: usize,
    pub native_receive_count: usize,
    pub native_return_count: usize,
    pub renderer_batch_count: usize,
    pub renderer_event_count: usize,
    pub artifact_byte_count: usize,
    pub dropped_event_count: u32,
    pub last_batch_sequence: u32,
    pub sealed: bool,
}
