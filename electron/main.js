require('update-electron-app')()
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('node:path');
const url = require('node:url');
const Store = require('electron-store');
const store = new Store();

const customAboutPanel = () => {
  dialog.showMessageBox({
    title: 'FlexPlayer',
    message: `FlexPlayer ${process.env.npm_package_version}`,
    detail:
      `Chrominium: ${process.versions.chrome}\n` +
      `Electron: ${process.versions.electron}\n` +
      `Node.js: ${process.versions.node}\n` +
      `V8: ${process.versions.v8}`
  });
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: store.get('browserWindow.width') || 800,
    height: store.get('browserWindow.height') || 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  })
  win.on('resize', function() {
    const size = win.getSize();
    store.set('browserWindow.width', size[0]);
    store.set('browserWindow.height', size[1]);
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          role: 'quit'
        }
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Remove all video',
          click: () => win.webContents.send('remove-all-video')
        },
        {
          label: 'Fullscreen',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'DevTools',
          role: 'toggleDevTools'
        },
        {
          label: 'About',
          click: customAboutPanel
        }
      ]
    }
  ]));

  win.loadFile('player/index.html');
  //win.webContents.openDevTools();
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
