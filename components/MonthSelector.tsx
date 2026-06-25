"use client";

import { useState } from "react";

interface Props {
  months: string[];
  current: string;
  onChange: (month: string) => void;
  onCreateMonth: (month: string) => void;
  onHideMonth: (month: string) => void;
  onDeleteMonth: (month: string) => void;
}

function thisMonthLabel(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${mm}-${d.getFullYear()}`;
}

export default function MonthSelector({ months, current, onChange, onCreateMonth, onHideMonth, onDeleteMonth }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [newMonth, setNewMonth] = useState(thisMonthLabel(1));
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  function handleDelete() {
    if (confirmText !== "CONFIRM") return;
    onDeleteMonth(current);
    setShowConfirm(false);
    setConfirmText("");
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {!showNew ? (
          <div className="flex">
            <button
              onClick={() => setShowNew(true)}
              title="เดือนใหม่"
              className="text-sm px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-l-lg"
            >
              <i className="ti ti-plus" aria-hidden="true" />
            </button>
            <button
              onClick={() => onHideMonth(current)}
              title={`ซ่อนเดือน ${current}`}
              className="text-sm px-3 py-2 border-y border-r border-gray-300 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <i className="ti ti-eye-off" aria-hidden="true" />
            </button>
            <button
              onClick={() => { setShowConfirm(true); setConfirmText(""); }}
              title={`ลบเดือน ${current}`}
              className="text-sm px-3 py-2 border-y border-r border-gray-300 text-red-400 hover:text-red-600 bg-white hover:bg-red-50 transition-colors rounded-r-lg"
            >
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              placeholder="MM-YYYY"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
            />
            <button
              onClick={() => { onCreateMonth(newMonth); setShowNew(false); }}
              className="text-sm px-3 py-2 rounded-lg bg-[#1D9E75] text-white"
            >
              สร้าง
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="text-sm px-3 py-2 rounded-lg border border-gray-300"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="ti ti-trash text-red-600 text-lg" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">ลบเดือน {current}</h3>
                <p className="text-xs text-gray-500 mt-0.5">ข้อมูลจะถูกลบออกจาก Google Sheet ถาวร</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              พิมพ์ <span className="font-mono font-bold text-red-600">CONFIRM</span> เพื่อยืนยัน
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              placeholder="CONFIRM"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:border-red-400"
            />

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== "CONFIRM"}
                className="flex-1 text-sm py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ลบเดือนนี้
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="flex-1 text-sm py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
