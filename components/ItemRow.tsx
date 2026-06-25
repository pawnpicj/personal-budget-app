"use client";

import { useState } from "react";
import type { BudgetItem } from "@/lib/types";

interface Props {
  item: BudgetItem;
  onUpdate: (rowIndex: number, data: { item: string; plan: number; actual: number }) => void;
  onDelete: (rowIndex: number) => void;
}

function fmtBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ItemRow({ item, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.item);
  const [plan, setPlan] = useState(item.plan);
  const [actual, setActual] = useState(item.actual);

  function save() {
    onUpdate(item.rowIndex, { item: name, plan, actual });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 py-1.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[100px]"
        />
        <input
          type="number"
          step="0.01"
          value={plan}
          onChange={(e) => setPlan(parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
          placeholder="Plan"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
        />
        <input
          type="number"
          step="0.01"
          value={actual}
          onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
          placeholder="Actual"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
        />
        <button onClick={save} className="text-xs px-2 py-1 rounded bg-[#1D9E75] text-white">
          <i className="ti ti-check" aria-hidden="true" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs px-2 py-1 rounded border border-gray-300"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 text-sm group">
      <span className="text-gray-700">{item.item}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">{fmtBaht(item.plan)}</span>
        <span className="text-gray-900 font-medium">{fmtBaht(item.actual)} ฿</span>
        <button
          onClick={() => setEditing(true)}
          aria-label="แก้ไข"
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-500 hover:text-[#0F6E56] border border-gray-200 hover:border-[#0F6E56] rounded px-1.5 py-0.5 transition-all"
        >
          <i className="ti ti-pencil" aria-hidden="true" />
          แก้ไข
        </button>
        <button
          onClick={() => onDelete(item.rowIndex)}
          aria-label="ลบ"
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded px-1.5 py-0.5 transition-all"
        >
          <i className="ti ti-trash" aria-hidden="true" />
          ลบ
        </button>
      </div>
    </div>
  );
}
