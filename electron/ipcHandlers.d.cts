export function registerIpcHandlers(
    ipcMain: any,
    db: any,
    controllers: { InventoryController: any; ImportController: any },
    config: { app: any; dialog: any; getMainWindow: () => any }
): void;
