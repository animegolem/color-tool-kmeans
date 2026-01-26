<script lang="ts">
  import { onMount } from 'svelte';
  import type { View } from './lib/stores/ui';
  import { currentView, setView } from './lib/stores/ui';
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
