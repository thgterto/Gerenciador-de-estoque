import { describe, it, expect } from 'vitest';
import { normalizeUnit, generateInventoryId, calculateSimilarity } from '../../src/utils/stringUtils';

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
});
