import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, dialog, Menu, nativeTheme } from 'electron';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';

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
};

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
