const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const url = require('node:url');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile('player/index.html');
  //mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  ipcMain.handle('node:pathToFileURL', async (event, path) => {
    return url.pathToFileURL(path).href;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
