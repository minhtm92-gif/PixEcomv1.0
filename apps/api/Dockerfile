FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm i --filter api... --frozen-lockfile=false
COPY . .
RUN pnpm --filter api prisma generate && pnpm --filter api build
CMD ["sh","-c","pnpm --filter api prisma migrate deploy && pnpm --filter api prisma db seed && pnpm --filter api start"]
