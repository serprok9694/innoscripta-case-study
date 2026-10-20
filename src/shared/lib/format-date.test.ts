import { describe, expect, it } from 'vitest';
import { formatDateTime, formatRelativeTime, todayIsoDate } from './format-date';

const now = new Date('2026-10-20T12:00:00Z');

describe('formatRelativeTime', () => {
  it.each([
    ['2026-10-20T11:59:30Z', 'just now'],
    ['2026-10-20T11:15:00Z', '45 minutes ago'],
    ['2026-10-20T09:00:00Z', '3 hours ago'],
    ['2026-10-19T10:00:00Z', 'yesterday'],
    ['2026-10-10T12:00:00Z', 'last week'],
    ['2025-10-20T12:00:00Z', 'last year'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now, 'en')).toBe(expected);
  });
});

describe('todayIsoDate', () => {
  it('formats the local calendar date', () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('invalid dates', () => {
  it('format to an empty string instead of throwing', () => {
    expect(formatRelativeTime('not a date', now)).toBe('');
    expect(formatDateTime('not a date')).toBe('');
  });
});
