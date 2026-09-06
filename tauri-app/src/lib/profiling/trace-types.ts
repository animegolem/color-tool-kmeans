import type { AnalysisResult } from '../stores/analysis';
import type {
  ProfileAnalysisConfigRecord,
  ProfileAppendValidationErrorCode,
  ProfileAppendReceipt,
  ProfileFinalizeErrorCode,
  ProfileFinalizeReceipt,
  ProfileInputRecord,
  ProfileObservedOutcome,
  ProfileRenderConfigRecord,
  ProfileRendererEvent,
  ProfileStatus,
} from '../bridges/profiling';

export type ProfileControl =
  | 'clusters'
  | 'quality'
  | 'ignoreTopN'
  | 'mergeThreshold'
  | 'snapToReal';
export type ProfileFigure = 'histogram' | 'polar' | 'hue-lightness';
export type ProfileCancellationReason =
  | 'input-superseded'
  | 'debounce-replaced'
  | 'source-replaced'
  | 'view-unmounted';
export type ProfileFailureReason =
  | 'native-invoke'
  | 'invalid-response'
  | 'accepted-error';
export type ProfileUnverifiedReason =
  | 'result-association-unverified'
  | 'hidden-before-dom-raf2'
  | 'dom-figure-mismatch'
  | 'trace-dropped'
  | 'trace-flush-failed'
  | 'no-enabled-figures'
  | 'input-target-invalid'
  | 'input-value-unresolved'
  | 'session-lost';

export interface ProfileActionRef {
  readonly sessionId: string;
  readonly actionId: string;
  readonly rendererClockId: string;
}

export interface ProfileNativeRequestSettings {
  clusters: number;
  quality: number;
  ignoreTopN: number;
  mergeThreshold: number;
  snapToReal: boolean;
  minLum: number;
  tolerance: number;
  maxIterations: number;
  seed: number;
  maxSamples: number;
}

export interface ProfileAnalysisContext {
  readonly action: ProfileActionRef;
  readonly expectedSourcePath: string;
  readonly nativeRequest: ProfileNativeRequestSettings;
}

export interface ProfileInvocationContext {
  sessionId: string;
  actionId: string;
  rendererClockId: string;
}

export interface ProfileAcceptedResultContext {
  readonly analysis: ProfileAnalysisContext;
  readonly result: AnalysisResult;
  readonly resultObservationId: string;
}

export interface ProfileRenderExtras {
  showSimplifiedTones: boolean;
  frameLabel: 'timestamp' | 'frame';
  stripMode: 'filmstrip' | 'barcode';
  compactSidebars: boolean;
}

export interface ProfileResolvedSnapshot {
  imageRuntimeId: string;
  expectedSourcePath: string;
  analysisConfig: ProfileAnalysisConfigRecord;
  renderConfig: ProfileRenderConfigRecord;
}

export interface ProfileUnavailableSnapshot {
  imageRuntimeId: string;
  expectedSourcePath: string;
  renderConfig: ProfileRenderConfigRecord;
  reasonCode: 'input-target-invalid';
}

export interface ProfilePersistenceResult {
  ok: boolean;
  receipt: ProfileAppendReceipt | null;
  errorCode:
    | ProfileAppendValidationErrorCode
    | 'trace-flush-failed'
    | 'trace-dropped'
    | 'session-lost'
    | null;
}

export type ProfileFinishErrorCode =
  | ProfileFinalizeErrorCode
  | 'profile-finalize-invoke-failed'
  | 'profile-finalize-receipt-invalid'
  | 'renderer-actions-open'
  | 'renderer-persistence-missing'
  | 'renderer-persistence-failed'
  | 'renderer-trace-dropped';

export type ProfileFinishPhase =
  | 'ready'
  | 'in-progress'
  | 'renderer-pending'
  | 'native-pending'
  | 'sealed'
  | 'sealed-with-loss'
  | 'continuity-unverified'
  | 'failed';

export interface ProfileFinishState {
  phase: ProfileFinishPhase;
  rendererOpenCount: number;
  nativeOpenCount: number;
  errorCode: ProfileFinishErrorCode | null;
  receipt: ProfileFinalizeReceipt | null;
  retryable: boolean;
}

export interface ProfileActionState {
  ref: ProfileActionRef;
  input: ProfileInputRecord;
  imageRuntimeId: string;
  expectedSourcePath: string;
  analysisConfig?: ProfileAnalysisConfigRecord;
  analysisConfigUnavailableReason?: 'input-target-invalid';
  renderConfig?: ProfileRenderConfigRecord;
  requestKey?: string;
  nativeRequest?: ProfileNativeRequestSettings;
  events: ProfileRendererEvent[];
  eventBytes: number;
  droppedEvents: number;
  admitted: boolean;
  outcome?: ProfileObservedOutcome;
  persistence?: Promise<ProfilePersistenceResult>;
  acceptedResult?: AnalysisResult;
  generatedFigures: Set<ProfileFigure>;
  enabledFigures?: Set<ProfileFigure>;
  checks: Record<string, boolean>;
  measurements: Record<string, number>;
  invokeStartMs?: number;
  rafHandle?: number;
  rafResolve?: (ran: boolean) => void;
  visibilityCleanup?: () => void;
}

export interface RendererTraceOptions {
  status: ProfileStatus;
  now?: () => number;
  nextId?: () => string;
  append?: (
    batch: import('../bridges/profiling').ProfileRendererBatch,
    status: ProfileStatus
  ) => Promise<ProfileAppendReceipt>;
  finalize?: (sessionId: string) => Promise<ProfileFinalizeReceipt>;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  visibilityState?: () => DocumentVisibilityState;
  subscribeVisibility?: (callback: () => void) => () => void;
}

export interface ProfileDomInput {
  enabledFigures: readonly ProfileFigure[];
  activeImageRuntimeId: () => string | null;
  currentResult: () => AnalysisResult | null;
  currentAnalysisConfig: () => ProfileAnalysisConfigRecord;
  currentRenderConfig: () => ProfileRenderConfigRecord;
  settle: () => Promise<void>;
  domFigureCounts: () => Partial<Record<ProfileFigure, number>>;
}
