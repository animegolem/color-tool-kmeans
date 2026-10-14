<script lang="ts">
  import { getFeedbackSemantics, type FeedbackState } from './feedback-state';

  interface Props {
    state: FeedbackState;
    onAction?: (key: string) => void;
  }

  let { state, onAction }: Props = $props();
</script>

<section
  class="study-feedback"
  data-feedback-kind={state.kind}
  aria-label={state.title}
  aria-busy={getFeedbackSemantics(state).busy ? 'true' : undefined}
>
  <h3>{state.title}</h3>
  <p
    class="study-feedback__announcement"
    role={getFeedbackSemantics(state).announcementRole}
    aria-live={getFeedbackSemantics(state).announcementLive}
    aria-atomic="true"
  >
    {state.message}
  </p>

  {#if state.requestProvenance}
    <dl data-feedback-provenance="request">
      <dt>Current request source</dt>
      <dd>{state.requestProvenance.sourceLabel}</dd>
      <dt>Current request settings</dt>
      <dd>{state.requestProvenance.settingsLabel}</dd>
    </dl>
  {/if}

  {#if state.visibleResultProvenance}
    <dl data-feedback-provenance="visible-result">
      <dt>Visible result source</dt>
      <dd>{state.visibleResultProvenance.sourceLabel}</dd>
      <dt>Visible result settings</dt>
      <dd>{state.visibleResultProvenance.settingsLabel}</dd>
    </dl>
  {/if}

  {#if state.actions?.length}
    <div class="study-feedback__actions">
      {#each state.actions as action (action.key)}
        <button
          type="button"
          data-feedback-action={action.key}
          data-emphasis={action.emphasis ?? 'normal'}
          onclick={() => onAction?.(action.key)}
        >
          {action.label}
        </button>
      {/each}
    </div>
  {/if}
</section>
