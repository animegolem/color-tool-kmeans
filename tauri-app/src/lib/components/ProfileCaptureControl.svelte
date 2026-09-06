<script lang="ts">
  import { onMount } from 'svelte';
  import {
    initializeRendererProfileTrace,
    type ProfileFinishState,
    type RendererProfileTrace,
  } from '../profiling/trace';

  const READY_STATE: ProfileFinishState = Object.freeze({
    phase: 'ready',
    rendererOpenCount: 0,
    nativeOpenCount: 0,
    errorCode: null,
    receipt: null,
    retryable: false,
  });

  let trace = $state.raw<RendererProfileTrace | null>(null);
  let finishState = $state.raw<ProfileFinishState>(READY_STATE);
  let initializing = $state(true);

  const working = $derived(finishState.phase === 'in-progress');
  const canFinish = $derived(
    finishState.phase === 'ready' ||
      finishState.phase === 'renderer-pending' ||
      finishState.phase === 'native-pending'
  );
  const actionLabel = $derived(
    finishState.retryable ? 'Retry finish' : 'Finish capture'
  );
  const statusText = $derived.by(() => {
    switch (finishState.phase) {
      case 'ready':
        return 'Profiling launch enabled';
      case 'in-progress':
        return 'Finishing trace…';
      case 'renderer-pending':
        return `Waiting for ${finishState.rendererOpenCount} renderer action(s)`;
      case 'native-pending':
        return `Waiting for ${finishState.nativeOpenCount} native action(s)`;
      case 'sealed':
        return 'Trace sealed · validation pending';
      case 'sealed-with-loss':
        return 'Trace sealed with loss · not usable';
      case 'continuity-unverified':
        return 'Trace sealed · continuity unverified';
      case 'failed':
        return `Capture failed · ${finishState.errorCode ?? 'profile-finalize-receipt-invalid'}`;
    }
  });

  onMount(() => {
    void initializeRendererProfileTrace()
      .then((value) => {
        trace = value;
      })
      .catch(() => {
        trace = null;
      })
      .finally(() => {
        initializing = false;
      });
  });

  async function finishCapture() {
    if (!trace || !canFinish || working) return;
    finishState = Object.freeze({
      phase: 'in-progress',
      rendererOpenCount: 0,
      nativeOpenCount: 0,
      errorCode: null,
      receipt: null,
      retryable: false,
    });
    finishState = await trace.finishCapture();
  }
</script>

{#if !initializing && trace}
  <div class="profile-capture-control" data-profile-capture-control>
    <span role="status" aria-live="polite">{statusText}</span>
    <button
      type="button"
      onclick={finishCapture}
      disabled={!canFinish || working}
    >
      {actionLabel}
    </button>
  </div>
{/if}

<style>
  .profile-capture-control {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin-left: auto;
    color: rgba(33, 33, 32, 0.68);
    font-size: 10px;
    white-space: nowrap;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button {
    flex-shrink: 0;
    padding: 4px 7px;
    border: 1px solid rgba(33, 33, 32, 0.18);
    border-radius: 5px;
    background: transparent;
    color: inherit;
    font: inherit;
  }

  button:not(:disabled):hover {
    background: rgba(33, 33, 32, 0.06);
    color: var(--ink);
  }

  button:disabled {
    opacity: 0.55;
  }
</style>
