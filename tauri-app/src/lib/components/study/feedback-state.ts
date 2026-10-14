export const FEEDBACK_KINDS = [
  'idle',
  'empty',
  'pending',
  'previous',
  'error',
  'cancelled',
  'saving',
  'saved',
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
export type FeedbackActionEmphasis = 'normal' | 'primary' | 'quiet';

export interface FeedbackActionDescriptor {
  key: string;
  label: string;
  emphasis?: FeedbackActionEmphasis;
}

export interface FeedbackProvenance {
  sourceLabel: string;
  settingsLabel: string;
}

interface FeedbackBase<K extends FeedbackKind> {
  kind: K;
  title: string;
  message: string;
  actions?: readonly FeedbackActionDescriptor[];
}

interface NoProvenance {
  requestProvenance?: never;
  visibleResultProvenance?: never;
}

interface RequestWithOptionalVisibleResult {
  requestProvenance: FeedbackProvenance;
  visibleResultProvenance?: FeedbackProvenance;
}

interface VisibleResultOnly {
  requestProvenance?: never;
  visibleResultProvenance: FeedbackProvenance;
}

interface OptionalProvenance {
  requestProvenance?: FeedbackProvenance;
  visibleResultProvenance?: FeedbackProvenance;
}

export type FeedbackState =
  | (FeedbackBase<'idle'> & NoProvenance)
  | (FeedbackBase<'empty'> & NoProvenance)
  | (FeedbackBase<'pending'> & RequestWithOptionalVisibleResult)
  | (FeedbackBase<'previous'> & VisibleResultOnly)
  | (FeedbackBase<'error'> & OptionalProvenance)
  | (FeedbackBase<'cancelled'> & OptionalProvenance)
  | (FeedbackBase<'saving'> & RequestWithOptionalVisibleResult)
  | (FeedbackBase<'saved'> & VisibleResultOnly);

export interface FeedbackSemantics {
  busy: boolean;
  announcementRole: 'status' | 'alert' | undefined;
  announcementLive: 'polite' | 'assertive' | undefined;
}

export interface FeedbackValidationIssue {
  path: string;
  message: string;
}

type ProvenanceRequirement = 'required' | 'optional' | 'forbidden';

interface ProvenancePolicy {
  request: ProvenanceRequirement;
  visibleResult: ProvenanceRequirement;
}

const PROVENANCE_POLICIES = {
  idle: { request: 'forbidden', visibleResult: 'forbidden' },
  empty: { request: 'forbidden', visibleResult: 'forbidden' },
  pending: { request: 'required', visibleResult: 'optional' },
  previous: { request: 'forbidden', visibleResult: 'required' },
  error: { request: 'optional', visibleResult: 'optional' },
  cancelled: { request: 'optional', visibleResult: 'optional' },
  saving: { request: 'required', visibleResult: 'optional' },
  saved: { request: 'forbidden', visibleResult: 'required' },
} as const satisfies Record<FeedbackKind, ProvenancePolicy>;

const ACTION_EMPHASES = new Set<FeedbackActionEmphasis>([
  'normal',
  'primary',
  'quiet',
]);

const PROHIBITED_PROGRESS_KEYS = [
  'progress',
  'progressPercent',
  'percent',
] as const;

function unreachable(value: never): never {
  throw new Error(`Unhandled feedback state: ${JSON.stringify(value)}`);
}

export function getFeedbackSemantics(state: FeedbackState): FeedbackSemantics {
  switch (state.kind) {
    case 'idle':
      return {
        busy: false,
        announcementRole: undefined,
        announcementLive: undefined,
      };
    case 'pending':
    case 'saving':
      return {
        busy: true,
        announcementRole: 'status',
        announcementLive: 'polite',
      };
    case 'error':
      return {
        busy: false,
        announcementRole: 'alert',
        announcementLive: 'assertive',
      };
    case 'empty':
    case 'previous':
    case 'cancelled':
    case 'saved':
      return {
        busy: false,
        announcementRole: 'status',
        announcementLive: 'polite',
      };
    default:
      return unreachable(state);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return (
    typeof value === 'string' &&
    (FEEDBACK_KINDS as readonly string[]).includes(value)
  );
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function requireText(
  value: unknown,
  path: string,
  issues: FeedbackValidationIssue[]
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({ path, message: 'must be a non-empty string' });
  }
}

function validateProvenance(
  value: unknown,
  path: string,
  issues: FeedbackValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be a provenance record' });
    return;
  }

  requireText(value.sourceLabel, `${path}.sourceLabel`, issues);
  requireText(value.settingsLabel, `${path}.settingsLabel`, issues);
}

function validateProvenanceField(
  record: Record<string, unknown>,
  key: 'requestProvenance' | 'visibleResultProvenance',
  requirement: ProvenanceRequirement,
  issues: FeedbackValidationIssue[]
): void {
  const present = hasOwn(record, key);

  if (requirement === 'required' && !present) {
    issues.push({ path: key, message: 'is required for this state' });
    return;
  }

  if (requirement === 'forbidden' && present) {
    issues.push({ path: key, message: 'is not allowed for this state' });
    return;
  }

  if (present) validateProvenance(record[key], key, issues);
}

function validateActions(
  value: unknown,
  issues: FeedbackValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({ path: 'actions', message: 'must be an array' });
    return;
  }

  const keys = new Set<string>();
  value.forEach((action, index) => {
    const path = `actions[${index}]`;
    if (!isRecord(action)) {
      issues.push({ path, message: 'must be an action descriptor' });
      return;
    }

    requireText(action.key, `${path}.key`, issues);
    requireText(action.label, `${path}.label`, issues);

    if (typeof action.key === 'string' && action.key.trim().length > 0) {
      if (keys.has(action.key)) {
        issues.push({ path: `${path}.key`, message: 'must be unique' });
      }
      keys.add(action.key);
    }

    if (
      action.emphasis !== undefined &&
      !ACTION_EMPHASES.has(action.emphasis as FeedbackActionEmphasis)
    ) {
      issues.push({
        path: `${path}.emphasis`,
        message: 'must be normal, primary, or quiet',
      });
    }
  });
}

export function validateFeedbackState(
  value: unknown
): readonly FeedbackValidationIssue[] {
  const issues: FeedbackValidationIssue[] = [];
  if (!isRecord(value)) {
    return [{ path: 'state', message: 'must be an object' }];
  }

  if (!isFeedbackKind(value.kind)) {
    return [{ path: 'kind', message: 'must be a supported feedback kind' }];
  }

  requireText(value.title, 'title', issues);
  requireText(value.message, 'message', issues);

  if (hasOwn(value, 'actions')) validateActions(value.actions, issues);

  const policy = PROVENANCE_POLICIES[value.kind];
  validateProvenanceField(value, 'requestProvenance', policy.request, issues);
  validateProvenanceField(
    value,
    'visibleResultProvenance',
    policy.visibleResult,
    issues
  );

  for (const key of PROHIBITED_PROGRESS_KEYS) {
    if (hasOwn(value, key)) {
      issues.push({
        path: key,
        message: 'is not part of the presentation-only contract',
      });
    }
  }

  return issues;
}
