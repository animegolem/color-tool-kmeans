import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mediaBucketSource = readFileSync(
  new URL('../../components/MediaBucket.svelte', import.meta.url),
  'utf8'
);
const settingsSource = readFileSync(new URL('../SettingsView.svelte', import.meta.url), 'utf8');

describe('audit P4 regressions', () => {
  it('AUD-018 treats a frameTimestamp of zero as pinning-eligible', () => {
    expect(mediaBucketSource).toContain('disabled={isRawVideo(item)}');
    expect(mediaBucketSource).toContain(
      'return !!item.videoPath && item.frameTimestamp == null;'
    );

    const frameAtStart = { videoPath: '/tmp/clip.mp4', frameTimestamp: 0 };
    const isRawVideo = !!frameAtStart.videoPath && frameAtStart.frameTimestamp == null;

    expect(isRawVideo).toBe(false);
  });

  it('AUD-019 describes chart visibility as a Colors-only setting', () => {
    expect(settingsSource).toContain('<p class="hint">Applies to the Colors view.</p>');
    expect(settingsSource).not.toContain('Applies to Colors and Batch views.');
  });
});
