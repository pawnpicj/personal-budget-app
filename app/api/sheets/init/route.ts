export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { initializeSpreadsheet } from "@/lib/sheets";

export async function POST() {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const result = await initializeSpreadsheet(accessToken);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
