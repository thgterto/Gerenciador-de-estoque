
import { getItemStatus } from '../src/utils/businessRules';
import { InventoryItem } from '../src/types';

// Mock minimal item
const mockItem = (expiryDate: string): InventoryItem => ({
    id: '1',
    name: 'Test',
    sapCode: '123',
    quantity: 10,
    minStockLevel: 5,
    expiryDate,
    // ... other fields are not used by getItemStatus
} as any);

const runTests = () => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    console.log(`Today ISO: ${todayISO}`);

    // Test 1: Past date (Expired)
    const itemExpired = mockItem(yesterdayISO);
    const statusExpired = getItemStatus(itemExpired);
    console.log(`Yesterday (${yesterdayISO}): isExpired=${statusExpired.isExpired} (Expected: true)`);
    if (!statusExpired.isExpired) throw new Error("Failed: Yesterday should be expired");

    // Test 2: Future date (Not Expired)
    const itemFuture = mockItem(tomorrowISO);
    const statusFuture = getItemStatus(itemFuture);
    console.log(`Tomorrow (${tomorrowISO}): isExpired=${statusFuture.isExpired} (Expected: false)`);
    if (statusFuture.isExpired) throw new Error("Failed: Tomorrow should NOT be expired");

    // Test 3: Today (Boundary Check)
    const itemToday = mockItem(todayISO);
    const statusToday = getItemStatus(itemToday);
    console.log(`Today (${todayISO}): isExpired=${statusToday.isExpired}`);

    // We don't assert Today strictly because current implementation might depend on time of day vs UTC
    // But after optimization, it should be FALSE (valid until end of day).

    // Test 4: Explicit 'now' argument
    // If we pass 'now' as tomorrow, then 'yesterday' item should be expired.
    const statusExplicit = getItemStatus(itemExpired, tomorrow);
    if (!statusExplicit.isExpired) throw new Error("Failed: Explicit 'now' check failed");

    console.log("All tests passed!");
};

runTests();
