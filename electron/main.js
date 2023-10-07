require('update-electron-app')()
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('node:path');
const url = require('node:url');
const Store = require('electron-store');
const store = new Store();

const customAboutPanel = () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'FlexPlayer',
    message: `FlexPlayer ${process.env.npm_package_version}`,
    detail:
      `Chrominium: ${process.versions.chrome}\n` +
      `Electron: ${process.versions.electron}\n` +
      `Node.js: ${process.versions.node}\n` +
      `V8: ${process.versions.v8}`
  });
};

const createLicenseWindow = (parentWindow) => {
  const licenseWindow = new BrowserWindow({
    parent: parentWindow,
    modal: true,
    show: false,
    title: 'Open Source Licenses',
    autoHideMenuBar: true,
  });
  licenseWindow.loadFile('licenses.html');
  licenseWindow.setMenu(null);
  return licenseWindow;
};

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: store.get('browserWindow.width') || 800,
    height: store.get('browserWindow.height') || 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  })
  mainWindow.on('resize', function() {
    const size = mainWindow.getSize();
    store.set('browserWindow.width', size[0]);
    store.set('browserWindow.height', size[1]);
  });
  mainWindow.loadFile('player/index.html');
  mainWindow.setMenu(Menu.buildFromTemplate([
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
          click: () => mainWindow.webContents.send('remove-all-video')
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
          label: 'OSS Licenses',
          click: () => createLicenseWindow(mainWindow).show()
        },
        {
          label: 'About',
          click: customAboutPanel
        }
      ]
    }
  ]));

  return mainWindow;
};

app.whenReady().then(() => {
  ipcMain.handle('node:pathToFileURL', async (event, path) => {
    return url.pathToFileURL(path).href;
  });

  createMainWindow();

  // TODO: only for MacOS?
  //app.on('activate', () => {
  //  if (BrowserWindow.getAllWindows().length === 0) {
  //    createMainWindow();
  //  }
  //});
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
