## Arka Goal Redesign

### Purpose 
In the Arka Men's group currently the process for men to add their weekly and quarterly goals is done through google sheets and forms. Men add their quarterly goals to a form every week and add their weekly goals by noon on Monday every week. It is a very disjointed process that we want to make better through the use of an application

### Goals Cups Rules
Currently, the arka group is implementing a "Goals Cup" plan. The plan is laid out below: 
The time has come to officially kick off the *Q3 Goals Cup!*

This will be an individual, points based competition with plenty of twists and turns along the way.

Your initial goals are due by tomorrow *Thursday July 9th at 11:59pm*. If not submitted on time, you will be docked -**2** points for every day they are late.

The core ways to score points will be as follows…

*SCORING OPPORTUNITIES*

- *Weekly goals*: 5 pts (2.5 for on time by Mon noon + 2.5 for completion)
- *Give Ups:* 20 points per month (+5 points for 2 month give ups, +10 points for 3 month give ups)
- *Monthly goals:* 20 points
- *Quarterly goal:* 60 points

*KEY RULES TO NOTE*

1. *NO LIMIT to # of Goals Submitted.*
Submit as many goals or give ups as you want in a given week, month, or quarter. BUT if you commit to more than one, it's ALL or NOTHING… meaning you must complete every one to score points, or miss a single one and walk away with ZERO for that period. Stack at your own risk.

2. *Choose to set MONTHLY or QUARTERLY Goals. NOT BOTH*
You can either set Monthly Goals (new goals selected each month, submitted Jul 9, Aug 1, & Sep 1) OR a single Quarterly Goal. You do NOT get both. Choose this before you set anything else.

*DEADLINES*

- Weekly: every Monday by noon
- Monthly: July 9, Aug 1, Sep 1
- Quarterly: set July 9, can modify through Aug 15 if things genuinely shift (eg. land a job, get a girlfriend)

Goals must be specific and measurable. Action-based (100 applications) or pass/fail (land the job).

Twists are coming. Fluffy goals will be challenged, recognition for the man who’s crushing it mot will be voted on, etc. There will many more opportunities to earn points.

*The first form is DUE by Thursday 11:59pm.*

SUBMIT YOUR GOALS HERE: https://docs.google.com/forms/d/e/1FAIpQLScfVwoEnyBDRb8_HA-0m03_X1I1oOAG-btzWk-TeW6pVVnTpg/viewform?usp=header

Let's get after it!

Lastly, there will be two groups for this initial week of competition These are groups are for support purposes to help any man who is stuck and accountability to ensure everyone locked in…. they will NOT be static for the duration of the quarter.

*SCORING OPPORTUNITY:* If EVERYONE on your team gets their form completed on-time, you will ALL earn 2 points.

*Team A:*

- Matt
- Kiran
- Ashkan
- Isa
- Brian
- Anthony

*Team B:*

- Josh
- Grant
- Mike
- Jackson
- Jorge


### High level features

#### Core (from original scope)
- Auth for each man. Done through invite only through email link
- Process to enter weekly goals
- View for each man to see his progress for completing goals and how many points he has earned
- View for leaderboard by person
- View for leaderboard by group

#### Goal management
- **Goal setup wizard** that enforces the rules: choose Monthly OR Quarterly (not both) before anything else, then guide entry accordingly.
- **Goal type support**: weekly goals, give-ups, monthly goals, quarterly goals — each with its own cadence and point value.
- **Action-based vs. pass/fail goals**: action-based goals track a numeric target (e.g. 100 applications → progress bar), pass/fail goals are a single checkbox (e.g. "land the job").
- **Multi-goal stacking with all-or-nothing logic**: allow unlimited goals per period, but the scoring engine awards points only if *every* goal in that period is completed. Clearly warn the user of the risk at submission time.
- **Quarterly goal modification window**: allow editing a quarterly goal only through the Aug 15 cutoff, then lock it.
- **Give-up streak tracking**: track consecutive months of a give-up to auto-apply the +5 (2-month) / +10 (3-month) bonuses.

#### Scoring engine
- **Automated point calculation** for every goal type, including the split weekly scoring (2.5 on-time + 2.5 completion).
- **Late-submission penalties**: auto-dock -2 points/day for initial goals submitted after the deadline.
- **Deadline awareness**: system knows weekly (Mon noon), monthly (Jul 9, Aug 1, Sep 1), and quarterly deadlines and scores against them.
- **Team on-time bonus**: award all members of a team +2 points when every member submits on time for the week.
- **Audit/history log** of every point change so scores are transparent and disputable.


#### Weekly check-in (replaces the current weekly Google Form)
The existing weekly form is both a goal-entry and a reflection ritual. The app's weekly flow should preserve all four prompts:
- **Results from last week**: "Did you complete your commitments from last week?" — mark each prior goal complete/incomplete and optionally share results. This directly feeds the completion side of weekly scoring.
- **This week's commitments**: "What actions are you committing to THIS WEEK?" (due Mon noon) — the goal-entry step, with the all-or-nothing stacking warning.
- **Wins**: "What went well last week?" — free-text reflection, celebrated in the weekly recap.
- **Friction / areas of improvement**: "What did NOT go well last week?" — free-text, private-by-default but shareable with support teammates for accountability.
- **Single unified flow**: last-week review + this-week commitment + reflection all in one guided screen, so a man completes his whole weekly ritual in one sitting (fixing the "disjointed" multi-form problem).
- **Reflection history**: journal-style timeline of a man's wins/friction over the quarter to spot patterns.

#### Deadlines, reminders & notifications
- **Automated reminders**: email/push nudges before each deadline (e.g. Sunday night + Monday morning for weekly goals).
- **Deadline countdown** on the dashboard showing time left to submit or mark complete.
- **Completion check-in prompt**: end-of-week prompt to mark each weekly goal complete/incomplete.

#### Views & engagement
- **Personal dashboard**: current points, active goals with progress, upcoming deadlines, streaks, and point history.
- **Leaderboard by person and by team** (already in scope) plus a movement indicator (▲/▼ rank change vs. last week).
- **NICE TO HAVE: Weekly recap**: summary of who completed what, top scorer, biggest mover.
- **Historical/period views**: filter progress and standings by week, month, or the full quarter.
- **Peer visibility**: see other men's active goals and completions for accountability (respecting the group's support-team structure).

#### Admin / commissioner tools
- **Member & invite management**: send/revoke email invites, assign men to support teams (non-static across the quarter).
- **Competition config**: define quarters, deadlines, point values, and team rosters per season so the app is reusable for Q4 and beyond.
- **Data export**: export standings and goals (CSV) to preserve continuity with the old sheets-based process.

#### Nice-to-haves
- **Mobile-friendly / PWA** so men can submit and check in from their phones.
- **Slack integration**: post weekly recaps and reminders to the group Slack, and allow quick goal submission from Slack.
- **Achievement badges** for streaks and milestones to drive engagement.
- Reminder email sent at Noon on Sunday to complete goals