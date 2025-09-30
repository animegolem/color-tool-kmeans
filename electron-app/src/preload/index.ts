import { contextBridge, ipcRenderer } from 'electron';

type OpenDialogOptions = Electron.OpenDialogOptions;
type SaveDialogOptions = Electron.SaveDialogOptions;

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
  })
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronApi = typeof api;
