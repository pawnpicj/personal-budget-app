import { NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { listMonths } from "@/lib/sheets";

export async function GET() {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const months = await listMonths(accessToken);
    return NextResponse.json({ months });
  } catch (err) {
    return handleApiError(err);
  }
}
