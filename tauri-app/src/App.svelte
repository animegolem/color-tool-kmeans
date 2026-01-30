<script lang="ts">
  import { onMount } from 'svelte';
  import type { View } from './lib/stores/ui';
  import { currentView, setView } from './lib/stores/ui';
  import { isTauriEnv } from './lib/bridges/tauri';
  import HomeView from './lib/views/HomeView.svelte';
  import ValuesView from './lib/views/ValuesView.svelte';
  import ExportsView from './lib/views/ExportsView.svelte';
  import ZoomOverlay from './lib/components/ZoomOverlay.svelte';
  import { logEvent } from './lib/bridges/log';

  const navItems = [
    { key: 'home', label: 'Colors' },
    { key: 'values', label: 'Values' },
    { key: 'exports', label: 'Exports' }
  ] as const;

  function handleNavClick(view: View) {
    setView(view);
    void logEvent(`nav:view ${view}`);
  }

  onMount(() => {
    const log = (message: string) => {
      void logEvent(message);
    };
    log(`renderer:mounted visibility=${document.visibilityState}`);

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

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('keydown', handleZoomHotkeys);

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
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('keydown', handleZoomHotkeys);
      window.cancelAnimationFrame(frameHandle);
      window.clearInterval(stallTimer);
      window.clearInterval(rendererHeartbeat);
    };
  });
</script>

<main>
  <nav class="nav">
    {#each navItems as item}
      <button class:active={$currentView === item.key} onclick={() => handleNavClick(item.key)}>
        {item.label}
      </button>
    {/each}
  </nav>

  <section class="view-container">
    {#if $currentView === 'home'}
      <HomeView />
    {:else if $currentView === 'values'}
      <ValuesView />
    {:else}
      <ExportsView />
    {/if}
  </section>

  <ZoomOverlay />
</main>
