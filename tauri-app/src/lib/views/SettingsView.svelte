<script lang="ts">
  import { params, clusterMax, excludeTopMax, showSimplifiedTones, exportDir, videoStripMode, videoFrameLabel, graphExportFormat, compactSidebars } from '../stores/ui';
  import { hydrateFromPrefs } from '../stores/ui';
  import { resetPrefs, DEFAULTS } from '../stores/prefs';
  import { open } from '@tauri-apps/plugin-dialog';
  import { logEvent } from '../bridges/log';
  import { onMount } from 'svelte';

  let isResetting = $state(false);

  onMount(() => {
    void logEvent('settings:view:mount');
  });

  async function handleBrowseDir() {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Choose export directory' });
      if (selected && typeof selected === 'string') {
        $exportDir = selected;
      }
    } catch (err) {
      console.warn('[settings] directory picker failed', err);
    }
  }

  async function handleReset() {
    isResetting = true;
    try {
      await resetPrefs();
      hydrateFromPrefs(DEFAULTS);
      void logEvent('settings:reset');
    } finally {
      isResetting = false;
    }
  }

  function truncatePath(path: string | null, maxLen: number): string {
    if (!path) return 'Not set';
    if (path.length <= maxLen) return path;
    return '...' + path.slice(-(maxLen - 3));
  }
</script>

<section class="settings">
  <div class="group">
    <h2>App</h2>
    <label class="choice">
      <input type="checkbox" bind:checked={$compactSidebars} />
      Compact sidebars (always overlay)
    </label>
  </div>

  <div class="group">
    <h2>Colors</h2>
    <div class="field">
      <label>
        <span>Max clusters: <strong>{$clusterMax}</strong></span>
        <input type="range" min="10" max="5000" step="10" bind:value={$clusterMax} />
        <input class="number-input" type="number" min="10" max="5000" step="10" bind:value={$clusterMax} />
      </label>
      <p class="hint">Values over 5-10k may cause slow processing on some hardware.</p>
    </div>
    <div class="field">
      <label>
        <span>Max exclude-top: <strong>{$excludeTopMax}</strong></span>
        <input type="range" min="10" max="500" step="10" bind:value={$excludeTopMax} />
        <input class="number-input" type="number" min="10" max="500" step="10" bind:value={$excludeTopMax} />
      </label>
    </div>
    <div class="field">
      <span class="field-label">Display Charts</span>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showHistogram} />
        Cluster Histogram
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showPolarChart} />
        Polar Chart
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showHueLightness} />
        Hue x Lightness
      </label>
    </div>
  </div>

  <div class="group">
    <h2>Values</h2>
    <label class="choice">
      <input type="checkbox" bind:checked={$showSimplifiedTones} />
      Show simplified tones
    </label>
  </div>

  <div class="group">
    <h2>Video</h2>
    <div class="field">
      <span class="field-label">Strip Style</span>
      <label class="choice">
        <input type="radio" name="videoStripMode" value="filmstrip" bind:group={$videoStripMode} />
        Filmstrip (scene thumbnails)
      </label>
      <label class="choice">
        <input type="radio" name="videoStripMode" value="barcode" bind:group={$videoStripMode} />
        Barcode (per-frame color)
      </label>
    </div>
    <div class="field">
      <span class="field-label">Export Frame Label</span>
      <label class="choice">
        <input type="radio" name="videoFrameLabel" value="timestamp" bind:group={$videoFrameLabel} />
        Timestamp (e.g. -00m03s25)
      </label>
      <label class="choice">
        <input type="radio" name="videoFrameLabel" value="frame" bind:group={$videoFrameLabel} />
        Frame number (e.g. -f97)
      </label>
    </div>
  </div>

  <div class="group">
    <h2>Export</h2>
    <div class="field">
      <span class="field-label">Graph export format</span>
      <label class="choice">
        <input type="radio" name="graphExportFormat" value="svg" bind:group={$graphExportFormat} />
        SVG (raw vector)
      </label>
      <label class="choice">
        <input type="radio" name="graphExportFormat" value="png" bind:group={$graphExportFormat} />
        PNG (rasterized at scale)
      </label>
    </div>
    <label>
      <span>Save directory</span>
      <div class="dir-row">
        <span class="dir-path" title={$exportDir ?? 'Not set'}>{truncatePath($exportDir, 40)}</span>
        <button type="button" class="browse-btn" onclick={handleBrowseDir}>Browse</button>
      </div>
    </label>
  </div>

  <div class="group reset-group">
    <button type="button" class="reset-btn" onclick={handleReset} disabled={isResetting}>
      Reset to defaults
    </button>
  </div>
</section>

<style>
  .settings {
    max-width: 720px;
    margin: 0 auto;
  }

  .group {
    background: var(--panel);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow);
    margin-bottom: 20px;
  }

  .group h2 {
    margin-top: 0;
    font-size: 18px;
  }

  .field {
    margin-bottom: 16px;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  input[type='range'] {
    width: 100%;
  }

  .number-input {
    margin-top: 4px;
    width: 120px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    font: inherit;
  }

  .hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.5);
  }

  .choice {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    margin-right: 16px;
    margin-bottom: 4px;
  }

  .dir-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dir-path {
    flex: 1;
    font-size: 13px;
    color: rgba(33, 33, 32, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .browse-btn {
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
  }

  .reset-group {
    background: none;
    box-shadow: none;
    padding: 0;
  }

  .reset-btn {
    padding: 10px 20px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font: inherit;
    color: #8a1f2b;
  }

  .reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
