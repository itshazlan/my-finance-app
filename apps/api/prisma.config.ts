import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Digunakan oleh CLI Prisma (db push, migrate)
    url: env("DIRECT_URL"),
  },
});
