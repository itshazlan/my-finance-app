"use client";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import type { Transaction } from "@repo/types";
import { API_URL } from "@/lib/api";

export default function TransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions`, {
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

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Riwayat Transaksi
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
          Lihat dan pantau semua transaksi yang telah kamu catat.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
          Memuat transaksi...
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 40px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 24px",
          }}>
            {["Tanggal", "Keterangan", "Kategori", "Jumlah", ""].map((h, i) => (
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
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Catat transaksi pertamamu di halaman Dasbor.</p>
            </div>
          ) : (
            transactions.map((t: Transaction, idx: number) => (
              <div key={t.id} style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 40px",
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
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#cbd5e1", transition: "color 0.2s", margin: "0 auto" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f43f5e"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#cbd5e1"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
