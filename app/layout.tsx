import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Personal Monthly Budget",
  description: "งบประมาณรายเดือนส่วนตัว เชื่อมต่อ Google Sheets",
  verification: {
    google: "E9CRxkK4VQKnv3rvHKF_ynrSuRh32OvUGkOGqP0Mpwg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.33.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
