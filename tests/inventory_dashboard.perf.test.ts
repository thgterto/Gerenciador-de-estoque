
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../src/services/InventoryService';

// Use vi.hoisted to ensure mocks are available before import
const { toArrayMock, itemsCountMock, rawItemsEachMock } = vi.hoisted(() => {
    return {
        toArrayMock: vi.fn(),
        itemsCountMock: vi.fn(),
        rawItemsEachMock: vi.fn(),
    };
});

vi.mock('../src/db', () => ({
  db: {
    items: {
      toArray: toArrayMock,
      count: itemsCountMock
    },
    rawDb: {
        items: {
            each: rawItemsEachMock,
        }
    }
  }
}));

describe('InventoryService.getDashboardMetrics Optimization', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate metrics efficiently', async () => {
        const mockItems = [
            { id: '1', expiryDate: '2025-01-01', quantity: 10, minStockLevel: 5 },
            { id: '2', expiryDate: '2030-01-01', quantity: 2, minStockLevel: 5 },
            { id: '3', expiryDate: '', quantity: 100, minStockLevel: 10 }
        ];

        // Mock return values
        toArrayMock.mockResolvedValue(mockItems);
        itemsCountMock.mockResolvedValue(mockItems.length);

        rawItemsEachMock.mockImplementation(async (callback: (item: unknown) => void) => {
            for (const item of mockItems) {
                callback(item);
            }
        });

        await InventoryService.getDashboardMetrics();

        // FAIL CONDITION: verify toArray is NOT called
        // In the current codebase, this expectation will fail because toArray IS called.
        // After optimization, this should pass.
        expect(toArrayMock).not.toHaveBeenCalled();

        // PASS CONDITION: verify rawDb iteration IS used
        expect(rawItemsEachMock).toHaveBeenCalled();
        expect(itemsCountMock).toHaveBeenCalled();
    });
});
