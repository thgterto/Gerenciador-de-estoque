
// Shared Intl.DateTimeFormat instances for performance optimization
// Creating new Intl instances is expensive (up to 50x slower than reuse)
const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
});

export const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : DATE_FORMATTER.format(date);
};

export const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : DATE_TIME_FORMATTER.format(date);
};
