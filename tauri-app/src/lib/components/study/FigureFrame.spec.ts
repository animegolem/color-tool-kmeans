import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import FigureFrame from './FigureFrame.svelte';

describe('FigureFrame', () => {
  it('renders its required title as a textual heading', () => {
    const { body } = render(FigureFrame, {
      props: { title: 'Hue & chroma' },
    });

    expect(body).toContain('<figure class="study-figure-frame">');
    expect(body).toMatch(/<h2>Hue &amp; chroma<\/h2>/);
  });

  it('omits optional regions when the caller supplies no snippets', () => {
    const { body } = render(FigureFrame, {
      props: { title: 'Palette proportions' },
    });

    expect(body).not.toContain('study-figure-frame__controls');
    expect(body).not.toContain('study-figure-frame__content');
    expect(body).not.toContain('study-figure-frame__caption');
    expect(body).not.toContain('<figcaption');
  });
});
