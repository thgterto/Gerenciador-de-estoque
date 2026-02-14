// ==========================================
// LabControl - Relational Backend (3NF)
// ==========================================

function doPost(e) {
  // 1. Concurrency Locking
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds for other processes to finish
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Server busy, try again later." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const requestData = JSON.parse(e.postData.contents);
    const result = dispatchAction(requestData.action, requestData);

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log error internally (Google Cloud Logging)
    console.error(error);

    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString()
        // Stack trace removed for security
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function dispatchAction(action, payload) {
  let result = { success: true };

  switch (action) {
    case 'batch_request':
      if (!payload.operations || !Array.isArray(payload.operations)) {
          throw new Error("Invalid batch payload: 'operations' array missing.");
      }
      const batchResults = [];
      for (const op of payload.operations) {
          try {
              // op expected structure: { id: number, action: string, payload: any }
              // dispatchAction expects (action, payload) where payload contains the arguments needed
              const subResult = dispatchAction(op.action, op.payload || {});

              // Merge subResult into the batch result entry
              batchResults.push({
                  id: op.id,
                  success: true,
                  ...subResult
              });
          } catch (e) {
              batchResults.push({
                  id: op.id,
                  success: false,
                  error: e.toString()
              });
              // Stop processing on first error to maintain consistency
              break;
          }
      }
      result.data = batchResults;
      break;

    case 'ping':
      result.message = "Connected to 3NF Backend";
      break;

    // --- READ OPERATIONS ---
    case 'read_full_db':
      result.data = {
          view: getDenormalizedInventory(),
          catalog: getCatalog(),
          batches: getBatches(),
          balances: getBalances()
      };
      break;

    case 'read_inventory':
      result.data = getDenormalizedInventory();
      break;

    // --- WRITE OPERATIONS (Transactional) ---
    case 'sync_transaction':
      handleSyncTransaction(payload);
      result.message = "Transação sincronizada com sucesso";
      break;

    // --- LEGACY SUPPORT ---
    case 'upsert_item':
      legacyUpsertItem(payload.item);
      result.message = "Item salvo";
      break;

    case 'log_movement':
      if (payload.record) {
         bulkLogMovements([payload.record]);
      }
      result.message = "Movimento registrado";
      break;

    case 'delete_item':
      if (!payload.id) throw new Error("Item ID is required for deletion.");
      deleteItem(payload.id);
      result.message = "Item deletado";
      break;

    default:
      throw new Error("Ação desconhecida: " + action);
  }

  return result;
}

function doGet(e) {
  return ContentService.createTextOutput("LabControl Backend is Running. Use POST requests.");
}

// ==========================================
// DATABASE LOGIC (3NF)
// ==========================================

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

// Helper to map headers to column indices
function getColumnMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[h] = i);
  return map;
}

// --- RELATIONAL READERS ---

function getCatalog() {
  const sheet = ensureSheet('Catalog', ['ID', 'Name', 'SAP', 'CAS', 'Unit', 'Category', 'Risks_JSON', 'UpdatedAt']);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet);
  
  const res = [];
  for(let i=1; i<data.length; i++) {
    const r = data[i];
    if(r[map['ID']]) {
        res.push({ 
            id: r[map['ID']], 
            name: r[map['Name']], 
            sapCode: r[map['SAP']], 
            casNumber: r[map['CAS']], 
            baseUnit: r[map['Unit']], 
            categoryId: r[map['Category']], 
            risks: safeJsonParse(r[map['Risks_JSON']]), 
            updatedAt: r[map['UpdatedAt']], 
            isActive: true, isControlled: false, minStockLevel: 0 
        });
    }
  }
  return res;
}

function getBatches() {
  const sheet = ensureSheet('Batches', ['ID', 'CatalogID', 'LotNumber', 'ExpiryDate', 'PartnerID', 'Status', 'UpdatedAt']);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet);

  const res = [];
  for(let i=1; i<data.length; i++) {
    const r = data[i];
    if(r[map['ID']]) {
        res.push({ 
            id: r[map['ID']], 
            catalogId: r[map['CatalogID']], 
            lotNumber: r[map['LotNumber']], 
            expiryDate: r[map['ExpiryDate']], 
            partnerId: r[map['PartnerID']], 
            status: r[map['Status']] || 'ACTIVE',
            updatedAt: r[map['UpdatedAt']], 
            unitCost: 0
        });
    }
  }
  return res;
}

