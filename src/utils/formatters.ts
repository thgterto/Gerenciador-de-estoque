
export const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
    });
};

/**
 * Calculates days until expiry from a given date string.
 * Optimized to accept a pre-calculated nowTime to avoid Date instantiation in loops.
 */
export const calculateDaysToExpiry = (expiryDate: string, nowTime: number = Date.now()): number => {
    if (!expiryDate) return 999;
    const expDate = new Date(expiryDate);
    if (isNaN(expDate.getTime())) return 999;
    return Math.ceil((expDate.getTime() - nowTime) / (1000 * 60 * 60 * 24));
};
