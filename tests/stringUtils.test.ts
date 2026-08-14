import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/stringUtils';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(escapeHtml("User's Input")).toBe("User&#039;s Input");
    expect(escapeHtml('This & That')).toBe('This &amp; That');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle strings with no special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should handle non-string inputs gracefully', () => {
    // @ts-expect-error - testing runtime safety
    expect(escapeHtml(null)).toBe('');
    // @ts-expect-error - testing runtime safety
    expect(escapeHtml(undefined)).toBe('');
    // @ts-expect-error - testing runtime safety
    expect(escapeHtml(123)).toBe('123');
  });
});
