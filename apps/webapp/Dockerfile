# Webapp Dockerfile - Multi-stage build for React/Vite SPA
# Build context: project root (run with: docker build -f apps/webapp/Dockerfile .)

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
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
COPY packages/typescript-config/ ./packages/typescript-config/
COPY packages/types/ ./packages/types/
COPY packages/ui/ ./packages/ui/
COPY apps/webapp/ ./apps/webapp/
RUN pnpm --filter=@workspace/types build \
    && pnpm --filter=webapp build

# --- Production ---
FROM nginx:alpine AS production
COPY apps/webapp/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/webapp/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
