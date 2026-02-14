# ClassLite

An IELTS learning management platform built as a TurboRepo monorepo.

## Architecture

- **Frontend:** `apps/webapp` — React + Vite + Tailwind + Shadcn/UI, served via nginx
- **Backend:** `apps/backend` — Fastify + Prisma + Firebase Auth
- **Database:** `packages/db` — Prisma schema, migrations, and tenanted client
- **Shared:** `packages/ui`, `packages/types`

## Development

```bash
pnpm install                          # Install dependencies
pnpm --filter=db db:migrate:dev       # Apply database migrations
pnpm --filter=backend dev             # Start backend (localhost:3000)
pnpm --filter=webapp dev              # Start frontend (localhost:5173)
pnpm --filter=backend test            # Run backend tests
```

After adding new backend routes, sync the frontend OpenAPI schema:
```bash
pnpm --filter=webapp sync-schema-dev  # Requires backend running
```

## Deployment Workflow

ClassLite uses **Railway** with GitHub integration for deployments. No separate GitHub Actions deploy workflows are needed — Railway watches branches directly.

### Environments

| Environment | Branch    | URL                          | Database         |
|-------------|-----------|------------------------------|------------------|
| Staging     | `develop` | `my-staging.classlite.app`      | Railway Postgres (staging) |
| Production  | `master`  | `my.classlite.app` / `api.classlite.app` | Railway Postgres (production) |

### Promotion Flow

```
feature branch → PR → develop (auto-deploy staging) → PR → master (auto-deploy production)
```

1. **Feature development:** Create branch from `develop`, open PR back to `develop`
2. **Staging deploy:** Merge PR to `develop` — Railway auto-deploys to staging
3. **Production promote:** Merge `develop` to `master` — Railway auto-deploys to production
4. **CI gating:** Railway waits for all CI check suites to pass before deploying

### Infrastructure

- **SSL:** Automatic via Railway custom domains
- **Database backups:** Railway automated daily backups on production Postgres
- **Health check:** `GET /api/v1/health` — returns `{status, timestamp, version}` (200) or 503 if DB unreachable
- **Security:** `@fastify/helmet`, `@fastify/rate-limit` (100 req/min per IP), CSP headers on nginx, CORS restricted to production domains
- **Firebase:** Separate projects for staging and production

## Adding UI Components

```bash
pnpm dlx shadcn@latest add button -c apps/webapp
```
