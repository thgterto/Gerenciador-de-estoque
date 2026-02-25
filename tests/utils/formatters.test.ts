
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from '../../src/utils/formatters';

describe('formatters', () => {
    describe('formatDate', () => {
        it('should format a valid date string correctly', () => {
            const dateStr = '2023-10-27T10:00:00.000Z';
            // Note: The specific output depends on the timezone of the test environment,
            // but we expect it to be formatted according to pt-BR locale.
            // In UTC, this is Oct 27, 2023. In BRT (UTC-3), it is Oct 27, 2023.
            // The formatter uses the system time zone by default if not specified in options,
            // but let's check the structure.
            const formatted = formatDate(dateStr);
            expect(formatted).toMatch(/27 de out\. de 2023/);
        });

        it('should return N/A for empty string', () => {
            expect(formatDate('')).toBe('N/A');
        });

        it('should return N/A for invalid date string', () => {
            expect(formatDate('invalid-date')).toBe('N/A');
        });
    });

    describe('formatDateTime', () => {
        it('should format a valid datetime string correctly', () => {
            const dateStr = '2023-10-27T10:30:00.000Z';
            const formatted = formatDateTime(dateStr);
            // Expect something like "27/10/23, 07:30" (depending on timezone)
            // We just check for the date part primarily and the structure
            expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{2}, \d{2}:\d{2}/);
        });

        it('should return - for empty string', () => {
            expect(formatDateTime('')).toBe('-');
        });

        it('should return - for invalid date string', () => {
            expect(formatDateTime('invalid-date')).toBe('-');
        });
    });
});
