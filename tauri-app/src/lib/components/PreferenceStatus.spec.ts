import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  clearPreferenceWarning,
  dismissPreferenceWarning,
  preferencePersistenceWarning,
} from '../stores/preferences';
import PreferenceStatus from './PreferenceStatus.svelte';

describe('PreferenceStatus', () => {
  afterEach(() => dismissPreferenceWarning());

  it('renders nothing without a persistence failure', () => {
    preferencePersistenceWarning.set(null);
    expect(render(PreferenceStatus).body).not.toContain('preference-status');
  });

  it('renders an assertive operation-specific warning and one dismiss action', () => {
    preferencePersistenceWarning.set({
      operation: 'save',
      message: 'Preferences could not be saved.',
    });

    const { body } = render(PreferenceStatus);

    expect(body).toContain('data-preference-operation="save"');
    expect(body).toContain('role="alert"');
    expect(body).toContain('aria-live="assertive"');
    expect(body).toContain('Preferences could not be saved.');
    expect(body.match(/<button/g)).toHaveLength(1);
    expect(body).toContain('Dismiss');
  });

  it('supports explicit dismissal', () => {
    preferencePersistenceWarning.set({
      operation: 'load',
      message: 'Preferences could not be loaded.',
    });

    dismissPreferenceWarning();

    expect(render(PreferenceStatus).body).not.toContain('preference-status');
  });

  it('clears only after a successful matching operation', () => {
    preferencePersistenceWarning.set({
      operation: 'load',
      message: 'Preferences could not be loaded.',
    });

    clearPreferenceWarning('save');
    expect(get(preferencePersistenceWarning)?.operation).toBe('load');

    clearPreferenceWarning('load');
    expect(get(preferencePersistenceWarning)).toBeNull();
  });
});
