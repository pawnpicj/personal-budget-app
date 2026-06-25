"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { CategorySummary } from "@/lib/types";

export default function BudgetVsActualChart({ data }: { data: CategorySummary[] }) {
  const chartData = data.map((d) => ({
    category: d.category,
    Plan: d.planTotal,
    Actual: d.actualTotal,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-medium text-gray-900 mb-3">Budget x Actual ตามหมวด</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDEBE2" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString("th-TH") + " ฿"} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Plan" fill="#85B7EB" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Actual" fill="#1D9E75" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
