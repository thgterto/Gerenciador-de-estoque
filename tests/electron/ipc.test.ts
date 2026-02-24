import { describe, it, expect, vi } from 'vitest';
import { registerIpcHandlers } from '../../electron/ipcHandlers.cjs';

describe('Electron IPC Handlers', () => {
  it('should register all handlers', () => {
    const ipcMain = { handle: vi.fn() };
    const db = {};
    const controllers = { InventoryController: {}, ImportController: {} };
    const config = { app: { getVersion: vi.fn() }, dialog: {}, getMainWindow: vi.fn() };

    registerIpcHandlers(ipcMain as any, db as any, controllers as any, config as any);

    expect(ipcMain.handle).toHaveBeenCalledWith('get-app-version', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:ping', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:read-full', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:read-inventory', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:upsert-item', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:delete-item', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:log-movement', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:sync-transaction', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('db:backup', expect.any(Function));
  });

  it('db:ping should return success', () => {
    const ipcHandlers = new Map();
    const ipcMain = {
        handle: (channel: string, handler: any) => ipcHandlers.set(channel, handler)
    };

    const db = {};
    const controllers = { InventoryController: {}, ImportController: {} };
    const config = { app: { getVersion: vi.fn() }, dialog: {}, getMainWindow: vi.fn() };

    registerIpcHandlers(ipcMain as any, db as any, controllers as any, config as any);

    const handler = ipcHandlers.get('db:ping');
    expect(handler()).toEqual({ success: true, message: "Connected to Local SQLite" });
  });

  it('db:read-inventory should call db.getDenormalizedInventory', () => {
    const ipcHandlers = new Map();
    const ipcMain = {
        handle: (channel: string, handler: any) => ipcHandlers.set(channel, handler)
    };

    const mockInventory = [{ id: 1, name: 'Test Item' }];
    const db = {
        getDenormalizedInventory: vi.fn().mockReturnValue(mockInventory),
        readFullDB: vi.fn(),
        backupDB: vi.fn()
    };
    const controllers = { InventoryController: {}, ImportController: {} };
    const config = { app: { getVersion: vi.fn() }, dialog: {}, getMainWindow: vi.fn() };

    registerIpcHandlers(ipcMain as any, db as any, controllers as any, config as any);

    const handler = ipcHandlers.get('db:read-inventory');
    const result = handler();

    expect(db.getDenormalizedInventory).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: mockInventory });
  });

  it('get-app-version should call app.getVersion', () => {
    const ipcHandlers = new Map();
    const ipcMain = {
        handle: (channel: string, handler: any) => ipcHandlers.set(channel, handler)
    };

    const db = {};
    const controllers = { InventoryController: {}, ImportController: {} };
    const config = {
        app: { getVersion: vi.fn().mockReturnValue('1.2.3') },
        dialog: {},
        getMainWindow: vi.fn()
    };

    registerIpcHandlers(ipcMain as any, db as any, controllers as any, config as any);

    const handler = ipcHandlers.get('get-app-version');
    const result = handler();

    expect(config.app.getVersion).toHaveBeenCalled();
    expect(result).toBe('1.2.3');
  });

  it('excel:send-data should call fetch with correct payload', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
    });
    // Mock process.env
    process.env.POWER_AUTOMATE_WEBHOOK_URL = 'http://mock-webhook';

    const ipcHandlers = new Map();
    const ipcMain = {
        handle: (channel: string, handler: any) => ipcHandlers.set(channel, handler)
    };

    const db = {};
    const controllers = { InventoryController: {}, ImportController: {} };
    const config = { app: { getVersion: vi.fn() }, dialog: {}, getMainWindow: vi.fn() };

    registerIpcHandlers(ipcMain as any, db as any, controllers as any, config as any);

    const handler = ipcHandlers.get('excel:send-data');
    const payload = { name: 'Test User', email: 'test@example.com' };

    const result = await handler({}, payload);

    expect(global.fetch).toHaveBeenCalledWith('http://mock-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    expect(result).toEqual({ success: true });
  });
});
