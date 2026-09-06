use crate::profiling_wire::*;
use serde::Serialize;
use std::collections::BTreeMap;
use std::io::Write;

pub(crate) trait ProfileSink: Write + Send {}
impl<T: Write + Send> ProfileSink for T {}

pub(crate) struct ProfileWriter {
    sink: Option<Box<dyn ProfileSink>>,
    pub(crate) bytes_written: usize,
    pub(crate) records_written: usize,
    pub(crate) event_units_written: usize,
    pub(crate) dropped_event_count: u32,
    pub(crate) session_tainted: bool,
    loss_written: bool,
    seal_written: bool,
    accepting_new_actions: bool,
    pub(crate) actions: BTreeMap<String, ActionRecord>,
    pub(crate) native_receive_count: usize,
    pub(crate) native_return_count: usize,
    pub(crate) renderer_batch_count: usize,
    pub(crate) renderer_event_count: usize,
    pub(crate) last_batch_sequence: u32,
    sealed_receipt: Option<ProfileFinalizeReceipt>,
}

#[derive(Default)]
pub(crate) struct ActionRecord {
    pub(crate) renderer_clock_id: String,
    pub(crate) receive_recorded: bool,
    pub(crate) return_recorded: bool,
    pub(crate) closed: bool,
    return_reserved: bool,
    close_reserved: bool,
}

#[derive(Clone, Copy)]
pub(crate) enum ActionReservation {
    NativeReturn,
    ActionClose,
}

