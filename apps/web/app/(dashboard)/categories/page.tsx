"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", type: "EXPENSE" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const router = useRouter();

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/categories", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit Mode
        const res = await fetch(`http://localhost:4000/api/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setEditingId(null);
          setFormData({ name: "", type: "EXPENSE" });
          loadCategories();
        } else {
          const err = await res.json();
          alert(`Gagal menyimpan: ${err.message}`);
        }
      } else {
        // Create Mode
        const res = await fetch("http://localhost:4000/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setFormData({ name: "", type: "EXPENSE" });
          loadCategories();
        } else {
          const err = await res.json();
          alert(`Gagal menambah: ${err.message}`);
        }
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({ name: category.name, type: category.type });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah kamu yakin ingin menghapus kategori ini?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        loadCategories();
      } else {
        const err = await res.json();
        alert(`Gagal menghapus: ${err.message}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kategori Transaksi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola kategori untuk mengklasifikasikan keuanganmu dengan rapi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Bagian Kiri */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {editingId ? "Edit Kategori" : "Tambah Kategori"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Makanan, Gaji"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Kategori
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="INCOME">Pemasukan</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", type: "EXPENSE" });
                    }}
                    className="px-4 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Tabel Kategori Bagian Kanan */}
        <div className="md:col-span-2">
          {isLoading ? (
            <p className="text-center text-gray-400 py-10 bg-white rounded-xl shadow-sm border border-gray-100">
              Memuat kategori...
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                        Belum ada kategori. Silakan buat yang pertama.
                      </td>
                    </tr>
                  )}
                  {categories.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            c.type === "EXPENSE"
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {c.type === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-600 hover:text-blue-900 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-900 transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
