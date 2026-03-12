"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { TransactionSummary } from "@repo/types";
import { API_URL } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type WeeklyData = { hari: string; Pemasukan: number; Pengeluaran: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          fontSize: 13,
          minWidth: 180,
        }}
      >
        <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            style={{ color: entry.color, fontWeight: 600, marginBottom: 2 }}
          >
            {entry.name}: Rp {entry.value.toLocaleString("id-ID")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const router = useRouter();

  const {
    data: summary = { INCOME: 0, EXPENSE: 0, BALANCE: 0 },
    isLoading: isLoadingSummary,
  } = useQuery<TransactionSummary>({
    queryKey: ["summary"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions/summary`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        throw new Error("Gagal");
      }
      return res.json();
    },
  });

  const { data: weeklyData = [], isLoading: isLoadingWeekly } = useQuery<
    WeeklyData[]
  >({
    queryKey: ["weekly"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/transactions/weekly`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal mengambil data mingguan");
      return res.json();
    },
  });

  const isLoading = isLoadingSummary || isLoadingWeekly;
  const total = summary.INCOME + summary.EXPENSE;
  const incomeRatio = total > 0 ? (summary.INCOME / total) * 100 : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          Laporan Keuangan
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
          Analisis arus kas dan tren keuangan Anda secara komprehensif.
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #6366f1",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Summary Cards */}
          <div className="summary-grid">
            {/* Saldo */}
            <div className="card-dark">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  marginBottom: 12,
                }}
              >
                Saldo Bersih Bulan Ini
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>
                Rp
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {summary.BALANCE.toLocaleString("id-ID")}
              </p>
              <p
                style={{
                  fontSize: 12,
                  marginTop: 10,
                  fontWeight: 600,
                  color: summary.BALANCE >= 0 ? "#34d399" : "#fb7185",
                }}
              >
                {summary.BALANCE >= 0 ? "▲ Surplus" : "▼ Defisit"}
              </p>
            </div>

            {/* Pemasukan */}
            <div className="card">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  marginBottom: 12,
                }}
              >
                Total Pemasukan
              </p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#10b981",
                  letterSpacing: "-0.5px",
                }}
              >
                Rp {summary.INCOME.toLocaleString("id-ID")}
              </p>
              <div
                style={{
                  marginTop: 12,
                  height: 6,
                  background: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${incomeRatio}%`,
                    background: "#10b981",
                    borderRadius: 99,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                {incomeRatio.toFixed(0)}% dari total arus
              </p>
            </div>

            {/* Pengeluaran */}
            <div className="card">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  marginBottom: 12,
                }}
              >
                Total Pengeluaran
              </p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f43f5e",
                  letterSpacing: "-0.5px",
                }}
              >
                Rp {summary.EXPENSE.toLocaleString("id-ID")}
              </p>
              <div
                style={{
                  marginTop: 12,
                  height: 6,
                  background: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${100 - incomeRatio}%`,
                    background: "#f43f5e",
                    borderRadius: 99,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                {(100 - incomeRatio).toFixed(0)}% dari total arus
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card">
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              Transaksi 7 Hari Terakhir
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
              Perbandingan pemasukan dan pengeluaran harian.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={weeklyData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hari"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Pemasukan"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Pengeluaran"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Area Chart */}
          <div className="card">
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              Tren Arus Kas Mingguan
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
              Visualisasi akumulasi arus keuangan per hari.
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={weeklyData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hari"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gIncome)"
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#gExpense)"
                  dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Banner */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: summary.BALANCE >= 0 ? "#ecfdf5" : "#fff1f2",
              border: `1.5px solid ${summary.BALANCE >= 0 ? "#a7f3d0" : "#fecdd3"}`,
              color: summary.BALANCE >= 0 ? "#065f46" : "#9f1239",
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>
              {summary.BALANCE >= 0
                ? "✅ Status Finansial: Sehat"
                : "⚠️ Status Finansial: Defisit"}
            </p>
            <p style={{ fontSize: 13 }}>
              {summary.BALANCE >= 0
                ? "Arus kas bulan ini positif. Anda berhasil mengelola keuangan dengan baik — pengeluaran masih di bawah pemasukan."
                : "Arus kas bulan ini negatif. Pengeluaran melebihi pemasukan. Pertimbangkan untuk mengurangi pengeluaran yang tidak perlu."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
