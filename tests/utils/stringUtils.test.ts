import { describe, it, expect } from 'vitest';
import { normalizeUnit, generateInventoryId, calculateSimilarity, escapeHtml } from '../../src/utils/stringUtils';

describe('stringUtils', () => {
    describe('normalizeUnit', () => {
        it('should normalize common units', () => {
            expect(normalizeUnit('LT')).toBe('L');
            expect(normalizeUnit('LITRO')).toBe('L');
            expect(normalizeUnit('cx')).toBe('CX');
            expect(normalizeUnit('un')).toBe('UN');
        });

        it('should handle unknown units gracefully', () => {
            expect(normalizeUnit('unknown')).toBe('UNKNO'); // up to 5 chars
            expect(normalizeUnit('')).toBe('UN');
        });
    });

    describe('generateInventoryId', () => {
        it('should use SAP code if present', () => {
            const id = generateInventoryId('SAP123', 'Product A', 'LOT1');
            expect(id).toContain('SAP123');
            expect(id).toContain('LOT1');
        });

        it('should fallback to name hash if SAP is missing', () => {
            const id = generateInventoryId('', 'Product B', 'LOT2');
            expect(id).toMatch(/NOSAP/);
            expect(id).toContain('LOT2');
        });
    });

    describe('calculateSimilarity', () => {
        it('should return 1 for exact match', () => {
            expect(calculateSimilarity('validade', 'validade')).toBe(1);
        });

        it('should return high score for substring', () => {
            expect(calculateSimilarity('data de validade', 'validade')).toBeGreaterThan(0.9);
        });
    });

    describe('escapeHtml', () => {
        it('should return empty string for null/undefined/empty', () => {
            expect(escapeHtml('')).toBe('');
            expect(escapeHtml(null as any)).toBe('');
            expect(escapeHtml(undefined as any)).toBe('');
        });

        it('should not change safe strings', () => {
            expect(escapeHtml('Hello World')).toBe('Hello World');
            expect(escapeHtml('12345')).toBe('12345');
        });

        it('should escape HTML special characters', () => {
            expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
            expect(escapeHtml('User "Name"')).toBe('User &quot;Name&quot;');
            expect(escapeHtml("User 'Name'")).toBe("User &#039;Name&#039;");
            expect(escapeHtml('A & B')).toBe('A &amp; B');
        });

        it('should handle mixed content', () => {
             const input = '<div class="test">Hello & Welcome</div>';
             const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; Welcome&lt;/div&gt;';
             expect(escapeHtml(input)).toBe(expected);
        });
    });
});
