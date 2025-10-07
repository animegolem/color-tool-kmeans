import { contextBridge, ipcRenderer } from 'electron';

type OpenDialogOptions = Electron.OpenDialogOptions;
type SaveDialogOptions = Electron.SaveDialogOptions;

type AnalyzeRequest = {
  dataset: {
    width: number;
    height: number;
    pixels: Uint8Array;
  };
  params: {
    k: number;
    stride: number;
    minLum: number;
    space: string;
    tol: number;
    maxIter: number;
    seed: number;
    maxSamples: number;
  };
};

type AnalyzeResponse = {
  clusters: Array<{
    count: number;
    share: number;
    centroidSpace: number[];
    rgb: { r: number; g: number; b: number };
    hsv: number[];
  }>;
  iterations: number;
  durationMs: number;
  totalSamples: number;
  variant?: string;
};

type OpenImageResponse = {
  canceled: boolean;
  file?: {
    name: string;
    path?: string;
    mimeType?: string;
    size?: number;
    lastModified?: number;
    data?: number[];
  };
};

const api = {
  openFile: (options?: OpenDialogOptions): Promise<string | null> => ipcRenderer.invoke('dialog:open', options ?? {}),
  saveFileDialog: (options?: SaveDialogOptions): Promise<string | null> => ipcRenderer.invoke('dialog:save', options ?? {}),
  saveBinaryFile: (data: Uint8Array, options?: SaveDialogOptions) => ipcRenderer.invoke('file:save-binary', {
    data: Array.from(data),
    options: options ?? {}
  }),
  saveTextFile: (text: string, options?: SaveDialogOptions) => ipcRenderer.invoke('file:save-text', {
    text,
    options: options ?? {}
  }),
  openImageFile: (options?: OpenDialogOptions): Promise<OpenImageResponse> => ipcRenderer.invoke('file:open-image', options ?? {}),
  analyzeImage: (payload: AnalyzeRequest): Promise<AnalyzeResponse> => ipcRenderer.invoke('compute:analyze', payload)
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronApi = typeof api;
