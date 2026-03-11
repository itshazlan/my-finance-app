"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    console.log("Login", email, password);
    
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Supaya browser menerima & menyimpan cookie HttpOnly
      });
      console.log("🚀 ~ handleLogin ~ res:", res)

      if (res.ok) {
        // Karena respons menggunakan cookie HttpOnly, kita tidak perlu set manual lagi di Frontend
        router.push("/dashboard");
      } else {
        alert("Login Gagal! Cek kembali email dan password kamu.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Bagian Kiri - Dekoratif */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 to-purple-600/20 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10 p-12 text-center text-white max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Finance Tracker</h1>
          <p className="text-lg text-neutral-300 leading-relaxed">
            Kelola keuanganmu dengan lebih cerdas. Catat setiap transaksi, pantau pengeluaran, dan wujudkan tujuan finansialmu di satu tempat.
          </p>
        </div>
      </div>

      {/* Bagian Kanan - Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-50 relative">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
          <div>
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Silakan masukkan detail akunmu untuk masuk ke dalam dasbor.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-neutral-900"
                  placeholder="nama@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-neutral-900"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "Memproses..." : "Masuk ke Akun"}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Belum punya akun?{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Buat akun gratis
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
