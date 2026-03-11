const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Token storage using OS keychain
    storeToken: (token) => ipcRenderer.invoke('store-token', token),
    getToken: () => ipcRenderer.invoke('get-token'),
    removeToken: () => ipcRenderer.invoke('remove-token'),

    // Environment detection
    isElectron: () => true
});
