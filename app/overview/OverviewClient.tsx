"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { MonthSummary } from "@/lib/types";
import LoadingOverlay from "@/components/LoadingOverlay";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const PIE_COLORS = ["#1D9E75", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#64748B", "#A3E635"];

function fmtBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMonthLabel(month: string) {
  const [mm, yyyy] = month.split("-");
  return `${THAI_MONTHS[parseInt(mm) - 1]} ${yyyy}`;
}

function SummaryCard({ label, value, icon, color, sub }: { label: string; value: string; icon: string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <i className={`ti ${icon} text-lg ${color}`} aria-hidden="true" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className={`text-base font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function OverviewClient() {
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [data, setData] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sheets/months")
      .then((r) => r.json())
      .then((res) => {
        const years = [...new Set<string>((res.months as string[]).map((m) => m.split("-")[1]))]
          .sort()
          .reverse();
        setAvailableYears(years.length > 0 ? years : [currentYear]);
        if (years.length > 0 && !years.includes(year)) setYear(years[0]);
      })
      .catch(() => setAvailableYears([currentYear]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/sheets/overview?year=${year}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);

  const totalBalance = data.reduce((s, m) => s + m.balance, 0);
  const totalSpent = data.reduce((s, m) => s + m.totalActual, 0);
  const totalSaved = data.reduce((s, m) => s + m.difference, 0);
  const avgDiff = data.length > 0 ? totalSaved / data.length : 0;

  const categoryMap = new Map<string, number>();
  data.forEach((m) =>
    m.categories.forEach((c) => {
      categoryMap.set(c.category, (categoryMap.get(c.category) ?? 0) + c.actualTotal);
    })
  );
  const categoryData = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const chartData = [...data].reverse().map((m) => {
    const [mm] = m.month.split("-");
    return {
      month: THAI_MONTHS[parseInt(mm) - 1],
      Balance: m.balance,
      Spent: m.totalActual,
      Remaining: Math.max(0, m.difference),
    };
  });

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <LoadingOverlay visible={loading} message="กำลังโหลดข้อมูล..." />

      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="ti ti-arrow-left" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-medium text-gray-900">Overview ปี {year}</h1>
        </div>

        <div className="flex items-center gap-2">
          {availableYears.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                year === y
                  ? "bg-[#1D9E75] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <i className="ti ti-calendar-off text-5xl block mb-3" aria-hidden="true" />
          <p className="text-sm">ไม่มีข้อมูลสำหรับปี {year}</p>
          <p className="text-xs mt-1">เพิ่มเดือนใหม่ใน Dashboard ก่อน</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="flex flex-col gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              label="รายได้คงเหลือรวม"
              value={fmtBaht(totalBalance) + " ฿"}
              icon="ti-wallet"
              color="text-[#1D9E75]"
              sub={`${data.length} เดือน`}
            />
            <SummaryCard
              label="ใช้จ่ายรวม"
              value={fmtBaht(totalSpent) + " ฿"}
              icon="ti-credit-card"
              color="text-blue-600"
            />
            <SummaryCard
              label="คงเหลือสุทธิ"
              value={fmtBaht(totalSaved) + " ฿"}
              icon="ti-piggy-bank"
              color={totalSaved >= 0 ? "text-[#1D9E75]" : "text-red-500"}
              sub={`เฉลี่ย ${fmtBaht(avgDiff)} ฿/เดือน`}
            />
            <SummaryCard
              label="อัตราใช้จ่าย"
              value={totalBalance > 0 ? ((totalSpent / totalBalance) * 100).toFixed(1) + "%" : "—"}
              icon="ti-chart-pie"
              color={totalBalance > 0 && totalSpent / totalBalance > 1 ? "text-red-500" : "text-amber-600"}
            />
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              รายได้คงเหลือ vs ใช้จ่ายจริง (รายเดือน)
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v / 1000).toFixed(0) + "K"}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtBaht(v) + " ฿", name === "Balance" ? "รายได้คงเหลือ" : "ใช้จ่ายจริง"]}
                />
                <Legend
                  formatter={(v) => (v === "Balance" ? "รายได้คงเหลือ" : "ใช้จ่ายจริง")}
                />
                <Bar dataKey="Balance" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly table + category pie */}
          <div className="grid sm:grid-cols-3 gap-5">
            {/* Monthly breakdown table */}
            <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-3">สรุปรายเดือน</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">เดือน</th>
                      <th className="text-right pb-2 font-medium">Balance</th>
                      <th className="text-right pb-2 font-medium">ใช้จ่าย</th>
                      <th className="text-right pb-2 font-medium">คงเหลือ</th>
                      <th className="text-right pb-2 font-medium">%ใช้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((m) => {
                      const pct = m.balance > 0 ? (m.totalActual / m.balance) * 100 : 0;
                      const pctColor =
                        pct > 100
                          ? "bg-red-100 text-red-600"
                          : pct > 80
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-[#0F6E56]";
                      return (
                        <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2 font-medium text-gray-700">{getMonthLabel(m.month)}</td>
                          <td className="py-2 text-right text-gray-700">{fmtBaht(m.balance)}</td>
                          <td className="py-2 text-right text-blue-600">{fmtBaht(m.totalActual)}</td>
                          <td className={`py-2 text-right font-medium ${m.difference >= 0 ? "text-[#1D9E75]" : "text-red-500"}`}>
                            {fmtBaht(m.difference)}
                          </td>
                          <td className="py-2 text-right">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${pctColor}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="text-xs font-semibold text-gray-700 border-t-2 border-gray-200">
                      <td className="pt-3">รวมทั้งปี</td>
                      <td className="pt-3 text-right">{fmtBaht(totalBalance)}</td>
                      <td className="pt-3 text-right text-blue-600">{fmtBaht(totalSpent)}</td>
                      <td className={`pt-3 text-right ${totalSaved >= 0 ? "text-[#1D9E75]" : "text-red-500"}`}>
                        {fmtBaht(totalSaved)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Category pie */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-3">หมวดรายจ่ายรวมปี</h2>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmtBaht(v) + " ฿"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {categoryData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-gray-600 truncate max-w-[90px]">{c.name}</span>
                        </div>
                        <span className="text-gray-700 font-medium ml-2">{fmtBaht(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-xs text-gray-400">
                  ไม่มีข้อมูลรายจ่าย
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
