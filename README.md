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
