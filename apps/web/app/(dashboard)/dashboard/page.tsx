"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- Komponen Form (Bisa dipindah ke file terpisah nanti) ---
function AddTransactionForm({
  onTransactionAdded,
}: {
  onTransactionAdded: () => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: "EXPENSE",
    categoryId: "",
  });

  useEffect(() => {
    // Membaca daftar kategori saat form dirender pertama kali
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/categories", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Gagal memuat kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:4000/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Kirim cookie HttpOnly secara otomatis
      body: JSON.stringify({
        ...formData,
        amount: Number(formData.amount),
      }),
    });

    if (res.ok) {
      setFormData({
        amount: "",
        description: "",
        type: "EXPENSE",
        categoryId: "",
      });
      onTransactionAdded();
    } else {
      alert("Gagal menambah transaksi. Pastikan ID Kategori benar!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 mb-10"
    >
      <h3 className="text-lg font-bold text-zinc-800 mb-5">Catat Transaksi Cepat</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">Rp</span>
          <input
            type="number"
            placeholder="0"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        
        <input
          type="text"
          placeholder="Makan siang, bensin..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
        
        <select
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-700"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
        </select>
        
        <select
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-700"
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          required
        >
          <option value="" disabled>Pilih Kategori</option>
          {categories
            .filter((c) => c.type === formData.type)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        
        <button
          type="submit"
          className="md:col-span-4 mt-2 flex justify-center py-4 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          Tambahkan ke Catatan
        </button>
      </div>
    </form>
  );
}

// --- Komponen Utama Dashboard ---
export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const router = useRouter();

  // Fungsi untuk mengambil data dari Backend
  const loadTransactions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/transactions", {
        headers: {},
        credentials: "include", // Termasuk cookie HttpOnly untuk otentikasi
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      } else {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto bg-zinc-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Pantau arus kas dan kelola pengeluaran harianmu dengan sistematis.
          </p>
        </div>
        <button
          onClick={async () => {
            await fetch("http://localhost:4000/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
            localStorage.removeItem("token");
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            router.push("/login");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Keluar
        </button>
      </div>

      {/* Form Input Baru */}
      <AddTransactionForm onTransactionAdded={loadTransactions} />

      {/* List Transaksi */}
      <div>
        <h3 className="text-lg font-bold text-zinc-800 mb-4">Aktivitas Terkini</h3>
        <div className="grid gap-4">
          {transactions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100 border-dashed">
              <div className="mx-auto w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <p className="text-zinc-500 font-medium">Belum ada transaksi</p>
              <p className="text-zinc-400 text-sm mt-1">Mulai catat aktivitas finansial pertamamu di atas.</p>
            </div>
          )}
          {transactions.map((t: any) => (
            <div
              key={t.id}
              className="p-5 bg-white border border-zinc-100 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex justify-between items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${t.type === "EXPENSE" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                  {t.type === "EXPENSE" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                  )}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-base">
                    {t.description || "Tanpa Deskripsi"}
                  </p>
                  <div className="flex gap-2 items-center mt-1.5">
                    <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md uppercase text-zinc-600 font-bold tracking-wider">
                      {t.category?.name || "Umum"}
                    </span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                    <p className="text-xs font-medium text-zinc-400">
                      {new Date(t.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <p
                className={`font-black text-lg tracking-tight ${t.type === "EXPENSE" ? "text-red-500" : "text-emerald-500"}`}
              >
                {t.type === "EXPENSE" ? "-" : "+"} Rp{" "}
                {t.amount.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
