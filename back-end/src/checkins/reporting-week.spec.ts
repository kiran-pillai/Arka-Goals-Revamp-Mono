import { reportingWeek, timingStatus } from './reporting-week';

describe('Central reporting calendar', () => {
  it.each([
    [
      '2026-10-21T12:00:00Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      '2026-10-24T05:00:00.000Z',
    ],
    [
      '2026-11-02T15:00:00Z',
      '2026-10-31',
      '2026-11-02T18:00:00.000Z',
      '2026-11-07T06:00:00.000Z',
    ],
    [
      '2026-03-09T15:00:00Z',
      '2026-03-07',
      '2026-03-09T17:00:00.000Z',
      '2026-03-14T05:00:00.000Z',
    ],
    [
      '2026-10-24T04:59:59Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      '2026-10-24T05:00:00.000Z',
    ],
    [
      '2026-10-24T05:00:00Z',
      '2026-10-24',
      '2026-10-26T17:00:00.000Z',
      '2026-10-31T05:00:00.000Z',
    ],
  ])('uses local Saturday and Monday noon for %s', (now, start, due, reset) => {
    const week = reportingWeek(new Date(now));
    expect(week.start.toISOString().slice(0, 10)).toBe(start);
    expect(week.dueAt.toISOString()).toBe(due);
    expect(week.resetsAt.toISOString()).toBe(reset);
  });
  it.each([
    '2026-10-24T05:00:00.000Z', // Saturday midnight Central
    '2026-10-25T17:00:00.000Z', // Sunday noon Central
    '2026-10-26T16:59:59.999Z', // Monday just before noon Central
    '2026-10-26T17:00:00.000Z', // Monday noon Central
  ])(
    'accepts %s as on time for the same Saturday reporting week',
    (timestamp) => {
      const submittedAt = new Date(timestamp);
      const week = reportingWeek(submittedAt);
      expect(week.start.toISOString().slice(0, 10)).toBe('2026-10-24');
      expect(week.dueAt.toISOString()).toBe('2026-10-26T17:00:00.000Z');
      expect(timingStatus(submittedAt, week.dueAt)).toBe('ON_TIME');
    },
  );
  it('includes noon, marks a millisecond after noon late, and preserves unknown history', () => {
    const due = new Date('2026-10-19T17:00:00Z');
    expect(timingStatus(new Date(due.getTime() - 1), due)).toBe('ON_TIME');
    expect(timingStatus(due, due)).toBe('ON_TIME');
    expect(timingStatus(new Date(due.getTime() + 1), due)).toBe('LATE');
    expect(timingStatus(due, null)).toBe('UNKNOWN');
  });
});
