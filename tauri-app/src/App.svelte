<script lang="ts">
  import { currentView, setView } from './lib/stores/ui';
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import HomeView from './lib/views/HomeView.svelte';
  import GraphsView from './lib/views/GraphsView.svelte';
  import ExportsView from './lib/views/ExportsView.svelte';

  const NAV_ITEMS: { key: typeof $currentView; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'graphs', label: 'Graphs' },
    { key: 'exports', label: 'Exports' }
  ];

  onMount(async () => {
    await tick();
  });
</script>

<main>
  <nav class="nav">
    {#each NAV_ITEMS as item}
      <button
        class:active={$currentView === item.key}
        on:click={() => setView(item.key)}
      >
        {item.label}
      </button>
    {/each}
  </nav>

  <section class="view-container">
    {#if $currentView === 'home'}
      <HomeView />
    {:else if $currentView === 'graphs'}
      <GraphsView />
    {:else}
      <ExportsView />
    {/if}
  </section>
</main>
