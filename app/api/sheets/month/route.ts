export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { getMonthData, deleteMonthSheet, hideMonthSheet } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const month = req.nextUrl.searchParams.get("month");
    if (!month) {
      return NextResponse.json({ error: "month query param is required" }, { status: 400 });
    }
    const data = await getMonthData(accessToken, month);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const { month } = await req.json();
    if (!month) return NextResponse.json({ error: "month is required" }, { status: 400 });
    await hideMonthSheet(accessToken, month);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const month = req.nextUrl.searchParams.get("month");
    if (!month) {
      return NextResponse.json({ error: "month query param is required" }, { status: 400 });
    }
    await deleteMonthSheet(accessToken, month);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
