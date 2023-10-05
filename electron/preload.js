const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  pathToFileURL: (path) => {
    return ipcRenderer.invoke('node:pathToFileURL', path);
  },
  handleRemoveAllVideo: (callback) => {
    return ipcRenderer.on('remove-all-video', callback);
  }
});
