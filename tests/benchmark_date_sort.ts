
import { performance } from 'perf_hooks';

const SIZE = 10000;
const dates = Array.from({ length: SIZE }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return { date: d.toISOString(), id: i };
});

console.log(`Benchmarking sort of ${SIZE} items...`);

// Test 1: Original (new Date)
const arr1 = JSON.parse(JSON.stringify(dates));
const start1 = performance.now();
arr1.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
const end1 = performance.now();
console.log(`Original (new Date): ${(end1 - start1).toFixed(4)}ms`);

// Test 2: String Compare
const arr2 = JSON.parse(JSON.stringify(dates));
const start2 = performance.now();
arr2.sort((a: any, b: any) => (b.date > a.date ? 1 : -1));
const end2 = performance.now();
console.log(`String Compare: ${(end2 - start2).toFixed(4)}ms`);

// Test 3: String LocaleCompare
const arr3 = JSON.parse(JSON.stringify(dates));
const start3 = performance.now();
arr3.sort((a: any, b: any) => b.date.localeCompare(a.date));
const end3 = performance.now();
console.log(`String LocaleCompare: ${(end3 - start3).toFixed(4)}ms`);