function getBalances() {
  const sheet = ensureSheet('Balances', ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt', 'Status']);
  let map = getColumnMap(sheet);

  // Migration: Add Status column if missing
  if (map['Status'] === undefined) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Status');
    map = getColumnMap(sheet);
  }

  const data = sheet.getDataRange().getValues();
  const res = [];
  for(let i=1; i<data.length; i++) {
    const r = data[i];
    // Filter soft deleted
    if(map['Status'] !== undefined && r[map['Status']] === 'DELETED') continue;

    if(r[map['ID']]) {
        res.push({ 
            id: r[map['ID']], 
            batchId: String(r[map['BatchID']]), 
            locationId: r[map['LocationID']], 
            quantity: Number(r[map['Quantity']]), 
            lastMovementAt: r[map['UpdatedAt']] 
        });
    }
  }
  return res;
}

// --- RELATIONAL WRITERS ---

function upsertData(sheetName, headers, items, idField = 'id') {
  if (!items || items.length === 0) return;
  const sheet = ensureSheet(sheetName, headers);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet);
  
  // Create ID -> Row Index map
  const idRowMap = new Map();
  const idColIdx = map['ID'];
  
  // If ID column missing, re-init sheet? For now assume strict headers
  if (idColIdx === undefined) return; 

  for(let i=1; i<data.length; i++) idRowMap.set(String(data[i][idColIdx]), i+1);

  const newRows = [];
  
  let updates = false;
  let maxCols = data.length > 0 ? data[0].length : 0;

  items.forEach(item => {
    // Map item object to array based on headers order
    const row = headers.map(h => {
        // Mapping logic
        if (h === 'ID') return item.id;
        if (h === 'Name') return item.name;
        if (h === 'SAP') return item.sapCode;
        if (h === 'CAS') return item.casNumber;
        if (h === 'Unit') return item.baseUnit;
        if (h === 'Category') return item.categoryId;
        if (h === 'Risks_JSON') return JSON.stringify(item.risks);
        if (h === 'UpdatedAt') return new Date();
        
        if (h === 'CatalogID') return item.catalogId;
        if (h === 'LotNumber') return item.lotNumber;
        if (h === 'ExpiryDate') return item.expiryDate;
        if (h === 'PartnerID') return item.partnerId || '';
        if (h === 'Status') return item.status;
        
        if (h === 'BatchID') return item.batchId;
        if (h === 'LocationID') return item.locationId;
        if (h === 'Quantity') return item.quantity;
        
        // History specific
        if (h === 'Date') return item.date;
        if (h === 'Type') return item.type;
        if (h === 'User') return item.userId || 'Sistema';
        if (h === 'Observation') return item.observation;
        
        return '';
    });

    if (row.length > maxCols) maxCols = row.length;

    if(idRowMap.has(item[idField])) {
      const rowIdx = idRowMap.get(item[idField]) - 1;
      const existingRow = data[rowIdx];
      // Update existing row in memory
      for(let k = 0; k < row.length; k++) {
        existingRow[k] = row[k];
      }
      updates = true;
    } else {
      newRows.push(row);
    }
  });

  if (updates) {
      // Ensure rectangularity if columns expanded
      if (maxCols > (data.length > 0 ? data[0].length : 0)) {
          data.forEach(r => {
              while (r.length < maxCols) r.push('');
          });
      }
      sheet.getRange(1, 1, data.length, maxCols).setValues(data);
  }

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
}

