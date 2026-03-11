"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        alert("Registrasi Berhasil! Silakan login.");
        router.push("/login"); // Asumsi akan dilanjutkan ke page login
      } else {
        alert("Registrasi Gagal! Perbaiki data masukan kamu.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat memproses data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans flex-row-reverse">
      {/* Bagian Kanan - Dekoratif */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-tr from-emerald-600/20 to-teal-600/20 z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10 p-12 text-center text-white max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Mulai Perjalananmu</h1>
          <p className="text-lg text-zinc-300 leading-relaxed">
            Bergabung dengan ribuan orang lainnya yang telah berhasil mengelola dan memonitor keuangan mereka dengan lebih baik.
          </p>
        </div>
      </div>

      {/* Bagian Kiri - Form Register */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-emerald-50/20 relative">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
          <div>
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Buat Akun Baru</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Isi data diri di bawah ini untuk memulai langkah pertamamu.
            </p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                   Nama Lengkap
                 </label>
                 <input
                   type="text"
                   required
                   className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-neutral-900"
                   placeholder="John Doe"
                   onChange={(e) => setName(e.target.value)}
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                   Alamat Email
                 </label>
                 <input
                   type="email"
                   required
                   className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-neutral-900"
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
                   className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-neutral-900"
                   placeholder="Minimal 8 karakter"
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </div>
             </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "Mendaftarkan..." : "Daftar Akun"}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
