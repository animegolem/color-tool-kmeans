import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import TargetUnavailable from './TargetUnavailable.svelte';

describe('TargetUnavailable', () => {
  it.each(['Values', 'Batch', 'Exports'] as const)(
    'renders an accessible %s explanation without an action',
    (capability) => {
      const { body } = render(TargetUnavailable, {
        props: { capability },
      });
      const normalizedBody = body.replace(/\s+/g, ' ');

      expect(body).toContain(
        `data-target-unavailable="${capability.toLowerCase()}"`
      );
      expect(body).toContain('role="status"');
      expect(body).toContain('aria-live="polite"');
      expect(body).toContain(`${capability} is unavailable in the browser`);
      expect(normalizedBody).toContain('no desktop action was attempted');
      expect(body).not.toContain('<button');
      expect(body).not.toContain('<a ');
      expect(body).not.toContain('onclick=');
    }
  );
});
