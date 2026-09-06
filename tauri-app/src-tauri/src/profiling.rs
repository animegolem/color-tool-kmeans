use crate::profiling_validation::{
    unavailable_analysis_config, valid_session_id, valid_token, validate_batch,
    validate_batch_identifiers,
};
use crate::profiling_wire::*;
pub use crate::profiling_wire::{
    ProfileFinalizeReceipt, ProfileFinalizeRequest, ProfileInvocationContext, ProfileRendererBatch,
    ProfileStatus, ProfileWriteReceipt, PROFILE_SESSION_ENV,
};
use crate::profiling_writer::{ActionReservation, ProfileWriter};
use std::collections::BTreeSet;
use std::ffi::OsString;
use std::fs::{self, OpenOptions};
use std::path::Path;
use std::sync::Mutex;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::State;

pub struct ProfileState {
    session: Option<ProfileSession>,
    error_code: Option<&'static str>,
}

struct ProfileSession {
    session_id: String,
    clock_id: String,
    origin: Instant,
    writer: Mutex<ProfileWriter>,
    unavailable_actions: Mutex<BTreeSet<String>>,
}

#[derive(Clone, Debug)]
pub struct NativeProfileSpan {
    action_id: String,
    renderer_clock_id: String,
    receive_ns: u128,
}

impl ProfileState {
    pub fn from_launch(cache_dir: &Path, value: Option<OsString>) -> Self {
        let Some(value) = value else {
            return Self::disabled(None);
        };
        let Some(session_id) = value.to_str() else {
            return Self::disabled(Some("profiling-invalid-session"));
        };
        if !valid_session_id(session_id) {
            return Self::disabled(Some("profiling-invalid-session"));
        }
        match ProfileSession::create(cache_dir, session_id) {
            Ok(session) => Self {
                session: Some(session),
                error_code: None,
            },
            Err(code) => Self::disabled(Some(code)),
        }
    }

    fn disabled(error_code: Option<&'static str>) -> Self {
        Self {
            session: None,
            error_code,
        }
    }

    pub fn status(&self) -> ProfileStatus {
        let (session_id, clock_id, native_monotonic_ns, wall_unix_ms) =
            if let Some(session) = &self.session {
                (
                    Some(session.session_id.clone()),
                    Some(session.clock_id.clone()),
                    Some(session.origin.elapsed().as_nanos().to_string()),
                    Some(wall_unix_ms()),
                )
            } else {
                (None, None, None, None)
            };
        ProfileStatus {
            enabled: self.session.is_some(),
            session_id,
            clock_id,
            native_monotonic_ns,
            wall_unix_ms,
            max_batch_events: MAX_RENDERER_BATCH_EVENTS,
            max_batch_bytes: MAX_RENDERER_BATCH_BYTES,
            max_event_bytes: MAX_RENDERER_EVENT_BYTES,
            error_code: self.error_code.map(str::to_owned),
        }
    }

