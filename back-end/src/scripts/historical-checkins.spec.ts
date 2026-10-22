import {
  planHistoricalCheckIns,
  HistoricalCheckIn,
} from './historical-checkins';

function row(
  id: string,
  timestamp: string,
  overrides: Partial<HistoricalCheckIn> = {},
): HistoricalCheckIn {
  return {
    id,
    userId: 'u1',
    createdAt: new Date(timestamp),
    reportingWeekStart: null,
    dueAt: null,
    ...overrides,
  };
}

describe('historical check-in backfill', () => {
  it.each([
    [
      '2026-10-19T16:59:59.999Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      'ON_TIME',
    ],
    [
      '2026-10-19T17:00:00.000Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      'ON_TIME',
    ],
    [
      '2026-10-19T17:00:00.001Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      'LATE',
    ],
    [
      '2026-11-02T18:00:00.000Z',
      '2026-10-31',
      '2026-11-02T18:00:00.000Z',
      'ON_TIME',
    ],
    [
      '2026-03-09T17:00:00.001Z',
      '2026-03-07',
      '2026-03-09T17:00:00.000Z',
      'LATE',
    ],
    [
      '2026-10-24T04:59:59.000Z',
      '2026-10-17',
      '2026-10-19T17:00:00.000Z',
      'LATE',
    ],
    [
      '2026-10-24T05:00:00.000Z',
      '2026-10-24',
      '2026-10-26T17:00:00.000Z',
      'ON_TIME',
    ],
  ])(
    'classifies %s under the current rule',
    (timestamp, start, due, status) => {
      const original = row('c1', timestamp);
      const plan = planHistoricalCheckIns([original]);
      expect(
        plan.updates[0].reportingWeekStart.toISOString().slice(0, 10),
      ).toBe(start);
      expect(plan.updates[0].dueAt.toISOString()).toBe(due);
      expect(plan.updates[0].status).toBe(status);
      expect(original.reportingWeekStart).toBeNull();
      expect(original.createdAt.toISOString()).toBe(
        new Date(timestamp).toISOString(),
      );
    },
  );
  it('is idempotent and preserves previously recorded timing', () => {
    const original = row('c1', '2026-10-19T16:00:00Z');
    const first = planHistoricalCheckIns([original]);
    const recorded = { ...original, ...first.updates[0] };
    expect(planHistoricalCheckIns([recorded]).summary).toEqual({
      scanned: 1,
      alreadyRecorded: 1,
      toUpdate: 0,
      onTime: 0,
      late: 0,
      conflictingUserWeeks: 0,
    });
  });
  it('reports duplicate weeks including collisions with recorded rows', () => {
    const existing = row('existing', '2026-10-19T16:00:00Z', {
      reportingWeekStart: new Date('2026-10-17T00:00:00Z'),
      dueAt: new Date('2026-10-19T17:00:00Z'),
    });
    const plan = planHistoricalCheckIns([
      existing,
      row('legacy', '2026-10-20T12:00:00Z'),
    ]);
    expect(plan.conflicts).toEqual([
      { userWeek: 'u1:2026-10-17', checkInIds: ['existing', 'legacy'] },
    ]);
  });
  it('allows separate users and reporting weeks', () => {
    const plan = planHistoricalCheckIns([
      row('a', '2026-10-19T16:00:00Z'),
      row('b', '2026-10-19T16:00:00Z', { userId: 'u2' }),
      row('c', '2026-10-26T16:00:00Z'),
    ]);
    expect(plan.conflicts).toEqual([]);
    expect(plan.summary.toUpdate).toBe(3);
  });
  it('fills a missing deadline while retaining the recorded week', () => {
    const plan = planHistoricalCheckIns([
      row('a', '2026-10-19T16:00:00Z', {
        reportingWeekStart: new Date('2026-10-17T00:00:00Z'),
      }),
    ]);
    expect(plan.updates[0].dueAt.toISOString()).toBe(
      '2026-10-19T17:00:00.000Z',
    );
  });
  it('rejects inconsistent partial metadata', () => {
    expect(() =>
      planHistoricalCheckIns([
        row('a', '2026-10-19T16:00:00Z', {
          reportingWeekStart: new Date('2026-10-11T00:00:00Z'),
        }),
      ]),
    ).toThrow('inconsistent');
  });
});
