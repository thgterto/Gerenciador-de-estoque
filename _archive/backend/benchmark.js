
// backend/benchmark.js

// --- Mocks ---

class MockRange {
    constructor(sheet, row, col, numRows, numCols) {
        this.sheet = sheet;
        this.row = row;
        this.col = col;
        this.numRows = numRows;
        this.numCols = numCols;
    }
    getValues() {
        // Return 2D array from sheet.data
        const res = [];
        for (let i = 0; i < this.numRows; i++) {
            const r = this.sheet.data[this.row - 1 + i]; // 0-based
            if (r) {
                res.push(r.slice(this.col - 1, this.col - 1 + this.numCols));
            } else {
                res.push(new Array(this.numCols).fill(''));
            }
        }
        return res;
    }
    setValues(values) {
        this.sheet.apiCalls.setValues++;
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < values[i].length; j++) {
                const rIdx = this.row - 1 + i;
                const cIdx = this.col - 1 + j;
                if (!this.sheet.data[rIdx]) this.sheet.data[rIdx] = [];
                this.sheet.data[rIdx][cIdx] = values[i][j];
            }
        }
    }
}

class MockSheet {
    constructor(name, headers) {
        this.name = name;
        this.data = [headers]; // Row 0 is headers
        this.apiCalls = { deleteRow: 0, setValues: 0, getValues: 0, clearContents: 0 };
    }
    getDataRange() {
        this.apiCalls.getValues++; // Counting getting the range + values as 1 read op mostly
        return new MockRange(this, 1, 1, this.data.length, this.data[0].length);
    }
    getRange(row, col, numRows, numCols) {
        return new MockRange(this, row, col, numRows, numCols);
    }
    deleteRow(rowIdx) {
        this.apiCalls.deleteRow++;
        // Simulate O(N) shift cost? In GAS this is slow.
        // We'll just splice here.
        this.data.splice(rowIdx - 1, 1);
    }
    clearContents() {
        this.apiCalls.clearContents++;
        // Keep headers? clearContents usually clears everything in range.
        // But here we usually clear whole sheet or range.
        // The optimization uses sheet.clearContents() which clears everything.
        // We'll simulate clearing all data.
        this.data = [];
    }
    getLastColumn() { return this.data.length > 0 ? this.data[0].length : 0; }
    getLastRow() { return this.data.length; }
    appendRow(row) { this.data.push(row); }
    setFrozenRows(n) {}
}

const mockSheets = {};

const SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
        getSheetByName: (name) => mockSheets[name],
        insertSheet: (name) => {
            mockSheets[name] = new MockSheet(name, []);
            return mockSheets[name];
        }
    })
};

// --- Helpers from GoogleAppsScript.js ---

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getColumnMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[h] = i);
  return map;
}

// --- Implementations ---

function originalDeleteItem(itemId) {
  const sheet = ensureSheet('Balances', ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt']);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet);

  const rowsToDelete = [];

  for (let i = 1; i < data.length; i++) {
    const rowBatchId = String(data[i][map['BatchID']]);
    const rowId = String(data[i][map['ID']]);

    // Check both legacy ID and new BatchID link
    if (rowBatchId.includes(itemId) || rowId == itemId) {
      rowsToDelete.push(i + 1);
    }
  }

  // Delete from bottom up to avoid index shifting
  rowsToDelete.reverse().forEach(rowIdx => sheet.deleteRow(rowIdx));
}

function optimizedDeleteItem(itemId) {
  const sheet = ensureSheet('Balances', ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt']);
  const range = sheet.getDataRange();
  const data = range.getValues();
  const map = getColumnMap(sheet);

  // Filter keeping the header (row 0) and rows that DO NOT match
  const newData = data.filter((row, i) => {
    if (i === 0) return true; // keep header
    const rowBatchId = String(row[map['BatchID']]);
    const rowId = String(row[map['ID']]);
    return !(rowBatchId.includes(itemId) || rowId == itemId);
  });

  if (newData.length < data.length) {
    // There are changes
    sheet.clearContents();
    sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
  }
}

// --- Benchmark Runner ---

function runBenchmark() {
    console.log("Setting up data...");
    const headers = ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt'];
    const initialData = [headers];
    const totalRows = 10000;
    const itemsToDelete = 50;
    const targetItemId = 'TARGET-ITEM';

    for (let i = 0; i < totalRows; i++) {
        if (i < itemsToDelete) {
             initialData.push([`ID-${i}`, `BATCH-${targetItemId}-${i}`, 'LOC', 10, new Date()]);
        } else {
             initialData.push([`ID-${i}`, `BATCH-OTHER-${i}`, 'LOC', 10, new Date()]);
        }
    }

    // Test Original
    mockSheets['Balances'] = new MockSheet('Balances', []);
    mockSheets['Balances'].data = JSON.parse(JSON.stringify(initialData));

    console.log("Running Original deleteItem...");
    const startOrig = Date.now();
    originalDeleteItem(targetItemId);
    const endOrig = Date.now();

    const callsOrig = mockSheets['Balances'].apiCalls;
    console.log(`Original: ${endOrig - startOrig}ms`);
    console.log(`Original API Calls: deleteRow=${callsOrig.deleteRow}, setValues=${callsOrig.setValues}, getValues=${callsOrig.getValues}`);

    // Test Optimized
    mockSheets['Balances'] = new MockSheet('Balances', []);
    mockSheets['Balances'].data = JSON.parse(JSON.stringify(initialData));

    console.log("Running Optimized deleteItem...");
    const startOpt = Date.now();
    optimizedDeleteItem(targetItemId);
    const endOpt = Date.now();

    const callsOpt = mockSheets['Balances'].apiCalls;
    console.log(`Optimized: ${endOpt - startOpt}ms`);
    console.log(`Optimized API Calls: deleteRow=${callsOpt.deleteRow}, setValues=${callsOpt.setValues}, getValues=${callsOpt.getValues}, clearContents=${callsOpt.clearContents}`);

    // Verify correctness
    const finalLen = mockSheets['Balances'].data.length;
    const expectedLen = totalRows - itemsToDelete + 1; // +1 for header
    if (finalLen !== expectedLen) {
        console.error(`ERROR: Expected ${expectedLen} rows, got ${finalLen}`);
        process.exit(1);
    } else {
        console.log("Verification Passed: Correct number of rows remaining.");
    }
}

runBenchmark();
