import { getBridgeOverride, tauriDetectionInfo } from '../../bridges/tauri';
import type { DevBannerDetails } from './dev-banner-types';

interface DevBannerControllerDeps {
  devEnabled: boolean;
  getCurrentData: () => DevBannerDetails | null;
  setData: (details: DevBannerDetails) => void;
  setVisible: (visible: boolean) => void;
}

export function createDevBannerController(deps: DevBannerControllerDeps) {
  let fileLogged = false;
  let analysisLogged = false;

  function ensureDetails(): DevBannerDetails {
    const base =
      deps.getCurrentData() ?? ({
        detection: tauriDetectionInfo(),
        override: getBridgeOverride()
      } as DevBannerDetails);
    return {
      ...base,
      detection: tauriDetectionInfo(),
      override: getBridgeOverride()
    };
  }

  function recordDevEvent(update: Partial<DevBannerDetails>, type: 'file' | 'analysis') {
    if (!deps.devEnabled) return;
    const details = { ...ensureDetails(), ...update };
    deps.setData(details);

    const shouldShow = (type === 'file' && !fileLogged) || (type === 'analysis' && !analysisLogged);
    if (shouldShow) {
      deps.setVisible(true);
      console.info('[dev] tauri detection', {
        detection: details.detection,
        override: details.override,
        fsBridge: details.fsBridge ?? 'pending',
        computeBridge: details.computeVariant ?? 'pending'
      });
    }

    if (type === 'file') {
      fileLogged = true;
    } else {
      analysisLogged = true;
    }
  }

  function dismissDevBanner() {
    deps.setVisible(false);
  }

  return {
    recordDevEvent,
    dismissDevBanner
  };
}
