const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// --- PORTABLE DATA CONFIGURATION ---
// In production (packaged), store data in a 'labcontrol_data' folder next to the executable.
// This allows the app to be moved between computers with its data intact.
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  try {
    // process.execPath is the path to the executable file.
    // path.dirname gives the folder containing the executable.
    const portableDataPath = path.join(path.dirname(process.execPath), 'labcontrol_data');

    // Create the directory if it doesn't exist
    if (!fs.existsSync(portableDataPath)) {
      fs.mkdirSync(portableDataPath, { recursive: true });
    }

    // Redirect Electron's userData (IndexedDB, LocalStorage, Logs, Cache)
    app.setPath('userData', portableDataPath);
    console.log(`[Portable] UserData path set to: ${portableDataPath}`);
  } catch (error) {
    console.error('[Portable] Failed to set portable data path:', error);
    // Fallback to default %APPDATA% if write fails (e.g. read-only media)
  }
}

// Prevent garbage collection
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

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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

// IPC Examples (if needed for printing or file system)
ipcMain.handle('get-app-version', () => app.getVersion());
