<script lang="ts">
  import { onMount } from 'svelte';

  export interface ContextMenuItem {
    label: string;
    onSelect: () => void;
  }

  interface Props {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
  }

  let { x, y, items, onClose }: Props = $props();

  let menuEl = $state<HTMLDivElement | null>(null);
  let pos = $state({ x, y });

  // Clamp to viewport once the menu has measured itself.
  $effect(() => {
    if (!menuEl) return;
    const rect = menuEl.getBoundingClientRect();
    const margin = 8;
    const nx = Math.min(x, window.innerWidth - rect.width - margin);
    const ny = Math.min(y, window.innerHeight - rect.height - margin);
    pos = { x: Math.max(margin, nx), y: Math.max(margin, ny) };
  });

  onMount(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (
        menuEl &&
        event.target instanceof Node &&
        menuEl.contains(event.target)
      )
        return;
      onClose();
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  });

  function handleSelect(item: ContextMenuItem) {
    item.onSelect();
    onClose();
  }
</script>

<div
  bind:this={menuEl}
  class="context-menu"
  role="menu"
  tabindex="-1"
  style={`left: ${pos.x}px; top: ${pos.y}px;`}
>
  {#each items as item (item.label)}
    <button
      type="button"
      role="menuitem"
      class="context-menu__item"
      onclick={() => handleSelect(item)}
    >
      {item.label}
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 160px;
    padding: 4px;
    background: var(--panel, #fff);
    border: 1px solid var(--line, rgba(33, 33, 32, 0.15));
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .context-menu__item {
    appearance: none;
    border: none;
    background: transparent;
    text-align: left;
    padding: 8px 12px;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    color: inherit;
    cursor: pointer;
  }

  .context-menu__item:hover {
    background: var(--accent, #824c32);
    color: #fff;
  }
</style>
