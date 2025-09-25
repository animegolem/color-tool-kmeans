<script lang="ts">
  const props = $props<{
    visible?: boolean;
    title?: string | null;
    dismissable?: boolean;
    onDismiss?: () => void;
  }>();

  const visible = $derived(props.visible ?? false);
  const title = $derived(props.title ?? null);
  const dismissable = $derived(props.dismissable ?? false);
  const onDismiss = $derived(props.onDismiss);
</script>

<div class:visible={visible()} class="overlay-root">
  <div class="overlay-panel">
    {#if title()}
      <h3 style="margin-top:0">{title()}</h3>
    {/if}
    <slot />
    {#if dismissable()}
      <div class="overlay-actions" style="margin-top:16px">
        <button class="close-btn" onclick={() => onDismiss()?.()}>Close</button>
      </div>
    {/if}
  </div>
  <slot name="backdrop" />
  <slot name="decoration" />
</div>

<style>
  /* Styles centralized in app.css overlay-* rules */
</style>
