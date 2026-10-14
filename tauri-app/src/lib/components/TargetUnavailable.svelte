<script lang="ts">
  interface Props {
    capability: 'Values' | 'Batch' | 'Exports';
  }

  let { capability }: Props = $props();
</script>

<section
  class="target-unavailable"
  data-target-unavailable={capability.toLowerCase()}
  role="status"
  aria-live="polite"
>
  <h2>{capability} is unavailable in the browser</h2>
  <p>
    This capability currently depends on the Color Tool desktop runtime. The
    route stays visible so its availability is explicit; no desktop action was
    attempted.
  </p>
</section>

<style>
  .target-unavailable {
    max-width: 640px;
    margin: 48px auto;
    padding: 28px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--panel);
    box-shadow: var(--shadow);
  }

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: rgba(33, 33, 32, 0.68);
    line-height: 1.55;
  }
</style>
