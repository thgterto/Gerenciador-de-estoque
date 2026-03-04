
export const GOOGLE_CONFIG = {
    // Deprecated but kept for migration if needed
    STORAGE_KEY: 'LC_GAS_WEBAPP_URL',
    getWebUrl: () => localStorage.getItem('LC_GAS_WEBAPP_URL') || '',
    setWebUrl: (url: string) => localStorage.setItem('LC_GAS_WEBAPP_URL', url)
};

export const EXCEL_CONFIG = {
    STORAGE_KEY: 'LC_EXCEL_WEBHOOK_URL',
    getWebhookUrl: () => localStorage.getItem('LC_EXCEL_WEBHOOK_URL') || '',
    setWebhookUrl: (url: string) => localStorage.setItem('LC_EXCEL_WEBHOOK_URL', url)
};
