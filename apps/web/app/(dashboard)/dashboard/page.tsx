"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import type { Category, Transaction, TransactionSummary, TransactionType } from "@repo/types";
import { API_URL } from "@/lib/api";

// --- Skema Validasi Zod ---
const transactionSchema = z.object({
  amount: z
    .number({ error: "Nominal harus berupa angka" })
    .min(1, "Nominal minimal Rp 1"),
  description: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Silakan pilih kategori"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// --- Komponen Form (Bisa dipindah ke file terpisah nanti) ---
function AddTransactionForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: undefined,
      description: "",
      type: "EXPENSE",
      categoryId: "",
    },
  });

  const selectedType = watch("type");

  // Mendapatkan data list categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat kategori");
      return res.json();
    },
  });

  // Melakukan aksi tambah transaksi
  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menambah transaksi");
      return res.json();
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      
      // Tampilkan toast success
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Transaksi berhasil dicatat",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Pencatatan Gagal",
        text: "Gagal menambah transaksi. Pastikan semua data benar!",
        confirmButtonColor: "#f43f5e",
      });
    },
  });



  const onSubmit = (data: TransactionFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Catat Transaksi Cepat</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {/* Nominal */}
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 600, fontSize: 14 }}>Rp</span>
            <input
              type="number"
              placeholder="0"
              {...register("amount", { valueAsNumber: true })}
              className={`form-input ${errors.amount ? "error" : ""}`}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {errors.amount && (
            <p style={{ fontSize: 12, color: "#f43f5e", marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              ⚠ {errors.amount.message}
            </p>
          )}
        </div>

        {/* Deskripsi */}
        <input
          type="text"
          placeholder="Makan siang, bensin..."
          {...register("description")}
          className="form-input"
        />

        {/* Tipe */}
        <select {...register("type")} className="form-input">
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
        </select>

        {/* Kategori */}
        <div>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <select {...field} className={`form-input ${errors.categoryId ? "error" : ""}`}>
                <option value="" disabled>Pilih Kategori</option>
                {categories
                  .filter((c) => c.type === selectedType)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            )}
          />
          {errors.categoryId && (
            <p style={{ fontSize: 12, color: "#f43f5e", marginTop: 4, fontWeight: 500 }}>⚠ {errors.categoryId.message}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? "Menyimpan..." : "+ Tambahkan"}
        </button>
      </div>
    </form>
  );
}

// --- Komponen Utama Dashboard ---
export default function DashboardPage() {
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
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      
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

  // Load Transactions & SWR Logic
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/login");
        }
        throw new Error("Failed to fetch transactions");
      }
      const json = await res.json();
      return json.data || [];
    },
  });

  // Load Summary
  const { data: summary = { INCOME: 0, EXPENSE: 0, BALANCE: 0 } } = useQuery<TransactionSummary>({
    queryKey: ["summary"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions/summary`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.2 }}>Ringkasan Keuangan</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>Pantau arus kas dan kelola keuanganmu dengan sistematis.</p>
        </div>
        <button
          onClick={async () => {
            await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
            localStorage.removeItem("token");
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            // Hapus semua cache React Query agar data user lama tidak terbawa ke session berikutnya
            queryClient.clear();
            router.push("/login");
          }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 8, border: "1.5px solid #fecdd3",
            background: "#fff1f2", color: "#f43f5e",
            fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Keluar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {/* Total Saldo */}
        <div className="card-dark">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>Total Saldo</p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>Rp</p>
          <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 }}>{summary.BALANCE.toLocaleString("id-ID")}</p>
          <p style={{ fontSize: 12, marginTop: 10, color: summary.BALANCE >= 0 ? "#34d399" : "#fb7185", fontWeight: 600 }}>
            {summary.BALANCE >= 0 ? "▲ Surplus bulan ini" : "▼ Defisit bulan ini"}
          </p>
        </div>

        {/* Pemasukan */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>Pemasukan</p>
            <div className="icon-circle icon-circle-income">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Rp</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#10b981", letterSpacing: "-0.5px" }}>{summary.INCOME.toLocaleString("id-ID")}</p>
        </div>

        {/* Pengeluaran */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>Pengeluaran</p>
            <div className="icon-circle icon-circle-expense">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Rp</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#f43f5e", letterSpacing: "-0.5px" }}>{summary.EXPENSE.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Form */}
      <AddTransactionForm />

      {/* Transactions */}
      <div>
        <p className="section-title">Aktivitas Terkini</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isLoadingTransactions ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Memuat data...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <p style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>Belum ada transaksi</p>
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Mulai catat aktivitas finansialmu di atas.</p>
            </div>
          ) : (
            transactions.map((t: Transaction) => (
              <div key={t.id} className="transaction-item">
                <div className="transaction-item-left">
                  <div className={`icon-circle ${t.type === "EXPENSE" ? "icon-circle-expense" : "icon-circle-income"}`}>
                    {t.type === "EXPENSE" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                    )}
                  </div>
                  <div className="transaction-item-text">
                    <p className="transaction-item-desc">
                      {t.description || "Tanpa Deskripsi"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span className={`badge ${t.type === "EXPENSE" ? "badge-expense" : "badge-income"}`}>{t.category?.name || "Umum"}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#cbd5e1", flexShrink: 0 }}></span>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>
                        {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="transaction-item-right">
                  <p style={{ fontWeight: 800, fontSize: 16, color: t.type === "EXPENSE" ? "#f43f5e" : "#10b981", letterSpacing: "-0.3px", margin: 0 }}>
                    {t.type === "EXPENSE" ? "−" : "+"} Rp {t.amount.toLocaleString("id-ID")}
                  </p>
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
                    style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", color: "#cbd5e1", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f43f5e"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#cbd5e1"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
