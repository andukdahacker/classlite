# Backend Dockerfile - Multi-stage build for Fastify API
# Build context: project root (run with: docker build -f apps/backend/Dockerfile .)

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/webapp/package.json ./apps/webapp/
COPY apps/website/package.json ./apps/website/
COPY apps/e2e/package.json ./apps/e2e/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# --- Build ---
FROM deps AS build
COPY packages/typescript-config/ ./packages/typescript-config/
COPY packages/types/ ./packages/types/
COPY packages/db/ ./packages/db/
COPY apps/backend/ ./apps/backend/
RUN pnpm --filter=@workspace/db db:generate \
    && pnpm --filter=@workspace/db build \
    && pnpm --filter=backend build

# --- Production ---
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app ./
RUN chmod +x ./apps/backend/docker-entrypoint.sh
EXPOSE 4000
WORKDIR /app/apps/backend
ENTRYPOINT ["./docker-entrypoint.sh"]
