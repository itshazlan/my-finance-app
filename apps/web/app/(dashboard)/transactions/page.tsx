"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadTransactions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/transactions", {
        headers: {},
        credentials: "include", // Kirim HttpOnly cookie
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Lihat daftar semua transaksi yang telah kamu catat.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-10">Memuat transaksi...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              )}
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(t.date).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {t.description || "Tanpa Deskripsi"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs px-2 py-1 font-semibold">
                      {t.category?.name || "Umum"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span
                      className={
                        t.type === "EXPENSE" ? "text-red-500" : "text-emerald-500"
                      }
                    >
                      {t.type === "EXPENSE" ? "-" : "+"} Rp{" "}
                      {t.amount.toLocaleString("id-ID")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
