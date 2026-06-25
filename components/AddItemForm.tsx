"use client";

import { useState } from "react";

interface Props {
  onAdd: (data: { item: string; plan: number; actual: number }) => void;
}

export default function AddItemForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<number>(0);
  const [actual, setActual] = useState<number>(0);

  function submit() {
    if (!name.trim()) return;
    onAdd({ item: name.trim(), plan, actual });
    setName("");
    setPlan(0);
    setActual(0);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-[#0F6E56] flex items-center gap-1 pt-2"
      >
        <i className="ti ti-plus" aria-hidden="true" /> เพิ่มรายการ
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <input
        autoFocus
        placeholder="ชื่อรายการ"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[100px]"
      />
      <input
        type="number"
        step="0.01"
        placeholder="Plan"
        value={plan || ""}
        onChange={(e) => setPlan(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
      />
      <input
        type="number"
        step="0.01"
        placeholder="Actual"
        value={actual || ""}
        onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
      />
      <button onClick={submit} className="text-xs px-2 py-1 rounded bg-[#1D9E75] text-white">
        เพิ่ม
      </button>
      <button onClick={() => setOpen(false)} className="text-xs px-2 py-1 rounded border border-gray-300">
        ยกเลิก
      </button>
    </div>
  );
}
