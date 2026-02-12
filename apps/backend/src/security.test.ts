import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dirname, "../../..");

describe("Security Hardening", () => {
  describe("Backend app.ts - Rate Limiting", () => {
    const appPath = resolve(projectRoot, "apps/backend/src/app.ts");

    it("imports @fastify/rate-limit", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).toContain("@fastify/rate-limit");
    });

    it("registers rate-limit plugin", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).toContain("rateLimit");
    });
  });

  describe("Backend app.ts - Helmet", () => {
    const appPath = resolve(projectRoot, "apps/backend/src/app.ts");

    it("imports @fastify/helmet", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).toContain("@fastify/helmet");
    });

    it("registers helmet plugin", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).toContain("app.register(helmet");
    });
  });

  describe("Backend app.ts - CORS", () => {
    const appPath = resolve(projectRoot, "apps/backend/src/app.ts");

    it("does not use wildcard CORS origins", () => {
      const content = readFileSync(appPath, "utf-8");
      // Should not have origin: "*" or origin: true (which means all origins)
      expect(content).not.toMatch(/origin:\s*["']\*["']/);
      expect(content).not.toMatch(/origin:\s*true/);
    });

    it("restricts production origins to specific domains", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).toContain("my.classlite.app");
    });
  });

  describe("Backend startup - No env var logging", () => {
    const indexPath = resolve(projectRoot, "apps/backend/src/index.ts");

    it("does not log environment variables at startup", () => {
      const content = readFileSync(indexPath, "utf-8");
      // Should not log sensitive env vars
      expect(content).not.toMatch(/console\.log.*DATABASE_URL/);
      expect(content).not.toMatch(/console\.log.*FIREBASE/);
      expect(content).not.toMatch(/console\.log.*SECRET/);
      expect(content).not.toMatch(/console\.log.*API_KEY/);
    });

    it("does not log env object directly", () => {
      const content = readFileSync(indexPath, "utf-8");
      expect(content).not.toMatch(/console\.log.*getEnvs/);
      expect(content).not.toMatch(/console\.log.*process\.env/);
    });
  });

  describe("Backend app.ts - No env var logging", () => {
    const appPath = resolve(projectRoot, "apps/backend/src/app.ts");

    it("does not log environment variables", () => {
      const content = readFileSync(appPath, "utf-8");
      expect(content).not.toMatch(/console\.log.*DATABASE_URL/);
      expect(content).not.toMatch(/console\.log.*FIREBASE/);
      expect(content).not.toMatch(/console\.log.*SECRET/);
      expect(content).not.toMatch(/console\.log.*API_KEY/);
      expect(content).not.toMatch(/console\.log.*env\b/);
    });
  });
});
