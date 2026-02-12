import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use process.env with fallback for CI builds where prisma generate
    // doesn't need actual database connection
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/placeholder",
    // Shadow database used by prisma migrate diff --from-migrations
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});