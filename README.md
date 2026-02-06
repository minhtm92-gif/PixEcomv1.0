# PixEcom v1.0

Production-ready dark-mode PixEcom demo monorepo with mocked Facebook ads workflows.

## Stack
- pnpm workspaces
- `apps/api`: NestJS + Prisma + PostgreSQL
- `apps/web`: Next.js App Router + TypeScript + Tailwind + shadcn-style UI

## Quick Start
### Install dependencies (proxy-safe)
```bash
corepack disable
npm install -g pnpm@9
pnpm install --frozen-lockfile
```

### Run services
```bash
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

Open web at http://localhost:3000 and API at http://localhost:4000 (`/api` for Swagger).

## Troubleshooting
If you see a Corepack download failure such as HTTP tunneling/proxy `403 Forbidden` when running `pnpm` commands, it usually means Corepack is trying to fetch the pnpm tarball through a restricted proxy path.

Use the proxy-safe install flow above to bypass Corepack entirely:

```bash
corepack disable
npm install -g pnpm@9
pnpm install --frozen-lockfile
```

This installs pnpm directly via npm and avoids Corepack-managed package manager downloads.

## Demo Credentials
- `admin@pixecom.local` / `Admin@12345`

## Ads Manager Data Integrity Notes
- Campaign list endpoint reads from the `Campaign` table only and returns one row per `platformId` (`distinct`) to prevent phantom duplicates.
- Campaign toggle updates `configuredStatus`; delivery/effective runtime state is tracked in `effectiveStatus` and `deliveryStatus`.
- Sync now records `SyncRun` rows and marks entities not seen in the current sync as `hidden`.
- Daily spend is read from `MetricsDaily` keyed by `(entityType, platformId, metricDate, timezone)` and does not derive campaign spend from child entities.
- Budgets are stored in cents with normalization logic and `budgetSourceUnit` retained for debugging major/minor source units.

## Run on GitHub Codespaces
1. Open the repository on GitHub.
2. Click **Code** → **Codespaces** → **Create codespace on main** (or current branch).
3. In the Codespaces terminal run:
   ```bash
   pnpm install
   pnpm dev:up
   pnpm dev:seed
   ```
4. Open the **Ports** tab and access:
   - Web: http://localhost:3000
   - API: http://localhost:4000 (`/api` for Swagger if enabled)

Demo credentials:
- `admin@pixecom.local` / `Admin@12345`

Notes:
- Corepack is disabled in the dev container flow.
- `pnpm@9` is installed via npm to avoid Corepack proxy/tunneling issues.

Docker note: the API image uses `node:20-bookworm-slim` with OpenSSL installed to ensure Prisma generate/migrate works reliably in container builds.
