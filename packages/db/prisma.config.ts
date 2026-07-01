import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// carrega o .env da RAIZ do monorepo (dois níveis acima de packages/db)
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
