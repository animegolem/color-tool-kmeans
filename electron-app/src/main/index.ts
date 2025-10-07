import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, dialog, Menu, nativeTheme } from 'electron';
import { join, basename, extname } from 'node:path';
import { promises as fs } from 'node:fs';
import { WorkerResponseType } from '../shared/messages.js';
import { processCompute } from '../worker/color-worker.js';

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;

const createWindow = async (): Promise<void> => {
  const windowOptions: BrowserWindowConstructorOptions = {
    width: 1280,
    height: 860,
    show: false,
    autoHideMenuBar: true,
    title: 'Color Abstract',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1b1d23' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  };

  const mainWindow = new BrowserWindow(windowOptions);

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    const indexPath = join(__dirname, '../renderer/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.warn(`[main] Renderer load failed (${errorCode}): ${errorDescription}`);
    if (devServerUrl) {
      setTimeout(() => {
        console.info('[main] Retrying renderer load…');
        mainWindow.webContents.loadURL(devServerUrl).catch((err) => {
          console.error('[main] Reload attempt failed', err);
        });
      }, 300);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.info('[main] Renderer finished loading');
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

const registerIpcHandlers = (): void => {
  ipcMain.handle('dialog:open', async (_event, options: Electron.OpenDialogOptions = {}) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      ...options
    });
    if (result.canceled) {
      return null;
    }
    const [filePath] = result.filePaths;
    return filePath ?? null;
  });

  ipcMain.handle('dialog:save', async (_event, options: Electron.SaveDialogOptions = {}) => {
    const result = await dialog.showSaveDialog(options);
    if (result.canceled) {
      return null;
    }
    return result.filePath ?? null;
  });

  ipcMain.handle('file:save-binary', async (_event, payload: { data: number[]; options?: Electron.SaveDialogOptions }) => {
    const result = await dialog.showSaveDialog(payload.options ?? {});
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    const buffer = Buffer.from(Uint8Array.from(payload.data));
    await fs.writeFile(result.filePath, buffer);
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('file:save-text', async (_event, payload: { text: string; options?: Electron.SaveDialogOptions }) => {
    const result = await dialog.showSaveDialog(payload.options ?? {});
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    await fs.writeFile(result.filePath, payload.text, 'utf8');
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('file:open-image', async (_event, options: Electron.OpenDialogOptions = {}) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }
      ],
      ...options
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    return {
      canceled: false,
      file: {
        name: basename(filePath),
        path: filePath,
        mimeType: inferMimeType(filePath),
        size: buffer.byteLength,
        lastModified: stats.mtimeMs,
        data: Array.from(buffer)
      }
    } satisfies { canceled: boolean; file?: { name: string; path?: string; mimeType?: string; size?: number; lastModified?: number; data?: number[] } };
  });

  ipcMain.handle('compute:analyze', async (_event, payload: {
    dataset: { width: number; height: number; pixels: Uint8Array | number[] };
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
  }) => {
    if (!payload || !payload.dataset || !payload.params) {
      throw new Error('Invalid compute payload');
    }

    const { dataset, params } = payload;
    const pixelsSource = dataset.pixels;
    const pixels = pixelsSource instanceof Uint8Array ? pixelsSource : Array.isArray(pixelsSource) ? Uint8Array.from(pixelsSource) : new Uint8Array();
    const buffer = pixels.buffer.slice(pixels.byteOffset, pixels.byteOffset + pixels.byteLength);

    const response = processCompute({
      id: `ipc-${Date.now()}`,
      pixels: buffer,
      width: dataset.width,
      height: dataset.height,
      stride: params.stride,
      minLum: params.minLum,
      space: params.space,
      k: params.k,
      maxIter: params.maxIter,
      tol: params.tol,
      warmStart: undefined,
      seed: params.seed,
      maxSamples: params.maxSamples,
      exclude: 0
    });

    if (response.type === WorkerResponseType.ERROR) {
      const message = response.payload?.message ?? 'Compute failed';
      throw new Error(message);
    }

    if (response.type === WorkerResponseType.CANCELLED) {
      throw new Error('Computation cancelled');
    }

    const result = response.payload ?? {};
    const clusters = Array.isArray(result.clusters)
      ? result.clusters.map((cluster: any) => ({
          count: cluster.count ?? 0,
          share: cluster.share ?? 0,
          centroidSpace: Array.from(cluster.centroidSpace ?? []),
          rgb: cluster.rgb ?? { r: 0, g: 0, b: 0 },
          hsv: Array.from(cluster.hsv ?? [])
        }))
      : [];

    return {
      clusters,
      iterations: result.iterations ?? 0,
      durationMs: result.durationMs ?? 0,
      totalSamples: result.totalSamples ?? 0,
      variant: 'electron-native'
    } satisfies {
      clusters: Array<{ count: number; share: number; centroidSpace: number[]; rgb: { r: number; g: number; b: number }; hsv: number[] }>;
      iterations: number;
      durationMs: number;
      totalSamples: number;
      variant: string;
    };
  });
};

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp'
};

function inferMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

const buildMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Color Abstract',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'reload' }, { role: 'toggleDevTools' }] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(async () => {
  registerIpcHandlers();
  buildMenu();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
