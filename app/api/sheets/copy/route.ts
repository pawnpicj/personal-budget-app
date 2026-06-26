export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { copyMonthSheet } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const { fromMonth, toMonth } = await req.json();
    if (!fromMonth || !toMonth) {
      return NextResponse.json({ error: "fromMonth and toMonth are required" }, { status: 400 });
    }
    await copyMonthSheet(accessToken, fromMonth, toMonth);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
