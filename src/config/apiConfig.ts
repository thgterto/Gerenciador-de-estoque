
export const GOOGLE_CONFIG = {
    // Chave para localStorage
    STORAGE_KEY: 'LC_GAS_WEBAPP_URL',
    
    // Recupera a URL configurada
    getWebUrl: () => {
        return localStorage.getItem('LC_GAS_WEBAPP_URL') || '';
    },

    // Salva nova URL
    setWebUrl: (url: string) => {
        localStorage.setItem('LC_GAS_WEBAPP_URL', url);
    }
};
