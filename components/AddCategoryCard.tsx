"use client";

import { useState } from "react";

interface Props {
  availableCategories: string[];
  onCreate: (category: string, firstItem: { item: string; plan: number; actual: number }) => void;
}

export default function AddCategoryCard({ availableCategories, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [item, setItem] = useState("");
  const [plan, setPlan] = useState<number>(0);
  const [actual, setActual] = useState<number>(0);

  const isCustom = category === "__custom__";
  const finalCategory = isCustom ? customCategory.trim() : category;

  function submit() {
    if (!finalCategory || !item.trim()) return;
    onCreate(finalCategory, { item: item.trim(), plan, actual });
    setCategory("");
    setCustomCategory("");
    setItem("");
    setPlan(0);
    setActual(0);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-5 flex items-center justify-center gap-2 text-gray-400 hover:text-[#0F6E56] hover:border-[#1D9E75] transition-colors min-h-[120px]"
      >
        <i className="ti ti-plus text-xl" aria-hidden="true" />
        <span className="text-sm">เพิ่มหมวดใหม่</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-medium text-gray-900 mb-3">หมวดใหม่</h3>
      <div className="flex flex-col gap-2">
        <select
          autoFocus
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
        >
          <option value="" disabled>เลือกหมวด...</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="__custom__">+ พิมพ์ชื่อใหม่</option>
        </select>

        {isCustom && (
          <input
            autoFocus
            placeholder="ชื่อหมวดใหม่"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        )}

        <input
          placeholder="รายการแรก เช่น เงินฝาก"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Plan"
            value={plan || ""}
            onChange={(e) => setPlan(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-1/2"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Actual"
            value={actual || ""}
            onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-1/2"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={submit}
            disabled={!finalCategory || !item.trim()}
            className="text-sm px-3 py-1.5 rounded bg-[#1D9E75] text-white disabled:opacity-40"
          >
            สร้างหมวด
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-sm px-3 py-1.5 rounded border border-gray-300"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
