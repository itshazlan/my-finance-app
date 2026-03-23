"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import type { Transaction, Category } from "@repo/types";
import { API_URL } from "@/lib/api";
import EditModal from "./EditModal";

export default function TransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Load Categories for the Edit Modal
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal menghapus transaksi");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] }); // invalidasi juga agar sync dengan dashboard
      
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Transaksi dihapus",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Gagal menghapus transaksi.",
        confirmButtonColor: "#f43f5e",
      });
    },
  });

  const { data: paginatedData = { data: [], meta: { totalPages: 1 } }, isLoading } = useQuery({
    queryKey: ["transactions", page, limit, month, year],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions?page=${page}&limit=${limit}&month=${month}&year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/login");
        }
        throw new Error("Failed to fetch transactions");
      }
      return res.json();
    },
  });

  const transactions = paginatedData.data || [];
  const maxPages = paginatedData.meta?.totalPages || 1;

  const handleExportExcel = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions?limit=10000&month=${month}&year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat transaksi");
      const json = await res.json();
      const transactionsData: Transaction[] = json.data || [];

      if (transactionsData.length === 0) {
        Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data transaksi untuk diekspor pada periode ini.' });
        return;
      }

      let csvString = "No,Tanggal,Kategori,Tipe,Nominal,Keterangan\n";

      transactionsData.forEach((t, index) => {
        const dateStr = new Date(t.date).toLocaleDateString("id-ID");
        const categoryName = t.category?.name || "Umum";
        const typeStr = t.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
        const descStr = (t.description || "").replace(/,/g, " "); 
        
        csvString += `${index + 1},${dateStr},${categoryName},${typeStr},${t.amount},${descStr}\n`;
      });

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Riwayat_Transaksi_FinanceApp.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Berhasil Diekspor!",
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
       Swal.fire({ icon: 'error', title: 'Oops...', text: 'Terjadi kesalahan saat mengekspor data.' });
    }
  };

  return (
    <div className="page-container">
      {/* Edit Modal */}
      {editingTx && (
        <EditModal
          transaction={editingTx}
          categories={categories}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Riwayat Transaksi
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
            Lihat dan pantau semua transaksi yang telah kamu catat.
          </p>

          <button 
            onClick={handleExportExcel}
            style={{
               marginTop: 16,
               background: "#10b981", 
               color: "white", 
               border: "none", 
               padding: "8px 16px",
               fontSize: 14,
               fontWeight: 600,
               borderRadius: 8,
               cursor: "pointer",
               display: "flex",
               alignItems: "center",
               gap: 8,
               boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Export Excel
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select 
            value={month} 
            onChange={e => { setMonth(e.target.value); setPage(1); }} 
            className="form-input" 
            style={{ width: "140px" }}
          >
            {[
              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
              "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ].map((m, i) => (
              <option key={m} value={(i + 1).toString()}>{m}</option>
            ))}
          </select>

          <select 
            value={year} 
            onChange={e => { setYear(e.target.value); setPage(1); }} 
            className="form-input" 
            style={{ width: "100px" }}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y.toString()}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
          Memuat transaksi...
        </div>
      ) : (
        <div className="table-responsive-wrapper">
         <div className="table-min-width">
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 80px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 24px",
          }}>
            {["Tanggal", "Keterangan", "Kategori", "Jumlah", "Aksi"].map((h, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.06em",
                textAlign: i === 3 ? "right" : i === 4 ? "center" : "left"
              }}>{h}</span>
            ))}
          </div>

          {/* Empty State */}
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <p style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>Belum ada transaksi</p>
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Tidak ada riwayat pada periode ini.</p>
            </div>
          ) : (
            transactions.map((t: Transaction, idx: number) => (
              <div key={t.id} style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 80px",
                padding: "16px 24px",
                borderBottom: idx < transactions.length - 1 ? "1px solid #f1f5f9" : "none",
                alignItems: "center",
                transition: "background 0.12s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  {t.description || "Tanpa Deskripsi"}
                </span>
                <span>
                  <span className={`badge ${t.type === "EXPENSE" ? "badge-expense" : "badge-income"}`}>
                    {t.category?.name || "Umum"}
                  </span>
                </span>
                <span style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: t.type === "EXPENSE" ? "#f43f5e" : "#10b981" }}>
                  {t.type === "EXPENSE" ? "−" : "+"} Rp {t.amount.toLocaleString("id-ID")}
                </span>
                
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                   <button
                        onClick={() => setEditingTx(t)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", transition: "color 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                   </button>
                   <button
                        onClick={() => {
                          Swal.fire({
                            title: "Yakin Hapus?",
                            text: "Riwayat transaksi ini tidak dapat dikembalikan semula!",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#f43f5e",
                            cancelButtonColor: "#94a3b8",
                            confirmButtonText: "Hapus",
                            cancelButtonText: "Batal",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              deleteMutation.mutate(t.id);
                            }
                          });
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", transition: "color 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#f43f5e"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
              </div>
            ))
          )}
         </div>
        </div>
      )}

      {/* Pagination Controls */}
      {transactions.length > 0 && maxPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, alignItems: "center" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "8px 16px", borderRadius: 8, background: page === 1 ? "#f1f5f9" : "#fff", border: "1px solid #e2e8f0", color: page === 1 ? "#94a3b8" : "#0f172a", cursor: page === 1 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}
          >
             Sebelumnya
          </button>
          
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Halaman {page} dari {maxPages}</span>

          <button
            onClick={() => setPage(p => Math.min(maxPages, p + 1))}
            disabled={page >= maxPages}
            style={{ padding: "8px 16px", borderRadius: 8, background: page >= maxPages ? "#f1f5f9" : "#fff", border: "1px solid #e2e8f0", color: page >= maxPages ? "#94a3b8" : "#0f172a", cursor: page >= maxPages ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}
          >
             Selanjutnya
          </button>
        </div>
      )}

    </div>
  );
}
