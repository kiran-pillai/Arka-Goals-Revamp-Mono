# My Dashboard — Implementation Plan

## Context

Signed-in users currently land on a marketing-style screen with two buttons
(`Enter Weekly Form`, `View check-ins`). There is no personal view: nothing tells
a member what they owe this week, when it's due, or how they're tracking against
the squad. This plan adds **My Dashboard** as the primary post-login surface.

The original sketch (kept verbatim in [Appendix A](#appendix-a--original-sketch))
listed seven metric groups. Auditing them against `schema.prisma` revealed that
**most have no backing data** — only check-in submission and team accountability
are derivable today. So this plan is **schema-first**: model the data, then build
the UI on top of real values.

Scope landed on **three new tables** (`Commitment`, `Goal`, `Abstinence`) and
**no changes to existing ones**. An earlier draft also proposed a `Season` model,
a `PointsLedger`, and a `weekKey` column; all three were cut — see
[Removed from scope](#removed-from-scope) for why.

**Decisions** (from the brainstorm review, 2026-08-29):

| Question | Decision |
|---|---|
| Layout direction | **B — Action first**: commitments lead, analytics in a sidebar |
| v1 scope | **Design the schema first**, before building dashboard UI |
| Entry point | **Primary button**; `Enter Weekly Form` / `View check-ins` demoted to subtle |
| Week definition | **Monday 12:00 PM, hardcoded** (single squad for now) |
| Points / rank | **Cut entirely** — not relevant |
| "Completion: Pending" | Means **the end date hasn't arrived yet**, not awaiting review |
| `CheckIn.weekKey` | **Not added** — derived from `createdAt` |
| Goal / give-up creation | **Quarterly setup flow** at the start of each quarter; both are scoped to that quarter |
| Weekly goal completion rate | Counts **weekly** goals (`CheckIn.completedGoal`) over the weeks in the current quarter; **resets each quarter** |
| Setup screen | **One-time wizard** per quarter, no cap on goals or give-ups |
| Revising mid-quarter | **Users cannot**; an admin can unlock a specific user's goal |
| Overdue `PENDING` goal | Counts as **`FAILED`** |

Legend: ✅ done · ⬜ pending.

---

## 1. Data-readiness audit — ✅ DONE

What the current schema (`User`, `CheckIn`, `Invite`, `MagicLinkToken`) can
support, and what each missing metric needs:

| Metric | Status | Gap |
|---|---|---|
| Check-in submission status | ✅ have | Already in `CheckIn` |
| Team accountability | ✅ have | Users + who submitted this week |
| **Weekly** goal completion rate | ✅ have | Counts weeks where `CheckIn.completedGoal` was true, over the weeks in the current quarter — no `Goal` rows involved |
| Weekly submission rate | ⚠️ partial | Denominator = weeks elapsed since the user's first check-in |
| Longest streak | ⚠️ partial | Computed from `createdAt` history |
| Next deadline | ✅ derivable | Pure function of "next Monday noon" — no storage needed |
| Commitments as checkboxes | ❌ none | `CheckIn.commitments` is one free-text blob; the form must capture discrete items (§4.4) |
| Quarterly goals | ❌ none | No `Goal` model |
| Give-ups (Day 42 / 90) | ❌ none | No abstinence model |

**Consequence:** three new tables (Phase 2). No changes to `CheckIn` are needed.
Rank and points are **out of scope** — see [Removed from scope](#removed-from-scope).

---

## 2. Schema design — ⬜ NEXT

New models. All user-scoped rows cascade on user delete, matching `CheckIn`.

### 2.1 No `CheckIn` changes, no `Season` table

Two things considered and **deliberately rejected**:

- **A `Season` model** — it would have tracked quarters, the check-in cadence,
  and a rate denominator. But the cadence is one hardcoded constant (Monday
  noon), quarters are already implied by `Goal.targetDate`, and the submission-rate
  denominator is just "weeks since the user's first check-in." Nothing was left
  for the table to own.
- **A `weekKey` column on `CheckIn`** — derivable from `createdAt`, and with a
  single user per account there are no concurrent writes to guard against. A
  service-layer "already submitted this week?" check is sufficient.

> **Still worth fixing:** the local DB has **4 check-ins for one user in
> `2026-W33`** (out of 5 rows), from testing. Nothing prevents a double-click
> from doing that again, so Phase 3 adds a service-layer guard. If late
> submissions ever need to count for the *previous* week, revisit `weekKey` then —
> that's the one thing deriving the week can't express.

### 2.2 `Commitment`
Turns this week's free-text `commitments` into tickable items.

- `id`, `userId`, `checkInId` (which check-in declared it)
- `text`, `completed` (bool), `completedAt?`
- `@@index([userId])`

The week a commitment belongs to comes from its `checkIn.createdAt` — no
separate week field.

Commitments are **entered as discrete items in the weekly form** (see §4.4), so
each row arrives already structured — no line-splitting or parsing of a free-text
blob.

> `CheckIn.commitments` stays on the model so existing rows remain readable, but
> new check-ins populate `Commitment` rows as the source of truth. Nothing is
> dropped, so the migration stays additive.

### 2.3 `Goal`
Quarterly goals, declared during quarterly setup. **Completion is evaluated at
`targetDate`** (see [Completion semantics](#23a-completion-semantics)).

- `id`, `userId`, `title`
- `quarter` — the quarter this goal belongs to (e.g. `2026-Q3`)
- `startsAt`, `targetDate` (end of the quarter)
- `outcome` enum `PENDING|COMPLETED|FAILED`, default `PENDING`
- `resolvedAt?` — when the outcome was set
- `@@index([userId, quarter])`, `@@index([userId, outcome])`

### 2.3a Completion semantics

Per your clarification: **"Completion: Pending" means the goal or give-up hasn't
reached its end date yet** — it is not awaiting review by another person. So:

- `outcome` stays `PENDING` while `now < targetDate`.
- At `targetDate` it resolves to `COMPLETED` or `FAILED`.
- **Give-ups resolve automatically**: `FAILED` the moment `brokenAt` is set,
  `COMPLETED` if the target date passes with `brokenAt` still null. No user
  action required.
- **Goals need the user to say whether they made it** — nothing in the system
  can observe "ran a half marathon." The user marks it in the dashboard once
  `targetDate` has passed, or the weekly check-in form asks about any goal whose
  date has elapsed.
- **An overdue `PENDING` goal counts as `FAILED`.** If the date passed and the
  user never claimed it, the goal did not happen. The dashboard should still
  prompt them to confirm *before* the date passes, but silence after it is not
  treated as ambiguity.
- Because give-ups self-resolve and goals resolve on the user's own say-so, **no
  reviewer role and no `reviewedBy` field is needed.**

### 2.4 `Abstinence` (the "give-ups")
Day 42 / 90 progress.

- `id`, `userId`, `label` (e.g. "Dating apps")
- `quarter` — the quarter this give-up was declared for
- `startedAt`, `targetDays` (int, e.g. `90`)
- `brokenAt?` (null = still going), `notes?`
- Current day = `now - startedAt`; progress = `day / targetDays`.
- Derived outcome: `FAILED` if `brokenAt` is set; `COMPLETED` if
  `startedAt + targetDays <= now`; otherwise `PENDING`.
- `@@index([userId])`

> `targetDays` + `brokenAt` is enough to derive the outcome, so it isn't stored —
> unlike `Goal`, nothing here depends on a user's judgment.

---

## 3. Backend — ⬜ PENDING

- **Migration** `add_dashboard_models`: adds `Commitment`, `Goal`, `Abstinence`
  (+ the `GoalOutcome` enum). Purely additive — no changes to existing tables, so
  no backfill and no dedupe migration.
- **Double-submit guard** in `CheckInsService.create`: reject if the user already
  has a check-in in the current week. This is what prevents a repeat of the
  4-rows-in-`2026-W33` situation.
- **`src/dashboard/`** module:
  - `GET /dashboard` → one aggregated payload for the whole view (single
    round-trip; the page shows ~8 sections and shouldn't fan out).
  - Guarded by `JwtAuthGuard`, scoped to `@CurrentUser()` — same pattern as
    `CheckInsController`. Never accept a `userId` from the client.
- **`DashboardService`** computes: next deadline, this week's submission status,
  the three rates, longest streak, and pulls commitments/goals/abstinences with
  their derived outcomes. The weekly goal completion rate counts weeks where
  `CheckIn.completedGoal` was true, divided by weeks elapsed in the current
  quarter.
- **Quarterly setup endpoints** — creating goals and give-ups for a quarter:
  - `POST /goals` and `POST /abstinences`, both `JwtAuthGuard`-scoped to
    `@CurrentUser()`, stamping the current quarter server-side rather than
    trusting a client-supplied one.
  - `GET /quarter/setup-status` → whether the caller has declared anything for
    the current quarter, so the dashboard knows to show the setup prompt.
- **Locking, and the admin override.** Once a quarter is set up, `POST`/`PATCH`
  on that quarter's goals is **rejected for the owning user**. Admins get more
  than a backdoor: `PATCH /admin/goals/:id` lets an `ADMIN` **edit any user's
  goal directly**, and an admin can also unlock a goal so the user may revise it
  themselves. Same `ADMIN` role check as the existing invites module, and the
  admin path must take the target `userId` explicitly rather than inferring it.
- **Quarter helper** alongside the week helper — `currentQuarter(date)`,
  `quarterBounds(quarter)`, `weeksElapsedInQuarter(quarter, now)`.
- **Week helper** (`src/common/week.ts`) — pure functions, no DB:
  - `weekStart(date)` / `weekEnd(date)` — the Monday-noon-bounded window a date
    falls in.
  - `nextDeadline(from)` — next Monday 12:00 in the configured timezone.
  - `weeksElapsed(firstCheckIn, now)` — the submission-rate denominator.
  - Unit-test these: off-by-one week boundaries are the likeliest source of
    wrong numbers on the page.
- **Deadline constants** in `src/config/configuration.ts`:
  `CHECKIN_DAY = 1` (Monday), `CHECKIN_HOUR = 12`, plus a squad timezone. One
  place to change if the cadence ever becomes configurable.

---

## 4. Frontend — ⬜ PENDING

### 4.1 Entry point
Per the decision, `My Dashboard` becomes the **primary** action on the landing
screen; the other two become `variant="subtle"`. Keep them in the existing
equal-width `Stack` so all three still align.

New route `/dashboard` (TanStack Router, auth-guarded like the current routes),
plus a `useDashboard()` query hook in `src/lib/dashboard.ts` mirroring
`src/lib/checkins.ts`.

### 4.2 Layout — Option B, "action first"
Two columns at `≥900px`, single column below. Uses the existing amber/bronze
tokens and the new full-width shell.

**Main column** (what you owe):
1. **Header** — greeting and a live "due in 2d 4h" countdown to Monday noon
2. **Commitments this week** — tickable rows, accented left border
3. **Give-ups in progress** — label, `Day N / target`, progress bar
4. **Goals** — title and outcome. While `targetDate` is still ahead, a goal
   nearing its date renders as an **action prompt** ("Did you hit this?") so the
   user can claim it in time. Once the date has passed it reads as `FAILED`.

**Sidebar** (how you're doing):
5. **This week's check-in** — Submitted / Not yet
6. **Your numbers** — weekly goal completion rate (this quarter), submission
   rate, longest streak
7. **Squad this week** — member pills, ✓ submitted / ⏳ pending

### 4.2a Quarterly setup
A **one-time wizard** per quarter, with no cap on how many goals or give-ups a
user declares. The dashboard has a distinct state for a user who hasn't run it
yet: instead of three empty sections, a single **"Set up your quarter"** prompt
leading to the wizard. Once set, that prompt disappears for the rest of the
quarter and the goals render read-only — a locked goal shows why it can't be
edited and that an admin can change it.

### 4.2b Admin goal editing
Admins **edit users' goals from the UI**, not just via the API. Extends the
existing `/admin` area (alongside `Manage invites`) with a member list → that
member's goals for the current quarter → inline edit of title and target date,
plus an **unlock** toggle that lets the user revise it themselves. Gated on
`user?.role === 'ADMIN'`, matching how `Manage invites` is already conditionally
rendered in [HomeRoute.tsx](front-end/src/routes/HomeRoute.tsx).

### 4.3 UX principles
- **One clear focus per screenful.** The countdown and commitments are the only
  high-contrast elements above the fold; analytics stay quiet.
- **Progress bars over bare percentages** — shape reads faster than digits.
- **Honest empty states.** Any section without data says so ("No give-ups
  tracked yet") with a setup affordance — never a zero that looks like failure,
  never a placeholder that looks real.
- Respect `prefers-color-scheme`; both themes already have tokens.
- Semantic status colors: green submitted, muted amber pending, red missed —
  never color alone (pair with ✓/⏳ glyphs and text) so it stays accessible.


### 4.4 Commitments in the weekly form
Today the form has one `Textarea` for "What actions are you committing to THIS
WEEK?" ([WeeklyCheckIn.tsx:124-131](front-end/src/WeeklyCheckIn.tsx#L124-L131)),
which produces a free-text blob the backend can't track per item. Replace it with
a **repeatable list of single-line inputs**:

- One `TextInput` per commitment, an `Add commitment` button beneath, and a
  remove control on each row. No cap.
- Submits as `commitments: string[]`, so `CreateCheckInDto` gains
  `@IsArray() @IsString({ each: true }) @ArrayNotEmpty()` and
  `CheckInsService.create` writes one `Commitment` row per entry in the same
  transaction as the `CheckIn`.
- Keep writing the joined text to `CheckIn.commitments` so the existing
  check-ins table keeps rendering without change.

This is what makes the dashboard's tickable commitments possible — the items have
to be discrete at entry, since nothing can reliably split a paragraph into
intentions after the fact.

> **Contract change.** `commitments` goes from `string` to `string[]` on the POST
> body. The DTO and [checkin.ts](front-end/src/checkin.ts) types change together,
> and `whitelist: true` will reject the old shape rather than silently coercing
> it, so both sides must ship at once.
---

## 5. Testing — ⬜ PENDING

- **`week.spec.ts`** — the boundary cases: a submit at Monday 11:59 vs 12:01, a
  DST transition week, and a year rollover (W52 → W01).
- **`dashboard.service.spec.ts`** — rates with zero weeks elapsed (no
  divide-by-zero on a brand-new user), streak with gaps, give-up outcome
  derivation on all three branches (`brokenAt` set / target passed / still
  running), and a goal past `targetDate` still `PENDING` reported as `FAILED`.
- **`dashboard.controller.spec.ts`** — 401 unauthenticated; payload scoped to the
  caller and never to a client-supplied `userId`.
- **`goals.service.spec.ts`** — the quarter stamp comes from the server, not the
  request body; a second setup attempt in the same quarter is rejected; an
  unlocked goal becomes editable again.
- **Admin authorization** — a non-admin calling `PATCH /admin/goals/:id` gets
  403, and an admin editing another user's goal succeeds. This is the one place
  where acting on someone else's row is intended, so it needs a test proving the
  role check holds.
- **`checkins.service.spec.ts`** — extend with the new double-submit guard.

---

## Removed from scope

- **Points and rank.** Dropped per decision — no `PointsLedger`, no scoring
  rule, no "Rank #4 / 11" or "Points Available: 5" in the header. This also
  removed the only genuinely blocked section, so the plan is now fully
  buildable. The original sketch's mentions are kept in Appendix A for history
  only.
- **A `Season` model.** It would have owned quarters, cadence, and a rate
  denominator; each turned out to live better elsewhere (`Goal.targetDate`,
  a config constant, and "weeks since first check-in" respectively).
- **`CheckIn.weekKey`.** Derivable from `createdAt`; with one user per account
  there are no concurrent writes, so a service-layer guard replaces the DB
  constraint it would have enabled.
- **A reviewer role.** "Completion: Pending" means *the end date hasn't
  arrived*, not *awaiting someone's review* — so no `reviewedBy` field.

## Open questions

1. **Squad model.** "Team accountability" assumes a roster; today *all* users
   are implicitly one squad. Fine for now — a real `Squad` table is needed
   before a second group joins.

---

## Appendix A — original sketch

Preserved as written, for reference:

```
Top Section
Kiran

Rank: #4 / 11

Next Deadline:
Monday @ 12:00 PM

Current Commitments
THIS WEEK

☐ Read 30 pages DDIA
☐ Surf 3 times
☐ No dating apps

Due Monday Noon

Monthly/Quarterly Goal
List goals
Status
Give ups
Dating Apps
Day 42 / 90

Alcohol
Day 12 / 30

Weekly check-in Status
Current Week

Submission:
✓ Submitted

Completion:
Pending

Points Available:
5

Team Accountablity

✓ Matt
✓ Kiran
✓ Isa
✓ Anthony
✓ Brian
⏳ Ashkan

Personal Analytics
Goal Completion Rate
82%

Weekly Submission Rate
100%

Longest Streak
7 weeks
```
