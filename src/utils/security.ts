/**
 * Escapes HTML characters to prevent XSS attacks.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(str: string): string {
    if (!str) return str;
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
