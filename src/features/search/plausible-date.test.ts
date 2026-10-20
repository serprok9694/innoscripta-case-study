import { describe, expect, it } from 'vitest';
import { isPlausibleDate } from './plausible-date';

describe('isPlausibleDate', () => {
  it.each([
    ['2026-10-19', true],
    ['1999-01-01', true],
    ['0002-10-19', false], // year being typed
    ['0202-10-19', false],
    ['2026-10', false],
    ['', false],
  ])('%j → %s', (value, expected) => {
    expect(isPlausibleDate(value)).toBe(expected);
  });
});
