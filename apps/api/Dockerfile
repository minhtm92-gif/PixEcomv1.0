FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter api prisma generate && pnpm --filter api build

CMD ["sh", "-c", "pnpm --filter api prisma migrate deploy && pnpm --filter api prisma db seed && pnpm --filter api start"]
