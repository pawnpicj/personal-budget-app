import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-[22px] bg-[#1D9E75] flex items-center justify-center shadow-lg">
            <svg width="48" height="48" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="82"  y="312" width="88" height="128" rx="12" fill="white" fillOpacity="0.35"/>
              <rect x="212" y="212" width="88" height="228" rx="12" fill="white" fillOpacity="0.6"/>
              <rect x="342" y="116" width="88" height="324" rx="12" fill="white" fillOpacity="0.95"/>
              <polyline points="126,298 256,198 386,102" stroke="white" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="126" cy="298" r="18" fill="white"/>
              <circle cx="256" cy="198" r="18" fill="white"/>
              <circle cx="386" cy="102" r="18" fill="white"/>
            </svg>
          </div>
        </div>

        {/* App name */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Budget</h1>
        <p className="text-base text-gray-500 mb-8">
          แอปติดตามงบประมาณรายเดือนส่วนตัว เชื่อมต่อกับ Google Sheets
          บันทึกรายรับ-รายจ่าย วิเคราะห์แนวโน้ม และสรุปภาพรวมรายปี
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-left">
          {[
            { icon: "ti-wallet", label: "ติดตามรายรับ", desc: "เงินเดือน โบนัส ค่าลดหย่อน" },
            { icon: "ti-chart-bar", label: "วิเคราะห์รายจ่าย", desc: "จัดหมวดหมู่และดู trend" },
            { icon: "ti-table", label: "ข้อมูลใน Sheets", desc: "เก็บใน Google Sheet ของคุณ" },
          ].map((f) => (
            <div key={f.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <i className={`ti ${f.icon} text-[#1D9E75] text-xl block mb-1`} aria-hidden="true" />
              <div className="text-xs font-medium text-gray-800">{f.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-medium transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#fff" opacity=".9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" opacity=".9"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity=".9"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" opacity=".9"/>
          </svg>
          Sign in with Google
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          ต้องใช้บัญชี Google — ข้อมูลเก็บใน Google Sheets ของคุณเท่านั้น
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 flex gap-4 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </footer>
    </main>
  );
}
