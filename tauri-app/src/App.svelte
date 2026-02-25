<script lang="ts">
  import { onMount } from 'svelte';
  import type { View, ImageEntry } from './lib/stores/ui';
  import { get } from 'svelte/store';
  import { currentView, setView, libraryDrawerOpen, navCollapsed, narrowMode, selectedFile, videoState, setVideoState, clearActiveSelection, requestMediaLoad, setFile, appendFile, updateEntryPreview } from './lib/stores/ui';
  import { isTauriEnv, tauriInvoke } from './lib/bridges/tauri';
  import { getFsBridge, isVideoFile } from './lib/bridges/fs';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { extractVideoFrame } from './lib/bridges/video';
  import HomeView from './lib/views/HomeView.svelte';
  import ValuesView from './lib/views/ValuesView.svelte';
  import ExportsView from './lib/views/ExportsView.svelte';
  import SettingsView from './lib/views/SettingsView.svelte';
  import ZoomOverlay from './lib/components/ZoomOverlay.svelte';
  import MediaBucket from './lib/components/MediaBucket.svelte';
  import { logEvent } from './lib/bridges/log';

  $effect(() => {
    const _view = $currentView;
    const el = document.querySelector('.view-container');
    if (el instanceof HTMLElement) {
      el.scrollTop = 0;
    }
  });

  const navItems = [
    { key: 'home', label: 'Colors' },
    { key: 'values', label: 'Values' },
    { key: 'exports', label: 'Exports' },
    { key: 'settings', label: 'Settings' }
  ] as const;

  const file = $derived($selectedFile ? { name: $selectedFile.name } : null);
  const video = $derived($videoState ? { name: $videoState.name } : null);

  const activeViewLabel = $derived.by(() => {
    const item = navItems.find((i) => i.key === $currentView);
    return item?.label ?? 'Colors';
  });

  const viewDescriptions: Record<string, string> = {
    home: 'OKLab color data derived by K-Means++ and plotted for analysis.',
    values: 'Value analysis derived from OKLab lightness.',
    exports: 'Export analysis results as SVG, PNG, or CSV.',
    settings: 'Application preferences and defaults.'
  };

  const activeViewDesc = $derived(viewDescriptions[$currentView] ?? '');

  const fileLabel = $derived.by(() => {
    if (video) return video.name;
    if (file) return file.name;
    return null;
  });

  function handleNavClick(view: View) {
    setView(view);
    void logEvent(`nav:view ${view}`);
  }

  function handleClear() {
    clearActiveSelection();
  }

  async function globalChooseMedia() {
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('all');
      if (!selections?.length) return;
      let firstActivated = false;
      for (const sel of selections) {
        const nativeMode = isTauriEnv() && !!sel.path;
        const isVideo = isVideoFile(sel);
        const previewUrl = isVideo ? null :
          (nativeMode && sel.path ? convertFileSrc(sel.path) : null);
        const entryId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        const entry: ImageEntry = {
          id: entryId,
          name: sel.name || sel.path || 'image',
          path: sel.path,
          ...(isVideo && sel.path ? { videoPath: sel.path } : {}),
          size: sel.size,
          source: nativeMode && sel.path ? { kind: 'path', path: sel.path } : { kind: 'blob' },
          previewUrl
        };
        if (isVideo && sel.path) {
          extractVideoFrame({ path: sel.path, frameId: `thumb-${entryId}`, timestamp: 0, maxDimension: 200 })
            .then((res) => updateEntryPreview(entryId, convertFileSrc(res.path)))
            .catch(() => {});
        }
        const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
        if (!firstActivated) {
          firstActivated = true;
          if (nativeMode && sel.path) {
            (globalThis as any).__ACTIVE_IMAGE_PATH__ = sel.path;
          }
          setVideoState(null);
          setFile(entry, emptyDataset);
        } else {
          appendFile(entry, emptyDataset);
        }
      }
      if (selections.length > 1) libraryDrawerOpen.set(true);
      void logEvent('global:media:loaded');
    } catch (err) {
      console.error('[app] Failed to open native dialog', err);
    }
  }

  function handleUpload() {
    if ($currentView === 'home' || $currentView === 'values') {
      requestMediaLoad();
    } else {
      void globalChooseMedia();
    }
    void logEvent('header:upload');
  }

  function handleMediaAdd() {
    if ($currentView === 'home' || $currentView === 'values') {
      requestMediaLoad();
    } else {
      void globalChooseMedia();
    }
  }

  onMount(() => {
    const log = (message: string) => {
      void logEvent(message);
    };
    log(`renderer:mounted visibility=${document.visibilityState}`);

    const narrowMq = window.matchMedia('(max-width: 1080px)');
    let libraryWasOpen = false;
    const handleNarrow = (e: MediaQueryList | MediaQueryListEvent) => {
      if (e.matches) {
        libraryWasOpen = get(libraryDrawerOpen);
        narrowMode.set(true);
        navCollapsed.set(true);
        libraryDrawerOpen.set(false);
      } else {
        narrowMode.set(false);
        navCollapsed.set(false);
        if (libraryWasOpen) {
          libraryDrawerOpen.set(true);
          libraryWasOpen = false;
        }
      }
    };
    handleNarrow(narrowMq);
    narrowMq.addEventListener('change', handleNarrow);

    const closeSidebars = () => {
      navCollapsed.set(true);
      libraryDrawerOpen.set(false);
    };
    const handleEscSidebar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !get(narrowMode)) return;
      if (!get(navCollapsed) || get(libraryDrawerOpen)) {
        e.preventDefault();
        closeSidebars();
      }
    };
    window.addEventListener('keydown', handleEscSidebar);

    let zoomLevel = 1;
    const zoomStep = 0.1;
    const zoomMin = 0.2;
    const zoomMax = 5;
    const zoomEnabled = isTauriEnv();

    const applyZoom = async (nextLevel: number) => {
      const clamped = Math.min(zoomMax, Math.max(zoomMin, nextLevel));
      zoomLevel = clamped;
      try {
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');
        await getCurrentWebview().setZoom(clamped);
        log(`ui:zoom ${clamped.toFixed(2)}`);
      } catch (err) {
        log(`ui:zoom:error`);
        console.warn('[zoom] failed to set webview zoom', err);
      }
    };

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      return !!target.closest('[contenteditable="true"]');
    };

    const handleZoomHotkeys = (event: KeyboardEvent) => {
      if (!zoomEnabled) return;
      if (!event.metaKey && !event.ctrlKey) return;
      if (event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key;
      if (key !== '+' && key !== '=' && key !== '-' && key !== '_' && key !== '0') return;
      event.preventDefault();
      if (key === '0') {
        void applyZoom(1);
        return;
      }
      const direction = key === '-' || key === '_' ? -1 : 1;
      void applyZoom(zoomLevel + zoomStep * direction);
    };

    const handleVisibility = () => {
      log(`visibility:${document.visibilityState}`);
    };
    const handleFocus = () => {
      log('window:focus');
    };
    const handleBlur = () => {
      log('window:blur');
    };
    const handlePageHide = (event: PageTransitionEvent) => {
      log(`pagehide:persisted=${event.persisted}`);
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      log(`pageshow:persisted=${event.persisted}`);
    };

    const pasteImageBlob = async (blob: File | Blob) => {
      const { appCacheDir } = await import('@tauri-apps/api/path');
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      const cacheDir = await appCacheDir();
      const path = `${cacheDir}/clipboard/paste-${Date.now()}.png`;
      const buffer = await blob.arrayBuffer();
      const data = Array.from(new Uint8Array(buffer));
      await tauriInvoke('save_file', { req: { path, data } });
      const previewUrl = convertFileSrc(path);
      const entryId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const entry: ImageEntry = {
        id: entryId,
        name: `paste-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
        path,
        size: blob.size,
        source: { kind: 'path', path },
        previewUrl
      };
      const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      setVideoState(null);
      (globalThis as any).__ACTIVE_IMAGE_PATH__ = path;
      setFile(entry, emptyDataset);
      libraryDrawerOpen.set(true);
      void logEvent('clipboard:paste:image');
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!isTauriEnv()) return;
      if (isEditableTarget(event.target)) return;
      const items = event.clipboardData?.items;
      if (!items) return;
      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageFile = items[i].getAsFile();
          if (imageFile) break;
        }
      }
      if (!imageFile) return;
      event.preventDefault();
      void pasteImageBlob(imageFile).catch((err) => {
        console.error('[paste] Failed to paste image', err);
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('keydown', handleZoomHotkeys);
    window.addEventListener('paste', handlePaste);

    let lastFrame = performance.now();
    let lastStallLog = 0;
    let frameHandle = 0;
    const frameTick = () => {
      lastFrame = performance.now();
      frameHandle = window.requestAnimationFrame(frameTick);
    };
    frameHandle = window.requestAnimationFrame(frameTick);
    const stallTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const now = performance.now();
      const stalledFor = now - lastFrame;
      if (stalledFor > 1000 && now - lastStallLog > 5000) {
        lastStallLog = now;
        log(`renderer:stall ms=${Math.round(stalledFor)}`);
      }
    }, 500);
    const rendererHeartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      log('renderer:heartbeat');
    }, 5000);

    return () => {
      narrowMq.removeEventListener('change', handleNarrow);
      window.removeEventListener('keydown', handleEscSidebar);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('keydown', handleZoomHotkeys);
      window.removeEventListener('paste', handlePaste);
      window.cancelAnimationFrame(frameHandle);
      window.clearInterval(stallTimer);
      window.clearInterval(rendererHeartbeat);
    };
  });
</script>

<main
  class:nav-collapsed={$navCollapsed}
  class:library-open={$libraryDrawerOpen}
  class:narrow-mode={$narrowMode}
>
  <nav class="nav" class:collapsed={$navCollapsed}>
    {#each navItems as item}
      <button class:active={$currentView === item.key} onclick={() => handleNavClick(item.key)}>
        {item.label}
      </button>
    {/each}
  </nav>

  <header class="app-header">
    <button
      type="button"
      class="header-toggle"
      aria-label={$navCollapsed ? 'Show navigation' : 'Hide navigation'}
      onclick={() => {
        if ($narrowMode && $navCollapsed) libraryDrawerOpen.set(false);
        navCollapsed.update((v) => !v);
      }}
    >
      {#if $navCollapsed}
        {@html `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M1 3.5V12.5C1 13.879 2.122 15 3.5 15H12.5C13.878 15 15 13.879 15 12.5V3.5C15 2.122 13.878 1 12.5 1H3.5C2.122 1 1 2.122 1 3.5ZM12.5 14H7V2H12.5C13.327 2 14 2.673 14 3.5V12.5C14 13.327 13.327 14 12.5 14ZM2 3.5C2 2.673 2.673 2 3.5 2H6V14H3.5C2.673 14 2 13.327 2 12.5V3.5Z"/></svg>`}
      {:else}
        {@html `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12.5 1C13.881 1 15 2.119 15 3.5V12.5C15 13.881 13.881 15 12.5 15H3.5C2.119 15 1 13.881 1 12.5V3.5C1 2.119 2.119 1 3.5 1H12.5ZM12.5 14C13.328 14 14 13.328 14 12.5V3.5C14 2.672 13.328 2 12.5 2H7V14H12.5Z"/></svg>`}
      {/if}
    </button>

    <div class="header-center">
      <div class="header-title-group">
        <span class="header-view-title">{activeViewLabel}</span>
        <span class="header-view-desc">{activeViewDesc}</span>
      </div>
      <div class="header-file-group">
        {#if fileLabel}
          <span class="header-separator" aria-hidden="true">&middot;</span>
          <span class="header-file-label" title={fileLabel}>{fileLabel}</span>
          <button type="button" class="header-clear" onclick={handleClear}>Clear</button>
        {:else}
          <button type="button" class="header-upload" onclick={handleUpload}>Upload</button>
        {/if}
      </div>
    </div>

    <button
      type="button"
      class="header-toggle"
      aria-label={$libraryDrawerOpen ? 'Close library' : 'Open library'}
      onclick={() => {
        if ($narrowMode && !$libraryDrawerOpen) navCollapsed.set(true);
        libraryDrawerOpen.update((v) => !v);
      }}
    >
      {#if $libraryDrawerOpen}
        {@html `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12.5 1C13.881 1 15 2.119 15 3.5V12.5C15 13.881 13.881 15 12.5 15H3.5C2.119 15 1 13.881 1 12.5V3.5C1 2.119 2.119 1 3.5 1H12.5ZM9 14V2H3.5C2.672 2 2 2.672 2 3.5V12.5C2 13.328 2.672 14 3.5 14H9Z"/></svg>`}
      {:else}
        {@html `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12.5 1H3.5C2.122 1 1 2.122 1 3.5V12.5C1 13.879 2.122 15 3.5 15H12.5C13.878 15 15 13.879 15 12.5V3.5C15 2.122 13.878 1 12.5 1ZM2 12.5V3.5C2 2.673 2.673 2 3.5 2H9V14H3.5C2.673 14 2 13.327 2 12.5ZM14 12.5C14 13.327 13.327 14 12.5 14H10V2H12.5C13.327 2 14 2.673 14 3.5V12.5Z"/></svg>`}
      {/if}
    </button>
  </header>

  <section class="view-container">
    {#if $currentView === 'home'}
      <HomeView />
    {:else if $currentView === 'values'}
      <ValuesView />
    {:else if $currentView === 'settings'}
      <SettingsView />
    {:else}
      <ExportsView />
    {/if}
  </section>

  <aside class="library-rail" aria-label="Library rail">
    {#if $libraryDrawerOpen}
      <div id="library-drawer" class="library-drawer" aria-label="Library drawer">
        <div class="library-drawer__content">
          <header class="library-drawer__header">
            <h3>Media Bucket</h3>
            <button class="library-section__add" onclick={handleMediaAdd} aria-label="Add media">+</button>
          </header>
          <MediaBucket />
        </div>
      </div>
    {/if}
  </aside>

  {#if $narrowMode && (!$navCollapsed || $libraryDrawerOpen)}
    <div class="sidebar-backdrop" role="presentation"
      onclick={() => { navCollapsed.set(true); libraryDrawerOpen.set(false); }}></div>
  {/if}

  <ZoomOverlay />
</main>
