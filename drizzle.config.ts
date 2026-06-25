import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.SKIP_ENV_VALIDATION !== "true") {
  throw new Error("DATABASE_URL is required for drizzle-kit. Set SKIP_ENV_VALIDATION=true to bypass.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl ?? "",
  },
});
