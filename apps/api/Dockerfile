FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9

# Copy workspace manifests first for better layer caching and deterministic workspace resolution
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

# Install only api workspace dependencies (do not require host lockfile presence)
RUN pnpm install --filter ./apps/api... --no-frozen-lockfile

COPY . .

RUN pnpm --filter ./apps/api... prisma generate \
  && pnpm --filter ./apps/api... build

CMD ["sh", "-c", "pnpm --filter ./apps/api... prisma migrate deploy && pnpm --filter ./apps/api... prisma db seed && pnpm --filter ./apps/api... start"]
