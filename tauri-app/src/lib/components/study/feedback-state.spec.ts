import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_KINDS,
  getFeedbackSemantics,
  validateFeedbackState,
  type FeedbackProvenance,
  type FeedbackState,
} from './feedback-state';

const requestProvenance: FeedbackProvenance = {
  sourceLabel: 'New study frame',
  settingsLabel: '12 colors · hue order',
};

const visibleResultProvenance: FeedbackProvenance = {
  sourceLabel: 'Earlier study frame',
  settingsLabel: '8 colors · share order',
};

const validStates: readonly FeedbackState[] = [
  {
    kind: 'idle',
    title: 'Idle',
    message: 'No illustrative request has started.',
  },
  {
    kind: 'empty',
    title: 'Empty',
    message: 'No illustrative material is selected.',
  },
  {
    kind: 'pending',
    title: 'Pending',
    message: 'An illustrative request is pending.',
    requestProvenance,
  },
  {
    kind: 'pending',
    title: 'Pending with previous result',
    message: 'The earlier result remains visible.',
    requestProvenance,
    visibleResultProvenance,
  },
  {
    kind: 'previous',
    title: 'Previous',
    message: 'The visible result is not current.',
    visibleResultProvenance,
  },
  {
    kind: 'error',
    title: 'Error',
    message: 'The illustrative request did not finish.',
    requestProvenance,
    visibleResultProvenance,
  },
  {
    kind: 'cancelled',
    title: 'Cancelled',
    message: 'A caller reported cancellation.',
    requestProvenance,
  },
  {
    kind: 'saving',
    title: 'Saving',
    message: 'A caller reported an active save.',
    requestProvenance,
    visibleResultProvenance,
  },
  {
    kind: 'saved',
    title: 'Saved',
    message: 'A caller reported a completed save.',
    visibleResultProvenance,
  },
];

describe('feedback-state contract', () => {
  it('accepts every discriminant and a pending request with a different visible result', () => {
    for (const state of validStates) {
      expect(validateFeedbackState(state), state.title).toEqual([]);
    }

    expect(new Set(validStates.map((state) => state.kind))).toEqual(
      new Set(FEEDBACK_KINDS)
    );

    const pendingWithPrevious = validStates[3];
    expect(pendingWithPrevious.kind).toBe('pending');
    if (pendingWithPrevious.kind !== 'pending') return;

    expect(pendingWithPrevious.requestProvenance).not.toEqual(
      pendingWithPrevious.visibleResultProvenance
    );
    expect(pendingWithPrevious.requestProvenance.sourceLabel).toBe(
      'New study frame'
    );
    expect(pendingWithPrevious.visibleResultProvenance?.sourceLabel).toBe(
      'Earlier study frame'
    );
  });

  it('defines deliberate busy, status, and error announcement semantics', () => {
    expect(getFeedbackSemantics(validStates[0])).toEqual({
      busy: false,
      announcementRole: undefined,
      announcementLive: undefined,
    });
    expect(getFeedbackSemantics(validStates[2])).toEqual({
      busy: true,
      announcementRole: 'status',
      announcementLive: 'polite',
    });
    expect(getFeedbackSemantics(validStates[5])).toEqual({
      busy: false,
      announcementRole: 'alert',
      announcementLive: 'assertive',
    });
    expect(getFeedbackSemantics(validStates[7]).busy).toBe(true);

    for (const state of validStates.slice(1)) {
      expect(getFeedbackSemantics(state).announcementRole).toBeDefined();
    }
  });

  it.each([
    {
      name: 'pending without current request provenance',
      value: {
        kind: 'pending',
        title: 'Pending',
        message: 'Waiting.',
      },
      path: 'requestProvenance',
    },
    {
      name: 'saving without current request provenance',
      value: {
        kind: 'saving',
        title: 'Saving',
        message: 'Saving.',
      },
      path: 'requestProvenance',
    },
    {
      name: 'previous without visible-result provenance',
      value: {
        kind: 'previous',
        title: 'Previous',
        message: 'Older result.',
      },
      path: 'visibleResultProvenance',
    },
    {
      name: 'saved without visible-result provenance',
      value: {
        kind: 'saved',
        title: 'Saved',
        message: 'Saved.',
      },
      path: 'visibleResultProvenance',
    },
    {
      name: 'previous that invents a current request',
      value: {
        kind: 'previous',
        title: 'Previous',
        message: 'Older result.',
        requestProvenance,
        visibleResultProvenance,
      },
      path: 'requestProvenance',
    },
    {
      name: 'idle that claims a visible result',
      value: {
        kind: 'idle',
        title: 'Idle',
        message: 'Idle.',
        visibleResultProvenance,
      },
      path: 'visibleResultProvenance',
    },
    {
      name: 'pending with an incomplete visible-result record',
      value: {
        kind: 'pending',
        title: 'Pending',
        message: 'Waiting.',
        requestProvenance,
        visibleResultProvenance: { sourceLabel: 'Earlier frame' },
      },
      path: 'visibleResultProvenance.settingsLabel',
    },
  ])('rejects $name', ({ value, path }) => {
    expect(validateFeedbackState(value)).toEqual(
      expect.arrayContaining([expect.objectContaining({ path })])
    );
  });

  it('rejects invalid action descriptors, duplicate keys, and progress claims', () => {
    const issues = validateFeedbackState({
      kind: 'error',
      title: 'Error',
      message: 'Illustrative error.',
      progressPercent: 50,
      actions: [
        { key: 'dismiss', label: '', emphasis: 'urgent' },
        { key: 'dismiss', label: 'Dismiss' },
      ],
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'progressPercent' }),
        expect.objectContaining({ path: 'actions[0].label' }),
        expect.objectContaining({ path: 'actions[0].emphasis' }),
        expect.objectContaining({ path: 'actions[1].key' }),
      ])
    );
  });

  it('rejects unsupported kinds and non-object input', () => {
    expect(validateFeedbackState(null)).toEqual([
      { path: 'state', message: 'must be an object' },
    ]);
    expect(
      validateFeedbackState({
        kind: 'retrying',
        title: 'Retrying',
        message: 'Not a supported state.',
      })
    ).toEqual([{ path: 'kind', message: 'must be a supported feedback kind' }]);
  });
});
