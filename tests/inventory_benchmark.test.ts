import { describe, it, expect } from 'vitest';
import { InventoryBatch, StockBalance, BatchDetailView } from '../types';

describe('InventoryService Performance Benchmark', () => {

  const generateData = (batchCount: number, balanceMultiplier: number) => {
    const batches: InventoryBatch[] = [];
    const balances: StockBalance[] = [];
    const locMap = new Map<string, string>();

    for (let i = 0; i < batchCount; i++) {
      const batchId = `BAT-${i}`;
      batches.push({
        id: batchId,
        catalogId: `CAT-${i % 100}`,
        lotNumber: `LOT-${i}`,
        expiryDate: '2024-12-31',
        unitCost: 10,
        status: 'ACTIVE',
        created: '',
        updated: ''
      } as InventoryBatch);

      // Create balances for this batch
      for (let j = 0; j < balanceMultiplier; j++) {
        const balId = `BAL-${i}-${j}`;
        const locId = `LOC-${j % 10}`;
        locMap.set(locId, `Location ${j}`);
        balances.push({
          id: balId,
          batchId: batchId,
          locationId: locId,
          quantity: 100, // ensure > 0
          lastMovementAt: '',
          created: '',
          updated: ''
        } as StockBalance);
      }
    }

    // Shuffle balances to simulate random access if needed, but linear scan doesn't care about order much
    // except for cache locality which is hard to simulate perfectly in JS.
    return { batches, balances, locMap };
  };

  const baseline = (batches: InventoryBatch[], balances: StockBalance[], locMap: Map<string, string>): BatchDetailView[] => {
    const results: BatchDetailView[] = [];
    for (const bal of balances) {
        const batch = batches.find(b => b.id === bal.batchId);
        if (batch && bal.quantity > 0) {
            results.push({
                batchId: batch.id,
                lotNumber: batch.lotNumber,
                expiryDate: batch.expiryDate || '',
                quantity: bal.quantity,
                locationName: locMap.get(bal.locationId) || 'Local Desconhecido',
                status: batch.status
            });
        }
    }
    return results;
  };

  const optimized = (batches: InventoryBatch[], balances: StockBalance[], locMap: Map<string, string>): BatchDetailView[] => {
    const batchMap = new Map(batches.map(b => [b.id, b]));
    const results: BatchDetailView[] = [];
    for (const bal of balances) {
        const batch = batchMap.get(bal.batchId);
        if (batch && bal.quantity > 0) {
            results.push({
                batchId: batch.id,
                lotNumber: batch.lotNumber,
                expiryDate: batch.expiryDate || '',
                quantity: bal.quantity,
                locationName: locMap.get(bal.locationId) || 'Local Desconhecido',
                status: batch.status
            });
        }
    }
    return results;
  };

  it('should be significantly faster with optimization', () => {
    const BATCH_COUNT = 1000;
    const BALANCES_PER_BATCH = 5;
    const { batches, balances, locMap } = generateData(BATCH_COUNT, BALANCES_PER_BATCH);

    console.log(`Benchmarking with ${batches.length} batches and ${balances.length} balances...`);

    const startBaseline = performance.now();
    const resultBaseline = baseline(batches, balances, locMap);
    const endBaseline = performance.now();
    const durationBaseline = endBaseline - startBaseline;

    const startOptimized = performance.now();
    const resultOptimized = optimized(batches, balances, locMap);
    const endOptimized = performance.now();
    const durationOptimized = endOptimized - startOptimized;

    console.log(`Baseline Duration: ${durationBaseline.toFixed(2)}ms`);
    console.log(`Optimized Duration: ${durationOptimized.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationBaseline / durationOptimized).toFixed(2)}x`);

    expect(resultOptimized).toEqual(resultBaseline);
    // Expect at least 2x speedup (conservative estimate for N=5000)
    expect(durationOptimized).toBeLessThan(durationBaseline);
  });
});
