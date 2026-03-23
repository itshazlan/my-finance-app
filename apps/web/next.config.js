/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Ganti tujuan proxy berdasarkan env variabel tempat backend dideploy
        // Harap deploy ulang Vercel dan pastikan env BACKEND_API_URL diisi URL API lengkap (misal https://api.anda.com/api)
        destination: (process.env.BACKEND_API_URL || "http://localhost:3000/api") + "/:path*",
      },
    ];
  },
};

export default nextConfig;
