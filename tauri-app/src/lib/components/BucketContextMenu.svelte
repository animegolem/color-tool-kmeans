<script lang="ts">
  import type { ImageEntry } from '../stores/image';
  import { saveFromPath } from '../bridges/fs';
  import { extractVideoFrame } from '../bridges/video';
  import { appendFile } from '../stores/image';
  import { togglePin } from '../stores/multi-analysis';
  import { assetUrl } from '../utils/asset-url';

  interface Props {
    x: number;
    y: number;
    entry: ImageEntry;
    isActiveVideo: boolean;
    onclose: () => void;
  }

  let { x, y, entry, isActiveVideo, onclose }: Props = $props();

  // Viewport-clamp position
  const menuWidth = 200;
  const menuHeight = 80;
  let left = $derived(Math.min(x, window.innerWidth - menuWidth - 8));
  let top = $derived(Math.min(y, window.innerHeight - menuHeight - 8));

  function handleSave() {
    onclose();
    if (entry.path) {
      void saveFromPath(entry.path, entry.name);
    }
  }

  function handleAddFrame() {
    onclose();
    void addFrameToBucket();
  }

  async function addFrameToBucket() {
    if (!entry.videoPath) return;
    const vs = await import('../stores/video');
    const { get } = await import('svelte/store');
    const state = get(vs.videoState);
    if (!state || state.path !== entry.videoPath) return;

    const frameId = crypto.randomUUID();
    const timestamp = state.currentTime;
    const response = await extractVideoFrame({
      path: state.path,
      frameId,
      timestamp,
      maxDimension: 1200
    });
    if (!response.path) return;

    const previewUrl = assetUrl(response.path);
    const newEntry: ImageEntry = {
      id: frameId,
      name: `${state.name} @${timestamp.toFixed(2)}s`,
      path: response.path,
      videoPath: state.path,
      frameTimestamp: timestamp,
      size: 0,
      source: { kind: 'path', path: response.path },
      previewUrl
    };
    const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
    appendFile(newEntry, dataset);
    togglePin(frameId);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }

  function handleWindowClick() {
    onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

<div
  class="bucket-ctx"
  style="left:{left}px;top:{top}px"
  role="menu"
  tabindex="-1"
  onclick={(e) => e.stopPropagation()}
  onkeydown={handleKeydown}
>
  {#if entry.path}
    <button class="bucket-ctx__item" role="menuitem" onclick={handleSave}>
      Save image as...
    </button>
  {/if}
  {#if isActiveVideo}
    <button class="bucket-ctx__item" role="menuitem" onclick={handleAddFrame}>
      Add frame to media bucket
    </button>
  {/if}
</div>

<style>
  .bucket-ctx {
    position: fixed;
    z-index: 9999;
    min-width: 180px;
    background: rgba(33, 33, 32, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 4px 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .bucket-ctx__item {
    display: block;
    width: 100%;
    padding: 6px 14px;
    border: none;
    background: none;
    color: #e8e8e8;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
  }

  .bucket-ctx__item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
