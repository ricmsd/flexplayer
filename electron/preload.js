const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  pathToFileURL: (path) => {
    console.log('path', path);
    return ipcRenderer.invoke('node:pathToFileURL', path);
  }
});
