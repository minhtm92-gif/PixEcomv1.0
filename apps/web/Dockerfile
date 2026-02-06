FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter web build

CMD ["pnpm", "--filter", "web", "start"]
