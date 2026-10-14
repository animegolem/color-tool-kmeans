import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import FeedbackState from './FeedbackState.svelte';
import type { FeedbackState as FeedbackStateModel } from './feedback-state';

const pendingWithPrevious: FeedbackStateModel = {
  kind: 'pending',
  title: 'New request pending',
  message: 'The earlier illustrative result remains visible.',
  requestProvenance: {
    sourceLabel: 'New source frame',
    settingsLabel: '12 colors · hue order',
  },
  visibleResultProvenance: {
    sourceLabel: 'Earlier source frame',
    settingsLabel: '8 colors · share order',
  },
};

describe('FeedbackState', () => {
  it('renders busy status semantics and keeps request/result provenance separate', () => {
    const { body } = render(FeedbackState, {
      props: { state: pendingWithPrevious },
    });

    expect(body).toContain('data-feedback-kind="pending"');
    expect(body).toContain('aria-busy="true"');
    expect(body).toContain('role="status"');
    expect(body).toContain('aria-live="polite"');
    expect(body).toContain('data-feedback-provenance="request"');
    expect(body).toContain('Current request source');
    expect(body).toContain('New source frame');
    expect(body).toContain('12 colors · hue order');
    expect(body).toContain('data-feedback-provenance="visible-result"');
    expect(body).toContain('Visible result source');
    expect(body).toContain('Earlier source frame');
    expect(body).toContain('8 colors · share order');
  });

  it('uses an error announcement without claiming busy state', () => {
    const state: FeedbackStateModel = {
      kind: 'error',
      title: 'Illustrative request failed',
      message: 'No recovery action is promised.',
    };
    const { body } = render(FeedbackState, { props: { state } });

    expect(body).toContain('role="alert"');
    expect(body).toContain('aria-live="assertive"');
    expect(body).not.toContain('aria-busy="true"');
  });

  it('renders only caller-supplied actions and never invokes one during render', () => {
    const onAction = vi.fn();
    const state: FeedbackStateModel = {
      kind: 'empty',
      title: 'Nothing selected',
      message: 'Illustrative caller copy.',
      actions: [
        {
          key: 'choose-example',
          label: 'Choose illustrative material',
          emphasis: 'primary',
        },
      ],
    };
    const { body } = render(FeedbackState, {
      props: { state, onAction },
    });

    expect(body.match(/<button/g)).toHaveLength(1);
    expect(body).toContain('data-feedback-action="choose-example"');
    expect(body).toContain('data-emphasis="primary"');
    expect(body).toContain('Choose illustrative material');
    expect(body).not.toMatch(/>\s*(Retry|Cancel|Relink|Open Folder|Undo)\s*</);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('renders no action region when the caller supplies no actions', () => {
    const { body } = render(FeedbackState, {
      props: { state: pendingWithPrevious },
    });

    expect(body).not.toContain('study-feedback__actions');
    expect(body).not.toContain('<button');
  });
});
