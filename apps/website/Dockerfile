# Website Dockerfile - Multi-stage build for Astro static site
# Build context: project root (run with: docker build -f apps/website/Dockerfile .)

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
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
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY packages/typescript-config/ ./packages/typescript-config/
COPY packages/ui/ ./packages/ui/
COPY apps/website/ ./apps/website/
RUN pnpm --filter=website build

# --- Production ---
FROM nginx:alpine AS production
COPY apps/website/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/website/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
