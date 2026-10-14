<script lang="ts">
  import {
    dismissPreferenceWarning,
    preferencePersistenceWarning,
  } from '../stores/preferences';
</script>

{#if $preferencePersistenceWarning}
  <aside
    class="preference-status"
    data-preference-operation={$preferencePersistenceWarning.operation}
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <p>{$preferencePersistenceWarning.message}</p>
    <button type="button" onclick={dismissPreferenceWarning}>Dismiss</button>
  </aside>
{/if}

<style>
  .preference-status {
    position: fixed;
    z-index: 120;
    right: 20px;
    bottom: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: min(520px, calc(100vw - 40px));
    padding: 12px 14px;
    border: 1px solid rgba(138, 31, 43, 0.35);
    border-radius: 8px;
    background: #fff7f7;
    box-shadow: var(--shadow);
    color: #681722;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  button {
    min-height: 36px;
    padding: 6px 12px;
    border: 1px solid currentColor;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  @media (max-width: 520px) {
    .preference-status {
      right: 12px;
      bottom: 12px;
      left: 12px;
      max-width: none;
    }
  }
</style>
