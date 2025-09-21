<script lang="ts">
  import { onMount } from 'svelte';
  import { selectedFile, params, setFile, clearFile } from '../stores/ui';
  import { openFileDialog, isTauri } from '../tauri';
  import { get } from 'svelte/store';

  let dragging = false;
  let dropRef: HTMLElement;

  async function chooseFile() {
    const path = await openFileDialog();
    if (path) {
      const name = path.split(/[\\/]/).pop() ?? path;
      setFile(path, name);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    if (!dropRef.contains(event.relatedTarget as Node)) {
      dragging = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const path = (file as unknown as { path?: string }).path ?? file.name;
    const name = file.name ?? path;
    setFile(path, name);
  }

  function clearSelection() {
    clearFile();
  }

  onMount(() => {
    if (!isTauri()) {
      console.info('[home] Running without Tauri backend; drag/drop limited to browser capabilities.');
    }
  });
</script>

<section class="home">
  <header>
    <h1>Load an image</h1>
    <p class="note">
      Drop a file anywhere or use the upload button. Supported formats: PNG, JPEG, WebP.
    </p>
  </header>

  <div
    bind:this={dropRef}
    class:dragging
    class="dropzone"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
  >
    <div class="inner">
      <p class="title">Drop anywhere</p>
      <p class="note">or</p>
      <button class="upload" on:click={chooseFile}>Upload</button>
    </div>
  </div>

  {#if $selectedFile}
    <div class="selection">
      <div>
        <strong>Selected file:</strong>
        <span>{$selectedFile.name}</span>
      </div>
      <button on:click={clearSelection}>Clear</button>
    </div>
  {:else}
    <div class="selection empty">
      <span>No file selected yet.</span>
    </div>
  {/if}

  <section class="controls">
    <h2>Parameters</h2>
    <div class="grid">
      <label>
        <span>Clusters</span>
        <input type="number" min="1" max="400" bind:value={$params.clusters} />
      </label>
      <label>
        <span>Stride</span>
        <input type="number" min="1" max="16" bind:value={$params.stride} />
      </label>
      <label>
        <span>Min. luminosity</span>
        <input type="number" min="0" max="255" bind:value={$params.minLum} />
      </label>
      <label>
        <span>Color space</span>
        <select bind:value={$params.colorSpace}>
          <option value="RGB">RGB</option>
          <option value="HSL">HSL</option>
          <option value="YUV">YUV</option>
          <option value="CIELAB">CIELAB</option>
          <option value="CIELUV">CIELUV</option>
        </select>
      </label>
      <label>
        <span>Axis</span>
        <select bind:value={$params.axis}>
          <option value="HSL">HSL</option>
          <option value="HLS">HLS</option>
        </select>
      </label>
      <label>
        <span>Symbol scale</span>
        <input type="number" min="0.5" max="2" step="0.1" bind:value={$params.symbolScale} />
      </label>
    </div>
  </section>
</section>

<style>
  .home {
    max-width: 720px;
  }

  .dropzone {
    border: 2px dashed var(--accent);
    border-radius: 12px;
    padding: 48px;
    text-align: center;
    background: rgba(130, 76, 50, 0.06);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .dropzone.dragging {
    background: rgba(130, 76, 50, 0.12);
    border-color: var(--accent);
  }

  .dropzone .title {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .upload {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
  }

  .selection {
    margin-top: 24px;
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .selection.empty {
    color: rgba(33, 33, 32, 0.6);
    font-style: italic;
  }

  .selection button {
    border: 1px solid var(--line);
    background: transparent;
    border-radius: 6px;
    padding: 8px 12px;
  }

  .controls {
    margin-top: 32px;
    background: var(--panel);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow);
  }

  .controls h2 {
    margin-top: 0;
    font-size: 18px;
  }

  .grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  input,
  select {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font: inherit;
    background: #fff;
  }
</style>
