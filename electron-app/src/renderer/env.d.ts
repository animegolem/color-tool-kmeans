import type { ElectronApi } from '../preload';

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}

export {};
