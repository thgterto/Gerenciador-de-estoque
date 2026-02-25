export const ExcelScriptGenerator = {
    generateSetupScript(): string {
        return `
function main(workbook: ExcelScript.Workbook) {
  // 1. Create Worksheets
  const sheets = ["Inventory", "Catalog", "Batches", "Transactions", "StockBalances"];
  sheets.forEach(name => {
    if (!workbook.getWorksheet(name)) {
      workbook.addWorksheet(name);
    }
  });

  // 2. Setup Catalog Table
  setupTable(workbook, "Catalog", "CatalogTable", [
    "ID", "SAP Code", "Name", "Category", "Base Unit", "CAS", "Formula", "Risks", "Controlled", "Min Stock", "Active", "Updated At"
  ]);

  // 3. Setup Batches Table
  setupTable(workbook, "Batches", "BatchesTable", [
    "ID", "Catalog ID", "Lot Number", "Expiry Date", "Partner ID", "Status", "Unit Cost", "Updated At"
  ]);

  // 4. Setup StockBalances Table
  setupTable(workbook, "StockBalances", "BalancesTable", [
    "ID", "Batch ID", "Location ID", "Quantity", "Last Movement"
  ]);

  // 5. Setup Transactions Table
  setupTable(workbook, "Transactions", "TransactionsTable", [
    "ID", "Batch ID", "Type", "Quantity", "From Location", "To Location", "Date", "User", "Observation", "Created At"
  ]);

  // 6. Setup Inventory View (Legacy/Simple)
  setupTable(workbook, "Inventory", "InventoryTable", [
    "ID", "Name", "Quantity", "Unit", "Category", "Status", "Location"
  ]);
}

function setupTable(workbook: ExcelScript.Workbook, sheetName: string, tableName: string, headers: string[]) {
  const sheet = workbook.getWorksheet(sheetName);
  const existingTable = sheet.getTables().find(t => t.getName() === tableName);

  if (!existingTable) {
    // Set headers
    const range = sheet.getRangeByIndexes(0, 0, 1, headers.length);
    range.setValues([headers]);

    // Create table
    const table = sheet.addTable(range, true);
    table.setName(tableName);

    // Auto-fit columns
    sheet.getRange().getFormat().autofitColumns();
  }
}
`;
    }
};
