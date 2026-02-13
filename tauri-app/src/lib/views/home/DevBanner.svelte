<script lang="ts">
  import { tauriDetectionInfo, getBridgeOverride } from '../../bridges/tauri';

  interface DevBannerDetails {
    detection: ReturnType<typeof tauriDetectionInfo>;
    override: string | null;
    fsBridge?: string;
    computeVariant?: string;
  }

  interface Props {
    data: DevBannerDetails;
    onDismiss: () => void;
  }

  let { data, onDismiss }: Props = $props();
</script>

<aside class="dev-banner" role="status" aria-label="Tauri detection summary">
  <div class="dev-banner__header">
    <strong>Dev detection</strong>
    <button class="dev-banner__close" type="button" onclick={onDismiss}>
      Dismiss
    </button>
  </div>
  <div class="dev-banner__grid">
    <div>
      <span class="dev-banner__label">Override</span>
      <span>{data.override ?? 'none'}</span>
    </div>
    <div>
      <span class="dev-banner__label">FS bridge</span>
      <span>{data.fsBridge ?? 'pending'}</span>
    </div>
    <div>
      <span class="dev-banner__label">Compute</span>
      <span>{data.computeVariant ?? 'pending'}</span>
    </div>
  </div>
  <details>
    <summary>Detection info</summary>
    <pre>{JSON.stringify(data.detection, null, 2)}</pre>
  </details>
</aside>

<style>
  .dev-banner {
    margin: 12px 0 20px 0;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(33, 33, 32, 0.08);
    border: 1px solid rgba(33, 33, 32, 0.12);
  }

  .dev-banner__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .dev-banner__close {
    border: none;
    background: transparent;
    color: var(--accent);
    font-size: 13px;
    cursor: pointer;
  }

  .dev-banner__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 8px;
  }

  .dev-banner__label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.6;
  }

  .dev-banner details {
    margin-top: 4px;
    font-size: 12px;
  }

  .dev-banner pre {
    margin: 6px 0 0 0;
    padding: 8px;
    border-radius: 6px;
    background: rgba(33, 33, 32, 0.08);
    max-height: 200px;
    overflow: auto;
  }
</style>
