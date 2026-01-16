
# Project Overview

This is a monorepo for a full-stack application. It includes a React web application, a Astro static site application, a Fastify backend, and shared packages for UI components and types. The project is managed using pnpm and Turbo.

## Technologies

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Website:** Astro, TypeScript, Tailwind CSS
- **Backend:** Fastify, Prisma, TypeScript
- **Monorepo:** pnpm, Turbo

## Project Structure

The monorepo is organized into the following workspaces:

- `apps/webapp`: The React frontend application.
- `apps/website`: The Astro static site application.
- `apps/backend`: The Fastify backend application.
- `packages/ui`: A shared UI component library based on shadcn/ui.
- `packages/types`: Shared TypeScript types for the frontend and backend.
- `packages/eslint-config`: Shared ESLint configuration.
- `packages/typescript-config`: Shared TypeScript configuration.

## Building and Running

### Development

To start the development servers for both the frontend and backend, run the following command from the root of the project:

```bash
pnpm dev
```

This will start the Next.js development server on `http://localhost:3000` and the Fastify backend server on `http://localhost:4000`.

### Build

To build the entire project, run the following command from the root of the project:

```bash
pnpm build
```

This will create production-ready builds for both the frontend and backend applications.

## Development Conventions

### Code Style

This project uses Prettier for code formatting and ESLint for linting. To format the entire codebase, run:

```bash
pnpm format
```

To lint the entire codebase, run:

```bash
pnpm lint
```

### API Schema

The frontend and backend communicate via a REST API. The API is documented using OpenAPI, and the schema is available at `http://localhost:4000/documentation/json` when the backend is running.

To update the frontend's API client, run the following command from the `apps/web` directory:

```bash
pnpm sync-schema-dev
```
