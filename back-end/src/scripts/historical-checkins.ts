import { reportingWeek, timingStatus } from '../checkins/reporting-week';

export type HistoricalCheckIn = {
  id: string;
  userId: string;
  createdAt: Date;
  reportingWeekStart: Date | null;
  dueAt: Date | null;
};

/** Plan without mutating rows or guessing which duplicate submission to retain. */
export function planHistoricalCheckIns(rows: HistoricalCheckIn[]) {
  const groups = new Map<string, HistoricalCheckIn[]>();
  const updates: Array<{
    id: string;
    reportingWeekStart: Date;
    dueAt: Date;
    status: 'ON_TIME' | 'LATE' | 'UNKNOWN';
  }> = [];
  for (const row of rows) {
    const week = reportingWeek(row.createdAt);
    const start = row.reportingWeekStart ?? week.start;
    const key = `${row.userId}:${start.toISOString().slice(0, 10)}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
    if (row.reportingWeekStart !== null && row.dueAt !== null) continue;
    // The current rule attributes a submission to its Central Saturday–Friday week.
    if (
      row.reportingWeekStart &&
      row.reportingWeekStart.getTime() !== week.start.getTime()
    ) {
      throw new Error(
        `Check-in ${row.id} has a reporting week inconsistent with its submission date.`,
      );
    }
    const dueAt = row.dueAt ?? week.dueAt;
    updates.push({
      id: row.id,
      reportingWeekStart: start,
      dueAt,
      status: timingStatus(row.createdAt, dueAt),
    });
  }
  const conflicts = [...groups.entries()]
    .filter(
      ([, group]) =>
        group.length > 1 &&
        group.some((row) => row.reportingWeekStart === null),
    )
    .map(([key, group]) => ({
      userWeek: key,
      checkInIds: group.map((row) => row.id),
    }));
  return {
    updates,
    conflicts,
    summary: {
      scanned: rows.length,
      alreadyRecorded: rows.length - updates.length,
      toUpdate: updates.length,
      onTime: updates.filter((row) => row.status === 'ON_TIME').length,
      late: updates.filter((row) => row.status === 'LATE').length,
      conflictingUserWeeks: conflicts.length,
    },
  };
}
