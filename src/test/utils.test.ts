import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '../lib/utils';

describe('cn (classname merge)', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatCurrency', () => {
  it('formats CNY', () => {
    const result = formatCurrency(1000000, 'CNY');
    expect(result).toContain('1');
    expect(result).toContain('¥');
  });

  it('formats USD', () => {
    const result = formatCurrency(5000, 'USD');
    expect(result).toContain('$');
  });

});
