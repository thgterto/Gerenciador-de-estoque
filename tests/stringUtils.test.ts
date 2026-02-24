import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/stringUtils';

describe('escapeHtml', () => {
    it('should return empty string for null or undefined', () => {
        expect(escapeHtml('')).toBe('');
        // @ts-ignore
        expect(escapeHtml(null)).toBe('');
        // @ts-ignore
        expect(escapeHtml(undefined)).toBe('');
    });

    it('should return safe string as is', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
        expect(escapeHtml('12345')).toBe('12345');
    });

    it('should escape special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        expect(escapeHtml("'Single Quotes'")).toBe('&#039;Single Quotes&#039;');
    });

    it('should handle mixed content', () => {
        const input = '<div class="test">Foo & Bar</div>';
        const expected = '&lt;div class=&quot;test&quot;&gt;Foo &amp; Bar&lt;/div&gt;';
        expect(escapeHtml(input)).toBe(expected);
    });
});