    pub fn begin_native(
        &self,
        context: Option<&ProfileInvocationContext>,
    ) -> Option<NativeProfileSpan> {
        let session = self.session.as_ref()?;
        let context = context?;
        if context.session_id != session.session_id {
            return None;
        }
        let mut writer = session.writer.lock().ok()?;
        if writer.is_sealed() {
            return None;
        }
        if !valid_token(&context.action_id, 128) || !valid_token(&context.renderer_clock_id, 128) {
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    1,
                    "invalid-native-identity",
                );
            }
            return None;
        }
        if session
            .unavailable_actions
            .lock()
            .map_or(true, |actions| actions.contains(&context.action_id))
        {
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    1,
                    "native-after-unavailable",
                );
            }
            return None;
        }
        if let Err(code) =
            writer.reserve_action(&context.action_id, &context.renderer_clock_id, true)
        {
            if writer.accepts_new_actions()
                && !matches!(
                    code,
                    "profiling-finalization-started" | "profiling-session-sealed"
                )
            {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    1,
                    "native-admission-refused",
                );
            }
            return None;
        }
        let receive_ns = session.origin.elapsed().as_nanos();
        let record = NativeEventRecord {
            schema_version: SCHEMA_VERSION,
            record_type: "native-event",
            session_id: &session.session_id,
            action_id: &context.action_id,
            renderer_clock_id: &context.renderer_clock_id,
            native_clock_id: &session.clock_id,
            phase: "receive",
            native_monotonic_ns: receive_ns.to_string(),
            native_aggregate_ns: None,
            outcome: None,
            error_code: None,
        };
        let written = writer.write_unreserved(&record, 1).is_ok();
        if let Some(action) = writer.actions.get_mut(&context.action_id) {
            action.receive_recorded = written;
        }
        if written {
            writer.native_receive_count += 1;
        } else {
            writer.record_loss(
                &session.session_id,
                &session.clock_id,
                1,
                "native-receive-write",
            );
        }
        Some(NativeProfileSpan {
            action_id: context.action_id.clone(),
            renderer_clock_id: context.renderer_clock_id.clone(),
            receive_ns,
        })
    }

    pub fn finish_native(
        &self,
        span: Option<NativeProfileSpan>,
        return_ns: Option<u128>,
        outcome: &'static str,
        error_code: Option<&'static str>,
    ) {
        let (Some(session), Some(span)) = (&self.session, span) else {
            return;
        };
        let return_ns = return_ns.unwrap_or_else(|| session.origin.elapsed().as_nanos());
        let Ok(mut writer) = session.writer.lock() else {
            return;
        };
        if writer.is_sealed() {
            return;
        }
        let record = NativeEventRecord {
            schema_version: SCHEMA_VERSION,
            record_type: "native-event",
            session_id: &session.session_id,
            action_id: &span.action_id,
            renderer_clock_id: &span.renderer_clock_id,
            native_clock_id: &session.clock_id,
            phase: "return",
            native_monotonic_ns: return_ns.to_string(),
            native_aggregate_ns: Some(return_ns.saturating_sub(span.receive_ns).to_string()),
            outcome: Some(outcome),
            error_code,
        };
        let written =
            writer.write_action_reserved(&span.action_id, ActionReservation::NativeReturn, &record);
        if let Some(action) = writer.actions.get_mut(&span.action_id) {
            action.return_recorded = written.is_ok();
        }
        if written.is_ok() {
            writer.native_return_count += 1;
        } else {
            writer.record_loss(
                &session.session_id,
                &session.clock_id,
                1,
                "native-return-write",
            );
        }
    }

    pub fn capture_native_end(&self) -> Option<u128> {
        self.session
            .as_ref()
            .map(|session| session.origin.elapsed().as_nanos())
    }

    pub fn append_batch(
        &self,
        batch: ProfileRendererBatch,
    ) -> Result<ProfileWriteReceipt, &'static str> {
        let session = self.session.as_ref().ok_or("profiling-disabled")?;
        if batch.session_id != session.session_id {
            return Err("profiling-session-mismatch");
        }
        let mut writer = session.writer.lock().map_err(|_| "profiling-lock-failed")?;
        if writer.is_sealed() {
            return Err("profiling-session-sealed");
        }
        if let Err(code) = validate_batch_identifiers(&batch) {
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    event_count(&batch),
                    "invalid-batch-identity",
                );
            }
            return Err(code);
        }
        let validation_error = validate_batch(&batch).err();
        if let Err(code) = writer.check_batch_sequence(batch.batch_sequence) {
            if code == "profiling-session-sealed" {
                return Err(code);
            }
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    event_count(&batch),
                    "batch-sequence",
                );
            }
            return Err("profiling-batch-sequence-invalid");
        }
        if unavailable_analysis_config(&batch) && writer.actions.contains_key(&batch.action_id) {
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    event_count(&batch),
                    "unavailable-native-history",
                );
            }
            return Err("profiling-unavailable-native-history");
        }
        if let Err(code) =
            writer.reserve_action(&batch.action_id, &batch.renderer_process_clock_id, false)
        {
            if writer.accepts_new_actions()
                && !matches!(
                    code,
                    "profiling-finalization-started" | "profiling-session-sealed"
                )
            {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    event_count(&batch),
                    "batch-admission-refused",
                );
            }
            return Err(code);
        }
        if writer
            .actions
            .get(&batch.action_id)
            .is_some_and(|action| action.closed)
        {
            if writer.accepts_new_actions() {
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    event_count(&batch),
                    "duplicate-close",
                );
            }
            return Err("profiling-action-already-closed");
        }
        writer.admit_batch_sequence(batch.batch_sequence)?;

        let mut accepted_count = 0;
        let mut accepted_byte_count = 0;
        let mut dropped_count = batch.renderer_dropped_event_count;
        let mut outcome_accepted = false;
        let mut receipt_error = validation_error;
        let unavailable = unavailable_analysis_config(&batch);
        if dropped_count > 0 {
            writer.record_loss(
                &session.session_id,
                &session.clock_id,
                dropped_count,
                "renderer-drop",
            );
        }
        if receipt_error.is_none() {
            let record = RendererBatchRecord {
                schema_version: SCHEMA_VERSION,
                record_type: "renderer-batch",
                batch: &batch,
            };
            match writer.write_unreserved(&record, batch.events.len()) {
                Ok(bytes) => {
                    accepted_count = event_count(&batch);
                    accepted_byte_count = u32::try_from(bytes).unwrap_or(u32::MAX);
                    outcome_accepted = true;
                    writer.renderer_batch_count += 1;
                    writer.renderer_event_count += batch.events.len();
                }
                Err(code) => {
                    let dropped = event_count(&batch);
                    dropped_count = dropped_count.saturating_add(dropped);
                    receipt_error = Some(code);
                    writer.record_loss(&session.session_id, &session.clock_id, dropped, code);
                }
            }
        } else {
            let dropped = event_count(&batch);
            dropped_count = dropped_count.saturating_add(dropped);
            writer.record_loss(
                &session.session_id,
                &session.clock_id,
                dropped,
                receipt_error.unwrap_or("invalid-batch"),
            );
        }

        let (native_receive_recorded, native_return_recorded) = writer
            .actions
            .get(&batch.action_id)
            .map(|action| (action.receive_recorded, action.return_recorded))
            .unwrap_or((false, false));
        let close = ActionCloseRecord {
            schema_version: SCHEMA_VERSION,
            record_type: "action-close",
            session_id: &session.session_id,
            batch_sequence: batch.batch_sequence,
            action_id: &batch.action_id,
            accepted_event_count: accepted_count,
            accepted_byte_count,
            dropped_event_count: dropped_count,
            observed_outcome_persisted: outcome_accepted,
            native_receive_recorded,
            native_return_recorded,
            session_tainted: writer.session_tainted,
            closed: true,
        };
        let close_result =
            writer.write_action_reserved(&batch.action_id, ActionReservation::ActionClose, &close);
        if let Some(action) = writer.actions.get_mut(&batch.action_id) {
            action.closed = true;
        }
        if close_result.is_err() {
            dropped_count = dropped_count.saturating_add(1);
            receipt_error = Some("action-close-write");
            writer.record_loss(
                &session.session_id,
                &session.clock_id,
                1,
                "action-close-write",
            );
        }
        if outcome_accepted && close_result.is_ok() && unavailable {
            if let Ok(mut actions) = session.unavailable_actions.lock() {
                actions.insert(batch.action_id.clone());
            } else {
                dropped_count = dropped_count.saturating_add(1);
                receipt_error = Some("unavailable-state-lock");
                writer.record_loss(
                    &session.session_id,
                    &session.clock_id,
                    1,
                    "unavailable-state-lock",
                );
            }
        }
        Ok(ProfileWriteReceipt {
            session_id: session.session_id.clone(),
            batch_sequence: batch.batch_sequence,
            action_id: batch.action_id,
            accepted_count,
            accepted_byte_count,
            dropped_count,
            outcome_accepted,
            native_receive_recorded,
            native_return_recorded,
            session_tainted: writer.session_tainted,
            closed: close_result.is_ok(),
            error_code: receipt_error.map(str::to_owned),
        })
    }

    pub fn finalize(
        &self,
        request: ProfileFinalizeRequest,
    ) -> Result<ProfileFinalizeReceipt, &'static str> {
        let session = self.session.as_ref().ok_or("profiling-disabled")?;
        if request.session_id != session.session_id {
            return Err("profiling-session-mismatch");
        }
        let mut writer = session.writer.lock().map_err(|_| "profiling-lock-failed")?;
        Ok(writer.finalize(&session.session_id, &session.clock_id))
    }

    #[cfg(test)]
    pub(crate) fn record_test_loss(&self, dropped: u32, error_code: &'static str) {
        let Some(session) = &self.session else { return };
        let Ok(mut writer) = session.writer.lock() else {
            return;
        };
        writer.record_loss(&session.session_id, &session.clock_id, dropped, error_code);
    }
}

