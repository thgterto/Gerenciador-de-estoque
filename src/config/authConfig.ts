
// Recupera configurações salvas ou usa placeholders
const getStoredConfig = () => {
    return {
        clientId: localStorage.getItem('LC_SP_CLIENT_ID') || "SEU_CLIENT_ID_AQUI",
        tenantId: localStorage.getItem('LC_SP_TENANT_ID') || "common"
    };
};

const { clientId, tenantId } = getStoredConfig();

export const msalConfig = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["User.Read", "Sites.ReadWrite.All", "Lists.ReadWrite", "Sites.Manage.All"]
};

export const SHAREPOINT_CONFIG = {
    siteId: "root", 
    lists: {
        inventory: "LabInventory",
        history: "LabHistory"
    }
};

export const updateAuthConfig = (newClientId: string, newTenantId: string) => {
    localStorage.setItem('LC_SP_CLIENT_ID', newClientId);
    localStorage.setItem('LC_SP_TENANT_ID', newTenantId);
    // Reload necessário para aplicar novas configs no MSAL na próxima carga
    window.location.reload();
};
