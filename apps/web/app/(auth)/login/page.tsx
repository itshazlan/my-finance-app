"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (res.ok) {
        // Bersihkan cache user sebelumnya agar data tidak terbawa ke session baru
        queryClient.clear();
        router.push("/dashboard");
      } else {
        alert("Login Gagal! Cek kembali email dan password kamu.");
      }
    } catch {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Left decorative panel */}
      <div style={{
        display: "none",
        width: "50%",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        ...(typeof window !== "undefined" && window.innerWidth >= 1024 ? { display: "flex" } : {}),
      }}
        className="auth-left-panel"
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.15)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(139,92,246,0.12)" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "48px", textAlign: "center", maxWidth: 420, color: "#fff" }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px" }}>Finance Tracker</h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
            Kelola keuanganmu dengan lebih cerdas. Catat setiap transaksi, pantau pengeluaran, dan wujudkan tujuan finansialmu di satu tempat.
          </p>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, marginTop: 40, justifyContent: "center" }}>
            {[["100%", "Aman & Terenkripsi"], ["Real-time", "Update Otomatis"], ["Gratis", "Tanpa Biaya"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#a5b4fc" }}>{v}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: "#f8fafc",
      }}>
        <div style={{
          width: "100%", maxWidth: 440,
          background: "#ffffff", borderRadius: 24, padding: "44px 40px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
        }}>
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>FinanceTracker</span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.3px" }}>
            Selamat Datang Kembali
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
            Silakan masukkan detail akunmu untuk masuk ke dalam dasbor.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                Alamat Email
              </label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                Kata Sandi
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ marginTop: 8, padding: "14px 20px", fontSize: 15 }}
            >
              {isLoading ? "Memproses..." : "Masuk ke Akun →"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginTop: 24 }}>
            Belum punya akun?{" "}
            <Link href="/register" style={{ fontWeight: 700, color: "#6366f1" }}>
              Buat akun gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Responsive CSS for left panel */}
      <style>{`
        .auth-left-panel { display: none !important; }
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
