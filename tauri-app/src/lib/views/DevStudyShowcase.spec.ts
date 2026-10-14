import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import DevStudyShowcase from './DevStudyShowcase.svelte';

describe('DevStudyShowcase', () => {
  it('renders nested figure snippets and labeled native controls', () => {
    const onExampleAction = vi.fn();
    const { body } = render(DevStudyShowcase, {
      props: { onExampleAction },
    });

    expect(body).toContain('data-study-surface');
    expect(body).toContain('Hue and chroma distribution');
    expect(body).toContain('Palette proportions and study notes');
    expect(body.match(/<h2>/g)).toHaveLength(2);
    expect(body.match(/study-figure-frame__controls/g)).toHaveLength(1);
    expect(body.match(/study-figure-frame__content/g)).toHaveLength(2);
    expect(body.match(/<figcaption/g)).toHaveLength(1);
    expect(body).toContain('<fieldset');
    expect(body).toContain('<select aria-label="Illustrative palette size"');
    expect(body).toContain('type="range"');
    expect(body).toContain('type="checkbox"');
    expect(body).toContain('<details>');
    expect(body).toContain('<summary>');
    expect(body).toContain('<button type="button"');
    expect(onExampleAction).not.toHaveBeenCalled();
  });

  it('keeps illustrative provenance explicit', () => {
    const { body } = render(DevStudyShowcase);

    expect(body).toContain('no live analysis');
    expect(body).toContain('Illustrative geometry only');
    expect(body).toContain('fixed demonstration data');
    expect(body).toContain('excluded from the production entry graph');
  });
});
