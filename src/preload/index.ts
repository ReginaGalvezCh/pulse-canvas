import { contextBridge, ipcRenderer } from 'electron';
import type { PulseBridge } from '../shared/contracts';

const bridge: PulseBridge = {
  configureAccess: apiKey => ipcRenderer.invoke('pulse:access', apiKey),
  capabilities: () => ipcRenderer.invoke('pulse:capabilities'),
  snapshot: () => ipcRenderer.invoke('pulse:snapshot'),
  start: request => ipcRenderer.invoke('pulse:start', request),
  stop: () => ipcRenderer.invoke('pulse:stop'),
  saveArtwork: bytes => ipcRenderer.invoke('pulse:save', bytes),
  onSession: callback => {
    const listener = (_event: Electron.IpcRendererEvent, value: Parameters<typeof callback>[0]) => callback(value);
    ipcRenderer.on('pulse:session', listener);
    return () => ipcRenderer.removeListener('pulse:session', listener);
  },
};
contextBridge.exposeInMainWorld('pulse', Object.freeze(bridge));
