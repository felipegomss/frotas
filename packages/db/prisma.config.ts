import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env. Load it before reading DATABASE_URL.
// `process.loadEnvFile()` (Node >=20.6) reads ./.env relative to the cwd,
// which is packages/db when Prisma CLI runs against this package.
try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. env already provided by the shell) — ignore.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
});
