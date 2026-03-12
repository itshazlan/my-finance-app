import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "../providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: "FinanceTracker — Kelola Keuanganmu",
  description: "Catat setiap transaksi, pantau pengeluaran, dan wujudkan tujuan finansialmu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
