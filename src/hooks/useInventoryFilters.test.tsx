
import { renderHook, act } from '@testing-library/react';
import { useInventoryFilters } from './useInventoryFilters';
import { InventoryItem } from '../types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock minimal InventoryItem
const createItem = (id: string, name: string, expiryDate: string, quantity = 10, minStock = 5): InventoryItem => ({
    id,
    name,
    expiryDate,
    quantity,
    minStockLevel: minStock,
    category: 'Test',
    location: { warehouse: 'W1', cabinet: 'C1', shelf: 'S1', position: 'P1' },
    sapCode: 'SAP' + id,
    lotNumber: 'L' + id,
    unitCost: 10,
    currency: 'BRL',
    dateAcquired: '2023-01-01',
    lastUpdated: '2023-01-01',
    risks: { F: false, T: false, C: false, E: false, O: false, N: false, Xi: false, Xn: false, F_PLUS: false, T_PLUS: false },
    baseUnit: 'L',
    materialGroup: 'GRP',
    type: 'ROH',
    isControlled: false,
    itemStatus: 'Ativo',
    supplier: 'Supplier'
});

describe('useInventoryFilters Date Handling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Set "Today" to 2024-06-15 12:00:00 UTC
        vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should correctly filter expired items based on string comparison (valid on expiry day)', () => {
        const items = [
            createItem('1', 'Expired Yesterday', '2024-06-14'),
            createItem('2', 'Expires Today', '2024-06-15'),
            createItem('3', 'Expires Tomorrow', '2024-06-16'),
        ];

        const { result } = renderHook(() => useInventoryFilters(items));

        // Initial State (ALL)
        expect(result.current.filteredItems).toHaveLength(3);

        // Filter: EXPIRED
        // "Expires Today" (2024-06-15) vs Today (2024-06-15)
        // String comparison: "2024-06-15" < "2024-06-15" is FALSE. So NOT Expired.
        // Legacy Date comparison: new Date("2024-06-15") < new Date("2024-06-15T12:00") is TRUE. So Expired.

        // We expect the NEW behavior (Optimized String Comparison): Not Expired

        act(() => {
            result.current.setStatusFilter('EXPIRED');
        });

        // Should only contain "Expired Yesterday"
        expect(result.current.filteredItems).toHaveLength(1);
        expect(result.current.filteredItems[0].name).toBe('Expired Yesterday');

        // Filter: OK (Not Expired and Not Low Stock)
        // "Expires Today" should be OK if it's not expired.
        // "Expires Tomorrow" is OK.

        act(() => {
            result.current.setStatusFilter('OK');
        });

        // Should contain "Expires Today" and "Expires Tomorrow"
        expect(result.current.filteredItems).toHaveLength(2);
        expect(result.current.filteredItems.map(i => i.name)).toContain('Expires Today');
        expect(result.current.filteredItems.map(i => i.name)).toContain('Expires Tomorrow');
    });

    it('should correctly identify expired items when they are strictly before today', () => {
         const items = [
            createItem('1', 'Way Past', '2020-01-01'),
        ];
        const { result } = renderHook(() => useInventoryFilters(items));

        act(() => {
            result.current.setStatusFilter('EXPIRED');
        });
        expect(result.current.filteredItems).toHaveLength(1);
    });
});
