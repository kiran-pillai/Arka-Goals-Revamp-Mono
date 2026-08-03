# Invitation-Only Passwordless (Magic-Link) Auth — Implementation Plan

## Context

The app (Cheetah Squad goals tracker) had **no auth**: a bare NestJS 11 backend
scaffold, and a frontend where `Login.tsx` (an "invite-only, we'll email you a
secure link" form) was mocked but orphaned. Goal: **invitation-only access** — an
admin invites people by email, invitees get a one-time link, and only invited
addresses can ever get in.

**Decisions:** magic-link (passwordless) · admin UI for invites · Mailhog local
SMTP · HTTP-only JWT cookie sessions · Prisma 7 + Postgres · TanStack Router
frontend.

Legend: ✅ done · ⬜ pending.

---

## 1. Database (Prisma) — ✅ DONE

- **`back-end/prisma/schema.prisma`**
  - `User` — `id` (uuid), `email` (citext, unique), `role` enum `MEMBER|ADMIN`,
    `createdAt`, `lastLoginAt?`.
  - `Invite` — `email` (citext), `role`, `status` enum `PENDING|ACCEPTED|REVOKED`,
    `invitedById?` → User, `createdAt`, `acceptedAt?`.
  - `MagicLinkToken` — `tokenHash` (unique, SHA-256 of raw token), `email`,
    `purpose` enum `LOGIN|INVITE`, `expiresAt`, `consumedAt?`, `createdAt`.
- **Prisma 7 specifics:** connection `url` lives in `prisma.config.ts` (not the
  schema); `PrismaClient` uses the `@prisma/adapter-pg` driver adapter; client
  generated to `back-end/generated/prisma` (gitignored).
- **Migration** `20260731051017_init_auth` applied — includes hand-added
  `CREATE EXTENSION citext` and the partial unique index
  `uniq_pending_invite ON Invite(email) WHERE status = 'PENDING'` (one active
  invite per email — the one thing the Prisma schema can't express).
- **`PrismaService`** (`src/prisma/prisma.service.ts`, extends `PrismaClient`,
  `$connect` on init) + `PrismaModule` (global).
- **`prisma/seed.ts`** — upserts the bootstrap admin from `SEED_ADMIN_EMAIL`
  (currently `kiran.sree.pillai@gmail.com`) → seeded successfully.

---

## 2. Infra — ⬜ NEXT

- Add **Mailhog** to `docker-compose.yml` (image `mailhog/mailhog`, ports
  `1025:1025` SMTP + `8025:8025` web UI).
- **`Tiltfile`:**
  - `dc_resource('mailhog', labels=['infra'])`.
  - A `db-migrate` `local_resource` running `npx prisma migrate deploy && npx prisma db seed`
    (dir `./back-end`, `resource_deps=['db']`).
  - New backend env vars (below) in the `back-end` resource's `env={}`.
  - Add `mailhog` + `db-migrate` to `back-end` `resource_deps`.

---

## 3. Backend core — ⬜

- `main.ts`: `app.use(cookieParser())`, global
  `ValidationPipe({ whitelist: true, transform: true })`,
  `app.enableCors({ origin: APP_BASE_URL, credentials: true })`.
- `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })` + import feature
  modules.

---

## 4. Auth module — ⬜

Files under `src/auth/`: `auth.module.ts`, `auth.controller.ts`,
`auth.service.ts`, `dto/`, `strategies/jwt.strategy.ts`,
`guards/jwt-auth.guard.ts` + `admin.guard.ts`, `decorators/current-user.decorator.ts`.

**Endpoints:**

| Method | Path | Guard | Behavior |
|---|---|---|---|
| POST | `/auth/request-link` | public | `{ email }` → always `202` (no user enumeration) |
| POST | `/auth/verify` | public | `{ token }` → sets `session` cookie, returns `{ user }` |
| POST | `/auth/logout` | public | clears cookie |
| GET | `/auth/me` | JwtAuthGuard | returns `{ id, email, role }` or `401` |

**request-link:** user exists → `LOGIN` token + login email; else PENDING invite
exists → `INVITE` token + email; else nothing. Always `202`.

**verify (transaction):** SHA-256 the token, find non-consumed non-expired token;
mark `consumedAt`; if `INVITE` create the User with the invite's role + flip
invite `ACCEPTED`; set `lastLoginAt`; sign JWT; set cookie.

**Magic-link mechanics:** raw = `crypto.randomBytes(32).toString('base64url')`;
stored = SHA-256 hex; link = `${APP_BASE_URL}/auth/callback?token=<raw>`; expiry
15 min; single-use. Cookie: `httpOnly`, `sameSite:'lax'`,
`secure: NODE_ENV==='production'`, `maxAge: 7d`. JWT `{ sub, email, role }`,
`expiresIn:'7d'`, `JWT_SECRET`.

**Guards:** `JwtAuthGuard` reads JWT from the `session` cookie; `AdminGuard`
requires `role === 'ADMIN'`.

---

## 5. Mail module — ⬜

`src/mail/` — `MailService` using plain `nodemailer`
(`createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: false })`, Mailhog
needs no auth). Methods `sendLoginLink(email, url)` / `sendInviteLink(email, url)`.
Wired into `AuthService` (login) and `InvitesService` (invite).

---

## 6. Users / Invites — ⬜

- `src/users/` — `UsersService` (lookup/create/update helpers).
- `src/invites/` — admin-guarded `POST /invites` (`{ email, role? }` → creates
  invite + sends email), `GET /invites` (list), `DELETE /invites/:id` (→ REVOKED).
  Enforce one-pending-invite-per-email (relying on the partial unique index +
  a friendly service check).

---

## 7. Frontend infra — ⬜

- Install `@tanstack/react-router`.
- `src/lib/api.ts` — fetch wrapper: base `import.meta.env.VITE_API_URL`,
  `credentials:'include'`, JSON headers.
- `src/auth/AuthContext.tsx` — `AuthProvider` calls `GET /auth/me` on mount;
  exposes `{ user, loading, refresh, logout }`; feeds router `context`.
- `src/router.tsx` — `createRouter` with typed `context: { auth }`.
- `src/main.tsx` — `<AuthProvider>` inside `MantineProvider`, render
  `<RouterProvider router={router} />`; invalidate router on auth change.

---

## 8. Frontend screens — ⬜

- `/login` (public) — wire `Login.tsx` to `POST /auth/request-link`, keep the
  "check your email" success state.
- `/auth/callback` (public) — read `token` from search, `POST /auth/verify`,
  `refresh()` + navigate to `/`.
- `/` (protected) — `beforeLoad` redirects to `/login` if no user; hosts the
  existing landing/form/table UI (moved out of `App.tsx`'s state machine).
- `/admin/invites` (admin) — `beforeLoad` requires `role === 'ADMIN'`; invite
  form (email + role), invite list with status `Badge`, revoke button.

---

## 9. `front-end/.env` — ⬜

`VITE_API_URL=http://localhost:3000`.

---

## Environment variables (backend)

Set in `back-end/.env` (dev, gitignored) and mirrored in the Tiltfile `back-end`
`env={}`:

| Var | Value (dev) |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/arka` |
| `JWT_SECRET` | long random string |
| `APP_BASE_URL` | `http://localhost:5173` |
| `SEED_ADMIN_EMAIL` | `kiran.sree.pillai@gmail.com` |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` |
| `MAIL_FROM` | `Cheetah Squad <noreply@arka.local>` |
| `NODE_ENV` | `development` |

---

## Verification (end-to-end)

1. `tilt up` — `db`, `mailhog`, `db-migrate`, `back-end`, `front-end` all green.
2. Open Mailhog at http://localhost:8025 (empty).
3. Visit http://localhost:5173/login, enter `SEED_ADMIN_EMAIL`, submit →
   "check your email".
4. In Mailhog, click the login link → `/auth/callback` → `POST /auth/verify` sets
   the httpOnly `session` cookie → redirect to `/` authenticated; `GET /auth/me`
   returns the admin.
5. As admin at `/admin/invites`, invite `member@example.com` → row `PENDING`,
   email arrives in Mailhog.
6. Incognito: click invite link → user created as `MEMBER`, invite → `ACCEPTED`,
   lands authenticated; `/admin/invites` is `403` for the member.
7. Negative checks: reused link rejected; expired (>15 min) rejected; request-link
   for an uninvited email returns `202` but sends no email; `POST /auth/logout`
   clears the cookie and `/auth/me` → `401`.