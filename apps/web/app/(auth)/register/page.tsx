"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

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
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            if (res.ok) {
                alert("Registrasi Berhasil! Silakan login.");
                router.push("/login");
            } else {
                alert("Registrasi Gagal! Perbaiki data masukan kamu.");
            }
        } catch {
            alert("Terjadi kesalahan sistem saat memproses data.");
        } finally {
            setIsLoading(false);
        }
    };

    const fields = [
        { label: "Nama Lengkap", type: "text", placeholder: "John Doe", setter: setName },
        { label: "Alamat Email", type: "email", placeholder: "nama@email.com", setter: setEmail },
        { label: "Kata Sandi", type: "password", placeholder: "Minimal 8 karakter", setter: setPassword },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff", flexDirection: "row-reverse" }}>

            {/* Right decorative panel */}
            <div className="auth-right-panel" style={{
                width: "50%",
                background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f172a 100%)",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Decorative circles */}
                <div style={{ position: "absolute", bottom: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(16,185,129,0.12)" }} />
                <div style={{ position: "absolute", top: -50, left: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(5,150,105,0.15)" }} />
                <div style={{ position: "absolute", top: "40%", right: "20%", width: 120, height: 120, borderRadius: "50%", background: "rgba(16,185,129,0.08)" }} />

                <div style={{ position: "relative", zIndex: 1, padding: "48px", textAlign: "center", maxWidth: 420, color: "#fff" }}>
                    {/* Logo */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                    </div>

                    <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                        Mulai Perjalananmu
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.6)" }}>
                        Bergabung dengan ribuan orang yang telah berhasil mengelola keuangan mereka dengan lebih baik.
                    </p>

                    {/* Feature list */}
                    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                        {[
                            ["✓", "Catat pemasukan & pengeluaran dengan mudah"],
                            ["✓", "Laporan keuangan visual yang informatif"],
                            ["✓", "Data terenkripsi & tersimpan aman"],
                        ].map(([icon, text]) => (
                            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: "50%", background: "rgba(16,185,129,0.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 700, color: "#34d399", flexShrink: 0,
                                }}>{icon}</span>
                                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Left form panel */}
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
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>FinanceTracker</span>
                    </div>

                    <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.3px" }}>
                        Buat Akun Gratis
                    </h2>
                    <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
                        Isi data diri di bawah untuk memulai langkah pertamamu.
                    </p>

                    <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {fields.map(({ label, type, placeholder, setter }) => (
                            <div key={label}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                                    {label}
                                </label>
                                <input
                                    type={type}
                                    required
                                    placeholder={placeholder}
                                    onChange={(e) => setter(e.target.value)}
                                    className="form-input"
                                    style={{ "--focus-color": "#10b981" } as React.CSSProperties}
                                />
                            </div>
                        ))}

                        {/* Password hint */}
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: -12 }}>
                            Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 8, padding: "14px 20px",
                                background: isLoading ? "#6ee7b7" : "#10b981",
                                color: "#ffffff",
                                border: "none", borderRadius: 10,
                                fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                transition: "background 0.15s",
                                marginTop: 4,
                            }}
                            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#059669"; }}
                            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#10b981"; }}
                        >
                            {isLoading ? "Mendaftarkan..." : "Daftar Sekarang →"}
                        </button>
                    </form>

                    <p style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginTop: 24 }}>
                        Sudah punya akun?{" "}
                        <Link href="/login" style={{ fontWeight: 700, color: "#10b981" }}>
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>

            {/* Responsive CSS */}
            <style>{`
        .auth-right-panel { display: none !important; }
        @media (min-width: 1024px) {
          .auth-right-panel { display: flex !important; }
        }
      `}</style>
        </div>
    );
}
