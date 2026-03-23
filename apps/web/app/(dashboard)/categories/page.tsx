"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category, TransactionType, CreateCategoryRequest } from "@repo/types";
import { API_URL } from "@/lib/api";

export default function CategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateCategoryRequest>({ name: "", type: "EXPENSE" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        throw new Error("Gagal mengambil kategori");
      }
      return res.json();
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    onSuccess: () => {
      setEditingId(null);
      setFormData({ name: "", type: "EXPENSE" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: Error) => alert(`Gagal menyimpan: ${err.message}`),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      return res.json();
    },
    onSuccess: () => {
      setFormData({ name: "", type: "EXPENSE" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: Error) => alert(`Gagal menambah: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err: Error) => alert(`Gagal menghapus: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) editMutation.mutate();
    else createMutation.mutate();
  };

  const isSaving = createMutation.isPending || editMutation.isPending;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Kategori Transaksi
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
          Kelola kategori untuk mengklasifikasikan keuanganmu dengan rapi.
        </p>
      </div>

      <div className="categories-layout">

        {/* ---- Form Panel ---- */}
        <div className="card">
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>
            {editingId ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Nama Kategori
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Misal: Makanan, Gaji"
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Tipe
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                className="form-input"
              >
                <option value="EXPENSE">Pengeluaran</option>
                <option value="INCOME">Pemasukan</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 1 }}>
                {isSaving ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Tambah")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ name: "", type: "EXPENSE" }); }}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                    background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer"
                  }}
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ---- Table Panel ---- */}
        <div className="table-responsive-wrapper">
         <div className="table-min-width">
          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1.2fr auto",
            background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 24px",
          }}>
            {["Nama", "Tipe", "Aksi"].map((h, i) => (
              <span key={h} style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.06em",
                textAlign: i === 2 ? "right" : "left"
              }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14 }}>Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>Belum ada kategori</p>
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Buat kategori pertama di panel sebelah kiri.</p>
            </div>
          ) : (
            categories.map((c: Category, idx: number) => (
              <div key={c.id} style={{
                display: "grid", gridTemplateColumns: "2fr 1.2fr auto",
                padding: "14px 24px", alignItems: "center",
                borderBottom: idx < categories.length - 1 ? "1px solid #f1f5f9" : "none",
                transition: "background 0.12s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{c.name}</span>
                <span>
                  <span className={`badge ${c.type === "EXPENSE" ? "badge-expense" : "badge-income"}`}>
                    {c.type === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
                  </span>
                </span>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setEditingId(c.id); setFormData({ name: c.name, type: c.type }); }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm("Hapus kategori ini?")) deleteMutation.mutate(c.id); }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#f43f5e", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fff1f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
         </div>
        </div>
      </div>
    </div>
  );
}
