"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
        <h1 className="text-xl font-medium text-gray-900 mb-2">Personal Monthly Budget</h1>
        <p className="text-sm text-gray-500 mb-6">
          เข้าสู่ระบบด้วย Google เพื่อเชื่อมต่อ Google Sheets ของคุณ
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    </main>
  );
}
