function registerIpcHandlers(ipcMain, db, controllers, { app, dialog, getMainWindow }) {
    const { InventoryController, ImportController } = controllers;

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('db:ping', () => ({ success: true, message: "Connected to Local SQLite" }));
    // db:read-full removed for security
    ipcMain.handle('db:read-inventory', () => ({ success: true, data: db.getDenormalizedInventory() }));

    // CAS API Handler (Server-side Proxy)
    ipcMain.handle('cas:fetch-chemical-data', async (_, casNumber) => {
        const apiKey = process.env.VITE_CAS_API_KEY || process.env.CAS_API_KEY;
        if (!apiKey) {
            console.warn('[CAS] No API Key found in environment (VITE_CAS_API_KEY or CAS_API_KEY)');
            return null;
        }

        try {
            const response = await fetch(`https://commonchemistry.cas.org/api/detail?cas_rn=${casNumber}`, {
                headers: { 'X-API-KEY': apiKey }
            });

            if (!response.ok) {
                // 404 is expected for invalid/unknown CAS
                if (response.status !== 404) {
                    console.warn(`[CAS] API Error: ${response.status}`);
                }
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('[CAS] Network error:', error);
            return null;
        }
    });

    // Transactional Writes via Controllers
    ipcMain.handle('db:upsert-item', (_, payload) => InventoryController.upsertItem(payload.item));
    ipcMain.handle('db:delete-item', (_, payload) => InventoryController.deleteItem(payload.id));
    ipcMain.handle('db:log-movement', (_, payload) => InventoryController.logMovement(payload.record));
    ipcMain.handle('db:sync-transaction', (_, payload) => ImportController.handleSyncTransaction(payload));

    // Backup Handler
    ipcMain.handle('db:backup', async () => {
        const mainWindow = getMainWindow ? getMainWindow() : null;
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
}

module.exports = { registerIpcHandlers };
