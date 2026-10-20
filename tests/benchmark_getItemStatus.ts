import { performance } from 'perf_hooks';
import { InventoryItem } from '../src/types';
import { getItemStatus } from '../src/utils/businessRules';

const SIZE = 100000;
const items: InventoryItem[] = Array.from({ length: SIZE }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    category: 'Geral',
    unit: 'un',
    quantity: 10,
    minStockLevel: 5,
    unitCost: 10,
    currency: 'BRL',
    location: { warehouse: 'Geral', zone: 'A', shelf: '1' },
    risks: { F: false, O: false, T: false, C: false, E: false, N: false, Xi: false, Xn: false, F_PLUS: false, T_PLUS: false },
    expiryDate: new Date(Date.now() + (i - SIZE/2) * 1000000).toISOString().split('T')[0],
    history: []
}));

console.log(`Benchmarking getItemStatus with ${SIZE} items...`);

// Test 1: With explicit 'now' parameter (forces new Date() parsing internally)
const start1 = performance.now();
let expired1 = 0;
for (let i = 0; i < SIZE; i++) {
    const now = new Date(); // what the original code did
    const status = getItemStatus(items[i], now);
    if (status.isExpired) expired1++;
}
const end1 = performance.now();
console.log(`With 'now' param: ${(end1 - start1).toFixed(4)}ms`);

// Test 2: Without 'now' parameter (uses cached string comparison internally)
const start2 = performance.now();
let expired2 = 0;
for (let i = 0; i < SIZE; i++) {
    const status = getItemStatus(items[i]);
    if (status.isExpired) expired2++;
}
const end2 = performance.now();
console.log(`Without 'now' param (uses fast string comparison): ${(end2 - start2).toFixed(4)}ms`);
console.log(`Speedup: ${((end1 - start1) / (end2 - start2)).toFixed(2)}x`);
