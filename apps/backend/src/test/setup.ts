/**
 * Vitest setup file - loads environment variables before tests run.
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from the backend directory
config({ path: resolve(__dirname, "../../.env") });
