# Arka Goals

Goal-tracking app: React FE, NestJS + Prisma BE, PostgreSQL database.

## Railway

Production URL: https://cheetahsquadatx.app

Always use the **cheerful-delight** project when inspecting infrastructure via the Railway CLI.

**Read-only access only.** The following are allowed:
- `railway status`, `railway logs`, `railway service`, `railway domain`
- `railway variables` (read/list only)
- Any other read/inspect commands

**Never run** state-changing Railway commands such as:
- `railway up`, `railway deploy`, `railway redeploy`
- `railway delete`, `railway remove`
- `railway variables --set`, `railway variables --delete`
- `railway link` (to a different project), `railway unlink`
- `railway domain --delete`
- Any command that creates, modifies, or destroys Railway resources

## Production details

- Backend listens on port **8080** (not 3000).
- Prisma 7 uses `@prisma/adapter-pg` (PrismaPg) driver adapter — `PrismaClient` cannot be instantiated without it.
- Email sent via Resend API in prod (`NODE_ENV=production`), MailHog SMTP locally.
- Resend free tier: 100 emails/day, 3,000/month.
- Railway console has no `curl` — use `wget` or `node -e "fetch(...)"` for internal requests.