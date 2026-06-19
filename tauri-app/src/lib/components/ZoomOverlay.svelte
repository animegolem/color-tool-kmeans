<script lang="ts">
  import { zoomOverlay, closeZoomOverlay } from '../stores/ui';

  const overlay = $derived.by(() => $zoomOverlay);

  let container = $state<HTMLDivElement | null>(null);
  let contentWidth = $state(1);
  let contentHeight = $state(1);
  let scale = $state(1);
  let minScale = $state(1);
  let maxScale = $state(8);
  let offsetX = $state(0);
  let offsetY = $state(0);

  const pointers = new Map<number, { x: number; y: number }>();
  let lastPointer = $state<{ id: number; x: number; y: number } | null>(null);
  let pinchState = $state<{
    startDistance: number;
    startScale: number;
    centerContent: { x: number; y: number };
  } | null>(null);

  $effect(() => {
    if (!overlay) return;
    pointers.clear();
    lastPointer = null;
    pinchState = null;
    if (overlay.content.kind === 'svg') {
      contentWidth = overlay.content.width;
      contentHeight = overlay.content.height;
      requestAnimationFrame(fitContent);
    } else if (overlay.content.width && overlay.content.height) {
      contentWidth = overlay.content.width;
      contentHeight = overlay.content.height;
      requestAnimationFrame(fitContent);
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoomOverlay();
    };
    const handleResize = () => fitContent();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  });

  function fitContent() {
    if (!container || !contentWidth || !contentHeight) return;
    const rect = container.getBoundingClientRect();
    const fitScale = Math.min(rect.width / contentWidth, rect.height / contentHeight);
    minScale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
    maxScale = minScale * 8;
    scale = minScale;
    offsetX = (rect.width - contentWidth * scale) / 2;
    offsetY = (rect.height - contentHeight * scale) / 2;
  }

  function setScale(nextScale: number, anchor: { x: number; y: number }) {
    if (!container) return;
    const clamped = Math.min(Math.max(nextScale, minScale * 0.5), maxScale);
    const contentX = (anchor.x - offsetX) / scale;
    const contentY = (anchor.y - offsetY) / scale;
    scale = clamped;
    offsetX = anchor.x - contentX * scale;
    offsetY = anchor.y - contentY * scale;
  }

  function toContainerPoint(event: PointerEvent | WheelEvent) {
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function handlePointerDown(event: PointerEvent) {
    if (!container) return;
    container.setPointerCapture(event.pointerId);
    const point = toContainerPoint(event);
    pointers.set(event.pointerId, point);
    if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      pinchState = {
        startDistance: distance(p1, p2),
        startScale: scale,
        centerContent: {
          x: (center.x - offsetX) / scale,
          y: (center.y - offsetY) / scale
        }
      };
      lastPointer = null;
    } else {
      lastPointer = { id: event.pointerId, x: point.x, y: point.y };
      pinchState = null;
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    const point = toContainerPoint(event);
    pointers.set(event.pointerId, point);
    if (pinchState && pointers.size >= 2) {
      const [p1, p2] = Array.from(pointers.values());
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const newDistance = distance(p1, p2);
      const nextScale = pinchState.startScale * (newDistance / Math.max(1, pinchState.startDistance));
      scale = Math.min(Math.max(nextScale, minScale * 0.5), maxScale);
      offsetX = center.x - pinchState.centerContent.x * scale;
      offsetY = center.y - pinchState.centerContent.y * scale;
      return;
    }
    if (!lastPointer || lastPointer.id !== event.pointerId) return;
    offsetX += point.x - lastPointer.x;
    offsetY += point.y - lastPointer.y;
    lastPointer = { id: event.pointerId, x: point.x, y: point.y };
  }

  function handlePointerUp(event: PointerEvent) {
    if (!container) return;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchState = null;
    }
    if (pointers.size === 1) {
      const [id, point] = Array.from(pointers.entries())[0];
      lastPointer = { id, x: point.x, y: point.y };
    } else {
      lastPointer = null;
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const point = toContainerPoint(event);
    const zoom = Math.exp(-event.deltaY * 0.002);
    setScale(scale * zoom, point);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;
    closeZoomOverlay();
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    closeZoomOverlay();
  }

  function handleImageLoad(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    contentWidth = img.naturalWidth || contentWidth;
    contentHeight = img.naturalHeight || contentHeight;
    fitContent();
  }

  function handleReset() {
    fitContent();
  }
</script>

{#if overlay}
  <div
    class="overlay-root visible zoom-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleBackdropKeydown}
  >
    <div
      class="zoom-frame"
      bind:this={container}
      role="application"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
      onwheel={handleWheel}
      ondblclick={handleReset}
    >
      <div
        class="zoom-content"
        style={`width:${contentWidth}px;height:${contentHeight}px;transform:translate(${offsetX}px, ${offsetY}px) scale(${scale});`}
      >
        {#if overlay.content.kind === 'image'}
          <img src={overlay.content.src} alt={overlay.content.alt ?? 'Zoomed image'} onload={handleImageLoad} draggable="false" />
        {:else}
          <div class="zoom-svg" aria-hidden="true">
            {@html overlay.content.svg}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .zoom-overlay {
    background: rgba(26, 24, 22, 0.6);
    z-index: 30;
  }

  .zoom-frame {
    width: min(92vw, 1100px);
    height: min(92vh, 920px);
    background: rgba(245, 239, 225, 0.98);
    border: 1px solid rgba(58, 55, 55, 0.6);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    position: relative;
    touch-action: none;
  }

  .zoom-content {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }

  .zoom-content img {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }

  .zoom-svg :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }
</style>
