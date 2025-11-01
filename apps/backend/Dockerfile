FROM node:lts-alpine as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

FROM base as pruner

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=s/pnpm-/pnpm/store,target=/pnpm/store pnpm add turbo --global

RUN turbo prune backend --docker

FROM base as builder

WORKDIR /app

COPY --from=pruner /app/out/json .
COPY --from=pruner /app/pnpm-lock.yaml .
RUN --mount=type=cache,id=s/pnpm-/pnpm/store,target=/pnpm/store pnpm i --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN --mount=type=cache,id=s/pnpm-/pnpm/store,target=/pnpm/store pnpm build --filter=backend

FROM base as runner

WORKDIR /app

COPY --from=builder /app/apps/backend/dist /app/apps/backend/dist
COPY --from=builder /app/apps/backend/prisma /app/apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json /app/apps/backend/package.json
COPY --from=builder /app/packages/ /app/packages/
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

RUN --mount=type=cache,id=s/pnpm-/pnpm/store,target=/pnpm/store pnpm i --prod --frozen-lockfile

EXPOSE 4000

CMD ["pnpm", "--filter=backend", "start"]
