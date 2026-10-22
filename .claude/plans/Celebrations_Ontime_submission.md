### Kudos

After a check in is submitted all users will have the ability to give kudos. Kudos are unlimited (updated after review).
Design the UI for:

- The kudos button for each check in
- pop up menu to see who gave kudos
- User dashboard section in which they can see how many kudos they have gotten
- No weekly allowance, limit, reset, or tooltip.

### On time submissions

I want to track how many times users are submitting on time submissions. This should be visible in their user dashboard section as well as tracked in a leaderboard for which users have the most on time submissions.

For both of these features start with UI mockups in lavish

## Review decisions — October 21, 2026

Mockup: `.lavish/celebrations-ontime.html` (uses Arka's existing Mantine/amber design).

- Kudos are unlimited; the former two-per-week allowance and Sunday reset are removed.
- ANY historical check-in from any week is eligible.
- One award per giver per check-in across its lifetime; no self-awards; awards are final in the initial implementation.
- Keep the give button, count, and recipient popover accessible on collapsed timeline cards. No allowance display or tooltip.
- Recipient popover has avatars, names, check-in context, and “N people have given kudos to this check-in.”
- Dashboard shows kudos received, on-time count, total submissions, and squad position. Hide recent recognition entirely at zero kudos; omit the redundant recognition link and dashboard tagline.
- Show an explicit late badge and deadline/submission timestamps. Late check-ins still count toward total submissions and can receive kudos.
- Name the page **Leaderboard**. Rank by on-time submission count descending, then total submissions descending. No percentages or on-time rates.
- Members with both counts equal share a rank. Use dense ranks without gaps (1, 2, 3, 3, 4, 5). Submission timestamps do not break ties.

## Implementation design

- Reuse immutable CheckIn.createdAt as first-submission time. Add nullable reportingWeekStart (Sunday date) and dueAt (absolute deadline) so historical rows can remain timing-unknown.
- Kudos stores giverId, checkInId, and createdAt. Unique giver/check-in prevents duplicates. The consolidated `20261021120000_celebrations` migration creates only the current unlimited-kudos schema; the temporary limit-removal migration is removed.
- Award server validates ownership and upserts by giver/check-in for idempotency. Historical check-in age never affects eligibility.
- Derive counts and ranks rather than persisting counters. Aggregate check-ins separately from kudos to avoid join multiplication.
- Historical backfill is approved under the same Monday-noon Central rule as new submissions. Use the reusable script; never infer a different historical policy.
- Do not apply migrations to a deployed database as part of this local implementation.

## Confirmed submission deadline

- Deadline confirmed: Monday at 12 PM Central for the Sunday–Saturday reporting week. Implementation uses America/Chicago (CST/CDT); submissions after that time are late for the same week. A submission exactly at noon is on time.

## Historical data

Historical on-time credit is confirmed: apply the same Monday-noon Central deadline to historical submission timestamps. `npm run db:backfill-checkins -- --dry-run` previews the changes and `--apply` records timing for dashboard/leaderboard credit. The script uses DATABASE_URL and is included in the production build. It preserves timestamps and recorded timing, is idempotent, and stops on duplicate user/week conflicts before writes. The user will run it locally and in production. New check-ins are restricted to one submission per person per Sunday–Saturday week, preserving the first timestamp.

## Status

- [x] Interactive UI mockups and schema proposal reviewed in Lavish.
- [x] Prisma schema and migration (verified in an isolated test database, then applied to the actual local `arka` database at the user’s request).
- [x] Kudos API, weekly allowance, and concurrency enforcement.
- [x] Dashboard and leaderboard API/UI.
- [x] Timeline kudos, recipients, and timing state.
- [x] Final verification and documentation.

## Verification

- Backend and frontend production builds pass.
- 26 targeted backend tests cover timing, check-in API/service behavior, and celebrations authentication/validation.
- 18 targeted frontend tests cover dashboard empty states, count/tie rendering, historical awards, limit disabling, recipients, and the existing timeline.
- PostgreSQL integration checks pass against `arka_celebrations_test`: all migrations, simultaneous third-award rejection, idempotent retries, raw slot constraints, historical eligibility, dense ranking, dashboard totals, and immutable first submissions. Fixtures are cleaned up after the run.
- UI files formatted with Prettier. Frontend lint passes with three pre-existing warnings.
- No production migration, deployment, or historical timing backfill performed.
- At the user’s request, removed `arka_celebrations_test` and applied `20261021120000_celebrations` to the configured local `arka` database on localhost:5432.

## Latest change: unlimited kudos

Removed the weekly cap, allowance API/UI, and database slot constraint. One lifetime award per giver per check-in and no self-awards still apply. Original weekly-limit verification above describes the superseded implementation.

## Migration consolidation

The celebrations migration now creates the final CheckIn timing fields and unlimited Kudos model directly. Removed the superseded remove-kudos-limit migration. Existing check-in and kudos data require no schema change.

Local database schema verified against Prisma with no differences. Local migration metadata was reconciled to the consolidated celebrations migration; application tables and data were preserved.
