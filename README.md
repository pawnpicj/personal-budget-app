# Personal Monthly Budget

Web app จัดการงบประมาณรายเดือนส่วนตัว เชื่อมต่อ Google Sheets แบบ real-time ผ่าน Google Sheets API (OAuth)

## สถาปัตยกรรม

```
Next.js (App Router) → NextAuth (Google OAuth) → API routes → Google Sheets API → Google Sheet
```

- **1 Google Sheet ไฟล์เดียว** — 1 แท็บต่อเดือน (เช่น `01-2026`, `02-2026`) + แท็บ `_Template` (โครงเปล่าให้ duplicate อัตโนมัติ) + แท็บ `_Settings` (รายชื่อหมวด)
- แต่ละแท็บเดือน: Income (Salary/Bonus/SSO/Balance) + ตาราง Category/Item/Plan/Actual แบบ dynamic + สูตรคำนวณ Total/Difference อัตโนมัติ
- หมวด (Category) แก้ไข/เพิ่มได้จากแอป ไม่ผูกตายตัว

## ฟีเจอร์

- เข้าสู่ระบบด้วย Google (เฉพาะ Bank คนเดียว)
- เพิ่ม/แก้ไข/ลบรายการรับ-จ่ายแต่ละหมวด เขียนกลับ Google Sheet ทันที
- เพิ่ม/เปลี่ยนชื่อหมวดได้เอง
- เลือกเดือน หรือสร้างเดือนใหม่ (duplicate จาก template อัตโนมัติ)
- สรุป Total Actual, Balance, Difference
- กราฟ Budget vs Actual ตามหมวด + กราฟสัดส่วนรายจ่าย (Recharts)
- Responsive รองรับมือถือและเดสก์ท็อป

## เริ่มต้นใช้งาน

ดูขั้นตอนละเอียดใน [`SETUP.md`](./SETUP.md) — ต้องสร้าง Google Cloud Project + OAuth Client ID ก่อน

```bash
cp .env.local.example .env.local   # แล้วกรอกค่าตาม SETUP.md
npm install
npm run dev
```

## โครงสร้างโค้ด

```
app/
  api/sheets/         API routes: month, months, income, item, category
  api/auth/           NextAuth handler
  dashboard/          หน้า dashboard หลัก (client component)
  login/              หน้า login
lib/
  auth.ts             NextAuth config (Google OAuth, token refresh)
  sheets.ts           ฟังก์ชันเรียก Google Sheets API ทั้งหมด
  server-auth.ts      helper ดึง access token ใน API routes
  types.ts            shared types
components/           UI components ทั้งหมด (การ์ด, ฟอร์ม, กราฟ)
```

## หมายเหตุทางเทคนิค

- ใช้ access token ของผู้ใช้เอง (จาก NextAuth) เรียก Sheets API ตรง — ไม่มี service account, เหมาะกับแอปส่วนตัวคนเดียว
- การสร้างเดือนใหม่ = duplicate แท็บ `_Template` ผ่าน `spreadsheets.batchUpdate` แล้ว rename
- ฟอร์มูลา Total/Difference อยู่ในตัว Google Sheet เอง (`SUM`, อ้างอิงเซลล์) เปิดดูตรงใน Sheets ได้โดยไม่ต้องพึ่งแอป
