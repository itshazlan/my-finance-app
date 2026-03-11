import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">FinanceTracker</h1>
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-semibold text-zinc-500 rounded-md hover:text-zinc-900 hover:bg-zinc-100 transition-all font-sans"
              >
                Dasbor
              </Link>
              <Link
                href="/transactions"
                className="px-4 py-2 text-sm font-semibold text-zinc-500 rounded-md hover:text-zinc-900 hover:bg-zinc-100 transition-all font-sans"
              >
                Transaksi
              </Link>
              <Link
                href="/categories"
                className="px-4 py-2 text-sm font-semibold text-zinc-500 rounded-md hover:text-zinc-900 hover:bg-zinc-100 transition-all font-sans"
              >
                Kategori
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
