import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Memberikan fallback URL palsu khusus untuk Docker Build Phase karena "prisma generate"
    // sebenarnya tidak butuh koneksi beneran untuk membuat type data JavaScript, 
    // melainkan hanya membaca skema saja. Saat server berjalan (runtime), URL akan kembali diambil dari Railway.
    url: process.env.DIRECT_URL || "postgresql://postgres:dummy@localhost:5432/dummy",
  },
});
