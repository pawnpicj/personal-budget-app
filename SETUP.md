# คู่มือ Setup — Personal Monthly Budget

ทำตามลำดับนี้ ใช้เวลาประมาณ 10-15 นาที

## 1. สร้าง Google Sheet จาก template

1. เปิด [Google Sheets](https://sheets.google.com) → File → Import → Upload
2. อัปโหลดไฟล์ `Personal_Monthly_Budget_Template.xlsx`
3. เลือก "Insert new sheet(s)" ตอน import
4. คัดลอก Spreadsheet ID จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_อยู่ตรงนี้/edit
   ```
   เก็บค่านี้ไว้ใส่ใน `.env.local` (ตัวแปร `SHEET_ID`)

## 2. สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. คลิก dropdown โปรเจกต์ด้านบน → **New Project**
3. ตั้งชื่อ เช่น `personal-budget-app` → Create

## 3. เปิดใช้งาน Google Sheets API

1. ในโปรเจกต์ที่สร้าง ไปที่ **APIs & Services → Library**
2. ค้นหา "Google Sheets API" → คลิก **Enable**

## 4. สร้าง OAuth Consent Screen

1. ไปที่ **APIs & Services → OAuth consent screen**
2. User Type เลือก **External** (เพราะ Personal Gmail) → Create
3. App name: `Personal Monthly Budget`, User support email: อีเมลของ Bank, Developer contact: อีเมลของ Bank → Save and Continue
4. Scopes: คลิก **Add or Remove Scopes** → ค้นหาและติ๊ก `.../auth/spreadsheets` → Update → Save and Continue
5. Test users: เพิ่มอีเมล Gmail ของ Bank เอง (จำเป็นเพราะแอปยังเป็น "Testing" mode) → Save and Continue

## 5. สร้าง OAuth Client ID

1. ไปที่ **APIs & Services → Credentials**
2. คลิก **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `personal-budget-web`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (สำหรับ dev)
   - `https://YOUR-APP.vercel.app` (เพิ่มทีหลังหลัง deploy)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-APP.vercel.app/api/auth/callback/google` (เพิ่มทีหลัง)
7. Create → คัดลอก **Client ID** และ **Client Secret**

## 6. ตั้งค่า Environment Variables

คัดลอก `.env.local.example` เป็น `.env.local` แล้วกรอก:

```
GOOGLE_CLIENT_ID=<จากขั้นตอน 5>
GOOGLE_CLIENT_SECRET=<จากขั้นตอน 5>
NEXTAUTH_SECRET=<รันคำสั่ง: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
SHEET_ID=<จากขั้นตอน 1>
```

## 7. รันโปรเจกต์

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 แล้ว login ด้วย Google (ใช้อีเมลเดียวกับที่เพิ่มใน Test users ขั้นตอน 4.5)

## 8. Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub repo
2. ไปที่ [vercel.com](https://vercel.com) → Import Project → เลือก repo
3. ใส่ Environment Variables เดียวกับ `.env.local` (เปลี่ยน `NEXTAUTH_URL` เป็น URL จริงของ Vercel)
4. Deploy
5. กลับไปที่ Google Cloud Console → Credentials → แก้ไข OAuth Client → เพิ่ม URL ของ Vercel ใน Authorized origins/redirect URIs (ขั้นตอน 5.5-5.6)

## หมายเหตุ

- แอปนี้ใช้ access token ของ Bank เองเรียก Sheets API ตรง ๆ (ไม่มี service account) ดังนั้น **เฉพาะ Bank เท่านั้น** ที่ login แล้วเขียนข้อมูลได้ ตรงกับโจทย์ใช้คนเดียว
- ถ้า refresh token หมดอายุ (ไม่ login นานเกิน 6 เดือน) ให้ logout แล้ว login ใหม่
- แอปยังอยู่ใน "Testing" mode ของ Google OAuth — ใช้งานได้ปกติสำหรับ Bank คนเดียว ไม่ต้องส่ง verify กับ Google (verify จำเป็นเฉพาะถ้าจะเปิดให้คนอื่นใช้)
