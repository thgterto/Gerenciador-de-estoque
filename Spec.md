# Spec: Excel Automation & Migration

## 1. Overview
This specification details the replacement of the Google Apps Script (GAS) integration with a native Excel Online integration using **Office Scripts** and **Power Automate Webhooks**. A new modal (`ExcelSetupModal`) will be implemented to guide users through the setup process, providing the necessary scripts and configuration interface.

## 2. Service Layer: `ExcelIntegrationService.ts`

This new service will replace `GoogleSheetsService.ts` entirely.

### Interface
```typescript
interface ExcelResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export const ExcelIntegrationService = {
  // Configuration
  getWebhookUrl(): string | null;
  isConfigured(): boolean;

  // Core Request
  async request(action: string, payload: any): Promise<ExcelResponse>;

  // Operations (mapped from legacy GoogleSheetsService)
  async fetchInventory(): Promise<InventoryItem[]>;
  async fetchFullDatabase(): Promise<FullDatabasePayload>;
  async addOrUpdateItem(item: InventoryItem): Promise<void>;
  async deleteItem(itemId: string): Promise<void>;
  async logMovement(record: MovementRecord): Promise<void>;
  async testConnection(): Promise<boolean>;
};
```

### Configuration Storage
- Key: `LC_EXCEL_WEBHOOK_URL` (replacing `LC_GAS_WEBAPP_URL`).
- Storage: `localStorage` via `GOOGLE_CONFIG` (renamed to `EXCEL_CONFIG` or similar in `apiConfig.ts`).

### Request Logic
- Use `fetch` to send POST requests to the Power Automate Webhook.
- Headers: `Content-Type: application/json`.
- Payload Structure: `{ "action": "action_name", ...payload }`.

## 3. Automation Scripts (Office Scripts)

We need to provide the user with a TypeScript script to run in Excel Online. This script will handle the creation of tables if they don't exist.

### Script Template (`inventory_setup.osts`)
```typescript
function main(workbook: ExcelScript.Workbook) {
  // 1. Create or Get "Inventory" Worksheet
  let inventorySheet = workbook.getWorksheet("Inventory");
  if (!inventorySheet) {
    inventorySheet = workbook.addWorksheet("Inventory");
  }

  // 2. Create Table
  let inventoryTable = inventorySheet.getTables().find(t => t.getName() === "InventoryTable");
  if (!inventoryTable) {
    // Define headers
    let headers = [["ID", "SAP Code", "Name", "Quantity", "Unit", "Min Stock", "Category", "Status"]];
    let range = inventorySheet.getRange("A1:H1");
    range.setValues(headers);
    inventoryTable = inventorySheet.addTable(range, true);
    inventoryTable.setName("InventoryTable");
  }

  // Repeat for Transactions, Batches, etc.
}
```

## 4. UI Component: `ExcelSetupModal.tsx`

A 3-step wizard modal using `OrbitalModal`.

### Step 1: "Prepare Excel"
- **Content**: Explain that the user needs an Excel Online file.
- **Action**: Display the Office Script code block (syntax highlighted or in a textarea).
- **Button**: "Copy Script".
- **Instruction**: "Open Excel Online > Automate > New Script > Paste & Run".

### Step 2: "Configure Power Automate"
- **Content**: Explain how to create the Instant Cloud Flow.
- **Instruction**: "Create Flow > Trigger: HTTP Request > Action: Run Script (or Add Row)".
- **Helper**: Provide the JSON Schema for the HTTP Request Body.
  ```json
  {
    "type": "object",
    "properties": {
      "action": { "type": "string" },
      "item": { "type": "object" },
      "record": { "type": "object" }
    }
  }
  ```

### Step 3: "Connect"
- **Input**: "Webhook URL" (OrbitalInput).
- **Button**: "Test Connection" (calls `ExcelIntegrationService.testConnection`).
- **Button**: "Save & Finish".

## 5. Migration Strategy

1.  **Code Migration**:
    -   Create `ExcelIntegrationService.ts`.
    -   Update `InventorySyncManager.ts` to import `ExcelIntegrationService` instead of `GoogleSheetsService`.
    -   Update `apiConfig.ts` to handle the new storage key.
2.  **UI Update**:
    -   Modify `Settings.tsx` to open `ExcelSetupModal`.
    -   Remove `ExcelIntegrationForm.tsx` (or refactor to open the modal).
3.  **Cleanup**:
    -   Delete `GoogleSheetsService.ts`.

## 6. Edge Cases
- **No Webhook Configured**: Service should return clean errors or "offline" status.
- **Network Error**: Retry logic in `fetchWithRetry`.
- **Schema Mismatch**: Script updates might be needed if data model changes (V2). The script provided should be V2 compatible (Catalog, Batches, etc.).

## 7. JSON Schema for Power Automate
Since Power Automate needs a schema to parse the JSON, providing this in the UI is critical for UX.
