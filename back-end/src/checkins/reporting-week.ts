/** Calendar dates are carried as UTC-midnight values for PostgreSQL DATE columns. */
export const REPORTING_TIME_ZONE = 'America/Chicago';
const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORTING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: REPORTING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function parts(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
}

/** Convert a Central calendar date/hour to an instant, accounting for CST/CDT. */
export function centralInstant(date: Date, hour: number): Date {
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
  );
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = parts(clock, new Date(guess));
    const displayed = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    guess += target - displayed;
  }
  return new Date(guess);
}

export function reportingWeek(now: Date) {
  const p = parts(calendar, now);
  const start = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 1) % 7));
  const monday = new Date(start);
  monday.setUTCDate(monday.getUTCDate() + 2);
  const nextSaturday = new Date(start);
  nextSaturday.setUTCDate(nextSaturday.getUTCDate() + 7);
  return {
    start,
    dueAt: centralInstant(monday, 12),
    resetsAt: centralInstant(nextSaturday, 0),
  };
}

export function timingStatus(createdAt: Date, dueAt: Date | null) {
  return dueAt === null ? 'UNKNOWN' : createdAt <= dueAt ? 'ON_TIME' : 'LATE';
}
