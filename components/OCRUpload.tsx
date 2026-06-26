"use client";

import { useState, useRef } from "react";

interface ExtractedItem {
  item: string;
  amount: number;
  selected: boolean;
}

interface Props {
  categories: string[];
  onAddItems: (category: string, items: { item: string; plan: number; actual: number }[]) => Promise<void>;
}

async function runOCR(file: File): Promise<ExtractedItem[]> {
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? file.type;

  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "OCR failed");

  return (json.items as { item: string; amount: number }[])
    .filter((i) => i.item && i.amount > 0)
    .map((i) => ({ item: i.item, amount: i.amount, selected: true }));
}

export default function OCRUpload({ categories, onAddItems }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "ocr" | "confirm">("upload");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setPreview(null);
    setItems([]);
    setError(null);
    setLoading(false);
    setProgress("");
  }

  function close() { setOpen(false); reset(); }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("รองรับเฉพาะไฟล์รูปภาพ"); return; }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setStep("ocr");
    setLoading(true);
    setError(null);

    try {
      setProgress("กำลังวิเคราะห์ภาพ...");
      const extracted = await runOCR(file);

      if (extracted.length === 0) {
        setError("ไม่พบรายการในภาพ — ลองถ่ายรูปใหม่ให้ชัดขึ้น หรือเพิ่มรายการเองด้านล่าง");
        setItems([]);
      } else {
        setItems(extracted);
      }

      if (categories.length > 0) setCategory(categories[0]);
      setStep("confirm");
    } catch (e: any) {
      setError(e.message);
      setStep("upload");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  async function handleSave() {
    const selected = items.filter((i) => i.selected && i.amount > 0);
    if (!selected.length || !category) return;
    setLoading(true);
    try {
      await onAddItems(category, selected.map((i) => ({ item: i.item, plan: i.amount, actual: i.amount })));
      close();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  function addManualItem() {
    setItems((prev) => [...prev, { item: "", amount: 0, selected: true }]);
  }

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }

  function updateAmount(idx: number, val: string) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, amount: parseFloat(val) || 0 } : it));
  }

  function updateName(idx: number, val: string) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, item: val } : it));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const selectedCount = items.filter((i) => i.selected && i.item.trim()).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
      >
        <i className="ti ti-scan" aria-hidden="true" />
        สแกนบิล
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <i className="ti ti-scan text-[#1D9E75] text-lg" aria-hidden="true" />
                <h2 className="font-medium text-gray-900">สแกนบิล</h2>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* Step: upload */}
              {(step === "upload" || step === "ocr") && (
                <div className="flex flex-col gap-4">
                  <div
                    onClick={() => !loading && fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${loading ? "border-[#1D9E75] bg-green-50/40 cursor-default" : "border-gray-300 cursor-pointer hover:border-[#1D9E75] hover:bg-green-50/40"}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-8 h-8 text-[#1D9E75]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span className="text-sm text-gray-500">{progress || "กำลังประมวลผล..."}</span>
                        {preview && <img src={preview} alt="preview" className="max-h-32 rounded-lg object-contain opacity-60" />}
                      </>
                    ) : (
                      <>
                        <i className="ti ti-photo-up text-4xl text-gray-300" aria-hidden="true" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">อัปโหลดรูปบิล</p>
                          <p className="text-xs text-gray-400 mt-1">คลิกหรือลากไฟล์มาวาง</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}

              {/* Step: confirm */}
              {step === "confirm" && (
                <div className="flex flex-col gap-4">
                  {preview && (
                    <img src={preview} alt="bill" className="h-20 object-contain rounded-lg border border-gray-100 mx-auto" />
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">บันทึกในหมวด</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">รายการ</span>
                      <button onClick={addManualItem} className="text-xs text-[#1D9E75] hover:underline flex items-center gap-1">
                        <i className="ti ti-plus" /> เพิ่มเอง
                      </button>
                    </div>

                    {items.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">ไม่มีรายการ — กดเพิ่มเองได้เลย</p>
                    )}

                    <div className="flex flex-col gap-1.5">
                      {items.map((it, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${it.selected ? "border-[#1D9E75] bg-green-50/40" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                          <input type="checkbox" checked={it.selected} onChange={() => toggleItem(idx)}
                            className="accent-[#1D9E75] w-4 h-4 shrink-0" />
                          <input value={it.item} placeholder="ชื่อรายการ"
                            onChange={(e) => updateName(idx, e.target.value)}
                            className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 min-w-0" />
                          <input type="number" value={it.amount || ""} placeholder="0"
                            onChange={(e) => updateAmount(idx, e.target.value)}
                            onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
                            className="w-20 text-right text-sm bg-transparent border-none outline-none text-gray-900 font-medium" />
                          <span className="text-xs text-gray-400">฿</span>
                          <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400">
                            <i className="ti ti-x text-xs" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
              {step === "confirm" ? (
                <>
                  <button onClick={reset} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <i className="ti ti-arrow-left" aria-hidden="true" /> ใหม่
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || selectedCount === 0 || !category}
                    className="flex-1 text-sm py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#0F6E56] disabled:opacity-40 transition-colors"
                  >
                    {loading ? "กำลังบันทึก..." : `บันทึก ${selectedCount} รายการ`}
                  </button>
                </>
              ) : (
                <button onClick={close} disabled={loading} className="flex-1 text-sm py-2 rounded-lg border border-gray-300 disabled:opacity-40">
                  ยกเลิก
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
