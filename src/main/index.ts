import { app, BrowserWindow, dialog, ipcMain, nativeImage, session, systemPreferences } from 'electron';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';
import { startSchema } from '../shared/contracts';
import { SessionService } from './session';
import { validatePng } from './export';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
if (!app.isPackaged) config({ path: join(app.getAppPath(), '.env'), quiet: true });
let window: BrowserWindow | null = null;
let service: SessionService;
let quitting = false;

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window = new BrowserWindow({ width: 1380, height: 900, minWidth: 920, minHeight: 680, backgroundColor: '#f4f1e9', title: 'Pulse Canvas',
    webPreferences: { preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, contextIsolation: true, sandbox: true, nodeIntegration: false, devTools: !app.isPackaged } });
  service = new SessionService(state => { if (window && !window.isDestroyed()) window.webContents.send('pulse:session', state); }, process.env.PRESAGE_API_KEY);
  delete process.env.PRESAGE_API_KEY;
  const handle = (channel: string, callback: (value: unknown) => unknown) => ipcMain.handle(channel, (event, value) => {
    if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Untrusted request.');
    return callback(value);
  });
  handle('pulse:capabilities', () => service.capabilities());
  handle('pulse:access', value => service.configureAccess(z.string().trim().min(8).max(512).parse(value)));
  handle('pulse:snapshot', () => service.snapshot());
  handle('pulse:start', async value => {
    const request = startSchema.parse(value);
    if (request.source === 'live' && process.platform === 'darwin') {
      const allowed = await systemPreferences.askForMediaAccess('camera');
      if (!allowed) throw new Error('Camera permission was not granted.');
    }
    return service.start(request);
  });
  handle('pulse:stop', () => service.stop());
  handle('pulse:save', async value => {
    const bytes = validatePng(value);
    const image = nativeImage.createFromBuffer(bytes);
    if (image.isEmpty()) throw new Error('Artwork could not be decoded.');
    const result = await dialog.showSaveDialog(window!, { title: 'Keep your painting', defaultPath: 'pulse-canvas.png', filters: [{ name: 'PNG artwork', extensions: ['png'] }] });
    if (result.canceled || !result.filePath) return { saved: false };
    // Re-encode to discard all caller-supplied metadata and ancillary chunks.
    await writeFile(result.filePath, image.toPNG());
    return { saved: true };
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('render-process-gone', () => { void service.stop(); });
  window.on('closed', () => { window = null; app.quit(); });
  void window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
});

app.on('before-quit', event => {
  if (quitting || !service) return;
  event.preventDefault();
  void service.stop().finally(() => { quitting = true; app.quit(); });
});
app.on('window-all-closed', () => app.quit());
