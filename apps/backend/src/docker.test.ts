import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dirname, "../../..");

describe("Docker Infrastructure", () => {
  describe("Backend Dockerfile", () => {
    const dockerfilePath = resolve(projectRoot, "apps/backend/Dockerfile");

    it("exists", () => {
      expect(existsSync(dockerfilePath)).toBe(true);
    });

    it("uses multi-stage build with base, deps, build, production stages", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("FROM node:20-alpine AS base");
      expect(content).toContain("FROM base AS deps");
      expect(content).toContain("FROM deps AS build");
      expect(content).toContain("FROM base AS production");
    });

    it("enables corepack for pnpm", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("corepack enable");
    });

    it("installs dependencies with frozen lockfile", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("pnpm install --frozen-lockfile");
    });

    it("generates Prisma client and builds packages", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("pnpm --filter=@workspace/db db:generate");
      expect(content).toContain("pnpm --filter=@workspace/db build");
      expect(content).toContain("pnpm --filter=backend build");
    });

    it("exposes port 4000", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("EXPOSE 4000");
    });

    it("sets NODE_ENV to production", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("NODE_ENV=production");
    });
  });

  describe("Backend entrypoint", () => {
    const entrypointPath = resolve(
      projectRoot,
      "apps/backend/docker-entrypoint.sh",
    );

    it("exists", () => {
      expect(existsSync(entrypointPath)).toBe(true);
    });

    it("checks for migrations directory before running migrate deploy", () => {
      const content = readFileSync(entrypointPath, "utf-8");
      expect(content).toContain("prisma/migrations");
      expect(content).toContain("prisma migrate deploy");
    });

    it("starts the node server", () => {
      const content = readFileSync(entrypointPath, "utf-8");
      expect(content).toContain("exec node dist/index.js");
    });
  });

  describe(".dockerignore", () => {
    const dockerignorePath = resolve(projectRoot, ".dockerignore");

    it("exists", () => {
      expect(existsSync(dockerignorePath)).toBe(true);
    });

    it("excludes node_modules and sensitive files", () => {
      const content = readFileSync(dockerignorePath, "utf-8");
      expect(content).toContain("node_modules");
      expect(content).toContain(".env");
      expect(content).toContain(".git");
    });
  });

  describe("Webapp Dockerfile", () => {
    const dockerfilePath = resolve(projectRoot, "apps/webapp/Dockerfile");

    it("exists", () => {
      expect(existsSync(dockerfilePath)).toBe(true);
    });

    it("uses multi-stage build with nginx production stage", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("FROM node:20-alpine AS base");
      expect(content).toContain("FROM deps AS build");
      expect(content).toContain("FROM nginx:alpine AS production");
    });

    it("accepts VITE build args for environment configuration", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("ARG VITE_API_URL");
      expect(content).toContain("ARG VITE_FIREBASE_PROJECT_ID");
    });

    it("builds webapp with pnpm", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("pnpm --filter=webapp build");
    });

    it("copies built assets to nginx html directory", () => {
      const content = readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("/usr/share/nginx/html");
    });
  });

  describe("Webapp nginx.conf", () => {
    const nginxPath = resolve(projectRoot, "apps/webapp/nginx.conf");

    it("exists", () => {
      expect(existsSync(nginxPath)).toBe(true);
    });

    it("configures SPA routing with try_files fallback", () => {
      const content = readFileSync(nginxPath, "utf-8");
      expect(content).toContain("try_files $uri $uri/ /index.html");
    });

    it("includes security headers", () => {
      const content = readFileSync(nginxPath, "utf-8");
      expect(content).toContain("X-Frame-Options");
      expect(content).toContain("X-Content-Type-Options");
    });
  });

  describe("Docker Compose", () => {
    const composePath = resolve(projectRoot, "docker-compose.yml");

    it("exists", () => {
      expect(existsSync(composePath)).toBe(true);
    });

    it("defines required services", () => {
      const content = readFileSync(composePath, "utf-8");
      expect(content).toContain("postgres:");
      expect(content).toContain("backend:");
      expect(content).toContain("webapp:");
    });

    it("uses postgres 16", () => {
      const content = readFileSync(composePath, "utf-8");
      expect(content).toContain("postgres:16");
    });

    it("includes healthcheck for postgres", () => {
      const content = readFileSync(composePath, "utf-8");
      expect(content).toContain("healthcheck:");
      expect(content).toContain("pg_isready");
    });
  });

  describe("Production Seed Script", () => {
    const seedPath = resolve(
      projectRoot,
      "packages/db/prisma/seed-production.ts",
    );

    it("exists", () => {
      expect(existsSync(seedPath)).toBe(true);
    });

    it("requires DATABASE_URL environment variable", () => {
      const content = readFileSync(seedPath, "utf-8");
      expect(content).toContain("DATABASE_URL");
    });

    it("creates only platform admin account (no test data)", () => {
      const content = readFileSync(seedPath, "utf-8");
      expect(content).toContain("platform");
      expect(content).not.toContain("staging-demo-center");
      expect(content).not.toContain("staging-owner");
    });

    it("is idempotent using upsert", () => {
      const content = readFileSync(seedPath, "utf-8");
      expect(content).toContain("upsert");
    });

    it("requires explicit confirmation to run", () => {
      const content = readFileSync(seedPath, "utf-8");
      expect(content).toContain("PRODUCTION_SEED_CONFIRM");
    });
  });

  describe("Webapp nginx.conf - Content Security Policy", () => {
    const nginxPath = resolve(projectRoot, "apps/webapp/nginx.conf");

    it("includes Content-Security-Policy header", () => {
      const content = readFileSync(nginxPath, "utf-8");
      expect(content).toContain("Content-Security-Policy");
    });

    it("restricts default-src", () => {
      const content = readFileSync(nginxPath, "utf-8");
      expect(content).toContain("default-src");
    });
  });

  describe("Security - .gitignore", () => {
    const gitignorePath = resolve(projectRoot, ".gitignore");

    it("excludes .env files", () => {
      const content = readFileSync(gitignorePath, "utf-8");
      expect(content).toContain(".env");
    });

    it("excludes Firebase service account key files", () => {
      const content = readFileSync(gitignorePath, "utf-8");
      expect(content).toMatch(/service.?account/i);
    });
  });
});
