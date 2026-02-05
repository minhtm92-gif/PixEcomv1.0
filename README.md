# PixEcom v1.0

Production-ready dark-mode PixEcom demo monorepo with mocked Facebook ads workflows.

## Stack
- pnpm workspaces
- `apps/api`: NestJS + Prisma + PostgreSQL
- `apps/web`: Next.js App Router + TypeScript + Tailwind + shadcn-style UI

## Quick Start
```bash
pnpm i
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

Open web at http://localhost:3000 and API at http://localhost:4000 (`/api` for Swagger).

## Demo Credentials
- `admin@pixecom.local` / `Admin@12345`
