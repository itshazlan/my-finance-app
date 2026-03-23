import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import type { Transaction, Category } from "@repo/types";
import { API_URL } from "@/lib/api";

const updateSchema = z.object({
  amount: z.number({ error: "Nominal harus angka" }).min(1, "Minimal Rp 1"),
  description: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Silakan pilih kategori"),
  date: z.string().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export default function EditModal({
  transaction,
  categories,
  onClose,
}: {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (transaction) {
      reset({
        amount: transaction.amount,
        description: transaction.description || "",
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: new Date(transaction.date).toISOString().slice(0, 10), // format YYYY-MM-DD
      });
    }
  }, [transaction, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFormValues) => {
      const res = await fetch(`${API_URL}/transactions/${transaction?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal mengupdate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["weekly"] });
      Swal.fire({
        toast: true, position: "top-end", icon: "success", title: "Transaksi diperbarui",
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
      });
      onClose();
    },
    onError: () => {
      Swal.fire({ icon: "error", title: "Oops", text: "Gagal menyimpan perubahan." });
    },
  });

  if (!transaction) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit Transaksi</h3>
        
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Tanggal</label>
            <input type="date" {...register("date")} className="form-input" style={{ marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Tipe</label>
            <select {...register("type")} className="form-input" style={{ marginTop: 4 }}>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Kategori</label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-input" style={{ marginTop: 4 }}>
                  <option value="" disabled>Pilih Kategori</option>
                  {categories.filter(c => c.type === selectedType).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
             <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Keterangan</label>
             <textarea rows={4} cols={50} {...register("description")} className="form-input" style={{ marginTop: 4 }} />
          </div>

          <div>
             <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Nominal</label>
             <input type="number" {...register("amount", { valueAsNumber: true })} className="form-input" style={{ marginTop: 4 }} />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#f1f5f9", color: "#64748b", fontWeight: 600, border: "none", cursor: "pointer" }}>Batal</button>
            <button type="submit" disabled={updateMutation.isPending} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#10b981", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
               {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
