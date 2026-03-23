"use client";
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

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
            <nav className="navbar-glass">
                <div className="nav-container">
                    {/* Logo + Nav Container left logic not needed anymore with flex-col, wait: Yes it is 
                       Actually, the outer container is "nav-container", and it aligns flex-start on mobile.
                       We want Logo to stay at top, and Nav to scroll below it. */}
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
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                            FinanceTracker
                        </span>
                    </Link>

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
