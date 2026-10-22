# Arka Goals — Cheetah Squad

A weekly goal-tracking app for the Cheetah Squad. Squad members submit weekly check-ins covering goal completion, results, commitments, wins, and frictions. Admins manage the roster through an invite-only system with passwordless magic-link authentication.

## Tech Stack

| Layer     | Technology                                          |
| --------- | --------------------------------------------------- |
| Frontend  | React 19, Vite, Mantine v9, TanStack Router & Query |
| Backend   | NestJS 11, Prisma 7 (PostgreSQL), Passport JWT      |
| Database  | PostgreSQL 16                                        |
| Mail      | Resend in production, Nodemailer + MailHog in dev    |
| Dev tools | Tilt, Docker Compose                                 |

## Prerequisites

- **Node.js** (v20+)
- **Docker** & **Docker Compose**
- **Tilt** (optional — orchestrates everything in one command)

### Installing Docker

Docker Desktop includes both `docker` and `docker compose`.

- **macOS**: Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) or install via Homebrew:
  ```sh
  brew install --cask docker
  ```
- **Windows**: Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Requires WSL 2 — the installer will prompt you to enable it if needed.
- **Linux**: Install Docker Engine and the Compose plugin following the official guide for your distro at [docs.docker.com/engine/install](https://docs.docker.com/engine/install/).

After installing, verify with:
```sh
docker --version
docker compose version
```

### Installing Tilt

Tilt watches your files, rebuilds, and restarts services automatically.

- **macOS**:
  ```sh
  brew install tilt-dev/tap/tilt
  ```
- **Windows**:
  ```sh
  iex ((new-object net.webclient).DownloadString('https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.ps1'))
  ```
- **Linux / manual**:
  ```sh
  curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
  ```

After installing, verify with:
```sh
tilt version
```

## Quick Start (with Tilt)

```sh
tilt up
```

This starts PostgreSQL and MailHog via Docker Compose, then launches the backend and frontend as local processes. The Tilt UI shows logs and status for each service.

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:3000      |
| MailHog  | http://localhost:8025      |

## Manual Start (without Tilt)

### 1. Start infrastructure

```sh
docker compose up -d
```

This launches PostgreSQL (port 5432) and MailHog (SMTP on 1025, web UI on 8025).

### 2. Set up the backend

```sh
cd back-end
npm install
npm run db:migrate   # runs Prisma migrations + seeds the admin user
npm run start:dev    # starts NestJS in watch mode on port 3000
```

### 3. Set up the frontend

```sh
cd front-end
npm install
npm run dev          # starts Vite dev server on port 5173
```

## Environment Variables

### Backend (`back-end/.env`)

| Variable           | Default                              | Description                                                                 |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`     | — (required)                         | PostgreSQL connection string. Locally: `postgresql://postgres:postgres@localhost:5432/arka` |
| `NODE_ENV`         | `development`                        | Set to `production` to switch email from MailHog SMTP to the Resend API      |
| `PORT`             | `3000`                               | Backend listen port. Production listens on `8080`                            |
| `JWT_SECRET`       | `dev-only-change-me`                 | Secret for signing session JWTs. Must be set to a real secret in production  |
| `APP_BASE_URL`     | `http://localhost:5173`              | Frontend origin, used for CORS and for building magic-link URLs             |
| `MAIL_FROM`        | `Cheetah Squad <noreply@arka.local>` | Sender address for sign-in and invite emails                                 |
| `SMTP_API_KEY`     | — (empty)                            | Resend API key. Required when `NODE_ENV=production`; ignored otherwise        |
| `SMTP_HOST`        | `localhost`                          | SMTP host for local mail capture. Ignored when `NODE_ENV=production`          |
| `SMTP_PORT`        | `1025`                               | SMTP port for local mail capture. Ignored when `NODE_ENV=production`          |
| `SEED_ADMIN_EMAIL` | — (optional)                         | Seeds the first admin account on `npm run db:migrate`; skipped if unset       |

Despite the `SMTP_` prefix, `SMTP_API_KEY` is a **Resend** API key, not an SMTP
credential. In production the backend sends through the Resend HTTP API and the
`SMTP_HOST` / `SMTP_PORT` values go unused; locally it does the reverse.

### Frontend (`front-end/.env`)

| Variable       | Default                 | Description                                                      |
| -------------- | ----------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:3000` | Backend API origin. Only `VITE_`-prefixed vars reach the browser |

## Authentication

The app uses **magic-link authentication** — no passwords.

1. A user enters their email on the login page.
2. If the email belongs to an invited (or existing) user, the backend sends an email with a one-time sign-in link.
3. Clicking the link verifies the token and sets an `httpOnly` session cookie (JWT, 7-day expiry).
4. In development, emails are captured by **MailHog** — open http://localhost:8025 to view them.

### First-time Setup

The `SEED_ADMIN_EMAIL` env var creates the initial admin account during `npm run db:migrate`. That admin can then sign in via magic link and invite other members from the **Manage Invites** page.

## Features

### Weekly Check-ins

Squad members submit a weekly form with:

- **Goal completion** — did you hit your weekly goal? (yes/no)
- **Results** — what were the outcomes?
- **Commitments** — what are you committing to this week?
- **Wins** — what went well?
- **Frictions** — what got in your way?

Past check-ins are viewable in a table from the home screen.

### Invite Management (Admin)

Admins can:

- Send email invites to new members (as MEMBER or ADMIN role)
- View all invites and their status (PENDING / ACCEPTED / REVOKED)
- Revoke pending invites

Navigate to the invite management page via the **Manage invites** link on the home screen (visible to admins only).

## Project Structure

```
├── back-end/
│   ├── prisma/              # Schema, migrations, seed script
│   └── src/
│       ├── auth/            # Magic-link auth, JWT strategy, guards
│       ├── checkins/        # Weekly check-in CRUD
│       ├── invites/         # Invite management
│       ├── mail/            # Email service (Nodemailer)
│       ├── prisma/          # Prisma client module
│       ├── users/           # User lookup service
│       └── config/          # Typed app configuration
├── front-end/
│   └── src/
│       ├── auth/            # Auth context & helpers
│       ├── lib/             # API client, React Query hooks
│       └── routes/          # Route components (Login, Home, Admin)
├── docker-compose.yml       # PostgreSQL + MailHog
└── Tiltfile                 # Dev orchestration
```

## Common Commands

| Command                          | Description                          |
| -------------------------------- | ------------------------------------ |
| `tilt up`                        | Start everything                     |
| `tilt down`                      | Stop everything                      |
| `docker compose up -d`           | Start Postgres + MailHog             |
| `cd back-end && npm run start:dev` | Start backend in watch mode        |
| `cd front-end && npm run dev`    | Start frontend dev server            |
| `cd back-end && npm run db:migrate` | Run migrations + seed             |
| `cd back-end && npm test`        | Run backend unit tests               |
| `cd front-end && npm run build`  | Production build of the frontend     |
| `cd front-end && npm run lint`   | Lint frontend with oxlint            |

## Celebrations, dashboard, and leaderboard

Members can give unlimited kudos to any historical check-in. Each member can give
one lifetime award per check-in, cannot award themselves, and cannot revoke an
award. Duplicate requests are idempotent and PostgreSQL prevents duplicate awards.

Check-ins are due **Monday at 12 PM Central** for their Sunday–Saturday reporting
week. Exactly noon is on time; later submissions are late. Central time follows
CST/CDT. New check-ins are limited to one per member per week. Historical rows use the same deadline rule when recorded with the backfill script
below. Until backfilled, they retain unknown timing, count toward total submissions,
and can receive kudos.

`/dashboard` shows recognition and submission counts. `/leaderboard` sorts by
on-time submissions, then total submissions, both descending. Equal pairs share a
rank; ranks continue without gaps. No on-time percentages are used.

Authenticated API endpoints:

- `GET /celebrations/dashboard`
- `GET /celebrations/leaderboard`
- `GET /checkins/:id/kudos`
- `POST /checkins/:id/kudos` (idempotent for the same giver/check-in)

Apply pending migrations, including `20261021120000_celebrations`, and regenerate the Prisma client
before running the updated server. The migration preserves existing check-ins.
The implementation does not apply migrations to deployed databases automatically.

To exercise database constraints and concurrent awards, use a dedicated database
whose name ends in `_test`; run migrations against it, build the backend, then:

```sh
cd back-end
CELEBRATIONS_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arka_celebrations_test node test/celebrations.integration.cjs
```

The integration script removes only its own fixtures. Review decisions are recorded
in `.claude/plans/Celebrations_Ontime_submission.md`.

### Record historical check-in timing

The same script runs locally or in the production backend container. Apply the
celebrations migration first. In a source checkout, build the backend first;
the production image already contains the compiled script.

```sh
cd back-end
npm run build
npm run db:backfill-checkins -- --dry-run
npm run db:backfill-checkins -- --apply
```

The script uses `DATABASE_URL` from the environment (or `back-end/.env` locally).
Set it to the intended database before running. It prints the host and database
without credentials. Running without flags is a dry run. Use `--help` for usage.

For each historical submission it records the Sunday reporting-week date and
Monday 12 PM `America/Chicago` deadline, accounting for CST/CDT. Exactly noon is
on time. The existing dashboard and leaderboard then include its on-time credit
without any counter rebuild. Existing recorded timing and original submission
contents/timestamps are preserved; rerunning does not change completed rows.

Duplicate submissions for the same member/week are reported by check-in ID.
The script stops before writes rather than deleting a submission or picking one
arbitrarily, because the schema permits only one recorded check-in per member/week.
`--apply` runs atomically and briefly blocks check-in writes while allowing readers.
No backfill runs automatically during application startup or deployment.
