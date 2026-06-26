"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { InstallmentPlan, InstallmentRow } from "@/lib/types";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Parse current month as MM/YYYY
function currentMonthStr(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function InstallmentClient() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // New plan form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number>(1000);
  const [newCount, setNewCount] = useState<number>(30);
  const [newStart, setNewStart] = useState(currentMonthStr());

  // Pay dialog
  const [payRow, setPayRow] = useState<InstallmentRow | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState("");

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);

  function showMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const loadPlans = useCallback(async () => {
    try {
      const res = await api<{ plans: string[] }>("/api/installments");
      setPlans(res.plans);
      if (res.plans.length > 0 && !selectedPlan) setSelectedPlan(res.plans[0]);
    } catch (e: any) { setError(e.message); }
  }, [selectedPlan]);

  const loadPlan = useCallback(async (name: string) => {
    if (!name) return;
    setLoading(true);
    try {
      const data = await api<InstallmentPlan>(`/api/installments?plan=${encodeURIComponent(name)}`);
      setPlan(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, []);
  useEffect(() => { if (selectedPlan) loadPlan(selectedPlan); }, [selectedPlan]);

  async function handleCreatePlan() {
    if (!newName.trim() || !newAmount || !newCount || !newStart) return;
    setBusy(true);
    try {
      await api("/api/installments", {
        method: "POST",
        body: JSON.stringify({ planName: newName.trim(), monthlyAmount: newAmount, count: newCount, startMonth: newStart }),
      });
      showMsg(`สร้างแผน "${newName}" แล้ว`);
      setShowNewForm(false);
      setNewName("");
      await loadPlans();
      setSelectedPlan(newName.trim());
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  function openPayDialog(row: InstallmentRow) {
    setPayRow(row);
    setPayAmount(row.paid ? row.actualAmount : row.plannedAmount);
    const today = new Date();
    setPayDate(`${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`);
  }

  async function handleMarkPaid() {
    if (!payRow) return;
    setBusy(true);
    try {
      await api("/api/installments", {
        method: "PUT",
        body: JSON.stringify({ rowIndex: payRow.rowIndex, paid: true, actualAmount: payAmount, paidDate: payDate }),
      });
      showMsg("บันทึกการจ่ายแล้ว");
      setPayRow(null);
      await loadPlan(selectedPlan);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleUnmark(row: InstallmentRow) {
    setBusy(true);
    try {
      await api("/api/installments", {
        method: "PUT",
        body: JSON.stringify({ rowIndex: row.rowIndex, paid: false, actualAmount: 0, paidDate: "" }),
      });
      showMsg("ยกเลิกการจ่ายแล้ว");
      await loadPlan(selectedPlan);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleDeletePlan() {
    setBusy(true);
    try {
      await api(`/api/installments?plan=${encodeURIComponent(selectedPlan)}`, { method: "DELETE" });
      showMsg(`ลบแผน "${selectedPlan}" แล้ว`);
      setShowDelete(false);
      setPlan(null);
      setSelectedPlan("");
      await loadPlans();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  const paidRows = plan?.rows.filter((r) => r.paid) ?? [];
  const unpaidRows = plan?.rows.filter((r) => !r.paid) ?? [];
  const totalPlanned = plan?.rows.reduce((s, r) => s + r.plannedAmount, 0) ?? 0;
  const totalPaid = paidRows.reduce((s, r) => s + r.actualAmount, 0);
  const remainingCount = unpaidRows.length;

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1D9E75] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Pay dialog */}
      {payRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-medium text-gray-900 mb-4">บันทึกการจ่าย งวดที่ {payRow.no} ({payRow.dueDate})</h3>
            <label className="text-xs text-gray-500 block mb-1">ยอดจ่าย (฿)</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <label className="text-xs text-gray-500 block mb-1">วันที่จ่าย</label>
            <input type="text" value={payDate} onChange={(e) => setPayDate(e.target.value)} placeholder="DD/MM/YYYY"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setPayRow(null)} className="flex-1 text-sm py-2 rounded-lg border border-gray-300">ยกเลิก</button>
              <button onClick={handleMarkPaid} disabled={busy}
                className="flex-1 text-sm py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#0F6E56] disabled:opacity-40">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-medium text-gray-900 mb-2">ลบแผน "{selectedPlan}"?</h3>
            <p className="text-sm text-gray-500 mb-4">ข้อมูลทั้งหมดจะถูกลบถาวร</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 text-sm py-2 rounded-lg border border-gray-300">ยกเลิก</button>
              <button onClick={handleDeletePlan} disabled={busy}
                className="flex-1 text-sm py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">ผ่อนชำระ</h1>
          {session?.user?.name && <p className="text-xs text-gray-400 mt-0.5">{session.user.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex text-sm overflow-hidden rounded-lg">
            <Link href="/dashboard" title="Dashboard"
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <i className="ti ti-layout-dashboard" aria-hidden="true" />
            </Link>
            <Link href="/overview" title="Overview"
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border-l border-gray-200">
              <i className="ti ti-chart-bar" aria-hidden="true" />
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="Logout"
              className="flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white transition-colors">
              <i className="ti ti-logout" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">{error}</div>
      )}

      {/* Plan selector + actions */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {plans.length > 0 ? (
          <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-0">
            {plans.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        ) : (
          <span className="text-sm text-gray-400 flex-1">ยังไม่มีแผนผ่อน</span>
        )}
        <button onClick={() => setShowNewForm(true)} title="แผนใหม่"
          className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#0F6E56]">
          <i className="ti ti-plus" /> แผนใหม่
        </button>
        {selectedPlan && (
          <button onClick={() => setShowDelete(true)} title="ลบแผน"
            className="flex items-center px-3 py-2 rounded-lg border border-red-200 text-red-400 hover:bg-red-50">
            <i className="ti ti-trash" />
          </button>
        )}
      </div>

      {/* New plan form */}
      {showNewForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <h2 className="text-sm font-medium text-gray-800 mb-4">สร้างแผนใหม่</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-xs text-gray-500">ชื่อแผน</span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ผ่อนรถ"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">ยอดผ่อน/งวด (฿)</span>
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">จำนวนงวด</span>
              <input type="number" value={newCount} onChange={(e) => setNewCount(parseInt(e.target.value) || 0)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-xs text-gray-500">เริ่มงวดแรก (MM/YYYY)</span>
              <input value={newStart} onChange={(e) => setNewStart(e.target.value)} placeholder="01/2026"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewForm(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300">ยกเลิก</button>
            <button onClick={handleCreatePlan} disabled={busy || !newName.trim()}
              className="flex-1 text-sm py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#0F6E56] disabled:opacity-40">
              {busy ? "กำลังสร้าง..." : "สร้างแผน"}
            </button>
          </div>
        </div>
      )}

      {/* Plan table */}
      {loading ? (
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      ) : plan && plan.rows.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                <th className="px-3 py-2.5 text-left w-8">#</th>
                <th className="px-3 py-2.5 text-right">วันที่</th>
                <th className="px-3 py-2.5 text-right">ยอดผ่อน</th>
                <th className="px-3 py-2.5 text-center">สถานะ</th>
                <th className="px-3 py-2.5 text-right">จ่าย</th>
                <th className="px-2 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {plan.rows.map((row) => (
                <tr key={row.rowIndex}
                  className={`border-b border-gray-50 last:border-0 ${row.paid ? "bg-green-50/60" : "bg-red-50/30"}`}>
                  <td className="px-3 py-2 text-gray-500 text-xs">{row.no}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{row.dueDate}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmtMoney(row.plannedAmount)}</td>
                  <td className="px-3 py-2 text-center">
                    {row.paid
                      ? <span className="text-xs text-green-700 font-medium">จ่ายแล้ว</span>
                      : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {row.paid ? fmtMoney(row.actualAmount) : ""}
                  </td>
                  <td className="px-2 py-2">
                    {row.paid ? (
                      <button onClick={() => handleUnmark(row)} title="ยกเลิก"
                        className="text-gray-300 hover:text-red-400 text-xs">
                        <i className="ti ti-rotate-left" />
                      </button>
                    ) : (
                      <button onClick={() => openPayDialog(row)} title="บันทึกจ่าย"
                        className="text-gray-300 hover:text-[#1D9E75]">
                        <i className="ti ti-circle-check" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium text-sm">
                <td colSpan={2} className="px-3 py-3 text-gray-600">รวม</td>
                <td className="px-3 py-3 text-right text-gray-900">{fmtMoney(totalPlanned)}</td>
                <td className="px-3 py-3 text-center text-xs text-gray-500">เหลือ {remainingCount}</td>
                <td className="px-3 py-3 text-right text-[#1D9E75]">฿{fmtMoney(totalPaid)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : selectedPlan ? (
        <p className="text-sm text-gray-400 text-center py-8">ไม่มีข้อมูล</p>
      ) : null}
    </main>
  );
}
