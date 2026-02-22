const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db.cjs');
const InventoryController = require('./controllers/InventoryController.cjs');
const ImportController = require('./controllers/ImportController.cjs');
const { registerIpcHandlers } = require('./ipcHandlers.cjs');

// --- PORTABLE DATA CONFIGURATION ---
const isDev = process.env.NODE_ENV === 'development';
let portableDataPath = app.getPath('userData'); // Default

if (!isDev) {
  try {
    portableDataPath = path.join(path.dirname(process.execPath), 'labcontrol_data');
    if (!fs.existsSync(portableDataPath)) {
      fs.mkdirSync(portableDataPath, { recursive: true });
    }
    app.setPath('userData', portableDataPath);
    console.log('[Portable] UserData path set to:', portableDataPath);
  } catch (error) {
    console.error('[Portable] Failed to set portable data path:', error);
  }
}

// Initialize Database
const dbPath = path.join(portableDataPath, 'labcontrol.db');
db.initDB(dbPath);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "LabControl - UMV",
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      webSecurity: true
    },
    autoHideMenuBar: true
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      setImmediate(() => { shell.openExternal(url); });
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });

  // Security: Prevent in-app navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register IPC Handlers
  registerIpcHandlers(ipcMain, db, { InventoryController, ImportController }, {
      app,
      dialog,
      getMainWindow: () => mainWindow
  });

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
