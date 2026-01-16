const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png') // Assuming an icon exists, or remove if not
  });

  // In production, load the local index.html
  // In dev, you might want to load http://localhost:5173, but for this "portable" goal, we focus on the built artifact.
  if (app.isPackaged) {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
      // Fallback for local testing if running electron directly against source
      // But usually we build then run.
      // Let's check if dist exists, otherwise try localhost
      win.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
          console.log('Dist not found, trying localhost...');
          win.loadURL('http://localhost:5173');
      });
  }
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
