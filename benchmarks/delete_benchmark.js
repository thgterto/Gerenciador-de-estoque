
const performance = { now: () => Date.now() };

// Configuration
const ITEMS_TO_DELETE = 50;
const NETWORK_LATENCY_MS = 100;
const BROWSER_CONCURRENCY = 6; // Chrome limit per domain

// Mock Infrastructure
const GoogleSheetsService = {
  isConfigured: () => true,
  requestCalls: 0,
  activeRequests: 0,

  async request(action, payload) {
    // Wait for slot
    while (this.activeRequests >= BROWSER_CONCURRENCY) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeRequests++;
    this.requestCalls++;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY_MS));

    this.activeRequests--;
    return { success: true };
  },

  async deleteItem(id) {
    return this.request('delete_item', { id });
  },

  async deleteBulk(ids) {
    return this.request('delete_bulk', { ids });
  }
};

const SyncQueueService = {
  enqueueCalls: 0,
  async enqueue(action, payload) {
    this.enqueueCalls++;
    console.log(`[Mock] Enqueued ${action}`);
  }
};

// --- Scenarios ---

async function scenarioBaseline(ids) {
  GoogleSheetsService.requestCalls = 0;
  const start = performance.now();

  // Existing Implementation Logic (InventoryService.ts:635)
  // "ids.forEach(id => { ... })"
  const promises = [];
  ids.forEach(id => {
      const p = GoogleSheetsService.deleteItem(id)
        .catch(() => SyncQueueService.enqueue('delete_item', { id }));
      promises.push(p);
  });

  await Promise.all(promises);
  const end = performance.now();

  return {
    time: end - start,
    requests: GoogleSheetsService.requestCalls
  };
}

async function scenarioOptimized(ids) {
  GoogleSheetsService.requestCalls = 0;
  const start = performance.now();

  // New Implementation Logic
  await GoogleSheetsService.deleteBulk(ids)
      .catch(() => SyncQueueService.enqueue('delete_bulk', { ids }));

  const end = performance.now();

  return {
    time: end - start,
    requests: GoogleSheetsService.requestCalls
  };
}

// --- Main ---

async function runBenchmark() {
  const ids = Array.from({ length: ITEMS_TO_DELETE }, (_, i) => `ITEM-${i}`);

  console.log(`Running Benchmark: Deleting ${ITEMS_TO_DELETE} items`);
  console.log(`Simulated Latency: ${NETWORK_LATENCY_MS}ms per request`);
  console.log(`Browser Concurrency Limit: ${BROWSER_CONCURRENCY}`);
  console.log('--------------------------------------------------');

  // Baseline
  const baseline = await scenarioBaseline(ids);
  console.log(`[Baseline] Serial Requests:`);
  console.log(`  Time: ${baseline.time.toFixed(2)}ms`);
  console.log(`  Requests: ${baseline.requests}`);

  // Optimized
  const optimized = await scenarioOptimized(ids);
  console.log(`[Optimized] Bulk Request:`);
  console.log(`  Time: ${optimized.time.toFixed(2)}ms`);
  console.log(`  Requests: ${optimized.requests}`);

  // Comparison
  console.log('--------------------------------------------------');
  const speedup = baseline.time / optimized.time;
  console.log(`Speedup Factor: ${speedup.toFixed(2)}x`);
  console.log(`Request Reduction: ${baseline.requests} -> ${optimized.requests}`);
}

runBenchmark();
