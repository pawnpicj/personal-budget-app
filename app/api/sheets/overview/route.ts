import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getYearlySummary } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? String(new Date().getFullYear());

  try {
    const summary = await getYearlySummary(session.accessToken as string, year);
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
