import { reportingWeek, timingStatus } from './reporting-week';

describe('Central reporting calendar', () => {
  it.each([
    [
      '2026-10-21T12:00:00Z',
      '2026-10-18',
      '2026-10-19T17:00:00.000Z',
      '2026-10-25T05:00:00.000Z',
    ],
    [
      '2026-11-02T15:00:00Z',
      '2026-11-01',
      '2026-11-02T18:00:00.000Z',
      '2026-11-08T06:00:00.000Z',
    ],
    [
      '2026-03-09T15:00:00Z',
      '2026-03-08',
      '2026-03-09T17:00:00.000Z',
      '2026-03-15T05:00:00.000Z',
    ],
    [
      '2026-10-25T04:59:59Z',
      '2026-10-18',
      '2026-10-19T17:00:00.000Z',
      '2026-10-25T05:00:00.000Z',
    ],
    [
      '2026-10-25T05:00:00Z',
      '2026-10-25',
      '2026-10-26T17:00:00.000Z',
      '2026-11-01T05:00:00.000Z',
    ],
  ])('uses local Sunday and Monday noon for %s', (now, start, due, reset) => {
    const week = reportingWeek(new Date(now));
    expect(week.start.toISOString().slice(0, 10)).toBe(start);
    expect(week.dueAt.toISOString()).toBe(due);
    expect(week.resetsAt.toISOString()).toBe(reset);
  });
  it('includes noon, marks a millisecond after noon late, and preserves unknown history', () => {
    const due = new Date('2026-10-19T17:00:00Z');
    expect(timingStatus(new Date(due.getTime() - 1), due)).toBe('ON_TIME');
    expect(timingStatus(due, due)).toBe('ON_TIME');
    expect(timingStatus(new Date(due.getTime() + 1), due)).toBe('LATE');
    expect(timingStatus(due, null)).toBe('UNKNOWN');
  });
});