impl ProfileWriter {
    pub(crate) fn new(
        mut sink: Box<dyn ProfileSink>,
        header: &impl Serialize,
    ) -> Result<Self, &'static str> {
        let bytes = json_line(header)?;
        sink.write_all(&bytes)
            .map_err(|_| "profiling-header-write")?;
        Ok(Self {
            sink: Some(sink),
            bytes_written: bytes.len(),
            records_written: 1,
            event_units_written: 1,
            dropped_event_count: 0,
            session_tainted: false,
            loss_written: false,
            seal_written: false,
            accepting_new_actions: true,
            actions: BTreeMap::new(),
            native_receive_count: 0,
            native_return_count: 0,
            renderer_batch_count: 0,
            renderer_event_count: 0,
            last_batch_sequence: 0,
            sealed_receipt: None,
        })
    }

    pub(crate) fn reserve_action(
        &mut self,
        action_id: &str,
        renderer_clock_id: &str,
        reserve_return: bool,
    ) -> Result<(), &'static str> {
        if self.seal_written {
            return Err("profiling-session-sealed");
        }
        if let Some(action) = self.actions.get(action_id) {
            if action.renderer_clock_id != renderer_clock_id {
                return Err("profiling-action-clock-mismatch");
            }
            if reserve_return && action.receive_recorded {
                return Err("profiling-native-receive-duplicate");
            }
            if reserve_return && !action.return_reserved && !action.return_recorded {
                if !self.accepting_new_actions {
                    return Err("profiling-finalization-started");
                }
                self.ensure_capacity(1, 1, NATIVE_RETURN_BYTES)?;
                self.actions
                    .get_mut(action_id)
                    .expect("checked action must remain present")
                    .return_reserved = true;
            }
            return Ok(());
        }
        if !self.accepting_new_actions {
            return Err("profiling-finalization-started");
        }
        if self.actions.len() >= MAX_ACTIONS {
            return Err("profiling-action-capacity");
        }
        let add_events = 1 + usize::from(reserve_return);
        let add_bytes = ACTION_CLOSE_BYTES
            + if reserve_return {
                NATIVE_RETURN_BYTES
            } else {
                0
            };
        self.ensure_capacity(add_events, add_events, add_bytes)?;
        self.actions.insert(
            action_id.to_owned(),
            ActionRecord {
                renderer_clock_id: renderer_clock_id.to_owned(),
                return_reserved: reserve_return,
                close_reserved: true,
                ..ActionRecord::default()
            },
        );
        Ok(())
    }

    pub(crate) fn check_batch_sequence(&self, sequence: u32) -> Result<(), &'static str> {
        if self.seal_written {
            return Err("profiling-session-sealed");
        }
        let expected = self
            .last_batch_sequence
            .checked_add(1)
            .ok_or("profiling-batch-sequence-overflow")?;
        if sequence != expected {
            return Err("profiling-batch-sequence-invalid");
        }
        Ok(())
    }

    pub(crate) fn admit_batch_sequence(&mut self, sequence: u32) -> Result<(), &'static str> {
        if self.seal_written {
            return Err("profiling-session-sealed");
        }
        self.last_batch_sequence = sequence;
        Ok(())
    }

    pub(crate) fn write_unreserved(
        &mut self,
        value: &impl Serialize,
        event_units: usize,
    ) -> Result<usize, &'static str> {
        if self.seal_written {
            return Err("profiling-session-sealed");
        }
        let bytes = json_line(value)?;
        self.ensure_capacity(event_units, 1, bytes.len())?;
        self.write_bytes(&bytes, event_units)
    }

    pub(crate) fn write_action_reserved(
        &mut self,
        action_id: &str,
        reservation: ActionReservation,
        value: &impl Serialize,
    ) -> Result<usize, &'static str> {
        if self.seal_written {
            return Err("profiling-session-sealed");
        }
        let bytes = json_line(value)?;
        let max_bytes = match reservation {
            ActionReservation::NativeReturn => NATIVE_RETURN_BYTES,
            ActionReservation::ActionClose => ACTION_CLOSE_BYTES,
        };
        if bytes.len() > max_bytes {
            return Err("reserved-record-oversized");
        }
        let action = self
            .actions
            .get_mut(action_id)
            .ok_or("profiling-unknown-action")?;
        let reserved = match reservation {
            ActionReservation::NativeReturn => &mut action.return_reserved,
            ActionReservation::ActionClose => &mut action.close_reserved,
        };
        if !*reserved {
            return Err("profiling-reservation-missing");
        }
        *reserved = false;
        self.write_bytes(&bytes, 1)
    }

    pub(crate) fn record_loss(
        &mut self,
        session_id: &str,
        native_clock_id: &str,
        dropped: u32,
        error_code: &'static str,
    ) {
        if self.seal_written {
            return;
        }
        self.session_tainted = true;
        if dropped == 0 {
            self.sink = None;
            return;
        }
        let Some(cumulative_dropped) = self.dropped_event_count.checked_add(dropped) else {
            self.sink = None;
            return;
        };
        self.dropped_event_count = cumulative_dropped;
        if self.sink.is_none() {
            return;
        }
        let record = SessionLossRecord {
            schema_version: SCHEMA_VERSION,
            record_type: "session-loss",
            session_id,
            native_clock_id,
            dropped_event_count: self.dropped_event_count,
            error_code,
        };
        let Ok(bytes) = json_line(&record) else {
            self.sink = None;
            return;
        };
        if bytes.len() > SESSION_LOSS_BYTES {
            self.sink = None;
            return;
        }
        let result = if self.loss_written {
            self.ensure_capacity(1, 1, bytes.len())
                .and_then(|_| self.write_bytes(&bytes, 1))
        } else {
            self.write_bytes(&bytes, 1)
        };
        if result.is_ok() {
            self.loss_written = true;
        } else {
            // Without the latest cumulative snapshot the final loss total is not
            // independently recomputable, so this session must never seal.
            self.sink = None;
        }
    }

    pub(crate) fn finalize(
        &mut self,
        session_id: &str,
        native_clock_id: &str,
    ) -> ProfileFinalizeReceipt {
        self.accepting_new_actions = false;
        if let Some(receipt) = &self.sealed_receipt {
            return receipt.clone();
        }
        let open_action_count = self.open_action_count();
        if open_action_count > 0 {
            return self.finalize_receipt(
                session_id,
                false,
                open_action_count,
                Some("profiling-actions-open"),
            );
        }
        if self.sink.is_none() {
            return self.finalize_receipt(
                session_id,
                false,
                0,
                Some("profiling-writer-unavailable"),
            );
        }

        let record_count = self.records_written + 1;
        let event_count = self.event_units_written + 1;
        let action_count = self.actions.len();
        let closed_action_count = self.actions.values().filter(|action| action.closed).count();
        let mut artifact_byte_count = self.bytes_written;
        let mut encoded = Vec::new();
        for _ in 0..8 {
            let seal = SessionSealRecord {
                schema_version: SCHEMA_VERSION,
                record_type: "session-seal",
                session_id,
                native_clock_id,
                record_count,
                event_count,
                action_count,
                closed_action_count,
                native_receive_count: self.native_receive_count,
                native_return_count: self.native_return_count,
                renderer_batch_count: self.renderer_batch_count,
                renderer_event_count: self.renderer_event_count,
                artifact_byte_count,
                dropped_event_count: self.dropped_event_count,
                last_batch_sequence: self.last_batch_sequence,
                sealed: true,
            };
            encoded = match json_line(&seal) {
                Ok(bytes) => bytes,
                Err(code) => {
                    return self.finalize_receipt(session_id, false, 0, Some(code));
                }
            };
            let next = self.bytes_written.saturating_add(encoded.len());
            if next == artifact_byte_count {
                break;
            }
            artifact_byte_count = next;
        }
        if encoded.len() > SESSION_SEAL_BYTES
            || artifact_byte_count != self.bytes_written.saturating_add(encoded.len())
        {
            return self.finalize_receipt(session_id, false, 0, Some("profiling-seal-size"));
        }
        if let Some(sink) = self.sink.as_mut() {
            if sink.flush().is_err() {
                self.sink = None;
                self.session_tainted = true;
                return self.finalize_receipt(
                    session_id,
                    false,
                    0,
                    Some("profiling-pre-seal-flush"),
                );
            }
        }
        self.seal_written = true;
        if self.write_bytes(&encoded, 1).is_err() {
            self.seal_written = false;
            self.session_tainted = true;
            return self.finalize_receipt(session_id, false, 0, Some("profiling-seal-write"));
        }
        let receipt = self.finalize_receipt(session_id, true, 0, None);
        self.sealed_receipt = Some(receipt.clone());
        receipt
    }

    pub(crate) fn open_action_count(&self) -> usize {
        self.actions
            .values()
            .filter(|action| action.close_reserved || action.return_reserved)
            .count()
    }

    pub(crate) fn is_sealed(&self) -> bool {
        self.seal_written
    }

    pub(crate) fn accepts_new_actions(&self) -> bool {
        self.accepting_new_actions && !self.seal_written
    }

    pub(crate) fn reserved(&self) -> (usize, usize, usize) {
        let mut events = usize::from(!self.loss_written) + usize::from(!self.seal_written);
        let mut records = events;
        let mut bytes = if self.loss_written {
            0
        } else {
            SESSION_LOSS_BYTES
        } + if self.seal_written {
            0
        } else {
            SESSION_SEAL_BYTES
        };
        for action in self.actions.values() {
            if action.return_reserved {
                events += 1;
                records += 1;
                bytes += NATIVE_RETURN_BYTES;
            }
            if action.close_reserved {
                events += 1;
                records += 1;
                bytes += ACTION_CLOSE_BYTES;
            }
        }
        (events, records, bytes)
    }

    fn ensure_capacity(
        &self,
        add_events: usize,
        add_records: usize,
        add_bytes: usize,
    ) -> Result<(), &'static str> {
        let (reserved_events, reserved_records, reserved_bytes) = self.reserved();
        if self
            .event_units_written
            .checked_add(reserved_events)
            .and_then(|value| value.checked_add(add_events))
            .is_none_or(|value| value > MAX_ARTIFACT_EVENTS)
            || self
                .records_written
                .checked_add(reserved_records)
                .and_then(|value| value.checked_add(add_records))
                .is_none_or(|value| value > MAX_ARTIFACT_RECORDS)
            || self
                .bytes_written
                .checked_add(reserved_bytes)
                .and_then(|value| value.checked_add(add_bytes))
                .is_none_or(|value| value > MAX_ARTIFACT_BYTES)
        {
            return Err("profiling-artifact-capacity");
        }
        Ok(())
    }

    fn write_bytes(&mut self, bytes: &[u8], event_units: usize) -> Result<usize, &'static str> {
        let sink = self.sink.as_mut().ok_or("profiling-writer-unavailable")?;
        if sink.write_all(bytes).is_err() {
            self.sink = None;
            self.session_tainted = true;
            return Err("profiling-write-failed");
        }
        self.records_written += 1;
        self.event_units_written += event_units;
        self.bytes_written += bytes.len();
        Ok(bytes.len())
    }

    fn finalize_receipt(
        &self,
        session_id: &str,
        sealed: bool,
        open_action_count: usize,
        error_code: Option<&str>,
    ) -> ProfileFinalizeReceipt {
        ProfileFinalizeReceipt {
            session_id: session_id.to_owned(),
            sealed,
            open_action_count,
            record_count: self.records_written,
            event_count: self.event_units_written,
            artifact_byte_count: self.bytes_written,
            dropped_event_count: self.dropped_event_count,
            last_batch_sequence: self.last_batch_sequence,
            error_code: error_code.map(str::to_owned),
        }
    }
}

pub(crate) fn json_line(value: &impl Serialize) -> Result<Vec<u8>, &'static str> {
    let mut bytes = serde_json::to_vec(value).map_err(|_| "profiling-json-serialize")?;
    bytes.push(b'\n');
    Ok(bytes)
}
