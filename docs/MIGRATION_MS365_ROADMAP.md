# Migration Roadmap: Google Sheets → Microsoft 365 (Excel + SharePoint)

This document outlines the step-by-step plan to migrate the LabControl backend from Google Apps Script (GAS) to Microsoft 365, using Excel Online as the database and Microsoft Graph API + Office Scripts for logic.

## 1. Architecture Overview

We will replace the **Google Apps Script (GAS)** backend with **Office Scripts (TypeScript)** running on Excel Online, orchestrated via **Microsoft Graph API**.

*   **Frontend (React/Electron):** Authentication via MSAL (`@azure/msal-react`).
*   **API Layer:** `MicrosoftGraphService.ts` (New Service).
*   **Backend Logic:** Office Scripts hosted in the Excel file on SharePoint.
*   **Database:** Excel File (`LabControl_DB.xlsx`) with tables: `Catalog`, `Batches`, `Balances`, `Movements`.

### Key Components

1.  **Azure AD App Registration:** Handles authentication and permissions (`Files.ReadWrite.All`, `User.Read`).
2.  **Microsoft Graph API:** The bridge between the React frontend and the Excel file.
3.  **Office Scripts:** TypeScript code running within Excel to perform transactional updates (like `doPost` in GAS).

## 2. Affected Files & Changes

| File | Action | Description |
| :--- | :--- | :--- |
| `src/services/GoogleSheetsService.ts` | **Keep/Deprecate** | Will be kept as fallback or removed later. |
| `src/services/MicrosoftGraphService.ts` | **Create** | New service implementing the same interface as `GoogleSheetsService`, but calling Graph API. |
| `src/services/ApiClient.ts` | **Modify** | Add logic to switch between Google and Microsoft based on config. |
| `src/config/authConfig.ts` | **Create** | Azure AD configuration (Client ID, Tenant ID). |
| `src/components/Settings.tsx` | **Modify** | UI for Microsoft Login and SharePoint file selection. |
| `src/App.tsx` | **Modify** | Wrap app in `MsalProvider`. |
| `backend/GoogleAppsScript.js` | **Port** | Logic will be converted to `backend/OfficeScripts/LabControl_Backend.osts`. |

## 3. Step-by-Step Implementation

### Phase 1: Environment Setup (Microsoft Side)
1.  **Azure Portal:** Create an "App Registration" for LabControl (SPA).
    *   **Redirect URI:** `http://localhost:5173` (Dev), `electron://...` (Prod).
    *   **Permissions:** `Files.ReadWrite.All` (Delegated), `User.Read`.
2.  **SharePoint:** Create a site/library and the `LabControl_DB.xlsx` file.
3.  **Data Modeling:** Create empty tables in Excel: `Catalog`, `Batches`, `Balances`, `Movements`.

### Phase 2: Authentication (Frontend)
1.  Install dependencies:
    ```bash
    npm install @azure/msal-react @azure/msal-browser
    ```
2.  Configure `src/config/authConfig.ts` with Azure credentials.
3.  Add `MsalProvider` in `src/main.tsx` or `src/App.tsx`.
4.  Create Login Component in `Settings.tsx`.

### Phase 3: Backend Migration (Logic)
1.  Rewrite `backend/GoogleAppsScript.js` to **Office Scripts**.
    *   Use the `ExcelScript` API.
    *   Implement `main(workbook: ExcelScript.Workbook, action: string, payload: string)`.
2.  Save the script in OneDrive/SharePoint where the Excel file resides.

### Phase 4: Frontend Integration
1.  Implement `src/services/MicrosoftGraphService.ts`.
    *   **fetchFullDatabase**: Use Graph API to read tables (`/workbook/tables/{name}/rows`).
    *   **request**: Use Graph API to execute the script (`/workbook/scripts/{id}/run`).
2.  Update `src/services/ApiClient.ts` to use the new service when config is "Microsoft".

### Phase 5: Testing & Validation
1.  Validate full database read (Sync).
2.  Validate transactional writes (Create Item, Movement).
3.  Test concurrency (multiple users saving).

## 4. Code Mapping (GAS vs Office Scripts)

| Feature | Google Apps Script | Office Script (Excel) |
| :--- | :--- | :--- |
| **Entry Point** | `doPost(e)` | `main(workbook: ExcelScript.Workbook)` |
| **Locking** | `LockService.getScriptLock()` | Implicit (Single Session / Sequential) |
| **JSON Parsing** | `JSON.parse(e.postData.contents)` | `JSON.parse(payload)` (passed as arg) |
| **Sheet Access** | `SpreadsheetApp.getActiveSpreadsheet().getSheetByName()` | `workbook.getWorksheet()` |
| **Data Reading** | `sheet.getDataRange().getValues()` | `table.getRange().getValues()` |
| **Data Writing** | `sheet.getRange().setValues()` | `table.addRow()` or `range.setValues()` |

## 5. References

*   [Microsoft Graph API - Excel](https://learn.microsoft.com/en-us/graph/api/resources/excel?view=graph-rest-1.0)
*   [Office Scripts Documentation](https://learn.microsoft.com/en-us/office/dev/scripts/overview/excel)
*   [MSAL for React Tutorial](https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)