impl ProfileSession {
    fn create(cache_dir: &Path, session_id: &str) -> Result<Self, &'static str> {
        let profile_dir = cache_dir.join(PROFILE_DIRECTORY);
        fs::create_dir_all(&profile_dir).map_err(|_| "profiling-directory-create")?;
        let metadata =
            fs::symlink_metadata(&profile_dir).map_err(|_| "profiling-directory-metadata")?;
        if metadata.file_type().is_symlink() || !metadata.is_dir() {
            return Err("profiling-directory-unsafe");
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&profile_dir, fs::Permissions::from_mode(0o700))
                .map_err(|_| "profiling-directory-permissions")?;
        }
        let artifact_path = profile_dir.join(format!("profile-{session_id}.jsonl"));
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let file = options
            .open(artifact_path)
            .map_err(|_| "profiling-artifact-exclusive-create")?;
        let started_ns = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let clock_id = format!("native-{}-{started_ns:x}", std::process::id());
        let header = TraceSessionRecord {
            schema_version: SCHEMA_VERSION,
            record_type: "trace-session",
            session_id,
            native_clock_id: &clock_id,
            native_monotonic_ns: "0",
            wall_unix_ms: wall_unix_ms(),
            limits: TraceLimits {
                max_actions: MAX_ACTIONS,
                max_artifact_events: MAX_ARTIFACT_EVENTS,
                max_artifact_records: MAX_ARTIFACT_RECORDS,
                max_artifact_bytes: MAX_ARTIFACT_BYTES,
                max_renderer_batch_events: MAX_RENDERER_BATCH_EVENTS,
                max_renderer_batch_bytes: MAX_RENDERER_BATCH_BYTES,
                max_renderer_event_bytes: MAX_RENDERER_EVENT_BYTES,
            },
        };
        let writer = ProfileWriter::new(Box::new(file), &header)?;
        Ok(Self {
            session_id: session_id.to_owned(),
            clock_id,
            origin: Instant::now(),
            writer: Mutex::new(writer),
            unavailable_actions: Mutex::new(BTreeSet::new()),
        })
    }
}

#[tauri::command]
pub fn profile_status(state: State<'_, ProfileState>) -> ProfileStatus {
    state.status()
}

#[tauri::command]
pub fn profile_append_batch(
    batch: ProfileRendererBatch,
    state: State<'_, ProfileState>,
) -> Result<ProfileWriteReceipt, String> {
    state.append_batch(batch).map_err(str::to_owned)
}

#[tauri::command]
pub fn profile_finalize(
    req: ProfileFinalizeRequest,
    state: State<'_, ProfileState>,
) -> Result<ProfileFinalizeReceipt, String> {
    state.finalize(req).map_err(str::to_owned)
}

fn event_count(batch: &ProfileRendererBatch) -> u32 {
    u32::try_from(batch.events.len()).unwrap_or(u32::MAX)
}

fn wall_unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .try_into()
        .unwrap_or(u64::MAX)
}
