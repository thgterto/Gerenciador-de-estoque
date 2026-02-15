const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db.cjs');
const InventoryController = require('./controllers/InventoryController.cjs');
const ImportController = require('./controllers/ImportController.cjs');

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
    // 1. External URLs -> System Browser
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    // 2. Allowed Internal Popups (Printing uses about:blank)
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true // Ensure sandbox is on for the popup
          }
        }
      };
    }

    // 3. Block everything else (file://, javascript:, etc.)
    console.warn('Blocked popup with URL:', url);
    return { action: 'deny' };
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

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('db:ping', () => ({ success: true, message: "Connected to Local SQLite" }));
ipcMain.handle('db:read-full', () => ({ success: true, data: db.readFullDB() }));
ipcMain.handle('db:read-inventory', () => ({ success: true, data: db.getDenormalizedInventory() }));

// Transactional Writes via Controllers
ipcMain.handle('db:upsert-item', (_, payload) => InventoryController.upsertItem(payload.item));
ipcMain.handle('db:delete-item', (_, payload) => InventoryController.deleteItem(payload.id));
ipcMain.handle('db:log-movement', (_, payload) => InventoryController.logMovement(payload.record));
ipcMain.handle('db:sync-transaction', (_, payload) => ImportController.handleSyncTransaction(payload));

// Backup Handler
ipcMain.handle('db:backup', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar Backup do Sistema',
        defaultPath: `LabControl_Backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });

    if (canceled || !filePath) {
        return { success: false, error: 'Cancelled by user' };
    }

    return await db.backupDB(filePath);
});
