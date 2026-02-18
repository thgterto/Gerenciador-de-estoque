export const msalConfig = {
    auth: {
        clientId: 'YOUR_AZURE_CLIENT_ID', // Placeholder, user must replace
        authority: 'https://login.microsoftonline.com/common', // Or tenant specific
        redirectUri: window.location.origin, // e.g. http://localhost:5173
    },
    cache: {
        cacheLocation: 'localStorage', // Needed for persistent login
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ['User.Read', 'Files.ReadWrite.All'] // Need access to OneDrive/SharePoint files
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphFilesEndpoint: "https://graph.microsoft.com/v1.0/me/drive/items"
};
