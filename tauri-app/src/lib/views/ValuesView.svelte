<script lang="ts">
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { SelectedImage, ValueStudyResult, ValueStudyState } from '../stores/ui';
  import {
    selectedFile,
    valueStudyResult,
    valueStudyState,
    valueStudyError,
    setValueStudyPending,
    setValueStudySuccess,
    setValueStudyError,
    openZoomOverlay
  } from '../stores/ui';
  import { requestValueStudy } from '../bridges/value-study';

  const columnLabels = ['High', 'Medium', 'Low'] as const;
  const rowLabels = ['High', 'Medium', 'Low'] as const;

  let file = $state<SelectedImage | null>(null);
  let study = $state<ValueStudyResult | null>(null);
  let status = $state<ValueStudyState>('idle');
  let error = $state<string | null>(null);

  const tileSrcs = $derived.by(() => {
    if (!study) return [] as string[];
    return study.tiles.map((path) => convertFileSrc(path));
  });

  function openImageZoom(src: string, alt: string) {
    openZoomOverlay({ kind: 'image', src, alt });
  }

  function handleZoomKeydown(event: KeyboardEvent, src: string, alt: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openImageZoom(src, alt);
  }

  async function ensureValueStudy(currentFile: SelectedImage) {
    if (!currentFile.path) {
      setValueStudyError(currentFile.id, 'Value study requires a native file path.');
      return;
    }
    setValueStudyPending(currentFile.id);
    try {
      const result = await requestValueStudy(currentFile.path, currentFile.id);
      setValueStudySuccess(currentFile.id, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setValueStudyError(currentFile.id, message);
    }
  }

  $effect(() => {
    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
      }),
      valueStudyResult.subscribe((value) => {
        study = value;
      }),
      valueStudyState.subscribe((value) => {
        status = value;
      }),
      valueStudyError.subscribe((value) => {
        error = value;
      })
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });

  $effect(() => {
    if (!file) return;
    if (status !== 'idle') return;
    if (study) return;
    void ensureValueStudy(file);
  });
</script>

<section class="values">
  <header>
    <h1>Values</h1>
    <p class="note">Value-only studies derived from the original image.</p>
  </header>

  {#if !file}
    <div class="empty">Select an image to view the values grid.</div>
  {:else if status === 'pending'}
    <div class="empty">Generating value study…</div>
  {:else if status === 'error'}
    <div class="empty">Value study failed. {error ?? 'Unknown error.'}</div>
  {:else if study}
    <div class="original">
      <h2>Original</h2>
      <div class="preview-frame">
        {#if file.previewUrl}
          <img
            class="preview zoomable"
            src={file.previewUrl}
            alt={file.name}
            role="button"
            tabindex="0"
            onclick={() => openImageZoom(file.previewUrl ?? '', file.name)}
            onkeydown={(event) => handleZoomKeydown(event, file.previewUrl ?? '', file.name)}
          />
        {:else}
          <div class="empty">Preview unavailable.</div>
        {/if}
      </div>
    </div>

    <div class="grid-frame">
      <div class="major-label">Major Key</div>
      <div class="minor-label">Minor Key</div>
      <div class="grid">
        <div class="corner"></div>
        {#each columnLabels as label}
          <div class="col-label">{label}</div>
        {/each}
        {#each rowLabels as rowLabel, rowIndex}
          <div class="row-label">{rowLabel}</div>
          {#each columnLabels as _, colIndex}
            {@const tileIndex = rowIndex * 3 + colIndex}
            {@const tileSrc = tileSrcs[tileIndex]}
            <div class="tile">
              {#if tileSrc}
                <img
                  class="zoomable"
                  src={tileSrc}
                  alt={`Value study ${rowLabel} ${columnLabels[colIndex]}`}
                  role="button"
                  tabindex="0"
                  onclick={() =>
                    openImageZoom(
                      tileSrc,
                      `Value study ${rowLabel} ${columnLabels[colIndex]}`
                    )}
                  onkeydown={(event) =>
                    handleZoomKeydown(
                      event,
                      tileSrc,
                      `Value study ${rowLabel} ${columnLabels[colIndex]}`
                    )}
                />
              {:else}
                <div class="tile-placeholder"></div>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty">Select an image to view the values grid.</div>
  {/if}
</section>

<style>
  .values {
    max-width: 960px;
  }

  .original {
    margin-bottom: 28px;
  }

  .preview-frame {
    display: flex;
    justify-content: center;
  }

  .preview {
    width: 100%;
    max-width: 640px;
    border-radius: 10px;
    border: 1px solid var(--line);
    display: block;
  }

  .grid-frame {
    position: relative;
    margin-top: 24px;
  }

  .major-label {
    text-align: center;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .minor-label {
    position: absolute;
    left: -48px;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    font-weight: 600;
  }

  .grid {
    display: grid;
    grid-template-columns: 72px repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: center;
  }

  .corner {
    width: 100%;
  }

  .col-label,
  .row-label {
    font-weight: 600;
    text-align: center;
    font-size: 14px;
  }

  .row-label {
    text-align: right;
    padding-right: 8px;
  }

  .tile {
    background: var(--panel);
    border-radius: 10px;
    border: 1px solid var(--line);
    overflow: hidden;
  }

  .tile img {
    display: block;
    width: 100%;
    height: auto;
  }

  .tile-placeholder {
    padding-top: 56%;
    background: rgba(33, 33, 32, 0.06);
  }

  .empty {
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    color: rgba(33, 33, 32, 0.6);
  }

  @media (max-width: 900px) {
    .minor-label {
      position: static;
      transform: none;
      text-align: center;
      margin-bottom: 8px;
    }

    .grid {
      grid-template-columns: 56px repeat(3, minmax(0, 1fr));
    }
  }
</style>
