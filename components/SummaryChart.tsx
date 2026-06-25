"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CategorySummary } from "@/lib/types";

const COLORS = ["#1D9E75", "#D85A30", "#378ADD", "#993C1D", "#BA7517", "#D4537E", "#7F77DD"];

export default function SummaryChart({ data }: { data: CategorySummary[] }) {
  const chartData = data
    .filter((d) => d.actualTotal > 0)
    .map((d) => ({ name: d.category, value: d.actualTotal }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-900 mb-3">สัดส่วนรายจ่าย</h3>
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูลรายจ่ายเดือนนี้</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-medium text-gray-900 mb-3">สัดส่วนรายจ่าย</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString("th-TH") + " ฿"} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
