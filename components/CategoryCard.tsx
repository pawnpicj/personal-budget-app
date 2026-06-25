"use client";

import { useState } from "react";
import type { CategorySummary } from "@/lib/types";
import ItemRow from "./ItemRow";
import AddItemForm from "./AddItemForm";

interface Props {
  summary: CategorySummary;
  onRenameCategory: (oldName: string, newName: string) => void;
  onAddItem: (category: string, data: { item: string; plan: number; actual: number }) => void;
  onUpdateItem: (rowIndex: number, data: { item: string; plan: number; actual: number; category: string }) => void;
  onDeleteItem: (rowIndex: number) => void;
}

function fmtBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ฿";
}

export default function CategoryCard({
  summary,
  onRenameCategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(summary.category);

  function saveName() {
    if (name.trim() && name.trim() !== summary.category) {
      onRenameCategory(summary.category, name.trim());
    }
    setEditingName(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm font-medium"
            />
            <button onClick={saveName} className="text-xs px-2 py-1 rounded bg-[#1D9E75] text-white">
              <i className="ti ti-check" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-1.5 group"
            title="แก้ไขชื่อหมวด"
          >
            <h3 className="font-medium text-gray-900 group-hover:text-[#0F6E56]">
              {summary.category}
            </h3>
            <i className="ti ti-pencil text-xs text-gray-300 group-hover:text-[#0F6E56]" aria-hidden="true" />
          </button>
        )}
        <span className="text-sm font-medium text-gray-900">{fmtBaht(summary.actualTotal)}</span>
      </div>

      <div className="divide-y divide-gray-50">
        {summary.items.length === 0 && (
          <p className="text-xs text-gray-400 py-2">ยังไม่มีรายการ</p>
        )}
        {summary.items.map((item) => (
          <ItemRow
            key={item.rowIndex}
            item={item}
            onUpdate={(rowIndex, data) =>
              onUpdateItem(rowIndex, { ...data, category: summary.category })
            }
            onDelete={onDeleteItem}
          />
        ))}
      </div>

      <AddItemForm onAdd={(data) => onAddItem(summary.category, data)} />
    </div>
  );
}
