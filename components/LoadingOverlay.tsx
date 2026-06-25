"use client";

export default function LoadingOverlay({ visible, message = "กำลังบันทึก..." }: { visible: boolean; message?: string }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-6 flex items-center gap-4">
        <svg className="animate-spin w-5 h-5 text-[#1D9E75]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
}
