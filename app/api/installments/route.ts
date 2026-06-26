export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import {
  listInstallmentPlans,
  getInstallmentPlan,
  createInstallmentPlan,
  updateInstallmentRow,
  deleteInstallmentPlan,
} from "@/lib/sheets";

// GET ?plan=NAME → get plan rows; GET (no plan) → list plan names
export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenOrThrow();
    const plan = req.nextUrl.searchParams.get("plan");
    if (plan) {
      const data = await getInstallmentPlan(token, plan);
      return NextResponse.json(data);
    }
    const plans = await listInstallmentPlans(token);
    return NextResponse.json({ plans });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST → create plan { planName, monthlyAmount, count, startMonth }
export async function POST(req: NextRequest) {
  try {
    const token = await getAccessTokenOrThrow();
    const { planName, monthlyAmount, count, startMonth } = await req.json();
    if (!planName || !monthlyAmount || !count || !startMonth) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await createInstallmentPlan(token, planName, monthlyAmount, count, startMonth);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT → mark paid { rowIndex, paid, actualAmount, paidDate }
export async function PUT(req: NextRequest) {
  try {
    const token = await getAccessTokenOrThrow();
    const { rowIndex, paid, actualAmount, paidDate } = await req.json();
    await updateInstallmentRow(token, rowIndex, paid, actualAmount ?? 0, paidDate ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE ?plan=NAME → delete plan
export async function DELETE(req: NextRequest) {
  try {
    const token = await getAccessTokenOrThrow();
    const plan = req.nextUrl.searchParams.get("plan");
    if (!plan) return NextResponse.json({ error: "plan required" }, { status: 400 });
    await deleteInstallmentPlan(token, plan);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
