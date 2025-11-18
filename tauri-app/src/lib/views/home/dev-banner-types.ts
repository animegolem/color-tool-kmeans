import type { tauriDetectionInfo } from '../../bridges/tauri';

export type DetectionInfo = ReturnType<typeof tauriDetectionInfo>;

export interface DevBannerDetails {
  detection: DetectionInfo;
  override: string | null;
  fsBridge?: string;
  computeVariant?: string;
}
