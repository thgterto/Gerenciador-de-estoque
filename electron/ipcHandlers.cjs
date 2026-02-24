const fs = require('fs');
const path = require('path');

function getEnvVar(key) {
    if (process.env[key]) return process.env[key];

    // Try reading .env file manually
    try {
        const envPath = path.resolve(__dirname, '../.env'); // Assuming electron/ is one level deep
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
            if (match) return match[1].trim();
        }
    } catch (e) {
        console.error('Failed to read .env:', e);
    }
    return null;
}

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

    // Excel / Power Automate Integration
    ipcMain.handle('excel:send-data', async (_, payload) => {
        const webhookUrl = getEnvVar('POWER_AUTOMATE_WEBHOOK_URL');
        if (!webhookUrl) {
            return { success: false, error: 'Webhook URL not configured' };
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Power Automate Error: ${response.status} ${text}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Excel Integration Error:', error);
            return { success: false, error: error.message };
        }
    });

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