function handleSyncTransaction(payload) {
  if (payload.catalog) upsertData('Catalog', ['ID', 'Name', 'SAP', 'CAS', 'Unit', 'Category', 'Risks_JSON', 'UpdatedAt'], payload.catalog);
  if (payload.batches) upsertData('Batches', ['ID', 'CatalogID', 'LotNumber', 'ExpiryDate', 'PartnerID', 'Status', 'UpdatedAt'], payload.batches);
  if (payload.balances) upsertData('Balances', ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt', 'Status'], payload.balances);
  if (payload.movements) upsertData('Movements', ['ID', 'Date', 'Type', 'BatchID', 'Quantity', 'User', 'Observation'], payload.movements);
}

function bulkLogMovements(records) {
    upsertData('Movements', ['ID', 'Date', 'Type', 'BatchID', 'Quantity', 'User', 'Observation'], records);
}

function legacyUpsertItem(item) {
  if (!item) return;

  // Attempt to derive a Catalog ID (Product Level) that is consistent across lots
  // If catalogId is missing, try to strip the Lot suffix from Item ID
  let derivedCatalogId = item.catalogId;
  if (!derivedCatalogId && item.id) {
     const parts = item.id.split('-');
     if (parts.length > 1) {
         // Heuristic: Last part is usually the Lot Number or Random suffix
         // e.g. SAP123-LOT456 -> SAP123
         // e.g. NOSAP-HASH-LOT -> NOSAP-HASH
         const baseId = parts.slice(0, parts.length - 1).join('-');
         derivedCatalogId = `CAT-${baseId}`;
     } else {
         derivedCatalogId = `CAT-${item.id}`;
     }
  }

  const catalog = {
    id: derivedCatalogId || `CAT-${item.id}`,
    name: item.name,
    sapCode: item.sapCode,
    casNumber: item.casNumber,
    baseUnit: item.baseUnit,
    categoryId: item.category,
    risks: item.risks
  };
  
  const batch = {
    id: item.batchId || `BAT-${item.id}`,
    catalogId: catalog.id,
    lotNumber: item.lotNumber,
    expiryDate: item.expiryDate,
    partnerId: '',
    status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED'
  };
  
  const balance = {
    id: `BAL-${item.id}`,
    batchId: batch.id,
    locationId: item.location.warehouse,
    quantity: item.quantity
  };

  handleSyncTransaction({
      catalog: [catalog],
      batches: [batch],
      balances: [balance]
  });
}

function deleteItem(itemId) {
  // CRITICAL SECURITY FIX: Prevent empty string deletion (DoS/Data Loss)
  if (itemId === null || itemId === undefined || String(itemId).trim() === '') {
    throw new Error("Invalid Item ID for deletion.");
  }

  // Optimized for large datasets: Soft Delete (Status = 'DELETED')
  const sheet = ensureSheet('Balances', ['ID', 'BatchID', 'LocationID', 'Quantity', 'UpdatedAt', 'Status']);
  let map = getColumnMap(sheet);
  
  // Migration: Add Status column if missing
  if (map['Status'] === undefined) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Status');
    map = getColumnMap(sheet);
  }

  const data = sheet.getDataRange().getValues();
  const statusColIndex = map['Status'];
  const statusValues = [];

  let hasChanges = false;

  // data includes header, so i=0 is header
  for(let i=0; i<data.length; i++) {
     if (i===0) {
       statusValues.push([data[i][statusColIndex]]);
       continue;
     }

     const row = data[i];
     const rowBatchId = String(row[map['BatchID']]);
     const rowId = String(row[map['ID']]);

     if (rowBatchId.includes(itemId) || rowId == itemId) {
       statusValues.push(['DELETED']);
       hasChanges = true;
     } else {
       statusValues.push([row[statusColIndex]]);
     }
  }
  
  if (hasChanges) {
    // Write back only the Status column
    sheet.getRange(1, statusColIndex + 1, statusValues.length, 1).setValues(statusValues);
  }
}

function getDenormalizedInventory() {
  const catalog = getCatalog();
  const batches = getBatches();
  const balances = getBalances();

  const catMap = new Map(catalog.map(c => [c.id, c]));
  const batchMap = new Map(batches.map(b => [b.id, b]));

  const items = [];
  for(const bal of balances) {
    const batch = batchMap.get(bal.batchId);
    if (!batch) continue;
    const prod = catMap.get(batch.catalogId);
    if (!prod) continue;

    items.push({
      id: bal.id, // Using Balance ID as the Item ID for uniqueness in V1 View
      batchId: batch.id,
      catalogId: batch.catalogId,
      name: prod.name,
      sapCode: prod.sapCode,
      casNumber: prod.casNumber,
      baseUnit: prod.baseUnit,
      category: prod.categoryId,
      risks: prod.risks,
      lotNumber: batch.lotNumber,
      expiryDate: batch.expiryDate,
      itemStatus: batch.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado',
      quantity: bal.quantity,
      location: { warehouse: bal.locationId, cabinet: '', shelf: '', position: '' }, // LocationID is stored as simple string in V1
      lastUpdated: bal.lastMovementAt
    });
  }
  return items;
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch(e) { return {}; }
}
