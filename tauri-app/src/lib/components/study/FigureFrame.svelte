<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    controls?: Snippet;
    content?: Snippet;
    caption?: Snippet;
  }

  let { title, controls, content, caption }: Props = $props();
</script>

<figure class="study-figure-frame">
  <header class="study-figure-frame__header">
    <h2>{title}</h2>
    {#if controls}
      <div
        class="study-figure-frame__controls"
        aria-label={`${title} controls`}
      >
        {@render controls()}
      </div>
    {/if}
  </header>

  {#if content}
    <div class="study-figure-frame__content">
      {@render content()}
    </div>
  {/if}

  {#if caption}
    <figcaption class="study-figure-frame__caption">
      {@render caption()}
    </figcaption>
  {/if}
</figure>
