// Placeholder for Azure AD Configuration
// TODO: Replace with actual values from Azure Portal -> App Registrations

export const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID_HERE", // Application (client) ID
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE", // Directory (tenant) ID
        redirectUri: typeof window !== 'undefined' && window.location.origin ? window.location.origin : "http://localhost:5173", // Localhost for dev
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
    scopes: ["User.Read", "Files.ReadWrite.All"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    driveEndpoint: "https://graph.microsoft.com/v1.0/me/drive",
    // TODO: Add specific Excel file path or ID
    excelFilePath: "/drive/root:/LabControl/LabControl_DB.xlsx:/workbook"
};
