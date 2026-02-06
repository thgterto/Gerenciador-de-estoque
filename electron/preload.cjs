const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Generic request handler to match GoogleSheetsService structure
  request: (action, payload) => {
    const channelMap = {
        'ping': 'db:ping',
        'read_full_db': 'db:read-full',
        'read_inventory': 'db:read-inventory',
        'upsert_item': 'db:upsert-item',
        'delete_item': 'db:delete-item',
        'log_movement': 'db:log-movement',
        'sync_transaction': 'db:sync-transaction'
    };

    const channel = channelMap[action];
    if (channel) {
        return ipcRenderer.invoke(channel, payload);
    }
    return Promise.reject(new Error("Unknown IPC action: " + action));
  }
});
