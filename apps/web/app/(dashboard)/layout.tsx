"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/dashboard", label: "Dasbor" },
    { href: "/transactions", label: "Transaksi" },
    { href: "/categories", label: "Kategori" },
    { href: "/reports", label: "Laporan" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            setIsDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
            <nav className="navbar-glass">
                <div className="nav-container">
                    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                        {/* Logo */}
                        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px", transition: "color 0.2s" }} className="nav-logo-text">
                                FinanceTracker
                            </span>
                        </Link>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: "transparent", border: "none", cursor: "pointer",
                                fontSize: 20, padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 8, transition: "background 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(100, 116, 139, 0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            aria-label="Toggle Dark Mode"
                        >
                            {isDark ? "🌞" : "🌙"}
                        </button>
                    </div>

                    {/* Nav Links */}
                    <div className="nav-links-wrapper">
                            {navItems.map(({ href, label }) => {
                                const isActive = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        style={{
                                            position: "relative",
                                            padding: "7px 14px",
                                            borderRadius: 8,
                                            fontSize: 14,
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? "#6366f1" : "#64748b",
                                            background: isActive ? "#eef2ff" : "transparent",
                                            textDecoration: "none",
                                            transition: "all 0.15s ease",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        {/* Active dot indicator */}
                                        {isActive && (
                                            <span style={{
                                                width: 6, height: 6, borderRadius: "50%",
                                                background: "#6366f1",
                                                display: "inline-block",
                                                flexShrink: 0,
                                            }} />
                                        )}
                                        {label}
                                    </Link>
                                );
                            })}
                    </div>
                </div>

                {/* Active underline bar */}
                <div style={{ height: 2, background: "#f1f5f9", position: "relative" }}>
                    {navItems.map(({ href }) =>
                        pathname === href ? (
                            <div
                                key={href}
                                style={{
                                    position: "absolute",
                                    bottom: 0, top: 0,
                                    left: 0, right: 0,
                                    background: "transparent",
                                }}
                            />
                        ) : null
                    )}
                </div>
            </nav>

            <main style={{ flex: 1 }}>{children}</main>
        </div>
    );
}
