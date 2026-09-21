import { describe, expect, it } from 'vitest';
import { addDays, entriesForDate, groupByDate, listDates, toLocalDate, todayLocal } from '@/lib/date';

describe('date helpers', () => {
  it('formats timestamps and dates in the local calendar with padding', () => {
    const date = new Date(2026, 0, 2, 12, 0, 0);

    expect(toLocalDate(date.getTime())).toBe('2026-01-02');
    expect(todayLocal(date)).toBe('2026-01-02');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('leaves non-date input unchanged', () => {
    expect(addDays('2026-1-01', 1)).toBe('2026-1-01');
  });

  it('groups, filters, and lists dated entries', () => {
    const entries = [
      { id: 'first', date: '2026-09-20' },
      { id: 'second', date: '2026-09-19' },
      { id: 'third', date: '2026-09-20' },
    ];

    expect(groupByDate(entries)).toEqual({
      '2026-09-19': [entries[1]],
      '2026-09-20': [entries[0], entries[2]],
    });
    expect(entriesForDate(entries, '2026-09-20')).toEqual([entries[0], entries[2]]);
    expect(listDates(entries)).toEqual(['2026-09-19', '2026-09-20']);
  });
});
