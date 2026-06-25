"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import type { MonthData, CategorySummary } from "@/lib/types";
import MonthSelector from "@/components/MonthSelector";
import IncomeCard from "@/components/IncomeCard";
import CategoryCard from "@/components/CategoryCard";
import AddCategoryCard from "@/components/AddCategoryCard";
import BudgetVsActualChart from "@/components/BudgetVsActualChart";
import SummaryChart from "@/components/SummaryChart";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toast from "@/components/Toast";

function currentMonthLabel(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

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

export default function DashboardClient() {
  const { data: session } = useSession();
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState<string>(currentMonthLabel());
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
  }

  async function withBusy<T,>(fn: () => Promise<T>, successMsg?: string): Promise<T> {
    setBusy(true);
    try {
      const result = await fn();
      if (successMsg) showToast(successMsg);
      return result;
    } catch (e: any) {
      showToast(e.message, "error");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    api<{ alreadyInitialized: boolean }>("/api/sheets/init", { method: "POST" })
      .then(() => api<{ categories: string[] }>("/api/sheets/category"))
      .then((res) => setAllCategories(res.categories))
      .catch((e: any) => setError(e.message))
      .finally(() => setInitializing(false));
  }, []);

  const loadMonths = useCallback(async () => {
    if (initializing) return;
    try {
      const res = await api<{ months: string[] }>("/api/sheets/months");
      const list = res.months.length > 0 ? res.months : [currentMonthLabel()];
      setMonths(list);
      if (!list.includes(month)) setMonth(list[0]);
    } catch (e: any) {
      setError(e.message);
    }
  }, [month, initializing]);

  const loadMonthData = useCallback(async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<MonthData>(`/api/sheets/month?month=${encodeURIComponent(m)}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializing) loadMonths();
  }, [loadMonths, initializing]);

  useEffect(() => {
    if (!initializing) loadMonthData(month);
  }, [month, loadMonthData, initializing]);

  const categories: CategorySummary[] = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, CategorySummary>();
    for (const item of data.items) {
      const key = item.category || "อื่นๆ";
      if (!map.has(key)) {
        map.set(key, { category: key, planTotal: 0, actualTotal: 0, items: [] });
      }
      const c = map.get(key)!;
      c.items.push(item);
      c.planTotal += item.plan;
      c.actualTotal += item.actual;
    }
    return Array.from(map.values());
  }, [data]);

  const totalActual = useMemo(
    () => categories.reduce((sum, c) => sum + c.actualTotal, 0),
    [categories]
  );

  async function handleCreateMonth(newMonth: string) {
    if (!/^\d{2}-\d{4}$/.test(newMonth)) {
      setError("รูปแบบเดือนต้องเป็น MM-YYYY เช่น 07-2026");
      return;
    }
    await loadMonthData(newMonth);
    setMonths((prev) => (prev.includes(newMonth) ? prev : [newMonth, ...prev]));
    setMonth(newMonth);
  }

  async function handleHideMonth(monthToHide: string) {
    await withBusy(
      () => api("/api/sheets/month", { method: "PATCH", body: JSON.stringify({ month: monthToHide }) }),
      `ซ่อนเดือน ${monthToHide} แล้ว`
    );
    const remaining = months.filter((m) => m !== monthToHide);
    setMonths(remaining);
    if (remaining.length > 0) {
      setMonth(remaining[0]);
    } else {
      setData(null);
      setMonth(currentMonthLabel());
    }
  }

  async function handleDeleteMonth(monthToDelete: string) {
    await withBusy(
      () => api(`/api/sheets/month?month=${encodeURIComponent(monthToDelete)}`, { method: "DELETE" }),
      `ลบเดือน ${monthToDelete} แล้ว`
    );
    const remaining = months.filter((m) => m !== monthToDelete);
    setMonths(remaining);
    if (remaining.length > 0) {
      setMonth(remaining[0]);
    } else {
      setData(null);
      setMonth(currentMonthLabel());
    }
  }

  async function handleSaveIncome(d: { salary: number; bonus: number; sso: number; other: number }) {
    await withBusy(
      () => api("/api/sheets/income", { method: "PUT", body: JSON.stringify({ month, ...d }) }),
      "บันทึกรายได้แล้ว"
    );
    loadMonthData(month);
  }

  async function handleAddItem(category: string, d: { item: string; plan: number; actual: number }) {
    await withBusy(
      () => api("/api/sheets/item", { method: "POST", body: JSON.stringify({ month, category, ...d }) }),
      "เพิ่มรายการแล้ว"
    );
    loadMonthData(month);
  }

  async function handleUpdateItem(
    rowIndex: number,
    d: { item: string; plan: number; actual: number; category: string }
  ) {
    await withBusy(
      () => api("/api/sheets/item", { method: "PUT", body: JSON.stringify({ month, rowIndex, ...d }) }),
      "แก้ไขรายการแล้ว"
    );
    loadMonthData(month);
  }

  async function handleDeleteItem(rowIndex: number) {
    await withBusy(
      () => api("/api/sheets/item", { method: "DELETE", body: JSON.stringify({ month, rowIndex }) }),
      "ลบรายการแล้ว"
    );
    loadMonthData(month);
  }

  async function handleRenameCategory(oldName: string, newName: string) {
    await withBusy(
      () => api("/api/sheets/category", { method: "PUT", body: JSON.stringify({ month, oldName, newName }) }),
      "เปลี่ยนชื่อหมวดแล้ว"
    );
    loadMonthData(month);
  }

  async function handleCreateCategory(
    category: string,
    firstItem: { item: string; plan: number; actual: number }
  ) {
    await withBusy(
      () => api("/api/sheets/item", { method: "POST", body: JSON.stringify({ month, category, ...firstItem }) }),
      "สร้างหมวดใหม่แล้ว"
    );
    loadMonthData(month);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <LoadingOverlay visible={initializing} message="กำลังตั้งค่า Google Sheet..." />
      <LoadingOverlay visible={busy} message="กำลังบันทึก..." />
      {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Personal Monthly Budget</h1>
          {session?.user?.name && (
            <p className="text-xs text-gray-400 mt-0.5">{session.user.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector
            months={months}
            current={month}
            onChange={setMonth}
            onCreateMonth={handleCreateMonth}
            onHideMonth={handleHideMonth}
            onDeleteMonth={handleDeleteMonth}
          />
          <div className="flex text-sm overflow-hidden rounded-lg">
            <Link
              href="/overview"
              title="Overview"
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <i className="ti ti-chart-bar" aria-hidden="true" />
            </Link>
            <a
              href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              title="เปิด Google Sheet"
              className="flex items-center px-3 py-1.5 bg-[#1D9E75] hover:bg-[#0F6E56] text-white transition-colors"
            >
              <i className="ti ti-table-filled" aria-hidden="true" />
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Logout"
              className="flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <i className="ti ti-logout" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      {!initializing && (loading || !data) ? (
        <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
      ) : !initializing && data ? (
        <div className="flex flex-col gap-5">
          <IncomeCard income={data.income} totalActual={totalActual} onSave={handleSaveIncome} />

          <div className="grid sm:grid-cols-2 gap-5">
            {categories.map((c) => (
              <CategoryCard
                key={c.category}
                summary={c}
                onRenameCategory={handleRenameCategory}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            ))}
            <AddCategoryCard
              onCreate={handleCreateCategory}
              availableCategories={allCategories.filter(
                (c) => !categories.some((existing) => existing.category === c)
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <BudgetVsActualChart data={categories} />
            <SummaryChart data={categories} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
