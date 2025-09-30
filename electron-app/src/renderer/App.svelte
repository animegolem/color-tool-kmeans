<script lang="ts">
  const status = $state('Electron shell ready');
  const instructions = $derived(`Run npm run electron:dev to start the app with HMR. Build artifacts via npm run electron:build.`);
</script>

<main class="container">
  <section class="card">
    <h1>Color Abstract Electron Shell</h1>
    <p>{status}</p>
    <p class="hint">{instructions}</p>
  </section>
</main>

<style>
  .container {
    width: min(480px, 90%);
    margin: 0 auto;
    padding: 32px;
    background: var(--color-background-elevated);
    border-radius: var(--radius-md);
    box-shadow: 0 18px 36px rgba(17, 26, 48, 0.12);
  }

  h1 {
    margin: 0 0 12px;
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    margin: 0 0 8px;
    line-height: 1.5;
  }

  .hint {
    color: rgba(27, 29, 35, 0.7);
    font-size: 0.9rem;
  }
</style>
