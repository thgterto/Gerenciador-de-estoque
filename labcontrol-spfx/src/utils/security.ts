/**
 * Utility functions for security and data sanitization.
 */

/**
 * Escapes characters in a string to be safely embedded within HTML context.
 * Prevents Cross-Site Scripting (XSS) by neutralizing HTML tags and attributes.
 *
 * @param unsafe - The potentially unsafe string to be escaped.
 * @returns The HTML-escaped string.
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
