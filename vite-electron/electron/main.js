// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const url = require('url');

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: false,
//       contextIsolation: true
//     }
//   });

//   // Load the app
//   if (process.env.NODE_ENV === 'development') {
//     win.loadURL('http://localhost:5173');
//     win.webContents.openDevTools();
//   } else {
//     win.loadFile(path.join(__dirname, '../dist/index.html'));
//   }
// }

// app.whenReady().then(createWindow);

// // Quit when all windows are closed
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// // Reopen window on macOS
// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

const path = require('path');
const { app, BrowserWindow } = require('electron');
 
// const isDev = process.env.IS_DEV == "true" ? true : false;
const isDev = true 
 
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 650,
    autoHideMenuBar: true,
    resizable: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      webSecurity: false,
      contextIsolation: true
    },
  });
 
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });
 
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5000'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
 
}
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');
app.commandLine.appendSwitch('disable-features', 'AutofillEnableSupportForAddresses');

 
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});
 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});