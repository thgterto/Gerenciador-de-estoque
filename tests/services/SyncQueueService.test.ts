// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncQueueService } from '../../src/services/SyncQueueService';
import { GoogleSheetsService } from '../../src/services/GoogleSheetsService';
import { db } from '../../src/db';

// Mock dependencies
vi.mock('../../src/services/GoogleSheetsService', () => ({
    GoogleSheetsService: {
        isConfigured: vi.fn(),
        request: vi.fn()
    }
}));

vi.mock('../../src/db', () => ({
    db: {
        rawDb: {
            syncQueue: {
                add: vi.fn(),
                count: vi.fn(),
                orderBy: vi.fn(),
                delete: vi.fn(),
                update: vi.fn()
            }
        }
    }
}));

describe('SyncQueueService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window state mocks
        (window as any)._isSyncing = false;
        (window as any)._syncTimer = null;
    });

    it('should process queue items successfully', async () => {
        // Setup mocks
        (db.rawDb.syncQueue.count as any).mockResolvedValue(1);
        (GoogleSheetsService.isConfigured as any).mockReturnValue(true);

        const mockItem = { id: 1, action: 'test', payload: {}, retryCount: 0 };
        const mockQueryBuilder = {
            limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([mockItem])
            })
        };
        (db.rawDb.syncQueue.orderBy as any).mockReturnValue(mockQueryBuilder);

        (GoogleSheetsService.request as any).mockResolvedValue({
            success: true,
            data: [{ id: 1, success: true }]
        });

        // Execute
        await SyncQueueService.processQueue();

        // Verify
        expect(GoogleSheetsService.request).toHaveBeenCalledWith('batch_request', {
            operations: [{ id: 1, action: 'test', payload: {} }]
        });
        expect(db.rawDb.syncQueue.delete).toHaveBeenCalledWith(1);
    });

    it('should retry item on failure', async () => {
        // Setup mocks
        (db.rawDb.syncQueue.count as any).mockResolvedValue(1);
        (GoogleSheetsService.isConfigured as any).mockReturnValue(true);

        const mockItem = { id: 1, action: 'test', payload: {}, retryCount: 0 };
        const mockQueryBuilder = {
            limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([mockItem])
            })
        };
        (db.rawDb.syncQueue.orderBy as any).mockReturnValue(mockQueryBuilder);

        (GoogleSheetsService.request as any).mockResolvedValue({
            success: true,
            data: [{ id: 1, success: false, error: 'Failed' }]
        });

        // Execute
        await SyncQueueService.processQueue();

        // Verify
        expect(db.rawDb.syncQueue.update).toHaveBeenCalledWith(1, {
            retryCount: 1,
            error: 'Failed'
        });
    });

    it('should handle batch request failure (network error)', async () => {
        // This tests the fix for variable scope
        (db.rawDb.syncQueue.count as any).mockResolvedValue(1);
        (GoogleSheetsService.isConfigured as any).mockReturnValue(true);

        const mockItem = { id: 1, action: 'test', payload: {}, retryCount: 0 };
        const mockQueryBuilder = {
            limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([mockItem])
            })
        };
        (db.rawDb.syncQueue.orderBy as any).mockReturnValue(mockQueryBuilder);

        (GoogleSheetsService.request as any).mockRejectedValue(new Error('Network Error'));

        // Execute
        await SyncQueueService.processQueue();

        // Verify retry logic works even if batch request throws
        expect(db.rawDb.syncQueue.update).toHaveBeenCalledWith(1, {
            retryCount: 1,
            error: 'Error: Network Error'
        });
    });
});
