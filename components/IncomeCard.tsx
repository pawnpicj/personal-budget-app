"use client";

import { useState, useEffect } from "react";
import type { IncomeData } from "@/lib/types";

interface Props {
  income: IncomeData;
  totalActual: number;
  onSave: (data: { salary: number; bonus: number; sso: number; other: number }) => void;
}

function fmtBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ฿";
}

export default function IncomeCard({ income, totalActual, onSave }: Props) {
  const [salary, setSalary] = useState(income.salary);
  const [bonus, setBonus] = useState(income.bonus);
  const [sso, setSso] = useState(income.sso);
  const [other, setOther] = useState(income.other);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSalary(income.salary);
    setBonus(income.bonus);
    setSso(income.sso);
    setOther(income.other);
    setDirty(false);
  }, [income]);

  const balance = salary - bonus - sso - other;
  const difference = balance - totalActual;

  function markDirty() {
    setDirty(true);
  }

  function save() {
    onSave({ salary, bonus, sso, other });
    setDirty(false);
  }

  const field = (
    label: string,
    value: number,
    setValue: (n: number) => void
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => {
          setValue(parseFloat(e.target.value) || 0);
          markDirty();
        }}
        onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {field("Salary", salary, setSalary)}
        {field("Bonus", bonus, setBonus)}
        {field("SSO", sso, setSso)}
        {field("Other", other, setOther)}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Balance (Auto)</span>
          <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium">
            {balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {dirty && (
        <button
          onClick={save}
          className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white mb-4"
        >
          บันทึก
        </button>
      )}

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">Total Actual</div>
          <div className="font-medium text-gray-900">{fmtBaht(totalActual)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Balance</div>
          <div className="font-medium text-gray-900">{fmtBaht(balance)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Difference</div>
          <div className={`font-medium ${difference < 0 ? "text-red-600" : "text-[#0F6E56]"}`}>
            {fmtBaht(difference)}
          </div>
        </div>
      </div>
    </div>
  );
}
