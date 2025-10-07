<script lang="ts">
  import type { Snippet } from 'svelte';

  const props = $props<{
    visible?: boolean;
    title?: string | null;
    dismissable?: boolean;
    onDismiss?: () => void;
    content?: Snippet;
    backdrop?: Snippet;
    decoration?: Snippet;
  }>();

  const visible = $derived(props.visible ?? false);
  const title = $derived(props.title ?? null);
  const dismissable = $derived(props.dismissable ?? false);
  const onDismiss = $derived(props.onDismiss);
</script>

{#if visible()}
  <div class="overlay-root visible">
    <div class="overlay-panel">
      {#if title()}
        <h3 style="margin-top:0">{title()}</h3>
      {/if}
      {@render props.content?.({})}
      {#if dismissable()}
        <div class="overlay-actions" style="margin-top:16px">
          <button class="close-btn" onclick={() => onDismiss()?.()}>Close</button>
        </div>
      {/if}
    </div>
    {@render props.backdrop?.({})}
    {@render props.decoration?.({})}
  </div>
{/if}

<style>
  /* Styles centralized in app.css overlay-* rules */
</style>
