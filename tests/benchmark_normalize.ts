import { normalizeStr } from '../src/utils/stringUtils';

const start = performance.now();
for (let i = 0; i < 10000; i++) {
    normalizeStr(`Reagente Químico ${i} SAP-${i} LOTE-${i} 123-45-${i}`);
}
console.log("Time for 10k calls:", performance.now() - start, "ms");
