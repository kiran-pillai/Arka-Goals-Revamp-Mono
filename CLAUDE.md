# Arka Goals

Goal-tracking app: React frontend, NestJS + Prisma backend, PostgreSQL database.

## Railway

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