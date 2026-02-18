function registerIpcHandlers(ipcMain, db, controllers, { app, dialog, getMainWindow }) {
    const { InventoryController, ImportController } = controllers;

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
