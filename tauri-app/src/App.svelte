<script lang="ts">
  import { currentView, setView } from './lib/stores/ui';
  import HomeView from './lib/views/HomeView.svelte';
  import GraphsView from './lib/views/GraphsView.svelte';
  import ExportsView from './lib/views/ExportsView.svelte';

  const navItems = $derived([
    { key: 'home', label: 'Home' },
    { key: 'graphs', label: 'Graphs' },
    { key: 'exports', label: 'Exports' }
  ] as const);

  const activeView = $derived.by(() => $store(currentView));
</script>

<main>
  <nav class="nav">
    {#each navItems as item}
      <button class:active={activeView === item.key} onclick={() => setView(item.key)}>
        {item.label}
      </button>
    {/each}
  </nav>

  <section class="view-container">
    {#if activeView === 'home'}
      <HomeView />
    {:else if activeView === 'graphs'}
      <GraphsView />
    {:else}
      <ExportsView />
    {/if}
  </section>
</main>
