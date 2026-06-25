import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { listCategories, renameCategory } from "@/lib/sheets";

export async function GET() {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const categories = await listCategories(accessToken);
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const body = await req.json();
    const { month, oldName, newName } = body;
    if (!month || !oldName || !newName) {
      return NextResponse.json(
        { error: "month, oldName, newName are required" },
        { status: 400 }
      );
    }
    await renameCategory(accessToken, month, String(oldName).trim(), String(newName).trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
