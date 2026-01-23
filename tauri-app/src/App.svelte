<script lang="ts">
  import { onMount } from 'svelte';
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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  });
</script>

<main>
  <nav class="nav">
    {#each navItems as item}
      <button class:active={$currentView === item.key} onclick={() => setView(item.key)}>
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
