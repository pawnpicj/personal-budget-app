import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { updateIncome } from "@/lib/sheets";

export async function PUT(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const body = await req.json();
    const { month, salary, bonus, sso, other } = body;
    if (!month) {
      return NextResponse.json({ error: "month is required" }, { status: 400 });
    }
    await updateIncome(accessToken, month, {
      salary: Number(salary) || 0,
      bonus: Number(bonus) || 0,
      sso: Number(sso) || 0,
      other: Number(other) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
