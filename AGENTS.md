# IELTS Nook - Agent Development Guide

## Project Overview

Monorepo for IELTS Nook education platform using pnpm + Turbo. Contains Fastify backend, Astro website, and shared packages (UI components, types, configs).

## Build Commands

### Root Commands

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages (uses turbo)
- `pnpm lint` - Lint all packages (uses turbo)
- `pnpm format` - Format with Prettier

### Backend (apps/backend)

- `pnpm --filter backend dev` - Start dev server with tsc-watch
- `pnpm --filter backend build` - TypeScript compile to dist/
- `pnpm --filter backend start` - Run production server
- `pnpm --filter backend db:push` - Prisma schema push
- `pnpm --filter backend generate` - Generate Prisma client

### Website (apps/website)

- `pnpm --filter website dev` - Astro dev server
- `pnpm --filter website build` - Astro build
- `pnpm --filter website preview` - Preview production build

### Testing

Tests are not yet configured. When adding tests, configure in package.json scripts and reference here.

## Code Style Guidelines

### File Organization

- **Backend routes**: Controller → Service pattern in `apps/backend/src/routes/{feature}/`
- File naming: kebab-case (`assignment.controller.ts`, `assignment.service.ts`)
- Types: Defined in `packages/types/src/{feature}/dto/` and `schema/`

### Import Conventions

- Use ES modules with `.js` extension: `import X from "./file.js"`
- Workspace imports: `import { X } from "@workspace/types"`
- Keep imports sorted alphabetically

### TypeScript Patterns

- Class-based services/controllers with dependency injection
- Constructor injection: `constructor(private readonly db: PrismaClient) {}`
- TypeBox for validation schemas in packages/types
- Export default for main class, named exports for utilities

### Naming Conventions

- Classes: PascalCase (`AssignmentController`, `AssignmentService`)
- Methods/Functions: camelCase (`getAssignmentsByExercise`)
- Interfaces/Types: PascalCase (`CreateAssignmentsInput`, `AppJwtPayload`)
- Constants: UPPER_SNAKE_CASE
- Private methods: prefix with underscore if needed

### API Response Structure

Standardized response format across all endpoints:

```typescript
{
  data: <result | null>,
  message: <string>
}
```

- Controllers return this format
- Services return raw data
- Errors handled by middleware/global handler

### Error Handling

- Throw `Error()` with descriptive messages in services
- Global error handler in `apps/backend/src/index.ts:177`
- Auth middleware clears cookies and returns 401 on failure
- Log errors with `reply.log.error(error)`

### Database (Prisma)

- Schema: `apps/backend/prisma/schema.prisma`
- Models: PascalCase with `@id @default(cuid())`
- Relations: Explicit onDelete: Cascade where needed
- Generated client: `src/generated/prisma/client/`
- Use `include` for eager loading relations

### Middleware

- Auth: `apps/backend/src/middlewares/auth.middleware.ts`
- Role: `apps/backend/src/middlewares/role.middleware.ts`
- JWT payload attached to `request.jwtPayload`

### Styling

- No code comments (unless documentation)
- Prettier config enforced
- ESLint with @workspace/eslint-config
- Use workspace types, never duplicate

### Workspace Package References

- `@workspace/types` - Shared DTOs and schemas
- `@workspace/ui` - shadcn/ui components
- `@workspace/eslint-config` - ESLint configs
- `@workspace/typescript-config` - TS configs

### Environment

- Backend uses @fastify/env for validation
- Required env vars: NODE_ENV, PORT, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, RESEND_API_KEY
- .env files in app directories

### Commit & Push

Before pushing:

1. Run `pnpm lint` - Fix all warnings
2. Run `pnpm build` - Ensure no build errors
3. Format with `pnpm format` if needed

### Adding Features

1. Define types in `packages/types/src/{feature}/dto/`
2. Create controller/service in `apps/backend/src/routes/{feature}/`
3. Register routes in `apps/backend/src/routes/routes.ts`
4. Update Prisma schema if needed
5. Run migrations: `pnpm --filter backend db:push`

### Forbidden

- Do NOT duplicate types between frontend/backend
- Do NOT import from dist directories
- Do NOT add comments in code
- Do NOT use .ts extensions in ES module imports
- Do NOT commit .env files or secrets
