import { describe, expect, test } from 'bun:test';
import { listModes, normalizeMode } from './modes';

describe('caveman modes', () => {
  test('normalizes canonical modes and aliases', () => {
    expect(normalizeMode('ultra')).toBe('ultra');
    expect(normalizeMode('')).toBe('ultra');
    expect(normalizeMode(undefined)).toBe('ultra');
    expect(normalizeMode('on')).toBe('ultra');
    expect(normalizeMode('default')).toBe('ultra');
    expect(normalizeMode('off')).toBe('normal');
    expect(normalizeMode('stop')).toBe('normal');
    expect(normalizeMode('none')).toBe('normal');
    expect(normalizeMode('clear')).toBe('normal');
    expect(normalizeMode('normal')).toBe('normal');
    expect(normalizeMode('wenyanfull')).toBe('wenyan');
    expect(normalizeMode('wenyan-full')).toBe('wenyan');
  });

  test('returns null for unknown mode', () => {
    expect(normalizeMode('invalid')).toBeNull();
  });

  test('lists modes in canonical order', () => {
    expect(listModes()).toEqual([
      'normal',
      'lite',
      'full',
      'ultra',
      'wenyan-lite',
      'wenyan',
      'wenyan-ultra',
      'commit',
      'review',
    ]);
  });
});
